import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { EdgeType, ArgumentAttackSubtype, DebateEdgeKind } from "@prisma/client";

// ============================================================================
// TYPE MAPPING
// ============================================================================

function mapEdgeType(
  edgeType: EdgeType,
  attackSubtype: ArgumentAttackSubtype | null,
  targetScope: string | null
): { kind: DebateEdgeKind; attackSubtype: ArgumentAttackSubtype | null } {
  // If explicit attackSubtype exists, use it
  if (attackSubtype) {
    if (attackSubtype === 'UNDERCUT') {
      return { kind: 'undercuts', attackSubtype: 'UNDERCUT' };
    }
    if (attackSubtype === 'REBUT') {
      return { kind: 'rebuts', attackSubtype: 'REBUT' };
    }
    if (attackSubtype === 'UNDERMINE') {
      return { kind: 'objects', attackSubtype: 'UNDERMINE' };
    }
  }

  // Map by EdgeType
  if (edgeType === 'undercut_inference') {
    return { kind: 'undercuts', attackSubtype: 'UNDERCUT' };
  }

  if (edgeType === 'undermine_premise') {
    return { kind: 'objects', attackSubtype: 'UNDERMINE' };
  }

  if (edgeType === 'support') {
    return { kind: 'supports', attackSubtype: null };
  }

  if (edgeType === 'clarifies' || edgeType === 'restates') {
    return { kind: edgeType, attackSubtype: null };
  }

  // Default: rebut for any attack type
  if (edgeType === 'rebut') {
    return { kind: 'rebuts', attackSubtype: attackSubtype || 'REBUT' };
  }

  // Fallback
  return { kind: 'rebuts', attackSubtype: null };
}

// ============================================================================
// METADATA COMPUTATION
// ============================================================================

async function computeSchemeInfo(argumentId: string): Promise<{ key: string | null; name: string | null }> {
  const arg = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: { scheme: { select: { key: true, name: true } } }
  });
  return arg?.scheme
    ? { key: arg.scheme.key, name: arg.scheme.name }
    : { key: null, name: null };
}

async function computeCQStatus(argumentId: string): Promise<{ open: number; answered: number }> {
  const allCQs = await prisma.cQStatus.findMany({
    where: { argumentId },
    select: { status: true }
  });

  const open = allCQs.filter(cq => cq.status !== 'answered').length;
  const answered = allCQs.filter(cq => cq.status === 'answered').length;

  return { open, answered };
}

async function computeAttackCounts(argumentId: string): Promise<number> {
  const conflictNodes = await prisma.aIFNode.count({
    where: {
      type: 'CA',
      claimId: {
        in: await prisma.argument
          .findUnique({ where: { id: argumentId }, select: { claimId: true } })
          .then(arg => (arg?.claimId ? [arg.claimId] : []))
      }
    }
  });

  return conflictNodes;
}

async function computePreferences(argumentId: string): Promise<{ preferredBy: number; dispreferredBy: number }> {
  const prefs = await prisma.preferenceApplication.findMany({
    where: {
      OR: [
        { preferredArgumentId: argumentId },
        { dispreferredArgumentId: argumentId }
      ]
    },
    select: {
      preferredArgumentId: true,
      dispreferredArgumentId: true
    }
  });

  const preferredBy = prefs.filter(p => p.preferredArgumentId === argumentId).length;
  const dispreferredBy = prefs.filter(p => p.dispreferredArgumentId === argumentId).length;

  return { preferredBy, dispreferredBy };
}

async function computeToulminDepth(argumentId: string): Promise<number> {
  const diagram = await prisma.argument.findUnique({
    where: { id: argumentId },
    select: {
      diagram: {
        select: {
          inferences: {
            select: {
              id: true,
              premises: {
                select: {
                  statement: {
                    select: { id: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!diagram?.diagram?.inferences) return 0;

  const inferences = diagram.diagram.inferences;
  let maxDepth = 0;

  function findDepth(inferenceId: string, visited: Set<string> = new Set()): number {
    if (visited.has(inferenceId)) return 0;
    visited.add(inferenceId);

    const inference = inferences.find(inf => inf.id === inferenceId);
    if (!inference) return 0;

    let depth = 1;
    for (const premise of inference.premises) {
      const premiseInf = inferences.find(inf =>
        inf.premises.some(p => p.statement.id === premise.statement.id)
      );
      if (premiseInf) {
        depth = Math.max(depth, 1 + findDepth(premiseInf.id, visited));
      }
    }
    return depth;
  }

  for (const inference of inferences) {
    maxDepth = Math.max(maxDepth, findDepth(inference.id));
  }

  return maxDepth;
}

// ============================================================================
// GENERATION ENDPOINT
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { deliberationId } = body;

    if (!deliberationId) {
      return NextResponse.json({ error: "Missing deliberationId" }, { status: 400 });
    }

    console.log(`\n📊 Processing deliberation: ${deliberationId}`);

    // Step 1: Find or verify synthetic DebateSheet exists
    const sheetId = `delib:${deliberationId}`;
    const existingSheet = await prisma.debateSheet.findUnique({
      where: { id: sheetId },
      select: { id: true, title: true }
    });

    if (!existingSheet) {
      return NextResponse.json(
        { error: `No DebateSheet found for deliberation ${deliberationId}` },
        { status: 404 }
      );
    }

    console.log(`  ✅ Found sheet: ${existingSheet.title}`);

    // Step 2: Fetch all arguments in deliberation
    const args = await prisma.argument.findMany({
      where: { deliberationId },
      select: {
        id: true,
        claimId: true,
        authorId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`  📝 Found ${args.length} arguments`);

    if (args.length === 0) {
      return NextResponse.json(
        { warning: "No arguments to generate nodes from" },
        { status: 200 }
      );
    }

    let nodesCreated = 0;
    let edgesCreated = 0;

    // Step 3: Create DebateNodes
    console.log(`  🔨 Step 3: Creating DebateNodes...`);

    for (const arg of args) {
      const nodeId = `node:${arg.id}`;

      const existingNode = await prisma.debateNode.findUnique({
        where: { id: nodeId },
        select: { id: true }
      });

      if (existingNode) {
        console.log(`    ⏭️  Node already exists: ${nodeId.slice(5, 13)}`);
        continue;
      }

      const claim = await prisma.claim.findUnique({
        where: { id: arg.claimId },
        select: { text: true }
      });

      const scheme = await computeSchemeInfo(arg.id);
      const cqStatus = await computeCQStatus(arg.id);
      const conflictCount = await computeAttackCounts(arg.id);
      const preferences = await computePreferences(arg.id);
      const toulminDepth = await computeToulminDepth(arg.id);

      await prisma.debateNode.create({
        data: {
          id: nodeId,
          sheetId,
          title: claim?.text.slice(0, 100) || "Untitled",
          summary: claim?.text,
          argumentId: arg.id,
          claimId: arg.claimId,
          authorsJson: [arg.authorId],
          createdAt: arg.createdAt
        }
      });

      nodesCreated++;
      console.log(`    ✅ Created node: ${nodeId.slice(5, 13)} (scheme: ${scheme.key || 'none'}, CQs: ${cqStatus.open}/${cqStatus.open + cqStatus.answered}, conflicts: ${conflictCount})`);
    }

    // Step 4: Create DebateEdges from ArgumentEdge
    console.log(`  🔗 Step 4: Creating DebateEdges...`);

    const edges = await prisma.argumentEdge.findMany({
      where: {
        OR: [
          { fromArgumentId: { in: args.map(a => a.id) } },
          { toArgumentId: { in: args.map(a => a.id) } }
        ]
      },
      select: {
        fromArgumentId: true,
        toArgumentId: true,
        type: true,
        attackSubtype: true,
        targetScope: true,
        cqKey: true,
        createdAt: true
      }
    });

    console.log(`    Found ${edges.length} edges to create`);

    for (const edge of edges) {
      const fromNodeId = `node:${edge.fromArgumentId}`;
      const toNodeId = `node:${edge.toArgumentId}`;

      const existingEdge = await prisma.debateEdge.findFirst({
        where: {
          sheetId,
          fromId: fromNodeId,
          toId: toNodeId
        }
      });

      if (existingEdge) {
        console.log(`    ⏭️  Edge already exists: ${fromNodeId.slice(5, 13)} → ${toNodeId.slice(5, 13)}`);
        continue;
      }

      const { kind, attackSubtype } = mapEdgeType(
        edge.type as EdgeType,
        edge.attackSubtype as ArgumentAttackSubtype | null,
        edge.targetScope
      );

      let schemeKey: string | null = null;
      if (edge.fromArgumentId) {
        const argScheme = await prisma.argument.findUnique({
          where: { id: edge.fromArgumentId },
          select: { scheme: { select: { key: true } } }
        });
        schemeKey = argScheme?.scheme?.key || null;
      }

      const edgeData = {
        sheetId,
        fromId: fromNodeId,
        toId: toNodeId,
        kind,
        attackSubtype,
        schemeKey,
        cqKey: edge.cqKey,
        createdAt: edge.createdAt
      };

      try {
        await prisma.debateEdge.create({ data: edgeData });
        edgesCreated++;
        console.log(`    ✅ Created edge ${kind} (${attackSubtype || 'N/A'}): ${edge.fromArgumentId.slice(0, 8)} → ${edge.toArgumentId.slice(0, 8)}`);
      } catch (err: any) {
        if (err.code === 'P2002') {
          console.log(`    ⏭️  Edge already exists (duplicate): ${edge.fromArgumentId.slice(0, 8)} → ${edge.toArgumentId.slice(0, 8)}`);
        } else {
          throw err;
        }
      }
    }

    // Step 5: Populate UnresolvedCQ table with open CQs
    console.log(`  🔍 Step 5: Populating UnresolvedCQ records...`);

    const openCQs = await prisma.cQStatus.findMany({
      where: {
        argumentId: {
          in: args.map(arg => arg.id)
        },
        status: { not: 'answered' }
      },
      select: {
        id: true,
        argumentId: true,
        cqKey: true,
        status: true
      }
    });

    console.log(`    Found ${openCQs.length} open CQs across all arguments`);

    let unresolvedCreated = 0;

    for (const cqStatus of openCQs) {
      const nodeId = `node:${cqStatus.argumentId}`;

      const existing = await prisma.unresolvedCQ.findFirst({
        where: {
          sheetId,
          nodeId,
          cqKey: cqStatus.cqKey
        }
      });

      if (existing) {
        console.log(`    ⏭️  UnresolvedCQ already exists for CQ ${cqStatus.cqKey} on node ${nodeId.slice(5, 13)}`);
        continue;
      }

      await prisma.unresolvedCQ.create({
        data: {
          sheetId,
          nodeId,
          cqKey: cqStatus.cqKey
        }
      });
      unresolvedCreated++;
      console.log(`    ✅ Created UnresolvedCQ for ${cqStatus.cqKey} (${cqStatus.status || 'open'})`);
    }

    // Step 6: Update sheet timestamp
    await prisma.debateSheet.update({
      where: { id: sheetId },
      data: { updatedAt: new Date() }
    });

    console.log(`  ✅ Sheet generation complete`);

    return NextResponse.json({
      success: true,
      sheetId,
      stats: {
        nodesCreated,
        edgesCreated,
        unresolvedCreated
      }
    });

  } catch (err: any) {
    console.error("❌ Error generating debate sheet:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
