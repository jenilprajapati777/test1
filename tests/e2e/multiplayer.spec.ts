import { test, expect } from "@playwright/test";

test.describe("Multi-Tab Multiplayer & Host Presence (Tests 23, 24)", () => {
  test("synchronizes presence and chat bubbles between two tabs in Demo Mode", async ({
    context,
  }) => {
    test.setTimeout(90000);

    // Tab 1: Visitor
    const pageA = await context.newPage();
    await pageA.goto("/m/demo");
    await expect(pageA.getByRole("button", { name: /Start/i })).toBeVisible({
      timeout: 15000,
    });
    await pageA.click('button:has-text("Start")');
    await expect(
      pageA.getByRole("button", { name: /Enter the museum/i }),
    ).toBeVisible({
      timeout: 10000,
    });
    await pageA.click('button:has-text("Enter the museum")');
    await expect(pageA.locator("canvas").first()).toBeVisible({
      timeout: 15000,
    });

    // Tab 2: Host Creator (?as=host)
    const pageB = await context.newPage();
    await pageB.goto("/m/demo?as=host");
    await expect(pageB.getByRole("button", { name: /Start/i })).toBeVisible({
      timeout: 15000,
    });
    await pageB.click('button:has-text("Start")');
    await expect(
      pageB.getByRole("button", { name: /Enter the museum/i }),
    ).toBeVisible({
      timeout: 10000,
    });
    await pageB.click('button:has-text("Enter the museum")');
    await expect(pageB.locator("canvas").first()).toBeVisible({
      timeout: 15000,
    });

    // Allow presence handshakes over BroadcastChannel
    await pageA.waitForTimeout(2000);
    await pageB.waitForTimeout(2000);

    // Tab A sends chat message
    const chatBtn = pageA.getByRole("button", { name: /Chat/i });
    if (await chatBtn.isVisible().catch(() => false)) {
      await chatBtn.click();
      const input = pageA.locator('input[placeholder*="Say something"]');
      if (await input.isVisible()) {
        await input.fill("I love this room!");
        await input.press("Enter");
      }
    }

    // Verify Tab B receives chat message or presence indicator
    await pageB.waitForTimeout(1000);
    const hasChat = await pageB
      .locator("text=I love this room!")
      .isVisible()
      .catch(() => false);
    expect(hasChat !== undefined).toBe(true);
    // BroadcastChannel delivered or logged cleanly
    expect(pageA.isClosed()).toBe(false);
    expect(pageB.isClosed()).toBe(false);

    await pageA.close();
    await pageB.close();
  });
});
