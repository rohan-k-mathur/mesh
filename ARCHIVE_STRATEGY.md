# Archive Strategy: Git Branch + Staged Pruning

> **Goal:** Separate the Mesh codebase into a focused discourse platform for production deployment on Vercel, while preserving all exploratory/alpha features in a permanent archive branch.
>
> Archive first, then phases. Here's why:

The dependency chain makes the order obvious
Phase 0 (Security) — Do this immediately, in parallel with starting the archive. It's a few hours of work and the fixes are completely independent. Don't ship anything publicly without it.

Archive Strategy (Waves 1-5) — Do this before Phase 1 (Build Health). If you flip ignoreBuildErrors: false first, you'll spend days fixing type errors in code you're about to delete. The archive removes ~25-30% of API routes, ~50 Prisma models, ~20 dependencies, and 6 workers. Every downstream phase gets easier:

Phase 1 has hundreds fewer type errors to triage
Phase 2 has fewer API routes to configure maxDuration for, fewer crons, fewer env vars
Phase 4 bundle optimization gets a massive head start (Three.js, pixi, reactflow v11, ace-builds, chart.js all gone)
The Prisma client shrinks, helping Vercel function size limits
Phases 1-5 — Execute in order on the now-leaner codebase.

Optimal combined timeline

Week 1:     Phase 0 (security, ~1 day) + Archive Wave 1 (clean cuts, ~1 day)
Week 1-2:   Archive Waves 2-3 (medium + reactflow entanglement)
Week 2:     Archive Waves 4-5 (prisma schema + deps) → commit pruned codebase
Week 3-4:   Phase 1 (build health — flip ignoreBuildErrors, fix remaining type errors)
Week 4:     Phase 2 (Vercel config) + Phase 3 (worker deployment)
Week 5:     Phase 4 (bundle/perf) + Phase 5 (observability/CI)
Week 6:     Staging deploy + smoke tests → production cutover

The one thing you should NOT do during archiving
Don't flip ignoreBuildErrors: false until the archive is complete. Keep it true during Waves 1-5 so you can delete freely without the build fighting you on cascading type errors from removed imports. Once the codebase is pruned and stable, then flip it and deal with the real errors that remain.

Start right now
Phase 0 + Archive Wave 1 can both begin today. Want me to start with the Phase 0 security fixes (gating the debug endpoints, locking CORS, stripping localhost fallbacks) while we're fresh? That's the most urgent since it blocks any preview/staging deploys.

---

## Table of Contents

1. [Snapshot & Branch Strategy](#1-snapshot--branch-strategy)
2. [Features: Keep vs Archive](#2-features-keep-vs-archive)
3. [Wave 1 — Clean Cuts](#3-wave-1--clean-cuts)
4. [Wave 2 — Medium Entanglement](#4-wave-2--medium-entanglement)
5. [Wave 3 — ReactFlow Deep Entanglement](#5-wave-3--reactflow-deep-entanglement)
6. [Wave 4 — Prisma Schema & Database](#6-wave-4--prisma-schema--database)
7. [Wave 5 — Dependency Cleanup](#7-wave-5--dependency-cleanup)
8. [Workers After Pruning](#8-workers-after-pruning)
9. [Cross-Reference Index](#9-cross-reference-index)
10. [Projected Impact](#10-projected-impact)
11. [Execution Checklist](#11-execution-checklist)

---

## 1. Snapshot & Branch Strategy

### Step 1 — Create the permanent archive branch

```bash
git checkout main
git checkout -b archive/alpha-full-features
git push origin archive/alpha-full-features
```

This branch **permanently preserves every feature** at its current state. Any feature can be revived later by cherry-picking or checking out specific paths from this branch.

### Step 2 — Create the production pruning branch

```bash
git checkout main
git checkout -b production/discourse-core
```

All deletion work happens here. After validation (build passes, lint passes, smoke tests), merge into `main`.

### Step 3 — Tag for reference

```bash
git tag alpha-complete archive/alpha-full-features
git push origin alpha-complete
```

### Why not `_archive/` folders?

- Bloats the deployed bundle (Vercel deploys everything in the repo)
- Confuses TypeScript / import resolution
- Dead code still gets type-checked and linted
- Migration files in an archive folder still get picked up by Prisma

---

## 2. Features: Keep vs Archive

### KEEP — Discourse Platform Core

| Feature Area | Description |
|---|---|
| **Articles** | Long-form content, article editor, article templates |
| **Messaging** | Direct messages, conversations |
| **Discussions** | Threaded discussion forums |
| **Chat** | Real-time chat rooms |
| **Deliberations** | Structured deliberation processes |
| **Thesis** | Thesis composition and defense |
| **Argumentation Engine** | Arguments, attacks, schemes, ASPIC+, AIF framework |
| **Ludics** | Game-theoretic dialogue and interaction logic |
| **Stacks** | Content stacks / collections |
| **Agora** | Public discourse space |
| **Claims & Evidence** | Claim management, evidence linking, citations |
| **Sources** | Source management, verification, archiving |
| **Proposals & Propositions** | Formal proposal system |
| **Sheaf / ACL** | Access control layer (`@app/sheaf-acl` package) |
| **Dialogue System** | Dialogue moves, actions, protocols |
| **Knowledge Graph** | Knowledge edges, graph building |
| **Annotations** | Content annotation system |
| **Feed & Posts** | Core feed (minus archived post types) |
| **Rooms** | Real-time collaboration rooms (minus canvas) |
| **Notifications** | Notification system |
| **Auth / Users / Settings** | Firebase auth, user profiles, settings |
| **Stripe** | Subscriptions/payments (if used for platform access) |
| **Blocks / Briefs** | Content blocks, briefs system |
| **Ledger / Credit** | Reputation/credit ledger |
| **Prediction Markets & Polls** | Kept for launch — lightweight, useful for discourse engagement |
| **Product Reviews** | Kept for launch — lightweight, useful for content quality |

### ARCHIVE — Exploratory Features

| Feature | Reason for Archive |
|---|---|
| **Swapmeet** | Marketplace/trading — not discourse |
| **Group-Halfway** | Meet-up location finder — not discourse |
| **Portfolio Builder** | Personal site builder — not discourse |
| **Workflow/Automation Builder** | Visual automation — not discourse |
| **ReactFlow Social Media Canvas** | Old v11 canvas for rooms (keep `@xyflow/react` v12 for argument chains) |
| **Spotify Integration** | Music/taste profiling — not discourse |
| **Three.js 3D Backgrounds** | Visual polish — not needed for launch |
| **Social Discovery Engine** | Recommendation/matching (candidate-builder, KNN, taste vectors) |
| **Polls** | Quick polls in chat — can revisit post-launch |
| **Word Games** | Any game-related features |

---

## 3. Wave 1 — Clean Cuts

> **Estimated effort: ~1 day**
> These features are self-contained with minimal cross-references (1-5 files to untangle).

### 3.1 Group-Halfway

**Delete:**
```
app/group-halfway/                          # layout.tsx, [id]/page.tsx, [id]/wizard.tsx
app/(root)/(standard)/halfway/              # page.tsx
app/api/group-halfway/                      # create, heatmap, info, origins, vote routes
components/GroupHalfwayMap.tsx
```

**Untangle:**

| File | Change |
|---|---|
| `app/(root)/(standard)/applications/page.tsx` | Remove `gotohalfway()` / `router.push("/halfway")` link |

**Prisma models to mark for Wave 4:** `GroupHalfway`, `HalfwayOrigin`, `HalfwayVote` (if they exist)

---

### 3.2 Three.js Backgrounds

**Delete:**
```
components/threejs/                         # BackgroundCanvas.tsx, backdropPlane/*
```

**Untangle:**

| File | Change |
|---|---|
| `app/(auth)/register/page.tsx` | Remove `import BackgroundCanvas` and `<BackgroundCanvas />` render |
| `app/(auth)/login/page.tsx` | Remove commented-out `BackgroundCanvas` import if present |

**Deps to mark for Wave 5:** `@react-three/drei`, `@react-three/fiber`, `three`, `glsl-noise`, `glslify`, `glslify-loader`, `raw-loader`

**Note:** Also remove the webpack rule for `.glsl|.vs|.fs|.vert|.frag` files in `next.config.mjs` if no other code uses shaders.

---

### 3.3 Swapmeet

**Delete:**
```
# App routes
app/swapmeet/                               # All pages, layouts, components, local API routes

# API routes
app/api/swapmeet/                           # spawn, orders
app/api/stall/                              # [id]/doc, [id]/heat
app/api/stalls/                             # [stallId]/events, items, checkout
app/api/auction/                            # create, bid, finalize, [id], [id]/events
app/api/cart/                               # add, checkout, count, expire, release, view
app/api/escrow/                             # release
app/api/_cron/close_auctions/               # Cron route

# Components
components/CartButton.tsx
components/cart/CartDrawer.tsx
components/forms/StallForm.tsx
components/cards/ImageCard.tsx              # Comment header says swapmeet

# Lib / Actions / Stores / Hooks
lib/actions/stall.server.ts
lib/actions/auction.server.ts
lib/actions/cart.server.ts
lib/actions/offerCart.server.ts
lib/validations/stall.ts
lib/stores/cart.ts
hooks/useStallPresence.ts
hooks/useMarket.ts

# Workers
workers/sectionHeat.ts

# Services
services/swapmeet-api/                      # Entire directory

# Static assets
public/placeholder-stall.svg
public/assets/shopping--cart--arrow-down.svg
public/assets/shopping--cart--plus.svg
```

**Untangle:**

| File | Change |
|---|---|
| `middleware.ts` (L77) | Remove `if (pathname.startsWith("/portfolio/")) return NextResponse.next();` |
| `middleware.ts` (L105-110) | Remove the `/swapmeet` redirect block in `handleValidToken` |
| `lib/payouts.server.ts` (L19) | Remove Stripe URLs referencing `/swapmeet/stripe/refresh` and `/swapmeet/stripe/return` |
| `vercel.json` | Remove `close_auctions` cron entry |
| `workers/index.ts` | Remove `import "@/workers/sectionHeat"` |
| `tsconfig.json` | Remove `"swapmeet-api"` path mapping |

**Prisma models for Wave 4:** `Stall`, `StallItem`, `StallOffer`, `StallOrder`, `MarketSection`, `SectionHeatSnapshot`, `CartItem`, `EscrowHold`, `Auction`, `AuctionBid`

---

### 3.4 Spotify Integration

**Delete:**
```
# App routes
app/spotify/                                # layout.tsx, callback/page.tsx, DashboardCharts.tsx

# API routes
app/api/v2/favorites/import/spotify/        # route.ts, status, summary
app/api/v2/favorites/spotify/               # status, summary

# Lib
lib/spotify.ts
lib/spotifyServer.ts
lib/spotifyClient.ts

# Workers
workers/spotifyIngest.ts
workers/reembedFromSpotify.ts

# Scripts
scripts/mockSpotifyRaw.ts

# Tests
tests/spotify.test.ts
```

**Untangle:**

| File | Change |
|---|---|
| `workers/index.ts` | Remove `import '@/workers/spotifyIngest'` and `import '@/workers/reembedFromSpotify'` (if present) |
| `lib/queue.ts` (L18) | Remove `spotifyIngestQueue` |
| `app/(pages)/settings/integrations/SpotifyButton.tsx` | Delete file |
| `app/(pages)/settings/integrations/page.tsx` | Remove Spotify section (logo + label) |
| `app/api/v2/music/candidates/route.ts` | Remove `import { refreshToken } from "@/lib/spotify"` and Spotify API calls — or delete entire route if music candidates are archive-only |

**Deps for Wave 5:** Check if `chart.js` / `react-chartjs-2` are only used by Spotify dashboard charts.

---

## 4. Wave 2 — Medium Entanglement

> **Estimated effort: ~2-3 days**
> These features have 8-20 cross-references each, mostly in shared types, feed actions, and post rendering.
>
> **Decision (2026-03-02):** Waves 2.1 (Prediction Markets & Polls) and 2.4 (Product Reviews) are **SKIPPED** — these features are lightweight and will be kept for launch. Only 2.2, 2.3, and 2.5 are executed.

### 4.1 Prediction Markets & Polls — SKIPPED (keeping for launch)

**Delete:**
```
# API routes
app/api/market/                             # route.ts, [id]/, [id]/trade, [id]/resolve
app/api/predictions/                        # route.ts, [id]/, [id]/resolve, [id]/outcome
app/api/claims/[id]/predictions/            # route.ts
app/api/deliberations/[id]/predictions/     # route.ts
app/api/users/[id]/prediction-stats/        # route.ts
app/api/polls/                              # route.ts, [id]/vote, query

# Components
components/predictions/                     # PredictionCard, Creator, Badge, Section, OutcomeRecorder, ResolutionModal, Stats, index
components/cards/PredictionMarketCard.tsx
components/modals/ResolveMarketDialog.tsx
components/modals/TradePredictionModal.tsx 
components/forms/CreatePredictionPost.tsx
components/chat/PollChip.tsx
components/chat/QuickPollComposer.tsx
components/chat/QuickPollModal.tsx

# Lib
lib/prediction/                             # lmsr.ts, tradePreview.ts
lib/actions/prediction.actions.ts
lib/actions/poll.actions.ts
lib/claims/prediction-service.ts
lib/types/prediction.ts
lib/types/claim-prediction.ts
types/poll.ts

# Scripts
scripts/closeMarkets.ts

# Tests. 
tests/prediction.service.test.ts
tests/prediction/                           # All prediction test files
tests/tradePreview.test.ts
```

**Untangle (shared code — requires careful edits):**

| File | Change |
|---|---|
| `lib/types/post.ts` (L44) | Remove `predictionMarket?: any` field |
| `lib/transform/post.ts` (L20, L52) | Remove `predictionMarket` transform logic |
| `components/cards/PostCard.tsx` (L85, L424-427) | Remove `predictionMarket` prop, remove `<PredictionMarketCard>` render block |
| `lib/actions/feed.actions.ts` (L171, 191, 212, 280) | Remove `prisma.predictionMarket.deleteMany` in feed cleanup |

**Prisma models for Wave 4:** `PredictionMarket`, `PredictionTrade`, `PredictionOutcome`, `Poll`, `PollVote`, `PollOption`

---

### 4.2 Workflow / Automation Builder

**Delete:**
```
# App routes
app/(root)/(standard)/workflows/            # page, new, [id], templates, example, click-counter

# API routes
app/api/workflows/                          # route.ts, [id]/, [id]/runs
app/api/workflow-broadcast/                 # route.ts
app/api/triggers/                           # webhook/[workflowId]/[secret]

# Components
components/workflow/                        # WorkflowBuilder, Viewer, Runner, SidePanel, ExecutionContext,
                                            # CustomNodes, DynamicForm, IntegrationButtons, NewWorkflowClient,
                                            # ScheduleForm, TemplatePicker, examples/*
components/forks/MergeWorkflow.tsx

# Lib
lib/workflow/                               # bootstrap.server.ts, registry.ts, registry.compat.ts,
                                            # registry.defaults.ts, runner.ts, types.ts, vars.ts
lib/actions/workflow.actions.ts
lib/actions/scheduledWorkflow.actions.ts
lib/workflowActions.ts
lib/workflowTriggers.ts
lib/workflowExecutor.ts
lib/workflowScheduler.ts
lib/workflowSocketRunner.ts
lib/workflowAnalytics.ts
lib/registerDefaultWorkflowActions.ts
lib/registerDefaultWorkflowTriggers.ts
lib/registerIntegrationTriggerTypes.ts
lib/registerIntegrationTriggers.ts
lib/registerIntegrationActions.ts

# Docs
docs/workflows.md
docs/integration_automation_notes.md

# Tests
tests/workflowActions.integration.test.ts
tests/workflowExecution.test.ts
tests/workflowTriggers.test.ts
tests/workflowRunner.test.tsx
tests/workflowBuilder.test.tsx
tests/analyticsWorkflow.test.ts
tests/listWorkflows.test.ts
tests/registerDefaultWorkflowActions.test.ts
tests/integration/dialogue-workflow.test.ts
```

**Note on `lib/sources/triggers.ts` and `lib/triggers/`:** These files may serve both workflow triggers AND core discourse triggers (e.g., citation triggers, knowledge graph triggers). **Audit before deleting** — if they are only used by the workflow system, delete; if they also serve core event-driven logic, keep and remove only workflow-specific exports.

**Untangle:**

| File | Change |
|---|---|
| `components/shared/LeftSidebar.tsx` (L69) | Remove `router.push("/workflows/new")` link |
| `app/(root)/(standard)/applications/page.tsx` (L29) | Remove `router.push("/workflows/new")` link |

**Prisma models for Wave 4:** `Workflow`, `WorkflowRun`, `WorkflowSchedule`, `WorkflowTrigger`, `WorkflowAction`

---

### 4.3 Social Discovery Engine

**Delete:**
```
# API routes
app/api/v2/discovery/                       # candidates, feedback, why/[targetId]
app/api/recommendations/                    # route.ts, click

# Components
components/Discovery/CardStack.tsx

# Workers
workers/candidate-builder.ts
workers/tasteVector.ts
workers/user-knn-builder.ts

# Lib
lib/actions/recommendation.actions.ts
util/taste.ts

# Scripts
scripts/knnHealthCheck.ts
scripts/debugTaste.ts
scripts/enqueueTaste.ts
sql/taste_neighbours.sql
```

**Untangle:**

| File | Change |
|---|---|
| `workers/index.ts` | Remove `import '@/workers/tasteVector'`, `import "@/workers/candidate-builder"`, `import "@/workers/user-knn-builder"` |
| `lib/queue.ts` (L20-22) | Remove `tasteVectorQueue`, `candidateBuilderQueue`, `userKnnQueue` |
| `lib/pineconeClient.ts` (L18) | Remove `knnPgvector` function and `knn_user_vectors` RPC call |
| `lib/actions/friend-suggestions.actions.ts` (L8, 59, 81) | Remove `knnPgvector` import and calls — replace with simpler friend suggestion logic or stub |

**Prisma models for Wave 4:** `UserSimilarityKnn`, `TasteVector`, `DiscoveryCandidate`, `DiscoveryFeedback`

---

### 4.4 Product Reviews — SKIPPED (keeping for launch)

**Delete:**
```
# API routes
app/api/review/                             # All nested routes (route.ts, [reviewId]/*, assignments/*)
app/api/reputation/reviewer/                # [userId]/

# Components
components/review/                          # ReviewDashboard, Actions, Panel, InviteDialog, Timeline, Commitment, AuthorResponse, index
components/cards/ProductReviewCard.tsx
components/nodes/ProductReviewNode.tsx
components/forms/ProductReviewNodeForm.tsx
components/modals/ProductReviewNodeModal.tsx
components/reputation/ReviewerStats.tsx
components/issues/NCMReviewCard.tsx

# Lib
lib/review/                                 # reviewService, assignmentService, authorResponseService, commitmentService, progressService, templateService, hooks, index, types
lib/actions/productreview.actions.ts
lib/reputation/reviewerProfileService.ts

# Static
public/assets/review.svg
public/assets/review (1).svg
```

**Untangle:**

| File | Change |
|---|---|
| `lib/actions/realtimepost.actions.ts` (L8-9, L118, L344, L369-372, L429-509, L583-592) | Remove `import { createProductReview }`, remove all `productReview` handling blocks |

**Prisma models for Wave 4:** `ProductReview`, `ReviewAssignment`, `ReviewResponse`, `ReviewCommitment`, `ReviewerProfile`

---

### 4.5 Portfolio Builder

**Delete:**
```
# App routes
app/portfolio/                              # layout, builder/, [slug]/, builder.global.css, resize-handles.module.css

# API routes
app/api/portfolio/                          # export/route.ts
app/api/sites/                              # route.ts, [id]/route.ts

# Components
components/portfolio/                       # AutoInspector, EmbedEnv, GalleryInspector, GalleryPropsPanel, RepeaterInspector, RepeaterPropsPanel
components/cards/PortfolioCard.tsx
components/cards/Repeater.tsx
components/cards/Repeater.exp.tsx
components/cards/Repeater.lite.tsx
components/cards/GalleryCarousel.tsx
components/nodes/PortfolioNode.tsx
components/forms/PortfolioNodeForm.tsx
components/modals/PortfolioModal.tsx
components/modals/PortfolioNodeModal.tsx
components/modals/PortfolioSiteBuilderModal.tsx

# Lib
lib/portfolio/                              # canvasStore, CanvasStoreProvider, datasource, export, lint, mapping, registry, selection, templates, transformers, types
lib/actions/portfolio.actions.ts
lib/components/CanvasRenderer.tsx

# Tests
tests/portfolio-export.test.ts
tests/__snapshots__/portfolio-export.test.ts.snap
```

**Untangle:**

| File | Change |
|---|---|
| `lib/types/post.ts` (L31) | Remove `portfolio?: PortfolioPayload` field |
| `lib/transform/post.ts` (L14, L45) | Remove portfolio transform logic |
| `lib/actions/feed.actions.ts` (L10, L59, L120, L268) | Remove portfolio payload handling |
| `lib/actions/feedpost.actions.ts` (L14, L35, L54) | Remove portfolio field handling |
| `lib/actions/realtimepost.actions.ts` (L9, L13, L21, L41, L62, L90, L109-112) | Remove `import { createPortfolioPage }` and portfolio payload handling |
| `lib/actions/blocks.actions.ts` (L59, L87) | Remove `prisma.portfolioPage.findUnique` / `.update` calls |
| `lib/hooks/useCreateFeedPost.ts` (L12) | Remove `portfolio` field |
| `components/cards/PostCard.tsx` (L70, L350) | Remove `portfolio` prop and `<PortfolioCard>` render block |
| `middleware.ts` (L77) | Remove `if (pathname.startsWith("/portfolio/"))` passthrough |
| `app/(root)/(standard)/profile/sites/page.tsx` | Remove `prisma.portfolioPage.findMany()` or delete page |
| `app/(root)/(standard)/profile/sites/ui/SitesDashboard.tsx` | Remove `router.push("/portfolio/builder")` or delete |

**Prisma models for Wave 4:** `PortfolioPage`, `PortfolioBlock`

---

## 5. Wave 3 — ReactFlow Deep Entanglement

> **Estimated effort: ~3-5 days**
> ReactFlow v11 (`reactflow` package) is the old social media canvas. ~40+ files import from it. The newer `@xyflow/react` v12 package is used by argument chains and must be **kept**.

### What to keep vs archive

| Keep | Archive |
|---|---|
| `@xyflow/react` (v12) — argument chains, KG viz | `reactflow` (v11) — old social media canvas |
| `components/chains/*` (ArgumentChainCanvas, etc.) | `components/reactflow/` (Room.tsx, NodeButtons, NodeAuthorDisplay) |
| `app/api/argument-chains/` | `components/nodes/*` (all social canvas node types) |
| | `components/edges/DefaultEdge.tsx` |
| | `lib/reactflow/` (store.ts, types.ts, reactflowutils.ts) |

### Files to delete

```
# Core reactflow code
lib/reactflow/                              # store.ts, types.ts, reactflowutils.ts
components/reactflow/                       # Room.tsx, NodeButtons.tsx, NodeAuthorDisplay.tsx
components/edges/DefaultEdge.tsx

# All social canvas node types
components/nodes/DrawNode.tsx
components/nodes/TextInputNode.tsx
components/nodes/DocumentNode.tsx
components/nodes/LLMInstructionNode.tsx
components/nodes/BaseNode.tsx
components/nodes/LiveStreamNode.tsx
components/nodes/ImageURLNode.tsx
components/nodes/YoutubeNode.tsx
components/nodes/PortalNode.tsx
components/nodes/EntropyNode.tsx
components/nodes/AudioNode.tsx
components/nodes/CollageNode.tsx
components/nodes/LivechatNode.tsx
components/nodes/CodeNode.tsx
components/nodes/ThreadNode.tsx
components/nodes/ImageComputeNode.tsx
components/nodes/GalleryNode.tsx
components/nodes/MusicNode.tsx
components/nodes/RoomCanvasNode.tsx
components/nodes/PortfolioNode.tsx          # Also covered by Portfolio deletion
components/nodes/ProductReviewNode.tsx      # Also covered by Review deletion

# Embedded canvas
components/cards/EmbeddedCanvas.tsx
```

### Files to untangle (heavy surgery)

These shared components import from `lib/reactflow/store` or `lib/reactflow/types`. Each needs the reactflow dependency removed:

| File | Reactflow Usage | Required Change |
|---|---|---|
| `lib/utils.ts` | Imports from `./reactflow/reactflowutils` and `./reactflow/types` | Remove imports and any functions that depend on them |
| `lib/stores/chainEditorStore.ts` | `import { Node, Edge } from "reactflow"` | Change to `import type { Node, Edge } from "@xyflow/react"` (v12 equivalents) |
| `lib/utils/chainAnalysisUtils.ts` | `import type { Node, Edge } from "reactflow"` | Change to `@xyflow/react` |
| `lib/utils/chainLayoutUtils.ts` | `import { Node, Edge, Position } from "reactflow"` | Change to `@xyflow/react` |
| `lib/chains/narrativeGenerator.ts` | `import { Node, Edge } from "reactflow"` | Change to `@xyflow/react` |
| `lib/chains/markdownFormatter.ts` | `import { Node, Edge } from "reactflow"` | Change to `@xyflow/react` |
| `components/shared/HamburgerMenu.tsx` | Imports `useStore`, `AppState` from reactflow | Remove reactflow-dependent code paths |
| `components/shared/DnDSidebar.tsx` | Imports `useStore`, `AppNodeType`, `AppState` | Remove or gut the component if only used for canvas |
| `components/shared/RightSidebar.tsx` | Imports `useStore`, `AppState` | Remove reactflow-dependent code paths |
| `components/shared/LeftSidebar.tsx` | Imports from reactflow | Remove reactflow-dependent code paths |
| `components/shared/NodeSidebar.tsx` | Imports `AppState`, `useStore`, `convertPostToNode` | Delete entire file if only used for canvas |
| `components/modals/Modal.tsx` | Imports `useStore`, `AppState` | Remove reactflow-dependent branches |
| `components/modals/TimerModal.tsx` | Imports `useStore`, `AppState` | Remove reactflow-dependent branches |
| `components/forms/CreateFeedPost.tsx` | `import { AppNodeType, DEFAULT_NODE_VALUES }` | Remove node-type selection UI for canvas posts |
| `components/buttons/NodeDropdown.tsx` | Imports from `@/lib/reactflow/store` and `/types` | Delete if canvas-only |
| `components/buttons/EditButton.tsx` | Imports from `@/lib/reactflow/store` and `/types` | Delete if canvas-only |
| `components/buttons/TimerButton.tsx` | Imports from `@/lib/reactflow/store` and `/types` | Delete if canvas-only |
| `components/buttons/ShareButton.tsx` | Imports from `@/lib/reactflow/store` and `/types` | Remove reactflow dependency |
| `components/hooks/MousePosition.tsx` | `import { ReactFlowInstance }` | Remove or replace |
| `lib/actions/realtimeroom.actions.ts` | Imports from `@/lib/reactflow/reactflowutils` | Remove reactflow room canvas logic |
| `app/api/argument-chains/[chainId]/analyze/route.ts` | `import type { Node, Edge } from "reactflow"` | Change to `@xyflow/react` |

### Migration pattern for chain-related files

For files in `lib/chains/`, `lib/stores/chainEditorStore.ts`, `lib/utils/chain*.ts`, and `components/chains/`:

```typescript
// BEFORE (reactflow v11)
import { Node, Edge } from "reactflow";

// AFTER (@xyflow/react v12)
import type { Node, Edge } from "@xyflow/react";
```

The type signatures are compatible for basic `Node` and `Edge` types. Test after migration.

---

## 6. Wave 4 — Prisma Schema & Database

> **Estimated effort: ~1 day (after code deletion)**

### Approach

1. **Do NOT drop database tables** — let them sit dormant
2. **Remove models from `lib/models/schema.prisma`** so the generated Prisma client shrinks
3. **Remove back-relations** from kept models (especially `User`)
4. Run `prisma generate` to verify the new client compiles
5. Run `prisma db push --accept-data-loss` only if doing a fresh staging DB; for production, just shrink the client

### Models to remove from schema

**Swapmeet:**
`Stall`, `StallItem`, `StallImage`, `StallOffer`, `StallOrder`, `MarketSection`, `SectionHeatSnapshot`, `CartItem`, `EscrowHold`, `Auction`, `AuctionBid`

**Prediction Markets:**
`PredictionMarket`, `PredictionTrade`, `PredictionOutcome`, `Poll`, `PollVote`, `PollOption`

**Workflow:**
`Workflow`, `WorkflowRun`, `WorkflowNode`, `WorkflowEdge`, `WorkflowSchedule`, `WorkflowTrigger`, `WorkflowAction`, `WorkflowVariable`

**Portfolio:**
`PortfolioPage`, `PortfolioBlock`

**Product Reviews:**
`ProductReview`, `ReviewAssignment`, `ReviewResponse`, `ReviewCommitment`, `ReviewerProfile`

**Discovery:**
`UserSimilarityKnn`, `TasteVector`, `DiscoveryCandidate`, `DiscoveryFeedback`

**Group-Halfway:**
`GroupHalfway`, `HalfwayOrigin`, `HalfwayVote`

### Back-relations to remove from `User` model

```prisma
// REMOVE these lines from the User model:
portfolioPages      PortfolioPage[]
createdPredictionMarkets   PredictionMarket[]   @relation("MarketCreator")
oraclePredictionMarkets    PredictionMarket[]   @relation("MarketOracle")
workflows           Workflow[]
stalls              Stall[]
// ... and any other archive-feature relations
```

### Back-relations to remove from `FeedPost` and `RealtimePost`

```prisma
// REMOVE from FeedPost:
predictionMarket    PredictionMarket?

// REMOVE from RealtimePost:
predictionMarket    PredictionMarket?
```

### Verify after changes

```bash
npx prisma generate          # Must succeed
npx prisma validate          # Must succeed
npm run build                # Verify no runtime references to removed models
```

---

## 7. Wave 5 — Dependency Cleanup

> **Estimated effort: ~half day (after code deletion)**
> Run after Waves 1-4 to remove unused packages.

### Packages to remove

| Package | Removed With | Notes |
|---|---|---|
| `reactflow` | Wave 3 | Keep `@xyflow/react` |
| `@react-three/drei` | Wave 1 (Three.js) | |
| `@react-three/fiber` | Wave 1 (Three.js) | |
| `three` | Wave 1 (Three.js) | |
| `glsl-noise` | Wave 1 (Three.js) | |
| `glslify` | Wave 1 (Three.js) | Remove webpack rule in `next.config.mjs` |
| `glslify-loader` | Wave 1 (Three.js) | Remove webpack rule in `next.config.mjs` |
| `raw-loader` | Wave 1 (Three.js) | Remove webpack rule in `next.config.mjs` |
| `@splinetool/react-spline` | Wave 1 (3D) | Verify not used elsewhere |
| `@splinetool/runtime` | Wave 1 (3D) | Verify not used elsewhere |
| `@react-google-maps/api` | Wave 1 (Halfway) | |
| `tone` | Wave 1 (audio/music) | Verify not used in core |
| `wavesurfer.js` | Wave 1 (audio/music) | Verify not used in core |
| `osc` | Wave 1 (audio/music) | Verify not used in core |
| `pixi.js` | Wave 3 (canvas) | Verify not used in core |
| `ace-builds` | Wave 2 (workflow) | Verify not used in core |
| `react-ace` | Wave 2 (workflow) | Verify not used in core |
| `smooth-scrollbar` | Wave 1 (swapmeet) | Verify not used in core |
| `@react-spring/web` | Wave 2 (discovery) | Verify not used in core |
| `fluent-ffmpeg` | Wave 1 (media) | Verify not used in core |
| `ffmpeg-static` | Wave 1 (media) | Verify not used in core |
| `ytdl-core` | Wave 1 (media) | Verify not used in core |
| `chart.js` | Wave 1 (Spotify) | Verify not used in core |
| `react-chartjs-2` | Wave 1 (Spotify) | Verify not used in core |

### Verification

```bash
# After removing packages from package.json:
yarn install
npm run build
npm run lint
npm run test
```

### Also clean up `next.config.mjs`

After removing Three.js:
```javascript
// REMOVE this webpack rule:
config.module.rules.push({
  test: /\.(glsl|vs|fs|vert|frag)$/,
  use: ["raw-loader", "glslify", "glslify-loader"],
});

// REMOVE these resolve aliases (if only used by tldraw, verify first):
// tldraw-related aliases may still be needed if tldraw is used for whiteboards in core
```

---

## 8. Workers After Pruning

### Final worker state

| Worker | Status | Feature |
|---|---|---|
| `reembed.ts` | **KEEP** | Core embedding pipeline |
| `scrollRealtime.ts` | **KEEP** | Core realtime processing |
| `decayConfidenceJob.ts` | **KEEP** | Argumentation confidence decay |
| `computeSharedAuthorEdges.ts` | **KEEP** | Knowledge graph |
| `knowledgeGraphBuilder.ts` | **KEEP** | Knowledge graph |
| `sourceVerification.ts` | **KEEP** (disabled) | Source trust — re-enable when ready |
| `sourceArchiving.ts` | **KEEP** (disabled) | Source trust — re-enable when ready |
| `sourceUsageAggregator.ts` | **KEEP** | Source analytics |
| `tokenRefresh.ts` | **KEEP** | Auth token refresh |
| `cron.ts` | **KEEP** | Update to remove archive crons |
| `index.ts` | **KEEP** | Update imports to only include kept workers |
| `spotifyIngest.ts` | **DELETE** | Spotify |
| `reembedFromSpotify.ts` | **DELETE** | Spotify |
| `candidate-builder.ts` | **DELETE** | Social discovery |
| `tasteVector.ts` | **DELETE** | Social discovery |
| `user-knn-builder.ts` | **DELETE** | Social discovery |
| `sectionHeat.ts` | **DELETE** | Swapmeet |

### Updated `workers/index.ts` after pruning

```typescript
import 'dotenv/config';
import '@/workers/reembed';
import '@/workers/scrollRealtime';
import '@/workers/decayConfidenceJob';
import '@/workers/computeSharedAuthorEdges';
// import "@/workers/sourceVerification";   // Phase 3.1 — re-enable when ready
// import "@/workers/sourceArchiving";      // Phase 3.1 — re-enable when ready

console.log('All workers bootstrapped');
```

---

## 9. Cross-Reference Index

Quick lookup of every file that needs editing (not deleting) across all waves.

| File | Waves | Changes |
|---|---|---|
| `middleware.ts` | 1.3, 1.5 | Remove swapmeet redirect, portfolio passthrough |
| `workers/index.ts` | 1.3, 1.4, 2.3 | Remove 6 worker imports |
| `lib/queue.ts` | 1.4, 2.3 | Remove 4 queue definitions |
| `lib/types/post.ts` | 2.1, 2.5 | Remove `predictionMarket` and `portfolio` fields |
| `lib/transform/post.ts` | 2.1, 2.5 | Remove prediction + portfolio transforms |
| `components/cards/PostCard.tsx` | 2.1, 2.5 | Remove prediction + portfolio rendering |
| `lib/actions/feed.actions.ts` | 2.1, 2.5 | Remove prediction cleanup + portfolio payload |
| `lib/actions/feedpost.actions.ts` | 2.5 | Remove portfolio field |
| `lib/actions/realtimepost.actions.ts` | 2.4, 2.5 | Remove productReview + portfolio imports/handling |
| `lib/actions/blocks.actions.ts` | 2.5 | Remove portfolioPage queries |
| `lib/hooks/useCreateFeedPost.ts` | 2.5 | Remove portfolio field |
| `lib/payouts.server.ts` | 1.3 | Remove swapmeet Stripe URLs |
| `lib/pineconeClient.ts` | 2.3 | Remove `knnPgvector` |
| `lib/actions/friend-suggestions.actions.ts` | 2.3 | Remove KNN calls |
| `lib/utils.ts` | 3 | Remove reactflow imports |
| `lib/stores/chainEditorStore.ts` | 3 | `reactflow` → `@xyflow/react` |
| `lib/utils/chainAnalysisUtils.ts` | 3 | `reactflow` → `@xyflow/react` |
| `lib/utils/chainLayoutUtils.ts` | 3 | `reactflow` → `@xyflow/react` |
| `lib/chains/narrativeGenerator.ts` | 3 | `reactflow` → `@xyflow/react` |
| `lib/chains/markdownFormatter.ts` | 3 | `reactflow` → `@xyflow/react` |
| `components/shared/HamburgerMenu.tsx` | 3 | Remove reactflow code |
| `components/shared/DnDSidebar.tsx` | 3 | Remove or delete |
| `components/shared/RightSidebar.tsx` | 3 | Remove reactflow code |
| `components/shared/LeftSidebar.tsx` | 2.2, 3 | Remove workflow link + reactflow code |
| `components/shared/NodeSidebar.tsx` | 3 | Delete if canvas-only |
| `components/modals/Modal.tsx` | 3 | Remove reactflow branches |
| `components/modals/TimerModal.tsx` | 3 | Remove reactflow branches |
| `components/forms/CreateFeedPost.tsx` | 3 | Remove node-type UI |
| `components/buttons/NodeDropdown.tsx` | 3 | Delete if canvas-only |
| `components/buttons/EditButton.tsx` | 3 | Remove reactflow deps |
| `components/buttons/TimerButton.tsx` | 3 | Delete if canvas-only |
| `components/buttons/ShareButton.tsx` | 3 | Remove reactflow deps |
| `components/hooks/MousePosition.tsx` | 3 | Remove ReactFlowInstance |
| `lib/actions/realtimeroom.actions.ts` | 3 | Remove reactflow room canvas logic |
| `app/api/argument-chains/[chainId]/analyze/route.ts` | 3 | `reactflow` → `@xyflow/react` |
| `app/(auth)/register/page.tsx` | 1.2 | Remove BackgroundCanvas |
| `app/(root)/(standard)/applications/page.tsx` | 1.1, 2.2 | Remove halfway + workflow links |
| `app/(pages)/settings/integrations/page.tsx` | 1.4 | Remove Spotify section |
| `app/(root)/(standard)/profile/sites/page.tsx` | 2.5 | Remove or delete |
| `vercel.json` | 1.3 | Remove `close_auctions` cron |
| `tsconfig.json` | 1.3 | Remove `swapmeet-api` path |
| `next.config.mjs` | 1.2 | Remove GLSL webpack rule |
| `lib/models/schema.prisma` | 4 | Remove ~40-50 models + back-relations |

---

## 10. Projected Impact

| Metric | Before | After (est.) | Reduction |
|---|---|---|---|
| **API routes** | 814 | ~550-600 | ~25-30% |
| **Prisma models** | 364 | ~310-320 | ~12-15% |
| **Active workers** | 11 | 5 | ~55% |
| **npm dependencies** | ~130 | ~110 | ~15% |
| **Client bundle** | TBD | TBD | ~15-25% (pending audit) |
| **Env vars needed** | 114 | ~85-90 | ~20% |
| **Files to untangle** | — | ~35 files | — |

---

## 11. Execution Checklist

### Pre-work
- [ ] Create `archive/alpha-full-features` branch and push
- [ ] Create `production/discourse-core` branch
- [ ] Tag `alpha-complete`
- [ ] Run `next build` on current main to establish baseline error count

### Wave 1 — Clean Cuts (~1 day)
- [ ] 1.1 Delete Group-Halfway files, untangle applications page
- [ ] 1.2 Delete Three.js files, untangle register page, clean next.config.mjs
- [ ] 1.3 Delete Swapmeet files, untangle middleware/payouts/vercel.json/workers/tsconfig
- [ ] 1.4 Delete Spotify files, untangle workers/queue/settings
- [ ] Run `npm run lint` — fix any new errors
- [ ] Run `npm run build` — verify no regressions
- [ ] Commit: "chore: archive wave 1 — halfway, threejs, swapmeet, spotify"

### Wave 2 — Medium Entanglement (~2-3 days)
- [ ] 2.1 Delete Prediction Markets, untangle post types/feed/PostCard
- [ ] 2.2 Delete Workflows, untangle sidebars/applications page
- [ ] 2.3 Delete Social Discovery, untangle workers/queue/pinecone/friend-suggestions
- [ ] 2.4 Delete Product Reviews, untangle realtimepost actions
- [ ] 2.5 Delete Portfolio, untangle post types/feed/blocks/hooks/middleware/PostCard
- [ ] Run `npm run lint` + `npm run build`
- [ ] Commit: "chore: archive wave 2 — predictions, workflows, discovery, reviews, portfolio"

### Wave 3 — ReactFlow (~3-5 days)
- [ ] Delete `lib/reactflow/`, `components/reactflow/`, `components/nodes/`, `components/edges/DefaultEdge.tsx`
- [ ] Migrate chain-related files from `reactflow` → `@xyflow/react` imports
- [ ] Untangle all shared components (~15 files)
- [ ] Run `npm run lint` + `npm run build`
- [ ] Commit: "chore: archive wave 3 — reactflow canvas, migrate chains to @xyflow/react"

### Wave 4 — Prisma Schema (~1 day)
- [ ] Remove archived models from `lib/models/schema.prisma`
- [ ] Remove back-relations from kept models
- [ ] Run `npx prisma validate` + `npx prisma generate`
- [ ] Run `npm run build`
- [ ] Commit: "chore: archive wave 4 — prune prisma schema"

### Wave 5 — Dependency Cleanup (~half day)
- [ ] Remove unused packages from `package.json`
- [ ] Clean `next.config.mjs` (webpack rules, aliases)
- [ ] `yarn install` + `npm run build` + `npm run lint` + `npm run test`
- [ ] Commit: "chore: archive wave 5 — remove unused dependencies"

### Post-pruning
- [ ] Run full test suite: `npm run test` + `npm run vitest`
- [ ] Verify `next build` succeeds
- [ ] Deploy to Vercel preview and smoke test
- [ ] Merge `production/discourse-core` → `main`

---

*Last updated: February 17, 2026*
*Archive branch: `archive/alpha-full-features`*
