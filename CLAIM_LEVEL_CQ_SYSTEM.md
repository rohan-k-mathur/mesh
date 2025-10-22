# Claim-Level Critical Questions System

## Overview

This system enables asking critical questions directly on claims (not just on arguments), addressing the gap where claim-level CQs were previously always empty.

## Architecture

### Two Types of CQ Schemes

1. **Argument-Based Schemes** (existing):
   - Attached to arguments via `SchemeInstance`
   - Examples: `expert_opinion`, `analogy`, `causal_reasoning`
   - CQs shown in argument rows in `AIFArgumentsListPro`
   - Questions focus on reasoning quality (warrants, premises, inference)

2. **Claim-Level Schemes** (NEW):
   - Attached to claims via `SchemeInstance`
   - Examples: `claim_relevance`, `claim_clarity`, `claim_truth`
   - CQs shown in `ClaimMiniMap` expanded view and CQ modal
   - Questions focus on claim properties (truth, relevance, clarity)

### Generic Claim Schemes

Three pre-defined schemes for claim-level interrogation:

**1. Claim Relevance** (`claim_relevance`)
- Is this claim relevant to the deliberation topic?
- Does this claim directly address the issue being discussed?

**2. Claim Clarity** (`claim_clarity`)
- Is the claim clearly and unambiguously stated?
- Are all key terms in the claim properly defined?

**3. Claim Truth** (`claim_truth`)
- Is the claim factually accurate?
- Is there evidence to support this claim?
- Is there expert consensus on this claim?

## Implementation

### API Endpoint

**`POST /api/claims/[id]/ensure-schemes`**

- Checks if claim has any attached schemes
- If not, auto-attaches all three generic claim schemes
- Creates `SchemeInstance` records linking claim → scheme
- Creates schemes in DB if they don't exist yet
- Returns: `{ ok: true, schemes: ['claim_relevance', 'claim_clarity', 'claim_truth'] }`

### UI Integration

**ClaimMiniMap Component** (`components/claims/ClaimMiniMap.tsx`):

1. **CQ Button**: Calls `ensure-schemes` before opening CQ modal
2. **Expand Button**: Calls `ensure-schemes` before showing expanded view
3. **Expanded View**: Shows full `CriticalQuestions` component inline

### Workflow

```
User clicks "CQs" button on claim
         ↓
POST /api/claims/[claimId]/ensure-schemes
         ↓
Check if claim has SchemeInstance records
         ↓
    No schemes? → Create 3 generic schemes
         ↓
Open CQ modal with schemes populated
         ↓
CriticalQuestionsV2 fetches schemes via /api/cqs
         ↓
User sees relevance/clarity/truth questions
         ↓
User can ask WHY moves, attach attacks, post GROUNDS
```

## Data Flow

```typescript
// Before: CQ modal empty for claims without arguments
GET /api/cqs?targetType=claim&targetId=claim_xyz
→ { schemes: [] }  // No SchemeInstance records!

// After: Auto-attach generic schemes
POST /api/claims/claim_xyz/ensure-schemes
→ Creates 3 SchemeInstance records

GET /api/cqs?targetType=claim&targetId=claim_xyz
→ { 
    schemes: [
      { key: 'claim_relevance', title: 'Claim Relevance', cqs: [...] },
      { key: 'claim_clarity', title: 'Claim Clarity', cqs: [...] },
      { key: 'claim_truth', title: 'Claim Truth', cqs: [...] }
    ]
  }
```

## Database Schema

### ArgumentScheme Table
```prisma
model ArgumentScheme {
  id          String  @id @default(cuid())
  key         String  @unique
  title       String?
  summary     String
  cq          Json    @default("[]")  // Array of {key, text}
  // ...
}
```

### SchemeInstance Table (Polymorphic)
```prisma
model SchemeInstance {
  id          String   @id @default(cuid())
  targetType  String   // 'card' | 'claim' | 'argument'
  targetId    String
  schemeId    String
  data        Json
  createdById String
  scheme      ArgumentScheme @relation(...)
  
  @@index([targetType, targetId])
}
```

## Benefits

1. **Claim-level interrogation**: Can question claims directly without needing arguments
2. **Consistent UX**: Same CQ interface works for both claims and arguments
3. **Separation of concerns**: 
   - Argument schemes → reasoning quality
   - Claim schemes → content quality
4. **Automatic**: No manual setup required — schemes attached on first use
5. **Extensible**: Easy to add more generic schemes (e.g., `claim_ethics`, `claim_feasibility`)

## Future Enhancements

### Phase 2
- Add more generic schemes (ethics, feasibility, consistency)
- Allow custom claim-level schemes per deliberation
- Batch ensure-schemes for all claims in deliberation

### Phase 3
- Scheme recommendation based on claim content analysis
- Inter-claim consistency CQs ("Does this contradict claim X?")
- Temporal CQs ("Is this claim still accurate given recent events?")

## Testing

### Manual Test
1. Open deliberation in DeepDivePanel
2. Click claim in ClaimMiniMap
3. Click "CQs" button or "+" to expand
4. Verify CQ panel shows 3 sections (Relevance, Clarity, Truth)
5. Ask a WHY move, attach an attack, post GROUNDS
6. Verify move appears in Legal Moves panel

### API Test
```bash
# Check claim has no schemes
GET /api/cqs?targetType=claim&targetId=claim_xyz

# Ensure schemes
POST /api/claims/claim_xyz/ensure-schemes

# Verify schemes attached
GET /api/cqs?targetType=claim&targetId=claim_xyz
```

## Related Files

- **API**: `app/api/claims/[id]/ensure-schemes/route.ts`
- **UI**: `components/claims/ClaimMiniMap.tsx`
- **CQ Component**: `components/claims/CriticalQuestionsV2.tsx`
- **CQ API**: `app/api/cqs/route.ts`
- **Schema**: `lib/models/schema.prisma` (ArgumentScheme, SchemeInstance)

## Design Rationale

**Why auto-attach instead of manual setup?**
- UX: Users shouldn't have to "set up" CQs — they should just work
- Consistency: Every claim gets same baseline interrogation
- Discovery: Users learn about CQs through use, not configuration

**Why these three schemes (relevance, clarity, truth)?**
- Based on Pragma-Dialectical theory (van Eemeren & Grootendorst)
- Cover fundamental dimensions of claim evaluation
- Align with epistemic responsibilities in public discourse
- Map to common counter-argument types (rebut for truth, undercut for relevance)

**Why not just use argument schemes on the claim's arguments?**
- Arguments may not exist yet (claim was asserted, not argued)
- Claim properties are distinct from reasoning properties
- Enables questioning at multiple levels (claim + argument)
- Aligns with theory: Premises can be challenged independently of inference
