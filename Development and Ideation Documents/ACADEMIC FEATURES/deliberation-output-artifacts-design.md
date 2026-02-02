# Deliberation Output Artifacts: Architecture & Design Exploration

## Context

Academic Agora captures structured argumentation data through its deliberation primitives: claims, arguments, schemes, scopes (hypothetical/counterfactual/conditional), attacks, commitments, evidence, and connections. The current platform renders this data in multiple views—**List**, **Thread**, **Canvas**, **Brief**, and **Essay**—but there is a significant gap between what the structured data contains and the richness of the output artifacts it could produce.

The thesis briefs created for the self-application exercises (civic and academic use cases) demonstrate what a fully realized deliberation output artifact looks like: multi-layered documents that interleave natural language argumentation with formal notation, attack tracking, commitment stores, evidence registries, and computed status. The challenge is to build an artifact rendering system that can produce outputs of that caliber from the structured data users build through the visual interface.

**Core Question**: How do we architect the pipeline from structured deliberation data → polished output artifacts at varying levels of formality, for different audiences and purposes?

---

## Part I: The Rendering Gap

### 1.1 What the Current Essay Mode Produces

Based on the Carbon Tax Policy Analysis example (977 words, 3 schemes, 3 arguments):

**Strengths of current rendering:**
- Prose is readable and coherent
- Scoped sections (hypothetical, counterfactual, conditional) are distinguished
- Basic argumentation structure conveyed
- Conclusion synthesizes across scopes

**Limitations of current rendering:**
- No formal argument notation (scheme boxes, premise/conclusion structure)
- No confidence values surfaced in text
- No attack/defense tracking visible
- No critical questions mentioned
- No commitment store or evidence registry
- No computed status (IN/OUT/UNDEC)
- Flat prose without structural hierarchy
- No visual elements (diagrams, tables, status indicators)
- No audience adaptation
- Scoped arguments mentioned but not deeply developed

### 1.2 What the Thesis Brief Produces

The academic-agora-thesis-brief.md (1,936 lines) demonstrates a fully realized artifact:

**Structural elements:**
1. Meta-documentation (version, status, author, date)
2. Central thesis with computed status and confidence
3. Table of contents
4. Six prongs, each containing:
   - Claim with ID, status, confidence, type
   - Formal argument box (ASCII) with premises, evidence links, conclusion, RA-node, confidence
   - Critical questions table (CQ, Question, Status, Response)
   - Attack sections with formal notation (type, resolution, defense argument)
   - Prong summary box (claims established, aggregate confidence)
5. Commitment store (proponent commitments, opponent challenges)
6. Attack register (all attacks with type, target, status, resolution)
7. Open critical questions table
8. Synthesis section with:
   - Complete argument chain ASCII diagram
   - Confidence aggregation formula
   - Final thesis statement box (supported by, qualified by, status, recommended action)
9. Evidence registry (ID, description, source, type)
10. Document metadata with changelog

### 1.3 The Gap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE RENDERING GAP                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CURRENT ESSAY MODE               THESIS BRIEF TARGET                       │
│                                                                             │
│  ┌──────────────────┐              ┌──────────────────┐                     │
│  │ Flat prose        │              │ Hierarchical      │                     │
│  │ No formal notation│              │ Formal + prose    │                     │
│  │ No confidence     │              │ Confidence values │                     │
│  │ No attacks        │              │ Full attack log   │                     │
│  │ No CQs            │              │ CQ tables         │                     │
│  │ No commitments    │              │ Commitment store  │                     │
│  │ No evidence links │              │ Evidence registry │                     │
│  │ No computed status│              │ ASPIC+ status     │                     │
│  │ No diagrams       │              │ ASCII diagrams    │                     │
│  │ Single audience   │              │ Expert audience   │                     │
│  │ ~1,000 words      │              │ ~8,000 words      │                     │
│  └──────────────────┘              └──────────────────┘                     │
│                                                                             │
│  The gap isn't just "more text." It's a fundamentally different kind        │
│  of document that reveals the reasoning infrastructure, not just            │
│  the conclusions.                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part II: Output Artifact Taxonomy

### 2.1 Artifact Types (Simplest to Most Complex)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OUTPUT ARTIFACT SPECTRUM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LEVEL 0: STATUS SNAPSHOT                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ One-page summary: thesis, prong statuses, confidence, open Qs      │   │
│  │ Audience: Quick reference, dashboard widget                        │   │
│  │ Length: ~200 words + tables                                        │   │
│  │ Effort: Fully automated from structured data                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  LEVEL 1: EXECUTIVE BRIEF                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1-2 page summary: thesis, key arguments, main challenges, verdict  │   │
│  │ Audience: Decision-makers, non-specialist scholars                  │   │
│  │ Length: ~500-1,000 words                                            │   │
│  │ Effort: Template-driven with light NLG                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  LEVEL 2: ESSAY (Current)                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Natural language rendering of argument chain as readable prose      │   │
│  │ Audience: General academic                                         │   │
│  │ Length: ~1,000-3,000 words                                          │   │
│  │ Effort: Template + LLM generation                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  LEVEL 3: STRUCTURED BRIEF                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Prose interlaced with formal elements: argument boxes, CQ tables,  │   │
│  │ confidence values, attack tracking. Hybrid formal/natural.          │   │
│  │ Audience: Argumentation-literate scholars, platform users           │   │
│  │ Length: ~3,000-8,000 words                                          │   │
│  │ Effort: Template + LLM + computed elements                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  LEVEL 4: THESIS BRIEF (Gold Standard)                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Full formal documentation: all argument structures, complete        │   │
│  │ attack register, commitment store, evidence registry, ASPIC+       │   │
│  │ status computation, confidence aggregation, diagrams.               │   │
│  │ Audience: Expert, formal argumentation researchers, archival        │   │
│  │ Length: ~5,000-15,000 words                                         │   │
│  │ Effort: Heavy template + LLM + extensive computed elements          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  LEVEL 5: INTERACTIVE ARTIFACT                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Web-based interactive document: collapsible argument trees,         │   │
│  │ hover-for-detail, live graph navigation, filterable views,          │   │
│  │ zoomable from overview to individual CQ.                            │   │
│  │ Audience: Active deliberation participants, reviewers               │   │
│  │ Length: N/A (interactive, not linear)                                │   │
│  │ Effort: Full frontend engineering                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Purpose-Specific Artifacts

Beyond the complexity spectrum, different purposes require different artifacts from the same deliberation data:

| Purpose | Artifact | Key Elements |
|---------|----------|--------------|
| **Publication** | Academic paper draft | Scholarly prose, citations, lit review integration |
| **Grant application** | Funding rationale | Problem statement, solution, evidence, plan |
| **Teaching** | Pedagogical summary | Accessible prose, key questions, reading pointers |
| **Peer review** | Review summary | Strengths/weaknesses, open questions, recommendations |
| **Conference** | Presentation outline | Key claims, visual argument map, discussion points |
| **Debate preparation** | Position brief | One side's best arguments, anticipated objections |
| **Archival** | Complete record | Everything, maximally formal, machine-readable |
| **Progress report** | Delta document | What changed since last release, new attacks/defenses |

---

## Part III: Rendering Pipeline Architecture

### 3.1 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RENDERING PIPELINE ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. DATA EXTRACTION                                                  │   │
│  │    Query deliberation state → canonical intermediate representation │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                      │
│                                     ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2. GRAPH ANALYSIS                                                   │   │
│  │    Compute: extensions, status, confidence, structure type,         │   │
│  │    attack resolution, CQ completion, scope grouping                 │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                      │
│                                     ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3. TEMPLATE SELECTION                                               │   │
│  │    Based on: artifact type, audience, purpose, deliberation size    │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                      │
│                                     ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 4. SECTION GENERATION                                               │   │
│  │    For each section in template:                                    │   │
│  │    ├── Structural sections: Tables, diagrams, registers (computed)  │   │
│  │    ├── Prose sections: LLM-generated from structured data           │   │
│  │    └── Hybrid sections: Template frame + generated fill             │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                      │
│                                     ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 5. ASSEMBLY & FORMATTING                                            │   │
│  │    Combine sections → apply format (Markdown, HTML, PDF, DOCX)     │   │
│  │    Add cross-references, TOC, metadata, navigation                  │   │
│  └──────────────────────────────────┬──────────────────────────────────┘   │
│                                     │                                      │
│                                     ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 6. POST-PROCESSING                                                  │   │
│  │    Consistency checks, citation formatting, link validation,        │   │
│  │    style enforcement, export                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Stage 1: Data Extraction — The Canonical Intermediate Representation

Every output artifact starts from the same intermediate representation (IR). This is the "fully resolved" deliberation state:

```typescript
interface DeliberationIR {
  // Metadata
  meta: {
    id: string;
    title: string;
    description: string;
    version: string;
    createdAt: Date;
    updatedAt: Date;
    participants: Participant[];
    releaseHistory: Release[];
  };
  
  // Thesis / central claim
  thesis: {
    claim: ResolvedClaim;
    status: 'IN' | 'OUT' | 'UNDEC';
    confidence: number;
    supportingProngs: Prong[];
  };
  
  // All claims, resolved
  claims: ResolvedClaim[];
  
  // All arguments, resolved
  arguments: ResolvedArgument[];
  
  // Graph structure
  graph: {
    nodes: GraphNode[];           // Claims + arguments as nodes
    edges: GraphEdge[];           // Support, attack, qualify edges
    roots: string[];              // Root claim IDs
    leaves: string[];             // Leaf claim IDs
    depth: number;                // Maximum chain depth
    structureType: 'convergent' | 'linked' | 'serial' | 'divergent' | 'graph';
  };
  
  // Scopes
  scopes: ResolvedScope[];
  
  // Attacks
  attacks: ResolvedAttack[];
  
  // Commitments
  commitments: {
    proponent: Commitment[];
    opponent: Challenge[];
  };
  
  // Evidence
  evidence: EvidenceItem[];
  
  // Critical questions
  criticalQuestions: ResolvedCQ[];
  
  // Computed metrics
  metrics: {
    totalClaims: number;
    totalArguments: number;
    totalAttacks: number;
    attacksDefended: number;
    attacksUndefended: number;
    cqsAnswered: number;
    cqsOpen: number;
    averageConfidence: number;
    aggregateConfidence: number;        // Geometric mean
    weakestProng: { id: string; confidence: number };
    strongestProng: { id: string; confidence: number };
  };
}

interface ResolvedClaim {
  id: string;
  text: string;
  type: ClaimType;          // THESIS, INTERPRETIVE, EMPIRICAL, NORMATIVE, etc.
  status: 'IN' | 'OUT' | 'UNDEC';
  confidence: number;
  author: Participant;
  
  // Structural role
  role: 'root' | 'intermediate' | 'leaf';
  prongId?: string;
  
  // Relationships
  supportedBy: string[];     // Argument IDs
  attackedBy: string[];      // Attack IDs
  supports: string[];        // Claim IDs this supports
  
  // Evidence
  evidenceIds: string[];
  
  // Scope
  scope?: ResolvedScope;
}

interface ResolvedArgument {
  id: string;
  
  // Content
  conclusion: ResolvedClaim;
  premises: ResolvedPremise[];
  
  // Scheme
  scheme: {
    name: string;                // "Argument from Expert Opinion"
    category: string;            // "Epistemic", "Practical", etc.
    waltonId?: string;           // Reference to Walton taxonomy
  };
  
  // Inference
  inferenceType: string;         // "defeasible", "deductive", etc.
  confidence: number;
  
  // Structural role
  role: 'premise' | 'conclusion' | 'objection' | 'rebuttal' | 
        'qualifier' | 'evidence' | 'warrant';
  
  // Attack/defense state
  attacks: ResolvedAttack[];
  defenses: ResolvedDefense[];
  isDefeated: boolean;
  
  // Critical questions
  criticalQuestions: ResolvedCQ[];
  
  // Scope
  scope?: ResolvedScope;
  
  // Connection metadata
  connectionType: 'supports' | 'refutes' | 'qualifies' | 'enables';
  connectionStrength: number;    // e.g., 85% from Canvas view
  connectionLabel?: string;      // e.g., "Counterfactual analysi..."
}

interface ResolvedScope {
  id: string;
  type: 'hypothetical' | 'counterfactual' | 'conditional';
  assumption: string;        // "Suppose a $50/ton carbon tax is enacted in 2025"
  arguments: string[];       // Argument IDs within this scope
  color?: string;            // UI color code
}

interface ResolvedAttack {
  id: string;
  type: 'rebut' | 'undercut' | 'undermine';
  source: string;            // Attacking argument/claim ID
  target: string;            // Attacked argument/claim ID
  targetElement?: string;    // Specific premise if undermine
  status: 'undefended' | 'defended' | 'contested';
  defense?: ResolvedDefense;
  
  // Natural language
  attackSummary: string;
  defenseSummary?: string;
}

interface ResolvedCQ {
  id: string;
  argumentId: string;
  question: string;
  status: 'answered' | 'open' | 'challenged' | 'qualified';
  answer?: string;
  impact: string;            // "What happens if answered negatively"
}
```

### 3.3 Stage 2: Graph Analysis

Before any rendering, compute derived properties:

```typescript
interface GraphAnalysis {
  // ASPIC+ extension computation
  extensions: {
    grounded: string[];       // Claim IDs in grounded extension
    preferred: string[][];    // Preferred extensions
    stable: string[][];       // Stable extensions
  };
  
  // Structural analysis
  structure: {
    prongDecomposition: Prong[];    // How claims group into prongs
    argumentChains: Chain[];         // Linear sequences
    convergencePoints: string[];     // Claims supported by multiple chains
    dialecticalExchanges: Exchange[];// Attack-defense pairs
  };
  
  // Confidence propagation
  confidencePropagation: {
    perClaim: Map<string, number>;
    perProng: Map<string, number>;
    aggregate: number;                // Geometric mean across prongs
    weakestLink: { id: string; confidence: number };
    formula: string;                  // Human-readable formula
  };
  
  // Scope analysis
  scopeAnalysis: {
    perScope: Map<string, ScopeAnalysis>;
    crossScopeConnections: Connection[];
  };
  
  // Completeness assessment
  completeness: {
    unansweredCQs: ResolvedCQ[];
    unaddressedAttacks: ResolvedAttack[];
    unsupportedClaims: ResolvedClaim[];
    suggestedNextMoves: SuggestedMove[];
  };
}
```

### 3.4 Stage 3: Template Selection

Templates define the *structure* of the output—what sections appear, in what order, with what elements. The *content* of each section is generated in Stage 4.

```typescript
interface ArtifactTemplate {
  id: string;
  name: string;                      // "Thesis Brief", "Executive Summary", etc.
  level: 0 | 1 | 2 | 3 | 4 | 5;    // Complexity level
  
  // Audience
  audience: 'expert' | 'academic' | 'general' | 'decision-maker';
  
  // Sections (ordered)
  sections: TemplateSection[];
  
  // Formatting
  format: {
    showFormalNotation: boolean;       // ASCII argument boxes
    showConfidence: boolean;           // Numerical confidence values
    showStatus: boolean;               // IN/OUT/UNDEC labels
    showAttacks: boolean;              // Attack tracking
    showCQs: boolean;                  // Critical questions
    showCommitments: boolean;          // Commitment store
    showEvidence: boolean;             // Evidence registry
    showDiagrams: boolean;             // ASCII/visual diagrams
    showMetrics: boolean;              // Computed statistics
    proseStyle: 'formal' | 'scholarly' | 'accessible' | 'journalistic';
    citationFormat: 'chicago' | 'apa' | 'mla' | 'inline';
  };
  
  // Conditional sections (only include if data exists)
  conditionals: ConditionalSection[];
}

interface TemplateSection {
  id: string;
  name: string;
  type: SectionType;
  required: boolean;
  order: number;
  
  // Generation strategy
  generationStrategy: 'computed' | 'template' | 'llm' | 'hybrid';
  
  // Data requirements
  requiredData: string[];            // What IR fields this section needs
  
  // Subsections
  subsections?: TemplateSection[];
}

enum SectionType {
  // Structural (computed from data)
  META_HEADER,              // Title, version, status, date
  TABLE_OF_CONTENTS,        // Auto-generated
  THESIS_STATEMENT,         // Central claim with status
  ARGUMENT_BOX,             // Formal ASCII argument notation
  CQ_TABLE,                 // Critical questions table
  ATTACK_SECTION,           // Attack with defense
  PRONG_SUMMARY,            // Computed prong status
  COMMITMENT_STORE,         // Proponent/opponent commitments
  ATTACK_REGISTER,          // All attacks summary table
  EVIDENCE_REGISTRY,        // All evidence links
  ARGUMENT_CHAIN_DIAGRAM,   // ASCII tree diagram
  CONFIDENCE_COMPUTATION,   // Aggregation formula
  METRICS_DASHBOARD,        // Statistics
  SCOPE_SECTION,            // Scoped analysis grouping
  COMPARISON_MATRIX,        // Alternatives comparison table
  RISK_REGISTER,            // Risk table
  
  // Prose (LLM-generated)
  NARRATIVE_INTRODUCTION,   // Framing prose
  CLAIM_EXPOSITION,         // Explain a claim in prose
  ARGUMENT_NARRATION,       // Narrate an argument naturally
  ATTACK_NARRATION,         // Narrate an attack/defense exchange
  SCOPE_NARRATION,          // Narrate scoped reasoning
  SYNTHESIS_PROSE,          // Synthesize across prongs
  QUALIFICATION_PROSE,      // Discuss limitations
  CONCLUSION_PROSE,         // Final summation
  
  // Hybrid (template frame + generated fill)
  THESIS_FINAL_BOX,         // Structured box with generated content
  RECOMMENDED_ACTIONS,      // Generated from open CQs + metrics
  CHANGELOG,                // Computed from version diff
}
```

### 3.5 Stage 4: Section Generation

This is where the core rendering work happens. Each section type has a generator:

```typescript
// Generator registry
interface SectionGenerator {
  canGenerate(section: TemplateSection, ir: DeliberationIR): boolean;
  generate(
    section: TemplateSection, 
    ir: DeliberationIR, 
    analysis: GraphAnalysis,
    config: GenerationConfig
  ): Promise<RenderedSection>;
}

// Example: Argument Box Generator (COMPUTED)
class ArgumentBoxGenerator implements SectionGenerator {
  generate(section, ir, analysis, config): Promise<RenderedSection> {
    const argument = ir.arguments.find(a => a.id === section.dataId);
    
    // Build ASCII box from structured data
    const box = `
\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│ ARGUMENT ${argument.id}                                              │
│ Scheme: ${argument.scheme.name}                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ PREMISES:                                                           │
│                                                                     │
${argument.premises.map((p, i) => 
  `│ P${i+1}: ${wordWrap(p.text, 60)}                                │`
).join('\n')}
│                                                                     │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                     │
│ CONCLUSION:                                                         │
│                                                                     │
│ C: ${wordWrap(argument.conclusion.text, 62)}                        │
│                                                                     │
│ RA-Node: ${argument.scheme.category} inference                      │
│ Confidence: ${argument.confidence}                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
\`\`\``;
    
    return { content: box, type: 'code_block' };
  }
}

// Example: Claim Exposition Generator (LLM)
class ClaimExpositionGenerator implements SectionGenerator {
  async generate(section, ir, analysis, config): Promise<RenderedSection> {
    const claim = ir.claims.find(c => c.id === section.dataId);
    const supportingArgs = ir.arguments.filter(a => 
      a.conclusion.id === claim.id
    );
    const attacks = ir.attacks.filter(a => a.target === claim.id);
    
    const prompt = buildExpositionPrompt(claim, supportingArgs, attacks, config);
    const prose = await llmGenerate(prompt);
    
    return { content: prose, type: 'prose' };
  }
}

// Example: Attack Register Generator (COMPUTED)
class AttackRegisterGenerator implements SectionGenerator {
  generate(section, ir, analysis, config): Promise<RenderedSection> {
    const rows = ir.attacks.map(atk => 
      `| ${atk.id} | ${atk.type.toUpperCase()} | ${atk.target} | ${atk.status.toUpperCase()} | ${atk.defenseSummary || '—'} |`
    );
    
    const table = `| Attack ID | Type | Target | Status | Resolution |
|-----------|------|--------|--------|------------|
${rows.join('\n')}`;
    
    return { content: table, type: 'table' };
  }
}
```

### 3.6 Stage 5: Assembly & Formatting

```typescript
interface AssemblyEngine {
  // Combine generated sections into final document
  assemble(
    sections: RenderedSection[], 
    template: ArtifactTemplate,
    format: OutputFormat
  ): Promise<AssembledDocument>;
  
  // Add structural elements
  addTableOfContents(doc: AssembledDocument): void;
  addCrossReferences(doc: AssembledDocument): void;
  addPageNumbers(doc: AssembledDocument): void;
  addMetadata(doc: AssembledDocument, ir: DeliberationIR): void;
  
  // Format conversion
  toMarkdown(doc: AssembledDocument): string;
  toHTML(doc: AssembledDocument): string;
  toPDF(doc: AssembledDocument): Buffer;
  toDOCX(doc: AssembledDocument): Buffer;
  toInteractive(doc: AssembledDocument): ReactComponent;
}
```

---

## Part IV: Template Designs for Each Artifact Level

### 4.1 Level 0: Status Snapshot

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DELIBERATION STATUS SNAPSHOT                                                │
│                                                                             │
│ Title: Carbon Tax Policy Analysis                                           │
│ Version: v1.2.0 | Updated: 2026-01-31 | Participants: 7                    │
│                                                                             │
│ THESIS: "Carbon pricing is the most effective and equitable approach        │
│ to reducing emissions, when paired with dividend redistribution."           │
│                                                                             │
│ Status: DEFENDED | Confidence: 0.79 | Attacks: 3/3 addressed               │
│                                                                             │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ Prong              │ Status  │ Conf. │ Attacks │ Open CQs │           │  │
│ ├─────────────────────┼─────────┼───────┼─────────┼──────────┤           │  │
│ │ Climate urgency     │ IN      │ 0.90  │ 0/0     │ 0        │           │  │
│ │ Economic efficiency │ IN      │ 0.82  │ 1/1 ✓   │ 1        │           │  │
│ │ Equity concerns     │ UNDEC   │ 0.65  │ 1/2 ✓   │ 2        │           │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ Weakest link: Equity concerns (0.65) — 1 unresolved attack                  │
│ Next moves: Address ATK-3 (regressive impact), answer CQ on elasticity      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Generation**: Fully computed. No LLM needed. Pure data extraction + table formatting.

### 4.2 Level 1: Executive Brief

```markdown
# Carbon Tax Policy Analysis — Executive Brief

**Status**: Defended (with qualifications) | **Confidence**: 0.79 | **Version**: v1.2.0

## Thesis

This deliberation concludes that carbon pricing, when paired with household 
dividends, represents the most effective and equitable mechanism for reducing 
emissions. The conclusion rests on three lines of argument and has withstood 
three formal challenges.

## Key Arguments

**Climate Urgency** (Confidence: 0.90): Based on expert scientific consensus 
(IPCC, National Academies), the analysis establishes that immediate policy 
action is required. This is the strongest prong.

**Economic Efficiency** (Confidence: 0.82): Carbon pricing is argued to be 
more efficient than command-and-control regulation, via a causal argument 
grounded in economic theory and empirical evidence from the EU ETS and 
British Columbia. One challenge (industry competitiveness) has been addressed 
through border adjustment mechanisms.

**Equity Concerns** (Confidence: 0.65): This is the weakest and most actively 
contested area. The dividend mechanism is argued to offset regressive impacts, 
but one attack (differential regional effects) remains unresolved.

## Open Questions

1. Would a carbon tax reduce emissions enough given demand inelasticity?
2. How would regional economic disparities affect distributional outcomes?
3. Is the Canadian carbon dividend model transferable to the US context?

## Recommended Actions

Address the unresolved equity attack before advancing the thesis to higher 
confidence. Consider commissioning regional impact analysis.
```

**Generation**: Template frame + light LLM generation for prose transitions. Tables computed.

### 4.3 Level 2: Essay (Enhanced)

The current Essay mode, but significantly enriched:

**Enhancements over current:**
- Confidence values woven into prose naturally ("The strongest line of reasoning, supported with high confidence...")
- Attack/defense exchanges narrated ("Critics might object that... However, this challenge has been addressed by...")
- Scoped sections given proper framing and development
- Critical questions surfaced as open discussion points
- Cross-references between arguments
- Footnotes with evidence sources

**Generation**: Primarily LLM with structured prompting. Template provides section ordering and required elements; LLM generates natural prose.

### 4.4 Level 3: Structured Brief

The hybrid format — readable prose with embedded formal elements:

```markdown
# Carbon Tax Policy Analysis

## Thesis

> **THESIS-001**: Carbon pricing, when paired with household dividends, 
> represents the most effective and equitable mechanism for reducing emissions.

**Status**: IN (defended) | **Confidence**: 0.79

---

## Prong I: Climate Urgency

### Claim C-101

> Climate change requires immediate policy action to reduce carbon emissions.

**Status**: IN | **Confidence**: 0.90 | **Type**: Empirical

### Argument A-101: Argument from Expert Opinion

The case for immediate action rests on scientific consensus. The IPCC projects 
1.5°C warming by 2030 without intervention, and each degree increases extreme 
weather events by 30%. This appeal to expert authority carries weight insofar 
as the expertise is relevant and reliable.

| Critical Question | Status | Response |
|-------------------|--------|----------|
| Is the expert credible? | ANSWERED | IPCC represents global scientific consensus |
| Is the domain relevant? | ANSWERED | Climate science directly addresses emissions policy |
| Is there expert disagreement? | ANSWERED | Negligible in climate science; 97%+ consensus |

[No attacks registered against this argument.]

### Prong I Summary

| Claim | Status | Confidence |
|-------|--------|------------|
| C-101: Immediate action required | IN | 0.90 |

**Prong Confidence**: 0.90

---

[...continues for each prong...]
```

**Generation**: Template provides the full structural skeleton (headers, claim blocks, CQ tables, prong summaries). LLM generates exposition prose per argument. Tables and status indicators computed.

### 4.5 Level 4: Thesis Brief (Full Formal)

This is what the self-application thesis briefs demonstrate. The template includes every formal element:

```typescript
const thesisBriefTemplate: ArtifactTemplate = {
  id: 'thesis-brief',
  name: 'Thesis Brief (Full Formal)',
  level: 4,
  audience: 'expert',
  sections: [
    { type: SectionType.META_HEADER, required: true },
    { type: SectionType.THESIS_STATEMENT, required: true },
    { type: SectionType.TABLE_OF_CONTENTS, required: true },
    
    // Per-prong sections (repeated for each prong)
    {
      type: 'PRONG_GROUP',
      subsections: [
        { type: SectionType.CLAIM_EXPOSITION },      // "### Claim C-XXX" with quote block
        { type: SectionType.ARGUMENT_BOX },           // ASCII formal notation
        { type: SectionType.CQ_TABLE },               // Critical questions table
        // Per attack:
        { type: SectionType.ATTACK_SECTION },          // Attack with formal notation
        { type: SectionType.ARGUMENT_BOX },            // Defense argument
        // End per attack
        { type: SectionType.PRONG_SUMMARY },           // ASCII summary box
      ]
    },
    
    // Global sections
    { type: SectionType.COMMITMENT_STORE, required: true },
    { type: SectionType.ATTACK_REGISTER, required: true },
    { type: SectionType.ARGUMENT_CHAIN_DIAGRAM, required: true },
    { type: SectionType.CONFIDENCE_COMPUTATION, required: true },
    { type: SectionType.THESIS_FINAL_BOX, required: true },
    { type: SectionType.EVIDENCE_REGISTRY, required: true },
    { type: SectionType.META_FOOTER, required: true },
  ],
  format: {
    showFormalNotation: true,
    showConfidence: true,
    showStatus: true,
    showAttacks: true,
    showCQs: true,
    showCommitments: true,
    showEvidence: true,
    showDiagrams: true,
    showMetrics: true,
    proseStyle: 'formal',
    citationFormat: 'chicago',
  }
};
```

### 4.6 Level 5: Interactive Artifact

A web-based interactive document that lets readers navigate the deliberation:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ INTERACTIVE THESIS BRIEF                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─── Navigation ────┐  ┌──────────────────────────────────────────────┐   │
│  │                    │  │                                              │   │
│  │  ▼ Thesis [0.83]   │  │  [OVERVIEW]  [GRAPH]  [TIMELINE]  [EXPORT] │   │
│  │  ▼ Prong I [0.85]  │  │                                              │   │
│  │    • C-101          │  │  THESIS-001                                 │   │
│  │    • A-101          │  │  "Academic Agora should exist..."           │   │
│  │    • ATK-101        │  │                                              │   │
│  │  ▼ Prong II [0.88] │  │  Status: IN ● | Conf: 0.83                 │   │
│  │    • C-201          │  │                                              │   │
│  │    • C-202          │  │  ┌─────────┬─────────┬─────────┐           │   │
│  │    • C-203          │  │  │ Prong I │ Prong II│Prong III│           │   │
│  │  ▼ Prong III [0.85]│  │  │  0.85   │  0.88   │  0.85   │           │   │
│  │  ▼ Prong IV [0.75] │  │  │  ███░   │  ████░  │  ███░   │           │   │
│  │  ▼ Prong V [0.80]  │  │  └─────────┴─────────┴─────────┘           │   │
│  │  ▼ Prong VI [0.85] │  │  ┌─────────┬─────────┬─────────┐           │   │
│  │  ▼ Commitments     │  │  │Prong IV │ Prong V │Prong VI │           │   │
│  │  ▼ Attacks         │  │  │  0.75 ⚠ │  0.80   │  0.85   │           │   │
│  │  ▼ Evidence        │  │  │  ██░░   │  ███░   │  ███░   │           │   │
│  │                    │  │  └─────────┴─────────┴─────────┘           │   │
│  └────────────────────┘  │                                              │   │
│                          │  Attacks: 7 registered, 7 defended ✓        │   │
│                          │  Open CQs: 5 remaining                      │   │
│                          │                                              │   │
│                          │  [Expand Prong I ▸]                         │   │
│                          │  [View Argument Graph ▸]                    │   │
│                          │  [Export as PDF ▸] [Export as Markdown ▸]    │   │
│                          │                                              │   │
│                          └──────────────────────────────────────────────┘   │
│                                                                             │
│  When user clicks "Expand Prong I":                                        │
│  • Claim block expands with full text                                      │
│  • Argument notation appears (collapsible)                                 │
│  • CQ table visible                                                        │
│  • Attack/defense exchange expandable                                       │
│  • "Jump to related" links to cross-referenced claims                      │
│                                                                             │
│  When user clicks "View Argument Graph":                                    │
│  • Canvas-style interactive graph (like existing Canvas view)              │
│  • Nodes colored by status (IN=green, OUT=red, UNDEC=yellow)               │
│  • Click node → scrolls to that section in the brief                       │
│  • Hover → shows confidence, scheme, attack count                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part V: The LLM Generation Layer

### 5.1 Why LLM Generation Is Necessary

Purely template-based rendering (even with sophisticated templates) produces stilted, mechanical prose. The thesis briefs work because they have *voice*—they read as if written by a scholar making a case, not assembled from database queries. This requires LLM generation for prose sections.

### 5.2 LLM Generation Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LLM GENERATION STRATEGY                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PRINCIPLE: The LLM generates PROSE, not STRUCTURE.                         │
│                                                                             │
│  Structure (tables, boxes, status, confidence, diagrams) is COMPUTED        │
│  from the deliberation data. Prose (exposition, narration, synthesis)       │
│  is GENERATED by the LLM with the structured data as input.                │
│                                                                             │
│  This means:                                                                │
│  • Formal elements are always correct (computed from source of truth)       │
│  • Prose is always grounded (constrained by structured data)                │
│  • The LLM can't hallucinate arguments or statuses                          │
│  • Voice and readability come from generation, not templates                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Prompt Architecture for Section Generation

Each prose section type has a specialized prompt template:

```typescript
interface SectionPrompt {
  // System context
  systemPrompt: string;           // "You are rendering a section of a formal deliberation artifact..."
  
  // Structured data input
  sectionData: any;               // The specific IR data for this section
  
  // Style parameters
  style: {
    formality: 'formal' | 'scholarly' | 'accessible';
    voice: 'third_person' | 'first_person_plural' | 'impersonal';
    length: 'concise' | 'moderate' | 'expansive';
    includeTransitions: boolean;   // Connect to previous/next sections
  };
  
  // Constraints
  constraints: {
    mustMention: string[];         // Required elements (claim IDs, evidence)
    mustNotMention: string[];      // Excluded elements
    mustIncludeCaveats: boolean;   // For qualification sections
    maxWords: number;
  };
  
  // Context
  precedingSection?: RenderedSection;   // For transition coherence
  followingSection?: TemplateSection;   // For forward reference
}
```

**Example Prompt for Claim Exposition:**
```
You are rendering a claim exposition section for a formal deliberation artifact.

CLAIM DATA:
- ID: C-101
- Text: "Academic discourse lacks infrastructure for sustained, structured 
  public engagement with research."
- Status: IN (defended)
- Confidence: 0.90
- Type: Empirical/Descriptive
- Supporting arguments: A-101 (Argument from Sign), A-102 (Argument from 
  Cause to Effect), A-103 (Argument from Precedent)
- Attacks received: ATK-101 (REBUT, "Peer review is infrastructure" — DEFENDED)
- Evidence: E-101a (Borgman, 2007), E-101b (Platform documentation analysis)

STYLE: Formal scholarly prose, third person, moderate length.

TASK: Write 150-250 words introducing this claim, explaining why it matters, 
and previewing the arguments that will support it. Do NOT reproduce the 
formal argument structure (that will appear separately). Do NOT include 
confidence numbers in the prose (those appear in the header). DO mention 
the key evidence sources naturally.

PRECEDING SECTION: Table of contents (this is the first substantive section).
FOLLOWING SECTION: Argument A-101 formal notation.
```

### 5.4 Quality Control for LLM Generation

```typescript
interface QualityChecks {
  // Factual consistency
  checkClaimFidelity(generated: string, claim: ResolvedClaim): boolean;
  // Does the prose accurately represent the claim?
  
  // Completeness
  checkRequiredMentions(generated: string, required: string[]): string[];
  // Are all required elements mentioned?
  
  // Style compliance
  checkStyle(generated: string, style: StyleConfig): StyleViolation[];
  // Does it match formality level, voice, etc.?
  
  // Length compliance
  checkLength(generated: string, config: LengthConfig): boolean;
  
  // No hallucination
  checkNoInventedArguments(generated: string, ir: DeliberationIR): boolean;
  // Does the prose only reference arguments/claims that exist in the data?
  
  // Coherence with adjacent sections
  checkTransitionCoherence(
    generated: string, 
    preceding: RenderedSection, 
    following: TemplateSection
  ): boolean;
}
```

---

## Part VI: The Scope Rendering Problem

### 6.1 Current Scope Handling

The screenshots show scopes rendered as:
- Color-coded labels (yellow for HYPOTHETICAL, blue for COUNTERFACTUAL)
- Inline assumption text ("HYPOTHETICAL: Suppose a $50/ton carbon tax...")
- Scoped arguments grouped in the Essay with transition phrases

### 6.2 Enhanced Scope Rendering

Scopes are one of the most intellectually interesting features for HSS scholars. They enable:
- **Thought experiments** (hypothetical): "Suppose we adopt Rawls's original position..."
- **Counterfactual history** (counterfactual): "Had the French Revolution not occurred..."
- **Conditional reasoning** (conditional): "If we accept Kant's categorical imperative..."

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCOPE RENDERING OPTIONS                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ OPTION A: Inline Integration (Current)                                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ...main argument text...                                                │ │
│ │                                                                         │ │
│ │ Let us consider a hypothetical scenario: "Suppose a $50/ton carbon     │ │
│ │ tax is enacted in 2025." Under this assumption...                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ OPTION B: Visually Distinguished Blocks                                     │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ...main argument text...                                                │ │
│ │                                                                         │ │
│ │ ┌── HYPOTHETICAL ──────────────────────────────────────────────────┐    │ │
│ │ │ Assumption: "Suppose a $50/ton carbon tax is enacted in 2025"    │    │ │
│ │ │                                                                  │    │ │
│ │ │ Under this assumption, carbon tax revenue could fund a           │    │ │
│ │ │ $2,000/year dividend to offset household costs...                │    │ │
│ │ │                                                                  │    │ │
│ │ │ Arguments in this scope: A-105, A-106                            │    │ │
│ │ │ Scope confidence: 0.78                                           │    │ │
│ │ └──────────────────────────────────────────────────────────────────┘    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ OPTION C: Parallel Columns (for contrasting scopes)                         │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ┌── HYPOTHETICAL ────────────┐  ┌── COUNTERFACTUAL ──────────────┐     │ │
│ │ │ "Suppose $50/ton in 2025"  │  │ "Had $150/ton in 2015"         │     │ │
│ │ │                            │  │                                │     │ │
│ │ │ Revenue: ~$300B/year       │  │ Avoided: $2T locked-in carbon  │     │ │
│ │ │ Dividend: $2K/household    │  │ Emissions: 40% lower           │     │ │
│ │ │ Jobs: +500K / -200K        │  │ Cost of delay: quantified      │     │ │
│ │ │                            │  │                                │     │ │
│ │ │ Conf: 0.78                 │  │ Conf: 0.72                     │     │ │
│ │ └────────────────────────────┘  └────────────────────────────────┘     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ OPTION D: Nested/Tabbed (Interactive only)                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Main Argument] [Hypothetical: $50/ton] [Counterfactual: $150/ton]     │ │
│ │ ─────────────────────────────────────────────────────────────────────── │ │
│ │ Currently viewing: Hypothetical scope                                   │ │
│ │                                                                         │ │
│ │ Under the assumption that a $50/ton carbon tax is enacted in 2025...   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Recommendation**: Option B for static documents (Brief/Essay), Option C when comparing scopes, Option D for interactive artifacts. The key is that scopes should be *visually distinguished* from the main argument flow—they represent different epistemic modalities (actual vs. hypothetical vs. counterfactual) and readers need to track which modality they're in.

---

## Part VII: Visual Design Language

### 7.1 Design Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DELIBERATION ARTIFACT DESIGN PRINCIPLES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. DUAL LEGIBILITY                                                          │
│    The same document must be readable as prose (flowing narrative)           │
│    AND as structure (formal notation, tables, graphs). Neither              │
│    should feel like an afterthought.                                        │
│                                                                             │
│ 2. PROGRESSIVE DISCLOSURE                                                   │
│    Start with the conclusion and confidence. Let readers drill down         │
│    into formal detail only if they want it.                                 │
│                                                                             │
│ 3. STATUS AT A GLANCE                                                       │
│    The deliberation state (defended/contested/unresolved) should be         │
│    visible without reading the full document. Color, icons, and            │
│    summary tables serve this.                                               │
│                                                                             │
│ 4. SCOPE CLARITY                                                            │
│    Readers must always know which epistemic modality they're in.            │
│    Hypothetical, counterfactual, and conditional reasoning must be          │
│    visually distinct from the main argument.                                │
│                                                                             │
│ 5. HONEST UNCERTAINTY                                                       │
│    Confidence is never hidden. Weakest links are highlighted, not          │
│    buried. Open questions are prominent, not footnoted.                     │
│                                                                             │
│ 6. CITATION-READY                                                           │
│    Every element (claim, argument, exchange) has a stable identifier        │
│    that can be cited. The document itself is citable.                       │
│                                                                             │
│ 7. EXPORT FIDELITY                                                          │
│    The document should look good in Markdown, HTML, and PDF. No            │
│    format should feel like a second-class citizen.                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Status Indicators

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STATUS VISUAL VOCABULARY                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ CLAIM STATUS:                                                               │
│   ● IN (Defended)      — Green/solid                                       │
│   ○ OUT (Defeated)     — Red/outline                                       │
│   ◐ UNDEC (Undecided)  — Yellow/half                                       │
│                                                                             │
│ ATTACK STATUS:                                                              │
│   ✓ DEFENDED           — Check mark, green                                 │
│   ✗ UNDEFENDED         — X mark, red                                       │
│   ~ CONTESTED          — Tilde, yellow                                     │
│                                                                             │
│ CRITICAL QUESTION STATUS:                                                   │
│   ✓ ANSWERED           — Solid check                                       │
│   ○ OPEN               — Open circle                                       │
│   ⚠ CHALLENGED         — Warning triangle                                  │
│   ~ QUALIFIED          — Tilde                                             │
│                                                                             │
│ CONFIDENCE VISUAL:                                                          │
│   0.90+  ████████████████████  "High confidence"                            │
│   0.75+  ██████████████░░░░░░  "Moderate confidence"                        │
│   0.60+  ████████░░░░░░░░░░░░  "Low confidence"                             │
│   <0.60  ████░░░░░░░░░░░░░░░░  "Very low confidence"                        │
│                                                                             │
│ SCOPE INDICATORS:                                                           │
│   🟡 HYPOTHETICAL      — Yellow dot / dashed border                        │
│   🔵 COUNTERFACTUAL    — Blue dot / dashed border                          │
│   🟣 CONDITIONAL       — Purple dot / dashed border                        │
│                                                                             │
│ ARGUMENT ROLE:                                                              │
│   [Premise]            — Blue badge                                        │
│   [Conclusion]         — Green badge                                       │
│   [Objection]          — Red badge                                         │
│   [Rebuttal]           — Orange badge                                      │
│   [Qualifier]          — Purple badge                                      │
│   [Evidence]           — Teal badge                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Component Library for Formal Elements

#### The Argument Box (Static/Print)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ARGUMENT A-101                                                 Status: IN   │
│ Scheme: Argument from Expert Opinion (Walton)               Conf: 0.90     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PREMISES:                                                                   │
│                                                                             │
│ P1: The IPCC represents global scientific consensus on climate change      │
│     [Evidence: E-101a — IPCC AR6 (2021)]                                   │
│                                                                             │
│ P2: IPCC projects 1.5°C warming by 2030 without intervention              │
│     [Evidence: E-101b — IPCC AR6 WG1 Chapter 4]                           │
│                                                                             │
│ P3: Each degree of warming increases extreme weather events by 30%         │
│     [Evidence: E-101c — Nature Climate Change meta-analysis]              │
│                                                                             │
│ ───────────────────────────────────────────────────────────────────────── │
│                                                                             │
│ CONCLUSION:                                                                 │
│                                                                             │
│ C: Climate change requires immediate policy action to reduce               │
│    carbon emissions.                                                        │
│                                                                             │
│ RA-Node: Expert authority inference                                        │
│ Attacks: 0 received | CQs: 3/3 answered                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### The Argument Box (Interactive/HTML)

```html
<div class="argument-box" data-status="in" data-confidence="0.90">
  <div class="argument-header">
    <span class="argument-id">A-101</span>
    <span class="scheme-badge">Argument from Expert Opinion</span>
    <span class="status-indicator status-in">IN</span>
    <span class="confidence">0.90</span>
  </div>
  
  <div class="premises" collapsible>
    <div class="premise" data-id="P1">
      <span class="premise-label">P1:</span>
      <span class="premise-text">The IPCC represents global scientific consensus...</span>
      <a class="evidence-link" href="#E-101a">E-101a</a>
    </div>
    <!-- more premises -->
  </div>
  
  <div class="inference-line"></div>
  
  <div class="conclusion">
    <span class="conclusion-label">C:</span>
    <span class="conclusion-text">Climate change requires immediate policy action...</span>
  </div>
  
  <div class="argument-footer">
    <span class="ra-node">Expert authority inference</span>
    <span class="attacks-count">0 attacks</span>
    <span class="cq-count">3/3 CQs answered</span>
    <button class="expand-cqs">View CQs ▸</button>
    <button class="expand-attacks">View Attacks ▸</button>
  </div>
</div>
```

#### The Prong Summary Box

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PRONG I: CLIMATE URGENCY                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Claims Established:                                                         │
│                                                                             │
│ C-101: Immediate action required                                     [IN]  │
│        └── A-101 (Expert Opinion)                        Conf: 0.90        │
│            └── No undefended attacks                                        │
│                                                                             │
│ C-102: Delay increases costs and reduces options                     [IN]  │
│        └── A-102 (Cause to Effect)                       Conf: 0.85        │
│            └── ATK-102 (Adaptation argument) → DEFENDED                     │
│                                                                             │
│ PRONG CONCLUSION: Climate urgency is established                     [IN]  │
│                                                                             │
│ Aggregate Confidence: 0.87                                                  │
│ Attacks registered: 1 | Attacks defended: 1 | Open CQs: 0                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part VIII: Implementation Priorities

### 8.1 What to Build First

Given the current state (Essay mode exists, Canvas/Thread/List views exist), the most impactful additions in priority order:

| Priority | Feature | Effort | Impact | Rationale |
|----------|---------|--------|--------|-----------|
| **P0** | Canonical IR extraction | Medium | Foundation | Everything depends on this |
| **P1** | Graph analysis engine | Medium | Foundation | Status/confidence computation |
| **P2** | Level 0: Status snapshot | Low | High | Quick wins; dashboard value |
| **P3** | Enhanced Essay (Level 2+) | Medium | High | Improves existing feature dramatically |
| **P4** | Level 3: Structured Brief | Medium-High | Very High | The "sweet spot" for most users |
| **P5** | Template system | Medium | High | Enables all artifact types |
| **P6** | Level 4: Thesis Brief | High | Very High | Flagship capability; demo value |
| **P7** | Level 1: Executive Brief | Low | Medium | Easy once template system exists |
| **P8** | Level 5: Interactive | Very High | High | Longest engineering lift |

### 8.2 The Critical Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CRITICAL PATH                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Step 1: Build the IR                                                        │
│ ├── Extract all deliberation state into canonical format                    │
│ ├── Include: claims, arguments, schemes, scopes, attacks, CQs, evidence   │
│ └── This is the single source of truth for ALL renderers                    │
│                                                                             │
│ Step 2: Build the Graph Analysis Engine                                     │
│ ├── Compute ASPIC+ extensions (grounded at minimum)                        │
│ ├── Propagate confidence through argument graph                             │
│ ├── Detect prong structure                                                  │
│ ├── Identify weakest links and open questions                               │
│ └── Generate suggested next moves                                           │
│                                                                             │
│ Step 3: Build the Template System                                           │
│ ├── Define section types and their generators                               │
│ ├── Support computed, LLM, and hybrid generation                           │
│ ├── Configure per artifact level                                            │
│ └── Build assembly engine                                                   │
│                                                                             │
│ Step 4: Implement Generators (incremental)                                  │
│ ├── Start with computed generators (tables, boxes, registers)              │
│ ├── Then LLM generators (exposition, narration, synthesis)                  │
│ ├── Then hybrid generators (final thesis box, recommendations)             │
│ └── Each generator unlocks more artifact types                              │
│                                                                             │
│ Step 5: Build Output Formats                                                │
│ ├── Markdown (primary)                                                      │
│ ├── HTML (interactive)                                                      │
│ ├── PDF (archival/print)                                                    │
│ └── DOCX (integration with Word workflows)                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Data Requirements Audit

For each artifact level, what data must exist in the deliberation?

| Data Element | L0 | L1 | L2 | L3 | L4 | L5 |
|--------------|----|----|----|----|----|----|
| Claims with text | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Claim status (IN/OUT) | ✓ | ✓ |   | ✓ | ✓ | ✓ |
| Confidence values | ✓ | ✓ |   | ✓ | ✓ | ✓ |
| Arguments with premises |   |   | ✓ | ✓ | ✓ | ✓ |
| Argumentation schemes |   |   | ✓ | ✓ | ✓ | ✓ |
| Connections (edges) |   | ✓ | ✓ | ✓ | ✓ | ✓ |
| Scopes |   |   | ✓ | ✓ | ✓ | ✓ |
| Attacks with type |   | ✓ |   | ✓ | ✓ | ✓ |
| Attack defenses |   |   |   | ✓ | ✓ | ✓ |
| Critical questions |   |   |   | ✓ | ✓ | ✓ |
| CQ answers |   |   |   | ✓ | ✓ | ✓ |
| Evidence links |   |   |   |   | ✓ | ✓ |
| Commitments |   |   |   |   | ✓ | ✓ |
| Participant data |   |   |   |   | ✓ | ✓ |
| Version history |   |   |   |   | ✓ | ✓ |

**Key insight**: Higher-level artifacts require more *complete* deliberation data. The platform should guide users toward completeness by showing "your deliberation can currently generate Level 2 artifacts; fill in CQs to unlock Level 3."

---

## Part IX: User Experience for Artifact Generation

### 9.1 The Generation Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ GENERATE DELIBERATION ARTIFACT                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Deliberation: "In Defense of Academic Agora"                                │
│ Completeness: 87% (CQs: 31/36 answered, Attacks: 7/7 addressed)           │
│                                                                             │
│ ┌─── Choose Artifact Type ─────────────────────────────────────────────┐   │
│ │                                                                      │   │
│ │  [○] Status Snapshot        Quick overview for dashboard             │   │
│ │  [○] Executive Brief        1-2 page summary for decision-makers     │   │
│ │  [●] Essay                  Natural language rendering               │   │
│ │  [○] Structured Brief       Prose + formal notation hybrid           │   │
│ │  [○] Thesis Brief           Full formal documentation                │   │
│ │  [○] Interactive Document   Web-based interactive exploration        │   │
│ │                                                                      │   │
│ │  ─────────────────────────────────────────────────────────────────── │   │
│ │                                                                      │   │
│ │  Purpose-Specific:                                                   │   │
│ │  [○] Academic Paper Draft    Scholarly prose with citations           │   │
│ │  [○] Grant Application       Problem, solution, plan format          │   │
│ │  [○] Teaching Summary        Accessible for students                 │   │
│ │  [○] Conference Handout      Key claims + visual map                 │   │
│ │                                                                      │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌─── Audience ─────────────────────────────────────────────────────────┐   │
│ │                                                                      │   │
│ │  [●] Expert (full formal notation)                                   │   │
│ │  [○] Academic (scholarly prose, moderate formalism)                   │   │
│ │  [○] General (accessible, minimal jargon)                            │   │
│ │  [○] Custom...                                                       │   │
│ │                                                                      │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌─── Options ──────────────────────────────────────────────────────────┐   │
│ │                                                                      │   │
│ │  Citation format: [Chicago ▾]                                        │   │
│ │  Include scopes: [✓ Hypothetical] [✓ Counterfactual] [✓ Conditional]│   │
│ │  Show confidence: [✓]                                                │   │
│ │  Show attack history: [✓]                                            │   │
│ │  Include evidence registry: [✓]                                      │   │
│ │  Output format: [Markdown ▾]                                         │   │
│ │                                                                      │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌─── Completeness Check ───────────────────────────────────────────────┐   │
│ │                                                                      │   │
│ │  Your deliberation can generate:                                     │   │
│ │  ✓ Status Snapshot (all data present)                                │   │
│ │  ✓ Executive Brief (all data present)                                │   │
│ │  ✓ Essay (all data present)                                          │   │
│ │  ✓ Structured Brief (all data present)                               │   │
│ │  ⚠ Thesis Brief (missing: 5 CQ answers, 2 evidence links)           │   │
│ │  ✓ Interactive Document (all data present)                           │   │
│ │                                                                      │   │
│ │  [Fill gaps ▸] to unlock Thesis Brief                                │   │
│ │                                                                      │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                              [Generate Artifact]                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 The "Fill Gaps" Workflow

When a user wants to generate a higher-level artifact but the deliberation is incomplete:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ COMPLETENESS GAPS FOR THESIS BRIEF                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Your deliberation is 87% complete for Thesis Brief generation.              │
│                                                                             │
│ MISSING ELEMENTS:                                                           │
│                                                                             │
│ ⚠ Unanswered Critical Questions (5):                                       │
│   □ A-201:CQ3 "Has this approach been validated in real-world use?"        │
│     [Answer now ▸]                                                          │
│   □ A-302:CQ3 "Will addressing these frustrations drive adoption?"         │
│     [Answer now ▸]                                                          │
│   □ A-402:CQ3 "What is the expected effect size?"                          │
│     [Answer now ▸]                                                          │
│   □ A-403:CQ1 "Will institutions credit contributions?"                   │
│     [Answer now ▸] [Mark as OPEN with rationale ▸]                         │
│   □ A-602:CQ3 "Is there a simpler solution?"                              │
│     [Answer now ▸]                                                          │
│                                                                             │
│ ⚠ Missing Evidence Links (2):                                              │
│   □ C-302: No evidence linked to "HSS frustrations" claim                  │
│     [Add evidence ▸]                                                        │
│   □ A-403: Credit system roadmap referenced but not linked                 │
│     [Link document ▸]                                                       │
│                                                                             │
│ ℹ Note: You can mark CQs as OPEN (deliberately unanswered) and the        │
│   Thesis Brief will include them as acknowledged open questions.            │
│                                                                             │
│ [Fill all gaps ▸]  [Generate anyway (with gaps noted) ▸]                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Post-Generation Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ GENERATED ARTIFACT                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌── Artifact Info ──────────────────────────────────────────────────────┐   │
│ │ Type: Structured Brief | Words: 4,237 | Sections: 12                 │   │
│ │ Generated: 2026-02-02 12:15 | From: v1.2.0 of deliberation          │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌── Actions ────────────────────────────────────────────────────────────┐   │
│ │ [📥 Download Markdown] [📥 Download PDF] [📥 Download DOCX]          │   │
│ │ [📋 Copy to clipboard] [🔗 Share link] [📧 Email]                    │   │
│ │ [✏️ Edit in document editor] [🔄 Regenerate with different settings]  │   │
│ │ [📌 Pin as release artifact]                                         │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌── Preview ────────────────────────────────────────────────────────────┐   │
│ │                                                                      │   │
│ │  # In Defense of Academic Agora                                      │   │
│ │                                                                      │   │
│ │  **Status**: DEFENDED | **Confidence**: 0.83 | **Release**: v1.2.0   │   │
│ │                                                                      │   │
│ │  ## Central Thesis                                                   │   │
│ │                                                                      │   │
│ │  > **THESIS-001**: Academic Agora should exist and be developed      │   │
│ │  > as infrastructure for scholarly discourse...                       │   │
│ │                                                                      │   │
│ │  ...                                                                 │   │
│ │                                                                      │   │
│ └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part X: The Regeneration Problem

### 10.1 When Deliberation State Changes

A key challenge: deliberation artifacts are snapshots, but deliberations are living. When the underlying deliberation changes (new attack, new argument, CQ answered), what happens to generated artifacts?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ARTIFACT LIFECYCLE                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ OPTION A: Immutable Snapshots (Recommended for formal releases)             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Generated artifact is tied to a specific deliberation version.         │ │
│ │ If deliberation changes, artifact stays the same.                      │ │
│ │ User can regenerate from new version → new artifact.                   │ │
│ │ Version lineage: Brief v1 (from delib v1.0) → Brief v2 (from v1.1)   │ │
│ │                                                                         │ │
│ │ Pro: Citable, stable, archival                                         │ │
│ │ Con: Can become stale                                                  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ OPTION B: Live Documents (Recommended for working drafts)                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Artifact re-renders when underlying data changes.                      │ │
│ │ Always reflects current deliberation state.                            │ │
│ │ Computed sections update automatically.                                │ │
│ │ Prose sections flagged for review when inputs change.                  │ │
│ │                                                                         │ │
│ │ Pro: Always current                                                    │ │
│ │ Con: Not stable for citation; prose may need regeneration              │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ RECOMMENDATION: Support both. "Pin" creates immutable snapshot.             │
│ "Live view" shows current state. Diff between versions available.          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Artifact Versioning

```typescript
model ArtifactVersion {
  id                 String   @id @default(cuid())
  deliberationId     String
  deliberation       Deliberation @relation(fields: [deliberationId], references: [id])
  
  // Version info
  version            String              // "v1.0.0", "v1.1.0", etc.
  deliberationVersion String             // Which delib version this was generated from
  
  // Artifact type
  artifactType       ArtifactType        // SNAPSHOT, EXECUTIVE, ESSAY, BRIEF, THESIS, INTERACTIVE
  
  // Generation config
  config             Json                // ArtifactTemplate + GenerationConfig
  
  // Content
  content            String              // Generated content (Markdown)
  renderedHTML       String?             // Pre-rendered HTML
  
  // Status
  status             ArtifactStatus      // DRAFT, PUBLISHED, SUPERSEDED
  pinned             Boolean @default(false)  // Immutable if true
  
  // Metadata
  wordCount          Int
  sectionCount       Int
  generatedAt        DateTime @default(now())
  generatedBy        User     @relation(fields: [generatedById], references: [id])
  generatedById      BigInt
  
  // Diff from previous
  changesSinceLastVersion Json?          // What changed in the deliberation
}
```

---

## Part XI: Open Design Questions

### 11.1 Technical Questions

1. **LLM selection**: Should the platform use its own LLM API, or let users bring their own? Latency and cost implications for long artifacts.

2. **Incremental generation**: For large deliberations (50+ arguments), generating the full thesis brief in one pass may be slow. Should we generate section-by-section with streaming?

3. **Caching**: If the deliberation hasn't changed, should we cache generated prose sections? What's the cache invalidation strategy?

4. **Determinism**: LLM generation is non-deterministic. Should we allow users to "lock" prose they like and only regenerate changed sections?

5. **Custom templates**: Should power users be able to create their own templates? What's the template authoring UX?

### 11.2 Design Questions

1. **Prose vs. structure balance**: Different users will want different ratios. How do we let them control this without overwhelming options?

2. **Argument box format**: ASCII boxes work in Markdown but look dated. Should we invest in proper typeset argument boxes for PDF/HTML?

3. **Color in exports**: Status colors are meaningful but PDF/print may be B&W. How to handle?

4. **Length control**: Same deliberation, same template, different desired lengths. How granular should length control be?

5. **Multi-author attribution**: For collaborative deliberations, how do we attribute sections to contributors?

### 11.3 Strategic Questions

1. **Is this a core platform feature or a premium feature?**

2. **Should the platform auto-generate artifacts on every release, or only on demand?**

3. **Can generated artifacts become a publishing format?** (i.e., journals accept Agora thesis briefs as submissions)

4. **Should there be a "deliberation → paper" pipeline?** (generate a full academic paper draft from deliberation data)

---

*This document explores the design space for deliberation output artifacts. The core architectural insight is: compute structure from data, generate prose from LLM, combine via templates. The result is a system that can produce artifacts ranging from dashboard snapshots to full formal thesis briefs from the same underlying deliberation data.*
