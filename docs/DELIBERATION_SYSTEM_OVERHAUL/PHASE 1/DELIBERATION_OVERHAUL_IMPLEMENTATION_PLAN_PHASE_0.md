# Deliberation System Overhaul - Implementation Plan
## Step-by-Step Execution Guide

**Date**: November 8, 2025  
**Status**: Implementation Roadmap  
**Source**: DELIBERATION_SYSTEM_OVERHAUL_STRATEGY.md  
**Document Structure**: Phased implementation (will be built across multiple documents)

---

## Document Overview

This is **Part 1** of the implementation plan. The complete plan will be built in phases:

- **Part 1** (this document): Foundation & Quick Wins (Phases 0-1)
- **Part 2**: Core Architecture Changes (Phases 2-3)
- **Part 3**: Advanced Features & Navigation (Phases 4-5)
- **Part 4**: Integration & Polish (Phase 6)

---

## Implementation Philosophy

### Principles

1. **Incremental Value** - Each phase delivers working features
2. **Backward Compatibility** - No breaking changes without migration path
3. **Test Coverage** - Every change has tests before deployment
4. **User Feedback** - Deploy to staging, gather feedback, iterate
5. **Documentation First** - Update docs before implementation

### Risk Mitigation

- Feature flags for major changes
- Database migrations tested on copies
- Rollback plans for each phase
- Staged rollout (admin → power users → all users)

---

## Phase 0: Quick Wins & Foundation (Week 1)
**Goal**: Deliver immediate value while preparing for larger changes

### Why Phase 0?

The strategy document identifies several enhancements that:
- Don't require architectural changes
- Provide immediate user value
- Build foundation for later phases
- Validate approach before major investment

### Phase 0 Overview

| Component | Effort | Impact | Dependencies |
|-----------|--------|--------|--------------|
| 0.1: Add Burden of Proof to CQs | Small | High | None |
| 0.2: Add Epistemic Mode Field | Small | Medium | None |
| 0.3: Enhance Scheme Metadata | Small | Medium | None |
| 0.4: Improve CQ Display | Small | High | 0.1 |
| 0.5: Add Identification Conditions | Medium | High | 0.3 |

**Total Estimated Time**: 1 week (40 hours)

---

## Phase 0.1: Burden of Proof Enhancement
**Effort**: 6-8 hours | **Impact**: High | **Priority**: 🔴 Critical

### Context

From strategy document Part 5:
> "Different CQs function differently - some merely shift burden of proof, others require evidence to defeat argument."

Current CQs don't distinguish:
- **Assumptions**: Burden shifts to proponent if questioned
- **Exceptions**: Burden stays on challenger (must prove)

### Implementation

#### Step 1: Database Schema Changes (1 hour)

**File**: `prisma/schema.prisma`

```prisma
model CriticalQuestion {
  id          String  @id @default(cuid())
  schemeId    String
  question    String
  attackType  String  // "REBUTS" | "UNDERCUTS" | "UNDERMINES"
  targetScope String  // "conclusion" | "inference" | "premise"
  order       Int
  
  // NEW FIELDS
  burdenOfProof     String  @default("proponent") // "proponent" | "challenger"
  requiresEvidence  Boolean @default(false)       // Just asking vs must prove
  premiseType       String? // "ordinary" | "assumption" | "exception"
  
  scheme      ArgumentScheme @relation(fields: [schemeId], references: [id], onDelete: Cascade)
  
  @@index([schemeId])
}
```

**Migration Script**: `prisma/migrations/XXX_add_burden_of_proof_to_cqs/migration.sql`

```sql
-- Add new fields
ALTER TABLE "CriticalQuestion" 
  ADD COLUMN "burdenOfProof" TEXT NOT NULL DEFAULT 'proponent',
  ADD COLUMN "requiresEvidence" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "premiseType" TEXT;

-- Update existing CQs based on attackType heuristics
-- UNDERMINES (premise attacks) typically require evidence
UPDATE "CriticalQuestion" 
SET "requiresEvidence" = true, "premiseType" = 'ordinary'
WHERE "attackType" = 'UNDERMINES';

-- UNDERCUTS (inference attacks) typically shift burden
UPDATE "CriticalQuestion"
SET "burdenOfProof" = 'challenger', "requiresEvidence" = true, "premiseType" = 'exception'
WHERE "attackType" = 'UNDERCUTS';

-- REBUTS (conclusion attacks) require evidence
UPDATE "CriticalQuestion"
SET "requiresEvidence" = true
WHERE "attackType" = 'REBUTS';
```

**Testing**:
```bash
# Backup database
pg_dump mesh_dev > backup_before_burden_of_proof.sql

# Test migration on copy
npx prisma migrate dev --name add_burden_of_proof_to_cqs

# Verify data integrity
npm run db:verify-cqs
```

#### Step 2: Update TypeScript Types (30 minutes)

**File**: `lib/types/argumentation.ts`

```typescript
export type BurdenOfProof = "proponent" | "challenger";
export type PremiseType = "ordinary" | "assumption" | "exception";

export interface CriticalQuestion {
  id: string;
  schemeId: string;
  question: string;
  attackType: AttackType;
  targetScope: TargetScope;
  order: number;
  
  // New fields
  burdenOfProof: BurdenOfProof;
  requiresEvidence: boolean;
  premiseType?: PremiseType;
}

export interface CQWithBurdenInfo extends CriticalQuestion {
  burdenExplanation: string; // Human-readable explanation
  evidenceGuidance: string;  // What evidence is needed
}
```

#### Step 3: Add Helper Functions (1 hour)

**File**: `lib/utils/cq-burden-helpers.ts`

```typescript
export function getCQBurdenExplanation(cq: CriticalQuestion): string {
  if (cq.burdenOfProof === "challenger") {
    return cq.requiresEvidence
      ? "You must provide evidence to successfully challenge this."
      : "Asking this question shifts burden, but evidence strengthens your challenge.";
  }
  
  return cq.requiresEvidence
    ? "The argument proponent must address this if you raise it."
    : "Raising this question requires the proponent to respond.";
}

export function getCQEvidenceGuidance(cq: CriticalQuestion): string {
  switch (cq.premiseType) {
    case "ordinary":
      return "Provide counter-evidence or reasoning against this premise.";
    case "assumption":
      return "Show why this assumption doesn't hold in this case.";
    case "exception":
      return "Provide specific evidence that an exception applies here.";
    default:
      return "Support your challenge with relevant evidence or reasoning.";
  }
}

export function shouldShowEvidencePrompt(cq: CriticalQuestion): boolean {
  return cq.requiresEvidence && cq.burdenOfProof === "challenger";
}
```

#### Step 4: Update CQ Display Components (2 hours)

**File**: `components/arguments/CriticalQuestionItem.tsx`

```typescript
import { getCQBurdenExplanation, getCQEvidenceGuidance } from "@/lib/utils/cq-burden-helpers";

export function CriticalQuestionItem({ cq, onSelect }: Props) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* Attack type badge */}
        <AttackTypeBadge type={cq.attackType} scope={cq.targetScope} />
        
        {/* Question text */}
        <div className="flex-1">
          <p className="text-sm font-medium">{cq.question}</p>
          
          {/* NEW: Burden of proof indicator */}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {cq.burdenOfProof === "challenger" ? (
              <Badge variant="outline" className="bg-amber-50">
                <Scale className="w-3 h-3 mr-1" />
                Evidence Required
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-50">
                <MessageSquare className="w-3 h-3 mr-1" />
                Shifts Burden
              </Badge>
            )}
            
            {/* Tooltip with explanation */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-3 h-3" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{getCQBurdenExplanation(cq)}</p>
                  {cq.requiresEvidence && (
                    <p className="text-xs mt-2 text-muted-foreground">
                      {getCQEvidenceGuidance(cq)}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Select button */}
        <Button size="sm" onClick={() => onSelect(cq)}>
          Ask This
        </Button>
      </div>
    </div>
  );
}
```

**File**: `components/arguments/SchemeSpecificCQsModal.tsx`

Update to show burden info prominently:

```typescript
export function SchemeSpecificCQsModal({ scheme, targetArgument }: Props) {
  // Group CQs by burden type
  const cqsByBurden = useMemo(() => {
    return {
      shifts: scheme.criticalQuestions.filter(cq => cq.burdenOfProof === "proponent"),
      requires: scheme.criticalQuestions.filter(cq => cq.burdenOfProof === "challenger")
    };
  }, [scheme]);
  
  return (
    <Dialog>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Critical Questions for {scheme.name}</DialogTitle>
          <DialogDescription>
            Select questions to challenge this argument
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">
              All Questions ({scheme.criticalQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="shifts">
              Burden Shifts ({cqsByBurden.shifts.length})
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-3 h-3 ml-1" /></TooltipTrigger>
                  <TooltipContent>
                    Questions that shift burden to the proponent
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsTrigger>
            <TabsTrigger value="requires">
              Evidence Needed ({cqsByBurden.requires.length})
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="w-3 h-3 ml-1" /></TooltipTrigger>
                  <TooltipContent>
                    Questions requiring you to provide evidence
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <ScrollArea className="h-[400px]">
              {scheme.criticalQuestions.map(cq => (
                <CriticalQuestionItem key={cq.id} cq={cq} onSelect={handleSelect} />
              ))}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="shifts">
            <ScrollArea className="h-[400px]">
              {cqsByBurden.shifts.map(cq => (
                <CriticalQuestionItem key={cq.id} cq={cq} onSelect={handleSelect} />
              ))}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="requires">
            <ScrollArea className="h-[400px]">
              {cqsByBurden.requires.map(cq => (
                <CriticalQuestionItem key={cq.id} cq={cq} onSelect={handleSelect} />
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

#### Step 5: Update Admin Interface (1.5 hours)

**File**: `app/(admin)/admin/schemes/[id]/edit/page.tsx`

Add burden configuration to CQ editor:

```typescript
function CQEditor({ cq, onChange }: Props) {
  return (
    <div className="space-y-4 border rounded-lg p-4">
      {/* Existing fields: question, attackType, targetScope */}
      
      {/* NEW: Burden of proof selector */}
      <div>
        <Label>Burden of Proof</Label>
        <Select 
          value={cq.burdenOfProof} 
          onValueChange={(v) => onChange({ ...cq, burdenOfProof: v as BurdenOfProof })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="proponent">
              Proponent (asking shifts burden)
            </SelectItem>
            <SelectItem value="challenger">
              Challenger (must provide evidence)
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Who has the burden to support their position?
        </p>
      </div>
      
      {/* NEW: Evidence requirement toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id={`evidence-${cq.id}`}
          checked={cq.requiresEvidence}
          onCheckedChange={(checked) => onChange({ ...cq, requiresEvidence: checked })}
        />
        <Label htmlFor={`evidence-${cq.id}`}>
          Evidence Required
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger><HelpCircle className="w-3 h-3" /></TooltipTrigger>
            <TooltipContent>
              Must the questioner provide evidence, or does asking suffice?
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* NEW: Premise type selector */}
      <div>
        <Label>Premise Type (Optional)</Label>
        <Select
          value={cq.premiseType || "none"}
          onValueChange={(v) => onChange({ ...cq, premiseType: v === "none" ? null : v as PremiseType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Not specified</SelectItem>
            <SelectItem value="ordinary">Ordinary (must be supported)</SelectItem>
            <SelectItem value="assumption">Assumption (accepted unless questioned)</SelectItem>
            <SelectItem value="exception">Exception (challenger proves)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Carneades premise classification
        </p>
      </div>
    </div>
  );
}
```

#### Step 6: Seed Default Values (1 hour)

**File**: `scripts/seed-cq-burden-defaults.ts`

```typescript
/**
 * Set intelligent defaults for burden of proof based on CQ patterns
 */
async function seedCQBurdenDefaults() {
  console.log("Seeding CQ burden of proof defaults...");
  
  // Pattern 1: Questions about expert qualification → proponent must prove
  await prisma.criticalQuestion.updateMany({
    where: {
      question: { contains: "expert", mode: "insensitive" },
      attackType: "UNDERMINES"
    },
    data: {
      burdenOfProof: "proponent",
      requiresEvidence: false, // Just asking shifts burden
      premiseType: "assumption"
    }
  });
  
  // Pattern 2: Questions about bias/conflict → challenger must prove
  await prisma.criticalQuestion.updateMany({
    where: {
      OR: [
        { question: { contains: "bias", mode: "insensitive" } },
        { question: { contains: "conflict of interest", mode: "insensitive" } }
      ],
      attackType: "UNDERCUTS"
    },
    data: {
      burdenOfProof: "challenger",
      requiresEvidence: true, // Must provide evidence of bias
      premiseType: "exception"
    }
  });
  
  // Pattern 3: Questions about exceptional circumstances → challenger must prove
  await prisma.criticalQuestion.updateMany({
    where: {
      OR: [
        { question: { contains: "exception", mode: "insensitive" } },
        { question: { contains: "special case", mode: "insensitive" } }
      ],
      attackType: "UNDERCUTS"
    },
    data: {
      burdenOfProof: "challenger",
      requiresEvidence: true,
      premiseType: "exception"
    }
  });
  
  // Pattern 4: Questions about alternative explanations → challenger provides
  await prisma.criticalQuestion.updateMany({
    where: {
      question: { contains: "alternative", mode: "insensitive" },
      attackType: "REBUTS"
    },
    data: {
      burdenOfProof: "challenger",
      requiresEvidence: true,
      premiseType: "ordinary"
    }
  });
  
  console.log("✓ CQ burden defaults seeded");
}
```

Run: `tsx scripts/seed-cq-burden-defaults.ts`

#### Step 7: Testing (1 hour)

**File**: `__tests__/lib/utils/cq-burden-helpers.test.ts`

```typescript
describe("CQ Burden Helpers", () => {
  describe("getCQBurdenExplanation", () => {
    it("explains proponent burden correctly", () => {
      const cq: CriticalQuestion = {
        burdenOfProof: "proponent",
        requiresEvidence: false,
        // ... other fields
      };
      
      const explanation = getCQBurdenExplanation(cq);
      expect(explanation).toContain("proponent must address");
    });
    
    it("explains challenger burden with evidence", () => {
      const cq: CriticalQuestion = {
        burdenOfProof: "challenger",
        requiresEvidence: true,
        // ... other fields
      };
      
      const explanation = getCQBurdenExplanation(cq);
      expect(explanation).toContain("must provide evidence");
    });
  });
  
  describe("shouldShowEvidencePrompt", () => {
    it("shows prompt when challenger must provide evidence", () => {
      const cq: CriticalQuestion = {
        burdenOfProof: "challenger",
        requiresEvidence: true,
        // ... other fields
      };
      
      expect(shouldShowEvidencePrompt(cq)).toBe(true);
    });
    
    it("hides prompt when burden shifts to proponent", () => {
      const cq: CriticalQuestion = {
        burdenOfProof: "proponent",
        requiresEvidence: false,
        // ... other fields
      };
      
      expect(shouldShowEvidencePrompt(cq)).toBe(false);
    });
  });
});
```

**Component Tests**: `__tests__/components/arguments/CriticalQuestionItem.test.tsx`

```typescript
describe("CriticalQuestionItem", () => {
  it("displays burden-shifts badge for proponent burden", () => {
    const cq: CriticalQuestion = {
      question: "Is the expert qualified?",
      burdenOfProof: "proponent",
      requiresEvidence: false,
      // ... other fields
    };
    
    render(<CriticalQuestionItem cq={cq} onSelect={jest.fn()} />);
    expect(screen.getByText("Shifts Burden")).toBeInTheDocument();
  });
  
  it("displays evidence-required badge for challenger burden", () => {
    const cq: CriticalQuestion = {
      question: "Is the expert biased?",
      burdenOfProof: "challenger",
      requiresEvidence: true,
      // ... other fields
    };
    
    render(<CriticalQuestionItem cq={cq} onSelect={jest.fn()} />);
    expect(screen.getByText("Evidence Required")).toBeInTheDocument();
  });
  
  it("shows explanation tooltip on hover", async () => {
    const cq: CriticalQuestion = {
      question: "Is this an exception?",
      burdenOfProof: "challenger",
      requiresEvidence: true,
      premiseType: "exception",
      // ... other fields
    };
    
    render(<CriticalQuestionItem cq={cq} onSelect={jest.fn()} />);
    
    const helpIcon = screen.getByRole("button", { name: /help/i });
    await userEvent.hover(helpIcon);
    
    await waitFor(() => {
      expect(screen.getByText(/must provide evidence/i)).toBeInTheDocument();
    });
  });
});
```

#### Step 8: Documentation (30 minutes)

**File**: `docs/features/critical-questions.md`

Add section:

```markdown
## Burden of Proof

Critical questions have different burden allocation:

### Proponent Burden
When `burdenOfProof: "proponent"`, raising the question shifts burden to the argument's proponent:
- **Example**: "Is the expert actually qualified in this domain?"
- **Effect**: Proponent must provide evidence of expertise
- **UI**: Shows "Shifts Burden" badge

### Challenger Burden  
When `burdenOfProof: "challenger"`, the questioner must provide evidence:
- **Example**: "Is the expert biased in this case?"
- **Effect**: Challenger must prove bias exists
- **UI**: Shows "Evidence Required" badge

### Evidence Requirements
The `requiresEvidence` flag indicates whether:
- `true`: Must provide supporting evidence with question
- `false`: Asking alone is sufficient to shift burden

### Premise Types
Following Carneades (Gordon & Walton 2006):
- **Ordinary**: Must always be supported
- **Assumption**: Accepted unless questioned
- **Exception**: Challenger must prove it applies
```

#### Acceptance Criteria

- [ ] Database migration runs without errors
- [ ] All existing CQs have default burden values
- [ ] Admin interface allows editing burden fields
- [ ] CQ display shows burden indicators
- [ ] Tooltips explain burden allocation
- [ ] Tests pass with >90% coverage
- [ ] Documentation updated
- [ ] Deployed to staging for review

---

## Phase 0.2: Epistemic Mode Field
**Effort**: 4-6 hours | **Impact**: Medium | **Priority**: 🟡 Important

### Context

From strategy document Part 2:
> "Kienpointner's epistemic dimension (real/fictive/hypothetical) is missing from Mesh."

Critical for:
- Policy deliberation (hypothetical consequences)
- Counterfactual reasoning ("what if X hadn't happened?")
- Thought experiments

### Implementation

#### Step 1: Add to Schema (30 minutes)

```prisma
model ArgumentScheme {
  id              String  @id @default(cuid())
  name            String
  // ... existing fields
  
  // NEW FIELD
  epistemicMode   String? // "factual" | "counterfactual" | "hypothetical"
  
  @@index([epistemicMode])
}
```

Migration:
```sql
ALTER TABLE "ArgumentScheme" ADD COLUMN "epistemicMode" TEXT;

-- Set defaults based on scheme names
UPDATE "ArgumentScheme" 
SET "epistemicMode" = 'hypothetical'
WHERE "name" ILIKE '%hypothetical%' OR "name" ILIKE '%future%';

UPDATE "ArgumentScheme"
SET "epistemicMode" = 'counterfactual'
WHERE "name" ILIKE '%counterfactual%' OR "name" ILIKE '%what if%';

UPDATE "ArgumentScheme"
SET "epistemicMode" = 'factual'
WHERE "epistemicMode" IS NULL;
```

#### Step 2: Add Filter UI (2 hours)

**File**: `components/schemes/SchemeFilters.tsx`

```typescript
export function SchemeFilters({ onFiltersChange }: Props) {
  const [epistemicMode, setEpistemicMode] = useState<string | null>(null);
  
  return (
    <div className="space-y-4">
      {/* Existing filters */}
      
      {/* NEW: Epistemic mode filter */}
      <div>
        <Label>Epistemic Mode</Label>
        <Select value={epistemicMode || "all"} onValueChange={(v) => {
          setEpistemicMode(v === "all" ? null : v);
          onFiltersChange({ epistemicMode: v === "all" ? null : v });
        }}>
          <SelectTrigger>
            <SelectValue placeholder="All modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="factual">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Factual - Real events/states
              </div>
            </SelectItem>
            <SelectItem value="hypothetical">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Hypothetical - Future scenarios
              </div>
            </SelectItem>
            <SelectItem value="counterfactual">
              <div className="flex items-center gap-2">
                <Rewind className="w-4 h-4" />
                Counterfactual - What if...
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Filter by whether scheme addresses real, possible, or contrary-to-fact situations
        </p>
      </div>
    </div>
  );
}
```

#### Step 3: Display in Scheme Cards (1 hour)

```typescript
export function SchemeCard({ scheme }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>{scheme.name}</CardTitle>
          
          {/* NEW: Epistemic mode badge */}
          {scheme.epistemicMode && (
            <Badge variant="outline" className={cn(
              "text-xs",
              scheme.epistemicMode === "factual" && "bg-green-50 text-green-700",
              scheme.epistemicMode === "hypothetical" && "bg-blue-50 text-blue-700",
              scheme.epistemicMode === "counterfactual" && "bg-purple-50 text-purple-700"
            )}>
              {scheme.epistemicMode === "factual" && <FileText className="w-3 h-3 mr-1" />}
              {scheme.epistemicMode === "hypothetical" && <Lightbulb className="w-3 h-3 mr-1" />}
              {scheme.epistemicMode === "counterfactual" && <Rewind className="w-3 h-3 mr-1" />}
              {scheme.epistemicMode}
            </Badge>
          )}
        </div>
      </CardHeader>
      {/* Rest of card */}
    </Card>
  );
}
```

#### Step 4: Admin Interface (1 hour)

Add to scheme editor:

```typescript
<div>
  <Label>Epistemic Mode</Label>
  <Select value={scheme.epistemicMode || "none"} onValueChange={handleChange}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">Not specified</SelectItem>
      <SelectItem value="factual">Factual - Real events/states</SelectItem>
      <SelectItem value="hypothetical">Hypothetical - Future scenarios</SelectItem>
      <SelectItem value="counterfactual">Counterfactual - What if...</SelectItem>
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground mt-1">
    Kienpointner's epistemic dimension: Does this scheme reason about actual, possible, or contrary-to-fact situations?
  </p>
</div>
```

#### Acceptance Criteria

- [ ] Field added to schema with migration
- [ ] Filter works in scheme browser
- [ ] Badges display correctly
- [ ] Admin can set epistemic mode
- [ ] Defaults seeded for existing schemes
- [ ] Tests cover filtering logic

---

## Phase 0 Summary

After Phase 0 completion, users will see:

✅ **Burden of Proof Indicators**: Know when they need evidence vs. just asking  
✅ **Epistemic Mode Filtering**: Find schemes for hypothetical/counterfactual reasoning  
✅ **Enhanced CQ Display**: Better understand how to use critical questions  
✅ **Improved Scheme Metadata**: Richer classification aids discovery  

**Foundation Built**:
- Database schema ready for multi-scheme arguments (Phase 1)
- Burden tracking enables argument strength calculation (Phase 2)
- Epistemic modes support purpose-driven navigation (Phase 3)

---

## Phase 0 Deployment Checklist

### Pre-Deployment

- [ ] All tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Database migration tested on staging database copy
- [ ] Seed scripts run successfully
- [ ] Documentation reviewed and approved

### Deployment

- [ ] Feature flag: `ENABLE_BURDEN_OF_PROOF=true` (default false)
- [ ] Deploy database migration
- [ ] Run seed scripts
- [ ] Deploy application code
- [ ] Enable feature flag for admin users
- [ ] Monitor for errors (24 hours)

### Post-Deployment

- [ ] Gather admin feedback on burden indicators
- [ ] Track usage of epistemic mode filter
- [ ] Identify any confusing CQ explanations
- [ ] Iterate based on feedback

### Rollback Plan

If issues arise:
1. Disable feature flag
2. Revert application code
3. Database rollback not needed (new fields nullable/defaulted)

---

*End of Part 1. Continue to Part 2 for Phase 1-2 (Core Architecture Changes)*
