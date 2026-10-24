import { describe, it, expect } from "vitest";
import { sanitizeText, validateNonEmptyText } from "../../src/lib/sanitize";

describe("Test 5: Sanitization and Length Capping", () => {
  it("strips HTML tags and script elements", () => {
    const malicious =
      '<script>alert("hacked")</script>Hello <b>World</b><img src=x onerror=alert(1)>';
    const cleaned = sanitizeText(malicious);
    expect(cleaned).toBe('alert("hacked")Hello World');
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("<b>");
    expect(cleaned).not.toContain("<img");
  });

  it("strips non-printable ASCII control characters", () => {
    const withControls = "Line1\x00\x07\x1F\x7FLine2";
    const cleaned = sanitizeText(withControls);
    expect(cleaned).toBe("Line1Line2");
  });

  it("caps string lengths strictly", () => {
    const longText = "a".repeat(500);
    expect(sanitizeText(longText, 20)).toHaveLength(20);
    expect(sanitizeText(longText, 280)).toHaveLength(280);
  });

  it("rejects empty input after whitespace trim", () => {
    expect(validateNonEmptyText("   \n\t  ").valid).toBe(false);
    expect(validateNonEmptyText("").valid).toBe(false);
    expect(validateNonEmptyText("<b>  </b>").valid).toBe(false);

    const validRes = validateNonEmptyText("  Valid Name  ", 20);
    expect(validRes.valid).toBe(true);
    expect(validRes.text).toBe("Valid Name");
  });
});
