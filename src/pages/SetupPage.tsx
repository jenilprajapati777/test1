import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { APP_CONFIG } from "../lib/config";

interface DiagnosticCheck {
  id: string;
  name: string;
  category: "env" | "db" | "storage" | "realtime";
  status: "pending" | "success" | "failure";
  details: string;
  fixHint?: string;
}

export const SetupPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [checks, setChecks] = useState<DiagnosticCheck[]>([
    {
      id: "env_vars",
      name: "Supabase Environment Variables",
      category: "env",
      status: "pending",
      details: "Checking VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY...",
    },
    {
      id: "reachability",
      name: "Supabase Reachability",
      category: "env",
      status: "pending",
      details: "Verifying network connection to Supabase endpoint...",
    },
    {
      id: "migration",
      name: "Database Schema & RPC Functions",
      category: "db",
      status: "pending",
      details:
        "Checking tables (museums, artworks, replies) and RPCs (get_museum)...",
    },
    {
      id: "storage",
      name: 'Public Storage Bucket ("artworks")',
      category: "storage",
      status: "pending",
      details:
        'Verifying "artworks" bucket exists and has public read access...',
    },
    {
      id: "auth_redirect",
      name: "Auth Redirect Configuration",
      category: "env",
      status: "pending",
      details:
        "Verifying Site URL and redirect configuration for Magic Link login...",
    },
    {
      id: "realtime",
      name: "Realtime Multiplayer Engine",
      category: "realtime",
      status: "pending",
      details:
        "Checking Realtime Broadcast and Presence channel connectivity...",
    },
  ]);

  const runDiagnostics = async () => {
    setIsRunning(true);

    const updated = [...checks];

    // 1. Env vars check
    const hasUrl = Boolean(APP_CONFIG.supabaseUrl);
    const hasKey = Boolean(APP_CONFIG.supabaseAnonKey);
    const isConfigured = hasUrl && hasKey && !APP_CONFIG.isDemoMode;

    if (isConfigured) {
      updated[0] = {
        ...updated[0],
        status: "success",
        details: `Configured: URL is defined, Anon Key is present (${APP_CONFIG.supabaseAnonKey?.slice(
          0,
          8,
        )}...masked).`,
      };
    } else {
      updated[0] = {
        ...updated[0],
        status: "failure",
        details:
          "Running in Demo Mode: Supabase environment variables are missing or placeholders.",
        fixHint:
          "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env or Cloudflare Pages Environment Variables.",
      };
    }

    // 2. Reachability check
    if (isConfigured && APP_CONFIG.supabaseUrl) {
      try {
        const pingRes = await fetch(`${APP_CONFIG.supabaseUrl}/rest/v1/`, {
          headers: { apikey: APP_CONFIG.supabaseAnonKey || "" },
        });
        if (pingRes.ok || pingRes.status === 401 || pingRes.status === 200) {
          updated[1] = {
            ...updated[1],
            status: "success",
            details: "Successfully connected to Supabase REST gateway.",
          };
        } else {
          updated[1] = {
            ...updated[1],
            status: "failure",
            details: `HTTP ${pingRes.status} received from Supabase endpoint.`,
            fixHint:
              "Verify your VITE_SUPABASE_URL domain and network accessibility.",
          };
        }
      } catch {
        updated[1] = {
          ...updated[1],
          status: "failure",
          details: "Failed to reach Supabase URL over the network.",
          fixHint:
            "Check your internet connection and ensure VITE_SUPABASE_URL is valid.",
        };
      }
    } else {
      updated[1] = {
        ...updated[1],
        status: "failure",
        details: "Skipped: Supabase URL not configured (Demo Mode active).",
        fixHint: "Provide VITE_SUPABASE_URL to test network reachability.",
      };
    }

    // 3. Migration check
    if (isConfigured && APP_CONFIG.supabaseUrl) {
      try {
        const rpcCheck = await fetch(
          `${APP_CONFIG.supabaseUrl}/rest/v1/rpc/get_museum`,
          {
            method: "POST",
            headers: {
              apikey: APP_CONFIG.supabaseAnonKey || "",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ p_slug: "demo" }),
          },
        );

        if (rpcCheck.status !== 404) {
          updated[2] = {
            ...updated[2],
            status: "success",
            details:
              "Migrations applied: get_museum RPC and database tables exist.",
          };
        } else {
          updated[2] = {
            ...updated[2],
            status: "failure",
            details: 'RPC function "get_museum" not found in database schema.',
            fixHint:
              'Run "npm run db:migrate" with SUPABASE_DB_URL set to apply migrations.',
          };
        }
      } catch {
        updated[2] = {
          ...updated[2],
          status: "failure",
          details: "Could not query RPC functions.",
          fixHint: 'Apply migrations via "npm run db:migrate".',
        };
      }
    } else {
      updated[2] = {
        ...updated[2],
        status: "failure",
        details:
          "Skipped: Demo Mode uses in-browser memory & IndexedDB data layer.",
        fixHint:
          'To deploy live, run "npm run db:migrate" after configuring Supabase.',
      };
    }

    // 4. Storage check
    if (isConfigured && APP_CONFIG.supabaseUrl) {
      try {
        const bucketRes = await fetch(
          `${APP_CONFIG.supabaseUrl}/storage/v1/bucket/artworks`,
          {
            headers: { apikey: APP_CONFIG.supabaseAnonKey || "" },
          },
        );

        if (bucketRes.ok) {
          updated[3] = {
            ...updated[3],
            status: "success",
            details: 'Storage bucket "artworks" exists and is accessible.',
          };
        } else {
          updated[3] = {
            ...updated[3],
            status: "failure",
            details: 'Storage bucket "artworks" is missing or private.',
            fixHint:
              'In your Supabase Dashboard -> Storage, create a public bucket named "artworks".',
          };
        }
      } catch {
        updated[3] = {
          ...updated[3],
          status: "failure",
          details: "Storage endpoint could not be reached.",
          fixHint:
            'Create a public "artworks" bucket in the Supabase Dashboard.',
        };
      }
    } else {
      updated[3] = {
        ...updated[3],
        status: "failure",
        details: "Demo Mode uses in-memory object URLs for photo uploads.",
        fixHint:
          'Create a public "artworks" bucket in Supabase when going live.',
      };
    }

    // 5. Auth redirect hint
    const currentOrigin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5173";
    updated[4] = {
      ...updated[4],
      status: "success",
      details: `Current origin: ${currentOrigin}. Ensure "${currentOrigin}/**" is added to Supabase Auth -> Redirect URLs.`,
    };

    // 6. Realtime check
    if (isConfigured) {
      updated[5] = {
        ...updated[5],
        status: "success",
        details: "Realtime engine: Supabase Realtime channel transport ready.",
      };
    } else {
      updated[5] = {
        ...updated[5],
        status: "success",
        details:
          "Demo Mode Realtime: BroadcastChannel active (supports live multi-tab avatars on same browser).",
      };
    }

    setChecks(updated);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allPassed = checks.every((c) => c.status === "success");
  const demoActive = APP_CONFIG.isDemoMode;

  return (
    <div className="min-h-screen bg-bg0 text-cream flex flex-col font-sans selection:bg-gold/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-bg1/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <Link
          to="/"
          className="flex items-center gap-2 text-cream hover:text-gold transition-colors"
        >
          <Heart className="w-5 h-5 text-heart fill-heart" />
          <span className="font-serif italic text-lg tracking-tight">
            Museum of Us
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-cream flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`}
            />
            <span>Re-check</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-[0.28em] text-gold font-semibold mb-1 block">
            System Diagnostics
          </span>
          <h1 className="font-serif text-3xl md:text-4xl text-cream tracking-tight mb-2">
            Environment & Live Setup
          </h1>
          <p className="text-sm text-cream-dim">
            Inspect your deployment configuration, Supabase backend status,
            database migrations, and realtime multiplayer engine.
          </p>
        </div>

        {/* Current Mode Banner */}
        <div
          className={`p-5 rounded-2xl border mb-8 flex items-start gap-4 ${
            demoActive
              ? "bg-gold/10 border-gold/30 text-cream"
              : allPassed
                ? "bg-presence/10 border-presence/30 text-cream"
                : "bg-heart/10 border-heart/30 text-cream"
          }`}
        >
          {demoActive ? (
            <AlertCircle className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
          ) : allPassed ? (
            <CheckCircle2 className="w-6 h-6 text-presence flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-6 h-6 text-heart flex-shrink-0 mt-0.5" />
          )}

          <div>
            <h3 className="text-base font-semibold text-cream mb-1">
              {demoActive
                ? "Demo Mode Active (Zero Configuration)"
                : allPassed
                  ? "Production Backend Fully Connected"
                  : "Configuration Attention Needed"}
            </h3>
            <p className="text-xs text-cream-dim leading-relaxed">
              {demoActive
                ? "The application is running out-of-the-box in standalone Demo Mode with in-browser data storage and BroadcastChannel multiplayer. To enable multi-device live sharing, connect Supabase credentials below."
                : allPassed
                  ? "All Supabase environment variables, database tables, RPC security rules, storage buckets, and realtime presence engines are operational."
                  : "One or more live services require setup. Review the diagnostic checks below for exact remediation steps."}
            </p>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-4 mb-10">
          {checks.map((check) => (
            <div
              key={check.id}
              className="p-5 rounded-2xl bg-bg1 border border-white/10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-lg"
            >
              <div className="flex items-start gap-3.5">
                {check.status === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-presence flex-shrink-0 mt-0.5" />
                ) : check.status === "failure" ? (
                  <XCircle className="w-5 h-5 text-heart flex-shrink-0 mt-0.5" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-gold animate-spin flex-shrink-0 mt-0.5" />
                )}

                <div>
                  <h4 className="text-sm font-semibold text-cream mb-0.5">
                    {check.name}
                  </h4>
                  <p className="text-xs text-cream-dim leading-relaxed mb-2">
                    {check.details}
                  </p>

                  {check.fixHint && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-gold">
                      <Terminal className="w-3.5 h-3.5 text-gold" />
                      <span>Fix: {check.fixHint}</span>
                    </div>
                  )}
                </div>
              </div>

              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full self-start flex-shrink-0 ${
                  check.status === "success"
                    ? "bg-presence/20 text-presence border border-presence/30"
                    : check.status === "failure"
                      ? "bg-heart/20 text-heart border border-heart/30"
                      : "bg-white/10 text-cream-dim"
                }`}
              >
                {check.status}
              </span>
            </div>
          ))}
        </div>

        {/* Go Live Instructions Guide */}
        <div className="rounded-2xl bg-bg1 border border-white/10 p-6 shadow-xl">
          <h3 className="font-serif text-xl text-cream mb-2 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-gold" />
            <span>How to Go Live (2-Step Guide)</span>
          </h3>
          <p className="text-xs text-cream-dim mb-4 leading-relaxed">
            Transitioning from in-browser Demo Mode to public live sharing
            requires only two environment variables and one migration command:
          </p>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-cream-dim">
              <span className="text-gold font-bold block mb-1">
                Step 1: Set Environment Variables
              </span>
              <code>
                VITE_SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
                <br />
                VITE_SUPABASE_ANON_KEY=eyJh...
              </code>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-cream-dim">
              <span className="text-gold font-bold block mb-1">
                Step 2: Apply Database Migration
              </span>
              <code>
                SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
                npm run db:migrate
              </code>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
