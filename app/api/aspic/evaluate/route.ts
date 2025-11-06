// app/api/aspic/evaluate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { computeAspicSemantics } from "@/lib/aif/translation/aifToAspic";
import type { ArgumentationTheory } from "@/lib/aif/translation/aifToAspic";

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
 * GET /api/aspic/evaluate
 * 
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/aspic/evaluate",
    method: "POST",
    description: "Evaluate an ASPIC+ argumentation theory",
    documentation: {
      requestBody: {
        language: "Array of strings (formulas in the logical language)",
        contraries: "Object mapping formulas to arrays of contrary formulas",
        strictRules: "Array of strict inference rules",
        defeasibleRules: "Array of defeasible inference rules",
        axioms: "Array of necessary premises (cannot be attacked)",
        premises: "Array of ordinary premises (can be undermined)",
        assumptions: "Array of assumptions (attacks always succeed)",
        preferences: "Array of preference pairs { preferred, dispreferred }",
      },
      response: {
        arguments: "All constructed arguments",
        attacks: "All attack relations (undermining/rebutting/undercutting)",
        defeats: "Successful attacks after preference resolution",
        groundedExtension: "Arguments in the grounded extension (justified)",
        justificationStatus: "Status map: 'in' | 'out' | 'undec' for each argument",
      },
      example: {
        request: {
          language: ["p", "q", "r"],
          contraries: { p: ["¬p"], "¬p": ["p"] },
          strictRules: [],
          defeasibleRules: [
            { id: "r1", antecedents: ["p"], consequent: "q", type: "defeasible" },
          ],
          axioms: [],
          premises: ["p"],
          assumptions: [],
          preferences: [],
        },
        response: {
          arguments: [
            { id: "A1", premises: ["p"], conclusion: "p", defeasibleRules: [] },
            { id: "A2", premises: ["p"], conclusion: "q", defeasibleRules: ["r1"] },
          ],
          attacks: [],
          defeats: [],
          groundedExtension: ["A1", "A2"],
          justificationStatus: { A1: "in", A2: "in" },
        },
      },
    },
  });
}
