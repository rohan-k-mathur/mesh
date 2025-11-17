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

    // Step 1b: Fetch ConflictApplications (attacks) for this deliberation
    const conflictsList = await prisma.conflictApplication.findMany({
      where: { deliberationId },
      include: {
        scheme: true,
        createdByMove: true,
      },
    });

    console.log(`[ASPIC API] Fetched ${conflictsList.length} ConflictApplications for deliberation ${deliberationId}`);

    // Step 1c-2: Fetch ClaimEdges (from CriticalQuestionsV3) for ASPIC+ integration
    const claimEdgesList = await prisma.claimEdge.findMany({
      where: {
        deliberationId,
        attackType: { in: ["REBUTS", "UNDERCUTS", "UNDERMINES"] }, // Only attack edges
      },
      include: {
        from: true,
        to: true,
      },
    });

    console.log(`[ASPIC API] Fetched ${claimEdgesList.length} ClaimEdges (attack edges) for deliberation ${deliberationId}`);

    // Step 1c: Fetch AssumptionUse records (ACCEPTED assumptions for K_a)
    const assumptionsList = await prisma.assumptionUse.findMany({
      where: {
        deliberationId,
        status: "ACCEPTED", // Only accepted assumptions enter knowledge base
      },
    });

    console.log(`[ASPIC API] Fetched ${assumptionsList.length} ACCEPTED AssumptionUse records for deliberation ${deliberationId}`);

    // Step 1d: Fetch explicit ClaimContrary records (Phase D-1)
    // @ts-ignore - ClaimContrary model exists but TypeScript server hasn't refreshed
    const explicitContraries = await prisma.claimContrary.findMany({
      where: {
        deliberationId,
        status: "ACTIVE",
      },
      include: {
        claim: true,
        contrary: true,
      },
    });

    console.log(`[ASPIC API] Fetched ${explicitContraries.length} explicit ClaimContrary records for deliberation ${deliberationId}`);

    // Step 1e: Fetch ArgumentSchemeInstance records for ASPIC+ ruleType (Phase 1b.2)
    // @ts-ignore - ArgumentSchemeInstance model exists, TypeScript server needs refresh
    const schemeInstances = await prisma.argumentSchemeInstance.findMany({
      where: {
        argument: {
          deliberationId,
        },
      },
      include: {
        scheme: true,
      },
    });
    
    // Build map: argumentId -> schemeInstance (use primary instance)
    const schemeInstanceMap = new Map<string, any>();
    for (const instance of schemeInstances) {
      if (instance.isPrimary || !schemeInstanceMap.has(instance.argumentId)) {
        schemeInstanceMap.set(instance.argumentId, instance);
      }
    }

    console.log(`[ASPIC API] Fetched ${schemeInstances.length} ArgumentSchemeInstance records for deliberation ${deliberationId}`);

    // Step 2: Build AIFGraph from fetched data
    const nodes: AnyNode[] = [];
    const edges: Edge[] = [];
    const nodeIds = new Set<string>();

    // Add I-nodes (claims) and RA-nodes (arguments)
    for (const arg of argumentsList) {
      // RA-node for the argument
      const raNodeId = `RA:${arg.id}`;
      if (!nodeIds.has(raNodeId)) {
        // ASPIC+ Phase 1b.2: Attach scheme instance for ruleType
        const schemeInstance = schemeInstanceMap.get(arg.id);
        
        nodes.push({
          id: raNodeId,
          nodeType: "RA",
          content: arg.text || "Argument",
          debateId: deliberationId,
          inferenceType: "modus_ponens",
          schemeId: arg.schemeId || undefined,
          // ASPIC+ Phase 1b.2: Add scheme instance metadata
          metadata: {
            schemeInstance: schemeInstance ? {
              ruleType: schemeInstance.ruleType,
              ruleName: schemeInstance.ruleName,
              confidence: schemeInstance.confidence,
              isPrimary: schemeInstance.isPrimary,
            } : null,
          },
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
          // Phase B: Tag I-nodes with role (axiom vs premise) for KB stratification
          const premiseRole = premise.isAxiom ? 'axiom' : 'premise';
          
          nodes.push({
            id: premiseNodeId,
            nodeType: "I",
            content: premise.claim.text,
            claimText: premise.claim.text,
            debateId: deliberationId,
            // Phase B: Add metadata for ASPIC+ KB classification
            metadata: {
              role: premiseRole, // 'axiom' (K_n) or 'premise' (K_p)
              isAxiom: premise.isAxiom,
            },
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

    // Step 3: Add CA-nodes (ConflictApplications as attack nodes)
    for (const conflict of conflictsList) {
      const caNodeId = `CA:${conflict.id}`;
      
      // Determine attack type for visualization
      const attackType = conflict.aspicAttackType || conflict.legacyAttackType || 'unknown';
      
      // Extract metaJson for CQ provenance
      const metaJson = conflict.metaJson as Record<string, any> || {};
      
      // Create CA-node
      if (!nodeIds.has(caNodeId)) {
        nodes.push({
          id: caNodeId,
          nodeType: "CA",
          content: `${attackType} attack`,
          debateId: deliberationId,
          conflictType: attackType.toLowerCase() as "rebut" | "undercut" | "undermine",
          metadata: {
            cqKey: metaJson.cqKey,
            cqText: metaJson.cqText,
            schemeKey: conflict.scheme?.key || metaJson.schemeKey,
            source: metaJson.source,
            createdByMoveId: conflict.createdByMoveId,
            aspicAttackType: conflict.aspicAttackType,
            aspicDefeatStatus: conflict.aspicDefeatStatus,
            aspicMetadata: conflict.aspicMetadata,
            legacyAttackType: conflict.legacyAttackType,
            legacyTargetScope: conflict.legacyTargetScope,
          },
        });
        nodeIds.add(caNodeId);
      }

      // Edge 1: Attacker → CA-node (conflicting edge)
      if (conflict.conflictingArgumentId) {
        const attackerNodeId = `RA:${conflict.conflictingArgumentId}`;
        edges.push({
          id: `${attackerNodeId}->${caNodeId}`,
          sourceId: attackerNodeId,
          targetId: caNodeId,
          edgeType: "conflicting",
          debateId: deliberationId,
        });
      } else if (conflict.conflictingClaimId) {
        // Attacker is a claim (create I-node if needed)
        const attackerClaimNodeId = `I:${conflict.conflictingClaimId}`;
        if (!nodeIds.has(attackerClaimNodeId)) {
          // Fetch claim text (we may need to optimize this with a batch query)
          const attackerClaim = await prisma.claim.findUnique({
            where: { id: conflict.conflictingClaimId },
          });
          if (attackerClaim) {
            nodes.push({
              id: attackerClaimNodeId,
              nodeType: "I",
              content: attackerClaim.text,
              claimText: attackerClaim.text,
              debateId: deliberationId,
            });
            nodeIds.add(attackerClaimNodeId);
          }
        }
        edges.push({
          id: `${attackerClaimNodeId}->${caNodeId}`,
          sourceId: attackerClaimNodeId,
          targetId: caNodeId,
          edgeType: "conflicting",
          debateId: deliberationId,
        });
      }

      // Edge 2: CA-node → Target (conflicted edge)
      if (conflict.conflictedArgumentId) {
        const targetNodeId = `RA:${conflict.conflictedArgumentId}`;
        edges.push({
          id: `${caNodeId}->${targetNodeId}`,
          sourceId: caNodeId,
          targetId: targetNodeId,
          edgeType: "conflicted",
          debateId: deliberationId,
        });
      } else if (conflict.conflictedClaimId) {
        // Target is a claim (create I-node if needed)
        const targetClaimNodeId = `I:${conflict.conflictedClaimId}`;
        if (!nodeIds.has(targetClaimNodeId)) {
          const targetClaim = await prisma.claim.findUnique({
            where: { id: conflict.conflictedClaimId },
          });
          if (targetClaim) {
            nodes.push({
              id: targetClaimNodeId,
              nodeType: "I",
              content: targetClaim.text,
              claimText: targetClaim.text,
              debateId: deliberationId,
            });
            nodeIds.add(targetClaimNodeId);
          }
        }
        edges.push({
          id: `${caNodeId}->${targetClaimNodeId}`,
          sourceId: caNodeId,
          targetId: targetClaimNodeId,
          edgeType: "conflicted",
          debateId: deliberationId,
        });
      }

      console.log(`[ASPIC API] Created CA-node ${caNodeId}: ${attackType} (${conflict.conflictingArgumentId || conflict.conflictingClaimId} → ${conflict.conflictedArgumentId || conflict.conflictedClaimId})`);
    }

    // Step 3b: Add CA-nodes for ClaimEdges (from CriticalQuestionsV3)
    for (const edge of claimEdgesList) {
      const caNodeId = `CA:ClaimEdge:${edge.id}`;
      
      // Determine attack type for visualization
      const attackType = edge.attackType || 'rebuts';
      
      // Extract metaJson for CQ provenance
      const metaJson = edge.metaJson as Record<string, any> || {};
      
      // Create CA-node
      if (!nodeIds.has(caNodeId)) {
        nodes.push({
          id: caNodeId,
          nodeType: "CA",
          content: `${attackType} attack`,
          debateId: deliberationId,
          conflictType: attackType.toLowerCase() as "rebut" | "undercut" | "undermine",
          metadata: {
            cqKey: metaJson.cqKey,
            schemeKey: metaJson.schemeKey,
            source: metaJson.source || 'claim-edge',
            attackType: edge.attackType,
            targetScope: edge.targetScope,
            claimEdgeId: edge.id,
          },
        });
        nodeIds.add(caNodeId);
      }

      // Edge 1: Attacker claim → CA-node (conflicting edge)
      const attackerNodeId = `I:${edge.fromClaimId}`;
      if (!nodeIds.has(attackerNodeId)) {
        nodes.push({
          id: attackerNodeId,
          nodeType: "I",
          content: edge.from.text,
          claimText: edge.from.text,
          debateId: deliberationId,
        });
        nodeIds.add(attackerNodeId);
      }
      edges.push({
        id: `${attackerNodeId}->${caNodeId}`,
        sourceId: attackerNodeId,
        targetId: caNodeId,
        edgeType: "conflicting",
        debateId: deliberationId,
      });

      // Edge 2: CA-node → Target claim (conflicted edge)
      const targetNodeId = `I:${edge.toClaimId}`;
      if (!nodeIds.has(targetNodeId)) {
        nodes.push({
          id: targetNodeId,
          nodeType: "I",
          content: edge.to.text,
          claimText: edge.to.text,
          debateId: deliberationId,
        });
        nodeIds.add(targetNodeId);
      }
      edges.push({
        id: `${caNodeId}->${targetNodeId}`,
        sourceId: caNodeId,
        targetId: targetNodeId,
        edgeType: "conflicted",
        debateId: deliberationId,
      });

      console.log(`[ASPIC API] Created CA-node ${caNodeId}: ${attackType} (ClaimEdge ${edge.fromClaimId} → ${edge.toClaimId})`);
    }

    // Step 4: Add I-nodes for assumptions (K_a)
    for (const assumption of assumptionsList) {
      // Determine the assumption text
      let assumptionText: string | undefined;
      let assumptionNodeId: string | undefined;

      if (assumption.assumptionClaimId) {
        // Assumption tied to existing claim
        assumptionNodeId = `I:${assumption.assumptionClaimId}`;
        
        // Fetch claim if not already in nodes
        if (!nodeIds.has(assumptionNodeId)) {
          const claim = await prisma.claim.findUnique({
            where: { id: assumption.assumptionClaimId },
          });
          
          if (claim) {
            assumptionText = claim.text;
            nodes.push({
              id: assumptionNodeId,
              nodeType: "I",
              content: assumptionText,
              claimText: assumptionText,
              debateId: deliberationId,
              metadata: {
                role: "assumption", // Tag as assumption for K_a
                assumptionId: assumption.id,
                weight: assumption.weight,
                confidence: assumption.confidence,
              },
            });
            nodeIds.add(assumptionNodeId);
          }
        }
      } else if (assumption.assumptionText) {
        // Freeform assumption (not tied to existing claim)
        assumptionNodeId = `I:assumption_${assumption.id}`;
        assumptionText = assumption.assumptionText;
        
        if (!nodeIds.has(assumptionNodeId)) {
          nodes.push({
            id: assumptionNodeId,
            nodeType: "I",
            content: assumptionText,
            claimText: assumptionText,
            debateId: deliberationId,
            metadata: {
              role: "assumption", // Tag as assumption for K_a
              assumptionId: assumption.id,
              weight: assumption.weight,
              confidence: assumption.confidence,
            },
          });
          nodeIds.add(assumptionNodeId);
        }
      }

      // Only create edge and log if we successfully created the assumption node
      if (assumptionNodeId && assumptionText) {
        // Create presumption edge from assumption to argument (if used in argument)
        if (assumption.argumentId) {
          const argumentNodeId = `RA:${assumption.argumentId}`;
          edges.push({
            id: `${assumptionNodeId}->${argumentNodeId}`,
            sourceId: assumptionNodeId,
            targetId: argumentNodeId,
            edgeType: "presumption", // Special edge type for assumptions
            debateId: deliberationId,
          });
        }

        console.log(`[ASPIC API] Created assumption I-node ${assumptionNodeId}: "${assumptionText}" (weight: ${assumption.weight}, confidence: ${assumption.confidence})`);
      }
    }

    // Build AIFGraph object
    const aifGraph: AIFGraph = {
      nodes,
      edges,
      metadata: {
        debateId: deliberationId,
      },
    };

    // Step 4: Translate AIF → ASPIC+ theory (with explicit contraries)
    const theory = aifToASPIC(aifGraph, explicitContraries as any);

    // Step 4.5: Validate rationality postulates (Phase B)
    const { validateAxiomConsistency, validateWellFormedness } = await import(
      "@/lib/aspic/validation"
    );
    const { validateTranspositionClosure } = await import(
      "@/lib/aspic/transposition"
    );
    const axiomCheck = validateAxiomConsistency(theory);
    const wellFormednessCheck = validateWellFormedness(theory);
    const transpositionCheck = validateTranspositionClosure(theory.strictRules);

    if (!axiomCheck.valid || !wellFormednessCheck.valid || !transpositionCheck.isClosed) {
      console.warn("[ASPIC API] Rationality violations detected:", {
        axioms: axiomCheck,
        wellFormedness: wellFormednessCheck,
        transposition: transpositionCheck.isClosed ? "closed" : `${transpositionCheck.missingRules.length} missing transpositions`,
      });
    }

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
        arguments: semantics.arguments.map((arg) => {
          const mapped = {
            id: arg.id,
            premises: Array.from(arg.premises),
            conclusion: arg.conclusion,
            defeasibleRules: Array.from(arg.defeasibleRules),
            topRule: arg.topRule,
            structure: arg.structure,
          };
          
          // Debug: Log first argument in detail
          if (semantics.arguments.indexOf(arg) === 0) {
            console.log("[ASPIC API] First argument details:", {
              id: arg.id,
              idType: typeof arg.id,
              premises: arg.premises,
              premisesType: typeof arg.premises,
              premisesArray: Array.from(arg.premises),
              conclusion: arg.conclusion,
              conclusionType: typeof arg.conclusion,
              mapped,
            });
          }
          
          return mapped;
        }),
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
        wellFormed: axiomCheck.valid && wellFormednessCheck.valid,
        violations: [
          ...(axiomCheck.errors || []),
          ...(wellFormednessCheck.errors || []),
        ],
        postulates: {
          axiomConsistency: axiomCheck.valid,
          wellFormedness: wellFormednessCheck.valid,
          subArgumentClosure: true, // Phase C: Implement with strict rules
          transpositionClosure: transpositionCheck.isClosed,
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


