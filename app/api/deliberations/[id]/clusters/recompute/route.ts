import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

/** Simple label propagation clustering over a bipartite graph (users ↔ arguments they approved) */
export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const deliberationId = params.id;

  const approvals = await prisma.argumentApproval.findMany({
    where: { deliberationId },
    select: { userId: true, argumentId: true }
  });

  // Build adjacency
  const userNeighbors = new Map<string, Set<string>>();
  const argNeighbors  = new Map<string, Set<string>>();
  for (const a of approvals) {
    if (!userNeighbors.has(a.userId)) userNeighbors.set(a.userId, new Set());
    if (!argNeighbors.has(a.argumentId)) argNeighbors.set(a.argumentId, new Set());
    userNeighbors.get(a.userId)!.add(a.argumentId);
    argNeighbors.get(a.argumentId)!.add(a.userId);
  }

  // Initialize labels to self ids
  const labelsU = new Map<string, string>();
  const labelsA = new Map<string, string>();
  for (const u of userNeighbors.keys()) labelsU.set(u, `U:${u}`);
  for (const a of argNeighbors.keys())  labelsA.set(a, `A:${a}`);

  // Iterate
  const ITER = 8;
  for (let t = 0; t < ITER; t++) {
    for (const [u, neigh] of userNeighbors) {
      const freq: Record<string, number> = {};
      for (const arg of neigh) {
        const lab = labelsA.get(arg)!;
        freq[lab] = (freq[lab] ?? 0) + 1;
      }
      const best = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? labelsU.get(u)!;
      labelsU.set(u, best);
    }
    for (const [a, neigh] of argNeighbors) {
      const freq: Record<string, number> = {};
      for (const u of neigh) {
        const lab = labelsU.get(u)!;
        freq[lab] = (freq[lab] ?? 0) + 1;
      }
      const best = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? labelsA.get(a)!;
      labelsA.set(a, best);
    }
  }

  // Group
  const clusterKeyToMembers = new Map<string, { users: string[], args: string[] }>();
  for (const [u, k] of labelsU) {
    if (!clusterKeyToMembers.has(k)) clusterKeyToMembers.set(k, { users: [], args: [] });
    clusterKeyToMembers.get(k)!.users.push(u);
  }
  for (const [a, k] of labelsA) {
    if (!clusterKeyToMembers.has(k)) clusterKeyToMembers.set(k, { users: [], args: [] });
    clusterKeyToMembers.get(k)!.args.push(a);
  }

  // Upsert Cluster rows (wipe previous affinity clusters for this deliberation)
  await prisma.$transaction(async (tx) => {
    const old = await tx.cluster.findMany({ where: { deliberationId, type: 'affinity' } });
    if (old.length) {
      const ids = old.map(c => c.id);
      await tx.userCluster.deleteMany({ where: { clusterId: { in: ids } } });
      await tx.argumentCluster.deleteMany({ where: { clusterId: { in: ids } } });
      await tx.cluster.deleteMany({ where: { id: { in: ids } } });
    }

    for (const [key, members] of clusterKeyToMembers) {
      const label = `C${key.slice(-4)}`;
      const c = await tx.cluster.create({ data: { deliberationId, type: 'affinity', label } });
      if (members.users.length) {
        await tx.userCluster.createMany({
          data: members.users.map(u => ({ clusterId: c.id, userId: u, score: 1 })),
          skipDuplicates: true
        });
      }
      if (members.args.length) {
        await tx.argumentCluster.createMany({
          data: members.args.map(a => ({ clusterId: c.id, argumentId: a, score: 1 })),
          skipDuplicates: true
        });
      }
    }
  });

  return NextResponse.json({ ok: true, clusters: clusterKeyToMembers.size });
}
