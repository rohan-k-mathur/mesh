# ASPIC+ Phase 4: Preference & Ordering System - Implementation Roadmap

## Overview
Integrate existing AIF preference infrastructure with ASPIC+ defeat computation to enable preference-based argument evaluation. This phase builds the **translation layer** connecting AIF PA-nodes (Preference Application) with ASPIC+ ordering algorithms.

**Estimated Time**: 6 days  
**Status**: ⏳ Ready to begin  
**Last Updated**: 2025-01-17 (Post-Infrastructure Audit)  

**Theoretical Foundation**:
- Modgil & Prakken (2014) - `docs/arg-computation-research/ASPIC_Argumentation with Preferences.md`
- Bex, Prakken, Reed (2013) - `docs/arg-computation-research/AIF Formal Analysis Using the ASPIC Framework.md`

**Infrastructure Audit**: See `ASPIC_PHASE4_INFRASTRUCTURE_AUDIT.md` for complete analysis

---

## 🎯 Executive Summary

### What Already Exists ✅

**AIF Preferences (PA-Nodes)**:
- ✅ Prisma model: `PreferenceApplication` with claim/argument/scheme preferences
- ✅ API endpoint: `POST /api/pa` for creating preferences
- ✅ UI component: `PreferenceAttackModal` (800+ lines, full-featured)
- ✅ Visualization: `PreferenceBadge` displays aggregate counts
- ✅ Import/Export: AIF JSON-LD with PA-node support

**ASPIC+ Defeat Logic**:
- ✅ Full implementation: `lib/aspic/defeats.ts` (400+ lines)
- ✅ Last-link ordering (legal/normative reasoning)
- ✅ Weakest-link ordering (epistemic reasoning)
- ✅ Elitist/Democratic set comparisons
- ✅ Reasonable ordering validation
- ✅ Special cases: undercutting, assumptions, observation-based

### What's Missing ❌

**Critical Gap**: No translation layer connecting AIF PA-nodes ↔ ASPIC+ KB preferences

**Specific Gaps**:
- ❌ No function to populate ASPIC+ KB from PA-nodes (Definition 4.1)
- ❌ No function to create PA-nodes from ASPIC+ preferences (Definition 4.2)
- ❌ Ordering policy not stored in PA-nodes (always uses default)
- ❌ Justification field collected in UI but not saved to database (bug)
- ❌ No API endpoint to evaluate with specific ordering policy
- ❌ No UI for selecting ordering policy (last-link vs weakest-link)

### Phase 4 Strategy 🎯

**Focus**: Build **integration layer**, not implementation from scratch

**Work Distribution**:
- 50% Translation layer (AIF ↔ ASPIC+ bidirectional conversion)
- 25% API enhancement (expose defeat computation with policies)
- 20% UI enhancement (ordering selectors, preference preview)
- 5% Schema extension (add ordering metadata fields)

---

## 0. Theoretical Grounding Summary

### Key Concepts from Modgil & Prakken

1. **Attacks vs. Defeats**
   - **Attack**: Logical incompatibility (structure-based)
   - **Defeat**: Attack that succeeds given preferences (dialectical success)
   - Critical distinction: Conflict-free sets use *attacks*, not defeats
   - Preferences filter attacks → defeats during evaluation

2. **Three Attack Types** (Already implemented in Phase 3)
   - **Undermine**: Attacks ordinary premises
   - **Rebut**: Attacks defeasible rule conclusion
   - **Undercut**: Attacks rule applicability (name n(r))

3. **Preference Sensitivity**
   - **Preference-independent**: Undercuts always defeat, certain contrary-based attacks
   - **Preference-dependent**: Other undermines/rebuts succeed only if attacker ≥ attacked sub-argument

4. **Practical Orderings** (What we'll implement)
   - Two families: **Last-link** vs **Weakest-link**
   - Two set comparisons: **Elitist** vs **Democratic**
   - Reasonable orderings preserve rationality postulates

5. **Rationality Postulates** (Must maintain from Phase 3)
   - Sub-argument closure
   - Closure under strict rules
   - Direct consistency
   - Indirect consistency

---

## 1. Minimal Schema Extension

### 1.1 Extend Existing PreferenceApplication Model

**Rationale**: The `PreferenceApplication` model (line 2671 in schema.prisma) already supports:
- ✅ Claim preferences (I-node to I-node) → premise preferences ≤'
- ✅ Argument preferences (RA-node to RA-node) → rule preferences ≤
- ✅ Scheme preferences (for argumentation schemes)
- ✅ Optional `schemeId` for preference justification scheme

**What to Add** (3 optional fields):

```prisma
// Extend existing PreferenceApplication model at line 2671
model PreferenceApplication {
  // ... existing fields: id, deliberationId, schemeId, createdById, createdAt
  // ... preferredClaimId, preferredArgumentId, preferredSchemeId
  // ... dispreferredClaimId, dispreferredArgumentId, dispreferredSchemeId

  // NEW: ASPIC+ ordering metadata (optional - defaults to system-wide policy)
  orderingPolicy  String? // "last-link" | "weakest-link" | null (use default)
  setComparison   String? // "elitist" | "democratic" | null (use default elitist)
  justification   String? @db.Text // Fix bug: UI collects but doesn't save
  betterPremise    Claim    @relation("BetterPremise", fields: [betterPremiseId], references: [id], onDelete: Cascade)
  worsePremise     Claim    @relation("WorsePremise", fields: [worsePremiseId], references: [id], onDelete: Cascade)
  
  // Metadata
  reason           String?  // e.g., "More credible source", "Recent observation"
  confidence       Float    @default(1.0)
  
  createdAt        DateTime @default(now())
  createdById      String
  createdBy        User     @relation(fields: [createdById], references: [id])
  
  @@unique([deliberationId, betterPremiseId, worsePremiseId])
  @@index([deliberationId])
}

// Add ordering configuration to Deliberation
model Deliberation {
  // ... existing fields ...
  
  // ASPIC+ Preference Configuration
  preferenceOrdering  String?  @default("last-link-elitist") // "last-link-elitist", "last-link-democratic", "weakest-link-elitist", "weakest-link-democratic"
  
  argumentPreferences ArgumentPreference[]
  rulePreferences     RulePreference[]
  premisePreferences  PremisePreference[]
}
```

### 1.2 TypeScript Types (New)

```typescript
// lib/aspic/preferences.ts

export type OrderingFamily = "last-link" | "weakest-link";
export type SetComparison = "elitist" | "democratic";
export type OrderingPolicy = `${OrderingFamily}-${SetComparison}`;

export interface PreferenceRelations {
  // Strict partial order: irreflexive, transitive
  rules: Map<string, Set<string>>;      // ruleId -> set of worse rule IDs
  premises: Map<string, Set<string>>;   // premiseId -> set of worse premise IDs
  arguments: Map<string, Set<string>>;  // argumentId -> set of worse argument IDs
}

export interface DefeatContext {
  attack: Attack;
  preferences: PreferenceRelations;
  ordering: OrderingPolicy;
}

export interface OrderingResult {
  defeats: Attack[];  // Attacks that succeed as defeats
  statistics: {
    totalAttacks: number;
    totalDefeats: number;
    preferenceIndependent: number;  // Undercuts + contrary-based
    preferenceDependent: number;    // Filtered by preferences
    blocked: number;                // Attacks blocked by preferences
  };
}
```

---

## 2. Implementation Phases

### Phase 4.1: Preference Data Model & API (~1 day)

**Tasks**:
1. Add Prisma schema models (ArgumentPreference, RulePreference, PremisePreference)
2. Run `npx prisma db push` to update database
3. Create API endpoints for preference management
4. Add UI for viewing existing preferences

**Files to Create**:
- `app/api/aspic/preferences/route.ts` - CRUD for all preference types
- `app/api/aspic/preferences/arguments/route.ts` - Argument-specific
- `app/api/aspic/preferences/rules/route.ts` - Rule-specific
- `app/api/aspic/preferences/premises/route.ts` - Premise-specific

**API Endpoints**:
```typescript
// POST /api/aspic/preferences
{
  deliberationId: string;
  type: "argument" | "rule" | "premise";
  better: string;  // ID of better entity
  worse: string;   // ID of worse entity
  reason?: string;
  confidence?: number;
}

// GET /api/aspic/preferences?deliberationId=xxx
// Returns all preferences for deliberation

// DELETE /api/aspic/preferences/:id
// Remove specific preference
```

**Acceptance Criteria**:
- ✅ Schema updated, database migrated
- ✅ Can create/read/delete preferences via API
- ✅ Preferences stored with confidence and reason
- ✅ Unique constraint prevents duplicate preferences

---

### Phase 4.2: Core Preference Logic (~1.5 days)

**Tasks**:
1. Implement set comparison functions (elitist, democratic)
2. Implement ordering families (last-link, weakest-link)
3. Build preference graph closure (transitive)
4. Implement attack → defeat filtering

**Files to Create**:
- `lib/aspic/preferences.ts` - Core preference logic
- `lib/aspic/ordering.ts` - Ordering implementations
- `lib/aspic/defeats.ts` - Attack → defeat conversion

**Key Functions**:

```typescript
// lib/aspic/preferences.ts

/**
 * Elitist set comparison: X < Y if ∃x∈X s.t. ∀y∈Y, x < y
 * "X better if it has one element better than all of Y"
 */
export function setLessElitist<T>(
  xSet: T[],
  ySet: T[],
  lessThan: (x: T, y: T) => boolean
): boolean {
  if (xSet.length === 0 || ySet.length === 0) return false;
  return xSet.some(x => ySet.every(y => lessThan(x, y)));
}

/**
 * Democratic set comparison: X < Y if ∀x∈X, ∃y∈Y with x < y
 * "X better if every element has something in Y it beats"
 */
export function setLessDemocratic<T>(
  xSet: T[],
  ySet: T[],
  lessThan: (x: T, y: T) => boolean
): boolean {
  if (xSet.length === 0 || ySet.length === 0) return false;
  return xSet.every(x => ySet.some(y => lessThan(x, y)));
}

/**
 * Compute transitive closure of preference relation
 * Ensures transitivity: if a < b and b < c, then a < c
 */
export function computeTransitiveClosure(
  prefs: Map<string, Set<string>>
): Map<string, Set<string>> {
  const closure = new Map<string, Set<string>>();
  
  // Copy initial relations
  for (const [id, worse] of prefs) {
    closure.set(id, new Set(worse));
  }
  
  // Floyd-Warshall style closure
  let changed = true;
  while (changed) {
    changed = false;
    for (const [a, aWorse] of closure) {
      for (const b of aWorse) {
        const bWorse = closure.get(b);
        if (bWorse) {
          for (const c of bWorse) {
            if (!aWorse.has(c)) {
              aWorse.add(c);
              changed = true;
            }
          }
        }
      }
    }
  }
  
  return closure;
}

/**
 * Check if x is strictly less preferred than y
 */
export function isStrictlyLess(
  x: string,
  y: string,
  prefs: Map<string, Set<string>>
): boolean {
  const yWorse = prefs.get(y);
  return yWorse ? yWorse.has(x) : false;
}

/**
 * Check if x is not strictly less preferred than y
 * (i.e., x ≥ y in the preorder)
 */
export function notLessPreferred(
  x: string,
  y: string,
  prefs: Map<string, Set<string>>
): boolean {
  return !isStrictlyLess(x, y, prefs);
}
```

```typescript
// lib/aspic/ordering.ts

/**
 * Last-link ordering: compare only last defeasible rules
 * Fallback to premises if both strict
 */
export function lessLastLink(
  argA: ASPICArgument,
  argB: ASPICArgument,
  rulePrefs: Map<string, Set<string>>,
  premisePrefs: Map<string, Set<string>>,
  setComparison: SetComparison
): boolean {
  const setLess = setComparison === "elitist" ? setLessElitist : setLessDemocratic;
  
  const aLastDef = Array.from(argA.lastDefRules);
  const bLastDef = Array.from(argB.lastDefRules);
  
  // If either has defeasible rules, compare those
  if (aLastDef.length > 0 || bLastDef.length > 0) {
    return setLess(aLastDef, bLastDef, (x, y) => isStrictlyLess(x, y, rulePrefs));
  }
  
  // Both strict: compare ordinary premises
  const aOrdPrem = Array.from(argA.ordinaryPremises);
  const bOrdPrem = Array.from(argB.ordinaryPremises);
  
  return setLess(aOrdPrem, bOrdPrem, (x, y) => isStrictlyLess(x, y, premisePrefs));
}

/**
 * Weakest-link ordering: compare all defeasible rules and all premises
 * Symmetric handling for strict/firm arguments
 */
export function lessWeakestLink(
  argA: ASPICArgument,
  argB: ASPICArgument,
  rulePrefs: Map<string, Set<string>>,
  premisePrefs: Map<string, Set<string>>,
  setComparison: SetComparison
): boolean {
  const setLess = setComparison === "elitist" ? setLessElitist : setLessDemocratic;
  
  const aStrict = argA.defeasibleRules.size === 0;
  const bStrict = argB.defeasibleRules.size === 0;
  const aFirm = argA.ordinaryPremises.size === 0;
  const bFirm = argB.ordinaryPremises.size === 0;
  
  const aAllDef = Array.from(argA.defeasibleRules);
  const bAllDef = Array.from(argB.defeasibleRules);
  const aOrdPrem = Array.from(argA.ordinaryPremises);
  const bOrdPrem = Array.from(argB.ordinaryPremises);
  
  // Both strict: compare premises only
  if (aStrict && bStrict) {
    return setLess(aOrdPrem, bOrdPrem, (x, y) => isStrictlyLess(x, y, premisePrefs));
  }
  
  // Both firm: compare rules only
  if (aFirm && bFirm) {
    return setLess(aAllDef, bAllDef, (x, y) => isStrictlyLess(x, y, rulePrefs));
  }
  
  // Mixed: require both dimensions to be better
  const premiseBetter = setLess(aOrdPrem, bOrdPrem, (x, y) => isStrictlyLess(x, y, premisePrefs));
  const rulesBetter = setLess(aAllDef, bAllDef, (x, y) => isStrictlyLess(x, y, rulePrefs));
  
  return premiseBetter && rulesBetter;
}

/**
 * Compare two arguments using specified ordering policy
 */
export function compareArguments(
  argA: ASPICArgument,
  argB: ASPICArgument,
  preferences: PreferenceRelations,
  policy: OrderingPolicy
): number {
  const [family, comparison] = policy.split("-") as [OrderingFamily, SetComparison];
  
  const lessFunc = family === "last-link" ? lessLastLink : lessWeakestLink;
  
  const aLessB = lessFunc(argA, argB, preferences.rules, preferences.premises, comparison);
  const bLessA = lessFunc(argB, argA, preferences.rules, preferences.premises, comparison);
  
  if (aLessB && !bLessA) return -1;  // A strictly better
  if (bLessA && !aLessB) return 1;   // B strictly better
  return 0;                           // Incomparable or equal
}
```

```typescript
// lib/aspic/defeats.ts

/**
 * Determine if an attack succeeds as a defeat
 * Based on Modgil & Prakken Definition 9
 */
export function attackDefeats(
  attack: Attack,
  preferences: PreferenceRelations,
  policy: OrderingPolicy,
  argumentsMap: Map<string, ASPICArgument>
): boolean {
  // Preference-independent defeats: undercuts always succeed
  if (attack.type === "undercut") {
    return true;
  }
  
  // Contrary-based attacks (asymmetric) are preference-independent
  // e.g., α undermines ~α
  if (attack.contraryBased) {
    return true;
  }
  
  // Preference-dependent: compare attacker to attacked SUB-ARGUMENT
  // Critical: compare to attack.on (sub-argument), not attack.to (whole target)
  const attacker = argumentsMap.get(attack.from);
  const attackedSub = argumentsMap.get(attack.on);
  
  if (!attacker || !attackedSub) {
    console.warn(`Missing argument in defeat check: from=${attack.from}, on=${attack.on}`);
    return false;
  }
  
  // Attack succeeds if attacker is NOT strictly worse than attacked sub-argument
  const cmp = compareArguments(attacker, attackedSub, preferences, policy);
  return cmp >= 0;  // attacker ≥ attackedSub
}

/**
 * Filter attacks to defeats based on preferences
 */
export function computeDefeats(
  attacks: Attack[],
  preferences: PreferenceRelations,
  policy: OrderingPolicy,
  argumentsMap: Map<string, ASPICArgument>
): OrderingResult {
  const defeats: Attack[] = [];
  let prefIndependent = 0;
  let prefDependent = 0;
  let blocked = 0;
  
  for (const attack of attacks) {
    const succeeds = attackDefeats(attack, preferences, policy, argumentsMap);
    
    if (succeeds) {
      defeats.push(attack);
      if (attack.type === "undercut" || attack.contraryBased) {
        prefIndependent++;
      } else {
        prefDependent++;
      }
    } else {
      blocked++;
    }
  }
  
  return {
    defeats,
    statistics: {
      totalAttacks: attacks.length,
      totalDefeats: defeats.length,
      preferenceIndependent: prefIndependent,
      preferenceDependent: prefDependent,
      blocked
    }
  };
}
```

**Acceptance Criteria**:
- ✅ Set comparison functions work correctly (unit tests)
- ✅ Last-link ordering compares last defeasible rules
- ✅ Weakest-link ordering compares all rules and premises
- ✅ Transitive closure computed correctly
- ✅ Attack → defeat filtering respects preferences
- ✅ Undercuts always defeat (preference-independent)
- ✅ Compares attacker to attacked sub-argument, not whole target

---

### Phase 4.3: Integration with Evaluation (~1 day)

**Tasks**:
1. Update `/api/aspic/evaluate` to accept ordering parameter
2. Integrate defeats into extension computation
3. Maintain attack-based conflict-freeness
4. Update rationality postulate validation

**Files to Modify**:
- `app/api/aspic/evaluate/route.ts` - Add ordering parameter
- `lib/aspic/semantics.ts` - Use defeats instead of attacks for extension computation
- `lib/aspic/rationality.ts` - Ensure postulates still validated

**API Changes**:

```typescript
// GET /api/aspic/evaluate?deliberationId=xxx&ordering=last-link-elitist

// Response includes preference statistics
{
  theory: { ... },
  semantics: {
    attacks: Attack[],           // All structural attacks
    defeats: Attack[],           // Attacks filtered by preferences
    defeatStatistics: {
      totalAttacks: number,
      totalDefeats: number,
      preferenceIndependent: number,
      preferenceDependent: number,
      blocked: number
    },
    arguments: ASPICArgument[],
    groundedExtension: string[],
    preferredExtensions: string[][],
    stableExtensions: string[][],
    justificationStatus: Map<string, Label>
  },
  rationality: {
    // ... existing postulates ...
  }
}
```

**Key Changes**:

```typescript
// lib/aspic/semantics.ts

export function computeGroundedExtension(
  args: ASPICArgument[],
  attacks: Attack[],      // For conflict-free check
  defeats: Attack[],      // For defeat-based labelling
  preferences: PreferenceRelations,
  policy: OrderingPolicy
): Set<string> {
  // Use attacks for conflict-freeness (attack-based, not defeat-based)
  const conflictFree = (candidate: Set<string>): boolean => {
    for (const a of candidate) {
      for (const b of candidate) {
        if (a !== b && attacks.some(att => att.from === a && att.to === b)) {
          return false;  // Attack exists, not conflict-free
        }
      }
    }
    return true;
  };
  
  // Use defeats for labelling algorithm
  const inSet = new Set<string>();
  const outSet = new Set<string>();
  
  // Build defeat graph
  const defeatedBy = new Map<string, Set<string>>();
  const defeats_ = new Map<string, Set<string>>();
  
  for (const def of defeats) {
    if (!defeatedBy.has(def.to)) defeatedBy.set(def.to, new Set());
    defeatedBy.get(def.to)!.add(def.from);
    
    if (!defeats_.has(def.from)) defeats_.set(def.from, new Set());
    defeats_.get(def.from)!.add(def.to);
  }
  
  // Fixed-point labelling
  let changed = true;
  while (changed) {
    changed = false;
    
    // IN: all defeaters are OUT
    for (const arg of args) {
      if (inSet.has(arg.id) || outSet.has(arg.id)) continue;
      const defeaters = defeatedBy.get(arg.id) ?? new Set();
      if (Array.from(defeaters).every(d => outSet.has(d))) {
        inSet.add(arg.id);
        changed = true;
      }
    }
    
    // OUT: defeated by an IN
    for (const arg of args) {
      if (outSet.has(arg.id)) continue;
      const defeaters = defeatedBy.get(arg.id) ?? new Set();
      if (Array.from(defeaters).some(d => inSet.has(d))) {
        outSet.add(arg.id);
        changed = true;
      }
    }
  }
  
  return inSet;
}
```

**Acceptance Criteria**:
- ✅ Evaluate API accepts `ordering` query parameter
- ✅ Returns both attacks and defeats in response
- ✅ Defeat statistics included
- ✅ Extensions computed using defeats (not attacks)
- ✅ Conflict-freeness still checks attacks
- ✅ All rationality postulates still pass
- ✅ Backward compatible (defaults to last-link-elitist if no ordering specified)

---

### Phase 4.4: UI Visualization (~1.5 days)

**Tasks**:
1. Add Preferences tab to AspicTheoryPanel
2. Visualize preference relations (graph or table)
3. Show defeat statistics
4. Highlight preference-blocked attacks
5. Add ordering selector dropdown

**Files to Create**:
- `components/aspic/PreferencesPanel.tsx` - Main preferences UI
- `components/aspic/PreferenceGraph.tsx` - Visual representation
- `components/aspic/OrderingSelector.tsx` - Dropdown for ordering policy
- `components/aspic/DefeatStatistics.tsx` - Statistics display

**PreferencesPanel Structure**:

```typescript
// components/aspic/PreferencesPanel.tsx

export function PreferencesPanel() {
  return (
    <div className="space-y-6">
      {/* Ordering Policy Selector */}
      <OrderingSelector 
        current={ordering}
        onChange={setOrdering}
      />
      
      {/* Defeat Statistics */}
      <DefeatStatistics stats={defeatStats} />
      
      {/* Preference Relations */}
      <Tabs>
        <TabsList>
          <TabsTrigger value="arguments">Arguments</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="premises">Premises</TabsTrigger>
        </TabsList>
        
        <TabsContent value="arguments">
          <PreferenceTable 
            type="argument"
            preferences={argumentPrefs}
            onAdd={handleAddArgPref}
            onRemove={handleRemoveArgPref}
          />
        </TabsContent>
        
        <TabsContent value="rules">
          <PreferenceTable 
            type="rule"
            preferences={rulePrefs}
            onAdd={handleAddRulePref}
            onRemove={handleRemoveRulePref}
          />
        </TabsContent>
        
        <TabsContent value="premises">
          <PreferenceTable 
            type="premise"
            preferences={premisePrefs}
            onAdd={handleAddPremisePref}
            onRemove={handleRemovePremisePref}
          />
        </TabsContent>
      </Tabs>
      
      {/* Visual Graph (optional) */}
      <PreferenceGraph preferences={allPrefs} />
    </div>
  );
}
```

**DefeatStatistics Display**:

```typescript
// components/aspic/DefeatStatistics.tsx

export function DefeatStatistics({ stats }: { stats: OrderingResult["statistics"] }) {
  const blockedPercent = (stats.blocked / stats.totalAttacks * 100).toFixed(1);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Defeat Statistics</CardTitle>
        <CardDescription>How preferences affect attack success</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <StatRow 
            label="Total Attacks" 
            value={stats.totalAttacks}
            color="gray"
          />
          <StatRow 
            label="Total Defeats" 
            value={stats.totalDefeats}
            color="green"
          />
          <StatRow 
            label="Preference-Independent" 
            value={stats.preferenceIndependent}
            color="blue"
            tooltip="Undercuts and contrary-based attacks"
          />
          <StatRow 
            label="Preference-Dependent" 
            value={stats.preferenceDependent}
            color="purple"
            tooltip="Filtered by argument ordering"
          />
          <StatRow 
            label="Blocked by Preferences" 
            value={stats.blocked}
            color="red"
            badge={`${blockedPercent}% blocked`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

**Acceptance Criteria**:
- ✅ Preferences tab added to AspicTheoryPanel
- ✅ Can view existing preferences in table format
- ✅ Defeat statistics displayed clearly
- ✅ Ordering selector dropdown works
- ✅ Changing ordering triggers re-evaluation
- ✅ Visual indicators for blocked attacks
- ✅ Tooltips explain preference-independence

---

### Phase 4.5: Interactive Preference Management (~1 day)

**Tasks**:
1. Add UI for creating preferences
2. Implement preference wizards/modals
3. Add validation (prevent cycles, duplicates)
4. Show preference impact preview

**Files to Create**:
- `components/aspic/AddPreferenceModal.tsx` - Modal for creating preferences
- `components/aspic/PreferenceImpactPreview.tsx` - Shows effect before committing
- `lib/aspic/preferenceValidation.ts` - Cycle detection, validation

**AddPreferenceModal Workflow**:

```typescript
// User selects two arguments
// System shows:
// - Current comparison result (A > B, B > A, or incomparable)
// - Effect on defeats if preference added
// - Potential issues (cycles, conflicts)

export function AddPreferenceModal() {
  const [better, setBetter] = useState<string | null>(null);
  const [worse, setWorse] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  
  const impact = usePreferenceImpact(better, worse);
  
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Argument Preference</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <ArgumentSelector 
            label="Better Argument"
            value={better}
            onChange={setBetter}
          />
          
          <ArgumentSelector 
            label="Worse Argument"
            value={worse}
            onChange={setWorse}
          />
          
          <Input 
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          
          {impact && (
            <PreferenceImpactPreview 
              newDefeats={impact.newDefeats}
              blockedAttacks={impact.blockedAttacks}
              warnings={impact.warnings}
            />
          )}
          
          <Button onClick={handleSave}>
            Add Preference
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Validation Functions**:

```typescript
// lib/aspic/preferenceValidation.ts

/**
 * Detect cycles in preference graph
 * Returns cycle path if found, null otherwise
 */
export function detectCycle(
  prefs: Map<string, Set<string>>,
  newBetter: string,
  newWorse: string
): string[] | null {
  // Add new edge temporarily
  const testPrefs = new Map(prefs);
  if (!testPrefs.has(newBetter)) testPrefs.set(newBetter, new Set());
  testPrefs.get(newBetter)!.add(newWorse);
  
  // DFS to detect cycle
  const visited = new Set<string>();
  const recStack = new Set<string>();
  
  function dfs(node: string, path: string[]): string[] | null {
    visited.add(node);
    recStack.add(node);
    path.push(node);
    
    const neighbors = testPrefs.get(node) ?? new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const cycle = dfs(neighbor, [...path]);
        if (cycle) return cycle;
      } else if (recStack.has(neighbor)) {
        // Cycle found
        return [...path, neighbor];
      }
    }
    
    recStack.delete(node);
    return null;
  }
  
  return dfs(newBetter, []);
}

/**
 * Check if adding preference would violate irreflexivity
 */
export function wouldViolateIrreflexivity(
  better: string,
  worse: string
): boolean {
  return better === worse;
}

/**
 * Compute impact of adding a preference
 */
export function computePreferenceImpact(
  currentDefeats: Attack[],
  currentAttacks: Attack[],
  newBetter: string,
  newWorse: string,
  currentPrefs: PreferenceRelations,
  policy: OrderingPolicy
): {
  newDefeats: Attack[];
  blockedAttacks: Attack[];
  warnings: string[];
} {
  // Add new preference
  const updatedPrefs = { ...currentPrefs };
  if (!updatedPrefs.arguments.has(newBetter)) {
    updatedPrefs.arguments.set(newBetter, new Set());
  }
  updatedPrefs.arguments.get(newBetter)!.add(newWorse);
  
  // Recompute defeats
  const argumentsMap = new Map(); // ... populate
  const newResult = computeDefeats(currentAttacks, updatedPrefs, policy, argumentsMap);
  
  // Find differences
  const oldDefeatSet = new Set(currentDefeats.map(d => `${d.from}-${d.to}`));
  const newDefeatSet = new Set(newResult.defeats.map(d => `${d.from}-${d.to}`));
  
  const added = newResult.defeats.filter(d => !oldDefeatSet.has(`${d.from}-${d.to}`));
  const removed = currentDefeats.filter(d => !newDefeatSet.has(`${d.from}-${d.to}`));
  
  const warnings: string[] = [];
  
  // Check for cycle
  const cycle = detectCycle(updatedPrefs.arguments, newBetter, newWorse);
  if (cycle) {
    warnings.push(`Creates cycle: ${cycle.join(" → ")}`);
  }
  
  return {
    newDefeats: added,
    blockedAttacks: removed,
    warnings
  };
}
```

**Acceptance Criteria**:
- ✅ Can add preferences via modal
- ✅ Cycle detection prevents invalid preferences
- ✅ Impact preview shows effect before saving
- ✅ Can add reason/justification for preference
- ✅ Validation prevents self-preferences
- ✅ Clear error messages for validation failures

---

## 3. Testing Strategy

### 3.1 Unit Tests

```typescript
// lib/aspic/__tests__/preferences.test.ts

describe("Set Comparisons", () => {
  test("Elitist: X < Y if ∃x∈X s.t. ∀y∈Y, x < y", () => {
    const X = [1, 2, 3];
    const Y = [5, 6, 7];
    expect(setLessElitist(X, Y, (a, b) => a < b)).toBe(true);
    expect(setLessElitist(Y, X, (a, b) => a < b)).toBe(false);
  });
  
  test("Democratic: X < Y if ∀x∈X, ∃y∈Y with x < y", () => {
    const X = [1, 2, 3];
    const Y = [2, 3, 4];
    expect(setLessDemocratic(X, Y, (a, b) => a < b)).toBe(true);
  });
});

describe("Transitive Closure", () => {
  test("Computes transitive closure correctly", () => {
    const prefs = new Map([
      ["a", new Set(["b"])],
      ["b", new Set(["c"])]
    ]);
    
    const closure = computeTransitiveClosure(prefs);
    
    expect(closure.get("a")).toContain("b");
    expect(closure.get("a")).toContain("c"); // transitive
    expect(closure.get("b")).toContain("c");
  });
});

describe("Ordering Policies", () => {
  test("Last-link compares last defeasible rules only", () => {
    // ... test with mock arguments
  });
  
  test("Weakest-link compares all rules and premises", () => {
    // ... test with mock arguments
  });
});
```

### 3.2 Integration Tests

```typescript
// Test with Modgil & Prakken Example 33
describe("Example 33: Classical Logic with Preferences", () => {
  test("Replicates paper's results", async () => {
    // Σ = { x, ¬y, x⊃y }
    // Prefer x over {¬y, x⊃y}
    
    const theory = {
      premises: ["x", "¬y", "x⊃y"],
      preferences: {
        premises: new Map([
          ["x", new Set(["¬y", "x⊃y"])]
        ])
      }
    };
    
    const result = await evaluateASPIC(theory, "last-link-elitist");
    
    // A5 (deriving contradiction) should not defeat A1 (with x)
    const a5DefeatsA1 = result.defeats.some(d => 
      d.from === "A5" && d.to === "A1"
    );
    expect(a5DefeatsA1).toBe(false);
    
    // Extensions should remain consistent
    expect(result.rationality.indirectConsistency).toBe(true);
  });
});
```

### 3.3 Rationality Postulate Tests

```typescript
describe("Rationality Postulates with Preferences", () => {
  test("Sub-argument closure maintained", () => {
    // ... ensure all sub-arguments in extension
  });
  
  test("Closure under strict rules maintained", () => {
    // ... ensure strict inference closure
  });
  
  test("Direct consistency maintained", () => {
    // ... no contrary pairs in conclusions
  });
  
  test("Indirect consistency maintained", () => {
    // ... strict closure is consistent
  });
});
```

---

## 4. Migration Plan

### Database Migration

```bash
# 1. Update schema
# Edit lib/models/schema.prisma with new models

# 2. Push to database
npx prisma db push

# 3. Generate Prisma client
npx prisma generate

# 4. Verify migration
npx prisma studio
```

### Backward Compatibility

- Default to `last-link-elitist` if no ordering specified
- Empty preference relations if none defined
- Existing deliberations work without preferences
- Add feature flag `ENABLE_PREFERENCES` for gradual rollout

---

## 5. Documentation Requirements

### Developer Documentation

1. **PREFERENCES_GUIDE.md**:
   - Explanation of preference types
   - How to use ordering policies
   - API examples
   - Common patterns

2. **ORDERING_COMPARISON.md**:
   - Visual comparison of 4 policies
   - Use cases for each
   - Performance characteristics

3. **JSDoc Comments**:
   - All preference functions documented
   - Examples in comments
   - Link to Modgil & Prakken paper

### User Documentation

1. **In-app Tooltips**:
   - Explain elitist vs democratic
   - Explain last-link vs weakest-link
   - Preference-independence explanation

2. **Tutorial**:
   - Step-by-step guide to adding preferences
   - Example use cases
   - Visual examples

---

## 6. Success Criteria (Phase 4 Complete)

✅ **Data Model**:
- Preference relations stored in database
- Support for argument, rule, and premise preferences
- Ordering policy configuration per deliberation

✅ **Core Logic**:
- Set comparison functions (elitist, democratic) working
- Ordering families (last-link, weakest-link) implemented
- Attack → defeat filtering correct
- Transitive closure computed

✅ **Integration**:
- Evaluate API accepts ordering parameter
- Returns defeats and statistics
- Extensions use defeats, conflict-free uses attacks
- Rationality postulates still pass

✅ **UI**:
- Preferences panel in AspicTheoryPanel
- Can view/add/remove preferences
- Ordering selector dropdown
- Defeat statistics displayed
- Visual indicators for preference effects

✅ **Testing**:
- Unit tests for all comparison functions
- Integration test replicates Example 33
- Rationality postulates validated with preferences
- Performance acceptable for 100+ arguments

✅ **Documentation**:
- Developer guide complete
- API documented
- In-app help available
- Example use cases provided

---

## 7. Timeline Estimate

| Phase | Tasks | Time | Dependencies |
|-------|-------|------|--------------|
| 4.1 | Data model & API | 1 day | - |
| 4.2 | Core preference logic | 1.5 days | 4.1 |
| 4.3 | Integration with evaluation | 1 day | 4.2 |
| 4.4 | UI visualization | 1.5 days | 4.3 |
| 4.5 | Interactive management | 1 day | 4.4 |
| **Total** | | **6 days** | |

*Note: Includes buffer time for debugging and testing*

---

## 8. Risks & Mitigation

### Risk: Performance with many preferences
- **Impact**: Slow evaluation with 100+ preference relations
- **Mitigation**: 
  - Compute transitive closure once, cache
  - Use efficient graph algorithms
  - Consider preference pruning for irrelevant relations

### Risk: Cycle creation
- **Impact**: Invalid preference graph
- **Mitigation**:
  - Cycle detection before saving
  - Clear error messages
  - Option to override with warning

### Risk: Breaking existing deliberations
- **Impact**: Phase 3 deliberations fail
- **Mitigation**:
  - Backward compatibility layer
  - Default to empty preferences
  - Extensive integration testing

### Risk: Theory misalignment
- **Impact**: Implementation doesn't match Modgil & Prakken
- **Mitigation**:
  - Replicate paper's Example 33
  - Validate rationality postulates
  - Code review against technical report

---

## 9. Future Enhancements (Post-Phase 4)

- **Dynamic preference learning**: Learn preferences from user interactions
- **Preference elicitation UI**: Guided wizard for complex preference structures
- **Preference explanations**: Natural language explanation of why attack defeated/blocked
- **Preference visualization**: Interactive graph showing preference structure
- **Import/export preferences**: Share preference configurations across deliberations
- **Preference templates**: Pre-defined patterns (e.g., "Expert authority", "Recency bias")

---

## 10. References

- **Modgil, S., & Prakken, H. (2014).** "A General Account of Argumentation with Preferences." *Artificial Intelligence*, 195, 361-397.
- **Technical Report**: `docs/arg-computation-research/ASPIC_Argumentation with Preferences.md`
- **ASPIC+ Phase 3 Implementation**: Rationality Checklist UI (completed)
- **ASPIC+ Implementation TODO**: Main roadmap document

---

**Next Steps**: Begin Phase 4.1 - Data Model & API implementation after approval of this roadmap.
