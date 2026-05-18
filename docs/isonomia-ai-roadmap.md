# Isonomia AI Extensions — Product Roadmap

## Overview

This roadmap covers the extension of Isonomia's LLM integration from its current state (MCP-based argument creation and evidence attachment) to a full conversational interface through which users can read, navigate, and participate in deliberations without requiring direct interaction with the platform UI. The guiding principle throughout: AI as epistemic infrastructure, not epistemic agent.

---

## Phase 1 — Deliberation Briefings (Read-Only)

**Goal:** Let users ask an LLM about the current state of any deliberation and get a useful, navigable orientation, with measurable guarantees that the orientation faithfully reflects the underlying graph.

**What it enables:** A user pastes a deliberation link into a conversation with an LLM (or references it via MCP) and can ask questions like "What's the main contested claim?", "Where are the open critical questions?", "Which arguments have undefended challenges?", "Summarize the strongest case for and against X."

**Central technical risk: summarization fidelity.** A graph linearized into prose loses topology. An LLM briefing that confidently asserts "the central contested claim is X" when the underlying graph has three roughly co-equal hubs is actively misleading, not merely incomplete. Because every downstream phase consumes briefings (Phase 3 users orient via briefings before filing moves; Phase 5 diagnostics build on the same payloads), any quiet miscalibration here propagates everywhere. Fidelity is therefore the primary deliverable of Phase 1, not a downstream validation step.

**Work required:**

*Payload and endpoint work:*

- Audit existing read tools (`get_synthetic_readout`, `get_contested_frontier`, `get_chains`, `ecc_evidential`, `get_deliberation_fingerprint`) for payload completeness — do they return enough for an LLM to construct a faithful summary, or are there gaps (e.g., missing participant attribution, missing timestamps for recency, missing hub-multiplicity signals)?
- Build a composite "briefing" endpoint (or document a recommended tool-call sequence) that gives an LLM the full deliberation state in a single round-trip or minimal calls. Current tools are narrow slices; an LLM needs the whole picture to orient a user.
- Include explicit topology signals in the briefing payload that an LLM cannot reconstruct from prose summaries alone: hub set (not just "the hub"), load-bearing premises (premises whose retraction would cascade), undefended-challenge list, stalled-thread list, and a recency vector.

*Fidelity evaluation harness (the gating workstream):*

- Build a fixed evaluation corpus of 20–40 real deliberations spanning small (≤10 arguments), medium (10–50), and large (50–200+) sizes, plus deliberately adversarial topologies (multi-hub, deeply nested, heavy with retracted nodes, dense with undefended challenges).
- For each corpus deliberation, extract a **structural ground-truth manifest** directly from the graph: hub set with multiplicity, ranked load-bearing premises, exhaustive open-CQ list, identity of strongest counter per top-level argument, list of stalled threads, list of currently grounded vs. defeated arguments. This manifest is computed mechanically from the graph, not authored by humans.
- Define a fidelity scorecard the LLM briefing is graded against: (1) hub-set agreement (precision/recall against ground-truth hubs, not just top-1 match), (2) load-bearing premise identification, (3) open-CQ recall, (4) absence of confident misstatements ("hallucinated structure" — the LLM asserting topology that doesn't exist).
- Treat the harness as a regression suite: run it against every model version (Claude/GPT upgrades) and every payload schema change. Briefings that drop below a defined fidelity threshold block deployment.

*Calibration:*

- Require briefings to express uncertainty when the graph is genuinely ambiguous (e.g., "three claims are roughly co-equal hubs" rather than picking one). Penalize false confidence in the scorecard.
- For deliberations above a size threshold where fidelity demonstrably degrades, briefings must either (a) operate hierarchically (briefing-of-briefings over sub-regions of the graph) or (b) explicitly tell the user "this deliberation is too large for a single faithful briefing — here are the sub-regions you can drill into." Silent degradation is the failure mode to prevent.

**Validation signal:**

- *Primary (mechanical):* LLM briefings achieve and sustain ≥ defined thresholds on the fidelity scorecard against the evaluation corpus. Specific thresholds set during harness construction; "no confident misstatement of structure" is non-negotiable.
- *Secondary (human):* Users who receive a briefing can accurately describe the deliberation's structure, central disputes, and open questions when compared to users who navigated the graph UI directly.

**Risk:** Low for the user-facing surface (no mutations, no commitment store implications, no attribution concerns). Medium for the platform as a whole — Phase 1 is the fidelity-validation gate for the entire AI roadmap, and shipping a briefing layer that quietly miscalibrates would compromise every downstream phase that depends on it.

---

## Phase 2 — Argument Authoring Assistance

**Goal:** Expand the current MCP write path (which already works — the caffeine argument demonstrated this) with pre-publication quality tooling, organized around two anchor sub-features (spectrum translation and assumption surfacing) and a set of supporting aids that build on them.

**Why two anchors.** The platform's central UX commitment is the informal-to-formal spectrum: any conversation can become a structured deliberation, any annotation can become a proposition. The single highest-leverage thing an LLM can do for the platform is be the bridge between adjacent points on that spectrum — translating prose into structured arguments and back. Everything else in Phase 2 (stress-testing, CQ instantiation, evidence gap detection) becomes more useful once the bridging works, because more arguments enter the formal layer at all. Separately, of all the pre-publication aids, *assumption surfacing* is the one humans cannot reliably do for themselves (the most obvious assumptions are exactly the unstated ones), so it gets first-class treatment alongside translation rather than being one item in a flat list.

### Anchor sub-feature A — Spectrum translation

The bidirectional bridge between informal prose and structured arguments. This is the feature that lets the social layer feed the reasoning layer at scale: a user writing in a forum thread, an annotation, or a comment can move that content one step toward the formal layer with a single LLM-assisted action, and conversely a structured argument can be rendered as plain-language prose for readers who want the gist without parsing the scheme structure.

**Prose → structure (the upgrade direction).**

- *Detection.* Given any informal text (forum post, comment, annotation, message), the LLM identifies whether it contains an implicit argument and, if so, extracts a candidate (claim + reasons + scheme).
- *Proposal.* The user sees a structured rendering of their text: "This looks like a claim (X), supported by two reasons (Y, Z), fitting an Argument from Negative Consequences. Want me to structure it?"
- *Confirmation and editing.* The user can accept, edit any extracted element, change the suggested scheme, or decline. The structured argument is created via the standard MCP write path with `authorKind: HYBRID`.
- *Granularity.* Translation is offered at multiple grain sizes: a single sentence may become a single claim; a paragraph may become a claim + premises + scheme; a multi-paragraph section may become a chain of arguments. The LLM proposes the appropriate granularity but the user can subdivide or merge.
- *Trace preservation.* The structured argument retains a back-reference to the source prose (post ID, annotation ID, message ID) so readers can navigate from the formal version to the informal context that produced it. This is how the spectrum stays continuous rather than becoming two disconnected layers.

**Structure → prose (the readout direction).**

- *Plain-language summary.* Any argument can be rendered as a paragraph-length plain-language summary derived from its scheme + premises + conclusion. Useful for embeds, social cards, and readers who want to grasp the argument without parsing the formal structure.
- *Auto-generated essay rendering.* For an argument *chain* (the existing chain feature), an essay-style narrative is produced from the chain structure. This is the existing chain rendering capability, with the LLM responsible for prose quality and ordering rather than for inferential structure (which the chain already encodes).
- *Faithfulness constraint.* Prose readouts must not introduce content not present in the underlying structure. The eval harness includes a faithfulness scorecard for readouts: any claim, premise, or inference in the prose that does not map to a node in the source argument is a failure (analogous to "hallucinated structure" in Phase 1).

**Why this is anchor A.** Translation is the feature that determines whether the platform's spectrum commitment scales beyond users who already think in formal-argument terms. Without prose → structure assistance, the formal layer is gated by a skill threshold that only a fraction of users will cross. Without structure → prose, formal arguments are gated for *readers* by the same threshold. The bridging is the unlock for both.

**Work required:**

- Define the extraction prompt and scheme-fit scoring approach; calibrate against a labeled corpus of informal posts paired with the structured arguments their authors would have written.
- Build the translation UI surfaces in the post composer, comment composer, annotation rail, and message composer (all the places informal text originates).
- Build the readout UI surfaces in argument permalink pages, embeds, social cards, and chain rendering.
- Wire the back-reference from structured arguments to source informal context, including the case where the source has been edited or deleted (broken back-references should be visible, not silently dropped).
- Add a translation-quality scorecard to the eval harness: extraction accuracy on the labeled corpus, faithfulness of structure → prose readouts, granularity calibration (over- and under-segmentation rates).

### Anchor sub-feature B — Assumption surfacing

The pre-publication aid that humans cannot reliably perform on their own arguments, because the assumptions that feel most obvious are exactly the ones most likely to go unstated. An LLM with access to the argument's scheme + premises + conclusion can systematically identify the unstated warrants doing inferential work and offer to materialize them as `propose_warrant` calls so the argument's full dependency structure becomes visible and attackable.

- *Identification.* Given a draft argument, identify the warrant(s) that bridge the premises to the conclusion under the chosen scheme but are not themselves stated as premises. Distinguish *enthymematic* warrants (genuinely missing premises that an opponent could attack) from *meta-inferential* warrants (the scheme's own inference rule, which doesn't need to be restated).
- *Materialization.* For each identified warrant, propose a precise statement and offer the user the option to add it as an explicit premise via `propose_warrant`. The user can accept, edit, or decline.
- *Calibrated coverage.* Surfacing every conceivable assumption produces noise; surfacing only the most load-bearing produces value. The eval harness's assumption-surfacing recall scorecard (already specified in the harness workstream) is calibrated against expert-annotated implicit warrants on a labeled corpus, with both precision and recall tracked.
- *Defaults.* Assumption surfacing is opt-in per draft (suggested but not auto-applied), because forcing materialization of every implicit warrant would balloon argument size and obscure the main inferential thread. The user decides which warrants to make explicit.

**Why this is anchor B.** Every other pre-publication aid in Phase 2 (stress-testing, CQ instantiation, evidence gap detection) flags problems the author could in principle find on their own with effort. Assumption surfacing addresses a class of error that is genuinely hard for the author to detect because it is invisible by construction. That makes it the highest marginal contribution per LLM call in the entire Phase 2 surface.

### Supporting aids (build on the anchors)

- *Scheme suggestion:* When the user begins drafting a new structured argument from scratch (not via translation from prose), the LLM suggests the best-fit scheme from the catalog. When the user reaches Phase 2 via the translation path, scheme suggestion is already part of that flow.
- *Stress-testing:* Before posting, the LLM reviews premise structure and flags the weakest point, the most likely undercut, and any evidence-premise misalignment. Output must be specific and actionable ("premise 3 is correlational but your conclusion assumes causation"), not generic hedging ("this could be stronger"). Generic outputs are penalized in the eval harness.
- *Critical question instantiation:* The LLM takes the abstract CQs for the selected scheme and generates concrete, context-specific versions the author can pre-empt. The instantiated CQs are also exposed to readers of the published argument as suggested challenge angles.
- *Evidence gap detection:* Flags premises without direct evidential support, or where the evidence methodology doesn't match the premise type. Composes with the existing auto-citation engine: when a gap is detected, the LLM can offer to draft a citation query that the auto-citation engine resolves.

### Work required (overall)

- Build the **draft review** flow: argument is composed (via translation or scratch) but held in a pre-publication state where the LLM can analyze and suggest improvements before the user confirms posting. The state is the same session-scoped quarantine specified in the MCP write-path workstream (failure mode 6); pre-publication drafts are not separate plumbing.
- Integrate `list_schemes` into the authoring flow so scheme selection is assisted in both the translation and scratch paths.
- Develop prompt patterns for each supporting aid that produce actionable rather than generic feedback. Calibration against the eval harness is the gate.
- Decide per-aid visibility: stress-test and assumption-surfacing outputs are private drafting aids by default; instantiated CQs are optionally attachable to the published argument as a transparent self-critique signal.

### Validation signal

- *Translation quality (anchor A):* Extraction accuracy ≥ defined threshold on the labeled informal-to-structured corpus; readout faithfulness 100% (no hallucinated structure); granularity calibration within tolerance. Adoption signal: fraction of structured arguments originating via the translation path on the social layer.
- *Assumption surfacing (anchor B):* Recall against expert-annotated implicit warrants ≥ defined threshold; precision high enough that user acceptance rate of surfaced warrants stays above a calibration floor (low acceptance = noise, not signal).
- *Overall Phase 2:* Arguments published through the assisted flow show higher fitness scores, fewer unforced errors in evidence alignment, and survive initial challenges at a higher rate than unassisted arguments. Style-homogenization is monitored separately (see risk).

### Risk

Low-medium. Still human-authored and human-confirmed. Two specific risks are worth naming:

- *Style homogenization.* If translation and stress-testing converge arguments toward an LLM-typical voice, the platform loses the variety of voices that distinguishes it from a synthetic content site. Mitigated by minimal-rewrite defaults in translation (preserve the user's wording where possible; structure rather than rephrase) and by tracking lexical diversity across the corpus over time as a regression signal.
- *Over-deference on scheme suggestion.* Users may accept the LLM's scheme suggestion without engaging with the choice, especially if the UI defaults to "accept." Mitigated by explicit two-option presentation (suggested scheme + one alternative), brief justification per option, and never pre-selecting a default. If the eval harness shows scheme-acceptance rates approaching 100%, the UI is too push.

---

## Phase 3 — Conversational Participation (Write Path)

**Goal:** Allow users to file dialogue moves (challenge, defend, concede, retract, request clarification) through an LLM conversation rather than the platform UI, with safeguards strong enough that the conversational tone of the interface cannot trick users into treating formal moves casually.

**What it enables:** A user, oriented by a Phase 1 briefing and potentially having authored arguments via Phase 2, can now respond to other participants' arguments conversationally. "I want to challenge the second premise of that argument — the ABCD study doesn't control for socioeconomic status" becomes a typed challenge move in the deliberation graph.

**Central design risk: tonal asymmetry.** Conversational interfaces feel low-stakes. Formal dialogue moves are not. A single confirmation gate is insufficient to bridge that gap, especially because users acclimate to confirmation prompts and begin clicking through them. The safeguard model is therefore layered: not one gate, but a defense-in-depth stack where each layer addresses a different failure mode (misunderstanding consequences, acting on stale state, flooding the deliberation, drifting from the user's actual position).

**Work required:**

*Move plumbing:*

- Map each dialogue move type to an MCP tool call (some may already exist; others may need new endpoints).
- Implement a commitment store read tool so the LLM can check the user's current commitments before suggesting moves that would create contradictions.
- Design the attribution model: moves filed through an LLM should be clearly tagged as LLM-assisted in the UI (extending the existing `authorKind` pattern) so other participants know the provenance. Distinguish "LLM-drafted, human-confirmed" from "LLM-suggested-and-explained, human-authored" in the attribution metadata.

*Safeguard layer 1 — Consequence preview (textual):*

- Before any move is posted, the LLM explains its downstream effects in natural language. "This concession would remove premise 2 from your earlier argument, which currently has no other support for that inference step. Your argument's grounded status may change."
- The preview must be **specific and graph-grounded** (cite the affected node IDs, name the cascading consequences) — generic warnings are penalized in the eval harness because they train users to ignore them.

*Safeguard layer 2 — Dry-run sandbox (structural):*

- Every proposed move runs against a **read-only branch of the deliberation graph** before posting. The branch reflects the post-move state: updated commitment store, recomputed grounded extension under ASPIC+, recomputed Ludics designations for any affected sub-game, updated chain renderings for any chains the move touches.
- The user is shown a structural diff: which arguments changed status (grounded → defeated, undefended → defended, etc.), which CQs newly opened or closed, which of their *own* prior arguments are now affected. This is what the consequence preview describes in prose; the sandbox is the ground truth the prose must match.
- The sandbox runs server-side from the same code path as live evaluation (no separate "preview engine") to guarantee that what the user sees is what posting will produce.

*Safeguard layer 3 — Staleness verification:*

The temporal gap between briefing and posting is where conversational interfaces silently break. A user is briefed at T0, composes a response over several minutes, and posts at T1. Anything can have happened in between: the targeted premise may have been retracted, the argument may have been conceded by its author, a new attack may have changed the dialectical landscape that motivated the user's response, or the user's own move may now duplicate one filed in the interim. "Re-check before posting" is the right instinct but underspecified — different re-check semantics produce very different UX and very different correctness guarantees. We commit to the following layered semantics:

- **Targeted-node integrity check (mandatory, blocking).** The exact nodes the move references — the targeted argument, the specific premise being challenged, the claim being conceded — must still exist in their referenced form. If a referenced node has been retracted, withdrawn, or substantively edited (versioned to a new revision), the move is rejected outright and the user is shown what changed. No move is ever posted against a stale node identifier.

- **Dialectical-context check (mandatory, advisory-then-blocking).** The local dialectical state around the targeted node is recomputed and compared to the state captured at briefing time. If the local state has changed in ways that materially affect the move's meaning — e.g., the premise the user is about to challenge has *already* been challenged on the same grounds since briefing, the argument being defended has already been conceded by its original author, a new attack has shifted the targeted argument's grounded status — the user is shown a focused re-briefing of just the changed region and must explicitly reaffirm the move. Reaffirmation is not a generic "are you sure?" — it surfaces the specific delta and asks whether the move still makes sense given it.

- **Global-context check (advisory only).** Changes elsewhere in the deliberation that do *not* touch the targeted region are not surfaced as blockers. This is a deliberate scoping decision: requiring full re-briefing on every move would make conversational participation unusable in active deliberations, and most distant changes don't affect the move's correctness. The trace (safeguard layer 5) records the briefing snapshot timestamp so post-hoc analysis can identify cases where a distant change *should* have been surfaced.

**Defining "materially changed."** The dialectical-context check is only useful if "material change" is precisely defined; otherwise it either fires constantly (training users to dismiss it) or never (defeating the purpose). Material changes are:

1. The targeted node's grounded/defeated status under ASPIC+ has flipped.
2. The targeted node has gained or lost a direct attacker or supporter.
3. A challenge identical or near-identical (by claim equivalence, not string match) to the user's pending challenge has been filed.
4. The targeted node's author has filed a concession or retraction touching the same premise.
5. An open CQ the user's move was implicitly addressing has been closed by another participant.

Anything else (changes to sibling arguments, updates to unrelated chains, new participants joining, evidence added to non-targeted premises) is logged but does not trigger reaffirmation.

**Implementation requirements.**

- The briefing payload includes a **briefing fingerprint** — a content hash over (targeted-region nodes, their statuses, their direct neighbors in the attack/support graph, the open-CQ set for the targeted scheme instance). Posting a move includes the fingerprint of the briefing it was composed against.
- The server recomputes the same fingerprint at post time over current state. Equality → fast path, post immediately. Inequality → diff the underlying region, classify the diff against the "material change" rules above, branch into integrity-rejection / reaffirmation / silent-acceptance accordingly.
- Fingerprint computation is server-side and deterministic; the client never claims freshness.
- The re-briefing surface for reaffirmation is itself a small Phase-1 briefing scoped to the changed region, so it inherits the fidelity guarantees of the briefing layer rather than reinventing summarization.

**Failure mode to monitor:** *reaffirmation fatigue.* If the dialectical-context check fires on more than a low single-digit percentage of moves in normal deliberations, the "material change" rules are too aggressive and need tightening. Telemetry on reaffirmation-fire rate and post-reaffirmation cancellation rate is part of the observability trace (layer 5).

*Safeguard layer 4 — Rate limiting and tempo controls:*

- LLM-mediated moves are rate-limited per user per deliberation (initial proposal: ≤1 move per N seconds, with N tuned by deliberation activity level; bursts allowed but throttled). The asymmetry where one LLM-equipped user can file moves at conversational speed while UI users compose for minutes will distort deliberation tempo even when every individual move is protocol-valid.
- Per-deliberation cap on total LLM-mediated moves per user per day, with override available only through explicit facilitator action.
- Cooldown after any *retracted* LLM-mediated move (a move the user posts then immediately retracts is a strong signal that the consequence preview failed; the cooldown reduces blast radius while we collect signal on which previews are misleading).

*Safeguard layer 5 — Attribution and observability:*

- Every LLM-mediated move records the briefing snapshot it was composed against, the consequence preview text shown to the user, the sandbox diff the user saw, and the model version used. This trace is queryable by facilitators and surfaced in the move's expanded metadata. Without this trace there is no way to debug bad moves after the fact, and no way to attribute systematic failures to specific model versions or briefing payload regressions.

**Validation signal:**

- Moves filed through the LLM interface are protocol-valid (zero illegal moves in production).
- Attribution is correct on every move (audited continuously, not sampled).
- Participants on the other end cannot distinguish LLM-assisted moves from UI-filed moves in terms of substantive quality.
- Retraction rate of LLM-mediated moves does not exceed retraction rate of UI-filed moves by more than a defined margin (if it does, the consequence preview is failing).
- Distribution of move tempo does not shift measurably toward LLM-mediated users dominating activity.

**Risk:** Medium-high. Commitment store mutations are real and consequential, and the tonal asymmetry between conversational interface and formal protocol is the single hardest UX problem in the roadmap. The five-layer safeguard stack is the design's response; if any layer is dropped to ship faster, the risk profile changes materially.

---

## Phase 4 — Cross-Context Discovery and Navigation

**Goal:** Use LLM semantic understanding to surface connections across deliberations, rooms, and the Plexus transport network, under an explicit privacy model that treats embedding indices as a leakage surface in their own right rather than as a passive store gated by query-time access checks.

**What it enables:** "Has anyone else argued about caffeine regulation for minors?" returns relevant claims and arguments from other deliberations, with provenance and current standing. "This premise about adolescent brain development also appears in three other deliberations — here's how it's faring in each." Supports the Plexus network's cross-context transport with a natural-language discovery interface.

**Central design risk: index-level leakage.** A query-time access check is necessary but not sufficient. Vector indices leak information about content even when content is never returned: confirmed existence of a near-match, similarity-score distributions across queries, and approximate clustering of private claims are all recoverable from a query interface that only returns "permitted" results. If the same index serves both public and private claims, an adversary with API access can probe the index to confirm that a specific claim exists in a private room, infer rough topic distributions in rooms they cannot read, or correlate claim activity over time. The privacy model must treat the *act of indexing* — not just the act of returning a result — as a disclosure decision.

### Privacy threat model

**Assets to protect:**

1. **Claim text** in private/closed rooms.
2. **Existence and approximate topic** of private claims (the "this room is talking about X" signal, separable from the claim text itself).
3. **Activity patterns** in private rooms (when claims are added, challenged, retracted).
4. **Cross-room linkage signals** (the fact that a specific claim in private room A is similar to a claim in private room B is itself sensitive — it links the rooms).
5. **Authorship and participation patterns** (who is arguing what, where).

**Adversary classes:**

1. **Outside attacker, no platform account.** Defeated by authentication; not the interesting case.
2. **Authenticated user with no membership in the target room.** The default case for most private-room privacy concerns. Must learn nothing about private claims via discovery, including their existence.
3. **Authenticated user with read access to *one* private room, probing for content in *another*.** Can craft adversarial queries; can correlate scoring distributions; can use their permitted room as an oracle to triangulate the impermissible one. This is the case query-time access checks alone do not handle.
4. **Authenticated user with LLM tool access (MCP).** Can run automated probing at higher volume than UI users. Rate limits become a privacy control, not just a load control.
5. **Compromised facilitator or admin.** Out of scope for the discovery layer (handled at the platform-level access model); noted for completeness.
6. **Internal observer with database/log access.** Out of scope here (governed by infrastructure-level controls); noted because telemetry and embedding stores must be classified accordingly.

**Attack surfaces specific to embedding-based discovery:**

- **Membership inference via score distributions.** Repeated near-duplicate queries can reveal whether a specific claim text is in the index, even if the API never returns it.
- **Topic inference via aggregation.** Even without returning private claims, a discovery layer that returns *counts* ("similar claims found in 3 other deliberations") leaks the existence of relevant private content.
- **Cross-room linkage via "related claims."** Surfacing a claim in room A and noting it's similar to claims elsewhere can leak the existence of similar claims in rooms the querier cannot access.
- **Provenance leakage.** A returned claim's provenance chain (transported from room X to room Y) leaks information about room X to anyone permitted to see room Y.
- **Time-correlated probing.** An attacker who can submit queries over time can detect when private claims are added (new near-matches appear).

### Privacy model — design commitments

**Index partitioning.** Claims are indexed in tiers determined by their containing room's discoverability setting, not by per-query filtering of a single combined index:

- **Public tier** — claims in public rooms; freely indexed and discoverable by any authenticated user.
- **Federation tier** — claims in rooms that have explicitly opted into cross-room discovery within a defined federation (e.g., rooms operated by a partner organization). Indexed in a tier visible only to authenticated users with membership in any federation room.
- **Private tier** — claims in closed rooms. Indexed only in a tier visible to that room's members. No combined-index queries cross tier boundaries; an opt-in is required at the *room* level for any claim to enter a higher-visibility tier.

This eliminates the "single index with permission filter" pattern and its associated leakage surface. A user querying without membership in a private room receives results computed only from indices they are permitted to query against; private-tier indices are not consulted at all.

**No counts or aggregates from inaccessible tiers.** The discovery surface never reports "N additional results exist that you cannot see." The existence signal itself is sensitive; suppressing it without trace is correct, even at the cost of a less informative empty state.

**Provenance redaction.** Transported-claim provenance chains are walked client-side from the requesting user's permission set: any link in the chain that traces through a room the user cannot access is rendered as an opaque "transported from a non-public source" marker, not as the source room's identifier. The full chain remains available to users with the relevant permissions; nobody else sees a partial chain that names a room they cannot read.

**Per-room discoverability opt-in.** Room creation and settings include an explicit, discoverability tier selector (public / federation / private), defaulting to private for newly created closed rooms. Changing tier requires a typed action by a room owner and is logged as a governance event visible to room members. Existing rooms keep their current tier; no automatic re-tiering on schema upgrade.

**Per-claim opt-out within a tier.** Even in public/federation rooms, individual claims can be marked non-discoverable by their author or by the room. Useful for claims that contain sensitive examples or personal information surfaced in a public deliberation. Non-discoverable claims are excluded from the index entirely (not filtered at query time).

**Rate limiting as a privacy control.** Per-user query rate limits on the discovery endpoint, with stricter limits for cross-tier queries (federation tier when querying user is in only one federation room, etc.). LLM/MCP query paths share the user's quota — agent-mediated discovery does not get a higher budget than UI discovery. Rate limits are scaled to make membership-inference and time-correlated probing impractical without being noticeable to legitimate users.

**Score and ranking opacity.** Discovery responses return ranked results without raw similarity scores. Internal scores remain available to debugging and ranking-quality eval, but the API does not expose them in a form usable for distribution-fitting attacks.

**Audit trail for sensitive queries.** Cross-tier queries (queries that touch federation-tier indices the user has limited federation access to) are logged with query content, timestamp, and result set size. Logs are retained on a defined schedule and reviewable by the relevant federation governance. This is the deterrence mechanism for adversary class 3 (authorized user probing for unauthorized content).

### Work required

*Indexing and storage:*

- Implement tiered indices (public / federation / private). Choose between physically separate vector stores per tier (preferred for hard isolation) and logically separate namespaces in a single store (acceptable if access control is enforced below the query API by infrastructure, not in application code).
- Build the room-tier setting, the per-claim opt-out, and the migration path for existing rooms (default existing closed rooms to private tier; require explicit owner action to escalate).
- Define the embedding-store classification: private-tier embeddings are sensitive data and inherit the same handling rules as the underlying claim text (encryption at rest, access logging, retention policy).

*Query and ranking:*

- Discovery endpoint resolves the requesting user's tier eligibility *before* selecting indices to query; never queries an index the user is not entitled to.
- Implement provenance-chain redaction as described.
- Implement rate limits, with separate budgets per tier and shared budget across UI and MCP paths.
- Strip raw similarity scores from API responses; expose only rank and a coarse confidence bucket if needed.

*UX:*

- Discoverability tier selector on room creation and settings, with clear explanation of what each tier means for member privacy.
- Per-claim non-discoverable toggle in the claim composer and post-publish controls.
- Empty-state design that does not leak the presence of inaccessible matches (no "N additional results hidden" patterns).
- Recommendation UX for surfaced claims: import, cite, or challenge from current context — gated by the requesting user's permissions in both source and target rooms.

*Audit and governance:*

- Audit logging for cross-tier queries with retention and review process.
- Federation governance interface for reviewing query logs at the federation level (not individual user surveillance — pattern detection across federation members).
- Threat-model document maintained alongside the code; updated when new discovery features are added.

### Validation signal

- Penetration test specifically targeting adversary class 3 (authenticated user probing for content in inaccessible rooms): no successful membership inference, no successful topic inference at meaningful resolution, no successful cross-room linkage leakage.
- Audit log review confirms cross-tier query patterns match legitimate use distributions; anomalies investigated.
- Users discover relevant cross-context arguments they would not have found through manual browsing (the original product signal — preserved, but secondary to the privacy guarantees).

**Risk:** Medium-high. Embedding-index leakage is a well-documented and under-mitigated class of attack across the industry; the design above is conservative because the cost of leaking private deliberation content is high and the cost of a less-rich discovery surface for cross-tier queries is low. If federation-tier discovery proves too restrictive in practice, loosening is a reversible decision; tightening after a leak is not.

---

## Phase 5 — Deliberation Health Diagnostics

**Goal:** Provide facilitators, moderators, and participants with LLM-generated analysis of a deliberation's *structural* health, designed so the diagnostics serve facilitation rather than degrading into a surveillance surface, a participant scoreboard, or a moderation weapon.

**Central design risk: misuse drift.** Diagnostics start as facilitation aids and end as performance metrics, leaderboards, or moderation evidence — that drift is the well-documented failure mode of every analytics surface ever shipped on a social platform. The risk is not that the diagnostics are wrong; it is that they are *correctly* used for purposes they were not designed for. Mitigations are structural (what is computed, what is exposed, to whom) rather than aspirational ("we'll trust people to use it well").

### Diagnostic categories

**Structural (graph-level, not participant-level):**

- Premises asserted but never challenged or evidenced.
- Single claims that are load-bearing for many downstream arguments (high betweenness in the support graph).
- Stalled threads: challenges filed with no defense or concession after a configurable interval.
- Open critical questions per scheme instance, and aggregate CQ engagement rate across the deliberation.
- Orphaned arguments: structures with no incoming attacks or supports and no participation in any chain.
- Cascade exposure: arguments whose grounded status would change under retraction of any single premise.

**Completeness (CQ-level):**

- Per-scheme-instance CQ coverage — which CQs have been addressed, which remain open.
- Aggregate CQ-engagement rate across the deliberation, with comparison to deliberations of similar size and topology in the corpus (not as a target to hit, as context for interpretation).

**Tempo (deliberation-level):**

- Time-since-last-activity per region of the graph.
- Open-obligation aging (a challenge filed N days ago without response is a tempo signal, not a participant performance signal — see "what is deliberately not computed" below).

**Equity (participant-aggregate, never participant-individual at default visibility):**

- Distribution of attacks and supports across positions or coalitions in the deliberation. Not "user X is under-challenged"; rather "the position that adolescent caffeine use is benign has accumulated 12 supports and 1 attack — possibly under-engaged."
- Distribution of speaking turns across position-clusters, not across users.
- Equity diagnostics are *positional*, not personal, by default. Per-participant equity analysis is available only to facilitators and only on explicit demand, with the request itself logged as a governance event visible to room members.

### What is deliberately not computed

The following are *not* part of the diagnostic surface, regardless of technical feasibility, because they convert facilitation into surveillance:

- Per-participant scoring or ranking of any kind (most active, most challenged, most retracted, most defended, etc.).
- "Participation quality" scores per user.
- Tracking of which participants have read which arguments.
- Sentiment or tone analysis of individual contributions.
- Predictions about which participants are likely to retract, concede, or disengage.
- Comparison of a deliberation's diagnostics against rooms in another organization without that organization's opt-in (Phase 4 federation discoverability rules apply).

These exclusions are stated explicitly so that requests to add them later are recognized as scope changes requiring a principle-level decision, not feature additions.

### Audience and visibility

Different diagnostic categories have different default audiences:

- *Structural and completeness diagnostics:* visible to all room members. These are properties of the deliberation, not of participants.
- *Tempo diagnostics:* visible to all room members at the regional level, visible to facilitators at finer granularity.
- *Equity diagnostics:* visible to all room members at the positional level (default); per-participant breakdowns visible only to facilitators on demand and logged.
- *Comparative-corpus context* (e.g., "this deliberation's CQ engagement rate is in the bottom quartile for its size class"): visible to facilitators only. Participants do not need a leaderboard signal to engage with their own deliberation.

### Cadence

- *On-demand:* equity analysis at any granularity, completeness checks for a specific scheme instance, structural queries against arbitrary regions of the graph.
- *Notification-based (opt-in per room):* stalled-thread alerts after configurable thresholds, cascade-exposure alerts when a load-bearing premise gains a new attacker, open-obligation aging digests for facilitators.
- *Scheduled batch:* full-deliberation health reports at configurable intervals (default weekly), surfaced in the facilitator cockpit and as a deliberation-summary post visible to all room members. Scheduling defaults are conservative — a deliberation that gets a daily health report becomes a scoreboard, regardless of intent.

### Work required

- Define each diagnostic with a precise structural specification — what counts as "stalled," what threshold marks a premise as "load-bearing," what window defines "recent activity." Specifications are in the eval harness's manifest generator (single source of truth for ground-truth metrics, including diagnostics).
- Build the analysis prompts that translate structural metrics into facilitation-useful natural language. The prompts must not editorialize — they describe the structural fact and (when appropriate) the typical interpretation, without prescribing action. "This claim has 6 supports and no attacks. In the corpus, claims with this support-to-attack ratio are typically either widely accepted or insufficiently engaged" is acceptable; "this claim is under-challenged and should be re-examined" is not.
- Integrate with the facilitator cockpit (Phase VI of the main platform) so diagnostics are available in the facilitation workflow.
- Build the per-room governance controls: enabling each diagnostic category, configuring thresholds, enabling scheduled reports, controlling visibility tiers within the room.
- Wire the false-positive scorecard into the eval harness (already specified in the harness workstream): diagnostics are tested against deliberations known to be healthy (no false alarms) and against deliberations with seeded structural problems (true positives).

### Validation signal

- *Mechanical:* false-positive rate against the healthy-corpus subset stays below a defined threshold; true-positive rate against the seeded-problem subset stays above a defined threshold. Both numbers are part of the eval harness regression suite.
- *Behavioral:* facilitators using diagnostics identify and act on structural problems earlier than facilitators not using them (measured via a cohort study, not via self-report). Deliberations show higher CQ engagement rates and lower stale-obligation counts after diagnostic adoption.
- *Misuse-drift signals (negative validation):* if the platform begins receiving requests to add per-participant scoring, or if facilitator-only equity views are being used to single out individual participants in moderation actions, the diagnostic design has drifted toward surveillance and the audience-and-visibility rules need revisiting. These signals are explicitly monitored.

### Risk

Low-medium. Diagnostics are advisory and non-mutative, so the technical risk is contained. The social risk — that the diagnostics drift into a surveillance, scoreboard, or moderation surface — is the real concern, and it is addressed structurally (by what is computed, exposed, and to whom) rather than by relying on user discipline. The "what is deliberately not computed" list is the design's main defense; weakening it is a principle-level decision, not a feature change.

---

## Cross-Cutting Workstream — Evaluation Harness

**Why this is its own workstream.** Each phase has its own validation signal, but those signals share infrastructure: a fixed corpus of deliberations, ground-truth manifests extracted mechanically from the graph, scorecards that compare LLM output against those manifests, and a regression-test loop run on every model upgrade and payload schema change. Without a shared harness each phase reinvents its evaluation, drift between phases goes undetected, and silent quality regressions on model bumps (Claude/GPT version upgrades) become unnoticeable until they cause a user-visible failure. Treating evaluation as a first-class deliverable — not an afterthought attached to each feature — is the only way the fidelity guarantees stated in Phases 1, 3, and 5 are actually enforceable over time.

**Scope of the harness:**

- *Corpus management.* A versioned, curated set of 20–40 real deliberations (with author consent and any necessary anonymization) spanning size tiers (small / medium / large), topology classes (single-hub / multi-hub / deeply nested / heavily retracted), and activity states (active / stalled / resolved). Plus a small set of deliberately adversarial synthetic deliberations targeting known failure modes (co-equal hubs, near-duplicate claims, cascading retractions). The corpus is versioned because the deliberations themselves evolve; eval runs are pinned to a specific corpus version.

- *Ground-truth manifest generation.* For each corpus deliberation, mechanically extract the structural manifest: hub set with multiplicity, ranked load-bearing premises, exhaustive open-CQ list, strongest counter per top-level argument, list of stalled threads, grounded-vs-defeated argument lists, attack/support neighborhoods. Manifests are recomputed when the corpus version changes, never hand-edited. This is the contract: the harness believes the graph, not the LLM.

- *Scorecards per phase.*
  - **Phase 1 (briefing fidelity):** hub-set precision/recall, load-bearing premise identification accuracy, open-CQ recall, hallucinated-structure rate (the most important metric — confident misstatements are scored more harshly than omissions), calibrated-uncertainty score on ambiguous topologies.
  - **Phase 2 (authoring assistance):** scheme-suggestion accuracy against a labeled set, weakest-premise identification agreement with structural ground truth, evidence-premise alignment detection (precision/recall on synthetically misaligned drafts), assumption-surfacing recall against expert-annotated implicit warrants.
  - **Phase 3 (move composition):** protocol validity (must be 100%), correctness of consequence preview against sandbox diff (preview must not understate consequences), staleness fingerprint behavior on adversarial timing scenarios, attribution-trace completeness.
  - **Phase 4 (discovery):** retrieval quality on labeled cross-context relations, plus the privacy-side validation (membership-inference resistance, score-distribution opacity) which is run as a separate adversarial eval.
  - **Phase 5 (diagnostics):** false-positive rate against deliberations known to be healthy, true-positive rate against deliberations with seeded structural problems.

- *Adversarial eval set.* A small, separately maintained set of inputs designed to probe known failure modes: co-equal hubs (does the briefing collapse them?), highly polarized graphs (does the LLM pick a side?), near-duplicate claim text across rooms (does discovery surface the right one?), retraction cascades (does the staleness check catch them?), prompt-injection content embedded in claim text or evidence (does the LLM follow malicious instructions from corpus content?). Adversarial cases are not weighted into the main scorecard; they are pass/fail gates.

- *Regression loop.* The harness runs on:
  1. Every model version change (new Claude/GPT release, new fine-tune, new prompt revision).
  2. Every payload schema change to the briefing endpoint or any MCP tool whose output the LLM consumes.
  3. Every prompt template change.
  4. Scheduled weekly runs as drift detection independent of code changes (catches model-provider silent updates).
  
  Results are diffed against the prior baseline. Any score regression beyond a defined tolerance blocks the change from shipping; any pass/fail gate flip blocks unconditionally.

- *Human-eval supplement.* Mechanical scorecards cover what can be checked against ground truth. A smaller human-eval rubric covers what cannot: usefulness of briefings to actual users, perceived quality of stress-test feedback, clarity of consequence previews. Human eval runs at lower frequency (per-phase milestone, not per-change) and is calibrated against the mechanical scores so divergence between the two is itself a signal.

**Operational requirements:**

- The harness is part of CI for any change touching the AI surface (prompts, tools, payloads, model selection). Not a separate batch job that someone has to remember to run.
- Eval results are written to a queryable history so trends are visible — not just pass/fail at the moment of change.
- Corpus and manifest generation code is open-source alongside the rest of the platform, so external auditors can verify the harness measures what it claims to measure.
- Any LLM-powered feature that ships without a corresponding scorecard entry is a release-blocking bug, not a documentation gap.

**What this workstream produces:**

- A shipped, maintained eval harness (corpus, manifest generator, scorecards per phase, regression runner, history store).
- A documented set of fidelity / quality / safety thresholds per phase, with explicit rationale for each threshold value.
- A standing review process for re-tuning thresholds as the platform learns where they are too loose or too tight.

**Sequencing.** The harness is built incrementally alongside the phases, but its foundational pieces (corpus, manifest generator, Phase 1 scorecard) must exist before Phase 1 ships, because Phase 1's fidelity claims are unverifiable without them. Subsequent scorecards land with their respective phases. The "every model bump runs the suite" loop is operational from Phase 1 onward; without it, Phase 1's fidelity guarantees decay invisibly the first time a model provider pushes a silent update.

**Risk if skipped or deferred:** This is the single highest-leverage cross-cutting investment. Skipping it means every fidelity, validity, and safety claim made in Phases 1–5 is asserted rather than enforced — and the platform loses the ability to detect quality regressions until users encounter them. The cost of building the harness is a fraction of the cost of debugging a quietly-broken Phase 3 deployment after the fact.

---

## Cross-Cutting Workstream — MCP Write-Path Failure Modes

**Why this is its own workstream.** The MCP write path already works end-to-end (the caffeine argument demonstrated it), but the existing path has not been stress-tested against the failure modes an LLM client will reliably produce: structurally invalid arguments, schema-mismatched outputs, evidence attached to the wrong premise, premises that don't entail the stated conclusion under the selected scheme, partially-completed multi-step authoring sequences, and so on. The platform needs a single, documented position on what the API does in each case — strict rejection vs. lenient acceptance vs. quarantine — because every downstream phase consumes the write path and inconsistent behavior across endpoints will be impossible to debug.

**Position: strict-by-default with a documented quarantine state, no silent leniency.**

The deliberation graph is the source of truth for every other surface (UI, embeds, knowledge base, Plexus). Allowing malformed or under-validated arguments into the graph corrupts that source of truth in ways that propagate through every consumer. The cost of strictness — occasional LLM retries, more verbose error responses — is small compared to the cost of a graph that quietly contains structurally invalid arguments.

### Failure mode taxonomy

**1. Schema-level malformation** (wrong field types, missing required fields, extra fields, malformed identifiers).

- *Behavior:* Strict 4xx rejection with a structured error payload that names the violated constraint precisely. The error must be machine-actionable so the LLM can retry without human intervention.
- *Rationale:* Schema validation is mechanical; there is no signal value in accepting a malformed payload.

**2. Reference integrity violations** (claim/argument/scheme/evidence ID does not exist, has been retracted, or is not visible to the requesting user).

- *Behavior:* Strict 404/409 rejection. Distinguish "does not exist" (404) from "exists but you cannot see it" (treat as 404 to avoid existence leakage — see Phase 4 privacy model) from "exists but in incompatible state" (409 with the conflicting state surfaced).
- *Rationale:* Stale references are the most common LLM error in long-running conversations and the easiest to detect and fix on retry.

**3. Scheme-structural violations** (argument claims a scheme but does not provide all required premises, provides premises that don't fill the scheme's required slots, or provides extra premises with no slot).

- *Behavior:* Strict rejection with the scheme's required slot list and a per-slot indication of which slots are filled, partially filled, or missing. Optionally include a suggested mapping of submitted premises to slots when the mapping is unambiguous.
- *Rationale:* Scheme structure is the contract that distinguishes a structured argument from a prose opinion. Accepting a scheme-tagged argument that doesn't fit the scheme defeats the scheme system.

**4. Inferential validity concerns** (premises don't obviously entail the conclusion under the scheme's inference rule; the argument would immediately fail a CQ check).

- *Behavior:* **Accept and post.** This is not a strictness case. The platform's job is to host arguments, not to pre-judge their inferential strength — that's what the dialogue protocol and CQs are for. Inferential weakness is challengeable content, not malformed content.
- *Rationale:* Distinguishing "doesn't follow" from "follows in a way the validator doesn't see" is exactly the disagreement deliberation exists to surface. Pre-rejecting weak inferences would have the API silently substitute its judgment for participants' judgment, which is the opposite of the platform's stance.

**5. Evidence-premise mismatch** (evidence attached to a premise it does not support; methodologically inappropriate evidence, e.g., correlational evidence on a causal premise).

- *Behavior:* **Accept with a soft warning surfaced in the response.** Mismatch is a Phase 2 stress-test concern, not an integrity concern. The argument is well-formed; the evidence quality is contestable.
- *Rationale:* Same as inferential validity — quality of fit is challengeable, not malformed. The soft-warning channel lets the LLM client choose to surface the warning to the user before posting (Phase 2 will do this) or to post anyway (other clients may have their own policies).

**6. Partial multi-step authoring** (LLM has called `propose_warrant` and `attach_evidence` but never called the final `commit_argument`; resources orphaned).

- *Behavior:* **Quarantine state**, not silent acceptance and not silent rejection. Partial authoring sessions are bound to a session ID with a TTL (initial proposal: 30 minutes); resources created in a session are visible only to the session owner until commit. On TTL expiry the session is garbage-collected and the orphaned resources are dropped. This is the one place where "lenient" behavior is appropriate, because the LLM client may legitimately need to reason between steps.
- *Rationale:* Treating partial authoring as immediate failure punishes legitimate multi-step composition; treating it as immediate success commits to a public graph state the user never confirmed. The session-scoped quarantine is the correct middle.

**7. Concurrency violations** (the graph state assumed by the write has changed since the LLM read it; e.g., the targeted argument has been retracted between read and write).

- *Behavior:* Strict 409 with the current state surfaced, plus the briefing fingerprint mechanism from Phase 3 staleness verification. The write path and the staleness check share the same fingerprint primitive — write-path concurrency is staleness verification at single-move granularity.
- *Rationale:* Optimistic concurrency with a structured conflict response is standard practice and lets the LLM client decide whether to retry, re-brief, or surface to the user.

**8. Authorship and attribution violations** (write claims `authorKind: HUMAN` from an MCP context, or claims attribution to a user other than the authenticated principal).

- *Behavior:* Strict rejection. The MCP authentication context determines the maximum claimable `authorKind` (MCP calls cannot post as `HUMAN` without an explicit human-confirmed flow); attribution to other users is rejected unconditionally.
- *Rationale:* Attribution is a load-bearing primitive for the entire commitment store and Plexus provenance system. There is no acceptable failure mode where attribution is wrong.

**9. Prompt-injection content in submitted argument text** (claim text or evidence annotation contains instructions targeting downstream LLM consumers).

- *Behavior:* **Accept the content as-is, sanitize at the rendering boundary.** Stripping or rewriting submitted text would be censorship of legitimate participant content (a participant may legitimately quote prompt-injection content in an argument *about* prompt injection). The defense is at the LLM consumption side: any LLM that reads claim/evidence text from the platform must do so through a prompt scaffold that treats the content as data, not instructions.
- *Rationale:* The platform stores arguments; it does not pre-filter participant speech. Defense belongs at the boundaries where participant content meets LLM execution, not at write-time.

### Cross-cutting requirements

- **Single error envelope.** All MCP write endpoints return errors in a uniform structured format: error class, machine-readable code, human-readable message, machine-actionable remediation hint, and (where applicable) the conflicting current state. No endpoint invents its own error shape.
- **No silent coercion.** The API never silently fixes malformed input. If a client submits "close enough" content, it is rejected with a precise diagnostic, not normalized into a guess at the intent. Silent coercion is the failure mode that produces unauditable graph state.
- **Idempotency keys on every write endpoint.** LLM clients retry on transient failures; without idempotency keys, retries produce duplicate arguments. Required for every write.
- **Quarantine state is observable.** Session-scoped resources from partial authoring are visible to the session owner and queryable by the system; they are not invisible debt that accrues silently.
- **Failure-mode telemetry feeds the eval harness.** Every rejection class is counted per model version and per prompt template. Spikes in a specific failure class on a model upgrade are an early signal of capability regression.

### Validation signal

- All nine failure modes have explicit test coverage; none silently accept malformed input.
- LLM clients can recover from every rejection class via retry without human intervention (verified by running the eval harness's authoring scenarios end-to-end).
- Zero instances of structurally invalid arguments in the production graph (audited continuously via the same manifest-extraction code that powers the eval harness).
- Quarantine TTL expiry never causes data loss for legitimate authoring sessions (measured by post-TTL "I lost my draft" support reports — target zero).

### Risk

Low-medium. Strict-by-default is the conservative choice and the cost is borne by the LLM client, not by the deliberation graph. The one nontrivial risk is overly aggressive scheme-structural rejection: if scheme slot definitions are too rigid, legitimate arguments will be rejected because they don't match the rigid template. Mitigated by treating slot definitions as a maintained artifact (the scheme catalog) reviewed alongside the eval harness rather than frozen at API design time.

---

## Cross-Cutting Workstream — Cost, Latency, and Degradation

**Why this is its own workstream.** The AI surface fans out across multiple LLM-consuming endpoints (briefings, sandbox previews, discovery, diagnostics) and multiple LLM-producing endpoints (authoring assistance, conversational moves). Each interaction has a token cost, a latency cost, and a degradation curve as deliberation size grows. Without an explicit budget and a defined degradation strategy, three predictable failure modes show up in production: (1) briefings become unusably slow on large deliberations, (2) cost-per-active-user climbs as deliberations grow and the platform becomes economically unviable, (3) the "quality at any size" promise of Phase 1 silently breaks at scale because the system was only ever tested on small graphs. The roadmap needs a defined position on each before features ship, not after.

### Cost budget

**Targeted per-interaction costs (initial values, tuned with data):**

- *Briefing (Phase 1, cached path):* < $0.01 per briefing for cached deliberations; cache hit rate target ≥ 80% on active deliberations.
- *Briefing (Phase 1, cold path):* < $0.05 for small/medium deliberations; large deliberations fall through to hierarchical mode (see degradation).
- *Authoring stress-test (Phase 2):* < $0.03 per draft review.
- *Move composition + consequence preview (Phase 3):* < $0.02 per move drafted; sandbox dry-run is a graph operation, not an LLM operation, so its cost is bounded by ASPIC+/Ludics recomputation rather than tokens.
- *Discovery query (Phase 4):* < $0.005 per query — discovery is retrieval-heavy and LLM-light by design (LLM used for query rewriting, not for ranking).
- *Diagnostics (Phase 5):* batch-scheduled; cost amortized per deliberation per analysis run rather than per query.

**Cost controls:**

- Per-user daily token budget across all AI features, with surfaced quota in the UI. Self-hosters set their own limits.
- Per-deliberation token budget so a single high-activity deliberation cannot exhaust shared quota.
- Hard backstop: any single interaction that exceeds 4× its target cost is aborted with a structured error rather than allowed to run unbounded.
- Cost telemetry per phase × model × deliberation-size bucket, surfaced alongside the eval harness scorecards so cost regressions on model changes are visible.

### Latency budget

**Targeted user-perceived latencies (p95):**

- *Briefing (cached):* < 500 ms (effectively a graph read).
- *Briefing (cold, small/medium):* < 4 s.
- *Briefing (cold, large, hierarchical):* < 6 s for the top-level briefing, with sub-region drill-downs streaming progressively.
- *Authoring stress-test:* < 5 s end-to-end. Faster than this is wasted (users compose for minutes); slower than this breaks the drafting flow.
- *Consequence preview + sandbox diff:* < 2 s. This sits between drafting a move and confirming it; latency above 2 s changes the UX from "preview" to "wait."
- *Discovery query:* < 1 s for the top-tier result set; cross-tier federation queries < 2 s.
- *Diagnostics:* not user-interactive; run on a schedule.

**Latency controls:**

- Streaming responses where the API supports it (briefings, stress-tests, discovery summaries). Time-to-first-token is part of the perceived-latency budget.
- Parallel fan-out for composite endpoints: the briefing endpoint queries its constituent tools in parallel where data dependencies allow, not serially.
- Sandbox dry-run uses the same evaluation engine as live posting; if live evaluation is too slow to fit a 2 s preview budget, that is a platform-wide performance problem, not an AI-feature problem — surfaced as such rather than papered over with a separate "fast preview" engine that would inevitably diverge.

### Caching strategy

**What is cached:**

- *Briefing payloads* keyed by deliberation ID + briefing fingerprint (the same fingerprint that drives Phase 3 staleness verification). Invalidated atomically on any state change that flips the fingerprint. Cache TTL is unbounded; the fingerprint is the cache key, so a hit is by construction current.
- *Structural manifests* (ground-truth hub set, load-bearing premises, open CQs) keyed by deliberation ID + graph version. Reused by briefings, the eval harness, and Phase 5 diagnostics.
- *Embedding vectors* for claim/argument text, persistent at the per-claim level; recomputed only on claim text revision.
- *Discovery query results* keyed by normalized query + requesting user's tier set, with short TTL (5 minutes) since the corpus shifts.

**What is not cached:**

- LLM completions themselves. Caching completions on prompt-hash is tempting but produces stale outputs when the underlying graph changes; the briefing-payload cache + fingerprint already gives the right invalidation semantics one level higher.
- Sandbox dry-run results. Each is graph-state-dependent and cheap to compute relative to the user's drafting time.
- Anything keyed by user identity that would create privacy leakage if shared (Phase 4 considerations apply to cache key design as much as to query design).

**Cache warming:**

- On any graph mutation, schedule a background re-briefing for the affected deliberation if it has had ≥ N active viewers in the last 24 hours. Most briefing requests on active deliberations are then cache hits.
- On Phase 5 diagnostic runs, manifests are recomputed and cached, so the next briefing request reuses them rather than recomputing.

### Degradation strategy for large deliberations

Phase 1 commits to "hierarchical or explicit decline" rather than silent degradation. Concretely:

**Size tiers (initial thresholds, calibrated against the fidelity scorecard):**

- *Small:* ≤ 20 arguments. Full briefing in a single LLM call against the complete payload. Fidelity scorecard expected to be at or near ceiling.
- *Medium:* 20–80 arguments. Full briefing in a single call against a compressed payload (the briefing endpoint elides leaf-level details and ranks the included content by structural importance). Fidelity scorecard expected to remain within tolerance.
- *Large:* 80–250 arguments. Hierarchical mode. Step 1: an extractive pass identifies the deliberation's sub-regions (clusters around major hubs). Step 2: a top-level briefing summarizes the inter-region structure. Step 3: per-region briefings are computed lazily on user request. The top-level briefing must explicitly tell the user the deliberation is in hierarchical mode and offer the drill-downs.
- *Very large:* > 250 arguments. Hierarchical mode plus an explicit "this deliberation is unusually large; the briefing summarizes top-level structure only" disclosure. Sub-region drill-downs available; full graph-level briefing not offered, because the eval harness shows fidelity cannot be sustained at that size.

**Degradation principles:**

- Never silently truncate the input to fit a context window. Either the payload fits the model's effective context (not its raw context — effective context for fidelity is smaller), or the request degrades to a defined mode with explicit user disclosure.
- Tier thresholds are calibrated against the fidelity scorecard, not against context-window math. Where the scorecard says quality drops, the tier boundary moves regardless of what the model can technically ingest.
- The user is always told which tier they are in. "You are looking at a hierarchical briefing because this deliberation has 142 arguments" is acceptable; quietly returning a worse briefing is not.

### Self-hosting considerations

- The platform is self-hostable, and self-hosters may run smaller or local models. The cost/latency budgets above assume a frontier model class; self-hosters running smaller models must explicitly accept reduced fidelity scorecard performance.
- The eval harness runs against whatever model the deployment is configured to use. A self-hosted deployment with a smaller model gets the same fidelity report; whether the resulting scores meet the deployment's needs is the operator's decision, made with data.
- LLM-feature toggles per phase so self-hosters can disable any AI phase whose cost or fidelity profile doesn't match their context.

### Validation signal

- Cost per interaction stays within budget across the eval corpus, including the large-tier deliberations. Cost regressions on model upgrades are detected by the harness.
- p95 latencies meet targets on production-representative load.
- Cache hit rate on briefings ≥ 80% for active deliberations; lower hit rates trigger investigation of fingerprint churn (a sign that briefings are being invalidated unnecessarily).
- Fidelity scorecard performance is consistent across tier boundaries — i.e., medium-tier briefings don't show a quality cliff vs. small-tier, and hierarchical large-tier briefings show graceful degradation rather than a step drop.

### Risk

Medium if deferred. Cost overruns and latency cliffs are the most common reasons consumer-facing AI features fail commercially after they ship — and they fail in ways that are hard to walk back once integrated into user workflows. The degradation strategy in particular is the kind of decision that is cheap to make upfront and expensive to retrofit, because "we'll just summarize harder on large deliberations" is exactly the silent-degradation failure mode the Phase 1 fidelity work exists to prevent.

---

## Sequencing Rationale

The phases are ordered by increasing commitment store risk and decreasing reversibility. Phase 1 (read-only) has no mutation risk and immediately validates whether the existing MCP payloads are sufficient. Phase 2 (authoring assistance) mutates the graph but only with explicit human confirmation and authorship. Phase 3 (conversational participation) introduces the hardest design problem — formal moves through an informal interface — and should only ship once Phases 1 and 2 have established user trust and surfaced edge cases. Phases 4 and 5 are parallel workstreams that can begin once Phase 1 proves out the read path.

---

## Architectural Principles

The roadmap is organized around three architectural principles that constrain every phase. They are stated together because they interact: each principle prevents a failure mode the other two do not address, and dropping any one of them weakens the whole stack.

### Principle 1 — The LLM is a client, not an extension, of the deliberation engine

Every LLM action must be expressible as a sequence of MCP tool calls against the existing API. If a phase requires new capabilities, those capabilities are added to the API and MCP layer first, then consumed by the LLM — never built as LLM-specific features that bypass the deliberation engine. This ensures that every other client surface (web UI, embeddable widgets, browser extension) benefits from the same capability additions, and that the deliberation graph remains the single source of truth for all consumers. The MCP write-path failure-mode workstream operationalizes this principle on the write side; the briefing endpoint and shared evaluation engine operationalize it on the read side.

### Principle 2 — AI is epistemic infrastructure, not an epistemic agent

The LLM surfaces, connects, translates, and stress-tests; it does not argue on anyone's behalf or post positions that don't have a human behind them. The `authorKind` distinction (`HUMAN` / `HYBRID` / `AI`) is the data-model expression of this principle: every contribution carries provenance, and the platform never silently inserts unattributed reasoning into the deliberation graph. The principle forecloses several otherwise-tempting features (auto-generated counterarguments to keep deliberations "active," LLM-driven steelmanning that posts under a synthetic identity, autonomous agents that file moves on a schedule), and it does so deliberately: a deliberation populated with positions nobody holds is theater, and the commitment store loses its meaning when commitments cannot be traced to a human who holds them.

### Principle 3 — LLM-mediated authorship and continuity of position

The third principle addresses a problem the first two do not: even when every action is a client call (Principle 1) and every contribution is attributed (Principle 2), an LLM that helps the same user across multiple drafts and moves can quietly produce a continuity-of-position the user does not actually hold. If an LLM helps a user draft an argument at T0, then later helps the same user respond to a challenge against that argument at T1, the LLM has two options: (a) carry over its prior reasoning trace and produce coherent follow-on positions, or (b) treat each interaction independently and risk producing positions inconsistent with what the user previously committed to. Both options have failure modes. (a) silently authors a continuity-of-position that the user may not actually hold and may drift away from the user's view over time; (b) produces incoherent runs of contributions that nominally come from one person.

The platform's commitment is to neither of those defaults. Specifically:

- **The user's commitment store is the source of truth for continuity, not the LLM's prior context.** When an LLM assists a user with a new contribution, the canonical context is the user's recorded commitments in the deliberation graph — not the LLM's memory of past sessions. This is what the commitment store exists for; using LLM session memory as an alternative continuity mechanism would silently substitute the LLM's model of the user for the user's own recorded positions.
- **Stateless by default.** LLM-assisted authoring sessions do not carry private context across sessions. Each session loads from the commitment store, the briefing fingerprint, and the targeted region of the graph; nothing else. If a user wants the LLM to recall a prior session's reasoning, they must explicitly opt in, and the opted-in context is itself recorded in the move's attribution trace (Phase 3 safeguard layer 5).
- **Position drift detection.** When an LLM helps a user compose a contribution that contradicts a position they have already committed to in the graph, the contradiction is surfaced — the same way the commitment-store consistency check surfaces self-contradiction for human-authored moves. The user can resolve it (retract the prior commitment, edit the new one, or proceed and accept the contradiction) but cannot avoid the surface.
- **Attribution of LLM authorship lineage.** Where an LLM helped draft both an original argument and a later defense of it, the attribution trace (Phase 3 layer 5) records that linkage, so a participant or facilitator can see when LLM-assisted continuity is in play. This is not an accusation — `HYBRID` authorship is legitimate — but it is information other participants are entitled to.
- **No cross-user LLM memory.** An LLM helping user A never has access to private context from sessions with user B, regardless of whether those sessions occurred in the same deliberation. The MCP authentication context binds session memory to the authenticated principal.

**Why this is its own principle.** Without it, Principles 1 and 2 are insufficient. Principle 1 ensures every action goes through the API; Principle 2 ensures every action is attributed. Neither prevents an LLM from quietly producing a coherent body of contributions that drift from the human's actual view over time, with each individual contribution properly attributed and properly API-mediated. Continuity belongs to the human and is recorded in the commitment store; the LLM is a tool the human picks up at each interaction, not a stable representative of the human across interactions.

---

