# Phase 2.3: Quote Nodes & Argument Quality Gates — Part 3

**Sub-Phase:** 2.3 of 2.3 (Continued)  
**Focus:** UI Components & Integration

---

## Implementation Steps (Continued)

### Step 2.3.10: Quote Card Component

**File:** `components/quotes/QuoteCard.tsx`

```tsx
"use client";

import React from "react";
import { Quote, BookOpen, MessageSquare, Link2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { QuoteNodeSummary } from "@/lib/quotes/types";

interface QuoteCardProps {
  quote: QuoteNodeSummary;
  compact?: boolean;
  onSelect?: (quote: QuoteNodeSummary) => void;
  selected?: boolean;
}

const LOCATOR_LABELS: Record<string, string> = {
  PAGE: "p.",
  SECTION: "§",
  CHAPTER: "Ch.",
  VERSE: "",
  TIMESTAMP: "",
  LINE: "line",
  PARAGRAPH: "¶",
  CUSTOM: "",
};

export function QuoteCard({
  quote,
  compact = false,
  onSelect,
  selected = false,
}: QuoteCardProps) {
  const locatorPrefix = LOCATOR_LABELS[quote.locatorType] || "";

  return (
    <Card
      className={cn(
        "transition-all",
        onSelect && "cursor-pointer hover:border-primary/50",
        selected && "border-primary ring-2 ring-primary/20"
      )}
      onClick={() => onSelect?.(quote)}
    >
      <CardContent className={cn("py-4", compact && "py-3")}>
        {/* Quote text */}
        <div className="flex gap-3">
          <Quote className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "italic text-foreground",
                compact ? "line-clamp-2 text-sm" : "line-clamp-4"
              )}
            >
              "{quote.text}"
            </p>

            {/* Source attribution */}
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="truncate">{quote.source.title}</span>
              {quote.source.year && <span>({quote.source.year})</span>}
              {quote.locator && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {locatorPrefix}
                  {quote.locator}
                </span>
              )}
            </div>

            {/* Stats row */}
            {!compact && (
              <div className="mt-3 flex items-center gap-4">
                {quote.interpretationCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    {quote.interpretationCount} interpretation
                    {quote.interpretationCount !== 1 && "s"}
                  </div>
                )}
                {quote.usageCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Link2 className="h-3 w-3" />
                    Used {quote.usageCount} time{quote.usageCount !== 1 && "s"}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback>
                      {quote.createdBy.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {quote.createdBy.name}
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          {!compact && !onSelect && (
            <Link href={`/quotes/${quote.id}`}>
              <Button variant="ghost" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Step 2.3.11: Quote Selector Modal

**File:** `components/quotes/QuoteSelector.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Quote, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuoteCard } from "./QuoteCard";
import { CreateQuoteForm } from "./CreateQuoteForm";
import { QuoteNodeSummary, QuoteUsageType } from "@/lib/quotes/types";

interface QuoteSelectorProps {
  sourceId?: string;
  onSelect: (quote: QuoteNodeSummary, usageType: QuoteUsageType) => void;
  trigger?: React.ReactNode;
}

export function QuoteSelector({
  sourceId,
  onSelect,
  trigger,
}: QuoteSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<QuoteNodeSummary | null>(
    null
  );
  const [usageType, setUsageType] = useState<QuoteUsageType>("EVIDENCE");

  const { data, isLoading } = useQuery({
    queryKey: ["quotes", { sourceId, q: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sourceId) params.set("sourceId", sourceId);
      if (searchQuery) params.set("q", searchQuery);
      params.set("limit", "20");

      const res = await fetch(`/api/quotes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json();
    },
    enabled: open,
  });

  const handleConfirm = () => {
    if (selectedQuote) {
      onSelect(selectedQuote, usageType);
      setOpen(false);
      setSelectedQuote(null);
    }
  };

  const handleQuoteCreated = (quote: QuoteNodeSummary) => {
    setSelectedQuote(quote);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Quote className="h-4 w-4 mr-2" />
            Add Quote
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Select Quote</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="search" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search Existing</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Results */}
            <ScrollArea className="h-[350px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : data?.quotes?.length > 0 ? (
                <div className="space-y-2 pr-4">
                  {data.quotes.map((quote: QuoteNodeSummary) => (
                    <QuoteCard
                      key={quote.id}
                      quote={quote}
                      compact
                      onSelect={setSelectedQuote}
                      selected={selectedQuote?.id === quote.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Quote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No quotes found</p>
                  <p className="text-sm">Try creating a new one</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create">
            <CreateQuoteForm
              sourceId={sourceId}
              onCreated={handleQuoteCreated}
            />
          </TabsContent>
        </Tabs>

        {/* Usage type selector and confirm */}
        {selectedQuote && (
          <div className="border-t pt-4 mt-4 space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Selected:</span>{" "}
              <span className="italic">
                "{selectedQuote.text.slice(0, 60)}..."
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Use as:</label>
              <select
                value={usageType}
                onChange={(e) => setUsageType(e.target.value as QuoteUsageType)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="EVIDENCE">Evidence</option>
                <option value="COUNTER">Counter-evidence</option>
                <option value="CONTEXT">Context</option>
                <option value="DEFINITION">Definition</option>
                <option value="METHODOLOGY">Methodology</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedQuote(null)}>
                Clear
              </Button>
              <Button onClick={handleConfirm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Quote
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 2.3.12: Interpretation Panel

**File:** `components/quotes/InterpretationPanel.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Plus,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { InterpretationWithVotes } from "@/lib/quotes/types";

interface InterpretationPanelProps {
  quoteId: string;
  quoteText: string;
}

export function InterpretationPanel({
  quoteId,
  quoteText,
}: InterpretationPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [newInterpretation, setNewInterpretation] = useState("");
  const [framework, setFramework] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: interpretations, isLoading } = useQuery<InterpretationWithVotes[]>({
    queryKey: ["quote-interpretations", quoteId],
    queryFn: async () => {
      const res = await fetch(`/api/quotes/${quoteId}/interpretations`);
      if (!res.ok) throw new Error("Failed to fetch interpretations");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quotes/${quoteId}/interpretations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interpretation: newInterpretation,
          framework: framework || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create interpretation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quote-interpretations", quoteId],
      });
      setNewInterpretation("");
      setFramework("");
      setShowForm(false);
      toast({ title: "Interpretation added" });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({
      interpId,
      vote,
    }: {
      interpId: string;
      vote: 1 | -1;
    }) => {
      const res = await fetch(`/api/interpretations/${interpId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      if (!res.ok) throw new Error("Failed to vote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quote-interpretations", quoteId],
      });
    },
  });

  const handleVote = (interpId: string, vote: 1 | -1) => {
    voteMutation.mutate({ interpId, vote });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Interpretations
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quote preview */}
        <div className="bg-muted/50 p-3 rounded-md border-l-4 border-primary/30">
          <p className="text-sm italic line-clamp-2">"{quoteText}"</p>
        </div>

        {/* New interpretation form */}
        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
            <Textarea
              placeholder="What does this passage mean? Provide your interpretation..."
              value={newInterpretation}
              onChange={(e) => setNewInterpretation(e.target.value)}
              rows={4}
            />
            <div className="flex items-center gap-3">
              <Input
                placeholder="Theoretical framework (optional)"
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="max-w-xs"
              />
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createMutation.mutate()}
                disabled={!newInterpretation.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Interpretations list */}
        {interpretations?.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No interpretations yet</p>
            <p className="text-sm">Be the first to interpret this passage</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interpretations?.map((interp) => (
              <InterpretationItem
                key={interp.id}
                interpretation={interp}
                onVote={handleVote}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InterpretationItem({
  interpretation,
  onVote,
}: {
  interpretation: InterpretationWithVotes;
  onVote: (id: string, vote: 1 | -1) => void;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={interpretation.author.image} />
            <AvatarFallback>
              {interpretation.author.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {interpretation.author.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(interpretation.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        {interpretation.framework && (
          <Badge variant="secondary" className="text-xs">
            {interpretation.framework}
          </Badge>
        )}
      </div>

      {/* Content */}
      <p className="text-sm">{interpretation.interpretation}</p>

      {/* Voting */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onVote(interpretation.id, 1)}
          className={cn(
            interpretation.userVote === 1 && "text-green-600 bg-green-50"
          )}
        >
          <ThumbsUp className="h-4 w-4 mr-1" />
        </Button>
        <span
          className={cn(
            "text-sm font-medium min-w-[2rem] text-center",
            interpretation.voteScore > 0 && "text-green-600",
            interpretation.voteScore < 0 && "text-red-600"
          )}
        >
          {interpretation.voteScore > 0 && "+"}
          {interpretation.voteScore}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onVote(interpretation.id, -1)}
          className={cn(
            interpretation.userVote === -1 && "text-red-600 bg-red-50"
          )}
        >
          <ThumbsDown className="h-4 w-4 mr-1" />
        </Button>
      </div>

      {/* Challenges/Supports */}
      {(interpretation.supportedBy.length > 0 ||
        interpretation.challengedBy.length > 0) && (
        <div className="pt-2 border-t space-y-2">
          {interpretation.supportedBy.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-2 text-xs text-green-700 bg-green-50 p-2 rounded"
            >
              <ArrowRight className="h-3 w-3 mt-0.5" />
              <span>
                <strong>{s.author.name}</strong> supports: {s.interpretation.slice(0, 100)}...
              </span>
            </div>
          ))}
          {interpretation.challengedBy.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-2 text-xs text-red-700 bg-red-50 p-2 rounded"
            >
              <ArrowRight className="h-3 w-3 mt-0.5 rotate-180" />
              <span>
                <strong>{c.author.name}</strong> challenges: {c.interpretation.slice(0, 100)}...
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Step 2.3.13: Lint Results Display

**File:** `components/linting/LintResultsDisplay.tsx`

```tsx
"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { LintReport, LintRuleResult } from "@/lib/linting/types";

interface LintResultsDisplayProps {
  report: LintReport;
  showAllRules?: boolean;
}

const SEVERITY_CONFIG = {
  error: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    label: "Warning",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Info",
  },
};

export function LintResultsDisplay({
  report,
  showAllRules = false,
}: LintResultsDisplayProps) {
  const failedResults = report.results.filter((r) => !r.pass);
  const displayResults = showAllRules ? report.results : failedResults;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Quality Check
          </CardTitle>
          <QualityBadge score={report.score} canSubmit={report.canSubmit} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quality Score</span>
            <span
              className={cn(
                "font-medium",
                report.score >= 80 && "text-green-600",
                report.score >= 50 && report.score < 80 && "text-yellow-600",
                report.score < 50 && "text-red-600"
              )}
            >
              {report.score}/100
            </span>
          </div>
          <Progress
            value={report.score}
            className={cn(
              "h-2",
              report.score >= 80 && "[&>div]:bg-green-500",
              report.score >= 50 && report.score < 80 && "[&>div]:bg-yellow-500",
              report.score < 50 && "[&>div]:bg-red-500"
            )}
          />
        </div>

        {/* Summary badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            {report.summary.passed} passed
          </Badge>
          {report.summary.errors > 0 && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              {report.summary.errors} error{report.summary.errors !== 1 && "s"}
            </Badge>
          )}
          {report.summary.warnings > 0 && (
            <Badge
              variant="outline"
              className="gap-1 border-yellow-300 text-yellow-700"
            >
              <AlertTriangle className="h-3 w-3" />
              {report.summary.warnings} warning
              {report.summary.warnings !== 1 && "s"}
            </Badge>
          )}
          {report.summary.infos > 0 && (
            <Badge
              variant="outline"
              className="gap-1 border-blue-300 text-blue-700"
            >
              <Info className="h-3 w-3" />
              {report.summary.infos} suggestion
              {report.summary.infos !== 1 && "s"}
            </Badge>
          )}
        </div>

        {/* Blocking message */}
        {!report.canSubmit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Cannot submit</p>
              <p className="text-sm text-red-700">
                Fix {report.summary.errors} error
                {report.summary.errors !== 1 && "s"} before submitting
              </p>
            </div>
          </div>
        )}

        {/* Results list */}
        {displayResults.length > 0 ? (
          <Accordion type="multiple" className="space-y-2">
            {displayResults.map((result, idx) => (
              <LintResultItem key={`${result.ruleId}-${idx}`} result={result} />
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-4 text-green-600">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2" />
            <p className="font-medium">All checks passed!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LintResultItem({ result }: { result: LintRuleResult }) {
  const config = SEVERITY_CONFIG[result.severity];
  const Icon = result.pass ? CheckCircle2 : config.icon;

  return (
    <AccordionItem
      value={result.ruleId}
      className={cn(
        "border rounded-lg px-4",
        !result.pass && config.border,
        !result.pass && config.bg
      )}
    >
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center gap-3 text-left">
          <Icon
            className={cn(
              "h-5 w-5 flex-shrink-0",
              result.pass ? "text-green-600" : config.color
            )}
          />
          <div>
            <p className="font-medium text-sm">{result.ruleName}</p>
            {!result.pass && result.message && (
              <p className={cn("text-xs", config.color)}>{result.message}</p>
            )}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pb-3">
        <div className="pl-8 space-y-2">
          {result.details && (
            <div className="text-sm bg-white/50 p-2 rounded border">
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </div>
          )}

          {result.suggestion && (
            <div className="flex items-start gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{result.suggestion}</span>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// Exported separately for reuse
export function QualityBadge({
  score,
  canSubmit,
}: {
  score: number;
  canSubmit: boolean;
}) {
  if (!canSubmit) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Blocked
      </Badge>
    );
  }

  if (score >= 80) {
    return (
      <Badge className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle2 className="h-3 w-3" />
        High Quality
      </Badge>
    );
  }

  if (score >= 50) {
    return (
      <Badge className="gap-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        <AlertTriangle className="h-3 w-3" />
        Needs Work
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="h-3 w-3" />
      Low Quality
    </Badge>
  );
}
```

---

### Step 2.3.14: Create Quote Form

**File:** `components/quotes/CreateQuoteForm.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { SourceSelector } from "@/components/citations/SourceSelector";
import { QuoteNodeSummary, LocatorType } from "@/lib/quotes/types";

interface CreateQuoteFormProps {
  sourceId?: string;
  onCreated: (quote: QuoteNodeSummary) => void;
}

const LOCATOR_TYPES: Array<{ value: LocatorType; label: string }> = [
  { value: "PAGE", label: "Page (p.)" },
  { value: "SECTION", label: "Section (§)" },
  { value: "CHAPTER", label: "Chapter (Ch.)" },
  { value: "VERSE", label: "Verse" },
  { value: "TIMESTAMP", label: "Timestamp" },
  { value: "LINE", label: "Line" },
  { value: "PARAGRAPH", label: "Paragraph (¶)" },
  { value: "CUSTOM", label: "Custom" },
];

export function CreateQuoteForm({ sourceId, onCreated }: CreateQuoteFormProps) {
  const [selectedSourceId, setSelectedSourceId] = useState(sourceId || "");
  const [text, setText] = useState("");
  const [locator, setLocator] = useState("");
  const [locatorType, setLocatorType] = useState<LocatorType>("PAGE");
  const [context, setContext] = useState("");

  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: selectedSourceId,
          text,
          locator: locator || undefined,
          locatorType,
          context: context || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create quote");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Quote created" });
      onCreated(data);
      setText("");
      setLocator("");
      setContext("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create quote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      {/* Source selector (if not pre-set) */}
      {!sourceId && (
        <div className="space-y-2">
          <Label>Source</Label>
          <SourceSelector
            value={selectedSourceId}
            onChange={setSelectedSourceId}
          />
        </div>
      )}

      {/* Quote text */}
      <div className="space-y-2">
        <Label htmlFor="quote-text">Quote Text *</Label>
        <Textarea
          id="quote-text"
          placeholder="Enter the exact quoted text..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />
      </div>

      {/* Locator */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Locator Type</Label>
          <Select
            value={locatorType}
            onValueChange={(v) => setLocatorType(v as LocatorType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATOR_TYPES.map((lt) => (
                <SelectItem key={lt.value} value={lt.value}>
                  {lt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="locator">Location</Label>
          <Input
            id="locator"
            placeholder="42"
            value={locator}
            onChange={(e) => setLocator(e.target.value)}
          />
        </div>
      </div>

      {/* Context */}
      <div className="space-y-2">
        <Label htmlFor="context">Surrounding Context (optional)</Label>
        <Textarea
          id="context"
          placeholder="Text before and after the quote for context..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Adding context helps readers understand the quote's original setting
        </p>
      </div>

      {/* Submit */}
      <Button
        onClick={() => createMutation.mutate()}
        disabled={!selectedSourceId || !text.trim() || createMutation.isPending}
        className="w-full"
      >
        {createMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Quote"
        )}
      </Button>
    </div>
  );
}
```

---

## Phase 2.3 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | QuoteNode schema | `prisma/schema.prisma` | 📋 Part 1 |
| 2 | QuoteInterpretation schema | `prisma/schema.prisma` | 📋 Part 1 |
| 3 | Quote types | `lib/quotes/types.ts` | 📋 Part 1 |
| 4 | Quote service | `lib/quotes/quoteService.ts` | 📋 Part 1 |
| 5 | Interpretation service | `lib/quotes/interpretationService.ts` | 📋 Part 1 |
| 6 | Linting types | `lib/linting/types.ts` | 📋 Part 2 |
| 7 | Lint rules | `lib/linting/rules.ts` | 📋 Part 2 |
| 8 | Linter service | `lib/linting/linterService.ts` | 📋 Part 2 |
| 9 | Quote API routes | `app/api/quotes/` | 📋 Part 2 |
| 10 | Interpretation APIs | `app/api/quotes/[quoteId]/interpretations/` | 📋 Part 2 |
| 11 | Linting APIs | `app/api/arguments/[argId]/lint/` | 📋 Part 2 |
| 12 | Preview lint API | `app/api/lint/preview/` | 📋 Part 2 |
| 13 | QuoteCard component | `components/quotes/QuoteCard.tsx` | 📋 Part 3 |
| 14 | QuoteSelector | `components/quotes/QuoteSelector.tsx` | 📋 Part 3 |
| 15 | InterpretationPanel | `components/quotes/InterpretationPanel.tsx` | 📋 Part 3 |
| 16 | LintResultsDisplay | `components/linting/LintResultsDisplay.tsx` | 📋 Part 3 |
| 17 | CreateQuoteForm | `components/quotes/CreateQuoteForm.tsx` | 📋 Part 3 |

---

## Integration Examples

### Adding Quote Support to Argument Builder

```tsx
// In your argument builder component, add:
import { QuoteSelector } from "@/components/quotes/QuoteSelector";
import { QuoteCard } from "@/components/quotes/QuoteCard";

// In the premise editing section:
<div className="space-y-2">
  <Label>Textual Evidence</Label>
  {selectedQuotes.map((quote) => (
    <QuoteCard key={quote.id} quote={quote} compact />
  ))}
  <QuoteSelector
    sourceId={currentSourceId}
    onSelect={(quote, usageType) => {
      setSelectedQuotes([...selectedQuotes, { ...quote, usageType }]);
    }}
  />
</div>
```

### Live Linting in Argument Composer

```tsx
// In your argument composer, add real-time linting:
import { LintResultsDisplay, QualityBadge } from "@/components/linting/LintResultsDisplay";

const { data: lintReport, refetch: runLint } = useQuery({
  queryKey: ["lint-preview", argumentDraft],
  queryFn: async () => {
    const res = await fetch("/api/lint/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(argumentDraft),
    });
    return res.json();
  },
  enabled: false, // Manual trigger
});

// Debounced lint on change
useEffect(() => {
  const timeout = setTimeout(() => {
    if (argumentDraft.premises.length > 0) {
      runLint();
    }
  }, 1000);
  return () => clearTimeout(timeout);
}, [argumentDraft]);

// In render:
{lintReport && (
  <LintResultsDisplay report={lintReport} />
)}

// Block submit if errors
<Button 
  disabled={lintReport && !lintReport.canSubmit}
  onClick={handleSubmit}
>
  Submit Argument
</Button>
```

---

## Phase 2 Complete 🎉

Phase 2 "Discourse Substrate" is now fully documented across:

| Sub-Phase | Documents | Focus |
|-----------|-----------|-------|
| 2.1 | Part 1 + Part 2 | Debate Releases & Versioned Memory |
| 2.2 | Part 1 + Part 2 | Fork/Branch/Merge for Deliberations |
| 2.3 | Part 1 + Part 2 + Part 3 | Quote Nodes & Argument Quality Gates |

**Ready for Phase 3: Knowledge Graph** when you're ready to proceed!

---

*End of Phase 2.3*
