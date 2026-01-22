# Digital Agora: Infrastructure for Collective Reasoning

**Project Overview**  
*January 2026*

---

## TL;DR

Digital Agora is infrastructure for structured deliberation. It treats reasoning as a first-class data structure—claims become addressable objects, arguments follow typed patterns, and conclusions compute from structure rather than accumulating as unstructured prose. The goal: make group reasoning composable, auditable, and durable in the same way version control made code collaboration tractable.

---

## The Problem

Every organization that reasons together—policy teams, research groups, standards bodies, communities—eventually hits the same wall: **their tools don't preserve reasoning structure**.

What happens today:

| Activity | Tool | What Gets Lost |
|----------|------|----------------|
| Policy deliberation | Google Docs + meetings | Why alternatives were rejected; who raised which concerns |
| Research synthesis | Email threads + PDFs | Which claims depend on which evidence; what's contested vs. settled |
| Technical decisions | Slack + wikis | The argument structure; challenges and responses |
| Community governance | Forums + votes | How conclusions emerged from discussion |

The common failure mode: reasoning happens, but only conclusions persist. The structure—premises, inferences, challenges, resolutions—scatters across threads, docs, and memory. Six months later, no one can reconstruct *why* a decision was made. New team members start from scratch. Prior work cannot be cited or extended.

This isn't a UX problem. It's a **data model problem**. Current tools represent discourse as sequences of messages (chat) or blocks of prose (docs). Neither captures the graph structure of reasoning: claims that support or attack other claims, evidence that grounds assertions, inferences that can be challenged at specific points.

---

## The Solution

Agora provides a deliberation substrate with three layers:

### Layer 1: Claims & Evidence

**Propositions** are informal assertions—things people say in discussion. When a proposition becomes consequential, it can be **promoted to a Claim**: a canonical assertion with a stable identifier, typed relationships to other claims, and explicit links to supporting evidence.

```
Proposition: "I think we should use Postgres"
     ↓ (promote)
Claim #247: "PostgreSQL is the appropriate database choice for this use case"
     ├── supports: Claim #201 (system requirements)
     ├── attacks: Claim #198 (MongoDB proposal)
     └── evidence: [benchmark doc, cost analysis]
```

Every claim has:
- **Stable URI** — addressable across contexts
- **Typed edges** — support, attack, equivalence, specification
- **Evidence links** — with source, quote, and page-level precision
- **Provenance** — author, timestamp, originating context

### Layer 2: Arguments & Dialogue

Claims connect into **Arguments**—premise-conclusion structures annotated with reasoning patterns. We implement 60+ schemes from Walton's taxonomy:

- Argument from Expert Opinion
- Argument from Analogy
- Argument from Cause to Effect
- Argument from Sign
- etc.

Each scheme comes with **Critical Questions**—the challenges any rigorous thinker would raise:

```
Scheme: Argument from Expert Opinion
  Premise: Dr. Smith says X
  Premise: Dr. Smith is an expert in domain D
  Conclusion: X is true

  Critical Questions (auto-generated):
  - Is Dr. Smith credible?
  - Is X within Dr. Smith's domain of expertise?
  - Does Dr. Smith have relevant bias?
  - Do other experts disagree?
```

Arguments compose into **ArgumentChains** (serial, convergent, linked, divergent) and participate in **Dialogue** with tracked moves:

| Move Type | Example |
|-----------|---------|
| ASSERT | "I claim that X" |
| WHY | "What's your basis for X?" |
| GROUNDS | "Here's the evidence for X" |
| CONCEDE | "I accept X" |
| RETRACT | "I withdraw my claim that Y" |

**Commitment stores** track what each participant is committed to at any point. When someone challenges a claim, the system enforces response—challenges cannot be silently ignored.

### Layer 3: Outputs & Artifacts

Deliberations produce durable artifacts:

- **Thesis documents** — composed from argument structures with live/pinned blocks
- **Knowledge Base pages** — persistent institutional memory
- **Debate sheets** — exportable argument summaries
- **AIF graphs** — standard format for interoperability with academic tools

These artifacts cite back to the deliberation. Future work can reference specific claims, see their status, and trace their grounds.

---

## Key Technical Capabilities

### ASPIC+ Defeasible Reasoning

Full implementation of the ASPIC+ framework:

- **Strict vs. defeasible rules** — distinguish certain inferences from presumptive ones
- **Typed attacks** — Rebut (challenge conclusion), Undercut (challenge inference), Undermine (challenge premise)
- **Preference orderings** — resolve conflicts when multiple rules apply
- **Grounded extension computation** — determine which arguments are ultimately defensible

This means: the system can compute acceptability. Given an argument graph with attacks, it determines which arguments survive under formal semantics.

### Stacks & Evidence Library

Document management integrated with the deliberation engine:

- PDF upload with annotation
- DOI/ISBN resolution for citations
- Quote linking with page/paragraph specificity
- Source quality tracking across deliberations
- Stacks can host their own deliberations

### Plexus Cross-Room Network

Deliberations don't exist in isolation. Plexus visualizes how they connect:

- **Transport functors** — import arguments between rooms with full provenance
- **Edge types** — cross-references, overlaps, shared sources, shared authors
- **Institutional memory** — see how reasoning spreads and evolves across contexts

When a foundational claim changes status, you can trace which downstream conclusions are affected.

### AIF Compliance

The Argument Interchange Format (AIF) is the academic standard for representing argumentation. Agora is AIF-native:

- I-nodes (information) — claims, evidence
- S-nodes (scheme) — inference patterns
- Full export to AIF 2.0, AIF+, JSON-LD

This enables interoperability with academic argumentation tools and external analysis.

---

## Why This Matters

### The Version Control Analogy

Before Git, code collaboration was painful. Developers emailed patches, maintained conflicting copies, and lost work to merge disasters. Git didn't just add features—it introduced a *data model* (content-addressable trees, DAG of commits) that made collaboration tractable.

Agora does something similar for reasoning:

| Code Collaboration | Reasoning Collaboration |
|--------------------|------------------------|
| Files → commits → branches | Claims → arguments → deliberations |
| Diffs show exactly what changed | Attacks target specific premises |
| Merge conflicts are explicit | Disagreements are typed and trackable |
| History is preserved | Provenance is preserved |
| Anyone can fork and extend | Arguments can be imported and adapted |

### The Accumulation Problem

Knowledge work has an accumulation problem. Each project starts fresh. Institutional memory lives in people's heads and leaves when they do. Prior analyses exist as PDFs that new teams must manually parse.

Agora addresses this by making reasoning artifacts:
- **Addressable** — claims have stable identifiers
- **Composable** — arguments can be imported across contexts
- **Auditable** — full provenance trail
- **Machine-readable** — structured data, not just prose

### The Transparency Demand

Institutions face increasing pressure to justify decisions. "Trust us" no longer works. But current documentation captures conclusions, not reasoning. Agora produces deliberation records that show:
- What evidence was considered
- What alternatives were evaluated
- What objections were raised
- How they were addressed

This is transparency as infrastructure, not transparency as PR.

---

## Who This Is For

### Research Communities

Turn papers into composable claim graphs. Instead of citing entire papers, cite specific claims. See what's contested, what's been challenged, what's survived scrutiny. Build on prior work at the argument level, not just the citation level.

**Roadmap:** Journal club templates, paper response workflows, ORCID integration, semantic claim search.

### Institutional Teams

Capture reasoning that transfers across teams and survives personnel changes. When one group completes an analysis, another group facing a similar question can import the structure—adopting what survives scrutiny, forking what doesn't.

**Roadmap:** Organization model, cross-institutional import, compliance-ready audit trails.

### Civic/Community Deliberation

Move from circular debate to cumulative knowledge. Complex questions—climate policy, public health, technology governance—require sustained reasoning that current platforms undermine. Agora provides structure for productive disagreement.

**Roadmap:** Public deliberation templates, progressive formalization from informal to formal.

---

## Current State

**Deployment:** Closed alpha with active deliberations.

**Implemented:**
- Claims & Evidence layer (complete)
- Arguments & Dialogue layer (complete)
- ASPIC+ with grounded extension computation
- 60+ Walton schemes with critical questions
- Stacks/Library document management
- Plexus cross-room visualization
- Knowledge Base and Thesis output
- AIF export (2.0, AIF+, JSON-LD)

**In Progress:**
- Preferred/stable semantics (beyond grounded)
- Cross-room import UI (API functional)
- Mobile optimization

**Stack:**
- Next.js 14 / React 18 / TypeScript
- PostgreSQL with Prisma
- Redis (Upstash) for caching/queues
- Pinecone for embeddings/semantic search
- AWS infrastructure

---

## The Bet

The bet is that **reasoning infrastructure is underbuilt**.

We have sophisticated tools for code (Git, GitHub, CI/CD), for documents (Notion, Google Docs), for communication (Slack, Discord). But for the actual structure of reasoning—the claims, the inferences, the challenges, the resolutions—we have nothing.

Groups that need to think together rigorously are forced to use tools designed for chat or prose. The result: reasoning that scatters, conclusions that can't be audited, knowledge that doesn't accumulate.

Agora is an attempt to fill this gap. Not as a social platform, not as a note-taking tool, but as **infrastructure**—the substrate on which structured deliberation becomes possible.

---

*This document is intended for technical peers evaluating the project. For user-facing materials, see the landing page. For deep implementation details, see the architecture documentation.*

----

Digital Agora: Infrastructure for Collective Reasoning
January 2026

The Core Claim
Reasoning has structure. When people deliberate—weighing evidence, challenging inferences, resolving disagreements—they produce something with a shape: claims that depend on other claims, arguments that can be attacked at specific steps, conclusions that follow (or fail to follow) from premises.
Current tools destroy this structure. Chat produces sequences. Documents produce prose. Neither preserves the graph.
The result is predictable. Six months after a decision, no one can reconstruct why it was made. The premises that seemed compelling, the alternatives that were rejected, the objections that were raised and addressed—all of it has scattered across threads, docs, and memory. New team members start over. Prior work cannot be cited. Knowledge fails to accumulate.
Agora treats reasoning as a first-class data structure. Claims become addressable objects. Arguments follow typed patterns. Disagreements are explicit and trackable. The goal: make group reasoning composable, auditable, and durable—in the way version control made code collaboration tractable.

How It Works
Layer 1: Claims and Evidence
Informal discussion produces propositions—things people say. When a proposition matters, it gets promoted to a claim: a canonical assertion with a stable URI, typed relationships to other claims, and explicit links to supporting evidence.


Proposition: "I think we should use Postgres"
     ↓ promote
Claim #247: "PostgreSQL is the appropriate database choice"
     ├── supports: Claim #201 (system requirements)
     ├── attacks: Claim #198 (MongoDB proposal)
     └── evidence: [benchmark doc, cost analysis]
Every claim carries provenance (who, when, where) and maintains its relationships as the deliberation evolves.
Layer 2: Arguments and Dialogue
Claims connect into arguments—premise-conclusion structures annotated with reasoning patterns. We implement sixty-plus schemes from Walton's taxonomy: argument from expert opinion, argument from analogy, argument from cause to effect, and so on.
Each scheme comes with critical questions—the challenges any rigorous interlocutor would raise:


Scheme: Argument from Expert Opinion

  Premise: Dr. Smith asserts X
  Premise: Dr. Smith is expert in domain D
  Conclusion: X is likely true

  Critical Questions:
  ├── Is Dr. Smith credible?
  ├── Does X fall within D?
  ├── Does Dr. Smith have conflicts of interest?
  └── Do other experts disagree?
Arguments compose into chains (serial, convergent, linked, divergent) and participate in dialogues with formally tracked moves: assert, challenge, concede, retract. Commitment stores track what each participant has committed to. Challenges cannot be silently ignored.
Layer 3: Outputs
Deliberations produce durable artifacts: thesis documents, knowledge base pages, exportable debate sheets. These artifacts cite back to the deliberation. Future work can reference specific claims, inspect their status, and trace their grounds.

The Technical Core
Most "argument mapping" tools are boxes and arrows—visual aids without computational semantics. Agora is different. It implements ASPIC+, a formal framework for defeasible reasoning:
Strict vs. defeasible rules. Some inferences are certain; others hold only absent contrary evidence. The system distinguishes them.
Typed attacks. Rebuttals challenge conclusions. Undercuts challenge inference steps. Undermines challenge premises. Each requires different responses.
Preference orderings. When multiple rules conflict, explicit preferences resolve the contradiction.
Computable acceptability. Given an argument graph with attacks and preferences, the system computes which arguments survive—not as opinion, but as a function of structure.
This matters because it means the system can answer questions like: "If we accept this new evidence, which of our conclusions still hold?" That's not a feature most collaboration tools offer.

Why Version Control Is the Right Analogy
Before Git, code collaboration was painful. Developers emailed patches, maintained conflicting copies, and lost work to merge disasters. Git introduced a data model—content-addressable trees, a directed acyclic graph of commits—that made collaboration tractable at scale.
Code (Git)	Reasoning (Agora)
Files → commits → branches	Claims → arguments → deliberations
Diffs show exactly what changed	Attacks target specific premises
Merge conflicts are explicit	Disagreements are typed and trackable
History is preserved	Provenance is preserved
Fork and extend	Import and adapt
The analogy isn't perfect, but the structural point holds: certain kinds of collaboration only become tractable once you have the right data model. For code, that was commits and branches. For reasoning, it's claims, arguments, and typed attacks.

What This Enables
Accumulation. When one team completes an analysis, another team facing a similar question can import the argument structure—adopting what survives scrutiny, forking what doesn't. Knowledge compounds instead of starting fresh.
Auditability. Deliberation records show what evidence was considered, what alternatives were evaluated, what objections were raised, and how they were addressed. This is transparency as infrastructure, not as PR.
Interoperability. Agora exports to the Argument Interchange Format (AIF), the academic standard. Arguments can move between systems. Analysis can be performed externally.
Institutional memory that doesn't walk out the door. The structure of past decisions persists independent of the people who made them.

Current State
Deployed: Closed alpha with active deliberations.
Complete:
* Claims and evidence layer
* Arguments and dialogue layer
* ASPIC+ with grounded extension computation
* 60+ Walton schemes with critical questions
* Document management with PDF annotation, DOI/ISBN resolution
* Cross-room visualization (Plexus)
* Knowledge base and thesis output
* AIF export (2.0, AIF+, JSON-LD)
In progress:
* Preferred/stable semantics (beyond grounded)
* Cross-room import UI (API functional)
* Mobile optimization
Stack: Next.js 14, React 18, TypeScript, PostgreSQL/Prisma, Redis, Pinecone, AWS.

The Bet
We have sophisticated infrastructure for code: version control, CI/CD, code review. We have capable tools for documents and communication. But for the structure of reasoning itself—the claims, the inferences, the challenges, the resolutions—we have essentially nothing.
The bet is that this gap matters. That organizations trying to think together rigorously deserve better than chat threads and Google Docs. That reasoning infrastructure is systematically underbuilt, and that building it will make certain kinds of collaboration possible that currently aren't.
Agora is that infrastructure.

For user-facing materials, see the landing page. For implementation details, see the architecture documentation.
