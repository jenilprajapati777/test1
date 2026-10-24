import React, { useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { PlacedArtwork } from "../lib/layout";
import { renderPlaceholderArt } from "../lib/placeholderArt";

interface CinemaScreenProps {
  position: [number, number, number];
  size: [number, number]; // [3.2, 1.8]
  artworks: PlacedArtwork[];
  videoUrl?: string;
}

export const CinemaScreen: React.FC<CinemaScreenProps> = ({
  position,
  size,
  artworks,
  videoUrl,
}) => {
  const [w, h] = size;
  const [currentIdx, setCurrentIdx] = useState(0);

  // Slideshow timer every 5 seconds if not video
  useEffect(() => {
    if (videoUrl || artworks.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % artworks.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [videoUrl, artworks.length]);

  const activeArtwork = artworks[currentIdx];

  const screenTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    renderPlaceholderArt(canvas, {
      width: 1280,
      height: 720,
      numeral: "★",
      subtitle: activeArtwork?.artwork.title || "Cinema Slideshow",
      palette: ["#121528", "#07080F"],
    });
    return new THREE.CanvasTexture(canvas);
  }, [activeArtwork]);

  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      {/* 1. Black outer bezel */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[w, h, 0.1]} />
        <meshStandardMaterial color="#0A0A0B" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* 2. Display screen with soft glow */}
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[w - 0.12, h - 0.12]} />
        <meshBasicMaterial map={screenTexture} />
      </mesh>
    </group>
  );
};
