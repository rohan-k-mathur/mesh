# Agora: Infrastructure for Collective Reasoning

*January 2026*

---

## The Problem

Reasoning has structure. When people deliberate—weighing evidence, challenging inferences, working through disagreements—they produce something with a shape. Claims depend on other claims. Inferences can be challenged at specific steps. Evidence supports some assertions and undermines others. Objections are raised and addressed, or raised and evaded, or raised and left hanging.

This structure is where the intellectual work lives. The conclusion is just the residue.

But our tools destroy this structure. Chat produces chronological sequences. Documents produce linear prose. Neither preserves the graph—the web of support and attack relationships, the dialectical moves, the conditional dependencies. When a discussion ends, the structure scatters. What remains is the conclusion and, if you're fortunate, some technically-accurate-but-practically-useless meeting minutes.

Consider the last time you participated in a group making a difficult decision—a committee at work, a board, a family working through something consequential. People talked, good points were made, a decision emerged. But if someone asked you later *why* you decided what you did—what alternatives you considered, what concerns were raised, how you addressed them—you'd struggle to reconstruct it. That experience, scaled to institutions, is how policy gets made, how research directions get set, how standards get written. The reasoning evaporates; only conclusions survive.

The consequences are severe and underappreciated:

**Reasoning doesn't accumulate.** Each group facing a question starts fresh, unaware of prior work or unable to use it even when they find it. The same arguments get made and addressed repeatedly, across institutions, across decades. Intellectual progress that should compound instead dissipates.

**Decisions become unaccountable.** Not in the conspiratorial sense—in the straightforward sense that no one can reconstruct why a decision was made. The premises that seemed compelling at the time, the alternatives considered and rejected, the objections raised and how they were handled—all of it exists only in the memories of participants who will forget, leave, or die.

**Disagreement becomes interminable.** Without a shared map of what's been established and what's contested, discussions loop. The same objections surface repeatedly. Participants talk past each other, unaware they're addressing different parts of the argument. Resolution becomes impossible not because the disagreement is deep, but because no one can see where it actually is.

These aren't minor inefficiencies. They're structural failures in how institutions think. And they're so normalized that we barely notice them.

### What's Actually Broken

The platforms where groups discuss important questions—email threads, Slack channels, Google Docs, comment sections—were not designed for structured reasoning. They're optimized for conversation, not deliberation. The structural deficits are specific:

| Problem | What Happens | What It Costs |
|---------|--------------|---------------|
| **No shared structure** | Ideas exist as prose, not as claims with explicit relationships | Disagreements become rhetorical battles rather than structured analysis |
| **Evidence is disconnected** | Sources live in attachments, footnotes, or separate documents | No way to trace a claim back to its grounds, or see what depends on disputed evidence |
| **No institutional memory** | Reasoning scatters across threads, docs, meetings, and email | Every discussion starts from scratch; past conclusions can't be cited or audited |
| **No path to resolution** | Comments pile up but don't converge toward conclusions | Decisions get made elsewhere (or not at all), without clear justification |
| **Challenges disappear** | Someone raises a good objection; it scrolls out of view | Critical questions go unanswered; weak arguments persist unchallenged |

These aren't just inconveniences. They erode the ability of institutions to justify their decisions, of teams to learn from past analysis, and of communities to resolve disagreements constructively.

---

## Why Previous Tools Failed

Every decade or so, someone builds an argumentation tool. Researchers in computer science and philosophy—people who understand formal reasoning deeply—create platforms for structured debate. These tools are technically sophisticated. They have argument diagrams, typed relationships, formal semantics. And almost without exception, they fail to achieve adoption.

The pattern is consistent enough to be instructive:

| Era | Tools | What Happened |
|-----|-------|---------------|
| 1980s-90s | gIBIS, QuestMap | Too formal; users had to structure everything upfront |
| 2000s | Compendium, Deliberatorium | Academic showcases; never crossed into practice |
| 2010s | Kialo, DebateGraph | Lighter but still isolated; nothing connects beyond the debate |
| Present | Various argumentation apps | Fragmented; no ecosystem; users must leave their actual work |

The failure mode is almost always the same: **the deliberation engine exists in isolation**.

These tools asked users to leave their documents, their reading, their writing, their evidence—and enter a separate "argumentation space" to construct formal structures from scratch. The overhead was too high. The integration was too weak. Nothing connected back to actual work.

The CSCW (computer-supported cooperative work) literature has been studying group reasoning tools since the 1980s. Most failed for predictable reasons:

**Too formal for casual use.** They required users to do the work of identifying claims, classifying arguments, and mapping relationships before they could begin. That's too much friction.

**Too divorced from where conversation happens.** Argumentation was a separate activity, not part of the natural flow of reading, writing, and discussing.

**Too demanding of upfront structure.** Users had to commit to formal representations before they understood their own arguments.

**No value produced outside the tool.** The artifacts stayed locked in the platform. Nothing exported, nothing persisted, nothing connected to external systems.

The insight behind Agora is that structured deliberation cannot succeed as a standalone feature. It needs to be woven into the activities people already do—and it needs to produce outputs that have value beyond the platform itself.

---

## What We're Building

Agora treats reasoning as a first-class data structure. Claims become addressable objects. Arguments follow typed patterns. Disagreements are explicit and trackable. The goal: make group reasoning composable, auditable, and durable—in the way version control made code collaboration tractable.

But here's what distinguishes Agora from failed predecessors: **it's not one tool. It's an integrated ecosystem of three pillars that make each other valuable.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        THE AGORA ECOSYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │     STACKS      │    │    ARTICLES     │    │  DELIBERATION   │        │
│   │  Evidence Base  │◀──▶│  Publication    │◀──▶│     Engine      │        │
│   │                 │    │                 │    │                 │        │
│   │ • PDF library   │    │ • Rich editor   │    │ • Claims        │        │
│   │ • Link capture  │    │ • Templates     │    │ • Arguments     │        │
│   │ • Annotations   │    │ • Annotations   │    │ • Dialogue      │        │
│   │ • Citations     │    │ • Comments      │    │ • ASPIC+        │        │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘        │
│            │                      │                      │                  │
│            └──────────────────────┼──────────────────────┘                  │
│                                   ▼                                         │
│            ┌──────────────────────────────────────────────┐                 │
│            │              PLEXUS NETWORK                   │                 │
│            │     Cross-context connections & transport     │                 │
│            └──────────────────────────────────────────────┘                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pillar 1: Stacks — The Evidence Base

Reasoning about something important requires sources—documents, research, data. Most reference managers (Zotero, Mendeley) stop at organization. You collect papers, add tags, maybe highlight. But the highlights stay locked in the PDF. The notes don't connect to anything else.

Stacks makes **evidence portable**:

- **Annotations become citations.** Highlight a passage, and that highlight becomes a citable object with a stable anchor. When you reference that passage in an argument, the citation links back to the exact location.
- **Sources feed deliberations.** A Stack can host its own deliberation. Papers in the stack become the evidence base. You don't import PDFs into a separate tool—the tool is already there.
- **Multi-context connections.** A source can appear in multiple Stacks. You can see everywhere a piece of evidence is used, across all contexts that cite it.
- **Quality tracking.** As sources get used in deliberations and challenged or supported, the platform tracks how that evidence has fared.

### Pillar 2: Articles — The Publication Layer

Reasoning often takes the form of essays and analyses. Most writing tools are endpoints—you write, you publish, discussion happens somewhere else (comments, emails, Twitter threads). The document and the discourse are disconnected.

Articles in Agora are **deliberation hosts**:

- **Every article spawns a deliberation space.** When you publish, the platform creates a linked deliberation where readers can engage at the structural level—not just leaving comments, but registering formal challenges, supports, and extensions.
- **Text annotations bridge to arguments.** Select a passage and annotate it as a comment (informal) or a claim (formal). Claims enter the deliberation system, where they can be challenged and composed into arguments.
- **Extraction pipeline.** The platform can extract the argumentative structure from an article: identifying claims, inferring premise-conclusion relationships, recognizing reasoning patterns. Prose becomes a claim graph.
- **Bidirectional flow.** Deliberations can produce articles. The Thesis system composes arguments into publishable documents. The loop closes.

### Pillar 3: Deliberation — The Reasoning Engine

This is the core. When someone makes a claim, it becomes a discrete, trackable object. Others can support it, challenge it, or build on it. Challenges get recorded. Responses connect back to challenges. The result is a map of the reasoning that persists over time.

- **Claims as addressable objects.** Every claim has a stable identifier. You can reference it, track its status, see what supports and attacks it.
- **Typed relationships.** Not just "these things are connected" but *how*: support, attack, equivalence, specification. And attacks are further typed: rebuttals challenge conclusions, undercuts challenge inferences, undermines challenge premises.
- **Scheme-based arguments.** 60+ patterns from Walton's taxonomy, each with auto-generated critical questions. The system knows what kind of argument you're making and surfaces the challenges appropriate to that pattern.
- **Dialogue tracking.** Every contribution is a typed move: assert, challenge, respond, concede, retract. Commitment stores track what each participant has committed to.

**The key insight: each pillar makes the others more valuable.** Without Stacks, deliberation floats free—claims become assertions without grounds. Without Articles, there's no surface for engagement—users don't naturally "do deliberation." Without the deliberation engine, Stacks is just a reference manager and Articles is just a blog. Together, they form an ecosystem where structure emerges from activities people already do.

---

## How It Works

The system organizes reasoning into three conceptual layers. Each layer builds on the one below, adding structure and formalization as needed. A discussion might use only Layer 1 (informal discussion with workshopping). A policy analysis might span all three, culminating in published thesis documents that cite structured arguments grounded in canonical claims.

### Layer 1: Claims and Evidence

Informal discussion produces propositions—things people say. When a proposition matters, it gets *promoted* to a claim: a canonical assertion with a stable identifier, typed relationships to other claims, and explicit links to supporting evidence.

```
Proposition: "I think we should use Postgres"
     ↓ promote
Claim #247: "PostgreSQL is the appropriate database choice"
     ├── supports: Claim #201 (system requirements)
     ├── attacks: Claim #198 (MongoDB proposal)
     └── evidence: [benchmark doc, cost analysis]
```

Claims exist in relationship to other claims through **ClaimEdges**, typed according to the nature of the relationship:

| Edge Type | Semantics |
|-----------|-----------|
| SUPPORTS | Source claim provides evidence or reasoning for target |
| OPPOSES | Source claim contradicts or challenges target |
| QUALIFIES | Source claim adds conditions or limitations to target |
| GENERALIZES | Source claim abstracts from target |
| SPECIALIZES | Source claim is a specific instance of target |

Every claim carries provenance—who made it, when, and in what context—and maintains its relationships as the deliberation evolves. Claims have a lifecycle: DRAFT → ACTIVE → CHALLENGED → DEFENDED or RETRACTED → potentially SUPERSEDED by a refined version.

### Layer 2: Arguments and Dialogue

Claims connect into arguments: premise-conclusion structures annotated with reasoning patterns. We implement over 60 schemes from Walton's taxonomy of argumentation—organized into categories:

| Category | Description | Example Schemes |
|----------|-------------|-----------------|
| **Source-Based** | Inferences from testimony, authority, or witness | Expert Opinion, Witness Testimony, Position to Know |
| **Causal** | Inferences involving cause and effect | Cause to Effect, Effect to Cause, Correlation to Cause |
| **Practical** | Inferences about action and goals | Practical Reasoning, Negative Consequences, Waste |
| **Analogical** | Inferences from similarity | Analogy, Precedent, Example |
| **Classification** | Inferences from category membership | Verbal Classification, Definition |
| **Evaluative** | Inferences about values and preferences | Values, Commitment, Popular Opinion |

Each scheme comes with **critical questions**—the challenges any rigorous interlocutor would raise:

```
Scheme: Argument from Expert Opinion

  Premise: Dr. Smith asserts X
  Premise: Dr. Smith is expert in domain D
  Conclusion: X is likely true

  Critical Questions:
  ├── Is Dr. Smith credible?
  ├── Does X fall within D?
  ├── Does Dr. Smith have conflicts of interest?
  └── Do other experts disagree?
```

When you construct an argument using a scheme, the system automatically surfaces the relevant critical questions. Unanswered critical questions represent potential attack vectors. The system validates that arguments instantiating a scheme provide all required premises and flags when critical questions are relevant but unanswered.

Arguments compose into **chains**—directed acyclic graphs with different structures:

| Chain Type | Structure | Description |
|------------|-----------|-------------|
| SERIAL | A → B → C | Linear dependency; each step requires the previous |
| CONVERGENT | A → C, B → C | Multiple independent premises support one conclusion |
| DIVERGENT | A → B, A → C | One premise supports multiple conclusions |
| LINKED | (A ∧ B) → C | Premises jointly required; neither sufficient alone |

All activity in this layer is mediated by **dialogue moves**. You don't just add an argument to the graph—you ASSERT it. Someone else doesn't just attack—they explicitly REBUT, UNDERCUT, or UNDERMINE. The system tracks what each participant has asserted, challenged, and conceded through **commitment stores**, creating accountability that persists across sessions.

| Move Type | Semantics |
|-----------|-----------|
| ASSERT | Publicly commit to a claim |
| WHY | Demand justification for a claim |
| GROUNDS | Provide supporting argument |
| CONCEDE | Accept an opponent's claim |
| RETRACT | Withdraw a previous commitment |
| CLOSE | End a dialogue sequence |

### Layer 3: Outputs and Artifacts

Deliberations produce durable artifacts—not just discussion records, but publishable documents:

| Artifact | Purpose |
|----------|---------|
| **Thesis** | Legal-style structured documents with prongs and supporting arguments |
| **TheoryWorks** | Longer-form analysis using ethical frameworks (Deontological, Consequentialist, etc.) |
| **KbPages** | Knowledge base entries with live links to underlying claims and arguments |
| **DebateSheets** | Exportable visual argument maps |
| **Briefs** | AI-assisted summaries of deliberation content |

These artifacts don't just reference the underlying reasoning—they link to it. A thesis claim points to the canonical claim it's asserting. A KB block embeds a live view of an argument that updates as the underlying structure evolves. Future work can reference specific claims, inspect their status, and trace their grounds.

---

## The Technical Core

Most "argument mapping" tools are boxes and arrows—visual aids without computational semantics. Agora is different. It implements ASPIC+, a formal framework for defeasible reasoning developed in the argumentation theory community, with full computational evaluation.

### The Data Model

All structures conform to the **Argument Interchange Format (AIF)** ontology—the academic standard for representing arguments. This isn't just for interoperability; it provides decades of research on argument semantics, attack types, and extension computation.

| AIF Node Type | Description | Implementation |
|---------------|-------------|----------------|
| **I-node** (Information) | Propositions/claims containing content | `Claim`, `AifNode` |
| **RA-node** (Rule of Application) | Inference steps applying schemes | `Argument` |
| **CA-node** (Conflict Application) | Attack relations (rebut/undercut/undermine) | `ArgumentEdge` |
| **PA-node** (Preference Application) | Priority/ordering relations | Preference orderings |
| **DM-node** (Dialogue Move) | Locutions in dialogue | `DialogueMove` |

### ASPIC+ Semantics

**Strict vs. defeasible rules.** Some inferences are certain (strict rules admit no exceptions); others hold only absent contrary evidence (defeasible rules). The system distinguishes them and handles each appropriately. When you say "All mammals are warm-blooded" (strict) versus "Birds typically fly" (defeasible), the system understands the difference.

**Typed attacks.** This is where Agora diverges from naive argument mapping. Attacks aren't generic disagreement—they're typed according to *what* they target:

| Attack Type | Target | Effect | Example |
|-------------|--------|--------|---------|
| REBUT | Conclusion | Directly contradicts the conclusion | "The conclusion is false" |
| UNDERCUT | Inference | Blocks the reasoning step, not the conclusion | "That analogy doesn't hold because..." |
| UNDERMINE | Premise | Attacks the foundation | "Your expert isn't actually an expert in this field" |

Each requires a different response. The system tracks which type of attack is being made and what would constitute an adequate response.

**Contraries and contradictions.** ASPIC+ distinguishes between contradictory claims (exactly one must be true) and contrary claims (at most one can be true). The platform explicitly models `ClaimContrary` relations so the system knows when claims conflict.

**Preference orderings.** When multiple rules conflict, explicit preferences resolve the contradiction. These preferences can themselves be challenged. The system supports orderings on both rules and premises.

**Computable acceptability.** Given an argument graph with attacks and preferences, the system computes which arguments survive—not as opinion, but as a function of structure. The grounded extension identifies conclusions that are warranted given all attacks and defenses.

This matters because it means the system can answer questions like: "If we accept this new evidence, which of our conclusions still hold?" That's not a feature most collaboration tools offer.

### Confidence and Uncertainty

Real-world reasoning involves uncertainty. Premises may be likely rather than certain. Evidence may be partial. Agora treats confidence as first-class:

| Scope | Implementation | UI |
|-------|----------------|-----|
| Per-argument | Confidence scores (0.0-1.0) | Confidence sliders |
| Aggregation | Product or minimum confidence modes | Mode toggle |
| Uncertainty intervals | Dempster-Shafer belief functions | DS Mode toggle |
| Temporal decay | Staleness tracking | Stale badges on old arguments |

This allows the system to distinguish between strongly-supported conclusions and tentative hypotheses, and to surface when previously confident conclusions have become stale.

---

## The Version Control Analogy

Before Git, code collaboration was painful. Developers emailed patches, maintained conflicting copies, and lost work to merge conflicts. Git introduced a data model—content-addressable trees, a directed acyclic graph of commits—that made collaboration tractable at scale.

The structural parallel is instructive:

| Code (Git) | Reasoning (Agora) |
|------------|-------------------|
| Files → commits → branches | Claims → arguments → deliberations |
| Diffs show exactly what changed | Attacks target specific premises or inferences |
| Merge conflicts are explicit | Disagreements are typed (rebut/undercut/undermine) |
| History is preserved | Full provenance (who said what, when, in response to what) |
| Fork and extend | Import and adapt via Plexus network |
| Blame shows authorship | Commitment stores track each participant's position |

The analogy isn't perfect, but the structural point holds: certain kinds of collaboration only become tractable once you have the right data model. For code, that was commits and branches. For reasoning, it's claims, arguments, and typed attacks.

Wikipedia made knowledge accumulate collaboratively—contributions improved by others, persistent and accessible. Git made code accumulate collaboratively—every change tracked, parallel work merged, history preserved.

Agora is attempting something similar for reasoning. Not facts in the Wikipedia sense, but contested questions: here are the arguments on various sides, here's the evidence they rely on, here's how the debate has evolved, here's what's been resolved and what remains open.

### The Plexus Network

One aspect Git got right: repositories can reference each other. Agora extends this with the **Plexus network**—the visualization of how deliberations connect:

- **Shared claims.** When two deliberations address the same claim, that connection is visible. Work in one context informs work in another.
- **Imported arguments.** Arguments can migrate between deliberations with full provenance. "This argument originated in Deliberation A, was imported into Deliberation B."
- **Common sources.** See everywhere a piece of evidence is cited across the system.
- **Cross-context knowledge graph.** As participants contribute, the system accumulates institutional memory at the level of the whole platform, not just individual discussions.

---

## The Intellectual Foundations

This work builds on decades of serious scholarship. The implementation isn't speculative—it's grounded in established academic fields with formal semantics, proof theories, and computational complexity results.

### Argumentation Theory

The formal study of argument structure goes back to Aristotle, but modern computational approaches have a clear lineage:

| Year | Contribution | Significance |
|------|--------------|--------------|
| 1958 | Toulmin's model | First structural analysis of practical argument |
| 1987 | gIBIS | First Issue-Based Information System |
| 1995 | Dung's abstract argumentation frameworks | Mathematical foundations for argument acceptability |
| 1996 | Walton's *Argumentation Schemes* | Taxonomy of 60+ defeasible reasoning patterns |
| 2010 | ASPIC+ (Prakken & Modgil) | Full framework for structured defeasible argumentation |
| 2015 | AIF 2.0 | Argument Interchange Format standard |

This isn't amateur philosophy—it's a rigorous technical field. Dung's seminal 1995 paper on the "Acceptability of Arguments" has over 8,000 citations. The field has active conferences (COMMA, ArgMAS), journals (*Argument & Computation*), and a mature understanding of what makes arguments valid, how conflicts resolve, and when conclusions are warranted.

### Walton's Argumentation Schemes

Doug Walton's taxonomy of argument patterns provides the vocabulary for typing arguments. The 60+ schemes aren't arbitrary categories—they're distilled from centuries of informal logic into structured, teachable, implementable patterns.

Each scheme has:
- **Canonical structure:** Required premises and conclusion form
- **Critical questions:** The specific challenges relevant to that pattern
- **Defeat conditions:** How the argument fails if critical questions aren't answered

When Agora auto-generates critical questions for an argument, it's operationalizing this life's work. A user constructs an argument from expert opinion; the system surfaces "Is the expert biased?" and "Do other experts disagree?" These aren't suggestions—they're the formal challenges that make such arguments defeasible.

### Dialogue Game Theory

The work of Walton and Krabbe on commitment in dialogue formalizes reasoning as process, not just structure. Key insights:

- **Dialogue moves have normative force.** When you ASSERT a claim, you commit to it—it becomes part of your public position.
- **Commitment stores track state.** The system maintains per-participant records of what has been asserted, conceded, or retracted.
- **Dialogue types have rules.** Persuasion dialogue, inquiry, negotiation—each has different move legality and success conditions.

Agora implements commitment tracking. Every assertion, challenge, concession, and retraction is recorded as a typed dialogue move. This provides a clear answer to: "What has this participant actually committed to?"

### Deliberative Democracy

The political theory tradition running from Habermas through Fishkin provides normative grounding. The claim isn't just that structured deliberation is efficient, but that it's constitutive of legitimate collective decision-making. When Agora produces transparent deliberation records, it's operationalizing the ideal of discourse where the only force is the force of the better argument.

### CSCW and Deliberation Support

The computer-supported cooperative work literature offers both precedent and cautionary tales. Understanding why previous systems failed—too formal for casual use, too divorced from where conversation happens, too demanding of upfront structure—directly informed Agora's design.

The **progressive formalization** approach, where structure emerges from informal discussion rather than being imposed from the start, is a direct response to these documented failure modes:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROGRESSIVE FORMALIZATION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   INFORMAL                                                     FORMAL       │
│   ◄──────────────────────────────────────────────────────────────────►      │
│                                                                             │
│   Discussion     Proposition      Claim         Argument      Thesis        │
│   (chat/forum)   (workshopping)   (canonical)   (structured)  (published)   │
│        │              │              │              │             │         │
│        │   upgrade    │   promote    │    link      │  publish    │         │
│        └──────────────┴──────────────┴──────────────┴─────────────┘         │
│                                                                             │
│   Structure emerges on-demand, not imposed upfront                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## What This Enables

The ecosystem architecture enables capabilities that wouldn't be possible with isolated tools:

### Accumulation

When one team completes an analysis, another team facing a similar question can import the argument structure—adopting what survives scrutiny, forking what doesn't. Knowledge compounds instead of starting fresh.

The integration flows make this concrete:

```
PDF in Stack
    → Highlight passage
        → Create annotation with citation anchor
            → Lift annotation to claim in deliberation
                → Attach to argument as premise
                    → Argument imported into new deliberation via Plexus
                        → Original citation preserved; clicking premise opens PDF at exact location
```

### Auditability

Deliberation records show what evidence was considered, what alternatives were evaluated, what objections were raised, and how they were addressed. This is transparency as infrastructure, not as public relations.

Every structure in the system has provenance:
- **Who** created it
- **When** it was created
- **In response to what** (which dialogue move triggered it)
- **What has happened since** (challenges, defenses, revisions)

### Portability

The structure of a deliberation outlives its participants. An analysis completed in 2025 is still usable in 2030—not because someone wrote a summary, but because the argument structure persists in a form that future thinkers can engage with, challenge, and extend.

### Interoperability

Agora exports to the Argument Interchange Format (AIF), the academic standard. Arguments can move between systems. Analysis can be performed externally. We support multiple export formats:

| Format | Purpose |
|--------|---------|
| AIF 2.0 | Academic standard for argumentation tools |
| AIF+ | Extended format with dialogue and scheme information |
| JSON-LD | Linked data format for web integration |
| BibTeX | Citation export |
| Markdown | Human-readable document export |

### Resolution

Two parties in disagreement can see the actual shape of their dispute. The system distinguishes:

- **Empirical disagreements** — Where evidence could resolve the question
- **Value-based disagreements** — Where negotiation and deliberation are required
- **Semantic disagreements** — Where parties are using terms differently
- **Disagreements about inference** — Where the same premises lead to different conclusions via different reasoning

Participants can see where they actually disagree instead of talking past each other. An attack on a premise is different from an attack on an inference—and the system makes this visible.

### Claim-Level Search

Beyond traditional document search, Agora enables search at the level of claims and arguments:

- Find not just papers about X, but *claims* about X
- See what supports them and what attacks them
- See what scheme of reasoning they use
- Find semantically similar claims across different deliberations
- Track how a claim has fared (cited and defended? repeatedly challenged?)

---

## Who It's For

The initial focus is on contexts where reasoning quality genuinely matters—where the cost of poor reasoning is high enough to justify structure.

### Research Communities

Academic discourse has evolved through layers:

| Era | Innovation | Unit of Record |
|-----|------------|----------------|
| 1800s | Learned societies, journals | Publications |
| 1900s | Peer review, conferences | Evaluated publications |
| 2000s | Preprints, open access, social media | Faster, more accessible publications |
| 2020s+ | **Agora** | Claims, arguments, and their relationships |

Each layer solved a scaling problem. Journals solved distribution. Peer review solved quality filtering. Preprints solved speed. But none of them solved **claim-level engagement**.

Papers cite papers. We can count citations and build networks of papers. But we can't (at scale) see which claims in Paper A challenge which claims in Paper B, whether those challenges have been addressed, what evidence each side marshals, or how the debate has evolved.

Agora adds:
- **Paper-to-claim pipeline.** Upload a paper, extract its claims. Each claim becomes addressable, linked to the source text.
- **Claim-level search.** Find not just papers about X, but claims about X with their supports and attacks.
- **Related arguments panel.** View semantically similar claims, supporting arguments, challenges, and cross-field matches.
- **Academic deliberation templates.** Journal club mode. Paper response mode. Seminar mode.
- **Living literature reviews.** Argument networks that update as new work appears.

### Institutions Making Consequential Decisions

Policy teams, regulatory bodies, standards organizations—contexts where transparency is increasingly demanded and where the cost of poor reasoning is high.

Decision-making should become genuinely auditable: not "we published a report" auditable, but "you can trace every conclusion to its premises and see how objections were handled" auditable.

### Communities Tackling Complex Questions

Groups that require sustained collective thinking rather than quick polls or voting. Climate policy. Urban planning. Ethical technology governance. Any context where:
- Multiple stakeholders have legitimate perspectives
- The question requires weighing evidence over time
- Resolution depends on understanding the actual structure of disagreement

### What We're Not For

Agora is not replacing casual conversation. It's infrastructure for contexts where getting the reasoning right justifies the structure. Low-stakes discussion doesn't need argumentation schemes. But when decisions have consequences, when disputes need resolution, when reasoning should compound—that's what we're building for.

---

## Why Now

Previous argumentation tools failed in part because of timing. Several things are different now:

### AI Reduces the Formalization Burden

The historical failure of argumentation tools is largely about the cost of structure. Users had to do the work of identifying claims, classifying arguments, and mapping relationships. That's too much friction.

But language models can now assist:
- **Suggesting claim boundaries** — Where does one assertion end and another begin?
- **Proposing argument schemes** — "This looks like an argument from expert opinion"
- **Identifying potential attacks** — "This claim could be challenged via undercut"
- **Extracting structure from prose** — The article extraction pipeline turns essays into claim graphs

The user validates and corrects rather than constructing from scratch. This changes the cost-benefit calculation fundamentally.

### Collaboration Tools Have Trained Expectations

When gIBIS launched in 1988, "groupware" was a novel concept. Now everyone uses Slack, Notion, Google Docs. The idea of digital tools for group work is normal. The question is no longer "will people use software to collaborate" but "will people use this particular software." That's a lower bar.

### The Transparency Demand Is Real

Institutions face increasing pressure to justify decisions. "Trust us" doesn't work anymore. There's genuine demand for auditable reasoning—from regulators, from stakeholders, from the public.

When a company must explain its AI ethics policies, or a government agency must justify a regulatory decision, or a research consortium must document its methodology—they need infrastructure that produces defensible records. Agora produces what this demand calls for.

### The Accumulation Problem Is Acute

Information overload is a cliché, but the specific problem of reasoning not accumulating is getting worse. More research, more reports, more analyses—all sitting in PDFs that can't be built upon. The value of solving this increases as the problem worsens.

Consider: a researcher entering a field might need to synthesize 500+ papers to understand the state of the debate. Each paper cites others. Claims conflict. Methodologies are contested. None of this structure is machine-readable. The researcher starts from scratch, building a mental model that will be lost when they move on.

### Existing Tools Have Failed

- **Twitter/X** is toxic and ephemeral. Arguments vanish in the stream.
- **ResearchGate** is gamified noise. Metrics without substance.
- **PubPeer** is reactive critique only. No sustained deliberation.
- **Google Scholar** indexes papers, not claims.
- **Email and Slack** produce linear text that can't be queried.

There's no serious, structured, persistent infrastructure for scholarly (or institutional) discourse. The gap is clear.

---

## Current State

Agora is in active development with a closed alpha for testing and feedback.

### Complete (Implemented and Working)

**Stacks — Evidence Base:**
- PDF library with upload, annotation, and citation extraction
- Link and document capture with metadata resolution (DOI, ISBN)
- Annotation-to-citation pipeline with stable anchors
- Multi-context connections (sources can appear in multiple Stacks)

**Articles — Publication Layer:**
- Rich text editor (TipTap) with formatting, media embeds, mathematical notation
- Article templates and publishing workflow
- Annotation system (comments and formal claims)
- Article-deliberation linking (each article spawns a deliberation space)

**Deliberation — Reasoning Engine:**
- Full claims layer with typed edges (SUPPORTS, OPPOSES, QUALIFIES, etc.)
- Propositions with community workshopping (votes, endorsements, replies)
- Promotion workflow (proposition → claim)
- Full arguments layer with premises, conclusions, and scheme selection
- 60+ Walton schemes with critical questions
- Typed attacks (REBUT, UNDERCUT, UNDERMINE)
- Dialogue move tracking (ASSERT, WHY, GROUNDS, CONCEDE, RETRACT)
- Commitment stores per participant
- Argument chains (serial, convergent, divergent, linked)
- Hypothetical scopes (counterfactual reasoning contexts)
- ASPIC+ implementation with grounded extension computation
- Confidence quantification with DS mode option
- Cross-room visualization (Plexus network)
- Knowledge base pages with live links to claims/arguments
- Thesis documents (legal-style structured arguments)
- TheoryWorks (longer-form ethical analysis frameworks)
- Debate sheets (exportable argument maps)
- AIF export (2.0, AIF+, JSON-LD)
- Glossary system (per-deliberation term definitions)

**Platform Infrastructure:**
- User authentication and profiles
- Discussion/deliberation creation and management
- Real-time collaboration
- Search and discovery
- Notification system

### In Progress

- Article extraction pipeline (prose → claim graph) — AI-assisted, human-verified
- Academic profile extensions (ORCID integration, institutional affiliation)
- Enhanced Stacks (visibility modes, additional block types)
- Deliberation templates (journal club, paper response, seminar)
- Preferred/stable semantics (beyond grounded extension)
- Cross-room import UI (API functional, UI polish in progress)
- Mobile optimization

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind |
| Backend | Node.js 18, TypeScript, Prisma |
| Database | PostgreSQL |
| Cache/Queues | Redis (Upstash), BullMQ |
| Vectors | Pinecone |
| Infrastructure | AWS (EKS, S3, SES) |

---

## What We're Not

Clarity requires negation. Agora is **not**:

- **A social network.** We don't optimize for engagement. We don't have feeds designed to maximize time-on-platform. We don't have likes, followers, or viral dynamics. Success is reasoning quality, not attention capture.

- **A chat app with extra features.** Chat is for coordination; Agora is for deliberation. The data model is fundamentally different—claims and arguments, not messages and threads.

- **A knowledge base you type into.** Structure emerges from deliberation, not from manual taxonomy maintenance. The KB pages are outputs, not inputs.

- **An AI that argues for you.** AI assists with extraction and suggestion. Humans reason. The platform provides infrastructure; it doesn't replace human judgment.

- **A replacement for peer review.** We're a complement—continuous public discourse alongside formal evaluation.

- **Academic software for academics only.** The infrastructure applies to any context where groups need to reason together rigorously.

---

## The Bet

We have sophisticated infrastructure for code: version control, CI/CD, code review. We have capable tools for documents and communication. But for the structure of reasoning itself—the claims, the inferences, the challenges, the resolutions—we have essentially nothing.

The bet is that this gap matters. That organizations trying to think together rigorously deserve better than chat threads and document editors. That reasoning infrastructure is systematically underbuilt, and that building it will make certain kinds of collaboration possible that currently aren't.

### What We've Learned from Failed Tools

Previous argumentation tools failed because they existed in isolation—separate spaces disconnected from real work. The lessons:

| Lesson | Failed Approach | Agora's Answer |
|--------|-----------------|----------------|
| Don't demand structure upfront | Required formalization before contributing | Progressive formalization—structure emerges from discussion |
| Don't exist in isolation | Standalone applications | Integrated ecosystem (Stacks + Articles + Deliberation) |
| Don't ignore entry points | Expected users to "come do argumentation" | Multiple entry points (read, annotate, search) |
| Don't be a toy | Demonstrated features without workflows | Full workflows (journal club, paper response, thesis) |
| Don't produce ephemera | Discussion locked in platform | Artifacts everywhere (AIF, BibTeX, KB pages, Thesis) |

### The Integration Thesis

The bet is that integration is what's been missing. Not better diagrams, not more formal semantics—but deliberation woven into the actual work of thinking together.

- The evidence you collect is the evidence you cite.
- The articles you read are the articles you engage with.
- The arguments you build produce the documents you publish.
- The deliberations you have connect to deliberations others have had.

When these systems work together, structure emerges from activities people already do. You don't enter a special "argumentation mode"—reasoning infrastructure is present wherever you're already working.

### What Success Looks Like

If Agora succeeds, it will be visible in specific outcomes:

- **Research communities** where a newcomer can see the actual structure of contested questions—not just which papers are cited, but which claims are challenged and how the debate has evolved.
- **Institutions** where decisions come with audit trails—not summaries, but the actual reasoning graphs showing premises, objections, and resolutions.
- **Complex questions** where progress compounds—where work done in 2025 is built upon in 2030, not repeated from scratch.
- **Disagreements** that resolve or clarify—where participants can see precisely what they disagree about, whether evidence could resolve it, and what would count as success.

This is ambitious. But the alternative is what we have now: reasoning that evaporates, decisions without derivations, knowledge that doesn't compound.

---

*For access to the alpha, contact the team.*