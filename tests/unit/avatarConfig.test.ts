import { describe, it, expect } from "vitest";
import {
  validateAvatarConfig,
  DEFAULT_VISITOR_AVATAR,
  DEFAULT_HOST_AVATAR,
  AvatarConfigSchema,
} from "../../src/types/avatar";

describe("Test 4: Avatar Config Validation, Defaults, and Clamping", () => {
  it("validates and accepts DEFAULT_VISITOR_AVATAR and DEFAULT_HOST_AVATAR", () => {
    expect(AvatarConfigSchema.safeParse(DEFAULT_VISITOR_AVATAR).success).toBe(
      true,
    );
    expect(AvatarConfigSchema.safeParse(DEFAULT_HOST_AVATAR).success).toBe(
      true,
    );
  });

  it("clamps invalid enums or returns default safely", () => {
    const invalidConfig = {
      preset: "unknown_preset",
      hairStyle: "afro_super_long",
      skin: 12345,
      top: "armor",
      bottom: "chainmail",
      shoes: "heels",
      extras: ["sword", "shield", "helmet"],
    };

    const sanitized = validateAvatarConfig(invalidConfig);
    expect(sanitized.preset).toBe("a");
    expect(sanitized.hairStyle).toBe("long");
    expect(sanitized.skin).toBe("original");
    expect(sanitized.top).toBe("sweater");
    expect(sanitized.bottom).toBe("trousers");
    expect(sanitized.shoes).toBe("boots");
  });

  it("rejects oversized extras (> 5 extras) or invalid items", () => {
    const oversizedExtras = {
      ...DEFAULT_VISITOR_AVATAR,
      extras: ["glasses", "beanie", "earrings", "scarf", "belt", "glasses"],
    };
    const res = validateAvatarConfig(oversizedExtras);
    expect(res.extras.length).toBeLessThanOrEqual(5);
  });

  it("round-trips through JSON serialization without data loss", () => {
    const original = {
      preset: "b" as const,
      skin: "#BA7A50",
      hairStyle: "curly" as const,
      hairColor: "#4A3525",
      top: "vest-shirt" as const,
      topColor: "#1F2026",
      bottom: "jeans" as const,
      bottomColor: "#1A2238",
      shoes: "loafers" as const,
      shoesColor: "#5C3E26",
      extras: ["glasses" as const, "belt" as const],
    };

    const jsonStr = JSON.stringify(original);
    const parsed = JSON.parse(jsonStr);
    const validated = validateAvatarConfig(parsed);

    expect(validated).toEqual(original);
  });
});
