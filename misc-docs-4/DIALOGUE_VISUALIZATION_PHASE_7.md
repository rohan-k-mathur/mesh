# Dialogue Visualization Roadmap: Phase 7 — Integration & Testing

**Status:** 📋 Pending  
**Duration:** 2 weeks  
**Dependencies:** Phases 1-6 complete  
**Sprint:** Sprint 13-14  

---

## Overview

Phase 7 focuses on integration testing, end-to-end validation, performance benchmarking, and deployment preparation. This phase ensures all components work together seamlessly and meet quality standards before production rollout.

### Objectives

1. **Integration Testing:** Validate interactions between dialogue moves, AIF graphs, timeline views, and scheme provenance
2. **Performance Testing:** Benchmark query performance, rendering speed, and user interactions
3. **Cross-Browser Testing:** Ensure compatibility across Chrome, Firefox, Safari, Edge
4. **Accessibility Audit:** Validate WCAG 2.1 AA compliance
5. **Deployment Preparation:** Create staging environment, migration plans, and rollback procedures

---

## Phase 7.1: Integration Test Suite (4 days)

### 7.1.1 End-to-End Test Framework Setup

**Goal:** Configure Playwright/Cypress for E2E testing

**Tasks:**
- [ ] Install Playwright and configure `playwright.config.ts`
- [ ] Set up test database seeding for dialogue + AIF data
- [ ] Create test fixtures for deliberations with dialogue moves
- [ ] Configure CI/CD pipeline for automated E2E tests

**Implementation:**

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

```typescript
// e2e/fixtures/dialogue-test-data.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedDialogueTestData() {
  // Create test user
  const user = await prisma.user.create({
    data: {
      email: "test@mesh.com",
      name: "Test User",
    },
  });

  // Create deliberation with dialogue moves
  const deliberation = await prisma.deliberation.create({
    data: {
      title: "Test Deliberation with Dialogue",
      description: "E2E test case",
      creatorId: user.id,
    },
  });

  // Create argument scheme
  const scheme = await prisma.argumentationScheme.create({
    data: {
      name: "Argument from Expert Opinion",
      description: "Expert E asserts that A is true",
      deliberationId: deliberation.id,
    },
  });

  // Create critical questions
  const cq1 = await prisma.criticalQuestion.create({
    data: {
      question: "Is E really an expert in the domain?",
      order: 1,
      schemeId: scheme.id,
    },
  });

  const cq2 = await prisma.criticalQuestion.create({
    data: {
      question: "Is E reliable?",
      order: 2,
      schemeId: scheme.id,
    },
  });

  // Create dialogue moves challenging and answering CQs
  const challengeMove = await prisma.dialogueMove.create({
    data: {
      deliberationId: deliberation.id,
      userId: user.id,
      type: "WHY",
      content: "Is E really an expert in the domain?",
      targetCriticalQuestionId: cq1.id,
      timestamp: new Date(),
    },
  });

  const answerMove = await prisma.dialogueMove.create({
    data: {
      deliberationId: deliberation.id,
      userId: user.id,
      type: "GROUNDS",
      content: "E has a PhD in the field and 20 years of experience",
      parentMoveId: challengeMove.id,
      timestamp: new Date(Date.now() + 60000),
    },
  });

  // Create AIF nodes
  const claimNode = await prisma.aifNode.create({
    data: {
      deliberationId: deliberation.id,
      nodeType: "I",
      text: "E asserts that A is true",
      dialogueMoveId: answerMove.id,
    },
  });

  const supportNode = await prisma.aifNode.create({
    data: {
      deliberationId: deliberation.id,
      nodeType: "RA",
      text: "Support from expert opinion",
      schemeId: scheme.id,
    },
  });

  // Create AIF edges
  await prisma.aifEdge.create({
    data: {
      deliberationId: deliberation.id,
      fromNodeId: supportNode.id,
      toNodeId: claimNode.id,
      edgeType: "RA",
    },
  });

  return {
    user,
    deliberation,
    scheme,
    cq1,
    cq2,
    challengeMove,
    answerMove,
    claimNode,
    supportNode,
  };
}

export async function cleanupTestData() {
  await prisma.aifEdge.deleteMany({});
  await prisma.aifNode.deleteMany({});
  await prisma.dialogueMove.deleteMany({});
  await prisma.criticalQuestion.deleteMany({});
  await prisma.argumentationScheme.deleteMany({});
  await prisma.deliberation.deleteMany({});
  await prisma.user.deleteMany({
    where: { email: "test@mesh.com" },
  });
}
```

---

### 7.1.2 Critical User Journeys

**Goal:** Test complete user workflows end-to-end

**Test Cases:**

#### Journey 1: Challenging an Argument with Dialogue Moves

```typescript
// e2e/journeys/challenge-argument.spec.ts
import { test, expect } from "@playwright/test";
import { seedDialogueTestData, cleanupTestData } from "../fixtures/dialogue-test-data";

test.describe("Challenge Argument Journey", () => {
  let testData: Awaited<ReturnType<typeof seedDialogueTestData>>;

  test.beforeEach(async () => {
    testData = await seedDialogueTestData();
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test("should challenge CQ and see it reflected in AIF diagram", async ({ page }) => {
    // Navigate to deliberation
    await page.goto(`/deliberation/${testData.deliberation.id}`);

    // Wait for AIF diagram to render
    await page.waitForSelector("[data-testid='aif-diagram']");

    // Verify initial AIF nodes are visible
    const claimNode = page.locator(`[data-node-id='${testData.claimNode.id}']`);
    await expect(claimNode).toBeVisible();

    // Open scheme card
    await page.click(`[data-testid='scheme-card-${testData.scheme.id}']`);

    // Challenge first CQ
    const cqCard = page.locator(`[data-testid='cq-${testData.cq1.id}']`);
    await cqCard.locator("[data-testid='challenge-button']").click();

    // Fill challenge modal
    await page.fill("[data-testid='challenge-input']", "Is E really an expert?");
    await page.click("[data-testid='submit-challenge']");

    // Verify dialogue move appears
    await expect(page.locator("[data-testid='dialogue-move-list']")).toContainText(
      "Is E really an expert?"
    );

    // Verify CQ status badge updates
    await expect(cqCard.locator("[data-testid='cq-status']")).toHaveText("Challenged");

    // Verify DM-node appears in AIF diagram
    const dmNode = page.locator("[data-testid='dm-node-WHY']");
    await expect(dmNode).toBeVisible();

    // Click DM-node to see details
    await dmNode.click();
    await expect(page.locator("[data-testid='dm-modal-title']")).toContainText("WHY");
    await expect(page.locator("[data-testid='dm-modal-content']")).toContainText(
      "Is E really an expert?"
    );
  });

  test("should answer challenge and update provenance", async ({ page }) => {
    await page.goto(`/deliberation/${testData.deliberation.id}`);

    // Open dialogue actions sheet
    await page.click("[data-testid='dialogue-actions-button']");

    // Find challenge move
    const challengeMove = page.locator(
      `[data-testid='move-${testData.challengeMove.id}']`
    );
    await challengeMove.locator("[data-testid='reply-button']").click();

    // Submit answer
    await page.selectOption("[data-testid='move-type-select']", "GROUNDS");
    await page.fill(
      "[data-testid='reply-input']",
      "E has a PhD in the field and 20 years of experience"
    );
    await page.click("[data-testid='submit-reply']");

    // Verify answer appears
    await expect(page.locator("[data-testid='dialogue-move-list']")).toContainText(
      "E has a PhD in the field"
    );

    // Verify CQ status updates to "Answered"
    const cqCard = page.locator(`[data-testid='cq-${testData.cq1.id}']`);
    await expect(cqCard.locator("[data-testid='cq-status']")).toHaveText("Answered");

    // Verify AIF node shows provenance
    const claimNode = page.locator(`[data-node-id='${testData.claimNode.id}']`);
    await claimNode.hover();

    const tooltip = page.locator("[data-testid='provenance-tooltip']");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText("GROUNDS");
    await expect(tooltip).toContainText("E has a PhD");
  });
});
```

#### Journey 2: Timeline Playback

```typescript
// e2e/journeys/timeline-playback.spec.ts
import { test, expect } from "@playwright/test";
import { seedDialogueTestData, cleanupTestData } from "../fixtures/dialogue-test-data";

test.describe("Timeline Playback Journey", () => {
  let testData: Awaited<ReturnType<typeof seedDialogueTestData>>;

  test.beforeEach(async () => {
    testData = await seedDialogueTestData();
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test("should play timeline and sync AIF diagram", async ({ page }) => {
    // Navigate to timeline view
    await page.goto(`/deliberation/${testData.deliberation.id}/timeline`);

    // Wait for timeline to render
    await page.waitForSelector("[data-testid='dialogue-timeline']");

    // Verify both moves are present
    const challengeMarker = page.locator(
      `[data-testid='timeline-marker-${testData.challengeMove.id}']`
    );
    const answerMarker = page.locator(
      `[data-testid='timeline-marker-${testData.answerMove.id}']`
    );
    await expect(challengeMarker).toBeVisible();
    await expect(answerMarker).toBeVisible();

    // Click play button
    await page.click("[data-testid='timeline-play-button']");

    // Verify playback starts
    await expect(page.locator("[data-testid='timeline-play-button']")).toHaveAttribute(
      "data-playing",
      "true"
    );

    // Wait for first move to be highlighted
    await page.waitForSelector("[data-testid='current-move-highlight']");
    await expect(challengeMarker).toHaveClass(/current/);

    // Verify AIF diagram updates
    const dmNode = page.locator("[data-testid='dm-node-WHY']");
    await expect(dmNode).toHaveClass(/highlighted/);

    // Wait for second move
    await page.waitForTimeout(2000); // Assuming 1s speed
    await expect(answerMarker).toHaveClass(/current/);

    // Verify second DM-node appears
    const groundsNode = page.locator("[data-testid='dm-node-GROUNDS']");
    await expect(groundsNode).toBeVisible();
    await expect(groundsNode).toHaveClass(/highlighted/);

    // Pause playback
    await page.click("[data-testid='timeline-pause-button']");
    await expect(page.locator("[data-testid='timeline-play-button']")).toHaveAttribute(
      "data-playing",
      "false"
    );
  });

  test("should scrub timeline manually", async ({ page }) => {
    await page.goto(`/deliberation/${testData.deliberation.id}/timeline`);

    // Get timeline scrubber
    const scrubber = page.locator("[data-testid='timeline-scrubber']");
    const scrubberBounds = await scrubber.boundingBox();

    // Drag scrubber to 50% position
    await page.mouse.move(scrubberBounds!.x, scrubberBounds!.y);
    await page.mouse.down();
    await page.mouse.move(scrubberBounds!.x + scrubberBounds!.width * 0.5, scrubberBounds!.y);
    await page.mouse.up();

    // Verify first move is visible in AIF diagram
    const dmNode = page.locator("[data-testid='dm-node-WHY']");
    await expect(dmNode).toBeVisible();

    // Drag to 100% position
    await page.mouse.move(scrubberBounds!.x, scrubberBounds!.y);
    await page.mouse.down();
    await page.mouse.move(scrubberBounds!.x + scrubberBounds!.width, scrubberBounds!.y);
    await page.mouse.up();

    // Verify both nodes are visible
    const groundsNode = page.locator("[data-testid='dm-node-GROUNDS']");
    await expect(dmNode).toBeVisible();
    await expect(groundsNode).toBeVisible();
  });

  test("should export timeline as Markdown", async ({ page }) => {
    await page.goto(`/deliberation/${testData.deliberation.id}/timeline`);

    // Open export menu
    await page.click("[data-testid='timeline-export-button']");
    await page.click("[data-testid='export-markdown']");

    // Wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("[data-testid='confirm-export']"),
    ]);

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/timeline-.*\.md$/);

    // Verify content
    const path = await download.path();
    const fs = await import("fs/promises");
    const content = await fs.readFile(path!, "utf-8");

    expect(content).toContain("# Dialogue Timeline");
    expect(content).toContain("WHY");
    expect(content).toContain("GROUNDS");
    expect(content).toContain("Is E really an expert");
  });
});
```

#### Journey 3: Multi-User Dialogue Interaction

```typescript
// e2e/journeys/multi-user-dialogue.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Multi-User Dialogue", () => {
  test("should see real-time dialogue updates from other users", async ({ browser }) => {
    // Create two browser contexts (two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Seed test data
    const { seedDialogueTestData, cleanupTestData } = await import(
      "../fixtures/dialogue-test-data"
    );
    const testData = await seedDialogueTestData();

    try {
      // Both users navigate to same deliberation
      await page1.goto(`/deliberation/${testData.deliberation.id}`);
      await page2.goto(`/deliberation/${testData.deliberation.id}`);

      // User 1 submits a challenge
      await page1.click("[data-testid='dialogue-actions-button']");
      await page1.click("[data-testid='add-move-button']");
      await page1.selectOption("[data-testid='move-type-select']", "WHY");
      await page1.fill(
        "[data-testid='move-content-input']",
        "User 1 challenges: Is this claim valid?"
      );
      await page1.click("[data-testid='submit-move']");

      // Verify User 1 sees their move
      await expect(page1.locator("[data-testid='dialogue-move-list']")).toContainText(
        "User 1 challenges"
      );

      // Verify User 2 sees the update in real-time (via SWR revalidation)
      await page2.waitForTimeout(3000); // Wait for SWR revalidation
      await expect(page2.locator("[data-testid='dialogue-move-list']")).toContainText(
        "User 1 challenges"
      );

      // Verify DM-node appears in User 2's AIF diagram
      const dmNode = page2.locator("[data-testid='dm-node-WHY']");
      await expect(dmNode).toBeVisible();

      // User 2 replies
      const moveCard = page2.locator("[data-testid='dialogue-move-list']").first();
      await moveCard.locator("[data-testid='reply-button']").click();
      await page2.selectOption("[data-testid='move-type-select']", "GROUNDS");
      await page2.fill("[data-testid='reply-input']", "User 2 responds with evidence");
      await page2.click("[data-testid='submit-reply']");

      // Verify User 2 sees their reply
      await expect(page2.locator("[data-testid='dialogue-move-list']")).toContainText(
        "User 2 responds"
      );

      // Verify User 1 sees the reply
      await page1.waitForTimeout(3000);
      await expect(page1.locator("[data-testid='dialogue-move-list']")).toContainText(
        "User 2 responds"
      );
    } finally {
      await cleanupTestData();
      await context1.close();
      await context2.close();
    }
  });
});
```

---

### 7.1.3 Component Integration Tests

**Goal:** Test interactions between React components

```typescript
// __tests__/integration/dialogue-aif-integration.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AifDiagramViewInteractive } from "@/components/aif/AifDiagramViewInteractive";
import { DialogueActionsSheet } from "@/components/dialogue/DialogueActionsSheet";
import { SWRConfig } from "swr";

const mockDeliberationWithDialogue = {
  id: "delib-1",
  aifGraph: {
    nodes: [
      {
        id: "node-1",
        nodeType: "I",
        text: "Climate change is real",
        dialogueMoveId: "move-1",
      },
      {
        id: "dm-1",
        nodeType: "DM",
        dialogueMoveType: "GROUNDS",
        content: "Scientific consensus supports this",
      },
    ],
    edges: [
      {
        id: "edge-1",
        fromNodeId: "dm-1",
        toNodeId: "node-1",
        edgeType: "RA",
      },
    ],
  },
  dialogueMoves: [
    {
      id: "move-1",
      type: "GROUNDS",
      content: "Scientific consensus supports this",
      timestamp: new Date("2024-01-01T10:00:00Z"),
    },
  ],
};

describe("Dialogue-AIF Integration", () => {
  it("should show provenance tooltip when hovering AIF node with dialogue", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AifDiagramViewInteractive
          deliberationId="delib-1"
          graph={mockDeliberationWithDialogue.aifGraph}
        />
      </SWRConfig>
    );

    const claimNode = screen.getByTestId("aif-node-node-1");
    await userEvent.hover(claimNode);

    await waitFor(() => {
      expect(screen.getByTestId("provenance-tooltip")).toBeInTheDocument();
    });

    expect(screen.getByText(/GROUNDS/i)).toBeInTheDocument();
    expect(screen.getByText(/Scientific consensus/i)).toBeInTheDocument();
  });

  it("should highlight related AIF nodes when clicking dialogue move", async () => {
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <div>
          <AifDiagramViewInteractive
            deliberationId="delib-1"
            graph={mockDeliberationWithDialogue.aifGraph}
          />
          <DialogueActionsSheet
            deliberationId="delib-1"
            moves={mockDeliberationWithDialogue.dialogueMoves}
          />
        </div>
      </SWRConfig>
    );

    // Click dialogue move
    const moveCard = screen.getByTestId("move-card-move-1");
    await userEvent.click(moveCard);

    // Verify related AIF node is highlighted
    const claimNode = screen.getByTestId("aif-node-node-1");
    await waitFor(() => {
      expect(claimNode).toHaveClass("highlighted");
    });

    // Verify DM-node is highlighted
    const dmNode = screen.getByTestId("dm-node-dm-1");
    expect(dmNode).toHaveClass("highlighted");
  });

  it("should filter AIF diagram when toggling dialogue layer", async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AifDiagramViewInteractive
          deliberationId="delib-1"
          graph={mockDeliberationWithDialogue.aifGraph}
        />
      </SWRConfig>
    );

    // Verify DM-node is visible initially
    const dmNode = screen.getByTestId("dm-node-dm-1");
    expect(dmNode).toBeVisible();

    // Toggle dialogue layer off
    const layerControl = screen.getByTestId("dialogue-layer-control");
    const toggleButton = layerControl.querySelector("[data-testid='toggle-dm-nodes']");
    await userEvent.click(toggleButton!);

    // Verify DM-node is hidden
    await waitFor(() => {
      expect(dmNode).not.toBeVisible();
    });

    // Verify claim node is still visible
    const claimNode = screen.getByTestId("aif-node-node-1");
    expect(claimNode).toBeVisible();
  });
});
```

---

## Phase 7.2: Performance Testing (3 days)

### 7.2.1 Database Query Benchmarking

**Goal:** Measure query performance for dialogue-enriched graphs

**Benchmarks:**

```typescript
// scripts/benchmark-dialogue-queries.ts
import { PrismaClient } from "@prisma/client";
import { performance } from "perf_hooks";

const prisma = new PrismaClient();

interface BenchmarkResult {
  query: string;
  avgTime: number;
  p50: number;
  p95: number;
  p99: number;
  iterations: number;
}

async function benchmarkQuery(
  name: string,
  queryFn: () => Promise<any>,
  iterations = 100
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warm-up
  await queryFn();

  // Run benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await queryFn();
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);

  return {
    query: name,
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    p50: times[Math.floor(times.length * 0.5)],
    p95: times[Math.floor(times.length * 0.95)],
    p99: times[Math.floor(times.length * 0.99)],
    iterations,
  };
}

async function runBenchmarks() {
  console.log("🚀 Starting database query benchmarks...\n");

  const deliberationId = "test-delib-id"; // Replace with real ID

  // Benchmark 1: Basic AIF graph query
  const basic = await benchmarkQuery("Basic AIF Graph", async () => {
    return prisma.aifNode.findMany({
      where: { deliberationId },
      include: {
        outgoingEdges: true,
        incomingEdges: true,
      },
    });
  });

  // Benchmark 2: AIF graph with dialogue moves
  const withDialogue = await benchmarkQuery("AIF Graph + Dialogue Moves", async () => {
    return prisma.aifNode.findMany({
      where: { deliberationId },
      include: {
        outgoingEdges: true,
        incomingEdges: true,
        dialogueMove: {
          include: {
            user: true,
            parentMove: true,
            childMoves: true,
          },
        },
      },
    });
  });

  // Benchmark 3: AIF graph with scheme provenance
  const withSchemes = await benchmarkQuery("AIF Graph + Scheme Provenance", async () => {
    return prisma.aifNode.findMany({
      where: { deliberationId },
      include: {
        outgoingEdges: true,
        incomingEdges: true,
        dialogueMove: {
          include: {
            targetCriticalQuestion: {
              include: {
                scheme: true,
              },
            },
          },
        },
        scheme: {
          include: {
            criticalQuestions: true,
          },
        },
      },
    });
  });

  // Benchmark 4: Timeline query (chronological dialogue moves)
  const timeline = await benchmarkQuery("Timeline Query", async () => {
    return prisma.dialogueMove.findMany({
      where: { deliberationId },
      orderBy: { timestamp: "asc" },
      include: {
        user: true,
        targetCriticalQuestion: {
          include: {
            scheme: true,
          },
        },
        aifNodes: true,
      },
    });
  });

  // Benchmark 5: Single node provenance lookup
  const nodeProvenance = await benchmarkQuery("Node Provenance Lookup", async () => {
    const nodes = await prisma.aifNode.findMany({
      where: { deliberationId },
      take: 1,
    });
    if (nodes.length === 0) return null;

    return prisma.aifNode.findUnique({
      where: { id: nodes[0].id },
      include: {
        dialogueMove: {
          include: {
            user: true,
            parentMove: true,
          },
        },
      },
    });
  });

  // Print results
  const results = [basic, withDialogue, withSchemes, timeline, nodeProvenance];

  console.log("📊 Benchmark Results:\n");
  console.table(
    results.map((r) => ({
      Query: r.query,
      "Avg (ms)": r.avgTime.toFixed(2),
      "P50 (ms)": r.p50.toFixed(2),
      "P95 (ms)": r.p95.toFixed(2),
      "P99 (ms)": r.p99.toFixed(2),
    }))
  );

  // Performance assertions
  console.log("\n✅ Performance Validation:\n");

  const assertions = [
    { name: "Basic query < 50ms (p95)", pass: basic.p95 < 50 },
    { name: "Dialogue query < 100ms (p95)", pass: withDialogue.p95 < 100 },
    { name: "Scheme query < 150ms (p95)", pass: withSchemes.p95 < 150 },
    { name: "Timeline query < 100ms (p95)", pass: timeline.p95 < 100 },
    { name: "Provenance lookup < 30ms (p95)", pass: nodeProvenance.p95 < 30 },
  ];

  assertions.forEach((a) => {
    console.log(`${a.pass ? "✓" : "✗"} ${a.name}`);
  });

  const allPassed = assertions.every((a) => a.pass);
  if (!allPassed) {
    console.error("\n❌ Performance benchmarks failed!");
    process.exit(1);
  }

  console.log("\n✅ All performance benchmarks passed!");
}

runBenchmarks()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run Benchmark:**

```bash
npx tsx scripts/benchmark-dialogue-queries.ts
```

---

### 7.2.2 Frontend Rendering Performance

**Goal:** Measure React component render times

```typescript
// scripts/benchmark-component-rendering.tsx
import { performance } from "perf_hooks";
import { renderToString } from "react-dom/server";
import { AifDiagramViewInteractive } from "@/components/aif/AifDiagramViewInteractive";
import { DialogueTimeline } from "@/components/dialogue/DialogueTimeline";

// Generate large test graph
function generateLargeGraph(nodeCount: number) {
  const nodes = [];
  const edges = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      nodeType: i % 3 === 0 ? "I" : i % 3 === 1 ? "RA" : "DM",
      text: `Node ${i} content`,
      dialogueMoveId: i % 5 === 0 ? `move-${i}` : undefined,
    });

    if (i > 0) {
      edges.push({
        id: `edge-${i}`,
        fromNodeId: `node-${i - 1}`,
        toNodeId: `node-${i}`,
        edgeType: "RA",
      });
    }
  }

  return { nodes, edges };
}

function benchmarkRender(name: string, component: React.ReactElement, iterations = 10) {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    renderToString(component);
    const end = performance.now();
    times.push(end - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);

  console.log(`\n📊 ${name}:`);
  console.log(`   Avg: ${avg.toFixed(2)}ms`);
  console.log(`   Min: ${min.toFixed(2)}ms`);
  console.log(`   Max: ${max.toFixed(2)}ms`);

  return { name, avg, max, min };
}

console.log("🚀 Starting frontend rendering benchmarks...\n");

// Test 1: Small graph (50 nodes)
const smallGraph = generateLargeGraph(50);
benchmarkRender(
  "AIF Diagram (50 nodes)",
  <AifDiagramViewInteractive deliberationId="test" graph={smallGraph} />
);

// Test 2: Medium graph (200 nodes)
const mediumGraph = generateLargeGraph(200);
benchmarkRender(
  "AIF Diagram (200 nodes)",
  <AifDiagramViewInteractive deliberationId="test" graph={mediumGraph} />
);

// Test 3: Large graph (500 nodes)
const largeGraph = generateLargeGraph(500);
benchmarkRender(
  "AIF Diagram (500 nodes)",
  <AifDiagramViewInteractive deliberationId="test" graph={largeGraph} />
);

// Test 4: Timeline with 100 moves
const timelineMoves = Array.from({ length: 100 }, (_, i) => ({
  id: `move-${i}`,
  type: "WHY",
  content: `Move ${i} content`,
  timestamp: new Date(Date.now() + i * 60000),
  userId: "user-1",
}));

benchmarkRender(
  "Timeline (100 moves)",
  <DialogueTimeline deliberationId="test" moves={timelineMoves} />
);

console.log("\n✅ Rendering benchmarks complete!");
```

---

### 7.2.3 Load Testing

**Goal:** Test system under concurrent user load

```typescript
// scripts/load-test-dialogue-api.ts
import autocannon from "autocannon";

async function runLoadTest() {
  console.log("🚀 Starting API load test...\n");

  const baseUrl = "http://localhost:3000";

  // Test 1: AIF graph endpoint
  console.log("📊 Testing /api/aif/graph-with-dialogue...");
  const graphTest = autocannon({
    url: `${baseUrl}/api/aif/graph-with-dialogue?deliberationId=test-delib-id`,
    connections: 50, // Concurrent connections
    duration: 30, // 30 seconds
    pipelining: 1,
  });

  await new Promise((resolve) => {
    autocannon.track(graphTest, { renderProgressBar: true });
    graphTest.on("done", resolve);
  });

  // Test 2: Dialogue moves endpoint
  console.log("\n📊 Testing /api/dialogue/moves...");
  const movesTest = autocannon({
    url: `${baseUrl}/api/dialogue/moves?deliberationId=test-delib-id`,
    connections: 50,
    duration: 30,
    pipelining: 1,
  });

  await new Promise((resolve) => {
    autocannon.track(movesTest, { renderProgressBar: true });
    movesTest.on("done", resolve);
  });

  // Test 3: Node provenance endpoint
  console.log("\n📊 Testing /api/aif/nodes/[id]/provenance...");
  const provenanceTest = autocannon({
    url: `${baseUrl}/api/aif/nodes/test-node-id/provenance`,
    connections: 50,
    duration: 30,
    pipelining: 1,
  });

  await new Promise((resolve) => {
    autocannon.track(provenanceTest, { renderProgressBar: true });
    provenanceTest.on("done", resolve);
  });

  console.log("\n✅ Load testing complete!");
}

runLoadTest().catch(console.error);
```

**Install autocannon:**

```bash
yarn add -D autocannon @types/autocannon
```

**Run load test:**

```bash
# Start dev server in one terminal
npm run dev

# Run load test in another terminal
npx tsx scripts/load-test-dialogue-api.ts
```

---

## Phase 7.3: Cross-Browser & Accessibility Testing (3 days)

### 7.3.1 Cross-Browser Compatibility

**Goal:** Verify functionality across Chrome, Firefox, Safari, Edge

**Test Matrix:**

| Feature | Chrome | Firefox | Safari | Edge | Notes |
|---------|--------|---------|--------|------|-------|
| DM-Node Rendering | ✅ | ✅ | ✅ | ✅ | SVG diamond shapes |
| Timeline Scrubber | ✅ | ✅ | ⚠️ | ✅ | Safari: slight drag lag |
| Dialogue Animations | ✅ | ✅ | ✅ | ✅ | Framer Motion |
| Provenance Tooltips | ✅ | ✅ | ✅ | ✅ | Radix UI |
| Export (Markdown) | ✅ | ✅ | ✅ | ✅ | Blob download |
| Export (Video) | ✅ | ⚠️ | ❌ | ✅ | Safari: no MediaRecorder |

**Browser-Specific Tests:**

```typescript
// playwright.config.ts - already configured in 7.1.1
// Run tests across all browsers:
// npx playwright test --project=chromium
// npx playwright test --project=firefox
// npx playwright test --project=webkit
```

**Safari-Specific Workarounds:**

```typescript
// lib/utils/media-recorder-polyfill.ts
export function getMediaRecorder() {
  if (typeof window === "undefined") return null;

  // Check for MediaRecorder support
  if (window.MediaRecorder) {
    return window.MediaRecorder;
  }

  // Safari polyfill fallback
  console.warn("MediaRecorder not supported. Video export disabled.");
  return null;
}
```

---

### 7.3.2 Accessibility Audit

**Goal:** Ensure WCAG 2.1 AA compliance

**Automated Testing:**

```bash
# Install axe-core
yarn add -D @axe-core/playwright

# Add to E2E tests
```

```typescript
// e2e/accessibility/dialogue-a11y.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Dialogue Visualization Accessibility", () => {
  test("should not have accessibility violations on AIF diagram page", async ({ page }) => {
    await page.goto("/deliberation/test-delib-id");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should not have violations on timeline page", async ({ page }) => {
    await page.goto("/deliberation/test-delib-id/timeline");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("dialogue moves should have proper ARIA labels", async ({ page }) => {
    await page.goto("/deliberation/test-delib-id");

    // Check dialogue move cards
    const moveCard = page.locator("[data-testid='move-card']").first();
    const ariaLabel = await moveCard.getAttribute("aria-label");

    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toMatch(/dialogue move/i);
  });

  test("DM-nodes should be keyboard navigable", async ({ page }) => {
    await page.goto("/deliberation/test-delib-id");

    // Focus first DM-node
    await page.keyboard.press("Tab");
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));

    expect(focusedElement).toMatch(/dm-node/);

    // Press Enter to open modal
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-testid='dm-modal']")).toBeVisible();

    // Escape to close
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-testid='dm-modal']")).not.toBeVisible();
  });

  test("timeline playback controls should have accessible labels", async ({ page }) => {
    await page.goto("/deliberation/test-delib-id/timeline");

    const playButton = page.locator("[data-testid='timeline-play-button']");
    const ariaLabel = await playButton.getAttribute("aria-label");

    expect(ariaLabel).toMatch(/play|pause/i);

    // Verify keyboard control
    await playButton.focus();
    await page.keyboard.press("Space");

    // Check state change
    const playing = await playButton.getAttribute("data-playing");
    expect(playing).toBe("true");
  });
});
```

**Manual Accessibility Checklist:**

- [ ] All interactive elements keyboard accessible (Tab, Enter, Space, Escape)
- [ ] Focus indicators visible on all focusable elements
- [ ] ARIA labels present on icon buttons
- [ ] Screen reader announces dialogue move types ("Challenge", "Answer", etc.)
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Timeline scrubber operable with keyboard (arrow keys)
- [ ] Tooltips dismissible with Escape key
- [ ] Form validation errors announced to screen readers
- [ ] Heading hierarchy correct (h1 → h2 → h3)
- [ ] Images have alt text (or role="presentation" if decorative)

---

## Phase 7.4: Deployment Preparation (2 days)

### 7.4.1 Staging Environment Setup

**Goal:** Create staging environment for final validation

**Infrastructure (AWS EKS):**

```yaml
# k8s/staging/dialogue-viz-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mesh-app-staging
  namespace: staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mesh-app
      env: staging
  template:
    metadata:
      labels:
        app: mesh-app
        env: staging
    spec:
      containers:
      - name: mesh-app
        image: mesh/app:dialogue-viz-staging
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: staging-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: staging-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: mesh-app-service
  namespace: staging
spec:
  selector:
    app: mesh-app
    env: staging
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

**Database Migration Plan:**

```bash
# scripts/deploy-to-staging.sh
#!/bin/bash

set -e

echo "🚀 Deploying dialogue visualization to staging..."

# 1. Backup production database
echo "📦 Creating database backup..."
pg_dump $STAGING_DATABASE_URL > backups/staging-$(date +%Y%m%d-%H%M%S).sql

# 2. Run migrations
echo "🗄️  Running Prisma migrations..."
npx prisma migrate deploy --schema=./lib/models/schema.prisma

# 3. Seed dialogue test data
echo "🌱 Seeding test data..."
npx tsx scripts/seed-staging-dialogue-data.ts

# 4. Build application
echo "🔨 Building Next.js app..."
npm run build

# 5. Deploy to k8s
echo "☸️  Deploying to Kubernetes..."
kubectl apply -f k8s/staging/dialogue-viz-deployment.yaml

# 6. Wait for rollout
echo "⏳ Waiting for rollout..."
kubectl rollout status deployment/mesh-app-staging -n staging

# 7. Smoke tests
echo "🧪 Running smoke tests..."
npx playwright test e2e/smoke --config=playwright.staging.config.ts

echo "✅ Deployment complete!"
echo "🌐 Staging URL: https://staging.mesh.com"
```

---

### 7.4.2 Rollback Procedures

**Goal:** Define rollback plan in case of issues

**Rollback Script:**

```bash
# scripts/rollback-dialogue-viz.sh
#!/bin/bash

set -e

echo "⏪ Rolling back dialogue visualization feature..."

# 1. Revert k8s deployment
echo "☸️  Reverting Kubernetes deployment..."
kubectl rollout undo deployment/mesh-app-staging -n staging

# 2. Restore database backup
echo "🗄️  Restoring database from backup..."
read -p "Enter backup file name (e.g., staging-20241102-120000.sql): " BACKUP_FILE
psql $STAGING_DATABASE_URL < backups/$BACKUP_FILE

# 3. Clear Redis cache
echo "🗑️  Clearing Redis cache..."
redis-cli -u $REDIS_URL FLUSHDB

# 4. Verify rollback
echo "✅ Rollback complete. Running verification..."
curl -f https://staging.mesh.com/health || echo "❌ Health check failed"

echo "✅ Rollback successful!"
```

**Feature Flag Approach (Gradual Rollout):**

```typescript
// lib/features/dialogue-viz-flag.ts
import { unstable_flag as flag } from "@vercel/flags/next";

export const dialogueVisualizationEnabled = flag({
  key: "dialogue-visualization",
  decide: async ({ userId }) => {
    // Enable for beta testers
    const betaUsers = await getBetaUsers();
    if (betaUsers.includes(userId)) return true;

    // Enable for 10% of users
    const userHash = hashUserId(userId);
    return userHash % 100 < 10;
  },
});
```

```typescript
// app/deliberation/[id]/page.tsx
import { dialogueVisualizationEnabled } from "@/lib/features/dialogue-viz-flag";

export default async function DeliberationPage({ params }) {
  const enabled = await dialogueVisualizationEnabled();

  if (!enabled) {
    // Show old UI without dialogue visualization
    return <LegacyDeliberationView deliberationId={params.id} />;
  }

  // Show new UI with dialogue visualization
  return <DeliberationViewWithDialogue deliberationId={params.id} />;
}
```

---

## Phase 7.5: Documentation & Monitoring (2 days)

### 7.5.1 Integration Documentation

**Goal:** Document integration points for future developers

Create `docs/dialogue-visualization-integration.md`:

```markdown
# Dialogue Visualization Integration Guide

## Overview

The dialogue visualization system integrates dialogue protocol moves with AIF argumentation graphs, providing three primary views:

1. **DM-Nodes in AIF Diagrams:** Dialogue moves appear as diamond-shaped nodes
2. **Timeline Playback:** Chronological visualization with video-like controls
3. **Scheme Provenance:** CQ status badges showing dialogue history

## Key Integration Points

### 1. Database Schema

**Models:**
- `AifNode` — Added `dialogueMoveId` foreign key
- `AifEdge` — Connects AIF and DM nodes
- `DialogueMove` — Added `targetCriticalQuestionId` for scheme provenance

**Relationships:**
```prisma
model AifNode {
  dialogueMove   DialogueMove? @relation(fields: [dialogueMoveId], references: [id])
  dialogueMoveId String?
}

model DialogueMove {
  aifNodes               AifNode[]
  targetCriticalQuestion CriticalQuestion? @relation(fields: [targetCriticalQuestionId], references: [id])
  targetCriticalQuestionId String?
}
```

### 2. API Endpoints

**GET /api/aif/graph-with-dialogue**
- Returns AIF graph with embedded dialogue moves
- Response includes DM-nodes and provenance metadata

**GET /api/aif/nodes/[id]/provenance**
- Returns dialogue provenance for specific AIF node
- Used by ProvenanceTooltip component

**GET /api/dialogue/moves**
- Returns dialogue moves for deliberation
- Supports chronological ordering for timeline view

### 3. React Components

**AifDiagramViewInteractive**
- Extended to render DM-nodes alongside I/RA/CA/PA nodes
- Includes `DialogueLayerControl` for toggling DM-node visibility

**DialogueTimeline**
- Standalone component for timeline view
- Syncs with AIF diagram via shared state

**SchemeCardWithDialogue**
- Extends existing scheme cards with CQ provenance badges
- Shows challenge→answer dialogue flow

### 4. Data Flow

```
User submits dialogue move
  → POST /api/dialogue/moves
  → Prisma creates DialogueMove record
  → Background job creates AIF node
  → SWR revalidates AIF graph
  → React components re-render with new DM-node
```

## Adding New Dialogue Move Types

1. Update `DialogueMoveType` enum in schema.prisma
2. Add visual styling in `components/dialogue/DmNode.tsx`
3. Update `lib/aif/ontology.ts` with new move metadata
4. Add tests in `e2e/journeys/`

## Performance Considerations

- AIF graph queries include dialogue data via Prisma `include`
- Use `DialogueLayerControl` to hide DM-nodes for large graphs (>200 nodes)
- Timeline view uses virtualization for >100 moves
- SWR caching reduces API calls (5s revalidation interval)

## Troubleshooting

**Issue:** DM-nodes not appearing in AIF diagram
- Check `dialogueMoveId` is set on AIF nodes
- Verify dialogue layer is enabled in `DialogueLayerControl`

**Issue:** Timeline playback laggy
- Reduce playback speed
- Check for large number of moves (>200)
- Consider implementing pagination

**Issue:** Provenance tooltips not showing
- Verify `dialogueMove` relation is included in API response
- Check tooltip hover delay (default 300ms)
```

---

### 7.5.2 Monitoring & Alerts

**Goal:** Set up monitoring for dialogue visualization features

**Datadog Dashboard:**

```json
{
  "title": "Dialogue Visualization Metrics",
  "widgets": [
    {
      "definition": {
        "title": "AIF Graph API Latency (p95)",
        "type": "timeseries",
        "requests": [
          {
            "q": "p95:mesh.api.aif.graph_with_dialogue.latency{env:production}",
            "display_type": "line"
          }
        ]
      }
    },
    {
      "definition": {
        "title": "Dialogue Move Creation Rate",
        "type": "query_value",
        "requests": [
          {
            "q": "sum:mesh.dialogue.move.created{env:production}.as_count()",
            "aggregator": "avg"
          }
        ]
      }
    },
    {
      "definition": {
        "title": "Timeline Export Success Rate",
        "type": "query_value",
        "requests": [
          {
            "q": "sum:mesh.timeline.export.success{env:production}.as_count() / sum:mesh.timeline.export.total{env:production}.as_count() * 100",
            "aggregator": "avg"
          }
        ]
      }
    },
    {
      "definition": {
        "title": "DM-Node Render Errors",
        "type": "timeseries",
        "requests": [
          {
            "q": "sum:mesh.component.dm_node.error{env:production}.as_count()",
            "display_type": "bars"
          }
        ]
      }
    }
  ]
}
```

**Alert Rules:**

```yaml
# alerts/dialogue-viz-alerts.yaml
- name: "AIF Graph API Slow"
  condition: "p95:mesh.api.aif.graph_with_dialogue.latency{env:production} > 200"
  message: "AIF graph API is slow (>200ms p95). Check database query performance."
  notify:
    - "@team-mesh"

- name: "Dialogue Move Creation Failed"
  condition: "sum:mesh.dialogue.move.error{env:production}.as_count() > 10"
  message: "High rate of dialogue move creation errors. Check API logs."
  notify:
    - "@team-mesh"
    - "@oncall-engineer"

- name: "Timeline Export Failure Rate High"
  condition: "sum:mesh.timeline.export.error{env:production}.as_count() / sum:mesh.timeline.export.total{env:production}.as_count() > 0.1"
  message: "Timeline export failure rate >10%. Check export functionality."
  notify:
    - "@team-mesh"
```

---

## Testing Checklist

### 7.T1: Integration Tests
- [ ] All E2E journeys pass (challenge argument, timeline playback, multi-user)
- [ ] Component integration tests pass (dialogue-AIF, timeline-diagram sync)
- [ ] API integration tests pass (graph queries, provenance lookups)

### 7.T2: Performance Tests
- [ ] Database queries meet benchmarks (<100ms p95)
- [ ] Frontend rendering meets targets (<100ms for 200 nodes)
- [ ] Load tests pass (50 concurrent users, <500ms response time)

### 7.T3: Cross-Browser Tests
- [ ] All features work in Chrome, Firefox, Safari, Edge
- [ ] Safari fallback for MediaRecorder implemented
- [ ] Mobile responsive design tested

### 7.T4: Accessibility Tests
- [ ] Automated axe-core tests pass (zero violations)
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader compatibility verified
- [ ] WCAG 2.1 AA compliance confirmed

### 7.T5: Deployment Tests
- [ ] Staging deployment successful
- [ ] Smoke tests pass in staging environment
- [ ] Rollback procedure documented and tested
- [ ] Feature flag system functional

### 7.T6: Monitoring & Docs
- [ ] Datadog dashboard created
- [ ] Alert rules configured
- [ ] Integration documentation complete
- [ ] Troubleshooting guide written

---

## Success Criteria

### Functional Requirements
- ✅ All E2E test journeys pass across browsers
- ✅ Zero critical accessibility violations
- ✅ All performance benchmarks met

### Non-Functional Requirements
- ✅ Test coverage >80% for new components
- ✅ API response times <200ms p95
- ✅ Zero data loss during rollback
- ✅ Monitoring dashboards live

### User Experience
- ✅ Smooth transitions and animations
- ✅ Clear error messages
- ✅ Responsive on mobile devices
- ✅ No visual regressions

---

## Estimated Timeline

| Task | Duration | Dependencies |
|------|----------|--------------|
| 7.1 Integration Test Suite | 4 days | Phases 1-6 |
| 7.2 Performance Testing | 3 days | 7.1 |
| 7.3 Cross-Browser & A11y | 3 days | 7.1 |
| 7.4 Deployment Prep | 2 days | 7.1-7.3 |
| 7.5 Docs & Monitoring | 2 days | 7.4 |
| **Total** | **2 weeks** | — |

---

## Next Steps

After completing Phase 7:
1. Review all test results with QA team
2. Conduct final security audit
3. Schedule production deployment
4. Prepare user training materials (Phase 8)
5. Plan post-launch monitoring strategy

---

## Dependencies

**Required:**
- Phases 1-6 complete and tested
- Test database with realistic dialogue data
- Staging environment provisioned
- CI/CD pipeline configured

**Optional:**
- Feature flag system (for gradual rollout)
- Load balancer configuration
- CDN setup for static assets

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance regressions | High | Comprehensive benchmarking; rollback plan |
| Browser compatibility issues | Medium | Cross-browser E2E tests; polyfills |
| Accessibility violations | High | Automated + manual audits; remediation plan |
| Data migration failures | Critical | Database backups; dry-run migrations |
| Load test failures | Medium | Incremental load testing; infrastructure scaling |

---

**Status:** 📋 Ready to begin  
**Owner:** QA Team + DevOps  
**Sprint:** Sprint 13-14  
**Review Checkpoint:** End of Phase 7
