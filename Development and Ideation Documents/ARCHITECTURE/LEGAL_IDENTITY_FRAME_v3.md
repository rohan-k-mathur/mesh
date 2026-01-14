# Executive Summary Workshop v3

## Overview

This document synthesizes and polishes the work from [v1](EXECUTIVE_SUMMARY_WORKSHOP.md) and [v2](EXECUTIVE_SUMMARY_WORKSHOP_v2.md), informed by deep review of the platform architecture documents. It represents refined, production-ready messaging with the **Legal Deliberation Framework** as the central identity frame.

**Key improvements in v3**:
1. Unified identity around "Legal Deliberation Infrastructure"
2. Platform capabilities mapped systematically to legal concepts
3. Audience-specific messaging grounded in actual system features
4. Refined vocabulary drawing from implemented subsystems
5. Actionable pitch materials ready for use

---

## Document Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXECUTIVE SUMMARY WORKSHOP v3                         │
├─────────────────────────────────────────────────────────────────────────┤
│  PART I: IDENTITY RESOLUTION                                            │
│    1. The Unified Identity: Legal Deliberation Infrastructure           │
│    2. Platform Architecture → Legal Concepts Mapping                    │
│    3. The Three Layers as Legal Process                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  PART II: REFINED MESSAGING                                             │
│    4. Canonical Summaries (Final)                                       │
│    5. Audience-Specific Packages                                        │
│    6. Vocabulary & Anti-Patterns                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  PART III: OPERATIONAL MATERIALS                                        │
│    7. Pitch Deck Content                                                │
│    8. Demo Script (Legal Frame)                                         │
│    9. FAQ & Objection Handling                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  PART IV: STRATEGIC NARRATIVE                                           │
│    10. Origin Story (Final)                                             │
│    11. Vision & Roadmap                                                 │
│    12. Competitive Differentiation                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# PART I: IDENTITY RESOLUTION

## 1. The Unified Identity: Legal Deliberation Infrastructure

### 1.1 The Core Insight

After reviewing the platform architecture, a unifying identity emerges:

> **Mesh/Agora is asynchronous, networked, multiplayer legal discourse infrastructure — the procedural rigor of legal deliberation applied to any domain where reasoning matters, without requiring courtrooms, lawyers, or punitive stakes.**

This identity works because:

1. **Legal systems are humanity's most sophisticated reasoning infrastructure** — centuries of refinement for handling contested claims under genuine uncertainty
2. **The platform already implements legal-analogous structures** — commitment stores (court records), dialogue moves (pleadings), typed attacks (objections), schemes (legal standards), ASPIC+ (judgment)
3. **The legal frame is aspirational but accessible** — everyone understands "audit trail," "defensible decision," "on the record"
4. **It differentiates from chat/wiki/forum** — this is *procedure* for reasoning, not just a place to talk

### 1.2 Identity Statement (Canonical)

**Short form (tagline)**:
> "Legal-grade reasoning infrastructure for any domain"

**Medium form (one-liner)**:
> "Mesh brings the procedural rigor of legal deliberation to any context where reasoning matters — traceable claims, typed challenges, defensible conclusions."

**Full form (elevator pitch)**:
> Legal systems evolved humanity's most sophisticated tools for reasoning under disagreement: typed challenges, evidentiary standards, burden allocation, precedent, and authoritative record-keeping. These tools remain locked in courtrooms.
>
> Mesh liberates them. We provide the procedural infrastructure of legal deliberation — without the courtroom, the lawyers, or the punitive stakes. Every claim is on the record. Every argument can be challenged with typed objections. Every conclusion traces to the reasoning that produced it.
>
> The result: groups can deliberate on any topic — policy, strategy, ethics, governance — with the rigor that legal systems provide.

### 1.3 Why "Legal" Rather Than Alternatives

| Alternative Frame | Why Legal is Better |
|-------------------|---------------------|
| "Collaboration platform" | Commodity; doesn't capture structure |
| "Knowledge management" | Static; misses the adversarial/challenge dimension |
| "Discussion tool" | Ephemeral; misses persistence and procedure |
| "Argumentation software" | Academic; alienates practitioners |
| "Deliberation platform" | Better, but lacks the rigor connotation |
| **"Legal deliberation infrastructure"** | Captures rigor + procedure + accessibility + durability |

### 1.4 The Transformation: Async + Networked + Multiplayer

The legal frame is enhanced by three transformations:

| Dimension | Traditional Legal | Mesh Transformation |
|-----------|-------------------|---------------------|
| **Asynchronous** | Synchronous courtroom | Contribute on your own time; deliberation persists |
| **Networked** | Siloed cases | Arguments link across deliberations; precedent accumulates |
| **Multiplayer** | Bipolar (P vs. D) | Many positions on many claims; fluid participation |

> **The pitch**: "We took the procedural infrastructure that makes courtrooms work — and made it asynchronous, networked, and multiplayer. Now any group can reason with legal rigor about any topic."

---

## 2. Platform Architecture → Legal Concepts Mapping

Drawing from the architecture documents, here's how implemented platform features map to legal concepts:

### 2.1 Core Entities

| Platform Entity | Legal Analogue | How It Works |
|-----------------|----------------|--------------|
| **Claim** | Allegation / Assertion of Fact | Canonical assertion with stable ID, typed relationships, evidence links |
| **ClaimEdge** | Relation between Claims | SUPPORTS, REBUTS, UNDERCUTS, UNDERMINES — typed legal relationships |
| **Evidence (ClaimEvidence)** | Exhibit / Documentary Evidence | Citations with confidence, source URLs, CSL metadata, provenance |
| **Argument** | Legal Argument / Brief | Premise-conclusion structure with scheme, inference step, attack surface |
| **ArgumentChain** | Chain of Reasoning | Serial, convergent, divergent — composed multi-step arguments |
| **DialogueMove** | Pleading / Motion / Filing | ASSERT, WHY, GROUNDS, CONCEDE, RETRACT — procedural moves with provenance |
| **Commitment** | Court Record Entry | What each participant has publicly asserted; immutable record |
| **Proposition** | Informal Discussion | Workshopping zone before formal pleading |
| **Issue** | Matter for Determination | Tracked questions requiring resolution |

### 2.2 Procedures & Protocols

| Platform Feature | Legal Analogue | Implementation |
|------------------|----------------|----------------|
| **Progressive Formalization** | Case Maturation | Discussion → Proposition → Claim → Argument → Thesis |
| **Dialogue Protocol (PPD)** | Rules of Civil Procedure | Structured move types with turn-taking semantics |
| **Critical Questions** | Cross-Examination | Auto-generated challenges based on argument scheme |
| **Attack Types** | Types of Objection | Rebut (challenge conclusion), Undercut (challenge inference), Undermine (challenge premise) |
| **Scheme Selection** | Legal Standard Applied | 60+ Walton schemes = recognized patterns for what counts as proof |
| **Confidence Tracking** | Standard of Proof | Per-argument confidence; aggregation modes (product, min, DS) |
| **Commitment Stores** | Official Court Record | Per-participant tracking of public commitments |

### 2.3 Formal Systems

| Platform System | Legal Analogue | What It Provides |
|-----------------|----------------|------------------|
| **ASPIC+** | Judgment Framework | Preference ordering, acceptability semantics, conflict resolution |
| **Grounded Extension** | Binding Judgment | Which arguments survive challenge under skeptical semantics |
| **Rationality Postulates** | Procedural Validity | Checks that the theory satisfies formal requirements |
| **Transposition** | Contradiction Handling | Resolving circular attacks via preferences |
| **ConflictApplication** | Attack Registration | Formal registration of an attack with metadata |

### 2.4 Outputs & Artifacts

| Platform Artifact | Legal Analogue | Function |
|-------------------|----------------|----------|
| **Thesis** | Judicial Opinion / Legal Brief | Structured document with holdings, reasoning, citations |
| **KbPage** | Legal Encyclopedia Entry | Block-structured document linked to claims/arguments |
| **DebateSheet** | Case Summary | Spreadsheet view of positions, confidence, attacks |
| **AIF Export** | Certified Transcript | Interoperable format for external analysis |
| **ArgumentChain Visualization** | Argument Map | Visual representation of reasoning structure |

### 2.5 Network & Cross-Context

| Platform Feature | Legal Analogue | Implementation |
|------------------|----------------|----------------|
| **Plexus** | Legal Database / Case Network | Meta-visualization of deliberation relationships |
| **Cross-room import** | Citing Precedent | Import arguments with provenance from other deliberations |
| **CanonicalClaimId** | Res Judicata | Same claim across contexts maintains identity |
| **RoomFunctor** | Case Mapping | Establishes correspondences for argument import |

---

## 3. The Three Layers as Legal Process

The platform's three-layer architecture maps cleanly to phases of legal proceedings:

### 3.1 The Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              THREE LAYERS AS LEGAL PROCESS PHASES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER 3: OUTPUTS & ARTIFACTS                                               │
│  ══════════════════════════════════════════════════════════════════════════ │
│  Legal Phase: JUDGMENT & OPINION                                             │
│  ────────────────────────────────────────────────────────────────────────── │
│  • Thesis = Judicial Opinion (holdings, reasoning, citations)               │
│  • KbPages = Legal Encyclopedia / Institutional Memory                       │
│  • DebateSheet = Case Summary / Argument Digest                              │
│  • AIF Export = Certified Transcript for Appeal/Review                       │
│                                                                              │
│  Platform Components: ThesisComposer, ThesisSidebar, KbPageEditor           │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              ▲                                               │
│                              │ composes into                                 │
│                                                                              │
│  LAYER 2: ARGUMENTS & DIALOGUE                                              │
│  ══════════════════════════════════════════════════════════════════════════ │
│  Legal Phase: TRIAL & BRIEFING                                               │
│  ────────────────────────────────────────────────────────────────────────── │
│  • Arguments = Legal Briefs (premise → conclusion via scheme)                │
│  • DialogueMoves = Pleadings & Motions (ASSERT, WHY, GROUNDS, CONCEDE)      │
│  • Schemes = Legal Standards / Tests (what counts as proof)                  │
│  • Critical Questions = Cross-Examination (scheme-specific challenges)      │
│  • Attacks = Objections (typed: rebut, undercut, undermine)                  │
│  • Commitments = Court Record (what's been asserted)                         │
│  • ASPIC+ = Judgment Framework (acceptability semantics)                     │
│                                                                              │
│  Platform Components: AIFArgumentWithSchemeComposer, DialogueMovePanel,     │
│                       AttackCreatorPanel, AspicTheoryPanel                   │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              ▲                                               │
│                              │ structures                                    │
│                                                                              │
│  LAYER 1: CLAIMS & EVIDENCE                                                 │
│  ══════════════════════════════════════════════════════════════════════════ │
│  Legal Phase: DISCOVERY & PLEADING                                           │
│  ────────────────────────────────────────────────────────────────────────── │
│  • Discussion = Pre-litigation Negotiation / Informal Conference             │
│  • Propositions = Draft Pleadings (workshopping before filing)               │
│  • Claims = Filed Allegations (canonical, addressable, typed relations)      │
│  • ClaimEdges = Relations (supports, contradicts, specifies)                 │
│  • Evidence = Exhibits (source linking, authentication, provenance)          │
│  • Contraries = Explicit Contradictions (formal contrary relations)          │
│                                                                              │
│  Platform Components: PropositionComposer, PromoteToClaimButton,            │
│                       ClaimMiniMap, EvidencePanel                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Progressive Formalization as Case Maturation

Just as legal matters can settle early or proceed to trial, Mesh deliberations can remain informal or progress to full formal reasoning:

| Stage | Legal Analogue | Platform State | When to Use |
|-------|----------------|----------------|-------------|
| **Informal** | Settlement discussion | Discussion + Propositions | Casual check-ins, brainstorming |
| **Structured** | Formal discovery | Claims + Evidence | When assertions need tracking |
| **Argued** | Briefing | Arguments + Schemes | When reasoning needs structure |
| **Evaluated** | Trial | ASPIC+ + Extensions | When acceptability matters |
| **Published** | Opinion | Thesis + KbPages | When conclusions need documentation |

### 3.3 Burden & Standard at Each Layer

| Layer | Who Bears Burden | Standard Implied |
|-------|------------------|------------------|
| **Layer 1** | Claim maker | "Plausible" — assertion accepted unless challenged |
| **Layer 2** | Argument author (after WHY) | "Adequate grounds" — must answer critical questions |
| **Layer 3** | Published thesis | "Survives scrutiny" — must withstand attack analysis |

---

# PART II: REFINED MESSAGING

## 4. Canonical Summaries (Final)

### 4.1 Universal Tagline

> **"Legal-grade reasoning infrastructure for any domain"**

Alternatives (use situationally):
- "Asynchronous legal discourse for the networked age"
- "Where arguments go on the record"
- "Procedure for collective reasoning"

### 4.2 Universal One-Liner (15 words)

> **"Mesh brings the procedural rigor of legal deliberation to any context where reasoning matters."**

Alternatives:
- "Every claim on the record. Every challenge typed. Every conclusion traceable."
- "The infrastructure that makes courtrooms work — applied to policy, strategy, and governance."

### 4.3 Universal Elevator Pitch (75 words)

> Legal systems developed humanity's most sophisticated tools for reasoning under disagreement: typed challenges, evidentiary standards, burden allocation, precedent, and authoritative record-keeping. Mesh liberates these tools from the courtroom. We provide procedural infrastructure for deliberation — every claim addressable, every argument structured, every conclusion auditable. Groups can deliberate on policy, strategy, ethics, or governance with legal-grade rigor, asynchronously and at scale. The result: reasoning that compounds rather than dissipates.

### 4.4 Landing Page Summary (150 words)

> **Reasoning with receipts.**
>
> When your team tackles complex questions — policy decisions, strategic choices, contested issues — the reasoning matters as much as the conclusion. But current tools don't preserve it. Discussions scatter across chat threads. Evidence disconnects from claims. Disagreements loop without resolution.
>
> Mesh provides **legal-grade reasoning infrastructure**. We've taken the procedural tools that make courtrooms work — typed challenges, evidentiary standards, commitment tracking, authoritative records — and made them available for any deliberation.
>
> **What you get:**
> - **Claims on the record** — stable identifiers, typed relationships, evidence links
> - **Arguments with structure** — recognized schemes, auto-generated challenges, attack tracking
> - **Conclusions you can cite** — thesis documents, knowledge bases, exportable graphs
>
> Whether you're a policy team, a research group, or a governance body, Mesh transforms discussion into durable knowledge you can audit, challenge, and build upon.
>
> **Deliberation infrastructure for the networked age.**

### 4.5 Executive Brief (300 words)

> **The Opportunity**
>
> Organizations face increasingly complex decisions that require collective reasoning — but the tools available are fundamentally misaligned. Chat optimizes for speed, not depth. Documents capture conclusions, not the reasoning. The result: institutional reasoning is fragile, unrepeatable, and invisible.
>
> **Our Solution**
>
> Mesh provides reasoning infrastructure modeled on the procedural rigor of legal systems. We've abstracted the mechanisms that make courts work — typed claims, structured arguments, challenge protocols, authoritative records — and applied them to any domain where reasoning matters.
>
> **Core Capabilities:**
> - **Canonical claims** with stable identifiers and typed relationships
> - **Scheme-based arguments** with auto-generated critical questions
> - **Dialogue protocol** tracking every assertion, challenge, and concession
> - **ASPIC+ evaluation** for formal acceptability under competing attacks
> - **Thesis generation** producing citable documents with linked reasoning
>
> **Progressive Formalization:**
> Casual discussions remain lightweight. Policy deliberations can upgrade to full formal reasoning with typed attacks, commitment tracking, and acceptability semantics. The same platform serves both — structure emerges on demand.
>
> **Why Now:**
> Three forces converge: (1) regulatory pressure for explainable decisions; (2) distributed teams requiring asynchronous, structured deliberation; (3) AI capabilities that require structured grounding to augment human reasoning reliably.
>
> **Market Position:**
> We occupy the intersection of collaboration tools (Figma, Miro), knowledge management (Notion, Roam), and civic tech (Loomio, Pol.is). Our differentiation: formal argumentation grounding provides structural integrity that freeform tools lack.
>
> **Academic Foundation:**
> Built on AIF (Argument Interchange Format), Walton argumentation schemes, ASPIC+ defeasible reasoning, and dialogue game theory. Decades of research, made practical.
>
> **Ask:**
> Seeking strategic partners for pilot deployments in policy, governance, or research contexts.

---

## 5. Audience-Specific Packages

### 5.1 For Policy & Governance

**Tagline**: "Deliberation with receipts"

**One-liner**:
> Mesh captures the full reasoning behind policy decisions — traceable claims, visible arguments, conclusions that can be audited and defended.

**Elevator pitch**:
> Policy decisions face a twin challenge: they need to be *defensible* (grounded in evidence and reasoning) and *explicable* (the reasoning needs to be visible to stakeholders). Current tools fail both tests — reasoning scatters across meetings, emails, and documents; when decisions are challenged, teams scramble to reconstruct the logic.
>
> Mesh solves this with deliberation infrastructure. Every claim links to its evidence. Every argument shows its structure. Every challenge and response is tracked. When you publish a decision, you can point directly to the supporting reasoning. When stakeholders ask "how did you reach this?", you have the receipts.

**Key features to emphasize**:
- Commitment stores (who said what)
- Thesis generation (publishable opinions)
- ASPIC+ evaluation (formal defensibility)
- Audit trail (full provenance)

**Legal frame phrases**:
- "On the record"
- "Defensible decisions"
- "Reasoning audit trail"
- "Typed challenges and responses"

---

### 5.2 For Research & Academia

**Tagline**: "Argumentation theory, implemented"

**One-liner**:
> Mesh brings formal argumentation frameworks — AIF, Walton schemes, ASPIC+ — out of papers and into practice.

**Elevator pitch**:
> Decades of research have produced powerful tools for analyzing and constructing arguments: AIF for interoperability, Walton's 60+ schemes for structure, ASPIC+ for defeasibility, dialogue protocols for commitment tracking. These frameworks offer real analytical leverage — but they remain largely inaccessible outside academic contexts.
>
> Mesh bridges the gap. We implement AIF-compliant argument graphs, scheme-based construction with critical question generation, typed attack semantics, and acceptability computation in a production platform. Export to standard formats. Full API access. A living laboratory where formal argumentation meets real deliberation needs.

**Key features to emphasize**:
- AIF compliance and export
- 60+ Walton schemes with CQs
- ASPIC+ preferences and extensions
- Dialogue move tracking (PPD protocol)
- Categorical semantics (Ambler's ECC)

**Legal frame phrases**:
- "Cross-examination via critical questions"
- "Precedent linking across deliberations"
- "Scheme as legal standard"

---

### 5.3 For Technical Teams

**Tagline**: "The structured layer for reasoning"

**One-liner**:
> Mesh treats argumentation as the primitive — typed claims, scheme-annotated arguments, and formal attack semantics, all API-accessible.

**Elevator pitch**:
> Most collaboration tools treat text as the primitive. Mesh treats *argumentation* as the primitive. Claims are typed objects with stable IDs and relationships. Arguments are premise-conclusion structures with scheme annotations. Attacks and supports are typed edges with formal semantics.
>
> Stack: Next.js 14 frontend, Prisma/Postgres backend, real-time sync via Supabase. AIF-compliant data model. Full API coverage. Export to AIF-JSON, DOT, and other graph formats.
>
> Key abstractions: Claims (canonical assertions), Arguments (scheme-annotated structures), Chains (composed networks), DialogueMoves (commitment-tracked protocol), Scopes (epistemic partitioning), ASPIC+ (acceptability computation).

**Key features to emphasize**:
- Data model architecture (Claims, Arguments, Chains)
- API routes structure
- AIF compliance and export
- ASPIC+ engine (lib/aspic/*)
- Categorical foundations (Ambler ECC)

**Legal frame phrases**:
- "Court record as commitment store"
- "Attack types as objection taxonomy"
- "Judgment as acceptability semantics"

---

### 5.4 For Executives & Funders

**Tagline**: "Reasoning infrastructure for the AI age"

**One-liner**:
> Mesh transforms how organizations deliberate — every claim traceable, every argument structured, every decision auditable.

**Elevator pitch**:
> As organizations face increasingly complex decisions — and increasingly demand accountability for those decisions — the tools for collective reasoning remain stuck in the chat era.
>
> Mesh provides the upgrade. We've built infrastructure that transforms unstructured discussion into structured deliberation. Every claim has a stable identity. Every argument shows its reasoning pattern. Every conclusion traces to the dialogue that produced it.
>
> Built on established argumentation theory — we implement academic standards (AIF, ASPIC+) that ensure interoperability and formal rigor — but designed for practitioners who need to reason well, not earn research degrees.

**Key features to emphasize**:
- Progressive formalization (scales with complexity)
- Institutional memory (reasoning persists)
- Formal grounding (academic credibility)
- AI-readiness (structured data for augmentation)

**Legal frame phrases**:
- "Legal-grade rigor"
- "Audit trail for reasoning"
- "Defensible, explicable decisions"

---

### 5.5 For Community Organizers

**Tagline**: "Discussions that build, not just repeat"

**One-liner**:
> Mesh helps communities build on each conversation — visible arguments that compound over time.

**Elevator pitch**:
> Community discussions often feel circular: the same points resurface meeting after meeting, disagreements repeat without resolution, good ideas get lost in chat scrollback.
>
> Mesh breaks this cycle by making reasoning visible and persistent. When someone makes a claim, it becomes a stable object others can support or challenge. When an argument is made, its structure is explicit — so everyone sees the logic. When there's disagreement, it's tracked — the community can see what's contested and what's settled.
>
> Over time, your discussions accumulate into a knowledge base. New members can see the history. Future meetings reference past reasoning. The community's collective intelligence compounds.

**Key features to emphasize**:
- Propositions (community workshopping)
- Promotion workflow (informal → formal)
- Issues system (tracking open questions)
- Non-canonical moves (community contributions with author approval)

**Legal frame phrases**:
- "Fair process, transparent rules"
- "Everyone's voice on the record"
- "Build on prior decisions"

---

## 6. Vocabulary & Anti-Patterns

### 6.1 Core Vocabulary (Use These)

| Term | Definition | Why It Works |
|------|------------|--------------|
| **On the record** | Claims and moves are permanently tracked | Legal authority, accountability |
| **Typed challenge** | Attacks specify what's wrong (rebut/undercut/undermine) | Precision, not just disagreement |
| **Scheme** | Recognized reasoning pattern with built-in challenges | "Legal standard" without the jargon |
| **Critical questions** | Automatic challenges based on argument type | "Cross-examination" accessible |
| **Commitment store** | What each participant has publicly asserted | "Court record" for deliberation |
| **Progressive formalization** | Structure emerges as needed | Scales from casual to formal |
| **Defensible** | Can withstand scrutiny and challenge | Legal rigor without legalism |
| **Audit trail** | Every conclusion traceable to its grounds | Accountability infrastructure |
| **Precedent** | Prior reasoning available for future use | Institutional memory |

### 6.2 Technical Terms → Accessible Equivalents

| Technical Term | Use Instead | When Speaking To |
|----------------|-------------|------------------|
| AIF ontology | Standard argument format | Non-technical |
| ASPIC+ semantics | Formal evaluation / judgment | Non-technical |
| Walton schemes | Recognized reasoning patterns | Non-technical |
| Undercut attack | Challenge to the reasoning | All |
| Undermine attack | Challenge to the evidence | All |
| Grounded extension | What survives challenge | Non-technical |
| Dung semantics | Formal conflict resolution | Non-technical |
| Dialogue moves | Procedural steps | All |
| Ludics | Game-theoretic reasoning | Only academics |
| Commitment stores | Track what's been agreed | All |

### 6.3 Phrases to Avoid

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| "Just a discussion tool" | Undersells; commodity | "Reasoning infrastructure" |
| "AI-powered argumentation" | Overpromises; unclear | "AI-assisted" or "AI-augmented" |
| "Solves polarization" | Overpromises | "Structures disagreement productively" |
| "Better meetings" | Too narrow | "Better collective reasoning" |
| "Academic argumentation software" | Alienates | "Grounded in argumentation science" |
| "Like Slack but for arguments" | Defines by competitor | "Reasoning infrastructure" (new category) |

### 6.4 Tone Guidelines

| Context | Tone | Example Phrase |
|---------|------|----------------|
| Landing page | Confident, accessible | "Reasoning that compounds" |
| Technical docs | Precise, detailed | "AIF-compliant RA-nodes with scheme annotation" |
| Investor pitch | Visionary, grounded | "Infrastructure for the next generation of collective intelligence" |
| Academic | Rigorous, cited | "Implements ASPIC+ per Modgil & Prakken (2013)" |
| Community | Welcoming, practical | "Your discussions build a knowledge base" |

---

# PART III: OPERATIONAL MATERIALS

## 7. Pitch Deck Content

### 7.1 Slide-by-Slide Content

| Slide | Title | Key Message | Visual |
|-------|-------|-------------|--------|
| 1 | Title | Mesh: Legal-Grade Reasoning Infrastructure | Logo + tagline |
| 2 | Problem | "The reasoning that produces decisions is invisible" | Before/after: chat chaos → structured graph |
| 3 | The Insight | "Legal systems solved this centuries ago" | Legal → Mesh mapping diagram |
| 4 | Solution | "Deliberation infrastructure for any domain" | Three-layer architecture |
| 5 | How It Works | "Progressive formalization" | Spectrum: Discussion → Thesis |
| 6 | Demo Moment | "Let me show you" | Key screenshot: argument with attacks |
| 7 | Differentiation | "Why we're different" | Positioning map |
| 8 | Market | "Who needs this" | TAM/SAM/SOM or audience segments |
| 9 | Traction | "What we've built" | Key metrics, pilots, architecture maturity |
| 10 | Team | "Why us" | Founder background, advisors |
| 11 | Ask | "[Specific request]" | Clear call to action |

### 7.2 Key Slides Detailed

**Slide 3: The Insight**

> "Legal systems developed humanity's most sophisticated tools for reasoning under disagreement. We've abstracted those tools — typed challenges, evidentiary standards, burden allocation, commitment tracking — and made them available for any deliberation."

Visual: Two columns
- Left: Legal System (courtroom image) with concepts (pleadings, objections, cross-examination, judgment)
- Right: Mesh Platform (interface screenshot) with mappings (claims, attacks, CQs, ASPIC+)

**Slide 4: Solution — The Three Layers**

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: OUTPUTS           ← Judgment & Opinion               │
│  Thesis, KbPages, Graphs                                        │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: ARGUMENTS         ← Trial & Briefing                 │
│  Schemes, Attacks, ASPIC+                                       │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: CLAIMS            ← Discovery & Pleading             │
│  Propositions, Evidence                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Slide 7: Differentiation**

Positioning map with axes:
- X-axis: Unstructured ← → Structured
- Y-axis: Individual ← → Collective

Quadrants:
- Top-right (Mesh): Structured + Collective
- Top-left: Slack, Teams (Unstructured + Collective)
- Bottom-right: Roam, Obsidian (Structured + Individual)
- Bottom-left: Email, Docs (Unstructured + Individual)

---

## 8. Demo Script (Legal Frame)

### 8.1 Demo Flow (5 minutes)

| Phase | Time | What to Show | What to Say |
|-------|------|--------------|-------------|
| **Context** | 30s | None | "Imagine your policy team just finished a crucial debate. In most tools, that reasoning is now scattered across threads. Let me show you what happens in Mesh." |
| **Claim Creation** | 45s | Create claim, link evidence | "Every assertion becomes a **claim on the record** — like an allegation in a legal filing. I can link evidence directly. This claim now has a stable identity." |
| **Argument Building** | 60s | Build argument with scheme | "I structure my reasoning using a **recognized pattern** — like a legal standard. The system knows this pattern and will generate the relevant challenges automatically." |
| **Critical Questions** | 45s | Show CQs, demonstrate response | "These are the **cross-examination questions** for this type of argument. The system surfaces them so we don't miss obvious challenges. I can respond to each." |
| **Attack & Response** | 60s | Show attack, type selection | "Someone challenges my argument. The attack is **typed** — they're questioning my reasoning, not just disagreeing. This distinction matters for how I respond." |
| **ASPIC+ Evaluation** | 45s | Show grounded extension | "The system computes which arguments survive challenge — like a **judgment**. These are the conclusions that stand after all attacks are considered." |
| **Thesis Output** | 45s | Generate thesis document | "The deliberation produces a **publishable document** with citations to the reasoning. It's not a summary I wrote — it's generated from the structure." |
| **Zoom Out** | 30s | Show graph view | "Here's the full argument graph. Every claim, every argument, every challenge — visible and auditable. **Reasoning with receipts.**" |

### 8.2 Key Demo Phrases

- "This is now **on the record**"
- "The system surfaces the **cross-examination** for this argument type"
- "I'm filing a **typed objection** — I'm challenging the reasoning, not the conclusion"
- "The **commitment store** tracks what each participant has asserted"
- "After challenge, these arguments are in the **grounded extension** — they survive scrutiny"
- "This thesis is the **judicial opinion** — generated from the reasoning structure"

---

## 9. FAQ & Objection Handling

### 9.1 Skeptic Questions

| Question | Short Answer | Deeper Answer |
|----------|--------------|---------------|
| "Isn't this just another wiki/notes tool?" | "No — we structure *arguments*, not just text." | "Wikis store content. Mesh structures reasoning. Every claim is typed, every relationship has semantics, every challenge is tracked. It's the difference between a filing cabinet and a legal system." |
| "Why do I need legal rigor for regular discussions?" | "You don't — until you do. Progressive formalization." | "Most discussions are fine as discussions. But when stakes are high, when decisions will be scrutinized, when you need to build on prior reasoning — that's when structure matters. Mesh lets you escalate on demand." |
| "This seems complicated for everyday users." | "The interface is intuitive. The formalism is under the hood." | "You don't need to know 'ASPIC+ semantics' to use Mesh — you select options from menus. The formalism enables analysis and interoperability; users work with intuitive interfaces." |
| "How is this different from debate platforms?" | "Debate is about winning. Mesh is about resolution and building." | "Debate platforms are adversarial by design — someone wins, someone loses. Mesh treats disagreement as productive data. Challenges are structured, tracked, and resolved. The goal is durable shared understanding." |
| "Will AI replace this?" | "AI makes structured reasoning *more* important." | "LLMs can generate arguments — but can you verify them? Mesh provides the structure that makes AI outputs auditable. Human-AI collaboration requires shared scaffolding for reasoning." |
| "This seems heavy for my team." | "Start light, formalize when needed." | "You can use Mesh as a discussion space indefinitely. Structure emerges when you promote claims, build arguments, track attacks. You only encounter formalism when you need it." |

### 9.2 Buyer Objections

| Objection | Response |
|-----------|----------|
| "We already have good discussions." | "Great. Mesh helps you *preserve* them. When key people leave, the reasoning shouldn't leave with them." |
| "This requires behavior change." | "Less than you'd think. Users start with familiar discussion; structure emerges as needed. But yes — meaningful tools enable meaningful change." |
| "What's the ROI?" | "Track: decisions revisited (should decrease), onboarding time (reasoning is documented), audit response time (citations ready), institutional memory (searchable precedent)." |
| "How does this integrate?" | "API-first design. AIF export for interoperability. We're the reasoning layer, not a replacement for your whole stack." |
| "What about AI capabilities?" | "We're building AI assistance — scheme suggestion, critical question generation, argument strength analysis. AI augments; humans author." |

### 9.3 Category Definition Questions

| Question | Response |
|----------|----------|
| "What category is this?" | "Reasoning infrastructure. Think of it as the layer between communication (chat) and documentation (docs) — where structured thinking happens." |
| "Who are your competitors?" | "Collaboration tools (Slack, Teams), knowledge management (Notion, Roam), and civic tech (Loomio, Pol.is) all touch part of the problem. None provides formal reasoning structure." |
| "Is this civic tech?" | "Civic tech is one application. The infrastructure applies wherever groups need to reason well — policy, research, governance, strategy." |

---

# PART IV: STRATEGIC NARRATIVE

## 10. Origin Story (Final)

### 10.1 The Narrative Arc

> For centuries, legal systems have refined the machinery of structured argumentation. Not because lawyers are smarter, but because the stakes demand it. When liberty or property hangs in the balance, you can't rely on charisma or memory. You need typed claims, admissible evidence, burden allocation, challenge procedures, and authoritative records.
>
> Meanwhile, most collective reasoning happens in tools designed for conversation — chat threads, email chains, meeting notes. Ideas surface and disappear. Disagreements loop. Evidence disconnects from claims. Every important discussion ends with someone asking, "Did we capture that?"
>
> The gap became clear: we had the infrastructure for high-stakes legal reasoning, but nothing comparable for policy analysis, strategic planning, research collaboration, or community governance.
>
> Mesh fills that gap. We've abstracted the procedural infrastructure of legal deliberation — the mechanisms that make courtrooms work — and made it available for any domain where reasoning matters.
>
> The result is asynchronous, networked, multiplayer legal discourse: groups reasoning together with legal-grade rigor, without the courtroom, the lawyers, or the punitive stakes.

### 10.2 Key Story Elements

| Element | Content |
|---------|---------|
| **Tension** | High-stakes reasoning has infrastructure (courts); everyday reasoning doesn't |
| **Insight** | Legal mechanisms are domain-general; they can be extracted and applied |
| **Solution** | Abstract procedural infrastructure; make it async, networked, multiplayer |
| **Vision** | Groups reasoning together with the rigor that important decisions deserve |

---

## 11. Vision & Roadmap

### 11.1 Vision Statement

> **A world where every important decision rests on reasoning that can be inspected, challenged, and built upon.**

### 11.2 5-Year Horizon

| Dimension | Today | Year 2 | Year 5 |
|-----------|-------|--------|--------|
| **Users** | Early adopters (policy, research) | Mainstream teams, governance bodies | Default deliberation infrastructure |
| **Scale** | Single-team deliberations | Cross-org, multi-stakeholder | Societal-scale reasoning networks |
| **AI** | Assistance (scheme suggestion, CQ generation) | Augmentation (analysis, gap detection) | Collaboration (human-AI co-reasoning) |
| **Interop** | Export/import | Federation (linked deliberation networks) | Reasoning commons (shared repositories) |
| **Outputs** | Documents, graphs | Living knowledge bases | Executable reasoning (auto-updating) |

### 11.3 Near-Term Priorities

1. **Polish legal frame** — Vocabulary, UI, onboarding emphasize procedural rigor
2. **Simplify entry** — Lower barrier for first-time users; structure emerges later
3. **AI assistance** — Scheme suggestion, CQ generation, argument strength hints
4. **Interoperability** — AIF export, API coverage, integration playbooks
5. **Pilot deployments** — Policy teams, research groups, governance bodies

---

## 12. Competitive Differentiation

### 12.1 The Core Claim

> **Mesh is the only platform that combines:**
> - Formal argumentation grounding (AIF, ASPIC+, Walton schemes)
> - Progressive formalization (scales from casual to formal)
> - Legal-analogous procedures (typed challenges, commitment tracking, precedent)
> - Durable artifact production (thesis documents, knowledge bases)

### 12.2 Comparison Matrix

| Capability | Chat Tools | Wikis | Civic Tech | Academic AF | **Mesh** |
|------------|------------|-------|------------|-------------|----------|
| Real-time communication | ✓ | ✗ | Limited | ✗ | ✓ |
| Persistent content | Limited | ✓ | ✓ | ✓ | ✓ |
| Typed claims | ✗ | ✗ | Limited | ✓ | ✓ |
| Scheme-based arguments | ✗ | ✗ | ✗ | ✓ | ✓ |
| Typed attacks | ✗ | ✗ | ✗ | ✓ | ✓ |
| Dialogue tracking | ✗ | ✗ | Limited | ✓ | ✓ |
| Formal evaluation | ✗ | ✗ | ✗ | ✓ | ✓ |
| Usable interface | ✓ | ✓ | ✓ | ✗ | ✓ |
| Progressive formalization | ✗ | ✗ | ✗ | ✗ | ✓ |
| Cross-context precedent | ✗ | ✗ | ✗ | ✗ | ✓ |

### 12.3 Defensibility

Why is this differentiation durable?

1. **Deep integration** — Argumentation theory isn't a feature; it's the data model
2. **Network effects** — Argument graphs become more valuable as they grow; precedent accumulates
3. **Interoperability moat** — AIF compliance makes us the interchange hub
4. **Expertise barrier** — Implementing argumentation theory correctly requires specialized knowledge
5. **Trust** — Deliberation infrastructure requires reliability that takes time to establish

---

# Appendices

## Appendix A: Platform-to-Legal Quick Reference

| Platform Term | Legal Equivalent | Location in Codebase |
|---------------|------------------|----------------------|
| Claim | Allegation | `Claim` model, `ClaimMiniMap` component |
| ClaimEdge | Relation | `ClaimEdge` model |
| Argument | Legal argument | `Argument` model, `AIFArgumentWithSchemeComposer` |
| ArgumentChain | Chain of reasoning | `ArgumentChain` model, Chain Builder UI |
| DialogueMove | Pleading/motion | `DialogueMove` model, `DialogueMovePanel` |
| Commitment | Record entry | `Commitment` model, `CommitmentStorePanel` |
| CriticalQuestion | Cross-examination | CQ system, `CriticalQuestionsV2` |
| ConflictApplication | Objection | `ConflictApplication` model, Attack UI |
| Scheme | Legal standard | `ArgumentScheme`, 60+ Walton schemes |
| ASPIC+ Theory | Case theory | `lib/aspic/*` |
| Grounded Extension | Judgment | `semantics.ts`, `GroundedExtensionPanel` |
| Thesis | Judicial opinion | `Thesis` model, `ThesisComposer` |
| KbPage | Encyclopedia entry | `KbPage` model |
| Plexus | Case database | `Plexus` visualization |

## Appendix B: Messaging Assets Checklist

- [ ] Website landing page updated
- [ ] README.md updated
- [ ] Pitch deck created
- [ ] Demo script practiced
- [ ] One-pagers per audience
- [ ] Email templates
- [ ] Social bios
- [ ] Investor materials
- [ ] Press kit
- [ ] Team vocabulary training

## Appendix C: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 3.0 | Dec 2024 | Unified legal frame; platform-informed content; polished messaging |

---

*This document represents production-ready messaging. Sections marked for review should be tested with target audiences before finalization.*
