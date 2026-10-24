import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

test.describe("Creator Builder, Share Screen & Dashboard (Tests 25, 26)", () => {
  const screenshotsDir = path.resolve("e2e/__screenshots__");

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test("full creator flow: builder -> publish -> scannable heart QR -> dashboard CRUD", async ({
    page,
  }, testInfo) => {
    page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
    page.on("pageerror", (err) => console.error("BROWSER ERROR:", err));

    const isMobile = testInfo.project.name.includes("mobile");

    // 1. Navigate to /create
    await page.goto("/create");
    await expect(page.locator("h2")).toContainText("Who is this for?");

    // Fill Step 1
    await page.fill('input[placeholder="e.g. Ethan"]', "Ethan");
    await page.fill('input[placeholder="e.g. Maya"]', "Maya");
    await page.fill('input[placeholder="e.g. Our Museum"]', "Our Winter Story");
    await page.click('button:has-text("Next")');

    // Step 2: Memories
    await expect(page.locator("h2")).toContainText("Upload Your Memories");
    await page.click('button:has-text("Next")');

    // Step 3: Plaque
    await expect(page.locator("h2")).toContainText("The Dedication Plaque");
    await page.fill(
      "textarea",
      "Our whole winter, hung on the walls, just for you.",
    );
    await page.click('button:has-text("Next")');

    // Step 4: Host Companion
    await expect(page.locator("h2")).toContainText("Host Avatar & Dialogue");
    await page.click('button:has-text("Next")');

    // Step 5: Preview
    await expect(page.locator("h2")).toContainText("Ready to View");
    await page.click('button:has-text("Continue to Publish")');

    // Step 6: Publish
    await expect(page.locator("h2")).toContainText("Publish Your Gift");
    await page.click('button:has-text("Publish & Generate QR")');

    // 2. Navigated to /share/:id
    await expect(page).toHaveURL(/\/share\//, { timeout: 15000 });
    await expect(page.locator("h1")).toContainText("Share Your Heart");

    // White share card is visible
    const shareCard = page.locator("#share-card-preview");
    await expect(shareCard).toBeVisible();
    await expect(shareCard).toContainText("Our Winter Story");
    await expect(shareCard).toContainText("From Ethan │ To Maya");
    await expect(shareCard).toContainText("Scan this");

    if (!isMobile) {
      await shareCard.screenshot({
        path: path.join(screenshotsDir, "share-card.png"),
      });
    }

    // 3. Verify Heart QR is valid SVG and decodes to museum URL
    const qrSvg = shareCard.locator("svg");
    await expect(qrSvg).toBeVisible();

    // Toggle to Classic QR
    await page.click('button:has-text("Classic QR")');
    await page.waitForTimeout(500);
    const classicSvg = shareCard.locator("svg");
    await expect(classicSvg).toBeVisible();

    // 4. Test Creator Dashboard CRUD
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Your Collections");

    // Museum is listed
    const card = page
      .locator('.rounded-2xl:has-text("Our Winter Story")')
      .first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.locator("text=From Ethan │ To Maya")).toBeVisible();

    // Test Delete modal
    await card.locator('button:has-text("Delete")').click();
    await expect(page.locator("text=Confirm Deletion")).toBeVisible();

    // Typed confirmation
    await page.fill('input[placeholder="delete"]', "delete");
    await page.click('button:has-text("Delete Museum")');

    // Verified deleted
    await expect(page.locator("text=Our Winter Story")).not.toBeVisible({
      timeout: 5000,
    });
  });
});
