
The thesis page on the site is a hypertextual document where every claim, argument, and attack referenced in the brief is a live interactive element. Hover over C-101 and you see the claim's full metadata — who authored it, when it was promoted from proposition to claim, what evidence is attached, what its current status is in the grounded extension. Click on A-203 and you can inspect the argument, see its scheme, read its critical questions, view the attacks filed against it, potentially file a new attack yourself. The markdown export is a flattened snapshot of this; the live page is the actual deliverable.

The static-vs-live distinction. A markdown document is necessarily a freeze — it captures a state at export time and cannot update. A live thesis page is a view into the ongoing deliberation. If someone files a new attack against C-204 tomorrow, the thesis page reflects it. If a previously-defended argument becomes undefended because the defense was retracted, the page shows the change. The thesis is not the terminal output of the deliberation; it's a surface onto the deliberation that stays synchronized with it.

The confidence-score interpretation problem. In a static document, "0.84 aggregate confidence" is a number whose meaning is unclear and whose provenance is opaque. In a live hypertextual page, hovering over the number could expose the computation — here are the input confidence scores from each prong, here's how they were aggregated, here's what each input score means, here's the last time any of them changed. The number becomes inspectable rather than asserted. A reader who wonders where 0.84 came from can trace it to its sources and audit the calculation. That's a different epistemic situation from the reader of a PDF who has to take the number on faith or reject it.

The attack register's completeness. On a live page, "0 undefended attacks" isn't a static claim — it's a current state that can be disrupted by a new attack filed right now. A skeptical reader who thinks the defenses are inadequate can register their disagreement by filing an attack that appears on the page in real time. The defended-ness becomes contingent rather than asserted, which is what it actually should be.

The self-referentiality issue. In a live document that the reader can engage with, "this thesis argues for the platform" is less problematic because the reader has the same tools available to challenge the thesis that the author used to construct it. The playing field is symmetric. The author can't win by selecting attacks to address — the reader can file attacks the author didn't anticipate, and those attacks become part of the permanent record whether or not they can be defended.


Why this is more than a "live document" in the usual sense

Most "live documents" are collaborative editing environments — Google Docs, Notion, wikis. The text is live but the structure is prose. What I am describing is different: the structure itself is live. Every argumentative element is a first-class object with its own identity, history, and inspectable properties. The document is a projection of a reasoning graph onto a linear reading surface. The graph is what's real; the document is one way of traversing it.

Alternative traversals of the same underlying structure. If the thesis is a projection of the deliberation graph, different projections are possible. The brief's linear order (Prong I → Prong II → ... → Prong VII) is one path through the argument space. A reader interested in starting from the risk assessment could enter at Prong VI and traverse backward through the supporting arguments. A reader who wants to examine the Bluesky AT Protocol question could enter at ATK-203 and traverse through the defense and surrounding context. The document becomes navigable in ways that prose isn't. This is the Essay Mode question from earlier resolving itself — the output to decision-makers isn't a PDF, it's a hypertextual surface where they can follow the reasoning at whatever depth they need.

Citation as deep linking. A journalist covering a policy debate can cite a specific argument in a deliberation (https://isonomia.app/c/CLAIM-7A3B, to use the pattern from the embeddable widget docs). The citation doesn't point to a paragraph in a PDF that may have been updated — it points to a live element whose current state the reader can inspect. If the cited claim was subsequently retracted or challenged, the citation reveals this automatically. The attribution is not just traceable but auditable.

Provenance as hypertext. Every claim on the thesis page presumably links back to its own history — the proposition it was promoted from, the workshopping it received, the arguments it's been enrolled in, the evidence attached to it, the user who asserted it. A reader encountering C-101 can dive arbitrarily deep into its provenance. For academic audiences, this is the reproducibility move that almost nothing on the web currently supports. You can inspect not just what's claimed but the entire causal history of how it came to be claimed.

The positioning implication
The pitch isn't "we produce structured arguments" — plenty of tools produce structured arguments, and the DD cohort knows about most of them. The pitch is: we produce long-form hypertextual argumentative documents with live structure. Decision-makers receive not a PDF but a navigable surface. Journalists can cite deep into deliberations with links that audit themselves. Researchers can traverse the argument graph at any depth. The thesis is a view, not a freeze. Reasoning is persistent as a live object, not preserved as a dead artifact.
This is distinct from what Kialo, DebateGraph, Pol.is, and the whole history of argumentation platforms have delivered. Those tools produced artifacts — maps, visualizations, exports. What I am describing is infrastructure for argumentative documents as first-class web objects. A thesis page is to a PDF what a Wikipedia article is to a printed encyclopedia entry: the same information, but in a medium where the information is alive.
The more accurate framing is: the output is a live document that decision-makers read, journalists cite, researchers audit, and the original participants can still update as new arguments come in. The transmission problem is solved not because the reasoning is packaged and sent but because the reasoning is published, in the web-native sense — addressable, linkable, inspectable, revisable.

----

A theory of what a document is, a theory of what knowledge is when knowledge is made native to the web, and a challenge to the entire tradition of the written argument as a completed artifact.

---

## Appendix A — Implementation status (Phase 7)

This appendix maps each vision claim above to the phase that delivered it.
Cross-reference with [LIVING_THESIS_ROADMAP.md](LIVING_THESIS_ROADMAP.md) for
file-level deliverables and [LIVING_THESIS_DEFERRED.md](LIVING_THESIS_DEFERRED.md)
for explicitly-postponed scope.

| Vision claim | Status | Shipped in | Notes |
|---|---|---|---|
| "The structure itself is live" — first-class objects with identity | ✅ shipped | Phase 1 | Batched `/api/thesis/[id]/live` + `useThesisLive` SWR (30s active / 120s hidden) feeds embedded TipTap nodes. |
| "Inspect any element" — drawer reveals provenance | ✅ shipped | Phase 2 | `ThesisInspectorDrawer` + per-object `/inspect/[kind]/[objectId]` endpoint; opens via global `openInspector` event. |
| "Reasoning that is alive" — visible attacks/defenses | ✅ shipped | Phase 3 | `ThesisAttackRegister` + `/api/thesis/[id]/attacks` (undefended/defended/conceded buckets). |
| "Confidence that is auditable" | ✅ shipped | Phase 4 | `ConfidenceBadge` + `/api/thesis/[id]/confidence` returns the formula and every contributing input. |
| "The thesis is a view, not a freeze" | ✅ shipped | Phase 5 | Manual `ThesisSnapshot` capture + diff against live or another snapshot via `/snapshots/[id]/compare`. |
| "Alternative traversals of the same structure" | ✅ shipped | Phase 6 | Prong outline, Used-in backlinks (`/api/objects/[kind]/[id]/backlinks`), and provenance lineage ("promoted from proposition") in the inspector. |
| "Citation as deep linking" — `?focus=…&tab=…` deep links | ✅ shipped | Phase 6 | `ThesisFocusHandler` + `/api/thesis/[id]/focus` resolves `ref` (id or `Claim.moid`) and dispatches `openInspector`. |
| "The reasoning is published, addressable, linkable" | ✅ shipped | Phases 1–6 | Read path is permission-gated as of Phase 7.2 (author / published / deliberation participant). |
| "Citations whose state can be re-inspected" — auto-snapshot on retraction | ⏳ deferred | D1 | Manual snapshots ship in Phase 5; background workers that auto-snapshot on label flip are tracked in `LIVING_THESIS_DEFERRED.md` D1. |
| "Canonical embeddable widget" — `https://isonomia.app/c/CLAIM-…` | ⏳ deferred | D2 | `Claim.moid` is the stable handle (Phase 6 focus resolver accepts it); the canonical short URL + embed iframe is D2. |
| "Live without polling" — push-based updates | ⏳ deferred | D3 | Phase 7.1 instrumentation (`thesis.reader.poll` log line emitting latencyMs / payloadBytes / staleMs / objectCount) gates the SSE/WS upgrade. |
| "Chain embedding & enabler/justification reconstruction" | ⏳ deferred | D4 | The data model accommodates it; UI surface postponed pending pragmatics-team scoping. |

### What Phase 7 actually delivered

- **7.1 Polling instrumentation.** `lib/thesis/observability.ts` emits a single
  structured `console.info` line per reader request (`thesis.reader.poll`) with
  `endpoint`, `thesisId`, `latencyMs`, `payloadBytes`, `objectCount`,
  `staleMs`, `cursor`, `status`, and `requestId`. Wired into `/live`,
  `/attacks`, `/confidence`, `/inspect/[kind]/[objectId]`. These are the
  signals the SSE/WS upgrade decision (D3) depends on.
- **7.2 Permissions audit.** `lib/thesis/permissions.ts` introduces
  `checkThesisReadable`, `checkThesisWritable`, and `filterReadableTheses`.
  Every Phase 3 reader endpoint now gates on author / `status === "PUBLISHED"`
  / deliberation participation (via `lib/cqs/permissions.ts#isDeliberationParticipant`).
  The cross-thesis `/api/objects/[kind]/[id]/backlinks` endpoint redacts
  draft theses by other authors that the caller cannot see. We deliberately
  did not use `packages/sheaf-acl` here — that package models per-message
  audience selectors, not deliberation membership; the roadmap mention has
  been corrected accordingly.
- **7.3 This appendix.** Vision claims are explicitly mapped to shipped
  phases or deferred items.
- **7.4 Deferred ledger refresh.** See `docs/LIVING_THESIS_DEFERRED.md` for
  the current scope of D1–D4 plus newly-tracked smaller items (hash-anchor
  scrolling, MOID expansion to non-Claim objects, structured metric
  emission).

The Living Thesis V1 is now complete. The reasoning surface is live,
inspectable, auditable, snapshottable, traversable, deep-linkable, and
permission-gated. What remains is push-based transport (D3) and the
canonical embed URL (D2) — both of which are pure transport upgrades on
the same payload shapes shipped in Phases 1–6.
