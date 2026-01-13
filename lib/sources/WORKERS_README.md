# Source Trust Infrastructure Workers

> **Phase 3.1 Implementation**  
> **Status**: Implemented, disabled during pre-launch development  
> **Location**: `workers/sourceVerification.ts`, `workers/sourceArchiving.ts`

---

## Overview

The Source Trust Infrastructure includes two BullMQ workers that handle background processing for source verification and archiving. These workers are **disabled by default** during the pre-launch phase but are fully implemented and ready for production.

## Workers

### 1. Source Verification Worker (`workers/sourceVerification.ts`)

**Purpose**: Verify source URLs are accessible, detect redirects, broken links, and paywalled content.

**Queue Name**: `source-verification`

**Job Types**:
- `verify-new` - High priority, triggered when a new source is created
- `verify-updated` - High priority, triggered when a source URL is updated
- `verify-now` - Highest priority, user-initiated verification
- `recheck` - Low priority, scheduled re-verification of stale sources

**Concurrency**: 10 concurrent jobs

**What it does**:
1. Fetches the source from the database
2. Calls `verifySourceById()` from `lib/sources/verification.ts`
3. Updates the source with verification status (verified, broken, paywalled, etc.)
4. Logs warnings for broken sources (future: trigger alerts)

### 2. Source Archiving Worker (`workers/sourceArchiving.ts`)

**Purpose**: Archive sources to the Wayback Machine for permanent access.

**Queue Name**: `source-archiving`

**Job Types**:
- `archive-new` - Normal priority, triggered after source creation (with delay)
- `archive-updated` - Normal priority, triggered when source URL changes
- `archive-now` - Highest priority, user-initiated archiving

**Concurrency**: 5 concurrent jobs (lower to be respectful to archive.org)

**What it does**:
1. Fetches the source from the database
2. Calls `archiveSourceById()` from `lib/sources/archiving.ts`
3. Checks for existing Wayback Machine archives
4. Requests new archive if needed
5. Updates source with archive URL and status

---

## Enabling the Workers

### Step 1: Uncomment worker imports

In `workers/index.ts`, uncomment the Phase 3.1 worker imports:

```typescript
// Phase 3.1: Source Trust Infrastructure workers
import "@/workers/sourceVerification";
import "@/workers/sourceArchiving";
```

### Step 2: Start the worker process

```bash
npm run worker
# or for development with hot reload:
npm run watch:worker
```

### Step 3: Verify workers are running

You should see these log messages:
```
[source-verification] Worker started
[source-archiving] Worker started
All workers bootstrapped
```

---

## Queue Management

### Adding jobs to queues

Use the trigger functions in `lib/sources/triggers.ts`:

```typescript
import { 
  onSourceCreated,
  onSourceUrlUpdated,
  verifySourceNow,
  archiveSourceNow,
  queueStaleSourcesForReverification,
} from "@/lib/sources/triggers";

// When a new source is created
await onSourceCreated(sourceId);

// When a source URL is updated
await onSourceUrlUpdated(sourceId);

// User clicks "Verify Now" button
await verifySourceNow(sourceId);

// User clicks "Archive" button
await archiveSourceNow(sourceId);

// Batch reverification (called by cron job)
await queueStaleSourcesForReverification(sourceIds);
```

### Direct queue access

```typescript
import { 
  sourceVerificationQueue, 
  sourceArchivingQueue 
} from "@/lib/queue";

// Add a verification job
await sourceVerificationQueue.add(
  "verify",
  { sourceId: "xxx", isRecheck: false },
  { priority: 1 }
);

// Add an archiving job
await sourceArchivingQueue.add(
  "archive",
  { sourceId: "xxx", strategy: "wayback" },
  { delay: 30000 }
);
```

---

## Scheduled Tasks (Cron)

The workers work together with the cron job at `/api/_cron/source_health`:

```bash
# Manual trigger
curl http://localhost:3000/api/_cron/source_health

# With options
curl -X POST http://localhost:3000/api/_cron/source_health \
  -H "Content-Type: application/json" \
  -d '{"reverificationLimit": 100, "retractionLimit": 20}'
```

**Recommended cron schedule**: Run nightly via Vercel Cron or external scheduler.

---

## Environment Variables

None required for basic functionality. Optional:

| Variable | Purpose |
|----------|---------|
| `RETRACTION_WATCH_API_KEY` | Access to Retraction Watch database for comprehensive retraction checking |

---

## Monitoring

### Queue status

Use BullMQ Board or check queue stats programmatically:

```typescript
import { sourceVerificationQueue } from "@/lib/queue";

const counts = await sourceVerificationQueue.getJobCounts();
console.log(counts);
// { waiting: 5, active: 2, completed: 100, failed: 1 }
```

### Worker logs

Workers log to console with prefixes:
- `[source-verification]` - Verification worker logs
- `[source-archiving]` - Archiving worker logs
- `[source-triggers]` - Trigger function logs

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API / UI Triggers                         │
├─────────────────────────────────────────────────────────────────┤
│  • Source creation (onSourceCreated)                             │
│  • URL update (onSourceUrlUpdated)                               │
│  • User action (verifySourceNow, archiveSourceNow)               │
│  • Cron job (/api/_cron/source_health)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Redis Queues                             │
├─────────────────────────────────────────────────────────────────┤
│  • source-verification (BullMQ)                                  │
│  • source-archiving (BullMQ)                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Workers                                  │
├─────────────────────────────────────────────────────────────────┤
│  • sourceVerification.ts (concurrency: 10)                       │
│  • sourceArchiving.ts (concurrency: 5)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Library Functions                          │
├─────────────────────────────────────────────────────────────────┤
│  • lib/sources/verification.ts → verifySourceById()              │
│  • lib/sources/archiving.ts → archiveSourceById()                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database + External                       │
├─────────────────────────────────────────────────────────────────┤
│  • PostgreSQL (Source model updates)                             │
│  • Wayback Machine API (archive.org)                             │
│  • CrossRef API (retraction checking)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Files

| File | Purpose |
|------|---------|
| `workers/sourceVerification.ts` | Verification worker |
| `workers/sourceArchiving.ts` | Archiving worker |
| `lib/queue.ts` | Queue definitions |
| `lib/sources/verification.ts` | Verification logic |
| `lib/sources/archiving.ts` | Archiving logic |
| `lib/sources/triggers.ts` | Trigger functions |
| `lib/sources/retractionCheck.ts` | Retraction checking |
| `lib/sources/alerts.ts` | Alert system |
| `app/api/_cron/source_health/route.ts` | Cron endpoint |
| `app/api/sources/[id]/verify/route.ts` | Verification API |
| `app/api/sources/[id]/archive/route.ts` | Archive API |
| `app/api/sources/[id]/retraction/route.ts` | Retraction API |
| `app/api/sources/alerts/route.ts` | Alerts API |
