# Phase 5.2: Translation Deliberations (Part 2)

**Sub-Phase:** 5.2 of 5.3  
**Focus:** API Routes, React Query Hooks & UI Components

---

## Implementation Steps (Continued)

### Step 5.2.6: Translation API Routes

**File:** `app/api/translations/route.ts`

```typescript
/**
 * Translation deliberations API
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createTranslation,
  getTranslationsForField,
} from "@/lib/translation/translationService";

const CreateTranslationSchema = z.object({
  title: z.string().min(5).max(300),
  description: z.string().min(10),
  fieldAId: z.string(),
  fieldBId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fieldId = searchParams.get("fieldId");
    const status = searchParams.get("status") as any;

    if (!fieldId) {
      return NextResponse.json(
        { error: "fieldId is required" },
        { status: 400 }
      );
    }

    const translations = await getTranslationsForField(fieldId, status);
    return NextResponse.json(translations);
  } catch (error) {
    console.error("Error fetching translations:", error);
    return NextResponse.json(
      { error: "Failed to fetch translations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = CreateTranslationSchema.parse(body);

    if (input.fieldAId === input.fieldBId) {
      return NextResponse.json(
        { error: "Fields must be different" },
        { status: 400 }
      );
    }

    const translation = await createTranslation(session.user.id, input);
    return NextResponse.json(translation, { status: 201 });
  } catch (error) {
    console.error("Error creating translation:", error);
    return NextResponse.json(
      { error: "Failed to create translation" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/translations/[translationId]/route.ts`

```typescript
/**
 * Single translation API
 */

import { NextRequest, NextResponse } from "next/server";
import { getTranslation } from "@/lib/translation/translationService";

export async function GET(
  req: NextRequest,
  { params }: { params: { translationId: string } }
) {
  try {
    const translation = await getTranslation(params.translationId);

    if (!translation) {
      return NextResponse.json(
        { error: "Translation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(translation);
  } catch (error) {
    console.error("Error fetching translation:", error);
    return NextResponse.json(
      { error: "Failed to fetch translation" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/translations/[translationId]/phase/route.ts`

```typescript
/**
 * Advance translation phase
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { advancePhase } from "@/lib/translation/translationService";

export async function POST(
  req: NextRequest,
  { params }: { params: { translationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { summary } = await req.json();

    const nextPhase = await advancePhase(params.translationId, summary);

    return NextResponse.json({ phase: nextPhase });
  } catch (error) {
    console.error("Error advancing phase:", error);
    return NextResponse.json(
      { error: "Failed to advance phase" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/translations/[translationId]/join/route.ts`

```typescript
/**
 * Join translation as participant
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { joinTranslation } from "@/lib/translation/translationService";

const JoinSchema = z.object({
  role: z.enum([
    "FIELD_A_EXPERT",
    "FIELD_B_EXPERT",
    "BRIDGE_SCHOLAR",
    "OBSERVER",
  ]),
  representingFieldId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { translationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = JoinSchema.parse(body);

    await joinTranslation(
      params.translationId,
      session.user.id,
      input.role,
      input.representingFieldId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error joining translation:", error);
    return NextResponse.json(
      { error: "Failed to join translation" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/translations/[translationId]/mappings/route.ts`

```typescript
/**
 * Term mappings API
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTermMapping } from "@/lib/translation/termMappingService";

const CreateMappingSchema = z.object({
  termAId: z.string().optional(),
  termAName: z.string().min(1),
  termADefinition: z.string().min(5),
  termBId: z.string().optional(),
  termBName: z.string().min(1),
  termBDefinition: z.string().min(5),
  proposedType: z.string(),
  justification: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { translationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = CreateMappingSchema.parse(body);

    const mappingId = await createTermMapping(session.user.id, {
      translationId: params.translationId,
      ...input,
    });

    return NextResponse.json({ id: mappingId }, { status: 201 });
  } catch (error) {
    console.error("Error creating mapping:", error);
    return NextResponse.json(
      { error: "Failed to create mapping" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/translations/mappings/[mappingId]/vote/route.ts`

```typescript
/**
 * Vote on term mapping
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { voteOnMapping } from "@/lib/translation/termMappingService";

const VoteSchema = z.object({
  vote: z.enum(["AGREE", "DISAGREE", "NEEDS_MODIFICATION", "ABSTAIN"]),
  comment: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { mappingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = VoteSchema.parse(body);

    await voteOnMapping(params.mappingId, session.user.id, input.vote, input.comment);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error voting on mapping:", error);
    return NextResponse.json(
      { error: "Failed to vote on mapping" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/translations/[translationId]/bridge-claims/route.ts`

```typescript
/**
 * Bridge claims API
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBridgeClaim } from "@/lib/translation/bridgeClaimService";

const CreateBridgeClaimSchema = z.object({
  fieldAAssumption: z.string().min(10),
  fieldBAssumption: z.string().min(10),
  commonGround: z.string().min(10),
  fieldAAssumptionType: z.enum([
    "EMPIRICAL",
    "NORMATIVE",
    "INTERPRETIVE",
    "METHODOLOGICAL",
    "THEORETICAL",
  ]),
  fieldBAssumptionType: z.enum([
    "EMPIRICAL",
    "NORMATIVE",
    "INTERPRETIVE",
    "METHODOLOGICAL",
    "THEORETICAL",
  ]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { translationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = CreateBridgeClaimSchema.parse(body);

    const claimId = await createBridgeClaim(session.user.id, {
      translationId: params.translationId,
      ...input,
    });

    return NextResponse.json({ id: claimId }, { status: 201 });
  } catch (error) {
    console.error("Error creating bridge claim:", error);
    return NextResponse.json(
      { error: "Failed to create bridge claim" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/translations/bridge-claims/[claimId]/vote/route.ts`

```typescript
/**
 * Vote on bridge claim
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { voteOnBridgeClaim } from "@/lib/translation/bridgeClaimService";

const VoteSchema = z.object({
  vote: z.enum(["AGREE", "DISAGREE", "NEEDS_MODIFICATION", "ABSTAIN"]),
  comment: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = VoteSchema.parse(body);

    await voteOnBridgeClaim(params.claimId, session.user.id, input.vote, input.comment);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error voting on bridge claim:", error);
    return NextResponse.json(
      { error: "Failed to vote on bridge claim" },
      { status: 500 }
    );
  }
}
```

---

### Step 5.2.7: React Query Hooks

**File:** `lib/translation/hooks.ts`

```typescript
/**
 * React Query hooks for translation deliberations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TranslationSummary,
  TranslationWithDetails,
  CreateTermMappingInput,
  CreateBridgeClaimInput,
  VoteType,
  AssumptionType,
} from "./types";

// ============================================================
// Query Keys
// ============================================================

export const translationKeys = {
  all: ["translations"] as const,
  byField: (fieldId: string) => [...translationKeys.all, "field", fieldId] as const,
  detail: (id: string) => [...translationKeys.all, "detail", id] as const,
};

// ============================================================
// Translation Hooks
// ============================================================

export function useTranslationsForField(fieldId: string) {
  return useQuery({
    queryKey: translationKeys.byField(fieldId),
    queryFn: async (): Promise<TranslationSummary[]> => {
      const res = await fetch(`/api/translations?fieldId=${fieldId}`);
      if (!res.ok) throw new Error("Failed to fetch translations");
      return res.json();
    },
    enabled: !!fieldId,
  });
}

export function useTranslation(translationId: string) {
  return useQuery({
    queryKey: translationKeys.detail(translationId),
    queryFn: async (): Promise<TranslationWithDetails> => {
      const res = await fetch(`/api/translations/${translationId}`);
      if (!res.ok) throw new Error("Failed to fetch translation");
      return res.json();
    },
    enabled: !!translationId,
  });
}

export function useCreateTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      fieldAId: string;
      fieldBId: string;
    }) => {
      const res = await fetch("/api/translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create translation");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: translationKeys.byField(variables.fieldAId),
      });
      queryClient.invalidateQueries({
        queryKey: translationKeys.byField(variables.fieldBId),
      });
    },
  });
}

export function useJoinTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      translationId,
      role,
      representingFieldId,
    }: {
      translationId: string;
      role: string;
      representingFieldId?: string;
    }) => {
      const res = await fetch(`/api/translations/${translationId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, representingFieldId }),
      });
      if (!res.ok) throw new Error("Failed to join translation");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: translationKeys.detail(variables.translationId),
      });
    },
  });
}

export function useAdvancePhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      translationId,
      summary,
    }: {
      translationId: string;
      summary?: string;
    }) => {
      const res = await fetch(`/api/translations/${translationId}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
      });
      if (!res.ok) throw new Error("Failed to advance phase");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: translationKeys.detail(variables.translationId),
      });
    },
  });
}

// ============================================================
// Term Mapping Hooks
// ============================================================

export function useCreateTermMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Omit<CreateTermMappingInput, "translationId"> & {
        translationId: string;
      }
    ) => {
      const res = await fetch(
        `/api/translations/${data.translationId}/mappings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to create term mapping");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: translationKeys.detail(variables.translationId),
      });
    },
  });
}

export function useVoteOnMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mappingId,
      translationId,
      vote,
      comment,
    }: {
      mappingId: string;
      translationId: string;
      vote: VoteType;
      comment?: string;
    }) => {
      const res = await fetch(`/api/translations/mappings/${mappingId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote, comment }),
      });
      if (!res.ok) throw new Error("Failed to vote on mapping");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: translationKeys.detail(variables.translationId),
      });
    },
  });
}

// ============================================================
// Bridge Claim Hooks
// ============================================================

export function useCreateBridgeClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: {
        translationId: string;
        fieldAAssumption: string;
        fieldBAssumption: string;
        commonGround: string;
        fieldAAssumptionType: AssumptionType;
        fieldBAssumptionType: AssumptionType;
      }
    ) => {
      const res = await fetch(
        `/api/translations/${data.translationId}/bridge-claims`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to create bridge claim");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: translationKeys.detail(variables.translationId),
      });
    },
  });
}

export function useVoteOnBridgeClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      claimId,
      translationId,
      vote,
      comment,
    }: {
      claimId: string;
      translationId: string;
      vote: VoteType;
      comment?: string;
    }) => {
      const res = await fetch(
        `/api/translations/bridge-claims/${claimId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote, comment }),
        }
      );
      if (!res.ok) throw new Error("Failed to vote on bridge claim");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: translationKeys.detail(variables.translationId),
      });
    },
  });
}
```

---

### Step 5.2.8: Translation Dashboard Component

**File:** `components/translation/TranslationDashboard.tsx`

```tsx
/**
 * Main dashboard for a translation deliberation
 */

"use client";

import { useTranslation, useAdvancePhase } from "@/lib/translation/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  Users,
  FileText,
  GitBranch,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { TranslationPhase, PHASE_DESCRIPTIONS, PHASE_ORDER } from "@/lib/translation/types";
import { PhaseProgress } from "./PhaseProgress";
import { ParticipantsList } from "./ParticipantsList";
import { TermMappingsList } from "./TermMappingsList";
import { BridgeClaimsList } from "./BridgeClaimsList";
import { TranslationOutcome } from "./TranslationOutcome";

interface TranslationDashboardProps {
  translationId: string;
}

export function TranslationDashboard({ translationId }: TranslationDashboardProps) {
  const { data: translation, isLoading } = useTranslation(translationId);
  const { mutate: advancePhase, isPending: isAdvancing } = useAdvancePhase();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!translation) {
    return (
      <div className="text-center py-12 text-gray-500">
        Translation not found
      </div>
    );
  }

  const canAdvance =
    translation.status === "ACTIVE" &&
    translation.currentPhase !== "COMPLETED";

  const handleAdvancePhase = () => {
    advancePhase({ translationId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {translation.title}
            </h1>
            <p className="text-gray-600 mt-1">{translation.description}</p>
          </div>
          <Badge
            variant={
              translation.status === "COMPLETED" ? "default" : "secondary"
            }
          >
            {translation.status.toLowerCase()}
          </Badge>
        </div>

        {/* Field badges */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              {translation.fieldA.name}
            </Badge>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <Badge
              variant="outline"
              className="text-purple-700 border-purple-300"
            >
              {translation.fieldB.name}
            </Badge>
          </div>
        </div>
      </div>

      {/* Phase Progress */}
      <PhaseProgress
        currentPhase={translation.currentPhase}
        phases={translation.phases}
      />

      {/* Current Phase Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              Current Phase: {translation.currentPhase.replace(/_/g, " ")}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {PHASE_DESCRIPTIONS[translation.currentPhase]}
            </p>
          </div>
          {canAdvance && (
            <Button onClick={handleAdvancePhase} disabled={isAdvancing}>
              {isAdvancing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Advance Phase
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mappings">
        <TabsList>
          <TabsTrigger value="mappings" className="gap-2">
            <FileText className="w-4 h-4" />
            Term Mappings ({translation.termMappings.length})
          </TabsTrigger>
          <TabsTrigger value="bridges" className="gap-2">
            <GitBranch className="w-4 h-4" />
            Bridge Claims ({translation.bridgeClaims.length})
          </TabsTrigger>
          <TabsTrigger value="participants" className="gap-2">
            <Users className="w-4 h-4" />
            Participants ({translation.participants.length})
          </TabsTrigger>
          {translation.outcome && (
            <TabsTrigger value="outcome" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Outcome
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="mappings" className="mt-4">
          <TermMappingsList
            translationId={translationId}
            mappings={translation.termMappings}
            fieldA={translation.fieldA}
            fieldB={translation.fieldB}
            canPropose={
              translation.currentPhase === "TERM_COLLECTION" ||
              translation.currentPhase === "INITIAL_MAPPING"
            }
            canVote={translation.currentPhase === "NEGOTIATION"}
          />
        </TabsContent>

        <TabsContent value="bridges" className="mt-4">
          <BridgeClaimsList
            translationId={translationId}
            claims={translation.bridgeClaims}
            fieldA={translation.fieldA}
            fieldB={translation.fieldB}
            canPropose={translation.currentPhase === "BRIDGE_BUILDING"}
            canVote={
              translation.currentPhase === "BRIDGE_BUILDING" ||
              translation.currentPhase === "CAVEAT_DOCUMENTATION"
            }
          />
        </TabsContent>

        <TabsContent value="participants" className="mt-4">
          <ParticipantsList
            translationId={translationId}
            participants={translation.participants}
            facilitatorId={translation.facilitator.id}
            fieldA={translation.fieldA}
            fieldB={translation.fieldB}
          />
        </TabsContent>

        {translation.outcome && (
          <TabsContent value="outcome" className="mt-4">
            <TranslationOutcome outcome={translation.outcome} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
```

---

### Step 5.2.9: Phase Progress Component

**File:** `components/translation/PhaseProgress.tsx`

```tsx
/**
 * Visual progress through translation phases
 */

"use client";

import { Check, Circle } from "lucide-react";
import {
  TranslationPhase,
  PhaseRecordData,
  PHASE_ORDER,
} from "@/lib/translation/types";
import { formatDistanceToNow } from "date-fns";

interface PhaseProgressProps {
  currentPhase: TranslationPhase;
  phases: PhaseRecordData[];
}

export function PhaseProgress({ currentPhase, phases }: PhaseProgressProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  const phaseMap = new Map(phases.map((p) => [p.phase, p]));

  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{
            width: `${(currentIndex / (PHASE_ORDER.length - 1)) * 100}%`,
          }}
        />
      </div>

      {/* Phase steps */}
      <div className="relative flex justify-between">
        {PHASE_ORDER.map((phase, index) => {
          const record = phaseMap.get(phase);
          const isComplete = index < currentIndex;
          const isCurrent = phase === currentPhase;
          const isFuture = index > currentIndex;

          return (
            <div
              key={phase}
              className="flex flex-col items-center"
              style={{ width: `${100 / PHASE_ORDER.length}%` }}
            >
              {/* Icon */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center z-10
                  ${isComplete ? "bg-blue-500 text-white" : ""}
                  ${isCurrent ? "bg-blue-500 text-white ring-4 ring-blue-200" : ""}
                  ${isFuture ? "bg-white border-2 border-gray-300" : ""}
                `}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Circle
                    className={`w-4 h-4 ${isCurrent ? "fill-current" : ""}`}
                  />
                )}
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <div
                  className={`
                    text-xs font-medium
                    ${isCurrent ? "text-blue-600" : "text-gray-600"}
                  `}
                >
                  {formatPhaseName(phase)}
                </div>
                {record?.completedAt && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(record.completedAt), {
                      addSuffix: true,
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatPhaseName(phase: TranslationPhase): string {
  return phase
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
```

---

### Step 5.2.10: Term Mappings List

**File:** `components/translation/TermMappingsList.tsx`

```tsx
/**
 * List and manage term mappings
 */

"use client";

import { useState } from "react";
import { useCreateTermMapping, useVoteOnMapping } from "@/lib/translation/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  ArrowLeftRight,
  Loader2,
} from "lucide-react";
import { TermMappingData, VoteType } from "@/lib/translation/types";

interface TermMappingsListProps {
  translationId: string;
  mappings: TermMappingData[];
  fieldA: { id: string; name: string };
  fieldB: { id: string; name: string };
  canPropose: boolean;
  canVote: boolean;
}

export function TermMappingsList({
  translationId,
  mappings,
  fieldA,
  fieldB,
  canPropose,
  canVote,
}: TermMappingsListProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Term Mappings</h3>
        {canPropose && (
          <CreateMappingDialog
            translationId={translationId}
            fieldA={fieldA}
            fieldB={fieldB}
          />
        )}
      </div>

      {/* Mappings */}
      {mappings.length > 0 ? (
        <div className="space-y-3">
          {mappings.map((mapping) => (
            <MappingCard
              key={mapping.id}
              mapping={mapping}
              translationId={translationId}
              canVote={canVote}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No term mappings proposed yet
        </div>
      )}
    </div>
  );
}

interface MappingCardProps {
  mapping: TermMappingData;
  translationId: string;
  canVote: boolean;
}

function MappingCard({ mapping, translationId, canVote }: MappingCardProps) {
  const { mutate: vote, isPending } = useVoteOnMapping();

  const handleVote = (voteType: VoteType) => {
    vote({
      mappingId: mapping.id,
      translationId,
      vote: voteType,
    });
  };

  const statusColors: Record<string, string> = {
    PROPOSED: "bg-gray-100 text-gray-800",
    UNDER_DISCUSSION: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    MODIFIED: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="border rounded-lg p-4">
      {/* Terms */}
      <div className="flex items-stretch gap-4">
        {/* Term A */}
        <div className="flex-1 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-600 font-medium mb-1">
            {mapping.termA.fieldName}
          </div>
          <div className="font-semibold">{mapping.termA.name}</div>
          <div className="text-sm text-gray-600 mt-1">
            {mapping.termA.definition}
          </div>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center justify-center">
          <ArrowLeftRight className="w-5 h-5 text-gray-400" />
          <Badge variant="outline" className="mt-2 text-xs">
            {mapping.proposedType.toLowerCase().replace("_", " ")}
          </Badge>
        </div>

        {/* Term B */}
        <div className="flex-1 p-3 bg-purple-50 rounded-lg">
          <div className="text-xs text-purple-600 font-medium mb-1">
            {mapping.termB.fieldName}
          </div>
          <div className="font-semibold">{mapping.termB.name}</div>
          <div className="text-sm text-gray-600 mt-1">
            {mapping.termB.definition}
          </div>
        </div>
      </div>

      {/* Justification */}
      {mapping.justification && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
          <span className="font-medium">Justification:</span>{" "}
          {mapping.justification}
        </div>
      )}

      {/* Caveats */}
      {mapping.caveats.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {mapping.caveats.map((caveat, i) => (
            <Badge key={i} variant="outline" className="text-xs text-amber-700">
              ⚠ {caveat}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t">
        <div className="flex items-center gap-3">
          <Badge className={statusColors[mapping.status]}>
            {mapping.status.toLowerCase().replace("_", " ")}
          </Badge>
          <span className="text-sm text-gray-500">
            by {mapping.proposedBy.name}
          </span>
        </div>

        {/* Votes */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <ThumbsUp className="w-4 h-4 text-green-600" />
            <span>{mapping.votes.agree}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ThumbsDown className="w-4 h-4 text-red-600" />
            <span>{mapping.votes.disagree}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>{mapping.votes.needsModification}</span>
          </div>
        </div>

        {/* Vote buttons */}
        {canVote && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("AGREE")}
              disabled={isPending}
            >
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("DISAGREE")}
              disabled={isPending}
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("NEEDS_MODIFICATION")}
              disabled={isPending}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface CreateMappingDialogProps {
  translationId: string;
  fieldA: { id: string; name: string };
  fieldB: { id: string; name: string };
}

function CreateMappingDialog({
  translationId,
  fieldA,
  fieldB,
}: CreateMappingDialogProps) {
  const [open, setOpen] = useState(false);
  const [termAName, setTermAName] = useState("");
  const [termADef, setTermADef] = useState("");
  const [termBName, setTermBName] = useState("");
  const [termBDef, setTermBDef] = useState("");
  const [type, setType] = useState("SIMILAR");
  const [justification, setJustification] = useState("");

  const { mutate: createMapping, isPending } = useCreateTermMapping();

  const handleSubmit = () => {
    createMapping(
      {
        translationId,
        termAName,
        termADefinition: termADef,
        termBName,
        termBDefinition: termBDef,
        proposedType: type,
        justification,
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setTermAName("");
    setTermADef("");
    setTermBName("");
    setTermBDef("");
    setType("SIMILAR");
    setJustification("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Mapping
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Propose Term Mapping</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Field A term */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-blue-600">
              {fieldA.name} Term
            </div>
            <Input
              placeholder="Term name"
              value={termAName}
              onChange={(e) => setTermAName(e.target.value)}
            />
            <Textarea
              placeholder="Definition in this field..."
              value={termADef}
              onChange={(e) => setTermADef(e.target.value)}
              rows={3}
            />
          </div>

          {/* Field B term */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-purple-600">
              {fieldB.name} Term
            </div>
            <Input
              placeholder="Term name"
              value={termBName}
              onChange={(e) => setTermBName(e.target.value)}
            />
            <Textarea
              placeholder="Definition in this field..."
              value={termBDef}
              onChange={(e) => setTermBDef(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Equivalence type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Proposed Relationship</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDENTICAL">Identical</SelectItem>
              <SelectItem value="SIMILAR">Similar</SelectItem>
              <SelectItem value="OVERLAPPING">Overlapping</SelectItem>
              <SelectItem value="RELATED">Related</SelectItem>
              <SelectItem value="TRANSLATES_TO">Translates To</SelectItem>
              <SelectItem value="CONTRASTING">Contrasting</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Justification */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Justification</label>
          <Textarea
            placeholder="Explain why these terms are related..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !termAName || !termADef || !termBName || !termBDef || isPending
            }
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Propose Mapping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Phase 5.2 Part 2 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Translations API | `app/api/translations/route.ts` | ✅ |
| 2 | Single translation API | `app/api/translations/[translationId]/route.ts` | ✅ |
| 3 | Phase advance API | `app/api/translations/[translationId]/phase/route.ts` | ✅ |
| 4 | Join translation API | `app/api/translations/[translationId]/join/route.ts` | ✅ |
| 5 | Term mappings API | `app/api/translations/[translationId]/mappings/route.ts` | ✅ |
| 6 | Mapping vote API | `app/api/translations/mappings/[mappingId]/vote/route.ts` | ✅ |
| 7 | Bridge claims API | `app/api/translations/[translationId]/bridge-claims/route.ts` | ✅ |
| 8 | Bridge claim vote API | `app/api/translations/bridge-claims/[claimId]/vote/route.ts` | ✅ |
| 9 | React Query hooks | `lib/translation/hooks.ts` | ✅ |
| 10 | TranslationDashboard component | `components/translation/TranslationDashboard.tsx` | ✅ |
| 11 | PhaseProgress component | `components/translation/PhaseProgress.tsx` | ✅ |
| 12 | TermMappingsList component | `components/translation/TermMappingsList.tsx` | ✅ |

---

*Continued in Part 3: Bridge Claims UI, Participants & Outcome Components*
