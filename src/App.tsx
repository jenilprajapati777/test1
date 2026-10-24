import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { DemoBanner } from "./components/ui/DemoBanner";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PrivacyPage, TermsPage, ReportPage } from "./pages/LegalPages";
import { SetupPage } from "./pages/SetupPage";

// Lazy-load the heavy or specialized pages
const MuseumPage = lazy(() =>
  import("./pages/MuseumPage").then((m) => ({ default: m.MuseumPage })),
);
const CreatePage = lazy(() =>
  import("./pages/CreatePage").then((m) => ({ default: m.CreatePage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const SharePage = lazy(() =>
  import("./pages/SharePage").then((m) => ({ default: m.SharePage })),
);

const PageFallback = () => (
  <div className="min-h-screen bg-bg0 flex items-center justify-center text-cream">
    <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg0">
      <DemoBanner />
      <div className="flex-1 flex flex-col">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/share/:id" element={<SharePage />} />
            <Route path="/m/:slug" element={<MuseumPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};
