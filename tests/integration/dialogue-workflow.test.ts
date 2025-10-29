import { test, expect } from "@playwright/test";

test.describe("Dialogue Tracking Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/deliberations/test-delib-789");
  });

  test("dialogue state badge updates as attacks are answered", async ({
    page,
  }) => {
    // Navigate to argument with attacks
    await page.click('[data-testid="argument-card-arg123"]');

    // Check initial dialogue state badge (e.g., "2/5")
    const initialBadge = await page.textContent(
      '[data-testid="dialogue-state-badge"]'
    );
    expect(initialBadge).toMatch(/\d+\/\d+/);

    // Add a GROUNDS response to an attack
    await page.click('[data-testid="answer-attack-btn"]');
    await page.fill('textarea[name="premise"]', "This is my GROUNDS response");
    await page.click('button:has-text("Submit Response")');

    // Wait for badge to update (should increment answered count)
    await page.waitForTimeout(1000);
    const updatedBadge = await page.textContent(
      '[data-testid="dialogue-state-badge"]'
    );

    // Verify answered count increased
    const [initialAnswered] = initialBadge!.split("/").map(Number);
    const [updatedAnswered] = updatedBadge!.split("/").map(Number);
    expect(updatedAnswered).toBe(initialAnswered + 1);
  });

  test("answered attacks panel shows responses with votes", async ({ page }) => {
    await page.click('[data-testid="argument-card-arg123"]');

    // Open answered attacks panel
    await page.click('button:has-text("View Answers")');

    // Wait for panel to load
    await page.waitForSelector('[data-testid="answered-attacks-panel"]');

    // Verify attack-response pairs displayed
    const attackCards = page.locator('[data-testid="attack-response-pair"]');
    expect(await attackCards.count()).toBeGreaterThan(0);

    // Check for vote buttons
    expect(await page.isVisible('button[title="Upvote response"]')).toBeTruthy();
    expect(
      await page.isVisible('button[title="Downvote response"]')
    ).toBeTruthy();
  });

  test("user can vote on response quality", async ({ page }) => {
    await page.goto("/deliberations/test-delib-789/arguments/arg123/responses");

    // Find a response and upvote it
    const upvoteBtn = page.locator('button[title="Upvote response"]').first();
    await upvoteBtn.click();

    // Verify vote count increased
    await page.waitForSelector('[data-testid="vote-count-updated"]');

    // Verify upvote button is now highlighted/disabled
    expect(await upvoteBtn.getAttribute("aria-pressed")).toBe("true");
  });

  test("user can flag inappropriate responses", async ({ page }) => {
    await page.goto("/deliberations/test-delib-789/arguments/arg123/responses");

    // Click flag button
    await page.click('button[title="Flag response"]');

    // Fill flag reason
    await page.fill('textarea[name="flagReason"]', "Off-topic response");
    await page.click('button:has-text("Submit Flag")');

    // Verify flag confirmation
    await page.waitForSelector('text=Response flagged for review');
  });

  test("dialogue state badge color changes based on completion", async ({
    page,
  }) => {
    // Test red (pending) state
    await page.goto("/deliberations/test-delib-789/arguments/arg-pending");
    let badge = page.locator('[data-testid="dialogue-state-badge"]');
    expect(await badge.evaluate((el) => el.className)).toContain("bg-red");

    // Test yellow (partial) state
    await page.goto("/deliberations/test-delib-789/arguments/arg-partial");
    badge = page.locator('[data-testid="dialogue-state-badge"]');
    expect(await badge.evaluate((el) => el.className)).toContain("bg-yellow");

    // Test green (complete) state
    await page.goto("/deliberations/test-delib-789/arguments/arg-complete");
    badge = page.locator('[data-testid="dialogue-state-badge"]');
    expect(await badge.evaluate((el) => el.className)).toContain("bg-green");
  });

  test("user can filter arguments by dialogue state", async ({ page }) => {
    // Open filter menu
    await page.click('[data-testid="dialogue-filter-button"]');

    // Select "Pending" filter
    await page.click('input[value="PENDING"]');
    await page.click('button:has-text("Apply Filter")');

    // Verify only pending arguments shown
    const badges = page.locator('[data-testid="dialogue-state-badge"]');
    const count = await badges.count();

    for (let i = 0; i < count; i++) {
      const badgeText = await badges.nth(i).textContent();
      const [answered, total] = badgeText!.split("/").map(Number);
      expect(answered).toBe(0); // All should be 0/N for pending
    }
  });

  test("answered attacks panel shows attack scheme types", async ({ page }) => {
    await page.goto("/deliberations/test-delib-789/arguments/arg123");

    // Open answered attacks panel
    await page.click('button:has-text("View Answers")');

    // Verify attack schemes displayed
    await page.waitForSelector('[data-testid="attack-scheme"]');
    expect(await page.isVisible('text=Argument from Expert Opinion')).toBeTruthy();
  });

  test("user can navigate to original attack from panel", async ({ page }) => {
    await page.goto("/deliberations/test-delib-789/arguments/arg123");

    // Open answered attacks panel
    await page.click('button:has-text("View Answers")');

    // Click on an attack to navigate
    await page.click('[data-testid="attack-link"]');

    // Verify navigation to attack detail page
    expect(page.url()).toContain("/arguments/");
  });
});
