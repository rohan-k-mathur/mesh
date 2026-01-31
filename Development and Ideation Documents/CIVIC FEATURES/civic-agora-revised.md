# Civic Agora: Infrastructure for Democratic Reasoning

## Purpose

This document articulates how Mesh/Agora serves as infrastructure for structured civic deliberation—a platform enabling citizens, community organizations, policymakers, and public institutions to reason together with the rigor that consequential decisions require.

**Core Thesis**: Democratic legitimacy requires more than voting. It requires public reasoning: discourse in which participants evaluate arguments, examine evidence, and achieve mutual understanding of contested questions. Contemporary infrastructure systematically prevents this. Social platforms architecture reasoning out of existence; government engagement tools digitize broken processes; civic tech treats deliberation as comment collection. Civic Agora provides what democracy actually needs: infrastructure where claims are addressable, arguments are structured, challenges cannot be ignored, and reasoning accumulates as common resource.

---

## Table of Contents

1. [The Democratic Deficit](#1-the-democratic-deficit)
2. [Theoretical Foundations](#2-theoretical-foundations)
3. [The Civic Agora Model](#3-the-civic-agora-model)
4. [Types of Civic Disagreement](#4-types-of-civic-disagreement)
5. [Landscape Analysis](#5-landscape-analysis)
6. [Core Use Cases](#6-core-use-cases)
7. [User Personas](#7-user-personas)
8. [Design for Democratic Equality](#8-design-for-democratic-equality)
9. [Feature Requirements](#9-feature-requirements)
10. [Adoption Strategy](#10-adoption-strategy)
11. [Measurement Framework](#11-measurement-framework)
12. [Challenges & Mitigations](#12-challenges--mitigations)
13. [Pilot Strategy](#13-pilot-strategy)
14. [Phased Roadmap](#14-phased-roadmap)

---

## 1. The Democratic Deficit

### 1.1 The Structural Problem

Voting alone does not establish democratic legitimacy. Decisions must emerge from public reasoning: discourse in which participants evaluate arguments to achieve mutual understanding. When Habermas described communicative action—interaction oriented toward rationally motivated consensus through the examination of validity claims—he identified what democratic governance requires but contemporary infrastructure cannot provide.

The emergence of the Internet was expected to enable communicative action at unprecedented scale. The dominant platforms have instead systematically eliminated the conditions under which deliberation can occur:

| Requirement | What Platforms Provide | What Deliberation Requires |
|-------------|------------------------|---------------------------|
| **Structure** | Flat comments, reactions | Explicit reasoning chains from premises to conclusions |
| **Evidence** | Decaying links, screenshots | Persistent citations with verification |
| **Accountability** | Optional anonymity, no response obligation | Challenges that cannot be silently ignored |
| **Accumulation** | Ephemeral feeds, algorithmic burial | Durable record of what's resolved vs. contested |
| **Synthesis** | Thread sprawl | Conclusions that compound into shared knowledge |

These are not bugs to be patched. They reflect architectural choices serving commercial goals incompatible with deliberation. Platforms maximize attention through outrage, tribal signaling, and parasocial performance. Every dollar of market capitalization in social media represents a bet against the possibility of people reasoning together.

### 1.2 Consequences for Democratic Life

The consequences compound across domains:

**For Citizens**: Attempting collaborative reasoning on available platforms produces confusion and exhaustion. People retreat from political engagement not because they lack capacity for thought but because the tools actively prevent its exercise.

**For Officials**: Institutional decisions that require legitimacy cannot be grounded in deliberative processes because no suitable infrastructure exists. The same debates repeat each election cycle. Decisions lack documented reasoning that future administrations can build on.

**For Communities**: Local controversies—zoning, school policy, budgets—generate heat without light. Those with rhetorical skill or time to attend meetings dominate; others' perspectives remain unheard. No synthesis emerges.

**For Democracy**: Those exercising power face no requirement to justify decisions through processes citizens can inspect. Accountability becomes theatrical rather than structural.

### 1.3 Why Current Civic Tech Fails

Civic technology has largely digitized existing (broken) processes rather than reimagining what deliberation infrastructure could provide:

- **Comment collection tools** (PublicInput, Granicus) aggregate input without enabling dialogue
- **Voting platforms** (Pol.is, Consider.it) surface preferences without reasoning
- **Social platforms** (Nextdoor, Facebook Groups) optimize for engagement, not understanding
- **Participatory tools** (Decidim, Loomio) provide process workflow without argument structure

The gap is not a missing feature. It is the absence of infrastructure designed from first principles for what democratic deliberation actually requires.

---

## 2. Theoretical Foundations

### 2.1 Requirements for Democratic Discourse

Drawing on Habermas's discourse ethics and contemporary deliberative democracy scholarship, we identify five conditions necessary for discourse to serve its epistemic function—producing justified beliefs and legitimate decisions rather than merely expressing power:

#### Transparency: Reasoning Chains Must Be Inspectable

Citizens cannot evaluate institutional decisions when reasoning is opaque—buried in meeting minutes, internal memos, or absent entirely. Public consent requires capacity to inspect how conclusions emerged: what evidence was considered, what alternatives evaluated, what objections raised, how they were resolved.

Not narrative justification written after the decision, but structured record of the deliberative process itself.

#### Accessibility: Complex Reasoning Must Be Navigable

Policy questions generate reasoning structures too large for linear reading. Citizens need tools to navigate these structures: starting with conclusions, tracing back to evidence, exploring alternative arguments, understanding disputed points—without reading hundreds of pages sequentially.

Accessibility is not simplification. It is structure that makes complexity navigable rather than overwhelming.

#### Accountability: Claims Must Be Attributable and Challengeable

Public discourse must distinguish grounded claims from ungrounded ones. Every assertion should have clear attribution (who made it, when, in what context), evidential grounding (what supports it), and mechanism for challenge (what would constitute refutation).

This is not about enforcing truth but about making truth-seeking possible. Claims that cannot be challenged cannot be tested. Claims that cannot be tested cannot be distinguished from propaganda.

#### Collaboration: Arguments Must Improve Through Examination

Discourse should produce collaborative refinement, not just competitive victory. When someone identifies a weak premise, authors should strengthen it. When new evidence emerges, arguments should incorporate it. Good-faith criticism should make positions better, not merely defeat them.

The goal is collective intelligence—finding better answers through structured interaction—not debate as performance.

#### Durability: Reasoning Should Accumulate

Deliberations should produce durable knowledge artifacts that persist as foundations for future work. When a community resolves a question, that resolution should be available for others facing similar questions.

Democratic knowledge should accumulate. The alternative is permanent amnesia—each discussion starting from scratch, each generation re-litigating questions their predecessors already settled.

### 2.2 Engaging the Deliberative Democracy Literature

Civic Agora's design draws on and responds to key findings from deliberative democracy research:

#### From Fishkin's Deliberative Polling

James Fishkin's extensive empirical work demonstrates that citizens, given good conditions, produce "considered judgments" that differ systematically from "raw opinions." Key conditions include: balanced information, moderated small-group discussion, and connection to actual decision-making.

**Design implication**: The platform must provide balanced framing, structured dialogue, and visible connection to real outcomes—not just another space for opinion expression.

#### From the Irish Citizens' Assembly Model

Ireland's citizens' assemblies on abortion and marriage equality demonstrated that randomly selected citizens can deliberate productively on deeply contested value questions—producing recommendations that earned broad legitimacy.

**Design implication**: Success required intensive facilitation, expert testimony, and extended engagement over months. Self-service deliberation on contested values may require similar scaffolding.

#### From Young's Critique of Deliberative Exclusion

Iris Marion Young argued that privileging "rational argument" can exclude those whose communicative modes are narrative, testimonial, or rhetorical. Deliberation designed around academic argumentation patterns may reproduce existing inequalities.

**Design implication**: The platform must accommodate multiple modes of contribution—not just formal argument but testimony, lived experience, and narrative—while still enabling structured synthesis.

#### From Mansbridge on Everyday Political Talk

Jane Mansbridge distinguishes formal deliberation from "everyday talk" that shapes political understanding informally. Not all democratic communication needs formal structure.

**Design implication**: Civic Agora addresses a specific gap—structured deliberation on consequential decisions—not all civic communication. The platform complements rather than replaces informal democratic discourse.

### 2.3 The Habermasian Diagnosis

Habermas diagnosed the "re-feudalization" of the public sphere: transformation of spaces for rational-critical debate into arenas of spectacle. Where he observed this through mass media and public relations, contemporary platforms have perfected it through architecture.

Discourse is not suppressed through censorship. It is rendered structurally impossible by systems that make every feature required for reasoning—answerability, evidential grounding, inferential coherence, cumulative development—technically unachievable.

Civic Agora inverts this: architecture designed to make reasoning *structurally possible* by building its requirements into the platform's foundations.

---

## 3. The Civic Agora Model

### 3.1 Core Capabilities

Civic Agora implements infrastructure where reasoning becomes structured, composable, and durable:

#### Claims as Addressable Objects

Every assertion becomes an addressable object with a stable identifier. Policy proposals decompose into specific claims that can be individually engaged, challenged, or supported. Citizens respond to precise assertions, not vague gestures at whole proposals.

```
Proposal: "Rezone district for mixed-use development"
    │
    ├── Claim 1: "This will create 500 new housing units"
    │   └── [Evidence: Developer projections, comparable projects]
    │
    ├── Claim 2: "Traffic impact will be minimal"
    │   └── [Challenged: Resident group cites traffic study]
    │
    └── Claim 3: "Property values in adjacent areas will increase"
        └── [Contested: Conflicting economic analyses]
```

#### Typed Relationships

Every relationship is typed—support, attack, equivalence. The platform distinguishes:

- **Rebuttals**: Direct challenges to conclusions ("That claim is false because...")
- **Undercuts**: Challenges to inference ("Even if true, it doesn't follow that...")
- **Undermining**: Challenges to premises or evidence ("That study has methodological flaws...")

Precision in disagreement enables precision in response.

#### Argumentation Schemes

Arguments follow recognized patterns (60+ schemes from Walton's taxonomy) that surface the questions any rigorous thinker would ask:

| Scheme | Civic Application | Auto-Generated Critical Questions |
|--------|-------------------|----------------------------------|
| Argument from Consequences | "This policy will lead to X" | Is the causal claim established? Other factors? Unintended effects? |
| Argument from Precedent | "City Y did this successfully" | Are the cases comparable? What differs? |
| Argument from Expert Authority | "The traffic engineer says..." | Is the expert qualified? Any conflicts of interest? |
| Argument from Equity | "This affects group Z disproportionately" | Is the disparity documented? Causally linked to policy? |

Critical questions cannot be silently ignored—the platform makes them visible and tracks responses.

#### Commitment Stores

The platform tracks what each participant has asserted, conceded, and committed to. Citizens can see:
- What positions their council member has taken
- Whether official responses address specific challenges
- How positions have evolved through deliberation

#### Durable Artifacts

Deliberations produce outputs: decision rationales, policy briefs, synthesis documents. These are generated from the argument structure, not written separately. The reasoning *is* the documentation.

### 3.2 The Democratic Deliberation Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                  THE DEMOCRATIC DELIBERATION STACK                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TRADITIONAL LAYER (Preserved)                                      │
│  ├── Voting (elections, referenda)                                  │
│  ├── Representation (elected officials)                             │
│  ├── Public meetings (town halls, hearings)                         │
│  └── Public comment (written submissions)                           │
│                                                                     │
│  ════════════════════════════════════════════════════════════════   │
│                                                                     │
│  CIVIC AGORA LAYER (New Infrastructure)                             │
│  ├── Claims: Addressable assertions about policy                    │
│  ├── Arguments: Structured reasoning with evidence                  │
│  ├── Commitments: Tracked positions over time                       │
│  ├── Challenges: Typed objections requiring response                │
│  ├── Syntheses: Documented resolutions and remaining disputes       │
│  ├── Releases: Versioned snapshots of deliberation state            │
│  └── Artifacts: Decision rationales with full reasoning trail       │
│                                                                     │
│  ════════════════════════════════════════════════════════════════   │
│                                                                     │
│  OUTCOME                                                            │
│  Decisions with visible reasoning, accountable positions, and       │
│  institutional memory that compounds across issues and time.        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 What Civic Agora Is Not

**Not a replacement for formal processes**: Town halls, public comment periods, and council meetings continue. Civic Agora provides the reasoning layer that makes these processes more informed.

**Not a voting platform**: Pol.is and similar tools aggregate preferences. Civic Agora structures the reasoning that should inform preferences.

**Not a social network**: No algorithmic feed, no engagement optimization, no advertising model.

**Not a comment section**: Contributions are structured moves in a deliberation, not reactions to content.

---

## 4. Types of Civic Disagreement

Not all civic disagreement is the same. The platform must handle distinct types differently:

### 4.1 Factual Disagreements

**Nature**: Disputes about empirical claims—what is true about the world.

*Example*: "Will this development increase traffic on Main Street?"

**What the platform provides**:
- Evidence linking to studies, data, expert analysis
- Structured evaluation of competing claims
- ASPIC+ acceptability semantics to compute which claims survive challenge
- Clear documentation of what evidence supports which conclusions

**Expected outcome**: Resolution through evidence, or clear documentation of remaining uncertainty.

### 4.2 Interpretive Disagreements

**Nature**: Disputes about how to understand or frame a situation.

*Example*: "Is the housing shortage primarily a supply problem or an affordability problem?"

**What the platform provides**:
- Explicit framing of different interpretive lenses
- Scopes that explore "Under interpretation X..." analyses
- Visibility into how different framings lead to different conclusions
- Identification of empirical questions that could distinguish between interpretations

**Expected outcome**: Clarification of how different interpretations lead to different conclusions; identification of evidence that would adjudicate between them.

### 4.3 Value Disagreements

**Nature**: Disputes about priorities and principles—what matters more.

*Example*: "Should we prioritize housing affordability or neighborhood character?"

**What the platform provides**:
- Explicit articulation of competing values
- Exploration of whether values actually conflict or can be reconciled
- Visibility into how different value weightings lead to different conclusions
- Documentation of value trade-offs inherent in different options

**Expected outcome**: Not resolution (values are not "solved"), but clarity: what values are in tension, what trade-offs each option entails, and what each choice reflects about community priorities.

### 4.4 Interest Disagreements

**Nature**: Genuine conflicts where some parties benefit and others are harmed.

*Example*: "This zoning change benefits future residents but harms current homeowners."

**What the platform provides**:
- Explicit identification of affected parties and impacts
- Separation of interest claims from value/factual claims
- Exploration of mitigations, compensations, or alternatives that reduce conflict
- Documentation of who bears costs and who receives benefits

**Expected outcome**: Not consensus (interests genuinely conflict), but legitimacy through process: all affected parties had voice, trade-offs are documented, decision-makers are accountable for choices.

### 4.5 Design Implications

| Disagreement Type | Primary Platform Function | Success Metric |
|-------------------|---------------------------|----------------|
| Factual | Evidence evaluation | Claims resolved or uncertainty quantified |
| Interpretive | Frame articulation | Interpretations clarified, implications traced |
| Value | Trade-off visibility | Values explicit, trade-offs documented |
| Interest | Stakeholder voice | All parties heard, impacts documented |

The platform must avoid the trap of treating all disagreements as factual—as if better evidence or argument would resolve them. Value and interest conflicts require different processes: ensuring all perspectives are heard, making trade-offs visible, and creating legitimacy through procedural fairness rather than substantive consensus.

---

## 5. Landscape Analysis

### 5.1 Existing Civic Tech Platforms

#### Deliberation & Engagement Platforms

| Platform | What It Does | Strengths | Limitations |
|----------|--------------|-----------|-------------|
| **Pol.is** | Opinion clustering via voting | Surfaces consensus areas; used by vTaiwan | No argument structure; preferences without reasoning |
| **Decidim** | Participatory democracy platform | Open source; proposal lifecycle | Process-focused; comments without structure |
| **Loomio** | Cooperative decision-making | Consent-based; good for groups | Small scale; no claim-level engagement |
| **Consider.it** | Pro/con visualization | Clear trade-off display | Binary framing; shallow reasoning |
| **All Our Ideas** | Pairwise comparison voting | Surfaces priorities | No reasoning, just preferences |
| **Consul** | Citizen participation | Proposals, debates, voting | Debate is unstructured comments |

#### Government Engagement Tools

| Platform | What It Does | Limitations |
|----------|--------------|-------------|
| **PublicInput** | Public meeting management | Comment collection, not dialogue |
| **Bang the Table/Granicus** | Community engagement suite | Top-down; not deliberative |
| **Regulations.gov** | Federal comment collection | No dialogue; comments largely ignored |

#### Civic Social Platforms

| Platform | What It Does | Limitations |
|----------|--------------|-------------|
| **Nextdoor** | Neighborhood social network | Noisy; complaint-focused; no structure |
| **Facebook Groups** | Community organizing | Algorithmic chaos; no deliberation |
| **Reddit (local)** | City discussions | Anonymous; gamified; ephemeral |

### 5.2 Competitive Positioning

The core question: what does structured argumentation enable that existing tools *cannot do* even with incremental improvement?

| Capability | Current Tools | Civic Agora |
|------------|---------------|-------------|
| Engage specific claims | React to whole proposals | Addressable assertions with stable URIs |
| Track reasoning | Comments without structure | Explicit inference chains with schemes |
| Handle challenges | Comments may be ignored | Protocol-enforced response requirements |
| Evaluate argument strength | Upvotes/sentiment | ASPIC+ formal acceptability semantics |
| Produce synthesis | Manual summarization | Auto-generated artifacts from argument graph |
| Cross-issue connections | Siloed discussions | Imported arguments with full provenance |
| Institutional memory | Each deliberation isolated | Knowledge base that compounds over time |

**The moat**: Civic Agora's argumentation-theoretic infrastructure enables capabilities that cannot be retrofitted onto comment systems. Claim-level addressability, typed attacks, commitment tracking, and formal acceptability semantics require architecture built for them from the ground up.

---

## 6. Core Use Cases

### 6.1 Local Policy Deliberation

**Scenario**: A city considers a zoning ordinance to increase housing density.

**Current State**:
- 3-minute public comment at council meeting (if you can attend)
- Written comments (if you know the process)
- Same voices dominate; same arguments repeat
- Decision rationale opaque; reasoning undocumented

**With Civic Agora**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CIVIC DELIBERATION LIFECYCLE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PHASE 1: PROPOSAL INTRODUCTION                                     │
│  ├── City posts draft ordinance                                     │
│  ├── Key claims extracted and registered                            │
│  │   • "This will create 500 new housing units" [Factual]           │
│  │   • "Traffic impact will be manageable" [Factual]                │
│  │   • "Benefits outweigh neighborhood impacts" [Value]             │
│  └── Comment period opens with facilitation support                 │
│                                                                     │
│  PHASE 2: STRUCTURED ENGAGEMENT                                     │
│  ├── Residents engage with specific claims                          │
│  │   • Support Claim 1 with comparable city data                    │
│  │   • Challenge Claim 2 with traffic study                         │
│  │   • Contest Claim 3: "Who decides what's a 'benefit'?"           │
│  ├── City planners respond to challenges with evidence              │
│  ├── Critical questions surfaced for each argument type             │
│  └── All contributions tracked with identity, timestamp             │
│                                                                     │
│  PHASE 3: SYNTHESIS & ITERATION                                     │
│  ├── Platform shows: 1 claim defended, 1 contested, 1 value dispute │
│  ├── City identifies: amend Claim 2, add traffic mitigation         │
│  ├── Value trade-offs made explicit in revised proposal             │
│  └── Second round on amendments                                     │
│                                                                     │
│  PHASE 4: DECISION & DOCUMENTATION                                  │
│  ├── Council votes with full deliberation record                    │
│  ├── Decision rationale generated from argument graph               │
│  ├── Dissenting views preserved with their reasoning                │
│  └── Artifact: "Why we made this decision" available to public      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Participatory Budgeting

**Scenario**: City allocates $5M through participatory budgeting.

**Current State**:
- Project proposals submitted
- Voting without deliberation on trade-offs
- No discussion of why one project vs. another

**With Civic Agora**:
1. Project proposals decomposed into claims (costs, benefits, feasibility)
2. Residents can challenge feasibility or cost estimates
3. City staff responds with evidence
4. Cross-project trade-offs made explicit ("If we fund A, we can't fund B")
5. Scopes allow: "With $5M budget..." vs "If we had $10M..."
6. Voting happens *after* deliberation, informed by argument record
7. Funded projects include documented rationale

### 6.3 Community Conflict Resolution

**Scenario**: Proposed development creates conflict between neighbors.

**Current State**:
- Nextdoor arguments
- Planning commission testimony
- Legal threats
- Festering resentment, no resolution

**With Civic Agora** (facilitated mode):
1. Facilitator creates deliberation space for the issue
2. Each stakeholder articulates concerns as claims
3. Developer responds to specific concerns with evidence
4. Areas of agreement and disagreement made explicit
5. Potential compromises explored via scopes
6. If resolution: agreement document generated
7. If no resolution: disagreement documented for decision-makers

### 6.4 Coalition Platform Development

**Scenario**: Multiple advocacy groups working on housing affordability have different approaches.

**With Civic Agora**:
1. Private or semi-public deliberation space
2. Each group posts key claims and evidence
3. Map agreements and disagreements explicitly
4. Use scopes: "Under tenants-rights frame..." vs "Under supply frame..."
5. Identify synthesis positions multiple groups can endorse
6. Generate shared platform document from consensus claims
7. Track which groups committed to which positions

### 6.5 Ballot Measure Analysis

**Scenario**: Citizens want to understand trade-offs before voting, not just campaign slogans.

**With Civic Agora**:
1. Ballot measure text parsed into claims
2. Pro and con campaigns invited to structured engagement
3. Neutral policy experts weigh in with evidence
4. Critical questions auto-generated for each argument type
5. Voters see: what's actually contested, what's agreed
6. Post-election: compare predictions to outcomes

---

## 7. User Personas

### 7.1 Primary Personas

#### The Engaged Resident

| Attribute | Description |
|-----------|-------------|
| **Who** | Homeowner or renter who cares about local issues |
| **Pain points** | Can't attend meetings; feels voice doesn't matter; overwhelmed by noise |
| **Needs** | Easy async participation; see impact of input; understand what's contested |
| **Platform value** | Claim-level engagement; visible deliberation status; contributions that persist |

#### The Community Organizer

| Attribute | Description |
|-----------|-------------|
| **Who** | Works for advocacy organization or leads grassroots group |
| **Pain points** | Hard to coordinate coalition positions; disagreements fester; losing institutional memory |
| **Needs** | Track who's committed to what; find synthesis positions; preserve reasoning over time |
| **Platform value** | Commitment stores; cross-group deliberation; durable artifacts |

#### The Local Official

| Attribute | Description |
|-----------|-------------|
| **Who** | City council member, planning commissioner, school board member |
| **Pain points** | Public input is performative; same debates repeat; can't demonstrate responsiveness |
| **Needs** | Structured input; defensible decisions; traceable reasoning |
| **Platform value** | Decision rationale generation; accountability record; release snapshots |

#### The City Staffer

| Attribute | Description |
|-----------|-------------|
| **Who** | City planner, policy analyst, community engagement manager |
| **Pain points** | Comment analysis is manual; can't have real dialogue; no good tools |
| **Needs** | Structured public input; systematic response capability; evidence management |
| **Platform value** | Claim-level responses; evidence linking; synthesis generation |

#### The Civic Journalist

| Attribute | Description |
|-----------|-------------|
| **Who** | Local reporter, civic blogger, transparency advocate |
| **Pain points** | Hard to track who said what; decisions lack documented reasoning |
| **Needs** | Searchable record; position tracking; decision provenance |
| **Platform value** | Commitment stores; release history; public audit trail |

### 7.2 Secondary Personas

| Persona | Key Need |
|---------|----------|
| **Neighborhood Association Leader** | Facilitate structured discussion among members |
| **School Parent** | Engage with school board decisions asynchronously |
| **Small Business Owner** | Comment on regulations affecting their business |
| **Policy Researcher** | Study how communities deliberate; access structured data |

---

## 8. Design for Democratic Equality

The platform's value proposition rests on structured argumentation—but formal argumentation is a learned skill that many citizens don't have. If not addressed, this creates a new participation inequality: the rhetorically skilled dominate while others are excluded.

### 8.1 The Accessibility-Rigor Paradox

**The tension**: Structure is what makes reasoning visible, challengeable, and cumulative. But structure raises barriers to participation. The platform must navigate between:

- *Too little structure*: Devolves into another comment section; loses distinctive value
- *Too much structure*: Excludes non-expert participants; replicates existing inequalities

### 8.2 Design Strategies

#### Progressive Formalization

Contributions can enter at different levels of structure:

| Entry Level | What User Provides | Platform Scaffolding |
|-------------|-------------------|---------------------|
| **Testimony** | "Here's my experience..." | Tagged as testimony; linked to relevant claims |
| **Concern** | "I'm worried about X" | Prompted to specify which claim X relates to |
| **Position** | "I support/oppose because..." | Guided to identify premises and conclusion |
| **Argument** | Structured claim with evidence | Full scheme selection and critical questions |

The platform helps users formalize contributions over time, rather than requiring formal structure upfront.

#### Facilitated Deliberation Mode

For high-stakes or contentious deliberations, trained facilitators:

- Help translate citizen input into structured form
- Ensure balanced participation (draw out quiet voices, manage dominant ones)
- Guide deliberation through phases (framing → evidence → argument → synthesis)
- Connect testimony and narrative to relevant claims

This follows the Irish citizens' assembly model: intensive facilitation enables citizen deliberation that produces legitimate outcomes.

#### Multiple Contribution Modes

Following Young's critique, the platform accommodates:

| Mode | Function | How Structured |
|------|----------|----------------|
| **Argument** | Explicit reasoning with premises and conclusions | Full scheme structure |
| **Testimony** | Lived experience relevant to claims | Tagged, linked to claims, not required to be "arguments" |
| **Narrative** | Story that illuminates stakes or consequences | Preserved as context; may inform but not "defeat" arguments |
| **Question** | Request for clarification or information | Tracked; creates response obligation |

The synthesis process weights these appropriately—testimony about lived impact is relevant to value deliberations even if it's not structured argument.

#### Plain Language Interface

The full argumentation machinery runs underneath, but user-facing interface uses accessible language:

| Technical Term | User-Facing Language |
|----------------|---------------------|
| Rebuttal | "I disagree because..." |
| Undercut | "Even if that's true, it doesn't mean..." |
| Undermine | "The evidence doesn't support that..." |
| Critical question | "Have you considered...?" |
| Commitment store | "Your positions" |

#### Representation Monitoring

The platform tracks participation demographics (where possible) and flags:
- Deliberations dominated by narrow participant profiles
- Missing stakeholder perspectives
- Systematic gaps in who contributes

Facilitators and administrators can then conduct targeted outreach.

### 8.3 The Facilitator Role

Civic Agora can operate in two modes:

**Self-Service Mode**: Citizens engage directly with the platform. Appropriate for:
- Lower-stakes discussions
- Communities with deliberation experience
- Topics with established norms

**Facilitated Mode**: Trained facilitators guide deliberation. Appropriate for:
- High-stakes policy decisions
- Contentious topics with deep disagreement
- Communities new to structured deliberation
- Deliberations requiring demographic representativeness

The pilot strategy emphasizes facilitated mode initially, building norms and patterns that can enable self-service expansion.

---

## 9. Feature Requirements

### 9.1 Core Platform Features

#### Claims & Evidence Infrastructure

| Feature | Description | Priority |
|---------|-------------|----------|
| **Claim registration** | Create addressable assertions with stable URIs | P0 |
| **Evidence linking** | Connect claims to sources with citation specificity | P0 |
| **Relationship typing** | Support, attack, equivalence between claims | P0 |
| **Dependency tracking** | When X changes, surface everything relying on X | P1 |

#### Dialogue & Argumentation

| Feature | Description | Priority |
|---------|-------------|----------|
| **Dialogue moves** | ASSERT, CHALLENGE, RESPOND, CONCEDE, QUESTION | P0 |
| **Argumentation schemes** | Policy-relevant subset of Walton's 60+ patterns | P0 |
| **Critical questions** | Auto-generated challenges per scheme | P0 |
| **Attack types** | REBUT, UNDERCUT, UNDERMINE distinctions | P1 |
| **ASPIC+ evaluation** | Formal acceptability semantics | P2 |

#### Accountability & Tracking

| Feature | Description | Priority |
|---------|-------------|----------|
| **Commitment stores** | Track participant positions over time | P0 |
| **Response requirements** | Challenges create visible response obligation | P0 |
| **Release snapshots** | Versioned state at key moments | P1 |
| **Position evolution** | Visualize how positions changed through deliberation | P2 |

#### Synthesis & Output

| Feature | Description | Priority |
|---------|-------------|----------|
| **Deliberation status** | Clear display of resolved/contested/open | P0 |
| **Decision rationale generation** | Auto-generate documents from argument graph | P1 |
| **Knowledge base pages** | Publish durable artifacts | P1 |
| **Export formats** | PDF, AIF, JSON-LD for integration | P2 |

### 9.2 Civic-Specific Features

#### Government Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| **Official accounts** | Verified government entity accounts | P0 |
| **Role badges** | "Council Member," "Planning Staff," "Resident" | P0 |
| **Meeting linking** | Connect deliberations to official agendas | P1 |
| **Public records export** | Compliance-ready formats | P1 |
| **ADA accessibility** | Full WCAG compliance | P0 |

#### Facilitation Tools

| Feature | Description | Priority |
|---------|-------------|----------|
| **Facilitator dashboard** | Manage deliberation phases, participation | P0 |
| **Contribution translation** | Help formalize citizen input | P1 |
| **Participation monitoring** | Track who's contributing, who's missing | P1 |
| **Phase management** | Move deliberation through structured stages | P1 |

#### Accessibility & Inclusion

| Feature | Description | Priority |
|---------|-------------|----------|
| **Progressive formalization** | Multiple entry levels for contributions | P0 |
| **Plain language mode** | Accessible terminology throughout | P0 |
| **Multi-language support** | Translation for diverse communities | P2 |
| **Offline/print options** | Summaries for those without internet | P2 |

### 9.3 Deliberation Templates

| Template | Description | Priority |
|----------|-------------|----------|
| **Policy Proposal** | Introduction → Input → Deliberation → Amendment → Decision | P0 |
| **Issue Exploration** | Open-ended discussion on emerging issue | P1 |
| **Participatory Budget** | Project proposals → Trade-off deliberation → Voting | P1 |
| **Conflict Resolution** | Multi-stakeholder facilitated dialogue | P2 |
| **Coalition Platform** | Multi-organization position development | P2 |

---

## 10. Adoption Strategy

### 10.1 Theory of Government Adoption

Government adoption requires understanding the political economy of better deliberation:

#### Who Benefits from Structured Deliberation

| Stakeholder | Benefit | Likelihood of Support |
|-------------|---------|----------------------|
| **Reform-minded officials** | Legitimacy, defensible decisions | High |
| **Community engagement staff** | Better tools, reduced manual work | High |
| **Transparency advocates** | Accountability, public record | High |
| **New council members** | Understand institutional history | Medium |
| **City managers** | Reduced conflict, clearer mandates | Medium |

#### Who May Resist

| Stakeholder | Concern | Mitigation |
|-------------|---------|------------|
| **Officials preferring ambiguity** | Structured positions create accountability | Emphasize benefits (defensibility, reduced repeat debates) |
| **Dominant voices** | Lose advantage from current processes | Frame as "broader input," not "replacing you" |
| **Legal/compliance staff** | Public records implications | Clear guidance on legal status |
| **IT departments** | Another system to manage | Cloud-hosted; minimal IT burden |

### 10.2 Adoption Pathways

#### Pathway A: Internal Government Use First

Start with *internal* policy deliberation—staff and officials using the platform to structure policy development before public engagement.

**Advantages**:
- Lower stakes for initial adoption
- Demonstrates value before public deployment
- Builds internal champions
- Creates content/patterns for public phase

**Sequence**:
1. Policy staff use platform for internal analysis
2. Officials see value in structured reasoning
3. Expand to public engagement with established practices

#### Pathway B: Community Organization Entry

Partner with civic organizations already conducting deliberations (advocacy groups, neighborhood associations, coalitions).

**Advantages**:
- Organizations control their own adoption
- No government procurement process
- Demonstrates value in community context
- Creates demand for government integration

**Sequence**:
1. Organizations use platform for internal deliberation
2. Produce visible artifacts (coalition platforms, position papers)
3. Present structured input to government
4. Government sees value; considers adoption

#### Pathway C: Facilitated Pilot Partnership

Partner with a reform-minded city for a specific high-visibility deliberation with full facilitation support.

**Advantages**:
- Controlled demonstration of value
- Facilitation ensures quality outcomes
- Case study for broader adoption
- Tests integration with formal processes

**Sequence**:
1. Identify willing city and specific issue
2. Provide intensive facilitation support
3. Document outcomes and lessons
4. Publish case study for other jurisdictions

### 10.3 Go-to-Market Positioning

| Audience | Primary Message | Entry Point |
|----------|-----------------|-------------|
| **City engagement staff** | "Public input you can actually use" | Demo structured comment analysis |
| **Elected officials** | "Decisions you can defend" | Show decision rationale generation |
| **Community organizations** | "Coalitions that hold together" | Offer platform for internal use |
| **Civic funders** | "Democratic infrastructure, not band-aids" | Present systemic change thesis |

---

## 11. Measurement Framework

### 11.1 What We're Testing

The core hypothesis: Structured deliberation infrastructure produces better democratic outcomes than unstructured alternatives.

"Better" means:
- **Higher quality reasoning**: Arguments are more rigorous, evidence-based, responsive to challenges
- **Broader participation**: More diverse participants than traditional processes
- **Greater legitimacy**: Participants (including those who "lose") perceive process as fair
- **Improved decisions**: Outcomes are better-informed and more durable
- **Accumulated knowledge**: Deliberations produce artifacts useful for future decisions

### 11.2 Metrics by Category

#### Participation Metrics

| Metric | What It Measures | Data Source |
|--------|------------------|-------------|
| Participant count | Reach | Platform data |
| Participant diversity | Representation | Survey/demographics |
| Contribution depth | Engagement quality | Platform data (moves per user) |
| Return participation | Sustained engagement | Platform data |
| Comparison to traditional | Relative performance | Baseline from comparable process |

#### Deliberation Quality Metrics

| Metric | What It Measures | Data Source |
|--------|------------------|-------------|
| Argument structure | Rigor | Platform data (schemes used, CQs answered) |
| Evidence citation | Grounding | Platform data (evidence links per claim) |
| Challenge response rate | Accountability | Platform data |
| Position evolution | Responsiveness | Platform data (commitment store changes) |
| Cross-cutting engagement | Bridge-building | Platform data (responses across positions) |

#### Outcome Metrics

| Metric | What It Measures | Data Source |
|--------|------------------|-------------|
| Resolution rate | Deliberation effectiveness | Platform data |
| Decision incorporation | Influence | Document analysis (did deliberation inform decision?) |
| Prediction accuracy | Reasoning quality | Post-decision comparison |
| Artifact reuse | Durability | Platform data (cross-deliberation imports) |

#### Legitimacy Metrics

| Metric | What It Measures | Data Source |
|--------|------------------|-------------|
| Perceived fairness | Process legitimacy | Participant survey |
| Understanding of opposing views | Deliberative quality | Pre/post survey |
| Acceptance of outcome | Even among dissenters | Participant survey |
| Trust in process | Institutional confidence | Survey |

### 11.3 Evaluation Design

For rigorous pilot evaluation:

**Pre-registration**: Define hypotheses and success criteria before pilot begins

**Comparison conditions**: Where possible, compare to traditional process on same or similar issue

**Mixed methods**:
- Quantitative: Platform metrics, surveys with validated scales
- Qualitative: Participant interviews, facilitator observations, document analysis

**Longitudinal**: Track outcomes beyond immediate deliberation (decision durability, artifact reuse)

**Research partnership**: Collaborate with deliberative democracy researchers for rigorous evaluation design

---

## 12. Challenges & Mitigations

### 12.1 Adoption Challenges

| Challenge | Concern | Mitigation |
|-----------|---------|------------|
| **Complexity** | "Too complicated for general public" | Progressive formalization; facilitated mode; plain language |
| **Government hesitancy** | "Can't replace official processes" | Complement, don't replace; export to official record |
| **Critical mass** | "Empty platform isn't useful" | Seed with content; start narrow; facilitated launches |
| **Time investment** | "People won't spend time" | Async participation; clear value proposition; mobile-first |

### 12.2 Quality Challenges

| Challenge | Concern | Mitigation |
|-----------|---------|------------|
| **Trolling/abuse** | "Bad actors will poison deliberation" | Identity requirements; moderation; facilitator oversight |
| **Rhetorical domination** | "Skilled arguers will dominate" | Facilitation; testimony modes; participation monitoring |
| **Astroturfing** | "Organized campaigns will game it" | Identity verification; commitment tracking; facilitator judgment |
| **Shallow engagement** | "People will just react, not reason" | Structure enforces depth; progressive formalization |

### 12.3 Political Challenges

| Challenge | Concern | Mitigation |
|-----------|---------|------------|
| **Partisan capture** | "Platform becomes identified with one side" | Strict non-partisan governance; diverse pilots |
| **Incumbent advantage** | "Those in power control framing" | Community organization pathway; citizen-initiated deliberations |
| **Surveillance concerns** | "Government tracking dissent" | Clear data policies; privacy controls; commitment to transparency |

### 12.4 Legal & Compliance

| Requirement | Notes |
|-------------|-------|
| **Public Records Laws** | Platform content may be public record; design for compliance |
| **Open Meetings Laws** | Complement, don't replace legally-required meetings |
| **ADA Compliance** | Federal accessibility requirements; P0 priority |
| **Election Law** | Ballot measure discussions have constraints; legal review |
| **Privacy Regulations** | CCPA, state laws apply; clear data handling |

---

## 13. Pilot Strategy

### 13.1 Ideal Pilot Characteristics

| Characteristic | Why It Matters |
|----------------|----------------|
| **Population 50K-200K** | Large enough to matter, small enough to engage |
| **Reform-minded leadership** | Willing to experiment; champion inside government |
| **Felt engagement problem** | Existing dissatisfaction with current processes |
| **Active civic organizations** | Built-in user base; partnership potential |
| **Specific upcoming issue** | Concrete use case with timeline |
| **Diverse community** | Test inclusion and accessibility features |

### 13.2 Pilot Structure

#### Phase 1: Partnership & Setup (Months 1-2)

- Identify pilot city and specific deliberation
- Establish government partnership and data agreements
- Train facilitators
- Configure platform for local context
- Recruit participant pool

#### Phase 2: Deliberation (Months 3-4)

- Conduct facilitated deliberation
- Intensive support and observation
- Rapid iteration based on feedback
- Document process and challenges

#### Phase 3: Evaluation (Month 5)

- Measure outcomes against framework
- Participant interviews and surveys
- Analyze deliberation quality
- Assess decision incorporation

#### Phase 4: Documentation (Month 6)

- Produce case study
- Identify lessons and refinements
- Publish for other jurisdictions
- Plan expansion

### 13.3 Candidate Pilot Types

| Pilot Type | Description | Success Indicator |
|------------|-------------|-------------------|
| **Zoning/land use** | Housing density, development decisions | Deliberation influences final ordinance; reduced conflict |
| **Budget process** | Participatory budgeting enhancement | Higher quality proposals; broader participation |
| **Climate planning** | Community input on climate action | More diverse input than traditional process |
| **School policy** | Redistricting or curriculum decisions | Structured trade-off discussion; legitimacy |

### 13.4 Pilot Partners to Pursue

| Partner Type | Examples | Value |
|--------------|----------|-------|
| **Reform cities** | Austin, Minneapolis, Denver, Somerville | Progressive leadership; civic innovation culture |
| **Civic innovation programs** | Bloomberg Cities, Code for America | Existing relationships; credibility |
| **University partnerships** | Deliberative democracy researchers | Evaluation expertise; academic credibility |
| **Foundations** | Knight, Democracy Fund, Hewlett | Funding; convening power |

---

## 14. Phased Roadmap

### Phase 1: Foundation (Months 1-6)

| Goal | Deliverables |
|------|--------------|
| **Core platform** | Claims, evidence, basic dialogue moves |
| **Civic templates** | Policy Proposal template with phases |
| **Accessibility baseline** | WCAG AA; mobile-responsive; plain language |
| **Facilitation tools** | Basic facilitator dashboard |
| **Single pilot** | One city, one issue, full lifecycle with intensive support |

### Phase 2: Scale (Months 7-12)

| Goal | Deliverables |
|------|--------------|
| **Additional templates** | Participatory budget, Issue exploration |
| **Full scheme library** | Policy-relevant argumentation schemes |
| **Progressive formalization** | Multiple entry levels for contributions |
| **Enhanced facilitation** | Training materials, facilitator certification |
| **3-5 pilots** | Multiple cities, varied use cases |
| **Measurement framework** | Validated instruments, baseline data |

### Phase 3: Integration (Year 2)

| Goal | Deliverables |
|------|--------------|
| **Government integration** | Agenda, meeting, public records connections |
| **Self-service mode** | Reduced facilitation requirements for some contexts |
| **Community org tier** | Offering for advocacy groups, coalitions |
| **Research partnerships** | Academic study of deliberation quality |
| **Sustainability model** | Pricing, contracts, grant strategy |

### Phase 4: Ecosystem (Year 3+)

| Goal | Deliverables |
|------|--------------|
| **Cross-jurisdiction** | State-level, regional deliberations |
| **Plexus network** | Cross-deliberation connections and imports |
| **Open data** | Anonymized deliberation datasets for research |
| **Field building** | Training programs, community of practice |

---

## Appendix A: Comparison to Academic Agora

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
| **Revenue model** | Institutional subscriptions | Government contracts, grants |

**Cross-pollination**: Academic Agora develops and validates the argumentation infrastructure. Civic Agora tests whether that infrastructure can serve democratic deliberation with non-expert publics under different constraints and incentives.

---

## Appendix B: Glossary of Terms

| Term | Definition |
|------|------------|
| **Claim** | An addressable assertion with stable identifier |
| **Commitment Store** | Record of positions a participant has taken |
| **Critical Question** | Challenge surfaced by argumentation scheme |
| **Deliberation** | Structured discussion space with phases and participants |
| **DialogueMove** | Typed contribution (ASSERT, CHALLENGE, RESPOND, etc.) |
| **Evidence** | Source material linked to claims with citation specificity |
| **Facilitator** | Trained guide for structured deliberation |
| **Release** | Versioned snapshot of deliberation state |
| **Scheme** | Recognized pattern of argument with associated critical questions |
| **Scope** | Conditional frame for exploring alternatives ("If X, then...") |
| **Thesis/Artifact** | Durable output generated from deliberation |

---

*This document should be updated as pilot learnings emerge and as the deliberative democracy landscape evolves.*
