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

*[Document continues with Steps 3.2.2-3.2.5...]*

**Status**: Step 3.2.1 complete. Ready to continue with Step 3.2.2 (AttackConstructionWizard).

Shall I continue with the remaining steps?
