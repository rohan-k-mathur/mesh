# Evidence Guidance ↔ Citation System Bridge

## Problem Statement

Two parallel evidence systems exist without integration:

1. **Citation System** (Unified, Active)
   - Tables: `Citation`, `Source`
   - Components: `CitationCollector`, `PropositionComposerPro`
   - APIs: `/api/citations/resolve`, `/api/citations/attach`
   - **Stores:** URLs, DOIs, library references with metadata
   
2. **Evidence Guidance System** (Scheme-Based, Isolated)
   - Components: `EvidenceGuidance`, `EvidenceValidator`, `EvidenceSchemeMapper`
   - Types: `EvidenceItem`, `EvidenceRequirement`, `EvidenceType`
   - **Analyzes:** Evidence quality, scheme requirements, validation

**Goal:** Bridge these systems so citations are automatically assessed against scheme requirements.

---

## Architecture

### Data Flow

```
User adds citation
    ↓
CitationCollector → POST /api/citations/attach
    ↓
Citation record created
    ↓
🌉 BRIDGE LAYER (NEW)
    ↓
Citation → EvidenceItem mapping
    ↓
EvidenceValidator analyzes
    ↓
Display quality feedback
```

---

## Implementation Plan

### Phase 1: Mapping Layer (1-2 hours)

Create utility to convert Citations → EvidenceItems for analysis.

**File:** `lib/evidence/citationEvidenceMapper.ts`

```typescript
// lib/evidence/citationEvidenceMapper.ts
import type { Citation, Source } from "@prisma/client";
import type { 
  EvidenceItem, 
  EvidenceType, 
  EvidenceQuality 
} from "@/components/argumentation/EvidenceGuidance";

type CitationWithSource = Citation & { source: Source };

/**
 * Infer evidence type from citation content and metadata
 */
export function inferEvidenceType(citation: CitationWithSource): EvidenceType {
  const platform = citation.source.platform?.toLowerCase();
  const kind = citation.source.kind?.toLowerCase();
  const title = citation.source.title?.toLowerCase() || "";
  const quote = citation.quote?.toLowerCase() || "";
  
  // Expert testimony indicators
  if (
    platform === "pubmed" ||
    platform === "arxiv" ||
    quote.includes("according to") ||
    quote.includes("expert") ||
    title.includes("study") ||
    title.includes("research")
  ) {
    return "expert-testimony";
  }
  
  // Statistical data indicators
  if (
    quote.includes("%") ||
    quote.includes("study found") ||
    quote.includes("data show") ||
    title.includes("statistics") ||
    title.includes("survey") ||
    platform === "census"
  ) {
    return "statistical-data";
  }
  
  // Documentary evidence
  if (
    kind === "pdf" ||
    platform === "library" ||
    title.includes("report") ||
    title.includes("document") ||
    citation.source.doi
  ) {
    return "documentary-evidence";
  }
  
  // Causal evidence
  if (
    quote.includes("because") ||
    quote.includes("therefore") ||
    quote.includes("leads to") ||
    quote.includes("causes")
  ) {
    return "causal-evidence";
  }
  
  // Example
  if (
    quote.includes("for example") ||
    quote.includes("for instance") ||
    quote.includes("such as")
  ) {
    return "example";
  }
  
  // Default: general evidence
  return "general-evidence";
}

/**
 * Assess citation quality based on metadata richness and source credibility
 */
export function assessCitationQuality(citation: CitationWithSource): {
  quality: EvidenceQuality;
  strengthScore: number;
  issues: string[];
} {
  let score = 50; // baseline
  const issues: string[] = [];
  
  // Platform credibility boost
  const platform = citation.source.platform?.toLowerCase();
  if (platform === "arxiv" || platform === "pubmed" || platform === "ieee") {
    score += 25;
  } else if (platform === "library") {
    score += 15;
  } else if (platform === "wikipedia") {
    score -= 10;
    issues.push("Wikipedia is not considered a primary source");
  }
  
  // DOI = academic publication
  if (citation.source.doi) {
    score += 20;
  } else {
    issues.push("No DOI found - consider using peer-reviewed sources");
  }
  
  // Authors metadata
  if (citation.source.authorsJson) {
    score += 10;
  } else {
    issues.push("No author information - source credibility unclear");
  }
  
  // Specific excerpt quote
  if (citation.quote && citation.quote.length > 20) {
    score += 15;
  } else {
    issues.push("No specific quote - add an excerpt to strengthen evidence");
  }
  
  // Locator (page number, section)
  if (citation.locator) {
    score += 10;
  } else {
    issues.push("No locator - specify page/section for verifiability");
  }
  
  // Note explaining relevance
  if (citation.note && citation.note.length > 10) {
    score += 5;
  }
  
  // Title quality
  if (!citation.source.title || citation.source.title === citation.source.url) {
    score -= 10;
    issues.push("Missing or generic title - may not be a quality source");
  }
  
  // Clamp score 0-100
  score = Math.max(0, Math.min(100, score));
  
  // Determine quality tier
  let quality: EvidenceQuality;
  if (score >= 75) {
    quality = "strong";
  } else if (score >= 50) {
    quality = "moderate";
  } else if (score >= 30) {
    quality = "weak";
  } else {
    quality = "none";
  }
  
  return { quality, strengthScore: score, issues };
}

/**
 * Convert Citation to EvidenceItem for scheme-based analysis
 */
export function mapCitationToEvidence(citation: CitationWithSource): EvidenceItem {
  const type = inferEvidenceType(citation);
  const { quality, strengthScore, issues } = assessCitationQuality(citation);
  
  return {
    id: citation.id,
    type,
    content: citation.quote || citation.source.title || citation.source.url || "",
    source: citation.source.url || citation.source.doi || undefined,
    quality,
    strengthScore,
    issues: issues.length > 0 ? issues : undefined,
  };
}

/**
 * Map multiple citations to evidence items
 */
export function mapCitationsToEvidence(
  citations: CitationWithSource[]
): EvidenceItem[] {
  return citations.map(mapCitationToEvidence);
}
```

---

### Phase 2: Scheme Requirements Fetcher (1 hour)

Fetch evidence requirements for argument scheme.

**File:** `lib/evidence/schemeEvidenceRequirements.ts`

```typescript
// lib/evidence/schemeEvidenceRequirements.ts
import type { EvidenceRequirement } from "@/components/argumentation/EvidenceGuidance";

/**
 * Scheme ID → Evidence Requirements mapping
 * TODO: Load from database or config file
 */
const SCHEME_EVIDENCE_MAP: Record<string, EvidenceRequirement[]> = {
  // Expert Opinion Scheme
  "expert-opinion": [
    {
      type: "expert-testimony",
      description: "Citation from recognized expert in the field",
      required: true,
      strengthNeeded: 70,
      examples: [
        "Peer-reviewed journal article",
        "Published research by domain expert",
        "Statement from credentialed professional",
      ],
      tips: [
        "Check author credentials and affiliations",
        "Prefer recent publications (within 5 years)",
        "Look for consensus among multiple experts",
      ],
    },
  ],
  
  // Argument from Example
  "argument-from-example": [
    {
      type: "example",
      description: "Specific illustrative case or instance",
      required: true,
      strengthNeeded: 60,
      examples: [
        "Historical case study",
        "Real-world example with documentation",
        "Specific instance with verifiable details",
      ],
      tips: [
        "Ensure example is representative, not cherry-picked",
        "Provide context and relevant details",
        "Link to primary sources documenting the example",
      ],
    },
    {
      type: "documentary-evidence",
      description: "Supporting documentation for the example",
      required: false,
      strengthNeeded: 50,
      examples: [
        "News article covering the case",
        "Academic analysis of the example",
        "Official records or documents",
      ],
      tips: [
        "Multiple independent sources strengthen credibility",
      ],
    },
  ],
  
  // Causal Argument
  "causal-argument": [
    {
      type: "causal-evidence",
      description: "Evidence establishing causal relationship",
      required: true,
      strengthNeeded: 75,
      examples: [
        "Controlled study showing cause-effect",
        "Longitudinal research tracking causation",
        "Meta-analysis of causal studies",
      ],
      tips: [
        "Distinguish correlation from causation",
        "Look for mechanisms explaining the causal link",
        "Rule out confounding variables",
      ],
    },
    {
      type: "statistical-data",
      description: "Quantitative data supporting causal claim",
      required: false,
      strengthNeeded: 65,
      examples: [
        "Statistical analysis of relationship",
        "Regression analysis results",
        "Time-series data",
      ],
      tips: [
        "Check sample size and statistical significance",
      ],
    },
  ],
  
  // Argument from Sign
  "argument-from-sign": [
    {
      type: "statistical-data",
      description: "Data showing correlation or indicator",
      required: true,
      strengthNeeded: 70,
      examples: [
        "Correlation study",
        "Survey data",
        "Observable indicators",
      ],
      tips: [
        "Signs should be reliable indicators",
        "Multiple signs strengthen the argument",
      ],
    },
  ],
  
  // Default: General Evidence
  "default": [
    {
      type: "general-evidence",
      description: "General supporting evidence",
      required: false,
      strengthNeeded: 50,
      examples: [
        "Credible sources supporting the claim",
        "Documentation or references",
        "Expert statements",
      ],
      tips: [
        "More evidence is generally better",
        "Prefer authoritative sources",
      ],
    },
  ],
};

/**
 * Get evidence requirements for a scheme
 */
export async function getSchemeEvidenceRequirements(
  schemeId: string
): Promise<EvidenceRequirement[]> {
  // TODO: Fetch from database if requirements are stored there
  // For now, use static mapping
  
  const normalized = schemeId.toLowerCase().replace(/_/g, "-");
  return SCHEME_EVIDENCE_MAP[normalized] || SCHEME_EVIDENCE_MAP["default"];
}

/**
 * Get evidence requirements for an argument (fetches scheme first)
 */
export async function getArgumentEvidenceRequirements(
  argumentId: string
): Promise<EvidenceRequirement[]> {
  // TODO: Fetch argument's scheme from database
  // const argument = await prisma.argument.findUnique({
  //   where: { id: argumentId },
  //   select: { schemeId: true }
  // });
  // return getSchemeEvidenceRequirements(argument.schemeId);
  
  // Fallback: default requirements
  return SCHEME_EVIDENCE_MAP["default"];
}
```

---

### Phase 3: Evidence Analysis Component (2 hours)

Display evidence validation in wizard.

**File:** `components/argumentation/CitationEvidenceAnalysis.tsx`

```typescript
// components/argumentation/CitationEvidenceAnalysis.tsx
"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { 
  EvidenceValidator,
  EvidenceStrengthMeter,
  EvidenceSuggestions,
  type EvidenceItem,
  type EvidenceRequirement,
  type EvidenceSuggestion,
} from "./EvidenceGuidance";
import { 
  mapCitationsToEvidence 
} from "@/lib/evidence/citationEvidenceMapper";
import { 
  getSchemeEvidenceRequirements 
} from "@/lib/evidence/schemeEvidenceRequirements";
import { Loader2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface CitationEvidenceAnalysisProps {
  /** Target ID (claim or argument) to fetch citations for */
  targetId: string;
  /** Target type */
  targetType: "claim" | "argument";
  /** Scheme ID for the argument (if known) */
  schemeId?: string;
  /** Additional evidence items not yet attached as citations */
  pendingEvidence?: EvidenceItem[];
  className?: string;
}

/**
 * Analyzes citations as evidence against scheme requirements
 * Fetches citations, maps to evidence items, validates against scheme
 */
export function CitationEvidenceAnalysis({
  targetId,
  targetType,
  schemeId,
  pendingEvidence = [],
  className = "",
}: CitationEvidenceAnalysisProps) {
  const [requirements, setRequirements] = useState<EvidenceRequirement[]>([]);
  const [suggestions, setSuggestions] = useState<EvidenceSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch citations
  const { data: citationsData } = useSWR(
    targetType === "claim" 
      ? `/api/claims/${targetId}/citations`
      : `/api/arguments/${targetId}/citations`,
    fetcher
  );

  // Load scheme requirements
  useEffect(() => {
    if (!schemeId) {
      setRequirements([]);
      setLoading(false);
      return;
    }
    
    getSchemeEvidenceRequirements(schemeId).then((reqs) => {
      setRequirements(reqs);
      setLoading(false);
    });
  }, [schemeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
        <span className="text-sm text-slate-600">Analyzing evidence...</span>
      </div>
    );
  }

  // Map citations to evidence items
  const citations = citationsData?.citations || [];
  const evidenceFromCitations = mapCitationsToEvidence(citations);
  const allEvidence = [...evidenceFromCitations, ...pendingEvidence];

  // Calculate overall strength
  const overallStrength = allEvidence.length > 0
    ? Math.round(
        allEvidence.reduce((sum, ev) => sum + ev.strengthScore, 0) / allEvidence.length
      )
    : 0;

  // Breakdown by category
  const breakdown = [
    {
      category: "Source Credibility",
      score: calculateCredibilityScore(evidenceFromCitations),
      description: "Quality and authority of sources cited",
    },
    {
      category: "Evidence Specificity",
      score: calculateSpecificityScore(evidenceFromCitations),
      description: "Presence of quotes, locators, and specific details",
    },
    {
      category: "Requirement Coverage",
      score: calculateCoverageScore(allEvidence, requirements),
      description: "How well evidence matches scheme requirements",
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall strength meter */}
      <EvidenceStrengthMeter
        overallStrength={overallStrength}
        breakdown={breakdown}
      />

      {/* Validation against requirements */}
      {requirements.length > 0 && (
        <EvidenceValidator
          evidence={allEvidence}
          requirements={requirements}
        />
      )}

      {/* Suggestions for improvement */}
      {suggestions.length > 0 && (
        <EvidenceSuggestions
          suggestions={suggestions}
        />
      )}
    </div>
  );
}

// Helper functions
function calculateCredibilityScore(evidence: EvidenceItem[]): number {
  if (evidence.length === 0) return 0;
  
  const scores = evidence.map((ev) => {
    // Weight by evidence type
    const typeWeight = ev.type === "expert-testimony" ? 1.2 : 
                       ev.type === "statistical-data" ? 1.1 : 1.0;
    return ev.strengthScore * typeWeight;
  });
  
  return Math.round(scores.reduce((a, b) => a + b, 0) / evidence.length);
}

function calculateSpecificityScore(evidence: EvidenceItem[]): number {
  if (evidence.length === 0) return 0;
  
  const scores = evidence.map((ev) => {
    let score = 50;
    if (ev.content.length > 100) score += 25; // detailed
    if (ev.source) score += 25; // has source link
    return score;
  });
  
  return Math.round(scores.reduce((a, b) => a + b, 0) / evidence.length);
}

function calculateCoverageScore(
  evidence: EvidenceItem[],
  requirements: EvidenceRequirement[]
): number {
  if (requirements.length === 0) return 100; // no requirements = full coverage
  
  const satisfied = requirements.filter((req) => {
    const matching = evidence.find((ev) => ev.type === req.type);
    return matching && matching.strengthScore >= req.strengthNeeded;
  });
  
  return Math.round((satisfied.length / requirements.length) * 100);
}
```

---

### Phase 4: Integration into AttackArgumentWizard (30 min)

Add evidence analysis to the wizard.

**Update:** `components/argumentation/AttackArgumentWizard.tsx`

```typescript
// Add to imports
import { CitationEvidenceAnalysis } from "./CitationEvidenceAnalysis";

// Add to ReviewStep component
<CardContent className="space-y-6">
  {/* ... existing quality/preview sections ... */}
  
  {/* Evidence Analysis */}
  {pendingCitations.length > 0 && suggestion.targetSchemeInstance?.schemeId && (
    <div className="space-y-3">
      <h3 className="font-medium">Evidence Quality Analysis</h3>
      <CitationEvidenceAnalysis
        targetId={attackClaimId} // Will be set after claim creation
        targetType="claim"
        schemeId={suggestion.targetSchemeInstance.schemeId}
        pendingEvidence={pendingCitations.map((cit) => ({
          // Map pending citations to evidence items for preview
          id: `pending-${cit.value}`,
          type: "general-evidence", // Will be inferred after attachment
          content: cit.quote || cit.title || cit.value,
          source: cit.value,
          quality: "moderate",
          strengthScore: 50,
        }))}
      />
    </div>
  )}
  
  {/* ... existing actions ... */}
</CardContent>
```

---

## Usage Examples

### Example 1: Attack with Academic Citation

**User creates attack with citation:**
- URL: `https://arxiv.org/abs/2024.12345`
- Quote: "Our study found that the method achieves 95% accuracy"
- Locator: "Section 3.2"

**System analyzes:**
```typescript
{
  type: "expert-testimony",  // inferred from arxiv platform
  quality: "strong",          // 85/100 score
  strengthScore: 85,
  issues: [] // no issues
}
```

**Displayed to user:**
- ✅ Strong Evidence (85%)
- Platform: arXiv (Academic)
- Specific excerpt provided
- Meets "Expert Testimony" requirement

### Example 2: Attack with Weak Citation

**User adds citation:**
- URL: `https://random-blog.com/opinion`
- No quote, no locator

**System analyzes:**
```typescript
{
  type: "general-evidence",
  quality: "weak",
  strengthScore: 35,
  issues: [
    "No DOI found - consider using peer-reviewed sources",
    "No author information - source credibility unclear",
    "No specific quote - add an excerpt to strengthen evidence",
    "No locator - specify page/section for verifiability"
  ]
}
```

**Displayed to user:**
- ⚠️ Weak Evidence (35%)
- Issues detected (4)
- Suggestions: Add peer-reviewed source, include quote

---

## Testing Plan

### Unit Tests
```typescript
// __tests__/lib/evidence/citationEvidenceMapper.test.ts
describe("inferEvidenceType", () => {
  it("identifies expert testimony from arxiv", () => {
    const citation = {
      source: { platform: "arxiv", kind: "pdf" }
    };
    expect(inferEvidenceType(citation)).toBe("expert-testimony");
  });
  
  it("identifies statistical data from quotes with percentages", () => {
    const citation = {
      quote: "The study found 75% increase",
      source: { platform: "web" }
    };
    expect(inferEvidenceType(citation)).toBe("statistical-data");
  });
});

describe("assessCitationQuality", () => {
  it("gives high score to arxiv + DOI + quote", () => {
    const citation = {
      source: {
        platform: "arxiv",
        doi: "10.1234/example",
        authorsJson: ["Author"]
      },
      quote: "This is a detailed excerpt...",
      locator: "page 42"
    };
    const result = assessCitationQuality(citation);
    expect(result.quality).toBe("strong");
    expect(result.strengthScore).toBeGreaterThan(70);
  });
  
  it("identifies issues with blog posts without metadata", () => {
    const citation = {
      source: {
        platform: "web",
        url: "https://blog.com/post"
      }
    };
    const result = assessCitationQuality(citation);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests
1. Add citation in AttackArgumentWizard
2. Verify evidence analysis appears in ReviewStep
3. Check quality score calculation
4. Verify suggestions display
5. Submit attack and check citations persist

---

## Timeline

- **Phase 1:** Mapping Layer - 2 hours
- **Phase 2:** Requirements Fetcher - 1 hour
- **Phase 3:** Analysis Component - 2 hours
- **Phase 4:** Wizard Integration - 30 min
- **Testing & Polish:** 1.5 hours

**Total:** ~7 hours (1 day of focused work)

---

## Benefits

1. **Real-time feedback:** Users see evidence quality as they add citations
2. **Educational:** Learn what makes strong evidence
3. **Scheme-specific:** Requirements adapt to argumentation scheme
4. **Actionable:** Specific suggestions for improvement
5. **Unified:** Single evidence/citation system across app

---

## Future Enhancements

1. **ML-based quality scoring:** Train model on expert-rated citations
2. **Auto-suggest citations:** Recommend sources based on claim
3. **Citation network analysis:** Show how sources relate across arguments
4. **Credibility DB:** Maintain platform/domain credibility scores
5. **Evidence heat maps:** Visualize which premises lack strong evidence

---

_Ready for implementation - start with Phase 1 mapping layer_
