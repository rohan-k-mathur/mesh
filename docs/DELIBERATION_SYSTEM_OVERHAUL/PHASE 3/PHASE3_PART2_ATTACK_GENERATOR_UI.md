# Deliberation System Overhaul - Phase 3 Part 2
## Attack Generator UI - Week 10 Implementation

**Document Version**: 1.0  
**Date**: November 8, 2025  
**Status**: Detailed Implementation Specification  
**Estimated Total Time**: 40 hours (Week 10)

---

## Overview

This document details **Phase 3.2: Attack Generator UI**, building on the backend services created in Phase 3.1. This phase creates the user-facing interface that transforms argument generation from a manual process to an AI-assisted, guided experience.

### Strategic Value

**Current User Experience**:
- Users see opposing argument
- Must manually figure out how to attack it
- No guidance on which attack approach is strongest
- Unclear what evidence they need
- High cognitive load, low success rate

**After Phase 3.2**:
- System analyzes argument and suggests 5-10 strategic attacks
- Each attack shows burden of proof, difficulty, and strategic value
- Click attack → get template with guidance
- Real-time feedback as user constructs argument
- Preview before submission

### Dependencies

**From Phase 3.1**:
- ✅ `ArgumentGenerationService` with all methods
- ✅ `/api/arguments/suggest-attacks` endpoint
- ✅ `/api/arguments/generate-template` endpoint
- ✅ `/api/arguments/score` endpoint
- ✅ `useArgumentScoring()` hook

**From Phase 0**:
- ✅ `CriticalQuestion.burdenOfProof` field
- ✅ `CriticalQuestion.requiresEvidence` field

**From Phase 1**:
- ✅ `ArgumentSchemeInstance` model
- ✅ Multi-scheme argument support

---

## Phase 3.2 Structure

**Step 3.2.1**: AttackSuggestions Component (10 hours)  
**Step 3.2.2**: AttackConstructionWizard Component (12 hours)  
**Step 3.2.3**: Burden of Proof Indicators (6 hours)  
**Step 3.2.4**: Evidence Guidance UI (6 hours)  
**Step 3.2.5**: Attack Preview & Submission (6 hours)

---

# Step 3.2.1: AttackSuggestions Component (10 hours)

## Overview

Create the main component that displays AI-generated attack suggestions with ranking, filtering, and selection.

## Component Structure

**File**: `components/argumentation/AttackSuggestions.tsx`

```typescript
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Target,
  Zap,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import type { AttackSuggestion } from "@/app/server/services/ArgumentGenerationService";

// ============================================================================
// Types
// ============================================================================

type SortOption = "strategic" | "strength" | "difficulty" | "burden";
type FilterOption = "all" | "REBUTS" | "UNDERCUTS" | "UNDERMINES";

interface AttackSuggestionsProps {
  targetClaimId: string;
  targetArgumentId?: string;
  onAttackSelect: (suggestion: AttackSuggestion) => void;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function AttackSuggestions({
  targetClaimId,
  targetArgumentId,
  onAttackSelect,
  className,
}: AttackSuggestionsProps) {
  // State
  const [suggestions, setSuggestions] = useState<AttackSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("strategic");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [selectedSuggestion, setSelectedSuggestion] = useState<AttackSuggestion | null>(null);

  // Load suggestions on mount
  useState(() => {
    loadSuggestions();
  });

  async function loadSuggestions() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/arguments/suggest-attacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetClaimId,
          targetArgumentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load attack suggestions");
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Sorting and filtering
  const processedSuggestions = useMemo(() => {
    let filtered = suggestions;

    // Filter by attack type
    if (filterBy !== "all") {
      filtered = filtered.filter((s) => s.attackType === filterBy);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "strategic":
          return b.strategicValue - a.strategicValue;
        case "strength":
          return b.strengthScore - a.strengthScore;
        case "difficulty":
          return a.difficultyScore - b.difficultyScore; // Lower difficulty first
        case "burden":
          // Proponent burden first (easier)
          if (a.burdenOfProof === "proponent" && b.burdenOfProof === "challenger") {
            return -1;
          }
          if (a.burdenOfProof === "challenger" && b.burdenOfProof === "proponent") {
            return 1;
          }
          return b.strategicValue - a.strategicValue;
        default:
          return 0;
      }
    });

    return sorted;
  }, [suggestions, sortBy, filterBy]);

  // Group by attack type for tabs
  const groupedSuggestions = useMemo(() => {
    return {
      all: processedSuggestions,
      REBUTS: processedSuggestions.filter((s) => s.attackType === "REBUTS"),
      UNDERCUTS: processedSuggestions.filter((s) => s.attackType === "UNDERCUTS"),
      UNDERMINES: processedSuggestions.filter((s) => s.attackType === "UNDERMINES"),
    };
  }, [processedSuggestions]);

  // Render
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadSuggestions} />;
  }

  if (suggestions.length === 0) {
    return <EmptyState targetClaimId={targetClaimId} />;
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Attack Suggestions
              </CardTitle>
              <CardDescription>
                AI-generated attacks ranked by strategic value
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Sort selector */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategic">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Strategic Value
                    </div>
                  </SelectItem>
                  <SelectItem value="strength">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Attack Strength
                    </div>
                  </SelectItem>
                  <SelectItem value="difficulty">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Easiest First
                    </div>
                  </SelectItem>
                  <SelectItem value="burden">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Burden Advantage
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh button */}
              <Button variant="outline" size="sm" onClick={loadSuggestions}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({groupedSuggestions.all.length})
              </TabsTrigger>
              <TabsTrigger value="REBUTS">
                Rebut ({groupedSuggestions.REBUTS.length})
              </TabsTrigger>
              <TabsTrigger value="UNDERCUTS">
                Undercut ({groupedSuggestions.UNDERCUTS.length})
              </TabsTrigger>
              <TabsTrigger value="UNDERMINES">
                Undermine ({groupedSuggestions.UNDERMINES.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filterBy} className="mt-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {processedSuggestions.map((suggestion, idx) => (
                    <AttackSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      rank={idx + 1}
                      isSelected={selectedSuggestion?.id === suggestion.id}
                      onSelect={() => {
                        setSelectedSuggestion(suggestion);
                        onAttackSelect(suggestion);
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// AttackSuggestionCard
// ============================================================================

interface AttackSuggestionCardProps {
  suggestion: AttackSuggestion;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}

function AttackSuggestionCard({
  suggestion,
  rank,
  isSelected,
  onSelect,
}: AttackSuggestionCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Rank badge */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                #{rank}
              </Badge>
              <AttackTypeBadge type={suggestion.attackType} />
              <TargetScopeBadge scope={suggestion.targetScope} />
            </div>

            {/* Critical question */}
            <CardTitle className="text-base font-semibold">
              {suggestion.cq.question}
            </CardTitle>
          </div>

          {/* Score indicators */}
          <div className="flex flex-col items-end gap-1 ml-4">
            <ScoreIndicator
              label="Strategic"
              score={suggestion.strategicValue}
              icon={<TrendingUp className="h-3 w-3" />}
            />
            <ScoreIndicator
              label="Strength"
              score={suggestion.strengthScore}
              icon={<Zap className="h-3 w-3" />}
            />
            <ScoreIndicator
              label="Difficulty"
              score={100 - suggestion.difficultyScore}
              icon={<Shield className="h-3 w-3" />}
              invert
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Burden of proof indicator */}
        <BurdenOfProofIndicator
          burden={suggestion.burdenOfProof}
          requiresEvidence={suggestion.requiresEvidence}
        />

        {/* Reasoning */}
        <div className="text-sm text-muted-foreground">
          {suggestion.reasoning}
        </div>

        {/* Example attacks preview */}
        {suggestion.exampleAttacks.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Example attacks:
            </div>
            <div className="space-y-1">
              {suggestion.exampleAttacks.slice(0, 2).map((example, idx) => (
                <div
                  key={idx}
                  className="text-sm italic text-muted-foreground border-l-2 border-muted pl-3"
                >
                  {example}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence requirements preview */}
        {suggestion.evidenceTypes.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>
              Requires: {suggestion.evidenceTypes.slice(0, 2).join(", ")}
              {suggestion.evidenceTypes.length > 2 && ` +${suggestion.evidenceTypes.length - 2} more`}
            </span>
          </div>
        )}

        {/* Select button */}
        <Button
          className="w-full"
          variant={isSelected ? "default" : "outline"}
          size="sm"
        >
          {isSelected ? "Selected" : "Use This Attack"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Supporting Components
// ============================================================================

function AttackTypeBadge({ type }: { type: string }) {
  const config = {
    REBUTS: { label: "Rebut", variant: "destructive" as const },
    UNDERCUTS: { label: "Undercut", variant: "default" as const },
    UNDERMINES: { label: "Undermine", variant: "secondary" as const },
  };

  const { label, variant } = config[type as keyof typeof config] || config.REBUTS;

  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );
}

function TargetScopeBadge({ scope }: { scope: string }) {
  const config = {
    conclusion: { label: "→ Conclusion", className: "bg-red-100 text-red-800" },
    inference: { label: "→ Inference", className: "bg-yellow-100 text-yellow-800" },
    premise: { label: "→ Premise", className: "bg-blue-100 text-blue-800" },
  };

  const { label, className } = config[scope as keyof typeof config] || config.conclusion;

  return (
    <Badge variant="outline" className={`text-xs ${className}`}>
      {label}
    </Badge>
  );
}

interface ScoreIndicatorProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  invert?: boolean;
}

function ScoreIndicator({ label, score, icon, invert = false }: ScoreIndicatorProps) {
  const displayScore = invert ? 100 - score : score;
  const color =
    displayScore >= 70
      ? "text-green-600"
      : displayScore >= 40
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-1 text-xs cursor-help">
          {icon}
          <span className={`font-medium ${color}`}>{Math.round(displayScore)}</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent side="left" className="w-48">
        <div className="space-y-1">
          <div className="text-xs font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">
            {label === "Strategic" &&
              "Impact on deliberation outcome"}
            {label === "Strength" &&
              "Dialectical power of attack"}
            {label === "Difficulty" &&
              "Ease of execution for you"}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function BurdenOfProofIndicator({
  burden,
  requiresEvidence,
}: {
  burden: string;
  requiresEvidence: boolean;
}) {
  if (burden === "proponent") {
    return (
      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <div>
          <div className="font-medium text-green-900">Burden Advantage</div>
          <div className="text-green-700">
            Just asking shifts burden back to original arguer
          </div>
        </div>
      </div>
    );
  }

  if (!requiresEvidence) {
    return (
      <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <div>
          <div className="font-medium text-yellow-900">Moderate Difficulty</div>
          <div className="text-yellow-700">
            Some evidence needed, but bar is not high
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <div>
        <div className="font-medium text-red-900">High Difficulty</div>
        <div className="text-red-700">
          You bear burden of proof and must provide strong evidence
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Loading & Error States
// ============================================================================

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg font-medium mb-2">Failed to load suggestions</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={onRetry}>Try Again</Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ targetClaimId }: { targetClaimId: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Target className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">No attack suggestions available</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          We couldn't find any structured arguments to attack for this claim.
          Try adding a scheme-based argument first, or make a general rebuttal.
        </p>
      </CardContent>
    </Card>
  );
}
```

## Usage Example

**File**: `app/(app)/deliberations/[id]/claims/[claimId]/attack/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { AttackSuggestions } from "@/components/argumentation/AttackSuggestions";
import { AttackConstructionWizard } from "@/components/argumentation/AttackConstructionWizard";
import type { AttackSuggestion } from "@/app/server/services/ArgumentGenerationService";

export default function AttackClaimPage({
  params,
}: {
  params: { id: string; claimId: string };
}) {
  const [selectedAttack, setSelectedAttack] = useState<AttackSuggestion | null>(null);

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Attack suggestions */}
        <AttackSuggestions
          targetClaimId={params.claimId}
          onAttackSelect={setSelectedAttack}
        />

        {/* Right: Construction wizard (shown when attack selected) */}
        {selectedAttack && (
          <AttackConstructionWizard
            suggestion={selectedAttack}
            claimId={params.claimId}
            deliberationId={params.id}
          />
        )}
      </div>
    </div>
  );
}
```

## Testing

**File**: `components/argumentation/__tests__/AttackSuggestions.test.tsx`

```typescript
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AttackSuggestions } from "../AttackSuggestions";

// Mock fetch
global.fetch = jest.fn();

describe("AttackSuggestions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should load and display suggestions", async () => {
    const mockSuggestions = [
      {
        id: "attack-1",
        cq: { question: "Is the expert really qualified?" },
        attackType: "UNDERMINES",
        targetScope: "premise",
        burdenOfProof: "proponent",
        requiresEvidence: false,
        strategicValue: 85,
        strengthScore: 80,
        difficultyScore: 30,
        reasoning: "This attacks a key premise",
        exampleAttacks: ["Example 1", "Example 2"],
        evidenceTypes: ["expert-credentials"],
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestions: mockSuggestions }),
    });

    render(
      <AttackSuggestions
        targetClaimId="claim-1"
        onAttackSelect={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Is the expert really qualified?")).toBeInTheDocument();
    });

    expect(screen.getByText("Burden Advantage")).toBeInTheDocument();
  });

  it("should filter by attack type", async () => {
    const mockSuggestions = [
      {
        id: "attack-1",
        attackType: "REBUTS",
        cq: { question: "Question 1" },
        // ... other fields
      },
      {
        id: "attack-2",
        attackType: "UNDERCUTS",
        cq: { question: "Question 2" },
        // ... other fields
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestions: mockSuggestions }),
    });

    render(
      <AttackSuggestions
        targetClaimId="claim-1"
        onAttackSelect={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Question 1")).toBeInTheDocument();
    });

    // Click UNDERCUTS tab
    fireEvent.click(screen.getByText(/Undercut/));

    // Should only show UNDERCUTS
    expect(screen.queryByText("Question 1")).not.toBeInTheDocument();
    expect(screen.getByText("Question 2")).toBeInTheDocument();
  });

  it("should sort by different criteria", async () => {
    const mockSuggestions = [
      {
        id: "attack-1",
        cq: { question: "Attack 1" },
        strategicValue: 50,
        strengthScore: 80,
        difficultyScore: 70,
        // ... other fields
      },
      {
        id: "attack-2",
        cq: { question: "Attack 2" },
        strategicValue: 90,
        strengthScore: 60,
        difficultyScore: 30,
        // ... other fields
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestions: mockSuggestions }),
    });

    render(
      <AttackSuggestions
        targetClaimId="claim-1"
        onAttackSelect={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Attack 1")).toBeInTheDocument();
    });

    // Default sort by strategic value - Attack 2 should be first
    const cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards[0]).toHaveTextContent("Attack 2");

    // Change sort to difficulty
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Easiest First"));

    // Attack 2 should still be first (lower difficulty score)
    const sortedCards = screen.getAllByRole("heading", { level: 3 });
    expect(sortedCards[0]).toHaveTextContent("Attack 2");
  });

  it("should call onAttackSelect when card clicked", async () => {
    const mockOnSelect = jest.fn();
    const mockSuggestion = {
      id: "attack-1",
      cq: { question: "Test question" },
      // ... other fields
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestions: [mockSuggestion] }),
    });

    render(
      <AttackSuggestions
        targetClaimId="claim-1"
        onAttackSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Test question")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Use This Attack"));

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "attack-1" })
    );
  });

  it("should show loading state", () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <AttackSuggestions
        targetClaimId="claim-1"
        onAttackSelect={jest.fn()}
      />
    );

    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("should show error state with retry", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(
      <AttackSuggestions
        targetClaimId="claim-1"
        onAttackSelect={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to load suggestions")).toBeInTheDocument();
    });

    expect(screen.getByText("Network error")).toBeInTheDocument();

    // Click retry
    const retryButton = screen.getByText("Try Again");
    fireEvent.click(retryButton);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should show empty state when no suggestions", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestions: [] }),
    });

    render(
      <AttackSuggestions
        targetClaimId="claim-1"
        onAttackSelect={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("No attack suggestions available")
      ).toBeInTheDocument();
    });
  });
});
```

## Storybook Stories

**File**: `components/argumentation/AttackSuggestions.stories.tsx`

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { AttackSuggestions } from "./AttackSuggestions";

const meta: Meta<typeof AttackSuggestions> = {
  title: "Argumentation/AttackSuggestions",
  component: AttackSuggestions,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof AttackSuggestions>;

export const Default: Story = {
  args: {
    targetClaimId: "claim-1",
    onAttackSelect: (suggestion) => {
      console.log("Selected:", suggestion);
    },
  },
  parameters: {
    mockData: [
      {
        id: "attack-1",
        cq: {
          question: "Is the cited expert actually qualified in this domain?",
        },
        attackType: "UNDERMINES",
        targetScope: "premise",
        burdenOfProof: "proponent",
        requiresEvidence: false,
        strategicValue: 85,
        strengthScore: 80,
        difficultyScore: 30,
        reasoning:
          "Just asking this question shifts burden back to original arguer. Expert opinion arguments are vulnerable to expertise challenges.",
        exampleAttacks: [
          "The cited expert lacks credentials in this specific domain.",
          "Dr. Smith is a physicist, not a climate scientist.",
        ],
        evidenceTypes: ["expert-credentials"],
      },
      {
        id: "attack-2",
        cq: {
          question: "Are there other experts who disagree?",
        },
        attackType: "UNDERCUTS",
        targetScope: "inference",
        burdenOfProof: "challenger",
        requiresEvidence: true,
        strategicValue: 75,
        strengthScore: 85,
        difficultyScore: 60,
        reasoning:
          "Presenting conflicting expert opinions undercuts the inference from expert testimony to truth. Requires finding counter-expert.",
        exampleAttacks: [
          "Dr. Jones, also an expert, disagrees with this assessment.",
          "The consensus among experts is actually opposite.",
        ],
        evidenceTypes: ["expert-statement", "research-citation"],
      },
    ],
  },
};

export const WithBurdenAdvantage: Story = {
  args: {
    targetClaimId: "claim-1",
    onAttackSelect: (suggestion) => {
      console.log("Selected:", suggestion);
    },
  },
};

export const Loading: Story = {
  args: {
    targetClaimId: "claim-1",
    onAttackSelect: () => {},
  },
  parameters: {
    mockData: "loading",
  },
};

export const Error: Story = {
  args: {
    targetClaimId: "claim-1",
    onAttackSelect: () => {},
  },
  parameters: {
    mockData: "error",
  },
};

export const Empty: Story = {
  args: {
    targetClaimId: "claim-1",
    onAttackSelect: () => {},
  },
  parameters: {
    mockData: [],
  },
};
```

## Accessibility

```typescript
// Add ARIA labels and keyboard navigation
<Card
  role="button"
  tabIndex={0}
  aria-label={`Attack suggestion: ${suggestion.cq.question}`}
  aria-pressed={isSelected}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      onSelect();
    }
  }}
  // ... other props
>
```

## Performance Optimizations

```typescript
// Virtualize long lists
import { VirtualScroller } from "@/components/ui/virtual-scroller";

<VirtualScroller
  items={processedSuggestions}
  itemHeight={200}
  renderItem={(suggestion, idx) => (
    <AttackSuggestionCard
      key={suggestion.id}
      suggestion={suggestion}
      rank={idx + 1}
      // ... other props
    />
  )}
/>
```

## Time Allocation

- Component structure & layout: 3 hours
- Sorting & filtering logic: 2 hours
- Score indicators & badges: 2 hours
- Loading/error/empty states: 1 hour
- Testing & stories: 2 hours

## Deliverables

- ✅ `AttackSuggestions` component with full functionality
- ✅ Sorting by strategic value, strength, difficulty, burden
- ✅ Filtering by attack type (Rebut/Undercut/Undermine)
- ✅ Score indicators with hover explanations
- ✅ Burden of proof visual indicators
- ✅ Example attacks preview
- ✅ Comprehensive test suite
- ✅ Storybook stories for all states
- ✅ Accessibility features

---

# Step 3.2.2: AttackConstructionWizard Component (12 hours)

## Overview

Create a multi-step wizard that guides users through constructing an attack argument based on the selected suggestion. This component provides templates, real-time feedback, and validation.

## Component Structure

**File**: `components/argumentation/AttackConstructionWizard.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileText,
  Upload,
  Eye,
} from "lucide-react";
import { useArgumentScoring } from "@/app/hooks/useArgumentScoring";
import type {
  AttackSuggestion,
  ArgumentTemplate,
} from "@/app/server/services/ArgumentGenerationService";

// ============================================================================
// Types
// ============================================================================

type WizardStep = "overview" | "premises" | "evidence" | "review";

interface AttackConstructionWizardProps {
  suggestion: AttackSuggestion;
  claimId: string;
  deliberationId: string;
  onComplete?: (argumentId: string) => void;
  onCancel?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function AttackConstructionWizard({
  suggestion,
  claimId,
  deliberationId,
  onComplete,
  onCancel,
}: AttackConstructionWizardProps) {
  // State
  const [currentStep, setCurrentStep] = useState<WizardStep>("overview");
  const [template, setTemplate] = useState<ArgumentTemplate | null>(null);
  const [filledPremises, setFilledPremises] = useState<Record<string, string>>({});
  const [evidenceLinks, setEvidenceLinks] = useState<Record<string, string[]>>({});
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time scoring
  const { score, isScoring } = useArgumentScoring(
    template?.schemeId || "",
    claimId,
    filledPremises
  );

  // Load template on mount
  useEffect(() => {
    loadTemplate();
  }, [suggestion]);

  async function loadTemplate() {
    setIsLoadingTemplate(true);
    setError(null);

    try {
      const response = await fetch("/api/arguments/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeId: suggestion.targetSchemeInstance?.scheme?.id || "general-rebuttal",
          claimId,
          attackType: suggestion.attackType,
          targetCQ: suggestion.cq.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load template");
      }

      const data = await response.json();
      setTemplate(data.template);

      // Initialize with prefilled data
      if (data.template.prefilledPremises) {
        setFilledPremises(data.template.prefilledPremises);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingTemplate(false);
    }
  }

  // Navigation
  function goToStep(step: WizardStep) {
    setCurrentStep(step);
  }

  function nextStep() {
    const steps: WizardStep[] = ["overview", "premises", "evidence", "review"];
    const currentIdx = steps.indexOf(currentStep);
    if (currentIdx < steps.length - 1) {
      setCurrentStep(steps[currentIdx + 1]);
    }
  }

  function previousStep() {
    const steps: WizardStep[] = ["overview", "premises", "evidence", "review"];
    const currentIdx = steps.indexOf(currentStep);
    if (currentIdx > 0) {
      setCurrentStep(steps[currentIdx - 1]);
    }
  }

  // Validation
  function canProceed(): boolean {
    if (!template) return false;

    switch (currentStep) {
      case "overview":
        return true; // Always can proceed from overview
      case "premises":
        // Check required premises are filled
        const requiredPremises = template.premises.filter((p) => p.required);
        return requiredPremises.every(
          (p) => filledPremises[p.key] && filledPremises[p.key].trim() !== ""
        );
      case "evidence":
        // Evidence is optional, can always proceed
        return true;
      case "review":
        // Check overall score
        return (score?.overallScore || 0) >= 40; // Minimum 40% score
      default:
        return false;
    }
  }

  // Submission
  async function handleSubmit() {
    if (!template) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create argument
      const response = await fetch("/api/arguments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId,
          deliberationId,
          schemeId: template.schemeId,
          text: generateArgumentText(),
          premises: filledPremises,
          evidenceLinks,
          attackType: suggestion.attackType,
          targetCQ: suggestion.cq.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create argument");
      }

      const data = await response.json();
      
      // Track analytics
      trackArgumentCreation({
        schemeId: template.schemeId,
        attackType: suggestion.attackType,
        score: score?.overallScore || 0,
        usedSuggestion: true,
      });

      onComplete?.(data.argument.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function generateArgumentText(): string {
    if (!template) return "";

    let text = "";

    // Add premises
    template.premises.forEach((premise) => {
      const filled = filledPremises[premise.key];
      if (filled && filled.trim() !== "") {
        text += filled + "\n\n";
      }
    });

    // Add conclusion
    text += "Therefore, " + template.conclusion;

    return text.trim();
  }

  // Render
  if (isLoadingTemplate) {
    return <LoadingSkeleton />;
  }

  if (error && !template) {
    return <ErrorState error={error} onRetry={loadTemplate} />;
  }

  if (!template) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <WizardProgress
        currentStep={currentStep}
        onStepClick={goToStep}
        score={score?.overallScore}
      />

      {/* Step content */}
      <Card>
        {currentStep === "overview" && (
          <OverviewStep
            suggestion={suggestion}
            template={template}
            onNext={nextStep}
            onCancel={onCancel}
          />
        )}

        {currentStep === "premises" && (
          <PremisesStep
            template={template}
            filledPremises={filledPremises}
            onPremiseChange={(key, value) => {
              setFilledPremises((prev) => ({ ...prev, [key]: value }));
            }}
            score={score}
            isScoring={isScoring}
            onNext={nextStep}
            onBack={previousStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === "evidence" && (
          <EvidenceStep
            template={template}
            filledPremises={filledPremises}
            evidenceLinks={evidenceLinks}
            onEvidenceChange={setEvidenceLinks}
            onNext={nextStep}
            onBack={previousStep}
          />
        )}

        {currentStep === "review" && (
          <ReviewStep
            template={template}
            filledPremises={filledPremises}
            evidenceLinks={evidenceLinks}
            score={score}
            suggestion={suggestion}
            onSubmit={handleSubmit}
            onBack={previousStep}
            isSubmitting={isSubmitting}
            error={error}
            canSubmit={canProceed()}
          />
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// Progress Indicator
// ============================================================================

interface WizardProgressProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  score?: number;
}

function WizardProgress({ currentStep, onStepClick, score }: WizardProgressProps) {
  const steps = [
    { key: "overview" as const, label: "Overview", icon: FileText },
    { key: "premises" as const, label: "Premises", icon: Lightbulb },
    { key: "evidence" as const, label: "Evidence", icon: Upload },
    { key: "review" as const, label: "Review", icon: Eye },
  ];

  const currentIdx = steps.findIndex((s) => s.key === currentStep);
  const progress = ((currentIdx + 1) / steps.length) * 100;

  return (
    <div className="space-y-4">
      <Progress value={progress} className="h-2" />

      <div className="flex justify-between">
        {steps.map((step, idx) => {
          const isActive = step.key === currentStep;
          const isCompleted = idx < currentIdx;
          const Icon = step.icon;

          return (
            <button
              key={step.key}
              onClick={() => onStepClick(step.key)}
              className={`flex flex-col items-center gap-2 transition-all ${
                isActive
                  ? "text-primary"
                  : isCompleted
                  ? "text-green-600"
                  : "text-muted-foreground"
              }`}
              disabled={idx > currentIdx}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCompleted
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-muted bg-background"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className="text-xs font-medium">{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Score display */}
      {score !== undefined && score > 0 && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Argument Quality:</span>
          <Badge
            variant={score >= 70 ? "default" : score >= 40 ? "secondary" : "destructive"}
          >
            {Math.round(score)}%
          </Badge>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Overview Step
// ============================================================================

interface OverviewStepProps {
  suggestion: AttackSuggestion;
  template: ArgumentTemplate;
  onNext: () => void;
  onCancel?: () => void;
}

function OverviewStep({ suggestion, template, onNext, onCancel }: OverviewStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>Attack Strategy Overview</CardTitle>
        <CardDescription>
          Understanding your attack approach and what you'll need
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Attack summary */}
        <div className="space-y-3">
          <h3 className="font-medium">Critical Question</h3>
          <p className="text-lg">{suggestion.cq.question}</p>

          <div className="flex items-center gap-2">
            <Badge>{suggestion.attackType}</Badge>
            <Badge variant="outline">{suggestion.targetScope}</Badge>
          </div>
        </div>

        <Separator />

        {/* Reasoning */}
        <div className="space-y-3">
          <h3 className="font-medium">Why This Attack Works</h3>
          <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
        </div>

        <Separator />

        {/* Construction steps preview */}
        <div className="space-y-3">
          <h3 className="font-medium">Construction Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            {template.constructionSteps.slice(0, 3).map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
            {template.constructionSteps.length > 3 && (
              <li className="text-xs italic">
                +{template.constructionSteps.length - 3} more steps
              </li>
            )}
          </ol>
        </div>

        <Separator />

        {/* Evidence requirements preview */}
        <div className="space-y-3">
          <h3 className="font-medium">Evidence You'll Need</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            {template.evidenceRequirements.slice(0, 3).map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
            {template.evidenceRequirements.length > 3 && (
              <li className="text-xs italic">
                +{template.evidenceRequirements.length - 3} more types
              </li>
            )}
          </ul>
        </div>

        {/* Burden indicator */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {suggestion.burdenOfProof === "proponent" ? (
              <span className="text-green-700">
                ✅ <strong>Burden Advantage:</strong> Just asking this question shifts burden
                back to the original arguer.
              </span>
            ) : suggestion.requiresEvidence ? (
              <span className="text-red-700">
                ⚠️ <strong>You bear burden of proof:</strong> You must provide strong evidence
                to make this attack succeed.
              </span>
            ) : (
              <span className="text-yellow-700">
                ⚠️ <strong>Moderate difficulty:</strong> Some evidence needed, but bar is not
                high.
              </span>
            )}
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onNext}>
            Begin Construction <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </>
  );
}

// ============================================================================
// Premises Step
// ============================================================================

interface PremisesStepProps {
  template: ArgumentTemplate;
  filledPremises: Record<string, string>;
  onPremiseChange: (key: string, value: string) => void;
  score: any;
  isScoring: boolean;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

function PremisesStep({
  template,
  filledPremises,
  onPremiseChange,
  score,
  isScoring,
  onNext,
  onBack,
  canProceed,
}: PremisesStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>Fill in Premises</CardTitle>
        <CardDescription>
          Complete each premise with specific evidence and details
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Premises */}
        {template.premises.map((premise, idx) => (
          <div key={premise.key} className="space-y-3">
            <div className="flex items-start justify-between">
              <Label htmlFor={premise.key} className="text-base">
                Premise {idx + 1}
                {premise.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {score?.premiseScores?.[premise.key] !== undefined && (
                <Badge
                  variant={
                    score.premiseScores[premise.key] >= 70
                      ? "default"
                      : score.premiseScores[premise.key] >= 40
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {Math.round(score.premiseScores[premise.key])}%
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground italic">{premise.content}</p>

            {premise.evidenceType && (
              <p className="text-xs text-muted-foreground">
                Evidence type: <span className="font-medium">{premise.evidenceType}</span>
              </p>
            )}

            <Textarea
              id={premise.key}
              value={filledPremises[premise.key] || ""}
              onChange={(e) => onPremiseChange(premise.key, e.target.value)}
              placeholder={`Enter ${premise.required ? "required" : "optional"} premise...`}
              rows={4}
              className="resize-none"
            />

            {/* Individual premise feedback */}
            {score?.premiseScores?.[premise.key] !== undefined &&
              filledPremises[premise.key] &&
              score.premiseScores[premise.key] < 50 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    This premise could be stronger. Try adding more specific details, names,
                    dates, or citations.
                  </AlertDescription>
                </Alert>
              )}
          </div>
        ))}

        <Separator />

        {/* Overall feedback */}
        {score && (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Suggestions for Improvement
            </h3>

            {score.missingElements.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {score.missingElements.map((element: string, idx: number) => (
                      <li key={idx}>{element}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {score.suggestions.length > 0 && (
              <div className="space-y-2">
                {score.suggestions.map((suggestion: string, idx: number) => (
                  <div
                    key={idx}
                    className="text-sm text-muted-foreground bg-muted p-2 rounded flex items-start gap-2"
                  >
                    <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={onNext} disabled={!canProceed}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {!canProceed && (
          <p className="text-sm text-muted-foreground text-center">
            Complete all required premises to continue
          </p>
        )}
      </CardContent>
    </>
  );
}

// ============================================================================
// Evidence Step
// ============================================================================

interface EvidenceStepProps {
  template: ArgumentTemplate;
  filledPremises: Record<string, string>;
  evidenceLinks: Record<string, string[]>;
  onEvidenceChange: (links: Record<string, string[]>) => void;
  onNext: () => void;
  onBack: () => void;
}

function EvidenceStep({
  template,
  filledPremises,
  evidenceLinks,
  onEvidenceChange,
  onNext,
  onBack,
}: EvidenceStepProps) {
  function addEvidenceLink(premiseKey: string, link: string) {
    onEvidenceChange({
      ...evidenceLinks,
      [premiseKey]: [...(evidenceLinks[premiseKey] || []), link],
    });
  }

  function removeEvidenceLink(premiseKey: string, idx: number) {
    const updated = [...(evidenceLinks[premiseKey] || [])];
    updated.splice(idx, 1);
    onEvidenceChange({
      ...evidenceLinks,
      [premiseKey]: updated,
    });
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Add Supporting Evidence</CardTitle>
        <CardDescription>
          Optional: Link to sources, studies, or documents that support your premises
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {template.premises
          .filter((p) => filledPremises[p.key])
          .map((premise, idx) => (
            <div key={premise.key} className="space-y-3">
              <h3 className="font-medium">Premise {idx + 1}: Evidence Links</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {filledPremises[premise.key]}
              </p>

              {/* Existing links */}
              {evidenceLinks[premise.key]?.map((link, linkIdx) => (
                <div key={linkIdx} className="flex items-center gap-2">
                  <Input value={link} readOnly />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEvidenceLink(premise.key, linkIdx)}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              {/* Add new link */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="https://example.com/source"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        addEvidenceLink(premise.key, input.value.trim());
                        input.value = "";
                      }
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    const input = (e.target as HTMLElement)
                      .closest("div")
                      ?.querySelector("input");
                    if (input?.value.trim()) {
                      addEvidenceLink(premise.key, input.value.trim());
                      input.value = "";
                    }
                  }}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

        <Separator />

        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Tip:</strong> Adding credible sources strengthens your argument and shows
            you've done research. Links to academic papers, news articles, or official
            documents are especially valuable.
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={onNext}>
            Continue to Review <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </>
  );
}

// ============================================================================
// Review Step
// ============================================================================

interface ReviewStepProps {
  template: ArgumentTemplate;
  filledPremises: Record<string, string>;
  evidenceLinks: Record<string, string[]>;
  score: any;
  suggestion: AttackSuggestion;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
  canSubmit: boolean;
}

function ReviewStep({
  template,
  filledPremises,
  evidenceLinks,
  score,
  suggestion,
  onSubmit,
  onBack,
  isSubmitting,
  error,
  canSubmit,
}: ReviewStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>Review Your Attack</CardTitle>
        <CardDescription>Check everything before submitting</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score summary */}
        <div className="space-y-3">
          <h3 className="font-medium">Argument Quality</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress
                value={score?.overallScore || 0}
                className={`h-3 ${
                  (score?.overallScore || 0) >= 70
                    ? "bg-green-200"
                    : (score?.overallScore || 0) >= 40
                    ? "bg-yellow-200"
                    : "bg-red-200"
                }`}
              />
            </div>
            <Badge
              variant={
                (score?.overallScore || 0) >= 70
                  ? "default"
                  : (score?.overallScore || 0) >= 40
                  ? "secondary"
                  : "destructive"
              }
              className="text-lg px-3 py-1"
            >
              {Math.round(score?.overallScore || 0)}%
            </Badge>
          </div>

          {(score?.overallScore || 0) < 70 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your argument could be stronger. Consider going back to improve weak premises
                or add more evidence.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Argument preview */}
        <div className="space-y-3">
          <h3 className="font-medium">Your Argument</h3>

          <div className="bg-muted p-4 rounded-lg space-y-4">
            {/* Attack type */}
            <div className="flex items-center gap-2">
              <Badge>{suggestion.attackType}</Badge>
              <span className="text-sm text-muted-foreground">
                attacking {suggestion.targetScope}
              </span>
            </div>

            {/* Premises */}
            {template.premises
              .filter((p) => filledPremises[p.key])
              .map((premise, idx) => (
                <div key={premise.key} className="space-y-2">
                  <p className="text-sm font-medium">Premise {idx + 1}:</p>
                  <p className="text-sm pl-4 border-l-2 border-primary">
                    {filledPremises[premise.key]}
                  </p>

                  {/* Evidence links */}
                  {evidenceLinks[premise.key]?.length > 0 && (
                    <div className="pl-4 space-y-1">
                      <p className="text-xs text-muted-foreground">Sources:</p>
                      {evidenceLinks[premise.key].map((link, linkIdx) => (
                        <a
                          key={linkIdx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline block"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            {/* Conclusion */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium">Therefore:</p>
              <p className="text-sm pl-4 border-l-2 border-primary font-medium">
                {template.conclusion}
              </p>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Attack"}
          </Button>
        </div>

        {!canSubmit && (
          <p className="text-sm text-muted-foreground text-center">
            Argument quality must be at least 40% to submit
          </p>
        )}
      </CardContent>
    </>
  );
}

// ============================================================================
// Loading & Error States
// ============================================================================

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg font-medium mb-2">Failed to load template</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={onRetry}>Try Again</Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Analytics Helper
// ============================================================================

function trackArgumentCreation(data: {
  schemeId: string;
  attackType: string;
  score: number;
  usedSuggestion: boolean;
}) {
  // Track with your analytics service
  if (typeof window !== "undefined" && (window as any).analytics) {
    (window as any).analytics.track("Argument Created", data);
  }
}
```

## Integration with AttackSuggestions

**File**: `app/(app)/deliberations/[id]/claims/[claimId]/attack/page.tsx` (updated)

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AttackSuggestions } from "@/components/argumentation/AttackSuggestions";
import { AttackConstructionWizard } from "@/components/argumentation/AttackConstructionWizard";
import type { AttackSuggestion } from "@/app/server/services/ArgumentGenerationService";

export default function AttackClaimPage({
  params,
}: {
  params: { id: string; claimId: string };
}) {
  const router = useRouter();
  const [selectedAttack, setSelectedAttack] = useState<AttackSuggestion | null>(null);

  function handleComplete(argumentId: string) {
    // Navigate to the new argument
    router.push(`/deliberations/${params.id}/arguments/${argumentId}`);
  }

  function handleCancel() {
    setSelectedAttack(null);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Attack This Claim</h1>
        <p className="text-muted-foreground">
          Select a strategic attack or construct your own
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Attack suggestions */}
        <div className={selectedAttack ? "lg:sticky lg:top-4 lg:h-fit" : ""}>
          <AttackSuggestions
            targetClaimId={params.claimId}
            onAttackSelect={setSelectedAttack}
          />
        </div>

        {/* Right: Construction wizard */}
        {selectedAttack ? (
          <AttackConstructionWizard
            suggestion={selectedAttack}
            claimId={params.claimId}
            deliberationId={params.id}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">
              Select an attack suggestion to begin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Testing

**File**: `components/argumentation/__tests__/AttackConstructionWizard.test.tsx`

```typescript
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AttackConstructionWizard } from "../AttackConstructionWizard";
import * as scoringHook from "@/app/hooks/useArgumentScoring";

// Mock hooks
jest.mock("@/app/hooks/useArgumentScoring");

describe("AttackConstructionWizard", () => {
  const mockSuggestion = {
    id: "attack-1",
    cq: { id: "cq-1", question: "Is the expert qualified?" },
    attackType: "UNDERMINES",
    targetScope: "premise",
    burdenOfProof: "proponent",
    requiresEvidence: false,
    reasoning: "Test reasoning",
    exampleAttacks: ["Example 1"],
    evidenceTypes: [],
    strategicValue: 85,
    strengthScore: 80,
    difficultyScore: 30,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock scoring hook
    (scoringHook.useArgumentScoring as jest.Mock).mockReturnValue({
      score: {
        overallScore: 75,
        premiseScores: { "premise-1": 80, "premise-2": 70 },
        missingElements: [],
        suggestions: [],
      },
      isScoring: false,
      error: null,
    });

    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        template: {
          schemeId: "expert-opinion",
          schemeName: "Expert Opinion",
          premises: [
            {
              key: "premise-1",
              content: "Expert is qualified",
              required: true,
              type: "ordinary",
            },
            {
              key: "premise-2",
              content: "Expert makes assertion",
              required: true,
              type: "ordinary",
            },
          ],
          conclusion: "The expert's claim is unreliable",
          variables: {},
          prefilledPremises: {},
          prefilledVariables: {},
          constructionSteps: ["Step 1", "Step 2"],
          evidenceRequirements: ["Evidence 1"],
        },
      }),
    });
  });

  it("should show overview step initially", async () => {
    render(
      <AttackConstructionWizard
        suggestion={mockSuggestion}
        claimId="claim-1"
        deliberationId="delib-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Attack Strategy Overview")).toBeInTheDocument();
    });

    expect(screen.getByText("Is the expert qualified?")).toBeInTheDocument();
    expect(screen.getByText("Why This Attack Works")).toBeInTheDocument();
  });

  it("should navigate through steps", async () => {
    render(
      <AttackConstructionWizard
        suggestion={mockSuggestion}
        claimId="claim-1"
        deliberationId="delib-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Begin Construction")).toBeInTheDocument();
    });

    // Go to premises step
    fireEvent.click(screen.getByText("Begin Construction"));

    await waitFor(() => {
      expect(screen.getByText("Fill in Premises")).toBeInTheDocument();
    });

    // Should see premise inputs
    expect(screen.getByText("Premise 1")).toBeInTheDocument();
    expect(screen.getByText("Premise 2")).toBeInTheDocument();
  });

  it("should fill premises and show real-time scoring", async () => {
    render(
      <AttackConstructionWizard
        suggestion={mockSuggestion}
        claimId="claim-1"
        deliberationId="delib-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Begin Construction")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Begin Construction"));

    await waitFor(() => {
      expect(screen.getByText("Fill in Premises")).toBeInTheDocument();
    });

    // Fill first premise
    const textarea1 = screen.getAllByRole("textbox")[0];
    fireEvent.change(textarea1, {
      target: { value: "Dr. Smith lacks credentials in climate science" },
    });

    // Should show score
    expect(screen.getByText("80%")).toBeInTheDocument(); // premise score
  });

  it("should prevent proceeding with incomplete premises", async () => {
    render(
      <AttackConstructionWizard
        suggestion={mockSuggestion}
        claimId="claim-1"
        deliberationId="delib-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Begin Construction")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Begin Construction"));

    await waitFor(() => {
      expect(screen.getByText("Fill in Premises")).toBeInTheDocument();
    });

    // Try to continue without filling required premises
    const continueButton = screen.getByText("Continue");
    expect(continueButton).toBeDisabled();
  });

  it("should add and remove evidence links", async () => {
    render(
      <AttackConstructionWizard
        suggestion={mockSuggestion}
        claimId="claim-1"
        deliberationId="delib-1"
      />
    );

    // Navigate to evidence step
    await waitFor(() => {
      expect(screen.getByText("Begin Construction")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Begin Construction"));

    await waitFor(() => {
      expect(screen.getByText("Fill in Premises")).toBeInTheDocument();
    });

    // Fill premises
    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[0], { target: { value: "Premise 1 content" } });
    fireEvent.change(textareas[1], { target: { value: "Premise 2 content" } });

    // Continue to evidence
    fireEvent.click(screen.getByText("Continue"));

    await waitFor(() => {
      expect(screen.getByText("Add Supporting Evidence")).toBeInTheDocument();
    });

    // Add evidence link
    const linkInput = screen.getByPlaceholderText("https://example.com/source");
    fireEvent.change(linkInput, {
      target: { value: "https://example.com/study" },
    });
    fireEvent.keyDown(linkInput, { key: "Enter" });

    // Should show the link
    expect(screen.getByDisplayValue("https://example.com/study")).toBeInTheDocument();

    // Remove link
    fireEvent.click(screen.getByText("Remove"));
    expect(
      screen.queryByDisplayValue("https://example.com/study")
    ).not.toBeInTheDocument();
  });

  it("should show complete argument in review step", async () => {
    render(
      <AttackConstructionWizard
        suggestion={mockSuggestion}
        claimId="claim-1"
        deliberationId="delib-1"
      />
    );

    // Navigate through all steps
    await waitFor(() => {
      expect(screen.getByText("Begin Construction")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Begin Construction"));

    await waitFor(() => {
      expect(screen.getByText("Fill in Premises")).toBeInTheDocument();
    });

    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[0], { target: { value: "Premise 1 text" } });
    fireEvent.change(textareas[1], { target: { value: "Premise 2 text" } });

    fireEvent.click(screen.getByText("Continue"));

    await waitFor(() => {
      expect(screen.getByText("Add Supporting Evidence")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Continue to Review/));

    await waitFor(() => {
      expect(screen.getByText("Review Your Attack")).toBeInTheDocument();
    });

    // Should show filled premises
    expect(screen.getByText("Premise 1 text")).toBeInTheDocument();
    expect(screen.getByText("Premise 2 text")).toBeInTheDocument();
    expect(screen.getByText("The expert's claim is unreliable")).toBeInTheDocument();

    // Should show overall score
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("should submit argument", async () => {
    const mockOnComplete = jest.fn();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ template: { /* ... */ } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ argument: { id: "new-arg-1" } }),
      });

    render(
      <AttackConstructionWizard
        suggestion={mockSuggestion}
        claimId="claim-1"
        deliberationId="delib-1"
        onComplete={mockOnComplete}
      />
    );

    // Navigate to review and submit
    // ... (same navigation as previous test)

    await waitFor(() => {
      expect(screen.getByText("Submit Attack")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Submit Attack"));

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith("new-arg-1");
    });
  });

  it("should handle submission errors", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ template: { /* ... */ } }),
      })
      .mockRejectedValueOnce(new Error("Network error"));

    render(
      <AttackConstructionWizard
        suggestion={mockSuggestion}
        claimId="claim-1"
        deliberationId="delib-1"
      />
    );

    // Navigate to review and try to submit
    // ...

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
```

## Time Allocation

- Wizard structure & step navigation: 3 hours
- Overview & premises steps: 3 hours
- Evidence & review steps: 2 hours
- Real-time scoring integration: 2 hours
- Testing: 2 hours

## Deliverables

- ✅ `AttackConstructionWizard` component with 4-step flow
- ✅ Overview step with attack summary
- ✅ Premises step with real-time scoring feedback
- ✅ Evidence step with link management
- ✅ Review step with complete preview
- ✅ Progress indicator with step navigation
- ✅ Validation preventing incomplete submission
- ✅ Integration with `useArgumentScoring` hook
- ✅ Comprehensive test suite
- ✅ Analytics tracking

---

*[Continuing with Steps 3.2.3-3.2.5...]*
