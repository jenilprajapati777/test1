import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getClient } from "../client";
import { PublicMuseum } from "../types/museum";
import {
  AvatarConfig,
  DEFAULT_VISITOR_AVATAR,
  DEFAULT_HOST_AVATAR,
} from "../types/avatar";
import { generateRoomLayout, PlacedArtwork } from "../lib/layout";
import { GalleryWorld } from "../world/GalleryWorld";
import { AvatarModel } from "../world/AvatarModel";
import { DoorCustomizer } from "../components/customizer/DoorCustomizer";
import { PlaqueViewModal } from "../components/plaque/PlaqueViewModal";
import { HUD } from "../components/hud/HUD";
import { InteractionTarget } from "../world/Controls";
import { CameraTarget } from "../world/CameraController";
import {
  createInitialHostNpcState,
  hostNpcReducer,
  HostNpcState,
} from "../lib/hostNpc";
import { Heart, Maximize2, ArrowLeft } from "lucide-react";
import { LiteGallery } from "../components/lite/LiteGallery";
import { useMultiplayerStore } from "../store/useMultiplayer";
import { PeerAvatars } from "../world/PeerAvatars";

type ExperienceStage =
  "loading" | "ready" | "customizer" | "gallery" | "closed";

interface ActiveChat {
  id: string;
  senderName: string;
  message: string;
  expiresAt: number;
}

export const MuseumPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const isLite = searchParams.get("lite") === "1";
  const isHostParam = searchParams.get("as") === "host";

  const [museum, setMuseum] = useState<PublicMuseum | null>(null);
  const [stage, setStage] = useState<ExperienceStage>("loading");
  const [progress, setProgress] = useState(0);
  const [openFullscreen, setOpenFullscreen] = useState(true);
  const [visitorName, setVisitorName] = useState("Visitor");
  const [visitorAvatar, setVisitorAvatar] = useState<AvatarConfig>(
    DEFAULT_VISITOR_AVATAR,
  );

  // 3D & Avatar state
  const [avatarPos, setAvatarPos] = useState({ x: 0, y: 0, z: -10, ry: 0 });
  const [avatarAnim, setAvatarAnim] = useState<
    "idle" | "walk" | "run" | "sit" | "dance" | "wave" | "clap"
  >("idle");
  const [nearTarget, setNearTarget] = useState<InteractionTarget | null>(null);
  const [viewTarget, setViewTarget] = useState<CameraTarget | null>(null);
  const [activeArtwork, setActiveArtwork] = useState<PlacedArtwork | null>(
    null,
  );
  const [isPlaqueOpen, setIsPlaqueOpen] = useState(false);

  // Host NPC state
  const [hostState, setHostState] = useState<HostNpcState>(
    createInitialHostNpcState(),
  );

  // Chat messages
  const [recentChats, setRecentChats] = useState<ActiveChat[]>([]);

  // Multiplayer
  const {
    connect,
    broadcastPosition,
    broadcastBubble,
    broadcastEmote,
    hasLiveHost,
  } = useMultiplayerStore();
  const lastBroadcastRef = React.useRef<number>(0);

  // WebGL context check
  const [webGlSupported, setWebGlSupported] = useState(true);

  // Check WebGL availability on mount
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setWebGlSupported(false);
    } catch {
      setWebGlSupported(false);
    }
  }, []);

  // 1. Fetch Museum Data
  useEffect(() => {
    let mounted = true;
    async function load() {
      const client = getClient();
      const currentSlug = slug || "demo";
      const data = await client.getMuseum(currentSlug);

      if (!mounted) return;

      if (!data) {
        setStage("closed");
        return;
      }

      setMuseum(data);
      setVisitorName(data.to_name || "Visitor");
      setHostState(createInitialHostNpcState(data.host_lines));

      // Track visit
      if (!isPreview) {
        client.trackVisit(currentSlug).catch(() => {});
      }

      // Update document title: "{from} to {to}"
      document.title = `${data.from_name} to ${data.to_name}`;

      // Simulate asset loading progress
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 25) + 15;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          if (mounted) {
            setProgress(100);
            setStage("ready");
          }
        } else {
          if (mounted) setProgress(currentProgress);
        }
      }, 100);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [slug, isPreview]);

  // Generate Room Plan
  const plan = useMemo(() => {
    if (!museum) return null;
    return generateRoomLayout(museum.artworks || []);
  }, [museum]);

  // Set initial spawn position once plan is ready
  useEffect(() => {
    if (plan) {
      setAvatarPos({
        x: plan.spawnPoint.x,
        y: 0,
        z: plan.spawnPoint.z,
        ry: plan.spawnPoint.ry,
      });
    }
  }, [plan]);

  // Connect to multiplayer channel when entering gallery
  useEffect(() => {
    if (stage === "gallery") {
      const disconnect = connect(
        slug || "demo",
        visitorName,
        visitorAvatar,
        Boolean(isHostParam),
      );
      return () => disconnect();
    }
  }, [stage, slug, visitorName, visitorAvatar, isHostParam, connect]);

  // Host NPC spawn trigger after entering gallery
  useEffect(() => {
    if (stage === "gallery") {
      const timer = setTimeout(() => {
        setHostState((prev) =>
          hostNpcReducer(prev, { type: "SPAWN_GREETING" }, museum?.host_lines),
        );
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [stage, museum?.host_lines]);

  // Host speech auto-add to chat bubbles
  useEffect(() => {
    if (hostState.currentSpeech && hostState.status !== "Inactive") {
      const hostChat: ActiveChat = {
        id: `host-${Date.now()}`,
        senderName: `${museum?.host_name || "Host"} ♡`,
        message: hostState.currentSpeech,
        expiresAt: Date.now() + 5000,
      };
      setRecentChats((prev) => [...prev, hostChat]);
    }
  }, [hostState.currentSpeech, hostState.status, museum?.host_name]);

  // Purge expired chats periodically
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setRecentChats((prev) => prev.filter((c) => c.expiresAt > now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Start Click
  const handleStart = () => {
    if (
      openFullscreen &&
      typeof document !== "undefined" &&
      document.fullscreenEnabled
    ) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setStage("customizer");
  };

  // Handle Enter Museum from Door Customizer
  const handleEnterMuseum = (name: string, config: AvatarConfig) => {
    setVisitorName(name);
    setVisitorAvatar(config);
    setStage("gallery");
  };

  // Handle interaction trigger
  const handleTriggerInteract = useCallback(
    (target: InteractionTarget) => {
      if (target.type === "plaque") {
        setIsPlaqueOpen(true);
        setActiveArtwork(null);
        // Dolly camera to plaque
        setViewTarget({
          mode: "viewing",
          targetPos: [
            plan?.pedestal.viewPosition[0] || 0,
            1.3,
            plan?.pedestal.viewPosition[2] || -5,
          ],
          lookAtPos: [
            plan?.pedestal.plaquePosition[0] || 0,
            1.2,
            plan?.pedestal.plaquePosition[2] || -4,
          ],
          fov: 38,
        });
      } else if (target.type === "artwork" && target.artwork) {
        setActiveArtwork(target.artwork);
        setIsPlaqueOpen(false);
        setViewTarget({
          mode: "viewing",
          targetPos: target.artwork.viewCameraPosition,
          lookAtPos: [
            target.artwork.position[0],
            target.artwork.position[1],
            target.artwork.position[2],
          ],
          fov: 38,
        });
      } else if (target.type === "bench") {
        // Sit on bench
        setAvatarAnim("sit");
        setHostState((prev) =>
          hostNpcReducer(
            prev,
            { type: "VISITOR_SIT", seatIndex: target.seatIndex || 0 },
            museum?.host_lines,
          ),
        );
        if (plan) {
          const seat = plan.cinemaNook.seats[target.seatIndex || 0];
          setAvatarPos((prev) => ({ ...prev, x: seat.x, z: seat.z, ry: 0 }));
          setViewTarget({
            mode: "bench",
            targetPos: plan.cinemaNook.viewCameraPosition,
            lookAtPos: [0, 1.8, plan.cinemaNook.screenPosition[2]],
          });
        }
      }
    },
    [plan, museum?.host_lines],
  );

  // Handle closing viewing modal
  const handleCloseViewing = useCallback(() => {
    setIsPlaqueOpen(false);
    setActiveArtwork(null);
    setViewTarget(null);
  }, []);

  // Handle sending local chat
  const handleSendChat = (message: string) => {
    const chat: ActiveChat = {
      id: crypto.randomUUID(),
      senderName: visitorName,
      message,
      expiresAt: Date.now() + 5000,
    };
    setRecentChats((prev) => [...prev, chat]);
    broadcastBubble(message);
  };

  // Handle emote
  const handleEmote = (emote: "wave" | "dance" | "clap" | "heart") => {
    broadcastEmote(emote);
    if (emote === "heart") {
      setAvatarAnim("wave");
    } else {
      setAvatarAnim(emote);
    }
    if (emote === "dance") {
      setHostState((prev) =>
        hostNpcReducer(prev, { type: "VISITOR_DANCE" }, museum?.host_lines),
      );
    }
    // Return to idle after animation
    if (emote !== "dance") {
      setTimeout(() => setAvatarAnim("idle"), 3000);
    }
  };

  // If lite=1 requested or WebGL unsupported, show Lite 2D carousel
  if (isLite || !webGlSupported) {
    if (!museum) {
      return (
        <div className="min-h-screen bg-bg0 text-cream flex items-center justify-center p-6 text-center">
          <p className="text-cream-dim">This museum has closed.</p>
        </div>
      );
    }
    return <LiteGallery museum={museum} />;
  }

  // 1. Closed State
  if (stage === "closed") {
    return (
      <div className="min-h-screen bg-bg0 text-cream flex flex-col items-center justify-center p-6 text-center">
        <Heart className="w-8 h-8 text-heart mb-6 opacity-80" />
        <span className="eyebrow mb-2">Exhibition Concluded</span>
        <h1 className="font-serif text-4xl sm:text-5xl text-cream mb-4">
          This museum has closed.
        </h1>
        <p className="text-sm text-cream-dim font-light max-w-sm mb-8 leading-relaxed">
          The memory walls have been taken down or this exhibition has expired.
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 rounded-pill bg-cream text-ink text-xs font-medium hover:bg-gold transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return home</span>
        </Link>
      </div>
    );
  }

  // 2. Loading & Ready Stage (§3 03s–05s)
  if (stage === "loading" || stage === "ready") {
    return (
      <div className="min-h-screen bg-bg0 text-cream flex flex-col items-center justify-center p-6 text-center relative overflow-hidden select-none">
        {/* Warm radial glow in center */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[140px] pointer-events-none -z-10"
          style={{
            background:
              "radial-gradient(circle, rgba(58,51,32,0.65) 0%, rgba(11,13,31,0) 75%)",
          }}
        />

        {/* Museum Title in High-Contrast Display Serif */}
        <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl tracking-tight text-cream mb-4 drop-shadow-[0_0_35px_rgba(243,234,211,0.2)]">
          {museum?.title || "Our Museum"}
        </h1>

        {/* From Ethan | To Maya */}
        <div className="flex items-center gap-3 text-sm sm:text-base text-cream-dim mb-12">
          <span>
            From{" "}
            <span className="font-serif italic text-cream font-medium">
              {museum?.from_name || "Ethan"}
            </span>
          </span>
          <span className="w-[1px] h-3.5 bg-cream-dim/30" />
          <span>
            To{" "}
            <span className="font-serif italic text-cream font-medium">
              {museum?.to_name || "Maya"}
            </span>
          </span>
        </div>

        {/* Progress Line or Start Pill */}
        <div className="w-full max-w-xs flex flex-col items-center">
          {stage === "loading" ? (
            <div className="w-full">
              {/* 2px cream progress bar */}
              <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-cream transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-cream-dim uppercase">
                <span>{progress === 100 ? "Ready" : "Loading"}</span>
                <span>{progress}%</span>
              </div>
            </div>
          ) : (
            /* Start Pill (§3 04s–05s) */
            <div className="flex flex-col items-center gap-3 w-full animate-fade-in">
              <button
                type="button"
                onClick={handleStart}
                className="w-full py-3.5 px-8 rounded-pill bg-[#B9B585] text-ink font-semibold hover:bg-gold transition-all duration-200 shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
              >
                <span>Start</span>
              </button>

              {/* Open in full screen checkbox */}
              {typeof document !== "undefined" &&
                document.fullscreenEnabled && (
                  <label className="flex items-center gap-2 text-xs text-cream-dim cursor-pointer hover:text-cream transition-colors mt-1">
                    <input
                      type="checkbox"
                      checked={openFullscreen}
                      onChange={(e) => setOpenFullscreen(e.target.checked)}
                      className="accent-gold rounded"
                    />
                    <Maximize2 className="w-3.5 h-3.5 text-gold/80" />
                    <span>Open in full screen</span>
                  </label>
                )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Door Customizer Stage (§3 05s)
  if (stage === "customizer") {
    return (
      <DoorCustomizer
        initialName={museum?.to_name || "Maya"}
        onEnter={handleEnterMuseum}
      />
    );
  }

  // 4. Gallery 3D World Stage
  if (!plan || !museum) return null;

  return (
    <div className="relative w-full h-screen bg-bg0 overflow-hidden select-none">
      {/* 3D Canvas */}
      <GalleryWorld
        plan={plan}
        avatarPos={avatarPos}
        onAvatarMove={(move) => {
          setAvatarPos({ x: move.x, y: move.y, z: move.z, ry: move.ry });
          const currentAnim = move.isRunning
            ? "run"
            : move.isMoving
              ? "walk"
              : "idle";
          setAvatarAnim(currentAnim);

          // Broadcast position at ~15 Hz
          const now = Date.now();
          if (now - lastBroadcastRef.current >= 66) {
            lastBroadcastRef.current = now;
            broadcastPosition(move.x, move.z, move.ry, currentAnim);
          }

          setHostState((prev) =>
            hostNpcReducer(
              prev,
              {
                type: "VISITOR_MOVE",
                x: move.x,
                z: move.z,
                isMoving: move.isMoving,
              },
              museum.host_lines,
            ),
          );
        }}
        onNearTargetChange={setNearTarget}
        onTriggerInteract={handleTriggerInteract}
        onEmote={handleEmote}
        onSelectArtwork={(art) =>
          handleTriggerInteract({
            type: "artwork",
            id: art.artwork.id || "",
            name: art.artwork.title || "",
            position: art.position,
            artwork: art,
          })
        }
        onSitBench={(seatIdx) =>
          handleTriggerInteract({
            type: "bench",
            id: `bench-${seatIdx}`,
            name: "Bench",
            position: [0, 0, 0],
            seatIndex: seatIdx,
          })
        }
        viewTarget={viewTarget}
        isLocked={isPlaqueOpen || Boolean(activeArtwork)}
      >
        {/* Visitor Avatar */}
        <AvatarModel
          config={visitorAvatar}
          animState={avatarAnim}
          position={[avatarPos.x, avatarPos.y, avatarPos.z]}
          rotation={[0, avatarPos.ry, 0]}
        />

        {/* Remote Peers in Multiplayer */}
        <PeerAvatars />

        {/* Host Companion Avatar (if live host is not present) */}
        {!isHostParam && !hasLiveHost && hostState.status !== "Inactive" && (
          <AvatarModel
            config={museum.host_avatar || DEFAULT_HOST_AVATAR}
            animState={
              hostState.status === "Dancing"
                ? "dance"
                : hostState.status === "Seated"
                  ? "sit"
                  : "idle"
            }
            position={[
              hostState.position.x,
              hostState.position.y,
              hostState.position.z,
            ]}
            rotation={[0, hostState.position.ry, 0]}
            isMirroredDance={true}
          />
        )}
      </GalleryWorld>

      {/* 2D HUD */}
      <HUD
        museum={museum}
        visitorName={visitorName}
        nearTarget={nearTarget}
        onTriggerInteract={handleTriggerInteract}
        onSendChat={handleSendChat}
        onEmote={handleEmote}
        recentChats={recentChats}
      />

      {/* Viewing Mode Modal (for Plaque and Artworks) */}
      <PlaqueViewModal
        museum={museum}
        activeArtwork={activeArtwork}
        isPlaqueOpen={isPlaqueOpen}
        onClose={handleCloseViewing}
        onNavigateArtwork={(dir) => {
          if (!activeArtwork) return;
          const nextIdx =
            (activeArtwork.index + dir + plan.artworks.length) %
            plan.artworks.length;
          const nextArt = plan.artworks[nextIdx];
          handleTriggerInteract({
            type: "artwork",
            id: nextArt.artwork.id || "",
            name: nextArt.artwork.title || "",
            position: nextArt.position,
            artwork: nextArt,
          });
        }}
      />
    </div>
  );
};
