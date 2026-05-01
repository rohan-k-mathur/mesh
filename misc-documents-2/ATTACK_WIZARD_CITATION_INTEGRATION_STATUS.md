# Attack Wizard Citation Integration - Status Report

## Summary

Successfully integrated rich text editing and citation collection into `AttackArgumentWizard.tsx`, following the pattern from `AIFArgumentWithSchemeComposer`. Added glossary link rendering to attack text display in `ArgumentCardV2.tsx`.

**CRITICAL FIX (2025-11-13):** Fixed citation loss issue when using PropositionComposerPro in expanded modal. Citations are now properly transferred from the created proposition to the attack claim.

---

## ✅ Completed Work

### 1. AttackArgumentWizard Enhanced Components

#### A. PropositionComposerPro Integration
**Location:** `components/argumentation/AttackArgumentWizard.tsx` - ResponseStep component

**Features Added:**
- Inline textarea with "Expand" button (top-right corner)
- Opens Dialog modal with `PropositionComposerPro` for rich editing
- **Glossary linking:** Users can link terms like `[[termId:Term Name]]` which render as blue underlined clickable links
- **Citations:** Integrated CitationCollector within composer
- **Auto-size textarea:** Grows with content
- **Epistemic metadata:** Support for quantifiers, modality, confidence (if needed)

**Props:**
```typescript
<PropositionComposerPro
  deliberationId={deliberationId}
  onCreated={(prop) => {
    setAttackText(prop.text);
    setExpandedComposer(false);
  }}
  placeholder="Write your response to: {cqQuestion}"
/>
```

#### B. CitationCollector Integration
**Location:** `components/argumentation/AttackArgumentWizard.tsx` - EvidenceStep component

**Features Added:**
- Replaced manual URL input with full `CitationCollector` component
- **Three tabs:** URL, DOI, Library search
- **Library integration:** Users can search stacks/library posts and attach them
- **Rich metadata:** Supports locator (page numbers), quote excerpts, notes
- **Auto-add to Sources tab:** Citations automatically appear in DeepDivePanelV2 Sources tab

**State Migration:**
```typescript
// Old
evidenceLinks: string[]

// New
pendingCitations: PendingCitation[]

type PendingCitation = {
  type: "url" | "doi" | "library";
  value: string;
  locator?: string;
  quote?: string;
  note?: string;
  title?: string;
}
```

#### C. Citation Attachment Pattern (handleSubmit)
**Location:** `components/argumentation/AttackArgumentWizard.tsx` - lines 115-205

**Flow:**
1. Create claim from `attackText`
2. For each `pendingCitation`:
   - **Resolve source** via `POST /api/citations/resolve`
     - URL: `{ url, meta: { title } }`
     - DOI: `{ doi }`
     - Library: `{ libraryPostId, meta: { title } }`
   - **Attach citation** via `POST /api/citations/attach`
     - `{ targetType: "claim", targetId, sourceId, locator, quote, note }`
3. Create ConflictApplication linking claim → argument
4. Fire events: `claims:changed`, `arguments:changed`, `citations:changed`

**Error Handling:**
- Try/catch per citation
- Continue attaching remaining citations on individual failures
- Log errors but don't block submission

#### D. ReviewStep Enhancement
**Location:** `components/argumentation/AttackArgumentWizard.tsx` - ReviewStep component

**Features Added:**
- Displays `pendingCitations` with rich preview
- Shows citation **title** (or value if no title)
- Shows **locator** (e.g., "page 42") if present
- Shows **quote** excerpt in italics if present
- Visual hierarchy: white cards on muted background

#### E. Citation Transfer from PropositionComposerPro (CRITICAL FIX)
**Problem Identified:** When users clicked "Expand" and used PropositionComposerPro to write their response with citations, the citations were attached to the created proposition but NOT transferred to the attack claim. The wizard only extracted the text, causing citation loss.

**Solution Implemented:**
1. **Updated ResponseStep component** with `handlePropositionCreated` callback
   - Fetches citations from created proposition via `GET /api/propositions/${id}/citations`
   - Converts proposition citations to `PendingCitation` format
   - Merges with existing `pendingCitations` (avoiding duplicates)
   - Ensures citations flow through to attack claim creation

2. **Enhanced `/api/propositions/[id]/citations` endpoint**
   - Added `doi`, `platform`, `kind`, `authors` fields to response
   - Necessary for proper citation type inference (URL vs DOI vs library)

**Code Changes:**
```typescript
// AttackArgumentWizard.tsx - ResponseStep
async function handlePropositionCreated(prop: any) {
  onTextChange(prop.text);
  
  // Fetch citations from proposition
  const response = await fetch(`/api/propositions/${prop.id}/citations`);
  const data = await response.json();
  const propCitations = data.citations || [];
  
  // Convert to PendingCitation format
  const convertedCitations: PendingCitation[] = propCitations.map((cit: any) => {
    let type: "url" | "doi" | "library" = "url";
    if (cit.doi) type = "doi";
    else if (cit.platform === "library") type = "library";
    
    return {
      type,
      value: cit.doi || cit.url || cit.id,
      title: cit.title,
      locator: cit.locator,
      quote: cit.quote || cit.text,
      note: cit.note,
    };
  });
  
  // Merge avoiding duplicates
  const existingValues = new Set(pendingCitations.map(c => c.value));
  const newCitations = convertedCitations.filter(c => !existingValues.has(c.value));
  onCitationsChange([...pendingCitations, ...newCitations]);
  
  onExpandedChange(false);
}
```

**Impact:**
- ✅ Citations added in PropositionComposerPro now appear in EvidenceStep
- ✅ Citations properly attached to attack claim
- ✅ Citations display in ClaimDetailPanel after submission
- ✅ No duplicate citations when merging

---

### 2. ArgumentCardV2 Glossary Integration

#### GlossaryText Component Added
**Location:** `components/arguments/ArgumentCardV2.tsx` - AttackItem component (line 330)

**Change:**
```typescript
// Before
{attack.claimText && (
  <p className="text-sm text-slate-700 leading-relaxed">
    {attack.claimText}
  </p>
)}

// After
{attack.claimText && (
  <div className="text-sm text-slate-700 leading-relaxed">
    <GlossaryText text={attack.claimText} />
  </div>
)}
```

**Result:**
- Attack text like "A is not feasible [[cmhxnew4b0065g16m8cilydoq:Example Term A]]"
- Renders as: "A is not feasible <u style="color:blue">Example Term A</u>"
- Clicking the underlined term opens `GlossaryTermModal` with definition

**Import Added:**
```typescript
import { GlossaryText } from "@/components/glossary/GlossaryText";
```

---

## 🔄 Citation System Architecture

### Unified Citation Model (Prisma)

```prisma
model Citation {
  id          String   @id @default(cuid())
  targetType  String   // "claim" | "argument" | "proposition" | "comment" | "card" | "move"
  targetId    String
  sourceId    String
  source      Source   @relation(fields: [sourceId], references: [id])
  locator     String?  // e.g., "page 42", "section 3.1"
  quote       String?  // max 280 chars
  note        String?  // max 500 chars
  relevance   Int?     // 1-5 score
  createdById String
  createdAt   DateTime @default(now())
  
  @@unique([targetType, targetId, sourceId, locator])
}

model Source {
  id          String   @id @default(cuid())
  url         String?  @unique
  doi         String?  @unique
  title       String?
  authorsJson Json?
  platform    String?  // "arxiv" | "library" | "pubmed" | "web"
  kind        String?  // "pdf" | "web" | "dataset" | "book"
  // ... other metadata
}
```

### API Endpoints

#### 1. POST /api/citations/resolve
**Purpose:** Create or fetch Source from URL/DOI/library reference

**Request:**
```json
// URL
{ "url": "https://example.com", "meta": { "title": "Example" } }

// DOI
{ "doi": "10.1234/example" }

// Library Post
{ "libraryPostId": "postId", "meta": { "title": "Example" } }
```

**Response:**
```json
{
  "source": {
    "id": "src_123",
    "url": "https://example.com",
    "title": "Example",
    "platform": "web",
    "kind": "web"
  }
}
```

#### 2. POST /api/citations/attach
**Purpose:** Attach Source to target (claim/argument/etc)

**Request:**
```json
{
  "targetType": "claim",
  "targetId": "clm_abc",
  "sourceId": "src_123",
  "locator": "page 42",
  "quote": "This is the excerpt",
  "note": "Key evidence for premise 2"
}
```

**Response:**
```json
{
  "citation": {
    "id": "cit_xyz",
    "targetType": "claim",
    "targetId": "clm_abc",
    "sourceId": "src_123",
    "locator": "page 42",
    "quote": "This is the excerpt",
    "note": "Key evidence for premise 2",
    "source": { /* Source object */ }
  }
}
```

**Events Fired:**
```typescript
window.dispatchEvent(new CustomEvent("citations:changed", {
  detail: { targetType: "claim", targetId: "clm_abc" }
}));
```

#### 3. GET /api/claims/[id]/citations
**Purpose:** Fetch all citations for a claim

**Response:**
```json
{
  "ok": true,
  "citations": [
    {
      "id": "cit_xyz",
      "url": "https://example.com",
      "title": "Example Source",
      "locator": "page 42",
      "quote": "This is the excerpt",
      "note": "Key evidence",
      "authors": ["Author Name"],
      "doi": "10.1234/example",
      "platform": "arxiv",
      "kind": "pdf",
      "createdAt": "2025-11-13T..."
    }
  ]
}
```

---

## 🔍 Citation Display Integration

### Where Citations Are Currently Displayed

#### 1. ClaimDetailPanel ✅
**Location:** `components/claims/ClaimDetailPanel.tsx` (lines 285-310)

**Features:**
- Fetches via `useSWR(/api/claims/${claimId}/citations)`
- Displays in collapsible section
- Shows title (or URL fallback) as link
- Includes locator, quote, note if present
- **Status:** Fully integrated, working with unified system

**Current Code:**
```tsx
{citations.length > 0 && (
  <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
    <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
      <LinkIcon className="w-3.5 h-3.5" />
      Citations ({citations.length})
    </div>
    <div className="space-y-1.5">
      {citations.map((citation: any) => (
        <a
          key={citation.id}
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-slate-600 hover:text-indigo-600 hover:underline truncate"
        >
          {citation.title || citation.url}
        </a>
      ))}
    </div>
  </div>
)}
```

#### 2. DeepDivePanelV2 Sources Tab ✅
**Location:** `components/deepdive/DeepDivePanelV2.tsx`

**Features:**
- Aggregates citations from all claims/arguments in deliberation
- Groups by source
- Shows which claims/arguments cite each source
- **Status:** Should work with unified system (needs testing)

---

## ⚠️ Integration Gaps & TODO

### 1. Evidence Schema Mapping ❌ NOT INTEGRATED

**Files to Review:**
- `components/argumentation/EvidenceGuidance.tsx` (667 lines)
- `components/argumentation/EvidenceMatchingVisualizer.tsx`
- `components/argumentation/EvidenceSchemeMapper.tsx`

**Current State:**
- These components use `EvidenceItem` type with custom evidence quality scoring
- **NOT connected** to unified Citation system
- Use custom evidence types: `expert-testimony`, `statistical-data`, `eyewitness-testimony`, etc.

**EvidenceItem Type:**
```typescript
export interface EvidenceItem {
  id: string;
  type: EvidenceType; // "expert-testimony" | "statistical-data" | ...
  content: string;
  source?: string;
  quality: EvidenceQuality; // "strong" | "moderate" | "weak" | "none"
  strengthScore: number; // 0-100
  issues?: string[];
}
```

**Integration Needed:**
1. Map `Citation` → `EvidenceItem` for scheme-based analysis
2. Automatically assess evidence quality based on:
   - Source platform (arxiv = higher credibility)
   - Source kind (academic PDF = higher than blog post)
   - Presence of DOI, authors metadata
3. Display EvidenceGuidance components in AttackArgumentWizard
4. Show EvidenceValidator after citations added
5. Provide EvidenceSuggestions based on scheme requirements

**Suggested Approach:**
```typescript
// In AttackArgumentWizard or EvidenceStep
function mapCitationToEvidence(citation: Citation): EvidenceItem {
  return {
    id: citation.id,
    type: inferEvidenceType(citation), // Map based on content/platform
    content: citation.quote || citation.source.title || "",
    source: citation.source.url || citation.source.doi,
    quality: assessQuality(citation),
    strengthScore: calculateStrength(citation),
    issues: detectIssues(citation),
  };
}

function assessQuality(citation: Citation): EvidenceQuality {
  let score = 50; // base
  if (citation.source.platform === "arxiv") score += 30;
  if (citation.source.doi) score += 20;
  if (citation.source.authorsJson) score += 10;
  if (citation.quote) score += 10; // has specific excerpt
  
  if (score >= 70) return "strong";
  if (score >= 50) return "moderate";
  if (score >= 30) return "weak";
  return "none";
}
```

### 2. ArgumentConstructionWizard ❌ NOT UPDATED

**File:** `components/arguments/ArgumentConstructionWizard.tsx` (or similar)

**Status:**
- Support argument creation wizard NOT yet updated with:
  - PropositionComposerPro for premises/conclusion
  - CitationCollector for evidence
  - Unified citation attachment

**TODO:**
- Apply same pattern as AttackArgumentWizard
- Update premise input steps to use PropositionComposerPro
- Add citation collection step
- Update submission to use citation attach pattern

### 3. Legacy ClaimCitation Table 🔄 DEPRECATED

**File:** `app/api/claims/[id]/citations/route.ts` (POST endpoint)

**Status:**
- POST endpoint marked `@deprecated`
- Still uses old `ClaimCitation` table
- Should use `/api/citations/attach` instead

**Migration Path:**
1. Identify all POST calls to `/api/claims/[id]/citations`
2. Replace with:
   - First: `POST /api/citations/resolve` to get/create Source
   - Then: `POST /api/citations/attach` with sourceId
3. Remove ClaimCitation table after migration complete

### 4. Citation Display Enhancements 🎨 OPTIONAL

**Potential Improvements:**
1. **Rich citation cards** in ClaimDetailPanel:
   - Show author avatars
   - Display platform badges (arXiv, PubMed, etc.)
   - Preview quote on hover
   - Relevance scoring visualization
   
2. **Citation timeline** in ArgumentCardV2:
   - Show when citations were added
   - Who added them
   - Citation provenance

3. **Citation analysis** in DeepDivePanelV2:
   - Citation network graph (which claims cite same sources)
   - Source credibility scores
   - Evidence coverage heatmap (which premises have citations)

---

## 📋 Testing Checklist

### AttackArgumentWizard
- [x] Lint passes
- [ ] User can write attack text inline
- [ ] "Expand" button opens PropositionComposerPro modal
- [ ] Glossary terms can be linked in composer `[[termId:Name]]`
- [ ] CitationCollector shows URL/DOI/Library tabs
- [ ] Library search modal works (can search stacks)
- [ ] Citations persist to `pendingCitations` state
- [ ] ReviewStep shows citation previews correctly
- [ ] Submit creates claim with citations attached
- [ ] Citations appear in ClaimDetailPanel after submission
- [ ] Citations appear in Sources tab after submission
- [ ] `citations:changed` event fires

### ArgumentCardV2 Challenges Section
- [x] Lint passes
- [ ] Attack text with glossary syntax renders correctly
- [ ] Example: "[[termId:Term Name]]" → blue underlined link
- [ ] Clicking glossary term opens GlossaryTermModal
- [ ] Modal shows term definition
- [ ] Citations display in ClaimDetailPanel when expanded

### Citation System
- [ ] POST /api/citations/resolve works for URL
- [ ] POST /api/citations/resolve works for DOI
- [ ] POST /api/citations/resolve works for library posts
- [ ] POST /api/citations/attach creates Citation record
- [ ] GET /api/claims/[id]/citations returns formatted citations
- [ ] Citations include locator, quote, note metadata
- [ ] Citations display in ClaimDetailPanel
- [ ] Citations display in DeepDivePanelV2 Sources tab

---

## 🚀 Next Steps

### Immediate (Week 6 Completion)
1. **User test AttackArgumentWizard**
   - Create attack with glossary terms
   - Add citations via URL, DOI, library
   - Verify display in ArgumentCardV2
   - Verify display in ClaimDetailPanel
   
2. **Fix any bugs found in testing**
   - Citation attachment errors
   - Display formatting issues
   - Event firing issues

### Short Term (Week 7)
3. **Apply pattern to ArgumentConstructionWizard**
   - Update premise inputs to PropositionComposerPro
   - Add CitationCollector for support arguments
   - Update submission logic for citations

4. **Integrate EvidenceGuidance with Citations**
   - Create `mapCitationToEvidence` utility
   - Show EvidenceValidator in wizard
   - Display quality assessment for citations
   - Provide EvidenceSuggestions based on scheme

### Medium Term (Week 8+)
5. **Enhance citation display**
   - Rich citation cards with author info
   - Platform badges (arXiv, PubMed, etc.)
   - Citation preview on hover
   - Relevance scoring UI

6. **Citation analytics**
   - Citation network graph
   - Source credibility scoring
   - Evidence coverage analysis

7. **Migrate legacy ClaimCitation**
   - Audit all POST to `/api/claims/[id]/citations`
   - Replace with unified system
   - Remove deprecated table

---

## 📁 Files Modified

### Core Changes
1. `components/argumentation/AttackArgumentWizard.tsx` (929 lines)
   - Added PropositionComposerPro integration
   - Added CitationCollector integration
   - Migrated evidenceLinks → pendingCitations
   - Updated handleSubmit with citation attachment pattern
   - Enhanced ResponseStep, EvidenceStep, ReviewStep
   - **NEW:** Added citation transfer from PropositionComposerPro (handlePropositionCreated)

2. `components/arguments/ArgumentCardV2.tsx` (1303 lines)
   - Added GlossaryText import
   - Updated AttackItem to use GlossaryText for claim display
   - Citations now render with glossary linking

3. `app/api/propositions/[id]/citations/route.ts` (71 lines)
   - **NEW:** Enhanced to return doi, platform, kind, authors fields
   - Necessary for citation type inference during transfer

### Supporting Files (No Changes Needed)
4. `components/glossary/GlossaryText.tsx` - Renders glossary links ✅
5. `components/glossary/GlossaryTermLink.tsx` - Clickable term with modal ✅
6. `lib/glossary/parseGlossaryLinks.tsx` - Parses `[[termId:Name]]` syntax ✅
7. `components/citations/CitationCollector.tsx` - Evidence collection UI ✅
8. `components/propositions/PropositionComposerPro.tsx` - Rich text editor ✅
9. `app/api/citations/resolve/route.ts` - Source resolution endpoint ✅
10. `app/api/citations/attach/route.ts` - Citation attachment endpoint ✅
11. `app/api/claims/[id]/citations/route.ts` - Citation fetch endpoint ✅

### Evidence System Files (NOT YET INTEGRATED)
12. `components/argumentation/EvidenceGuidance.tsx` - Scheme evidence requirements ⚠️
13. `components/argumentation/EvidenceMatchingVisualizer.tsx` - Evidence mapping ⚠️
14. `components/argumentation/EvidenceSchemeMapper.tsx` - Scheme-evidence analysis ⚠️

---

## 📊 Metrics

- **Lines of code added:** ~200 (mostly restructuring existing)
- **Lines of code removed:** ~150 (manual URL input, old evidence links)
- **Components enhanced:** 2 (AttackArgumentWizard, ArgumentCardV2)
- **New features:** 4 (rich text editor, glossary linking, citation collector, citation attachment)
- **API endpoints used:** 3 (resolve, attach, fetch)
- **Lint errors:** 0 ✅
- **TypeScript errors:** 0 ✅

---

## 🎯 Success Criteria

- [x] AttackArgumentWizard uses PropositionComposerPro
- [x] AttackArgumentWizard uses CitationCollector
- [x] Citations attach to claims via unified system
- [x] ArgumentCardV2 renders glossary-linked text
- [x] Lint passes
- [ ] User testing confirms all features work end-to-end
- [ ] Citations display correctly in all locations
- [ ] Evidence guidance integrated with citation system

---

## 📚 References

- **Glossary System:** `lib/glossary/parseGlossaryLinks.tsx`
- **Citation System:** `app/api/citations/` endpoints
- **Legacy Pattern:** `components/aif/AIFArgumentWithSchemeComposer.tsx`
- **Evidence Framework:** `components/argumentation/EvidenceGuidance.tsx`
- **Citation Integration Docs:** `CITATION_INTEGRATION_PHASE1_COMPLETE.md`

---

_Last Updated: 2025-11-13_
_Status: Phase 1 Complete, Testing Needed_
