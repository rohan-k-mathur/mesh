import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

// cohorts: 'all' always available; 'authors' uses argument.authorId; 'members' optional if you have a RoomMembers table (falls back to 'all').
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;
  const url = new URL(req.url);
  const rows = Math.max(1, Math.min(20, Number(url.searchParams.get('rows') ?? 6)));
  const cohortsParam = (url.searchParams.get('cohorts') ?? 'all,authors')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // gather arguments & approvals
  const [args, approvals] = await Promise.all([
    prisma.argument.findMany({
      where: { deliberationId },
      select: { id: true, text: true, authorId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.argumentApproval.findMany({
      where: { deliberationId },
      select: { userId: true, argumentId: true },
    }),
  ]);

  // top N by total approvals
  const countMap = new Map<string, number>();
  for (const a of approvals) countMap.set(a.argumentId, (countMap.get(a.argumentId) ?? 0) + 1);
  const ranked = [...args].sort((a, b) => (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0)).slice(0, rows);

  // cohorts
  const authors = new Set(ranked.map(a => a.authorId));
  // if you have room members: const members = new Set((await prisma.roomMembers.findMany({ where: { roomId }, select: { userId: true } })).map(m=>m.userId));
  const voters = new Set(approvals.map(a => a.userId));

  const cohorts: { key: string; users: Set<string> }[] = [];
  for (const k of cohortsParam) {
    if (k === 'authors') cohorts.push({ key: 'authors', users: authors });
    else if (k === 'all') cohorts.push({ key: 'all', users: voters });
    // else if (k === 'members') cohorts.push({ key: 'members', users: members });
  }
  if (!cohorts.length) cohorts.push({ key: 'all', users: voters });

  // build heat: percentage approvals within cohort for each argument
  const argToApprovers = new Map<string, Set<string>>();
  for (const a of approvals) {
    if (!argToApprovers.has(a.argumentId)) argToApprovers.set(a.argumentId, new Set());
    argToApprovers.get(a.argumentId)!.add(a.userId);
  }

  const columns = cohorts.map(c => c.key);
  const data = ranked.map(r => {
    const approvers = argToApprovers.get(r.id) ?? new Set<string>();
    const row: Record<string, number> = {};
    for (const c of cohorts) {
      const cohortSize = Math.max(1, c.users.size);
      const approvedInCohort = [...approvers].filter(u => c.users.has(u)).length;
      row[c.key] = approvedInCohort / cohortSize;
    }
    return { id: r.id, text: r.text, columns: row };
  });

  return NextResponse.json({ columns, rows: data });
}
