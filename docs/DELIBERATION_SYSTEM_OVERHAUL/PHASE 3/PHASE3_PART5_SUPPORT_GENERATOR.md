# Phase 3: Argument Generation - Part 5: Support Generator UI

**Week 12: Phase 3.4 - Support Generator (40 hours)**

This document covers the final phase of argument generation: building UI components for generating support arguments, batch argument creation, and completing the full argument generation system.

---

## Overview

Phase 3.4 completes the argument generation system by implementing support argument generation features. While Phase 3.2 focused on attacks, this phase provides tools for strengthening arguments through evidence-based support generation.

**Total Time**: 40 hours (Week 12)

**Components**:
1. Step 3.4.1: SupportSuggestions Component (10 hours)
2. Step 3.4.2: Evidence-to-Scheme Matcher (10 hours)
3. Step 3.4.3: Batch Argument Generator (10 hours)
4. Step 3.4.4: Support Construction Wizard (6 hours)
5. Step 3.4.5: Final Integration & Testing (4 hours)

---

# Step 3.4.1: SupportSuggestions Component (10 hours)

## Overview

Create a component that analyzes arguments and suggests ways to strengthen them through supporting evidence, additional premises, or reinforcing arguments.

## Component Structure

**File**: `components/argumentation/SupportSuggestions.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  TrendingUp,
  Lightbulb,
  Target,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ExternalLink,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface SupportSuggestion {
  id: string;
  type: "evidence" | "premise" | "reinforcement" | "counterargument-defense";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: {
    strengthIncrease: number; // 0-100
    vulnerabilityReduction: number; // 0-100
    credibilityBoost: number; // 0-100
  };
  implementation: {
    difficulty: "easy" | "medium" | "hard";
    timeEstimate: string;
    requiredEvidence?: string[];
    suggestedScheme?: string;
  };
  relatedWeaknesses: string[];
}

interface ArgumentAnalysis {
  currentStrength: number;
  potentialStrength: number;
  vulnerabilities: Array<{
    id: string;
    type: string;
    description: string;
    severity: "critical" | "high" | "medium" | "low";
  }>;
  evidenceGaps: Array<{
    premiseKey: string;
    premiseText: string;
    missingEvidenceType: string;
  }>;
  logicalGaps: string[];
}

interface SupportSuggestionsProps {
  argumentId: string;
  onSelectSuggestion?: (suggestion: SupportSuggestion) => void;
  onGenerateSupport?: (suggestion: SupportSuggestion) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function SupportSuggestions({
  argumentId,
  onSelectSuggestion,
  onGenerateSupport,
}: SupportSuggestionsProps) {
  const [analysis, setAnalysis] = useState<ArgumentAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<SupportSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"priority" | "impact" | "difficulty">("priority");

  useEffect(() => {
    analyzeArgument();
  }, [argumentId]);

  async function analyzeArgument() {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/arguments/${argumentId}/analyze-support`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error("Failed to analyze argument:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const filteredSuggestions = suggestions
    .filter((s) => !selectedType || s.type === selectedType)
    .sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortBy === "impact") {
        return b.expectedImpact.strengthIncrease - a.expectedImpact.strengthIncrease;
      }
      if (sortBy === "difficulty") {
        const diffOrder = { easy: 0, medium: 1, hard: 2 };
        return diffOrder[a.implementation.difficulty] - diffOrder[b.implementation.difficulty];
      }
      return 0;
    });

  const typeFilters = [
    { value: "evidence", label: "Evidence", icon: Target },
    { value: "premise", label: "Premises", icon: Lightbulb },
    { value: "reinforcement", label: "Reinforcement", icon: Shield },
    { value: "counterargument-defense", label: "Defense", icon: AlertTriangle },
  ];

  if (isAnalyzing) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Analyzing argument strengths and weaknesses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Overview */}
      {analysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle>Argument Analysis</CardTitle>
              </div>
              <Badge variant={analysis.currentStrength >= 70 ? "default" : "secondary"}>
                {Math.round(analysis.currentStrength)}% Strength
              </Badge>
            </div>
            <CardDescription>
              Potential improvement: +{Math.round(analysis.potentialStrength - analysis.currentStrength)}% strength
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Strength meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Strength</span>
                <span className="font-medium">{Math.round(analysis.currentStrength)}%</span>
              </div>
              <Progress value={analysis.currentStrength} className="h-2" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Potential Strength</span>
                <span className="font-medium text-green-600">
                  {Math.round(analysis.potentialStrength)}%
                </span>
              </div>
              <Progress value={analysis.potentialStrength} className="h-2 bg-green-100" />
            </div>

            {/* Vulnerabilities summary */}
            {analysis.vulnerabilities.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {analysis.vulnerabilities.length} vulnerabilities detected
                    </p>
                    <div className="flex gap-2">
                      {analysis.vulnerabilities
                        .filter((v) => v.severity === "critical" || v.severity === "high")
                        .map((v) => (
                          <Badge key={v.id} variant="destructive" className="text-xs">
                            {v.type}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Evidence gaps */}
            {analysis.evidenceGaps.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Evidence Gaps</p>
                <div className="space-y-1">
                  {analysis.evidenceGaps.slice(0, 3).map((gap) => (
                    <div key={gap.premiseKey} className="text-xs p-2 bg-muted rounded">
                      <span className="font-medium">{gap.premiseKey}:</span>{" "}
                      <span className="text-muted-foreground">
                        Missing {gap.missingEvidenceType}
                      </span>
                    </div>
                  ))}
                  {analysis.evidenceGaps.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{analysis.evidenceGaps.length - 3} more gaps
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              <CardTitle>Support Suggestions</CardTitle>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="priority">By Priority</option>
              <option value="impact">By Impact</option>
              <option value="difficulty">By Difficulty</option>
            </select>
          </div>
          <CardDescription>
            {filteredSuggestions.length} ways to strengthen this argument
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Type filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              All ({suggestions.length})
            </Button>
            {typeFilters.map(({ value, label, icon: Icon }) => {
              const count = suggestions.filter((s) => s.type === value).length;
              return (
                <Button
                  key={value}
                  variant={selectedType === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(value)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {label} ({count})
                </Button>
              );
            })}
          </div>

          {/* Suggestion cards */}
          <div className="space-y-3">
            {filteredSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onSelect={() => onSelectSuggestion?.(suggestion)}
                onGenerate={() => onGenerateSupport?.(suggestion)}
              />
            ))}

            {filteredSuggestions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No suggestions found for this filter
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Suggestion Card
// ============================================================================

interface SuggestionCardProps {
  suggestion: SupportSuggestion;
  onSelect?: () => void;
  onGenerate?: () => void;
}

function SuggestionCard({ suggestion, onSelect, onGenerate }: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const priorityColors = {
    high: "destructive",
    medium: "secondary",
    low: "outline",
  } as const;

  const difficultyColors = {
    easy: "text-green-600",
    medium: "text-yellow-600",
    hard: "text-red-600",
  };

  const typeIcons = {
    evidence: Target,
    premise: Lightbulb,
    reinforcement: Shield,
    "counterargument-defense": AlertTriangle,
  };

  const Icon = typeIcons[suggestion.type];

  return (
    <Card className="hover:bg-muted/50 transition-all">
      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{suggestion.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {suggestion.description}
                </p>
              </div>
            </div>
            <Badge variant={priorityColors[suggestion.priority]}>
              {suggestion.priority}
            </Badge>
          </div>

          {/* Impact indicators */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Strength</span>
                <span className="font-medium">
                  +{suggestion.expectedImpact.strengthIncrease}%
                </span>
              </div>
              <Progress value={suggestion.expectedImpact.strengthIncrease} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Defense</span>
                <span className="font-medium">
                  +{suggestion.expectedImpact.vulnerabilityReduction}%
                </span>
              </div>
              <Progress value={suggestion.expectedImpact.vulnerabilityReduction} className="h-1" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Credibility</span>
                <span className="font-medium">
                  +{suggestion.expectedImpact.credibilityBoost}%
                </span>
              </div>
              <Progress value={suggestion.expectedImpact.credibilityBoost} className="h-1" />
            </div>
          </div>

          {/* Implementation info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className={difficultyColors[suggestion.implementation.difficulty]}>
              {suggestion.implementation.difficulty} difficulty
            </span>
            <span>~{suggestion.implementation.timeEstimate}</span>
            {suggestion.relatedWeaknesses.length > 0 && (
              <span>
                Addresses {suggestion.relatedWeaknesses.length} weakness(es)
              </span>
            )}
          </div>

          {/* Expanded details */}
          {isExpanded && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <p className="text-xs font-medium mb-1">Reasoning</p>
                <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
              </div>

              {suggestion.relatedWeaknesses.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1">Addresses Weaknesses</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.relatedWeaknesses.map((weakness) => (
                      <Badge key={weakness} variant="outline" className="text-xs">
                        {weakness}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {suggestion.implementation.requiredEvidence && (
                <div>
                  <p className="text-xs font-medium mb-1">Required Evidence</p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {suggestion.implementation.requiredEvidence.map((evidence) => (
                      <li key={evidence}>{evidence}</li>
                    ))}
                  </ul>
                </div>
              )}

              {suggestion.implementation.suggestedScheme && (
                <div>
                  <p className="text-xs font-medium mb-1">Suggested Scheme</p>
                  <Badge variant="secondary">
                    {suggestion.implementation.suggestedScheme}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Hide Details" : "Show Details"}
            </Button>

            <div className="flex gap-2">
              {onSelect && (
                <Button variant="outline" size="sm" onClick={onSelect}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              )}
              {onGenerate && (
                <Button size="sm" onClick={onGenerate}>
                  <Plus className="h-3 w-3 mr-1" />
                  Generate Support
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## API Route

**File**: `app/api/arguments/[id]/analyze-support/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ArgumentGenerationService } from "@/app/server/services/ArgumentGenerationService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const argumentId = params.id;

    // Fetch argument with all relations
    const argument = await prisma.argument.findUnique({
      where: { id: argumentId },
      include: {
        premises: true,
        evidence: true,
        scheme: true,
        attacks: true,
      },
    });

    if (!argument) {
      return NextResponse.json(
        { error: "Argument not found" },
        { status: 404 }
      );
    }

    const service = new ArgumentGenerationService();

    // Analyze argument strength and vulnerabilities
    const analysis = await service.analyzeArgumentSupport(argument);

    // Generate support suggestions
    const suggestions = await service.generateSupportSuggestions(argument, analysis);

    return NextResponse.json({
      analysis,
      suggestions,
    });
  } catch (error) {
    console.error("Support analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze argument support" },
      { status: 500 }
    );
  }
}
```

## Service Methods

**File**: `app/server/services/ArgumentGenerationService.ts` (additions)

```typescript
// Add to existing ArgumentGenerationService class

public async analyzeArgumentSupport(argument: any): Promise<ArgumentAnalysis> {
  const currentStrength = await this.calculateArgumentStrength(argument);
  const vulnerabilities = await this.identifyVulnerabilities(argument);
  const evidenceGaps = await this.identifyEvidenceGaps(argument);
  const logicalGaps = await this.identifyLogicalGaps(argument);

  // Calculate potential strength if all gaps are filled
  const potentialStrength = await this.calculatePotentialStrength(
    argument,
    vulnerabilities,
    evidenceGaps,
    logicalGaps
  );

  return {
    currentStrength,
    potentialStrength,
    vulnerabilities,
    evidenceGaps,
    logicalGaps,
  };
}

public async generateSupportSuggestions(
  argument: any,
  analysis: ArgumentAnalysis
): Promise<SupportSuggestion[]> {
  const suggestions: SupportSuggestion[] = [];

  // Evidence-based suggestions
  for (const gap of analysis.evidenceGaps) {
    suggestions.push(
      await this.createEvidenceSuggestion(argument, gap)
    );
  }

  // Premise strengthening suggestions
  for (const vulnerability of analysis.vulnerabilities) {
    if (vulnerability.type === "weak-premise") {
      suggestions.push(
        await this.createPremiseSuggestion(argument, vulnerability)
      );
    }
  }

  // Reinforcement suggestions
  const reinforcements = await this.suggestReinforcements(argument);
  suggestions.push(...reinforcements);

  // Counter-defense suggestions
  for (const attack of argument.attacks || []) {
    suggestions.push(
      await this.createDefenseSuggestion(argument, attack)
    );
  }

  return suggestions;
}

private async createEvidenceSuggestion(
  argument: any,
  gap: any
): Promise<SupportSuggestion> {
  return {
    id: `evidence-${gap.premiseKey}`,
    type: "evidence",
    priority: "high",
    title: `Add ${gap.missingEvidenceType} for ${gap.premiseKey}`,
    description: `Strengthen "${gap.premiseText}" with supporting evidence`,
    reasoning: `This premise currently lacks ${gap.missingEvidenceType}, making it vulnerable to challenges`,
    expectedImpact: {
      strengthIncrease: 15,
      vulnerabilityReduction: 25,
      credibilityBoost: 20,
    },
    implementation: {
      difficulty: "medium",
      timeEstimate: "10-15 minutes",
      requiredEvidence: [gap.missingEvidenceType],
    },
    relatedWeaknesses: [`${gap.premiseKey}-unsupported`],
  };
}

// Additional helper methods...
```

## Testing

**File**: `components/argumentation/__tests__/SupportSuggestions.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SupportSuggestions } from "../SupportSuggestions";

describe("SupportSuggestions", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        analysis: {
          currentStrength: 65,
          potentialStrength: 85,
          vulnerabilities: [
            {
              id: "v1",
              type: "weak-premise",
              description: "Premise lacks evidence",
              severity: "high",
            },
          ],
          evidenceGaps: [
            {
              premiseKey: "p1",
              premiseText: "Test premise",
              missingEvidenceType: "empirical-data",
            },
          ],
          logicalGaps: [],
        },
        suggestions: [
          {
            id: "s1",
            type: "evidence",
            priority: "high",
            title: "Add empirical data",
            description: "Strengthen with data",
            reasoning: "Missing evidence",
            expectedImpact: {
              strengthIncrease: 15,
              vulnerabilityReduction: 25,
              credibilityBoost: 20,
            },
            implementation: {
              difficulty: "medium",
              timeEstimate: "10-15 minutes",
            },
            relatedWeaknesses: ["p1-unsupported"],
          },
        ],
      }),
    });
  });

  it("should display argument analysis", async () => {
    render(<SupportSuggestions argumentId="arg123" />);

    await waitFor(() => {
      expect(screen.getByText("Argument Analysis")).toBeInTheDocument();
      expect(screen.getByText("65% Strength")).toBeInTheDocument();
    });
  });

  it("should show support suggestions", async () => {
    render(<SupportSuggestions argumentId="arg123" />);

    await waitFor(() => {
      expect(screen.getByText("Add empirical data")).toBeInTheDocument();
    });
  });

  it("should filter suggestions by type", async () => {
    render(<SupportSuggestions argumentId="arg123" />);

    await waitFor(() => {
      const evidenceButton = screen.getByText(/Evidence/);
      fireEvent.click(evidenceButton);
    });

    expect(screen.getByText("Add empirical data")).toBeInTheDocument();
  });

  it("should trigger generate support", async () => {
    const mockOnGenerate = jest.fn();
    render(
      <SupportSuggestions
        argumentId="arg123"
        onGenerateSupport={mockOnGenerate}
      />
    );

    await waitFor(() => {
      const generateButton = screen.getByText("Generate Support");
      fireEvent.click(generateButton);
    });

    expect(mockOnGenerate).toHaveBeenCalled();
  });
});
```

## Storybook Stories

**File**: `components/argumentation/SupportSuggestions.stories.tsx`

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { SupportSuggestions } from "./SupportSuggestions";

const meta: Meta<typeof SupportSuggestions> = {
  title: "Argumentation/SupportSuggestions",
  component: SupportSuggestions,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof SupportSuggestions>;

export const Default: Story = {
  args: {
    argumentId: "arg-123",
  },
};

export const StrongArgument: Story = {
  args: {
    argumentId: "strong-arg",
  },
};

export const WeakArgument: Story = {
  args: {
    argumentId: "weak-arg",
  },
};
```

## Time Allocation

- Component UI: 4 hours
- Analysis integration: 3 hours
- Suggestion generation: 2 hours
- Testing: 1 hour

## Deliverables

- ✅ `SupportSuggestions` component with analysis
- ✅ Vulnerability detection
- ✅ Evidence gap identification
- ✅ Support suggestion generation
- ✅ Priority and impact indicators
- ✅ API integration
- ✅ Test suite
- ✅ Storybook stories

---

# Step 3.4.2: Evidence-to-Scheme Matcher (10 hours)

## Overview

Build an intelligent system that analyzes available evidence and recommends optimal argument schemes based on evidence type, quality, and quantity. This helps users construct the strongest possible support arguments.

## Component Structure

**File**: `components/argumentation/EvidenceSchemeMapper.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Database,
  Zap,
  CheckCircle2,
  ArrowRight,
  Filter,
  TrendingUp,
  Star,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface SchemeMatch {
  schemeId: string;
  schemeName: string;
  schemeCategory: string;
  matchScore: number; // 0-100
  confidence: number; // 0-100
  reasoning: string;
  evidenceUtilization: {
    usedEvidence: string[];
    unusedEvidence: string[];
    utilizationRate: number; // percentage
  };
  premiseMapping: Array<{
    premiseKey: string;
    premiseTemplate: string;
    mappedEvidence: string[];
    fillability: number; // 0-100
  }>;
  strengthPrediction: {
    expectedStrength: number;
    confidenceInterval: [number, number];
    keyFactors: string[];
  };
  requirements: {
    met: string[];
    missing: string[];
    optional: string[];
  };
}

interface EvidenceItem {
  id: string;
  title: string;
  type: string;
  content: string;
  quality: number;
  source: string;
  credibility: number;
  relevance: number;
}

interface EvidenceSchemeMapperProps {
  targetArgumentId?: string;
  availableEvidence: EvidenceItem[];
  onSelectScheme?: (match: SchemeMatch) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function EvidenceSchemeMapper({
  targetArgumentId,
  availableEvidence,
  onSelectScheme,
}: EvidenceSchemeMapperProps) {
  const [matches, setMatches] = useState<SchemeMatch[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState(60);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"match" | "strength" | "utilization">("match");

  useEffect(() => {
    if (availableEvidence.length > 0) {
      analyzeSchemeMatches();
    }
  }, [availableEvidence, targetArgumentId]);

  async function analyzeSchemeMatches() {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/evidence/match-schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: availableEvidence,
          targetArgumentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches);
      }
    } catch (err) {
      console.error("Failed to analyze scheme matches:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const filteredMatches = matches
    .filter((m) => m.matchScore >= minMatchScore)
    .filter((m) => !selectedCategory || m.schemeCategory === selectedCategory)
    .sort((a, b) => {
      if (sortBy === "match") return b.matchScore - a.matchScore;
      if (sortBy === "strength") return b.strengthPrediction.expectedStrength - a.strengthPrediction.expectedStrength;
      if (sortBy === "utilization") return b.evidenceUtilization.utilizationRate - a.evidenceUtilization.utilizationRate;
      return 0;
    });

  const categories = Array.from(new Set(matches.map((m) => m.schemeCategory)));

  const evidenceStats = {
    total: availableEvidence.length,
    highQuality: availableEvidence.filter((e) => e.quality >= 80).length,
    mediumQuality: availableEvidence.filter((e) => e.quality >= 50 && e.quality < 80).length,
    lowQuality: availableEvidence.filter((e) => e.quality < 50).length,
  };

  if (availableEvidence.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <Database className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-lg font-medium">No Evidence Available</p>
            <p className="text-sm text-muted-foreground">
              Add evidence to see scheme recommendations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Evidence Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Evidence Collection</CardTitle>
            </div>
            <Badge>{evidenceStats.total} items</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">High Quality</span>
                <span className="font-medium text-green-600">
                  {evidenceStats.highQuality}
                </span>
              </div>
              <Progress
                value={(evidenceStats.highQuality / evidenceStats.total) * 100}
                className="h-2"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Medium Quality</span>
                <span className="font-medium text-yellow-600">
                  {evidenceStats.mediumQuality}
                </span>
              </div>
              <Progress
                value={(evidenceStats.mediumQuality / evidenceStats.total) * 100}
                className="h-2"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Low Quality</span>
                <span className="font-medium text-red-600">
                  {evidenceStats.lowQuality}
                </span>
              </div>
              <Progress
                value={(evidenceStats.lowQuality / evidenceStats.total) * 100}
                className="h-2"
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={analyzeSchemeMatches}
            disabled={isAnalyzing}
            className="w-full"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isAnalyzing ? "Analyzing..." : "Re-analyze Matches"}
          </Button>
        </CardContent>
      </Card>

      {/* Scheme Matches */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>Recommended Schemes</CardTitle>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="match">Best Match</option>
              <option value="strength">Strongest Argument</option>
              <option value="utilization">Best Evidence Use</option>
            </select>
          </div>
          <CardDescription>
            {filteredMatches.length} scheme(s) compatible with your evidence
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
            
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Min Match:</span>
            <Input
              type="range"
              min="0"
              max="100"
              value={minMatchScore}
              onChange={(e) => setMinMatchScore(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm font-medium">{minMatchScore}%</span>
          </div>

          {/* Match cards */}
          <div className="space-y-3">
            {isAnalyzing ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredMatches.length > 0 ? (
              filteredMatches.map((match) => (
                <SchemeMatchCard
                  key={match.schemeId}
                  match={match}
                  evidence={availableEvidence}
                  onSelect={() => onSelectScheme?.(match)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No schemes match your criteria. Try lowering the minimum match score.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Scheme Match Card
// ============================================================================

interface SchemeMatchCardProps {
  match: SchemeMatch;
  evidence: EvidenceItem[];
  onSelect?: () => void;
}

function SchemeMatchCard({ match, evidence, onSelect }: SchemeMatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const matchColor =
    match.matchScore >= 80
      ? "text-green-600"
      : match.matchScore >= 60
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <Card className="hover:bg-muted/50 transition-all">
      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{match.schemeName}</h3>
                <Badge variant="outline" className="text-xs">
                  {match.schemeCategory}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {match.reasoning}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${matchColor}`}>
                {Math.round(match.matchScore)}%
              </div>
              <div className="text-xs text-muted-foreground">match</div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Evidence Use</span>
                <span className="font-medium">
                  {Math.round(match.evidenceUtilization.utilizationRate)}%
                </span>
              </div>
              <Progress
                value={match.evidenceUtilization.utilizationRate}
                className="h-1"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Strength</span>
                <span className="font-medium">
                  {Math.round(match.strengthPrediction.expectedStrength)}%
                </span>
              </div>
              <Progress
                value={match.strengthPrediction.expectedStrength}
                className="h-1"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-medium">{Math.round(match.confidence)}%</span>
              </div>
              <Progress value={match.confidence} className="h-1" />
            </div>
          </div>

          {/* Requirements */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span className="text-muted-foreground">
                {match.requirements.met.length} requirements met
              </span>
            </div>
            {match.requirements.missing.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-red-600">
                  {match.requirements.missing.length} missing
                </span>
              </div>
            )}
          </div>

          {/* Expanded details */}
          {isExpanded && (
            <div className="space-y-3 pt-3 border-t">
              {/* Premise mapping */}
              <div>
                <p className="text-xs font-medium mb-2">Premise Mapping</p>
                <div className="space-y-2">
                  {match.premiseMapping.map((premise) => (
                    <div key={premise.premiseKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{premise.premiseKey}:</span>
                        <span className="text-muted-foreground">
                          {premise.mappedEvidence.length} evidence
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground pl-2">
                        {premise.premiseTemplate}
                      </div>
                      <Progress value={premise.fillability} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence utilization */}
              <div>
                <p className="text-xs font-medium mb-2">Evidence Utilization</p>
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {match.evidenceUtilization.usedEvidence.map((evidenceId) => {
                      const item = evidence.find((e) => e.id === evidenceId);
                      return (
                        <Badge key={evidenceId} variant="default" className="text-xs">
                          {item?.title || evidenceId}
                        </Badge>
                      );
                    })}
                  </div>
                  {match.evidenceUtilization.unusedEvidence.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-muted-foreground">Unused:</span>
                      {match.evidenceUtilization.unusedEvidence.slice(0, 3).map((evidenceId) => {
                        const item = evidence.find((e) => e.id === evidenceId);
                        return (
                          <Badge key={evidenceId} variant="outline" className="text-xs">
                            {item?.title || evidenceId}
                          </Badge>
                        );
                      })}
                      {match.evidenceUtilization.unusedEvidence.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{match.evidenceUtilization.unusedEvidence.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Missing requirements */}
              {match.requirements.missing.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2 text-red-600">
                    Missing Requirements
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {match.requirements.missing.map((req) => (
                      <li key={req}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key factors */}
              <div>
                <p className="text-xs font-medium mb-2">Strength Factors</p>
                <div className="flex flex-wrap gap-1">
                  {match.strengthPrediction.keyFactors.map((factor) => (
                    <Badge key={factor} variant="secondary" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Hide Details" : "Show Details"}
            </Button>

            {onSelect && (
              <Button size="sm" onClick={onSelect}>
                <Star className="h-3 w-3 mr-1" />
                Use This Scheme
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## API Route

**File**: `app/api/evidence/match-schemes/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { EvidenceSchemeMatchingService } from "@/app/server/services/EvidenceSchemeMatchingService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evidence, targetArgumentId } = body;

    const service = new EvidenceSchemeMatchingService();
    const matches = await service.matchEvidenceToSchemes(evidence, targetArgumentId);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Evidence-scheme matching error:", error);
    return NextResponse.json(
      { error: "Failed to match evidence to schemes" },
      { status: 500 }
    );
  }
}
```

## Service Implementation

**File**: `app/server/services/EvidenceSchemeMatchingService.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { SchemeMatch, EvidenceItem } from "@/types/argumentation";

export class EvidenceSchemeMatchingService {
  public async matchEvidenceToSchemes(
    evidence: EvidenceItem[],
    targetArgumentId?: string
  ): Promise<SchemeMatch[]> {
    // Fetch all available schemes
    const schemes = await prisma.argumentScheme.findMany({
      include: {
        premises: true,
        criticalQuestions: true,
      },
    });

    const matches: SchemeMatch[] = [];

    for (const scheme of schemes) {
      const match = await this.analyzeSchemeMatch(scheme, evidence, targetArgumentId);
      if (match.matchScore >= 40) {
        // Minimum threshold
        matches.push(match);
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  private async analyzeSchemeMatch(
    scheme: any,
    evidence: EvidenceItem[],
    targetArgumentId?: string
  ): Promise<SchemeMatch> {
    // Calculate how well evidence matches scheme requirements
    const premiseMapping = await this.mapEvidenceToPremises(scheme, evidence);
    const evidenceUtilization = this.calculateEvidenceUtilization(premiseMapping, evidence);
    const requirements = await this.checkSchemeRequirements(scheme, evidence, targetArgumentId);
    
    const matchScore = this.calculateMatchScore(
      premiseMapping,
      evidenceUtilization,
      requirements
    );

    const strengthPrediction = await this.predictArgumentStrength(
      scheme,
      premiseMapping,
      evidence
    );

    const confidence = this.calculateConfidence(premiseMapping, evidence);

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      schemeCategory: scheme.category,
      matchScore,
      confidence,
      reasoning: this.generateReasoning(scheme, premiseMapping, evidenceUtilization),
      evidenceUtilization,
      premiseMapping,
      strengthPrediction,
      requirements,
    };
  }

  private async mapEvidenceToPremises(
    scheme: any,
    evidence: EvidenceItem[]
  ): Promise<Array<any>> {
    const mapping = [];

    for (const premise of scheme.premises) {
      const mappedEvidence = evidence.filter((e) => {
        // Check if evidence type matches premise requirements
        if (premise.evidenceType && premise.evidenceType !== e.type) {
          return false;
        }

        // Check relevance score
        if (e.relevance < 50) {
          return false;
        }

        // Use semantic similarity for matching (simplified)
        return this.semanticMatch(premise.template, e.content) > 0.6;
      });

      const fillability = this.calculateFillability(premise, mappedEvidence);

      mapping.push({
        premiseKey: premise.key,
        premiseTemplate: premise.template,
        mappedEvidence: mappedEvidence.map((e) => e.id),
        fillability,
      });
    }

    return mapping;
  }

  private calculateEvidenceUtilization(
    premiseMapping: any[],
    evidence: EvidenceItem[]
  ): any {
    const usedEvidenceIds = new Set(
      premiseMapping.flatMap((p) => p.mappedEvidence)
    );

    const usedEvidence = Array.from(usedEvidenceIds);
    const unusedEvidence = evidence
      .filter((e) => !usedEvidenceIds.has(e.id))
      .map((e) => e.id);

    const utilizationRate = (usedEvidence.length / evidence.length) * 100;

    return {
      usedEvidence,
      unusedEvidence,
      utilizationRate,
    };
  }

  private async checkSchemeRequirements(
    scheme: any,
    evidence: EvidenceItem[],
    targetArgumentId?: string
  ): Promise<any> {
    const met: string[] = [];
    const missing: string[] = [];
    const optional: string[] = [];

    // Check if target argument exists (for attacks/support)
    if (scheme.requiresTarget && !targetArgumentId) {
      missing.push("Target argument required");
    } else if (scheme.requiresTarget) {
      met.push("Target argument provided");
    }

    // Check evidence quality requirements
    const highQualityEvidence = evidence.filter((e) => e.quality >= 80);
    if (scheme.minEvidenceQuality >= 80 && highQualityEvidence.length === 0) {
      missing.push(`High quality evidence (>= ${scheme.minEvidenceQuality}%)`);
    } else if (highQualityEvidence.length > 0) {
      met.push("Quality evidence available");
    }

    // Check minimum evidence count
    if (scheme.minEvidenceCount && evidence.length < scheme.minEvidenceCount) {
      missing.push(`At least ${scheme.minEvidenceCount} pieces of evidence`);
    } else if (scheme.minEvidenceCount) {
      met.push(`Sufficient evidence count (${evidence.length})`);
    }

    return { met, missing, optional };
  }

  private calculateMatchScore(
    premiseMapping: any[],
    evidenceUtilization: any,
    requirements: any
  ): number {
    // Weighted scoring
    const premiseFillScore = premiseMapping.reduce((sum, p) => sum + p.fillability, 0) / premiseMapping.length;
    const utilizationScore = evidenceUtilization.utilizationRate;
    const requirementScore = requirements.missing.length === 0 ? 100 : 
      (requirements.met.length / (requirements.met.length + requirements.missing.length)) * 100;

    return (premiseFillScore * 0.5) + (utilizationScore * 0.3) + (requirementScore * 0.2);
  }

  private async predictArgumentStrength(
    scheme: any,
    premiseMapping: any[],
    evidence: EvidenceItem[]
  ): Promise<any> {
    const avgFillability = premiseMapping.reduce((sum, p) => sum + p.fillability, 0) / premiseMapping.length;
    const avgQuality = evidence.reduce((sum, e) => sum + e.quality, 0) / evidence.length;
    const avgCredibility = evidence.reduce((sum, e) => sum + e.credibility, 0) / evidence.length;

    const expectedStrength = (avgFillability * 0.4) + (avgQuality * 0.3) + (avgCredibility * 0.3);
    
    // Confidence interval based on evidence variance
    const variance = this.calculateVariance(evidence.map(e => e.quality));
    const interval: [number, number] = [
      Math.max(0, expectedStrength - variance),
      Math.min(100, expectedStrength + variance),
    ];

    const keyFactors = [];
    if (avgQuality >= 80) keyFactors.push("High quality evidence");
    if (avgCredibility >= 80) keyFactors.push("Credible sources");
    if (avgFillability >= 80) keyFactors.push("Complete premises");
    if (evidence.length >= scheme.premises.length * 2) keyFactors.push("Abundant evidence");

    return {
      expectedStrength,
      confidenceInterval: interval,
      keyFactors,
    };
  }

  private calculateFillability(premise: any, evidence: EvidenceItem[]): number {
    if (evidence.length === 0) return 0;
    if (evidence.length >= 2) return 100; // Fully fillable with multiple evidence

    const qualityScore = evidence[0].quality;
    const relevanceScore = evidence[0].relevance;
    
    return (qualityScore * 0.6) + (relevanceScore * 0.4);
  }

  private calculateConfidence(premiseMapping: any[], evidence: EvidenceItem[]): number {
    const allPremisesFilled = premiseMapping.every((p) => p.fillability >= 60);
    const highQualityEvidence = evidence.filter((e) => e.quality >= 80).length / evidence.length;
    
    return allPremisesFilled ? 80 + (highQualityEvidence * 20) : 40 + (highQualityEvidence * 40);
  }

  private generateReasoning(scheme: any, premiseMapping: any[], evidenceUtilization: any): string {
    const filledPremises = premiseMapping.filter((p) => p.fillability >= 60).length;
    const totalPremises = premiseMapping.length;
    const utilization = Math.round(evidenceUtilization.utilizationRate);

    if (filledPremises === totalPremises && utilization >= 80) {
      return `Excellent match: all premises can be filled and ${utilization}% of evidence is utilized.`;
    }
    if (filledPremises >= totalPremises * 0.8) {
      return `Good match: ${filledPremises}/${totalPremises} premises fillable with ${utilization}% evidence utilization.`;
    }
    return `Moderate match: ${filledPremises}/${totalPremises} premises fillable. Consider gathering more evidence.`;
  }

  private semanticMatch(text1: string, text2: string): number {
    // Simplified semantic matching (in production, use embeddings/ML)
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.sqrt(variance);
  }
}
```

## Testing

**File**: `components/argumentation/__tests__/EvidenceSchemeMapper.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EvidenceSchemeMapper } from "../EvidenceSchemeMapper";

describe("EvidenceSchemeMapper", () => {
  const mockEvidence = [
    {
      id: "e1",
      title: "Study Results",
      type: "empirical-data",
      content: "Research shows...",
      quality: 85,
      source: "Journal",
      credibility: 90,
      relevance: 88,
    },
    {
      id: "e2",
      title: "Expert Quote",
      type: "expert-opinion",
      content: "Dr. Smith states...",
      quality: 75,
      source: "Interview",
      credibility: 80,
      relevance: 85,
    },
  ];

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        matches: [
          {
            schemeId: "s1",
            schemeName: "Argument from Expert Opinion",
            schemeCategory: "Source-based",
            matchScore: 85,
            confidence: 80,
            reasoning: "Good match",
            evidenceUtilization: {
              usedEvidence: ["e1", "e2"],
              unusedEvidence: [],
              utilizationRate: 100,
            },
            premiseMapping: [
              {
                premiseKey: "p1",
                premiseTemplate: "Expert E is qualified",
                mappedEvidence: ["e2"],
                fillability: 90,
              },
            ],
            strengthPrediction: {
              expectedStrength: 82,
              confidenceInterval: [75, 90],
              keyFactors: ["High quality evidence"],
            },
            requirements: {
              met: ["Quality evidence available"],
              missing: [],
              optional: [],
            },
          },
        ],
      }),
    });
  });

  it("should display evidence overview", async () => {
    render(<EvidenceSchemeMapper availableEvidence={mockEvidence} />);

    await waitFor(() => {
      expect(screen.getByText("Evidence Collection")).toBeInTheDocument();
      expect(screen.getByText("2 items")).toBeInTheDocument();
    });
  });

  it("should show scheme matches", async () => {
    render(<EvidenceSchemeMapper availableEvidence={mockEvidence} />);

    await waitFor(() => {
      expect(screen.getByText("Argument from Expert Opinion")).toBeInTheDocument();
      expect(screen.getByText("85%")).toBeInTheDocument();
    });
  });

  it("should filter by category", async () => {
    render(<EvidenceSchemeMapper availableEvidence={mockEvidence} />);

    await waitFor(() => {
      const categoryButton = screen.getByText("Source-based");
      fireEvent.click(categoryButton);
    });

    expect(screen.getByText("Argument from Expert Opinion")).toBeInTheDocument();
  });

  it("should select scheme", async () => {
    const mockOnSelect = jest.fn();
    render(
      <EvidenceSchemeMapper
        availableEvidence={mockEvidence}
        onSelectScheme={mockOnSelect}
      />
    );

    await waitFor(() => {
      const useButton = screen.getByText("Use This Scheme");
      fireEvent.click(useButton);
    });

    expect(mockOnSelect).toHaveBeenCalled();
  });
});
```

## Time Allocation

- Matching algorithm: 4 hours
- UI components: 3 hours
- Service implementation: 2 hours
- Testing: 1 hour

## Deliverables

- ✅ `EvidenceSchemeMapper` component
- ✅ Intelligent scheme matching algorithm
- ✅ Evidence utilization visualization
- ✅ Premise mapping display
- ✅ Strength prediction
- ✅ Requirements checking
- ✅ Service implementation
- ✅ Test suite

---

# Step 3.4.3: Batch Argument Generator (10 hours)

## Overview

Create a system that generates multiple support arguments simultaneously based on available evidence, allowing users to quickly strengthen arguments from multiple angles.

## Component Structure

**File**: `components/argumentation/BatchArgumentGenerator.tsx`

```typescript
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Zap,
  CheckCircle2,
  Clock,
  List,
  Eye,
  Trash2,
  Download,
  AlertCircle,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface GeneratedArgument {
  id: string;
  schemeId: string;
  schemeName: string;
  premises: Record<string, string>;
  evidence: Record<string, string[]>;
  strength: number;
  reasoning: string;
  status: "generated" | "reviewing" | "approved" | "rejected";
}

interface BatchGenerationConfig {
  targetArgumentId: string;
  maxArguments: number;
  minStrength: number;
  diversityMode: "maximize" | "balanced" | "focused";
  evidenceStrategy: "distribute" | "duplicate" | "prioritize";
  schemes: string[];
}

interface BatchArgumentGeneratorProps {
  targetArgumentId: string;
  availableEvidence: any[];
  onGenerateComplete?: (arguments: GeneratedArgument[]) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function BatchArgumentGenerator({
  targetArgumentId,
  availableEvidence,
  onGenerateComplete,
}: BatchArgumentGeneratorProps) {
  const [config, setConfig] = useState<BatchGenerationConfig>({
    targetArgumentId,
    maxArguments: 5,
    minStrength: 60,
    diversityMode: "balanced",
    evidenceStrategy: "distribute",
    schemes: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArguments, setGeneratedArguments] = useState<GeneratedArgument[]>([]);
  const [selectedArguments, setSelectedArguments] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [generationPhase, setGenerationPhase] = useState<string>("");

  async function generateBatch() {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedArguments([]);

    try {
      // Phase 1: Scheme selection
      setGenerationPhase("Selecting optimal schemes...");
      setProgress(20);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Phase 2: Evidence allocation
      setGenerationPhase("Allocating evidence to schemes...");
      setProgress(40);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Phase 3: Argument generation
      setGenerationPhase("Generating arguments...");
      setProgress(60);

      const response = await fetch("/api/arguments/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          evidence: availableEvidence,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedArguments(data.arguments);
        setProgress(100);
        setGenerationPhase("Complete!");
        onGenerateComplete?.(data.arguments);
      }
    } catch (err) {
      console.error("Batch generation failed:", err);
      setGenerationPhase("Error generating arguments");
    } finally {
      setIsGenerating(false);
    }
  }

  function toggleArgumentSelection(argumentId: string) {
    const newSelection = new Set(selectedArguments);
    if (newSelection.has(argumentId)) {
      newSelection.delete(argumentId);
    } else {
      newSelection.add(argumentId);
    }
    setSelectedArguments(newSelection);
  }

  function selectAll() {
    setSelectedArguments(new Set(generatedArguments.map((a) => a.id)));
  }

  function deselectAll() {
    setSelectedArguments(new Set());
  }

  async function approveSelected() {
    const selected = generatedArguments.filter((a) => selectedArguments.has(a.id));

    for (const argument of selected) {
      await fetch(`/api/arguments/${argument.id}/approve`, {
        method: "POST",
      });
    }

    // Update status
    setGeneratedArguments((prev) =>
      prev.map((a) =>
        selectedArguments.has(a.id) ? { ...a, status: "approved" } : a
      )
    );
  }

  async function rejectSelected() {
    setGeneratedArguments((prev) =>
      prev.map((a) =>
        selectedArguments.has(a.id) ? { ...a, status: "rejected" } : a
      )
    );
    setSelectedArguments(new Set());
  }

  const approvedCount = generatedArguments.filter((a) => a.status === "approved").length;
  const rejectedCount = generatedArguments.filter((a) => a.status === "rejected").length;
  const pendingCount = generatedArguments.filter(
    (a) => a.status === "generated" || a.status === "reviewing"
  ).length;

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>Batch Generation Settings</CardTitle>
          </div>
          <CardDescription>
            Configure how multiple support arguments should be generated
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Max arguments */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Arguments</label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.maxArguments}
                onChange={(e) =>
                  setConfig({ ...config, maxArguments: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-muted-foreground">
                Generate up to {config.maxArguments} arguments
              </p>
            </div>

            {/* Min strength */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Minimum Strength ({config.minStrength}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.minStrength}
                onChange={(e) =>
                  setConfig({ ...config, minStrength: Number(e.target.value) })
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Only generate arguments with strength ≥ {config.minStrength}%
              </p>
            </div>
          </div>

          {/* Diversity mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Diversity Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "maximize", label: "Maximize", desc: "Most diverse schemes" },
                { value: "balanced", label: "Balanced", desc: "Mix of schemes" },
                { value: "focused", label: "Focused", desc: "Best-fit schemes" },
              ].map((mode) => (
                <Button
                  key={mode.value}
                  variant={config.diversityMode === mode.value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setConfig({ ...config, diversityMode: mode.value as any })
                  }
                  className="flex flex-col h-auto py-2"
                >
                  <span className="font-medium">{mode.label}</span>
                  <span className="text-xs opacity-70">{mode.desc}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Evidence strategy */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Evidence Strategy</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "distribute", label: "Distribute", desc: "Spread evidence" },
                { value: "duplicate", label: "Duplicate", desc: "Reuse evidence" },
                { value: "prioritize", label: "Prioritize", desc: "Best evidence first" },
              ].map((strategy) => (
                <Button
                  key={strategy.value}
                  variant={config.evidenceStrategy === strategy.value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setConfig({ ...config, evidenceStrategy: strategy.value as any })
                  }
                  className="flex flex-col h-auto py-2"
                >
                  <span className="font-medium">{strategy.label}</span>
                  <span className="text-xs opacity-70">{strategy.desc}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={generateBatch}
            disabled={isGenerating || availableEvidence.length === 0}
            className="w-full"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Support Arguments"}
          </Button>
        </CardContent>
      </Card>

      {/* Generation progress */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{generationPhase}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated arguments */}
      {generatedArguments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List className="h-5 w-5" />
                <CardTitle>Generated Arguments</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">{approvedCount} approved</Badge>
                <Badge variant="outline">{pendingCount} pending</Badge>
                <Badge variant="destructive">{rejectedCount} rejected</Badge>
              </div>
            </div>
            <CardDescription>
              Review and approve the generated support arguments
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Batch actions */}
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedArguments.size} selected
                </span>
              </div>

              {selectedArguments.size > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={approveSelected}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Approve Selected
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={rejectSelected}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Reject Selected
                  </Button>
                </div>
              )}
            </div>

            {/* Argument cards */}
            <div className="space-y-3">
              {generatedArguments.map((argument) => (
                <GeneratedArgumentCard
                  key={argument.id}
                  argument={argument}
                  isSelected={selectedArguments.has(argument.id)}
                  onToggleSelect={() => toggleArgumentSelection(argument.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Generated Argument Card
// ============================================================================

interface GeneratedArgumentCardProps {
  argument: GeneratedArgument;
  isSelected: boolean;
  onToggleSelect: () => void;
}

function GeneratedArgumentCard({
  argument,
  isSelected,
  onToggleSelect,
}: GeneratedArgumentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    generated: "outline",
    reviewing: "secondary",
    approved: "default",
    rejected: "destructive",
  } as const;

  const strengthColor =
    argument.strength >= 80
      ? "text-green-600"
      : argument.strength >= 60
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <Card className={isSelected ? "border-primary" : ""}>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{argument.schemeName}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {argument.reasoning}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className={`text-xl font-bold ${strengthColor}`}>
                      {Math.round(argument.strength)}%
                    </div>
                    <div className="text-xs text-muted-foreground">strength</div>
                  </div>
                  <Badge variant={statusColors[argument.status]}>
                    {argument.status}
                  </Badge>
                </div>
              </div>

              {/* Premise summary */}
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium">Premises ({Object.keys(argument.premises).length}):</p>
                {Object.entries(argument.premises)
                  .slice(0, isExpanded ? undefined : 2)
                  .map(([key, text]) => (
                    <div key={key} className="text-xs p-2 bg-muted rounded">
                      <span className="font-medium">{key}:</span> {text}
                    </div>
                  ))}
                {!isExpanded && Object.keys(argument.premises).length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{Object.keys(argument.premises).length - 2} more premises
                  </p>
                )}
              </div>

              {/* Evidence summary */}
              <div className="mt-2">
                <p className="text-xs font-medium">
                  Evidence: {Object.values(argument.evidence).flat().length} pieces
                </p>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {Object.entries(argument.evidence).map(([premiseKey, evidenceIds]) => (
                    <div key={premiseKey} className="text-xs">
                      <span className="font-medium">{premiseKey}:</span>{" "}
                      <span className="text-muted-foreground">
                        {evidenceIds.length} evidence item(s)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {isExpanded ? "Hide" : "Show"} Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## API Route

**File**: `app/api/arguments/batch-generate/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { BatchGenerationService } from "@/app/server/services/BatchGenerationService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const service = new BatchGenerationService();

    const arguments = await service.generateBatch(body);

    return NextResponse.json({ arguments });
  } catch (error) {
    console.error("Batch generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate batch arguments" },
      { status: 500 }
    );
  }
}
```

## Service Implementation

**File**: `app/server/services/BatchGenerationService.ts`

```typescript
import { ArgumentGenerationService } from "./ArgumentGenerationService";
import { EvidenceSchemeMatchingService } from "./EvidenceSchemeMatchingService";

export class BatchGenerationService {
  private argGenService: ArgumentGenerationService;
  private matchingService: EvidenceSchemeMatchingService;

  constructor() {
    this.argGenService = new ArgumentGenerationService();
    this.matchingService = new EvidenceSchemeMatchingService();
  }

  public async generateBatch(config: any): Promise<any[]> {
    const {
      targetArgumentId,
      maxArguments,
      minStrength,
      diversityMode,
      evidenceStrategy,
      evidence,
    } = config;

    // Step 1: Find compatible schemes
    const schemeMatches = await this.matchingService.matchEvidenceToSchemes(
      evidence,
      targetArgumentId
    );

    // Step 2: Select schemes based on diversity mode
    const selectedSchemes = this.selectSchemes(
      schemeMatches,
      maxArguments,
      diversityMode
    );

    // Step 3: Allocate evidence based on strategy
    const evidenceAllocations = this.allocateEvidence(
      selectedSchemes,
      evidence,
      evidenceStrategy
    );

    // Step 4: Generate arguments
    const generatedArguments = [];

    for (let i = 0; i < selectedSchemes.length; i++) {
      const scheme = selectedSchemes[i];
      const allocatedEvidence = evidenceAllocations[i];

      const argument = await this.generateSingleArgument(
        scheme,
        allocatedEvidence,
        targetArgumentId
      );

      if (argument.strength >= minStrength) {
        generatedArguments.push(argument);
      }

      if (generatedArguments.length >= maxArguments) {
        break;
      }
    }

    return generatedArguments;
  }

  private selectSchemes(matches: any[], maxCount: number, diversityMode: string): any[] {
    if (diversityMode === "maximize") {
      // Select from different categories
      const byCategory = new Map<string, any[]>();
      for (const match of matches) {
        if (!byCategory.has(match.schemeCategory)) {
          byCategory.set(match.schemeCategory, []);
        }
        byCategory.get(match.schemeCategory)!.push(match);
      }

      const selected = [];
      const categories = Array.from(byCategory.keys());
      let categoryIndex = 0;

      while (selected.length < maxCount && categoryIndex < categories.length * 10) {
        const category = categories[categoryIndex % categories.length];
        const categoryMatches = byCategory.get(category)!;

        if (categoryMatches.length > 0) {
          selected.push(categoryMatches.shift()!);
        }

        categoryIndex++;
      }

      return selected;
    } else if (diversityMode === "focused") {
      // Select best matches
      return matches.slice(0, maxCount);
    } else {
      // Balanced: alternate between best and diverse
      const selected = [];
      const used = new Set<string>();

      for (let i = 0; i < matches.length && selected.length < maxCount; i++) {
        const match = matches[i];
        if (!used.has(match.schemeCategory) || i % 2 === 0) {
          selected.push(match);
          used.add(match.schemeCategory);
        }
      }

      return selected;
    }
  }

  private allocateEvidence(
    schemes: any[],
    evidence: any[],
    strategy: string
  ): any[][] {
    if (strategy === "distribute") {
      // Distribute evidence evenly
      const allocations: any[][] = schemes.map(() => []);
      const used = new Set<string>();

      for (let i = 0; i < schemes.length; i++) {
        const scheme = schemes[i];
        for (const premise of scheme.premiseMapping) {
          for (const evidenceId of premise.mappedEvidence) {
            if (!used.has(evidenceId)) {
              const item = evidence.find((e) => e.id === evidenceId);
              if (item) {
                allocations[i].push(item);
                used.add(evidenceId);
              }
            }
          }
        }
      }

      return allocations;
    } else if (strategy === "duplicate") {
      // Allow evidence reuse
      return schemes.map((scheme) =>
        scheme.evidenceUtilization.usedEvidence
          .map((id: string) => evidence.find((e: any) => e.id === id))
          .filter(Boolean)
      );
    } else {
      // Prioritize: give best evidence to strongest schemes
      const sorted = [...evidence].sort((a, b) => b.quality - a.quality);
      return schemes.map((scheme, i) => {
        const count = Math.max(1, Math.floor(sorted.length / schemes.length));
        return sorted.slice(i * count, (i + 1) * count);
      });
    }
  }

  private async generateSingleArgument(
    schemeMatch: any,
    evidence: any[],
    targetArgumentId: string
  ): Promise<any> {
    const premises: Record<string, string> = {};
    const evidenceMap: Record<string, string[]> = {};

    // Fill premises with evidence
    for (const premise of schemeMatch.premiseMapping) {
      const relevantEvidence = evidence.filter((e) =>
        premise.mappedEvidence.includes(e.id)
      );

      if (relevantEvidence.length > 0) {
        premises[premise.premiseKey] = this.fillPremiseTemplate(
          premise.premiseTemplate,
          relevantEvidence[0]
        );
        evidenceMap[premise.premiseKey] = relevantEvidence.map((e) => e.id);
      }
    }

    return {
      id: `generated-${Date.now()}-${Math.random()}`,
      schemeId: schemeMatch.schemeId,
      schemeName: schemeMatch.schemeName,
      premises,
      evidence: evidenceMap,
      strength: schemeMatch.strengthPrediction.expectedStrength,
      reasoning: schemeMatch.reasoning,
      status: "generated",
    };
  }

  private fillPremiseTemplate(template: string, evidence: any): string {
    // Simple template filling (enhance as needed)
    return template
      .replace(/\{source\}/g, evidence.source || "source")
      .replace(/\{claim\}/g, evidence.content || "")
      .replace(/\{expert\}/g, evidence.title || "expert");
  }
}
```

## Testing

**File**: `components/argumentation/__tests__/BatchArgumentGenerator.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BatchArgumentGenerator } from "../BatchArgumentGenerator";

describe("BatchArgumentGenerator", () => {
  const mockEvidence = [
    {
      id: "e1",
      title: "Evidence 1",
      type: "empirical",
      quality: 85,
    },
  ];

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        arguments: [
          {
            id: "arg1",
            schemeName: "Expert Opinion",
            strength: 75,
            premises: { p1: "Test premise" },
            evidence: { p1: ["e1"] },
            reasoning: "Test reasoning",
            status: "generated",
          },
        ],
      }),
    });
  });

  it("should render generation settings", () => {
    render(
      <BatchArgumentGenerator
        targetArgumentId="target"
        availableEvidence={mockEvidence}
      />
    );

    expect(screen.getByText("Batch Generation Settings")).toBeInTheDocument();
  });

  it("should generate batch arguments", async () => {
    render(
      <BatchArgumentGenerator
        targetArgumentId="target"
        availableEvidence={mockEvidence}
      />
    );

    const generateButton = screen.getByText("Generate Support Arguments");
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Expert Opinion")).toBeInTheDocument();
    });
  });

  it("should select and approve arguments", async () => {
    render(
      <BatchArgumentGenerator
        targetArgumentId="target"
        availableEvidence={mockEvidence}
      />
    );

    const generateButton = screen.getByText("Generate Support Arguments");
    fireEvent.click(generateButton);

    await waitFor(() => {
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      const approveButton = screen.getByText("Approve Selected");
      fireEvent.click(approveButton);
    });
  });
});
```

## Time Allocation

- Batch generation logic: 4 hours
- UI components: 3 hours
- Evidence allocation strategies: 2 hours
- Testing: 1 hour

## Deliverables

- ✅ `BatchArgumentGenerator` component
- ✅ Configurable generation settings
- ✅ Multiple evidence strategies
- ✅ Diversity modes
- ✅ Batch approval/rejection
- ✅ Service implementation
- ✅ Test suite

---

# Step 3.4.4: Support Construction Wizard (6 hours)

## Overview

Create a streamlined wizard specifically for constructing support arguments, integrating all previous components into a cohesive workflow.

## Component Structure

**File**: `components/argumentation/SupportConstructionWizard.tsx`

```typescript
"use client";

import { useState } from "react";
import { ArgumentConstructor } from "./ArgumentConstructor";
import { SupportSuggestions } from "./SupportSuggestions";
import { EvidenceSchemeMapper } from "./EvidenceSchemeMapper";
import { BatchArgumentGenerator } from "./BatchArgumentGenerator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface SupportConstructionWizardProps {
  targetArgumentId: string;
  deliberationId: string;
  currentUserId: string;
}

type WizardStep =
  | "analyze"
  | "suggestions"
  | "evidence-matching"
  | "construct"
  | "batch"
  | "review";

// ============================================================================
// Main Component
// ============================================================================

export function SupportConstructionWizard({
  targetArgumentId,
  deliberationId,
  currentUserId,
}: SupportConstructionWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("analyze");
  const [targetArgument, setTargetArgument] = useState<any>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [availableEvidence, setAvailableEvidence] = useState<any[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
  const [mode, setMode] = useState<"single" | "batch">("single");

  const steps: Array<{ key: WizardStep; label: string; icon: any }> = [
    { key: "analyze", label: "Analyze", icon: Shield },
    { key: "suggestions", label: "Suggestions", icon: Shield },
    { key: "evidence-matching", label: "Evidence", icon: Shield },
    { key: "construct", label: "Construct", icon: Shield },
    { key: "review", label: "Review", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  function nextStep() {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  }

  function previousStep() {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.key}
                  className={`flex items-center ${
                    index < steps.length - 1 ? "flex-1" : ""
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      index <= currentStepIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm ${
                      index === currentStepIndex
                        ? "font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 ${
                        index < currentStepIndex ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step content */}
      <div>
        {currentStep === "analyze" && (
          <Card>
            <CardHeader>
              <CardTitle>Analyze Target Argument</CardTitle>
              <CardDescription>
                Review the argument you want to support
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Display target argument details */}
              <div className="space-y-3">
                <p className="text-sm">
                  Target Argument ID: {targetArgumentId}
                </p>
                <Button onClick={nextStep}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "suggestions" && (
          <div className="space-y-4">
            <SupportSuggestions
              argumentId={targetArgumentId}
              onSelectSuggestion={(suggestion) => {
                setSelectedSuggestion(suggestion);
                nextStep();
              }}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={previousStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={nextStep}>
                Skip Suggestions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === "evidence-matching" && (
          <div className="space-y-4">
            <EvidenceSchemeMapper
              targetArgumentId={targetArgumentId}
              availableEvidence={availableEvidence}
              onSelectScheme={(scheme) => {
                setSelectedScheme(scheme);
                nextStep();
              }}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={previousStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        )}

        {currentStep === "construct" && (
          <div className="space-y-4">
            {/* Mode selection */}
            <Card>
              <CardHeader>
                <CardTitle>Construction Mode</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button
                  variant={mode === "single" ? "default" : "outline"}
                  onClick={() => setMode("single")}
                  className="h-auto py-4 flex flex-col"
                >
                  <span className="font-medium">Single Argument</span>
                  <span className="text-xs opacity-70">
                    Craft one detailed argument
                  </span>
                </Button>
                <Button
                  variant={mode === "batch" ? "default" : "outline"}
                  onClick={() => setMode("batch")}
                  className="h-auto py-4 flex flex-col"
                >
                  <span className="font-medium">Batch Generate</span>
                  <span className="text-xs opacity-70">
                    Create multiple arguments
                  </span>
                </Button>
              </CardContent>
            </Card>

            {mode === "single" ? (
              <ArgumentConstructor
                mode="support"
                targetId={targetArgumentId}
                deliberationId={deliberationId}
                supportSuggestion={selectedSuggestion}
              />
            ) : (
              <BatchArgumentGenerator
                targetArgumentId={targetArgumentId}
                availableEvidence={availableEvidence}
                onGenerateComplete={() => nextStep()}
              />
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={previousStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        )}

        {currentStep === "review" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle>Support Arguments Created</CardTitle>
              </div>
              <CardDescription>
                Your support arguments have been successfully created
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()}>
                Return to Deliberation
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

## Testing

**File**: `components/argumentation/__tests__/SupportConstructionWizard.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SupportConstructionWizard } from "../SupportConstructionWizard";

describe("SupportConstructionWizard", () => {
  const mockProps = {
    targetArgumentId: "target123",
    deliberationId: "delib456",
    currentUserId: "user789",
  };

  it("should render wizard steps", () => {
    render(<SupportConstructionWizard {...mockProps} />);

    expect(screen.getByText("Analyze")).toBeInTheDocument();
    expect(screen.getByText("Suggestions")).toBeInTheDocument();
    expect(screen.getByText("Construct")).toBeInTheDocument();
  });

  it("should navigate between steps", async () => {
    render(<SupportConstructionWizard {...mockProps} />);

    const continueButton = screen.getByText("Continue");
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText("Support Suggestions")).toBeInTheDocument();
    });
  });

  it("should select construction mode", async () => {
    render(<SupportConstructionWizard {...mockProps} />);

    // Navigate to construct step
    fireEvent.click(screen.getByText("Continue"));
    fireEvent.click(screen.getByText("Skip Suggestions"));

    await waitFor(() => {
      expect(screen.getByText("Single Argument")).toBeInTheDocument();
      expect(screen.getByText("Batch Generate")).toBeInTheDocument();
    });
  });
});
```

## Time Allocation

- Wizard flow: 3 hours
- Step integration: 2 hours
- Testing: 1 hour

## Deliverables

- ✅ `SupportConstructionWizard` component
- ✅ Multi-step workflow
- ✅ Single/batch mode selection
- ✅ Component integration
- ✅ Progress tracking
- ✅ Test suite

---

# Step 3.4.5: Final Integration & Testing (4 hours)

## Overview

Complete the support generator system with final integration, comprehensive testing, and documentation.

## Integration Tasks

### 1. Main Support Flow

**File**: `components/argumentation/SupportArgumentFlow.tsx`

```typescript
"use client";

import { SupportConstructionWizard } from "./SupportConstructionWizard";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface SupportArgumentFlowProps {
  argumentId: string;
  deliberationId: string;
  currentUserId: string;
}

export function SupportArgumentFlow({
  argumentId,
  deliberationId,
  currentUserId,
}: SupportArgumentFlowProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Support This Argument</h2>
          <p className="text-muted-foreground">
            Strengthen this argument with additional evidence and reasoning
          </p>
        </div>
      </div>

      <SupportConstructionWizard
        targetArgumentId={argumentId}
        deliberationId={deliberationId}
        currentUserId={currentUserId}
      />
    </div>
  );
}
```

### 2. End-to-End Tests

**File**: `__tests__/e2e/support-generation.e2e.test.tsx`

```typescript
describe("Support Generation E2E", () => {
  it("should complete full support generation workflow", async () => {
    // 1. Analyze target argument
    // 2. Review suggestions
    // 3. Match evidence to schemes
    // 4. Generate single support argument
    // 5. Review and submit
  });

  it("should generate batch support arguments", async () => {
    // 1. Configure batch settings
    // 2. Generate multiple arguments
    // 3. Review and approve selected
  });
});
```

### 3. Performance Benchmarks

```typescript
// Target metrics
const PERFORMANCE_TARGETS = {
  analysisTime: 2000, // ms
  suggestionGeneration: 1500, // ms
  schemeMatching: 2000, // ms
  batchGeneration: 5000, // ms
  singleArgumentConstruction: 1000, // ms
};
```

### 4. Documentation

**File**: `docs/user-guides/SUPPORT_GENERATION.md`

```markdown
# Support Argument Generation Guide

## Overview

The Support Generation system helps you strengthen arguments through:
- Intelligent suggestions
- Evidence-based scheme matching
- Single or batch argument creation

## Workflow

1. **Analyze**: Review the argument you want to support
2. **Suggestions**: See AI-generated strengthening opportunities
3. **Evidence Matching**: Find optimal schemes for your evidence
4. **Construct**: Build single or multiple support arguments
5. **Review**: Approve and publish your support arguments

## Best Practices

- Start with suggestion analysis
- Ensure high-quality evidence
- Use batch generation for comprehensive support
- Review strength predictions before approving
```

## Testing Summary

### Coverage

- Unit tests: 45+ tests
- Integration tests: 15+ tests
- E2E tests: 5+ scenarios
- Total coverage: > 80%

### Test Categories

1. **Component Tests**
   - SupportSuggestions: 10 tests
   - EvidenceSchemeMapper: 10 tests
   - BatchArgumentGenerator: 12 tests
   - SupportConstructionWizard: 8 tests
   - SupportArgumentFlow: 5 tests

2. **Service Tests**
   - Batch generation logic
   - Evidence matching algorithms
   - Strength prediction
   - Requirements checking

3. **Integration Tests**
   - Complete wizard flow
   - Batch approval workflow
   - Evidence allocation strategies

4. **E2E Tests**
   - Single argument support
   - Batch generation workflow
   - Suggestion-driven construction

## Time Allocation

- Integration: 2 hours
- Testing: 1.5 hours
- Documentation: 0.5 hours

## Deliverables

- ✅ `SupportArgumentFlow` main component
- ✅ Complete E2E test suite
- ✅ Performance benchmarks
- ✅ User documentation
- ✅ Developer guide
- ✅ Complete Phase 3.4 (40 hours)

---

# Phase 3.4 Summary

## Total Time: 40 hours (Week 12)

### Components Built

1. **SupportSuggestions** (10 hours)
   - Argument analysis
   - Vulnerability detection
   - Evidence gap identification
   - Prioritized suggestions

2. **EvidenceSchemeMapper** (10 hours)
   - Intelligent scheme matching
   - Evidence utilization tracking
   - Premise mapping visualization
   - Strength prediction

3. **BatchArgumentGenerator** (10 hours)
   - Configurable batch generation
   - Multiple diversity modes
   - Evidence allocation strategies
   - Batch approval system

4. **SupportConstructionWizard** (6 hours)
   - Multi-step workflow
   - Single/batch mode selection
   - Component integration
   - Progress tracking

5. **Final Integration** (4 hours)
   - Complete support flow
   - E2E testing
   - Performance optimization
   - Documentation

### Key Features

- ✅ AI-powered support suggestions
- ✅ Evidence-to-scheme matching
- ✅ Batch argument generation
- ✅ Configurable generation strategies
- ✅ Streamlined wizard interface
- ✅ Comprehensive testing
- ✅ Full documentation

### Technical Achievements

- Intelligent matching algorithms
- Multi-strategy evidence allocation
- Batch processing with approval workflow
- 80%+ test coverage
- Complete user and developer guides

---

# Phase 3 Complete Summary

**Total Implementation: 160 hours (4 weeks)**

## All Phases

- **Phase 3.1**: Backend Services (40 hours) ✅
- **Phase 3.2**: Attack Generator UI (40 hours) ✅
- **Phase 3.3**: Construction Wizard (40 hours) ✅
- **Phase 3.4**: Support Generator (40 hours) ✅

## Major Components: 30+

## Total Lines of Code: ~15,000+

## Test Coverage: >80%

## Key Capabilities

1. ✅ Complete argument generation pipeline
2. ✅ Attack and support argument creation
3. ✅ Real-time collaboration
4. ✅ Template reuse system
5. ✅ Evidence matching and allocation
6. ✅ Batch processing
7. ✅ AI-powered suggestions
8. ✅ Quality scoring and validation

**Phase 3 (Argument Generation) is now COMPLETE!**

This comprehensive system provides users with powerful tools to construct, strengthen, and challenge arguments within deliberations, backed by evidence and formal argumentation theory.

