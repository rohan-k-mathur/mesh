# STACKS IMPROVEMENT PHASE 3: UNIQUE MOAT

> **Status**: Draft  
> **Created**: January 7, 2026  
> **Dependencies**: Phase 1 (Are.na Parity) + Phase 2 (Evidence UX) complete  
> **Goal**: Build differentiated features that make Mesh the definitive evidence-first knowledge platform for researchers and deliberative communities

---

# EXECUTIVE SUMMARY

## Vision Statement

Phase 3 transforms Mesh from "a good evidence collection tool" into **the infrastructure layer for verified, traceable, cross-referenced knowledge**. While Are.na is a moodboard and Zotero is a reference manager, Mesh becomes the place where evidence is not just stored but **verified, connected across contexts, and made discoverable platform-wide**.

## Strategic Priorities

Based on analysis of the competitive landscape and platform strengths:

| Priority | Rationale |
|----------|-----------|
| **Platform-wide thinking** | Individual stacks are useful; a knowledge commons is transformative |
| **Academic/research focus** | Researchers have highest evidence standards; general users benefit from the same infrastructure |
| **Integration over build** | Leverage Semantic Scholar, OpenAlex, CrossRef rather than building source discovery from scratch |
| **Trust infrastructure first** | Verification and archiving enable all downstream features |

## Phase 3 Sub-Phases

| Sub-Phase | Focus | Duration | Key Deliverables |
|-----------|-------|----------|------------------|
| **3.1** | Trust Infrastructure | 2-3 weeks | Verification, archiving, retraction alerts |
| **3.2** | Integration & Interoperability | 3-4 weeks | Academic DB integration, reference manager sync |
| **3.3** | Cross-Platform Intelligence | 2-3 weeks | Platform-wide citation tracking, hot sources |
| **3.4** | Discovery & Exploration | 3-4 weeks | Knowledge graph, related content, timeline views |
| **3.5** | AI-Enhanced Features | 2-3 weeks | Auto-citation extraction, gap analysis (deferred) |

**Total Estimated Duration**: 12-17 weeks (can parallelize some tracks)

## Current State vs Target State

| Dimension | Current | Target |
|-----------|---------|--------|
| Source verification | Manual, optional | Automated on creation, continuous monitoring |
| Source archiving | Field exists, not populated | Auto-archive on add, Wayback integration |
| Academic DB integration | Manual DOI lookup | Direct import from PubMed, Semantic Scholar, OpenAlex |
| Platform-wide visibility | Isolated to deliberation | Cross-deliberation citation tracking, trending sources |
| Knowledge discovery | Search only | Graph view, related content, timeline exploration |
| Reference manager sync | One-way Zotero import | Bidirectional Zotero/Mendeley sync |

---

# PHASE 3.1: TRUST INFRASTRUCTURE

**Objective**: Make every source on the platform verifiable, archivable, and monitored for changes—establishing Mesh as a platform where evidence can be trusted.

**Timeline**: Weeks 1-3  
**Team**: 1-2 engineers  
**Dependencies**: Source model exists with basic fields

---

## 3.1.1 Source Verification System

**Priority**: P0 — Foundation for trust  
**Estimated Effort**: 4-5 days  
**Risk Level**: Low (additive to existing Source model)

### Problem Statement

Current sources have `url`, `doi`, `archiveUrl` fields, but:
- No verification that URLs resolve
- No detection of redirects or URL changes
- No tracking of when sources become unavailable
- No canonical URL normalization

Users cite sources assuming they're valid; broken links undermine trust in the entire evidence chain.

### Schema Extension

```prisma
model Source {
  // ... existing fields ...
  
  // ─────────────────────────────────────────────────────────
  // VERIFICATION FIELDS
  // ─────────────────────────────────────────────────────────
  verificationStatus    SourceVerificationStatus @default(unverified)
  verifiedAt            DateTime?
  lastCheckedAt         DateTime?
  
  // URL resolution
  canonicalUrl          String?   // Final URL after redirects
  httpStatus            Int?      // Last HTTP status code
  httpStatusHistory     Json?     // [{status, checkedAt}, ...]
  
  // Content fingerprinting (detect changes)
  contentHash           String?   // Hash of page content/PDF
  contentChangedAt      DateTime?
  
  // Metadata enrichment status
  enrichmentStatus      EnrichmentStatus @default(pending)
  enrichedAt            DateTime?
  enrichmentSource      String?   // "crossref", "semantic_scholar", "openalex"
  
  @@index([verificationStatus])
  @@index([lastCheckedAt])
}

enum SourceVerificationStatus {
  unverified    // Never checked
  verified      // URL resolves, content accessible
  redirected    // URL redirects (canonicalUrl differs)
  unavailable   // Temporarily unavailable (4xx/5xx)
  broken        // Permanently broken (multiple failures)
  paywalled     // Accessible but behind paywall
}

enum EnrichmentStatus {
  pending       // Not yet enriched
  enriched      // Successfully enriched from external DB
  partial       // Some fields enriched
  not_found     // Not found in external DBs
  failed        // Enrichment failed
}
```

### Verification Job System

```typescript
// workers/sourceVerification.ts

import { prisma } from "@/lib/prismaclient";
import { Queue, Worker } from "bullmq";
import crypto from "crypto";

interface VerifySourceJob {
  sourceId: string;
  isRecheck?: boolean;
}

export const sourceVerificationQueue = new Queue<VerifySourceJob>(
  "source-verification",
  { connection: redisConnection }
);

export const sourceVerificationWorker = new Worker<VerifySourceJob>(
  "source-verification",
  async (job) => {
    const { sourceId, isRecheck } = job.data;

    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      select: {
        id: true,
        url: true,
        doi: true,
        contentHash: true,
        httpStatusHistory: true,
      },
    });

    if (!source) return;

    const result = await verifySource(source);

    // Update source with verification results
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        verificationStatus: result.status,
        verifiedAt: new Date(),
        lastCheckedAt: new Date(),
        canonicalUrl: result.canonicalUrl,
        httpStatus: result.httpStatus,
        httpStatusHistory: appendStatusHistory(
          source.httpStatusHistory,
          result.httpStatus
        ),
        contentHash: result.contentHash,
        contentChangedAt:
          source.contentHash && source.contentHash !== result.contentHash
            ? new Date()
            : undefined,
      },
    });

    // If content changed, emit event for downstream processing
    if (source.contentHash && source.contentHash !== result.contentHash) {
      await emitBus("source:content_changed", {
        sourceId,
        oldHash: source.contentHash,
        newHash: result.contentHash,
      });
    }

    // If broken, notify users who cited this source
    if (result.status === "broken") {
      await emitBus("source:broken", { sourceId });
    }
  },
  { connection: redisConnection, concurrency: 10 }
);

async function verifySource(source: { url?: string | null; doi?: string | null }) {
  // Prioritize DOI resolution (more stable)
  if (source.doi) {
    return await verifyDoi(source.doi);
  }

  if (source.url) {
    return await verifyUrl(source.url);
  }

  return { status: "unverified" as const, httpStatus: null, canonicalUrl: null };
}

async function verifyUrl(url: string): Promise<VerificationResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "MeshBot/1.0 (https://mesh.app; evidence verification)",
      },
    });

    clearTimeout(timeout);

    const canonicalUrl = response.url; // Final URL after redirects
    const httpStatus = response.status;

    // Check for paywall indicators
    const isPaywalled = detectPaywall(response);

    // For successful responses, optionally fetch content for hashing
    let contentHash: string | undefined;
    if (response.ok && !isPaywalled) {
      const body = await fetch(url).then((r) => r.text());
      contentHash = crypto.createHash("sha256").update(body).digest("hex");
    }

    let status: SourceVerificationStatus;
    if (isPaywalled) {
      status = "paywalled";
    } else if (httpStatus >= 200 && httpStatus < 300) {
      status = canonicalUrl !== url ? "redirected" : "verified";
    } else if (httpStatus >= 400 && httpStatus < 500) {
      status = "broken";
    } else {
      status = "unavailable";
    }

    return { status, httpStatus, canonicalUrl, contentHash };
  } catch (error) {
    return {
      status: "unavailable",
      httpStatus: null,
      canonicalUrl: null,
      error: String(error),
    };
  }
}

async function verifyDoi(doi: string): Promise<VerificationResult> {
  const doiUrl = `https://doi.org/${doi}`;
  const result = await verifyUrl(doiUrl);
  
  // DOIs that resolve are considered verified even if they redirect
  if (result.status === "redirected") {
    result.status = "verified";
  }
  
  return result;
}

function detectPaywall(response: Response): boolean {
  // Common paywall indicators
  const paywallHeaders = [
    "x-paywall",
    "x-subscription-required",
  ];
  
  for (const header of paywallHeaders) {
    if (response.headers.has(header)) return true;
  }
  
  // Check for common paywall domains
  const paywallDomains = [
    "jstor.org",
    "sciencedirect.com",
    "springer.com",
    "wiley.com",
  ];
  
  const url = new URL(response.url);
  return paywallDomains.some((d) => url.hostname.includes(d));
}

function appendStatusHistory(
  history: any,
  status: number | null
): { status: number | null; checkedAt: string }[] {
  const arr = Array.isArray(history) ? history : [];
  arr.push({ status, checkedAt: new Date().toISOString() });
  // Keep last 10 entries
  return arr.slice(-10);
}
```

### Verification Triggers

```typescript
// lib/sources/verificationTriggers.ts

// 1. On source creation
export async function onSourceCreated(sourceId: string) {
  await sourceVerificationQueue.add(
    "verify",
    { sourceId },
    { delay: 1000 } // Small delay to let DB settle
  );
}

// 2. Scheduled re-verification (cron job)
// Run nightly for sources not checked in 7+ days
export async function scheduleReverification() {
  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - 7);

  const staleSources = await prisma.source.findMany({
    where: {
      OR: [
        { lastCheckedAt: null },
        { lastCheckedAt: { lt: staleThreshold } },
      ],
    },
    select: { id: true },
    take: 1000, // Batch size
    orderBy: { lastCheckedAt: "asc" },
  });

  for (const source of staleSources) {
    await sourceVerificationQueue.add(
      "recheck",
      { sourceId: source.id, isRecheck: true },
      { priority: 10 } // Lower priority than new sources
    );
  }
}

// 3. On-demand verification (user clicks "verify now")
export async function verifySourceNow(sourceId: string) {
  await sourceVerificationQueue.add(
    "verify-now",
    { sourceId },
    { priority: 1 } // Highest priority
  );
}
```

### Verification Status Badge Component

```tsx
// components/sources/VerificationBadge.tsx

"use client";

import {
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  ExternalLinkIcon,
  LockIcon,
  RefreshCwIcon,
  HelpCircleIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type VerificationStatus =
  | "unverified"
  | "verified"
  | "redirected"
  | "unavailable"
  | "broken"
  | "paywalled";

interface VerificationBadgeProps {
  status: VerificationStatus;
  lastCheckedAt?: Date | null;
  canonicalUrl?: string | null;
  onVerifyNow?: () => void;
}

const statusConfig: Record<
  VerificationStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    color: string;
  }
> = {
  unverified: {
    icon: HelpCircleIcon,
    label: "Unverified",
    description: "This source has not been verified yet",
    color: "text-gray-400",
  },
  verified: {
    icon: CheckCircleIcon,
    label: "Verified",
    description: "URL resolves and content is accessible",
    color: "text-green-600",
  },
  redirected: {
    icon: ExternalLinkIcon,
    label: "Redirected",
    description: "URL redirects to a different location",
    color: "text-blue-600",
  },
  unavailable: {
    icon: AlertTriangleIcon,
    label: "Unavailable",
    description: "Source is temporarily unavailable",
    color: "text-amber-600",
  },
  broken: {
    icon: XCircleIcon,
    label: "Broken",
    description: "Source URL no longer works",
    color: "text-red-600",
  },
  paywalled: {
    icon: LockIcon,
    label: "Paywalled",
    description: "Source is behind a paywall",
    color: "text-purple-600",
  },
};

export function VerificationBadge({
  status,
  lastCheckedAt,
  canonicalUrl,
  onVerifyNow,
}: VerificationBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 ${config.color}`}>
          <Icon className="h-4 w-4" />
          <span className="text-xs font-medium">{config.label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">{config.description}</p>
          {lastCheckedAt && (
            <p className="text-xs text-muted-foreground">
              Last checked: {formatDate(new Date(lastCheckedAt))}
            </p>
          )}
          {status === "redirected" && canonicalUrl && (
            <p className="text-xs">
              Redirects to:{" "}
              <a
                href={canonicalUrl}
                target="_blank"
                rel="noopener"
                className="underline"
              >
                {new URL(canonicalUrl).hostname}
              </a>
            </p>
          )}
          {onVerifyNow && (
            <button
              onClick={onVerifyNow}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <RefreshCwIcon className="h-3 w-3" />
              Verify now
            </button>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| New sources queued for verification | Create source → job appears in queue |
| URL verification works | Valid URL → status = verified |
| Redirect detection works | Redirecting URL → canonicalUrl differs, status = redirected |
| Broken link detection | 404 URL → status = broken |
| Paywall detection | JSTOR URL → status = paywalled |
| Re-verification scheduled | Source not checked in 7 days → appears in nightly batch |
| Content change detection | Page content changes → contentChangedAt updated |
| Badge displays correctly | All statuses render with correct icon/color |

---

## 3.1.2 Source Archiving System

**Priority**: P0 — Prevent link rot  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low (external API integration)

### Problem Statement

Research shows that [~25% of links become broken within 7 years](https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/). For an evidence platform, this is catastrophic—citations become worthless when their sources disappear.

### Archiving Strategy

1. **Primary**: Wayback Machine (archive.org) — free, widely trusted
2. **Secondary**: Local PDF capture for web pages
3. **Tertiary**: Perma.cc integration for legal citations (future)

### Schema Addition

```prisma
model Source {
  // ... existing fields ...
  
  // ─────────────────────────────────────────────────────────
  // ARCHIVING FIELDS
  // ─────────────────────────────────────────────────────────
  archiveStatus         ArchiveStatus @default(none)
  archiveUrl            String?       // Wayback Machine URL or local archive
  archiveRequestedAt    DateTime?
  archivedAt            DateTime?
  archiveError          String?
  
  // Local capture (for PDFs of web pages)
  localArchivePath      String?       // S3 path to captured PDF
  localArchiveSize      Int?          // File size in bytes
}

enum ArchiveStatus {
  none              // No archive requested
  pending           // Archive request submitted
  in_progress       // Archiving in progress
  archived          // Successfully archived
  failed            // Archive failed
  exists            // Already archived (found existing)
}
```

### Wayback Machine Integration

```typescript
// lib/archiving/waybackMachine.ts

const WAYBACK_SAVE_URL = "https://web.archive.org/save/";
const WAYBACK_CHECK_URL = "https://archive.org/wayback/available";

interface WaybackResult {
  success: boolean;
  archiveUrl?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Check if a URL is already archived in Wayback Machine
 */
export async function checkWaybackArchive(url: string): Promise<WaybackResult> {
  try {
    const response = await fetch(
      `${WAYBACK_CHECK_URL}?url=${encodeURIComponent(url)}`
    );
    const data = await response.json();

    if (data.archived_snapshots?.closest?.available) {
      return {
        success: true,
        archiveUrl: data.archived_snapshots.closest.url,
        timestamp: data.archived_snapshots.closest.timestamp,
      };
    }

    return { success: false };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Request a new archive snapshot via Wayback Machine Save Page Now
 */
export async function requestWaybackArchive(url: string): Promise<WaybackResult> {
  try {
    // First check if recent archive exists (within last 30 days)
    const existing = await checkWaybackArchive(url);
    if (existing.success && existing.timestamp) {
      const archiveDate = parseWaybackTimestamp(existing.timestamp);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (archiveDate > thirtyDaysAgo) {
        return { ...existing, success: true };
      }
    }

    // Request new archive
    const response = await fetch(`${WAYBACK_SAVE_URL}${url}`, {
      method: "GET",
      headers: {
        "User-Agent": "MeshBot/1.0 (https://mesh.app; evidence archiving)",
      },
    });

    if (response.ok) {
      // Wayback returns the archive URL in headers or body
      const archiveUrl = response.headers.get("Content-Location") || response.url;
      
      return {
        success: true,
        archiveUrl,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function parseWaybackTimestamp(timestamp: string): Date {
  // Wayback timestamps are YYYYMMDDHHMMSS
  const year = timestamp.slice(0, 4);
  const month = timestamp.slice(4, 6);
  const day = timestamp.slice(6, 8);
  const hour = timestamp.slice(8, 10);
  const minute = timestamp.slice(10, 12);
  const second = timestamp.slice(12, 14);
  
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
}
```

### Archive Worker

```typescript
// workers/sourceArchiving.ts

import { Queue, Worker } from "bullmq";
import { prisma } from "@/lib/prismaclient";
import { checkWaybackArchive, requestWaybackArchive } from "@/lib/archiving/waybackMachine";
import { captureWebPageAsPdf } from "@/lib/archiving/pdfCapture";

interface ArchiveSourceJob {
  sourceId: string;
  strategy: "wayback" | "local" | "both";
}

export const sourceArchivingQueue = new Queue<ArchiveSourceJob>(
  "source-archiving",
  { connection: redisConnection }
);

export const sourceArchivingWorker = new Worker<ArchiveSourceJob>(
  "source-archiving",
  async (job) => {
    const { sourceId, strategy } = job.data;

    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      select: { id: true, url: true, kind: true },
    });

    if (!source?.url) return;

    await prisma.source.update({
      where: { id: sourceId },
      data: { archiveStatus: "in_progress" },
    });

    try {
      let archiveUrl: string | null = null;
      let localArchivePath: string | null = null;

      // Wayback Machine archiving
      if (strategy === "wayback" || strategy === "both") {
        const result = await requestWaybackArchive(source.url);
        if (result.success) {
          archiveUrl = result.archiveUrl || null;
        }
      }

      // Local PDF capture (for web pages)
      if (strategy === "local" || strategy === "both") {
        if (source.kind === "website" || source.kind === "article") {
          const capture = await captureWebPageAsPdf(source.url, sourceId);
          if (capture.success) {
            localArchivePath = capture.s3Path;
          }
        }
      }

      await prisma.source.update({
        where: { id: sourceId },
        data: {
          archiveStatus: archiveUrl || localArchivePath ? "archived" : "failed",
          archiveUrl,
          localArchivePath,
          archivedAt: new Date(),
          archiveError: null,
        },
      });
    } catch (error) {
      await prisma.source.update({
        where: { id: sourceId },
        data: {
          archiveStatus: "failed",
          archiveError: String(error),
        },
      });
    }
  },
  { connection: redisConnection, concurrency: 5 }
);
```

### Auto-Archive on Source Creation

```typescript
// lib/sources/archiveTriggers.ts

export async function onSourceCreated(sourceId: string, autoArchive: boolean = true) {
  // Queue verification first
  await sourceVerificationQueue.add("verify", { sourceId });

  // If auto-archive is enabled, queue archiving after verification
  if (autoArchive) {
    await sourceArchivingQueue.add(
      "archive",
      { sourceId, strategy: "wayback" },
      { delay: 30000 } // Wait 30s for verification to complete
    );
  }
}

// User settings for auto-archive
export interface UserArchiveSettings {
  autoArchive: boolean;          // Auto-archive new sources
  archiveStrategy: "wayback" | "local" | "both";
  notifyOnArchiveFailure: boolean;
}
```

### Archive Badge and Controls

```tsx
// components/sources/ArchiveBadge.tsx

"use client";

import {
  ArchiveIcon,
  CloudIcon,
  AlertCircleIcon,
  LoaderIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ArchiveStatus = "none" | "pending" | "in_progress" | "archived" | "failed" | "exists";

interface ArchiveBadgeProps {
  status: ArchiveStatus;
  archiveUrl?: string | null;
  archivedAt?: Date | null;
  onRequestArchive?: () => void;
}

export function ArchiveBadge({
  status,
  archiveUrl,
  archivedAt,
  onRequestArchive,
}: ArchiveBadgeProps) {
  if (status === "archived" || status === "exists") {
    return (
      <a
        href={archiveUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-green-600 hover:underline"
      >
        <ArchiveIcon className="h-4 w-4" />
        <span className="text-xs">Archived</span>
        <ExternalLinkIcon className="h-3 w-3" />
      </a>
    );
  }

  if (status === "pending" || status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 text-blue-600">
        <LoaderIcon className="h-4 w-4 animate-spin" />
        <span className="text-xs">Archiving...</span>
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-red-600">
        <AlertCircleIcon className="h-4 w-4" />
        <span className="text-xs">Archive failed</span>
        {onRequestArchive && (
          <Button variant="ghost" size="sm" onClick={onRequestArchive}>
            Retry
          </Button>
        )}
      </span>
    );
  }

  // status === "none"
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRequestArchive}
      className="text-xs text-muted-foreground"
    >
      <CloudIcon className="h-4 w-4 mr-1" />
      Archive
    </Button>
  );
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Check existing archive | URL with Wayback snapshot → finds it |
| Request new archive | New URL → Wayback save requested |
| Archive status updates | Queue job → status transitions correctly |
| Archive URL stored | Successful archive → archiveUrl populated |
| Auto-archive on create | New source with autoArchive=true → job queued |
| Failed archive handling | Bad URL → status = failed, error stored |
| Archive badge clickable | Archived source → link opens Wayback |

---

## 3.1.3 Retraction & Correction Alerts

**Priority**: P1 — Critical for academic credibility  
**Estimated Effort**: 3 days  
**Risk Level**: Medium (external API dependency)

### Problem Statement

Scientific papers get retracted. News articles get corrections. If users are citing sources that have been retracted or significantly corrected, the entire evidence chain is compromised.

### Data Sources for Retraction/Correction Detection

1. **Retraction Watch Database** — Comprehensive retraction tracker
2. **CrossRef Event Data** — DOI metadata changes
3. **PubMed** — Retraction notices linked to PMIDs

### Schema Addition

```prisma
model Source {
  // ... existing fields ...
  
  // ─────────────────────────────────────────────────────────
  // RETRACTION/CORRECTION TRACKING
  // ─────────────────────────────────────────────────────────
  retractionStatus      RetractionStatus @default(none)
  retractionCheckedAt   DateTime?
  retractionNoticeUrl   String?
  retractionReason      String?
  retractionDate        DateTime?
  
  correctionStatus      CorrectionStatus @default(none)
  correctionUrl         String?
  correctionDate        DateTime?
  correctionSummary     String?
}

enum RetractionStatus {
  none              // No retraction
  retracted         // Fully retracted
  expression_of_concern  // Expression of concern issued
  partial_retraction     // Partial retraction
}

enum CorrectionStatus {
  none              // No corrections
  minor_correction  // Minor correction (typos, formatting)
  major_correction  // Major correction (data, methodology)
  erratum           // Formal erratum published
}

// Track notifications sent to users
model SourceAlert {
  id          String   @id @default(cuid())
  sourceId    String
  alertType   SourceAlertType
  message     String
  createdAt   DateTime @default(now())
  
  source      Source   @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  
  // Users who were notified
  notifications SourceAlertNotification[]
  
  @@index([sourceId])
}

model SourceAlertNotification {
  id          String   @id @default(cuid())
  alertId     String
  userId      String
  seenAt      DateTime?
  dismissedAt DateTime?
  createdAt   DateTime @default(now())
  
  alert       SourceAlert @relation(fields: [alertId], references: [id], onDelete: Cascade)
  
  @@unique([alertId, userId])
}

enum SourceAlertType {
  retraction
  expression_of_concern
  major_correction
  link_broken
  content_changed
}
```

### Retraction Check Integration

```typescript
// lib/sources/retractionCheck.ts

interface RetractionResult {
  isRetracted: boolean;
  status: RetractionStatus;
  reason?: string;
  noticeUrl?: string;
  date?: Date;
}

/**
 * Check Retraction Watch Database
 * Note: Requires API key from retractiondatabase.org
 */
export async function checkRetractionWatch(doi: string): Promise<RetractionResult> {
  const apiKey = process.env.RETRACTION_WATCH_API_KEY;
  if (!apiKey) {
    return { isRetracted: false, status: "none" };
  }

  try {
    const response = await fetch(
      `https://api.retractiondatabase.org/api/v1/record?doi=${encodeURIComponent(doi)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      return { isRetracted: false, status: "none" };
    }

    const data = await response.json();
    
    if (data.records && data.records.length > 0) {
      const record = data.records[0];
      return {
        isRetracted: true,
        status: mapRetractionType(record.RetractionNature),
        reason: record.Reason,
        noticeUrl: record.RetractionNoticeURL,
        date: record.RetractionDate ? new Date(record.RetractionDate) : undefined,
      };
    }

    return { isRetracted: false, status: "none" };
  } catch (error) {
    console.error("Retraction Watch check failed:", error);
    return { isRetracted: false, status: "none" };
  }
}

/**
 * Check CrossRef for retraction metadata
 */
export async function checkCrossRefRetraction(doi: string): Promise<RetractionResult> {
  try {
    const response = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
      {
        headers: {
          "User-Agent": "MeshBot/1.0 (mailto:support@mesh.app)",
        },
      }
    );

    if (!response.ok) {
      return { isRetracted: false, status: "none" };
    }

    const data = await response.json();
    const work = data.message;

    // Check for retraction relation
    if (work.relation?.["is-retracted-by"]) {
      return {
        isRetracted: true,
        status: "retracted",
        noticeUrl: work.relation["is-retracted-by"][0]?.id,
      };
    }

    // Check update-to field
    if (work["update-to"]) {
      const updates = work["update-to"];
      const retraction = updates.find((u: any) => u.type === "retraction");
      if (retraction) {
        return {
          isRetracted: true,
          status: "retracted",
          noticeUrl: `https://doi.org/${retraction.DOI}`,
        };
      }
    }

    return { isRetracted: false, status: "none" };
  } catch (error) {
    return { isRetracted: false, status: "none" };
  }
}

function mapRetractionType(nature: string): RetractionStatus {
  const lower = nature?.toLowerCase() || "";
  if (lower.includes("expression of concern")) return "expression_of_concern";
  if (lower.includes("partial")) return "partial_retraction";
  return "retracted";
}
```

### Alert Notification System

```typescript
// lib/sources/alertNotifications.ts

import { prisma } from "@/lib/prismaclient";

export async function createSourceAlert(
  sourceId: string,
  alertType: SourceAlertType,
  message: string
) {
  // Create the alert
  const alert = await prisma.sourceAlert.create({
    data: {
      sourceId,
      alertType,
      message,
    },
  });

  // Find all users who have cited this source
  const citations = await prisma.citation.findMany({
    where: { sourceId },
    select: { createdById: true },
    distinct: ["createdById"],
  });

  // Also find users who have the source in their stacks
  const stackItems = await prisma.stackItem.findMany({
    where: {
      blockType: "post",
      block: { sourceId }, // Assuming LibraryPost links to Source
    },
    select: { addedById: true },
    distinct: ["addedById"],
  });

  const userIds = new Set([
    ...citations.map((c) => c.createdById),
    ...stackItems.map((s) => s.addedById),
  ]);

  // Create notifications for each user
  for (const userId of userIds) {
    await prisma.sourceAlertNotification.create({
      data: {
        alertId: alert.id,
        userId,
      },
    });
  }

  // Optionally send email notifications for high-priority alerts
  if (alertType === "retraction") {
    await sendRetractionEmails(alert.id, Array.from(userIds));
  }

  return alert;
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| DOI retraction check | Retracted DOI → status = retracted |
| Expression of concern | EOC DOI → status = expression_of_concern |
| Alert created | Retraction detected → SourceAlert created |
| Users notified | Users who cited source → notifications created |
| UI shows warning | Retracted source in citation → warning badge |
| Dismiss alert | User dismisses → dismissedAt set |

---

## 3.1.4 Conflict of Interest Disclosure

**Priority**: P2 — Transparency layer  
**Estimated Effort**: 2 days  
**Risk Level**: Low

### Schema Addition

```prisma
model SourceDisclosure {
  id          String   @id @default(cuid())
  sourceId    String
  userId      String
  
  // Disclosure types
  relationship  DisclosureRelationship
  description   String?
  
  createdAt   DateTime @default(now())
  
  source      Source   @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  
  @@unique([sourceId, userId])
}

enum DisclosureRelationship {
  author              // User is an author of the source
  affiliated          // User is affiliated with source organization
  funded_by           // User is funded by source funder
  personal            // Personal relationship with authors
  financial_interest  // Financial interest in source subject
  none                // Explicitly no conflict
}
```

### Disclosure Prompt Component

```tsx
// components/sources/DisclosurePrompt.tsx

"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DisclosurePromptProps {
  open: boolean;
  onClose: () => void;
  sourceId: string;
  sourceTitle: string;
  onSubmit: (disclosure: { relationship: string; description?: string }) => void;
}

const relationships = [
  { value: "none", label: "No conflict of interest" },
  { value: "author", label: "I am an author of this work" },
  { value: "affiliated", label: "I am affiliated with the source organization" },
  { value: "funded_by", label: "I am funded by the same funder" },
  { value: "personal", label: "I have a personal relationship with the authors" },
  { value: "financial_interest", label: "I have a financial interest in this topic" },
];

export function DisclosurePrompt({
  open,
  onClose,
  sourceId,
  sourceTitle,
  onSubmit,
}: DisclosurePromptProps) {
  const [relationship, setRelationship] = useState<string>("none");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    onSubmit({
      relationship,
      description: relationship !== "none" ? description : undefined,
    });
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Conflict of Interest Disclosure</AlertDialogTitle>
          <AlertDialogDescription>
            Do you have any relationship with this source that readers should know about?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground truncate">
            Source: <span className="font-medium">{sourceTitle}</span>
          </p>

          <RadioGroup value={relationship} onValueChange={setRelationship}>
            {relationships.map((rel) => (
              <div key={rel.value} className="flex items-center space-x-2">
                <RadioGroupItem value={rel.value} id={rel.value} />
                <Label htmlFor={rel.value}>{rel.label}</Label>
              </div>
            ))}
          </RadioGroup>

          {relationship !== "none" && (
            <Textarea
              placeholder="Optional: Describe the relationship..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## Phase 3.1 Completion Checklist

### Pre-Launch Requirements

| Item | Owner | Status |
|------|-------|--------|
| Source verification schema migration | Backend | ☐ |
| Verification worker implementation | Backend | ☐ |
| Verification triggers (create, scheduled) | Backend | ☐ |
| Verification badge component | Frontend | ☐ |
| Wayback Machine integration | Backend | ☐ |
| Archive worker implementation | Backend | ☐ |
| Auto-archive on source creation | Backend | ☐ |
| Archive badge component | Frontend | ☐ |
| Retraction Watch API integration | Backend | ☐ |
| CrossRef retraction check | Backend | ☐ |
| Source alert system | Backend | ☐ |
| Alert notification UI | Frontend | ☐ |
| Conflict of interest schema | Backend | ☐ |
| Disclosure prompt component | Frontend | ☐ |

### Testing Requirements

| Test Type | Coverage |
|-----------|----------|
| Unit tests | URL verification, paywall detection |
| Unit tests | Wayback timestamp parsing |
| Integration tests | Full verification flow |
| Integration tests | Archive request → status update |
| E2E tests | Source creation → verification → archiving |

---

**Estimated Phase 3.1 Duration**: 2-3 weeks

---

# PHASE 3.2: INTEGRATION & INTEROPERABILITY

**Objective**: Connect Mesh to the academic research ecosystem—enabling seamless import from major databases, bidirectional sync with reference managers, and programmatic access for power users and external tools.

**Timeline**: Weeks 4-7  
**Team**: 1-2 engineers  
**Dependencies**: Phase 3.1 (Source model extensions)

---

## 3.2.1 Academic Database Integration

**Priority**: P0 — Core research workflow enablement  
**Estimated Effort**: 5-7 days  
**Risk Level**: Medium (external API dependencies, rate limits)

### Problem Statement

Researchers currently must manually enter source metadata or hope DOI lookup works. This is friction that competing tools (Zotero, Mendeley, Papers) solve well.

**Goal**: One-click import from Semantic Scholar, OpenAlex, PubMed, CrossRef, and arXiv.

### Supported Databases

| Database | Coverage | API | Rate Limits | Priority |
|----------|----------|-----|-------------|----------|
| **Semantic Scholar** | 200M+ papers, citations, abstracts | REST | 100/5min (free), 10K/5min (partner) | P0 |
| **OpenAlex** | 250M+ works, open access | REST | Unlimited (polite use) | P0 |
| **CrossRef** | 140M+ DOIs, metadata | REST | 50/sec (polite pool) | P0 |
| **PubMed** | 35M+ biomedical | E-utilities | 3/sec (API key: 10/sec) | P1 |
| **arXiv** | 2M+ preprints | OAI-PMH, REST | Reasonable use | P1 |

### Unified Search Interface

```typescript
// lib/sources/academicSearch.ts

export interface AcademicSearchResult {
  // Identifiers
  doi?: string;
  pmid?: string;
  arxivId?: string;
  semanticScholarId?: string;
  openAlexId?: string;
  
  // Core metadata
  title: string;
  authors: { name: string; affiliations?: string[] }[];
  year?: number;
  publicationDate?: string;
  
  // Publication info
  venue?: string;           // Journal/conference name
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  
  // Content
  abstract?: string;
  keywords?: string[];
  
  // Access
  url?: string;
  pdfUrl?: string;
  isOpenAccess?: boolean;
  
  // Citations
  citationCount?: number;
  influentialCitationCount?: number;
  
  // Source tracking
  dataSource: "semantic_scholar" | "openalex" | "crossref" | "pubmed" | "arxiv";
}

export interface AcademicSearchOptions {
  query: string;
  databases?: ("semantic_scholar" | "openalex" | "crossref" | "pubmed" | "arxiv")[];
  limit?: number;
  year?: { min?: number; max?: number };
  openAccessOnly?: boolean;
}

export async function searchAcademicDatabases(
  options: AcademicSearchOptions
): Promise<AcademicSearchResult[]> {
  const databases = options.databases || ["semantic_scholar", "openalex"];
  const results: AcademicSearchResult[] = [];

  // Search databases in parallel
  const searches = databases.map(async (db) => {
    switch (db) {
      case "semantic_scholar":
        return searchSemanticScholar(options);
      case "openalex":
        return searchOpenAlex(options);
      case "crossref":
        return searchCrossRef(options);
      case "pubmed":
        return searchPubMed(options);
      case "arxiv":
        return searchArxiv(options);
      default:
        return [];
    }
  });

  const allResults = await Promise.allSettled(searches);
  
  for (const result of allResults) {
    if (result.status === "fulfilled") {
      results.push(...result.value);
    }
  }

  // Deduplicate by DOI
  return deduplicateResults(results);
}

function deduplicateResults(results: AcademicSearchResult[]): AcademicSearchResult[] {
  const seen = new Map<string, AcademicSearchResult>();
  
  for (const result of results) {
    // Use DOI as primary dedup key, fall back to title+year
    const key = result.doi || `${result.title.toLowerCase()}:${result.year}`;
    
    if (!seen.has(key)) {
      seen.set(key, result);
    } else {
      // Merge additional data from duplicate
      const existing = seen.get(key)!;
      seen.set(key, mergeResults(existing, result));
    }
  }
  
  return Array.from(seen.values());
}

function mergeResults(
  a: AcademicSearchResult,
  b: AcademicSearchResult
): AcademicSearchResult {
  return {
    ...a,
    // Prefer non-null values
    doi: a.doi || b.doi,
    pmid: a.pmid || b.pmid,
    arxivId: a.arxivId || b.arxivId,
    abstract: a.abstract || b.abstract,
    pdfUrl: a.pdfUrl || b.pdfUrl,
    citationCount: Math.max(a.citationCount || 0, b.citationCount || 0),
    isOpenAccess: a.isOpenAccess || b.isOpenAccess,
  };
}
```

### Semantic Scholar Integration

```typescript
// lib/sources/databases/semanticScholar.ts

const S2_API_BASE = "https://api.semanticscholar.org/graph/v1";
const S2_API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;

interface S2PaperResponse {
  paperId: string;
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
    PubMed?: string;
  };
  title: string;
  authors: { name: string; affiliations?: string[] }[];
  year?: number;
  venue?: string;
  publicationDate?: string;
  abstract?: string;
  citationCount?: number;
  influentialCitationCount?: number;
  isOpenAccess?: boolean;
  openAccessPdf?: { url: string };
}

export async function searchSemanticScholar(
  options: AcademicSearchOptions
): Promise<AcademicSearchResult[]> {
  const params = new URLSearchParams({
    query: options.query,
    limit: String(options.limit || 20),
    fields: "paperId,externalIds,title,authors,year,venue,publicationDate,abstract,citationCount,influentialCitationCount,isOpenAccess,openAccessPdf",
  });

  if (options.year?.min) {
    params.set("year", `${options.year.min}-${options.year.max || new Date().getFullYear()}`);
  }
  if (options.openAccessOnly) {
    params.set("openAccessPdf", "");
  }

  const response = await fetch(`${S2_API_BASE}/paper/search?${params}`, {
    headers: S2_API_KEY ? { "x-api-key": S2_API_KEY } : {},
  });

  if (!response.ok) {
    console.error("Semantic Scholar search failed:", response.status);
    return [];
  }

  const data = await response.json();
  return (data.data || []).map(mapS2Paper);
}

export async function getSemanticScholarPaper(
  identifier: string // DOI, arXiv ID, or S2 paper ID
): Promise<AcademicSearchResult | null> {
  const fields = "paperId,externalIds,title,authors,year,venue,publicationDate,abstract,citationCount,influentialCitationCount,isOpenAccess,openAccessPdf,references,citations";
  
  const response = await fetch(
    `${S2_API_BASE}/paper/${encodeURIComponent(identifier)}?fields=${fields}`,
    { headers: S2_API_KEY ? { "x-api-key": S2_API_KEY } : {} }
  );

  if (!response.ok) return null;
  
  const paper = await response.json();
  return mapS2Paper(paper);
}

export async function getSemanticScholarCitations(
  paperId: string,
  limit: number = 100
): Promise<AcademicSearchResult[]> {
  const response = await fetch(
    `${S2_API_BASE}/paper/${paperId}/citations?fields=paperId,title,authors,year,venue&limit=${limit}`,
    { headers: S2_API_KEY ? { "x-api-key": S2_API_KEY } : {} }
  );

  if (!response.ok) return [];
  
  const data = await response.json();
  return (data.data || []).map((c: any) => mapS2Paper(c.citingPaper));
}

export async function getSemanticScholarReferences(
  paperId: string,
  limit: number = 100
): Promise<AcademicSearchResult[]> {
  const response = await fetch(
    `${S2_API_BASE}/paper/${paperId}/references?fields=paperId,title,authors,year,venue&limit=${limit}`,
    { headers: S2_API_KEY ? { "x-api-key": S2_API_KEY } : {} }
  );

  if (!response.ok) return [];
  
  const data = await response.json();
  return (data.data || []).map((r: any) => mapS2Paper(r.citedPaper));
}

function mapS2Paper(paper: S2PaperResponse): AcademicSearchResult {
  return {
    semanticScholarId: paper.paperId,
    doi: paper.externalIds?.DOI,
    arxivId: paper.externalIds?.ArXiv,
    pmid: paper.externalIds?.PubMed,
    title: paper.title,
    authors: paper.authors || [],
    year: paper.year,
    publicationDate: paper.publicationDate,
    venue: paper.venue,
    abstract: paper.abstract,
    citationCount: paper.citationCount,
    influentialCitationCount: paper.influentialCitationCount,
    isOpenAccess: paper.isOpenAccess,
    pdfUrl: paper.openAccessPdf?.url,
    dataSource: "semantic_scholar",
  };
}
```

### OpenAlex Integration

```typescript
// lib/sources/databases/openAlex.ts

const OPENALEX_API_BASE = "https://api.openalex.org";
const OPENALEX_EMAIL = process.env.OPENALEX_POLITE_EMAIL || "support@mesh.app";

interface OpenAlexWork {
  id: string;
  doi?: string;
  title: string;
  authorships: {
    author: { display_name: string };
    institutions: { display_name: string }[];
  }[];
  publication_year?: number;
  publication_date?: string;
  primary_location?: {
    source?: { display_name: string };
    pdf_url?: string;
    is_oa?: boolean;
  };
  abstract_inverted_index?: Record<string, number[]>;
  cited_by_count?: number;
  concepts?: { display_name: string; score: number }[];
}

export async function searchOpenAlex(
  options: AcademicSearchOptions
): Promise<AcademicSearchResult[]> {
  const params = new URLSearchParams({
    search: options.query,
    per_page: String(options.limit || 20),
    mailto: OPENALEX_EMAIL,
  });

  if (options.year?.min || options.year?.max) {
    const yearFilter = [];
    if (options.year.min) yearFilter.push(`from_publication_date:${options.year.min}-01-01`);
    if (options.year.max) yearFilter.push(`to_publication_date:${options.year.max}-12-31`);
    params.set("filter", yearFilter.join(","));
  }

  if (options.openAccessOnly) {
    const existing = params.get("filter") || "";
    params.set("filter", existing ? `${existing},is_oa:true` : "is_oa:true");
  }

  const response = await fetch(`${OPENALEX_API_BASE}/works?${params}`);

  if (!response.ok) {
    console.error("OpenAlex search failed:", response.status);
    return [];
  }

  const data = await response.json();
  return (data.results || []).map(mapOpenAlexWork);
}

export async function getOpenAlexWork(
  identifier: string // DOI or OpenAlex ID
): Promise<AcademicSearchResult | null> {
  // Handle DOI format
  const id = identifier.startsWith("10.") 
    ? `https://doi.org/${identifier}` 
    : identifier;

  const response = await fetch(
    `${OPENALEX_API_BASE}/works/${encodeURIComponent(id)}?mailto=${OPENALEX_EMAIL}`
  );

  if (!response.ok) return null;
  
  const work = await response.json();
  return mapOpenAlexWork(work);
}

function mapOpenAlexWork(work: OpenAlexWork): AcademicSearchResult {
  // Reconstruct abstract from inverted index
  let abstract: string | undefined;
  if (work.abstract_inverted_index) {
    const words: [string, number][] = [];
    for (const [word, positions] of Object.entries(work.abstract_inverted_index)) {
      for (const pos of positions) {
        words.push([word, pos]);
      }
    }
    words.sort((a, b) => a[1] - b[1]);
    abstract = words.map(([w]) => w).join(" ");
  }

  return {
    openAlexId: work.id,
    doi: work.doi?.replace("https://doi.org/", ""),
    title: work.title,
    authors: work.authorships.map((a) => ({
      name: a.author.display_name,
      affiliations: a.institutions.map((i) => i.display_name),
    })),
    year: work.publication_year,
    publicationDate: work.publication_date,
    venue: work.primary_location?.source?.display_name,
    abstract,
    citationCount: work.cited_by_count,
    isOpenAccess: work.primary_location?.is_oa,
    pdfUrl: work.primary_location?.pdf_url,
    keywords: work.concepts
      ?.filter((c) => c.score > 0.5)
      .map((c) => c.display_name),
    dataSource: "openalex",
  };
}
```

### CrossRef Integration

```typescript
// lib/sources/databases/crossref.ts

const CROSSREF_API_BASE = "https://api.crossref.org";
const CROSSREF_EMAIL = process.env.CROSSREF_POLITE_EMAIL || "support@mesh.app";

export async function searchCrossRef(
  options: AcademicSearchOptions
): Promise<AcademicSearchResult[]> {
  const params = new URLSearchParams({
    query: options.query,
    rows: String(options.limit || 20),
    mailto: CROSSREF_EMAIL,
  });

  if (options.year?.min || options.year?.max) {
    if (options.year.min) {
      params.set("filter", `from-pub-date:${options.year.min}`);
    }
    if (options.year.max) {
      const existing = params.get("filter") || "";
      params.set("filter", `${existing},until-pub-date:${options.year.max}`);
    }
  }

  const response = await fetch(`${CROSSREF_API_BASE}/works?${params}`, {
    headers: {
      "User-Agent": `MeshBot/1.0 (mailto:${CROSSREF_EMAIL})`,
    },
  });

  if (!response.ok) {
    console.error("CrossRef search failed:", response.status);
    return [];
  }

  const data = await response.json();
  return (data.message?.items || []).map(mapCrossRefWork);
}

export async function getCrossRefWork(doi: string): Promise<AcademicSearchResult | null> {
  const response = await fetch(
    `${CROSSREF_API_BASE}/works/${encodeURIComponent(doi)}`,
    {
      headers: {
        "User-Agent": `MeshBot/1.0 (mailto:${CROSSREF_EMAIL})`,
      },
    }
  );

  if (!response.ok) return null;
  
  const data = await response.json();
  return mapCrossRefWork(data.message);
}

function mapCrossRefWork(work: any): AcademicSearchResult {
  const published = work.published?.["date-parts"]?.[0];
  const year = published?.[0];
  const publicationDate = published
    ? `${published[0]}-${String(published[1] || 1).padStart(2, "0")}-${String(published[2] || 1).padStart(2, "0")}`
    : undefined;

  return {
    doi: work.DOI,
    title: work.title?.[0] || "Untitled",
    authors: (work.author || []).map((a: any) => ({
      name: `${a.given || ""} ${a.family || ""}`.trim(),
      affiliations: a.affiliation?.map((af: any) => af.name),
    })),
    year,
    publicationDate,
    venue: work["container-title"]?.[0],
    publisher: work.publisher,
    volume: work.volume,
    issue: work.issue,
    pages: work.page,
    url: work.URL,
    citationCount: work["is-referenced-by-count"],
    dataSource: "crossref",
  };
}
```

### Source Import API

```typescript
// app/api/sources/import/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { getSemanticScholarPaper } from "@/lib/sources/databases/semanticScholar";
import { getOpenAlexWork } from "@/lib/sources/databases/openAlex";
import { getCrossRefWork } from "@/lib/sources/databases/crossref";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { identifier, identifierType, stackId } = await req.json();

  if (!identifier) {
    return NextResponse.json({ error: "identifier required" }, { status: 400 });
  }

  // Determine identifier type if not provided
  const type = identifierType || detectIdentifierType(identifier);

  // Fetch metadata from appropriate source
  let metadata: AcademicSearchResult | null = null;

  switch (type) {
    case "doi":
      // Try multiple sources for DOI
      metadata = await getCrossRefWork(identifier);
      if (!metadata?.abstract) {
        const s2 = await getSemanticScholarPaper(`DOI:${identifier}`);
        if (s2) metadata = { ...metadata, ...s2, abstract: s2.abstract || metadata?.abstract };
      }
      break;
    case "arxiv":
      metadata = await getSemanticScholarPaper(`ARXIV:${identifier}`);
      break;
    case "pmid":
      metadata = await getSemanticScholarPaper(`PMID:${identifier}`);
      break;
    case "semantic_scholar":
      metadata = await getSemanticScholarPaper(identifier);
      break;
    case "openalex":
      metadata = await getOpenAlexWork(identifier);
      break;
  }

  if (!metadata) {
    return NextResponse.json(
      { error: "Could not find source with this identifier" },
      { status: 404 }
    );
  }

  // Check for existing source with same DOI
  let source = metadata.doi
    ? await prisma.source.findFirst({ where: { doi: metadata.doi } })
    : null;

  if (!source) {
    // Create new source
    source = await prisma.source.create({
      data: {
        kind: "paper",
        title: metadata.title,
        authorsJson: metadata.authors,
        year: metadata.year,
        doi: metadata.doi,
        url: metadata.url || metadata.pdfUrl,
        abstract: metadata.abstract,
        venue: metadata.venue,
        publisher: metadata.publisher,
        // Enrichment metadata
        enrichmentStatus: "enriched",
        enrichedAt: new Date(),
        enrichmentSource: metadata.dataSource,
        // External IDs
        externalIds: {
          semanticScholar: metadata.semanticScholarId,
          openAlex: metadata.openAlexId,
          arxiv: metadata.arxivId,
          pmid: metadata.pmid,
        },
        // Citation count
        citationCount: metadata.citationCount,
        isOpenAccess: metadata.isOpenAccess,
      },
    });

    // Queue verification and archiving
    await sourceVerificationQueue.add("verify", { sourceId: source.id });
    if (metadata.pdfUrl) {
      await sourceArchivingQueue.add("archive", {
        sourceId: source.id,
        strategy: "wayback",
      });
    }
  }

  // If stackId provided, create a LibraryPost and add to stack
  let libraryPost = null;
  if (stackId) {
    libraryPost = await prisma.libraryPost.create({
      data: {
        title: metadata.title,
        uploader_id: BigInt(userId),
        sourceId: source.id,
        blockType: "paper",
        // If open access PDF available, we could download it
        file_url: metadata.pdfUrl,
      },
    });

    await prisma.stackItem.create({
      data: {
        stackId,
        blockType: "post",
        blockId: libraryPost.id,
        position: await getNextPosition(stackId),
        addedById: userId,
      },
    });
  }

  return NextResponse.json({
    source,
    libraryPost,
    metadata,
  });
}

function detectIdentifierType(identifier: string): string {
  if (identifier.startsWith("10.")) return "doi";
  if (identifier.match(/^\d{4}\.\d{4,5}(v\d+)?$/)) return "arxiv";
  if (identifier.match(/^\d{7,8}$/)) return "pmid";
  if (identifier.startsWith("W")) return "openalex";
  return "semantic_scholar";
}

async function getNextPosition(stackId: string): Promise<number> {
  const last = await prisma.stackItem.findFirst({
    where: { stackId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return (last?.position || 0) + 1000;
}
```

### Academic Search UI Component

```tsx
// components/sources/AcademicSearchModal.tsx

"use client";

import { useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SearchIcon,
  PlusIcon,
  ExternalLinkIcon,
  BookOpenIcon,
  FileTextIcon,
} from "lucide-react";

interface AcademicSearchModalProps {
  open: boolean;
  onClose: () => void;
  stackId?: string;
  onImport?: (source: any) => void;
}

const databases = [
  { id: "semantic_scholar", label: "Semantic Scholar", default: true },
  { id: "openalex", label: "OpenAlex", default: true },
  { id: "crossref", label: "CrossRef", default: false },
  { id: "pubmed", label: "PubMed", default: false },
  { id: "arxiv", label: "arXiv", default: false },
];

export function AcademicSearchModal({
  open,
  onClose,
  stackId,
  onImport,
}: AcademicSearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedDatabases, setSelectedDatabases] = useState(
    databases.filter((d) => d.default).map((d) => d.id)
  );
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 500);

  const search = useCallback(async () => {
    if (!debouncedQuery || debouncedQuery.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: debouncedQuery,
        databases: selectedDatabases.join(","),
        limit: "20",
      });

      const res = await fetch(`/api/sources/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedDatabases]);

  const handleImport = async (result: any) => {
    setImporting(result.doi || result.semanticScholarId);
    try {
      const res = await fetch("/api/sources/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: result.doi || result.semanticScholarId,
          identifierType: result.doi ? "doi" : "semantic_scholar",
          stackId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onImport?.(data.source);
        // Remove from results or mark as imported
        setResults((prev) =>
          prev.map((r) =>
            r.doi === result.doi ? { ...r, imported: true } : r
          )
        );
      }
    } finally {
      setImporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Academic Databases</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search by title, author, DOI, or keywords..."
            className="pl-9"
          />
        </div>

        {/* Database selection */}
        <div className="flex flex-wrap gap-3">
          {databases.map((db) => (
            <label
              key={db.id}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={selectedDatabases.includes(db.id)}
                onCheckedChange={(checked) => {
                  setSelectedDatabases((prev) =>
                    checked
                      ? [...prev, db.id]
                      : prev.filter((d) => d !== db.id)
                  );
                }}
              />
              {db.label}
            </label>
          ))}
          <Button size="sm" onClick={search} disabled={loading}>
            Search
          </Button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-3 mt-4">
          {loading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {query
                ? "No results found. Try different keywords."
                : "Enter a search query to find papers."}
            </div>
          ) : (
            results.map((result, i) => (
              <div
                key={result.doi || result.semanticScholarId || i}
                className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h4 className="font-medium line-clamp-2">{result.title}</h4>

                    {/* Authors & Year */}
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.authors
                        ?.slice(0, 3)
                        .map((a: any) => a.name)
                        .join(", ")}
                      {result.authors?.length > 3 && " et al."}
                      {result.year && ` (${result.year})`}
                    </p>

                    {/* Venue */}
                    {result.venue && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {result.venue}
                      </p>
                    )}

                    {/* Metadata badges */}
                    <div className="flex items-center gap-2 mt-2">
                      {result.citationCount > 0 && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {result.citationCount.toLocaleString()} citations
                        </span>
                      )}
                      {result.isOpenAccess && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          Open Access
                        </span>
                      )}
                      {result.doi && (
                        <a
                          href={`https://doi.org/${result.doi}`}
                          target="_blank"
                          rel="noopener"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLinkIcon className="h-3 w-3" />
                          DOI
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Import button */}
                  <Button
                    size="sm"
                    variant={result.imported ? "secondary" : "default"}
                    disabled={result.imported || importing === (result.doi || result.semanticScholarId)}
                    onClick={() => handleImport(result)}
                  >
                    {result.imported ? (
                      "Added"
                    ) : importing === (result.doi || result.semanticScholarId) ? (
                      "Adding..."
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>

                {/* Abstract preview */}
                {result.abstract && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {result.abstract}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Semantic Scholar search works | Search "attention is all you need" → returns paper |
| OpenAlex search works | Search for paper → results include citation counts |
| CrossRef lookup works | Enter DOI → metadata returned |
| Deduplication works | Same paper in S2 and OA → single result |
| Import creates Source | Import paper → Source record created |
| Import adds to stack | Import with stackId → LibraryPost + StackItem created |
| Existing DOI reused | Import duplicate DOI → existing Source returned |
| Open access PDF detected | OA paper → pdfUrl populated |

---

## 3.2.2 Reference Manager Sync

**Priority**: P1 — Researcher workflow integration  
**Estimated Effort**: 4-5 days  
**Risk Level**: Medium (OAuth complexity, sync conflicts)

### Problem Statement

Researchers already have libraries in Zotero, Mendeley, or EndNote. Making them manually re-add sources to Mesh creates friction.

**Goal**: Bidirectional sync with Zotero (primary), Mendeley (secondary).

### Supported Reference Managers

| Manager | Sync Direction | API | Auth | Priority |
|---------|---------------|-----|------|----------|
| **Zotero** | Bidirectional | REST | OAuth/API Key | P0 |
| **Mendeley** | Import only | REST | OAuth | P1 |
| **EndNote** | Export only | RIS/BibTeX file | N/A | P2 |

### Schema Addition

```prisma
model ReferenceManagerConnection {
  id              String   @id @default(cuid())
  userId          String
  
  provider        ReferenceManagerProvider
  accessToken     String   // Encrypted
  refreshToken    String?  // Encrypted
  expiresAt       DateTime?
  
  // Zotero-specific
  zoteroUserId    String?
  zoteroApiKey    String?  // For API key auth (alternative to OAuth)
  
  // Sync state
  lastSyncAt      DateTime?
  syncStatus      SyncStatus @default(idle)
  syncError       String?
  
  // Settings
  autoSync        Boolean @default(false)
  syncDirection   SyncDirection @default(import_only)
  defaultStackId  String?  // Stack to import into
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            Profile @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, provider])
}

enum ReferenceManagerProvider {
  zotero
  mendeley
  endnote
}

enum SyncStatus {
  idle
  syncing
  error
}

enum SyncDirection {
  import_only     // Only import from reference manager to Mesh
  export_only     // Only export from Mesh to reference manager
  bidirectional   // Sync both ways
}

// Track synced items to detect changes
model ReferenceManagerItem {
  id              String   @id @default(cuid())
  connectionId    String
  sourceId        String
  
  // External ID
  externalId      String   // Zotero item key, Mendeley ID, etc.
  externalVersion Int?     // Version number for conflict detection
  
  // Sync metadata
  lastSyncedAt    DateTime
  localModifiedAt DateTime?
  remoteModifiedAt DateTime?
  
  connection      ReferenceManagerConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  source          Source @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  
  @@unique([connectionId, externalId])
  @@unique([connectionId, sourceId])
}
```

### Zotero Integration

```typescript
// lib/referenceManagers/zotero.ts

const ZOTERO_API_BASE = "https://api.zotero.org";

interface ZoteroItem {
  key: string;
  version: number;
  data: {
    itemType: string;
    title: string;
    creators: { firstName?: string; lastName?: string; name?: string; creatorType: string }[];
    date?: string;
    DOI?: string;
    url?: string;
    publicationTitle?: string;
    publisher?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    abstractNote?: string;
    tags?: { tag: string }[];
    // ... many more fields
  };
}

export class ZoteroClient {
  private userId: string;
  private apiKey: string;

  constructor(userId: string, apiKey: string) {
    this.userId = userId;
    this.apiKey = apiKey;
  }

  private async request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${ZOTERO_API_BASE}/users/${this.userId}${path}`, {
      ...options,
      headers: {
        "Zotero-API-Key": this.apiKey,
        "Zotero-API-Version": "3",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Zotero API error: ${response.status}`);
    }

    return response;
  }

  async getItems(options: {
    limit?: number;
    start?: number;
    since?: number;
    collectionKey?: string;
  } = {}): Promise<{ items: ZoteroItem[]; totalResults: number; libraryVersion: number }> {
    const params = new URLSearchParams({
      format: "json",
      limit: String(options.limit || 100),
      start: String(options.start || 0),
    });

    if (options.since) {
      params.set("since", String(options.since));
    }

    const path = options.collectionKey
      ? `/collections/${options.collectionKey}/items?${params}`
      : `/items?${params}`;

    const response = await this.request(path);
    const items = await response.json();
    
    return {
      items,
      totalResults: parseInt(response.headers.get("Total-Results") || "0", 10),
      libraryVersion: parseInt(response.headers.get("Last-Modified-Version") || "0", 10),
    };
  }

  async getCollections(): Promise<{ key: string; name: string; parentCollection?: string }[]> {
    const response = await this.request("/collections?format=json");
    const collections = await response.json();
    return collections.map((c: any) => ({
      key: c.key,
      name: c.data.name,
      parentCollection: c.data.parentCollection || undefined,
    }));
  }

  async createItem(item: Partial<ZoteroItem["data"]>): Promise<ZoteroItem> {
    const response = await this.request("/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([item]),
    });

    const result = await response.json();
    return result.successful["0"];
  }

  async updateItem(key: string, version: number, data: Partial<ZoteroItem["data"]>): Promise<void> {
    await this.request(`/items/${key}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "If-Unmodified-Since-Version": String(version),
      },
      body: JSON.stringify(data),
    });
  }
}

// Map Zotero item to Source
export function zoteroItemToSource(item: ZoteroItem): Partial<Source> {
  const data = item.data;
  
  // Map creators to authors
  const authors = data.creators
    ?.filter((c) => c.creatorType === "author")
    .map((c) => ({
      name: c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim(),
    }));

  // Extract year from date
  const yearMatch = data.date?.match(/\d{4}/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;

  return {
    kind: mapZoteroItemType(data.itemType),
    title: data.title,
    authorsJson: authors,
    year,
    doi: data.DOI,
    url: data.url,
    venue: data.publicationTitle,
    publisher: data.publisher,
    volume: data.volume,
    issue: data.issue,
    pages: data.pages,
    abstract: data.abstractNote,
    keywords: data.tags?.map((t) => t.tag),
  };
}

// Map Source to Zotero item
export function sourceToZoteroItem(source: Source): Partial<ZoteroItem["data"]> {
  return {
    itemType: mapSourceKindToZotero(source.kind),
    title: source.title,
    creators: (source.authorsJson as any[])?.map((a) => ({
      creatorType: "author",
      name: a.name,
    })),
    date: source.year?.toString(),
    DOI: source.doi || undefined,
    url: source.url || undefined,
    publicationTitle: source.venue || undefined,
    publisher: source.publisher || undefined,
    abstractNote: source.abstract || undefined,
  };
}

function mapZoteroItemType(type: string): string {
  const mapping: Record<string, string> = {
    journalArticle: "article",
    book: "book",
    bookSection: "chapter",
    conferencePaper: "paper",
    thesis: "thesis",
    webpage: "website",
    preprint: "preprint",
  };
  return mapping[type] || "article";
}

function mapSourceKindToZotero(kind: string): string {
  const mapping: Record<string, string> = {
    article: "journalArticle",
    book: "book",
    chapter: "bookSection",
    paper: "conferencePaper",
    thesis: "thesis",
    website: "webpage",
    preprint: "preprint",
  };
  return mapping[kind] || "document";
}
```

### Sync Worker

```typescript
// workers/referenceManagerSync.ts

import { Queue, Worker } from "bullmq";
import { prisma } from "@/lib/prismaclient";
import { ZoteroClient, zoteroItemToSource, sourceToZoteroItem } from "@/lib/referenceManagers/zotero";
import { decrypt } from "@/lib/encryption";

interface SyncJob {
  connectionId: string;
  fullSync?: boolean;
}

export const referenceManagerSyncQueue = new Queue<SyncJob>(
  "reference-manager-sync",
  { connection: redisConnection }
);

export const referenceManagerSyncWorker = new Worker<SyncJob>(
  "reference-manager-sync",
  async (job) => {
    const { connectionId, fullSync } = job.data;

    const connection = await prisma.referenceManagerConnection.findUnique({
      where: { id: connectionId },
      include: { items: true },
    });

    if (!connection) return;

    await prisma.referenceManagerConnection.update({
      where: { id: connectionId },
      data: { syncStatus: "syncing" },
    });

    try {
      if (connection.provider === "zotero") {
        await syncZotero(connection, fullSync);
      }

      await prisma.referenceManagerConnection.update({
        where: { id: connectionId },
        data: {
          syncStatus: "idle",
          lastSyncAt: new Date(),
          syncError: null,
        },
      });
    } catch (error) {
      await prisma.referenceManagerConnection.update({
        where: { id: connectionId },
        data: {
          syncStatus: "error",
          syncError: String(error),
        },
      });
    }
  },
  { connection: redisConnection, concurrency: 5 }
);

async function syncZotero(connection: any, fullSync?: boolean) {
  const apiKey = decrypt(connection.zoteroApiKey);
  const client = new ZoteroClient(connection.zoteroUserId, apiKey);

  // Get items modified since last sync
  const sinceVersion = fullSync ? undefined : connection.lastLibraryVersion;
  const { items, libraryVersion } = await client.getItems({ since: sinceVersion });

  // Import new/updated items
  for (const item of items) {
    await importZoteroItem(connection, item);
  }

  // Export local changes (if bidirectional)
  if (connection.syncDirection === "bidirectional") {
    const modifiedSources = await prisma.source.findMany({
      where: {
        refManagerItems: {
          some: {
            connectionId: connection.id,
            localModifiedAt: { gt: connection.lastSyncAt || new Date(0) },
          },
        },
      },
    });

    for (const source of modifiedSources) {
      await exportSourceToZotero(connection, client, source);
    }
  }

  // Update library version
  await prisma.referenceManagerConnection.update({
    where: { id: connection.id },
    data: { lastLibraryVersion: libraryVersion },
  });
}

async function importZoteroItem(connection: any, item: any) {
  // Check if already synced
  const existing = await prisma.referenceManagerItem.findUnique({
    where: {
      connectionId_externalId: {
        connectionId: connection.id,
        externalId: item.key,
      },
    },
    include: { source: true },
  });

  const sourceData = zoteroItemToSource(item);

  if (existing) {
    // Update existing source
    await prisma.source.update({
      where: { id: existing.sourceId },
      data: sourceData,
    });

    await prisma.referenceManagerItem.update({
      where: { id: existing.id },
      data: {
        externalVersion: item.version,
        remoteModifiedAt: new Date(),
        lastSyncedAt: new Date(),
      },
    });
  } else {
    // Create new source
    const source = await prisma.source.create({
      data: {
        ...sourceData,
        title: sourceData.title || "Untitled",
      },
    });

    await prisma.referenceManagerItem.create({
      data: {
        connectionId: connection.id,
        sourceId: source.id,
        externalId: item.key,
        externalVersion: item.version,
        lastSyncedAt: new Date(),
      },
    });

    // Add to default stack if configured
    if (connection.defaultStackId) {
      // Create LibraryPost and StackItem...
    }
  }
}

async function exportSourceToZotero(connection: any, client: ZoteroClient, source: any) {
  const syncItem = await prisma.referenceManagerItem.findUnique({
    where: {
      connectionId_sourceId: {
        connectionId: connection.id,
        sourceId: source.id,
      },
    },
  });

  const zoteroData = sourceToZoteroItem(source);

  if (syncItem) {
    // Update existing Zotero item
    await client.updateItem(syncItem.externalId, syncItem.externalVersion || 0, zoteroData);
  } else {
    // Create new Zotero item
    const newItem = await client.createItem(zoteroData);
    
    await prisma.referenceManagerItem.create({
      data: {
        connectionId: connection.id,
        sourceId: source.id,
        externalId: newItem.key,
        externalVersion: newItem.version,
        lastSyncedAt: new Date(),
      },
    });
  }
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Zotero connection | Enter API key → connection created |
| Import from Zotero | Sync → items appear as Sources |
| Export to Zotero | Add source in Mesh → appears in Zotero |
| Incremental sync | Only changed items synced |
| Conflict detection | Both modified → flag for manual resolution |
| Auto-sync works | Auto-sync enabled → syncs on schedule |
| Default stack | Items imported to configured stack |

---

## 3.2.3 Embeddable Evidence Widgets

**Priority**: P2 — Distribution and reach  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low (client-side only)

### Problem Statement

Evidence and stacks are locked inside the Mesh platform. Researchers want to:
- Embed evidence lists in blog posts, papers, websites
- Share interactive stack previews on social media
- Display source verification status on external sites

**Goal**: Embeddable widgets that showcase Mesh's unique value (verification, citations, evidence health) outside the platform.

### Widget Types

| Widget | Purpose | Embed Size |
|--------|---------|------------|
| **Stack Preview** | Thumbnail grid of stack contents | 300-600px wide |
| **Evidence List** | Citations for a claim with intent grouping | 300-800px wide |
| **Source Card** | Single source with verification badge | 300-400px wide |
| **Evidence Health Badge** | Compact health score for deliberation | 80-150px wide |

### Widget Embed Code Generator

```typescript
// app/api/widgets/embed/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

interface EmbedOptions {
  widgetType: "stack" | "evidence" | "source" | "health";
  targetId: string;
  theme?: "light" | "dark" | "auto";
  width?: number;
  height?: number;
  showTitle?: boolean;
  compact?: boolean;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const widgetType = searchParams.get("type") as EmbedOptions["widgetType"];
  const targetId = searchParams.get("id");
  const theme = (searchParams.get("theme") || "auto") as EmbedOptions["theme"];
  const width = searchParams.get("width") ? parseInt(searchParams.get("width")!, 10) : undefined;
  const compact = searchParams.get("compact") === "true";

  if (!widgetType || !targetId) {
    return NextResponse.json(
      { error: "type and id required" },
      { status: 400 }
    );
  }

  // Verify target exists and is public
  const isPublic = await verifyPublicAccess(widgetType, targetId);
  if (!isPublic) {
    return NextResponse.json(
      { error: "Target not found or not public" },
      { status: 404 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mesh.app";
  const widgetUrl = `${baseUrl}/embed/${widgetType}/${targetId}`;
  
  const params = new URLSearchParams();
  if (theme !== "auto") params.set("theme", theme);
  if (width) params.set("width", String(width));
  if (compact) params.set("compact", "true");

  const fullUrl = params.toString() ? `${widgetUrl}?${params}` : widgetUrl;

  // Generate embed codes
  const iframeCode = generateIframeCode(fullUrl, widgetType, width);
  const scriptCode = generateScriptCode(fullUrl, targetId, widgetType);
  const oembedUrl = `${baseUrl}/api/oembed?url=${encodeURIComponent(fullUrl)}`;

  return NextResponse.json({
    widgetUrl: fullUrl,
    embedCodes: {
      iframe: iframeCode,
      script: scriptCode,
      oembed: oembedUrl,
    },
    preview: `${fullUrl}&preview=true`,
  });
}

async function verifyPublicAccess(
  widgetType: string,
  targetId: string
): Promise<boolean> {
  switch (widgetType) {
    case "stack":
      const stack = await prisma.stack.findUnique({
        where: { id: targetId },
        select: { visibility: true },
      });
      return stack?.visibility === "public" || stack?.visibility === "unlisted";
    
    case "source":
      // Sources are public if they have public citations
      const source = await prisma.source.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      return !!source;
    
    case "evidence":
    case "health":
      const deliberation = await prisma.deliberation.findUnique({
        where: { id: targetId },
        select: { isPublic: true },
      });
      return deliberation?.isPublic ?? false;
    
    default:
      return false;
  }
}

function generateIframeCode(url: string, type: string, width?: number): string {
  const heights: Record<string, number> = {
    stack: 400,
    evidence: 500,
    source: 150,
    health: 60,
  };

  const w = width || 600;
  const h = heights[type] || 300;

  return `<iframe
  src="${url}"
  width="${w}"
  height="${h}"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;"
  title="Mesh ${type} widget"
  loading="lazy"
></iframe>`;
}

function generateScriptCode(url: string, id: string, type: string): string {
  return `<div class="mesh-widget" data-mesh-type="${type}" data-mesh-id="${id}"></div>
<script src="https://mesh.app/embed.js" async></script>`;
}
```

### Widget Embed Pages

```tsx
// app/embed/stack/[stackId]/page.tsx

import { prisma } from "@/lib/prismaclient";
import { notFound } from "next/navigation";

interface Props {
  params: { stackId: string };
  searchParams: { theme?: string; width?: string; compact?: string };
}

export default async function StackEmbedPage({ params, searchParams }: Props) {
  const stack = await prisma.stack.findUnique({
    where: { id: params.stackId },
    include: {
      items: {
        orderBy: { position: "asc" },
        take: 12,
        include: {
          // Include block data based on type
        },
      },
      owner: {
        select: { username: true, avatar: true },
      },
      _count: { select: { items: true } },
    },
  });

  if (!stack || (stack.visibility !== "public" && stack.visibility !== "unlisted")) {
    notFound();
  }

  const theme = searchParams.theme || "auto";
  const compact = searchParams.compact === "true";

  return (
    <html className={theme === "dark" ? "dark" : ""}>
      <head>
        <style>{embedStyles}</style>
      </head>
      <body className="mesh-embed mesh-embed-stack">
        <div className="embed-header">
          <a
            href={`https://mesh.app/stacks/${stack.slug || stack.id}`}
            target="_blank"
            rel="noopener"
            className="embed-title"
          >
            {stack.name}
          </a>
          <span className="embed-meta">
            {stack._count.items} items · by {stack.owner.username}
          </span>
        </div>

        <div className={`embed-grid ${compact ? "compact" : ""}`}>
          {stack.items.map((item) => (
            <div key={item.id} className="embed-item">
              <StackItemThumbnail item={item} />
            </div>
          ))}
        </div>

        <a
          href={`https://mesh.app/stacks/${stack.slug || stack.id}`}
          target="_blank"
          rel="noopener"
          className="embed-cta"
        >
          View on Mesh →
        </a>

        <div className="embed-branding">
          <MeshLogo size={16} />
          <span>Powered by Mesh</span>
        </div>
      </body>
    </html>
  );
}

const embedStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .mesh-embed { padding: 16px; background: white; }
  .dark .mesh-embed { background: #1a1a1a; color: white; }
  .embed-header { margin-bottom: 12px; }
  .embed-title { font-size: 16px; font-weight: 600; color: inherit; text-decoration: none; }
  .embed-title:hover { text-decoration: underline; }
  .embed-meta { font-size: 12px; color: #6b7280; display: block; margin-top: 4px; }
  .embed-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .embed-grid.compact { grid-template-columns: repeat(6, 1fr); gap: 4px; }
  .embed-item { aspect-ratio: 1; border-radius: 4px; overflow: hidden; background: #f3f4f6; }
  .embed-cta { display: block; margin-top: 12px; font-size: 14px; color: #3b82f6; text-decoration: none; }
  .embed-branding { display: flex; align-items: center; gap: 6px; margin-top: 12px; font-size: 11px; color: #9ca3af; }
`;
```

### Evidence List Embed

```tsx
// app/embed/evidence/[targetId]/page.tsx

import { prisma } from "@/lib/prismaclient";
import { notFound } from "next/navigation";
import { IntentBadge } from "@/components/citations/IntentSelector";
import { VerificationBadge } from "@/components/sources/VerificationBadge";

interface Props {
  params: { targetId: string };
  searchParams: {
    targetType?: string;
    theme?: string;
    showIntent?: string;
    limit?: string;
  };
}

export default async function EvidenceEmbedPage({ params, searchParams }: Props) {
  const targetType = searchParams.targetType || "claim";
  const limit = parseInt(searchParams.limit || "10", 10);

  const citations = await prisma.citation.findMany({
    where: {
      targetType,
      targetId: params.targetId,
    },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          authorsJson: true,
          year: true,
          verificationStatus: true,
          url: true,
          doi: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (citations.length === 0) {
    notFound();
  }

  const showIntent = searchParams.showIntent !== "false";
  const theme = searchParams.theme || "auto";

  // Group by intent
  const grouped = groupByIntent(citations);

  return (
    <html className={theme === "dark" ? "dark" : ""}>
      <head>
        <style>{evidenceEmbedStyles}</style>
      </head>
      <body className="mesh-embed mesh-embed-evidence">
        <div className="embed-header">
          <span className="embed-title">Evidence ({citations.length})</span>
        </div>

        {showIntent ? (
          <div className="evidence-groups">
            {grouped.supports.length > 0 && (
              <div className="evidence-group supports">
                <h4 className="group-label">Supporting ({grouped.supports.length})</h4>
                {grouped.supports.map((c) => (
                  <CitationRow key={c.id} citation={c} />
                ))}
              </div>
            )}
            {grouped.refutes.length > 0 && (
              <div className="evidence-group refutes">
                <h4 className="group-label">Counter ({grouped.refutes.length})</h4>
                {grouped.refutes.map((c) => (
                  <CitationRow key={c.id} citation={c} />
                ))}
              </div>
            )}
            {grouped.context.length > 0 && (
              <div className="evidence-group context">
                <h4 className="group-label">Context ({grouped.context.length})</h4>
                {grouped.context.map((c) => (
                  <CitationRow key={c.id} citation={c} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="evidence-list">
            {citations.map((c) => (
              <CitationRow key={c.id} citation={c} />
            ))}
          </div>
        )}

        <div className="embed-branding">
          <MeshLogo size={16} />
          <span>Evidence verified by Mesh</span>
        </div>
      </body>
    </html>
  );
}

function CitationRow({ citation }: { citation: any }) {
  const source = citation.source;
  const authors = (source.authorsJson as any[])?.slice(0, 2);
  const authorText = authors?.map((a) => a.name.split(" ").pop()).join(", ");

  return (
    <div className="citation-row">
      <div className="citation-content">
        <a
          href={source.doi ? `https://doi.org/${source.doi}` : source.url}
          target="_blank"
          rel="noopener"
          className="citation-title"
        >
          {source.title}
        </a>
        <span className="citation-meta">
          {authorText}
          {source.year && ` (${source.year})`}
        </span>
      </div>
      <VerificationBadge status={source.verificationStatus} />
    </div>
  );
}

function groupByIntent(citations: any[]) {
  return {
    supports: citations.filter((c) => c.intent === "supports"),
    refutes: citations.filter((c) => c.intent === "refutes"),
    context: citations.filter(
      (c) => !["supports", "refutes"].includes(c.intent)
    ),
  };
}

const evidenceEmbedStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; }
  .mesh-embed { padding: 16px; background: white; }
  .dark .mesh-embed { background: #1a1a1a; color: white; }
  .embed-title { font-size: 14px; font-weight: 600; }
  .evidence-group { margin-top: 12px; }
  .group-label { font-size: 12px; font-weight: 500; margin-bottom: 8px; }
  .supports .group-label { color: #16a34a; }
  .refutes .group-label { color: #dc2626; }
  .context .group-label { color: #2563eb; }
  .citation-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
  .citation-title { font-size: 13px; color: inherit; text-decoration: none; line-height: 1.3; }
  .citation-title:hover { text-decoration: underline; }
  .citation-meta { font-size: 11px; color: #6b7280; display: block; margin-top: 2px; }
  .embed-branding { display: flex; align-items: center; gap: 6px; margin-top: 16px; font-size: 11px; color: #9ca3af; }
`;
```

### Embed Script (Client-Side)

```typescript
// public/embed.js

(function() {
  const MESH_BASE_URL = "https://mesh.app";

  function initMeshWidgets() {
    const widgets = document.querySelectorAll(".mesh-widget[data-mesh-type][data-mesh-id]");

    widgets.forEach((widget) => {
      if (widget.dataset.meshInitialized) return;
      widget.dataset.meshInitialized = "true";

      const type = widget.dataset.meshType;
      const id = widget.dataset.meshId;
      const theme = widget.dataset.meshTheme || "auto";
      const width = widget.dataset.meshWidth || "100%";

      const iframe = document.createElement("iframe");
      iframe.src = `${MESH_BASE_URL}/embed/${type}/${id}?theme=${theme}`;
      iframe.style.width = width;
      iframe.style.border = "1px solid #e5e7eb";
      iframe.style.borderRadius = "8px";
      iframe.frameBorder = "0";
      iframe.loading = "lazy";
      iframe.title = `Mesh ${type} widget`;

      // Set height based on type
      const heights = { stack: 400, evidence: 500, source: 150, health: 60 };
      iframe.style.height = `${heights[type] || 300}px`;

      // Listen for resize messages from iframe
      window.addEventListener("message", (event) => {
        if (event.origin !== MESH_BASE_URL) return;
        if (event.data.type === "mesh-resize" && event.data.widgetId === id) {
          iframe.style.height = `${event.data.height}px`;
        }
      });

      widget.appendChild(iframe);
    });
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMeshWidgets);
  } else {
    initMeshWidgets();
  }

  // Re-initialize on dynamic content (for SPAs)
  const observer = new MutationObserver(initMeshWidgets);
  observer.observe(document.body, { childList: true, subtree: true });
})();
```

### oEmbed Support

```typescript
// app/api/oembed/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const format = searchParams.get("format") || "json";
  const maxWidth = parseInt(searchParams.get("maxwidth") || "600", 10);
  const maxHeight = parseInt(searchParams.get("maxheight") || "400", 10);

  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  // Parse the embed URL
  const match = url.match(/\/embed\/(stack|evidence|source|health)\/([^?/]+)/);
  if (!match) {
    return NextResponse.json({ error: "Invalid embed URL" }, { status: 400 });
  }

  const [, type, id] = match;

  // Get metadata for the target
  const metadata = await getTargetMetadata(type, id);
  if (!metadata) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const heights: Record<string, number> = {
    stack: Math.min(400, maxHeight),
    evidence: Math.min(500, maxHeight),
    source: Math.min(150, maxHeight),
    health: Math.min(60, maxHeight),
  };

  const oembedResponse = {
    type: "rich",
    version: "1.0",
    title: metadata.title,
    author_name: metadata.author,
    author_url: metadata.authorUrl,
    provider_name: "Mesh",
    provider_url: "https://mesh.app",
    thumbnail_url: metadata.thumbnail,
    thumbnail_width: 300,
    thumbnail_height: 200,
    html: `<iframe src="${url}" width="${maxWidth}" height="${heights[type]}" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px;"></iframe>`,
    width: maxWidth,
    height: heights[type],
  };

  if (format === "xml") {
    // Return XML format
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<oembed>
  <type>${oembedResponse.type}</type>
  <version>${oembedResponse.version}</version>
  <title>${escapeXml(oembedResponse.title)}</title>
  <author_name>${escapeXml(oembedResponse.author_name)}</author_name>
  <provider_name>${oembedResponse.provider_name}</provider_name>
  <html>${escapeXml(oembedResponse.html)}</html>
  <width>${oembedResponse.width}</width>
  <height>${oembedResponse.height}</height>
</oembed>`;
    return new NextResponse(xml, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  return NextResponse.json(oembedResponse);
}

async function getTargetMetadata(type: string, id: string) {
  // Fetch metadata from database based on type
  // Return title, author, thumbnail, etc.
  return { title: "Example", author: "User", authorUrl: null, thumbnail: null };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Stack embed renders | Public stack → iframe shows grid |
| Evidence embed groups | Citations grouped by intent |
| Source card shows badge | Verification status visible |
| Script embed works | Add div + script → widget loads |
| oEmbed endpoint works | Request oEmbed → returns rich response |
| Theme switching | theme=dark → dark mode rendered |
| Private content blocked | Private stack → 404 |
| Responsive sizing | Width parameter respected |

---

## 3.2.4 Public Evidence API

**Priority**: P2 — Developer ecosystem  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low (read-only initially)

### Problem Statement

Power users, researchers, and third-party tools need programmatic access to:
- Search and retrieve sources
- Access citation networks
- Query evidence health metrics
- Export data in standard formats

**Goal**: RESTful API with authentication, rate limiting, and comprehensive documentation.

### API Design Principles

1. **REST + JSON** — Standard conventions, predictable URLs
2. **Versioned** — `/api/v1/` prefix for future compatibility
3. **Paginated** — Cursor-based pagination for large result sets
4. **Rate-limited** — Tiered limits (free/pro/partner)
5. **Documented** — OpenAPI spec, interactive explorer

### API Key Management Schema

```prisma
model ApiKey {
  id            String   @id @default(cuid())
  userId        String
  
  // Key details
  name          String   // User-provided name for the key
  keyHash       String   // SHA-256 hash of the key (never store plaintext)
  keyPrefix     String   // First 8 chars for identification (e.g., "mesh_pk_")
  
  // Permissions
  scopes        String[] // ["read:sources", "read:stacks", "write:sources"]
  
  // Rate limiting
  tier          ApiKeyTier @default(free)
  rateLimitOverride Int?  // Custom rate limit
  
  // Usage tracking
  lastUsedAt    DateTime?
  requestCount  Int      @default(0)
  
  // Status
  isActive      Boolean  @default(true)
  expiresAt     DateTime?
  revokedAt     DateTime?
  revokedReason String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          Profile  @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([keyHash])
  @@index([userId])
}

enum ApiKeyTier {
  free        // 100 requests/hour
  pro         // 1000 requests/hour
  partner     // 10000 requests/hour
  unlimited   // No limit
}
```

### API Key Generation

```typescript
// lib/api/keys.ts

import crypto from "crypto";
import { prisma } from "@/lib/prismaclient";

const KEY_PREFIX = "mesh_pk_";

export async function generateApiKey(
  userId: string,
  name: string,
  scopes: string[] = ["read:sources", "read:stacks"]
): Promise<{ key: string; keyId: string }> {
  // Generate a secure random key
  const randomPart = crypto.randomBytes(32).toString("base64url");
  const fullKey = `${KEY_PREFIX}${randomPart}`;
  
  // Hash for storage
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");
  
  // Create in database
  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash,
      keyPrefix: fullKey.slice(0, 12),
      scopes,
      tier: "free",
    },
  });

  // Return the full key only once (user must save it)
  return { key: fullKey, keyId: apiKey.id };
}

export async function validateApiKey(
  key: string
): Promise<{ valid: boolean; apiKey?: any; error?: string }> {
  if (!key.startsWith(KEY_PREFIX)) {
    return { valid: false, error: "Invalid key format" };
  }

  const keyHash = crypto.createHash("sha256").update(key).digest("hex");

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash },
    include: { user: { select: { id: true, username: true } } },
  });

  if (!apiKey) {
    return { valid: false, error: "Key not found" };
  }

  if (!apiKey.isActive) {
    return { valid: false, error: "Key is inactive" };
  }

  if (apiKey.revokedAt) {
    return { valid: false, error: "Key has been revoked" };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: "Key has expired" };
  }

  // Update usage stats
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date(),
      requestCount: { increment: 1 },
    },
  });

  return { valid: true, apiKey };
}
```

### Rate Limiting Middleware

```typescript
// lib/api/rateLimit.ts

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TIER_LIMITS: Record<string, { requests: number; window: number }> = {
  free: { requests: 100, window: 3600 },        // 100/hour
  pro: { requests: 1000, window: 3600 },        // 1000/hour
  partner: { requests: 10000, window: 3600 },   // 10000/hour
  unlimited: { requests: Infinity, window: 3600 },
};

export async function checkRateLimit(
  keyId: string,
  tier: string
): Promise<{
  allowed: boolean;
  remaining: number;
  reset: number;
}> {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  
  if (limits.requests === Infinity) {
    return { allowed: true, remaining: Infinity, reset: 0 };
  }

  const key = `ratelimit:api:${keyId}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % limits.window);
  const windowKey = `${key}:${windowStart}`;

  const current = await redis.incr(windowKey);
  
  if (current === 1) {
    await redis.expire(windowKey, limits.window);
  }

  const remaining = Math.max(0, limits.requests - current);
  const reset = windowStart + limits.window;

  return {
    allowed: current <= limits.requests,
    remaining,
    reset,
  };
}
```

### API Middleware

```typescript
// lib/api/middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "./keys";
import { checkRateLimit } from "./rateLimit";

export async function apiMiddleware(
  req: NextRequest,
  requiredScopes: string[] = []
): Promise<{ authorized: boolean; user?: any; error?: NextResponse }> {
  // Get API key from header
  const authHeader = req.headers.get("Authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  if (!apiKey) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: { code: "missing_api_key", message: "API key required" } },
        { status: 401, headers: apiHeaders() }
      ),
    };
  }

  // Validate key
  const validation = await validateApiKey(apiKey);
  if (!validation.valid) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: { code: "invalid_api_key", message: validation.error } },
        { status: 401, headers: apiHeaders() }
      ),
    };
  }

  const keyData = validation.apiKey!;

  // Check scopes
  for (const scope of requiredScopes) {
    if (!keyData.scopes.includes(scope)) {
      return {
        authorized: false,
        error: NextResponse.json(
          {
            error: {
              code: "insufficient_scope",
              message: `Required scope: ${scope}`,
            },
          },
          { status: 403, headers: apiHeaders() }
        ),
      };
    }
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(keyData.id, keyData.tier);
  if (!rateLimit.allowed) {
    return {
      authorized: false,
      error: NextResponse.json(
        {
          error: {
            code: "rate_limit_exceeded",
            message: "Rate limit exceeded",
          },
        },
        {
          status: 429,
          headers: {
            ...apiHeaders(),
            "X-RateLimit-Limit": String(TIER_LIMITS[keyData.tier].requests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.reset),
            "Retry-After": String(rateLimit.reset - Math.floor(Date.now() / 1000)),
          },
        }
      ),
    };
  }

  return {
    authorized: true,
    user: keyData.user,
  };
}

function apiHeaders() {
  return {
    "Content-Type": "application/json",
    "X-API-Version": "1",
  };
}
```

### Public API Endpoints

```typescript
// app/api/v1/sources/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { apiMiddleware } from "@/lib/api/middleware";

/**
 * @openapi
 * /api/v1/sources:
 *   get:
 *     summary: Search sources
 *     tags: [Sources]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         description: Search query
 *         schema:
 *           type: string
 *       - name: doi
 *         in: query
 *         description: Filter by DOI
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         description: Number of results (max 100)
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: cursor
 *         in: query
 *         description: Pagination cursor
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of sources
 */
export async function GET(req: NextRequest) {
  const auth = await apiMiddleware(req, ["read:sources"]);
  if (!auth.authorized) return auth.error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const doi = searchParams.get("doi");
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20", 10));
  const cursor = searchParams.get("cursor");

  const where: any = {};
  
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { abstract: { contains: q, mode: "insensitive" } },
    ];
  }
  
  if (doi) {
    where.doi = doi;
  }

  const sources = await prisma.source.findMany({
    where,
    take: limit + 1, // Fetch one extra to determine if there's more
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      authorsJson: true,
      year: true,
      doi: true,
      url: true,
      kind: true,
      verificationStatus: true,
      citationCount: true,
      isOpenAccess: true,
      createdAt: true,
    },
  });

  const hasMore = sources.length > limit;
  const results = hasMore ? sources.slice(0, -1) : sources;
  const nextCursor = hasMore ? results[results.length - 1].id : null;

  return NextResponse.json({
    data: results,
    pagination: {
      hasMore,
      nextCursor,
    },
  });
}
```

```typescript
// app/api/v1/sources/[sourceId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { apiMiddleware } from "@/lib/api/middleware";

/**
 * @openapi
 * /api/v1/sources/{sourceId}:
 *   get:
 *     summary: Get source by ID
 *     tags: [Sources]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: sourceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: include
 *         in: query
 *         description: Related data to include
 *         schema:
 *           type: string
 *           enum: [citations, reviews]
 *     responses:
 *       200:
 *         description: Source details
 *       404:
 *         description: Source not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sourceId: string } }
) {
  const auth = await apiMiddleware(req, ["read:sources"]);
  if (!auth.authorized) return auth.error;

  const { searchParams } = new URL(req.url);
  const include = searchParams.get("include")?.split(",") || [];

  const source = await prisma.source.findUnique({
    where: { id: params.sourceId },
    include: {
      ...(include.includes("citations") && {
        citations: {
          select: {
            id: true,
            targetType: true,
            targetId: true,
            intent: true,
            quote: true,
            locator: true,
          },
        },
      }),
      ...(include.includes("reviews") && {
        reviews: {
          select: {
            id: true,
            rigor: true,
            relevance: true,
            bias: true,
            createdAt: true,
          },
        },
      }),
    },
  });

  if (!source) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Source not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: source });
}
```

```typescript
// app/api/v1/stacks/[stackId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { apiMiddleware } from "@/lib/api/middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: { stackId: string } }
) {
  const auth = await apiMiddleware(req, ["read:stacks"]);
  if (!auth.authorized) return auth.error;

  const stack = await prisma.stack.findUnique({
    where: { id: params.stackId },
    include: {
      owner: { select: { id: true, username: true } },
      items: {
        orderBy: { position: "asc" },
        include: {
          // Block data based on type
        },
      },
      _count: { select: { items: true } },
    },
  });

  if (!stack) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Stack not found" } },
      { status: 404 }
    );
  }

  // Check visibility
  if (stack.visibility === "private" && stack.owner.id !== auth.user?.id) {
    return NextResponse.json(
      { error: { code: "forbidden", message: "Stack is private" } },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: stack });
}
```

### OpenAPI Specification

```typescript
// lib/api/openapi.ts

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Mesh Evidence API",
    version: "1.0.0",
    description: "API for accessing verified sources, stacks, and evidence.",
    contact: {
      name: "Mesh Support",
      email: "api@mesh.app",
    },
  },
  servers: [
    { url: "https://mesh.app/api/v1", description: "Production" },
    { url: "http://localhost:3000/api/v1", description: "Development" },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API Key",
        description: "API key obtained from Mesh settings",
      },
    },
    schemas: {
      Source: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          authorsJson: { type: "array", items: { type: "object" } },
          year: { type: "integer" },
          doi: { type: "string" },
          url: { type: "string" },
          kind: { type: "string" },
          verificationStatus: {
            type: "string",
            enum: ["unverified", "verified", "redirected", "unavailable", "broken", "paywalled"],
          },
          citationCount: { type: "integer" },
          isOpenAccess: { type: "boolean" },
        },
      },
      Stack: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          visibility: {
            type: "string",
            enum: ["private", "unlisted", "public", "collaborative"],
          },
          itemCount: { type: "integer" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/sources": {
      get: {
        summary: "Search sources",
        tags: ["Sources"],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "doi", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "List of sources" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/sources/{sourceId}": {
      get: {
        summary: "Get source by ID",
        tags: ["Sources"],
        parameters: [
          { name: "sourceId", in: "path", required: true, schema: { type: "string" } },
          { name: "include", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Source details" },
          "404": { description: "Not found" },
        },
      },
    },
  },
};
```

### API Documentation Page

```tsx
// app/developers/page.tsx

import { openApiSpec } from "@/lib/api/openapi";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function DevelopersPage() {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Mesh API Documentation</h1>
      
      <div className="prose mb-8">
        <h2>Getting Started</h2>
        <p>
          The Mesh API provides programmatic access to sources, stacks, and evidence data.
        </p>
        
        <h3>Authentication</h3>
        <p>
          All API requests require an API key. Generate one in your{" "}
          <a href="/settings/api">account settings</a>.
        </p>
        <pre>
          <code>
            curl -H "Authorization: Bearer mesh_pk_..." \
            https://mesh.app/api/v1/sources
          </code>
        </pre>
        
        <h3>Rate Limits</h3>
        <ul>
          <li>Free tier: 100 requests/hour</li>
          <li>Pro tier: 1,000 requests/hour</li>
          <li>Partner tier: 10,000 requests/hour</li>
        </ul>
      </div>

      <SwaggerUI spec={openApiSpec} />
    </div>
  );
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| API key generation | Generate key → returns mesh_pk_... |
| API key validation | Valid key → request succeeds |
| Invalid key rejected | Wrong key → 401 error |
| Rate limiting works | Exceed limit → 429 with Retry-After |
| Scope enforcement | Missing scope → 403 error |
| Sources search | Query → returns paginated results |
| Source by ID | Valid ID → returns full source |
| Cursor pagination | Use cursor → correct next page |
| OpenAPI spec valid | Swagger UI renders correctly |

---

## Phase 3.2 Completion Checklist

### Pre-Launch Requirements

| Item | Owner | Status |
|------|-------|--------|
| Semantic Scholar integration | Backend | ☐ |
| OpenAlex integration | Backend | ☐ |
| CrossRef integration | Backend | ☐ |
| PubMed integration (optional) | Backend | ☐ |
| arXiv integration (optional) | Backend | ☐ |
| Unified search API | Backend | ☐ |
| Source import API | Backend | ☐ |
| Academic search modal | Frontend | ☐ |
| Zotero connection | Backend | ☐ |
| Zotero sync worker | Backend | ☐ |
| Reference manager settings UI | Frontend | ☐ |
| Stack embed widget | Frontend | ☐ |
| Evidence embed widget | Frontend | ☐ |
| Source card embed | Frontend | ☐ |
| Embed script (embed.js) | Frontend | ☐ |
| oEmbed endpoint | Backend | ☐ |
| API key management | Backend | ☐ |
| Rate limiting | Backend | ☐ |
| Public API endpoints | Backend | ☐ |
| API documentation page | Frontend | ☐ |

### Testing Requirements

| Test Type | Coverage |
|-----------|----------|
| Unit tests | Database API response parsing |
| Unit tests | Zotero item mapping |
| Unit tests | API key validation |
| Integration tests | Academic search → import flow |
| Integration tests | Zotero sync round-trip |
| Integration tests | API authentication + rate limiting |
| E2E tests | Full import flow from search to stack |
| E2E tests | Embed widget rendering |

### External Dependencies

| Dependency | Required | Notes |
|------------|----------|-------|
| Semantic Scholar API | Recommended | Partner key for higher limits |
| OpenAlex API | No | Polite email header sufficient |
| CrossRef API | No | Polite pool sufficient |
| Zotero OAuth | For sync | Or API key authentication |
| Redis (Upstash) | Yes | For rate limiting |

---

**Estimated Phase 3.2 Duration**: 3-4 weeks

---
