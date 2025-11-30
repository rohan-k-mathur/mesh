/**
 * DDS Module Index
 * Phase 1: Core Abstractions (Views, Chronicles, Legal Positions)
 * Phase 2: Strategy Layer (Strategies, Innocence, Propagation)
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
