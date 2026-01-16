# Phase 5.3: Collaboration Matching (Part 2)

**Sub-Phase:** 5.3 of 5.3  
**Focus:** API Routes, React Query Hooks & UI Components

---

## Implementation Steps (Continued)

### Step 5.3.6: Collaboration API Routes

**File:** `app/api/collaboration/matches/route.ts`

```typescript
/**
 * Collaboration matches API
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getMatchesForUser,
  generateMatchesForUser,
} from "@/lib/collaboration/matchService";
import { MatchType } from "@/lib/collaboration/types";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status")?.split(",");
    const type = searchParams.get("type")?.split(",") as MatchType[] | undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    const matches = await getMatchesForUser(session.user.id, {
      status,
      type,
      limit,
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
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

    // Generate new matches
    const newMatchIds = await generateMatchesForUser(session.user.id);

    return NextResponse.json({
      generated: newMatchIds.length,
      matchIds: newMatchIds,
    });
  } catch (error) {
    console.error("Error generating matches:", error);
    return NextResponse.json(
      { error: "Failed to generate matches" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/collaboration/matches/[matchId]/route.ts`

```typescript
/**
 * Single match API
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getMatchDetails,
  updateMatchStatus,
} from "@/lib/collaboration/matchService";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const match = await getMatchDetails(params.matchId);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Mark as viewed
    await updateMatchStatus(params.matchId, session.user.id, "VIEWED");

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}

const UpdateStatusSchema = z.object({
  status: z.enum(["SAVED", "DISMISSED", "CONTACTED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = UpdateStatusSchema.parse(body);

    await updateMatchStatus(params.matchId, session.user.id, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/collaboration/profile/route.ts`

```typescript
/**
 * User attack profile API
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAttackProfile,
  calculateAttackProfile,
} from "@/lib/collaboration/attackProfileService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || session.user.id;

    let profile = await getAttackProfile(userId);

    // Calculate if not exists
    if (!profile && userId === session.user.id) {
      profile = await calculateAttackProfile(userId);
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
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

    // Recalculate profile
    const profile = await calculateAttackProfile(session.user.id);

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error calculating profile:", error);
    return NextResponse.json(
      { error: "Failed to calculate profile" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/collaboration/interests/route.ts`

```typescript
/**
 * Research interests API
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CreateInterestSchema = z.object({
  fieldId: z.string(),
  level: z.enum(["PRIMARY", "INTERESTED", "EXPLORING"]).default("INTERESTED"),
  keywords: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interests = await prisma.researchInterest.findMany({
      where: { userId: session.user.id },
      include: {
        field: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      interests.map((i) => ({
        id: i.id,
        fieldId: i.fieldId,
        fieldName: i.field.name,
        level: i.level,
        keywords: i.keywords,
        topics: i.topics,
      }))
    );
  } catch (error) {
    console.error("Error fetching interests:", error);
    return NextResponse.json(
      { error: "Failed to fetch interests" },
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
    const input = CreateInterestSchema.parse(body);

    const interest = await prisma.researchInterest.upsert({
      where: {
        userId_fieldId: {
          userId: session.user.id,
          fieldId: input.fieldId,
        },
      },
      update: {
        level: input.level,
        keywords: input.keywords || [],
        topics: input.topics || [],
      },
      create: {
        userId: session.user.id,
        fieldId: input.fieldId,
        level: input.level,
        keywords: input.keywords || [],
        topics: input.topics || [],
      },
      include: {
        field: { select: { name: true } },
      },
    });

    return NextResponse.json({
      id: interest.id,
      fieldId: interest.fieldId,
      fieldName: interest.field.name,
      level: interest.level,
    });
  } catch (error) {
    console.error("Error creating interest:", error);
    return NextResponse.json(
      { error: "Failed to create interest" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/collaboration/config/route.ts`

```typescript
/**
 * Match configuration API
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UpdateConfigSchema = z.object({
  enableMatching: z.boolean().optional(),
  enableNotifications: z.boolean().optional(),
  preferredMatchTypes: z.array(z.string()).optional(),
  excludedFieldIds: z.array(z.string()).optional(),
  minScore: z.number().min(0).max(1).optional(),
  maxMatchesPerWeek: z.number().min(0).max(50).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await prisma.matchConfiguration.findUnique({
      where: { userId: session.user.id },
    });

    // Return defaults if not configured
    return NextResponse.json(
      config || {
        enableMatching: true,
        enableNotifications: true,
        preferredMatchTypes: [
          "SIMILAR_CLAIMS",
          "COMPLEMENTARY_ATTACKS",
          "SHARED_INTERESTS",
        ],
        excludedFieldIds: [],
        minScore: 0.5,
        maxMatchesPerWeek: 10,
      }
    );
  } catch (error) {
    console.error("Error fetching config:", error);
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updates = UpdateConfigSchema.parse(body);

    const config = await prisma.matchConfiguration.upsert({
      where: { userId: session.user.id },
      update: {
        ...updates,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        enableMatching: updates.enableMatching ?? true,
        enableNotifications: updates.enableNotifications ?? true,
        preferredMatchTypes: (updates.preferredMatchTypes as any) || [
          "SIMILAR_CLAIMS",
          "COMPLEMENTARY_ATTACKS",
          "SHARED_INTERESTS",
        ],
        excludedFieldIds: updates.excludedFieldIds || [],
        minScore: updates.minScore ?? 0.5,
        maxMatchesPerWeek: updates.maxMatchesPerWeek ?? 10,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}
```

---

### Step 5.3.7: React Query Hooks

**File:** `lib/collaboration/hooks.ts`

```typescript
/**
 * React Query hooks for collaboration matching
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MatchSummary,
  CollaborationMatchData,
  UserAttackProfileData,
  ResearchInterestData,
  MatchConfigurationData,
  MatchType,
} from "./types";

// ============================================================
// Query Keys
// ============================================================

export const collaborationKeys = {
  all: ["collaboration"] as const,
  matches: () => [...collaborationKeys.all, "matches"] as const,
  matchesByStatus: (status: string[]) =>
    [...collaborationKeys.matches(), { status }] as const,
  matchDetail: (id: string) => [...collaborationKeys.matches(), id] as const,
  profile: () => [...collaborationKeys.all, "profile"] as const,
  profileForUser: (userId: string) =>
    [...collaborationKeys.profile(), userId] as const,
  interests: () => [...collaborationKeys.all, "interests"] as const,
  config: () => [...collaborationKeys.all, "config"] as const,
};

// ============================================================
// Match Hooks
// ============================================================

export function useMatches(options?: { status?: string[]; type?: MatchType[] }) {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status.join(","));
  if (options?.type) params.set("type", options.type.join(","));

  return useQuery({
    queryKey: collaborationKeys.matchesByStatus(options?.status || []),
    queryFn: async (): Promise<MatchSummary[]> => {
      const res = await fetch(`/api/collaboration/matches?${params}`);
      if (!res.ok) throw new Error("Failed to fetch matches");
      return res.json();
    },
  });
}

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: collaborationKeys.matchDetail(matchId),
    queryFn: async (): Promise<CollaborationMatchData> => {
      const res = await fetch(`/api/collaboration/matches/${matchId}`);
      if (!res.ok) throw new Error("Failed to fetch match");
      return res.json();
    },
    enabled: !!matchId,
  });
}

export function useGenerateMatches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/collaboration/matches", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate matches");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.matches() });
    },
  });
}

export function useUpdateMatchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      status,
    }: {
      matchId: string;
      status: "SAVED" | "DISMISSED" | "CONTACTED";
    }) => {
      const res = await fetch(`/api/collaboration/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update match");
      return res.json();
    },
    onSuccess: (_, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.matches() });
      queryClient.invalidateQueries({
        queryKey: collaborationKeys.matchDetail(matchId),
      });
    },
  });
}

// ============================================================
// Profile Hooks
// ============================================================

export function useAttackProfile(userId?: string) {
  return useQuery({
    queryKey: collaborationKeys.profileForUser(userId || "me"),
    queryFn: async (): Promise<UserAttackProfileData> => {
      const url = userId
        ? `/api/collaboration/profile?userId=${userId}`
        : "/api/collaboration/profile";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });
}

export function useRecalculateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/collaboration/profile", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to recalculate profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.profile() });
    },
  });
}

// ============================================================
// Interest Hooks
// ============================================================

export function useResearchInterests() {
  return useQuery({
    queryKey: collaborationKeys.interests(),
    queryFn: async (): Promise<ResearchInterestData[]> => {
      const res = await fetch("/api/collaboration/interests");
      if (!res.ok) throw new Error("Failed to fetch interests");
      return res.json();
    },
  });
}

export function useAddInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      fieldId: string;
      level?: string;
      keywords?: string[];
      topics?: string[];
    }) => {
      const res = await fetch("/api/collaboration/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add interest");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collaborationKeys.interests(),
      });
    },
  });
}

// ============================================================
// Configuration Hooks
// ============================================================

export function useMatchConfig() {
  return useQuery({
    queryKey: collaborationKeys.config(),
    queryFn: async (): Promise<MatchConfigurationData> => {
      const res = await fetch("/api/collaboration/config");
      if (!res.ok) throw new Error("Failed to fetch config");
      return res.json();
    },
  });
}

export function useUpdateMatchConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<MatchConfigurationData>) => {
      const res = await fetch("/api/collaboration/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.config() });
    },
  });
}
```

---

### Step 5.3.8: Collaboration Dashboard Component

**File:** `components/collaboration/CollaborationDashboard.tsx`

```tsx
/**
 * Main collaboration matching dashboard
 */

"use client";

import { useState } from "react";
import {
  useMatches,
  useGenerateMatches,
  useUpdateMatchStatus,
} from "@/lib/collaboration/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Users,
  Bookmark,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { MatchCard } from "./MatchCard";
import { AttackProfileCard } from "./AttackProfileCard";
import { ResearchInterestsCard } from "./ResearchInterestsCard";
import { MatchType, MATCH_TYPE_INFO } from "@/lib/collaboration/types";

export function CollaborationDashboard() {
  const [activeTab, setActiveTab] = useState("suggested");

  const { data: suggestedMatches, isLoading: loadingSuggested } = useMatches({
    status: ["SUGGESTED", "VIEWED"],
  });
  const { data: savedMatches, isLoading: loadingSaved } = useMatches({
    status: ["SAVED"],
  });

  const { mutate: generateMatches, isPending: isGenerating } =
    useGenerateMatches();
  const { mutate: updateStatus } = useUpdateMatchStatus();

  const handleSave = (matchId: string) => {
    updateStatus({ matchId, status: "SAVED" });
  };

  const handleDismiss = (matchId: string) => {
    updateStatus({ matchId, status: "DISMISSED" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7" />
            Collaboration Matching
          </h1>
          <p className="text-gray-600 mt-1">
            Find researchers with complementary expertise and similar interests
          </p>
        </div>
        <Button onClick={() => generateMatches()} disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Find New Matches
        </Button>
      </div>

      {/* Profile Cards */}
      <div className="grid grid-cols-2 gap-6">
        <AttackProfileCard />
        <ResearchInterestsCard />
      </div>

      {/* Matches Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="suggested" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Suggested ({suggestedMatches?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Bookmark className="w-4 h-4" />
            Saved ({savedMatches?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggested" className="mt-4">
          {loadingSuggested ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : suggestedMatches && suggestedMatches.length > 0 ? (
            <div className="grid gap-4">
              {suggestedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onSave={() => handleSave(match.id)}
                  onDismiss={() => handleDismiss(match.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No suggestions yet"
              description="Click 'Find New Matches' to discover potential collaborators based on your research patterns."
              icon={<Sparkles className="w-12 h-12 text-gray-300" />}
            />
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          {loadingSaved ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : savedMatches && savedMatches.length > 0 ? (
            <div className="grid gap-4">
              {savedMatches.map((match) => (
                <MatchCard key={match.id} match={match} showActions={false} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No saved matches"
              description="Save interesting matches to review them later."
              icon={<Bookmark className="w-12 h-12 text-gray-300" />}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-gray-600 mt-1 max-w-md mx-auto">{description}</p>
    </div>
  );
}
```

---

### Step 5.3.9: Match Card Component

**File:** `components/collaboration/MatchCard.tsx`

```tsx
/**
 * Card displaying a collaboration match
 */

"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bookmark,
  X,
  MessageCircle,
  ChevronRight,
  Star,
} from "lucide-react";
import { MatchSummary, MATCH_TYPE_INFO } from "@/lib/collaboration/types";
import { formatDistanceToNow } from "date-fns";

interface MatchCardProps {
  match: MatchSummary;
  onSave?: () => void;
  onDismiss?: () => void;
  showActions?: boolean;
}

export function MatchCard({
  match,
  onSave,
  onDismiss,
  showActions = true,
}: MatchCardProps) {
  const typeInfo = MATCH_TYPE_INFO[match.matchType];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={match.matchedUser.image || undefined} />
            <AvatarFallback>
              {match.matchedUser.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/users/${match.matchedUser.id}`}
                className="font-semibold text-gray-900 hover:underline truncate"
              >
                {match.matchedUser.name || "Unknown User"}
              </Link>
              <ScoreBadge score={match.score} />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                <span className="mr-1">{typeInfo.icon}</span>
                {typeInfo.title}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(match.generatedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {match.topReason}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {showActions && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDismiss}
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSave}
                  title="Save"
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </>
            )}
            <Link href={`/collaboration/matches/${match.id}`}>
              <Button variant="ghost" size="icon">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  let color = "bg-gray-100 text-gray-700";

  if (percentage >= 80) {
    color = "bg-green-100 text-green-700";
  } else if (percentage >= 60) {
    color = "bg-blue-100 text-blue-700";
  } else if (percentage >= 40) {
    color = "bg-yellow-100 text-yellow-700";
  }

  return (
    <Badge className={`${color} text-xs`}>
      <Star className="w-3 h-3 mr-1" />
      {percentage}% match
    </Badge>
  );
}
```

---

### Step 5.3.10: Attack Profile Card Component

**File:** `components/collaboration/AttackProfileCard.tsx`

```tsx
/**
 * Card showing user's attack style profile
 */

"use client";

import {
  useAttackProfile,
  useRecalculateProfile,
} from "@/lib/collaboration/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Loader2, Sword, Target } from "lucide-react";
import { ATTACK_TYPE_LABELS, AttackTypeCategory } from "@/lib/collaboration/types";

export function AttackProfileCard() {
  const { data: profile, isLoading } = useAttackProfile();
  const { mutate: recalculate, isPending: isRecalculating } =
    useRecalculateProfile();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!profile || profile.totalAttacks === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sword className="w-5 h-5" />
            Attack Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">
            Make some attacks to build your profile!
          </p>
        </CardContent>
      </Card>
    );
  }

  const attackTypes: AttackTypeCategory[] = [
    "EMPIRICAL",
    "CONCEPTUAL",
    "METHODOLOGICAL",
    "NORMATIVE",
    "LOGICAL",
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sword className="w-5 h-5" />
            Attack Profile
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => recalculate()}
            disabled={isRecalculating}
          >
            {isRecalculating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary style */}
        {profile.primaryAttackType && (
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">Primary style:</span>
            <Badge variant="default">
              {profile.primaryAttackType.toLowerCase()}
            </Badge>
          </div>
        )}

        {/* Attack type breakdown */}
        <div className="space-y-2">
          {attackTypes.map((type) => {
            const count =
              profile.attackCounts[type.toLowerCase() as keyof typeof profile.attackCounts];
            const percentage =
              profile.totalAttacks > 0
                ? Math.round((count / profile.totalAttacks) * 100)
                : 0;

            return (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 capitalize">
                    {type.toLowerCase()}
                  </span>
                  <span className="text-gray-500">
                    {count} ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-1.5" />
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-gray-500">Total attacks: {profile.totalAttacks}</span>
          <span className="text-gray-500">
            Diversity: {Math.round(profile.attackDiversity * 100)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Step 5.3.11: Research Interests Card Component

**File:** `components/collaboration/ResearchInterestsCard.tsx`

```tsx
/**
 * Card for managing research interests
 */

"use client";

import { useState } from "react";
import { useResearchInterests, useAddInterest } from "@/lib/collaboration/hooks";
import { useFields } from "@/lib/crossfield/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, BookOpen, Loader2, Star, Eye, Compass } from "lucide-react";

export function ResearchInterestsCard() {
  const { data: interests, isLoading } = useResearchInterests();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const levelIcons = {
    PRIMARY: <Star className="w-3 h-3 text-amber-500" />,
    INTERESTED: <Eye className="w-3 h-3 text-blue-500" />,
    EXPLORING: <Compass className="w-3 h-3 text-green-500" />,
  };

  const levelColors = {
    PRIMARY: "bg-amber-100 text-amber-700",
    INTERESTED: "bg-blue-100 text-blue-700",
    EXPLORING: "bg-green-100 text-green-700",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Research Interests
          </CardTitle>
          <AddInterestDialog />
        </div>
      </CardHeader>
      <CardContent>
        {interests && interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge
                key={interest.id}
                variant="outline"
                className={`${levelColors[interest.level as keyof typeof levelColors]} gap-1`}
              >
                {levelIcons[interest.level as keyof typeof levelIcons]}
                {interest.fieldName}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Add research interests to improve matching!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AddInterestDialog() {
  const [open, setOpen] = useState(false);
  const [fieldId, setFieldId] = useState("");
  const [level, setLevel] = useState("INTERESTED");

  const { data: fields } = useFields();
  const { mutate: addInterest, isPending } = useAddInterest();

  const handleSubmit = () => {
    addInterest(
      { fieldId, level },
      {
        onSuccess: () => {
          setOpen(false);
          setFieldId("");
          setLevel("INTERESTED");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Research Interest</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Academic Field</label>
            <Select value={fieldId} onValueChange={setFieldId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent>
                {fields?.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Interest Level</label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIMARY">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Primary - My main research area
                  </span>
                </SelectItem>
                <SelectItem value="INTERESTED">
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    Interested - Active interest
                  </span>
                </SelectItem>
                <SelectItem value="EXPLORING">
                  <span className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-green-500" />
                    Exploring - Learning about it
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!fieldId || isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Interest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 5.3.12: Match Detail Page Component

**File:** `components/collaboration/MatchDetailPage.tsx`

```tsx
/**
 * Full match detail view
 */

"use client";

import Link from "next/link";
import { useMatch, useUpdateMatchStatus } from "@/lib/collaboration/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Bookmark,
  MessageCircle,
  X,
  Star,
  CheckCircle2,
} from "lucide-react";
import { MATCH_TYPE_INFO } from "@/lib/collaboration/types";

interface MatchDetailPageProps {
  matchId: string;
}

export function MatchDetailPage({ matchId }: MatchDetailPageProps) {
  const { data: match, isLoading } = useMatch(matchId);
  const { mutate: updateStatus, isPending } = useUpdateMatchStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12 text-gray-500">Match not found</div>
    );
  }

  const typeInfo = MATCH_TYPE_INFO[match.matchType];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/collaboration"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to matches
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={match.matchedUser.image || undefined} />
              <AvatarFallback className="text-xl">
                {match.matchedUser.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {match.matchedUser.name || "Unknown User"}
              </h1>

              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline">
                  <span className="mr-1">{typeInfo.icon}</span>
                  {typeInfo.title}
                </Badge>
                <Badge
                  className={`${
                    match.score >= 0.8
                      ? "bg-green-100 text-green-700"
                      : match.score >= 0.6
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  <Star className="w-3 h-3 mr-1" />
                  {Math.round(match.score * 100)}% match
                </Badge>
              </div>

              {match.matchedUser.institution && (
                <p className="text-gray-600 mt-2">
                  {match.matchedUser.institution}
                  {match.matchedUser.department &&
                    ` • ${match.matchedUser.department}`}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {match.status === "SAVED" ? (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Saved
                </Badge>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateStatus({ matchId: match.id, status: "DISMISSED" })
                    }
                    disabled={isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Dismiss
                  </Button>
                  <Button
                    onClick={() =>
                      updateStatus({ matchId: match.id, status: "SAVED" })
                    }
                    disabled={isPending}
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why this match */}
      <Card>
        <CardHeader>
          <CardTitle>Why This Match?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {match.reasons.map((reason) => (
            <div
              key={reason.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div
                className="w-2 h-2 rounded-full mt-2"
                style={{
                  backgroundColor: `hsl(${reason.weight * 120}, 70%, 50%)`,
                }}
              />
              <div>
                <h4 className="font-medium">{reason.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {reason.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Shared fields */}
      {match.sharedFieldIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Shared Research Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {match.sharedFieldIds.map((fieldId, i) => (
                <Badge key={fieldId} variant="outline">
                  Field {i + 1}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Ready to collaborate?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Start a conversation with this researcher
              </p>
            </div>
            <Button
              onClick={() =>
                updateStatus({ matchId: match.id, status: "CONTACTED" })
              }
              disabled={isPending}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 5.3 Complete Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| **Part 1** | | | |
| 1 | Prisma schema | `prisma/schema.prisma` | ✅ |
| 2 | TypeScript types | `lib/collaboration/types.ts` | ✅ |
| 3 | Attack profile service | `lib/collaboration/attackProfileService.ts` | ✅ |
| 4 | Claim similarity service | `lib/collaboration/claimSimilarityService.ts` | ✅ |
| 5 | Match generation service | `lib/collaboration/matchService.ts` | ✅ |
| **Part 2** | | | |
| 6 | Matches API | `app/api/collaboration/matches/route.ts` | ✅ |
| 7 | Single match API | `app/api/collaboration/matches/[matchId]/route.ts` | ✅ |
| 8 | Profile API | `app/api/collaboration/profile/route.ts` | ✅ |
| 9 | Interests API | `app/api/collaboration/interests/route.ts` | ✅ |
| 10 | Config API | `app/api/collaboration/config/route.ts` | ✅ |
| 11 | React Query hooks | `lib/collaboration/hooks.ts` | ✅ |
| 12 | CollaborationDashboard | `components/collaboration/CollaborationDashboard.tsx` | ✅ |
| 13 | MatchCard | `components/collaboration/MatchCard.tsx` | ✅ |
| 14 | AttackProfileCard | `components/collaboration/AttackProfileCard.tsx` | ✅ |
| 15 | ResearchInterestsCard | `components/collaboration/ResearchInterestsCard.tsx` | ✅ |
| 16 | MatchDetailPage | `components/collaboration/MatchDetailPage.tsx` | ✅ |

---

## Phase 5 Complete Summary

**Phase 5: Interdisciplinary Bridge** is now fully documented across all sub-phases:

| Sub-Phase | Title | Parts | Status |
|-----------|-------|-------|--------|
| 5.1 | Cross-Field Claim Mapping | 3 | ✅ Complete |
| 5.2 | Translation Deliberations | 3 | ✅ Complete |
| 5.3 | Collaboration Matching | 2 | ✅ Complete |

### Key Capabilities Delivered

1. **Academic Field Taxonomy** - Hierarchical organization with epistemic styles
2. **Concept Equivalence Mapping** - Cross-field term relationships  
3. **Discovery Alerts** - Notifications for related cross-field claims
4. **Translation Deliberations** - Phased process for bridging vocabularies
5. **Bridge Claims** - IF/AND/THEN structure connecting assumptions
6. **Attack Profile Analysis** - User argumentation style profiling
7. **Claim Similarity Matching** - Finding researchers with similar positions
8. **Collaboration Recommendations** - Complementary expertise matching

---

**🎉 Phase 5: INTERDISCIPLINARY BRIDGE - COMPLETE**
