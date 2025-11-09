# Phase 3, Part 3: Burden of Proof & Evidence Guidance UI

**Phase**: 3.2 Attack Generator UI (Week 10, continued)
**Steps Covered**: 3.2.3, 3.2.4, 3.2.5
**Total Time**: 18 hours

This document continues Phase 3.2 with the remaining UI components for burden of proof indicators, evidence guidance, and attack preview/submission.

---

# Step 3.2.3: Burden of Proof Indicators Component (6 hours)

## Overview

Create comprehensive UI components that explain burden of proof rules, show visual comparisons between proponent and challenger burdens, and provide scheme-specific examples to help users understand when they have a strategic advantage.

## Component Structure

**File**: `components/argumentation/BurdenOfProofIndicators.tsx`

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Scale,
  Shield,
  Sword,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

type BurdenLevel = "none" | "low" | "medium" | "high" | "very-high";
type AttackType = "REBUTS" | "UNDERCUTS" | "UNDERMINES";

interface BurdenOfProofIndicatorsProps {
  attackType: AttackType;
  targetScheme?: {
    id: string;
    name: string;
    category: string;
  };
  burdenOfProof: "proponent" | "challenger";
  requiresEvidence: boolean;
  reasoning?: string;
  compact?: boolean;
}

interface BurdenRule {
  title: string;
  description: string;
  proponentBurden: BurdenLevel;
  challengerBurden: BurdenLevel;
  examples: string[];
  icon: React.ElementType;
}

// ============================================================================
// Main Component
// ============================================================================

export function BurdenOfProofIndicators({
  attackType,
  targetScheme,
  burdenOfProof,
  requiresEvidence,
  reasoning,
  compact = false,
}: BurdenOfProofIndicatorsProps) {
  const [activeTab, setActiveTab] = useState("summary");

  const burdenRule = getBurdenRule(attackType, targetScheme?.category);
  const advantage = determineAdvantage(burdenOfProof, requiresEvidence);

  if (compact) {
    return <CompactBurdenDisplay advantage={advantage} burdenOfProof={burdenOfProof} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            <CardTitle>Burden of Proof Analysis</CardTitle>
          </div>
          <BurdenAdvantageBadge advantage={advantage} />
        </div>
        <CardDescription>
          Understanding who needs to provide evidence for this attack
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          {/* Summary tab */}
          <TabsContent value="summary" className="space-y-4 mt-4">
            <BurdenSummary
              attackType={attackType}
              burdenOfProof={burdenOfProof}
              requiresEvidence={requiresEvidence}
              reasoning={reasoning}
              advantage={advantage}
            />

            <VisualBurdenComparison
              proponentBurden={burdenRule.proponentBurden}
              challengerBurden={burdenRule.challengerBurden}
              currentRole={burdenOfProof}
            />

            <StrategicImplications
              advantage={advantage}
              attackType={attackType}
              requiresEvidence={requiresEvidence}
            />
          </TabsContent>

          {/* Rules tab */}
          <TabsContent value="rules" className="space-y-4 mt-4">
            <BurdenRulesExplanation burdenRule={burdenRule} attackType={attackType} />
          </TabsContent>

          {/* Examples tab */}
          <TabsContent value="examples" className="space-y-4 mt-4">
            <BurdenExamples
              attackType={attackType}
              targetScheme={targetScheme}
              examples={burdenRule.examples}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Compact Display
// ============================================================================

interface CompactBurdenDisplayProps {
  advantage: "strong" | "moderate" | "none" | "disadvantage";
  burdenOfProof: "proponent" | "challenger";
}

function CompactBurdenDisplay({ advantage, burdenOfProof }: CompactBurdenDisplayProps) {
  const config = {
    strong: {
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      label: "Strong Advantage",
    },
    moderate: {
      icon: Info,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      label: "Moderate Burden",
    },
    none: {
      icon: AlertCircle,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      label: "Shared Burden",
    },
    disadvantage: {
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      label: "High Burden",
    },
  };

  const { icon: Icon, color, bg, border, label } = config[advantage];

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bg} ${border} cursor-help`}
        >
          <Icon className={`h-4 w-4 ${color}`} />
          <span className={`text-sm font-medium ${color}`}>{label}</span>
          <HelpCircle className="h-3 w-3 text-muted-foreground ml-auto" />
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <p className="text-sm font-medium">Burden of Proof</p>
          <p className="text-xs text-muted-foreground">
            {burdenOfProof === "proponent"
              ? "The original arguer must defend their position. You only need to raise reasonable doubt."
              : "You must provide evidence to support this attack. The bar for proof is on you."}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// ============================================================================
// Burden Advantage Badge
// ============================================================================

interface BurdenAdvantageBadgeProps {
  advantage: "strong" | "moderate" | "none" | "disadvantage";
}

function BurdenAdvantageBadge({ advantage }: BurdenAdvantageBadgeProps) {
  const config = {
    strong: { label: "✅ Strong Advantage", variant: "default" as const },
    moderate: { label: "⚖️ Moderate Burden", variant: "secondary" as const },
    none: { label: "⚠️ Shared Burden", variant: "outline" as const },
    disadvantage: { label: "❌ High Burden", variant: "destructive" as const },
  };

  const { label, variant } = config[advantage];

  return <Badge variant={variant}>{label}</Badge>;
}

// ============================================================================
// Burden Summary
// ============================================================================

interface BurdenSummaryProps {
  attackType: AttackType;
  burdenOfProof: "proponent" | "challenger";
  requiresEvidence: boolean;
  reasoning?: string;
  advantage: "strong" | "moderate" | "none" | "disadvantage";
}

function BurdenSummary({
  attackType,
  burdenOfProof,
  requiresEvidence,
  reasoning,
  advantage,
}: BurdenSummaryProps) {
  return (
    <Alert>
      <Scale className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <p className="font-medium mb-1">Who Bears the Burden?</p>
            <p className="text-sm">
              {burdenOfProof === "proponent" ? (
                <>
                  <Shield className="inline h-4 w-4 mr-1 text-green-600" />
                  The <strong>original arguer</strong> bears the burden of proof. As the
                  attacker, you only need to raise reasonable doubt.
                </>
              ) : (
                <>
                  <Sword className="inline h-4 w-4 mr-1 text-red-600" />
                  You (the <strong>attacker</strong>) bear the burden of proof. You must provide
                  convincing evidence for your attack.
                </>
              )}
            </p>
          </div>

          {reasoning && (
            <div>
              <p className="font-medium mb-1">Why?</p>
              <p className="text-sm text-muted-foreground">{reasoning}</p>
            </div>
          )}

          <div>
            <p className="font-medium mb-1">What This Means for You:</p>
            <p className="text-sm text-muted-foreground">
              {advantage === "strong" && (
                <>
                  You have a <strong className="text-green-600">strategic advantage</strong>.
                  Simply asking the critical question shifts burden back to them. You can win
                  by showing their argument isn't strong enough.
                </>
              )}
              {advantage === "moderate" && (
                <>
                  You need <strong className="text-blue-600">some supporting evidence</strong>,
                  but the bar is not high. Reasonable examples or common knowledge may suffice.
                </>
              )}
              {advantage === "none" && (
                <>
                  Both sides share the burden. You'll need{" "}
                  <strong className="text-yellow-600">balanced evidence</strong> to make your
                  case convincing.
                </>
              )}
              {advantage === "disadvantage" && (
                <>
                  You face a <strong className="text-red-600">high burden</strong>. You must
                  provide strong, specific evidence to succeed with this attack. Consider if
                  you have the evidence before proceeding.
                </>
              )}
            </p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// ============================================================================
// Visual Burden Comparison
// ============================================================================

interface VisualBurdenComparisonProps {
  proponentBurden: BurdenLevel;
  challengerBurden: BurdenLevel;
  currentRole: "proponent" | "challenger";
}

function VisualBurdenComparison({
  proponentBurden,
  challengerBurden,
  currentRole,
}: VisualBurdenComparisonProps) {
  const burdenToWidth = (level: BurdenLevel): number => {
    const map = { none: 0, low: 20, medium: 50, high: 80, "very-high": 100 };
    return map[level];
  };

  const burdenToColor = (level: BurdenLevel): string => {
    const map = {
      none: "bg-gray-300",
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      "very-high": "bg-red-500",
    };
    return map[level];
  };

  const proponentWidth = burdenToWidth(proponentBurden);
  const challengerWidth = burdenToWidth(challengerBurden);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Burden Comparison</h3>

      {/* Proponent */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Original Arguer (Proponent)</span>
            {currentRole === "proponent" && (
              <Badge variant="outline" className="text-xs">
                Not you
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{proponentBurden}</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${burdenToColor(proponentBurden)} transition-all`}
            style={{ width: `${proponentWidth}%` }}
          />
        </div>
      </div>

      {/* Challenger */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sword className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Attacker (Challenger)</span>
            {currentRole === "challenger" && (
              <Badge variant="default" className="text-xs">
                You
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{challengerBurden}</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${burdenToColor(challengerBurden)} transition-all`}
            style={{ width: `${challengerWidth}%` }}
          />
        </div>
      </div>

      {/* Interpretation */}
      <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
        <p>
          <strong>Interpretation:</strong>{" "}
          {proponentWidth > challengerWidth ? (
            <>
              The original arguer has a <strong>higher burden</strong> ({proponentBurden}) than
              you do ({challengerBurden}). This gives you a strategic advantage.
            </>
          ) : proponentWidth < challengerWidth ? (
            <>
              You have a <strong>higher burden</strong> ({challengerBurden}) than the original
              arguer ({proponentBurden}). You'll need strong evidence.
            </>
          ) : (
            <>
              Both sides share <strong>equal burden</strong> ({proponentBurden}). This is a
              balanced exchange.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Strategic Implications
// ============================================================================

interface StrategicImplicationsProps {
  advantage: "strong" | "moderate" | "none" | "disadvantage";
  attackType: AttackType;
  requiresEvidence: boolean;
}

function StrategicImplications({
  advantage,
  attackType,
  requiresEvidence,
}: StrategicImplicationsProps) {
  const implications = getStrategicImplications(advantage, attackType, requiresEvidence);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Info className="h-4 w-4" />
        Strategic Implications
      </h3>

      <div className="space-y-2">
        {implications.map((implication, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <span className="text-lg leading-none">{implication.icon}</span>
            <p className="text-muted-foreground">{implication.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Burden Rules Explanation
// ============================================================================

interface BurdenRulesExplanationProps {
  burdenRule: BurdenRule;
  attackType: AttackType;
}

function BurdenRulesExplanation({ burdenRule, attackType }: BurdenRulesExplanationProps) {
  const Icon = burdenRule.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium mb-1">{burdenRule.title}</h3>
          <p className="text-sm text-muted-foreground">{burdenRule.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Proponent's Burden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <BurdenLevelBadge level={burdenRule.proponentBurden} />
              <p className="text-xs text-muted-foreground">
                {getBurdenDescription(burdenRule.proponentBurden, "proponent", attackType)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sword className="h-4 w-4" />
              Challenger's Burden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <BurdenLevelBadge level={burdenRule.challengerBurden} />
              <p className="text-xs text-muted-foreground">
                {getBurdenDescription(burdenRule.challengerBurden, "challenger", attackType)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          <p className="text-xs">
            <strong>Note:</strong> These burden rules follow standard argumentation theory and
            dialectical conventions. The actual burden may vary based on context, domain norms,
            and institutional rules.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ============================================================================
// Burden Level Badge
// ============================================================================

function BurdenLevelBadge({ level }: { level: BurdenLevel }) {
  const config = {
    none: { label: "None", variant: "outline" as const, color: "text-gray-600" },
    low: { label: "Low", variant: "secondary" as const, color: "text-green-600" },
    medium: { label: "Medium", variant: "secondary" as const, color: "text-yellow-600" },
    high: { label: "High", variant: "secondary" as const, color: "text-orange-600" },
    "very-high": { label: "Very High", variant: "destructive" as const, color: "text-red-600" },
  };

  const { label, variant } = config[level];

  return <Badge variant={variant}>{label}</Badge>;
}

// ============================================================================
// Burden Examples
// ============================================================================

interface BurdenExamplesProps {
  attackType: AttackType;
  targetScheme?: {
    id: string;
    name: string;
    category: string;
  };
  examples: string[];
}

function BurdenExamples({ attackType, targetScheme, examples }: BurdenExamplesProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">
          Example: {attackType} attack
          {targetScheme && ` on ${targetScheme.name}`}
        </h3>
        <p className="text-sm text-muted-foreground">
          Here are concrete examples of how burden of proof works in practice for this type of
          attack.
        </p>
      </div>

      <div className="space-y-3">
        {examples.map((example, idx) => (
          <Card key={idx}>
            <CardContent className="pt-4">
              <p className="text-sm whitespace-pre-line">{example}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional resources */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="text-sm font-medium">Want to learn more?</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <BookOpen className="h-3 w-3 mr-1" />
                Burden of Proof Guide
              </Button>
              <Button variant="outline" size="sm">
                <HelpCircle className="h-3 w-3 mr-1" />
                Attack Strategy Tips
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getBurdenRule(attackType: AttackType, schemeCategory?: string): BurdenRule {
  // Simplified burden rules based on attack type
  const rules: Record<AttackType, BurdenRule> = {
    UNDERMINES: {
      title: "Undermining Attack Burden",
      description:
        "When undermining a premise, you challenge an assumption. If the premise was not explicitly supported, the burden shifts back to the proponent to defend it.",
      proponentBurden: "high",
      challengerBurden: "low",
      examples: [
        "Original Argument:\n'Dr. Smith is a climate expert, so we should trust his climate predictions.'\n\nYour Attack:\n'Is Dr. Smith actually qualified in climate science? I see his PhD is in geology.'\n\n✅ Burden Advantage: The original arguer must now prove Dr. Smith's climate expertise. You just raised the question.",
        "Original Argument:\n'Studies show this drug is safe, so it should be approved.'\n\nYour Attack:\n'Were these studies peer-reviewed and independent?'\n\n✅ Burden Advantage: Proponent must show study quality. You only questioned it.",
      ],
      icon: HelpCircle,
    },
    UNDERCUTS: {
      title: "Undercutting Attack Burden",
      description:
        "Undercutting challenges the inference itself. You typically need to show why the reasoning doesn't work, which requires moderate evidence.",
      proponentBurden: "medium",
      challengerBurden: "medium",
      examples: [
        "Original Argument:\n'Expert testimony shows X is true.'\n\nYour Attack:\n'Expert testimony is unreliable when the expert has financial conflicts of interest. This expert is paid by the company making X.'\n\n⚖️ Shared Burden: You must prove the conflict exists, they must show why it doesn't matter.",
        "Original Argument:\n'Polling data supports policy Y.'\n\nYour Attack:\n'This polling used biased sampling methods that skew results.'\n\n⚖️ Shared Burden: You need evidence of bias, they need to defend methodology.",
      ],
      icon: Scale,
    },
    REBUTS: {
      title: "Rebuttal Attack Burden",
      description:
        "Rebuttals directly contradict the conclusion. You must provide counter-evidence, placing higher burden on you.",
      proponentBurden: "medium",
      challengerBurden: "high",
      examples: [
        "Original Argument:\n'Data shows crime is rising.'\n\nYour Rebuttal:\n'Actually, FBI statistics show crime has decreased 15% over the past 5 years.'\n\n❌ High Burden: You must provide credible contradicting data. The bar is on you.",
        "Original Argument:\n'This policy will create jobs.'\n\nYour Rebuttal:\n'Economic analysis from 3 independent think tanks shows this policy will eliminate 50,000 jobs.'\n\n❌ High Burden: You need strong counter-evidence with credible sources.",
      ],
      icon: Sword,
    },
  };

  return rules[attackType];
}

function determineAdvantage(
  burdenOfProof: "proponent" | "challenger",
  requiresEvidence: boolean
): "strong" | "moderate" | "none" | "disadvantage" {
  if (burdenOfProof === "proponent" && !requiresEvidence) {
    return "strong"; // Question shifts burden, no evidence needed
  }
  if (burdenOfProof === "proponent" && requiresEvidence) {
    return "moderate"; // Question helps, but some evidence needed
  }
  if (burdenOfProof === "challenger" && !requiresEvidence) {
    return "none"; // You have burden but it's not heavy
  }
  return "disadvantage"; // You have burden and must provide evidence
}

function getStrategicImplications(
  advantage: "strong" | "moderate" | "none" | "disadvantage",
  attackType: AttackType,
  requiresEvidence: boolean
): Array<{ icon: string; text: string }> {
  const implications: Record<string, Array<{ icon: string; text: string }>> = {
    strong: [
      {
        icon: "✅",
        text: "Just asking the critical question is often enough. You don't need extensive evidence.",
      },
      {
        icon: "⚡",
        text: "The original arguer must now defend assumptions they may have glossed over.",
      },
      {
        icon: "🎯",
        text: "This is a high-value, low-cost attack. Strong strategic choice.",
      },
    ],
    moderate: [
      {
        icon: "📊",
        text: "Provide examples or basic evidence to strengthen your question.",
      },
      {
        icon: "⚖️",
        text: "The bar for proof is moderate. Common knowledge or simple sources may suffice.",
      },
      {
        icon: "💡",
        text: "Even if they respond, you've shifted the conversation in your favor.",
      },
    ],
    none: [
      {
        icon: "🤝",
        text: "This is a balanced exchange. Both sides need reasonable arguments.",
      },
      {
        icon: "📚",
        text: "Prepare evidence comparable to what the original arguer provided.",
      },
      {
        icon: "⚖️",
        text: "Quality of reasoning matters as much as quantity of evidence.",
      },
    ],
    disadvantage: [
      {
        icon: "⚠️",
        text: "You bear the burden of proof. Strong evidence is required for success.",
      },
      {
        icon: "📖",
        text: "Prepare credible sources, data, or expert testimony before proceeding.",
      },
      {
        icon: "🔍",
        text: "Consider if you have the evidence needed. Without it, this attack may fail.",
      },
    ],
  };

  return implications[advantage] || [];
}

function getBurdenDescription(
  level: BurdenLevel,
  role: "proponent" | "challenger",
  attackType: AttackType
): string {
  const descriptions: Record<BurdenLevel, Record<string, string>> = {
    none: {
      proponent: "No burden to defend this aspect.",
      challenger: "No burden to prove the attack.",
    },
    low: {
      proponent: "Must provide basic justification if challenged.",
      challenger: "Only need to raise reasonable doubt or questions.",
    },
    medium: {
      proponent: "Should provide supporting evidence for claims.",
      challenger: "Need some evidence or examples to support attack.",
    },
    high: {
      proponent: "Must provide strong evidence and defend all assumptions.",
      challenger: "Must provide substantial evidence with credible sources.",
    },
    "very-high": {
      proponent: "Extraordinary claims require extraordinary evidence.",
      challenger: "Need overwhelming evidence to overcome presumption.",
    },
  };

  return descriptions[level][role] || "";
}
```

## Integration Example

**File**: `components/argumentation/AttackSuggestionCard.tsx` (updated)

```typescript
// Add to existing AttackSuggestionCard component

import { BurdenOfProofIndicators } from "./BurdenOfProofIndicators";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Inside the card render:
<div className="flex items-center justify-between">
  <BurdenOfProofIndicators
    attackType={suggestion.attackType}
    targetScheme={suggestion.targetSchemeInstance?.scheme}
    burdenOfProof={suggestion.burdenOfProof}
    requiresEvidence={suggestion.requiresEvidence}
    compact={true}
  />

  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="sm">
        <Info className="h-4 w-4 mr-1" />
        Learn More
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Burden of Proof Analysis</DialogTitle>
      </DialogHeader>
      <BurdenOfProofIndicators
        attackType={suggestion.attackType}
        targetScheme={suggestion.targetSchemeInstance?.scheme}
        burdenOfProof={suggestion.burdenOfProof}
        requiresEvidence={suggestion.requiresEvidence}
        reasoning={suggestion.reasoning}
        compact={false}
      />
    </DialogContent>
  </Dialog>
</div>
```

## Testing

**File**: `components/argumentation/__tests__/BurdenOfProofIndicators.test.tsx`

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { BurdenOfProofIndicators } from "../BurdenOfProofIndicators";

describe("BurdenOfProofIndicators", () => {
  it("should render compact mode with advantage badge", () => {
    render(
      <BurdenOfProofIndicators
        attackType="UNDERMINES"
        burdenOfProof="proponent"
        requiresEvidence={false}
        compact={true}
      />
    );

    expect(screen.getByText("Strong Advantage")).toBeInTheDocument();
  });

  it("should show full analysis in expanded mode", () => {
    render(
      <BurdenOfProofIndicators
        attackType="UNDERMINES"
        burdenOfProof="proponent"
        requiresEvidence={false}
        compact={false}
      />
    );

    expect(screen.getByText("Burden of Proof Analysis")).toBeInTheDocument();
    expect(screen.getByText("Who Bears the Burden?")).toBeInTheDocument();
  });

  it("should display visual burden comparison", () => {
    render(
      <BurdenOfProofIndicators
        attackType="UNDERCUTS"
        burdenOfProof="challenger"
        requiresEvidence={true}
        compact={false}
      />
    );

    fireEvent.click(screen.getByText("Summary"));

    expect(screen.getByText("Burden Comparison")).toBeInTheDocument();
    expect(screen.getByText("Original Arguer (Proponent)")).toBeInTheDocument();
    expect(screen.getByText("Attacker (Challenger)")).toBeInTheDocument();
  });

  it("should show rules in rules tab", () => {
    render(
      <BurdenOfProofIndicators
        attackType="REBUTS"
        burdenOfProof="challenger"
        requiresEvidence={true}
        compact={false}
      />
    );

    fireEvent.click(screen.getByText("Rules"));

    expect(screen.getByText("Rebuttal Attack Burden")).toBeInTheDocument();
    expect(screen.getByText("Proponent's Burden")).toBeInTheDocument();
    expect(screen.getByText("Challenger's Burden")).toBeInTheDocument();
  });

  it("should show examples in examples tab", () => {
    render(
      <BurdenOfProofIndicators
        attackType="UNDERMINES"
        burdenOfProof="proponent"
        requiresEvidence={false}
        compact={false}
      />
    );

    fireEvent.click(screen.getByText("Examples"));

    expect(screen.getByText(/Example: UNDERMINES attack/)).toBeInTheDocument();
  });

  it("should show strategic implications", () => {
    render(
      <BurdenOfProofIndicators
        attackType="UNDERMINES"
        burdenOfProof="proponent"
        requiresEvidence={false}
        compact={false}
      />
    );

    expect(screen.getByText("Strategic Implications")).toBeInTheDocument();
    expect(
      screen.getByText(/Just asking the critical question is often enough/)
    ).toBeInTheDocument();
  });

  it("should show disadvantage for rebuttal attacks", () => {
    render(
      <BurdenOfProofIndicators
        attackType="REBUTS"
        burdenOfProof="challenger"
        requiresEvidence={true}
        compact={false}
      />
    );

    expect(screen.getByText("❌ High Burden")).toBeInTheDocument();
    expect(
      screen.getByText(/You bear the burden of proof/)
    ).toBeInTheDocument();
  });
});
```

## Storybook Stories

**File**: `components/argumentation/BurdenOfProofIndicators.stories.tsx`

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { BurdenOfProofIndicators } from "./BurdenOfProofIndicators";

const meta: Meta<typeof BurdenOfProofIndicators> = {
  title: "Argumentation/BurdenOfProofIndicators",
  component: BurdenOfProofIndicators,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof BurdenOfProofIndicators>;

export const StrongAdvantage: Story = {
  args: {
    attackType: "UNDERMINES",
    burdenOfProof: "proponent",
    requiresEvidence: false,
    reasoning: "The premise was never defended, so questioning it shifts burden back.",
    compact: false,
  },
};

export const HighBurden: Story = {
  args: {
    attackType: "REBUTS",
    burdenOfProof: "challenger",
    requiresEvidence: true,
    reasoning: "Direct contradiction requires strong counter-evidence.",
    compact: false,
  },
};

export const SharedBurden: Story = {
  args: {
    attackType: "UNDERCUTS",
    burdenOfProof: "challenger",
    requiresEvidence: true,
    reasoning: "Challenging inference requires showing why the reasoning fails.",
    compact: false,
  },
};

export const CompactMode: Story = {
  args: {
    attackType: "UNDERMINES",
    burdenOfProof: "proponent",
    requiresEvidence: false,
    compact: true,
  },
};
```

## Time Allocation

- Core component structure: 1.5 hours
- Visual burden comparison: 1.5 hours
- Rules and examples tabs: 2 hours
- Testing: 1 hour

## Deliverables

- ✅ `BurdenOfProofIndicators` component with tabbed interface
- ✅ Compact mode for inline display
- ✅ Visual burden comparison chart
- ✅ Burden rules explanation with examples
- ✅ Strategic implications guidance
- ✅ Burden advantage badges
- ✅ Integration with AttackSuggestionCard
- ✅ Comprehensive test suite
- ✅ Storybook stories

---

# Step 3.2.4: Evidence Guidance UI Component (6 hours)

## Overview

Create UI components that guide users in providing appropriate evidence for their arguments, including evidence type descriptions, quality indicators, upload/linking interfaces, and integration with the evidence library.

## Component Structure

**File**: `components/argumentation/EvidenceGuidance.tsx`

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Link as LinkIcon,
  Upload,
  CheckCircle2,
  AlertCircle,
  Star,
  ExternalLink,
  Trash2,
  Search,
  Info,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

type EvidenceType =
  | "expert-credentials"
  | "expert-testimony"
  | "statistical-data"
  | "empirical-study"
  | "case-example"
  | "causal-evidence"
  | "analogical-case"
  | "classification-criteria"
  | "position-to-know"
  | "witness-testimony"
  | "correlation-data"
  | "general-knowledge";

interface EvidenceLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  evidenceType: EvidenceType;
  quality?: number; // 0-100
  verified?: boolean;
}

interface EvidenceGuidanceProps {
  requiredEvidenceTypes: EvidenceType[];
  premiseKey: string;
  premiseText: string;
  existingEvidence?: EvidenceLink[];
  onEvidenceChange?: (evidence: EvidenceLink[]) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function EvidenceGuidance({
  requiredEvidenceTypes,
  premiseKey,
  premiseText,
  existingEvidence = [],
  onEvidenceChange,
}: EvidenceGuidanceProps) {
  const [evidence, setEvidence] = useState<EvidenceLink[]>(existingEvidence);
  const [activeTab, setActiveTab] = useState<"add" | "library" | "guide">("add");
  const [newLink, setNewLink] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedType, setSelectedType] = useState<EvidenceType>(
    requiredEvidenceTypes[0] || "general-knowledge"
  );

  function handleAddEvidence() {
    if (!newLink.trim()) return;

    const newEvidence: EvidenceLink = {
      id: `evidence-${Date.now()}`,
      url: newLink,
      description: newDescription || undefined,
      evidenceType: selectedType,
    };

    const updated = [...evidence, newEvidence];
    setEvidence(updated);
    onEvidenceChange?.(updated);

    // Reset form
    setNewLink("");
    setNewDescription("");
  }

  function handleRemoveEvidence(id: string) {
    const updated = evidence.filter((e) => e.id !== id);
    setEvidence(updated);
    onEvidenceChange?.(updated);
  }

  const coverageScore = calculateEvidenceCoverage(evidence, requiredEvidenceTypes);
  const qualityScore = calculateQualityScore(evidence);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Evidence for This Premise</CardTitle>
          </div>
          <EvidenceScoreBadge coverage={coverageScore} quality={qualityScore} />
        </div>
        <CardDescription className="line-clamp-2">{premiseText}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Evidence coverage indicator */}
        <EvidenceCoverageIndicator
          required={requiredEvidenceTypes}
          provided={evidence.map((e) => e.evidenceType)}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add">Add Evidence</TabsTrigger>
            <TabsTrigger value="library">From Library</TabsTrigger>
            <TabsTrigger value="guide">Evidence Guide</TabsTrigger>
          </TabsList>

          {/* Add evidence tab */}
          <TabsContent value="add" className="space-y-4 mt-4">
            <AddEvidenceForm
              newLink={newLink}
              newDescription={newDescription}
              selectedType={selectedType}
              requiredTypes={requiredEvidenceTypes}
              onLinkChange={setNewLink}
              onDescriptionChange={setNewDescription}
              onTypeChange={setSelectedType}
              onAdd={handleAddEvidence}
            />

            <ExistingEvidenceList evidence={evidence} onRemove={handleRemoveEvidence} />
          </TabsContent>

          {/* Library tab */}
          <TabsContent value="library" className="space-y-4 mt-4">
            <EvidenceLibrarySearch
              premiseText={premiseText}
              requiredTypes={requiredEvidenceTypes}
              onSelect={(item) => {
                const updated = [...evidence, item];
                setEvidence(updated);
                onEvidenceChange?.(updated);
              }}
            />
          </TabsContent>

          {/* Guide tab */}
          <TabsContent value="guide" className="space-y-4 mt-4">
            <EvidenceTypeGuide requiredTypes={requiredEvidenceTypes} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Evidence Score Badge
// ============================================================================

interface EvidenceScoreBadgeProps {
  coverage: number;
  quality: number;
}

function EvidenceScoreBadge({ coverage, quality }: EvidenceScoreBadgeProps) {
  const overall = (coverage + quality) / 2;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={overall >= 70 ? "default" : overall >= 40 ? "secondary" : "outline"}>
        {Math.round(overall)}% Evidence Quality
      </Badge>
    </div>
  );
}

// ============================================================================
// Evidence Coverage Indicator
// ============================================================================

interface EvidenceCoverageIndicatorProps {
  required: EvidenceType[];
  provided: EvidenceType[];
}

function EvidenceCoverageIndicator({ required, provided }: EvidenceCoverageIndicatorProps) {
  const uniqueRequired = [...new Set(required)];
  const uniqueProvided = [...new Set(provided)];
  const covered = uniqueRequired.filter((type) => uniqueProvided.includes(type));
  const missing = uniqueRequired.filter((type) => !uniqueProvided.includes(type));

  const coveragePercent = (covered.length / uniqueRequired.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Evidence Coverage</span>
        <span className="text-xs text-muted-foreground">
          {covered.length} of {uniqueRequired.length} types
        </span>
      </div>

      <Progress value={coveragePercent} className="h-2" />

      <div className="flex flex-wrap gap-2">
        {uniqueRequired.map((type) => {
          const isCovered = covered.includes(type);
          return (
            <Badge
              key={type}
              variant={isCovered ? "default" : "outline"}
              className="text-xs"
            >
              {isCovered && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {getEvidenceTypeLabel(type)}
            </Badge>
          );
        })}
      </div>

      {missing.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Still needed: {missing.map(getEvidenceTypeLabel).join(", ")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ============================================================================
// Add Evidence Form
// ============================================================================

interface AddEvidenceFormProps {
  newLink: string;
  newDescription: string;
  selectedType: EvidenceType;
  requiredTypes: EvidenceType[];
  onLinkChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTypeChange: (type: EvidenceType) => void;
  onAdd: () => void;
}

function AddEvidenceForm({
  newLink,
  newDescription,
  selectedType,
  requiredTypes,
  onLinkChange,
  onDescriptionChange,
  onTypeChange,
  onAdd,
}: AddEvidenceFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="evidence-url">Source URL or Citation</Label>
        <div className="flex gap-2">
          <Input
            id="evidence-url"
            placeholder="https://example.com/source or Smith, J. (2023)"
            value={newLink}
            onChange={(e) => onLinkChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
          />
          <Button onClick={onAdd} disabled={!newLink.trim()}>
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="evidence-type">Evidence Type</Label>
        <select
          id="evidence-type"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value as EvidenceType)}
          className="w-full px-3 py-2 border rounded-md"
        >
          {requiredTypes.map((type) => (
            <option key={type} value={type}>
              {getEvidenceTypeLabel(type)}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {getEvidenceTypeDescription(selectedType)}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="evidence-description">Description (optional)</Label>
        <Textarea
          id="evidence-description"
          placeholder="Briefly describe what this evidence shows..."
          value={newDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Existing Evidence List
// ============================================================================

interface ExistingEvidenceListProps {
  evidence: EvidenceLink[];
  onRemove: (id: string) => void;
}

function ExistingEvidenceList({ evidence, onRemove }: ExistingEvidenceListProps) {
  if (evidence.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No evidence added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Added Evidence ({evidence.length})</Label>
      {evidence.map((item) => (
        <EvidenceItem key={item.id} item={item} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ============================================================================
// Evidence Item
// ============================================================================

interface EvidenceItemProps {
  item: EvidenceLink;
  onRemove: (id: string) => void;
}

function EvidenceItem({ item, onRemove }: EvidenceItemProps) {
  const isUrl = item.url.startsWith("http");

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getEvidenceTypeLabel(item.evidenceType)}
              </Badge>
              {item.quality !== undefined && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">
                    {Math.round(item.quality)}%
                  </span>
                </div>
              )}
              {item.verified && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            {isUrl ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                {item.title || item.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="text-sm font-medium">{item.url}</p>
            )}

            {item.description && (
              <p className="text-xs text-muted-foreground">{item.description}</p>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Evidence Library Search
// ============================================================================

interface EvidenceLibrarySearchProps {
  premiseText: string;
  requiredTypes: EvidenceType[];
  onSelect: (item: EvidenceLink) => void;
}

function EvidenceLibrarySearch({
  premiseText,
  requiredTypes,
  onSelect,
}: EvidenceLibrarySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EvidenceLink[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch("/api/evidence/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          premiseText,
          evidenceTypes: requiredTypes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="library-search">Search Evidence Library</Label>
        <div className="flex gap-2">
          <Input
            id="library-search"
            placeholder="Search for relevant evidence..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Search our curated library of peer-reviewed studies, expert testimony, and verified
          sources. Evidence from the library is pre-verified for quality.
        </AlertDescription>
      </Alert>

      {results.length > 0 && (
        <div className="space-y-2">
          <Label>Search Results ({results.length})</Label>
          {results.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:bg-muted/50">
              <CardContent className="pt-4" onClick={() => onSelect(item)}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getEvidenceTypeLabel(item.evidenceType)}
                    </Badge>
                    {item.verified && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium">{item.title || item.url}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && query && !isSearching && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No results found</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Evidence Type Guide
// ============================================================================

interface EvidenceTypeGuideProps {
  requiredTypes: EvidenceType[];
}

function EvidenceTypeGuide({ requiredTypes }: EvidenceTypeGuideProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Your premise requires these types of evidence. Click each to learn what qualifies.
        </AlertDescription>
      </Alert>

      {requiredTypes.map((type) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="text-base">{getEvidenceTypeLabel(type)}</CardTitle>
            <CardDescription>{getEvidenceTypeDescription(type)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Examples:</p>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  {getEvidenceExamples(type).map((example, idx) => (
                    <li key={idx}>{example}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Quality Criteria:</p>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  {getQualityCriteria(type).map((criteria, idx) => (
                    <li key={idx}>{criteria}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateEvidenceCoverage(
  evidence: EvidenceLink[],
  required: EvidenceType[]
): number {
  if (required.length === 0) return 100;

  const uniqueRequired = [...new Set(required)];
  const providedTypes = [...new Set(evidence.map((e) => e.evidenceType))];
  const covered = uniqueRequired.filter((type) => providedTypes.includes(type));

  return (covered.length / uniqueRequired.length) * 100;
}

function calculateQualityScore(evidence: EvidenceLink[]): number {
  if (evidence.length === 0) return 0;

  const scores = evidence.map((e) => e.quality || 50);
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function getEvidenceTypeLabel(type: EvidenceType): string {
  const labels: Record<EvidenceType, string> = {
    "expert-credentials": "Expert Credentials",
    "expert-testimony": "Expert Testimony",
    "statistical-data": "Statistical Data",
    "empirical-study": "Empirical Study",
    "case-example": "Case Example",
    "causal-evidence": "Causal Evidence",
    "analogical-case": "Analogical Case",
    "classification-criteria": "Classification Criteria",
    "position-to-know": "Position to Know",
    "witness-testimony": "Witness Testimony",
    "correlation-data": "Correlation Data",
    "general-knowledge": "General Knowledge",
  };
  return labels[type];
}

function getEvidenceTypeDescription(type: EvidenceType): string {
  const descriptions: Record<EvidenceType, string> = {
    "expert-credentials": "Documentation of expert qualifications, degrees, publications",
    "expert-testimony": "Direct statements or opinions from recognized experts",
    "statistical-data": "Numerical data from surveys, studies, or official statistics",
    "empirical-study": "Peer-reviewed research with methodology and results",
    "case-example": "Specific instances or examples illustrating a pattern",
    "causal-evidence": "Evidence showing cause-and-effect relationships",
    "analogical-case": "Similar situations that support reasoning by analogy",
    "classification-criteria": "Definitions or criteria for categorization",
    "position-to-know": "Evidence of firsthand access to relevant information",
    "witness-testimony": "Direct observation or experience from witnesses",
    "correlation-data": "Data showing relationships between variables",
    "general-knowledge": "Widely accepted facts or common knowledge",
  };
  return descriptions[type];
}

function getEvidenceExamples(type: EvidenceType): string[] {
  const examples: Record<EvidenceType, string[]> = {
    "expert-credentials": [
      "PhD from accredited institution",
      "Publication record in peer-reviewed journals",
      "Professional certifications or licenses",
    ],
    "expert-testimony": [
      "Quotes from expert interviews",
      "Expert opinion pieces in reputable outlets",
      "Court expert testimony",
    ],
    "statistical-data": [
      "Census data",
      "Economic indicators from government sources",
      "Survey results from reputable polling organizations",
    ],
    "empirical-study": [
      "Randomized controlled trials",
      "Longitudinal studies",
      "Meta-analyses of multiple studies",
    ],
    "case-example": [
      "Historical precedents",
      "News reports of specific incidents",
      "Documented case studies",
    ],
    "causal-evidence": [
      "Scientific experiments showing causation",
      "Temporal sequence documentation",
      "Controlled comparisons",
    ],
    "analogical-case": [
      "Similar legal cases",
      "Comparable historical events",
      "Parallel situations in different contexts",
    ],
    "classification-criteria": [
      "Legal definitions",
      "Scientific taxonomies",
      "Official standards or specifications",
    ],
    "position-to-know": [
      "Eyewitness accounts",
      "Internal documents from organizations",
      "Insider reports",
    ],
    "witness-testimony": [
      "First-person accounts",
      "Sworn affidavits",
      "Interview transcripts",
    ],
    "correlation-data": [
      "Scatter plots showing relationships",
      "Regression analyses",
      "Time series comparisons",
    ],
    "general-knowledge": [
      "Encyclopedia entries",
      "Textbook explanations",
      "Widely reported facts",
    ],
  };
  return examples[type] || [];
}

function getQualityCriteria(type: EvidenceType): string[] {
  const criteria: Record<EvidenceType, string[]> = {
    "expert-credentials": [
      "Relevant field of expertise",
      "Recognition by peers",
      "No conflicts of interest",
    ],
    "expert-testimony": [
      "Clear attribution",
      "Context provided",
      "Consistency with other experts",
    ],
    "statistical-data": [
      "Reputable source",
      "Adequate sample size",
      "Recent data",
    ],
    "empirical-study": [
      "Peer-reviewed publication",
      "Sound methodology",
      "Replicated findings",
    ],
    "case-example": [
      "Verifiable details",
      "Representative of pattern",
      "Properly contextualized",
    ],
    "causal-evidence": [
      "Temporal precedence shown",
      "Alternative causes ruled out",
      "Mechanism explained",
    ],
    "analogical-case": [
      "Relevant similarities",
      "Differences acknowledged",
      "Proportional reasoning",
    ],
    "classification-criteria": [
      "Authoritative source",
      "Clear definitions",
      "Consistently applied",
    ],
    "position-to-know": [
      "Direct access verified",
      "Credibility established",
      "Corroboration when possible",
    ],
    "witness-testimony": [
      "First-hand observation",
      "Consistent account",
      "No motivation to lie",
    ],
    "correlation-data": [
      "Statistical significance",
      "Adequate controls",
      "Causation not assumed",
    ],
    "general-knowledge": [
      "Widely accepted",
      "Uncontroversial",
      "Easily verified",
    ],
  };
  return criteria[type] || [];
}
```

## Testing

**File**: `components/argumentation/__tests__/EvidenceGuidance.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EvidenceGuidance } from "../EvidenceGuidance";

describe("EvidenceGuidance", () => {
  const mockProps = {
    requiredEvidenceTypes: ["expert-credentials", "statistical-data"] as any[],
    premiseKey: "premise-1",
    premiseText: "Dr. Smith is qualified in this field",
  };

  it("should render evidence coverage indicator", () => {
    render(<EvidenceGuidance {...mockProps} />);

    expect(screen.getByText("Evidence Coverage")).toBeInTheDocument();
    expect(screen.getByText("0 of 2 types")).toBeInTheDocument();
  });

  it("should add new evidence link", () => {
    const mockOnChange = jest.fn();
    render(<EvidenceGuidance {...mockProps} onEvidenceChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/https:\/\/example.com/);
    fireEvent.change(input, { target: { value: "https://example.com/study" } });

    const addButton = screen.getByRole("button", { name: "" }); // Upload button
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          url: "https://example.com/study",
          evidenceType: "expert-credentials",
        }),
      ])
    );
  });

  it("should remove evidence", () => {
    const mockOnChange = jest.fn();
    const existing = [
      {
        id: "ev-1",
        url: "https://example.com",
        evidenceType: "expert-credentials" as any,
      },
    ];

    render(
      <EvidenceGuidance
        {...mockProps}
        existingEvidence={existing}
        onEvidenceChange={mockOnChange}
      />
    );

    const removeButton = screen.getByRole("button", { name: "" }); // Trash button
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it("should show evidence type guide", () => {
    render(<EvidenceGuidance {...mockProps} />);

    fireEvent.click(screen.getByText("Evidence Guide"));

    expect(screen.getByText("Expert Credentials")).toBeInTheDocument();
    expect(screen.getByText("Statistical Data")).toBeInTheDocument();
  });

  it("should calculate coverage correctly", () => {
    const existing = [
      {
        id: "ev-1",
        url: "https://example.com",
        evidenceType: "expert-credentials" as any,
      },
    ];

    render(<EvidenceGuidance {...mockProps} existingEvidence={existing} />);

    expect(screen.getByText("1 of 2 types")).toBeInTheDocument();
  });

  it("should show missing evidence types", () => {
    render(<EvidenceGuidance {...mockProps} />);

    expect(screen.getByText(/Still needed:/)).toBeInTheDocument();
    expect(screen.getByText(/Expert Credentials, Statistical Data/)).toBeInTheDocument();
  });
});
```

## Time Allocation

- Core evidence form: 2 hours
- Evidence library integration: 1.5 hours
- Evidence type guide: 1.5 hours
- Testing: 1 hour

## Deliverables

- ✅ `EvidenceGuidance` component with tabbed interface
- ✅ Evidence coverage indicator
- ✅ Add evidence form with type selection
- ✅ Evidence item display with quality indicators
- ✅ Evidence library search integration
- ✅ Comprehensive evidence type guide
- ✅ Quality scoring display
- ✅ Comprehensive test suite

---

# Step 3.2.5: Attack Preview & Submission Component (6 hours)

## Overview

Create the final review and submission component that shows a formatted preview of the complete attack argument, runs final validation checks, handles submission with analytics, and manages success/error states.

## Component Structure

**File**: `components/argumentation/AttackPreviewSubmission.tsx`

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  ArrowLeft,
  ExternalLink,
  FileText,
  Target,
  Scale,
  Star,
} from "lucide-react";
import type { AttackSuggestion, ArgumentTemplate } from "@/app/server/services/ArgumentGenerationService";

// ============================================================================
// Types
// ============================================================================

interface AttackPreviewSubmissionProps {
  suggestion: AttackSuggestion;
  template: ArgumentTemplate;
  filledPremises: Record<string, string>;
  evidenceLinks: Record<string, string[]>;
  score: {
    overallScore: number;
    premiseScores: Record<string, number>;
    missingElements: string[];
    suggestions: string[];
  };
  claimId: string;
  deliberationId: string;
  onBack?: () => void;
  onSuccess?: (argumentId: string) => void;
}

interface ValidationCheck {
  id: string;
  label: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function AttackPreviewSubmission({
  suggestion,
  template,
  filledPremises,
  evidenceLinks,
  score,
  claimId,
  deliberationId,
  onBack,
  onSuccess,
}: AttackPreviewSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationChecks = runValidationChecks(
    template,
    filledPremises,
    evidenceLinks,
    score
  );
  const canSubmit = validationChecks.every((check) => check.status !== "fail");

  async function handleSubmit() {
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
          metadata: {
            usedSuggestion: true,
            suggestionId: suggestion.id,
            strategicValue: suggestion.strategicValue,
            strengthScore: suggestion.strengthScore,
            qualityScore: score.overallScore,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create argument");
      }

      const data = await response.json();

      // Track analytics
      trackArgumentSubmission({
        argumentId: data.argument.id,
        attackType: suggestion.attackType,
        schemeId: template.schemeId,
        qualityScore: score.overallScore,
        usedSuggestion: true,
        evidenceCount: Object.values(evidenceLinks).flat().length,
      });

      onSuccess?.(data.argument.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function generateArgumentText(): string {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <CardTitle>Preview & Submit Attack</CardTitle>
            </div>
            <QualityScoreBadge score={score.overallScore} />
          </div>
          <CardDescription>Review your argument before submitting</CardDescription>
        </CardHeader>
      </Card>

      {/* Validation checks */}
      <ValidationChecksDisplay checks={validationChecks} />

      {/* Argument preview */}
      <ArgumentPreview
        suggestion={suggestion}
        template={template}
        filledPremises={filledPremises}
        evidenceLinks={evidenceLinks}
        score={score}
      />

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Edit
        </Button>

        <div className="flex items-center gap-3">
          {!canSubmit && (
            <span className="text-sm text-muted-foreground">
              Fix validation issues to submit
            </span>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Attack
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Quality Score Badge
// ============================================================================

function QualityScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Quality:</span>
      <Badge
        variant={score >= 70 ? "default" : score >= 40 ? "secondary" : "destructive"}
        className="text-base px-3 py-1"
      >
        <Star className="h-4 w-4 mr-1" />
        {Math.round(score)}%
      </Badge>
    </div>
  );
}

// ============================================================================
// Validation Checks Display
// ============================================================================

function ValidationChecksDisplay({ checks }: { checks: ValidationCheck[] }) {
  const passedCount = checks.filter((c) => c.status === "pass").length;
  const progress = (passedCount / checks.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Validation Checks</CardTitle>
        <CardDescription>
          {passedCount} of {checks.length} checks passed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />

        <div className="space-y-2">
          {checks.map((check) => (
            <ValidationCheckItem key={check.id} check={check} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Validation Check Item
// ============================================================================

function ValidationCheckItem({ check }: { check: ValidationCheck }) {
  const config = {
    pass: {
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    warning: {
      icon: AlertCircle,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
    },
    fail: {
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
  };

  const { icon: Icon, color, bg, border } = config[check.status];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${bg} ${border}`}>
      <Icon className={`h-5 w-5 mt-0.5 ${color}`} />
      <div className="flex-1">
        <p className="text-sm font-medium">{check.label}</p>
        <p className="text-xs text-muted-foreground mt-1">{check.message}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Argument Preview
// ============================================================================

interface ArgumentPreviewProps {
  suggestion: AttackSuggestion;
  template: ArgumentTemplate;
  filledPremises: Record<string, string>;
  evidenceLinks: Record<string, string[]>;
  score: any;
}

function ArgumentPreview({
  suggestion,
  template,
  filledPremises,
  evidenceLinks,
  score,
}: ArgumentPreviewProps) {
  const totalEvidence = Object.values(evidenceLinks).flat().length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Your Attack Argument
        </CardTitle>
        <CardDescription>How your argument will appear to others</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Attack metadata */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">{suggestion.attackType}</Badge>
          <Badge variant="outline">
            <Target className="h-3 w-3 mr-1" />
            {suggestion.targetScope}
          </Badge>
          <Badge variant="outline">
            <Scale className="h-3 w-3 mr-1" />
            {suggestion.burdenOfProof === "proponent" ? "Burden Advantage" : "You bear burden"}
          </Badge>
          {totalEvidence > 0 && (
            <Badge variant="secondary">
              {totalEvidence} {totalEvidence === 1 ? "source" : "sources"}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Critical question */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Critical Question:</p>
          <p className="text-base">{suggestion.cq.question}</p>
        </div>

        <Separator />

        {/* Premises */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Argument:</p>

          {template.premises
            .filter((p) => filledPremises[p.key])
            .map((premise, idx) => (
              <div key={premise.key} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary font-medium text-sm h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{filledPremises[premise.key]}</p>

                    {/* Premise quality indicator */}
                    {score.premiseScores[premise.key] !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress
                          value={score.premiseScores[premise.key]}
                          className="h-1 w-24"
                        />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(score.premiseScores[premise.key])}% strength
                        </span>
                      </div>
                    )}

                    {/* Evidence links */}
                    {evidenceLinks[premise.key]?.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Sources:</p>
                        {evidenceLinks[premise.key].map((link, linkIdx) => (
                          <a
                            key={linkIdx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {link.length > 60 ? link.substring(0, 60) + "..." : link}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>

        <Separator />

        {/* Conclusion */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Therefore:</p>
          <div className="bg-primary/5 border-l-4 border-primary p-4 rounded">
            <p className="text-base font-medium">{template.conclusion}</p>
          </div>
        </div>

        {/* Score breakdown */}
        {score.overallScore < 70 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-sm">
                  Your argument could be stronger. Consider:
                </p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  {score.suggestions.map((suggestion: string, idx: number) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function runValidationChecks(
  template: ArgumentTemplate,
  filledPremises: Record<string, string>,
  evidenceLinks: Record<string, string[]>,
  score: any
): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // Check 1: Required premises filled
  const requiredPremises = template.premises.filter((p) => p.required);
  const filledRequired = requiredPremises.filter(
    (p) => filledPremises[p.key] && filledPremises[p.key].trim() !== ""
  );

  checks.push({
    id: "required-premises",
    label: "All required premises completed",
    status: filledRequired.length === requiredPremises.length ? "pass" : "fail",
    message:
      filledRequired.length === requiredPremises.length
        ? "All required premises have been filled"
        : `${requiredPremises.length - filledRequired.length} required premise(s) missing`,
  });

  // Check 2: Overall quality score
  checks.push({
    id: "quality-score",
    label: "Argument quality threshold",
    status: score.overallScore >= 40 ? "pass" : "fail",
    message:
      score.overallScore >= 40
        ? `Quality score: ${Math.round(score.overallScore)}%`
        : `Quality too low: ${Math.round(score.overallScore)}% (need 40% minimum)`,
  });

  // Check 3: Evidence provided
  const totalEvidence = Object.values(evidenceLinks).flat().length;
  checks.push({
    id: "evidence-links",
    label: "Supporting evidence",
    status: totalEvidence > 0 ? "pass" : "warning",
    message:
      totalEvidence > 0
        ? `${totalEvidence} source(s) provided`
        : "No evidence added. Consider adding sources to strengthen your argument.",
  });

  // Check 4: Premise strength
  const weakPremises = Object.entries(score.premiseScores).filter(
    ([key, score]) => score < 40
  );
  checks.push({
    id: "premise-strength",
    label: "Individual premise strength",
    status: weakPremises.length === 0 ? "pass" : "warning",
    message:
      weakPremises.length === 0
        ? "All premises meet strength threshold"
        : `${weakPremises.length} premise(s) could be stronger`,
  });

  // Check 5: Length checks
  const tooShort = Object.values(filledPremises).filter(
    (text) => text.trim().length < 20
  );
  checks.push({
    id: "premise-length",
    label: "Premise detail level",
    status: tooShort.length === 0 ? "pass" : "warning",
    message:
      tooShort.length === 0
        ? "All premises have sufficient detail"
        : `${tooShort.length} premise(s) may be too brief`,
  });

  return checks;
}

function trackArgumentSubmission(data: {
  argumentId: string;
  attackType: string;
  schemeId: string;
  qualityScore: number;
  usedSuggestion: boolean;
  evidenceCount: number;
}) {
  if (typeof window !== "undefined" && (window as any).analytics) {
    (window as any).analytics.track("Attack Argument Submitted", data);
  }
}
```

## Testing

**File**: `components/argumentation/__tests__/AttackPreviewSubmission.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AttackPreviewSubmission } from "../AttackPreviewSubmission";

describe("AttackPreviewSubmission", () => {
  const mockProps = {
    suggestion: {
      id: "attack-1",
      cq: { id: "cq-1", question: "Is the expert qualified?" },
      attackType: "UNDERMINES" as const,
      targetScope: "premise",
      burdenOfProof: "proponent" as const,
      requiresEvidence: false,
      strategicValue: 85,
      strengthScore: 80,
    },
    template: {
      schemeId: "expert-opinion",
      schemeName: "Expert Opinion",
      premises: [
        { key: "p1", content: "Premise 1", required: true, type: "ordinary" },
      ],
      conclusion: "Expert is unreliable",
      variables: {},
      prefilledPremises: {},
      prefilledVariables: {},
      constructionSteps: [],
      evidenceRequirements: [],
    },
    filledPremises: { p1: "Dr. Smith lacks credentials in this field" },
    evidenceLinks: { p1: ["https://example.com/source"] },
    score: {
      overallScore: 75,
      premiseScores: { p1: 80 },
      missingElements: [],
      suggestions: [],
    },
    claimId: "claim-1",
    deliberationId: "delib-1",
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("should display validation checks", () => {
    render(<AttackPreviewSubmission {...mockProps} />);

    expect(screen.getByText("Validation Checks")).toBeInTheDocument();
    expect(screen.getByText(/All required premises completed/)).toBeInTheDocument();
    expect(screen.getByText(/Argument quality threshold/)).toBeInTheDocument();
  });

  it("should show argument preview", () => {
    render(<AttackPreviewSubmission {...mockProps} />);

    expect(screen.getByText("Your Attack Argument")).toBeInTheDocument();
    expect(screen.getByText("Is the expert qualified?")).toBeInTheDocument();
    expect(screen.getByText("Dr. Smith lacks credentials in this field")).toBeInTheDocument();
    expect(screen.getByText("Expert is unreliable")).toBeInTheDocument();
  });

  it("should disable submit button if validation fails", () => {
    const lowScoreProps = {
      ...mockProps,
      score: { ...mockProps.score, overallScore: 30 },
    };

    render(<AttackPreviewSubmission {...lowScoreProps} />);

    const submitButton = screen.getByText("Submit Attack");
    expect(submitButton).toBeDisabled();
  });

  it("should submit argument successfully", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ argument: { id: "new-arg-1" } }),
    });

    const mockOnSuccess = jest.fn();
    render(<AttackPreviewSubmission {...mockProps} onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByText("Submit Attack");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith("new-arg-1");
    });
  });

  it("should handle submission errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Submission failed" }),
    });

    render(<AttackPreviewSubmission {...mockProps} />);

    const submitButton = screen.getByText("Submit Attack");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Submission failed")).toBeInTheDocument();
    });
  });

  it("should show warning for low quality score", () => {
    const lowQualityProps = {
      ...mockProps,
      score: {
        overallScore: 55,
        premiseScores: { p1: 55 },
        missingElements: [],
        suggestions: ["Add more specific details", "Include citations"],
      },
    };

    render(<AttackPreviewSubmission {...lowQualityProps} />);

    expect(screen.getByText(/Your argument could be stronger/)).toBeInTheDocument();
    expect(screen.getByText("Add more specific details")).toBeInTheDocument();
  });
});
```

## Time Allocation

- Preview component: 2 hours
- Validation checks: 1.5 hours
- Submission handling: 1.5 hours
- Testing: 1 hour

## Deliverables

- ✅ `AttackPreviewSubmission` component
- ✅ Validation checks display with progress
- ✅ Formatted argument preview
- ✅ Quality score visualization
- ✅ Evidence display with links
- ✅ Submission with error handling
- ✅ Analytics tracking
- ✅ Comprehensive test suite

---

# Phase 3.2 Summary

## Completed Steps (40 hours)

**Week 10: Attack Generator UI**

1. **Step 3.2.1: AttackSuggestions Component** (10 hours) ✅
   - Suggestion loading and display
   - Sorting (4 criteria) and filtering (attack types)
   - Score indicators and burden badges
   - Selection and state management

2. **Step 3.2.2: AttackConstructionWizard** (12 hours) ✅
   - 4-step wizard (Overview, Premises, Evidence, Review)
   - Real-time scoring integration
   - Progress tracking
   - Template-based construction

3. **Step 3.2.3: BurdenOfProofIndicators** (6 hours) ✅
   - Compact and expanded modes
   - Visual burden comparison charts
   - Strategic implications guidance
   - Rules and examples tabs

4. **Step 3.2.4: EvidenceGuidance** (6 hours) ✅
   - Evidence type selection and guidance
   - Evidence library search
   - Coverage indicators
   - Quality scoring

5. **Step 3.2.5: AttackPreviewSubmission** (6 hours) ✅
   - Validation checks
   - Formatted preview
   - Submission handling
   - Analytics tracking

## Total Deliverables

- ✅ 5 major React components (~2,000 lines of TypeScript)
- ✅ 12 supporting subcomponents
- ✅ 50+ test cases across all components
- ✅ 15+ Storybook stories
- ✅ Complete integration with backend services
- ✅ Real-time scoring and feedback
- ✅ Accessibility features throughout
- ✅ Analytics tracking

## Next Phase

Phase 3.3: Construction Wizard (Week 11, 40 hours)
- Support argument generation
- Evidence matching visualization
- Collaborative features
- Template library

---

**Phase 3.2 (Attack Generator UI) COMPLETE**

*Document created: [Current Date]*
*Total time documented: 40 hours*
