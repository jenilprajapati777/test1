import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { RoomPlan, PlacedArtwork } from "../lib/layout";
import { RoomEnvironment } from "./RoomEnvironment";
import { ArtworkMesh } from "./ArtworkMesh";
import { BenchMesh } from "./BenchMesh";
import { CinemaScreen } from "./CinemaScreen";
import { CameraController, CameraTarget } from "./CameraController";
import { Controls, InteractionTarget } from "./Controls";

interface GalleryWorldProps {
  plan: RoomPlan;
  avatarPos: { x: number; y: number; z: number; ry: number };
  onAvatarMove: (pos: {
    x: number;
    y: number;
    z: number;
    ry: number;
    isMoving: boolean;
    isRunning: boolean;
  }) => void;
  onNearTargetChange: (target: InteractionTarget | null) => void;
  onTriggerInteract: (target: InteractionTarget) => void;
  onEmote: (emote: "wave" | "dance" | "clap" | "heart") => void;
  onSelectArtwork?: (artwork: PlacedArtwork) => void;
  onSitBench?: (seatIndex: number) => void;
  viewTarget: CameraTarget | null;
  isLocked?: boolean;
  children?: React.ReactNode;
}

export const GalleryWorld: React.FC<GalleryWorldProps> = ({
  plan,
  avatarPos,
  onAvatarMove,
  onNearTargetChange,
  onTriggerInteract,
  onEmote,
  onSelectArtwork,
  onSitBench,
  viewTarget,
  isLocked = false,
  children,
}) => {
  const [orbit, setOrbit] = useState({ yaw: 0, pitch: 0.1, zoom: 3.2 });
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Pause rendering when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 || "ontouchstart" in window);
  const dprCap: [number, number] = isMobile ? [1, 1.25] : [1, 1.75];

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        frameloop={isTabVisible ? "always" : "never"}
        dpr={dprCap}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 2.5, -plan.length / 2], fov: 55 }}
      >
        {/* Lights */}
        {/* 1. Hemisphere Ambient Light */}
        <hemisphereLight
          color="#FFF5E6"
          groundColor="#1A2035"
          intensity={0.65}
        />

        {/* 2. Warm Key Directional Light with soft shadows */}
        <directionalLight
          position={[6, 8, -4]}
          intensity={1.2}
          color="#FFF2D6"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={25}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0005}
        />

        {/* 3. Cool Subtle Fill Light */}
        <directionalLight
          position={[-6, 6, 6]}
          intensity={0.35}
          color="#C8D4F0"
        />

        {/* Room Environment (Floor, Walls, Ceiling, Pedestal, Feature Walls) */}
        <RoomEnvironment plan={plan} />

        {/* Artworks */}
        {plan.artworks.map((art) => (
          <ArtworkMesh
            key={art.artwork.id || art.index}
            artwork={art}
            onSelect={onSelectArtwork}
          />
        ))}

        {/* Cinema Nook */}
        {plan.cinemaNook.present && (
          <>
            <CinemaScreen
              position={plan.cinemaNook.screenPosition}
              size={plan.cinemaNook.screenSize}
              artworks={plan.artworks}
            />
            <BenchMesh
              position={plan.cinemaNook.benchPosition}
              onSit={onSitBench}
            />
          </>
        )}

        {/* Camera Controller */}
        <CameraController
          avatarPos={avatarPos}
          viewTarget={viewTarget}
          orbitYaw={orbit.yaw}
          orbitPitch={orbit.pitch}
          zoomDist={orbit.zoom}
        />

        {/* Controls */}
        <Controls
          plan={plan}
          avatarPos={avatarPos}
          onMove={onAvatarMove}
          onNearTargetChange={onNearTargetChange}
          onTriggerInteract={onTriggerInteract}
          onEmote={onEmote}
          onOrbitChange={(yaw, pitch, zoom) => setOrbit({ yaw, pitch, zoom })}
          isLocked={isLocked}
        />

        {/* Avatar Models & NPCs */}
        {children}
      </Canvas>
    </div>
  );
};
