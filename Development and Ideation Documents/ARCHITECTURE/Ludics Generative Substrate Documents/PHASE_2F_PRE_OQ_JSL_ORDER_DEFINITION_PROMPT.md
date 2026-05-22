# Phase 2f Pre-Session Prompt — What does $\leq_\subseteq$ actually mean?

**Purpose.** Standalone prompt for a short, narrowly-scoped definitional
session that resolves an ambiguity in how the relation $\leq_\subseteq$
between designs in a behaviour is used across Phase 2e and the Phase 2f
OQ-JSL-Type/Cone prompt. This session is a **prerequisite** to the
OQ-JSL-Type/Cone session (`PHASE_2F_OQ_JSL_TYPE_AND_CONE_PROMPT.md`);
running them in the wrong order risks producing a resolution document whose
load-bearing claim is wrong.

The session is a **close-reading + mathematical-verification exercise**,
not a proof. The deliverable is short (5–10 pages) and produces a single
unambiguous definition that subsequent sessions reuse.

**Do not work on this in the implementation thread.** No code output.

---

## §0. The ambiguity

Phase 2e (`LUDICS_OQ_JSL_PROOF.md`) and the Phase 2f OQ-JSL-Type/Cone
prompt both use a relation written $D_1 \leq_\subseteq D_2$ between
designs in a behaviour $B$. Phase 2e proved:

1. $\mathsf{Inc}(B)$ is an antichain under $\leq_\subseteq$ (§5.1).
2. Cross-cone designs have no common upper bound under $\leq_\subseteq$
   (§5.2).
3. The cone $C_i = \{ D \in B : |D|_B = D_i \}$ is the correct JSL
   carrier candidate (§5.3).

The Phase 2f prompt then proposes to verify that $(C_i, \leq_\subseteq, \cup)$
is a JSL — where $\cup$ is "literal chronicle-set union" — by showing
that same-cone designs share an incarnation and therefore agree on positive
choices.

**Pre-analysis from the main thread (May 2026) identified a counterexample.**
Concretely: let $B$ be the behaviour at positive base $\xi$ with
$B^\perp = \{ n_\dagger \}$ (the counter-design that immediately plays
daimon). Every design at $\xi$ is in $B$. $\mathsf{Inc}(B) = \{ D_\dagger \}$
(the design that plays daimon at the root). Two designs $D_1, D_2 \in B$
that play different positive actions $\alpha, \beta$ at the root both have
incarnation $D_\dagger$, hence both are in $C = B$. Their literal
chronicle-set union has conflicting positive actions at the root,
violating focalization. So $(C, \leq_\subseteq)$ is not a JSL under
literal union.

**But this hinges on what $\leq_\subseteq$ actually means.** Two readings:

- **Reading (A) — strict chronicle-set inclusion.** $D_1 \leq_\subseteq D_2$
  iff $D_1 \subseteq D_2$ as sets of chronicles. Under this reading, the
  counterexample dissolves: $D_\dagger$ contains the chronicle ending in
  $\dagger$ at the root, which is *not* a chronicle of $D_1$ (because
  $D_1$'s chronicle continues past the root with $\alpha$ instead of
  terminating with $\dagger$). So $D_\dagger \not\subseteq D_1$, and the
  cone of $D_\dagger$ is much thinner than the counterexample assumed.

- **Reading (B) — extension / daimon-replacement order.** $D_1 \leq D_2$
  iff $D_2$ is obtained from $D_1$ by replacing daimons with computation
  and/or extending negative branches. Under this reading, $D_\dagger$ ≤
  $D_1$ and $D_\dagger \leq D_2$ even though $D_1$ and $D_2$ make
  different positive choices at the root. The counterexample stands.

Phase 2e proved (1) and (2) treating the relation as plain set inclusion
— reading (A). The Phase 2f prompt's expected outcome implicitly assumes
the cone is rich enough to be interesting — reading (B). The structure
cannot be both. **This session pins down which reading Fouqueré–Quatrini
2013 actually uses, and reconciles Phase 2e accordingly.**

---

## §1. The question

### §1.1 Primary question

**In Fouqueré–Quatrini 2013 (LMCS 9(4:6)), §2, what is the precise
order relation between a design $D \in B$ and its incarnation $|D|_B$?**

Specifically: given $D \in B$ and $|D|_B \in \mathsf{Inc}(B)$, is the
relation $|D|_B \leq D$:

- **(A)** Literal subset of chronicles ($|D|_B \subseteq D$ as sets of
  chronicles), where the daimon chronicles of $|D|_B$ are themselves
  chronicles of $D$? OR
- **(B)** An "extension" order where daimon-replacement is allowed
  ($D$ is obtained from $|D|_B$ by replacing some daimons with computation
  and/or extending negative branches), and the daimon chronicles of
  $|D|_B$ are not literally chronicles of $D$?

The two readings give incompatible cone structures and force different
salvage paths for OQ-JSL-Cone.

### §1.2 Secondary questions

1. **Is the same relation used in Girard 2001 §4?** If F-Q and Girard
   use different relations, which one does Phase 2e use? Which one
   matches the rest of the Phase 2e proofs?
2. **What is the technical name for the relation?** F-Q may call it
   "is a sub-design of" or use a specific symbol. Pin down the
   terminology so subsequent docs can use it unambiguously.
3. **Does the daimon-chronicle-membership question even arise?** F-Q may
   define designs in a way that sidesteps the issue (e.g., representing
   designs as something other than chronicle sets, or treating the
   daimon as a "node decoration" rather than as part of a chronicle).
4. **Does the relation form a partial order?** Reflexive, antisymmetric,
   transitive — verify directly from F-Q's definition.

---

## §2. What to check in Fouqueré–Quatrini 2013

### §2.1 Definitional sections

- **§2.1–2.2.** How designs are defined: as chronicle sets, as trees,
  as some other structure? Where does the daimon $\dagger$ live in this
  representation — as a chronicle endpoint, as a node label, as something
  else?
- **§2.3.** Definition of $B^\perp$, $B^{\perp\perp}$, and behaviour.
- **§2.4 (or wherever incarnation is defined).** The precise definition
  of $|D|_B$: is it the smallest sub-design of $D$ in $B$ under chronicle-
  set inclusion, or under some other order?
- **§3 (maximal cliques).** The characterization of incarnation via
  visitable paths. Does the clique characterization rely on the
  daimon being or not being a chronicle endpoint?

### §2.2 Specific passages to extract

For each of the following, copy the exact text from F-Q 2013 (or paraphrase
faithfully) and identify which reading it supports:

1. The sentence(s) defining $|D|_B$.
2. The sentence(s) stating that $|D|_B \leq D$ or $|D|_B \subseteq D$
   or whatever symbol is used.
3. Any sentence(s) discussing whether daimon plays differ between $D$
   and $|D|_B$.
4. Any sentence(s) discussing the relationship between designs that
   share an incarnation.

### §2.3 Cross-check

Cross-check the answer against:

- **Girard 2001 §4** (Locus Solum). Specifically the discussion of
  the order between designs in a behaviour and the role of the daimon.
- **Basaldella–Faggian 2011** (LMCS 7(2)). They use F-Q's framework
  and may state the order more explicitly.
- **Doumane 2017** (CSL). The fixed-point treatment of behaviours uses
  some inclusion / approximation order; check whether it matches F-Q's.

---

## §3. Method

This is **not** a proof session. It is a literature-extraction session
with a definitional output. The method:

1. **Read F-Q 2013 §2 cover-to-cover** (it's not long). Note every
   place the daimon appears in a definition.
2. **Identify the precise text** defining $|D|_B$ and the order
   relation.
3. **Resolve the daimon-chronicle question.** Construct a tiny example
   (the $B^\perp = \{ n_\dagger \}$ case from §0 of this prompt is
   sufficient) and walk through F-Q's definitions to determine which
   reading is used. If the tiny example is ambiguous, construct a
   second one.
4. **Cross-check against Girard 2001 §4** and Basaldella–Faggian 2011.
5. **State the verdict** — A, B, or "the literature uses a different
   relation than either, namely _____."

---

## §4. Branching outcomes

### Outcome (A): Strict chronicle-set inclusion

F-Q's relation is literal set inclusion. Daimon chronicles of $|D|_B$
are literally chronicles of $D$ — meaning if $|D|_B$ plays $\dagger$
at $\sigma$, then $D$ also has the daimon chronicle ending at $\sigma$
in its chronicle set, *in addition to* whatever extends past $\sigma$.

**Implications:**
- The pre-analysis counterexample dissolves. Two designs that play
  different positive actions at a node *both* would need to contain
  the daimon chronicle at that node to share an incarnation that plays
  daimon there. But a design cannot have both a daimon chronicle at
  $\sigma$ and a chronicle continuing past $\sigma$ — that violates
  focalization within the design itself. So no two such designs exist
  in the same cone in the first place.
- Phase 2e proofs stand as written.
- Phase 2f OQ-JSL-Type/Cone proceeds as the original prompt specifies.
  The "incarnation fixes positive choices" claim becomes **true** under
  this reading — because the only way to share an incarnation is to
  literally contain its chronicle set, which forces all positive choices
  past daimons to match (vacuously, since none are made past daimons in
  any design sharing the incarnation).
- The cones are "thin": $C_i$ consists only of designs that extend
  $D_i$ by adding negative branches (responses to more opponent moves)
  at nodes where $D_i$ already had non-daimon positive actions. The
  cones are JSLs under literal union; this is the prompt's expected
  outcome.

**Caveat to flag:** Under reading (A), the cone structure may be too
thin for the categorical story C3 needs. Specifically, the per-cone
identification with Ambler hom-sets requires the cones to contain
"enough" designs to populate the hom-set. If extensions past daimons
are excluded from the cone, the cone may be too small to serve as a
JSL of derivations. This becomes a follow-on question for OQ-C3.

### Outcome (B): Extension / daimon-replacement order

F-Q's relation allows daimon-replacement. Daimon chronicles of $|D|_B$
are *not* literally chronicles of $D$ when $D$ extends past those
daimons.

**Implications:**
- The pre-analysis counterexample stands. $(C_i, \leq, \cup)$ is not
  a JSL under literal chronicle-set union.
- **Phase 2e proofs need to be re-checked.** The antichain and cross-cone
  arguments were stated as if the relation were plain set inclusion;
  if F-Q uses a different relation, the proofs need to be re-stated
  in F-Q's terms. The conclusions probably still hold (the antichain
  property is more robust than the proof technique), but the proofs
  themselves are not in their final form.
- Phase 2f OQ-JSL-Cone fails as originally stated. One of the three
  salvage paths from the main thread is needed:
  1. **Coherent sub-cones.** $C_i$ decomposes into multiple
     $C_i^{\text{coh}}$ indexed by patterns of positive choices past
     daimons. Each $C_i^{\text{coh}}$ is a JSL under union.
  2. **Behaviour-level join.** Move to interpretation (b) of OQ-JSL-Type:
     the join is at the behaviour level, $D_1 \vee D_2 = \{D_1, D_2\}^{\perp\perp}$,
     not at the design level.
  3. **Information order.** Replace $\leq_\subseteq$ with an order that
     forbids daimon-replacement; two designs with different positive
     choices past a shared incarnation's daimon are simply incomparable.
- The Phase 2f OQ-JSL-Type/Cone session re-scopes to "evaluate the
  three salvage paths and pick one."

### Outcome (C): Different relation than either

F-Q uses a relation that doesn't match (A) or (B) — e.g., view equivalence,
or an order on visitable paths rather than on chronicles directly.

**Implications:**
- Document the actual relation precisely.
- Re-state Phase 2e and Phase 2f under the actual relation.
- The downstream story depends on the specifics; this session's deliverable
  enables the follow-on work but does not itself complete it.

---

## §5. Output format for LUDICS_ORDER_RELATION_DEFINITION.md

```markdown
# The Order Relation Between Designs in a Behaviour

**Session:** Phase 2f pre-OQ-JSL
**Date:** [date]
**Track:** Definitional / literature-extraction
**Verdict:** [Reading A / Reading B / Reading C]

## 1. The question
[Restate the ambiguity in 1 paragraph]

## 2. What F-Q 2013 §2 actually says

### 2.1 Definition of a design
[Quote the precise definition; identify the role of the daimon]

### 2.2 Definition of incarnation |D|_B
[Quote the precise definition]

### 2.3 The order relation between |D|_B and D
[Quote the precise statement and the order symbol used]

### 2.4 Walked through the B^⊥ = {n_†} example
[Apply F-Q's definitions to the tiny example; show which reading they yield]

## 3. Cross-check

### 3.1 Girard 2001 §4
[Does Girard use the same relation as F-Q? Quote if needed.]

### 3.2 Basaldella–Faggian 2011
[Same.]

### 3.3 Doumane 2017
[Same.]

## 4. Verdict

[Outcome A, B, or C, with one paragraph stating the relation precisely.]

## 5. Implications for Phase 2e

[Do Phase 2e's antichain and cross-cone proofs survive? If yes,
state how the proofs use the relation in F-Q's terms. If no, state
what needs to be re-proved.]

## 6. Implications for Phase 2f OQ-JSL-Cone

[Which of the three salvage paths is needed (if any), or whether
the original prompt's expected outcome stands.]

## 7. Open follow-ups

[Anything the next session needs — e.g. "OQ-JSL-Cone session should
proceed under salvage path 1; expect cones to decompose into
coherent sub-cones indexed by ...".]
```

---

## §6. What this session does NOT produce

- No proof of OQ-JSL-Type or OQ-JSL-Cone.
- No code changes.
- No new conceptual constructs.
- No re-proof of Phase 2e theorems (only an assessment of whether they
  survive the definitional clarification).
- No commitment to a salvage path — only a determination of whether a
  salvage path is *needed*.

The next session (`PHASE_2F_OQ_JSL_TYPE_AND_CONE_PROMPT.md`, possibly
revised based on this session's output) handles the actual JSL question
under the clarified relation.
