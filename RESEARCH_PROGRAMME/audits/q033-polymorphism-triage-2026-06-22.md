# Q-033 — schematic / propositional-variable polymorphism: catalogue triage (Gate 3)

- **date:** 2026-06-22
- **session:** Gate 3 of the [session-19 scope](../10_IDEATION_SESSIONS/19-q028b-settlement-q033-polymorphism-scoping-2026-06-22.md) (Part B). Runs **P-1** (triage the realized scheme catalogue + argument-chain feature) and **P-2** (the decision).
- **question:** does the product's *realized* reasoning ever require a generator (an argument object in the graph) that is genuinely **polymorphic over propositions** (a single object quantifying over arbitrary propositions, like a Church-encoded composition combinator `(B→C)⇒(A→B)⇒(A→C)`), or are all realized generators **ground** (slots filled with concrete propositions/claim-ids)?
- **verdict:** **PATH A — scope-restrict. Q-033 closes by scope-restriction; the runtime contract's `G3b` guard is *provably vacuous* on the realized catalogue.** All realized argument generators are **ground** (premises bound to concrete `claimId`s before insertion; chains compose concrete schemes), so the [Gate-2 ground-`{→,×,atom}` settlement](q028b-settlement-session2-2026-06-22.md) — now signed off — covers the **entire realized fragment**, including DAG-shaped / reconvergent / reused-premise (contraction) chains. **No net-new ∀-layer arc (Path B) is triggered.** The ground-instantiation invariant is **architecturally enforced**, so the restriction is a structural fact, not a usage convention.

> Reading order: [session-19 Part B](../10_IDEATION_SESSIONS/19-q028b-settlement-q033-polymorphism-scoping-2026-06-22.md#part-b--gate-3-q-033-schematic--propositional-variable-polymorphism); [Q-033 registry entry](../01_OPEN_QUESTIONS_REGISTRY.md#q-033) (SUFFICIENT-with-conditions lit-review verdict this actions); [runtime contract §1 G3b](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_AMBLER_BRIDGE_RUNTIME_CONTRACT.md).

---

## 0. The triage in one sentence

The scheme *catalogue* carries template variables, but every *argument* (the actual bridge generator) is stored with its slots filled by concrete claim-ids — so the polymorphism lives in templates that never enter the bridge, and the realized generator set is ground, which the Gate-2 settlement already covers.

---

## 1. P-1 — the catalogue triage (empirical, read-only)

The key architectural distinction: a scheme **template** with premise/conclusion *slots* is **not** propositional-variable polymorphism. The question is what gets **stored as a graph object** (a generator the bridge sees). Five findings, all evidenced in the repo:

### 1.1 Schemes are templates with variable slots (catalogue level, not graph objects)

[`ArgumentScheme`](../../lib/models/schema.prisma) (schema.prisma ~L4129) carries `premises`/`conclusion` as JSON templates with variables (e.g. `E, S, A` for expert-opinion). These are **catalogue metadata** — the menu of inference patterns — not arguments in any deliberation graph. The bridge generators are *arguments*, not *schemes*.

### 1.2 Arguments are GROUND instances (the load-bearing fact)

[`ArgumentPremise`](../../lib/models/schema.prisma) (schema.prisma L2868) binds **every premise to a concrete claim**:

```prisma
model ArgumentPremise {
  argumentId String
  claimId    String                  // ← FK to a concrete Claim row
  claim      Claim @relation(fields: [claimId], references: [id], ...)
  @@id([argumentId, claimId])        // composite PK over concrete ids
}
```

There is **no representation for an unbound / universally-quantified premise variable** in the stored argument. The structured write path (`app/api/arguments/route.ts`; MCP `propose_structured_argument`) validates and binds concrete `claimId`s **before** insertion. **⟹ every realized generator is ground.**

### 1.3 Chains compose CONCRETE schemes (ground composition = the Gate-2 case)

[`SchemeNetStep`](../../lib/models/schema.prisma) (schema.prisma L2776) — the argument-chain / scheme-composition feature ([Q-015](../01_OPEN_QUESTIONS_REGISTRY.md#q-015)) — references a **concrete `schemeId`** per step, with `inputFromStep` + `inputSlotMapping` (e.g. `{"A":"P1.E"}`) as **variable-mapping bookkeeping** for instantiation, and `confidence` per step (weakest-link). Composition is over concrete schemes feeding concrete claims forward — **exactly the DAG-shaped / reconvergent / reused-premise (contraction) ground higher-order chain the Gate-2 `!`-layer settlement covers.** It is **not** a stored generic "composition combinator" abstracting over propositions.

### 1.4 No meta-scheme / higher-order / polymorphic construct

The scheme/rule models are `ArgumentScheme`, `ArgumentSchemeInstance` (junction: concrete instantiation), `SchemeNetStep`, `SchemeVariant` (taxonomy), `ConflictScheme`/`PreferenceScheme`/`DefaultRule` (conflict metadata). The `parentScheme`/`childSchemes` relation is **Aristotle's generic→specific taxonomy for CQ inheritance**, not polymorphic composition. **No `MetaScheme`, `PolymorphicScheme`, `SchemeOfSchemes`, or `GenericCompositor`** model exists. ASPIC+ attack computation (`lib/aspic/attacks.ts`) runs entirely over **ground** premises/conclusions.

### 1.5 `∀`/`∃` appear only as UI templates / structural metadata — never stored polymorphic objects

The only `∀`/`∃` in the system are (a) a **client-side command-card template** (`∀-inst`: "Consider the specific case of [INSTANCE]…" — prompt scaffolding, *no DB*) and (b) **connective metadata** on argument-diagram inferences (`connective: '∧'|'∨'|'→'|'∀'|'∃'`) describing an argument's internal *shape*. Neither stores a propositionally-polymorphic argument object.

---

## 2. P-2 — the decision: PATH A (scope-restrict)

Per the [Q-033 next-action](../01_OPEN_QUESTIONS_REGISTRY.md#q-033) and [session-19 Part B](../10_IDEATION_SESSIONS/19-q028b-settlement-q033-polymorphism-scoping-2026-06-22.md), the two paths were:

- **Path A (scope-restrict):** no realized scheme needs genuine polymorphism ⟹ `G3b` provably vacuous; Gate-2 covers the entire realized fragment. *Cheap; no new theory.*
- **Path B (carry out polymorphism):** some realized scheme needs propositional variables ⟹ file a net-new ∀-layer canonicity arc (a T012-analogue at the second-order / polymorphic-behaviour layer). *Heavy; separate programme.*

**P-1 selects Path A decisively.** (A) realized argument generators are ground (§1.2); (B) no realized feature stores a polymorphic argument (§1.3–1.5). The textbook polymorphic case — a Church-encoded composition combinator quantifying over `A,B,C` — is **not instantiated**: chains compose concrete schemes over concrete claims (§1.3). So the in-scope reasoning is exactly the ground `{→,×,atom}` higher-order fragment the **Gate-2 settlement** (signed off 2026-06-22) closes — **the realized catalogue is fully settlement-covered.**

**Q-033 closes by scope-restriction.** The `G3b` guard stays in the runtime contract as a **defensive check** (it would fire if a polymorphic generator ever appeared), but it is **vacuous on current inputs**.

---

## 3. Honest residual — the guard condition, architecturally enforced

The restriction is not a usage convention that a user could accidentally violate: the **ground-instantiation invariant is enforced by the data model** — `ArgumentPremise` has no slot for an unbound propositional variable, and the write paths bind concrete `claimId`s before insertion (§1.2). So "all bridge generators are ground" is a **structural property of the schema**, not a discipline.

The one way Path B could ever trigger: a **future** feature that stores a *universally-quantified-over-propositions* argument as a single graph object (e.g. a generic transitivity meta-argument `∀P,Q,R. (P→Q),(Q→R) ⊢ (P→R)` persisted as one object, rather than instantiated per concrete `P,Q,R`). That would require a new model (a `MetaScheme`/`PolymorphicScheme`) and would make `𝒞/Γ` infinite via second-order abstraction — at which point Q-033 re-opens on **Path B** (the ∀-layer canonicity arc, a separate research programme; no candidate ludics framework provides propositional variables — BT2010 lists them as future work). Until such a model exists, `G3b` is vacuous and the bridge is fully settled on the realized product.

---

## 4. What this closes

- **Q-033** → resolved by **scope-restriction** (Path A). The lit-review verdict "SUFFICIENT-with-conditions" is now **triage-confirmed**: the realized catalogue is ground, so the "ground-atom scope restriction" the lit review recommended is **already the de-facto architecture**, enforced by the data model.
- **Runtime contract `G3b`** → confirmed **vacuous on the realized catalogue** (kept as a defensive guard). The contract's "full bridge runtime contract" promotion condition ("G3b carried out or scoped out") is met by **scoped out**.
- **The whole `!`-layer arc** (T012 → stratum-2 → Gate-2 settlement → Gate-3 triage) now covers the **entire realized product reasoning surface** at settlement strength: ground first-order **and** ground higher-order (function-typed rules, reused-premise / reconvergent chains), with schematic polymorphism scoped out as architecturally absent.
- **Not closed:** **b₃′** ([Q-029](../01_OPEN_QUESTIONS_REGISTRY.md#q-029), naturality) remains the open C001b′ content; and Path B stays a *latent* arc that re-opens only if a polymorphic-generator model is ever introduced.

---

*Gate 3 complete — Path A (scope-restrict). The realized catalogue is ground (architecturally enforced via `ArgumentPremise.claimId`); chains are ground compositions of concrete schemes; no polymorphic combinator is stored. `G3b` is vacuous on current inputs, so the Gate-2 ground-fragment settlement covers the full realized product. The maximal "higher-order + schematic" claim (Path B / ∀-layer) is deferred as a latent arc, triggered only by a future polymorphic-generator model.*
