// app/api/deliberations/[id]/ceg/mini/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ClaimNode = {
  id: string;
  text: string;
  label: 'IN' | 'OUT' | 'UNDEC';
  confidence: number;
  supportStrength: number;
  attackStrength: number;
  netStrength: number;
  inDegree: number;
  outDegree: number;
  centrality: number;
  isControversial: boolean;
  clusterId?: number;
};

type EdgeData = {
  id: string;
  source: string;
  target: string;
  type: 'supports' | 'rebuts' | 'undercuts';
  attackType?: 'SUPPORTS' | 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES';
  confidence: number;
  targetScope?: 'premise' | 'inference' | 'conclusion' | null;
};

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const deliberationId = params.id;

  try {
    // 1. Get all claims with approval counts
    const claims = await prisma.claim.findMany({
      where: { deliberationId },
      select: {
        id: true,
        text: true,
      },
    });

    const claimIds = claims.map(c => c.id);
    
    if (claimIds.length === 0) {
      return NextResponse.json({
        supportWeighted: 0,
        counterWeighted: 0,
        supportPct: 0,
        counterPct: 0,
        inClaims: 0,
        outClaims: 0,
        undecClaims: 0,
        totalClaims: 0,
        totalEdges: 0,
        clusterCount: 0,
        controversialCount: 0,
        hubCount: 0,
        isolatedCount: 0,
        nodes: [],
        edges: [],
        hubs: [],
        isolated: [],
        controversial: [],
        timestamp: new Date().toISOString(),
      }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    // 2. Get grounded semantics labels from ClaimLabel table
    const claimLabels = await prisma.claimLabel.findMany({
      where: { 
        deliberationId,
        claimId: { in: claimIds },
      },
      select: {
        claimId: true,
        label: true,
      },
    });

    const labelMap = new Map<string, 'IN' | 'OUT' | 'UNDEC'>(
      claimLabels.map(cl => [cl.claimId, cl.label as 'IN' | 'OUT' | 'UNDEC'])
    );

    // 3. Get all ClaimEdges
    const claimEdges = await prisma.claimEdge.findMany({
      where: { deliberationId },
      select: {
        id: true,
        fromClaimId: true,
        toClaimId: true,
        type: true,
        attackType: true,
        targetScope: true,
      },
    });

    // 4. Build claim-level graph structure
    const edges: EdgeData[] = [];
    const claimInDegree = new Map<string, number>();
    const claimOutDegree = new Map<string, number>();
    const claimSupportStrength = new Map<string, number>();
    const claimAttackStrength = new Map<string, number>();

    claims.forEach(c => {
      claimInDegree.set(c.id, 0);
      claimOutDegree.set(c.id, 0);
      claimSupportStrength.set(c.id, 0);
      claimAttackStrength.set(c.id, 0);
    });

    // Process edges
    for (const edge of claimEdges) {
      // Filter out self-loops
      if (edge.fromClaimId === edge.toClaimId) continue;

      const conf = 0.7; // Default confidence (can be enhanced later)
      
      // Determine edge type
      let edgeType: 'supports' | 'rebuts' | 'undercuts';
      if (edge.type === 'supports') {
        edgeType = 'supports';
      } else if (edge.attackType === 'UNDERCUTS') {
        edgeType = 'undercuts';
      } else {
        edgeType = 'rebuts';
      }
      
      edges.push({
        id: edge.id,
        source: edge.fromClaimId,
        target: edge.toClaimId,
        type: edgeType,
        attackType: edge.attackType ?? undefined,
        confidence: conf,
        targetScope: edge.targetScope,
      });

      // Update degrees
      claimOutDegree.set(
        edge.fromClaimId,
        (claimOutDegree.get(edge.fromClaimId) ?? 0) + 1
      );
      claimInDegree.set(
        edge.toClaimId,
        (claimInDegree.get(edge.toClaimId) ?? 0) + 1
      );

      // Update strengths
      if (edgeType === 'supports') {
        claimSupportStrength.set(
          edge.toClaimId,
          (claimSupportStrength.get(edge.toClaimId) ?? 0) + conf
        );
      } else {
        claimAttackStrength.set(
          edge.toClaimId,
          (claimAttackStrength.get(edge.toClaimId) ?? 0) + conf
        );
      }
    }

    // 5. Detect controversial claims (high bidirectional activity)
    const detectControversial = (
      claimId: string,
      supportStr: number,
      attackStr: number
    ): boolean => {
      const total = supportStr + attackStr;
      if (total < 1.5) return false; // Not enough activity
      
      const balance = Math.abs(supportStr - attackStr) / total;
      return balance < 0.4; // Roughly balanced = controversial
    };

    // 6. Simple clustering based on connectivity (connected components)
    const computeClusters = (
      claimIds: string[],
      edges: EdgeData[]
    ): Map<string, number> => {
      const clusters = new Map<string, number>();
      const visited = new Set<string>();
      let clusterId = 0;

      const adjacency = new Map<string, Set<string>>();
      claimIds.forEach(id => adjacency.set(id, new Set()));
      
      edges.forEach(e => {
        adjacency.get(e.source)?.add(e.target);
        adjacency.get(e.target)?.add(e.source);
      });

      const dfs = (nodeId: string, cid: number) => {
        visited.add(nodeId);
        clusters.set(nodeId, cid);
        adjacency.get(nodeId)?.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            dfs(neighbor, cid);
          }
        });
      };

      claimIds.forEach(id => {
        if (!visited.has(id)) {
          dfs(id, clusterId++);
        }
      });

      return clusters;
    };

    const clusterMap = computeClusters(claimIds, edges);

    // 7. Compute centrality (simplified degree centrality)
    const maxDegree = Math.max(
      ...claimIds.map(id => 
        (claimInDegree.get(id) ?? 0) + (claimOutDegree.get(id) ?? 0)
      ),
      1
    );

    // 8. Build enriched node data
    const nodes: ClaimNode[] = claims.map(c => {
      const supportStr = claimSupportStrength.get(c.id) ?? 0;
      const attackStr = claimAttackStrength.get(c.id) ?? 0;
      const netStr = supportStr - attackStr;
      const inDeg = claimInDegree.get(c.id) ?? 0;
      const outDeg = claimOutDegree.get(c.id) ?? 0;
      const centrality = (inDeg + outDeg) / maxDegree;

      return {
        id: c.id,
        text: c.text,
        label: labelMap.get(c.id) ?? 'UNDEC',
        confidence: 0.7,
        supportStrength: +supportStr.toFixed(2),
        attackStrength: +attackStr.toFixed(2),
        netStrength: +netStr.toFixed(2),
        inDegree: inDeg,
        outDegree: outDeg,
        centrality: +centrality.toFixed(2),
        isControversial: detectControversial(c.id, supportStr, attackStr),
        clusterId: clusterMap.get(c.id),
      };
    });

    // 9. Aggregate statistics
    const totalSupport = Array.from(claimSupportStrength.values())
      .reduce((sum, v) => sum + v, 0);
    const totalAttack = Array.from(claimAttackStrength.values())
      .reduce((sum, v) => sum + v, 0);
    const total = totalSupport + totalAttack || 1;

    const inCount = nodes.filter(n => n.label === 'IN').length;
    const outCount = nodes.filter(n => n.label === 'OUT').length;
    const undecCount = nodes.filter(n => n.label === 'UNDEC').length;
    const controversialCount = nodes.filter(n => n.isControversial).length;
    const clusterCount = new Set(clusterMap.values()).size;

    // 10. Identify hub claims and isolated claims
    const hubThreshold = 0.6;
    const hubs = nodes.filter(n => n.centrality >= hubThreshold)
      .sort((a, b) => b.centrality - a.centrality)
      .slice(0, 5)
      .map(n => ({ 
        id: n.id, 
        text: n.text.substring(0, 60), 
        centrality: n.centrality 
      }));

    const isolated = nodes.filter(n => n.inDegree === 0 && n.outDegree === 0)
      .map(n => ({ id: n.id, text: n.text.substring(0, 60) }));

    const controversial = nodes
      .filter(n => n.isControversial)
      .slice(0, 3)
      .map(n => ({ id: n.id, text: n.text.substring(0, 60) }));

    return NextResponse.json({
      // Aggregate stats
      supportWeighted: +totalSupport.toFixed(2),
      counterWeighted: +totalAttack.toFixed(2),
      supportPct: +(totalSupport / total).toFixed(4),
      counterPct: +(totalAttack / total).toFixed(4),
      
      // Semantic counts
      inClaims: inCount,
      outClaims: outCount,
      undecClaims: undecCount,
      
      // Graph metrics
      totalClaims: nodes.length,
      totalEdges: edges.length,
      clusterCount,
      controversialCount,
      hubCount: hubs.length,
      isolatedCount: isolated.length,
      
      // Rich node data
      nodes,
      edges,
      
      // Highlights
      hubs,
      isolated,
      controversial,
      
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });

  } catch (error) {
    console.error('Failed to compute enhanced CEG mini stats:', error);
    return NextResponse.json(
      { error: 'Failed to compute statistics' },
      { status: 500 }
    );
  }
}