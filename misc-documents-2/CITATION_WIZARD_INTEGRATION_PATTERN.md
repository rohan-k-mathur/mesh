# Citation Integration Pattern for Wizards

## Summary
This document outlines the standard pattern for integrating the unified citation system into argument/attack construction wizards.

## Pattern Overview

### 1. Add CitationCollector Import & Type
```typescript
import CitationCollector, { type PendingCitation } from "@/components/citations/CitationCollector";
```

### 2. Add pendingCitations State
```typescript
const [pendingCitations, setPendingCitations] = useState<PendingCitation[]>([]);
```

### 3. Add Citation Attachment in handleSubmit

After creating the claim/argument entity, attach citations:

```typescript
async function handleSubmit() {
  // Step 1: Create claim/argument
  const response = await fetch("/api/claims" /* or /api/arguments */, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ /* ... */ }),
  });
  
  const data = await response.json();
  const entityId = data.claim?.id || data.id; // or data.argument.id
  
  // Step 2: Attach citations (if any)
  if (pendingCitations.length > 0) {
    await Promise.all(
      pendingCitations.map(async (citation, idx) => {
        try {
          // Resolve the source
          let resolvePayload: any = {};
          if (citation.type === "url") {
            resolvePayload = { url: citation.value, meta: { title: citation.title } };
          } else if (citation.type === "doi") {
            resolvePayload = { doi: citation.value };
          } else if (citation.type === "library") {
            resolvePayload = { libraryPostId: citation.value, meta: { title: citation.title } };
          }

          const resolveRes = await fetch("/api/citations/resolve", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(resolvePayload),
          });
          
          if (!resolveRes.ok) return;
          const { source } = await resolveRes.json();
          if (!source?.id) return;

          // Attach the citation
          const attachPayload = {
            targetType: "claim", // or "argument"
            targetId: entityId,
            sourceId: source.id,
            locator: citation.locator || undefined,
            quote: citation.quote || "", // API requires string, not null
            note: citation.note || undefined,
          };
          
          await fetch("/api/citations/attach", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(attachPayload),
          });
        } catch (citErr) {
          console.error(`Failed to attach citation ${idx + 1}:`, citErr);
        }
      })
    );
    
    // Clear citations after attachment
    setPendingCitations([]);
    
    // Fire citations:changed event
    window.dispatchEvent(
      new CustomEvent("citations:changed", {
        detail: { targetType: "claim", targetId: entityId }
      } as any)
    );
  }
  
  // Step 3: Complete the wizard
  onComplete?.(entityId);
}
```

### 4. Add CitationCollector to Evidence Step

Replace or supplement legacy evidence collection with CitationCollector:

```tsx
<div className="space-y-3">
  <Label className="text-sm font-medium">Evidence & Citations</Label>
  <CitationCollector
    citations={pendingCitations}
    onChange={setPendingCitations}
  />
</div>
```

### 5. Display Citations in Review Step

Show pending citations in the review step:

```tsx
{pendingCitations.length > 0 && (
  <div className="space-y-2">
    <h4 className="font-medium">Citations</h4>
    <div className="text-sm text-muted-foreground">
      {pendingCitations.length} citation(s) will be attached after submission
    </div>
    {pendingCitations.map((cit, idx) => (
      <div key={idx} className="p-2 border rounded bg-muted text-sm">
        <div className="font-medium">
          {cit.type.toUpperCase()}: {cit.title || cit.value}
        </div>
        {cit.locator && (
          <div className="text-xs text-muted-foreground">
            Locator: {cit.locator}
          </div>
        )}
        {cit.note && (
          <div className="text-xs text-muted-foreground">
            Note: {cit.note}
          </div>
        )}
      </div>
    ))}
  </div>
)}
```

## Implementation Checklist

When adding citation support to a wizard:

- [ ] Import CitationCollector and PendingCitation type
- [ ] Add `pendingCitations` state with useState
- [ ] Add CitationCollector component to Evidence step
- [ ] Update Evidence step props to include pendingCitations and onChange
- [ ] Add citation attachment logic in handleSubmit (after entity creation)
- [ ] Add citation display in Review step
- [ ] Update Review step props to include pendingCitations
- [ ] Test complete flow: add citations → submit → verify in detail panel
- [ ] Add console.log debugging for citation attachment process

## Key Implementation Details

### API Requirements

1. **quote field**: Must be string, not null. Use `citation.quote || ""` when attaching.
2. **targetType**: Must be "claim" or "argument" matching the entity type.
3. **Error handling**: Wrap each citation attachment in try/catch to prevent one failure from blocking others.

### Citation Type Inference

```typescript
let type: "url" | "doi" | "library" = "url";
if (citation.type === "doi") type = "doi";
else if (citation.type === "library") type = "library";
```

### Event Firing

Always fire `citations:changed` event after attaching citations to trigger UI refresh:

```typescript
window.dispatchEvent(
  new CustomEvent("citations:changed", {
    detail: { targetType: "claim", targetId: entityId }
  } as any)
);
```

## Components Using This Pattern

### ✅ Completed
- **AttackArgumentWizard** (`components/argumentation/AttackArgumentWizard.tsx`)
  - Lines 73: pendingCitations state
  - Lines 147-216: Citation attachment logic in handleSubmit
  - Lines 279-286: EvidenceStep with CitationCollector
  - Lines 289-310: ReviewStep citation display

- **ArgumentConstructor** (`components/argumentation/ArgumentConstructor.tsx`)
  - Line 123: pendingCitations state
  - Lines 310-408: Citation attachment logic in handleSubmit
  - Lines 1042-1047: EvidenceCollectionStep with CitationCollector
  - Lines 1202-1219: ReviewSubmitStep citation display

### 🔄 To Be Updated
- **AttackConstructionWizard** (`components/argumentation/AttackConstructionWizard.tsx`)
- **SupportConstructionWizard** (`components/argumentation/SupportConstructionWizard.tsx`)
- **SupportArgumentFlow** (`components/argumentation/SupportArgumentFlow.tsx`)
- Any future argument/attack creation wizards

## Testing Procedure

1. **Add Citations**: Open wizard → navigate to Evidence step → add 1-2 citations (URL + DOI)
2. **Verify Preview**: Continue to Review step → verify citations display correctly
3. **Submit**: Click submit → watch browser console for citation attachment logs
4. **Verify Display**: Navigate to entity detail panel → check Citations/Sources tab
5. **Edge Cases**: Test empty citations, duplicate citations, API errors

## Common Issues & Solutions

### Issue: Citation quote field validation error
**Error**: `{"error":{"fieldErrors":{"quote":["Expected string, received null"]}}}`
**Solution**: Use `quote: citation.quote || ""` instead of `quote: citation.quote`

### Issue: ConflictApplication validation error
**Error**: `"CA requires exactly one conflicting element and one conflicted element"`
**Solution**: Set only ONE conflicted field (either conflictedClaimId OR conflictedArgumentId, not both)

### Issue: Citations don't appear after submission
**Check**: 
1. Console logs - verify attachment completed successfully
2. Database - query Citation table for targetType/targetId
3. Event firing - verify citations:changed event was dispatched
4. Detail panel - check if component subscribes to citations:changed event

## References

- **ATTACK_WIZARD_CITATION_INTEGRATION_STATUS.md** - Full AttackArgumentWizard implementation details
- **CITATION_TRANSFER_FIX_TESTING.md** - Comprehensive testing guide
- **EVIDENCE_CITATION_BRIDGE_IMPLEMENTATION.md** - Future work on EvidenceGuidance integration
- **Unified Citation System** - `app/api/citations/` endpoints

## Version History

- **2025-11-13**: Initial pattern documentation after AttackArgumentWizard and ArgumentConstructor implementation
