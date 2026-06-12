# M0 — Design-carrier decision for the constitutive Ludics core (2026-06-09)

**Direction:** 5 — Mechanization. **Session:** [`09-mechanization-ludics-core-sequencing-2026-06-08.md`](../10_IDEATION_SESSIONS/09-mechanization-ludics-core-sequencing-2026-06-08.md) §2 step **M0**.
**Kind:** audit + decision (mirrors Session 07's [A0](a0-onehop-contract-laxity-vs-policy-2026-06-07.md)). **No Agda proof, no theorem, no production change.**
**Question (Fork A of the session):** *what is a design, formally?* — fix the `--safe`-encodable design representation that mirrors the engine, before any M1 code.

---

## 0. Verdict

**Adopt the substrate-mirroring, finite/fuel-indexed carrier.** The engine has *already done the carrier factoring for us*: [`stepCore.ts`](../../packages/ludics-engine/stepCore.ts) is a **pure, total, fuel-bounded, structural** traversal over a **list of acts**, with orthogonality read off as "normalizes to a daimon." There is nothing to invent at M0 — the decision is to *take `stepCore`'s own `CoreAct`/list representation as the Agda carrier* rather than the textbook chronicle/strategy presentation or Terui's computational-ludics terms. This is the Fork-A "(c) substrate-mirroring" option, and the audit below shows it is not merely convenient but **faithful**: every structural choice the Agda model would make is already the engine's choice.

The single most important finding: **the engine's interaction loop is already step-indexed** (`for (let steps = 0; steps < fuel; steps++)`, `fuel` capped at 10 000). The thing the session called "the twenty-year-hard rung" — encoding a partial, possibly-non-terminating normalizer `--safe` — is, *for the fragment the platform actually runs*, **not partial at all**: it is a `fuel : ℕ`-indexed total function. So M1's `interact : ℕ → Design → Design → Status` is a direct transcription, not an approximation, and the partiality only re-enters at M1′ (the infinitary extension), exactly where the session staged it.

---

## 1. What the engine's carrier actually is

`stepCore` reads a **structural subset** of the database `LudicAct`, which it names `CoreAct` ([`stepCore.ts`](../../packages/ludics-engine/stepCore.ts)):

```ts
export type CoreAct = {
  id?: string | null;
  kind: 'PROPER' | 'DAIMON' | string;
  polarity: 'P' | 'O' | 'daimon' | string;
  locusId?: string | null;
  isAdditive?: boolean | null;
};
```

This is **the carrier decision, already made by the implementation**: the traversal reads exactly `kind`, `polarity`, `locusId`, `isAdditive`. The wider `DialogueAct` / `LudicDesign` types ([`packages/ludics-core/types.ts`](../../packages/ludics-core/types.ts)) carry text (`expression`), `ramification`, `openings`, DB ids — *none of which the interaction loop consults*. The Agda carrier should therefore mirror `CoreAct`, not `DialogueAct`. A **design is a `List Act`**; the engine confirms it (`posActs: CoreAct[]`, `negActs: CoreAct[]`).

| Engine field (`CoreAct`) | Agda carrier (M1 `Act`) | Note |
|---|---|---|
| `kind: 'PROPER' \| 'DAIMON'` | `Kind = PROPER \| DAIMON` | daimon is the convergence witness |
| `polarity: 'P' \| 'O' \| 'daimon'` | `Polarity = P \| O \| daimon` | small enum |
| `locusId` + `pathById`/`idByPath` maps | `locus : Maybe Locus`, `Locus = List ℕ` | **the id↔path indirection collapses** — see §2 |
| `isAdditive` | `additive : Bool` | additive gate; **staged out of M1**, see §4 |
| `id` | *dropped* | used only for the engine's "don't reuse an O-act" bookkeeping; see §3 |

## 2. The locus indirection collapses — reuse the T009 model

The engine threads loci through two maps, `pathById : Map<id,path>` and `idByPath : Map<path,id>`, and matches a positive against "a dual O-act at the same `locusId`." But the *only* thing the loop ever does with a `locusId` is (i) compare two for equality and (ii) resolve to a dot-path string to test the prefix order (`startsWith(focusAt + '.')`, additive-parent split). In Agda **a locus simply is its path**, so the indirection vanishes: take `Locus = List ℕ`, the exact model [`separation.ts`](../../packages/ludics-engine/separation.ts) (`isPrefixLocus`, segment-wise prefix) and the landed [`T009/T009.agda`](../mechanisation/agda/T009/T009.agda) already use. Match-by-equal-`locusId` becomes match-by-equal-`Locus`, i.e. `≡` on `List ℕ` — which is exactly the `findNextNegativeAtLocus` rule T009 mechanized as "match-by-equal-address."

**Consequence:** the constitutive core does *not* introduce a new locus model; it inherits T009's. This is the first concrete payoff of the M3-fusion bet — the separation theorem's locus object and the engine's locus object are the same `List ℕ`.

## 3. Why the `id` field is dropped (and what replaces it)

`stepCore` carries act `id`s only to implement two operational guards: `usedNegActIds` (never reuse a matched O-act) and the synthesized `virt:`/`virtual` O-acts (consensus testers). Neither is part of the *Ludics interaction relation* — they are substrate bookkeeping over a mutable trace. In a pure Agda model the "don't reuse" guard is structural (the cursor/multiset of remaining acts), not an id-set, so `id` is not a carrier field. **Decision:** the M1 carrier omits `id`; the no-reuse discipline is recovered from the traversal's structural recursion on the remaining-acts list.

## 4. Scope cuts for M1 (recorded so M1 doesn't silently widen)

`stepCore` bundles three features that are **substrate extensions, not the multiplicative Ludics core**. M1 excludes them; each is a named staged item:

1. **Additive fragment** (`isAdditive`, `usedAdditive`, `isAdditiveParent`, `additive-violation`). Real Ludics content, but the session's M1 is explicitly the *multiplicative finite fragment first*. **Stage:** fold in after M2, before M3 (separation needs it for branching parity, per [T009](../02_THEOREMS_AND_PROOFS/T009-branching-smyth-minimal-separating-context.md) / Q-039 additive-freeness).
2. **Consensus testers** (`virtualNegPaths`, `drawAtPaths`, `consensus-draw`). These synthesize virtual O-acts and reclassify unanswered positives — a platform deliberation feature, **not** the abstract interaction. **Stage:** out of the constitutive core entirely; they belong to the bridge layer, not `ludics/`.
3. **Focus/phase gate** (`phase`, `focusAt`, `allowInPhase`, `ONGOING`). The focused-phase machinery is a scheduler refinement. M1 keeps a single `ONGOING` status (fuel-exhausted / not-yet-decided) but does **not** model phase gating. **Stage:** optional, after M4.

The multiplicative M1 core is therefore exactly: `findNextPositive` (next P-act or daimon), `findNextNegativeAtLocus` (dual O at equal locus), the alternating A/B cursor, and the four-way status. That is a small, total, fuel-recursive function.

## 5. The status object

`stepCore` returns `status ∈ {CONVERGENT, DIVERGENT, STUCK, ONGOING}` with a finer `reason`. The Agda `Status` mirrors the four-way status; `reason` is metadata M1 may carry as a refinement but the orthogonality predicate does not consult it. **Orthogonality** is read off exactly as [`checkOrthogonal.ts`](../../packages/ludics-engine/checkOrthogonal.ts) does it:

```ts
const orthogonal = res.status === 'CONVERGENT';
```

So in Agda:

> `D ⊥ E  :=  ∃ (fuel : ℕ), interact fuel D E ≡ CONVERGENT.`

The existential over fuel is the faithful reading of the engine's "run to quiescence within the budget" — convergence is reaching a daimon in *some* number of steps. This is the predicate M4 feeds into `lib/Closure.agda`'s already-built `Biorthogonal` to get `B = B^⊥⊥` for designs.

## 6. Faithfulness ledger (engine ⇒ Agda model)

| Engine fact | Agda model choice | Faithful? |
|---|---|---|
| design = `CoreAct[]` | `Design = List Act` | ✅ verbatim |
| loop is `for steps < fuel`, fuel ≤ 10 000 | `interact : ℕ → Design → Design → Status` | ✅ already step-indexed |
| match P against O at *equal* `locusId` | match at *equal* `Locus = List ℕ` (`≡`) | ✅ = T009 match-by-equal-address |
| `orthogonal ⟺ CONVERGENT` | `D ⊥ E := ∃ n, interact n D E ≡ CONVERGENT` | ✅ verbatim |
| daimon ⇒ CONVERGENT | `DAIMON` act is the convergence witness | ✅ |
| unmatched positive ⇒ DIVERGENT | same | ✅ |
| no positive ⇒ STUCK | same | ✅ |
| additive / testers / phase | **staged out of M1** (§4) | ⚠ deliberate scope cut, logged |
| act `id`, `ramification`, `expression` | dropped (not read by the relation) | ✅ not carrier data |

No row is a forced approximation within the multiplicative finite fragment; the only ⚠ is the deliberate, logged scope reduction. This is the §"foundational program" synergy made concrete: the object M1 builds is *the same object* `stepCore` computes on, so T006–T009 (which are paper theorems about `stepCore`) become theorems about the Agda `interact`.

---

## 7. Decision (recorded)

- **Fork A resolved → carrier = substrate-mirroring, finite/fuel-indexed.** `Design = List Act`, `Act` ≅ `CoreAct` (minus `id`), `Locus = List ℕ` (reuse T009/`separation.ts`), `interact : ℕ → Design → Design → Status`, `D ⊥ E := ∃ n, interact n D E ≡ CONVERGENT`.
- **Key enabling finding:** the engine loop is *already step-indexed and total*; M1's normalizer is a transcription, not a partiality-taming exercise. Partiality is deferred to **M1′** (infinitary), unchanged from the session's staging.
- **Locus model is inherited, not invented** — same `List ℕ` prefix object as the separation work; reinforces the M3 fusion.
- **Three logged scope cuts for M1** (§4): additive (stage between M2 and M3), consensus testers (out of `ludics/` entirely — bridge layer), focus/phase (optional, after M4).
- **Deliverable artifact:** the type-only signature stub [`mechanisation/agda/ludics/Core.agda`](../mechanisation/agda/ludics/Core.agda) — all carrier **data fully defined** (`Locus`, `Polarity`, `Kind`, `Act`, `Design`, `Status`) and the orthogonality predicate **defined**, with the one operation M1 must build (`interact`) left as the single `postulate`. The stub is the *only* non-`--safe` file in the corpus, banner-marked, kept resolvable but evidence-of-signature only; M1 discharges the postulate and restores `--safe`.
- **Next step (M1):** define `interact` by structural/fuel recursion implementing the multiplicative loop of §4, discharging the postulate; promote the stub to `--safe`; open the "mechanized finite Ludics" conjecture/OQ.
