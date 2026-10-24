import React, { useState } from "react";
import { PublicMuseum } from "../../types/museum";
import { ChevronLeft, ChevronRight, Heart, Send } from "lucide-react";
import { getClient } from "../../client";
import { sanitizeText } from "../../lib/sanitize";

interface LiteGalleryProps {
  museum: PublicMuseum;
}

export const LiteGallery: React.FC<LiteGalleryProps> = ({ museum }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visitorName, setVisitorName] = useState(museum.to_name || "Visitor");
  const [replyMessage, setReplyMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const artworks = museum.artworks || [];
  const totalSlides = artworks.length + 1; // Slide 0 = Dedication Plaque, Slide 1..N = Artworks

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeText(replyMessage, 500);
    if (!clean) return;

    setStatus("sending");
    try {
      const client = getClient();
      const res = await client.postReply(museum.slug, visitorName, clean);
      if (res.success) {
        setStatus("sent");
        setReplyMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-bg0 text-cream flex flex-col justify-between p-6 max-w-4xl mx-auto selection:bg-gold selection:text-ink">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="font-serif text-3xl text-cream">
            {museum.title || "Our Museum"}
          </h1>
          <p className="text-xs text-cream-dim mt-0.5">
            From {museum.from_name} to {museum.to_name}
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-pill border border-gold/30 text-gold font-mono">
          2D Gallery
        </span>
      </header>

      {/* Main Slide Carousel */}
      <main className="my-auto py-8 flex flex-col items-center">
        {currentIndex === 0 ? (
          /* Slide 0: Dedication Plaque */
          <div className="bg-[#0B0D1F] border border-gold/40 rounded-card p-8 md:p-12 text-center max-w-xl w-full shadow-2xl">
            <span className="eyebrow block mb-3">
              {museum.plaque_eyebrow || "A PERMANENT COLLECTION"}
            </span>
            <h2 className="font-serif text-4xl text-cream mb-6">
              {museum.plaque_title || `For ${museum.to_name}`}
            </h2>
            <div className="w-16 h-[1px] bg-gold/40 mx-auto mb-8" />
            <p className="text-lg text-cream-dim font-light leading-relaxed mb-8">
              "{museum.plaque_body}"
            </p>
            {museum.plaque_signoff && (
              <div className="font-serif italic text-gold text-xl">
                {museum.plaque_signoff}
              </div>
            )}
          </div>
        ) : (
          /* Slide 1..N: Framed Artworks */
          (() => {
            const art = artworks[currentIndex - 1];
            return (
              <div className="flex flex-col items-center max-w-lg w-full">
                <div className="p-4 bg-ink border-4 border-black rounded shadow-2xl w-full flex items-center justify-center">
                  <div className="p-3 bg-[#F7F5F0] w-full flex items-center justify-center">
                    {art.blob_url ? (
                      <img
                        src={art.blob_url}
                        alt={art.caption || art.title || "Artwork"}
                        className="max-h-[50vh] object-contain rounded-sm"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#3A3320] to-black flex items-center justify-center">
                        <span className="font-serif italic text-gold text-4xl">
                          {currentIndex}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <h3 className="font-serif text-2xl text-cream">
                    {art.title || `Memory #${currentIndex}`}
                  </h3>
                  {art.taken_on && (
                    <span className="text-xs text-gold uppercase tracking-widest font-mono block mt-1">
                      {art.taken_on}
                    </span>
                  )}
                  {art.caption && (
                    <p className="text-sm text-cream-dim mt-2 font-light">
                      {art.caption}
                    </p>
                  )}
                </div>
              </div>
            );
          })()
        )}

        {/* Carousel Navigation Controls */}
        <div className="flex items-center gap-6 mt-8">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-cream transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono text-cream-dim">
            {currentIndex === 0
              ? "Dedication Plaque"
              : `${currentIndex} of ${artworks.length}`}
          </span>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-cream transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Reply Section */}
      <footer className="border-t border-white/10 pt-6 mt-6">
        <h3 className="font-serif text-xl text-cream mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4 text-heart" />
          <span>Leave a message for {museum.from_name}</span>
        </h3>

        {status === "sent" ? (
          <div className="text-xs text-presence font-medium py-2">
            🤍 Your message has been sent to {museum.from_name}.
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                required
                maxLength={20}
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Your name"
                className="bg-bg1 border border-white/15 rounded-lg px-3 py-2 text-xs text-cream focus:outline-none focus:border-gold w-36"
              />
              <input
                type="text"
                required
                maxLength={500}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Write your note..."
                className="flex-1 bg-bg1 border border-white/15 rounded-lg px-3 py-2 text-xs text-cream focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="px-5 py-2 rounded-pill bg-cream text-ink font-medium hover:bg-gold text-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </form>
        )}
      </footer>
    </div>
  );
};
