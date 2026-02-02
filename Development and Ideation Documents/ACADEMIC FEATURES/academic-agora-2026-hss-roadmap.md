# Academic Agora 2026: HSS Completion & Validation Roadmap

**Created**: January 31, 2026  
**Status**: Strategic Planning Document  
**Horizon**: 12 months (Q1 2026 - Q4 2026)  
**Goal**: Prove core value proposition with HSS scholars before STEM expansion

---

## Executive Summary

This roadmap focuses 2026 on **completing the HSS foundation and achieving real-world validation**. The strategy is to go deep before going broad—proving that structured discourse infrastructure actually improves scholarly outcomes for humanities and social sciences before investing in STEM-specific features.

**Success Criteria for 2026:**
- 5+ active pilot communities using the platform regularly
- 20+ scholars with substantive contribution histories
- 1+ published paper citing an Agora deliberation
- Validated adoption model with documented user journeys
- Clear signal on whether to proceed with STEM expansion

---

## Strategic Principles

### 1. Validate Before Building
Every feature should be tied to a testable hypothesis about user value. Instrument everything. Kill features that don't drive engagement.

### 2. Fit Existing Workflows
Scholars won't change how they work for a new tool. The tool must fit into reading, writing, teaching, and reviewing practices they already have.

### 3. Lower Barriers Progressively
Entry should be frictionless. Structure should emerge as value becomes clear, not as a prerequisite for participation.

### 4. Credit Must Be Legible
If participation doesn't "count" professionally, adoption will stall at enthusiasts. Build toward institutional recognition from day one.

### 5. Community Before Scale
Five deeply engaged pilot communities teach more than 500 casual signups. Focus on density of engagement, not breadth.

---

## Part I: Foundation Completion (Q1 2026)

### Phase 3.1: Claim Provenance & Versioning
**Timeline**: Weeks 1-4  
**Status**: Ready to Start

| Task | Description | Deliverable |
|------|-------------|-------------|
| 3.1.1 | Claim versioning schema | ClaimVersion model with diff tracking |
| 3.1.2 | Origin tracking | First assertion source, author, date |
| 3.1.3 | Canonical claim IDs | Cross-context identification |
| 3.1.4 | Challenge aggregation | Status dashboard for claim health |
| 3.1.5 | Consensus status computation | DEFENDED / CONTESTED / UNRESOLVED |

**New Addition: Claim Genealogy**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CLAIM GENEALOGY TRACKING                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ For HSS, claims don't just version—they have intellectual lineages:         │
│                                                                             │
│ • DERIVED_FROM: "This claim builds on Rawls's claim that..."                │
│ • RESPONDS_TO: "This claim responds to Nozick's objection..."               │
│ • SYNTHESIZES: "This claim combines insights from X and Y"                  │
│ • REVISES: "This claim modifies the earlier formulation by..."              │
│ • HISTORICIZES: "This claim recontextualizes the debate by..."              │
│                                                                             │
│ Value: Scholars can see the intellectual genealogy of any position,         │
│ not just its version history within the platform.                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Schema Addition:**
```prisma
model ClaimLineage {
  id              String   @id @default(cuid())
  descendantId    String
  descendant      Claim    @relation("Descendant", fields: [descendantId], references: [id])
  ancestorId      String
  ancestor        Claim    @relation("Ancestor", fields: [ancestorId], references: [id])
  
  lineageType     LineageType  // DERIVED_FROM, RESPONDS_TO, SYNTHESIZES, REVISES, HISTORICIZES
  explanation     String?      // How does this build on the ancestor?
  
  // For external ancestors (claims from literature not yet in system)
  externalAncestor ExternalClaimReference?
  
  createdAt       DateTime @default(now())
  createdBy       User     @relation(fields: [createdById], references: [id])
  createdById     BigInt
}

model ExternalClaimReference {
  id              String   @id @default(cuid())
  claimText       String          // The claim as formulated
  source          String          // "Rawls, A Theory of Justice, p. 302"
  doi             String?         // If from a paper
  author          String?
  year            Int?
  
  // Can be "lifted" into a full Claim later
  liftedToClaimId String?  @unique
  liftedToClaim   Claim?   @relation(fields: [liftedToClaimId], references: [id])
}
```

---

### Phase 3.2: Argument-Level Citations
**Timeline**: Weeks 5-8

| Task | Description | Deliverable |
|------|-------------|-------------|
| 3.2.1 | Argument permalinks | Stable, citable URIs |
| 3.2.2 | Typed argument links | SUPPORTS / EXTENDS / REFINES / RESPONDS |
| 3.2.3 | Citation export | BibTeX, RIS, Chicago, MLA |
| 3.2.4 | Cross-paper argument graph | Visual argument mapping |

**New Addition: Footnote-Style Citation Integration**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HSS CITATION CONVENTIONS                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ HSS scholars cite differently than STEM. Support their conventions:         │
│                                                                             │
│ • Chicago (Notes-Bibliography): Footnote-heavy, common in history           │
│ • MLA: Parenthetical, common in literature                                  │
│ • APA: Author-date, common in social sciences                               │
│ • Bluebook: Legal citation format                                           │
│ • Turabian: Dissertation standard                                           │
│                                                                             │
│ Feature: One-click export in any format, including:                         │
│ • Individual argument citation                                              │
│ • Deliberation snapshot citation                                            │
│ • Participant contribution summary                                          │
│ • "As discussed in Agora deliberation [URL], Smith (2024) argues..."        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**New Addition: Zotero/Mendeley Integration**
```typescript
interface ReferenceManagerIntegration {
  // Import references from user's library
  importFromZotero(userId: string, collectionId: string): Promise<ImportedReferences>;
  importFromMendeley(userId: string, folderId: string): Promise<ImportedReferences>;
  
  // Export deliberation references to library
  exportToZotero(deliberationId: string, userId: string): Promise<void>;
  exportToMendeley(deliberationId: string, userId: string): Promise<void>;
  
  // Sync: keep Agora citations updated in reference manager
  syncCitations(userId: string): Promise<SyncResult>;
  
  // Quick-add: cite while writing in Word/Docs
  generateCitationKey(argumentId: string, format: CitationFormat): string;
}
```

---

### Phase 3.3: Cross-Deliberation Mapping
**Timeline**: Weeks 9-12

| Task | Description | Deliverable |
|------|-------------|-------------|
| 3.3.1 | Claim equivalence detection | "Same claim in 3 other debates" |
| 3.3.2 | Federated claim registry | Global claim status view |
| 3.3.3 | Field-level claim view | Browse by discipline/topic |
| 3.3.4 | Import/reference claims | Cross-reference workflow |

**New Addition: Conceptual Mapping for HSS**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONCEPTUAL MAPPING LAYER                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ HSS debates often use the same word for different concepts, or different    │
│ words for the same concept. A conceptual mapping layer helps:               │
│                                                                             │
│ CONCEPT SYNONYMY:                                                           │
│ "Justice" (Rawls) ≈ "Fairness" (Rawls) ≈ "Equity" (some contexts)           │
│                                                                             │
│ CONCEPT DISAMBIGUATION:                                                     │
│ "Freedom" (Berlin, negative) ≠ "Freedom" (Berlin, positive)                 │
│ "Power" (Foucault) ≠ "Power" (Weber) ≠ "Power" (Lukes)                      │
│                                                                             │
│ CONCEPT TRANSLATION (across fields):                                        │
│ "Agency" (sociology) ↔ "Autonomy" (philosophy) ↔ "Self-efficacy" (psych)    │
│                                                                             │
│ Implementation:                                                             │
│ • ConceptNode model with synonymy/disambiguation relations                  │
│ • Claims can be tagged with concepts (not just keywords)                    │
│ • Cross-deliberation search by concept, not just text                       │
│ • "Related debates using similar concepts" recommendations                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Schema Addition:**
```prisma
model Concept {
  id              String   @id @default(cuid())
  name            String
  definition      String?
  field           String?          // "political philosophy", "sociology", etc.
  
  // Theoretical context
  theorist        String?          // "Foucault", "Rawls", etc.
  tradition       String?          // "Frankfurt School", "Analytic", etc.
  
  // Relations
  synonyms        ConceptRelation[] @relation("ConceptFrom")
  synonymOf       ConceptRelation[] @relation("ConceptTo")
  
  // Usage
  taggedClaims    ClaimConceptTag[]
  
  createdAt       DateTime @default(now())
}

model ConceptRelation {
  id              String   @id @default(cuid())
  fromConceptId   String
  fromConcept     Concept  @relation("ConceptFrom", fields: [fromConceptId], references: [id])
  toConceptId     String
  toConcept       Concept  @relation("ConceptTo", fields: [toConceptId], references: [id])
  
  relationType    ConceptRelationType  // SYNONYM, RELATED, BROADER, NARROWER, CONTRASTS_WITH
  explanation     String?
  
  // Who asserted this relation?
  assertedBy      User     @relation(fields: [assertedById], references: [id])
  assertedById    BigInt
  
  // Is this contested?
  contested       Boolean  @default(false)
  contestationDeliberationId String?
}

enum ConceptRelationType {
  SYNONYM           // Same concept, different term
  RELATED           // Conceptually connected
  BROADER           // More general concept
  NARROWER          // More specific concept
  CONTRASTS_WITH    // Explicitly opposed or distinguished
  THEORIST_SPECIFIC // Same term, theorist-specific meaning
}
```

---

## Part II: HSS-Specific Features (Q1-Q2 2026)

### Phase HSS-1: Enhanced Textual Engagement
**Timeline**: Weeks 5-12 (parallel with Phase 3.2-3.3)

**Rationale**: HSS scholarship is fundamentally about texts. The platform needs deep support for textual interpretation, not just citation.

#### HSS-1.1: Passage Interpretation System

Extend the existing Quote Node system for richer interpretive work:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PASSAGE INTERPRETATION SYSTEM                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PASSAGE: "Man is born free, and everywhere he is in chains."                │
│          — Rousseau, The Social Contract, Book I, Chapter 1                 │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ COMPETING INTERPRETATIONS                                               │ │
│ │                                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Interpretation A (Liberal Reading)              [12 endorsements]   │ │ │
│ │ │ "Rousseau laments the loss of natural freedom and calls for its    │ │ │
│ │ │ restoration through legitimate political authority."                │ │ │
│ │ │ Defended by: @liberalTheorist, @enlightenmentScholar               │ │ │
│ │ │ [View supporting arguments]                                         │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Interpretation B (Republican Reading)           [8 endorsements]    │ │ │
│ │ │ "Rousseau argues that true freedom is only possible through        │ │ │
│ │ │ participation in collective self-governance."                       │ │ │
│ │ │ Defended by: @republicanReader, @genevaScholar                     │ │ │
│ │ │ [View supporting arguments]                                         │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Interpretation C (Marxist Reading)              [5 endorsements]    │ │ │
│ │ │ "The 'chains' refer to socioeconomic conditions; Rousseau          │ │ │
│ │ │ prefigures critique of bourgeois freedom."                          │ │ │
│ │ │ Defended by: @criticalTheorist                                     │ │ │
│ │ │ [View supporting arguments]                                         │ │ │
│ │ └─────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ [Add new interpretation] [View interpretation debate]                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ TRANSLATION VARIANTS (for non-English sources)                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Original (French): "L'homme est né libre, et partout il est dans les   │ │
│ │ fers."                                                                  │ │
│ │                                                                         │ │
│ │ • Translation 1 (Cranston): "Man is born free..." [Standard]           │ │
│ │ • Translation 2 (Gourevitch): "Man is born free..." [Critical ed.]     │ │
│ │ • Translation note: "fers" literally "irons" — stronger than "chains"  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Schema:**
```prisma
model PassageInterpretation {
  id              String   @id @default(cuid())
  passageId       String
  passage         QuoteNode @relation(fields: [passageId], references: [id])
  
  interpretationText String
  interpretationType InterpretationType  // LITERAL, CONTEXTUAL, THEORETICAL, CRITICAL
  
  // Theoretical framing
  framework       String?              // "Liberal", "Marxist", "Feminist", etc.
  tradition       String?              // "Analytic", "Continental", etc.
  
  // Support
  endorsements    InterpretationEndorsement[]
  supportingArguments Argument[]
  
  // Linked claims (what claims does this interpretation support?)
  supportedClaims Claim[]
  
  createdAt       DateTime @default(now())
  createdBy       User     @relation(fields: [createdById], references: [id])
  createdById     BigInt
}

model TranslationVariant {
  id              String   @id @default(cuid())
  passageId       String
  passage         QuoteNode @relation(fields: [passageId], references: [id])
  
  originalLanguage String             // "French", "German", "Greek", etc.
  originalText    String
  
  translatedText  String
  translator      String?             // "Cranston", "Kaufmann", etc.
  edition         String?             // "Cambridge Critical Edition"
  year            Int?
  
  translationNotes String?            // Philological notes
  
  // Does translation choice affect interpretation?
  interpretiveSignificance String?
}
```

#### HSS-1.2: Theoretical Framework Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ THEORETICAL FRAMEWORK MAPPING                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ HSS claims are often framework-dependent. The same phenomenon gets          │
│ different treatment under different theoretical lenses.                     │
│                                                                             │
│ EXAMPLE TOPIC: "Explanation of social inequality"                           │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ FRAMEWORK: Marxist                                                      │ │
│ │ Core claim: "Inequality stems from class relations and capital          │ │
│ │ accumulation"                                                           │ │
│ │ Key concepts: Class, exploitation, surplus value, ideology              │ │
│ │ Canonical texts: Marx, Capital; Gramsci, Prison Notebooks               │ │
│ │ [View 23 claims in this framework]                                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ FRAMEWORK: Weberian                                                     │ │
│ │ Core claim: "Inequality is multidimensional: class, status, and party" │ │
│ │ Key concepts: Status groups, life chances, rationalization              │ │
│ │ Canonical texts: Weber, Economy and Society                             │ │
│ │ [View 18 claims in this framework]                                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ FRAMEWORK: Intersectional                                               │ │
│ │ Core claim: "Inequality operates through interlocking systems of        │ │
│ │ race, gender, class"                                                    │ │
│ │ Key concepts: Intersectionality, matrix of domination                   │ │
│ │ Canonical texts: Crenshaw (1989), Collins, Black Feminist Thought       │ │
│ │ [View 31 claims in this framework]                                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ CROSS-FRAMEWORK DELIBERATION:                                               │
│ "What explains contemporary wealth inequality?"                             │
│ • Claims from multiple frameworks can engage                                │
│ • System tracks which framework each claim operates within                  │
│ • Facilitates productive disagreement (not just talking past)              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Schema:**
```prisma
model TheoreticalFramework {
  id              String   @id @default(cuid())
  name            String              // "Marxist", "Liberal", "Poststructuralist"
  description     String
  
  // Intellectual context
  tradition       String?             // "Continental", "Analytic", "Critical Theory"
  field           String?             // "Political philosophy", "Sociology"
  
  // Core commitments
  coreCommitments String[]            // Key premises the framework assumes
  keyConcepts     Concept[]
  canonicalTexts  Citation[]
  
  // Figures
  majorFigures    String[]            // "Marx", "Foucault", etc.
  
  // Relations to other frameworks
  relatedFrameworks FrameworkRelation[] @relation("FromFramework")
  relatedTo       FrameworkRelation[] @relation("ToFramework")
  
  // Claims operating within this framework
  claims          ClaimFrameworkTag[]
}

model FrameworkRelation {
  id              String   @id @default(cuid())
  fromFrameworkId String
  fromFramework   TheoreticalFramework @relation("FromFramework", fields: [fromFrameworkId], references: [id])
  toFrameworkId   String
  toFramework     TheoreticalFramework @relation("ToFramework", fields: [toFrameworkId], references: [id])
  
  relationType    FrameworkRelationType  // EXTENDS, CRITIQUES, SYNTHESIZES, ALTERNATIVE_TO
  explanation     String?
}

model ClaimFrameworkTag {
  id              String   @id @default(cuid())
  claimId         String
  claim           Claim    @relation(fields: [claimId], references: [id])
  frameworkId     String
  framework       TheoreticalFramework @relation(fields: [frameworkId], references: [id])
  
  // How central is this claim to the framework?
  centrality      FrameworkCentrality  // CORE, DERIVED, APPLIED, CONTESTED
  
  taggedBy        User     @relation(fields: [taggedById], references: [id])
  taggedById      BigInt
}
```

#### HSS-1.3: Historiographical Layer

For historians, tracking how interpretations change over time is crucial:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HISTORIOGRAPHICAL TRACKING                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ TOPIC: "Causes of the French Revolution"                                    │
│                                                                             │
│ HISTORIOGRAPHICAL EVOLUTION:                                                │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 1790s-1800s: Contemporary accounts                                      │ │
│ │ Dominant view: Conspiracy / Breakdown of order                          │ │
│ │ Key figures: Burke, de Maistre                                          │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                          │                                                  │
│                          ▼                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 1850s-1920s: Liberal / Republican narrative                             │ │
│ │ Dominant view: Triumph of liberty and reason over despotism             │ │
│ │ Key figures: Michelet, Aulard                                           │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                          │                                                  │
│                          ▼                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 1920s-1970s: Marxist / Social interpretation                            │ │
│ │ Dominant view: Bourgeois revolution / class conflict                    │ │
│ │ Key figures: Lefebvre, Soboul                                           │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                          │                                                  │
│                          ▼                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 1970s-2000s: Revisionist challenge                                      │ │
│ │ Dominant view: Political/cultural causes; critique of social interp.    │ │
│ │ Key figures: Furet, Baker, Hunt                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                          │                                                  │
│                          ▼                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 2000s-present: Post-revisionist synthesis                               │ │
│ │ Dominant view: Multiple causation; attention to contingency             │ │
│ │ Key figures: McPhee, Tackett                                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ CURRENT DELIBERATION:                                                       │
│ "How should we understand the role of economic factors?"                    │ │
│ [View active debate] [15 participants] [42 claims]                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase HSS-2: Workflow Integration
**Timeline**: Weeks 8-16

**Rationale**: Adoption depends on fitting into existing scholarly workflows. Build bridges, not islands.

#### HSS-2.1: Reading & Annotation Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ READING INTEGRATION WORKFLOW                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ENTRY POINTS:                                                               │
│                                                                             │
│ 1. BROWSER EXTENSION                                                        │
│    • Highlight text on JSTOR, Google Books, institutional library           │
│    • "Discuss on Agora" → opens claim registration                          │
│    • See existing Agora discussion for any paper (via DOI matching)         │
│                                                                             │
│ 2. PDF ANNOTATION                                                           │
│    • Import highlights from PDF readers (Zotero PDF, Adobe, Hypothesis)     │
│    • Convert annotation to claim                                            │
│    • Link annotation to existing deliberation                               │
│                                                                             │
│ 3. REFERENCE MANAGER SYNC                                                   │
│    • Zotero: Sync reading notes → potential claims                          │
│    • See Agora discussions for items in your library                        │
│    • "Related deliberations" panel in Zotero                                │
│                                                                             │
│ 4. READING LIST IMPORT                                                      │
│    • Import syllabus / reading list                                         │
│    • See existing discussions for all readings                              │
│    • Create course-specific deliberation space                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### HSS-2.2: Writing Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WRITING INTEGRATION WORKFLOW                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ OUTPUTS FOR WRITING:                                                        │
│                                                                             │
│ 1. LITERATURE REVIEW EXPORT                                                 │
│    • Select deliberation or claim cluster                                   │
│    • Export as structured lit review draft                                  │
│    • Includes: positions, key debates, current status, citations            │
│    • Formats: Word, Markdown, LaTeX                                         │
│                                                                             │
│ 2. ANNOTATED BIBLIOGRAPHY GENERATION                                        │
│    • Select claims/arguments                                                │
│    • Generate annotated bibliography with:                                  │
│      - Citation                                                             │
│      - Key claims from source                                               │
│      - Current status of those claims                                       │
│      - Related debates                                                      │
│                                                                             │
│ 3. ARGUMENT OUTLINE EXPORT                                                  │
│    • Select defended thesis + supporting arguments                          │
│    • Export as paper outline:                                               │
│      - Introduction (thesis + stakes)                                       │
│      - Argument sections (from argument chains)                             │
│      - Objections & responses (from attacks/defenses)                       │
│      - Conclusion                                                           │
│                                                                             │
│ 4. REAL-TIME CITATION                                                       │
│    • Google Docs add-on                                                     │
│    • Word plugin                                                            │
│    • "Insert Agora citation" → search deliberations → insert                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### HSS-2.3: Teaching Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEACHING INTEGRATION WORKFLOW                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ COURSE SPACE FEATURES:                                                      │
│                                                                             │
│ 1. SEMINAR DISCUSSION MODE                                                  │
│    • Import syllabus readings                                               │
│    • Weekly discussion threads per reading                                  │
│    • Students must: (a) register a claim, (b) respond to peer              │
│    • Instructor can see participation, quality signals                      │
│    • Gradebook integration (LMS export)                                     │
│                                                                             │
│ 2. THESIS DEFENSE SIMULATION                                                │
│    • Student posts thesis with supporting arguments                         │
│    • Peers play "committee" - raise objections                              │
│    • Student must defend in structured format                               │
│    • Excellent preparation for actual defense                               │
│                                                                             │
│ 3. HISTORIOGRAPHICAL EXERCISE                                               │
│    • "Map the historiography of [topic]"                                    │
│    • Students collaboratively build historiographical layers                │
│    • Track how interpretations evolved                                      │
│    • Produces reusable resource                                             │
│                                                                             │
│ 4. PEER REVIEW TRAINING                                                     │
│    • Students practice structured critique                                  │
│    • Learn to use argument schemes                                          │
│    • Learn to formulate fair but rigorous challenges                        │
│    • Feedback from instructor on critique quality                           │
│                                                                             │
│ 5. COLLABORATIVE COMMENTARY                                                 │
│    • Class collectively annotates primary source                            │
│    • Competing interpretations emerge                                       │
│    • Instructor can guide toward key questions                              │
│    • Archive for future semesters                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Teaching-Specific Features:**
```prisma
model CourseSpace {
  id              String   @id @default(cuid())
  name            String              // "Phil 301: Political Philosophy"
  institution     String?
  term            String?             // "Fall 2026"
  
  instructor      User     @relation(fields: [instructorId], references: [id])
  instructorId    BigInt
  
  // Enrolled students
  enrollments     CourseEnrollment[]
  
  // Readings
  syllabus        SyllabusItem[]
  
  // Deliberations
  deliberations   Deliberation[]
  
  // Grading
  participationSettings ParticipationSettings?
  
  // Privacy
  visibility      CourseVisibility    // PUBLIC, INSTITUTION, ENROLLED_ONLY
  
  createdAt       DateTime @default(now())
}

model ParticipationSettings {
  id              String   @id @default(cuid())
  courseSpaceId   String   @unique
  courseSpace     CourseSpace @relation(fields: [courseSpaceId], references: [id])
  
  // Requirements
  claimsPerWeek   Int?
  responsesPerWeek Int?
  
  // Grading criteria
  gradingRubric   Json?              // Structured rubric
  
  // LMS export
  lmsIntegration  LMSType?           // CANVAS, BLACKBOARD, MOODLE
  lmsCourseId     String?
}
```

---

### Phase HSS-3: Publication & Credit Integration
**Timeline**: Weeks 12-20

**Rationale**: If participation doesn't count professionally, adoption stalls at enthusiasts.

#### HSS-3.1: Journal Club & Seminar Templates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ JOURNAL CLUB TEMPLATE                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PRE-BUILT WORKFLOW FOR JOURNAL CLUBS:                                       │
│                                                                             │
│ PHASE 1: PAPER SELECTION (Week before meeting)                              │
│ • Facilitator posts paper with key claims pre-extracted                     │
│ • Participants can suggest additional claims to discuss                     │
│ • Vote on focus areas                                                       │
│                                                                             │
│ PHASE 2: ASYNC PRE-DISCUSSION (Before meeting)                              │
│ • Participants register initial reactions                                   │
│ • Raise clarifying questions                                                │
│ • Identify potential challenges                                             │
│                                                                             │
│ PHASE 3: SYNCHRONOUS DISCUSSION (During meeting)                            │
│ • Shared screen with claim/argument view                                    │
│ • Real-time argument registration                                           │
│ • Facilitator can mark key moments                                          │
│                                                                             │
│ PHASE 4: POST-DISCUSSION SYNTHESIS (After meeting)                          │
│ • Capture what was resolved/unresolved                                      │
│ • Generate "state of discussion" snapshot                                   │
│ • Identify follow-up questions                                              │
│                                                                             │
│ PHASE 5: ARCHIVE                                                            │
│ • Discussion becomes searchable record                                      │
│ • Future readers can see how group engaged with paper                       │
│ • Can be cited in subsequent work                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### HSS-3.2: Book Review Deliberation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BOOK REVIEW DELIBERATION FORMAT                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Traditional book reviews are one-shot and monologic. Agora enables:         │
│                                                                             │
│ STRUCTURE:                                                                  │
│ 1. BOOK REGISTRATION                                                        │
│    • Key claims extracted (by author, curator, or AI-assisted)              │
│    • Chapter-by-chapter or thematic organization                            │
│                                                                             │
│ 2. CRITICAL NOTICE (Initial review)                                         │
│    • Reviewer posts structured assessment                                   │
│    • Identifies strengths, weaknesses, contributions                        │
│    • Raises specific challenges to claims                                   │
│                                                                             │
│ 3. AUTHOR RESPONSE                                                          │
│    • Author can respond to challenges                                       │
│    • Clarify misunderstandings                                              │
│    • Concede valid critiques                                                │
│    • Defend contested claims                                                │
│                                                                             │
│ 4. ONGOING DISCUSSION                                                       │
│    • Other scholars can contribute                                          │
│    • New evidence/arguments can be added                                    │
│    • Discussion persists beyond initial review                              │
│                                                                             │
│ 5. SYNTHESIS RELEASE                                                        │
│    • Periodic snapshots: "State of reception"                               │
│    • What's defended, contested, revised                                    │
│    • Useful for future readers, tenure committees                           │
│                                                                             │
│ VALUE: Reviews become living documents, not tombstones                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### HSS-3.3: Conference Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONFERENCE INTEGRATION                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ CONFERENCE WORKFLOW:                                                        │
│                                                                             │
│ 1. PRE-CONFERENCE                                                           │
│    • Papers posted with key claims extracted                                │
│    • Attendees can review, prepare questions                                │
│    • Async discussion before sessions                                       │
│                                                                             │
│ 2. DURING SESSION                                                           │
│    • Commentator's prepared response in platform                            │
│    • Q&A captured in structured format                                      │
│    • Key challenges registered                                              │
│                                                                             │
│ 3. POST-CONFERENCE                                                          │
│    • Discussion continues                                                   │
│    • Author can respond to Q&A points                                       │
│    • Non-attendees can participate                                          │
│    • "Conference proceedings" as deliberation snapshot                      │
│                                                                             │
│ PARTNERSHIPS:                                                               │
│ • APA (American Philosophical Association)                                  │
│ • AHA (American Historical Association)                                     │
│ • MLA (Modern Language Association)                                         │
│ • APSA (American Political Science Association)                             │
│ • ASA (American Sociological Association)                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### HSS-3.4: Credit & Portfolio System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCHOLARLY CONTRIBUTION PORTFOLIO                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PROFILE: Dr. Jane Scholar (@jscholar)                                       │
│ Affiliation: University of Example, Philosophy                              │
│ ORCID: 0000-0001-2345-6789                                                  │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ CONTRIBUTION SUMMARY                                                    │ │
│ │                                                                         │ │
│ │ Claims curated:              47                                         │ │
│ │ Arguments contributed:       123                                        │ │
│ │ Challenges raised:           34                                         │ │
│ │ Defenses mounted:            28                                         │ │
│ │ Interpretations proposed:    12                                         │ │
│ │ Deliberations participated:  15                                         │ │
│ │                                                                         │ │
│ │ Defense rate: 78% of challenged claims successfully defended            │ │
│ │ Critique quality: 85% of challenges acknowledged as substantive         │ │
│ │ Synthesis contributions: 3 deliberation releases cite your work         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ NOTABLE CONTRIBUTIONS                                                   │ │
│ │                                                                         │ │
│ │ ⭐ "Rawls vs. Capabilities" deliberation                                │ │
│ │    Your defense of the capabilities critique is cited in 5 papers       │ │
│ │                                                                         │ │
│ │ ⭐ "Democratic Legitimacy" concept mapping                              │ │
│ │    Your framework synthesis adopted by 3 subsequent deliberations       │ │
│ │                                                                         │ │
│ │ ⭐ "Berlin's Two Freedoms" passage interpretation                       │ │
│ │    Your reading endorsed by 23 scholars                                 │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ [Export to ORCID] [Generate CV section] [Institutional report]             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Portfolio Export Formats:**

```typescript
interface PortfolioExport {
  // ORCID integration
  pushToOrcid(userId: string): Promise<OrcidUpdateResult>;
  
  // CV section generation
  generateCVSection(userId: string, options: {
    format: 'latex' | 'word' | 'markdown';
    sections: ('claims' | 'arguments' | 'deliberations' | 'interpretations')[];
    dateRange?: { start: Date; end: Date };
  }): Promise<string>;
  
  // Institutional reporting
  generateInstitutionalReport(userId: string, options: {
    reportType: 'annual' | 'tenure' | 'promotion';
    includeMetrics: boolean;
    includeNarratives: boolean;
  }): Promise<Report>;
  
  // Alt-metrics
  generateAltmetrics(userId: string): Promise<{
    engagementScore: number;
    influenceScore: number;
    collaborationScore: number;
    breakdown: MetricsBreakdown;
  }>;
}
```

---

## Part III: Pilot Deployment & Validation (Q2 2026)

### Phase Pilot-1: Community Selection & Preparation
**Timeline**: Weeks 12-16

#### Target Communities (Prioritized)

| Community | Field | Size | Why Target | Contact Strategy |
|-----------|-------|------|------------|------------------|
| **Philosophy of Mind** | Philosophy | Medium | Active debates (consciousness), methodologically engaged | APA listserv; PhilPapers featured |
| **Democratic Theory** | Political Phil | Medium | Timely (democratic crisis), cross-disciplinary | APSA theory section; reading groups |
| **Intellectual History** | History | Medium | Historiography-focused, archival | H-Net; Toynbee Prize Foundation |
| **Digital Humanities** | Interdisciplinary | Small | Tech-comfortable, reflexive about methods | DH Slack; ACH |
| **Critical Theory** | Interdisciplinary | Medium | Theoretically sophisticated, engaged | Critical Theory conference; Telos |

#### Pilot Preparation Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PILOT PREPARATION CHECKLIST                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ COMMUNITY-SIDE:                                                             │
│ □ Identify champion scholar (respected, willing to model use)               │
│ □ Recruit 5-10 core participants committed to 3-month trial                 │
│ □ Identify specific debate/text for initial seeding                         │
│ □ Schedule kickoff session (onboarding + first deliberation)                │
│ □ Establish communication channel (Slack/Discord for support)               │
│                                                                             │
│ PLATFORM-SIDE:                                                              │
│ □ Create community space with appropriate permissions                       │
│ □ Seed with 10-20 key claims from canonical texts                           │
│ □ Configure discipline-specific claim types                                 │
│ □ Set up instrumentation (usage tracking, feedback prompts)                 │
│ □ Prepare onboarding materials (video, guide, FAQ)                          │
│ □ Establish support protocol (response time, escalation)                    │
│                                                                             │
│ MEASUREMENT:                                                                │
│ □ Define success metrics (see below)                                        │
│ □ Set up analytics dashboard                                                │
│ □ Schedule check-in interviews (2-week, 6-week, 12-week)                    │
│ □ Prepare feedback survey                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase Pilot-2: Seeded Content & Launch
**Timeline**: Weeks 16-20

#### Content Seeding Strategy

| Seed Type | Purpose | Amount |
|-----------|---------|--------|
| **Canonical claims** | Anchor points for discussion | 20-30 per community |
| **Classic debates** | Structured representation of known disputes | 2-3 per community |
| **Recent controversy** | Current engagement hook | 1 per community |
| **Champion's work** | Model for how to use platform | 5-10 claims from champion's papers |

#### Launch Sequence

```
Week 16: Soft launch (champion + 2-3 colleagues)
Week 17: Expand to core participants (5-10)
Week 18: First structured deliberation event
Week 19: Open to broader community (invited)
Week 20: First snapshot/release
```

### Phase Pilot-3: Measurement & Iteration
**Timeline**: Weeks 20-36

#### Success Metrics

| Metric | Target (3 months) | Measurement |
|--------|-------------------|-------------|
| **Weekly active users** | 50%+ of enrolled return weekly | Analytics |
| **Claims created** | 100+ per community | Database query |
| **Response rate** | 60%+ claims receive substantive response | Computed |
| **Argument chain depth** | Average chain length > 3 | Computed |
| **Cross-reference rate** | 20%+ claims link to other deliberations | Computed |
| **Release creation** | 1+ release per community | Count |
| **User satisfaction** | NPS > 40 | Survey |
| **Workflow integration** | 30%+ report using for actual research | Survey |

#### Qualitative Indicators

| Indicator | How Assessed |
|-----------|--------------|
| **Discourse quality** | Expert review of sample threads |
| **Intellectual progress** | Do debates advance? Pre/post comparison |
| **Community formation** | Do participants engage across threads? |
| **Workflow fit** | User interviews on integration with practice |
| **Career safety** | Any negative consequences reported? |

#### Iteration Triggers

| Signal | Response |
|--------|----------|
| Low engagement | Simplify interface; reduce friction |
| Low response rate | Add prompts; notification tuning |
| Shallow arguments | Better scheme guidance; examples |
| Negative feedback on structure | Make formalization more optional |
| Requests for features | Prioritize roadmap accordingly |
| Unexpectedly high engagement | Double down; expand community |

---

## Part IV: Phase 4 Completion & Expansion (Q3-Q4 2026)

### Phase 4.1: Open Review System
**Timeline**: Weeks 24-32

| Task | Description | Deliverable |
|------|-------------|-------------|
| 4.1.1 | Review deliberation template | Structured review workflow |
| 4.1.2 | Reviewer commitment tracking | Track positions through review |
| 4.1.3 | Author response workflow | Formal response mechanism |
| 4.1.4 | Living review | Post-publication ongoing review |
| 4.1.5 | Review quality signals | Constructiveness metrics |

### Phase 4.2: Reputation System
**Timeline**: Weeks 28-36

| Task | Description | Deliverable |
|------|-------------|-------------|
| 4.2.1 | Contribution metrics | Claims, arguments, defenses tracked |
| 4.2.2 | Defense rate computation | "X% successfully defended" |
| 4.2.3 | Reviewer recognition | Credit for constructive critique |
| 4.2.4 | Quality signals | Badge system for high-quality contributions |
| 4.2.5 | Gaming resistance | Prevent metric manipulation |

### Phase 4.3: Credit Integration
**Timeline**: Weeks 32-40

| Task | Description | Deliverable |
|------|-------------|-------------|
| 4.3.1 | ORCID sync | Push contributions to ORCID profile |
| 4.3.2 | CV export | JSON/PDF/LaTeX export for CVs |
| 4.3.3 | Institutional reporting | Reports for tenure/review committees |
| 4.3.4 | Alt-metrics integration | Engagement metrics for impact tracking |

### Phase 5: Interdisciplinary Bridge (Begins Q4)
**Timeline**: Weeks 36-48

| Task | Description | Deliverable |
|------|-------------|-------------|
| 5.1 | Concept mapping engine | Link equivalent concepts across fields |
| 5.2 | Translation deliberations | Negotiate cross-field terminology |
| 5.3 | Collaboration matching | Find researchers on related problems |
| 5.4 | Field taxonomies | Structured discipline/sub-discipline trees |

---

## Part V: Decision Points & Off-Ramps

### STEM Expansion Decision Point: Week 40

**Decision Criteria:**

| Criterion | Threshold for "Go" | Measurement |
|-----------|-------------------|-------------|
| **Pilot success** | 3+ communities with sustained engagement | Analytics |
| **User satisfaction** | NPS > 50 | Survey |
| **Workflow integration** | 40%+ using for real research | Survey |
| **Citation** | 1+ paper citing Agora deliberation | Publication tracking |
| **Resource availability** | Funding secured for 18+ months | Financial |
| **Team capacity** | Engineering bandwidth available | Resource assessment |

**If Go:** Begin STEM Phase 1 (Foundation) in Q1 2027, starting with Psychology/Social Sciences bridge disciplines.

**If No-Go:** 
- Analyze failure modes
- Consider pivot (different disciplines? different features? different positioning?)
- Or: Double down on HSS with refined approach

### Pivot Triggers (Throughout 2026)

| Signal | Potential Pivot |
|--------|-----------------|
| Scholars love structure but not specific features | Simplify; focus on what works |
| Scholars want less structure, more discussion | Lean toward comment-forum; reduce formalism |
| Strong demand from unexpected community | Serve them; revise target |
| Integration with existing tool critical | Build deeper integration, pause other features |
| Teaching use case dominates | Pivot toward LMS/ed-tech positioning |

---

## Part VI: Resource Requirements

### Engineering Priorities

| Quarter | Focus | Effort |
|---------|-------|--------|
| Q1 | Phase 3 (Knowledge Graph) + HSS-1 (Textual) | 70% |
| Q2 | Phase 3 completion + Pilot support + HSS-2 (Workflow) | 60% |
| Q3 | Phase 4.1-4.2 + Pilot iteration | 60% |
| Q4 | Phase 4.3 + Phase 5 foundation + STEM decision | 50% |

### Non-Engineering Priorities

| Role | Focus |
|------|-------|
| **Community** | Champion recruitment, pilot management, user support |
| **Content** | Seeding, documentation, onboarding materials |
| **Partnerships** | APA/AHA/MLA outreach, journal discussions, grant applications |
| **Research** | Usage analysis, user interviews, publication tracking |

### Grant Targets

| Agency | Program | Fit | Timeline |
|--------|---------|-----|----------|
| **NEH** | Digital Humanities Advancement | High | Apply Q1 |
| **Mellon** | Scholarly Communications | High | Apply Q2 |
| **NSF** | Cyberinfrastructure | Medium | Apply Q3 |
| **Sloan** | Scholarly Infrastructure | Medium | Ongoing |

---

## Part VII: Summary Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           2026 TIMELINE OVERVIEW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Q1 2026 (Weeks 1-12)                                                        │
│ ├── Phase 3.1: Claim Provenance [Weeks 1-4]                                 │
│ ├── Phase 3.2: Argument Citations [Weeks 5-8]                               │
│ ├── Phase 3.3: Cross-Deliberation [Weeks 9-12]                              │
│ ├── HSS-1: Enhanced Textual Engagement [Parallel, Weeks 5-12]               │
│ └── Pilot preparation [Weeks 8-12]                                          │
│                                                                             │
│ Q2 2026 (Weeks 13-24)                                                       │
│ ├── HSS-2: Workflow Integration [Weeks 12-20]                               │
│ ├── Pilot Launch [Week 16]                                                  │
│ ├── Pilot Iteration [Weeks 20-24]                                           │
│ └── HSS-3: Publication & Credit [Begins Week 12]                            │
│                                                                             │
│ Q3 2026 (Weeks 25-36)                                                       │
│ ├── Phase 4.1: Open Review [Weeks 24-32]                                    │
│ ├── Phase 4.2: Reputation [Weeks 28-36]                                     │
│ ├── Pilot Analysis & Expansion [Ongoing]                                    │
│ └── Grant applications [NEH, Mellon]                                        │
│                                                                             │
│ Q4 2026 (Weeks 37-48)                                                       │
│ ├── Phase 4.3: Credit Integration [Weeks 32-40]                             │
│ ├── Phase 5: Interdisciplinary Bridge [Begins Week 36]                      │
│ ├── STEM Decision Point [Week 40]                                           │
│ └── 2027 Planning [Weeks 44-48]                                             │
│                                                                             │
│ KEY MILESTONES:                                                             │
│ ◆ Week 16: First pilot community live                                       │
│ ◆ Week 24: 3+ pilot communities active                                      │
│ ◆ Week 32: First paper citing Agora deliberation (target)                   │
│ ◆ Week 40: STEM expansion decision                                          │
│ ◆ Week 48: 2026 retrospective; 2027 roadmap finalized                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix A: New HSS-Specific Features Summary

| Feature | Description | Phase | Priority |
|---------|-------------|-------|----------|
| **Claim Genealogy** | Track intellectual lineage of claims | 3.1 | High |
| **Concept Mapping** | Synonymy, disambiguation, cross-field translation | 3.3 | High |
| **Passage Interpretation System** | Competing readings with endorsements | HSS-1 | High |
| **Translation Variants** | Original language + multiple translations | HSS-1 | Medium |
| **Theoretical Framework Mapping** | Claims tagged by framework | HSS-1 | High |
| **Historiographical Layers** | Track interpretation evolution over time | HSS-1 | Medium |
| **Zotero/Mendeley Integration** | Reference manager sync | HSS-2 | High |
| **Browser Extension** | "Discuss on Agora" from any page | HSS-2 | High |
| **Literature Review Export** | Generate draft lit reviews | HSS-2 | Medium |
| **Annotated Bibliography Generation** | Structured bibliographies | HSS-2 | Medium |
| **Course Space** | Teaching-specific features | HSS-2 | High |
| **Seminar Discussion Mode** | Weekly discussion workflow | HSS-2 | High |
| **Journal Club Template** | Pre-built journal club workflow | HSS-3 | High |
| **Book Review Deliberation** | Multi-turn review format | HSS-3 | Medium |
| **Conference Integration** | Pre/during/post conference workflow | HSS-3 | Medium |
| **Scholarly Portfolio** | Contribution tracking and export | HSS-3 | High |
| **ORCID Push** | Credit integration | 4.3 | High |

---

## Appendix B: Argument Schemes Most Relevant for HSS

Beyond the Walton schemes already implemented, prioritize these for HSS:

| Scheme | HSS Application | Priority |
|--------|-----------------|----------|
| **Argument from Interpretation** | Textual exegesis | High |
| **Argument from Authority (Textual)** | "According to Foucault..." | High |
| **Argument from Conceptual Analysis** | Definitional arguments | High |
| **Argument from Historical Context** | Contextualist interpretation | High |
| **Argument from Precedent** | Legal/political philosophy | High |
| **Argument from Coherence** | Internal consistency | Medium |
| **Argument from Reflective Equilibrium** | Normative theory | Medium |
| **Argument from Thought Experiment** | Philosophical method | Medium |
| **Argument from Counterexample** | Philosophical critique | High |
| **Argument from Analogy (Historical)** | Comparative history | Medium |
| **Argument from Silence** | Historical method | Low |
| **Argument from Best Explanation** | Inference to explanation | Medium |

---

## Appendix C: Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Low pilot engagement** | Medium | High | Multiple communities; iterate fast |
| **Structure too heavy** | Medium | Medium | Progressive formalization; user testing |
| **Structure too light** | Low | Medium | Add structure based on demand |
| **Champion burnout** | Medium | High | Distributed leadership; support champions |
| **No citation in 12 months** | Medium | Medium | Actively support publication pathway |
| **Funding gap** | Medium | High | Multiple grant applications; runway planning |
| **Competing platform emerges** | Low | Medium | Move fast; build community moat |
| **Technical debt accumulation** | Medium | Medium | Dedicated refactoring time |
| **Scope creep** | High | Medium | Strict prioritization; say no |

---

*This roadmap is a living document. Monthly reviews will assess progress against milestones and adjust priorities as needed.*
