# Phase 4.3: Academic Credit Integration

**Sub-Phase:** 4.3 of 4.3  
**Focus:** ORCID Integration, CV Export & Institutional Reporting

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| 4.3.1 | As a scholar, I want to link my ORCID, so my contributions are attributed correctly | P0 | M |
| 4.3.2 | As a scholar, I want to export my contributions to my CV, so I can show my work | P0 | M |
| 4.3.3 | As an institution, I want aggregate reports, so I can track faculty engagement | P1 | L |
| 4.3.4 | As a funding body, I want contribution data, so I can assess research impact | P1 | M |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   CREDIT INTEGRATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                                            │
│  │  ORCID Service  │                                            │
│  │  ────────────── │                                            │
│  │  • OAuth Flow   │                                            │
│  │  • Work Push    │                                            │
│  │  • Profile Sync │                                            │
│  └─────────────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              Contribution Data                       │        │
│  │  ┌───────────┬───────────┬───────────┬───────────┐ │        │
│  │  │ Arguments │ Reviews   │ Consensus │ Citations │ │        │
│  │  └───────────┴───────────┴───────────┴───────────┘ │        │
│  └─────────────────────────────────────────────────────┘        │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │   CV Export     │    │  Institutional  │                     │
│  │  ────────────── │    │    Reports      │                     │
│  │  • JSON-LD      │    │  ────────────── │                     │
│  │  • BibTeX       │    │  • Faculty      │                     │
│  │  • Word/PDF     │    │  • Department   │                     │
│  │  • LaTeX        │    │  • Aggregate    │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 4.3.1: ORCID Integration Schema

**File:** `prisma/schema.prisma` (additions)

```prisma
// ============================================================
// ORCID & EXTERNAL CREDIT INTEGRATION
// ============================================================

/// ORCID connection for a user
model OrcidConnection {
  id              String   @id @default(cuid())
  
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // ORCID identifiers
  orcidId         String   @unique @db.VarChar(50)  // e.g., "0000-0002-1234-5678"
  
  // OAuth tokens
  accessToken     String   @db.Text
  refreshToken    String?  @db.Text
  tokenExpiresAt  DateTime?
  
  // Sync settings
  autoSyncEnabled Boolean  @default(false)
  lastSyncAt      DateTime?
  syncErrors      Json?    // Array of error messages
  
  // Synced works tracking
  syncedWorks     OrcidWork[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

/// A work synced to ORCID
model OrcidWork {
  id              String   @id @default(cuid())
  
  connectionId    String
  connection      OrcidConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  
  // ORCID identifiers
  orcidPutCode    String?  @db.VarChar(50)  // ORCID's internal ID for this work
  
  // Local reference
  workType        OrcidWorkType
  sourceId        String   // ID of the local entity (argument, review, etc.)
  
  // Work metadata sent to ORCID
  title           String   @db.VarChar(500)
  description     String?  @db.Text
  workDate        DateTime
  externalUrl     String?  @db.VarChar(500)
  
  // Sync status
  syncStatus      SyncStatus @default(PENDING)
  syncedAt        DateTime?
  errorMessage    String?  @db.Text
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([connectionId, workType, sourceId])
  @@index([connectionId])
}

enum OrcidWorkType {
  SCHOLARLY_ARGUMENT    // A significant argument or position
  PEER_REVIEW          // Review contribution
  RESEARCH_SYNTHESIS   // Consensus or synthesis work
  CITATION             // Notable citation impact
}

enum SyncStatus {
  PENDING
  SYNCED
  FAILED
  DELETED
}

/// CV export record
model CvExport {
  id              String   @id @default(cuid())
  
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  // Export configuration
  format          ExportFormat
  dateRange       Json?    // { start, end }
  includeTypes    String[] @default([])  // Contribution types to include
  
  // Generated file
  fileUrl         String?  @db.VarChar(500)
  fileName        String   @db.VarChar(200)
  
  // Metadata
  contributionCount Int    @default(0)
  
  createdAt       DateTime @default(now())
  expiresAt       DateTime?
  
  @@index([userId])
}

enum ExportFormat {
  JSON_LD         // Structured data
  BIBTEX          // BibTeX format
  WORD            // Word document
  PDF             // PDF document
  LATEX           // LaTeX source
  CSV             // Spreadsheet
}

/// Institutional report
model InstitutionalReport {
  id              String   @id @default(cuid())
  
  // Scope
  institutionId   String?  // Organization ID, null for cross-institution
  departmentId    String?
  
  // Report period
  startDate       DateTime
  endDate         DateTime
  
  // Report type
  reportType      ReportType
  
  // Generated data
  data            Json     // Report payload
  summary         String?  @db.Text
  
  // File export
  fileUrl         String?  @db.VarChar(500)
  
  generatedBy     String
  generatedAt     DateTime @default(now())
  
  @@index([institutionId])
  @@index([startDate, endDate])
}

enum ReportType {
  FACULTY_CONTRIBUTIONS   // Per-faculty breakdown
  DEPARTMENT_SUMMARY      // Department aggregate
  INSTITUTION_OVERVIEW    // Full institution stats
  IMPACT_REPORT           // Citation and consensus impact
}
```

---

### Step 4.3.2: ORCID Service Types

**File:** `lib/credit/types.ts`

```typescript
/**
 * Types for academic credit integration
 */

export type OrcidWorkType =
  | "SCHOLARLY_ARGUMENT"
  | "PEER_REVIEW"
  | "RESEARCH_SYNTHESIS"
  | "CITATION";

export type SyncStatus = "PENDING" | "SYNCED" | "FAILED" | "DELETED";

export type ExportFormat =
  | "JSON_LD"
  | "BIBTEX"
  | "WORD"
  | "PDF"
  | "LATEX"
  | "CSV";

export type ReportType =
  | "FACULTY_CONTRIBUTIONS"
  | "DEPARTMENT_SUMMARY"
  | "INSTITUTION_OVERVIEW"
  | "IMPACT_REPORT";

export interface OrcidConnectionSummary {
  id: string;
  userId: string;
  orcidId: string;
  autoSyncEnabled: boolean;
  lastSyncAt?: Date;
  syncedWorkCount: number;
  hasErrors: boolean;
}

export interface OrcidWorkData {
  type: OrcidWorkType;
  sourceId: string;
  title: string;
  description?: string;
  workDate: Date;
  externalUrl?: string;
}

export interface CvExportOptions {
  format: ExportFormat;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeTypes?: string[];
  includeMetrics?: boolean;
}

export interface CvEntry {
  type: string;
  title: string;
  date: Date;
  description?: string;
  context?: string;  // Deliberation title
  metrics?: {
    citations?: number;
    consensusLevel?: number;
    impact?: number;
  };
  url?: string;
}

export interface InstitutionalReportData {
  period: {
    start: Date;
    end: Date;
  };
  totalContributors: number;
  totalContributions: number;
  byType: Record<string, number>;
  topContributors: Array<{
    userId: string;
    name: string;
    count: number;
    score: number;
  }>;
  impactMetrics: {
    totalCitations: number;
    consensusAchieved: number;
    reviewsCompleted: number;
  };
}
```

---

### Step 4.3.3: ORCID OAuth Service

**File:** `lib/credit/orcidService.ts`

```typescript
/**
 * Service for ORCID integration
 */

import { prisma } from "@/lib/prisma";
import { OrcidConnectionSummary, OrcidWorkData, OrcidWorkType } from "./types";

// ORCID API configuration
const ORCID_API_BASE = process.env.ORCID_API_BASE || "https://api.orcid.org/v3.0";
const ORCID_AUTH_URL = process.env.ORCID_AUTH_URL || "https://orcid.org/oauth";
const ORCID_CLIENT_ID = process.env.ORCID_CLIENT_ID!;
const ORCID_CLIENT_SECRET = process.env.ORCID_CLIENT_SECRET!;
const ORCID_REDIRECT_URI = process.env.ORCID_REDIRECT_URI!;

/**
 * Generate ORCID OAuth authorization URL
 */
export function getOrcidAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: ORCID_CLIENT_ID,
    response_type: "code",
    scope: "/activities/update /read-limited",
    redirect_uri: ORCID_REDIRECT_URI,
    state,
  });

  return `${ORCID_AUTH_URL}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeOrcidCode(code: string): Promise<{
  orcidId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch(`${ORCID_AUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: ORCID_CLIENT_ID,
      client_secret: ORCID_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: ORCID_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange ORCID code");
  }

  const data = await response.json();

  return {
    orcidId: data.orcid,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Connect user's ORCID account
 */
export async function connectOrcid(
  userId: string,
  code: string
): Promise<OrcidConnectionSummary> {
  const tokens = await exchangeOrcidCode(code);

  const connection = await prisma.orcidConnection.upsert({
    where: { userId },
    create: {
      userId,
      orcidId: tokens.orcidId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
    },
    update: {
      orcidId: tokens.orcidId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
    },
    include: {
      syncedWorks: true,
    },
  });

  return {
    id: connection.id,
    userId: connection.userId,
    orcidId: connection.orcidId,
    autoSyncEnabled: connection.autoSyncEnabled,
    lastSyncAt: connection.lastSyncAt || undefined,
    syncedWorkCount: connection.syncedWorks.length,
    hasErrors: !!connection.syncErrors,
  };
}

/**
 * Get user's ORCID connection
 */
export async function getOrcidConnection(
  userId: string
): Promise<OrcidConnectionSummary | null> {
  const connection = await prisma.orcidConnection.findUnique({
    where: { userId },
    include: {
      syncedWorks: true,
    },
  });

  if (!connection) return null;

  return {
    id: connection.id,
    userId: connection.userId,
    orcidId: connection.orcidId,
    autoSyncEnabled: connection.autoSyncEnabled,
    lastSyncAt: connection.lastSyncAt || undefined,
    syncedWorkCount: connection.syncedWorks.length,
    hasErrors: !!connection.syncErrors,
  };
}

/**
 * Refresh ORCID access token
 */
async function refreshOrcidToken(connection: any): Promise<string> {
  if (!connection.refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch(`${ORCID_AUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: ORCID_CLIENT_ID,
      client_secret: ORCID_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh ORCID token");
  }

  const data = await response.json();

  await prisma.orcidConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || connection.refreshToken,
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token;
}

/**
 * Push a work to ORCID
 */
export async function pushWorkToOrcid(
  userId: string,
  workData: OrcidWorkData
): Promise<void> {
  const connection = await prisma.orcidConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    throw new Error("ORCID not connected");
  }

  // Refresh token if needed
  let accessToken = connection.accessToken;
  if (
    connection.tokenExpiresAt &&
    connection.tokenExpiresAt < new Date(Date.now() + 60000)
  ) {
    accessToken = await refreshOrcidToken(connection);
  }

  // Convert to ORCID work format
  const orcidWork = formatOrcidWork(workData);

  // Push to ORCID
  const response = await fetch(
    `${ORCID_API_BASE}/${connection.orcidId}/work`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orcidWork),
    }
  );

  // Track the sync
  const putCode = response.headers.get("Location")?.split("/").pop();

  await prisma.orcidWork.upsert({
    where: {
      connectionId_workType_sourceId: {
        connectionId: connection.id,
        workType: workData.type,
        sourceId: workData.sourceId,
      },
    },
    create: {
      connectionId: connection.id,
      workType: workData.type,
      sourceId: workData.sourceId,
      orcidPutCode: putCode,
      title: workData.title,
      description: workData.description,
      workDate: workData.workDate,
      externalUrl: workData.externalUrl,
      syncStatus: response.ok ? "SYNCED" : "FAILED",
      syncedAt: response.ok ? new Date() : undefined,
      errorMessage: response.ok ? undefined : await response.text(),
    },
    update: {
      orcidPutCode: putCode,
      title: workData.title,
      description: workData.description,
      syncStatus: response.ok ? "SYNCED" : "FAILED",
      syncedAt: response.ok ? new Date() : undefined,
      errorMessage: response.ok ? undefined : await response.text(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to push work to ORCID: ${response.statusText}`);
  }
}

/**
 * Format work data for ORCID API
 */
function formatOrcidWork(workData: OrcidWorkData): object {
  const workType = mapWorkType(workData.type);

  return {
    title: {
      title: { value: workData.title },
    },
    type: workType,
    "publication-date": {
      year: { value: workData.workDate.getFullYear().toString() },
      month: {
        value: (workData.workDate.getMonth() + 1).toString().padStart(2, "0"),
      },
      day: { value: workData.workDate.getDate().toString().padStart(2, "0") },
    },
    "short-description": workData.description,
    url: workData.externalUrl ? { value: workData.externalUrl } : undefined,
    "external-ids": {
      "external-id": [
        {
          "external-id-type": "source-work-id",
          "external-id-value": workData.sourceId,
          "external-id-relationship": "self",
        },
      ],
    },
  };
}

/**
 * Map internal work type to ORCID work type
 */
function mapWorkType(type: OrcidWorkType): string {
  const mapping: Record<OrcidWorkType, string> = {
    SCHOLARLY_ARGUMENT: "OTHER",
    PEER_REVIEW: "PEER_REVIEW",
    RESEARCH_SYNTHESIS: "OTHER",
    CITATION: "OTHER",
  };
  return mapping[type];
}

/**
 * Sync all eligible contributions to ORCID
 */
export async function syncAllToOrcid(userId: string): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  const connection = await prisma.orcidConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    throw new Error("ORCID not connected");
  }

  // Get significant contributions
  const contributions = await getEligibleContributions(userId);

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const contrib of contributions) {
    try {
      await pushWorkToOrcid(userId, contrib);
      synced++;
    } catch (error) {
      failed++;
      errors.push(`${contrib.title}: ${(error as Error).message}`);
    }
  }

  // Update last sync time
  await prisma.orcidConnection.update({
    where: { id: connection.id },
    data: {
      lastSyncAt: new Date(),
      syncErrors: errors.length > 0 ? errors : null,
    },
  });

  return { synced, failed, errors };
}

/**
 * Get contributions eligible for ORCID sync
 */
async function getEligibleContributions(
  userId: string
): Promise<OrcidWorkData[]> {
  const works: OrcidWorkData[] = [];

  // Get consensus-reaching arguments
  const arguments_ = await prisma.argument.findMany({
    where: {
      userId,
      consensusLevel: { gte: 0.7 }, // High consensus
    },
    include: {
      deliberation: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  arguments_.forEach((arg) => {
    works.push({
      type: "SCHOLARLY_ARGUMENT",
      sourceId: arg.id,
      title: `Scholarly Argument: ${arg.summary.substring(0, 100)}`,
      description: arg.summary,
      workDate: arg.createdAt,
      externalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/argument/${arg.id}`,
    });
  });

  // Get completed reviews
  const reviews = await prisma.reviewerAssignment.findMany({
    where: {
      userId,
      status: "COMPLETED",
    },
    include: {
      review: true,
    },
    orderBy: { completedAt: "desc" },
    take: 20,
  });

  reviews.forEach((assignment) => {
    works.push({
      type: "PEER_REVIEW",
      sourceId: assignment.id,
      title: `Peer Review: ${assignment.review.targetTitle}`,
      workDate: assignment.completedAt || assignment.assignedAt,
      externalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/review/${assignment.reviewId}`,
    });
  });

  return works;
}
```

---

### Step 4.3.4: CV Export Service

**File:** `lib/credit/cvExportService.ts`

```typescript
/**
 * Service for exporting scholarly contributions to CV formats
 */

import { prisma } from "@/lib/prisma";
import { CvEntry, CvExportOptions, ExportFormat } from "./types";

/**
 * Generate CV export
 */
export async function generateCvExport(
  userId: string,
  options: CvExportOptions
): Promise<{ entries: CvEntry[]; formatted: string; fileName: string }> {
  // Gather contributions
  const entries = await gatherCvEntries(userId, options);

  // Format based on type
  let formatted: string;
  let fileName: string;

  switch (options.format) {
    case "JSON_LD":
      formatted = formatJsonLd(entries, userId);
      fileName = "contributions.jsonld";
      break;
    case "BIBTEX":
      formatted = formatBibTeX(entries);
      fileName = "contributions.bib";
      break;
    case "LATEX":
      formatted = formatLaTeX(entries);
      fileName = "contributions.tex";
      break;
    case "CSV":
      formatted = formatCsv(entries);
      fileName = "contributions.csv";
      break;
    default:
      formatted = JSON.stringify(entries, null, 2);
      fileName = "contributions.json";
  }

  // Record export
  await prisma.cvExport.create({
    data: {
      userId,
      format: options.format,
      dateRange: options.dateRange as any,
      includeTypes: options.includeTypes || [],
      fileName,
      contributionCount: entries.length,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return { entries, formatted, fileName };
}

/**
 * Gather CV entries from contributions
 */
async function gatherCvEntries(
  userId: string,
  options: CvExportOptions
): Promise<CvEntry[]> {
  const entries: CvEntry[] = [];

  const where: any = { userId };
  if (options.dateRange) {
    where.createdAt = {
      gte: options.dateRange.start,
      lte: options.dateRange.end,
    };
  }
  if (options.includeTypes && options.includeTypes.length > 0) {
    where.type = { in: options.includeTypes };
  }

  // Get contributions
  const contributions = await prisma.scholarContribution.findMany({
    where,
    include: {
      deliberation: { select: { title: true } },
      argument: { select: { summary: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get review completions
  const reviews = await prisma.reviewerAssignment.findMany({
    where: {
      userId,
      status: "COMPLETED",
      ...(options.dateRange && {
        completedAt: {
          gte: options.dateRange.start,
          lte: options.dateRange.end,
        },
      }),
    },
    include: {
      review: { select: { targetTitle: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  // Convert to CV entries
  contributions.forEach((c) => {
    const entry = contributionToCvEntry(c);
    if (entry) entries.push(entry);
  });

  reviews.forEach((r) => {
    entries.push({
      type: "Peer Review",
      title: `Review: ${r.review.targetTitle}`,
      date: r.completedAt || r.assignedAt,
      context: r.review.targetTitle,
    });
  });

  // Sort by date
  entries.sort((a, b) => b.date.getTime() - a.date.getTime());

  return entries;
}

/**
 * Convert contribution to CV entry
 */
function contributionToCvEntry(contribution: any): CvEntry | null {
  const typeLabels: Record<string, string> = {
    ARGUMENT_CREATED: "Scholarly Argument",
    CONSENSUS_ACHIEVED: "Consensus Contribution",
    ATTACK_INITIATED: "Critical Analysis",
    DEFENSE_PROVIDED: "Position Defense",
    CITATION_RECEIVED: "Citation",
  };

  const label = typeLabels[contribution.type];
  if (!label) return null;

  return {
    type: label,
    title:
      contribution.argument?.summary?.substring(0, 150) || contribution.type,
    date: contribution.createdAt,
    context: contribution.deliberation?.title,
  };
}

/**
 * Format as JSON-LD (Schema.org)
 */
function formatJsonLd(entries: CvEntry[], userId: string): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${process.env.NEXT_PUBLIC_APP_URL}/scholar/${userId}`,
    hasCredential: entries.map((entry) => ({
      "@type": "EducationalOccupationalCredential",
      credentialCategory: entry.type,
      name: entry.title,
      datePublished: entry.date.toISOString(),
      ...(entry.context && { description: `Context: ${entry.context}` }),
    })),
  };

  return JSON.stringify(jsonLd, null, 2);
}

/**
 * Format as BibTeX
 */
function formatBibTeX(entries: CvEntry[]): string {
  return entries
    .map((entry, index) => {
      const key = `contrib${index + 1}`;
      const year = entry.date.getFullYear();
      const month = entry.date
        .toLocaleString("en", { month: "short" })
        .toLowerCase();

      return `@misc{${key},
  title = {${escapeBibTeX(entry.title)}},
  year = {${year}},
  month = {${month}},
  note = {${entry.type}${entry.context ? ` in ${escapeBibTeX(entry.context)}` : ""}}
}`;
    })
    .join("\n\n");
}

function escapeBibTeX(text: string): string {
  return text.replace(/[{}&%$#_]/g, (match) => `\\${match}`);
}

/**
 * Format as LaTeX
 */
function formatLaTeX(entries: CvEntry[]): string {
  const sections: Record<string, CvEntry[]> = {};

  entries.forEach((entry) => {
    if (!sections[entry.type]) sections[entry.type] = [];
    sections[entry.type].push(entry);
  });

  let latex = `\\documentclass{article}
\\usepackage{enumitem}
\\begin{document}

\\section*{Scholarly Contributions}

`;

  Object.entries(sections).forEach(([type, items]) => {
    latex += `\\subsection*{${type}}\n\\begin{itemize}\n`;
    items.forEach((item) => {
      const date = item.date.toLocaleDateString("en", {
        year: "numeric",
        month: "short",
      });
      latex += `  \\item ${escapeLaTeX(item.title)} (${date})`;
      if (item.context) {
        latex += ` --- ${escapeLaTeX(item.context)}`;
      }
      latex += "\n";
    });
    latex += `\\end{itemize}\n\n`;
  });

  latex += `\\end{document}`;

  return latex;
}

function escapeLaTeX(text: string): string {
  return text.replace(/[&%$#_{}~^\\]/g, (match) => `\\${match}`);
}

/**
 * Format as CSV
 */
function formatCsv(entries: CvEntry[]): string {
  const headers = ["Type", "Title", "Date", "Context"];
  const rows = entries.map((e) => [
    e.type,
    `"${e.title.replace(/"/g, '""')}"`,
    e.date.toISOString().split("T")[0],
    e.context ? `"${e.context.replace(/"/g, '""')}"` : "",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
```

---

### Step 4.3.5: Institutional Report Service

**File:** `lib/credit/institutionalReportService.ts`

```typescript
/**
 * Service for generating institutional reports
 */

import { prisma } from "@/lib/prisma";
import { InstitutionalReportData, ReportType } from "./types";

/**
 * Generate institutional report
 */
export async function generateInstitutionalReport(
  reportType: ReportType,
  options: {
    institutionId?: string;
    departmentId?: string;
    startDate: Date;
    endDate: Date;
  }
): Promise<InstitutionalReportData> {
  const { institutionId, departmentId, startDate, endDate } = options;

  // Get users in scope
  const userWhere: any = {};
  if (institutionId) {
    userWhere.organizationMemberships = {
      some: { organizationId: institutionId },
    };
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    select: { id: true, name: true },
  });

  const userIds = users.map((u) => u.id);
  const userMap = new Map(users.map((u) => [u.id, u.name || "Unknown"]));

  // Get contributions in period
  const contributions = await prisma.scholarContribution.findMany({
    where: {
      userId: { in: userIds },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Aggregate by type
  const byType: Record<string, number> = {};
  contributions.forEach((c) => {
    byType[c.type] = (byType[c.type] || 0) + 1;
  });

  // Get per-user counts
  const userCounts: Record<string, number> = {};
  contributions.forEach((c) => {
    userCounts[c.userId] = (userCounts[c.userId] || 0) + 1;
  });

  // Get stats for scoring
  const stats = await prisma.scholarStats.findMany({
    where: { userId: { in: userIds } },
  });

  const scoreMap = new Map(stats.map((s) => [s.userId, s.reputationScore]));

  // Build top contributors
  const topContributors = Object.entries(userCounts)
    .map(([userId, count]) => ({
      userId,
      name: userMap.get(userId) || "Unknown",
      count,
      score: scoreMap.get(userId) || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Impact metrics
  const totalCitations = stats.reduce((sum, s) => sum + s.citationCount, 0);
  const consensusAchieved = byType.CONSENSUS_ACHIEVED || 0;
  const reviewsCompleted = byType.REVIEW_COMPLETED || 0;

  const reportData: InstitutionalReportData = {
    period: { start: startDate, end: endDate },
    totalContributors: new Set(contributions.map((c) => c.userId)).size,
    totalContributions: contributions.length,
    byType,
    topContributors,
    impactMetrics: {
      totalCitations,
      consensusAchieved,
      reviewsCompleted,
    },
  };

  // Store report
  await prisma.institutionalReport.create({
    data: {
      institutionId,
      departmentId,
      startDate,
      endDate,
      reportType,
      data: reportData as any,
      summary: generateReportSummary(reportData),
      generatedBy: "system",
    },
  });

  return reportData;
}

/**
 * Generate human-readable summary
 */
function generateReportSummary(data: InstitutionalReportData): string {
  const periodStr = `${data.period.start.toLocaleDateString()} - ${data.period.end.toLocaleDateString()}`;

  return `Report Period: ${periodStr}

Overview:
- ${data.totalContributors} active contributors
- ${data.totalContributions} total contributions

Impact Metrics:
- ${data.impactMetrics.totalCitations} citations received
- ${data.impactMetrics.consensusAchieved} consensus positions reached
- ${data.impactMetrics.reviewsCompleted} peer reviews completed

Top Contributor: ${data.topContributors[0]?.name || "N/A"} with ${data.topContributors[0]?.count || 0} contributions`;
}

/**
 * Get previous reports
 */
export async function getInstitutionalReports(
  institutionId?: string,
  limit = 10
) {
  return prisma.institutionalReport.findMany({
    where: institutionId ? { institutionId } : {},
    orderBy: { generatedAt: "desc" },
    take: limit,
  });
}

/**
 * Get comparative stats between periods
 */
export async function getComparativeStats(
  institutionId: string,
  currentPeriod: { start: Date; end: Date },
  previousPeriod: { start: Date; end: Date }
) {
  const [current, previous] = await Promise.all([
    generateInstitutionalReport("INSTITUTION_OVERVIEW", {
      institutionId,
      ...currentPeriod,
    }),
    generateInstitutionalReport("INSTITUTION_OVERVIEW", {
      institutionId,
      ...previousPeriod,
    }),
  ]);

  return {
    current,
    previous,
    changes: {
      contributionsChange:
        ((current.totalContributions - previous.totalContributions) /
          (previous.totalContributions || 1)) *
        100,
      contributorsChange:
        ((current.totalContributors - previous.totalContributors) /
          (previous.totalContributors || 1)) *
        100,
      citationsChange:
        ((current.impactMetrics.totalCitations -
          previous.impactMetrics.totalCitations) /
          (previous.impactMetrics.totalCitations || 1)) *
        100,
    },
  };
}
```

---

### Step 4.3.6: Credit API Routes

**File:** `app/api/credit/orcid/connect/route.ts`

```typescript
/**
 * ORCID connection endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getOrcidAuthUrl,
  connectOrcid,
  getOrcidConnection,
} from "@/lib/credit/orcidService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already connected
    const existing = await getOrcidConnection(session.user.id);
    if (existing) {
      return NextResponse.json(existing);
    }

    // Generate auth URL
    const state = Buffer.from(
      JSON.stringify({ userId: session.user.id, ts: Date.now() })
    ).toString("base64");

    const authUrl = getOrcidAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error with ORCID connection:", error);
    return NextResponse.json(
      { error: "Failed to process ORCID connection" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/credit/orcid/callback/route.ts`

```typescript
/**
 * ORCID OAuth callback
 */

import { NextRequest, NextResponse } from "next/server";
import { connectOrcid } from "@/lib/credit/orcidService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?orcid_error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?orcid_error=missing_params`
      );
    }

    // Decode state
    const { userId } = JSON.parse(Buffer.from(state, "base64").toString());

    // Connect ORCID
    await connectOrcid(userId, code);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?orcid_success=true`
    );
  } catch (error) {
    console.error("ORCID callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?orcid_error=connection_failed`
    );
  }
}
```

**File:** `app/api/credit/orcid/sync/route.ts`

```typescript
/**
 * Sync works to ORCID
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncAllToOrcid } from "@/lib/credit/orcidService";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncAllToOrcid(session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("ORCID sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync to ORCID" },
      { status: 500 }
    );
  }
}
```

**File:** `app/api/credit/export/route.ts`

```typescript
/**
 * CV export endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateCvExport } from "@/lib/credit/cvExportService";

const ExportSchema = z.object({
  format: z.enum(["JSON_LD", "BIBTEX", "WORD", "PDF", "LATEX", "CSV"]),
  dateRange: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    })
    .optional(),
  includeTypes: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const options = ExportSchema.parse(body);

    const result = await generateCvExport(session.user.id, {
      format: options.format,
      dateRange: options.dateRange
        ? {
            start: new Date(options.dateRange.start),
            end: new Date(options.dateRange.end),
          }
        : undefined,
      includeTypes: options.includeTypes,
    });

    // Return as downloadable file
    return new NextResponse(result.formatted, {
      headers: {
        "Content-Type": getContentType(options.format),
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate export" },
      { status: 500 }
    );
  }
}

function getContentType(format: string): string {
  const types: Record<string, string> = {
    JSON_LD: "application/ld+json",
    BIBTEX: "application/x-bibtex",
    LATEX: "application/x-latex",
    CSV: "text/csv",
    WORD: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    PDF: "application/pdf",
  };
  return types[format] || "text/plain";
}
```

**File:** `app/api/credit/reports/route.ts`

```typescript
/**
 * Institutional reports endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  generateInstitutionalReport,
  getInstitutionalReports,
} from "@/lib/credit/institutionalReportService";

const GenerateReportSchema = z.object({
  reportType: z.enum([
    "FACULTY_CONTRIBUTIONS",
    "DEPARTMENT_SUMMARY",
    "INSTITUTION_OVERVIEW",
    "IMPACT_REPORT",
  ]),
  institutionId: z.string().optional(),
  departmentId: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get("institutionId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "10");

    const reports = await getInstitutionalReports(institutionId, limit);

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
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
    const input = GenerateReportSchema.parse(body);

    const report = await generateInstitutionalReport(input.reportType, {
      institutionId: input.institutionId,
      departmentId: input.departmentId,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
```

---

## Phase 4.3 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | ORCID schema | `prisma/schema.prisma` | ✅ |
| 2 | CV export schema | `prisma/schema.prisma` | ✅ |
| 3 | Institutional report schema | `prisma/schema.prisma` | ✅ |
| 4 | Credit types | `lib/credit/types.ts` | ✅ |
| 5 | ORCID service | `lib/credit/orcidService.ts` | ✅ |
| 6 | CV export service | `lib/credit/cvExportService.ts` | ✅ |
| 7 | Institutional report service | `lib/credit/institutionalReportService.ts` | ✅ |
| 8 | ORCID connect API | `app/api/credit/orcid/connect/route.ts` | ✅ |
| 9 | ORCID callback API | `app/api/credit/orcid/callback/route.ts` | ✅ |
| 10 | ORCID sync API | `app/api/credit/orcid/sync/route.ts` | ✅ |
| 11 | Export API | `app/api/credit/export/route.ts` | ✅ |
| 12 | Reports API | `app/api/credit/reports/route.ts` | ✅ |

---

## Phase 4 Complete Summary

| Sub-Phase | Description | Parts | Status |
|-----------|-------------|-------|--------|
| 4.1 | Public Peer Review Deliberations | 4 | ✅ |
| 4.2 | Argumentation-Based Reputation | 3 | ✅ |
| 4.3 | Academic Credit Integration | 1 | ✅ |

---

## Key Integrations

### ORCID
- OAuth 2.0 flow for connection
- Work push API for syncing contributions
- Auto-sync option for continuous updates

### CV Export
- JSON-LD (Schema.org) for structured data
- BibTeX for academic citations
- LaTeX for document preparation
- CSV for spreadsheet analysis

### Institutional Reports
- Faculty contribution tracking
- Department aggregation
- Impact metrics
- Comparative period analysis

---

*End of Phase 4.3 — Phase 4 Complete*
