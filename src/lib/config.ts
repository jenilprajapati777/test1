export interface AppConfig {
  isDemoMode: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  siteUrl: string;
  showPricing: boolean;
}

export function getAppConfig(): AppConfig {
  const env = import.meta.env;

  const forcedDemo =
    env.VITE_DEMO_MODE === "1" || env.VITE_DEMO_MODE === "true";
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim();

  const isSupabaseConfigured =
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl?.includes("your-project") &&
    !supabaseAnonKey?.includes("your-key");

  const isDemoMode = forcedDemo || !isSupabaseConfigured;
  const siteUrl =
    env.VITE_PUBLIC_SITE_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:5173");
  const showPricing = env.VITE_PRICING === "on" || env.VITE_PRICING === "true";

  return {
    isDemoMode,
    supabaseUrl: isSupabaseConfigured ? supabaseUrl : undefined,
    supabaseAnonKey: isSupabaseConfigured ? supabaseAnonKey : undefined,
    siteUrl,
    showPricing,
  };
}

export const APP_CONFIG = getAppConfig();
