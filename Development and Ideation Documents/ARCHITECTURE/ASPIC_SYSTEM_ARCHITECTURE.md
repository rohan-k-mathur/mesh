# ASPIC+ Argumentation System Architecture

## Overview

The Mesh platform implements a comprehensive **ASPIC+ (Argumentation System with Preferences, Incomplete information, and Conflicts)** framework for structured argumentation. This document provides detailed technical documentation of the system design, data flow, and integration points.

ASPIC+ is a formal argumentation framework based on:
- Modgil, S., & Prakken, H. (2013). "A general account of argumentation with preferences"
- Caminada, M., & Amgoud, L. (2007). "On the evaluation of argumentation formalisms"
- Dung, P.M. (1995). "On the acceptability of arguments"

---

## Table of Contents

1. [System Architecture Diagram](#system-architecture-diagram)
2. [Core Domain Model](#core-domain-model)
3. [Type Definitions](#type-definitions)
4. [Data Pipeline](#data-pipeline)
5. [Subsystem Details](#subsystem-details)
6. [API Layer](#api-layer)
7. [UI Components](#ui-components)
8. [Integration Points](#integration-points)
9. [Rationality Postulates](#rationality-postulates)

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER INTERFACE                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │ AspicTheoryPanel │  │GroundedExtension │  │RationalityCheck- │  │ ConflictResolu-││
│  │    (Theory Tab)  │  │     Panel        │  │    list          │  │   tionPanel    ││
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘│
│           │                     │                     │                    │          │
│  ┌────────┴─────────┐  ┌────────┴─────────┐  ┌────────┴─────────┐  ┌───────┴────────┐│
│  │AspicTheoryViewer │  │ArgumentStatusCard│  │ RationalityItem  │  │ConflictCycleUI ││
│  │  (Rules/KB View) │  │ (IN/OUT/UNDEC)   │  │   (Postulates)   │  │ (Resolution)   ││
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  └────────────────┘│
└───────────────────────────────────────────┬─────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                     API LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                            /api/aspic/evaluate                                   ││
│  │  GET:  Translate deliberation → ASPIC+ Theory → Compute Semantics               ││
│  │  POST: Direct ASPIC+ theory evaluation                                          ││
│  └────────────────────────────────────┬────────────────────────────────────────────┘│
│                                       │                                              │
│  ┌────────────────────┐  ┌────────────┴───────────┐  ┌─────────────────────────────┐│
│  │/api/aspic/conflicts│  │/api/aspic/transposition│  │  /api/assumptions/*         ││
│  │  Cycle Detection   │  │  Generate/Cleanup      │  │  CRUD + Lifecycle           ││
│  └────────┬───────────┘  └────────────┬───────────┘  └──────────┬──────────────────┘│
│           │                           │                         │                    │
│  ┌────────┴───────────┐  ┌────────────┴───────────┐  ┌──────────┴──────────────────┐│
│  │/api/aspic/cq-attack│  │/api/aspic/conflicts/   │  │  /api/ca (Conflict Applic.) ││
│  │  CQ → Attack       │  │  resolve, undo         │  │  Create/Manage Attacks      ││
│  └────────────────────┘  └────────────────────────┘  └─────────────────────────────┘│
└───────────────────────────────────────┬─────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               ENGINE LIBRARY LAYER                                   │
│                                   /lib/aspic/*                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                               CORE MODULES                                      │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │ │
│  │  │  types.ts   │ │arguments.ts │ │ attacks.ts  │ │ defeats.ts  │ │semantics.ts│ │ │
│  │  │ (Interfaces)│ │(Construct)  │ │ (Compute)   │ │(Preference) │ │(Grounded) │ │ │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ │ │
│  │         │               │               │               │              │       │ │
│  │         └───────────────┴───────────────┼───────────────┴──────────────┘       │ │
│  │                                         │                                       │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────┴──────┐ ┌─────────────┐               │ │
│  │  │transposition│ │rationality  │ │ cqMapping.ts│ │validation.ts│               │ │
│  │  │     .ts     │ │    .ts      │ │ (CQ→Attack) │ │ (Rules/KB)  │               │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘               │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                           TRANSLATION MODULES                                   │ │
│  │                        /lib/aspic/translation/*                                 │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────────┐ │ │
│  │  │ aifToASPIC.ts   │  │ aspicToAIF.ts   │  │ integration.ts                  │ │ │
│  │  │ (AIF→Theory)    │  │ (Theory→AIF)    │  │ (Bidirectional sync)            │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                           CONFLICT MODULES                                      │ │
│  │                        /lib/aspic/conflicts/*                                   │ │
│  │  ┌─────────────────┐  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ detection.ts    │  │ resolution.ts                                       │  │ │
│  │  │ (Cycle finding) │  │ (Strategy application)                              │  │ │
│  │  └─────────────────┘  └─────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────┬─────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               DATA PERSISTENCE LAYER                                 │
│                               (Prisma + PostgreSQL)                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                              CORE MODELS                                         ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  ┌───────────────┐ ││
│  │  │   Argument   │  │    Claim     │  │ ConflictApplication │  │ PreferenceApp-│ ││
│  │  │  (RA-nodes)  │  │  (I-nodes)   │  │   (CA-nodes/Attacks)│  │   lication    │ ││
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘  └───────────────┘ ││
│  │                                                                                  ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  ┌───────────────┐ ││
│  │  │AssumptionUse │  │ClaimContrary │  │ ArgumentScheme-     │  │   ClaimEdge   │ ││
│  │  │  (K_a items) │  │  (Explicit)  │  │   Instance          │  │   (Attacks)   │ ││
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘  └───────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Domain Model

### Argumentation Theory (AT = ⟨AS, KB⟩)

An ASPIC+ Argumentation Theory consists of two main components:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        ARGUMENTATION THEORY (AT)                                     │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                    ARGUMENTATION SYSTEM (AS)                                   │ │
│   │                                                                                │ │
│   │  ┌────────────────────────────────────────────────────────────────────────┐   │ │
│   │  │ LANGUAGE (L)                                                            │   │ │
│   │  │ • Well-formed formulae (propositions, predicates)                      │   │ │
│   │  │ • Claim texts, rule identifiers, negated forms                         │   │ │
│   │  └────────────────────────────────────────────────────────────────────────┘   │ │
│   │                                                                                │ │
│   │  ┌────────────────────────────────────────────────────────────────────────┐   │ │
│   │  │ CONTRARINESS FUNCTION (¯)                                              │   │ │
│   │  │ • Maps formulae to their contraries: φ̄ = {ψ | ψ conflicts with φ}      │   │ │
│   │  │ • Symmetric (contradictory) or asymmetric (contrary)                   │   │ │
│   │  └────────────────────────────────────────────────────────────────────────┘   │ │
│   │                                                                                │ │
│   │  ┌────────────────────────┐    ┌─────────────────────────────────────────┐   │ │
│   │  │ STRICT RULES (Rs)      │    │ DEFEASIBLE RULES (Rd)                    │   │ │
│   │  │ φ₁,...,φₙ → ψ          │    │ φ₁,...,φₙ ⇒ ψ                            │   │ │
│   │  │ (Deductive, certain)   │    │ (Presumptive, defeasible)               │   │ │
│   │  └────────────────────────┘    └─────────────────────────────────────────┘   │ │
│   │                                                                                │ │
│   │  ┌────────────────────────────────────────────────────────────────────────┐   │ │
│   │  │ RULE NAMING FUNCTION (n: Rd → L)                                        │   │ │
│   │  │ • Assigns each defeasible rule a unique name in the language           │   │ │
│   │  │ • Required for undercutting attacks                                     │   │ │
│   │  └────────────────────────────────────────────────────────────────────────┘   │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                        KNOWLEDGE BASE (KB)                                     │ │
│   │                                                                                │ │
│   │  ┌────────────────────────────────────────────────────────────────────────┐   │ │
│   │  │ AXIOMS (Kn) - Necessary Premises                                        │   │ │
│   │  │ • Infallible, cannot be attacked                                        │   │ │
│   │  │ • Established facts, definitions                                        │   │ │
│   │  └────────────────────────────────────────────────────────────────────────┘   │ │
│   │                                                                                │ │
│   │  ┌────────────────────────────────────────────────────────────────────────┐   │ │
│   │  │ ORDINARY PREMISES (Kp) - Fallible Premises                              │   │ │
│   │  │ • Can be undermined (attacked)                                          │   │ │
│   │  │ • Defeat depends on preference comparison                               │   │ │
│   │  └────────────────────────────────────────────────────────────────────────┘   │ │
│   │                                                                                │ │
│   │  ┌────────────────────────────────────────────────────────────────────────┐   │ │
│   │  │ ASSUMPTIONS (Ka) - Weak Premises                                        │   │ │
│   │  │ • Can be undermined (attacked)                                          │   │ │
│   │  │ • Attacks ALWAYS succeed (no preference check)                          │   │ │
│   │  └────────────────────────────────────────────────────────────────────────┘   │ │
│   │                                                                                │ │
│   │  ┌────────────────────────────────────────────────────────────────────────┐   │ │
│   │  │ PREFERENCES                                                              │   │ │
│   │  │ • Premise preferences: ≤' on Kp                                         │   │ │
│   │  │ • Rule preferences: ≤ on Rd                                             │   │ │
│   │  └────────────────────────────────────────────────────────────────────────┘   │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Type Definitions

### Core Types (`/lib/aspic/types.ts`)

```typescript
/**
 * Rule: Inference pattern (strict or defeasible)
 */
interface Rule {
  id: string;
  antecedents: string[];    // Premise formulae
  consequent: string;       // Conclusion formula
  type: "strict" | "defeasible";
}

/**
 * Argumentation System (AS)
 */
interface ArgumentationSystem {
  language: Set<string>;
  contraries: Map<string, Set<string>>;
  strictRules: Rule[];
  defeasibleRules: Rule[];
  ruleNames: Map<string, string>;  // ruleId → formula
}

/**
 * Knowledge Base (KB)
 */
interface KnowledgeBase {
  axioms: Set<string>;       // Kn
  premises: Set<string>;     // Kp
  assumptions: Set<string>;  // Ka
  premisePreferences: Array<{ preferred: string; dispreferred: string }>;
  rulePreferences: Array<{ preferred: string; dispreferred: string }>;
}

/**
 * Argumentation Theory (AT = AS + KB)
 */
interface ArgumentationTheory {
  system: ArgumentationSystem;
  knowledgeBase: KnowledgeBase;
}
```

### Argument Structure

```typescript
/**
 * Argument: Inference tree built from KB and rules
 * 
 * Base case: φ (where φ ∈ K)
 * Strict inference: A1,...,An →s φ
 * Defeasible inference: A1,...,An ⇒d φ
 */
interface Argument {
  id: string;
  premises: Set<string>;           // prem(A)
  conclusion: string;              // conc(A)
  subArguments: Argument[];        // sub(A)
  defeasibleRules: Set<string>;    // DefRules(A)
  topRule?: {
    ruleId: string;
    type: "strict" | "defeasible";
  };
  structure: ArgumentStructure;
}

type ArgumentStructure =
  | { type: "premise"; formula: string; source: "axiom" | "premise" | "assumption" }
  | { type: "inference"; rule: Rule; subArguments: ArgumentStructure[]; conclusion: string };
```

### Attack Types

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           THREE FUNDAMENTAL ATTACK TYPES                             │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                         1. UNDERMINING ATTACK                                  │  │
│  │                                                                                │  │
│  │   Condition: conc(A) ∈ φ̄ where φ ∈ Prem(B) ∩ (Kp ∪ Ka)                        │  │
│  │                                                                                │  │
│  │   Target: Ordinary premises or assumptions                                     │  │
│  │                                                                                │  │
│  │       Argument A                     Argument B                                │  │
│  │   ┌──────────────┐              ┌────────────────────┐                        │  │
│  │   │ Conclusion:  │   ATTACKS    │ Premise: φ         │                        │  │
│  │   │   ¬φ        ├─────────────►│ (ordinary/assump.) │                        │  │
│  │   └──────────────┘              └────────────────────┘                        │  │
│  │                                                                                │  │
│  │   • Ka (assumptions): Attack ALWAYS succeeds as defeat                        │  │
│  │   • Kp (ordinary): Attack succeeds if attacker not < defended                 │  │
│  │   • Kn (axioms): CANNOT be attacked                                           │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                         2. REBUTTING ATTACK                                    │  │
│  │                                                                                │  │
│  │   Condition: conc(A) ∈ conc(B')̄ where B' ∈ Sub(B) has defeasible top rule    │  │
│  │                                                                                │  │
│  │   Target: Defeasible conclusions (NOT strict conclusions)                     │  │
│  │                                                                                │  │
│  │       Argument A                     Argument B                                │  │
│  │   ┌──────────────┐              ┌────────────────────┐                        │  │
│  │   │ Conclusion:  │   ATTACKS    │ Sub-arg B':        │                        │  │
│  │   │   ¬ψ        ├─────────────►│ conc(B') = ψ       │                        │  │
│  │   └──────────────┘              │ (defeasible rule)  │                        │  │
│  │                                 └────────────────────┘                        │  │
│  │                                                                                │  │
│  │   Preference check applies: Attack succeeds if A ⊀ B'                         │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │                         3. UNDERCUTTING ATTACK                                 │  │
│  │                                                                                │  │
│  │   Condition: conc(A) ∈ n(r)̄ where r ∈ DefRules(B')                            │  │
│  │                                                                                │  │
│  │   Target: Rule applicability (the inference step itself)                      │  │
│  │                                                                                │  │
│  │       Argument A                     Argument B                                │  │
│  │   ┌──────────────┐              ┌────────────────────┐                        │  │
│  │   │ Conclusion:  │   ATTACKS    │ Rule r in B':      │                        │  │
│  │   │ ¬n(r)        ├─────────────►│ φ₁,...,φₙ ⇒ ψ      │                        │  │
│  │   │ "rule r     │              │ (defeasible rule)  │                        │  │
│  │   │  doesn't    │              └────────────────────┘                        │  │
│  │   │  apply"     │                                                             │  │
│  │   └──────────────┘                                                             │  │
│  │                                                                                │  │
│  │   Undercutting ALWAYS succeeds as defeat (no preference check)                │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Pipeline

### Complete Evaluation Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        ASPIC+ EVALUATION PIPELINE                                    │
│                                                                                      │
│   Step 1: Data Fetching                                                              │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  Prisma Queries (in /api/aspic/evaluate)                                     │   │
│   │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐ │   │
│   │  │ Arguments        │ │ ConflictApps     │ │ PreferenceApplications       │ │   │
│   │  │ + premises       │ │ (CA-nodes)       │ │ + weight, justification      │ │   │
│   │  │ + conclusion     │ │                  │ │                              │ │   │
│   │  │ + scheme         │ │                  │ │                              │ │   │
│   │  └──────────────────┘ └──────────────────┘ └──────────────────────────────┘ │   │
│   │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐ │   │
│   │  │ AssumptionUse    │ │ ClaimContrary    │ │ ClaimEdges                   │ │   │
│   │  │ (Ka items)       │ │ (Explicit)       │ │ (Attack edges)               │ │   │
│   │  └──────────────────┘ └──────────────────┘ └──────────────────────────────┘ │   │
│   └──────────────────────────────────────────┬──────────────────────────────────┘   │
│                                              ▼                                       │
│   Step 2: AIF → ASPIC+ Translation                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  aifToASPIC() in /lib/aif/translation/aifToAspic.ts                         │   │
│   │                                                                              │   │
│   │  • Build Language L from I-nodes (claims) and RA-nodes (arguments)          │   │
│   │  • Populate KB:                                                              │   │
│   │    - Kn (axioms): Claims with role="axiom" or isAxiom=true                  │   │
│   │    - Kp (premises): Root I-nodes with no incoming edges                      │   │
│   │    - Ka (assumptions): ACCEPTED AssumptionUse records                        │   │
│   │  • Extract Rules from RA-nodes:                                              │   │
│   │    - Strict: scheme.ruleType === 'strict'                                    │   │
│   │    - Defeasible: default (most argumentation schemes)                        │   │
│   │  • Build Contraries from:                                                    │   │
│   │    - Explicit ClaimContrary records                                          │   │
│   │    - CA-node attack edges (inferred)                                         │   │
│   │    - Classical negation (¬φ)                                                 │   │
│   │  • Extract Preferences from PreferenceApplication records                    │   │
│   └──────────────────────────────────────┬──────────────────────────────────────┘   │
│                                          ▼                                           │
│   Step 3: Argument Construction                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  constructArguments() in /lib/aspic/arguments.ts                             │   │
│   │                                                                              │   │
│   │  Bottom-up recursive construction:                                           │   │
│   │  1. Create base arguments from KB elements                                   │   │
│   │     • For each φ ∈ Kn: create argument with conc(A) = φ, source="axiom"     │   │
│   │     • For each φ ∈ Kp: create argument with conc(A) = φ, source="premise"   │   │
│   │     • For each φ ∈ Ka: create argument with conc(A) = φ, source="assumption"│   │
│   │  2. Iterate: apply rules to existing arguments                               │   │
│   │     • For each rule r with antecedents matching existing conclusions         │   │
│   │     • Create new argument combining sub-arguments via rule                   │   │
│   │  3. Repeat until no new arguments or limits reached                          │   │
│   │     • maxDepth (default: 5)                                                  │   │
│   │     • maxArguments (default: 500)                                            │   │
│   │     • maxArgsPerConclusion (default: 3)                                      │   │
│   └──────────────────────────────────────┬──────────────────────────────────────┘   │
│                                          ▼                                           │
│   Step 4: Attack Computation                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  computeAttacks() in /lib/aspic/attacks.ts                                   │   │
│   │                                                                              │   │
│   │  For each pair (A, B) of arguments:                                          │   │
│   │  • Check undermining: conc(A) ∈ φ̄ for φ ∈ Prem(B) ∩ (Kp ∪ Ka)               │   │
│   │  • Check rebutting: conc(A) ∈ conc(B')̄ for defeasible B' ∈ Sub(B)           │   │
│   │  • Check undercutting: conc(A) ∈ n(r)̄ for r ∈ DefRules(B')                  │   │
│   │                                                                              │   │
│   │  Complexity: O(n²) where n = |Arguments|                                     │   │
│   └──────────────────────────────────────┬──────────────────────────────────────┘   │
│                                          ▼                                           │
│   Step 5: Defeat Computation                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  computeDefeats() in /lib/aspic/defeats.ts                                   │   │
│   │                                                                              │   │
│   │  For each attack:                                                            │   │
│   │  • Undercutting: ALWAYS succeeds as defeat                                   │   │
│   │  • Undermining on Ka: ALWAYS succeeds as defeat                              │   │
│   │  • Undermining on Kp: Check preferences, succeed if attacker ⊀ target        │   │
│   │  • Rebutting: Check preferences, succeed if attacker ⊀ target                │   │
│   │                                                                              │   │
│   │  Preference Orderings:                                                       │   │
│   │  • Last-link: Compare top rules only (legal/normative reasoning)            │   │
│   │  • Weakest-link: Compare weakest rule/premise (epistemic reasoning)          │   │
│   └──────────────────────────────────────┬──────────────────────────────────────┘   │
│                                          ▼                                           │
│   Step 6: Grounded Semantics                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  computeGroundedExtension() in /lib/aspic/semantics.ts                       │   │
│   │                                                                              │   │
│   │  Fixed-point iteration:                                                      │   │
│   │  1. E₀ = ∅ (empty extension)                                                 │   │
│   │  2. Apply characteristic function F:                                         │   │
│   │     F(S) = {A | all defeaters of A are in OUT(S)}                            │   │
│   │  3. OUT(S) = {B | ∃A ∈ S: A defeats B}                                       │   │
│   │  4. Repeat until Eᵢ₊₁ = Eᵢ (fixpoint)                                        │   │
│   │                                                                              │   │
│   │  Result:                                                                     │   │
│   │  • IN: Arguments in grounded extension (justified)                          │   │
│   │  • OUT: Arguments defeated by extension (defeated)                          │   │
│   │  • UNDEC: Neither IN nor OUT (undecided)                                     │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Subsystem Details

### 1. Assumption Lifecycle System

The assumption system manages the knowledge base component Ka (weak premises).

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          ASSUMPTION LIFECYCLE                                        │
│                                                                                      │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│   │  PROPOSED   │───▶│  ACCEPTED   │───▶│ CHALLENGED  │───▶│  RETRACTED  │          │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘          │
│         │                   │                  │                  ▲                  │
│         │                   │                  │                  │                  │
│         └───────────────────┴──────────────────┴──────────────────┘                  │
│                              Direct retraction path                                  │
│                                                                                      │
│   States:                                                                            │
│   • PROPOSED: Initial state, awaiting review                                         │
│   • ACCEPTED: Valid assumption, included in Ka for ASPIC+ evaluation                │
│   • CHALLENGED: Under dispute, may require resolution                               │
│   • RETRACTED: Withdrawn, no longer in knowledge base                               │
│                                                                                      │
│   ASPIC+ Integration:                                                                │
│   • Only ACCEPTED assumptions enter Ka                                               │
│   • Undermining attacks on Ka ALWAYS succeed (no preference check)                  │
│   • This makes assumptions the "weakest" form of premise                            │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Database Model**: `AssumptionUse` in Prisma schema

```prisma
model AssumptionUse {
  id             String @id @default(cuid())
  deliberationId String
  argumentId     String?           // Optional: can be standalone
  assumptionClaimId String?        // Link to existing claim
  assumptionText    String?        // Freeform text
  role       String @default("premise")
  weight     Float?                // Local weight 0..1
  confidence Float?                // Author confidence
  
  // Lifecycle tracking
  status          AssumptionStatus @default(PROPOSED)
  statusChangedAt DateTime
  statusChangedBy String?
  challengeReason String?
}

enum AssumptionStatus {
  PROPOSED
  ACCEPTED
  RETRACTED
  CHALLENGED
}
```

**API Endpoints**:
- `GET /api/assumptions` - List assumptions
- `POST /api/assumptions` - Create assumption
- `POST /api/assumptions/[id]/accept` - Accept assumption
- `POST /api/assumptions/[id]/challenge` - Challenge assumption
- `POST /api/assumptions/[id]/retract` - Retract assumption

**UI Component**: `ActiveAssumptionsPanel`, `AssumptionCard`, `CreateAssumptionForm`

---

### 2. Transposition Closure System

Ensures strict rules satisfy the transposition (contraposition) rationality requirement.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         TRANSPOSITION CLOSURE                                        │
│                                                                                      │
│   Original Rule:                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  r: φ₁, φ₂, ..., φₙ → ψ                                                      │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│   Required Transpositions (one per antecedent):                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  r_transpose_0: ¬ψ, φ₂, ..., φₙ → ¬φ₁                                        │   │
│   │  r_transpose_1: φ₁, ¬ψ, φ₃, ..., φₙ → ¬φ₂                                    │   │
│   │  ...                                                                         │   │
│   │  r_transpose_n-1: φ₁, φ₂, ..., ¬ψ → ¬φₙ                                      │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│   Example:                                                                           │
│   Original: p, p→q → q  (modus ponens)                                               │
│   Transpose 0: ¬q, p→q → ¬p  (modus tollens)                                         │
│   Transpose 1: p, ¬q → ¬(p→q)                                                        │
│                                                                                      │
│   Why Required:                                                                      │
│   • Enables modus tollens reasoning                                                  │
│   • Ensures logical completeness                                                     │
│   • Required for rationality postulates (Caminada & Amgoud 2007)                    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Library Functions** (`/lib/aspic/transposition.ts`):
- `validateTranspositionClosure(strictRules)` - Check if closed
- `generateTranspositions(rule)` - Generate contrapositives for one rule
- `applyTranspositionClosure(rules)` - Generate all missing transpositions

**API Endpoints**:
- `POST /api/aspic/transposition/generate` - Auto-generate missing transpositions
- `DELETE /api/aspic/transposition/cleanup` - Remove generated transpositions
- `GET /api/aspic/validate-transposition` - Validate closure

---

### 3. Preference Conflict Resolution

Detects and resolves cycles in preference orderings.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                      PREFERENCE CONFLICT DETECTION                                   │
│                                                                                      │
│   Cycle Example:                                                                     │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                │ │
│   │            A ≻ B                                                               │ │
│   │          ┌───────┐                                                             │ │
│   │          │       │                                                             │ │
│   │          ▼       │                                                             │ │
│   │          B       A                                                             │ │
│   │          │       ▲                                                             │ │
│   │          │ B ≻ C │                                                             │ │
│   │          ▼       │                                                             │ │
│   │          C ──────┘                                                             │ │
│   │            C ≻ A                                                               │ │
│   │                                                                                │ │
│   │   This creates: A ≻ B ≻ C ≻ A (cycle!)                                        │ │
│   │   Makes defeat computation non-deterministic                                   │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   Resolution Strategies:                                                             │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │  1. Remove Weakest: Remove preference with lowest weight                      │ │
│   │  2. Keep Most Recent: Remove oldest preference in cycle                        │ │
│   │  3. Vote-Based: Remove minority user's preferences                             │ │
│   │  4. Manual Selection: User chooses which to remove                             │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Library Functions** (`/lib/aspic/conflicts/*.ts`):
- `detectConflicts(deliberationId)` - Find preference cycles
- `suggestResolutionStrategies(conflict)` - Generate resolution options
- `applyResolution(strategy, paIds)` - Execute resolution

**Database Model**: `PreferenceApplication`

```prisma
model PreferenceApplication {
  id             String   @id @default(cuid())
  deliberationId String
  
  // Preferred/Dispreferred elements
  preferredClaimId    String?
  preferredArgumentId String?
  dispreferredClaimId    String?
  dispreferredArgumentId String?
  
  // ASPIC+ metadata
  orderingPolicy String?   // "last-link" | "weakest-link"
  weight         Float?    @default(1.0)
  justification  String?
  
  // Conflict tracking
  conflictStatus     String?   @default("none")
  conflictResolution Json?
  conflictResolvedAt DateTime?
}
```

---

### 4. Critical Question → Attack Mapping

Translates domain-specific critical questions into formal ASPIC+ attacks.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                      CQ → ASPIC+ ATTACK MAPPING                                      │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │  Argumentation Scheme: Expert Opinion                                          │ │
│   │                                                                                │ │
│   │  Premises:                                                                     │ │
│   │    P1: E is an expert in domain D                                              │ │
│   │    P2: E asserts that A is true                                                │ │
│   │    P3: A is within domain D                                                    │ │
│   │  Conclusion: A is true                                                         │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   Critical Questions and ASPIC+ Mapping:                                             │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │  CQ1: Is E really an expert?                                                   │ │
│   │    → UNDERMINING attack on P1                                                  │ │
│   │    → Target: premise "E is an expert in domain D"                              │ │
│   │                                                                                │ │
│   │  CQ2: Is E biased or unreliable?                                               │ │
│   │    → UNDERCUTTING attack on inference rule                                     │ │
│   │    → Target: applicability of Expert Opinion scheme                            │ │
│   │                                                                                │ │
│   │  CQ3: Is the claim consistent with other experts?                              │ │
│   │    → REBUTTING attack on conclusion                                            │ │
│   │    → Target: conclusion "A is true" (provide counter-conclusion)               │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   Implementation Flow:                                                               │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │  1. User selects CQ from scheme's critical question set                        │ │
│   │  2. cqToAspicAttack() determines attack type from CQ metadata                  │ │
│   │  3. System constructs attacking argument with appropriate conclusion           │ │
│   │  4. Attack relation created in ConflictApplication                             │ │
│   │  5. Defeats computed with preference check (if applicable)                     │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Library Functions** (`/lib/aspic/cqMapping.ts`):
- `cqToAspicAttack(cq, targetArg, theory)` - Main translation function
- `constructUnderminingAttack(...)` - Build undermining attack
- `constructRebuttingAttack(...)` - Build rebutting attack
- `constructUndercuttingAttack(...)` - Build undercutting attack

---

## API Layer

### Main Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/aspic/evaluate` | GET | Evaluate deliberation's ASPIC+ semantics |
| `/api/aspic/evaluate` | POST | Direct theory evaluation |
| `/api/aspic/conflicts` | GET | Detect preference cycles |
| `/api/aspic/conflicts/resolve` | POST | Apply resolution strategy |
| `/api/aspic/conflicts/undo` | POST | Undo resolution |
| `/api/aspic/transposition/generate` | POST | Generate transpositions |
| `/api/aspic/transposition/cleanup` | DELETE | Remove transpositions |
| `/api/aspic/cq-attack` | POST | Create CQ-based attack |
| `/api/aspic/validate-transposition` | GET | Validate closure |
| `/api/assumptions/*` | CRUD | Assumption management |
| `/api/ca` | POST | Create ConflictApplication |

### GET /api/aspic/evaluate Response

```typescript
{
  theory: {
    system: {
      language: string[],
      contraries: { [key: string]: string[] },
      strictRules: Rule[],
      defeasibleRules: Rule[],
    },
    knowledgeBase: {
      axioms: string[],
      premises: string[],
      assumptions: string[],
    }
  },
  semantics: {
    arguments: Array<{
      id: string,
      premises: string[],
      conclusion: string,
      defeasibleRules: string[],
      topRule: { ruleId: string, type: string } | null,
      structure: string  // JSON-encoded ArgumentStructure
    }>,
    attacks: Array<{
      attackerId: string,
      attackedId: string,
      type: "undermining" | "rebutting" | "undercutting",
      target: { premise?: string, subArgument?: object, ruleId?: string }
    }>,
    defeats: Array<{
      defeaterId: string,
      defeatedId: string,
      attackType: string,
      preferenceApplied: boolean
    }>,
    groundedExtension: string[],  // Argument IDs in extension
    justificationStatus: { [argId: string]: "in" | "out" | "undec" }
  },
  rationality: {
    wellFormed: boolean,
    violations: string[],
    postulates: {
      axiomConsistency: boolean,
      wellFormedness: boolean,
      subArgumentClosure: boolean,
      transpositionClosure: boolean
    }
  }
}
```

---

## UI Components

### Component Hierarchy

```
AspicTheoryPanel (main container)
├── AspicTheoryViewer (Theory tab)
│   ├── Language section
│   ├── Rules section (Strict/Defeasible)
│   ├── Knowledge Base section (Kn/Kp/Ka)
│   └── Contraries section
│
├── GroundedExtensionPanel (Extension tab)
│   ├── ExtensionStats (IN/OUT/UNDEC counts)
│   └── ArgumentStatusCard[] (per argument)
│
├── RationalityChecklist (Rationality tab)
│   └── PostulateItem[] (per postulate)
│
└── (Graph tab - planned)
    └── AttackGraphVisualization

ConflictResolutionPanel (separate component)
├── Conflict cards
├── Strategy selection
└── Resolution actions

ActiveAssumptionsPanel
├── AssumptionCard[] (per assumption)
├── CreateAssumptionForm
└── Status stats

AttackCreationModal
├── Attack type selection
├── Attacker selection
└── Target display
```

### Key UI Patterns

1. **Theory Viewer**: Collapsible sections for each ASPIC+ component
2. **Argument Status**: Color-coded cards (green=IN, red=OUT, amber=UNDEC)
3. **Rationality Checklist**: Postulate validation with explanations
4. **Conflict Resolution**: Guided workflow with strategy suggestions

---

## Integration Points

### AIF ↔ ASPIC+ Translation

The system maintains bidirectional translation between AIF (Argument Interchange Format) and ASPIC+:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          AIF ↔ ASPIC+ CORRESPONDENCE                                 │
│                                                                                      │
│   AIF Node Types → ASPIC+ Concepts:                                                  │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │  I-node (Information)     → Language L, KB elements (Kn/Kp/Ka)                │ │
│   │  RA-node (Rule Applic.)   → Rules (Rs/Rd), Arguments                          │ │
│   │  CA-node (Conflict)       → Attacks, Contraries                               │ │
│   │  PA-node (Preference)     → Preferences (≤', ≤)                               │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   Database → ASPIC+ Mapping:                                                         │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │  Claim                    → I-node content, Language element                  │ │
│   │  Argument                 → RA-node, Argument (ASPIC+)                        │ │
│   │  Argument.scheme          → Defeasible rule identifier                        │ │
│   │  ArgumentPremise          → Rule antecedents                                  │ │
│   │  Argument.conclusion      → Rule consequent                                   │ │
│   │  ConflictApplication      → CA-node, Attack                                   │ │
│   │  ClaimContrary            → Contrariness function entries                     │ │
│   │  PreferenceApplication    → PA-node, Preference ordering                      │ │
│   │  AssumptionUse (ACCEPTED) → Ka (weak premises)                                │ │
│   │  Claim (role=axiom)       → Kn (necessary premises)                           │ │
│   │  Claim (root, no edges)   → Kp (ordinary premises)                            │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Rationality Postulates

ASPIC+ requires satisfaction of rationality postulates for sound reasoning:

### 1. Sub-Argument Closure
> If A ∈ E, then Sub(A) ⊆ E

All sub-arguments of a justified argument must also be justified.

### 2. Closure Under Strict Rules
> If all antecedents of strict rule r are in Conc(E), then r's consequent is in Conc(E)

The extension is closed under logical consequence.

### 3. Direct Consistency
> No φ, ψ ∈ Conc(E) where ψ ∈ φ̄

The extension does not contain contradictions.

### 4. Indirect Consistency
> Closure of Conc(E) under strict rules is consistent

Derived conclusions are also consistent.

### Necessary Conditions

For rationality postulates to hold:
1. **Axiom Consistency**: Kn must be consistent (no φ, ψ ∈ Kn with ψ ∈ φ̄)
2. **Transposition Closure**: Rs must be closed under contraposition
3. **Reasonable Preferences**: Preference ordering must be acyclic and well-defined

---

## File Reference

### Engine Library (`/lib/aspic/`)

| File | Purpose |
|------|---------|
| `types.ts` | Core type definitions |
| `index.ts` | Module exports |
| `arguments.ts` | Argument construction |
| `attacks.ts` | Attack computation |
| `defeats.ts` | Defeat with preferences |
| `semantics.ts` | Grounded extension |
| `transposition.ts` | Contrapositive rules |
| `rationality.ts` | Postulate checking |
| `cqMapping.ts` | CQ → Attack mapping |
| `validation.ts` | Theory validation |
| `conflictHelpers.ts` | Conflict utilities |
| `conflicts/detection.ts` | Cycle detection |
| `conflicts/resolution.ts` | Resolution strategies |
| `translation/aifToASPIC.ts` | AIF → ASPIC+ |
| `translation/aspicToAIF.ts` | ASPIC+ → AIF |
| `translation/integration.ts` | Bidirectional sync |

### API Routes (`/app/api/aspic/`)

| Route | Purpose |
|-------|---------|
| `evaluate/route.ts` | Main evaluation endpoint |
| `conflicts/route.ts` | Conflict detection |
| `conflicts/resolve/route.ts` | Resolution application |
| `conflicts/undo/route.ts` | Resolution rollback |
| `transposition/generate/route.ts` | Auto-generate |
| `transposition/cleanup/route.ts` | Remove generated |
| `validate-transposition/route.ts` | Validate closure |
| `cq-attack/route.ts` | CQ-based attacks |

### UI Components (`/components/aspic/`)

| Component | Purpose |
|-----------|---------|
| `AspicTheoryPanel.tsx` | Main container with tabs |
| `AspicTheoryViewer.tsx` | Theory display |
| `GroundedExtensionPanel.tsx` | Extension results |
| `ArgumentStatusCard.tsx` | Single argument status |
| `ExtensionStats.tsx` | Summary statistics |
| `RationalityChecklist.tsx` | Postulate validation |
| `ConflictResolutionPanel.tsx` | Cycle resolution |
| `AttackCreationModal.tsx` | Attack creation UI |

### Assumption Components (`/components/assumptions/`)

| Component | Purpose |
|-----------|---------|
| `ActiveAssumptionsPanel.tsx` | List assumptions |
| `AssumptionCard.tsx` | Single assumption |
| `CreateAssumptionForm.tsx` | New assumption form |
| `AssumptionDependencyGraph.tsx` | Impact analysis |

---

## References

1. Modgil, S., & Prakken, H. (2013). A general account of argumentation with preferences. *Artificial Intelligence*, 195, 361-397.

2. Caminada, M., & Amgoud, L. (2007). On the evaluation of argumentation formalisms. *Artificial Intelligence*, 171(5-6), 286-310.

3. Dung, P. M. (1995). On the acceptability of arguments and its fundamental role in nonmonotonic reasoning, logic programming and n-person games. *Artificial Intelligence*, 77(2), 321-357.

4. Bex, F., Prakken, H., Reed, C., & Walton, D. (2003). Towards a formal account of reasoning about evidence: Argumentation schemes and generalisations. *Artificial Intelligence and Law*, 11(2-3), 125-165.

---

*Document Version: 1.0*  
*Last Updated: December 2025*  
*Author: Mesh Engineering Team*
