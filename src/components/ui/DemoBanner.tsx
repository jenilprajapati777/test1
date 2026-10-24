import React from "react";
import { Link } from "react-router-dom";
import { APP_CONFIG } from "../../lib/config";

export const DemoBanner: React.FC = () => {
  if (!APP_CONFIG.isDemoMode) return null;

  return (
    <aside
      aria-label="Demo mode announcement"
      className="w-full bg-[#121528] border-b border-[#252A48] text-xs py-1.5 px-4 text-center text-cream-dim flex items-center justify-center gap-2 z-50 relative"
    >
      <span className="w-2 h-2 rounded-full bg-presence animate-pulse" />
      <span>Demo mode — data stays in this browser.</span>
      <Link
        to="/setup"
        className="text-gold underline hover:text-cream ml-1 transition-colors"
      >
        See /setup to go live
      </Link>
    </aside>
  );
};
