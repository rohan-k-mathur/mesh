/**
 * DDS Phase 5 - Part 2: Type System Module Index
 * 
 * Based on Faggian & Hyland (2002) - §6.3-6.4
 * 
 * This module implements:
 * - Incarnation checking (lax and sharp)
 * - Type system (base, arrow, product, sum types)
 * - Type inference (structural, behavioural, and chronicle-based)
 * - Type checking and equivalence
 */

// Types
export * from "./types";

// Incarnation operations
export {
  checkLaxIncarnation,
  checkSharpIncarnation,
  checkIncarnation,
  computeIncarnationClosure,
  findMostSpecificTarget,
  findLeastSpecificTarget,
  verifyIncarnationTransitivity,
} from "./incarnation";

// Type operations
export {
  createTypeFromBehaviour,
  createTypeFromDesigns,
  checkTyping,
  checkTypeEquivalence,
  createArrowType,
  createProductType,
  createSumType,
  createUnitType,
  createVoidType,
  getTypeInhabitants,
  getDesignTypes,
  isSubtype,
  isSupertype,
  typeLeastUpperBound,
  typeGreatestLowerBound,
} from "./operations";

// Type inference
export {
  inferTypeStructural,
  inferTypeBehavioural,
  inferDesignType,
  inferTypesForDesigns,
  suggestTypeRefinements,
  unifyTypes,
  // Chronicle-based inference (leverages Prop 4.27)
  analyzeChronicles,
  inferTypeFromChronicles,
  inferTypeFromDesignChronicles,
  computeChronicleConfidence,
  type ChronicleAnalysis,
} from "./inference";
