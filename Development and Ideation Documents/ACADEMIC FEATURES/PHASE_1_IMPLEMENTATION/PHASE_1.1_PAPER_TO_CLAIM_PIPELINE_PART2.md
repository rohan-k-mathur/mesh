# Phase 1.1: Paper-to-Claim Pipeline — Part 2 (UI Components)

**Sub-Phase:** 1.1 of 1.4 (continued)  
**Focus:** UI Components for Claim Extraction  
**Depends On:** Part 1 (APIs and services)

---

## UI Components

### Step 1.1.10: Claim Extraction Panel

**File:** `components/claims/ClaimExtractionPanel.tsx`

```typescript
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClaimType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Check,
  Edit2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ClaimTypeSelector, CLAIM_TYPE_INFO } from "./ClaimTypeSelector";
import { cn } from "@/lib/utils";

interface ExtractedClaim {
  text: string;
  claimType: ClaimType;
  supportingQuote?: string;
  pageNumber?: number;
  sectionName?: string;
  confidence: number;
  reasoning: string;
}

interface ClaimExtractionPanelProps {
  sourceId: string;
  sourceTitle: string;
  hasAbstract: boolean;
  onClaimsCreated?: (claimIds: string[]) => void;
}

export function ClaimExtractionPanel({
  sourceId,
  sourceTitle,
  hasAbstract,
  onClaimsCreated,
}: ClaimExtractionPanelProps) {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [extractionMode, setExtractionMode] = useState<"abstract" | "fulltext">(
    "abstract"
  );
  const [fulltext, setFulltext] = useState("");
  const [suggestions, setSuggestions] = useState<ExtractedClaim[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(
    new Set()
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // AI extraction mutation
  const extractMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/claims/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          mode: extractionMode,
          fulltext: extractionMode === "fulltext" ? fulltext : undefined,
        }),
      });
      if (!response.ok) throw new Error("Extraction failed");
      return response.json();
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
      // Auto-select high-confidence claims
      const highConfidence = new Set<number>();
      data.suggestions.forEach((s: ExtractedClaim, i: number) => {
        if (s.confidence >= 0.7) highConfidence.add(i);
      });
      setSelectedSuggestions(highConfidence);
    },
  });

  // Create claims mutation
  const createMutation = useMutation({
    mutationFn: async (claims: ExtractedClaim[]) => {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          claims: claims.map((c) => ({
            text: c.text,
            sourceId,
            claimType: c.claimType,
            supportingQuote: c.supportingQuote,
            pageNumber: c.pageNumber,
            sectionName: c.sectionName,
            extractedByAI: true,
            aiConfidence: c.confidence,
          })),
        }),
      });
      if (!response.ok) throw new Error("Failed to create claims");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["source", sourceId] });
      queryClient.invalidateQueries({ queryKey: ["claims", sourceId] });
      onClaimsCreated?.(data.claims.map((c: any) => c.id));
      setSuggestions([]);
      setSelectedSuggestions(new Set());
    },
  });

  const handleToggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
  };

  const handleDeselectAll = () => {
    setSelectedSuggestions(new Set());
  };

  const handleEditSuggestion = (index: number, updates: Partial<ExtractedClaim>) => {
    const newSuggestions = [...suggestions];
    newSuggestions[index] = { ...newSuggestions[index], ...updates };
    setSuggestions(newSuggestions);
    setEditingIndex(null);
  };

  const handleRemoveSuggestion = (index: number) => {
    const newSuggestions = suggestions.filter((_, i) => i !== index);
    setSuggestions(newSuggestions);
    const newSelected = new Set<number>();
    selectedSuggestions.forEach((i) => {
      if (i < index) newSelected.add(i);
      else if (i > index) newSelected.add(i - 1);
    });
    setSelectedSuggestions(newSelected);
  };

  const handleCreateSelected = () => {
    const selectedClaims = suggestions.filter((_, i) =>
      selectedSuggestions.has(i)
    );
    createMutation.mutate(selectedClaims);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Extract Claims from Source
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-4">
          <Button
            variant={mode === "ai" ? "default" : "outline"}
            onClick={() => setMode("ai")}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Assisted
          </Button>
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            onClick={() => setMode("manual")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Manual Entry
          </Button>
        </div>

        {mode === "ai" && (
          <>
            {/* Extraction Source Selection */}
            <div className="space-y-3">
              <Label>Extract claims from:</Label>
              <div className="flex gap-3">
                <Button
                  variant={extractionMode === "abstract" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setExtractionMode("abstract")}
                  disabled={!hasAbstract}
                >
                  Abstract
                  {!hasAbstract && " (not available)"}
                </Button>
                <Button
                  variant={extractionMode === "fulltext" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setExtractionMode("fulltext")}
                >
                  Full Text (paste)
                </Button>
              </div>
            </div>

            {/* Fulltext Input */}
            {extractionMode === "fulltext" && (
              <div className="space-y-2">
                <Label>Paste paper text:</Label>
                <Textarea
                  placeholder="Paste the full text or relevant sections of the paper..."
                  value={fulltext}
                  onChange={(e) => setFulltext(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {fulltext.length} characters • ~{Math.ceil(fulltext.length / 4)} tokens
                </p>
              </div>
            )}

            {/* Extract Button */}
            <Button
              onClick={() => extractMutation.mutate()}
              disabled={
                extractMutation.isPending ||
                (extractionMode === "fulltext" && fulltext.length < 100)
              }
              className="w-full"
            >
              {extractMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting claims...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Extract Claims with AI
                </>
              )}
            </Button>

            {/* Error Display */}
            {extractMutation.isError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                Failed to extract claims. Please try again.
              </div>
            )}

            {/* Suggestions List */}
            {suggestions.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    AI Suggestions ({suggestions.length} claims)
                  </h4>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeselectAll}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <SuggestionCard
                      key={index}
                      suggestion={suggestion}
                      index={index}
                      isSelected={selectedSuggestions.has(index)}
                      isEditing={editingIndex === index}
                      onToggle={() => handleToggleSuggestion(index)}
                      onEdit={(updates) => handleEditSuggestion(index, updates)}
                      onRemove={() => handleRemoveSuggestion(index)}
                      onStartEdit={() => setEditingIndex(index)}
                      onCancelEdit={() => setEditingIndex(null)}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedSuggestions.size} of {suggestions.length} selected
                  </p>
                  <Button
                    onClick={handleCreateSelected}
                    disabled={
                      selectedSuggestions.size === 0 || createMutation.isPending
                    }
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Create {selectedSuggestions.size} Claim
                        {selectedSuggestions.size !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {mode === "manual" && (
          <ManualClaimForm sourceId={sourceId} onSuccess={onClaimsCreated} />
        )}
      </CardContent>
    </Card>
  );
}

// Suggestion Card Component
interface SuggestionCardProps {
  suggestion: ExtractedClaim;
  index: number;
  isSelected: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: (updates: Partial<ExtractedClaim>) => void;
  onRemove: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}

function SuggestionCard({
  suggestion,
  index,
  isSelected,
  isEditing,
  onToggle,
  onEdit,
  onRemove,
  onStartEdit,
  onCancelEdit,
}: SuggestionCardProps) {
  const [editText, setEditText] = useState(suggestion.text);
  const [editType, setEditType] = useState(suggestion.claimType);
  const typeInfo = CLAIM_TYPE_INFO[suggestion.claimType];

  if (isEditing) {
    return (
      <Card className="border-2 border-blue-200">
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <Label>Claim Text</Label>
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Claim Type</Label>
            <ClaimTypeSelector value={editType} onChange={setEditType} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onCancelEdit}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onEdit({ text: editText, claimType: editType })}
            >
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "transition-colors cursor-pointer",
        isSelected
          ? "border-2 border-green-500 bg-green-50/50"
          : "hover:border-gray-300"
      )}
      onClick={onToggle}
    >
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm leading-relaxed">{suggestion.text}</p>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit();
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={typeInfo.color} variant="secondary">
                {typeInfo.label}
              </Badge>
              <ConfidenceBadge confidence={suggestion.confidence} />
              {suggestion.sectionName && (
                <Badge variant="outline" className="text-xs">
                  {suggestion.sectionName}
                </Badge>
              )}
            </div>

            {suggestion.supportingQuote && (
              <blockquote className="text-xs text-muted-foreground italic border-l-2 pl-3 mt-2">
                "{suggestion.supportingQuote.slice(0, 150)}
                {suggestion.supportingQuote.length > 150 ? "..." : ""}"
              </blockquote>
            )}

            {suggestion.reasoning && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Why:</span> {suggestion.reasoning}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Confidence Badge
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  let color = "bg-gray-100 text-gray-600";
  if (percentage >= 80) color = "bg-green-100 text-green-700";
  else if (percentage >= 60) color = "bg-yellow-100 text-yellow-700";
  else color = "bg-red-100 text-red-700";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={color} variant="secondary">
          {percentage}% confidence
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>AI confidence in this claim extraction</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Manual Claim Form
interface ManualClaimFormProps {
  sourceId: string;
  onSuccess?: (claimIds: string[]) => void;
}

function ManualClaimForm({ sourceId, onSuccess }: ManualClaimFormProps) {
  const [text, setText] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>(ClaimType.THESIS);
  const [supportingQuote, setSupportingQuote] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [sectionName, setSectionName] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          sourceId,
          claimType,
          supportingQuote: supportingQuote || undefined,
          pageNumber: pageNumber ? parseInt(pageNumber) : undefined,
          sectionName: sectionName || undefined,
          extractedByAI: false,
        }),
      });
      if (!response.ok) throw new Error("Failed to create claim");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["source", sourceId] });
      queryClient.invalidateQueries({ queryKey: ["claims", sourceId] });
      onSuccess?.([data.claim.id]);
      // Reset form
      setText("");
      setSupportingQuote("");
      setPageNumber("");
      setSectionName("");
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="claim-text">Claim Text *</Label>
        <Textarea
          id="claim-text"
          placeholder="Enter the specific claim from this source..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Claim Type *</Label>
          <ClaimTypeSelector value={claimType} onChange={setClaimType} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="page-number">Page Number</Label>
          <Input
            id="page-number"
            type="number"
            placeholder="42"
            value={pageNumber}
            onChange={(e) => setPageNumber(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="section-name">Section Name</Label>
        <Input
          id="section-name"
          placeholder="Introduction, Methods, Discussion..."
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="supporting-quote">Supporting Quote</Label>
        <Textarea
          id="supporting-quote"
          placeholder="Exact quote from the source supporting this claim..."
          value={supportingQuote}
          onChange={(e) => setSupportingQuote(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      <Button
        onClick={() => createMutation.mutate()}
        disabled={text.length < 10 || createMutation.isPending}
        className="w-full"
      >
        {createMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Create Claim
          </>
        )}
      </Button>

      {createMutation.isError && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          Failed to create claim. Please try again.
        </div>
      )}
    </div>
  );
}
```

---

### Step 1.1.11: Source Detail Page with Claims

**File:** `components/sources/SourceDetailPage.tsx`

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  Link2,
  MessageSquare,
  Users,
} from "lucide-react";
import { ClaimExtractionPanel } from "@/components/claims/ClaimExtractionPanel";
import { ClaimTypeBadge } from "@/components/claims/ClaimTypeSelector";
import { formatDate } from "@/lib/utils";

interface SourceDetailPageProps {
  sourceId: string;
}

export function SourceDetailPage({ sourceId }: SourceDetailPageProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["source", sourceId],
    queryFn: async () => {
      const response = await fetch(`/api/sources/${sourceId}`);
      if (!response.ok) throw new Error("Failed to fetch source");
      return response.json();
    },
  });

  if (isLoading) {
    return <SourceDetailSkeleton />;
  }

  if (error || !data?.source) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Failed to load source details.</p>
        </CardContent>
      </Card>
    );
  }

  const { source } = data;

  return (
    <div className="space-y-6">
      {/* Source Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-xl leading-tight">
                {source.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {source.authors?.join(", ") || "Unknown authors"}
              </div>
              {source.venue && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  {source.venue}
                  {source.volume && `, Vol. ${source.volume}`}
                  {source.issue && ` (${source.issue})`}
                  {source.pages && `, pp. ${source.pages}`}
                </div>
              )}
              {source.publicationDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(source.publicationDate)}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {source.identifier && (
                <Badge variant="outline" className="font-mono text-xs">
                  {source.identifierType}: {source.identifier}
                </Badge>
              )}
              {source.url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Source
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {source.abstractText && (
          <CardContent>
            <h4 className="font-medium mb-2">Abstract</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {source.abstractText}
            </p>
          </CardContent>
        )}
        {source.keywords?.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {source.keywords.map((keyword: string, i: number) => (
                <Badge key={i} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabs: Claims & Extract */}
      <Tabs defaultValue="claims">
        <TabsList>
          <TabsTrigger value="claims">
            <FileText className="mr-2 h-4 w-4" />
            Claims ({source._count?.claims || 0})
          </TabsTrigger>
          <TabsTrigger value="extract">
            <MessageSquare className="mr-2 h-4 w-4" />
            Extract Claims
          </TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="mt-4">
          <ClaimsList sourceId={sourceId} />
        </TabsContent>

        <TabsContent value="extract" className="mt-4">
          <ClaimExtractionPanel
            sourceId={sourceId}
            sourceTitle={source.title}
            hasAbstract={!!source.abstractText}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Claims List Component
function ClaimsList({ sourceId }: { sourceId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["claims", sourceId],
    queryFn: async () => {
      const response = await fetch(`/api/sources/${sourceId}/claims`);
      if (!response.ok) throw new Error("Failed to fetch claims");
      return response.json();
    },
  });

  if (isLoading) {
    return <ClaimsListSkeleton />;
  }

  if (!data?.claims?.length) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-medium">No claims yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Extract claims from this source using AI or add them manually.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.claims.map((claim: any) => (
        <Card key={claim.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <p className="text-sm leading-relaxed">{claim.text}</p>
              
              <div className="flex items-center gap-2 flex-wrap">
                {claim.claimType && (
                  <ClaimTypeBadge type={claim.claimType} />
                )}
                {claim.extractedByAI && (
                  <Badge variant="outline" className="text-xs">
                    AI Extracted
                    {claim.aiConfidence && (
                      <span className="ml-1">
                        ({Math.round(claim.aiConfidence * 100)}%)
                      </span>
                    )}
                  </Badge>
                )}
                {claim.humanVerified && (
                  <Badge
                    variant="outline"
                    className="text-xs text-green-600 border-green-600"
                  >
                    Verified
                  </Badge>
                )}
                {claim.pageNumber && (
                  <Badge variant="outline" className="text-xs">
                    p. {claim.pageNumber}
                  </Badge>
                )}
              </div>

              {claim.supportingQuote && (
                <blockquote className="text-xs text-muted-foreground italic border-l-2 pl-3">
                  "{claim.supportingQuote.slice(0, 200)}
                  {claim.supportingQuote.length > 200 ? "..." : ""}"
                </blockquote>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {claim._count?.arguments > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {claim._count.arguments} arguments
                    </span>
                  )}
                  {claim._count?.edges > 0 && (
                    <span className="flex items-center gap-1">
                      <Link2 className="h-3 w-3" />
                      {claim._count.edges} connections
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  Discuss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton components
function SourceDetailSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function ClaimsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse mt-2" />
            <div className="flex gap-2 mt-3">
              <div className="h-5 w-20 bg-muted rounded animate-pulse" />
              <div className="h-5 w-24 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

### Step 1.1.12: DOI Input Component

**File:** `components/sources/DOIInput.tsx`

```typescript
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface DOIInputProps {
  onSourceCreated?: (sourceId: string) => void;
}

export function DOIInput({ onSourceCreated }: DOIInputProps) {
  const [doi, setDoi] = useState("");
  const router = useRouter();

  const resolveMutation = useMutation({
    mutationFn: async (doiValue: string) => {
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doi: doiValue }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resolve DOI");
      }
      return response.json();
    },
    onSuccess: (data) => {
      onSourceCreated?.(data.source.id);
      if (data.existing) {
        // Source already exists, navigate to it
        router.push(`/sources/${data.source.id}`);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (doi.trim()) {
      resolveMutation.mutate(doi.trim());
    }
  };

  const isValidDOI =
    /^(10\.\d{4,}\/[^\s]+|doi:|https?:\/\/(dx\.)?doi\.org\/)/i.test(doi.trim());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Source by DOI</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doi-input">DOI</Label>
            <div className="flex gap-2">
              <Input
                id="doi-input"
                placeholder="10.1234/example or https://doi.org/10.1234/example"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
              <Button
                type="submit"
                disabled={!isValidDOI || resolveMutation.isPending}
              >
                {resolveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a DOI and we'll fetch the metadata automatically from Crossref
            </p>
          </div>

          {resolveMutation.isError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {resolveMutation.error?.message || "Could not resolve DOI"}
            </div>
          )}

          {resolveMutation.isSuccess && (
            <div className="rounded-lg border p-4 bg-green-50">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Check className="h-4 w-4" />
                <span className="font-medium">
                  {resolveMutation.data.existing
                    ? "Source already exists"
                    : "Source created successfully"}
                </span>
              </div>
              <p className="text-sm font-medium">
                {resolveMutation.data.source.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {resolveMutation.data.source.authors?.join(", ")}
              </p>
              <Button
                variant="link"
                className="mt-2 p-0 h-auto"
                onClick={() =>
                  router.push(`/sources/${resolveMutation.data.source.id}`)
                }
              >
                View Source →
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## Phase 1.1 Complete Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Schema updates | `prisma/schema.prisma` | 📋 Part 1 |
| 2 | DOI resolution service | `lib/integrations/crossref.ts` | 📋 Part 1 |
| 3 | OpenAlex enrichment | `lib/integrations/openAlex.ts` | 📋 Part 1 |
| 4 | Source registration API | `app/api/sources/route.ts` | 📋 Part 1 |
| 5 | AI claim extraction | `lib/claims/extraction.ts` | 📋 Part 1 |
| 6 | Claim extraction API | `app/api/claims/extract/route.ts` | 📋 Part 1 |
| 7 | Claim creation API | `app/api/claims/route.ts` | 📋 Part 1 |
| 8 | ClaimTypeSelector | `components/claims/ClaimTypeSelector.tsx` | 📋 Part 1 |
| 9 | Unit tests | `__tests__/lib/integrations/crossref.test.ts` | 📋 Part 1 |
| 10 | ClaimExtractionPanel | `components/claims/ClaimExtractionPanel.tsx` | 📋 Part 2 |
| 11 | SourceDetailPage | `components/sources/SourceDetailPage.tsx` | 📋 Part 2 |
| 12 | DOIInput | `components/sources/DOIInput.tsx` | 📋 Part 2 |

---

## Next: Phase 1.2

Continue to [PHASE_1.2_CLAIM_SEARCH_DISCOVERY.md](./PHASE_1.2_CLAIM_SEARCH_DISCOVERY.md) for:
- Semantic claim search implementation
- Claim embedding pipeline
- Related arguments panel
- Search API and UI

---

*End of Phase 1.1 Implementation Guide*
