import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "path";
import fs from "fs";

test.describe("Phase 1: Landing Page", () => {
  test("renders landing page, verifies CTA navigation, axe audit, and captures screenshots", async ({
    page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // 1. Check title and primary elements
    await expect(page).toHaveTitle(/Museum of Us/);
    const heading = page.locator("h1");
    await expect(heading).toContainText("Turn your photos into a museum");

    // 2. Check Demo banner
    const demoBanner = page.locator(
      'aside[aria-label="Demo mode announcement"]',
    );
    await expect(demoBanner).toBeVisible();
    await expect(demoBanner).toContainText(
      "Demo mode — data stays in this browser",
    );

    // 3. Accessibility audit with Axe
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const criticalOrSerious = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(criticalOrSerious).toEqual([]);

    // 4. Capture screenshot
    const screenshotsDir = path.resolve("e2e/__screenshots__");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const isMobile = testInfo.project.name.includes("mobile");
    const screenshotPath = path.join(
      screenshotsDir,
      isMobile ? "landing-mobile.png" : "landing-desktop.png",
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // 5. Test CTA navigation
    const cta = page.getByRole("link", { name: "Make one for your partner" });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/create/);

    // 6. Verify zero console errors
    expect(consoleErrors).toEqual([]);
  });
});
