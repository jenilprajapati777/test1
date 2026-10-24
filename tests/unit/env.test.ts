import { describe, it, expect, afterEach } from "vitest";
import { getAppConfig } from "../../src/lib/config";

describe("Test 11: Environment Configuration & Demo Mode Switch", () => {
  const originalEnv = { ...import.meta.env };

  afterEach(() => {
    // Restore original env
    Object.assign(import.meta.env, originalEnv);
  });

  it("enters Demo Mode when Supabase env vars are missing or empty", () => {
    delete (import.meta.env as any).VITE_SUPABASE_URL;
    delete (import.meta.env as any).VITE_SUPABASE_ANON_KEY;
    (import.meta.env as any).VITE_DEMO_MODE = "0";

    const config = getAppConfig();
    expect(config.isDemoMode).toBe(true);
    expect(config.supabaseUrl).toBeUndefined();
    expect(config.supabaseAnonKey).toBeUndefined();
  });

  it("enters Demo Mode when Supabase env vars contain placeholders", () => {
    (import.meta.env as any).VITE_SUPABASE_URL =
      "https://your-project.supabase.co";
    (import.meta.env as any).VITE_SUPABASE_ANON_KEY = "your-key";
    (import.meta.env as any).VITE_DEMO_MODE = "0";

    const config = getAppConfig();
    expect(config.isDemoMode).toBe(true);
  });

  it("enters Live Mode when valid Supabase URL and anon key are present", () => {
    (import.meta.env as any).VITE_SUPABASE_URL =
      "https://xyzabcdefg.supabase.co";
    (import.meta.env as any).VITE_SUPABASE_ANON_KEY = "eyJh...valid-anon-key";
    (import.meta.env as any).VITE_DEMO_MODE = "0";

    const config = getAppConfig();
    expect(config.isDemoMode).toBe(false);
    expect(config.supabaseUrl).toBe("https://xyzabcdefg.supabase.co");
    expect(config.supabaseAnonKey).toBe("eyJh...valid-anon-key");
  });

  it("forces Demo Mode when VITE_DEMO_MODE=1 even if Supabase keys exist", () => {
    (import.meta.env as any).VITE_SUPABASE_URL =
      "https://xyzabcdefg.supabase.co";
    (import.meta.env as any).VITE_SUPABASE_ANON_KEY = "eyJh...valid-anon-key";
    (import.meta.env as any).VITE_DEMO_MODE = "1";

    const config = getAppConfig();
    expect(config.isDemoMode).toBe(true);
  });

  it("resolves site URL correctly with fallback", () => {
    (import.meta.env as any).VITE_PUBLIC_SITE_URL =
      "https://custom.museumofus.love";
    const config = getAppConfig();
    expect(config.siteUrl).toBe("https://custom.museumofus.love");
  });
});
