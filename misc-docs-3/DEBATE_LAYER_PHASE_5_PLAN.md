# Debate Layer Phase 5: AIF Neighborhood Enhancements

**Status**: Ready to start
**Estimated Time**: 5-7 days (can be broken into smaller chunks)
**Prerequisites**: ✅ Phase 4 Task 3 Complete (AIF Neighborhood Integration)

---

## Overview

Phase 5 builds on the completed AIF Neighborhood Integration (Task 3) by adding rich metadata visualization to the AIF diagram viewer. This makes scheme information, CQ status, import provenance, and dialogue context visible at a glance.

**Key Goal**: Transform the AIF diagram from a basic graph to an information-rich visualization that shows schemes, CQs, conflicts, and provenance without requiring clicks.

---

## Task 1: Visual Enhancements to AifDiagramViewerDagre (2-3 days)

### 1.1 Scheme Badge on RA-nodes
**File**: `components/map/AifDiagramViewerDagre.tsx`

**Requirements**:
- [ ] Display small scheme icon on RA-nodes that have a scheme
- [ ] Show scheme name on hover
- [ ] Badge style: small colored dot or icon (top-right corner of node)
- [ ] Colors by scheme category (if available)

**Implementation**:
```typescript
// In node rendering section
{node.kind === 'RA' && node.schemeKey && (
  <div className="absolute top-1 right-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="h-4 w-4 p-0">
            <SchemeIcon schemeKey={node.schemeKey} />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <SchemeName schemeKey={node.schemeKey} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
)}
```

**Data Requirements**:
- Node already has `schemeKey` from AIF API
- May need to fetch scheme metadata for name display

---

### 1.2 CQ Status Indicator on I-nodes
**File**: `components/map/AifDiagramViewerDagre.tsx`

**Requirements**:
- [ ] Display orange dot on I-nodes with open CQs
- [ ] Show CQ count on hover
- [ ] Badge position: top-right corner
- [ ] Tooltip: List of open CQ labels

**Implementation**:
```typescript
// In node rendering section
{node.kind === 'I' && node.openCQCount > 0 && (
  <div className="absolute top-1 right-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="warning" className="h-4 w-4 p-0 rounded-full">
            {node.openCQCount}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-semibold">Open CQs:</p>
            <ul>
              {node.openCQs?.map(cq => (
                <li key={cq.id}>• {cq.label}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
)}
```

**Data Requirements**:
- Need to extend AIF API to include CQ counts on nodes
- Or fetch CQ data client-side for nodes with arguments

---

### 1.3 Import Provenance Badge
**File**: `components/map/AifDiagramViewerDagre.tsx`

**Requirements**:
- [ ] Display purple flag on imported arguments
- [ ] Show source deliberation name on hover
- [ ] Badge position: top-left corner
- [ ] Tooltip: Source room name, import date

**Implementation**:
```typescript
{node.importSource && (
  <div className="absolute top-1 left-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="secondary" className="h-4 w-4 p-0">
            <FlagIcon className="h-3 w-3 text-purple-600" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Imported from: <strong>{node.importSource.roomName}</strong>
            <br />
            {formatDate(node.importSource.importedAt)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
)}
```

**Data Requirements**:
- Need to track import provenance in database
- Extend AIF node response to include import metadata

---

### 1.4 Dialogue Move Icon
**File**: `components/map/AifDiagramViewerDagre.tsx`

**Requirements**:
- [ ] Display speech bubble icon on nodes associated with dialogue moves
- [ ] Show locution type on hover (assert, challenge, retract, etc.)
- [ ] Badge position: bottom-right corner
- [ ] Tooltip: Move type, speaker, timestamp

**Implementation**:
```typescript
{node.dialogueMove && (
  <div className="absolute bottom-1 right-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="h-4 w-4 p-0">
            <MessageSquare className="h-3 w-3" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p><strong>{node.dialogueMove.locutionType}</strong></p>
            <p>By: {node.dialogueMove.speaker}</p>
            <p>{formatDate(node.dialogueMove.timestamp)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
)}
```

**Data Requirements**:
- Link AIF nodes to DialogueMove records
- Extend API to include dialogue context

---

## Task 2: Filter Controls in DiagramPanel (1-2 days)

### 2.1 Add Toggle Filters
**File**: `components/map/AifDiagramViewerDagre.tsx` or create new `components/aif/AifDiagramFilters.tsx`

**Requirements**:
- [ ] Toggle: Show/hide CA-nodes (conflict arguments)
- [ ] Toggle: Show/hide PA-nodes (preference arguments)
- [ ] Toggle: Show only nodes with open CQs
- [ ] Toggle: Show only imported arguments

**Implementation**:
```typescript
// New component: AifDiagramFilters.tsx
interface FilterState {
  showCA: boolean;
  showPA: boolean;
  onlyOpenCQs: boolean;
  onlyImported: boolean;
}

export function AifDiagramFilters({ filters, onChange }: Props) {
  return (
    <div className="flex gap-2 p-2 border-b">
      <ToggleButton
        pressed={filters.showCA}
        onPressedChange={(v) => onChange({ ...filters, showCA: v })}
      >
        <ShieldIcon className="h-4 w-4 mr-1" />
        Show Conflicts
      </ToggleButton>
      
      <ToggleButton
        pressed={filters.showPA}
        onPressedChange={(v) => onChange({ ...filters, showPA: v })}
      >
        <StarIcon className="h-4 w-4 mr-1" />
        Show Preferences
      </ToggleButton>
      
      <ToggleButton
        pressed={filters.onlyOpenCQs}
        onPressedChange={(v) => onChange({ ...filters, onlyOpenCQs: v })}
      >
        <AlertCircle className="h-4 w-4 mr-1" />
        Only Open CQs
      </ToggleButton>
      
      <ToggleButton
        pressed={filters.onlyImported}
        onPressedChange={(v) => onChange({ ...filters, onlyImported: v })}
      >
        <FlagIcon className="h-4 w-4 mr-1" />
        Only Imported
      </ToggleButton>
    </div>
  );
}
```

**Integration**:
- Add filter state to `AifDiagramViewerDagre`
- Filter nodes/edges before passing to dagre layout
- Persist filter state in URL params or local storage

---

### 2.2 Filter Logic
**File**: `components/map/AifDiagramViewerDagre.tsx`

```typescript
const filteredNodes = useMemo(() => {
  let nodes = rawNodes;
  
  if (!filters.showCA) {
    nodes = nodes.filter(n => n.kind !== 'CA');
  }
  
  if (!filters.showPA) {
    nodes = nodes.filter(n => n.kind !== 'PA');
  }
  
  if (filters.onlyOpenCQs) {
    nodes = nodes.filter(n => n.openCQCount > 0);
  }
  
  if (filters.onlyImported) {
    nodes = nodes.filter(n => n.importSource != null);
  }
  
  return nodes;
}, [rawNodes, filters]);

const filteredEdges = useMemo(() => {
  const nodeIds = new Set(filteredNodes.map(n => n.id));
  return rawEdges.filter(e => 
    nodeIds.has(e.source) && nodeIds.has(e.target)
  );
}, [rawEdges, filteredNodes]);
```

---

## Task 3: Enhanced Metadata Tooltips (1-2 days)

### 3.1 RA-node Tooltip Enhancement
**File**: `components/map/AifDiagramViewerDagre.tsx`

**Requirements**:
- [ ] Show scheme name and key
- [ ] List associated CQs (open/closed status)
- [ ] Display import source (if imported)
- [ ] Show dialogue context (if linked to move)

**Implementation**:
```typescript
<TooltipContent className="max-w-sm">
  <div className="space-y-2 text-xs">
    <div>
      <p className="font-semibold">Reasoning Argument</p>
      <p className="text-neutral-600">{node.label}</p>
    </div>
    
    {node.schemeKey && (
      <div className="border-t pt-2">
        <p className="font-semibold">Scheme:</p>
        <p>{schemeName}</p>
      </div>
    )}
    
    {node.cqs && node.cqs.length > 0 && (
      <div className="border-t pt-2">
        <p className="font-semibold">Critical Questions:</p>
        <ul className="list-disc list-inside">
          {node.cqs.map(cq => (
            <li key={cq.id} className={cq.isOpen ? 'text-orange-600' : ''}>
              {cq.label} {cq.isOpen ? '(open)' : '(answered)'}
            </li>
          ))}
        </ul>
      </div>
    )}
    
    {node.importSource && (
      <div className="border-t pt-2">
        <p className="font-semibold">Imported from:</p>
        <p>{node.importSource.roomName}</p>
      </div>
    )}
    
    {node.dialogueMove && (
      <div className="border-t pt-2">
        <p className="font-semibold">Dialogue Move:</p>
        <p>{node.dialogueMove.locutionType} by {node.dialogueMove.speaker}</p>
      </div>
    )}
  </div>
</TooltipContent>
```

---

### 3.2 I-node Tooltip Enhancement
**Requirements**:
- [ ] Show full statement text
- [ ] Display role (premise, conclusion, etc.)
- [ ] List CQs targeting this node
- [ ] Show conflicts (if any)

---

### 3.3 CA-node Tooltip Enhancement
**Requirements**:
- [ ] Show conflict type (undercut, rebut, etc.)
- [ ] Display conflicting claims
- [ ] Show resolution status

---

### 3.4 PA-node Tooltip Enhancement
**Requirements**:
- [ ] Show preference type
- [ ] Display justification
- [ ] Show preference strength

---

## Testing Checklist

### Rendering Performance
- [ ] Test with AIF graph of 50 nodes
- [ ] Test with AIF graph of 100+ nodes
- [ ] Verify badges don't cause layout shift
- [ ] Check tooltip rendering performance (hover 20+ nodes rapidly)

### Filter Interactions
- [ ] Test all filter combinations
- [ ] Verify filtered graphs remain connected
- [ ] Check filter state persistence
- [ ] Test mobile responsiveness of filters

### Tooltip Accuracy
- [ ] Verify all tooltip data matches database
- [ ] Check tooltip positioning (stays on screen)
- [ ] Test tooltip responsiveness (no delay/flickering)
- [ ] Validate accessibility (keyboard navigation)

### Integration
- [ ] Test from DebateSheetReader → MiniNeighborhoodPreview → Full AIF diagram
- [ ] Verify badge data flows through all diagram views
- [ ] Check consistency between mini preview and full diagram

---

## Implementation Order (Recommended)

### Sprint 1 (2 days): Basic Badges
1. Add scheme badge to RA-nodes
2. Add CQ indicator to I-nodes
3. Test rendering with existing diagrams

### Sprint 2 (2 days): Advanced Badges + Filters
1. Add import provenance badge
2. Add dialogue move icon
3. Implement filter controls
4. Test filter interactions

### Sprint 3 (1-2 days): Enhanced Tooltips
1. Enhance RA-node tooltips
2. Enhance I/CA/PA tooltips
3. Polish tooltip styling
4. Test tooltip accuracy

### Sprint 4 (1 day): Integration + Polish
1. Test full user journey
2. Performance optimization
3. Mobile responsiveness
4. Documentation updates

---

## Files to Modify

**Primary**:
- `components/map/AifDiagramViewerDagre.tsx` (main enhancement)
- `components/aif/AifDiagramFilters.tsx` (new component)

**Supporting**:
- `app/api/aif/nodes/[id]/route.ts` (extend API response with metadata)
- `components/arguments/ArgumentActionsSheet.tsx` (integrate filters)
- `lib/aif-utils.ts` (helper functions for badge logic)

**Testing**:
- Create test file with mock AIF data including all metadata types
- Add Storybook stories for badge variations

---

## Data Requirements

To implement Phase 5 fully, the AIF API responses need to include:

1. **Scheme metadata** (already available via `schemeKey`)
2. **CQ counts and status** (may need new query)
3. **Import provenance** (needs database schema for import tracking)
4. **Dialogue move context** (link AIF nodes to DialogueMove records)

**Schema Changes Needed**:
```sql
-- Add import tracking to Arguments table
ALTER TABLE "Argument" ADD COLUMN "importSourceRoomId" TEXT;
ALTER TABLE "Argument" ADD COLUMN "importedAt" TIMESTAMP;
ALTER TABLE "Argument" ADD COLUMN "originalArgumentId" TEXT;

-- Link AIF nodes to dialogue moves
ALTER TABLE "AifNode" ADD COLUMN "dialogueMoveId" TEXT;
ALTER TABLE "AifNode" ADD FOREIGN KEY ("dialogueMoveId") REFERENCES "DialogueMove"("id");
```

**Migration Priority**:
- **High**: Scheme badges (no schema changes needed)
- **Medium**: CQ indicators (query existing data)
- **Low**: Import provenance (requires new schema + feature)
- **Low**: Dialogue move icons (requires new schema + feature)

---

## Next Steps

Ready to start Phase 5? I recommend:

1. **Quick Win**: Start with Sprint 1 (scheme badges + CQ indicators)
   - No schema changes needed
   - Uses existing data
   - Immediate visual improvement
   - Can complete in 2-3 hours

2. **After Sprint 1**: Decide whether to continue Phase 5 or jump to CHUNK 5B
   - Phase 5 Sprints 2-4 require more planning (import tracking, dialogue linking)
   - CHUNK 5B (cross-deliberation) may be higher priority

**Shall I start Sprint 1 (scheme badges + CQ indicators)?** This will give us immediate visual improvements to the AIF diagram viewer without requiring schema changes.
