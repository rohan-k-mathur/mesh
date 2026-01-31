# Civic Agora: Mesh for Political & Community Deliberation

## Purpose

This document explores how Mesh/Agora could serve as infrastructure for structured civic discourse — a platform for citizens, community organizers, policymakers, and advocacy groups to deliberate on public issues with the rigor that consequential decisions deserve.

**Working Thesis**: Democratic societies lack infrastructure for sustained, structured public deliberation. Town halls are ephemeral, social media is polarizing, and public comment processes are performative. Mesh's core capabilities — claim-level addressability, typed argumentation, commitment tracking, and durable artifacts — are precisely what civic discourse needs to move from noise to signal.

---

## Table of Contents

1. [Landscape Analysis](#1-landscape-analysis)
2. [The Gap & Opportunity](#2-the-gap--opportunity)
3. [Platform-to-Need Mapping](#3-platform-to-need-mapping)
4. [Core Use Cases](#4-core-use-cases)
5. [User Personas](#5-user-personas)
6. [Feature Requirements](#6-feature-requirements)
7. [The Civic Agora Vision](#7-the-civic-agora-vision)
8. [Positioning & Messaging](#8-positioning--messaging)
9. [Challenges & Considerations](#9-challenges--considerations)
10. [Pilot Communities](#10-pilot-communities)
11. [Integration Points](#11-integration-points)
12. [Phased Roadmap](#12-phased-roadmap)

---

## 1. Landscape Analysis

### 1.1 Existing Civic Tech Platforms

#### Deliberation & Engagement Platforms

| Platform | What It Does | Strengths | Limitations |
|----------|--------------|-----------|-------------|
| **Pol.is** | Opinion clustering via voting | Surfaces consensus areas; used by Taiwan's vTaiwan | No argument structure; voting only; no reasoning visible |
| **Decidim** | Participatory democracy platform | Open source; proposal lifecycle | Process-focused; limited argumentation depth |
| **Loomio** | Cooperative decision-making | Good for groups; consent-based | Small scale; no claim-level structure |
| **Consider.it** | Pro/con visualization | Clear trade-off display | Binary framing; shallow reasoning |
| **All Our Ideas** | Pairwise comparison voting | Surfaces priorities | No reasoning, just preferences |
| **Consul** | Citizen participation (Madrid) | Proposals, debates, voting | Debate is unstructured comments |

#### Civic Social Platforms

| Platform | What It Does | Strengths | Limitations |
|----------|--------------|-----------|-------------|
| **Nextdoor** | Neighborhood social network | Hyperlocal; large userbase | Noisy; complaint-focused; no structure |
| **Facebook Groups** | Community organizing | Ubiquitous; easy | Algorithmic chaos; no deliberation |
| **Discord/Slack** | Private community discussion | Real-time; flexible | Ephemeral; closed; unstructured |
| **Reddit (local subs)** | City/topic discussions | Threaded; voting | Anonymous; no accountability; gamified |

#### Government Engagement Tools

| Platform | What It Does | Strengths | Limitations |
|----------|--------------|-----------|-------------|
| **PublicInput** | Public meeting management | Integrates with gov process | Comment collection, not dialogue |
| **Bang the Table/Granicus** | Community engagement suite | Enterprise; gov-trusted | Top-down; not deliberative |
| **Regulations.gov** | Federal comment collection | Official record | No dialogue; comments ignored |
| **SeeClickFix** | Issue reporting | Clear workflow | Service requests, not policy |

#### Advocacy & Organizing Tools

| Platform | What It Does | Strengths | Limitations |
|----------|--------------|-----------|-------------|
| **Action Network** | Campaign organizing | Email, petitions, events | Mobilization, not deliberation |
| **Mobilize** | Event organizing | Volunteer coordination | Events, not ongoing discourse |
| **Change.org** | Petitions | Large reach; signatures | Signatures ≠ reasoning |
| **NationBuilder** | Political CRM | Comprehensive data | Campaign tool, not public square |

### 1.2 Traditional Civic Discourse Channels

| Channel | Function | Limitations |
|---------|----------|-------------|
| **Town halls** | Public input on local issues | Ephemeral; dominated by loudest voices; no follow-up |
| **Public comment periods** | Regulatory input | Pro forma; rarely influences; no dialogue |
| **Letters to editor** | Public opinion expression | One-shot; no threading; editor gatekeeping |
| **City council meetings** | Formal decision-making | Procedural; limited public participation |
| **Ballot measures** | Direct democracy | Binary; no nuance; expensive to qualify |
| **Neighborhood associations** | Local governance | Unrepresentative; meeting-based; territorial |
| **Petitions** | Demand signaling | Signatures without reasoning; ignored |

---

## 2. The Gap & Opportunity

### 2.1 What's Missing

The civic sphere lacks infrastructure that provides:

| Requirement | Current State | What's Needed |
|-------------|---------------|---------------|
| **Structured reasoning** | Comments, votes, signatures | Visible arguments with premises, evidence, and conclusions |
| **Claim-level engagement** | React to whole proposals | Engage with specific claims within proposals |
| **Persistent record** | Meetings end, threads scroll | Durable record that survives news cycles |
| **Accountability** | Anonymous trolling or grandstanding | Identity with reputation; positions tracked |
| **Progress visibility** | Same debates repeat endlessly | Clear status: what's contested, what's resolved |
| **Cross-issue synthesis** | Siloed issue campaigns | Connect arguments across policy domains |
| **Generative dialogue** | For/against posturing | Collaborative problem-solving; refined proposals |
| **Inclusive access** | Meeting-based or tech-heavy | Async participation; multiple entry points |

### 2.2 Why This Gap Exists

**Historical Factors**:
- Democratic institutions designed for in-person, synchronous participation
- Mass media created broadcast model (one-to-many), not dialogue
- Political incentives reward mobilization over deliberation
- No business model for public reasoning infrastructure

**Platform Failures**:
- Social media optimizes for engagement/outrage, not understanding
- Civic tech often digitizes existing (broken) processes
- Anonymity enables trolling; real-name enables harassment
- Tools built for voting, not reasoning

### 2.3 The Opportunity

**Market Context**:
- ~330 million US residents; ~250 million adults
- ~90,000 local governments (cities, counties, school districts, special districts)
- Growing distrust in institutions + desire for voice
- Climate, housing, and polarization creating urgent need for better deliberation

**Timing**:
- Post-2020 awareness of democratic fragility
- Rise of "deliberative democracy" in political science / practice
- Successful experiments (Taiwan, Ireland citizens' assemblies)
- AI discourse crisis creating appetite for "human reasoning infrastructure"

**Unique Positioning**:
- No serious competitor in structured civic argumentation
- Platform already implements argumentation theory
- Civic norms increasingly align with transparency demands
- Local government looking for better engagement tools

---

## 3. Platform-to-Need Mapping

### 3.1 How Mesh Features Serve Civic Needs

| Civic Need | Mesh Feature | How It Helps |
|------------|--------------|--------------|
| Engage with specific claims | Claims with stable URIs | Reference exact policy assertions, not whole proposals |
| Structured public input | DialogueMoves (ASSERT, WHY, GROUNDS) | Clear contribution types for public discourse |
| Evidence-based policy | Evidence linking | Connect claims to data, studies, fiscal analysis |
| Rigorous reasoning | Schemes (60+ Walton patterns) | Recognize policy arguments, causal claims, value trade-offs |
| Surfacing concerns | Critical Questions per scheme | Auto-generate relevant challenges to proposals |
| Tracking positions | Commitment Stores | See what each participant/official has stated |
| Modeling disagreement | Attack types (REBUT, UNDERCUT, UNDERMINE) | Distinguish types of objection precisely |
| Building consensus | ArgumentChains | Compose shared reasoning from areas of agreement |
| Exploring alternatives | Scopes | "Under budget constraint X…" or "If we prioritize Y…" |
| Evaluating proposals | ASPIC+ acceptability | Formal evaluation of argument strength |
| Producing outcomes | Thesis/KB pages | Generate policy briefs, decision rationales |
| Institutional memory | Releases & versioning | "Here's where we were in 2024 vs now" |

### 3.2 Civic Workflow Integration

| Workflow Stage | How Mesh Participates |
|----------------|----------------------|
| **Agenda setting** | Issues system surfaces community priorities |
| **Proposal development** | Claims capture policy components; public can respond |
| **Public input** | Structured contributions with argument types |
| **Deliberation** | Tracked dialogue with commitment stores |
| **Trade-off analysis** | Scopes explore "what if" scenarios |
| **Decision documentation** | Thesis generates decision rationale |
| **Implementation oversight** | Outcomes tracked against predictions |
| **Iteration** | Fork deliberations to explore alternatives |

---

## 4. Core Use Cases

### 4.1 Local Policy Deliberation

**Scenario**: A city is considering a new zoning ordinance to allow more housing density. Instead of a 3-minute public comment period, the city uses Civic Agora.

**Current State**:
- Attend city council meeting (if you can)
- Submit written comment (if you know how)
- 3 minutes at the mic (if you're comfortable)
- Comments rarely influence outcome

**With Civic Agora**:
1. City posts proposal with key claims extracted
2. Residents can engage with specific claims ("This will increase traffic on Main St.")
3. Supporters add evidence (traffic studies, examples from other cities)
4. Opponents raise typed challenges (rebut: "Actually, transit-oriented development reduces car trips")
5. Discussion persists over weeks, not one evening
6. City staff can respond asynchronously with data
7. Final decision includes rationale document citing the deliberation
8. "Dissenting views" preserved in the record

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CIVIC DELIBERATION FLOW                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. PROPOSAL INTRODUCTION                                           │
│     ├── City posts draft ordinance                                  │
│     ├── Key claims extracted (auto + manual)                        │
│     │   • "This ordinance will create 500 new housing units"        │
│     │   • "Building heights will increase to 6 stories"             │
│     │   • "Property values in adjacent areas will remain stable"    │
│     └── Public comment period opens                                 │
│                                                                     │
│  2. PUBLIC ENGAGEMENT                                               │
│     ├── Resident A supports Claim 1, adds evidence                  │
│     ├── Resident B challenges Claim 3 with counterexample           │
│     ├── City planner responds with additional data                  │
│     ├── Neighborhood group requests clarification on Claim 2        │
│     └── All contributions tracked with identity, timestamp          │
│                                                                     │
│  3. DELIBERATION SYNTHESIS                                          │
│     ├── System shows: 2 claims defended, 1 contested                │
│     ├── City identifies: amend Claim 3, add mitigation measures     │
│     ├── Revised proposal posted with changelog                      │
│     └── Second round of engagement on amendments                    │
│                                                                     │
│  4. DECISION & RATIONALE                                            │
│     ├── Council votes with full deliberation record available       │
│     ├── Decision rationale generated from argument graph            │
│     ├── Dissenting views preserved with their reasoning             │
│     └── Future reference: "Why did we make this decision?"          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Community Organization & Coalition Building

**Scenario**: Multiple advocacy groups are working on housing affordability but have different approaches. They use Civic Agora to find common ground and coordinate.

**Current State**:
- Coalition calls/meetings (scheduling nightmare)
- Shared docs become unwieldy
- Disagreements fester or split coalitions
- Hard to onboard new groups

**With Civic Agora**:
1. Create private or semi-public deliberation space
2. Each group posts their key claims and evidence
3. Map agreements and disagreements explicitly
4. Use scopes: "Under a tenants-rights frame…" vs "Under a supply frame…"
5. Identify synthesis positions that multiple groups can endorse
6. Generate shared platform document from consensus claims
7. Track which groups are committed to which positions

### 4.3 Participatory Budgeting

**Scenario**: A city allocates $5M through participatory budgeting. Instead of just voting on projects, residents deliberate on trade-offs.

**Current State**:
- Submit project ideas
- Vote on favorites
- No discussion of trade-offs
- Lottery for attention

**With Civic Agora**:
1. Project proposals decomposed into claims
2. Residents can challenge feasibility, cost estimates, impact claims
3. City staff responds with evidence
4. Cross-project trade-offs made explicit ("If we fund A, we can't fund B")
5. Scopes allow: "With $5M budget…" vs "If we had $10M…"
6. Voting happens *after* deliberation, informed by argument record
7. Funded projects include rationale for selection

### 4.4 Electoral Issue Deliberation

**Scenario**: Before a ballot measure, citizens want to understand the actual trade-offs, not just campaign slogans.

**Current State**:
- Dueling TV ads
- Voter guide statements (unstructured)
- News coverage (limited depth)
- Social media (chaos)

**With Civic Agora**:
1. Ballot measure text parsed into claims
2. Pro and con campaigns invited to structured engagement
3. Neutral policy experts weigh in with evidence
4. Critical questions auto-generated for each argument type
5. Voters can see: what's actually contested, what's agreed
6. Individual voters can track their own positions
7. Post-election: compare predictions to outcomes

### 4.5 Neighborhood Dispute Resolution

**Scenario**: A proposed development creates conflict between neighbors. Instead of lawsuits or shouting matches, use structured dialogue.

**Current State**:
- Nextdoor flame wars
- Planning commission testimony
- Legal threats
- Festering resentment

**With Civic Agora**:
1. Create deliberation space for the specific issue
2. Each stakeholder articulates their concerns as claims
3. Developer responds to specific concerns
4. Mediator/facilitator guides toward synthesis
5. Areas of agreement and disagreement made explicit
6. Potential compromises explored via scopes
7. Agreement document generated from resolution

---

## 5. User Personas

### 5.1 Primary Personas

#### Persona A: The Engaged Resident

| Attribute | Description |
|-----------|-------------|
| **Role** | Homeowner or renter who cares about local issues |
| **Pain Points** | Can't attend meetings; feels voice doesn't matter; overwhelmed by noise |
| **Needs** | Easy participation; see impact of input; understand what's actually contested |
| **Mesh Value** | Async participation; structured contribution; visible deliberation status |

#### Persona B: The Community Organizer

| Attribute | Description |
|-----------|-------------|
| **Role** | Works for advocacy organization or leads grassroots group |
| **Pain Points** | Hard to coordinate positions; coalition disagreements; losing institutional memory |
| **Needs** | Track who's committed to what; find synthesis positions; preserve reasoning over time |
| **Mesh Value** | Commitment stores; cross-group deliberation; durable artifacts |

#### Persona C: The Local Official

| Attribute | Description |
|-----------|-------------|
| **Role** | City council member, planning commissioner, school board member |
| **Pain Points** | Public input is performative; same debates repeat; can't demonstrate responsiveness |
| **Needs** | Structured input; defensible decisions; traceable reasoning |
| **Mesh Value** | Decision rationale generation; release snapshots; accountability record |

#### Persona D: The City Staffer

| Attribute | Description |
|-----------|-------------|
| **Role** | City planner, policy analyst, community engagement manager |
| **Pain Points** | Comment analysis is manual; can't have real dialogue; no good tools |
| **Needs** | Structured public input; ability to respond systematically; evidence management |
| **Mesh Value** | Claim-level responses; evidence linking; synthesis artifacts |

#### Persona E: The Journalist/Watchdog

| Attribute | Description |
|-----------|-------------|
| **Role** | Local reporter, civic blogger, transparency advocate |
| **Pain Points** | Hard to track who said what; decisions lack documented reasoning |
| **Needs** | Searchable record; position tracking; decision provenance |
| **Mesh Value** | Commitment stores; release history; public audit trail |

### 5.2 Secondary Personas

| Persona | Key Need |
|---------|----------|
| **Neighborhood Association Leader** | Facilitate structured discussion among members |
| **School Parent** | Engage with school board decisions without attending meetings |
| **Small Business Owner** | Comment on regulations affecting their business |
| **Youth Advocate** | Include young people in policy discussions |
| **Policy Researcher** | Study how communities deliberate; access structured data |

---

## 6. Feature Requirements

### 6.1 Civic-Specific Features

#### 6.1.1 Government Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| **Official Accounts** | Verified government entity accounts | P0 |
| **Meeting Integration** | Link deliberations to official meetings/agendas | P1 |
| **Public Notice Compliance** | Ensure platform meets legal public notice requirements | P1 |
| **ADA Accessibility** | Full accessibility compliance | P0 |
| **Public Records Export** | Export in public records-compatible formats | P1 |
| **Multi-language Support** | Translation for diverse communities | P2 |

#### 6.1.2 Identity & Trust

| Feature | Description | Priority |
|---------|-------------|----------|
| **Residency Verification** | Optional verification that user lives in jurisdiction | P2 |
| **Role Badges** | "City Council Member," "Planning Staff," "Resident" | P1 |
| **Stakeholder Groups** | Formal representation of organizations | P1 |
| **Anonymous Option** | Allow pseudonymous participation with trade-offs | P2 |
| **Expertise Indicators** | Self-declared or verified expertise areas | P2 |

#### 6.1.3 Deliberation Templates

| Template | Description | Priority |
|----------|-------------|----------|
| **Policy Proposal** | Phases: Introduction → Public Input → Deliberation → Amendment → Decision | P0 |
| **Participatory Budget** | Project proposals → Trade-off deliberation → Voting | P1 |
| **Issue Exploration** | Open-ended community discussion on emerging issue | P1 |
| **Ballot Measure Analysis** | Pro/con structured analysis of ballot measure | P2 |
| **Neighborhood Dispute** | Multi-stakeholder dispute resolution | P2 |
| **Coalition Platform** | Multi-organization position development | P2 |

#### 6.1.4 Civic-Specific Argument Schemes

| Scheme | Use Case |
|--------|----------|
| **Argument from Policy Consequences** | "This policy will lead to outcome X" |
| **Argument from Precedent** | "City Y did this and it worked" |
| **Argument from Fiscal Impact** | "This will cost/save $X" |
| **Argument from Equity** | "This disproportionately affects group Z" |
| **Argument from Rights** | "This violates right to X" |
| **Argument from Community Values** | "This aligns with our community's commitment to Y" |
| **Argument from Expert Authority** | "The city engineer says X" |
| **NIMBY/YIMBY Patterns** | Common housing/development argument structures |

### 6.2 Accessibility & Inclusion

| Requirement | Description |
|-------------|-------------|
| **Plain Language Mode** | Simplify argument visualization for general audience |
| **Mobile-First** | Full functionality on mobile devices |
| **Offline Participation** | Print-friendly summaries for those without internet |
| **Community Liaisons** | Tools for staff to input contributions from in-person events |
| **Translation** | Key languages for each community |
| **Screen Reader Compatibility** | Full accessibility for visually impaired |

---

## 7. The Civic Agora Vision

### 7.1 North Star Statement

> **Civic Agora turns the informal, ephemeral layer of public discourse into a structured, persistent layer of democratic reasoning — so deliberation itself compounds into collective wisdom rather than dissipating into noise.**

### 7.2 The Democratic Deliberation Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                  THE DEMOCRATIC DELIBERATION STACK                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TRADITIONAL LAYER                                                  │
│  ├── Voting (elections, referenda)                                  │
│  ├── Representation (elected officials)                             │
│  ├── Public meetings (town halls, hearings)                         │
│  └── Public comment (written submissions)                           │
│                                                                     │
│  ════════════════════════════════════════════════════════════════   │
│                                                                     │
│  MESH LAYER (NEW)                                                   │
│  ├── Claims: addressable assertions about policy                    │
│  ├── Arguments: structured reasoning with evidence                  │
│  ├── Commitments: tracked positions over time                       │
│  ├── Challenges: typed objections that must be answered             │
│  ├── Syntheses: resolutions that capture agreements                 │
│  ├── Releases: versioned snapshots of deliberation state            │
│  └── Artifacts: decision rationales, policy briefs                  │
│                                                                     │
│  ════════════════════════════════════════════════════════════════   │
│                                                                     │
│  OUTCOME: Decisions with visible reasoning, accountable positions,  │
│  and institutional memory that compounds across issues and time.    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 What Success Looks Like

**For Residents**:
- "I can participate in city decisions without attending a meeting"
- "I can see exactly what the city's reasoning was for their decision"
- "I can track whether my council member followed through on their commitments"

**For Officials**:
- "I have a defensible record of why we made this decision"
- "I can show constituents we took their concerns seriously"
- "Policy debates don't restart from scratch every election cycle"

**For Community Organizations**:
- "We can coordinate positions across our coalition"
- "We can point to the specific claims we've challenged"
- "Our work persists even as leadership changes"

**For Democracy**:
- "Public reasoning is visible, not hidden in meeting transcripts"
- "Disagreements are clear, not muddled"
- "Decisions improve because they're informed by structured deliberation"

---

## 8. Positioning & Messaging

### 8.1 Core Messages by Audience

| Audience | Message | Hook |
|----------|---------|------|
| **Residents** | "Your voice, heard and answered" | Async participation that actually matters |
| **Local Officials** | "Decisions you can stand behind" | Defensible reasoning, accountable positions |
| **City Staff** | "Public input you can actually use" | Structured data, not comment soup |
| **Organizers** | "Build coalitions that hold together" | Shared commitments, visible agreements |
| **Funders** | "Democratic infrastructure for the 21st century" | Systemic change, not band-aids |

### 8.2 Differentiators

| Competitor Type | Their Approach | Mesh Difference |
|-----------------|----------------|-----------------|
| **Civic engagement platforms** | Digitize existing processes | Transform process with argumentation structure |
| **Voting/polling tools** | Aggregate preferences | Surface reasoning behind preferences |
| **Social media** | Maximize engagement | Maximize understanding |
| **Comment systems** | Collect input | Enable dialogue with accountability |
| **Petition platforms** | Count signatures | Track reasoning and commitments |

### 8.3 Taglines

- *"Where public reasoning becomes visible"*
- *"Democracy's missing layer: structured deliberation"*
- *"From public comment to public reasoning"*
- *"Discussions that produce decisions"*
- *"The town hall that never closes"*

---

## 9. Challenges & Considerations

### 9.1 Adoption Barriers

| Barrier | Concern | Mitigation |
|---------|---------|------------|
| **Complexity** | "This is too complicated for the public" | Plain language mode; progressive disclosure; facilitator roles |
| **Accessibility** | "Not everyone has internet access" | Mobile-first; offline options; community liaisons |
| **Government hesitancy** | "We can't replace official comment processes" | Complement, don't replace; export to official record |
| **Representation** | "Only certain people will participate" | Active outreach; community partnerships; translation |
| **Trolling/abuse** | "Bad actors will poison the well" | Identity verification; moderation tools; commitment tracking |

### 9.2 Political Sensitivities

| Issue | Consideration |
|-------|---------------|
| **Partisan capture** | Platform must be strictly non-partisan in design and governance |
| **Incumbent advantage** | Don't give incumbents unfair platform control |
| **Astroturfing** | Prevent fake grassroots campaigns |
| **Data privacy** | Civic participation data is sensitive; strong privacy controls |
| **Surveillance concerns** | Government using platform to track dissent |

### 9.3 Legal & Compliance

| Requirement | Notes |
|-------------|-------|
| **Public Records Laws** | Platform content may be public record in some jurisdictions |
| **Open Meetings Laws** | Cannot replace legally-required public meetings |
| **ADA Compliance** | Federal accessibility requirements |
| **Election Law** | Ballot measure discussions have legal constraints |
| **Privacy Regulations** | CCPA, state privacy laws apply |

### 9.4 Sustainability

| Model | Pros | Cons |
|-------|------|------|
| **Government contracts** | Stable funding; direct integration | Slow sales cycle; RFP process |
| **Foundation grants** | Mission-aligned; patient capital | Time-limited; reporting burden |
| **Civic organization subscriptions** | Recurring revenue; aligned users | Limited budget; price sensitivity |
| **Freemium public** | Scale; democratic access | Revenue challenge; quality control |

---

## 10. Pilot Communities

### 10.1 Ideal Pilot Characteristics

| Characteristic | Why It Matters |
|----------------|----------------|
| **Population 50K-200K** | Large enough to matter, small enough to engage |
| **Progressive/reform-oriented leadership** | Willing to experiment |
| **Existing engagement problem** | Felt need for better tools |
| **Active civic organizations** | Built-in user base |
| **Tech-friendly population** | Early adopters available |
| **Diverse community** | Test inclusion features |
| **Specific upcoming issue** | Concrete use case to pilot |

### 10.2 Pilot Use Case Ideas

| Pilot Type | Description | Success Metric |
|------------|-------------|----------------|
| **Zoning reform** | Major housing policy with strong opinions | Deliberation influences final ordinance |
| **Budget process** | Participatory budgeting enhancement | Higher quality project proposals |
| **Climate plan** | Community input on climate action plan | Broader participation than traditional process |
| **School redistricting** | Contentious issue needing structured dialogue | Reduced conflict; clearer trade-offs |
| **Downtown development** | Economic development with multiple stakeholders | Synthesis position emerges |

### 10.3 Potential Pilot Partners

| Type | Examples |
|------|----------|
| **Reform-minded cities** | Austin, Minneapolis, Denver, Somerville, Asheville |
| **Civic innovation labs** | Bloomberg Cities, Code for America partners |
| **University towns** | College communities with engagement culture |
| **Foundation-backed initiatives** | Knight Foundation cities, Democracy Fund grantees |
| **State-level experiments** | California, Colorado, Oregon (initiative reform) |

---

## 11. Integration Points

### 11.1 Government Systems

| System | Integration Type | Value |
|--------|------------------|-------|
| **Agenda management** | Link deliberations to agenda items | Official context |
| **Meeting video** | Timestamp links to claims made in testimony | Evidence |
| **GIS/mapping** | Geographic context for claims | Spatial analysis |
| **Budget systems** | Fiscal impact data | Evidence |
| **Permit systems** | Development project data | Context |

### 11.2 Civic Tech Ecosystem

| Platform | Integration Type | Value |
|----------|------------------|-------|
| **Open States** | Legislative data | State-level context |
| **Ballotpedia** | Ballot measure info | Electoral deliberation |
| **City Council API** | Meeting/vote data | Official record |
| **Local news** | Article linking | Evidence; context |

### 11.3 Authentication & Identity

| Provider | Use Case |
|----------|----------|
| **Login.gov** | Federal identity verification |
| **State DMV APIs** | Residency verification |
| **Voter file matching** | Registered voter confirmation |
| **Institutional SSO** | Government employee accounts |

---

## 12. Phased Roadmap

### Phase 1: Foundation (Months 1-4)

| Goal | Deliverables |
|------|--------------|
| **Core civic templates** | Policy Proposal template with phases |
| **Government accounts** | Verified official accounts; role badges |
| **Accessibility baseline** | WCAG AA compliance; mobile-responsive |
| **Plain language mode** | Simplified UI for general audience |
| **Single pilot** | One city, one issue, full lifecycle |

### Phase 2: Scale (Months 5-8)

| Goal | Deliverables |
|------|--------------|
| **Additional templates** | Participatory budget, Issue exploration |
| **Civic schemes** | Policy-specific argument patterns |
| **Multi-language** | Spanish + community-specific languages |
| **Facilitation tools** | Moderator dashboard; guidance prompts |
| **3-5 pilots** | Multiple cities, varied use cases |

### Phase 3: Integration (Months 9-12)

| Goal | Deliverables |
|------|--------------|
| **Government system integration** | Agenda, budget, GIS connections |
| **Embeddable widgets** | "Discuss on Civic Agora" for gov sites |
| **Public records export** | Compliance-ready formats |
| **Analytics dashboard** | Participation metrics; deliberation health |
| **Sustainability model** | Pricing; contracts; grants |

### Phase 4: Ecosystem (Year 2)

| Goal | Deliverables |
|------|--------------|
| **Cross-jurisdiction** | State-level; regional deliberations |
| **Civic organization tier** | Advocacy groups, coalitions |
| **Election integration** | Ballot measure deliberation |
| **Research partnerships** | Academic study of deliberation quality |
| **Open data** | Anonymized deliberation datasets for research |

---

## Appendix: Comparison to Academic Agora

| Dimension | Academic Agora | Civic Agora |
|-----------|----------------|-------------|
| **Primary users** | Scholars, researchers | Residents, officials, organizers |
| **Core content** | Papers, claims, arguments | Proposals, policies, positions |
| **Validation** | Peer review, evidence | Public scrutiny, voting |
| **Incentives** | Career advancement, reputation | Civic duty, influence, accountability |
| **Timeline** | Long-form (years) | Issue-cycle (weeks to months) |
| **Privacy** | Public scholarship | Mixed (some sensitive) |
| **Accessibility** | High education assumed | General public literacy |
| **Regulation** | Academic norms | Public records, open meetings law |
| **Revenue** | Institutional subscriptions | Government contracts, grants |

---

*This document should be updated as pilot learnings emerge and civic engagement landscape evolves.*
