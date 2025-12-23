# Gestalt Reframing: New Lenses on the Whole (v2)

## Purpose

This document develops and systematizes alternative framings for the Mesh/Agora platform. Rather than iterating on a single positioning, we explore fundamentally different ways of seeing what the platform is and does—each revealing different aspects of the system and resonating with different audiences.

**Core Insight**: The same platform can be truthfully described as infrastructure, a language, a court, a laboratory, or a memory system. The choice of frame isn't about accuracy—all are accurate—it's about resonance with specific audiences and contexts.

---

## Table of Contents

1. [Complete Systems Inventory](#1-complete-systems-inventory)
2. [The Reframing Framework](#2-the-reframing-framework)
3. [Primary Reframings (Fully Developed)](#3-primary-reframings-fully-developed)
4. [Secondary Reframings (Sketch Level)](#4-secondary-reframings-sketch-level)
5. [Hybrid Framings](#5-hybrid-framings)
6. [Cross-Cutting Themes](#6-cross-cutting-themes)
7. [Frame Selection Matrix](#7-frame-selection-matrix)
8. [Provocative Questions & Edge Cases](#8-provocative-questions--edge-cases)
9. [System Synergies](#9-system-synergies)
10. [Accidental Use Cases](#10-accidental-use-cases)
11. [Testing & Validation Protocol](#11-testing--validation-protocol)
12. [Implementation Guidance](#12-implementation-guidance)

---

## 1. Complete Systems Inventory

Before reframing, we must understand what we're reframing. This inventory catalogs every capability without interpretive overlay.

### 1.1 Layer 1: Claims & Evidence (Foundation)

| System | Technical Description | What It Actually Does |
|--------|----------------------|----------------------|
| **Claims** | Canonical assertion objects with stable URIs | Creates addressable units of assertion that persist across contexts |
| **ClaimEdges** | Typed relationships between claims | Links claims in support/attack/equivalence relationships |
| **Evidence** | Source-linked supporting material | Connects claims to external verification (documents, data, citations) |
| **Propositions** | Informal assertion containers | Enables lightweight discussion before formal claim creation |
| **Issues** | Open question tracking | Captures uncertainties, clarification requests, community flags |

### 1.2 Layer 2: Arguments & Dialogue (Structure)

| System | Technical Description | What It Actually Does |
|--------|----------------------|----------------------|
| **Arguments** | Premise-conclusion structures with scheme annotations | Connects claims in structured inferential relationships |
| **ArgumentChains** | Composed argument networks (serial, convergent, divergent, linked) | Builds complex reasoning from simple argument units |
| **DialogueMoves** | Speech act records (ASSERT, WHY, GROUNDS, CONCEDE, RETRACT) | Records every contribution with actor, target, type, and timestamp |
| **CommitmentStores** | Public commitment tracking per participant | Tracks what each participant is committed to at any point |
| **Schemes** | 60+ Walton scheme patterns with critical questions | Provides recognized reasoning patterns with built-in challenges |
| **CriticalQuestions** | Auto-generated challenges per scheme | Produces the questions that must be answered for each argument type |
| **Attacks** | Typed disagreement (REBUT, UNDERCUT, UNDERMINE) | Models challenge as typed relationships, not unstructured opposition |
| **Defenses** | Responses to attacks | Tracks how challenges are addressed |
| **Scopes** | Epistemic partitioning (hypothetical, counterfactual, conditional) | Separates reasoning by assumption context |

### 1.3 Layer 3: Evaluation & Semantics (Formalism)

| System | Technical Description | What It Actually Does |
|--------|----------------------|----------------------|
| **Preference Orderings** | Priority rankings for conflicting rules | Resolves conflicts when multiple rules apply |
| **Ludics** | Game-theoretic dialogue modeling | Models reasoning as strategic interaction between positions |
| **ASPIC+ Theory** | Defeasible argumentation framework | Formalizes arguments as strict/defeasible rules with preference orderings |
| **Acceptability Extensions** | Grounded, preferred, stable, complete semantics | Determines which arguments are ultimately defensible |
| **Dung Semantics** | Abstract argumentation acceptability | Computes which arguments survive under different semantic assumptions |

### 1.4 Layer 4: Outputs & Artifacts (Production)

| System | Technical Description | What It Actually Does |
|--------|----------------------|----------------------|
| **Thesis** | Composed reasoning documents | Generates publishable documents from argument structures |
| **TheoryWorks** | Extended theoretical compositions | Produces longer-form analytical works |
| **KbPages** | Knowledge base entries | Creates persistent institutional memory artifacts |
| **DebateSheets** | Exportable argument summaries | Generates shareable argument maps |
| **Graphs/Visualization** | Network rendering | Makes reasoning navigable as visual structure |
| **AIF Export** | Standard format output | Enables interoperability with other argumentation tools |

### 1.5 Layer 5: Participation & Governance (Process)

| System | Technical Description | What It Actually Does |
|--------|----------------------|----------------------|
| **NCR (Non-Canonical Remarks)** | Community contribution workflow | Allows outside contributions with author approval |
| **Voting/Endorsement** | Proposition support tracking | Enables informal consensus measurement |
| **Dialogue Protocols** | Turn-taking and move legality | Structures who can say what when |
| **Roles** | Proponent/Opponent/Judge assignments | Defines participant positions in formal dialogue |
| **Audit Trails** | Complete action history | Records everything for accountability |

---

## 2. The Reframing Framework

### 2.1 What Reframing Is

Reframing is not finding the "right" metaphor—it's understanding that **different frames reveal different truths**. The court metaphor makes procedural structure visible; the immune system metaphor makes threat-response patterns visible; the programming language metaphor makes compositional logic visible.

### 2.2 Anatomy of a Frame

Each complete frame includes:

| Component | Purpose | Example (Court Frame) |
|-----------|---------|----------------------|
| **Core Metaphor** | The central analogy | "A court system for epistemic disputes" |
| **Conceptual Mapping** | How platform → frame | Claims → Allegations; Schemes → Legal Standards |
| **Primary Verb** | What users "do" | Adjudicate |
| **Success Metric** | What "winning" means | Judgment rendered |
| **Failure Mode** | What goes wrong | Mistrial |
| **User Identity** | Who users become | Jurists |
| **Natural Audience** | Who resonates | Legal, governance, policy |
| **Hidden Aspect** | What this frame obscures | Collaborative, generative aspects |
| **Revealed Aspect** | What this frame illuminates | Procedural rigor, accountability |

### 2.3 Frame Evaluation Criteria

| Criterion | Description | Weight |
|-----------|-------------|--------|
| **Accuracy** | Does the metaphor truthfully represent capabilities? | Required |
| **Resonance** | Does the audience immediately "get it"? | High |
| **Differentiation** | Does this distinguish from competitors? | High |
| **Aspiration** | Does this inspire beyond current state? | Medium |
| **Extensibility** | Can the metaphor grow with the product? | Medium |
| **Defensibility** | Can we deliver on the metaphor's promises? | Required |

---

## 3. Primary Reframings (Fully Developed)

### 3.1 Frame A: Legal Deliberation Infrastructure

**Core Statement**: Mesh is infrastructure for legal-style deliberation—asynchronous, networked, multiplayer digital discourse with the procedural rigor of a courtroom and the accessibility of a public forum.

#### 3.1.1 Conceptual Mapping

| Legal Concept | Platform Feature | Function |
|---------------|------------------|----------|
| Allegations/Assertions | Claims | Formal statements that can be challenged |
| Pleadings/Motions | DialogueMoves (ASSERT, WHY, GROUNDS) | Procedural contributions to the record |
| Cross-Examination | Critical Questions | Structured challenges appropriate to argument type |
| Objections | Attack Types (REBUT, UNDERCUT, UNDERMINE) | Typed challenges to evidence or reasoning |
| Legal Standards | Schemes (60+ Walton patterns) | Established patterns for what counts as proof |
| Rules of Evidence | Evidence Linking | Standards for connecting claims to sources |
| Court Record | Commitment Stores | Official record of what each party has asserted |
| Judgment | ASPIC+ Acceptability | Determination of what arguments stand |
| Judicial Opinion | Thesis Output | Reasoned document explaining conclusions |
| Precedent | KbPages/Institutional Memory | Prior reasoning that informs future cases |
| Jurisdiction | Scopes | Boundaries of which rules apply where |
| Appeal | Dialogue Continuation | Mechanism to challenge and revise judgments |

#### 3.1.2 The Three-Layer Legal Process

| Phase | Legal Analog | Platform Layer | What Happens |
|-------|--------------|----------------|--------------|
| **Discovery** | Fact-finding | Claims & Evidence | Gather and organize assertions and sources |
| **Argumentation** | Trial proceedings | Arguments & Dialogue | Build cases, challenge opposition, respond to objections |
| **Judgment** | Verdict & opinion | Evaluation & Output | Determine acceptability, produce reasoned conclusions |

#### 3.1.3 Why This Frame Works

**Reveals**:
- Procedural nature of good reasoning
- Accountability built into every contribution
- Adversarial testing as epistemic hygiene
- The possibility of "getting it right" through process

**Obscures**:
- Collaborative, generative aspects
- Exploratory, playful reasoning
- The possibility of synthesis beyond win/lose

**Natural Audiences**: Legal professionals, policy makers, governance bodies, compliance teams, anyone who needs defensible decisions

**Pitch**: "Mesh provides legal deliberation infrastructure—the procedural framework for reaching defensible conclusions through structured adversarial reasoning. Every claim is on the record. Every argument follows established patterns. Every decision comes with a reasoned opinion."

#### 3.1.4 Extended Vocabulary

| Term | Definition | Usage |
|------|------------|-------|
| Case file | An ArgumentChain with associated evidence | "Open a new case file for the policy question" |
| Brief | A structured argument document | "Submit your brief by Friday" |
| Docket | The queue of issues awaiting resolution | "Three items remain on the docket" |
| Burden of proof | The obligation to support claims | "The burden shifts when you assert" |
| Standard of review | The level of scrutiny applied | "Apply strict scrutiny to constitutional claims" |
| Stipulation | A mutually agreed fact | "Let's stipulate that X is true and focus on Y" |

---

### 3.2 Frame B: Programming Language for Collective Thought

**Core Statement**: Mesh is a programming language for reasoning—with primitives (claims), composition rules (arguments), and execution semantics (acceptability) that compile human thought into structured, verifiable output.

#### 3.2.1 Conceptual Mapping

| Programming Concept | Platform Feature | Function |
|--------------------|------------------|----------|
| Variables | Claims | Named, addressable units of meaning |
| Functions | Arguments | Transform inputs (premises) to outputs (conclusions) |
| Types | Schemes | Classify arguments by structure and rules |
| Type checking | Critical Questions | Verify argument structure is valid |
| Compilation | ASPIC+ Evaluation | Transform reasoning into defensible output |
| Runtime errors | Attack success | Identify reasoning that fails under scrutiny |
| Libraries | Scheme collections | Pre-built reasoning patterns |
| Modules | Scopes | Encapsulated reasoning under specific assumptions |
| Version control | Dialogue history | Track all changes to the reasoning |
| Documentation | Thesis output | Human-readable explanation of the code |
| Tests | Critical Question coverage | Verify reasoning handles expected challenges |
| Debugging | Attack/Defense analysis | Identify and fix weak points |

#### 3.2.2 The Compilation Pipeline

```
Source (Discussion) → Parsing (Claim extraction) → AST (Argument structure) 
  → Type checking (Scheme validation) → Optimization (Chain composition) 
  → Code generation (Thesis output) → Execution (Real-world application)
```

#### 3.2.3 Why This Frame Works

**Reveals**:
- Compositional nature of reasoning
- Explicit structure and rules
- Verifiability of outputs
- The platform as a "compiler" not just a container

**Obscures**:
- The human, social dimension
- Rhetorical and emotional elements
- The fact that reasoning isn't purely mechanical

**Natural Audiences**: Engineers, developers, technical founders, anyone who thinks in systems

**Pitch**: "Mesh is a programming language for collective reasoning. Define your claims like variables. Build arguments like functions. Type-check with critical questions. Compile to defensible conclusions. Debug by analyzing attacks. Your reasoning becomes code that runs."

#### 3.2.4 Extended Vocabulary

| Term | Definition | Usage |
|------|------------|-------|
| Syntax | The rules for well-formed arguments | "That doesn't parse—check the syntax" |
| Compile | Transform dialogue into output | "Ready to compile this into a thesis?" |
| Runtime | The real-world context where reasoning applies | "This argument fails at runtime" |
| Refactor | Restructure reasoning without changing conclusions | "Let's refactor this chain for clarity" |
| Stack trace | The sequence of moves leading to current state | "Pull the stack trace to see how we got here" |
| Lint | Check for common reasoning errors | "Run the linter before submitting" |

---

### 3.3 Frame C: Forensic Laboratory for Ideas

**Core Statement**: Mesh is a forensic laboratory where ideas are investigated—evidence is traced, claims are tested, chains of reasoning are established, and findings are documented for the record.

#### 3.3.1 Conceptual Mapping

| Forensic Concept | Platform Feature | Function |
|------------------|------------------|----------|
| Evidence collection | Claim & Evidence creation | Gather material for investigation |
| Chain of custody | Dialogue history | Track who touched what when |
| Forensic tests | Critical Questions | Structured procedures for testing claims |
| Lab results | Attack/Defense outcomes | Findings from applying tests |
| Expert testimony | Scheme-based arguments | Specialized reasoning patterns with authority |
| Investigation report | Thesis output | Documented findings and conclusions |
| Case file | ArgumentChain | Organized collection of related evidence |
| Contamination | Fallacious reasoning | Invalid procedures that corrupt findings |
| Corroboration | Multiple evidence sources | Independent support for claims |
| Reconstruction | Chain building | Piecing together what happened |

#### 3.3.2 The Investigation Process

| Phase | Forensic Analog | Platform Activity |
|-------|-----------------|-------------------|
| **Collection** | Gather evidence | Create claims, link sources |
| **Analysis** | Apply tests | Run critical questions, identify attacks |
| **Reconstruction** | Build timeline | Compose argument chains |
| **Reporting** | Document findings | Generate thesis, KB pages |
| **Review** | Peer verification | Community challenge and response |

#### 3.3.3 Why This Frame Works

**Reveals**:
- The investigative nature of good reasoning
- Importance of evidence provenance
- Procedural rigor in testing claims
- The goal of establishing truth, not winning arguments

**Obscures**:
- Collaborative construction aspects
- The generative, creative dimension
- Cases where there's no "ground truth" to discover

**Natural Audiences**: Researchers, journalists, investigators, anyone doing fact-based inquiry

**Pitch**: "Mesh is a forensic laboratory for ideas. Every claim has a chain of custody. Every argument undergoes structured testing. Every finding is documented with full provenance. When reasoning matters, investigate—don't just discuss."

---

### 3.4 Frame D: Version Control for Belief

**Core Statement**: Mesh is Git for ideas—tracking every change to collective understanding, managing branches of assumption, handling conflicts when reasoning collides, and tagging stable releases of knowledge.

#### 3.4.1 Conceptual Mapping

| Git Concept | Platform Feature | Function |
|-------------|------------------|----------|
| Repository | Deliberation space | Container for related reasoning |
| Commit | DialogueMove | Record a change to the reasoning |
| Branch | Scope | Alternative lines of reasoning under different assumptions |
| Merge | Synthesis move | Combine compatible reasoning branches |
| Merge conflict | Attack | Incompatible changes requiring resolution |
| Pull request | NCR (Non-Canonical Remark) | Proposed contribution awaiting approval |
| Code review | Critical Questions | Evaluation before accepting |
| Tag/Release | Thesis output | Stable, versioned snapshot of understanding |
| Blame | Audit trail | See who contributed what |
| Diff | Attack/Defense comparison | See what changed between states |
| Fork | Separate deliberation | Independent development of related reasoning |
| Revert | RETRACT move | Undo previous commitments |

#### 3.4.2 The Workflow

```
main (settled understanding)
  ├── feat/hypothesis-A (scope: hypothetical)
  │     └── commits: claim1, argument1, defense1
  ├── feat/hypothesis-B (scope: alternative)
  │     └── commits: claim2, argument2
  └── merge: resolve conflicts → new main state
```

#### 3.4.3 Why This Frame Works

**Reveals**:
- The evolutionary nature of understanding
- Parallel exploration is valuable
- Conflicts are normal, resolution is structured
- History matters—you never lose past reasoning

**Obscures**:
- The real-time, dialogical dimension
- The human relationships involved
- Not all reasoning is "code" that can be versioned cleanly

**Natural Audiences**: Developers, engineers, anyone who uses Git, technical organizations

**Pitch**: "Mesh is Git for belief. Every dialogue move is a commit. Scopes are branches. Attacks are merge conflicts. When you need to track how understanding evolves, who changed what, and why—you need version control for reasoning."

---

### 3.5 Frame E: Immune System for Organizations

**Core Statement**: Mesh is an epistemic immune system—detecting reasoning pathogens, mounting typed responses, and building institutional memory that prevents reinfection.

#### 3.5.1 Conceptual Mapping

| Immune Concept | Platform Feature | Function |
|----------------|------------------|----------|
| Pathogen | Fallacious argument, unsupported claim | Threat to organizational reasoning health |
| Detection | Critical Questions, attack identification | Recognize threats |
| Antibody | Typed attack (REBUT, UNDERCUT, UNDERMINE) | Specific response to specific threat type |
| Immune response | Defense chain | Coordinated response to challenge |
| Memory cells | Commitment stores, KB pages | Remember past threats and responses |
| Vaccination | Scheme training | Build resistance before exposure |
| Inflammation | Active dispute | Healthy response that contains threat |
| Autoimmune disorder | Over-challenge, excessive attacks | System attacking its own healthy reasoning |
| Immunodeficiency | No critical question coverage | Unable to mount defense against threats |
| Herd immunity | Community-wide scheme literacy | Collective protection through distributed capability |

#### 3.5.2 The Immune Response Cycle

| Phase | Immune Analog | Platform Activity |
|-------|---------------|-------------------|
| **Detection** | Recognize pathogen | Identify weak argument via CQ |
| **Activation** | Mobilize response | Generate appropriate attack type |
| **Response** | Attack pathogen | Apply challenge, await defense |
| **Resolution** | Eliminate or contain | Accept defense or argument falls |
| **Memory** | Build immunity | Store in KB for future reference |

#### 3.5.3 Why This Frame Works

**Reveals**:
- Organizational reasoning as something that can be healthy or sick
- Proactive defense as valuable
- The importance of memory and learning
- Different threats need different responses

**Obscures**:
- Constructive, collaborative reasoning
- The idea that disagreement can be generative, not just defensive
- Human agency—people aren't antibodies

**Natural Audiences**: Organizational leaders, risk managers, operations teams, anyone concerned with institutional health

**Pitch**: "Mesh is an immune system for your organization's reasoning. Detect weak arguments before they spread. Mount typed responses to specific threats. Build institutional memory that prevents reinfection. Keep your collective thinking healthy."

---

### 3.6 Frame F: Digital Public Infrastructure

**Core Statement**: Mesh is public infrastructure for collective reasoning—a civic utility that gives communities the tools to engage deeply with each other and the questions that shape their world, producing durable public goods from shared inquiry.

#### 3.6.1 The Public Infrastructure Vision

Just as societies built libraries, universities, and public squares to enable collective intellectual life, the digital age requires new infrastructure for collective reasoning. Mesh provides this infrastructure—not as a product to be consumed, but as a utility to be used, a commons to be cultivated, and a public good that grows more valuable with participation.

**Core Premise**: Democratic societies flourish when citizens can reason together effectively. This requires infrastructure—not just platforms, but genuine public utilities designed to foster understanding, surface disagreement productively, and transform distributed intelligence into actionable wisdom.

#### 3.6.2 Conceptual Mapping

| Public Infrastructure Concept | Platform Feature | Function |
|------------------------------|------------------|----------|
| Commons | Deliberation spaces | Shared resources for collective use |
| Public record | Commitment stores | Transparent history of public reasoning |
| Civic participation | Dialogue moves | Contributing to shared understanding |
| Due process | Dialogue protocols | Fair procedures for all participants |
| Public goods | Thesis, KB pages | Artifacts that benefit everyone |
| Town hall | Open deliberations | Spaces where communities gather to reason |
| Public library | Knowledge base | Accumulated wisdom accessible to all |
| Civic education | Scheme literacy | Building capacity for participation |
| Zoning/Structure | Scopes | Organizing different kinds of discourse |
| Public comment | NCR system | Community input on matters of concern |

#### 3.6.3 The Public Value Proposition

| Value | How Mesh Delivers |
|-------|-------------------|
| **Cultivated Engagement** | Structure that channels participation into productive forms |
| **Accumulated Wisdom** | Deliberations produce artifacts that persist and compound |
| **Transparent Process** | Every contribution is visible; no hidden algorithms |
| **Inclusive Participation** | Progressive formalization welcomes all levels of engagement |
| **Shared Understanding** | Even disagreement maps create common ground |
| **Democratic Legitimacy** | Decisions that emerge from visible, challengeable reasoning |
| **Intergenerational Transfer** | Knowledge bases that serve future communities |

#### 3.6.4 The Social Platform Reimagined

Mesh represents a fundamentally different vision of what digital social platforms can be:

| Dimension | Traditional Platform Logic | Public Infrastructure Logic |
|-----------|---------------------------|----------------------------|
| **Purpose** | Maximize engagement | Foster understanding |
| **Value Creation** | Extract attention | Generate public goods |
| **Participant Role** | User/consumer | Citizen/contributor |
| **Success Metric** | Time on platform | Quality of outcomes |
| **Content Lifecycle** | Ephemeral feed | Durable knowledge |
| **Relationship to Truth** | Neutral container | Active cultivation |
| **Community Model** | Audience aggregation | Civic participation |
| **Economic Logic** | Attention monetization | Public utility |

#### 3.6.5 Design Principles for Public Benefit

| Principle | Implementation | Public Benefit |
|-----------|----------------|----------------|
| **Depth by Design** | Progressive formalization | Conversations that go somewhere |
| **Structured Plurality** | Attack/defense mechanics | Disagreement that clarifies rather than divides |
| **Visible Reasoning** | Explicit argument structure | Understanding *why* positions are held |
| **Cumulative Knowledge** | Persistent artifacts | Each deliberation builds on prior work |
| **Procedural Fairness** | Dialogue protocols | Every voice can be heard on equal terms |
| **Intellectual Hospitality** | Scheme scaffolding | Tools that help people reason well |
| **Resolution Orientation** | Acceptability semantics | Conversations can actually conclude |

#### 3.6.6 The Flourishing Community

What does a community look like when it has genuine reasoning infrastructure?

**Capacities Developed**:
- Citizens who can articulate positions with precision
- Disagreements that illuminate rather than divide
- Collective memory that prevents rehashing settled questions
- Shared vocabulary for different kinds of claims and challenges
- Visible reasoning that builds trust even across difference
- Accumulated wisdom that compounds over generations

**Outcomes Enabled**:
- Policy decisions grounded in transparent reasoning
- Community agreements with documented justification
- Institutional knowledge that persists across leadership transitions
- Public understanding of complex issues
- Democratic legitimacy through visible process

#### 3.6.7 Why This Frame Works

**Reveals**:
- Mesh as a positive contribution to public life
- The platform as infrastructure, not just a product
- Citizens as active participants, not passive users
- The possibility of digital spaces that genuinely benefit communities
- Deep engagement as the natural result of good design

**Obscures**:
- Enterprise/commercial applications
- Individual productivity use cases
- The technical sophistication underneath
- Competitive positioning against other tools

**Natural Audiences**: Civic leaders, public interest technologists, community organizers, democratic reformers, public intellectuals, foundation program officers, policy makers, anyone who believes in the possibility of healthy digital public life

**Pitch**: "Mesh is public infrastructure for collective reasoning—the digital equivalent of libraries, town halls, and public squares. It gives communities the tools to engage deeply with each other and the questions that matter, producing shared knowledge that benefits everyone. This is what social platforms should have been all along."

#### 3.6.8 Extended Vocabulary

| Term | Definition | Usage |
|------|------------|-------|
| Commons | A shared deliberation space serving a community | "The climate policy commons is accepting new participants" |
| Public record | The accumulated dialogue history | "That position is in the public record" |
| Civic contribution | A substantive dialogue move | "Thank you for your civic contribution" |
| Community wisdom | Synthesized understanding from deliberation | "The community wisdom on this issue has evolved" |
| Public reasoning | Deliberation that serves collective understanding | "Let's continue the public reasoning on this" |
| Shared inquiry | Collaborative investigation of a question | "This shared inquiry has produced real insight" |

#### 3.6.9 Historical Lineage

Mesh stands in a tradition of public infrastructure for collective intelligence:

| Era | Infrastructure | Function | Mesh Analog |
|-----|---------------|----------|-------------|
| Ancient | Agora, Forum | Public assembly and debate | Deliberation spaces |
| Medieval | Universities | Preserved and advanced knowledge | Knowledge base |
| Enlightenment | Salons, Coffeehouses | Reasoned discourse across difference | Structured dialogue |
| 19th Century | Public libraries | Democratic access to knowledge | Open deliberations |
| 20th Century | Public media | Shared information infrastructure | Transparent process |
| 21st Century | **Mesh** | Reasoning infrastructure | All of the above, integrated |

**The Promise**: Every era has built infrastructure for its particular form of collective reasoning. Mesh is the infrastructure appropriate to networked, asynchronous, distributed communities who need to reason together across time and space.

---

### 3.7 Frame G: Proof Assistant for Arguments

**Core Statement**: Mesh is a proof assistant for real-world reasoning—like Coq or Lean for mathematics, but for claims about the world, with formal verification of argument soundness.

#### 3.7.1 Conceptual Mapping

| Proof Assistant Concept | Platform Feature | Function |
|------------------------|------------------|----------|
| Theorem | Claim | Statement to be proven |
| Proof | Argument chain | Demonstration that claim holds |
| Axiom | Accepted evidence | Starting points that don't need proof |
| Proof obligation | Critical Question | What must be discharged |
| Tactic | Scheme application | Method for extending proof |
| Proof checker | ASPIC+ evaluation | Verification of soundness |
| Proof state | Commitment store | Current proof obligations and achievements |
| Lemma | Supporting argument | Intermediate result used in larger proof |
| QED | Grounded extension | Proof complete, theorem holds |
| Proof error | Successful attack | Proof doesn't go through |
| Interactive mode | Dialogue | Step-by-step proof construction |

#### 3.7.2 Why This Frame Works

**Reveals**:
- Reasoning as something that can be checked
- The goal of soundness, not just persuasion
- Explicit structure that can be verified
- Proofs as durable artifacts

**Obscures**:
- Real-world arguments aren't as clean as mathematical proofs
- Defeasibility—proofs can be undone by new information
- The social, rhetorical dimensions

**Natural Audiences**: Mathematicians, formal methods people, computer scientists, rigorous thinkers

**Pitch**: "Mesh is a proof assistant for real-world arguments. State your theorem. Build your proof with established tactics. Check for soundness. When your argument reaches QED, it's not just persuasive—it's verified."

---

### 3.8 Frame H: Constitutional Writing System

**Core Statement**: Mesh is a system for writing constitutions—not just national ones, but any binding agreement that needs to be justified, debated, ratified, and amendable.

#### 3.8.1 Conceptual Mapping

| Constitutional Concept | Platform Feature | Function |
|-----------------------|------------------|----------|
| Articles | Claims | Formal statements of principle |
| Rationale | Arguments | Justification for articles |
| Debate | Dialogue | Discussion of proposed provisions |
| Amendment | RETRACT + new ASSERT | Process for changing commitments |
| Ratification | Collective commitment | Agreement to be bound |
| Signatories | Commitment store | Who has agreed to what |
| Preamble | Thesis introduction | Framing and purpose |
| Judicial review | Attack mechanism | Challenging provisions as inconsistent |
| Sunset clause | Scoped commitment | Time-bounded provisions |
| Constitutional convention | Deliberation | Process for creating founding document |

#### 3.8.2 Why This Frame Works

**Reveals**:
- The binding nature of well-formed agreements
- The need for amendment mechanisms
- Legitimacy through process
- Documents as living, challengeable things

**Obscures**:
- Exploratory reasoning that doesn't aim for binding agreement
- The informal, generative phases
- Not all deliberation aims at formal commitment

**Natural Audiences**: Governance bodies, organizational founders, community leaders, anyone creating binding agreements

**Pitch**: "Mesh is a constitutional writing system. Every principle you articulate becomes an article. Every justification is on the record. Every participant's agreement is tracked. When you need a binding document that can be defended, challenged, and amended—this is how you write it."

---

### 3.9 Frame I: Collective Exocortex

**Core Statement**: Mesh is an external brain for groups—extending collective memory, enabling distributed reasoning, and making group cognition visible.

#### 3.9.1 Conceptual Mapping

| Cognitive Concept | Platform Feature | Function |
|-------------------|------------------|----------|
| Memory | Commitment stores, KB | What the group knows |
| Reasoning | Argument chains | How the group thinks |
| Attention | Active deliberation | What the group is focused on |
| Learning | Resolved disputes | How the group updates beliefs |
| Forgetting | Archive | What the group deprioritizes |
| Working memory | Current dialogue | Active cognitive workspace |
| Long-term memory | Thesis, KB pages | Persistent knowledge |
| Metacognition | Audit trail | Thinking about thinking |
| Cognitive load | Formalization level | How much structure to hold |
| Expertise | Scheme mastery | Specialized cognitive capabilities |

#### 3.9.2 Why This Frame Works

**Reveals**:
- Groups as cognitive systems
- The platform as prosthetic, not replacement
- Collective intelligence as achievable
- The "group mind" made visible

**Obscures**:
- Individual contributions and accountability
- The political dimensions of group decisions
- That groups aren't actually minds

**Natural Audiences**: Cognitive scientists, organizational theorists, futurists, systems thinkers

**Pitch**: "Mesh is a collective exocortex—an external brain for groups. Individuals remember, reason, and revise. Groups historically haven't. Mesh gives collectives the cognitive capabilities individuals take for granted."

---

### 3.10 Frame J: Scoring System for Ideas

**Core Statement**: Mesh is a scoring system for arguments—objectively rating ideas by how well they survive challenge, how much evidence supports them, and how many critical questions they've answered.

#### 3.10.1 Conceptual Mapping

| Scoring Concept | Platform Feature | Function |
|-----------------|------------------|----------|
| Score | Acceptability status | Overall rating |
| Points for | Successful defenses | Evidence of strength |
| Points against | Successful attacks | Evidence of weakness |
| Bonus points | Answered CQs | Proactive robustness |
| Penalties | Unanswered CQs | Known gaps |
| Leaderboard | Argument ranking | Comparative strength |
| Season | Deliberation period | Time-bounded competition |
| Rules | Dialogue protocol | What moves are legal |
| Referee | System evaluation | Objective scoring |
| Championship | Grounded extension | Arguments that win it all |

#### 3.10.2 Why This Frame Works

**Reveals**:
- The competitive dimension of reasoning
- Objective evaluation as possible
- Meritocracy for ideas
- The "winner" is the best argument, not the loudest person

**Obscures**:
- Collaborative, non-competitive reasoning
- The subjective elements of evaluation
- May feel gamified in inappropriate contexts

**Natural Audiences**: Competitive types, market-oriented thinkers, sports fans, gamers

**Pitch**: "Mesh is a scoring system for ideas. Every argument earns points for evidence, structure, and surviving challenge. Lose points for unanswered questions and successful attacks. The best argument wins—objectively scored, no politics required."

---

## 4. Secondary Reframings (Sketch Level)

These frames have potential but aren't fully developed. Each could be expanded to primary status.

### 4.1 Archaeological Dig Site

**Core Metaphor**: Ideas are artifacts; deliberation is excavation

| Concept | Mapping |
|---------|---------|
| Strata | Layers of historical reasoning |
| Artifacts | Individual claims |
| Dig site | Deliberation space |
| Excavation | Careful reasoning extraction |
| Catalog | Claim registry |
| Restoration | Argument reconstruction |
| Museum | Knowledge base |

**One-liner**: "Mesh is archaeology for ideas—carefully excavating, cataloging, and preserving the reasoning structures buried in your organization's history."

---

### 4.2 Cartographic Expedition

**Core Metaphor**: Belief is territory; deliberation is mapping

| Concept | Mapping |
|---------|---------|
| Territory | The space of possible beliefs |
| Map | Argument structure |
| Surveying | Claim verification |
| Landmarks | Key claims |
| Routes | Argument chains |
| Terra incognita | Unexplored positions |
| Expedition | Deliberation process |

**One-liner**: "Mesh is cartography for belief—surveying the territory of possible positions, mapping the routes between claims, and charting the unknown."

---

### 4.3 Judicial Cookbook

**Core Metaphor**: Arguments are recipes; schemes are cooking techniques

| Concept | Mapping |
|---------|---------|
| Ingredients | Claims and evidence |
| Recipe | Argument structure |
| Technique | Scheme application |
| Mise en place | Evidence gathering |
| Plating | Thesis formatting |
| Kitchen | Deliberation space |
| Taste test | Critical questions |

**One-liner**: "Mesh is a cookbook for reasoning—established recipes for argument, proven techniques for every type of claim, and taste tests to ensure quality."

---

### 4.4 Therapeutic Process

**Core Metaphor**: Disagreement is processed, not fought

| Concept | Mapping |
|---------|---------|
| Session | Deliberation |
| Processing | Attack/defense exchange |
| Working through | Resolution |
| Insight | Resolved dispute |
| Resistance | Commitment rigidity |
| Healing | Synthesis |
| Therapeutic alliance | Collaborative framing |

**One-liner**: "Mesh is group therapy for disagreement—processing conflict, working through differences, and achieving resolution rather than victory."

---

### 4.5 Scientific Laboratory

**Core Metaphor**: Claims are hypotheses; deliberation is experimentation

| Concept | Mapping |
|---------|---------|
| Hypothesis | Claim |
| Experiment | Critical question application |
| Results | Attack/defense outcome |
| Peer review | Community challenge |
| Publication | Thesis output |
| Reproducibility | Audit trail |
| Lab notebook | Dialogue history |

**One-liner**: "Mesh is a laboratory for hypotheses about the world—formulate claims, design tests, run experiments, publish findings."

---

### 4.6 Newsroom

**Core Metaphor**: Claims need verification; arguments need fact-checking

| Concept | Mapping |
|---------|---------|
| Reporter | Claim maker |
| Editor | Challenge mechanism |
| Fact-check | Evidence verification |
| Source | Linked evidence |
| Story | Argument chain |
| Masthead | Commitment store |
| Publication | Thesis output |

**One-liner**: "Mesh is a newsroom for ideas—every claim gets fact-checked, every source gets verified, and only what survives editorial scrutiny gets published."

---

## 5. Hybrid Framings

Combinations that may be more powerful than either parent frame alone.

### 5.1 Legal-Forensic Laboratory

**Parent Frames**: Court System + Forensic Lab

**Synthesis**: A court where every piece of evidence has chain of custody, every expert's method is documented, and the judgment is only as strong as the forensic work.

**Pitch**: "Mesh combines judicial process with forensic rigor. Not just a trial—an investigation. Not just a verdict—a documented finding."

**Best For**: High-stakes policy decisions, regulatory proceedings, investigative governance

---

### 5.2 Constitutional Version Control

**Parent Frames**: Constitution Writing + Git

**Synthesis**: Binding documents that can be branched, diffed, merged, and versioned—with full history of every amendment.

**Pitch**: "Write binding agreements with version control. See exactly what changed, when, and why. Fork constitutions for different contexts. Merge improvements back."

**Best For**: Governance frameworks, organizational charters, community constitutions

---

### 5.3 Civic Proof Infrastructure

**Parent Frames**: Proof Assistant + Digital Public Infrastructure

**Synthesis**: Public reasoning infrastructure with formal verification—community deliberations that produce not just conclusions but certified arguments.

**Pitch**: "Public infrastructure for verified reasoning. Communities deliberate; arguments get checked; what survives becomes community knowledge."

**Best For**: Public policy deliberation, community standards development, civic knowledge bases

---

### 5.4 Immune Exocortex

**Parent Frames**: Immune System + Collective Exocortex

**Synthesis**: A group brain with built-in defenses against bad reasoning—cognitive immunity at scale.

**Pitch**: "A collective mind that protects itself. Remembers past reasoning, detects threats, and maintains epistemic health over time."

**Best For**: Long-lived organizations, institutions focused on knowledge integrity

---

### 5.5 Competitive Forensics

**Parent Frames**: Scoring System + Forensic Lab

**Synthesis**: Investigation as competition—best evidence wins, best method scores highest.

**Pitch**: "Compete on investigative rigor. The team with the best evidence, the cleanest methods, and the most robust findings wins."

**Best For**: Debate contexts, competitive research, adversarial analysis

---

### 5.6 Civic Knowledge Commons

**Parent Frames**: Digital Public Infrastructure + Collective Exocortex

**Synthesis**: A shared cognitive resource for communities—public memory, public reasoning, public wisdom that grows through participation.

**Pitch**: "A knowledge commons that thinks. Communities contribute, the commons remembers, and collective wisdom accumulates across generations."

**Best For**: Community governance, civic organizations, democratic institutions, public interest groups

---

### 5.7 Democratic Deliberation Platform

**Parent Frames**: Digital Public Infrastructure + Constitutional Writing

**Synthesis**: Infrastructure for democratic communities to reason their way to legitimate decisions—constitutional thinking for everyday governance.

**Pitch**: "Democratic infrastructure for the digital age. Communities deliberate, justify, ratify, and amend—with full transparency at every step."

**Best For**: Participatory governance, community decision-making, democratic reform initiatives

---

## 6. Cross-Cutting Themes

Regardless of which frame is chosen, these themes emerge across all of them:

### 6.1 Addressability

**Definition**: Everything has a stable identifier and can be pointed to.

**Manifestations Across Frames**:
- Legal: Case numbers, docket entries
- Programming: Variable names, URIs
- Git: Commit hashes, branch names
- Forensic: Evidence tags, chain-of-custody IDs
- Public Infrastructure: Public records, civic archives

**Why It Matters**: Without addressability, you can't reference, cite, link, or build.

---

### 6.2 Composability

**Definition**: Small pieces combine into larger structures through explicit rules.

**Manifestations Across Frames**:
- Legal: Precedent composing into legal doctrine
- Programming: Functions composing into programs
- Forensic: Evidence composing into reconstruction
- Constitutional: Articles composing into documents

**Why It Matters**: Composability is how simple primitives produce complex outcomes.

---

### 6.3 Traceability

**Definition**: Every state connects to the actions that produced it.

**Manifestations Across Frames**:
- Legal: Chain of custody, audit trail
- Programming: Stack trace, git blame
- Forensic: Evidence provenance
- Git: Commit history

**Why It Matters**: Traceability is accountability—knowing not just what, but who and why.

---

### 6.4 Adversariality

**Definition**: Challenge is built in, not bolted on.

**Manifestations Across Frames**:
- Legal: Cross-examination, objections
- Immune: Antibody response to pathogen
- Scoring: Points against for failed defense
- Proof: Proof obligations that must be discharged

**Why It Matters**: Ideas that survive challenge are stronger than ideas that were never challenged.

---

### 6.5 Durability

**Definition**: Structures persist beyond the conversation.

**Manifestations Across Frames**:
- Legal: Precedent, judicial opinions
- Programming: Code that runs after writing
- Constitution: Documents that bind future action
- Memory: Knowledge that outlasts the knowers
- Public Infrastructure: Community knowledge that serves future generations

**Why It Matters**: Durability is how value accumulates over time.

---

### 6.6 Explicitness

**Definition**: Structure is visible, not implicit.

**Manifestations Across Frames**:
- Legal: Written law, recorded proceedings
- Programming: Declared types, explicit functions
- Proof: Every step documented
- Public Infrastructure: Transparent processes, visible reasoning

**Why It Matters**: Explicitness enables verification, teaching, and improvement.

---

### 6.7 Generativity

**Definition**: The platform produces public goods that benefit participants and non-participants alike.

**Manifestations Across Frames**:
- Legal: Precedent that guides future cases
- Constitution: Frameworks that enable future governance
- Public Infrastructure: Knowledge commons that serve the community
- Exocortex: Collective wisdom accessible to all

**Why It Matters**: Generativity transforms platform activity into lasting public value. Unlike extractive systems that capture value for the platform, generative systems create value that flows outward to the community.

---

### 6.8 Civic Capacity Building

**Definition**: Participation itself develops skills and habits that strengthen democratic life.

**Manifestations Across Frames**:
- Legal: Developing the capacity to make and evaluate arguments
- Public Infrastructure: Building civic competence through practice
- Constitution: Learning to negotiate and commit to shared principles
- Exocortex: Developing collective intelligence capabilities

**Why It Matters**: Beyond any individual deliberation, the platform cultivates the capacities communities need to govern themselves well. Users become better reasoners, better listeners, and better citizens.

---

## 7. Frame Selection Matrix

### 7.1 Audience → Frame Mapping

| Audience | Primary Frame | Secondary Frame | Avoid |
|----------|---------------|-----------------|-------|
| **Legal/Policy** | Legal Deliberation | Constitutional Writing | Scoring System (feels gamified) |
| **Developers** | Programming Language | Version Control | Therapeutic (feels soft) |
| **Researchers** | Forensic Lab | Proof Assistant | Scoring System (feels reductive) |
| **Executives** | Legal Deliberation | Immune System | Programming Language (too technical) |
| **Community Organizers** | Digital Public Infrastructure | Exocortex | Legal (feels formal) |
| **Civic Technologists** | Digital Public Infrastructure | Constitutional | Scoring System (feels trivial) |
| **Public Interest Funders** | Digital Public Infrastructure | Civic Commons (Hybrid) | Programming Language (too technical) |
| **Governance Bodies** | Constitutional | Legal | Scoring System |
| **Journalists** | Forensic Lab | Newsroom | Programming |
| **Educators** | Scoring System | Proof Assistant | Constitution (scope mismatch) |
| **Democratic Reformers** | Democratic Deliberation (Hybrid) | Public Infrastructure | Immune System (feels defensive) |

### 7.2 Context → Frame Mapping

| Context | Primary Frame | Why |
|---------|---------------|-----|
| **High-stakes decision** | Legal Deliberation | Accountability and rigor are paramount |
| **Founding document** | Constitutional | Explicitly about binding agreement |
| **Fact-finding** | Forensic Lab | Investigation focus is clear |
| **Technical architecture** | Programming Language | Audience speaks this language |
| **Organizational change** | Immune System | Health/disease resonates for change |
| **Civic/community context** | Digital Public Infrastructure | Emphasizes public benefit and shared value |
| **Democratic participation** | Democratic Deliberation (Hybrid) | Legitimacy through inclusive process |
| **Community knowledge building** | Civic Knowledge Commons (Hybrid) | Shared wisdom that compounds |
| **Public interest mission** | Digital Public Infrastructure | Aligns with values-driven organizations |
| **Competitive environment** | Scoring System | Competition is valued |
| **Long-term knowledge building** | Exocortex | Persistence and memory are central |

### 7.3 Objection → Frame Response

| Objection | Best Counter-Frame | Why |
|-----------|-------------------|-----|
| "Just another chat tool" | Programming Language | Emphasizes structure, not chat |
| "Too academic" | Digital Public Infrastructure | Emphasizes practical public benefit |
| "Just for elites" | Digital Public Infrastructure | Emphasizes accessibility and civic inclusion |
| "Can't handle disagreement" | Immune System | Disagreement is a feature |
| "Not defensible enough" | Legal Deliberation | Explicitly about defensibility |
| "Will never be adopted" | Version Control | Familiar to technical audiences |
| "Too slow" | Proof Assistant | Slowness is verification |
| "No business model" | Digital Public Infrastructure | Public utility, not attention extraction |
| "Like social media?" | Digital Public Infrastructure | Infrastructure for public benefit, not engagement farming |

---

## 8. Provocative Questions & Edge Cases

### 8.1 Questions That Shift Perspective

1. **What if the graph is the product, not the documents?**
   - Thesis output is just one rendering of the real asset: the reasoning graph
   - Implications: The graph should be the primary export, not a side effect

2. **What if the platform is primarily about *memory*?**
   - Not for making decisions but for preserving how decisions were made
   - Implications: Position as institutional historian, not facilitator

3. **What if disagreement structure is more valuable than agreement?**
   - Mapping where we disagree is harder and rarer than agreeing
   - Implications: Successful deliberation = clear disagreement map, not consensus

4. **What if the platform is fundamentally about *civic capacity*?**
   - Not just resolving specific questions but building the muscles for collective reasoning
   - Implications: Success measured by citizen competence, not just decision quality

5. **What if the primary output is *community formation*?**
   - Deliberation as the process by which strangers become a public
   - Implications: The shared inquiry itself creates bonds and shared identity

4. **What if users are co-authoring a formal system?**
   - Each deliberation creates a local formal language for that topic
   - Claims become vocabulary; arguments become grammar
   - Implications: Emphasize language-building, not just language-using

5. **What if Mesh is infrastructure for human-AI collaboration?**
   - AI generates candidates; humans evaluate
   - AI suggests attacks; humans judge validity
   - Implications: Position as the interface between human judgment and AI capability

6. **What if the primary audience is future selves?**
   - Every deliberation is a message to the same group in 6 months
   - Implications: Emphasize self-documentation, future-proofing

7. **What if scopes are parallel universes?**
   - Not just organizing but enabling multiverse exploration of assumptions
   - Implications: Scopes become a powerful feature, not just a categorization

8. **What if acceptability is the wrong success metric?**
   - What if "interesting failure" is as valuable as success?
   - Implications: Celebrate productive dead-ends, not just accepted arguments

### 8.2 Edge Cases for Frames

| Edge Case | Frame Challenge | Resolution |
|-----------|-----------------|------------|
| **Purely exploratory reasoning** | Legal frame expects judgment | Use Scope as "exploratory" mode; no verdict required |
| **One-person deliberation** | Dialogue implies multiple people | "Dialogue with future self" or "adversarial self-challenge" |
| **No ground truth** | Forensic frame expects facts | "Normative forensics"—investigating values, not just facts |
| **Rapid iteration** | Slow media implies slowness | "Slow principles, fast tools"—rigor can be efficient |
| **Playful reasoning** | All frames are serious | Gaming frame or "sandbox mode" for experimentation |

---

## 9. System Synergies

### 9.1 Non-Obvious Feature Combinations

| Combination | Synergy | Unlocked Capability |
|-------------|---------|---------------------|
| **Scopes × Commitments** | Conditional agreements | "Under assumption X, we commit to Y"—treaties with conditions |
| **Critical Questions × Issues** | Structured due diligence | Every scheme generates its own audit checklist |
| **Chains × Dialogue Moves** | Choreographed debate | Argument chains as scripts defining required moves |
| **Attack Types × Analytics** | Vulnerability assessment | "Your arguments are frequently undercut—strengthen evidence" |
| **ASPIC+ × Thesis Output** | Verified documents | "This document's central claim is in the grounded extension" |
| **Ludics × Propositions** | Game-theoretic voting | "Warning: this vote commits you to positions you've attacked" |
| **Schemes × NCR** | Community scheme extension | Communities can propose new recognized patterns |
| **Evidence × Chains** | Evidence-chain alignment | See which evidence supports which parts of which chains |

### 9.2 Underexplored Synergies

| Systems | Potential Synergy | Status |
|---------|-------------------|--------|
| **Scopes × Attack Types** | Scope-relative attacks (attacks that only work within certain assumptions) | Unexplored |
| **Commitment × Time** | Commitment decay (old commitments lose weight) | Unexplored |
| **Schemes × Dialogue Phase** | Phase-appropriate schemes (some only valid in closing) | Unexplored |
| **Evidence × Evidence** | Evidence conflict detection (sources that contradict) | Unexplored |
| **Multiple Deliberations** | Cross-deliberation citation (arguments from one used in another) | Partially explored |

---

## 10. Accidental Use Cases

Uses that emerge from the system even if not designed for.

### 10.1 High-Confidence Use Cases

| Use Case | How It Works | Frame Fit |
|----------|--------------|-----------|
| **Philosophical Inquiry** | Use schemes and CQs as method for philosophy | Proof Assistant |
| **Scientific Peer Review** | Reviews as attacks, responses as defenses | Forensic Lab |
| **Treaty Negotiation** | Map positions, find zones of agreement | Constitutional |
| **Classroom Debate Training** | Students practice structured argumentation | Scoring System |
| **Legal Brief Drafting** | Compose briefs from pre-structured argument pools | Legal |
| **Policy Analysis** | Map stakeholder claims and evaluate argument strength | Legal + Forensic |

### 10.2 Speculative Use Cases

| Use Case | How It Might Work | Frame Fit |
|----------|-------------------|-----------|
| **AI Alignment Research** | Map alignment arguments, track open problems | Proof Assistant |
| **Jury Deliberation Support** | Track juror commitments, identify contested facts | Legal |
| **Investigative Journalism** | Map claims, sources, evidence chains for complex stories | Forensic |
| **Therapy Group Facilitation** | Process disagreement structurally | Therapeutic |
| **Strategic Planning** | Map assumptions, test strategies against challenges | Immune System |
| **Crisis Response Coordination** | Track rapidly evolving claims and evidence | Newsroom |

### 10.3 Anti-Use Cases (What Mesh Is Not For)

| Not For | Why | Better Tool |
|---------|-----|-------------|
| **Casual chat** | Overhead too high | Slack, Discord |
| **Quick polls** | Structure is overkill | Google Forms, Loomio |
| **Creative brainstorming** | Structure inhibits divergence | Miro, Figma |
| **Real-time collaboration** | Turn-taking isn't the goal | Google Docs |
| **Simple Q&A** | No argumentation needed | FAQ, Stack Overflow |

---

## 11. Testing & Validation Protocol

### 11.1 Frame Testing Methodology

| Test Type | Method | Success Criteria |
|-----------|--------|------------------|
| **Immediate Resonance** | One-liner reaction | "Oh, I get it" within 5 seconds |
| **Depth Test** | Extended metaphor exploration | Metaphor holds at detail level |
| **Objection Handling** | Present frame, collect pushback | Objections are addressable within frame |
| **Comparison Preference** | A/B test frames | Clear preference pattern by audience |
| **Action Trigger** | Does frame inspire next step? | Users know what to do after hearing |

### 11.2 Testing Questions

For each frame, ask test audiences:

1. "In one sentence, what does this platform do?" (Comprehension)
2. "Who would use this?" (Audience clarity)
3. "What wouldn't this be good for?" (Scope clarity)
4. "What does this remind you of?" (Mental model)
5. "Would you recommend this to someone? Who?" (Virality)
6. "What question does this raise for you?" (Engagement)

### 11.3 Feedback Log Template

| Date | Audience | Frame Tested | Reaction | Quote | Action |
|------|----------|--------------|----------|-------|--------|
| | | | | | |

---

## 12. Implementation Guidance

### 12.1 Frame Selection Process

```
1. Identify audience
2. Consult Audience → Frame Mapping (§7.1)
3. Identify context
4. Consult Context → Frame Mapping (§7.2)
5. Check for objection likelihood
6. Consult Objection → Frame Response (§7.3)
7. Select primary frame
8. Select secondary frame for depth
9. Test with representative audience
10. Iterate based on feedback
```

### 12.2 Multi-Frame Strategy

**Principle**: Different materials can use different frames.

| Material | Recommended Frame | Rationale |
|----------|-------------------|-----------|
| **Homepage** | Legal + Public Infrastructure | Credibility + public benefit |
| **Technical docs** | Programming Language | Audience match |
| **Pitch deck (enterprise)** | Legal + Immune | Stakes + organizational value |
| **Pitch deck (civic)** | Public Infrastructure + Constitutional | Public benefit + governance value |
| **Academic paper** | Proof Assistant + Forensic | Rigor signaling |
| **Community page** | Public Infrastructure + Exocortex | Civic benefit + collective intelligence |
| **Foundation/grant proposal** | Public Infrastructure + Democratic Deliberation | Public interest alignment |
| **Investor memo** | Legal + Scoring | Defensibility + metrics |
| **Civic tech audience** | Public Infrastructure | Mission alignment |
| **Policy audience** | Legal + Public Infrastructure | Accountability + public value |

### 12.3 Frame-Specific Vocabulary Guides

Each frame comes with vocabulary. Use consistently:

**Legal Frame**: Case, brief, docket, judgment, objection, precedent, burden, standard
**Programming Frame**: Compile, debug, refactor, lint, syntax, type, module, execute
**Forensic Frame**: Evidence, investigation, chain of custody, findings, contamination
**Git Frame**: Commit, branch, merge, conflict, fork, revert, blame, diff
**Immune Frame**: Pathogen, antibody, response, memory, infection, health, immunity
**Public Infrastructure Frame**: Commons, civic, public record, community wisdom, shared inquiry, contribution

### 12.4 Transition Phrases

When switching frames in a single document:

- "Another way to see this..."
- "From a [X] perspective..."
- "If we think of it as [X]..."
- "The [X] lens reveals..."
- "What the [X] frame makes visible is..."

---

## Appendix A: One-Liner Collection

### A.1 By Frame

| Frame | One-Liner |
|-------|-----------|
| **Legal** | "A court system for ideas—where claims go on record and arguments get judged." |
| **Programming** | "A programming language for thought—define, compose, compile, verify." |
| **Forensic** | "A laboratory for investigating claims—trace evidence, test arguments, document findings." |
| **Git** | "Version control for belief—commit, branch, merge, never lose the history." |
| **Immune** | "An immune system for reasoning—detect threats, mount responses, build memory." |
| **Public Infrastructure** | "Digital public infrastructure—where communities reason together and build shared knowledge." |
| **Proof** | "A proof assistant for arguments—not just persuasion, verification." |
| **Constitution** | "A system for writing binding agreements—justified, debatable, ratifiable." |
| **Exocortex** | "An external brain for groups—collective memory, reasoning, revision." |
| **Scoring** | "A scoring system for ideas—best argument wins, objectively measured." |

### A.2 Combined One-Liners

- "Legal infrastructure for the digital age—structured argument, visible reasoning, defensible conclusions."
- "Where discussions become verified documents."
- "Reasoning that survives challenge."
- "The deliberation platform that produces artifacts, not just logs."
- "Infrastructure for decisions that need to be defended."
- "Public infrastructure for the reasoning commons—where communities cultivate shared understanding."
- "The town hall, library, and public square, unified for the digital age."

---

## Appendix B: Workshop Exercises

### B.1 Frame Exploration Exercise

**Time**: 30 minutes per frame

1. Read the frame section completely
2. Write 5 user stories using frame vocabulary
3. Identify 3 features the frame makes essential
4. Identify 2 features the frame makes invisible
5. Write a 50-word pitch using only frame terms
6. Present to team, collect reactions

### B.2 Comparative Frame Exercise

**Time**: 1 hour

1. Select 3 frames
2. For each, describe the same feature (e.g., Critical Questions)
3. Note how frame changes what's emphasized
4. Rank frames by audience appropriateness
5. Select winner for specific context

### B.3 Hybrid Frame Generation

**Time**: 45 minutes

1. Select 2 parent frames
2. Identify what each reveals and hides
3. Find synthesis that reveals both
4. Name the hybrid
5. Write one-liner
6. Test for coherence

---

## Appendix C: Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Dec 2024 | Full development of Section 10 into standalone document |

---

*This document provides the conceptual infrastructure for positioning the Mesh/Agora platform. Frames are tools—choose based on audience and context, iterate based on feedback, and remember: the platform is all of these things simultaneously.*
