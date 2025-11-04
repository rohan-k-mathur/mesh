# LociTree Ludics Accuracy Enhancement Plan

**Goal:** Transform LociTreeWithControls into an accurate, expressive viewer of ludics formal dialogues

**Date:** November 4, 2025

---

## Ludics Theory → Visual Requirements Mapping

### Core Concepts from "Dialogues in Ludics" (Fleury, Quatrini, Tron¸con)

**Quote:** *"Ludics is a relevant framework to ensure both the formalisation and another way for studying dialogues... investigating the dynamics of interactive situations, offers richful intuitions and mathematical means easily linkable to the natural structure of our object."*

**Key Insight:** Ludics exposes the **interactive layer** of dialogues, distinct from propositional/constructive layers.

---

## 1. Formal Ludics Structure (What We Must Show)

### 1.1 **Designs** (Strategies) — Currently: ✅ Partially shown
```
Design = Coherent set of justified actions at loci
       = "Interaction-ready proof object"
       = "Strategy for conducting dialogue"
```

**Current State:**
- ✅ Two designs fetched (Proponent, Opponent)
- ✅ Merged into unified tree via `mergeDesignsToTree`
- ❌ No visual distinction between "my design" vs "opponent's design"
- ❌ No indication of design ID, version, or semantics metadata
- ❌ "Participant" abstraction (Proponent/Opponent) not explained

**Enhancement:**
```tsx
// Show design headers with metadata
<div className="design-header">
  <h3>
    <span className="polarity-badge">+</span> Proponent Design
    <code className="text-[10px]">{proDesignId.slice(0,8)}</code>
  </h3>
  <div className="text-xs text-slate-600">
    Semantics: {design.semantics} | Version: {design.version}
  </div>
  <div className="text-xs text-slate-500">
    Strategy: Coherent set of justified actions across loci
  </div>
</div>
```

---

### 1.2 **Actions** (±, Polarity) — Currently: ✅ Shown but under-explained
```
Action ::= Positive (+, ξ, I)  "opens/enables child set I at locus ξ"
        |  Negative (−, ξ.i)   "focuses/responds at sub-address ξ.i"
        |  Daimon (♦, ⊥)        "terminal success/give-up"
```

**Current State:**
- ✅ Acts shown with polarity chips (P/O)
- ✅ Daimon acts shown (†)
- ❌ No explanation of what polarity means (alternation principle)
- ❌ Positive acts don't visually "open" their ramification
- ❌ Negative acts don't show they're "responding" to a positive

**Enhancement:**
```tsx
// Positive act (opener)
<ActChip polarity="P" title="Positive action: Opens child loci {ramification}">
  <span className="opener-arrow">⇒</span>
  {expression}
  <span className="ramification-preview">→ {ramification.join(', ')}</span>
</ActChip>

// Negative act (responder)
<ActChip polarity="O" title="Negative action: Responds to opener at parent locus">
  <span className="responder-arrow">⇐</span>
  {expression}
  <span className="justification">← @ {meta.justifiedByLocus}</span>
</ActChip>

// Daimon (terminal)
<ActChip polarity="†" title="Daimon: Terminal action (success or give-up)">
  ♦ {expression || 'END'}
</ActChip>
```

---

### 1.3 **Loci** (Addresses) — Currently: ✅ Shown but not annotated
```
Locus = Explicit place of play
      = Address like "ε", "σ", "σ·1", "σ·1.2"
      = "Branching encodes independence"
```

**Current State:**
- ✅ Loci shown with paths (0, 0.1, 0.1.1, etc.)
- ❌ No visual indicator of "address space"
- ❌ Independence of branches not explained
- ❌ No "base locus" vs "sub-address" distinction

**Enhancement:**
```tsx
// Locus node header with address semantics
<div className="locus-header">
  <code className="address">ξ = {path}</code>
  {path === '0' && <span className="badge">base/root</span>}
  {path.split('.').length > 2 && (
    <span className="badge">sub-address (depth {path.split('.').length})</span>
  )}
  <div className="text-[10px] text-slate-500">
    Independent branch: actions here don't interfere with siblings
  </div>
</div>
```

---

### 1.4 **Ramification** (Directory) — Currently: ❌ Not shown
```
Ramification = Child-set I enabled by positive action
Directory    = Immediately testable sub-addresses of negative behaviour
             = "Controls additivity"
```

**Current State:**
- ✅ `ramification` data exists in act.ramification
- ❌ Not visually rendered
- ❌ Users can't see which children are "opened" by a positive act
- ❌ Directory concept (what's testable?) not exposed

**Enhancement:**
```tsx
// In positive act chip: show opened children
{act.ramification && act.ramification.length > 0 && (
  <div className="ramification-visual">
    <span className="text-[10px] text-slate-600">Opens:</span>
    {act.ramification.map(child => (
      <span key={child} className="child-badge">
        {n.path}.{child}
      </span>
    ))}
  </div>
)}

// In locus node: show directory (what children exist)
<div className="directory text-[10px] text-slate-500">
  Dir({path}) = {'{' + children.map(c => c.path.split('.').slice(-1)).join(', ') + '}'}
</div>
```

---

### 1.5 **Chronicle** (Coherent View) — Currently: ❌ Not shown
```
Chronicle = Coherent alternating path of actions
          = Justified sequence (what enabled what, where)
          = "Observational trace through a design"
```

**Current State:**
- ✅ `LudicChronicle` exists in DB schema
- ❌ Not fetched or displayed
- ❌ Users can't see "history" of how design was built
- ❌ Justification pointers (parent → child) not shown

**Enhancement:**
```tsx
// Add chronicle view tab/section
<Tabs>
  <Tab value="tree">Tree View</Tab>
  <Tab value="chronicle">Chronicle (Linear History)</Tab>
</Tabs>

// Chronicle view: shows acts in order with justification
<div className="chronicle-view">
  {chronicle.map((entry, i) => (
    <div key={i} className="chronicle-entry">
      <span className="step-number">{i+1}</span>
      <ActChip {...entry.act} />
      {entry.justifiedBy && (
        <span className="justification-arrow">
          ← justified by step {chronicle.findIndex(e => e.id === entry.justifiedBy) + 1}
        </span>
      )}
    </div>
  ))}
</div>
```

---

### 1.6 **Interaction / Normalization** (Trace) — Currently: ✅ Computed but unclear
```
Interaction = Running design D against counter-design E
            = Shared traversal of loci
Normalization = "Run converges" (reaches terminal via ♦)
```

**Current State:**
- ✅ Trace computed via `/api/ludics/step`
- ✅ Pairs shown with step indices
- ❌ Not explained what "interaction" means
- ❌ Convergence/divergence shown but not defined
- ❌ No visual "handshake" between P and O acts

**Enhancement:**
```tsx
// Add interaction explanation
<div className="interaction-explainer">
  <h4>Interaction: ⟨Proponent | Opponent⟩</h4>
  <p className="text-xs text-slate-600">
    Normalization: Running both designs against each other at shared loci.
    Converges when both reach daimon (♦). Diverges if stuck or timeout.
  </p>
</div>

// Visualize handshake pairs in trace
{tracePairs.map((pair, i) => (
  <div key={i} className="trace-pair">
    <ActChip actId={pair.posActId} highlight />
    <span className="handshake-icon">⇄</span>
    <ActChip actId={pair.negActId} highlight />
    <span className="locus-label">@ {pair.locusPath}</span>
  </div>
))}
```

---

### 1.7 **Orthogonality** (D ⟂ E) — Currently: ✅ Computed but not explained
```
D ⟂ E ⟺ ⟨D | E⟩ converges (normalizes)
       = "Designs are compatible"
       = "Interaction succeeds"
```

**Current State:**
- ✅ Orthogonality status computed in insights
- ❌ Symbol ⟂ not used
- ❌ Not explained what orthogonality means
- ❌ "Pending" status unclear (is it computing or unknown?)

**Enhancement:**
```tsx
// Orthogonality badge with explanation
<div className="orthogonality-status">
  {orthogonal === true && (
    <div className="badge bg-emerald-100 text-emerald-700">
      ⟂ Orthogonal
      <Tooltip>Designs are compatible: interaction converges</Tooltip>
    </div>
  )}
  {orthogonal === false && (
    <div className="badge bg-rose-100 text-rose-700">
      ⊥ Not Orthogonal
      <Tooltip>Designs are incompatible: interaction diverges or stucks</Tooltip>
    </div>
  )}
  {orthogonal === null && (
    <div className="badge bg-slate-100 text-slate-600">
      ? Pending
      <Tooltip>Orthogonality not yet computed</Tooltip>
    </div>
  )}
</div>
```

---

### 1.8 **Additives** (Local choice) — Currently: ✅ Shown but unclear
```
Additive = Choice at same base/directory
&  (with) = Intersection of behaviours (both branches valid)
⊕  (plus) = Polar dual (opponent chooses)
```

**Current State:**
- ✅ Additive marker (⊕) shown on acts
- ✅ `usedAdditive` shows which branch was chosen
- ❌ Not explained what "additive" means
- ❌ No visual "exclusive choice" indicator
- ❌ Intersection (& withop) not distinguished from plus (⊕)

**Enhancement:**
```tsx
// Additive node visual
{isAdditiveParent(node) && (
  <div className="additive-indicator">
    <span className="additive-symbol">⊕</span>
    <span className="text-xs text-purple-700">
      Additive choice: exactly ONE branch will be taken
    </span>
    {usedAdditive?.[node.path] && (
      <span className="chosen-branch bg-purple-100 px-1 rounded">
        Chosen: {node.path}.{usedAdditive[node.path]}
      </span>
    )}
  </div>
)}

// Distinguish ⊕ (plus) vs & (with)
{act.meta?.additiveKind === 'plus' && <span title="Plus: Opponent chooses">⊕</span>}
{act.meta?.additiveKind === 'with' && <span title="With: Proponent chooses">&amp;</span>}
```

---

### 1.9 **Daimon** (♦, Terminal) — Currently: ✅ Shown but minimal
```
Daimon = Special terminal action
       = Ends run as success
       = "Give up" in proof-nets
```

**Current State:**
- ✅ Daimon acts shown with † symbol
- ❌ Not explained what daimon means
- ❌ No indication of "where normalization ended"
- ❌ `suggestCloseDaimonAt` prop not used

**Enhancement:**
```tsx
// Daimon act with explanation
<ActChip kind="DAIMON" title="Daimon (♦): Terminal action marking success or give-up">
  ♦ {expression || 'END'}
</ActChip>

// Show where trace ended with daimon
{trace.endedAtDaimonForParticipantId && (
  <div className="daimon-marker bg-slate-800 text-white px-2 py-1 rounded text-xs">
    ♦ Normalized: {trace.endedAtDaimonForParticipantId} reached terminal
  </div>
)}

// Suggest close button when appropriate
{suggestCloseDaimonAt?.(node.path) && !node.acts.some(a => a.kind === 'DAIMON') && (
  <button className="suggest-close-btn">
    <span>Suggest ♦ here</span>
    <Tooltip>This locus can be closed with daimon</Tooltip>
  </button>
)}
```

---

### 1.10 **Delocation / Shift** — Currently: ❌ Not shown
```
Delocation = Injective renaming of loci
           = Restore disjointness before forming additives
           = "Fax" evidence into new locus
           = Tag like .L vs .R to avoid collision
```

**Current State:**
- ✅ `meta.delocated` and `meta.delocatedFromDesignId` exist
- ❌ Not visually indicated
- ❌ Users can't see "this act was faxed from elsewhere"
- ❌ Renaming/tagging not shown

**Enhancement:**
```tsx
// Delocation indicator
{act.meta?.delocated && (
  <div className="delocation-badge">
    <span className="icon">📠</span>
    <span className="text-[10px] text-purple-600">
      Delocated (faxed) from design {act.meta.delocatedFromDesignId?.slice(0,6)}
    </span>
    <Tooltip>
      This act was "shifted" (renamed) from another design to restore locus independence
    </Tooltip>
  </div>
)}
```

---

### 1.11 **Freshness** (Exponentials) — Currently: ❌ Not shown
```
Freshness = New sub-loci are distinct, no aliasing
          = Essential for copy (! exponential)
          = σ·0, σ·1, σ·2... each independent
```

**Current State:**
- ✅ Copy operation exists (`LocusControls`)
- ❌ Not explained what "fresh" means
- ❌ No indication of how copies maintain independence

**Enhancement:**
```tsx
// In LocusControls: explain freshness
<div className="copy-explainer text-xs text-slate-600 mb-1">
  <strong>Copy (σ·i):</strong> Duplicate locus structure with fresh addresses.
  Each copy (σ·0, σ·1, σ·2...) is independent—no aliasing.
  <span className="text-slate-500">(Exponential ! in linear logic)</span>
</div>
```

---

### 1.12 **Uniformity** (Quantifiers) — Currently: ✅ Indicated minimally
```
Uniformity = Parameter-independent tests
           = Quantified behaviours (∀/∃)
           = Fresh-name discipline
```

**Current State:**
- ✅ `UniformityPill` exists in `LocusControls`
- ❌ Not explained what uniformity means
- ❌ Not clear how it relates to quantifiers

**Enhancement:**
```tsx
// Enhanced UniformityPill with explanation
<UniformityPill ... />
<Tooltip>
  Uniformity: All children of this locus follow the same pattern.
  Enables universal quantification (∀): tests cannot observe private codes.
</Tooltip>
```

---

## 2. Visual Expression Priority Order

### Phase 1: Core Ludics Semantics (This Week)

**Goal:** Make every ludics concept visible and explained

1. ✅ **Design headers with metadata** (participant, semantics, version)
2. ✅ **Polarity explanation** (+ opener, − responder, ♦ terminal)
3. ✅ **Ramification arrows** (show which children are opened)
4. ✅ **Orthogonality badge** with ⟂ symbol and explanation
5. ✅ **Additive choice visual** (⊕ with "exactly one" indicator)
6. ✅ **Daimon explanation** (♦ as terminal success)

### Phase 2: Interaction Dynamics (Next Week)

**Goal:** Show how designs interact and normalize

7. ✅ **Interaction explainer** (what ⟨D | E⟩ means)
8. ✅ **Trace handshake visualization** (P ⇄ O pairs)
9. ✅ **Convergence/divergence status** with ludics terminology
10. ✅ **Decisive step highlighting** (where interaction became deterministic)
11. ✅ **Normalization endpoint** (where ♦ was reached)

### Phase 3: Advanced Structure (Future)

**Goal:** Expose internal composition and justification

12. ✅ **Chronicle view** (linear history with justification pointers)
13. ✅ **Directory display** (Dir(ξ) = testable children)
14. ✅ **Delocation indicators** (📠 faxed acts)
15. ✅ **Freshness explanation** (copy independence)
16. ✅ **Uniformity tooltip** (quantifier connection)

---

## 3. Implementation Plan

### 3.1 Fetch Additional Data

```tsx
// Add design metadata to SWR response
const { data: designsData } = useSWR(
  `/api/ludics/designs?deliberationId=${dialogueId}` + 
  '&include=metadata,semantics,version,chronicle',
  fetcher
);

// Parse designs with full structure
const designs = React.useMemo(() => {
  if (!designsData?.designs) return [];
  return designsData.designs.map(d => ({
    id: d.id,
    participantId: d.participantId,
    semantics: d.semantics || 'CLASSICAL',
    version: d.version || 1,
    acts: d.acts || [],
    chronicle: d.chronicle || [], // NEW: chronological order
    extJson: d.extJson || {},
  }));
}, [designsData]);
```

### 3.2 Enhance LociTree Node Renderer

```tsx
// Add ludics annotations to each node
function renderNode(node: LociNode) {
  return (
    <div className="locus-node">
      {/* Locus header with address semantics */}
      <div className="locus-header">
        <code className="address">ξ = {node.path}</code>
        {node.path === '0' && <span className="badge">base</span>}
        <span className="text-[10px] text-slate-500">
          Address space: independent branch
        </span>
      </div>

      {/* Acts with polarity semantics */}
      <div className="acts-rail">
        <div className="positive-acts">
          {actsP.map(act => (
            <ActChipEnhanced 
              act={act} 
              showRamification 
              showJustification 
              showDelocation
            />
          ))}
        </div>
        <div className="negative-acts">
          {actsO.map(act => (
            <ActChipEnhanced 
              act={act} 
              showRamification 
              showJustification 
              showDelocation
            />
          ))}
        </div>
      </div>

      {/* Directory (what's testable) */}
      {node.children.length > 0 && (
        <div className="directory text-[10px] text-slate-500">
          Dir({node.path}) = {'{' + node.children.map(c => 
            c.path.split('.').slice(-1)
          ).join(', ') + '}'}
        </div>
      )}

      {/* Additive choice indicator */}
      {isAdditiveParent(node) && (
        <div className="additive-indicator">
          <span className="additive-symbol">⊕</span>
          <span className="text-xs text-purple-700">
            Additive: exactly ONE branch
          </span>
          {usedAdditive?.[node.path] && (
            <span className="chosen-branch">
              Chosen: {node.path}.{usedAdditive[node.path]}
            </span>
          )}
        </div>
      )}

      {/* Children (recursive) */}
      {isOpen(node.path) && node.children.map(renderNode)}
    </div>
  );
}
```

### 3.3 Enhanced Act Chip Component

```tsx
type ActChipProps = {
  act: {
    id: string;
    kind: 'PROPER' | 'DAIMON';
    polarity?: 'P' | 'O' | null;
    expression?: string;
    ramification?: string[];
    meta?: {
      justifiedByLocus?: string;
      delocated?: boolean;
      delocatedFromDesignId?: string;
      schemeKey?: string;
      cqId?: string;
    };
  };
  showRamification?: boolean;
  showJustification?: boolean;
  showDelocation?: boolean;
  stepIndex?: number;
};

function ActChipEnhanced({ act, ...flags }: ActChipProps) {
  if (act.kind === 'DAIMON') {
    return (
      <span 
        className="act-chip daimon" 
        title="Daimon (♦): Terminal action (success/give-up)"
      >
        ♦ {act.expression || 'END'}
      </span>
    );
  }

  const isPositive = act.polarity === 'P';
  const isNegative = act.polarity === 'O';

  return (
    <div className="act-chip-container">
      <span className={`act-chip ${isPositive ? 'positive' : 'negative'}`}>
        {/* Polarity arrow */}
        {isPositive && <span className="arrow" title="Positive: Opens children">⇒</span>}
        {isNegative && <span className="arrow" title="Negative: Responds to parent">⇐</span>}
        
        {/* Expression */}
        <span className="expression">{act.expression || 'act'}</span>
        
        {/* Step index */}
        {stepIndex && (
          <sup 
            className="step-index" 
            title={`Used at step ${stepIndex} in trace`}
          >
            {stepIndex}
          </sup>
        )}
      </span>

      {/* Ramification (for positive acts) */}
      {flags.showRamification && isPositive && act.ramification?.length > 0 && (
        <div className="ramification-preview text-[10px] text-slate-600">
          → Opens: {act.ramification.join(', ')}
        </div>
      )}

      {/* Justification (for negative acts) */}
      {flags.showJustification && isNegative && act.meta?.justifiedByLocus && (
        <div className="justification text-[10px] text-slate-500">
          ← Responds to {act.meta.justifiedByLocus}
        </div>
      )}

      {/* Delocation indicator */}
      {flags.showDelocation && act.meta?.delocated && (
        <div className="delocation-badge text-[10px] text-purple-600">
          <span>📠</span> Faxed from {act.meta.delocatedFromDesignId?.slice(0,6)}
        </div>
      )}

      {/* CQ/Scheme badges */}
      {act.meta?.cqId && (
        <span className="cq-badge text-[10px] px-1 rounded bg-blue-100 text-blue-700">
          CQ: {act.meta.cqId}
        </span>
      )}
      {act.meta?.schemeKey && (
        <span className="scheme-badge text-[10px] px-1 rounded bg-purple-100 text-purple-700">
          {act.meta.schemeKey}
        </span>
      )}
    </div>
  );
}
```

### 3.4 Add Interaction Explainer Panel

```tsx
function InteractionPanel({ trace, orthogonal }: { 
  trace: StepResult; 
  orthogonal: boolean | null; 
}) {
  return (
    <div className="interaction-panel rounded border bg-slate-50 p-3 mb-2">
      <h4 className="text-sm font-bold mb-2">Interaction: ⟨Proponent | Opponent⟩</h4>
      
      {/* Orthogonality status */}
      <div className="orthogonality-status mb-2">
        {orthogonal === true && (
          <div className="badge bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded">
            ⟂ Orthogonal (Compatible)
            <Tooltip>Designs converge: interaction normalizes successfully</Tooltip>
          </div>
        )}
        {orthogonal === false && (
          <div className="badge bg-rose-100 text-rose-700 text-xs px-2 py-1 rounded">
            ⊥ Not Orthogonal (Incompatible)
            <Tooltip>Designs diverge: interaction stuck or timed out</Tooltip>
          </div>
        )}
      </div>

      {/* Trace status */}
      <div className="trace-status mb-2">
        <span className={`badge text-xs px-2 py-1 rounded ${
          trace.status === 'CONVERGENT' ? 'bg-emerald-100 text-emerald-700' :
          trace.status === 'DIVERGENT' ? 'bg-rose-100 text-rose-700' :
          trace.status === 'STUCK' ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {trace.status === 'CONVERGENT' && '✓ Convergent (Normalized)'}
          {trace.status === 'DIVERGENT' && '✗ Divergent'}
          {trace.status === 'STUCK' && '⚠ Stuck'}
          {trace.status === 'ONGOING' && '⟳ Ongoing'}
        </span>
      </div>

      {/* Normalization endpoint */}
      {trace.endedAtDaimonForParticipantId && (
        <div className="normalization-end text-xs text-slate-600">
          ♦ Normalized: {trace.endedAtDaimonForParticipantId} reached terminal (daimon)
        </div>
      )}

      {/* Trace pairs summary */}
      <div className="trace-summary text-xs text-slate-500">
        {trace.pairs.length} interaction steps
        {trace.decisiveIndices && trace.decisiveIndices.length > 0 && (
          <span className="ml-2">
            • Decisive at steps: {trace.decisiveIndices.join(', ')}
          </span>
        )}
      </div>

      {/* Explanation */}
      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
        <strong>Normalization:</strong> Running both designs against each other at shared loci.
        Each step is a "handshake" where Proponent and Opponent exchange actions.
        Converges when both reach daimon (♦). Diverges if stuck or incompatible.
      </p>
    </div>
  );
}
```

### 3.5 Add Design Headers

```tsx
function DesignHeader({ design }: { design: LudicDesign }) {
  return (
    <div className="design-header rounded border bg-white p-2 mb-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <span className={`polarity-badge ${
              design.participantId === 'Proponent' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
            } px-1.5 py-0.5 rounded text-xs`}>
              {design.participantId === 'Proponent' ? '+' : '−'}
            </span>
            {design.participantId} Design
            <code className="text-[10px] text-slate-500 font-mono">
              {design.id.slice(0,8)}
            </code>
          </h3>
          <div className="text-xs text-slate-600 mt-0.5">
            Semantics: {design.semantics || 'CLASSICAL'} | 
            Version: {design.version || 1} | 
            Acts: {design.acts?.length || 0}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Strategy: Coherent set of justified actions
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Success Metrics

**Accuracy Goals:**
- ✅ Every ludics concept has a visual representation
- ✅ Polarity alternation (±) is visible and explained
- ✅ Ramification (child-opening) is explicit
- ✅ Orthogonality (⟂) uses correct symbol and definition
- ✅ Additive choice (⊕) shows exclusivity
- ✅ Daimon (♦) marked as terminal
- ✅ Interaction/normalization explained in ludics terms
- ✅ Chronicle (justified sequence) viewable

**Expressiveness Goals:**
- ✅ Tree shows "interactive layer" distinct from propositional layer
- ✅ Designs shown as "strategies" not just "data"
- ✅ Loci shown as "addresses" with independence semantics
- ✅ Trace shown as "handshake sequence" not just "log"
- ✅ Delocation (shift) visible when present
- ✅ Freshness (copy independence) explained

---

## 5. Implementation Timeline

**Immediate (Today/Tomorrow):**
1. Add design headers with metadata
2. Enhance act chips with polarity arrows (⇒, ⇐, ♦)
3. Add ramification preview on positive acts
4. Add orthogonality badge with ⟂ symbol

**Short-Term (This Week):**
5. Add interaction explainer panel
6. Add directory display (Dir(ξ) = {...})
7. Add additive choice visual
8. Add delocation badges (📠)

**Medium-Term (Next Week):**
9. Add chronicle view tab
10. Add justification pointers in chronicle
11. Add trace handshake visualization
12. Add decisive step highlighting

**Long-Term (Future):**
13. Add freshness explanation tooltips
14. Add uniformity connection to quantifiers
15. Add normalization animation (step-by-step)
16. Add interactive "run trace" feature

---

## Next Steps

**Phase 1A: Core Semantics (2-3 hours)**
- Add design headers
- Enhance act chips with polarity semantics
- Add orthogonality badge

**Phase 1B: Structural Clarity (2-3 hours)**
- Add ramification arrows
- Add directory display
- Add additive choice visual

**Phase 1C: Interaction Dynamics (2-3 hours)**
- Add interaction explainer
- Add trace status panel
- Add normalization endpoint marker

**Total to "Accurate Passive Viewer":** ~1 day of focused work

Would you like me to start with Phase 1A (design headers + polarity semantics)?
