# Sellars Deep Study Part 2: Applications and Implementation

**Purpose:** Address open questions from Part 1, integrate standalone articles, develop enhanced data models, and draft implementation proposals for Mesh platform.

**Builds on:** `SELLARS_DEEP_STUDY.md` (comprehensive synthesis of *In the Space of Reasons*)

**Document Status:** In progress

---

## Table of Contents

1. [Open Questions: Implementation Answers](#open-questions-implementation)
2. [Open Questions: Further Study Notes](#open-questions-further-study)
3. [Standalone Article Integration](#standalone-articles)
4. [Enhanced Argument Scheme Development](#enhanced-scheme)
5. [Mesh Component Mapping](#mesh-mapping)
6. [Implementation Proposals](#implementation-proposals)

---

## Open Questions: Implementation Answers

### Question 1: Dynamic Contrary Discovery

**Original Question:** Can contraries be inferred from observed inferential behavior (what users treat as incompatible) rather than only explicit declaration?

**Sellarsian Analysis:**

Sellars's account of material inference provides the theoretical grounding. Contraries are not Platonic relations discovered between propositions—they're *constituted by* inferential practices. From Essay 1:

> Material transformation rules determine descriptive meaning within the logical framework.

If claim A and claim B are repeatedly treated as incompatible by users (one is used to attack the other, never both endorsed together), then **the contrary relation is being constituted** by that practice.

**Implementation Proposal:**

```typescript
interface InferredContrary {
  claimA: ClaimId;
  claimB: ClaimId;
  
  // Evidence of contrariness
  evidence: {
    attackCount: number;           // Times A used to attack B or vice versa
    coEndorsementCount: number;    // Times both endorsed by same user (should be low)
    explicitDeclarations: number;  // Users who explicitly marked contrary
    schemeBasedConflicts: number;  // Scheme applications implying conflict
  };
  
  // Confidence score
  confidence: number;  // 0-1, computed from evidence
  
  // Status
  status: 'inferred' | 'confirmed' | 'rejected';
  
  // For review
  needsReview: boolean;
  reviewPrompt?: string;
}

// Detection algorithm sketch
function detectPotentialContraries(deliberation: Deliberation): InferredContrary[] {
  const candidates: Map<string, InferredContrary> = new Map();
  
  // 1. Look for attack patterns
  for (const attack of deliberation.attacks) {
    const key = canonicalPair(attack.attacker, attack.target);
    // Increment attack count for this pair
  }
  
  // 2. Check co-endorsement (negative evidence)
  for (const user of deliberation.participants) {
    const endorsed = getEndorsedClaims(user, deliberation);
    // If user endorses both A and B, this is evidence AGAINST contrariness
  }
  
  // 3. Check scheme applications
  for (const schemeApp of deliberation.schemeApplications) {
    // Some schemes imply contrariness (e.g., reductio, dilemma)
  }
  
  // 4. Compute confidence and return high-confidence candidates
  return Array.from(candidates.values())
    .filter(c => c.confidence > CONTRARY_THRESHOLD);
}
```

**Platform Design Principle:**

The system should:
1. **Observe** user behavior for patterns of incompatibility
2. **Infer** potential contraries from those patterns
3. **Suggest** the contrary relation to users for confirmation
4. **Learn** from confirmations/rejections to improve detection

This respects the Sellarsian insight that contraries are practice-constituted while maintaining user control over the normative structure.

---

### Question 2: Graded Incompatibility

**Original Question:** Not just binary contrary/not-contrary, but degrees of tension based on inferential strength?

**Sellarsian Analysis:**

Sellars distinguishes:
- **Strict rules** (L-rules): Formal, exceptionless
- **Material rules** (P-rules): Content-dependent, defeasible

This suggests a spectrum of inferential strength. From "On Reasoning about Values":

> To "see" that 'P' implies 'Q' is, ceteris paribus, to have the propensity not to believe both 'P' and 'not-Q'—which leaves open combinations...

The "ceteris paribus" is doing crucial work. Incompatibility can be:
- **Strict**: Logical contradiction (never both true)
- **Strong**: Material incompatibility (cannot both hold given standard background assumptions)
- **Defeasible**: Tension that creates a presumption against co-holding
- **Contextual**: Incompatible in some contexts but not others

**Implementation Proposal:**

```typescript
interface GradedContrary {
  claimA: ClaimId;
  claimB: ClaimId;
  
  // Degree of incompatibility
  strength: 'strict' | 'strong' | 'defeasible' | 'tension';
  
  // Numerical strength (for comparison)
  strengthScore: number;  // 0-1
  
  // What kind of incompatibility
  incompatibilityType: 
    | 'logical'           // Formal contradiction
    | 'material'          // Content-based (given background)
    | 'practical'         // Cannot both be acted on
    | 'evidential'        // Same evidence can't support both
    | 'presumptive';      // Default incompatibility, rebuttable
  
  // Conditions under which incompatibility holds
  conditions?: string[];
  
  // Conditions that would defeat the incompatibility
  defeatConditions?: string[];
}

// UI implications
interface ConflictDisplay {
  contrary: GradedContrary;
  
  // Visual encoding of strength
  displayStrength: 'hard-conflict' | 'soft-conflict' | 'tension' | 'note';
  
  // Explanation for users
  explanation: string;
  
  // Action options
  actions: ('resolve' | 'acknowledge' | 'explain' | 'dismiss')[];
}
```

**Platform Design Principle:**

Different strength levels warrant different UI treatments:
- **Strict**: Hard block; system won't allow co-endorsement
- **Strong**: Warning with explanation; requires explicit override
- **Defeasible**: Notification; user can provide defeating conditions
- **Tension**: Note for consideration; no action required

---

### Question 3: Context-Sensitive Contraries

**Original Question:** Claims that are contraries in practical reasoning but not theoretical (or vice versa)?

**Sellarsian Analysis:**

Sellars explicitly distinguishes practical and theoretical reasoning in "On Reasoning about Values." The key insight:

> It is essential to distinguish between what is implied by an intention and what is implied by the fact that a person has the intention—just as it is essential to distinguish between what is implied by a belief and what is implied by the fact that a person has the belief.

Practical incompatibility: "I shall do A" and "I shall do B" may conflict even if "A is possible" and "B is possible" are compatible.

**Implementation Proposal:**

```typescript
interface ContextualContrary {
  claimA: ClaimId;
  claimB: ClaimId;
  
  // In which contexts are these contraries?
  contraryIn: ReasoningContext[];
  
  // In which contexts are they compatible?
  compatibleIn: ReasoningContext[];
}

type ReasoningContext = 
  | 'theoretical'           // Truth/belief
  | 'practical'             // Action/intention
  | 'epistemic'             // Knowledge/evidence
  | 'deontic'               // Obligation/permission
  | 'evaluative'            // Value/preference
  | 'resource-constrained'; // Given limited resources

// Example: "Fund project A" and "Fund project B" 
// - Compatible in theoretical context (both could be good ideas)
// - Contrary in resource-constrained practical context (can only fund one)

interface ContextualConflictCheck {
  claims: ClaimId[];
  context: ReasoningContext;
  
  checkResult: {
    hasConflict: boolean;
    conflictType?: 'necessary' | 'contingent';
    explanation?: string;
  };
}
```

**Platform Design Principle:**

The deliberation mode affects what counts as conflict:
- **Theoretical deliberation** (what is true?): Logical/material contraries
- **Practical deliberation** (what to do?): Add practical contraries
- **Resource allocation**: Add resource-constraint contraries

The platform should track deliberation mode and surface appropriate conflicts.

---

### Question 4: Scheme-as-Material-Rule

**Original Question:** How to formally model schemes as material inference patterns with associated defeat conditions?

**Sellarsian Analysis:**

From Essay 1, material rules:
1. Are meaning-constitutive (not shortcuts)
2. Have normative force (not mere regularities)
3. Can be defeated (not exceptionless)

From "On Accepting First Principles," the practical syllogism structure shows how inference rules connect to action through practical reasoning.

**Implementation Proposal:**

```typescript
interface MaterialInferenceScheme {
  id: string;
  name: string;
  
  // The inference pattern
  pattern: {
    premises: PremisePattern[];
    conclusion: ConclusionPattern;
    
    // Modality of the inference
    modality: 'strict' | 'defeasible' | 'presumptive';
    
    // Strength when undefeated
    defaultStrength: number;
  };
  
  // What would defeat this inference
  defeatConditions: {
    // Undercutting: attacks the inference itself
    undercutters: {
      condition: string;
      explanation: string;
      // How much this weakens the inference
      weakening: 'complete' | 'partial';
      partialWeakening?: number;
    }[];
    
    // Rebutting: attacks the conclusion directly
    rebuttingPatterns: {
      pattern: string;
      explanation: string;
    }[];
    
    // Undermining: attacks the premises
    underminingPatterns: {
      targetPremise: number;  // Which premise
      pattern: string;
      explanation: string;
    }[];
  };
  
  // Critical questions as defeat probes
  criticalQuestions: {
    question: string;
    targetType: 'premise' | 'inference' | 'conclusion';
    defaultAnswer: 'yes' | 'no' | 'unknown';
    // What happens if answered differently
    negativeAnswerEffect: 'undercuts' | 'rebuts' | 'undermines' | 'weakens';
  }[];
  
  // Meaning-constitutive role
  inferentialRole: {
    // What concepts does this scheme help constitute?
    constitutedConcepts: string[];
    
    // What other inferences does using this scheme commit one to?
    commitments: string[];
    
    // What inferences are incompatible with this scheme?
    incompatibleInferences: SchemeId[];
  };
}
```

This will be developed further in the [Enhanced Argument Scheme Development](#enhanced-scheme) section.

---

### Question 5: Meta-Deliberation

**Original Question:** Users reasoning about *whether* to accept inference patterns, not just using them—the "reasoning about entitlement" layer?

**Sellarsian Analysis:**

From Essay 3, the distinction between:
- **Inferring** "q" from "p" (object-level)
- **Reasoning about whether one is entitled** to infer q from p (meta-level)

From "On Accepting First Principles":

> Accepting a proposition is, in a broad sense, a doing. It is not a physical doing, but rather a mental doing... and, like all doings, is something that can be correctly or incorrectly done.

This frames scheme-acceptance as itself subject to practical reasoning.

**Implementation Proposal:**

```typescript
interface MetaDeliberation {
  id: string;
  parentDeliberation: DeliberationId;
  
  // What's being deliberated about
  subject: 
    | { type: 'scheme'; schemeId: SchemeId }
    | { type: 'contrary'; contraryPair: [ClaimId, ClaimId] }
    | { type: 'inference-pattern'; pattern: string }
    | { type: 'deliberation-rule'; rule: string };
  
  // The meta-question
  question: string;
  
  // Arguments for/against the subject
  arguments: {
    position: 'for' | 'against';
    argument: ArgumentId;
  }[];
  
  // Resolution
  outcome?: {
    decision: 'accept' | 'reject' | 'modify' | 'defer';
    rationale: string;
    modifications?: any;
  };
}

// Triggers for meta-deliberation
interface MetaDeliberationTrigger {
  condition: 
    | 'scheme-dispute'           // Users disagree on scheme application
    | 'contrary-dispute'         // Users disagree on contrary status
    | 'persistent-deadlock'      // Deliberation stuck
    | 'novel-pattern'            // New inference pattern emerging
    | 'explicit-request';        // User requests meta-discussion
    
  threshold?: number;  // For quantitative triggers
  
  action: 'suggest-meta' | 'require-meta' | 'auto-create-meta';
}
```

**Platform Design Principle:**

Meta-deliberation should be:
1. **Available** when users want to question the rules
2. **Suggested** when pattern-level disagreements emerge
3. **Structured** with the same tools as object-level deliberation
4. **Resolvable** with outcomes that update the deliberation rules

---

## Open Questions: Further Study Notes

### Question 6: Dot-Quote Implementation

**Question:** Could the platform use dot-quote-like notation to refer to claim-roles without reifying them?

**Preliminary Notes:**

Sellars's dot-quotes (•...•) name *functional roles* without positing abstract entities:
- "•red•" = the role that "red" plays in English, "rot" in German, etc.
- "•triangular•" = the role, not a property-entity

For Mesh, this suggests:
- "•supports-democracy•" = any claim playing the pro-democracy support role
- "•attacks-via-precedent•" = any argument using precedent-based attack

**Potential Application:**

```typescript
// Instead of: "Claims of type 'supports-democracy'"
// Use: "•supports-democracy• claims" (functional classification)

interface FunctionalRoleClassifier {
  rolePattern: string;  // e.g., "supports-democracy"
  
  // What makes a claim play this role?
  roleCriteria: {
    contentPatterns: string[];
    inferentialConnections: InferencePattern[];
    typicalPositionIn: ArgumentStructure[];
  };
  
  // Claims currently playing this role
  currentInstances: ClaimId[];
  
  // Role is defined by function, not essence
  isEssentialProperty: false;  // Always false for role classifications
}
```

**To explore further:** How to surface role-based thinking in UI without philosophical jargon?

---

### Question 7: Trans-level Credibility

**Question:** How to model the "directness" of evidential support as a normative matter (entitlement) rather than just structural (number of hops)?

**Preliminary Notes:**

From Essay 12, Sellars distinguishes:
- Psychological directness (not consciously inferred)
- Normative directness (entitled without further justification)

Evidence supports claims "directly" when the entitlement is immediate given proper training/context—not because there are no causal intermediaries.

**Potential Application:**

```typescript
interface TransLevelCredibility {
  claim: ClaimId;
  evidence: EvidenceId;
  
  // Structural distance (hops in inference chain)
  structuralDistance: number;
  
  // Normative directness (entitlement status)
  normativeDirectness: {
    // Is this claim noninferentially entitled given the evidence?
    isNoninferentiallyEntitled: boolean;
    
    // What training/expertise does this require?
    requiredBackground: string[];
    
    // What would defeat the direct entitlement?
    defeaters: string[];
  };
  
  // Overall credibility (combines both)
  credibilityScore: number;
}
```

**To explore further:** How do expertise and training affect directness of entitlement?

---

### Question 8: Productive Imagination Analog

**Question:** What's the deliberation equivalent of Kant's productive imagination?

**Preliminary Notes:**

From Essay 17, productive imagination:
- Constructs unified perceptual experience from sensory input + conceptual structure
- Follows "recipes" (schemata) derived from concepts
- Bridges receptivity and spontaneity

For deliberation, the analog might be:
- The process that constructs formal argument structures from informal claims
- Following scheme "recipes" 
- Bridging raw user input and formal ASPIC+ representation

**Potential Application:**

```typescript
interface DeliberativeImagination {
  // Input: informal claims/discussion
  input: {
    rawClaims: string[];
    conversationalContext: string[];
    userIntents: Intent[];
  };
  
  // Recipe: scheme patterns
  recipe: {
    applicableSchemes: SchemeId[];
    structuralPatterns: ArgumentPattern[];
    inferenceTemplates: InferenceTemplate[];
  };
  
  // Output: structured representation
  output: {
    formalClaims: Claim[];
    argumentStructure: Argument[];
    inferenceChains: InferenceChain[];
  };
  
  // The construction process (productive imagination at work)
  constructionProcess: {
    schematization: SchematizationStep[];  // Applying recipes
    synthesis: SynthesisStep[];             // Unifying into structure
    refinement: RefinementStep[];           // Adjusting based on fit
  };
}
```

**To explore further:** Can AI assistance serve as "productive imagination" for deliberation?

---

### Question 9: The Pragmatic A Priori

**Question:** Scheme libraries compete in "the marketplace of practice." How should the platform support scheme evolution?

**Preliminary Notes:**

From Essay 1:
> There are indefinitely many possible conceptual structures/languages; they "compete in the marketplace of practice."

Schemes aren't discovered truths—they're tools that prove useful or not.

**Potential Application:**

```typescript
interface SchemeEvolution {
  scheme: SchemeId;
  
  // Usage metrics
  usage: {
    applicationCount: number;
    successfulResolutions: number;
    abandonedApplications: number;
    userSatisfactionScores: number[];
  };
  
  // Competition with alternatives
  competition: {
    alternativeSchemes: SchemeId[];
    comparativeSuccess: Map<SchemeId, number>;  // Win rate vs each alternative
  };
  
  // Evolution history
  history: {
    created: Date;
    modifications: SchemeModification[];
    forks: SchemeId[];  // Variant schemes derived from this one
    deprecated?: Date;
  };
  
  // Fitness score
  fitnessScore: number;  // For ranking/recommendation
}

interface SchemeModification {
  date: Date;
  type: 'critical-question-added' | 'defeat-condition-added' | 'premise-refined' | 'merged-with';
  description: string;
  rationale: string;
  evidence: string[];  // Links to deliberations that motivated change
}
```

**To explore further:** What governance process for scheme evolution? Community-driven? Expert-curated? Empirically-tested?

---

### Question 10: Manifest/Scientific Stereoscopy Balance

**Question:** What's the right balance between showing users informal discourse (manifest) and formal structure (scientific)?

**Preliminary Notes:**

From Essay 14:
> If the manifest image doesn't survive integration, "man himself would not survive."

The formal/scientific image must not *replace* the informal/manifest. Users must experience *both*—authentic discussion AND formal accountability.

**Potential Application:**

```typescript
interface StereoscopicView {
  deliberation: DeliberationId;
  
  // User preference
  preference: 'manifest-primary' | 'scientific-primary' | 'balanced' | 'adaptive';
  
  // View configuration
  views: {
    // Manifest layer: natural language, conversation, flow
    manifest: {
      visible: boolean;
      prominence: number;  // 0-1
      features: ('threaded-discussion' | 'natural-claims' | 'informal-supports')[];
    };
    
    // Scientific layer: formal structure, ASPIC+, grounded semantics
    scientific: {
      visible: boolean;
      prominence: number;  // 0-1
      features: ('argument-graph' | 'scheme-labels' | 'attack-types' | 'extension-status')[];
    };
  };
  
  // Integration points (where both layers show)
  integrationPoints: {
    claimCards: 'manifest' | 'scientific' | 'both';
    relationships: 'manifest' | 'scientific' | 'both';
    navigation: 'manifest' | 'scientific' | 'both';
  };
}

// Adaptive balance based on context
function adaptBalance(user: User, deliberation: Deliberation): StereoscopicView {
  // New users: manifest-primary (pattern-governed)
  // Advanced users: balanced or scientific-primary (rule-obeying)
  // High-conflict zones: scientific emphasis (clarity)
  // Exploratory phases: manifest emphasis (creativity)
}
```

**To explore further:** User research on when formal structure helps vs. hinders deliberation quality.

---

## Standalone Article Integration

### Article 1: "On Reasoning about Values" (1980)

**Core Thesis:** Intentions have a distinct semantic structure from beliefs. They are expressions with values "realized/not-realized" rather than "true/false," and they cannot occur within the scope of logical operators in the same way beliefs can.

#### Key Principles Extracted

**1. The S-Imp Principle (Foundational)**

> "If 'P' implies 'Q', then 'It shall be the case that-P' implies 'It shall be the case that-Q'"

This extends logical implication to the domain of intentions. If there's a logical or material implication between states of affairs, the same implication structure transfers to intentions regarding those states.

**Platform Implication:** When a user commits to an intention-claim (e.g., "We should expand into market X"), the system can surface implied commitments (e.g., "We should hire people with X-market expertise" if the material implication holds).

```typescript
interface SellarsianImplication {
  // If P materially implies Q in the theoretical domain
  theoreticalImplication: {
    antecedent: string;  // P
    consequent: string;  // Q
    basis: 'logical' | 'material' | 'causal';
  };
  
  // Then shall-P implies shall-Q in the practical domain
  practicalProjection: {
    intentionAntecedent: string;  // "Shall be [P]"
    intentionConsequent: string;  // "Shall be [Q]"
    
    // Surfaced to user
    promptText: string;
    // e.g., "Your intention to P seems to imply an intention to Q. Do you accept this?"
  };
}
```

**2. The So-Be-It Principle**

> "Shall be [φ]" and 'p' imply "Shall be [φ and p]" where 'φ' is a formula which may or may not be logically complex.

This principle shows how beliefs get incorporated into the content of intentions. When we have an intention and also believe certain facts, those facts become part of the elaborated intention scenario.

**Platform Implication:** The deliberation context should track both:
- What participants *intend* (intentional commitments)  
- What participants *believe* (factual commitments)

And then automatically elaborate intention-scenarios to include relevant factual beliefs.

```typescript
interface ScenarioElaboration {
  coreIntention: string;           // "Shall be [launch product X]"
  relevantBeliefs: string[];       // ["Market Y is growing", "Competitor Z just exited"]
  
  // Elaborated scenario via So-Be-It
  elaboratedIntention: string;     // "Shall be [launch X, and market Y is growing, and Z exited...]"
  
  // Implications drawn from elaborated scenario
  derivedIntentions: string[];     // Via S-Imp
  
  // Choice point: does user accept the elaborated scenario?
  acceptance: 'accepted' | 'modified' | 'rejected';
}
```

**3. The Shall-Be Principle**

> "Shall [I do A]" implies "Shall be [I do A]"

This bridges action-intentions and state-of-affairs-intentions. An intention to do something implies an intention that that thing be done.

**4. Target vs. So-Be-It Constituents**

Sellars distinguishes:
- **Target constituents:** Things viewed "sub specie up-to-me" — what I'm actively trying to bring about
- **So-Be-It constituents:** Factual background incorporated into the intention

**Platform Implication:** Claims and arguments should be classifiable as:
- Active proposals (targets) — things the arguer is advocating as actions/changes
- Background assumptions (So-Be-It) — factual premises the arguer accepts

```typescript
type IntentionConstituent = 
  | { type: 'target'; content: string; upToWhom: ActorId[] }
  | { type: 'background'; content: string; beliefBasis: 'stated' | 'assumed' | 'common-ground' };

interface StructuredIntention {
  id: string;
  targets: IntentionConstituent[];
  background: IntentionConstituent[];
  
  // Full elaborated form
  elaboratedForm: string;
  
  // What this implies
  implications: string[];
}
```

**5. Practical Reasoning as Scenario Elaboration**

> "This picture is one according to which practical reasoning is essentially the process of elaborating alternative scenarios for a choice."

The steps are:
1. Elaboration by CI (Conjunction Introduction) and So-be-it, and the drawing of implications
2. Choice between elaborated alternatives (or continuing indecision)
3. Simplification to the core intention
4. Intention to act

**Platform Implication:** Deliberations should support:
1. **Scenario construction:** Building out alternative futures
2. **Implication surfacing:** What does each scenario imply?
3. **Comparison:** Presenting elaborated alternatives for evaluation
4. **Decision recording:** Capturing which scenario was chosen and why

```typescript
interface DeliberativeScenario {
  id: string;
  coreIntention: string;
  
  // Elaborated via CI and So-Be-It
  elaboratedContent: {
    targets: string[];
    implications: string[];
    backgroundFacts: string[];
  };
  
  // Summary form for comparison
  summary: string;
  
  // Evaluation metadata
  evaluation: {
    pros: string[];
    cons: string[];
    participantPreferences: Map<UserId, PreferenceRating>;
  };
}

interface ScenarioComparison {
  scenarios: DeliberativeScenario[];
  
  // Decision outcome
  outcome: 
    | { type: 'chosen'; scenarioId: string; rationale: string }
    | { type: 'deferred'; reason: string }
    | { type: 'modified'; newScenario: DeliberativeScenario };
}
```

**6. Relative vs. Intrinsic Reasonableness**

Sellars distinguishes:
- **Relative reasonableness:** An intention is reasonable *relative to* another intention that implies it
- **Intrinsic/categorical reasonableness:** An intention that is reasonable in itself, not by derivation

The formal intention "Shall [I promote my happiness, all things considered]" is proposed as intrinsically reasonable for individuals (Rational Egoism).

**Platform Implication:** Arguments can be evaluated as:
- Derivatively reasonable (follows from accepted premises)
- Categorically reasonable (ties to fundamental values/principles)

This suggests a layered argumentation structure where some claims trace back to shared fundamental commitments.

**7. We-Referential Intentions and the Moral Point of View**

Sellars's most distinctive contribution: the concept of **we-intentions**.

> "Shall [each of us do A, if in C]"

These are:
- **Intersubjectively shareable:** Any member of "us" can hold the same intention
- **Action we-referential:** Not just about shared outcomes, but about shared action-norms

The moral point of view emerges from:

> "Shall [each of us do that which, in the circumstances, promotes the happiness of each and every one of us, all relevant things considered]"

Where "us" = rational beings generally (not a particular in-group).

**Platform Implication:** This is foundational for group deliberation design:

```typescript
interface WeIntention {
  id: string;
  
  // Who is "us" in this context?
  usScope: 
    | { type: 'organization'; orgId: string }
    | { type: 'team'; teamId: string }
    | { type: 'deliberation-participants' }
    | { type: 'community'; communityId: string }
    | { type: 'universal'; description: 'rational agents' };
  
  // The shared intention
  content: string;
  
  // What this implies for individuals
  individualImplications: Map<UserId, string[]>;
  
  // Subscription status
  subscribers: UserId[];  // Those who accept this we-intention
}

interface WeDeliberation {
  topic: string;
  usScope: WeIntention['usScope'];
  
  // Shared intentions under discussion
  candidateWeIntentions: WeIntention[];
  
  // Individual commitments derived from we-intentions
  derivedIndividualCommitments: Map<UserId, Commitment[]>;
  
  // Tracking: are individual actions consistent with adopted we-intentions?
  consistencyChecks: ConsistencyReport[];
}
```

**8. Point of View and Identification**

> "Who can that be, but rational beings generally?"

The moral point of view is distinguished from mere group identification (e.g., "we WASPs"). The question becomes: what group is it *reasonable* to identify with, all relevant things considered?

**Platform Implication:** Deliberation moderation should help participants:
- Make explicit which "we" they're invoking
- Examine whether the scope is appropriate
- Consider implications for those outside the "we"

---

### Article 2: "On Accepting First Principles" (1988)

**Core Thesis:** The acceptance of first principles (law-like statements, inference tickets) is itself the outcome of practical reasoning, not theoretical demonstration.

#### Key Principles Extracted

**1. Probability as Reasonable Acceptance**

> "An argument for a proposition is good and sufficient if the argument is a logically sound one in terms of its premises and of a suitable form and no better argument is to hand against the proposition at the time."

Probability is analytically tied to reasonable acceptance, not an independent metaphysical property.

**Platform Implication:** Argument evaluation should ask: "Is this a good and sufficient argument *given no better counter-argument to hand*?" This is inherently dialectical.

```typescript
interface ArgumentEvaluation {
  argumentId: string;
  
  // Is the argument logically sound?
  logicalSoundness: boolean;
  
  // Is it of suitable form (valid scheme)?
  formAppropriateness: boolean;
  
  // Are better counter-arguments available?
  counterArgumentsConsidered: {
    counterId: string;
    isBetter: boolean;
    comparison: string;
  }[];
  
  // Conclusion: good and sufficient?
  verdict: 'good-and-sufficient' | 'defeated' | 'indeterminate';
}
```

**2. The Practical Syllogism for Accepting Principles**

Sellars presents a distinctive practical syllogism:

**Major Premise:** I shall believe law-like statements if adequate evidence, given the end in view.
**Minor Premise:** Believing "P law Q" is supported by adequate evidence.
**Conclusion:** I shall believe "P law Q."

Where the *end in view* is: "being in position to draw inferences concerning new cases of P."

**Platform Implication:** Principle acceptance has a teleological structure. We accept principles because they enable future reasoning. This should be made explicit.

```typescript
interface PrincipleAcceptance {
  principle: string;  // "If P then typically Q"
  
  // The end-in-view for accepting this principle
  endInView: {
    futureInferences: string[];  // What reasoning this enables
    scope: 'narrow' | 'broad';   // How widely applicable
    reliability: 'high' | 'moderate' | 'provisional';
  };
  
  // Evidence supporting the principle
  evidence: {
    type: 'observed-regularity' | 'testimony' | 'theoretical' | 'pragmatic';
    strength: number;
    instances: string[];
  };
  
  // Status
  acceptanceStatus: 'working-hypothesis' | 'established' | 'foundational';
}
```

**3. Law-Like Statements as Inference Tickets**

> "Law-like statements are essentially 'inference tickets' — empirically (broadly speaking) based principles which authorize inferring new empirical truths from given empirical truths."

This is central Sellarsian doctrine: laws aren't descriptions of regularities but *rules* authorizing inferences.

**Platform Implication:** Argumentation schemes are inference tickets. They don't describe argument patterns but *authorize* moves in the space of reasons.

```typescript
interface InferenceTicket {
  id: string;
  name: string;
  
  // What inference this authorizes
  authorization: {
    from: PremisePattern[];
    to: ConclusionPattern;
    
    // Conditions under which this ticket is valid
    validityConditions: string[];
    
    // When the ticket is revoked
    revocationConditions: string[];
  };
  
  // The empirical/practical basis for this ticket
  basis: {
    type: 'empirical-regularity' | 'conceptual-truth' | 'practical-necessity' | 'conventional';
    evidence: string[];
    strength: number;
  };
  
  // Metadata
  source: 'Walton' | 'ASPIC+' | 'domain-specific' | 'user-defined';
  domainScope: string[];
}
```

**4. Counter-factuals and Natural Necessity**

The acceptance of law-like statements involves commitment to counter-factuals:

> "To accept 'P law Q' is to be prepared to infer 'Q' from 'P' even in counterfactual contexts."

**Platform Implication:** Accepting a principle implies accepting its counterfactual implications. The platform should surface these.

```typescript
interface CounterfactualCommitment {
  principle: string;  // "If P then Q"
  
  // Implied counterfactual commitments
  counterfactuals: {
    antecedent: string;  // "If it were the case that P..."
    consequent: string;  // "...then it would be the case that Q"
  }[];
  
  // Test cases: would user accept these?
  testCases: {
    scenario: string;
    expected: string;
    userAccepts: boolean | null;
  }[];
}
```

**5. Terminal Outcomes and Acceptance**

> "The terminal outcome of the practical reasoning is the acceptance of the principle, which is not an action but which, like willing, constitutes a proximate and nonrecurrent bringing about."

Accepting a principle is a mental action — a commitment that brings about a state of being-committed.

**Platform Implication:** Principle acceptance should be a first-class action in the platform, not just implicit belief-tracking.

```typescript
interface AcceptanceAction {
  timestamp: Date;
  userId: UserId;
  
  // What was accepted
  content: 
    | { type: 'principle'; principle: string }
    | { type: 'claim'; claimId: ClaimId }
    | { type: 'scheme'; schemeId: SchemeId }
    | { type: 'inference-ticket'; ticketId: string };
  
  // The practical reasoning leading to acceptance
  reasoning: {
    endInView: string;
    evidenceConsidered: string[];
    alternativesConsidered: string[];
  };
  
  // Commitment scope
  scope: 'provisional' | 'working' | 'firm';
  
  // Conditions under which commitment would be withdrawn
  revocationConditions: string[];
}
```

---

### Synthesis: Platform Integration Principles

From these two articles, several design principles emerge:

#### 1. Dual-Track Deliberation

Track both:
- **Theoretical commitments:** What participants believe (factual claims)
- **Practical commitments:** What participants intend (action-oriented claims)

And use S-Imp + So-Be-It to derive implications across both tracks.

#### 2. Scenario-Based Practical Reasoning

For practical deliberations, support:
- Construction of alternative scenarios
- Automatic elaboration with relevant beliefs
- Implication surfacing
- Comparative evaluation
- Decision recording with rationale

#### 3. Principle Acceptance as Practical

Model principle/scheme acceptance as practical reasoning with:
- Explicit end-in-view (what reasoning this enables)
- Evidence tracking
- Counter-factual commitment surfacing
- Revocation conditions

#### 4. We-Intentions as Foundation for Group Deliberation

Structure group deliberation around:
- Explicit "us" scoping
- Shared intention formation
- Individual commitment derivation
- Consistency checking

#### 5. Layered Reasonableness

Distinguish:
- Relative reasonableness (follows from accepted premises)
- Categorical reasonableness (ties to fundamental shared principles)

And surface which layer an argument inhabits.

```typescript
interface SellarsianDeliberationSystem {
  // Theoretical side
  factualClaims: Map<ClaimId, FactualClaim>;
  materialImplications: MaterialImplication[];
  
  // Practical side
  intentions: Map<IntentionId, StructuredIntention>;
  weIntentions: Map<WeIntentionId, WeIntention>;
  
  // Inference machinery
  inferenceTickets: Map<TicketId, InferenceTicket>;
  
  // Scenario space
  scenarios: Map<ScenarioId, DeliberativeScenario>;
  
  // Commitment tracking
  commitments: Map<UserId, {
    factual: FactualCommitment[];
    practical: PracticalCommitment[];
    principled: PrincipleAcceptance[];
  }>;
  
  // Derivation engine
  deriveImplications(userId: UserId): DerivedCommitment[];
  checkConsistency(userId: UserId): ConsistencyReport;
  elaborateScenario(intention: StructuredIntention, beliefs: string[]): DeliberativeScenario;
}

---

## Enhanced Argument Scheme Development

This section develops a comprehensive `EnhancedArgumentScheme` TypeScript model that synthesizes all Sellarsian insights from Parts 1 and 2.

### Design Philosophy

Traditional argumentation scheme models (Walton, ASPIC+) treat schemes as structural templates for argument patterns. A Sellarsian approach goes deeper:

1. **Schemes as Inference Tickets:** Not descriptions of valid patterns, but *authorizations* for moves in the space of reasons
2. **Material vs. Formal:** Schemes encode material (content-sensitive) inference patterns, not just formal logic
3. **Normative Force:** Using a scheme is undertaking a commitment, not just applying a template
4. **Defeasibility Built-In:** Defeat conditions are constitutive of schemes, not exceptions
5. **Practical Integration:** Schemes operate in both theoretical and practical reasoning contexts
6. **Social Constitution:** Scheme validity is grounded in community practice, not abstract correctness

### Core Type Definitions

```typescript
// =============================================================================
// FOUNDATIONAL TYPES
// =============================================================================

type ClaimId = string;
type SchemeId = string;
type UserId = string;
type ArgumentId = string;

/**
 * The domain of reasoning - affects which inferences are licensed
 * From Sellars: theoretical and practical reasoning have distinct logics
 */
type ReasoningDomain = 
  | 'theoretical'    // What is the case (belief-forming)
  | 'practical'      // What to do (intention-forming)
  | 'evaluative'     // What is good/bad (value-forming)
  | 'deontic';       // What is obligatory/permitted (norm-forming)

/**
 * The modality of inference - how strong is the connection?
 * From Sellars's treatment of law-like statements and defeasibility
 */
type InferenceModality = 
  | 'strict'         // Conclusion follows necessarily (rare)
  | 'defeasible'     // Conclusion follows unless defeated
  | 'presumptive'    // Conclusion is presumed in absence of counter-evidence
  | 'abductive';     // Conclusion is best explanation (weakest)

/**
 * Status of a scheme in community practice
 * From "On Accepting First Principles": schemes are accepted through practical reasoning
 */
type SchemeAcceptanceStatus = 
  | 'foundational'   // Constitutive of the domain (rarely questioned)
  | 'established'    // Widely accepted, strong track record
  | 'working'        // Provisionally accepted, under evaluation
  | 'contested'      // Actively disputed in the community
  | 'deprecated';    // Formerly accepted, now rejected

// =============================================================================
// INFERENCE TICKET MODEL
// =============================================================================

/**
 * The core Sellarsian insight: schemes are inference tickets
 * They AUTHORIZE moves, not describe patterns
 */
interface InferenceTicket {
  id: string;
  
  /**
   * What this ticket authorizes: moving from premises to conclusion
   */
  authorization: {
    from: PremiseSlot[];
    to: ConclusionSlot;
    
    /**
     * Domain restrictions - ticket only valid in these contexts
     */
    validDomains: ReasoningDomain[];
    
    /**
     * The strength of the authorized inference
     */
    modality: InferenceModality;
  };
  
  /**
   * The basis for this ticket's authority
   * From "On Accepting First Principles": practical reasoning grounds principle acceptance
   */
  authorityBasis: {
    type: 'empirical-regularity'   // Observed patterns justify the inference
         | 'conceptual-truth'       // Follows from meaning of terms
         | 'practical-necessity'    // Required for practical reasoning to work
         | 'conventional'           // Community agreement
         | 'theoretical';           // Derived from accepted theory
    
    /**
     * What accepting this ticket enables (end-in-view)
     */
    endInView: string;
    
    /**
     * Evidence supporting the ticket's reliability
     */
    evidence: {
      successCases: number;
      failureCases: number;
      qualitativeNotes: string[];
    };
  };
  
  /**
   * Counterfactual commitment
   * From Sellars: accepting a principle means accepting counterfactuals
   */
  counterfactualReach: {
    /**
     * This ticket applies even in hypothetical/counterfactual contexts
     */
    supportsCounterfactuals: boolean;
    
    /**
     * Example counterfactual applications
     */
    exampleCounterfactuals: string[];
  };
}

interface PremiseSlot {
  id: string;
  label: string;
  
  /**
   * What kind of content fills this slot
   */
  contentType: 'factual' | 'evaluative' | 'normative' | 'intentional';
  
  /**
   * Pattern the premise must match (if any)
   */
  pattern?: string;
  
  /**
   * Is this premise required or optional?
   */
  required: boolean;
  
  /**
   * Role in the inference
   */
  role: 'major' | 'minor' | 'backing' | 'qualifier' | 'data';
}

interface ConclusionSlot {
  label: string;
  contentType: 'factual' | 'evaluative' | 'normative' | 'intentional';
  pattern?: string;
  
  /**
   * What kind of speech act the conclusion represents
   */
  forceType: 'assertion' | 'recommendation' | 'intention' | 'evaluation' | 'prescription';
}

// =============================================================================
// DEFEAT CONDITIONS MODEL
// =============================================================================

/**
 * Comprehensive defeat model following ASPIC+ but enhanced with Sellarsian insights
 */
interface DefeatConditions {
  /**
   * Undercutters: attack the inference itself
   * "Even if premises are true, conclusion doesn't follow because..."
   */
  undercutters: Undercutter[];
  
  /**
   * Rebuttals: attack the conclusion directly
   * "The conclusion is false because..."
   */
  rebuttals: RebuttalPattern[];
  
  /**
   * Underminers: attack the premises
   * "The premises are not established because..."
   */
  underminers: UnderminerPattern[];
  
  /**
   * Preference defeaters: the argument is defeated by a stronger one
   * From ASPIC+ last-link principle
   */
  preferenceDefeat: PreferenceDefeatCondition[];
}

interface Undercutter {
  id: string;
  name: string;
  
  /**
   * Description of what undercuts the inference
   */
  description: string;
  
  /**
   * Pattern that, if matched, triggers the undercut
   */
  triggerPattern: string;
  
  /**
   * How much this weakens vs. blocks the inference
   */
  effect: 'blocks' | 'weakens';
  weakeningFactor?: number;  // 0-1, how much strength is reduced
  
  /**
   * Is this undercutter itself defeasible?
   */
  defeasible: boolean;
  
  /**
   * What would defeat this undercutter (second-order defeat)
   */
  counterConditions?: string[];
}

interface RebuttalPattern {
  id: string;
  
  /**
   * Pattern of claims that rebut the conclusion
   */
  pattern: string;
  
  /**
   * Example rebutting claims
   */
  examples: string[];
}

interface UnderminerPattern {
  id: string;
  
  /**
   * Which premise slot this undermines
   */
  targetPremise: string;
  
  /**
   * Pattern of attacks on the premise
   */
  pattern: string;
  
  examples: string[];
}

interface PreferenceDefeatCondition {
  /**
   * What kind of argument would defeat this one
   */
  defeatingArgumentType: string;
  
  /**
   * The preference principle (why that argument wins)
   */
  preferencePrinciple: 'specificity' | 'recency' | 'authority' | 'evidence-strength' | 'custom';
  
  customPrinciple?: string;
}

// =============================================================================
// CRITICAL QUESTIONS MODEL
// =============================================================================

/**
 * Walton's critical questions, enhanced with Sellarsian commitment tracking
 */
interface CriticalQuestion {
  id: string;
  text: string;
  
  /**
   * What aspect of the argument this probes
   */
  target: 'premise' | 'inference' | 'conclusion' | 'authority' | 'relevance';
  
  /**
   * Which specific component
   */
  targetComponent?: string;
  
  /**
   * Default assumption if not asked
   */
  defaultAssumption: 'favorable' | 'unfavorable' | 'neutral';
  
  /**
   * What happens if answered negatively
   */
  negativeAnswerEffect: {
    type: 'undercutting' | 'rebutting' | 'undermining' | 'weakening';
    strength: 'complete' | 'partial';
    explanation: string;
  };
  
  /**
   * Burden of proof for this question
   */
  burdenOfProof: 'proponent' | 'opponent' | 'shared';
  
  /**
   * Sellarsian addition: what commitment does asking/answering create?
   */
  commitmentImplications: {
    askingCreates?: string[];    // Commitments created by asking
    affirmativeCreates?: string[];  // Commitments created by "yes"
    negativeCreates?: string[];     // Commitments created by "no"
  };
}

// =============================================================================
// MATERIAL INFERENCE MODEL
// =============================================================================

/**
 * Sellarsian material inferences that may be encoded in schemes
 * These are content-sensitive, not purely formal
 */
interface MaterialInferenceComponent {
  /**
   * The domain-specific inferential connections
   */
  connections: MaterialConnection[];
  
  /**
   * Conceptual dependencies - what concepts must be understood
   */
  conceptualPrerequisites: string[];
  
  /**
   * Domain constraints - where this material inference is valid
   */
  domainConstraints: {
    validDomains: string[];
    invalidDomains: string[];
    crossDomainWarnings: string[];
  };
}

interface MaterialConnection {
  from: string;  // Premise pattern
  to: string;    // Conclusion pattern
  
  /**
   * The material warrant - why this inference holds in this domain
   */
  warrant: string;
  
  /**
   * Whether this is meaning-constitutive
   */
  meaningConstitutive: boolean;
  
  /**
   * Exceptions where the inference fails
   */
  exceptions: string[];
}

// =============================================================================
// PRACTICAL REASONING INTEGRATION
// =============================================================================

/**
 * From "On Reasoning about Values": schemes can operate on intentions, not just beliefs
 */
interface PracticalReasoningComponent {
  /**
   * Can this scheme be used for practical (intention-forming) reasoning?
   */
  supportsPracticalReasoning: boolean;
  
  /**
   * The practical variant of this scheme (if different from theoretical)
   */
  practicalVariant?: {
    /**
     * S-Imp transformation: how logical implications become practical implications
     */
    sImpTransformation: {
      theoreticalForm: string;   // "If P then Q"
      practicalForm: string;     // "If shall-P then shall-Q"
    };
    
    /**
     * What kind of practical conclusion
     */
    practicalConclusionType: 'intention' | 'recommendation' | 'ought' | 'permission';
  };
  
  /**
   * So-Be-It integration: how factual beliefs enter practical reasoning
   */
  soBeItIntegration: {
    /**
     * Which premises can be factual beliefs incorporated into intention-content
     */
    factualPremiseSlots: string[];
    
    /**
     * How the conclusion changes when facts are incorporated
     */
    elaborationPattern: string;
  };
  
  /**
   * Scenario elaboration: how this scheme contributes to alternative scenarios
   */
  scenarioRole: {
    /**
     * Does this scheme help construct scenarios?
     */
    constructsScenarios: boolean;
    
    /**
     * Does this scheme help compare scenarios?
     */
    comparesScenarios: boolean;
    
    /**
     * Does this scheme help choose between scenarios?
     */
    decidesScenarios: boolean;
  };
}

// =============================================================================
// WE-INTENTION SUPPORT
// =============================================================================

/**
 * From "On Reasoning about Values": schemes for group deliberation
 */
interface WeIntentionComponent {
  /**
   * Can this scheme operate on we-intentions?
   */
  supportsWeIntentions: boolean;
  
  /**
   * How individual and group reasoning relate
   */
  aggregationLogic?: {
    /**
     * How individual instances combine
     */
    aggregationType: 'unanimous' | 'majoritarian' | 'representative' | 'deliberative';
    
    /**
     * The transition from "we intend" to "I intend"
     */
    weToIDerivation: string;
    
    /**
     * What consistency is required among participants
     */
    consistencyRequirements: string[];
  };
  
  /**
   * Scope of "we" that this scheme assumes
   */
  usScope: 'team' | 'organization' | 'community' | 'universal' | 'context-dependent';
}

// =============================================================================
// NORMATIVE STRUCTURE
// =============================================================================

/**
 * The normative commitments created by using a scheme
 * From Sellars: being in the space of reasons means undertaking commitments
 */
interface NormativeStructure {
  /**
   * Commitments created by asserting the premises
   */
  premiseCommitments: CommitmentSpec[];
  
  /**
   * Commitments created by drawing the conclusion
   */
  conclusionCommitments: CommitmentSpec[];
  
  /**
   * Entitlements required to use this scheme
   */
  requiredEntitlements: EntitlementSpec[];
  
  /**
   * Entitlements transmitted by successful use
   */
  transmittedEntitlements: EntitlementSpec[];
  
  /**
   * Incompatibility commitments (what you're committed to denying)
   */
  incompatibilityCommitments: string[];
}

interface CommitmentSpec {
  content: string;
  type: 'assertional' | 'inferential' | 'practical';
  strength: 'full' | 'prima-facie' | 'ceteris-paribus';
  
  /**
   * Can this commitment be withdrawn, and under what conditions?
   */
  defeasibility: {
    defeasible: boolean;
    withdrawalConditions?: string[];
  };
}

interface EntitlementSpec {
  content: string;
  source: 'testimony' | 'observation' | 'inference' | 'default' | 'authority';
  
  /**
   * Is the entitlement challenged by default?
   */
  defaultChallenged: boolean;
}

// =============================================================================
// STEREOSCOPIC INTEGRATION
// =============================================================================

/**
 * From Sellars's stereoscopic view: integrating manifest and scientific images
 */
interface StereoscopicComponent {
  /**
   * How this scheme relates to manifest-image reasoning
   */
  manifestImageAspect: {
    /**
     * Folk concepts and intuitions this scheme captures
     */
    folkConceptsEngaged: string[];
    
    /**
     * Common-sense validity
     */
    commonSenseValidity: 'high' | 'moderate' | 'low' | 'counter-intuitive';
  };
  
  /**
   * How this scheme relates to scientific-image reasoning
   */
  scientificImageAspect: {
    /**
     * Scientific concepts or findings that ground this scheme
     */
    scientificBases: string[];
    
    /**
     * Empirical validation status
     */
    empiricalValidation: 'well-validated' | 'partially-validated' | 'theoretical' | 'folk-only';
  };
  
  /**
   * Integration guidance
   */
  integrationNotes: string;
}

// =============================================================================
// THE ENHANCED ARGUMENT SCHEME
// =============================================================================

/**
 * The complete Enhanced Argument Scheme model
 * Synthesizes Walton schemes, ASPIC+, and Sellarsian philosophy
 */
interface EnhancedArgumentScheme {
  // --- IDENTITY ---
  id: SchemeId;
  name: string;
  description: string;
  version: string;
  
  // --- CLASSIFICATION ---
  category: SchemeCategory;
  subcategory?: string;
  tags: string[];
  
  // --- THE INFERENCE TICKET (Core) ---
  inferenceTicket: InferenceTicket;
  
  // --- DEFEAT CONDITIONS ---
  defeatConditions: DefeatConditions;
  
  // --- CRITICAL QUESTIONS ---
  criticalQuestions: CriticalQuestion[];
  
  // --- MATERIAL INFERENCE ---
  materialInference: MaterialInferenceComponent;
  
  // --- PRACTICAL REASONING ---
  practicalReasoning: PracticalReasoningComponent;
  
  // --- WE-INTENTIONS ---
  weIntentions: WeIntentionComponent;
  
  // --- NORMATIVE STRUCTURE ---
  normativeStructure: NormativeStructure;
  
  // --- STEREOSCOPIC INTEGRATION ---
  stereoscopic: StereoscopicComponent;
  
  // --- METADATA ---
  metadata: SchemeMetadata;
}

type SchemeCategory = 
  | 'source-based'           // Expert, witness, etc.
  | 'rule-based'             // From rule to case
  | 'causal'                 // Cause-effect reasoning
  | 'practical'              // Means-end, goal-based
  | 'evaluative'             // Value arguments
  | 'classificatory'         // Definition, verbal classification
  | 'analogical'             // Analogy, precedent
  | 'abductive'              // Best explanation
  | 'epistemic'              // Knowledge, belief
  | 'deontic';               // Obligation, permission

interface SchemeMetadata {
  /**
   * Source of this scheme
   */
  source: {
    type: 'Walton' | 'ASPIC+' | 'Toulmin' | 'custom' | 'derived';
    reference?: string;
    originalName?: string;
  };
  
  /**
   * Acceptance status in the community
   */
  acceptanceStatus: SchemeAcceptanceStatus;
  
  /**
   * Usage statistics
   */
  usage: {
    applicationCount: number;
    successRate: number;  // How often applications are undefeated
    avgStrength: number;  // Average evaluated strength
  };
  
  /**
   * Versioning
   */
  history: {
    created: Date;
    lastModified: Date;
    changelog: { date: Date; description: string }[];
  };
  
  /**
   * Related schemes
   */
  relations: {
    specializes?: SchemeId[];    // This is a specialization of...
    generalizes?: SchemeId[];    // This generalizes...
    conflicts?: SchemeId[];      // This conflicts with...
    complements?: SchemeId[];    // This complements...
  };
}

// =============================================================================
// SCHEME APPLICATION
// =============================================================================

/**
 * An instance of a scheme being applied in actual argumentation
 */
interface SchemeApplication {
  id: ArgumentId;
  schemeId: SchemeId;
  
  /**
   * The filled-in premises
   */
  premises: {
    slotId: string;
    claimId: ClaimId;
    content: string;
  }[];
  
  /**
   * The derived conclusion
   */
  conclusion: {
    claimId: ClaimId;
    content: string;
  };
  
  /**
   * Commitments undertaken by this application
   */
  commitmentsCreated: CommitmentSpec[];
  
  /**
   * Critical questions status
   */
  criticalQuestionResponses: {
    questionId: string;
    status: 'unanswered' | 'affirmative' | 'negative' | 'contested';
    response?: string;
  }[];
  
  /**
   * Defeat status
   */
  defeatStatus: {
    isDefeated: boolean;
    defeatingArguments: ArgumentId[];
    defeatType?: 'undercut' | 'rebut' | 'undermine' | 'preference';
  };
  
  /**
   * Evaluated strength
   */
  evaluatedStrength: {
    baseStrength: number;        // From scheme's default
    adjustedStrength: number;    // After critical questions, partial defeats
    confidenceInterval: [number, number];
  };
  
  /**
   * Practical reasoning context (if applicable)
   */
  practicalContext?: {
    partOfScenario: string;
    contributesToIntention: string;
    isWeReferential: boolean;
  };
}
```

### Example: Argument from Expert Opinion (Sellarsianized)

```typescript
const expertOpinionScheme: EnhancedArgumentScheme = {
  id: 'scheme-expert-opinion-v2',
  name: 'Argument from Expert Opinion',
  description: 'Inference from expert testimony to the truth of their claim in their domain of expertise',
  version: '2.0.0',
  
  category: 'source-based',
  subcategory: 'testimony',
  tags: ['authority', 'expertise', 'testimony', 'source-based'],
  
  inferenceTicket: {
    id: 'ticket-expert-opinion',
    authorization: {
      from: [
        { id: 'E', label: 'Expert claim', contentType: 'factual', required: true, role: 'data' },
        { id: 'D', label: 'Domain specification', contentType: 'factual', required: true, role: 'backing' },
        { id: 'C', label: 'Expertise credentials', contentType: 'factual', required: true, role: 'backing' }
      ],
      to: {
        label: 'Proposition asserted by expert',
        contentType: 'factual',
        forceType: 'assertion'
      },
      validDomains: ['theoretical', 'evaluative'],
      modality: 'defeasible'
    },
    authorityBasis: {
      type: 'empirical-regularity',
      endInView: 'Leveraging division of epistemic labor - we cannot verify everything ourselves',
      evidence: {
        successCases: 0,  // Populated from platform data
        failureCases: 0,
        qualitativeNotes: ['Fundamental to social epistemology', 'Requires trust calibration']
      }
    },
    counterfactualReach: {
      supportsCounterfactuals: true,
      exampleCounterfactuals: [
        'If Dr. Smith had said X instead, we would have reason to believe X',
        'Had the expert been in a different field, the testimony would not apply'
      ]
    }
  },
  
  defeatConditions: {
    undercutters: [
      {
        id: 'uc-bias',
        name: 'Bias undercutter',
        description: 'Expert has a relevant bias that could affect their judgment',
        triggerPattern: 'Expert has [financial/ideological/personal] interest in the conclusion',
        effect: 'weakens',
        weakeningFactor: 0.5,
        defeasible: true,
        counterConditions: ['Bias is disclosed and accounted for', 'Other experts with different biases agree']
      },
      {
        id: 'uc-outside-domain',
        name: 'Outside domain undercutter',
        description: 'Expert is speaking outside their area of expertise',
        triggerPattern: 'Claim is about [domain] but expert is in [different domain]',
        effect: 'blocks',
        defeasible: true,
        counterConditions: ['Domains are relevantly connected', 'Expert has cross-domain credentials']
      }
    ],
    rebuttals: [
      {
        id: 'reb-contrary-evidence',
        pattern: 'Direct evidence contradicts the expert claim',
        examples: ['Experimental results show opposite', 'Observable facts contradict']
      },
      {
        id: 'reb-contrary-expert',
        pattern: 'Equally or more qualified expert asserts the contrary',
        examples: ['Dr. Jones (same credentials) asserts not-P']
      }
    ],
    underminers: [
      {
        id: 'um-credentials',
        targetPremise: 'C',
        pattern: 'Credentials are fabricated, expired, or irrelevant',
        examples: ['Degree from diploma mill', 'Credentials in unrelated field']
      },
      {
        id: 'um-domain',
        targetPremise: 'D',
        pattern: 'Domain specification is incorrect',
        examples: ['This is not actually a question in domain D']
      }
    ],
    preferenceDefeat: [
      {
        defeatingArgumentType: 'Argument from more qualified expert',
        preferencePrinciple: 'authority'
      },
      {
        defeatingArgumentType: 'Argument from direct evidence',
        preferencePrinciple: 'evidence-strength'
      }
    ]
  },
  
  criticalQuestions: [
    {
      id: 'cq1',
      text: 'Is E a genuine expert in domain D?',
      target: 'premise',
      targetComponent: 'C',
      defaultAssumption: 'favorable',
      negativeAnswerEffect: {
        type: 'undermining',
        strength: 'complete',
        explanation: 'Without genuine expertise, testimony has no special epistemic weight'
      },
      burdenOfProof: 'opponent',
      commitmentImplications: {
        affirmativeCreates: ['E is expert in D', 'E\'s credentials in D are valid'],
        negativeCreates: ['E is not an expert in D']
      }
    },
    {
      id: 'cq2',
      text: 'Is the claim within E\'s domain of expertise?',
      target: 'relevance',
      defaultAssumption: 'favorable',
      negativeAnswerEffect: {
        type: 'undercutting',
        strength: 'complete',
        explanation: 'Expert opinion only has weight within the domain of expertise'
      },
      burdenOfProof: 'opponent',
      commitmentImplications: {
        askingCreates: ['Domain boundaries may be unclear'],
        affirmativeCreates: ['The claim falls within D'],
        negativeCreates: ['The claim is outside D']
      }
    },
    {
      id: 'cq3',
      text: 'Is E biased or influenced by interests?',
      target: 'inference',
      defaultAssumption: 'favorable',
      negativeAnswerEffect: {
        type: 'weakening',
        strength: 'partial',
        explanation: 'Bias weakens but does not eliminate testimonial weight'
      },
      burdenOfProof: 'opponent',
      commitmentImplications: {
        affirmativeCreates: ['E has bias regarding this claim', 'Bias may affect judgment'],
        negativeCreates: ['E is unbiased regarding this claim']
      }
    },
    {
      id: 'cq4',
      text: 'Do other experts in D agree?',
      target: 'premise',
      targetComponent: 'E',
      defaultAssumption: 'neutral',
      negativeAnswerEffect: {
        type: 'weakening',
        strength: 'partial',
        explanation: 'Disagreement among experts reduces confidence'
      },
      burdenOfProof: 'shared',
      commitmentImplications: {
        affirmativeCreates: ['Expert consensus supports E\'s claim'],
        negativeCreates: ['Expert opinion is divided on this claim']
      }
    },
    {
      id: 'cq5',
      text: 'Is E\'s assertion based on evidence?',
      target: 'inference',
      defaultAssumption: 'favorable',
      negativeAnswerEffect: {
        type: 'weakening',
        strength: 'partial',
        explanation: 'Unsupported assertions have less weight than evidence-based claims'
      },
      burdenOfProof: 'proponent',
      commitmentImplications: {
        affirmativeCreates: ['E\'s claim is evidence-based'],
        negativeCreates: ['E\'s claim is speculation or intuition']
      }
    }
  ],
  
  materialInference: {
    connections: [
      {
        from: 'E says P in domain D where E is expert',
        to: 'P is likely true',
        warrant: 'Expertise confers reliable judgment in the domain',
        meaningConstitutive: false,
        exceptions: ['E is biased', 'E is lying', 'D has low expert reliability', 'This is outside D']
      }
    ],
    conceptualPrerequisites: ['expertise', 'domain', 'testimony', 'reliability'],
    domainConstraints: {
      validDomains: ['science', 'medicine', 'law', 'engineering', 'scholarship'],
      invalidDomains: ['pure logic', 'personal taste', 'moral foundations'],
      crossDomainWarnings: ['Expertise rarely transfers across domains', 'Beware appeals to general "intelligence"']
    }
  },
  
  practicalReasoning: {
    supportsPracticalReasoning: true,
    practicalVariant: {
      sImpTransformation: {
        theoreticalForm: 'Expert says P is true → We have reason to believe P',
        practicalForm: 'Expert recommends action A → We have reason to intend A'
      },
      practicalConclusionType: 'recommendation'
    },
    soBeItIntegration: {
      factualPremiseSlots: ['E', 'D', 'C'],
      elaborationPattern: 'Shall be [we follow expert recommendation, given that E is expert and recommends A]'
    },
    scenarioRole: {
      constructsScenarios: false,
      comparesScenarios: true,  // Can be used to evaluate scenarios
      decidesScenarios: false
    }
  },
  
  weIntentions: {
    supportsWeIntentions: true,
    aggregationLogic: {
      aggregationType: 'deliberative',
      weToIDerivation: 'If we accept expert testimony, each of us should act accordingly',
      consistencyRequirements: ['All must accept the same expert as authoritative', 'All must agree on domain boundaries']
    },
    usScope: 'context-dependent'
  },
  
  normativeStructure: {
    premiseCommitments: [
      { content: 'E is an expert in D', type: 'assertional', strength: 'full', defeasibility: { defeasible: true, withdrawalConditions: ['Evidence of false credentials'] } },
      { content: 'E asserted P', type: 'assertional', strength: 'full', defeasibility: { defeasible: true, withdrawalConditions: ['Misquotation shown'] } },
      { content: 'P is within domain D', type: 'assertional', strength: 'full', defeasibility: { defeasible: true, withdrawalConditions: ['Domain analysis shows otherwise'] } }
    ],
    conclusionCommitments: [
      { content: 'P is likely true', type: 'assertional', strength: 'prima-facie', defeasibility: { defeasible: true, withdrawalConditions: ['Counter-evidence', 'Counter-expertise'] } }
    ],
    requiredEntitlements: [
      { content: 'E is an expert', source: 'testimony', defaultChallenged: false },
      { content: 'E said P', source: 'observation', defaultChallenged: false }
    ],
    transmittedEntitlements: [
      { content: 'Belief that P', source: 'inference', defaultChallenged: true }
    ],
    incompatibilityCommitments: ['E is not an expert', 'E did not assert P', 'P is outside D']
  },
  
  stereoscopic: {
    manifestImageAspect: {
      folkConceptsEngaged: ['trust', 'authority', 'specialized knowledge'],
      commonSenseValidity: 'high'
    },
    scientificImageAspect: {
      scientificBases: ['social epistemology', 'division of cognitive labor', 'reliability theory'],
      empiricalValidation: 'partially-validated'
    },
    integrationNotes: 'Well-grounded in both folk epistemology and formal social epistemology. Key insight: expertise is domain-specific and reliability varies by field.'
  },
  
  metadata: {
    source: { type: 'Walton', reference: 'Walton, Reed & Macagno (2008)', originalName: 'Argument from Expert Opinion' },
    acceptanceStatus: 'established',
    usage: { applicationCount: 0, successRate: 0, avgStrength: 0 },
    history: { created: new Date(), lastModified: new Date(), changelog: [] },
    relations: {
      specializes: ['scheme-testimony-basic'],
      generalizes: [],
      conflicts: [],
      complements: ['scheme-ad-verecundiam-fallacy']
    }
  }
};
```

---

### Scheme Validation and Consistency Checking

```typescript
/**
 * Validates an EnhancedArgumentScheme for internal consistency
 */
function validateScheme(scheme: EnhancedArgumentScheme): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Check all critical questions target valid components
  for (const cq of scheme.criticalQuestions) {
    if (cq.targetComponent) {
      const validSlots = scheme.inferenceTicket.authorization.from.map(p => p.id);
      if (!validSlots.includes(cq.targetComponent)) {
        errors.push(`CQ ${cq.id} targets non-existent slot ${cq.targetComponent}`);
      }
    }
  }
  
  // 2. Check underminer patterns reference valid premises
  for (const um of scheme.defeatConditions.underminers) {
    const validSlots = scheme.inferenceTicket.authorization.from.map(p => p.id);
    if (!validSlots.includes(um.targetPremise)) {
      errors.push(`Underminer ${um.id} targets non-existent premise ${um.targetPremise}`);
    }
  }
  
  // 3. Check practical reasoning consistency
  if (scheme.practicalReasoning.supportsPracticalReasoning) {
    if (!scheme.inferenceTicket.authorization.validDomains.includes('practical')) {
      warnings.push('Scheme supports practical reasoning but domain list excludes "practical"');
    }
  }
  
  // 4. Check we-intention consistency
  if (scheme.weIntentions.supportsWeIntentions && !scheme.practicalReasoning.supportsPracticalReasoning) {
    warnings.push('Scheme supports we-intentions but not practical reasoning - unusual combination');
  }
  
  // 5. Check normative structure completeness
  if (scheme.normativeStructure.premiseCommitments.length !== 
      scheme.inferenceTicket.authorization.from.filter(p => p.required).length) {
    warnings.push('Number of premise commitments does not match required premise slots');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

## Mesh Component Mapping

This section maps each major Mesh platform component to Sellarsian philosophical concepts, providing a principled theoretical grounding for the data model.

### Mapping Overview

| Mesh Component | Sellarsian Concept | Key Insight |
|----------------|-------------------|-------------|
| **Claim** | Entry in the space of reasons | Truth-apt, citable node with normative status |
| **ClaimEdge** | Material inference relation | Content-sensitive inferential connection |
| **Argument** | Complex inferential move | Authored pattern-governed behavior |
| **ArgumentEdge** | Attack on inferential connection | Challenging warrants, not just conclusions |
| **ArgumentScheme** | Inference ticket | Authorization for moves, not description |
| **Deliberation** | Bounded space of reasons | Scoped normative domain |
| **ClaimLabel** | Normative status (IN/OUT/UNDEC) | What's entitled within this game |
| **CriticalQuestion** | Probe of material inference | Challenging the warrant |
| **DialogueMove** | Pattern-governed speech act | Functional role in language game |
| **Proposition → Claim** | Entry into the space of reasons | From causal order to normative order |

---

### Component-by-Component Mapping

#### 1. Claim

**Mesh Definition:** The fundamental unit of assertion; structured, persistent, semantically labeled.

**Sellarsian Analysis:**

A Claim is an *entry in the space of reasons*. From Essay 1:

> "In characterizing an episode or a state as that of knowing, we are not giving an empirical description of that episode or state; we are placing it in the logical space of reasons, of justifying and being able to justify what one says."

The Claim is the platform's way of "placing" a user's assertion in the logical space. Key properties:

| Claim Property | Sellarsian Grounding |
|----------------|---------------------|
| `text` | The *signifying* aspect — linguistic expression |
| `claimType` | Functional classification (Agent, Assertion, Domain) |
| `edgesFrom/edgesTo` | Inferential articulation — what it supports/attacks |
| `ClaimLabel` (IN/OUT/UNDEC) | Normative status in current game state |
| `negatesClaimId` | Material contrariety relation |
| `canonicalClaimId` | Cross-context identity (same claim in different deliberations) |

**The Claim as Inferentially Articulated:**

A Claim's meaning isn't intrinsic to its text — it's constituted by its inferential relations:
- What can be inferred FROM it (`edgesFrom`)
- What can be inferred TO it (`edgesTo`)
- What it is CONTRARY to (`negatesClaimId`, attack edges)

```typescript
// Sellarsian interpretation of Claim
interface SellarsianClaim {
  // The signifying aspect
  text: string;
  
  // Inferential role (what makes it mean what it means)
  inferentialRole: {
    // What follows from asserting this
    commitments: ClaimId[];      // What you're committed to if you assert this
    
    // What's incompatible with this
    incompatibilities: ClaimId[]; // What you can't also hold
    
    // What would entitle you to this
    entitlers: ClaimId[];         // What would justify this claim
  };
  
  // Normative status (game-relative)
  normativeStatus: {
    label: 'IN' | 'OUT' | 'UNDEC';
    semantics: 'grounded' | 'preferred' | 'hybrid';
    inDeliberation: DeliberationId;
  };
  
  // Cross-context identity
  canonicalIdentity?: CanonicalClaimId;
}
```

**Platform Design Implications:**

1. **Claims are not standalone objects** — they're nodes in an inferential web
2. **Claim meaning is deliberation-relative** — same text can have different inferential roles in different contexts
3. **ClaimLabel tracks normative status** — not truth, but entitlement in current game state
4. **CanonicalClaim enables cross-context tracking** — how "the same claim" functions differently in different spaces

---

#### 2. ClaimEdge

**Mesh Definition:** Typed link between claims (supports/rebuts) with refined attack types (SUPPORTS, REBUTS, UNDERCUTS, UNDERMINES) and target scope (premise/inference/conclusion).

**Sellarsian Analysis:**

ClaimEdges encode *material inference patterns* — the content-sensitive connections that constitute meaning. From Essay 1:

> "Material transformation rules determine descriptive meaning within the logical framework."

The ClaimEdge types map directly to Sellarsian concepts:

| ClaimEdge Type | Sellarsian Concept | What It Attacks |
|----------------|-------------------|-----------------|
| `SUPPORTS` | Material inference | — (not an attack) |
| `REBUTS` | Material contrariety | The conclusion itself |
| `UNDERCUTS` | Warrant attack | The inference rule/license |
| `UNDERMINES` | Premise attack | The grounds for inference |

**UNDERCUT as Warrant Attack:**

Undercutting is distinctively Sellarsian. From "On Accepting First Principles":

> "Law-like statements are essentially 'inference tickets' — empirically (broadly speaking) based principles which authorize inferring."

When you undercut, you're attacking the *ticket* — the principle that licenses the inference — not the conclusion directly.

```typescript
// Sellarsian interpretation of ClaimEdge
interface SellarsianClaimEdge {
  fromClaimId: ClaimId;
  toClaimId: ClaimId;
  
  // What kind of inferential relation
  relationType: 'support' | 'attack';
  
  // For attacks: what aspect is targeted
  attackAnalysis: {
    type: 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES';
    
    // Sellarsian interpretation
    sellarsianMeaning: 
      | 'material-contrariety'      // REBUTS: claims are incompatible
      | 'inference-ticket-revocation' // UNDERCUTS: the licensing rule fails
      | 'premise-undermining';       // UNDERMINES: grounds are false
    
    // What the attacker is committed to
    attackerCommitments: string[];
    
    // What would defeat this attack
    counterConditions: string[];
  };
  
  targetScope: 'premise' | 'inference' | 'conclusion';
}
```

**Platform Design Implications:**

1. **UNDERCUT needs special UI** — users need to understand they're attacking "the inference step" not just "the claim"
2. **Attack types create different commitments** — rebutting P commits you to not-P; undercutting commits you to "inference invalid"
3. **Material inference is domain-sensitive** — what counts as undercutting varies by domain
4. **Edges are the meaning** — the graph of edges IS the inferential articulation

---

#### 3. Argument

**Mesh Definition:** An authored line of reasoning linking premises to a conclusion, potentially with scheme and modality.

**Sellarsian Analysis:**

An Argument is *pattern-governed linguistic behavior* — an authored performance following (and potentially innovating on) established inference patterns. From Essay 9:

> "The essential feature of rule-governed behavior, as distinct from merely conforming behavior, is not the 'presence of a rule' but the pattern of performance, the coherence with the rules that constitute the practice."

Key Argument properties in Sellarsian terms:

| Argument Property | Sellarsian Grounding |
|-------------------|---------------------|
| `premises` | The grounds appealed to |
| `conclusionClaimId` | The commitment undertaken |
| `schemeId` | The inference ticket being invoked |
| `quantifier` (SOME/MANY/MOST/ALL) | Scope of the material inference |
| `modality` (COULD/LIKELY/NECESSARY) | Strength of the inference |
| `isImplicit` | Enthymematic — relies on shared background |
| `implicitWarrant` | The unexpressed inference ticket |

**Argument as Commitment-Undertaking:**

Creating an Argument is a *normative act* — you're undertaking commitments and claiming entitlements.

```typescript
// Sellarsian interpretation of Argument
interface SellarsianArgument {
  id: ArgumentId;
  authorId: UserId;
  
  // The inferential structure
  structure: {
    premises: ClaimId[];
    conclusion: ClaimId;
    
    // The inference ticket invoked
    inferenceTicket: {
      schemeId?: SchemeId;        // Explicit scheme
      implicitWarrant?: string;    // Enthymematic warrant
    };
    
    // Modality of the inference
    inferenceStrength: {
      quantifier: 'SOME' | 'MANY' | 'MOST' | 'ALL';
      modality: 'COULD' | 'LIKELY' | 'NECESSARY';
    };
  };
  
  // Normative status of this argumentative act
  normativeStatus: {
    // Commitments the author undertakes by making this argument
    commitmentsUndertaken: string[];
    
    // Entitlements the author claims
    entitlementsClaimed: string[];
    
    // What challenging this argument challenges
    challengeableAspects: ('premise' | 'inference' | 'conclusion')[];
  };
  
  // Is this following a pattern or innovating?
  patternRelation: 'conforming' | 'extending' | 'innovating';
}
```

**The Enthymeme and Background:**

`isImplicit` and `implicitWarrant` capture the Sellarsian insight that most inference relies on *shared background*:

> "To be in the space of reasons is to have mastered a pattern of inferences that is largely tacit."

Platform implications:
1. **Track implicit premises** — `AssumptionUse` model makes hidden premises explicit
2. **Warrant reconstruction** — help users articulate what inference rule they're relying on
3. **Scheme suggestion** — when no explicit scheme, suggest what pattern the argument follows

---

#### 4. ArgumentEdge

**Mesh Definition:** Typed link between arguments with attack subtypes and target scope.

**Sellarsian Analysis:**

ArgumentEdge refines ClaimEdge by targeting *arguments as structured wholes*. This captures the Sellarsian insight that arguments have internal structure that can be attacked at different points.

| ArgumentEdge Type | Target | Sellarsian Analysis |
|-------------------|--------|---------------------|
| `REBUT` | conclusion | Attack on the claim itself |
| `UNDERCUT` | inference | Attack on the inference ticket |
| `UNDERMINE` | premise | Attack on the grounds |
| `SUPPORT_ATTACK` | support relation | Attack on a supporting connection |
| `JUSTIFICATION_ATTACK` | backing | Attack on the authority of the scheme |

**Targeting Warrants:**

`targetInferenceId` enables targeting specific inference steps within an argument diagram. This is pure Sellars:

> "The inference rule is not a super-premise but a *license* that can itself be challenged."

```typescript
// Sellarsian interpretation of ArgumentEdge
interface SellarsianArgumentEdge {
  fromArgumentId: ArgumentId;
  toArgumentId: ArgumentId;
  
  // What kind of attack
  attackType: ArgumentAttackSubtype;
  
  // Fine-grained targeting
  target: {
    scope: 'conclusion' | 'premise' | 'inference';
    
    // For premise attacks: which premise
    targetPremiseId?: ClaimId;
    
    // For inference attacks: which inference step
    targetInferenceId?: InferenceId;
    
    // For CQ-triggered attacks
    cqKey?: string;
  };
  
  // What this attack does in Sellarsian terms
  sellarsianEffect: {
    type: 'blocks-inference-ticket' | 'establishes-contrariety' | 'undermines-grounds';
    
    // If successful, what happens to target's normative status
    successEffect: 'defeats' | 'weakens' | 'suspends';
  };
}
```

---

#### 5. ArgumentScheme

**Mesh Definition:** Templates for argument patterns (expert opinion, analogy, consequence, etc.) with critical questions.

**Sellarsian Analysis:**

From "On Accepting First Principles":

> "Law-like statements are essentially 'inference tickets' — empirically (broadly speaking) based principles which authorize inferring new empirical truths from given empirical truths."

ArgumentSchemes ARE inference tickets. They don't describe patterns — they *authorize* moves.

| Scheme Property | Sellarsian Grounding |
|-----------------|---------------------|
| `key`, `name` | Functional classification of the ticket |
| `cq` (critical questions) | Built-in defeasibility conditions |
| `purpose` | What end-in-view this ticket serves |
| `reasoningType` | Modality of licensed inference |
| `slotHints`, `validators` | Conditions for valid ticket use |

**Scheme Acceptance as Practical Reasoning:**

From "On Accepting First Principles," accepting a scheme is itself the outcome of practical reasoning:

> "The terminal outcome of the practical reasoning is the acceptance of the principle."

The platform should track:
1. Which schemes are accepted in which deliberations
2. What evidence supports each scheme
3. When schemes should be re-evaluated

```typescript
// Sellarsian interpretation of ArgumentScheme
interface SellarsianScheme {
  // Identity
  id: SchemeId;
  key: string;
  name: string;
  
  // The authorization structure
  authorization: {
    // What pattern of premises
    premiseSlots: PremiseSlot[];
    
    // What conclusion is licensed
    conclusionPattern: ConclusionPattern;
    
    // Modality of the inference
    modality: 'deductive' | 'presumptive' | 'defeasible' | 'abductive';
  };
  
  // Defeasibility built in
  criticalQuestions: {
    id: string;
    text: string;
    target: 'premise' | 'inference' | 'conclusion';
    defaultAnswer: boolean;
    defeatType: 'undercut' | 'rebut' | 'undermine';
  }[];
  
  // Acceptance status (tracked per deliberation)
  acceptanceInDeliberation: Map<DeliberationId, {
    status: 'foundational' | 'established' | 'working' | 'contested';
    evidence: string[];
    lastEvaluated: Date;
  }>;
  
  // What end-in-view does this scheme serve?
  endInView: string;
}
```

---

#### 6. Deliberation

**Mesh Definition:** A bounded collaborative discourse with structure, memory, and governance.

**Sellarsian Analysis:**

A Deliberation is a *bounded space of reasons* — a scoped normative domain where certain claims, inferences, and rules are in play.

From the stereoscopic view: a Deliberation is both:
- A **social practice** (manifest image) — people talking, arguing, deciding
- A **formal game** (scientific image) — argumentation framework with semantics

| Deliberation Property | Sellarsian Grounding |
|-----------------------|---------------------|
| Bounded scope | Finite space of reasons with entry/exit |
| Claims, Arguments | The populated space |
| ClaimLabels | Normative statuses (what's IN/OUT/UNDEC) |
| ProofMode | Burden structure (asymmetric = Proponent must prove) |
| DialogueMoves | The gameplay of reason-giving |

**Deliberation as We-Intention Context:**

From "On Reasoning about Values," deliberations are the site of *we-intentions*:

> "Shall [each of us do that which, in the circumstances, promotes the well-being of each and every one of us]"

The deliberation defines:
- Who is "us" (participants)
- What we're deliberating about (topic claims)
- What rules govern our interaction (schemes, proof mode)

```typescript
// Sellarsian interpretation of Deliberation
interface SellarsianDeliberation {
  id: DeliberationId;
  
  // The bounded space
  space: {
    claims: ClaimId[];
    arguments: ArgumentId[];
    edges: EdgeId[];
  };
  
  // The "us" of this deliberation
  usScope: {
    participants: UserId[];
    // What makes someone a participant
    membershipCriteria: string;
  };
  
  // The topic (focal claims)
  focalClaims: ClaimId[];
  
  // The rules of the game
  gameRules: {
    proofMode: 'symmetric' | 'asymmetric';
    acceptedSchemes: SchemeId[];
    burdenDefaults: Map<'proponent' | 'opponent', BurdenSpec>;
  };
  
  // Current game state
  gameState: {
    // What's currently IN/OUT/UNDEC
    claimLabels: Map<ClaimId, 'IN' | 'OUT' | 'UNDEC'>;
    
    // What moves are available
    availableMoves: DialogueMoveType[];
    
    // Whose turn (if applicable)
    currentTurn?: UserId;
  };
  
  // The end-in-view
  deliberationGoal: {
    type: 'consensus' | 'decision' | 'exploration' | 'synthesis';
    focalQuestion: string;
  };
}
```

---

#### 7. ClaimLabel (IN/OUT/UNDEC)

**Mesh Definition:** Grounded semantics label computed from the argument graph.

**Sellarsian Analysis:**

ClaimLabel is the *normative status* of a claim within a deliberation — not its truth, but its *standing in the current game*.

| Label | Sellarsian Interpretation |
|-------|--------------------------|
| `IN` | Entitled — undefeated in current game state |
| `OUT` | Defeated — successfully attacked and not defended |
| `UNDEC` | Contested — attacked but attacks themselves contested |

From the space-of-reasons metaphor:
- `IN` = "You may assert this without challenge"
- `OUT` = "You are not entitled to assert this"
- `UNDEC` = "The status is open — more moves needed"

```typescript
// Sellarsian interpretation of ClaimLabel
interface SellarsianClaimLabel {
  claimId: ClaimId;
  deliberationId: DeliberationId;
  
  // The label
  label: 'IN' | 'OUT' | 'UNDEC';
  
  // How it was computed
  semantics: 'grounded' | 'preferred' | 'hybrid';
  
  // Sellarsian interpretation
  normativeStatus: {
    // What entitlements this grants
    entitles: ('assertion' | 'inference' | 'action')[];
    
    // What commitments this creates
    commits: string[];
    
    // What would change this status
    changedBy: ('new-attack' | 'defense' | 'retraction')[];
  };
  
  // Explanation
  explanation: {
    // Why this label
    reason: string;
    
    // What attacks are relevant
    relevantAttacks: ArgumentId[];
    
    // What defenses are relevant
    relevantDefenses: ArgumentId[];
  };
}
```

---

#### 8. CriticalQuestion

**Mesh Definition:** Per-scheme critical questions that, if unanswered, can defeat the argument.

**Sellarsian Analysis:**

Critical questions are *probes of the inference ticket*. They make the defeasibility conditions of a scheme explicit and challengeable.

From the Sellarsian view, CQs ask: "Is this ticket valid in this case?"

| CQ Target | What It Probes |
|-----------|---------------|
| Premise CQs | Are the grounds adequate? |
| Inference CQs | Does the ticket apply? Are exceptions present? |
| Conclusion CQs | Is the conclusion as claimed? |

```typescript
// Sellarsian interpretation of CriticalQuestion
interface SellarsianCriticalQuestion {
  id: string;
  schemeId: SchemeId;
  
  // The question text
  text: string;
  
  // What aspect of the inference it probes
  target: 'premise' | 'inference' | 'conclusion' | 'authority';
  
  // Default assumption
  defaultAssumption: 'favorable' | 'unfavorable';
  
  // Burden of proof
  burden: 'proponent' | 'opponent';
  
  // What happens if answered negatively
  negativeEffect: {
    defeatType: 'undercuts' | 'rebuts' | 'undermines';
    strength: 'complete' | 'partial';
  };
  
  // Sellarsian interpretation: what this CQ challenges
  sellarsianTarget: {
    // Is it challenging the ticket's applicability?
    challengesTicketApplicability: boolean;
    
    // Is it challenging the ticket's reliability?
    challengesTicketReliability: boolean;
    
    // Is it challenging the specific instantiation?
    challengesInstantiation: boolean;
  };
  
  // Commitments created by asking/answering
  commitmentImplications: {
    askingImplies: string[];
    affirmativeImplies: string[];
    negativeImplies: string[];
  };
}
```

---

#### 9. DialogueMove

**Mesh Definition:** Formal dialogue game moves (ASSERT, WHY, GROUNDS, RETRACT, CONCEDE, CLOSE).

**Sellarsian Analysis:**

DialogueMoves are *pattern-governed speech acts* in the space of reasons. They constitute the "game" of giving and asking for reasons.

| Move Type | Sellarsian Function |
|-----------|-------------------|
| `ASSERT` | Undertaking a commitment |
| `WHY` | Challenging for grounds |
| `GROUNDS` | Providing inferential support |
| `RETRACT` | Withdrawing a commitment |
| `CONCEDE` | Acknowledging opponent's point |
| `CLOSE` | Ending the local game |

From Essay 1, being in the space of reasons is about mastering this game:

> "The essential point is that in characterizing an episode as knowing, we are placing it in the space of reasons, of justifying and being able to justify what one says."

DialogueMoves operationalize this — they're the *actions* one performs in the space.

```typescript
// Sellarsian interpretation of DialogueMove
interface SellarsianDialogueMove {
  id: string;
  deliberationId: DeliberationId;
  authorId: UserId;
  
  // The move type
  moveType: 'ASSERT' | 'WHY' | 'GROUNDS' | 'RETRACT' | 'CONCEDE' | 'CLOSE';
  
  // What it targets
  target: {
    type: 'claim' | 'argument' | 'premise' | 'inference';
    id: string;
  };
  
  // The polarity (ludics)
  polarity: 'P' | 'O';  // Proponent or Opponent
  
  // Sellarsian interpretation
  sellarsianAnalysis: {
    // What normative change this effects
    normativeEffect: 
      | { type: 'commitment-undertaking'; content: string }
      | { type: 'entitlement-claiming'; content: string }
      | { type: 'commitment-withdrawal'; content: string }
      | { type: 'challenge-issuing'; content: string }
      | { type: 'game-closure'; reason: string };
    
    // What response it licenses
    licensedResponses: DialogueMoveType[];
    
    // What happens if no response
    silenceEffect: 'concession' | 'burden-shift' | 'none';
  };
  
  // Formal properties
  isLegal: boolean;
  legalityCheck: {
    rulesApplied: string[];
    violations?: string[];
  };
}
```

---

#### 10. Proposition → Claim (Promotion)

**Mesh Definition:** Propositions are lightweight workshop assertions; Claims are canonical entries in the argument graph.

**Sellarsian Analysis:**

The Proposition → Claim promotion models the transition from *causal order* to *normative order*. 

| Stage | Sellarsian Status |
|-------|-------------------|
| Proposition | In the causal order — a natural event of assertion |
| Promotion | Entry into the space of reasons |
| Claim | In the normative order — bears inferential relations |

From Essay 6:
> "The transition from the purely causal to the normative order is the transition from mere sensation to perception proper — from being affected to knowing."

Similarly:
- A Proposition is someone *being moved to say* something
- A Claim is an entry *in the space of reasons* with inferential articulation

```typescript
// Sellarsian interpretation of Proposition → Claim promotion
interface PromotionEvent {
  // Before promotion
  proposition: {
    id: PropositionId;
    text: string;
    authorId: UserId;
    
    // Causal-order properties
    socialSignals: {
      voteUpCount: number;
      voteDownCount: number;
      endorseCount: number;
      replyCount: number;
    };
    
    // Not yet in space of reasons
    inferentialStatus: 'pre-normative';
  };
  
  // The promotion act
  promotionAct: {
    timestamp: Date;
    promotedById: UserId;
    
    // What made it worthy of promotion
    promotionCriteria: ('community-validation' | 'author-decision' | 'moderator-action')[];
  };
  
  // After promotion
  claim: {
    id: ClaimId;
    text: string;
    
    // Now in space of reasons
    inferentialStatus: 'normative';
    
    // Awaiting inferential articulation
    initialEdges: EdgeId[];
    
    // Can now be attacked, supported, used in arguments
    availableMoves: ('attack' | 'support' | 'use-as-premise' | 'ask-why')[];
  };
}
```

---

### Synthesis: The Mesh Platform as Sellarsian Space of Reasons

The Mesh platform, viewed through Sellarsian lenses, is an *operationalized space of reasons*:

| Platform Layer | Sellarsian Function |
|----------------|-------------------|
| **Propositions** | Pre-normative workshop (causal order) |
| **Claims + Edges** | The inferentially articulated space |
| **Arguments** | Pattern-governed inference acts |
| **Schemes** | Inference tickets (authorizations) |
| **ClaimLabels** | Current normative status |
| **DialogueMoves** | The gameplay of reason-giving |
| **Deliberation** | Bounded space with rules and participants |
| **Critical Questions** | Built-in defeasibility probes |
| **Ludics layer** | Formal proof games (deep dialogical structure) |

**Key Architectural Principle:**

The platform doesn't just *store* arguments — it *constitutes* a space of reasons. The data model IS the inferential articulation. This means:

1. **Meaning is relational** — a Claim's meaning is its position in the edge graph
2. **Status is game-relative** — IN/OUT/UNDEC is relative to current game state
3. **Rules are constitutive** — Schemes and DialogueRules don't describe external patterns, they constitute the practice
4. **Users are players** — participating is undertaking commitments in a structured game

```typescript
// The Mesh Platform as Sellarsian Space of Reasons
interface MeshAsSpaceOfReasons {
  // The pre-normative layer (causal order)
  causalLayer: {
    propositions: Proposition[];
    socialSignals: SocialSignal[];
    promotionQueue: PromotionCandidate[];
  };
  
  // The normative layer (space of reasons proper)
  normativeLayer: {
    // The populated space
    claims: SellarsianClaim[];
    edges: SellarsianClaimEdge[];
    arguments: SellarsianArgument[];
    
    // The inference tickets
    schemes: SellarsianScheme[];
    
    // Current game state
    gameState: {
      labels: Map<ClaimId, 'IN' | 'OUT' | 'UNDEC'>;
      pendingMoves: DialogueMove[];
      burdens: Map<UserId, Burden[]>;
    };
  };
  
  // The we-intention layer (practical reasoning)
  practicalLayer: {
    weIntentions: WeIntention[];
    scenariosUnderConsideration: DeliberativeScenario[];
    derivedCommitments: Map<UserId, PracticalCommitment[]>;
  };
  
  // The meta-layer (reflection on the practice)
  metaLayer: {
    schemeEvaluations: SchemeEvaluation[];
    practiceEvolution: PracticeChangeLog[];
    stereoscopicIntegration: IntegrationNote[];
  };
}
```

---

## Implementation Proposals

*To be continued in next packet...*

---

## Reading Progress (Part 2)

- [x] Open Questions 1-5 (Implementation) — Addressed with proposals
- [x] Open Questions 6-10 (Further Study) — Preliminary notes added
- [x] "On Reasoning about Values" — Integrated (S-Imp, So-Be-It, We-Intentions, Moral Point of View)
- [x] "On Accepting First Principles" — Integrated (Practical Syllogism, Inference Tickets, Principle Acceptance)
- [ ] Other standalone articles — Not started (Language as Thought, Locating Space of Reasons, Role of Picturing)
- [x] Enhanced scheme development — Complete (EnhancedArgumentScheme with full example)
- [x] Mesh component mapping — Complete (10 components with Sellarsian analysis)
- [ ] Implementation proposals — Not started

---

*Last updated: 2025-12-28*
