Here’s a concise, ship-ready **Decision Playbook** you can drop into the repo. It gives you: clear roles, a standard flow from “debate” → “decision”, hard defaults, a receipt schema, UI hooks, events, and QA checklists.

---

# Decision Playbook

## 0) Purpose

Make outcomes **legible, fair, and reversible** by combining:

* **Computation** (Ludics trace, CQ guards, AF labels, entailment)
* **Panel curation** (structure & safety)
* **Democratic choice** (approval/RCV when preferences matter)

Everything produces **receipts**; new evidence **re-opens**.

---

## 1) Decision Types

| Kind                  | Examples                                    | Primary Decider               | Receipt stored? |
| --------------------- | ------------------------------------------- | ----------------------------- | --------------- |
| **Epistemic**         | CQ “Satisfied?”, claim IN/OUT, entailment ✓ | Computation → Panel confirm   | Yes             |
| **Procedural**        | Choose branch at ⊕, close (†), delocate     | Computation → Panel           | Yes             |
| **Allocative/Policy** | pick option (\$5/\$10), roadmap item        | Community vote (Approval/RCV) | Yes             |
| **Editorial**         | Pin view, publish summary                   | Panel                         | Yes             |

**Rule of thumb:** truth-tracking ⇒ compute first; preference-tracking ⇒ vote.

---

## 2) Roles

* **Computation**

  * Ludics step → `trace`, `usedAdditive`, `decisiveIndices`, `endorsement`
  * AF labels → claims `IN/OUT/UNDEC`
  * CQ guards → “Satisfied” requires **REBUT/UNDERCUT** (or NLI contradiction for rebut)
  * Entailment → classical (+ optional NLI assist)
  * RV selections → utilitarian/harmonic/JR w/ coverage stats

* **Panel / Moderators**

  * Structural fixes (duplicates, delocation), safety, publish rationales
  * Confirm computation outcomes; may override but must explain in receipt

* **Democracy**

  * When multiple coherent options remain or policy required → **vote**
  * Approval by default; RCV for ≥4 options/contested choices

---

## 3) Default Settings (tunable)

```ts
// decision.config.ts
export const DecisionConfig = {
  voting: {
    method: (nOptions: number) => (nOptions <= 3 ? 'approval' : 'rcv'),
    quorum: { // minimum participants for validity
      minCount: 20,
      minPctActive30d: 0.20, // 20% of active room members
    },
    pass: { // simple majority if approval; RCV uses standard instant-runoff
      approvalThreshold: 0.50, // >50% approvals to “win” if single winner
    },
    overridePanel: { supermajority: 0.66 }, // 2/3 to overturn editorial decisions
  },
  reopen: {
    onNewUndercut: true,
    onNewRebut: true,
    onCQUnsatisfied: true,
    graceHours: 72, // “Under Review” window auto-open
  },
  cqGuard: {
    nliEnabled: true,
    nliTau: 0.72, // min score for contradiction to count as rebut proof
  },
  ludics: {
    preflightMode: 'assoc', // 'assoc' | 'partial' | 'spiritual'
  },
} as const;
```

---

## 4) Decision Workflow (phases)

1. **Explore**
   People post WHY/GROUNDS/Commit; computation runs continuously.

2. **Synthesize**
   RV selects representative sets (rule, k). Panel delocates structural clashes, confirms CQ guards.

3. **Choose**
   If allocative/policy: open a **vote** with RV bundles + receipts (Γ/Δ, CQ, AF). Otherwise, panel issues a recommendation.

4. **Enact**
   Store a **DecisionReceipt**; show a banner; optionally † close branch.

5. **Re-open**
   New rebut/undercut/CQ flip triggers **Under Review** with a new receipt version after panel action.

---

## 5) Receipt Schema (DB + runtime)

### Prisma (minimal model)

```prisma
model DecisionReceipt {
  id             String   @id @default(cuid())
  deliberationId String
  kind           String   // 'epistemic' | 'procedural' | 'allocative' | 'editorial'
  subjectType    String   // 'claim' | 'locus' | 'view' | 'option' | 'card'
  subjectId      String   // e.g. claimId OR "0.3" OR "view:2" OR "option:fee-10"
  issuedBy       String   // 'system' | 'panel:<userId>' | 'vote'
  rationale      String?  @db.Text
  inputsJson     Json     // AF snapshot, CQ statuses, RV params, tally, etc.
  version        Int      @default(1)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([deliberationId, subjectType, subjectId])
}
```

### Runtime contract

```ts
type DecisionReceiptInput = {
  kind: 'epistemic'|'procedural'|'allocative'|'editorial';
  subject: { type: 'claim'|'locus'|'view'|'option'|'card'; id: string };
  issuedBy: { who: 'system'|'panel'|'vote'; byId?: string };
  rationale?: string;  // short “Why”
  inputs: {
    ludicsTraceId?: string;
    usedAdditive?: Record<string,string>;
    decisiveIndices?: number[];
    endorsementBy?: string;
    cqSummary?: { required:number; satisfied:number; openByScheme: Record<string,string[]> };
    afLabels?: Array<{ claimId:string; label: 'IN'|'OUT'|'UNDEC' }>;
    entailment?: { verdict: 'strong'|'weak'|'none'; steps?: any[] };
    rv?: { rule:'utilitarian'|'harmonic'|'maxcov'; k:number; coverageAvg:number; coverageMin:number; viewIndex?:number };
    vote?: { method:'approval'|'rcv'; quorumOk:boolean; tally:any; winner?:string };
  };
  reopenOn?: Array<'UNDERCUT'|'REBUT'|'CQ_UNSATISFIED'>;
};
```

---

## 6) Server hooks (emits + guards)

### Emit events from mutating routes

```ts
// lib/server/bus.ts  (in-process bus)
export const bus = (globalThis as any).__meshBus__ ??= { /* on/emit as implemented */ };

// e.g. /api/dialogue/move
bus.emitEvent('dialogue:moves:refresh', { deliberationId });

// e.g. /api/claims/[id]/rebut or undercut
bus.emitEvent('claims:edges:changed', { deliberationId, toClaimId: id });

// e.g. after vote closes
bus.emitEvent('decision:changed', { deliberationId, subject: {type:'option', id:'fee-10'} });
```

> RV subscribes once (via SSE or window events) and **mutates SWR keys** that match.

### CQ toggle (guard recap)

* REBUT required: `attackType: 'REBUTS'` *or* NLI `contradicts` ≥ τ (when attacker provided)
* UNDERCUT required: `attackType: 'UNDERCUTS'`
* Else: **any inbound attack** acceptable
* Only **author/mod** can flip; otherwise **403**
* On failure: **409 `CQ_PROOF_OBLIGATION_NOT_MET`** with guard payload

---

## 7) UI hooks (where to show what)

* **Arguments / Cards**:

  * LegalMoveChips + NLCommitPopover (WHY/GROUNDS/Commit)
  * “Discuss in Ludics” bridges+opens drawer
  * “Cite detected link” + “Cite & Promote” (if not a claim)

* **CriticalQuestions**:

  * Buttons: WHY / GROUNDS / Mark Satisfied
  * If blocked: show guard message (“Needs undercut” / “Needs rebut or strong contradiction”)
  * “Attach existing” / “Create & Attach” suggestion shortcuts

* **Representative Viewpoints**:

  * `⊢ Γ→Δ` badge with counts + verdict (“Entailment: weak/strong”)
  * “Address CQs” dialog per view (prefilter to opens)
  * View menu: **Open all CQs / Copy ΓΔ / Send Γ to dialogue / Export card**
  * Conflicts list: **scroll+pulse** anchors

* **Decision banner** (on claim/card/dialogue header):

  * “Warranted (IN) · Panel confirmed · Vote scheduled 10/10” → link to **DecisionReceipt**

---

## 8) Voting (widget contract)

```ts
type VoteConfig = {
  method: 'approval'|'rcv';
  options: Array<{ id:string; label:string; rvViewIndex?: number }>;
  closesAt: string; // ISO
  quorum: { minCount:number; minPctActive30d:number };
};

type VoteTally = {
  approvals?: Record<string, number>;
  rcvRounds?: Array<{ eliminated?: string; tallies: Record<string, number> }>;
  winner?: string;
  quorumOk: boolean;
};
```

**Tally rules**

* **Approval**: winner = option with highest approvals; require quorumOk + (optional) approvalThreshold (e.g. >50%) if single winner.
* **RCV**: standard instant-runoff; if tie persists, show tie receipt and let panel schedule a runoff.

After close: create a `DecisionReceipt` with `{ kind:'allocative', issuedBy:'vote', inputs.vote:tally }`.

---

## 9) Re-open conditions

When any of the below happen on a subject claim/view/option:

* **New UNDERCUT/REBUT** edge appears
* A CQ flips from **Satisfied → Unsatisfied**
* New evidence causes AF labels to degrade (IN→UNDEC/OUT)

→ Set the decision banner to **Under Review** for `graceHours`, alert participants, create a new **receipt version** after panel confirms/updates.

---

## 10) QA / Acceptance Checklists

**CQ toggle**

* [ ] Author can mark satisfied when a valid rebut/undercut exists → 200 OK
* [ ] Non-author flips → 403
* [ ] Missing undercut/rebut → 409 with guard data; UI shows message, does not crash

**Ludics**

* [ ] Discuss in Ludics: bridges if needed, compiles/steps, opens drawer, sets target
* [ ] Additive clash: `assoc` allows step with reason; `partial` fails preflight; `spiritual` requires delocation then succeeds

**RV**

* [ ] Sequent badge shows `⊢ Γ→Δ` + verdict
* [ ] Conflicts click scrolls+pulses both anchors
* [ ] View menu performs each action; receipts created when needed

**Vote**

* [ ] Quorum enforced; tally stored; receipt created; banner updated
* [ ] RCV ties show rounds; no crash for 2-option case

**Re-open**

* [ ] Attaching undercut flips decision to **Under Review** and notifies
* [ ] CQ unsatisfied triggers the same

---

## 11) Minimal implementation tasks

* [ ] Add `DecisionReceipt` model + create helper
* [ ] Emit bus events from: `/api/dialogue/move`, CQ toggle, claim rebut/undercut, cards create/update, vote close
* [ ] Update `/api/arguments/batch` (return `text` + `edgesOut` standardized)
* [ ] RV: remove extra fetch; subscribe to bus/SSE
* [ ] Decision banner + receipt renderer (small component)
* [ ] Voting widget + tally endpoints
* [ ] Panel “delocate/confirm” mini-actions (write receipts with rationale)

---

If you want, I can follow up with a single PR-sized patch that: adds the Prisma model + helper functions, patches the emitting routes, and scaffolds the minimal banner + receipt renderer.
