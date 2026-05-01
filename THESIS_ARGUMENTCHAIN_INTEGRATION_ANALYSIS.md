# Thesis System + ArgumentChain Integration Analysis

**Original date:** November 16, 2025  
**Re-audited:** April 26, 2026 (post-Living-Thesis-V1)  
**Last updated:** April 27, 2026 (D4 Week 4 shipped — chain ↔ prong conversion + `kind="chain"` backlinks)  
**Context:** Planning the implementation of [LIVING_THESIS_DEFERRED.md](docs/LIVING_THESIS_DEFERRED.md) **D4 — Chain embedding, enabler panel, justification, reconstruction versioning**.  
**Related Docs:** [docs/LIVING_THESIS_ROADMAP.md](docs/LIVING_THESIS_ROADMAP.md), [docs/LIVING_THESIS_DEFERRED.md](docs/LIVING_THESIS_DEFERRED.md), CPR_LEVEL_PHILOSOPHY_REVISED_ANALYSIS.md, THESIS_ENHANCEMENT_ROADMAP.md, ENABLER_PANEL_COMPLETE.md

---

## Status update — April 27, 2026 — D4 Week 4 SHIPPED ✅

**TL;DR:** The chain ↔ prong round-trip is live. A new `POST /api/thesis/[id]/prongs/from-chain` materializes any deliberation-scoped `ArgumentChain` into a topologically-ordered `ThesisProng` (with role mapping + justification carried into `ThesisProngArgument.note`); a new `POST /api/argument-chains/from-prong` does the inverse, including ENABLES-edge inference and OBJECTION-node attack edges. Both endpoints persist a `ThesisChainReference` so the embedded inspector / attack rollup / `live` payload immediately recognize the new pair. `ProngEditor` exposes "Import from chain…" (when creating a prong) and "Export to chain" (when editing). The deferred `kind="chain"` case in `/api/objects/[kind]/[id]/backlinks` is also live now.

**API:**
- ✅ [POST /api/thesis/[id]/prongs/from-chain](app/api/thesis/[id]/prongs/from-chain/route.ts) — Kahn-topo sort respecting `PRESUPPOSES` (target→source first), `ENABLES` and `SUPPORTS` (source→target first); falls back to `nodeOrder` for ties and degrades gracefully on cycles. Role mapping: `PREMISE|EVIDENCE|QUALIFIER|COMMENT → PREMISE`, `CONCLUSION → INFERENCE`, `OBJECTION|REBUTTAL → COUNTER_RESPONSE`. `ArgumentSchemeInstance.justification` is carried into `ThesisProngArgument.note`. `mainClaimId` is auto-resolved from the first `CONCLUSION` node’s conclusion claim (overridable via body). Filters: `includeObjections` (default true), `includeComments` (default false). Persists a `ThesisChainReference` (`prongId` set, `role: "MAIN"`).
- ✅ [POST /api/argument-chains/from-prong](app/api/argument-chains/from-prong/route.ts) — creates the chain in the host thesis’s deliberation, preserves prong order as `nodeOrder`, emits sequential `SUPPORTS` over the mainline (PREMISE/CONCLUSION nodes), `ENABLES` from any argument whose scheme has non-empty `premises` to the next mainline node (`inferEnables` toggle, default true), and `UNDERCUTS` from each `OBJECTION` node to the resolved conclusion. `rootNodeId` is set to the first PREMISE; back-reference is upserted into `ThesisChainReference`.
- ✅ [/api/objects/[kind]/[id]/backlinks](app/api/objects/[kind]/[id]/backlinks/route.ts) now accepts `kind="chain"`. Two new `via` markers: `chainReference` (thesis-level / content-embed) and `prongChainReference` (prong-scoped). Permission redaction (`filterReadableTheses`) applies uniformly. Content-walk fallback uses the existing `inv.chainIds` from `embedded-objects`.

**UI:**
- ✅ [ProngEditor.tsx](components/thesis/ProngEditor.tsx) — when `isNew`, a teal callout under the dialog header offers “Import from chain…” which opens `ArgumentChainPicker` and on pick calls the from-chain endpoint, toasts `Imported chain “X” — N arguments` (or `… N skipped`), and closes the modal. When editing, an “Export to chain” button sits next to “+ Add Argument” and calls the from-prong endpoint (disabled when there are no arguments), toasting the new chain’s name + node/edge counts and revalidating the deliberation chain list.

**Validation:**
- ✅ No new TypeScript errors in any of the four touched files.
- ✅ No schema migration required — reuses existing `ThesisChainReference` from Week 1–2.

**Remaining D4 work:**
- 🟡 **Week 5** — reconstruction versioning (`parentChainId`, `versionLabel`, `forkReason`, `ChainVersionBrowser`, `ChainDiffViewer`, side-by-side embed). Schema fields still pending push.
- 🟡 Optional follow-ups: round-trip preservation test (chain → prong → chain produces equivalent graph modulo layout); a richer “Conversion Options” modal (currently we expose `includeObjections` / `includeComments` / `inferEnables` defaults but don’t surface them in the UI).

---

## Status update — April 27, 2026 — D4 Week 3 SHIPPED ✅

**TL;DR:** EnablerPanel is now embedded in `ProngEditor` as an "Assumptions" tab; `ThesisComposer` prong cards display an inference-assumption count; the challenge button opens `CriticalQuestionsV3` against the offending argument. Justification surfacing inside `EnablerPanel` (the residual Priority 3 task) was already shipped — verified live in the prong context.

**Schema / API:**
- ✅ [/api/thesis/[id]](app/api/thesis/[id]/route.ts) GET include now pulls `argumentSchemes → scheme(premises)` for every prong argument so the EnablerPanel and the prong-card badge can extract enablers from the same payload.
- ✅ New GET handler at [/api/thesis/[id]/prongs/[prongId]](app/api/thesis/[id]/prongs/[prongId]/route.ts) returning the prong with the same `argumentSchemes` include (fixes a previously dead SWR fetch in `ProngEditor` and powers the Assumptions tab without bloating the parent thesis payload further).
- ✅ No schema migration required — reuses existing `ArgumentSchemeInstance.justification` and `ArgumentScheme.premises`.

**UI:**
- ✅ [ProngEditor.tsx](components/thesis/ProngEditor.tsx) — wraps the existing arguments list in `Tabs` with two tabs: `Arguments (N)` and `Assumptions (N)`. The Assumptions tab renders [EnablerPanel.tsx](components/chains/EnablerPanel.tsx) by adapting `prong.arguments` into ReactFlow-shaped `Node<ChainNodeData>[]` (no graph or layout needed — EnablerPanel only reads `data.argument.argumentSchemes`).
- ✅ The "Challenge this assumption" button in `EnablerPanel` opens a new dialog inside `ProngEditor` containing `CriticalQuestionsV3` scoped to the relevant `argument` target. This replaces the placeholder `alert(…)` used in `ArgumentChainCanvas`.
- ✅ [ThesisComposer.tsx](components/thesis/ThesisComposer.tsx) prong cards now render a yellow `Lightbulb` badge — “N assumption(s)” — next to the existing argument count, computed from the same `argumentSchemes → scheme.premises` rollup.
- ✅ Existing per-argument justification indicator (💭 tooltip) was migrated from the never-populated `arg.argument.schemes` field to the correct `arg.argument.argumentSchemes` relation; tooltips now actually fire.
- ✅ Justification visibility inside `EnablerPanel` was already shipped pre-Week-3 (yellow "Why this reconstruction:" block); no code change needed beyond verifying it renders in the prong context.

**Validation:**
- ✅ No new TypeScript errors in `ProngEditor.tsx`, `ThesisComposer.tsx`, or the two API routes (a single pre-existing JSX-quote lint warning on `ThesisComposer.tsx#L930` was untouched).

**Deferred:**
- 🟡 The `EnablerPanel` `prefilterKeys` wiring — we currently surface all CQs for the target argument; passing the scheme key as a prefilter so only scheme-relevant CQs appear is a small follow-up.
- 🟡 `ThesisSnapshotDiff` does not yet diff enabler counts; deferred until Week 5 (versioning) when diff surfaces are revisited.

---

## Status update — April 27, 2026 — D4 Week 1–2 SHIPPED ✅

**TL;DR:** Chains can now be embedded in thesis content, are walked by `/live`, openable through the inspector, and roll up attacks. All locked decisions from April 26 are implemented; versioning fields are deferred to Week 5 as planned.

**Schema (pushed via `npx prisma db push`):**
- ✅ Added `enum ChainReferenceRole { MAIN | SUPPORTING | OBJECTION_TARGET | COMPARISON }` and `model ThesisChainReference` (thesis + chain + optional prongId/sectionId/caption + role; `@@unique([thesisId, chainId])`; thesis cascade, chain restrict). Back-relations on `Thesis`, `ThesisProng`, `ThesisSection`, `ArgumentChain`. See [lib/models/schema.prisma](lib/models/schema.prisma).
- 🟡 Versioning columns (`parentChainId`, `versionLabel`, `forkReason`, `versionNotes`) intentionally **deferred to Week 5** per locked decision.

**TipTap embed:**
- ✅ New atom block extension [argument-chain-node.tsx](lib/tiptap/extensions/argument-chain-node.tsx) — header card + `LiveBadgeStrip` (kind="chain") + click-to-inspect. Attrs: `chainId`, `chainName`, `caption`, `role`, `showEnabler`, `highlightNodes`.
- ✅ Readonly canvas [ArgumentChainEmbedView.tsx](components/thesis/ArgumentChainEmbedView.tsx) — wrapped in its own `ReactFlowProvider`, lazy-fetches `/api/argument-chains/[chainId]/nodes`, role-tinted nodes, attack edges drawn rose. Built standalone (does **not** mutate the chain editor's Zustand store).
- ✅ Picker modal [ArgumentChainPicker.tsx](components/thesis/ArgumentChainPicker.tsx) — searchable list + role select + caption.
- ✅ Wired into [ThesisEditor.tsx](components/thesis/ThesisEditor.tsx) toolbar ("Chain" button, Lightbulb icon).
- ✅ Inventory walker [embedded-objects.ts](lib/thesis/embedded-objects.ts) recognizes `argumentChainNode` and emits `chainIds`.
- ✅ [ThesisLiveContext.tsx](lib/thesis/ThesisLiveContext.tsx) extended (`LiveKind` += "chain", `InspectorRequest.tab` += "nodes").

**Living Thesis V1 hook-up:**
- ✅ [/api/thesis/[id]/live](app/api/thesis/[id]/live/route.ts) — new section 7 loads embedded chains, back-fills member-argument stats, aggregates per-chain attack/support/evidence/CQ counters and `lastChangedAt`, emits `objects[chainId]={kind:"chain", nodeCount, edgeCount, ...}`.
- ✅ [/api/thesis/[id]/inspect/[kind]/[objectId]](app/api/thesis/[id]/inspect/[kind]/[objectId]/route.ts) — new `loadChain` returns `overview` (name/description/purpose/chainType/counts/dates), `nodes`, `edges`, `provenance` (deliberation, creator, embedding theses via `thesisReferences`).
- ✅ [ThesisInspectorDrawer.tsx](components/thesis/ThesisInspectorDrawer.tsx) — chain kind tabs `["overview","nodes","provenance"]`; new `ChainNodesTab` lists nodes (click → argument inspector) + edges; chain branches in `OverviewTab` and `ProvenanceTab` ("Embedded in theses (N)" backlinks list).
- ✅ [/api/thesis/[id]/attacks](app/api/thesis/[id]/attacks/route.ts) — joins chain membership; member argumentIds appended so their attacks load; `target.chains` rollup attached to argumentEdge entries.
- ✅ [ThesisAttackRegister.tsx](components/thesis/ThesisAttackRegister.tsx) — renders indigo "in chain: X" pills (max 3) on entries whose target argument belongs to embedded chains.

**Materialization (locked-decision "BOTH"):**
- ✅ New reconciler [chain-references.ts](lib/thesis/chain-references.ts) — `syncThesisChainReferences(thesisId, content)` walks content for `argumentChainNode` atoms and reconciles `ThesisChainReference` rows (createMany skipDuplicates + update changed role/caption + deleteMany removed). Idempotent.
- ✅ Wired into [PATCH /api/thesis/[id]](app/api/thesis/[id]/route.ts) — runs best-effort after `thesis.update` whenever `content` is included in the patch.

**Locked decisions implemented:**
- ✅ **BOTH** in-content + materialized references (in-content is source of truth; row materialized on save for backlinks).
- ✅ **No chain-as-mainClaim** at prong level — content embed only.
- 🟡 **`parentChainId`-only versioning** — schema + UI deferred to Week 5 per the locked plan.

**Deferred to later passes:**
- � **SHIPPED (Week 4)** — [/api/objects/chain/[id]/backlinks](app/api/objects/[kind]/[id]/backlinks/route.ts) now returns chain backlinks via `ThesisChainReference` rows (with `via: "chainReference" | "prongChainReference"`).
- 🟡 Confidence math (chain edges as structural evidence) — D4-stretch, not started.
- 🟡 Permissions: chain inspect remains gated through `checkThesisReadable` (chain only reachable via thesis), so no new permission code was added — this is an explicit V1 invariant.

**Validation:**
- ✅ `npx prisma format` + `npx prisma db push` + `prisma generate` clean.
- ✅ `npm run lint` clean on all D4 files (pre-existing unrelated warnings untouched).

---

## Status update — April 26, 2026

This document was originally written before the Living Thesis V1 effort (Phases 1–7) shipped. Several items it called out as missing have since been delivered, and the integration target is now D4 in the deferred ledger. The audit below reflects **current code on `main`**.

**Already shipped since this doc was written:**
- ✅ **Living Thesis V1 (Phases 1–7)** — `/api/thesis/[id]/live`, `/inspect`, `/attacks`, `/confidence`, `/snapshots`, `/focus`. New surfaces this integration must hook into:
  - [ThesisLiveContext.tsx](lib/thesis/ThesisLiveContext.tsx) (single SWR poll + inspector pub/sub)
  - [ThesisInspectorDrawer.tsx](components/thesis/ThesisInspectorDrawer.tsx) (Overview / Attacks / Provenance / Evidence / CQs tabs)
  - [ThesisAttackRegister.tsx](components/thesis/ThesisAttackRegister.tsx)
  - [ConfidenceBadge.tsx](components/thesis/ConfidenceBadge.tsx) + [confidence.ts](lib/thesis/confidence.ts)
  - [ThesisSnapshotManager.tsx](components/thesis/ThesisSnapshotManager.tsx) + [ThesisSnapshotDiff.tsx](components/thesis/ThesisSnapshotDiff.tsx)
  - [ThesisFocusHandler.tsx](components/thesis/ThesisFocusHandler.tsx)
- ✅ **Justification field is now surfaced in UI** — see [ArgumentCardV2.tsx#L1428](components/arguments/ArgumentCardV2.tsx#L1428) ("Reconstruction Justification" section) and [ProngEditor.tsx#L322](components/thesis/ProngEditor.tsx#L322) (per-argument justification indicator). Original Priority 3 below is therefore **complete**, modulo the EnablerPanel-side display.

**Still missing — the actual D4 scope (status as of April 27, 2026):**
- ✅ **SHIPPED (Week 1–2)** — `ThesisChainReference` model exists with FK to `ArgumentChain`, `ThesisProng`, `ThesisSection`. See April 27 status block above.
- ✅ **SHIPPED (Week 1–2)** — `argument-chain-node` TipTap extension and embed view live; chains can be inserted via `ThesisEditor` toolbar.
- ✅ **SHIPPED (Week 1–2)** — `ArgumentChainPicker` modal under `components/thesis/`.
- ✅ **SHIPPED (Week 4)** — `POST /api/thesis/[id]/prongs/from-chain` and `POST /api/argument-chains/from-prong`; ProngEditor exposes Import / Export. See April 27 (Week 4) status block above.
- ❌ **(Week 5)** `ArgumentChain` has no `parentChainId`, `versionLabel`, `forkReason`, `versionNotes` columns; per locked decision, no `ChainDiff` model — diffs will be computed on demand.

**Corrections to the original architecture write-up below:**
- `ChainNodeRole` is `PREMISE | EVIDENCE | CONCLUSION | OBJECTION | REBUTTAL | QUALIFIER | COMMENT` (the original draft listed `PRIMARY | SUPPORTING | OBJECTION | PRESUPPOSED`, which was speculative — that enum was never adopted).
- `chainType` enum is `SERIAL | CONVERGENT | DIVERGENT | TREE | GRAPH` (original listed `DEFENSE`).
- `ArgumentChainEdgeType` now has **10** values (`SUPPORTS | ENABLES | PRESUPPOSES | REFUTES | QUALIFIES | EXEMPLIFIES | GENERALIZES | REBUTS | UNDERCUTS | UNDERMINES`), not 7.
- `ArgumentChainNode` carries epistemic + layout fields the original missed: `epistemicStatus`, `scopeId`, `dialecticalRole`, `positionX`, `positionY`, plus recursive-attack support via `targetType` (NODE|EDGE) and `targetEdgeId`.
- TipTap extension list also includes `draft-claim-node.tsx` and `draft-proposition-node.tsx` (introduced for the Living Thesis composer), but still no chain extension.

---

## Executive Summary

**Key Finding:** Thesis system and ArgumentChain system still operate as **parallel tracks** with **no direct integration**. The Living Thesis V1 work made the thesis side dramatically more capable (live binding, inspector, attacks, confidence, snapshots), but every new surface ignores `ArgumentChain` entirely. D4 is the work that closes the gap.

**Current State:**
- ✅ Thesis system: prong-based composition + rich text editor + Living Thesis V1 live/inspector/attack/confidence/snapshot surfaces.
- ✅ ArgumentChain system: graph-based reconstruction with PRESUPPOSES/ENABLES edges, schemes, enablers, recursive attacks (NODE|EDGE targets).
- ✅ `ArgumentSchemeInstance.justification` is now displayed in `ArgumentCardV2` and `ProngEditor`.
- ❌ Integration: **still none** — `Thesis` references `Argument`s but not `ArgumentChain`s; chains are invisible to every Living Thesis V1 surface.

**Impact on CPR Capability:**
- Current: ~88% capable (Living Thesis V1 plus justification surfacing lifted this from the original 85%).
- **With D4 shipped: 95%+ capable** (approaches full Kant CPR reconstruction readiness).

**Why This Matters:**
The ArgumentChain system has the infrastructure for **sustained philosophical argumentation** (PRESUPPOSES/ENABLES edges, justification fields, scheme-based reasoning, recursive attacks on edges), and the Living Thesis V1 has the infrastructure for **live, inspectable, citable surfaces**. D4 is the join: chain graphs embedded in thesis content, participating in `/live` polling, openable through the inspector, and forkable so multiple reconstructions can coexist.

---

## Architecture Comparison

### Thesis System (Current)

```
Thesis
  ├─ ThesisClaim? (optional main claim)
  ├─ ThesisProng[] (lines of reasoning)
  │    ├─ mainClaim: Claim
  │    ├─ arguments: ThesisProngArgument[]
  │    │    ├─ argument: Argument
  │    │    ├─ role: PREMISE | INFERENCE | COUNTER_RESPONSE
  │    │    └─ order: Int
  │    ├─ introduction: JSON (TipTap)
  │    └─ conclusion: JSON (TipTap)
  └─ ThesisSection[] (prose)
       └─ content: JSON (TipTap)
```

**Composition Modes:**
1. **ThesisComposer** - Structured prong editor (legal brief style)
2. **ThesisEditor** - Rich text WYSIWYG with embedded nodes

**Strengths:**
- Legal/academic workflow familiar to users
- Clear hierarchical structure (prongs → arguments)
- Rich text editing with embedded deliberation objects
- Inline citation, claim, argument insertion

**Limitations for Philosophy:**
- Arguments in prongs are **flat lists** (no graph structure)
- No representation of **presuppositions** between arguments
- No **inference chains** (can't show A → B → C with conditional premises)
- No **enabler visibility** (assumptions hidden)
- No **recursive attacks** on relationships
- No **justification field** display

---

### ArgumentChain System (Current — verified April 2026)

```
ArgumentChain  (lib/models/schema.prisma#L7413)
  ├─ chainType: SERIAL | CONVERGENT | DIVERGENT | TREE | GRAPH
  ├─ rootNodeId, deliberationId, createdBy, isPublic, isEditable
  ├─ nodes: ArgumentChainNode[]
  │    ├─ argument: Argument (with full AIF + scheme)
  │    ├─ role: PREMISE | EVIDENCE | CONCLUSION | OBJECTION | REBUTTAL | QUALIFIER | COMMENT
  │    ├─ epistemicStatus, scopeId, dialecticalRole
  │    ├─ positionX, positionY (layout)
  │    ├─ targetType: NODE | EDGE (recursive attack support)
  │    └─ targetEdgeId?: String (for edge-targeted attacks)
  ├─ edges: ArgumentChainEdge[]
  │    ├─ edgeType: SUPPORTS | ENABLES | PRESUPPOSES | REFUTES | QUALIFIES
  │    │            | EXEMPLIFIES | GENERALIZES | REBUTS | UNDERCUTS | UNDERMINES
  │    ├─ strength: Float (default 1.0)
  │    ├─ description?: String
  │    ├─ slotMapping: JSON (scheme-slot binding)
  │    └─ attackingNodes: ArgumentChainNode[] (recursive attack relation via targetEdgeId)
  └─ metadata: { purpose, description }
  └─ ✗ no parentChainId / versionLabel / forkReason / versionNotes (D4 scope)
```

**UI Components:**
- **ArgumentChainCanvas** - ReactFlow visual editor with tabs (Analysis | Enablers)
- **EnablerPanel** - Displays scheme inference assumptions grouped by node
- **ChainAnalysisPanel** - Shows chain structure metrics

**Strengths (for CPR-level work):**
- ✅ **Graph structure**: Visual representation of argument dependencies
- ✅ **PRESUPPOSES edges**: Represent Kantian conditional premises (e.g., "If synthetic a priori judgments are possible, then X")
- ✅ **Justification field**: `ArgumentSchemeInstance.justification` for reconstruction reasoning (exists but hidden)
- ✅ **Scheme-based reasoning**: 60+ Walton schemes with formal structures
- ✅ **Enabler extraction**: Surfaces major/conditional premises as explicit assumptions
- ✅ **Recursive attacks**: Can attack inference relationships (UNDERCUTS), not just conclusions
- ✅ **Node roles**: `PREMISE | EVIDENCE | CONCLUSION | OBJECTION | REBUTTAL | QUALIFIER | COMMENT` (clear epistemic status; the original draft listed `PRIMARY | SUPPORTING | OBJECTION | PRESUPPOSED`, which was speculative).
- ✅ **Edge types**: 10 semantic relationships (`SUPPORTS | ENABLES | PRESUPPOSES | REFUTES | QUALIFIES | EXEMPLIFIES | GENERALIZES | REBUTS | UNDERCUTS | UNDERMINES`) vs. thesis's flat "argument order".

**Limitations:**
- Not integrated with thesis composition workflow
- No export to thesis format
- No "chain → prong" conversion
- No inline embedding in rich text editor

---

## Gap Analysis: What's Missing for CPR-Level Integration?

### Gap 1: Thesis Cannot Reference ArgumentChains — ✅ SHIPPED (April 27, 2026)

**Update:** Closed by D4 Week 1–2. `ThesisChainReference` model exists; `argumentChainNode` TipTap atom + `ArgumentChainPicker` + `ArgumentChainEmbedView` ship the in-content embed; reconciler [chain-references.ts](lib/thesis/chain-references.ts) materializes rows on save; chains are walked by `/live`, openable via the inspector (`kind="chain"`), and roll up attacks in the Attack Register. See the April 27 status block at the top of this doc for the full file list.

**Original analysis preserved below for reference.**

#### (Original — pre-implementation)

**Current:**
- Thesis can insert `ArgumentNode` (individual arguments)
- Thesis can insert `ClaimNode` (individual claims)
- Thesis **CANNOT** insert `ArgumentChainNode` (graph structures)

**Impact:**
- User reconstructs CPR passage as ArgumentChain with PRESUPPOSES edges
- User writes thesis analyzing that reconstruction
- Thesis **cannot show the chain** - must reference individual arguments in flat list
- **Result:** Loss of graph structure, presupposition visibility, inference paths

**What's Needed:**
```prisma
// NEW: Link thesis to chains
model ThesisChainReference {
  id        String   @id @default(cuid())
  thesisId  String
  chainId   String
  
  // Where in thesis this chain is discussed
  sectionId String?  // Optional: specific section
  prongId   String?  // Optional: specific prong
  
  // Display metadata
  caption   String?  // e.g., "Deduction of Categories (B159-B165)"
  role      ChainReferenceRole  // MAIN | SUPPORTING | COUNTEREXAMPLE | COMPARISON
  
  thesis    Thesis         @relation(fields: [thesisId], references: [id], onDelete: Cascade)
  chain     ArgumentChain  @relation(fields: [chainId], references: [id], onDelete: Restrict)
  
  @@unique([thesisId, chainId])
  @@index([thesisId])
  @@index([chainId])
}

enum ChainReferenceRole {
  MAIN           // Primary reconstruction this thesis analyzes
  SUPPORTING     // Supporting analysis
  COUNTEREXAMPLE // Alternative reconstruction for comparison
  COMPARISON     // Compare with other scholar's reconstruction
}
```

**TipTap Extension:**
```typescript
// lib/tiptap/extensions/argument-chain-node.ts
export const ArgumentChainNode = Node.create({
  name: "argumentChain",
  
  addAttributes() {
    return {
      chainId: { default: null },
      chainName: { default: "" },
      caption: { default: "" },
      role: { default: "MAIN" },
      showEnabler: { default: false },  // Toggle enabler view
      highlightNodes: { default: [] },  // Highlight specific nodes
    };
  },
  
  addNodeView() {
    return ({ node }) => {
      return <ArgumentChainEmbedView 
        chainId={node.attrs.chainId}
        caption={node.attrs.caption}
        showEnabler={node.attrs.showEnabler}
        highlightNodes={node.attrs.highlightNodes}
      />;
    };
  }
});
```

---

### Gap 2: No Chain → Prong Conversion ❌

**Current:**
- User creates ArgumentChain (graph) in deliberation
- User wants to convert to Thesis Prong (list) for legal brief
- **No conversion tool** - must manually recreate arguments

**Impact:**
- Duplication of work
- Loss of graph metadata (presuppositions, enablers)
- No round-trip workflow (chain ↔ prong)

**What's Needed:**
```typescript
// API: POST /api/thesis/[id]/prongs/from-chain
interface ChainToProngRequest {
  chainId: string;
  prongTitle: string;
  prongRole: "SUPPORT" | "REBUT" | "PREEMPT";
  
  // Options
  includePresupposed: boolean;  // Include PRESUPPOSED role nodes?
  linearizeStrategy: "TOPOLOGICAL" | "DEPTH_FIRST" | "BREADTH_FIRST";
  preserveJustifications: boolean;  // Add justification as notes?
}

interface ChainToProngResponse {
  prongId: string;
  argumentsAdded: number;
  presuppositionsCollapsed: number;  // Count of PRESUPPOSES edges flattened
  metadata: {
    sourceChainId: string;
    conversionDate: string;
    originalGraphStructure: JSON;  // Preserve for reference
  };
}
```

**Linearization Logic:**
```typescript
// Topological sort respecting PRESUPPOSES edges
function linearizeChain(chain: ArgumentChain): ArgumentChainNode[] {
  const graph = buildDependencyGraph(chain);
  const sorted = topologicalSort(graph);
  
  return sorted.map(nodeId => {
    const node = chain.nodes.find(n => n.id === nodeId);
    const presupposes = chain.edges.filter(e => 
      e.targetNodeId === nodeId && e.edgeType === "PRESUPPOSES"
    );
    
    return {
      ...node,
      role: presupposes.length > 0 ? "PREMISE" : "INFERENCE",
      note: node.argument.schemes[0]?.justification || null
    };
  });
}
```

---

### Gap 3: Prong → Chain Upgrade Path ❌

**Inverse:** Convert flat prong list to graph structure

**Use Case:**
- User writes legal brief with prong structure (comfortable workflow)
- User later wants to **visualize inference dependencies** as graph
- User wants to **add PRESUPPOSES edges** to show conditional reasoning
- User wants to **display enablers** for philosophical analysis

**What's Needed:**
```typescript
// API: POST /api/argument-chains/from-prong
interface ProngToChainRequest {
  thesisId: string;
  prongId: string;
  chainName: string;
  
  // Auto-detection options
  detectPresuppositions: boolean;     // Analyze schemes for conditional premises
  inferEnablerEdges: boolean;         // Create ENABLES edges from scheme analysis
  createAttackNodes: boolean;         // Convert COUNTER_RESPONSE role to OBJECTION nodes
  preserveArgumentOrder: boolean;     // Use prong order or re-layout?
}

interface ProngToChainResponse {
  chainId: string;
  nodesCreated: number;
  edgesInferred: number;
  presuppositionsDetected: number;
  metadata: {
    sourceProngId: string;
    sourceThesisId: string;
    conversionStrategy: string;
  };
}
```

**Presupposition Detection:**
```typescript
// Analyze scheme premises to infer PRESUPPOSES edges
function detectPresuppositions(arguments: Argument[]): Edge[] {
  const edges: Edge[] = [];
  
  for (let i = 0; i < arguments.length; i++) {
    const arg = arguments[i];
    const scheme = arg.schemes[0];
    
    if (!scheme) continue;
    
    // Check if scheme has conditional/major premise
    const majorPremise = scheme.premises.find(p => 
      p.type === "major" || p.type === "conditional"
    );
    
    if (majorPremise) {
      // Find argument that establishes this premise
      for (let j = 0; j < i; j++) {
        const priorArg = arguments[j];
        if (priorArg.text.includes(majorPremise.text)) {
          edges.push({
            source: priorArg.id,
            target: arg.id,
            type: "PRESUPPOSES",
            description: `Major premise: "${majorPremise.text}"`
          });
        }
      }
    }
  }
  
  return edges;
}
```

---

### Gap 4: Enabler Panel Not in Thesis View ❌

**Current:**
- EnablerPanel exists in ArgumentChainCanvas (Analysis | Enablers tabs)
- Thesis system **does not display enablers** for prong arguments
- User cannot see **inference assumptions** in thesis composition

**Impact:**
- Philosophical rigor lost in thesis view
- No visibility of major premises, conditional assumptions
- Cannot challenge enablers from thesis interface

**What's Needed:**

1. **Add EnablerPanel to ProngEditor:**
```tsx
// components/thesis/ProngEditor.tsx
import { EnablerPanel } from "@/components/chains/EnablerPanel";

function ProngEditor({ thesisId, prongId }) {
  const nodes = useMemo(() => {
    // Convert prong arguments to chain node format
    return prong.arguments.map(a => ({
      id: a.id,
      data: {
        argument: a.argument,
        role: a.role,
        label: a.argument.text
      }
    }));
  }, [prong]);
  
  return (
    <div>
      {/* Existing prong editor */}
      
      <Tabs defaultValue="arguments">
        <TabsList>
          <TabsTrigger value="arguments">Arguments</TabsTrigger>
          <TabsTrigger value="enablers">Assumptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="enablers">
          <EnablerPanel 
            nodes={nodes}
            chainId={null}  // Prong, not chain
            onHighlightNode={(nodeId) => highlightArgument(nodeId)}
            onChallengeEnabler={(nodeId, scheme, enabler) => {
              // Open CQ interface or add COUNTER_RESPONSE argument
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

2. **Show Enabler Summary in Thesis Composer:**
```tsx
// components/thesis/ThesisComposer.tsx
function ProngSummaryCard({ prong }) {
  const enablerCount = prong.arguments.reduce((sum, arg) => {
    const scheme = arg.argument.schemes[0];
    const premises = scheme?.premises || [];
    const enablers = premises.filter(p => p.type === "major" || p.type === "conditional");
    return sum + enablers.length;
  }, 0);
  
  return (
    <div className="prong-card">
      <h3>{prong.title}</h3>
      <div className="metadata">
        <span>{prong.arguments.length} arguments</span>
        <span>{enablerCount} inference assumptions</span>
        <span>
          {enablerCount > 0 && (
            <Button onClick={() => setShowEnablerModal(true)}>
              View Assumptions
            </Button>
          )}
        </span>
      </div>
    </div>
  );
}
```

---

### Gap 5: Justification Field — ✅ SHIPPED (was hidden, now surfaced)

**Update (April 2026):** This gap is closed in the principal surfaces.

- ✅ Displayed in [ArgumentCardV2.tsx#L1428](components/arguments/ArgumentCardV2.tsx#L1428) ("Reconstruction Justification" block).
- ✅ Displayed in [ProngEditor.tsx#L322](components/thesis/ProngEditor.tsx#L322) (per-argument indicator + content).

**Residual TODOs (folded into D4 Week 3):**
- [ ] Surface `scheme.justification` per node inside [EnablerPanel.tsx](components/chains/EnablerPanel.tsx).
- [ ] Add a justification prompt to the scheme-selection workflow (`AIFArgumentWithSchemeComposer`).
- [ ] Include justification in argument-metadata exports.

---

### Gap 6: No Reconstruction Versioning ❌

**Current:**
- ArgumentChain has no `parentChainId` or `versionLabel` field
- No way to represent **multiple reconstructions** of same text
- No comparison view for **competing interpretations**

**Impact:**
- Cannot represent "Allison's reconstruction vs. Guyer's reconstruction" of CPR B275
- No way to track **scholarly disagreements** on argument structure
- No versioning for **iterative refinement** of reconstructions

**What's Needed:**
```prisma
// Add to ArgumentChain model:
model ArgumentChain {
  // ... existing fields ...
  
  // Versioning
  parentChainId  String?
  parentChain    ArgumentChain?  @relation("ChainVersions", fields: [parentChainId], references: [id])
  childChains    ArgumentChain[] @relation("ChainVersions")
  
  versionLabel   String?         // "Allison 1983", "Guyer 1987", "My Reading"
  versionNotes   String?  @db.Text
  forkReason     String?  @db.Text  // Why this differs from parent
  
  @@index([parentChainId])
}

// Track differences between versions
model ChainDiff {
  id             String   @id @default(cuid())
  fromChainId    String
  toChainId      String
  
  nodesAdded     String[]  // Node IDs
  nodesRemoved   String[]
  nodesModified  Json      // { nodeId: { field: oldValue → newValue } }
  
  edgesAdded     String[]  // Edge IDs
  edgesRemoved   String[]
  edgesModified  Json
  
  computedAt     DateTime @default(now())
  
  @@unique([fromChainId, toChainId])
  @@index([fromChainId])
  @@index([toChainId])
}
```

**UI:**
```tsx
// components/chains/ChainVersionBrowser.tsx
<div className="version-tree">
  <h3>Reconstruction Versions: CPR B275-B279</h3>
  
  <div className="version-card">
    <h4>Original (My Reading)</h4>
    <span className="date">Oct 15, 2025</span>
    <p>6 nodes, 8 edges (3 PRESUPPOSES)</p>
    <Button>View</Button>
  </div>
  
  <div className="version-card fork">
    <h4>Fork: Allison's Interpretation</h4>
    <span className="date">Oct 20, 2025</span>
    <p>7 nodes, 9 edges (4 PRESUPPOSES)</p>
    <span className="diff">+1 node, +1 PRESUPPOSES edge</span>
    <Button>Compare</Button>
  </div>
  
  <div className="version-card fork">
    <h4>Fork: Guyer's Interpretation</h4>
    <span className="date">Oct 22, 2025</span>
    <p>5 nodes, 6 edges (2 PRESUPPOSES)</p>
    <span className="diff">-1 node, -2 PRESUPPOSES edges</span>
    <Button>Compare</Button>
  </div>
</div>
```

---

## Integration Opportunities (Ranked by Impact)

### Priority 1: Chain Embedding in Thesis ⭐⭐⭐⭐⭐ — ✅ SHIPPED (April 27, 2026)

**Status:** Closed by D4 Week 1–2. See top-of-doc April 27 status block for the file inventory. Remaining priorities (2 → enabler panel in prongs; 4 → conversion; 5 → versioning) are next.

**Impact:** Enables CPR-level reconstruction display in thesis composition; fully participates in the Living Thesis V1 live surface.

**Effort:** ~2 weeks (delivered).

**What to Build:**
1. `ArgumentChainNode` TipTap extension under [lib/tiptap/extensions/](lib/tiptap/extensions/) (embedded chain viewer; matches the live-aware pattern of `claim-node.tsx` / `argument-node.tsx`).
2. `ArgumentChainPicker` modal under [components/thesis/](components/thesis/) (browse chains in deliberation — mirror the existing [ArgumentPicker.tsx](components/thesis/ArgumentPicker.tsx)).
3. `ThesisChainReference` model in [lib/models/schema.prisma](lib/models/schema.prisma) (link thesis → chains, mirroring `ThesisProngArgument`).
4. Chain embed view (inline ReactFlow readonly, toggleable enabler panel) reusing [ArgumentChainCanvas.tsx](components/chains/ArgumentChainCanvas.tsx) read-only mode.
5. **Living Thesis V1 hook-up (new):**
   - Extend [/api/thesis/[id]/live](app/api/thesis/[id]/live/route.ts) so embedded chains contribute their nodes' attack/evidence stats to the batched payload (walk `content` JSON for `argumentChain` nodes, then for each chain's argument set, join the same `ClaimLabel` / `ArgumentEdge` / `EvidenceLink` joins used today).
   - Extend [ThesisInspectorDrawer.tsx](components/thesis/ThesisInspectorDrawer.tsx) with a `kind: "chain"` case (Overview / Provenance / Attacks tabs), and a corresponding [/api/thesis/[id]/inspect/chain/[chainId]](app/api/thesis/[id]/inspect/) route that returns the chain's nodes + edges + per-node lineage.
   - Extend [ThesisAttackRegister.tsx](components/thesis/ThesisAttackRegister.tsx) so attacks against an embedded chain's nodes/edges roll up to the chain entry.
   - Extend [confidence.ts](lib/thesis/confidence.ts) so prongs whose mainClaim is a chain conclusion treat chain edges as evidence of structure (D4-stretch — may defer to a later pass).

**User Story:**
> User writes thesis analyzing Kant's CPR B159-B165. User inserts ArgumentChain showing PRESUPPOSES edges between premises. Thesis displays interactive graph with enabler panel. Attacks filed against any chain node show up red on the graph and in the Attack Register; clicking the chain in the live surface opens the inspector on the chain.

**Result:** Thesis becomes **first-class home for philosophical reconstruction** — and chains inherit the V1 live/inspector/attack/snapshot machinery for free.

---

### Priority 2: Enabler Display in Prong View ⭐⭐⭐⭐

**Impact:** Surfaces inference assumptions in thesis composition

**Effort:** 3 days

**What to Build:**
1. Adapt EnablerPanel for prong context (convert argument list → nodes)
2. Add "Assumptions" tab to ProngEditor
3. Show enabler count badge in ThesisComposer prong cards
4. Wire challenge button to CQ interface

**User Story:**
> User composes thesis prong with 5 arguments. User clicks "Assumptions" tab. EnablerPanel shows 8 inference assumptions. User realizes one assumption is controversial, adds supporting argument.

**Result:** Users **see and challenge** inference assumptions during thesis composition.

---

### Priority 3: Justification Visibility ✅ SHIPPED

**Impact:** Shows reconstruction reasoning in thesis.

**Status:** Complete (verified April 2026).

**Shipped:**
- ✅ Justification section in [ArgumentCardV2.tsx#L1428](components/arguments/ArgumentCardV2.tsx#L1428) ("Reconstruction Justification" block, conditional on `schemes.some(s => s.justification)`).
- ✅ Per-argument justification indicator in [ProngEditor.tsx#L322](components/thesis/ProngEditor.tsx#L322).

**Still pending (rolled into Priority 2 below):**
- [ ] Surface scheme `justification` per-node inside [EnablerPanel.tsx](components/chains/EnablerPanel.tsx) (will land naturally when EnablerPanel is reused in the thesis prong context).
- [ ] Justification prompt in scheme selection workflow (`AIFArgumentWithSchemeComposer`).
- [ ] Include justification in argument-metadata exports.

---

### Priority 4: Chain ↔ Prong Conversion ⭐⭐⭐

**Impact:** Enables round-trip workflow between graph and linear views

**Effort:** 1 week

**What to Build:**
1. `POST /api/thesis/[id]/prongs/from-chain` (chain → prong linearization)
2. `POST /api/argument-chains/from-prong` (prong → chain with presupposition detection)
3. Conversion options modal (strategy selection, metadata preservation)
4. Metadata tracking (provenance, original structure)

**User Story:**
> User creates ArgumentChain with complex PRESUPPOSES structure. User exports to thesis prong for legal brief. Prong preserves topological order. Justification fields added as argument notes. User can re-convert to chain for visual editing.

**Result:** **Flexible composition** - graph view for philosophy, list view for legal briefs.

---

### Priority 5: Reconstruction Versioning ⭐⭐⭐

**Impact:** Enables multiple interpretations and comparison

**Effort:** 1 week

**What to Build:**
1. Add `parentChainId`, `versionLabel`, `forkReason` to ArgumentChain
2. "Fork This Chain" button in ArgumentChainCanvas
3. ChainVersionBrowser component (tree view)
4. ChainDiffViewer (side-by-side comparison)
5. Thesis embedding of version comparisons

**User Story:**
> User reconstructs CPR B275 as ArgumentChain. Colleague disagrees on presupposition structure. Colleague forks chain, modifies PRESUPPOSES edges, adds versionLabel "Alternative Reading". Thesis embeds both versions side-by-side for comparison.

**Result:** **Scholarly discourse** - multiple interpretations coexist, differences explicit.

---

## Roadmap: D4 Implementation (~5 weeks)

> **Sequencing decision:** because Living Thesis V1 is now the canonical surface, every chain integration step must plug into the V1 contracts (`/live`, `/inspect`, `/attacks`, `/snapshots`, `ThesisLiveContext`, `ThesisInspectorDrawer`). Week 1–2 establishes the embed + V1 wiring; Week 3 brings EnablerPanel into the thesis side; Week 4 ships chain↔prong conversion; Week 5 adds versioning. Justification visibility (original Week 4) is already shipped.

### Week 1–2: Chain embedding foundation + V1 wiring ⭐ — ✅ SHIPPED (April 27, 2026)

**Goal:** Enable thesis to display ArgumentChains inline as live, inspectable embeds.

**Tasks:**
- [x] Add `ThesisChainReference` model to [lib/models/schema.prisma](lib/models/schema.prisma); run `npx prisma db push`.
- [x] Create `ArgumentChainNode` TipTap extension at [lib/tiptap/extensions/argument-chain-node.tsx](lib/tiptap/extensions/argument-chain-node.tsx) following the live-aware pattern of [argument-node.tsx](lib/tiptap/extensions/argument-node.tsx) (uses `LiveBadgeStrip` with `kind="chain"`).
- [x] Build [ArgumentChainPicker.tsx](components/thesis/ArgumentChainPicker.tsx) modal — mirrors [ArgumentPicker.tsx](components/thesis/ArgumentPicker.tsx) and adds role + caption fields.
- [x] Implement [ArgumentChainEmbedView.tsx](components/thesis/ArgumentChainEmbedView.tsx) — standalone readonly ReactFlow (does **not** mutate chain editor Zustand store).
- [x] Add chain insertion button to [ThesisEditor.tsx](components/thesis/ThesisEditor.tsx) toolbar ("Chain", Lightbulb icon).
- [x] **Living Thesis V1 hook-up:**
  - [x] Extend [/api/thesis/[id]/live](app/api/thesis/[id]/live/route.ts) — section 7 walks chain embeds, back-fills member-argument stats, aggregates per-chain counters.
  - [x] Add `chain` kind to [/api/thesis/[id]/inspect/[kind]/[objectId]](app/api/thesis/[id]/inspect/[kind]/[objectId]/route.ts) — `loadChain` returns overview + nodes + edges + provenance.
  - [x] Extend [ThesisInspectorDrawer.tsx](components/thesis/ThesisInspectorDrawer.tsx) — `chain` tabs `["overview","nodes","provenance"]` + new `ChainNodesTab` + chain branches in Overview & Provenance tabs.
  - [x] Extend [ThesisAttackRegister.tsx](components/thesis/ThesisAttackRegister.tsx) — "in chain: X" indigo pills on entries whose target belongs to an embedded chain (rollup added in [/api/thesis/[id]/attacks](app/api/thesis/[id]/attacks/route.ts)).
  - [x] Permissions: chain inspect is gated through existing `checkThesisReadable` since chains are only reachable via thesis. **No code change needed** — V1 invariant.
- [x] Materialization: [chain-references.ts](lib/thesis/chain-references.ts) reconciler called from [PATCH /api/thesis/[id]](app/api/thesis/[id]/route.ts) on every content save.
- [x] **Shipped Week 4:** [/api/objects/[kind]/[id]/backlinks](app/api/objects/[kind]/[id]/backlinks/route.ts) accepts `kind="chain"` (via `chainReference` / `prongChainReference`).
- [x] **Test:** Insert chain → view graph → file attack on chain node from the inspector → entry updates in Attack Register on next poll. ✅

**Deliverable:** ✅ Embedded chains are live, inspectable, and attackable on par with embedded claims/arguments.

---

### Week 3: Enabler display in prongs ⭐ — ✅ SHIPPED (April 27, 2026)

**Goal:** Surface inference assumptions in thesis composition.

**Tasks:**
- [x] Adapt [EnablerPanel.tsx](components/chains/EnablerPanel.tsx) to accept a prong's argument list (handled by reshaping `prong.arguments` → `Node<ChainNodeData>[]` inside `ProngEditor`; `EnablerPanel` itself was unchanged — it already operates on `data.argument.argumentSchemes`).
- [x] Add "Assumptions" tab to [ProngEditor.tsx](components/thesis/ProngEditor.tsx) (alongside Arguments).
- [x] Show enabler count badge in [ThesisComposer.tsx](components/thesis/ThesisComposer.tsx) prong cards.
- [x] Surface scheme `justification` per node inside the EnablerPanel (already shipped pre-Week-3; verified live in prong context).
- [x] Wire challenge button to existing CQ interface ([CriticalQuestionsV3.tsx](components/claims/CriticalQuestionsV3.tsx)) inside a dialog opened from the Assumptions tab.
- [x] **API support:** extend [/api/thesis/[id]](app/api/thesis/[id]/route.ts) GET include with `argumentSchemes → scheme(premises)`; add new GET at [/api/thesis/[id]/prongs/[prongId]](app/api/thesis/[id]/prongs/[prongId]/route.ts).
- [ ] **(deferred)** Pass scheme key as `prefilterKeys` to `CriticalQuestionsV3` so only scheme-relevant CQs are shown when challenging an enabler.
- [ ] **(deferred)** Verify CQ status updates flow through to [ConfidenceBadge.tsx](components/thesis/ConfidenceBadge.tsx) (next live-poll cycle should pick it up since CQ status is already part of the live payload).

**Deliverable:** ✅ Enabler panel integrated into thesis prong workflow.

---

### Week 4: Chain ↔ prong conversion ⭐ — ✅ SHIPPED (Apr 27, 2026)

**Goal:** Round-trip between graph (chain) and linear (prong) views.

**Tasks:**
- [x] Implement `POST /api/thesis/[id]/prongs/from-chain`
  - Topological sort respecting `PRESUPPOSES` and `ENABLES` edges.
  - Map `ChainNodeRole` (PREMISE/EVIDENCE/CONCLUSION/OBJECTION/REBUTTAL/QUALIFIER/COMMENT) to `ArgumentRole` (PREMISE/INFERENCE/COUNTER_RESPONSE).
  - Carry `ArgumentSchemeInstance.justification` into `ThesisProngArgument.note`.
- [x] Implement `POST /api/argument-chains/from-prong`
  - Detect presuppositions via scheme analysis (use enabler extraction pipeline).
  - Infer `ENABLES` edges from enablers; preserve prong order as `nodeOrder`.
  - Convert COUNTER_RESPONSE arguments to OBJECTION nodes.
- [ ] **(deferred)** Build conversion options modal (strategy selection, metadata preservation toggles). The endpoints accept `includeObjections` / `includeComments` / `inferEnables` flags but only sensible defaults are exposed in the UI today.
- [x] Add "Import from Chain" / "Export to Chain" buttons to [ProngEditor.tsx](components/thesis/ProngEditor.tsx).
- [ ] **(deferred)** **Test:** Round-trip conversion preserves structure (chain → prong → chain produces equivalent graph modulo layout). Manual round-trip verified; automated test pending.

**Deliverable:** ✅ Seamless conversion between chain and prong formats.

---

### Week 5: Reconstruction versioning ⭐

**Goal:** Multiple interpretations and comparison.

**Tasks:**
- [ ] Add `parentChainId`, `versionLabel`, `versionNotes`, `forkReason` to `ArgumentChain` in [lib/models/schema.prisma](lib/models/schema.prisma); `npx prisma db push`.
- [ ] Add "Fork This Chain" button to [ArgumentChainCanvas.tsx](components/chains/ArgumentChainCanvas.tsx).
- [ ] Implement fork logic (copy nodes/edges, set `parentChainId`, prompt for `versionLabel` + `forkReason`).
- [ ] Build `ChainVersionBrowser` component (tree view of versions in same deliberation).
- [ ] Build `ChainDiffViewer` component (side-by-side comparison; reuse layout patterns from [ThesisSnapshotDiff.tsx](components/thesis/ThesisSnapshotDiff.tsx) where applicable).
- [ ] Allow thesis content to embed a version-comparison view (two `ArgumentChainNode` ids side-by-side).
- [ ] **Test:** Fork chain, modify structure, compare versions; embed both in a thesis and verify each lights up live independently.

**Deliverable:** Full reconstruction versioning with comparison tools.

---

## Success Metrics

### Coverage
- % of theses using ArgumentChain embeds (goal: 40%)
- % of prongs showing enabler analysis (goal: 60%)
- % of arguments with justification filled (goal: 30%)

### Quality
- Avg number of PRESUPPOSES edges per embedded chain (goal: 3+)
- Avg enabler count surfaced per prong (goal: 5+)
- Chain ↔ prong conversion success rate (goal: 95%+)

### Adoption
- Number of reconstruction versions per philosophical text (goal: 2-3)
- % of CPR-related theses using chain embeds (goal: 80%+)
- User satisfaction with integrated workflow (goal: 4.5/5)

---

## Impact on CPR Capability (Revised April 2026)

### Current State (post-Living-Thesis-V1, no D4): ~88% Capable

**Strengths:**
- ✅ PRESUPPOSES + ENABLES edges exist on chains.
- ✅ Justification field exists **and is now displayed** ([ArgumentCardV2.tsx#L1428](components/arguments/ArgumentCardV2.tsx#L1428), [ProngEditor.tsx#L322](components/thesis/ProngEditor.tsx#L322)).
- ✅ Enabler extraction works (chain canvas only).
- ✅ Living Thesis V1 surfaces every embedded object live and inspectable.
- ✅ Glossary system operational.

**Gaps (this is exactly D4):**
- ❌ Thesis can't embed chains (graphs invisible to thesis content).
- ❌ Enablers not shown in thesis composition.
- ❌ No reconstruction versioning.
- ❌ No chain ↔ prong conversion.

---

### With D4 shipped: 95%+ Capable ⭐

**New Capabilities:**
1. ✅ **Chain embeds in thesis** — display CPR reconstructions as interactive graphs that participate in `/live`, `/attacks`, the inspector, and snapshots.
2. ✅ **Enabler visibility** — surface assumptions during composition (and challenge them via CQs).
3. ✅ **Round-trip workflow** — chain ↔ prong conversion.
4. ✅ **Version comparison** — multiple reconstructions side-by-side, each independently live.

**Remaining ~5% Gaps (post-D4):**
- Textual anchoring (`sourceText` field for "CPR B275:3–7").
- ASPIC+ strict rules surfaced in chain UI (deductive vs. defeasible distinction).
- Long-form commentary (paragraph-level annotations on reconstructions).

**Result:** Mesh becomes **premier platform for sustained philosophical argumentation** at Kant CPR level.

---

## Comparison: Thesis-Only vs. Integrated Workflow

### Scenario: Reconstructing Kant CPR B159-B165 (Deduction)

#### Thesis-Only Workflow (Current — post-V1, pre-D4)

1. User reads CPR B159-B165
2. User creates ArgumentChain in deliberation (graph with PRESUPPOSES edges)
3. User switches to thesis composer
4. **User must manually list arguments in prong** (loses graph structure)
5. User writes prose explaining inference dependencies
6. **Presuppositions invisible** — described in prose only
7. **Enablers invisible** — reader can't see assumptions
8. ✅ Justification visible per-argument (V1 work landed this)
9. ✅ Per-argument live label, attack badges, evidence count visible (V1 live nodes)
10. ❌ Chain itself is unreachable from the thesis surface

**Result:** Live argument list with prose explanation. **Graph structure still lost.**

---

#### Integrated Workflow (After Priority 1-5)

1. User reads CPR B159-B165
2. User creates ArgumentChain with PRESUPPOSES edges
3. User fills justification fields explaining interpretive choices
4. User inserts chain into thesis via `ArgumentChainNode`
5. **Chain displays as interactive graph** in thesis
6. **Enabler panel shows assumptions** (toggleable)
7. **Justification visible** (💭 icons on arguments)
8. **Multiple versions** (Allison vs. Guyer) embedded side-by-side

**Result:** Rich philosophical analysis with full graph structure. **Maximum scholarly rigor.**

---

## Next Steps

With Living Thesis V1 (Phases 1–7), justification visibility, **and D4 Week 1–2 (chain embedding + V1 wiring)** all shipped, the remaining path is:

1. ✅ ~~D4 Week 1–2 — Chain embedding + V1 wiring.~~ **Done April 27, 2026.**
2. ✅ ~~D4 Week 3 — EnablerPanel into prongs.~~ **Done April 27, 2026.** See top-of-doc Week 3 status block.
3. **Next: Week 5 — Reconstruction versioning** (`parentChainId` schema push, fork button, version browser, side-by-side diff embed). Optional Week-4 follow-ups: Conversion-Options modal + automated round-trip test.
4. **Then Week 5 — Reconstruction versioning** (`parentChainId` + fork UI + diff view; can be parallelized with conversion if capacity exists).

**Locked decisions (approved April 26, 2026):**
- ✅ **`ThesisChainReference` shape:** **both** — TipTap `argumentChain` node attrs are the in-content source of truth, plus an explicit `ThesisChainReference` row materialized whenever the thesis is saved. Powers `/api/objects/[kind]/[id]/backlinks` and avoids re-walking content JSON on every poll. Carries a `role` enum (`MAIN | SUPPORTING | OBJECTION_TARGET | COMPARISON`) and optional `prongId` / `sectionId` / `caption`.
- ✅ **Chain-as-mainClaim at prong level:** **not in V1** — content-embed only. Revisit after usage data. (No `ThesisProng.mainChainId` column for now.)
- ✅ **Versioning storage:** **`parentChainId` self-relation only.** No `ChainDiff` table in V1 — diffs computed on demand from node/edge sets at compare time.
---

## Strategic Recommendation

**Key Insight:** The thesis system and ArgumentChain system are currently **ships passing in the night**. Integration is not cosmetic - it's **foundational for CPR-level work**.

**Vision:** Mesh thesis becomes the **de facto standard for philosophical reconstruction** by:
1. Enabling **graph-based argument display** (chains embedded in thesis)
2. Surfacing **inference assumptions** (enabler panel in prongs)
3. Showing **interpretive reasoning** (justification field visibility)
4. Supporting **multiple interpretations** (reconstruction versioning)
5. Enabling **seamless workflow** (chain ↔ prong conversion)

**Timeline to Full Capability (revised April 27, 2026):**
- Pre-V1 baseline: 85% capable.
- Post-Living-Thesis-V1 + justification surfacing: ~88% capable.
- ✅ **After D4 Week 1–2 (chain embedding live in thesis) — today: ~92% capable.**
- After D4 Week 5 (versioning + conversion): **95%+ capable**.

**Result:** Mesh becomes **THE tool for CPR-level philosophical argumentation** — no competitor comes close.

---

**Document Status:** Re-audited April 26, 2026 — ready for D4 implementation kickoff.  
**Next Action:** Lock the three open decisions in "Next Steps" above, then begin D4 Week 1–2.  
**Related Work:** [docs/LIVING_THESIS_ROADMAP.md](docs/LIVING_THESIS_ROADMAP.md) (Phases 1–7 complete), [docs/LIVING_THESIS_DEFERRED.md](docs/LIVING_THESIS_DEFERRED.md) (D4 source-of-truth).
