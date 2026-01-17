# Landing/About Page & Onboarding Page Update Notes

## PART 1: Current State Analysis

---

## A. Landing/About Page - Current State

**Location:** `app/(editor)/about/landing/page.tsx` (1941 lines)

### Current Structure

The landing page is a comprehensive, well-structured document with the following major sections:

1. **Hero Section** - Three variant implementations exist:
   - `HeroSection` (active) - "Digital Agora: Infrastructure for Public Reasoning"
   - `HeroSectionAlternate` - "Rebuilding Public Reasoning Infrastructure"  
   - `HeroSectionRevised` - More detailed version
   - Core message: Platform for structured public discourse with stable identifiers, challenge tracking, argumentation schemes

2. **Problem Section** - "Degradation of the Public Sphere"
   - References Habermas on communicative action
   - Critiques current platforms (virality vs validity, re-feudalization)
   - Emphasizes infrastructural nature of the problem

3. **Civic Requirements Section** - 5 requirements for democratic discourse:
   - Transparency (inspectable reasoning chains)
   - Accessibility (navigable complex reasoning)
   - Accountability (attributable, testable claims)
   - Collaboration (arguments improve through examination)
   - Durability (reasoning accumulates as common resource)

4. **Institutional Requirements Section** - 5 institutional deliberation requirements:
   - Reusability (reasoning transfer between institutions)
   - Granular Addressability (challenges target specific components)
   - Provenance Tracking (visible dependencies)
   - Protocol Enforcement (no silent ignoring of challenges)
   - Machine Readability (computation-ready reasoning)

5. **User Journey Overview** - Visual flow diagram showing:
   - Discussion → Proposition → Workshop → Claim → Graph → Argument
   - Arguments List → Dialogue → Debate Sheet → KB Page → Network

6. **Journey Steps (11 expandable steps)** - Detailed technical walkthrough:
   - Step 1: Join Discussion → Deliberation
   - Step 2: Compose Proposition
   - Step 3: Workshop (Vote, Endorse, Reply)
   - Step 4: Promote to Claim
   - Step 5: View Claims (Minimap/CEG)
   - Step 6: Compose Argument (Scheme Composer)
   - Step 7: View Arguments (AIF Arguments List)
   - Step 8: Dialogue Move (Attack Menu)
   - Step 9: Navigate Debate Sheet
   - Step 10: Publish to Knowledge Base
   - Step 11: Explore Network (Plexus)
   - Each step includes: What, Why, Schema, User Action

7. **Implementation Status Section**
   - Current stats: ~20 deliberations, ~500 claims, ~200 arguments, ~50 theory works
   - Data model stable (Prisma/PostgreSQL)
   - Export formats: AIF 2.0, AIF+, JSON-LD, PDF
   - Known limitations listed

8. **Alpha Section** - Participation requirements (5 items)

9. **Foundations Section** - Theoretical foundations with expandable categories
   - References external `foundationCategories` from details page
   
10. **Access Section** - Request access form

11. **Closing Section** - "This is not marketing material. It is technical specification."

### Current Strengths
- Comprehensive theoretical grounding (Habermas, argumentation theory)
- Detailed technical documentation of user journey
- Clear problem/solution framing
- Professional, polished UI with animations
- Good balance of accessibility and technical depth

### Current Gaps/Opportunities for Improvement
1. **No mention of newer subsystems** that have been developed:
   - ASPIC+ system for defeasible reasoning
   - Advanced AIF ontology integration
   - Gestalt/reframing capabilities
   - Stacks/Library system
   - Academic research integration features
   - Legal identity frame
   
2. **Missing emphasis on:**
   - Feed system architecture
   - Chat/discussion improvements
   - Article system
   - Categorical foundations

3. **Dated statistics** - metrics may need updating

4. **No clear differentiation** between use cases:
   - Academic/research use
   - Institutional deliberation
   - Community discourse
   - Legal/policy contexts

---

## B. Onboarding Page - Current State

**Location:** `app/(auth)/onboarding/page.tsx` (wrapper - 24 lines)
**Main Component:** `app/(auth)/onboarding/onboarding-flow.tsx` (68 lines)

### Current Structure

Very minimal 2-step flow:
1. **Profile Step** - `AccountProfile` component for basic user info
2. **Customize Step** - `CustomButtons` for profile customization

After completion: redirects to `room/global`

### Current Issues
1. **Extremely basic** - Just profile setup, no platform introduction
2. **No context about the platform** - Users get no explanation of what Agora is or how to use it
3. **No feature introduction** - Doesn't explain deliberations, claims, arguments, etc.
4. **No role/interest selection** - Doesn't learn about user's goals (researcher, institution, community organizer, etc.)
5. **No tutorials or guidance** - Users are dropped into the platform cold
6. **No explanation of key concepts:**
   - What are deliberations?
   - What are propositions vs claims?
   - What are argumentation schemes?
   - How do dialogue moves work?
   - What is the knowledge base?
7. **Fixed destination** - Always goes to `room/global` regardless of user interests
8. **No integration with platform philosophy** - Doesn't communicate the "why" of structured discourse

### Recommended Onboarding Improvements
1. **Welcome/intro screen** explaining platform purpose
2. **Role/interest selection** (academic, institutional, community, curious citizen)
3. **Interactive tutorial** or guided first steps
4. **Key concept introduction** with simple explanations
5. **Feature highlights** relevant to chosen role
6. **Customizable destination** based on interests
7. **Progressive disclosure** - don't overwhelm, introduce features as needed

---

## PART 2: Architecture Document Review

Based on reviewing the 14 specified architecture documents, here are the key capabilities, framings, and features that should be reflected in the landing/about page and onboarding:

### 2.1 Major System Capabilities (from Architecture Docs)

#### A. Core Deliberation System (AGORA_DELIBERATION_SYSTEM_ARCHITECTURE.md)
- **Three Conceptual Layers:**
  1. **Claims & Evidence Layer** - Transform informal ideas into canonical, evidence-linked assertions
  2. **Arguments & Dialogue Layer** - Structure reasoning with premises, conclusions, schemes, and tracked moves  
  3. **Outputs & Artifacts Layer** - Compose reasoning into publishable, citable documents

- **AIF-Centric Architecture** - Full implementation of Argument Interchange Format ontology:
  - I-nodes (Information), RA-nodes (Rule Application), CA-nodes (Conflict), PA-nodes (Preference), DM-nodes (Dialogue Move)
  - Export to standard formats (AIF 2.0, AIF+, JSON-LD)

- **Progressive Formalization** - Key concept not well-emphasized in current landing:
  - Discussion → Proposition → Claim → Argument → Thesis/KB Page
  - "Structure emerges on-demand, not imposed upfront"

- **Dialogue-First Reasoning** - Every argument has provenance (who, when, in response to what)
  - Implemented move types: ASSERT, WHY, GROUNDS, CONCEDE, RETRACT, CLOSE

- **Confidence & Uncertainty** - First-class support for uncertainty:
  - Per-argument confidence (0.0-1.0)
  - Aggregation modes: Product, Min, Dempster-Shafer intervals
  - Temporal decay badges on stale arguments

#### B. ASPIC+ System (ASPIC_SYSTEM_ARCHITECTURE.md)
- **Full defeasible argumentation framework** implementing Modgil & Prakken's work
- **Argumentation Theory Components:**
  - Strict Rules (Rs) - deductive, certain
  - Defeasible Rules (Rd) - presumptive, defeasible
  - Knowledge Base partitions: Axioms (Kn), Ordinary Premises (Kp), Assumptions (Ka)
  - Preference orderings for conflict resolution
- **Attack types properly formalized:** Rebut, Undercut, Undermine
- **Grounded Extension computation** - Which arguments survive under skeptical semantics
- **Rationality Postulates checking** - Formal verification that theories satisfy requirements

#### C. Feed & Network System (AGORA_FEED_SYSTEM_ARCHITECTURE.md)
- **Real-Time Event Feed** with Server-Sent Events (SSE)
- **Event Coalescing** - Intelligent bundling to reduce noise
- **Multi-View Interface:** Feed, Debates, and Plexus visualization modes
- **Following System** - Room, tag, and stack subscription management

#### D. Plexus Network Visualization (AGORA_SUBSYSTEMS_ARCHITECTURE.md)
- **Meta-network of deliberation rooms** showing cross-references
- **Edge Types (color-coded):**
  - xref: Cross-reference between rooms
  - overlap: Shared claims/arguments
  - stack_ref: Referenced in same stack
  - imports: Arguments imported from another room
  - shared_author: Same author participates
- **Actions:** Transport (copy arguments), Link (create cross-references)

#### E. Stacks/Library System (STACKS_LIBRARY_SYSTEM_ARCHITECTURE.md)
- **Document management infrastructure** for PDF curation
- **Citation Pipeline:**
  - URL/DOI/Library tabs for source attachment
  - Quote linking with page/paragraph specificity
  - Source deduplication via SHA1 fingerprinting
- **Deliberation Integration:** Stacks can host deliberations
- **Evidence aggregation** - Track source usage and quality across deliberations

#### F. Discussion & Chat System (DISCUSSIONS_AND_CHAT_ARCHITECTURE.md)
- **Dual-Mode Communication:** Real-time chat + threaded forum
- **Sheaf-Aware Messaging** with multi-audience facets (Sheaf ACL)
- **Progressive Deliberation** - Discussions upgrade to formal Deliberations
- **Cross-Mode Bridging** - Quote to chat, promote to forum
- **Real-Time Presence** via Supabase

#### G. Categorical Foundations (CATEGORICAL_FOUNDATIONS_ARCHITECTURE.md)
- **Mathematical rigor** based on Simon Ambler's Evidential Closed Categories
- **Arguments as morphisms, claims as objects** with well-defined composition
- **Quantified uncertainty** mapping to Dempster-Shafer belief theory
- **Transport functors** for importing arguments between deliberations
- **Multi-scale visualization:** Atomic Toulmin diagrams to molecular Plexus networks

#### H. AIF Ontology System (AIF_ONTOLOGY_SYSTEM_ARCHITECTURE.md)
- **Comprehensive ontology implementation:**
  - L-nodes (Locution) for speech acts
  - TA-nodes (Transition Application) for dialogue state changes
  - Commitment Store tracking per participant
- **Ludics integration** - Game-theoretic dialogue modeling
- **60+ Walton argumentation schemes** with auto-generated critical questions

### 2.2 Identity Framings (from GESTALT_REFRAMING_V2.md & LEGAL_IDENTITY_FRAME_v3.md)

Multiple compelling framings exist that could strengthen messaging:

#### Frame A: Legal Deliberation Infrastructure
- "Async, networked, multiplayer legal discourse infrastructure"
- Platform features map to legal concepts:
  - Claims → Allegations/Assertions
  - DialogueMoves → Pleadings/Motions
  - Critical Questions → Cross-Examination
  - Schemes → Legal Standards
  - ASPIC+ → Judgment Framework
  - Thesis → Judicial Opinion
- **Pitch:** "Legal-grade reasoning infrastructure for any domain"

#### Frame B: Programming Language for Collective Thought
- Claims as variables, Arguments as functions, Schemes as types
- Type checking via Critical Questions
- Compilation via ASPIC+ Evaluation
- **Pitch:** "Compile human reasoning into verified output"

#### Frame C: Immune System for Ideas
- Arguments as white blood cells, Attacks as pathogen recognition
- Extensions as healthy/compromised states
- **Pitch:** "Every idea tested, defended, or rejected through process"

### 2.3 Academic Agora Features (from ACADEMIC_AGORA_DEVELOPMENT_ROADMAP.md & NETWORKED_ACADEMIC_RESEARCH_MESH.md)

#### Core Positioning:
> "The unit of networking keeps shrinking (people → papers → metadata objects) but has not yet reached **claims and arguments**. Academic Agora fills this gap."

#### Key Academic Features:
1. **Paper-to-Claim Pipeline:**
   - DOI/ISBN/arXiv auto-resolution
   - AI-assisted claim extraction from PDFs
   - Claim type classification: Thesis, Interpretive, Historical, Normative, Methodological

2. **GitHub-for-Scholarship Patterns:**
   - Fork/branch/merge deliberations
   - Pull requests for arguments
   - Argument CI (continuous integration checks)
   - Maintainers + governance model

3. **Academic Deliberation Templates:**
   - Journal Club Mode
   - Seminar Mode (with instructor rubrics)
   - Conference Mode (QR codes on slides → debate space)

4. **Scholarly Credit System:**
   - Contribution types mapping to academic labor
   - Attribution graph for downstream usage
   - Portfolio pages showing claims, objections, syntheses

5. **External Presence:**
   - "Discuss on Agora" badges for papers
   - Browser extension for on-page annotations
   - DOI/PubMed/arXiv landing pages

### 2.4 Key Themes Across Documents

1. **Progressive Formalization** - Structure when needed, not imposed upfront
2. **Protocol Enforcement** - Challenges cannot be silently ignored
3. **Machine Readability** - Reasoning graphs exportable in standard formats
4. **Cross-Context Portability** - Arguments import between deliberations with provenance
5. **Institutional Memory** - Knowledge accumulates, doesn't fragment
6. **Theoretical Grounding** - Not aspirational citations, actual implementations

---

## PART 3: Feature Gaps & Update Recommendations

### 3.1 Landing/About Page - Recommended Updates

#### A. Hero Section Improvements

**Current:** Generic "Infrastructure for Public Reasoning" messaging
**Recommended:**
1. Consider the **Legal Deliberation Infrastructure** framing as primary identity
2. Add concrete capability bullets that differentiate from "just another platform"
3. Update statistics (current: ~20 deliberations, ~500 claims) if outdated
4. Add **audience-specific entry points** (Academic, Institutional, Community)

**Proposed Hero Taglines:**
- Primary: "Legal-grade reasoning infrastructure for any domain"
- Academic: "From papers-as-PDFs to papers-as-debatable, composable claim graphs"
- Institutional: "Infrastructure that makes reasoning chains explicit, reusable, and verifiable"

#### B. New Section: "System Layers" Overview

The architecture docs clearly articulate a 3-layer model not well-represented in current landing:

| Layer | What It Does | Key Artifacts |
|-------|--------------|---------------|
| **Claims & Evidence** | Transform ideas into canonical, evidence-linked assertions | Propositions, Claims, Evidence Links |
| **Arguments & Dialogue** | Structure reasoning with schemes and tracked moves | Arguments, Chains, Dialogue Moves, Commitments |
| **Outputs & Artifacts** | Compose into publishable, citable documents | Thesis, TheoryWorks, KB Pages, DebateSheets |

#### C. ASPIC+ Section (New)

**Currently Missing:** The sophisticated defeasible reasoning system
**Should Add:**
- Explanation of strict vs. defeasible rules
- Attack types (Rebut, Undercut, Undermine) with clear explanations
- Grounded Extension computation - "which arguments survive challenge"
- Confidence tracking and aggregation

#### D. Stacks/Library Section (New or Enhanced)

**Currently:** Brief mention in journey steps only
**Should Add:**
- PDF curation and organization capabilities
- Citation pipeline (DOI resolution, quote linking)
- Source quality tracking
- Integration with deliberations

#### E. Plexus Network Section (New or Enhanced)

**Currently:** Mentioned in Step 11 but not emphasized
**Should Add:**
- Visual preview of the meta-network concept
- Cross-room transport and provenance
- The "graph-of-graphs" concept

#### F. Academic Use Case Section (New)

**Currently:** Not addressed
**Should Add:**
- Paper-to-Claim pipeline
- Journal club / seminar templates
- GitHub-for-scholarship model
- Scholarly credit system

#### G. Multiple Audience Tracks

**Currently:** One-size-fits-all presentation
**Recommended:** Add toggle or tabs for different audience views:
1. **For Academics** - Emphasize claim extraction, citation pipeline, scholarly credit
2. **For Institutions** - Emphasize policy deliberation, audit trails, cross-org portability
3. **For Communities** - Emphasize democratic discourse, transparent reasoning, accumulated knowledge
4. **For Legal/Policy** - Emphasize court-like procedure, evidence standards, defensible conclusions

### 3.2 Onboarding Page - Recommended Complete Redesign

#### A. Proposed Multi-Step Onboarding Flow

**Step 1: Welcome & Purpose (New)**
- Brief, compelling explanation of what Agora is
- 3-4 key differentiators from social platforms
- "What this is NOT: a forum, a social network, a voting platform"
- "What this IS: infrastructure for structured reasoning"

**Step 2: Choose Your Role/Interest (New)**
- [ ] Academic Researcher
- [ ] Institutional/Policy Professional
- [ ] Community Organizer
- [ ] Curious Citizen
- [ ] Technical User / Developer

Each role unlocks different emphasis in subsequent steps.

**Step 3: Profile Setup (Current - Keep)**
- Existing `AccountProfile` component
- Add optional fields:
  - Institutional affiliation
  - Areas of interest/expertise
  - ORCID (for academics)

**Step 4: Key Concepts Tour (New)**

Interactive carousel or cards explaining:
1. **Deliberations** - "Structured spaces for reasoning about complex questions"
2. **Claims** - "Canonical assertions with stable identifiers"
3. **Arguments** - "Explicit connections from premises to conclusions"
4. **Schemes** - "Recognized patterns of reasoning with built-in challenges"
5. **Dialogue Moves** - "Tracked exchanges: assert, challenge, respond"
6. **Knowledge Base** - "Published artifacts that persist as institutional memory"

**Step 5: Feature Highlights by Role (New)**

*For Academics:*
- Extract claims from papers
- Build on others' arguments with provenance
- Publish citable knowledge artifacts

*For Institutional Users:*
- Create transparent decision records
- Import and fork analyses across contexts
- Export reasoning graphs for audit

*For Community Users:*
- Participate in structured deliberations
- See how conclusions emerge from arguments
- Contribute to accumulated knowledge

**Step 6: Profile Customization (Current - Keep)**
- Existing `CustomButtons` component

**Step 7: Choose Destination (New)**
Instead of always going to `room/global`:
- "Join a featured deliberation" (curated list)
- "Explore the network" (Plexus view)
- "Start your own space" (create deliberation)
- "Browse the library" (Stacks view)
- "Take a guided tour" (interactive tutorial)

#### B. Optional Interactive Tutorial

After initial onboarding, offer an optional "guided first deliberation":
1. Read a sample deliberation
2. Make your first claim
3. Attach evidence
4. Respond to a challenge
5. See how your contribution fits the graph

### 3.3 Priority Ranking

**High Priority (Landing Page):**
1. Update hero with clearer identity framing
2. Add ASPIC+ / defeasible reasoning explanation
3. Add audience-specific tracks or messaging
4. Add Stacks/Library capabilities section
5. Update statistics if outdated

**High Priority (Onboarding):**
1. Add welcome/purpose intro step
2. Add role/interest selection
3. Add key concepts tour
4. Add flexible destination selection

**Medium Priority:**
1. Academic use case section (landing)
2. Plexus network visualization preview (landing)
3. Interactive tutorial option (onboarding)
4. Profile enhancements (ORCID, affiliation)

**Lower Priority:**
1. Frame toggles for different audiences (landing)
2. Full guided first-deliberation tutorial (onboarding)
3. Categorical foundations explanation (landing - very technical)

---

## PART 4: Implementation Notes

### 4.1 Landing Page Component Structure

The current page at [page.tsx](app/(editor)/about/landing/page.tsx) is 1941 lines with good component organization. Suggested approach:

1. **Keep existing structure** - It's well-organized
2. **Add new sections** as additional components:
   - `AspicSection` - Defeasible reasoning explanation
   - `StacksLibrarySection` - Document management capabilities
   - `AcademicSection` - Academic use case
   - `AudienceToggle` - Multi-audience switcher
3. **Update existing sections:**
   - `HeroSection` - Refine messaging
   - `StatusSection` - Update metrics
   - `JourneySteps` - Consider adding ASPIC-related steps

### 4.2 Onboarding Page Redesign

The current implementation is minimal (68 lines). Suggested approach:

1. **Create new component:** `OnboardingFlowV2.tsx`
2. **Use step-based state machine** (similar to current but extended)
3. **Create sub-components:**
   - `WelcomeStep.tsx`
   - `RoleSelectionStep.tsx`
   - `ConceptsTourStep.tsx`
   - `FeatureHighlightsStep.tsx`
   - `DestinationStep.tsx`
4. **Persist role selection** to user attributes for future personalization

### 4.3 Content Resources

Leverage existing documentation:
- [GESTALT_REFRAMING_V2.md](Development%20and%20Ideation%20Documents/ARCHITECTURE/GESTALT_REFRAMING_V2.md) - Identity framings and messaging
- [LEGAL_IDENTITY_FRAME_v3.md](Development%20and%20Ideation%20Documents/ARCHITECTURE/LEGAL_IDENTITY_FRAME_v3.md) - Legal frame messaging
- [ACADEMIC_AGORA_DEVELOPMENT_ROADMAP.md](Development%20and%20Ideation%20Documents/ACADEMIC%20FEATURES/ACADEMIC_AGORA_DEVELOPMENT_ROADMAP.md) - Academic features
- Architecture docs - Technical capability descriptions

### 4.4 Design Considerations

- Maintain current visual style (gradients, glass effects, animations)
- Use existing CSS classes from `about-styles.css`
- Follow progressive disclosure principle - don't overwhelm
- Ensure mobile responsiveness (current limitation noted)
- Consider accessibility for screen readers

---

## Summary

The landing/about page has strong bones but needs updates to reflect the full scope of what has been built. The onboarding page needs a complete redesign to actually introduce users to the platform rather than just collecting profile information.

**Key Insight:** The architecture documents reveal a much more sophisticated system than the current landing page communicates. The gap between implementation depth and user-facing explanation represents a significant opportunity to better convey the platform's value proposition.