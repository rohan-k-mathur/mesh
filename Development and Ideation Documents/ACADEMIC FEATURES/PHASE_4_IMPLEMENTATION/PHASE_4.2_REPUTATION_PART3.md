# Phase 4.2: Argumentation-Based Reputation — Part 3

**Sub-Phase:** 4.2 of 4.3  
**Focus:** UI Components for Reputation System

---

## Implementation Steps (Continued)

### Step 4.2.9: Scholar Profile Component

**File:** `components/reputation/ScholarProfile.tsx`

```tsx
/**
 * Comprehensive scholar profile with reputation metrics
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useScholarStats,
  useUserExpertise,
  useReviewerProfile,
} from "@/lib/reputation/hooks";
import { ReputationScore } from "./ReputationScore";
import { ExpertiseDisplay } from "./ExpertiseDisplay";
import { StatsGrid } from "./StatsGrid";
import { ReviewerStats } from "./ReviewerStats";
import { ContributionHistory } from "./ContributionHistory";

interface ScholarProfileProps {
  userId: string;
  userName?: string;
  userImage?: string;
}

export function ScholarProfile({
  userId,
  userName,
  userImage,
}: ScholarProfileProps) {
  const { data: stats, isLoading: statsLoading } = useScholarStats(userId);
  const { data: expertise } = useUserExpertise(userId);
  const { data: reviewerProfile } = useReviewerProfile(userId);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={userImage} />
              <AvatarFallback className="text-2xl">
                {(userName || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {userName || stats?.userName || "Scholar"}
              </h1>
              <div className="mt-2 flex items-center gap-4">
                {stats && (
                  <ReputationScore
                    score={stats.reputationScore}
                    size="lg"
                  />
                )}
                <div className="text-sm text-muted-foreground">
                  <span>{stats?.totalArguments || 0} arguments</span>
                  <span className="mx-2">•</span>
                  <span>{stats?.citationCount || 0} citations</span>
                  <span className="mx-2">•</span>
                  <span>{stats?.reviewsCompleted || 0} reviews</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expertise Areas */}
          {expertise && expertise.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Expertise Areas
              </h3>
              <ExpertiseDisplay areas={expertise} compact />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          {reviewerProfile && (
            <TabsTrigger value="reviewer">Reviewer Profile</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="stats" className="mt-4">
          {stats && <StatsGrid stats={stats} />}
        </TabsContent>

        <TabsContent value="contributions" className="mt-4">
          <ContributionHistory userId={userId} />
        </TabsContent>

        {reviewerProfile && (
          <TabsContent value="reviewer" className="mt-4">
            <ReviewerStats profile={reviewerProfile} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
```

---

### Step 4.2.10: Reputation Score Component

**File:** `components/reputation/ReputationScore.tsx`

```tsx
/**
 * Visual reputation score display
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Star, Award, Shield, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReputationScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

function getScoreTier(score: number) {
  if (score >= 80) return { tier: "Gold", color: "text-yellow-500", bg: "bg-yellow-50" };
  if (score >= 60) return { tier: "Silver", color: "text-gray-400", bg: "bg-gray-50" };
  if (score >= 40) return { tier: "Bronze", color: "text-orange-600", bg: "bg-orange-50" };
  return { tier: "Emerging", color: "text-blue-500", bg: "bg-blue-50" };
}

function getScoreIcon(score: number) {
  if (score >= 80) return <Award className="w-full h-full" />;
  if (score >= 60) return <Shield className="w-full h-full" />;
  if (score >= 40) return <Star className="w-full h-full" />;
  return <Zap className="w-full h-full" />;
}

export function ReputationScore({
  score,
  size = "md",
  showLabel = true,
}: ReputationScoreProps) {
  const { tier, color, bg } = getScoreTier(score);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "rounded-full flex items-center justify-center",
                sizeClasses[size],
                bg
              )}
            >
              <div className={cn(iconSizes[size], color)}>
                {getScoreIcon(score)}
              </div>
            </div>
            {showLabel && (
              <div>
                <div className={cn("font-bold", color)}>
                  {Math.round(score)}
                </div>
                <div className="text-xs text-muted-foreground">{tier}</div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reputation Score: {score.toFixed(1)} / 100</p>
          <p className="text-xs text-muted-foreground">
            Based on arguments, reviews, and impact
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact reputation badge for inline use
 */
export function ReputationBadge({ score }: { score: number }) {
  const { color, bg } = getScoreTier(score);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        bg,
        color
      )}
    >
      {getScoreIcon(score)}
      <span>{Math.round(score)}</span>
    </span>
  );
}
```

---

### Step 4.2.11: Stats Grid Component

**File:** `components/reputation/StatsGrid.tsx`

```tsx
/**
 * Grid display of scholar statistics
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare,
  Swords,
  Shield,
  Target,
  BookOpen,
  Quote,
  Users,
  TrendingUp,
} from "lucide-react";
import { ScholarStatsSummary } from "@/lib/reputation/types";

interface StatsGridProps {
  stats: ScholarStatsSummary;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const statCards = [
    {
      icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
      label: "Arguments Created",
      value: stats.totalArguments,
      subValue: `${stats.argumentsWithConsensus} reached consensus`,
      progress: stats.consensusRate * 100,
      progressLabel: "Consensus Rate",
    },
    {
      icon: <Swords className="w-5 h-5 text-red-500" />,
      label: "Attacks Initiated",
      value: stats.totalAttacks,
      subValue: `${stats.successfulAttacks} successful`,
      progress: stats.attackPrecision * 100,
      progressLabel: "Attack Precision",
    },
    {
      icon: <Shield className="w-5 h-5 text-green-500" />,
      label: "Defenses Provided",
      value: stats.totalDefenses,
      subValue: `${stats.successfulDefenses} held`,
      progress: stats.defenseSuccessRate * 100,
      progressLabel: "Defense Success",
    },
    {
      icon: <BookOpen className="w-5 h-5 text-purple-500" />,
      label: "Reviews Completed",
      value: stats.reviewsCompleted,
      progress: stats.reviewQuality,
      progressLabel: "Review Quality",
    },
    {
      icon: <Quote className="w-5 h-5 text-orange-500" />,
      label: "Citations Received",
      value: stats.citationCount,
    },
    {
      icon: <Users className="w-5 h-5 text-cyan-500" />,
      label: "Downstream Usage",
      value: stats.downstreamUsage,
      subValue: "Arguments built on yours",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((card, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-3">
              {card.icon}
              <span className="text-sm font-medium text-muted-foreground">
                {card.label}
              </span>
            </div>

            <div className="text-3xl font-bold">{card.value}</div>

            {card.subValue && (
              <div className="text-sm text-muted-foreground mt-1">
                {card.subValue}
              </div>
            )}

            {card.progress !== undefined && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {card.progressLabel}
                  </span>
                  <span>{Math.round(card.progress)}%</span>
                </div>
                <Progress value={card.progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

### Step 4.2.12: Expertise Display Component

**File:** `components/reputation/ExpertiseDisplay.tsx`

```tsx
/**
 * Display scholar expertise areas
 */

"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpertiseAreaSummary, ExpertiseLevel } from "@/lib/reputation/types";
import { cn } from "@/lib/utils";
import { Award, Star, BookOpen, GraduationCap, Sparkles } from "lucide-react";

interface ExpertiseDisplayProps {
  areas: ExpertiseAreaSummary[];
  compact?: boolean;
}

const levelConfig: Record<
  ExpertiseLevel,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  NOVICE: {
    icon: <Sparkles className="w-3 h-3" />,
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
  CONTRIBUTOR: {
    icon: <BookOpen className="w-3 h-3" />,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  ESTABLISHED: {
    icon: <Star className="w-3 h-3" />,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  EXPERT: {
    icon: <GraduationCap className="w-3 h-3" />,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  AUTHORITY: {
    icon: <Award className="w-3 h-3" />,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
  },
};

export function ExpertiseDisplay({ areas, compact }: ExpertiseDisplayProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {areas.slice(0, 5).map((area, index) => {
          const config = levelConfig[area.expertiseLevel];
          return (
            <Badge
              key={index}
              variant="outline"
              className={cn("gap-1", config.bg, config.color)}
            >
              {config.icon}
              {area.topicName || area.customArea}
            </Badge>
          );
        })}
        {areas.length > 5 && (
          <Badge variant="outline" className="text-muted-foreground">
            +{areas.length - 5} more
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expertise Areas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {areas.map((area, index) => {
          const config = levelConfig[area.expertiseLevel];
          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full", config.bg, config.color)}>
                  {config.icon}
                </div>
                <div>
                  <div className="font-medium">
                    {area.topicName || area.customArea}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {area.contributionCount} contributions
                  </div>
                </div>
              </div>

              <Badge className={cn(config.bg, config.color)} variant="outline">
                {area.expertiseLevel.charAt(0) +
                  area.expertiseLevel.slice(1).toLowerCase()}
              </Badge>
            </div>
          );
        })}

        {areas.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No expertise areas yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Step 4.2.13: Reviewer Stats Component

**File:** `components/reputation/ReviewerStats.tsx`

```tsx
/**
 * Reviewer-specific statistics display
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  BookMarked,
} from "lucide-react";
import { ReviewerProfileSummary } from "@/lib/reputation/types";

interface ReviewerStatsProps {
  profile: ReviewerProfileSummary;
}

export function ReviewerStats({ profile }: ReviewerStatsProps) {
  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <BookMarked className="w-4 h-4" />
              Total Reviews
            </div>
            <div className="text-2xl font-bold mt-1">
              {profile.totalReviews}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              On-Time Rate
            </div>
            <div className="text-2xl font-bold mt-1">
              {Math.round(profile.onTimeRate * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertTriangle className="w-4 h-4" />
              Blocking Concern Rate
            </div>
            <div className="text-2xl font-bold mt-1">
              {Math.round(profile.blockingConcernRate * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Target className="w-4 h-4" />
              Concern Resolution
            </div>
            <div className="text-2xl font-bold mt-1">
              {Math.round(profile.concernResolutionRate * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Average Commitments per Review</span>
              <span className="font-medium">
                {profile.averageCommitments.toFixed(1)}
              </span>
            </div>
            <Progress
              value={Math.min(profile.averageCommitments * 10, 100)}
              className="h-2"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Average Response Time</span>
              <span className="font-medium">
                {profile.averageResponseDays.toFixed(0)} days
              </span>
            </div>
            <Progress
              value={Math.max(0, 100 - profile.averageResponseDays * 5)}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Specializations */}
      {profile.topSpecialties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review Specializations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.topSpecialties.map((specialty, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {specialty.topicName}
                  <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded">
                    {specialty.reviewCount}
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### Step 4.2.14: Leaderboard Component

**File:** `components/reputation/Leaderboard.tsx`

```tsx
/**
 * Reputation leaderboard display
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useReputationLeaderboard } from "@/lib/reputation/hooks";
import { ReputationBadge } from "./ReputationScore";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
  limit?: number;
  topicId?: string;
  title?: string;
}

const rankIcons: Record<number, React.ReactNode> = {
  1: <Trophy className="w-5 h-5 text-yellow-500" />,
  2: <Medal className="w-5 h-5 text-gray-400" />,
  3: <Award className="w-5 h-5 text-orange-600" />,
};

export function Leaderboard({
  limit = 10,
  topicId,
  title = "Top Scholars",
}: LeaderboardProps) {
  const { data: leaderboard, isLoading } = useReputationLeaderboard({
    limit,
    topicId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {leaderboard?.map((entry: any) => (
          <div
            key={entry.userId}
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg",
              entry.rank <= 3 ? "bg-muted" : "hover:bg-muted/50"
            )}
          >
            {/* Rank */}
            <div className="w-8 flex justify-center">
              {rankIcons[entry.rank] || (
                <span className="text-lg font-bold text-muted-foreground">
                  {entry.rank}
                </span>
              )}
            </div>

            {/* User */}
            <Avatar className="w-10 h-10">
              <AvatarImage src={entry.userImage} />
              <AvatarFallback>
                {entry.userName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{entry.userName}</div>
              <div className="text-xs text-muted-foreground">
                {entry.totalArguments} arguments •{" "}
                {Math.round(entry.consensusRate * 100)}% consensus
              </div>
            </div>

            {/* Score */}
            <ReputationBadge score={entry.reputationScore} />
          </div>
        ))}

        {(!leaderboard || leaderboard.length === 0) && (
          <p className="text-center text-muted-foreground py-4">
            No scholars found
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Step 4.2.15: Contribution History Component

**File:** `components/reputation/ContributionHistory.tsx`

```tsx
/**
 * Timeline of scholar contributions
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserContributions, useContributionSummary } from "@/lib/reputation/hooks";
import { ContributionType, CONTRIBUTION_WEIGHTS } from "@/lib/reputation/types";
import {
  MessageSquare,
  Swords,
  Shield,
  ThumbsUp,
  BookOpen,
  AlertTriangle,
  Quote,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ContributionHistoryProps {
  userId: string;
  limit?: number;
}

const typeConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  ARGUMENT_CREATED: {
    icon: <MessageSquare className="w-4 h-4" />,
    label: "Created argument",
    color: "bg-blue-100 text-blue-700",
  },
  ATTACK_INITIATED: {
    icon: <Swords className="w-4 h-4" />,
    label: "Initiated attack",
    color: "bg-red-100 text-red-700",
  },
  DEFENSE_PROVIDED: {
    icon: <Shield className="w-4 h-4" />,
    label: "Provided defense",
    color: "bg-green-100 text-green-700",
  },
  SUPPORT_GIVEN: {
    icon: <ThumbsUp className="w-4 h-4" />,
    label: "Supported argument",
    color: "bg-purple-100 text-purple-700",
  },
  REVIEW_COMPLETED: {
    icon: <BookOpen className="w-4 h-4" />,
    label: "Completed review",
    color: "bg-indigo-100 text-indigo-700",
  },
  BLOCKING_CONCERN_RAISED: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: "Raised blocking concern",
    color: "bg-orange-100 text-orange-700",
  },
  CITATION_RECEIVED: {
    icon: <Quote className="w-4 h-4" />,
    label: "Received citation",
    color: "bg-cyan-100 text-cyan-700",
  },
  CONSENSUS_ACHIEVED: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: "Achieved consensus",
    color: "bg-emerald-100 text-emerald-700",
  },
};

export function ContributionHistory({
  userId,
  limit = 20,
}: ContributionHistoryProps) {
  const { data: contributions, isLoading } = useUserContributions(userId, {
    limit,
  });
  const { data: summary } = useContributionSummary(userId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contribution Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.map((item: any) => {
                const config = typeConfig[item.type];
                if (!config) return null;
                return (
                  <Badge
                    key={item.type}
                    variant="outline"
                    className={config.color}
                  >
                    {config.icon}
                    <span className="ml-1">{item.count}</span>
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contributions?.map((contribution: any) => {
              const config = typeConfig[contribution.type] || {
                icon: <MessageSquare className="w-4 h-4" />,
                label: contribution.type,
                color: "bg-gray-100 text-gray-700",
              };

              return (
                <div
                  key={contribution.id}
                  className="flex items-start gap-3 pb-3 border-b last:border-0"
                >
                  <div className={`p-2 rounded-full ${config.color}`}>
                    {config.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{config.label}</div>
                    {contribution.deliberation && (
                      <div className="text-sm text-muted-foreground truncate">
                        in {contribution.deliberation.title}
                      </div>
                    )}
                    {contribution.argument && (
                      <div className="text-sm text-muted-foreground truncate">
                        "{contribution.argument.summary}"
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(contribution.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              );
            })}

            {(!contributions || contributions.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                No contributions yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 4.2 Complete Checklist

| # | Component | File | Part |
|---|-----------|------|------|
| 1 | Contribution schema | `prisma/schema.prisma` | 1 |
| 2 | Stats schema | `prisma/schema.prisma` | 1 |
| 3 | Expertise schema | `prisma/schema.prisma` | 1 |
| 4 | ReviewerProfile schema | `prisma/schema.prisma` | 1 |
| 5 | Reputation types | `lib/reputation/types.ts` | 1 |
| 6 | Contribution service | `lib/reputation/contributionService.ts` | 1 |
| 7 | Stats service | `lib/reputation/statsService.ts` | 1 |
| 8 | Expertise service | `lib/reputation/expertiseService.ts` | 1 |
| 9 | Reviewer profile service | `lib/reputation/reviewerProfileService.ts` | 2 |
| 10 | API routes | `app/api/reputation/` | 2 |
| 11 | React Query hooks | `lib/reputation/hooks.ts` | 2 |
| 12 | ScholarProfile | `components/reputation/ScholarProfile.tsx` | 3 |
| 13 | ReputationScore | `components/reputation/ReputationScore.tsx` | 3 |
| 14 | StatsGrid | `components/reputation/StatsGrid.tsx` | 3 |
| 15 | ExpertiseDisplay | `components/reputation/ExpertiseDisplay.tsx` | 3 |
| 16 | ReviewerStats | `components/reputation/ReviewerStats.tsx` | 3 |
| 17 | Leaderboard | `components/reputation/Leaderboard.tsx` | 3 |
| 18 | ContributionHistory | `components/reputation/ContributionHistory.tsx` | 3 |

---

## Next: Phase 4.3

Continue to Phase 4.3 for **Academic Credit Integration**:
- ORCID Integration
- CV Export Formats
- Institutional Reporting

---

*End of Phase 4.2 Part 3*
