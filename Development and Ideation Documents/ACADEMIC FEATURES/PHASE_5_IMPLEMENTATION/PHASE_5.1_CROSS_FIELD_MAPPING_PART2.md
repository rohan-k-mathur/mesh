# Phase 5.1: Cross-Field Claim Mapping (Part 2)

**Sub-Phase:** 5.1 of 5.3  
**Focus:** Alert Service, API Routes, React Query Hooks & UI Components

---

## Implementation Steps (Continued)

### Step 5.1.5: Cross-Field Alert Service

**File:** `lib/crossfield/alertService.ts`

```typescript
/**
 * Service for cross-field discovery alerts
 */

import { prisma } from "@/lib/prisma";
import {
  AlertPreferences,
  AlertStatus,
  CrossFieldAlertData,
  CrossFieldAlertType,
} from "./types";
import { findSimilarConcepts } from "./conceptService";

/**
 * Create cross-field alert
 */
export async function createAlert(
  userId: string,
  data: {
    alertType: CrossFieldAlertType;
    title: string;
    description: string;
    sourceField?: string;
    targetField?: string;
    matchScore?: number;
    sourceClaimId?: string;
    targetClaimId?: string;
    conceptId?: string;
    equivalenceId?: string;
  }
): Promise<CrossFieldAlertData> {
  const alert = await prisma.crossFieldAlert.create({
    data: {
      userId,
      alertType: data.alertType,
      title: data.title,
      description: data.description,
      sourceField: data.sourceField,
      targetField: data.targetField,
      matchScore: data.matchScore,
      sourceClaimId: data.sourceClaimId,
      targetClaimId: data.targetClaimId,
      conceptId: data.conceptId,
      equivalenceId: data.equivalenceId,
      status: "UNREAD",
    },
  });

  return {
    id: alert.id,
    alertType: alert.alertType as CrossFieldAlertType,
    title: alert.title,
    description: alert.description,
    sourceField: alert.sourceField || undefined,
    targetField: alert.targetField || undefined,
    matchScore: alert.matchScore || undefined,
    sourceClaimId: alert.sourceClaimId || undefined,
    targetClaimId: alert.targetClaimId || undefined,
    conceptId: alert.conceptId || undefined,
    status: alert.status as AlertStatus,
    createdAt: alert.createdAt,
  };
}

/**
 * Get user's alerts
 */
export async function getUserAlerts(
  userId: string,
  options?: {
    status?: AlertStatus;
    types?: CrossFieldAlertType[];
    limit?: number;
    offset?: number;
  }
): Promise<{ alerts: CrossFieldAlertData[]; total: number }> {
  const where: any = { userId };

  if (options?.status) {
    where.status = options.status;
  }
  if (options?.types && options.types.length > 0) {
    where.alertType = { in: options.types };
  }

  const [alerts, total] = await Promise.all([
    prisma.crossFieldAlert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }),
    prisma.crossFieldAlert.count({ where }),
  ]);

  return {
    alerts: alerts.map((a) => ({
      id: a.id,
      alertType: a.alertType as CrossFieldAlertType,
      title: a.title,
      description: a.description,
      sourceField: a.sourceField || undefined,
      targetField: a.targetField || undefined,
      matchScore: a.matchScore || undefined,
      sourceClaimId: a.sourceClaimId || undefined,
      targetClaimId: a.targetClaimId || undefined,
      conceptId: a.conceptId || undefined,
      status: a.status as AlertStatus,
      createdAt: a.createdAt,
    })),
    total,
  };
}

/**
 * Mark alert as read
 */
export async function markAlertRead(alertId: string): Promise<void> {
  await prisma.crossFieldAlert.update({
    where: { id: alertId },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });
}

/**
 * Mark alert as actioned
 */
export async function markAlertActioned(alertId: string): Promise<void> {
  await prisma.crossFieldAlert.update({
    where: { id: alertId },
    data: {
      status: "ACTIONED",
      actionedAt: new Date(),
    },
  });
}

/**
 * Dismiss alert
 */
export async function dismissAlert(alertId: string): Promise<void> {
  await prisma.crossFieldAlert.update({
    where: { id: alertId },
    data: { status: "DISMISSED" },
  });
}

/**
 * Get unread alert count
 */
export async function getUnreadAlertCount(userId: string): Promise<number> {
  return prisma.crossFieldAlert.count({
    where: { userId, status: "UNREAD" },
  });
}

/**
 * Generate similar claim alerts for a user
 * Called when new claims are created in monitored fields
 */
export async function generateSimilarClaimAlerts(
  claimId: string,
  claimFieldId: string,
  claimSummary: string
): Promise<number> {
  // Find users interested in this field
  const interestedUsers = await prisma.scholarExpertise.findMany({
    where: {
      topicId: claimFieldId,
      level: { in: ["ESTABLISHED", "EXPERT", "AUTHORITY"] },
    },
    select: { userId: true },
  });

  // Get claims from those users
  const userClaims = await prisma.claim.findMany({
    where: {
      userId: { in: interestedUsers.map((u) => u.userId) },
      fieldId: { not: claimFieldId },
    },
    include: { field: true },
    take: 100,
  });

  // Find semantic matches (simplified - would use embeddings in production)
  let alertCount = 0;

  for (const userClaim of userClaims) {
    // Check if similar (would be embedding-based)
    const isSimilar = checkSimilarity(claimSummary, userClaim.summary);

    if (isSimilar.similar && isSimilar.score > 0.7) {
      await createAlert(userClaim.userId, {
        alertType: "SIMILAR_CLAIM",
        title: `Similar claim found in ${claimFieldId}`,
        description: `A claim in ${claimFieldId} appears related to your work: "${claimSummary.substring(0, 100)}..."`,
        sourceField: userClaim.fieldId || undefined,
        targetField: claimFieldId,
        matchScore: isSimilar.score,
        sourceClaimId: userClaim.id,
        targetClaimId: claimId,
      });
      alertCount++;
    }
  }

  return alertCount;
}

/**
 * Generate field discussion alerts
 */
export async function generateFieldDiscussionAlert(
  fieldId: string,
  deliberationId: string,
  deliberationTitle: string
): Promise<number> {
  // Find experts in this field
  const experts = await prisma.scholarExpertise.findMany({
    where: {
      topicId: fieldId,
      level: { in: ["EXPERT", "AUTHORITY"] },
    },
    select: { userId: true },
  });

  for (const expert of experts) {
    await createAlert(expert.userId, {
      alertType: "FIELD_DISCUSSION",
      title: `New discussion in your field`,
      description: `A new deliberation "${deliberationTitle}" has started in your area of expertise.`,
      targetField: fieldId,
    });
  }

  return experts.length;
}

/**
 * Basic similarity check (placeholder for embedding-based)
 */
function checkSimilarity(
  text1: string,
  text2: string
): { similar: boolean; score: number } {
  // Simplified - would use embeddings in production
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  const jaccardSimilarity = intersection.size / union.size;

  return {
    similar: jaccardSimilarity > 0.2,
    score: jaccardSimilarity,
  };
}
```

---

### Step 5.1.6: Cross-Field API Routes

**File:** `app/api/crossfield/fields/route.ts`

```typescript
/**
 * Academic fields API
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getTopLevelFields,
  getFieldHierarchy,
  createField,
  searchFields,
} from "@/lib/crossfield/fieldService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const hierarchy = searchParams.get("hierarchy") === "true";

    if (hierarchy) {
      const tree = await getFieldHierarchy();
      return NextResponse.json(tree);
    }

    if (query) {
      const results = await searchFields(query);
      return NextResponse.json(results);
    }

    const fields = await getTopLevelFields();
    return NextResponse.json(fields);
  } catch (error) {
    console.error("Error fetching fields:", error);
    return NextResponse.json(
      { error: "Failed to fetch fields" },
      { status: 500 }
    );
  }
}

const CreateFieldSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  parentFieldId: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  keyTerms: z.array(z.string()).optional(),
  epistemicStyle: z
    .enum([
      "EMPIRICAL",
      "INTERPRETIVE",
      "FORMAL",
      "NORMATIVE",
      "HISTORICAL",
      "MIXED",
    ])
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = CreateFieldSchema.parse(body);

    const field = await createField(input);

    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    console.error("Error creating field:", error);
    return NextResponse.json(
      { error: "Failed to create field" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/crossfield/fields/[fieldId]/route.ts`

```typescript
/**
 * Single field API
 */

import { NextRequest, NextResponse } from "next/server";
import { getFieldWithRelations } from "@/lib/crossfield/fieldService";

export async function GET(
  req: NextRequest,
  { params }: { params: { fieldId: string } }
) {
  try {
    const field = await getFieldWithRelations(params.fieldId);

    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json(field);
  } catch (error) {
    console.error("Error fetching field:", error);
    return NextResponse.json(
      { error: "Failed to fetch field" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/crossfield/concepts/route.ts`

```typescript
/**
 * Concepts API
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createConcept,
  searchConcepts,
  getConceptsByField,
} from "@/lib/crossfield/conceptService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const fieldId = searchParams.get("fieldId");

    if (query) {
      const results = await searchConcepts(query, fieldId || undefined);
      return NextResponse.json(results);
    }

    if (fieldId) {
      const concepts = await getConceptsByField(fieldId);
      return NextResponse.json(concepts);
    }

    return NextResponse.json({ error: "Query or fieldId required" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching concepts:", error);
    return NextResponse.json(
      { error: "Failed to fetch concepts" },
      { status: 500 }
    );
  }
}

const CreateConceptSchema = z.object({
  name: z.string().min(2).max(300),
  definition: z.string().min(10),
  fieldId: z.string(),
  aliases: z.array(z.string()).optional(),
  relatedTerms: z.array(z.string()).optional(),
  keySourceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = CreateConceptSchema.parse(body);

    const concept = await createConcept(session.user.id, input);

    return NextResponse.json(concept, { status: 201 });
  } catch (error) {
    console.error("Error creating concept:", error);
    return NextResponse.json(
      { error: "Failed to create concept" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/crossfield/concepts/[conceptId]/route.ts`

```typescript
/**
 * Single concept API
 */

import { NextRequest, NextResponse } from "next/server";
import { getConceptWithEquivalences } from "@/lib/crossfield/conceptService";

export async function GET(
  req: NextRequest,
  { params }: { params: { conceptId: string } }
) {
  try {
    const concept = await getConceptWithEquivalences(params.conceptId);

    if (!concept) {
      return NextResponse.json({ error: "Concept not found" }, { status: 404 });
    }

    return NextResponse.json(concept);
  } catch (error) {
    console.error("Error fetching concept:", error);
    return NextResponse.json(
      { error: "Failed to fetch concept" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/crossfield/concepts/[conceptId]/similar/route.ts`

```typescript
/**
 * Find similar concepts
 */

import { NextRequest, NextResponse } from "next/server";
import { findSimilarConcepts } from "@/lib/crossfield/conceptService";

export async function GET(
  req: NextRequest,
  { params }: { params: { conceptId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const minSimilarity = parseFloat(searchParams.get("minSimilarity") || "0.7");

    const similar = await findSimilarConcepts(params.conceptId, minSimilarity);

    return NextResponse.json(similar);
  } catch (error) {
    console.error("Error finding similar concepts:", error);
    return NextResponse.json(
      { error: "Failed to find similar concepts" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/crossfield/equivalences/route.ts`

```typescript
/**
 * Concept equivalence API
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { proposeEquivalence } from "@/lib/crossfield/conceptService";

const ProposeEquivalenceSchema = z.object({
  sourceConceptId: z.string(),
  targetConceptId: z.string(),
  equivalenceType: z.enum([
    "IDENTICAL",
    "SIMILAR",
    "OVERLAPPING",
    "RELATED",
    "TRANSLATES_TO",
    "CONTRASTING",
  ]),
  justification: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = ProposeEquivalenceSchema.parse(body);

    await proposeEquivalence(session.user.id, input);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error proposing equivalence:", error);
    return NextResponse.json(
      { error: "Failed to propose equivalence" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/crossfield/equivalences/[equivalenceId]/verify/route.ts`

```typescript
/**
 * Verify equivalence
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyEquivalence } from "@/lib/crossfield/conceptService";

export async function POST(
  req: NextRequest,
  { params }: { params: { equivalenceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await verifyEquivalence(params.equivalenceId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying equivalence:", error);
    return NextResponse.json(
      { error: "Failed to verify equivalence" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/crossfield/alerts/route.ts`

```typescript
/**
 * Cross-field alerts API
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserAlerts,
  getUnreadAlertCount,
} from "@/lib/crossfield/alertService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;
    const countOnly = searchParams.get("countOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (countOnly) {
      const count = await getUnreadAlertCount(session.user.id);
      return NextResponse.json({ count });
    }

    const result = await getUserAlerts(session.user.id, {
      status,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/crossfield/alerts/[alertId]/route.ts`

```typescript
/**
 * Single alert actions
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  markAlertRead,
  markAlertActioned,
  dismissAlert,
} from "@/lib/crossfield/alertService";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();

    switch (action) {
      case "read":
        await markAlertRead(params.alertId);
        break;
      case "actioned":
        await markAlertActioned(params.alertId);
        break;
      case "dismiss":
        await dismissAlert(params.alertId);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}
```

---

### Step 5.1.7: React Query Hooks

**File:** `lib/crossfield/hooks.ts`

```typescript
/**
 * React Query hooks for cross-field features
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AcademicFieldSummary,
  ConceptSummary,
  ConceptWithEquivalences,
  CrossFieldAlertData,
  FieldHierarchy,
  FieldWithRelations,
  EquivalenceType,
} from "./types";

// ============================================================
// Query Keys
// ============================================================

export const crossFieldKeys = {
  all: ["crossfield"] as const,
  fields: () => [...crossFieldKeys.all, "fields"] as const,
  fieldHierarchy: () => [...crossFieldKeys.fields(), "hierarchy"] as const,
  field: (id: string) => [...crossFieldKeys.fields(), id] as const,
  fieldSearch: (query: string) =>
    [...crossFieldKeys.fields(), "search", query] as const,

  concepts: () => [...crossFieldKeys.all, "concepts"] as const,
  concept: (id: string) => [...crossFieldKeys.concepts(), id] as const,
  conceptsByField: (fieldId: string) =>
    [...crossFieldKeys.concepts(), "field", fieldId] as const,
  conceptSearch: (query: string) =>
    [...crossFieldKeys.concepts(), "search", query] as const,
  similarConcepts: (id: string) =>
    [...crossFieldKeys.concepts(), id, "similar"] as const,

  alerts: () => [...crossFieldKeys.all, "alerts"] as const,
  alertCount: () => [...crossFieldKeys.alerts(), "count"] as const,
};

// ============================================================
// Field Hooks
// ============================================================

export function useFields() {
  return useQuery({
    queryKey: crossFieldKeys.fields(),
    queryFn: async (): Promise<AcademicFieldSummary[]> => {
      const res = await fetch("/api/crossfield/fields");
      if (!res.ok) throw new Error("Failed to fetch fields");
      return res.json();
    },
  });
}

export function useFieldHierarchy() {
  return useQuery({
    queryKey: crossFieldKeys.fieldHierarchy(),
    queryFn: async (): Promise<FieldHierarchy[]> => {
      const res = await fetch("/api/crossfield/fields?hierarchy=true");
      if (!res.ok) throw new Error("Failed to fetch field hierarchy");
      return res.json();
    },
  });
}

export function useField(fieldId: string) {
  return useQuery({
    queryKey: crossFieldKeys.field(fieldId),
    queryFn: async (): Promise<FieldWithRelations> => {
      const res = await fetch(`/api/crossfield/fields/${fieldId}`);
      if (!res.ok) throw new Error("Failed to fetch field");
      return res.json();
    },
    enabled: !!fieldId,
  });
}

export function useFieldSearch(query: string) {
  return useQuery({
    queryKey: crossFieldKeys.fieldSearch(query),
    queryFn: async (): Promise<AcademicFieldSummary[]> => {
      const res = await fetch(
        `/api/crossfield/fields?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("Failed to search fields");
      return res.json();
    },
    enabled: query.length >= 2,
  });
}

export function useCreateField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      parentFieldId?: string;
      aliases?: string[];
      keyTerms?: string[];
      epistemicStyle?: string;
    }) => {
      const res = await fetch("/api/crossfield/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create field");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crossFieldKeys.fields() });
    },
  });
}

// ============================================================
// Concept Hooks
// ============================================================

export function useConcept(conceptId: string) {
  return useQuery({
    queryKey: crossFieldKeys.concept(conceptId),
    queryFn: async (): Promise<ConceptWithEquivalences> => {
      const res = await fetch(`/api/crossfield/concepts/${conceptId}`);
      if (!res.ok) throw new Error("Failed to fetch concept");
      return res.json();
    },
    enabled: !!conceptId,
  });
}

export function useConceptsByField(fieldId: string) {
  return useQuery({
    queryKey: crossFieldKeys.conceptsByField(fieldId),
    queryFn: async (): Promise<ConceptSummary[]> => {
      const res = await fetch(`/api/crossfield/concepts?fieldId=${fieldId}`);
      if (!res.ok) throw new Error("Failed to fetch concepts");
      return res.json();
    },
    enabled: !!fieldId,
  });
}

export function useConceptSearch(query: string, fieldId?: string) {
  return useQuery({
    queryKey: crossFieldKeys.conceptSearch(query),
    queryFn: async (): Promise<ConceptSummary[]> => {
      const params = new URLSearchParams({ q: query });
      if (fieldId) params.set("fieldId", fieldId);
      const res = await fetch(`/api/crossfield/concepts?${params}`);
      if (!res.ok) throw new Error("Failed to search concepts");
      return res.json();
    },
    enabled: query.length >= 2,
  });
}

export function useSimilarConcepts(conceptId: string, minSimilarity = 0.7) {
  return useQuery({
    queryKey: crossFieldKeys.similarConcepts(conceptId),
    queryFn: async (): Promise<
      Array<{ concept: ConceptSummary; similarity: number }>
    > => {
      const res = await fetch(
        `/api/crossfield/concepts/${conceptId}/similar?minSimilarity=${minSimilarity}`
      );
      if (!res.ok) throw new Error("Failed to find similar concepts");
      return res.json();
    },
    enabled: !!conceptId,
  });
}

export function useCreateConcept() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      definition: string;
      fieldId: string;
      aliases?: string[];
      relatedTerms?: string[];
    }) => {
      const res = await fetch("/api/crossfield/concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create concept");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: crossFieldKeys.conceptsByField(variables.fieldId),
      });
    },
  });
}

export function useProposeEquivalence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sourceConceptId: string;
      targetConceptId: string;
      equivalenceType: EquivalenceType;
      justification: string;
    }) => {
      const res = await fetch("/api/crossfield/equivalences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to propose equivalence");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: crossFieldKeys.concept(variables.sourceConceptId),
      });
      queryClient.invalidateQueries({
        queryKey: crossFieldKeys.concept(variables.targetConceptId),
      });
    },
  });
}

export function useVerifyEquivalence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equivalenceId: string) => {
      const res = await fetch(
        `/api/crossfield/equivalences/${equivalenceId}/verify`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to verify equivalence");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crossFieldKeys.concepts() });
    },
  });
}

// ============================================================
// Alert Hooks
// ============================================================

export function useAlerts(options?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: [...crossFieldKeys.alerts(), options],
    queryFn: async (): Promise<{
      alerts: CrossFieldAlertData[];
      total: number;
    }> => {
      const params = new URLSearchParams();
      if (options?.status) params.set("status", options.status);
      if (options?.limit) params.set("limit", options.limit.toString());
      if (options?.offset) params.set("offset", options.offset.toString());

      const res = await fetch(`/api/crossfield/alerts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
  });
}

export function useUnreadAlertCount() {
  return useQuery({
    queryKey: crossFieldKeys.alertCount(),
    queryFn: async (): Promise<number> => {
      const res = await fetch("/api/crossfield/alerts?countOnly=true");
      if (!res.ok) throw new Error("Failed to fetch alert count");
      const data = await res.json();
      return data.count;
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      alertId,
      action,
    }: {
      alertId: string;
      action: "read" | "actioned" | "dismiss";
    }) => {
      const res = await fetch(`/api/crossfield/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed to update alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crossFieldKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: crossFieldKeys.alertCount() });
    },
  });
}
```

---

## Phase 5.1 Part 2 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Alert service | `lib/crossfield/alertService.ts` | ✅ |
| 2 | Fields API | `app/api/crossfield/fields/route.ts` | ✅ |
| 3 | Single field API | `app/api/crossfield/fields/[fieldId]/route.ts` | ✅ |
| 4 | Concepts API | `app/api/crossfield/concepts/route.ts` | ✅ |
| 5 | Single concept API | `app/api/crossfield/concepts/[conceptId]/route.ts` | ✅ |
| 6 | Similar concepts API | `app/api/crossfield/concepts/[conceptId]/similar/route.ts` | ✅ |
| 7 | Equivalences API | `app/api/crossfield/equivalences/route.ts` | ✅ |
| 8 | Verify equivalence API | `app/api/crossfield/equivalences/[equivalenceId]/verify/route.ts` | ✅ |
| 9 | Alerts API | `app/api/crossfield/alerts/route.ts` | ✅ |
| 10 | Alert actions API | `app/api/crossfield/alerts/[alertId]/route.ts` | ✅ |
| 11 | React Query hooks | `lib/crossfield/hooks.ts` | ✅ |

---

*Continued in Part 3: UI Components*
