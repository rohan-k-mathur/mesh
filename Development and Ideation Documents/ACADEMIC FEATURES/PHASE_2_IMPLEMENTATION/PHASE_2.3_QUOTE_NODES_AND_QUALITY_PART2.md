# Phase 2.3: Quote Nodes & Argument Quality Gates — Part 2

**Sub-Phase:** 2.3 of 2.3 (Continued)  
**Focus:** Argument CI/Linting & UI Components

---

## Implementation Steps (Continued)

### Step 2.3.5: Argument Linting Types

**File:** `lib/linting/types.ts`

```typescript
/**
 * Type definitions for argument linting system
 */

export type LintSeverity = "error" | "warning" | "info";

export interface LintResult {
  pass: boolean;
  message?: string;
  details?: any;
  suggestion?: string;
}

export interface LintRuleResult {
  ruleId: string;
  ruleName: string;
  severity: LintSeverity;
  pass: boolean;
  message?: string;
  details?: any;
  suggestion?: string;
}

export interface LintReport {
  argumentId?: string;
  timestamp: Date;
  results: LintRuleResult[];
  summary: {
    total: number;
    passed: number;
    errors: number;
    warnings: number;
    infos: number;
  };
  canSubmit: boolean;  // False if any errors
  score: number;       // 0-100 quality score
}

export interface ArgumentForLinting {
  id?: string;
  type: string;
  schemeId?: string;
  scheme?: {
    id: string;
    name: string;
    category?: string;
    criticalQuestions?: Array<{
      id: string;
      question: string;
    }>;
  };
  premises: Array<{
    id: string;
    text: string;
    type: string;
    sourceId?: string;
  }>;
  conclusion?: {
    id: string;
    text: string;
    type: string;
    sourceId?: string;
  };
  citations?: Array<{
    id: string;
    sourceId: string;
  }>;
  cqResponses?: string[];  // IDs of addressed critical questions
  quotes?: Array<{
    id: string;
    quoteId: string;
  }>;
}

export interface LinterConfig {
  enabledRules: string[];
  severityOverrides?: Record<string, LintSeverity>;
  customRules?: LintRule[];
}

export interface LintRule {
  id: string;
  name: string;
  description: string;
  severity: LintSeverity;
  category: "citation" | "structure" | "scheme" | "quality" | "custom";
  check: (argument: ArgumentForLinting) => LintResult | Promise<LintResult>;
}
```

---

### Step 2.3.6: Linter Rules

**File:** `lib/linting/rules.ts`

```typescript
/**
 * Built-in linting rules for arguments
 */

import { LintRule, ArgumentForLinting, LintResult } from "./types";

// ============================================
// CITATION RULES
// ============================================

export const empiricalCitationRule: LintRule = {
  id: "empirical-citation",
  name: "Empirical claims require citations",
  description: "Claims marked as empirical should have supporting citations",
  severity: "warning",
  category: "citation",
  check: (arg: ArgumentForLinting): LintResult => {
    const empiricalPremises = arg.premises.filter(
      (p) => p.type === "EMPIRICAL" && !p.sourceId
    );

    if (empiricalPremises.length > 0) {
      return {
        pass: false,
        message: `${empiricalPremises.length} empirical premise(s) lack citations`,
        details: empiricalPremises.map((p) => ({
          claimId: p.id,
          text: p.text.slice(0, 100),
        })),
        suggestion: "Add citations to support empirical claims",
      };
    }

    return { pass: true };
  },
};

export const minimumCitationsRule: LintRule = {
  id: "minimum-citations",
  name: "Arguments should have at least one citation",
  description: "Scholarly arguments typically require evidence",
  severity: "info",
  category: "citation",
  check: (arg: ArgumentForLinting): LintResult => {
    const totalCitations =
      (arg.citations?.length || 0) +
      arg.premises.filter((p) => p.sourceId).length;

    if (totalCitations === 0) {
      return {
        pass: false,
        message: "No citations found",
        suggestion: "Consider adding citations to strengthen your argument",
      };
    }

    return { pass: true };
  },
};

// ============================================
// STRUCTURE RULES
// ============================================

export const hasConclusionRule: LintRule = {
  id: "has-conclusion",
  name: "Arguments must have a conclusion",
  description: "Every argument needs a conclusion claim",
  severity: "error",
  category: "structure",
  check: (arg: ArgumentForLinting): LintResult => {
    if (!arg.conclusion) {
      return {
        pass: false,
        message: "No conclusion specified",
        suggestion: "Add a conclusion claim for this argument",
      };
    }
    return { pass: true };
  },
};

export const minimumPremisesRule: LintRule = {
  id: "minimum-premises",
  name: "Arguments should have premises",
  description: "Arguments need supporting premises",
  severity: "error",
  category: "structure",
  check: (arg: ArgumentForLinting): LintResult => {
    if (arg.premises.length === 0) {
      return {
        pass: false,
        message: "No premises provided",
        suggestion: "Add at least one supporting premise",
      };
    }
    return { pass: true };
  },
};

export const premiseConclusionDistinctRule: LintRule = {
  id: "premise-conclusion-distinct",
  name: "Premises and conclusion should be distinct",
  description: "Avoid circular reasoning",
  severity: "error",
  category: "structure",
  check: (arg: ArgumentForLinting): LintResult => {
    if (!arg.conclusion) return { pass: true };

    const conclusionText = arg.conclusion.text.toLowerCase().trim();
    const matchingPremise = arg.premises.find(
      (p) => p.text.toLowerCase().trim() === conclusionText
    );

    if (matchingPremise) {
      return {
        pass: false,
        message: "Premise is identical to conclusion (circular)",
        details: { premiseId: matchingPremise.id },
        suggestion: "Ensure premises are distinct from the conclusion",
      };
    }

    return { pass: true };
  },
};

// ============================================
// SCHEME RULES
// ============================================

export const schemeSelectedRule: LintRule = {
  id: "scheme-selected",
  name: "Argument should have an argumentation scheme",
  description: "Selecting a scheme helps structure the argument",
  severity: "warning",
  category: "scheme",
  check: (arg: ArgumentForLinting): LintResult => {
    if (!arg.schemeId && !arg.scheme) {
      return {
        pass: false,
        message: "No argumentation scheme selected",
        suggestion: "Select an appropriate scheme to structure your argument",
      };
    }
    return { pass: true };
  },
};

export const criticalQuestionsCoverageRule: LintRule = {
  id: "cq-coverage",
  name: "Critical questions should be addressed",
  description: "Schemes have critical questions that strengthen arguments when addressed",
  severity: "info",
  category: "scheme",
  check: (arg: ArgumentForLinting): LintResult => {
    if (!arg.scheme?.criticalQuestions?.length) {
      return { pass: true };
    }

    const addressedCQs = new Set(arg.cqResponses || []);
    const unanswered = arg.scheme.criticalQuestions.filter(
      (cq) => !addressedCQs.has(cq.id)
    );

    if (unanswered.length > 0) {
      return {
        pass: false,
        message: `${unanswered.length} critical question(s) unanswered`,
        details: unanswered.map((cq) => ({
          id: cq.id,
          question: cq.question,
        })),
        suggestion: "Address critical questions to strengthen your argument",
      };
    }

    return { pass: true };
  },
};

// ============================================
// QUALITY RULES
// ============================================

export const premiseLengthRule: LintRule = {
  id: "premise-length",
  name: "Claims should be concise",
  description: "Very long claims may need to be broken down",
  severity: "info",
  category: "quality",
  check: (arg: ArgumentForLinting): LintResult => {
    const longPremises = arg.premises.filter((p) => p.text.length > 500);

    if (longPremises.length > 0) {
      return {
        pass: false,
        message: `${longPremises.length} premise(s) exceed 500 characters`,
        details: longPremises.map((p) => ({
          id: p.id,
          length: p.text.length,
        })),
        suggestion: "Consider breaking long claims into smaller, focused claims",
      };
    }

    return { pass: true };
  },
};

export const quoteEvidenceForHSSRule: LintRule = {
  id: "hss-quote-evidence",
  name: "HSS arguments should include textual evidence",
  description: "Humanities/Social Sciences arguments benefit from quote evidence",
  severity: "info",
  category: "quality",
  check: (arg: ArgumentForLinting): LintResult => {
    // Only apply to interpretive/textual schemes
    const hssCategories = ["INTERPRETIVE", "TEXTUAL", "HERMENEUTIC"];
    
    if (!arg.scheme?.category || !hssCategories.includes(arg.scheme.category)) {
      return { pass: true };
    }

    if (!arg.quotes?.length) {
      return {
        pass: false,
        message: "Interpretive argument lacks textual evidence",
        suggestion: "Add quote nodes to support your interpretation",
      };
    }

    return { pass: true };
  },
};

// ============================================
// EXPORT ALL RULES
// ============================================

export const DEFAULT_LINT_RULES: LintRule[] = [
  // Errors (block submission)
  hasConclusionRule,
  minimumPremisesRule,
  premiseConclusionDistinctRule,
  
  // Warnings (show but allow)
  empiricalCitationRule,
  schemeSelectedRule,
  
  // Info (suggestions)
  minimumCitationsRule,
  criticalQuestionsCoverageRule,
  premiseLengthRule,
  quoteEvidenceForHSSRule,
];

export const RULE_MAP = new Map(
  DEFAULT_LINT_RULES.map((r) => [r.id, r])
);
```

---

### Step 2.3.7: Linter Service

**File:** `lib/linting/linterService.ts`

```typescript
/**
 * Argument linting service
 */

import {
  LintRule,
  LintReport,
  LintRuleResult,
  ArgumentForLinting,
  LinterConfig,
} from "./types";
import { DEFAULT_LINT_RULES, RULE_MAP } from "./rules";
import { prisma } from "@/lib/prisma";

const DEFAULT_CONFIG: LinterConfig = {
  enabledRules: DEFAULT_LINT_RULES.map((r) => r.id),
};

/**
 * Run linter on an argument
 */
export async function lintArgument(
  argument: ArgumentForLinting,
  config: LinterConfig = DEFAULT_CONFIG
): Promise<LintReport> {
  const results: LintRuleResult[] = [];

  // Get enabled rules
  const rules = config.enabledRules
    .map((id) => {
      // Check custom rules first
      const customRule = config.customRules?.find((r) => r.id === id);
      if (customRule) return customRule;
      return RULE_MAP.get(id);
    })
    .filter((r): r is LintRule => !!r);

  // Run each rule
  for (const rule of rules) {
    try {
      const result = await rule.check(argument);
      
      // Apply severity override if configured
      const severity = config.severityOverrides?.[rule.id] || rule.severity;

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity,
        pass: result.pass,
        message: result.message,
        details: result.details,
        suggestion: result.suggestion,
      });
    } catch (error) {
      console.error(`Linter rule ${rule.id} failed:`, error);
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        pass: false,
        message: `Rule execution failed: ${error}`,
      });
    }
  }

  // Calculate summary
  const summary = {
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    errors: results.filter((r) => !r.pass && r.severity === "error").length,
    warnings: results.filter((r) => !r.pass && r.severity === "warning").length,
    infos: results.filter((r) => !r.pass && r.severity === "info").length,
  };

  // Calculate quality score (0-100)
  const weights = { error: 30, warning: 10, info: 5 };
  const deductions =
    summary.errors * weights.error +
    summary.warnings * weights.warning +
    summary.infos * weights.info;
  const score = Math.max(0, 100 - deductions);

  return {
    argumentId: argument.id,
    timestamp: new Date(),
    results,
    summary,
    canSubmit: summary.errors === 0,
    score,
  };
}

/**
 * Load argument from database and lint it
 */
export async function lintArgumentById(
  argumentId: string,
  config?: LinterConfig
): Promise<LintReport> {
  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: {
      premises: {
        select: {
          id: true,
          text: true,
          type: true,
          sourceId: true,
        },
      },
      conclusion: {
        select: {
          id: true,
          text: true,
          type: true,
          sourceId: true,
        },
      },
      scheme: {
        select: {
          id: true,
          name: true,
          category: true,
          criticalQuestions: true,
        },
      },
      citations: {
        select: {
          id: true,
          sourceId: true,
        },
      },
      cqResponses: {
        select: { cqId: true },
      },
      quotes: {
        select: {
          id: true,
          quoteId: true,
        },
      },
    },
  });

  if (!argument) {
    throw new Error("Argument not found");
  }

  const forLinting: ArgumentForLinting = {
    id: argument.id,
    type: argument.type,
    schemeId: argument.schemeId || undefined,
    scheme: argument.scheme
      ? {
          id: argument.scheme.id,
          name: argument.scheme.name,
          category: argument.scheme.category || undefined,
          criticalQuestions: (argument.scheme.criticalQuestions as any[]) || [],
        }
      : undefined,
    premises: argument.premises,
    conclusion: argument.conclusion || undefined,
    citations: argument.citations,
    cqResponses: argument.cqResponses.map((r) => r.cqId),
    quotes: argument.quotes,
  };

  return lintArgument(forLinting, config);
}

/**
 * Get linter configuration for a deliberation
 */
export async function getDeliberationLinterConfig(
  deliberationId: string
): Promise<LinterConfig> {
  const deliberation = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    select: { settings: true },
  });

  const settings = deliberation?.settings as any;

  if (settings?.linterConfig) {
    return settings.linterConfig;
  }

  return DEFAULT_CONFIG;
}

/**
 * Lint all arguments in a deliberation
 */
export async function lintDeliberation(deliberationId: string) {
  const config = await getDeliberationLinterConfig(deliberationId);

  const arguments_ = await prisma.argument.findMany({
    where: { deliberationId },
    select: { id: true },
  });

  const reports = await Promise.all(
    arguments_.map((arg) => lintArgumentById(arg.id, config))
  );

  // Aggregate stats
  const aggregate = {
    totalArguments: reports.length,
    argumentsWithErrors: reports.filter((r) => r.summary.errors > 0).length,
    argumentsWithWarnings: reports.filter((r) => r.summary.warnings > 0).length,
    averageScore:
      reports.length > 0
        ? reports.reduce((sum, r) => sum + r.score, 0) / reports.length
        : 100,
    commonIssues: getCommonIssues(reports),
  };

  return {
    reports,
    aggregate,
  };
}

function getCommonIssues(
  reports: LintReport[]
): Array<{ ruleId: string; count: number }> {
  const issueCounts = new Map<string, number>();

  for (const report of reports) {
    for (const result of report.results) {
      if (!result.pass) {
        issueCounts.set(result.ruleId, (issueCounts.get(result.ruleId) || 0) + 1);
      }
    }
  }

  return Array.from(issueCounts.entries())
    .map(([ruleId, count]) => ({ ruleId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
```

---

### Step 2.3.8: Quote API Routes

**File:** `app/api/quotes/route.ts`

```typescript
/**
 * GET/POST /api/quotes
 * List or create quote nodes
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createQuote, searchQuotes } from "@/lib/quotes/quoteService";

const CreateQuoteSchema = z.object({
  sourceId: z.string(),
  text: z.string().min(1).max(10000),
  locator: z.string().optional(),
  locatorType: z
    .enum([
      "PAGE",
      "SECTION",
      "CHAPTER",
      "VERSE",
      "TIMESTAMP",
      "LINE",
      "PARAGRAPH",
      "CUSTOM",
    ])
    .optional(),
  context: z.string().max(5000).optional(),
  language: z.string().length(2).optional(),
  isTranslation: z.boolean().optional(),
  originalQuoteId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const filters = {
      sourceId: searchParams.get("sourceId") || undefined,
      authorId: searchParams.get("authorId") || undefined,
      framework: searchParams.get("framework") || undefined,
      hasInterpretations:
        searchParams.get("hasInterpretations") === "true"
          ? true
          : searchParams.get("hasInterpretations") === "false"
          ? false
          : undefined,
      searchText: searchParams.get("q") || undefined,
    };

    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const result = await searchQuotes(filters, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Search quotes error:", error);
    return NextResponse.json(
      { error: "Failed to search quotes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreateQuoteSchema.parse(body);

    const quote = await createQuote(validatedData, session.user.id);

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create quote error:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/quotes/[quoteId]/route.ts`

```typescript
/**
 * GET /api/quotes/:quoteId
 * Get quote details with interpretations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getQuote } from "@/lib/quotes/quoteService";

export async function GET(
  req: NextRequest,
  { params }: { params: { quoteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const quote = await getQuote(params.quoteId, session?.user?.id);

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Get quote error:", error);
    return NextResponse.json(
      { error: "Failed to get quote" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/quotes/[quoteId]/interpretations/route.ts`

```typescript
/**
 * GET/POST /api/quotes/:quoteId/interpretations
 * List or create interpretations
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createInterpretation,
  getInterpretations,
} from "@/lib/quotes/interpretationService";

const CreateInterpretationSchema = z.object({
  interpretation: z.string().min(1).max(10000),
  framework: z.string().max(200).optional(),
  methodology: z.string().max(200).optional(),
  supportsId: z.string().optional(),
  challengesId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { quoteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const interpretations = await getInterpretations(
      params.quoteId,
      session?.user?.id
    );
    return NextResponse.json(interpretations);
  } catch (error) {
    console.error("Get interpretations error:", error);
    return NextResponse.json(
      { error: "Failed to get interpretations" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { quoteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreateInterpretationSchema.parse(body);

    const interpretation = await createInterpretation(
      { quoteId: params.quoteId, ...validatedData },
      session.user.id
    );

    return NextResponse.json(interpretation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create interpretation error:", error);
    return NextResponse.json(
      { error: "Failed to create interpretation" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/interpretations/[interpId]/vote/route.ts`

```typescript
/**
 * POST /api/interpretations/:interpId/vote
 * Vote on an interpretation
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { voteOnInterpretation } from "@/lib/quotes/interpretationService";

const VoteSchema = z.object({
  vote: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { interpId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { vote } = VoteSchema.parse(body);

    const result = await voteOnInterpretation(
      params.interpId,
      session.user.id,
      vote
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
```

---

### Step 2.3.9: Linting API Routes

**File:** `app/api/arguments/[argId]/lint/route.ts`

```typescript
/**
 * GET /api/arguments/:argId/lint
 * Lint a specific argument
 */

import { NextRequest, NextResponse } from "next/server";
import { lintArgumentById } from "@/lib/linting/linterService";

export async function GET(
  req: NextRequest,
  { params }: { params: { argId: string } }
) {
  try {
    const report = await lintArgumentById(params.argId);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Lint argument error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to lint argument" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/deliberations/[id]/lint/route.ts`

```typescript
/**
 * GET /api/deliberations/:id/lint
 * Lint all arguments in a deliberation
 */

import { NextRequest, NextResponse } from "next/server";
import { lintDeliberation } from "@/lib/linting/linterService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await lintDeliberation(params.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Lint deliberation error:", error);
    return NextResponse.json(
      { error: "Failed to lint deliberation" },
      { status: 500 }
    );
  }
}
```

---

**File:** `app/api/lint/preview/route.ts`

```typescript
/**
 * POST /api/lint/preview
 * Lint an argument before submission (preview mode)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { lintArgument } from "@/lib/linting/linterService";
import { ArgumentForLinting } from "@/lib/linting/types";

const PreviewLintSchema = z.object({
  type: z.string(),
  schemeId: z.string().optional(),
  scheme: z
    .object({
      id: z.string(),
      name: z.string(),
      category: z.string().optional(),
      criticalQuestions: z
        .array(
          z.object({
            id: z.string(),
            question: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
  premises: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      type: z.string(),
      sourceId: z.string().optional(),
    })
  ),
  conclusion: z
    .object({
      id: z.string(),
      text: z.string(),
      type: z.string(),
      sourceId: z.string().optional(),
    })
    .optional(),
  citations: z
    .array(
      z.object({
        id: z.string(),
        sourceId: z.string(),
      })
    )
    .optional(),
  cqResponses: z.array(z.string()).optional(),
  quotes: z
    .array(
      z.object({
        id: z.string(),
        quoteId: z.string(),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const argument = PreviewLintSchema.parse(body) as ArgumentForLinting;

    const report = await lintArgument(argument);
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Preview lint error:", error);
    return NextResponse.json(
      { error: "Failed to lint argument" },
      { status: 500 }
    );
  }
}
```

---

## Phase 2.3 Part 2 Complete

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 6 | Linting types | `lib/linting/types.ts` | 📋 Part 2 |
| 7 | Lint rules | `lib/linting/rules.ts` | 📋 Part 2 |
| 8 | Linter service | `lib/linting/linterService.ts` | 📋 Part 2 |
| 9 | Quote API routes | `app/api/quotes/` | 📋 Part 2 |
| 10 | Interpretation APIs | `app/api/quotes/[quoteId]/interpretations/` | 📋 Part 2 |
| 11 | Linting APIs | `app/api/arguments/[argId]/lint/` | 📋 Part 2 |
| 12 | Preview lint API | `app/api/lint/preview/` | 📋 Part 2 |

---

## Next: Part 3

Continue to Phase 2.3 Part 3 for:
- UI components (QuoteCard, QuoteSelector, InterpretationPanel, LintResultsDisplay, QualityBadge)
- Integration examples

---

*End of Phase 2.3 Part 2*
