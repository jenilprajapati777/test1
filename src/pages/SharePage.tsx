import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Heart,
  Copy,
  Check,
  Share2,
  Download,
  MessageCircle,
  Send,
  Eye,
  UserCheck,
} from "lucide-react";
import { getClient } from "../client";
import { Museum } from "../types/museum";
import { renderHeartQrSvg, renderClassicQrSvg } from "../lib/heartQr";
import { renderCardPng, renderStoryPng } from "../lib/shareCard";
import { PNG } from "pngjs";

export const SharePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [museum, setMuseum] = useState<Museum | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClassic, setIsClassic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    async function load() {
      if (!id) return;
      const client = getClient();
      const list = await client.listMyMuseums();
      const found = list.find((m) => m.id === id || m.slug === id);
      if (found) {
        setMuseum(found);
      } else {
        // Fallback: in demo mode or direct link
        const pub = await client.getMuseum(id);
        if (pub) {
          setMuseum(pub as Museum);
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const siteOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://museumofus.love";
  const museumSlug = museum?.slug || id || "demo";
  const museumUrl = `${siteOrigin}/m/${museumSlug}`;

  // Generate SVG QR preview
  useEffect(() => {
    if (!museumUrl) return;
    if (isClassic) {
      setQrSvg(renderClassicQrSvg(museumUrl, 260));
    } else {
      setQrSvg(renderHeartQrSvg(museumUrl, 260));
    }
  }, [museumUrl, isClassic]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(museumUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: museum?.title || "Our Museum",
          text: `I made a 3D museum for you 🥺 scan this ❤️`,
          url: museumUrl,
        });
      } catch {
        // ignore share cancellation
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadCardPng = () => {
    const png = renderCardPng({
      url: museumUrl,
      isClassic,
      fromName: museum?.from_name,
      toName: museum?.to_name,
    });
    const buffer = PNG.sync.write(png);
    const blob = new Blob([new Uint8Array(buffer)], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `museum-card-${museumSlug}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadStoryPng = () => {
    const png = renderStoryPng({
      url: museumUrl,
      isClassic,
      fromName: museum?.from_name,
      toName: museum?.to_name,
    });
    const buffer = PNG.sync.write(png);
    const blob = new Blob([new Uint8Array(buffer)], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `museum-story-${museumSlug}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSvg = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `museum-qr-${museumSlug}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg0 text-cream flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Heart className="w-8 h-8 text-heart fill-heart animate-pulse" />
          <p className="text-sm font-mono text-cream-dim">
            Generating Share Card...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg0 text-cream flex flex-col font-sans selection:bg-gold/30">
      {/* Top Header */}
      <header className="border-b border-white/5 bg-bg1/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-cream hover:text-gold transition-colors"
        >
          <Heart className="w-5 h-5 text-heart fill-heart" />
          <span className="font-serif italic text-lg tracking-tight">
            Museum of Us
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono">
          <Link
            to="/dashboard"
            className="text-cream-dim hover:text-cream transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to={`/m/${museumSlug}`}
            className="px-3.5 py-1.5 rounded-full bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 transition-all flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visit Museum</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 flex flex-col items-center justify-center">
        <span className="text-xs uppercase tracking-[0.28em] text-gold font-semibold mb-2">
          Your Gift is Ready
        </span>
        <h1 className="font-serif text-3xl md:text-5xl text-cream text-center mb-2">
          Share Your Heart
        </h1>
        <p className="text-sm text-cream-dim text-center max-w-md mb-8">
          Send the scannable card directly in chat, post to stories, or print it
          out as a physical keepsake.
        </p>

        {/* Share Card & Actions Grid */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl items-center">
          {/* White Gift Card Preview */}
          <div className="flex flex-col items-center">
            <div
              id="share-card-preview"
              className="w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] bg-card rounded-[28px] p-6 flex flex-col items-center justify-between shadow-2xl text-ink relative select-none border border-black/5"
            >
              {/* Card Header */}
              <div className="w-full text-center">
                <span className="text-[10px] uppercase tracking-[0.28em] text-ink/60 font-mono block">
                  A PERMANENT EXHIBITION
                </span>
                <h3 className="font-serif text-xl text-ink font-semibold tracking-tight">
                  {museum?.title || "Our Museum"}
                </h3>
              </div>

              {/* QR Container */}
              <div
                className="w-48 h-48 flex items-center justify-center cursor-pointer"
                onClick={() => setIsClassic((v) => !v)}
                title="Click to toggle Heart / Classic QR"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />

              {/* Card Footer: Hand Pointer & Dedication */}
              <div className="w-full text-center">
                <div className="flex items-center justify-center gap-1.5 text-heart font-semibold text-xs mb-1">
                  <span>☝</span>
                  <span>Scan this</span>
                </div>
                <div className="text-[11px] text-ink/70 font-serif italic">
                  From {museum?.from_name || "Ethan"} │ To{" "}
                  {museum?.to_name || "Maya"}
                </div>
              </div>
            </div>

            {/* Toggle QR Style */}
            <div className="mt-4 flex items-center gap-3 text-xs text-cream-dim">
              <span>QR Style:</span>
              <button
                onClick={() => setIsClassic(false)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  !isClassic
                    ? "bg-heart text-white font-medium shadow"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                Heart QR
              </button>
              <button
                onClick={() => setIsClassic(true)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  isClassic
                    ? "bg-gold text-ink font-medium shadow"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                Classic QR
              </button>
            </div>
          </div>

          {/* Action Buttons Panel */}
          <div className="space-y-4">
            {/* Direct Copy Link */}
            <div className="p-4 rounded-2xl bg-bg1 border border-white/10 flex items-center justify-between gap-3 shadow-lg">
              <input
                type="text"
                readOnly
                value={museumUrl}
                className="bg-transparent border-none text-xs text-cream font-mono flex-1 focus:outline-none select-all truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-gold text-ink font-medium text-xs flex items-center gap-1.5 hover:bg-gold/90 transition-all flex-shrink-0 shadow-glow"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>

            {/* Quick Share Targets */}
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `i made this museum for you 🥺 ${museumUrl}`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1 text-cream text-xs transition-all"
              >
                <MessageCircle className="w-4 h-4 text-presence" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(museumUrl)}&text=${encodeURIComponent(
                  "i made this museum for you 🥺",
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1 text-cream text-xs transition-all"
              >
                <Send className="w-4 h-4 text-sky-400" />
                <span>Telegram</span>
              </a>

              <button
                onClick={handleWebShare}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1 text-cream text-xs transition-all"
              >
                <Share2 className="w-4 h-4 text-gold" />
                <span>Share...</span>
              </button>
            </div>

            {/* Downloads */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownloadCardPng}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-cream flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-gold" />
                  <span>Download Square Card (1080×1080 PNG)</span>
                </div>
                <span className="text-[10px] font-mono text-cream-dim">
                  Print / DM
                </span>
              </button>

              <button
                onClick={handleDownloadStoryPng}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-cream flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-heart" />
                  <span>Download Story Card (1080×1920 PNG)</span>
                </div>
                <span className="text-[10px] font-mono text-cream-dim">
                  Instagram / Snap
                </span>
              </button>

              <button
                onClick={handleDownloadSvg}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-cream flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-sage" />
                  <span>Download Vector QR (SVG)</span>
                </div>
                <span className="text-[10px] font-mono text-cream-dim">
                  Vector / Cut
                </span>
              </button>
            </div>

            {/* Host Takeover Link */}
            <div className="pt-2">
              <Link
                to={`/m/${museumSlug}?as=host`}
                className="w-full py-3 px-4 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/30 text-xs text-gold flex items-center justify-center gap-2 transition-all font-medium"
              >
                <UserCheck className="w-4 h-4" />
                <span>Enter as Host (Live Presence Mode)</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
