Isonomia — Follow-up Task List
Derived from review of Institutional Pathways (Scope A · WS1) and Facilitation features (Scope C). Grouped by surface, ordered roughly by impact-to-effort. Each item is scoped to be a discrete PR or spec-line change.

Institutional Pathways
1. Minimum-n threshold for public latency metrics
Problem: /institutions/[id] surfaces median ack and median response latency unconditionally. Medians over n=1–2 pathways are noise, and publishing them creates an incentive for institutions to game early pathways.
Task:

Add a MIN_PATHWAY_HISTORY_N constant (start at 3, make it tunable).
Below threshold, replace numeric displays with an "insufficient history" state (e.g., "< 3 closed pathways — latency not yet reported").
Keep the underlying metric computed server-side so it becomes visible the moment threshold is crossed.
Add a unit test covering the n=0, n=1, n=2, n=3 boundary transitions.

2. Discourse-object mutation warnings in PacketBuilder
Problem: Packet items reference (targetType, targetId) against claims / arguments / cards / notes. Between DRAFT_OPENED and SUBMITTED, the underlying object can be retracted or edited. Snapshot-on-submit covers post-submission, but authoring-time drift is currently silent.
Task:

Spec the authoring-time contract: drafts should soft-warn (not block) when a referenced object has been retracted, edited after referencing, or had its target type change.
Add a staleReferenceWarning field to the PacketItem render path.
Surface in PacketBuilder UI as an amber chip on the affected row ("claim edited after referenced — review before submit").
On POST /api/pathways/[id]/submit, include the live warning set in the submission audit record so the facilitator's acknowledgement of warnings is itself chained.

3. Response coverage bar color semantics
Problem: The 0→100% disposition coverage bar in Response Intake runs green→yellow→orange. 100% reads as a warning state to an untrained eye, which inverts the intended signal (complete coverage is the good outcome).
Task:

Change the gradient to a monotone emerald ramp (light emerald at 0% → saturated emerald at 100%), or if a dual-signal is wanted, encode missing items separately from completed items rather than shading completion orange.
Verify color-blind accessibility on the new ramp (protanopia/deuteranopia — emerald monotone should be safe but worth a quick check in the a11y pass).

4. Pathway terminology audit
Problem: "Pathway" is load-bearing in Institutional Pathways (outbound institutional channel) but is used more loosely in other surfaces and docs. COMMA reviewers and CS&S reviewers will read carefully; ambiguity on a core term is avoidable friction.
Task:

Grep the codebase, docs, and landing pages for "pathway" / "Pathway" and flag any non-institutional uses.
Reserve the capitalized term for the institutional lifecycle object; rename looser uses (e.g., "flow," "track," "route" depending on context).
Add a one-line glossary entry to the platform overview doc pinning the definition.


Facilitation (Scope C)
5. Split dashboard into Author mode and Monitor mode
Problem: The single Dashboard tab combines question editor, clarity checks, equity metrics, event stream, and interventions. During a live session, that's too much in the facilitator's attention budget; the question editor is primarily a pre-session / inter-round artifact while equity + interventions are the live-monitoring pair.
Task:

Introduce a mode toggle (Author ↔ Monitor) on the Dashboard header, defaulting based on session state (draft question → Author; locked question + open session → Monitor).
Author mode foregrounds the Question editor and clarity-check output; collapses equity/interventions into a summary strip.
Monitor mode foregrounds equity metrics + pending interventions + event stream tail; collapses the question editor to a read-only header chip.
Persist the user's last manual override in localStorage so a facilitator who prefers the combined view can keep it.

6. Disambiguate latency units
Problem: "Median response latency 140M" on the Equity surface reads as "140 million" at a glance. If the unit is minutes, the rendering is ambiguous.
Task:

Standardize the latency formatter: 140 min for < 24h, 1.2 d for ≥ 24h, 3.4 wk for ≥ 14d. Match the Institutional Pathways median ack 1.0d convention.
Apply the formatter wherever latency is rendered (dashboard, equity tab, final report's "Final metrics" block, institution profile).
Add unit tests for the boundary cases (59m, 60m, 23h 59m, 24h, 13.9d, 14d).

7. Surface active question-type rule set
Problem: The question-type dropdown ("Evaluative", etc.) silently changes which clarity-check rules fire. The rule set should be visible so facilitators and observers understand why certain warnings appear.
Task:

Add a rule-set preview line under the type dropdown: "type: Evaluative — applying framing load, normative scope, time-bound checks."
On hover/click, expand to the full rule list for that type with one-line descriptions.
Document the full type → rules mapping in the facilitation spec so it's reviewable without reading source.


Cross-cutting
8. Shared-vocabulary glossary pass
Bundle with task 4. Before CS&S submission and COMMA outreach, produce a single-page glossary covering: Pathway, Packet, Disposition, Session, Intervention, Chain, Snapshot, Clarity check. Each entry: one-sentence definition + which scope it lives in + a link to the canonical component. This reduces reviewer friction and lets you cite the glossary in the application narrative instead of re-defining terms inline.
9. Accessibility sweep on new color semantics
Bundle with task 3. Once the coverage bar is re-ramped, run a quick pass on all new status colors introduced in these two surfaces (disposition pills, chain-validity badges, equity metric cards, intervention-kind dots) against WCAG AA contrast and the three common color-vision deficiency filters. The chain-verified/mismatch pairing in particular should be verifiable by shape or icon, not color alone.

Suggested ordering

Quick wins (hours): 3, 6, 4 — pure polish, no spec changes.
Spec + small build (days): 1, 7, 8, 9.
Larger build (a week or so): 2, 5 — both touch the data model or a major layout, worth their own PRs with design review.