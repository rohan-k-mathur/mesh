/**
 * Enhanced Markdown Formatter for Argument Chains
 * Provides rich markdown formatting with frontmatter, ToC, badges, and cross-references
 */

import { Node, Edge } from "reactflow";
import { ChainNodeData, ChainEdgeData } from "@/lib/types/argumentChain";
import type { SortedNode } from "./narrativeGenerator";

export interface MarkdownOptions {
  includeToC?: boolean; // Auto-enabled for chains >10 nodes
  includeFrontmatter?: boolean;
  includeStatistics?: boolean;
  numberingStyle?: "sequential" | "hierarchical"; // 1,2,3 vs 1.1, 1.2
  includeCitations?: boolean;
  includeSchemeDetails?: boolean;
}

/**
 * Escape markdown special characters in text
 */
function escapeMarkdown(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/\_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/\-/g, "\\-")
    .replace(/\./g, "\\.")
    .replace(/\!/g, "\\!");
}

/**
 * Generate YAML frontmatter
 */
function generateFrontmatter(
  chainName: string | undefined,
  nodeCount: number,
  edgeCount: number
): string {
  const date = new Date().toISOString().split("T")[0];
  const timestamp = new Date().toISOString();
  
  return `---
title: "${chainName || "Argument Chain"}"
type: argument-chain-narrative
generated: ${date}
timestamp: ${timestamp}
statistics:
  nodes: ${nodeCount}
  edges: ${edgeCount}
  structure: ${edgeCount === 0 ? "disconnected" : "linked"}
format: markdown
version: 1.0.0
---

`;
}

/**
 * Generate table of contents with anchor links
 */
function generateToC(sortedNodes: SortedNode[], mainChainOnly: boolean = true): string {
  const nodes = mainChainOnly ? sortedNodes.filter(sn => sn.depth >= 0) : sortedNodes;
  
  if (nodes.length <= 10) {
    return ""; // Skip ToC for short chains
  }

  let toc = "## Table of Contents\n\n";
  
  nodes.forEach((sortedNode, idx) => {
    const { node } = sortedNode;
    const schemeName = node.data.argument?.argumentSchemes?.[0]?.scheme?.name || "General";
    const argumentText = node.data.argument?.text || "Untitled";
    const preview = argumentText.length > 60 ? argumentText.substring(0, 60) + "..." : argumentText;
    const anchor = `argument-${idx + 1}`;
    
    toc += `${idx + 1}. [Argument ${idx + 1}: ${preview}](#${anchor})\n`;
  });

  toc += "\n---\n\n";
  
  return toc;
}

/**
 * Generate confidence/strength badge
 */
function generateConfidenceBadge(confidence?: number): string {
  if (!confidence || confidence === undefined) {
    return "";
  }

  let level: string;
  let color: string;
  
  if (confidence >= 0.8) {
    level = "High";
    color = "brightgreen";
  } else if (confidence >= 0.5) {
    level = "Medium";
    color = "yellow";
  } else {
    level = "Low";
    color = "orange";
  }

  // Using shields.io style badge syntax (renders on GitHub)
  return `![Confidence: ${level}](https://img.shields.io/badge/confidence-${level}-${color})`;
}

/**
 * Format premises as markdown list
 */
function formatPremises(argument: any): string {
  // Try to extract premises from argument structure
  const premises: string[] = [];
  
  // Check if argument has explicit premises
  if (argument.argumentPremises && Array.isArray(argument.argumentPremises)) {
    argument.argumentPremises.forEach((premise: any) => {
      const claimText = premise.claim?.text || premise.text;
      if (claimText) {
        const isAxiom = premise.isAxiom;
        premises.push(`- ${isAxiom ? "**[Axiom]** " : ""}${claimText}`);
      }
    });
  }

  return premises.length > 0 ? `\n**Premises:**\n${premises.join("\n")}\n` : "";
}

/**
 * Format conclusion as blockquote
 */
function formatConclusion(argument: any): string {
  const conclusionText = argument.conclusionClaim?.text || argument.text;
  
  if (!conclusionText) {
    return "";
  }

  return `\n> **Conclusion:** ${conclusionText}\n`;
}

/**
 * Get the best text representation for an argument
 * Falls back through: argument.text → conclusionClaim.text → "Untitled argument"
 */
function getArgumentDisplayText(argument: any): string {
  // First try argument text
  if (argument?.text && argument.text.trim() !== "") {
    return argument.text;
  }
  
  // Fall back to conclusion claim text
  if (argument?.conclusionClaim?.text && argument.conclusionClaim.text.trim() !== "") {
    return argument.conclusionClaim.text;
  }
  
  return "Untitled argument";
}

/**
 * Get scheme metadata
 */
function getSchemeMetadata(argument: any): {
  name: string | null;
  type: string | null;
  confidence: number | null;
} {
  const scheme = argument?.argumentSchemes?.[0];
  
  return {
    name: scheme?.scheme?.name || null,
    type: scheme?.scheme?.reasoningType || null,
    confidence: scheme?.confidence || null
  };
}

/**
 * Format a single node as enhanced markdown
 */
export function formatNodeAsMarkdown(
  sortedNode: SortedNode,
  options: MarkdownOptions
): string {
  const { node, position, depth } = sortedNode;
  const { argument } = node.data;
  
  if (!argument) {
    return `## Argument ${position + 1}\n\n*No argument data available*\n\n---\n\n`;
  }

  const { name: schemeName, type: schemeType, confidence } = getSchemeMetadata(argument);
  const argumentText = getArgumentDisplayText(argument);
  const anchor = `argument-${position + 1}`;
  
  let markdown = "";

  // Heading with anchor
  markdown += `<a id="${anchor}"></a>\n\n`;
  markdown += `## Argument ${position + 1}`;
  
  if (schemeName && options.includeSchemeDetails) {
    markdown += ` — *${schemeName}*`;
  }
  
  markdown += "\n\n";

  // Confidence badge
  if (confidence && options.includeSchemeDetails) {
    markdown += `${generateConfidenceBadge(confidence)} `;
  }

  // Scheme type badge
  if (schemeType && options.includeSchemeDetails) {
    markdown += `\`${schemeType}\``;
  }

  if ((confidence || schemeType) && options.includeSchemeDetails) {
    markdown += "\n\n";
  }

  // Main argument text
  markdown += `${argumentText}\n`;

  // Premises (if available and detail level is high)
  if (options.includeSchemeDetails) {
    const premises = formatPremises(argument);
    if (premises) {
      markdown += premises;
    }
  }

  // Conclusion as blockquote
  if (options.includeSchemeDetails && argument.conclusionClaim) {
    markdown += formatConclusion(argument);
  }

  // Scheme details section
  if (schemeName && options.includeSchemeDetails) {
    markdown += `\n**Reasoning Pattern:** ${schemeName}`;
    
    if (schemeType) {
      markdown += ` (${schemeType})`;
    }
    
    markdown += "\n";
  }

  // Depth indicator for hierarchical structures
  if (depth > 0 && options.numberingStyle === "hierarchical") {
    markdown += `\n*Depth: ${depth}*\n`;
  }

  markdown += "\n---\n\n";

  return markdown;
}

/**
 * Generate statistics section
 */
function generateStatistics(
  nodeCount: number,
  edgeCount: number,
  sortedNodes: SortedNode[]
): string {
  const mainChain = sortedNodes.filter(sn => sn.depth >= 0);
  const orphans = sortedNodes.filter(sn => sn.depth < 0);
  const maxDepth = Math.max(...sortedNodes.map(sn => sn.depth), 0);
  
  // Count scheme types
  const schemeTypes = new Map<string, number>();
  sortedNodes.forEach(sn => {
    const schemeName = sn.node.data.argument?.argumentSchemes?.[0]?.scheme?.name;
    if (schemeName) {
      schemeTypes.set(schemeName, (schemeTypes.get(schemeName) || 0) + 1);
    }
  });

  let stats = "## Chain Statistics\n\n";
  stats += `| Metric | Value |\n`;
  stats += `|--------|-------|\n`;
  stats += `| Total Arguments | ${nodeCount} |\n`;
  stats += `| Total Connections | ${edgeCount} |\n`;
  stats += `| Main Chain | ${mainChain.length} arguments |\n`;
  stats += `| Disconnected Claims | ${orphans.length} |\n`;
  stats += `| Maximum Depth | ${maxDepth} levels |\n`;
  stats += `| Unique Schemes | ${schemeTypes.size} types |\n`;

  if (schemeTypes.size > 0) {
    stats += "\n### Reasoning Patterns Used\n\n";
    const sortedSchemes = Array.from(schemeTypes.entries()).sort((a, b) => b[1] - a[1]);
    sortedSchemes.forEach(([scheme, count]) => {
      stats += `- **${scheme}**: ${count} argument${count > 1 ? "s" : ""}\n`;
    });
  }

  stats += "\n---\n\n";

  return stats;
}

/**
 * Generate orphan nodes section (enhanced)
 */
function generateOrphansSection(orphans: SortedNode[]): string {
  if (orphans.length === 0) {
    return "";
  }

  let section = "## Additional Claims\n\n";
  section += "*The following claims are not connected to the main argument chain:*\n\n";

  orphans.forEach((sortedNode, idx) => {
    const text = getArgumentDisplayText(sortedNode.node.data.argument);
    const schemeName = sortedNode.node.data.argument?.argumentSchemes?.[0]?.scheme?.name;
    
    section += `${idx + 1}. ${text}`;
    
    if (schemeName) {
      section += ` — *${schemeName}*`;
    }
    
    section += "\n";
  });

  return "\n" + section;
}

/**
 * Edge type descriptions for narrative
 */
const EDGE_TYPE_LABELS: Record<string, string> = {
  SUPPORTS: "supports",
  ENABLES: "enables",
  PRESUPPOSES: "presupposes",
  REFUTES: "refutes",
  QUALIFIES: "qualifies",
  EXEMPLIFIES: "exemplifies",
  GENERALIZES: "generalizes",
};

/**
 * Generate edge relationships section
 */
function generateEdgeRelationships(
  edges: Edge<ChainEdgeData>[],
  sortedNodes: SortedNode[]
): string {
  if (edges.length === 0) {
    return "";
  }

  // Create a position map for node IDs
  const nodePositionMap = new Map<string, number>();
  sortedNodes.forEach((sn, idx) => {
    nodePositionMap.set(sn.node.id, idx + 1);
  });

  // Create a role map for node IDs
  const nodeRoleMap = new Map<string, string>();
  sortedNodes.forEach((sn) => {
    const role = sn.node.data.role || "CLAIM";
    nodeRoleMap.set(sn.node.id, role);
  });

  let section = "## Argument Relationships\n\n";
  section += "*How the arguments connect to form the reasoning chain:*\n\n";

  edges.forEach((edge, idx) => {
    const sourcePos = nodePositionMap.get(edge.source);
    const targetPos = nodePositionMap.get(edge.target);
    const sourceRole = nodeRoleMap.get(edge.source) || "CLAIM";
    const targetRole = nodeRoleMap.get(edge.target) || "CLAIM";
    
    const edgeType = edge.data?.edgeType || "SUPPORTS";
    const edgeLabel = EDGE_TYPE_LABELS[edgeType] || edgeType.toLowerCase();
    const strength = edge.data?.strength;
    
    if (sourcePos && targetPos) {
      section += `${idx + 1}. **Argument ${sourcePos}** (${sourceRole}) `;
      section += `**${edgeLabel}** `;
      section += `**Argument ${targetPos}** (${targetRole})`;
      
      if (strength && strength < 1) {
        section += ` — *strength: ${Math.round(strength * 100)}%*`;
      }
      
      if (edge.data?.description) {
        section += `\n   > ${edge.data.description}`;
      }
      
      section += "\n";
    }
  });

  section += "\n---\n\n";

  return section;
}

/**
 * Generate full enhanced markdown document
 */
export function generateEnhancedMarkdown(
  nodes: Node<ChainNodeData>[],
  edges: Edge<ChainEdgeData>[],
  sortedNodes: SortedNode[],
  chainName?: string,
  options: MarkdownOptions = {}
): string {
  // Set defaults
  const opts: Required<MarkdownOptions> = {
    includeToC: options.includeToC ?? (nodes.length > 10),
    includeFrontmatter: options.includeFrontmatter ?? true,
    includeStatistics: options.includeStatistics ?? true,
    numberingStyle: options.numberingStyle || "sequential",
    includeCitations: options.includeCitations ?? false,
    includeSchemeDetails: options.includeSchemeDetails ?? true
  };

  let markdown = "";

  // Frontmatter
  if (opts.includeFrontmatter) {
    markdown += generateFrontmatter(chainName, nodes.length, edges.length);
  }

  // Title
  markdown += `# ${chainName || "Argument Chain"}\n\n`;
  markdown += `*A structured narrative of connected reasoning*\n\n`;

  // Table of Contents
  if (opts.includeToC) {
    markdown += generateToC(sortedNodes);
  }

  // Statistics
  if (opts.includeStatistics) {
    markdown += generateStatistics(nodes.length, edges.length, sortedNodes);
  }

  // Main content section
  markdown += "## Arguments\n\n";

  // Separate main chain from orphans
  const mainChain = sortedNodes.filter(sn => sn.depth >= 0);
  const orphans = sortedNodes.filter(sn => sn.depth < 0);

  // Format each node
  mainChain.forEach(sortedNode => {
    markdown += formatNodeAsMarkdown(sortedNode, opts);
  });

  // Edge relationships section (after arguments, before orphans)
  if (edges.length > 0) {
    markdown += generateEdgeRelationships(edges, sortedNodes);
  }

  // Orphans section
  markdown += generateOrphansSection(orphans);

  // Footer
  markdown += "\n\n---\n\n";
  markdown += `*Generated on ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long", 
    day: "numeric"
  })}*\n`;

  return markdown.trim();
}
