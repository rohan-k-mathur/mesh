# Session 01 — Confidence algebra: semiring vs. quantale

**Date:** 2026-06-02
**Direction:** 3 — Quantitative core (`09_FUTURE_DIRECTIONS_BRAINSTORM.md` §3)
**Status:** **Resolved** (documentation-level); implementation migration pending
**Artifacts touched:**
[`09_FUTURE_DIRECTIONS_BRAINSTORM.md`](../09_FUTURE_DIRECTIONS_BRAINSTORM.md) §3
decisions block;
[`CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md)
§2.2 correction note.

---

## The fork

Direction 3 of the brainstorm proposed two competing algebras for confidence
without choosing: a **semiring** (non-idempotent additive part → corroboration
*stacks*) versus a **quantale** (idempotent join → corroboration does *not*
stack, but enables the Lawvere-enrichment prize). The decisions block flagged
this for a dedicated session because the rest of the quantitative core branches
on the answer.

The reframing that made it tractable: the choice is a proxy for a substantive
question — **is confidence dialectical (does a defence exist?) or evidential
(how much independent support has accumulated?)** — pinned by one diagnostic:

> Claim C is supported by two *independent* routes, each at confidence 0.6.
> What is C's confidence?
> - "still 0.6 (best route wins)" → idempotent → **quantale**
> - ">0.6 (support accumulates)" → non-idempotent → **semiring**

## The decisive finding (from the actual code)

The implemented reducers in
[`app/api/deliberations/[id]/evidential/route.ts`](../../app/api/deliberations/[id]/evidential/route.ts)
do **not** commit to one algebra — they implement *two*, tagged by `mode`:

| mode | compose (⊗, along a chain) | join (⊕, across alternatives) | algebra | stacks? |
|---|---|---|---|---|
| `min` | `min` | `max` | tropical / Gödel **quantale** | No (idempotent) |
| `product` | `×` | noisy-OR `1 − ∏(1−x)` | — | Yes (bounded) |
| `ds` | `×` | noisy-OR + conflict band | product + Dempster bolt-on | Yes (bounded) |

The crux: **product/noisy-OR is not a semiring.** Product does not distribute
over noisy-OR, so it silently violates law 5 (distributivity) that the
architecture doc claims (§2.2). Counterexample with `h = 0.5, f = 0.6, g = 0.7`:

$$h\circ(f\vee g) = 0.5\cdot\big(1-(0.4)(0.3)\big) = 0.44 \qquad (h\circ f)\vee(h\circ g) = 1-(0.7)(0.65) = 0.545$$

$0.44 \neq 0.545$. In `min` mode the same test gives $0.5 = 0.5$ — the tropical
quantale is genuinely distributive. So `min` is the only algebraically lawful,
enrichment-ready instance, but it is idempotent and does not stack; `product`
stacks but is not a semiring at all.

## Resolution

Adopt a **log-odds / weight-of-evidence semiring**, *not* the existing noisy-OR
(which was the unprincipled middle that broke distributivity):

$$w(c) = \log\frac{c}{1-c} \in \mathbb{R}, \qquad c=0.5 \mapsto w=0$$

- **Corroboration ⊕ = addition in $\mathbb{R}$** — unbounded, associative,
  commutative, monotone, identity $0$ (= "no evidence"). Lawful stacking.
- **Pro/con = signed addition** — a counter-argument is negative evidence;
  conflict is $w_+ + w_-$. This **replaces Dempster-Shafer outright**,
  dissolves the Zadeh high-conflict pathology, and removes Dempster
  normalization / non-associativity and the separate `NegationMap` conflict band.

### Consequences recorded

1. **`min` reclassified** as the distributive-quantale instance and the *only*
   enrichment-ready branch — kept as a separate skeptical projection, not the
   default confidence semantics.
2. **`product`/noisy-OR deprecated** as algebraically unsound (distributivity
   fails; not a semiring). Corrects a false claim in the architecture doc §2.2.
3. **Lawvere-enrichment prize parked, not pursued** — it needs an idempotent
   complete-lattice join (the quantale, i.e. `min`); log-odds is non-idempotent.
   Consistent with its "open conjecture — not to be assumed" status. Choosing
   stacking corroboration means declining the structure the enrichment
   conjecture would enrich over.

## Open items / hand-off

- **Implementation migration is real, not local** — see repo memory note
  `confidence-algebra-logodds-migration-2026-06-02`. Ripples through the inline
  reducers, [`lib/argumentation/eccAdapter.ts`](../../lib/argumentation/eccAdapter.ts)
  typed pipeline (must keep byte-parity), the `ArgumentSupport.strength`/`base`
  `[0,1]` fields (log-odds is $\mathbb{R}$ — schema decision needed), and the
  `NegationMap`-based DS band. Not yet scheduled.
- **To promote:** once the migration is scoped into a track, move the
  implementation plan to [`IMPLEMENTATION_TRACKS.md`](../IMPLEMENTATION_TRACKS.md)
  and the parked enrichment conjecture to [`03_CONJECTURES/`](../03_CONJECTURES).

## Update 2026-06-03 — promoted to an implementation track; schema decision resolved

- **Promoted.** The migration is now a formal track:
  [`IMPLEMENTATION_TRACKS.md` → Confidence algebra — log-odds semiring migration](../IMPLEMENTATION_TRACKS.md#confidence-algebra--log-odds-semiring-migration-track),
  with a five-phase ordered plan (safest first: pure kernel + tests → additive
  new mode → flagged default flip → DS retirement → dead-code deletion).
- **Schema decision (the one genuinely-open question): RESOLVED — keep `[0,1]`
  storage, compose in log-odds at the reducer boundary** (Option B, *not* migrating
  the columns to $\mathbb{R}$). `ArgumentSupport.strength`/`base` stay `[0,1]`;
  convert $p \to w = \log\frac{p}{1-p}$ on read, add in $\mathbb{R}$, squash
  $w \to \sigma(w)$ on write/display, clamping $p \in [\varepsilon, 1-\varepsilon]$.
  Rationale: no destructive data migration (existing rows stay valid; cutover is
  code-only and reversible); `[0,1]` is the human/UI/provenance scale; composition
  is a recomputable cache so unbounded magnitude need not be persisted. A nullable
  `weight Float?` log-odds column is **deferred** (additive, non-breaking) until a
  concrete audit need appears. See the track's "Schema decision" block for the full
  argument.
- **Enrichment prize** remains parked, now recorded as a track-internal open item
  attaching to the surviving `min` quantale mode, to be promoted to
  [`03_CONJECTURES/`](../03_CONJECTURES) only if taken up.
