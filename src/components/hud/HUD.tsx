import React, { useState, useEffect, useRef } from "react";
import { InteractionTarget } from "../../world/Controls";
import { PublicMuseum } from "../../types/museum";
import {
  MessageSquare,
  Smile,
  Volume2,
  VolumeX,
  HelpCircle,
  MoreHorizontal,
  Send,
  X,
  Heart,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getClient } from "../../client";
import { sanitizeText } from "../../lib/sanitize";

interface ActiveChat {
  id: string;
  senderName: string;
  message: string;
  expiresAt: number;
}

interface HUDProps {
  museum: PublicMuseum;
  visitorName: string;
  nearTarget: InteractionTarget | null;
  onTriggerInteract: (target: InteractionTarget) => void;
  onSendChat: (message: string) => void;
  onEmote: (emote: "wave" | "dance" | "clap" | "heart") => void;
  recentChats: ActiveChat[];
}

export const HUD: React.FC<HUDProps> = ({
  museum,
  visitorName,
  nearTarget,
  onTriggerInteract,
  onSendChat,
  onEmote,
  recentChats,
}) => {
  const [showChatInput, setShowChatInput] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [showEmotes, setShowEmotes] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMessageSheet, setShowMessageSheet] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [showFirstToast, setShowFirstToast] = useState(true);

  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide HUD after 4s idle on desktop
  useEffect(() => {
    const resetIdle = () => {
      setIsIdle(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        setIsIdle(true);
      }, 4000);
    };

    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    resetIdle();

    return () => {
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  // Dismiss first visit toast after 6s
  useEffect(() => {
    const t = setTimeout(() => setShowFirstToast(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeText(chatMessage, 120);
    if (!clean) return;
    onSendChat(clean);
    setChatMessage("");
    setShowChatInput(false);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeText(replyMessage, 500);
    if (!clean) return;

    setReplyStatus("sending");
    try {
      const client = getClient();
      const res = await client.postReply(museum.slug, visitorName, clean);
      if (res.success) {
        setReplyStatus("sent");
        setTimeout(() => {
          setShowMessageSheet(false);
          setReplyStatus("idle");
          setReplyMessage("");
        }, 1500);
      } else {
        setReplyStatus("error");
      }
    } catch {
      setReplyStatus("error");
    }
  };

  // Screen reader polite announcements
  const latestChat = recentChats[recentChats.length - 1];

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none flex flex-col justify-between p-4 md:p-6">
      {/* Screen Reader Live Region */}
      <div aria-live="polite" className="sr-only">
        {latestChat
          ? `${latestChat.senderName} says: ${latestChat.message}`
          : ""}
      </div>

      {/* Top Header: Museum Title and Menu */}
      <header
        className={`flex items-center justify-between transition-opacity duration-300 ${isIdle ? "opacity-0" : "opacity-100"}`}
      >
        <div className="glass-dark px-4 py-2 rounded-pill flex items-center gap-3 border border-white/10 pointer-events-auto shadow-lg">
          <span className="font-serif text-cream text-sm">
            {museum.title || "Our Museum"}
          </span>
          <span className="w-1 h-1 rounded-full bg-gold/60" />
          <span className="text-xs text-cream-dim">
            {museum.from_name} <span className="italic font-serif">to</span>{" "}
            {museum.to_name}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            aria-label={isMuted ? "Unmute" : "Mute"}
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full glass-dark border border-white/10 text-cream flex items-center justify-center hover:bg-white/15 transition-all shadow-md"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-cream-dim" />
            ) : (
              <Volume2 className="w-4 h-4 text-gold" />
            )}
          </button>
          <button
            type="button"
            aria-label="Help"
            onClick={() => setShowHelp(true)}
            className="w-10 h-10 rounded-full glass-dark border border-white/10 text-cream flex items-center justify-center hover:bg-white/15 transition-all shadow-md"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setShowMenu(true)}
            className="w-10 h-10 rounded-full glass-dark border border-white/10 text-cream flex items-center justify-center hover:bg-white/15 transition-all shadow-md"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* First Visit Toast */}
      {showFirstToast && (
        <aside
          aria-label="Controls guide"
          className="self-center glass-dark px-5 py-2.5 rounded-pill border border-gold/30 text-xs text-cream shadow-2xl animate-fade-in flex items-center gap-2"
        >
          <span>WASD to walk · drag to look · E to interact</span>
        </aside>
      )}

      {/* Contextual Interaction Chip (when near target <= 2.2m) */}
      {nearTarget && (
        <div className="self-center mb-8 pointer-events-auto">
          <button
            type="button"
            onClick={() => onTriggerInteract(nearTarget)}
            className="px-5 py-2.5 rounded-pill bg-cream text-ink font-medium shadow-2xl hover:bg-gold transition-all duration-200 flex items-center gap-2.5 hover:scale-105 active:scale-95"
          >
            <span className="text-sm">🔍</span>
            <span className="text-xs font-semibold">{nearTarget.name}</span>
            <span className="bg-ink text-cream text-[10px] px-1.5 py-0.5 rounded font-mono">
              E
            </span>
          </button>
        </div>
      )}

      {/* Bottom Bar: Speech bubble display, Emotes, Chat */}
      <footer
        className={`flex items-end justify-between transition-opacity duration-300 ${isIdle && !showChatInput ? "opacity-0" : "opacity-100"}`}
      >
        {/* Left Side: Speech bubbles stack */}
        <div className="flex flex-col gap-2 max-w-sm pointer-events-auto">
          {recentChats.slice(-3).map((chat) => (
            <div
              key={chat.id + chat.expiresAt}
              className="bg-bubble text-bubble-ink px-4 py-2 rounded-card shadow-xl text-xs font-medium border border-black/5 animate-fade-in"
            >
              <span className="font-semibold text-ink mr-1.5">
                {chat.senderName}:
              </span>
              <span>{chat.message}</span>
            </div>
          ))}
        </div>

        {/* Right Side: Chat and Emotes buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Emotes Trigger */}
          <div className="relative">
            {showEmotes && (
              <div className="absolute bottom-12 right-0 glass-dark p-2 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    onEmote("wave");
                    setShowEmotes(false);
                  }}
                  className="p-2 hover:bg-white/15 rounded-xl text-base transition-transform hover:scale-110"
                  title="1: Wave"
                >
                  👋
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onEmote("dance");
                    setShowEmotes(false);
                  }}
                  className="p-2 hover:bg-white/15 rounded-xl text-base transition-transform hover:scale-110"
                  title="2: Dance"
                >
                  💃
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onEmote("clap");
                    setShowEmotes(false);
                  }}
                  className="p-2 hover:bg-white/15 rounded-xl text-base transition-transform hover:scale-110"
                  title="3: Clap"
                >
                  👏
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onEmote("heart");
                    setShowEmotes(false);
                  }}
                  className="p-2 hover:bg-white/15 rounded-xl text-base transition-transform hover:scale-110"
                  title="4: Floating Hearts"
                >
                  ❤️
                </button>
              </div>
            )}
            <button
              type="button"
              aria-label="Emotes"
              onClick={() => setShowEmotes(!showEmotes)}
              className="w-11 h-11 rounded-full glass-dark border border-white/10 text-cream flex items-center justify-center hover:bg-white/15 transition-all shadow-lg"
            >
              <Smile className="w-5 h-5 text-gold" />
            </button>
          </div>

          {/* Chat Trigger & Input Form */}
          {showChatInput ? (
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                maxLength={120}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Say something... (max 120 chars)"
                className="glass-dark border border-gold/40 text-cream text-xs px-4 py-2.5 rounded-pill focus:outline-none focus:border-gold w-64 shadow-2xl"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="w-10 h-10 rounded-full bg-cream text-ink flex items-center justify-center hover:bg-gold transition-colors shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowChatInput(false)}
                className="w-10 h-10 rounded-full glass-dark text-cream flex items-center justify-center hover:bg-white/15"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              aria-label="Chat"
              onClick={() => setShowChatInput(true)}
              className="w-11 h-11 rounded-full glass-dark border border-white/10 text-cream flex items-center justify-center hover:bg-white/15 transition-all shadow-lg"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          )}
        </div>
      </footer>

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 pointer-events-auto"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="glass-dark border border-white/15 rounded-card p-8 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl text-cream">How to explore</h3>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-cream-dim hover:text-cream"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-cream-dim font-light leading-relaxed">
              <p>
                • <strong>Walk:</strong> WASD or Arrow keys. Hold Shift to run.
              </p>
              <p>
                • <strong>Look:</strong> Drag mouse or swipe on touch screen to
                orbit.
              </p>
              <p>
                • <strong>Interact:</strong> Walk up to any painting, the
                plaque, or the bench and press <strong>E</strong>.
              </p>
              <p>
                • <strong>Emotes:</strong> Press 1 for wave, 2 for dance, 3 for
                clap, 4 for hearts.
              </p>
              <p>
                • <strong>Chat:</strong> Tap the message icon to send a speech
                bubble.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-2.5 rounded-pill bg-cream text-ink font-medium hover:bg-gold text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Menu Sheet */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 pointer-events-auto"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="glass-dark border border-white/15 rounded-card p-6 max-w-sm w-full shadow-2xl space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
              <span className="font-serif text-xl text-cream">Museum Menu</span>
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="text-cream-dim hover:text-cream"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                setShowMessageSheet(true);
              }}
              className="w-full text-left py-2.5 px-3 rounded-lg text-xs text-cream hover:bg-white/10 transition-colors flex items-center gap-2.5"
            >
              <Heart className="w-4 h-4 text-heart" />
              <span>Leave a message for {museum.from_name}</span>
            </button>

            <Link
              to={`/report?slug=${museum.slug}`}
              className="w-full text-left py-2.5 px-3 rounded-lg text-xs text-cream-dim hover:bg-white/10 hover:text-cream transition-colors flex items-center gap-2.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Report this exhibition</span>
            </Link>

            <Link
              to="/create"
              className="w-full text-left py-2.5 px-3 rounded-lg text-xs text-gold hover:bg-white/10 transition-colors flex items-center gap-2.5"
            >
              <span>✦ Make one for your partner</span>
            </Link>

            <Link
              to="/"
              className="w-full text-left py-2.5 px-3 rounded-lg text-xs text-cream-dim hover:bg-white/10 transition-colors block border-t border-white/10 pt-3"
            >
              Exit Museum
            </Link>
          </div>
        </div>
      )}

      {/* Leave a message sheet */}
      {showMessageSheet && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 pointer-events-auto"
          onClick={() => setShowMessageSheet(false)}
        >
          <div
            className="glass-dark border border-gold/30 rounded-card p-6 md:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl text-cream">
                Leave a note for {museum.from_name}
              </h3>
              <button
                type="button"
                onClick={() => setShowMessageSheet(false)}
                className="text-cream-dim hover:text-cream"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {replyStatus === "sent" ? (
              <div className="text-center py-6 text-presence text-sm font-medium">
                🤍 Your message was delivered to {museum.from_name}'s inbox.
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="space-y-4">
                <div>
                  <label
                    htmlFor="hud-reply-msg"
                    className="block text-xs text-cream-dim mb-1 font-mono uppercase tracking-wider"
                  >
                    Your message (max 500 characters)
                  </label>
                  <textarea
                    id="hud-reply-msg"
                    rows={4}
                    maxLength={500}
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Tell them what walking through this meant to you..."
                    className="w-full bg-bg0/80 border border-white/15 rounded-lg p-3 text-sm text-cream focus:outline-none focus:border-gold resize-none"
                  />
                  <div className="text-right text-[11px] text-cream-dim/60 mt-1">
                    {replyMessage.length}/500
                  </div>
                </div>

                {replyStatus === "error" && (
                  <div className="text-xs text-heart bg-heart/10 p-2.5 rounded-lg">
                    Could not send message. Please try again.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={replyStatus === "sending"}
                  className="w-full py-3 rounded-pill bg-cream text-ink font-medium hover:bg-gold transition-colors text-sm disabled:opacity-50"
                >
                  {replyStatus === "sending" ? "Delivering..." : "Send note"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
