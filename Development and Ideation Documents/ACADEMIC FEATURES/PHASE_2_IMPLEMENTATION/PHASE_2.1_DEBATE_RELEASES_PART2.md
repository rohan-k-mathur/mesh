# Phase 2.1 Part 2: UI Components for Debate Releases

**Continuation of:** Phase 2.1 Debate Releases  
**Focus:** React components for release management and visualization

---

## UI Components

### Component 2.1.1: Release List

**File:** `components/releases/ReleaseList.tsx`

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tag,
  Calendar,
  ChevronRight,
  Loader2,
  Plus,
  GitBranch,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ReleaseListProps {
  deliberationId: string;
  onCreateRelease?: () => void;
  canCreate?: boolean;
}

export function ReleaseList({
  deliberationId,
  onCreateRelease,
  canCreate = false,
}: ReleaseListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["releases", deliberationId],
    queryFn: async () => {
      const response = await fetch(
        `/api/deliberations/${deliberationId}/releases`
      );
      if (!response.ok) throw new Error("Failed to fetch releases");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const releases = data?.releases || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Releases
        </CardTitle>
        {canCreate && (
          <Button size="sm" onClick={onCreateRelease}>
            <Plus className="h-4 w-4 mr-1" />
            New Release
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {releases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No releases yet</p>
            <p className="text-sm">
              Create a release to snapshot the current debate state
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {releases.map((release: any, index: number) => (
              <ReleaseListItem
                key={release.id}
                release={release}
                deliberationId={deliberationId}
                isLatest={index === 0}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ReleaseListItemProps {
  release: any;
  deliberationId: string;
  isLatest: boolean;
}

function ReleaseListItem({
  release,
  deliberationId,
  isLatest,
}: ReleaseListItemProps) {
  const stats = release.statsSnapshot?.claims || {};

  return (
    <Link
      href={`/deliberations/${deliberationId}/releases/${release.id}`}
      className="block"
    >
      <div
        className={cn(
          "flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50",
          isLatest && "border-primary/50 bg-primary/5"
        )}
      >
        {/* Version badge */}
        <div className="flex flex-col items-center gap-1">
          <Badge
            variant={isLatest ? "default" : "outline"}
            className="font-mono"
          >
            v{release.version}
          </Badge>
          {isLatest && (
            <span className="text-xs text-primary font-medium">Latest</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{release.title}</h4>
          {release.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {release.summary}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {stats.defended || 0} defended
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              {stats.contested || 0} contested
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              {stats.unresolved || 0} unresolved
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={release.releasedBy?.image} />
              <AvatarFallback>
                {release.releasedBy?.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {release.releasedBy?.name}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(release.releasedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}
```

---

### Component 2.1.2: Create Release Modal

**File:** `components/releases/CreateReleaseModal.tsx`

```typescript
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, GitBranch, Info } from "lucide-react";

interface CreateReleaseModalProps {
  deliberationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latestVersion?: string;
}

export function CreateReleaseModal({
  deliberationId,
  open,
  onOpenChange,
  latestVersion,
}: CreateReleaseModalProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [versionType, setVersionType] = useState<"major" | "minor" | "patch">(
    "minor"
  );

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/deliberations/${deliberationId}/releases`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            summary: summary || undefined,
            releaseNotes: releaseNotes || undefined,
            versionType,
          }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create release");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["releases", deliberationId],
      });
      onOpenChange(false);
      // Reset form
      setTitle("");
      setSummary("");
      setReleaseNotes("");
      setVersionType("minor");
    },
  });

  const suggestedVersion = latestVersion
    ? suggestNextVersion(latestVersion, versionType)
    : "1.0.0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Create Release
          </DialogTitle>
          <DialogDescription>
            Create a versioned snapshot of the current debate state. Releases
            can be cited and compared.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Version Selection */}
          <div className="space-y-2">
            <Label>Version Type</Label>
            <Select
              value={versionType}
              onValueChange={(v) =>
                setVersionType(v as "major" | "minor" | "patch")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patch">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">Patch</span>
                    <span className="text-muted-foreground text-xs">
                      (small fixes)
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="minor">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">Minor</span>
                    <span className="text-muted-foreground text-xs">
                      (new content)
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="major">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">Major</span>
                    <span className="text-muted-foreground text-xs">
                      (significant changes)
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Next version will be: <code className="font-mono">{suggestedVersion}</code>
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Release Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Post-Conference Consensus"
              maxLength={200}
            />
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description of what this release represents..."
              rows={2}
              maxLength={2000}
            />
          </div>

          {/* Release Notes */}
          <div className="space-y-2">
            <Label htmlFor="releaseNotes">Release Notes</Label>
            <Textarea
              id="releaseNotes"
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="Detailed notes about changes, acknowledgments, etc..."
              rows={4}
              maxLength={10000}
            />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The release will snapshot all current claims, arguments, and their
              statuses. A changelog will be automatically generated from the
              previous release.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Release
          </Button>
        </DialogFooter>

        {createMutation.isError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create release"}
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}

function suggestNextVersion(
  current: string,
  type: "major" | "minor" | "patch"
): string {
  const parts = current.split(".").map(Number);
  const [major, minor, patch] = parts;

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}
```

---

### Component 2.1.3: Release Detail View

**File:** `components/releases/ReleaseDetailView.tsx`

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  GitBranch,
  Calendar,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  BarChart3,
  History,
  Quote,
} from "lucide-react";
import { format } from "date-fns";
import { ChangelogViewer } from "./ChangelogViewer";
import { CitationExport } from "./CitationExport";
import { ClaimSnapshotList } from "./ClaimSnapshotList";

interface ReleaseDetailViewProps {
  deliberationId: string;
  releaseId: string;
}

export function ReleaseDetailView({
  deliberationId,
  releaseId,
}: ReleaseDetailViewProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["release", releaseId],
    queryFn: async () => {
      const response = await fetch(
        `/api/deliberations/${deliberationId}/releases/${releaseId}`
      );
      if (!response.ok) throw new Error("Failed to fetch release");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const release = data?.release;
  if (!release) return <div>Release not found</div>;

  const stats = release.statsSnapshot?.claims || {};
  const argStats = release.statsSnapshot?.arguments || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <GitBranch className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    v{release.version}
                  </Badge>
                  {release.isLatest && <Badge>Latest</Badge>}
                </div>
                <h1 className="text-2xl font-bold mt-1">{release.title}</h1>
                {release.summary && (
                  <p className="text-muted-foreground mt-2 max-w-2xl">
                    {release.summary}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={release.citationUri}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Permalink
                </a>
              </Button>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={release.releasedBy?.image} />
                <AvatarFallback>
                  {release.releasedBy?.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <span>Released by {release.releasedBy?.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(release.releasedAt), "PPP 'at' p")}
            </div>
          </div>
        </CardHeader>

        {/* Stats Overview */}
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Claims"
              value={stats.total || 0}
              icon={<FileText className="h-4 w-4" />}
            />
            <StatCard
              label="Defended"
              value={stats.defended || 0}
              icon={<span className="w-3 h-3 rounded-full bg-green-500" />}
              color="text-green-600"
            />
            <StatCard
              label="Contested"
              value={stats.contested || 0}
              icon={<span className="w-3 h-3 rounded-full bg-yellow-500" />}
              color="text-yellow-600"
            />
            <StatCard
              label="Arguments"
              value={argStats.total || 0}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="claims">
        <TabsList>
          <TabsTrigger value="claims">
            <FileText className="h-4 w-4 mr-1" />
            Claims
          </TabsTrigger>
          <TabsTrigger value="changelog">
            <History className="h-4 w-4 mr-1" />
            Changelog
          </TabsTrigger>
          <TabsTrigger value="citation">
            <Quote className="h-4 w-4 mr-1" />
            Citation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="mt-4">
          <ClaimSnapshotList
            claims={release.claimSnapshot?.claims || []}
            stats={stats}
          />
        </TabsContent>

        <TabsContent value="changelog" className="mt-4">
          <ChangelogViewer
            changelog={release.changelogFromPrevious}
            previousVersion={release.previousRelease?.version}
          />
        </TabsContent>

        <TabsContent value="citation" className="mt-4">
          <CitationExport
            bibtex={release.bibtex}
            citationUri={release.citationUri}
            doi={release.doi}
            title={release.title}
            version={release.version}
          />
        </TabsContent>
      </Tabs>

      {/* Release Notes */}
      {release.releaseNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Release Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {release.releaseNotes}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold ${color || ""}`}>{value}</div>
    </div>
  );
}
```

---

### Component 2.1.4: Changelog Viewer

**File:** `components/releases/ChangelogViewer.tsx`

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  History,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChangelogViewerProps {
  changelog: any;
  previousVersion?: string;
}

export function ChangelogViewer({
  changelog,
  previousVersion,
}: ChangelogViewerProps) {
  if (!changelog) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No previous release to compare</p>
            <p className="text-sm">This is the first release</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { claims, arguments: args, summary } = changelog;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Changes from v{previousVersion}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SummaryItem
              label="Claims Added"
              value={summary.claimsAdded}
              icon={<Plus className="h-4 w-4 text-green-600" />}
              positive={summary.claimsAdded > 0}
            />
            <SummaryItem
              label="Claims Removed"
              value={summary.claimsRemoved}
              icon={<Minus className="h-4 w-4 text-red-600" />}
              negative={summary.claimsRemoved > 0}
            />
            <SummaryItem
              label="Status Changes"
              value={summary.statusChanges}
              icon={<ArrowUp className="h-4 w-4 text-blue-600" />}
            />
            <SummaryItem
              label="Arguments Added"
              value={summary.argumentsAdded}
              icon={<Plus className="h-4 w-4 text-green-600" />}
              positive={summary.argumentsAdded > 0}
            />
            <SummaryItem
              label="Arguments Removed"
              value={summary.argumentsRemoved}
              icon={<Minus className="h-4 w-4 text-red-600" />}
              negative={summary.argumentsRemoved > 0}
            />
            <SummaryItem
              label="Net Defended"
              value={summary.netDefended}
              icon={
                summary.netDefended >= 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-600" />
                )
              }
              positive={summary.netDefended > 0}
              negative={summary.netDefended < 0}
              showSign
            />
          </div>
        </CardContent>
      </Card>

      {/* Claims Added */}
      {claims.added.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-green-700">
              <Plus className="h-4 w-4" />
              New Claims ({claims.added.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {claims.added.map((claim: any) => (
                <li
                  key={claim.id}
                  className="flex items-start gap-2 text-sm p-2 rounded bg-green-50"
                >
                  <Plus className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="flex-1">{claim.text}</span>
                  <StatusBadge status={claim.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Claims Removed */}
      {claims.removed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <Minus className="h-4 w-4" />
              Removed Claims ({claims.removed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {claims.removed.map((claim: any) => (
                <li
                  key={claim.id}
                  className="flex items-start gap-2 text-sm p-2 rounded bg-red-50 line-through opacity-75"
                >
                  <Minus className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <span className="flex-1">{claim.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Status Changes */}
      {claims.statusChanged.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-700">
              <ArrowUp className="h-4 w-4" />
              Status Changes ({claims.statusChanged.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {claims.statusChanged.map((change: any) => {
                const isImprovement = isStatusUpgrade(
                  change.fromStatus,
                  change.toStatus
                );
                return (
                  <li
                    key={change.claimId}
                    className="flex items-start gap-2 text-sm p-2 rounded bg-blue-50"
                  >
                    {isImprovement ? (
                      <ArrowUp className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    )}
                    <span className="flex-1 truncate">{change.claimText}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <StatusBadge status={change.fromStatus} small />
                      <span className="text-muted-foreground">→</span>
                      <StatusBadge status={change.toStatus} small />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Arguments Added */}
      {args.added.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-green-700">
              <Plus className="h-4 w-4" />
              New Arguments ({args.added.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {args.added.map((arg: any) => (
                <li
                  key={arg.id}
                  className="flex items-start gap-2 text-sm p-2 rounded bg-green-50"
                >
                  <Plus className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <Badge variant="outline" className="shrink-0">
                    {arg.type}
                  </Badge>
                  <span className="flex-1 truncate">
                    Supporting: "{arg.conclusionText}"
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryItem({
  label,
  value,
  icon,
  positive,
  negative,
  showSign,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  positive?: boolean;
  negative?: boolean;
  showSign?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "text-xl font-bold",
          positive && "text-green-600",
          negative && "text-red-600"
        )}
      >
        {showSign && value > 0 && "+"}
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const colors: Record<string, string> = {
    DEFENDED: "bg-green-100 text-green-700 border-green-300",
    CONTESTED: "bg-yellow-100 text-yellow-700 border-yellow-300",
    UNRESOLVED: "bg-gray-100 text-gray-700 border-gray-300",
    WITHDRAWN: "bg-red-100 text-red-700 border-red-300",
    ACCEPTED: "bg-blue-100 text-blue-700 border-blue-300",
  };

  return (
    <Badge
      variant="outline"
      className={cn(colors[status] || "", small && "text-xs px-1 py-0")}
    >
      {status}
    </Badge>
  );
}

function isStatusUpgrade(from: string, to: string): boolean {
  const order = ["WITHDRAWN", "CONTESTED", "UNRESOLVED", "DEFENDED", "ACCEPTED"];
  return order.indexOf(to) > order.indexOf(from);
}
```

---

### Component 2.1.5: Citation Export

**File:** `components/releases/CitationExport.tsx`

```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, ExternalLink, Quote } from "lucide-react";

interface CitationExportProps {
  bibtex: string;
  citationUri: string;
  doi?: string;
  title: string;
  version: string;
}

export function CitationExport({
  bibtex,
  citationUri,
  doi,
  title,
  version,
}: CitationExportProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // Generate inline citation
  const inlineCitation = `(Mesh Agora, ${title}, v${version}, ${new Date().getFullYear()})`;

  // Generate RIS format
  const ris = `TY  - ELEC
TI  - ${title} (Release ${version})
PY  - ${new Date().getFullYear()}
UR  - ${citationUri}
DB  - Mesh Agora
N1  - Debate release snapshot
ER  -`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Quote className="h-5 w-5" />
          Cite This Release
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permanent Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Permanent Link</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono truncate">
              {citationUri}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(citationUri, "uri")}
            >
              {copied === "uri" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* DOI if available */}
        {doi && (
          <div className="space-y-2">
            <label className="text-sm font-medium">DOI</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
                {doi}
              </code>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://doi.org/${doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Citation Formats */}
        <Tabs defaultValue="bibtex">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bibtex">BibTeX</TabsTrigger>
            <TabsTrigger value="ris">RIS</TabsTrigger>
            <TabsTrigger value="inline">Inline</TabsTrigger>
          </TabsList>

          <TabsContent value="bibtex" className="space-y-2">
            <div className="relative">
              <pre className="p-4 bg-muted rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {bibtex}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(bibtex, "bibtex")}
              >
                {copied === "bibtex" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              For LaTeX and most reference managers
            </p>
          </TabsContent>

          <TabsContent value="ris" className="space-y-2">
            <div className="relative">
              <pre className="p-4 bg-muted rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {ris}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(ris, "ris")}
              >
                {copied === "ris" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              For EndNote, Zotero, Mendeley
            </p>
          </TabsContent>

          <TabsContent value="inline" className="space-y-2">
            <div className="relative">
              <div className="p-4 bg-muted rounded text-sm">
                {inlineCitation}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(inlineCitation, "inline")}
              >
                {copied === "inline" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              For quick in-text citations
            </p>
          </TabsContent>
        </Tabs>

        <Alert>
          <AlertDescription className="text-sm">
            When citing debate releases, include the version number to ensure
            readers can access the exact state you referenced. The permanent
            link will always point to this specific release.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
```

---

### Component 2.1.6: Claim Snapshot List

**File:** `components/releases/ClaimSnapshotList.tsx`

```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, FileText, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClaimSnapshotListProps {
  claims: any[];
  stats: any;
}

export function ClaimSnapshotList({ claims, stats }: ClaimSnapshotListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      !search ||
      claim.text.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || claim.status === statusFilter;
    const matchesType = typeFilter === "all" || claim.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const uniqueTypes = [...new Set(claims.map((c) => c.type))];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Claims Snapshot ({claims.length})
          </CardTitle>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search claims..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DEFENDED">Defended</SelectItem>
              <SelectItem value="CONTESTED">Contested</SelectItem>
              <SelectItem value="UNRESOLVED">Unresolved</SelectItem>
              <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Claim</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Support/Attack</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No claims match your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>
                      <p className="line-clamp-2">{claim.text}</p>
                      {claim.sourceTitle && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Source: {claim.sourceTitle}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {claim.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={claim.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600">
                        +{claim.supportCount}
                      </span>
                      {" / "}
                      <span className="text-red-600">-{claim.attackCount}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Showing {filteredClaims.length} of {claims.length} claims
        </p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DEFENDED: "bg-green-100 text-green-700 border-green-300",
    CONTESTED: "bg-yellow-100 text-yellow-700 border-yellow-300",
    UNRESOLVED: "bg-gray-100 text-gray-700 border-gray-300",
    WITHDRAWN: "bg-red-100 text-red-700 border-red-300",
    ACCEPTED: "bg-blue-100 text-blue-700 border-blue-300",
  };

  return (
    <Badge variant="outline" className={cn("text-xs", styles[status] || "")}>
      {status}
    </Badge>
  );
}
```

---

## Phase 2.1 Complete Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | DebateRelease schema | `prisma/schema.prisma` | 📋 Defined |
| 2 | Snapshot types | `lib/releases/types.ts` | 📋 Defined |
| 3 | Snapshot service | `lib/releases/snapshotService.ts` | 📋 Defined |
| 4 | Changelog service | `lib/releases/changelogService.ts` | 📋 Defined |
| 5 | Release service | `lib/releases/releaseService.ts` | 📋 Defined |
| 6 | Releases list API | `app/api/deliberations/[id]/releases/route.ts` | 📋 Defined |
| 7 | Release detail API | `app/api/.../releases/[releaseId]/route.ts` | 📋 Defined |
| 8 | Compare releases API | `app/api/.../releases/compare/route.ts` | 📋 Defined |
| 9 | ReleaseList component | `components/releases/ReleaseList.tsx` | 📋 Defined |
| 10 | CreateReleaseModal | `components/releases/CreateReleaseModal.tsx` | 📋 Defined |
| 11 | ReleaseDetailView | `components/releases/ReleaseDetailView.tsx` | 📋 Defined |
| 12 | ChangelogViewer | `components/releases/ChangelogViewer.tsx` | 📋 Defined |
| 13 | CitationExport | `components/releases/CitationExport.tsx` | 📋 Defined |
| 14 | ClaimSnapshotList | `components/releases/ClaimSnapshotList.tsx` | 📋 Defined |

---

## Next Steps

Continue to [Phase 2.2: Fork/Branch/Merge](./PHASE_2.2_FORK_BRANCH_MERGE.md) for deliberation forking and merging functionality.

---

*End of Phase 2.1 Implementation Guide*
