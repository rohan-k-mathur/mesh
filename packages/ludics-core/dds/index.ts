/**
 * DDS Module Index
 * Phase 1: Core Abstractions (Views, Chronicles, Legal Positions)
 * Phase 2: Strategy Layer (Strategies, Innocence, Propagation)
 * Phase 3: Correspondences & Isomorphisms
 * Phase 5: Advanced Features (Behaviours, Types, Analysis)
 * 
 * Based on "Designs, disputes and strategies" by Faggian & Hyland (2002)
 */

// Core types
export * from "./types";

// View extraction
export {
  extractView,
  extractProponentView,
  extractOpponentView,
  createView,
  viewsEqual,
  isViewPrefix,
  getViewTip,
  viewToKey,
  isInitial,
  findJustifier,
} from "./views";

// Chronicle extraction
export {
  extractChronicles,
  extractAllChronicles,
  disputeToPosition,
  isPositiveChronicle,
  isNegativeChronicle,
  chronicleDepth,
  chronicleTipLocus,
  isChroniclePrefix,
  getPositiveChronicles,
  getNegativeChronicles,
  groupChroniclesByLocus,
} from "./chronicles";

// Legality validation
export {
  validateLegality,
  isLegal,
  createPosition,
  extendPosition,
  getValidNextAddresses,
} from "./legality";

// Phase 2: Strategy Layer
export * from "./strategy";

// Phase 3: Correspondences & Isomorphisms
export * from "./correspondence";

// Phase 5: Advanced Features

// Behaviours - Orthogonality & Biorthogonal Closure
export * from "./behaviours";

// Types - Incarnation & Type System
// Export as namespace to avoid conflict with core types.ts
export * as LudicsTypes from "./types/index";

// Analysis - Saturation, Validation & Performance
export * from "./analysis";
