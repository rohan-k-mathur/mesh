# Evidence & Citation Infrastructure Audit
**Date:** November 5, 2025  
**Status:** Comprehensive Survey  
**Scope:** Claims, Arguments, AIF, Critical Questions, Propositions

---

## Executive Summary

The Mesh platform has a **dual citation system** that is partially integrated:

1. **New Unified Citation System** (`Citation` + `Source` models) - Modern, flexible, well-architected
2. **Legacy Evidence Systems** (`ClaimCitation`, `ClaimEvidence`, `CardCitation`) - Older, partially orphaned

The new system is **working well for propositions** (thesis editor) but is **not integrated with arguments or claims** in the dialogue/AIF system, creating a fragmented user experience.

---

## 1. Database Schema Analysis

### 1.1 Modern Unified System ✅

**Core Models:**
```prisma
model Source {
  id: string (cuid)
  kind: string  // 'pdf' | 'web' | 'dataset' | 'arxiv' | 'doi'
  url: string?
  doi: string?
  title: string?
  authors: Json?
  platform: string?  // 'arxiv' | 'library' | 'pubmed'
  libraryPostId: string?  // Link to internal library
  fingerprint: string?  // Deduplication
  citations: Citation[]  // Back-relation
}

model Citation {
  id: string (cuid)
  targetType: string  // 'argument' | 'claim' | 'card' | 'comment' | 'move' | 'proposition'
  targetId: string
  sourceId: string  // FK to Source
  locator: string?  // 'p. 13', 'fig. 2', '08:14'
  quote: string?  // Short excerpt (<=280 chars)
  note: string?  // Why relevant
  relevance: Int?  // 1-5 rating
  createdById: string
  createdAt: DateTime
  
  source: Source  // Relation
  
  @@unique([targetType, targetId, sourceId, locator])  // Prevents duplicates
}
```

**Strengths:**
- ✅ Flexible polymorphic design (works with any entity type)
- ✅ Unified source resolution (URL/DOI/Library)
- ✅ Rich metadata (locator, quote, note, relevance)
- ✅ Deduplication via fingerprinting
- ✅ Prevents duplicate citations via unique constraint

**API Endpoints:**
- `/api/citations/resolve` - Create/find Source from URL/DOI/LibraryPost
- `/api/citations/attach` - Attach Source to target entity
- `/api/citations/verify` - Validate URLs
- `/api/citations/format` - CSL formatting
- `/api/citations/batch` - Bulk operations
- `/api/citations/zotero/import` - External import
- `/api/propositions/[id]/citations` - Fetch citations for proposition ✅

**Integration Status:**
- ✅ **Propositions:** Fully integrated (ThesisEditor, PropositionsList, PropositionComposerPro)
- ⚠️ **Comments:** Partially integrated (CommentComposer uses it)
- ❌ **Arguments:** NOT integrated (no API endpoint exists)
- ❌ **Claims:** NOT integrated (old ClaimCitation system used instead)
- ❌ **Cards:** NOT integrated (old CardCitation system used instead)

---

### 1.2 Legacy Evidence Systems ⚠️

#### ClaimCitation (Old System)
```prisma
model ClaimCitation {
  id: string
  claimId: string
  uri: string
  locatorStart: Int?
  locatorEnd: Int?
  excerptHash: string
  snapshotKey: string?
  cslJson: Json?
  note: string?
  claim: Claim
}
```

**Status:** 
- ⚠️ **Underdeveloped** - Single API endpoint exists (`/api/claims/[id]/citations`)
- ⚠️ **No UI integration** - Not used in main claim components
- ⚠️ **Redundant** - Should be migrated to unified Citation system

#### ClaimEvidence (Orphaned)
```prisma
model ClaimEvidence {
  id: string
  claimId: string
  uri: string
  title: string?
  citation: string?  // Unstructured text
  addedById: string?
  createdAt: DateTime
  claim: Claim
}
```

**Status:**
- ❌ **Unused** - No API endpoints
- ❌ **No UI** - Not referenced in components
- ❌ **Deprecated** - Should be removed or migrated

#### CardCitation (Orphaned)
```prisma
model CardCitation {
  id: string (cuid)
  cardId: string
  citation: string  // Unstructured text!
  kind: string?
  createdAt: DateTime
  card: DeliberationCard
}
```

**Status:**
- ❌ **Unused** - No API endpoints
- ❌ **Unstructured** - Just a text string, no rich metadata
- ❌ **Should be removed** - Cards are deprecated in favor of claims/arguments

---

## 2. UI Component Analysis

### 2.1 Citation Collection Components ✅

**CitationCollector** (`components/citations/CitationCollector.tsx`)
- ✅ Modern React component for adding citations before entity creation
- ✅ Supports URL, DOI, Library sources
- ✅ Used in: PropositionComposerPro ✅
- ❌ NOT used in: AIFArgumentWithSchemeComposer
- ❌ NOT used in: Claim creation flows

**CitePickerInlinePro** (`components/citations/CitePickerInlinePro.tsx`)
- ✅ Inline citation picker with tabs (URL/DOI/Library)
- ✅ Properly calls `/api/citations/resolve` and `/api/citations/attach`
- ✅ Fires `citations:changed` event for live updates
- ⚠️ Generic component but not widely adopted

**CitePickerModal** (`components/citations/CitePickerModal.tsx`)
- ✅ Modal version of citation picker
- ⚠️ Usage unclear - may be deprecated

**LibrarySearchModal** (`components/citations/LibrarySearchModal.tsx`)
- ✅ Allows browsing internal library for citations
- ✅ Used by CitePickerInlinePro

**SourcesSidebar** (`components/citations/SourcesSidebar.tsx`)
- ✅ Displays attached sources/citations
- ⚠️ Integration unknown

---

### 2.2 Evidence Display Components

**ClaimConfidence** (`components/evidence/ClaimConfidence.tsx`)
- ✅ Displays evidential support score for claims
- ✅ Calls `/api/evidential/score`
- ✅ Shows support bar with belief scores
- ⚠️ **Different from citations** - This is computed from argument structure, not external sources

**SupportBar** (`components/evidence/SupportBar.tsx`)
- ✅ Visual bar for support levels
- ✅ Used by ClaimConfidence

**DiagramView** (`components/map/DiagramView.tsx`)
- ✅ Has evidence field in diagram type
- ⚠️ Evidence is just `{ id, uri, note }[]` - not using unified Citation system
- ⚠️ Static mockup, not connected to real data

---

### 2.3 Critical Question Evidence System ⚠️

**CQResponse Model:**
```prisma
model CQResponse {
  groundsText: string  // Response text
  evidenceClaimIds: string[]  // Claims as evidence ✅
  sourceUrls: string[]  // External citations ⚠️
  // ...
}
```

**CQResponseForm** (`components/claims/CQResponseForm.tsx`)
- ✅ Allows adding evidence claim IDs
- ⚠️ Uses simple string arrays for source URLs (not unified Citation system)
- ⚠️ No rich metadata (locator, quote, note)
- ⚠️ Should integrate with CitationCollector

**Status:** 
- ⚠️ **Partially functional** - Can link claims as evidence
- ❌ **Not using unified citations** - Just stores URLs as strings
- ❌ **Missing UI** - No citation display in CQ responses

---

## 3. Integration Gaps

### 3.1 Arguments (AIF System) ❌

**Current State:**
```prisma
model Argument {
  sources: Json?  // Unstructured! Just raw JSON
  // NO Citation relation
}
```

**Problems:**
- ❌ No Citation relation in schema
- ❌ No API endpoint for `/api/arguments/[id]/citations`
- ❌ AIFArgumentWithSchemeComposer doesn't use CitationCollector
- ❌ ArgumentCardV2 doesn't display citations
- ❌ Sources are unstructured JSON (if used at all)

**Recommendation:** 
Add Citation support to arguments (highest priority for Phase 1)

---

### 3.2 Claims ❌

**Current State:**
```prisma
model Claim {
  citations: ClaimCitation[]  // Old system
  ClaimEvidence: ClaimEvidence[]  // Unused
  // NO relation to unified Citation model
}
```

**Problems:**
- ❌ Using old ClaimCitation model instead of unified Citation
- ❌ No rich metadata (locator, quote, relevance)
- ❌ No UI for adding/displaying citations on claims
- ❌ ClaimEvidence model is orphaned

**Recommendation:**
Migrate claims to unified Citation system

---

### 3.3 Critical Questions ⚠️

**Current State:**
```prisma
model CQResponse {
  evidenceClaimIds: string[]  // Good! ✅
  sourceUrls: string[]  // Bad - not structured ❌
}
```

**Problems:**
- ⚠️ Uses string arrays for URLs instead of Citation objects
- ❌ No locator, quote, or note support
- ❌ No display of citations in CQ UI
- ❌ No CitationCollector integration

**Recommendation:**
Replace `sourceUrls` with proper Citation relation

---

## 4. API Endpoint Coverage

| Entity       | Create Citation | List Citations | Delete Citation | Status |
|--------------|-----------------|----------------|-----------------|--------|
| Proposition  | ✅ Via attach   | ✅ GET /[id]/citations | ✅ Via /citations/[id] | **Complete** |
| Comment      | ✅ Via attach   | ❓ Unknown     | ❓ Unknown      | **Partial** |
| Argument     | ❌ Missing      | ❌ Missing     | ❌ Missing      | **None** |
| Claim        | ⚠️ Old system   | ⚠️ Old system  | ❌ Missing      | **Legacy** |
| Card         | ❌ Deprecated   | ❌ Deprecated  | ❌ Deprecated   | **Deprecated** |
| Move         | ❓ Unknown      | ❓ Unknown     | ❓ Unknown      | **Unknown** |
| CQResponse   | ❌ String array | ❌ N/A         | ❌ N/A          | **Needs work** |

---

## 5. What's Working Well ✅

1. **Proposition Citations**
   - Complete end-to-end integration
   - PropositionComposerPro → CitationCollector → /api/citations/attach
   - Display in ThesisEditor, PropositionsList, Thesis View
   - Rich metadata (locator, quote, note)
   - Live updates via events

2. **Source Resolution**
   - `/api/citations/resolve` handles URL/DOI/Library
   - Proper deduplication via fingerprinting
   - CSL formatting support

3. **UI Components**
   - CitationCollector is well-designed
   - CitePickerInlinePro is flexible
   - Clean separation of concerns

4. **Schema Design**
   - Polymorphic Citation model is excellent
   - Source model captures rich metadata
   - Proper relations and constraints

---

## 6. What Needs Work ❌

### 6.1 High Priority

1. **Add Citation Support to Arguments**
   - Create `/api/arguments/[id]/citations` endpoint
   - Add CitationCollector to AIFArgumentWithSchemeComposer
   - Display citations in ArgumentCardV2
   - Add Citation relation to Argument schema (or use polymorphic targetType)

2. **Migrate Claims to Unified System**
   - Replace ClaimCitation with unified Citation
   - Create proper API endpoints
   - Update ClaimComposer to use CitationCollector
   - Display citations in claim views

3. **Integrate Citations with Critical Questions**
   - Replace `sourceUrls: string[]` with proper Citation relation in CQResponse
   - Add CitationCollector to CQResponseForm
   - Display citations in CQ response views
   - Support evidence chains (claim → citations)

### 6.2 Medium Priority

4. **Cleanup Legacy Systems**
   - Remove ClaimEvidence model (unused)
   - Remove CardCitation model (deprecated)
   - Migrate any existing ClaimCitation data to unified system
   - Remove orphaned API endpoints

5. **Add Citation Display to Argument Views**
   - ArgumentCardV2 should show attached citations
   - AIFArgumentsListPro should show citation indicators
   - Agora/DebateView should display citations
   - ArgumentPopout should include citations section

6. **Enhance CQ Evidence Display**
   - Show evidence claims with their citations
   - Display citation chains (CQ → evidence claims → their citations)
   - Add citation count badges
   - Enable inline citation preview

### 6.3 Low Priority

7. **Citation Analytics**
   - Track most-cited sources
   - Identify under-cited arguments/claims
   - Citation network visualization
   - Source quality indicators

8. **Citation Import/Export**
   - BibTeX import
   - Zotero sync (already started)
   - RIS format support
   - Citation export for entire deliberations

9. **Advanced Features**
   - Citation validation (broken link detection)
   - Automatic source metadata enrichment
   - Collaborative citation editing
   - Citation templates by discipline

---

## 7. Architecture Recommendations

### 7.1 Unified Citation Pattern

**All entities should follow this pattern:**

```typescript
// 1. Composer includes CitationCollector
const [pendingCitations, setPendingCitations] = useState<PendingCitation[]>([]);

// 2. Create entity first
const res = await fetch('/api/entities', { 
  method: 'POST', 
  body: JSON.stringify({ text, ...}) 
});
const entity = await res.json();

// 3. Attach citations after creation
await Promise.all(
  pendingCitations.map(citation => 
    attachCitation({ 
      targetType: 'argument',  // or 'claim', etc.
      targetId: entity.id, 
      citation 
    })
  )
);

// 4. Fire event for live updates
window.dispatchEvent(new CustomEvent('citations:changed', { 
  detail: { targetType, targetId } 
}));
```

### 7.2 Standard API Endpoints

**Every citable entity should have:**

```typescript
// Get citations
GET /api/{entities}/[id]/citations
→ { ok: true, citations: Citation[] }

// Citations are created via unified endpoint
POST /api/citations/attach
{
  targetType: 'argument',
  targetId: string,
  sourceId: string,  // from /api/citations/resolve
  locator?, quote?, note?, relevance?
}

// Delete citation
DELETE /api/citations/[id]
```

### 7.3 Standard UI Pattern

**Every entity view should:**

1. **Fetch citations** on mount or via SWR
2. **Display citation badges** (count indicator)
3. **Show citation list** (expandable section)
4. **Link to sources** (external URLs)
5. **Listen for events** (`citations:changed`)

Example:
```tsx
function ArgumentView({ argumentId }) {
  const [citations, setCitations] = useState([]);
  
  useEffect(() => {
    fetch(`/api/arguments/${argumentId}/citations`)
      .then(r => r.json())
      .then(data => setCitations(data.citations));
      
    const handler = (e: CustomEvent) => {
      if (e.detail.targetId === argumentId) refetch();
    };
    window.addEventListener('citations:changed', handler);
    return () => window.removeEventListener('citations:changed', handler);
  }, [argumentId]);
  
  return (
    <>
      {citations.length > 0 && (
        <CitationBadge count={citations.length} />
      )}
      <CitationsList citations={citations} />
    </>
  );
}
```

---

## 8. Migration Plan

### Phase 1: Arguments (Critical)
1. Add Citation support to Argument model (use polymorphic targetType)
2. Create `/api/arguments/[id]/citations` endpoint
3. Add CitationCollector to AIFArgumentWithSchemeComposer
4. Display citations in ArgumentCardV2
5. Add citation indicators to AIFArgumentsListPro

### Phase 2: Claims
1. Create `/api/claims/[id]/citations` endpoint (unified system)
2. Add CitationCollector to claim creation flows
3. Migrate existing ClaimCitation data
4. Remove ClaimCitation model
5. Update claim display components

### Phase 3: Critical Questions
1. Update CQResponse schema: add Citation relation
2. Replace sourceUrls with proper citations
3. Add CitationCollector to CQResponseForm
4. Display citations in CQ views
5. Support evidence chains

### Phase 4: Cleanup
1. Remove ClaimEvidence model
2. Remove CardCitation model
3. Update documentation
4. Add tests for all citation flows

---

## 9. Coherence Assessment

### System Coherence: 6/10

**Strengths:**
- ✅ Modern Citation/Source models are well-designed
- ✅ Proposition integration is exemplary
- ✅ Citation collection components are reusable
- ✅ Event-driven architecture for live updates

**Weaknesses:**
- ❌ Fragmented across old and new systems
- ❌ Arguments (core AIF entity) lack citation support
- ❌ Claims use outdated models
- ❌ CQs use string arrays instead of structured citations
- ❌ Inconsistent patterns across entity types

### Harmony with Project: 7/10

**Aligned:**
- ✅ Supports evidence-based argumentation (core mission)
- ✅ Integrates with library system
- ✅ Enables thesis writing with citations
- ✅ Polymorphic design fits platform architecture

**Misaligned:**
- ❌ AIF argumentation layer lacks citations (ironic!)
- ❌ Critical questions (argumentation theory) use primitive evidence
- ❌ Dialogue/debate views don't show citation support
- ❌ Grounded semantics can't consider citation quality

---

## 10. Improvement Opportunities

### 10.1 Quick Wins (1-2 weeks)

1. **Add citations to arguments**
   - Most impactful improvement
   - Enables evidence-based argument evaluation
   - Required for serious academic use

2. **Integrate CitationCollector with AIFArgumentWithSchemeComposer**
   - Reuse existing, proven component
   - Immediate UI improvement
   - Low technical risk

3. **Create missing API endpoints**
   - `/api/arguments/[id]/citations`
   - `/api/claims/[id]/citations` (unified)
   - Follow existing pattern from propositions

### 10.2 Medium Wins (2-4 weeks)

4. **Migrate claims to unified system**
   - Consolidate citation infrastructure
   - Improve data consistency
   - Enable cross-entity citation queries

5. **Add citation display to all argument views**
   - ArgumentCardV2
   - AIFArgumentsListPro
   - DebateSheetReader
   - ArgumentPopout

6. **Enhance CQ citation support**
   - Structured citations instead of URL strings
   - Evidence chain visualization
   - Citation quality indicators

### 10.3 Strategic Wins (1-2 months)

7. **Citation-aware argumentation evaluation**
   - Factor citation quality into confidence scores
   - Detect unsupported claims
   - Suggest citation opportunities

8. **Citation network analysis**
   - Show which sources support multiple arguments
   - Identify key sources in deliberation
   - Detect citation clusters

9. **Collaborative citation management**
   - Suggest citations from library
   - Auto-complete from previous citations
   - Citation quality voting

---

## 11. Conclusion

The Mesh platform has a **solid foundation** for citation management with the unified `Citation`/`Source` system, but it is **severely underutilized**. The proposition integration demonstrates what's possible, but the **core argumentation layer (arguments, claims, CQs) lacks proper citation support**, creating a **fundamental gap** in the platform's evidence management.

### Critical Path Forward:

1. **Extend citations to arguments** (highest impact)
2. **Migrate claims to unified system** (consistency)
3. **Integrate with critical questions** (argumentation theory alignment)
4. **Remove legacy systems** (reduce technical debt)

This will create a **coherent, harmonious evidence infrastructure** that supports the platform's mission of structured, evidence-based deliberation.

---

## Appendix: Code Examples

### Example: Add Citation to Argument

```typescript
// API Route: /api/arguments/[id]/citations/route.ts
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const argumentId = params.id;
  
  const citations = await prisma.citation.findMany({
    where: {
      targetType: "argument",
      targetId: argumentId,
    },
    include: {
      source: {
        select: {
          id: true,
          url: true,
          title: true,
          authors: true,
          platform: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  
  return NextResponse.json({ ok: true, citations });
}
```

### Example: ArgumentCardV2 with Citations

```tsx
function ArgumentCardV2({ argument }) {
  const [citations, setCitations] = useState([]);
  
  useEffect(() => {
    fetch(`/api/arguments/${argument.id}/citations`)
      .then(r => r.json())
      .then(data => setCitations(data.citations || []));
  }, [argument.id]);
  
  return (
    <div className="argument-card">
      <div className="argument-text">{argument.text}</div>
      
      {citations.length > 0 && (
        <div className="citations-section">
          <h4>Sources ({citations.length})</h4>
          {citations.map(citation => (
            <div key={citation.id} className="citation">
              <a href={citation.source.url} target="_blank">
                {citation.source.title || citation.source.url}
              </a>
              {citation.locator && <span> ({citation.locator})</span>}
              {citation.quote && <blockquote>{citation.quote}</blockquote>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

**End of Audit**
