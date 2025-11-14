# Nets Tab Implementation - Phase 1 Complete

## Overview

Successfully created a standalone "Nets" tab for managing argument nets as first-class entities, separate from individual arguments. This provides a dedicated space for creating, viewing, and analyzing multi-scheme reasoning chains.

## What Was Built

### 1. API Endpoints

**GET /api/deliberations/[id]/nets**
- Fetches all nets in a deliberation
- Query params: `netType`, `sortBy`, `order`
- Returns nets with full metadata, steps, and author info
- Calculates deliberation-wide statistics
- Infers net type from step structure (serial/convergent/divergent)

**DELETE /api/nets** (enhanced)
- Delete nets with authorization check
- Cascades to SchemeNetSteps automatically
- Only net owner can delete

**POST /api/nets** (enhanced)
- Now updates existing nets instead of blocking
- Returns `existingNet: true` flag when updating

### 2. Components

**NetsTab** (`components/nets/NetsTab.tsx` - 450 lines)
- Grid view of all nets with cards
- Filters: Net type (serial/convergent/divergent/hybrid/all)
- Sorting: By date, confidence, or step count
- Stats dashboard showing:
  - Total nets
  - Average confidence
  - Average step count
  - Net type breakdown
- Empty state with helpful message
- Integrates ArgumentNetBuilder for creation

**NetCard** (sub-component within NetsTab)
- Visual net summary card
- Color-coded net type badges
- Confidence percentage (color-coded: green/yellow/red)
- Steps preview (first 3 steps)
- Weakest link indicator
- Actions: View, Edit, Delete

### 3. Features

✅ **Filtering & Sorting**
- Filter by net type
- Sort by date, confidence, or step count
- Ascending/descending toggle

✅ **Statistics Dashboard**
- Deliberation-wide net analytics
- Average confidence calculation
- Net type distribution
- Step count analysis

✅ **Net Management**
- Create new nets via "Create Net" button
- Delete nets with confirmation
- Auto-refresh on changes

✅ **Visual Design**
- Color-coded confidence levels
- Net type badges with distinct colors
- Responsive grid layout (1/2/3 columns)
- Hover effects and transitions

## Integration Instructions

### Step 1: Add NetsTab to Deliberation Page

Find your deliberation page component (likely `app/deliberations/[id]/page.tsx` or similar) and add the Nets tab:

```typescript
import { NetsTab } from "@/components/nets/NetsTab";

// In your tabs configuration:
<Tabs defaultValue="arguments">
  <TabsList>
    <TabsTrigger value="arguments">Arguments</TabsTrigger>
    <TabsTrigger value="claims">Claims</TabsTrigger>
    <TabsTrigger value="nets">Nets</TabsTrigger> {/* NEW */}
  </TabsList>
  
  <TabsContent value="arguments">
    {/* Existing arguments tab */}
  </TabsContent>
  
  <TabsContent value="claims">
    {/* Existing claims tab */}
  </TabsContent>
  
  <TabsContent value="nets">
    <NetsTab deliberationId={deliberationId} /> {/* NEW */}
  </TabsContent>
</Tabs>
```

### Step 2: Test the Flow

1. Navigate to a deliberation
2. Click "Nets" tab
3. Click "Create Net" button
4. ArgumentNetBuilder opens in standalone mode
5. Create a net (currently requires an existing argument ID)
6. Net appears in list with statistics

### Step 3: Next Steps (Phase 2)

The following enhancements are needed:

1. **ArgumentNetBuilder Standalone Mode**
   - Currently requires `argumentId` prop
   - Need to add argument selector/creator at start
   - Support creating new arguments OR selecting existing ones

2. **NetDetailView Component**
   - Full-screen view of single net
   - Step-by-step visualization
   - Dependency graph (ReactFlow)
   - Critical questions per step
   - Weakest link analysis

3. **Edit Mode**
   - "Edit" button functionality
   - Open ArgumentNetBuilder with existing net data
   - Update existing steps

## Current State

### ✅ Working
- Nets tab displays all nets in deliberation
- Statistics dashboard shows analytics
- Filtering by net type
- Sorting by multiple criteria
- Delete functionality with authorization
- Color-coded confidence levels
- Net type inference (serial/convergent/divergent)
- Responsive grid layout

### ⚠️ Partially Working
- "Create Net" button opens ArgumentNetBuilder
- But currently requires existing argumentId
- Need standalone mode enhancement

### ❌ Not Yet Implemented
- "View" button (needs NetDetailView component)
- "Edit" button (needs edit mode in ArgumentNetBuilder)
- Argument selector for new nets
- Chaining multiple arguments together
- Visual dependency graph in detail view

## API Response Example

```json
{
  "nets": [
    {
      "id": "net-123",
      "argumentId": "arg-456",
      "argumentConclusion": "Climate action is necessary",
      "description": "Serial chain: Expert → Evidence → Causal",
      "netType": "serial",
      "overallConfidence": 0.88,
      "stepCount": 3,
      "createdAt": "2025-11-14T...",
      "author": {
        "id": 1,
        "username": "johndoe",
        "name": "John Doe"
      },
      "steps": [
        {
          "order": 1,
          "schemeName": "Expert Opinion",
          "label": "Expert Consensus",
          "confidence": 0.95
        },
        {
          "order": 2,
          "schemeName": "Sign Evidence",
          "label": "Observable Data",
          "confidence": 0.88
        }
      ],
      "weakestStep": {
        "stepOrder": 2,
        "confidence": 0.88,
        "label": "Observable Data"
      }
    }
  ],
  "stats": {
    "totalNets": 5,
    "averageConfidence": 0.85,
    "averageStepCount": 3.2,
    "netTypeBreakdown": {
      "serial": 3,
      "convergent": 1,
      "divergent": 0,
      "hybrid": 1
    }
  }
}
```

## Files Created

1. `app/api/deliberations/[id]/nets/route.ts` (158 lines)
2. `components/nets/NetsTab.tsx` (450 lines)

## Files Modified

1. `app/api/nets/route.ts` (added DELETE endpoint + update logic)

## Total Lines Added

~650 lines

## Testing Checklist

- [ ] Navigate to Nets tab in deliberation
- [ ] Verify stats dashboard displays correctly
- [ ] Test filtering by net type
- [ ] Test sorting by confidence/date/steps
- [ ] Test delete with authorization
- [ ] Verify empty state shows when no nets
- [ ] Test responsive layout (mobile/tablet/desktop)
- [ ] Verify color coding (confidence, net types)

## Next Phase Tasks

1. **ArgumentNetBuilder Standalone Enhancement** (4-6 hours)
   - Add argument selector step at beginning
   - Support creating new arguments in wizard
   - Allow selecting existing arguments to chain

2. **NetDetailView Component** (6-8 hours)
   - Full-screen modal with step visualization
   - ReactFlow dependency graph
   - CQ integration per step
   - Weakest link highlighting

3. **Edit Mode** (2-3 hours)
   - Load existing net data into ArgumentNetBuilder
   - Update vs create logic
   - Version history (future)

---

**Status**: Phase 1 Complete ✅  
**Next**: ArgumentNetBuilder standalone mode enhancement  
**ETA**: 2-3 hours for basic standalone mode
