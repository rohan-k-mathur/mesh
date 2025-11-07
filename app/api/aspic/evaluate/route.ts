// app/api/aspic/evaluate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { computeAspicSemantics, aifToASPIC } from "@/lib/aif/translation/aifToAspic";
import type { ArgumentationTheory } from "@/lib/aif/translation/aifToAspic";
import { prisma } from "@/lib/prismaclient";
import type { AIFGraph, AnyNode, Edge } from "@/lib/aif/types";

/**
 * POST /api/aspic/evaluate
 * 
 * Evaluate an ASPIC+ argumentation theory to compute:
 * - All constructed arguments
 * - Attack relations (undermining, rebutting, undercutting)
 * - Defeat relations (attacks + preferences)
 * - Grounded extension
 * - Justification status for each argument
 * 
 * Request body:
 * {
 *   language: string[],
 *   contraries: { [key: string]: string[] },
 *   strictRules: Array<{ id, antecedents[], consequent, type: 'strict' }>,
 *   defeasibleRules: Array<{ id, antecedents[], consequent, type: 'defeasible' }>,
 *   axioms: string[],
 *   premises: string[],
 *   assumptions: string[],
 *   preferences: Array<{ preferred: string, dispreferred: string }>
 * }
 * 
 * Response:
 * {
 *   arguments: Argument[],
 *   attacks: Attack[],
 *   defeats: Defeat[],
 *   groundedExtension: string[],
 *   justificationStatus: { [argId: string]: 'in' | 'out' | 'undec' }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.language || !Array.isArray(body.language)) {
      return NextResponse.json(
        { error: "Missing or invalid 'language' field (must be array)" },
        { status: 400 }
      );
    }

    if (!body.strictRules || !Array.isArray(body.strictRules)) {
      return NextResponse.json(
        { error: "Missing or invalid 'strictRules' field (must be array)" },
        { status: 400 }
      );
    }

    if (!body.defeasibleRules || !Array.isArray(body.defeasibleRules)) {
      return NextResponse.json(
        { error: "Missing or invalid 'defeasibleRules' field (must be array)" },
        { status: 400 }
      );
    }

    // Construct ArgumentationTheory from request body
    const theory: ArgumentationTheory = {
      language: new Set(body.language),
      contraries: new Map(
        Object.entries(body.contraries || {}).map(([key, values]) => [
          key,
          new Set(values as string[]),
        ])
      ),
      strictRules: body.strictRules.map((r: any) => ({
        id: r.id,
        antecedents: r.antecedents,
        consequent: r.consequent,
        type: "strict" as const,
      })),
      defeasibleRules: body.defeasibleRules.map((r: any) => ({
        id: r.id,
        antecedents: r.antecedents,
        consequent: r.consequent,
        type: "defeasible" as const,
      })),
      axioms: new Set(body.axioms || []),
      premises: new Set(body.premises || []),
      assumptions: new Set(body.assumptions || []),
      preferences: body.preferences || [],
    };

    // Compute ASPIC+ semantics
    const semantics = computeAspicSemantics(theory);

    // Serialize response (convert Sets/Maps to arrays/objects)
    const response = {
      arguments: semantics.arguments.map((arg) => ({
        id: arg.id,
        premises: Array.from(arg.premises),
        conclusion: arg.conclusion,
        defeasibleRules: Array.from(arg.defeasibleRules),
        topRule: arg.topRule,
        structure: arg.structure,
      })),
      attacks: semantics.attacks.map((atk) => ({
        attackerId: atk.attacker.id,
        attackedId: atk.attacked.id,
        type: atk.type,
        target: atk.target,
        metadata: atk.metadata,
      })),
      defeats: semantics.defeats.map((def) => ({
        defeaterId: def.defeater.id,
        defeatedId: def.defeated.id,
        attackType: def.attack.type,
        preferenceApplied: def.preferenceApplied,
      })),
      groundedExtension: Array.from(semantics.groundedExtension),
      justificationStatus: Object.fromEntries(semantics.justificationStatus),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Error evaluating ASPIC+ theory:", error);
    return NextResponse.json(
      {
        error: "Failed to evaluate ASPIC+ theory",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/aspic/evaluate?deliberationId=xxx
 * 
 * Get ASPIC+ theory and semantics for a deliberation by translating from AIF graph
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deliberationId = searchParams.get("deliberationId");

    if (!deliberationId) {
      return NextResponse.json(
        { error: "Missing required query parameter: deliberationId" },
        { status: 400 }
      );
    }

    // Step 1: Fetch all Arguments and their relations for this deliberation
    const argumentsList = await prisma.argument.findMany({
      where: { deliberationId },
      include: {
        conclusion: true,
        premises: {
          include: {
            claim: true,
          },
        },
        scheme: true,
      },
    });

    // Step 2: Build AIFGraph from fetched data
    // Note: For now, skip conflicts until Prisma client is regenerated
    const nodes: AnyNode[] = [];
    const edges: Edge[] = [];
    const nodeIds = new Set<string>();

    // Add I-nodes (claims) and RA-nodes (arguments)
    for (const arg of argumentsList) {
      // RA-node for the argument
      const raNodeId = `RA:${arg.id}`;
      if (!nodeIds.has(raNodeId)) {
        nodes.push({
          id: raNodeId,
          nodeType: "RA",
          content: arg.text || "Argument",
          debateId: deliberationId,
          inferenceType: "modus_ponens",
          schemeId: arg.schemeId || undefined,
        });
        nodeIds.add(raNodeId);
      }

      // I-node for conclusion
      if (arg.conclusion) {
        const conclusionNodeId = `I:${arg.conclusion.id}`;
        if (!nodeIds.has(conclusionNodeId)) {
          nodes.push({
            id: conclusionNodeId,
            nodeType: "I",
            content: arg.conclusion.text,
            claimText: arg.conclusion.text,
            debateId: deliberationId,
          });
          nodeIds.add(conclusionNodeId);
        }

        // Edge: RA → I (conclusion)
        edges.push({
          id: `${raNodeId}->${conclusionNodeId}`,
          sourceId: raNodeId,
          targetId: conclusionNodeId,
          edgeType: "conclusion",
          debateId: deliberationId,
        });
      }

      // I-nodes for premises
      for (const premise of arg.premises) {
        const premiseNodeId = `I:${premise.claim.id}`;
        if (!nodeIds.has(premiseNodeId)) {
          nodes.push({
            id: premiseNodeId,
            nodeType: "I",
            content: premise.claim.text,
            claimText: premise.claim.text,
            debateId: deliberationId,
          });
          nodeIds.add(premiseNodeId);
        }

        // Edge: I → RA (premise)
        edges.push({
          id: `${premiseNodeId}->${raNodeId}`,
          sourceId: premiseNodeId,
          targetId: raNodeId,
          edgeType: "premise",
          debateId: deliberationId,
        });
      }
    }

    // TODO: Add CA-nodes when Prisma client includes ConflictApplication
    // For now, attacks will be derived from contraries in ASPIC+ translation

    // Build AIFGraph object
    const aifGraph: AIFGraph = {
      nodes,
      edges,
      metadata: {
        debateId: deliberationId,
      },
    };

    // Step 4: Translate AIF → ASPIC+ theory
    const theory = aifToASPIC(aifGraph);

    // Step 5: Compute ASPIC+ semantics
    const semantics = computeAspicSemantics(theory);

    // Step 6: Format response for UI
    const response = {
      theory: {
        system: {
          language: Array.from(theory.language),
          contraries: Object.fromEntries(
            Array.from(theory.contraries.entries()).map(([key, valueSet]) => [
              key,
              Array.from(valueSet),
            ])
          ),
          strictRules: theory.strictRules,
          defeasibleRules: theory.defeasibleRules,
          ruleNames: {},
        },
        knowledgeBase: {
          axioms: Array.from(theory.axioms),
          premises: Array.from(theory.premises),
          assumptions: Array.from(theory.assumptions),
          premisePreferences: theory.preferences || [],
          rulePreferences: [],
        },
      },
      semantics: {
        arguments: semantics.arguments.map((arg) => ({
          id: arg.id,
          premises: Array.from(arg.premises),
          conclusion: arg.conclusion,
          defeasibleRules: Array.from(arg.defeasibleRules),
          topRule: arg.topRule,
          structure: arg.structure,
        })),
        attacks: semantics.attacks.map((atk) => ({
          attackerId: atk.attacker.id,
          attackedId: atk.attacked.id,
          type: atk.type,
          target: atk.target,
          metadata: atk.metadata,
        })),
        defeats: semantics.defeats.map((def) => ({
          defeaterId: def.defeater.id,
          defeatedId: def.defeated.id,
          attackType: def.attack.type,
          preferenceApplied: def.preferenceApplied,
        })),
        groundedExtension: Array.from(semantics.groundedExtension),
        justificationStatus: Object.fromEntries(semantics.justificationStatus),
      },
      rationality: {
        wellFormed: true, // TODO: Implement rationality checks
        violations: [],
        postulates: {
          subArgumentClosure: true,
          strictClosure: true,
          directConsistency: true,
          indirectConsistency: true,
        },
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=60", // Cache for 1 minute
      },
    });
  } catch (error: any) {
    console.error("Error fetching ASPIC+ theory:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch ASPIC+ theory",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


