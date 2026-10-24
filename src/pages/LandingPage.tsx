import React, { useState } from "react";
import { Link } from "react-router-dom";
import { APP_CONFIG } from "../lib/config";
import {
  Heart,
  Users,
  Sparkles,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Play,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Do they need to download an app or create an account?",
      a: "No. Your recipient simply scans the heart QR code or opens your private link. It opens directly in their mobile or desktop browser without any friction.",
    },
    {
      q: "Can we really walk through the museum together in real time?",
      a: "Yes! If you both open the link, you will see each other walking across the gallery, chatting via speech bubbles, and sitting together in front of the cinema screen. If you are offline, an automated Host companion greets them.",
    },
    {
      q: "How long does it take to make?",
      a: "Under 3 minutes. Select your favorite memories, customize your plaque dedication, pick your outfits, and your private museum is generated instantly.",
    },
    {
      q: "Can I print the heart QR code on paper or a gift card?",
      a: "Yes. The share page lets you download high-resolution 1080×1080 cards, phone story formats, and vector SVGs that scan cleanly even when printed at 3 cm.",
    },
  ];

  return (
    <div className="min-h-screen bg-bg0 text-cream selection:bg-gold selection:text-ink flex flex-col">
      {/* Navigation */}
      <header className="border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Heart className="w-5 h-5 text-heart fill-heart transition-transform group-hover:scale-110" />
          <span className="font-serif text-2xl tracking-tight text-cream">
            Our Museum
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/m/demo"
            className="text-xs text-cream-dim hover:text-cream px-3 py-1.5 rounded-pill border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 text-gold" />
            <span>Explore Demo</span>
          </Link>
          <Link
            to="/create"
            className="text-xs bg-cream text-ink font-medium px-4 py-1.5 rounded-pill hover:bg-gold transition-colors shadow-sm"
          >
            Make one
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-6 md:px-12 pt-16 md:pt-28 pb-20 max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Subtle radial warm glow behind headline */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[140px] pointer-events-none -z-10"
            style={{
              background:
                "radial-gradient(circle, rgba(58,51,32,0.6) 0%, rgba(11,13,31,0) 70%)",
            }}
          />

          <span className="eyebrow mb-6">A private exhibition for two</span>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[1.05] text-cream mb-8">
            Turn your photos into a museum{" "}
            <span className="italic font-normal text-gold">
              only they can walk through.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-cream-dim max-w-2xl font-light leading-relaxed mb-10">
            A scannable heart QR gift card that opens into an interactive 3D
            gallery. Walk hand-in-hand past your favorite memories, read a
            personal dedication plaque, and share quiet moments together.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              to="/create"
              className="w-full sm:w-auto px-8 py-3.5 rounded-pill bg-cream text-ink font-medium hover:bg-gold transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg"
            >
              <span>Make one for your partner</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/m/demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-pill border border-white/15 text-cream hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Play className="w-4 h-4 text-gold" />
              <span>See live demo</span>
            </Link>
          </div>

          {/* Interactive Cinema / Museum Preview Banner */}
          <div className="mt-16 w-full max-w-4xl rounded-card overflow-hidden border border-white/10 bg-bg1/80 shadow-2xl relative aspect-[16/9] flex flex-col justify-end p-6 md:p-10 group">
            <div className="absolute inset-0 bg-gradient-to-t from-bg0 via-bg1/40 to-transparent z-10" />
            {/* Visual representation of the gallery */}
            <div className="absolute inset-0 flex items-center justify-center bg-[#0B0D1F]">
              <div className="relative w-full h-full flex items-center justify-around px-8 opacity-90">
                {/* Wall Art 1 */}
                <div className="w-24 sm:w-36 h-36 sm:h-52 bg-ink border-4 border-black shadow-xl rounded-sm p-2 flex flex-col items-center justify-center text-center">
                  <div className="w-full h-full bg-gradient-to-br from-[#8A6A4A]/40 to-black/80 flex items-center justify-center">
                    <span className="font-serif italic text-gold text-lg">
                      I
                    </span>
                  </div>
                  <span className="text-[9px] text-cream-dim mt-1">
                    December 2024
                  </span>
                </div>

                {/* Hero Wall & Pedestal with Plaque */}
                <div className="flex flex-col items-center">
                  <div className="w-32 sm:w-56 h-44 sm:h-72 bg-feature-wall border-4 border-black shadow-2xl p-3 flex flex-col items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-b from-stone-800 to-black flex items-center justify-center text-center p-2">
                      <span className="font-serif italic text-cream text-2xl sm:text-3xl">
                        Our Winter
                      </span>
                    </div>
                  </div>
                  {/* Pedestal */}
                  <div className="w-16 h-8 bg-wall border-t border-white/30 shadow-md mt-2 flex items-center justify-center">
                    <div className="w-12 h-4 bg-ink border border-gold/40 transform -rotate-12 rounded-[2px]" />
                  </div>
                </div>

                {/* Wall Art 2 */}
                <div className="w-24 sm:w-36 h-36 sm:h-52 bg-ink border-4 border-black shadow-xl rounded-sm p-2 flex flex-col items-center justify-center text-center">
                  <div className="w-full h-full bg-gradient-to-br from-[#3A3320]/60 to-black/80 flex items-center justify-center">
                    <span className="font-serif italic text-gold text-lg">
                      II
                    </span>
                  </div>
                  <span className="text-[9px] text-cream-dim mt-1">
                    Under the stars
                  </span>
                </div>
              </div>
            </div>

            {/* Overlay Avatars & Speech Bubble */}
            <div className="relative z-20 flex items-end justify-between">
              <div className="flex flex-col items-start gap-2">
                <div className="bg-bubble text-bubble-ink text-xs px-3 py-1.5 rounded-card shadow-lg font-medium flex items-center gap-1.5 animate-bounce">
                  <span>our whole winter is on these walls 🥺</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-tag px-3 py-1 rounded-pill flex items-center gap-2 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-presence" />
                    <span className="text-xs text-cream">Maya</span>
                  </div>
                  <div className="bg-tag px-3 py-1 rounded-pill flex items-center gap-2 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-presence" />
                    <span className="text-xs text-cream">Ethan ♡</span>
                  </div>
                </div>
              </div>
              <Link
                to="/m/demo"
                className="bg-black/60 backdrop-blur-md border border-white/20 text-cream text-xs px-4 py-2 rounded-pill hover:bg-cream hover:text-ink transition-colors flex items-center gap-2"
              >
                <span>Walk through demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* 3 Steps */}
        <section className="py-20 px-6 md:px-12 border-t border-white/5 bg-bg1/40">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="eyebrow">How it works</span>
              <h2 className="font-serif text-3xl sm:text-5xl tracking-tight text-cream mt-2">
                Three quiet steps from photos to forever.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-card border border-white/10 bg-bg0/60 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-serif text-gold text-lg mb-6">
                    1
                  </div>
                  <h3 className="font-serif text-2xl text-cream mb-2">
                    Upload memories
                  </h3>
                  <p className="text-sm text-cream-dim font-light leading-relaxed">
                    Pick up to 24 photos and an optional video. Add heartfelt
                    titles, dates, and customize your dedicated entrance plaque.
                  </p>
                </div>
                <span className="text-xs text-gold mt-6 uppercase tracking-widest font-mono">
                  3 Minutes
                </span>
              </div>

              <div className="p-8 rounded-card border border-white/10 bg-bg0/60 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-serif text-gold text-lg mb-6">
                    2
                  </div>
                  <h3 className="font-serif text-2xl text-cream mb-2">
                    Share the heart QR
                  </h3>
                  <p className="text-sm text-cream-dim font-light leading-relaxed">
                    We generate a scannable heart-shaped QR code on a gift card.
                    Download as high-res PNG, phone story, or print it out.
                  </p>
                </div>
                <span className="text-xs text-gold mt-6 uppercase tracking-widest font-mono">
                  Instant Gift
                </span>
              </div>

              <div className="p-8 rounded-card border border-white/10 bg-bg0/60 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-serif text-gold text-lg mb-6">
                    3
                  </div>
                  <h3 className="font-serif text-2xl text-cream mb-2">
                    Walk together
                  </h3>
                  <p className="text-sm text-cream-dim font-light leading-relaxed">
                    They scan the card and step inside a 3D gallery. Customize
                    your avatars at the neoclassical facade, chat, and sit on
                    the bench.
                  </p>
                </div>
                <span className="text-xs text-gold mt-6 uppercase tracking-widest font-mono">
                  Real-Time 3D
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Feature Highlights */}
        <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="eyebrow">Exquisite Details</span>
            <h2 className="font-serif text-3xl sm:text-5xl tracking-tight text-cream mt-2">
              Built with the reverence of a real gallery.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-card border border-white/10 bg-bg1/60 hover:border-gold/30 transition-colors">
              <Users className="w-8 h-8 text-gold mb-6" />
              <h3 className="font-serif text-2xl text-cream mb-3">
                Live Multiplayer
              </h3>
              <p className="text-sm text-cream-dim leading-relaxed font-light">
                Meet inside the hall in real time. Send speech bubbles, dance
                together, and sit on the cinema bench. If you're away, a host
                companion keeps them company.
              </p>
            </div>

            <div className="p-8 rounded-card border border-white/10 bg-bg1/60 hover:border-gold/30 transition-colors">
              <Sparkles className="w-8 h-8 text-gold mb-6" />
              <h3 className="font-serif text-2xl text-cream mb-3">
                A Dedicated Plaque
              </h3>
              <p className="text-sm text-cream-dim leading-relaxed font-light">
                Just like a genuine fine art exhibit, a pedestal at the entrance
                holds a black-and-gold plaque carrying your heartfelt love
                letter.
              </p>
            </div>

            <div className="p-8 rounded-card border border-white/10 bg-bg1/60 hover:border-gold/30 transition-colors">
              <Smartphone className="w-8 h-8 text-gold mb-6" />
              <h3 className="font-serif text-2xl text-cream mb-3">
                Zero Downloads
              </h3>
              <p className="text-sm text-cream-dim leading-relaxed font-light">
                Runs fluidly on iPhones, Androids, and desktops. No app stores,
                no account setup for your recipient — just tap, scan, and
                explore.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Promise */}
        <section className="py-16 px-6 md:px-12 border-y border-white/5 bg-[#0B0D1F]/50">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-gold" />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-cream mb-1">
                Our Privacy Promise
              </h3>
              <p className="text-sm text-cream-dim font-light leading-relaxed">
                Photos are transcoded entirely on your device into WebP,
                stripping all hidden EXIF and GPS location metadata before
                storage. Museums are unlisted, blocked from search engines, and
                accessible only with your secret link.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 px-6 md:px-12 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="eyebrow">Questions & Answers</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-cream mt-2">
              Everything you need to know
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-white/10 rounded-card bg-bg1/40 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full py-5 px-6 text-left flex items-center justify-between gap-4 font-serif text-lg text-cream hover:text-gold transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-cream-dim shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-gold" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-sm text-cream-dim font-light leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Optional Pricing Section (only if VITE_PRICING=on) */}
        {APP_CONFIG.showPricing && (
          <section className="py-20 px-6 md:px-12 border-t border-white/5 text-center">
            <div className="max-w-md mx-auto p-8 rounded-card border border-gold/40 bg-bg1/80">
              <span className="eyebrow">Transparent Pricing</span>
              <h2 className="font-serif text-4xl text-cream mt-2 mb-4">
                One Museum. Forever.
              </h2>
              <div className="text-4xl font-serif text-gold mb-4">$9</div>
              <p className="text-xs text-cream-dim mb-6 font-light">
                Pay once. Keep your private museum forever with unlimited
                real-time visits and no recurring subscriptions.
              </p>
              <Link
                to="/create"
                className="block w-full py-3 rounded-pill bg-cream text-ink font-medium hover:bg-gold transition-colors"
              >
                Create your museum
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 md:px-12 text-xs text-cream-dim bg-bg0">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-heart fill-heart" />
            <span className="font-serif text-lg text-cream tracking-tight">
              Museum of Us
            </span>
            <span className="text-cream-dim ml-2">
              © {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/create" className="hover:text-cream transition-colors">
              Create
            </Link>
            <Link to="/m/demo" className="hover:text-cream transition-colors">
              Demo
            </Link>
            <Link to="/setup" className="hover:text-cream transition-colors">
              Setup
            </Link>
            <Link to="/privacy" className="hover:text-cream transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-cream transition-colors">
              Terms
            </Link>
            <Link to="/report" className="hover:text-cream transition-colors">
              Report
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
