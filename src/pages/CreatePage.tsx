import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Heart,
  Image as ImageIcon,
  Upload,
  Trash2,
  Star,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { getClient } from "../client";
import { Museum, Artwork } from "../types/museum";
import { AvatarConfig, DEFAULT_HOST_AVATAR } from "../types/avatar";
import { processImageFile } from "../lib/imagePipeline";
import { generateSlug } from "../lib/slug";
import { sanitizeText } from "../lib/sanitize";

const DRAFT_KEY = "mou:draft";

interface DraftData {
  from_name: string;
  to_name: string;
  title: string;
  plaque_eyebrow: string;
  plaque_title: string;
  plaque_text: string;
  plaque_signoff: string;
  host_name: string;
  host_lines: string[];
  host_avatar: AvatarConfig;
}

const DEFAULT_DRAFT: DraftData = {
  from_name: "",
  to_name: "",
  title: "Our Museum",
  plaque_eyebrow: "A PERMANENT COLLECTION",
  plaque_title: "",
  plaque_text: "Our whole winter, hung on the walls, just for you.",
  plaque_signoff: "",
  host_name: "",
  host_lines: [
    "our whole winter is on these walls",
    "take your time looking around",
    "this one was from that cold rainy Tuesday",
    "come sit with me in the cinema nook",
    "i love you maya ❤️",
    "dance with me",
  ],
  host_avatar: DEFAULT_HOST_AVATAR,
};

interface LocalArtwork {
  id: string;
  file?: Blob;
  previewUrl: string;
  title: string;
  isHero: boolean;
  aspect_ratio: number;
}

export const CreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [draft, setDraft] = useState<DraftData>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return { ...DEFAULT_DRAFT, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_DRAFT;
  });

  const [artworks, setArtworks] = useState<LocalArtwork[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Autosave draft
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [draft]);

  // Sync plaque defaults when names change
  const handleFromNameChange = (name: string) => {
    setDraft((prev) => ({
      ...prev,
      from_name: name,
      plaque_signoff: prev.plaque_signoff
        ? prev.plaque_signoff
        : name
          ? `Love, ${name}`
          : "",
      host_name: prev.host_name ? prev.host_name : name,
    }));
  };

  const handleToNameChange = (name: string) => {
    setDraft((prev) => ({
      ...prev,
      to_name: name,
      plaque_title: prev.plaque_title
        ? prev.plaque_title
        : name
          ? `For ${name}`
          : "",
    }));
  };

  // Upload handler for photos
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (artworks.length + files.length > 24) {
      setErrorMsg("You can upload up to 24 photos.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const newArtworks: LocalArtwork[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const processed = await processImageFile(file, 2048, 0.82);
        const previewUrl = URL.createObjectURL(processed.blob);

        newArtworks.push({
          id: crypto.randomUUID(),
          file: processed.blob,
          previewUrl,
          title: file.name.replace(/\.[^/.]+$/, "").slice(0, 80),
          isHero: artworks.length === 0 && i === 0, // First photo is hero by default
          aspect_ratio: processed.width / processed.height,
        });
      }

      setArtworks((prev) => [...prev, ...newArtworks]);
    } catch (err: unknown) {
      setErrorMsg(
        "Failed to process image: " +
          (err instanceof Error ? err.message : "unknown error"),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const setHeroArtwork = (id: string) => {
    setArtworks((prev) =>
      prev.map((art) => ({
        ...art,
        isHero: art.id === id,
      })),
    );
  };

  const removeArtwork = (id: string) => {
    setArtworks((prev) => {
      const filtered = prev.filter((art) => art.id !== id);
      if (filtered.length > 0 && !filtered.some((a) => a.isHero)) {
        filtered[0].isHero = true;
      }
      return filtered;
    });
  };

  // Publish Museum
  const handlePublish = async () => {
    if (!draft.from_name || !draft.to_name) {
      setErrorMsg("Please enter both your name and recipient name in Step 1.");
      setStep(1);
      return;
    }

    setIsPublishing(true);
    setErrorMsg(null);

    try {
      const client = getClient();
      const slug = generateSlug();
      const museumId = crypto.randomUUID();

      // Upload artworks
      const uploadedArtworks: Artwork[] = [];
      for (let idx = 0; idx < artworks.length; idx++) {
        const art = artworks[idx];
        let url = art.previewUrl;
        let storage_path = "";

        if (art.file) {
          const uploadRes = await client.uploadArtwork(
            museumId,
            art.file,
            `artwork-${idx}.webp`,
          );
          url = uploadRes.url;
          storage_path = uploadRes.storage_path;
        }

        uploadedArtworks.push({
          id: art.id,
          museum_id: museumId,
          kind: "photo",
          blob_url: url,
          storage_path: storage_path || `artworks/${art.id}.webp`,
          title: art.title,
          sort_order: idx,
        });
      }

      // If no artworks uploaded, create at least 1 procedural placeholder
      if (uploadedArtworks.length === 0) {
        uploadedArtworks.push({
          id: crypto.randomUUID(),
          museum_id: museumId,
          kind: "photo",
          blob_url: "",
          storage_path: "artworks/placeholder.webp",
          title: "Our First Memory",
          sort_order: 0,
        });
      }

      const museumPayload: Partial<Museum> = {
        id: museumId,
        slug,
        title: sanitizeText(draft.title || "Our Museum", 40),
        from_name: sanitizeText(draft.from_name, 30),
        to_name: sanitizeText(draft.to_name, 30),
        plaque_eyebrow: sanitizeText(
          draft.plaque_eyebrow || "A PERMANENT COLLECTION",
          40,
        ),
        plaque_title: sanitizeText(
          draft.plaque_title || `For ${draft.to_name}`,
          60,
        ),
        plaque_body: sanitizeText(draft.plaque_text, 280),
        plaque_signoff: sanitizeText(
          draft.plaque_signoff || `Love, ${draft.from_name}`,
          40,
        ),
        host_name: sanitizeText(draft.host_name || draft.from_name, 20),
        host_lines: draft.host_lines.map((l) => sanitizeText(l, 120)),
        host_avatar: draft.host_avatar,
        artworks: uploadedArtworks,
        status: "published",
      };

      const saved = await client.createMuseum(museumPayload);

      // Clear draft
      localStorage.removeItem(DRAFT_KEY);

      // Navigate to share screen
      navigate(`/share/${saved.id}`);
    } catch (err: unknown) {
      setErrorMsg(
        "Failed to publish museum: " +
          (err instanceof Error ? err.message : "unknown error"),
      );
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg0 text-cream flex flex-col font-sans selection:bg-gold/30">
      {/* Top Bar */}
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

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              onClick={() => setStep(num)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                step === num
                  ? "bg-gold text-ink font-bold shadow-glow"
                  : step > num
                    ? "bg-white/20 text-cream"
                    : "bg-white/5 text-cream-dim"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 flex flex-col">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-heart/10 border border-heart/20 text-heart text-sm">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: Names & Title */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full animate-fade-in">
            <span className="text-xs uppercase tracking-[0.28em] text-gold font-semibold mb-2">
              Step 1 of 6 · The Dedication
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-cream mb-2">
              Who is this for?
            </h2>
            <p className="text-sm text-cream-dim mb-8">
              Every museum needs an exhibition title and a personal dedication.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-dim mb-2 font-mono">
                  Your Name (The Creator)
                </label>
                <input
                  type="text"
                  value={draft.from_name}
                  onChange={(e) => handleFromNameChange(e.target.value)}
                  placeholder="e.g. Ethan"
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-dim mb-2 font-mono">
                  Recipient Name (Your Person)
                </label>
                <input
                  type="text"
                  value={draft.to_name}
                  onChange={(e) => handleToNameChange(e.target.value)}
                  placeholder="e.g. Maya"
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-dim mb-2 font-mono">
                  Museum Title
                </label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  placeholder="e.g. Our Museum"
                  maxLength={60}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Memories */}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs uppercase tracking-[0.28em] text-gold font-semibold mb-1 block">
                  Step 2 of 6 · The Gallery Walls
                </span>
                <h2 className="font-serif text-3xl text-cream">
                  Upload Your Memories
                </h2>
                <p className="text-sm text-cream-dim">
                  Upload up to 24 photos. Select one as the centerpiece hero
                  artwork.
                </p>
              </div>

              <label className="px-5 py-2.5 rounded-full bg-gold text-ink font-medium text-sm flex items-center gap-2 cursor-pointer hover:bg-gold/90 transition-all shadow-glow">
                <Upload className="w-4 h-4" />
                <span>Upload Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/heic,.heic"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {isProcessing && (
              <div className="p-4 mb-4 rounded-xl bg-white/5 border border-white/10 text-center text-sm text-gold animate-pulse">
                Optimizing & converting photos (stripping EXIF/GPS)...
              </div>
            )}

            {artworks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-12 text-center">
                <ImageIcon className="w-12 h-12 text-cream-dim/40 mb-3" />
                <p className="text-cream text-base font-medium mb-1">
                  No photos added yet
                </p>
                <p className="text-cream-dim text-xs max-w-sm mb-4">
                  Drag and drop photos here or click upload above. HEIC iPhone
                  photos are automatically converted.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto max-h-[500px] p-1">
                {artworks.map((art, idx) => (
                  <div
                    key={art.id}
                    className={`relative group rounded-xl overflow-hidden border bg-bg1 flex flex-col ${
                      art.isHero
                        ? "border-gold ring-1 ring-gold shadow-glow"
                        : "border-white/10"
                    }`}
                  >
                    <div className="aspect-square w-full overflow-hidden bg-black/40 relative">
                      <img
                        src={art.previewUrl}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {art.isHero && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gold text-ink text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                          <Star className="w-3 h-3 fill-ink" />
                          Hero Wall
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 flex items-center justify-between gap-1 text-xs">
                      <input
                        type="text"
                        value={art.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setArtworks((prev) =>
                            prev.map((a) =>
                              a.id === art.id ? { ...a, title: val } : a,
                            ),
                          );
                        }}
                        placeholder={`Memory #${idx + 1}`}
                        maxLength={80}
                        className="bg-transparent border-none text-cream text-[11px] focus:outline-none w-full"
                      />

                      <div className="flex items-center gap-1">
                        {!art.isHero && (
                          <button
                            type="button"
                            onClick={() => setHeroArtwork(art.id)}
                            title="Set as Hero"
                            className="p-1 text-cream-dim hover:text-gold transition-colors"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeArtwork(art.id)}
                          title="Remove"
                          className="p-1 text-cream-dim hover:text-heart transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Plaque */}
        {step === 3 && (
          <div className="flex-1 grid md:grid-cols-2 gap-8 items-center animate-fade-in">
            <div>
              <span className="text-xs uppercase tracking-[0.28em] text-gold font-semibold mb-2 block">
                Step 3 of 6 · The Centerpiece
              </span>
              <h2 className="font-serif text-3xl text-cream mb-2">
                The Dedication Plaque
              </h2>
              <p className="text-sm text-cream-dim mb-6">
                Positioned on the pedestal in front of the hero wall. Visitors
                press [E] to inspect it up close.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-cream-dim mb-1 font-mono">
                    Eyebrow Header
                  </label>
                  <input
                    type="text"
                    value={draft.plaque_eyebrow}
                    onChange={(e) =>
                      setDraft({ ...draft, plaque_eyebrow: e.target.value })
                    }
                    maxLength={40}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-cream text-sm focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-cream-dim mb-1 font-mono">
                    Plaque Title
                  </label>
                  <input
                    type="text"
                    value={draft.plaque_title}
                    onChange={(e) =>
                      setDraft({ ...draft, plaque_title: e.target.value })
                    }
                    placeholder={`For ${draft.to_name || "You"}`}
                    maxLength={60}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-cream text-sm focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs uppercase tracking-wider text-cream-dim font-mono">
                      Personal Message
                    </label>
                    <span className="text-[11px] font-mono text-cream-dim">
                      {draft.plaque_text.length}/280
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={draft.plaque_text}
                    onChange={(e) =>
                      setDraft({ ...draft, plaque_text: e.target.value })
                    }
                    maxLength={280}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-cream text-sm focus:outline-none focus:border-gold resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-cream-dim mb-1 font-mono">
                    Sign-off
                  </label>
                  <input
                    type="text"
                    value={draft.plaque_signoff}
                    onChange={(e) =>
                      setDraft({ ...draft, plaque_signoff: e.target.value })
                    }
                    placeholder={`Love, ${draft.from_name || "Me"}`}
                    maxLength={40}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-cream text-sm focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Plaque */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-2xl bg-bg1 border border-white/10 p-8 shadow-2xl relative">
                <span className="text-[10px] uppercase tracking-[0.3em] text-gold/80 block font-semibold mb-3">
                  {draft.plaque_eyebrow || "A PERMANENT COLLECTION"}
                </span>
                <h3 className="font-serif text-2xl text-cream tracking-tight mb-4">
                  {draft.plaque_title || `For ${draft.to_name || "You"}`}
                </h3>
                <div className="w-8 h-px bg-gold/40 mb-5" />
                <p className="text-cream text-sm leading-relaxed mb-6 font-serif italic whitespace-pre-wrap">
                  "
                  {draft.plaque_text ||
                    "Our whole winter, hung on the walls, just for you."}
                  "
                </p>
                <p className="text-cream-dim text-xs italic text-right font-serif">
                  {draft.plaque_signoff || `Love, ${draft.from_name || "Me"}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Host Companion */}
        {step === 4 && (
          <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full animate-fade-in">
            <span className="text-xs uppercase tracking-[0.28em] text-gold font-semibold mb-2">
              Step 4 of 6 · The Companion
            </span>
            <h2 className="font-serif text-3xl text-cream mb-2">
              Host Avatar & Dialogue
            </h2>
            <p className="text-sm text-cream-dim mb-6">
              When you're not online, your host avatar guides your recipient
              through the museum.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-dim mb-2 font-mono">
                  Host Companion Name
                </label>
                <input
                  type="text"
                  value={draft.host_name}
                  onChange={(e) =>
                    setDraft({ ...draft, host_name: e.target.value })
                  }
                  placeholder={draft.from_name || "Host"}
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-cream focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-cream-dim mb-2 font-mono">
                  Dialogue Lines (Spoken via speech bubbles)
                </label>
                <div className="space-y-2">
                  {draft.host_lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cream-dim w-4">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={line}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraft((prev) => {
                            const lines = [...prev.host_lines];
                            lines[idx] = val;
                            return { ...prev, host_lines: lines };
                          });
                        }}
                        maxLength={120}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-cream text-xs focus:outline-none focus:border-gold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Preview */}
        {step === 5 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in max-w-lg mx-auto">
            <span className="text-xs uppercase tracking-[0.28em] text-gold font-semibold mb-2">
              Step 5 of 6 · Preview
            </span>
            <h2 className="font-serif text-3xl text-cream mb-3">
              Ready to View
            </h2>
            <p className="text-sm text-cream-dim mb-8">
              Everything is set. You have {artworks.length} memories ready to
              hang on the walls for{" "}
              <span className="text-cream font-medium italic">
                {draft.to_name || "your recipient"}
              </span>
              .
            </p>

            <div className="w-full bg-bg1 border border-white/10 rounded-2xl p-6 text-left mb-8 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-heart fill-heart" />
                <div>
                  <h4 className="font-serif text-lg text-cream">
                    {draft.title || "Our Museum"}
                  </h4>
                  <p className="text-xs text-cream-dim">
                    From {draft.from_name || "You"} · To{" "}
                    {draft.to_name || "Recipient"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-cream-dim border-t border-white/5 pt-4">
                <div>
                  <span className="block font-mono text-[10px] uppercase text-gold">
                    Memories
                  </span>
                  <span className="text-cream text-sm font-medium">
                    {artworks.length} photos
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-[10px] uppercase text-gold">
                    Host Companion
                  </span>
                  <span className="text-cream text-sm font-medium">
                    {draft.host_name || "Ethan"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(6)}
              className="px-8 py-3.5 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-gold/90 transition-all shadow-glow flex items-center gap-2"
            >
              <span>Continue to Publish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 6: Publish */}
        {step === 6 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in max-w-md mx-auto">
            <span className="text-xs uppercase tracking-[0.28em] text-gold font-semibold mb-2">
              Step 6 of 6 · The Reveal
            </span>
            <h2 className="font-serif text-3xl text-cream mb-3">
              Publish Your Gift
            </h2>
            <p className="text-sm text-cream-dim mb-8">
              Publishing will generate your scannable heart-shaped QR code and
              shareable gift cards.
            </p>

            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full py-4 rounded-full bg-heart text-white font-medium text-base hover:bg-heart/90 transition-all shadow-glow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPublishing ? (
                <span>Generating Your Museum...</span>
              ) : (
                <>
                  <Heart className="w-5 h-5 fill-white" />
                  <span>Publish & Generate QR</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2.5 rounded-full border border-white/10 text-cream hover:bg-white/5 transition-all text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          {step < 6 && (
            <button
              onClick={() => {
                if (step === 1 && (!draft.from_name || !draft.to_name)) {
                  setErrorMsg(
                    "Please enter both your name and your recipient name.",
                  );
                  return;
                }
                setErrorMsg(null);
                setStep((s) => s + 1);
              }}
              className="px-6 py-2.5 rounded-full bg-gold text-ink font-medium text-sm hover:bg-gold/90 transition-all shadow-glow flex items-center gap-2"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
