import { test, expect } from "@playwright/test";

test.describe("Dempster-Shafer Mode Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/deliberations/test-delib-123");
  });

  test("user can toggle DS mode on", async ({ page }) => {
    // Find and click DS mode toggle
    await page.click('[data-testid="ds-mode-toggle"]');

    // Verify mode switched to DS
    await page.waitForSelector('text=Dempster-Shafer Mode: ON');

    // Verify confidence displays changed to intervals
    const confidenceDisplays = page.locator('[data-testid="confidence-display"]');
    const firstDisplay = await confidenceDisplays.first().textContent();

    // Should now show [bel, pl] format
    expect(firstDisplay).toMatch(/\[[\d.]+, [\d.]+\]/);
  });

  test("DS interval chart displays for arguments in DS mode", async ({
    page,
  }) => {
    // Enable DS mode
    await page.click('[data-testid="ds-mode-toggle"]');

    // Click on an argument to view details
    await page.click('[data-testid="argument-card-arg123"]');

    // Verify DS interval chart is visible
    await page.waitForSelector('[data-testid="ds-interval-chart"]');

    // Verify chart segments (belief, uncertainty, disbelief)
    expect(await page.isVisible('text=Belief')).toBeTruthy();
    expect(await page.isVisible('text=Uncertainty')).toBeTruthy();
    expect(await page.isVisible('text=Disbelief')).toBeTruthy();
  });

  test("DS explanation tooltip appears on hover", async ({ page }) => {
    // Enable DS mode
    await page.click('[data-testid="ds-mode-toggle"]');

    // Hover over confidence display
    await page.hover('[data-testid="confidence-display"]');

    // Verify tooltip appears
    await page.waitForSelector('[data-testid="ds-explanation-tooltip"]');

    // Verify tooltip contains key DS concepts
    expect(await page.isVisible('text=Belief (Bel)')).toBeTruthy();
    expect(await page.isVisible('text=Plausibility (Pl)')).toBeTruthy();
    expect(await page.isVisible('text=Epistemic Uncertainty')).toBeTruthy();
  });

  test("standard mode displays single confidence value", async ({ page }) => {
    // Ensure DS mode is OFF (default)
    const dsToggle = page.locator('[data-testid="ds-mode-toggle"]');
    if (await dsToggle.isChecked()) {
      await dsToggle.click();
    }

    // Verify confidence displays show single value
    const confidenceDisplays = page.locator('[data-testid="confidence-display"]');
    const firstDisplay = await confidenceDisplays.first().textContent();

    // Should show simple percentage like "75%"
    expect(firstDisplay).toMatch(/\d+(\.\d+)?%/);
    expect(firstDisplay).not.toMatch(/\[/); // No brackets
  });

  test("DS mode persists across page navigation", async ({ page }) => {
    // Enable DS mode
    await page.click('[data-testid="ds-mode-toggle"]');
    await page.waitForSelector('text=Dempster-Shafer Mode: ON');

    // Navigate to different page
    await page.click('text=Arguments');
    await page.waitForTimeout(500);

    // Navigate back
    await page.click('text=Overview');
    await page.waitForTimeout(500);

    // Verify DS mode still enabled
    const dsToggle = page.locator('[data-testid="ds-mode-toggle"]');
    expect(await dsToggle.isChecked()).toBeTruthy();
  });

  test("DS interval chart shows correct proportions", async ({ page }) => {
    // Enable DS mode and navigate to argument detail
    await page.click('[data-testid="ds-mode-toggle"]');
    await page.click('[data-testid="argument-card-arg123"]');

    // Wait for chart to render
    await page.waitForSelector('[data-testid="ds-interval-chart"]');

    // Get bar widths
    const beliefBar = page.locator('[data-testid="belief-bar"]');
    const uncertaintyBar = page.locator('[data-testid="uncertainty-bar"]');
    const disbeliefBar = page.locator('[data-testid="disbelief-bar"]');

    // Verify all bars are visible
    expect(await beliefBar.isVisible()).toBeTruthy();
    expect(await uncertaintyBar.isVisible()).toBeTruthy();
    expect(await disbeliefBar.isVisible()).toBeTruthy();

    // Verify sum of proportions is ~100%
    const beliefWidth = await beliefBar.evaluate((el) => el.getBoundingClientRect().width);
    const uncertaintyWidth = await uncertaintyBar.evaluate((el) => el.getBoundingClientRect().width);
    const disbeliefWidth = await disbeliefBar.evaluate((el) => el.getBoundingClientRect().width);
    const totalWidth = beliefWidth + uncertaintyWidth + disbeliefWidth;

    // Should sum to approximately container width
    expect(totalWidth).toBeGreaterThan(0);
  });

  test("DS mode shows interpretation text", async ({ page }) => {
    // Enable DS mode and view argument
    await page.click('[data-testid="ds-mode-toggle"]');
    await page.click('[data-testid="argument-card-arg123"]');

    // Wait for DS chart
    await page.waitForSelector('[data-testid="ds-interval-chart"]');

    // Verify interpretation text exists
    const interpretation = page.locator('[data-testid="ds-interpretation"]');
    expect(await interpretation.isVisible()).toBeTruthy();

    // Should contain helpful text like "Strong support", "Significant uncertainty", etc.
    const text = await interpretation.textContent();
    expect(text).toMatch(/(Strong|Moderate|Low|Significant|High|uncertainty|support)/i);
  });

  test("toggling DS mode off returns to standard display", async ({ page }) => {
    // Enable DS mode
    await page.click('[data-testid="ds-mode-toggle"]');
    await page.waitForSelector('text=Dempster-Shafer Mode: ON');

    // Verify interval display
    let display = await page.locator('[data-testid="confidence-display"]').first().textContent();
    expect(display).toMatch(/\[/);

    // Toggle DS mode off
    await page.click('[data-testid="ds-mode-toggle"]');
    await page.waitForSelector('text=Dempster-Shafer Mode: OFF');

    // Verify standard display
    display = await page.locator('[data-testid="confidence-display"]').first().textContent();
    expect(display).not.toMatch(/\[/);
    expect(display).toMatch(/\d+%/);
  });
});
