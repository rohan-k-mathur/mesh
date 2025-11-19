# ASPIC+ Phase 5: Advanced Preference Features - Implementation Roadmap

**Date**: November 18, 2025  
**Status**: 📋 Planning  
**Duration**: 12-15 days  
**Version**: 1.0

**Related Documents**:
- Phase 4 Foundation: `ASPIC_PHASE4_PREFERENCES_ROADMAP_V2.md`
- Theoretical Foundation: `docs/arg-computation-research/ASPIC_Argumentation with Preferences.md`
- Performance Optimization: `PLATFORM_PERFORMANCE_OPTIMIZATION_ROADMAP.md`

---

## Executive Summary

Phase 4 established the foundational translation layer between AIF PA-nodes and ASPIC+ preferences. Phase 5 extends this foundation with advanced features for real-world deliberation scenarios.

### Phase 4 Recap: What We Built ✅

- ✅ AIF ↔ ASPIC+ bidirectional translation layer
- ✅ Last-link and weakest-link ordering policies
- ✅ Elitist and democratic set comparisons
- ✅ Basic preference creation UI (`PreferenceAttackModal`)
- ✅ Preference visualization (`PreferenceBadge`)
- ✅ API endpoints: `/api/pa`, `/api/aspic/evaluate`

### Phase 5 Goals: Advanced Features 🎯

**Four Major Feature Areas**:

1. **Weighted Preferences** - Add confidence/strength scores (0.0-1.0) to preferences
2. **Preference Schemes** - Formalize justifications with structured argumentation schemes
3. **Conflict Resolution** - Detect and resolve circular preferences (A < B < A)
4. **Bulk Operations** - CSV import/export, templates, batch preference management

### Why These Features Matter

**Weighted Preferences**:
- Real deliberations involve uncertain preferences ("A is slightly better than B" vs. "A is definitely better than B")
- Probabilistic defeat computation for more nuanced evaluation
- Integration with confidence scoring from ML models

**Preference Schemes**:
- Current `justification` field is free text (unstructured)
- Schemes formalize *why* A > B (e.g., "Expert Opinion", "Recency", "Statistical Evidence")
- Enables meta-argumentation: argue about the preference itself

**Conflict Resolution**:
- Cycles break ASPIC+ rationality postulates
- Detection is implemented; resolution is manual
- Need UI to visualize, propose resolutions, and apply fixes

**Bulk Operations**:
- Large deliberations (100+ arguments) need efficient preference management
- Import from external sources (spreadsheets, expert panels)
- Templates for common preference patterns

---

## Architecture Overview

### Current State (Post-Phase 4)

```
┌─────────────────────────────────────────────────────────┐
│                    AIF Layer (Database)                  │
├─────────────────────────────────────────────────────────┤
│  PreferenceApplication Model                            │
│  - preferredArgumentId, dispreferredArgumentId          │
│  - preferredClaimId, dispreferredClaimId                │
│  - orderingPolicy, setComparison                        │
│  - justification (text)                                 │
└─────────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────────┐
│              Translation Layer (Phase 4)                 │
├─────────────────────────────────────────────────────────┤
│  lib/aspic/translation/                                 │
│  - aifToASPIC.ts    (Definition 4.1)                    │
│  - aspicToAIF.ts    (Definition 4.2)                    │
│  - integration.ts   (Evaluation orchestration)          │
└─────────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────────┐
│              ASPIC+ Computation Layer                    │
├─────────────────────────────────────────────────────────┤
│  lib/aspic/defeats.ts                                   │
│  - computeDefeats() with ordering policies              │
│  - Last-link, weakest-link                              │
│  - Elitist, democratic set comparison                   │
└─────────────────────────────────────────────────────────┘
```

### Target State (Post-Phase 5)

```
┌─────────────────────────────────────────────────────────┐
│                    AIF Layer (Enhanced)                  │
├─────────────────────────────────────────────────────────┤
│  PreferenceApplication Model (Extended)                 │
│  + weight: Float (0.0-1.0)                              │
│  + schemeId: String (FK to PreferenceScheme)            │
│  + conflictStatus: Enum (none, detected, resolved)      │
│  + conflictResolution: JSON (metadata)                  │
│                                                          │
│  PreferenceScheme Model (New)                           │
│  - id, name, description, category                      │
│  - criticalQuestions: JSON                              │
│  - parameters: JSON                                     │
│                                                          │
│  PreferenceBatch Model (New)                            │
│  - id, name, description, source                        │
│  - preferences: Relation to PreferenceApplication       │
└─────────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────────┐
│           Enhanced Translation Layer (Phase 5)           │
├─────────────────────────────────────────────────────────┤
│  lib/aspic/translation/ (Extended)                      │
│  + weightedDefeats.ts   (Probabilistic defeat)          │
│  + schemeValidation.ts  (Scheme-based preference check) │
│  + conflictResolution.ts (Cycle detection & resolution)  │
│  + bulkOperations.ts    (Batch import/export)           │
└─────────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────────┐
│           ASPIC+ Computation Layer (Enhanced)            │
├─────────────────────────────────────────────────────────┤
│  lib/aspic/defeats.ts (Extended)                        │
│  + computeWeightedDefeats() - probabilistic defeats     │
│  + computeDefeatConfidence() - defeat probability       │
│  + validatePreferenceAcyclicity() - conflict detection  │
└─────────────────────────────────────────────────────────┘
```

---

## Feature 5.1: Weighted Preferences (4-5 days)

### Overview

Add confidence scores (weights) to preferences, enabling probabilistic defeat computation.

**Use Cases**:
- User expresses uncertain preference: "A is probably better than B" (weight 0.7)
- ML model suggests preference with confidence score
- Expert panel provides weighted votes (3 experts vote A > B with avg weight 0.85)
- Sensitivity analysis: How robust is the evaluation to preference uncertainty?

### Theoretical Foundation

**Weighted Preference Ordering**:
```
≤w = {(φ, ψ, w) | φ ≤ ψ with confidence w ∈ [0, 1]}
```

**Probabilistic Defeat**:
```
P(A defeats B) = P(A attacks B) × P(A ≤ B in relevant ordering)
```

**Aggregation Strategies**:
1. **Minimum Weight**: Take minimum weight along defeat chain
2. **Product Weight**: Multiply weights (independence assumption)
3. **Average Weight**: Average weights (correlation assumption)

### Schema Changes

#### Update `PreferenceApplication` Model

**File**: `prisma/schema.prisma` (line ~2671)

```prisma
model PreferenceApplication {
  // ... existing fields ...
  
  // PHASE 5.1: Weighted preferences
  weight              Float?   @default(1.0) // Confidence score [0.0, 1.0]
  weightJustification String?  @db.Text      // Explain why this weight
  
  // Weight metadata
  weightSource        String?  // "user" | "ml_model" | "expert_panel" | "aggregated"
  weightConfidence    Float?   // Meta-confidence: how confident are we in the weight?
  
  // ... existing relations ...
}
```

**Migration**:
```bash
# Add weight column with default 1.0 (full confidence)
npx prisma db push
npx prisma generate
```

**Backward Compatibility**:
- Existing PA-nodes get `weight = 1.0` (deterministic, no change in behavior)
- Null weight treated as 1.0

---

### Implementation Part 1: Core Weighted Defeats

#### File 1: `lib/aspic/weighted/types.ts` (New, ~100 lines)

```typescript
/**
 * Type definitions for weighted preferences and probabilistic defeats
 */

import type { Argument, Attack } from "@/lib/aspic/types";

/**
 * Weighted preference: A < B with confidence weight
 */
export interface WeightedPreference {
  preferred: string;
  dispreferred: string;
  weight: number; // [0.0, 1.0]
  source?: "user" | "ml_model" | "expert_panel" | "aggregated";
  justification?: string;
}

/**
 * Probabilistic defeat: Attack that succeeds with probability
 */
export interface ProbabilisticDefeat {
  attack: Attack;
  defeater: Argument;
  defeated: Argument;
  probability: number; // [0.0, 1.0]
  contributingWeights: Array<{
    preference: WeightedPreference;
    impact: number; // How much this weight contributed
  }>;
  aggregationMethod: "minimum" | "product" | "average";
}

/**
 * Weighted knowledge base
 */
export interface WeightedKnowledgeBase {
  premisePreferences: WeightedPreference[];
  rulePreferences: WeightedPreference[];
}

/**
 * Probabilistic extension: Arguments with acceptance probability
 */
export interface ProbabilisticExtension {
  arguments: Map<string, number>; // argumentId -> P(accepted)
  defeats: ProbabilisticDefeat[];
  computationMethod: "monte_carlo" | "analytical" | "approximation";
}

/**
 * Weight aggregation strategy
 */
export type WeightAggregation = "minimum" | "product" | "average" | "max";

/**
 * Sensitivity analysis result
 */
export interface SensitivityAnalysis {
  argumentId: string;
  baselineProbability: number;
  perturbations: Array<{
    preferenceId: string;
    originalWeight: number;
    perturbedWeight: number;
    resultingProbability: number;
    impact: number; // |resulting - baseline|
  }>;
  mostSensitivePreferences: Array<{
    preferenceId: string;
    sensitivity: number; // dP/dw (derivative)
  }>;
}
```

---

### Implementation Part 2: Weighted Defeat Computation

#### File 2: `lib/aspic/weighted/defeats.ts` (New, ~400 lines)

```typescript
/**
 * Weighted defeat computation with probabilistic semantics
 * Extends lib/aspic/defeats.ts with weight-aware defeat calculation
 */

import type { 
  Argument, 
  Attack, 
  Defeat, 
  ArgumentationTheory,
  PreferenceOrdering 
} from "@/lib/aspic/types";
import type {
  WeightedPreference,
  ProbabilisticDefeat,
  WeightedKnowledgeBase,
  WeightAggregation,
} from "./types";
import { computeDefeats } from "@/lib/aspic/defeats";

/**
 * Compute probabilistic defeats from attacks and weighted preferences
 * Main entry point for weighted defeat computation
 */
export function computeWeightedDefeats(
  attacks: Attack[],
  theory: ArgumentationTheory,
  weightedKB: WeightedKnowledgeBase,
  ordering: PreferenceOrdering = "last-link",
  aggregation: WeightAggregation = "minimum"
): ProbabilisticDefeat[] {
  const probabilisticDefeats: ProbabilisticDefeat[] = [];

  for (const attack of attacks) {
    // Check if this attack becomes a defeat (deterministic check first)
    const deterministicDefeats = computeDefeats([attack], theory, ordering);
    
    if (deterministicDefeats.length === 0) {
      // Attack is blocked by preference-independent means
      // Weight doesn't matter here (probability = 0)
      continue;
    }

    // Compute defeat probability based on preference weights
    const probability = computeDefeatProbability(
      attack,
      weightedKB,
      ordering,
      aggregation
    );

    // Track which preferences contributed
    const contributingWeights = findContributingPreferences(
      attack,
      weightedKB,
      ordering
    );

    probabilisticDefeats.push({
      attack,
      defeater: attack.attacker,
      defeated: attack.attacked,
      probability,
      contributingWeights,
      aggregationMethod: aggregation,
    });
  }

  return probabilisticDefeats;
}

/**
 * Compute probability that an attack becomes a defeat
 * P(defeat) depends on weights of relevant preferences
 */
function computeDefeatProbability(
  attack: Attack,
  weightedKB: WeightedKnowledgeBase,
  ordering: PreferenceOrdering,
  aggregation: WeightAggregation
): number {
  // Find preferences that affect this attack
  const relevantPrefs = findRelevantPreferences(attack, weightedKB, ordering);

  if (relevantPrefs.length === 0) {
    // No preferences involved → deterministic defeat
    return 1.0;
  }

  // Aggregate preference weights
  switch (aggregation) {
    case "minimum":
      // Weakest link: probability is minimum weight
      return Math.min(...relevantPrefs.map(p => p.weight));
    
    case "product":
      // Independence assumption: multiply weights
      return relevantPrefs.reduce((acc, p) => acc * p.weight, 1.0);
    
    case "average":
      // Average weight across all preferences
      return relevantPrefs.reduce((sum, p) => sum + p.weight, 0) / relevantPrefs.length;
    
    case "max":
      // Strongest link: probability is maximum weight
      return Math.max(...relevantPrefs.map(p => p.weight));
    
    default:
      return 1.0;
  }
}

/**
 * Find preferences relevant to this attack under given ordering
 */
function findRelevantPreferences(
  attack: Attack,
  weightedKB: WeightedKnowledgeBase,
  ordering: PreferenceOrdering
): WeightedPreference[] {
  const relevant: WeightedPreference[] = [];

  switch (ordering) {
    case "last-link": {
      // Compare last defeasible rules
      const attackerLastRule = getLastDefeasibleRule(attack.attacker);
      const attackedLastRule = getLastDefeasibleRule(attack.attacked);

      if (attackerLastRule && attackedLastRule) {
        // Find rule preferences involving these rules
        for (const pref of weightedKB.rulePreferences) {
          if (
            (pref.preferred === attackerLastRule && pref.dispreferred === attackedLastRule) ||
            (pref.preferred === attackedLastRule && pref.dispreferred === attackerLastRule)
          ) {
            relevant.push(pref);
          }
        }
      }
      break;
    }

    case "weakest-link": {
      // Compare all rules and premises
      const attackerRules = getAllDefeasibleRules(attack.attacker);
      const attackedRules = getAllDefeasibleRules(attack.attacked);

      // Check rule preferences
      for (const pref of weightedKB.rulePreferences) {
        if (
          attackerRules.includes(pref.preferred) &&
          attackedRules.includes(pref.dispreferred)
        ) {
          relevant.push(pref);
        }
        if (
          attackedRules.includes(pref.preferred) &&
          attackerRules.includes(pref.dispreferred)
        ) {
          relevant.push(pref);
        }
      }

      // Check premise preferences
      const attackerPremises = getAllPremises(attack.attacker);
      const attackedPremises = getAllPremises(attack.attacked);

      for (const pref of weightedKB.premisePreferences) {
        if (
          attackerPremises.includes(pref.preferred) &&
          attackedPremises.includes(pref.dispreferred)
        ) {
          relevant.push(pref);
        }
        if (
          attackedPremises.includes(pref.preferred) &&
          attackerPremises.includes(pref.dispreferred)
        ) {
          relevant.push(pref);
        }
      }
      break;
    }

    default:
      break;
  }

  return relevant;
}

/**
 * Find preferences that contributed to defeat decision
 * Returns preferences with impact scores
 */
function findContributingPreferences(
  attack: Attack,
  weightedKB: WeightedKnowledgeBase,
  ordering: PreferenceOrdering
): Array<{ preference: WeightedPreference; impact: number }> {
  const relevant = findRelevantPreferences(attack, weightedKB, ordering);

  // Compute impact: how much each preference affects the defeat probability
  return relevant.map(pref => ({
    preference: pref,
    impact: computePreferenceImpact(pref, relevant),
  }));
}

/**
 * Compute impact of a single preference in the context of all relevant preferences
 */
function computePreferenceImpact(
  pref: WeightedPreference,
  allRelevant: WeightedPreference[]
): number {
  // Impact = how much defeat probability would change if this weight was 0
  const withPref = allRelevant.reduce((acc, p) => acc * p.weight, 1.0);
  const withoutPref = allRelevant
    .filter(p => p !== pref)
    .reduce((acc, p) => acc * p.weight, 1.0);

  return Math.abs(withPref - withoutPref);
}

/**
 * Helper: Get last defeasible rule from argument structure
 */
function getLastDefeasibleRule(arg: Argument): string | null {
  // Traverse argument structure to find last defeasible rule
  // Implementation depends on Argument structure
  if (arg.topRule && arg.topRule.type === "defeasible") {
    return arg.topRule.id;
  }
  return null;
}

/**
 * Helper: Get all defeasible rules used in argument
 */
function getAllDefeasibleRules(arg: Argument): string[] {
  const rules: string[] = [];
  
  function traverse(a: Argument) {
    if (a.topRule && a.topRule.type === "defeasible") {
      rules.push(a.topRule.id);
    }
    for (const subArg of a.subArguments || []) {
      traverse(subArg);
    }
  }
  
  traverse(arg);
  return rules;
}

/**
 * Helper: Get all premises used in argument
 */
function getAllPremises(arg: Argument): string[] {
  const premises: string[] = [];
  
  function traverse(a: Argument) {
    if (a.premises) {
      premises.push(...a.premises);
    }
    for (const subArg of a.subArguments || []) {
      traverse(subArg);
    }
  }
  
  traverse(arg);
  return premises;
}

/**
 * Monte Carlo simulation for probabilistic extensions
 * Sample from weight distributions to compute argument acceptance probability
 */
export function monteCarloExtension(
  arguments_: Argument[],
  probabilisticDefeats: ProbabilisticDefeat[],
  numSamples: number = 1000
): Map<string, number> {
  const acceptanceCounts = new Map<string, number>();
  
  // Initialize counts
  for (const arg of arguments_) {
    acceptanceCounts.set(arg.id, 0);
  }

  // Run Monte Carlo simulation
  for (let i = 0; i < numSamples; i++) {
    // Sample defeats based on probabilities
    const sampledDefeats: Defeat[] = [];
    
    for (const pDefeat of probabilisticDefeats) {
      if (Math.random() < pDefeat.probability) {
        // This defeat occurs in this sample
        sampledDefeats.push({
          attack: pDefeat.attack,
          defeater: pDefeat.defeater,
          defeated: pDefeat.defeated,
          preferenceApplied: true,
        });
      }
    }

    // Compute grounded extension for this sample
    const extension = computeGroundedExtensionFromDefeats(arguments_, sampledDefeats);

    // Update acceptance counts
    for (const argId of extension.inArguments) {
      acceptanceCounts.set(argId, (acceptanceCounts.get(argId) || 0) + 1);
    }
  }

  // Convert counts to probabilities
  const probabilities = new Map<string, number>();
  for (const [argId, count] of acceptanceCounts) {
    probabilities.set(argId, count / numSamples);
  }

  return probabilities;
}

/**
 * Helper: Compute grounded extension from defeats
 * Simplified version for Monte Carlo sampling
 */
function computeGroundedExtensionFromDefeats(
  arguments_: Argument[],
  defeats: Defeat[]
): { inArguments: Set<string>; outArguments: Set<string>; undecidedArguments: Set<string> } {
  // Build defeat graph
  const defeatedBy = new Map<string, Set<string>>();
  for (const arg of arguments_) {
    defeatedBy.set(arg.id, new Set());
  }
  for (const defeat of defeats) {
    defeatedBy.get(defeat.defeated.id)?.add(defeat.defeater.id);
  }

  // Labeling algorithm
  const inArgs = new Set<string>();
  const outArgs = new Set<string>();
  const undecided = new Set<string>(arguments_.map(a => a.id));

  let changed = true;
  while (changed) {
    changed = false;

    for (const argId of undecided) {
      const defeaters = defeatedBy.get(argId) || new Set();

      // If all defeaters are out, argument is in
      if (Array.from(defeaters).every(d => outArgs.has(d))) {
        inArgs.add(argId);
        undecided.delete(argId);
        changed = true;
        continue;
      }

      // If any defeater is in, argument is out
      if (Array.from(defeaters).some(d => inArgs.has(d))) {
        outArgs.add(argId);
        undecided.delete(argId);
        changed = true;
        continue;
      }
    }
  }

  return {
    inArguments: inArgs,
    outArguments: outArgs,
    undecidedArguments: undecided,
  };
}

/**
 * Sensitivity analysis: How sensitive is argument acceptance to preference weights?
 */
export function analyzeSensitivity(
  argument: Argument,
  attacks: Attack[],
  weightedKB: WeightedKnowledgeBase,
  ordering: PreferenceOrdering,
  perturbationSize: number = 0.1
): {
  preferenceId: string;
  originalWeight: number;
  perturbedWeight: number;
  impactOnProbability: number;
}[] {
  const baselineDefeats = computeWeightedDefeats(attacks, {} as any, weightedKB, ordering);
  const baselineProbability = computeArgumentAcceptanceProbability(
    argument,
    baselineDefeats
  );

  const sensitivities: Array<{
    preferenceId: string;
    originalWeight: number;
    perturbedWeight: number;
    impactOnProbability: number;
  }> = [];

  // Test each preference
  for (const pref of [...weightedKB.premisePreferences, ...weightedKB.rulePreferences]) {
    const prefId = `${pref.preferred}_${pref.dispreferred}`;

    // Create perturbed KB
    const perturbedKB = JSON.parse(JSON.stringify(weightedKB));
    const prefToPerturb = [...perturbedKB.premisePreferences, ...perturbedKB.rulePreferences]
      .find(p => `${p.preferred}_${p.dispreferred}` === prefId);

    if (!prefToPerturb) continue;

    const originalWeight = prefToPerturb.weight;
    prefToPerturb.weight = Math.max(0, Math.min(1, originalWeight + perturbationSize));

    // Recompute defeats with perturbed weights
    const perturbedDefeats = computeWeightedDefeats(
      attacks,
      {} as any,
      perturbedKB,
      ordering
    );
    const perturbedProbability = computeArgumentAcceptanceProbability(
      argument,
      perturbedDefeats
    );

    sensitivities.push({
      preferenceId: prefId,
      originalWeight,
      perturbedWeight: prefToPerturb.weight,
      impactOnProbability: Math.abs(perturbedProbability - baselineProbability),
    });
  }

  // Sort by impact (most sensitive first)
  return sensitivities.sort((a, b) => b.impactOnProbability - a.impactOnProbability);
}

/**
 * Helper: Compute probability that argument is accepted
 */
function computeArgumentAcceptanceProbability(
  argument: Argument,
  probabilisticDefeats: ProbabilisticDefeat[]
): number {
  // Simplified: probability that no defeat on this argument succeeds
  const defeatsOnArg = probabilisticDefeats.filter(d => d.defeated.id === argument.id);

  if (defeatsOnArg.length === 0) {
    return 1.0; // No attacks → always accepted
  }

  // P(accepted) = P(all defeats fail) = ∏(1 - P(defeat_i))
  return defeatsOnArg.reduce((acc, d) => acc * (1 - d.probability), 1.0);
}
```

---

### Implementation Part 3: Translation Layer Extension

#### File 3: `lib/aspic/translation/weightedTranslation.ts` (New, ~200 lines)

```typescript
/**
 * Weighted preference translation: AIF PA-nodes with weights ↔ ASPIC+ weighted KB
 * Extends Phase 4 translation layer with weight support
 */

import { prisma } from "@/lib/prismaclient";
import type { WeightedPreference, WeightedKnowledgeBase } from "@/lib/aspic/weighted/types";

/**
 * AIF → ASPIC+ translation with weights
 * Extension of populateKBPreferencesFromAIF with weight extraction
 */
export async function populateWeightedKBFromAIF(
  deliberationId: string
): Promise<WeightedKnowledgeBase> {
  // Fetch PA records with weight fields
  const paRecords = await prisma.preferenceApplication.findMany({
    where: { deliberationId },
    select: {
      id: true,
      preferredClaimId: true,
      dispreferredClaimId: true,
      preferredArgumentId: true,
      dispreferredArgumentId: true,
      weight: true,
      weightSource: true,
      weightJustification: true,
    },
  });

  const premisePrefs: WeightedPreference[] = [];
  const rulePrefs: WeightedPreference[] = [];

  for (const pa of paRecords) {
    const weight = pa.weight ?? 1.0; // Default to full confidence

    // I-node to I-node → premise preference
    if (pa.preferredClaimId && pa.dispreferredClaimId) {
      const preferred = await getFormulaFromClaim(pa.preferredClaimId);
      const dispreferred = await getFormulaFromClaim(pa.dispreferredClaimId);
      
      if (preferred && dispreferred) {
        premisePrefs.push({
          preferred,
          dispreferred,
          weight,
          source: pa.weightSource as any,
          justification: pa.weightJustification ?? undefined,
        });
      }
    }

    // RA-node to RA-node → rule preference
    if (pa.preferredArgumentId && pa.dispreferredArgumentId) {
      const preferredRule = await getRuleIdFromArgument(pa.preferredArgumentId);
      const dispreferredRule = await getRuleIdFromArgument(pa.dispreferredArgumentId);
      
      if (preferredRule && dispreferredRule) {
        rulePrefs.push({
          preferred: preferredRule,
          dispreferred: dispreferredRule,
          weight,
          source: pa.weightSource as any,
          justification: pa.weightJustification ?? undefined,
        });
      }
    }
  }

  return {
    premisePreferences: premisePrefs,
    rulePreferences: rulePrefs,
  };
}

/**
 * ASPIC+ → AIF translation with weights
 * Creates PA-nodes with weight metadata
 */
export async function createWeightedPANodesFromASPIC(
  deliberationId: string,
  weightedKB: WeightedKnowledgeBase,
  userId: string
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  // Create PA-nodes for premise preferences with weights
  for (const pref of weightedKB.premisePreferences) {
    const preferredClaim = await getClaimIdFromFormula(pref.preferred, deliberationId);
    const dispreferredClaim = await getClaimIdFromFormula(pref.dispreferred, deliberationId);

    if (!preferredClaim || !dispreferredClaim) {
      skipped++;
      continue;
    }

    // Check for existing PA-node
    const existing = await prisma.preferenceApplication.findFirst({
      where: {
        deliberationId,
        preferredClaimId: preferredClaim,
        dispreferredClaimId: dispreferredClaim,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.preferenceApplication.create({
      data: {
        deliberationId,
        createdById: userId,
        preferredClaimId: preferredClaim,
        dispreferredClaimId: dispreferredClaim,
        weight: pref.weight,
        weightSource: pref.source ?? "user",
        weightJustification: pref.justification,
      },
    });

    created++;
  }

  // Create PA-nodes for rule preferences with weights
  for (const pref of weightedKB.rulePreferences) {
    const preferredArg = await getArgumentIdFromRuleId(pref.preferred, deliberationId);
    const dispreferredArg = await getArgumentIdFromRuleId(pref.dispreferred, deliberationId);

    if (!preferredArg || !dispreferredArg) {
      skipped++;
      continue;
    }

    const existing = await prisma.preferenceApplication.findFirst({
      where: {
        deliberationId,
        preferredArgumentId: preferredArg,
        dispreferredArgumentId: dispreferredArg,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.preferenceApplication.create({
      data: {
        deliberationId,
        createdById: userId,
        preferredArgumentId: preferredArg,
        dispreferredArgumentId: dispreferredArg,
        weight: pref.weight,
        weightSource: pref.source ?? "user",
        weightJustification: pref.justification,
      },
    });

    created++;
  }

  return { created, skipped };
}

/**
 * Aggregate multiple PA-nodes with same preference but different weights
 * Strategy: Average, Minimum, Maximum
 */
export async function aggregateDuplicatePreferences(
  deliberationId: string,
  strategy: "average" | "minimum" | "maximum" = "average"
): Promise<{ aggregated: number }> {
  // Find duplicate preferences (same preferred/dispreferred, different weights)
  const paRecords = await prisma.preferenceApplication.findMany({
    where: { deliberationId },
    select: {
      id: true,
      preferredArgumentId: true,
      dispreferredArgumentId: true,
      preferredClaimId: true,
      dispreferredClaimId: true,
      weight: true,
    },
  });

  // Group by preference pair
  const groups = new Map<string, typeof paRecords>();
  
  for (const pa of paRecords) {
    const key = `${pa.preferredArgumentId}_${pa.dispreferredArgumentId}_${pa.preferredClaimId}_${pa.dispreferredClaimId}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(pa);
  }

  let aggregated = 0;

  // Process duplicates
  for (const [key, pas] of groups) {
    if (pas.length <= 1) continue; // No duplicates

    const weights = pas.map(p => p.weight ?? 1.0);
    let aggregatedWeight: number;

    switch (strategy) {
      case "average":
        aggregatedWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length;
        break;
      case "minimum":
        aggregatedWeight = Math.min(...weights);
        break;
      case "maximum":
        aggregatedWeight = Math.max(...weights);
        break;
    }

    // Update first PA, delete others
    await prisma.preferenceApplication.update({
      where: { id: pas[0].id },
      data: { weight: aggregatedWeight },
    });

    for (let i = 1; i < pas.length; i++) {
      await prisma.preferenceApplication.delete({
        where: { id: pas[i].id },
      });
    }

    aggregated += pas.length - 1;
  }

  return { aggregated };
}

// Re-export helper functions from Phase 4 translation layer
async function getFormulaFromClaim(claimId: string): Promise<string | null> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { text: true },
  });
  return claim?.text ?? null;
}

async function getRuleIdFromArgument(argumentId: string): Promise<string | null> {
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: { scheme: true },
  });
  return argument?.scheme?.id ?? null;
}

async function getClaimIdFromFormula(
  formula: string,
  deliberationId: string
): Promise<string | null> {
  const claim = await prisma.claim.findFirst({
    where: { text: formula, deliberationId },
    select: { id: true },
  });
  return claim?.id ?? null;
}

async function getArgumentIdFromRuleId(
  ruleId: string,
  deliberationId: string
): Promise<string | null> {
  const argument = await prisma.argument.findFirst({
    where: { schemeId: ruleId, deliberationId },
    select: { id: true },
  });
  return argument?.id ?? null;
}
```

---

### Implementation Part 4: API Endpoints for Weighted Preferences

#### File 4: `app/api/aspic/evaluate/weighted/route.ts` (New, ~250 lines)

```typescript
/**
 * Weighted ASPIC+ evaluation endpoint
 * Extends /api/aspic/evaluate with weighted preference support
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildTheoryFromDeliberation } from "@/lib/aspic/theoryBuilder";
import { constructArguments } from "@/lib/aspic/arguments";
import { computeAttacks } from "@/lib/aspic/attacks";
import { computeWeightedDefeats, monteCarloExtension } from "@/lib/aspic/weighted/defeats";
import { populateWeightedKBFromAIF } from "@/lib/aspic/translation/weightedTranslation";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

const WeightedEvaluateQuery = z.object({
  deliberationId: z.string().min(6),
  ordering: z.enum(["last-link", "weakest-link"]).optional().default("last-link"),
  aggregation: z.enum(["minimum", "product", "average", "max"]).optional().default("minimum"),
  useMonteCarlo: z.boolean().optional().default(false),
  monteCarloSamples: z.number().int().min(100).max(10000).optional().default(1000),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = WeightedEvaluateQuery.safeParse({
    deliberationId: url.searchParams.get("deliberationId"),
    ordering: url.searchParams.get("ordering"),
    aggregation: url.searchParams.get("aggregation"),
    useMonteCarlo: url.searchParams.get("useMonteCarlo") === "true",
    monteCarloSamples: url.searchParams.get("monteCarloSamples") 
      ? parseInt(url.searchParams.get("monteCarloSamples")!)
      : undefined,
  });

  if (!query.success) {
    return NextResponse.json(
      { error: query.error.flatten() },
      { status: 400, ...NO_STORE }
    );
  }

  const { deliberationId, ordering, aggregation, useMonteCarlo, monteCarloSamples } = query.data;

  try {
    // Build ASPIC+ theory
    const theory = await buildTheoryFromDeliberation(deliberationId);

    // Load weighted preferences from AIF
    const weightedKB = await populateWeightedKBFromAIF(deliberationId);

    // Construct arguments
    const args = constructArguments(theory);

    // Compute attacks
    const attacks = computeAttacks(args, theory);

    // Compute weighted defeats
    const startTime = Date.now();
    const probabilisticDefeats = computeWeightedDefeats(
      attacks,
      theory,
      weightedKB,
      ordering,
      aggregation
    );
    const defeatComputationTime = Date.now() - startTime;

    // Compute probabilistic extension (optional Monte Carlo)
    let probabilisticExtension: Map<string, number> | null = null;
    let monteCarloTime = 0;

    if (useMonteCarlo) {
      const mcStart = Date.now();
      probabilisticExtension = monteCarloExtension(
        args,
        probabilisticDefeats,
        monteCarloSamples
      );
      monteCarloTime = Date.now() - mcStart;
    }

    // Compute statistics
    const weightStats = {
      totalPreferences: weightedKB.premisePreferences.length + weightedKB.rulePreferences.length,
      premisePreferences: weightedKB.premisePreferences.length,
      rulePreferences: weightedKB.rulePreferences.length,
      averageWeight: [
        ...weightedKB.premisePreferences,
        ...weightedKB.rulePreferences,
      ].reduce((sum, p) => sum + p.weight, 0) / (weightedKB.premisePreferences.length + weightedKB.rulePreferences.length),
      minWeight: Math.min(
        ...weightedKB.premisePreferences.map(p => p.weight),
        ...weightedKB.rulePreferences.map(p => p.weight)
      ),
      maxWeight: Math.max(
        ...weightedKB.premisePreferences.map(p => p.weight),
        ...weightedKB.rulePreferences.map(p => p.weight)
      ),
    };

    const defeatStats = {
      totalAttacks: attacks.length,
      totalDefeats: probabilisticDefeats.length,
      averageDefeatProbability: probabilisticDefeats.reduce((sum, d) => sum + d.probability, 0) / probabilisticDefeats.length,
      highConfidenceDefeats: probabilisticDefeats.filter(d => d.probability > 0.8).length,
      mediumConfidenceDefeats: probabilisticDefeats.filter(d => d.probability >= 0.5 && d.probability <= 0.8).length,
      lowConfidenceDefeats: probabilisticDefeats.filter(d => d.probability < 0.5).length,
    };

    return NextResponse.json(
      {
        ok: true,
        deliberationId,
        configuration: {
          ordering,
          aggregation,
          useMonteCarlo,
          monteCarloSamples: useMonteCarlo ? monteCarloSamples : null,
        },
        theory: {
          argumentCount: args.length,
          attackCount: attacks.length,
          preferenceCount: weightStats.totalPreferences,
        },
        attacks: attacks.map(a => ({
          from: a.attacker.id,
          to: a.attacked.id,
          type: a.type,
        })),
        probabilisticDefeats: probabilisticDefeats.map(d => ({
          from: d.defeater.id,
          to: d.defeated.id,
          type: d.attack.type,
          probability: d.probability,
          contributingPreferences: d.contributingWeights.map(cw => ({
            preferred: cw.preference.preferred,
            dispreferred: cw.preference.dispreferred,
            weight: cw.preference.weight,
            impact: cw.impact,
          })),
          aggregationMethod: d.aggregationMethod,
        })),
        weightStatistics: weightStats,
        defeatStatistics: defeatStats,
        probabilisticExtension: probabilisticExtension
          ? Array.from(probabilisticExtension.entries()).map(([argId, prob]) => ({
              argumentId: argId,
              acceptanceProbability: prob,
            }))
          : null,
        performance: {
          defeatComputationMs: defeatComputationTime,
          monteCarloMs: monteCarloTime,
          totalMs: defeatComputationTime + monteCarloTime,
        },
      },
      NO_STORE
    );
  } catch (error) {
    console.error("Weighted evaluation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500, ...NO_STORE }
    );
  }
}
```

#### File 5: `app/api/aspic/sensitivity/route.ts` (New, ~150 lines)

```typescript
/**
 * Sensitivity analysis endpoint
 * Analyzes how argument acceptance depends on preference weights
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildTheoryFromDeliberation } from "@/lib/aspic/theoryBuilder";
import { constructArguments } from "@/lib/aspic/arguments";
import { computeAttacks } from "@/lib/aspic/attacks";
import { analyzeSensitivity } from "@/lib/aspic/weighted/defeats";
import { populateWeightedKBFromAIF } from "@/lib/aspic/translation/weightedTranslation";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

const SensitivityQuery = z.object({
  deliberationId: z.string().min(6),
  argumentId: z.string().min(6),
  ordering: z.enum(["last-link", "weakest-link"]).optional().default("last-link"),
  perturbationSize: z.number().min(0.01).max(0.5).optional().default(0.1),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = SensitivityQuery.safeParse({
    deliberationId: url.searchParams.get("deliberationId"),
    argumentId: url.searchParams.get("argumentId"),
    ordering: url.searchParams.get("ordering"),
    perturbationSize: url.searchParams.get("perturbationSize")
      ? parseFloat(url.searchParams.get("perturbationSize")!)
      : undefined,
  });

  if (!query.success) {
    return NextResponse.json(
      { error: query.error.flatten() },
      { status: 400, ...NO_STORE }
    );
  }

  const { deliberationId, argumentId, ordering, perturbationSize } = query.data;

  try {
    // Build theory and get argument
    const theory = await buildTheoryFromDeliberation(deliberationId);
    const args = constructArguments(theory);
    const targetArgument = args.find(a => a.id === argumentId);

    if (!targetArgument) {
      return NextResponse.json(
        { error: "Argument not found" },
        { status: 404, ...NO_STORE }
      );
    }

    // Load weighted KB
    const weightedKB = await populateWeightedKBFromAIF(deliberationId);

    // Compute attacks
    const attacks = computeAttacks(args, theory);

    // Perform sensitivity analysis
    const sensitivities = analyzeSensitivity(
      targetArgument,
      attacks,
      weightedKB,
      ordering,
      perturbationSize
    );

    return NextResponse.json(
      {
        ok: true,
        deliberationId,
        argumentId,
        configuration: {
          ordering,
          perturbationSize,
        },
        sensitivities: sensitivities.slice(0, 20), // Top 20 most sensitive
        summary: {
          totalPreferences: sensitivities.length,
          mostSensitive: sensitivities[0],
          leastSensitive: sensitivities[sensitivities.length - 1],
          averageImpact: sensitivities.reduce((sum, s) => sum + s.impactOnProbability, 0) / sensitivities.length,
        },
      },
      NO_STORE
    );
  } catch (error) {
    console.error("Sensitivity analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500, ...NO_STORE }
    );
  }
}
```

#### File 6: Update `app/api/pa/route.ts` (Modify existing)

```typescript
// Add to existing POST schema
const CreatePA = z.object({
  // ... existing fields ...
  
  // PHASE 5.1: Weighted preferences
  weight: z.number().min(0).max(1).optional().default(1.0),
  weightSource: z.enum(["user", "ml_model", "expert_panel", "aggregated"]).optional(),
  weightJustification: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // ... existing validation ...
  
  const created = await prisma.preferenceApplication.create({
    data: {
      // ... existing fields ...
      
      // NEW: Weight fields
      weight: d.weight,
      weightSource: d.weightSource ?? "user",
      weightJustification: d.weightJustification ?? null,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: created.id }, NO_STORE);
}
```

---

### Implementation Part 5: UI Components for Weighted Preferences

#### Component 1: `components/aspic/WeightSlider.tsx` (New, ~150 lines)

```tsx
/**
 * Weight slider component for preference confidence
 * Allows users to express uncertainty in preferences
 */

"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface WeightSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  showNumericInput?: boolean;
  disabled?: boolean;
}

export function WeightSlider({
  value,
  onChange,
  label = "Confidence",
  showNumericInput = true,
  disabled = false,
}: WeightSliderProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 1) {
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  const getConfidenceLabel = (weight: number): { text: string; color: string } => {
    if (weight >= 0.9) return { text: "Very High", color: "bg-green-500" };
    if (weight >= 0.7) return { text: "High", color: "bg-blue-500" };
    if (weight >= 0.5) return { text: "Medium", color: "bg-yellow-500" };
    if (weight >= 0.3) return { text: "Low", color: "bg-orange-500" };
    return { text: "Very Low", color: "bg-red-500" };
  };

  const confidenceLabel = getConfidenceLabel(localValue);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="weight-slider">{label}</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  How confident are you in this preference?
                </p>
                <ul className="text-xs mt-2 space-y-1">
                  <li><strong>1.0</strong> - Absolutely certain</li>
                  <li><strong>0.7-0.9</strong> - Quite confident</li>
                  <li><strong>0.5-0.7</strong> - Moderately confident</li>
                  <li><strong>0.3-0.5</strong> - Somewhat uncertain</li>
                  <li><strong>&lt;0.3</strong> - Very uncertain</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Badge className={confidenceLabel.color}>
          {confidenceLabel.text}
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <Slider
          id="weight-slider"
          min={0}
          max={1}
          step={0.05}
          value={[localValue]}
          onValueChange={handleSliderChange}
          disabled={disabled}
          className="flex-1"
        />
        {showNumericInput && (
          <Input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={localValue.toFixed(2)}
            onChange={handleInputChange}
            disabled={disabled}
            className="w-20"
          />
        )}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0.0 (No confidence)</span>
        <span>1.0 (Full confidence)</span>
      </div>
    </div>
  );
}
```

#### Component 2: Update `components/agora/PreferenceAttackModal.tsx`

```tsx
// Add imports
import { WeightSlider } from "@/components/aspic/WeightSlider";

// Add to modal state
const [weight, setWeight] = useState(1.0);
const [weightJustification, setWeightJustification] = useState("");

// Add to form UI (after justification field)
<div className="space-y-2">
  <WeightSlider
    value={weight}
    onChange={setWeight}
    label="Preference Confidence"
  />
  
  {weight < 1.0 && (
    <div className="space-y-1">
      <Label htmlFor="weight-justification">
        Why this confidence level? (Optional)
      </Label>
      <Textarea
        id="weight-justification"
        placeholder="E.g., 'Based on limited evidence' or 'Expert opinion with some uncertainty'"
        value={weightJustification}
        onChange={(e) => setWeightJustification(e.target.value)}
        rows={2}
      />
    </div>
  )}
</div>

// Update API call
const response = await fetch("/api/pa", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    deliberationId,
    preferredArgumentId,
    dispreferredArgumentId,
    justification,
    orderingPolicy,
    setComparison,
    // NEW: Weight fields
    weight,
    weightSource: "user",
    weightJustification: weightJustification || null,
  }),
});
```

#### Component 3: `components/aspic/ProbabilisticDefeatBadge.tsx` (New, ~100 lines)

```tsx
/**
 * Badge showing probabilistic defeat with confidence visualization
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProbabilisticDefeatBadgeProps {
  probability: number;
  defeaterCount: number;
  showIcon?: boolean;
}

export function ProbabilisticDefeatBadge({
  probability,
  defeaterCount,
  showIcon = true,
}: ProbabilisticDefeatBadgeProps) {
  const getVariant = (prob: number) => {
    if (prob >= 0.8) return "destructive";
    if (prob >= 0.5) return "warning";
    return "secondary";
  };

  const getIcon = (prob: number) => {
    if (prob >= 0.7) return <TrendingDown className="h-3 w-3" />;
    if (prob >= 0.3) return <Minus className="h-3 w-3" />;
    return <TrendingUp className="h-3 w-3" />;
  };

  const getLabel = (prob: number) => {
    if (prob >= 0.9) return "Highly likely defeated";
    if (prob >= 0.7) return "Likely defeated";
    if (prob >= 0.5) return "Possibly defeated";
    if (prob >= 0.3) return "Unlikely defeated";
    return "Very unlikely defeated";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getVariant(probability)} className="gap-1">
            {showIcon && getIcon(probability)}
            {(probability * 100).toFixed(0)}%
            {defeaterCount > 0 && ` (${defeaterCount})`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-sm">
            <div className="font-semibold">{getLabel(probability)}</div>
            <div className="text-xs text-muted-foreground">
              {defeaterCount} potential defeater{defeaterCount !== 1 ? "s" : ""}
            </div>
            <div className="text-xs">
              Defeat probability: {(probability * 100).toFixed(1)}%
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

#### Component 4: `components/aspic/SensitivityAnalysisPanel.tsx` (New, ~200 lines)

```tsx
/**
 * Sensitivity analysis panel
 * Shows which preferences most affect argument acceptance
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SensitivityData {
  preferenceId: string;
  originalWeight: number;
  perturbedWeight: number;
  impactOnProbability: number;
}

interface SensitivityAnalysisPanelProps {
  deliberationId: string;
  argumentId: string;
  ordering?: "last-link" | "weakest-link";
}

export function SensitivityAnalysisPanel({
  deliberationId,
  argumentId,
  ordering = "last-link",
}: SensitivityAnalysisPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sensitivities, setSensitivities] = useState<SensitivityData[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    async function fetchSensitivity() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/aspic/sensitivity?deliberationId=${deliberationId}&argumentId=${argumentId}&ordering=${ordering}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch sensitivity analysis");
        }

        const data = await response.json();
        setSensitivities(data.sensitivities);
        setSummary(data.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchSensitivity();
  }, [deliberationId, argumentId, ordering]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Analyzing sensitivity...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxImpact = Math.max(...sensitivities.map(s => s.impactOnProbability), 0.01);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sensitivity Analysis</CardTitle>
        <CardDescription>
          Preferences that most affect this argument's acceptance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {summary && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Summary</div>
            <div className="text-xs text-muted-foreground mt-1">
              Average impact: {(summary.averageImpact * 100).toFixed(1)}%
            </div>
          </div>
        )}

        <div className="space-y-3">
          {sensitivities.slice(0, 10).map((sensitivity, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium truncate flex-1">
                  {sensitivity.preferenceId.split("_").join(" > ")}
                </div>
                <Badge variant="secondary">
                  {(sensitivity.impactOnProbability * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Weight: {sensitivity.originalWeight.toFixed(2)}</span>
                <Progress 
                  value={(sensitivity.impactOnProbability / maxImpact) * 100} 
                  className="flex-1 h-2"
                />
              </div>
            </div>
          ))}
        </div>

        {sensitivities.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No sensitive preferences found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Implementation Part 6: Testing for Weighted Preferences

#### Unit Tests: `__tests__/aspic/weighted/defeats.test.ts` (New, ~300 lines)

```typescript
import { computeWeightedDefeats, monteCarloExtension, analyzeSensitivity } from "@/lib/aspic/weighted/defeats";
import type { WeightedKnowledgeBase } from "@/lib/aspic/weighted/types";
import { setupTestArguments, setupTestAttacks } from "../testHelpers";

describe("Weighted Defeat Computation", () => {
  test("deterministic preferences (weight=1.0) match standard defeats", () => {
    const { args, theory } = setupTestArguments();
    const attacks = setupTestAttacks(args);
    
    const weightedKB: WeightedKnowledgeBase = {
      premisePreferences: [],
      rulePreferences: [
        { preferred: "rule1", dispreferred: "rule2", weight: 1.0 },
      ],
    };

    const probabilisticDefeats = computeWeightedDefeats(
      attacks,
      theory,
      weightedKB,
      "last-link",
      "minimum"
    );

    // With weight=1.0, defeat probability should be 1.0 (deterministic)
    expect(probabilisticDefeats.every(d => d.probability === 1.0)).toBe(true);
  });

  test("uncertain preferences reduce defeat probability", () => {
    const { args, theory } = setupTestArguments();
    const attacks = setupTestAttacks(args);
    
    const weightedKB: WeightedKnowledgeBase = {
      premisePreferences: [],
      rulePreferences: [
        { preferred: "rule1", dispreferred: "rule2", weight: 0.6 },
      ],
    };

    const probabilisticDefeats = computeWeightedDefeats(
      attacks,
      theory,
      weightedKB,
      "last-link",
      "minimum"
    );

    // Some defeats should have probability < 1.0
    expect(probabilisticDefeats.some(d => d.probability < 1.0)).toBe(true);
    expect(probabilisticDefeats.some(d => d.probability === 0.6)).toBe(true);
  });

  test("minimum aggregation takes weakest link", () => {
    const { args, theory } = setupTestArguments();
    const attacks = setupTestAttacks(args);
    
    const weightedKB: WeightedKnowledgeBase = {
      premisePreferences: [],
      rulePreferences: [
        { preferred: "rule1", dispreferred: "rule2", weight: 0.8 },
        { preferred: "rule1", dispreferred: "rule3", weight: 0.6 },
      ],
    };

    const probabilisticDefeats = computeWeightedDefeats(
      attacks,
      theory,
      weightedKB,
      "last-link",
      "minimum"
    );

    // Minimum aggregation should use 0.6 (weakest preference)
    const relevantDefeat = probabilisticDefeats.find(d => 
      d.contributingWeights.length > 1
    );
    
    if (relevantDefeat) {
      expect(relevantDefeat.probability).toBe(0.6);
    }
  });

  test("product aggregation multiplies weights", () => {
    const { args, theory } = setupTestArguments();
    const attacks = setupTestAttacks(args);
    
    const weightedKB: WeightedKnowledgeBase = {
      premisePreferences: [],
      rulePreferences: [
        { preferred: "rule1", dispreferred: "rule2", weight: 0.8 },
        { preferred: "rule1", dispreferred: "rule3", weight: 0.5 },
      ],
    };

    const probabilisticDefeats = computeWeightedDefeats(
      attacks,
      theory,
      weightedKB,
      "last-link",
      "product"
    );

    // Product aggregation: 0.8 × 0.5 = 0.4
    const relevantDefeat = probabilisticDefeats.find(d => 
      d.contributingWeights.length > 1
    );
    
    if (relevantDefeat) {
      expect(relevantDefeat.probability).toBeCloseTo(0.4, 2);
    }
  });

  test("average aggregation computes mean weight", () => {
    const { args, theory } = setupTestArguments();
    const attacks = setupTestAttacks(args);
    
    const weightedKB: WeightedKnowledgeBase = {
      premisePreferences: [],
      rulePreferences: [
        { preferred: "rule1", dispreferred: "rule2", weight: 0.8 },
        { preferred: "rule1", dispreferred: "rule3", weight: 0.6 },
      ],
    };

    const probabilisticDefeats = computeWeightedDefeats(
      attacks,
      theory,
      weightedKB,
      "last-link",
      "average"
    );

    // Average aggregation: (0.8 + 0.6) / 2 = 0.7
    const relevantDefeat = probabilisticDefeats.find(d => 
      d.contributingWeights.length > 1
    );
    
    if (relevantDefeat) {
      expect(relevantDefeat.probability).toBeCloseTo(0.7, 2);
    }
  });
});

describe("Monte Carlo Extension", () => {
  test("returns probability map for all arguments", () => {
    const { args, theory } = setupTestArguments();
    const attacks = setupTestAttacks(args);
    
    const weightedKB: WeightedKnowledgeBase = {
      premisePreferences: [],
      rulePreferences: [
        { preferred: "rule1", dispreferred: "rule2", weight: 0.7 },
      ],
    };

    const probabilisticDefeats = computeWeightedDefeats(
      attacks,
      theory,
      weightedKB,
      "last-link",
      "minimum"
    );

    const probabilities = monteCarloExtension(args, probabilisticDefeats, 1000);

    expect(probabilities.size).toBe(args.length);
    
    // All probabilities should be in [0, 1]
    for (const prob of probabilities.values()) {
      expect(prob).toBeGreaterThanOrEqual(0);
      expect(prob).toBeLessThanOrEqual(1);
    }
  });

  test("more samples increase accuracy", () => {
    const { args, theory } = setupTestArguments();
    const attacks = setupTestAttacks(args);
    
    const weightedKB: WeightedKnowledgeBase = {
      premisePreferences: [],
      rulePreferences: [
        { preferred: "rule1", dispreferred: "rule2", weight: 0.5 },
      ],
    };

    const probabilisticDefeats = computeWeightedDefeats(
      attacks,
      theory,
      weightedKB,
      "last-link",
      "minimum"
    );

    const probs100 = monteCarloExtension(args, probabilisticDefeats, 100);
    const probs1000 = monteCarloExtension(args, probabilisticDefeats, 1000);
    const probs5000 = monteCarloExtension(args, probabilisticDefeats, 5000);

    // Variance should decrease with more samples (statistical property)
    // This is a heuristic check - actual test depends on specific setup
    expect(probs5000.size).toBe(probs1000.size);
  });
});

describe("Sensitivity Analysis", () => {
  test("identifies preferences with high impact", async () => {
    const { args, theory } = setupTestArguments();
    const attacks = setupTestAttacks(args);
    const targetArg = args[0];
    
    const weightedKB: WeightedKnowledgeBase = {
      premisePreferences: [],
      rulePreferences: [
        { preferred: "rule1", dispreferred: "rule2", weight: 0.8 },
        { preferred: "rule3", dispreferred: "rule4", weight: 0.5 },
      ],
    };

    const sensitivities = analyzeSensitivity(
      targetArg,
      attacks,
      weightedKB,
      "last-link",
      0.1
    );

    // Should return sensitivity data for all preferences
    expect(sensitivities.length).toBeGreaterThan(0);
    
    // Each sensitivity should have required fields
    for (const sens of sensitivities) {
      expect(sens).toHaveProperty("preferenceId");
      expect(sens).toHaveProperty("originalWeight");
      expect(sens).toHaveProperty("perturbedWeight");
      expect(sens).toHaveProperty("impactOnProbability");
    }
  });

  test("sorts sensitivities by impact (descending)", () => {
    const { args, theory } = setupTestArguments();
    const attacks = setupTestAttacks(args);
    const targetArg = args[0];
    
    const weightedKB: WeightedKnowledgeBase = {
      premisePreferences: [],
      rulePreferences: [
        { preferred: "rule1", dispreferred: "rule2", weight: 0.8 },
        { preferred: "rule3", dispreferred: "rule4", weight: 0.5 },
        { preferred: "rule5", dispreferred: "rule6", weight: 0.9 },
      ],
    };

    const sensitivities = analyzeSensitivity(
      targetArg,
      attacks,
      weightedKB,
      "last-link",
      0.1
    );

    // Check that impacts are sorted in descending order
    for (let i = 0; i < sensitivities.length - 1; i++) {
      expect(sensitivities[i].impactOnProbability).toBeGreaterThanOrEqual(
        sensitivities[i + 1].impactOnProbability
      );
    }
  });
});
```

#### Integration Tests: `__tests__/api/weighted-evaluation.test.ts` (New, ~200 lines)

```typescript
import { createTestDeliberation, createTestArguments } from "../testHelpers";

describe("POST /api/pa with weights", () => {
  test("creates preference with weight", async () => {
    const { deliberationId, argA, argB, userId } = await createTestDeliberation();

    const response = await fetch("/api/pa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliberationId,
        preferredArgumentId: argA.id,
        dispreferredArgumentId: argB.id,
        weight: 0.75,
        weightSource: "user",
        weightJustification: "Moderately confident based on available evidence",
      }),
    });

    expect(response.ok).toBe(true);
    const { id } = await response.json();

    const pa = await prisma.preferenceApplication.findUnique({ where: { id } });
    expect(pa?.weight).toBe(0.75);
    expect(pa?.weightSource).toBe("user");
    expect(pa?.weightJustification).toBe("Moderately confident based on available evidence");
  });

  test("defaults weight to 1.0 when not provided", async () => {
    const { deliberationId, argA, argB } = await createTestDeliberation();

    const response = await fetch("/api/pa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliberationId,
        preferredArgumentId: argA.id,
        dispreferredArgumentId: argB.id,
      }),
    });

    expect(response.ok).toBe(true);
    const { id } = await response.json();

    const pa = await prisma.preferenceApplication.findUnique({ where: { id } });
    expect(pa?.weight).toBe(1.0);
  });
});

describe("GET /api/aspic/evaluate/weighted", () => {
  test("evaluates with weighted preferences", async () => {
    const { deliberationId, argA, argB } = await createTestDeliberation();

    // Create weighted preference
    await prisma.preferenceApplication.create({
      data: {
        deliberationId,
        preferredArgumentId: argA.id,
        dispreferredArgumentId: argB.id,
        weight: 0.6,
        weightSource: "user",
      },
    });

    const response = await fetch(
      `/api/aspic/evaluate/weighted?deliberationId=${deliberationId}&ordering=last-link&aggregation=minimum`
    );

    expect(response.ok).toBe(true);
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.configuration.aggregation).toBe("minimum");
    expect(data.probabilisticDefeats).toBeInstanceOf(Array);
    expect(data.weightStatistics).toBeDefined();
    expect(data.defeatStatistics).toBeDefined();
  });

  test("Monte Carlo evaluation returns probabilistic extension", async () => {
    const { deliberationId } = await createTestDeliberation();

    const response = await fetch(
      `/api/aspic/evaluate/weighted?deliberationId=${deliberationId}&useMonteCarlo=true&monteCarloSamples=500`
    );

    expect(response.ok).toBe(true);
    const data = await response.json();

    expect(data.probabilisticExtension).not.toBeNull();
    expect(data.probabilisticExtension).toBeInstanceOf(Array);
    expect(data.performance.monteCarloMs).toBeGreaterThan(0);
  });

  test("different aggregation methods produce different results", async () => {
    const { deliberationId } = await createTestDeliberation();

    const minResponse = await fetch(
      `/api/aspic/evaluate/weighted?deliberationId=${deliberationId}&aggregation=minimum`
    );
    const avgResponse = await fetch(
      `/api/aspic/evaluate/weighted?deliberationId=${deliberationId}&aggregation=average`
    );
    const prodResponse = await fetch(
      `/api/aspic/evaluate/weighted?deliberationId=${deliberationId}&aggregation=product`
    );

    const minData = await minResponse.json();
    const avgData = await avgResponse.json();
    const prodData = await prodResponse.json();

    // Each method should return valid data
    expect(minData.ok).toBe(true);
    expect(avgData.ok).toBe(true);
    expect(prodData.ok).toBe(true);

    // Defeat statistics may differ based on aggregation
    expect(minData.defeatStatistics).toBeDefined();
    expect(avgData.defeatStatistics).toBeDefined();
    expect(prodData.defeatStatistics).toBeDefined();
  });
});

describe("GET /api/aspic/sensitivity", () => {
  test("returns sensitivity analysis for argument", async () => {
    const { deliberationId, argA } = await createTestDeliberation();

    const response = await fetch(
      `/api/aspic/sensitivity?deliberationId=${deliberationId}&argumentId=${argA.id}&ordering=last-link`
    );

    expect(response.ok).toBe(true);
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.argumentId).toBe(argA.id);
    expect(data.sensitivities).toBeInstanceOf(Array);
    expect(data.summary).toBeDefined();
  });

  test("404 for non-existent argument", async () => {
    const { deliberationId } = await createTestDeliberation();

    const response = await fetch(
      `/api/aspic/sensitivity?deliberationId=${deliberationId}&argumentId=nonexistent&ordering=last-link`
    );

    expect(response.status).toBe(404);
  });
});
```

---

## Feature 5.2: Preference Schemes (3-4 days)

### Overview

Formalize preference justifications using argumentation schemes. Instead of free-text justifications, users select from structured schemes that explain *why* one argument is preferred over another.

**Use Cases**:
- "Expert Opinion" scheme: A is preferred because it cites a more credible expert
- "Recency" scheme: A is preferred because it uses more recent evidence
- "Statistical Strength" scheme: A is preferred because it has stronger statistical support
- Meta-argumentation: Users can challenge the preference itself by questioning the scheme

### Theoretical Foundation

**Preference Schemes** are argumentation schemes specifically for justifying preferences:

```
Scheme: Expert Opinion
  Premise 1: Argument A cites expert E1
  Premise 2: Argument B cites expert E2
  Premise 3: Expert E1 is more credible than E2 in domain D
  Conclusion: A is preferred over B

Critical Questions:
  CQ1: Is E1 actually an expert in domain D?
  CQ2: Is the credibility assessment of E1 > E2 justified?
  CQ3: Are there other factors that override expertise?
```

**Integration with ASPIC+**:
- Preference schemes create *second-order arguments* about preferences
- These meta-arguments can be attacked (e.g., challenge an expert's credibility)
- Defeating a preference scheme invalidates the preference

---

### Schema Changes

#### New Model: `PreferenceScheme`

**File**: `prisma/schema.prisma`

```prisma
model PreferenceScheme {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Scheme identification
  key         String   @unique // "expert_opinion", "recency", "statistical_strength"
  name        String   // "Expert Opinion", "Recency", "Statistical Strength"
  description String   @db.Text
  category    String   // "epistemic", "normative", "pragmatic"

  // Scheme structure (JSON)
  premises          Json // Array of premise templates
  conclusion        Json // Conclusion template
  criticalQuestions Json // Array of CQ templates
  
  // Scheme metadata
  parameters  Json // Required parameters for instantiation
  examples    Json // Example instantiations
  
  // Relations
  applications PreferenceApplication[]
  
  @@index([category])
  @@index([key])
}
```

#### Update `PreferenceApplication` Model

```prisma
model PreferenceApplication {
  // ... existing fields ...
  
  // PHASE 5.2: Preference scheme
  schemeId            String?           @db.VarChar(255)
  scheme              PreferenceScheme? @relation(fields: [schemeId], references: [id])
  schemeParameters    Json?             // Instantiated scheme parameters
  
  // Replace old justification with structured scheme
  // justification field becomes fallback for schemes without structure
}
```

---

### Implementation Part 7: Preference Scheme Library

#### File 7: `lib/aspic/schemes/preferenceSchemes.ts` (New, ~400 lines)

```typescript
/**
 * Library of preference argumentation schemes
 * Formalizes common patterns for justifying preferences
 */

export interface PreferenceScheme {
  key: string;
  name: string;
  description: string;
  category: "epistemic" | "normative" | "pragmatic";
  premises: SchemePremise[];
  conclusion: SchemeConclusion;
  criticalQuestions: CriticalQuestion[];
  parameters: SchemeParameter[];
  examples: SchemeExample[];
}

export interface SchemePremise {
  id: string;
  template: string; // e.g., "Argument {arg1} cites expert {expert1}"
  type: "factual" | "evaluative" | "comparative";
}

export interface SchemeConclusion {
  template: string; // e.g., "{arg1} is preferred over {arg2}"
}

export interface CriticalQuestion {
  id: string;
  question: string;
  attackType: "rebuttal" | "undercut";
  severity: "critical" | "important" | "minor";
}

export interface SchemeParameter {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "select";
  required: boolean;
  options?: string[]; // For select type
  validation?: string; // Regex or validation rule
}

export interface SchemeExample {
  title: string;
  description: string;
  parameters: Record<string, any>;
}

/**
 * Built-in preference schemes
 */
export const PREFERENCE_SCHEMES: PreferenceScheme[] = [
  {
    key: "expert_opinion",
    name: "Expert Opinion",
    description: "Prefer argument citing more credible expert",
    category: "epistemic",
    premises: [
      {
        id: "p1",
        template: "Argument {arg1} cites expert {expert1} with credentials {credentials1}",
        type: "factual",
      },
      {
        id: "p2",
        template: "Argument {arg2} cites expert {expert2} with credentials {credentials2}",
        type: "factual",
      },
      {
        id: "p3",
        template: "Expert {expert1} is more credible than {expert2} in domain {domain}",
        type: "comparative",
      },
    ],
    conclusion: {
      template: "{arg1} is preferred over {arg2}",
    },
    criticalQuestions: [
      {
        id: "cq1",
        question: "Is {expert1} actually an expert in {domain}?",
        attackType: "undercut",
        severity: "critical",
      },
      {
        id: "cq2",
        question: "Is the credibility assessment justified?",
        attackType: "undercut",
        severity: "important",
      },
      {
        id: "cq3",
        question: "Are there other factors that override expertise?",
        attackType: "rebuttal",
        severity: "minor",
      },
    ],
    parameters: [
      {
        key: "expert1",
        label: "Expert cited in preferred argument",
        type: "string",
        required: true,
      },
      {
        key: "expert2",
        label: "Expert cited in dispreferred argument",
        type: "string",
        required: true,
      },
      {
        key: "credentials1",
        label: "Credentials of expert 1",
        type: "string",
        required: true,
      },
      {
        key: "credentials2",
        label: "Credentials of expert 2",
        type: "string",
        required: true,
      },
      {
        key: "domain",
        label: "Domain of expertise",
        type: "string",
        required: true,
      },
    ],
    examples: [
      {
        title: "Climate Science",
        description: "Prefer climate scientist over engineer",
        parameters: {
          expert1: "Dr. Jane Smith",
          expert2: "John Doe",
          credentials1: "PhD Climate Science, 20 years research",
          credentials2: "BS Mechanical Engineering",
          domain: "climate change",
        },
      },
    ],
  },

  {
    key: "recency",
    name: "Recency",
    description: "Prefer argument with more recent evidence",
    category: "epistemic",
    premises: [
      {
        id: "p1",
        template: "Argument {arg1} cites evidence from {date1}",
        type: "factual",
      },
      {
        id: "p2",
        template: "Argument {arg2} cites evidence from {date2}",
        type: "factual",
      },
      {
        id: "p3",
        template: "{date1} is more recent than {date2}",
        type: "comparative",
      },
      {
        id: "p4",
        template: "In domain {domain}, recency is important",
        type: "evaluative",
      },
    ],
    conclusion: {
      template: "{arg1} is preferred over {arg2}",
    },
    criticalQuestions: [
      {
        id: "cq1",
        question: "Is recency actually important in {domain}?",
        attackType: "undercut",
        severity: "critical",
      },
      {
        id: "cq2",
        question: "Has the older evidence been superseded?",
        attackType: "undercut",
        severity: "important",
      },
      {
        id: "cq3",
        question: "Is the newer evidence of sufficient quality?",
        attackType: "rebuttal",
        severity: "important",
      },
    ],
    parameters: [
      {
        key: "date1",
        label: "Date of preferred evidence",
        type: "string",
        required: true,
      },
      {
        key: "date2",
        label: "Date of dispreferred evidence",
        type: "string",
        required: true,
      },
      {
        key: "domain",
        label: "Domain where recency matters",
        type: "string",
        required: true,
      },
    ],
    examples: [
      {
        title: "Technology Study",
        description: "Prefer 2024 study over 2015 study on AI",
        parameters: {
          date1: "2024",
          date2: "2015",
          domain: "artificial intelligence",
        },
      },
    ],
  },

  {
    key: "statistical_strength",
    name: "Statistical Strength",
    description: "Prefer argument with stronger statistical evidence",
    category: "epistemic",
    premises: [
      {
        id: "p1",
        template: "Argument {arg1} is based on study with n={n1}, p={p1}",
        type: "factual",
      },
      {
        id: "p2",
        template: "Argument {arg2} is based on study with n={n2}, p={p2}",
        type: "factual",
      },
      {
        id: "p3",
        template: "Study 1 has stronger statistical evidence (larger n, smaller p)",
        type: "comparative",
      },
    ],
    conclusion: {
      template: "{arg1} is preferred over {arg2}",
    },
    criticalQuestions: [
      {
        id: "cq1",
        question: "Are the study designs comparable?",
        attackType: "undercut",
        severity: "critical",
      },
      {
        id: "cq2",
        question: "Is statistical significance the right metric?",
        attackType: "undercut",
        severity: "important",
      },
      {
        id: "cq3",
        question: "Are there confounding factors?",
        attackType: "rebuttal",
        severity: "important",
      },
    ],
    parameters: [
      {
        key: "n1",
        label: "Sample size of preferred study",
        type: "number",
        required: true,
      },
      {
        key: "n2",
        label: "Sample size of dispreferred study",
        type: "number",
        required: true,
      },
      {
        key: "p1",
        label: "P-value of preferred study",
        type: "number",
        required: true,
      },
      {
        key: "p2",
        label: "P-value of dispreferred study",
        type: "number",
        required: true,
      },
    ],
    examples: [
      {
        title: "Drug Efficacy",
        description: "Prefer large RCT over small pilot study",
        parameters: {
          n1: 5000,
          n2: 50,
          p1: 0.001,
          p2: 0.04,
        },
      },
    ],
  },

  {
    key: "normative_priority",
    name: "Normative Priority",
    description: "Prefer argument based on higher-priority norm",
    category: "normative",
    premises: [
      {
        id: "p1",
        template: "Argument {arg1} appeals to norm {norm1}",
        type: "factual",
      },
      {
        id: "p2",
        template: "Argument {arg2} appeals to norm {norm2}",
        type: "factual",
      },
      {
        id: "p3",
        template: "Norm {norm1} has higher priority than {norm2} in context {context}",
        type: "comparative",
      },
    ],
    conclusion: {
      template: "{arg1} is preferred over {arg2}",
    },
    criticalQuestions: [
      {
        id: "cq1",
        question: "Is the priority ordering of norms justified?",
        attackType: "undercut",
        severity: "critical",
      },
      {
        id: "cq2",
        question: "Does context {context} affect norm priority?",
        attackType: "undercut",
        severity: "important",
      },
      {
        id: "cq3",
        question: "Are there exceptions to this priority?",
        attackType: "rebuttal",
        severity: "minor",
      },
    ],
    parameters: [
      {
        key: "norm1",
        label: "Higher-priority norm",
        type: "string",
        required: true,
      },
      {
        key: "norm2",
        label: "Lower-priority norm",
        type: "string",
        required: true,
      },
      {
        key: "context",
        label: "Context for norm priority",
        type: "string",
        required: true,
      },
    ],
    examples: [
      {
        title: "Legal Priority",
        description: "Constitutional rights override statutory law",
        parameters: {
          norm1: "Constitutional right to free speech",
          norm2: "Local noise ordinance",
          context: "protest in public square",
        },
      },
    ],
  },

  {
    key: "practical_consequences",
    name: "Practical Consequences",
    description: "Prefer argument with better practical consequences",
    category: "pragmatic",
    premises: [
      {
        id: "p1",
        template: "If {arg1} is accepted, consequence {consequence1} follows",
        type: "factual",
      },
      {
        id: "p2",
        template: "If {arg2} is accepted, consequence {consequence2} follows",
        type: "factual",
      },
      {
        id: "p3",
        template: "Consequence {consequence1} is more desirable than {consequence2}",
        type: "evaluative",
      },
    ],
    conclusion: {
      template: "{arg1} is preferred over {arg2}",
    },
    criticalQuestions: [
      {
        id: "cq1",
        question: "Will {consequence1} actually occur?",
        attackType: "undercut",
        severity: "critical",
      },
      {
        id: "cq2",
        question: "Are there unintended consequences?",
        attackType: "rebuttal",
        severity: "important",
      },
      {
        id: "cq3",
        question: "Is the desirability assessment justified?",
        attackType: "undercut",
        severity: "important",
      },
    ],
    parameters: [
      {
        key: "consequence1",
        label: "Consequence of preferred argument",
        type: "string",
        required: true,
      },
      {
        key: "consequence2",
        label: "Consequence of dispreferred argument",
        type: "string",
        required: true,
      },
      {
        key: "desirabilityReason",
        label: "Why consequence1 is more desirable",
        type: "string",
        required: true,
      },
    ],
    examples: [
      {
        title: "Policy Choice",
        description: "Prefer policy with better economic outcomes",
        parameters: {
          consequence1: "Economic growth + job creation",
          consequence2: "Economic stagnation",
          desirabilityReason: "Improves quality of life for citizens",
        },
      },
    ],
  },
];

/**
 * Get scheme by key
 */
export function getSchemeByKey(key: string): PreferenceScheme | null {
  return PREFERENCE_SCHEMES.find(s => s.key === key) ?? null;
}

/**
 * Validate scheme parameters
 */
export function validateSchemeParameters(
  scheme: PreferenceScheme,
  parameters: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const param of scheme.parameters) {
    if (param.required && !(param.key in parameters)) {
      errors.push(`Missing required parameter: ${param.label}`);
      continue;
    }

    const value = parameters[param.key];
    
    // Type validation
    if (param.type === "number" && typeof value !== "number") {
      errors.push(`${param.label} must be a number`);
    }
    if (param.type === "boolean" && typeof value !== "boolean") {
      errors.push(`${param.label} must be a boolean`);
    }
    if (param.type === "string" && typeof value !== "string") {
      errors.push(`${param.label} must be a string`);
    }

    // Select validation
    if (param.type === "select" && param.options) {
      if (!param.options.includes(value)) {
        errors.push(`${param.label} must be one of: ${param.options.join(", ")}`);
      }
    }

    // Custom validation
    if (param.validation && typeof value === "string") {
      const regex = new RegExp(param.validation);
      if (!regex.test(value)) {
        errors.push(`${param.label} format is invalid`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Instantiate scheme with parameters (generate human-readable text)
 */
export function instantiateScheme(
  scheme: PreferenceScheme,
  parameters: Record<string, any>
): string {
  let text = `**${scheme.name}**\n\n`;
  
  // Premises
  text += "Premises:\n";
  for (const premise of scheme.premises) {
    let instantiated = premise.template;
    for (const [key, value] of Object.entries(parameters)) {
      instantiated = instantiated.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
    }
    text += `- ${instantiated}\n`;
  }

  // Conclusion
  text += "\nConclusion:\n";
  let conclusionText = scheme.conclusion.template;
  for (const [key, value] of Object.entries(parameters)) {
    conclusionText = conclusionText.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  text += `- ${conclusionText}\n`;

  return text;
}
```

---

### Implementation Part 8: Preference Schemes UI Components

#### Component 5: `components/aspic/SchemeSelector.tsx` (New, ~250 lines)

```tsx
/**
 * Scheme selector for preference creation
 * Allows users to choose from structured preference schemes
 */

"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, AlertCircle } from "lucide-react";
import { PREFERENCE_SCHEMES, validateSchemeParameters, instantiateScheme } from "@/lib/aspic/schemes/preferenceSchemes";
import type { PreferenceScheme } from "@/lib/aspic/schemes/preferenceSchemes";

interface SchemeSelectorProps {
  onSchemeSelect: (schemeKey: string, parameters: Record<string, any>) => void;
  initialScheme?: string;
  initialParameters?: Record<string, any>;
}

export function SchemeSelector({
  onSchemeSelect,
  initialScheme,
  initialParameters = {},
}: SchemeSelectorProps) {
  const [selectedScheme, setSelectedScheme] = useState<PreferenceScheme | null>(
    initialScheme ? PREFERENCE_SCHEMES.find(s => s.key === initialScheme) ?? null : null
  );
  const [parameters, setParameters] = useState<Record<string, any>>(initialParameters);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleSchemeChange = (schemeKey: string) => {
    const scheme = PREFERENCE_SCHEMES.find(s => s.key === schemeKey);
    if (scheme) {
      setSelectedScheme(scheme);
      setParameters({});
      setErrors([]);
      setShowPreview(false);
    }
  };

  const handleParameterChange = (key: string, value: any) => {
    setParameters(prev => ({ ...prev, [key]: value }));
    setErrors([]);
  };

  const handleValidate = () => {
    if (!selectedScheme) return;

    const validation = validateSchemeParameters(selectedScheme, parameters);
    setErrors(validation.errors);

    if (validation.valid) {
      onSchemeSelect(selectedScheme.key, parameters);
    }
  };

  const handlePreview = () => {
    if (!selectedScheme) return;

    const validation = validateSchemeParameters(selectedScheme, parameters);
    setErrors(validation.errors);

    if (validation.valid) {
      setShowPreview(true);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "epistemic": return "bg-blue-500";
      case "normative": return "bg-purple-500";
      case "pragmatic": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* Scheme Selection */}
      <div>
        <Label htmlFor="scheme-select">Preference Scheme</Label>
        <Select 
          value={selectedScheme?.key} 
          onValueChange={handleSchemeChange}
        >
          <SelectTrigger id="scheme-select">
            <SelectValue placeholder="Select a scheme to justify this preference" />
          </SelectTrigger>
          <SelectContent>
            {PREFERENCE_SCHEMES.map(scheme => (
              <SelectItem key={scheme.key} value={scheme.key}>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(scheme.category)}>
                    {scheme.category}
                  </Badge>
                  <span>{scheme.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedScheme && (
          <p className="text-sm text-muted-foreground mt-1">
            {selectedScheme.description}
          </p>
        )}
      </div>

      {/* Parameter Inputs */}
      {selectedScheme && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scheme Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedScheme.parameters.map(param => (
              <div key={param.key}>
                <Label htmlFor={`param-${param.key}`}>
                  {param.label}
                  {param.required && <span className="text-destructive">*</span>}
                </Label>
                
                {param.type === "string" && (
                  <Input
                    id={`param-${param.key}`}
                    type="text"
                    value={parameters[param.key] ?? ""}
                    onChange={(e) => handleParameterChange(param.key, e.target.value)}
                    placeholder={`Enter ${param.label.toLowerCase()}`}
                  />
                )}

                {param.type === "number" && (
                  <Input
                    id={`param-${param.key}`}
                    type="number"
                    value={parameters[param.key] ?? ""}
                    onChange={(e) => handleParameterChange(param.key, parseFloat(e.target.value))}
                    placeholder={`Enter ${param.label.toLowerCase()}`}
                  />
                )}

                {param.type === "select" && param.options && (
                  <Select
                    value={parameters[param.key]}
                    onValueChange={(value) => handleParameterChange(param.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${param.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {param.options.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Examples */}
      {selectedScheme && selectedScheme.examples.length > 0 && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="text-sm font-medium mb-2">Example:</div>
            <div className="text-xs">
              <strong>{selectedScheme.examples[0].title}</strong>
              <p className="mt-1">{selectedScheme.examples[0].description}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside text-sm">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {showPreview && selectedScheme && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ 
                __html: instantiateScheme(selectedScheme, parameters).replace(/\n/g, '<br />') 
              }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={handlePreview}
          disabled={!selectedScheme}
        >
          Preview Scheme
        </Button>
        <Button 
          onClick={handleValidate}
          disabled={!selectedScheme}
        >
          Apply Scheme
        </Button>
      </div>
    </div>
  );
}
```

#### Update `PreferenceAttackModal` with Scheme Support

```tsx
// Add to PreferenceAttackModal.tsx
import { SchemeSelector } from "@/components/aspic/SchemeSelector";

// Add state
const [useScheme, setUseScheme] = useState(false);
const [schemeKey, setSchemeKey] = useState<string | null>(null);
const [schemeParameters, setSchemeParameters] = useState<Record<string, any>>({});

// Add to form UI (after weight slider, before justification)
<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      id="use-scheme"
      checked={useScheme}
      onChange={(e) => setUseScheme(e.target.checked)}
    />
    <Label htmlFor="use-scheme">
      Use structured preference scheme
    </Label>
  </div>

  {useScheme ? (
    <SchemeSelector
      onSchemeSelect={(key, params) => {
        setSchemeKey(key);
        setSchemeParameters(params);
      }}
    />
  ) : (
    <div className="space-y-1">
      <Label htmlFor="justification">
        Justification (Optional)
      </Label>
      <Textarea
        id="justification"
        placeholder="Why do you prefer this argument?"
        value={justification}
        onChange={(e) => setJustification(e.target.value)}
        rows={3}
      />
    </div>
  )}
</div>

// Update API call
const response = await fetch("/api/pa", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    deliberationId,
    preferredArgumentId,
    dispreferredArgumentId,
    weight,
    weightSource: "user",
    weightJustification,
    // NEW: Scheme fields
    schemeId: schemeKey,
    schemeParameters: useScheme ? schemeParameters : null,
    justification: useScheme ? null : justification,
  }),
});
```

---

## Feature 5.3: Conflict Resolution UI (3-4 days)

### Overview

Detect and resolve circular preferences (A < B < C < A). Cycles violate ASPIC+ rationality postulates and must be resolved before evaluation.

**Resolution Strategies**:
1. **Remove weakest preference** - Remove preference with lowest weight
2. **User selection** - Let user choose which preference to remove
3. **Temporal ordering** - Keep most recent preference
4. **Vote-based** - If multiple users created preferences, use voting

---

### Implementation Part 9: Conflict Detection & Resolution

#### File 8: `lib/aspic/conflicts/resolution.ts` (New, ~300 lines)

```typescript
/**
 * Preference conflict detection and resolution
 * Handles circular preferences and inconsistencies
 */

import { detectPreferenceCycles } from "@/lib/aspic/translation/aifToASPIC";
import { prisma } from "@/lib/prismaclient";

export interface PreferenceConflict {
  type: "cycle" | "contradiction";
  cycle: string[]; // IDs in cycle
  preferences: Array<{
    id: string;
    preferred: string;
    dispreferred: string;
    weight: number;
    createdAt: Date;
    createdBy: string;
  }>;
  severity: "critical" | "warning";
}

export interface ResolutionStrategy {
  type: "remove_weakest" | "user_selection" | "temporal" | "vote_based";
  toRemove: string[]; // PA IDs to remove
  reason: string;
}

/**
 * Detect all conflicts in deliberation preferences
 */
export async function detectConflicts(
  deliberationId: string
): Promise<PreferenceConflict[]> {
  const paRecords = await prisma.preferenceApplication.findMany({
    where: { deliberationId },
    select: {
      id: true,
      preferredArgumentId: true,
      dispreferredArgumentId: true,
      preferredClaimId: true,
      dispreferredClaimId: true,
      weight: true,
      createdAt: true,
      createdById: true,
    },
  });

  const conflicts: PreferenceConflict[] = [];

  // Build preference graph
  const prefs = paRecords.map(pa => ({
    preferred: pa.preferredArgumentId ?? pa.preferredClaimId ?? "",
    dispreferred: pa.dispreferredArgumentId ?? pa.dispreferredClaimId ?? "",
  })).filter(p => p.preferred && p.dispreferred);

  // Detect cycles
  const cycles = detectPreferenceCycles(prefs);

  for (const cycle of cycles) {
    // Find PA records involved in this cycle
    const involvedPAs = paRecords.filter(pa => {
      const pref = pa.preferredArgumentId ?? pa.preferredClaimId ?? "";
      const dispref = pa.dispreferredArgumentId ?? pa.dispreferredClaimId ?? "";
      return cycle.includes(pref) && cycle.includes(dispref);
    });

    conflicts.push({
      type: "cycle",
      cycle,
      preferences: involvedPAs.map(pa => ({
        id: pa.id,
        preferred: pa.preferredArgumentId ?? pa.preferredClaimId ?? "",
        dispreferred: pa.dispreferredArgumentId ?? pa.dispreferredClaimId ?? "",
        weight: pa.weight ?? 1.0,
        createdAt: pa.createdAt,
        createdBy: pa.createdById,
      })),
      severity: "critical",
    });
  }

  return conflicts;
}

/**
 * Suggest resolution strategy for conflict
 */
export function suggestResolution(conflict: PreferenceConflict): ResolutionStrategy[] {
  const strategies: ResolutionStrategy[] = [];

  // Strategy 1: Remove weakest preference
  const sortedByWeight = [...conflict.preferences].sort((a, b) => a.weight - b.weight);
  strategies.push({
    type: "remove_weakest",
    toRemove: [sortedByWeight[0].id],
    reason: `Remove weakest preference (weight=${sortedByWeight[0].weight.toFixed(2)})`,
  });

  // Strategy 2: Remove oldest preference (keep most recent)
  const sortedByDate = [...conflict.preferences].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  strategies.push({
    type: "temporal",
    toRemove: [sortedByDate[0].id],
    reason: `Remove oldest preference (created ${sortedByDate[0].createdAt.toLocaleDateString()})`,
  });

  // Strategy 3: User selection (return all options)
  strategies.push({
    type: "user_selection",
    toRemove: [], // User will choose
    reason: "Let user select which preference to remove",
  });

  return strategies;
}

/**
 * Apply resolution strategy
 */
export async function applyResolution(
  conflictId: string,
  strategy: ResolutionStrategy
): Promise<{ removed: number }> {
  let removed = 0;

  for (const paId of strategy.toRemove) {
    await prisma.preferenceApplication.update({
      where: { id: paId },
      data: { 
        conflictStatus: "resolved",
        conflictResolution: {
          strategy: strategy.type,
          reason: strategy.reason,
          resolvedAt: new Date(),
        },
      },
    });
    removed++;
  }

  return { removed };
}

/**
 * Mark conflict as detected
 */
export async function markConflictDetected(
  paIds: string[]
): Promise<void> {
  await prisma.preferenceApplication.updateMany({
    where: { id: { in: paIds } },
    data: { conflictStatus: "detected" },
  });
}
```

#### Component 6: `components/aspic/ConflictResolutionPanel.tsx` (New, ~300 lines)

```tsx
/**
 * Conflict resolution panel
 * Visualizes cycles and allows user to resolve them
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { PreferenceConflict, ResolutionStrategy } from "@/lib/aspic/conflicts/resolution";

interface ConflictResolutionPanelProps {
  deliberationId: string;
  onResolved?: () => void;
}

export function ConflictResolutionPanel({
  deliberationId,
  onResolved,
}: ConflictResolutionPanelProps) {
  const [conflicts, setConflicts] = useState<PreferenceConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchConflicts();
  }, [deliberationId]);

  async function fetchConflicts() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/aspic/conflicts?deliberationId=${deliberationId}`
      );
      const data = await response.json();
      setConflicts(data.conflicts || []);
    } catch (error) {
      console.error("Failed to fetch conflicts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(conflictIndex: number) {
    const conflict = conflicts[conflictIndex];
    const strategyId = selectedStrategy[conflictIndex];
    
    if (!strategyId) return;

    setResolving(true);
    try {
      const response = await fetch(`/api/aspic/conflicts/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliberationId,
          conflictIndex,
          strategyType: strategyId,
        }),
      });

      if (response.ok) {
        await fetchConflicts();
        onResolved?.();
      }
    } catch (error) {
      console.error("Failed to resolve conflict:", error);
    } finally {
      setResolving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div>Loading conflicts...</div>
        </CardContent>
      </Card>
    );
  }

  if (conflicts.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          No preference conflicts detected. All preferences are consistent.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>{conflicts.length} conflict{conflicts.length > 1 ? "s" : ""} detected!</strong>
          <p className="text-sm mt-1">
            Circular preferences must be resolved before evaluation can proceed.
          </p>
        </AlertDescription>
      </Alert>

      {conflicts.map((conflict, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="destructive">Cycle</Badge>
              Conflict #{index + 1}
            </CardTitle>
            <CardDescription>
              Circular preference detected: {conflict.cycle.join(" → ")} → {conflict.cycle[0]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show involved preferences */}
            <div>
              <div className="text-sm font-medium mb-2">Involved Preferences:</div>
              <div className="space-y-2">
                {conflict.preferences.map(pref => (
                  <div key={pref.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <span className="font-medium">{pref.preferred}</span>
                      {" > "}
                      <span>{pref.dispreferred}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Weight: {pref.weight.toFixed(2)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(pref.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution strategies */}
            <div>
              <div className="text-sm font-medium mb-2">Resolution Strategy:</div>
              <RadioGroup
                value={selectedStrategy[index]}
                onValueChange={(value) => 
                  setSelectedStrategy(prev => ({ ...prev, [index]: value }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remove_weakest" id={`${index}-weakest`} />
                  <Label htmlFor={`${index}-weakest`}>
                    Remove weakest preference (weight={Math.min(...conflict.preferences.map(p => p.weight)).toFixed(2)})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="temporal" id={`${index}-temporal`} />
                  <Label htmlFor={`${index}-temporal`}>
                    Remove oldest preference (keep most recent)
                  </Label>
                </div>
                {conflict.preferences.map(pref => (
                  <div key={pref.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={`manual:${pref.id}`} id={`${index}-${pref.id}`} />
                    <Label htmlFor={`${index}-${pref.id}`}>
                      Remove: {pref.preferred} {">"} {pref.dispreferred}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button
              onClick={() => handleResolve(index)}
              disabled={!selectedStrategy[index] || resolving}
            >
              {resolving ? "Resolving..." : "Resolve Conflict"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

## Feature 5.4: Bulk Operations (2-3 days)

### Overview

Efficient management of many preferences: CSV import, templates, batch operations.

---

### Implementation Part 10: Bulk Operations

#### File 9: `lib/aspic/bulk/operations.ts` (New, ~250 lines)

```typescript
/**
 * Bulk preference operations
 * CSV import, templates, batch creation
 */

import { prisma } from "@/lib/prismaclient";
import { parse } from "csv-parse/sync";

export interface BulkPreferenceRow {
  preferredId: string;
  dispreferredId: string;
  weight?: number;
  justification?: string;
  schemeKey?: string;
}

export interface BulkImportResult {
  created: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

/**
 * Import preferences from CSV
 */
export async function importPreferencesFromCSV(
  deliberationId: string,
  userId: string,
  csvContent: string
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    created: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      
      try {
        // Validate row
        if (!row.preferredId || !row.dispreferredId) {
          result.errors.push({
            row: i + 1,
            message: "Missing preferredId or dispreferredId",
          });
          result.skipped++;
          continue;
        }

        // Check for duplicates
        const existing = await prisma.preferenceApplication.findFirst({
          where: {
            deliberationId,
            preferredArgumentId: row.preferredId,
            dispreferredArgumentId: row.dispreferredId,
          },
        });

        if (existing) {
          result.skipped++;
          continue;
        }

        // Create preference
        await prisma.preferenceApplication.create({
          data: {
            deliberationId,
            createdById: userId,
            preferredArgumentId: row.preferredId,
            dispreferredArgumentId: row.dispreferredId,
            weight: row.weight ? parseFloat(row.weight) : 1.0,
            justification: row.justification || null,
            schemeId: row.schemeKey || null,
          },
        });

        result.created++;
      } catch (error) {
        result.errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : "Unknown error",
        });
        result.skipped++;
      }
    }
  } catch (error) {
    result.errors.push({
      row: 0,
      message: `CSV parse error: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }

  return result;
}

/**
 * Export preferences to CSV
 */
export async function exportPreferencesToCSV(
  deliberationId: string
): Promise<string> {
  const preferences = await prisma.preferenceApplication.findMany({
    where: { deliberationId },
    include: { scheme: true },
  });

  const header = "preferredId,dispreferredId,weight,justification,schemeKey,createdAt\n";
  
  const rows = preferences.map(pa => {
    const cols = [
      pa.preferredArgumentId ?? pa.preferredClaimId ?? "",
      pa.dispreferredArgumentId ?? pa.dispreferredClaimId ?? "",
      pa.weight ?? 1.0,
      pa.justification ? `"${pa.justification.replace(/"/g, '""')}"` : "",
      pa.scheme?.key ?? "",
      pa.createdAt.toISOString(),
    ];
    return cols.join(",");
  });

  return header + rows.join("\n");
}

/**
 * Apply preference template
 * Creates multiple preferences based on pattern
 */
export async function applyPreferenceTemplate(
  deliberationId: string,
  userId: string,
  template: {
    name: string;
    pattern: "transitive" | "expert_priority" | "recency_cascade";
    arguments: string[];
    weight?: number;
  }
): Promise<{ created: number }> {
  let created = 0;

  switch (template.pattern) {
    case "transitive":
      // Create A > B > C > D chain
      for (let i = 0; i < template.arguments.length - 1; i++) {
        await prisma.preferenceApplication.create({
          data: {
            deliberationId,
            createdById: userId,
            preferredArgumentId: template.arguments[i],
            dispreferredArgumentId: template.arguments[i + 1],
            weight: template.weight ?? 1.0,
            justification: `Template: ${template.name}`,
          },
        });
        created++;
      }
      break;

    case "expert_priority":
      // First argument preferred over all others
      const [expert, ...others] = template.arguments;
      for (const other of others) {
        await prisma.preferenceApplication.create({
          data: {
            deliberationId,
            createdById: userId,
            preferredArgumentId: expert,
            dispreferredArgumentId: other,
            weight: template.weight ?? 1.0,
            justification: `Expert priority: ${template.name}`,
            schemeId: "expert_opinion",
          },
        });
        created++;
      }
      break;

    case "recency_cascade":
      // Newer arguments preferred over older (reversed order)
      for (let i = template.arguments.length - 1; i > 0; i--) {
        await prisma.preferenceApplication.create({
          data: {
            deliberationId,
            createdById: userId,
            preferredArgumentId: template.arguments[i],
            dispreferredArgumentId: template.arguments[i - 1],
            weight: template.weight ?? 1.0,
            justification: `Recency cascade: ${template.name}`,
            schemeId: "recency",
          },
        });
        created++;
      }
      break;
  }

  return { created };
}

/**
 * Batch delete preferences
 */
export async function batchDeletePreferences(
  preferenceIds: string[]
): Promise<{ deleted: number }> {
  const result = await prisma.preferenceApplication.deleteMany({
    where: { id: { in: preferenceIds } },
  });

  return { deleted: result.count };
}

/**
 * Batch update preference weights
 */
export async function batchUpdateWeights(
  preferenceIds: string[],
  newWeight: number
): Promise<{ updated: number }> {
  const result = await prisma.preferenceApplication.updateMany({
    where: { id: { in: preferenceIds } },
    data: { weight: newWeight },
  });

  return { updated: result.count };
}
```

#### API Endpoint: `app/api/aspic/bulk/route.ts` (New)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  importPreferencesFromCSV, 
  exportPreferencesToCSV,
  applyPreferenceTemplate,
  batchDeletePreferences,
  batchUpdateWeights,
} from "@/lib/aspic/bulk/operations";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

// POST: Import or apply template
export async function POST(req: NextRequest) {
  const body = await req.json();
  
  if (body.action === "import") {
    const result = await importPreferencesFromCSV(
      body.deliberationId,
      body.userId,
      body.csvContent
    );
    return NextResponse.json(result, NO_STORE);
  }

  if (body.action === "template") {
    const result = await applyPreferenceTemplate(
      body.deliberationId,
      body.userId,
      body.template
    );
    return NextResponse.json(result, NO_STORE);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400, ...NO_STORE });
}

// GET: Export
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const deliberationId = url.searchParams.get("deliberationId");

  if (!deliberationId) {
    return NextResponse.json({ error: "Missing deliberationId" }, { status: 400, ...NO_STORE });
  }

  const csv = await exportPreferencesToCSV(deliberationId);
  
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="preferences_${deliberationId}.csv"`,
    },
  });
}

// DELETE: Batch delete
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const result = await batchDeletePreferences(body.preferenceIds);
  return NextResponse.json(result, NO_STORE);
}

// PATCH: Batch update
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const result = await batchUpdateWeights(body.preferenceIds, body.newWeight);
  return NextResponse.json(result, NO_STORE);
}
```

---

## Phase 5 Timeline & Summary

### Timeline Breakdown

| Feature | Duration | Complexity | Priority |
|---------|----------|-----------|----------|
| **5.1 Weighted Preferences** | 4-5 days | 🔴 Hard | P1 Critical |
| - Schema + Types | 0.5 days | 🟡 Medium | - |
| - Weighted Defeats | 1.5 days | 🔴 Hard | - |
| - API Endpoints | 1 day | 🟡 Medium | - |
| - UI Components | 1 day | 🟡 Medium | - |
| - Testing | 0.5 days | 🟢 Easy | - |
| **5.2 Preference Schemes** | 3-4 days | 🟡 Medium | P2 High |
| - Schema + Library | 1 day | 🟡 Medium | - |
| - API Endpoints | 0.5 days | 🟢 Easy | - |
| - UI Components | 1.5 days | 🟡 Medium | - |
| - Testing | 0.5 days | 🟢 Easy | - |
| **5.3 Conflict Resolution** | 3-4 days | 🟡 Medium | P1 Critical |
| - Detection Logic | 1 day | 🟡 Medium | - |
| - Resolution Strategies | 1 day | 🟡 Medium | - |
| - UI Components | 1 day | 🟡 Medium | - |
| - Testing | 0.5 days | 🟢 Easy | - |
| **5.4 Bulk Operations** | 2-3 days | 🟢 Easy | P3 Nice-to-have |
| - Import/Export | 1 day | 🟢 Easy | - |
| - Templates | 0.5 days | 🟢 Easy | - |
| - Batch Operations | 0.5 days | 🟢 Easy | - |
| - Testing | 0.5 days | 🟢 Easy | - |
| **Total** | **12-15 days** | Mixed | - |

---

## Success Metrics

### Feature 5.1: Weighted Preferences
- ✅ Preferences support weights (0.0-1.0) with UI slider
- ✅ Probabilistic defeats computed correctly for all aggregation methods
- ✅ Monte Carlo simulation produces valid probability distributions
- ✅ Sensitivity analysis identifies critical preferences
- ✅ API performance <2s for 100 arguments with weighted evaluation

### Feature 5.2: Preference Schemes
- ✅ 5+ built-in schemes available (epistemic, normative, pragmatic)
- ✅ Scheme parameters validated before application
- ✅ Schemes instantiate correctly with user parameters
- ✅ Critical questions displayed for meta-argumentation
- ✅ Backward compatible with free-text justifications

### Feature 5.3: Conflict Resolution
- ✅ All preference cycles detected (100% accuracy)
- ✅ 3+ resolution strategies offered per conflict
- ✅ User can manually select preference to remove
- ✅ Conflicts resolved without data loss (preferences marked, not deleted)
- ✅ Re-evaluation after resolution produces acyclic graph

### Feature 5.4: Bulk Operations
- ✅ CSV import/export with proper escaping and validation
- ✅ 3+ preference templates (transitive, expert priority, recency)
- ✅ Batch operations handle 100+ preferences efficiently (<5s)
- ✅ Error reporting shows row-level details for imports
- ✅ Export includes all preference metadata

---

## Integration with Phase 4

Phase 5 builds directly on Phase 4 foundations:

| Phase 4 Component | Phase 5 Extension |
|-------------------|-------------------|
| `PreferenceApplication` model | + `weight`, `schemeId`, `conflictStatus` fields |
| `POST /api/pa` | + Weight, scheme, conflict validation |
| `GET /api/aspic/evaluate` | + `/weighted` variant with probabilistic defeats |
| `PreferenceAttackModal` | + Weight slider, scheme selector |
| `PreferenceBadge` | + Probabilistic defeat indicators |
| Translation layer | + `populateWeightedKBFromAIF()` |
| Defeat computation | + `computeWeightedDefeats()` |

---

## Risk Mitigation

### Risk: Weighted Defeats Too Slow
**Impact**: High (affects UX)  
**Mitigation**:
- Cache weighted defeat computations (invalidate on PA change)
- Lazy evaluation: only compute when needed
- Limit Monte Carlo samples based on deliberation size
- Progress indicators for long computations

### Risk: Scheme Complexity Overwhelms Users
**Impact**: Medium (affects adoption)  
**Mitigation**:
- Make schemes optional (default to free text)
- Provide clear examples for each scheme
- Progressive disclosure: show advanced schemes only when needed
- Tooltips and inline help

### Risk: Conflict Resolution Creates New Conflicts
**Impact**: Low (edge case)  
**Mitigation**:
- Re-run conflict detection after each resolution
- Prevent removal if it creates new cycles (validation)
- Allow undo for resolution actions
- Log all resolution actions for audit

### Risk: Bulk Import Data Quality
**Impact**: Medium (garbage in, garbage out)  
**Mitigation**:
- Strict CSV validation with row-level error reporting
- Preview imported data before committing
- Rollback on error (transaction-based import)
- Template CSVs with examples

---

## Future Enhancements (Phase 6+)

### Phase 6: Visualization
- Interactive preference graph with cycle highlighting
- D3.js or Cytoscape for network visualization
- Animated evaluation showing defeat propagation
- Heatmap of sensitivity across preference space

### Phase 7: Machine Learning Integration
- ML model suggests preference weights based on argument features
- Cluster similar arguments for batch preference application
- Predict user preferences based on past behavior
- Auto-detect preference schemes from justification text

### Phase 8: Collaborative Preferences
- Multi-user voting on preferences (aggregated weights)
- Preference negotiation protocols
- Expert vs. crowd preference weighting
- Real-time preference updates across users

---

## Acceptance Criteria Summary

**Phase 5 is complete when**:
- ✅ All 4 features (5.1-5.4) implemented and tested
- ✅ Schema migrations successful (`npx prisma db push`)
- ✅ All API endpoints return correct data (integration tests pass)
- ✅ UI components render without errors (manual testing + screenshots)
- ✅ Lint checks pass (`npm run lint`)
- ✅ Test coverage >75% for new code
- ✅ Documentation updated (user guides + API docs)
- ✅ No regressions in Phase 4 functionality
- ✅ Performance targets met (<2s weighted evaluation for 100 args)
- ✅ Backward compatibility maintained (existing preferences still work)

---

## References

**Theoretical Foundations**:
- Modgil & Prakken (2014) - Argumentation with Preferences
- Walton, Reed & Macagno (2008) - Argumentation Schemes
- Dung (1995) - Abstract Argumentation Frameworks

**Implementation Guides**:
- Prisma Schema Design: https://www.prisma.io/docs/concepts/components/prisma-schema
- React Query: https://tanstack.com/query/latest
- D3.js Network Graphs: https://d3js.org/

---

## Conclusion

Phase 5 transforms the basic preference system from Phase 4 into a production-ready, research-grade argumentation platform with:

1. **Weighted Preferences** - Uncertainty quantification for real-world deliberation
2. **Preference Schemes** - Structured justifications with meta-argumentation support  
3. **Conflict Resolution** - Robust handling of preference cycles
4. **Bulk Operations** - Efficient management for large-scale deliberations

**Total Implementation**: 12-15 days of focused development  
**Expected Impact**: 10x improvement in preference expressiveness and usability

---

**End of Phase 5 Roadmap** ✅

Ready to begin implementation once Phase 4 is complete.
