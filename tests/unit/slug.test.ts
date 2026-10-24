import { describe, it, expect } from "vitest";
import { generateSlug, isValidSlug } from "../../src/lib/slug";

describe("Test 3: Slug Generation and Validation", () => {
  it("generates 10-char slug matching ^[a-z0-9]{10}$", () => {
    const slug = generateSlug();
    expect(slug).toHaveLength(10);
    expect(isValidSlug(slug)).toBe(true);
    expect(/^[a-z0-9]{10}$/.test(slug)).toBe(true);
  });

  it("generates 10,000 slugs with 0 collisions", () => {
    const count = 10000;
    const seen = new Set<string>();

    for (let i = 0; i < count; i++) {
      const slug = generateSlug();
      expect(isValidSlug(slug)).toBe(true);
      seen.add(slug);
    }

    expect(seen.size).toBe(count);
  });

  it("rejects invalid slugs", () => {
    expect(isValidSlug("abc")).toBe(false); // too short
    expect(isValidSlug("abcdefghijk")).toBe(false); // too long
    expect(isValidSlug("ABCDEFGHIJ")).toBe(false); // uppercase
    expect(isValidSlug("abcdefgh-j")).toBe(false); // special char
    expect(isValidSlug("")).toBe(false);
  });
});
