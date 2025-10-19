// app/onboarding/_data/steps-content.ts
import { DiscussionViewDemo } from '../_demos/discussion-view-demo'

import { 
  MessageSquare,
  Lightbulb,
  Vote,
  FileCheck,
  Map,
  GitBranch,
  List,
  Swords,
  Layout,
  BookOpen,
  Share2,
  type LucideIcon
} from 'lucide-react'


/* ======================== TYPE DEFINITIONS ======================== */

export interface Annotation {
  id: string
  x: number          // Percentage (0-100)
  y: number          // Percentage (0-100)
  label: string      // "1", "2", "3"
  title: string      // Short heading
  description: string // Detailed explanation
}

export interface Screenshot {
  src: string
  alt: string
  annotations: Annotation[]
}

export interface SchemaField {
  name: string
  type: string
  description: string
  optional?: boolean
  defaultValue?: string
}

export interface SchemaRelation {
  name: string
  target: string
  cardinality: '1:1' | '1:N' | 'N:M'
  description: string
}

export interface SchemaReference {
  model: string
  fields: SchemaField[]
  relations?: SchemaRelation[]
}

export interface StepContent {
  what: string       // Technical description
  why: string        // Design rationale
  userAction: string // Concrete user behavior
}

export interface OnboardingStep {
  id: string
  number: number
  title: string
  shortTitle: string  // For mobile nav
  icon: LucideIcon
  summary: string     // 1-2 sentence overview
  content: StepContent
  screenshot: Screenshot
  demo?: string       // Path to demo component (optional)
  schema: SchemaReference
  transition?: string // Bridge text to next step
}

/* ======================== STEP 1: JOIN DISCUSSION ======================== */

const STEP_1: OnboardingStep = {
  id: 'join-discussion',
  number: 1,
  title: 'Join Discussion → Deliberation',
  shortTitle: 'Join',
  icon: MessageSquare,
  summary: 'Transform a casual conversation into a structured deliberation space with enhanced reasoning tools.',
  
  content: {
    what: `When a conversation thread in a Room demonstrates sustained engagement (typically 10+ messages with multiple participants), any member can upgrade it to a Deliberation. This transformation migrates all existing messages into a new workspace equipped with structured argumentation tools while preserving the original conversational context. The system automatically creates a Deliberation entity, links it to the parent Room, and initializes the deliberative protocol layer.`,
    
    why: `Not all conversations require formal structure. Most casual exchanges—greetings, status updates, clarifications—function perfectly well as unstructured messages. Imposing deliberative protocols prematurely creates friction without benefit. The upgrade threshold ensures structure activates only when complexity warrants it. This design follows the principle of progressive disclosure: simple tools for simple tasks, powerful tools available on-demand when complexity increases. The migration of existing messages preserves continuity, avoiding the disruptive "start over" pattern common in other platforms.`,
    
    userAction: `Navigate to any active conversation thread in a Room. When the thread shows sustained engagement (system suggests upgrade after 8+ messages with 3+ participants), click the "Upgrade to Deliberation" button in the thread header. The system displays a confirmation modal showing: thread title (auto-generated from first message or manually specified), participant count, message count, and estimated migration time. Confirm upgrade. The system creates the Deliberation, migrates messages, and redirects all participants to the new deliberative workspace. Original Room thread becomes read-only with a forwarding link.`
  },

  screenshot: {
    src: '/screenshots/onboarding/step-01-join-discussion.png',
    alt: 'Room interface showing an active conversation thread with the "Upgrade to Deliberation" button highlighted',
    annotations: [
      {
        id: 'thread-messages',
        x: 25,
        y: 35,
        label: '1',
        title: 'Active Thread',
        description: 'Conversation thread with 12 messages from 4 participants discussing ranked-choice voting implementation. Thread shows natural engagement pattern suggesting deliberative potential.'
      },
      {
        id: 'participant-count',
        x: 25,
        y: 20,
        label: '2',
        title: 'Engagement Indicators',
        description: 'Header displays participant count (4), message count (12), and thread duration (2h 34m). These metrics help users assess whether upgrade is warranted.'
      },
      {
        id: 'upgrade-button',
        x: 75,
        y: 20,
        label: '3',
        title: 'Upgrade to Deliberation',
        description: 'Primary action button becomes available when thread meets engagement threshold. Button includes icon (↑) and tooltip explaining the transformation process.'
      },
      {
        id: 'thread-context',
        x: 50,
        y: 60,
        label: '4',
        title: 'Message Context',
        description: 'Individual messages show author, timestamp, and basic reactions. This informal structure works well for exploration but lacks support for formal argumentation—the reason for upgrading.'
      }
    ]
  },

  demo: 'discussion-upgrade', // Interactive demo showing thread → deliberation upgrade
  

  schema: {
    model: 'Deliberation',
    fields: [
      { 
        name: 'id', 
        type: 'String', 
        description: 'Unique identifier (UUID format)' 
      },
      { 
        name: 'title', 
        type: 'String', 
        description: 'Discussion topic (max 200 chars)' 
      },
      { 
        name: 'status', 
        type: 'ACTIVE | PAUSED | ARCHIVED | CONCLUDED', 
        description: 'Current lifecycle state' 
      },
      { 
        name: 'createdAt', 
        type: 'DateTime', 
        description: 'Timestamp of deliberation creation' 
      },
      { 
        name: 'createdById', 
        type: 'String', 
        description: 'User who initiated the upgrade' 
      },
      { 
        name: 'roomId', 
        type: 'String', 
        description: 'Foreign key to parent Room' 
      },
      {
        name: 'sourceThreadId',
        type: 'String',
        description: 'Reference to original Room thread',
        optional: true
      },
      {
        name: 'participantCount',
        type: 'Int',
        description: 'Cached count of active participants',
        defaultValue: '0'
      }
    ],
    relations: [
      { 
        name: 'room', 
        target: 'Room', 
        cardinality: '1:1', 
        description: 'Parent room where thread originated' 
      },
      { 
        name: 'propositions', 
        target: 'Proposition', 
        cardinality: '1:N', 
        description: 'Structured contributions from participants' 
      },
      { 
        name: 'participants', 
        target: 'User', 
        cardinality: 'N:M', 
        description: 'Users engaged in deliberation (via join table)' 
      },
      {
        name: 'claims',
        target: 'Claim',
        cardinality: '1:N',
        description: 'Promoted propositions that become arguable claims'
      }
    ]
  },

  transition: `Once elevated to a Deliberation, participants shift from informal messaging to structured Propositions—contributions designed to be evaluated, endorsed, and potentially promoted to arguable Claims...`
}

/* ======================== STEP 2: COMPOSE PROPOSITION ======================== */

const STEP_2: OnboardingStep = {
  id: 'compose-proposition',
  number: 2,
  title: 'Compose Proposition',
  shortTitle: 'Compose',
  icon: Lightbulb,
  summary: 'Submit a structured contribution to the deliberation with explicit context and supporting rationale.',

  content: {
    what: `Within a Deliberation, participants create Propositions instead of freeform messages. Each Proposition contains: (1) a claim statement (the actual proposal), (2) optional supporting rationale (explanatory text), (3) optional source citations (links to evidence), and (4) metadata (author, timestamp, status). The Proposition Composer is a dedicated form with three input fields plus submission controls. Upon submission, the system validates the proposition text (minimum 10 characters, maximum 1000 characters), assigns a unique identifier, sets status to DRAFT, and adds it to the Deliberation's proposition list.`,

    why: `Propositions differ from chat messages in three critical ways: (1) they are individually addressable—each has a stable URI enabling precise reference in later arguments, (2) they support structured workflows—voting, endorsement, promotion to Claim—that would be nonsensical for chat messages, and (3) they carry semantic weight—the system treats them as candidate positions that require collective evaluation. The dedicated composer interface signals this shift from "having a conversation" to "making a proposal." Required fields (claim text) and optional fields (rationale, sources) give users flexibility while maintaining minimum quality standards. The character limits prevent both trivial inputs and overwhelming walls of text.`,

    userAction: `Inside a Deliberation, locate the Proposition Composer (typically pinned at bottom of screen or accessible via floating action button). Click into the "Claim" text area and type your core proposition (e.g., "This committee should adopt ranked-choice voting for all internal decisions"). Optionally, click "Add Rationale" to expand a second text area and provide supporting explanation (e.g., "Ranked-choice voting eliminates strategic voting and ensures majority support"). Optionally, click "Add Source" to attach URLs to external evidence. When ready, click "Submit Proposition." The system validates input, creates the Proposition entity with status=DRAFT, and displays it in the deliberation feed. Other participants can now see, vote on, and respond to your proposition.`
  },

  screenshot: {
    src: '/screenshots/onboarding/step-02-proposition-composer.png',
    alt: 'Proposition Composer interface showing text fields for claim, rationale, and sources with submission button',
    annotations: [
      {
        id: 'claim-field',
        x: 50,
        y: 30,
        label: '1',
        title: 'Claim Text Field',
        description: 'Primary input for the proposition statement. Required field. Character counter shows 45/1000. Placeholder text guides users toward clear, declarative claims.'
      },
      {
        id: 'rationale-field',
        x: 50,
        y: 50,
        label: '2',
        title: 'Rationale (Optional)',
        description: 'Collapsible section for explanatory context. Users can expand via "Add Rationale" button. Supports markdown formatting for structured explanations.'
      },
      {
        id: 'sources-field',
        x: 50,
        y: 65,
        label: '3',
        title: 'Sources (Optional)',
        description: 'Multiple URL inputs for citing evidence. Each source includes URL field + optional description field. System validates URLs and fetches metadata (title, favicon) on blur.'
      },
      {
        id: 'submit-button',
        x: 80,
        y: 80,
        label: '4',
        title: 'Submit Proposition',
        description: 'Creates Proposition entity with status=DRAFT. Button disabled until minimum requirements met (claim text ≥ 10 chars). Keyboard shortcut: Cmd/Ctrl+Enter.'
      },
      {
        id: 'validation-feedback',
        x: 20,
        y: 80,
        label: '5',
        title: 'Validation Feedback',
        description: 'Real-time indicators show input validity: character count, URL validation status, and any error messages. Green checkmarks indicate valid fields.'
      }
    ]
  },

  schema: {
    model: 'Proposition',
    fields: [
      { 
        name: 'id', 
        type: 'String', 
        description: 'Unique identifier (UUID format)' 
      },
      { 
        name: 'claimText', 
        type: 'String', 
        description: 'Core proposition statement (10-1000 chars)' 
      },
      { 
        name: 'rationale', 
        type: 'Text', 
        description: 'Optional supporting explanation',
        optional: true
      },
      { 
        name: 'status', 
        type: 'DRAFT | PUBLISHED | CLAIMED | ARCHIVED', 
        description: 'Current lifecycle state',
        defaultValue: 'DRAFT'
      },
      { 
        name: 'createdAt', 
        type: 'DateTime', 
        description: 'Timestamp of creation' 
      },
      { 
        name: 'authorId', 
        type: 'String', 
        description: 'Foreign key to User who created proposition' 
      },
      { 
        name: 'deliberationId', 
        type: 'String', 
        description: 'Foreign key to parent Deliberation' 
      },
      {
        name: 'voteCount',
        type: 'Int',
        description: 'Cached sum of upvotes (denormalized for performance)',
        defaultValue: '0'
      },
      {
        name: 'endorsementCount',
        type: 'Int',
        description: 'Cached count of explicit endorsements',
        defaultValue: '0'
      },
      {
        name: 'promotedClaimId',
        type: 'String',
        description: 'Reference to Claim if proposition was promoted',
        optional: true
      }
    ],
    relations: [
      { 
        name: 'author', 
        target: 'User', 
        cardinality: '1:1', 
        description: 'User who authored the proposition' 
      },
      { 
        name: 'deliberation', 
        target: 'Deliberation', 
        cardinality: '1:1', 
        description: 'Parent deliberation context' 
      },
      { 
        name: 'votes', 
        target: 'Vote', 
        cardinality: '1:N', 
        description: 'Individual vote records from participants' 
      },
      {
        name: 'endorsements',
        target: 'Endorsement',
        cardinality: '1:N',
        description: 'Explicit endorsement records (stronger than votes)'
      },
      {
        name: 'replies',
        target: 'Reply',
        cardinality: '1:N',
        description: 'Direct responses to this proposition'
      },
      {
        name: 'sources',
        target: 'Source',
        cardinality: '1:N',
        description: 'Citations and evidence links'
      },
      {
        name: 'promotedClaim',
        target: 'Claim',
        cardinality: '1:1',
        description: 'Claim entity if proposition was promoted',
        optional: true
      }
    ]
  },

  transition: `After submitting a Proposition, it enters a workshop phase where other participants can vote, endorse, or reply to refine and validate the idea before it becomes a formal Claim...`
}

/* ======================== STEP 3: WORKSHOP (STUB) ======================== */

const STEP_3: OnboardingStep = {
  id: 'workshop',
  number: 3,
  title: 'Workshop (Vote, Endorse, Reply)',
  shortTitle: 'Workshop',
  icon: Vote,
  summary: 'Collectively evaluate propositions through voting, endorsements, and constructive replies.',

  content: {
    what: `[To be detailed] Participants interact with Propositions through three mechanisms: Votes (simple approval signals), Endorsements (formal support with optional reasoning), and Replies (constructive feedback or requests for clarification).`,
    why: `[To be detailed] These graduated levels of engagement allow both lightweight participation (voting) and deep engagement (replies), while endorsements bridge the gap.`,
    userAction: `[To be detailed] Click vote buttons, add endorsements with reasoning, or compose replies to propositions.`
  },

  screenshot: {
    src: '/screenshots/onboarding/step-03-workshop.png',
    alt: 'Proposition card showing vote buttons, endorsement count, and reply thread',
    annotations: [] // To be filled
  },

  schema: {
    model: 'Vote',
    fields: [
      { name: 'id', type: 'String', description: 'Unique identifier' },
      { name: 'value', type: 'Int', description: 'Vote value (+1 for upvote)' },
      { name: 'createdAt', type: 'DateTime', description: 'Timestamp' }
    ]
  },

  transition: `Once a Proposition accumulates sufficient support (vote threshold + endorsements), it becomes eligible for promotion to a Claim...`
}

/* ======================== STEP 4: PROMOTE TO CLAIM (STUB) ======================== */

const STEP_4: OnboardingStep = {
  id: 'promote-claim',
  number: 4,
  title: 'Promote to Claim',
  shortTitle: 'Promote',
  icon: FileCheck,
  summary: 'Elevate validated propositions to Claims that can be formally argued about.',

  content: {
    what: `[To be detailed] When a Proposition meets promotion criteria (threshold of votes + endorsements), any participant can promote it to a Claim, making it an arguable position in the formal argument graph.`,
    why: `[To be detailed] The promotion barrier ensures only validated ideas enter formal argumentation, reducing noise.`,
    userAction: `[To be detailed] Click "Promote to Claim" button on eligible Propositions.`
  },

  screenshot: {
    src: '/screenshots/onboarding/step-04-promote-claim.png',
    alt: 'Proposition with promotion button and criteria checklist',
    annotations: []
  },

  schema: {
    model: 'Claim',
    fields: [
      { name: 'id', type: 'String', description: 'Unique identifier' },
      { name: 'text', type: 'String', description: 'Claim statement' },
      { name: 'status', type: 'ACTIVE | ACCEPTED | REJECTED', description: 'Argument status' }
    ]
  },

  transition: `Claims become visible in the deliberation's argument map, where their relationships and support can be visualized...`
}

/* ======================== REMAINING STEPS (STUBS) ======================== */

const STEP_5: OnboardingStep = {
  id: 'view-claims',
  number: 5,
  title: 'View Claims (Minimap / CEG Minimap)',
  shortTitle: 'Minimap',
  icon: Map,
  summary: 'Navigate the argument landscape through visual claim maps.',
  content: {
    what: '[To be detailed]',
    why: '[To be detailed]',
    userAction: '[To be detailed]'
  },
  screenshot: { src: '', alt: '', annotations: [] },
  schema: { model: 'ClaimMap', fields: [] }
}

const STEP_6: OnboardingStep = {
  id: 'compose-argument',
  number: 6,
  title: 'Compose Argument (Scheme Composer)',
  shortTitle: 'Argument',
  icon: GitBranch,
  summary: 'Build formal arguments using argumentation schemes.',
  content: {
    what: '[To be detailed]',
    why: '[To be detailed]',
    userAction: '[To be detailed]'
  },
  screenshot: { src: '', alt: '', annotations: [] },
  schema: { model: 'Argument', fields: [] }
}

const STEP_7: OnboardingStep = {
  id: 'view-arguments',
  number: 7,
  title: 'View Arguments (AIF Arguments List)',
  shortTitle: 'Arguments',
  icon: List,
  summary: 'Browse the structured argument graph.',
  content: {
    what: '[To be detailed]',
    why: '[To be detailed]',
    userAction: '[To be detailed]'
  },
  screenshot: { src: '', alt: '', annotations: [] },
  schema: { model: 'ArgumentNode', fields: [] }
}

const STEP_8: OnboardingStep = {
  id: 'dialogue-move',
  number: 8,
  title: 'Dialogue Move (Attack Menu: Rebut / Undercut)',
  shortTitle: 'Attack',
  icon: Swords,
  summary: 'Challenge arguments through formal dialogue moves.',
  content: {
    what: '[To be detailed]',
    why: '[To be detailed]',
    userAction: '[To be detailed]'
  },
  screenshot: { src: '', alt: '', annotations: [] },
  schema: { model: 'DialogueMove', fields: [] }
}

const STEP_9: OnboardingStep = {
  id: 'debate-sheet',
  number: 9,
  title: 'Navigate Debate Sheet',
  shortTitle: 'Debate',
  icon: Layout,
  summary: 'Track obligations and commitments in structured dialogue.',
  content: {
    what: '[To be detailed]',
    why: '[To be detailed]',
    userAction: '[To be detailed]'
  },
  screenshot: { src: '', alt: '', annotations: [] },
  schema: { model: 'DebateSheet', fields: [] }
}

const STEP_10: OnboardingStep = {
  id: 'publish-kb',
  number: 10,
  title: 'Publish to Knowledge Base',
  shortTitle: 'Publish',
  icon: BookOpen,
  summary: 'Transform concluded deliberations into persistent knowledge artifacts.',
  content: {
    what: '[To be detailed]',
    why: '[To be detailed]',
    userAction: '[To be detailed]'
  },
  screenshot: { src: '', alt: '', annotations: [] },
  schema: { model: 'KBPage', fields: [] }
}

const STEP_11: OnboardingStep = {
  id: 'explore-network',
  number: 11,
  title: 'Explore Network (Plexus / Cross-Room Graph)',
  shortTitle: 'Network',
  icon: Share2,
  summary: 'Discover connections across deliberations and knowledge domains.',
  content: {
    what: '[To be detailed]',
    why: '[To be detailed]',
    userAction: '[To be detailed]'
  },
  screenshot: { src: '', alt: '', annotations: [] },
  schema: { model: 'KnowledgeGraph', fields: [] }
}

/* ======================== EXPORT ALL STEPS ======================== */

export const ONBOARDING_STEPS: OnboardingStep[] = [
  STEP_1,
  STEP_2,
  STEP_3,
  STEP_4,
  STEP_5,
  STEP_6,
  STEP_7,
  STEP_8,
  STEP_9,
  STEP_10,
  STEP_11
]

/* ======================== UTILITY EXPORTS ======================== */

export const getStepById = (id: string): OnboardingStep | undefined => {
  return ONBOARDING_STEPS.find(step => step.id === id)
}

export const getStepByNumber = (number: number): OnboardingStep | undefined => {
  return ONBOARDING_STEPS.find(step => step.number === number)
}

export const getTotalSteps = (): number => {
  return ONBOARDING_STEPS.length
}

export const getStepProgress = (currentStepNumber: number): number => {
  return Math.round((currentStepNumber / getTotalSteps()) * 100)
}