import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Setup Diagnostics & Accessibility Compliance (Tests 28, 29)", () => {
  test("Test 28: /setup page displays system diagnostics and live guide", async ({
    page,
  }) => {
    await page.goto("/setup");
    await expect(page).toHaveTitle(/Museum of Us/);

    // Diagnostics heading
    await expect(page.locator("h1")).toContainText("Environment & Live Setup");

    // Status banner
    await expect(
      page.getByRole("heading", { name: /Demo Mode Active/ }),
    ).toBeVisible({
      timeout: 10000,
    });

    // Verify key checks
    await expect(
      page.getByRole("heading", { name: "Supabase Environment Variables" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Supabase Reachability" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Database Schema & RPC Functions" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /How to Go Live/ }),
    ).toBeVisible();
  });

  test("Test 29: Accessibility audits on /create, /dashboard, /setup, /privacy, /terms", async ({
    page,
  }) => {
    const routesToAudit = [
      "/create",
      "/dashboard",
      "/setup",
      "/privacy",
      "/terms",
    ];

    for (const route of routesToAudit) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const criticalOrSerious = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );

      expect(criticalOrSerious, `Accessibility violations on ${route}`).toEqual(
        [],
      );
    }
  });
});
