# Thesis Enhancement Roadmap

**Date:** November 5, 2025  
**Status:** Planning Phase  
**Goal:** Integrate rich deliberation objects into the thesis composition system

---

## Executive Summary

The thesis system currently has two solid composition approaches (structured prongs and rich-text editing), but doesn't fully leverage the sophisticated deliberation infrastructure available in the platform. This roadmap outlines how to enhance thesis composition by integrating:

- **Argument schemes** with formal structures and critical questions
- **Semantic analysis** (grounded semantics labels)
- **Evidence provenance** and citation tracking
- **Dialogue history** and commitment stores
- **Cross-deliberation references** via functors
- **Interactive visualizations** (Toulmin diagrams, AIF graphs)

---

## Current Architecture Analysis

### Composition Approaches

#### 1. ThesisComposer (Structured Legal-Style)
**File:** `components/thesis/ThesisComposer.tsx`

**Current Capabilities:**
- **Prongs** with roles (SUPPORT/REBUT/PREEMPT)
- Each prong has a main claim and ordered arguments
- Argument roles: PREMISE, INFERENCE, COUNTER_RESPONSE
- **Prose sections** for introductions, background, conclusions
- Metadata: title, abstract, template (LEGAL_DEFENSE, POLICY_CASE, ACADEMIC_THESIS, GENERAL)
- Main thesis claim linking
- Reorderable prongs and sections

**Data Structure:**
```typescript
Thesis {
  id, slug, title, abstract, status, template
  thesisClaim?: Claim
  prongs: Prong[] {
    title, role, order, mainClaim
    introduction?, conclusion?
    arguments: { argument, role, order }[]
  }
  sections: ThesisSection[] {
    sectionType, title, content, order
  }
}
```

#### 2. ThesisEditor (Rich Text WYSIWYG)
**File:** `components/thesis/ThesisEditor.tsx`

**Current Capabilities:**
- TipTap editor with custom node types
- **ClaimNode** - inline claim references
- **ArgumentNode** - inline argument cards
- **CitationNode** - citations (placeholder)
- **TheoryWorkNode** - theory references (placeholder)
- Auto-save with debouncing
- Character/word count tracking
- Toolbar for inserting deliberation objects

**Integration Points:**
- ClaimPicker modal for selecting claims
- ArgumentPicker modal for selecting arguments
- Stores content as JSONContent (ProseMirror format)

### Available Rich Deliberation Objects

#### Arguments (AIF-Enriched)
**Models:** `Argument`, `ArgumentPremise`, `ArgumentEdge`, `ArgumentDiagram`

**Rich Data Available:**
- **Scheme information:** expert_opinion, analogy, causal_reasoning, etc.
- **Formal structure:** premises → inference → conclusion
- **Critical Questions (CQs):** scheme-specific interrogation points
- **CQ satisfaction tracking:** answered/unanswered status
- **Implicit warrants:** hidden assumptions
- **Attack relationships:** rebut, undercut, conflict
- **Preference orderings:** which arguments dominate
- **Toulmin diagrams:** Statement, Inference, InferencePremise structure
- **Evidence links:** supporting materials

**API Example:**
```typescript
Argument {
  id, text, deliberationId
  aif: {
    scheme: { key, name, category }
    premises: Claim[]
    conclusion: Claim
    implicitWarrant?: string
    criticalQuestions: CriticalQuestion[]
    cqSatisfaction: { answered: number, total: number }
    attacks: ArgumentEdge[]
    preferences: PreferenceApplication[]
  }
}
```

#### Claims (Semantically Labeled)
**Models:** `Claim`, `ClaimEdge`, `ClaimLabel`, `ClaimEvidence`, `ClaimCitation`

**Rich Data Available:**
- **Semantic labels:** IN (warranted), OUT (defeated), UNDEC (undecided)
- **Grounded semantics:** computed from attack graph
- **Evidence links:** supporting documents, citations
- **Statistics:** view counts, endorsement counts
- **Warrant relationships:** backing for claims
- **Position tracking:** user stances

#### Propositions (Community-Driven)
**Models:** `Proposition`, `PropositionVote`, `PropositionEndorsement`, `PropositionReply`

**Rich Data Available:**
- **Vote counts:** upvotes/downvotes
- **Endorsements:** user support tracking
- **Threaded replies:** discussion context
- **Tags:** categorization (e.g., "topic:education")
- **Status:** DRAFT, PUBLISHED, CLAIMED, ARCHIVED
- **Promotion path:** propositions can become claims

#### Dialogue & Provenance
**Models:** `DialogueMove`, `CommitmentStore`

**Rich Data Available:**
- **Move history:** who said what and when
- **Locution types:** ASSERT, QUESTION, CHALLENGE, CONCEDE, RETRACT
- **Commitment tracking:** participant obligation states
- **AIF integration:** dialogue moves create AIF nodes
- **Provenance chains:** trace claim/argument origins
- **Timeline events:** temporal ordering of moves

#### Schemes & Critical Questions
**Models:** `ArgumentScheme`, `SchemeVariant`, `SchemeInstance`, `CriticalQuestion`, `CQStatus`

**Rich Data Available:**
- **Scheme library:** 60+ Walton schemes with formal structures
- **Macagno taxonomy:** purpose, source, reasoning type, rule form
- **Slot hints:** guidance for filling scheme premises
- **CQ templates:** scheme-specific interrogation questions
- **CQ satisfaction:** tracking answered vs. unanswered
- **Scheme instances:** applied schemes with filled slots
- **Attack types:** CQ-based undermining patterns

#### Evidence & Citations
**Models:** `EvidenceNode`, `EvidenceLink`, `ClaimCitation`

**Rich Data Available:**
- **Evidence nodes:** structured evidence records
- **Links to claims/arguments:** what supports what
- **Citation metadata:** URLs, notes, timestamps
- **Evidence provenance:** source tracking

#### Structural Analysis
**Models:** `ArgumentDiagram`, `Statement`, `Inference`, `DebateSheet`, `DebateNode`

**Rich Data Available:**
- **Toulmin diagrams:** claim, warrant, backing, rebuttal structure
- **Inference chains:** premise composition rules
- **Debate sheets:** high-level argument maps
- **Locus tracking:** burden of proof status
- **Sheet acceptance:** collective evaluation

#### Issues & Clusters
**Models:** `Issue`, `IssueLink`, `Cluster`, `ArgumentCluster`

**Rich Data Available:**
- **Issue tracking:** open questions, conflicts
- **Cluster membership:** grouped arguments
- **Viewpoint selection:** perspective filtering
- **Bridge requests:** cross-cluster connections

---

## Enhancement Opportunities

### Priority 0: Generative Thesis System (FLAGSHIP FEATURE) (8-10 weeks)

**The Living Thesis Architecture** - Transform thesis from static document to unified composition workspace and living research artifact.

#### Core Concept

The thesis becomes **both a creative workspace AND a published research document**:

1. **Composition Phase:** Users compose NEW deliberation objects inline (claims, propositions, arguments, schemes)
2. **Publication Phase:** Publishing "submits" all objects to deliberation AND creates bidirectional links
3. **Living Document:** Published thesis shows real-time updates from linked objects
4. **Archival:** Snapshot thesis state at any point for offline/historical preservation

#### 0.1 Embedded Object Composers

**Components:** Enhanced ThesisEditor with inline composition

**Features:**
- **Inline ClaimComposer:** Create claims directly in thesis text
- **Inline PropositionComposer:** Compose propositions without leaving editor
- **Inline AIFArgumentWithSchemeComposer:** Full argument creation with scheme selection
- **Inline SchemeCreator:** Define custom schemes within thesis
- **Inline TheoryFraming:** Embed theoretical frameworks
- **Draft state tracking:** Objects marked as "draft" until publication

**Technical Implementation:**
```typescript
// New TipTap node types for embedded composers:
- DraftClaimComposerNode
- DraftPropositionComposerNode
- DraftArgumentComposerNode
- DraftSchemeNode
- DraftTheoryFrameNode

// Composers get "embedded mode":
interface ComposerProps {
  mode: "modal" | "embedded"; // NEW
  onSave: (data) => void;
  onCancel?: () => void;
}
```

**UI Pattern:**
```
Thesis text... [+Insert Claim] ← toolbar button

↓ Click opens:

┌──────────────────────────────────────┐
│ 💬 Creating New Claim [DRAFT]        │
│                                      │
│ Claim text: [________________]       │
│ Position: [ Undecided ▾]            │
│                                      │
│ [Save Draft] [Cancel]                │
└──────────────────────────────────────┘

↓ Saved as draft node in thesis content
```

#### 0.2 Publication Workflow

**API Endpoint:** `POST /api/thesis/[id]/publish`

**Process:**
1. Extract all draft objects from thesis content (claims, props, args, schemes)
2. Create real deliberation objects with proper relations
3. Replace draft IDs with real IDs in thesis content
4. Track published objects in `ThesisPublishedObject` table
5. Add metadata to deliberation objects: `{ sourceThesis, sourceNodeId }`

**Database Schema:**
```prisma
model ThesisPublishedObject {
  id            String   @id @default(cuid())
  thesisId      String
  draftId       String   // temp ID during composition
  objectType    String   // "claim" | "proposition" | "argument" | "scheme"
  objectId      String   // real ID after publication
  nodeId        String   // TipTap node ID in thesis
  publishedAt   DateTime @default(now())
  
  thesis        Thesis   @relation(fields: [thesisId], references: [id])
}

// Add metadata field to track thesis source:
model Claim {
  metadata      Json?    // { sourceThesis?: string, sourceNodeId?: string }
}
// Same for Argument, Proposition, ArgumentScheme
```

**Publication Confirmation UI:**
```
╔══════════════════════════════════════════╗
║ Ready to Publish Thesis?                ║
╠══════════════════════════════════════════╣
║ This will submit to deliberation:       ║
║                                          ║
║ ✓ 5 Claims                              ║
║ ✓ 3 Arguments (with schemes)            ║
║ ✓ 2 Propositions                        ║
║ ✓ 1 Custom Scheme                       ║
║                                          ║
║ After publication:                       ║
║ • Objects visible in deliberation       ║
║ • Thesis shows live updates             ║
║ • Can create snapshots anytime          ║
║                                          ║
║ [Cancel] [Publish & Submit Objects]     ║
╚══════════════════════════════════════════╝
```

#### 0.3 Live Updates for Published Objects

**Components:** New TipTap nodes for live objects

**Features:**
- Real-time stats display (via SWR polling or WebSocket)
- **For Claims:** semantic label (IN/OUT/UNDEC), attack count, support count, evidence count
- **For Arguments:** CQ satisfaction %, scheme name, premise count
- **For Propositions:** vote count, endorsement count, reply count
- "Last updated" timestamps
- Click to navigate to deliberation view
- Visual indicators when object state changes

**Technical Implementation:**
```typescript
// lib/tiptap/extensions/live-claim-node.ts
export const LiveClaimNode = Node.create({
  name: "liveClaim",
  
  addAttributes() {
    return {
      claimId: { default: null },
      text: { default: "" },
      liveStats: { default: true },
      // Fetched dynamically:
      semanticLabel: { default: "UNDEC" },
      attackCount: { default: 0 },
      supportCount: { default: 0 },
      evidenceCount: { default: 0 },
      lastUpdated: { default: null }
    };
  },
  
  addNodeView() {
    return ({ node }) => {
      // Subscribe to real-time updates
      const { data } = useSWR(
        `/api/claims/${node.attrs.claimId}/stats`,
        fetcher,
        { refreshInterval: 5000 }
      );
      
      return renderLiveClaimCard(node.attrs, data);
    };
  }
});
```

**Visual Design:**
```
┌──────────────────────────────────────────────┐
│ 🟢 Courts have inherent sanctioning power   │
│ [IN - Warranted]                             │
│                                              │
│ 🛡️ 3 supporting args • ⚔️ 1 attack          │
│ 📎 4 evidence links                          │
│ Updated 2 minutes ago                        │
│                                              │
│ [View in Deliberation →]                     │
└──────────────────────────────────────────────┘
```

#### 0.4 Snapshot System for Archival

**API Endpoints:**
- `POST /api/thesis/[id]/snapshot` - Create new snapshot
- `GET /api/thesis/[id]/snapshots` - List snapshots
- `GET /api/thesis/[id]/snapshots/[snapshotId]` - View snapshot
- `POST /api/thesis/[id]/snapshots/[snapshotId]/compare` - Compare snapshots

**Features:**
- **Immutable snapshots:** Freeze thesis state at any moment
- **Enriched with stats:** Include current semantic labels, CQ satisfaction, vote counts
- **Metadata summary:** Object count, overall health metrics
- **Comparison tools:** Side-by-side diff of snapshots
- **Export options:** HTML, PDF, JSON from snapshot

**Database Schema:**
```prisma
model ThesisSnapshot {
  id            String   @id @default(cuid())
  thesisId      String
  snapshotData  Json     // Complete frozen state with all stats
  description   String?
  createdById   String
  createdAt     DateTime @default(now())
  metadata      Json?    // { objectCount, cqSatisfaction, semanticState }
  
  thesis        Thesis   @relation(fields: [thesisId], references: [id])
  
  @@index([thesisId, createdAt])
}
```

**Snapshot Viewer UI:**
```
╔═══════════════════════════════════════════════╗
║ Thesis Snapshots - Motion to Dismiss         ║
╠═══════════════════════════════════════════════╣
║ 📸 Nov 5, 2025 10:23 AM - "Initial pub"      ║
║    12 objects • CQ: 65% • 8 claims IN        ║
║    [View] [Export] [Compare to Current]      ║
║                                               ║
║ 📸 Nov 6, 2025 2:45 PM - "After review"      ║
║    15 objects • CQ: 82% • 10 claims IN       ║
║    [View] [Export] [Compare to Current]      ║
║                                               ║
║ 🔴 Current State (Live)                      ║
║    18 objects • CQ: 90% • 12 claims IN       ║
║    [Create New Snapshot]                     ║
╚═══════════════════════════════════════════════╝
```

#### 0.5 Export Options (Static & Archive)

**Export Formats:**

1. **Static HTML Export:**
   - Standalone HTML file with embedded CSS/JS
   - Stats frozen at export time
   - All diagrams as inline SVG
   - Works completely offline
   - Includes full provenance footnotes

2. **PDF Export:**
   - Print-optimized layout via Puppeteer
   - Current live stats at generation time
   - Optional: include snapshot comparison pages
   - Academic citation format
   - AIF graphs and Toulmin diagrams embedded

3. **JSON Archive:**
   - Machine-readable format
   - Full thesis structure
   - All linked object IDs with current stats
   - Importable into other deliberations
   - Version-controlled friendly

**API Endpoints:**
```typescript
POST /api/thesis/[id]/export/html
  → Returns: standalone HTML file

POST /api/thesis/[id]/export/pdf
  → Returns: formatted PDF (async job)

POST /api/thesis/[id]/export/json
  → Returns: complete JSON archive

POST /api/thesis/[id]/snapshots/[snapshotId]/export/{html|pdf|json}
  → Export specific snapshot version
```

#### 0.6 Bidirectional Navigation & Provenance

**Features:**
- **From Deliberation → Thesis:** "This claim originated in Thesis X"
- **From Thesis → Deliberation:** Click any object to view full deliberation context
- **Provenance badges:** Show thesis source in deliberation views
- **Impact tracking:** "This claim is used in 3 theses"
- **Cross-reference:** See all theses that reference an object

**UI Elements:**

In Deliberation Claim View:
```
┌─────────────────────────────────────────┐
│ Claim: "Courts have inherent power..."  │
│                                         │
│ 📄 Source: Thesis "Motion to Dismiss"   │
│    by @alice • Nov 5, 2025             │
│    [View Thesis Context →]              │
│                                         │
│ 📊 Also referenced in:                  │
│    • Thesis "Federal Jurisdiction"     │
│    • Thesis "Sanctions Analysis"       │
└─────────────────────────────────────────┘
```

In Thesis Editor:
```
Live Claim Card with link:
[View in Deliberation →] ← Opens deliberation at this claim
```

#### Benefits of Generative Thesis System

**For Users:**
- ✅ **Unified workflow:** Write thesis AND create objects in one place
- ✅ **No context switching:** Everything in thesis editor
- ✅ **Living documentation:** See how arguments evolve over time
- ✅ **Quality tracking:** Monitor CQ satisfaction, semantic labels
- ✅ **Archival quality:** Snapshots preserve state for citations

**For Platform:**
- ✅ **Increased engagement:** Thesis becomes conversation starter
- ✅ **Richer deliberation:** More structured argument contributions
- ✅ **Clear provenance:** Track object origins and impact
- ✅ **Academic rigor:** Citable snapshots with stable references
- ✅ **Cross-pollination:** Theses seed deliberation with quality objects

**For Research:**
- ✅ **Temporal analysis:** Track argument evolution through snapshots
- ✅ **Impact measurement:** See which theses influence discourse
- ✅ **Pattern detection:** Identify commonly used schemes/arguments
- ✅ **Collaboration tracking:** Multiple theses building on same claims

#### Implementation Phases for Generative Thesis

**Phase 0.1: Embedded Composers (Weeks 1-2)**
- [ ] Add "embedded mode" to ClaimComposer, PropositionComposer, AIFArgumentWithSchemeComposer
- [ ] Create TipTap draft nodes (DraftClaimNode, DraftArgumentNode, etc.)
- [ ] Build composition toolbar in ThesisEditor
- [ ] Implement draft object state management
- [ ] Create visual styling for draft vs. published objects

**Phase 0.2: Publication Workflow (Weeks 3-4)**
- [ ] Build `POST /api/thesis/[id]/publish` endpoint
- [ ] Extract draft objects from thesis JSONContent
- [ ] Create real deliberation objects with relations
- [ ] Update thesis content with real IDs
- [ ] Create `ThesisPublishedObject` tracking table
- [ ] Add metadata fields to Claim, Argument, Proposition models
- [ ] Build publication confirmation UI

**Phase 0.3: Live Updates (Weeks 5-6)**
- [ ] Create live node types (LiveClaimNode, LiveArgumentNode, etc.)
- [ ] Build stats API endpoints for real-time data
- [ ] Implement SWR polling for live updates
- [ ] Design and build live object card components
- [ ] Add "last updated" timestamps
- [ ] Create click-through navigation to deliberation
- [ ] Add visual change indicators

**Phase 0.4: Snapshot System (Weeks 7-8)**
- [ ] Create `ThesisSnapshot` database model
- [ ] Build snapshot creation API with stat enrichment
- [ ] Create snapshot viewer UI component
- [ ] Implement snapshot comparison tools
- [ ] Add snapshot export options
- [ ] Build snapshot management interface

**Phase 0.5: Export & Archive (Weeks 9-10)**
- [ ] Implement static HTML export with embedded assets
- [ ] Build PDF generation via Puppeteer
- [ ] Create JSON archive format
- [ ] Add export options to snapshot viewer
- [ ] Implement async export job queue
- [ ] Build download management UI

**Phase 0.6: Bidirectional Navigation (Ongoing)**
- [ ] Add thesis provenance badges to deliberation views
- [ ] Create "used in theses" section for claims/arguments
- [ ] Build cross-reference browser
- [ ] Implement impact tracking metrics
- [ ] Add navigation links throughout platform

---

### Priority 1: Quick Wins (1-2 weeks)

These features can be implemented with minimal API changes and provide immediate value.

#### 1.1 Enhanced Argument Display in Prongs
**Component:** `ProngEditor.tsx`, `ThesisComposer.tsx`

**Changes:**
- Show **scheme badge** for each argument (e.g., "Expert Opinion", "Analogy")
- Display **CQ satisfaction** as percentage badge (e.g., "CQs: 3/5 ✓")
- Add **semantic label dots** (IN/OUT/UNDEC) for argument conclusions
- Show **premise count** and **attack count** in argument cards
- Expandable detail view for full AIF structure

**Visual Mockup:**
```
┌─────────────────────────────────────────────────┐
│ [↑][↓]  PREMISE  🟢 IN                          │
│                                                 │
│ "Expert Dr. Smith testified that X is true..."  │
│                                                 │
│ 🏷️ Expert Opinion  📊 CQs: 4/5 ✓  📎 2 premises │
│ [Edit] [Remove]                                 │
└─────────────────────────────────────────────────┘
```

**Implementation:**
1. Modify `ArgumentPicker` to include AIF data in selection
2. Update ProngEditor argument list to show metadata badges
3. Fetch semantic labels from ClaimLabel table
4. Query CQStatus for satisfaction percentages

#### 1.2 Semantic Label Integration
**Component:** All thesis components

**Changes:**
- Add **SemanticDot** component (already exists in `ThesisRenderer.tsx`)
- Show dots next to all claims throughout thesis UI
- Add hover tooltips explaining IN/OUT/UNDEC meanings
- Color-code prong headers based on main claim status
- Show semantic analysis summary in thesis metadata

**Visual Enhancement:**
```
Prong 1: Jurisdiction [🟢 3 IN, 🔴 1 OUT, 🟡 2 UNDEC]
  🟢 Main Claim: "Court has subject-matter jurisdiction..."
  Arguments:
    🟢 Argument 1: Federal question jurisdiction exists...
    🟢 Argument 2: Diversity requirements are met...
    🔴 Argument 3: Amount in controversy exceeds $75k... [Defeated]
```

#### 1.3 Evidence Link Preview
**Component:** `ProngEditor.tsx`, `ThesisRenderer.tsx`

**Changes:**
- Query `EvidenceLink` for arguments added to prongs
- Show evidence count badge on arguments with supporting materials
- Hover tooltip shows evidence preview (first 100 chars)
- Click evidence badge to expand full evidence list
- Link directly to evidence sources

**Implementation:**
1. Add evidence query to argument fetch in ProngEditor
2. Create EvidencePreview component
3. Display evidence links in expandable section

#### 1.4 Prong Strength Indicators
**Component:** `ThesisComposer.tsx`

**Changes:**
- Calculate **prong strength score** based on:
  - % of arguments with IN semantic labels
  - % of CQs answered across all arguments
  - Number of supporting arguments vs. counter-responses
- Display strength as visual bar (0-100%)
- Show prong quality warnings ("2 unanswered CQs", "1 defeated argument")
- Highlight prongs needing attention

**Visual:**
```
Prong 2: Causation [Strength: 68% ⚠️]
  ✓ Main claim is warranted (IN)
  ⚠️ 3 unanswered critical questions
  ⚠️ 1 defeated argument should be addressed
  ✓ Strong evidence support (8 sources)
```

---

### Priority 2: Medium Effort, High Value (3-4 weeks)

These features require new components and API endpoints but significantly enhance thesis quality.

#### 2.1 Critical Questions Dashboard
**New Component:** `ThesisCQDashboard.tsx`

**Features:**
- Tab in ThesisComposer showing **all CQs** across entire thesis
- Group by prong and argument
- Filter by status: answered, unanswered, partially answered
- Click CQ to jump to source argument
- Inline CQ answering interface
- Progress tracking: "12/18 CQs answered (67%)"

**UI Sections:**
1. **Summary Card:** Total CQs, answered %, prongs needing attention
2. **Unanswered CQs List:** Red-flagged items to address
3. **By Prong View:** Organize by thesis structure
4. **By Scheme View:** Group by argumentation scheme

**Implementation:**
1. Create API endpoint: `GET /api/thesis/[id]/critical-questions`
2. Aggregate CQs from all arguments in all prongs
3. Join with CQStatus for satisfaction tracking
4. Build filterable/sortable table component

#### 2.2 Proposition Browser & Promotion
**New Component:** `ThesisPropositionBrowser.tsx`

**Features:**
- Browse **all propositions** in deliberation
- Filter by votes, endorsements, tags, status
- Sort by popularity, recency, relevance
- **"Promote to Prong"** action: convert proposition → claim → prong
- Show proposition discussion context (replies)
- Track provenance: "Originated from Proposition #42"

**Workflow:**
```
1. User clicks "Browse Propositions" in ThesisComposer
2. Modal shows sortable list of propositions
3. User sees: text, vote count, endorsements, tags
4. User clicks "Add to Thesis"
5. System creates Claim from Proposition (if not exists)
6. System prompts for prong role (SUPPORT/REBUT/PREEMPT)
7. System creates new prong with proposition's claim
```

**Implementation:**
1. Create PropositionBrowser component with filtering
2. Add promotion workflow with confirmation dialog
3. API endpoint: `POST /api/thesis/[id]/prongs/from-proposition`
4. Track provenance in Prong metadata (new field: `sourcePropositionId?`)

#### 2.3 Enhanced Scheme Picker
**New Component:** `SchemePicker.tsx` (enhanced ArgumentPicker)

**Features:**
- **Browse schemes by category:** deductive, defeasible, presumptive, inductive
- Show scheme **formal structure** (major premise, minor premise, conclusion)
- Preview **critical questions** for each scheme
- **Template-based argument creation:** fill scheme slots
- Validate completeness against scheme requirements
- Suggest schemes based on prong type

**UI Flow:**
```
1. User creating argument in ProngEditor
2. Clicks "New Argument from Scheme"
3. Browses scheme library with categories:
   - Expert Opinion (23 CQs)
   - Analogy (8 CQs)
   - Causal Reasoning (12 CQs)
   - Sign (6 CQs)
4. Selects "Expert Opinion"
5. Form shows:
   - Major Premise: "E is an expert in domain D"
   - Minor Premise: "E asserts that A is true"
   - Conclusion: "A is (plausibly) true"
6. User fills slots with claims
7. System creates argument with scheme metadata
```

**Implementation:**
1. Query ArgumentScheme table for library
2. Create scheme browsing UI with category tabs
3. Build slot-filling form generator from scheme.slotHints
4. Validate filled slots against scheme.validators
5. Create argument with SchemeInstance record

#### 2.4 Dialogue Provenance Panel
**New Component:** `ThesisProvenancePanel.tsx`

**Features:**
- Show **dialogue history** for each claim/argument in thesis
- Display creating dialogue move (ASSERT, QUESTION, etc.)
- Show participant commitment states
- Timeline view of how thesis evolved
- Click move to see full dialogue context
- Filter by participant, date range, move type

**UI Design:**
```
╔════════════════════════════════════════════════╗
║ Provenance: Claim "Court has jurisdiction"    ║
╠════════════════════════════════════════════════╣
║ Created by: @alice (Oct 15, 2025 14:23)       ║
║ Move: ASSERT                                   ║
║ Commitments: Accepted by @bob, @charlie        ║
║                                                ║
║ Timeline:                                      ║
║ • Oct 15 14:23 - @alice asserted claim        ║
║ • Oct 15 16:45 - @bob questioned basis        ║
║ • Oct 16 09:12 - @alice provided grounds      ║
║ • Oct 16 11:30 - @bob conceded                 ║
╚════════════════════════════════════════════════╝
```

**Implementation:**
1. Query DialogueMove for claims/arguments in thesis
2. Join with CommitmentStore for participant states
3. Build timeline visualization component
4. Add expandable detail views for each move

#### 2.5 Assumption Tracker
**New Component:** `ThesisAssumptionTracker.tsx`

**Features:**
- List **all assumptions** used in thesis arguments
- Identify **shared assumptions** across multiple prongs
- Flag **unstated assumptions** (implicit warrants)
- Show which arguments depend on each assumption
- Generate "Key Assumptions" section for thesis
- Allow challenging assumptions with CQs

**UI:**
```
┌─────────────────────────────────────────────────┐
│ Assumption Analysis                             │
├─────────────────────────────────────────────────┤
│ Shared Assumptions (used in 3+ prongs):         │
│                                                 │
│ 🔑 "Expert testimony is generally reliable"     │
│    Used in: Prong 1, Prong 3, Prong 5          │
│    Status: Unchallenged                         │
│    [Challenge] [Add Evidence]                   │
│                                                 │
│ 🔑 "Statistical correlation implies causation"  │
│    Used in: Prong 2, Prong 4                   │
│    ⚠️ Challenged by: @bob (CQ: "Confounding?")  │
│    [Defend] [Revise]                            │
└─────────────────────────────────────────────────┘
```

**Implementation:**
1. Extract implicit warrants from arguments
2. Query AssumptionUse table for explicit assumptions
3. Detect duplicates via text similarity
4. Build assumption network visualization
5. Allow challenging via CQ system

#### 2.6 Auto-Generated Sections
**New Feature:** Thesis auto-sections

**Sections to Generate:**
1. **"Critical Questions & Responses"**
   - Lists all CQs across thesis
   - Shows answers with supporting dialogue
   - Flags unanswered questions

2. **"Key Assumptions"**
   - Extracted from assumption tracker
   - Shows shared vs. unique assumptions
   - Indicates challenged assumptions

3. **"Evidence Index"**
   - All evidence sources used in thesis
   - Organized by prong
   - Citation-formatted output

4. **"Argument Schemes Used"**
   - Lists schemes with usage counts
   - Shows CQ satisfaction by scheme
   - Suggests areas needing attention

**Implementation:**
1. Add "Generate Section" dropdown to ThesisComposer
2. Create section generators for each type
3. Insert as ThesisSection with auto-generated content
4. Allow user editing after generation
5. Add "Regenerate" button to update content

---

### Priority 3: Advanced Features (5-8 weeks)

These features require significant architectural work but provide cutting-edge capabilities.

#### 3.1 Interactive Argument Diagrams
**New Components:** `ThesisDiagramEmbed.tsx`, `ToulminDiagramViewer.tsx`

**Features:**
- Embed **Toulmin diagrams** in thesis sections
- Interactive visualization: click nodes to expand
- Show premise → inference → conclusion flows
- Highlight evidence links and warrants
- Export diagrams as SVG/PNG for external use
- Inline editing of diagram structure

**Technical Approach:**
1. Query ArgumentDiagram for arguments in thesis
2. Render using D3.js or React Flow
3. Create interactive node components
4. Add zoom/pan controls
5. Support multiple diagram layouts (tree, radial, force-directed)

**Visual:**
```
┌────────────────────────────────────────────────┐
│ [Toulmin Diagram: Argument 3.2]                │
│                                                │
│     [Claim]                                    │
│        ↑                                       │
│        │                                       │
│   [Warrant] ← [Backing]                        │
│        ↑                                       │
│        │                                       │
│   [Data/Grounds]                               │
│                                                │
│ Click any node to expand details               │
│ [Export SVG] [Edit Structure] [Zoom Controls]  │
└────────────────────────────────────────────────┘
```

#### 3.2 Cross-Deliberation Argument Import
**New Components:** `CrossDeliberationBrowser.tsx`, `FunctorMapper.tsx`

**Features:**
- Browse **arguments from other deliberations**
- Functor-aware claim mapping
- Import argument with full structure preservation
- Track cross-deliberation references
- Show "Related arguments in [Deliberation X]"
- Build **meta-theses** across multiple contexts

**Workflow:**
```
1. User in ThesisComposer for Deliberation A
2. Clicks "Import from Other Deliberations"
3. Browses available deliberations
4. Searches arguments in Deliberation B
5. Selects argument to import
6. System shows functor mapping:
   - Claim "X is true" in Delib B
   → Maps to Claim "Y is true" in Delib A
7. User confirms mappings
8. System creates new argument in Delib A
9. Preserves provenance: "Imported from Delib B, Arg #123"
```

**Implementation:**
1. Extend ArgumentPicker to browse cross-deliberation
2. Use existing functor system for claim mapping
3. Leverage `structure-import.ts` utilities
4. Store import provenance in argument metadata
5. API: `POST /api/thesis/[id]/import-argument`

#### 3.3 AIF Graph Visualization
**New Component:** `ThesisAIFGraphViewer.tsx`

**Features:**
- Visualize **entire thesis as AIF graph**
- Nodes: I-nodes (claims), RA-nodes (arguments), DM-nodes (dialogue)
- Edges: support, rebut, undercut, conflict
- Interactive exploration: filter, zoom, highlight paths
- Semantic coloring: IN (green), OUT (red), UNDEC (gray)
- Export graph for analysis tools

**Technical:**
1. Query full AIF graph for deliberation
2. Filter to thesis-relevant nodes
3. Use Cytoscape.js or D3 force layout
4. Add dialogue layer toggle
5. Implement graph analysis tools (centrality, clustering)

#### 3.4 Collaborative Thesis Editing
**New Feature:** Multi-user thesis composition

**Features:**
- **Real-time collaboration:** multiple users editing simultaneously
- See other users' cursors and selections
- Locking mechanism for prong/section editing
- Comment threads on prongs and arguments
- Suggested edits workflow (like Google Docs)
- Change history and rollback

**Implementation:**
1. Integrate WebSocket or Pusher for real-time sync
2. Use Yjs or Automerge for CRDT-based editing
3. Add user presence indicators
4. Implement comment system
5. Track edit history in database

#### 3.5 PDF Export with Embedded Visualizations
**New Feature:** Professional thesis export

**Features:**
- Export thesis as **formatted PDF**
- Embedded AIF graphs and Toulmin diagrams
- Provenance footnotes for each claim/argument
- Evidence citations in bibliography
- CQ satisfaction appendix
- Semantic analysis summary
- Dialogue timeline visualization

**Technical:**
1. Use Puppeteer or Playwright for PDF generation
2. Create print-optimized CSS layouts
3. Render diagrams as SVG for high quality
4. Generate bibliography from evidence/citations
5. Add page numbers, headers, footers

#### 3.6 Thesis Version Control
**New Feature:** Git-style versioning for theses

**Features:**
- **Version snapshots:** save thesis state at key points
- **Diff view:** compare versions side-by-side
- **Branching:** create alternate thesis versions
- **Merge:** combine changes from different versions
- **Tagging:** mark important versions (draft, review, final)

**Implementation:**
1. Store thesis snapshots in new `ThesisVersion` table
2. JSON diff for content comparison
3. UI for version browsing and comparison
4. Restore from previous version
5. Branch/merge logic for collaborative editing

---

## Implementation Strategy

### Recommended Approach: Flagship First

**Start with Priority 0 (Generative Thesis System)** as it provides the most transformative value and creates the foundation for other enhancements. Once users can compose objects inline and see live updates, the other priority features become natural extensions.

### Phase 0: Generative Thesis System (Weeks 1-10) ⭐ FLAGSHIP
**Goal:** Transform thesis into unified composition workspace and living document

- [ ] **Weeks 1-2:** Embedded composers (ClaimComposer, ArgumentComposer with "embedded mode")
- [ ] **Weeks 3-4:** Publication workflow (extract drafts → create real objects → update IDs)
- [ ] **Weeks 5-6:** Live updates (real-time stats, semantic labels, clickable navigation)
- [ ] **Weeks 7-8:** Snapshot system (immutable archives, comparison tools)
- [ ] **Weeks 9-10:** Export options (HTML/PDF/JSON) and bidirectional navigation

**Deliverable:** Users can compose theses that create deliberation objects AND show live updates

### Phase 1: Foundation Enhancements (Weeks 11-12)
**Goal:** Enrich existing object displays with metadata

- [ ] Enhanced argument display with scheme badges
- [ ] Semantic label integration across all components
- [ ] Evidence link preview in prong editor
- [ ] Prong strength indicator calculations

**Deliverable:** Thesis composer shows rich argument metadata (complements live updates)

### Phase 2: Quality Tools (Weeks 13-14)
**Goal:** Systematic thesis improvement workflows

- [ ] Critical Questions Dashboard component
- [ ] Proposition browser and promotion workflow
- [ ] Enhanced scheme picker with template filling
- [ ] Assumption tracker component

**Deliverable:** Users can systematically improve thesis quality (leverages live data)

### Phase 3: Provenance (Weeks 15-16)
**Goal:** Full transparency of argument origins

- [ ] Dialogue provenance panel
- [ ] Auto-generated sections (CQs, assumptions, evidence)
- [ ] Timeline visualization of thesis evolution
- [ ] Commitment store integration

**Deliverable:** Full transparency of thesis origins and development

### Phase 4: Visualization (Weeks 17-18)
**Goal:** Interactive visual exploration

- [ ] Interactive Toulmin diagram embedding
- [ ] AIF graph viewer for thesis
- [ ] Export diagrams as SVG/PNG
- [ ] Graph analysis tools

**Deliverable:** Beautiful, interactive thesis visualizations

### Phase 5: Advanced (Weeks 19-22)
**Goal:** Collaborative and cross-deliberation features

- [ ] Cross-deliberation argument import
- [ ] Collaborative real-time editing
- [ ] Professional PDF export with visuals
- [ ] Thesis version control system

**Deliverable:** Production-ready, collaborative thesis platform

---

### Alternative Approach: Incremental Enhancements

If the generative thesis system scope is too large initially, prioritize **Phase 1 Quick Wins** first to deliver immediate value, then build toward the flagship feature:

1. **Weeks 1-2:** Priority 1 Quick Wins (metadata displays)
2. **Weeks 3-4:** Priority 2 Quality Tools (CQ dashboard, proposition browser)
3. **Weeks 5-14:** Priority 0 Generative Thesis System (flagship feature)
4. **Weeks 15+:** Continue with Phases 3-5

This approach provides incremental value while building toward the transformative vision.

---

## Technical Considerations

### Database Schema Changes

#### New Fields
```prisma
model Prong {
  // existing fields...
  sourcePropositionId String? // track proposition origin
  strengthScore       Float?  // calculated strength (0-100)
  lastAnalyzedAt      DateTime?
}

model Thesis {
  // existing fields...
  collaborators       ThesisCollaborator[]
  versions            ThesisVersion[]
  generatedSections   ThesisSection[] // auto-generated
}

model ThesisCollaborator {
  id        String   @id @default(cuid())
  thesisId  String
  userId    String
  role      String   // "editor", "viewer", "commenter"
  addedAt   DateTime @default(now())
  thesis    Thesis   @relation(fields: [thesisId], references: [id])
}

model ThesisVersion {
  id              String   @id @default(cuid())
  thesisId        String
  versionNumber   Int
  snapshot        Json     // full thesis state
  createdById     String
  createdAt       DateTime @default(now())
  description     String?
  thesis          Thesis   @relation(fields: [thesisId], references: [id])
}

model ThesisComment {
  id         String   @id @default(cuid())
  thesisId   String
  prongId    String?  // optional: comment on specific prong
  authorId   String
  text       String
  resolved   Boolean  @default(false)
  createdAt  DateTime @default(now())
}
```

### New API Endpoints

```typescript
// Critical Questions
GET  /api/thesis/[id]/critical-questions
  → Returns all CQs across thesis with satisfaction status

// Propositions
GET  /api/thesis/[id]/propositions/available
POST /api/thesis/[id]/prongs/from-proposition
  → Promotes proposition to prong

// Provenance
GET  /api/thesis/[id]/provenance
GET  /api/thesis/[id]/prongs/[prongId]/dialogue-history

// Assumptions
GET  /api/thesis/[id]/assumptions
POST /api/thesis/[id]/assumptions/challenge

// Cross-Deliberation
GET  /api/deliberations/[id]/arguments/search
POST /api/thesis/[id]/import-argument

// Versions
GET  /api/thesis/[id]/versions
POST /api/thesis/[id]/versions/snapshot
GET  /api/thesis/[id]/versions/[versionId]/diff

// Collaboration
POST /api/thesis/[id]/collaborators
GET  /api/thesis/[id]/comments
POST /api/thesis/[id]/comments

// Export
POST /api/thesis/[id]/export/pdf
POST /api/thesis/[id]/export/aif-graph
```

### Performance Optimization

**Caching Strategy:**
- Cache CQ aggregations (invalidate on argument changes)
- Cache semantic label computations (invalidate on attack graph changes)
- Cache provenance queries (invalidate on new dialogue moves)
- Use Redis for real-time collaboration state

**Lazy Loading:**
- Load prong arguments on demand (not all at once)
- Paginate proposition browser
- Stream diagram rendering for large graphs

**Background Jobs:**
- Compute prong strength scores asynchronously
- Generate auto-sections via worker queue
- Export PDF generation in background

---

## Success Metrics

### Adoption Metrics
- % of theses using enhanced features (goal: 80%)
- Avg number of arguments per prong (goal: 3-5)
- CQ satisfaction rate across platform (goal: 70%+)

### Quality Metrics
- % of theses with all CQs addressed (goal: 50%)
- Avg prong strength score (goal: 75+)
- % of arguments with evidence links (goal: 60%)

### Engagement Metrics
- Time spent in thesis composer (expect +40%)
- Number of collaborative editing sessions
- Export rate (PDF, diagrams) (goal: 30% of theses)

---

## Future Extensions (Beyond Initial Roadmap)

### AI-Assisted Composition
- GPT-powered argument suggestion based on prong topic
- Auto-fill scheme slots from deliberation context
- CQ answer generation from evidence
- Counterargument generation for rebuttals

### Semantic Search
- Find arguments by conceptual similarity
- Suggest related arguments from corpus
- Identify argument patterns across deliberations

### Argumentation Mining
- Extract arguments from free text (forum posts, documents)
- Auto-create argument structures from natural language
- Suggest schemes based on argument text

### Gamification
- Thesis quality score leaderboard
- Badges for CQ completion, evidence usage
- Peer review system with reputation

### Integration with External Tools
- Import arguments from Rationale, Araucaria
- Export to academic argumentation formats (AML, GraphML)
- Sync with citation managers (Zotero, Mendeley)

---

## Visual Comparison: Traditional vs. Generative Thesis

### Traditional Thesis System (Current)

```
User writes thesis → References existing claims/arguments
                  → Thesis is static document
                  → No direct creation workflow
                  → Published thesis doesn't update
```

**Workflow:**
1. Write thesis text in editor
2. Switch to deliberation to create claim
3. Switch back to thesis to reference claim
4. Repeat for each object
5. Published thesis shows fixed state

**Result:** Thesis is disconnected from deliberation

---

### Generative Thesis System (New)

```
User writes thesis → Creates objects inline as needed
                  → Objects saved as drafts
                  → Publish submits ALL to deliberation
                  → Published thesis shows live updates
                  → Can snapshot at any time
```

**Workflow:**
1. Write thesis text in editor
2. Click [+Claim] to compose claim inline
3. Claim saved as draft in thesis
4. Continue composing with all object types
5. Click "Publish" → submits all drafts to deliberation
6. Thesis now shows live stats for all objects
7. Create snapshots for archival/citation

**Result:** Thesis is living deliberation hub

---

## Architectural Diagrams

### Data Flow: Draft → Published → Live

```
┌─────────────────────────────────────────────────────┐
│ COMPOSITION PHASE                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  User writes in ThesisEditor                        │
│         ↓                                           │
│  Clicks [+Insert Claim]                             │
│         ↓                                           │
│  ClaimComposer opens (embedded mode)                │
│         ↓                                           │
│  User fills: text, position                         │
│         ↓                                           │
│  Saves → DraftClaimNode created in thesis.content   │
│         ↓                                           │
│  { type: "draftClaim",                              │
│    attrs: { draftId: "draft_123", text: "..." } }  │
│                                                     │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ PUBLICATION PHASE                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  User clicks "Publish Thesis"                       │
│         ↓                                           │
│  API extracts all draft objects from content        │
│         ↓                                           │
│  For each draft:                                    │
│    • Create real Claim/Argument/Proposition         │
│    • Track in ThesisPublishedObject table           │
│    • Add metadata: { sourceThesis, sourceNodeId }   │
│         ↓                                           │
│  Replace draft IDs with real IDs in thesis.content  │
│         ↓                                           │
│  { type: "liveClaim",                               │
│    attrs: { claimId: "cm2x3y4z5", text: "..." } }  │
│                                                     │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ LIVE UPDATE PHASE                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  LiveClaimNode renders in thesis                    │
│         ↓                                           │
│  Subscribes to /api/claims/[id]/stats              │
│         ↓                                           │
│  Polls every 5 seconds (or WebSocket)               │
│         ↓                                           │
│  Updates display:                                   │
│    • Semantic label (IN/OUT/UNDEC)                  │
│    • Attack count, support count                    │
│    • Evidence count                                 │
│    • Last updated timestamp                         │
│         ↓                                           │
│  User clicks → navigates to deliberation view       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Database Relationships

```
Thesis (mode: "published")
  │
  ├─── ThesisPublishedObject (junction table)
  │      │
  │      ├─ links to → Claim (metadata: { sourceThesis, sourceNodeId })
  │      ├─ links to → Argument (metadata: { sourceThesis, sourceNodeId })
  │      └─ links to → Proposition (metadata: { sourceThesis, sourceNodeId })
  │
  └─── ThesisSnapshot[] (immutable archives)
         │
         └─ snapshotData: { 
              thesis: {...},
              linkedObjects: [
                { type: "claim", id: "...", stats: {...} },
                { type: "argument", id: "...", stats: {...} }
              ],
              metadata: { objectCount, cqSatisfaction, ... }
            }
```

---

## Conclusion

This roadmap transforms the thesis system from a structured document editor into a sophisticated **generative argumentation platform**. The flagship **Generative Thesis System** (Priority 0) represents a paradigm shift:

**From:** Static document that references existing objects  
**To:** Living workspace that creates AND tracks objects in real-time

### Key Innovations

1. **Unified Composition:** Write thesis and create deliberation objects in one workflow
2. **Living Documentation:** Published thesis reflects current deliberation state
3. **Temporal Archiving:** Snapshots preserve thesis state for academic citation
4. **Bidirectional Links:** Navigate seamlessly between thesis and deliberation
5. **Provenance Transparency:** Track object origins and impact across platform

### Strategic Value

The generative thesis system positions Mesh as a **next-generation research platform** that bridges the gap between individual scholarship (thesis writing) and collective deliberation. By making the thesis both:

- **A composition tool** (Phase 0.1-0.2: embedded composers, publication workflow)
- **A living document** (Phase 0.3-0.4: live updates, snapshots)
- **An archival artifact** (Phase 0.5: exports, static versions)

...we enable academic rigor AND dynamic discourse within the same system.

### Subsequent Priorities

Once the generative thesis foundation is built, Priorities 1-3 become natural extensions:

- **Priority 1 (Quick Wins):** Enhance object displays with metadata (complements live updates)
- **Priority 2 (Quality Tools):** Add systematic improvement workflows (CQ dashboard, proposition browser)
- **Priority 3 (Advanced):** Enable cross-deliberation synthesis and collaboration

The phased approach ensures incremental value delivery while building toward a transformative vision: **the thesis as both creative workspace and living research hub**.

By integrating schemes, critical questions, semantic analysis, dialogue provenance, and interactive visualizations, we enable users to construct rigorous, transparent, and compelling arguments that evolve with the deliberation.

---

### Success Metrics (Updated with Generative Thesis)

#### Adoption Metrics
- % of theses using embedded composers (goal: 70%)
- % of theses in "published" mode with live updates (goal: 60%)
- Avg number of objects created per thesis (goal: 8-12)
- Snapshot creation rate (goal: 2-3 per published thesis)

#### Quality Metrics
- % of thesis objects with satisfied CQs (goal: 70%+)
- Avg semantic label improvement (UNDEC → IN) post-publication (track over time)
- % of arguments with evidence links (goal: 60%)

#### Engagement Metrics
- Time spent in thesis editor vs. traditional composer (expect +60%)
- Click-through rate from thesis to deliberation (goal: 40%)
- Export rate (HTML/PDF/snapshots) (goal: 50% of published theses)
- Cross-thesis object reuse rate (track via metadata.sourceThesis)

#### Impact Metrics
- Deliberation objects sourced from theses vs. direct creation (track ratio)
- Thesis citation rate via snapshots (goal: measurable academic adoption)
- Multi-thesis claim usage (track via cross-references)

---

**Next Steps:**
1. Review and prioritize features with stakeholders
2. **Decision point:** Start with Priority 0 (Generative Thesis) or Priority 1 (Quick Wins)
3. Create detailed technical specs for chosen starting phase
4. Set up project tracking (GitHub issues, milestones)
5. Begin implementation with first phase
6. Iterate based on user feedback throughout rollout

---

**Document Version:** 2.0  
**Last Updated:** November 5, 2025  
**Authors:** Development Team  
**Status:** Ready for Review — **FLAGSHIP FEATURE ADDED**
