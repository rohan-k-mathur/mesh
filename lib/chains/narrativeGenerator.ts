/**
 * Argument Chain Narrative Generator
 * Converts formal AIF/ASPIC+ argument chains into human-readable narratives
 */

import { Node, Edge } from "reactflow";
import { ChainNodeData, ChainEdgeData } from "@/lib/types/argumentChain";
import { generateEnhancedMarkdown, MarkdownOptions } from "./markdownFormatter";

// ===== Types =====

export interface NarrativeOptions {
  format?: "text" | "markdown";
  includeMetadata?: boolean;
  tone?: "formal" | "conversational" | "academic" | "legal";
  detailLevel?: "brief" | "standard" | "detailed";
  // Markdown-specific options
  markdownOptions?: MarkdownOptions;
}

export interface NarrativeResult {
  text: string;
  metadata: {
    nodeCount: number;
    edgeCount: number;
    generatedAt: string;
    format: string;
  };
}

export interface SortedNode {
  node: Node<ChainNodeData>;
  depth: number;
  position: number;
}

// ===== Scheme Templates =====

const SCHEME_TEMPLATES: Record<string, {
  pattern: string;
  transition: string;
  description: string;
}> = {
  // Modus Ponens (MP)
  "modus_ponens": {
    pattern: "If {premise1}, and {premise2}, then {conclusion}",
    transition: "Given that",
    description: "deductive inference"
  },
  "mp": {
    pattern: "If {premise1}, and {premise2}, then {conclusion}",
    transition: "Given that",
    description: "deductive inference"
  },

  // Expert Opinion / Authority
  "expert_opinion": {
    pattern: "{expert} states that {claim}, therefore {conclusion}",
    transition: "According to expert testimony",
    description: "argument from authority"
  },
  "argument_from_expert_opinion": {
    pattern: "{expert} states that {claim}, therefore {conclusion}",
    transition: "According to expert testimony",
    description: "argument from authority"
  },
  "position_to_know": {
    pattern: "{source} is in a position to know about {domain}, and asserts {claim}",
    transition: "Based on authoritative knowledge",
    description: "argument from position to know"
  },

  // Causal Reasoning
  "causal_reasoning": {
    pattern: "Because {cause}, we observe {effect}",
    transition: "Through causal analysis",
    description: "causal argument"
  },
  "cause_to_effect": {
    pattern: "{cause} leads to {effect}",
    transition: "By causal inference",
    description: "cause-to-effect reasoning"
  },

  // Practical Reasoning
  "practical_reasoning": {
    pattern: "To achieve {goal}, we should {action}",
    transition: "From practical considerations",
    description: "means-end reasoning"
  },
  "instrumental_reasoning": {
    pattern: "To accomplish {end}, we must employ {means}",
    transition: "By instrumental reasoning",
    description: "means-end argument"
  },

  // Analogy
  "argument_from_analogy": {
    pattern: "{source} is like {target} in that {similarity}, so {conclusion}",
    transition: "By analogy",
    description: "analogical reasoning"
  },
  "analogy": {
    pattern: "Just as {source} exhibits {property}, so does {target}",
    transition: "By analogical reasoning",
    description: "argument from analogy"
  },

  // Sign
  "argument_from_sign": {
    pattern: "{sign} is an indicator of {conclusion}",
    transition: "From observable signs",
    description: "abductive inference"
  },

  // Consequence
  "argument_from_consequences": {
    pattern: "If we adopt {action}, then {consequence} will follow",
    transition: "Considering consequences",
    description: "consequentialist reasoning"
  },

  // Popular Opinion
  "argument_from_popular_opinion": {
    pattern: "Most people believe {claim}, therefore {conclusion}",
    transition: "Based on popular consensus",
    description: "argument from consensus"
  },

  // Commitment
  "argument_from_commitment": {
    pattern: "{agent} is committed to {position}, therefore they should accept {conclusion}",
    transition: "From prior commitments",
    description: "argument from consistency"
  },

  // Default fallback
  "default": {
    pattern: "{premises} support {conclusion}",
    transition: "Furthermore",
    description: "general inference"
  }
};

// ===== Helper Functions =====

/**
 * Perform topological sort on argument chain nodes
 * Returns nodes ordered by dependency (premises before conclusions)
 */
function topologicalSort(
  nodes: Node<ChainNodeData>[],
  edges: Edge<ChainEdgeData>[]
): SortedNode[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();
  const visited = new Set<string>();
  const sorted: SortedNode[] = [];

  // Initialize
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
  });

  // Build graph
  edges.forEach(edge => {
    const from = edge.source;
    const to = edge.target;
    adjacencyList.get(from)?.push(to);
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
  });

  // Find root nodes (no incoming edges)
  const queue: Array<{ id: string; depth: number }> = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push({ id: nodeId, depth: 0 });
    }
  });

  // If no roots found (cycle or disconnected), start with first node
  if (queue.length === 0 && nodes.length > 0) {
    queue.push({ id: nodes[0].id, depth: 0 });
  }

  let position = 0;

  // BFS traversal
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    
    if (visited.has(id)) continue; // Avoid cycles
    visited.add(id);

    const node = nodeMap.get(id);
    if (node) {
      sorted.push({ node, depth, position: position++ });
    }

    const neighbors = adjacencyList.get(id) || [];
    neighbors.forEach(neighborId => {
      const newDegree = (inDegree.get(neighborId) || 0) - 1;
      inDegree.set(neighborId, newDegree);
      
      if (newDegree === 0 && !visited.has(neighborId)) {
        queue.push({ id: neighborId, depth: depth + 1 });
      }
    });
  }

  // Handle orphan nodes (not reached in traversal)
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      sorted.push({ node, depth: -1, position: position++ });
    }
  });

  return sorted;
}

/**
 * Get transition phrase for a scheme
 */
function getTransitionPhrase(schemeName: string | null | undefined, position: number): string {
  if (position === 0) {
    return ""; // No transition for first argument
  }

  if (!schemeName) {
    return "Additionally, ";
  }

  const schemeKey = schemeName.toLowerCase().replace(/\s+/g, "_");
  const template = SCHEME_TEMPLATES[schemeKey] || SCHEME_TEMPLATES["default"];
  
  return `${template.transition}, `;
}

/**
 * Get scheme description for metadata
 */
function getSchemeDescription(schemeName: string | null | undefined): string {
  if (!schemeName) {
    return "general inference";
  }

  const schemeKey = schemeName.toLowerCase().replace(/\s+/g, "_");
  const template = SCHEME_TEMPLATES[schemeKey] || SCHEME_TEMPLATES["default"];
  
  return template.description;
}

/**
 * Get the best text representation for an argument
 * Falls back through: argument.text → conclusion.text → "Untitled argument"
 */
function getArgumentDisplayText(argument: any): string {
  // First try argument text
  if (argument?.text && argument.text.trim() !== "") {
    return argument.text;
  }
  
  // Fall back to conclusion claim text
  if (argument?.conclusion?.text && argument.conclusion.text.trim() !== "") {
    return argument.conclusion.text;
  }
  
  return "Untitled argument";
}

/**
 * Edge type labels for plain text
 */
const EDGE_TYPE_LABELS_TEXT: Record<string, string> = {
  SUPPORTS: "supports",
  ENABLES: "enables",
  PRESUPPOSES: "presupposes",
  REFUTES: "refutes",
  QUALIFIES: "qualifies",
  EXEMPLIFIES: "exemplifies",
  GENERALIZES: "generalizes",
};

/**
 * Format a single argument node as enhanced plain text
 */
function formatNodeEnhanced(
  sortedNode: SortedNode,
  options: NarrativeOptions
): string {
  const { node, position } = sortedNode;
  const { argument, role } = node.data;
  
  const argumentText = getArgumentDisplayText(argument);
  const schemeName = argument?.argumentSchemes?.[0]?.scheme?.name || null;
  const schemeType = argument?.argumentSchemes?.[0]?.scheme?.reasoningType || null;
  const roleLabel = role ? `[${role}]` : "";
  
  // Get transition phrase
  const transition = getTransitionPhrase(schemeName, position);
  
  // Format based on detail level
  if (options.detailLevel === "brief") {
    return `${transition}${argumentText}`;
  }
  
  // Build enhanced plain text
  let text = "";
  
  // Header with position and role
  text += `─────────────────────────────────────────\n`;
  text += `ARGUMENT ${position + 1}`;
  if (roleLabel) {
    text += ` ${roleLabel}`;
  }
  if (schemeName) {
    text += ` — ${schemeName}`;
  }
  text += `\n`;
  text += `─────────────────────────────────────────\n\n`;
  
  // Main argument text
  text += `${argumentText}\n`;
  
  // Scheme details for detailed mode
  if (options.detailLevel === "detailed" && (schemeName || schemeType)) {
    text += `\n`;
    if (schemeName) {
      text += `  Reasoning Pattern: ${schemeName}`;
      if (schemeType) {
        text += ` (${schemeType})`;
      }
      text += `\n`;
    }
  }
  
  return text;
}

/**
 * Generate edge relationships section for plain text
 */
function generateEdgeRelationshipsText(
  edges: Edge<ChainEdgeData>[],
  sortedNodes: SortedNode[]
): string {
  if (edges.length === 0) {
    return "";
  }

  // Create maps for node positions and roles
  const nodePositionMap = new Map<string, number>();
  const nodeRoleMap = new Map<string, string>();
  sortedNodes.forEach((sn, idx) => {
    nodePositionMap.set(sn.node.id, idx + 1);
    nodeRoleMap.set(sn.node.id, sn.node.data.role || "CLAIM");
  });

  let section = "\n═══════════════════════════════════════════\n";
  section += "ARGUMENT RELATIONSHIPS\n";
  section += "═══════════════════════════════════════════\n\n";
  section += "How the arguments connect:\n\n";

  edges.forEach((edge, idx) => {
    const sourcePos = nodePositionMap.get(edge.source);
    const targetPos = nodePositionMap.get(edge.target);
    const sourceRole = nodeRoleMap.get(edge.source) || "CLAIM";
    const targetRole = nodeRoleMap.get(edge.target) || "CLAIM";
    
    const edgeType = edge.data?.edgeType || "SUPPORTS";
    const edgeLabel = EDGE_TYPE_LABELS_TEXT[edgeType] || edgeType.toLowerCase();
    const strength = edge.data?.strength;
    
    if (sourcePos && targetPos) {
      section += `  ${idx + 1}. Argument ${sourcePos} (${sourceRole}) ${edgeLabel} Argument ${targetPos} (${targetRole})`;
      
      if (strength && strength < 1) {
        section += ` [${Math.round(strength * 100)}% strength]`;
      }
      
      section += `\n`;
      
      if (edge.data?.description) {
        section += `     → "${edge.data.description}"\n`;
      }
    }
  });

  return section;
}

/**
 * Format a single argument node as text
 */
function formatNode(
  sortedNode: SortedNode,
  options: NarrativeOptions
): string {
  const { node, position } = sortedNode;
  const { argument, nodeOrder } = node.data;
  
  const argumentText = getArgumentDisplayText(argument);
  const schemeName = argument?.argumentSchemes?.[0]?.scheme?.name || null;
  
  // Get transition phrase
  const transition = getTransitionPhrase(schemeName, position);
  
  // Format based on detail level
  if (options.detailLevel === "brief") {
    // Brief: just the conclusion
    return `${transition}${argumentText}`;
  }
  
  // Standard/detailed: include scheme info
  const schemeDesc = getSchemeDescription(schemeName);
  const prefix = position === 0 ? "First" : `Next`;
  
  if (options.format === "markdown") {
    return `## Argument ${position + 1}${schemeName ? ` (${schemeName})` : ""}\n\n${argumentText}\n\n*Reasoning type: ${schemeDesc}*`;
  }
  
  // Plain text
  if (options.detailLevel === "detailed") {
    return `${transition}argument ${position + 1} employs ${schemeDesc}: ${argumentText}`;
  }
  
  return `${transition}${argumentText}`;
}

/**
 * Generate metadata section
 */
function generateMetadata(
  nodeCount: number,
  edgeCount: number,
  chainName: string | undefined,
  options: NarrativeOptions
): string {
  if (!options.includeMetadata) {
    return "";
  }

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  if (options.format === "markdown") {
    return `---
title: ${chainName || "Argument Chain"}
generated: ${date}
nodes: ${nodeCount}
edges: ${edgeCount}
format: narrative
---

# ${chainName || "Argument Chain"}

*Generated on ${date}*

**Chain Statistics:**
- Total arguments: ${nodeCount}
- Total connections: ${edgeCount}
- Structure: ${edgeCount === 0 ? "Disconnected claims" : "Linked reasoning"}

---

`;
  }

  // Enhanced plain text header
  let header = "";
  header += `╔═══════════════════════════════════════════╗\n`;
  header += `║  ${(chainName || "ARGUMENT CHAIN").toUpperCase().padEnd(39)}║\n`;
  header += `╚═══════════════════════════════════════════╝\n\n`;
  header += `Generated: ${date}\n`;
  header += `Statistics: ${nodeCount} arguments, ${edgeCount} connections\n`;
  header += `Structure: ${edgeCount === 0 ? "Disconnected claims" : "Linked reasoning chain"}\n\n`;
  
  return header;
}

/**
 * Generate orphan nodes section
 */
function generateOrphansSection(
  orphans: SortedNode[],
  options: NarrativeOptions
): string {
  if (orphans.length === 0) {
    return "";
  }

  const orphanTexts = orphans.map((sortedNode, idx) => {
    const text = sortedNode.node.data.argument?.text || "Untitled claim";
    if (options.format === "markdown") {
      return `- ${text}`;
    }
    return `  - ${text}`;
  });

  if (options.format === "markdown") {
    return `\n\n## Additional Claims\n\nThe following claims are not connected to the main argument chain:\n\n${orphanTexts.join("\n")}`;
  }

  return `\n\nAdditional Claims (not connected to main chain):\n${orphanTexts.join("\n")}`;
}

// ===== Main Export Function =====

/**
 * Generate a natural language narrative from an argument chain
 * 
 * @param nodes - ReactFlow nodes with argument data
 * @param edges - ReactFlow edges with connection data
 * @param chainName - Optional name for the chain
 * @param options - Formatting and style options
 * @returns Generated narrative with metadata
 */
export function generateNarrative(
  nodes: Node<ChainNodeData>[],
  edges: Edge<ChainEdgeData>[],
  chainName?: string,
  options: NarrativeOptions = {}
): NarrativeResult {
  // Set defaults
  const opts: NarrativeOptions = {
    format: options.format || "text",
    includeMetadata: options.includeMetadata ?? true,
    tone: options.tone || "formal",
    detailLevel: options.detailLevel || "standard",
    markdownOptions: options.markdownOptions || {}
  };

  // Handle empty chain
  if (nodes.length === 0) {
    return {
      text: "No arguments in this chain.",
      metadata: {
        nodeCount: 0,
        edgeCount: 0,
        generatedAt: new Date().toISOString(),
        format: opts.format!
      }
    };
  }

  // Sort nodes topologically
  const sortedNodes = topologicalSort(nodes, edges);
  
  // If markdown format, use enhanced formatter
  if (opts.format === "markdown") {
    const markdown = generateEnhancedMarkdown(
      nodes,
      edges,
      sortedNodes,
      chainName,
      opts.markdownOptions
    );

    return {
      text: markdown,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        generatedAt: new Date().toISOString(),
        format: "markdown"
      }
    };
  }

  // Plain text format (enhanced logic)
  // Separate main chain from orphans
  const mainChain = sortedNodes.filter(sn => sn.depth >= 0);
  const orphans = sortedNodes.filter(sn => sn.depth < 0);

  // Generate metadata section
  const metadata = generateMetadata(nodes.length, edges.length, chainName, opts);

  // Format each node with enhanced formatting
  const narrativeParts = mainChain.map(sortedNode => 
    opts.detailLevel === "brief" 
      ? formatNode(sortedNode, opts)
      : formatNodeEnhanced(sortedNode, opts)
  );

  // Generate edge relationships section
  const edgeRelationships = opts.detailLevel !== "brief" 
    ? generateEdgeRelationshipsText(edges, sortedNodes)
    : "";

  // Add orphans section
  const orphansSection = generateOrphansSection(orphans, opts);

  // Combine all parts
  let narrative = metadata;
  
  if (opts.detailLevel === "brief") {
    narrative += narrativeParts.join(". ");
  } else {
    narrative += narrativeParts.join("\n");
  }
  
  narrative += edgeRelationships;
  narrative += orphansSection;

  // Add concluding remark for formal tone
  if (opts.tone === "formal" && mainChain.length > 1) {
    narrative += "\n\n═══════════════════════════════════════════\n";
    narrative += "This completes the argument chain.\n";
  }

  return {
    text: narrative.trim(),
    metadata: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      generatedAt: new Date().toISOString(),
      format: opts.format!
    }
  };
}

/**
 * Export narrative to clipboard
 */
export async function copyNarrativeToClipboard(narrative: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(narrative);
    return true;
  } catch (error) {
    console.error("Failed to copy narrative to clipboard:", error);
    return false;
  }
}
