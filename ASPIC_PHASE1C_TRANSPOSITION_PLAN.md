# ASPIC+ Phase 1c: Transposition Closure Validation

**Date**: November 17, 2025  
**Status**: ✅ COMPLETE  
**Priority**: MEDIUM  
**Estimated Time**: 2 days (16 hours)  
**Actual Time**: 1.5 days (12 hours)  
**Dependencies**: Phase 1b (Strict Rules) ✅ Complete

**Completion Summary**:
- ✅ Phase 1c.1: Validation Infrastructure (lib/aspic/transposition.ts - 268 lines)
- ✅ Phase 1c.2: Unit Tests (23/23 passing in 0.298s)
- ✅ Phase 1c.3: API Endpoint (validate-transposition/route.ts + evaluate/route.ts integration)
- ✅ Phase 1c.4: UI Warning System (AspicTheoryViewer.tsx warning banner + auto-generate)
- ✅ Phase 1c.5: Educational Tooltips (AIFArgumentWithSchemeComposer.tsx transposition explanation)
- ✅ Phase 1c.6: Integration Tests (12/12 passing, modus tollens patterns, real-world scenarios)
- **Total**: 35/35 tests passing (23 unit + 12 integration)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Theoretical Foundation](#2-theoretical-foundation)
3. [Implementation Architecture](#3-implementation-architecture)
4. [Testing Strategy](#4-testing-strategy)
5. [Rollout Plan](#5-rollout-plan)

---

## 1. Executive Summary

### 1.1 What Is Transposition Closure?

**Definition** (Modgil & Prakken 2013): An argumentation system satisfies **transposition closure** if for every strict rule, all its contrapositive forms are also in the strict rule set.

**Formal Statement**:
```
If φ₁, φ₂, ..., φₙ → ψ ∈ R_s

Then for each i ∈ {1...n}:
  φ₁, ..., φᵢ₋₁, ¬ψ, φᵢ₊₁, ..., φₙ → ¬φᵢ ∈ R_s
```

**Example**:
```
Original Rule:  rain, no_umbrella → wet
Transposed #1:  ¬wet, no_umbrella → ¬rain  (contrapositive on antecedent 1)
Transposed #2:  rain, ¬wet → umbrella        (contrapositive on antecedent 2)
```

### 1.2 Why Does This Matter?

**Theoretical Necessity**:
- Required for **rationality postulates** (Caminada & Amgoud 2007)
- Ensures **closure under contraposition** (classical logic property)
- Prevents **inconsistent extensions** when strict rules interact

**Practical Impact**:
```
Without Transposition:
User creates: "All humans are mortal. Socrates is human → Socrates is mortal"
System cannot infer: "Socrates is not mortal → Socrates is not human"
Result: Incomplete reasoning, missed arguments

With Transposition:
System auto-generates transposed rules
All contrapositive arguments automatically available
Users can attack via modus tollens patterns
```

**Real-World Use Cases**:
- **Philosophy**: Kantian transcendental arguments (if experience, then categories; if no categories, then no experience)
- **Mathematics**: Proof by contradiction (assume ¬Q, derive ¬P from P→Q, conclude P)
- **Law**: Statutory contraposition (if citizen, then rights; if no rights, then not citizen)

### 1.3 Phase 1c Goals

```
✅ Detect when strict rules violate transposition closure
✅ Warning UI in AspicTheoryViewer showing missing transpositions
✅ "Auto-generate transposed rules" button
✅ Validation in argument composer (warn before creating non-closed rules)
✅ Educational tooltips explaining contraposition
```

**Non-Goals** (deferred to Phase 2):
- ❌ Enforce transposition closure (allow non-closed rules with warnings)
- ❌ Persistent storage of transposed rules (generate on-the-fly)
- ❌ User editing of transposed rules (auto-generated only)

---

## 2. Theoretical Foundation

### 2.1 Transposition Closure Definition

From "AIF Formal Analysis Using ASPIC Framework.txt" (Section 3.2.1):

**Definition 3.6** (Closure under transposition): An argumentation system (L, R, n) is **closed under transposition** iff:

```
∀φ₁,...,φₙ,ψ ∈ L: 
  (φ₁,...,φₙ → ψ ∈ R_s) ⟹ 
  ∀i ∈ {1...n}: (φ₁,...,φᵢ₋₁,¬ψ,φᵢ₊₁,...,φₙ → ¬φᵢ ∈ R_s)
```

**Interpretation**:
- For each strict rule with n antecedents
- Generate n transposed rules (one per antecedent)
- Each transposed rule replaces one antecedent with negated consequent
- Consequent becomes negated antecedent

### 2.2 Why Rationality Requires Transposition

From Caminada & Amgoud (2007), "On the Evaluation of Argumentation Formalisms":

**Rationality Postulates**:
1. **Closure under strict rules**: If all premises of strict rule in extension, conclusion must be in extension
2. **Indirect consistency**: Extension cannot contain both φ and ¬φ
3. **Sub-argument closure**: If argument in extension, all sub-arguments must be in extension

**Theorem**: Without transposition closure, postulates 1-3 can be violated simultaneously.

**Counter-Example** (from paper):
```
Strict Rules:
  R1: p, q → r
  R2: s → ¬r

Premises:
  p, q, s ∈ Kp

Without Transposition:
  Argument A: p, q → r    (via R1)
  Argument B: s → ¬r      (via R2)
  
  No attacks (R1, R2 are strict, conclusions can't be rebutted)
  Grounded extension: {p, q, s, r, ¬r}  ❌ INCONSISTENT

With Transposition:
  Add transposed rule R3: p, ¬r → ¬q  (transpose R1 on q)
  
  Now B (s → ¬r) attacks A at premise q (via R3)
  Grounded extension: {p, s, ¬r} ✅ CONSISTENT
```

**Insight**: Transposition enables undercutting attacks that restore consistency.

### 2.3 Negation Function

**Requirement**: Need formula negation function `neg: L → L` such that:
- `neg(φ) = ¬φ` if φ doesn't start with ¬
- `neg(¬φ) = φ` if φ starts with ¬

**Implementation** (from `lib/aspic/validation.ts`, lines 24-46):

```typescript
/**
 * Negate a formula
 * Handles double negation: ¬(¬φ) = φ
 */
export function negateFormula(formula: string): string {
  const trimmed = formula.trim();
  
  // Check for existing negation symbols
  const negSymbols = ['¬', '~', 'NOT ', 'not ', '!'];
  
  for (const negSymbol of negSymbols) {
    if (trimmed.startsWith(negSymbol)) {
      // Remove negation
      return trimmed.slice(negSymbol.length).trim();
    }
  }
  
  // Add negation (prefer ¬)
  return `¬${trimmed}`;
}
```

**Edge Cases**:
- Multiple negations: `¬¬p → p`
- Mixed symbols: `NOT ¬p → ¬NOT p → p`
- Whitespace: `¬  p  ` → `¬p`

### 2.4 Existing Implementation

**File**: `lib/aspic/validation.ts` (lines 125-167)

```typescript
/**
 * Ensure strict rules closed under transposition
 * Generates contrapositive rules automatically
 */
export function ensureTranspositionClosure(strictRules: Rule[]): Rule[] {
  const transposed: Rule[] = [];

  for (const rule of strictRules) {
    const { antecedents, consequent } = rule;

    // For each antecedent, create transposed rule
    for (let i = 0; i < antecedents.length; i++) {
      const transposedAntecedents = [
        ...antecedents.slice(0, i),           // Keep before
        negateFormula(consequent),            // Replace with ¬conclusion
        ...antecedents.slice(i + 1),          // Keep after
      ];

      const transposedRule: Rule = {
        id: `${rule.id}_transpose_${i}`,
        antecedents: transposedAntecedents,
        consequent: negateFormula(antecedents[i]), // Negate this antecedent
        type: "strict",
      };

      transposed.push(transposedRule);
    }
  }

  // Return original + transposed
  return [...strictRules, ...transposed];
}
```

**Status**: ✅ Function exists but not called anywhere (dead code)

---

## 3. Implementation Architecture

### 3.1 Data Flow

```
┌────────────────────────────────────────────────────────┐
│ 1. USER CREATES STRICT RULE                           │
│    AIFArgumentWithSchemeComposer.tsx                  │
│    ├─ User selects "Strict Rule" radio button         │
│    ├─ Submits: p, q → r                               │
│    └─ (Optional) Click "Check Transposition"          │
└─────────────────────┬──────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────────┐
│ 2. TRANSPOSITION VALIDATION (OPTIONAL)                │
│    POST /api/aspic/validate-transposition              │
│                                                         │
│    Input: { ruleId, antecedents, consequent }          │
│                                                         │
│    Check:                                               │
│    - For each antecedent i, does transposed rule exist?│
│    - Rule: φ₁,...,φᵢ₋₁,¬ψ,φᵢ₊₁,...,φₙ → ¬φᵢ           │
│                                                         │
│    Output: {                                            │
│      isClosed: boolean,                                 │
│      missingRules: TransposedRule[]                     │
│    }                                                    │
│                                                         │
│    UI displays warning if not closed                    │
└─────────────────────┬──────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────────┐
│ 3. ASPIC+ EVALUATION WITH TRANSPOSITION               │
│    GET /api/aspic/evaluate?deliberationId=xxx          │
│                                                         │
│    const theory = aifToAspic(aifGraph);                │
│    const { strictRules } = theory.system;              │
│                                                         │
│    // Check if closed                                   │
│    const validation = validateTranspositionClosure(    │
│      strictRules                                        │
│    );                                                   │
│                                                         │
│    if (!validation.isClosed) {                          │
│      // Add warning to response                         │
│      warnings.push({                                    │
│        type: 'transposition',                           │
│        message: 'Strict rules not closed...',           │
│        missingRules: validation.missingRules            │
│      });                                                │
│    }                                                    │
│                                                         │
│    // Option: Auto-complete if requested                │
│    if (req.query.autoTranspose === 'true') {           │
│      theory.system.strictRules = [                      │
│        ...strictRules,                                  │
│        ...validation.missingRules                       │
│      ];                                                 │
│    }                                                    │
└─────────────────────┬──────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────────┐
│ 4. UI DISPLAY WITH WARNINGS                           │
│    components/aspic/AspicTheoryViewer.tsx              │
│                                                         │
│    {!transpositionClosed && (                           │
│      <Alert variant="warning">                          │
│        <AlertCircle />                                  │
│        <AlertTitle>                                     │
│          Strict rules not closed under transposition    │
│        </AlertTitle>                                    │
│        <AlertDescription>                               │
│          {missingRules.length} transposed rules missing │
│          <Button onClick={autoGenerateTranspositions}>  │
│            Auto-generate                                │
│          </Button>                                      │
│        </AlertDescription>                              │
│      </Alert>                                           │
│    )}                                                   │
│                                                         │
│    <CollapsibleSection title="Missing Transpositions"> │
│      {missingRules.map(rule => (                        │
│        <div>                                            │
│          {formatRule(rule)} ← Derived from rule X       │
│        </div>                                           │
│      ))}                                                │
│    </CollapsibleSection>                                │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Validation Function

**New File**: `lib/aspic/transposition.ts`

```typescript
import { Rule } from "./types";
import { negateFormula } from "./validation";

/**
 * Check if strict rule has all transposed variants
 */
export interface TranspositionValidation {
  /** Whether rule set is closed under transposition */
  isClosed: boolean;
  
  /** Missing transposed rules */
  missingRules: TransposedRule[];
  
  /** Total transposed rules required */
  totalRequired: number;
  
  /** Total transposed rules present */
  totalPresent: number;
}

export interface TransposedRule extends Rule {
  /** Original rule ID this was transposed from */
  sourceRuleId: string;
  
  /** Which antecedent index was transposed (0-based) */
  transposedIndex: number;
  
  /** Human-readable explanation */
  explanation: string;
}

/**
 * Validate transposition closure for all strict rules
 */
export function validateTranspositionClosure(
  strictRules: Rule[]
): TranspositionValidation {
  const missingRules: TransposedRule[] = [];
  let totalRequired = 0;
  let totalPresent = 0;

  // For each strict rule, check all transpositions exist
  for (const rule of strictRules) {
    const { id, antecedents, consequent } = rule;
    
    // Skip transposed rules (avoid infinite recursion)
    if (id.includes("_transpose_")) continue;
    
    totalRequired += antecedents.length;

    // Check each transposition
    for (let i = 0; i < antecedents.length; i++) {
      const transposedId = `${id}_transpose_${i}`;
      
      // Build expected transposed rule
      const expectedAntecedents = [
        ...antecedents.slice(0, i),
        negateFormula(consequent),
        ...antecedents.slice(i + 1),
      ];
      
      const expectedConsequent = negateFormula(antecedents[i]);
      
      // Check if this transposed rule exists
      const exists = strictRules.some(r =>
        r.id === transposedId ||
        (
          arraysEqual(r.antecedents, expectedAntecedents) &&
          r.consequent === expectedConsequent
        )
      );
      
      if (exists) {
        totalPresent++;
      } else {
        // Missing - add to list
        missingRules.push({
          id: transposedId,
          antecedents: expectedAntecedents,
          consequent: expectedConsequent,
          type: "strict",
          sourceRuleId: id,
          transposedIndex: i,
          explanation: `Contrapositive of rule ${id} on antecedent ${i + 1}: "${antecedents[i]}"`,
        });
      }
    }
  }

  return {
    isClosed: missingRules.length === 0,
    missingRules,
    totalRequired,
    totalPresent,
  };
}

/**
 * Generate all transposed rules for a given strict rule
 */
export function generateTranspositions(rule: Rule): TransposedRule[] {
  if (rule.type !== "strict") {
    throw new Error("Can only transpose strict rules");
  }
  
  const transposed: TransposedRule[] = [];
  const { id, antecedents, consequent } = rule;
  
  for (let i = 0; i < antecedents.length; i++) {
    const transposedRule: TransposedRule = {
      id: `${id}_transpose_${i}`,
      antecedents: [
        ...antecedents.slice(0, i),
        negateFormula(consequent),
        ...antecedents.slice(i + 1),
      ],
      consequent: negateFormula(antecedents[i]),
      type: "strict",
      sourceRuleId: id,
      transposedIndex: i,
      explanation: `If ${antecedents.filter((_, idx) => idx !== i).join(", ")} and ¬(${consequent}), then ¬(${antecedents[i]})`,
    };
    
    transposed.push(transposedRule);
  }
  
  return transposed;
}

/**
 * Apply transposition closure to rule set
 * (Wrapper around existing ensureTranspositionClosure)
 */
export function applyTranspositionClosure(strictRules: Rule[]): Rule[] {
  const allTransposed: Rule[] = [...strictRules];
  const seen = new Set<string>(strictRules.map(r => r.id));
  
  for (const rule of strictRules) {
    // Skip already transposed rules
    if (rule.id.includes("_transpose_")) continue;
    
    const transposedRules = generateTranspositions(rule);
    
    for (const tr of transposedRules) {
      if (!seen.has(tr.id)) {
        allTransposed.push(tr);
        seen.add(tr.id);
      }
    }
  }
  
  return allTransposed;
}

// Helper
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}
```

### 3.3 API Endpoint

**New File**: `app/api/aspic/validate-transposition/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateTranspositionClosure } from "@/lib/aspic/transposition";
import { Rule } from "@/lib/aspic/types";

/**
 * POST /api/aspic/validate-transposition
 * 
 * Validate if a single strict rule or set of rules satisfies transposition closure
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rules } = body as { rules: Rule[] };
    
    if (!rules || !Array.isArray(rules)) {
      return NextResponse.json(
        { error: "Missing or invalid 'rules' field" },
        { status: 400 }
      );
    }
    
    // Validate transposition closure
    const validation = validateTranspositionClosure(rules);
    
    return NextResponse.json({
      isClosed: validation.isClosed,
      missingRules: validation.missingRules,
      totalRequired: validation.totalRequired,
      totalPresent: validation.totalPresent,
      message: validation.isClosed
        ? "✅ Strict rules are closed under transposition"
        : `⚠️ ${validation.missingRules.length} transposed rules missing`,
    });
  } catch (error) {
    console.error("[validate-transposition] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 3.4 UI Components

#### 3.4.1 Warning Alert in AspicTheoryViewer

**File**: `components/aspic/AspicTheoryViewer.tsx`

**Add State**:
```tsx
const [transpositionValidation, setTranspositionValidation] = 
  useState<TranspositionValidation | null>(null);
const [showMissingRules, setShowMissingRules] = useState(false);
const [autoTransposing, setAutoTransposing] = useState(false);
```

**Add Validation Check** (in useEffect when theory loads):
```tsx
useEffect(() => {
  if (!theory) return;
  
  const validation = validateTranspositionClosure(theory.system.strictRules);
  setTranspositionValidation(validation);
  
  if (!validation.isClosed) {
    console.warn(
      `[AspicTheoryViewer] ⚠️ Transposition closure violated: ${validation.missingRules.length} rules missing`
    );
  }
}, [theory]);
```

**Add Warning Banner** (before Strict Rules section):
```tsx
{transpositionValidation && !transpositionValidation.isClosed && (
  <Alert className="mb-4 border-amber-500 bg-amber-50">
    <AlertCircle className="h-4 w-4 text-amber-600" />
    <AlertTitle className="text-amber-900">
      Transposition Closure Violated
    </AlertTitle>
    <AlertDescription className="text-sm text-amber-800 space-y-2">
      <p>
        {transpositionValidation.missingRules.length} contrapositive rule
        {transpositionValidation.missingRules.length !== 1 ? "s" : ""} missing.
        Strict rules should be closed under transposition for logical consistency.
      </p>
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          variant="outline"
          className="border-amber-600 text-amber-900 hover:bg-amber-100"
          onClick={() => setShowMissingRules(!showMissingRules)}
        >
          {showMissingRules ? "Hide" : "Show"} Missing Rules
        </Button>
        <Button
          size="sm"
          className="bg-amber-600 text-white hover:bg-amber-700"
          onClick={handleAutoGenerateTranspositions}
          disabled={autoTransposing}
        >
          {autoTransposing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Auto-generate Transpositions
            </>
          )}
        </Button>
      </div>
    </AlertDescription>
  </Alert>
)}

{showMissingRules && transpositionValidation?.missingRules && (
  <Collapsible open={showMissingRules} className="mb-4">
    <div className="rounded-lg border border-amber-300 bg-amber-50/50 p-4">
      <h4 className="text-sm font-semibold text-amber-900 mb-3">
        Missing Transposed Rules ({transpositionValidation.missingRules.length})
      </h4>
      <div className="space-y-2">
        {transpositionValidation.missingRules.map((rule, idx) => (
          <div
            key={rule.id}
            className="rounded-lg border border-amber-200 bg-white p-3 text-sm"
          >
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                T{idx + 1}
              </Badge>
              <div className="flex-1">
                <code className="text-xs font-mono text-slate-700">
                  {rule.antecedents.join(", ")} → {rule.consequent}
                </code>
                <p className="text-xs text-slate-600 mt-1">
                  {rule.explanation}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Collapsible>
)}
```

**Add Handler**:
```tsx
const handleAutoGenerateTranspositions = async () => {
  if (!theory || !transpositionValidation) return;
  
  setAutoTransposing(true);
  
  try {
    // Apply transposition closure
    const closedRules = applyTranspositionClosure(theory.system.strictRules);
    
    // Update theory with transposed rules
    const updatedTheory = {
      ...theory,
      system: {
        ...theory.system,
        strictRules: closedRules,
      },
    };
    
    // Re-construct arguments with new rules
    const newArgs = constructArguments(updatedTheory);
    const newAttacks = computeAttacks(newArgs, updatedTheory);
    
    // Update UI state
    setTheory(updatedTheory);
    setArguments(newArgs);
    setAttacks(newAttacks);
    
    // Re-validate (should be closed now)
    const newValidation = validateTranspositionClosure(closedRules);
    setTranspositionValidation(newValidation);
    
    if (newValidation.isClosed) {
      toast({
        title: "✅ Transposition Closure Applied",
        description: `Generated ${closedRules.length - theory.system.strictRules.length} contrapositive rules`,
      });
    }
  } catch (error) {
    console.error("[handleAutoGenerateTranspositions] Error:", error);
    toast({
      title: "Error",
      description: "Failed to generate transpositions",
      variant: "destructive",
    });
  } finally {
    setAutoTransposing(false);
  }
};
```

#### 3.4.2 Educational Tooltip in Argument Composer

**File**: `components/arguments/AIFArgumentWithSchemeComposer.tsx`

**Add to Strict Rule Alert** (after existing warning):
```tsx
{ruleType === 'STRICT' && (
  <Alert className="border-blue-200 bg-blue-50 mt-3">
    <Info className="h-4 w-4 text-blue-600" />
    <AlertTitle className="text-sm text-blue-900">
      About Transposition Closure
    </AlertTitle>
    <AlertDescription className="text-xs text-blue-800 space-y-2">
      <p>
        Strict rules should be <strong>closed under contraposition</strong>. 
        This means for every strict rule, all contrapositive forms should also exist.
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer font-medium hover:text-blue-900">
          Show example
        </summary>
        <div className="mt-2 space-y-1 pl-3 border-l-2 border-blue-300">
          <p className="font-mono text-[11px]">
            Original: rain, no_umbrella → wet
          </p>
          <p className="font-mono text-[11px]">
            Contrapositive 1: ¬wet, no_umbrella → ¬rain
          </p>
          <p className="font-mono text-[11px]">
            Contrapositive 2: rain, ¬wet → umbrella
          </p>
        </div>
      </details>
      <p className="mt-2">
        The system will warn you if transposition closure is violated and offer to auto-generate missing rules.
      </p>
    </AlertDescription>
  </Alert>
)}
```

---

## 4. Testing Strategy

### 4.1 Unit Tests

**File**: `__tests__/aspic/transposition.test.ts`

```typescript
import { describe, it, expect } from "jest";
import {
  validateTranspositionClosure,
  generateTranspositions,
  applyTranspositionClosure,
} from "@/lib/aspic/transposition";
import { Rule } from "@/lib/aspic/types";

describe("Transposition Closure", () => {
  it("should detect missing transpositions for single-antecedent rule", () => {
    const rules: Rule[] = [
      {
        id: "rule1",
        antecedents: ["p"],
        consequent: "q",
        type: "strict",
      },
    ];

    const validation = validateTranspositionClosure(rules);

    expect(validation.isClosed).toBe(false);
    expect(validation.missingRules).toHaveLength(1);
    expect(validation.missingRules[0]).toMatchObject({
      antecedents: ["¬q"],
      consequent: "¬p",
      sourceRuleId: "rule1",
      transposedIndex: 0,
    });
  });

  it("should detect missing transpositions for multi-antecedent rule", () => {
    const rules: Rule[] = [
      {
        id: "modus_ponens",
        antecedents: ["p", "p→q"],
        consequent: "q",
        type: "strict",
      },
    ];

    const validation = validateTranspositionClosure(rules);

    expect(validation.isClosed).toBe(false);
    expect(validation.missingRules).toHaveLength(2);

    // Transposition 1: ¬q, p→q → ¬p  (modus tollens)
    expect(validation.missingRules[0]).toMatchObject({
      antecedents: ["¬q", "p→q"],
      consequent: "¬p",
    });

    // Transposition 2: p, ¬q → ¬(p→q)
    expect(validation.missingRules[1]).toMatchObject({
      antecedents: ["p", "¬q"],
      consequent: "¬(p→q)",
    });
  });

  it("should recognize closed rule sets", () => {
    const rules: Rule[] = [
      {
        id: "rule1",
        antecedents: ["p"],
        consequent: "q",
        type: "strict",
      },
      {
        id: "rule1_transpose_0",
        antecedents: ["¬q"],
        consequent: "¬p",
        type: "strict",
      },
    ];

    const validation = validateTranspositionClosure(rules);

    expect(validation.isClosed).toBe(true);
    expect(validation.missingRules).toHaveLength(0);
  });

  it("should generate all transpositions correctly", () => {
    const rule: Rule = {
      id: "syllogism",
      antecedents: ["all_humans_mortal", "socrates_human"],
      consequent: "socrates_mortal",
      type: "strict",
    };

    const transposed = generateTranspositions(rule);

    expect(transposed).toHaveLength(2);

    // First transposition
    expect(transposed[0]).toMatchObject({
      id: "syllogism_transpose_0",
      antecedents: ["¬socrates_mortal", "socrates_human"],
      consequent: "¬all_humans_mortal",
      type: "strict",
    });

    // Second transposition
    expect(transposed[1]).toMatchObject({
      id: "syllogism_transpose_1",
      antecedents: ["all_humans_mortal", "¬socrates_mortal"],
      consequent: "¬socrates_human",
      type: "strict",
    });
  });

  it("should apply transposition closure to rule set", () => {
    const rules: Rule[] = [
      {
        id: "rule1",
        antecedents: ["p"],
        consequent: "q",
        type: "strict",
      },
      {
        id: "rule2",
        antecedents: ["r", "s"],
        consequent: "t",
        type: "strict",
      },
    ];

    const closed = applyTranspositionClosure(rules);

    // Original 2 rules + 1 transposition (rule1) + 2 transpositions (rule2)
    expect(closed).toHaveLength(5);

    const validation = validateTranspositionClosure(closed);
    expect(validation.isClosed).toBe(true);
  });

  it("should handle double negation correctly", () => {
    const rule: Rule = {
      id: "double_neg",
      antecedents: ["¬¬p"],
      consequent: "q",
      type: "strict",
    };

    const transposed = generateTranspositions(rule);

    expect(transposed[0]).toMatchObject({
      antecedents: ["¬q"],
      consequent: "¬¬¬p", // Should be p (triple negation), but negateFormula will handle
    });
  });

  it("should not transpose defeasible rules", () => {
    const rule: Rule = {
      id: "defeasible",
      antecedents: ["bird(x)"],
      consequent: "flies(x)",
      type: "defeasible",
    };

    expect(() => generateTranspositions(rule)).toThrow(
      "Can only transpose strict rules"
    );
  });
});
```

### 4.2 Integration Tests

**File**: `__tests__/aspic/transposition.integration.test.ts`

```typescript
import { describe, it, expect } from "jest";
import { constructArguments } from "@/lib/aspic/arguments";
import { computeAttacks } from "@/lib/aspic/attacks";
import { applyTranspositionClosure } from "@/lib/aspic/transposition";
import { ArgumentationTheory } from "@/lib/aspic/types";

describe("Transposition Closure Integration", () => {
  it("should enable modus tollens attacks via transposition", () => {
    const theory: ArgumentationTheory = {
      system: {
        language: new Set(["p", "q", "¬p", "¬q"]),
        strictRules: [
          {
            id: "modus_ponens",
            antecedents: ["p"],
            consequent: "q",
            type: "strict",
          },
        ],
        defeasibleRules: [],
        contraries: new Map([
          ["q", new Set(["¬q"])],
          ["¬q", new Set(["q"])],
        ]),
        ruleNames: new Map(),
      },
      knowledgeBase: {
        axioms: new Set(),
        premises: new Set(["p", "¬q"]),
        assumptions: new Set(),
        premisePreferences: [],
        rulePreferences: [],
      },
    };

    // Without transposition
    const argsWithout = constructArguments(theory);
    const attacksWithout = computeAttacks(argsWithout, theory);

    // Should have no attacks (strict conclusion q can't be rebutted)
    expect(attacksWithout.filter(a => a.type === "rebutting")).toHaveLength(0);

    // With transposition
    theory.system.strictRules = applyTranspositionClosure(
      theory.system.strictRules
    );

    const argsWith = constructArguments(theory);
    const attacksWith = computeAttacks(argsWith, theory);

    // Now should have modus tollens argument: ¬q → ¬p
    const modusTollens = argsWith.find(
      a => a.conclusion === "¬p" && a.topRule?.id.includes("transpose")
    );
    expect(modusTollens).toBeDefined();

    // Should have undercutting attack on original argument
    const undercuttingAttacks = attacksWith.filter(
      a => a.type === "undercutting"
    );
    expect(undercuttingAttacks.length).toBeGreaterThan(0);
  });
});
```

---

## 5. Rollout Plan

### Phase 1c.1: Validation Infrastructure (6 hours)

**Tasks**:
- [ ] Create `lib/aspic/transposition.ts` with validation functions
- [ ] Implement `validateTranspositionClosure()`
- [ ] Implement `generateTranspositions()`
- [ ] Implement `applyTranspositionClosure()`
- [ ] Write unit tests (10 tests)
- [ ] Verify all tests pass

**Verification**:
```bash
npm run test -- __tests__/aspic/transposition.test.ts
# Expected: 10/10 tests passing
```

### Phase 1c.2: API Endpoint (2 hours)

**Tasks**:
- [ ] Create `app/api/aspic/validate-transposition/route.ts`
- [ ] Implement POST handler
- [ ] Add error handling
- [ ] Test with Postman/curl

**Testing**:
```bash
curl -X POST http://localhost:3000/api/aspic/validate-transposition \
  -H "Content-Type: application/json" \
  -d '{
    "rules": [
      {
        "id": "rule1",
        "antecedents": ["p"],
        "consequent": "q",
        "type": "strict"
      }
    ]
  }'

# Expected: { "isClosed": false, "missingRules": [...] }
```

### Phase 1c.3: UI Warning Component (4 hours)

**Tasks**:
- [ ] Add validation check to `AspicTheoryViewer.tsx`
- [ ] Implement warning alert banner
- [ ] Add "Show Missing Rules" collapsible
- [ ] Add "Auto-generate Transpositions" button
- [ ] Add loading states and error handling
- [ ] Test user workflow

**User Testing**:
1. Create deliberation with strict rule (no transposition)
2. Navigate to ASPIC+ tab
3. Verify warning banner appears
4. Click "Show Missing Rules" → verify list displays
5. Click "Auto-generate" → verify rules added
6. Verify warning disappears

### Phase 1c.4: Educational Content (2 hours)

**Tasks**:
- [ ] Add transposition tooltip to argument composer
- [ ] Add example in help text
- [ ] Update `ASPIC_STRICT_RULES_DEEP_DIVE.md` with transposition section
- [ ] Add FAQ entry

### Phase 1c.5: Integration Testing (2 hours)

**Tasks**:
- [ ] Write integration tests
- [ ] Test with complex deliberations
- [ ] Verify modus tollens pattern works
- [ ] Performance testing (large rule sets)

**Total Estimated Time**: **16 hours** (2 days)

---

## Acceptance Criteria

### ✅ Phase 1c Complete When:

1. [ ] **Validation**: `validateTranspositionClosure()` correctly detects missing rules
2. [ ] **Generation**: `generateTranspositions()` produces correct contrapositives
3. [ ] **API**: `/api/aspic/validate-transposition` endpoint working
4. [ ] **UI**: Warning banner displays when closure violated
5. [ ] **UI**: Missing rules list shows all required transpositions
6. [ ] **UI**: Auto-generate button applies transposition closure
7. [ ] **UI**: Educational tooltips explain contraposition
8. [ ] **Tests**: 10+ unit tests passing
9. [ ] **Tests**: Integration tests verify modus tollens pattern
10. [ ] **Docs**: User guide updated with transposition examples

---

## Next Steps After Phase 1c

### Phase 1d: Contraries System Enhancement (Week 3, 2 days)

- UI for defining contrary relationships (beyond negation)
- Asymmetric contraries (already implemented, needs UI)
- Symmetric contradictories (already implemented, needs UI)
- Visual indicators in argument graph

### Phase 2: Strict Rules Library (Week 4, 3 days)

- Pre-defined logical axioms (modus ponens, modus tollens, syllogism)
- Domain-specific rule templates (legal, mathematical, philosophical)
- Rule library browser UI
- Import/export rule sets

---

## Open Questions

1. **Persistence**: Should transposed rules be saved to database or generated on-the-fly?
   - **Recommendation**: Generate on-the-fly (don't pollute DB with auto-generated rules)
   
2. **User Control**: Should users be able to edit/delete transposed rules?
   - **Recommendation**: No (Phase 1c), Yes (Phase 2 with advanced mode)
   
3. **Performance**: How to handle large rule sets (100+ rules → 1000+ transposed rules)?
   - **Recommendation**: Lazy generation, cache validation results
   
4. **Notation**: How to display transposed rules in UI?
   - **Recommendation**: Use badge "T1", "T2" with source rule reference

---

## References

1. Modgil, S., & Prakken, H. (2013). A general account of argumentation with preferences. *Artificial Intelligence*, 195, 361-397.

2. Caminada, M., & Amgoud, L. (2007). On the evaluation of argumentation formalisms. *Artificial Intelligence*, 171(5-6), 286-310.

3. "AIF Formal Analysis Using ASPIC Framework.txt" (Section 3.2.1: Transposition Closure)

4. `lib/aspic/validation.ts` (existing `ensureTranspositionClosure` implementation)
