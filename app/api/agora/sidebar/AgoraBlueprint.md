Below is a clean‑room, from‑scratch portrait of an **ideal digital Agora & discourse platform**—designed for scholars, writers, researchers, journalists, civically engaged people, and the simply curious. It’s intentionally unconstrained by what exists today. Think of it as a reference design: the end‑state North Star we can build toward.

---

## 0) One‑line purpose

> **A public thinking space where evidence, arguments, and decisions live together—searchable, verifiable, remixable, and enjoyable to inhabit.**

---

## 1) Principles (the spine)

1. **Truth with memory** — Every public claim carries its provenance: sources, counterarguments, and the path by which people accepted or rejected it. Nothing is “just asserted.”
2. **Delightful rigor** — Structure helps (claims, warrants, critical questions), but never at the expense of flow. Users write like humans; structure emerges with assistive tools.
3. **Verifiability by default** — Quotes are exact, sources are hash‑fingerprinted and archived, decisions come with receipts. Retractions propagate.
4. **Pluralism, not winner‑takes‑all** — Multiple viewpoints can coexist and be compared; consensus (if any) is a *layer*, not a deletion of dissent.
5. **Actionable, not performative** — Discussions funnel toward outcomes: accepted results, bounties, replications, policy choices, next steps.
6. **Interoperable and portable** — You can export everything (CSL JSON, Graph/CSV, Markdown, W3C Annotations). The Agora is part of the open web.
7. **Humane incentives** — Reward carefulness, citations, synthesis, and steel‑manning. Downrank dunking and eristic tactics.

---

## 2) The three planes (mental model)

* **Source Plane** — Library of works: papers, datasets, code, posts, videos. You can annotate, quote, cite, and archive.
* **Discourse Plane** — Structured debates and commentaries: claims, reasons, challenges, counterexamples, questions. Rich but ergonomic.
* **Decision Plane** — Epistemic and practical outcomes: “accepted here,” votes, panel confirmations, replications, retractions. Every outcome has a **receipt**.

A **knowledge graph** ties the planes together: Sources ↔ Claims ↔ Decisions.

---

## 3) Core objects (first‑class citizens)

* **Work**: any citable artifact (paper, post, dataset, code repo, video). Stored with CSL‑style metadata, snapshots, and a content fingerprint.
* **Claim**: atomic, quotable proposition with context tags and versioning (states: *hypothesis → in review → corroborated / contested → retracted*).
* **Evidence**: a link from Claim to (Work or Quote), with a locator and an exact excerpt hash. Evidence can support or undercut.
* **Move**: a typed discourse act (e.g., Assert, Why?, Grounds, Challenge, Concede) with optional locus threading for nested replies.
* **Thread**: a linear view over moves (for familiarity), always backed by the structured graph.
* **Decision**: an outcome with rationale and inputs (sources, addressed questions), encoded as a **Receipt**.
* **Bounty/Call**: “we need X” (replication, source, synthesis); routes attention and offers recognition or rewards.
* **Persona**: user identity enriched with expertise fields, affiliations, disclosures, and optional verified credentials.
* **Space**: a deliberation room tied to a host (article, event, question). Defines rules (open/panel/cohort), visibility, and moderation.

Each object has a stable **URN** (e.g., `urn:agora:claim:…`, `urn:agora:work:…#p=13`) so cross‑links are precise and durable.

---

## 4) The home: **Agora Lobby**

A live, information‑dense page that blends a newsfeed with a conference foyer.

* **Now**: a real‑time stream of *events* (new claims, citations, challenges, receipts, votes).
* **Filters**: discipline, topic, method, time window, “your follows.”
* **Rails**:

  * *Active votes* (with countdowns).
  * *Calls for input* (missing roles).
  * *Accepted recently* (with receipts).
  * *Navigator* (backlinks and cross‑debate threads for the selected card).
* **Cards**:

  * *Move card*: “Why?” or “Grounds” with a one‑sentence context and quick “Reply” or “Lift to claim.”
  * *Citation card*: shows the source (formatted), the quoted text, and “Open source,” “Attach more.”
  * *Decision card*: “Accepted here” with the minimal receipt; link to full rationale.
  * *Thread card*: “Article B replies to Article A (methodology).”
  * *Spawn card*: “Discussion opened for X; join.”
* **Affordances everywhere**: Join, Follow, Mute, Cite, Lift to debate, Confirm (if thresholds met).

The lobby is not just a list; it’s *a control room* for active inquiry.

---

## 5) Writing & reading (ergonomics first)

**Reading**

* In‑document annotations (PDF/HTML): select text → “comment,” “quote,” “challenge.” Quotes are auto‑fingerprinted and archived.
* Side navigator shows: citations to this passage, claims derived from it, and open questions.
* Multilingual layer: high‑quality assisted translation with *quote integrity* (original text is preserved and shown on hover).

**Writing**

* Compose like in a modern editor; the assistant surfaces structure *as suggestions*: “This sentence looks like a claim—extract?”
* Drag in sources from your library or the web; the system resolves metadata, snapshots the page, and formats the cite.
* One keystroke to move from a free paragraph → a structured **Claim with grounds**.
* “Critical Questions” side panel shows gaps by argument type (expert opinion, causal, analogical…), with quick fixes.

---

## 6) Debate mechanics (without friction)

* **Moves palette**: Assert, Why?, Grounds, Counterexample, Clarify, Concede, Close.
* **Loci** (threads) keep replies coherent, but the UI reads like a normal conversation.
* **Suggestive structure**: the system proposes where to add grounds or warrants; you can accept or ignore.
* **Steel‑man mode**: each side produces the opponent’s best argument; earns “care” credits.
* **Evidence thresholds**: visible progress chips (e.g., “2/3 credible sources • 80% critical questions addressed”). When thresholds are met, **Confirm** appears.

---

## 7) Decisions that carry weight

* **Epistemic acceptance** (e.g., “Accepted here: Claim X”), with a **Receipt** that lists inputs (sources, addressed questions), rationale, reviewers/panel, and scope (“in this room,” “in community Y,” “provisional”).
* **Practical choice** (policy/action): voting modalities (approval, ranked, quadratic), quorum rules, conflict‑of‑interest flags, and a decision memo.
* **Receipts are first‑class**: searchable, citable, exported to the Canon (see §10).
* **Retractions & updates**: editors can retract/amend receipts; changes ripple across the graph with a visible audit trail.

---

## 8) Incentives & reputation (for good behavior)

* **Care credits**: earned for high‑quality citations, addressing critical questions, replications, synthesis summaries, and courteous counter‑argument.
* **No leaderboards of outrage**: visibility is shaped by *recency + rigor + relevance*, not raw reactions.
* **Badges (quiet, meaningful)**: Replicator, Synthesizer, Bridge‑Builder, Steel‑man, Open‑Data.
* **Reputation is *faceted***: you may be highly regarded in methodology but not in policy.

---

## 9) Safety, moderation, and fairness

* **Civility contract**: per‑space rules, enforced softly (nudges) and firmly (timeouts, bans).
* **Eristic detectors** (assistive): flagging straw‑man, ad hominem, motte‑and‑bailey patterns—always as suggestions for reflection, not penalties.
* **Conflicts of interest**: structured disclosures on decisions and bounties.
* **Privacy gradients**: private cohorts, embargoed sources, pseudonymous participation where appropriate, with cryptographically signed identities available to panels.

---

## 10) Canon & knowledge base (the long memory)

* **Canon**: a browsable index of accepted claims, with scope (where/when/who), citations, and counter‑positions.
* **Wiki pages**: topic pages that are *composed* from claims + receipts + summaries; they’re living documents with “what changed” diffs.
* **Back‑propagation**: when a key claim is retracted, Canon pages show a banner and suggest next steps (e.g., “Needs replication,” “Consensus broken”).

---

## 11) Day‑in‑the‑life flows (who does what)

* **Scholar**: imports a preprint, highlights a method section, opens a debate on a hidden assumption; earns care credits for a replication plan.
* **Journalist**: assembles a brief; every fact is an attached claim with sources; an editor confirms the brief with a receipt; the public sees a readable article with expandable provenance.
* **Policy analyst**: drafts a proposal; the Agora surfaces counterarguments and evidence; opens a week‑long vote with a decision memo; publishes both the outcome and the dissenting minority report.
* **Citizen**: follows a topic, asks a naive question; the system routes it to a cohort call and turns it into a claim + answer with citations.

---

## 12) System design (flyover architecture)

* **Data model**:

  * Nodes: Work, Claim, Evidence, Move, Decision(Receipt), Space, Thread, User, Bounty, Tag.
  * Edges: supports, rebuts, undercuts, cites, derived‑from, replies‑to, accepted‑in, retracts.
  * Every node & edge is **versioned** (append‑only log).
* **Event sourcing**: writes emit events to a log; feeds, notifications, and analytics derive from the same stream.
* **Knowledge graph**: a graph database (or graph layer) powering search and cross‑room navigation.
* **Search**: hybrid semantic + keyword; facets by object type, tag, time, rigor signals.
* **Realtime**: WebSocket/SSE bus for Now feed and collaborative editing.
* **CRDT collaborative docs**: live co‑editing of drafts, claims, and wikis with offline support.
* **Storage**: object store for snapshots and media; persistent citation caches (CSL JSON, DOIs).
* **AI assistants (bounded & auditable)**:

  * *Reader helper*: “Show me counterarguments,” “What changed since last visit?”
  * *Cite helper*: resolves metadata, checks for retractions, compares quotes to source text.
  * *Structure helper*: suggests claim extraction, grounds, and critical questions.
  * *Moderation helper*: eristic hints and de‑escalation phrasing.
    All assistants show **why** and **where** they got output; they are aids, not authorities.
* **Interoperability**: ORCID, Crossref/DataCite, OpenAlex, Zotero, Hypothes.is, arXiv, GitHub/Zenodo, ActivityPub for public activity mirroring.
* **APIs & export**: REST/GraphQL; bulk export to JSON/CSL/CSV/Graph; webhooks for institutions.

---

## 13) UX/visual language (calm power)

* **Layout**: three‑rail desktop (filters · feed · context), single‑column mobile with bottom sheets.
* **Typography**: content‑first; dense but breathable; consistent chips for tags/state.
* **Icons**: thin‑stroke, semantic color only when it carries meaning (votes=amber/green, receipts=emerald).
* **Micro‑interactions**: keyboard‑first navigation (j/k), quick cite (`⌘+K`), quote‑to‑claim (`⌘+Enter`).
* **Progress cues**: threshold chips (“CQ 60% · 1/2 sources”) that nudge toward rigor without scolding.

---

## 14) Governance (the constitution)

* **Spaces define rules**: open vs panel; review timelines; voting modes; moderation powers.
* **Receipts as law**: every consequential action yields a receipt (decision or moderation) with signers and rationale.
* **Escalation**: appeals path (peer reviewers → panel → council).
* **Transparency**: public log of rule changes; analytics dashboards with privacy guardrails.

---

## 15) Risks & anti‑patterns (and how the design counters them)

* **Dogpiles & pile‑ons** → rate‑limited hot threads, defuse banners, rotate attention to steel‑man prompts.
* **Engagement over truth** → ranking favors rigor/recency/novel evidence, not raw reactions.
* **Over‑structuring** → soft guidance, always optional; free text is first‑class.
* **Gatekeeping** → explicit “calls for input,” bounties, and respectful prompts bring in new voices.
* **Opaque AI** → assistants show sources and uncertainty; can be turned off per space.

---

## 16) “How it feels”

* **Alive**: you can see knowledge *moving*: new quotes, fresh counterexamples, consensus forming, votes closing.
* **Safe to think**: you’re invited to be careful, not performative.
* **Empowering**: every card offers a next step—cite, lift, reply, confirm, vote—without friction.
* **Trustworthy**: receipts and sources make acceptance legible and accountable.
* **Interconnected**: threads cross rooms and disciplines; you follow knowledge, not silos.

---

## 17) From vision to implementation (at 10,000 ft)

Even though this is a thought experiment, the design decomposes cleanly:

* **Keystones**: (1) event stream, (2) citation with fingerprinted quotes, (3) claim object with thresholds, (4) receipts.
* **Golden paths**:

  1. *Read → Quote → Claim → Cite → Discuss → Decide (receipt).*
  2. *Comment → Lift to debate → Get evidence → Address questions → Accept / Vote.*
* **Build order (conceptual)**: start with Source/Claim/Evidence primitives and the Now feed → add Moves & thresholds → Decisions → Canon → Threads/Network.

---

If you keep these principles and primitives intact, you can vary the tech stack, the moderation policy, and even the visual style—yet still end up with a platform that feels *purpose‑built for serious, enjoyable public reasoning*.
