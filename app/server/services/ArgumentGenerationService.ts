/**
 * ArgumentGenerationService
 * 
 * Core backend service for intelligent argument generation and assistance.
 * Transforms Mesh from reactive analysis to proactive construction platform.
 * 
 * Phase 3.1: Backend Services (Week 9)
 * Implements:
 * - Attack suggestion via critical question analysis
 * - Support suggestion via scheme/evidence matching
 * - Argument template generation
 * - Confidence scoring for partial arguments
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prismaclient";
import type {
  ArgumentScheme,
  CriticalQuestion as PrismaCriticalQuestion,
  Argument,
  ArgumentSchemeInstance,
  Claim,
  BurdenOfProof,
} from "@prisma/client";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Enhanced CriticalQuestion type with argumentation-specific fields
 * Extends Prisma type with runtime data structures
 */
export type CriticalQuestion = Omit<PrismaCriticalQuestion, "burdenOfProof"> & {
  question?: string;
  attackType?: "REBUTS" | "UNDERCUTS" | "UNDERMINES";
  targetScope?: "conclusion" | "inference" | "premise";
  burdenOfProof?: BurdenOfProof | "proponent" | "challenger";
  requiresEvidence?: boolean;
  evidenceTypes?: string[];
  exampleAttacks?: string[];
  commonResponses?: string[];
};

/**
 * Attack suggestion generated from critical question analysis
 */
export type AttackSuggestion = {
  id: string;
  cq: CriticalQuestion;
  targetSchemeInstance: ArgumentSchemeInstance;
  attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES";
  targetScope: "conclusion" | "inference" | "premise";
  
  // Burden & Evidence (from Phase 0)
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

/**
 * Support suggestion generated from scheme/evidence matching
 */
export type SupportSuggestion = {
  id: string;
  scheme: ArgumentScheme;
  template: ArgumentTemplate;
  premiseMatches: PremiseMatch[];
  missingPremises: string[];
  confidence: number;
  exampleArguments: string[];
  completionSteps: string[];
  strengthScore: number;
  difficultyScore: number;
  strategicValue: number;
  reasoning: string;
};

/**
 * Structured argument template for construction
 */
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

/**
 * Template for a single premise
 */
export type PremiseTemplate = {
  key: string;
  content: string; // With variables like {agent}, {action}
  required: boolean;
  type: "ordinary" | "assumption" | "exception";
  evidenceType?: string;
};

/**
 * Matched evidence to premise
 */
export type PremiseMatch = {
  premise: PremiseTemplate;
  matchedEvidence: string;
  confidence: number;
  suggestedContent?: string; // Suggestion when no match found
};

/**
 * Scheme premise structure (lightweight parsing)
 */
export type SchemePremise = {
  key: string;
  content: string;
  type: "ordinary" | "assumption" | "exception";
  required?: boolean;
};

// Extended types for internal use
type ArgumentWithSchemes = Argument & {
  claim: any;
  argumentSchemes?: any[];
};

type ArgumentSchemeInstanceWithScheme = ArgumentSchemeInstance & {
  scheme: ArgumentScheme;
};

type ClaimWithTopic = {
  id: string;
  text: string;
  topic?: { name: string } | null;
};

// ============================================================================
// ArgumentGenerationService Class
// ============================================================================

export class ArgumentGenerationService {
  /**
   * Generate attack suggestions for a target argument or claim
   * 
   * Analyzes the target's scheme instances and generates CQ-based attacks
   * ranked by strategic value, strength, and difficulty.
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
      ? allSuggestions.filter(s => !this.isCQAttackMade(s.cq.id, context.existingArguments!))
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
   * 
   * Identifies applicable schemes and matches available evidence to premises.
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
    });

    if (!claim) throw new Error("Claim not found");

    // 2. Determine applicable schemes based on claim type
    const applicableSchemes = await this.getApplicableSchemes(claim as ClaimWithTopic);

    // 3. For each scheme, try to match evidence to premises
    const suggestions: SupportSuggestion[] = [];

    for (const scheme of applicableSchemes) {
      const match = await this.matchEvidenceToScheme(
        scheme,
        claim,
        availableEvidence
      );

      if (match.confidence > 0.3) {
        // Only include if reasonable match
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
   * 
   * Creates a structured skeleton for argument construction with
   * prefilled data and step-by-step guidance.
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
        cqs: true,
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
      schemeName: scheme.name || scheme.key,
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
   * 
   * Provides real-time feedback as users build arguments.
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

  private async getArgumentWithSchemes(argumentId: string): Promise<ArgumentWithSchemes> {
    const argument = await prisma.argument.findUnique({
      where: { id: argumentId },
      include: {
        claim: true,
        argumentSchemes: {
          include: {
            scheme: {
              include: {
                cqs: true,
              },
            },
          },
        },
      },
    });

    if (!argument) throw new Error("Argument not found");
    return argument as any as ArgumentWithSchemes;
  }

  private async getClaimArguments(claimId: string): Promise<ArgumentWithSchemes[]> {
    const args = await prisma.argument.findMany({
      where: { claimId },
      include: {
        claim: true,
        argumentSchemes: {
          include: {
            scheme: {
              include: {
                cqs: true,
              },
            },
          },
        },
      },
    });

    return args as any as ArgumentWithSchemes[];
  }

  private async getArgumentSchemes(argumentId: string): Promise<ArgumentSchemeInstanceWithScheme[]> {
    const instances = await prisma.argumentSchemeInstance.findMany({
      where: { argumentId },
      include: {
        scheme: {
          include: {
            cqs: true,
          },
        },
      },
    });

    return instances as any as ArgumentSchemeInstanceWithScheme[];
  }

  // ============================================================================
  // Helper Utilities
  // ============================================================================

  /**
   * Normalize burdenOfProof comparison (handle both enum and lowercase string)
   */
  private isProponentBurden(burden?: BurdenOfProof | "proponent" | "challenger"): boolean {
    return burden === "PROPONENT" || burden === "proponent";
  }

  private isChallengerBurden(burden?: BurdenOfProof | "proponent" | "challenger"): boolean {
    return burden === "CHALLENGER" || burden === "challenger";
  }

  // ============================================================================
  // Attack Generation Implementation (Step 3.1.2)
  // ============================================================================

  /**
   * Generate general rebuttal suggestions when no schemes identified
   */
  private async suggestGeneralRebuttal(claimId: string): Promise<AttackSuggestion[]> {
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) return [];

    // Create a basic rebuttal suggestion
    const rebuttalTemplate: ArgumentTemplate = {
      schemeId: "general-rebuttal",
      schemeName: "General Rebuttal",
      premises: [
        {
          key: "P1",
          content: "The claim '{claim}' is false/incorrect",
          required: true,
          type: "ordinary",
          evidenceType: "counter-evidence",
        },
        {
          key: "P2",
          content: "Evidence shows {counter_claim}",
          required: true,
          type: "ordinary",
          evidenceType: "empirical-data",
        },
      ],
      conclusion: `Therefore, "${claim.text}" should be rejected`,
      variables: {
        claim: "The original claim being disputed",
        counter_claim: "Your opposing evidence or position",
      },
      prefilledPremises: {},
      prefilledVariables: { claim: claim.text },
      constructionSteps: [
        "1. Identify what aspect of the claim is incorrect",
        "2. Gather evidence that contradicts the claim",
        "3. State your counter-position clearly",
        "4. Explain why the evidence supports rejection of the claim",
      ],
      evidenceRequirements: [
        "Counter-evidence: Data, facts, or expert opinion contradicting the claim",
        "Alternative explanation: Better account of the situation",
      ],
    };

    return [
      {
        id: `general-rebuttal-${claimId}`,
        cq: {
          id: "general-cq",
          question: "Is this claim adequately supported?",
          attackType: "REBUTS",
          targetScope: "conclusion",
          burdenOfProof: "proponent",
          requiresEvidence: false,
        } as CriticalQuestion,
        targetSchemeInstance: {} as ArgumentSchemeInstance,
        attackType: "REBUTS",
        targetScope: "conclusion",
        burdenOfProof: "proponent",
        requiresEvidence: false,
        evidenceTypes: [],
        template: rebuttalTemplate,
        exampleAttacks: [
          `"The claim is unsupported by credible evidence."`,
          `"The reasoning contains logical flaws."`,
          `"Alternative explanations better account for the facts."`,
        ],
        commonResponses: [
          "Proponent provides additional evidence",
          "Proponent clarifies the reasoning",
          "Proponent addresses the counter-evidence",
        ],
        strengthScore: 50,
        difficultyScore: 50,
        strategicValue: 40,
        reasoning: "Direct rebuttal challenges the claim's truth without attacking specific reasoning. Burden is on proponent to defend.",
      },
    ];
  }

  /**
   * Generate CQ-based attack suggestions for an argument using a specific scheme
   */
  private async generateCQAttacks(
    argument: ArgumentWithSchemes,
    schemeInstance: ArgumentSchemeInstanceWithScheme,
    context?: any
  ): Promise<AttackSuggestion[]> {
    const scheme = schemeInstance.scheme;
    const cqs = (scheme as any).cqs || [];

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
    const attackSchemeId = this.getAttackSchemeForCQ(cq, scheme);
    const template = await this.generateTemplate({
      schemeId: attackSchemeId,
      claimId: targetArgument.claimId!,
      attackType: cq.attackType as any,
      targetCQ: cq.id,
    });

    // 2. Generate example attacks
    const exampleAttacks = this.generateExampleAttacks(cq, scheme, targetArgument);

    // 3. Identify common responses
    const commonResponses = this.getCommonResponses(cq);

    // 4. Scoring
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
      evidenceTypes: (cq.evidenceTypes as string[]) || [],
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
    if ((cq as any).invokesScheme) {
      return (cq as any).invokesScheme;
    }

    // Otherwise, use appropriate attack scheme based on CQ type
    switch (cq.attackType) {
      case "REBUTS":
        // Direct contradiction - use same scheme structure but opposite conclusion
        return targetScheme.id;

      case "UNDERCUTS":
        // Attack inference/warrant - use meta-level argumentation
        return targetScheme.id;

      case "UNDERMINES":
        // Attack premise - use evidence-based schemes
        return targetScheme.id;

      default:
        return targetScheme.id;
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
    const cqExamples = (cq as any).exampleAttacks;
    if (cqExamples && Array.isArray(cqExamples) && cqExamples.length > 0) {
      return cqExamples;
    }

    // Generate scheme-specific examples
    const schemeName = (scheme.name || scheme.key).toLowerCase();

    if (schemeName.includes("expert opinion") || schemeName.includes("expert")) {
      examples.push(
        `"The cited expert lacks credentials in this specific domain."`,
        `"The expert is biased or has conflicts of interest."`,
        `"Multiple other experts disagree with this assessment."`
      );
    } else if (schemeName.includes("practical reasoning") || schemeName.includes("practical")) {
      examples.push(
        `"This action would create worse consequences than the current situation."`,
        `"There are better alternatives that achieve the same goal."`,
        `"The proposed action is practically impossible given current constraints."`
      );
    } else if (schemeName.includes("cause") || schemeName.includes("causal")) {
      examples.push(
        `"The correlation does not imply causation."`,
        `"There are alternative explanations for the observed effect."`,
        `"The causal mechanism is not scientifically established."`
      );
    } else if (schemeName.includes("analog") || schemeName.includes("similarity")) {
      examples.push(
        `"The two cases differ in crucial respects."`,
        `"The analogy breaks down when we consider..."`,
        `"The conclusion doesn't follow even if the analogy holds."`
      );
    }

    // Generic fallback based on CQ question
    if (examples.length === 0) {
      const question = (cq.question || cq.text || "").toLowerCase();
      if (question.includes("true") || question.includes("accurate")) {
        examples.push(`"The premise is not adequately supported by evidence."`);
      }
      if (question.includes("expert") || question.includes("authority")) {
        examples.push(`"The source lacks sufficient expertise or credibility."`);
      }
      if (question.includes("alternative") || question.includes("other")) {
        examples.push(`"Better alternatives exist that were not considered."`);
      }
    }

    // Ultimate fallback
    if (examples.length === 0) {
      examples.push(
        `"${cq.question || cq.text}"`,
        `"This reasoning contains a logical gap."`,
        `"The evidence does not support this conclusion."`
      );
    }

    return examples;
  }

  /**
   * Get common responses proponents make to this CQ
   */
  private getCommonResponses(cq: CriticalQuestion): string[] {
    const commonResponses = (cq as any).commonResponses;
    if (commonResponses && Array.isArray(commonResponses) && commonResponses.length > 0) {
      return commonResponses;
    }

    // Generic responses based on burden of proof
    if (this.isProponentBurden(cq.burdenOfProof)) {
      return [
        "Provide additional evidence to support the premise",
        "Clarify the reasoning to address the challenge",
        "Cite authoritative sources",
        "Explain why the objection doesn't apply",
      ];
    } else {
      return [
        "Challenge the attacker to provide counter-evidence",
        "Shift burden back by questioning the objection",
        "Point out the lack of proof in the challenge",
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
        parts.push("This attack directly challenges the conclusion.");
        break;
      case "UNDERCUTS":
        parts.push("This attack targets the inference/warrant, making the argument fail even if premises are true.");
        break;
      case "UNDERMINES":
        parts.push("This attack challenges a premise, weakening the foundation.");
        break;
    }

    // Explain burden advantage
    if (this.isProponentBurden(cq.burdenOfProof)) {
      parts.push(
        "Burden of proof advantage: The proponent must defend, you only need to raise doubt."
      );
    } else if (!cq.requiresEvidence) {
      parts.push(
        "Low evidence requirement: You can raise this challenge without extensive proof."
      );
    } else {
      parts.push(
        "Evidence required: You'll need to provide supporting evidence for this attack."
      );
    }

    // Explain scheme-specific considerations
    const schemeName = (scheme.name || scheme.key).toLowerCase();
    if (schemeName.includes("expert opinion") || schemeName.includes("expert")) {
      parts.push(
        "Expert opinion schemes are vulnerable to challenges about expertise, bias, and consensus."
      );
    } else if (schemeName.includes("practical reasoning")) {
      parts.push(
        "Practical reasoning can be attacked by showing better alternatives or negative consequences."
      );
    } else if (schemeName.includes("cause")) {
      parts.push(
        "Causal claims require establishing mechanism and ruling out alternatives."
      );
    }

    // Explain scheme instance role
    if ((schemeInstance as any).role === "presupposed") {
      parts.push(
        "This scheme is presupposed (implicit), making it harder to defend when exposed."
      );
    } else if ((schemeInstance as any).role === "primary") {
      parts.push(
        "This is the primary reasoning scheme, so attacking it strikes at the argument's core."
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
    if (this.isProponentBurden(cq.burdenOfProof)) {
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
    const role = (schemeInstance as any).role;
    if (role === "presupposed") {
      score += 15; // Presupposed schemes are often implicit, harder to defend
    } else if (role === "primary") {
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

    if (this.isProponentBurden(cq.burdenOfProof)) {
      score -= 20; // Easier
    } else {
      score += 15; // Harder
    }

    if (cq.requiresEvidence) {
      score += 20; // Much harder
    }

    const evidenceTypes = (cq.evidenceTypes as string[]) || [];
    if (evidenceTypes.length > 0) {
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
    if (this.isProponentBurden(cq.burdenOfProof)) {
      score += 15;
    }

    // Low evidence requirement increases strategic value
    if (!cq.requiresEvidence) {
      score += 10;
    }

    // Target scope
    if (cq.targetScope === "inference") {
      score += 10; // Attacking inference is high-leverage
    }

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
    // Simplified implementation for now:
    return false;
  }

  private async scoreAttackSuggestions(
    suggestions: AttackSuggestion[],
    userId: string
  ): Promise<AttackSuggestion[]> {
    // Could be enhanced with user-specific data (experience level, etc.)
    // For now, scores are already set in buildAttackSuggestion
    return suggestions;
  }

  // ============================================================================
  // Support Generation Implementation (Step 3.1.3)
  // ============================================================================

  /**
   * Get applicable schemes for a claim based on content and context
   * 
   * Analyzes claim characteristics to determine which argumentation schemes
   * are most appropriate for constructing supporting arguments.
   */
  private async getApplicableSchemes(claim: ClaimWithTopic): Promise<ArgumentScheme[]> {
    // Fetch all available schemes
    const allSchemes = await prisma.argumentScheme.findMany({
      include: {
        cqs: true,
      },
    });

    if (!allSchemes || allSchemes.length === 0) {
      return [];
    }

    // Score each scheme by applicability
    const scored = allSchemes.map((scheme) => {
      let score = 0;
      const claimText = claim.text.toLowerCase();
      const schemeName = (scheme.name || scheme.key).toLowerCase();
      const schemeKey = scheme.key.toLowerCase();

      // 1. Keyword matching based on scheme type
      if (
        schemeName.includes("expert") ||
        schemeKey.includes("expert") ||
        schemeKey.includes("authority")
      ) {
        // Expert opinion scheme - look for authority/expertise keywords
        if (
          claimText.match(/expert|study|research|scientist|doctor|professor|according to/i)
        ) {
          score += 30;
        }
        if (claimText.match(/shows|found|discovered|proven|demonstrated/i)) {
          score += 10;
        }
      }

      if (
        schemeName.includes("cause") ||
        schemeKey.includes("cause") ||
        schemeKey.includes("consequence")
      ) {
        // Causal reasoning - look for cause/effect language
        if (claimText.match(/because|causes?|leads? to|results? in|due to|therefore/i)) {
          score += 30;
        }
        if (claimText.match(/if|then|when|consequence|effect|impact/i)) {
          score += 10;
        }
      }

      if (
        schemeName.includes("practical") ||
        schemeKey.includes("practical") ||
        schemeKey.includes("action")
      ) {
        // Practical reasoning - look for action/goal language
        if (claimText.match(/should|must|ought|need to|have to|required/i)) {
          score += 30;
        }
        if (claimText.match(/goal|achieve|accomplish|purpose|benefit/i)) {
          score += 10;
        }
      }

      if (
        schemeName.includes("analog") ||
        schemeName.includes("similar") ||
        schemeKey.includes("analog")
      ) {
        // Argument from analogy - look for comparison language
        if (claimText.match(/like|similar|same as|analogous|comparable|just as/i)) {
          score += 30;
        }
        if (claimText.match(/example|case|instance|parallel/i)) {
          score += 10;
        }
      }

      if (
        schemeName.includes("sign") ||
        schemeName.includes("symptom") ||
        schemeKey.includes("sign")
      ) {
        // Argument from sign - look for indicator language
        if (claimText.match(/indicates?|suggests?|signs?|symptoms?|evidence|shows/i)) {
          score += 30;
        }
      }

      if (
        schemeName.includes("example") ||
        schemeName.includes("precedent") ||
        schemeKey.includes("example")
      ) {
        // Argument from example - look for generalization language
        if (claimText.match(/example|instance|case|typically|generally|usually/i)) {
          score += 25;
        }
      }

      if (
        schemeName.includes("popular") ||
        schemeName.includes("consensus") ||
        schemeKey.includes("popular")
      ) {
        // Popular opinion - look for consensus language
        if (claimText.match(/everyone|most|majority|consensus|widespread|common/i)) {
          score += 25;
        }
      }

      // 2. Boost schemes with more critical questions (more nuanced)
      const cqCount = (scheme as any).cqs?.length || 0;
      if (cqCount > 5) {
        score += 5;
      }

      // 3. General applicability - some schemes work for many claims
      if (schemeKey.includes("position-to-know") || schemeKey.includes("witness")) {
        score += 15; // Witness testimony is broadly applicable
      }

      return { scheme, score };
    });

    // Return schemes with non-zero scores, sorted by score
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.scheme)
      .slice(0, 15); // Top 15 most applicable schemes
  }

  /**
   * Match available evidence to a scheme's premise structure
   * 
   * Analyzes how well user evidence fits the scheme's required premises
   * and creates a support suggestion with prefilled data.
   */
  private async matchEvidenceToScheme(
    scheme: ArgumentScheme,
    claim: ClaimWithTopic,
    evidence: string[]
  ): Promise<SupportSuggestion> {
    // Parse scheme premises
    const premisesData = scheme.premises as any;
    const schemePremises: SchemePremise[] = [];

    if (Array.isArray(premisesData)) {
      premisesData.forEach((p: any) => {
        const premiseText = typeof p === "string" ? p : p?.text || JSON.stringify(p);
        schemePremises.push({
          key: p?.key || `P${schemePremises.length + 1}`,
          content: premiseText,
          type: (p?.type as any) || "ordinary",
          required: p?.required !== false,
        });
      });
    }

    // Match evidence to premises
    const premiseMatches: PremiseMatch[] = [];
    let totalMatchScore = 0;

    for (const premise of schemePremises) {
      const bestMatch = this.findBestEvidenceMatch(premise, evidence, claim);
      premiseMatches.push(bestMatch);
      totalMatchScore += bestMatch.confidence;
    }

    // Calculate overall confidence
    const avgConfidence =
      schemePremises.length > 0 ? totalMatchScore / schemePremises.length : 0;

    // Determine missing premises
    const missingPremises = premiseMatches
      .filter((m) => m.confidence < 0.5)
      .map((m) => m.premise.key);

    // Generate template
    const template = await this.generateTemplate({
      schemeId: scheme.id,
      claimId: claim.id,
      prefilledData: this.extractPrefilledData(premiseMatches),
    });

    // Generate example arguments using this scheme
    const exampleArguments = this.generateExampleSupport(scheme, claim);

    // Estimate completion effort
    const completionSteps = this.estimateCompletionSteps(premiseMatches);

    // Score the suggestion
    const strengthScore = this.estimateSupportStrength(
      avgConfidence,
      premiseMatches,
      scheme
    );
    const difficultyScore = this.estimateSupportDifficulty(missingPremises.length);
    const strategicValue = this.estimateSupportValue(scheme, claim);

    return {
      id: `support-${scheme.id}-${claim.id}`,
      scheme,
      template,
      premiseMatches,
      missingPremises,
      confidence: avgConfidence,
      exampleArguments,
      completionSteps,
      strengthScore,
      difficultyScore,
      strategicValue,
      reasoning: this.generateSupportReasoning(scheme, avgConfidence, premiseMatches),
    };
  }

  /**
   * Find best evidence match for a premise
   */
  private findBestEvidenceMatch(
    premise: SchemePremise,
    evidence: string[],
    claim: ClaimWithTopic
  ): PremiseMatch {
    const premiseText = premise.content.toLowerCase();
    const premiseWords = this.extractKeywords(premiseText);

    let bestMatch = "";
    let bestScore = 0;

    // Check each evidence item
    for (const item of evidence) {
      const itemLower = item.toLowerCase();
      const itemWords = this.extractKeywords(itemLower);

      // Calculate similarity score
      let score = 0;

      // Keyword overlap
      const overlap = premiseWords.filter((w) => itemWords.includes(w));
      score += overlap.length * 0.15;

      // Semantic patterns (simplified)
      if (premiseText.includes("expert") && itemLower.match(/expert|authority|study/)) {
        score += 0.3;
      }
      if (premiseText.includes("cause") && itemLower.match(/cause|leads? to|result/)) {
        score += 0.3;
      }
      if (premiseText.includes("goal") && itemLower.match(/goal|achieve|purpose/)) {
        score += 0.3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    // Also check if premise can be derived from claim itself
    const claimWords = this.extractKeywords(claim.text.toLowerCase());
    const claimOverlap = premiseWords.filter((w) => claimWords.includes(w));
    if (claimOverlap.length > premiseWords.length * 0.5 && claimOverlap.length > 0) {
      if (bestScore < 0.4) {
        bestMatch = claim.text;
        bestScore = 0.4; // Moderate confidence
      }
    }

    return {
      premise: {
        key: premise.key,
        content: premise.content,
        required: premise.required !== false,
        type: premise.type,
      },
      matchedEvidence: bestMatch,
      confidence: Math.min(1.0, bestScore),
      suggestedContent: bestMatch || this.generatePremiseSuggestion(premise, claim),
    };
  }

  /**
   * Extract keywords from text (simple version)
   */
  private extractKeywords(text: string): string[] {
    // Remove common stop words and extract meaningful terms
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "as",
      "is",
      "was",
      "are",
      "were",
      "been",
      "be",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "should",
      "could",
      "may",
      "might",
      "must",
      "can",
      "this",
      "that",
      "these",
      "those",
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
  }

  /**
   * Generate premise suggestion when no evidence matches
   */
  private generatePremiseSuggestion(premise: SchemePremise, claim: ClaimWithTopic): string {
    const premiseText = premise.content.toLowerCase();

    // Generate contextual suggestions based on premise type
    if (premiseText.includes("expert") || premiseText.includes("authority")) {
      return "Cite an expert, study, or authoritative source that supports your position";
    }
    if (premiseText.includes("cause") || premiseText.includes("leads to")) {
      return "Explain the causal mechanism or provide evidence of the causal relationship";
    }
    if (premiseText.includes("goal") || premiseText.includes("objective")) {
      return "State the goal or desired outcome clearly";
    }
    if (premiseText.includes("example") || premiseText.includes("case")) {
      return "Provide a specific example or case study";
    }
    if (premiseText.includes("similar") || premiseText.includes("analogy")) {
      return "Identify a similar case or analogous situation";
    }

    return `Provide evidence or reasoning for: ${premise.content}`;
  }

  /**
   * Extract prefilled data from premise matches
   */
  private extractPrefilledData(matches: PremiseMatch[]): Record<string, string> {
    const data: Record<string, string> = {};

    matches.forEach((match) => {
      if (match.confidence > 0.5 && match.matchedEvidence) {
        // Use premise key as variable name
        const varName = match.premise.key.toLowerCase().replace(/[^a-z0-9]/g, "_");
        data[varName] = match.matchedEvidence;
      }
    });

    return data;
  }

  /**
   * Generate example arguments using this scheme
   */
  private generateExampleSupport(scheme: ArgumentScheme, claim: ClaimWithTopic): string[] {
    const examples: string[] = [];
    const schemeName = (scheme.name || scheme.key).toLowerCase();

    if (schemeName.includes("expert")) {
      examples.push(
        "According to [Expert Name], [Expert's Position/Finding].",
        "Research by [Institution] shows that [Finding].",
        "[Authority Figure] states that [Statement]."
      );
    } else if (schemeName.includes("cause")) {
      examples.push(
        "[Action/Event A] causes [Effect B] because [Mechanism].",
        "When [Condition], then [Result] occurs.",
        "[Phenomenon] leads to [Outcome] through [Process]."
      );
    } else if (schemeName.includes("practical")) {
      examples.push(
        "We should [Action] to achieve [Goal].",
        "[Action] is necessary because it will [Benefit].",
        "To accomplish [Objective], we must [Step]."
      );
    } else if (schemeName.includes("analog")) {
      examples.push(
        "[Case A] is similar to [Case B] in [Respect].",
        "Just as [Analogy Source], so too [Target].",
        "[Situation X] parallels [Situation Y] because [Similarity]."
      );
    }

    // Fallback generic example
    if (examples.length === 0) {
      examples.push(
        "Present premises that logically support the conclusion.",
        "Provide evidence that makes the claim more plausible.",
        "Structure your reasoning according to the scheme's pattern."
      );
    }

    return examples;
  }

  /**
   * Estimate steps needed to complete argument
   */
  private estimateCompletionSteps(matches: PremiseMatch[]): string[] {
    const steps: string[] = [];
    const missingCount = matches.filter((m) => m.confidence < 0.5).length;
    const weakCount = matches.filter((m) => m.confidence >= 0.5 && m.confidence < 0.8).length;

    if (missingCount > 0) {
      steps.push(`Gather evidence for ${missingCount} missing premise(s)`);
    }
    if (weakCount > 0) {
      steps.push(`Strengthen ${weakCount} weak premise(s) with better evidence`);
    }

    steps.push("Review and refine the logical flow");
    steps.push("Consider potential objections");
    steps.push("Submit your argument");

    return steps;
  }

  /**
   * Estimate strength of support suggestion
   */
  private estimateSupportStrength(
    confidence: number,
    matches: PremiseMatch[],
    scheme: ArgumentScheme
  ): number {
    let score = confidence * 60; // Base on match confidence

    // Boost for high-quality matches
    const strongMatches = matches.filter((m) => m.confidence > 0.7).length;
    score += strongMatches * 10;

    // Boost for schemes with more CQs (more robust)
    const cqCount = (scheme as any).cqs?.length || 0;
    if (cqCount > 5) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Estimate difficulty of completing support argument
   */
  private estimateSupportDifficulty(missingPremiseCount: number): number {
    let score = 30; // Base difficulty

    // More missing premises = harder
    score += missingPremiseCount * 15;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Estimate strategic value of this support scheme
   */
  private estimateSupportValue(scheme: ArgumentScheme, claim: ClaimWithTopic): number {
    let score = 50;

    const schemeName = (scheme.name || scheme.key).toLowerCase();

    // Expert opinion and causal arguments are generally strong
    if (schemeName.includes("expert") || schemeName.includes("authority")) {
      score += 20;
    }
    if (schemeName.includes("cause") || schemeName.includes("consequence")) {
      score += 15;
    }

    // Schemes with more CQs show sophistication
    const cqCount = (scheme as any).cqs?.length || 0;
    if (cqCount > 5) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate reasoning for why this support is suggested
   */
  private generateSupportReasoning(
    scheme: ArgumentScheme,
    confidence: number,
    matches: PremiseMatch[]
  ): string {
    const parts: string[] = [];
    const schemeName = scheme.name || scheme.key;

    parts.push(`The "${schemeName}" scheme is well-suited for your claim.`);

    // Explain match quality
    if (confidence > 0.7) {
      parts.push("Your available evidence strongly matches the required premises.");
    } else if (confidence > 0.4) {
      parts.push("Your evidence partially matches the premises; some gaps need filling.");
    } else {
      parts.push("This scheme could work, but you'll need to gather more evidence.");
    }

    // Explain scheme advantages
    const schemeNameLower = schemeName.toLowerCase();
    if (schemeNameLower.includes("expert")) {
      parts.push("Expert testimony carries significant persuasive weight.");
    } else if (schemeNameLower.includes("cause")) {
      parts.push("Causal arguments are powerful when the mechanism is clear.");
    } else if (schemeNameLower.includes("practical")) {
      parts.push("Practical reasoning is effective for action-oriented claims.");
    }

    // Note missing pieces
    const missingCount = matches.filter((m) => m.confidence < 0.5).length;
    if (missingCount > 0) {
      parts.push(`You'll need to provide evidence for ${missingCount} premise(s).`);
    }

    return parts.join(" ");
  }

  /**
   * Score and enhance support suggestions with user-specific data
   */
  private async scoreSupportSuggestions(
    suggestions: SupportSuggestion[],
    userId: string
  ): Promise<SupportSuggestion[]> {
    // Could be enhanced with:
    // - User's argumentation skill level
    // - User's past success with different schemes
    // - Time constraints
    // - Deliberation context
    
    // For now, scores are set in matchEvidenceToScheme
    return suggestions;
  }

  private buildPremiseTemplates(
    scheme: ArgumentScheme,
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

  private extractVariables(scheme: ArgumentScheme): Record<string, string> {
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
    scheme: ArgumentScheme,
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
  ): Promise<{
    overallScore: number;
    premiseScores: Record<string, number>;
    missingElements: string[];
    suggestions: string[];
  }> {
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
