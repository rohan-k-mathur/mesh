# CEG Claim Seeding Script

## Overview

`seed-claims-ceg-demo.ts` creates a realistic Critical Evaluation Graph (CEG) for deliberations, populating them with interconnected claims that demonstrate dialogical argumentation patterns.

## What It Creates

### 40 Claims organized into:
- **3 Main Policy Positions**: Solar mandates, retrofitting, and market incentives
- **Supporting Arguments**: Evidence and reasoning backing each position
- **Rebuttals**: Direct counter-arguments to positions
- **Counter-Rebuttals**: Defense against rebuttals
- **Meta-Arguments**: Arguments about the debate structure itself
- **Complex Moves**: Hybrid positions and cross-cutting arguments

### 51 Claim Edges across 4 types:
- **SUPPORTS (20)**: Claims that provide evidence for other claims
- **REBUTS (20)**: Claims that directly contradict conclusions
- **UNDERCUTS (8)**: Claims that attack the reasoning/inference
- **UNDERMINES (3)**: Claims that challenge factual premises

### Grounded Semantics Labels:
- **IN (25)**: Claims that are warranted (undefeated)
- **OUT (15)**: Claims defeated by IN attackers
- Automatically computed using grounded semantics algorithm

## Usage

```bash
# Basic usage with existing deliberation
npx tsx scripts/seed-claims-ceg-demo.ts <deliberationId>

# Clear existing claims before seeding (recommended)
npx tsx scripts/seed-claims-ceg-demo.ts <deliberationId> --clear

# Quiet mode (minimal output)
npx tsx scripts/seed-claims-ceg-demo.ts <deliberationId> --clear --quiet
```

### Example

```bash
npx tsx scripts/seed-claims-ceg-demo.ts cmgy6c8vz0000c04w4l9khiux --clear
```

## What Gets Created

### Users (8 diverse participants)
- Dr. Sarah Chen (urban sustainability researcher)
- Marcus Rodriguez (local developer)
- Aisha Thompson (climate scientist)
- James Park (economics professor)
- Elena Volkov (architect)
- David Osei (city council member)
- Maya Patel (renewable energy engineer)
- Robert Kim (affordable housing advocate)

### Topic: Climate Policy & Solar Energy

The seed data creates a realistic deliberation on **"Should the city mandate solar panels on new construction?"** with three competing positions:

1. **Solar Mandates** - Require solar on all new buildings
2. **Retrofitting Priority** - Focus on existing buildings first
3. **Market Incentives** - Use tax credits instead of mandates

Each position has:
- Multiple supporting arguments with evidence
- Counter-arguments from opposing viewpoints
- Sophisticated dialogical moves (undercuts, undermines)
- Meta-level critiques of the debate itself

## Visualization

The seeded data is optimized for the `CegMiniMap` component, which displays:
- **Node colors**: IN (green), OUT (red), UNDEC (gray)
- **Edge types**: Support (solid), Rebuts (solid), Undercuts (dashed), Undermines (dotted)
- **Graph metrics**: Support vs Counter percentages, grounded label distribution
- **Interactive**: Hover effects, connected node highlighting

## API Endpoints to Test

After seeding, you can test these endpoints:

```bash
# Get full CEG data
GET /api/claims/ceg?deliberationId=<id>

# Get claim summary
GET /api/claims/summary?deliberationId=<id>

# Get grounded labels
GET /api/claims/labels?deliberationId=<id>

# Get individual claim with edges
GET /api/claims/<claimId>
```

## Technical Details

### Temporal Distribution
- Claims are created with realistic timestamps (0-78 hours)
- Earlier claims represent initial positions
- Later claims represent responses and refinements
- Simulates natural debate progression

### Edge Semantics
- **targetScope**: "conclusion", "inference", or "premise"
- **REBUTS**: Attacks the conclusion directly
- **UNDERCUTS**: Attacks the reasoning/inference step
- **UNDERMINES**: Attacks factual premises/data
- **SUPPORTS**: Provides evidence or reasoning support

### Grounded Semantics
- Automatically computed after seeding
- Uses Dung's grounded semantics algorithm
- Labels stored in `ClaimLabel` table
- Powers the IN/OUT/UNDEC visualization

## Files Modified

- `scripts/seed-claims-ceg-demo.ts` - Main seeding script
- Uses existing models: `Claim`, `ClaimEdge`, `ClaimLabel`, `User`
- Uses existing utilities: `mintClaimMoid`, `recomputeGroundedForDelib`

## Related Components

- `components/deepdive/CegMiniMap.tsx` - Main visualization component
- `components/claims/ClaimMiniMap.tsx` - Alternative claim list view
- `app/api/claims/ceg/route.ts` - CEG data endpoint
- `lib/ceg/grounded.ts` - Grounded semantics computation

## Customization

To customize the seed data:

1. Edit `MOCK_CLAIMS` array to add/modify claims
2. Adjust `supports`, `rebuts`, `undercuts`, `undermines` arrays
3. Modify `timeOffset` to control temporal ordering
4. Add/edit `MOCK_USERS` for different participant profiles

## Notes

- Script is idempotent with `--clear` flag
- Uses actual Prisma models (no mocking)
- Creates real database records
- Grounded semantics computation may fail gracefully if there are cycles or issues
- All claims use unique MOIDs (Message Object IDs) based on text content
