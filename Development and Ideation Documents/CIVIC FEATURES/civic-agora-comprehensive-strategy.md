# Civic Agora: Epistemic Infrastructure for Democratic Life

## Purpose & Scope

This document articulates the strategic vision for Civic Agora—a platform providing infrastructure for structured civic deliberation. It synthesizes the theoretical foundations, ideological positioning, architectural capabilities, deployment strategy, and long-term vision for how the platform serves democratic life.

**Core Thesis**: Contemporary democratic dysfunction is not primarily a problem of bad actors or insufficient information. It is an infrastructure problem. The platforms where public reasoning should occur are architecturally incapable of supporting it. Civic Agora provides what democratic life actually requires: infrastructure where claims are addressable, arguments are structured, challenges cannot be ignored, and reasoning accumulates as durable public resource.

**What This Document Covers**:
- Ideological positioning and theoretical foundations
- The psychoanalytic theory of propaganda resistance
- How the platform operationalizes the distinction between reality-based and phantasmic claims
- User model and adoption strategy
- Architectural capabilities relevant to civic deployment
- Measurement, timeline, and sustainability

---

## Table of Contents

1. [Ideological Position: Agonistic Epistemic Infrastructuralism](#1-ideological-position)
2. [The Democratic Deficit](#2-the-democratic-deficit)
3. [Theoretical Foundations](#3-theoretical-foundations)
4. [The Psychoanalytic Theory of Propaganda Resistance](#4-psychoanalytic-theory-of-propaganda-resistance)
5. [Procedural Epistemology: How the Platform Operationalizes "Reality"](#5-procedural-epistemology)
6. [User Model: Tiers of Engagement](#6-user-model)
7. [Types of Civic Disagreement](#7-types-of-civic-disagreement)
8. [Architectural Capabilities](#8-architectural-capabilities)
9. [Design for Democratic Equality](#9-design-for-democratic-equality)
10. [Landscape Analysis](#10-landscape-analysis)
11. [Core Use Cases](#11-core-use-cases)
12. [Adoption Strategy](#12-adoption-strategy)
13. [Measurement Framework](#13-measurement-framework)
14. [Self-Application: The Platform as Its Own Test](#14-self-application)
15. [Timeline & Sustainability](#15-timeline-and-sustainability)
16. [Appendices](#appendices)

---

## 1. Ideological Position: Agonistic Epistemic Infrastructuralism

### 1.1 What Civic Agora Is Not

Before articulating what the platform *is*, it is important to clarify what it is *not*:

**Not Computational Habermasianism**. The platform does not assume that politics can be rationalized—that if everyone deliberated properly, conflict would resolve into consensus. This is both empirically false and normatively undesirable. Politics involves genuine value conflicts, interest conflicts, and identity conflicts that cannot be dissolved through better reasoning.

**Not a Mass Deliberation Platform**. The platform does not aim to have every citizen engage in structured argumentation. This is neither feasible nor necessary. Most people will never use the platform directly, and this is fine.

**Not a Truth-Determination Machine**. The platform does not claim to identify objective truth through computational means. It provides infrastructure for testing claims against challenge, not for certifying them as true.

### 1.2 What Civic Agora Is

**Agonistic Epistemic Infrastructuralism**: Building durable infrastructure for structured reasoning, aimed at improving epistemic quality among actors who shape public discourse, with the hope—not certainty—that this affects the outcomes of political struggle, while accepting that politics remains fundamentally conflictual and cannot be rationalized away.

Breaking this down:

**Agonistic**: Politics is irreducible struggle between groups with different values, interests, and identities. This is not pathological—it is the normal condition of pluralist society. The platform does not aim to eliminate this struggle but to make it healthier.

**Epistemic**: The intervention is on reasoning quality and evidence curation. The platform provides infrastructure for constructing, testing, and refining claims and arguments—not for resolving political conflict directly.

**Infrastructuralism**: The approach is building durable systems, not facilitating individual conversations. Like financial infrastructure enables economic activity without determining its outcomes, epistemic infrastructure enables reasoning activity without determining its conclusions.

**Meliorist Wager**: The project rests on a bet—not a certainty—that improving the quality of reasoning among those who shape discourse will have downstream effects on public understanding. This bet may be wrong. But it is the bet the platform makes.

### 1.3 The Network Influence Model

The platform's theory of change does not require mass adoption:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      NETWORK INFLUENCE MODEL                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INTENSIVE TIER                      DIFFUSION TIER                     │
│  ┌─────────────────────┐             ┌─────────────────────┐            │
│  │ Researchers         │             │ Followers who       │            │
│  │ Policy analysts     │ ──produce──►│ grant epistemic     │            │
│  │ Journalists         │   outputs   │ trust to intensive  │            │
│  │ Organizers          │             │ tier actors         │            │
│  │ Think tank staff    │             │                     │            │
│  └─────────────────────┘             └─────────────────────┘            │
│           │                                    │                        │
│           │ use platform to:                   │ receive:               │
│           │ • curate evidence                  │ • vetted conclusions   │
│           │ • structure arguments              │ • cited sources        │
│           │ • test claims against challenge    │ • transparent reasoning│
│           │ • produce durable artifacts        │ (if they want it)      │
│           │                                    │                        │
└─────────────────────────────────────────────────────────────────────────┘
```

**The bet**: Not "if everyone deliberates well, politics will be rational" but "if people who shape discourse reason better and have better epistemic infrastructure, downstream effects on public understanding might be meaningfully positive."

### 1.4 Analogy: Cybersyn for Epistemics

Project Cybersyn (Chile, 1971-1973) attempted to build cybernetic infrastructure for economic coordination under socialism. It did not claim that cybernetics would *solve* economics—only that better information infrastructure might improve economic coordination.

Civic Agora is cybernetic infrastructure for epistemic coordination in democratic life. It does not claim that structured reasoning will *solve* politics—only that better reasoning infrastructure might improve the quality of public discourse and, through it, political outcomes.

Both share:
- Infrastructure-first thinking
- Focus on the processing layer, not the consumption layer
- Uncertainty about whether the intervention is sufficient
- Acknowledgment of the domain's irreducible dynamics

---

## 2. The Democratic Deficit

### 2.1 The Structural Problem

Voting alone does not establish democratic legitimacy. Decisions must emerge from public reasoning—discourse in which participants evaluate arguments, examine evidence, and achieve mutual understanding of contested questions. When reasoning is absent, democratic legitimacy is nominal rather than substantive.

The emergence of the Internet was expected to enable public reasoning at unprecedented scale. The dominant platforms have instead systematically eliminated the conditions under which deliberation can occur:

| Requirement | What Platforms Provide | What Deliberation Requires |
|-------------|------------------------|---------------------------|
| **Structure** | Flat comments, reactions | Explicit reasoning chains with premises and conclusions |
| **Evidence** | Decaying links, screenshots | Persistent citations with verification |
| **Accountability** | Optional anonymity, no response obligation | Challenges that cannot be silently ignored |
| **Accumulation** | Ephemeral feeds, algorithmic burial | Durable record of what's resolved vs. contested |
| **Synthesis** | Thread sprawl | Conclusions that compound into shared knowledge |

These are not bugs to be patched. They reflect architectural choices serving commercial goals incompatible with deliberation. Platforms maximize attention through outrage, tribal signaling, and parasocial performance. Every dollar of market capitalization in social media represents a bet against the possibility of people reasoning together.

### 2.2 Consequences for Democratic Life

**For Citizens**: Attempting collaborative reasoning on available platforms produces confusion and exhaustion. People retreat from political engagement not because they lack capacity for thought but because the tools actively prevent its exercise.

**For Officials**: Institutional decisions requiring legitimacy cannot be grounded in deliberative processes because no suitable infrastructure exists. The same debates repeat each election cycle. Decisions lack documented reasoning that future administrations can build on.

**For Communities**: Local controversies—zoning, school policy, budgets—generate heat without light. Those with rhetorical skill or time to attend meetings dominate; others' perspectives remain unheard. No synthesis emerges.

**For Democracy**: Those exercising power face no requirement to justify decisions through processes citizens can inspect. Accountability becomes theatrical rather than structural.

### 2.3 Why Current Civic Tech Fails

Civic technology has largely digitized existing (broken) processes rather than reimagining what deliberation infrastructure could provide:

- **Comment collection tools** (PublicInput, Granicus) aggregate input without enabling dialogue
- **Voting platforms** (Pol.is, Consider.it) surface preferences without reasoning
- **Social platforms** (Nextdoor, Facebook Groups) optimize for engagement, not understanding
- **Participatory tools** (Decidim, Loomio) provide process workflow without argument structure

The gap is not a missing feature. It is the absence of infrastructure designed from first principles for what democratic deliberation actually requires.

---

## 3. Theoretical Foundations

### 3.1 Requirements for Democratic Discourse

Drawing on Habermas's discourse ethics and contemporary deliberative democracy scholarship, five conditions are necessary for discourse to serve its epistemic function:

#### Transparency: Reasoning Chains Must Be Inspectable

Citizens cannot evaluate institutional decisions when reasoning is opaque. Public consent requires capacity to inspect how conclusions emerged: what evidence was considered, what alternatives evaluated, what objections raised, how they were resolved.

Not narrative justification written after the decision, but structured record of the deliberative process itself.

#### Accessibility: Complex Reasoning Must Be Navigable

Policy questions generate reasoning structures too large for linear reading. Citizens need tools to navigate these structures: starting with conclusions, tracing back to evidence, exploring alternative arguments, understanding disputed points.

Accessibility is not simplification. It is structure that makes complexity navigable rather than overwhelming.

#### Accountability: Claims Must Be Attributable and Challengeable

Every assertion should have clear attribution (who made it, when, in what context), evidential grounding (what supports it), and mechanism for challenge (what would constitute refutation).

This is not about enforcing truth but about making truth-seeking possible. Claims that cannot be challenged cannot be tested. Claims that cannot be tested cannot be distinguished from propaganda.

#### Collaboration: Arguments Must Improve Through Examination

Discourse should produce collaborative refinement, not just competitive victory. When someone identifies a weak premise, authors should strengthen it. When new evidence emerges, arguments should incorporate it.

The goal is collective intelligence—finding better answers through structured interaction—not debate as performance.

#### Durability: Reasoning Should Accumulate

Deliberations should produce durable knowledge artifacts that persist as foundations for future work. When a community resolves a question, that resolution should be available for others facing similar questions.

Democratic knowledge should accumulate. The alternative is permanent amnesia—each discussion starting from scratch, each generation re-litigating questions their predecessors already settled.

### 3.2 Engaging the Deliberative Democracy Literature

#### From Fishkin's Deliberative Polling

James Fishkin's empirical work demonstrates that citizens, given good conditions, produce "considered judgments" that differ systematically from "raw opinions." Key conditions: balanced information, moderated small-group discussion, connection to actual decision-making.

**Design implication**: The platform must provide balanced framing, structured dialogue, and visible connection to real outcomes—not just another space for opinion expression.

#### From the Irish Citizens' Assembly Model

Ireland's citizens' assemblies demonstrated that randomly selected citizens can deliberate productively on deeply contested value questions—producing recommendations that earned broad legitimacy.

**Design implication**: Success required intensive facilitation, expert testimony, and extended engagement over months. Self-service deliberation on contested values may require similar scaffolding.

#### From Young's Critique of Deliberative Exclusion

Iris Marion Young argued that privileging "rational argument" can exclude those whose communicative modes are narrative, testimonial, or rhetorical.

**Design implication**: The platform must accommodate multiple modes of contribution—not just formal argument but testimony, lived experience, and narrative—while still enabling structured synthesis.

#### From Mansbridge on Everyday Political Talk

Jane Mansbridge distinguishes formal deliberation from "everyday talk" that shapes political understanding informally.

**Design implication**: Civic Agora addresses a specific gap—structured deliberation on consequential decisions—not all civic communication. The platform complements rather than replaces informal democratic discourse.

### 3.3 Beyond Habermas: The Agonistic Turn

While drawing on Habermasian discourse ethics, Civic Agora also incorporates the agonistic critique:

**Mouffe's Challenge**: Chantal Mouffe argues that the Habermasian ideal of rational consensus suppresses genuine political conflict. Politics is fundamentally about "us" vs. "them"—the question is whether this takes democratic (agonistic) or violent (antagonistic) form.

**Design implication**: The platform does not aim to dissolve political conflict through reasoning. It aims to make conflict *healthier* by:
- Making the terms of disagreement explicit
- Distinguishing factual disputes from value disputes
- Ensuring all sides can articulate their positions
- Creating durable records that prevent historical revisionism

The goal is not consensus but *legitimate contestation*—conflict conducted through processes that all parties can accept as fair even when they lose.

---

## 4. The Psychoanalytic Theory of Propaganda Resistance

### 4.1 Identity and Its Pillars

Identity formation—both individual and collective—requires supporting structures. These "pillars" are beliefs, narratives, claims, symbols, and shared understandings that make the identity coherent and meaningful.

Pillars can be:

**Reality-based**: Corresponding to actual states of affairs in shared social reality, testable against experience and evidence.

**Phantasmic**: Imaginary, distorted, exaggerated, or fabricated—not corresponding to reality but experienced as real by those invested in them.

Crucially, *it does not matter for identity maintenance whether pillars correspond to reality*. What matters is that people *believe* them. Phantasmic pillars can support identity just as effectively as reality-based ones—at least for a time.

### 4.2 Libidinal Investment and Pillar Strength

Psychic investment in identity—attachment, emotional commitment, sense of meaning and belonging—is proportional to the perceived strength and stability of its supporting pillars.

Stronger pillars → stronger identification → more resistance to change.

This explains why identity-relevant beliefs are so difficult to change through rational argument alone. The beliefs are not merely cognitive—they are *cathected*, invested with psychic energy. Changing them requires redirecting that investment, not just providing information.

### 4.3 Pillar Maintenance: Actualization vs. Propaganda

Pillars can be maintained and strengthened through two mechanisms:

**Reality-engagement (Actualization)**: Actually doing things in the world that confirm the identity's validity. The worker who works, the citizen who participates, the community that actually supports its members. Reality-based pillars are strengthened through lived experience that confirms them.

**Propaganda**: Creating and disseminating materials that produce strong psychical impressions reinforcing phantasmic pillars—without requiring correspondence to reality. Propaganda maintains pillars through repetition, emotional resonance, and collective reinforcement rather than through reality-testing.

### 4.4 The Stabilization of Phantasm

Phantasmic pillars are stabilized through:

1. **Repetition**: Mere exposure creates felt truth. Claims repeated often enough begin to feel obvious, natural, unquestionable.

2. **Collective Acceptance**: Social proof substitutes for reality-testing. "Everyone knows" becomes evidence.

3. **Absence of Contradiction**: Unchallenged claims become unquestioned. Information environments that filter out contradicting information allow phantasms to persist.

4. **Emotional Encoding**: Claims paired with strong emotions (fear, pride, anger, belonging) are more durable than emotionally neutral claims.

### 4.5 The Erosion Mechanism

The counter-propaganda function of the platform rests on this thesis:

> **Repeated exposure to materials, from diverse sources, that contradict, dispute, or rebut phantasmic claims will, over time, erode the pillars supporting those claims.**

Key variables affecting erosion:

| Variable | Effect |
|----------|--------|
| **Repetition** | Single exposures have minimal effect; repeated exposure is necessary |
| **Source diversity** | The same contradiction from multiple independent sources is more erosive than from a single source |
| **Source credibility** | In-group sources may be more effective than out-group sources |
| **Specificity** | Contradictions addressing the actual pillar are more effective than general skepticism |
| **Emotional tone** | Hostile contradiction may trigger defense; measured contradiction may erode better |
| **Available alternatives** | Erosion without alternative pillars may be resisted; erosion with alternatives may succeed |

### 4.6 Pillar Substitution and Healthy Identity

As phantasmic pillars erode, libidinal investment doesn't simply dissipate—it seeks new objects. If reality-based pillars are available, investment can shift toward them.

**The health criterion**: Identities primarily supported by reality-based pillars are "healthy" in the sense that they:
- Can engage with shared social reality without breakdown
- Can update based on evidence and experience
- Don't require maintenance of delusion
- Can interact with other identities without requiring them to share the delusion

### 4.7 Healthy Agonism

This framework reframes the goal of counter-propaganda:

The irreducible struggle between identity groups within the body politic is *not a problem as such*—if the identities involved are healthy. Political conflict between groups whose identities are reality-based can be legitimate, productive, even generative.

Political conflict becomes pathological when one or more groups depend on phantasmic pillars that cannot survive contact with reality or with other groups' legitimate claims.

**The platform's role**: Not to resolve political conflict, but to shift its basis from phantasm to reality—making agonism healthy rather than pathological.

### 4.8 The Platform as Erosion Infrastructure

The platform serves the erosion function by enabling:

1. **Production of contradiction materials**: High-quality, specific contradictions to phantasmic claims, structured with evidence and reasoning.

2. **Diverse transmission formats**: The same contradiction packageable for different vectors (academic citation, newsletter, social media, podcast talking points).

3. **Durability**: Contradiction materials that persist and can be repeatedly deployed over long time horizons.

4. **Coordination**: Multiple actors producing consistent contradictions from their diverse positions and audiences.

5. **Accountability**: Records that create "receipts"—making it harder to shift positions without acknowledgment.

---

## 5. Procedural Epistemology: How the Platform Operationalizes "Reality"

### 5.1 The Operationalization Problem

The theory of propaganda resistance depends on distinguishing "reality-based" from "phantasmic" pillars. But who decides? By what criteria?

The platform's answer: **procedural epistemology**. "Reality" is not determined by external authority or algorithmic classification but through structured inquiry that tests claims against challenge.

### 5.2 The Procedural Theory of Truth

The platform implements something close to Peirce's pragmatic maxim or Habermas's discourse theory of truth:

> **A claim's relationship to reality is constituted through the process of withstanding challenge.**

What's "real" is what survives the structured test of inquiry. This is not "objective truth" in a correspondence sense—it's *procedural warrant*. And crucially, it updates as new arguments and evidence enter the system.

### 5.3 Architectural Implementation

The platform operationalizes this procedural epistemology through:

| Feature | Function in Reality-Determination |
|---------|-----------------------------------|
| **Challenge obligations** | Claims that can't be defended don't persist as "established" |
| **Commitment stores** | Positions can't quietly shift; contradictions become visible |
| **Attack typing** (rebut/undercut/undermine) | Forces precision about *where* a claim fails |
| **Critical questions** | Auto-generates challenges any rigorous thinker would pose |
| **ASPIC+ acceptability** | Formally computes which arguments survive given current attack graph |
| **Versioned releases** | State of what's "established" captured at moments in time |
| **Evidence linking** | Claims tethered to grounds that can themselves be examined |

### 5.4 The Grounded Extension as "Provisional Reality"

In ASPIC+ formal argumentation, the **grounded extension** is the unique minimal set of arguments that are defensible—they survive all attacks given the current state of debate.

This represents:

> **What we can currently say is defensible, given everything that's been asserted and challenged.**

This isn't "objective truth"—it's procedural warrant. It updates as new arguments enter. The grounded extension at release v1.0.0 might differ from v2.0.0 because new challenges have emerged.

### 5.5 Good Faith as Infrastructure

The operationalization requires good faith participation. The architecture partially *enforces* good faith rather than merely assuming it:

- **R4 invariant**: No duplicate replies (can't spam)
- **Response obligations**: Challenges can't be silently ignored
- **Provenance tracking**: Every move has attribution and timestamp
- **Commitment stores**: Contradictions and position shifts are visible

This doesn't guarantee good faith, but it raises the cost of bad faith and makes it visible when it occurs.

### 5.6 The Operationalization Is the Process

To directly answer "how do you operationalize 'phantasmic' vs. 'reality-based'":

> **A claim is phantasmic to the degree that it cannot survive structured challenge within the system. A claim is reality-based to the degree that it can.**

This is testable not by external reference but by internal process. The platform *is* the operationalization.

**Limitations**:
- Only applies to claims that *enter* the system
- Requires participants who engage rather than withdraw when challenged
- Doesn't address claims that can't be formalized
- Vulnerable to coordinated bad faith at scale

---

## 6. User Model: Tiers of Engagement

### 6.1 Three-Tier Model

The platform does not assume or require mass adoption. It operates through a tiered model:

#### Tier 1: Primary Producers (Core Users)

**Who they are**:
- Academic researchers
- Policy analysts
- Investigative journalists
- Advocacy research staff
- Think tank professionals

**What they do**: Produce reasoned analysis that others rely on.

**Characteristics**: High expertise, professional stakes in quality, time for sophisticated tools.

**Platform value**: Structured literature engagement, evidence management, argument structure, institutional memory.

#### Tier 2: Amplifier-Translators (Bridge Users)

**Who they are**:
- Newsletter writers
- Podcast hosts
- Science/policy communicators
- Engaged bloggers
- Subject-matter influencers

**What they do**: Translate expert analysis for broader audiences.

**Characteristics**: Lower expertise than Tier 1, higher reach and translation skill.

**Platform value**: Source tracking, structured reading notes, citeable synthesis, credibility anchoring.

#### Tier 3: Informed Engagers (Participant Users)

**Who they are**:
- Engaged citizens
- Local officials
- Professional-adjacent individuals
- Community organization members

**What they do**: Engage seriously but don't produce content professionally.

**Characteristics**: Limited time, variable expertise, episodic engagement.

**Platform value**: Reading infrastructure, position tracking, informed participation in specific deliberations.

### 6.2 Product Strategy

**Build for Tier 1, design for Tier 2, enable Tier 3.**

The platform's power comes from intensive users (Tier 1) producing high-quality reasoning that travels through bridge users (Tier 2) to reach broader audiences (Tier 3).

This is an *asymmetric* user model: many more readers than writers, value created by intensive users and distributed by bridge users.

### 6.3 What Makes Outputs Travel

Platform outputs must be translatable to native formats used in existing discourse:

| Aspect | Translatability | How It Travels |
|--------|-----------------|----------------|
| Conclusions/positions | High | Statement of bottom line |
| Key evidence | Medium-High | Citation, link, quote |
| Argument structure | Medium | Simplified narrative |
| Contestation status | Medium | Summary of debate state |
| Full reasoning chain | Low | Link to source |
| Commitment tracking | Low | Selective quotation |

**Export formats needed**: Executive summary, thread draft, newsletter block, podcast prep doc, citation block, embeddable widgets.

**Credibility anchor model**: Platform outputs don't replace existing formats—they anchor them. Analysis happens on platform with full structure → outputs translated into native formats → links back provide credibility anchor → readers who want depth can follow link.

---

## 7. Types of Civic Disagreement

### 7.1 Four Types of Disagreement

Not all disagreements are alike. The platform must handle different types differently:

#### Factual Disagreements

**Nature**: Disputes about what is the case—empirical claims that are in principle resolvable through evidence.

**Examples**: What are the actual emissions impacts of different interventions? How many housing units does this policy produce?

**Platform response**: Evidence evaluation, ASPIC+ acceptability semantics, challenge-response tracking.

**Resolution possibility**: High—if evidence is available and participants are responsive to it.

#### Interpretive Disagreements

**Nature**: Disputes about the meaning or significance of agreed-upon facts.

**Examples**: Is this primarily a supply-side or demand-side problem? Does this policy constitute "equity" or "favoritism"?

**Platform response**: Frame articulation, scopes for exploring different interpretations, making interpretive assumptions explicit.

**Resolution possibility**: Medium—can often clarify what's at stake, even if interpretation persists.

#### Value Disagreements

**Nature**: Disputes about what matters, what trade-offs are acceptable, what goals should be prioritized.

**Examples**: How do we weight climate urgency vs. economic impact? Is efficiency or equity more important?

**Platform response**: Trade-off visibility, value articulation, ensuring all value positions can be stated and examined.

**Resolution possibility**: Low—but process legitimacy can be achieved even without substantive consensus.

#### Interest Disagreements

**Nature**: Disputes where different groups have genuinely conflicting interests.

**Examples**: Which neighborhoods receive investments? Whose property values are affected?

**Platform response**: Stakeholder voice, impact documentation, ensuring affected parties can articulate their interests.

**Resolution possibility**: Low—requires political process, not deliberation, to resolve. Platform can clarify stakes.

### 7.2 Design Implications

The platform must avoid treating all disagreements as factual. Attempting to "resolve" value and interest conflicts through evidence and argument misunderstands their nature and frustrates participants.

| Disagreement Type | Platform Role | Success Criterion |
|-------------------|---------------|-------------------|
| Factual | Resolve through evidence and challenge | Convergence on defensible position |
| Interpretive | Clarify frames and make assumptions explicit | Mutual understanding of different readings |
| Value | Articulate trade-offs, don't pretend to resolve | All positions fairly represented |
| Interest | Document stakes, ensure voice for affected parties | Legitimate process even without agreement |

---

## 8. Architectural Capabilities

### 8.1 Core Architecture

The platform represents discourse as a graph of typed entities rather than a sequence of messages:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FIVE CONCEPTUAL LAYERS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Layer 1: CLAIMS & EVIDENCE                                             │
│  Transform informal ideas into canonical, evidence-linked assertions    │
│  → Propositions, Claims, ClaimEdges, Evidence, QuoteNodes               │
│                                                                         │
│  Layer 2: ARGUMENTS & DIALOGUE                                          │
│  Structure reasoning with premises, conclusions, schemes, moves         │
│  → Arguments, ArgumentChains, DialogueMoves, Commitments                │
│                                                                         │
│  Layer 3: OUTPUTS & ARTIFACTS                                           │
│  Compose reasoning into publishable, citable documents                  │
│  → Thesis, TheoryWorks, KbPages, DebateSheets                           │
│                                                                         │
│  Layer 4: ACADEMIC INFRASTRUCTURE                                       │
│  Support scholarly workflows with paper-to-claim pipelines              │
│  → ClaimSource, ClaimTypes, DebateReleases, Forks, Merges               │
│                                                                         │
│  Layer 5: KNOWLEDGE GRAPH                                               │
│  Enable cross-deliberation intelligence and versioned memory            │
│  → RoomFunctor, TransportFunctor, ClaimProvenance, Releases             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 AIF Ontology Compliance

All structures conform to the **Argument Interchange Format (AIF)** ontology:

| AIF Node Type | Description | Implementation |
|---------------|-------------|----------------|
| **I-node** (Information) | Propositions/claims containing content | `Claim`, `AifNode` (nodeKind='I') |
| **RA-node** (Rule Application) | Inference steps applying schemes | `Argument`, `AifNode` (nodeKind='RA') |
| **CA-node** (Conflict Application) | Attack relations (rebut/undercut/undermine) | `ArgumentEdge`, `AifNode` (nodeKind='CA') |
| **PA-node** (Preference Application) | Priority/ordering relations | `AifNode` (nodeKind='PA') |
| **DM-node** (Dialogue Move) | Locutions in dialogue | `DialogueMove`, `AifNode` (nodeKind='DM') |

### 8.3 ASPIC+ Framework

The platform implements ASPIC+ structured argumentation:

- **Strict rules**: X₁, ..., Xₙ → Y (deductive)
- **Defeasible rules**: X₁, ..., Xₙ ⇒ Y (presumptive)
- **Contrariness function**: Maps formulas to contraries
- **Preference ordering**: Over rules and/or premises

**Attack types**:
- **Rebutting**: Argument for ¬φ attacks argument for φ
- **Undermining**: Argument for ¬ψ attacks premise ψ
- **Undercutting**: Argument attacks applicability of defeasible rule

### 8.4 Dialogue Protocol (PPD)

The platform implements a formal dialogue protocol with typed moves:

| Move Kind | Force | Effect |
|-----------|-------|--------|
| ASSERT | NEUTRAL | Adds claim to commitment store |
| WHY | ATTACK | Challenges a commitment |
| GROUNDS | ATTACK | Provides justification |
| RETRACT | SURRENDER | Withdraws a commitment |
| CONCEDE | SURRENDER | Accepts opponent's claim |
| CLOSE | SURRENDER | Ends branch (daimon †) |

### 8.5 Categorical Foundations (ECC)

The system implements **Evidential Closed Categories** providing formal grounding for argument composition:

```
Each Deliberation is modeled as a small ECC:

Objects:    Ob(𝒟) = { Claims in this deliberation }
Morphisms:  Mor(𝒟) = { Arguments supporting claims }
Hom-sets:   𝒟(A,B) = { args deriving B from A } (join-SLat)
Terminal:   I = "ground truth" (no premises needed)
Tensor:     A ⊗ B = conjunction of claims
Internal:   [A,B] = warrant (attackable implication)
Conf:       c: Mor → [0,1] (confidence measure)
```

### 8.6 The Plexus (Cross-Deliberation Intelligence)

At a higher level, the network of deliberations forms the **Plexus**—a category where objects are deliberations (each an ECC) and morphisms are **RoomFunctors** that transport arguments between rooms:

- Claims can be imported across deliberations with provenance preserved
- Arguments constructed in one context can migrate into related deliberations
- Cross-references, overlapping claims, and shared sources create explicit relationships
- The network accumulates institutional memory

### 8.7 Versioning and Releases

Deliberations produce versioned snapshots:

```
v1.0.0 (Initial release)
    │
    ├─▶ v1.0.1 (patch: typo fixes)
    ├─▶ v1.1.0 (minor: new supporting argument)
    └─▶ v2.0.0 (major: key claim conceded)
```

Each release captures:
- All claims with computed statuses (DEFENDED, CONTESTED, UNRESOLVED)
- All arguments with ASPIC+ acceptability labels
- Complete attack graph
- Generated changelog (diff from previous version)
- Citable reference

---

## 9. Design for Democratic Equality

### 9.1 The Accessibility-Rigor Paradox

The platform's formal infrastructure creates a tension: the features enabling rigorous reasoning (schemes, critical questions, attack types, commitment tracking) may exclude participants unfamiliar with formal argumentation.

If only the highly educated can participate effectively, the platform reproduces existing inequalities rather than challenging them.

### 9.2 Resolution: Progressive Formalization

Structure activates only when complexity warrants it:

```
INFORMAL ◄─────────────────────────────────────────────────► FORMAL

Discussion     Proposition      Claim         Argument      Thesis
(chat/forum)   (workshopping)   (canonical)   (structured)  (published)
     │              │              │              │             │
     │   upgrade    │   promote    │    link      │  publish    │
     └──────────────┴──────────────┴──────────────┴─────────────┘

Structure emerges on-demand, not imposed upfront
```

Users can stay in lightweight discussion mode indefinitely, or upgrade to full deliberation when formalization becomes valuable.

### 9.3 Multiple Entry Points

Different contribution levels accommodate different capacities:

| Level | Complexity | Who Can Contribute |
|-------|------------|-------------------|
| **Testimony** | Lowest | Anyone with relevant experience |
| **Concern** | Low | Anyone who can articulate what worries them |
| **Position** | Medium | Anyone who can state a view |
| **Argument** | High | Those comfortable with structured reasoning |
| **Analysis** | Highest | Those with expertise and time |

All levels are legitimate contributions. Facilitators help translate between levels.

### 9.4 Facilitated Mode

For civic deliberations, facilitated mode is the default:

- Trained facilitators guide structured reasoning
- Facilitators help translate informal contributions into formal structures
- Participants can contribute in natural language; structure emerges through facilitation
- Modeled on Irish Citizens' Assembly approach

Self-service mode (no facilitation) is available for experienced users and professional contexts.

### 9.5 Representation Monitoring

The platform tracks participation patterns to flag:
- Demographic gaps in who's contributing
- Domination by particular voices
- Perspectives that may be missing

This doesn't automatically fix inequality but makes it visible and addressable.

---

## 10. Landscape Analysis

### 10.1 Current Civic Tech Limitations

| Platform Type | Examples | What's Missing |
|---------------|----------|----------------|
| **Comment collection** | PublicInput, Granicus | No dialogue; no structure; no synthesis |
| **Preference aggregation** | Pol.is, Consider.it | Surfaces positions without reasoning |
| **Social discussion** | Nextdoor, Facebook Groups | Optimizes engagement over understanding |
| **Process workflow** | Decidim, Loomio | Good process tools; no argument structure |
| **Deliberation events** | Fishkin's Deliberative Polls | Excellent methodology; not persistent infrastructure |

### 10.2 Competitive Position

What argumentation-theoretic infrastructure enables that cannot be retrofitted onto comment systems:

| Capability | Why It Requires Purpose-Built Infrastructure |
|------------|---------------------------------------------|
| **Canonical claims** | Requires data model for addressable assertions |
| **Evidence linking** | Requires citation infrastructure with provenance |
| **Attack typing** | Requires formal ontology (rebut vs. undercut vs. undermine) |
| **Commitment tracking** | Requires dialogue protocol with state management |
| **Acceptability computation** | Requires ASPIC+ implementation |
| **Cross-deliberation transport** | Requires categorical structure (Plexus) |
| **Versioned releases** | Requires snapshot and diff infrastructure |

These are not features that can be added to existing platforms—they require the platform to be architected around them from the start.

---

## 11. Core Use Cases

### 11.1 Policy Deliberation

**Scenario**: City council considering climate action plan implementation priorities.

**Platform function**:
- Frame the central question and sub-questions
- Enable citizen contributions at appropriate levels (testimony → argument)
- Track what's been claimed, challenged, and defended
- Surface trade-offs between competing priorities
- Produce documented recommendations with reasoning

**Success**: Decision-makers receive structured input with clear reasoning; participants can see how their contributions factored into synthesis.

### 11.2 Participatory Budgeting Enhancement

**Scenario**: Annual participatory budgeting process for discretionary spending.

**Platform function**:
- Move beyond simple voting on proposals
- Enable deliberation about priorities and trade-offs
- Document reasoning behind budget allocations
- Create durable record for future cycles

**Success**: Budget decisions reflect reasoned trade-offs, not just proposal popularity.

### 11.3 Community Conflict Resolution

**Scenario**: Contentious local issue (e.g., development proposal, school policy).

**Platform function**:
- Structured space for articulating positions and reasons
- Ensure all stakeholder perspectives are represented
- Distinguish factual disagreements from value disagreements
- Identify areas of potential agreement

**Success**: Even without consensus, participants understand each other's positions and the process is seen as legitimate.

### 11.4 Institutional Decision Documentation

**Scenario**: Agency needs to document reasoning behind regulatory decision.

**Platform function**:
- Capture deliberation process, not just outcome
- Show evidence considered and alternatives evaluated
- Document responses to public comments and objections
- Create auditable record for legal and political accountability

**Success**: Decision is defensible because reasoning is transparent and documented.

---

## 12. Adoption Strategy

### 12.1 Political Economy of Adoption

**Who benefits from adoption**:
- Reform-minded officials seeking legitimacy
- Engagement staff seeking better tools
- Transparency advocates
- Communities seeking voice

**Who may resist**:
- Officials preferring ambiguity
- Dominant voices in current processes
- Legal/compliance staff (uncertainty about new tools)
- Those benefiting from status quo opacity

### 12.2 Three Adoption Pathways

#### Pathway 1: Internal Government Use First

Start with internal deliberation (staff planning, inter-agency coordination) before public deployment. Lower stakes; builds familiarity; demonstrates value.

#### Pathway 2: Community Organization Entry

Partner with civic organizations who adopt for internal use, then advocate for government adoption. Builds grassroots demand; demonstrates community capacity.

#### Pathway 3: Facilitated Pilot Partnership

Joint pilot with government partner, research institution, and civic organizations. Intensive support; rigorous evaluation; case study production.

**Recommended**: Pathway 3 for initial deployment, transitioning to Pathway 1 and 2 for scaling.

### 12.3 Trust-Building Tactics

| Tactic | Mechanism |
|--------|-----------|
| **Open source** | Inspectable code; no lock-in; community contribution |
| **Transparent governance** | Platform decisions made via platform |
| **Case studies** | "Here's how organization X used this" |
| **Academic validation** | Published research on outcomes |
| **Privacy commitment** | Clear data policies; no advertising model |
| **Progressive onboarding** | Start simple; complexity available when needed |

### 12.4 Pilot Strategy

**Primary target**: City of Berkeley, California — Climate Action Plan Implementation Deliberation

**Why Berkeley**:
- Population 124K (ideal 50K-200K range)
- Demonstrated reform appetite (first California city to eliminate single-family zoning, July 2025)
- Highly engaged citizenry
- Research partnership potential (UC Berkeley Othering & Belonging Institute, Stanford Deliberative Democracy Lab)
- Professional planning staff

**Timeline**: 6 months (Q2-Q3 2026)
**Budget**: $175,000-$250,000

**Secondary alternative**: City of Richmond — Environmental Justice Priorities Deliberation

See separate Pilot Proposal document for detailed design.

---

## 13. Measurement Framework

### 13.1 Staged Measurement

Ultimate political effects are probably unmeasurable—multi-causal, long-latency, counterfactual-dependent. But proxies can be measured at each stage:

| Stage | What's Measured | Measurability |
|-------|-----------------|---------------|
| **Platform Usage & Quality** | User composition, engagement depth, deliberation completion, output quality | High |
| **Output Propagation** | External citations, social sharing, media mentions, embed usage | Medium-High |
| **Discourse Quality** | Content analysis of user outputs, argument sophistication | Medium |
| **Political Outcomes** | Decision influence, policy change | Low |

### 13.2 Specific Metrics

**Participation metrics**:
- Count and diversity of participants
- Engagement depth (contributions per participant)
- Completion rates

**Deliberation quality metrics**:
- Argument structure (premises linked to conclusions)
- Evidence citation rate
- Challenge-response rate
- Critical question engagement

**Outcome metrics**:
- Resolution rates for factual disputes
- Decision incorporation (outputs referenced in official decisions)
- Participant-reported learning and perspective change

**Legitimacy metrics**:
- Perceived fairness (survey)
- Understanding of opposing views (pre/post)
- Acceptance of outcome regardless of agreement

### 13.3 Accepting Measurement Limits

Demanding rigorous measurement of long-chain social effects may be the wrong frame. Many valuable interventions—journalism, education, philosophy—can't be rigorously measured.

**Alternative frame**: Build infrastructure plausibly useful by its own logic, measure what you can, accept uncertainty about ultimate effects. This is how most institution-building works.

---

## 14. Self-Application: The Platform as Its Own Test

### 14.1 The Principle

The same principles that govern platform use should govern platform development. The platform should be its own test case.

### 14.2 Platform Governance via Platform

Key governance questions should be deliberated using the platform:

- What should moderation policies be?
- How should new features be prioritized?
- What argumentation schemes should be added?
- How should bad faith actors be handled?

Each deliberation produces:
- A thesis documenting the decision
- A release capturing the state at decision time
- A record of who committed to what

### 14.3 Transparency About Platform's Own Assumptions

The platform's theoretical assumptions (the pillars of its own identity) should be:
- Explicitly articulated
- Open to challenge within the platform
- Updated based on evidence and argument

If the platform claims that structured reasoning improves discourse quality, that claim should itself be testable and challenged within the platform's own infrastructure.

### 14.4 Evolution Model

Modeled on Wikipedia's self-governance, but enhanced:

| Wikipedia Feature | Platform Enhancement |
|-------------------|----------------------|
| Talk pages (unstructured) | Deliberations with claims, arguments, challenges |
| Policies (prose documents) | Thesis documents generated from deliberations |
| "Consensus" (vague norm) | ASPIC+ acceptability (formal criterion) |
| Edit history (flat log) | Releases with computed claim status changes |

---

## 15. Timeline and Sustainability

### 15.1 Realistic Timeline

This is a decade-scale project, not a startup-scale one:

| Phase | Timeline | Characteristics |
|-------|----------|-----------------|
| **Early Adopters** | Now - Year 2 | Small cohorts intrinsically motivated; tolerate rough edges; provide feedback |
| **Use-Case Proof Points** | Year 2-4 | Specific communities adopt for specific purposes; case studies accumulate |
| **Infrastructure Recognition** | Year 4-6 | Platform becomes recognized as serious infrastructure; institutional adoption begins |
| **Normalization** | Year 6+ | Using structured deliberation becomes expected in certain contexts; network effects emerge |

### 15.2 Sustainability Model

**Revenue sources**:
- Government contracts (pilots, ongoing service)
- Foundation grants (democracy, civic innovation, research)
- Institutional subscriptions (think tanks, universities, advocacy organizations)
- Research partnerships

**What's not the model**:
- Advertising (conflicts with mission)
- Data extraction (conflicts with trust)
- Venture-scale growth expectations (incompatible with decade timeline)

### 15.3 The Demand Hypothesis

The hypothesis: there is genuine demand for democratic, autonomous, self-organizing software infrastructure with the capabilities and ethos that foster serious discourse.

Supporting evidence:
- Post-2016, post-COVID distrust in Big Tech
- Rise of alternative platforms (Mastodon, Bluesky, fediverse)
- Institutional demand for defensible reasoning
- Academic/research demand (replication crisis, open science)

The path: slow accumulation of building, testing, outreach, feedback, adoption. There are no shortcuts.

---

## Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **AIF** | Argument Interchange Format - standard ontology for argumentation |
| **Agonism** | Political theory view that conflict is irreducible and potentially healthy |
| **ASPIC+** | Structured argumentation framework with strict/defeasible rules |
| **CA-node** | Conflict Application node (attack relationship) |
| **Claim** | An addressable assertion with stable identifier |
| **Commitment Store** | Record of positions a participant has taken |
| **Critical Question** | Challenge surfaced by argumentation scheme |
| **Deliberation** | Structured discussion space with phases and participants |
| **DialogueMove** | Typed contribution (ASSERT, CHALLENGE, RESPOND, etc.) |
| **ECC** | Evidential Closed Category - categorical semantics for arguments |
| **Evidence** | Source material linked to claims with citation specificity |
| **Grounded Extension** | Unique minimal defensible set of arguments in ASPIC+ |
| **I-node** | Information node (claims, propositions) |
| **Phantasmic Pillar** | Identity-supporting belief not corresponding to reality |
| **Plexus** | Category of categories - network of deliberations |
| **PPD** | Protocol for Persuasion Dialogues |
| **RA-node** | Rule Application node (inference relationship) |
| **Reality-based Pillar** | Identity-supporting belief that can survive reality-testing |
| **Release** | Versioned snapshot of deliberation state |
| **Scheme** | Recognized pattern of argument with associated critical questions |

### Appendix B: Comparison to Academic Agora

| Dimension | Academic Agora | Civic Agora |
|-----------|----------------|-------------|
| **Primary users** | Scholars, researchers | Residents, officials, organizers |
| **Content** | Papers, claims, arguments | Proposals, policies, positions |
| **Disagreement types** | Primarily factual/interpretive | Factual, interpretive, value, interest |
| **Validation** | Peer review, evidence | Public scrutiny, formal process |
| **Accessibility need** | High education assumed | General public literacy required |
| **Facilitation** | Self-service viable | Facilitation often essential |
| **Timeline** | Long-form (months/years) | Issue-cycle (weeks to months) |
| **Privacy** | Public scholarship | Mixed (some deliberations sensitive) |
| **Legal context** | Academic norms | Public records, open meetings law |

### Appendix C: Key Theoretical Influences

| Thinker | Contribution | Platform Incorporation |
|---------|--------------|------------------------|
| **Habermas** | Discourse ethics, communicative action | Requirements for legitimate deliberation |
| **Mouffe** | Agonistic pluralism | Politics as struggle, not consensus |
| **Fishkin** | Deliberative polling methodology | Facilitation model, measurement |
| **Young** | Critique of deliberative exclusion | Multiple contribution modes |
| **Walton** | Argumentation schemes | Scheme library, critical questions |
| **Dung** | Abstract argumentation | Attack semantics, extensions |
| **Girard** | Ludics | Game-theoretic dialogue analysis |
| **Peirce** | Pragmatic maxim | Procedural theory of truth |

### Appendix D: Related Documents

- **System Architecture**: Full technical specification of platform implementation
- **Pilot Proposal**: Detailed design for Berkeley Climate Action Plan deliberation
- **Academic Agora Specification**: Platform use for scholarly discourse
- **Facilitation Training Guide**: Materials for deliberation facilitators (forthcoming)

---

*This document represents the strategic vision as of January 2026. It should be updated as pilot learnings emerge and as the theoretical framework evolves through application.*
