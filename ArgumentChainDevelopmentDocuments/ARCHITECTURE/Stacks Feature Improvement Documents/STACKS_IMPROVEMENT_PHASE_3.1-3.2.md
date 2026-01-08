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

# Phase 3.3: Cross-Platform Intelligence

**Goal**: Leverage Mesh's unique position as the only platform tracking how sources are used across multiple deliberations, arguments, and contexts. Surface insights that no single-source tool can provide.

**Timeline**: Weeks 7-10

---

## 3.3.1 Cross-Deliberation Citation Tracking

**Priority**: P1 — Core differentiator  
**Estimated Effort**: 4-5 days  
**Risk Level**: Medium (requires denormalized aggregation)

### Problem Statement

When a source is cited in multiple deliberations:
- Users can't see where else it's being discussed
- There's no way to find related conversations using similar evidence
- Researchers miss opportunities to connect with others studying the same sources

**Goal**: Show users everywhere a source is being cited across the platform, enabling discovery of related deliberations and cross-pollination of ideas.

### Schema Additions

```prisma
model SourceUsage {
  id              String   @id @default(cuid())
  sourceId        String
  
  // Aggregated counts (denormalized for performance)
  totalCitations      Int      @default(0)
  deliberationCount   Int      @default(0)
  argumentCount       Int      @default(0)
  stackCount          Int      @default(0)
  
  // Intent breakdown
  supportCount        Int      @default(0)
  refuteCount         Int      @default(0)
  contextCount        Int      @default(0)
  
  // Unique users who have cited this source
  uniqueCiters        Int      @default(0)
  
  // Trending metrics
  citationsLast7Days  Int      @default(0)
  citationsLast30Days Int      @default(0)
  trendScore          Float    @default(0)
  
  // First and most recent usage
  firstCitedAt        DateTime?
  lastCitedAt         DateTime?
  
  updatedAt           DateTime @updatedAt
  
  source              Source   @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  
  @@unique([sourceId])
  @@index([trendScore])
  @@index([totalCitations])
}

model SourceCitationContext {
  id              String   @id @default(cuid())
  sourceId        String
  
  // Where it's cited
  deliberationId  String?
  argumentId      String?
  stackId         String?
  
  // Citation details
  citationId      String   @unique
  intent          CitationIntent
  quote           String?
  
  // Visibility (for filtering public contexts)
  isPublic        Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  
  source          Source       @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  deliberation    Deliberation? @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  citation        Citation     @relation(fields: [citationId], references: [id], onDelete: Cascade)
  
  @@index([sourceId, isPublic])
  @@index([deliberationId])
}
```

### Usage Aggregation Worker

```typescript
// workers/sourceUsageAggregator.ts

import { prisma } from "@/lib/prismaclient";
import { Job } from "bullmq";

interface AggregationJob {
  sourceId: string;
  triggeredBy: "citation_created" | "citation_deleted" | "scheduled";
}

export async function processSourceUsageAggregation(job: Job<AggregationJob>) {
  const { sourceId, triggeredBy } = job.data;

  console.log(`[SourceUsage] Aggregating usage for source ${sourceId} (${triggeredBy})`);

  // Get all citations for this source
  const citations = await prisma.citation.findMany({
    where: { sourceId },
    include: {
      // Get parent context visibility
    },
  });

  // Calculate aggregates
  const deliberationIds = new Set<string>();
  const argumentIds = new Set<string>();
  const stackIds = new Set<string>();
  const userIds = new Set<string>();

  let supportCount = 0;
  let refuteCount = 0;
  let contextCount = 0;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let citationsLast7Days = 0;
  let citationsLast30Days = 0;
  let firstCitedAt: Date | null = null;
  let lastCitedAt: Date | null = null;

  for (const citation of citations) {
    // Track unique contexts
    if (citation.deliberationId) deliberationIds.add(citation.deliberationId);
    if (citation.argumentId) argumentIds.add(citation.argumentId);
    if (citation.stackId) stackIds.add(citation.stackId);
    if (citation.createdBy) userIds.add(citation.createdBy);

    // Count by intent
    switch (citation.intent) {
      case "supports":
        supportCount++;
        break;
      case "refutes":
        refuteCount++;
        break;
      default:
        contextCount++;
    }

    // Time-based counts
    if (citation.createdAt >= sevenDaysAgo) citationsLast7Days++;
    if (citation.createdAt >= thirtyDaysAgo) citationsLast30Days++;

    // First/last tracking
    if (!firstCitedAt || citation.createdAt < firstCitedAt) {
      firstCitedAt = citation.createdAt;
    }
    if (!lastCitedAt || citation.createdAt > lastCitedAt) {
      lastCitedAt = citation.createdAt;
    }
  }

  // Calculate trend score (weighted recent activity)
  const trendScore = calculateTrendScore(
    citationsLast7Days,
    citationsLast30Days,
    citations.length
  );

  // Upsert usage record
  await prisma.sourceUsage.upsert({
    where: { sourceId },
    create: {
      sourceId,
      totalCitations: citations.length,
      deliberationCount: deliberationIds.size,
      argumentCount: argumentIds.size,
      stackCount: stackIds.size,
      uniqueCiters: userIds.size,
      supportCount,
      refuteCount,
      contextCount,
      citationsLast7Days,
      citationsLast30Days,
      trendScore,
      firstCitedAt,
      lastCitedAt,
    },
    update: {
      totalCitations: citations.length,
      deliberationCount: deliberationIds.size,
      argumentCount: argumentIds.size,
      stackCount: stackIds.size,
      uniqueCiters: userIds.size,
      supportCount,
      refuteCount,
      contextCount,
      citationsLast7Days,
      citationsLast30Days,
      trendScore,
      firstCitedAt,
      lastCitedAt,
    },
  });

  // Update citation contexts for discovery
  await updateCitationContexts(sourceId, citations);

  console.log(`[SourceUsage] Aggregated: ${citations.length} citations across ${deliberationIds.size} deliberations`);
}

function calculateTrendScore(
  last7Days: number,
  last30Days: number,
  total: number
): number {
  // Heavily weight recent activity
  // Score range: 0-100
  const recentWeight = 0.6;
  const monthWeight = 0.3;
  const totalWeight = 0.1;

  const recentScore = Math.min(100, last7Days * 10);
  const monthScore = Math.min(100, last30Days * 3);
  const totalScore = Math.min(100, Math.log10(total + 1) * 30);

  return (
    recentScore * recentWeight +
    monthScore * monthWeight +
    totalScore * totalWeight
  );
}

async function updateCitationContexts(sourceId: string, citations: any[]) {
  // Batch upsert citation contexts
  for (const citation of citations) {
    const isPublic = await checkContextVisibility(citation);

    await prisma.sourceCitationContext.upsert({
      where: { citationId: citation.id },
      create: {
        sourceId,
        citationId: citation.id,
        deliberationId: citation.deliberationId,
        argumentId: citation.argumentId,
        stackId: citation.stackId,
        intent: citation.intent,
        quote: citation.quote,
        isPublic,
      },
      update: {
        intent: citation.intent,
        quote: citation.quote,
        isPublic,
      },
    });
  }
}

async function checkContextVisibility(citation: any): Promise<boolean> {
  if (citation.deliberationId) {
    const deliberation = await prisma.deliberation.findUnique({
      where: { id: citation.deliberationId },
      select: { isPublic: true },
    });
    return deliberation?.isPublic ?? false;
  }
  if (citation.stackId) {
    const stack = await prisma.stack.findUnique({
      where: { id: citation.stackId },
      select: { visibility: true },
    });
    return stack?.visibility === "public";
  }
  return false;
}
```

### Citation Trigger

```typescript
// lib/triggers/citationTriggers.ts

import { sourceUsageQueue } from "@/workers/queues";

export async function onCitationCreated(citation: any) {
  await sourceUsageQueue.add(
    "aggregate-usage",
    {
      sourceId: citation.sourceId,
      triggeredBy: "citation_created",
    },
    {
      delay: 5000, // Debounce rapid citations
      jobId: `usage-${citation.sourceId}-${Date.now()}`,
    }
  );
}

export async function onCitationDeleted(citation: any) {
  await sourceUsageQueue.add(
    "aggregate-usage",
    {
      sourceId: citation.sourceId,
      triggeredBy: "citation_deleted",
    },
    {
      delay: 5000,
      jobId: `usage-${citation.sourceId}-${Date.now()}`,
    }
  );
}
```

### Cross-Citation Display Component

```tsx
// components/sources/SourceCrossReferences.tsx

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { IntentBadge } from "@/components/citations/IntentBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Zap, Layers } from "lucide-react";

interface SourceCrossReferencesProps {
  sourceId: string;
  currentDeliberationId?: string;
}

export function SourceCrossReferences({
  sourceId,
  currentDeliberationId,
}: SourceCrossReferencesProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["source-cross-refs", sourceId],
    queryFn: () =>
      fetch(`/api/sources/${sourceId}/cross-references`).then((r) => r.json()),
  });

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-gray-100 rounded" />;
  }

  if (!data || data.contexts.length === 0) {
    return null;
  }

  const otherContexts = data.contexts.filter(
    (c: any) => c.deliberationId !== currentDeliberationId
  );

  if (otherContexts.length === 0) {
    return null;
  }

  // Group by deliberation
  const byDeliberation = groupBy(otherContexts, "deliberationId");
  const deliberationIds = Object.keys(byDeliberation).filter(Boolean);

  return (
    <div className="border rounded-lg p-4 bg-blue-50/50">
      <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Also cited in {deliberationIds.length} other deliberation
        {deliberationIds.length !== 1 ? "s" : ""}
      </h4>

      <div className="space-y-2">
        {deliberationIds.slice(0, 5).map((delibId) => {
          const contexts = byDeliberation[delibId];
          const firstContext = contexts[0];

          return (
            <Link
              key={delibId}
              href={`/deliberations/${delibId}`}
              className="block p-2 bg-white rounded border hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">
                  {firstContext.deliberationTitle}
                </span>
                <div className="flex items-center gap-1">
                  {contexts.some((c: any) => c.intent === "supports") && (
                    <IntentBadge intent="supports" size="xs" />
                  )}
                  {contexts.some((c: any) => c.intent === "refutes") && (
                    <IntentBadge intent="refutes" size="xs" />
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {contexts.length} citation{contexts.length !== 1 ? "s" : ""}
              </span>
            </Link>
          );
        })}
      </div>

      {deliberationIds.length > 5 && (
        <Link
          href={`/sources/${sourceId}/references`}
          className="block mt-2 text-sm text-blue-600 hover:underline"
        >
          View all {deliberationIds.length} deliberations →
        </Link>
      )}
    </div>
  );
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const value = String(item[key] || "");
      if (!groups[value]) groups[value] = [];
      groups[value].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}
```

### API Endpoint

```typescript
// app/api/sources/[sourceId]/cross-references/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getServerSession } from "next-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { sourceId: string } }
) {
  const session = await getServerSession();

  // Get public contexts, plus private ones user has access to
  const contexts = await prisma.sourceCitationContext.findMany({
    where: {
      sourceId: params.sourceId,
      OR: [
        { isPublic: true },
        // Add user's private deliberations if authenticated
        ...(session?.user?.id
          ? [
              {
                deliberation: {
                  participants: {
                    some: { id: session.user.id },
                  },
                },
              },
            ]
          : []),
      ],
    },
    include: {
      deliberation: {
        select: {
          id: true,
          title: true,
          isPublic: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Get usage stats
  const usage = await prisma.sourceUsage.findUnique({
    where: { sourceId: params.sourceId },
  });

  return NextResponse.json({
    contexts: contexts.map((c) => ({
      id: c.id,
      deliberationId: c.deliberationId,
      deliberationTitle: c.deliberation?.title,
      intent: c.intent,
      quote: c.quote,
      createdAt: c.createdAt,
    })),
    usage: usage
      ? {
          totalCitations: usage.totalCitations,
          deliberationCount: usage.deliberationCount,
          supportCount: usage.supportCount,
          refuteCount: usage.refuteCount,
        }
      : null,
  });
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Usage aggregated on citation | Create citation → SourceUsage updated |
| Cross-references shown | Source in 2+ deliberations → shows list |
| Private filtered | Private deliberation → only visible to participants |
| Intent breakdown accurate | Mixed intents → correct counts |
| Trend score calculated | Recent citations → higher score |

---

## 3.3.2 Evidence Provenance Chains

**Priority**: P1 — Transparency and trust  
**Estimated Effort**: 4-5 days  
**Risk Level**: Medium (graph traversal complexity)

### Problem Statement

When evidence flows between deliberations:
- User A cites a source in Deliberation 1
- User B lifts that citation to their Stack
- User C imports from that Stack to Deliberation 2

There's no visibility into this provenance chain. Users can't see:
- Where evidence originally came from
- Who first introduced it to the platform
- How it has been used over time

**Goal**: Track and display the full provenance chain of every piece of evidence, from first import to current usage.

### Schema Additions

```prisma
model EvidenceProvenanceEvent {
  id              String   @id @default(cuid())
  
  // The source being tracked
  sourceId        String
  
  // Event type
  eventType       ProvenanceEventType
  
  // Actor
  actorId         String
  
  // Context: where did this happen?
  fromType        String?  // "external", "stack", "deliberation", "argument"
  fromId          String?
  toType          String?  // "stack", "deliberation", "argument", "citation"
  toId            String?
  
  // Additional metadata
  metadata        Json?    // { doi: "...", importSource: "semantic_scholar", etc. }
  
  createdAt       DateTime @default(now())
  
  source          Source   @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  actor           Profile  @relation(fields: [actorId], references: [id], onDelete: Cascade)
  
  @@index([sourceId, createdAt])
  @@index([actorId])
}

enum ProvenanceEventType {
  imported           // First import to platform (from DOI, URL, etc.)
  cited              // Attached to argument/claim
  lifted_to_stack    // Lifted from citation to stack
  imported_from_stack // Imported from someone else's stack
  forked             // Stack containing this source was forked
  shared             // Shared via direct link
  exported           // Exported to reference manager
}
```

### Provenance Event Recording

```typescript
// lib/provenance/recorder.ts

import { prisma } from "@/lib/prismaclient";
import { ProvenanceEventType } from "@prisma/client";

interface RecordProvenanceOptions {
  sourceId: string;
  eventType: ProvenanceEventType;
  actorId: string;
  fromType?: string;
  fromId?: string;
  toType?: string;
  toId?: string;
  metadata?: Record<string, any>;
}

export async function recordProvenanceEvent(
  options: RecordProvenanceOptions
): Promise<void> {
  const {
    sourceId,
    eventType,
    actorId,
    fromType,
    fromId,
    toType,
    toId,
    metadata,
  } = options;

  await prisma.evidenceProvenanceEvent.create({
    data: {
      sourceId,
      eventType,
      actorId,
      fromType,
      fromId,
      toType,
      toId,
      metadata: metadata || undefined,
    },
  });

  console.log(`[Provenance] Recorded ${eventType} for source ${sourceId}`);
}

// Helper functions for common events
export async function recordSourceImport(
  sourceId: string,
  actorId: string,
  importSource: string,
  metadata?: Record<string, any>
) {
  await recordProvenanceEvent({
    sourceId,
    eventType: "imported",
    actorId,
    fromType: "external",
    fromId: importSource,
    metadata: { importSource, ...metadata },
  });
}

export async function recordCitation(
  sourceId: string,
  actorId: string,
  targetType: string,
  targetId: string
) {
  await recordProvenanceEvent({
    sourceId,
    eventType: "cited",
    actorId,
    toType: targetType,
    toId: targetId,
  });
}

export async function recordLiftToStack(
  sourceId: string,
  actorId: string,
  citationId: string,
  stackId: string
) {
  await recordProvenanceEvent({
    sourceId,
    eventType: "lifted_to_stack",
    actorId,
    fromType: "citation",
    fromId: citationId,
    toType: "stack",
    toId: stackId,
  });
}

export async function recordStackImport(
  sourceId: string,
  actorId: string,
  fromStackId: string,
  toStackId: string
) {
  await recordProvenanceEvent({
    sourceId,
    eventType: "imported_from_stack",
    actorId,
    fromType: "stack",
    fromId: fromStackId,
    toType: "stack",
    toId: toStackId,
  });
}

export async function recordStackFork(
  sourceId: string,
  actorId: string,
  originalStackId: string,
  forkedStackId: string
) {
  await recordProvenanceEvent({
    sourceId,
    eventType: "forked",
    actorId,
    fromType: "stack",
    fromId: originalStackId,
    toType: "stack",
    toId: forkedStackId,
  });
}
```

### Provenance Chain Builder

```typescript
// lib/provenance/chainBuilder.ts

import { prisma } from "@/lib/prismaclient";

interface ProvenanceNode {
  id: string;
  eventType: string;
  actor: {
    id: string;
    username: string;
    avatar?: string;
  };
  context?: {
    type: string;
    id: string;
    title?: string;
  };
  timestamp: Date;
  children?: ProvenanceNode[];
}

export async function buildProvenanceChain(
  sourceId: string
): Promise<ProvenanceNode[]> {
  // Get all events for this source, ordered chronologically
  const events = await prisma.evidenceProvenanceEvent.findMany({
    where: { sourceId },
    include: {
      actor: {
        select: { id: true, username: true, avatar: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (events.length === 0) return [];

  // Build linear chain with context enrichment
  const chain: ProvenanceNode[] = [];

  for (const event of events) {
    const context = await getEventContext(event);

    chain.push({
      id: event.id,
      eventType: event.eventType,
      actor: event.actor,
      context,
      timestamp: event.createdAt,
    });
  }

  return chain;
}

async function getEventContext(event: any): Promise<ProvenanceNode["context"]> {
  const type = event.toType || event.fromType;
  const id = event.toId || event.fromId;

  if (!type || !id) return undefined;

  switch (type) {
    case "deliberation":
      const delib = await prisma.deliberation.findUnique({
        where: { id },
        select: { title: true },
      });
      return { type, id, title: delib?.title };

    case "stack":
      const stack = await prisma.stack.findUnique({
        where: { id },
        select: { name: true },
      });
      return { type, id, title: stack?.name };

    case "argument":
      const arg = await prisma.argument.findUnique({
        where: { id },
        select: { conclusion: true },
      });
      return { type, id, title: arg?.conclusion?.slice(0, 50) };

    default:
      return { type, id };
  }
}

export async function getSourceOrigin(sourceId: string): Promise<{
  firstImporter: { id: string; username: string } | null;
  importDate: Date | null;
  importSource: string | null;
}> {
  const firstEvent = await prisma.evidenceProvenanceEvent.findFirst({
    where: {
      sourceId,
      eventType: "imported",
    },
    include: {
      actor: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!firstEvent) {
    return { firstImporter: null, importDate: null, importSource: null };
  }

  return {
    firstImporter: firstEvent.actor,
    importDate: firstEvent.createdAt,
    importSource: (firstEvent.metadata as any)?.importSource || null,
  };
}
```

### Provenance Timeline Component

```tsx
// components/sources/ProvenanceTimeline.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Download,
  Quote,
  ArrowUpRight,
  GitFork,
  Share2,
  Upload,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface ProvenanceTimelineProps {
  sourceId: string;
  maxEvents?: number;
}

const EVENT_ICONS: Record<string, any> = {
  imported: Download,
  cited: Quote,
  lifted_to_stack: ArrowUpRight,
  imported_from_stack: Download,
  forked: GitFork,
  shared: Share2,
  exported: Upload,
};

const EVENT_LABELS: Record<string, string> = {
  imported: "imported this source",
  cited: "cited in",
  lifted_to_stack: "lifted to stack",
  imported_from_stack: "imported from stack",
  forked: "forked stack containing this",
  shared: "shared",
  exported: "exported to reference manager",
};

export function ProvenanceTimeline({
  sourceId,
  maxEvents = 10,
}: ProvenanceTimelineProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["source-provenance", sourceId],
    queryFn: () =>
      fetch(`/api/sources/${sourceId}/provenance`).then((r) => r.json()),
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded" />;
  }

  if (!data?.chain || data.chain.length === 0) {
    return null;
  }

  const events = data.chain.slice(0, maxEvents);
  const hasMore = data.chain.length > maxEvents;

  return (
    <div className="border rounded-lg p-4">
      <h4 className="text-sm font-medium mb-4">Evidence History</h4>

      <div className="space-y-4">
        {events.map((event: any, index: number) => {
          const Icon = EVENT_ICONS[event.eventType] || Quote;
          const isFirst = index === 0;

          return (
            <div key={event.id} className="flex gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isFirst ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {index < events.length - 1 && (
                  <div className="w-px h-full bg-gray-200 my-1" />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Avatar
                    src={event.actor.avatar}
                    alt={event.actor.username}
                    size="xs"
                  />
                  <Link
                    href={`/users/${event.actor.username}`}
                    className="font-medium hover:underline"
                  >
                    {event.actor.username}
                  </Link>
                  <span className="text-gray-600">
                    {EVENT_LABELS[event.eventType]}
                  </span>
                </div>

                {event.context && (
                  <Link
                    href={getContextLink(event.context)}
                    className="text-sm text-blue-600 hover:underline mt-1 block"
                  >
                    {event.context.title || event.context.id}
                  </Link>
                )}

                <span className="text-xs text-gray-500 mt-1 block">
                  {formatDistanceToNow(new Date(event.timestamp), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <Link
          href={`/sources/${sourceId}/history`}
          className="text-sm text-blue-600 hover:underline mt-2 block"
        >
          View full history ({data.chain.length} events) →
        </Link>
      )}
    </div>
  );
}

function getContextLink(context: { type: string; id: string }): string {
  switch (context.type) {
    case "deliberation":
      return `/deliberations/${context.id}`;
    case "stack":
      return `/stacks/${context.id}`;
    case "argument":
      return `/arguments/${context.id}`;
    default:
      return "#";
  }
}
```

### Provenance API Endpoint

```typescript
// app/api/sources/[sourceId]/provenance/route.ts

import { NextRequest, NextResponse } from "next/server";
import { buildProvenanceChain, getSourceOrigin } from "@/lib/provenance/chainBuilder";

export async function GET(
  req: NextRequest,
  { params }: { params: { sourceId: string } }
) {
  const chain = await buildProvenanceChain(params.sourceId);
  const origin = await getSourceOrigin(params.sourceId);

  return NextResponse.json({
    chain,
    origin,
    totalEvents: chain.length,
  });
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Import recorded | Add source via DOI → provenance event created |
| Citation recorded | Cite source → event with context |
| Lift recorded | Lift to stack → chain updated |
| Chain displays | View source → timeline shows history |
| Origin attribution | First importer credited |
| Context links work | Click event → navigates to context |

---

## 3.3.3 "Hot Sources" Trending

**Priority**: P2 — Discovery and engagement  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low (read-only analytics)

### Problem Statement

Users don't know what evidence is gaining traction across the platform:
- Which sources are being cited most right now?
- What topics are generating the most evidentiary debate?
- Where is the most active research happening?

**Goal**: Surface trending sources, topics, and deliberations based on citation activity, enabling users to discover active conversations and relevant evidence.

### Trending Calculation Schema

```prisma
model TrendingSnapshot {
  id            String   @id @default(cuid())
  
  // Snapshot timing
  snapshotType  TrendingSnapshotType
  periodStart   DateTime
  periodEnd     DateTime
  
  // Ranking data (stored as JSON for flexibility)
  sourcesRanking    Json  // [{ sourceId, score, citations, deliberations }]
  topicsRanking     Json  // [{ topic, score, sourceCount, citationCount }]
  deliberationsRanking Json // [{ deliberationId, score, newCitations }]
  
  // Metadata
  totalCitations    Int
  totalSources      Int
  computedAt        DateTime @default(now())
  
  @@index([snapshotType, periodEnd])
}

enum TrendingSnapshotType {
  hourly
  daily
  weekly
}

// Add to Source model
model Source {
  // ... existing fields ...
  
  // Trending metadata (updated by worker)
  trendingScore     Float?
  trendingRank      Int?
  lastTrendingUpdate DateTime?
}
```

### Trending Computation Worker

```typescript
// workers/trendingComputation.ts

import { prisma } from "@/lib/prismaclient";
import { Job } from "bullmq";

interface TrendingJob {
  snapshotType: "hourly" | "daily" | "weekly";
}

export async function computeTrendingSnapshot(job: Job<TrendingJob>) {
  const { snapshotType } = job.data;

  const now = new Date();
  const periodStart = getPeriodStart(now, snapshotType);
  const periodEnd = now;

  console.log(`[Trending] Computing ${snapshotType} snapshot: ${periodStart} to ${periodEnd}`);

  // Get all citations in the period
  const recentCitations = await prisma.citation.findMany({
    where: {
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          topics: true,
        },
      },
    },
  });

  // Calculate source rankings
  const sourceScores = calculateSourceScores(recentCitations, snapshotType);
  const sourcesRanking = Array.from(sourceScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 100)
    .map(([sourceId, data], index) => ({
      sourceId,
      rank: index + 1,
      score: data.score,
      citations: data.citations,
      deliberations: data.deliberations,
      intents: data.intents,
    }));

  // Calculate topic rankings
  const topicScores = calculateTopicScores(recentCitations);
  const topicsRanking = Array.from(topicScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 50)
    .map(([topic, data], index) => ({
      topic,
      rank: index + 1,
      score: data.score,
      sourceCount: data.sources.size,
      citationCount: data.citations,
    }));

  // Calculate deliberation rankings (most active)
  const deliberationScores = calculateDeliberationScores(recentCitations);
  const deliberationsRanking = Array.from(deliberationScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 50)
    .map(([deliberationId, data], index) => ({
      deliberationId,
      rank: index + 1,
      score: data.score,
      newCitations: data.citations,
      uniqueSources: data.sources.size,
    }));

  // Save snapshot
  await prisma.trendingSnapshot.create({
    data: {
      snapshotType,
      periodStart,
      periodEnd,
      sourcesRanking,
      topicsRanking,
      deliberationsRanking,
      totalCitations: recentCitations.length,
      totalSources: sourceScores.size,
    },
  });

  // Update source trending scores for top sources
  for (const source of sourcesRanking.slice(0, 50)) {
    await prisma.source.update({
      where: { id: source.sourceId },
      data: {
        trendingScore: source.score,
        trendingRank: source.rank,
        lastTrendingUpdate: now,
      },
    });
  }

  console.log(`[Trending] Computed: ${sourcesRanking.length} sources, ${topicsRanking.length} topics`);
}

function getPeriodStart(now: Date, type: string): Date {
  const ms = now.getTime();
  switch (type) {
    case "hourly":
      return new Date(ms - 60 * 60 * 1000);
    case "daily":
      return new Date(ms - 24 * 60 * 60 * 1000);
    case "weekly":
      return new Date(ms - 7 * 24 * 60 * 60 * 1000);
    default:
      return new Date(ms - 24 * 60 * 60 * 1000);
  }
}

interface ScoreData {
  score: number;
  citations: number;
  deliberations: Set<string>;
  intents: { supports: number; refutes: number; context: number };
}

function calculateSourceScores(
  citations: any[],
  snapshotType: string
): Map<string, ScoreData> {
  const scores = new Map<string, ScoreData>();

  // Decay factor based on recency
  const decayHalfLife = snapshotType === "hourly" ? 0.5 : snapshotType === "daily" ? 6 : 24;

  for (const citation of citations) {
    const sourceId = citation.sourceId;
    const hoursAgo = (Date.now() - citation.createdAt.getTime()) / (1000 * 60 * 60);
    const recencyWeight = Math.pow(0.5, hoursAgo / decayHalfLife);

    if (!scores.has(sourceId)) {
      scores.set(sourceId, {
        score: 0,
        citations: 0,
        deliberations: new Set(),
        intents: { supports: 0, refutes: 0, context: 0 },
      });
    }

    const data = scores.get(sourceId)!;
    data.citations++;
    data.score += recencyWeight;

    if (citation.deliberationId) {
      data.deliberations.add(citation.deliberationId);
    }

    // Track intents
    if (citation.intent === "supports") data.intents.supports++;
    else if (citation.intent === "refutes") data.intents.refutes++;
    else data.intents.context++;
  }

  // Bonus for cross-deliberation usage
  for (const [, data] of scores) {
    const crossDelibBonus = Math.log2(data.deliberations.size + 1) * 2;
    data.score += crossDelibBonus;
  }

  return scores;
}

function calculateTopicScores(citations: any[]): Map<string, any> {
  const scores = new Map<string, { score: number; citations: number; sources: Set<string> }>();

  for (const citation of citations) {
    const topics = (citation.source?.topics as string[]) || [];

    for (const topic of topics) {
      if (!scores.has(topic)) {
        scores.set(topic, { score: 0, citations: 0, sources: new Set() });
      }

      const data = scores.get(topic)!;
      data.citations++;
      data.score++;
      data.sources.add(citation.sourceId);
    }
  }

  // Bonus for topic diversity (many different sources)
  for (const [, data] of scores) {
    data.score += Math.log2(data.sources.size + 1) * 3;
  }

  return scores;
}

function calculateDeliberationScores(citations: any[]): Map<string, any> {
  const scores = new Map<string, { score: number; citations: number; sources: Set<string> }>();

  for (const citation of citations) {
    if (!citation.deliberationId) continue;

    const delibId = citation.deliberationId;

    if (!scores.has(delibId)) {
      scores.set(delibId, { score: 0, citations: 0, sources: new Set() });
    }

    const data = scores.get(delibId)!;
    data.citations++;
    data.score++;
    data.sources.add(citation.sourceId);
  }

  return scores;
}
```

### Trending Cron Schedule

```typescript
// app/api/_cron/trending/route.ts

import { NextRequest, NextResponse } from "next/server";
import { trendingQueue } from "@/workers/queues";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "hourly";

  await trendingQueue.add("compute-trending", { snapshotType: type });

  return NextResponse.json({ queued: true, type });
}

// Schedule in vercel.json or cron config:
// - Hourly: every hour
// - Daily: every day at midnight
// - Weekly: every Sunday at midnight
```

### Trending API Endpoints

```typescript
// app/api/trending/sources/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "daily";
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));

  // Get latest snapshot for this period
  const snapshot = await prisma.trendingSnapshot.findFirst({
    where: { snapshotType: period as any },
    orderBy: { periodEnd: "desc" },
  });

  if (!snapshot) {
    return NextResponse.json({ sources: [], period, computed: null });
  }

  const rankings = (snapshot.sourcesRanking as any[]).slice(0, limit);

  // Enrich with source details
  const sourceIds = rankings.map((r) => r.sourceId);
  const sources = await prisma.source.findMany({
    where: { id: { in: sourceIds } },
    select: {
      id: true,
      title: true,
      authorsJson: true,
      year: true,
      doi: true,
      verificationStatus: true,
    },
  });

  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  const enrichedRankings = rankings.map((r) => ({
    ...r,
    source: sourceMap.get(r.sourceId),
  }));

  return NextResponse.json({
    sources: enrichedRankings,
    period,
    computedAt: snapshot.computedAt,
    periodStart: snapshot.periodStart,
    periodEnd: snapshot.periodEnd,
  });
}
```

```typescript
// app/api/trending/topics/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "daily";
  const limit = Math.min(30, parseInt(searchParams.get("limit") || "15", 10));

  const snapshot = await prisma.trendingSnapshot.findFirst({
    where: { snapshotType: period as any },
    orderBy: { periodEnd: "desc" },
  });

  if (!snapshot) {
    return NextResponse.json({ topics: [], period, computed: null });
  }

  const topics = (snapshot.topicsRanking as any[]).slice(0, limit);

  return NextResponse.json({
    topics,
    period,
    computedAt: snapshot.computedAt,
  });
}
```

### Trending Display Components

```tsx
// components/trending/TrendingSources.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { TrendingUp, Flame, MessageSquare } from "lucide-react";
import { VerificationBadge } from "@/components/sources/VerificationBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TrendingSourcesProps {
  limit?: number;
  showTabs?: boolean;
}

export function TrendingSources({ limit = 10, showTabs = true }: TrendingSourcesProps) {
  const [period, setPeriod] = useState<string>("daily");

  const { data, isLoading } = useQuery({
    queryKey: ["trending-sources", period, limit],
    queryFn: () =>
      fetch(`/api/trending/sources?period=${period}&limit=${limit}`).then((r) =>
        r.json()
      ),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return <TrendingSourcesSkeleton count={limit} />;
  }

  const sources = data?.sources || [];

  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Trending Sources
        </h3>

        {showTabs && (
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="h-8">
              <TabsTrigger value="hourly" className="text-xs px-2">
                Hour
              </TabsTrigger>
              <TabsTrigger value="daily" className="text-xs px-2">
                Day
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-2">
                Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <div className="divide-y">
        {sources.map((item: any, index: number) => (
          <div
            key={item.sourceId}
            className="p-3 flex items-start gap-3 hover:bg-gray-50"
          >
            {/* Rank badge */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index < 3
                  ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <Link
                href={`/sources/${item.sourceId}`}
                className="text-sm font-medium hover:underline line-clamp-2"
              >
                {item.source?.title || "Unknown Source"}
              </Link>

              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {item.citations} citations
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {item.deliberations} deliberations
                </span>
              </div>

              {/* Intent breakdown */}
              {item.intents && (
                <div className="flex items-center gap-2 mt-1">
                  {item.intents.supports > 0 && (
                    <span className="text-xs text-green-600">
                      +{item.intents.supports}
                    </span>
                  )}
                  {item.intents.refutes > 0 && (
                    <span className="text-xs text-red-600">
                      −{item.intents.refutes}
                    </span>
                  )}
                </div>
              )}
            </div>

            <VerificationBadge
              status={item.source?.verificationStatus}
              size="sm"
            />
          </div>
        ))}
      </div>

      <Link
        href="/trending"
        className="block p-3 text-center text-sm text-blue-600 hover:bg-gray-50 border-t"
      >
        View all trending →
      </Link>
    </div>
  );
}

function TrendingSourcesSkeleton({ count }: { count: number }) {
  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="divide-y">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-3 flex gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// components/trending/TrendingTopics.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Hash } from "lucide-react";

export function TrendingTopics({ limit = 10 }: { limit?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["trending-topics", limit],
    queryFn: () =>
      fetch(`/api/trending/topics?limit=${limit}`).then((r) => r.json()),
  });

  if (isLoading) {
    return <div className="animate-pulse h-40 bg-gray-100 rounded" />;
  }

  const topics = data?.topics || [];

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium mb-3 flex items-center gap-2">
        <Hash className="h-4 w-4" />
        Trending Topics
      </h3>

      <div className="flex flex-wrap gap-2">
        {topics.map((topic: any) => (
          <Link
            key={topic.topic}
            href={`/search?topic=${encodeURIComponent(topic.topic)}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
          >
            <span>{topic.topic}</span>
            <span className="text-xs text-gray-500">
              {topic.citationCount}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Hourly snapshot computed | Cron runs → snapshot created |
| Daily snapshot computed | Cron runs → snapshot created |
| Source ranking accurate | More citations → higher rank |
| Recency weighting works | Recent citations weighted higher |
| Cross-delib bonus applied | Sources in multiple deliberations boosted |
| Topic trending works | Active topics appear in ranking |
| API returns ranked sources | Request → ordered by score |
| UI displays trends | Component shows ranked list |

---

## 3.3.4 Citation Network Analysis

**Priority**: P2 — Deep research insights  
**Estimated Effort**: 5-6 days  
**Risk Level**: Medium (graph computation complexity)

### Problem Statement

Researchers want to understand how sources relate to each other:
- Which sources are frequently cited together?
- What are the foundational sources that many others build on?
- Are there citation clusters around specific topics or viewpoints?

**Goal**: Build and visualize citation networks showing relationships between sources based on co-citation patterns and citation flows.

### Schema Additions

```prisma
model SourceRelationship {
  id              String   @id @default(cuid())
  
  // Related sources
  sourceAId       String
  sourceBId       String
  
  // Relationship metrics
  coCitationCount     Int      @default(0)  // Times cited together
  coCitationScore     Float    @default(0)  // Normalized score
  
  // Context where they're co-cited
  sharedDeliberations Int      @default(0)
  sharedArguments     Int      @default(0)
  
  // Relationship type
  relationshipType    SourceRelationshipType?
  
  // Last computation
  computedAt      DateTime @default(now())
  
  sourceA         Source   @relation("SourceRelationA", fields: [sourceAId], references: [id], onDelete: Cascade)
  sourceB         Source   @relation("SourceRelationB", fields: [sourceBId], references: [id], onDelete: Cascade)
  
  @@unique([sourceAId, sourceBId])
  @@index([sourceAId, coCitationScore])
  @@index([sourceBId, coCitationScore])
}

enum SourceRelationshipType {
  co_cited        // Frequently cited together
  builds_on       // Source B builds on Source A
  contradicts     // Sources are used in opposing arguments
  methodology     // Shared methodology reference
}

model CitationCluster {
  id              String   @id @default(cuid())
  
  // Cluster metadata
  name            String?
  topic           String?
  
  // Member sources
  sourceIds       String[]
  
  // Cluster metrics
  cohesion        Float    @default(0)  // Internal connectivity
  size            Int      @default(0)
  
  // Representative source (most connected)
  centroidSourceId String?
  
  computedAt      DateTime @default(now())
  
  @@index([topic])
}
```

### Co-Citation Computation Worker

```typescript
// workers/coCitationAnalysis.ts

import { prisma } from "@/lib/prismaclient";
import { Job } from "bullmq";

export async function computeCoCitations(job: Job) {
  console.log("[CoCitation] Starting co-citation analysis...");

  // Get all deliberations with multiple citations
  const deliberationsWithCitations = await prisma.deliberation.findMany({
    where: {
      citations: {
        some: {},
      },
    },
    select: {
      id: true,
      citations: {
        select: {
          sourceId: true,
          intent: true,
        },
      },
    },
  });

  // Also check arguments with multiple citations
  const argumentsWithCitations = await prisma.argument.findMany({
    where: {
      citations: {
        some: {},
      },
    },
    select: {
      id: true,
      citations: {
        select: {
          sourceId: true,
          intent: true,
        },
      },
    },
  });

  // Build co-citation pairs
  const coCitations = new Map<string, CoCitationData>();

  // Process deliberation co-citations
  for (const delib of deliberationsWithCitations) {
    const sourceIds = [...new Set(delib.citations.map((c) => c.sourceId))];
    if (sourceIds.length < 2) continue;

    // Generate pairs
    for (let i = 0; i < sourceIds.length; i++) {
      for (let j = i + 1; j < sourceIds.length; j++) {
        const pairKey = makePairKey(sourceIds[i], sourceIds[j]);
        
        if (!coCitations.has(pairKey)) {
          coCitations.set(pairKey, {
            sourceAId: sourceIds[i] < sourceIds[j] ? sourceIds[i] : sourceIds[j],
            sourceBId: sourceIds[i] < sourceIds[j] ? sourceIds[j] : sourceIds[i],
            count: 0,
            deliberations: new Set(),
            arguments: new Set(),
          });
        }

        const data = coCitations.get(pairKey)!;
        data.count++;
        data.deliberations.add(delib.id);
      }
    }
  }

  // Process argument co-citations
  for (const arg of argumentsWithCitations) {
    const sourceIds = [...new Set(arg.citations.map((c) => c.sourceId))];
    if (sourceIds.length < 2) continue;

    for (let i = 0; i < sourceIds.length; i++) {
      for (let j = i + 1; j < sourceIds.length; j++) {
        const pairKey = makePairKey(sourceIds[i], sourceIds[j]);
        
        if (!coCitations.has(pairKey)) {
          coCitations.set(pairKey, {
            sourceAId: sourceIds[i] < sourceIds[j] ? sourceIds[i] : sourceIds[j],
            sourceBId: sourceIds[i] < sourceIds[j] ? sourceIds[j] : sourceIds[i],
            count: 0,
            deliberations: new Set(),
            arguments: new Set(),
          });
        }

        const data = coCitations.get(pairKey)!;
        data.count++;
        data.arguments.add(arg.id);
      }
    }
  }

  // Calculate normalized scores and upsert
  const maxCount = Math.max(...Array.from(coCitations.values()).map((d) => d.count));

  for (const [, data] of coCitations) {
    const normalizedScore = data.count / maxCount;

    await prisma.sourceRelationship.upsert({
      where: {
        sourceAId_sourceBId: {
          sourceAId: data.sourceAId,
          sourceBId: data.sourceBId,
        },
      },
      create: {
        sourceAId: data.sourceAId,
        sourceBId: data.sourceBId,
        coCitationCount: data.count,
        coCitationScore: normalizedScore,
        sharedDeliberations: data.deliberations.size,
        sharedArguments: data.arguments.size,
        relationshipType: "co_cited",
      },
      update: {
        coCitationCount: data.count,
        coCitationScore: normalizedScore,
        sharedDeliberations: data.deliberations.size,
        sharedArguments: data.arguments.size,
        computedAt: new Date(),
      },
    });
  }

  console.log(`[CoCitation] Processed ${coCitations.size} co-citation pairs`);
}

interface CoCitationData {
  sourceAId: string;
  sourceBId: string;
  count: number;
  deliberations: Set<string>;
  arguments: Set<string>;
}

function makePairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}
```

### Citation Network Builder

```typescript
// lib/citationNetwork/networkBuilder.ts

import { prisma } from "@/lib/prismaclient";

interface NetworkNode {
  id: string;
  title: string;
  citationCount: number;
  degree: number;  // Number of connections
  cluster?: string;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  sharedContexts: number;
}

interface CitationNetwork {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  stats: {
    nodeCount: number;
    edgeCount: number;
    density: number;
    avgDegree: number;
  };
}

export async function buildCitationNetwork(options: {
  sourceId?: string;
  deliberationId?: string;
  topic?: string;
  minCoCitations?: number;
  maxNodes?: number;
}): Promise<CitationNetwork> {
  const {
    sourceId,
    deliberationId,
    topic,
    minCoCitations = 2,
    maxNodes = 100,
  } = options;

  // Build WHERE clause based on options
  let sourceFilter: any = {};

  if (sourceId) {
    // Get network centered on a specific source
    const relationships = await prisma.sourceRelationship.findMany({
      where: {
        OR: [{ sourceAId: sourceId }, { sourceBId: sourceId }],
        coCitationCount: { gte: minCoCitations },
      },
      orderBy: { coCitationScore: "desc" },
      take: maxNodes,
    });

    const relatedSourceIds = new Set<string>();
    relatedSourceIds.add(sourceId);

    for (const rel of relationships) {
      relatedSourceIds.add(rel.sourceAId);
      relatedSourceIds.add(rel.sourceBId);
    }

    sourceFilter = { id: { in: Array.from(relatedSourceIds) } };
  } else if (deliberationId) {
    // Get network for a deliberation's sources
    const citations = await prisma.citation.findMany({
      where: { deliberationId },
      select: { sourceId: true },
    });
    sourceFilter = { id: { in: citations.map((c) => c.sourceId) } };
  } else if (topic) {
    // Get network for a topic
    sourceFilter = { topics: { has: topic } };
  }

  // Fetch sources
  const sources = await prisma.source.findMany({
    where: sourceFilter,
    select: {
      id: true,
      title: true,
      _count: { select: { citations: true } },
    },
    take: maxNodes,
  });

  const sourceIds = sources.map((s) => s.id);

  // Fetch relationships between these sources
  const relationships = await prisma.sourceRelationship.findMany({
    where: {
      sourceAId: { in: sourceIds },
      sourceBId: { in: sourceIds },
      coCitationCount: { gte: minCoCitations },
    },
  });

  // Build nodes
  const degreeMap = new Map<string, number>();
  for (const rel of relationships) {
    degreeMap.set(rel.sourceAId, (degreeMap.get(rel.sourceAId) || 0) + 1);
    degreeMap.set(rel.sourceBId, (degreeMap.get(rel.sourceBId) || 0) + 1);
  }

  const nodes: NetworkNode[] = sources.map((s) => ({
    id: s.id,
    title: s.title,
    citationCount: s._count.citations,
    degree: degreeMap.get(s.id) || 0,
  }));

  // Build edges
  const edges: NetworkEdge[] = relationships.map((r) => ({
    source: r.sourceAId,
    target: r.sourceBId,
    weight: r.coCitationScore,
    sharedContexts: r.sharedDeliberations + r.sharedArguments,
  }));

  // Calculate network stats
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const maxEdges = (nodeCount * (nodeCount - 1)) / 2;
  const density = maxEdges > 0 ? edgeCount / maxEdges : 0;
  const avgDegree = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;

  return {
    nodes,
    edges,
    stats: {
      nodeCount,
      edgeCount,
      density,
      avgDegree,
    },
  };
}

export async function getRelatedSources(
  sourceId: string,
  limit: number = 10
): Promise<Array<{ source: any; score: number; sharedContexts: number }>> {
  const relationships = await prisma.sourceRelationship.findMany({
    where: {
      OR: [{ sourceAId: sourceId }, { sourceBId: sourceId }],
    },
    orderBy: { coCitationScore: "desc" },
    take: limit,
  });

  const relatedIds = relationships.map((r) =>
    r.sourceAId === sourceId ? r.sourceBId : r.sourceAId
  );

  const sources = await prisma.source.findMany({
    where: { id: { in: relatedIds } },
    select: {
      id: true,
      title: true,
      authorsJson: true,
      year: true,
      verificationStatus: true,
    },
  });

  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  return relationships.map((r) => {
    const relatedId = r.sourceAId === sourceId ? r.sourceBId : r.sourceAId;
    return {
      source: sourceMap.get(relatedId),
      score: r.coCitationScore,
      sharedContexts: r.sharedDeliberations + r.sharedArguments,
    };
  });
}
```

### Citation Network Visualization

```tsx
// components/sources/CitationNetworkGraph.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";

interface CitationNetworkGraphProps {
  sourceId?: string;
  deliberationId?: string;
  topic?: string;
  width?: number;
  height?: number;
}

export function CitationNetworkGraph({
  sourceId,
  deliberationId,
  topic,
  width = 800,
  height = 600,
}: CitationNetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["citation-network", sourceId, deliberationId, topic],
    queryFn: () => {
      const params = new URLSearchParams();
      if (sourceId) params.set("sourceId", sourceId);
      if (deliberationId) params.set("deliberationId", deliberationId);
      if (topic) params.set("topic", topic);
      return fetch(`/api/citation-network?${params}`).then((r) => r.json());
    },
  });

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { nodes, edges } = data;

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(edges)
          .id((d: any) => d.id)
          .distance(100)
          .strength((d: any) => d.weight)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Create container with zoom
    const container = svg
      .append("g")
      .attr("class", "container");

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => {
          container.attr("transform", event.transform);
        }) as any
    );

    // Draw edges
    const link = container
      .append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.max(1, d.weight * 3));

    // Draw nodes
    const node = container
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(drag(simulation) as any);

    // Node circles
    node
      .append("circle")
      .attr("r", (d: any) => Math.max(8, Math.sqrt(d.citationCount) * 3))
      .attr("fill", (d: any) =>
        d.id === sourceId ? "#3b82f6" : "#6b7280"
      )
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Node labels
    node
      .append("text")
      .text((d: any) => truncate(d.title, 20))
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", "10px")
      .attr("fill", "#374151");

    // Hover tooltip
    node
      .on("mouseenter", function (event, d: any) {
        d3.select(this).select("circle").attr("stroke", "#3b82f6");
        setSelectedNode(d.id);
      })
      .on("mouseleave", function () {
        d3.select(this).select("circle").attr("stroke", "#fff");
        setSelectedNode(null);
      })
      .on("click", (event, d: any) => {
        window.location.href = `/sources/${d.id}`;
      });

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, width, height, sourceId]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ width, height }}
      >
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border rounded-lg bg-white"
      />

      {/* Stats overlay */}
      {data?.stats && (
        <div className="absolute top-4 left-4 bg-white/90 rounded-lg p-3 text-xs shadow">
          <div>Nodes: {data.stats.nodeCount}</div>
          <div>Connections: {data.stats.edgeCount}</div>
          <div>Avg. degree: {data.stats.avgDegree.toFixed(1)}</div>
        </div>
      )}

      {/* Selected node info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg p-3 shadow">
          <SelectedNodeInfo
            nodeId={selectedNode}
            nodes={data?.nodes || []}
          />
        </div>
      )}
    </div>
  );
}

function drag(simulation: any) {
  return d3
    .drag()
    .on("start", (event) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    })
    .on("drag", (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on("end", (event) => {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    });
}

function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "..." : str;
}

function SelectedNodeInfo({
  nodeId,
  nodes,
}: {
  nodeId: string;
  nodes: any[];
}) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  return (
    <div>
      <div className="font-medium text-sm">{node.title}</div>
      <div className="text-xs text-gray-500 mt-1">
        {node.citationCount} citations · {node.degree} connections
      </div>
    </div>
  );
}
```

### Related Sources Component

```tsx
// components/sources/RelatedSources.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { GitBranch } from "lucide-react";
import { VerificationBadge } from "@/components/sources/VerificationBadge";

interface RelatedSourcesProps {
  sourceId: string;
  limit?: number;
}

export function RelatedSources({ sourceId, limit = 5 }: RelatedSourcesProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["related-sources", sourceId, limit],
    queryFn: () =>
      fetch(`/api/sources/${sourceId}/related?limit=${limit}`).then((r) =>
        r.json()
      ),
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded" />;
  }

  if (!data?.related || data.related.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        Frequently Cited Together
      </h4>

      <div className="space-y-3">
        {data.related.map((item: any) => (
          <Link
            key={item.source.id}
            href={`/sources/${item.source.id}`}
            className="block p-2 -mx-2 rounded hover:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium line-clamp-2">
                  {item.source.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Co-cited in {item.sharedContexts} context
                  {item.sharedContexts !== 1 ? "s" : ""}
                </div>
              </div>
              <VerificationBadge
                status={item.source.verificationStatus}
                size="sm"
              />
            </div>
          </Link>
        ))}
      </div>

      <Link
        href={`/sources/${sourceId}/network`}
        className="block mt-3 text-sm text-blue-600 hover:underline"
      >
        View citation network →
      </Link>
    </div>
  );
}
```

### API Endpoints

```typescript
// app/api/citation-network/route.ts

import { NextRequest, NextResponse } from "next/server";
import { buildCitationNetwork } from "@/lib/citationNetwork/networkBuilder";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const sourceId = searchParams.get("sourceId") || undefined;
  const deliberationId = searchParams.get("deliberationId") || undefined;
  const topic = searchParams.get("topic") || undefined;
  const minCoCitations = parseInt(searchParams.get("minCoCitations") || "2", 10);
  const maxNodes = parseInt(searchParams.get("maxNodes") || "50", 10);

  const network = await buildCitationNetwork({
    sourceId,
    deliberationId,
    topic,
    minCoCitations,
    maxNodes,
  });

  return NextResponse.json(network);
}
```

```typescript
// app/api/sources/[sourceId]/related/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getRelatedSources } from "@/lib/citationNetwork/networkBuilder";

export async function GET(
  req: NextRequest,
  { params }: { params: { sourceId: string } }
) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const related = await getRelatedSources(params.sourceId, limit);

  return NextResponse.json({ related });
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Co-citations computed | Worker runs → relationships created |
| Scores normalized | Highest co-citation → score = 1 |
| Network builds | Request network → nodes + edges returned |
| Graph renders | Component → D3 visualization |
| Node sizing correct | More citations → larger node |
| Related sources accurate | Frequent co-citation → appears in list |
| Zoom/pan works | Interaction → graph responds |
| Click navigates | Click node → go to source page |

---

## Phase 3.3 Completion Checklist

### Pre-Launch Requirements

| Item | Owner | Status |
|------|-------|--------|
| SourceUsage model + migration | Backend | ☐ |
| SourceCitationContext model | Backend | ☐ |
| Usage aggregation worker | Backend | ☐ |
| Citation triggers | Backend | ☐ |
| Cross-references API | Backend | ☐ |
| Cross-references component | Frontend | ☐ |
| EvidenceProvenanceEvent model | Backend | ☐ |
| Provenance recorder | Backend | ☐ |
| Provenance chain builder | Backend | ☐ |
| Provenance timeline component | Frontend | ☐ |
| TrendingSnapshot model | Backend | ☐ |
| Trending computation worker | Backend | ☐ |
| Trending cron jobs (hourly/daily/weekly) | Backend | ☐ |
| Trending API endpoints | Backend | ☐ |
| Trending sources component | Frontend | ☐ |
| Trending topics component | Frontend | ☐ |
| SourceRelationship model | Backend | ☐ |
| Co-citation analysis worker | Backend | ☐ |
| Citation network builder | Backend | ☐ |
| Network graph component (D3) | Frontend | ☐ |
| Related sources component | Frontend | ☐ |
| Network API endpoints | Backend | ☐ |

### Testing Requirements

| Test Type | Coverage |
|-----------|----------|
| Unit tests | Trend score calculation |
| Unit tests | Co-citation pair generation |
| Unit tests | Provenance event recording |
| Integration tests | Full aggregation pipeline |
| Integration tests | Network build from citations |
| E2E tests | Trending page load + display |
| E2E tests | Network visualization interaction |
| Performance tests | Large network rendering |

### External Dependencies

| Dependency | Required | Notes |
|------------|----------|-------|
| D3.js | Yes | For network visualization |
| Redis (Upstash) | Recommended | For caching trending data |
| Cron service | Yes | For scheduled trending computation |

---

**Estimated Phase 3.3 Duration**: 3-4 weeks

---

# Phase 3.4: Discovery & Exploration

**Goal**: Help users discover relevant evidence, related conversations, and opposing viewpoints they wouldn't find on their own. Transform Mesh from a tool into an exploration environment.

**Timeline**: Weeks 11-14

---

## 3.4.1 Knowledge Graph View

**Priority**: P1 — Visual exploration  
**Estimated Effort**: 5-6 days  
**Risk Level**: Medium (graph complexity, performance)

### Problem Statement

Users currently explore evidence linearly (lists, search results). They can't:
- See how concepts, sources, and deliberations connect
- Discover unexpected relationships between topics
- Navigate the knowledge space visually

**Goal**: Interactive knowledge graph showing connections between sources, topics, claims, and deliberations, enabling visual exploration and serendipitous discovery.

### Graph Data Model

```prisma
model KnowledgeNode {
  id            String   @id @default(cuid())
  
  // Node type and reference
  nodeType      KnowledgeNodeType
  referenceId   String   // ID of the actual entity
  
  // Display properties
  label         String
  description   String?
  
  // Metadata for rendering
  weight        Float    @default(1)  // Node importance/size
  color         String?  // Custom color override
  
  // Computed properties
  connectionCount Int    @default(0)
  lastActivityAt  DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Edges where this is source
  outgoingEdges KnowledgeEdge[] @relation("EdgeSource")
  // Edges where this is target
  incomingEdges KnowledgeEdge[] @relation("EdgeTarget")
  
  @@unique([nodeType, referenceId])
  @@index([nodeType])
  @@index([weight])
}

model KnowledgeEdge {
  id            String   @id @default(cuid())
  
  sourceNodeId  String
  targetNodeId  String
  
  // Edge type
  edgeType      KnowledgeEdgeType
  
  // Edge properties
  weight        Float    @default(1)
  label         String?
  
  // Metadata
  metadata      Json?
  
  createdAt     DateTime @default(now())
  
  sourceNode    KnowledgeNode @relation("EdgeSource", fields: [sourceNodeId], references: [id], onDelete: Cascade)
  targetNode    KnowledgeNode @relation("EdgeTarget", fields: [targetNodeId], references: [id], onDelete: Cascade)
  
  @@unique([sourceNodeId, targetNodeId, edgeType])
  @@index([sourceNodeId])
  @@index([targetNodeId])
}

enum KnowledgeNodeType {
  source
  topic
  claim
  deliberation
  argument
  author
  institution
}

enum KnowledgeEdgeType {
  cites           // Source → Source
  discusses       // Deliberation → Topic
  contains        // Deliberation → Claim
  supports        // Source → Claim
  refutes         // Source → Claim
  authored_by     // Source → Author
  affiliated_with // Author → Institution
  related_to      // Topic → Topic
  builds_on       // Claim → Claim
}
```

### Graph Builder Worker

```typescript
// workers/knowledgeGraphBuilder.ts

import { prisma } from "@/lib/prismaclient";
import { Job } from "bullmq";

interface GraphBuildJob {
  scope: "full" | "incremental";
  entityType?: string;
  entityId?: string;
}

export async function buildKnowledgeGraph(job: Job<GraphBuildJob>) {
  const { scope, entityType, entityId } = job.data;

  console.log(`[KnowledgeGraph] Building graph (${scope})...`);

  if (scope === "full") {
    await buildFullGraph();
  } else if (entityType && entityId) {
    await updateGraphForEntity(entityType, entityId);
  }
}

async function buildFullGraph() {
  // Clear existing graph
  await prisma.knowledgeEdge.deleteMany({});
  await prisma.knowledgeNode.deleteMany({});

  // Build source nodes
  const sources = await prisma.source.findMany({
    select: {
      id: true,
      title: true,
      abstract: true,
      topics: true,
      _count: { select: { citations: true } },
    },
  });

  for (const source of sources) {
    await prisma.knowledgeNode.create({
      data: {
        nodeType: "source",
        referenceId: source.id,
        label: source.title,
        description: source.abstract?.slice(0, 200),
        weight: Math.log10(source._count.citations + 1) + 1,
        connectionCount: source._count.citations,
      },
    });
  }

  // Build topic nodes
  const allTopics = new Set<string>();
  for (const source of sources) {
    const topics = (source.topics as string[]) || [];
    topics.forEach((t) => allTopics.add(t));
  }

  for (const topic of allTopics) {
    const sourceCount = sources.filter((s) =>
      ((s.topics as string[]) || []).includes(topic)
    ).length;

    await prisma.knowledgeNode.create({
      data: {
        nodeType: "topic",
        referenceId: topic,
        label: topic,
        weight: Math.log10(sourceCount + 1) + 1,
        connectionCount: sourceCount,
      },
    });
  }

  // Build deliberation nodes
  const deliberations = await prisma.deliberation.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      title: true,
      description: true,
      _count: { select: { arguments: true, citations: true } },
    },
  });

  for (const delib of deliberations) {
    await prisma.knowledgeNode.create({
      data: {
        nodeType: "deliberation",
        referenceId: delib.id,
        label: delib.title,
        description: delib.description?.slice(0, 200),
        weight: Math.log10(delib._count.arguments + delib._count.citations + 1) + 1,
        connectionCount: delib._count.arguments,
      },
    });
  }

  // Build edges
  await buildSourceTopicEdges();
  await buildCitationEdges();
  await buildDeliberationTopicEdges();

  console.log("[KnowledgeGraph] Full graph build complete");
}

async function buildSourceTopicEdges() {
  const sources = await prisma.source.findMany({
    select: { id: true, topics: true },
  });

  for (const source of sources) {
    const topics = (source.topics as string[]) || [];

    for (const topic of topics) {
      const sourceNode = await prisma.knowledgeNode.findUnique({
        where: { nodeType_referenceId: { nodeType: "source", referenceId: source.id } },
      });
      const topicNode = await prisma.knowledgeNode.findUnique({
        where: { nodeType_referenceId: { nodeType: "topic", referenceId: topic } },
      });

      if (sourceNode && topicNode) {
        await prisma.knowledgeEdge.create({
          data: {
            sourceNodeId: sourceNode.id,
            targetNodeId: topicNode.id,
            edgeType: "discusses",
            weight: 1,
          },
        });
      }
    }
  }
}

async function buildCitationEdges() {
  const citations = await prisma.citation.findMany({
    where: {
      targetType: { in: ["claim", "argument"] },
    },
    select: {
      sourceId: true,
      targetId: true,
      targetType: true,
      intent: true,
    },
  });

  for (const citation of citations) {
    const sourceNode = await prisma.knowledgeNode.findUnique({
      where: { nodeType_referenceId: { nodeType: "source", referenceId: citation.sourceId } },
    });

    if (!sourceNode) continue;

    // Create edge based on intent
    const edgeType = citation.intent === "refutes" ? "refutes" : "supports";

    // For claims/arguments, we'd create nodes and edges
    // Simplified: just track the relationship
  }
}

async function buildDeliberationTopicEdges() {
  // Connect deliberations to topics via their citations' sources
  const deliberations = await prisma.deliberation.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      citations: {
        select: {
          source: {
            select: { topics: true },
          },
        },
      },
    },
  });

  for (const delib of deliberations) {
    const topicsInDelib = new Set<string>();

    for (const citation of delib.citations) {
      const topics = (citation.source?.topics as string[]) || [];
      topics.forEach((t) => topicsInDelib.add(t));
    }

    const delibNode = await prisma.knowledgeNode.findUnique({
      where: { nodeType_referenceId: { nodeType: "deliberation", referenceId: delib.id } },
    });

    if (!delibNode) continue;

    for (const topic of topicsInDelib) {
      const topicNode = await prisma.knowledgeNode.findUnique({
        where: { nodeType_referenceId: { nodeType: "topic", referenceId: topic } },
      });

      if (topicNode) {
        await prisma.knowledgeEdge.upsert({
          where: {
            sourceNodeId_targetNodeId_edgeType: {
              sourceNodeId: delibNode.id,
              targetNodeId: topicNode.id,
              edgeType: "discusses",
            },
          },
          create: {
            sourceNodeId: delibNode.id,
            targetNodeId: topicNode.id,
            edgeType: "discusses",
            weight: 1,
          },
          update: {
            weight: { increment: 1 },
          },
        });
      }
    }
  }
}

async function updateGraphForEntity(entityType: string, entityId: string) {
  // Incremental update when a specific entity changes
  // Re-compute edges connected to this entity
  console.log(`[KnowledgeGraph] Updating for ${entityType}:${entityId}`);
  // Implementation depends on entity type
}
```

### Graph Query API

```typescript
// lib/knowledgeGraph/queryGraph.ts

import { prisma } from "@/lib/prismaclient";

interface GraphQueryOptions {
  centerNodeType?: string;
  centerNodeId?: string;
  depth?: number;
  maxNodes?: number;
  nodeTypes?: string[];
  edgeTypes?: string[];
}

interface GraphData {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    weight: number;
    referenceId: string;
    depth: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    weight: number;
  }>;
}

export async function queryKnowledgeGraph(
  options: GraphQueryOptions
): Promise<GraphData> {
  const {
    centerNodeType,
    centerNodeId,
    depth = 2,
    maxNodes = 100,
    nodeTypes,
    edgeTypes,
  } = options;

  // If no center, get top nodes by weight
  if (!centerNodeType || !centerNodeId) {
    return getTopNodesGraph(maxNodes, nodeTypes);
  }

  // BFS from center node
  const centerNode = await prisma.knowledgeNode.findUnique({
    where: {
      nodeType_referenceId: {
        nodeType: centerNodeType as any,
        referenceId: centerNodeId,
      },
    },
  });

  if (!centerNode) {
    return { nodes: [], edges: [] };
  }

  const visitedNodes = new Map<string, number>(); // nodeId -> depth
  const collectedEdges: any[] = [];
  const queue: Array<{ nodeId: string; currentDepth: number }> = [
    { nodeId: centerNode.id, currentDepth: 0 },
  ];

  while (queue.length > 0 && visitedNodes.size < maxNodes) {
    const { nodeId, currentDepth } = queue.shift()!;

    if (visitedNodes.has(nodeId)) continue;
    if (currentDepth > depth) continue;

    visitedNodes.set(nodeId, currentDepth);

    // Get connected edges
    const edges = await prisma.knowledgeEdge.findMany({
      where: {
        OR: [{ sourceNodeId: nodeId }, { targetNodeId: nodeId }],
        ...(edgeTypes && { edgeType: { in: edgeTypes as any[] } }),
      },
      include: {
        sourceNode: true,
        targetNode: true,
      },
    });

    for (const edge of edges) {
      // Filter by node types if specified
      if (nodeTypes) {
        if (
          !nodeTypes.includes(edge.sourceNode.nodeType) ||
          !nodeTypes.includes(edge.targetNode.nodeType)
        ) {
          continue;
        }
      }

      collectedEdges.push(edge);

      const neighborId =
        edge.sourceNodeId === nodeId ? edge.targetNodeId : edge.sourceNodeId;

      if (!visitedNodes.has(neighborId)) {
        queue.push({ nodeId: neighborId, currentDepth: currentDepth + 1 });
      }
    }
  }

  // Fetch all visited nodes
  const nodeIds = Array.from(visitedNodes.keys());
  const nodes = await prisma.knowledgeNode.findMany({
    where: { id: { in: nodeIds } },
  });

  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.nodeType,
      label: n.label,
      weight: n.weight,
      referenceId: n.referenceId,
      depth: visitedNodes.get(n.id) || 0,
    })),
    edges: collectedEdges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      type: e.edgeType,
      weight: e.weight,
    })),
  };
}

async function getTopNodesGraph(
  maxNodes: number,
  nodeTypes?: string[]
): Promise<GraphData> {
  const nodes = await prisma.knowledgeNode.findMany({
    where: nodeTypes ? { nodeType: { in: nodeTypes as any[] } } : undefined,
    orderBy: { weight: "desc" },
    take: maxNodes,
  });

  const nodeIds = nodes.map((n) => n.id);

  const edges = await prisma.knowledgeEdge.findMany({
    where: {
      sourceNodeId: { in: nodeIds },
      targetNodeId: { in: nodeIds },
    },
  });

  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.nodeType,
      label: n.label,
      weight: n.weight,
      referenceId: n.referenceId,
      depth: 0,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      type: e.edgeType,
      weight: e.weight,
    })),
  };
}
```

### Knowledge Graph Visualization

```tsx
// components/explore/KnowledgeGraphExplorer.tsx

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";
import { useRouter } from "next/navigation";
import { Search, Filter, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const NODE_COLORS: Record<string, string> = {
  source: "#3b82f6",      // Blue
  topic: "#10b981",       // Green
  deliberation: "#8b5cf6", // Purple
  claim: "#f59e0b",       // Amber
  argument: "#ef4444",    // Red
  author: "#6366f1",      // Indigo
  institution: "#ec4899", // Pink
};

interface KnowledgeGraphExplorerProps {
  initialNodeType?: string;
  initialNodeId?: string;
}

export function KnowledgeGraphExplorer({
  initialNodeType,
  initialNodeId,
}: KnowledgeGraphExplorerProps) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [centerNode, setCenterNode] = useState<{ type: string; id: string } | null>(
    initialNodeType && initialNodeId
      ? { type: initialNodeType, id: initialNodeId }
      : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleNodeTypes, setVisibleNodeTypes] = useState<string[]>([
    "source",
    "topic",
    "deliberation",
  ]);
  const [depth, setDepth] = useState(2);
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["knowledge-graph", centerNode, depth, visibleNodeTypes],
    queryFn: () => {
      const params = new URLSearchParams();
      if (centerNode) {
        params.set("centerType", centerNode.type);
        params.set("centerId", centerNode.id);
      }
      params.set("depth", String(depth));
      params.set("nodeTypes", visibleNodeTypes.join(","));
      return fetch(`/api/knowledge-graph?${params}`).then((r) => r.json());
    },
  });

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    const container = svg.append("g");

    // Build simulation
    const simulation = d3
      .forceSimulation(data.nodes)
      .force(
        "link",
        d3
          .forceLink(data.edges)
          .id((d: any) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => d.weight * 10 + 15));

    // Draw edges
    const link = container
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", (d: any) => Math.max(1, d.weight))
      .attr("stroke-opacity", 0.6);

    // Draw nodes
    const node = container
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(drag(simulation) as any);

    // Node circles
    node
      .append("circle")
      .attr("r", (d: any) => d.weight * 5 + 8)
      .attr("fill", (d: any) => NODE_COLORS[d.type] || "#94a3b8")
      .attr("stroke", (d: any) =>
        centerNode && d.referenceId === centerNode.id ? "#000" : "#fff"
      )
      .attr("stroke-width", (d: any) =>
        centerNode && d.referenceId === centerNode.id ? 3 : 2
      );

    // Node labels
    node
      .append("text")
      .text((d: any) => truncate(d.label, 15))
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => d.weight * 5 + 20)
      .attr("font-size", "11px")
      .attr("fill", "#374151")
      .attr("pointer-events", "none");

    // Type badges
    node
      .append("text")
      .text((d: any) => getTypeEmoji(d.type))
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("font-size", "12px")
      .attr("pointer-events", "none");

    // Interactions
    node
      .on("mouseenter", (event, d: any) => {
        setHoveredNode(d);
        d3.select(event.currentTarget)
          .select("circle")
          .attr("stroke", "#3b82f6")
          .attr("stroke-width", 3);
      })
      .on("mouseleave", (event, d: any) => {
        setHoveredNode(null);
        d3.select(event.currentTarget)
          .select("circle")
          .attr("stroke", centerNode && d.referenceId === centerNode.id ? "#000" : "#fff")
          .attr("stroke-width", centerNode && d.referenceId === centerNode.id ? 3 : 2);
      })
      .on("click", (event, d: any) => {
        event.stopPropagation();
        handleNodeClick(d);
      })
      .on("dblclick", (event, d: any) => {
        event.stopPropagation();
        setCenterNode({ type: d.type, id: d.referenceId });
      });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, centerNode]);

  const handleNodeClick = (node: any) => {
    const paths: Record<string, string> = {
      source: `/sources/${node.referenceId}`,
      deliberation: `/deliberations/${node.referenceId}`,
      topic: `/search?topic=${encodeURIComponent(node.referenceId)}`,
    };

    const path = paths[node.type];
    if (path) {
      router.push(path);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    // Search for matching nodes and center on first result
    const response = await fetch(
      `/api/knowledge-graph/search?q=${encodeURIComponent(searchQuery)}`
    );
    const results = await response.json();
    if (results.nodes?.length > 0) {
      const first = results.nodes[0];
      setCenterNode({ type: first.type, id: first.referenceId });
    }
  };

  const toggleNodeType = (type: string) => {
    setVisibleNodeTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r p-4 space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find node..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button size="icon" variant="outline" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Node Types</label>
          <div className="space-y-2">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={visibleNodeTypes.includes(type)}
                  onCheckedChange={() => toggleNodeType(type)}
                />
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Depth: {depth}
          </label>
          <input
            type="range"
            min={1}
            max={4}
            value={depth}
            onChange={(e) => setDepth(parseInt(e.target.value, 10))}
            className="w-full"
          />
        </div>

        {centerNode && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setCenterNode(null)}
          >
            Clear Focus
          </Button>
        )}
      </div>

      {/* Graph canvas */}
      <div ref={containerRef} className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="bg-gray-50"
        />

        {/* Hovered node info */}
        {hoveredNode && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: NODE_COLORS[hoveredNode.type] }}
              />
              <span className="text-xs uppercase text-gray-500">
                {hoveredNode.type}
              </span>
            </div>
            <h4 className="font-medium text-sm">{hoveredNode.label}</h4>
            <p className="text-xs text-gray-500 mt-1">
              Click to view · Double-click to explore
            </p>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button size="icon" variant="outline">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-2">Legend</div>
          <div className="flex flex-wrap gap-3">
            {visibleNodeTypes.map((type) => (
              <div key={type} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[type] }}
                />
                <span className="text-xs">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function drag(simulation: any) {
  return d3
    .drag()
    .on("start", (event) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    })
    .on("drag", (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on("end", (event) => {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    });
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    source: "📄",
    topic: "#",
    deliberation: "💬",
    claim: "💡",
    argument: "⚔️",
    author: "👤",
    institution: "🏛️",
  };
  return emojis[type] || "•";
}
```

### API Endpoints

```typescript
// app/api/knowledge-graph/route.ts

import { NextRequest, NextResponse } from "next/server";
import { queryKnowledgeGraph } from "@/lib/knowledgeGraph/queryGraph";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const centerType = searchParams.get("centerType") || undefined;
  const centerId = searchParams.get("centerId") || undefined;
  const depth = parseInt(searchParams.get("depth") || "2", 10);
  const nodeTypes = searchParams.get("nodeTypes")?.split(",");
  const maxNodes = parseInt(searchParams.get("maxNodes") || "100", 10);

  const graph = await queryKnowledgeGraph({
    centerNodeType: centerType,
    centerNodeId: centerId,
    depth,
    maxNodes,
    nodeTypes,
  });

  return NextResponse.json(graph);
}
```

```typescript
// app/api/knowledge-graph/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ nodes: [] });
  }

  const nodes = await prisma.knowledgeNode.findMany({
    where: {
      label: { contains: query, mode: "insensitive" },
    },
    take: 20,
    orderBy: { weight: "desc" },
  });

  return NextResponse.json({ nodes });
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Graph builds | Worker runs → nodes + edges created |
| Query returns subgraph | Request with center → connected nodes returned |
| D3 renders | Component mounts → visualization appears |
| Node filtering works | Toggle type → nodes appear/disappear |
| Search finds nodes | Query → matching nodes returned |
| Click navigates | Single click → goes to entity page |
| Double-click explores | Double click → centers graph on node |
| Zoom/pan works | Interaction → graph responds |

---

## 3.4.2 Related Stacks & Deliberations

**Priority**: P1 — Cross-pollination  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low (similarity computation)

### Problem Statement

Users in a deliberation don't know about:
- Other deliberations discussing similar topics or using similar sources
- Stacks that contain relevant evidence they haven't discovered
- Users with expertise in the same areas

**Goal**: Surface related content based on topic overlap, citation similarity, and participant overlap.

### Similarity Computation

```typescript
// lib/similarity/computeSimilarity.ts

import { prisma } from "@/lib/prismaclient";

interface SimilarityScore {
  id: string;
  type: "deliberation" | "stack";
  title: string;
  score: number;
  reasons: string[];
}

export async function findRelatedDeliberations(
  deliberationId: string,
  limit: number = 10
): Promise<SimilarityScore[]> {
  // Get current deliberation's characteristics
  const current = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    include: {
      citations: {
        select: { sourceId: true },
      },
      arguments: {
        select: { id: true },
      },
    },
  });

  if (!current) return [];

  const currentSourceIds = new Set(current.citations.map((c) => c.sourceId));

  // Get topics from sources
  const sources = await prisma.source.findMany({
    where: { id: { in: Array.from(currentSourceIds) } },
    select: { topics: true },
  });

  const currentTopics = new Set<string>();
  for (const source of sources) {
    const topics = (source.topics as string[]) || [];
    topics.forEach((t) => currentTopics.add(t));
  }

  // Find other public deliberations
  const otherDelibs = await prisma.deliberation.findMany({
    where: {
      id: { not: deliberationId },
      isPublic: true,
    },
    include: {
      citations: {
        select: { sourceId: true },
      },
    },
  });

  // Score each deliberation
  const scores: SimilarityScore[] = [];

  for (const delib of otherDelibs) {
    const reasons: string[] = [];
    let score = 0;

    // Source overlap
    const delibSourceIds = new Set(delib.citations.map((c) => c.sourceId));
    const sharedSources = [...currentSourceIds].filter((id) =>
      delibSourceIds.has(id)
    );

    if (sharedSources.length > 0) {
      const sourceScore = sharedSources.length * 10;
      score += sourceScore;
      reasons.push(`${sharedSources.length} shared sources`);
    }

    // Topic overlap
    const delibSources = await prisma.source.findMany({
      where: { id: { in: Array.from(delibSourceIds) } },
      select: { topics: true },
    });

    const delibTopics = new Set<string>();
    for (const source of delibSources) {
      const topics = (source.topics as string[]) || [];
      topics.forEach((t) => delibTopics.add(t));
    }

    const sharedTopics = [...currentTopics].filter((t) => delibTopics.has(t));
    if (sharedTopics.length > 0) {
      const topicScore = sharedTopics.length * 5;
      score += topicScore;
      reasons.push(`${sharedTopics.length} shared topics`);
    }

    if (score > 0) {
      scores.push({
        id: delib.id,
        type: "deliberation",
        title: delib.title,
        score,
        reasons,
      });
    }
  }

  // Sort by score and return top N
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function findRelatedStacks(
  deliberationId: string,
  limit: number = 10
): Promise<SimilarityScore[]> {
  // Get current deliberation's sources
  const current = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    include: {
      citations: {
        select: { sourceId: true },
      },
    },
  });

  if (!current) return [];

  const currentSourceIds = new Set(current.citations.map((c) => c.sourceId));

  // Find stacks with overlapping sources
  const stackItems = await prisma.stackItem.findMany({
    where: {
      sourceId: { in: Array.from(currentSourceIds) },
      stack: {
        visibility: { in: ["public", "unlisted"] },
      },
    },
    include: {
      stack: {
        select: {
          id: true,
          name: true,
          visibility: true,
          _count: { select: { items: true } },
        },
      },
    },
  });

  // Group by stack and count overlaps
  const stackScores = new Map<
    string,
    { stack: any; sharedCount: number }
  >();

  for (const item of stackItems) {
    const existing = stackScores.get(item.stackId);
    if (existing) {
      existing.sharedCount++;
    } else {
      stackScores.set(item.stackId, {
        stack: item.stack,
        sharedCount: 1,
      });
    }
  }

  // Convert to scores
  const scores: SimilarityScore[] = [];

  for (const [stackId, data] of stackScores) {
    const overlapRatio = data.sharedCount / data.stack._count.items;
    const score = data.sharedCount * 10 + overlapRatio * 20;

    scores.push({
      id: stackId,
      type: "stack",
      title: data.stack.name,
      score,
      reasons: [
        `${data.sharedCount} shared sources`,
        `${Math.round(overlapRatio * 100)}% overlap`,
      ],
    });
  }

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

### Related Content Components

```tsx
// components/deliberation/RelatedDeliberations.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MessageSquare, BookOpen, Users } from "lucide-react";

interface RelatedDeliberationsProps {
  deliberationId: string;
  limit?: number;
}

export function RelatedDeliberations({
  deliberationId,
  limit = 5,
}: RelatedDeliberationsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["related-deliberations", deliberationId],
    queryFn: () =>
      fetch(`/api/deliberations/${deliberationId}/related?limit=${limit}`).then(
        (r) => r.json()
      ),
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded" />;
  }

  if (!data?.deliberations || data.deliberations.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Related Deliberations
      </h4>

      <div className="space-y-3">
        {data.deliberations.map((item: any) => (
          <Link
            key={item.id}
            href={`/deliberations/${item.id}`}
            className="block p-2 -mx-2 rounded hover:bg-gray-50"
          >
            <div className="font-medium text-sm line-clamp-1">{item.title}</div>
            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
              {item.reasons.map((reason: string, i: number) => (
                <span key={i} className="bg-gray-100 px-2 py-0.5 rounded">
                  {reason}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// components/deliberation/RelatedStacks.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Layers } from "lucide-react";

interface RelatedStacksProps {
  deliberationId: string;
  limit?: number;
}

export function RelatedStacks({
  deliberationId,
  limit = 5,
}: RelatedStacksProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["related-stacks", deliberationId],
    queryFn: () =>
      fetch(`/api/deliberations/${deliberationId}/related-stacks?limit=${limit}`).then(
        (r) => r.json()
      ),
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded" />;
  }

  if (!data?.stacks || data.stacks.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Layers className="h-4 w-4" />
        Related Evidence Stacks
      </h4>

      <div className="space-y-3">
        {data.stacks.map((item: any) => (
          <Link
            key={item.id}
            href={`/stacks/${item.id}`}
            className="block p-2 -mx-2 rounded hover:bg-gray-50"
          >
            <div className="font-medium text-sm">{item.title}</div>
            <div className="text-xs text-gray-500 mt-1">
              {item.reasons.join(" · ")}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### API Endpoints

```typescript
// app/api/deliberations/[deliberationId]/related/route.ts

import { NextRequest, NextResponse } from "next/server";
import { findRelatedDeliberations } from "@/lib/similarity/computeSimilarity";

export async function GET(
  req: NextRequest,
  { params }: { params: { deliberationId: string } }
) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const deliberations = await findRelatedDeliberations(
    params.deliberationId,
    limit
  );

  return NextResponse.json({ deliberations });
}
```

```typescript
// app/api/deliberations/[deliberationId]/related-stacks/route.ts

import { NextRequest, NextResponse } from "next/server";
import { findRelatedStacks } from "@/lib/similarity/computeSimilarity";

export async function GET(
  req: NextRequest,
  { params }: { params: { deliberationId: string } }
) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const stacks = await findRelatedStacks(params.deliberationId, limit);

  return NextResponse.json({ stacks });
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Related deliberations found | Shared sources → appears in list |
| Related stacks found | Overlapping items → appears in list |
| Score ordering correct | Higher overlap → higher rank |
| Reasons displayed | Shows why related |
| Click navigates | Click item → goes to page |

---

## 3.4.3 Timeline View

**Priority**: P2 — Temporal exploration  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low (visualization layer)

### Problem Statement

Evidence evolves over time:
- When were key sources published?
- How has research in a topic progressed?
- When did specific claims emerge in a deliberation?

Users can't see the temporal dimension of evidence. Everything appears flat.

**Goal**: Provide timeline views showing when sources were published, when they were cited, and how conversations evolved over time.

### Timeline Data Types

```typescript
// lib/timeline/types.ts

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: Date;
  title: string;
  description?: string;
  
  // Reference to entity
  entityType: string;
  entityId: string;
  
  // Metadata for rendering
  color?: string;
  icon?: string;
  importance?: number; // 1-5 scale
}

export type TimelineEventType =
  | "source_published"
  | "source_cited"
  | "argument_created"
  | "deliberation_started"
  | "claim_made"
  | "retraction"
  | "correction";

export interface TimelineFilter {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: TimelineEventType[];
  minImportance?: number;
}

export interface TimelineData {
  events: TimelineEvent[];
  dateRange: {
    earliest: Date;
    latest: Date;
  };
  summary: {
    totalEvents: number;
    byType: Record<string, number>;
    byYear: Record<number, number>;
  };
}
```

### Timeline Builder

```typescript
// lib/timeline/buildTimeline.ts

import { prisma } from "@/lib/prismaclient";
import { TimelineEvent, TimelineFilter, TimelineData } from "./types";

export async function buildSourceTimeline(
  sourceIds: string[],
  filter?: TimelineFilter
): Promise<TimelineData> {
  const events: TimelineEvent[] = [];

  // Get sources with publication dates
  const sources = await prisma.source.findMany({
    where: { id: { in: sourceIds } },
    select: {
      id: true,
      title: true,
      year: true,
      publicationDate: true,
      retractionStatus: true,
      retractionDate: true,
    },
  });

  for (const source of sources) {
    // Publication event
    const pubDate = source.publicationDate || (source.year ? new Date(source.year, 0, 1) : null);
    
    if (pubDate) {
      events.push({
        id: `pub-${source.id}`,
        type: "source_published",
        date: pubDate,
        title: source.title,
        entityType: "source",
        entityId: source.id,
        icon: "📄",
        importance: 3,
      });
    }

    // Retraction event
    if (source.retractionStatus === "retracted" && source.retractionDate) {
      events.push({
        id: `retract-${source.id}`,
        type: "retraction",
        date: source.retractionDate,
        title: `Retracted: ${source.title}`,
        entityType: "source",
        entityId: source.id,
        icon: "⚠️",
        color: "#ef4444",
        importance: 5,
      });
    }
  }

  // Get citation events
  const citations = await prisma.citation.findMany({
    where: { sourceId: { in: sourceIds } },
    select: {
      id: true,
      sourceId: true,
      createdAt: true,
      source: { select: { title: true } },
      deliberation: { select: { title: true } },
    },
  });

  for (const citation of citations) {
    events.push({
      id: `cite-${citation.id}`,
      type: "source_cited",
      date: citation.createdAt,
      title: `Cited in: ${citation.deliberation?.title || "Unknown"}`,
      description: citation.source.title,
      entityType: "citation",
      entityId: citation.id,
      icon: "🔗",
      importance: 2,
    });
  }

  // Apply filters
  let filteredEvents = events;

  if (filter?.startDate) {
    filteredEvents = filteredEvents.filter((e) => e.date >= filter.startDate!);
  }
  if (filter?.endDate) {
    filteredEvents = filteredEvents.filter((e) => e.date <= filter.endDate!);
  }
  if (filter?.eventTypes?.length) {
    filteredEvents = filteredEvents.filter((e) =>
      filter.eventTypes!.includes(e.type)
    );
  }
  if (filter?.minImportance) {
    filteredEvents = filteredEvents.filter(
      (e) => (e.importance || 1) >= filter.minImportance!
    );
  }

  // Sort by date
  filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Build summary
  const byType: Record<string, number> = {};
  const byYear: Record<number, number> = {};

  for (const event of filteredEvents) {
    byType[event.type] = (byType[event.type] || 0) + 1;
    const year = event.date.getFullYear();
    byYear[year] = (byYear[year] || 0) + 1;
  }

  return {
    events: filteredEvents,
    dateRange: {
      earliest: filteredEvents[0]?.date || new Date(),
      latest: filteredEvents[filteredEvents.length - 1]?.date || new Date(),
    },
    summary: {
      totalEvents: filteredEvents.length,
      byType,
      byYear,
    },
  };
}

export async function buildDeliberationTimeline(
  deliberationId: string,
  filter?: TimelineFilter
): Promise<TimelineData> {
  const events: TimelineEvent[] = [];

  // Get deliberation
  const deliberation = await prisma.deliberation.findUnique({
    where: { id: deliberationId },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
  });

  if (deliberation) {
    events.push({
      id: `delib-start-${deliberation.id}`,
      type: "deliberation_started",
      date: deliberation.createdAt,
      title: "Deliberation started",
      description: deliberation.title,
      entityType: "deliberation",
      entityId: deliberation.id,
      icon: "💬",
      importance: 4,
    });
  }

  // Get arguments
  const arguments_ = await prisma.argument.findMany({
    where: { deliberationId },
    select: {
      id: true,
      conclusion: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  for (const arg of arguments_) {
    events.push({
      id: `arg-${arg.id}`,
      type: "argument_created",
      date: arg.createdAt,
      title: arg.conclusion?.slice(0, 100) || "New argument",
      entityType: "argument",
      entityId: arg.id,
      icon: "⚔️",
      importance: 3,
    });
  }

  // Get citations with source publication dates
  const citations = await prisma.citation.findMany({
    where: { deliberationId },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          year: true,
          publicationDate: true,
        },
      },
    },
  });

  for (const citation of citations) {
    // Citation added event
    events.push({
      id: `cite-${citation.id}`,
      type: "source_cited",
      date: citation.createdAt,
      title: `Source cited: ${citation.source.title.slice(0, 60)}...`,
      entityType: "citation",
      entityId: citation.id,
      icon: "📎",
      importance: 2,
    });
  }

  // Apply filters and sort
  let filteredEvents = events;

  if (filter?.startDate) {
    filteredEvents = filteredEvents.filter((e) => e.date >= filter.startDate!);
  }
  if (filter?.endDate) {
    filteredEvents = filteredEvents.filter((e) => e.date <= filter.endDate!);
  }

  filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  const byType: Record<string, number> = {};
  const byYear: Record<number, number> = {};

  for (const event of filteredEvents) {
    byType[event.type] = (byType[event.type] || 0) + 1;
    const year = event.date.getFullYear();
    byYear[year] = (byYear[year] || 0) + 1;
  }

  return {
    events: filteredEvents,
    dateRange: {
      earliest: filteredEvents[0]?.date || new Date(),
      latest: filteredEvents[filteredEvents.length - 1]?.date || new Date(),
    },
    summary: {
      totalEvents: filteredEvents.length,
      byType,
      byYear,
    },
  };
}
```

### Timeline Visualization Component

```tsx
// components/timeline/TimelineView.tsx

"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Calendar, Filter, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface TimelineViewProps {
  type: "source" | "deliberation" | "stack";
  id: string;
  sourceIds?: string[];
}

const EVENT_COLORS: Record<string, string> = {
  source_published: "#3b82f6",
  source_cited: "#10b981",
  argument_created: "#8b5cf6",
  deliberation_started: "#f59e0b",
  claim_made: "#ec4899",
  retraction: "#ef4444",
  correction: "#f97316",
};

export function TimelineView({ type, id, sourceIds }: TimelineViewProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["timeline", type, id, sourceIds],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("type", type);
      params.set("id", id);
      if (sourceIds) params.set("sourceIds", sourceIds.join(","));
      return fetch(`/api/timeline?${params}`).then((r) => r.json());
    },
  });

  const filteredEvents = useMemo(() => {
    if (!data?.events) return [];
    if (selectedTypes.length === 0) return data.events;
    return data.events.filter((e: any) => selectedTypes.includes(e.type));
  }, [data?.events, selectedTypes]);

  // Group events by year
  const eventsByYear = useMemo(() => {
    const groups: Record<number, any[]> = {};
    for (const event of filteredEvents) {
      const year = new Date(event.date).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(event);
    }
    return groups;
  }, [filteredEvents]);

  const toggleEventType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-gray-100 rounded" />;
  }

  const years = Object.keys(eventsByYear)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="flex gap-6">
      {/* Filters sidebar */}
      <div className="w-48 shrink-0">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </h4>

        <div className="space-y-2 mb-4">
          {Object.entries(data?.summary?.byType || {}).map(([eventType, count]) => (
            <label key={eventType} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedTypes.length === 0 || selectedTypes.includes(eventType)}
                onCheckedChange={() => toggleEventType(eventType)}
              />
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: EVENT_COLORS[eventType] }}
              />
              <span className="flex-1">{formatEventType(eventType)}</span>
              <span className="text-gray-400">{count as number}</span>
            </label>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="text-xs text-gray-500 mb-2">Zoom</div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setZoomLevel((z) => Math.min(2, z + 0.25))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-x-auto">
        <div
          className="relative"
          style={{ minHeight: 400, transform: `scaleX(${zoomLevel})`, transformOrigin: "left" }}
        >
          {/* Year headers */}
          <div className="flex border-b mb-4">
            {years.map((year) => (
              <div
                key={year}
                className="flex-1 text-center text-sm font-medium py-2"
                style={{ minWidth: 200 }}
              >
                {year}
              </div>
            ))}
          </div>

          {/* Timeline track */}
          <div className="relative">
            {/* Horizontal line */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200" />

            {/* Events */}
            <div className="flex">
              {years.map((year) => (
                <div key={year} className="flex-1" style={{ minWidth: 200 }}>
                  <div className="relative pt-4">
                    {eventsByYear[year].map((event: any, index: number) => (
                      <TimelineEventNode
                        key={event.id}
                        event={event}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineEventNode({ event, index }: { event: any; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const topOffset = 40 + (index % 4) * 80;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={{ top: topOffset }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connector line */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gray-300"
        style={{ top: -topOffset + 32, height: topOffset - 32 }}
      />

      {/* Event dot */}
      <div
        className="w-4 h-4 rounded-full border-2 border-white shadow cursor-pointer"
        style={{ backgroundColor: EVENT_COLORS[event.type] || "#6b7280" }}
      />

      {/* Hover card */}
      {isHovered && (
        <div className="absolute left-1/2 -translate-x-1/2 top-6 z-10 w-64 bg-white rounded-lg shadow-lg p-3 border">
          <div className="text-xs text-gray-500 mb-1">
            {format(new Date(event.date), "MMM d, yyyy")}
          </div>
          <div className="text-sm font-medium line-clamp-2">{event.title}</div>
          {event.description && (
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {event.description}
            </div>
          )}
          <Link
            href={getEventLink(event)}
            className="text-xs text-blue-600 mt-2 block hover:underline"
          >
            View →
          </Link>
        </div>
      )}
    </div>
  );
}

function formatEventType(type: string): string {
  const labels: Record<string, string> = {
    source_published: "Published",
    source_cited: "Cited",
    argument_created: "Argument",
    deliberation_started: "Started",
    claim_made: "Claim",
    retraction: "Retraction",
    correction: "Correction",
  };
  return labels[type] || type;
}

function getEventLink(event: any): string {
  switch (event.entityType) {
    case "source":
      return `/sources/${event.entityId}`;
    case "deliberation":
      return `/deliberations/${event.entityId}`;
    case "argument":
      return `/arguments/${event.entityId}`;
    case "citation":
      return "#";
    default:
      return "#";
  }
}
```

### Timeline API Endpoint

```typescript
// app/api/timeline/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  buildSourceTimeline,
  buildDeliberationTimeline,
} from "@/lib/timeline/buildTimeline";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const sourceIdsParam = searchParams.get("sourceIds");

  if (!type || !id) {
    return NextResponse.json(
      { error: "type and id required" },
      { status: 400 }
    );
  }

  let timeline;

  switch (type) {
    case "deliberation":
      timeline = await buildDeliberationTimeline(id);
      break;
    case "source":
      timeline = await buildSourceTimeline([id]);
      break;
    case "stack":
      // Build from stack's sources
      const sourceIds = sourceIdsParam?.split(",") || [];
      timeline = await buildSourceTimeline(sourceIds);
      break;
    default:
      return NextResponse.json(
        { error: "Invalid type" },
        { status: 400 }
      );
  }

  return NextResponse.json(timeline);
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Source timeline builds | Source IDs → publication + citation events |
| Deliberation timeline builds | Deliberation ID → arguments + citations |
| Events sorted chronologically | Events appear in date order |
| Filter by event type | Toggle type → events filtered |
| Zoom works | Adjust zoom → timeline scales |
| Hover shows details | Hover event → card appears |
| Click navigates | Click link → goes to entity |

---

## 3.4.4 Opposing View Finder

**Priority**: P2 — Intellectual honesty  
**Estimated Effort**: 4-5 days  
**Risk Level**: Medium (requires good intent classification)

### Problem Statement

Confirmation bias is a major challenge in evidence-based discussions:
- Users naturally seek sources that support their views
- Counter-evidence is often overlooked
- Deliberations can become echo chambers

**Goal**: Actively surface sources and arguments that present opposing viewpoints, helping users engage with the strongest counter-arguments.

### Opposing View Detection

```typescript
// lib/opposingViews/findOpposingViews.ts

import { prisma } from "@/lib/prismaclient";

interface OpposingEvidence {
  id: string;
  type: "source" | "argument" | "citation";
  title: string;
  summary?: string;
  oppositionScore: number;  // How strongly it opposes
  oppositionReason: string;
  sourceUrl?: string;
}

interface OpposingViewsResult {
  forClaim: OpposingEvidence[];
  forArgument: OpposingEvidence[];
  fromOtherDeliberations: OpposingEvidence[];
  suggestions: string[];
}

export async function findOpposingViews(
  targetType: "claim" | "argument" | "deliberation",
  targetId: string
): Promise<OpposingViewsResult> {
  const result: OpposingViewsResult = {
    forClaim: [],
    forArgument: [],
    fromOtherDeliberations: [],
    suggestions: [],
  };

  if (targetType === "argument") {
    // Find counter-citations for this argument
    const argument = await prisma.argument.findUnique({
      where: { id: targetId },
      include: {
        citations: {
          where: { intent: { in: ["refutes", "challenges", "qualifies"] } },
          include: {
            source: {
              select: {
                id: true,
                title: true,
                abstract: true,
                url: true,
              },
            },
          },
        },
        // Get the conclusion to find opposing arguments
      },
    });

    if (argument) {
      // Existing refuting citations
      for (const citation of argument.citations) {
        result.forArgument.push({
          id: citation.id,
          type: "citation",
          title: citation.source.title,
          summary: citation.source.abstract?.slice(0, 200),
          oppositionScore: citation.intent === "refutes" ? 1 : 0.7,
          oppositionReason: `Cited as ${citation.intent}`,
          sourceUrl: citation.source.url || undefined,
        });
      }

      // Find other arguments with opposing conclusions
      const opposingArgs = await findOpposingArguments(argument);
      for (const oppArg of opposingArgs) {
        result.forArgument.push({
          id: oppArg.id,
          type: "argument",
          title: oppArg.conclusion || "Opposing argument",
          oppositionScore: oppArg.score,
          oppositionReason: oppArg.reason,
        });
      }
    }
  }

  if (targetType === "deliberation") {
    // For a deliberation, find sources used to refute across all arguments
    const deliberation = await prisma.deliberation.findUnique({
      where: { id: targetId },
      include: {
        citations: {
          where: { intent: "refutes" },
          include: {
            source: {
              select: { id: true, title: true, abstract: true, url: true },
            },
          },
        },
        arguments: {
          select: { id: true, conclusion: true },
        },
      },
    });

    if (deliberation) {
      // Get refuting sources
      for (const citation of deliberation.citations) {
        result.forClaim.push({
          id: citation.sourceId,
          type: "source",
          title: citation.source.title,
          summary: citation.source.abstract?.slice(0, 200),
          oppositionScore: 0.9,
          oppositionReason: "Used to refute a claim",
          sourceUrl: citation.source.url || undefined,
        });
      }

      // Find opposing views from other deliberations
      const otherOpposing = await findOpposingFromOtherDeliberations(
        targetId,
        deliberation.arguments.map((a) => a.conclusion).filter(Boolean) as string[]
      );
      result.fromOtherDeliberations = otherOpposing;
    }
  }

  // Generate suggestions for finding more opposing views
  result.suggestions = generateOpposingSearchSuggestions(targetType, targetId);

  return result;
}

async function findOpposingArguments(argument: any): Promise<
  Array<{ id: string; conclusion: string | null; score: number; reason: string }>
> {
  // Find arguments in the same deliberation that attack this one
  const attacks = await prisma.argumentAttack.findMany({
    where: {
      targetArgumentId: argument.id,
    },
    include: {
      attackingArgument: {
        select: { id: true, conclusion: true },
      },
    },
  });

  return attacks.map((attack) => ({
    id: attack.attackingArgument.id,
    conclusion: attack.attackingArgument.conclusion,
    score: 0.9,
    reason: `Attacks this argument (${attack.attackType})`,
  }));
}

async function findOpposingFromOtherDeliberations(
  deliberationId: string,
  claims: string[]
): Promise<OpposingEvidence[]> {
  // This would use semantic search to find opposing arguments in other deliberations
  // Simplified implementation: find refuting citations in related deliberations

  // Get topics from this deliberation's sources
  const citations = await prisma.citation.findMany({
    where: { deliberationId },
    include: { source: { select: { topics: true } } },
  });

  const topics = new Set<string>();
  for (const c of citations) {
    const t = (c.source.topics as string[]) || [];
    t.forEach((topic) => topics.add(topic));
  }

  if (topics.size === 0) return [];

  // Find other deliberations with same topics
  const otherSources = await prisma.source.findMany({
    where: {
      topics: { hasSome: Array.from(topics) },
    },
    select: { id: true },
  });

  const otherCitations = await prisma.citation.findMany({
    where: {
      sourceId: { in: otherSources.map((s) => s.id) },
      deliberationId: { not: deliberationId },
      intent: "refutes",
    },
    include: {
      source: { select: { id: true, title: true, abstract: true } },
      deliberation: { select: { title: true } },
    },
    take: 10,
  });

  return otherCitations.map((c) => ({
    id: c.id,
    type: "source" as const,
    title: c.source.title,
    summary: `Used to refute in "${c.deliberation?.title}"`,
    oppositionScore: 0.7,
    oppositionReason: "Counter-evidence from related discussion",
  }));
}

function generateOpposingSearchSuggestions(
  targetType: string,
  targetId: string
): string[] {
  // Generate search queries to help find opposing views
  return [
    "criticism of [topic]",
    "[topic] debunked",
    "problems with [topic]",
    "counter-arguments to [topic]",
    "[topic] limitations",
  ];
}
```

### Opposing Views Component

```tsx
// components/deliberation/OpposingViewFinder.tsx

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Scale, AlertTriangle, Search, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface OpposingViewFinderProps {
  targetType: "claim" | "argument" | "deliberation";
  targetId: string;
}

export function OpposingViewFinder({
  targetType,
  targetId,
}: OpposingViewFinderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["opposing-views", targetType, targetId],
    queryFn: () =>
      fetch(`/api/opposing-views?type=${targetType}&id=${targetId}`).then((r) =>
        r.json()
      ),
    enabled: isOpen,
  });

  const totalOpposing =
    (data?.forClaim?.length || 0) +
    (data?.forArgument?.length || 0) +
    (data?.fromOtherDeliberations?.length || 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Find Opposing Views
            {totalOpposing > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                {totalOpposing} found
              </span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-100 rounded" />
            <div className="h-16 bg-gray-100 rounded" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              Engaging with opposing views strengthens your argument. These are sources and arguments that challenge or contradict the current position.
            </div>

            {/* Opposing from current context */}
            {data?.forArgument?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Counter-Evidence ({data.forArgument.length})
                </h4>
                <div className="space-y-2">
                  {data.forArgument.map((item: any) => (
                    <OpposingViewCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {data?.forClaim?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Refuting Sources ({data.forClaim.length})
                </h4>
                <div className="space-y-2">
                  {data.forClaim.map((item: any) => (
                    <OpposingViewCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* From other deliberations */}
            {data?.fromOtherDeliberations?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  From Other Discussions ({data.fromOtherDeliberations.length})
                </h4>
                <div className="space-y-2">
                  {data.fromOtherDeliberations.map((item: any) => (
                    <OpposingViewCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Search suggestions */}
            {data?.suggestions?.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">
                  Search for More Counter-Evidence
                </h4>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Search academic databases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.suggestions.map((suggestion: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(suggestion)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {totalOpposing === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No opposing views found yet.</p>
                <p className="text-xs mt-1">
                  Try searching academic databases or add counter-evidence manually.
                </p>
              </div>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function OpposingViewCard({ item }: { item: any }) {
  return (
    <div className="p-3 border rounded-lg hover:border-amber-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-sm font-medium line-clamp-2">{item.title}</div>
          {item.summary && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {item.summary}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
              {item.oppositionReason}
            </span>
            <OppositionStrengthBadge score={item.oppositionScore} />
          </div>
        </div>

        <div className="flex gap-1">
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function OppositionStrengthBadge({ score }: { score: number }) {
  const strength = score >= 0.8 ? "Strong" : score >= 0.5 ? "Moderate" : "Weak";
  const color =
    score >= 0.8
      ? "text-red-600 bg-red-50"
      : score >= 0.5
        ? "text-amber-600 bg-amber-50"
        : "text-gray-600 bg-gray-50";

  return (
    <span className={`text-xs px-2 py-0.5 rounded ${color}`}>
      {strength}
    </span>
  );
}
```

### Opposing Views API

```typescript
// app/api/opposing-views/route.ts

import { NextRequest, NextResponse } from "next/server";
import { findOpposingViews } from "@/lib/opposingViews/findOpposingViews";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as "claim" | "argument" | "deliberation";
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json(
      { error: "type and id required" },
      { status: 400 }
    );
  }

  const opposingViews = await findOpposingViews(type, id);

  return NextResponse.json(opposingViews);
}
```

### Acceptance Criteria

| Criterion | Test |
|-----------|------|
| Finds refuting citations | Argument with refutes → appears in list |
| Finds attacking arguments | Argument attack exists → appears |
| Cross-deliberation search | Related delib has refutes → appears |
| Score reflects strength | Direct refute → higher score |
| Suggestions generated | View opens → search suggestions shown |
| Collapsible works | Toggle → panel expands/collapses |
| Links work | Click source → opens source |

---

## Phase 3.4 Completion Checklist

### Pre-Launch Requirements

| Item | Owner | Status |
|------|-------|--------|
| KnowledgeNode model + migration | Backend | ☐ |
| KnowledgeEdge model + migration | Backend | ☐ |
| Graph builder worker | Backend | ☐ |
| Graph query API | Backend | ☐ |
| Graph search API | Backend | ☐ |
| Knowledge graph explorer component | Frontend | ☐ |
| Similarity computation | Backend | ☐ |
| Related deliberations API | Backend | ☐ |
| Related stacks API | Backend | ☐ |
| Related deliberations component | Frontend | ☐ |
| Related stacks component | Frontend | ☐ |
| Timeline builder | Backend | ☐ |
| Timeline API | Backend | ☐ |
| Timeline visualization component | Frontend | ☐ |
| Opposing view finder | Backend | ☐ |
| Opposing views API | Backend | ☐ |
| Opposing view finder component | Frontend | ☐ |

### Testing Requirements

| Test Type | Coverage |
|-----------|----------|
| Unit tests | Graph query traversal |
| Unit tests | Similarity scoring |
| Unit tests | Timeline event generation |
| Unit tests | Opposition detection |
| Integration tests | Full graph build pipeline |
| Integration tests | Timeline from deliberation |
| E2E tests | Knowledge graph interaction |
| E2E tests | Timeline navigation |
| Performance tests | Large graph rendering |

### External Dependencies

| Dependency | Required | Notes |
|------------|----------|-------|
| D3.js | Yes | For graph and timeline visualizations |
| date-fns | Yes | For timeline date handling |

---

**Estimated Phase 3.4 Duration**: 3-4 weeks

---

*End of Part 7. Continue with Part 8 for Phase 3.5 (AI-Enhanced Features) and Final Summary.*
