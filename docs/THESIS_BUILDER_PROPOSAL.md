# Thesis Builder: Multi-Layered Argumentation Architecture Proposal

**Date**: October 26, 2025  
**Status**: Design Proposal  
**Context**: Extending deliberation system for complex, multi-tiered case building

---

## Executive Summary

Your question touches on a fundamental architectural choice in argumentation systems: **where to add complexity** — in the argument primitives themselves, or in higher-level composition mechanisms that orchestrate those primitives.

**Recommendation**: **Both**, with clear separation of concerns:
1. **Keep Arguments focused** (AIF-compliant atomic units)
2. **Extend TheoryWorks** to become rich "Thesis" containers
3. **Create a new "Brief" model** for legal-style case building with mixed formal/informal elements

This preserves your rigorous logical skeleton (AIF/ASPIC+/Dialogue) while enabling the expressive power of natural language composition.

---

## The Problem Space

### Current Strengths
✅ Rigorous AIF protocol for Arguments (I/RA/CA nodes, schemes, attacks)  
✅ Dialogue moves with protocol rules (WHY/GROUNDS/CQs)  
✅ TheoryWorks for DN/IH/TC/OP structured theory development  
✅ Articles for pure prose/editorial content  
✅ Claims as atomic truth-bearers with semantic labeling

### Current Gaps
❌ **No intermediate layer** between atomic arguments and full essays  
❌ **Limited argument chaining** — hard to compose multi-step reasoning  
❌ **TheoryWorks underutilized** — great scaffolding but not integrated into deliberation flow  
❌ **Articles too informal** — no links to verified claims/arguments as building blocks  
❌ **No "case building" primitive** — can't assemble multi-pronged defenses like legal briefs

---

## Design Options Analysis

### Option A: Extend Arguments (❌ Not Recommended)

**Approach**: Make `Argument` model more complex — allow nested sub-arguments, multi-layered premises, compound conclusions.

**Pros**:
- Single model to learn
- Stays within AIF paradigm

**Cons**:
- ❌ **Breaks AIF compliance** — AIF assumes atomic I/RA/CA nodes
- ❌ **Violates separation of concerns** — mixes logical structure with rhetorical composition
- ❌ **Complicates dialogue moves** — how do you challenge a "nested argument"?
- ❌ **Harder to verify** — semantic labeling (grounded/preferred) works on DAGs, not nested trees
- ❌ **Schema explosion** — your already-complex ArgumentEdge/ClaimEdge system gets worse

**Verdict**: Don't do this. Arguments should remain **atomic, AIF-compliant reasoning steps**.

---

### Option B: Enhance TheoryWorks (✅ Recommended for Academic Use)

**Approach**: TheoryWorks already have structured scaffolding (DN/IH/TC/OP). Make them first-class citizens in deliberations by:
- Allowing inline composition of claims/arguments into the `body` field
- Adding rich citation system to link formal primitives
- Creating a "Theory Composer" UI that lets users drag verified claims/arguments into prose sections

**Pros**:
- ✅ **Already exists** — you have the schema (`TheoryWork`, `TheoryWorkClaim`, `WorkDNProject`, etc.)
- ✅ **Rigorous by default** — forces users to ground prose in verified primitives
- ✅ **Cross-deliberation reuse** — Works can cite claims/arguments from multiple deliberations
- ✅ **Natural for academic discourse** — DN/IH/TC/OP frameworks align with how scholars build knowledge

**Implementation**:
```prisma
model TheoryWork {
  id              String   @id @default(cuid())
  title           String
  slug            String   @unique
  theoryType      TheoryType  // DN | IH | TC | OP
  
  // Current fields
  body            String?  // Markdown with special syntax for embedding claims
  standardOutput  String?  // Generated standard-form representation
  
  // NEW: Rich composition
  sections        TheorySection[]  // Ordered sections with mixed prose + formal elements
  bibliography    TheoryWorkCitation[]  // Already exists!
  
  // Provenance
  deliberationId  String?
  authorId        String
  
  status          WorkStatus  // DRAFT | ACTIVE | PUBLISHED
  publishedAt     DateTime?
}

model TheorySection {
  id          String  @id @default(cuid())
  workId      String
  work        TheoryWork @relation(fields: [workId], references: [id])
  
  order       Int
  title       String?
  sectionType SectionType  // PROSE | CLAIM_BLOCK | ARGUMENT_BLOCK | EVIDENCE | DISCUSSION
  
  // For prose sections
  content     String?  // Rich text (TipTap JSON)
  
  // For formal sections
  claimIds    String[]  // References to Claim.id
  argumentIds String[]  // References to Argument.id
  
  // Metadata
  role        SectionRole  // THESIS | PREMISE | EXCEPTION | COUNTER | SYNTHESIS
  meta        Json?
  
  @@index([workId, order])
}

enum SectionType {
  PROSE           // Free-form text with glossary/citation support
  CLAIM_BLOCK     // Display verified claims with labels (IN/OUT/UNDEC)
  ARGUMENT_BLOCK  // Display argument with scheme + CQ status
  EVIDENCE        // Citations, sources, data
  DISCUSSION      // Analysis/interpretation
}

enum SectionRole {
  THESIS       // Main claim being defended
  PREMISE      // Supporting reason
  EXCEPTION    // Qualification/boundary condition
  COUNTER      // Anticipated objection + response
  SYNTHESIS    // Integration of multiple lines
}
```

**UI Flow**:
1. User creates TheoryWork, selects type (DN/IH/TC/OP)
2. Composer shows structured sections (like your PracticalBuilder)
3. User can:
   - Write prose in rich text editor (TipTap)
   - Insert "Claim Block" — search deliberation, pick verified claim, shows with label + support/attack edges
   - Insert "Argument Block" — embed full argument with premises + scheme + CQ status
   - Insert "Evidence Block" — citation collector (reuse your `CitationCollector`)
4. Preview shows polished "thesis" with formal skeleton + prose connective tissue
5. Publish → generates PDF dossier (you already have `/api/works/[id]/dossier`)

**Example**:
```markdown
# On the Ethics of AI Alignment (DN Theory)

## Section 1: Thesis (PROSE)
[Rich text: "I argue that AI alignment is a moral imperative..."]

## Section 2: Empirical Grounding (CLAIM_BLOCK)
[Embedded Claim #c_123: "Current LLMs exhibit goal misalignment"]
  - Status: IN (grounded)
  - Supported by: Arg #a_456 (Expert Opinion scheme)
  - Attacked by: Arg #a_789 (rebuts conclusion)

## Section 3: Normative Framework (ARGUMENT_BLOCK)
[Embedded Argument #a_456]
  Scheme: Argument from Practical Reasoning
  Premises:
    - Claim #c_234: "Misaligned AI poses existential risk"
    - Claim #c_345: "We can mitigate risk through research"
  Conclusion: "We ought to invest in alignment research"
  CQ Status: 3/5 answered

## Section 4: Anticipated Objections (COUNTER + PROSE)
[Rich text: "Critics might object that..."]
[Embedded Argument #a_890: Counter-argument]
[Rich text: "However, this fails to account for..."]
```

---

### Option C: Create New "Brief" Model (✅ Recommended for Legal/Debate Use)

**Approach**: Model after legal briefs — multi-tiered, multi-pronged structures where each "prong" is a complete argument chain, and the brief as a whole presents a holistic case.

**Pros**:
- ✅ **Purpose-built for case building** — explicitly models "thesis + multiple lines of support"
- ✅ **Natural for debates** — mirrors how debaters structure cases
- ✅ **Preserves atomic arguments** — Brief is a *container*, not a new argument type
- ✅ **Supports mixed formality** — can have rigorous sections + rhetorical sections

**Schema**:
```prisma
model Brief {
  id              String   @id @default(cuid())
  title           String
  slug            String   @unique
  
  // Core structure
  thesisClaimId   String   // The main claim being defended
  thesisClaim     Claim    @relation("BriefThesis", fields: [thesisClaimId], references: [id])
  
  // Multi-pronged structure
  prongs          BriefProng[]  // Each prong is a line of support
  sections        BriefSection[]  // Prose sections (intro, conclusion, etc.)
  
  // Context
  deliberationId  String?
  authorId        String
  
  // Versioning
  status          BriefStatus  // DRAFT | SUBMITTED | PUBLISHED
  version         Int          @default(1)
  publishedAt     DateTime?
  
  // Metadata
  template        BriefTemplate  // LEGAL_DEFENSE | POLICY_CASE | ACADEMIC_THESIS
  meta            Json?
}

model BriefProng {
  id          String  @id @default(cuid())
  briefId     String
  brief       Brief   @relation(fields: [briefId], references: [id])
  
  order       Int
  title       String  // "Prong 1: Economic Benefits"
  role        ProngRole  // SUPPORT | REBUT | PREEMPT
  
  // Logical structure
  mainClaimId String?  // Optional sub-claim for this prong
  mainClaim   Claim?   @relation(fields: [mainClaimId], references: [id])
  
  // Argument chain
  arguments   BriefProngArgument[]  // Ordered list of arguments
  
  // Prose framing
  introduction String?  // Rich text intro for this prong
  conclusion   String?  // Rich text summary
  
  @@index([briefId, order])
}

model BriefProngArgument {
  id          String  @id @default(cuid())
  prongId     String
  prong       BriefProng @relation(fields: [prongId], references: [id])
  
  argumentId  String
  argument    Argument @relation(fields: [argumentId], references: [id])
  
  order       Int
  role        ArgumentRole  // PREMISE | INFERENCE | COUNTER_RESPONSE
  note        String?  // Optional annotation
  
  @@unique([prongId, argumentId])
  @@index([prongId, order])
}

model BriefSection {
  id          String  @id @default(cuid())
  briefId     String
  brief       Brief   @relation(fields: [briefId], references: [id])
  
  order       Int
  sectionType BriefSectionType  // INTRODUCTION | BACKGROUND | CONCLUSION
  title       String?
  content     String  // Rich text (TipTap JSON)
  
  @@index([briefId, order])
}

enum BriefTemplate {
  LEGAL_DEFENSE    // "Defendant is not guilty because..."
  POLICY_CASE      // "We should adopt policy X because..."
  ACADEMIC_THESIS  // "My thesis is X, supported by..."
  GENERAL          // Freeform
}

enum ProngRole {
  SUPPORT   // Affirmative line of reasoning
  REBUT     // Counter opposing argument
  PREEMPT   // Address anticipated objection
}

enum ArgumentRole {
  PREMISE          // Establishes a premise
  INFERENCE        // Links premises to conclusion
  COUNTER_RESPONSE // Responds to counter-argument
}

enum BriefSectionType {
  INTRODUCTION
  BACKGROUND
  LEGAL_STANDARD  // For legal briefs
  CONCLUSION
  APPENDIX
}
```

**UI Flow**:
1. User creates Brief, selects template (Legal Defense, Policy Case, etc.)
2. Defines thesis claim (or selects existing claim)
3. Adds prongs:
   - "Prong 1: Economic Benefits"
     - Writes intro prose
     - Drags verified arguments into ordered list
     - Each argument shows: premises (as claim chips), scheme, CQ status
     - Writes conclusion prose
   - "Prong 2: Environmental Impact"
     - [Same structure]
   - "Prong 3: Responds to Cost Objection"
     - Role: PREEMPT
     - Links to opposing argument, then shows counter-argument chain
4. Adds prose sections (intro, background, conclusion)
5. Preview shows:
   - Outline view (collapsible prongs)
   - Full view (renders like legal brief)
   - Logical view (CEG graph of all claims/arguments)

**Example Brief Structure**:
```
BRIEF: "Climate Policy X Should Be Adopted"
├─ INTRODUCTION (prose)
├─ PRONG 1: Economic Benefits (SUPPORT)
│  ├─ Intro: "Policy X will create jobs because..."
│  ├─ Argument Chain:
│  │  ├─ Arg #a_100: Expert testimony on job creation
│  │  ├─ Arg #a_101: Data from pilot programs
│  │  └─ Arg #a_102: Economic modeling results
│  └─ Conclusion: "Thus, economic benefits are substantial."
├─ PRONG 2: Environmental Impact (SUPPORT)
│  ├─ Intro: "Policy X will reduce emissions..."
│  ├─ Argument Chain:
│  │  ├─ Arg #a_200: Scientific consensus on climate impact
│  │  └─ Arg #a_201: Policy mechanisms analysis
│  └─ Conclusion: "Environmental gains outweigh costs."
├─ PRONG 3: Addresses Cost Objection (PREEMPT)
│  ├─ Intro: "Critics argue X is too expensive, but..."
│  ├─ Opposing Arg #a_999 (embedded for context)
│  ├─ Counter Chain:
│  │  ├─ Arg #a_300: Long-term cost-benefit analysis
│  │  └─ Arg #a_301: Comparison to status quo
│  └─ Conclusion: "Cost concerns are overstated."
└─ CONCLUSION (prose)
```

---

## Hybrid Recommendation: TheoryWorks + Briefs

**Best approach**: Support **both models**, differentiated by use case:

| Feature | TheoryWork (Academic) | Brief (Legal/Debate) |
|---------|----------------------|---------------------|
| **Primary Use** | Scholarship, research papers | Advocacy, legal cases, policy debates |
| **Structure** | DN/IH/TC/OP scaffolds | Multi-pronged argument structure |
| **Formality** | High (theory-driven) | Mixed (formal skeleton + rhetoric) |
| **Composition** | Sections with embedded formal elements | Prongs with argument chains + prose framing |
| **Output** | PDF dossier, LaTeX export | Brief document, presentation deck |
| **Integration** | Links to KB pages, citations | Links to deliberation claims/arguments |

**Shared Infrastructure**:
- Both use same `Claim` and `Argument` primitives
- Both use `CitationCollector` for evidence
- Both use TipTap for prose sections
- Both can export to PDF (reuse your dossier endpoint)
- Both respect AIF protocols (embedded arguments show CQ status, labels)

---

## Implementation Roadmap

### Phase 1: Enhanced TheoryWorks (2-3 weeks)
**Goal**: Make TheoryWorks a viable composition tool

**Tasks**:
1. **Schema**: Add `TheorySection` model (see Option B above)
2. **UI**: Build "Theory Composer" component
   - Reuse your `ArticleEditor` TipTap setup
   - Add sidebar with claim/argument search
   - Drag-and-drop to insert formal blocks
3. **Rendering**: Extend `/works/[slug]` page to render mixed sections
4. **Export**: Enhance `/api/works/[id]/dossier` to handle new structure

**Acceptance**:
- User can create DN Theory with 3 prose sections + 2 embedded claim blocks
- Preview shows claims with semantic labels (IN/OUT/UNDEC)
- PDF export includes formal annotations

---

### Phase 2: Brief Model (3-4 weeks)
**Goal**: Enable legal-style case building

**Tasks**:
1. **Schema**: Implement `Brief`, `BriefProng`, `BriefProngArgument`, `BriefSection`
2. **API**: REST endpoints (`/api/briefs`, `/api/briefs/[id]`, `/api/briefs/[id]/prongs`)
3. **UI**: Build "Brief Composer"
   - Template selector (Legal Defense, Policy Case, etc.)
   - Prong editor with drag-drop argument ordering
   - Prose editor for intro/conclusion
4. **Rendering**: `/brief/[slug]` page with outline + full views
5. **Export**: PDF generation for briefs

**Acceptance**:
- User can create 3-prong policy case with 5 total arguments
- Each prong shows verified claims + scheme info
- Export produces clean PDF brief

---

### Phase 3: Integration & Cross-Pollination (1-2 weeks)
**Goal**: Connect Briefs/TheoryWorks to deliberations

**Tasks**:
1. **Discoverability**: "Promote to Brief" button on ClaimMiniMap
2. **Reuse**: "Cite in Theory" action on ArgumentCard
3. **Navigation**: Backlinks (show which Briefs/Works cite a claim)
4. **Notifications**: Alert users when cited claim's status changes (IN → OUT)

---

## UI/UX Patterns

### 1. Claim Block Component
```tsx
<ClaimBlock claimId="c_123">
  <ClaimText>Current LLMs exhibit goal misalignment</ClaimText>
  <ClaimLabel status="IN" semantics="grounded" />
  <ClaimSupport>
    <ArgumentChip id="a_456" role="support" />
    <ArgumentChip id="a_789" role="attack" />
  </ClaimSupport>
  <ClaimActions>
    <button>View Full Graph</button>
    <button>Challenge</button>
  </ClaimActions>
</ClaimBlock>
```

### 2. Argument Block Component
```tsx
<ArgumentBlock argumentId="a_456">
  <ArgumentScheme name="Expert Opinion" />
  <ArgumentPremises>
    <ClaimChip id="c_234" role="premise" />
    <ClaimChip id="c_345" role="premise" />
  </ArgumentPremises>
  <ArgumentConclusion claimId="c_567" />
  <CQStatus answered={3} total={5} />
  <ArgumentActions>
    <button>View Dialogue</button>
    <button>Add Grounds</button>
  </ArgumentActions>
</ArgumentBlock>
```

### 3. Prong Editor
```tsx
<ProngEditor prongId="prong_1">
  <ProngHeader>
    <input placeholder="Prong title..." />
    <select>{/* SUPPORT | REBUT | PREEMPT */}</select>
  </ProngHeader>
  
  <TipTapEditor placeholder="Introduction prose..." />
  
  <ArgumentList droppable>
    <ArgumentCard id="a_100" draggable />
    <ArgumentCard id="a_101" draggable />
    <button>+ Add Argument</button>
  </ArgumentList>
  
  <TipTapEditor placeholder="Conclusion prose..." />
</ProngEditor>
```

---

## Technical Considerations

### 1. AIF Compliance
✅ **Preserved**: Briefs and TheoryWorks are *containers* that reference atomic arguments. Arguments themselves remain AIF-compliant I/RA/CA nodes.

### 2. Semantic Labeling
✅ **Still works**: Claims maintain their labels (IN/OUT/UNDEC). When a claim is embedded in a Brief/TheoryWork, its current label is displayed. If label changes (due to new attacks), the containing document can show a notification.

### 3. Dialogue Moves
✅ **Still works**: Embedded arguments can be challenged via dialogue moves. The challenge creates a new DialogueMove linked to the argument, which appears in the original deliberation's dialogue history.

### 4. Cross-Deliberation Reuse
✅ **Enhanced**: Briefs/TheoryWorks can cite claims/arguments from *multiple* deliberations. The `WorkSourceDeliberation` and `ArgumentImport` models already support this.

### 5. Versioning
⚠️ **New challenge**: If a cited claim's text changes or label changes, how does the Brief/TheoryWork reflect this?

**Solution**: Snapshot approach
- When embedding a claim, store a `CitationSnapshot`:
  - `claimId`, `text`, `label`, `version`, `citedAt`
- Display shows: "As of Oct 26, 2025, this claim was labeled IN. Current status: OUT ⚠️"
- User can "refresh citation" to update to current version

---

## Migration Strategy

### For Existing Features
1. **Articles**: Remain unchanged. Pure prose editorial content without formal primitives.
2. **Propositions**: Remain unchanged. Informal discussion substrate.
3. **Claims**: Gain new backlinks (`citedInBriefs`, `citedInTheories`).
4. **Arguments**: Gain new relation (`briefProngArguments`).
5. **TheoryWorks**: Enhanced with new `sections` structure (backward compatible — can migrate `body` field to first prose section).

### For Users
- **Gradual adoption**: Users can continue creating arguments/claims as before
- **Opt-in composition**: "Assemble Brief" or "Write Theory" becomes new advanced feature
- **Discoverability**: Show "5 claims, 3 arguments → ready to assemble" prompts in deliberation UI

---

## Success Metrics

### Quantitative
- **Adoption**: % of deliberations that produce at least 1 Brief or TheoryWork
- **Complexity**: Avg # of prongs per Brief, avg # of sections per TheoryWork
- **Reuse**: % of claims/arguments cited in multiple compositions
- **Cross-pollination**: # of cross-deliberation citations

### Qualitative
- **User feedback**: "Briefs help me structure complex cases"
- **Exports**: # of PDF downloads (indicates "production ready" usage)
- **Credibility**: Presence of Briefs/TheoryWorks in external citations (e.g., policy documents, academic papers)

---

## Open Questions for Discussion

1. **Naming**: "Brief" vs "Case" vs "Dossier"? (I suggest "Brief" for legal connotation)

2. **Templates**: Should Brief templates be hard-coded (Legal Defense, Policy Case) or user-extensible?

3. **Collaboration**: Should Briefs support multi-author co-editing (like TheoryWorks can)?

4. **Approval**: Should Briefs require community review/endorsement before publication?

5. **Argumentation Schemes**: Should Briefs have their own "meta-schemes" (e.g., "Defense Brief Scheme" with critical questions)?

6. **Integration with Voting**: Can a Brief be the subject of a VoteSession? (e.g., "Vote on whether this Brief successfully defends the thesis")

7. **AI Assistance**: Should there be an "AI Brief Drafter" that suggests prongs/arguments based on the thesis claim?

---

## Conclusion

**Recommended Path**:
1. ✅ **Don't extend Argument model** — keep it AIF-compliant
2. ✅ **Enhance TheoryWorks** for academic use (Phase 1)
3. ✅ **Create Brief model** for legal/debate use (Phase 2)
4. ✅ **Integrate both** with deliberations (Phase 3)

This gives you:
- **Rigor** preserved (AIF skeleton intact)
- **Expressiveness** enabled (natural language connective tissue)
- **Flexibility** for different use cases (scholarship vs. advocacy)
- **Reusability** of verified primitives (claims/arguments as building blocks)

The result: Users can build **multi-tiered, multi-pronged, holistic cases** that progressively build up to a thesis, all grounded in a rigorous logical skeleton — exactly like a legal defense with many moving parts, all working together to present a strong case.

---

**Next Steps**: 
1. Review this proposal
2. Decide on naming conventions
3. Prioritize Phase 1 (TheoryWorks) vs Phase 2 (Briefs)
4. I can help scaffold the schema, API endpoints, and UI components

Let me know which direction resonates most with your vision!
