# Conflict Resolution Implementation Plan

**Date**: November 18, 2025  
**Status**: 🚧 Ready for Implementation  
**Duration**: 3-4 days  
**Priority**: P1 Critical  

**Related Documents**:
- Phase 4 Foundation: `ASPIC_PHASE4_PREFERENCES_ROADMAP_V2.md`
- Phase 5 (Full): `ASPIC_PHASE5_ADVANCED_PREFERENCES_ROADMAP.md`
- Cycle Detection: `lib/aspic/translation/aifToASPIC.ts` (existing)

---

## Executive Summary

**Problem**: Circular preferences (A < B < C < A) violate ASPIC+ rationality postulates and break evaluation. Current implementation detects cycles but requires manual database fixes.

**Solution**: Build UI to visualize preference cycles, propose automated resolution strategies, and allow users to resolve conflicts safely.

**Status**: Cycle detection already implemented in `detectPreferenceCycles()`. Need to add:
1. Resolution strategy logic
2. API endpoints for conflict management
3. UI for visualization and resolution
4. Safe preference removal/marking

---

## Architecture Overview

### Current State

```
┌─────────────────────────────────────────────────────────┐
│  lib/aspic/translation/aifToASPIC.ts                    │
├─────────────────────────────────────────────────────────┤
│  ✅ detectPreferenceCycles(prefs[]) → string[][]        │
│     - Detects cycles via DFS                            │
│     - Returns array of cycle paths                      │
│     - Used during evaluation                            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Current Behavior                                        │
├─────────────────────────────────────────────────────────┤
│  ❌ Evaluation fails with error                         │
│  ❌ User must manually delete PA records                │
│  ❌ No visualization of cycle                           │
│  ❌ No suggested fixes                                  │
└─────────────────────────────────────────────────────────┘
```

### Target State

```
┌─────────────────────────────────────────────────────────┐
│  lib/aspic/conflicts/detection.ts (Enhanced)            │
├─────────────────────────────────────────────────────────┤
│  ✅ detectConflicts(deliberationId) → Conflict[]        │
│     - Uses existing detectPreferenceCycles()            │
│     - Enriches with PA metadata (weight, user, date)    │
│     - Returns structured conflict objects               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  lib/aspic/conflicts/resolution.ts (New)                │
├─────────────────────────────────────────────────────────┤
│  ✅ suggestResolution(conflict) → Strategy[]            │
│     - Remove weakest (by weight, default 1.0)           │
│     - Remove oldest (by createdAt)                      │
│     - User selection (manual choice)                    │
│     - Vote-based (if multiple users involved)           │
│                                                          │
│  ✅ applyResolution(strategy) → Result                  │
│     - Soft delete: mark conflictStatus = "resolved"     │
│     - Store resolution metadata                         │
│     - Re-validate after removal                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  API: app/api/aspic/conflicts/route.ts (New)            │
├─────────────────────────────────────────────────────────┤
│  GET  /api/aspic/conflicts?deliberationId=...           │
│    → { conflicts: Conflict[], total: number }           │
│                                                          │
│  POST /api/aspic/conflicts/resolve                      │
│    Body: { conflictIndex, strategyType, paId? }         │
│    → { success: true, removed: number }                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  UI: ConflictResolutionPanel (New Component)            │
├─────────────────────────────────────────────────────────┤
│  ✅ Visual cycle display (A → B → C → A)                │
│  ✅ List of involved preferences with metadata          │
│  ✅ Radio buttons for resolution strategies             │
│  ✅ Preview of changes before applying                  │
│  ✅ Undo support for recent resolutions                 │
└─────────────────────────────────────────────────────────┘
```

---

## Schema Changes

### Update `PreferenceApplication` Model

**File**: `prisma/schema.prisma` (add to existing model)

```prisma
model PreferenceApplication {
  // ... existing fields ...
  
  // Conflict tracking
  conflictStatus      String?   @default("none") // "none" | "detected" | "resolved"
  conflictResolution  Json?     // Resolution metadata
  conflictResolvedAt  DateTime?
  conflictResolvedBy  String?
  
  // ... existing relations ...
  
  @@index([conflictStatus])
}
```

**Migration**:
```bash
npx prisma db push
npx prisma generate
```

**Backward Compatibility**:
- Existing PA records get `conflictStatus = "none"`
- Soft delete: resolved preferences stay in DB with status flag
- Can undo resolution by changing status back to "none"

---

## Implementation Roadmap

### Day 1: Core Detection & Resolution Logic (6-8 hours)

#### Task 1.1: Create Detection Module (2 hours)

**File**: `lib/aspic/conflicts/detection.ts` (New, ~200 lines)

```typescript
/**
 * Enhanced conflict detection with metadata enrichment
 * Builds on existing detectPreferenceCycles() from Phase 4
 */

import { detectPreferenceCycles } from "@/lib/aspic/translation/aifToASPIC";
import { prisma } from "@/lib/prismaclient";

export interface PreferenceInCycle {
  id: string;
  preferred: string;
  dispreferred: string;
  weight: number;
  createdAt: Date;
  createdBy: string;
  createdByName?: string;
  justification?: string;
}

export interface PreferenceConflict {
  type: "cycle";
  cycle: string[]; // Argument/Claim IDs in cycle order
  cycleDisplay: string; // "A → B → C → A"
  preferences: PreferenceInCycle[];
  severity: "critical"; // All cycles are critical
  detectedAt: Date;
}

/**
 * Detect all conflicts in deliberation preferences
 */
export async function detectConflicts(
  deliberationId: string
): Promise<PreferenceConflict[]> {
  // Fetch all PA records for this deliberation
  const paRecords = await prisma.preferenceApplication.findMany({
    where: { 
      deliberationId,
      conflictStatus: { in: ["none", "detected"] }, // Exclude already resolved
    },
    include: {
      createdBy: {
        select: {
          username: true,
          displayName: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Build preference graph (reuse Phase 4 format)
  const prefs = paRecords.map(pa => ({
    preferred: pa.preferredArgumentId ?? pa.preferredClaimId ?? "",
    dispreferred: pa.dispreferredArgumentId ?? pa.dispreferredClaimId ?? "",
  })).filter(p => p.preferred && p.dispreferred);

  // Detect cycles using existing implementation
  const cycles = detectPreferenceCycles(prefs);

  const conflicts: PreferenceConflict[] = [];

  for (const cycle of cycles) {
    // Find PA records involved in this cycle
    const involvedPAs: PreferenceInCycle[] = [];

    for (let i = 0; i < cycle.length; i++) {
      const preferred = cycle[i];
      const dispreferred = cycle[(i + 1) % cycle.length];

      const pa = paRecords.find(r => {
        const pref = r.preferredArgumentId ?? r.preferredClaimId ?? "";
        const dispref = r.dispreferredArgumentId ?? r.dispreferredClaimId ?? "";
        return pref === preferred && dispref === dispreferred;
      });

      if (pa) {
        involvedPAs.push({
          id: pa.id,
          preferred: pa.preferredArgumentId ?? pa.preferredClaimId ?? "",
          dispreferred: pa.dispreferredArgumentId ?? pa.dispreferredClaimId ?? "",
          weight: pa.weight ?? 1.0,
          createdAt: pa.createdAt,
          createdBy: pa.createdById,
          createdByName: (pa.createdBy as any)?.displayName ?? (pa.createdBy as any)?.username,
          justification: pa.justification ?? undefined,
        });
      }
    }

    if (involvedPAs.length > 0) {
      conflicts.push({
        type: "cycle",
        cycle,
        cycleDisplay: [...cycle, cycle[0]].join(" → "),
        preferences: involvedPAs,
        severity: "critical",
        detectedAt: new Date(),
      });
    }
  }

  return conflicts;
}

/**
 * Mark preferences as having detected conflict
 */
export async function markConflictDetected(
  paIds: string[]
): Promise<void> {
  await prisma.preferenceApplication.updateMany({
    where: { id: { in: paIds } },
    data: { conflictStatus: "detected" },
  });
}
```

#### Task 1.2: Create Resolution Strategy Module (3 hours)

**File**: `lib/aspic/conflicts/resolution.ts` (New, ~250 lines)

```typescript
/**
 * Conflict resolution strategies and application logic
 */

import { prisma } from "@/lib/prismaclient";
import type { PreferenceConflict, PreferenceInCycle } from "./detection";
import { detectConflicts } from "./detection";

export interface ResolutionStrategy {
  type: "remove_weakest" | "remove_oldest" | "user_selection" | "vote_based";
  label: string;
  description: string;
  toRemove: string[]; // PA IDs to remove
  recommendation?: "recommended" | "neutral" | "not_recommended";
}

/**
 * Suggest resolution strategies for a conflict
 */
export function suggestResolutionStrategies(
  conflict: PreferenceConflict
): ResolutionStrategy[] {
  const strategies: ResolutionStrategy[] = [];
  const prefs = conflict.preferences;

  // Strategy 1: Remove weakest preference (by weight)
  const sortedByWeight = [...prefs].sort((a, b) => a.weight - b.weight);
  const weakest = sortedByWeight[0];
  
  strategies.push({
    type: "remove_weakest",
    label: "Remove Weakest Preference",
    description: `Remove preference with lowest confidence (weight=${weakest.weight.toFixed(2)})`,
    toRemove: [weakest.id],
    recommendation: sortedByWeight[0].weight < sortedByWeight[1]?.weight ? "recommended" : "neutral",
  });

  // Strategy 2: Remove oldest preference (temporal ordering)
  const sortedByDate = [...prefs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const oldest = sortedByDate[0];
  
  strategies.push({
    type: "remove_oldest",
    label: "Keep Most Recent",
    description: `Remove oldest preference (created ${oldest.createdAt.toLocaleDateString()})`,
    toRemove: [oldest.id],
    recommendation: "neutral",
  });

  // Strategy 3: Vote-based (if multiple users)
  const userGroups = new Map<string, PreferenceInCycle[]>();
  for (const pref of prefs) {
    if (!userGroups.has(pref.createdBy)) {
      userGroups.set(pref.createdBy, []);
    }
    userGroups.get(pref.createdBy)!.push(pref);
  }

  if (userGroups.size > 1) {
    // Find user with fewest preferences in cycle (minority opinion)
    let minCount = Infinity;
    let minorityUser = "";
    for (const [userId, userPrefs] of userGroups) {
      if (userPrefs.length < minCount) {
        minCount = userPrefs.length;
        minorityUser = userId;
      }
    }

    const minorityPrefs = userGroups.get(minorityUser) ?? [];
    strategies.push({
      type: "vote_based",
      label: "Remove Minority Opinion",
      description: `Remove preferences from user with fewest contributions (${minCount} preference${minCount > 1 ? "s" : ""})`,
      toRemove: minorityPrefs.map(p => p.id),
      recommendation: "neutral",
    });
  }

  // Strategy 4: Manual selection (always available)
  strategies.push({
    type: "user_selection",
    label: "Manual Selection",
    description: "Choose which preference(s) to remove manually",
    toRemove: [], // User will select
    recommendation: "neutral",
  });

  return strategies;
}

/**
 * Apply resolution strategy to conflict
 */
export async function applyResolution(
  strategy: ResolutionStrategy,
  userId: string,
  deliberationId: string
): Promise<{ success: boolean; removed: number; newCycles: number }> {
  // Soft delete: mark preferences as resolved
  await prisma.preferenceApplication.updateMany({
    where: { id: { in: strategy.toRemove } },
    data: {
      conflictStatus: "resolved",
      conflictResolution: {
        strategy: strategy.type,
        label: strategy.label,
        description: strategy.description,
        resolvedAt: new Date().toISOString(),
        resolvedBy: userId,
      },
      conflictResolvedAt: new Date(),
      conflictResolvedBy: userId,
    },
  });

  // Re-check for remaining conflicts
  const remainingConflicts = await detectConflicts(deliberationId);

  return {
    success: true,
    removed: strategy.toRemove.length,
    newCycles: remainingConflicts.length,
  };
}

/**
 * Undo resolution (restore resolved preferences)
 */
export async function undoResolution(
  paIds: string[]
): Promise<{ restored: number }> {
  await prisma.preferenceApplication.updateMany({
    where: { id: { in: paIds } },
    data: {
      conflictStatus: "none",
      conflictResolution: null,
      conflictResolvedAt: null,
      conflictResolvedBy: null,
    },
  });

  return { restored: paIds.length };
}

/**
 * Get resolution history for deliberation
 */
export async function getResolutionHistory(
  deliberationId: string
): Promise<Array<{
  id: string;
  resolvedAt: Date;
  resolvedBy: string;
  strategy: string;
  preferences: number;
}>> {
  const resolved = await prisma.preferenceApplication.findMany({
    where: {
      deliberationId,
      conflictStatus: "resolved",
    },
    select: {
      id: true,
      conflictResolvedAt: true,
      conflictResolvedBy: true,
      conflictResolution: true,
    },
    orderBy: { conflictResolvedAt: "desc" },
  });

  return resolved.map(r => ({
    id: r.id,
    resolvedAt: r.conflictResolvedAt!,
    resolvedBy: r.conflictResolvedBy!,
    strategy: (r.conflictResolution as any)?.strategy ?? "unknown",
    preferences: 1,
  }));
}
```

#### Task 1.3: Write Unit Tests (2 hours)

**File**: `__tests__/aspic/conflicts/resolution.test.ts` (New, ~200 lines)

```typescript
import { detectConflicts } from "@/lib/aspic/conflicts/detection";
import { suggestResolutionStrategies, applyResolution, undoResolution } from "@/lib/aspic/conflicts/resolution";
import { createTestDeliberation } from "../../testHelpers";

describe("Conflict Detection", () => {
  test("detects simple 2-cycle (A > B, B > A)", async () => {
    const { deliberationId, argA, argB } = await createTestDeliberation();

    // Create circular preferences
    await createPA(deliberationId, argA, argB, 1.0);
    await createPA(deliberationId, argB, argA, 1.0);

    const conflicts = await detectConflicts(deliberationId);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].cycle).toContain(argA);
    expect(conflicts[0].cycle).toContain(argB);
    expect(conflicts[0].preferences).toHaveLength(2);
  });

  test("detects 3-cycle (A > B > C > A)", async () => {
    const { deliberationId, argA, argB, argC } = await createTestDeliberation();

    await createPA(deliberationId, argA, argB, 1.0);
    await createPA(deliberationId, argB, argC, 1.0);
    await createPA(deliberationId, argC, argA, 1.0);

    const conflicts = await detectConflicts(deliberationId);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].preferences).toHaveLength(3);
  });

  test("no conflicts in acyclic preferences", async () => {
    const { deliberationId, argA, argB, argC } = await createTestDeliberation();

    await createPA(deliberationId, argA, argB, 1.0);
    await createPA(deliberationId, argB, argC, 1.0);
    // No cycle: A > B > C

    const conflicts = await detectConflicts(deliberationId);

    expect(conflicts).toHaveLength(0);
  });
});

describe("Resolution Strategies", () => {
  test("suggests remove weakest when weights differ", async () => {
    const conflict = createMockConflict([
      { id: "pa1", weight: 0.6, createdAt: new Date("2025-01-01") },
      { id: "pa2", weight: 1.0, createdAt: new Date("2025-01-02") },
    ]);

    const strategies = suggestResolutionStrategies(conflict);
    const weakest = strategies.find(s => s.type === "remove_weakest");

    expect(weakest).toBeDefined();
    expect(weakest!.toRemove).toEqual(["pa1"]);
    expect(weakest!.recommendation).toBe("recommended");
  });

  test("suggests remove oldest preference", async () => {
    const conflict = createMockConflict([
      { id: "pa1", weight: 1.0, createdAt: new Date("2025-01-01") },
      { id: "pa2", weight: 1.0, createdAt: new Date("2025-01-05") },
    ]);

    const strategies = suggestResolutionStrategies(conflict);
    const oldest = strategies.find(s => s.type === "remove_oldest");

    expect(oldest).toBeDefined();
    expect(oldest!.toRemove).toEqual(["pa1"]);
  });

  test("suggests vote-based when multiple users", async () => {
    const conflict = createMockConflict([
      { id: "pa1", weight: 1.0, createdAt: new Date(), createdBy: "user1" },
      { id: "pa2", weight: 1.0, createdAt: new Date(), createdBy: "user2" },
      { id: "pa3", weight: 1.0, createdAt: new Date(), createdBy: "user2" },
    ]);

    const strategies = suggestResolutionStrategies(conflict);
    const voteBased = strategies.find(s => s.type === "vote_based");

    expect(voteBased).toBeDefined();
    expect(voteBased!.toRemove).toEqual(["pa1"]); // user1 has minority
  });
});

describe("Apply Resolution", () => {
  test("marks preferences as resolved", async () => {
    const { deliberationId, argA, argB, userId } = await createTestDeliberation();

    const pa1 = await createPA(deliberationId, argA, argB, 1.0);
    const pa2 = await createPA(deliberationId, argB, argA, 1.0);

    const strategy = {
      type: "remove_weakest" as const,
      label: "Test",
      description: "Test",
      toRemove: [pa1],
    };

    const result = await applyResolution(strategy, userId, deliberationId);

    expect(result.success).toBe(true);
    expect(result.removed).toBe(1);

    const updated = await prisma.preferenceApplication.findUnique({
      where: { id: pa1 },
    });

    expect(updated?.conflictStatus).toBe("resolved");
  });

  test("detects remaining conflicts after resolution", async () => {
    // Create A > B > C > D > A (4-cycle)
    // Remove one edge → should be no cycles
    const { deliberationId, userId } = await createTestDeliberation();

    // Implementation test...
  });
});

describe("Undo Resolution", () => {
  test("restores resolved preferences", async () => {
    const { deliberationId, argA, argB, userId } = await createTestDeliberation();

    const pa1 = await createPA(deliberationId, argA, argB, 1.0);

    // Resolve
    await prisma.preferenceApplication.update({
      where: { id: pa1 },
      data: { conflictStatus: "resolved" },
    });

    // Undo
    const result = await undoResolution([pa1]);

    expect(result.restored).toBe(1);

    const updated = await prisma.preferenceApplication.findUnique({
      where: { id: pa1 },
    });

    expect(updated?.conflictStatus).toBe("none");
  });
});

// Helper functions
async function createPA(deliberationId: string, preferred: string, dispreferred: string, weight: number) {
  return prisma.preferenceApplication.create({
    data: {
      deliberationId,
      preferredArgumentId: preferred,
      dispreferredArgumentId: dispreferred,
      weight,
      createdById: "test-user",
    },
  }).then(r => r.id);
}

function createMockConflict(preferences: any[]): any {
  return {
    type: "cycle",
    cycle: preferences.map(p => p.id),
    preferences: preferences.map(p => ({
      id: p.id,
      preferred: "argA",
      dispreferred: "argB",
      weight: p.weight ?? 1.0,
      createdAt: p.createdAt ?? new Date(),
      createdBy: p.createdBy ?? "user1",
      ...p,
    })),
    severity: "critical",
  };
}
```

---

### Day 2: API Endpoints (4-6 hours)

#### Task 2.1: Conflict Detection API (2 hours)

**File**: `app/api/aspic/conflicts/route.ts` (New)

```typescript
/**
 * Conflict detection API
 * GET: Detect conflicts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { detectConflicts, markConflictDetected } from "@/lib/aspic/conflicts/detection";
import { getResolutionHistory } from "@/lib/aspic/conflicts/resolution";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

const ConflictQuery = z.object({
  deliberationId: z.string().min(6),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = ConflictQuery.safeParse({
    deliberationId: url.searchParams.get("deliberationId"),
  });

  if (!query.success) {
    return NextResponse.json(
      { error: "Invalid query", details: query.error.issues },
      { status: 400, ...NO_STORE }
    );
  }

  const { deliberationId } = query.data;

  try {
    const conflicts = await detectConflicts(deliberationId);
    const history = await getResolutionHistory(deliberationId);

    // Mark newly detected conflicts
    const allPAIds = conflicts.flatMap(c => c.preferences.map(p => p.id));
    if (allPAIds.length > 0) {
      await markConflictDetected(allPAIds);
    }

    return NextResponse.json(
      {
        conflicts,
        total: conflicts.length,
        totalPreferencesAffected: allPAIds.length,
        history,
      },
      NO_STORE
    );
  } catch (error) {
    console.error("Conflict detection error:", error);
    return NextResponse.json(
      { error: "Failed to detect conflicts" },
      { status: 500, ...NO_STORE }
    );
  }
}
```

#### Task 2.2: Resolution Application API (2 hours)

**File**: `app/api/aspic/conflicts/resolve/route.ts` (New)

```typescript
/**
 * Conflict resolution API
 * POST: Apply resolution strategy
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { detectConflicts } from "@/lib/aspic/conflicts/detection";
import { suggestResolutionStrategies, applyResolution } from "@/lib/aspic/conflicts/resolution";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

const ResolveRequest = z.object({
  deliberationId: z.string().min(6),
  conflictIndex: z.number().int().min(0),
  strategyType: z.enum(["remove_weakest", "remove_oldest", "user_selection", "vote_based"]),
  manualPAIds: z.array(z.string()).optional(), // For user_selection
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, ...NO_STORE }
    );
  }

  const body = await req.json();
  const parsed = ResolveRequest.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400, ...NO_STORE }
    );
  }

  const { deliberationId, conflictIndex, strategyType, manualPAIds } = parsed.data;

  try {
    // Get conflicts
    const conflicts = await detectConflicts(deliberationId);

    if (conflictIndex >= conflicts.length) {
      return NextResponse.json(
        { error: "Conflict not found" },
        { status: 404, ...NO_STORE }
      );
    }

    const conflict = conflicts[conflictIndex];

    // Get strategies
    const strategies = suggestResolutionStrategies(conflict);
    let selectedStrategy = strategies.find(s => s.type === strategyType);

    if (!selectedStrategy) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 400, ...NO_STORE }
      );
    }

    // Handle manual selection
    if (strategyType === "user_selection" && manualPAIds && manualPAIds.length > 0) {
      selectedStrategy = {
        ...selectedStrategy,
        toRemove: manualPAIds,
      };
    }

    // Apply resolution
    const result = await applyResolution(
      selectedStrategy,
      session.user.id,
      deliberationId
    );

    return NextResponse.json(
      {
        success: true,
        removed: result.removed,
        remainingConflicts: result.newCycles,
        message: result.newCycles === 0 
          ? "All conflicts resolved!" 
          : `${result.newCycles} conflict(s) remaining`,
      },
      NO_STORE
    );
  } catch (error) {
    console.error("Resolution error:", error);
    return NextResponse.json(
      { error: "Failed to apply resolution" },
      { status: 500, ...NO_STORE }
    );
  }
}
```

#### Task 2.3: Undo Resolution API (1 hour)

**File**: `app/api/aspic/conflicts/undo/route.ts` (New)

```typescript
/**
 * Undo conflict resolution
 * POST: Restore resolved preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { undoResolution } from "@/lib/aspic/conflicts/resolution";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

const UndoRequest = z.object({
  paIds: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, ...NO_STORE }
    );
  }

  const body = await req.json();
  const parsed = UndoRequest.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400, ...NO_STORE }
    );
  }

  const { paIds } = parsed.data;

  try {
    const result = await undoResolution(paIds);

    return NextResponse.json(
      {
        success: true,
        restored: result.restored,
      },
      NO_STORE
    );
  } catch (error) {
    console.error("Undo resolution error:", error);
    return NextResponse.json(
      { error: "Failed to undo resolution" },
      { status: 500, ...NO_STORE }
    );
  }
}
```

#### Task 2.4: Integration Tests (1 hour)

**File**: `__tests__/api/conflicts.test.ts` (New)

```typescript
import { createTestDeliberation } from "../testHelpers";

describe("GET /api/aspic/conflicts", () => {
  test("returns empty array when no conflicts", async () => {
    const { deliberationId } = await createTestDeliberation();

    const response = await fetch(`/api/aspic/conflicts?deliberationId=${deliberationId}`);
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.conflicts).toEqual([]);
    expect(data.total).toBe(0);
  });

  test("detects and returns conflicts", async () => {
    const { deliberationId, argA, argB } = await createTestDeliberation();

    // Create cycle
    await createPA(deliberationId, argA, argB);
    await createPA(deliberationId, argB, argA);

    const response = await fetch(`/api/aspic/conflicts?deliberationId=${deliberationId}`);
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.conflicts).toHaveLength(1);
    expect(data.totalPreferencesAffected).toBe(2);
  });
});

describe("POST /api/aspic/conflicts/resolve", () => {
  test("resolves conflict with remove_weakest strategy", async () => {
    const { deliberationId, argA, argB, userId } = await createTestDeliberation();

    await createPA(deliberationId, argA, argB, 0.5);
    await createPA(deliberationId, argB, argA, 1.0);

    const response = await fetch("/api/aspic/conflicts/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliberationId,
        conflictIndex: 0,
        strategyType: "remove_weakest",
      }),
    });

    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
    expect(data.removed).toBe(1);
    expect(data.remainingConflicts).toBe(0);
  });

  test("401 when not authenticated", async () => {
    const response = await fetch("/api/aspic/conflicts/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliberationId: "test" }),
    });

    expect(response.status).toBe(401);
  });
});
```

---

### Day 3: UI Components (6-8 hours)

#### Task 3.1: ConflictResolutionPanel Component (4 hours)

**File**: `components/aspic/ConflictResolutionPanel.tsx` (New, ~350 lines)

```tsx
/**
 * Conflict resolution panel
 * Visualizes preference cycles and provides resolution UI
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  RotateCcw,
  Loader2 
} from "lucide-react";
import { toast } from "sonner";

interface PreferenceInCycle {
  id: string;
  preferred: string;
  dispreferred: string;
  weight: number;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  justification?: string;
}

interface Conflict {
  type: "cycle";
  cycle: string[];
  cycleDisplay: string;
  preferences: PreferenceInCycle[];
  severity: "critical";
}

interface Strategy {
  type: string;
  label: string;
  description: string;
  toRemove: string[];
  recommendation?: "recommended" | "neutral" | "not_recommended";
}

interface ConflictResolutionPanelProps {
  deliberationId: string;
  onResolved?: () => void;
  className?: string;
}

export function ConflictResolutionPanel({
  deliberationId,
  onResolved,
  className,
}: ConflictResolutionPanelProps) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [strategies, setStrategies] = useState<Map<number, Strategy[]>>(new Map());
  const [selectedStrategy, setSelectedStrategy] = useState<Map<number, string>>(new Map());
  const [manualSelections, setManualSelections] = useState<Map<number, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConflicts();
  }, [deliberationId]);

  async function fetchConflicts() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/aspic/conflicts?deliberationId=${deliberationId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch conflicts");
      }

      const data = await response.json();
      setConflicts(data.conflicts || []);

      // Fetch strategies for each conflict
      const newStrategies = new Map<number, Strategy[]>();
      for (let i = 0; i < data.conflicts.length; i++) {
        newStrategies.set(i, await fetchStrategies(data.conflicts[i]));
      }
      setStrategies(newStrategies);
    } catch (err) {
      console.error("Failed to fetch conflicts:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStrategies(conflict: Conflict): Promise<Strategy[]> {
    // Client-side strategy generation (same logic as server)
    // For now, return mock strategies
    return [
      {
        type: "remove_weakest",
        label: "Remove Weakest Preference",
        description: "Remove preference with lowest confidence",
        toRemove: [conflict.preferences[0].id],
        recommendation: "recommended",
      },
      {
        type: "remove_oldest",
        label: "Keep Most Recent",
        description: "Remove oldest preference",
        toRemove: [conflict.preferences[0].id],
      },
      {
        type: "user_selection",
        label: "Manual Selection",
        description: "Choose which preference(s) to remove",
        toRemove: [],
      },
    ];
  }

  async function handleResolve(conflictIndex: number) {
    const strategy = selectedStrategy.get(conflictIndex);
    
    if (!strategy) {
      toast.error("Please select a resolution strategy");
      return;
    }

    setResolving(conflictIndex);

    try {
      let manualPAIds: string[] | undefined;
      
      if (strategy === "user_selection") {
        const selections = manualSelections.get(conflictIndex);
        if (!selections || selections.size === 0) {
          toast.error("Please select at least one preference to remove");
          return;
        }
        manualPAIds = Array.from(selections);
      }

      const response = await fetch("/api/aspic/conflicts/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliberationId,
          conflictIndex,
          strategyType: strategy,
          manualPAIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to resolve conflict");
      }

      const data = await response.json();

      if (data.remainingConflicts === 0) {
        toast.success("All conflicts resolved!");
      } else {
        toast.success(`Conflict resolved. ${data.remainingConflicts} remaining.`);
      }

      await fetchConflicts();
      onResolved?.();
    } catch (err) {
      console.error("Resolution error:", err);
      toast.error("Failed to resolve conflict");
    } finally {
      setResolving(null);
    }
  }

  function toggleManualSelection(conflictIndex: number, paId: string) {
    setManualSelections(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(conflictIndex) ?? new Set();
      
      if (current.has(paId)) {
        current.delete(paId);
      } else {
        current.add(paId);
      }
      
      newMap.set(conflictIndex, current);
      return newMap;
    });
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking for conflicts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load conflicts: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (conflicts.length === 0) {
    return (
      <Alert className={className}>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          ✅ No preference conflicts detected. All preferences are consistent.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>{conflicts.length} conflict{conflicts.length > 1 ? "s" : ""} detected!</strong>
          <p className="text-sm mt-1">
            Circular preferences violate rationality constraints and must be resolved before evaluation.
          </p>
        </AlertDescription>
      </Alert>

      {conflicts.map((conflict, index) => {
        const conflictStrategies = strategies.get(index) ?? [];
        const selected = selectedStrategy.get(index);
        const manuallySelected = manualSelections.get(index) ?? new Set();

        return (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="destructive">Cycle</Badge>
                Conflict #{index + 1}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 flex-wrap">
                <span className="font-mono text-sm">
                  {conflict.cycleDisplay}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preferences in cycle */}
              <div>
                <div className="text-sm font-medium mb-2">Involved Preferences:</div>
                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {conflict.preferences.map(pref => (
                      <div 
                        key={pref.id} 
                        className="flex items-start justify-between p-3 border rounded text-sm hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {pref.preferred} <ArrowRight className="inline h-3 w-3" /> {pref.dispreferred}
                          </div>
                          {pref.justification && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {pref.justification}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-4">
                          <Badge variant="secondary">
                            Weight: {pref.weight.toFixed(2)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(pref.createdAt).toLocaleDateString()}
                          </span>
                          {pref.createdByName && (
                            <span className="text-xs text-muted-foreground">
                              by {pref.createdByName}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {/* Resolution strategies */}
              <div>
                <div className="text-sm font-medium mb-3">Resolution Strategy:</div>
                <RadioGroup
                  value={selected}
                  onValueChange={(value) => 
                    setSelectedStrategy(prev => new Map(prev).set(index, value))
                  }
                >
                  {conflictStrategies.map(strategy => (
                    <div key={strategy.type} className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem 
                          value={strategy.type} 
                          id={`${index}-${strategy.type}`} 
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={`${index}-${strategy.type}`}
                            className="flex items-center gap-2"
                          >
                            <span>{strategy.label}</span>
                            {strategy.recommendation === "recommended" && (
                              <Badge variant="outline" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {strategy.description}
                          </p>
                        </div>
                      </div>

                      {/* Manual selection UI */}
                      {strategy.type === "user_selection" && selected === "user_selection" && (
                        <div className="ml-6 mt-2 space-y-2 p-3 border rounded">
                          <div className="text-xs font-medium">Select preferences to remove:</div>
                          {conflict.preferences.map(pref => (
                            <div key={pref.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`${index}-manual-${pref.id}`}
                                checked={manuallySelected.has(pref.id)}
                                onChange={() => toggleManualSelection(index, pref.id)}
                              />
                              <label 
                                htmlFor={`${index}-manual-${pref.id}`}
                                className="text-xs cursor-pointer"
                              >
                                {pref.preferred} → {pref.dispreferred} (weight: {pref.weight.toFixed(2)})
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button
                onClick={() => handleResolve(index)}
                disabled={!selected || resolving === index}
                className="w-full"
              >
                {resolving === index ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  "Resolve Conflict"
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

#### Task 3.2: Integration into Deliberation Page (1 hour)

**File**: `app/(app)/deliberations/[id]/page.tsx` (Modify existing)

```tsx
// Add import
import { ConflictResolutionPanel } from "@/components/aspic/ConflictResolutionPanel";

// Add state
const [showConflicts, setShowConflicts] = useState(false);

// Add button to trigger conflict check (in deliberation controls area)
<Button 
  variant="outline" 
  onClick={() => setShowConflicts(!showConflicts)}
>
  <AlertTriangle className="mr-2 h-4 w-4" />
  Check Conflicts
</Button>

// Add panel (conditionally rendered)
{showConflicts && (
  <ConflictResolutionPanel
    deliberationId={deliberation.id}
    onResolved={() => {
      // Optionally refresh evaluation or show success
      toast.success("Conflicts resolved - evaluation can proceed");
    }}
    className="mb-6"
  />
)}
```

#### Task 3.3: Visual Testing & Polish (2 hours)

- Test with various cycle types (2-cycle, 3-cycle, complex)
- Test all resolution strategies
- Test manual selection UI
- Ensure mobile responsiveness
- Add loading states and error handling
- Polish animations and transitions

---

### Day 4: Testing & Documentation (4-6 hours)

#### Task 4.1: End-to-End Tests (3 hours)

**File**: `__tests__/e2e/conflict-resolution.test.ts` (New)

```typescript
/**
 * E2E tests for conflict resolution flow
 * Uses Playwright or similar
 */

describe("Conflict Resolution Flow", () => {
  test("full resolution workflow", async () => {
    // 1. Create deliberation
    // 2. Create 2 arguments
    // 3. Create circular preferences
    // 4. Navigate to deliberation page
    // 5. Click "Check Conflicts"
    // 6. Verify conflict panel appears
    // 7. Select resolution strategy
    // 8. Click "Resolve Conflict"
    // 9. Verify success message
    // 10. Verify conflict panel shows "No conflicts"
  });

  test("manual selection strategy", async () => {
    // Test user selecting specific preferences to remove
  });

  test("undo resolution", async () => {
    // Test restoring resolved preferences
  });
});
```

#### Task 4.2: Documentation (2 hours)

**File**: `docs/CONFLICT_RESOLUTION_USER_GUIDE.md` (New)

```markdown
# Conflict Resolution User Guide

## What are Preference Conflicts?

Circular preferences (e.g., A > B > C > A) violate logical consistency and prevent evaluation...

## How to Detect Conflicts

1. Navigate to your deliberation
2. Click "Check Conflicts" button
3. View conflict panel

## Resolution Strategies

### Remove Weakest Preference (Recommended)
- Removes preference with lowest confidence score
- Best when preferences have different weights

### Keep Most Recent
- Removes oldest preference
- Best when preferences evolved over time

### Manual Selection
- Choose exactly which preferences to remove
- Best when you know which preference is wrong

## Undoing Resolutions

(Coming soon)
```

#### Task 4.3: Code Review Prep (1 hour)

- Run full test suite
- Run linter: `npm run lint`
- Check Prisma migrations
- Verify no regressions
- Update CHANGELOG.md

---

## Success Criteria

### Feature Complete When:

- ✅ Schema changes deployed (`conflictStatus` fields added)
- ✅ Cycle detection enhanced with metadata enrichment
- ✅ Resolution strategies implemented and tested
- ✅ API endpoints functional (GET conflicts, POST resolve, POST undo)
- ✅ ConflictResolutionPanel component renders correctly
- ✅ Integration with deliberation page complete
- ✅ Unit tests pass (>80% coverage)
- ✅ Integration tests pass
- ✅ Manual testing confirms UX flow works
- ✅ Documentation complete

### Acceptance Checklist:

- [ ] Detects all cycle types (2-cycle, 3-cycle, N-cycle)
- [ ] Suggests 3+ resolution strategies per conflict
- [ ] Remove weakest strategy correctly identifies lowest weight
- [ ] Remove oldest strategy correctly identifies earliest date
- [ ] Manual selection allows user choice
- [ ] Vote-based strategy works with multiple users
- [ ] Soft delete preserves data (conflictStatus flag)
- [ ] Re-evaluation after resolution succeeds
- [ ] UI shows clear cycle visualization
- [ ] UI prevents resolution without strategy selection
- [ ] API returns proper error codes
- [ ] Lint checks pass
- [ ] No performance regressions

---

## Risk Mitigation

### Risk: Resolution Creates New Conflicts
**Impact**: High  
**Mitigation**:
- Re-run detectConflicts() after each resolution
- Show remaining conflicts count in response
- Prevent infinite resolution loops (max 10 iterations)

### Risk: Accidental Data Loss
**Impact**: High  
**Mitigation**:
- Soft delete only (conflictStatus flag)
- Store resolution metadata for audit trail
- Implement undo functionality (Day 4 stretch goal)

### Risk: Poor UX with Large Cycles
**Impact**: Medium  
**Mitigation**:
- Collapse long preference lists (show first 5)
- Add search/filter for manual selection
- Paginate if >20 conflicts detected

### Risk: Performance with Many Conflicts
**Impact**: Low  
**Mitigation**:
- Batch conflict detection
- Cache results (invalidate on PA change)
- Limit to 100 conflicts per request

---

## Future Enhancements (Post-MVP)

### Phase 2: Advanced Features
- Graph visualization (D3.js cycle diagrams)
- Bulk resolution (resolve all with one strategy)
- Conflict prevention (warn before creating cycle)
- Conflict history timeline
- Export conflict report (PDF/CSV)

### Phase 3: Collaborative Resolution
- Multi-user voting on resolution strategy
- Discussion threads on conflicts
- Moderator override permissions
- Automated resolution rules (configurable)

---

## Implementation Order

**Recommended sequence**:
1. ✅ Day 1: Core logic (detection + resolution modules)
2. ✅ Day 2: API layer (GET conflicts, POST resolve)
3. ✅ Day 3: UI components (ConflictResolutionPanel)
4. ✅ Day 4: Testing + Documentation

**Critical path**:
- Schema changes must be deployed first
- Detection logic must work before resolution
- API must be complete before UI integration
- UI can iterate independently once API is stable

---

## Code Locations Reference

### New Files Created:
- `lib/aspic/conflicts/detection.ts` (~200 lines)
- `lib/aspic/conflicts/resolution.ts` (~250 lines)
- `app/api/aspic/conflicts/route.ts` (~100 lines)
- `app/api/aspic/conflicts/resolve/route.ts` (~120 lines)
- `app/api/aspic/conflicts/undo/route.ts` (~60 lines)
- `components/aspic/ConflictResolutionPanel.tsx` (~350 lines)
- `__tests__/aspic/conflicts/resolution.test.ts` (~200 lines)
- `__tests__/api/conflicts.test.ts` (~100 lines)

### Modified Files:
- `prisma/schema.prisma` (add conflictStatus fields)
- `app/(app)/deliberations/[id]/page.tsx` (integrate ConflictResolutionPanel)

### Dependencies on Existing Code:
- `lib/aspic/translation/aifToASPIC.ts` → `detectPreferenceCycles()` (no changes)
- `lib/prismaclient.ts` (Prisma client)
- `components/ui/*` (shadcn components)
- `app/api/auth/[...nextauth]/route.ts` (auth for APIs)

---

## Conclusion

This implementation plan provides a **standalone, production-ready conflict resolution system** that:

1. ✅ Leverages existing cycle detection from Phase 4
2. ✅ Adds minimal schema changes (3 fields)
3. ✅ Uses soft deletes for safety
4. ✅ Provides clear UX for non-technical users
5. ✅ Can be implemented in 3-4 focused days
6. ✅ Independent of weighted preferences/schemes features

**Total LOC**: ~1,400 lines (logic + API + UI + tests)  
**Total Time**: 3-4 days (20-28 hours)  
**Complexity**: 🟡 Medium  
**Priority**: 🔴 P1 Critical

Ready to implement! 🚀
