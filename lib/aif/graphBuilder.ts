/**
 * AIF Graph Builder
 * Constructs an in-memory RDF graph from Mesh argumentation schemes
 */

import {
  AIFExportGraph,
  AIFTriple,
  SchemeWithRelations,
  AIFMappedScheme,
  AIFMappedQuestion,
} from "./ontologyTypes";
import {
  AIF_NAMESPACES,
  AIF_BASE_URI,
  SCHEME_PROPERTY_MAPPING,
  QUESTION_PROPERTY_MAPPING,
} from "./ontologyTypes";
import * as CONST from "./constants";

/**
 * AIF Graph Builder class
 * Incrementally builds an RDF graph representing argumentation schemes
 */
export class AIFGraphBuilder {
  private triples: AIFTriple[] = [];
  private nodes: Set<string> = new Set();

  constructor(
    private baseURI: string = AIF_BASE_URI,
    private namespaces: Record<string, string> = AIF_NAMESPACES
  ) {}

  /**
   * Add a scheme to the graph
   */
  addScheme(scheme: SchemeWithRelations, options: {
    includeHierarchy?: boolean;
    includeCQs?: boolean;
    includeMeshExtensions?: boolean;
  } = {}): void {
    const {
      includeHierarchy = true,
      includeCQs = true,
      includeMeshExtensions = true,
    } = options;

    const schemeURI = this.getSchemeURI(scheme.key);
    this.nodes.add(schemeURI);

    // Type declaration
    this.addTriple(schemeURI, CONST.RDF_TYPE, CONST.AIF_SCHEME_CLASS, "uri");

    // Core properties
    this.addTriple(schemeURI, CONST.RDFS_LABEL, scheme.key, "literal", CONST.XSD_STRING);
    if (scheme.name) {
      this.addTriple(schemeURI, CONST.AIF_SCHEME_NAME, scheme.name, "literal", CONST.XSD_STRING);
    }
    this.addTriple(schemeURI, CONST.RDFS_COMMENT, scheme.summary, "literal", CONST.XSD_STRING);
    
    if (scheme.description) {
      this.addTriple(schemeURI, CONST.AIF_DESCRIPTION, scheme.description, "literal", CONST.XSD_STRING);
    }

    // Hierarchy (parent-child relationships)
    // Using type assertion for Phase 6 fields that might not be in generated types yet
    const schemeWithPhase6 = scheme as any;
    if (includeHierarchy && schemeWithPhase6.parentSchemeId && scheme.parentScheme) {
      const parentURI = this.getSchemeURI(scheme.parentScheme.key);
      this.addTriple(schemeURI, CONST.AIF_IS_SUBTYPE_OF, parentURI, "uri");
    }

    // Mesh extensions
    if (includeMeshExtensions) {
      if (schemeWithPhase6.clusterTag) {
        this.addTriple(schemeURI, CONST.MESH_CLUSTER_TAG, schemeWithPhase6.clusterTag, "literal", CONST.XSD_STRING);
      }
      
      this.addTriple(schemeURI, CONST.MESH_INHERIT_CQS, String(schemeWithPhase6.inheritCQs ?? true), "literal", CONST.XSD_BOOLEAN);
      
      if (schemeWithPhase6.createdAt) {
        this.addTriple(schemeURI, CONST.MESH_CREATED_AT, schemeWithPhase6.createdAt.toISOString(), "literal", CONST.XSD_DATETIME);
      }
      
      if (schemeWithPhase6.updatedAt) {
        this.addTriple(schemeURI, CONST.MESH_UPDATED_AT, schemeWithPhase6.updatedAt.toISOString(), "literal", CONST.XSD_DATETIME);
      }
    }

    // Critical questions
    if (includeCQs && scheme.cqs && scheme.cqs.length > 0) {
      for (const cq of scheme.cqs) {
        this.addQuestion(schemeURI, cq, scheme.key);
      }
    }
  }

    /**
   * Add a critical question to the graph
   */
  private addQuestion(
    schemeURI: string,
    question: {
      id: string;
      cqKey: string | null;
      text: string;
      attackKind?: string;
    },
    schemeKey: string
  ): void {
    const questionURI = this.getQuestionURI(schemeKey, question.cqKey || question.id);
    this.nodes.add(questionURI);

    // Type declaration
    this.addTriple(questionURI, CONST.RDF_TYPE, CONST.AIF_QUESTION_CLASS, "uri");

    // Link to scheme
    this.addTriple(schemeURI, CONST.AIF_HAS_QUESTION, questionURI, "uri");

    // Question text
    this.addTriple(questionURI, CONST.AIF_QUESTION_TEXT, question.text, "literal", CONST.XSD_STRING);

    // Attack kind (UNDERMINES, UNDERCUTS, REBUTS)
    if (question.attackKind) {
      this.addTriple(questionURI, CONST.MESH_ATTACK_KIND, question.attackKind, "literal", CONST.XSD_STRING);
    }
  }

  /**
   * Add transitive ancestor relationships (for ontology reasoning)
   */
  addTransitiveAncestors(schemeKey: string, ancestors: string[]): void {
    const schemeURI = this.getSchemeURI(schemeKey);
    
    for (const ancestorKey of ancestors) {
      const ancestorURI = this.getSchemeURI(ancestorKey);
      this.addTriple(schemeURI, CONST.MESH_HAS_ANCESTOR, ancestorURI, "uri");
    }
  }

  /**
   * Add question inheritance metadata
   */
  addQuestionInheritance(
    childSchemeKey: string,
    parentSchemeKey: string,
    questionId: string,
    depth: number
  ): void {
    const inheritanceURI = this.getInheritanceURI(childSchemeKey, questionId);
    this.nodes.add(inheritanceURI);

    // Type declaration
    this.addTriple(inheritanceURI, CONST.RDF_TYPE, CONST.MESH_QUESTION_INHERITANCE_CLASS, "uri");

    // Relationships
    this.addTriple(inheritanceURI, CONST.MESH_CHILD_SCHEME, this.getSchemeURI(childSchemeKey), "uri");
    this.addTriple(inheritanceURI, CONST.MESH_PARENT_SCHEME, this.getSchemeURI(parentSchemeKey), "uri");
    this.addTriple(inheritanceURI, CONST.MESH_INHERITED_QUESTION, this.getQuestionURI(parentSchemeKey, questionId), "uri");
    this.addTriple(inheritanceURI, CONST.MESH_INHERITANCE_DEPTH, String(depth), "literal", CONST.XSD_INTEGER);
  }

  /**
   * Add a triple to the graph
   */
  private addTriple(
    subject: string,
    predicate: string,
    object: string,
    objectType: "uri" | "literal" = "literal",
    datatype?: string
  ): void {
    this.triples.push({
      subject,
      predicate,
      object,
      objectType,
      datatype,
    });
  }

  /**
   * Get the complete graph
   */
  getGraph(): AIFExportGraph {
    return {
      nodes: Array.from(this.nodes).map(uri => ({
        uri,
        type: "S-node", // Simplified for now
        properties: {},
      })),
      triples: this.triples,
      namespaces: this.namespaces,
    };
  }

  /**
   * Get triples for serialization
   */
  getTriples(): AIFTriple[] {
    return this.triples;
  }

  /**
   * Get namespaces
   */
  getNamespaces(): Record<string, string> {
    return this.namespaces;
  }

  /**
   * URI construction helpers
   */
  private getSchemeURI(schemeKey: string): string {
    return `${this.baseURI}/schemes/${schemeKey}`;
  }

  private getQuestionURI(schemeKey: string, questionId: string): string {
    return `${this.baseURI}/schemes/${schemeKey}/questions/${questionId}`;
  }

  private getInheritanceURI(childSchemeKey: string, questionId: string): string {
    return `${this.baseURI}/inheritance/${childSchemeKey}/${questionId}`;
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.triples = [];
    this.nodes.clear();
  }
}
