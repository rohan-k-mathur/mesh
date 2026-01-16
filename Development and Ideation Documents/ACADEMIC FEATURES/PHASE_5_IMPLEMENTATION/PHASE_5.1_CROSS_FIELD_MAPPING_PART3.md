# Phase 5.1: Cross-Field Claim Mapping (Part 3)

**Sub-Phase:** 5.1 of 5.3  
**Focus:** UI Components for Fields, Concepts & Alerts

---

## Implementation Steps (Continued)

### Step 5.1.8: Field Hierarchy Browser

**File:** `components/crossfield/FieldBrowser.tsx`

```tsx
/**
 * Interactive field taxonomy browser
 */

"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, BookOpen, Layers, Hash } from "lucide-react";
import { useFieldHierarchy, useField } from "@/lib/crossfield/hooks";
import { FieldHierarchy, EpistemicStyle } from "@/lib/crossfield/types";

interface FieldBrowserProps {
  onSelectField?: (fieldId: string) => void;
  selectedFieldId?: string;
}

export function FieldBrowser({
  onSelectField,
  selectedFieldId,
}: FieldBrowserProps) {
  const { data: hierarchy, isLoading } = useFieldHierarchy();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h3 className="font-semibold text-gray-900">Academic Fields</h3>
        <p className="text-sm text-gray-500">Browse fields by discipline</p>
      </div>
      <div className="p-2 max-h-96 overflow-y-auto">
        {hierarchy?.map((field) => (
          <FieldNode
            key={field.id}
            field={field}
            level={0}
            onSelect={onSelectField}
            selectedId={selectedFieldId}
          />
        ))}
      </div>
    </div>
  );
}

interface FieldNodeProps {
  field: FieldHierarchy;
  level: number;
  onSelect?: (fieldId: string) => void;
  selectedId?: string;
}

function FieldNode({ field, level, onSelect, selectedId }: FieldNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = field.children.length > 0;
  const isSelected = field.id === selectedId;

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
          ${isSelected ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100"}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect?.(field.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <EpistemicIcon style={field.epistemicStyle} />

        <span className="text-sm font-medium">{field.name}</span>

        {hasChildren && (
          <span className="text-xs text-gray-400 ml-auto">
            {field.children.length}
          </span>
        )}
      </div>

      {expanded &&
        hasChildren &&
        field.children.map((child) => (
          <FieldNode
            key={child.id}
            field={child}
            level={level + 1}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        ))}
    </div>
  );
}

function EpistemicIcon({ style }: { style: EpistemicStyle }) {
  const icons: Record<EpistemicStyle, React.ReactNode> = {
    EMPIRICAL: <Hash className="w-4 h-4 text-green-600" />,
    INTERPRETIVE: <BookOpen className="w-4 h-4 text-purple-600" />,
    FORMAL: <Layers className="w-4 h-4 text-blue-600" />,
    NORMATIVE: <span className="w-4 h-4 text-center text-orange-600">⚖</span>,
    HISTORICAL: <span className="w-4 h-4 text-center text-amber-600">📜</span>,
    MIXED: <span className="w-4 h-4 text-center text-gray-600">◎</span>,
  };
  return icons[style];
}
```

---

### Step 5.1.9: Field Detail Panel

**File:** `components/crossfield/FieldDetail.tsx`

```tsx
/**
 * Detailed view of an academic field
 */

"use client";

import { useField, useConceptsByField } from "@/lib/crossfield/hooks";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Link2, FileText, Users } from "lucide-react";
import { ConceptCard } from "./ConceptCard";

interface FieldDetailProps {
  fieldId: string;
  onConceptSelect?: (conceptId: string) => void;
}

export function FieldDetail({ fieldId, onConceptSelect }: FieldDetailProps) {
  const { data: field, isLoading: fieldLoading } = useField(fieldId);
  const { data: concepts, isLoading: conceptsLoading } =
    useConceptsByField(fieldId);

  if (fieldLoading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  if (!field) {
    return (
      <div className="p-6 text-center text-gray-500">
        Select a field to view details
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">{field.name}</h2>
          <EpistemicBadge style={field.epistemicStyle} />
        </div>

        {field.description && (
          <p className="text-gray-600">{field.description}</p>
        )}

        {field.parent && (
          <p className="text-sm text-gray-500 mt-2">
            Part of: <span className="font-medium">{field.parent.name}</span>
          </p>
        )}

        {/* Key terms */}
        {field.keyTerms.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {field.keyTerms.map((term) => (
              <Badge key={term} variant="outline" className="text-xs">
                {term}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="concepts">
        <TabsList className="mb-4">
          <TabsTrigger value="concepts" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Concepts ({concepts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="subfields" className="gap-2">
            <FileText className="w-4 h-4" />
            Subfields ({field.subFields.length})
          </TabsTrigger>
          <TabsTrigger value="related" className="gap-2">
            <Link2 className="w-4 h-4" />
            Related ({field.relatedFields.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="concepts">
          {conceptsLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded" />
              ))}
            </div>
          ) : concepts && concepts.length > 0 ? (
            <div className="space-y-3">
              {concepts.map((concept) => (
                <ConceptCard
                  key={concept.id}
                  concept={concept}
                  onClick={() => onConceptSelect?.(concept.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No concepts defined yet for this field
            </p>
          )}
        </TabsContent>

        <TabsContent value="subfields">
          {field.subFields.length > 0 ? (
            <div className="grid gap-3">
              {field.subFields.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="font-medium">{sub.name}</div>
                  <div className="text-sm text-gray-500">
                    {sub.claimCount} claims · {sub.conceptCount} concepts
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No subfields</p>
          )}
        </TabsContent>

        <TabsContent value="related">
          {field.relatedFields.length > 0 ? (
            <div className="grid gap-3">
              {field.relatedFields.map((rel) => (
                <div
                  key={rel.field.id}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{rel.field.name}</span>
                    <Badge variant="outline">{formatRelationType(rel.relationType)}</Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Strength: {Math.round(rel.strength * 100)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No related fields mapped
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EpistemicBadge({ style }: { style: string }) {
  const colors: Record<string, string> = {
    EMPIRICAL: "bg-green-100 text-green-800",
    INTERPRETIVE: "bg-purple-100 text-purple-800",
    FORMAL: "bg-blue-100 text-blue-800",
    NORMATIVE: "bg-orange-100 text-orange-800",
    HISTORICAL: "bg-amber-100 text-amber-800",
    MIXED: "bg-gray-100 text-gray-800",
  };

  return (
    <Badge className={colors[style] || colors.MIXED}>
      {style.toLowerCase()}
    </Badge>
  );
}

function formatRelationType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase();
}
```

---

### Step 5.1.10: Concept Card & Detail

**File:** `components/crossfield/ConceptCard.tsx`

```tsx
/**
 * Concept summary card
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Link2 } from "lucide-react";
import { ConceptSummary } from "@/lib/crossfield/types";

interface ConceptCardProps {
  concept: ConceptSummary;
  onClick?: () => void;
  showField?: boolean;
}

export function ConceptCard({
  concept,
  onClick,
  showField = false,
}: ConceptCardProps) {
  return (
    <div
      className={`
        p-4 border rounded-lg transition-colors
        ${onClick ? "hover:bg-gray-50 cursor-pointer" : ""}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{concept.name}</h4>
          {showField && (
            <p className="text-xs text-gray-500 mt-0.5">{concept.fieldName}</p>
          )}
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {concept.definition}
          </p>
        </div>

        {concept.equivalenceCount > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Link2 className="w-3 h-3" />
            {concept.equivalenceCount}
          </Badge>
        )}
      </div>

      {concept.aliases.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {concept.aliases.slice(0, 3).map((alias) => (
            <Badge key={alias} variant="outline" className="text-xs">
              {alias}
            </Badge>
          ))}
          {concept.aliases.length > 3 && (
            <span className="text-xs text-gray-400">
              +{concept.aliases.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

**File:** `components/crossfield/ConceptDetail.tsx`

```tsx
/**
 * Detailed concept view with equivalences
 */

"use client";

import { useState } from "react";
import { useConcept, useSimilarConcepts, useProposeEquivalence } from "@/lib/crossfield/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, Plus, ArrowRight, Loader2 } from "lucide-react";
import { EquivalenceType, ConceptSummary } from "@/lib/crossfield/types";
import { ConceptCard } from "./ConceptCard";

interface ConceptDetailProps {
  conceptId: string;
}

export function ConceptDetail({ conceptId }: ConceptDetailProps) {
  const { data: concept, isLoading } = useConcept(conceptId);
  const { data: similarConcepts } = useSimilarConcepts(conceptId);

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="p-6 text-center text-gray-500">Concept not found</div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <span>{concept.field.name}</span>
          <Badge variant="outline" className="text-xs">
            {concept.field.epistemicStyle.toLowerCase()}
          </Badge>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{concept.name}</h2>

        <p className="text-gray-700 mt-3">{concept.definition}</p>

        {/* Aliases */}
        {concept.aliases.length > 0 && (
          <div className="mt-4">
            <span className="text-sm text-gray-500 mr-2">Also known as:</span>
            <div className="inline-flex flex-wrap gap-1">
              {concept.aliases.map((alias) => (
                <Badge key={alias} variant="outline">
                  {alias}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Related terms */}
        {concept.relatedTerms.length > 0 && (
          <div className="mt-2">
            <span className="text-sm text-gray-500 mr-2">Related terms:</span>
            <span className="text-sm text-gray-700">
              {concept.relatedTerms.join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Equivalences */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Cross-Field Equivalences</h3>
          <ProposeEquivalenceDialog
            sourceConcept={{
              id: concept.id,
              name: concept.name,
              definition: concept.definition,
              fieldId: concept.field.id,
              fieldName: concept.field.name,
              aliases: concept.aliases,
              equivalenceCount: concept.equivalences.length,
              claimCount: 0,
            }}
          />
        </div>

        {concept.equivalences.length > 0 ? (
          <div className="space-y-3">
            {concept.equivalences.map((eq, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {eq.targetConcept.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {eq.targetConcept.fieldName}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                    {eq.targetConcept.definition}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={getEquivalenceColor(eq.equivalenceType)}>
                    {eq.equivalenceType.toLowerCase().replace("_", " ")}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(eq.confidence * 100)}% confidence
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">
            No cross-field equivalences established yet
          </p>
        )}
      </div>

      {/* Similar concepts (suggestions) */}
      {similarConcepts && similarConcepts.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h3 className="font-semibold text-lg mb-4">
            Potentially Related Concepts
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Concepts from other fields with similar embeddings
          </p>
          <div className="space-y-3">
            {similarConcepts.slice(0, 5).map((sim) => (
              <div
                key={sim.concept.id}
                className="flex items-center gap-4 p-3 border rounded-lg bg-blue-50/50"
              >
                <ConceptCard concept={sim.concept} showField />
                <div className="text-right">
                  <div className="text-sm font-medium text-blue-600">
                    {Math.round(sim.similarity * 100)}% similar
                  </div>
                  <ProposeEquivalenceDialog
                    sourceConcept={{
                      id: concept.id,
                      name: concept.name,
                      definition: concept.definition,
                      fieldId: concept.field.id,
                      fieldName: concept.field.name,
                      aliases: concept.aliases,
                      equivalenceCount: concept.equivalences.length,
                      claimCount: 0,
                    }}
                    targetConcept={sim.concept}
                    suggestedType={getSuggestedType(sim.similarity)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getEquivalenceColor(type: EquivalenceType): string {
  const colors: Record<EquivalenceType, string> = {
    IDENTICAL: "bg-green-100 text-green-800",
    SIMILAR: "bg-blue-100 text-blue-800",
    OVERLAPPING: "bg-purple-100 text-purple-800",
    RELATED: "bg-gray-100 text-gray-800",
    TRANSLATES_TO: "bg-amber-100 text-amber-800",
    CONTRASTING: "bg-red-100 text-red-800",
  };
  return colors[type];
}

function getSuggestedType(similarity: number): EquivalenceType {
  if (similarity >= 0.95) return "IDENTICAL";
  if (similarity >= 0.85) return "SIMILAR";
  if (similarity >= 0.75) return "OVERLAPPING";
  return "RELATED";
}

interface ProposeEquivalenceDialogProps {
  sourceConcept: ConceptSummary;
  targetConcept?: ConceptSummary;
  suggestedType?: EquivalenceType;
}

function ProposeEquivalenceDialog({
  sourceConcept,
  targetConcept,
  suggestedType = "SIMILAR",
}: ProposeEquivalenceDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EquivalenceType>(suggestedType);
  const [justification, setJustification] = useState("");

  const { mutate: propose, isPending } = useProposeEquivalence();

  const handleSubmit = () => {
    if (!targetConcept) return;

    propose(
      {
        sourceConceptId: sourceConcept.id,
        targetConceptId: targetConcept.id,
        equivalenceType: type,
        justification,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setJustification("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          {targetConcept ? "Link" : "Propose Link"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Propose Concept Equivalence</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Source Concept</div>
            <div className="font-medium">{sourceConcept.name}</div>
            <div className="text-sm text-gray-500">{sourceConcept.fieldName}</div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>

          {/* Target */}
          {targetConcept ? (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Target Concept</div>
              <div className="font-medium">{targetConcept.name}</div>
              <div className="text-sm text-gray-500">{targetConcept.fieldName}</div>
            </div>
          ) : (
            <div className="p-3 border-2 border-dashed rounded-lg text-center text-gray-400">
              Select a target concept
            </div>
          )}

          {/* Equivalence type */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Equivalence Type
            </label>
            <Select value={type} onValueChange={(v) => setType(v as EquivalenceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IDENTICAL">Identical (same concept)</SelectItem>
                <SelectItem value="SIMILAR">Similar (minor differences)</SelectItem>
                <SelectItem value="OVERLAPPING">Overlapping (partial)</SelectItem>
                <SelectItem value="RELATED">Related (linked but distinct)</SelectItem>
                <SelectItem value="TRANSLATES_TO">Translates to (with caveats)</SelectItem>
                <SelectItem value="CONTRASTING">Contrasting (intentionally different)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Justification */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Justification
            </label>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why these concepts are equivalent..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!targetConcept || !justification || isPending}
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Propose
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 5.1.11: Cross-Field Alerts Panel

**File:** `components/crossfield/AlertsPanel.tsx`

```tsx
/**
 * Cross-field discovery alerts
 */

"use client";

import { useState } from "react";
import { useAlerts, useUnreadAlertCount, useUpdateAlert } from "@/lib/crossfield/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Check,
  X,
  ExternalLink,
  Link2,
  MessageSquare,
  Users,
  Globe,
} from "lucide-react";
import { CrossFieldAlertData, CrossFieldAlertType, AlertStatus } from "@/lib/crossfield/types";
import { formatDistanceToNow } from "date-fns";

interface AlertsPanelProps {
  onClaimClick?: (claimId: string) => void;
  onConceptClick?: (conceptId: string) => void;
}

export function AlertsPanel({ onClaimClick, onConceptClick }: AlertsPanelProps) {
  const [filter, setFilter] = useState<AlertStatus | undefined>(undefined);
  const { data, isLoading } = useAlerts({ status: filter });
  const { data: unreadCount } = useUnreadAlertCount();
  const { mutate: updateAlert } = useUpdateAlert();

  const handleAction = (alertId: string, action: "read" | "actioned" | "dismiss") => {
    updateAlert({ alertId, action });
  };

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold">Discovery Alerts</h3>
          {unreadCount && unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-1">
          <Button
            variant={filter === undefined ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter(undefined)}
          >
            All
          </Button>
          <Button
            variant={filter === "UNREAD" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("UNREAD")}
          >
            Unread
          </Button>
        </div>
      </div>

      {/* Alerts list */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : data?.alerts && data.alerts.length > 0 ? (
          data.alerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onRead={() => handleAction(alert.id, "read")}
              onAction={() => handleAction(alert.id, "actioned")}
              onDismiss={() => handleAction(alert.id, "dismiss")}
              onClaimClick={onClaimClick}
              onConceptClick={onConceptClick}
            />
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No alerts yet</p>
            <p className="text-sm mt-1">
              Discoveries from other fields will appear here
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {data?.total && data.total > data.alerts.length && (
        <div className="px-4 py-2 border-t text-center">
          <Button variant="ghost" size="sm">
            Load more ({data.total - data.alerts.length} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}

interface AlertItemProps {
  alert: CrossFieldAlertData;
  onRead: () => void;
  onAction: () => void;
  onDismiss: () => void;
  onClaimClick?: (claimId: string) => void;
  onConceptClick?: (conceptId: string) => void;
}

function AlertItem({
  alert,
  onRead,
  onAction,
  onDismiss,
  onClaimClick,
  onConceptClick,
}: AlertItemProps) {
  const isUnread = alert.status === "UNREAD";

  return (
    <div
      className={`
        p-4 border-b last:border-b-0 transition-colors
        ${isUnread ? "bg-blue-50/50" : ""}
      `}
      onClick={() => isUnread && onRead()}
    >
      <div className="flex items-start gap-3">
        <AlertIcon type={alert.alertType} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{alert.title}</span>
            {isUnread && (
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {alert.description}
          </p>

          {/* Field badges */}
          {(alert.sourceField || alert.targetField) && (
            <div className="flex items-center gap-2 mt-2">
              {alert.sourceField && (
                <Badge variant="outline" className="text-xs">
                  {alert.sourceField}
                </Badge>
              )}
              {alert.sourceField && alert.targetField && (
                <span className="text-gray-400">→</span>
              )}
              {alert.targetField && (
                <Badge variant="outline" className="text-xs">
                  {alert.targetField}
                </Badge>
              )}
              {alert.matchScore && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(alert.matchScore * 100)}% match
                </Badge>
              )}
            </div>
          )}

          {/* Timestamp and actions */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(alert.createdAt), {
                addSuffix: true,
              })}
            </span>

            <div className="flex gap-1">
              {alert.targetClaimId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClaimClick?.(alert.targetClaimId!);
                    onAction();
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Claim
                </Button>
              )}
              {alert.conceptId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConceptClick?.(alert.conceptId!);
                    onAction();
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Concept
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertIcon({ type }: { type: CrossFieldAlertType }) {
  const icons: Record<CrossFieldAlertType, React.ReactNode> = {
    SIMILAR_CLAIM: (
      <div className="p-2 bg-blue-100 rounded-full">
        <Globe className="w-4 h-4 text-blue-600" />
      </div>
    ),
    NEW_EQUIVALENCE: (
      <div className="p-2 bg-green-100 rounded-full">
        <Link2 className="w-4 h-4 text-green-600" />
      </div>
    ),
    TRANSLATION_READY: (
      <div className="p-2 bg-purple-100 rounded-full">
        <Check className="w-4 h-4 text-purple-600" />
      </div>
    ),
    FIELD_DISCUSSION: (
      <div className="p-2 bg-amber-100 rounded-full">
        <MessageSquare className="w-4 h-4 text-amber-600" />
      </div>
    ),
    COLLABORATION_MATCH: (
      <div className="p-2 bg-pink-100 rounded-full">
        <Users className="w-4 h-4 text-pink-600" />
      </div>
    ),
  };
  return icons[type];
}
```

---

## Phase 5.1 Complete Summary

| Part | Focus | Files Created |
|------|-------|---------------|
| 1 | Schema & Core Services | 4 schema sections, types, fieldService, conceptService |
| 2 | Alert Service & APIs | alertService, 10 API routes, React Query hooks |
| 3 | UI Components | FieldBrowser, FieldDetail, ConceptCard, ConceptDetail, AlertsPanel |

---

## Phase 5.1 Full Checklist

| # | Task | Status |
|---|------|--------|
| 1 | Field taxonomy schema | ✅ |
| 2 | Concept schema | ✅ |
| 3 | Concept equivalence schema | ✅ |
| 4 | Cross-field alert schema | ✅ |
| 5 | CrossField types | ✅ |
| 6 | Field service | ✅ |
| 7 | Concept service | ✅ |
| 8 | Alert service | ✅ |
| 9 | Fields API | ✅ |
| 10 | Single field API | ✅ |
| 11 | Concepts API | ✅ |
| 12 | Single concept API | ✅ |
| 13 | Similar concepts API | ✅ |
| 14 | Equivalences API | ✅ |
| 15 | Verify equivalence API | ✅ |
| 16 | Alerts API | ✅ |
| 17 | Alert actions API | ✅ |
| 18 | React Query hooks | ✅ |
| 19 | FieldBrowser component | ✅ |
| 20 | FieldDetail component | ✅ |
| 21 | ConceptCard component | ✅ |
| 22 | ConceptDetail component | ✅ |
| 23 | AlertsPanel component | ✅ |

---

*Phase 5.1 Complete — Continue to Phase 5.2: Translation Deliberations*
