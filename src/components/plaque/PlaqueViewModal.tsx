import React, { useEffect } from "react";
import { PlacedArtwork } from "../../lib/layout";
import { PublicMuseum } from "../../types/museum";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface PlaqueViewModalProps {
  museum: PublicMuseum;
  activeArtwork: PlacedArtwork | null;
  isPlaqueOpen: boolean;
  onClose: () => void;
  onNavigateArtwork?: (direction: 1 | -1) => void;
}

export const PlaqueViewModal: React.FC<PlaqueViewModalProps> = ({
  museum,
  activeArtwork,
  isPlaqueOpen,
  onClose,
  onNavigateArtwork,
}) => {
  // Handle keyboard Esc and Arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (activeArtwork && onNavigateArtwork) {
        if (e.key === "ArrowLeft") onNavigateArtwork(-1);
        if (e.key === "ArrowRight") onNavigateArtwork(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeArtwork, onClose, onNavigateArtwork]);

  if (!isPlaqueOpen && !activeArtwork) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-black/70 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      {/* Top Center "Viewing" pill */}
      <div className="w-full flex items-center justify-between max-w-4xl pt-2">
        <div className="w-10" />
        <div className="px-5 py-2 rounded-pill glass-dark border border-gold/30 text-xs font-serif italic text-gold tracking-wider shadow-xl">
          Viewing
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close viewing mode"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-cream flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div
        className="w-full max-w-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isPlaqueOpen ? (
          /* Plaque Card */
          <div className="bg-[#0B0D1F] border border-gold/40 rounded-card p-8 md:p-12 shadow-2xl relative text-center">
            {/* Letter-spaced gold eyebrow */}
            <span className="eyebrow block mb-3">
              {museum.plaque_eyebrow || "A PERMANENT COLLECTION"}
            </span>

            {/* Big Serif Heading */}
            <h2 className="font-serif text-3xl md:text-5xl text-cream tracking-tight mb-6">
              {museum.plaque_title || `For ${museum.to_name}`}
            </h2>

            {/* Hairline Divider */}
            <div className="w-16 h-[1px] bg-gold/40 mx-auto mb-8" />

            {/* Plaque Body */}
            <p className="text-base md:text-xl text-cream-dim font-light leading-relaxed mb-8 max-w-lg mx-auto">
              "{museum.plaque_body}"
            </p>

            {/* Italic Sign-off */}
            {museum.plaque_signoff && (
              <div className="font-serif italic text-gold text-lg md:text-xl">
                {museum.plaque_signoff}
              </div>
            )}
          </div>
        ) : activeArtwork ? (
          /* Artwork Frame & Details */
          <div className="flex flex-col items-center">
            {/* Framed Image */}
            <div className="relative p-3 md:p-4 bg-ink border-4 border-black rounded shadow-2xl max-h-[60vh] flex flex-col items-center">
              <div className="p-3 bg-[#F7F5F0]">
                {activeArtwork.artwork.blob_url ? (
                  <img
                    src={activeArtwork.artwork.blob_url}
                    alt={
                      activeArtwork.artwork.caption ||
                      activeArtwork.artwork.title ||
                      "Memory"
                    }
                    className="max-h-[50vh] object-contain rounded-sm"
                  />
                ) : (
                  <div className="w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-br from-[#3A3320] to-black flex items-center justify-center text-center p-4">
                    <span className="font-serif italic text-gold text-4xl">
                      {activeArtwork.isHero
                        ? "I"
                        : `${activeArtwork.index + 1}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Caption Card below */}
            <div className="mt-6 text-center max-w-md">
              <h3 className="font-serif text-2xl text-cream">
                {activeArtwork.artwork.title ||
                  `Memory #${activeArtwork.index + 1}`}
              </h3>
              {activeArtwork.artwork.taken_on && (
                <span className="text-xs text-gold uppercase tracking-widest font-mono block mt-1">
                  {activeArtwork.artwork.taken_on}
                </span>
              )}
              {activeArtwork.artwork.caption && (
                <p className="text-sm text-cream-dim mt-2 font-light">
                  {activeArtwork.artwork.caption}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom Nav arrows for artworks */}
      <div className="w-full flex items-center justify-center gap-4 pb-4">
        {activeArtwork && onNavigateArtwork && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateArtwork(-1)}
              aria-label="Previous artwork"
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-cream transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs text-cream-dim font-mono">
              {activeArtwork.index + 1} / {museum.artworks.length}
            </span>
            <button
              type="button"
              onClick={() => onNavigateArtwork(1)}
              aria-label="Next artwork"
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-cream transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
