import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

// Per-target WHY→(GROUNDS|RETRACT|CONCEDE) stats
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const moves = await prisma.dialogueMove.findMany({
    where: { deliberationId: params.id },
    orderBy: { createdAt: 'asc' },
    select: { id:true, targetType:true, targetId:true, kind:true, payload:true, createdAt:true }
  }); // DialogueMove model: kind 'WHY'|'GROUNDS'|'RETRACT' etc. :contentReference[oaicite:1]{index=1}

  const byTarget = new Map<string, typeof moves>();
  for (const m of moves) {
    if (!m.targetType || !m.targetId) continue;
    const k = `${m.targetType}:${m.targetId}`;
    (byTarget.get(k) ?? byTarget.set(k, []).get(k)!).push(m);
  }

  const stats: Record<string, {
    openWhy: number; resolved: number; avgHoursToGrounds: number | null;
    lastWhyAt?: string; lastResponseAt?: string; dialScore: number;
  }> = {};

  for (const [k, list] of byTarget) {
    list.sort((a,b)=>+a.createdAt - +b.createdAt);
    let openStack:any[] = [];
    let resolved = 0;
    const latencies:number[] = [];
    let lastWhyAt:string|undefined, lastRespAt:string|undefined;

    for (const m of list) {
      if (m.kind === 'WHY') { openStack.push(m); lastWhyAt = m.createdAt.toISOString(); }
      if (m.kind === 'GROUNDS' || m.kind === 'RETRACT' || (m.kind === 'ASSERT' && (m.payload as any)?.as === 'CONCEDE')) {
        const w = openStack.pop();
        lastRespAt = m.createdAt.toISOString();
        if (w) {
          resolved++;
          latencies.push((+m.createdAt - +w.createdAt) / 36e5);
        }
      }
    }
    const openWhy = openStack.length;
    const avg = latencies.length ? (latencies.reduce((a,b)=>a+b,0)/latencies.length) : null;
    const dialScore = resolved / Math.max(1, resolved + openWhy);

    stats[k] = {
      openWhy, resolved, avgHoursToGrounds: avg ? Number(avg.toFixed(2)) : null,
      lastWhyAt, lastResponseAt: lastRespAt, dialScore: Number(dialScore.toFixed(3))
    };
  }
  return NextResponse.json({ ok:true, stats, now: new Date().toISOString() });
}
