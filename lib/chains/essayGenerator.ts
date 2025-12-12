/**
 * Argument Chain Essay Generator
 * 
 * Transforms structured argument chains into seamless, flowing essay prose
 * that weaves together argumentation theory, scheme structures, and natural language.
 * 
 * Based on research from:
 * - Macagno, Walton & Reed: "Argumentation Schemes: History, Classifications, and Computational Applications"
 * - Wei & Prakken: "Defining the structure of arguments with AI models of argumentation"
 * - Walton's formal scheme structures with critical questions
 * 
 * Key Design Principles:
 * 1. Arguments are presented as natural reasoning, not enumerated items
 * 2. Scheme structures are woven into prose as explanatory context
 * 3. Dialectical relationships (support/attack) create narrative tension
 * 4. Critical questions surface as implicit challenges the essay addresses
 * 5. Formal elements (premises, warrants) appear as embedded explanations
 */

import { ArgumentChainWithRelations, ArgumentChainNodeWithArgument, ArgumentChainEdgeWithNodes } from "@/lib/types/argumentChain";

// ===== Types =====

export interface EssayOptions {
  /** Essay tone/register */
  tone?: "academic" | "journalistic" | "deliberative" | "persuasive";
  /** Target audience sophistication */
  audienceLevel?: "general" | "informed" | "expert";
  /** Include explicit scheme references */
  includeSchemeReferences?: boolean;
  /** Include critical questions as rhetorical elements */
  includeCriticalQuestions?: boolean;
  /** Weave in premise structure */
  includePremiseStructure?: boolean;
  /** Include dialectical analysis (attacks/rebuttals) */
  includeDialectic?: boolean;
  /** Maximum essay length (approximate word count) */
  maxLength?: number;
  /** Include chain type description in opening (Phase 4) */
  describeChainStructure?: boolean;
  /** Apply epistemic status language (Phase 4) */
  includeEpistemicLanguage?: boolean;
  /** Structure essay sections around scopes (Phase C) */
  structureByScopes?: boolean;
  /** Handle nested scopes as subsections (Phase C) */
  handleNestedScopes?: boolean;
}

export interface EssayResult {
  title: string;
  abstract: string;
  body: string;
  fullText: string;
  wordCount: number;
  metadata: {
    chainId: string;
    argumentCount: number;
    schemeCount: number;
    dialecticalMoves: number;
    generatedAt: string;
  };
}

// ===== Rich Scheme Metadata Interface =====

interface SchemeMetadata {
  key: string;
  name: string | null;
  description: string | null;
  summary: string | null;
  // Formal structure
  premises: PremiseTemplate[] | null;
  conclusion: ConclusionTemplate | null;
  // Walton taxonomy
  purpose: string | null;
  source: string | null;
  materialRelation: string | null;
  reasoningType: string | null;
  ruleForm: string | null;
  conclusionType: string | null;
  // Critical questions
  cq: CriticalQuestionData[];
  // Guidance
  whenToUse: string | null;
  examples: string[];
  // Hierarchy
  clusterTag: string | null;
  parentSchemeId: string | null;
}

interface PremiseTemplate {
  id?: string;
  type?: "major" | "minor";
  text: string;
  variables?: string[];
}

interface ConclusionTemplate {
  text: string;
  variables?: string[];
}

interface CriticalQuestionData {
  key?: string;
  text: string;
  attackType?: string;
  targetScope?: string;
}

// ===== Text Processing Utilities =====

/**
 * Intelligently lowercase text while preserving proper nouns and acronyms
 * Handles common patterns in argumentative text (AI, EU, GDPR, etc.)
 */
function smartLowercase(text: string): string {
  if (!text) return "";
  
  // Common acronyms to preserve (all caps)
  const acronyms = ['AI', 'EU', 'US', 'UK', 'UN', 'GDPR', 'NATO', 'UNESCO', 'WHO', 'WTO', 'FDA', 'FTC', 'OECD'];
  
  // Common proper nouns that might start sentences (names, organizations)
  const properNounPrefixes = [
    'Geoffrey', 'Yoshua', 'Stuart', 'Hinton', 'Bengio', 'Russell',
    'Congress', 'Parliament', 'Court', 'Senate', 'Commission',
    'NeurIPS', 'OpenAI', 'Google', 'Microsoft', 'DeepMind', 'Anthropic'
  ];
  
  // Check if text starts with a proper noun - don't lowercase
  for (const noun of properNounPrefixes) {
    if (text.startsWith(noun)) {
      return text;
    }
  }
  
  // Check if text starts with an acronym - don't lowercase
  for (const acronym of acronyms) {
    if (text.startsWith(acronym + ' ') || text === acronym) {
      return text;
    }
  }
  
  // Lowercase the first character only (preserve rest)
  let result = text.charAt(0).toLowerCase() + text.slice(1);
  
  // Restore acronyms that may have been lowercased (mid-sentence)
  acronyms.forEach(acronym => {
    const regex = new RegExp(`\\b${acronym.toLowerCase()}\\b`, 'g');
    result = result.replace(regex, acronym);
  });
  
  return result;
}

/**
 * Ensure text ends with proper punctuation
 */
function ensurePeriod(text: string): string {
  const trimmed = text.trim();
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return trimmed + ".";
}

// ===== Natural Language Weaving Utilities =====

/**
 * Maps reasoning types to natural discourse markers
 */
const REASONING_DISCOURSE_MARKERS: Record<string, string[]> = {
  deductive: [
    "It follows necessarily that",
    "This leads us to conclude",
    "From these premises, we can derive",
    "The logical consequence is",
  ],
  inductive: [
    "The evidence suggests",
    "Based on these observations",
    "The pattern indicates",
    "Drawing from experience",
  ],
  abductive: [
    "The best explanation for this",
    "What would account for this",
    "The most plausible interpretation",
    "This can be understood as",
  ],
  practical: [
    "Given our objectives",
    "To achieve this goal",
    "The appropriate course of action",
    "Prudence dictates that",
  ],
};

/**
 * Maps material relations to bridging phrases
 */
const MATERIAL_RELATION_BRIDGES: Record<string, string[]> = {
  cause: [
    "because",
    "as a result of",
    "owing to the fact that",
    "given that",
  ],
  definition: [
    "by definition",
    "what it means to be",
    "in virtue of being",
    "precisely because it is",
  ],
  analogy: [
    "just as",
    "in the same way that",
    "drawing a parallel with",
    "much like",
  ],
  authority: [
    "according to",
    "as established by",
    "on the authority of",
    "expert consensus holds that",
  ],
  sign: [
    "as evidenced by",
    "the indicators suggest",
    "observable signs point to",
    "this is symptomatic of",
  ],
  example: [
    "as demonstrated in the case of",
    "the precedent of",
    "exemplified by",
    "as we see in",
  ],
};

/**
 * Maps edge types to transitional phrases that create narrative flow
 */
const EDGE_NARRATIVE_TRANSITIONS: Record<string, string[]> = {
  SUPPORTS: [
    "This reasoning is strengthened by",
    "Further support comes from",
    "Reinforcing this point",
    "Building on this foundation",
  ],
  REFUTES: [
    "However, this faces a significant challenge:",
    "A compelling counterargument holds that",
    "Yet this reasoning is contested by",
    "Against this view stands the objection that",
  ],
  ENABLES: [
    "This opens the path to",
    "Having established this, we can now consider",
    "This makes possible the further argument that",
    "With this foundation in place",
  ],
  PRESUPPOSES: [
    "This argument depends on the prior recognition that",
    "Underlying this reasoning is the premise that",
    "The force of this argument rests on",
    "Before proceeding, we must acknowledge that",
  ],
  QUALIFIES: [
    "Though with an important qualification:",
    "This holds true, but with conditions:",
    "The argument applies, subject to the caveat that",
    "While generally valid, this must be tempered by",
  ],
  EXEMPLIFIES: [
    "A concrete illustration of this principle",
    "This is demonstrated in practice by",
    "To see this in action, consider",
    "The abstract principle takes concrete form in",
  ],
  GENERALIZES: [
    "From this specific case, we can extract a broader principle:",
    "Generalizing from this instance",
    "This points to the wider truth that",
    "The particular reveals the general:",
  ],
};

// ===== Chain Type Essay Descriptions (Phase 4) =====

const CHAIN_TYPE_ESSAY_DESCRIPTIONS: Record<string, {
  opening: string;
  structure: string;
  flowDescription: string;
}> = {
  SERIAL: {
    opening: "This essay traces a sequence of interconnected arguments",
    structure: "each building upon its predecessor in a logical chain",
    flowDescription: "The reasoning unfolds step by step, with each argument laying the groundwork for the next."
  },
  CONVERGENT: {
    opening: "This essay presents multiple independent arguments that converge upon a central thesis",
    structure: "offering complementary perspectives that reinforce one another",
    flowDescription: "Several distinct lines of reasoning come together to establish a shared conclusion."
  },
  DIVERGENT: {
    opening: "Beginning from a foundational premise, this essay explores multiple implications",
    structure: "drawing several distinct conclusions from common ground",
    flowDescription: "A single well-established claim gives rise to a range of consequences and applications."
  },
  TREE: {
    opening: "This essay is structured hierarchically",
    structure: "moving from broad principles to specific applications",
    flowDescription: "The argumentation branches at key points, addressing distinct aspects at each level."
  },
  GRAPH: {
    opening: "The argumentative landscape forms a complex network of interrelated claims",
    structure: "which this essay navigates systematically",
    flowDescription: "Arguments relate to one another in multiple ways, creating a rich deliberative fabric."
  }
};

// ===== Epistemic Status Essay Language (Phase 4) =====

const EPISTEMIC_ESSAY_LANGUAGE: Record<string, {
  introPhrase: string;
  contextMarker: string;
  closingNote: string;
}> = {
  ASSERTED: {
    introPhrase: "",
    contextMarker: "",
    closingNote: ""
  },
  HYPOTHETICAL: {
    introPhrase: "Let us suppose, for the sake of argument, that ",
    contextMarker: "Under this hypothesis, ",
    closingNote: "This hypothetical exploration illuminates possibilities worth considering."
  },
  COUNTERFACTUAL: {
    introPhrase: "Consider a counterfactual scenario in which ",
    contextMarker: "In this contrary-to-fact scenario, ",
    closingNote: "Though contrary to actual events, this counterfactual analysis reveals important insights."
  },
  CONDITIONAL: {
    introPhrase: "If we accept that ",
    contextMarker: "Given this condition, ",
    closingNote: "The conditional nature of this reasoning should be kept in mind."
  },
  QUESTIONED: {
    introPhrase: "It remains an open question whether ",
    contextMarker: "Pending further examination, ",
    closingNote: "This matter awaits conclusive resolution."
  },
  DENIED: {
    introPhrase: "While some have argued that ",
    contextMarker: "Despite the rejection of this view, ",
    closingNote: "Though this position has been denied, understanding it illuminates the debate."
  },
  SUSPENDED: {
    introPhrase: "Setting aside for now the question of whether ",
    contextMarker: "Bracketing this consideration, ",
    closingNote: "This suspended judgment may be revisited as the analysis develops."
  }
};

/**
 * Get epistemic intro phrase for essay
 */
function getEssayEpistemicIntro(status: string | null | undefined): string {
  if (!status || status === "ASSERTED") return "";
  return EPISTEMIC_ESSAY_LANGUAGE[status]?.introPhrase || "";
}

/**
 * Get epistemic context marker for essay transitions
 */
function getEssayEpistemicContext(status: string | null | undefined): string {
  if (!status || status === "ASSERTED") return "";
  return EPISTEMIC_ESSAY_LANGUAGE[status]?.contextMarker || "";
}

// ===== Scope Essay Section Templates (Phase C) =====

const SCOPE_ESSAY_TEMPLATES: Record<string, {
  sectionTitle: string;
  opening: string;
  transition: string;
  closing: string;
}> = {
  HYPOTHETICAL: {
    sectionTitle: "Hypothetical Analysis",
    opening: "Let us consider a hypothetical scenario",
    transition: "Under this assumption, a distinct line of reasoning emerges",
    closing: "This hypothetical exploration, while not conclusive, illuminates possibilities that merit consideration in our overall assessment."
  },
  COUNTERFACTUAL: {
    sectionTitle: "Counterfactual Exploration",
    opening: "Consider, contrary to the actual facts, a scenario in which",
    transition: "In this alternative reality, the argumentative landscape shifts",
    closing: "Though this scenario did not come to pass, understanding its implications deepens our grasp of the underlying causal and logical structures."
  },
  CONDITIONAL: {
    sectionTitle: "Conditional Reasoning",
    opening: "If we accept the following condition",
    transition: "Given this conditional framework, certain conclusions follow",
    closing: "The conditional nature of this analysis should guide how we apply these conclusions to cases where the condition obtains."
  },
  OPPONENT: {
    sectionTitle: "Considering the Opposition",
    opening: "From a contrasting perspective, some maintain that",
    transition: "This opposing viewpoint advances arguments that",
    closing: "Engaging seriously with this opposition strengthens our overall understanding and highlights where the strongest points of contention lie."
  },
  MODAL: {
    sectionTitle: "Modal Analysis",
    opening: "In a possible world where",
    transition: "The logical consequences in this modal context reveal",
    closing: "This modal exploration extends our analysis beyond the actual to consider what is possible, necessary, or contingent."
  }
};

/**
 * Interface for scope with nodes for essay generation
 */
interface EssayScopeData {
  id: string;
  scopeType: string;
  assumption: string;
  color?: string | null;
  parentId?: string | null;
  nodes: ArgumentChainNodeWithArgument[];
  childScopes?: EssayScopeData[];
  depth: number;
}

/**
 * Group nodes by scope and build hierarchy for essay structure
 */
function groupNodesForEssay(
  nodes: ArgumentChainNodeWithArgument[],
  scopes: any[] | undefined
): { mainNodes: ArgumentChainNodeWithArgument[]; scopeSections: EssayScopeData[] } {
  const mainNodes: ArgumentChainNodeWithArgument[] = [];
  const scopeMap = new Map<string, EssayScopeData>();

  // Initialize scope groups
  if (scopes) {
    for (const scope of scopes) {
      scopeMap.set(scope.id, {
        id: scope.id,
        scopeType: scope.scopeType,
        assumption: scope.assumption,
        color: scope.color,
        parentId: scope.parentId,
        nodes: [],
        childScopes: [],
        depth: 0
      });
    }
  }

  // Assign nodes to scopes or main list
  for (const node of nodes) {
    const scopeId = (node as any).scopeId;
    if (scopeId && scopeMap.has(scopeId)) {
      scopeMap.get(scopeId)!.nodes.push(node);
    } else {
      mainNodes.push(node);
    }
  }

  // Build scope hierarchy and calculate depths
  const rootScopes: EssayScopeData[] = [];
  
  const calculateDepth = (scope: EssayScopeData, depth: number) => {
    scope.depth = depth;
    scope.childScopes?.forEach(child => calculateDepth(child, depth + 1));
  };

  for (const scope of scopeMap.values()) {
    if (scope.parentId && scopeMap.has(scope.parentId)) {
      scopeMap.get(scope.parentId)!.childScopes?.push(scope);
    } else {
      rootScopes.push(scope);
    }
  }

  // Calculate depths starting from roots
  rootScopes.forEach(scope => calculateDepth(scope, 0));

  return { mainNodes, scopeSections: rootScopes };
}

/**
 * Generate essay section for a scope (with recursive handling for nested scopes)
 */
function generateScopeEssaySection(
  scope: EssayScopeData,
  options: EssayOptions,
  nodeIndex: { current: number }
): string {
  const template = SCOPE_ESSAY_TEMPLATES[scope.scopeType] || SCOPE_ESSAY_TEMPLATES.HYPOTHETICAL;
  const headingLevel = Math.min(scope.depth + 2, 4); // h2, h3, h4 max
  const heading = "#".repeat(headingLevel);
  
  const parts: string[] = [];
  
  // Section header
  parts.push(`${heading} ${template.sectionTitle}: *${scope.assumption}*\n`);
  
  // Opening paragraph
  parts.push(`${template.opening}: *"${scope.assumption}"*. ${template.transition}.\n`);
  
  // Generate prose for nodes in this scope
  if (scope.nodes.length > 0) {
    scope.nodes.forEach(node => {
      const scheme = extractSchemeMetadata(node);
      const premises = getArgumentPremises(node);
      const warrant = getImplicitWarrant(node);
      const nodeProse = generateArgumentProseForEssay(node, scheme, premises, warrant, options);
      parts.push(nodeProse);
      nodeIndex.current++;
    });
  }
  
  // Recursively handle nested scopes
  if (scope.childScopes && scope.childScopes.length > 0) {
    scope.childScopes.forEach(childScope => {
      parts.push("\n" + generateScopeEssaySection(childScope, options, nodeIndex));
    });
  }
  
  // Closing paragraph
  parts.push(`\n${template.closing}\n`);
  
  return parts.join("\n");
}

/**
 * Generate argument prose specifically for essay context (simplified wrapper)
 */
function generateArgumentProseForEssay(
  node: ArgumentChainNodeWithArgument,
  scheme: SchemeMetadata | null,
  premises: Array<{ text: string; isImplicit: boolean }>,
  warrant: string | null,
  options: EssayOptions
): string {
  // Delegate to the existing generateArgumentProse function
  return generateArgumentProse(node, scheme, premises, warrant, options);
}

/**
 * Generate overview paragraph introducing the scoped sections
 */
function generateScopeOverview(scopes: EssayScopeData[]): string {
  if (scopes.length === 0) return "";
  
  const scopeDescriptions: string[] = [];
  
  scopes.forEach(scope => {
    const template = SCOPE_ESSAY_TEMPLATES[scope.scopeType] || SCOPE_ESSAY_TEMPLATES.HYPOTHETICAL;
    const nodeCount = countNodesInScope(scope);
    scopeDescriptions.push(
      `a ${template.sectionTitle.toLowerCase()} (${nodeCount} argument${nodeCount !== 1 ? "s" : ""}) examining the assumption that *"${scope.assumption}"*`
    );
  });
  
  if (scopes.length === 1) {
    return `Beyond the main line of argument, this essay also includes ${scopeDescriptions[0]}. This scoped analysis allows us to explore reasoning under specific conditions or perspectives.`;
  }
  
  const lastScope = scopeDescriptions.pop();
  return `Beyond the main line of argument, this essay includes ${scopeDescriptions.join(", ")}, and ${lastScope}. These scoped sections allow us to explore reasoning under various conditions and perspectives, enriching the overall analysis.`;
}

/**
 * Count total nodes in a scope including nested scopes
 */
function countNodesInScope(scope: EssayScopeData): number {
  let count = scope.nodes.length;
  if (scope.childScopes) {
    scope.childScopes.forEach(child => {
      count += countNodesInScope(child);
    });
  }
  return count;
}

/**
 * Generate conclusion paragraph summarizing scoped analyses
 */
function generateScopeConclusion(scopes: EssayScopeData[]): string {
  if (scopes.length === 0) return "";
  
  const summaries: string[] = [];
  
  scopes.forEach(scope => {
    const template = SCOPE_ESSAY_TEMPLATES[scope.scopeType] || SCOPE_ESSAY_TEMPLATES.HYPOTHETICAL;
    summaries.push(`The ${template.sectionTitle.toLowerCase()} of *"${scope.assumption}"*`);
  });
  
  if (scopes.length === 1) {
    return `${summaries[0]} has provided additional depth to our understanding, illuminating aspects of the argument that might otherwise remain implicit or unexplored.`;
  }
  
  const lastSummary = summaries.pop();
  return `The various scoped analyses—${summaries.join(", ")}, and ${lastSummary}—have each contributed unique perspectives that enrich our understanding of the central thesis and its implications.`;
}

/**
 * Select a random element from array for variety
 */
function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== Data Extraction Utilities =====

/**
 * Extract scheme metadata from a node
 */
function extractSchemeMetadata(node: ArgumentChainNodeWithArgument): SchemeMetadata | null {
  const arg = node.argument as any;
  if (!arg) return null;

  // Check argumentSchemes relation (Phase 4 multi-scheme)
  if (arg.argumentSchemes && arg.argumentSchemes.length > 0) {
    const schemeInstance = arg.argumentSchemes[0];
    const scheme = schemeInstance.scheme;
    return parseSchemeToMetadata(scheme);
  }

  // Check schemeNet for complex sequential reasoning
  if (arg.schemeNet?.steps && arg.schemeNet.steps.length > 0) {
    const firstStep = arg.schemeNet.steps[0];
    return parseSchemeToMetadata(firstStep.scheme);
  }

  return null;
}

/**
 * Parse raw scheme data into structured metadata
 */
function parseSchemeToMetadata(scheme: any): SchemeMetadata {
  return {
    key: scheme.key || "",
    name: scheme.name || null,
    description: scheme.description || null,
    summary: scheme.summary || null,
    premises: parsePremises(scheme.premises),
    conclusion: parseConclusion(scheme.conclusion),
    purpose: scheme.purpose || null,
    source: scheme.source || null,
    materialRelation: scheme.materialRelation || null,
    reasoningType: scheme.reasoningType || null,
    ruleForm: scheme.ruleForm || null,
    conclusionType: scheme.conclusionType || null,
    cq: parseCriticalQuestions(scheme.cq || scheme.cqs),
    whenToUse: scheme.whenToUse || null,
    examples: scheme.examples || [],
    clusterTag: scheme.clusterTag || null,
    parentSchemeId: scheme.parentSchemeId || null,
  };
}

/**
 * Parse premises JSON into structured array
 */
function parsePremises(premises: any): PremiseTemplate[] | null {
  if (!premises) return null;
  
  if (Array.isArray(premises)) {
    return premises.map(p => ({
      id: p.id || undefined,
      type: p.type || p.premiseType || undefined,
      text: p.text || p.template || (typeof p === "string" ? p : ""),
      variables: p.variables || [],
    })).filter(p => p.text);
  }
  
  if (typeof premises === "object") {
    return Object.entries(premises).map(([key, value]: [string, any]) => ({
      id: key,
      type: value.type || value.premiseType || undefined,
      text: value.text || value.template || "",
      variables: value.variables || [],
    })).filter(p => p.text);
  }
  
  return null;
}

/**
 * Parse conclusion JSON
 */
function parseConclusion(conclusion: any): ConclusionTemplate | null {
  if (!conclusion) return null;
  
  if (typeof conclusion === "string") {
    return { text: conclusion, variables: [] };
  }
  
  return {
    text: conclusion.text || conclusion.template || "",
    variables: conclusion.variables || [],
  };
}

/**
 * Parse critical questions from various formats
 */
function parseCriticalQuestions(cq: any): CriticalQuestionData[] {
  if (!cq) return [];
  
  if (Array.isArray(cq)) {
    return cq.map(q => {
      if (typeof q === "string") return { text: q };
      return {
        key: q.key || q.id || undefined,
        text: q.text || q.question || q.questionText || "",
        attackType: q.attackType || undefined,
        targetScope: q.targetScope || q.target || undefined,
      };
    }).filter(q => q.text);
  }
  
  if (typeof cq === "object") {
    return Object.entries(cq).map(([key, value]: [string, any]) => ({
      key,
      text: typeof value === "string" ? value : value.text || value.question || "",
      attackType: typeof value === "object" ? value.attackType : undefined,
      targetScope: typeof value === "object" ? value.targetScope : undefined,
    })).filter(q => q.text);
  }
  
  return [];
}

/**
 * Get argument premises (actual claim data)
 */
function getArgumentPremises(node: ArgumentChainNodeWithArgument): Array<{ text: string; isImplicit: boolean }> {
  const arg = node.argument as any;
  if (!arg?.premises || !Array.isArray(arg.premises)) return [];
  
  return arg.premises.map((p: any) => ({
    text: p.claim?.text || "",
    isImplicit: p.isImplicit || false,
  })).filter((p: any) => p.text);
}

/**
 * Get implicit warrant if present
 */
function getImplicitWarrant(node: ArgumentChainNodeWithArgument): string | null {
  const arg = node.argument as any;
  if (!arg?.implicitWarrant) return null;
  
  if (typeof arg.implicitWarrant === "string") return arg.implicitWarrant;
  if (typeof arg.implicitWarrant === "object") {
    return arg.implicitWarrant.text || arg.implicitWarrant.warrant || null;
  }
  return null;
}

/**
 * Get argument conclusion text
 */
function getArgumentConclusion(node: ArgumentChainNodeWithArgument): string {
  const arg = node.argument as any;
  if (arg?.conclusion?.text) return arg.conclusion.text;
  if (arg?.text) return arg.text;
  return "No conclusion available";
}

// ===== Essay Structure Analysis =====

/**
 * Analyze chain structure to determine narrative arc
 */
interface NarrativeStructure {
  openingArguments: ArgumentChainNodeWithArgument[];
  developingArguments: ArgumentChainNodeWithArgument[];
  contestedArguments: ArgumentChainNodeWithArgument[];
  resolutionArguments: ArgumentChainNodeWithArgument[];
  mainThesis: ArgumentChainNodeWithArgument | null;
  dialecticalPairs: Array<{
    thesis: ArgumentChainNodeWithArgument;
    antithesis: ArgumentChainNodeWithArgument;
    synthesis: ArgumentChainNodeWithArgument | null;
  }>;
}

function analyzeNarrativeStructure(
  nodes: ArgumentChainNodeWithArgument[],
  edges: ArgumentChainEdgeWithNodes[]
): NarrativeStructure {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // Calculate in-degree and out-degree for each node
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  const attackedBy = new Map<string, string[]>();
  const attacks = new Map<string, string[]>();
  
  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
    attackedBy.set(n.id, []);
    attacks.set(n.id, []);
  });
  
  edges.forEach(e => {
    outDegree.set(e.sourceNodeId, (outDegree.get(e.sourceNodeId) || 0) + 1);
    inDegree.set(e.targetNodeId, (inDegree.get(e.targetNodeId) || 0) + 1);
    
    // Track attack relationships
    if (e.edgeType === "REFUTES" || e.edgeType === "ATTACKS") {
      attackedBy.get(e.targetNodeId)?.push(e.sourceNodeId);
      attacks.get(e.sourceNodeId)?.push(e.targetNodeId);
    }
  });
  
  // Opening arguments: roots (no incoming edges)
  const openingArguments = nodes.filter(n => inDegree.get(n.id) === 0);
  
  // Resolution arguments: leaves with no outgoing edges (typically conclusions)
  const resolutionArguments = nodes.filter(n => outDegree.get(n.id) === 0);
  
  // Contested arguments: those that have attacks
  const contestedArguments = nodes.filter(n => (attackedBy.get(n.id)?.length || 0) > 0);
  
  // Developing arguments: middle nodes
  const openAndResolutionIds = new Set([
    ...openingArguments.map(n => n.id),
    ...resolutionArguments.map(n => n.id)
  ]);
  const developingArguments = nodes.filter(n => !openAndResolutionIds.has(n.id));
  
  // Main thesis: the node with most incoming support edges (most supported conclusion)
  let mainThesis: ArgumentChainNodeWithArgument | null = null;
  let maxSupport = 0;
  nodes.forEach(n => {
    const supportCount = edges.filter(
      e => e.targetNodeId === n.id && e.edgeType === "SUPPORTS"
    ).length;
    if (supportCount > maxSupport) {
      maxSupport = supportCount;
      mainThesis = n;
    }
  });
  
  // Find dialectical pairs (thesis-antithesis-synthesis patterns)
  const dialecticalPairs: NarrativeStructure["dialecticalPairs"] = [];
  contestedArguments.forEach(thesis => {
    const attackers = attackedBy.get(thesis.id) || [];
    attackers.forEach(attackerId => {
      const antithesis = nodeMap.get(attackerId);
      if (!antithesis) return;
      
      // Look for a synthesis: something that supports both or follows from the exchange
      const synthesisCandidates = edges
        .filter(e => 
          (e.sourceNodeId === thesis.id || e.sourceNodeId === attackerId) &&
          e.edgeType === "SUPPORTS"
        )
        .map(e => nodeMap.get(e.targetNodeId))
        .filter(Boolean);
      
      dialecticalPairs.push({
        thesis,
        antithesis,
        synthesis: synthesisCandidates[0] || null,
      });
    });
  });
  
  return {
    openingArguments,
    developingArguments,
    contestedArguments,
    resolutionArguments,
    mainThesis,
    dialecticalPairs,
  };
}

// ===== Prose Generation Functions =====

/**
 * Generate an opening paragraph that sets up the deliberation
 */
function generateOpening(
  chain: ArgumentChainWithRelations,
  structure: NarrativeStructure,
  options: EssayOptions
): string {
  const paragraphs: string[] = [];
  const { describeChainStructure = true } = options;
  
  // Phase 4: Get chain type for structural description
  const chainType = (chain as any).chainType || "GRAPH";
  const typeInfo = CHAIN_TYPE_ESSAY_DESCRIPTIONS[chainType] || CHAIN_TYPE_ESSAY_DESCRIPTIONS.GRAPH;
  
  // Helper to clean text for introduction
  const cleanPurpose = (text: string): string => {
    let cleaned = text.trim();
    // Remove trailing punctuation since we add our own
    cleaned = cleaned.replace(/[.!?]+$/, "");
    // Use smartLowercase to preserve proper nouns/acronyms
    return smartLowercase(cleaned);
  };
  
  // Thematic opening based on chain purpose
  if (chain.purpose) {
    let openingParagraph = `The question before us concerns ${cleanPurpose(chain.purpose)}.`;
    
    // Phase 4: Add chain type description
    if (describeChainStructure) {
      openingParagraph += ` ${typeInfo.opening}, ${typeInfo.structure}.`;
    } else {
      openingParagraph += ` This analysis examines the arguments and considerations that bear on this matter.`;
    }
    
    paragraphs.push(openingParagraph);
  } else if (chain.description) {
    let descParagraph = chain.description;
    
    // Phase 4: Append chain type description if not already descriptive
    if (describeChainStructure && descParagraph.length < 200) {
      descParagraph += ` ${typeInfo.flowDescription}`;
    }
    
    paragraphs.push(descParagraph);
  } else {
    // Default opening with chain type (Phase 4)
    if (describeChainStructure) {
      paragraphs.push(
        `${typeInfo.opening}, ${typeInfo.structure}. ${typeInfo.flowDescription}`
      );
    } else {
      paragraphs.push(
        `This essay presents a structured analysis of interconnected arguments, ` +
        `tracing the logical relationships that bind them together.`
      );
    }
  }
  
  // Preview the argumentative landscape
  if (structure.openingArguments.length > 0) {
    const openingClaims = structure.openingArguments
      .slice(0, 3)
      .map(n => getArgumentConclusion(n))
      .map(c => `"${c.length > 80 ? c.slice(0, 80) + "..." : c}"`);
    
    paragraphs.push(
      `The analysis begins from ${structure.openingArguments.length} foundational consideration${structure.openingArguments.length > 1 ? "s" : ""}: ` +
      openingClaims.join("; and ") + "."
    );
  }
  
  // Signal dialectical complexity if present
  if (structure.dialecticalPairs.length > 0) {
    paragraphs.push(
      `The reasoning is not uncontested. ${structure.dialecticalPairs.length} point${structure.dialecticalPairs.length > 1 ? "s" : ""} of significant disagreement ` +
      `reveal the tensions inherent in this domain, requiring careful navigation between competing considerations.`
    );
  }
  
  return paragraphs.join("\n\n");
}

/**
 * Generate prose for a single argument, weaving in scheme structure
 */
function generateArgumentProse(
  node: ArgumentChainNodeWithArgument,
  scheme: SchemeMetadata | null,
  premises: Array<{ text: string; isImplicit: boolean }>,
  warrant: string | null,
  options: EssayOptions
): string {
  const conclusion = getArgumentConclusion(node);
  const parts: string[] = [];
  const { includeEpistemicLanguage = true } = options;
  
  // Phase 4: Get epistemic status
  const epistemicStatus = (node as any).epistemicStatus as string | null;
  const epistemicIntro = includeEpistemicLanguage ? getEssayEpistemicIntro(epistemicStatus) : "";
  
  // Opening: integrate conclusion naturally based on scheme type
  // Phase 4: Prepend epistemic intro if non-ASSERTED
  if (epistemicIntro) {
    // For non-ASSERTED statuses, lead with the epistemic framing
    if (scheme?.reasoningType) {
      const reasoningType = scheme.reasoningType.toLowerCase();
      
      if (reasoningType === "inductive") {
        parts.push(`${epistemicIntro}the evidence points to an important conclusion: ${smartLowercase(conclusion)}`);
      } else if (reasoningType === "abductive") {
        parts.push(`${epistemicIntro}the most plausible explanation is that ${smartLowercase(conclusion)}`);
      } else if (reasoningType === "practical") {
        parts.push(`${epistemicIntro}from a practical standpoint, ${smartLowercase(conclusion)}`);
      } else if (reasoningType === "deductive") {
        parts.push(`${epistemicIntro}it follows that ${smartLowercase(conclusion)}`);
      } else {
        parts.push(`${epistemicIntro}${smartLowercase(conclusion)}`);
      }
    } else {
      parts.push(`${epistemicIntro}${smartLowercase(conclusion)}`);
    }
  } else if (scheme?.reasoningType) {
    const reasoningType = scheme.reasoningType.toLowerCase();
    
    // Create natural sentence openings based on reasoning type
    if (reasoningType === "inductive") {
      parts.push(`The evidence points to an important conclusion: ${conclusion}`);
    } else if (reasoningType === "abductive") {
      parts.push(`The most plausible explanation is that ${smartLowercase(conclusion)}`);
    } else if (reasoningType === "practical") {
      parts.push(`From a practical standpoint, ${smartLowercase(conclusion)}`);
    } else if (reasoningType === "deductive") {
      parts.push(`It follows that ${smartLowercase(conclusion)}`);
    } else {
      parts.push(conclusion);
    }
  } else {
    parts.push(conclusion);
  }
  
  // Weave in premises using material relation bridges
  // Phase 4: Use epistemic context marker for premise transitions
  const epistemicContext = includeEpistemicLanguage ? getEssayEpistemicContext(epistemicStatus) : "";
  
  if (premises.length > 0 && options.includePremiseStructure !== false) {
    if (premises.length === 1) {
      const bridge = scheme?.materialRelation 
        ? sample(MATERIAL_RELATION_BRIDGES[scheme.materialRelation.toLowerCase()] || ["This follows from the fact that"])
        : "This follows from the fact that";
      parts.push(`${epistemicContext}${epistemicContext ? bridge.toLowerCase() : bridge} ${smartLowercase(premises[0].text)}`);
    } else {
      // Multiple premises - create sophisticated enumeration
      const premiseIntros = epistemicContext 
        ? [
            `${epistemicContext}this conclusion draws support from several observations.`,
            `${epistemicContext}the reasoning rests on multiple considerations.`,
            `${epistemicContext}several factors converge to support this view.`,
          ]
        : [
            "This conclusion draws support from several observations.",
            "The reasoning rests on multiple considerations.",
            "Several factors converge to support this view.",
          ];
      
      parts.push(sample(premiseIntros));
      
      // Present premises as a flowing paragraph rather than a list
      const premiseNarratives = premises.map((p, i) => {
        const text = p.text;
        if (i === 0) return `First, ${smartLowercase(text)}`;
        if (i === premises.length - 1) return `Finally, ${smartLowercase(text)}`;
        return `Additionally, ${smartLowercase(text)}`;
      });
      
      parts.push(premiseNarratives.join(" "));
    }
  }
  
  // Add scheme context if requested - weave it naturally into the narrative
  if (scheme && options.includeSchemeReferences) {
    const schemeName = scheme.name || scheme.key.replace(/_/g, " ");
    
    // Create natural scheme references based on material relation
    if (scheme.materialRelation) {
      const relationContexts: Record<string, string> = {
        "cause": `This causal reasoning follows a well-established pattern of inference.`,
        "analogy": `The force of this analogical argument depends on the relevant similarities holding.`,
        "authority": `This appeal to expert authority carries weight insofar as the expertise is relevant and reliable.`,
        "sign": `Reading these signs requires careful attention to the reliability of the indicators.`,
        "definition": `The definitional basis of this argument makes the classification straightforward.`,
        "example": `The generalization from this example invites scrutiny of its representativeness.`,
      };
      
      if (relationContexts[scheme.materialRelation.toLowerCase()]) {
        parts.push(relationContexts[scheme.materialRelation.toLowerCase()]);
      }
    } else if (scheme.description) {
      parts.push(scheme.description);
    }
  }
  
  // Warrant as the inferential license - present naturally
  if (warrant && options.includePremiseStructure !== false) {
    parts.push(`The underlying warrant—the principle that licenses this inference—holds that ${warrant.toLowerCase().replace(/\.$/, "")}.`);
  }
  
  // Critical questions as implicit challenges addressed
  if (scheme && options.includeCriticalQuestions && scheme.cq.length > 0) {
    // Pick 1-2 most relevant CQs and phrase them as natural considerations
    const relevantCQs = scheme.cq.slice(0, 2);
    if (relevantCQs.length > 0) {
      const cqPhrases = relevantCQs.map(cq => {
        // Transform question into a consideration
        const q = cq.text.replace(/\?$/, "").toLowerCase();
        return q;
      });
      
      if (cqPhrases.length === 1) {
        parts.push(`A critical reader might wonder ${cqPhrases[0]}—a legitimate concern that deserves examination.`);
      } else {
        parts.push(`Critical examination of this argument requires considering both ${cqPhrases[0]} and ${cqPhrases[1]}.`);
      }
    }
  }
  
  return parts.join(" ");
}

/**
 * Generate dialectical exchange prose (thesis-antithesis-synthesis)
 * Presents opposing arguments in a natural thesis-antithesis-synthesis structure
 */
function generateDialecticalExchange(
  pair: NarrativeStructure["dialecticalPairs"][0],
  edges: ArgumentChainEdgeWithNodes[],
  options: EssayOptions
): string {
  const parts: string[] = [];
  
  const thesisConclusion = getArgumentConclusion(pair.thesis);
  const thesisScheme = extractSchemeMetadata(pair.thesis);
  
  const antithesisConclusion = getArgumentConclusion(pair.antithesis);
  const antithesisScheme = extractSchemeMetadata(pair.antithesis);
  
  // Find the edge connecting them
  const attackEdge = edges.find(
    e => e.sourceNodeId === pair.antithesis.id && e.targetNodeId === pair.thesis.id
  );
  
  // Varied thesis introductions
  const thesisIntros = [
    "One line of reasoning holds that",
    "According to one perspective,",
    "Proponents of this view argue that",
    "The initial position maintains that",
    "A central argument in this discourse is that",
  ];
  
  // Present the thesis with proper casing
  const thesisText = smartLowercase(thesisConclusion.replace(/\.$/, ""));
  
  // Build scheme context phrase if both elements are meaningful
  let thesisSchemeContext = "";
  if (thesisScheme && options.includeSchemeReferences) {
    const reasoningType = thesisScheme.reasoningType?.toLowerCase();
    const materialRelation = thesisScheme.materialRelation?.toLowerCase();
    
    // Only add scheme reference if we have meaningful distinct values
    if (reasoningType && materialRelation && reasoningType !== materialRelation) {
      thesisSchemeContext = ` This ${reasoningType} reasoning draws upon ${materialRelation}.`;
    } else if (reasoningType) {
      thesisSchemeContext = ` This ${reasoningType} reasoning lends weight to the conclusion.`;
    }
  }
  
  parts.push(`${sample(thesisIntros)} ${thesisText}.${thesisSchemeContext}`);
  
  // Add thesis premises if structured
  if (options.includePremiseStructure && thesisScheme?.premises?.length) {
    const premiseText = thesisScheme.premises.slice(0, 2).join(", and ");
    parts.push(`The reasoning proceeds from the understanding that ${smartLowercase(premiseText)}.`);
  }
  
  // Transition to antithesis with narrative tension
  const attackTransition = attackEdge?.edgeType 
    ? sample(EDGE_NARRATIVE_TRANSITIONS[attackEdge.edgeType] || EDGE_NARRATIVE_TRANSITIONS["REFUTES"])
    : sample(EDGE_NARRATIVE_TRANSITIONS["REFUTES"]);
  
  const antithesisText = smartLowercase(antithesisConclusion.replace(/\.$/, ""));
  parts.push(
    `${attackTransition} ${antithesisText}.` +
    (attackEdge?.description ? ` ${attackEdge.description}` : "")
  );
  
  // Add antithesis reasoning context (improved)
  if (antithesisScheme && options.includeSchemeReferences) {
    const antithesisReasoningType = antithesisScheme.reasoningType?.toLowerCase();
    if (antithesisReasoningType && antithesisReasoningType !== "practical") {
      parts.push(`This ${antithesisReasoningType} argument challenges the original position by introducing competing considerations.`);
    } else {
      parts.push(`This counter-argument challenges the original position by introducing competing considerations.`);
    }
  }
  
  // If there's a synthesis, present the resolution
  if (pair.synthesis) {
    const synthesisConclusion = getArgumentConclusion(pair.synthesis);
    const synthesisText = smartLowercase(synthesisConclusion.replace(/\.$/, ""));
    const resolutionPhrases = [
      `These competing considerations find resolution in the recognition that ${synthesisText}.`,
      `A synthesis emerges: ${synthesisText}.`,
      `Reconciling these perspectives leads to the understanding that ${synthesisText}.`,
      `The tension is resolved through the insight that ${synthesisText}.`,
    ];
    parts.push(sample(resolutionPhrases));
  } else {
    const unresolvedPhrases = [
      "This tension remains a point of ongoing deliberation, reflecting genuine complexity in the subject matter.",
      "The debate continues, with both perspectives offering valuable insights into this multifaceted issue.",
      "This dialectical opposition invites further examination and remains an open question in the discourse.",
    ];
    parts.push(sample(unresolvedPhrases));
  }
  
  return parts.join(" ");
}

/**
 * Generate the logical flow section connecting arguments
 * Creates prose that describes the structural relationships between arguments
 */
function generateLogicalFlow(
  nodes: ArgumentChainNodeWithArgument[],
  edges: ArgumentChainEdgeWithNodes[],
  options: EssayOptions
): string {
  const parts: string[] = [];
  
  // Build adjacency for narrative flow
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // Process edges by type for thematic grouping
  const supportEdges = edges.filter(e => e.edgeType === "SUPPORTS");
  const enableEdges = edges.filter(e => e.edgeType === "ENABLES");
  const presupposesEdges = edges.filter(e => e.edgeType === "PRESUPPOSES");
  const qualifiesEdges = edges.filter(e => e.edgeType === "QUALIFIES");
  
  // Describe support relationships as building blocks (more natural prose)
  if (supportEdges.length > 0) {
    const supportDescriptions: string[] = [];
    
    supportEdges.forEach(edge => {
      const source = nodeMap.get(edge.sourceNodeId);
      const target = nodeMap.get(edge.targetNodeId);
      if (!source || !target) return;
      
      const sourceText = smartLowercase(getArgumentConclusion(source).replace(/\.$/, ""));
      const targetText = smartLowercase(getArgumentConclusion(target).replace(/\.$/, ""));
      
      // Vary the support phrasing
      const supportPhrases = [
        `The recognition that ${sourceText} strengthens the case for ${targetText}`,
        `Evidence that ${sourceText} lends credence to ${targetText}`,
        `The argument that ${sourceText} provides grounding for ${targetText}`,
        `Demonstrating ${sourceText} bolsters the claim that ${targetText}`,
      ];
      
      // Build strength context naturally (ends with period for clean sentence flow)
      const strengthContext = edge.strength && edge.strength > 0.7 
        ? " — a substantial contribution to the overall argument."
        : edge.strength && edge.strength < 0.4 
          ? " — though this support is modest."
          : "";
      
      // Clean edge description and build final sentence
      let description = "";
      if (edge.description) {
        const cleanedDesc = edge.description.replace(/\.+$/, "");
        // If we have strength context, edge description is a new sentence
        description = strengthContext 
          ? ` ${cleanedDesc.charAt(0).toUpperCase() + cleanedDesc.slice(1)}.`
          : `. ${cleanedDesc}.`;
      } else {
        description = strengthContext ? "" : ".";
      }
      
      supportDescriptions.push(
        `${sample(supportPhrases)}${strengthContext}${description}`
      );
    });
    
    if (supportDescriptions.length === 1) {
      parts.push(supportDescriptions[0]);
    } else if (supportDescriptions.length > 1) {
      parts.push(
        `Multiple lines of support converge in this argument structure. ${supportDescriptions.slice(0, 3).join(" Furthermore, ")}`
      );
    }
  }
  
  // Describe enabling relationships (more flowing)
  if (enableEdges.length > 0) {
    const enablePairs = enableEdges.map(edge => {
      const source = nodeMap.get(edge.sourceNodeId);
      const target = nodeMap.get(edge.targetNodeId);
      if (!source || !target) return null;
      
      const sourceText = smartLowercase(getArgumentConclusion(source).replace(/\.$/, ""));
      const targetText = smartLowercase(getArgumentConclusion(target).replace(/\.$/, ""));
      
      return { sourceText, targetText };
    }).filter(Boolean);
    
    if (enablePairs.length === 1) {
      const p = enablePairs[0]!;
      parts.push(
        `Critically, establishing ${p.sourceText} enables the subsequent consideration of ${p.targetText}, creating a logical dependency in the argumentative structure.`
      );
    } else if (enablePairs.length > 1) {
      parts.push(
        `The argumentative structure reveals important dependencies: certain claims must be established before others become viable. ${enablePairs.slice(0, 2).map(p => `Demonstrating ${p!.sourceText} opens the path to ${p!.targetText}`).join("; ")}.`
      );
    }
  }
  
  // Describe presuppositions (more elegant)
  if (presupposesEdges.length > 0) {
    const presupPairs = presupposesEdges.map(edge => {
      const source = nodeMap.get(edge.sourceNodeId);
      const target = nodeMap.get(edge.targetNodeId);
      if (!source || !target) return null;
      return {
        sourceText: smartLowercase(getArgumentConclusion(source).replace(/\.$/, "")),
        targetText: smartLowercase(getArgumentConclusion(target).replace(/\.$/, ""))
      };
    }).filter(Boolean);
    
    if (presupPairs.length > 0) {
      parts.push(
        `Underlying the explicit arguments are foundational presuppositions that structure the discourse. ` +
        `${presupPairs.slice(0, 2).map(p => `The claim that ${p!.sourceText} presupposes ${p!.targetText}`).join("; ")}.`
      );
    }
  }
  
  // Describe qualifications (more nuanced)
  if (qualifiesEdges.length > 0) {
    const qualPairs = qualifiesEdges.map(edge => {
      const source = nodeMap.get(edge.sourceNodeId);
      const target = nodeMap.get(edge.targetNodeId);
      if (!source || !target) return null;
      return {
        sourceText: smartLowercase(getArgumentConclusion(source).replace(/\.$/, "")),
        targetText: smartLowercase(getArgumentConclusion(target).replace(/\.$/, ""))
      };
    }).filter(Boolean);
    
    if (qualPairs.length === 1) {
      const q = qualPairs[0]!;
      parts.push(
        `Importantly, the argument is qualified: ${q.sourceText} introduces conditions that refine our understanding of ${q.targetText}.`
      );
    } else if (qualPairs.length > 1) {
      parts.push(
        `${qualifiesEdges.length} qualifications introduce essential nuance to the argument chain, ensuring the conclusions apply under appropriate conditions and avoiding overgeneralization.`
      );
    }
  }
  
  return parts.join("\n\n");
}

/**
 * Generate conclusion synthesizing the chain
 * Creates a thoughtful conclusion that synthesizes the argumentative journey
 */
function generateEssayConclusion(
  chain: ArgumentChainWithRelations,
  structure: NarrativeStructure,
  options: EssayOptions
): string {
  const parts: string[] = [];
  
  // Varied conclusion openers
  const conclusionOpeners = [
    "The weight of the arguments converges on the conclusion that",
    "Taking stock of the foregoing analysis, the evidence supports the view that",
    "The argumentative journey ultimately leads to the recognition that",
    "Drawing together the threads of this discourse, we arrive at the understanding that",
  ];
  
  // State the main thesis if identified
  if (structure.mainThesis) {
    const thesisText = smartLowercase(getArgumentConclusion(structure.mainThesis).replace(/\.$/, ""));
    parts.push(`${sample(conclusionOpeners)} ${thesisText}.`);
  } else if (structure.resolutionArguments.length > 0) {
    const conclusions = structure.resolutionArguments
      .map(n => smartLowercase(getArgumentConclusion(n).replace(/\.$/, "")))
      .slice(0, 3);
    
    if (conclusions.length === 1) {
      parts.push(`The analysis culminates in the conclusion that ${conclusions[0]}.`);
    } else {
      const conclusionList = conclusions.map((c, i) => 
        i === conclusions.length - 1 ? `and that ${c}` : `that ${c}`
      ).join(", ");
      parts.push(`The analysis reaches several interconnected conclusions: ${conclusionList}.`);
    }
  }
  
  // Acknowledge dialectical complexity
  if (structure.dialecticalPairs.length > 0) {
    const dialecticReflections = [
      `This conclusion emerges from a genuine dialectic. The ${structure.dialecticalPairs.length} point${structure.dialecticalPairs.length > 1 ? "s" : ""} of contestation are not weaknesses but rather evidence that the reasoning has engaged with the strongest available objections.`,
      `The strength of this conclusion is tested by the counterarguments it has weathered. Having navigated ${structure.dialecticalPairs.length} dialectical challenge${structure.dialecticalPairs.length > 1 ? "s" : ""}, the central thesis emerges refined rather than diminished.`,
      `Notably, this position has been forged in the crucible of genuine disagreement. The competing perspectives considered herein have sharpened rather than undermined the central claims.`,
    ];
    parts.push(sample(dialecticReflections));
  }
  
  // Add epistemic humility
  const epistemicClosings = [
    "The strength of these conclusions depends on the soundness of the underlying premises and the validity of the inferential steps that connect them. As with all defeasible reasoning, new evidence or considerations could warrant revision.",
    "These conclusions, while supported by the arguments presented, remain open to revision in light of new evidence or stronger counterarguments. This tentativeness is a feature, not a bug, of rational inquiry.",
    "The conclusions reached here should be held with appropriate epistemic humility. The arguments provide reasons for belief, not proof beyond doubt, and the discourse remains open to further development.",
  ];
  parts.push(sample(epistemicClosings));
  
  return parts.join("\n\n");
}

// ===== Main Essay Generation Function =====

/**
 * Generate a complete essay from an argument chain
 */
export function generateEssay(
  chain: ArgumentChainWithRelations,
  options: EssayOptions = {}
): EssayResult {
  const {
    tone = "deliberative",
    audienceLevel = "informed",
    includeSchemeReferences = true,
    includeCriticalQuestions = true,
    includePremiseStructure = true,
    includeDialectic = true,
    structureByScopes = true,
    handleNestedScopes = true,
  } = options;
  
  const nodes = chain.nodes || [];
  const edges = chain.edges || [];
  const scopes = (chain as any).scopes || [];
  
  // Phase C: Group nodes by scope
  const { mainNodes, scopeSections } = structureByScopes 
    ? groupNodesForEssay(nodes, scopes)
    : { mainNodes: nodes, scopeSections: [] };
  
  // Analyze structure for narrative arc (using main nodes for structure)
  const structure = analyzeNarrativeStructure(mainNodes, edges);
  
  // Generate essay sections
  const opening = generateOpening(chain, structure, options);
  
  // Phase C: Add scope overview to opening if scopes exist
  let enhancedOpening = opening;
  if (structureByScopes && scopeSections.length > 0) {
    const scopeOverview = generateScopeOverview(scopeSections);
    enhancedOpening = `${opening}\n\n${scopeOverview}`;
  }
  
  // Main body: arguments woven together
  const bodyParts: string[] = [];
  
  // First, present opening arguments (from main/unscoped nodes)
  const unscopedOpening = structure.openingArguments.filter(n => !(n as any).scopeId);
  if (unscopedOpening.length > 0) {
    unscopedOpening.forEach(node => {
      const scheme = extractSchemeMetadata(node);
      const premises = getArgumentPremises(node);
      const warrant = getImplicitWarrant(node);
      bodyParts.push(generateArgumentProse(node, scheme, premises, warrant, options));
    });
  }
  
  // Present dialectical exchanges if any (from main/unscoped nodes)
  if (includeDialectic && structure.dialecticalPairs.length > 0) {
    const unscopedPairs = structure.dialecticalPairs.filter(
      p => !(p.thesis as any).scopeId && !(p.antithesis as any).scopeId
    );
    if (unscopedPairs.length > 0) {
      bodyParts.push("\n---\n"); // Thematic break
      unscopedPairs.forEach(pair => {
        bodyParts.push(generateDialecticalExchange(pair, edges, options));
      });
    }
  }
  
  // Present developing arguments (from main/unscoped nodes)
  if (structure.developingArguments.length > 0) {
    const developingNodes = structure.developingArguments
      .filter(n => !(n as any).scopeId)
      .filter(n => !structure.dialecticalPairs.some(
        p => p.thesis.id === n.id || p.antithesis.id === n.id
      ));
    
    developingNodes.forEach(node => {
      const scheme = extractSchemeMetadata(node);
      const premises = getArgumentPremises(node);
      const warrant = getImplicitWarrant(node);
      bodyParts.push(generateArgumentProse(node, scheme, premises, warrant, options));
    });
  }
  
  // Present resolution arguments (from main/unscoped nodes)
  if (structure.resolutionArguments.length > 0) {
    const resolutionNodes = structure.resolutionArguments
      .filter(n => !(n as any).scopeId)
      .filter(n => !structure.dialecticalPairs.some(p => p.synthesis?.id === n.id));
    
    resolutionNodes.forEach(node => {
      const scheme = extractSchemeMetadata(node);
      const premises = getArgumentPremises(node);
      const warrant = getImplicitWarrant(node);
      bodyParts.push(generateArgumentProse(node, scheme, premises, warrant, options));
    });
  }
  
  // Phase C: Generate scope sections
  if (structureByScopes && scopeSections.length > 0) {
    bodyParts.push("\n---\n"); // Section break before scopes
    const nodeIndex = { current: mainNodes.length };
    
    scopeSections.forEach(scope => {
      const scopeContent = generateScopeEssaySection(scope, options, nodeIndex);
      bodyParts.push(scopeContent);
    });
  }
  
  // Logical flow analysis (optional section)
  const logicalFlow = generateLogicalFlow(nodes, edges, options);
  
  // Essay conclusion
  const conclusion = generateEssayConclusion(chain, structure, options);
  
  // Phase C: Enhance conclusion with scope summary
  let enhancedConclusion = conclusion;
  if (structureByScopes && scopeSections.length > 0) {
    enhancedConclusion = `${conclusion}\n\n${generateScopeConclusion(scopeSections)}`;
  }
  
  // Compose full text
  const title = chain.name || "Argument Analysis";
  const abstract = chain.description || 
    `An analysis of ${nodes.length} interconnected arguments examining ${chain.purpose || "the matter at hand"}.`;
  
  const body = [
    ...bodyParts,
    logicalFlow ? `\n---\n\n${logicalFlow}` : "",
  ].filter(Boolean).join("\n\n");
  
  const fullText = [
    `# ${title}`,
    "",
    `*${abstract}*`,
    "",
    "---",
    "",
    enhancedOpening,
    "",
    body,
    "",
    "---",
    "",
    enhancedConclusion,
  ].join("\n");
  
  // Count words
  const wordCount = fullText.split(/\s+/).length;
  
  // Count unique schemes
  const schemeKeys = new Set(
    nodes
      .map(n => extractSchemeMetadata(n)?.key)
      .filter(Boolean)
  );
  
  return {
    title,
    abstract,
    body,
    fullText,
    wordCount,
    metadata: {
      chainId: chain.id,
      argumentCount: nodes.length,
      schemeCount: schemeKeys.size,
      dialecticalMoves: structure.dialecticalPairs.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Generate essay as plain text (no markdown)
 */
export function generateEssayText(
  chain: ArgumentChainWithRelations,
  options?: EssayOptions
): string {
  const result = generateEssay(chain, options);
  // Strip markdown formatting
  return result.fullText
    .replace(/^# /gm, "")
    .replace(/^\*([^*]+)\*$/gm, "$1")
    .replace(/^---$/gm, "")
    .replace(/\n{3,}/g, "\n\n");
}
