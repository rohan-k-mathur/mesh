# Sellars Deep Study: Theoretical Foundations for Mesh

**Purpose:** Working notes integrating Wilfrid Sellars's philosophical framework with the Mesh platform's argumentation and deliberation systems.

**Primary Sources:**
- *In the Space of Reasons: Selected Essays of Wilfrid Sellars* (Scharp & Brandom, eds., 2007)
- Additional articles in `/Wilfrid Sellars/` folder

**Document Status:** Comprehensive synthesis ready for application development

---

## Table of Contents

1. [Overview: Why Sellars for Mesh?](#overview-why-sellars-for-mesh)
2. [The Cumulative Argument: Essays 1-17 as One Arc](#the-cumulative-argument)
3. [Part I: Language and Meaning — Core Framework](#part-i-language-and-meaning)
4. [Part II: Abstract Entities — The Nominalist Strategy](#part-ii-abstract-entities)
5. [Part III: Mind, Language, and the World](#part-iii-mind-language-and-the-world)
6. [Part IV: Science and the Mind](#part-iv-science-and-the-mind)
7. [Part V: Kant and the Conditions of Possible Experience](#part-v-kant)
8. [Core Arguments and Platform Implications](#core-arguments)
9. [Key Concepts for Platform Architecture](#key-concepts-for-platform-architecture)
10. [Application Notes: Attacks, Supports, and Inference](#application-notes)
11. [Open Questions and Further Study](#open-questions)
12. [Reading Progress](#reading-progress)

---

## Overview: Why Sellars for Mesh?

Sellars provides a rigorous philosophical foundation for understanding **structured discourse** as a *normative, rule-governed practice*. His core insights map directly onto the Mesh platform's architecture:

| Sellarsian Concept | Mesh Platform Analog |
|-------------------|---------------------|
| **Space of Reasons** | The deliberation graph; claims/arguments placed in justificatory relations |
| **Material Inference** | Defeasible rules (ASPIC+ `φ₁,...,φₙ ⇒ ψ`); argumentation scheme warrants |
| **Ought-to-be vs Ought-to-do** | Rules of criticism (scheme applicability) vs rules of action (user moves) |
| **Pattern-governed behavior** | Trained usage patterns before explicit rule-following |
| **Functional role semantics** | Meaning of claims constituted by inferential/evidential connections |
| **Picturing vs Signifying** | Structural correspondence (graph topology) vs semantic content (claim text) |
| **Three Transitions** | Language-entry (evidence), intra-linguistic (inference), language-exit (decisions) |
| **Direct Realism** | Claims about world are primary; evidence mediates causally not epistemically |
| **Stereoscopic Integration** | Unifying informal discourse (manifest) with formal structure (scientific) |

### The Central Thesis

Sellars's *inferentialism* holds that **the meaning of a concept is constituted by its inferential role**—what it licenses inferring and what would defeat those inferences. This has direct implications for how Mesh models:

1. **Attacks**: Not merely structural contraries but *normative incompatibilities*—holding A provides reasons *against* holding B
2. **Supports**: Not merely premise-conclusion links but *material entitlements*—holding A provides reasons *for* holding B  
3. **Warrants**: Argumentation schemes as *codified material inference patterns* (ought-to-be's for reasoning)
4. **Claims**: Their meaning is partly *constituted* by the attack/support relations they stand in
5. **Deliberation**: A practice of navigating the space of reasons—making moves, occupying positions, entering and exiting

### Two Slogans to Guide Platform Development

> **"Conceptual content is articulated by inferential roles"** — Meaning isn't labels attached to claims; it's constituted by what the claim licenses inferring and what would defeat it.

> **"Modal vocabulary is a transposed language of norms"** — When we say "this claim attacks that one," we're not describing a mysterious logical relation; we're conveying that one ought not hold both. The attack relation *is* the transposed norm.

---

## The Cumulative Argument: Essays 1-17 as One Arc

Before diving into individual essays, here's how *In the Space of Reasons* builds a single cumulative argument relevant to Mesh:

### Part I → Part II: From Roles to Anti-Reification

**Part I** establishes that meaning is *inferential role* in a norm-governed practice. If meaning were relations to abstract entities ("meanings," "propositions"), we'd face circularities in explanation.

**Part II** applies this to block ontological inflation: when we talk about "properties," "propositions," "schemes," we're not naming Platonic objects. We're classifying role-players. The dot-quote apparatus lets us refer to functional roles without reifying them.

**Platform takeaway:** `ArgumentScheme`, `Claim`, `Support`, `Attack` are role-classifications, not mysterious relations to abstract entities. The data model tracks functional positions in a practice.

### Part II → Part III: From Language to Mind

**Part II** teaches us: instead of positing entities, redescribe as classifying role-players inside a practice.

**Part III** applies this to the mental: mental episodes are *real-order role-players* that can "mean" things. The Rylean thought-experiment introduces inner episodes as theoretical posits playing roles analogous to overt speech.

**Platform takeaway:** User cognitive states aren't tracked directly; what matters is their *moves in the deliberation game*—what positions they occupy, what transitions they make. The system models the practice, not the psychology.

### Part III → Part IV: From Mind to Science

**Part III** installs the framework: picturing vs signifying, no Given, role-player theory.

**Part IV** asks: how does this connect to scientific reality? Answer: accept **direct realism** (claims about the world are primary), reject phenomenalism (the world isn't built from experiences), and aim for **stereoscopic integration** of manifest and scientific images.

**Platform takeaway:** Mesh's formal structures (ASPIC+, schemes) are the "scientific image" of deliberation. Informal discussion is the "manifest image." The goal is stereoscopic integration: neither eliminates the other; they must be brought into focus together.

### Part IV → Part V: From Science to Conditions of Possibility

**Part V** asks the Kantian question: what are the *conditions of possibility* of knowledge and experience? Not Humean atoms, not rationalist metaphysics, but **norm-governed, role-structured capacities**.

Sellars reconstructs Kant's transcendental psychology as "transcendental linguistics"—the general theory of what any conceptual system must have to generate knowledge of a world to which it belongs.

**Platform takeaway:** Mesh isn't just *implementing* argumentation; it's providing *conditions of possibility* for structured deliberation. The scheme library, the three-transition model, the attack typology—these are the "categories" that make deliberative knowledge possible.

---

## Part I: Language and Meaning

**Through-line:** Explain meaning and conceptual content by the role expressions play inside rule-governed practices—especially *inferential* practices—rather than by positing meaning-relations between words and extra-linguistic items.

### Essay 1: "Inference and Meaning" (1953)

**Core Thesis:** Material inference rules are (i) genuine inference, (ii) not merely shortcuts for explicit premises, (iii) meaning-constitutive.

#### Key Distinctions

| Concept | Definition | Platform Relevance |
|---------|-----------|-------------------|
| **L-rules (Formal)** | Validity by logical form; descriptive terms vacuous | Strict rules in ASPIC+ (`φ → ψ`) |
| **P-rules (Material)** | Validity depends on content; descriptive terms essential | Defeasible rules (`φ ⇒ ψ`); argumentation schemes |
| **Subjunctive conditionals** | "If there were X, there would be Y" | Express material inference rules, not mere associations |

#### Why Subjunctive Conditionals Force the Issue

Sellars argues: a subjunctive like "If there were lightning, there would be thunder" *expresses* a material rule (not merely formal). You can't recover the subjunctive's force by adding explicit law-premises—the "necessitating bite" disappears if you reduce to material implication.

**Upshot:** Material rules aren't eliminable conveniences; they're where the normative force lives.

#### The Anti-Semantic-Rule Argument

Sellars argues against the picture where meaning comes from:
- (a) Syntactical rules (symbol↔symbol)
- (b) Semantical rules attaching predicates to extra-linguistic meaning

**The problem:** Obeying a rule requires recognizing its applicability. A "red objects → say 'red'" rule presupposes the concept *red*—circularity.

**Platform implication:** Claim meaning isn't fixed by ostensive definition but by inferential connections. The `ClaimEdge` relations (SUPPORTS, REFUTES, UNDERCUTS) partly *constitute* what claims mean in the deliberation context.

#### Modal Talk = "Transposed Norms"

> "The language of modalities is interpreted as a 'transposed' language of norms."

Sellars distinguishes:
- **Asserts**: what a sentence says about the world ("The sky is clear")
- **Conveys**: what it shows about the speaker's role in a practice

Modal sentences ("necessarily P") *convey* commitment to inference rules rather than *asserting* facts about necessity.

**Platform implication:** The distinction between "this claim attacks that one" (structural) and "one ought not hold both claims" (normative) can be collapsed—the attack relation *is* the transposed norm.

#### The Pragmatic A Priori

Sellars rejects any "intuitable hallmarks" of the One True conceptual scheme: there are indefinitely many possible languages/rule-systems competing in the marketplace of practice.

**Platform implication:** Argumentation schemes aren't discovered truths about reasoning; they're tools that compete in practice. Mesh can evolve its scheme library based on which patterns prove useful.

---

### Essay 2: "Some Reflections on Language Games" (1954)

**Core Thesis:** Language is rule-governed practice, but learning doesn't require prior explicit rule-knowledge.

#### The Regress Problem and Its Solution

**Problem:** Learning rules requires understanding the metalanguage → infinite regress

**Solution:** Distinguish:
- **Pattern-governed behavior**: Conforming to regularities (trained, reinforced) without grasping rules *as rules*
- **Rule-obeying behavior**: Grasping and endorsing norms

The key insight: a pattern can be "because of" a system without the agent intending to realize it. Learning a language can be coming to do A in C "because of a system of moves" without grasping explicit rules.

**Platform implication:** Users can participate in structured deliberation *before* fully understanding formal argumentation theory. The interface trains pattern-governed behavior; explicit scheme selection comes later.

#### The Three Transitions (Fundamental for Platform Architecture)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         LANGUAGE GAME STRUCTURE                          │
│                                                                          │
│  WORLD ────────► LANGUAGE-ENTRY ────► INTRA-LINGUISTIC ────► EXIT       │
│                  (perception→claim)    (inference)        (claim→action) │
│                                                                          │
│  Non-position      Position             Position           Non-position  │
│  (stimulus)        (judgment)           (judgment)         (action)      │
│                                                                          │
│  Mesh Mapping:                                                           │
│  - Evidence        - Claims             - Support/Attack   - Decisions   │
│  - Observations    - Positions          - Argument chains  - Artifacts   │
│  - Source cites    - Assertions         - Scheme apps      - Actions     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Crucial clarification:** 
- To occupy a position is to *think/judge/assert*
- To make a move is to *infer*
- Observation sentences are positions you can occupy without inferring to them—but language specifies how they're "set up" (via perception)

#### Meaning Statements as Practical Guidance

Sellars: "'rot' means red" is not describing a word↔world relation but giving practical guidance on how to *play the German game* with 'rot'.

**Platform implication:** When users learn argumentation schemes, they're not learning "what the scheme stands for" but *how to deploy the scheme* in deliberation. The critical questions are training devices, not definitions.

#### No Premises Outside All Language Games

Sellars's anti-skeptical move: if reasons are always "within" a framework, then demanding a "premise outside the whole game" is misguided. There are no premises outside all language games.

**Platform implication:** Deliberation doesn't need an external foundation. The practice of giving and asking for reasons is self-supporting. Mesh provides the *space* for that practice; it doesn't need to ground it in something prior.

---

### Essay 3: "Language as Thought and as Communication" (1969)

**Core Thesis:** Language *is* conceptual activity (not merely *expresses* prior inner thought).

#### Ought-to-be vs Ought-to-do (Critical Distinction)

| Type | Form | Example | Who Must Grasp |
|------|------|---------|----------------|
| **Ought-to-be** (rules of criticism) | "Xs ought to be in state φ when C" | "Clock chimes ought to strike on the quarter hour" | Not necessarily the subject |
| **Ought-to-do** (rules of action) | "One ought to do A if in C" | "One ought to wind the clock daily" | The agent must have concepts |

**Crucial insight:** Linguistic rules of criticism don't require the speaker to *explicitly grasp* the rule—conformity can be trained. Ought-to-be's can govern without being represented by the governed.

**Platform implications:** 
- **Scheme applicability conditions** = ought-to-be's (the system can check them)
- **User deliberation moves** = ought-to-do's (require user understanding)
- Some validity checking can happen "behind the scenes" without requiring users to articulate why
- The ASPIC+ engine operates at the ought-to-be level; the UI trains users toward ought-to-do mastery

#### Inferring vs Reasoning About Entitlement

> Inferring "q" from "p" ≠ reasoning about whether one is *entitled* to infer it

**Platform implication:** The ASPIC+ engine computes what *can* be inferred (structural). The deliberation UI lets users reason about whether inferences *should* be made (meta-level). These are distinct layers:

| Layer | Activity | Mesh Feature |
|-------|----------|--------------|
| Object-level | Making inferences | Argument construction; support/attack creation |
| Meta-level | Evaluating entitlement | Critical questions; scheme evaluation; attack adjudication |

---

### Essay 4: "Meaning as Functional Classification" (1974)

**Core Thesis:** Meaning statements classify functional role; "means" is a specialized copula, not a relation.

#### Dot-Quotes and Role Sortals

Sellars introduces **dot-quotes** (•…•) to name functional roles without reifying meanings:

- "'und' (in German) means and" → "'und's are •and•s"
- "•and•" is an *illustrating functional sortal*—anything playing that inferential role

The dot-quote doesn't name a meaning-entity; it classifies by role.

**Platform implication:** When we say "this claim supports that claim," we're classifying the claim's *role* in the deliberation, not asserting a mysterious support-relation between abstract entities. `ClaimEdge` is a role-classification.

#### The Three Functions (Completed Picture)

| Function | Definition | Mesh Feature |
|----------|-----------|--------------|
| **Intra-linguistic** (syntactic) | How expressions combine with each other | Claim↔Claim edges; argument structure; inference chains |
| **Language-entry** (responsive) | How perception/evidence triggers claims | Observation claims; source citations; evidence attachment |
| **Language-departure** (practical) | How claims issue in action | Decision artifacts; action items; resolution moves |

**Complete platform mapping:**

```typescript
// The three transitions in TypeScript terms
type LanguageEntryTransition = {
  from: 'world';  // Non-position (evidence, observation)
  to: 'claim';    // Position (assertion, judgment)
  via: 'observation' | 'citation' | 'testimony';
};

type IntraLinguisticTransition = {
  from: 'claim';  // Position
  to: 'claim';    // Position  
  via: 'support' | 'attack' | 'inference';
};

type LanguageExitTransition = {
  from: 'claim';   // Position
  to: 'action';    // Non-position
  via: 'decision' | 'artifact' | 'resolution';
};
```

---

## Part II: Abstract Entities

**Through-line:** If meaning is functional role (Part I), we can stop inflating ontology with "properties," "propositions," "meanings," etc. Abstract-sounding talk can be unfolded into talk about linguistic/conceptual tokens and their roles.

### Essay 5: "Naming and Saying" (1962)

**Core Move:** Use the constructed language **Jumblese** to show how grammar drives ontological inflation.

#### The Jumblese Strategy

Sellars imagines a language where:
- You express "a is next to b" not with a relation-word, but by **spatially relating the names themselves**
- Relation-words drop out; what matters is the **configuration of names**

**Purpose:** Jumblese is "ideally perspicuous" about the different roles of singular terms, predicates, and sentences—blocking the slide from "we use predicates" to "predicates name universals."

#### The Constant/Variable vs Name/Variable Confusion

> "It is of crucial importance to ontology not to confuse the contrast between constant/variable with the contrast between name/variable."

**The slide:**
1. We can generalize with predicate-variables ("a is F" → "∃f: a is f")
2. Therefore predicates must be *names* of universals

**Sellars's block:** Predicate-variables don't name; they generalize over *roles*. The slide confuses:
- **constant vs variable** (specific vs general position in inference)
- **name vs variable** (referential vs not)

**Platform implication:** When we model `ArgumentScheme` as an entity in the database, we're not committed to schemes being Platonic objects. They're *functional classifications* of inference patterns. The scheme-id is a role-sortal, not a name of an abstract particular.

#### Wittgenstein vs Bergmann on Universals

| Position | Perspicuous representation of "a is below b" | Ontological commitment |
|----------|---------------------------------------------|----------------------|
| **Wittgenstein** | Two names dyadically related | Only particulars |
| **Bergmann** | Three names triadically related (+ "exemplifies") | Particulars + universals |

Sellars sides with the Wittgensteinian strategy: predicates do work, but they don't name additional entities.

---

### Essay 6: "Grammar and Existence: A Preface to Ontology" (1960)

**Core Thesis:** Higher-order existential generalization does *not* automatically commit us to abstract entities.

#### The Dogma Sellars Targets

> From "S is white" infer "(∃f) S is f" → commitment to properties

**The problem:** The informal reading "there is an f such that..." invites reification. Sellars proposes:

| Misleading reading | Better reading |
|-------------------|----------------|
| "There is an f such that S is f" | "S is *something*" |
| S *has* a property | S is *somehow* |

The first invites object-talk; the second is schematic completion.

#### Existence Statements Require Common Nouns

Sellars's criterion: genuine **existence statements** essentially involve category terms ("There are tame tigers").

Quantified formulas without such terms are not existence claims. The paraphrase habit that smuggles in "thing" or "property" is the ontological conjuring trick.

#### Question-Echoing Counterparts (Diagnostic Tool)

To distinguish adjective-like from noun-like "something," check the question counterpart:

| Question | Feel | Slot |
|----------|------|------|
| "Tom is **what**?" | Adjectival (quale) | Predicate position |
| "Tom is **a what**?" | Nominal (quid) | Common noun position |

English collapses these, encouraging reification. Being alert to the collapse helps resist inflating ontology.

**Platform implication:** When users ask "What kind of argument is this?", they're in predicate/quale mode (classification). When they ask "What *is* this argument?", the nominal/quid framing tempts reification. The platform should support classification without encouraging users to think of schemes/claim-types as mysterious entities.

---

### Essay 7: "Abstract Entities" (1963)

**Core Thesis:** Abstract-entity talk can be reconstructed as metalinguistic talk about roles.

#### Distributive Singular Terms (DSTs)

"The lion is tawny" ≈ "All lions are tawny"

The phrase "the lion" doesn't name a lion-universal; it's a *distributive* way of generalizing.

#### The Full Reconstruction

| Abstract-entity talk | Sellarsian reconstruction |
|---------------------|--------------------------|
| "Triangularity" | "the •triangular•" (the role •triangular• plays) |
| "'triangular' stands for triangularity" | "'triangular's are •triangular•s" |
| "That it is raining" (proposition) | "the •it is raining•" (the role that sentence plays) |
| "The meaning of 'red'" | "the •red•" (the functional role) |

**Key move:** "means" and "stands for" are **specialized copulas** (classifying), not relations to abstract objects. They don't report a word standing in a relation to a thing; they classify the word by its functional role.

**Platform implication for ArgumentScheme:**

```typescript
// Not this (reifying schemes):
interface ArgumentScheme {
  id: string;
  referent: AbstractSchemeEntity;  // ❌ No such thing
}

// But this (functional classification):
interface ArgumentScheme {
  id: string;                       // Role-sortal identifier
  schemePattern: string;            // What the scheme *does*
  materialInferences: InferencePattern[];  // What it licenses
  criticalQuestions: CriticalQuestion[];   // What challenges it
}
```

The scheme *is* the pattern of inference it licenses, not a thing that "has" a pattern.

---

### Part II Synthesis: The Anti-Reification Lesson

**What Part II gives you:** A way to do semantics without ontology. When you need to talk about "what claims mean" or "what schemes are," you can do so via functional classification (dot-quotes, role-sortals) without committing to a realm of abstract entities.

**Platform architectural principle:** Mesh's data model represents *roles in a practice*, not relations to abstract objects. This isn't just philosophical hygiene—it affects:

1. **How schemes evolve:** They're not discovered truths but tool-patterns that prove useful
2. **How claims get meaning:** Through their inferential connections, not labels
3. **How the system explains itself:** "This claim plays the conclusion role in a modus ponens pattern," not "This claim instantiates the Modus Ponens Universal"

---

## Part III: Mind, Language, and the World

**Through-line:** How do mind and world hook up without invoking a "Given," inner objects, or magical intentional relations? Answer: treat mental episodes as **role-players** in a norm-governed practice, with both a logical dimension (norms, reasons) and a real dimension (causal states).

### The Part III Arc in One Sentence

**Essay 8** splits representation into picturing/signifying → **Essay 9** blocks Given-style foundations → **Essay 10** reconstructs inner content as role-instituted by public norms → **Essay 11** relocates those roles inside a general naturalistic theory of representational systems.

---

### Essay 8: "Being and Being Known" (1960)

**Core Distinction:** Picturing vs Signifying

| Relation | Order | Nature | Example |
|----------|-------|--------|---------|
| **Picturing** | Real/causal | Structural correspondence via method of projection | Robot patterns "map" environment |
| **Signifying** | Logical/normative | Meaning-role; translation; inferential role | "Lightning" *means* lightning |

#### The Robot Example

A robot can "picture" lightning via internal patterns that correspond (in the real order) to lightning's environmental role. This picturing is:
- *Causal*, not *epistemic*
- Depends on the whole "method of projection" (how patterns are produced/used)
- An isomorphism in the *real* order

Signification *rests on* picturing but adds normative/inferential structure. Treating a robot-pattern as translating as "lightning" depends on recognizing the real-order isomorphism.

**Platform implication:** The deliberation graph *pictures* the structure of reasoning (isomorphism in the real order), while the claim texts *signify* (have meaning in the normative order). Both dimensions are needed:

| Dimension | Mesh Analog |
|-----------|-------------|
| Picturing | Graph topology; structural relations; edge patterns |
| Signifying | Claim content; scheme semantics; inferential meaning |

#### Sensations Are Not in the Intentional Order

Sellars draws a hard line: **sense** is necessary for conceptual activity but does not itself belong to the intentional order.

**The anti-Given move:** Sensory episodes (mere sensings) aren't already contentful "takings." Epistemic standing requires concept-governed "awareness-as."

A case of *sensing bluely* can occur without awareness of blue *as* blue. The sensing isn't yet in the space of reasons.

**Platform implication:** Raw data (user inputs, source materials) are not already "reasons." They become reasons when brought into the deliberation structure—when claims are made *about* them and those claims enter inferential relations.

---

### Essay 9: "The Lever of Archimedes" (1981)

**Core Thesis:** The "Given" as classical fulcrum is a phantom; epistemic authority must be relocated into the space of warranted belief.

#### The Anti-Given Principle

> It's logically possible for a sensing bluely to occur without awareness of a case of blue *as* a case of blue.

Sensing ≠ awareness-as. Epistemic standing requires concept-involving uptake.

#### Self-Presenting States: Two Models

| Model | Ground of Authority | Sellars's View |
|-------|--------------------|--------------| 
| **SP-1** | Direct apprehension (radical apprehension/belief split) | Rejected |
| **SP-2** | Belief would be noninferentially warranted if held | Accepted |

SP-1 treats "being appeared to" as giving foundational warrant by itself. Sellars rejects this.

SP-2: certain beliefs *would be* noninferentially warranted if held, but warrant isn't magically transferred from a pre-cognitive Given. It's about standing in the right normative relations.

#### "Looks" and "Is" Use the Same Concept

Sellars: saying "A looks red" uses the *same concept* of red as "A is red," but in the "looks" case you withhold endorsement. "Looks red" isn't describing a primitive, Given, purely experiential redness.

**Platform implication:** When users qualify claims ("It seems that P," "Allegedly P"), they're using the same conceptual content but modulating commitment. The platform should track these commitment modulations without treating them as different kinds of content.

---

### Essay 10: "Some Reflections on Thoughts and Things" (1967)

**Core Move:** Reconstruct mental episodes as *role-players* in a norm-governed practice, modeled on linguistic episodes.

#### The Rylean Thought-Experiment

Start with a community that only has *thinking-out-loud* (no "inner" episodes).

Then: introduce "inner episodes" as **theoretical posits** that play functional roles analogous to overt speech. This isn't discovering inner objects; it's extending the explanatory framework.

**The reconstruction demands:**
1. Inner episodes must explain behavior (functional role)
2. They must be knowable with "epistemic privilege" (not by inference from behavior)
3. They must coalesce with outer episodes via dot-quotes (not two triangularities—one inner, one outer)

#### Dot-Quotes Return: Coalescing Inner and Outer

Inner episodes can be classified as **•Socrates is wise• thoughts**—the dot-quote machinery handles content without reifying propositions. The same role-sortal applies to both inner thought and outer utterance.

**Platform implication:** What matters isn't the private psychology of users but their *moves in the deliberation game*. Inner conviction and outer claim can be classified the same way (the •P• role) without the platform needing access to inner states.

#### Two Programmatic Corollaries

1. Mental acts and their content → understood **on the model of** linguistic episodes and their senses
2. Counterpart attributes of mental episodes → understood **on the model of** what makes linguistic episodes mean what they mean

**Platform implication:** Claims in the system are the *public* analogs of the private reasoning the platform can't access. The system treats moves in the space of reasons as primary; psychology is not modeled.

---

### Essay 11: "Mental Events" (1981)

**Core Clarification:** Sellars does *not* claim thoughts are linguistic events; he claims some linguistic events are thoughts (paradigm case).

#### Order of Knowing vs Order of Being

| Dimension | Paradigm | Ontology |
|-----------|----------|----------|
| **Order of knowing** | Thinking-out-loud | Conceptual entry point for understanding thought |
| **Order of being** | Representational systems (RSs) | The real nature of thought |

Thinking-out-loud is where we *start* understanding what thought is, but it's not the whole story. Animals have representational systems (RSs) without language.

#### The Theory of Representational Systems

For a system to be a representational system, it must:
1. Have states that correspond to environment features
2. Have those states systematically connected (inference-like transitions)
3. Have those states connected to action

**Not every "responds to as" is "awareness of as":**
- An iron filing "responds to" a magnet as a magnet (causal)
- A rat trained to leap at triangles responds to triangles as triangles (trained)
- But neither has awareness-*as* in the full sense

The full sense requires integration into a richer RS with inference, mapping, strategy.

#### Predication as Counterpart Character

Sellars's key anti-reification move for predicates:

> A representational event has *two characters*: one by which it represents an object; another by which it represents that object as having a character.

The "characterizing" part (predicate-work) isn't naming a universal; it's giving the episode a *counterpart character* by virtue of which it represents.

**Platform implication:** When a claim says "X is Y," the "is Y" part isn't a second reference (to Y-ness). It's a characterization. The platform models claims as having *structure* (subject/predicate, premise/conclusion) without modeling that structure as reference to additional entities.

---

### Part III Synthesis: The Role-Player Solution

**The problem Part III solves:** How can mental episodes be "about" things without mysterious Given content or magical intentional relations?

**The solution:** Mental episodes are *role-players*. They have:
1. A real/causal dimension (they're states of the organism)
2. A normative/logical dimension (they play roles in inference, are subject to critique)

The content of a thought is constituted by its role, not by an inner "meaning" it contains.

**Platform architectural principle:** The system tracks *roles* (claim-positions, inference-moves, support-relations), not inner states. Users' cognitive states aren't accessed; their deliberation moves are modeled. The space of reasons is a space of *positions* and *transitions*, not a space of mental objects.

---

## Part IV: Science and the Mind

**Through-line:** How does the space-of-reasons framework connect to scientific reality? Answer: accept **direct realism** (claims about the world are primary), reject phenomenalism, embrace the "weak identity" of mental and physical, and aim for **stereoscopic integration** of manifest and scientific images.

### Part IV Arc

**Essay 12** dismantles sense-data-first pictures and motivates direct realism → **Essay 13** asks whether raw feels can be identified with brain states → **Essay 14** frames philosophy's task as stereoscopic integration of manifest and scientific images.

---

### Essay 12: "Phenomenalism" (1963)

**Core Argument:** Both classical phenomenalism and hypothetico-deductive phenomenalism fail because "possible sense contents" are circular.

#### Two Sense-Contents-First Programs (Both Fail)

| Program | Claim | Why it fails |
|---------|-------|-------------|
| **Classical phenomenalism** | Physical objects = patterns of actual/possible sense contents | "Possible sense contents" secretly re-imports physical-object concepts → circularity |
| **New/HD phenomenalism** | Physical objects = theory inferred from sense contents | Success presupposes classical phenomenalism works; if you need physical-object concepts to state the base, the "theory" collapses |

Sellars puts it starkly: the "new phenomenalism" is "either mistaken or superfluous."

#### Sellars's Alternative: Direct Realism

- Physical objects are **really and directly perceived**
- "Direct" ≠ "no inference happened" (psychological)
- "Direct" = **normative entitlement** (what one has a right to believe given how the belief was formed)
- Sense impressions mediate **causally**, not **epistemically**

**The crucial reframing:**

| Traditional picture | Sellars's picture |
|--------------------|-------------------|
| We know sense-data directly; physical objects are inferred | We know physical objects directly; sense impressions are part of the causal story |
| Mediation is epistemic (inference) | Mediation is causal (not inferential basis) |

**Platform implication:** Claims in Mesh are *directly about* the subject matter, not about user experiences of the subject matter. Evidence and sources are *causal supports* for the claims, not the "real" objects that claims are "about." This parallels Sellars's direct realism: the claim "X is Y" is about X, not about the evidence for X, even though evidence causally supports the claim.

---

### Essay 13: "The Identity Approach to the Mind-Body Problem" (1965)

**Core Position:** Accept weak identity (raw feels as states of empirical nervous system); reject strong identity (raw-feel predicates = future neuro-predicates).

#### Two Versions of Identity Theory

| Version | Claim | Sellars's verdict |
|---------|-------|------------------|
| **Weak** | Raw feels are properties of the person qua empirical nervous system | Acceptable (not Cartesian) |
| **Strong** | Raw feels = future theoretical neuroscience predicates | Probably false; same use not guaranteed |

#### Why the Strong Version Fails

The "exciting" version says we'll discover that raw-feel universals are identical with brain-state universals. But Sellars asks: would an adequate brain theory contain predicates with the **same use** as raw-feel predicates?

Three problems:
1. **Avowal-role problem**: Theoretical predicates wouldn't play the special avowal/report role
2. **Theory-role problem**: Raw-feel predicates don't have the theoretical-use role brain predicates would
3. **Category/subject problem**: Scientific predicates apply to systems, not to persons as logical subjects

#### The Crucial Constraint

> The "logical space" of raw feels must **reappear transposed** in any adequate brain theory—not reduced or eliminated.

Identities in science are not simple discoveries; they involve rational reconstruction via bridge laws, with meanings/roles adjusted so smooth integration is possible. For raw feels, the question is whether *anything like this* can work.

**Platform implication:** When Mesh formalizes informal discourse (manifest → scientific image of deliberation), it's not *eliminating* the informal. The informal structures must *reappear transposed* in the formal model. Scheme-application doesn't replace intuitive argument; it makes intuitive argument's structure explicit while preserving its normative force.

---

### Essay 14: "Philosophy and the Scientific Image of Man" (1962)

**Core Framework:** Philosophy's job is **stereoscopic integration** of two comprehensive images:

| Image | Basic Objects | Method | Status |
|-------|--------------|--------|--------|
| **Manifest** | Persons, animals, material things | Correlational refinement of common sense | Original framework |
| **Scientific** | Theoretical posits (particles, fields) | Postulational theory construction | Derived, increasingly authoritative |

#### The Stakes

Sellars warns: if the manifest image doesn't survive integration, "man himself would not survive."

The manifest image is where *persons*, *intentions*, *reasons* live. If scientific explanation simply *replaces* the manifest image, we lose the conceptual resources for agency, responsibility, deliberation.

#### Stereoscopic Integration (Not Replacement)

The scientific image is **not just a refinement** of the manifest image; it's a genuinely different framework with different basic objects. But:

- The scientific image presupposes manifest image for its very possibility (scientists are persons in the manifest image)
- The manifest image needs scientific correction (common sense gets things wrong)

Philosophy's task: bring both images into **stereoscopic focus**—preserving what's essential in each while allowing their claims to reality to be adjudicated.

**Platform implication:** This is exactly Mesh's design challenge:

| Mesh Domain | Manifest Image | Scientific Image | Stereoscopic Goal |
|-------------|---------------|------------------|-------------------|
| **Discourse** | Casual conversation; implicit reasoning | ASPIC+ evaluation; formal argument structure | Users experience natural discourse; system provides formal accountability |
| **Arguments** | Intuitive attacks/supports | Scheme applications; contrariness functions | Natural language with formal backing |
| **Deliberation** | Group discussion; persuasion | Grounded semantics; resolution procedures | Authentic deliberation with structural clarity |

The platform shouldn't eliminate informal discourse (manifest) or leave it unanalyzed (pure manifest). It should provide **stereoscopic integration**: informal discourse *and* its formal structural analysis, experienced together.

---

## Part V: Kant and the Conditions of Possible Experience

**Through-line:** What are the *conditions of possibility* of knowledge and experience? Not Humean atoms, not rationalist metaphysics, but **norm-governed, role-structured capacities** that constitute the framework within which knowledge becomes possible.

### Part V Arc

**Essay 15** diagnoses rational psychology's failure and reconstructs transcendental psychology → **Essay 16** develops "transcendental linguistics" as the theory of what any conceptual system must have → **Essay 17** supplies the mechanism (productive imagination) that bridges sensibility and understanding.

---

### Essay 15: "...this I or he or it (the thing) which thinks..." (1970)

**Core Thesis:** Rational Psychology fails; replace it with Transcendental Psychology—a theory of what can be known a priori about the "I" as a necessary condition of possible experience.

#### The Failure of Rational Psychology

Rational psychology tries to read metaphysical conclusions about the soul from the structure of the "I think":

| Rational Psychology's Slide | Kant/Sellars's Block |
|----------------------------|---------------------|
| "I think" is a simple representation → the soul is simple | The "I" is not a predicate-subject in the ontological sense |
| The "I" is numerically identical through change → permanent substance | Numerical identity of the representor ≠ identity of a substantial soul |
| "I think" is purely intellectual → the soul is immaterial | The formal subject of thought is not thereby known as an object |

#### Transcendental Unity of Apperception

The centerpiece: **"an I thinks of a manifold" ≠ "an I has a manifold of thoughts"**

The unity isn't a collection of thoughts that happen to belong to one I; it's a constitutive unity in which the manifold is synthesized *as* a manifold for a single consciousness.

**The categories** are forms of thought that unify contents. That unity is what yields the form of empirical knowledge as an "I" thinking a structured spatiotemporal-causal world.

#### Sellars's Critique: Passivity Confusion

Sellars argues Kant confuses:
- Being in a **deterministic order** (states causally follow from prior states)
- Being **passive to foreign causes** (external imposition)

The past is not "foreign" to the present self. Deterministic consequence isn't passivity to an alien force. Kant's inner-sense model overextends the passivity appropriate to perception.

**Platform implication:** The deliberation system isn't imposed on users from outside (foreign cause). It's the medium through which their own reasoning becomes determinate. Users aren't passive recipients of formal structure; they're active participants whose moves constitute the deliberation.

---

### Essay 16: "Some Remarks on Kant's Theory of Experience" (1967)

**Core Thesis:** Reinterpret "Nature exists as a system of representations" without collapsing into subjective idealism.

#### Space and Time as Forms of Intuition

Sellars's reconstruction: space/time are forms of intuition because the **logical powers of demonstratives** ("this" representings) are specified via concepts of relative spatiotemporal location.

The spatiotemporal concepts have:
- **Transcendental/epistemic function**: forms of representing (how we must represent to have experience)
- **Empirical function**: ordinary location predicates

These are distinguished, not separated.

#### Receptivity as Language-Entry Transitions

Sellars bridges Kant to his own vocabulary:

> Compare Kantian affection of receptivity to **language-entry transitions**—a red object in sunlight evokes "this is red" from someone who knows the language.

Such an utterance is not mere conditioned response; it depends on the environment **and** the perceiver's conceptual set. To know the language of perception is to let one's thoughts be **guided** by the world.

**Receptivity = spontaneity under guidance**: the conceptual structures developed under reality's influence are of a piece with those developed freely (imagining a triangle vs perceiving one), except in receptivity we do it *as guided by the objects represented*.

**Platform implication:** User inputs to deliberation (claims, observations, sources) are "language-entry transitions"—world-guided conceptual moves. The platform models these as *constrained* spontaneity, not passive reception. Users make claims in response to evidence; the evidence guides but doesn't dictate.

#### Transcendental Linguistics

Sellars proposes explicitly: **transcendental linguistics** as the discipline that studies language as conforming to epistemic norms.

> Epistemology "in the new way of words" is the theory of what it is to be a language about a world in which it is used.

Kant's transcendental psychology seeks the general features any conceptual system must have to generate knowledge of a world to which it belongs.

**Platform implication:** Mesh's formal structures (schemes, attack types, grounded semantics) are **transcendental** in this sense: they're the general features a deliberation system must have to generate collective epistemic outcomes. They're not arbitrary design choices but conditions of possibility for structured discourse.

---

### Essay 17: "The Role of Imagination in Kant's Theory of Experience" (1978)

**Core Thesis:** Productive imagination explains how perception is simultaneously world-presenting and conceptually structured.

#### Image-Models

Sellars introduces **image-models**: perspectival, point-of-viewish constructions that are:
- Unified processes guided by sensory input **and** background beliefs/memories/expectations
- What Kant calls **productive** (vs reproductive) imagination
- Not given but constructed

We are directly aware of image-models in perceptual consciousness, but *not aware of them as* image-models. That's a theoretical interpretation reached by reflection.

#### Schema, Recipe, and Conceptual-Perceptual Integration

**Productive imagination** = a unique blend of:
1. Forming images according to a **recipe** (schema)
2. Conceiving objects in a way that supplies recipes

Kant's concept/schema distinction (dog vs schema of dog) becomes: the schema is a family of recipes for constructing image-models of perceiver-confronting-object.

#### What We Perceive OF vs AS

| Dimension | Content | Nature |
|-----------|---------|--------|
| **Perceive OF** | Features of the image-model (sensible qualities, perspectival structure) | What the model shows |
| **Perceive AS** | Conceptual content of the demonstrative thought | What we take it to be |

We don't perceive *causal properties*; we see occurrent sensible features. We perceive the object *as* having causal powers (conceptual contribution of understanding).

**Platform implication:** Users' understanding of deliberation has both dimensions:

| Dimension | Mesh Analog |
|-----------|-------------|
| **OF** | What the UI shows: nodes, edges, spatial arrangement |
| **AS** | What users take it to mean: arguments, support relations, attacks |

The UI is the "image-model" through which users access deliberation structure. The platform must support both: showing the right things (OF) and enabling correct uptake (AS).

---

### Part V Synthesis: Conditions of Possibility for Deliberation

**What Part V gives you:** A framework for thinking about Mesh's formal structures as **transcendental**—conditions of possibility for collective deliberation, not arbitrary design choices.

| Kantian Category | Deliberation Analog |
|------------------|---------------------|
| **Space/Time** as forms of intuition | Graph structure; temporal ordering of contributions |
| **Categories** as forms of understanding | Attack types (undermining, rebutting, undercutting); support relations |
| **Transcendental unity of apperception** | The deliberation as a single unified inquiry, not a heap of claims |
| **Productive imagination** | The process by which informal claims become formal argument structures |
| **Receptivity under guidance** | Language-entry transitions (evidence → claims) |

**Platform architectural principle:** The ASPIC+ framework, the scheme library, the three-attack typology, the grounded semantics—these aren't just implementation choices. They're the **transcendental structure** that makes collective deliberation *possible* as deliberation, not mere aggregation of opinions.

---

## Key Concepts for Platform Architecture

### 1. Material Inference and Defeasible Rules

Sellars's account of material inference provides theoretical grounding for ASPIC+'s defeasible rules:

```
ASPIC+ Defeasible Rule: φ₁,...,φₙ ⇒ ψ

Sellarsian Analysis:
- The rule is meaning-constitutive (not a shortcut)
- "⇒" expresses a norm of inference (ought-to-be)
- The rule can be undercut (its applicability challenged)
- Undercutting targets the rule itself, not the premises
```

### 2. Attacks as Normative Incompatibilities

Current ASPIC+ computes attacks via contrariness function. Sellars suggests contraries are *constituted by* inferential practices:

**Current Model:**
```
φ ∈ contraries(ψ)  →  Attack(A with conc φ, B with prem ψ)
```

**Sellarsian Enrichment:**
```
Holding φ provides reasons against holding ψ
  ↔ Material inference: φ ⇒ ¬ψ (or: φ, ψ ⇒ ⊥)
  ↔ Attack(A, B) with normative force
```

### 3. The Three Transitions in Deliberation

| Transition | Sellars | Mesh Feature |
|-----------|---------|--------------|
| **Language-entry** | Perception → claim | Observation claims; source citations; evidence attachment |
| **Intra-linguistic** | Claim → claim (inference) | Support/attack relations; argument construction |
| **Language-exit** | Claim → action | Decision artifacts; resolution moves; action items |

### 4. Progressive Formalization as Pattern-Governed → Rule-Obeying

Mesh's "progressive formalization" maps onto Sellars's distinction:

| Stage | Sellarsian Category | Mesh Feature |
|-------|--------------------| -------------|
| Casual discussion | Pattern-governed | Chat/forum with no formal structure |
| Structured claims | Emerging rule-conformity | Claim extraction; basic support/attack |
| Formal deliberation | Rule-obeying | Full ASPIC+ evaluation; scheme application |

---

## Core Arguments and Platform Implications

This section extracts the key philosophical arguments and draws out their specific implications for Mesh's architecture.

### Argument 1: The Meaning-Constitutive Role of Material Inference

**The Argument (Essays 1, 2, 4):**

1. Meaning isn't grounded in word↔world relations or "semantic rules" attaching words to referents
2. Obeying a semantic rule presupposes the concept being defined → circularity
3. Therefore: meaning must be constituted by inferential role
4. Material inference rules (content-dependent) are just as meaning-constitutive as formal rules

**Platform Implications:**

```typescript
// A claim's meaning is partly constituted by its inferential connections
interface Claim {
  id: string;
  text: string;
  
  // These relations ARE (partly) what the claim means:
  supports: ClaimId[];      // What this claim licenses inferring
  attacks: ClaimId[];       // What this claim counts against
  supportedBy: ClaimId[];   // What licenses inferring this claim
  attackedBy: ClaimId[];    // What counts against this claim
}
```

**Design principle:** Don't treat claim meaning as fixed by text alone. The claim's *role* in the deliberation partly constitutes what it means.

---

### Argument 2: Modal Talk as Transposed Norms

**The Argument (Essay 1):**

1. Modal vocabulary ("necessarily," "must," "cannot") doesn't describe mysterious logical relations
2. It *conveys* the speaker's commitment to inference rules
3. Modal talk is a "transposed language of norms"

**Platform Implications:**

| When the system says... | It's really conveying... |
|------------------------|-------------------------|
| "This claim attacks that one" | One ought not hold both claims |
| "This is an undercutting attack" | One ought not use this inference pattern given this objection |
| "This argument is in the grounded extension" | One ought to accept this conclusion (all things considered) |

**Design principle:** Attack/support relations are *norms made structural*. The UI should present them as normative guidance.

---

### Argument 3: Pattern-Governed vs Rule-Obeying Behavior

**The Argument (Essay 2):**

1. Learning rules can't require already understanding the rules → regress
2. **Pattern-governed**: Conforming to patterns without grasping rules as rules
3. **Rule-obeying**: Grasping and endorsing norms
4. Pattern-governed behavior comes first; rule-obeying is a later achievement

**Platform Implications:**

| User Stage | Sellarsian Category | Platform Support |
|------------|--------------------| -----------------|
| New users | Pattern-governed | UI guides toward good patterns without explaining theory |
| Developing | Mixed | Some explicit scheme options; mostly intuitive |
| Advanced | Rule-obeying | Full scheme selection; formal analysis |

**Design principle:** The onboarding path is pattern-governed → rule-obeying. Don't require formal understanding upfront.

---

### Argument 4: Ought-to-Be vs Ought-to-Do

**The Argument (Essay 3):**

| Rule Type | Who Checks | Examples |
|-----------|-----------|----------|
| **Ought-to-be** (rules of criticism) | System (automated) | Scheme applicability; consistency; grounded semantics |
| **Ought-to-do** (rules of action) | User (with support) | Whether to use a scheme; how to respond to CQs |

**Design principle:** The platform can enforce ought-to-be's automatically. Users engage with ought-to-do's.

---

### Argument 5: Stereoscopic Integration

**The Argument (Essay 14):**

1. **Manifest image**: Persons, intentions, reasons, informal discourse
2. **Scientific image**: Theoretical posits, formal structures
3. Neither should replace the other
4. Philosophy's task: bring them into **stereoscopic focus**

**Platform Implications:**

| Manifest (Informal) | Scientific (Formal) | Stereoscopic Goal |
|--------------------|---------------------|-------------------|
| Natural language claims | ASPIC+ structures | Claims with formal backing |
| Intuitive support/attack | Scheme applications | Natural language + explicit warrant |
| Group discussion | Grounded semantics | Discussion with structural clarity |

**Design principle:** Mesh provides both informal and formal, experienced together.

---

### Argument 6: Transcendental Conditions

**The Argument (Essays 15-17):**

Some structures are *conditions of possibility* for collective deliberation, not arbitrary choices:

| Kantian | Mesh |
|---------|------|
| Categories | Attack types (undermining, rebutting, undercutting) |
| Space/time as forms | Graph structure; temporal ordering |
| Unity of apperception | Deliberation as unified inquiry |
| Productive imagination | Progressive formalization |

**Design principle:** Core ASPIC+ structures are transcendental—they capture what deliberation *must* be like.

---

## Application Notes

### Strengthening Warrant/Inference Features

Based on Sellars, warrants in argumentation can be enriched:

```typescript
interface EnhancedArgumentScheme {
  // Current structure
  id: string;
  name: string;
  slots: SchemeSlot[];
  criticalQuestions: CriticalQuestion[];
  
  // Sellarsian additions
  
  // What material inferences does this scheme license?
  materialInferences: {
    from: string[];  // Premise patterns
    to: string;      // Licensed conclusion pattern
    modality: 'strict' | 'defeasible' | 'presumptive';
  }[];
  
  // What would defeat this inference? (maps to undercutting)
  defeatingConditions: {
    condition: string;
    attackType: 'undermining' | 'rebutting' | 'undercutting';
    explanation: string;
  }[];
  
  // What commitments does using this scheme incur?
  commitmentProfile: {
    mustAcceptIf: string[];      // Other conclusions licensed
    mustRejectIf: string[];      // Incompatible conclusions
    shouldQuestionIf: string[];  // Triggers for critical questions
  };
  
  // How does this scheme relate to others?
  schemeRelations: {
    conflictsWith: SchemeId[];   // Cannot both apply
    presupposes: SchemeId[];     // Must hold for this to apply
    specializes: SchemeId[];     // More specific version of
  };
}
```

### The Three Transitions in Practice

```typescript
// Complete deliberation model with all three transition types

interface Deliberation {
  id: string;
  
  // Language-Entry: World → Claims
  entries: {
    type: 'observation' | 'citation' | 'testimony' | 'data';
    source: string;
    resultingClaim: ClaimId;
    entryWarrant: string;  // Why this evidence justifies this claim
  }[];
  
  // Intra-Linguistic: Claims ↔ Claims
  inferences: {
    from: ClaimId[];
    to: ClaimId;
    type: 'support' | 'attack';
    attackType?: 'undermining' | 'rebutting' | 'undercutting';
    scheme?: SchemeId;
    strength: number;  // Defeasibility degree
  }[];
  
  // Language-Exit: Claims → Action
  exits: {
    type: 'decision' | 'resolution' | 'artifact' | 'recommendation';
    fromClaims: ClaimId[];
    actionContent: string;
    implementationStatus: 'pending' | 'adopted' | 'rejected';
  }[];
}
```

### The Space of Reasons as UI Metaphor

The deliberation graph *is* a navigable space of reasons:

| Spatial Property | Deliberation Analog | UI Feature |
|-----------------|---------------------|-----------|
| Centrality | Claims providing many supports | Size/prominence of nodes |
| Contested regions | Claims with many attacks | Color coding; conflict indicators |
| Frontier | UNDEC arguments (grounded semantics) | Highlighted for resolution |
| Paths | Chains of inference | Navigation/zoom capabilities |
| Transport | Argument import (Plexus) | Cross-deliberation linking |
| Depth | Layers of support/attack | Hierarchical visualization |

### Progressive Formalization Pathway

```
Stage 1: Pattern-Governed Entry
┌─────────────────────────────────────────────┐
│ User makes informal claims                   │
│ UI suggests structure: "Is this a reason?"   │
│ System learns patterns from user behavior    │
└─────────────────────────────────────────────┘
                    ↓
Stage 2: Emerging Rule-Conformity  
┌─────────────────────────────────────────────┐
│ Claims auto-extracted from discussion        │
│ Support/attack suggested by AI               │
│ User confirms/rejects suggestions            │
└─────────────────────────────────────────────┘
                    ↓
Stage 3: Explicit Rule-Following
┌─────────────────────────────────────────────┐
│ User selects schemes explicitly              │
│ Critical questions presented systematically  │
│ Formal argument analysis available           │
└─────────────────────────────────────────────┘
                    ↓
Stage 4: Meta-Deliberation
┌─────────────────────────────────────────────┐
│ Users reason about schemes themselves        │
│ Propose new inference patterns               │
│ Evaluate scheme applicability collectively   │
└─────────────────────────────────────────────┘
```

---

## Open Questions

### For Implementation

1. **Dynamic Contrary Discovery:** Can contraries be inferred from observed inferential behavior (what users treat as incompatible) rather than only explicit declaration?

2. **Graded Incompatibility:** Not just binary contrary/not-contrary, but degrees of tension based on inferential strength?

3. **Context-Sensitive Contraries:** Claims that are contraries in practical reasoning but not theoretical (or vice versa)?

4. **Scheme-as-Material-Rule:** How to formally model schemes as material inference patterns with associated defeat conditions?

5. **Meta-Deliberation:** Users reasoning about *whether* to accept inference patterns, not just using them—the "reasoning about entitlement" layer?

### For Further Study

6. **Dot-Quote Implementation:** Could the platform use dot-quote-like notation to refer to claim-roles without reifying them? E.g., "•supports democracy• claims" as a functional classifier?

7. **Trans-level Credibility:** How to model the "directness" of evidential support as a normative matter (entitlement) rather than just structural (number of hops)?

8. **Productive Imagination Analog:** What's the deliberation equivalent of Kant's productive imagination? How do informal claims get schematized into formal structures?

9. **The Pragmatic A Priori:** Scheme libraries compete in "the marketplace of practice." How should the platform support scheme evolution based on practical success?

10. **Manifest/Scientific Stereoscopy:** What's the right balance between showing users informal discourse (manifest) and formal structure (scientific)? When does one dominate?

---

## Reading Progress

- [x] Part I: Language and Meaning (Essays 1-4) — Study guide reviewed, platform mappings complete
- [x] Part II: Abstract Entities (Essays 5-7) — Study guide reviewed, anti-reification lesson extracted
- [x] Part III: Mind, Language, and the World (Essays 8-11) — Study guide reviewed, role-player theory mapped
- [x] Part IV: Science and the Mind (Essays 12-14) — Study guide reviewed, stereoscopic integration mapped
- [x] Part V: Kant (Essays 15-17) — Study guide reviewed, transcendental conditions extracted
- [ ] Additional articles in main folder — To be integrated:
  - [ ] "On Reasoning about Values"
  - [ ] "On Accepting First Principles"  
  - [ ] "Language as Thought and as Communication" (full article)
  - [ ] Other articles as relevant

---

## Next Steps

1. **Integrate standalone articles** from `/Wilfrid Sellars/` folder, particularly those on practical reasoning and first principles
2. **Develop the EnhancedArgumentScheme** interface further with input from architecture documents
3. **Map specific Mesh components** (Claims, ClaimEdges, Schemes, Deliberations) to Sellarsian concepts
4. **Draft implementation proposals** for key features:
   - Dynamic contrary discovery
   - Progressive formalization pathway
   - Three-transition model in deliberation data structures
5. **Create comparison document** between Sellars, ASPIC+ theory, and current Mesh implementation

---

*Last updated: 2025-12-27*
