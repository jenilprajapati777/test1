import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { getClient } from "../client";

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg0 text-cream py-16 px-6 max-w-3xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs text-cream-dim hover:text-cream mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to entrance</span>
      </Link>
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-6 h-6 text-gold" />
        <span className="eyebrow">Privacy Policy</span>
      </div>
      <h1 className="font-serif text-4xl text-cream mb-8">
        Your Memories Are Private
      </h1>
      <div className="space-y-6 text-sm text-cream-dim font-light leading-relaxed">
        <p>
          "Museum of Us" is designed for deeply personal gifts. We take strict
          measures to ensure that your memories belong only to you and your
          recipient.
        </p>
        <h2 className="font-serif text-2xl text-cream pt-4">
          EXIF & GPS Stripping
        </h2>
        <p>
          All uploaded photos are transcoded in your local browser before being
          saved. All EXIF metadata, camera serial numbers, and geographic GPS
          coordinates are automatically stripped from image binaries.
        </p>
        <h2 className="font-serif text-2xl text-cream pt-4">Unlisted Access</h2>
        <p>
          Museum links use cryptographically random 10-character slugs. They are
          unindexed and protected by robots noindex directives. Only people with
          your link or QR code can view your museum.
        </p>
        <h2 className="font-serif text-2xl text-cream pt-4">Deletion</h2>
        <p>
          Deleting a museum from your creator dashboard permanently deletes all
          associated database entries and storage image files immediately.
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg0 text-cream py-16 px-6 max-w-3xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs text-cream-dim hover:text-cream mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to entrance</span>
      </Link>
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-6 h-6 text-gold" />
        <span className="eyebrow">Terms of Service</span>
      </div>
      <h1 className="font-serif text-4xl text-cream mb-8">Terms of Service</h1>
      <div className="space-y-6 text-sm text-cream-dim font-light leading-relaxed">
        <p>
          By creating or visiting a museum on "Museum of Us", you agree to use
          the service respectfully and lawfully.
        </p>
        <h2 className="font-serif text-2xl text-cream pt-4">Acceptable Use</h2>
        <p>
          You may only upload photos and content that you own or have explicit
          permission to share. You agree not to upload abusive, non-consensual,
          illegal, or harassing material.
        </p>
        <h2 className="font-serif text-2xl text-cream pt-4">Availability</h2>
        <p>
          We strive for continuous availability, but provide this service on an
          "as-is" basis. In Demo Mode, your museum data resides exclusively in
          your browser.
        </p>
      </div>
    </div>
  );
};

export const ReportPage: React.FC = () => {
  const [slug, setSlug] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim() || !reason.trim()) return;

    setStatus("submitting");
    try {
      const client = getClient();
      const res = await client.postReport(slug.trim(), reason.trim());
      if (res.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(res.error || "Failed to submit report.");
      }
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "An error occurred.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-bg0 text-cream py-16 px-6 max-w-xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs text-cream-dim hover:text-cream mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to entrance</span>
      </Link>
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-heart" />
        <span className="eyebrow">Content Safety</span>
      </div>
      <h1 className="font-serif text-4xl text-cream mb-4">
        Report an Exhibition
      </h1>
      <p className="text-sm text-cream-dim font-light mb-8">
        If you find content that infringes your rights, contains harassment, or
        violates our terms, please report it immediately.
      </p>

      {status === "success" ? (
        <div className="p-6 rounded-card border border-presence/30 bg-bg1/80 text-center flex flex-col items-center">
          <CheckCircle2 className="w-10 h-10 text-presence mb-3" />
          <h2 className="font-serif text-2xl text-cream mb-2">
            Report Received
          </h2>
          <p className="text-xs text-cream-dim max-w-sm">
            Thank you for bringing this to our attention. Our safety team will
            review the museum and take swift action.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="report-slug"
              className="block text-xs text-cream-dim mb-1 uppercase tracking-wider font-mono"
            >
              Museum Slug or URL
            </label>
            <input
              id="report-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. abcdefghij or https://.../m/abcdefghij"
              className="w-full bg-bg1 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-cream focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label
              htmlFor="report-reason"
              className="block text-xs text-cream-dim mb-1 uppercase tracking-wider font-mono"
            >
              Reason for Report (max 500 characters)
            </label>
            <textarea
              id="report-reason"
              required
              maxLength={500}
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the violation or reason for reporting..."
              className="w-full bg-bg1 border border-white/10 rounded-lg p-4 text-sm text-cream focus:outline-none focus:border-gold resize-none"
            />
            <div className="text-right text-[11px] text-cream-dim/60 mt-1">
              {reason.length}/500
            </div>
          </div>

          {status === "error" && (
            <div className="text-xs text-heart bg-heart/10 p-3 rounded-lg border border-heart/20">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-3 rounded-pill bg-cream text-ink font-medium hover:bg-gold transition-colors text-sm disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      )}
    </div>
  );
};
