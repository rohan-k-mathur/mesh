# Ludics Usefulness Brainstorm — Question Deck

**Companion to:** [LUDICS_SYSTEM_ARCHITECTURE.md](../LUDICS_SYSTEM_ARCHITECTURE.md)

**Purpose.** Anchor a series of brainstorm sessions on how to make the Ludics
subsystem useful and actionable for Isonomia / Mesh as a whole. The architecture
doc tells us *what we have*. This deck asks *what it should do for the
platform*.

**Method.** Six question clusters (A–F), staged diagnostic → mapping → generative
→ scoping. Run as four rounds (see "Suggested Format" at end). Each cluster
should produce a small written artifact (a one-pager, a candidate list, or a
decision); the goal of the full series is to converge on one or two concrete
Ludics-facing features for the next phase, with explicit success criteria.

**Background frame.** Ludics has to earn its keep on a platform that already
ships ASPIC+ grounded extensions, Walton schemes with critical questions, a
typed dialogue protocol with commitment stores, and Dempster–Shafer evidence
aggregation. The brainstorm has to surface what is *uniquely* Ludics — and
where Ludics is doing the same work as some other layer more expensively, that
needs to be named honestly too.

---

## A. Diagnostic — what is Ludics *for*, on this platform?

1. **What does Ludics tell us that ASPIC+ cannot?** Where does game-theoretic
   interaction give an answer that grounded-extension semantics does not — or
   gives the same answer more cheaply, or with better provenance?
2. **What does Ludics tell us that the dialogue protocol cannot?** The
   protocol already enforces obligations and tracks moves. What does modeling
   those moves as polarized acts in a design add on top?
3. **Which Ludics primitives are load-bearing for the platform's value
   proposition, and which are theoretical scaffolding we have built but do not
   need to expose?** Loci, designs, acts, traces, chronicles, behaviours,
   orthogonality, daimon, virtual evaluation, DDS strategies, delocation, AIF
   bridge — for each, is there a user-facing affordance, or is it
   infrastructure-only?
4. **Where is the "killer readout"?** If we could ship one Ludics-derived
   number, badge, or visualization that nothing else on the platform produces,
   what would it be? (Candidates from the architecture: convergence verdict,
   decisive-position heatmap, turning-move indicator, bottleneck locator,
   strategy comparison, orthogonality witness.)

---

## B. Mapping Ludics onto existing surfaces

5. **Deliberation page.** What Ludics-derived signals belong on the
   contested-frontier and synthetic-readout views? Could Ludics
   convergence/divergence directly inform the `standing` classification
   (`tested-survived`, `tested-attacked`, etc.) rather than sitting beside it?
6. **Argument permalink / embed.** Is there a Ludics-native confidence or
   standing badge that should ship on the social card, alongside ASPIC+
   standing?
7. **Plexus transport.** Cross-room delocation is *literally* a Ludics
   operation. Does this mean Ludics should own the transport semantics —
   confidence gating, fingerprinting, provenance preservation — rather than
   being a parallel evaluator?
8. **Living Thesis / Attack Register.** Could "where the thesis is exposed" be
   expressed as Ludics decisive positions — i.e., the loci where Opponent has
   a winning continuation?
9. **Facilitation cockpit.** Facilitators need to know where the deliberation
   is stuck, who needs to speak, and which move would unblock the discussion.
   Could "bottleneck loci" and "turning moves" become facilitator-facing
   nudges?
10. **AI-Epistemic Primitive / MCP surface.** What read tools should expose
    Ludics state to model agents? (`get_strategic_landscape`,
    `find_decisive_loci`, `simulate_continuation`, `check_orthogonality` …)
    What write tools, if any?
11. **Article reader rhetoric overlays.** The article system already overlays
    rhetorical strategies. Could a Ludics overlay surface argumentative
    *position* — which paragraphs are decisive, which are bottlenecks, which
    are loci with no Opponent response?

---

## C. The DDS layer specifically

12. **What does the strategy/design isomorphism *buy* a user?** If a
    deliberation can be viewed as a set of innocent strategies, is there a
    comprehension or planning artifact ("here is my plan to defend X") that
    emerges naturally, and would communities use it?
13. **Is DDS a tool for the *author* (planning a defense) or for the *analyst*
    (post-hoc evaluation)?** These are very different products. Which one are
    we actually building toward?
14. **Should DDS power "what-if" / virtual evaluation as a first-class user
    feature** — a sandbox where a participant can try moves against the
    current strategic landscape before committing to a real dialogue move?

---

## D. The user-facing translation problem

15. **What is the user-facing vocabulary?** Ludics terms → platform terms.
    "Design" → ? "Convergence" → ? "Daimon" → "I concede"? "Locus" →
    "address" / "reason slot"? "Behaviour" → ?
16. **Which Ludics outputs can be rendered as a single glanceable widget**,
    and which require a full panel? (Spectrum from a badge → a chip with
    hover → a sidebar → a dedicated view.)
17. **What is the minimum theoretical literacy required to act on a Ludics
    readout?** If the answer is "more than zero," what does the onboarding
    flow look like, and is that acceptable for a feature that aims for
    community use?

---

## E. Pipelines and unlocks (generative cluster)

18. **What deliberation outcomes become *computable* with Ludics that were
    previously qualitative?** Candidates: "this thread is determined," "this
    thread will not resolve without new evidence on locus L," "Proponent has
    no winning strategy from here," "this argument has a unique winning
    continuation."
19. **Which moderation / facilitation decisions could be partially automated
    by Ludics signals?** (E.g., "this thread should be closed: it is divergent
    and no new loci have been opened in N moves.")
20. **Are there *new artifacts* Ludics can mint?** E.g., a "strategy document"
    (the Proponent's winning plan as a navigable structure), a "concession
    map" (the points at which each participant has yielded), a "bottleneck
    registry" (loci across the platform that block multiple deliberations).
21. **Are there *new participant roles*?** A "strategist" who plans defenses,
    a "decoder" who reads strategic landscapes, a Ludics-aware AI assistant
    that proposes moves at decisive loci.
22. **Cross-deliberation Ludics.** The Plexus connects rooms. Could a
    Ludics-derived signal answer "which deliberations across the network are
    blocked on the same locus" — i.e., shared bottlenecks worth resolving
    once for the whole graph?

---

## F. Scoping and success criteria

23. **What is the minimum Ludics-derived value that would justify the Phase 5
    (behaviours/saturation) and Phase 6 work currently in progress?** If we
    shipped only one user-facing Ludics feature in the next quarter, which one
    would carry the most weight?
24. **What is the right relationship between the Ludics readout and the
    ASPIC+ readout?** Co-equal? Ludics as a refinement of ASPIC+? ASPIC+ for
    "is this argument in?" and Ludics for "is this *position* decided?"
25. **What is the failure mode we are most worried about?** That Ludics
    produces sophisticated readouts no one looks at? That its outputs are
    interpreted as more authoritative than they should be? That it duplicates
    ASPIC+ at higher cost? Each failure mode suggests different guardrails.
26. **What would we measure six months after shipping a Ludics-facing feature
    to know it earned its place?** Engagement with the readouts? Citation of
    Ludics determinations in pathway packets? AI agents calling Ludics MCP
    tools? Facilitators acting on bottleneck signals?

---

## Suggested format

- **Round 1 (A + B):** For every existing surface, name whether Ludics belongs
  there. Most answers will be "no" — that's the point. The "yes" answers
  become the candidate list.
- **Round 2 (E):** For each "yes" surface, generate 3–5 concrete
  artifacts/widgets/tools Ludics could produce there.
- **Round 3 (C + D):** Pressure-test the candidates for translation cost and
  for whether DDS specifically is doing any work.
- **Round 4 (F):** Cut. Pick one or two features for the next phase. Define
  what success looks like.

---

## Session log

| # | Date | Cluster(s) | Output |
| --- | --- | --- | --- |
| 0 | 2026-05-16 | Conceptual prelude | [LUDICS_GENERATIVE_SUBSTRATE.md](./LUDICS_GENERATIVE_SUBSTRATE.md) — eight-region terrain map of Ludics as a *generative* substrate (designs, orthogonality, behaviours, saturation, DDS strategies, multi-agent polarity, delocation, cut algebra), plus three opening theses. |
| 0a | 2026-05-16 | Conceptual | Folded into [LUDICS_GENERATIVE_SUBSTRATE.md §6 Resolution](./LUDICS_GENERATIVE_SUBSTRATE.md#resolution--session-0a-2026-05-16). Refined the multi-agent polarity question into a four-reading spectrum (A–D), **committed to Reading C** (anonymous-behaviour Opponent), and articulated the **dialectical/witnessing separation** (T4) as the architectural reason Reading C is affordable. T3 superseded by T3′ (anonymous polarity). T5 added as a cross-cutting reminder to develop every subsequent session with the MCP/AI-agent consumer in view. |
| 0b | 2026-05-17 | Conceptual | [LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md](./LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md) — formalized the instantiation operation $\iota$ with four invariants (records-only, idempotent, locus-injective, total modulo extension); gave first-pass precise definitions of the **exposure map** ($\sigma(D_P)^\perp$ stratified walked/witnessable/latent + topology + propagation), **articulation lattice** ($\mathsf{Art}(B)$, identified as the Ludics-native Ambler hom-set), and **witnessing record** (anonymous-by-default metadata relation); proposed the first Ludics-native MCP read surfaces; scoped-but-deferred the **announcement discipline** behind the §2 MCP tools. |
| 0c – 0e | 2026-05-17 | Conceptual | [LUDICS_OPEN_COMPOSITION_JOINT.md](./LUDICS_OPEN_COMPOSITION_JOINT.md) — **0c (open behaviours)**: time-indexed directed system $\{\mathsf{Art}(B_t)\}$ with partial transition maps; three openness levels (carrier / loci / orthogonality); stable-core, fragile-membership, lost-articulations, fossil-witness reads. **0d (composition algebra)**: three operators (subordination, transport, federation); Ambler-arrow composition lifts to articulation-lattice convolution; exposure-map composition requires re-saturation; $\iota$ and $\mathsf{Witness}$ compose by structural reconciliation. **0e (joint saturation)**: $\sigma_{\mathrm{joint}}(D_P, \mathsf{Witness})$ as protocol-rule forward-closure over participation; three properties (J1–J3); drained-latent-stratum as the formal "progress" reading. |
| Literature review | *next* | Research | External cross-check of the substrate's claims against current Ludics, argumentation, and computational-deliberative-democracy literature; deliverable a referenceable resource for continued brainstorming. |
