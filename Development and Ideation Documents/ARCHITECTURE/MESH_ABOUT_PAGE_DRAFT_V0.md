# Mesh About Page — Draft Copy

---

## Hero / Opening

**Mesh is a platform for productive online discourse.**

Online software for structuring discourse and preserving reasoning—a substrate for turning conversations into knowledge that compounds.

Mesh combines the affordances of social feeds, threaded communities, chat rooms, publishing tools, and curated libraries—while adding an on-demand path to formal deliberation. Articles and stacks act as deliberation hosts; discussions and rooms provide low-friction entry points; citations attach evidence to claims; and reasoning compounds across contexts. The system produces durable, citable, and exportable artifacts rather than ephemeral threads, enabling communities to build shared knowledge instead of reinventing the wheel each time.

---

Researchers, analysts, policy teams, and what we call serious reasoners—people who need their arguments to hold up under scrutiny and their evidence to stay attached—have been the early adopters we've built for.

People describe Mesh as "version control for arguments" or "a place where debates actually go somewhere." If this resonates, try it now:

[Get started →]

---

## The problem we solve

Online discourse has become the default medium for institutional reasoning. Organizations decide policy in comment threads, build strategy in chat logs, and litigate technical questions in issue discussions and social feeds. The tools work well enough for communication, but they suffer from the inherent weaknesses of a text-based model.

**Text streams are not reasoning artifacts.**

Email threads, forum replies, and chat messages flatten argument into chronology. Claims become buried inside paragraphs. Evidence becomes a link without a stable relationship to the statement it is meant to support. Disagreements recur because there is no canonical object to reference—only another message to quote. And when a dispute happens, participants cannot easily specify what they disagree with: the premise, the inference, or the conclusion.

The modern discourse stack has fragmented into specialized platforms: longform publishing, fast social feeds, chat servers, collaborative "libraries," and separate deliberation or education tools. Each provides part of the solution, but the main benefits are lost if the system cannot preserve and compose reasoning across contexts. A reader can follow a link from an essay into a comment thread, then into a chat log, then into a separate document—but the result is still a pile of text.

| Problem | What Happens | What It Costs |
|---------|--------------|---------------|
| **No shared structure** | Ideas exist as prose, not as claims with explicit relationships | Disagreements become rhetorical battles rather than structured analysis |
| **Evidence is disconnected** | Sources live in attachments, footnotes, or separate documents | No way to trace a claim back to its grounds, or see what depends on disputed evidence |
| **Discourse doesn't persist** | Threads are consumed and forgotten | Every new discussion rebuilds context from scratch |
| **Arguments can't travel** | Good reasoning is trapped in the context where it was created | Knowledge doesn't scale—only attention does |

---

## How Mesh works

Mesh treats reasoning as infrastructure. Instead of storing discourse as unstructured text, Mesh represents it using an ontology of typed entities—claims, arguments, sources, citations, and dialogue moves—so that assertions can be grounded in evidence, disputes can be localized to premises versus inference versus conclusion, and deliberations can yield durable outputs.

The system is **progressively formalized**: participants can begin with casual discussion and upgrade, when needed, into formal deliberation without changing tools or losing provenance.

### The upgrade path

```
   Casual Discussion
         │
         ▼
   Propositions (with evidence)
         │
         ▼
   Claims (canonical, citable)
         │
         ▼
   Arguments (scheme-based, attackable)
         │
         ▼
   Thesis Documents, KB Pages, Briefs
```

At each level, Mesh adds structure only when it pays for itself. Most conversations stay informal. But when a thread becomes consequential—when you need to isolate a disagreement, cite sources precisely, or produce a decision artifact—the system supports upgrading the same content into formal deliberation.

---

## Pricing & Features

### All plans include

- **Write and publish longform articles** with inline deliberation and DOM-anchored annotation threads
- **Build evidence libraries** with curated stacks and automatic source deduplication via SHA-1 fingerprinting
- **Discussions that span chat and forum modes** in one unified container with real-time presence and typing indicators
- **Upgrade any conversation into structured deliberation** using the Deliberate button—claims, arguments, and dialogue moves are seeded automatically
- **Export reasoning** as briefs, argument graphs, knowledge base pages, or thesis documents
- **Polymorphic citations** that attach to claims, arguments, comments, or dialogue moves—not just posts
- **Scheme-based argumentation** using Walton-style patterns with critical questions surfaced as vulnerability points
- **Use our API** to integrate discourse artifacts elsewhere—all structures conform to the Argument Interchange Format (AIF) for interoperability

### Premium

- Unlimited sources and citations
- Advanced argument search and filtering across all deliberations
- Full thesis composition tools with live-linked claims and arguments
- Cross-deliberation transport (move arguments between rooms with provenance tracking)
- Virtual and materialized imports with idempotent fingerprint verification
- Dempster-Shafer confidence intervals and multi-mode aggregation
- Argument chains with cycle detection and critical path analysis
- ASPIC+ theory evaluation with grounded semantics and rationality postulate checking
- Priority support
- Early access to new surfaces

### Free

- A good way to test Mesh
- Up to [X] sources and [Y] deliberations
- Core publishing, library, and discussion features
- Basic argumentation and claim management

---

## Think with structure

New conclusions rarely emerge from a single thread. Reasoning that holds up requires collaboration, evidence, and the ability to build on prior work. Mesh provides the infrastructure for discourse that compounds rather than dissipates.

**Structured claim management** — Claims are canonical objects with stable identifiers. You can see what supports a claim, what attacks it, and what evidence it rests on. When someone challenges a claim, the challenge is explicit and typed: is it a rebuttal (attacking the conclusion), an undercut (attacking the inference), or an undermine (attacking a premise)?

**Dialogue as provenance** — Arguments don't exist as free-floating objects. They arise as moves in a dialogue. The system records who said what, when, and in reply to what. Every assertion, challenge, concession, and retraction is tracked with provenance.

**Evidence that binds** — Sources are deduplicated and canonical. Citations attach polymorphically to multiple entity types (claims, arguments, comments, dialogue moves). Evidence accrues at the deliberation level and can be audited as a whole—not just post by post.

**Outputs that persist** — Deliberations produce artifacts: debate sheets, argument graphs, argument chains, thesis documents, knowledge base pages, and generated briefs. These artifacts link back to the underlying reasoning graph, so updates propagate while preserving provenance.

---

## Surfaces

Mesh is not a single tool. It is an ecosystem of interoperating surfaces, each designed as an entry point into the same structured discourse substrate.

### Articles

Longform publishing that can host structured deliberation. Write rich, magazine-quality articles using a TipTap-based editor with full typography controls, LaTeX math, and media embedding. Publish to a social feed where your article becomes discoverable. Readers can attach discussion directly to passages via anchored threads—comments remain structurally positioned and therefore upgradeable.

Each article is deliberation-native. When discourse around an article needs formal structure, spawn a deliberation directly from the article context. The article provides a stable "place" where informal commentary can be progressively formalized into claims and arguments.

**Key capabilities:**
- Draft → edit → autosave → publish lifecycle with revision history
- DOM-anchored comment threads attached to text selections
- Integration with the home feed as an ARTICLE post type
- Automatic deliberation hosting via `hostType: "article"`

### Library & Stacks

Collect sources, deduplicate automatically, and cite into any context. Stacks are curated collections of PDFs, links, notes, and other documents—not just folders, but a curation surface tightly coupled to deliberation.

Sources can originate from URLs, DOIs, or uploaded documents. Each source is normalized and fingerprinted (SHA-1 over canonical identifiers) to prevent duplicates. Citations attach to claims, arguments, comments, or dialogue moves via a polymorphic targeting system.

**Key capabilities:**
- Upload and organize PDFs with automatic thumbnail generation
- One-click "quick cite" or detailed citation with locator, quote, and note
- Evidence aggregation across entire deliberations—see which sources are used, how often, and by whom
- "Lift to debate" flow that promotes a stack comment into a claim with a recorded ASSERT move
- Stacks can host deliberations directly via `hostType: "library_stack"`

### Discussions

A hybrid of chat and forum. Fast coordination when you need it, threaded depth when you don't, and an upgrade path to deliberation when complexity warrants.

The Discussion surface spans two regimes in a single container: real-time chat (Messages) and threaded forum posts (ForumComments). Content can flow between modes—quote a chat message into a forum post, or spawn a "drift" (side-thread) to capture a tangent without derailing the main conversation.

**Key capabilities:**
- Dual-mode interaction with seamless tab switching between Chat and Forum panes
- Real-time presence and typing indicators via Supabase channels
- Cross-mode replies: the conversation graph reflects actual structure, not UI artifacts
- Drifts for side-conversations that can be resolved and summarized back
- Deliberate button that upgrades a discussion to full formal deliberation

### Deliberation (Agora)

The formalization target. Spawn a deliberation from any host context—articles, stacks, discussions, rooms—and produce structured artifacts.

Agora treats reasoning as infrastructure. It provides structured claim management, scheme-based argumentation (60+ Walton schemes with critical questions), dialogue protocol enforcement, and composable outputs.

The deliberation engine is organized into three layers:

| Layer | Purpose | Key Artifacts |
|-------|---------|---------------|
| **Claims & Evidence** | Transform informal ideas into canonical, evidence-linked assertions | Propositions, Claims, ClaimEdges, Evidence |
| **Arguments & Dialogue** | Structure reasoning with premises, conclusions, schemes, and tracked moves | Arguments, ArgumentChains, DialogueMoves, Commitments |
| **Outputs & Artifacts** | Compose reasoning into publishable, citable documents | Thesis, TheoryWorks, KbPages, DebateSheets, Briefs |

All structures conform to the **Argument Interchange Format (AIF)** ontology, enabling interoperability with academic argumentation tools. The argument graph distinguishes:
- **I-nodes** for informational content (claims/propositions)
- **RA-nodes** for inference application
- **CA-nodes** for conflict/attack relations
- **PA-nodes** for preference/ordering
- **DM-nodes** for dialogue moves

**Attack taxonomy:**
- **Rebut** — Attack the conclusion directly
- **Undercut** — Attack the inference step (the reasoning link)
- **Undermine** — Attack a supporting premise

**Key capabilities:**
- Canonical claim management with typed relationships
- Scheme-based arguments with automatically surfaced critical questions
- ASPIC+ theory evaluation with grounded semantics
- Argument chains with cycle detection, critical path analysis, and strength aggregation
- Confidence measures including Dempster-Shafer intervals with belief/plausibility
- Thesis composition with live-linked claims and arguments
- Debate sheets for visual argument mapping
- Knowledge base pages (block-based, live-linked)
- Generated briefs and exportable AIF graphs

### Discovery (Plexus)

A meta-level network connecting deliberations through shared evidence, cross-references, and imported arguments. See how reasoning relates across contexts.

Plexus treats deliberations as nodes in a higher-level structure. It supports discovery ("where has this claim been debated?"), reuse ("import arguments from a related room"), and consistency checking ("which rooms reached conflicting conclusions?").

**Edge types connecting deliberations:**
| Edge Kind | Source of Truth |
|-----------|-----------------|
| `xref` | Explicit cross-reference between rooms |
| `overlap` | Shared canonical claim identity |
| `stack_ref` | Shared knowledge stack reference |
| `imports` | Imported arguments with provenance |
| `shared_author` | Shared contributors |

**Transport mechanism:**
Arguments can be transported between deliberations with their structure and lineage intact. The transport workflow:
1. Map claims between rooms (A → B)
2. Preview import proposals with idempotent fingerprints
3. Apply (materialize) imports in a transaction with provenance recording

Imported arguments carry lineage back to their source deliberation and are represented as objects that can be challenged, supported, or re-evaluated in the target room.

**Key capabilities:**
- Network visualization in graph, board, and matrix views
- Explicit cross-reference linking between deliberation rooms
- Virtual imports (read-only references) and materialized imports (local copies)
- Provenance tracking via RoomFunctor mappings and ArgumentImport records
- Discovery informed by reasoning structure, not just engagement signals

---

## The premise

### Reasoning should be addressable

A claim buried in a paragraph cannot be challenged precisely. A citation pasted as a link cannot be reused elsewhere. A disagreement expressed as "I disagree" cannot be resolved.

Mesh treats statements, evidence, and arguments as objects—first-class entities with stable identifiers and typed relationships. You can reference them, contest them, and build on them without ambiguity. When you challenge a claim, the system records whether you're attacking the conclusion, the inference, or a premise. When you cite evidence, the citation attaches directly to the claim it supports—not to a post that might also contain other claims.

### Evidence should bind to claims

In most platforms, citations are decorative—a URL dropped into a comment, an inline quote without a canonical source object. The evidence is present, but it isn't structured. You can't see what depends on a disputed source. You can't trace a claim back to its grounds.

In Mesh, sources are deduplicated and canonical. When you upload a PDF or paste a URL, the system normalizes and fingerprints it to prevent duplicates. Citations attach polymorphically—to claims, arguments, comments, or dialogue moves—not just posts. Evidence accrues at the deliberation level and can be audited as a whole: which sources were used, how often, by whom, and with what quality ratings.

### Conversation should be able to upgrade

Most discussions stay informal, and that's fine. The system imposes minimal structure at the moment of writing. A conversation can remain casual, fast, and human.

But when a thread becomes consequential—when you need to isolate a disagreement, cite sources precisely, or produce a decision artifact—Mesh lets you upgrade the same content into structured deliberation without switching tools or losing provenance. A chat message can be promoted to a forum post. A forum comment can be lifted into a deliberation claim. A claim can be developed into a scheme-based argument. The original discourse remains as provenance.

This is progressive formalization: structure emerges on-demand as discourse complexity increases, rather than being imposed upfront.

### Arguments should travel

A good argument shouldn't have to be rewritten every time it's relevant. When a team spends months analyzing a question, that analysis shouldn't disappear when the project ends. Future teams facing similar questions should be able to find, reference, and extend that work.

Mesh supports transporting arguments between deliberations with their structure and lineage intact. You can import an argument from one room into another, and the system tracks where it came from. The imported argument can be challenged, supported, or re-evaluated in the new context—while its provenance remains visible.

Reasoning compounds across contexts rather than resetting per thread.

---

## The goal

The goal is not winning debates. The goal is not engagement metrics. The goal is not virality.

The goal is producing reasoning that holds up—conclusions that can be traced back to evidence, arguments that can be evaluated and extended, institutional memory that persists beyond any single conversation.

Mesh is built for communities that need to make decisions together, analyze complex questions, or build shared understanding over time. The long-term payoff is institutional memory: a system where conclusions can be traced back to evidence and where strong arguments can be transported forward rather than rewritten from scratch.

---

## Long-term vision

Mesh has [X] founders. Currently, a small team is building the platform: [names and roles].

The company building Mesh is independent and sustained entirely by our members. Our only business is to make Mesh an experience worth paying for. The people who use it are our only customers.

[X] people support Mesh through their Premium subscriptions.

We are building discourse infrastructure for the long term. The platform is designed so that reasoning compounds—and so do the tools. Each surface we add speaks to the same underlying substrate. Each export format we support makes the reasoning graph more portable. Each integration we build makes structured discourse more accessible.

---

## Business model

We've worked to align our business model with the people who use Mesh. We focus on making Mesh a place that produces utility, clarity, and durable outputs—not engagement metrics.

We ask our members to pay a subscription to help us maintain and grow the platform. In exchange for your support, we offer unlimited sources, full deliberation capabilities, cross-room transport, and a growing set of tools for structured reasoning.

**We are not optimizing for time-on-site. We are optimizing for reasoning that holds up.**

The platforms where public discourse occurs are typically optimized for attention capture, not deliberation. The result is predictable: polarization accelerates, trust erodes, and institutions lose the ability to justify their decisions to the publics they serve. This is not a content moderation problem. It is an infrastructure problem.

Mesh is built on a different premise: that the value of a platform should be measured by the quality of the reasoning it enables, not the quantity of the attention it captures. Our revenue comes from members who find the platform useful, not from advertisers who want access to those members.

Currently, [X] people support our mission to build a self-sustained community for structured knowledge production. We rely on no external funding.

---

## Roadmap

Here you can see what we've shipped recently, what we're building next, and how we're doing as a company. By sharing this information we aim to demystify the process of working on an independent platform for discourse infrastructure.

We're working to build a space that's rigorous, accountable, and useful to our members. This is meant to be as transparent as reasonably possible. If there's something you don't see here that you'd like to know, just email us: [email].

### Road to sustainability

Mesh's mission is to build discourse tools where reasoning compounds rather than dissipates. Since we're accountable only to our members, our incentive is always to build a tool that fosters clear thinking and genuine deliberation.

**Today**
- $[X] Monthly recurring revenue
- [X] Monthly active members
- [X] Total deliberations created
- [X] Total paying members

**Goal by [Date]**
- $[X] Monthly recurring revenue

### Expenses

Currently this is how our expenses are distributed relative to our $[X] monthly revenue:

- [X]% Salaries
- [X]% Taxes
- [X]% Hosting, servers, and infrastructure
- [X]% Software and third-party services
- [X]% Legal, compliance, and other

### Product Plan

**In progress**
- [Feature 1]
- [Feature 2]
- [Feature 3]

**Completed**
- Progressive formalization pipeline (Discussion → Proposition → Claim → Argument → Thesis)
- Dual-mode discussions (Chat + Forum with cross-mode bridging)
- Evidence library with source deduplication and polymorphic citations
- Scheme-based argumentation with 60+ Walton schemes and critical questions
- ASPIC+ theory evaluation with grounded semantics
- Argument chains with graph analysis
- Thesis composition with live-linked claims
- Debate sheets for visual argument mapping
- Plexus network visualization
- Cross-deliberation transport with provenance tracking
- AIF-compliant argument graph export

---

## Technical architecture

Mesh is implemented as an ecosystem of interacting surfaces sharing a common substrate. The system is built on:

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Editor:** TipTap v2 (ProseMirror-based) for rich text editing
- **Backend:** Next.js API Routes, Server Actions
- **Database:** PostgreSQL via Prisma ORM
- **Storage:** Supabase Storage for documents and thumbnails
- **Real-time:** Supabase Realtime channels for presence, typing, and message broadcasting
- **State Management:** Zustand, SWR

**Interoperability:**
All argument structures conform to the Argument Interchange Format (AIF), enabling export to and import from academic argumentation tools. The deliberation layer uses AIF node types:
- I-nodes (Information): claims and propositions
- RA-nodes (Rule Application): inference steps
- CA-nodes (Conflict Application): attack relations
- PA-nodes (Preference Application): ordering and preference
- DM-nodes (Dialogue Move): dialogue protocol tracking

**Formal foundations:**
- Walton argumentation schemes for scheme-based reasoning
- ASPIC+ for structured argumentation with preferences and incomplete information
- Dempster-Shafer theory for belief/plausibility confidence intervals
- Dung abstract argumentation frameworks for extension semantics

---

## Team

[Team member names, roles, and brief descriptions]

You can reach us at [email] and one of us will respond.

---

## Testimonials

*[Placeholder for user quotes]*

"Finally, a place where the argument structure survives the conversation."

"It's like having institutional memory that actually works."

"Version control for reasoning."

---

## Contact & Support

Find questions and answers in our Help Center.
For support questions, email us at [help email].
Find us on [social platform].

Community Guidelines
Terms of Use
Privacy Policy

---

## Colophon

This site is built with Next.js, React, and TypeScript.
Our typeface is [typeface], created by [foundry].

---

*End of draft*