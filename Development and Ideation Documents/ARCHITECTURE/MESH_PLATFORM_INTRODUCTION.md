# Mesh: Reasoning Infrastructure for Groups

## The Core Idea

**What if your discussions produced more than chat logs?**

Every organization faces the same challenge: important conversations happen, good ideas emerge, disagreements surface — and then it all disappears into a thread that no one will read again. Six months later, the same discussion happens again. The same points get made. The same disagreements repeat.

Mesh changes this by making reasoning *visible* and *durable*.

When you make a claim on Mesh, it becomes a persistent object with relationships to other claims. When you build an argument, its structure is explicit — premises, conclusion, and the justification pattern that connects them. When you disagree, the system tracks the challenge and helps you respond systematically. Over time, your discussions build a knowledge graph that compounds rather than dissipates.

**Mesh is reasoning infrastructure — traceable claims, visible arguments, discussions that produce artifacts you can search, cite, and build upon.**

---

## What Makes This Different

### Claims You Can Point To

Every important assertion becomes a **canonical claim** with a stable identifier. Instead of "I think someone said something about this in that meeting," you have a citable object that links to its evidence, its author, and its relationships to other claims.

### Arguments You Can See

Arguments aren't just text — they have **visible structure**. Premises lead to conclusions through recognized patterns. When you look at an argument, you see its skeleton: what it assumes, what it concludes, and what would challenge it.

### Disagreement That Goes Somewhere

When someone challenges a claim, that challenge is **typed and tracked**. Are they attacking the evidence? The reasoning? The relevance? Different challenges require different responses. The system surfaces what's actually contested so discussions converge instead of circling.

### Discussions That Produce Artifacts

Deliberations don't just end — they **produce outputs**: thesis documents with cited reasoning, knowledge base pages that persist, argument graphs that can be analyzed and extended. What your team figures out this quarter is available to next quarter's team.

---

## How It Works

Mesh implements a **progressive formalization** architecture. You start with the simplicity you need, and structure emerges as complexity demands it.

```
LIGHTWEIGHT                                           FORMAL
    │                                                    │
    ▼                                                    ▼
┌─────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ Casual  │───▶│ Structured  │───▶│ Scheme-Based │───▶│ Full Theory │
│ Discuss │    │ Claims      │    │ Arguments    │    │ Evaluation  │
└─────────┘    └─────────────┘    └──────────────┘    └─────────────┘
                                         
 Propositions   Canonical        Walton schemes,     ASPIC+ preferences,
 & chat         claims with      critical questions, acceptability
                evidence links   attack types        semantics
```

A casual discussion stays casual. A policy deliberation can upgrade to full formal reasoning with typed attacks, scheme-based arguments, and commitment tracking. The same platform serves both — you only encounter complexity when you need it.

---

## The Three Layers

Mesh organizes reasoning into three conceptual layers:

| Layer | What Happens | What You Get |
|-------|--------------|--------------|
| **Claims & Evidence** | Transform informal ideas into canonical, evidence-linked assertions | Traceable claims with stable identifiers and source links |
| **Arguments & Dialogue** | Structure reasoning with premises, conclusions, and tracked moves | Visible argument chains with typed challenges and responses |
| **Outputs & Artifacts** | Compose reasoning into publishable, citable documents | Thesis documents, knowledge pages, exportable graphs |

Each layer builds on the previous. You can stop at any layer depending on your needs.

---

## For Different Audiences

### For Teams Making Decisions

Your best thinking deserves better tools. When your team spends weeks analyzing a question, that analysis shouldn't disappear into meeting notes. Mesh captures the structure — what was claimed, what evidence supported it, what was challenged and resolved — so future decisions can build on past reasoning.

**What you get:** Defensible decisions with audit trails. Institutional memory that compounds.

### For Policy & Governance

Decisions need to be both *defensible* (grounded in evidence and reasoning) and *explicable* (the reasoning needs to be visible to stakeholders). Mesh addresses both: when you publish a decision, you can link directly to the supporting reasoning. When stakeholders challenge, you can point to the specific argument and the specific evidence.

**What you get:** Deliberation with receipts. Transparency infrastructure for an era that demands accountability.

### For Researchers & Analysts

The gap between argumentation research and practical tools has persisted for decades. Mesh bridges it: we implement AIF-compliant argument graphs, Walton scheme recognition, ASPIC+ preference ordering, and dialogue move tracking — all in a production platform. Export graphs to standard formats. Integrate with analysis tools.

**What you get:** Applied argumentation that actually works. A living laboratory for research.

### For Communities

Community discussions often feel like they go in circles. Mesh gives structure: when someone makes a point, it becomes a claim others can support or question. Over time, your discussions build a knowledge base. New members can see the history. The community's collective intelligence compounds.

**What you get:** Discussions that build, not just repeat.

---

## The Technical Foundation

Mesh is built on established argumentation science — not our invention, but decades of research made practical:

| Foundation | What It Provides |
|------------|-----------------|
| **Argument Interchange Format (AIF)** | Standard ontology for representing arguments, enabling interoperability and export |
| **Walton Argumentation Schemes** | 60+ recognized reasoning patterns with automatically generated critical questions |
| **ASPIC+ Framework** | Formal semantics for defeasible reasoning with preferences and acceptability |
| **Dialogue Game Theory** | Protocols for structured dialogue with commitment tracking (Walton-Krabbe) |

This grounding means:
- Arguments can be analyzed with formal tools
- Reasoning graphs can be exported and verified independently
- The platform implements established standards, not ad-hoc structures

---

## Key Capabilities

### Claim Management
- Canonical claims with stable identifiers
- Evidence linking with source types
- Typed relationships (supports, contradicts, specifies)
- Version history and provenance

### Argument Construction
- Premise-conclusion structures with explicit inference
- Scheme annotation with 60+ recognized patterns
- Automatic critical question generation
- Confidence and uncertainty tracking

### Dialogue Tracking
- Every move recorded: assert, challenge, concede, retract
- Per-participant commitment stores
- Proponent/opponent role tracking
- Time-travel queries ("what was committed at time T?")

### Attack & Defense
- Typed attacks: rebut, undercut, undermine
- Attack suggestions based on scheme vulnerabilities
- Resolution tracking and status
- Conflict visualization

### Output Generation
- Thesis documents with inline citations
- Knowledge base pages for institutional memory
- Exportable argument graphs (AIF format)
- Debate sheets for comparison

### Formal Evaluation
- ASPIC+ theory construction
- Preference ordering for conflict resolution
- Acceptability semantics (grounded, preferred, stable)
- Contradiction detection

---

## Ways to Think About It

Mesh is new infrastructure, which means existing categories don't quite fit. Here are some lenses that might help:

### "Git for Belief"
Like version control for code, but for reasoning. Every dialogue move is a commit. Scopes are branches. Attacks are merge conflicts. Thesis output is a release. You never lose the history of how you got here.

### "A Collective Exocortex"
Individuals have brains that remember, reason, and revise. Groups don't — they have meetings that are forgotten and documents that are static. Mesh gives groups the cognitive capabilities individuals take for granted.

### "Slow Media"
In a world optimized for outrage and virality, we optimize for depth and resolution. No infinite scroll. No engagement metrics. Just structured reasoning that takes as long as it takes.

### "A Laboratory for Ideas"
Not just a place to share ideas but to *test* them. Every claim can be challenged. Every argument exposes its assumptions. Ideas that survive the laboratory are stronger for it.

---

## What's Surprising

A few things that distinguish Mesh from what you might expect:

**Disagreement is a feature, not a bug.**
We build attack/defense into the core model. Most tools try to minimize conflict; we formalize it because structured disagreement is how reasoning improves.

**We make you commit.**
Commitment stores track what you've publicly asserted. You can't just argue casually — you're accountable for your positions. This changes how people engage.

**Arguments have types.**
Not all arguments are the same. A causal argument has different vulnerabilities than an argument from authority. Schemes make this explicit — and expose the right questions to ask.

**The conversation *is* the document.**
Dialogue moves directly compose into publishable artifacts. There's no separate "write-up" phase where structure gets lost.

---

## Getting Started

Mesh works at multiple scales:

| Scale | Use Case | Complexity |
|-------|----------|------------|
| **Individual** | Organize your own reasoning on a complex question | Low |
| **Team** | Structure a decision process with traceable claims | Medium |
| **Organization** | Build institutional memory across projects | Medium-High |
| **Community** | Deliberate on shared questions with accountability | High |

Start with a question that matters. Create claims for the key positions. Build arguments connecting them. See what challenges emerge. Let the structure guide you toward resolution — or toward a clearer understanding of where the real disagreements lie.

---

## Summary

**Mesh is reasoning infrastructure for groups.**

- **Traceable claims**: Every assertion has an identifier, an author, and links to evidence
- **Visible arguments**: Structure is explicit — premises, conclusions, and the patterns connecting them  
- **Tracked dialogue**: Every move is recorded with type, actor, and target
- **Durable artifacts**: Discussions produce searchable, citable, extendable knowledge

Built on established argumentation science. Designed for progressive formalization. Used for decisions that need to be defensible.

**Your discussions deserve to produce more than chat logs.**

---

## Learn More

| Resource | Description |
|----------|-------------|
| [Technical Architecture](./AGORA_DELIBERATION_SYSTEM_ARCHITECTURE.md) | Full system design documentation |
| [Argumentation Theory Primer](./CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md) | Academic foundations |
| [API Reference](./AGORA_SUBSYSTEMS_ARCHITECTURE.md) | Developer documentation |
| [Visual Guide](./AGORA_VISUAL_REFERENCE_GUIDE.md) | Diagrams and interface walkthrough |

---

*Mesh — where reasoning becomes infrastructure.*
