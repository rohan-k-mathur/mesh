# Schemes Implementation — Spec 3: Protocol Soundness (C008 surface)

- **status:** draft
- **owner:** schemes track
- **depends-on:** [`SCHEMES_IMPL_OVERVIEW.md`](SCHEMES_IMPL_OVERVIEW.md), [Spec 2 — Admin Tightening](SCHEMES_IMPL_ADMIN_TIGHTENING.md) (phase 2a+ for the C007 well-formedness guarantees), [T003](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md)
- **last-reviewed:** 2026-05-27

## §1 Problem statement

Under the layered ontology (premise P1), the substrate's room
protocol is the **C008 layer** made concrete: a scheme's
`burdenOfProof`, `requiresEvidence`, and `premiseType` fields are
*protocol clauses*, not metadata. The substrate currently treats them
as metadata — they are stored, surfaced in the admin UI, and exposed
to consumers, but they are not **enforced** at play time. This has
three consequences:

1. **The soundness inclusion $\mathcal{P}(\pi_S) \subseteq \llbracket S \rrbracket$ is not checked.**
   When a scheme-instance closes in a room, the substrate does not
   verify that the produced design lies in the scheme's behaviour
   $\llbracket S \rrbracket$. A play that completed without
   discharging a required CQ-locus produces a design that *fails*
   the CQ-orthogonality test — yet the instance is marked closed.
2. **CQ-locus obligations are not driven by the protocol.** Opening
   a sub-locus for each CQ is currently the room's UI responsibility,
   not the protocol's. There is no protocol-level invariant that
   says "an instance of $S$ must offer a sub-locus per CQ in $S$";
   the UI's behaviour is by convention.
3. **The latent stratum $\llbracket S \rrbracket \setminus \mathcal{P}(\pi_S)$ is invisible.**
   T003's soundness inclusion is proper in general — there are
   designs that *would* satisfy $S$ but that no finite dialogue
   under $\pi_S$ has yet forced into existence. The substrate has
   no surface for this, even though the exposure-map machinery in
   the substrate already names it ([`LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`](Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md)
   §2.1).

This spec turns the protocol clauses into enforced runtime
invariants, establishes the soundness check as an instance-close
gate, and adds a UI surface for the latent stratum.

**Premises inherited:** P1, P2 (runtime half of the soundness
discipline), P5 (no schema materialisation in this phase). This spec
also relies on [Spec 2](SCHEMES_IMPL_ADMIN_TIGHTENING.md) phase 2a+
for the guarantee that schemes are C007-well-formed before they're
played.

## §2 Goals and non-goals

**Goals.**

- Implement the **soundness invariant as an instance-close gate**:
  when a `SchemeInstance` (the play-time scheme-application record;
  see §3.1 for the disambiguation against `ArgumentSchemeInstance`)
  transitions to `closed`, verify that
  the produced design satisfies the scheme's CQ-orthogonality and
  block the transition if it does not.
- Implement **CQ-locus obligation tracking** at the protocol layer:
  for every CQ in the scheme's bundle, the protocol records whether
  a sub-locus has been offered (proponent obligation) and whether
  it has been engaged (opponent right exercised). This is the
  protocol-level data the soundness check reads.
- Implement **per-CQ enforcement of `burdenOfProof`, `requiresEvidence`,
  `premiseType`** as protocol clauses driven by the CQ's declared
  fields:
  - `burdenOfProof = PROPONENT`: opening the sub-locus places the
    burden on the proponent; closing it requires a proponent move.
  - `burdenOfProof = OPPONENT`: opening places the burden on the
    opponent; closing requires an opponent move (or proponent
    successful undermining).
  - `requiresEvidence = true`: the closing move must reference an
    evidence record (a `Claim`, `ClaimWarrant`, or external
    citation).
  - `premiseType = "ordinary" | "assumption" | "exception"`:
    governs default handling per Carneades — `assumption` is
    treated as `true` until challenged; `exception` is treated as
    `false` until established.
- Add a **latent-stratum surface** in the room UI: a side-panel or
  inline annotation showing, for an open scheme-instance, the CQ
  obligations not yet engaged ("This argument would also need to
  defeat CQ-X to fully establish $S$, but no one has raised it
  yet"). This is the substrate's first concrete UI for the
  exposure map's latent stratum.

**Non-goals.**

- Any change to scheme authoring or schema (Spec 2 owns this).
- Behaviour-equality decisions (Spec 4 owns this).
- The full exposure-map surface (walked/witnessable/latent
  stratification end-to-end); this spec only surfaces the latent
  stratum *for an open scheme-instance*, not for the room as a
  whole.
- ASPIC+ rule-firing semantics changes; the `aspicMapping` field is
  read but its evaluation logic is unchanged.
- Composition of multiple scheme-instances (Q-015's soundness-of-
  concatenation conjecture is research-open).

## §3 API contract

### §3.1 Disambiguation: `ArgumentSchemeInstance` vs `SchemeInstance` — resolved

Both tables exist in [`lib/models/schema.prisma`](../../lib/models/schema.prisma)
(`ArgumentSchemeInstance` at line 2701, `SchemeInstance` at line 4339).
A code grep across `app/`, `lib/`, `server/`, and `components/`
resolves the two as **orthogonal**, not alternatives:

| Table | Role | Anchor | CQ relation |
|---|---|---|---|
| `ArgumentSchemeInstance` | per-argument scheme-assignment metadata (`role`, `confidence`, `isPrimary`, `ruleType`, `explicitness`, `order`) | `argumentId` → `Argument` | **none direct** |
| `SchemeInstance` | per-target filled-form record holding answered slot values (`data Json`) | `(targetType ∈ {card, claim}, targetId, schemeId)` | `CriticalQuestion.instanceId` FKs here |

**Verdict:** for the purposes of this spec, the **play-time instance
is `SchemeInstance`**, because the `CriticalQuestion` table already
FKs to it via `instanceId`. Soundness is about CQ-obligation
closure, and CQs natively anchor to `SchemeInstance`.
`ArgumentSchemeInstance` is the orthogonal "this argument uses
scheme X with confidence c" assignment record and plays **no role**
in the soundness gate.

**Implication for the rest of this spec:** every occurrence of
"instance" in §3.2 onward refers to `SchemeInstance`. The
`CqObligationRecord` table (§4.1) FKs to `SchemeInstance.id`. The
instance-close hook (§3.4) fires when a `SchemeInstance` row is
closed (or by close-of-deliberation, iterated over all
`SchemeInstance` rows attached to the deliberation's claims/cards).

**Implication for the argument-side flow:** when an argument that
carries an `ArgumentSchemeInstance` is added or its scheme assignment
is edited, the substrate must ensure a corresponding `SchemeInstance`
row exists on the argument's conclusion claim (or the card the
argument is posted on) for that `schemeId`. This bridge already
exists in [`app/api/claims/[id]/ensure-schemes/route.ts`](../../app/api/claims/[id]/ensure-schemes/route.ts);
this spec relies on it and does not modify it.

**Implication for naming:** `SchemeInstance.status` does **not** exist
in the current schema. §3.4's close-hook diff therefore introduces a
new `status String` column on `SchemeInstance` (`open | closed | failed`)
in phase 3a; see §4.3.

### §3.2 Protocol-state model: `SchemeInstanceProtocolState`

The substrate needs a per-instance record of CQ-locus obligations.
This is new state but **does not** materialise the C008 layer at the
*scheme* level (per P5); it materialises C008-induced obligations at
the *instance* level, where they have to live anyway because they
record dialogue state.

**New module:** `lib/schemes/protocol/protocolState.ts`

```ts
export type CqObligationStatus =
  | "not-offered"       // proponent has not opened a sub-locus for this CQ
  | "offered-open"      // sub-locus opened, neither party has closed
  | "offered-engaged"   // opponent has played at the sub-locus; awaiting proponent
  | "discharged"        // closed by a winning proponent move per the CQ's clause
  | "failed"            // closed by a winning opponent move (CQ defeated the instance)
  | "waived";           // explicitly waived (e.g. `premiseType = assumption` un-challenged)

export type CqObligationRecord = {
  cqKey: string;
  status: CqObligationStatus;
  burdenOfProof: "PROPONENT" | "OPPONENT";
  requiresEvidence: boolean;
  premiseType: "ordinary" | "assumption" | "exception" | null;
  subLocusId: string | null;        // present iff status !== "not-offered"
  closingMoveId: string | null;     // present iff status in {discharged, failed, waived}
  evidenceRefs: string[];           // populated if requiresEvidence and closingMove cited evidence
};

export type SchemeInstanceProtocolState = {
  instanceId: string;
  schemeId: string;
  obligations: CqObligationRecord[];
};

export async function loadProtocolState(instanceId: string): Promise<SchemeInstanceProtocolState>;
export async function recordObligationTransition(
  instanceId: string,
  cqKey: string,
  transition: { to: CqObligationStatus; moveId?: string; evidenceRefs?: string[] }
): Promise<void>;
```

### §3.3 The instance-close soundness gate

**New module:** `lib/schemes/protocol/soundnessGate.ts`

```ts
export type SoundnessVerdict =
  | { ok: true }
  | { ok: false; reason: SoundnessFailure };

export type SoundnessFailure =
  | { kind: "undischarged-obligation"; cqKey: string; status: CqObligationStatus }
  | { kind: "missing-evidence"; cqKey: string }
  | { kind: "burden-mismatch"; cqKey: string; expected: "PROPONENT" | "OPPONENT"; actual: "PROPONENT" | "OPPONENT" }
  | { kind: "exception-not-established"; cqKey: string }
  | { kind: "design-outside-behaviour"; details: string }; // catch-all for non-CQ-decidable failures

export async function checkSoundnessOnClose(
  instance: SchemeInstance & { scheme: ArgumentScheme & { CriticalQuestion: CriticalQuestion[] } },
  protocolState: SchemeInstanceProtocolState
): Promise<SoundnessVerdict>;
```

**Decision rule.** `checkSoundnessOnClose` returns `ok: true` iff
*every* CQ in the scheme's bundle is in a closing status
(`discharged`, `waived`, or `failed`-with-proponent-rebuttal) and
the per-CQ protocol clauses are satisfied:

- For each CQ with `requiresEvidence = true`, the discharging move
  must cite ≥ 1 evidence record (`evidenceRefs.length ≥ 1`).
- For each CQ with `burdenOfProof = OPPONENT`, the status must not
  be `discharged` by a proponent move (mechanically: the
  `closingMove`'s author role must match the burden-bearer).
- For each CQ with `premiseType = "exception"`, the status must be
  `failed` (the exception was not established) or `discharged` with
  an opponent move that established the exception and a proponent
  move that rebutted it. (Carneades exception default = false.)
- For each CQ with `premiseType = "assumption"`, `not-offered`
  transitions to `waived` automatically (Carneades assumption
  default = true).

The instance-close API caller (see §3.4) treats `ok: false` as a
*soft block* in phase 3a (additive warning) and a *hard block* in
phase 3b.

### §3.4 Instance-close hook

The instance-close transition is the new `SchemeInstance.status`
transition to `closed` (the column is added in phase 3a per §4.3).
The deliberation-close flow iterates over all open `SchemeInstance`
rows attached to the deliberation's claims/cards and applies the
following diff at each one:

```diff
- await prisma.schemeInstance.update({
-   where: { id: instanceId },
-   data: { status: "closed" },
- });
+ const instance = await prisma.schemeInstance.findUniqueOrThrow({
+   where: { id: instanceId },
+   include: { scheme: { include: { CriticalQuestion: true } } },
+ });
+ const protocolState = await loadProtocolState(instanceId);
+ const verdict = await checkSoundnessOnClose(instance, protocolState);
+ if (!verdict.ok) {
+   if (PHASE === "3a-warn") {
+     await recordSoundnessWarning(instanceId, verdict.reason);
+     // proceed with close
+   } else {
+     throw new SoundnessViolationError(verdict.reason);
+   }
+ }
+ await prisma.schemeInstance.update({
+   where: { id: instanceId },
+   data: { status: "closed" },
+ });
```

### §3.5 Latent-stratum UI surface

**New component:** `components/room/LatentObligationsPanel.tsx`

For a given open `SchemeInstance`, the panel renders one
row per CQ in `obligations` with `status === "not-offered"`. Each
row shows:

- CQ text + `attackType` + `targetScope`
- A one-line consequence: "If raised, would target the scheme's
  {premise | inference | conclusion}; burden on
  {proponent | opponent}."
- An affordance: "Raise as opponent" (visible to non-proponent
  participants only) or "Offer pre-emptively" (visible to the
  proponent).

The panel header reads: "Latent obligations — CQs that have not yet
been raised against this scheme-instance. The scheme's claim is
provisionally accepted only as long as these remain unraised."

**Quiet styling.** The panel is collapsed by default; the latent
stratum is information, not pressure.

## §4 Data model

### §4.1 New table: `CqObligationRecord` (Postgres `cq_obligation_record`)

```prisma
model CqObligationRecord {
  id              String                  @id @default(cuid())
  instanceId      String
  cqKey           String
  status          String                  // CqObligationStatus
  subLocusId      String?
  closingMoveId   String?
  burdenOfProof   BurdenOfProof
  requiresEvidence Boolean                @default(false)
  premiseType     PremiseType?
  evidenceRefs    String[]                @default([])
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt
  instance        SchemeInstance          @relation(fields: [instanceId], references: [id], onDelete: Cascade)

  @@unique([instanceId, cqKey])
  @@index([instanceId])
  @@index([status])
}
```

### §4.2 New table: `SchemeInstanceSoundnessWarning` (phase 3a only)

```prisma
model SchemeInstanceSoundnessWarning {
  id          String   @id @default(cuid())
  instanceId  String
  reason      Json     // SoundnessFailure shape
  occurredAt  DateTime @default(now())
  instance    SchemeInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)

  @@index([instanceId])
  @@index([occurredAt])
}
```

Used to log phase 3a soft-block events. Read by the phase-3b
acceptance gate ("the per-rule warning rate is plateaued") and by a
small admin dashboard showing recurrent violators.

### §4.3 Additive `status` column on `SchemeInstance`; no changes to `ArgumentSchemeInstance` / `ArgumentScheme` / `CriticalQuestion`

Phase 3a adds one column to `SchemeInstance`:

```prisma
// in model SchemeInstance:
status String @default("open")  // "open" | "closed" | "failed"
```

This is additive (default `"open"` preserves all existing rows) and
is the column the close hook in §3.4 transitions. No changes to
`ArgumentSchemeInstance`, `ArgumentScheme`, or `CriticalQuestion`.
The protocol clauses (`burdenOfProof`, `requiresEvidence`,
`premiseType`) already exist on `CriticalQuestion` — this spec
re-positions them as runtime-enforced, not adds them.

## §5 Migration plan

Four phases, sequential.

### Phase 3a — Protocol state + warn-only soundness gate

1. Land `CqObligationRecord` table.
2. Backfill: for every open `SchemeInstance`, create
   `CqObligationRecord` rows with `status = "not-offered"` for every
   CQ in the scheme's bundle (one-shot migration script).
3. Wire `recordObligationTransition` into the existing
   sub-locus-open / engage / close code paths in [`server/`](../../server/).
4. Land `SchemeInstanceSoundnessWarning` table.
5. Wire `checkSoundnessOnClose` into the instance-close hook in
   warn-only mode (writes a warning, proceeds with close).
6. Soak: one calendar month.

**Acceptance gate to 3b:** warning rates have plateaued; spec author
has triaged the warning categories; ≥ 80% of warnings are *real*
soundness violations (i.e. low false-positive rate).

### Phase 3b — Hard-block soundness gate

1. Flip `checkSoundnessOnClose` to throw on `ok: false`.
2. Surface the failure to the closing user with a clear message
   ("Cannot close this scheme-instance: CQ `X` is undischarged.
   Either discharge it, waive it as an assumption, or accept that
   the instance fails.").
3. Document an admin "force-close" affordance (audit-logged; for
   stuck instances only).

**Acceptance gate to 3c:** post-flip, the hard-block error rate is
near zero (users are dispatching CQs correctly); the force-close
audit log shows ≤ 1% of closes.

### Phase 3c — Latent-stratum UI

1. Land `LatentObligationsPanel.tsx` in the room view.
2. Add the "Raise as opponent" / "Offer pre-emptively" affordances.
3. Document the panel's framing in user-facing docs.

**Acceptance:** panel renders for all open scheme-instances;
affordances dispatch correctly into the existing sub-locus-open
flow.

### Phase 3d — Per-CQ clause enforcement polish

Once 3a–3c are stable, enforce the per-clause rules that were
gathered into `checkSoundnessOnClose` more aggressively:

1. `requiresEvidence`: surface evidence-picker inline at sub-locus
   close time, not only at the soundness gate.
2. `burdenOfProof = OPPONENT`: disable proponent-close UI on
   sub-loci where burden is on opponent.
3. `premiseType = "assumption"`: auto-waive on instance-close if
   never offered.
4. `premiseType = "exception"`: surface the exception's "must be
   established by opponent" semantics in the sub-locus header.

**Acceptance:** each rule has a UI-level enforcement plus a server-
side enforcement (defence-in-depth); each has ≥ 1 integration test.

## §6 Acceptance criteria

### Phase 3a accepts iff

- [ ] `CqObligationRecord` table migrated; backfill complete.
- [ ] `recordObligationTransition` wired into sub-locus event
      handlers; `loadProtocolState` returns expected state for a
      hand-traced instance.
- [ ] `checkSoundnessOnClose` returns the documented verdicts for
      a unit-tested set of fixtures (one per `SoundnessFailure`
      kind).
- [ ] Warn-only mode: closing an instance with undischarged CQs
      writes a `SchemeInstanceSoundnessWarning` row and the close
      proceeds.

### Phase 3b accepts iff

- [ ] Closing an instance with undischarged CQs raises
      `SoundnessViolationError` and the close does not occur.
- [ ] User-facing error message identifies the offending CQ(s).
- [ ] Force-close affordance exists, requires admin role, writes
      audit log.
- [ ] Post-flip soak: zero un-audited force-closes per week for
      one month.

### Phase 3c accepts iff

- [ ] `LatentObligationsPanel.tsx` lands and renders for every
      open `SchemeInstance` in a room.
- [ ] Both affordances dispatch into the existing sub-locus-open
      handler.
- [ ] Documentation update: the panel is described in the user-
      facing rooms guide.

### Phase 3d accepts iff

- [ ] Each of the four clauses has a UI-level enforcement plus a
      server-side enforcement.
- [ ] Each has ≥ 1 integration test covering the success path and
      ≥ 1 covering the violation path.

## §7 Open risks

- **R1 — Backfill ambiguity for existing open instances.** Some
  in-flight instances may have already discharged CQs by ad-hoc
  conventions that don't map cleanly onto `CqObligationStatus`.
  *Mitigation:* the backfill is conservative — it creates
  `not-offered` rows everywhere; a follow-on hand-classification
  pass updates rows where the existing dialogue clearly evidences
  a different state.
- **R2 — Hard-block produces stuck instances.** Phase 3b may catch
  instances where the proponent disagrees that an opponent's CQ is
  legitimately undischarged. *Mitigation:* the force-close
  affordance + audit log; recurrent stuck instances are an input
  to revising the CQ definition in the scheme.
- **R3 — Latent-stratum panel as opposition checklist.** The panel
  could be read as "here are weapons opponents should use", flipping
  the room into adversarial mode. *Mitigation:* the framing copy is
  collaborative ("the scheme's claim is provisionally accepted");
  the panel is collapsed by default; per-CQ affordances are
  symmetric (proponent can pre-empt).
- **R4 — Carneades premise-type defaults clash with existing
  conventions.** If the substrate's existing UX treats all CQs as
  Carneades `ordinary` by default, the phase 3d auto-waive for
  `assumption` will change observable behaviour. *Mitigation:* the
  Q-018 OntoClean audit incidentally surfaces which schemes have
  any `assumption` / `exception` CQs; if the count is small, hand-
  migrate; if large, file a follow-on spec for graduated rollout.
- **R5 — Latency on `loadProtocolState`.** Each instance load
  fetches its CQ obligations. *Mitigation:* the schema indexes
  `instanceId`; the load is O(CQ-bundle-size), typically < 10
  rows; cache at the request level where multiple components need
  the state.
- **R6 — Coupling to Q-015 (composition).** When two
  scheme-instances are chained, the soundness gate for the
  downstream instance currently doesn't know about the upstream
  instance's discharge state. *Mitigation:* documented; phase 3a–3d
  scope is per-instance soundness only; Q-015's soundness-of-
  concatenation conjecture is the right place for cross-instance
  soundness.

## §8 Dependencies

**Upstream (research):**

- [T003](../../RESEARCH_PROGRAMME/02_THEOREMS_AND_PROOFS/T003-schemes-layered-coherence.md) (the soundness inclusion $\mathcal{P}(\pi_S) \subseteq \llbracket S \rrbracket$ this spec operationalises)
- [`SCHEMES_ONTOLOGY_DECISION.md`](SCHEMES_ONTOLOGY_DECISION.md) §3.4 (the soundness-as-proper-inclusion-with-latent-stratum framing)
- [`Ludics Generative Substrate Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md`](Ludics%20Generative%20Substrate%20Documents/LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md) §2.1 (exposure map and the latent stratum)

**Upstream (specs):**

- [Spec 2](SCHEMES_IMPL_ADMIN_TIGHTENING.md) phase 2a+ — guarantees
  C007 well-formedness, without which the runtime soundness check
  has nothing reliable to enforce against.
- [Spec 5](SCHEMES_IMPL_AUDIT_PROTOCOLS.md) — Q-018 informs phase 3d
  rollout of `premiseType` defaults.

**Upstream (code):**

- [`lib/models/schema.prisma`](../../lib/models/schema.prisma)
  (`SchemeInstance` — the play-time anchor; `CriticalQuestion` —
  the CQ definitions that FK to `SchemeInstance.instanceId`)
- [`server/`](../../server/) — sub-locus event handlers (exact
  paths to be discovered during phase 3a implementation)
- Room view components in [`components/`](../../components/) for the
  phase 3c UI

**Downstream:**

- [Spec 4 — Verifier](SCHEMES_IMPL_VERIFIER.md): treats the protocol
  layer as a black box but consumes the *fact* that the protocol is
  sound-by-enforcement when reasoning about behaviour-equality.

**Out of scope but worth knowing:**

- Q-015 (soundness-of-concatenation conjecture for composed
  schemes) — the cross-instance counterpart of this spec; research-
  open and downstream.
- A general exposure-map UI for the whole room (this spec only
  surfaces the latent stratum *per open scheme-instance*).
