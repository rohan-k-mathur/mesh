# Ludics Phase 5 Development Roadmap

**Status**: Planning  
**Timeline**: Q4 2025 - Q1 2026  
**Goal**: Transform ludics from visualization system into interactive argumentation platform with full ASPIC+ formal semantics integration  
**Last Updated**: November 6, 2025

---

## Overview

Phase 5 builds on the foundation of **Phase 4** (cross-scope references, delocation/fax, forest view, semantic annotations) and **Phase 1e** (ASPIC+ metadata preservation through Ludics compilation) to create a fully interactive formal argumentation system. Users can now see both the ludics tree structure AND the semantic argument content with formal ASPIC+ provenance, and Phase 5 makes this bidirectional—allowing users to interact with arguments through both views while maintaining rigorous formal semantics.

### Key Innovations
- **Bidirectional Interaction**: Click on semantic content → create ludic moves; click on ludic acts → view semantic details with ASPIC+ provenance
- **Commitment Tracking with ASPIC+ Theory**: System maintains explicit record of what each participant has committed to as a formal ASPIC+ Argumentation Theory (Commitment State in Ludics theory)
- **Cross-Scope Intelligence**: Navigation, citations, and synthesis across multiple argument threads using delocation/fax mechanics
- **Scheme-Aware Challenges**: Critical questions and challenges tailored to specific argument schemes, with ASPIC+ attack types (undermining/undercutting/rebutting)
- **Formal Argumentation Semantics**: All interactions preserve ASPIC+ metadata through the full stack (DialogueMove → Ludics → AIF → Commitment State)

---

## Theoretical Foundations (NEW)

Phase 5 is grounded in three key theoretical frameworks:

### 1. Ludics Theory (Girard)
**Key Concepts**:
- **Actions**: Polarized primitives (positive/negative duals) with loci (addresses)
- **Chronicles**: Alternate sequences of actions (dialogue traces)
- **Designs**: Sets of chronicles (strategies/argumentation trees)
- **Interaction**: Traversal through dual designs = logical computation (cut elimination)
- **Commitment State**: Repository of Content Expressions (arguments as designs)
- **Convergence/Divergence**: Success/failure of dialogue via daimon (†) action
- **Fax Design**: Delocalization mechanism (locus substitution for cross-scope references)

**Implementation Alignment** (Phase 4 ✅):
- LudicAct = Action with polarity, locus, ramification
- LudicDesign = Design (strategy for Proponent or Opponent)
- Trace computation = Interaction/normalization
- Cross-scope references = Fax/delocation (implemented in Phase 4)

### 2. ASPIC+ Framework (Modgil & Prakken)
**Key Concepts**:
- **Arguments**: Structured (premises → conclusion) or atomic claims
- **Attack Types**: Undermining (attack premise), undercutting (attack inference), rebutting (attack conclusion)
- **Defeat**: Attack + preferences → defeat status
- **Argumentation Theory**: KB (knowledge base) + rules + preferences
- **Acceptability**: Arguments accepted if all attacks defeated

**Implementation Alignment** (Phase 0-1e ✅):
- ASPIC+ core library (5,534 lines)
- Critical Questions → ASPIC+ attacks (Phase 1c)
- ASPIC+ metadata preserved through Ludics (Phase 1e)
- AIF CA-nodes generated with full provenance (Phase 1e)

### 3. Integration: Ludics ↔ ASPIC+
**Key Mappings**:
- **Ludics Interaction** = ASPIC+ Defeat Computation
- **Commitment State** = ASPIC+ Argumentation Theory
- **Chronicle** = Sequence of attacks/defenses
- **Convergence** = Argument accepted (no defeat)
- **Divergence** = Argument defeated (attack succeeded)
- **Design** = Argumentation tree with attack structure

**Phase 5 Goal**: Make this integration interactive and bidirectional

---

## Phase 5A: Critical Interaction Improvements
**Priority**: HIGHEST  
**Estimated Time**: 2-3 weeks  
**Dependencies**: Phase 4 complete ✅, Phase 1e complete ✅

### 5A.1 Interactive Challenge Creation from Scheme View ⭐ START HERE

**Problem**: Users can see arguments in the scheme view but must switch contexts to challenge them. The flow is: view argument → close panel → find dialog actions → create challenge → recompile → view result.

**Solution**: Direct action buttons in `ArgumentSchemeView` that create challenges inline with ASPIC+ attack computation.

#### Theoretical Foundation
- **Ludics**: WHY move = negative action (−, L, I) challenging positive assertion
- **ASPIC+**: Critical Question → Attack (undermining/undercutting/rebutting)
- **Phase 1c**: CQ selection already computes ASPIC+ attack type
- **Phase 1e**: ASPIC+ metadata preserved in LudicAct.extJson.aspic

#### Implementation Tasks

**Task 5A.1.1: Add Action Buttons to ArgumentSchemeView**
- Location: `components/ludics/ArgumentSchemeView.tsx`
- Add buttons to each premise: "Ask Why?", "Challenge"
- Add buttons to conclusion: "Ask Why?", "Attack", "Accept"
- Style buttons to match participant color (emerald for P, rose for O)
- Show disabled state when user isn't active participant
- **NEW**: Display ASPIC+ attack type that will be generated (from Phase 1c CQ mapping)

```tsx
// Example UI addition with ASPIC+ indicators
<div className="premise-actions flex gap-1 mt-1">
  <button 
    onClick={() => handleWHY(premise.claimId)}
    className="text-xs px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-700"
  >
    Ask Why? <Badge>Undermining</Badge>
  </button>
  <button 
    onClick={() => handleCHALLENGE(premise.claimId)}
    className="text-xs px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-700"
  >
    Challenge <Badge>CQ</Badge>
  </button>
</div>
```

**Task 5A.1.2: Create DialogueMoveComposer Modal**
- Location: `components/ludics/DialogueMoveComposer.tsx` (NEW)
- Modal dialog for composing WHY/ATTACK/GROUNDS moves
- Pre-filled with target claim/argument
- Shows relevant Critical Questions based on scheme (from CriticalQuestion table)
- **NEW**: Display ASPIC+ attack type and target scope (premise/inference/conclusion)
- **NEW**: Show which CQ-to-attack mapping will be used (from Phase 1c)
- Preview of where act will appear in tree with formal locus address
- Submit → creates DialogueMove with ASPIC+ payload → triggers recompile → closes modal

**Task 5A.1.3: Integrate with Existing Move API**
- Use existing `/api/cqs/dialogue-move` endpoint (Phase 1c)
- Pass `targetType: 'claim'`, `targetId`, `kind: 'WHY'`
- Endpoint automatically computes ASPIC+ attack (Phase 1c logic)
- **NEW**: Verify ASPIC+ metadata in DialogueMove.payload
- Handle response and trigger design refresh
- Show toast notification with link to new act in tree
- **NEW**: Display ASPIC+ attack type in toast (e.g., "Undermining attack created")

**Task 5A.1.4: Add Live Preview with Locus Prediction**
- Before submitting, show preview of where act will appear
- Highlight the target locus in the tree view
- Show formal locus address (e.g., "Will create act at locus 0.1.1")
- Show "Opponent will respond at 0.1.1" type of message
- **NEW**: Preview ASPIC+ metadata that will be stored in LudicAct.extJson.aspic
- **NEW**: Show resulting AIF CA-node structure that will be generated

**Testing Checklist**:
- [ ] Click "Ask Why" on premise → modal opens with claim prefilled
- [ ] Modal displays correct ASPIC+ attack type based on CQ selection
- [ ] Submit WHY move → creates DialogueMove record with ASPIC+ payload
- [ ] Design recompiles automatically
- [ ] New opponent act appears in tree view at correct locus
- [ ] LudicAct.extJson.aspic contains ASPIC+ metadata (Phase 1e)
- [ ] Semantic annotation shows on new act
- [ ] AIF CA-node generated with attack details (Phase 1e)
- [ ] Toast notification appears with ASPIC+ attack type
- [ ] Can click toast to jump to new act location

**Success Metrics**:
- Time from "see argument" to "challenge created" reduced from ~30s to ~5s
- 80% of challenges created via inline buttons vs manual flow
- Zero confusion about where challenge will appear in tree
- **NEW**: 100% of challenges have correct ASPIC+ metadata preserved through Ludics → AIF

---

### 5A.2 Cross-Scope Navigation with Delocation Tracking

**Problem**: Users see references to other scopes (via delocation/fax) but can't easily navigate to them. Cross-scope references are displayed as metadata but aren't interactive.

**Solution**: Clickable links, visual indicators, and a scope map to navigate between related arguments using Phase 4 delocation infrastructure.

#### Theoretical Foundation
- **Ludics Fax**: Delocalization transfers designs between loci (ξ → ξ')
- **Phase 4**: `faxFromScope()` implemented, `referencedScopes` tracked
- **LudicAct.metaJson.faxed**: Metadata marks delocated acts with provenance

#### Implementation Tasks

**Task 5A.2.1: Add Clickable Scope References**
- Location: `packages/ludics-react/LociTree.tsx`
- When act has `metaJson.faxed: true`, show link icon
- Read fax metadata: `metaJson.faxedFrom.designId`, `scope`, `originalLocus`
- Click → opens modal showing source design
- Highlight the referenced locus in source tree
- **NEW**: Show ASPIC+ metadata if faxed act has attack provenance

**Task 5A.2.2: "Referenced By" Badges**
- Query: When displaying design, check `LudicDesign.referencedScopes` (Phase 4 field)
- Query reverse: Find all designs that reference current scope
- Show badge count: "🔗 Referenced by 3 other arguments"
- Click badge → shows list of referencing scopes
- Click scope → navigates to that design
- **NEW**: Indicate if reference involves ASPIC+ attack (shows attack type icon)

**Task 5A.2.3: Scope Map Visualization**
- Location: `components/ludics/ScopeMapView.tsx` (NEW)
- Force-directed graph showing scopes as nodes
- Edges represent cross-scope references from `referencedScopes` field
- **NEW**: Edge style indicates relationship type:
  - Solid line: Fax/delocation (formal reference)
  - Dashed line: Citation (informal mention)
  - Red arrow: ASPIC+ attack across scopes
- Node size proportional to number of acts
- Node color by dominant participant (more P acts = green, more O acts = red)
- **NEW**: Node badge shows convergence status (†=converged, ⚡=diverged, •=ongoing)
- Click node → opens that scope's design view

**Task 5A.2.4: Breadcrumb Navigation**
- Show current scope path at top of design view
- "Topic: Argument A → Topic: Argument B → Current"
- Click any breadcrumb to navigate back

**Testing Checklist**:
- [ ] Faxed act (metaJson.faxed=true) shows clickable link icon
- [ ] Click link → modal opens with source design
- [ ] Source design highlights the referenced locus
- [ ] "Referenced By" badge shows correct count from referencedScopes
- [ ] Scope map renders all scopes as connected graph
- [ ] Scope map uses Phase 4 referencedScopes for edges
- [ ] Edge styles distinguish fax vs citation vs attack
- [ ] Node convergence badges show correct status (†/⚡/•)
- [ ] Clicking scope node navigates to that design
- [ ] Breadcrumb trail shows navigation history
- [ ] ASPIC+ attack indicators visible on cross-scope attacks

---

### 5A.3 Commitment Store Visualization (ASPIC+ Argumentation Theory)

**Problem**: Ludics tracks what's been asserted and challenged, but there's no explicit view of what each participant has *committed to*. When someone CONCEDEs a point or implicitly accepts a claim, this commitment should be visible as a formal ASPIC+ Argumentation Theory.

**Solution**: Dedicated "Commitments" panel showing what each participant has committed to, with conflict detection using ASPIC+ defeat computation.

#### Theoretical Foundation
- **Ludics Commitment State**: Repository of Content Expressions (arguments as designs)
- **ASPIC+**: Argumentation Theory = (KB, Rules, Preferences)
- **Convergence**: Commitment states are consistent (no contradictions)
- **Divergence**: Commitment states conflict (logical inconsistency)
- **Integration**: Commitment State IS the ASPIC+ Argumentation Theory for each participant

#### Implementation Tasks

**Task 5A.3.1: Create CommitmentStore Backend**
- Location: `packages/ludics-engine/commitments.ts` (NEW)
- Track commitments per participant per scope as ASPIC+ Argumentation Theory
- Commitment types:
  - `EXPLICIT_ASSERT`: Directly asserted via ASSERT move → ASPIC+ Argument
  - `EXPLICIT_CONCEDE`: Explicitly conceded via CONCEDE move → KB fact
  - `IMPLICIT_ACCEPT`: Implicitly accepted (challenged but then dropped) → KB fact
  - `CONDITIONAL`: Committed in SUPPOSE/DISCHARGE hypothetical scope → Conditional argument
- **NEW**: Store as ASPIC+ structures (Arguments, KB, Rules)

```typescript
interface Commitment {
  participantId: 'Proponent' | 'Opponent';
  type: 'EXPLICIT_ASSERT' | 'EXPLICIT_CONCEDE' | 'IMPLICIT_ACCEPT' | 'CONDITIONAL';
  
  // Link to dialogue
  claimId: string;
  locusPath: string;
  timestamp: Date;
  scope: string;
  conditionalOn?: string; // If CONDITIONAL, the SUPPOSE locus
  
  // ASPIC+ formal representation (NEW)
  aspicArgument?: {
    id: string;
    premises: string[];
    conclusion: string;
    defeasible: boolean;
  };
  aspicKBFact?: string; // For conceded/accepted facts
}
```

**Task 5A.3.2: Commitment Inference Algorithm**
- After compilation, run commitment extraction
- Rules:
  - ASSERT → adds EXPLICIT_ASSERT commitment (ASPIC+ Argument)
  - CONCEDE → adds EXPLICIT_CONCEDE commitment to conceding party (KB fact)
  - WHY followed by no response for N moves → opponent IMPLICIT_ACCEPT (KB fact)
  - SUPPOSE → marks all subsequent assertions as CONDITIONAL until DISCHARGE
- **NEW**: Build ASPIC+ Argumentation Theory per participant:
  ```typescript
  theory = {
    kb: [...conceded facts, ...accepted facts],
    arguments: [...asserted arguments],
    rules: [...defeasible rules from arguments],
    preferences: [...preference orderings if any]
  }
  ```

**Task 5A.3.3: Commitment Conflict Detection using ASPIC+**
- Use ASPIC+ core library (Phase 0) to evaluate commitment theories
- Check for contradictions: committed to both `P` and `¬P`
- Check for scheme violations: committed to conclusion but rejected premise
- **NEW**: Compute attacks between commitments using ASPIC+ attack types
- **NEW**: Evaluate defeat status with preferences
- Flag inconsistencies with severity levels (error, warning, info)
- **NEW**: Provide formal explanation of conflicts using ASPIC+ semantics

**Task 5A.3.4: CommitmentPanel UI Component**
- Location: `components/ludics/CommitmentPanel.tsx` (NEW)
- Two columns: Proponent Commitments | Opponent Commitments
- Group by commitment type
- Show claim text with link to originating locus
- **NEW**: Display ASPIC+ structure (premises → conclusion)
- Highlight conflicts in red with ASPIC+ attack type
- Show "Common Ground" section for mutually accepted claims
- **NEW**: "View as Theory" button shows formal ASPIC+ theory structure
- **NEW**: "Evaluate Consistency" button runs ASPIC+ evaluation

**Task 5A.3.5: Add to DesignTreeView**
- Add "💎 Commitments" tab alongside Tree/Schemes/Both
- Show commitment store for current scope
- Update in real-time as moves are added

**Testing Checklist**:
- [ ] ASSERT move creates EXPLICIT_ASSERT commitment as ASPIC+ Argument
- [ ] CONCEDE move creates EXPLICIT_CONCEDE for conceding party as KB fact
- [ ] Unanswered WHY after N moves creates IMPLICIT_ACCEPT as KB fact
- [ ] SUPPOSE/DISCHARGE correctly marks CONDITIONAL commitments
- [ ] ASPIC+ theory built correctly: KB + arguments + rules
- [ ] Contradiction detection uses ASPIC+ attack computation (P and ¬P)
- [ ] Scheme violations detected via ASPIC+ structure (conclusion without premises)
- [ ] Common Ground section shows mutually accepted claims
- [ ] Commitments panel updates without page refresh
- [ ] "View as Theory" shows formal ASPIC+ notation
- [ ] "Evaluate Consistency" runs ASPIC+ evaluation and displays results
- [ ] Attack explanations use ASPIC+ attack types (undermining/undercutting/rebutting)

**Success Metrics**:
- Commitment store accurately reflects dialogue state
- Conflict detection catches 95%+ of logical contradictions using ASPIC+
- Users can quickly see "what we've agreed on so far"
- **NEW**: Formal ASPIC+ theory can be exported for external verification
- **NEW**: Consistency evaluation provides actionable feedback on argument quality

---

## Phase 5B: Enhanced Scheme Integration with ASPIC+
**Priority**: HIGH  
**Estimated Time**: 2-3 weeks  
**Dependencies**: Phase 5A complete

### 5B.1 Scheme-Aware Critical Questions with ASPIC+ Attack Types

**Problem**: When challenging an argument, users must manually think of appropriate critical questions. Different schemes have standard CQs that should be suggested with their corresponding ASPIC+ attack types.

**Solution**: Auto-suggest relevant CQs based on detected argument scheme, with one-click insertion that automatically computes ASPIC+ attack metadata.

#### Theoretical Foundation
- **ArgumentScheme → CriticalQuestion**: Each scheme has associated CQs
- **CriticalQuestion → ASPIC+ Attack**: Phase 1c mapping (CQ_PREMISE_ACCEPTABILITY → undermining, etc.)
- **Provenance Chain**: CQ selection → ASPIC+ attack → Ludics metadata → AIF CA-node

#### Implementation Tasks

**Task 5B.1.1: CQ Database Expansion**
- Ensure all ArgumentSchemes have associated CriticalQuestions
- Add CQ templates with placeholders: "Is {premise1} really true?"
- **NEW**: Verify ASPIC+ attack type mapping for each CQ (from Phase 1c)
- Priority schemes: Analogy, Expert Opinion, Cause to Effect, Sign
- **NEW**: Add attack target scope (premise/inference/conclusion) to CQ metadata

**Task 5B.1.2: CQ Suggestion Engine with ASPIC+ Preview**
- Location: `lib/argumentation/cq-suggestions.ts` (NEW)
- Input: `argumentId`, `schemeKey`
- Output: Ranked list of relevant CQs with:
  - Filled-in placeholders using premise/conclusion text
  - **NEW**: ASPIC+ attack type for each CQ
  - **NEW**: Target scope indicator (which part of argument is attacked)
  - **NEW**: Expected defeat status (will attack succeed based on preferences)
- Use premise/conclusion text to populate templates

**Task 5B.1.3: Integrate into DialogueMoveComposer**
- When creating WHY move, show "Suggested Questions" section
- Click CQ → auto-fills move text
- **NEW**: Display ASPIC+ attack type badge for each CQ
- Show explanation of why this CQ is relevant
- **NEW**: Preview attack structure: "This will create an undermining attack on premise P1"
- Still allow freeform text entry
- **NEW**: Manual entry allows selecting ASPIC+ attack type from dropdown

**Task 5B.1.4: CQ Provenance Tracking with ASPIC+ Metadata**
- Store `cqId` in DialogueMove.payload (already done in Phase 1c)
- Store ASPIC+ attack metadata (already done in Phase 1c)
- Display CQ badge in act tooltip: "🤔 CQ: Is the analogy relevant? [Undercutting]"
- Link to CQ definition and scheme documentation
- **NEW**: Link to ASPIC+ attack explanation page
- **NEW**: Show full provenance: CQ → ASPIC+ → Ludics → AIF

**Testing Checklist**:
- [ ] WHY move composer shows 3-5 relevant CQs for scheme
- [ ] CQ templates have placeholders filled with actual claim text
- [ ] Each CQ displays correct ASPIC+ attack type badge
- [ ] Clicking CQ auto-fills move with that question
- [ ] ASPIC+ metadata automatically computed (Phase 1c)
- [ ] CQ provenance stored in move metadata
- [ ] Act tooltip shows which CQ was used and attack type
- [ ] LudicAct.extJson.aspic preserved through compilation (Phase 1e)
- [ ] AIF CA-node generated with CQ reference (Phase 1e)
- [ ] Works for all major schemes (Analogy, Expert, Cause, Sign)

---

### 5B.2 Premise Extraction & Linking

**Problem**: Arguments often have implicit premises not explicitly stated. Users can't easily see which locus provides evidence for which premise.

**Solution**: Allow explicit linking of loci to premises, with visual flow indicators.

#### Implementation Tasks

**Task 5B.2.1: Premise-Locus Linking API**
- New table: `PremiseLocus` linking `ArgumentPremise` to `LudicAct`
- API endpoint: `POST /api/arguments/[id]/link-premise`
- Body: `{ premiseId, actId }` or `{ premiseId, locusPath }`

**Task 5B.2.2: Visual Premise Flow in ArgumentSchemeView**
- Show which premises have backing evidence (green checkmark)
- Show which premises are unsupported (yellow warning)
- Click premise → highlights supporting locus in tree view
- Use SVG lines to connect premise cards to tree nodes

**Task 5B.2.3: Implicit Premise Detection**
- Heuristic: If conclusion follows from fewer premises than typical for scheme
- Flag potential implicit premises with "🤔 Implicit premise?"
- Allow user to explicitly add implicit premise to argument

**Task 5B.2.4: Premise Satisfaction Scoring**
- Calculate % of premises with explicit support
- Show score in argument header: "⚡ Analogy Argument (3/4 premises supported)"
- Use score to prioritize which arguments need more work

**Testing Checklist**:
- [ ] Can link act to premise via API
- [ ] ArgumentSchemeView shows green check on supported premises
- [ ] Click premise → tree view highlights supporting act
- [ ] Implicit premise detection flags missing premises
- [ ] Satisfaction score accurately reflects premise support

---

### 5B.3 Multi-Argument Synthesis

**Problem**: Complex conclusions often require synthesizing multiple arguments. THEREFORE move exists but isn't well integrated with argument visualization.

**Solution**: Enhanced THEREFORE move with multi-argument support and synthesis visualization.

#### Implementation Tasks

**Task 5B.3.1: Enhanced THEREFORE Payload**
- Extend DialogueMove payload to support multiple source arguments
- Store: `{ kind: 'THEREFORE', sourceArgumentIds: ['arg1', 'arg2'], inferenceRule: 'modus-ponens' }`

**Task 5B.3.2: Synthesis Composer UI**
- Modal for creating THEREFORE moves
- Multi-select: Choose 2+ arguments to synthesize
- Preview combined premises and resulting conclusion
- Suggest applicable inference rules (modus ponens, hypothetical syllogism, etc.)

**Task 5B.3.3: Synthesis Visualization**
- In ArgumentSchemeView, show "🔗 Synthesized from" section
- List source arguments with links
- Show inference rule applied
- Diagram showing Argument A + Argument B → Conclusion C

**Task 5B.3.4: Argument Chain Detection**
- Algorithm to detect chains: A→B, B→C
- Auto-suggest THEREFORE moves to complete chain: A→C
- Visualize chains in scope map with arrow sequences

**Testing Checklist**:
- [ ] THEREFORE composer allows selecting multiple arguments
- [ ] Synthesis creates DialogueMove with multiple sources
- [ ] ArgumentSchemeView shows "Synthesized from" section
- [ ] Chain detection finds A→B→C patterns
- [ ] Auto-suggests A→C synthesis

---

## Phase 5C: Advanced Scoping Features
**Priority**: MEDIUM  
**Estimated Time**: 3-4 weeks  
**Dependencies**: Phase 5B complete

### 5C.1 Dynamic Scope Merging

**Problem**: Sometimes multiple topic scopes are discussing the same underlying issue and should be merged. Other times, a single scope diverges into multiple sub-topics and should split.

**Solution**: Moderator tools for scope management with genealogy tracking.

#### Implementation Tasks

**Task 5C.1.1: Scope Merge Operation**
- API: `POST /api/ludics/scopes/merge`
- Body: `{ sourceScopes: ['topic:A', 'topic:B'], targetScope: 'topic:AB', reason: '...' }`
- Recompiles all moves from both scopes into single unified scope
- Preserves original scope IDs in metadata for rollback

**Task 5C.1.2: Scope Split Operation**
- API: `POST /api/ludics/scopes/split`
- Body: `{ sourceScope: 'topic:A', moveIds: [...], newScope: 'topic:A2' }`
- Moves selected moves to new scope
- Updates cross-scope references

**Task 5C.1.3: Scope Genealogy Tracking**
- New table: `ScopeGenealogy`
- Tracks: merges, splits, renames
- Show family tree of scope evolution
- "This scope was split from Topic X on Nov 4, 2025"

**Task 5C.1.4: Moderator UI**
- Location: `components/ludics/ScopeManagerPanel.tsx` (NEW)
- List all scopes with stats (moves, acts, participants)
- Checkboxes to select scopes for merge
- Visual timeline of scope history
- Undo/rollback capability

**Testing Checklist**:
- [ ] Merge operation combines two scopes correctly
- [ ] All acts from both scopes appear in merged result
- [ ] Split operation creates new scope with selected moves
- [ ] Cross-scope references update after split
- [ ] Genealogy tracks merge/split history
- [ ] Rollback restores previous state

---

### 5C.2 Actor-Pair Scoping Enhancement

**Problem**: Current actor-pair scoping is simplified (per-actor, not per-pair). True dialogues happen between specific pairs of participants.

**Solution**: Full actor-pair scoping with dialogue thread visualization.

#### Implementation Tasks

**Task 5C.2.1: Actor-Pair Scope Computation**
- Location: `packages/ludics-engine/compileFromMoves.ts`
- Enhance `computeScopes` for actor-pair strategy
- Scope key: `actors:alice:bob` (sorted alphabetically for consistency)
- Group moves by unique participant pairs

**Task 5C.2.2: Dialogue Thread Visualization**
- Show deliberation as network of participant interactions
- Node = participant, Edge = dialogue thread, Edge weight = # of moves exchanged
- Click edge → shows all moves in that actor-pair scope

**Task 5C.2.3: Multi-Party Dialogue Support**
- Extend beyond pair: `actors:alice:bob:charlie`
- Show as triangle/polygon in visualization
- Handle turn-taking rules (who can respond when)

**Testing Checklist**:
- [ ] Actor-pair scoping creates separate designs per pair
- [ ] Alice-Bob moves separate from Alice-Charlie moves
- [ ] Dialogue thread visualization shows participant network
- [ ] Click thread edge → displays that pair's dialogue
- [ ] Multi-party scopes render as polygons

---

### 5C.3 Scope-Based Permissions

**Problem**: All deliberations are currently equally visible. Some arguments should be private, some collaborative, some public.

**Solution**: Permission system at scope level with visibility controls.

#### Implementation Tasks

**Task 5C.3.1: Scope Permission Schema**
- Add to `LudicDesign`: `scopePermissions: { visibility: 'public' | 'trusted' | 'private', allowedActors: string[] }`
- Enforce at API level: only allowed participants can view/modify

**Task 5C.3.2: Sealed Arguments**
- Arguments can be marked "sealed" until conditions met
- Conditions: time-based, event-based, consensus-based
- Show as "🔒 Sealed" in UI, reveal when conditions satisfied

**Task 5C.3.3: Collaborative Construction**
- Multiple participants can edit same argument within a scope
- Track contributions: "Premise 1 by Alice, Premise 2 by Bob"
- Voting on whether to ASSERT the collaborative argument

**Testing Checklist**:
- [ ] Private scopes only visible to allowedActors
- [ ] Sealed arguments hide content until condition met
- [ ] Multiple users can contribute to same argument
- [ ] Contribution tracking shows who added what

---

## Phase 5D: Performance & Scale
**Priority**: MEDIUM-LOW (Technical Debt)  
**Estimated Time**: 2-3 weeks  
**Dependencies**: Phase 5A-C producing real load

### 5D.1 Incremental Compilation

**Problem**: Full recompilation on every move is expensive for large deliberations. A 100-move deliberation recompiles all 100 moves even when only 1 new move is added.

**Solution**: Incremental compilation that only processes affected scopes.

#### Implementation Tasks

**Task 5D.1.1: Compilation Invalidation Strategy**
- Track last compilation timestamp per scope
- On new move, only recompile affected scope(s)
- Cross-scope references may require multi-scope recompile

**Task 5D.1.2: Scope-Level Compilation Cache**
- Cache compiled designs by scope key + version hash
- Version hash = hash of all move IDs in scope
- Hit cache if version matches, otherwise recompile

**Task 5D.1.3: Smart Cross-Scope Recompilation**
- If Scope A references Scope B, and B is recompiled:
  - Invalidate A's cache
  - Recompile A with updated B references
- Build dependency graph of scopes

**Testing Checklist**:
- [ ] Adding move to Scope A doesn't recompile Scope B (if no dependency)
- [ ] Cache hit rate > 80% for stable scopes
- [ ] Compilation time for 100-move delib < 1s for incremental
- [ ] Full recompile still works correctly

---

### 5D.2 Pagination & Lazy Loading

**Problem**: Large deliberations (1000+ acts) cause browser slowdown. Rendering all acts at once is inefficient.

**Solution**: Virtualized rendering and lazy loading of tree branches.

#### Implementation Tasks

**Task 5D.2.1: Virtual Scrolling for LociTree**
- Use `react-window` or similar for virtualization
- Only render visible tree nodes + buffer
- Maintain scroll position and expansion state

**Task 5D.2.2: Lazy Branch Loading**
- Initially load only root + first 2 levels
- Show "Load more..." at collapsed branches
- Fetch additional acts on demand

**Task 5D.2.3: Streaming Compilation Results**
- Use Server-Sent Events or WebSockets
- Stream compiled designs as they're ready
- Show progress: "Compiled 3/10 scopes..."

**Testing Checklist**:
- [ ] 1000-act tree renders smoothly (60fps)
- [ ] Memory usage stays constant (no leaks)
- [ ] Lazy loading fetches only visible branches
- [ ] Streaming compilation shows real-time progress

---

### 5D.3 Semantic Annotation Caching

**Problem**: Semantic API fetches claims/arguments on every request. For stable arguments, this is wasteful.

**Solution**: Pre-compute and cache semantic annotations during compilation.

#### Implementation Tasks

**Task 5D.3.1: Store Annotations in LudicAct**
- During compilation, fetch semantic data
- Store in `LudicAct.extJson.semanticCache`
- Include claim text, argument scheme, premises, conclusion

**Task 5D.3.2: Cache Invalidation**
- When underlying Claim or Argument is updated:
  - Mark all related LudicActs as `semanticCacheDirty: true`
  - Background job recomputes and updates cache
- Show stale indicator if cache is dirty

**Task 5D.3.3: Hybrid API Approach**
- Try cache first: read from `extJson.semanticCache`
- If cache miss or dirty: fetch from database
- Update cache asynchronously

**Testing Checklist**:
- [ ] Semantic API uses cache when available
- [ ] Cache invalidation triggers on claim/argument update
- [ ] API response time < 100ms for cached data
- [ ] Stale data indicator shows when cache is dirty

---

## Success Metrics (Overall Phase 5)

### User Experience
- **Challenge Creation Time**: < 5 seconds from viewing argument to creating challenge
- **Navigation Efficiency**: < 2 clicks to reach any related argument in multi-scope deliberation
- **Commitment Clarity**: 100% of participants can correctly state what they've committed to
- **Scheme Coverage**: 90%+ of arguments use appropriate CQs when challenged

### Technical Performance
- **Compilation Speed**: < 1s for incremental compile, < 5s for full recompile (100-move delib)
- **UI Responsiveness**: 60fps rendering for trees with 500+ acts
- **Cache Hit Rate**: > 80% for semantic annotations
- **API Latency**: p95 < 200ms for all ludics endpoints

### Platform Growth
- **Adoption**: 50+ active deliberations using ludics by end of Phase 5
- **Argument Density**: Average 20+ arguments per deliberation (up from 5)
- **Cross-Scope Links**: 30% of arguments reference other scopes
- **Synthesis Rate**: 10% of conclusions synthesized from multiple arguments

---

## Implementation Order

### Week 1-2: Phase 5A.1 (Interactive Challenge Creation) ⭐ HIGH IMPACT
- Build foundation for all interactive features
- Immediate user value: faster challenge creation
- Tests integration with existing API

### Week 3-4: Phase 5A.2 (Cross-Scope Navigation)
- Enables multi-argument reasoning
- Required for Phase 5B.3 (synthesis)
- High value for complex deliberations

### Week 5-6: Phase 5A.3 (Commitment Store)
- Critical for tracking dialogue state
- Enables conflict detection
- Foundation for Phase 5C permissions

### Week 7-8: Phase 5B.1 (Scheme-Aware CQs)
- Improves argument quality
- Leverages existing CQ database
- Easy win with high impact

### Week 9-10: Phase 5B.2 (Premise Linking)
- Visual polish on argument flow
- Helps users understand argument structure
- Prepares for Phase 5B.3

### Week 11-12: Phase 5B.3 (Multi-Argument Synthesis)
- Advanced feature for power users
- Requires 5A.2 and 5B.2 complete
- Demonstrates full platform capability

### Week 13+: Phase 5C & 5D (As needed based on load)
- Phase 5C: Deploy when multi-topic deliberations become common
- Phase 5D: Deploy when performance becomes issue

---

## Risk Mitigation

### Technical Risks
- **Risk**: Incremental compilation introduces bugs vs full recompile
  - **Mitigation**: Maintain both paths, A/B test with feature flag
  
- **Risk**: Cross-scope references create circular dependencies
  - **Mitigation**: Detect cycles, limit reference depth to 3 levels
  
- **Risk**: Caching causes stale data issues
  - **Mitigation**: Conservative invalidation, show staleness indicators

### Product Risks
- **Risk**: Too many UI buttons/features overwhelm users
  - **Mitigation**: Progressive disclosure, role-based UI hiding
  
- **Risk**: Interactive features bypass important validation
  - **Mitigation**: All actions still go through existing API with full validation
  
- **Risk**: Advanced features only used by 10% of users
  - **Mitigation**: Make Phase 5A (basics) rock-solid, treat 5B/5C as optional power features

---

## Dependencies & Prerequisites

### Completed Foundations (✅ Ready for Phase 5)

**Phase 0: ASPIC+ Core (5,534 lines, 63 tests)**
- Complete ASPIC+ framework implementation
- Attack computation (undermining/undercutting/rebutting)
- Defeat status evaluation with preferences
- Argumentation theory evaluation
- APIs: `/api/aspic/*` endpoints

**Phase 1a: ASPIC+ API Endpoints (200 lines)**
- Theory management endpoints
- Evaluation and querying APIs
- Full ASPIC+ computation available

**Phase 1b: AIF Evaluation Endpoint (188 lines)**
- `/api/aif/evaluate` for AIF → ASPIC+ conversion
- Bidirectional translation working

**Phase 1c: CQ → DialogueMove Integration (463 lines)**
- Critical Questions compute ASPIC+ attacks
- CQ selection → attack type mapping
- DialogueMove.payload contains ASPIC+ metadata
- ConflictApplication creation with ASPIC+ fields

**Phase 1d: ConflictApplication Enhancement (192 lines)**
- Schema: `aspicAttackType`, `aspicDefeatStatus`, `aspicMetadata` fields
- Helper library: `lib/aspic/conflictHelpers.ts`
- Standardized metadata computation

**Phase 1e: Ludics Metadata Preservation (150 lines) ✅ JUST COMPLETED**
- `compileFromMoves.ts` extracts ASPIC+ from DialogueMove
- `LudicAct.extJson.aspic` stores full ASPIC+ metadata
- `syncToAif.ts` generates CA-nodes from Ludics
- Complete provenance: CQ → DialogueMove → Ludics → AIF

**Phase 4: Scoped Designs & Forest Architecture ✅ COMPLETE**
- Cross-scope reference tracking (`referencedScopes` field)
- Delocation/Fax mechanics (`faxFromScope()` function)
- Defense tree computation per scope
- Forest view visualization
- Scope-level traces with convergence status
- Files modified: 15+ files, comprehensive testing

### External Dependencies
- Prisma schema supports DialogueMove with full metadata ✅
- `/api/cqs/dialogue-move` endpoint exists (Phase 1c) ✅
- ArgumentScheme + CriticalQuestion tables populated ✅
- LudicDesign has `referencedScopes` and `crossScopeActIds` fields (Phase 4) ✅
- LudicAct has `extJson` field for metadata storage ✅
- ASPIC+ core library fully functional (Phase 0) ✅

### Internal Team Dependencies
- Design review for new UI components (ArgumentSchemeView actions, commitment panel)
- Performance testing infrastructure for Phase 5D
- Documentation update for new features
- **NEW**: Review theoretical alignment documents:
  - `docs/arg-computation-research/LUDICS_THEORY_ANALYSIS_FOR_IMPLEMENTATION.md`
  - `LUDICS_THEORY_FOUNDATIONS.md`
  - `docs/arg-computation-research/Ludics- Argumentation, Inference, and Designs.txt`

### User Research Needed
- Interview 5-10 users about current challenge creation flow pain points
- Test prototype of inline action buttons with 3 users
- Survey: "What would make you use ludics more?" to prioritize 5B vs 5C
- **NEW**: Test ASPIC+ metadata visibility (do users understand attack types?)
- **NEW**: Validate Commitment Store UI (is ASPIC+ theory view useful?)

---

## Rollout Strategy

### Phase 5A.1: Canary Release
- Deploy to single test deliberation first
- Monitor for errors, gather feedback
- Iterate based on 5 user tests
- Full release after 1 week of stability

### Phase 5A.2-3: Staged Rollout
- Release to 10% of deliberations
- Monitor performance metrics
- Release to 50% after 3 days
- Full release after 1 week

### Phase 5B: Opt-In Beta
- Advanced features opt-in via settings toggle
- Gather power user feedback
- Iterate for 2 weeks
- General availability when 80% of beta users rate 4+ stars

### Phase 5C: On-Demand
- Deploy as needed when specific use cases arise
- Not forced on all users
- Documentation-driven adoption

### Phase 5D: Automatic
- Performance improvements ship silently
- No user-facing changes
- A/B test incremental compilation vs full recompile

---

## Post-Phase 5 Vision

Once Phase 5 is complete, ludics becomes:
1. **Bidirectional Formal Argumentation Platform**: See arguments, interact with arguments, track commitments with full ASPIC+ semantics
2. **Multi-Scope Reasoning Engine**: Navigate, synthesize, and manage complex argument networks using Ludics delocation
3. **Scheme-Aware Assistant**: System understands argument structure and suggests improvements with CQ-to-ASPIC+ mappings
4. **Scalable Infrastructure**: Handles 1000+ move deliberations with real-time updates and formal provenance
5. **Formal Verification Ready**: Every dialogue has complete ASPIC+ Argumentation Theory that can be exported and verified externally

This sets the stage for:
- **Phase 6**: AI-assisted argumentation (GPT suggests arguments with ASPIC+ structure, detects fallacies, recommends moves based on defeat status)
- **Phase 7**: Social features (follow arguments, notifications based on attack/defeat events, argument ratings using ASPIC+ metrics)
- **Phase 8**: External integrations (export to academic papers with formal proofs, import from debate transcripts with automatic ASPIC+ analysis)
- **Phase 9**: Advanced formal reasoning (automated consistency checking, proof search in Commitment States, argument synthesis using ASPIC+ rules)

---

## Appendix A: Key Files & Locations

### Frontend Components
- `components/ludics/ArgumentSchemeView.tsx` - Scheme display (modify for 5A.1)
- `components/ludics/DesignTreeView.tsx` - Tree view wrapper (add commitments tab for 5A.3)
- `components/ludics/DialogueMoveComposer.tsx` - NEW for 5A.1 (with ASPIC+ preview)
- `components/ludics/CommitmentPanel.tsx` - NEW for 5A.3 (displays ASPIC+ theory)
- `components/ludics/ScopeMapView.tsx` - NEW for 5A.2 (with fax/attack indicators)
- `packages/ludics-react/LociTree.tsx` - Core tree rendering (add fax interactivity for 5A.2)

### Backend Logic
- `packages/ludics-engine/compileFromMoves.ts` - Main compilation (already enhanced in Phase 1e with ASPIC+ extraction)
- `packages/ludics-engine/commitments.ts` - NEW for 5A.3 (builds ASPIC+ theories)
- `packages/ludics-engine/delocate.ts` - Fax implementation (Phase 4, enhance for ASPIC+ preservation)
- `lib/aspic/conflictHelpers.ts` - ASPIC+ metadata helpers (Phase 1d)
- `lib/aspic/core.ts` - ASPIC+ core library (Phase 0, use for commitment evaluation)
- `lib/argumentation/cq-suggestions.ts` - NEW for 5B.1
- `lib/ludics/syncToAif.ts` - AIF sync (already enhanced in Phase 1e with CA-node generation)
- `app/api/ludics/scopes/merge/route.ts` - NEW for 5C.1
- `app/api/arguments/[id]/link-premise/route.ts` - NEW for 5B.2
- `app/api/cqs/dialogue-move/route.ts` - Existing (Phase 1c, computes ASPIC+ attacks)

### Database Schema
- `DialogueMove` - Has `payload.aspicAttack` and `payload.cqId` (Phase 1c)
- `ConflictApplication` - Has `aspicAttackType`, `aspicDefeatStatus`, `aspicMetadata` (Phase 1d)
- `LudicAct` - Has `extJson.aspic` for ASPIC+ metadata (Phase 1e)
- `LudicDesign` - Has `referencedScopes`, `crossScopeActIds` (Phase 4)
- `AifNode` - CA-nodes with ASPIC+ metadata (Phase 1e)
- `PremiseLocus` - NEW table for 5B.2
- `ScopeGenealogy` - NEW table for 5C.1
- `LudicDesign` - Add `scopePermissions` for 5C.3

---

## Appendix B: Glossary

**Delocation (Fax)**: Importing an act from one scope into another scope, preserving provenance (Ludics theory operation ξ → ξ')  
**Topic Scoping**: Grouping moves by argument/topic rather than actor or timeline  
**Commitment Store**: Explicit record of what each participant has asserted/accepted/conceded, stored as ASPIC+ Argumentation Theory  
**Critical Question (CQ)**: Standard challenge specific to an argument scheme  
**ASPIC+ Attack Types**: Undermining (attack premise), undercutting (attack inference), rebutting (attack conclusion)  
**Defeat**: Attack that succeeds based on preference ordering  
**Premise Linking**: Connecting a ludic act to a specific premise of an argument  
**Synthesis**: Combining multiple arguments to derive a new conclusion  
**Scope Merge**: Combining two separate argument threads into one unified scope  
**Incremental Compilation**: Recompiling only affected scopes rather than entire deliberation  
**Convergence**: Ludics interaction reaches daimon (†), indicating successful resolution  
**Divergence**: Ludics interaction fails (ramification mismatch), indicating logical conflict  
**Chronicle**: Sequence of alternating positive/negative actions in Ludics (dialogue trace)  
**Design**: Set of chronicles representing a participant's strategy (Ludics argumentation tree)  
**Locus**: Address in Ludics tree (e.g., 0.1.2), location where action occurs  
**CA-node**: Conflict Application node in AIF graph, represents ASPIC+ attack relationship  
**Provenance Chain**: Full trace of formal semantics from CQ → DialogueMove → Ludics → AIF  

---

**Document Version**: 2.0  
**Last Updated**: November 6, 2025 (Updated post-Phase 1e completion and Phase 4 integration)  
**Next Review**: After Phase 5A.1 completion  
**Maintainer**: Ludics Development Team  
**Theoretical Foundations**: See `docs/arg-computation-research/LUDICS_THEORY_ANALYSIS_FOR_IMPLEMENTATION.md` and `LUDICS_THEORY_FOUNDATIONS.md`

