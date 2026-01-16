# Phase 5: Interdisciplinary Bridge — Cross-Field Mapping

**Timeline:** Q1 2027  
**Effort:** 6-8 weeks  
**Theme:** *Connecting epistemic vocabularies across disciplines*

---

## Phase 5 Vision

Academic disciplines often discover the same phenomena using different terminology, or wrestle with analogous problems using incompatible frameworks. Phase 5 builds the infrastructure to bridge these epistemic gaps.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTERDISCIPLINARY BRIDGE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   PHILOSOPHY         SOCIOLOGY         PSYCHOLOGY                   │
│   ──────────         ─────────         ──────────                   │
│   "Agency"           "Structure"       "Self-Efficacy"              │
│       │                  │                  │                       │
│       └─────────────┬────┴─────────────────┘                       │
│                     │                                               │
│              ┌──────▼──────┐                                       │
│              │  CONCEPT    │                                       │
│              │  MAPPING    │                                       │
│              │  ENGINE     │                                       │
│              └──────┬──────┘                                       │
│                     │                                               │
│         ┌───────────┼───────────┐                                  │
│         │           │           │                                  │
│   ┌─────▼─────┐ ┌───▼───┐ ┌────▼────┐                             │
│   │ CROSS-    │ │TRANS- │ │ COLLAB  │                             │
│   │ FIELD     │ │LATION │ │ MATCH   │                             │
│   │ ALERTS    │ │SPACES │ │ ENGINE  │                             │
│   └───────────┘ └───────┘ └─────────┘                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Phases

| Sub-Phase | Focus | Parts |
|-----------|-------|-------|
| **5.1** | Cross-Field Claim Mapping | 2-3 |
| **5.2** | Translation Deliberations | 2-3 |
| **5.3** | Collaboration Matching | 2-3 |

---

## Core Problem Statements

### 5.1: Cross-Field Claim Mapping
> "I discovered something in philosophy that sociologists already know by a different name—but I couldn't find it because they use different terms."

### 5.2: Translation Deliberations  
> "Economists and political scientists disagree about 'rationality'—we need a space to negotiate what each field means and find common ground."

### 5.3: Collaboration Matching
> "Someone in another field is working on the same problem from a complementary angle. How do I find them?"

---

## Key Models

### Concept Equivalence
```
ConceptEquivalence
├── sourceConceptId
├── targetConceptId
├── equivalenceType (SAME | SIMILAR | OVERLAPPING | RELATED | TRANSLATES_TO)
├── confidence
├── fieldA → Field
├── fieldB → Field
├── verifiedBy[] → User
└── deliberationId (where mapping was negotiated)
```

### Field/Discipline Taxonomy
```
AcademicField
├── name
├── parentField? → AcademicField
├── aliases[]
├── keyTerms[]
├── epistemicStyle (EMPIRICAL | INTERPRETIVE | FORMAL | NORMATIVE)
└── relatedFields[]
```

### Collaboration Match
```
CollaborationMatch
├── userId
├── matchedUserId
├── matchType (SIMILAR_POSITION | COMPLEMENTARY_ATTACK | SHARED_INTEREST | BRIDGE_POTENTIAL)
├── basedOnClaims[] → Claim
├── matchScore
├── status (SUGGESTED | CONTACTED | DECLINED | COLLABORATING)
└── sharedDeliberations[]
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Cross-field concept links created | 500+ in first quarter |
| Translation deliberation completion rate | 60% reach resolution |
| Collaboration matches leading to interaction | 20% of suggestions |
| Scholar satisfaction with cross-field discovery | 4+/5 rating |

---

## Integration Points

### From Earlier Phases
- **Phase 1:** Claim types enable field-appropriate categorization
- **Phase 2:** Deliberation templates enable translation spaces
- **Phase 3:** Claim provenance tracks concept origins
- **Phase 4:** Reputation system credits bridge-building

### Enables Phase 6
- Cross-field discoveries power collaboration recommendations
- Concept mappings enrich embeddable content
- Translation outcomes exportable for external tools

---

## Documents in This Phase

1. `PHASE_5.1_CROSS_FIELD_MAPPING.md` (Parts 1-2) — Concept equivalence, field tagging, alerts
2. `PHASE_5.2_TRANSLATION_DELIBERATIONS.md` (Parts 1-2) — Negotiation spaces, bridge claims
3. `PHASE_5.3_COLLABORATION_MATCHING.md` (Parts 1-2) — Similarity matching, recommendations

---

*Phase 5 turns Academic Agora from a platform for disciplinary discourse into a bridge for interdisciplinary synthesis.*
