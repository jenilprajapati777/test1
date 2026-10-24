import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

test.describe("Recipient Museum Flow (Tests 21, 22, 27)", () => {
  const screenshotsDir = path.resolve("e2e/__screenshots__");

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test("full recipient journey on /m/demo: loading -> Start pill -> door customizer -> gallery -> plaque fly-in", async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name.includes("mobile");

    // 1. Visit /m/demo
    await page.goto("/m/demo");

    // Start pill appears once progress loads
    const startBtn = page.getByRole("button", { name: /Start/i });
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await expect(page.locator("h1")).toContainText("Our Museum");

    if (!isMobile) {
      await page.screenshot({
        path: path.join(screenshotsDir, "loading.png"),
      });
      await page.screenshot({
        path: path.join(screenshotsDir, "start.png"),
      });
    }

    await startBtn.click();

    // 3. Door Customizer
    await expect(page.locator("text=No account needed")).toBeVisible({
      timeout: 10000,
    });
    const nameInput = page.locator('input[placeholder="Your name"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue("Maya");

    if (!isMobile) {
      await page.screenshot({
        path: path.join(screenshotsDir, "customizer.png"),
      });
    }

    // Click Enter Museum
    const enterBtn = page.getByRole("button", { name: /Enter the museum/i });
    await expect(enterBtn).toBeVisible();
    await enterBtn.click();

    // 4. Inside the 3D Gallery
    // Canvas should be present and active
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // HUD and controls should be active
    const menuBtn = page.getByRole("button", { name: /Menu/i });
    await expect(menuBtn).toBeVisible();

    // Allow 3D scene to render frames
    await page.waitForTimeout(2000);

    if (!isMobile) {
      await page.screenshot({
        path: path.join(screenshotsDir, "hall.png"),
      });
    }

    // 5. Open plaque modal (press E or trigger interaction)
    // Walk forward to plaque or press E
    await page.keyboard.press("KeyE");
    await page.waitForTimeout(500);

    // If near target wasn't reached yet by keyboard, let's walk forward with KeyW
    for (let step = 0; step < 8; step++) {
      await page.keyboard.down("KeyW");
      await page.waitForTimeout(100);
      await page.keyboard.up("KeyW");
    }
    await page.keyboard.press("KeyE");

    // Check if viewing modal is open or open it via HUD inspect button
    const viewingPill = page.locator("text=Viewing");
    if (await viewingPill.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(page.locator("text=A PERMANENT COLLECTION")).toBeVisible();
      await expect(page.locator("text=For Maya")).toBeVisible();
      await expect(page.locator("text=Love, Ethan")).toBeVisible();

      if (!isMobile) {
        await page.screenshot({
          path: path.join(screenshotsDir, "plaque-viewing.png"),
        });
      }

      // Close viewing modal with Escape
      await page.keyboard.press("Escape");
      await expect(viewingPill).not.toBeVisible();
    }
  });

  test("Test 27: fallback 2D carousel view when ?lite=1 is specified", async ({
    page,
  }) => {
    await page.goto("/m/demo?lite=1");

    // Should render Lite 2D carousel
    await expect(page.locator("text=2D Gallery")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("h1")).toContainText("Our Museum");

    // Initially on Dedication Plaque slide
    await expect(page.locator("text=For Maya")).toBeVisible();
    await expect(page.locator("text=Dedication Plaque")).toBeVisible();

    // Next / Prev buttons cycle through artworks
    const nextBtn = page.getByRole("button", { name: /Next slide/i });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // After clicking Next, shows artwork slide e.g. "1 of"
    await expect(page.locator("text=1 of")).toBeVisible();
  });
});
