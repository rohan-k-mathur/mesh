# Essay Generator LLM Polish: Ideation Document

**Date**: December 9, 2025  
**Status**: 🧠 **BRAINSTORMING / IDEATION**  
**Context**: Exploring lightweight LLM integration for syntactical/grammatical refinement of generated essays

---

## Current State

### What We Have

The `essayGenerator.ts` produces academically-styled prose from argument chains using:
- Template-based sentence construction
- Scheme-aware transitions and discourse markers
- Dialectical structure (thesis-antithesis-synthesis)
- Critical question weaving
- `smartLowercase()` for proper noun/acronym preservation

### Current Limitations

| Issue | Example | Root Cause |
|-------|---------|------------|
| **Awkward infinitive phrases** | "concerns to analyze and evaluate arguments" | Chain purpose field starts with infinitive |
| **Placeholder leakage** | "is the goal/value g explicit" | CQ templates have unfilled variables |
| **Run-on sentences** | Long support relationship descriptions | Template concatenation without length awareness |
| **Repetitive transitions** | Multiple "Furthermore," in sequence | Random sampling without context |
| **Occasional double punctuation** | "argument.. The" | Edge description already has period |

---

## Design Philosophy

### Principles

1. **LLM as Polish, Not Author** — The argument structure and content come from the chain; LLM only improves surface form
2. **Preserve Semantic Content** — No adding/removing claims, no changing logical relationships
3. **Efficient Token Usage** — Process only problematic sections, not entire essay
4. **Graceful Degradation** — If LLM unavailable, original essay is still usable
5. **User Control** — Optional enhancement, not mandatory

### Non-Goals

- ❌ LLM-generated argument content
- ❌ Restructuring the essay organization
- ❌ Adding new information not in the chain
- ❌ Changing the argumentative stance

---

## Architecture Options

### Option A: Post-Generation Full Pass

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Chain Data  │ ──▶ │ Essay Gen   │ ──▶ │ LLM Polish  │ ──▶ Final Essay
└─────────────┘     │ (Template)  │     │ (Full Text) │
                    └─────────────┘     └─────────────┘
```

**Pros:**
- Simple implementation
- LLM sees full context

**Cons:**
- High token usage (~2x essay length)
- Latency for full processing
- Risk of semantic drift

### Option B: Section-by-Section Polish

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Chain Data  │ ──▶ │ Essay Gen   │ ──▶ │ Per-Section │ ──▶ Final Essay
└─────────────┘     │ (Template)  │     │ LLM Polish  │
                    └─────────────┘     └─────────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │ Intro │ Body │ ... │
                                    └───────────────────┘
```

**Pros:**
- Parallel processing possible
- Smaller context windows
- Easier to cache/skip unchanged sections

**Cons:**
- May lose cross-section coherence
- More API calls

### Option C: Targeted Fix-Ups (Recommended)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Chain Data  │ ──▶ │ Essay Gen   │ ──▶ │ Issue       │ ──▶ │ LLM Fix     │ ──▶ Final
└─────────────┘     │ (Template)  │     │ Detection   │     │ (Targeted)  │
                    └─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │ • Awkward phrases │
                                    │ • Run-on sentences│
                                    │ • Repetition      │
                                    └───────────────────┘
```

**Pros:**
- Minimal token usage
- Fast (only processes problem areas)
- Preserves good template output
- Easier to validate changes

**Cons:**
- Requires issue detection logic
- May miss subtle problems

---

## Recommended Implementation: Targeted Fix-Ups

### Phase 1: Issue Detection

Create heuristic detectors that flag problematic text:

```typescript
// lib/chains/essayPolish/issueDetectors.ts

interface TextIssue {
  type: "awkward_phrase" | "run_on" | "repetition" | "placeholder" | "punctuation";
  startIndex: number;
  endIndex: number;
  text: string;
  context: string; // Surrounding sentences for LLM
  severity: "low" | "medium" | "high";
}

// Detector functions
function detectAwkwardInfinitives(text: string): TextIssue[];
function detectRunOnSentences(text: string, maxLength?: number): TextIssue[];
function detectRepetitiveTransitions(text: string): TextIssue[];
function detectPlaceholderLeakage(text: string): TextIssue[];
function detectPunctuationIssues(text: string): TextIssue[];

// Main detector
export function detectEssayIssues(essay: string): TextIssue[] {
  return [
    ...detectAwkwardInfinitives(essay),
    ...detectRunOnSentences(essay),
    ...detectRepetitiveTransitions(essay),
    ...detectPlaceholderLeakage(essay),
    ...detectPunctuationIssues(essay),
  ].sort((a, b) => b.severity.localeCompare(a.severity));
}
```

### Phase 2: LLM Fix Request Builder

```typescript
// lib/chains/essayPolish/fixRequestBuilder.ts

interface PolishRequest {
  original: string;
  issues: TextIssue[];
  instructions: string;
}

function buildPolishPrompt(request: PolishRequest): string {
  return `You are a copy editor improving academic prose. Fix ONLY the specific issues listed below. 
Do not change the meaning, add information, or restructure arguments.

TEXT TO IMPROVE:
"""
${request.original}
"""

ISSUES TO FIX:
${request.issues.map((issue, i) => `
${i + 1}. [${issue.type}] "${issue.text}"
   Context: "${issue.context}"
`).join("\n")}

INSTRUCTIONS:
- Fix only the listed issues
- Preserve all factual claims and logical relationships
- Maintain academic tone
- Return the improved text only, no explanations

IMPROVED TEXT:`;
}
```

### Phase 3: Minimal LLM Integration

```typescript
// lib/chains/essayPolish/polishEssay.ts

import { openai } from "@/lib/openai"; // Existing OpenAI client

interface PolishOptions {
  enabled: boolean;
  maxIssues?: number; // Limit issues to fix per call
  model?: string; // Default: "gpt-4o-mini" for speed/cost
  temperature?: number; // Default: 0.3 for consistency
}

interface PolishResult {
  original: string;
  polished: string;
  issuesFound: number;
  issuesFixed: number;
  tokensUsed: number;
  duration: number;
}

export async function polishEssay(
  essay: string,
  options: PolishOptions = { enabled: true }
): Promise<PolishResult> {
  const startTime = Date.now();
  
  if (!options.enabled) {
    return {
      original: essay,
      polished: essay,
      issuesFound: 0,
      issuesFixed: 0,
      tokensUsed: 0,
      duration: 0,
    };
  }

  // Detect issues
  const issues = detectEssayIssues(essay);
  const issuesToFix = issues.slice(0, options.maxIssues || 10);
  
  if (issuesToFix.length === 0) {
    return {
      original: essay,
      polished: essay,
      issuesFound: 0,
      issuesFixed: 0,
      tokensUsed: 0,
      duration: Date.now() - startTime,
    };
  }

  // Build and send request
  const prompt = buildPolishPrompt({ original: essay, issues: issuesToFix, instructions: "" });
  
  const response = await openai.chat.completions.create({
    model: options.model || "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: options.temperature || 0.3,
    max_tokens: Math.ceil(essay.length * 1.2 / 4), // Estimate tokens needed
  });

  const polished = response.choices[0]?.message?.content || essay;
  
  return {
    original: essay,
    polished,
    issuesFound: issues.length,
    issuesFixed: issuesToFix.length,
    tokensUsed: response.usage?.total_tokens || 0,
    duration: Date.now() - startTime,
  };
}
```

### Phase 4: UI Integration

```typescript
// In ChainEssayView.tsx

const [polishEnabled, setPolishEnabled] = useState(false);
const [isPolishing, setIsPolishing] = useState(false);
const [polishedEssay, setPolishedEssay] = useState<string | null>(null);

const handlePolish = async () => {
  if (!essayResult) return;
  setIsPolishing(true);
  
  try {
    const result = await fetch("/api/argument-chains/polish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ essay: essayResult.fullText }),
    }).then(r => r.json());
    
    setPolishedEssay(result.polished);
    toast.success(`Improved ${result.issuesFixed} issues`);
  } catch (err) {
    toast.error("Polish failed - using original");
  } finally {
    setIsPolishing(false);
  }
};

// In settings dropdown
<DropdownMenuCheckboxItem
  checked={polishEnabled}
  onCheckedChange={setPolishEnabled}
>
  <Sparkles className="w-4 h-4 mr-2" />
  AI Polish (Beta)
</DropdownMenuCheckboxItem>

// Polish button (when enabled)
{polishEnabled && (
  <Button
    variant="outline"
    size="sm"
    onClick={handlePolish}
    disabled={isPolishing}
  >
    {isPolishing ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : (
      <Wand2 className="w-4 h-4" />
    )}
  </Button>
)}
```

---

## Issue Detection Heuristics

### 1. Awkward Infinitive Phrases

```typescript
function detectAwkwardInfinitives(text: string): TextIssue[] {
  const patterns = [
    /concerns to \w+/gi,           // "concerns to analyze"
    /about to \w+ and \w+/gi,      // "about to analyze and evaluate"
    /regarding to \w+/gi,          // "regarding to discuss"
  ];
  
  return patterns.flatMap(pattern => 
    [...text.matchAll(pattern)].map(match => ({
      type: "awkward_phrase" as const,
      startIndex: match.index!,
      endIndex: match.index! + match[0].length,
      text: match[0],
      context: extractSentence(text, match.index!),
      severity: "medium" as const,
    }))
  );
}
```

### 2. Run-On Sentences

```typescript
function detectRunOnSentences(text: string, maxLength = 250): TextIssue[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  return sentences
    .filter(s => s.length > maxLength)
    .map(sentence => ({
      type: "run_on" as const,
      startIndex: text.indexOf(sentence),
      endIndex: text.indexOf(sentence) + sentence.length,
      text: sentence,
      context: sentence,
      severity: sentence.length > 350 ? "high" : "medium" as const,
    }));
}
```

### 3. Repetitive Transitions

```typescript
function detectRepetitiveTransitions(text: string): TextIssue[] {
  const transitions = ["Furthermore", "Additionally", "Moreover", "However", "Therefore"];
  const issues: TextIssue[] = [];
  
  for (const transition of transitions) {
    const regex = new RegExp(`${transition}[^.]+\\.\\s*${transition}`, "gi");
    const matches = [...text.matchAll(regex)];
    
    for (const match of matches) {
      issues.push({
        type: "repetition",
        startIndex: match.index!,
        endIndex: match.index! + match[0].length,
        text: match[0],
        context: match[0],
        severity: "low",
      });
    }
  }
  
  return issues;
}
```

### 4. Placeholder Leakage

```typescript
function detectPlaceholderLeakage(text: string): TextIssue[] {
  const patterns = [
    /\b[a-z]\b(?=\s+explicit|\s+acceptable)/gi, // Single letter variables
    /\[.*?\]/g,                                   // Bracketed placeholders
    /\{.*?\}/g,                                   // Curly brace placeholders
    /\$\w+/g,                                     // Dollar sign variables
  ];
  
  return patterns.flatMap(pattern =>
    [...text.matchAll(pattern)].map(match => ({
      type: "placeholder" as const,
      startIndex: match.index!,
      endIndex: match.index! + match[0].length,
      text: match[0],
      context: extractSentence(text, match.index!),
      severity: "high" as const,
    }))
  );
}
```

---

## API Endpoint

```typescript
// app/api/argument-chains/polish/route.ts

import { NextRequest, NextResponse } from "next/server";
import { polishEssay } from "@/lib/chains/essayPolish/polishEssay";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { essay, options } = await req.json();
  
  if (!essay || typeof essay !== "string") {
    return NextResponse.json({ error: "Invalid essay" }, { status: 400 });
  }

  // Rate limiting check here...

  try {
    const result = await polishEssay(essay, {
      enabled: true,
      maxIssues: 10,
      model: "gpt-4o-mini",
      ...options,
    });
    
    return NextResponse.json(result);
  } catch (err) {
    console.error("Polish error:", err);
    return NextResponse.json(
      { error: "Polish failed", original: essay, polished: essay },
      { status: 500 }
    );
  }
}
```

---

## Cost & Performance Estimates

### Token Usage (per essay)

| Scenario | Input Tokens | Output Tokens | Cost (gpt-4o-mini) |
|----------|--------------|---------------|---------------------|
| No issues detected | 0 | 0 | $0.00 |
| 5 small fixes | ~500 | ~600 | ~$0.0003 |
| 10 medium fixes | ~1,000 | ~1,200 | ~$0.0006 |
| Full essay rewrite | ~3,000 | ~3,500 | ~$0.002 |

### Latency

| Operation | Estimated Time |
|-----------|----------------|
| Issue detection | 5-10ms |
| LLM call (gpt-4o-mini) | 500-1500ms |
| Total with 5 fixes | ~600-1600ms |

---

## Future Enhancements

### 1. Caching Layer

```typescript
// Cache polished results by content hash
const cacheKey = `polish:${hashEssay(essay)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### 2. Streaming Response

```typescript
// Stream polished essay as it's generated
const stream = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [...],
  stream: true,
});

return new Response(stream.toReadableStream());
```

### 3. A/B Display

```typescript
// Show original and polished side-by-side with diff highlighting
<DiffViewer
  original={essayResult.fullText}
  polished={polishedEssay}
  highlightChanges={true}
/>
```

### 4. User Feedback Loop

```typescript
// Collect user ratings on polish quality
interface PolishFeedback {
  essayHash: string;
  issueType: string;
  originalSnippet: string;
  polishedSnippet: string;
  userRating: 1 | 2 | 3 | 4 | 5;
  userComment?: string;
}

// Use feedback to improve detection heuristics
```

---

## Implementation Roadmap

### Phase 1: Foundation (~4 hours)
| Task | Description | Hours |
|------|-------------|-------|
| 1.1 | Create issue detection module | 2h |
| 1.2 | Create polish prompt builder | 1h |
| 1.3 | Create polishEssay function | 1h |

### Phase 2: API & UI (~3 hours)
| Task | Description | Hours |
|------|-------------|-------|
| 2.1 | Create `/api/argument-chains/polish` endpoint | 1h |
| 2.2 | Add polish toggle to ChainEssayView settings | 1h |
| 2.3 | Add polish button with loading state | 1h |

### Phase 3: Polish (~2 hours)
| Task | Description | Hours |
|------|-------------|-------|
| 3.1 | Add error handling and fallback | 0.5h |
| 3.2 | Add rate limiting | 0.5h |
| 3.3 | Add usage tracking/logging | 1h |

**Total Estimated Time: ~9 hours**

---

## Open Questions

| Question | Options | Recommendation |
|----------|---------|----------------|
| **When to polish?** | On-demand / Auto / Both | On-demand with opt-in auto |
| **Model choice?** | gpt-4o-mini / gpt-4o / claude-haiku | gpt-4o-mini (cost/speed) |
| **Diff display?** | Side-by-side / Inline / Toggle | Toggle with highlight option |
| **Cache duration?** | None / 1 hour / 24 hours | 24 hours (essays are deterministic) |

---

## Summary

This ideation outlines a **lightweight, targeted LLM integration** for essay polish that:

1. **Detects specific issues** using heuristics (no LLM needed for detection)
2. **Fixes only problematic sections** (minimal token usage)
3. **Preserves semantic content** (LLM cannot add/remove arguments)
4. **Degrades gracefully** (original essay always available)
5. **Gives users control** (opt-in feature)

The estimated implementation time is **~9 hours** with an ongoing cost of **~$0.0003-0.002 per polish** using gpt-4o-mini.
