import { describe, it, expect, beforeEach } from "vitest";
import { DemoClient } from "../../src/client/demoClient";

describe("Test 12: In-Browser Demo Client Data Layer", () => {
  let client: DemoClient;

  beforeEach(() => {
    localStorage.clear();
    client = new DemoClient();
  });

  it("provides a pre-seeded published demo museum at /m/demo out of the box", async () => {
    const demo = await client.getMuseum("demo");
    expect(demo).not.toBeNull();
    if (demo) {
      expect(demo.slug).toBe("demo");
      expect(demo.title).toBe("Our Museum");
      expect(demo.from_name).toBe("Ethan");
      expect(demo.to_name).toBe("Maya");
      expect(demo.status).toBe("published");
      expect(demo.artworks).toBeDefined();
      expect(demo.artworks.length).toBeGreaterThanOrEqual(1);
      // Strips owner_id from public response
      expect((demo as any).owner_id).toBeUndefined();
    }
  });

  it("performs CRUD operations for creator museums in local storage", async () => {
    // 1. Create
    const created = await client.createMuseum({
      title: "Our Anniversary",
      from_name: "Alex",
      to_name: "Taylor",
      plaque_title: "For Taylor",
      plaque_body: "Happy anniversary!",
      status: "draft",
    });
    expect(created.id).toBeDefined();
    expect(created.slug).toBeDefined();

    // 2. Draft is not visible publicly via getMuseum
    const pubDraft = await client.getMuseum(created.slug);
    expect(pubDraft).toBeNull();

    // 3. Update status to published
    await client.setStatus(created.id!, "published");
    const pubPublished = await client.getMuseum(created.slug!);
    expect(pubPublished).not.toBeNull();
    expect(pubPublished?.title).toBe("Our Anniversary");

    // 4. List my museums
    const myMuseums = await client.listMyMuseums();
    expect(myMuseums.some((m) => m.id === created.id)).toBe(true);

    // 5. Delete museum
    await client.deleteMuseum(created.id!);
    const afterDelete = await client.getMuseum(created.slug);
    expect(afterDelete).toBeNull();
  });

  it("enforces <= 3/min/museum rate limit on postReply", async () => {
    const slug = "demo";

    // 1st reply succeeds
    const res1 = await client.postReply(slug, "Guest", "Note 1");
    expect(res1.success).toBe(true);

    // 2nd reply succeeds
    const res2 = await client.postReply(slug, "Guest", "Note 2");
    expect(res2.success).toBe(true);

    // 3rd reply succeeds
    const res3 = await client.postReply(slug, "Guest", "Note 3");
    expect(res3.success).toBe(true);

    // 4th reply within 1 minute is rate limited
    const res4 = await client.postReply(slug, "Guest", "Note 4");
    expect(res4.success).toBe(false);
    expect(res4.error).toMatch(/wait a moment/i);
  });

  it("tracks visits and increments view_count", async () => {
    const before = await client.getMuseum("demo");
    const beforeCount = before?.view_count || 0;

    await client.trackVisit("demo");

    const after = await client.getMuseum("demo");
    expect(after?.view_count).toBe(beforeCount + 1);
  });
});
