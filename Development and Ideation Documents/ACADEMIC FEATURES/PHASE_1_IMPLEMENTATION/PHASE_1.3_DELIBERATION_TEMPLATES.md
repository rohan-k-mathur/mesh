# Phase 1.3: Academic Deliberation Templates

**Sub-Phase:** 1.3 of 1.4  
**Timeline:** Weeks 5-6  
**Status:** Planning  
**Depends On:** Phase 1.1-1.2 (Claims infrastructure)  
**Enables:** Structured academic workflows

---

## Objective

Provide scholars with ready-to-use deliberation formats that match existing academic practices: journal clubs, paper responses, seminars, and conference sessions.

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| US-1.3.1 | As a professor, I want to create a journal club deliberation from a template | P0 | M |
| US-1.3.2 | As a researcher, I want to structure a formal response to a paper | P0 | M |
| US-1.3.3 | As an instructor, I want a seminar template with private student space | P1 | L |
| US-1.3.4 | As a facilitator, I want to guide discussion through defined phases | P1 | M |
| US-1.3.5 | As a participant, I want to know what kind of contribution is expected | P1 | S |
| US-1.3.6 | As a journal club member, I want to export our discussion as a summary | P2 | M |

---

## Template Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TEMPLATE ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Template Definition                                                       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  id: "journal-club"                                                  │  │
│   │  name: "Journal Club"                                                │  │
│   │  phases: [...]                                                       │  │
│   │  roles: [...]                                                        │  │
│   │  outputType: "debate_sheet"                                          │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                    │                                                        │
│                    ▼                                                        │
│   Template Instantiation                                                    │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Deliberation                                                        │  │
│   │  ├── templateId: "journal-club"                                      │  │
│   │  ├── currentPhase: 0                                                 │  │
│   │  ├── phaseState: {...}                                               │  │
│   │  └── roleAssignments: [{userId, role}]                               │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                    │                                                        │
│                    ▼                                                        │
│   Phase Execution                                                           │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│   │ Phase 1     │→│ Phase 2     │→│ Phase 3     │→│ Synthesis   │         │
│   │ Extract     │ │ Methodology │ │ Theory      │ │ & Export    │         │
│   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1.3.1: Template Type Definitions

**File:** `lib/deliberations/templateTypes.ts`

```typescript
/**
 * Type definitions for deliberation templates
 */

import { DialogueMoveType } from "@prisma/client";

export interface DeliberationTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;  // Lucide icon name
  category: TemplateCategory;
  phases: Phase[];
  roles: Role[];
  requiredSources: number;  // Minimum sources to attach
  outputType: OutputType;
  defaultVisibility: "public" | "private" | "organization";
  estimatedDuration?: number;  // Total minutes
  tags: string[];
}

export type TemplateCategory =
  | "academic"
  | "research"
  | "education"
  | "policy"
  | "general";

export interface Phase {
  id: string;
  name: string;
  description: string;
  durationMinutes?: number;
  allowedMoveTypes: DialogueMoveType[];
  requiredMoveTypes?: DialogueMoveType[];
  minContributions?: number;  // Per participant
  completionCriteria: CompletionCriteria;
  guidance?: string;  // Instructions shown to participants
  prompts?: string[];  // Suggested discussion prompts
}

export interface CompletionCriteria {
  type: "manual" | "time" | "contributions" | "consensus";
  threshold?: number;
  requiredRoles?: string[];  // Roles that must approve
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: RolePermission[];
  minCount?: number;  // Minimum participants with this role
  maxCount?: number;  // Maximum participants with this role
}

export type RolePermission =
  | "advance_phase"
  | "moderate"
  | "present_claims"
  | "contribute"
  | "invite_members"
  | "assign_roles"
  | "export_output"
  | "edit_claims"
  | "close_deliberation";

export type OutputType =
  | "debate_sheet"
  | "thesis"
  | "kb_page"
  | "report"
  | "none";

// Phase state tracking
export interface PhaseState {
  phaseId: string;
  startedAt: Date;
  completedAt?: Date;
  contributions: number;
  participantProgress: Record<string, ParticipantPhaseProgress>;
}

export interface ParticipantPhaseProgress {
  userId: string;
  contributions: number;
  requiredMet: boolean;
  lastContributionAt?: Date;
}
```

---

### Step 1.3.2: Template Definitions

**File:** `lib/deliberations/templates.ts`

```typescript
/**
 * Built-in deliberation templates
 */

import { DeliberationTemplate } from "./templateTypes";

export const JOURNAL_CLUB_TEMPLATE: DeliberationTemplate = {
  id: "journal-club",
  name: "Journal Club",
  description:
    "Structured discussion of a research paper with claim extraction, methodology review, and synthesis phases.",
  icon: "BookOpen",
  category: "academic",
  phases: [
    {
      id: "claim-extraction",
      name: "Claim Extraction",
      description:
        "Identify and register the main claims from the paper. Focus on the central thesis and key supporting claims.",
      durationMinutes: 20,
      allowedMoveTypes: ["ASSERT", "PROPOSE", "QUESTION"],
      requiredMoveTypes: ["ASSERT"],
      minContributions: 1,
      completionCriteria: {
        type: "manual",
        requiredRoles: ["facilitator"],
      },
      guidance:
        "Start by identifying the paper's main thesis. Then extract 3-5 key claims that support or develop the central argument.",
      prompts: [
        "What is the central thesis of this paper?",
        "What empirical claims does the author make?",
        "What methodological claims are present?",
      ],
    },
    {
      id: "methodology-challenge",
      name: "Methodology Challenge",
      description:
        "Critically examine the methods and evidence. Raise concerns and defend against challenges.",
      durationMinutes: 15,
      allowedMoveTypes: ["WHY", "QUESTION", "CHALLENGE", "DEFEND", "CONCEDE"],
      requiredMoveTypes: ["WHY"],
      minContributions: 1,
      completionCriteria: {
        type: "manual",
        requiredRoles: ["facilitator"],
      },
      guidance:
        "Focus on the paper's methodology, data quality, and inferential reasoning. Challenge weak points constructively.",
      prompts: [
        "Is the methodology appropriate for the research question?",
        "Are there alternative explanations for the findings?",
        "What are the limitations the authors acknowledge or miss?",
      ],
    },
    {
      id: "theoretical-framing",
      name: "Theoretical Framing",
      description:
        "Connect the paper to broader theoretical frameworks. Extend or contextualize the claims.",
      durationMinutes: 15,
      allowedMoveTypes: ["SUPPORT", "EXTEND", "COMPARE", "REFRAME"],
      completionCriteria: {
        type: "manual",
        requiredRoles: ["facilitator"],
      },
      guidance:
        "Situate the paper within broader theoretical debates. Make connections to other works and frameworks.",
      prompts: [
        "How does this relate to [relevant theory]?",
        "What does this paper add to the existing literature?",
        "Are there tensions with established findings?",
      ],
    },
    {
      id: "synthesis",
      name: "Synthesis",
      description:
        "Summarize key takeaways, unresolved questions, and next steps.",
      durationMinutes: 10,
      allowedMoveTypes: ["RESOLVE", "SUMMARIZE", "PROPOSE"],
      completionCriteria: {
        type: "manual",
        requiredRoles: ["facilitator"],
      },
      guidance:
        "Consolidate the discussion into actionable takeaways. Identify what was resolved and what remains contested.",
      prompts: [
        "What are our main takeaways from this paper?",
        "What questions remain unresolved?",
        "What should we read or discuss next?",
      ],
    },
  ],
  roles: [
    {
      id: "facilitator",
      name: "Facilitator",
      description:
        "Guides the discussion, manages phase transitions, and ensures productive engagement.",
      permissions: [
        "advance_phase",
        "moderate",
        "contribute",
        "export_output",
        "close_deliberation",
      ],
      minCount: 1,
      maxCount: 1,
    },
    {
      id: "presenter",
      name: "Presenter",
      description:
        "Introduces the paper and leads the claim extraction phase.",
      permissions: ["present_claims", "contribute", "edit_claims"],
      minCount: 1,
      maxCount: 2,
    },
    {
      id: "discussant",
      name: "Discussant",
      description: "Actively participates in all phases of discussion.",
      permissions: ["contribute"],
    },
  ],
  requiredSources: 1,
  outputType: "debate_sheet",
  defaultVisibility: "private",
  estimatedDuration: 60,
  tags: ["academic", "paper-review", "collaborative"],
};

export const PAPER_RESPONSE_TEMPLATE: DeliberationTemplate = {
  id: "paper-response",
  name: "Paper Response",
  description:
    "Structured critique or response to a published paper with typed arguments and required citations.",
  icon: "FileText",
  category: "academic",
  phases: [
    {
      id: "target-registration",
      name: "Target Registration",
      description:
        "Register the target paper and its main claims that you will respond to.",
      durationMinutes: 10,
      allowedMoveTypes: ["ASSERT", "PROPOSE"],
      requiredMoveTypes: ["ASSERT"],
      completionCriteria: {
        type: "contributions",
        threshold: 3, // At least 3 claims from target paper
      },
      guidance:
        "Identify the specific claims in the target paper that your response addresses.",
    },
    {
      id: "response-construction",
      name: "Response Construction",
      description:
        "Construct your response arguments with proper typing (rebut, undercut, undermine).",
      allowedMoveTypes: ["REBUT", "UNDERCUT", "UNDERMINE", "CHALLENGE", "SUPPORT"],
      requiredMoveTypes: ["REBUT"],
      completionCriteria: {
        type: "manual",
        requiredRoles: ["author"],
      },
      guidance:
        "For each target claim, construct a typed response. REBUT challenges the conclusion, UNDERCUT challenges the inference, UNDERMINE challenges a premise.",
    },
    {
      id: "evidence-gathering",
      name: "Evidence Gathering",
      description:
        "Add citations and evidence supporting your response arguments.",
      allowedMoveTypes: ["SUPPORT", "CITE"],
      completionCriteria: {
        type: "manual",
        requiredRoles: ["author"],
      },
      guidance:
        "Every empirical claim in your response should be supported by evidence. Add citations from your sources.",
    },
    {
      id: "review",
      name: "Review",
      description: "Co-authors and reviewers provide feedback and refinements.",
      allowedMoveTypes: ["QUESTION", "SUGGEST", "APPROVE"],
      completionCriteria: {
        type: "consensus",
        requiredRoles: ["reviewer"],
      },
      guidance:
        "Review the response for logical consistency, citation completeness, and argument strength.",
    },
  ],
  roles: [
    {
      id: "author",
      name: "Lead Author",
      description: "Primary author of the response paper.",
      permissions: [
        "advance_phase",
        "contribute",
        "edit_claims",
        "export_output",
        "close_deliberation",
      ],
      minCount: 1,
      maxCount: 1,
    },
    {
      id: "co-author",
      name: "Co-Author",
      description: "Contributing author to the response.",
      permissions: ["contribute", "edit_claims"],
    },
    {
      id: "reviewer",
      name: "Internal Reviewer",
      description: "Reviews the response before finalization.",
      permissions: ["contribute"],
      minCount: 1,
    },
  ],
  requiredSources: 1,
  outputType: "thesis",
  defaultVisibility: "private",
  tags: ["academic", "response", "critique", "peer-review"],
};

export const SEMINAR_TEMPLATE: DeliberationTemplate = {
  id: "seminar",
  name: "Course Seminar",
  description:
    "Private course discussion space with reading assignments, contribution requirements, and instructor dashboard.",
  icon: "GraduationCap",
  category: "education",
  phases: [
    {
      id: "reading-prep",
      name: "Reading Preparation",
      description:
        "Complete assigned readings and register initial claims/questions.",
      allowedMoveTypes: ["ASSERT", "QUESTION"],
      minContributions: 2,
      completionCriteria: {
        type: "time",
        threshold: 48 * 60, // 48 hours before session
      },
      guidance:
        "Before the seminar, identify at least 2 key claims or questions from the readings.",
    },
    {
      id: "discussion",
      name: "Discussion",
      description: "Live or asynchronous discussion of the readings.",
      allowedMoveTypes: [
        "ASSERT",
        "QUESTION",
        "SUPPORT",
        "CHALLENGE",
        "EXTEND",
        "COMPARE",
      ],
      minContributions: 3,
      completionCriteria: {
        type: "manual",
        requiredRoles: ["instructor"],
      },
      guidance:
        "Engage with your classmates' claims. Support, challenge, or extend the discussion.",
      prompts: [
        "What surprised you in the readings?",
        "How does this connect to previous weeks?",
        "What remains unclear or contested?",
      ],
    },
    {
      id: "reflection",
      name: "Reflection",
      description: "Post-discussion reflection on key takeaways.",
      allowedMoveTypes: ["SUMMARIZE", "PROPOSE", "QUESTION"],
      minContributions: 1,
      completionCriteria: {
        type: "contributions",
        threshold: 1,
      },
      guidance:
        "Write a brief reflection on what you learned and what questions remain.",
    },
  ],
  roles: [
    {
      id: "instructor",
      name: "Instructor",
      description: "Course instructor with full administrative control.",
      permissions: [
        "advance_phase",
        "moderate",
        "contribute",
        "invite_members",
        "assign_roles",
        "export_output",
        "close_deliberation",
      ],
      minCount: 1,
      maxCount: 2,
    },
    {
      id: "ta",
      name: "Teaching Assistant",
      description: "Supports instruction and moderation.",
      permissions: ["moderate", "contribute", "invite_members"],
    },
    {
      id: "student",
      name: "Student",
      description: "Course participant with contribution requirements.",
      permissions: ["contribute"],
    },
  ],
  requiredSources: 1,
  outputType: "none",
  defaultVisibility: "organization",
  tags: ["education", "course", "seminar", "discussion"],
};

export const CONFERENCE_SESSION_TEMPLATE: DeliberationTemplate = {
  id: "conference-session",
  name: "Conference Session",
  description:
    "Capture and extend discussions from conference presentations and Q&A.",
  icon: "Presentation",
  category: "academic",
  phases: [
    {
      id: "presentation-claims",
      name: "Presentation Claims",
      description: "Register the main claims from the presentation.",
      durationMinutes: 15,
      allowedMoveTypes: ["ASSERT", "PROPOSE"],
      completionCriteria: {
        type: "manual",
        requiredRoles: ["moderator"],
      },
      guidance:
        "Capture the presenter's main thesis and supporting claims as they are presented.",
    },
    {
      id: "qa",
      name: "Q&A",
      description: "Live questions and responses during the session.",
      durationMinutes: 20,
      allowedMoveTypes: ["QUESTION", "RESPOND", "CHALLENGE", "CLARIFY"],
      completionCriteria: {
        type: "time",
      },
      guidance:
        "Record questions and responses from the live Q&A session.",
    },
    {
      id: "extended-discussion",
      name: "Extended Discussion",
      description: "Continue the conversation asynchronously after the session.",
      allowedMoveTypes: [
        "QUESTION",
        "CHALLENGE",
        "SUPPORT",
        "EXTEND",
        "COMPARE",
      ],
      completionCriteria: {
        type: "manual",
        requiredRoles: ["moderator"],
      },
      guidance:
        "Continue engaging with the presentation claims. This space remains open for extended discussion.",
    },
  ],
  roles: [
    {
      id: "moderator",
      name: "Session Moderator",
      description: "Moderates the session and manages the deliberation.",
      permissions: [
        "advance_phase",
        "moderate",
        "contribute",
        "close_deliberation",
      ],
      minCount: 1,
    },
    {
      id: "presenter",
      name: "Presenter",
      description: "The person giving the presentation.",
      permissions: ["present_claims", "contribute", "edit_claims"],
      minCount: 1,
    },
    {
      id: "attendee",
      name: "Attendee",
      description: "Conference attendee participating in discussion.",
      permissions: ["contribute"],
    },
  ],
  requiredSources: 0,
  outputType: "debate_sheet",
  defaultVisibility: "public",
  tags: ["academic", "conference", "presentation", "qa"],
};

// Template registry
export const TEMPLATES: Record<string, DeliberationTemplate> = {
  "journal-club": JOURNAL_CLUB_TEMPLATE,
  "paper-response": PAPER_RESPONSE_TEMPLATE,
  "seminar": SEMINAR_TEMPLATE,
  "conference-session": CONFERENCE_SESSION_TEMPLATE,
};

export function getTemplate(templateId: string): DeliberationTemplate | null {
  return TEMPLATES[templateId] || null;
}

export function getTemplatesByCategory(
  category: string
): DeliberationTemplate[] {
  return Object.values(TEMPLATES).filter((t) => t.category === category);
}

export function getAllTemplates(): DeliberationTemplate[] {
  return Object.values(TEMPLATES);
}
```

---

### Step 1.3.3: Schema Updates for Template Support

**File:** `prisma/schema.prisma` (additions)

```prisma
// Add to Deliberation model
model Deliberation {
  // Existing fields...
  
  // NEW: Template fields
  templateId      String?
  currentPhaseId  String?
  phaseState      Json?     // PhaseState[]
  roleAssignments DeliberationRoleAssignment[]
  
  // Phase history
  phaseHistory    Json[]    // Record of phase transitions
}

model DeliberationRoleAssignment {
  id              String   @id @default(cuid())
  deliberationId  String
  deliberation    Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  roleId          String   // References role.id from template
  assignedAt      DateTime @default(now())
  assignedById    String?
  assignedBy      User?    @relation("RoleAssigner", fields: [assignedById], references: [id])
  
  @@unique([deliberationId, userId, roleId])
  @@index([deliberationId])
  @@index([userId])
}
```

---

### Step 1.3.4: Template Service

**File:** `lib/deliberations/templateService.ts`

```typescript
/**
 * Service for template instantiation and phase management
 */

import { prisma } from "@/lib/prisma";
import { getTemplate, DeliberationTemplate } from "./templates";
import { PhaseState, ParticipantPhaseProgress } from "./templateTypes";

interface CreateFromTemplateInput {
  templateId: string;
  title: string;
  description?: string;
  sourceIds?: string[];
  createdById: string;
  organizationId?: string;
  initialMembers?: Array<{ userId: string; roleId: string }>;
}

export async function createDeliberationFromTemplate(
  input: CreateFromTemplateInput
) {
  const template = getTemplate(input.templateId);
  if (!template) {
    throw new Error(`Template ${input.templateId} not found`);
  }

  // Validate required sources
  if (
    template.requiredSources > 0 &&
    (!input.sourceIds || input.sourceIds.length < template.requiredSources)
  ) {
    throw new Error(
      `Template requires at least ${template.requiredSources} source(s)`
    );
  }

  // Initialize phase state
  const initialPhaseState: PhaseState = {
    phaseId: template.phases[0].id,
    startedAt: new Date(),
    contributions: 0,
    participantProgress: {},
  };

  // Create deliberation
  const deliberation = await prisma.deliberation.create({
    data: {
      title: input.title,
      description:
        input.description ||
        `${template.name}: ${input.title}`,
      templateId: input.templateId,
      currentPhaseId: template.phases[0].id,
      phaseState: [initialPhaseState],
      visibility: template.defaultVisibility,
      createdById: input.createdById,
      organizationId: input.organizationId,
      // Connect sources
      sources: input.sourceIds
        ? {
            connect: input.sourceIds.map((id) => ({ id })),
          }
        : undefined,
      // Add creator as member with first role
      members: {
        create: {
          userId: input.createdById,
          role: "OWNER",
        },
      },
    },
  });

  // Assign roles
  const roleAssignments = [];
  
  // Assign creator to facilitator/author role
  const creatorRole = template.roles.find(
    (r) =>
      r.permissions.includes("advance_phase") ||
      r.permissions.includes("close_deliberation")
  );
  
  if (creatorRole) {
    roleAssignments.push({
      deliberationId: deliberation.id,
      userId: input.createdById,
      roleId: creatorRole.id,
    });
  }

  // Assign any specified initial members
  if (input.initialMembers) {
    for (const member of input.initialMembers) {
      if (member.userId !== input.createdById) {
        roleAssignments.push({
          deliberationId: deliberation.id,
          userId: member.userId,
          roleId: member.roleId,
        });
      }
    }
  }

  if (roleAssignments.length > 0) {
    await prisma.deliberationRoleAssignment.createMany({
      data: roleAssignments,
    });
  }

  return deliberation;
}

/**
 * Advance to next phase
 */
export async function advancePhase(
  deliberationId: string,
  userId: string
): Promise<void> {
  const deliberation = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    include: {
      roleAssignments: true,
    },
  });

  if (!deliberation || !deliberation.templateId) {
    throw new Error("Deliberation not found or has no template");
  }

  const template = getTemplate(deliberation.templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  // Check user permission
  const userRoles = deliberation.roleAssignments.filter(
    (ra) => ra.userId === userId
  );
  const canAdvance = userRoles.some((ra) => {
    const role = template.roles.find((r) => r.id === ra.roleId);
    return role?.permissions.includes("advance_phase");
  });

  if (!canAdvance) {
    throw new Error("User does not have permission to advance phase");
  }

  // Find current phase index
  const currentPhaseIndex = template.phases.findIndex(
    (p) => p.id === deliberation.currentPhaseId
  );

  if (currentPhaseIndex === -1 || currentPhaseIndex >= template.phases.length - 1) {
    throw new Error("Already at final phase or phase not found");
  }

  const nextPhase = template.phases[currentPhaseIndex + 1];

  // Update phase state
  const phaseState = (deliberation.phaseState as PhaseState[]) || [];
  
  // Complete current phase
  if (phaseState.length > 0) {
    phaseState[phaseState.length - 1].completedAt = new Date();
  }

  // Start next phase
  const newPhaseState: PhaseState = {
    phaseId: nextPhase.id,
    startedAt: new Date(),
    contributions: 0,
    participantProgress: {},
  };
  phaseState.push(newPhaseState);

  // Update deliberation
  await prisma.deliberation.update({
    where: { id: deliberationId },
    data: {
      currentPhaseId: nextPhase.id,
      phaseState,
      phaseHistory: {
        push: {
          phaseId: deliberation.currentPhaseId,
          completedAt: new Date(),
          advancedById: userId,
        },
      },
    },
  });
}

/**
 * Record a contribution in the current phase
 */
export async function recordContribution(
  deliberationId: string,
  userId: string,
  moveType: string
): Promise<void> {
  const deliberation = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
  });

  if (!deliberation || !deliberation.templateId) return;

  const template = getTemplate(deliberation.templateId);
  if (!template) return;

  const currentPhase = template.phases.find(
    (p) => p.id === deliberation.currentPhaseId
  );
  if (!currentPhase) return;

  // Update phase state
  const phaseState = (deliberation.phaseState as PhaseState[]) || [];
  const currentPhaseState = phaseState.find(
    (ps) => ps.phaseId === deliberation.currentPhaseId
  );

  if (currentPhaseState) {
    currentPhaseState.contributions++;

    // Update participant progress
    if (!currentPhaseState.participantProgress[userId]) {
      currentPhaseState.participantProgress[userId] = {
        userId,
        contributions: 0,
        requiredMet: false,
      };
    }

    const progress = currentPhaseState.participantProgress[userId];
    progress.contributions++;
    progress.lastContributionAt = new Date();

    // Check if required moves met
    if (currentPhase.requiredMoveTypes?.includes(moveType as any)) {
      progress.requiredMet = true;
    }

    await prisma.deliberation.update({
      where: { id: deliberationId },
      data: { phaseState },
    });
  }
}

/**
 * Get phase status for a deliberation
 */
export async function getPhaseStatus(deliberationId: string) {
  const deliberation = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    include: {
      roleAssignments: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!deliberation || !deliberation.templateId) {
    return null;
  }

  const template = getTemplate(deliberation.templateId);
  if (!template) return null;

  const currentPhaseIndex = template.phases.findIndex(
    (p) => p.id === deliberation.currentPhaseId
  );
  const currentPhase = template.phases[currentPhaseIndex];
  const phaseState = (deliberation.phaseState as PhaseState[]) || [];
  const currentPhaseState = phaseState.find(
    (ps) => ps.phaseId === deliberation.currentPhaseId
  );

  return {
    template,
    currentPhase,
    currentPhaseIndex,
    totalPhases: template.phases.length,
    phaseState: currentPhaseState,
    canAdvance: currentPhaseIndex < template.phases.length - 1,
    roleAssignments: deliberation.roleAssignments,
  };
}
```

---

### Step 1.3.5: Template API Routes

**File:** `app/api/deliberations/templates/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllTemplates, getTemplatesByCategory } from "@/lib/deliberations/templates";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const templates = category
    ? getTemplatesByCategory(category)
    : getAllTemplates();

  return NextResponse.json({ templates });
}
```

**File:** `app/api/deliberations/templates/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTemplate } from "@/lib/deliberations/templates";

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const template = getTemplate(context.params.id);

  if (!template) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ template });
}
```

**File:** `app/api/deliberations/from-template/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDeliberationFromTemplate } from "@/lib/deliberations/templateService";
import { z } from "zod";

const CreateFromTemplateSchema = z.object({
  templateId: z.string(),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  sourceIds: z.array(z.string()).optional(),
  organizationId: z.string().optional(),
  initialMembers: z
    .array(
      z.object({
        userId: z.string(),
        roleId: z.string(),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = CreateFromTemplateSchema.parse(body);

    const deliberation = await createDeliberationFromTemplate({
      ...input,
      createdById: session.user.id,
    });

    return NextResponse.json({ deliberation }, { status: 201 });
  } catch (error) {
    console.error("Create from template error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/deliberations/[id]/phase/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { advancePhase, getPhaseStatus } from "@/lib/deliberations/templateService";

interface RouteContext {
  params: { id: string };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getPhaseStatus(context.params.id);

  if (!status) {
    return NextResponse.json(
      { error: "Deliberation not found or has no template" },
      { status: 404 }
    );
  }

  return NextResponse.json(status);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await advancePhase(context.params.id, session.user.id);

    const status = await getPhaseStatus(context.params.id);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("Advance phase error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## UI Components

### Step 1.3.6: Template Selector

**File:** `components/deliberations/TemplateSelector.tsx`

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Loader2,
  Presentation,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  selectedId?: string;
  onSelect: (templateId: string) => void;
  category?: string;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  BookOpen,
  FileText,
  GraduationCap,
  Presentation,
};

export function TemplateSelector({
  selectedId,
  onSelect,
  category,
}: TemplateSelectorProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["templates", category],
    queryFn: async () => {
      const params = category ? `?category=${category}` : "";
      const response = await fetch(`/api/deliberations/templates${params}`);
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const templates = data?.templates || [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {templates.map((template: any) => {
        const Icon = ICON_MAP[template.icon] || FileText;
        const isSelected = selectedId === template.id;

        return (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              isSelected && "ring-2 ring-primary"
            )}
            onClick={() => onSelect(template.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {template.name}
                    </CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </div>
                {isSelected && (
                  <Badge className="bg-primary">Selected</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {template.description}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{template.phases.length} phases</span>
                <span>•</span>
                <span>{template.roles.length} roles</span>
                {template.estimatedDuration && (
                  <>
                    <span>•</span>
                    <span>~{template.estimatedDuration} min</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

---

### Step 1.3.7: Phase Progress Indicator

**File:** `components/deliberations/PhaseProgressIndicator.tsx`

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronRight,
  Check,
  Clock,
  Loader2,
  Play,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PhaseProgressIndicatorProps {
  deliberationId: string;
}

export function PhaseProgressIndicator({
  deliberationId,
}: PhaseProgressIndicatorProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["phase-status", deliberationId],
    queryFn: async () => {
      const response = await fetch(
        `/api/deliberations/${deliberationId}/phase`
      );
      if (!response.ok) throw new Error("Failed to fetch phase status");
      return response.json();
    },
  });

  const advanceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/deliberations/${deliberationId}/phase`,
        { method: "POST" }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to advance phase");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["phase-status", deliberationId],
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.template) {
    return null; // Non-templated deliberation
  }

  const {
    template,
    currentPhase,
    currentPhaseIndex,
    totalPhases,
    phaseState,
    canAdvance,
    roleAssignments,
  } = data;

  const progress = ((currentPhaseIndex + 1) / totalPhases) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4 w-4" />
            {template.name}
          </CardTitle>
          <Badge variant="outline">
            Phase {currentPhaseIndex + 1} of {totalPhases}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phase Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Phase Steps */}
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {template.phases.map((phase: any, index: number) => {
            const isCompleted = index < currentPhaseIndex;
            const isCurrent = index === currentPhaseIndex;
            const isFuture = index > currentPhaseIndex;

            return (
              <Tooltip key={phase.id}>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                        isCompleted && "bg-green-100 text-green-700",
                        isCurrent && "bg-primary text-primary-foreground",
                        isFuture && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < template.phases.length - 1 && (
                      <div
                        className={cn(
                          "w-8 h-0.5 mx-1",
                          isCompleted ? "bg-green-300" : "bg-muted"
                        )}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{phase.name}</p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">
                    {phase.description}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Current Phase Details */}
        {currentPhase && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{currentPhase.name}</h4>
              {currentPhase.durationMinutes && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {currentPhase.durationMinutes} min
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {currentPhase.description}
            </p>

            {currentPhase.guidance && (
              <div className="text-sm bg-blue-50 text-blue-700 p-3 rounded-md">
                💡 {currentPhase.guidance}
              </div>
            )}

            {phaseState && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {Object.keys(phaseState.participantProgress || {}).length}{" "}
                  participants
                </span>
                <span>{phaseState.contributions} contributions</span>
              </div>
            )}

            {canAdvance && (
              <Button
                size="sm"
                onClick={() => advanceMutation.mutate()}
                disabled={advanceMutation.isPending}
                className="w-full"
              >
                {advanceMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="mr-2 h-4 w-4" />
                )}
                Advance to Next Phase
              </Button>
            )}
          </div>
        )}

        {/* Prompts */}
        {currentPhase?.prompts && currentPhase.prompts.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Discussion Prompts</h5>
            <ul className="space-y-1">
              {currentPhase.prompts.map((prompt: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary">•</span>
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Phase 1.3 Summary Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Template type definitions | `lib/deliberations/templateTypes.ts` | 📋 Defined |
| 2 | Built-in templates | `lib/deliberations/templates.ts` | 📋 Defined |
| 3 | Schema updates | `prisma/schema.prisma` | 📋 Defined |
| 4 | Template service | `lib/deliberations/templateService.ts` | 📋 Defined |
| 5 | Templates list API | `app/api/deliberations/templates/route.ts` | 📋 Defined |
| 6 | Template detail API | `app/api/deliberations/templates/[id]/route.ts` | 📋 Defined |
| 7 | Create from template API | `app/api/deliberations/from-template/route.ts` | 📋 Defined |
| 8 | Phase management API | `app/api/deliberations/[id]/phase/route.ts` | 📋 Defined |
| 9 | TemplateSelector | `components/deliberations/TemplateSelector.tsx` | 📋 Defined |
| 10 | PhaseProgressIndicator | `components/deliberations/PhaseProgressIndicator.tsx` | 📋 Defined |

---

## Built-in Templates Summary

| Template | Use Case | Phases | Roles |
|----------|----------|--------|-------|
| Journal Club | Paper discussion | 4 (Extract → Methodology → Theory → Synthesis) | Facilitator, Presenter, Discussant |
| Paper Response | Formal critique | 4 (Target → Response → Evidence → Review) | Lead Author, Co-Author, Reviewer |
| Course Seminar | Educational | 3 (Prep → Discussion → Reflection) | Instructor, TA, Student |
| Conference Session | Live events | 3 (Presentation → Q&A → Extended) | Moderator, Presenter, Attendee |

---

## Next Steps

After completing Phase 1.3:
1. Run schema migration
2. Test template creation flow
3. Test phase advancement
4. Proceed to [Phase 1.4: Academic Identity & Affiliation](./PHASE_1.4_ACADEMIC_IDENTITY.md)

---

*End of Phase 1.3 Implementation Guide*
