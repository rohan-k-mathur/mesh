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

## TO BE CONTINUED (Part 3)...

**Current Progress**: 
- ✅ Part 1: Schema design + type definitions
- ✅ Part 2: Weighted defeat computation + sensitivity analysis

**Next Section**: API endpoints, UI components, and testing for weighted preferences.

---

**Word Count**: ~5,200 / Target: 8,000-10,000 total
**Completion**: ~50% (Part 2 of 5)
