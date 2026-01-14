# Academic Agora: Mesh for Scholarly Discourse

## Purpose

This document explores how Mesh/Agora could serve as infrastructure for structured academic discussion—a public, persistent, claim-level engagement platform for researchers, scholars, and the broader intellectual community to engage with research outputs.

**Working Thesis**: The academic world lacks infrastructure for sustained, structured public discourse about research. Mesh's core capabilities—claim-level addressability, typed argumentation, commitment tracking, and durable artifacts—are precisely what this gap requires.

---

## Table of Contents

1. [Landscape Analysis](#1-landscape-analysis)
2. [The Gap & Opportunity](#2-the-gap--opportunity)
3. [Platform-to-Need Mapping](#3-platform-to-need-mapping)
4. [Core Use Cases](#4-core-use-cases)
5. [User Stories](#5-user-stories)
6. [Feature Requirements](#6-feature-requirements)
7. [The Academic Agora Vision](#7-the-academic-agora-vision)
8. [Positioning & Messaging](#8-positioning--messaging)
9. [Challenges & Considerations](#9-challenges--considerations)
10. [Pilot Communities](#10-pilot-communities)
11. [Integration Points](#11-integration-points)
12. [Open Questions](#12-open-questions)

---

## 1. Landscape Analysis

### 1.1 Existing Platforms

#### Dedicated Academic Discussion Platforms

| Platform | What It Does | Strengths | Limitations |
|----------|--------------|-----------|-------------|
| **PubPeer** | Post-publication commentary on papers | Serious, persistent, citable | Reactive/critical focus; no threading; no structured dialogue |
| **Hypothesis** | Web annotation layer for any URL/PDF | Inline commenting; works anywhere | Scattered annotations; hard to sustain dialogue; no argument structure |
| **OpenReview** | Public peer review for ML/AI conferences | Transparent reviews; author responses | Conference-bounded; time-limited; review-focused not discussion-focused |

#### Academic Social Networks

| Platform | What It Does | Strengths | Limitations |
|----------|--------------|-----------|-------------|
| **ResearchGate** | Academic social network with Q&A | Large user base; paper hosting | Noisy; gamified; not structured for serious discourse |
| **Academia.edu** | Paper sharing and follow network | Wide adoption | Even more gamified; aggressive notifications; low signal |

#### Preprint Commentary Systems

| Platform | What It Does | Strengths | Limitations |
|----------|--------------|-----------|-------------|
| **Sciety** | Aggregates preprint reviews | Curates community reviews | Aggregation, not original dialogue |
| **ASAPbio** | Promotes preprint review culture | Community building | Advocacy-focused more than platform |
| **PREreview** | Structured preprint reviews | Templates; training | Review-focused, not dialogue-focused |

#### General Purpose Platforms Used for Academic Discussion

| Platform | How It's Used | Limitations |
|----------|---------------|-------------|
| **Twitter/X** | Paper announcements, quick takes | Ephemeral; unstructured; toxic dynamics |
| **Reddit** | Subreddit-specific discussions (r/MachineLearning, etc.) | Anonymous culture clashes with academic norms; no persistence |
| **Hacker News** | Paper discussion threads | Tech-focused; transient |
| **Discord/Slack** | Private lab/community discussions | Closed; not public record |

### 1.2 Traditional Academic Discourse Channels

| Channel | Function | Limitations |
|---------|----------|-------------|
| **Peer review** | Pre-publication evaluation | Private; slow; adversarial; not dialogue |
| **Conferences** | Synchronous, in-person discussion | Exclusive; ephemeral; expensive; geographically limited |
| **Email correspondence** | Direct author contact | Private; high friction; no public record |
| **Published responses** | Formal comments/replies | Slow (months/years); high bar; rare |
| **Blog posts** | Extended commentary | Scattered; no standard format; not discoverable |

---

## 2. The Gap & Opportunity

### 2.1 What's Missing

The academic world lacks a platform that provides:

| Requirement | Current State | What's Needed |
|-------------|---------------|---------------|
| **Structured dialogue** | Comments only | Threaded, typed discussion with argument structure |
| **Claim-level engagement** | Paper-level only | Engage with specific assertions, not just whole papers |
| **Persistence** | Conference-bounded or ephemeral | Durable record that persists indefinitely |
| **Public but serious** | Either closed (email) or too open (Reddit) | Public discourse with academic norms |
| **Attribution & accountability** | Anonymous or pseudonymous | Real identity with reputation |
| **Cross-paper synthesis** | Siloed discussions | Connect claims across papers and fields |
| **Generative discussion** | Reactive/critical focus | Not just critique but collaborative inquiry |
| **Discoverable record** | Scattered across platforms | Searchable, citable discourse |

### 2.2 Why This Gap Exists

**Historical Factors**:
- Academia evolved with print journals and in-person conferences
- Peer review was designed for gatekeeping, not dialogue
- Professional incentives reward publication, not discussion
- No clear business model for scholarly discourse infrastructure

**Platform Failures**:
- Social networks optimize for engagement, not understanding
- Academic platforms copied social network patterns
- Annotation tools don't provide dialogue structure
- No one has built for sustained intellectual exchange

### 2.3 The Opportunity

**Market Size**:
- ~8 million researchers globally
- ~3 million papers published annually
- Growing preprint culture creates demand for pre-publication discussion
- Open science movement creates cultural opening

**Timing**:
- Post-pandemic comfort with digital-first interaction
- Generational shift toward open science
- Disillusionment with social media
- AI tools creating need for human epistemic infrastructure

**Unique Positioning**:
- No serious competitor in structured academic dialogue
- Argumentation theory is literally designed for this
- Academic norms align with platform design (evidence-based, structured, accountable)

---

## 3. Platform-to-Need Mapping

### 3.1 How Mesh Features Serve Academic Needs

| Academic Need | Mesh Feature | How It Helps |
|---------------|--------------|--------------|
| Engage with specific claims | Claims with stable URIs | Reference exact assertions, not just papers |
| Structured dialogue | DialogueMoves (ASSERT, WHY, GROUNDS, etc.) | Clear speech act types for academic discourse |
| Evidence-based discussion | Evidence linking | Connect claims to sources, data, citations |
| Rigorous argumentation | Schemes (60+ Walton patterns) | Structure arguments using established forms |
| Critical examination | Critical Questions per scheme | Generate appropriate challenges automatically |
| Tracking positions | Commitment Stores | See what each participant has asserted |
| Handling disagreement | Attack types (REBUT, UNDERCUT, UNDERMINE) | Model disagreement precisely |
| Building on prior work | ArgumentChains | Compose complex reasoning from simple pieces |
| Exploring alternatives | Scopes | "Under assumption X..." hypotheticals |
| Evaluating strength | ASPIC+ acceptability | Formal evaluation of argument defensibility |
| Producing outputs | Thesis/KB pages | Generate durable scholarly artifacts |
| Institutional memory | Knowledge base | Persist understanding across time |

### 3.2 Academic Workflow Integration

| Workflow Stage | How Mesh Participates |
|----------------|----------------------|
| **Reading a paper** | Extract claims; see existing discussion; add to it |
| **Identifying gaps** | Issues system tracks open questions |
| **Building on work** | Chain arguments from paper claims to new conclusions |
| **Challenging claims** | Structured attack with specific type |
| **Defending work** | Respond to attacks with appropriate moves |
| **Synthesizing literature** | Build argument chains across papers |
| **Preparing a paper** | Generate thesis from resolved deliberations |
| **Peer review** | Structured evaluation using schemes and CQs |
| **Post-publication** | Ongoing discussion, updates, corrections |

---

## 4. Core Use Cases

### 4.1 Post-Publication Commentary

**Scenario**: A researcher reads a paper and wants to publicly engage with a specific claim.

**Current State**: 
- Leave a PubPeer comment (unstructured)
- Write a blog post (scattered)
- Email the authors (private)
- Tweet about it (ephemeral, potentially hostile)

**With Academic Agora**:
1. Navigate to paper (linked via DOI)
2. See existing claims extracted or registered
3. Select the specific claim to engage
4. Choose move type: CHALLENGE (which premise?), SUPPORT (additional evidence), EXTEND (new conclusion)
5. System prompts for appropriate structure based on move type
6. Contribution becomes part of persistent, searchable record
7. Authors and others can respond with structured moves
8. Discussion produces citable artifact

### 4.2 Replication & Methodology Discussion

**Scenario**: Researchers attempting replication encounter issues and want to discuss methodology.

**Current State**:
- Email authors (may not respond)
- Post on methods forum (if one exists)
- Publish replication paper (takes years)

**With Academic Agora**:
1. Find paper's existing claims about methodology
2. Register issue: "Attempted replication under conditions X yielded Y"
3. Challenge specific methodological claims with evidence
4. Authors and community respond
5. If methodology was unclear: Resolution produces clarification
6. If methodology was flawed: Record documents the problem
7. Future researchers find this before attempting replication

### 4.3 Cross-Paper Synthesis

**Scenario**: A researcher sees connections between claims in multiple papers that haven't been explicitly made.

**Current State**:
- Write a review paper (high bar, long timeline)
- Publish a "perspectives" piece (requires outlet)
- Keep it in personal notes (not shared)

**With Academic Agora**:
1. Register claims from multiple papers
2. Build argument chain connecting them
3. Use appropriate scheme (e.g., Argument from Analogy, Argument from Correlation to Cause)
4. Community can support, challenge, or extend the synthesis
5. If synthesis holds, becomes citable contribution
6. May form basis for formal publication

### 4.4 Preprint Feedback

**Scenario**: Authors post a preprint and want substantive feedback before submission.

**Current State**:
- Share on Twitter and hope (noisy, unstructured)
- Post to preprint review platform (review-focused, not dialogue)
- Email colleagues (closed, limited)

**With Academic Agora**:
1. Register preprint and extract key claims
2. Invite community feedback with specific focus areas
3. Reviewers engage at claim level with structured moves
4. Authors can respond, clarify, concede, or defend
5. Discussion tracked with commitment stores
6. Produces structured feedback document for revision
7. Post-publication, discussion continues

### 4.5 Living Literature Reviews

**Scenario**: A field needs an ongoing, updated synthesis of evidence on a contested question.

**Current State**:
- Published reviews outdated immediately
- Wiki-style resources lack rigor
- No way to track claim-level evidence across time

**With Academic Agora**:
1. Define the core question/issue
2. Register claims from all relevant papers
3. Build argument network mapping support/attack relationships
4. As new papers publish, add to the network
5. ASPIC+ evaluation shows current state of evidence
6. Anyone can see what's settled, what's contested, what's open
7. Living document updates automatically as network evolves

### 4.6 Methodological Standard-Setting

**Scenario**: A field wants to establish best practices for a technique.

**Current State**:
- Working group produces static document
- Debates happen in closed meetings
- Standards become outdated

**With Academic Agora**:
1. Create deliberation space for the methodology
2. Register proposed standards as claims
3. Community debates using structured dialogue
4. Attacks and defenses reveal contested points
5. Resolution produces documented consensus (or documented disagreement)
6. Standards document generated with full reasoning trail
7. Future amendments follow same process

---

## 5. User Stories

### 5.1 Primary Personas

#### The Active Researcher

> "I publish 3-5 papers a year and read 50+. I want to engage with the literature more deeply than citations allow, but I don't have time for long-form responses and don't want my quick thoughts lost to Twitter."

**Needs**: Low-friction claim-level engagement; structured but not onerous; persistent and citable

#### The Early-Career Scholar

> "I have thoughts on senior researchers' work but the professional risk of public criticism is high. I need a space where substantive critique is normal and respected, not career-ending."

**Needs**: Professional norms; structured disagreement; visible community standards

#### The Senior Professor

> "I want to engage with challenges to my work, but I'm not going to chase down every Twitter thread or blog post. I need a canonical place where serious discussion happens."

**Needs**: Signal/noise filtering; structured format that's worth engaging with; durable record

#### The Research Group Lead

> "I want my lab to engage with the literature systematically. We need to track what claims we've evaluated, what we accept, and what we're challenging."

**Needs**: Group commitment tracking; shared workspace; integration with lab workflow

#### The Science Journalist

> "I'm trying to understand a controversy in a field. I need to see the structure of the debate, not just a list of papers."

**Needs**: Visualized argument structure; clear mapping of who claims what; accessible entry point

#### The Systematic Reviewer

> "I'm conducting a systematic review and need to map the evidence landscape. Current tools only handle papers, not claims."

**Needs**: Claim-level tracking across papers; evidence relationships; exportable synthesis

### 5.2 User Stories by Feature

| As a... | I want to... | So that... | Feature |
|---------|--------------|------------|---------|
| Researcher | reference a specific claim in a paper | I can engage precisely, not vaguely | Claim URIs |
| Reader | see existing discussion on a claim | I don't duplicate effort | Claim-linked discussions |
| Critic | challenge a specific inference | my critique is precise and addressable | Attack types |
| Author | respond to challenges | the record reflects my defense | DialogueMoves |
| Synthesizer | connect claims across papers | I can build novel arguments | ArgumentChains |
| Field member | see the state of a debate | I know what's settled vs. contested | Acceptability semantics |
| Lab group | track our collective positions | we have shared understanding | Commitment stores |
| Anyone | cite a specific discussion | the discourse is citable | Stable URIs, DOI integration |

---

## 6. Feature Requirements

### 6.1 Must-Have for Academic Use

| Feature | Requirement | Rationale |
|---------|-------------|-----------|
| **DOI/arXiv integration** | Link claims to papers via identifier | Academic papers are the source material |
| **PDF annotation bridge** | Extract claims from PDFs (or link to them) | Papers are PDFs; need connection |
| **ORCID authentication** | Verify academic identity | Accountability requires identity |
| **Citation export** | BibTeX, RIS export of discussions | Must be citable in papers |
| **Scheme customization** | Discipline-specific argument patterns | Different fields reason differently |
| **LaTeX/Markdown support** | Math, formatting in claims | STEM fields need equations |
| **Version tracking** | Track claims through paper versions | Preprints update; claims change |
| **Visibility controls** | Public, field-specific, group-only | Not all discussion should be public |
| **Notification system** | Alert when your claims are engaged | Authors need to know |

### 6.2 Should-Have

| Feature | Requirement | Rationale |
|---------|-------------|-----------|
| **Semantic Scholar/OpenAlex integration** | Pull paper metadata | Reduce friction |
| **Claim extraction assistance** | AI-assisted claim identification | Lower barrier to entry |
| **Field-specific taxonomies** | Organize by discipline | Discoverability |
| **Endorsement system** | Soft signals of support | Not everything needs argument |
| **Private drafting** | Prepare contributions privately | Lower stakes exploration |
| **Email notification preferences** | Configurable alerts | Academic email overload is real |
| **API for tools** | Integration with reference managers | Fit existing workflows |
| **Moderation tools** | Community management | Maintain discourse quality |

### 6.3 Could-Have (Future)

| Feature | Requirement | Rationale |
|---------|-------------|-----------|
| **Peer review integration** | Structured review as dialogue | Transform peer review |
| **Journal partnerships** | Embed in publishing workflow | Institutional adoption |
| **Funding agency integration** | Track grant-funded claims | Accountability requirements |
| **AI writing assistance** | Help formulate arguments | Lower barrier, maintain quality |
| **Metrics dashboard** | Contribution analytics | Some gamification may help adoption |
| **Virtual conference integration** | Synchronous/asynchronous hybrid | Extend conference discussions |

---

## 7. The Academic Agora Vision

### 7.1 The Transformation

**From: Fragmented, Private, Ephemeral**
- Discussion happens in closed channels (email, lab meetings)
- Public discussion is scattered (Twitter, blogs, comments)
- Nothing persists or compounds
- Claiming credit for ideas is fraught

**To: Structured, Public, Durable**
- Discussion has a canonical location
- Contributions are structured and attributable
- Record persists and grows
- Engagement with ideas is professionally valued

### 7.2 What Changes for Academia

| Dimension | Current State | With Academic Agora |
|-----------|---------------|---------------------|
| **Post-publication life** | Paper is static artifact | Paper spawns living discussion |
| **Engagement credit** | Only citations count | Structured contributions are citable |
| **Error correction** | Corrigenda (rare, slow) | Public discussion surfaces issues |
| **Idea development** | Private until publication | Public reasoning produces priority |
| **Cross-field synthesis** | Rare, high-barrier | Natural outcome of linked claims |
| **Literature navigation** | Paper-by-paper | Claim-by-claim, structured |
| **Peer review** | Private, binary | Continuous, public, constructive |
| **Expertise visibility** | Publication record only | Contribution quality visible |

### 7.3 The Compound Effect

Over time, Academic Agora produces:

**For Individual Papers**:
- A structured record of every challenge and defense
- Visible strength of claims (acceptability status)
- Connected to claims in other papers

**For Research Fields**:
- A map of what's contested vs. settled
- Visible structure of ongoing debates
- Living literature reviews that update automatically

**For Science as a Whole**:
- Public reasoning infrastructure
- Institutional memory for intellectual discourse
- Model for serious public discussion beyond academia

### 7.4 The Name

**"Academic Agora"** evokes:
- The ancient Greek agora as a place of public discourse
- The "marketplace of ideas" as literal infrastructure
- Dignity and seriousness (not a "social network for academics")

**Alternative Names to Consider**:
- Scholarly Commons
- Discourse
- The Colloquium
- Episteme
- Scholarium
- The Symposium

---

## 8. Positioning & Messaging

### 8.1 Core Positioning

**For researchers who** want to engage with the literature more deeply than citations allow,

**Academic Agora is** structured discourse infrastructure

**That provides** claim-level engagement, typed argumentation, and durable public record

**Unlike** scattered comments, private email, or ephemeral social media,

**We offer** the serious, structured, persistent discussion that scholarly work deserves.

### 8.2 Tagline Candidates

- "Where papers become conversations"
- "Structured discourse for serious research"
- "The public record of scholarly reasoning"
- "Engage with claims, not just papers"
- "From publication to permanent dialogue"
- "Research discussion with receipts"

### 8.3 Messaging by Audience

#### For Researchers
> "Your ideas deserve better than a tweet. Academic Agora gives you structured tools to engage with research at the claim level—challenge, defend, extend, synthesize—with a permanent, citable record."

#### For Institutions
> "Academic Agora provides the discourse infrastructure your researchers need. Track engagement with institutional outputs, demonstrate impact beyond citations, and foster the open science culture your stakeholders expect."

#### For Funders
> "Traditional metrics miss what matters: the quality of ideas. Academic Agora creates a public record of how funded research engages with its field—supporting accountability while fostering the discourse that advances science."

#### For Publishers
> "Extend the life of published work. Academic Agora transforms static papers into living discourse, increasing engagement and demonstrating the ongoing value of your publications."

### 8.4 Differentiation

| Competitor | Their Focus | Our Differentiation |
|------------|-------------|---------------------|
| **PubPeer** | Error detection | We're for all engagement, not just critique |
| **ResearchGate** | Social networking | We're for discourse, not networking |
| **Twitter/X** | Broad reach | We're for depth, not reach |
| **Hypothesis** | Inline annotation | We're for sustained dialogue, not scattered notes |
| **OpenReview** | Conference reviews | We're persistent, not conference-bounded |

---

## 9. Challenges & Considerations

### 9.1 Adoption Barriers

| Barrier | Challenge | Mitigation |
|---------|-----------|------------|
| **Inertia** | Researchers have existing habits | Start where they already are (paper reading) |
| **Time** | Researchers are overcommitted | Make contribution low-friction |
| **Incentives** | System rewards publications, not discussion | Make contributions citable; work with institutions |
| **Critical mass** | Empty platform isn't useful | Seed with content; target specific communities |
| **Learning curve** | Structured argumentation is unfamiliar | Progressive formalization; templates |

### 9.2 Professional Risks

| Risk | Concern | Mitigation |
|------|---------|------------|
| **Career damage** | Public critique could backfire | Community norms; structured = less hostile |
| **Time sink** | Endless discussions waste time | Deliberations can close; resolution mechanisms |
| **Harassment** | Targeted attacks on researchers | Moderation; identity requirements; norms |
| **Gaming** | Metrics get gamed | Focus on quality, not quantity |

### 9.3 Technical Challenges

| Challenge | Issue | Approach |
|-----------|-------|----------|
| **PDF extraction** | Claim extraction from papers is hard | AI assistance + human curation |
| **Identity** | Verifying academic affiliation | ORCID integration; institutional SSO |
| **Scale** | Millions of papers exist | Start narrow; build incrementally |
| **Interoperability** | Need to work with existing tools | APIs; export formats; integrations |

### 9.4 Cultural Considerations

| Consideration | Issue | Approach |
|---------------|-------|----------|
| **Disciplinary differences** | Fields have different norms | Customizable schemes; field-specific spaces |
| **Global participation** | Language, timezone, access | Translation support; async-first design |
| **Junior/senior dynamics** | Power differentials affect discourse | Anonymous options; structured format levels the field |
| **Controversy management** | Hot-button topics attract bad actors | Moderation; cooling-off mechanisms |

---

## 10. Pilot Communities

### 10.1 Ideal Pilot Characteristics

- **Preprint culture**: Already comfortable with pre-publication discussion
- **Replication focus**: Active interest in examining claims
- **Methodological debates**: Ongoing discussions about how to do research
- **Reasonable size**: Big enough for critical mass, small enough to cohere
- **Open science orientation**: Values align with platform goals
- **Existing frustration**: Current tools aren't working

### 10.2 Candidate Communities

| Community | Why Good Fit | Entry Point |
|-----------|--------------|-------------|
| **Meta-science** | Literally studies scientific discourse; natural allies | Replications, methodology debates |
| **Machine Learning** | Heavy preprint use; methodological debates; OpenReview familiarity | Paper reproducibility discussions |
| **Psychology (Open Science)** | Replication crisis created culture shift; Many Analysts projects | Cross-lab methodology discussions |
| **Economics (Empirical)** | Data/code sharing norms emerging; causal inference debates | Robustness discussions |
| **Biomedical (Preprint focused)** | COVID accelerated preprint comfort; high stakes | Preprint feedback before journal submission |
| **Philosophy** | Argumentation is literally the field; natural affinity | Engage with platform's theoretical foundations |
| **Computational Social Science** | Interdisciplinary; methods-focused; digital native | Cross-disciplinary methodology |

### 10.3 Pilot Structure

**Phase 1: Seeded Content**
- Partner with a specific research group
- Seed platform with claims from their papers and related work
- Have group use platform for their internal discussions
- Gather feedback on workflows

**Phase 2: Expanded Community**
- Invite colleagues and collaborators
- Open to broader field community
- Focus on a specific debate or paper cluster
- Build critical mass in narrow area

**Phase 3: Organic Growth**
- Open to adjacent fields
- Users bring their own papers and discussions
- Platform becomes self-sustaining in community

---

## 11. Integration Points

### 11.1 Academic Infrastructure

| System | Integration | Value |
|--------|-------------|-------|
| **DOI/Crossref** | Link claims to papers | Canonical paper identification |
| **ORCID** | Researcher identity | Verified attribution |
| **Semantic Scholar** | Paper metadata | Auto-populate paper info |
| **OpenAlex** | Open bibliographic data | Broad coverage |
| **arXiv/bioRxiv/etc.** | Preprint linking | Pre-publication discourse |
| **Zotero/Mendeley** | Reference managers | Fit researcher workflow |
| **Hypothesis** | Annotation layer | Bridge to inline commenting |
| **Google Scholar** | Discovery | Findability |

### 11.2 Potential Publisher Partnerships

| Publisher Type | Value Proposition |
|----------------|-------------------|
| **Open access journals** | Extend engagement with published work |
| **Preprint servers** | Structured feedback layer |
| **Overlay journals** | Discussion as review process |
| **Megajournals** | Post-publication engagement |
| **Learned societies** | Community discourse infrastructure |

### 11.3 Institutional Integration

| Institution | Integration |
|-------------|-------------|
| **Universities** | SSO authentication; institutional analytics |
| **Libraries** | Discovery layer; archival |
| **Funding agencies** | Grant-linked discourse; impact demonstration |
| **Research offices** | Engagement metrics; alt-metrics integration |

---

## 12. Open Questions

### 12.1 Strategic Questions

- [ ] Should we start with a specific discipline or go broad?
- [ ] Should we require ORCID/institutional verification or allow pseudonyms?
- [ ] Should we build our own PDF viewer or integrate with existing tools?
- [ ] Should we seed content ourselves or wait for organic contribution?
- [ ] Should we charge institutions, researchers, or be grant-funded?
- [ ] Should we pursue publisher partnerships or stay independent?

### 12.2 Product Questions

- [ ] How much structure is too much for casual engagement?
- [ ] How do we handle papers with no existing claims registered?
- [ ] How do we deal with claims that span multiple papers?
- [ ] What's the right balance between public and private discussion?
- [ ] How do we handle controversial topics without becoming a battleground?
- [ ] How do we make discussions discoverable without being overwhelming?

### 12.3 Community Questions

- [ ] What norms should govern discourse? Who sets them?
- [ ] How do we handle disputes about moderation?
- [ ] How do we prevent the platform from becoming another metric to game?
- [ ] How do we ensure global, not just Western, participation?
- [ ] How do we protect junior researchers from senior retaliation?

### 12.4 Research Questions

- [ ] What makes academic online discourse succeed or fail?
- [ ] How do existing argumentation schemes map to academic reasoning?
- [ ] What new schemes might be needed for academic contexts?
- [ ] How does structured dialogue change the quality of critique?
- [ ] What's the relationship between discussion participation and research quality?

---

## 13. Next Steps

### 13.1 Immediate (Exploration)

1. **Landscape deep-dive**: Detailed analysis of PubPeer, OpenReview, Hypothesis usage patterns
2. **User interviews**: Talk to researchers about discussion habits and frustrations
3. **Community identification**: Map potential pilot communities and their needs
4. **Competitive moat**: Identify what makes this defensible

### 13.2 Near-Term (Validation)

1. **Prototype with one paper**: Take a specific controversial paper and model full discussion
2. **Academic advisory group**: Recruit researchers to guide development
3. **Scheme mapping**: Map existing Walton schemes to academic argument types
4. **Integration scoping**: Technical requirements for DOI/ORCID/etc. integration

### 13.3 Medium-Term (Pilot)

1. **Pilot community selection**: Choose first community and secure commitment
2. **Seeded content creation**: Populate with claims from key papers
3. **Limited launch**: Invite-only pilot with feedback loops
4. **Iteration**: Refine based on usage patterns

---

## Appendix A: Scheme Mapping for Academic Discourse

### A.1 Existing Walton Schemes Most Relevant to Academia

| Scheme | Academic Application |
|--------|---------------------|
| Argument from Expert Opinion | Appeal to authority in citations |
| Argument from Evidence to Hypothesis | Core of empirical research |
| Argument from Correlation to Cause | Causal inference claims |
| Argument from Analogy | Cross-domain application |
| Argument from Example | Case-based reasoning |
| Argument from Sign | Diagnostic reasoning |
| Argument from Consequences | Policy implications |
| Slippery Slope | Methodological concerns |
| Argument from Precedent | Building on prior work |

### A.2 Potential New Schemes for Academia

| Proposed Scheme | Description | Critical Questions |
|-----------------|-------------|-------------------|
| Argument from Replication | Claim X is supported because study Y replicated result Z | Was replication exact? Were conditions comparable? |
| Argument from Statistical Inference | Claim X is supported by statistical result Y | Appropriate test? Sufficient power? Multiple comparisons? |
| Argument from Mechanism | Claim X is supported by mechanism Y | Is mechanism established? Are alternatives excluded? |
| Argument from Model | Claim X follows from model Y | Are assumptions reasonable? Does model apply? |
| Argument from Meta-Analysis | Claim X is supported by synthesis of studies Y | Heterogeneity? Publication bias? Quality weighting? |

---

## Appendix B: Academic Agora One-Pager

### The Problem

Academic discourse is broken:
- **Private**: Important discussions happen in email and closed meetings
- **Scattered**: Public discussion is fragmented across Twitter, blogs, comments
- **Ephemeral**: Nothing persists; the same debates repeat
- **Unstructured**: Comments don't build; no synthesis emerges
- **Paper-level only**: Can't engage with specific claims

### The Solution

**Academic Agora**: Structured discourse infrastructure for scholarly work

- **Claim-level engagement**: Respond to specific assertions, not just papers
- **Typed dialogue**: ASSERT, CHALLENGE, DEFEND, EXTEND—not just "comment"
- **Persistent record**: Durable, searchable, citable contributions
- **Evidence-linked**: Connect claims to sources and data
- **Synthesis-producing**: Discussions generate artifacts, not just threads

### How It Works

1. Papers are linked; key claims are registered
2. Researchers engage with specific claims using structured moves
3. Arguments build using established reasoning patterns
4. System tracks who committed to what
5. Discussion produces citable artifact

### Why Now

- Preprint culture creates demand for pre-publication discussion
- Open science movement values public discourse
- Social media has failed academic needs
- AI tools create need for human epistemic infrastructure

### The Ask

We're seeking:
- **Pilot communities** willing to test structured academic discourse
- **Advisors** to guide academic alignment
- **Partners** in publishing, libraries, or funding agencies

---

*This is a working document for exploring the Academic Agora use case. Ideas, additions, and challenges welcome.*
