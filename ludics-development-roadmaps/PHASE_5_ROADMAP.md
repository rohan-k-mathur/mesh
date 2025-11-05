# Ludics Phase 5 Development Roadmap

**Status**: Planning  
**Timeline**: Q4 2025 - Q1 2026  
**Goal**: Transform ludics from visualization system into interactive argumentation platform with full semantic integration

---

## Overview

Phase 5 builds on the foundation of Phase 4 (topic scoping, cross-scope references, semantic annotations) to create a fully interactive argumentation system. Users can now see both the ludics tree structure AND the semantic argument content, and Phase 5 makes this bidirectional—allowing users to interact with arguments through both views.

### Key Innovations
- **Bidirectional Interaction**: Click on semantic content → create ludic moves; click on ludic acts → view semantic details
- **Commitment Tracking**: System maintains explicit record of what each participant has committed to
- **Cross-Scope Intelligence**: Navigation, citations, and synthesis across multiple argument threads
- **Scheme-Aware Challenges**: Critical questions and challenges tailored to specific argument schemes

---

## Phase 5A: Critical Interaction Improvements
**Priority**: HIGHEST  
**Estimated Time**: 2-3 weeks  
**Dependencies**: Phase 4 complete

### 5A.1 Interactive Challenge Creation from Scheme View ⭐ START HERE

**Problem**: Users can see arguments in the scheme view but must switch contexts to challenge them. The flow is: view argument → close panel → find dialog actions → create challenge → recompile → view result.

**Solution**: Direct action buttons in `ArgumentSchemeView` that create challenges inline.

#### Implementation Tasks

**Task 5A.1.1: Add Action Buttons to ArgumentSchemeView**
- Location: `components/ludics/ArgumentSchemeView.tsx`
- Add buttons to each premise: "Ask Why?", "Challenge"
- Add buttons to conclusion: "Ask Why?", "Attack", "Accept"
- Style buttons to match participant color (emerald for P, rose for O)
- Show disabled state when user isn't active participant

```tsx
// Example UI addition
<div className="premise-actions flex gap-1 mt-1">
  <button 
    onClick={() => handleWHY(premise.claimId)}
    className="text-xs px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-700"
  >
    Ask Why?
  </button>
  <button 
    onClick={() => handleCHALLENGE(premise.claimId)}
    className="text-xs px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-700"
  >
    Challenge
  </button>
</div>
```

**Task 5A.1.2: Create DialogueMoveComposer Modal**
- Location: `components/ludics/DialogueMoveComposer.tsx` (NEW)
- Modal dialog for composing WHY/ATTACK/GROUNDS moves
- Pre-filled with target claim/argument
- Shows relevant Critical Questions based on scheme
- Preview of where act will appear in tree
- Submit → creates DialogueMove → triggers recompile → closes modal

**Task 5A.1.3: Integrate with Existing Move API**
- Use existing `/api/dialogue/moves` endpoint (or create if needed)
- Pass `targetType: 'claim'`, `targetId`, `kind: 'WHY'`
- Handle response and trigger design refresh
- Show toast notification with link to new act in tree

**Task 5A.1.4: Add Live Preview**
- Before submitting, show preview of where act will appear
- Highlight the target locus in the tree view
- Show "Opponent will respond at 0.1.1" type of message

**Testing Checklist**:
- [ ] Click "Ask Why" on premise → modal opens with claim prefilled
- [ ] Submit WHY move → creates DialogueMove record
- [ ] Design recompiles automatically
- [ ] New opponent act appears in tree view at correct locus
- [ ] Semantic annotation shows on new act
- [ ] Toast notification appears with success message
- [ ] Can click toast to jump to new act location

**Success Metrics**:
- Time from "see argument" to "challenge created" reduced from ~30s to ~5s
- 80% of challenges created via inline buttons vs manual flow
- Zero confusion about where challenge will appear in tree

---

### 5A.2 Cross-Scope Navigation

**Problem**: Users see references to other scopes (via delocation/fax) but can't easily navigate to them. Cross-scope references are displayed as metadata but aren't interactive.

**Solution**: Clickable links, visual indicators, and a scope map to navigate between related arguments.

#### Implementation Tasks

**Task 5A.2.1: Add Clickable Scope References**
- Location: `packages/ludics-react/LociTree.tsx`
- When act has `delocated: true` metadata, show link icon
- Click → opens modal showing source design
- Highlight the referenced locus in source tree

**Task 5A.2.2: "Referenced By" Badges**
- Query: When displaying design, check which other scopes reference it
- Show badge count: "🔗 Referenced by 3 other arguments"
- Click badge → shows list of referencing scopes
- Click scope → navigates to that design

**Task 5A.2.3: Scope Map Visualization**
- Location: `components/ludics/ScopeMapView.tsx` (NEW)
- Force-directed graph showing scopes as nodes
- Edges represent cross-scope references (delocation, citations)
- Node size proportional to number of acts
- Node color by dominant participant (more P acts = green, more O acts = red)
- Click node → opens that scope's design view

**Task 5A.2.4: Breadcrumb Navigation**
- Show current scope path at top of design view
- "Topic: Argument A → Topic: Argument B → Current"
- Click any breadcrumb to navigate back

**Testing Checklist**:
- [ ] Delocated act shows clickable link icon
- [ ] Click link → modal opens with source design
- [ ] Source design highlights the referenced locus
- [ ] "Referenced By" badge shows correct count
- [ ] Scope map renders all scopes as connected graph
- [ ] Clicking scope node navigates to that design
- [ ] Breadcrumb trail shows navigation history

---

### 5A.3 Commitment Store Visualization

**Problem**: Ludics tracks what's been asserted and challenged, but there's no explicit view of what each participant has *committed to*. When someone CONCEDEs a point or implicitly accepts a claim, this commitment should be visible.

**Solution**: Dedicated "Commitments" panel showing what each participant has committed to, with conflict detection.

#### Implementation Tasks

**Task 5A.3.1: Create CommitmentStore Backend**
- Location: `packages/ludics-engine/commitments.ts` (NEW)
- Track commitments per participant per scope
- Commitment types:
  - `EXPLICIT_ASSERT`: Directly asserted via ASSERT move
  - `EXPLICIT_CONCEDE`: Explicitly conceded via CONCEDE move
  - `IMPLICIT_ACCEPT`: Implicitly accepted (challenged but then dropped, or opponent didn't respond)
  - `CONDITIONAL`: Committed in SUPPOSE/DISCHARGE hypothetical scope

```typescript
interface Commitment {
  participantId: 'Proponent' | 'Opponent';
  claimId: string;
  type: 'EXPLICIT_ASSERT' | 'EXPLICIT_CONCEDE' | 'IMPLICIT_ACCEPT' | 'CONDITIONAL';
  locusPath: string;
  timestamp: Date;
  scope: string;
  conditionalOn?: string; // If CONDITIONAL, the SUPPOSE locus
}
```

**Task 5A.3.2: Commitment Inference Algorithm**
- After compilation, run commitment extraction
- Rules:
  - ASSERT → adds EXPLICIT_ASSERT commitment
  - CONCEDE → adds EXPLICIT_CONCEDE commitment to conceding party
  - WHY followed by no response for N moves → opponent IMPLICIT_ACCEPT
  - SUPPOSE → marks all subsequent assertions as CONDITIONAL until DISCHARGE

**Task 5A.3.3: Commitment Conflict Detection**
- Check for contradictions: committed to both `P` and `¬P`
- Check for scheme violations: committed to conclusion but rejected premise
- Flag inconsistencies with severity levels (error, warning, info)

**Task 5A.3.4: CommitmentPanel UI Component**
- Location: `components/ludics/CommitmentPanel.tsx` (NEW)
- Two columns: Proponent Commitments | Opponent Commitments
- Group by commitment type
- Show claim text with link to originating locus
- Highlight conflicts in red
- Show "Common Ground" section for mutually accepted claims

**Task 5A.3.5: Add to DesignTreeView**
- Add "💎 Commitments" tab alongside Tree/Schemes/Both
- Show commitment store for current scope
- Update in real-time as moves are added

**Testing Checklist**:
- [ ] ASSERT move creates EXPLICIT_ASSERT commitment
- [ ] CONCEDE move creates EXPLICIT_CONCEDE for conceding party
- [ ] Unanswered WHY after N moves creates IMPLICIT_ACCEPT
- [ ] SUPPOSE/DISCHARGE correctly marks CONDITIONAL commitments
- [ ] Contradiction detection flags P committed to both `A` and `¬A`
- [ ] Common Ground section shows mutually accepted claims
- [ ] Commitments panel updates without page refresh

**Success Metrics**:
- Commitment store accurately reflects dialogue state
- Conflict detection catches 95%+ of logical contradictions
- Users can quickly see "what we've agreed on so far"

---

## Phase 5B: Enhanced Scheme Integration
**Priority**: HIGH  
**Estimated Time**: 2-3 weeks  
**Dependencies**: Phase 5A complete

### 5B.1 Scheme-Aware Critical Questions

**Problem**: When challenging an argument, users must manually think of appropriate critical questions. Different schemes have standard CQs that should be suggested.

**Solution**: Auto-suggest relevant CQs based on detected argument scheme, with one-click insertion.

#### Implementation Tasks

**Task 5B.1.1: CQ Database Expansion**
- Ensure all ArgumentSchemes have associated CriticalQuestions
- Add CQ templates with placeholders: "Is {premise1} really true?"
- Priority schemes: Analogy, Expert Opinion, Cause to Effect, Sign

**Task 5B.1.2: CQ Suggestion Engine**
- Location: `lib/argumentation/cq-suggestions.ts` (NEW)
- Input: `argumentId`, `schemeKey`
- Output: Ranked list of relevant CQs with filled-in placeholders
- Use premise/conclusion text to populate templates

**Task 5B.1.3: Integrate into DialogueMoveComposer**
- When creating WHY move, show "Suggested Questions" section
- Click CQ → auto-fills move text
- Show explanation of why this CQ is relevant
- Still allow freeform text entry

**Task 5B.1.4: CQ Provenance Tracking**
- Store `cqId` in DialogueMove.payload
- Display CQ badge in act tooltip: "🤔 CQ: Is the analogy relevant?"
- Link to CQ definition and scheme documentation

**Testing Checklist**:
- [ ] WHY move composer shows 3-5 relevant CQs for scheme
- [ ] CQ templates have placeholders filled with actual claim text
- [ ] Clicking CQ auto-fills move with that question
- [ ] CQ provenance stored in move metadata
- [ ] Act tooltip shows which CQ was used
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

### External Dependencies
- Phase 4 complete (topic scoping, semantic annotations)
- Prisma schema supports DialogueMove with full metadata
- `/api/dialogue/moves` endpoint exists (or needs creation)
- ArgumentScheme + CriticalQuestion tables populated

### Internal Team Dependencies
- Design review for new UI components (ArgumentSchemeView actions, commitment panel)
- Performance testing infrastructure for Phase 5D
- Documentation update for new features

### User Research Needed
- Interview 5-10 users about current challenge creation flow pain points
- Test prototype of inline action buttons with 3 users
- Survey: "What would make you use ludics more?" to prioritize 5B vs 5C

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
1. **Bidirectional Argumentation Platform**: See arguments, interact with arguments, track commitments
2. **Multi-Scope Reasoning Engine**: Navigate, synthesize, and manage complex argument networks
3. **Scheme-Aware Assistant**: System understands argument structure and suggests improvements
4. **Scalable Infrastructure**: Handles 1000+ move deliberations with real-time updates

This sets the stage for:
- **Phase 6**: AI-assisted argumentation (GPT suggests arguments, detects fallacies, recommends moves)
- **Phase 7**: Social features (follow arguments, notifications, argument ratings)
- **Phase 8**: External integrations (export to academic papers, import from debate transcripts)

---

## Appendix A: Key Files & Locations

### Frontend Components
- `components/ludics/ArgumentSchemeView.tsx` - Scheme display (modify for 5A.1)
- `components/ludics/DesignTreeView.tsx` - Tree view wrapper (add commitments tab)
- `components/ludics/DialogueMoveComposer.tsx` - NEW for 5A.1
- `components/ludics/CommitmentPanel.tsx` - NEW for 5A.3
- `components/ludics/ScopeMapView.tsx` - NEW for 5A.2
- `packages/ludics-react/LociTree.tsx` - Core tree rendering (add interactivity)

### Backend Logic
- `packages/ludics-engine/compileFromMoves.ts` - Main compilation (optimize in 5D.1)
- `packages/ludics-engine/commitments.ts` - NEW for 5A.3
- `lib/argumentation/cq-suggestions.ts` - NEW for 5B.1
- `app/api/ludics/scopes/merge/route.ts` - NEW for 5C.1
- `app/api/arguments/[id]/link-premise/route.ts` - NEW for 5B.2

### Database Schema
- `DialogueMove` - Add `cqId` field for 5B.1
- `PremiseLocus` - NEW table for 5B.2
- `ScopeGenealogy` - NEW table for 5C.1
- `LudicDesign` - Add `scopePermissions` for 5C.3
- `LudicAct` - Add `extJson.semanticCache` for 5D.3

---

## Appendix B: Glossary

**Delocation (Fax)**: Importing an act from one scope into another scope, preserving provenance  
**Topic Scoping**: Grouping moves by argument/topic rather than actor or timeline  
**Commitment Store**: Explicit record of what each participant has asserted/accepted/conceded  
**Critical Question (CQ)**: Standard challenge specific to an argument scheme  
**Premise Linking**: Connecting a ludic act to a specific premise of an argument  
**Synthesis**: Combining multiple arguments to derive a new conclusion  
**Scope Merge**: Combining two separate argument threads into one unified scope  
**Incremental Compilation**: Recompiling only affected scopes rather than entire deliberation  

---

**Document Version**: 1.0  
**Last Updated**: November 4, 2025  
**Next Review**: After Phase 5A.1 completion  
**Maintainer**: Ludics Development Team
