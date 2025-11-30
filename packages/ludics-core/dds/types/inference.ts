/**
 * DDS Phase 5 - Part 2: Type Inference
 * 
 * Based on Faggian & Hyland (2002) - §6.4
 * 
 * Type inference analyzes design structure to determine its type.
 * Uses both structural and behavioural methods.
 */

import type { Action } from "../types";
import type { DesignForCorrespondence, DesignAct } from "../correspondence/types";
import type {
  TypeStructure,
  TypeInference,
  TypeInferenceMethod,
  TypeInferenceOptions,
  TypeInferenceContext,
  TypeConstraint,
  baseType,
  arrowType,
  productType,
  sumType,
  typeVariable,
  unitType,
  voidType,
  typeToString,
  createTypeInference,
} from "./types";

/**
 * Default inference options
 */
const DEFAULT_INFERENCE_OPTIONS: Required<TypeInferenceOptions> = {
  maxIterations: 10,
  minConfidence: 0.5,
  useBehavioural: true,
  includeAlternatives: true,
};

/**
 * Infer type from design structure (structural inference)
 * 
 * Analyzes the shape of a design to determine its most likely type.
 */
export function inferTypeStructural(
  design: DesignForCorrespondence
): TypeStructure {
  const acts = design.acts || [];

  // Empty design → Unit type
  if (acts.length === 0) {
    return { kind: "unit" };
  }

  // Single daimon → Unit type
  if (acts.length === 1 && acts[0].kind === "DAIMON") {
    return { kind: "unit" };
  }

  // Analyze first action for primary structure
  const firstAct = acts[0];
  const ramification = firstAct.ramification || [];

  // Check for specific patterns
  if (hasArrowPattern(acts)) {
    return inferArrowType(acts);
  }

  if (hasProductPattern(acts, ramification)) {
    return inferProductType(acts, ramification);
  }

  if (hasSumPattern(acts, ramification)) {
    return inferSumType(acts, ramification);
  }

  // Default to base type with design's expression as name
  return {
    kind: "base",
    name: firstAct.expression || design.id || "Unknown",
  };
}

/**
 * Check if actions follow arrow (function) pattern
 * 
 * Arrow pattern: alternating P/O polarities with input-output flow
 */
function hasArrowPattern(acts: DesignAct[]): boolean {
  if (acts.length < 2) return false;

  // Check for alternation
  for (let i = 1; i < acts.length; i++) {
    if (acts[i].polarity === acts[i - 1].polarity) {
      return false;
    }
  }

  // Arrow pattern: starts with O (input) and ends with P (output)
  // Or vice versa for negative designs
  return true;
}

/**
 * Infer arrow type from actions
 */
function inferArrowType(acts: DesignAct[]): TypeStructure {
  // Input type from first action
  const inputAct = acts[0];
  const inputRam = inputAct.ramification || [];

  // Output type from last action
  const outputAct = acts[acts.length - 1];
  const outputRam = outputAct.ramification || [];

  return {
    kind: "arrow",
    left: {
      kind: "variable",
      name: inputAct.expression || "A",
    },
    right: {
      kind: "variable",
      name: outputAct.expression || "B",
    },
  };
}

/**
 * Check if actions follow product (pair) pattern
 * 
 * Product pattern: first action has ramification ≥ 2
 */
function hasProductPattern(
  acts: DesignAct[],
  ramification: (string | number)[]
): boolean {
  if (acts.length === 0) return false;

  // Product needs at least 2 branches
  return ramification.length >= 2;
}

/**
 * Infer product type from actions
 */
function inferProductType(
  acts: DesignAct[],
  ramification: (string | number)[]
): TypeStructure {
  const components: TypeStructure[] = ramification.map((r, i) => ({
    kind: "variable" as const,
    name: `T${i}`,
  }));

  if (components.length === 2) {
    return {
      kind: "product",
      left: components[0],
      right: components[1],
    };
  }

  // N-ary product as nested binary
  let result = components[components.length - 1];
  for (let i = components.length - 2; i >= 0; i--) {
    result = {
      kind: "product",
      left: components[i],
      right: result,
    };
  }

  return result;
}

/**
 * Check if actions follow sum (either) pattern
 * 
 * Sum pattern: first action has ramification = 1 (injection)
 */
function hasSumPattern(
  acts: DesignAct[],
  ramification: (string | number)[]
): boolean {
  if (acts.length === 0) return false;

  // Sum uses injection (single branch)
  return ramification.length === 1;
}

/**
 * Infer sum type from actions
 */
function inferSumType(
  acts: DesignAct[],
  ramification: (string | number)[]
): TypeStructure {
  // Determine which branch was taken
  const branch = ramification[0];
  const branchIndex = typeof branch === "string" ? parseInt(branch, 10) : branch;

  return {
    kind: "sum",
    left: {
      kind: "variable",
      name: "A",
    },
    right: {
      kind: "variable",
      name: "B",
    },
  };
}

/**
 * Infer type behaviorally (from dispute patterns)
 * 
 * Analyzes how a design interacts in disputes to determine its type.
 */
export async function inferTypeBehavioural(
  design: DesignForCorrespondence,
  allDesigns: DesignForCorrespondence[]
): Promise<TypeStructure> {
  // Find designs this one interacts with
  const interactions = findInteractingDesigns(design, allDesigns);

  // If no interactions, fall back to structural
  if (interactions.length === 0) {
    return inferTypeStructural(design);
  }

  // Analyze interaction patterns
  const interactionPatterns = analyzeInteractionPatterns(design, interactions);

  // Determine type from patterns
  if (interactionPatterns.hasArrowInteraction) {
    return {
      kind: "arrow",
      left: { kind: "variable", name: "Input" },
      right: { kind: "variable", name: "Output" },
    };
  }

  if (interactionPatterns.hasProductInteraction) {
    return {
      kind: "product",
      left: { kind: "variable", name: "Fst" },
      right: { kind: "variable", name: "Snd" },
    };
  }

  if (interactionPatterns.hasSumInteraction) {
    return {
      kind: "sum",
      left: { kind: "variable", name: "Left" },
      right: { kind: "variable", name: "Right" },
    };
  }

  // Default to base type
  return {
    kind: "base",
    name: design.acts?.[0]?.expression || "Base",
  };
}

/**
 * Find designs that interact with the given design
 */
function findInteractingDesigns(
  design: DesignForCorrespondence,
  allDesigns: DesignForCorrespondence[]
): DesignForCorrespondence[] {
  const designLoci = new Set(
    (design.acts || []).map((a) => a.locusPath).filter(Boolean)
  );

  return allDesigns.filter((d) => {
    if (d.id === design.id) return false;

    // Check for shared loci
    const otherLoci = (d.acts || [])
      .map((a) => a.locusPath)
      .filter(Boolean);

    return otherLoci.some((l) => designLoci.has(l as string));
  });
}

/**
 * Analyze interaction patterns for a design
 */
function analyzeInteractionPatterns(
  design: DesignForCorrespondence,
  interactions: DesignForCorrespondence[]
): {
  hasArrowInteraction: boolean;
  hasProductInteraction: boolean;
  hasSumInteraction: boolean;
} {
  const designActs = design.acts || [];

  let hasArrowInteraction = false;
  let hasProductInteraction = false;
  let hasSumInteraction = false;

  for (const other of interactions) {
    const otherActs = other.acts || [];

    // Check for arrow interaction (alternating responses)
    const hasAlternation = checkAlternation(designActs, otherActs);
    if (hasAlternation) {
      hasArrowInteraction = true;
    }

    // Check for product interaction (parallel branches)
    const hasParallel = checkParallelBranches(designActs, otherActs);
    if (hasParallel) {
      hasProductInteraction = true;
    }

    // Check for sum interaction (exclusive branches)
    const hasExclusive = checkExclusiveBranches(designActs, otherActs);
    if (hasExclusive) {
      hasSumInteraction = true;
    }
  }

  return {
    hasArrowInteraction,
    hasProductInteraction,
    hasSumInteraction,
  };
}

/**
 * Check for alternating interaction pattern
 */
function checkAlternation(
  acts1: DesignAct[],
  acts2: DesignAct[]
): boolean {
  const loci1 = new Set(acts1.map((a) => a.locusPath));
  const loci2 = new Set(acts2.map((a) => a.locusPath));

  // Find shared loci
  const shared = [...loci1].filter((l) => loci2.has(l));

  if (shared.length < 2) return false;

  // Check if actions at shared loci alternate in polarity
  for (const locus of shared) {
    const act1 = acts1.find((a) => a.locusPath === locus);
    const act2 = acts2.find((a) => a.locusPath === locus);

    if (act1 && act2 && act1.polarity === act2.polarity) {
      return false;
    }
  }

  return true;
}

/**
 * Check for parallel branch pattern
 */
function checkParallelBranches(
  acts1: DesignAct[],
  acts2: DesignAct[]
): boolean {
  // Check if first actions have multiple ramifications
  const firstAct1 = acts1[0];
  const firstAct2 = acts2[0];

  if (!firstAct1 || !firstAct2) return false;

  const ram1 = firstAct1.ramification || [];
  const ram2 = firstAct2.ramification || [];

  return ram1.length >= 2 && ram2.length >= 2;
}

/**
 * Check for exclusive branch pattern
 */
function checkExclusiveBranches(
  acts1: DesignAct[],
  acts2: DesignAct[]
): boolean {
  // Check if designs take different branches at same locus
  const firstAct1 = acts1[0];
  const firstAct2 = acts2[0];

  if (!firstAct1 || !firstAct2) return false;

  // Same locus but different ramification = sum pattern
  if (firstAct1.locusPath === firstAct2.locusPath) {
    const ram1 = firstAct1.ramification || [];
    const ram2 = firstAct2.ramification || [];

    // Different single branches = injection
    if (ram1.length === 1 && ram2.length === 1 && ram1[0] !== ram2[0]) {
      return true;
    }
  }

  return false;
}

/**
 * Comprehensive type inference combining multiple methods
 */
export async function inferDesignType(
  design: DesignForCorrespondence,
  allDesigns: DesignForCorrespondence[],
  options?: TypeInferenceOptions
): Promise<TypeInference> {
  const opts = { ...DEFAULT_INFERENCE_OPTIONS, ...options };

  // Structural inference
  const structuralType = inferTypeStructural(design);
  let structuralConfidence = computeStructuralConfidence(design, structuralType);

  // Behavioural inference (if enabled and designs available)
  let behaviouralType: TypeStructure | null = null;
  let behaviouralConfidence = 0;

  if (opts.useBehavioural && allDesigns.length > 1) {
    try {
      behaviouralType = await inferTypeBehavioural(design, allDesigns);
      behaviouralConfidence = computeBehaviouralConfidence(
        design,
        behaviouralType,
        allDesigns
      );
    } catch (error) {
      console.warn("Behavioural inference failed:", error);
    }
  }

  // Combine results
  let inferredType: TypeStructure;
  let confidence: number;
  let method: TypeInferenceMethod;

  if (behaviouralType && behaviouralConfidence > structuralConfidence) {
    inferredType = behaviouralType;
    confidence = behaviouralConfidence;
    method = "behavioural";
  } else {
    inferredType = structuralType;
    confidence = structuralConfidence;
    method = "structural";
  }

  // Build alternatives if requested
  const alternatives: TypeStructure[] = [];
  if (opts.includeAlternatives) {
    if (method === "behavioural" && structuralConfidence >= opts.minConfidence) {
      alternatives.push(structuralType);
    }
    if (method === "structural" && behaviouralType && behaviouralConfidence >= opts.minConfidence) {
      alternatives.push(behaviouralType);
    }
  }

  return {
    designId: design.id,
    inferredType,
    confidence: Math.min(confidence, 1.0),
    method,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
  };
}

/**
 * Compute confidence for structural inference
 */
function computeStructuralConfidence(
  design: DesignForCorrespondence,
  type: TypeStructure
): number {
  const acts = design.acts || [];

  // Base confidence
  let confidence = 0.6;

  // Higher confidence for well-formed designs
  if (acts.length > 0) {
    confidence += 0.1;
  }

  // Higher confidence for consistent polarity patterns
  if (acts.length >= 2) {
    const hasAlternation = acts.slice(1).every(
      (act, i) => act.polarity !== acts[i].polarity
    );
    if (hasAlternation) {
      confidence += 0.1;
    }
  }

  // Higher confidence for specific type patterns
  if (type.kind === "arrow" && hasArrowPattern(acts)) {
    confidence += 0.15;
  }

  if (type.kind === "product" && (acts[0]?.ramification?.length || 0) >= 2) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

/**
 * Compute confidence for behavioural inference
 */
function computeBehaviouralConfidence(
  design: DesignForCorrespondence,
  type: TypeStructure,
  allDesigns: DesignForCorrespondence[]
): number {
  // Base confidence
  let confidence = 0.7;

  // Higher confidence if design interacts with many others
  const interactions = findInteractingDesigns(design, allDesigns);
  if (interactions.length > 3) {
    confidence += 0.1;
  }

  // Higher confidence for consistent interaction patterns
  if (interactions.length > 0) {
    const patterns = analyzeInteractionPatterns(design, interactions);
    const patternCount = [
      patterns.hasArrowInteraction,
      patterns.hasProductInteraction,
      patterns.hasSumInteraction,
    ].filter(Boolean).length;

    if (patternCount === 1) {
      // Single clear pattern
      confidence += 0.15;
    }
  }

  return Math.min(confidence, 1.0);
}

/**
 * Infer types for multiple designs (batch)
 */
export async function inferTypesForDesigns(
  designs: DesignForCorrespondence[],
  options?: TypeInferenceOptions
): Promise<Map<string, TypeInference>> {
  const results = new Map<string, TypeInference>();

  // Process in parallel
  const inferences = await Promise.all(
    designs.map((design) => inferDesignType(design, designs, options))
  );

  inferences.forEach((inference, idx) => {
    results.set(designs[idx].id, inference);
  });

  return results;
}

/**
 * Suggest type refinements for low-confidence inferences
 */
export function suggestTypeRefinements(
  inference: TypeInference
): TypeStructure[] {
  const suggestions: TypeStructure[] = [];

  // If base type with low confidence, suggest arrow
  if (inference.inferredType.kind === "base" && inference.confidence < 0.7) {
    suggestions.push({
      kind: "arrow",
      left: inference.inferredType,
      right: { kind: "variable", name: "B" },
    });
  }

  // Suggest variable if unknown
  if (inference.inferredType.kind === "base" && !inference.inferredType.name) {
    suggestions.push({
      kind: "variable",
      name: "T",
    });
  }

  // Suggest product if arrow with low confidence
  if (inference.inferredType.kind === "arrow" && inference.confidence < 0.6) {
    suggestions.push({
      kind: "product",
      left: inference.inferredType.left!,
      right: inference.inferredType.right!,
    });
  }

  return suggestions;
}

/**
 * Unify two type structures
 * 
 * Returns a substitution that makes the types equal, or null if impossible.
 */
export function unifyTypes(
  type1: TypeStructure,
  type2: TypeStructure
): Map<string, TypeStructure> | null {
  const substitution = new Map<string, TypeStructure>();

  function unify(t1: TypeStructure, t2: TypeStructure): boolean {
    // Variable case
    if (t1.kind === "variable") {
      if (substitution.has(t1.name!)) {
        return unify(substitution.get(t1.name!)!, t2);
      }
      substitution.set(t1.name!, t2);
      return true;
    }

    if (t2.kind === "variable") {
      if (substitution.has(t2.name!)) {
        return unify(t1, substitution.get(t2.name!)!);
      }
      substitution.set(t2.name!, t1);
      return true;
    }

    // Same kind check
    if (t1.kind !== t2.kind) {
      return false;
    }

    // Handle specific kinds
    switch (t1.kind) {
      case "base":
        return t1.name === t2.name;

      case "unit":
      case "void":
        return true;

      case "arrow":
      case "product":
      case "sum":
        return (
          unify(t1.left!, t2.left!) && unify(t1.right!, t2.right!)
        );

      default:
        return false;
    }
  }

  return unify(type1, type2) ? substitution : null;
}
