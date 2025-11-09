# Deliberation System Overhaul - Implementation Plan (Part 3)
## Phase 3: Argument Generation - Proactive Construction & Attack/Support Assistance

**Document Version**: 1.0  
**Date**: November 8, 2025  
**Status**: Detailed Implementation Specification  
**Estimated Total Time**: ~160 hours (4 weeks)

---

## Overview

This document details **Phase 3: Argument Generation**, the most transformative feature in the deliberation system overhaul. This phase shifts Mesh from a **reactive analysis tool** (identifying schemes in existing arguments) to a **proactive construction platform** (helping users generate arguments strategically).

### Strategic Value

**Current State**: Users manually construct arguments, often struggling with:
- "How should I attack this claim?"
- "What kind of argument should I make?"
- "Which critical questions are most effective?"
- "What evidence do I need?"

**After Phase 3**: System becomes an **intelligent assistant**:
- Suggests attack vectors based on scheme analysis
- Generates argument templates
- Ranks options by dialectical strength
- Guides evidence collection
- Estimates argument effectiveness

### Theoretical Foundation

From Carneades (Section 8.7 of strategy document):
> "Schemes enable argument invention, not just analysis."

From Gordon & Walton burden of proof research:
> "Different CQs have different dialectical functions - some shift burden, others require evidence."

**Key Insight**: With structured schemes + CQs + burden of proof rules, we can **algorithmically generate attack/support strategies**.

---

## Phase 3 Structure

**Phase 3.1**: Backend Services (Week 9) - 40 hours  
**Phase 3.2**: Attack Generator UI (Week 10) - 40 hours  
**Phase 3.3**: Construction Wizard (Week 11) - 40 hours  
**Phase 3.4**: Support Generator (Week 12) - 40 hours

---

# Phase 3.1: Backend Services (Week 9)

**Estimated Time**: 40 hours (5 days)  
**Dependencies**: Phase 0 (burden of proof), Phase 1 (multi-scheme arguments)

## Overview

Build the core backend infrastructure for argument generation. This includes:
1. **ArgumentGenerationService** - Central orchestration
2. **Attack suggestion algorithm** - Analyze target, suggest CQ-based attacks
3. **Support suggestion algorithm** - Match evidence to schemes
4. **Template generation** - Create structured argument templates
5. **Confidence scoring** - Estimate argument strength

---

## Step 3.1.1: ArgumentGenerationService Architecture (8 hours)

### Core Service Structure

**File**: `app/server/services/ArgumentGenerationService.ts`

```typescript
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ArgumentScheme,
  CriticalQuestion,
  Argument,
  ArgumentSchemeInstance,
} from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export type AttackSuggestion = {
  id: string;
  cq: CriticalQuestion;
  targetSchemeInstance: ArgumentSchemeInstance;
  attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES";
  targetScope: "conclusion" | "inference" | "premise";
  
  // Burden & Evidence
  burdenOfProof: "proponent" | "challenger";
  requiresEvidence: boolean;
  evidenceTypes: string[];
  
  // Guidance
  template: ArgumentTemplate;
  exampleAttacks: string[];
  commonResponses: string[];
  
  // Scoring
  strengthScore: number; // 0-100
  difficultyScore: number; // 0-100 (lower = easier for user)
  strategicValue: number; // 0-100 (impact on deliberation)
  
  // Justification
  reasoning: string;
};

export type SupportSuggestion = {
  id: string;
  scheme: ArgumentScheme;
  claimId: string;
  
  // Premise matching
  matchedPremises: PremiseMatch[];
  missingPremises: SchemePremise[];
  confidence: number; // 0-1
  
  // Guidance
  template: ArgumentTemplate;
  evidenceGuidance: string[];
  
  // Scoring
  strengthScore: number;
  completeness: number; // Percentage of premises we can fill
};

export type ArgumentTemplate = {
  schemeId: string;
  schemeName: string;
  
  // Structure
  premises: PremiseTemplate[];
  conclusion: string;
  variables: Record<string, string>; // Variable → description
  
  // Pre-filled content
  prefilledPremises: Record<string, string>; // Premise key → content
  prefilledVariables: Record<string, string>; // Variable → value
  
  // Guidance
  constructionSteps: string[];
  evidenceRequirements: string[];
};

export type PremiseTemplate = {
  key: string;
  content: string; // With variables like {agent}, {action}
  required: boolean;
  type: "ordinary" | "assumption" | "exception";
  evidenceType?: string;
};

export type PremiseMatch = {
  premise: PremiseTemplate;
  matchedEvidence: string;
  confidence: number;
};

export type SchemePremise = {
  key: string;
  content: string;
  type: "ordinary" | "assumption" | "exception";
};

// ============================================================================
// ArgumentGenerationService
// ============================================================================

export class ArgumentGenerationService {
  /**
   * Generate attack suggestions for a target argument or claim
   */
  async suggestAttacks(params: {
    targetClaimId: string;
    targetArgumentId?: string;
    userId: string;
    context?: {
      deliberationId?: string;
      existingArguments?: string[]; // Already made these attacks
    };
  }): Promise<AttackSuggestion[]> {
    const { targetClaimId, targetArgumentId, userId, context } = params;

    // 1. Get target argument (if specific) or all arguments for claim
    const targetArguments = targetArgumentId
      ? [await this.getArgumentWithSchemes(targetArgumentId)]
      : await this.getClaimArguments(targetClaimId);

    if (targetArguments.length === 0) {
      // No structured arguments yet - suggest general rebuttal
      return this.suggestGeneralRebuttal(targetClaimId);
    }

    // 2. For each argument, identify schemes and generate CQ-based attacks
    const allSuggestions: AttackSuggestion[] = [];

    for (const argument of targetArguments) {
      const schemes = await this.getArgumentSchemes(argument.id);
      
      for (const schemeInstance of schemes) {
        const cqAttacks = await this.generateCQAttacks(
          argument,
          schemeInstance,
          context
        );
        allSuggestions.push(...cqAttacks);
      }
    }

    // 3. Filter out attacks user already made
    const filtered = context?.existingArguments
      ? allSuggestions.filter(s => !this.isAttackMade(s, context.existingArguments!))
      : allSuggestions;

    // 4. Score and rank suggestions
    const scored = await this.scoreAttackSuggestions(filtered, userId);

    // 5. Return top suggestions (limit to 10)
    return scored
      .sort((a, b) => b.strategicValue - a.strategicValue)
      .slice(0, 10);
  }

  /**
   * Generate support suggestions for a claim
   */
  async suggestSupport(params: {
    claimId: string;
    userId: string;
    availableEvidence?: string[]; // User-provided evidence
    context?: {
      deliberationId?: string;
      existingArguments?: string[];
    };
  }): Promise<SupportSuggestion[]> {
    const { claimId, userId, availableEvidence = [], context } = params;

    // 1. Get claim details
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { topic: true },
    });

    if (!claim) throw new Error("Claim not found");

    // 2. Determine applicable schemes based on claim type
    const applicableSchemes = await this.getApplicableSchemes(claim);

    // 3. For each scheme, try to match evidence to premises
    const suggestions: SupportSuggestion[] = [];

    for (const scheme of applicableSchemes) {
      const match = await this.matchEvidenceToScheme(
        scheme,
        claim,
        availableEvidence
      );

      if (match.confidence > 0.3) {
        // At least 30% premise match
        suggestions.push(match);
      }
    }

    // 4. Score and rank
    const scored = await this.scoreSupportSuggestions(suggestions, userId);

    // 5. Return top suggestions
    return scored
      .sort((a, b) => b.strengthScore - a.strengthScore)
      .slice(0, 10);
  }

  /**
   * Generate argument template from scheme
   */
  async generateTemplate(params: {
    schemeId: string;
    claimId: string;
    attackType?: "REBUTS" | "UNDERCUTS" | "UNDERMINES";
    targetCQ?: string; // If attacking via specific CQ
    prefilledData?: Record<string, string>;
  }): Promise<ArgumentTemplate> {
    const { schemeId, claimId, attackType, targetCQ, prefilledData } = params;

    // 1. Get scheme with formal structure
    const scheme = await prisma.argumentScheme.findUnique({
      where: { id: schemeId },
      include: {
        criticalQuestions: true,
      },
    });

    if (!scheme) throw new Error("Scheme not found");

    // 2. Get claim
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) throw new Error("Claim not found");

    // 3. Build premise templates
    const premises = this.buildPremiseTemplates(scheme, prefilledData);

    // 4. Determine conclusion based on attack type
    const conclusion = attackType
      ? this.buildAttackConclusion(claim, attackType, targetCQ)
      : claim.text;

    // 5. Extract variables and prefill what we can
    const variables = this.extractVariables(scheme);
    const prefilledVariables = this.prefillVariables(
      variables,
      claim,
      prefilledData
    );

    // 6. Generate construction guidance
    const constructionSteps = this.generateConstructionSteps(scheme, attackType);
    const evidenceRequirements = this.determineEvidenceRequirements(premises);

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      premises,
      conclusion,
      variables,
      prefilledPremises: prefilledData || {},
      prefilledVariables,
      constructionSteps,
      evidenceRequirements,
    };
  }

  /**
   * Estimate confidence/strength of a partially constructed argument
   */
  async scoreArgument(params: {
    schemeId: string;
    filledPremises: Record<string, string>; // Premise key → user content
    claimId: string;
  }): Promise<{
    overallScore: number; // 0-100
    premiseScores: Record<string, number>;
    missingElements: string[];
    suggestions: string[];
  }> {
    const { schemeId, filledPremises, claimId } = params;

    // Implementation in Step 3.1.5
    return this.computeArgumentScore(schemeId, filledPremises, claimId);
  }

  // ============================================================================
  // Private Helper Methods (implemented in following steps)
  // ============================================================================

  private async getArgumentWithSchemes(argumentId: string) {
    return prisma.argument.findUnique({
      where: { id: argumentId },
      include: {
        schemes: {
          include: {
            scheme: {
              include: {
                criticalQuestions: true,
              },
            },
          },
        },
        claim: true,
      },
    });
  }

  private async getClaimArguments(claimId: string) {
    return prisma.argument.findMany({
      where: { claimId },
      include: {
        schemes: {
          include: {
            scheme: {
              include: {
                criticalQuestions: true,
              },
            },
          },
        },
        claim: true,
      },
    });
  }

  private async getArgumentSchemes(argumentId: string) {
    return prisma.argumentSchemeInstance.findMany({
      where: { argumentId },
      include: {
        scheme: {
          include: {
            criticalQuestions: true,
          },
        },
      },
    });
  }

  private async suggestGeneralRebuttal(claimId: string): Promise<AttackSuggestion[]> {
    // Implementation in Step 3.1.2
    return [];
  }

  private async generateCQAttacks(
    argument: any,
    schemeInstance: any,
    context?: any
  ): Promise<AttackSuggestion[]> {
    // Implementation in Step 3.1.2
    return [];
  }

  private isAttackMade(suggestion: AttackSuggestion, existingArgs: string[]): boolean {
    // Check if user already made this type of attack
    // Implementation in Step 3.1.2
    return false;
  }

  private async scoreAttackSuggestions(
    suggestions: AttackSuggestion[],
    userId: string
  ): Promise<AttackSuggestion[]> {
    // Implementation in Step 3.1.5
    return suggestions;
  }

  private async getApplicableSchemes(claim: any) {
    // Implementation in Step 3.1.3
    return [];
  }

  private async matchEvidenceToScheme(
    scheme: any,
    claim: any,
    evidence: string[]
  ): Promise<SupportSuggestion> {
    // Implementation in Step 3.1.3
    return {} as SupportSuggestion;
  }

  private async scoreSupportSuggestions(
    suggestions: SupportSuggestion[],
    userId: string
  ): Promise<SupportSuggestion[]> {
    // Implementation in Step 3.1.5
    return suggestions;
  }

  private buildPremiseTemplates(
    scheme: any,
    prefilledData?: Record<string, string>
  ): PremiseTemplate[] {
    // Implementation in Step 3.1.4
    return [];
  }

  private buildAttackConclusion(
    claim: any,
    attackType: string,
    targetCQ?: string
  ): string {
    // Implementation in Step 3.1.4
    return "";
  }

  private extractVariables(scheme: any): Record<string, string> {
    // Implementation in Step 3.1.4
    return {};
  }

  private prefillVariables(
    variables: Record<string, string>,
    claim: any,
    prefilledData?: Record<string, string>
  ): Record<string, string> {
    // Implementation in Step 3.1.4
    return {};
  }

  private generateConstructionSteps(
    scheme: any,
    attackType?: string
  ): string[] {
    // Implementation in Step 3.1.4
    return [];
  }

  private determineEvidenceRequirements(premises: PremiseTemplate[]): string[] {
    // Implementation in Step 3.1.4
    return [];
  }

  private async computeArgumentScore(
    schemeId: string,
    filledPremises: Record<string, string>,
    claimId: string
  ) {
    // Implementation in Step 3.1.5
    return {
      overallScore: 0,
      premiseScores: {},
      missingElements: [],
      suggestions: [],
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const argumentGenerationService = new ArgumentGenerationService();
```

### Integration Points

**1. API Routes** (create in following steps):
- `app/api/arguments/suggest-attacks/route.ts`
- `app/api/arguments/suggest-support/route.ts`
- `app/api/arguments/generate-template/route.ts`
- `app/api/arguments/score/route.ts`

**2. Database Dependencies**:
- `ArgumentSchemeInstance` (from Phase 1)
- `CriticalQuestion.burdenOfProof` (from Phase 0)
- `CriticalQuestion.requiresEvidence` (from Phase 0)

**3. Client Hooks** (create in Phase 3.2):
- `useAttackSuggestions()`
- `useSupportSuggestions()`
- `useArgumentTemplate()`

### Testing Strategy

```typescript
// tests/services/ArgumentGenerationService.test.ts

describe("ArgumentGenerationService", () => {
  describe("suggestAttacks", () => {
    it("should generate CQ-based attacks for single-scheme argument", async () => {
      // Test with expert opinion scheme
      const suggestions = await service.suggestAttacks({
        targetClaimId: "claim-1",
        targetArgumentId: "arg-1",
        userId: "user-1",
      });

      expect(suggestions).toHaveLength(5); // 5 CQs for expert opinion
      expect(suggestions[0].cq.question).toContain("expert");
      expect(suggestions[0].burdenOfProof).toBe("proponent");
    });

    it("should handle multi-scheme arguments", async () => {
      // Test with value-based practical reasoning (2 schemes)
      const suggestions = await service.suggestAttacks({
        targetClaimId: "claim-2",
        targetArgumentId: "arg-2",
        userId: "user-1",
      });

      expect(suggestions.length).toBeGreaterThan(5); // CQs from multiple schemes
    });

    it("should filter already-made attacks", async () => {
      const suggestions = await service.suggestAttacks({
        targetClaimId: "claim-1",
        targetArgumentId: "arg-1",
        userId: "user-1",
        context: {
          existingArguments: ["existing-attack-1"],
        },
      });

      // Should not suggest attacks user already made
      expect(suggestions.every(s => s.id !== "existing-attack-1")).toBe(true);
    });

    it("should rank by strategic value", async () => {
      const suggestions = await service.suggestAttacks({
        targetClaimId: "claim-1",
        targetArgumentId: "arg-1",
        userId: "user-1",
      });

      // Should be sorted by strategic value descending
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].strategicValue).toBeGreaterThanOrEqual(
          suggestions[i + 1].strategicValue
        );
      }
    });
  });

  describe("suggestSupport", () => {
    it("should match evidence to scheme premises", async () => {
      const suggestions = await service.suggestSupport({
        claimId: "claim-1",
        userId: "user-1",
        availableEvidence: [
          "Expert Dr. Smith says X",
          "Study shows Y",
        ],
      });

      expect(suggestions[0].matchedPremises.length).toBeGreaterThan(0);
      expect(suggestions[0].confidence).toBeGreaterThan(0.5);
    });

    it("should identify missing premises", async () => {
      const suggestions = await service.suggestSupport({
        claimId: "claim-1",
        userId: "user-1",
        availableEvidence: ["Partial evidence"],
      });

      expect(suggestions[0].missingPremises.length).toBeGreaterThan(0);
      expect(suggestions[0].completeness).toBeLessThan(1.0);
    });
  });

  describe("generateTemplate", () => {
    it("should create argument template from scheme", async () => {
      const template = await service.generateTemplate({
        schemeId: "expert-opinion",
        claimId: "claim-1",
      });

      expect(template.premises).toHaveLength(4); // Expert opinion has 4 premises
      expect(template.variables).toHaveProperty("expert");
      expect(template.variables).toHaveProperty("domain");
      expect(template.constructionSteps.length).toBeGreaterThan(0);
    });

    it("should prefill data when available", async () => {
      const template = await service.generateTemplate({
        schemeId: "expert-opinion",
        claimId: "claim-1",
        prefilledData: {
          "premise-1": "Dr. Smith is an expert in climate science",
        },
      });

      expect(template.prefilledPremises["premise-1"]).toBe(
        "Dr. Smith is an expert in climate science"
      );
    });

    it("should generate attack-specific conclusion", async () => {
      const template = await service.generateTemplate({
        schemeId: "expert-opinion",
        claimId: "claim-1",
        attackType: "UNDERMINES",
        targetCQ: "cq-1",
      });

      expect(template.conclusion).toContain("not");
      expect(template.conclusion).toContain("expert");
    });
  });

  describe("scoreArgument", () => {
    it("should score complete arguments highly", async () => {
      const score = await service.scoreArgument({
        schemeId: "expert-opinion",
        filledPremises: {
          "premise-1": "Dr. Smith is an expert",
          "premise-2": "Dr. Smith is in relevant domain",
          "premise-3": "Dr. Smith asserts claim",
          "premise-4": "Claim is in domain",
        },
        claimId: "claim-1",
      });

      expect(score.overallScore).toBeGreaterThan(80);
      expect(score.missingElements).toHaveLength(0);
    });

    it("should identify missing elements", async () => {
      const score = await service.scoreArgument({
        schemeId: "expert-opinion",
        filledPremises: {
          "premise-1": "Dr. Smith is an expert",
        },
        claimId: "claim-1",
      });

      expect(score.overallScore).toBeLessThan(50);
      expect(score.missingElements.length).toBeGreaterThan(0);
      expect(score.suggestions.length).toBeGreaterThan(0);
    });
  });
});
```

**Time Allocation**:
- Service structure & types: 3 hours
- API integration points: 2 hours
- Testing infrastructure: 3 hours

**Deliverables**:
- ✅ `ArgumentGenerationService` class with type definitions
- ✅ Comprehensive test suite
- ✅ API route stubs

---

## Step 3.1.2: Attack Suggestion Algorithm (10 hours)

### Core Algorithm

Implement the attack generation logic based on critical questions.

**File**: `app/server/services/ArgumentGenerationService.ts` (add methods)

```typescript
// ============================================================================
// Attack Generation
// ============================================================================

/**
 * Generate CQ-based attack suggestions for an argument using a specific scheme
 */
private async generateCQAttacks(
  argument: ArgumentWithSchemes,
  schemeInstance: ArgumentSchemeInstanceWithScheme,
  context?: { existingArguments?: string[] }
): Promise<AttackSuggestion[]> {
  const scheme = schemeInstance.scheme;
  const cqs = scheme.criticalQuestions;

  if (!cqs || cqs.length === 0) {
    return [];
  }

  const suggestions: AttackSuggestion[] = [];

  for (const cq of cqs) {
    // Skip if user already attacked via this CQ
    if (this.isCQAttackMade(cq.id, context?.existingArguments)) {
      continue;
    }

    // Generate attack suggestion
    const suggestion = await this.buildAttackSuggestion(
      cq,
      scheme,
      schemeInstance,
      argument
    );

    suggestions.push(suggestion);
  }

  return suggestions;
}

/**
 * Build a complete attack suggestion from a CQ
 */
private async buildAttackSuggestion(
  cq: CriticalQuestion,
  scheme: ArgumentScheme,
  schemeInstance: ArgumentSchemeInstanceWithScheme,
  targetArgument: ArgumentWithSchemes
): Promise<AttackSuggestion> {
  // 1. Generate template for attacking via this CQ
  const template = await this.generateTemplate({
    schemeId: this.getAttackSchemeForCQ(cq, scheme),
    claimId: targetArgument.claimId,
    attackType: cq.attackType as any,
    targetCQ: cq.id,
  });

  // 2. Generate example attacks
  const exampleAttacks = this.generateExampleAttacks(cq, scheme, targetArgument);

  // 3. Identify common responses
  const commonResponses = this.getCommonResponses(cq);

  // 4. Initial scoring (refined in Step 3.1.5)
  const strengthScore = this.estimateAttackStrength(cq, schemeInstance);
  const difficultyScore = this.estimateDifficulty(cq);
  const strategicValue = this.estimateStrategicValue(cq, targetArgument);

  // 5. Generate reasoning
  const reasoning = this.generateAttackReasoning(cq, scheme, schemeInstance);

  return {
    id: `attack-${cq.id}-${schemeInstance.id}`,
    cq,
    targetSchemeInstance: schemeInstance,
    attackType: cq.attackType as any,
    targetScope: cq.targetScope as any,
    burdenOfProof: cq.burdenOfProof as any,
    requiresEvidence: cq.requiresEvidence,
    evidenceTypes: cq.evidenceTypes || [],
    template,
    exampleAttacks,
    commonResponses,
    strengthScore,
    difficultyScore,
    strategicValue,
    reasoning,
  };
}

/**
 * Determine which scheme to use for constructing attack via this CQ
 */
private getAttackSchemeForCQ(
  cq: CriticalQuestion,
  targetScheme: ArgumentScheme
): string {
  // If CQ invokes another scheme, use that
  if (cq.invokesScheme) {
    return cq.invokesScheme;
  }

  // Otherwise, use appropriate attack scheme based on CQ type
  switch (cq.attackType) {
    case "REBUTS":
      // Direct contradiction - use same scheme structure but opposite conclusion
      return targetScheme.id;

    case "UNDERCUTS":
      // Attack inference/warrant
      if (cq.question.toLowerCase().includes("expert")) {
        return "expert-opinion"; // Attack with counter-expert
      }
      if (cq.question.toLowerCase().includes("bias")) {
        return "argument-from-bias";
      }
      if (cq.question.toLowerCase().includes("correlation")) {
        return "causal-fallacy";
      }
      // Default: argument from commitment (inconsistency)
      return "argument-from-commitment";

    case "UNDERMINES":
      // Attack premise
      if (cq.question.toLowerCase().includes("evidence")) {
        return "argument-from-evidence";
      }
      if (cq.question.toLowerCase().includes("definition")) {
        return "argument-from-verbal-classification";
      }
      // Default: argument from position to know
      return "argument-from-position-to-know";

    default:
      return "general-rebuttal";
  }
}

/**
 * Generate example attacks for this CQ
 */
private generateExampleAttacks(
  cq: CriticalQuestion,
  scheme: ArgumentScheme,
  targetArgument: ArgumentWithSchemes
): string[] {
  const examples: string[] = [];

  // Use CQ's stored examples if available
  if (cq.exampleAttacks && cq.exampleAttacks.length > 0) {
    return cq.exampleAttacks;
  }

  // Generate scheme-specific examples
  const schemeName = scheme.name.toLowerCase();
  const claimText = targetArgument.claim.text;

  if (schemeName.includes("expert opinion")) {
    examples.push(
      `"The cited expert lacks credentials in this specific domain."`,
      `"Dr. [Name] has financial conflicts of interest."`,
      `"Multiple other experts disagree with this assessment."`
    );
  } else if (schemeName.includes("practical reasoning")) {
    examples.push(
      `"This action would create worse consequences than the current situation."`,
      `"There are more efficient alternatives available."`,
      `"The proposed action is practically impossible given current constraints."`
    );
  } else if (schemeName.includes("cause to effect")) {
    examples.push(
      `"The correlation does not imply causation."`,
      `"Other factors could explain the observed effect."`,
      `"The causal mechanism is not scientifically established."`
    );
  } else if (schemeName.includes("analogy")) {
    examples.push(
      `"The two cases differ in crucial respects."`,
      `"The dissimilarities outweigh the similarities."`,
      `"The conclusion doesn't follow even if the analogy holds."`
    );
  }

  // Generic fallback
  if (examples.length === 0) {
    examples.push(
      `"The premise '${cq.question}' is not adequately supported."`,
      `"Evidence contradicts this assumption."`,
      `"This reasoning contains a logical gap."`
    );
  }

  return examples;
}

/**
 * Get common responses proponents make to this CQ
 */
private getCommonResponses(cq: CriticalQuestion): string[] {
  if (cq.commonResponses && cq.commonResponses.length > 0) {
    return cq.commonResponses;
  }

  // Generic responses based on burden of proof
  if (cq.burdenOfProof === "proponent") {
    return [
      "Provides additional evidence to support the questioned premise",
      "Cites authoritative sources backing the claim",
      "Acknowledges limitation but argues it doesn't defeat argument",
    ];
  } else {
    return [
      "Challenges challenger to provide counter-evidence",
      "Arguments the question is irrelevant to core claim",
      "Requests more specific objection",
    ];
  }
}

/**
 * Generate reasoning for why this attack is suggested
 */
private generateAttackReasoning(
  cq: CriticalQuestion,
  scheme: ArgumentScheme,
  schemeInstance: ArgumentSchemeInstanceWithScheme
): string {
  const parts: string[] = [];

  // Explain attack type
  switch (cq.attackType) {
    case "REBUTS":
      parts.push("This attack directly contradicts the conclusion.");
      break;
    case "UNDERCUTS":
      parts.push("This attack challenges the reasoning that connects premises to conclusion.");
      break;
    case "UNDERMINES":
      parts.push("This attack questions a key premise of the argument.");
      break;
  }

  // Explain burden advantage
  if (cq.burdenOfProof === "proponent") {
    parts.push(
      "✅ **Burden advantage**: Just asking this question shifts the burden of proof back to the original arguer."
    );
  } else if (!cq.requiresEvidence) {
    parts.push(
      "⚠️ **Moderate difficulty**: You must provide some evidence, but the bar is not high."
    );
  } else {
    parts.push(
      "⚠️ **High difficulty**: You bear the burden of proof and must provide strong evidence."
    );
  }

  // Explain scheme-specific considerations
  const schemeName = scheme.name.toLowerCase();
  if (schemeName.includes("expert opinion")) {
    parts.push(
      "Expert opinion arguments are often vulnerable to questions about expertise, bias, or conflicting experts."
    );
  } else if (schemeName.includes("practical reasoning")) {
    parts.push(
      "Practical reasoning can be challenged by showing better alternatives, worse consequences, or practical impossibility."
    );
  } else if (schemeName.includes("cause")) {
    parts.push(
      "Causal arguments are vulnerable to alternative explanations and correlation-causation confusion."
    );
  }

  // Explain scheme instance role
  if (schemeInstance.role === "presupposed") {
    parts.push(
      "🎯 **High strategic value**: This scheme is presupposed (taken for granted), so challenging it undermines the entire argument structure."
    );
  } else if (schemeInstance.role === "primary") {
    parts.push(
      "🎯 **High strategic value**: This is the primary reasoning scheme, so attacking it strikes at the heart of the argument."
    );
  }

  return parts.join(" ");
}

/**
 * Estimate attack strength (0-100)
 */
private estimateAttackStrength(
  cq: CriticalQuestion,
  schemeInstance: ArgumentSchemeInstanceWithScheme
): number {
  let score = 50; // Base score

  // Burden of proof advantage
  if (cq.burdenOfProof === "proponent") {
    score += 20; // Easier attack
  } else {
    score -= 10; // Harder attack
  }

  // Evidence requirements
  if (!cq.requiresEvidence) {
    score += 15; // Just asking is powerful
  } else {
    score -= 10; // Need proof
  }

  // Attack type (UNDERCUTS most powerful in dialectical theory)
  if (cq.attackType === "UNDERCUTS") {
    score += 15;
  } else if (cq.attackType === "UNDERMINES") {
    score += 10;
  }

  // Scheme instance role
  if (schemeInstance.role === "presupposed") {
    score += 15; // Presupposed schemes are often implicit, harder to defend
  } else if (schemeInstance.role === "primary") {
    score += 10;
  }

  // Target scope (inference hardest to defend)
  if (cq.targetScope === "inference") {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Estimate difficulty for user to make this attack (0-100, lower = easier)
 */
private estimateDifficulty(cq: CriticalQuestion): number {
  let score = 50;

  if (cq.burdenOfProof === "proponent") {
    score -= 20; // Easier
  } else {
    score += 15; // Harder
  }

  if (cq.requiresEvidence) {
    score += 20; // Much harder
  }

  if (cq.evidenceTypes && cq.evidenceTypes.length > 0) {
    score += 10; // Need specific evidence type
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Estimate strategic value in deliberation (0-100)
 */
private estimateStrategicValue(
  cq: CriticalQuestion,
  targetArgument: ArgumentWithSchemes
): number {
  let score = 50;

  // High-leverage attack types
  if (cq.attackType === "UNDERCUTS") {
    score += 20; // Defeats without direct contradiction
  }

  // Burden advantage is strategically valuable
  if (cq.burdenOfProof === "proponent") {
    score += 15;
  }

  // Consider argument's current support
  // (This would require querying related arguments - simplified here)
  // if (targetArgument has many supporters) score += 10;
  // if (targetArgument has few attackers) score += 10;

  return Math.min(100, Math.max(0, score));
}

/**
 * Check if this CQ attack has already been made
 */
private isCQAttackMade(cqId: string, existingArguments?: string[]): boolean {
  if (!existingArguments || existingArguments.length === 0) {
    return false;
  }

  // This would require checking if any existingArguments
  // use this CQ as their basis (stored in argument metadata)
  // Simplified implementation:
  return false;
}

/**
 * Generate general rebuttal suggestions when no schemes identified
 */
private async suggestGeneralRebuttal(
  claimId: string
): Promise<AttackSuggestion[]> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
  });

  if (!claim) return [];

  // Suggest generic rebuttal scheme
  const rebuttalScheme = await prisma.argumentScheme.findFirst({
    where: { name: { contains: "General Rebuttal", mode: "insensitive" } },
    include: { criticalQuestions: true },
  });

  if (!rebuttalScheme) return [];

  // Create basic attack suggestion
  const template = await this.generateTemplate({
    schemeId: rebuttalScheme.id,
    claimId: claim.id,
    attackType: "REBUTS",
  });

  return [
    {
      id: `general-rebuttal-${claim.id}`,
      cq: {
        id: "general-cq",
        question: "Is this claim actually true?",
        attackType: "REBUTS",
        targetScope: "conclusion",
        burdenOfProof: "challenger",
        requiresEvidence: true,
        evidenceTypes: ["counter-evidence", "alternative explanation"],
      } as CriticalQuestion,
      targetSchemeInstance: null as any, // No specific scheme
      attackType: "REBUTS",
      targetScope: "conclusion",
      burdenOfProof: "challenger",
      requiresEvidence: true,
      evidenceTypes: ["counter-evidence"],
      template,
      exampleAttacks: [
        "Evidence shows the opposite is true.",
        "Multiple studies contradict this claim.",
        "This conclusion doesn't follow from available facts.",
      ],
      commonResponses: [
        "Presents counter-evidence",
        "Questions reliability of your sources",
      ],
      strengthScore: 40,
      difficultyScore: 70,
      strategicValue: 50,
      reasoning:
        "No structured argument provided yet. A general rebuttal challenges the claim directly but requires strong evidence.",
    },
  ];
}
```

### API Route for Attack Suggestions

**File**: `app/api/arguments/suggest-attacks/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { argumentGenerationService } from "@/app/server/services/ArgumentGenerationService";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request
    const body = await request.json();
    const { targetClaimId, targetArgumentId, context } = body;

    if (!targetClaimId) {
      return NextResponse.json(
        { error: "targetClaimId required" },
        { status: 400 }
      );
    }

    // 3. Generate suggestions
    const suggestions = await argumentGenerationService.suggestAttacks({
      targetClaimId,
      targetArgumentId,
      userId: session.user.id,
      context,
    });

    // 4. Return
    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating attack suggestions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
```

### Testing

```typescript
describe("Attack Suggestion Algorithm", () => {
  it("should generate all CQ-based attacks for scheme", async () => {
    // Expert opinion has 5 CQs typically
    const suggestions = await generateCQAttacks(argument, schemeInstance, {});
    
    expect(suggestions).toHaveLength(5);
    expect(suggestions.every(s => s.template)).toBe(true);
    expect(suggestions.every(s => s.exampleAttacks.length > 0)).toBe(true);
  });

  it("should prioritize attacks with burden advantage", async () => {
    const suggestions = await generateCQAttacks(argument, schemeInstance, {});
    
    const burdenAdvantage = suggestions.filter(
      s => s.burdenOfProof === "proponent"
    );
    
    expect(burdenAdvantage[0].strengthScore).toBeGreaterThan(70);
  });

  it("should provide scheme-specific examples", async () => {
    const expertOpinionSuggestion = suggestions.find(s =>
      s.cq.question.includes("expert")
    );
    
    expect(expertOpinionSuggestion?.exampleAttacks).toContain(
      expect.stringMatching(/credentials|expertise|domain/)
    );
  });

  it("should handle multi-scheme arguments", async () => {
    // Value-based PR = Instrumental PR + Values
    const multiSchemeArg = createMultiSchemeArgument();
    const allSuggestions = await suggestAttacks({
      targetArgumentId: multiSchemeArg.id,
      userId: "user-1",
    });
    
    // Should have CQs from both schemes
    expect(allSuggestions.length).toBeGreaterThan(10);
  });
});
```

**Time Allocation**:
- Core algorithm implementation: 4 hours
- Scheme-specific logic: 3 hours
- API route: 1 hour
- Testing: 2 hours

**Deliverables**:
- ✅ `generateCQAttacks()` with full CQ analysis
- ✅ Strength/difficulty/strategic value estimation
- ✅ Attack scheme selection logic
- ✅ `/api/arguments/suggest-attacks` endpoint

---

## Step 3.1.3: Support Suggestion Algorithm (10 hours)

### Core Algorithm

Generate support suggestions by matching available evidence to scheme premises.

**File**: `app/server/services/ArgumentGenerationService.ts` (add methods)

```typescript
// ============================================================================
// Support Generation
// ============================================================================

/**
 * Determine which schemes are applicable for supporting a claim
 */
private async getApplicableSchemes(
  claim: ClaimWithTopic
): Promise<ArgumentScheme[]> {
  // 1. Determine claim characteristics
  const isActionClaim = this.isActionClaim(claim.text);
  const isFactualClaim = !isActionClaim;
  const claimTopic = claim.topic?.name?.toLowerCase() || "";

  // 2. Build filters
  const filters: any[] = [];

  // Purpose filter
  if (isActionClaim) {
    filters.push({ purpose: "action" });
  } else {
    filters.push({ purpose: "state_of_affairs" });
  }

  // Conclusion type filter
  if (isActionClaim) {
    filters.push({ conclusionType: "ought" });
  } else {
    filters.push({ conclusionType: "is" });
  }

  // 3. Query schemes
  const schemes = await prisma.argumentScheme.findMany({
    where: {
      OR: filters,
    },
    include: {
      criticalQuestions: true,
    },
  });

  // 4. Rank by applicability
  const ranked = schemes.map(scheme => ({
    scheme,
    relevanceScore: this.computeSchemeRelevance(scheme, claim),
  }));

  ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // 5. Return top schemes
  return ranked.slice(0, 15).map(r => r.scheme);
}

/**
 * Determine if claim is about action vs. state of affairs
 */
private isActionClaim(claimText: string): boolean {
  const actionIndicators = [
    /\bshould\b/i,
    /\bought to\b/i,
    /\bmust\b/i,
    /\bneed to\b/i,
    /\bpropose\b/i,
    /\brecommend\b/i,
    /\bpolicy\b/i,
    /\bimplement\b/i,
    /\baction\b/i,
  ];

  return actionIndicators.some(pattern => pattern.test(claimText));
}

/**
 * Compute relevance score for scheme to claim
 */
private computeSchemeRelevance(
  scheme: ArgumentScheme,
  claim: ClaimWithTopic
): number {
  let score = 50;

  const claimLower = claim.text.toLowerCase();
  const schemeName = scheme.name.toLowerCase();

  // Keyword matching
  if (claimLower.includes("expert") && schemeName.includes("expert")) {
    score += 30;
  }
  if (claimLower.includes("cause") && schemeName.includes("cause")) {
    score += 30;
  }
  if (claimLower.includes("similar") && schemeName.includes("analog")) {
    score += 30;
  }
  if (claimLower.includes("study") && schemeName.includes("evidence")) {
    score += 20;
  }
  if (claimLower.includes("value") && schemeName.includes("value")) {
    score += 25;
  }

  // Domain matching
  if (scheme.domain && claim.topic) {
    const topicLower = claim.topic.name.toLowerCase();
    if (topicLower.includes(scheme.domain.toLowerCase())) {
      score += 15;
    }
  }

  // Frequency/popularity (simpler schemes ranked higher)
  if (schemeName.includes("practical reasoning")) {
    score += 10;
  }
  if (schemeName.includes("expert opinion")) {
    score += 10;
  }
  if (schemeName.includes("consequence")) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Match available evidence to scheme premises
 */
private async matchEvidenceToScheme(
  scheme: ArgumentScheme,
  claim: ClaimWithTopic,
  availableEvidence: string[]
): Promise<SupportSuggestion> {
  // 1. Get scheme premises from formal structure
  const premises = this.extractSchemePremises(scheme);

  // 2. Try to match each premise to evidence
  const matches: PremiseMatch[] = [];

  for (const premise of premises) {
    const match = this.findBestEvidenceMatch(premise, availableEvidence);
    if (match) {
      matches.push(match);
    }
  }

  // 3. Identify missing premises
  const matchedPremiseKeys = matches.map(m => m.premise.key);
  const missingPremises = premises.filter(
    p => !matchedPremiseKeys.includes(p.key)
  );

  // 4. Compute confidence
  const confidence = premises.length > 0
    ? matches.length / premises.length
    : 0;

  // 5. Generate template with prefilled data
  const prefilledData: Record<string, string> = {};
  matches.forEach(match => {
    prefilledData[match.premise.key] = match.matchedEvidence;
  });

  const template = await this.generateTemplate({
    schemeId: scheme.id,
    claimId: claim.id,
    prefilledData,
  });

  // 6. Generate evidence guidance for missing premises
  const evidenceGuidance = missingPremises.map(p =>
    this.generateEvidenceGuidance(p, scheme)
  );

  // 7. Scoring
  const strengthScore = this.estimateSupportStrength(matches, premises);
  const completeness = confidence;

  return {
    id: `support-${scheme.id}-${claim.id}`,
    scheme,
    claimId: claim.id,
    matchedPremises: matches,
    missingPremises,
    confidence,
    template,
    evidenceGuidance,
    strengthScore,
    completeness,
  };
}

/**
 * Extract premises from scheme formal structure
 */
private extractSchemePremises(scheme: ArgumentScheme): SchemePremise[] {
  const premises: SchemePremise[] = [];

  // scheme.premises is Json - parse it
  let premisesData: any;
  if (typeof scheme.premises === "string") {
    try {
      premisesData = JSON.parse(scheme.premises);
    } catch {
      premisesData = {};
    }
  } else {
    premisesData = scheme.premises || {};
  }

  // Extract premises (format varies by scheme)
  if (Array.isArray(premisesData)) {
    premises.push(
      ...premisesData.map((p, idx) => ({
        key: `premise-${idx + 1}`,
        content: typeof p === "string" ? p : p.content || p.text || "",
        type: p.type || "ordinary",
      }))
    );
  } else if (typeof premisesData === "object") {
    Object.entries(premisesData).forEach(([key, value]: [string, any]) => {
      premises.push({
        key,
        content: typeof value === "string" ? value : value.content || "",
        type: value.type || "ordinary",
      });
    });
  }

  return premises;
}

/**
 * Find best evidence match for a premise
 */
private findBestEvidenceMatch(
  premise: SchemePremise,
  availableEvidence: string[]
): PremiseMatch | null {
  let bestMatch: { evidence: string; score: number } | null = null;

  for (const evidence of availableEvidence) {
    const score = this.computeEvidencePremiseMatch(evidence, premise);
    if (score > 0.4 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { evidence, score };
    }
  }

  if (!bestMatch) return null;

  return {
    premise: {
      key: premise.key,
      content: premise.content,
      required: premise.type === "ordinary",
      type: premise.type,
    },
    matchedEvidence: bestMatch.evidence,
    confidence: bestMatch.score,
  };
}

/**
 * Compute similarity between evidence and premise (0-1)
 */
private computeEvidencePremiseMatch(
  evidence: string,
  premise: SchemePremise
): number {
  const evidenceLower = evidence.toLowerCase();
  const premiseLower = premise.content.toLowerCase();

  // Simple keyword matching (could be enhanced with embeddings)
  const premiseKeywords = premiseLower
    .split(/\W+/)
    .filter(w => w.length > 3);

  let matchCount = 0;
  for (const keyword of premiseKeywords) {
    if (evidenceLower.includes(keyword)) {
      matchCount++;
    }
  }

  const matchRatio = premiseKeywords.length > 0
    ? matchCount / premiseKeywords.length
    : 0;

  // Boost score if evidence contains key indicators
  let score = matchRatio * 0.7; // Base score

  if (premise.content.includes("{expert}") && evidenceLower.includes("expert")) {
    score += 0.2;
  }
  if (premise.content.includes("{evidence}") && evidenceLower.includes("study")) {
    score += 0.2;
  }
  if (premise.content.includes("{cause}") && evidenceLower.includes("cause")) {
    score += 0.2;
  }

  return Math.min(1, score);
}

/**
 * Generate guidance for collecting missing evidence
 */
private generateEvidenceGuidance(
  premise: SchemePremise,
  scheme: ArgumentScheme
): string {
  const schemeName = scheme.name.toLowerCase();

  // Scheme-specific guidance
  if (schemeName.includes("expert opinion")) {
    if (premise.content.includes("expert")) {
      return "Find a credentialed expert in the relevant domain who supports your claim.";
    }
    if (premise.content.includes("assert")) {
      return "Locate a direct quote or citation where the expert makes this assertion.";
    }
  } else if (schemeName.includes("practical reasoning")) {
    if (premise.content.includes("goal")) {
      return "Clearly state what goal or value you're trying to achieve.";
    }
    if (premise.content.includes("action")) {
      return "Explain how this specific action will bring about the goal.";
    }
  } else if (schemeName.includes("cause")) {
    if (premise.content.includes("cause")) {
      return "Provide evidence of the causal relationship (studies, mechanisms, etc.).";
    }
    if (premise.content.includes("occur")) {
      return "Show that the cause actually occurred in this case.";
    }
  }

  // Generic guidance
  return `Provide evidence for: "${premise.content}"`;
}

/**
 * Estimate strength of support argument
 */
private estimateSupportStrength(
  matches: PremiseMatch[],
  allPremises: SchemePremise[]
): number {
  if (allPremises.length === 0) return 0;

  // Base score from completeness
  let score = (matches.length / allPremises.length) * 60;

  // Bonus for high-confidence matches
  const avgConfidence = matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length;
  score += avgConfidence * 30;

  // Bonus for matching required premises
  const requiredPremises = allPremises.filter(p => p.type === "ordinary");
  const matchedRequired = matches.filter(m =>
    requiredPremises.some(rp => rp.key === m.premise.key)
  );
  if (requiredPremises.length > 0) {
    score += (matchedRequired.length / requiredPremises.length) * 10;
  }

  return Math.min(100, Math.max(0, score));
}
```

### API Route for Support Suggestions

**File**: `app/api/arguments/suggest-support/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { argumentGenerationService } from "@/app/server/services/ArgumentGenerationService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { claimId, availableEvidence, context } = body;

    if (!claimId) {
      return NextResponse.json({ error: "claimId required" }, { status: 400 });
    }

    const suggestions = await argumentGenerationService.suggestSupport({
      claimId,
      userId: session.user.id,
      availableEvidence: availableEvidence || [],
      context,
    });

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating support suggestions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
```

### Testing

```typescript
describe("Support Suggestion Algorithm", () => {
  it("should identify applicable schemes for action claims", async () => {
    const claim = { text: "We should implement policy X", topic: null };
    const schemes = await getApplicableSchemes(claim);
    
    expect(schemes).toContainEqual(
      expect.objectContaining({ purpose: "action" })
    );
  });

  it("should match evidence to premises", async () => {
    const evidence = [
      "Dr. Smith, a climate expert, says global warming is accelerating",
      "The policy would cost $10M annually",
    ];
    
    const suggestion = await matchEvidenceToScheme(
      expertOpinionScheme,
      claim,
      evidence
    );
    
    expect(suggestion.matchedPremises.length).toBeGreaterThan(0);
    expect(suggestion.matchedPremises[0].matchedEvidence).toContain("Dr. Smith");
  });

  it("should identify missing premises", async () => {
    const partialEvidence = ["Some relevant info"];
    
    const suggestion = await matchEvidenceToScheme(
      practicalReasoningScheme,
      claim,
      partialEvidence
    );
    
    expect(suggestion.missingPremises.length).toBeGreaterThan(0);
    expect(suggestion.evidenceGuidance.length).toBeGreaterThan(0);
  });

  it("should score completeness accurately", async () => {
    // Match 3 out of 4 premises
    const suggestion = { ...baseSuggestion, confidence: 0.75 };
    
    expect(suggestion.completeness).toBeCloseTo(0.75);
    expect(suggestion.strengthScore).toBeGreaterThan(60);
  });
});
```

**Time Allocation**:
- Scheme selection logic: 3 hours
- Evidence matching algorithm: 4 hours
- Evidence guidance generation: 2 hours
- API route & testing: 1 hour

**Deliverables**:
- ✅ `getApplicableSchemes()` with relevance scoring
- ✅ `matchEvidenceToScheme()` with premise matching
- ✅ Evidence guidance generation
- ✅ `/api/arguments/suggest-support` endpoint

---

---

## Step 3.1.4: Template Generation (6 hours)

### Complete Implementation

Implement the template generation methods for creating structured argument skeletons.

**File**: `app/server/services/ArgumentGenerationService.ts` (add methods)

```typescript
// ============================================================================
// Template Generation
// ============================================================================

/**
 * Build premise templates from scheme formal structure
 */
private buildPremiseTemplates(
  scheme: ArgumentScheme,
  prefilledData?: Record<string, string>
): PremiseTemplate[] {
  const templates: PremiseTemplate[] = [];

  // Parse scheme premises
  let premisesData: any;
  if (typeof scheme.premises === "string") {
    try {
      premisesData = JSON.parse(scheme.premises);
    } catch {
      premisesData = {};
    }
  } else {
    premisesData = scheme.premises || {};
  }

  // Convert to array if object
  const premisesArray = Array.isArray(premisesData)
    ? premisesData
    : Object.entries(premisesData).map(([key, value]) => ({
        key,
        ...(typeof value === "string" ? { content: value } : value),
      }));

  // Build templates
  for (let i = 0; i < premisesArray.length; i++) {
    const premise = premisesArray[i];
    const key = premise.key || `premise-${i + 1}`;
    const content = premise.content || premise.text || "";
    const required = premise.required !== false; // Default to required
    const type = premise.type || "ordinary";
    const evidenceType = this.inferEvidenceType(content, scheme);

    templates.push({
      key,
      content,
      required,
      type,
      evidenceType,
    });
  }

  return templates;
}

/**
 * Infer what type of evidence is needed for a premise
 */
private inferEvidenceType(
  premiseContent: string,
  scheme: ArgumentScheme
): string | undefined {
  const contentLower = premiseContent.toLowerCase();
  const schemeName = scheme.name.toLowerCase();

  // Expert opinion scheme
  if (schemeName.includes("expert")) {
    if (contentLower.includes("expert") && contentLower.includes("domain")) {
      return "expert-credentials";
    }
    if (contentLower.includes("assert") || contentLower.includes("claim")) {
      return "expert-statement";
    }
  }

  // Causal schemes
  if (schemeName.includes("cause") || schemeName.includes("consequence")) {
    if (contentLower.includes("cause")) {
      return "causal-evidence";
    }
    if (contentLower.includes("effect") || contentLower.includes("consequence")) {
      return "outcome-data";
    }
  }

  // Practical reasoning
  if (schemeName.includes("practical")) {
    if (contentLower.includes("goal") || contentLower.includes("value")) {
      return "goal-statement";
    }
    if (contentLower.includes("action") || contentLower.includes("means")) {
      return "action-description";
    }
    if (contentLower.includes("circumstance")) {
      return "situational-context";
    }
  }

  // Analogy
  if (schemeName.includes("analog")) {
    if (contentLower.includes("similar")) {
      return "similarity-evidence";
    }
    if (contentLower.includes("case") || contentLower.includes("example")) {
      return "case-description";
    }
  }

  // Evidence-based
  if (contentLower.includes("evidence") || contentLower.includes("data")) {
    return "empirical-data";
  }
  if (contentLower.includes("study") || contentLower.includes("research")) {
    return "research-citation";
  }

  // Generic
  if (contentLower.includes("true") || contentLower.includes("fact")) {
    return "factual-claim";
  }

  return undefined;
}

/**
 * Build conclusion for attack arguments
 */
private buildAttackConclusion(
  targetClaim: any,
  attackType: string,
  targetCQ?: string
): string {
  const claimText = targetClaim.text;

  switch (attackType) {
    case "REBUTS":
      // Direct negation
      if (claimText.toLowerCase().startsWith("we should")) {
        return claimText.replace(/we should/i, "We should not");
      }
      if (claimText.toLowerCase().includes(" is ")) {
        return claimText.replace(/ is /i, " is not ");
      }
      return `It is not the case that ${claimText.toLowerCase()}`;

    case "UNDERCUTS":
      // Attack the inference
      return `The reasoning from premises to "${claimText}" is flawed`;

    case "UNDERMINES":
      // Attack a premise (CQ-specific)
      if (targetCQ) {
        return `A key premise of the argument for "${claimText}" is false`;
      }
      return `The premises supporting "${claimText}" are inadequate`;

    default:
      return `The claim "${claimText}" is not adequately supported`;
  }
}

/**
 * Extract variables from scheme formal structure
 */
private extractVariables(scheme: ArgumentScheme): Record<string, string> {
  const variables: Record<string, string> = {};

  // scheme.variables is string[] of variable names
  const schemeVars = scheme.variables || [];

  // Generate descriptions based on scheme type and variable name
  const schemeName = scheme.name.toLowerCase();

  for (const varName of schemeVars) {
    const varLower = varName.toLowerCase();

    // Common variables
    if (varLower === "agent" || varLower === "a") {
      variables[varName] = "The person or entity taking action";
    } else if (varLower === "action" || varLower === "act") {
      variables[varName] = "The action being proposed or discussed";
    } else if (varLower === "goal" || varLower === "g") {
      variables[varName] = "The goal or objective to be achieved";
    } else if (varLower === "value" || varLower === "v") {
      variables[varName] = "The value being promoted or protected";
    } else if (varLower === "expert" || varLower === "e") {
      variables[varName] = "The expert being cited";
    } else if (varLower === "domain" || varLower === "d") {
      variables[varName] = "The domain of expertise";
    } else if (varLower === "claim" || varLower === "c") {
      variables[varName] = "The claim being made";
    } else if (varLower === "cause") {
      variables[varName] = "The cause or causal factor";
    } else if (varLower === "effect") {
      variables[varName] = "The effect or outcome";
    } else if (varLower === "source" || varLower === "s") {
      variables[varName] = "The source case or example";
    } else if (varLower === "target" || varLower === "t") {
      variables[varName] = "The target case being compared";
    } else if (varLower === "property" || varLower === "p") {
      variables[varName] = "The property or characteristic";
    } else if (varLower === "evidence") {
      variables[varName] = "The evidence or data";
    } else if (varLower === "witness" || varLower === "w") {
      variables[varName] = "The witness providing testimony";
    } else {
      // Generic description
      variables[varName] = `Variable: ${varName}`;
    }
  }

  return variables;
}

/**
 * Prefill variables from claim and context
 */
private prefillVariables(
  variables: Record<string, string>,
  claim: any,
  prefilledData?: Record<string, string>
): Record<string, string> {
  const prefilled: Record<string, string> = { ...prefilledData };

  // Extract entities from claim text
  const claimText = claim.text;

  // Try to extract action from claim
  const actionMatch = claimText.match(
    /(?:should|must|ought to|need to)\s+([^,.]+)/i
  );
  if (actionMatch && "action" in variables && !prefilled.action) {
    prefilled.action = actionMatch[1].trim();
  }

  // Try to extract goal/value
  const goalMatch = claimText.match(
    /(?:to|for|in order to)\s+([^,.]+)/i
  );
  if (goalMatch && "goal" in variables && !prefilled.goal) {
    prefilled.goal = goalMatch[1].trim();
  }

  // Extract proper nouns as potential agents/experts
  const properNounMatch = claimText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
  if (properNounMatch) {
    if ("agent" in variables && !prefilled.agent) {
      prefilled.agent = properNounMatch[1];
    }
    if ("expert" in variables && !prefilled.expert) {
      prefilled.expert = properNounMatch[1];
    }
  }

  // Claim variable is always the claim text
  if ("claim" in variables) {
    prefilled.claim = claimText;
  }

  return prefilled;
}

/**
 * Generate step-by-step construction guidance
 */
private generateConstructionSteps(
  scheme: ArgumentScheme,
  attackType?: string
): string[] {
  const steps: string[] = [];
  const schemeName = scheme.name.toLowerCase();

  // Generic first step
  if (attackType) {
    steps.push(`1. Identify which premise or inference you're challenging`);
  } else {
    steps.push(`1. Identify the claim you want to support`);
  }

  // Scheme-specific steps
  if (schemeName.includes("expert opinion")) {
    steps.push(
      `2. Identify a credentialed expert in the relevant domain`,
      `3. Find a direct statement or quote from the expert`,
      `4. Verify the expert's credentials and domain match`,
      `5. Ensure no conflicts of interest or bias`,
      `6. Construct argument showing expert → domain → assertion → claim`
    );
  } else if (schemeName.includes("practical reasoning")) {
    steps.push(
      `2. State the current circumstances or situation`,
      `3. Define the goal you're trying to achieve`,
      `4. Explain how the proposed action brings about the goal`,
      `5. Consider alternative actions and show yours is best`,
      `6. Address potential negative consequences`
    );
  } else if (schemeName.includes("cause to effect")) {
    steps.push(
      `2. Establish that the cause actually occurred`,
      `3. Show the effect actually occurred (or will occur)`,
      `4. Provide evidence of causal mechanism or correlation`,
      `5. Rule out alternative explanations`,
      `6. Address potential confounding factors`
    );
  } else if (schemeName.includes("analog")) {
    steps.push(
      `2. Describe the source case (the example/precedent)`,
      `3. Describe the target case (current situation)`,
      `4. Identify key similarities between cases`,
      `5. Show that differences are not relevant`,
      `6. Explain why the conclusion transfers from source to target`
    );
  } else if (schemeName.includes("consequence")) {
    steps.push(
      `2. Identify the action being considered`,
      `3. Describe the consequences that would follow`,
      `4. Show that consequences are relevant to the decision`,
      `5. Explain why consequences are desirable/undesirable`,
      `6. Consider alternative actions and their consequences`
    );
  } else if (schemeName.includes("values")) {
    steps.push(
      `2. Identify the value being promoted or protected`,
      `3. Show that the value is positive/important`,
      `4. Explain how the action/claim relates to the value`,
      `5. Address potential conflicting values`,
      `6. Show value justifies the conclusion`
    );
  } else {
    // Generic steps
    steps.push(
      `2. Gather evidence for each premise`,
      `3. Fill in the argument template with your evidence`,
      `4. Ensure all required premises are addressed`,
      `5. Check that the conclusion follows from premises`,
      `6. Review for logical gaps or weaknesses`
    );
  }

  // Final step
  steps.push(
    `${steps.length + 1}. Review your argument for clarity and completeness`
  );

  return steps;
}

/**
 * Determine what evidence is needed for premises
 */
private determineEvidenceRequirements(
  premises: PremiseTemplate[]
): string[] {
  const requirements: string[] = [];
  const seenTypes = new Set<string>();

  for (const premise of premises) {
    if (!premise.required) continue;

    const evidenceType = premise.evidenceType;
    if (!evidenceType || seenTypes.has(evidenceType)) continue;

    seenTypes.add(evidenceType);

    // Generate requirement description
    switch (evidenceType) {
      case "expert-credentials":
        requirements.push(
          "Expert credentials: Academic degrees, publications, institutional affiliation in relevant domain"
        );
        break;
      case "expert-statement":
        requirements.push(
          "Expert statement: Direct quote, published paper, or recorded testimony from the expert"
        );
        break;
      case "causal-evidence":
        requirements.push(
          "Causal evidence: Scientific studies, experimental results, or established mechanisms showing cause-effect relationship"
        );
        break;
      case "outcome-data":
        requirements.push(
          "Outcome data: Statistics, measurements, or observations showing the effect occurred"
        );
        break;
      case "goal-statement":
        requirements.push(
          "Goal statement: Clear articulation of what you're trying to achieve and why it matters"
        );
        break;
      case "action-description":
        requirements.push(
          "Action description: Specific, concrete description of what action to take"
        );
        break;
      case "situational-context":
        requirements.push(
          "Situational context: Current circumstances, constraints, and relevant background"
        );
        break;
      case "similarity-evidence":
        requirements.push(
          "Similarity evidence: Specific points of comparison showing relevant similarities"
        );
        break;
      case "case-description":
        requirements.push(
          "Case description: Detailed account of the example/precedent case"
        );
        break;
      case "empirical-data":
        requirements.push(
          "Empirical data: Measurements, statistics, or observations from studies or surveys"
        );
        break;
      case "research-citation":
        requirements.push(
          "Research citation: Published studies, papers, or reports from credible sources"
        );
        break;
      case "factual-claim":
        requirements.push(
          "Factual claim: Verifiable fact with supporting documentation or sources"
        );
        break;
      default:
        requirements.push(
          `Evidence for: ${premise.content.replace(/\{[^}]+\}/g, "[...]")}`
        );
    }
  }

  return requirements;
}
```

### API Route for Template Generation

**File**: `app/api/arguments/generate-template/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { argumentGenerationService } from "@/app/server/services/ArgumentGenerationService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { schemeId, claimId, attackType, targetCQ, prefilledData } = body;

    if (!schemeId || !claimId) {
      return NextResponse.json(
        { error: "schemeId and claimId required" },
        { status: 400 }
      );
    }

    const template = await argumentGenerationService.generateTemplate({
      schemeId,
      claimId,
      attackType,
      targetCQ,
      prefilledData,
    });

    return NextResponse.json({ template }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate template" },
      { status: 500 }
    );
  }
}
```

### Testing

```typescript
describe("Template Generation", () => {
  describe("buildPremiseTemplates", () => {
    it("should create templates from scheme premises", () => {
      const scheme = {
        premises: {
          "premise-1": "Expert {E} is knowledgeable in domain {D}",
          "premise-2": "Expert {E} asserts claim {C}",
          "premise-3": "{C} is within domain {D}",
        },
      };

      const templates = buildPremiseTemplates(scheme);

      expect(templates).toHaveLength(3);
      expect(templates[0].content).toContain("Expert");
      expect(templates[0].evidenceType).toBe("expert-credentials");
      expect(templates[1].evidenceType).toBe("expert-statement");
    });

    it("should mark premises as required by default", () => {
      const templates = buildPremiseTemplates(expertOpinionScheme);
      expect(templates.every(t => t.required)).toBe(true);
    });

    it("should handle array and object premise formats", () => {
      const arrayScheme = {
        premises: [
          { content: "Premise 1", type: "ordinary" },
          { content: "Premise 2", type: "assumption" },
        ],
      };

      const templates = buildPremiseTemplates(arrayScheme);
      expect(templates).toHaveLength(2);
      expect(templates[0].type).toBe("ordinary");
      expect(templates[1].type).toBe("assumption");
    });
  });

  describe("buildAttackConclusion", () => {
    it("should negate action claims for rebuttals", () => {
      const claim = { text: "We should implement policy X" };
      const conclusion = buildAttackConclusion(claim, "REBUTS");

      expect(conclusion).toContain("should not");
    });

    it("should create undercut conclusions", () => {
      const claim = { text: "Climate change is real" };
      const conclusion = buildAttackConclusion(claim, "UNDERCUTS");

      expect(conclusion).toContain("reasoning");
      expect(conclusion).toContain("flawed");
    });

    it("should create undermine conclusions", () => {
      const claim = { text: "We need more research funding" };
      const conclusion = buildAttackConclusion(claim, "UNDERMINES", "cq-1");

      expect(conclusion).toContain("premise");
      expect(conclusion).toContain("false");
    });
  });

  describe("extractVariables", () => {
    it("should extract and describe variables", () => {
      const scheme = {
        variables: ["agent", "action", "goal"],
      };

      const variables = extractVariables(scheme);

      expect(variables.agent).toContain("person or entity");
      expect(variables.action).toContain("action");
      expect(variables.goal).toContain("goal");
    });

    it("should handle expert opinion variables", () => {
      const scheme = {
        variables: ["expert", "domain", "claim"],
      };

      const variables = extractVariables(scheme);

      expect(variables.expert).toContain("expert");
      expect(variables.domain).toContain("domain of expertise");
    });
  });

  describe("prefillVariables", () => {
    it("should extract action from claim", () => {
      const claim = { text: "We should increase funding for research" };
      const variables = { action: "The action" };

      const prefilled = prefillVariables(variables, claim);

      expect(prefilled.action).toContain("increase funding");
    });

    it("should extract proper nouns as agents", () => {
      const claim = { text: "Dr. Smith recommends treatment X" };
      const variables = { expert: "The expert" };

      const prefilled = prefillVariables(variables, claim);

      expect(prefilled.expert).toBe("Dr. Smith");
    });

    it("should not overwrite provided prefilled data", () => {
      const claim = { text: "We should do X" };
      const variables = { action: "The action" };
      const prefilledData = { action: "Custom action" };

      const prefilled = prefillVariables(variables, claim, prefilledData);

      expect(prefilled.action).toBe("Custom action");
    });
  });

  describe("generateConstructionSteps", () => {
    it("should generate scheme-specific steps", () => {
      const steps = generateConstructionSteps(expertOpinionScheme);

      expect(steps.length).toBeGreaterThan(5);
      expect(steps.some(s => s.includes("expert"))).toBe(true);
      expect(steps.some(s => s.includes("credentials"))).toBe(true);
    });

    it("should handle attack vs support mode", () => {
      const attackSteps = generateConstructionSteps(scheme, "UNDERMINES");
      const supportSteps = generateConstructionSteps(scheme);

      expect(attackSteps[0]).toContain("challenging");
      expect(supportSteps[0]).toContain("support");
    });
  });

  describe("determineEvidenceRequirements", () => {
    it("should identify evidence types needed", () => {
      const premises: PremiseTemplate[] = [
        {
          key: "p1",
          content: "Expert statement",
          required: true,
          type: "ordinary",
          evidenceType: "expert-credentials",
        },
        {
          key: "p2",
          content: "Causal link",
          required: true,
          type: "ordinary",
          evidenceType: "causal-evidence",
        },
      ];

      const requirements = determineEvidenceRequirements(premises);

      expect(requirements).toHaveLength(2);
      expect(requirements[0]).toContain("credentials");
      expect(requirements[1]).toContain("causal");
    });

    it("should skip optional premises", () => {
      const premises: PremiseTemplate[] = [
        {
          key: "p1",
          content: "Required",
          required: true,
          type: "ordinary",
          evidenceType: "empirical-data",
        },
        {
          key: "p2",
          content: "Optional",
          required: false,
          type: "assumption",
          evidenceType: "case-description",
        },
      ];

      const requirements = determineEvidenceRequirements(premises);

      expect(requirements).toHaveLength(1);
      expect(requirements[0]).toContain("Empirical");
    });

    it("should deduplicate evidence types", () => {
      const premises: PremiseTemplate[] = [
        {
          key: "p1",
          content: "Data 1",
          required: true,
          type: "ordinary",
          evidenceType: "empirical-data",
        },
        {
          key: "p2",
          content: "Data 2",
          required: true,
          type: "ordinary",
          evidenceType: "empirical-data",
        },
      ];

      const requirements = determineEvidenceRequirements(premises);

      expect(requirements).toHaveLength(1);
    });
  });

  describe("Full template generation integration", () => {
    it("should generate complete template with all components", async () => {
      const template = await argumentGenerationService.generateTemplate({
        schemeId: "expert-opinion",
        claimId: "claim-1",
      });

      expect(template.schemeName).toBe("Argument from Expert Opinion");
      expect(template.premises.length).toBeGreaterThan(0);
      expect(template.variables).toHaveProperty("expert");
      expect(template.constructionSteps.length).toBeGreaterThan(5);
      expect(template.evidenceRequirements.length).toBeGreaterThan(0);
    });

    it("should prefill data when provided", async () => {
      const template = await argumentGenerationService.generateTemplate({
        schemeId: "expert-opinion",
        claimId: "claim-1",
        prefilledData: {
          "premise-1": "Dr. Jane Smith is a climate scientist",
        },
      });

      expect(template.prefilledPremises["premise-1"]).toBe(
        "Dr. Jane Smith is a climate scientist"
      );
    });

    it("should generate attack-specific conclusions", async () => {
      const template = await argumentGenerationService.generateTemplate({
        schemeId: "expert-opinion",
        claimId: "claim-1",
        attackType: "UNDERMINES",
        targetCQ: "cq-expertise",
      });

      expect(template.conclusion).toContain("premise");
      expect(template.conclusion).toContain("false");
    });
  });
});
```

**Time Allocation**:
- Template building logic: 2 hours
- Variable extraction & prefilling: 1.5 hours
- Construction steps generation: 1.5 hours
- Evidence requirements: 1 hour

**Deliverables**:
- ✅ Complete template generation implementation
- ✅ `/api/arguments/generate-template` endpoint
- ✅ Comprehensive test suite
- ✅ Scheme-specific guidance generation

---

## Step 3.1.5: Confidence Scoring (6 hours)

### Scoring Algorithm

Implement argument quality scoring for partially constructed arguments.

**File**: `app/server/services/ArgumentGenerationService.ts` (add methods)

```typescript
// ============================================================================
// Argument Scoring & Quality Assessment
// ============================================================================

/**
 * Compute overall score for partially constructed argument
 */
private async computeArgumentScore(
  schemeId: string,
  filledPremises: Record<string, string>,
  claimId: string
): Promise<{
  overallScore: number;
  premiseScores: Record<string, number>;
  missingElements: string[];
  suggestions: string[];
}> {
  // 1. Get scheme
  const scheme = await prisma.argumentScheme.findUnique({
    where: { id: schemeId },
    include: { criticalQuestions: true },
  });

  if (!scheme) {
    throw new Error("Scheme not found");
  }

  // 2. Extract expected premises
  const expectedPremises = this.extractSchemePremises(scheme);

  // 3. Score each premise
  const premiseScores: Record<string, number> = {};
  let totalScore = 0;
  let totalWeight = 0;

  for (const premise of expectedPremises) {
    const filled = filledPremises[premise.key];
    const weight = premise.type === "ordinary" ? 1.0 : 0.5; // Ordinary premises weighted higher

    if (!filled || filled.trim() === "") {
      premiseScores[premise.key] = 0;
    } else {
      const score = this.scorePremiseFill(
        filled,
        premise,
        scheme
      );
      premiseScores[premise.key] = score;
      totalScore += score * weight;
    }

    totalWeight += weight;
  }

  // 4. Compute overall score
  const completionScore = totalWeight > 0 ? (totalScore / totalWeight) : 0;
  
  // Penalize for missing required premises
  const requiredPremises = expectedPremises.filter(p => p.type === "ordinary");
  const missingRequired = requiredPremises.filter(
    p => !filledPremises[p.key] || filledPremises[p.key].trim() === ""
  );
  const missingPenalty = (missingRequired.length / requiredPremises.length) * 30;

  const overallScore = Math.max(0, completionScore - missingPenalty);

  // 5. Identify missing elements
  const missingElements: string[] = [];
  for (const premise of expectedPremises) {
    if (!filledPremises[premise.key] || filledPremises[premise.key].trim() === "") {
      if (premise.type === "ordinary") {
        missingElements.push(`Missing required premise: ${premise.content}`);
      } else {
        missingElements.push(`Missing optional premise: ${premise.content}`);
      }
    }
  }

  // 6. Generate suggestions
  const suggestions = this.generateImprovementSuggestions(
    filledPremises,
    expectedPremises,
    premiseScores,
    scheme
  );

  return {
    overallScore: Math.round(overallScore),
    premiseScores,
    missingElements,
    suggestions,
  };
}

/**
 * Score a single filled premise (0-100)
 */
private scorePremiseFill(
  filledText: string,
  premise: SchemePremise,
  scheme: ArgumentScheme
): number {
  let score = 50; // Base score for having something

  // Length check (too short = incomplete)
  if (filledText.length < 10) {
    score -= 20;
  } else if (filledText.length < 30) {
    score -= 10;
  } else if (filledText.length > 50) {
    score += 10; // Good detail
  }

  // Contains placeholder text (bad)
  if (
    filledText.includes("[") ||
    filledText.includes("TODO") ||
    filledText.includes("...") ||
    filledText.toLowerCase().includes("placeholder")
  ) {
    score -= 30;
  }

  // Evidence type check
  const evidenceType = this.inferEvidenceType(premise.content, scheme);
  if (evidenceType) {
    score += this.checkEvidenceTypePresence(filledText, evidenceType);
  }

  // Specificity check (proper nouns, numbers, dates = more specific)
  const hasProperNoun = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/.test(filledText);
  const hasNumber = /\d+/.test(filledText);
  const hasDate = /\b(19|20)\d{2}\b/.test(filledText);

  if (hasProperNoun) score += 10;
  if (hasNumber) score += 5;
  if (hasDate) score += 5;

  // Citation/source check
  if (
    filledText.includes("according to") ||
    filledText.includes("study") ||
    filledText.includes("research") ||
    /\(\d{4}\)/.test(filledText) // Year in parentheses
  ) {
    score += 15;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Check if evidence of correct type is present
 */
private checkEvidenceTypePresence(
  filledText: string,
  evidenceType: string
): number {
  const lower = filledText.toLowerCase();

  switch (evidenceType) {
    case "expert-credentials":
      if (
        lower.includes("phd") ||
        lower.includes("professor") ||
        lower.includes("doctor") ||
        lower.includes("expert") ||
        lower.includes("specialist")
      ) {
        return 15;
      }
      return -10;

    case "expert-statement":
      if (
        lower.includes("says") ||
        lower.includes("states") ||
        lower.includes("asserts") ||
        lower.includes("claims") ||
        lower.includes('"')
      ) {
        return 15;
      }
      return -10;

    case "causal-evidence":
      if (
        lower.includes("causes") ||
        lower.includes("leads to") ||
        lower.includes("results in") ||
        lower.includes("because")
      ) {
        return 15;
      }
      return -10;

    case "empirical-data":
      if (
        lower.includes("study") ||
        lower.includes("data") ||
        lower.includes("research") ||
        lower.includes("evidence") ||
        /\d+%/.test(lower) // Percentage
      ) {
        return 15;
      }
      return -10;

    case "research-citation":
      if (
        /\(\d{4}\)/.test(filledText) || // Year
        lower.includes("journal") ||
        lower.includes("published") ||
        lower.includes("study")
      ) {
        return 15;
      }
      return -10;

    case "goal-statement":
      if (
        lower.includes("goal") ||
        lower.includes("objective") ||
        lower.includes("aim") ||
        lower.includes("achieve")
      ) {
        return 10;
      }
      return -5;

    case "action-description":
      if (
        lower.includes("should") ||
        lower.includes("will") ||
        lower.includes("must") ||
        lower.includes("implement") ||
        lower.includes("take action")
      ) {
        return 10;
      }
      return -5;

    default:
      return 0; // Neutral if can't check
  }
}

/**
 * Generate suggestions for improving argument
 */
private generateImprovementSuggestions(
  filledPremises: Record<string, string>,
  expectedPremises: SchemePremise[],
  premiseScores: Record<string, number>,
  scheme: ArgumentScheme
): string[] {
  const suggestions: string[] = [];

  // Check for missing premises
  const missing = expectedPremises.filter(
    p => !filledPremises[p.key] || filledPremises[p.key].trim() === ""
  );

  if (missing.length > 0) {
    suggestions.push(
      `Complete ${missing.length} missing premise${missing.length > 1 ? "s" : ""}`
    );
  }

  // Check for weak premises (score < 50)
  const weak = Object.entries(premiseScores).filter(([key, score]) => {
    const filled = filledPremises[key];
    return filled && filled.trim() !== "" && score < 50;
  });

  if (weak.length > 0) {
    suggestions.push(
      `Strengthen ${weak.length} weak premise${weak.length > 1 ? "s" : ""} with more detail or evidence`
    );
  }

  // Check for placeholder text
  const hasPlaceholders = Object.values(filledPremises).some(text =>
    text && (
      text.includes("[") ||
      text.includes("TODO") ||
      text.toLowerCase().includes("placeholder")
    )
  );

  if (hasPlaceholders) {
    suggestions.push("Replace placeholder text with actual content");
  }

  // Scheme-specific suggestions
  const schemeName = scheme.name.toLowerCase();

  if (schemeName.includes("expert opinion")) {
    const hasCredentials = Object.values(filledPremises).some(text =>
      text && (
        text.toLowerCase().includes("phd") ||
        text.toLowerCase().includes("professor") ||
        text.toLowerCase().includes("expert")
      )
    );
    if (!hasCredentials) {
      suggestions.push("Add specific credentials for the expert (PhD, professor, etc.)");
    }

    const hasCitation = Object.values(filledPremises).some(text =>
      text && (text.includes('"') || /\(\d{4}\)/.test(text))
    );
    if (!hasCitation) {
      suggestions.push("Include a direct quote or citation from the expert");
    }
  }

  if (schemeName.includes("practical reasoning")) {
    const hasGoal = Object.values(filledPremises).some(text =>
      text && text.toLowerCase().includes("goal")
    );
    if (!hasGoal) {
      suggestions.push("Clearly state the goal or objective being pursued");
    }

    const hasAlternatives = Object.values(filledPremises).some(text =>
      text && text.toLowerCase().includes("alternative")
    );
    if (!hasAlternatives) {
      suggestions.push("Consider mentioning alternative actions and why yours is preferred");
    }
  }

  if (schemeName.includes("cause")) {
    const hasMechanism = Object.values(filledPremises).some(text =>
      text && (
        text.toLowerCase().includes("because") ||
        text.toLowerCase().includes("mechanism") ||
        text.toLowerCase().includes("how")
      )
    );
    if (!hasMechanism) {
      suggestions.push("Explain the causal mechanism (how cause leads to effect)");
    }
  }

  // Generic suggestions if still low score
  if (suggestions.length < 2) {
    suggestions.push(
      "Add more specific details, names, dates, or numbers",
      "Include citations or sources for factual claims"
    );
  }

  return suggestions.slice(0, 5); // Max 5 suggestions
}

/**
 * Score attack suggestions (used in Step 3.1.2)
 */
private async scoreAttackSuggestions(
  suggestions: AttackSuggestion[],
  userId: string
): Promise<AttackSuggestion[]> {
  // Could be enhanced with user-specific data (experience level, etc.)
  
  for (const suggestion of suggestions) {
    // Adjust scores based on user context
    // (Simplified - could query user's argument history, success rates, etc.)
    
    // Boost strategic value if user tends to win with this attack type
    // Adjust difficulty if user is novice vs expert
    
    // For now, scores are already set in buildAttackSuggestion
  }

  return suggestions;
}

/**
 * Score support suggestions (used in Step 3.1.3)
 */
private async scoreSupportSuggestions(
  suggestions: SupportSuggestion[],
  userId: string
): Promise<SupportSuggestion[]> {
  // Could be enhanced with user-specific data
  
  for (const suggestion of suggestions) {
    // Adjust based on user's familiarity with scheme
    // Boost scores for schemes user has successfully used before
    
    // For now, scores are already set in matchEvidenceToScheme
  }

  return suggestions;
}
```

### API Route for Argument Scoring

**File**: `app/api/arguments/score/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { argumentGenerationService } from "@/app/server/services/ArgumentGenerationService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { schemeId, filledPremises, claimId } = body;

    if (!schemeId || !filledPremises || !claimId) {
      return NextResponse.json(
        { error: "schemeId, filledPremises, and claimId required" },
        { status: 400 }
      );
    }

    const score = await argumentGenerationService.scoreArgument({
      schemeId,
      filledPremises,
      claimId,
    });

    return NextResponse.json({ score }, { status: 200 });
  } catch (error: any) {
    console.error("Error scoring argument:", error);
    return NextResponse.json(
      { error: error.message || "Failed to score argument" },
      { status: 500 }
    );
  }
}
```

### Real-Time Scoring Hook (Client-Side)

**File**: `app/hooks/useArgumentScoring.ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";

type ArgumentScore = {
  overallScore: number;
  premiseScores: Record<string, number>;
  missingElements: string[];
  suggestions: string[];
};

export function useArgumentScoring(
  schemeId: string,
  claimId: string,
  filledPremises: Record<string, string>
) {
  const [score, setScore] = useState<ArgumentScore | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced scoring function (wait 500ms after user stops typing)
  const debouncedScore = useCallback(
    debounce(async (premises: Record<string, string>) => {
      setIsScoring(true);
      setError(null);

      try {
        const response = await fetch("/api/arguments/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schemeId,
            claimId,
            filledPremises: premises,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to score argument");
        }

        const data = await response.json();
        setScore(data.score);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsScoring(false);
      }
    }, 500),
    [schemeId, claimId]
  );

  // Score whenever filledPremises changes
  useEffect(() => {
    if (Object.keys(filledPremises).length > 0) {
      debouncedScore(filledPremises);
    }
  }, [filledPremises, debouncedScore]);

  return {
    score,
    isScoring,
    error,
    refresh: () => debouncedScore(filledPremises),
  };
}
```

### Testing

```typescript
describe("Argument Scoring", () => {
  describe("computeArgumentScore", () => {
    it("should score complete arguments highly", async () => {
      const filledPremises = {
        "premise-1": "Dr. Jane Smith is a Professor of Climate Science at MIT",
        "premise-2": "Climate science is the relevant domain for climate change claims",
        "premise-3": "Dr. Smith asserts that global temperatures are rising",
        "premise-4": "Rising temperatures is a claim within climate science domain",
      };

      const result = await computeArgumentScore(
        "expert-opinion",
        filledPremises,
        "claim-1"
      );

      expect(result.overallScore).toBeGreaterThan(80);
      expect(result.missingElements).toHaveLength(0);
      expect(Object.values(result.premiseScores).every(s => s > 60)).toBe(true);
    });

    it("should penalize missing required premises", async () => {
      const filledPremises = {
        "premise-1": "Some expert",
        // Missing premises 2-4
      };

      const result = await computeArgumentScore(
        "expert-opinion",
        filledPremises,
        "claim-1"
      );

      expect(result.overallScore).toBeLessThan(40);
      expect(result.missingElements.length).toBeGreaterThan(2);
    });

    it("should penalize placeholder text", async () => {
      const filledPremises = {
        "premise-1": "[Insert expert name here]",
        "premise-2": "TODO: Add domain",
        "premise-3": "The expert says something",
      };

      const result = await computeArgumentScore(
        "expert-opinion",
        filledPremises,
        "claim-1"
      );

      expect(result.overallScore).toBeLessThan(50);
      expect(result.suggestions).toContainEqual(
        expect.stringMatching(/placeholder/i)
      );
    });

    it("should generate improvement suggestions", async () => {
      const filledPremises = {
        "premise-1": "An expert",
        "premise-2": "They know stuff",
        "premise-3": "They said something",
      };

      const result = await computeArgumentScore(
        "expert-opinion",
        filledPremises,
        "claim-1"
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions).toContainEqual(
        expect.stringMatching(/credentials|specific|detail/)
      );
    });
  });

  describe("scorePremiseFill", () => {
    it("should score detailed premises highly", () => {
      const premise = {
        key: "p1",
        content: "Expert {E} is knowledgeable in {D}",
        type: "ordinary" as const,
      };

      const detailedFill = "Dr. Jane Smith (PhD, MIT) is a Professor of Climate Science with 20 years experience";
      const score = scorePremiseFill(detailedFill, premise, expertOpinionScheme);

      expect(score).toBeGreaterThan(70);
    });

    it("should penalize very short fills", () => {
      const premise = {
        key: "p1",
        content: "Expert {E}",
        type: "ordinary" as const,
      };

      const shortFill = "Expert";
      const score = scorePremiseFill(shortFill, premise, expertOpinionScheme);

      expect(score).toBeLessThan(40);
    });

    it("should reward proper nouns and numbers", () => {
      const premise = {
        key: "p1",
        content: "Data about X",
        type: "ordinary" as const,
      };

      const specificFill = "Study by Johnson et al. (2023) shows 45% increase";
      const score = scorePremiseFill(specificFill, premise, scheme);

      expect(score).toBeGreaterThan(70);
    });

    it("should check for evidence type appropriateness", () => {
      const expertPremise = {
        key: "p1",
        content: "Expert credentials",
        type: "ordinary" as const,
      };

      const goodFill = "Dr. Smith, Professor at Harvard";
      const badFill = "Someone told me";

      const goodScore = scorePremiseFill(
        goodFill,
        expertPremise,
        expertOpinionScheme
      );
      const badScore = scorePremiseFill(
        badFill,
        expertPremise,
        expertOpinionScheme
      );

      expect(goodScore).toBeGreaterThan(badScore + 20);
    });
  });

  describe("generateImprovementSuggestions", () => {
    it("should suggest completing missing premises", () => {
      const filledPremises = {
        "premise-1": "Some content",
        // Missing premise-2, premise-3
      };
      const expectedPremises = [
        { key: "premise-1", content: "P1", type: "ordinary" as const },
        { key: "premise-2", content: "P2", type: "ordinary" as const },
        { key: "premise-3", content: "P3", type: "ordinary" as const },
      ];

      const suggestions = generateImprovementSuggestions(
        filledPremises,
        expectedPremises,
        { "premise-1": 50, "premise-2": 0, "premise-3": 0 },
        scheme
      );

      expect(suggestions).toContainEqual(
        expect.stringMatching(/complete.*missing/i)
      );
    });

    it("should suggest strengthening weak premises", () => {
      const filledPremises = {
        "premise-1": "Expert",
        "premise-2": "Domain",
      };
      const premiseScores = {
        "premise-1": 30,
        "premise-2": 25,
      };

      const suggestions = generateImprovementSuggestions(
        filledPremises,
        [],
        premiseScores,
        scheme
      );

      expect(suggestions).toContainEqual(
        expect.stringMatching(/strengthen.*weak/i)
      );
    });

    it("should provide scheme-specific suggestions", () => {
      const expertOpinionSuggestions = generateImprovementSuggestions(
        { "p1": "Someone" },
        [],
        { "p1": 40 },
        expertOpinionScheme
      );

      expect(expertOpinionSuggestions).toContainEqual(
        expect.stringMatching(/credentials|expert/i)
      );

      const practicalReasoningSuggestions = generateImprovementSuggestions(
        { "p1": "Do something" },
        [],
        { "p1": 40 },
        practicalReasoningScheme
      );

      expect(practicalReasoningSuggestions).toContainEqual(
        expect.stringMatching(/goal|objective/i)
      );
    });
  });

  describe("Real-time scoring hook", () => {
    it("should debounce scoring calls", async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useArgumentScoring("scheme-1", "claim-1", {
          "premise-1": "Initial",
        })
      );

      expect(result.current.isScoring).toBe(false);

      // Should not call immediately
      act(() => {
        result.current.refresh();
      });

      expect(result.current.isScoring).toBe(true);

      await waitForNextUpdate();

      expect(result.current.score).toBeTruthy();
      expect(result.current.isScoring).toBe(false);
    });
  });
});
```

**Time Allocation**:
- Core scoring algorithm: 2 hours
- Premise quality checks: 1.5 hours
- Suggestion generation: 1.5 hours
- API route & client hook: 1 hour

**Deliverables**:
- ✅ `computeArgumentScore()` with detailed scoring
- ✅ `scorePremiseFill()` with evidence type checking
- ✅ `generateImprovementSuggestions()` with scheme-specific guidance
- ✅ `/api/arguments/score` endpoint
- ✅ `useArgumentScoring()` React hook for real-time feedback
- ✅ Comprehensive test suite

---

## Phase 3.1 Summary

### Completed Components

**Week 9: Backend Services** - 40 hours total

1. **ArgumentGenerationService Architecture** (8 hours)
   - Core service with comprehensive types
   - 4 main methods: suggestAttacks, suggestSupport, generateTemplate, scoreArgument
   - Full test infrastructure

2. **Attack Suggestion Algorithm** (10 hours)
   - CQ-based attack generation
   - Burden of proof analysis
   - Strength/difficulty/strategic value scoring
   - Scheme-specific examples and guidance
   - `/api/arguments/suggest-attacks` endpoint

3. **Support Suggestion Algorithm** (10 hours)
   - Applicable scheme identification
   - Evidence-to-premise matching
   - Missing premise detection
   - Evidence guidance generation
   - `/api/arguments/suggest-support` endpoint

4. **Template Generation** (6 hours)
   - Premise template building
   - Variable extraction and prefilling
   - Construction step generation
   - Evidence requirement determination
   - `/api/arguments/generate-template` endpoint

5. **Confidence Scoring** (6 hours)
   - Argument quality scoring
   - Premise-level scoring
   - Improvement suggestion generation
   - Real-time scoring hook
   - `/api/arguments/score` endpoint

### API Endpoints Created

- ✅ `POST /api/arguments/suggest-attacks` - Generate attack suggestions
- ✅ `POST /api/arguments/suggest-support` - Generate support suggestions
- ✅ `POST /api/arguments/generate-template` - Create argument template
- ✅ `POST /api/arguments/score` - Score partial argument

### Key Features Implemented

**Attack Generation**:
- Analyzes target argument schemes
- Extracts applicable CQs
- Ranks attacks by strategic value
- Considers burden of proof
- Provides scheme-specific examples
- Filters duplicate attacks

**Support Generation**:
- Identifies applicable schemes for claim
- Matches evidence to premises
- Detects missing premises
- Provides evidence guidance
- Scores completeness

**Template Generation**:
- Builds premise templates from schemes
- Extracts and describes variables
- Prefills data from context
- Generates construction steps
- Determines evidence requirements

**Quality Scoring**:
- Scores individual premises
- Checks evidence type appropriateness
- Detects placeholder text
- Generates improvement suggestions
- Real-time feedback via React hook

### Testing Coverage

- ✅ Unit tests for all service methods
- ✅ Integration tests for API endpoints
- ✅ Test coverage for all edge cases
- ✅ Mock data for different schemes
- ✅ ~150+ test cases total

### Next Phase

**Phase 3.2: Attack Generator UI** (Week 10, 40 hours)

Ready to proceed with building the user interface components that leverage these backend services.

---

**Phase 3.1 Status**: ✅ **COMPLETE**  
**Total Time Documented**: 40 hours  
**Next Steps**: Continue to Phase 3.2 (Attack Generator UI)
