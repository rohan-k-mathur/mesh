
# Phase 4: Adaptive Scaffolding — Developmental Bildung System

## 4.1 Overview: The Sellarsian Developmental Framework

From the Deep Study synthesis, Sellars (and Koons & Sachs) outline a **developmental hierarchy**:

```
RDR → ARSA → ARSD
 │      │       │
 │      │       └── Discursive ARS (full linguistic/conceptual)
 │      └────────── Associative ARS (Humean inference, animal cognition)
 └──────────────── Reliable Differential Responder (mere causal response)
```

**Key Insight:** Users enter the platform at different developmental stages and need different support:

- **Novice (RDR→ARSA transition):** Needs heavy scaffolding, pattern enforcement, simple guidance
- **Intermediate (ARSA level):** Can make associative inferences, needs structure for complex reasoning
- **Advanced (ARSA→ARSD transition):** Developing meta-awareness, can start to articulate norms
- **Expert (ARSD level):** Full conceptual command, can teach others, minimal scaffolding needed

### The Ought-to-Be / Ought-to-Do Distinction

| Concept | Definition | Platform Implementation |
|---------|------------|------------------------|
| **Ought-to-Be** | Norms subjects conform to *without* conceptual grasp | UI structure, defaults, required fields |
| **Ought-to-Do** | Norms subjects follow *with* conceptual understanding | Explicit guidance, tutorials, recommendations |
| **Transition** | Moving from conformance to mastery | Progressive disclosure, feedback, achievement |

### Current State Analysis

The existing Mesh platform has:
- Basic `User` model with `onboarded` boolean
- `UserAttributes` for profile data
- `expertiseTags` array on User
- No explicit skill/development tracking for argumentation

---

## 4.2 Requirements

### R1: Developmental Stage Model

Track each user's argumentative development across multiple dimensions:

```typescript
interface DevelopmentalProfile {
  userId: string;
  
  // Overall stage (coarse-grained)
  overallStage: 'RDR' | 'ARSA_EARLY' | 'ARSA_MATURE' | 'ARSD_EMERGING' | 'ARSD_FLUENT';
  
  // Dimensional competencies (fine-grained)
  competencies: {
    // Claim-level skills
    claimFormulation: CompetencyLevel;      // Making clear, atomic claims
    evidenceRecognition: CompetencyLevel;   // Citing appropriate evidence
    
    // Argument-level skills
    premiseConclusionStructure: CompetencyLevel;  // Basic argument structure
    schemeRecognition: CompetencyLevel;     // Recognizing argument patterns
    schemeApplication: CompetencyLevel;     // Correctly applying schemes
    
    // Attack-level skills
    attackTyping: CompetencyLevel;          // Distinguishing rebut/undercut/undermine
    defeatRecognition: CompetencyLevel;     // Recognizing when arguments are defeated
    cqUsage: CompetencyLevel;               // Using critical questions effectively
    
    // Meta-level skills
    commitmentTracking: CompetencyLevel;    // Tracking own and others' commitments
    dialecticalAwareness: CompetencyLevel;  // Understanding dialogue dynamics
    normArticulation: CompetencyLevel;      // Can explain argumentation norms
  };
  
  // Learning trajectory
  trajectory: {
    startDate: Date;
    progressionEvents: ProgressionEvent[];
    currentMilestones: Milestone[];
    suggestedNextSteps: LearningStep[];
  };
}

type CompetencyLevel = 
  | 'UNAWARE'       // Doesn't know this exists
  | 'CONFORMING'    // Follows patterns but can't articulate
  | 'RECOGNIZING'   // Can identify but not produce
  | 'APPLYING'      // Can apply with guidance
  | 'FLUENT'        // Automatic, no guidance needed
  | 'TEACHING'      // Can help others learn
```

### R2: Adaptive UI Scaffolding

Dynamically adjust UI complexity based on developmental stage:

```typescript
interface AdaptiveScaffolding {
  // Scaffolding levels
  levels: {
    HEAVY: {
      // For RDR → ARSA_EARLY
      features: [
        'pre-structured-forms',      // Fill in blanks
        'forced-choice-options',     // Select from options
        'inline-examples',           // See examples at every step
        'validation-guardrails',     // Prevent malformed inputs
        'celebratory-feedback',      // Positive reinforcement
      ];
      hidden: ['advanced-options', 'raw-mode', 'bulk-actions'];
    };
    
    MODERATE: {
      // For ARSA_EARLY → ARSA_MATURE
      features: [
        'guided-forms-with-hints',   // Hints available on hover
        'scheme-suggestions',        // Suggest applicable schemes
        'cq-prompts',               // Prompt for CQ consideration
        'peer-examples',            // Show how others structured
      ];
      hidden: ['expert-mode', 'api-access'];
    };
    
    LIGHT: {
      // For ARSA_MATURE → ARSD_EMERGING
      features: [
        'optional-hints',           // Available but not shown by default
        'advanced-options-visible', // Full options available
        'scheme-authoring',         // Can create new schemes
        'moderation-tools',         // Help guide discussions
      ];
    };
    
    NONE: {
      // For ARSD_FLUENT
      features: [
        'full-expert-mode',         // All options, no hand-holding
        'teaching-tools',           // Can annotate for learners
        'norm-articulation',        // Can document community norms
        'scaffolding-admin',        // Can adjust scaffolding for others
      ];
    };
  };
}
```

### R3: Progression Tracking and Triggers

Track behavior and trigger stage transitions:

```typescript
interface ProgressionTracking {
  // Behaviors that demonstrate competency
  competencySignals: {
    claimFormulation: [
      { action: 'created_atomic_claim', weight: 1 },
      { action: 'claim_accepted_no_edits', weight: 2 },
      { action: 'claim_cited_by_others', weight: 3 },
    ];
    
    schemeApplication: [
      { action: 'applied_scheme_correctly', weight: 2 },
      { action: 'all_cqs_satisfied', weight: 3 },
      { action: 'scheme_not_challenged', weight: 1 },
    ];
    
    attackTyping: [
      { action: 'correct_attack_type_first_try', weight: 2 },
      { action: 'attack_not_reclassified', weight: 1 },
      { action: 'attack_sustained_to_defeat', weight: 3 },
    ];
    
    normArticulation: [
      { action: 'helped_novice_user', weight: 3 },
      { action: 'documented_pattern', weight: 4 },
      { action: 'created_scheme', weight: 5 },
    ];
  };
  
  // Thresholds for level transitions
  transitionThresholds: {
    UNAWARE_to_CONFORMING: 5,    // Started doing it
    CONFORMING_to_RECOGNIZING: 15, // Can identify
    RECOGNIZING_to_APPLYING: 30,   // Can do with guidance
    APPLYING_to_FLUENT: 60,        // Automatic
    FLUENT_to_TEACHING: 100,       // Can teach
  };
}
```

### R4: Contextual Guidance System

Provide just-in-time learning based on current activity:

```typescript
interface ContextualGuidance {
  // When to show guidance
  triggers: {
    // Action-based
    onAction: {
      'creating_claim': ['claim-structure-tips', 'evidence-reminder'];
      'creating_argument': ['scheme-suggestion', 'premise-completeness'];
      'creating_attack': ['attack-type-explainer', 'defeat-conditions'];
      'responding_to_cq': ['burden-of-proof-guide', 'evidence-types'];
    };
    
    // Context-based
    onContext: {
      'first_time_in_deliberation': ['deliberation-overview'];
      'complex_argument_graph': ['graph-navigation-tips'];
      'high_defeat_rate': ['argument-improvement-tips'];
      'stalled_discussion': ['move-suggestion', 'synthesis-prompt'];
    };
    
    // Time-based
    onTime: {
      'idle_in_form': ['help-prompt-after-30s'];
      'rapid_errors': ['slow-down-guidance'];
    };
  };
  
  // How to show guidance
  presentation: {
    TOOLTIP: { intrusiveness: 'low', dismissible: true };
    SIDEBAR_HINT: { intrusiveness: 'low', persistent: true };
    MODAL_TUTORIAL: { intrusiveness: 'high', blocking: true };
    INLINE_EXAMPLE: { intrusiveness: 'medium', contextual: true };
    VIDEO_CLIP: { intrusiveness: 'medium', optional: true };
  };
  
  // Respect user stage
  stageAdjustment: {
    HEAVY: 'show-all-guidance';
    MODERATE: 'show-on-hover-or-error';
    LIGHT: 'show-on-explicit-request';
    NONE: 'hide-unless-new-feature';
  };
}
```

---

## 4.3 Schema Design

### 4.3.1 ArgumentationProfile Model

```prisma
// User's argumentation developmental profile
model ArgumentationProfile {
  id             String   @id @default(cuid())
  userId         BigInt   @unique
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Overall developmental stage
  overallStage   DevelopmentalStage @default(RDR)
  stageUpdatedAt DateTime           @default(now())
  
  // Scaffolding preferences
  scaffoldingLevel ScaffoldingLevel @default(HEAVY)
  scaffoldingOverride Boolean       @default(false)  // User manually set level
  
  // Competency scores (0-100)
  claimFormulation       Int @default(0)
  evidenceRecognition    Int @default(0)
  premiseConclusionStructure Int @default(0)
  schemeRecognition      Int @default(0)
  schemeApplication      Int @default(0)
  attackTyping           Int @default(0)
  defeatRecognition      Int @default(0)
  cqUsage                Int @default(0)
  commitmentTracking     Int @default(0)
  dialecticalAwareness   Int @default(0)
  normArticulation       Int @default(0)
  
  // Aggregate stats
  totalContributions     Int @default(0)
  successfulArguments    Int @default(0)  // IN status sustained
  effectiveAttacks       Int @default(0)  // Led to defeat
  cqsRaised              Int @default(0)
  cqsAnswered            Int @default(0)
  helpActionsGiven       Int @default(0)  // Helped novices
  
  // Learning state
  currentMilestoneId     String?
  currentMilestone       BildungMilestone? @relation("CurrentMilestone", fields: [currentMilestoneId], references: [id], onDelete: SetNull)
  
  // Onboarding state
  onboardingComplete     Boolean  @default(false)
  onboardingStep         Int      @default(0)
  
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  // Relations
  progressionEvents      ProgressionEvent[]
  completedMilestones    BildungMilestone[] @relation("CompletedMilestones")
  guidanceHistory        GuidanceEvent[]
  
  @@index([userId])
  @@index([overallStage])
  @@index([scaffoldingLevel])
}

enum DevelopmentalStage {
  RDR            // Reliable Differential Responder (pre-conceptual)
  ARSA_EARLY     // Early Associative ARS
  ARSA_MATURE    // Mature Associative ARS
  ARSD_EMERGING  // Emerging Discursive ARS
  ARSD_FLUENT    // Fluent Discursive ARS
}

enum ScaffoldingLevel {
  HEAVY          // Maximum support
  MODERATE       // Guided with hints
  LIGHT          // Optional hints
  NONE           // Expert mode
}
```

### 4.3.2 ProgressionEvent Model

```prisma
// Track competency-building events
model ProgressionEvent {
  id              String   @id @default(cuid())
  profileId       String
  profile         ArgumentationProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  
  // What happened
  eventType       ProgressionEventType
  competency      String   // Which competency this affects
  points          Int      // Points earned (can be negative)
  
  // Context
  deliberationId  String?
  contributionId  String?  // Claim, Argument, Edge ID
  contributionType String? // 'claim' | 'argument' | 'edge' | 'cq'
  
  // Outcome
  previousScore   Int
  newScore        Int
  triggeredLevelUp Boolean @default(false)
  
  // Metadata
  context         Json?    // Additional context
  createdAt       DateTime @default(now())
  
  @@index([profileId])
  @@index([profileId, competency])
  @@index([createdAt])
  @@index([eventType])
}

enum ProgressionEventType {
  // Positive events
  CLAIM_CREATED
  CLAIM_ACCEPTED
  CLAIM_CITED
  ARGUMENT_CREATED
  ARGUMENT_SUSTAINED    // Maintained IN status
  SCHEME_APPLIED
  CQ_SATISFIED
  ATTACK_TYPED_CORRECTLY
  ATTACK_SUSTAINED
  DEFEAT_ACHIEVED
  NOVICE_HELPED
  PATTERN_DOCUMENTED
  SCHEME_CREATED
  
  // Negative/corrective events
  CLAIM_REJECTED
  ARGUMENT_DEFEATED
  ATTACK_RECLASSIFIED
  CQ_UNANSWERED
  GUIDANCE_NEEDED
  
  // Neutral/tracking
  TUTORIAL_COMPLETED
  MILESTONE_ACHIEVED
  STAGE_TRANSITION
}
```

### 4.3.3 BildungMilestone Model

```prisma
// Learning milestones in the Bildung journey
model BildungMilestone {
  id              String   @id @default(cuid())
  
  // Milestone definition
  key             String   @unique
  name            String
  description     String   @db.Text
  
  // Requirements
  requiredStage   DevelopmentalStage
  requiredCompetencies Json  // { competency: minLevel, ... }
  requiredActions Json?      // { action: count, ... }
  
  // Rewards/unlocks
  unlocks         String[]   // Feature keys unlocked
  badgeKey        String?    // Badge awarded
  scaffoldingChange ScaffoldingLevel?  // New scaffolding level
  
  // Ordering
  category        String     // 'core' | 'advanced' | 'mastery' | 'teaching'
  order           Int
  
  // Relations
  currentFor      ArgumentationProfile[] @relation("CurrentMilestone")
  completedBy     ArgumentationProfile[] @relation("CompletedMilestones")
  
  createdAt       DateTime @default(now())
  
  @@index([requiredStage])
  @@index([category, order])
}
```

### 4.3.4 GuidanceEvent Model

```prisma
// Track guidance shown and user response
model GuidanceEvent {
  id              String   @id @default(cuid())
  profileId       String
  profile         ArgumentationProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  
  // What guidance was shown
  guidanceType    GuidanceType
  guidanceKey     String    // Specific guidance content key
  
  // Context
  triggerContext  String    // What triggered this guidance
  deliberationId  String?
  
  // User response
  response        GuidanceResponse?
  responseAt      DateTime?
  
  // Outcome tracking
  helpedUser      Boolean?  // Did user succeed after guidance?
  
  createdAt       DateTime  @default(now())
  
  @@index([profileId])
  @@index([guidanceType])
  @@index([profileId, createdAt])
}

enum GuidanceType {
  TOOLTIP
  SIDEBAR_HINT
  MODAL_TUTORIAL
  INLINE_EXAMPLE
  VIDEO_CLIP
  ONBOARDING_STEP
  CONTEXTUAL_TIP
}

enum GuidanceResponse {
  DISMISSED
  FOLLOWED
  SKIPPED
  REQUESTED_MORE
  MARKED_HELPFUL
  MARKED_NOT_HELPFUL
}
```

### 4.3.5 User Model Extension

```prisma
// Add to existing User model:
model User {
  // ... existing fields ...
  
  // NEW: Argumentation profile
  argumentationProfile ArgumentationProfile?
}
```

---

## 4.4 API Layer: Bildung Service

### 4.4.1 BildungService Interface

```typescript
// services/bildung.ts

interface BildungService {
  // === PROFILE MANAGEMENT ===
  
  /**
   * Get or create user's argumentation profile
   */
  getProfile(userId: string): Promise<ArgumentationProfile>;
  
  /**
   * Initialize profile for new user
   */
  initializeProfile(userId: string): Promise<ArgumentationProfile>;
  
  // === COMPETENCY TRACKING ===
  
  /**
   * Record a progression event
   */
  recordEvent(params: {
    userId: string;
    eventType: ProgressionEventType;
    competency: string;
    points: number;
    context?: {
      deliberationId?: string;
      contributionId?: string;
      contributionType?: string;
      metadata?: Record<string, any>;
    };
  }): Promise<{
    event: ProgressionEvent;
    profileUpdated: boolean;
    levelUp?: { competency: string; newLevel: string };
    stageTransition?: { from: DevelopmentalStage; to: DevelopmentalStage };
    milestoneAchieved?: BildungMilestone;
  }>;
  
  /**
   * Get competency level for a specific skill
   */
  getCompetencyLevel(
    userId: string, 
    competency: string
  ): Promise<{
    score: number;
    level: CompetencyLevel;
    nextLevelAt: number;
    recentProgress: ProgressionEvent[];
  }>;
  
  /**
   * Check if user should transition stages
   */
  evaluateStageTransition(userId: string): Promise<{
    currentStage: DevelopmentalStage;
    recommendedStage: DevelopmentalStage;
    transitionReady: boolean;
    blockers: string[];
  }>;
  
  // === SCAFFOLDING ===
  
  /**
   * Get appropriate scaffolding level for user
   */
  getScaffoldingLevel(userId: string): Promise<{
    level: ScaffoldingLevel;
    isOverride: boolean;
    features: string[];
    hiddenFeatures: string[];
  }>;
  
  /**
   * Get scaffolded UI config for context
   */
  getUIConfig(params: {
    userId: string;
    context: 'claim_creation' | 'argument_creation' | 'attack_creation' | 
             'cq_response' | 'deliberation_view' | 'scheme_selection';
  }): Promise<{
    scaffoldingLevel: ScaffoldingLevel;
    visibleFields: string[];
    hiddenFields: string[];
    requiredFields: string[];
    hints: Hint[];
    examples: Example[];
    validation: ValidationConfig;
  }>;
  
  /**
   * User manually adjusts scaffolding level
   */
  setScaffoldingOverride(
    userId: string, 
    level: ScaffoldingLevel
  ): Promise<ArgumentationProfile>;
  
  // === GUIDANCE ===
  
  /**
   * Get contextual guidance for current action
   */
  getContextualGuidance(params: {
    userId: string;
    action: string;
    context: Record<string, any>;
  }): Promise<{
    guidance: Guidance[];
    priority: 'critical' | 'helpful' | 'optional';
    presentation: GuidanceType;
  }>;
  
  /**
   * Record user's response to guidance
   */
  recordGuidanceResponse(params: {
    eventId: string;
    response: GuidanceResponse;
    helpedUser?: boolean;
  }): Promise<GuidanceEvent>;
  
  /**
   * Get next suggested learning step
   */
  getNextLearningStep(userId: string): Promise<{
    milestone: BildungMilestone;
    progress: number;  // 0-100%
    suggestedActions: string[];
    estimatedEffort: string;
  }>;
  
  // === MILESTONES ===
  
  /**
   * Get user's milestone progress
   */
  getMilestoneProgress(userId: string): Promise<{
    completed: BildungMilestone[];
    current: BildungMilestone;
    upcoming: BildungMilestone[];
    overallProgress: number;
  }>;
  
  /**
   * Check and award milestone if completed
   */
  checkMilestoneCompletion(userId: string): Promise<{
    newlyCompleted: BildungMilestone[];
    unlocked: string[];
  }>;
  
  // === ANALYTICS ===
  
  /**
   * Get learning analytics for user
   */
  getLearningAnalytics(userId: string): Promise<{
    stage: DevelopmentalStage;
    competencyRadar: Record<string, number>;
    progressionTrend: { date: Date; score: number }[];
    strengths: string[];
    growthAreas: string[];
    activitySummary: {
      last7Days: number;
      last30Days: number;
      totalContributions: number;
    };
  }>;
}
```

### 4.4.2 Event Hooks for Progression

```typescript
// services/bildungHooks.ts

/**
 * Hook into contribution creation to track progression
 */
export async function onContributionCreated(event: {
  type: 'claim' | 'argument' | 'edge' | 'cq_response';
  id: string;
  userId: string;
  deliberationId: string;
  metadata: Record<string, any>;
}): Promise<void> {
  const bildung = getBildungService();
  
  switch (event.type) {
    case 'claim':
      await bildung.recordEvent({
        userId: event.userId,
        eventType: 'CLAIM_CREATED',
        competency: 'claimFormulation',
        points: 1,
        context: {
          deliberationId: event.deliberationId,
          contributionId: event.id,
          contributionType: 'claim',
        },
      });
      break;
      
    case 'argument':
      // Multiple competencies affected
      await bildung.recordEvent({
        userId: event.userId,
        eventType: 'ARGUMENT_CREATED',
        competency: 'premiseConclusionStructure',
        points: 2,
        context: { contributionId: event.id },
      });
      
      if (event.metadata.schemeId) {
        await bildung.recordEvent({
          userId: event.userId,
          eventType: 'SCHEME_APPLIED',
          competency: 'schemeApplication',
          points: 3,
          context: { 
            contributionId: event.id,
            metadata: { schemeId: event.metadata.schemeId },
          },
        });
      }
      break;
      
    case 'edge':
      if (event.metadata.isAttack) {
        await bildung.recordEvent({
          userId: event.userId,
          eventType: 'ATTACK_TYPED_CORRECTLY',
          competency: 'attackTyping',
          points: 2,
          context: { contributionId: event.id },
        });
      }
      break;
      
    case 'cq_response':
      await bildung.recordEvent({
        userId: event.userId,
        eventType: 'CQ_SATISFIED',
        competency: 'cqUsage',
        points: 3,
        context: { 
          contributionId: event.id,
          metadata: { cqKey: event.metadata.cqKey },
        },
      });
      break;
  }
}

/**
 * Hook into label changes to track argument success
 */
export async function onLabelChanged(event: {
  claimId: string;
  argumentId?: string;
  oldLabel: string;
  newLabel: string;
  deliberationId: string;
}): Promise<void> {
  const bildung = getBildungService();
  
  // Find the argument author
  const argument = event.argumentId ? 
    await prisma.argument.findUnique({
      where: { id: event.argumentId },
      select: { createdById: true },
    }) : null;
  
  if (argument && event.newLabel === 'IN' && event.oldLabel !== 'IN') {
    await bildung.recordEvent({
      userId: argument.createdById,
      eventType: 'ARGUMENT_SUSTAINED',
      competency: 'premiseConclusionStructure',
      points: 5,
      context: { contributionId: event.argumentId },
    });
  } else if (argument && event.newLabel === 'OUT' && event.oldLabel === 'IN') {
    await bildung.recordEvent({
      userId: argument.createdById,
      eventType: 'ARGUMENT_DEFEATED',
      competency: 'premiseConclusionStructure',
      points: -2,
      context: { contributionId: event.argumentId },
    });
  }
}

/**
 * Hook into help actions
 */
export async function onHelpGiven(event: {
  helperId: string;
  helpedUserId: string;
  deliberationId: string;
  helpType: string;
}): Promise<void> {
  const bildung = getBildungService();
  
  // Check if helped user is a novice
  const helpedProfile = await bildung.getProfile(event.helpedUserId);
  
  if (helpedProfile.overallStage === 'RDR' || 
      helpedProfile.overallStage === 'ARSA_EARLY') {
    await bildung.recordEvent({
      userId: event.helperId,
      eventType: 'NOVICE_HELPED',
      competency: 'normArticulation',
      points: 5,
      context: {
        metadata: {
          helpedUserId: event.helpedUserId,
          helpType: event.helpType,
        },
      },
    });
  }
}
```

### 4.4.3 Scaffolding Configuration

```typescript
// config/scaffolding.ts

export const SCAFFOLDING_CONFIGS: Record<ScaffoldingLevel, ScaffoldingConfig> = {
  HEAVY: {
    level: 'HEAVY',
    description: 'Maximum support for new users',
    
    claim_creation: {
      visibleFields: ['text'],
      hiddenFields: ['evidence', 'sources', 'commitmentLevel', 'advancedOptions'],
      requiredFields: ['text'],
      hints: [
        { field: 'text', content: 'State one clear point. What do you want to say?' },
      ],
      examples: [
        { label: 'Good example', text: 'Climate change is caused primarily by human activity.' },
        { label: 'Too vague', text: 'Climate is bad.' },
      ],
      validation: {
        minLength: 10,
        maxLength: 500,
        requiresEvidence: false,
      },
    },
    
    argument_creation: {
      visibleFields: ['conclusion', 'premises'],
      hiddenFields: ['scheme', 'strength', 'cqs', 'advancedOptions'],
      requiredFields: ['conclusion', 'premises'],
      hints: [
        { field: 'conclusion', content: 'What are you trying to prove?' },
        { field: 'premises', content: 'What reasons support your conclusion?' },
      ],
      examples: [
        {
          label: 'Simple argument',
          conclusion: 'We should invest in solar energy.',
          premises: ['Solar energy is renewable', 'Solar costs have dropped 90% in a decade'],
        },
      ],
      validation: {
        minPremises: 1,
        maxPremises: 3,  // Keep simple for beginners
        requiresScheme: false,
      },
    },
    
    attack_creation: {
      visibleFields: ['targetClaim', 'attackType', 'reason'],
      hiddenFields: ['defeatType', 'aspicMapping', 'preferenceOrder'],
      requiredFields: ['targetClaim', 'attackType', 'reason'],
      hints: [
        { 
          field: 'attackType', 
          content: 'Choose how your response challenges the claim.',
          options: [
            { value: 'REBUTS', label: 'I disagree with the conclusion', icon: '🔄' },
            { value: 'UNDERCUTS', label: 'The reasoning is flawed', icon: '✂️' },
            { value: 'UNDERMINES', label: 'A premise is wrong', icon: '🎯' },
          ],
        },
      ],
      validation: {
        requiresReason: true,
        minReasonLength: 20,
      },
    },
  },
  
  MODERATE: {
    level: 'MODERATE',
    description: 'Guided with hints available on hover',
    
    claim_creation: {
      visibleFields: ['text', 'evidence', 'commitmentLevel'],
      hiddenFields: ['advancedOptions'],
      requiredFields: ['text'],
      hints: [
        { field: 'evidence', content: 'Add sources to strengthen your claim (optional)' },
      ],
      validation: {
        minLength: 10,
        maxLength: 1000,
        requiresEvidence: false,
      },
    },
    
    argument_creation: {
      visibleFields: ['conclusion', 'premises', 'scheme'],
      hiddenFields: ['advancedOptions'],
      requiredFields: ['conclusion', 'premises'],
      hints: [
        { field: 'scheme', content: 'Try using an argument pattern to strengthen your reasoning' },
      ],
      schemeSuggestions: true,  // Show relevant schemes
      validation: {
        minPremises: 1,
        maxPremises: 5,
        requiresScheme: false,  // Encouraged but not required
      },
    },
    
    attack_creation: {
      visibleFields: ['targetClaim', 'attackType', 'reason', 'defeatType'],
      requiredFields: ['targetClaim', 'attackType', 'reason'],
      validation: {
        requiresReason: true,
      },
    },
  },
  
  LIGHT: {
    level: 'LIGHT',
    description: 'Optional hints, advanced options visible',
    
    claim_creation: {
      visibleFields: ['text', 'evidence', 'sources', 'commitmentLevel', 'advancedOptions'],
      requiredFields: ['text'],
      validation: {
        minLength: 5,
        maxLength: 2000,
      },
    },
    
    argument_creation: {
      visibleFields: 'all',
      requiredFields: ['conclusion'],  // Only conclusion required
      schemeAuthoring: true,  // Can create new schemes
      validation: {
        maxPremises: 10,
      },
    },
    
    attack_creation: {
      visibleFields: 'all',
      requiredFields: ['targetClaim', 'attackType'],
      aspicMappingVisible: true,
    },
  },
  
  NONE: {
    level: 'NONE',
    description: 'Full expert mode',
    
    claim_creation: {
      visibleFields: 'all',
      requiredFields: [],  // User knows what they're doing
      bulkMode: true,
      apiAccess: true,
    },
    
    argument_creation: {
      visibleFields: 'all',
      requiredFields: [],
      rawMode: true,
      schemeAuthoring: true,
      cqManagement: true,
    },
    
    attack_creation: {
      visibleFields: 'all',
      requiredFields: [],
      preferenceEditing: true,
    },
  },
};
```

---

## 4.5 Milestone Seed Data

```typescript
// seeds/bildung-milestones.ts

export const CORE_MILESTONES: BildungMilestone[] = [
  // === RDR STAGE ===
  {
    key: 'first_claim',
    name: 'First Words',
    description: 'Create your first claim in a deliberation.',
    requiredStage: 'RDR',
    requiredCompetencies: {},
    requiredActions: { claim_created: 1 },
    unlocks: [],
    category: 'core',
    order: 1,
  },
  {
    key: 'first_argument',
    name: 'Making a Case',
    description: 'Create your first argument with premises and conclusion.',
    requiredStage: 'RDR',
    requiredCompetencies: { claimFormulation: 5 },
    requiredActions: { argument_created: 1 },
    unlocks: ['argument_creation'],
    scaffoldingChange: 'HEAVY',
    category: 'core',
    order: 2,
  },
  
  // === ARSA_EARLY STAGE ===
  {
    key: 'first_challenge',
    name: 'Entering the Fray',
    description: 'Challenge another user\'s claim or argument.',
    requiredStage: 'ARSA_EARLY',
    requiredCompetencies: { premiseConclusionStructure: 10 },
    requiredActions: { attack_created: 1 },
    unlocks: ['attack_creation'],
    category: 'core',
    order: 3,
  },
  {
    key: 'scheme_novice',
    name: 'Pattern Recognition',
    description: 'Apply an argument scheme to structure your reasoning.',
    requiredStage: 'ARSA_EARLY',
    requiredCompetencies: { premiseConclusionStructure: 15 },
    requiredActions: { scheme_applied: 3 },
    unlocks: ['scheme_browser'],
    category: 'core',
    order: 4,
  },
  {
    key: 'cq_responder',
    name: 'Standing Up to Scrutiny',
    description: 'Successfully answer 5 critical questions raised against your arguments.',
    requiredStage: 'ARSA_EARLY',
    requiredCompetencies: { schemeApplication: 15 },
    requiredActions: { cq_satisfied: 5 },
    unlocks: ['cq_panel'],
    scaffoldingChange: 'MODERATE',
    category: 'core',
    order: 5,
  },
  
  // === ARSA_MATURE STAGE ===
  {
    key: 'effective_attacker',
    name: 'Sharp Critique',
    description: 'Your attacks have led to 5 defeats.',
    requiredStage: 'ARSA_MATURE',
    requiredCompetencies: { attackTyping: 25, defeatRecognition: 20 },
    requiredActions: { defeat_achieved: 5 },
    unlocks: ['defeat_analysis'],
    category: 'advanced',
    order: 6,
  },
  {
    key: 'scheme_adept',
    name: 'Argument Architect',
    description: 'Successfully apply 5 different argument schemes.',
    requiredStage: 'ARSA_MATURE',
    requiredCompetencies: { schemeRecognition: 30, schemeApplication: 30 },
    requiredActions: { unique_schemes_used: 5 },
    unlocks: ['all_schemes'],
    category: 'advanced',
    order: 7,
  },
  {
    key: 'sustained_reasoner',
    name: 'Reliable Reasoner',
    description: '10 of your arguments have maintained IN status.',
    requiredStage: 'ARSA_MATURE',
    requiredCompetencies: { premiseConclusionStructure: 40 },
    requiredActions: { argument_sustained: 10 },
    scaffoldingChange: 'LIGHT',
    category: 'advanced',
    order: 8,
  },
  
  // === ARSD_EMERGING STAGE ===
  {
    key: 'commitment_tracker',
    name: 'Keeping Score',
    description: 'Demonstrate awareness of your commitments and their implications.',
    requiredStage: 'ARSD_EMERGING',
    requiredCompetencies: { commitmentTracking: 40, dialecticalAwareness: 30 },
    unlocks: ['commitment_dashboard'],
    category: 'mastery',
    order: 9,
  },
  {
    key: 'cq_challenger',
    name: 'Critical Questioner',
    description: 'Raise critical questions that lead to 5 ticket suspensions.',
    requiredStage: 'ARSD_EMERGING',
    requiredCompetencies: { cqUsage: 40 },
    requiredActions: { cq_led_to_suspension: 5 },
    unlocks: ['cq_authoring'],
    category: 'mastery',
    order: 10,
  },
  
  // === ARSD_FLUENT STAGE ===
  {
    key: 'novice_guide',
    name: 'Guide',
    description: 'Help 10 novice users improve their contributions.',
    requiredStage: 'ARSD_FLUENT',
    requiredCompetencies: { normArticulation: 50 },
    requiredActions: { novice_helped: 10 },
    unlocks: ['mentorship_tools'],
    category: 'teaching',
    order: 11,
  },
  {
    key: 'scheme_author',
    name: 'Pattern Maker',
    description: 'Create a new argument scheme adopted by the community.',
    requiredStage: 'ARSD_FLUENT',
    requiredCompetencies: { schemeApplication: 60, normArticulation: 60 },
    requiredActions: { scheme_created_and_used: 1 },
    unlocks: ['scheme_authoring'],
    badgeKey: 'scheme_author',
    category: 'teaching',
    order: 12,
  },
  {
    key: 'master_dialectician',
    name: 'Master Dialectician',
    description: 'Achieve fluency across all argumentation competencies.',
    requiredStage: 'ARSD_FLUENT',
    requiredCompetencies: {
      claimFormulation: 60,
      evidenceRecognition: 60,
      premiseConclusionStructure: 60,
      schemeRecognition: 60,
      schemeApplication: 60,
      attackTyping: 60,
      defeatRecognition: 60,
      cqUsage: 60,
      commitmentTracking: 60,
      dialecticalAwareness: 60,
      normArticulation: 60,
    },
    scaffoldingChange: 'NONE',
    badgeKey: 'master_dialectician',
    category: 'teaching',
    order: 13,
  },
];
```

---

## 4.6 Migration Strategy

### Step 1: Add New Models

```bash
# Add ArgumentationProfile, ProgressionEvent, BildungMilestone, GuidanceEvent
npx prisma db push
```

### Step 2: Seed Milestones

```typescript
// scripts/seed-bildung-milestones.ts

async function seedBildungMilestones() {
  for (const milestone of CORE_MILESTONES) {
    await prisma.bildungMilestone.upsert({
      where: { key: milestone.key },
      create: milestone,
      update: milestone,
    });
  }
  console.log(`Seeded ${CORE_MILESTONES.length} milestones`);
}
```

### Step 3: Backfill User Profiles

```typescript
// scripts/backfill-argumentation-profiles.ts

async function backfillArgumentationProfiles() {
  const users = await prisma.user.findMany({
    where: { argumentationProfile: null },
    select: { id: true },
  });
  
  for (const user of users) {
    await prisma.argumentationProfile.create({
      data: {
        userId: user.id,
        overallStage: 'RDR',  // Start at beginning
        scaffoldingLevel: 'HEAVY',
      },
    });
  }
  
  console.log(`Created profiles for ${users.length} users`);
}
```

### Step 4: Wire Up Event Hooks

Add hooks to existing contribution flows:
- `onClaimCreated` → recordEvent
- `onArgumentCreated` → recordEvent
- `onEdgeCreated` → recordEvent
- `onCQResponseCreated` → recordEvent
- `onLabelChanged` → recordEvent
- `onHelpGiven` → recordEvent

### Step 5: Integrate Scaffolding in UI

```typescript
// components/ArgumentForm.tsx (example)

export function ArgumentForm({ deliberationId }: Props) {
  const { data: scaffolding } = useScaffolding('argument_creation');
  
  return (
    <form>
      {scaffolding.visibleFields.includes('conclusion') && (
        <ClaimInput
          label="Conclusion"
          required={scaffolding.requiredFields.includes('conclusion')}
          hint={scaffolding.hints.find(h => h.field === 'conclusion')?.content}
        />
      )}
      
      {scaffolding.visibleFields.includes('premises') && (
        <PremiseList
          max={scaffolding.validation.maxPremises}
          hint={scaffolding.hints.find(h => h.field === 'premises')?.content}
        />
      )}
      
      {scaffolding.visibleFields.includes('scheme') && (
        <SchemeSelector
          suggestions={scaffolding.schemeSuggestions}
          required={scaffolding.validation.requiresScheme}
        />
      )}
      
      {scaffolding.examples && (
        <ExamplePanel examples={scaffolding.examples} />
      )}
    </form>
  );
}
```

---

## 4.7 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Profile creation | 100% | All users have ArgumentationProfile |
| Milestone seeding | 100% | All milestones seeded |
| Event tracking | > 95% | Contributions trigger events |
| Stage accuracy | > 80% | Stage matches observable behavior |
| Scaffolding applied | 100% | UI respects scaffolding level |
| Progression rate | > 50% | Users advance at least 1 competency/month |
| Milestone completion | > 30% | Users complete at least 3 milestones |
| User satisfaction | > 4.0/5 | Scaffolding helpfulness rating |

---

## Phase 4 Status

- [x] 4.1 Overview — Complete
- [x] 4.2 Requirements — Complete
- [x] 4.3 Schema Design — Complete
- [x] 4.4 API Layer — Complete
- [x] 4.5 Milestone Seed Data — Complete
- [x] 4.6 Migration Strategy — Complete
- [ ] 4.7 Implementation — Not started
- [ ] 4.8 Testing — Not started

---

## Connection to Sellarsian Framework

| Sellarsian Concept | Phase 4 Implementation |
|-------------------|----------------------|
| **RDR → ARS** | DevelopmentalStage progression model |
| **ARSA → ARSD** | Competency levels track associative → discursive |
| **Ought-to-Be's** | HEAVY scaffolding enforces norms without concepts |
| **Ought-to-Do's** | LIGHT/NONE scaffolding for conceptual mastery |
| **Bildung (Second Nature)** | Progressive disclosure, milestone journey |
| **Pattern-Governed → Rule-Obeying** | Transition from CONFORMING to TEACHING |
| **Linguistic Community** | Novice helping tracks community self-perpetuation |

---

## Next Steps

After Phase 4 implementation:
1. **Phase 5:** Implement dialectical move recommendations
2. **Phase 6:** Create picturing-based feedback systems

---

# Phase 5: Dialectical Move Recommendations — The Game of Giving and Asking for Reasons

## 5.1 Overview: Sellarsian Dialectics

From the Deep Study synthesis, Sellars frames rational discourse as a **game**:

> "The space of reasons is constituted by moves in the game of giving and asking for reasons. Each move creates obligations, licenses responses, and shifts the dialectical landscape."

Key Sellarsian concepts for move recommendations:

| Concept | Description | Platform Relevance |
|---------|-------------|-------------------|
| **Illocutionary Force** | What a speech act *does* (assert, question, concede) | DialogueMove.kind/illocution |
| **Commitment Incurrence** | What you become committed to by making a move | Commitment tracking |
| **Entitlement Challenge** | WHY-moves that demand justification | CQ raising, burden shifting |
| **Licensed Responses** | What moves are appropriate given the state | Move recommendations |
| **Dialectical Obligations** | What you *must* do to maintain standing | Pending obligations tracking |

### Current Infrastructure Analysis

The existing Mesh platform has:

| Component | Location | Current State |
|-----------|----------|---------------|
| `DialogueMove` | schema.prisma:3880 | Full model with kind, illocution, payload, threading |
| `Illocution` enum | schema.prisma:3788 | Assert, Question, Argue, Concede, Retract, Close, etc. |
| `DialogueVisualizationNode` | schema.prisma:3944 | Pure dialogue moves (WHY, CONCEDE, etc.) |
| `CQStatus` / `CQAttack` | schema.prisma | CQ lifecycle tracking |
| `Commitment` | schema.prisma | User commitment stores |

### The Gap

Current system tracks moves but doesn't:
- **Recommend** next moves based on dialectical state
- **Enforce** dialectical obligations (e.g., must respond to WHY)
- **Surface** opportunities (e.g., this claim is vulnerable to CQ X)
- **Adapt** recommendations to user developmental stage (Phase 4)

---

## 5.2 Requirements

### R1: Dialectical State Model

Track the current "state of play" for each deliberation:

```typescript
interface DialecticalState {
  deliberationId: string;
  
  // Active participants and their roles
  participants: {
    userId: string;
    role: 'proponent' | 'opponent' | 'neutral' | 'moderator';
    currentBurden: string[];  // What obligations they have
  }[];
  
  // Pending obligations (must respond)
  pendingObligations: {
    obligatedUserId: string;
    obligationType: 'respond_to_why' | 'satisfy_cq' | 'provide_grounds' | 'address_attack';
    targetMoveId: string;
    deadline?: Date;
    urgency: 'critical' | 'high' | 'normal' | 'low';
  }[];
  
  // Open loci (unresolved issues)
  openLoci: {
    locusId: string;
    locusType: 'claim' | 'argument' | 'cq';
    status: 'contested' | 'challenged' | 'undefended';
    activeParticipants: string[];
  }[];
  
  // Recent move context
  recentMoves: {
    moveId: string;
    kind: string;
    actorId: string;
    licensedResponses: string[];
  }[];
  
  // Phase state
  currentPhase: 'opening' | 'argumentation' | 'closing' | 'resolved';
}
```

### R2: Move Recommendation Engine

Generate contextual move recommendations:

```typescript
interface MoveRecommendation {
  id: string;
  
  // What move is recommended
  moveType: DialogueMoveKind;
  target?: {
    type: 'claim' | 'argument' | 'move' | 'cq';
    id: string;
  };
  
  // Why this move
  rationale: string;
  dialecticalReason: DialecticalReason;
  
  // Scoring
  priority: 'critical' | 'high' | 'medium' | 'low' | 'optional';
  relevanceScore: number;  // 0-100
  
  // Scaffolding integration (Phase 4)
  developmentalStage: DevelopmentalStage;  // Appropriate for users at this stage
  scaffoldingHints: string[];
  
  // Preview of move effects
  effects: {
    commitments: CommitmentDelta;
    burdenShifts: BurdenShift[];
    expectedResponses: string[];
  };
}

type DialecticalReason =
  | 'obligation_pending'      // You must respond to this
  | 'opportunity_attack'      // This claim is vulnerable
  | 'opportunity_support'     // This claim needs support
  | 'cq_unaddressed'         // CQ remains open
  | 'synthesis_available'    // Can synthesize positions
  | 'closure_possible'       // Can close this locus
  | 'commitment_conflict'    // Your commitments conflict
  | 'position_undefended'    // Your position needs defense
  | 'new_evidence_relevant'  // New evidence affects your claims
  | 'dialogue_stalled'       // Discussion needs movement
```

### R3: Move Licensing Rules

Define what moves are licensed in each state:

```typescript
interface MoveLicensingRules {
  // After ASSERT
  afterAssert: {
    licensed: ['WHY', 'GROUNDS', 'CONCEDE', 'ATTACK', 'SUPPORT'];
    required: [];  // No obligation
    prohibited: ['CLOSE'];  // Can't close immediately
  };
  
  // After WHY (challenge)
  afterWhy: {
    licensed: ['GROUNDS', 'RETRACT', 'REDIRECT'];
    required: ['GROUNDS' | 'RETRACT'];  // Must respond
    prohibited: [];
    obligationHolder: 'target_of_why';
    deadline: 'P3D';  // 3 days to respond
  };
  
  // After GROUNDS (response to WHY)
  afterGrounds: {
    licensed: ['CONCEDE', 'WHY', 'ATTACK', 'ACCEPT'];
    required: [];
    prohibited: [];
  };
  
  // After ATTACK
  afterAttack: {
    licensed: ['DEFEND', 'CONCEDE', 'RETRACT', 'COUNTER'];
    required: ['DEFEND' | 'CONCEDE' | 'RETRACT'];  // Must respond
    obligationHolder: 'author_of_attacked';
    deadline: 'P5D';
  };
  
  // After CQ_RAISE
  afterCqRaise: {
    licensed: ['CQ_SATISFY', 'CQ_REBUT', 'RETRACT'];
    required: ['CQ_SATISFY' | 'CQ_REBUT' | 'RETRACT'];
    obligationHolder: 'author_of_argument';
    deadline: 'P7D';
    burdenShift: true;
  };
  
  // After CONCEDE
  afterConcede: {
    licensed: ['CLOSE', 'THEREFORE', 'REDIRECT'];
    required: [];
    prohibited: [];
  };
  
  // After RETRACT
  afterRetract: {
    licensed: ['CLOSE', 'NEW_ASSERT'];
    required: [];
    prohibited: [];
  };
}
```

### R4: Stage-Aware Recommendations

Adapt recommendations to user's developmental stage (Phase 4):

```typescript
interface StageAwareRecommendations {
  // RDR / ARSA_EARLY: Simple, guided moves
  HEAVY: {
    maxRecommendations: 3;
    moveTypes: ['ASSERT', 'SUPPORT', 'WHY'];  // Simple moves only
    explanationLevel: 'detailed';
    showExamples: true;
    hideAdvanced: ['SUPPOSE', 'DISCHARGE', 'REDIRECT'];
  };
  
  // ARSA_MATURE: More options
  MODERATE: {
    maxRecommendations: 5;
    moveTypes: ['ASSERT', 'SUPPORT', 'WHY', 'ATTACK', 'GROUNDS', 'CONCEDE'];
    explanationLevel: 'summary';
    showExamples: false;
    hideAdvanced: ['SUPPOSE', 'DISCHARGE'];
  };
  
  // ARSD_EMERGING: Full tactical awareness
  LIGHT: {
    maxRecommendations: 8;
    moveTypes: 'all';
    explanationLevel: 'minimal';
    showStrategicAnalysis: true;
  };
  
  // ARSD_FLUENT: Complete control
  NONE: {
    maxRecommendations: 10;
    moveTypes: 'all';
    explanationLevel: 'none';  // User knows what to do
    showOpponentAnalysis: true;
    showCommitmentGraph: true;
  };
}
```

---

## 5.3 Schema Design

### 5.3.1 DialecticalState Model

```prisma
// Current dialectical state of a deliberation
model DialecticalState {
  id             String   @id @default(cuid())
  deliberationId String   @unique
  
  // Phase tracking
  currentPhase   DialecticalPhase @default(OPENING)
  phaseStartedAt DateTime         @default(now())
  
  // Computed state snapshot (cached, refreshed on moves)
  stateSnapshot  Json?    // Full DialecticalState object
  snapshotAt     DateTime @default(now())
  
  // Activity metrics
  totalMoves     Int      @default(0)
  lastMoveAt     DateTime?
  activeParticipantCount Int @default(0)
  
  // Stall detection
  isStalled      Boolean  @default(false)
  stalledSince   DateTime?
  stallReason    String?
  
  deliberation   Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  
  // Relations
  obligations    DialecticalObligation[]
  openLoci       OpenLocus[]
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([deliberationId])
  @@index([currentPhase])
  @@index([isStalled])
}

enum DialecticalPhase {
  OPENING        // Initial claims being made
  ARGUMENTATION  // Active argument/counter-argument
  SYNTHESIS      // Finding common ground
  CLOSING        // Wrapping up
  RESOLVED       // Deliberation complete
}
```

### 5.3.2 DialecticalObligation Model

```prisma
// Pending dialectical obligations
model DialecticalObligation {
  id              String   @id @default(cuid())
  dialecticalStateId String
  dialecticalState DialecticalState @relation(fields: [dialecticalStateId], references: [id], onDelete: Cascade)
  
  // Who is obligated
  obligatedUserId String
  
  // What they must do
  obligationType  ObligationType
  
  // What triggered this obligation
  triggerMoveId   String
  triggerMoveKind String
  
  // Target of response
  targetType      String   // 'claim' | 'argument' | 'move' | 'cq'
  targetId        String
  
  // Timing
  createdAt       DateTime @default(now())
  deadline        DateTime?
  urgency         ObligationUrgency @default(NORMAL)
  
  // Resolution
  status          ObligationStatus @default(PENDING)
  resolvedAt      DateTime?
  resolvedByMoveId String?
  resolutionType  String?  // 'satisfied' | 'waived' | 'defaulted' | 'superseded'
  
  @@index([dialecticalStateId])
  @@index([obligatedUserId])
  @@index([status])
  @@index([deadline])
  @@index([obligatedUserId, status])
}

enum ObligationType {
  RESPOND_TO_WHY    // Must provide grounds or retract
  SATISFY_CQ        // Must address critical question
  DEFEND_ATTACK     // Must defend against attack
  PROVIDE_GROUNDS   // Must justify assertion
  CLARIFY           // Must clarify ambiguous claim
  RESOLVE_CONFLICT  // Must address commitment conflict
}

enum ObligationUrgency {
  CRITICAL   // Immediate response needed
  HIGH       // Should respond soon
  NORMAL     // Standard timeframe
  LOW        // Optional/soft deadline
}

enum ObligationStatus {
  PENDING     // Not yet addressed
  OVERDUE     // Past deadline
  SATISFIED   // Fulfilled
  WAIVED      // Explicitly waived by challenger
  DEFAULTED   // User failed to respond
  SUPERSEDED  // Replaced by new obligation
}
```

### 5.3.3 OpenLocus Model

```prisma
// Open issues/loci in the deliberation
model OpenLocus {
  id              String   @id @default(cuid())
  dialecticalStateId String
  dialecticalState DialecticalState @relation(fields: [dialecticalStateId], references: [id], onDelete: Cascade)
  
  // What the locus is about
  locusType       LocusType
  targetType      String   // 'claim' | 'argument' | 'cq'
  targetId        String
  
  // Status
  status          LocusStatus @default(CONTESTED)
  
  // Participants
  proponentIds    String[]
  opponentIds     String[]
  
  // Tracking
  openedAt        DateTime @default(now())
  lastActivityAt  DateTime @default(now())
  closedAt        DateTime?
  closedByMoveId  String?
  
  // Analysis
  moveCount       Int      @default(0)
  depth           Int      @default(0)  // How deep in argument tree
  
  @@index([dialecticalStateId])
  @@index([status])
  @@index([locusType])
  @@index([dialecticalStateId, status])
}

enum LocusType {
  CONTESTED_CLAIM     // Claim with active challenges
  UNDEFENDED_CLAIM    // Claim without support
  OPEN_CQ             // Unanswered critical question
  ACTIVE_ATTACK       // Unresolved attack
  SYNTHESIS_POINT     // Potential agreement area
}

enum LocusStatus {
  CONTESTED    // Active disagreement
  CHALLENGED   // Under challenge, awaiting response
  UNDEFENDED   // Needs support
  RESOLVED     // Issue closed
  ABANDONED    // No longer pursued
}
```

### 5.3.4 MoveRecommendation Model

```prisma
// Generated move recommendations
model MoveRecommendation {
  id              String   @id @default(cuid())
  deliberationId  String
  forUserId       String
  
  // The recommendation
  moveType        String   // DialogueMove kind
  targetType      String?  // 'claim' | 'argument' | 'move' | 'cq'
  targetId        String?
  
  // Scoring
  priority        RecommendationPriority
  relevanceScore  Int      // 0-100
  
  // Reasoning
  dialecticalReason String
  rationale       String   @db.Text
  
  // Scaffolding (from Phase 4)
  forStage        String?  // DevelopmentalStage this is appropriate for
  scaffoldingHints Json?   // Hints for the user
  
  // Effect preview
  effectsPreview  Json?    // Commitment delta, burden shifts, etc.
  
  // Status
  status          RecommendationStatus @default(ACTIVE)
  dismissedAt     DateTime?
  actedOnAt       DateTime?
  actedOnMoveId   String?  // If user made this move
  
  createdAt       DateTime @default(now())
  expiresAt       DateTime?
  
  @@index([deliberationId, forUserId])
  @@index([forUserId, status])
  @@index([deliberationId, priority])
  @@index([createdAt])
}

enum RecommendationPriority {
  CRITICAL   // Must do this (obligation)
  HIGH       // Strong suggestion
  MEDIUM     // Good opportunity
  LOW        // Minor improvement
  OPTIONAL   // Nice to have
}

enum RecommendationStatus {
  ACTIVE     // Currently relevant
  DISMISSED  // User dismissed
  ACTED_ON   // User followed recommendation
  EXPIRED    // No longer relevant
  SUPERSEDED // Replaced by newer recommendation
}
```

### 5.3.5 MoveLicenseRule Model

```prisma
// Move licensing rules (configurable)
model MoveLicenseRule {
  id              String   @id @default(cuid())
  
  // After what move type
  afterMoveKind   String
  
  // What's licensed
  licensedMoves   String[]
  requiredMoves   String[]
  prohibitedMoves String[]
  
  // Obligation creation
  createsObligation Boolean @default(false)
  obligationType  String?
  obligationFor   String?  // 'actor' | 'target_author' | 'all_participants'
  deadline        String?  // ISO 8601 duration (e.g., 'P3D')
  urgency         String?
  
  // Burden effects
  shiftsBurden    Boolean  @default(false)
  burdenFrom      String?
  burdenTo        String?
  
  // Conditions
  conditions      Json?    // Additional conditions for this rule
  
  // Priority for rule resolution
  priority        Int      @default(0)
  
  createdAt       DateTime @default(now())
  
  @@unique([afterMoveKind])
  @@index([afterMoveKind])
}
```

### 5.3.6 Deliberation Model Extension

```prisma
// Add to existing Deliberation model:
model Deliberation {
  // ... existing fields ...
  
  // NEW: Dialectical state relation
  dialecticalState DialecticalState?
}
```

---

## 5.4 API Layer: Dialectical Recommendation Service

### 5.4.1 DialecticalRecommendationService

```typescript
// services/dialecticalRecommendation.ts

interface DialecticalRecommendationService {
  // === STATE MANAGEMENT ===
  
  /**
   * Get or create dialectical state for deliberation
   */
  getDialecticalState(deliberationId: string): Promise<DialecticalState>;
  
  /**
   * Update state after a move
   */
  onMoveCreated(move: DialogueMove): Promise<{
    state: DialecticalState;
    obligationsCreated: DialecticalObligation[];
    obligationsSatisfied: DialecticalObligation[];
    lociOpened: OpenLocus[];
    lociClosed: OpenLocus[];
  }>;
  
  /**
   * Refresh state snapshot
   */
  refreshStateSnapshot(deliberationId: string): Promise<DialecticalState>;
  
  // === RECOMMENDATIONS ===
  
  /**
   * Get recommendations for a user
   */
  getRecommendations(params: {
    deliberationId: string;
    userId: string;
    limit?: number;
    minPriority?: RecommendationPriority;
  }): Promise<MoveRecommendation[]>;
  
  /**
   * Generate fresh recommendations
   */
  generateRecommendations(params: {
    deliberationId: string;
    userId: string;
  }): Promise<MoveRecommendation[]>;
  
  /**
   * Get recommendations for specific context
   */
  getContextualRecommendations(params: {
    deliberationId: string;
    userId: string;
    context: 'viewing_claim' | 'viewing_argument' | 'in_thread' | 'overview';
    targetId?: string;
  }): Promise<MoveRecommendation[]>;
  
  /**
   * Record user response to recommendation
   */
  recordRecommendationResponse(params: {
    recommendationId: string;
    response: 'dismissed' | 'acted_on';
    moveId?: string;  // If acted on
  }): Promise<MoveRecommendation>;
  
  // === OBLIGATIONS ===
  
  /**
   * Get pending obligations for user
   */
  getPendingObligations(params: {
    userId: string;
    deliberationId?: string;
  }): Promise<DialecticalObligation[]>;
  
  /**
   * Check for overdue obligations
   */
  checkOverdueObligations(): Promise<{
    newlyOverdue: DialecticalObligation[];
    notified: string[];  // User IDs notified
  }>;
  
  // === OPEN LOCI ===
  
  /**
   * Get open loci for deliberation
   */
  getOpenLoci(params: {
    deliberationId: string;
    status?: LocusStatus;
    type?: LocusType;
  }): Promise<OpenLocus[]>;
  
  /**
   * Find synthesis opportunities
   */
  findSynthesisOpportunities(deliberationId: string): Promise<{
    loci: OpenLocus[];
    potentialAgreements: {
      locusId: string;
      participants: string[];
      commonGround: string[];
    }[];
  }>;
  
  // === MOVE LICENSING ===
  
  /**
   * Get licensed moves for current state
   */
  getLicensedMoves(params: {
    deliberationId: string;
    userId: string;
    afterMoveId?: string;
  }): Promise<{
    licensed: string[];
    required: string[];
    prohibited: string[];
    recommendations: MoveRecommendation[];
  }>;
  
  /**
   * Check if a move is licensed
   */
  isMoveAllowed(params: {
    deliberationId: string;
    userId: string;
    moveType: string;
    targetId?: string;
  }): Promise<{
    allowed: boolean;
    reason?: string;
    alternatives?: string[];
  }>;
  
  // === STALL DETECTION ===
  
  /**
   * Detect and handle stalled deliberations
   */
  detectStalls(): Promise<{
    stalledDeliberations: string[];
    suggestions: {
      deliberationId: string;
      reason: string;
      suggestedMoves: MoveRecommendation[];
    }[];
  }>;
  
  // === ANALYTICS ===
  
  /**
   * Get dialectical analytics for deliberation
   */
  getDialecticalAnalytics(deliberationId: string): Promise<{
    phaseHistory: { phase: string; duration: number }[];
    obligationStats: {
      created: number;
      satisfied: number;
      defaulted: number;
    };
    participantBalance: {
      userId: string;
      moveCount: number;
      obligationsSatisfied: number;
      attacksLaunched: number;
      attacksReceived: number;
    }[];
    effectiveMoves: {
      moveId: string;
      effect: string;
    }[];
  }>;
}
```

### 5.4.2 Recommendation Generation Algorithm

```typescript
// lib/dialectical/recommendations.ts

interface RecommendationContext {
  deliberation: Deliberation;
  state: DialecticalState;
  user: User;
  profile: ArgumentationProfile;  // From Phase 4
  
  // User's current position
  userClaims: Claim[];
  userArguments: Argument[];
  userCommitments: Commitment[];
  
  // Deliberation state
  allClaims: Claim[];
  allArguments: Argument[];
  labels: Map<string, GroundLabel>;  // From Phase 3
  tickets: Map<string, InferenceTicket>;  // From Phase 2
}

/**
 * Generate move recommendations for a user
 */
async function generateRecommendations(
  ctx: RecommendationContext
): Promise<MoveRecommendation[]> {
  const recommendations: MoveRecommendation[] = [];
  
  // 1. CRITICAL: Pending obligations (must do)
  const obligations = ctx.state.obligations.filter(
    o => o.obligatedUserId === ctx.user.id && o.status === 'PENDING'
  );
  
  for (const obligation of obligations) {
    recommendations.push({
      moveType: getObligationResponseMove(obligation),
      targetType: obligation.targetType,
      targetId: obligation.targetId,
      priority: obligation.urgency === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      dialecticalReason: 'obligation_pending',
      rationale: generateObligationRationale(obligation),
      relevanceScore: 100 - getObligationAgeScore(obligation),
      forStage: 'all',  // Obligations apply to all stages
      effectsPreview: previewObligationResponse(obligation),
    });
  }
  
  // 2. HIGH: Attack opportunities (opponent vulnerabilities)
  const vulnerableClaims = findVulnerableClaims(ctx);
  for (const claim of vulnerableClaims) {
    if (ctx.profile.overallStage !== 'RDR') {  // Not for beginners
      recommendations.push({
        moveType: 'ATTACK',
        targetType: 'claim',
        targetId: claim.id,
        priority: 'HIGH',
        dialecticalReason: 'opportunity_attack',
        rationale: `This claim (${truncate(claim.text)}) has ${claim.vulnerabilities.join(', ')}`,
        relevanceScore: claim.vulnerabilityScore,
        forStage: claim.vulnerabilityComplexity,
        effectsPreview: previewAttack(claim),
      });
    }
  }
  
  // 3. HIGH: Defend own positions under attack
  const attackedPositions = findAttackedUserPositions(ctx);
  for (const position of attackedPositions) {
    recommendations.push({
      moveType: 'DEFEND',
      targetType: position.type,
      targetId: position.id,
      priority: 'HIGH',
      dialecticalReason: 'position_undefended',
      rationale: `Your ${position.type} is under attack and needs defense`,
      relevanceScore: 90,
      forStage: 'all',
      effectsPreview: previewDefense(position),
    });
  }
  
  // 4. MEDIUM: Unaddressed CQs on own arguments
  const openCQs = findOpenCQsForUser(ctx);
  for (const cq of openCQs) {
    recommendations.push({
      moveType: 'CQ_SATISFY',
      targetType: 'cq',
      targetId: cq.id,
      priority: 'MEDIUM',
      dialecticalReason: 'cq_unaddressed',
      rationale: `Critical question "${cq.text}" remains open on your argument`,
      relevanceScore: 85,
      forStage: getStageForCQ(cq),
      scaffoldingHints: getCQScaffoldingHints(cq, ctx.profile),
    });
  }
  
  // 5. MEDIUM: Support opportunities (strengthen positions)
  const supportOpportunities = findSupportOpportunities(ctx);
  for (const opp of supportOpportunities) {
    recommendations.push({
      moveType: 'SUPPORT',
      targetType: 'claim',
      targetId: opp.claimId,
      priority: 'MEDIUM',
      dialecticalReason: 'opportunity_support',
      rationale: opp.rationale,
      relevanceScore: opp.score,
      forStage: 'ARSA_EARLY',  // Good for beginners
    });
  }
  
  // 6. LOW: Synthesis opportunities
  if (ctx.profile.overallStage === 'ARSD_EMERGING' || 
      ctx.profile.overallStage === 'ARSD_FLUENT') {
    const synthOpps = findSynthesisOpportunities(ctx);
    for (const synth of synthOpps) {
      recommendations.push({
        moveType: 'SYNTHESIS',
        targetType: 'locus',
        targetId: synth.locusId,
        priority: 'LOW',
        dialecticalReason: 'synthesis_available',
        rationale: `Potential for synthesis between ${synth.participants.join(' and ')}`,
        relevanceScore: synth.score,
        forStage: 'ARSD_EMERGING',
      });
    }
  }
  
  // 7. OPTIONAL: Closure opportunities
  const closureOpps = findClosureOpportunities(ctx);
  for (const closure of closureOpps) {
    recommendations.push({
      moveType: 'CLOSE',
      targetType: 'locus',
      targetId: closure.locusId,
      priority: 'OPTIONAL',
      dialecticalReason: 'closure_possible',
      rationale: `This discussion point can be closed: ${closure.reason}`,
      relevanceScore: closure.score,
      forStage: 'ARSA_MATURE',
    });
  }
  
  // Filter by stage
  const filteredRecs = filterByStage(recommendations, ctx.profile);
  
  // Sort by priority and relevance
  return sortRecommendations(filteredRecs);
}

/**
 * Find claims vulnerable to attack
 */
function findVulnerableClaims(ctx: RecommendationContext): VulnerableClaim[] {
  const vulnerabilities: VulnerableClaim[] = [];
  
  for (const claim of ctx.allClaims) {
    // Skip user's own claims
    if (claim.createdById === ctx.user.id) continue;
    
    const vulns: string[] = [];
    let score = 0;
    let complexity: DevelopmentalStage = 'ARSA_EARLY';
    
    // Check: No evidence
    if (!claim.evidence?.length) {
      vulns.push('no evidence cited');
      score += 20;
    }
    
    // Check: Unsatisfied CQs on supporting arguments
    const supportingArgs = ctx.allArguments.filter(
      a => a.conclusionClaimId === claim.id
    );
    for (const arg of supportingArgs) {
      const ticket = ctx.tickets.get(arg.id);
      if (ticket?.status === 'CHALLENGED' || ticket?.status === 'SUSPENDED') {
        vulns.push('supporting argument has unsatisfied CQs');
        score += 30;
        complexity = 'ARSA_MATURE';
      }
    }
    
    // Check: Contradicts user's commitments
    const contradicts = findContradictions(claim, ctx.userCommitments);
    if (contradicts.length > 0) {
      vulns.push(`contradicts your commitment to "${contradicts[0]}"`);
      score += 40;
      complexity = 'ARSD_EMERGING';
    }
    
    // Check: Label is UNDEC (weakly defended)
    const label = ctx.labels.get(claim.id);
    if (label === 'UNDEC') {
      vulns.push('currently undecided status');
      score += 15;
    }
    
    if (vulns.length > 0) {
      vulnerabilities.push({
        id: claim.id,
        text: claim.text,
        vulnerabilities: vulns,
        vulnerabilityScore: Math.min(score, 100),
        vulnerabilityComplexity: complexity,
      });
    }
  }
  
  return vulnerabilities.sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);
}
```

### 5.4.3 Move Event Hooks

```typescript
// services/dialecticalHooks.ts

/**
 * Hook into DialogueMove creation
 */
export async function onDialogueMoveCreated(move: DialogueMove): Promise<void> {
  const service = getDialecticalRecommendationService();
  
  // 1. Update dialectical state
  const { obligationsCreated, obligationsSatisfied } = await service.onMoveCreated(move);
  
  // 2. Check if this move satisfies any obligations
  if (obligationsSatisfied.length > 0) {
    // Log satisfaction for Bildung tracking (Phase 4)
    for (const obligation of obligationsSatisfied) {
      await bildungService.recordEvent({
        userId: move.actorId,
        eventType: 'OBLIGATION_SATISFIED',
        competency: 'dialecticalAwareness',
        points: 3,
        context: { obligationId: obligation.id },
      });
    }
  }
  
  // 3. Create new obligations if move requires response
  if (obligationsCreated.length > 0) {
    // Notify obligated users
    for (const obligation of obligationsCreated) {
      await notifyObligatedUser(obligation);
    }
  }
  
  // 4. Regenerate recommendations for affected users
  const affectedUsers = getAffectedUsers(move);
  for (const userId of affectedUsers) {
    await service.generateRecommendations({
      deliberationId: move.deliberationId,
      userId,
    });
  }
  
  // 5. Check for stalls
  await service.detectStalls();
}

/**
 * Notify user of pending obligation
 */
async function notifyObligatedUser(obligation: DialecticalObligation): Promise<void> {
  await prisma.notification.create({
    data: {
      user_id: obligation.obligatedUserId,
      type: 'DIALECTICAL_OBLIGATION',
      content: {
        obligationType: obligation.obligationType,
        targetId: obligation.targetId,
        deadline: obligation.deadline,
        urgency: obligation.urgency,
        deliberationId: obligation.dialecticalState.deliberationId,
      },
    },
  });
}
```

---

## 5.5 UI Integration

### 5.5.1 Recommendation Panel Component

```typescript
// components/dialectical/RecommendationPanel.tsx

interface RecommendationPanelProps {
  deliberationId: string;
  userId: string;
  context: 'sidebar' | 'inline' | 'modal';
}

export function RecommendationPanel({ deliberationId, userId, context }: Props) {
  const { data: recommendations } = useRecommendations(deliberationId, userId);
  const { data: profile } = useArgumentationProfile(userId);
  
  // Filter by scaffolding level
  const visibleRecs = filterByScaffolding(recommendations, profile.scaffoldingLevel);
  
  return (
    <div className="recommendation-panel">
      {/* Critical obligations first */}
      {visibleRecs.filter(r => r.priority === 'CRITICAL').map(rec => (
        <ObligationCard 
          key={rec.id} 
          recommendation={rec}
          onAct={handleAct}
          onDismiss={handleDismiss}
        />
      ))}
      
      {/* Other recommendations */}
      {visibleRecs.filter(r => r.priority !== 'CRITICAL').map(rec => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          showHints={profile.scaffoldingLevel === 'HEAVY'}
          onAct={handleAct}
          onDismiss={handleDismiss}
        />
      ))}
      
      {visibleRecs.length === 0 && (
        <EmptyState 
          message="No suggested moves right now. You're doing great!"
          stage={profile.overallStage}
        />
      )}
    </div>
  );
}

function RecommendationCard({ recommendation, showHints, onAct, onDismiss }: CardProps) {
  return (
    <div className={`rec-card priority-${recommendation.priority}`}>
      <div className="rec-header">
        <MoveIcon type={recommendation.moveType} />
        <span className="rec-type">{formatMoveType(recommendation.moveType)}</span>
        <PriorityBadge priority={recommendation.priority} />
      </div>
      
      <p className="rec-rationale">{recommendation.rationale}</p>
      
      {showHints && recommendation.scaffoldingHints && (
        <div className="rec-hints">
          {recommendation.scaffoldingHints.map((hint, i) => (
            <Hint key={i}>{hint}</Hint>
          ))}
        </div>
      )}
      
      {recommendation.effectsPreview && (
        <EffectsPreview effects={recommendation.effectsPreview} />
      )}
      
      <div className="rec-actions">
        <Button onClick={() => onAct(recommendation)}>
          Make This Move
        </Button>
        <Button variant="ghost" onClick={() => onDismiss(recommendation)}>
          Not Now
        </Button>
      </div>
    </div>
  );
}
```

### 5.5.2 Obligation Notification Component

```typescript
// components/dialectical/ObligationNotification.tsx

export function ObligationNotification({ obligation }: Props) {
  const timeRemaining = getTimeRemaining(obligation.deadline);
  const isOverdue = obligation.status === 'OVERDUE';
  
  return (
    <div className={`obligation-notification ${isOverdue ? 'overdue' : ''}`}>
      <AlertIcon />
      
      <div className="obligation-content">
        <h4>{getObligationTitle(obligation.obligationType)}</h4>
        <p>{getObligationDescription(obligation)}</p>
        
        {obligation.deadline && (
          <div className="deadline">
            <ClockIcon />
            <span>
              {isOverdue 
                ? `Overdue by ${formatDuration(-timeRemaining)}`
                : `Respond within ${formatDuration(timeRemaining)}`
              }
            </span>
          </div>
        )}
      </div>
      
      <Button 
        variant={isOverdue ? 'danger' : 'primary'}
        onClick={() => navigateToObligation(obligation)}
      >
        Respond Now
      </Button>
    </div>
  );
}
```

---

## 5.6 Migration Strategy

### Step 1: Add New Models

```bash
npx prisma db push
```

### Step 2: Seed Move License Rules

```typescript
// scripts/seed-move-license-rules.ts

const MOVE_LICENSE_RULES: MoveLicenseRule[] = [
  {
    afterMoveKind: 'ASSERT',
    licensedMoves: ['WHY', 'GROUNDS', 'CONCEDE', 'ATTACK', 'SUPPORT'],
    requiredMoves: [],
    prohibitedMoves: ['CLOSE'],
    createsObligation: false,
  },
  {
    afterMoveKind: 'WHY',
    licensedMoves: ['GROUNDS', 'RETRACT', 'REDIRECT'],
    requiredMoves: ['GROUNDS', 'RETRACT'],
    prohibitedMoves: [],
    createsObligation: true,
    obligationType: 'RESPOND_TO_WHY',
    obligationFor: 'target_author',
    deadline: 'P3D',
    urgency: 'HIGH',
    shiftsBurden: true,
    burdenTo: 'target_author',
  },
  {
    afterMoveKind: 'ATTACK',
    licensedMoves: ['DEFEND', 'CONCEDE', 'RETRACT', 'COUNTER'],
    requiredMoves: ['DEFEND', 'CONCEDE', 'RETRACT'],
    prohibitedMoves: [],
    createsObligation: true,
    obligationType: 'DEFEND_ATTACK',
    obligationFor: 'target_author',
    deadline: 'P5D',
    urgency: 'HIGH',
  },
  {
    afterMoveKind: 'CQ_RAISE',
    licensedMoves: ['CQ_SATISFY', 'CQ_REBUT', 'RETRACT'],
    requiredMoves: ['CQ_SATISFY', 'CQ_REBUT', 'RETRACT'],
    prohibitedMoves: [],
    createsObligation: true,
    obligationType: 'SATISFY_CQ',
    obligationFor: 'target_author',
    deadline: 'P7D',
    urgency: 'NORMAL',
    shiftsBurden: true,
  },
  // ... more rules
];

async function seedMoveLicenseRules() {
  for (const rule of MOVE_LICENSE_RULES) {
    await prisma.moveLicenseRule.upsert({
      where: { afterMoveKind: rule.afterMoveKind },
      create: rule,
      update: rule,
    });
  }
}
```

### Step 3: Initialize Dialectical States

```typescript
// scripts/init-dialectical-states.ts

async function initDialecticalStates() {
  const deliberations = await prisma.deliberation.findMany({
    where: { dialecticalState: null },
    select: { id: true },
  });
  
  for (const delib of deliberations) {
    await prisma.dialecticalState.create({
      data: {
        deliberationId: delib.id,
        currentPhase: 'ARGUMENTATION',  // Default for existing
      },
    });
    
    // Generate initial open loci from existing claims/arguments
    await generateInitialLoci(delib.id);
  }
}
```

### Step 4: Wire Up Event Hooks

Add hooks to DialogueMove creation flow:

```typescript
// In dialogue move creation handler:
await onDialogueMoveCreated(newMove);
```

---

## 5.7 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Schema migration | 100% | All new models created |
| License rules seeded | 100% | All move types have rules |
| Dialectical states initialized | 100% | All deliberations have state |
| Recommendation accuracy | > 70% | Recommendations acted on vs dismissed |
| Obligation satisfaction rate | > 80% | Obligations satisfied before deadline |
| Stall detection | > 90% | Stalls detected within 24h |
| User engagement | +15% | Move count after recommendations |
| Stage-appropriate recs | > 85% | Recs match user developmental stage |

---

## Phase 5 Status

- [x] 5.1 Overview — Complete
- [x] 5.2 Requirements — Complete
- [x] 5.3 Schema Design — Complete
- [x] 5.4 API Layer — Complete
- [x] 5.5 UI Integration — Complete
- [x] 5.6 Migration Strategy — Complete
- [ ] 5.7 Implementation — Not started
- [ ] 5.8 Testing — Not started

---

## Connection to Sellarsian Framework

| Sellarsian Concept | Phase 5 Implementation |
|-------------------|----------------------|
| **Game of Giving and Asking for Reasons** | Move licensing, obligations, recommendations |
| **Illocutionary Force** | DialogueMove types create different effects |
| **Commitment Incurrence** | Moves create/modify commitments |
| **Entitlement Challenge** | WHY moves create obligations |
| **Licensed Responses** | MoveLicenseRule defines what's allowed |
| **Dialectical Obligations** | DialecticalObligation tracks what users must do |
| **Space of Reasons as Practice** | Recommendations guide users in the practice |
| **Pattern-Governed Behavior** | Recommendations scaffold norm conformance |

---

# Phase 6: Picturing-Based Feedback Systems — Grounding Claims in Reality

## 6.1 Overview: The Sellarsian Picturing Relation

From the Deep Study synthesis, Sellars distinguishes two fundamentally different ways language connects to the world:

> "**Picturing** is a non-semantic, causal-structural relation between language and the world. It is NOT reference, NOT truth-conditions, but a pattern-matching between linguistic items and worldly configurations."

### The Dual Nature of Linguistic Items

| Aspect | Description | Platform Relevance |
|--------|-------------|-------------------|
| **Signifying** | What terms *mean* — inferential role in the space of reasons | Argument structure, scheme matching, commitment tracking |
| **Picturing** | How terms *map* to world structures — causal/predictive accuracy | Evidence quality, prediction outcomes, empirical feedback |

### Why Picturing Matters for Mesh

Most argumentation platforms focus solely on *signifying* — they track logical structure, inferential relations, and dialectical moves. But they miss a crucial dimension:

**Claims that are inferentially impeccable can still fail to "picture" reality accurately.**

Example:
- Argument: "All markets are efficient" → "This market will correct quickly"
- Inferentially valid (given the premise)
- But: Premise may not *picture* actual market behavior
- Picturing feedback: Track whether predictions based on this claim actually succeed

### The Picturing Feedback Loop

```
Claims in Space of Reasons
         │
         ▼
┌─────────────────────┐
│  Generate Predictions │
│  (Picturing projections)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Observe Outcomes    │
│  (World states)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Compare & Score     │
│  (Picturing accuracy) │
└──────────┬──────────┘
           │
           ▼
    Update Claim Status
    (Reliable vs Unreliable)
```

### Current Infrastructure (from Phase 1)

Phase 1 introduced:
- `ClaimPrediction` — Predictions derived from claims
- `ClaimOutcome` — Actual outcomes for claims
- `PicturingRecord` — Picturing accuracy tracking

Phase 6 **extends** this infrastructure with:
- Systematic prediction generation from claims
- Outcome collection and verification
- Aggregate picturing scores
- Feedback into argument evaluation
- User-facing reliability indicators

---

## 6.2 Requirements

### R1: Prediction Management System

Generate, track, and evaluate predictions systematically:

```typescript
interface PredictionSystem {
  // Prediction generation
  generatePredictions(claim: Claim): PredictionSpec[];
  
  // Types of predictions
  predictionTypes: {
    EXPLICIT: 'User explicitly states prediction';
    DERIVED: 'Inferred from claim + context';
    CONDITIONAL: 'If X then Y';
    TEMPORAL: 'By date Z, X will happen';
    COMPARATIVE: 'X will be greater/less than Y';
  };
  
  // Prediction lifecycle
  lifecycle: {
    DRAFT: 'User is formulating';
    ACTIVE: 'Awaiting outcome';
    OUTCOME_PENDING: 'Can be evaluated';
    EVALUATED: 'Outcome recorded';
    CONTESTED: 'Outcome disputed';
  };
}

interface PredictionSpec {
  id: string;
  sourceClaimId: string;
  
  // What's predicted
  predictionType: PredictionType;
  predictionText: string;
  
  // Operationalization
  measurableCriteria: string[];
  evaluationMethod: 'binary' | 'scaled' | 'comparative';
  
  // Timing
  predictionDate: Date;
  resolutionDeadline?: Date;
  earlyResolutionConditions?: string[];
  
  // Confidence
  authorConfidence?: number;  // 0-100
  communityConfidence?: number;  // Aggregated
  
  // Stakes
  stakeLevel: 'trivial' | 'minor' | 'significant' | 'major' | 'critical';
}
```

### R2: Outcome Collection and Verification

Gather evidence about prediction outcomes:

```typescript
interface OutcomeSystem {
  // Outcome types
  outcomeTypes: {
    CONFIRMED: 'Prediction matched outcome';
    REFUTED: 'Prediction did not match';
    PARTIAL: 'Some aspects matched';
    SUPERSEDED: 'Conditions changed, prediction moot';
    INDETERMINATE: 'Cannot evaluate';
  };
  
  // Verification levels
  verificationLevels: {
    UNVERIFIED: 'Claimed but not checked';
    SELF_REPORTED: 'Author reports outcome';
    PEER_VERIFIED: 'Other users confirm';
    EVIDENCE_LINKED: 'External evidence provided';
    EXPERT_VERIFIED: 'Domain expert confirms';
    CONSENSUS: 'Community consensus reached';
  };
  
  // Dispute handling
  disputeProcess: {
    CLAIM: 'Someone disputes outcome';
    EVIDENCE_PERIOD: 'Gather evidence';
    COMMUNITY_VOTE: 'If needed';
    RESOLUTION: 'Final determination';
  };
}

interface OutcomeRecord {
  id: string;
  predictionId: string;
  
  // What happened
  outcomeType: OutcomeType;
  outcomeDescription: string;
  
  // Evidence
  evidenceLinks: EvidenceLink[];
  
  // Verification
  verificationLevel: VerificationLevel;
  verifiedBy: string[];
  
  // Scoring
  accuracyScore?: number;  // 0-100 for scaled predictions
  
  // Timing
  outcomeDate: Date;
  recordedAt: Date;
  
  // Disputes
  disputeStatus?: DisputeStatus;
  disputeResolution?: string;
}
```

### R3: Picturing Score Aggregation

Compute aggregate reliability scores:

```typescript
interface PicturingScoreSystem {
  // Score dimensions
  scoreDimensions: {
    CLAIM_LEVEL: 'How well does this claim picture reality?';
    ARGUMENT_LEVEL: 'How reliable is this argument pattern?';
    USER_LEVEL: 'How accurate is this user overall?';
    SCHEME_LEVEL: 'How reliable is this scheme in this domain?';
    DOMAIN_LEVEL: 'How picturable is this domain?';
  };
  
  // Scoring algorithm
  computeScore(entity: Claim | Argument | User): PicturingScore;
  
  // Time-weighting
  timeDecay: {
    recentWeight: number;  // Last 30 days
    historicalWeight: number;  // Older
    recencyHalfLife: 'P90D';  // 90 days
  };
  
  // Confidence intervals
  confidenceInterval(score: PicturingScore): {
    lower: number;
    upper: number;
    sampleSize: number;
  };
}

interface PicturingScore {
  entityType: 'claim' | 'argument' | 'user' | 'scheme';
  entityId: string;
  
  // Core score
  score: number;  // 0-100
  reliability: 'unreliable' | 'questionable' | 'neutral' | 'reliable' | 'highly_reliable';
  
  // Breakdown
  breakdown: {
    predictionsTotal: number;
    predictionsConfirmed: number;
    predictionsRefuted: number;
    predictionsPartial: number;
    predictionsIndeterminate: number;
  };
  
  // Confidence
  confidence: number;  // Based on sample size
  confidenceInterval: [number, number];
  
  // Trend
  trend: 'improving' | 'stable' | 'declining';
  trendMagnitude: number;
  
  // Last updated
  computedAt: Date;
  nextUpdateAt: Date;
}
```

### R4: Feedback Integration

Feed picturing results back into argumentation:

```typescript
interface FeedbackIntegration {
  // Argument strength adjustment
  adjustArgumentStrength(argument: Argument): {
    originalStrength: number;
    picturingAdjustment: number;
    adjustedStrength: number;
    reason: string;
  };
  
  // Scheme reliability
  schemeReliability(schemeId: string, domain: string): {
    reliability: number;
    sampleSize: number;
    recommendation: 'trusted' | 'use_with_caution' | 'avoid';
  };
  
  // Claim credibility
  claimCredibility(claim: Claim): {
    inferentialCredibility: number;  // From argument structure
    picturingCredibility: number;     // From prediction outcomes
    combinedCredibility: number;
    displayBadge: 'empirically_grounded' | 'theoretical' | 'speculative' | 'unreliable';
  };
  
  // User expertise calibration
  userCalibration(userId: string): {
    overconfidence: number;  // +/- deviation
    biasDomains: string[];   // Domains where predictions fail
    strengthDomains: string[];  // Domains where predictions succeed
  };
}
```

### R5: User-Facing Reliability Indicators

Surface picturing information in UI:

```typescript
interface ReliabilityIndicators {
  // Claim indicators
  claimIndicator: {
    badge: 'empirically_grounded' | 'theoretical' | 'speculative' | 'untested' | 'unreliable';
    tooltip: string;
    predictionsCount: number;
    successRate?: number;
  };
  
  // Argument indicators
  argumentIndicator: {
    schemeReliability: 'proven' | 'promising' | 'unknown' | 'problematic';
    premiseReliability: 'grounded' | 'mixed' | 'speculative';
    overallConfidence: 'high' | 'medium' | 'low' | 'uncertain';
  };
  
  // User indicators
  userIndicator: {
    trackRecord: 'excellent' | 'good' | 'developing' | 'poor';
    predictionsCount: number;
    calibration: 'well_calibrated' | 'overconfident' | 'underconfident';
    domains: { domain: string; reliability: number }[];
  };
  
  // Deliberation health
  deliberationHealth: {
    groundedClaims: number;
    speculativeClaims: number;
    groundednessRatio: number;
    recommendation: string;
  };
}
```

---

*[Phase 6 continues in next section: Schema Design]*

## 6.3 Schema Design

### 6.3.1 Extended ClaimPrediction Model

```prisma
// Predictions derived from claims (extends Phase 1)
model ClaimPrediction {
  id              String   @id @default(cuid())
  claimId         String
  
  // Prediction details
  predictionType  PredictionType
  predictionText  String   @db.Text
  
  // Operationalization
  measurableCriteria Json?   // Array of criteria strings
  evaluationMethod EvaluationMethod @default(BINARY)
  
  // Timing
  predictionDate  DateTime @default(now())
  resolutionDeadline DateTime?
  earlyResolutionConditions Json?
  
  // Confidence
  authorConfidence Float?   // 0-100
  communityConfidenceSnapshot Float?
  
  // Stakes
  stakeLevel      StakeLevel @default(MINOR)
  
  // Lifecycle
  status          PredictionStatus @default(DRAFT)
  
  // Author
  createdById     String
  
  // Resolution
  resolvedAt      DateTime?
  resolutionType  ResolutionType?
  
  // Relations
  claim           Claim    @relation(fields: [claimId], references: [id], onDelete: Cascade)
  createdBy       User     @relation(fields: [createdById], references: [id])
  outcomes        ClaimOutcome[]
  confidenceVotes PredictionConfidenceVote[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([claimId])
  @@index([createdById])
  @@index([status])
  @@index([resolutionDeadline])
  @@index([predictionType])
  @@index([stakeLevel])
}

enum PredictionType {
  EXPLICIT      // User explicitly states prediction
  DERIVED       // Inferred from claim + context
  CONDITIONAL   // If X then Y
  TEMPORAL      // By date Z, X will happen
  COMPARATIVE   // X will be greater/less than Y
  TREND         // X will increase/decrease
  THRESHOLD     // X will exceed/fall below Y
}

enum EvaluationMethod {
  BINARY        // Yes/No outcome
  SCALED        // 0-100 accuracy
  COMPARATIVE   // Better/worse than reference
  CATEGORICAL   // Multiple possible outcomes
}

enum StakeLevel {
  TRIVIAL       // Inconsequential
  MINOR         // Small implications
  SIGNIFICANT   // Meaningful implications
  MAJOR         // Important implications
  CRITICAL      // High-stakes prediction
}

enum PredictionStatus {
  DRAFT         // Being formulated
  ACTIVE        // Awaiting outcome
  OUTCOME_PENDING // Can be evaluated now
  EVALUATED     // Outcome recorded
  CONTESTED     // Outcome disputed
  SUPERSEDED    // Conditions changed
  WITHDRAWN     // Author withdrew
}

enum ResolutionType {
  CONFIRMED     // Prediction matched
  REFUTED       // Prediction failed
  PARTIAL       // Some aspects matched
  SUPERSEDED    // Conditions changed
  INDETERMINATE // Cannot evaluate
}
```

### 6.3.2 Extended ClaimOutcome Model

```prisma
// Actual outcomes for predictions (extends Phase 1)
model ClaimOutcome {
  id              String   @id @default(cuid())
  predictionId    String
  
  // What happened
  outcomeType     OutcomeType
  outcomeDescription String @db.Text
  
  // Scoring
  accuracyScore   Float?   // 0-100 for scaled predictions
  
  // Timing
  outcomeDate     DateTime
  recordedAt      DateTime @default(now())
  
  // Who recorded
  recordedById    String
  
  // Verification
  verificationLevel VerificationLevel @default(UNVERIFIED)
  
  // Relations
  prediction      ClaimPrediction @relation(fields: [predictionId], references: [id], onDelete: Cascade)
  recordedBy      User     @relation(fields: [recordedById], references: [id])
  evidenceLinks   OutcomeEvidenceLink[]
  verifications   OutcomeVerification[]
  disputes        OutcomeDispute[]
  
  @@index([predictionId])
  @@index([recordedById])
  @@index([outcomeType])
  @@index([verificationLevel])
}

enum OutcomeType {
  CONFIRMED       // Prediction matched outcome
  REFUTED         // Prediction did not match
  PARTIAL         // Some aspects matched
  SUPERSEDED      // Conditions changed
  INDETERMINATE   // Cannot evaluate
}

enum VerificationLevel {
  UNVERIFIED      // Claimed but not checked
  SELF_REPORTED   // Author reports outcome
  PEER_VERIFIED   // Other users confirm
  EVIDENCE_LINKED // External evidence provided
  EXPERT_VERIFIED // Domain expert confirms
  CONSENSUS       // Community consensus reached
}
```

### 6.3.3 Outcome Evidence Link Model

```prisma
// Evidence supporting outcome claims
model OutcomeEvidenceLink {
  id              String   @id @default(cuid())
  outcomeId       String
  
  // Evidence details
  evidenceType    EvidenceType
  title           String
  url             String?
  description     String?  @db.Text
  
  // Source credibility
  sourceCredibility SourceCredibility @default(UNRATED)
  
  // Verification
  verifiedAt      DateTime?
  verifiedById    String?
  
  // Relations
  outcome         ClaimOutcome @relation(fields: [outcomeId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime @default(now())
  
  @@index([outcomeId])
  @@index([evidenceType])
}

enum EvidenceType {
  NEWS_ARTICLE    // News report
  ACADEMIC_PAPER  // Scholarly source
  OFFICIAL_DATA   // Government/institutional data
  MARKET_DATA     // Financial/market data
  SCREENSHOT      // Screenshot evidence
  DOCUMENT        // Document/report
  SOCIAL_POST     // Social media post
  PERSONAL_OBSERVATION // Direct observation
  OTHER           // Other evidence
}

enum SourceCredibility {
  UNRATED         // Not evaluated
  LOW             // Questionable source
  MEDIUM          // Acceptable source
  HIGH            // Reliable source
  AUTHORITATIVE   // Primary/official source
}
```

### 6.3.4 Outcome Verification Model

```prisma
// Verification votes for outcomes
model OutcomeVerification {
  id              String   @id @default(cuid())
  outcomeId       String
  verifierId      String
  
  // Verification details
  verificationResult VerificationResult
  comment         String?  @db.Text
  
  // Verifier credentials
  verifierExpertise String?  // Domain expertise
  verifierConfidence Float?  // 0-100
  
  // Relations
  outcome         ClaimOutcome @relation(fields: [outcomeId], references: [id], onDelete: Cascade)
  verifier        User     @relation(fields: [verifierId], references: [id])
  
  createdAt       DateTime @default(now())
  
  @@unique([outcomeId, verifierId])
  @@index([outcomeId])
  @@index([verifierId])
}

enum VerificationResult {
  CONFIRMED       // Agrees with outcome
  DISPUTED        // Disagrees with outcome
  UNCERTAIN       // Cannot determine
  ABSTAIN         // No opinion
}
```

### 6.3.5 Outcome Dispute Model

```prisma
// Disputes about outcome determinations
model OutcomeDispute {
  id              String   @id @default(cuid())
  outcomeId       String
  
  // Dispute details
  disputantId     String
  disputeReason   String   @db.Text
  proposedOutcome OutcomeType?
  
  // Status
  status          DisputeStatus @default(OPEN)
  
  // Evidence period
  evidencePeriodEnds DateTime?
  
  // Resolution
  resolvedAt      DateTime?
  resolution      String?  @db.Text
  finalOutcome    OutcomeType?
  
  // Relations
  outcome         ClaimOutcome @relation(fields: [outcomeId], references: [id], onDelete: Cascade)
  disputant       User     @relation(fields: [disputantId], references: [id])
  disputeEvidence DisputeEvidence[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([outcomeId])
  @@index([disputantId])
  @@index([status])
}

enum DisputeStatus {
  OPEN            // Active dispute
  EVIDENCE_PERIOD // Gathering evidence
  COMMUNITY_VOTE  // Community voting
  RESOLVED        // Dispute resolved
  WITHDRAWN       // Disputant withdrew
}
```

### 6.3.6 Prediction Confidence Vote Model

```prisma
// Community confidence votes on predictions
model PredictionConfidenceVote {
  id              String   @id @default(cuid())
  predictionId    String
  voterId         String
  
  // Vote details
  confidence      Float    // 0-100
  rationale       String?  @db.Text
  
  // Relations
  prediction      ClaimPrediction @relation(fields: [predictionId], references: [id], onDelete: Cascade)
  voter           User     @relation(fields: [voterId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([predictionId, voterId])
  @@index([predictionId])
  @@index([voterId])
}
```

### 6.3.7 Picturing Score Model

```prisma
// Aggregated picturing scores for entities
model PicturingScore {
  id              String   @id @default(cuid())
  
  // What entity this score is for
  entityType      PicturableEntity
  entityId        String
  
  // Core score
  score           Float    // 0-100
  reliability     ReliabilityLevel
  
  // Breakdown
  predictionsTotal Int      @default(0)
  predictionsConfirmed Int   @default(0)
  predictionsRefuted Int     @default(0)
  predictionsPartial Int     @default(0)
  predictionsIndeterminate Int @default(0)
  
  // Confidence
  confidence      Float    // Based on sample size
  confidenceLower Float    // Lower bound
  confidenceUpper Float    // Upper bound
  
  // Trend
  trend           TrendDirection @default(STABLE)
  trendMagnitude  Float    @default(0)
  
  // Time tracking
  computedAt      DateTime @default(now())
  nextUpdateAt    DateTime?
  
  // History (for trend calculation)
  scoreHistory    Json?    // Array of { date, score } objects
  
  @@unique([entityType, entityId])
  @@index([entityType])
  @@index([entityId])
  @@index([reliability])
  @@index([score])
}

enum PicturableEntity {
  CLAIM           // Individual claim
  ARGUMENT        // Argument structure
  USER            // User track record
  SCHEME          // Argument scheme reliability
  DOMAIN          // Topic domain
}

enum ReliabilityLevel {
  UNRELIABLE      // < 30%
  QUESTIONABLE    // 30-50%
  NEUTRAL         // 50-60%
  RELIABLE        // 60-80%
  HIGHLY_RELIABLE // > 80%
}

enum TrendDirection {
  IMPROVING       // Score increasing
  STABLE          // Score stable
  DECLINING       // Score decreasing
}
```

### 6.3.8 User Calibration Model

```prisma
// User prediction calibration data
model UserCalibration {
  id              String   @id @default(cuid())
  userId          String   @unique
  
  // Overall calibration
  overallBias     Float    // +/- deviation from well-calibrated
  calibrationLevel CalibrationLevel
  
  // Domain breakdown
  domainScores    Json?    // { domain: { score, bias, predictions } }
  
  // Confidence analysis
  avgStatedConfidence Float?
  avgActualAccuracy Float?
  overconfidenceRatio Float?  // stated / actual
  
  // Streak tracking
  currentStreak   Int      @default(0)
  streakType      StreakType?
  longestStreak   Int      @default(0)
  
  // Temporal patterns
  recentAccuracy  Float?   // Last 30 days
  historicalAccuracy Float? // All time
  
  // Relations
  user            User     @relation(fields: [userId], references: [id])
  
  computedAt      DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([userId])
  @@index([calibrationLevel])
}

enum CalibrationLevel {
  WELL_CALIBRATED     // Stated confidence ≈ actual accuracy
  SLIGHTLY_OVERCONFIDENT
  OVERCONFIDENT
  HIGHLY_OVERCONFIDENT
  SLIGHTLY_UNDERCONFIDENT
  UNDERCONFIDENT
  INSUFFICIENT_DATA
}

enum StreakType {
  CORRECT         // Consecutive correct predictions
  INCORRECT       // Consecutive incorrect predictions
}
```

### 6.3.9 Scheme Reliability Model

```prisma
// Reliability scores for argument schemes in domains
model SchemeReliability {
  id              String   @id @default(cuid())
  schemeId        String
  domain          String   // Topic domain
  
  // Reliability data
  reliability     Float    // 0-100
  sampleSize      Int
  recommendation  SchemeRecommendation
  
  // Breakdown by CQ
  cqReliability   Json?    // { cqId: { satisfied: n, failed: n, reliability: x } }
  
  // Common failure modes
  failureModes    Json?    // Array of { mode: string, frequency: number }
  
  // Relations
  scheme          ArgumentScheme @relation(fields: [schemeId], references: [id])
  
  computedAt      DateTime @default(now())
  
  @@unique([schemeId, domain])
  @@index([schemeId])
  @@index([domain])
  @@index([reliability])
}

enum SchemeRecommendation {
  TRUSTED         // Use confidently
  USE_WITH_CAUTION // Additional scrutiny recommended
  AVOID           // High failure rate in this domain
  INSUFFICIENT_DATA // Not enough examples
}
```

### 6.3.10 Deliberation Groundedness Model

```prisma
// Groundedness metrics for deliberations
model DeliberationGroundedness {
  id              String   @id @default(cuid())
  deliberationId  String   @unique
  
  // Counts
  totalClaims     Int      @default(0)
  groundedClaims  Int      @default(0)  // With predictions
  testedClaims    Int      @default(0)  // With outcomes
  confirmedClaims Int      @default(0)
  refutedClaims   Int      @default(0)
  
  // Ratios
  groundednessRatio Float?  // grounded / total
  testingRatio    Float?   // tested / grounded
  successRatio    Float?   // confirmed / tested
  
  // Health assessment
  healthLevel     GroundednessHealth @default(UNKNOWN)
  recommendation  String?  @db.Text
  
  // Relations
  deliberation    Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  
  computedAt      DateTime @default(now())
  
  @@index([deliberationId])
  @@index([healthLevel])
}

enum GroundednessHealth {
  UNKNOWN         // Insufficient data
  THEORETICAL     // Few empirical claims
  SPECULATIVE     // Claims lack testing
  MIXED           // Some grounded, some not
  GROUNDED        // Well-tested claims
  EMPIRICALLY_ROBUST // Strong prediction success
}
```

---

*[Phase 6 continues in next section: API Layer]*

## 6.4 API Layer: Picturing Feedback Service

### 6.4.1 PicturingFeedbackService

```typescript
// services/picturingFeedback.ts

interface PicturingFeedbackService {
  // === PREDICTION MANAGEMENT ===
  
  /**
   * Create a prediction from a claim
   */
  createPrediction(params: {
    claimId: string;
    createdById: string;
    predictionType: PredictionType;
    predictionText: string;
    measurableCriteria?: string[];
    evaluationMethod?: EvaluationMethod;
    resolutionDeadline?: Date;
    authorConfidence?: number;
    stakeLevel?: StakeLevel;
  }): Promise<ClaimPrediction>;
  
  /**
   * Generate suggested predictions from claim
   */
  suggestPredictions(claimId: string): Promise<{
    suggestions: PredictionSuggestion[];
    claimAnalysis: {
      hasPredictiveContent: boolean;
      predictiveElements: string[];
      suggestedDeadlines: Date[];
    };
  }>;
  
  /**
   * Get predictions for a claim
   */
  getPredictions(params: {
    claimId?: string;
    userId?: string;
    status?: PredictionStatus;
    limit?: number;
  }): Promise<ClaimPrediction[]>;
  
  /**
   * Update prediction status
   */
  updatePredictionStatus(
    predictionId: string,
    status: PredictionStatus
  ): Promise<ClaimPrediction>;
  
  /**
   * Get predictions ready for evaluation
   */
  getPendingResolutions(): Promise<{
    predictions: ClaimPrediction[];
    byDeadline: Map<string, ClaimPrediction[]>;
  }>;
  
  // === OUTCOME MANAGEMENT ===
  
  /**
   * Record an outcome for a prediction
   */
  recordOutcome(params: {
    predictionId: string;
    recordedById: string;
    outcomeType: OutcomeType;
    outcomeDescription: string;
    outcomeDate: Date;
    evidenceLinks?: EvidenceLinkInput[];
    accuracyScore?: number;
  }): Promise<ClaimOutcome>;
  
  /**
   * Add evidence to an outcome
   */
  addEvidence(params: {
    outcomeId: string;
    evidenceType: EvidenceType;
    title: string;
    url?: string;
    description?: string;
  }): Promise<OutcomeEvidenceLink>;
  
  /**
   * Verify an outcome
   */
  verifyOutcome(params: {
    outcomeId: string;
    verifierId: string;
    result: VerificationResult;
    comment?: string;
    verifierExpertise?: string;
    verifierConfidence?: number;
  }): Promise<OutcomeVerification>;
  
  /**
   * Dispute an outcome
   */
  disputeOutcome(params: {
    outcomeId: string;
    disputantId: string;
    disputeReason: string;
    proposedOutcome?: OutcomeType;
  }): Promise<OutcomeDispute>;
  
  /**
   * Resolve a dispute
   */
  resolveDispute(params: {
    disputeId: string;
    resolution: string;
    finalOutcome: OutcomeType;
  }): Promise<OutcomeDispute>;
  
  // === CONFIDENCE VOTING ===
  
  /**
   * Vote on prediction confidence
   */
  voteConfidence(params: {
    predictionId: string;
    voterId: string;
    confidence: number;
    rationale?: string;
  }): Promise<PredictionConfidenceVote>;
  
  /**
   * Get aggregated confidence for prediction
   */
  getAggregatedConfidence(predictionId: string): Promise<{
    avgConfidence: number;
    voteCount: number;
    distribution: { range: string; count: number }[];
    authorConfidence?: number;
    communityVsAuthor: number;  // Difference
  }>;
  
  // === PICTURING SCORES ===
  
  /**
   * Compute picturing score for an entity
   */
  computePicturingScore(
    entityType: PicturableEntity,
    entityId: string
  ): Promise<PicturingScore>;
  
  /**
   * Get picturing score for entity
   */
  getPicturingScore(
    entityType: PicturableEntity,
    entityId: string
  ): Promise<PicturingScore | null>;
  
  /**
   * Refresh all scores for a deliberation
   */
  refreshDeliberationScores(deliberationId: string): Promise<{
    claimsUpdated: number;
    argumentsUpdated: number;
    usersUpdated: number;
  }>;
  
  /**
   * Get reliability badge for claim
   */
  getReliabilityBadge(claimId: string): Promise<{
    badge: 'empirically_grounded' | 'theoretical' | 'speculative' | 'untested' | 'unreliable';
    tooltip: string;
    details: PicturingScore | null;
  }>;
  
  // === USER CALIBRATION ===
  
  /**
   * Compute user calibration
   */
  computeUserCalibration(userId: string): Promise<UserCalibration>;
  
  /**
   * Get user calibration profile
   */
  getUserCalibration(userId: string): Promise<{
    calibration: UserCalibration;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }>;
  
  // === SCHEME RELIABILITY ===
  
  /**
   * Compute scheme reliability in domain
   */
  computeSchemeReliability(
    schemeId: string,
    domain: string
  ): Promise<SchemeReliability>;
  
  /**
   * Get scheme recommendation for domain
   */
  getSchemeRecommendation(
    schemeId: string,
    domain: string
  ): Promise<{
    reliability: SchemeReliability | null;
    recommendation: SchemeRecommendation;
    reasoning: string;
    alternatives?: { schemeId: string; reliability: number }[];
  }>;
  
  // === DELIBERATION GROUNDEDNESS ===
  
  /**
   * Compute deliberation groundedness
   */
  computeDeliberationGroundedness(
    deliberationId: string
  ): Promise<DeliberationGroundedness>;
  
  /**
   * Get groundedness summary
   */
  getGroundednessSummary(deliberationId: string): Promise<{
    groundedness: DeliberationGroundedness;
    topGroundedClaims: Claim[];
    topSpeculativeClaims: Claim[];
    testingOpportunities: {
      claimId: string;
      suggestedPrediction: string;
    }[];
  }>;
  
  // === FEEDBACK INTEGRATION ===
  
  /**
   * Get adjusted argument strength
   */
  getAdjustedArgumentStrength(argumentId: string): Promise<{
    originalStrength: number;
    picturingAdjustment: number;
    adjustedStrength: number;
    reason: string;
    breakdown: {
      premiseReliability: number;
      schemeReliability: number;
      authorCalibration: number;
    };
  }>;
  
  /**
   * Get claim credibility assessment
   */
  getClaimCredibility(claimId: string): Promise<{
    inferentialCredibility: number;
    picturingCredibility: number;
    combinedCredibility: number;
    badge: string;
    factors: {
      factor: string;
      impact: number;
      direction: 'positive' | 'negative' | 'neutral';
    }[];
  }>;
}
```

### 6.4.2 Picturing Score Computation

```typescript
// lib/picturing/scoreComputation.ts

interface PicturingContext {
  entityType: PicturableEntity;
  entityId: string;
  predictions: ClaimPrediction[];
  outcomes: ClaimOutcome[];
  existingScore?: PicturingScore;
}

/**
 * Compute picturing score for any entity
 */
async function computePicturingScore(
  ctx: PicturingContext
): Promise<PicturingScore> {
  
  // Filter to evaluated predictions
  const evaluated = ctx.predictions.filter(
    p => p.status === 'EVALUATED' && p.outcomes.length > 0
  );
  
  if (evaluated.length === 0) {
    return createEmptyScore(ctx.entityType, ctx.entityId);
  }
  
  // Count outcomes by type
  const breakdown = {
    predictionsTotal: evaluated.length,
    predictionsConfirmed: 0,
    predictionsRefuted: 0,
    predictionsPartial: 0,
    predictionsIndeterminate: 0,
  };
  
  // Weight by stake level and recency
  let weightedScore = 0;
  let totalWeight = 0;
  
  for (const prediction of evaluated) {
    const outcome = prediction.outcomes[0];
    const weight = computePredictionWeight(prediction);
    
    switch (outcome.outcomeType) {
      case 'CONFIRMED':
        breakdown.predictionsConfirmed++;
        weightedScore += 100 * weight;
        break;
      case 'PARTIAL':
        breakdown.predictionsPartial++;
        weightedScore += (outcome.accuracyScore ?? 50) * weight;
        break;
      case 'REFUTED':
        breakdown.predictionsRefuted++;
        weightedScore += 0 * weight;
        break;
      case 'INDETERMINATE':
        breakdown.predictionsIndeterminate++;
        // Don't count toward score
        continue;
    }
    
    totalWeight += weight;
  }
  
  // Calculate final score
  const score = totalWeight > 0 ? weightedScore / totalWeight : 50;
  
  // Calculate confidence based on sample size
  const sampleSize = breakdown.predictionsTotal - breakdown.predictionsIndeterminate;
  const confidence = calculateConfidence(sampleSize);
  const [confidenceLower, confidenceUpper] = calculateConfidenceInterval(
    score, sampleSize
  );
  
  // Determine reliability level
  const reliability = scoreToReliability(score);
  
  // Calculate trend if we have history
  const { trend, trendMagnitude } = calculateTrend(
    ctx.existingScore?.scoreHistory,
    score
  );
  
  return {
    entityType: ctx.entityType,
    entityId: ctx.entityId,
    score,
    reliability,
    ...breakdown,
    confidence,
    confidenceLower,
    confidenceUpper,
    trend,
    trendMagnitude,
    computedAt: new Date(),
    nextUpdateAt: calculateNextUpdate(ctx.entityType),
    scoreHistory: updateScoreHistory(ctx.existingScore?.scoreHistory, score),
  };
}

/**
 * Compute weight for a prediction based on stake and recency
 */
function computePredictionWeight(prediction: ClaimPrediction): number {
  // Stake weight (higher stakes = more weight)
  const stakeWeights: Record<StakeLevel, number> = {
    TRIVIAL: 0.5,
    MINOR: 1.0,
    SIGNIFICANT: 1.5,
    MAJOR: 2.0,
    CRITICAL: 3.0,
  };
  const stakeWeight = stakeWeights[prediction.stakeLevel] ?? 1.0;
  
  // Recency weight (exponential decay with 90-day half-life)
  const daysSincePrediction = differenceInDays(
    new Date(),
    prediction.predictionDate
  );
  const recencyWeight = Math.pow(0.5, daysSincePrediction / 90);
  
  // Verification weight (higher verification = more weight)
  const outcome = prediction.outcomes[0];
  const verificationWeights: Record<VerificationLevel, number> = {
    UNVERIFIED: 0.5,
    SELF_REPORTED: 0.7,
    PEER_VERIFIED: 1.0,
    EVIDENCE_LINKED: 1.2,
    EXPERT_VERIFIED: 1.5,
    CONSENSUS: 1.5,
  };
  const verificationWeight = verificationWeights[outcome?.verificationLevel ?? 'UNVERIFIED'];
  
  return stakeWeight * recencyWeight * verificationWeight;
}

/**
 * Convert score to reliability level
 */
function scoreToReliability(score: number): ReliabilityLevel {
  if (score < 30) return 'UNRELIABLE';
  if (score < 50) return 'QUESTIONABLE';
  if (score < 60) return 'NEUTRAL';
  if (score < 80) return 'RELIABLE';
  return 'HIGHLY_RELIABLE';
}

/**
 * Calculate confidence based on sample size
 */
function calculateConfidence(sampleSize: number): number {
  // Asymptotic approach to 100% with diminishing returns
  // At n=5: ~60%, n=10: ~75%, n=20: ~87%, n=50: ~96%
  return 100 * (1 - Math.exp(-0.1 * sampleSize));
}

/**
 * Calculate 95% confidence interval using Wilson score
 */
function calculateConfidenceInterval(
  score: number,
  sampleSize: number
): [number, number] {
  if (sampleSize === 0) return [0, 100];
  
  const z = 1.96;  // 95% confidence
  const p = score / 100;
  const n = sampleSize;
  
  const denominator = 1 + z * z / n;
  const center = p + z * z / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n);
  
  const lower = Math.max(0, (center - spread) / denominator) * 100;
  const upper = Math.min(100, (center + spread) / denominator) * 100;
  
  return [lower, upper];
}
```

### 6.4.3 User Calibration Computation

```typescript
// lib/picturing/userCalibration.ts

/**
 * Compute user calibration metrics
 */
async function computeUserCalibration(userId: string): Promise<UserCalibration> {
  // Get all evaluated predictions by user
  const predictions = await prisma.claimPrediction.findMany({
    where: {
      createdById: userId,
      status: 'EVALUATED',
      authorConfidence: { not: null },
    },
    include: {
      outcomes: true,
      claim: { include: { tags: true } },
    },
  });
  
  if (predictions.length < 5) {
    return {
      userId,
      overallBias: 0,
      calibrationLevel: 'INSUFFICIENT_DATA',
      computedAt: new Date(),
    };
  }
  
  // Calculate confidence vs accuracy
  let totalStatedConfidence = 0;
  let totalActualAccuracy = 0;
  const domainData: Map<string, { stated: number[]; actual: number[] }> = new Map();
  
  for (const prediction of predictions) {
    const outcome = prediction.outcomes[0];
    if (!outcome) continue;
    
    const stated = prediction.authorConfidence!;
    const actual = outcomeToAccuracy(outcome);
    
    totalStatedConfidence += stated;
    totalActualAccuracy += actual;
    
    // Track by domain
    for (const tag of prediction.claim.tags || []) {
      if (!domainData.has(tag.name)) {
        domainData.set(tag.name, { stated: [], actual: [] });
      }
      domainData.get(tag.name)!.stated.push(stated);
      domainData.get(tag.name)!.actual.push(actual);
    }
  }
  
  const avgStatedConfidence = totalStatedConfidence / predictions.length;
  const avgActualAccuracy = totalActualAccuracy / predictions.length;
  const overallBias = avgStatedConfidence - avgActualAccuracy;
  const overconfidenceRatio = avgStatedConfidence / Math.max(avgActualAccuracy, 1);
  
  // Calculate calibration level
  const calibrationLevel = biasToCalibrationLevel(overallBias);
  
  // Build domain scores
  const domainScores: Record<string, any> = {};
  for (const [domain, data] of domainData) {
    const avgStated = data.stated.reduce((a, b) => a + b, 0) / data.stated.length;
    const avgActual = data.actual.reduce((a, b) => a + b, 0) / data.actual.length;
    domainScores[domain] = {
      score: avgActual,
      bias: avgStated - avgActual,
      predictions: data.stated.length,
    };
  }
  
  // Calculate streaks
  const sortedPredictions = predictions.sort(
    (a, b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime()
  );
  const { currentStreak, streakType, longestStreak } = calculateStreaks(sortedPredictions);
  
  // Recent vs historical accuracy
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentPredictions = predictions.filter(
    p => new Date(p.resolvedAt!) > thirtyDaysAgo
  );
  const recentAccuracy = recentPredictions.length > 0
    ? recentPredictions.map(p => outcomeToAccuracy(p.outcomes[0])).reduce((a, b) => a + b, 0) / recentPredictions.length
    : null;
  
  return {
    userId,
    overallBias,
    calibrationLevel,
    domainScores,
    avgStatedConfidence,
    avgActualAccuracy,
    overconfidenceRatio,
    currentStreak,
    streakType,
    longestStreak,
    recentAccuracy,
    historicalAccuracy: avgActualAccuracy,
    computedAt: new Date(),
  };
}

function outcomeToAccuracy(outcome: ClaimOutcome): number {
  switch (outcome.outcomeType) {
    case 'CONFIRMED': return 100;
    case 'PARTIAL': return outcome.accuracyScore ?? 50;
    case 'REFUTED': return 0;
    default: return 50;
  }
}

function biasToCalibrationLevel(bias: number): CalibrationLevel {
  if (Math.abs(bias) <= 5) return 'WELL_CALIBRATED';
  if (bias > 5 && bias <= 15) return 'SLIGHTLY_OVERCONFIDENT';
  if (bias > 15 && bias <= 30) return 'OVERCONFIDENT';
  if (bias > 30) return 'HIGHLY_OVERCONFIDENT';
  if (bias < -5 && bias >= -15) return 'SLIGHTLY_UNDERCONFIDENT';
  if (bias < -15) return 'UNDERCONFIDENT';
  return 'INSUFFICIENT_DATA';
}
```

### 6.4.4 Feedback Integration Service

```typescript
// services/feedbackIntegration.ts

/**
 * Adjust argument strength based on picturing data
 */
async function getAdjustedArgumentStrength(argumentId: string): Promise<{
  originalStrength: number;
  picturingAdjustment: number;
  adjustedStrength: number;
  reason: string;
  breakdown: {
    premiseReliability: number;
    schemeReliability: number;
    authorCalibration: number;
  };
}> {
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      premises: { include: { claim: true } },
      conclusion: true,
      scheme: true,
      author: true,
    },
  });
  
  if (!argument) throw new Error('Argument not found');
  
  // Original strength from inference ticket (Phase 2)
  const ticket = await prisma.inferenceTicket.findUnique({
    where: { argumentId },
  });
  const originalStrength = ticket?.currentStrength ?? 1.0;
  
  // 1. Premise reliability (avg of premise picturing scores)
  let premiseReliabilitySum = 0;
  let premiseCount = 0;
  for (const premise of argument.premises) {
    const score = await getPicturingScore('CLAIM', premise.claimId);
    if (score) {
      premiseReliabilitySum += score.score;
      premiseCount++;
    }
  }
  const premiseReliability = premiseCount > 0 
    ? premiseReliabilitySum / premiseCount / 100  // Normalize to 0-1
    : 0.5;  // Neutral if no data
  
  // 2. Scheme reliability in domain
  let schemeReliability = 0.5;
  if (argument.schemeId) {
    const domain = argument.tags?.[0] ?? 'general';
    const schemeScore = await prisma.schemeReliability.findUnique({
      where: { schemeId_domain: { schemeId: argument.schemeId, domain } },
    });
    if (schemeScore) {
      schemeReliability = schemeScore.reliability / 100;
    }
  }
  
  // 3. Author calibration
  let authorCalibration = 0.5;
  const userCalibration = await prisma.userCalibration.findUnique({
    where: { userId: argument.authorId },
  });
  if (userCalibration) {
    // Convert bias to multiplier (well-calibrated = 1.0)
    const biasMagnitude = Math.abs(userCalibration.overallBias);
    authorCalibration = Math.max(0.3, 1 - biasMagnitude / 100);
  }
  
  // Compute adjustment factor
  // Weighted average: premises 40%, scheme 35%, author 25%
  const adjustmentFactor = (
    premiseReliability * 0.4 +
    schemeReliability * 0.35 +
    authorCalibration * 0.25
  );
  
  // Calculate adjustment (ranges from -0.3 to +0.3)
  const picturingAdjustment = (adjustmentFactor - 0.5) * 0.6;
  const adjustedStrength = Math.max(0, Math.min(1, originalStrength + picturingAdjustment));
  
  // Generate reason
  let reason = '';
  if (picturingAdjustment > 0.1) {
    reason = 'Empirically grounded premises and reliable reasoning pattern';
  } else if (picturingAdjustment < -0.1) {
    reason = 'Speculative premises or unreliable reasoning pattern in this domain';
  } else {
    reason = 'Mixed empirical support; treat as theoretical';
  }
  
  return {
    originalStrength,
    picturingAdjustment,
    adjustedStrength,
    reason,
    breakdown: {
      premiseReliability: premiseReliability * 100,
      schemeReliability: schemeReliability * 100,
      authorCalibration: authorCalibration * 100,
    },
  };
}

/**
 * Get claim credibility combining inferential and picturing
 */
async function getClaimCredibility(claimId: string): Promise<{
  inferentialCredibility: number;
  picturingCredibility: number;
  combinedCredibility: number;
  badge: string;
  factors: { factor: string; impact: number; direction: string }[];
}> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      supportingArguments: true,
      attackingArguments: true,
    },
  });
  
  if (!claim) throw new Error('Claim not found');
  
  // 1. Inferential credibility (from grounded semantics - Phase 3)
  const label = await prisma.claimLabel.findUnique({
    where: { claimId },
  });
  const inferentialCredibility = labelToCredibility(label?.label);
  
  // 2. Picturing credibility
  const picturingScore = await getPicturingScore('CLAIM', claimId);
  const picturingCredibility = picturingScore?.score ?? 50;
  
  // 3. Combined (weighted average, slight preference for picturing when available)
  const hasPickturingData = picturingScore && picturingScore.predictionsTotal > 0;
  const picturingWeight = hasPickturingData ? 0.6 : 0.3;
  const combinedCredibility = 
    inferentialCredibility * (1 - picturingWeight) +
    picturingCredibility * picturingWeight;
  
  // 4. Determine badge
  const badge = determineBadge(
    inferentialCredibility,
    picturingCredibility,
    hasPickturingData
  );
  
  // 5. Build factors
  const factors: { factor: string; impact: number; direction: string }[] = [];
  
  if (label?.label === 'IN') {
    factors.push({ factor: 'Dialectically defended', impact: 20, direction: 'positive' });
  } else if (label?.label === 'OUT') {
    factors.push({ factor: 'Dialectically defeated', impact: -30, direction: 'negative' });
  }
  
  if (picturingScore?.reliability === 'HIGHLY_RELIABLE') {
    factors.push({ factor: 'Strong prediction track record', impact: 25, direction: 'positive' });
  } else if (picturingScore?.reliability === 'UNRELIABLE') {
    factors.push({ factor: 'Poor prediction track record', impact: -25, direction: 'negative' });
  }
  
  if (claim.supportingArguments.length > 2) {
    factors.push({ factor: 'Multiple supporting arguments', impact: 10, direction: 'positive' });
  }
  
  return {
    inferentialCredibility,
    picturingCredibility,
    combinedCredibility,
    badge,
    factors,
  };
}

function determineBadge(
  inferential: number,
  picturing: number,
  hasPicturingData: boolean
): string {
  if (!hasPicturingData) {
    if (inferential >= 70) return 'theoretical';
    return 'untested';
  }
  
  if (picturing >= 80 && inferential >= 60) return 'empirically_grounded';
  if (picturing >= 60) return 'theoretical';
  if (picturing >= 40) return 'speculative';
  return 'unreliable';
}
```

---

*[Phase 6 continues in next section: UI Integration]*

## 6.5 UI Integration

### 6.5.1 Prediction Creation Component

```typescript
// components/picturing/PredictionCreator.tsx

interface PredictionCreatorProps {
  claim: Claim;
  onCreated: (prediction: ClaimPrediction) => void;
}

export function PredictionCreator({ claim, onCreated }: PredictionCreatorProps) {
  const { data: suggestions } = usePredictionSuggestions(claim.id);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const form = useForm<PredictionInput>({
    defaultValues: {
      predictionType: 'EXPLICIT',
      evaluationMethod: 'BINARY',
      stakeLevel: 'MINOR',
    },
  });
  
  return (
    <div className="prediction-creator">
      <h3>Make a Prediction</h3>
      <p className="text-sm text-muted">
        Ground your claim empirically by predicting an observable outcome
      </p>
      
      {/* Suggestions */}
      {suggestions?.suggestions.length > 0 && (
        <div className="suggestions-panel">
          <h4>Suggested Predictions</h4>
          {suggestions.suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onSelect={() => form.setValue('predictionText', suggestion.text)}
            />
          ))}
        </div>
      )}
      
      {/* Prediction form */}
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          label="What will happen?"
          {...form.register('predictionText', { required: true })}
          placeholder="By [date], [specific observable outcome] will occur..."
        />
        
        <FormField
          label="How will we know?"
          {...form.register('measurableCriteria')}
          placeholder="List specific, measurable criteria..."
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Resolution Date"
            type="date"
            {...form.register('resolutionDeadline')}
          />
          
          <FormField
            label="Your Confidence"
            type="range"
            min={0}
            max={100}
            {...form.register('authorConfidence')}
          />
        </div>
        
        {showAdvanced && (
          <div className="advanced-options">
            <FormSelect
              label="Prediction Type"
              options={PREDICTION_TYPES}
              {...form.register('predictionType')}
            />
            
            <FormSelect
              label="Evaluation Method"
              options={EVALUATION_METHODS}
              {...form.register('evaluationMethod')}
            />
            
            <FormSelect
              label="Stakes"
              options={STAKE_LEVELS}
              {...form.register('stakeLevel')}
            />
          </div>
        )}
        
        <div className="actions">
          <Button type="button" variant="ghost" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>
          <Button type="submit">Create Prediction</Button>
        </div>
      </form>
    </div>
  );
}
```

### 6.5.2 Outcome Recording Component

```typescript
// components/picturing/OutcomeRecorder.tsx

interface OutcomeRecorderProps {
  prediction: ClaimPrediction;
  onRecorded: (outcome: ClaimOutcome) => void;
}

export function OutcomeRecorder({ prediction, onRecorded }: OutcomeRecorderProps) {
  const [outcomeType, setOutcomeType] = useState<OutcomeType | null>(null);
  const [evidence, setEvidence] = useState<EvidenceLinkInput[]>([]);
  
  return (
    <div className="outcome-recorder">
      <h3>Record Outcome</h3>
      
      {/* Prediction reminder */}
      <div className="prediction-summary">
        <h4>The Prediction</h4>
        <p>{prediction.predictionText}</p>
        <div className="meta">
          <span>Made on {formatDate(prediction.predictionDate)}</span>
          <span>Deadline: {formatDate(prediction.resolutionDeadline)}</span>
          {prediction.authorConfidence && (
            <span>Author confidence: {prediction.authorConfidence}%</span>
          )}
        </div>
      </div>
      
      {/* Outcome selection */}
      <div className="outcome-selection">
        <h4>What Happened?</h4>
        <div className="outcome-options">
          <OutcomeOption
            type="CONFIRMED"
            selected={outcomeType === 'CONFIRMED'}
            onSelect={() => setOutcomeType('CONFIRMED')}
            icon={<CheckCircleIcon />}
            label="Confirmed"
            description="The prediction came true"
          />
          <OutcomeOption
            type="REFUTED"
            selected={outcomeType === 'REFUTED'}
            onSelect={() => setOutcomeType('REFUTED')}
            icon={<XCircleIcon />}
            label="Refuted"
            description="The prediction did not come true"
          />
          <OutcomeOption
            type="PARTIAL"
            selected={outcomeType === 'PARTIAL'}
            onSelect={() => setOutcomeType('PARTIAL')}
            icon={<MinusCircleIcon />}
            label="Partial"
            description="Some aspects matched"
          />
          <OutcomeOption
            type="INDETERMINATE"
            selected={outcomeType === 'INDETERMINATE'}
            onSelect={() => setOutcomeType('INDETERMINATE')}
            icon={<QuestionCircleIcon />}
            label="Indeterminate"
            description="Cannot determine outcome"
          />
        </div>
      </div>
      
      {outcomeType && (
        <>
          {/* Accuracy slider for partial */}
          {outcomeType === 'PARTIAL' && (
            <FormField
              label="How accurate was it? (0-100%)"
              type="range"
              min={0}
              max={100}
              {...form.register('accuracyScore')}
            />
          )}
          
          {/* Description */}
          <FormField
            label="What happened?"
            as="textarea"
            {...form.register('outcomeDescription', { required: true })}
            placeholder="Describe what actually occurred..."
          />
          
          {/* Evidence */}
          <div className="evidence-section">
            <h4>Evidence</h4>
            <EvidenceLinker
              evidence={evidence}
              onAdd={(e) => setEvidence([...evidence, e])}
              onRemove={(i) => setEvidence(evidence.filter((_, j) => j !== i))}
            />
          </div>
          
          <Button onClick={handleSubmit}>Record Outcome</Button>
        </>
      )}
    </div>
  );
}
```

### 6.5.3 Reliability Badge Component

```typescript
// components/picturing/ReliabilityBadge.tsx

interface ReliabilityBadgeProps {
  entityType: 'claim' | 'argument' | 'user';
  entityId: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const BADGE_CONFIGS: Record<string, {
  color: string;
  icon: React.ReactNode;
  label: string;
}> = {
  empirically_grounded: {
    color: 'green',
    icon: <ShieldCheckIcon />,
    label: 'Empirically Grounded',
  },
  theoretical: {
    color: 'blue',
    icon: <BookOpenIcon />,
    label: 'Theoretical',
  },
  speculative: {
    color: 'yellow',
    icon: <LightBulbIcon />,
    label: 'Speculative',
  },
  untested: {
    color: 'gray',
    icon: <BeakerIcon />,
    label: 'Untested',
  },
  unreliable: {
    color: 'red',
    icon: <ExclamationIcon />,
    label: 'Unreliable',
  },
};

export function ReliabilityBadge({ 
  entityType, 
  entityId, 
  size = 'md',
  showTooltip = true 
}: ReliabilityBadgeProps) {
  const { data: badgeData } = useReliabilityBadge(entityType, entityId);
  
  if (!badgeData) return null;
  
  const config = BADGE_CONFIGS[badgeData.badge];
  
  const badge = (
    <div className={`reliability-badge ${config.color} size-${size}`}>
      {config.icon}
      {size !== 'sm' && <span>{config.label}</span>}
    </div>
  );
  
  if (showTooltip && badgeData.details) {
    return (
      <Tooltip content={<ReliabilityTooltip data={badgeData} />}>
        {badge}
      </Tooltip>
    );
  }
  
  return badge;
}

function ReliabilityTooltip({ data }: { data: ReliabilityBadgeData }) {
  return (
    <div className="reliability-tooltip">
      <h4>{BADGE_CONFIGS[data.badge].label}</h4>
      <p>{data.tooltip}</p>
      
      {data.details && (
        <div className="stats">
          <div>
            <span>Predictions:</span>
            <span>{data.details.predictionsTotal}</span>
          </div>
          <div>
            <span>Confirmed:</span>
            <span className="text-green">{data.details.predictionsConfirmed}</span>
          </div>
          <div>
            <span>Refuted:</span>
            <span className="text-red">{data.details.predictionsRefuted}</span>
          </div>
          <div>
            <span>Score:</span>
            <span>{data.details.score.toFixed(0)}%</span>
          </div>
          <div>
            <span>Trend:</span>
            <TrendIndicator trend={data.details.trend} />
          </div>
        </div>
      )}
    </div>
  );
}
```

### 6.5.4 User Calibration Dashboard

```typescript
// components/picturing/CalibrationDashboard.tsx

interface CalibrationDashboardProps {
  userId: string;
}

export function CalibrationDashboard({ userId }: CalibrationDashboardProps) {
  const { data: calibration } = useUserCalibration(userId);
  
  if (!calibration) return <LoadingState />;
  
  return (
    <div className="calibration-dashboard">
      <h2>Your Prediction Calibration</h2>
      
      {/* Overall calibration */}
      <div className="calibration-overview">
        <CalibrationGauge 
          level={calibration.calibration.calibrationLevel}
          bias={calibration.calibration.overallBias}
        />
        
        <div className="calibration-stats">
          <StatCard
            label="Stated Confidence (avg)"
            value={`${calibration.calibration.avgStatedConfidence?.toFixed(0)}%`}
          />
          <StatCard
            label="Actual Accuracy (avg)"
            value={`${calibration.calibration.avgActualAccuracy?.toFixed(0)}%`}
          />
          <StatCard
            label="Overconfidence Ratio"
            value={calibration.calibration.overconfidenceRatio?.toFixed(2)}
            highlight={calibration.calibration.overconfidenceRatio > 1.2}
          />
        </div>
      </div>
      
      {/* Streak */}
      {calibration.calibration.currentStreak > 0 && (
        <div className="streak-display">
          <FireIcon className={calibration.calibration.streakType === 'CORRECT' ? 'text-green' : 'text-red'} />
          <span>
            {calibration.calibration.currentStreak} prediction 
            {calibration.calibration.streakType === 'CORRECT' ? ' win' : ' loss'} streak
          </span>
        </div>
      )}
      
      {/* Domain breakdown */}
      <div className="domain-breakdown">
        <h3>By Domain</h3>
        <DomainChart domainScores={calibration.calibration.domainScores} />
      </div>
      
      {/* Strengths and weaknesses */}
      <div className="grid grid-cols-2 gap-4">
        <div className="strengths">
          <h4>Strengths</h4>
          <ul>
            {calibration.strengths.map((s, i) => (
              <li key={i} className="text-green">{s}</li>
            ))}
          </ul>
        </div>
        <div className="weaknesses">
          <h4>Areas for Improvement</h4>
          <ul>
            {calibration.weaknesses.map((w, i) => (
              <li key={i} className="text-yellow">{w}</li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="recommendations">
        <h3>Recommendations</h3>
        {calibration.recommendations.map((rec, i) => (
          <RecommendationCard key={i} recommendation={rec} />
        ))}
      </div>
    </div>
  );
}
```

### 6.5.5 Deliberation Groundedness Panel

```typescript
// components/picturing/GroundednessPanel.tsx

interface GroundednessPanelProps {
  deliberationId: string;
}

export function GroundednessPanel({ deliberationId }: GroundednessPanelProps) {
  const { data: summary } = useGroundednessSummary(deliberationId);
  
  if (!summary) return <LoadingState />;
  
  const { groundedness } = summary;
  
  return (
    <div className="groundedness-panel">
      <h3>Empirical Grounding</h3>
      
      {/* Health indicator */}
      <div className={`health-badge ${groundedness.healthLevel.toLowerCase()}`}>
        <HealthIcon level={groundedness.healthLevel} />
        <span>{formatHealthLevel(groundedness.healthLevel)}</span>
      </div>
      
      {/* Stats */}
      <div className="groundedness-stats">
        <ProgressBar
          label="Grounded Claims"
          value={groundedness.groundedClaims}
          max={groundedness.totalClaims}
          color="blue"
        />
        <ProgressBar
          label="Tested Claims"
          value={groundedness.testedClaims}
          max={groundedness.groundedClaims}
          color="purple"
        />
        <ProgressBar
          label="Confirmed"
          value={groundedness.confirmedClaims}
          max={groundedness.testedClaims}
          color="green"
        />
      </div>
      
      {/* Recommendation */}
      {groundedness.recommendation && (
        <div className="recommendation">
          <LightBulbIcon />
          <p>{groundedness.recommendation}</p>
        </div>
      )}
      
      {/* Testing opportunities */}
      {summary.testingOpportunities.length > 0 && (
        <div className="testing-opportunities">
          <h4>Testing Opportunities</h4>
          <p className="text-sm text-muted">
            These claims could be empirically tested:
          </p>
          {summary.testingOpportunities.slice(0, 3).map((opp) => (
            <TestingOpportunityCard key={opp.claimId} opportunity={opp} />
          ))}
        </div>
      )}
      
      {/* Top grounded claims */}
      <div className="top-claims">
        <h4>Most Grounded Claims</h4>
        {summary.topGroundedClaims.slice(0, 3).map((claim) => (
          <ClaimMiniCard key={claim.id} claim={claim} badge="empirically_grounded" />
        ))}
      </div>
    </div>
  );
}
```

---

## 6.6 Migration Strategy

### Step 1: Extend Existing Models

```bash
# Add new models and extend existing ones
npx prisma db push
```

### Step 2: Migrate Phase 1 Data

```typescript
// scripts/migrate-phase1-picturing.ts

/**
 * Migrate Phase 1 PicturingRecord data to new schema
 */
async function migratePhase1Data() {
  // Get all existing picturing records
  const records = await prisma.picturingRecord.findMany({
    include: { claim: true },
  });
  
  for (const record of records) {
    // Create prediction from record if none exists
    const existingPrediction = await prisma.claimPrediction.findFirst({
      where: { claimId: record.claimId },
    });
    
    if (!existingPrediction && record.predictedValue) {
      const prediction = await prisma.claimPrediction.create({
        data: {
          claimId: record.claimId,
          createdById: record.claim.createdById,
          predictionType: 'DERIVED',
          predictionText: `Derived prediction: ${record.predictedValue}`,
          evaluationMethod: 'SCALED',
          status: record.actualValue ? 'EVALUATED' : 'ACTIVE',
        },
      });
      
      // Create outcome if we have actual value
      if (record.actualValue) {
        const accuracy = calculateAccuracy(record.predictedValue, record.actualValue);
        await prisma.claimOutcome.create({
          data: {
            predictionId: prediction.id,
            recordedById: record.claim.createdById,
            outcomeType: accuracy > 80 ? 'CONFIRMED' : accuracy > 50 ? 'PARTIAL' : 'REFUTED',
            outcomeDescription: `Actual value: ${record.actualValue}`,
            outcomeDate: record.updatedAt,
            accuracyScore: accuracy,
            verificationLevel: 'SELF_REPORTED',
          },
        });
      }
    }
  }
  
  console.log(`Migrated ${records.length} Phase 1 records`);
}
```

### Step 3: Initialize Picturing Scores

```typescript
// scripts/init-picturing-scores.ts

/**
 * Initialize picturing scores for all entities
 */
async function initPicturingScores() {
  const service = getPicturingFeedbackService();
  
  // Claims with predictions
  const claimsWithPredictions = await prisma.claim.findMany({
    where: {
      predictions: { some: {} },
    },
    select: { id: true },
  });
  
  for (const claim of claimsWithPredictions) {
    await service.computePicturingScore('CLAIM', claim.id);
  }
  console.log(`Initialized ${claimsWithPredictions.length} claim scores`);
  
  // Users with predictions
  const usersWithPredictions = await prisma.user.findMany({
    where: {
      predictions: { some: {} },
    },
    select: { id: true },
  });
  
  for (const user of usersWithPredictions) {
    await service.computePicturingScore('USER', user.id);
    await service.computeUserCalibration(user.id);
  }
  console.log(`Initialized ${usersWithPredictions.length} user scores`);
  
  // Deliberation groundedness
  const deliberationsWithClaims = await prisma.deliberation.findMany({
    where: {
      claims: { some: {} },
    },
    select: { id: true },
  });
  
  for (const delib of deliberationsWithClaims) {
    await service.computeDeliberationGroundedness(delib.id);
  }
  console.log(`Initialized ${deliberationsWithClaims.length} deliberation groundedness`);
}
```

### Step 4: Set Up Scheduled Jobs

```typescript
// workers/picturingJobs.ts

/**
 * Check for predictions ready for resolution
 */
export async function checkPendingResolutions() {
  const now = new Date();
  
  const pending = await prisma.claimPrediction.findMany({
    where: {
      status: 'ACTIVE',
      resolutionDeadline: { lte: now },
    },
    include: { createdBy: true },
  });
  
  for (const prediction of pending) {
    // Update status
    await prisma.claimPrediction.update({
      where: { id: prediction.id },
      data: { status: 'OUTCOME_PENDING' },
    });
    
    // Notify author
    await prisma.notification.create({
      data: {
        user_id: prediction.createdById,
        type: 'PREDICTION_READY',
        content: {
          predictionId: prediction.id,
          predictionText: prediction.predictionText,
          deliberationId: prediction.claim.deliberationId,
        },
      },
    });
  }
  
  return { processed: pending.length };
}

/**
 * Refresh picturing scores periodically
 */
export async function refreshPicturingScores() {
  const staleThreshold = subDays(new Date(), 1);
  
  const staleScores = await prisma.picturingScore.findMany({
    where: {
      OR: [
        { computedAt: { lt: staleThreshold } },
        { nextUpdateAt: { lte: new Date() } },
      ],
    },
    select: { entityType: true, entityId: true },
    take: 100,
  });
  
  const service = getPicturingFeedbackService();
  
  for (const score of staleScores) {
    await service.computePicturingScore(score.entityType, score.entityId);
  }
  
  return { refreshed: staleScores.length };
}
```

### Step 5: Wire Up Event Hooks

```typescript
// In outcome recording handler:
async function onOutcomeRecorded(outcome: ClaimOutcome) {
  const service = getPicturingFeedbackService();
  
  // Refresh claim score
  await service.computePicturingScore('CLAIM', outcome.prediction.claimId);
  
  // Refresh user score and calibration
  await service.computePicturingScore('USER', outcome.prediction.createdById);
  await service.computeUserCalibration(outcome.prediction.createdById);
  
  // Refresh deliberation groundedness
  await service.computeDeliberationGroundedness(
    outcome.prediction.claim.deliberationId
  );
  
  // Update argument strengths that use this claim
  const affectedArgs = await prisma.argument.findMany({
    where: {
      OR: [
        { conclusionClaimId: outcome.prediction.claimId },
        { premises: { some: { claimId: outcome.prediction.claimId } } },
      ],
    },
  });
  
  for (const arg of affectedArgs) {
    await integratedSemanticsService.recomputeArgumentStrength(arg.id);
  }
  
  // Bildung integration: award points
  await bildungService.recordEvent({
    userId: outcome.recordedById,
    eventType: 'OUTCOME_RECORDED',
    competency: 'empiricalGrounding',
    points: 5,
  });
  
  // Check for milestones
  if (outcome.outcomeType === 'CONFIRMED') {
    const userPredictions = await prisma.claimPrediction.count({
      where: {
        createdById: outcome.prediction.createdById,
        status: 'EVALUATED',
        outcomes: { some: { outcomeType: 'CONFIRMED' } },
      },
    });
    
    if (userPredictions === 1) {
      await bildungService.awardMilestone(
        outcome.prediction.createdById,
        'FIRST_CONFIRMED_PREDICTION'
      );
    } else if (userPredictions === 10) {
      await bildungService.awardMilestone(
        outcome.prediction.createdById,
        'PREDICTION_TRACK_RECORD'
      );
    }
  }
}
```

---

## 6.7 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Schema migration | 100% | All new models created |
| Phase 1 data migrated | 100% | All PicturingRecords converted |
| Predictions created | +20% | New predictions per deliberation |
| Outcomes recorded | > 60% | Predictions with outcomes |
| Verification rate | > 40% | Outcomes with peer verification |
| Score accuracy | > 80% | Scores correlate with future outcomes |
| User calibration improvement | +10% | Users become better calibrated |
| Badge display | 100% | All claims show reliability badge |
| Deliberation health tracking | 100% | All deliberations have groundedness |

---

## Phase 6 Status

- [x] 6.1 Overview — Complete
- [x] 6.2 Requirements — Complete
- [x] 6.3 Schema Design — Complete
- [x] 6.4 API Layer — Complete
- [x] 6.5 UI Integration — Complete
- [x] 6.6 Migration Strategy — Complete
- [ ] 6.7 Implementation — Not started
- [ ] 6.8 Testing — Not started

---

## Connection to Sellarsian Framework

| Sellarsian Concept | Phase 6 Implementation |
|-------------------|----------------------|
| **Picturing Relation** | ClaimPrediction, ClaimOutcome — structural match to world |
| **Non-Semantic Correctness** | PicturingScore — causal/predictive success, not truth-conditions |
| **Dual Characterization** | Claim has both inferential role (Phase 1-3) and picturing accuracy (Phase 6) |
| **Science as Successor Language** | Reliability badges signal which claims "picture" reliably |
| **Material Inference Grounding** | Scheme reliability — which inference patterns work in which domains |
| **Normative Pragmatics** | User calibration — conforming to norm of accurate prediction |
| **Bildung Integration** | Picturing competency develops with practice (Phase 4 connection) |
| **Space of Reasons/Causes Bridge** | Picturing connects space of reasons claims to causal world outcomes |

---

## Cross-Phase Integration Summary

Phases 4-6 complete the Sellarsian implementation by adding:

| Phase | Core Contribution | Sellarsian Grounding |
|-------|------------------|---------------------|
| **Phase 4: Bildung** | Developmental scaffolding | RDR → ARSA → ARSD progression |
| **Phase 5: Dialectics** | Move recommendations, obligations | Game of giving and asking for reasons |
| **Phase 6: Picturing** | Empirical feedback loop | Non-semantic world-language relation |

Together they ensure:
1. **Users develop** from pattern-following to norm-articulation (Phase 4)
2. **Dialectical moves** are guided and obligated (Phase 5)
3. **Claims connect** to empirical outcomes (Phase 6)

The platform now embodies Sellars's vision: a community where language games are grounded both in **inferential practice** (signifying) and **empirical contact** (picturing).

---

*Last updated: 2025-12-31*
