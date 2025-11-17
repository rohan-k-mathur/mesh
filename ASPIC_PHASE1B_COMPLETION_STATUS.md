# ASPIC+ Phase 1b.1: Backend Infrastructure - COMPLETED ✅

## Summary
Successfully implemented database schema changes to support strict vs defeasible rules in the ASPIC+ argumentation framework. All 47 existing ArgumentSchemeInstance records have been migrated with the default DEFEASIBLE rule type.

---

## What Was Completed

### 1. Database Schema Changes
**File:** `lib/models/schema.prisma`

#### Added RuleType Enum:
```prisma
enum RuleType {
  STRICT      // R_s: Strict rules (cannot rebut conclusions, sound deduction)
  DEFEASIBLE  // R_d: Defeasible rules (rebuttable presumptive inference)
}
```

#### Added Fields to ArgumentSchemeInstance:
```prisma
model ArgumentSchemeInstance {
  // ... existing fields ...
  
  // ASPIC+ Strict Rules Phase 1b
  ruleType RuleType @default(DEFEASIBLE) // Strict rules cannot be rebutted
  ruleName String? // Optional name for undercutting attacks (e.g., "Modus Ponens")
  
  // ... rest of model ...
}
```

### 2. Database Migration
- ✅ Ran `npx prisma db push` successfully
- ✅ Database is in sync with schema (5.03s)
- ✅ TypeScript types regenerated (549ms initially, 766ms on explicit regeneration)

### 3. Data Verification
- ✅ All 47 existing ArgumentSchemeInstance records have `ruleType = 'DEFEASIBLE'`
- ✅ Default value working correctly for backward compatibility
- ✅ TypeScript types exported correctly from `@prisma/client`:
  - `RuleType.STRICT`
  - `RuleType.DEFEASIBLE`

---

## Technical Details

### Schema Location
- **Primary Schema:** `/Users/rohanmathur/Documents/Documents/mesh/lib/models/schema.prisma`
- **Lines Modified:** 2349-2368 (ArgumentSchemeInstance model)

### Enum Definition
The `RuleType` enum distinguishes between two types of inference rules:

1. **STRICT** (R_s): Deductive rules where premises guarantee conclusion
   - Cannot be rebutted (attack restrictions enforced in `lib/aspic/attacks.ts`)
   - Used for logical axioms, mathematical truths, definitional rules
   - Example: "If X is a triangle, then X has three sides"

2. **DEFEASIBLE** (R_d): Presumptive rules where premises presume conclusion
   - Can be rebutted with counterexamples
   - Used for common-sense reasoning, expert opinion, statistical inference
   - Example: "If X is a bird, then X can fly"

### Field Semantics

#### `ruleType: RuleType`
- **Required field** with default value `DEFEASIBLE`
- Controls attack validation logic (see `lib/aspic/attacks.ts:156`)
- Used by translation layer to populate `strictRules` vs `defeasibleRules` arrays

#### `ruleName: String?`
- **Optional field** for providing human-readable rule names
- Used for undercutting attacks that target the inference itself
- Examples: "Modus Ponens", "Appeal to Expert Opinion", "Argument from Analogy"
- Displayed in UI for educational purposes

---

## Integration Points

### 1. Existing Infrastructure (Already Compatible) ✅
These files already handle both rule types correctly:

- **lib/aspic/types.ts** (lines 27-30, 38-52)
  - `Rule` interface has `type: "strict" | "defeasible"`
  - `ArgumentationSystem` has `strictRules[]` and `defeasibleRules[]`

- **lib/aspic/attacks.ts** (lines 152-166)
  - `checkRebutting()` already enforces: cannot rebut strict conclusions
  - Implementation: `if (subArg.topRule.type !== "defeasible") continue;`

- **lib/aspic/arguments.ts** (lines 80-86)
  - Argument construction handles both rule types
  - Uses `applies()` function for rule matching

- **lib/aspic/validation.ts** (lines 125-167)
  - `ensureTranspositionClosure()` already implemented
  - Generates contraposed versions of strict rules for rationality

### 2. Pending Updates (Next Phases) ⏳

#### Phase 1b.2: Translation Layer (2 hours)
**File:** `lib/aif/translation/aifToAspic.ts`

Current code (line ~180):
```typescript
// HARDCODED: All rules are currently defeasible
defeasibleRules: allRules,
strictRules: [],
```

Must update to:
```typescript
const strictRules = allRules.filter(r => r.schemeInstance?.ruleType === "STRICT");
const defeasibleRules = allRules.filter(r => r.schemeInstance?.ruleType !== "STRICT");

return {
  strictRules,
  defeasibleRules,
  // ... rest
};
```

#### Phase 1b.3: UI Components (3 hours)
**File:** `components/agora/ai/aspic/AIFArgumentWithSchemeComposer.tsx`

Add before scheme selector:
```tsx
<div className="space-y-2">
  <Label>Rule Type</Label>
  <RadioGroup value={ruleType} onValueChange={setRuleType}>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="DEFEASIBLE" id="defeasible" />
      <Label htmlFor="defeasible">
        Defeasible (Presumptive)
        <InfoTooltip>Can be rebutted by counterexamples</InfoTooltip>
      </Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="STRICT" id="strict" />
      <Label htmlFor="strict">
        Strict (Deductive)
        <InfoTooltip>Conclusions cannot be rebutted</InfoTooltip>
      </Label>
    </div>
  </RadioGroup>
</div>
```

**File:** `components/agora/ai/aspic/ArgumentCardV2.tsx`

Add badge next to scheme name:
```tsx
{arg.schemeInstance?.ruleType === "STRICT" && (
  <Badge variant="outline" className="ml-2 text-xs">
    Strict Rule
  </Badge>
)}
```

#### Phase 1b.4: Testing (2 hours)
Create test file: `lib/aspic/__tests__/strict-rules.test.ts`
- Test strict rule creation
- Test attack restrictions (cannot rebut strict)
- Test translation layer classification
- Test UI state management

#### Phase 1b.5: Documentation (1 hour)
- Update `ASPIC_STRICT_RULES_DEEP_DIVE.md` with completion details
- Add examples to user guide
- Update API documentation

---

## Database Schema State

### Before Phase 1b.1:
```prisma
model ArgumentSchemeInstance {
  id         String   @id @default(cuid())
  argumentId String
  schemeId   String
  confidence Float    @default(1.0)
  isPrimary  Boolean  @default(false)
  role         String  @default("primary")
  explicitness String  @default("explicit")
  order        Int     @default(0)
  textEvidence String? @db.Text
  justification String? @db.Text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @default(now()) @updatedAt
  // ... relations
}
```

### After Phase 1b.1:
```prisma
enum RuleType {
  STRICT
  DEFEASIBLE
}

model ArgumentSchemeInstance {
  id         String   @id @default(cuid())
  argumentId String
  schemeId   String
  confidence Float    @default(1.0)
  isPrimary  Boolean  @default(false)
  role         String  @default("primary")
  explicitness String  @default("explicit")
  order        Int     @default(0)
  textEvidence String? @db.Text
  justification String? @db.Text
  
  // NEW FIELDS
  ruleType RuleType @default(DEFEASIBLE)
  ruleName String?
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @default(now()) @updatedAt
  // ... relations
}
```

---

## Data Migration Results

### Query Verification:
```sql
SELECT "ruleType", COUNT(*) as count 
FROM "ArgumentSchemeInstance" 
GROUP BY "ruleType";
```

### Results:
```
ruleType    | count
------------|------
DEFEASIBLE  | 47
```

✅ **All existing records preserved with correct default value**

---

## TypeScript Type Generation

### Verified Exports:
```typescript
import { RuleType } from "@prisma/client";

// Available values:
RuleType.STRICT      // "STRICT"
RuleType.DEFEASIBLE  // "DEFEASIBLE"
```

### Model Type:
```typescript
type ArgumentSchemeInstance = {
  id: string;
  argumentId: string;
  schemeId: string;
  confidence: number;
  isPrimary: boolean;
  role: string;
  explicitness: string;
  order: number;
  textEvidence: string | null;
  justification: string | null;
  ruleType: RuleType;           // NEW
  ruleName: string | null;       // NEW
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Next Steps (Phase 1b.2-1b.5)

### Immediate Priority: Phase 1b.2 (Translation Layer)
**Estimated Time:** 2 hours  
**File:** `lib/aif/translation/aifToAspic.ts`

**Task:**
1. Read `ruleType` field from `ArgumentSchemeInstance`
2. Split `allRules` into `strictRules` and `defeasibleRules` arrays
3. Add console logging for debugging
4. Test in browser with ArgumentChain builder

**Why This Matters:**
The translation layer is the bridge between database and ASPIC+ engine. Until this is updated, all rules will still be treated as defeasible even though the schema now supports strict rules.

### Strategic Question: When to Start Phase 3 & 4?

#### Recommendation for Phase 3 (Rationality Postulates Checker):
**Start AFTER Phase 1b complete** (approximately 1 week from now)

**Reasoning:**
- Phase 3 validates transposition closure and consistency of rule sets
- Needs both strict and defeasible rules working correctly to validate
- Infrastructure already exists in `lib/aspic/validation.ts` (lines 125-167)
- Just needs UI component (`RationalityChecklist.tsx` stub exists)
- Estimated: 2-3 days of work

**Dependencies:**
- ✅ Strict rules working in UI (Phase 1b.3)
- ✅ Translation layer classifying correctly (Phase 1b.2)
- ✅ Attack restrictions enforced (already done)

#### Recommendation for Phase 4 (Preference & Ordering System):
**Start AFTER Phase 3** (approximately 2 weeks from now)

**Reasoning:**
- Preferences affect defeat resolution (strict vs last-link ordering)
- Need validated argumentation system before adding preferences
- Ordering types (elitist, weakest-link) built into defeat logic
- Estimated: 3-4 days of work

**Dependencies:**
- ✅ Rationality checks passing (Phase 3)
- ✅ Strict/defeasible rules distinguished (Phase 1b)
- ✅ Attack validation working (already done)

---

## Timeline Summary

```
Week 1 (Current):
├─ Phase 1b.1: Backend Infrastructure ✅ COMPLETED (today)
├─ Phase 1b.2: Translation Layer ⏳ (2 hours)
├─ Phase 1b.3: UI Components ⏳ (3 hours)
├─ Phase 1b.4: Testing ⏳ (2 hours)
└─ Phase 1b.5: Documentation ⏳ (1 hour)

Week 2:
└─ Phase 1b verification & bug fixes

Week 3:
├─ Phase 3: Rationality Postulates Checker (2-3 days)
└─ UI for rationality validation

Week 4:
├─ Phase 4: Preference & Ordering System (3-4 days)
└─ Testing & integration

Phase 2 (Attack Visualization):
└─ SHELVED per user request
```

---

## Theoretical Foundation Reference

For full theoretical details on strict vs defeasible rules, see:
- **ASPIC_STRICT_RULES_DEEP_DIVE.md** (Section 2: Theoretical Foundation)
- **THEORETICAL_FOUNDATIONS_SYNTHESIS.md** (ASPIC+ framework)
- **docs/arg-computation-research/AIF Formal Analysis Using ASPIC Framework.txt**

Key papers:
- Modgil & Prakken (2013): Strict rules in ASPIC+ framework
- Caminada & Amgoud (2007): Rationality postulates for strict rules
- Dung (1995): Abstract argumentation frameworks

---

## Completion Checklist ✅

### Phase 1b.1 (Backend Infrastructure)
- [x] Add `RuleType` enum to schema
- [x] Add `ruleType` field to `ArgumentSchemeInstance`
- [x] Add `ruleName` field to `ArgumentSchemeInstance`
- [x] Run `npx prisma db push`
- [x] Verify database migration successful
- [x] Verify TypeScript types generated
- [x] Verify default values applied to existing records (47 records)
- [x] Test enum values accessible in TypeScript
- [x] Document schema changes
- [x] Create completion summary

### Phase 1b.2 (Translation Layer) - TODO
- [ ] Update `lib/aif/translation/aifToAspic.ts`
- [ ] Read `ruleType` from `ArgumentSchemeInstance`
- [ ] Classify rules into strict vs defeasible arrays
- [ ] Add console logging for debugging
- [ ] Test translation in browser dev tools
- [ ] Verify ASPIC+ engine receives correct rule sets

### Phase 1b.3 (UI Components) - TODO
- [ ] Add RadioGroup to `AIFArgumentWithSchemeComposer`
- [ ] Add educational tooltips (strict vs defeasible)
- [ ] Add state management for `ruleType` selection
- [ ] Save `ruleType` to database on argument creation
- [ ] Add strict rule badge to `ArgumentCardV2`
- [ ] Verify `AspicTheoryViewer` displays correctly
- [ ] Test UI workflow end-to-end

### Phase 1b.4 (Testing) - TODO
- [ ] Create `lib/aspic/__tests__/strict-rules.test.ts`
- [ ] Test strict rule creation
- [ ] Test attack restrictions (cannot rebut strict)
- [ ] Test translation layer classification
- [ ] Test UI state management
- [ ] Test database persistence
- [ ] Integration test: create strict argument → attack → verify cannot rebut

### Phase 1b.5 (Documentation) - TODO
- [ ] Update `ASPIC_STRICT_RULES_DEEP_DIVE.md` with Phase 1b completion
- [ ] Add user guide examples (strict vs defeasible)
- [ ] Update API documentation
- [ ] Add troubleshooting guide
- [ ] Document common patterns (when to use strict vs defeasible)

---

## Notes

1. **Backward Compatibility:** All existing arguments remain defeasible by default. Users must explicitly select "Strict" for new arguments.

2. **Attack Validation:** The system already enforces that strict conclusions cannot be rebutted (see `lib/aspic/attacks.ts:156`). This means the infrastructure is ready—we just need data.

3. **Translation Layer:** This is the critical path. Until Phase 1b.2 is complete, the UI can create strict rules, but the ASPIC+ engine won't receive them correctly.

4. **Testing Strategy:** Focus on integration tests that verify the full data flow:
   - UI → Database → Translation Layer → ASPIC+ Engine → Attack Validation → UI Display

5. **Educational Content:** The distinction between strict and defeasible rules is subtle. UI tooltips and examples are critical for user understanding.

---

## Commit Message

```
feat(aspic): Add RuleType enum and fields for strict vs defeasible rules

Phase 1b.1 (Backend Infrastructure) complete:
- Add RuleType enum (STRICT, DEFEASIBLE) to schema
- Add ruleType field to ArgumentSchemeInstance with DEFEASIBLE default
- Add optional ruleName field for undercutting attacks
- Migrate 47 existing records to DEFEASIBLE
- Verify TypeScript types generated correctly

Next: Phase 1b.2 (Translation Layer)
```

---

**Completed:** January 2025  
**Time Spent:** ~1 hour (research + implementation + verification)  
**Files Modified:** 1 (`lib/models/schema.prisma`)  
**Database Records Updated:** 47  
**TypeScript Types Generated:** 2 (enum + model fields)
