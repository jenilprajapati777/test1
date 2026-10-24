import React, { useMemo } from "react";
import * as THREE from "three";
import { PlacedArtwork } from "../lib/layout";
import { renderPlaceholderArt } from "../lib/placeholderArt";

interface ArtworkMeshProps {
  artwork: PlacedArtwork;
  onSelect?: (artwork: PlacedArtwork) => void;
}

export const ArtworkMesh: React.FC<ArtworkMeshProps> = ({
  artwork,
  onSelect,
}) => {
  const [w, h] = artwork.size;
  const frameThick = 0.025; // 25mm black frame
  const matBorder = 0.09; // 90mm white mat

  // Create texture from blob_url or generate placeholder art
  const imageTexture = useMemo(() => {
    if (artwork.artwork.blob_url) {
      const loader = new THREE.TextureLoader();
      return loader.load(artwork.artwork.blob_url);
    }

    const canvas = document.createElement("canvas");
    renderPlaceholderArt(canvas, {
      width: 800,
      height: Math.floor(800 * (h / w)),
      numeral: artwork.isHero ? "I" : `${artwork.index + 1}`,
      subtitle: artwork.artwork.title || "Memory",
    });
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, [artwork, w, h]);

  // Label card texture
  const labelTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#EDEBE6";
    ctx.fillRect(0, 0, 256, 128);

    ctx.fillStyle = "#0E0E10";
    ctx.font = 'bold 20px "Instrument Serif", Georgia, serif';
    ctx.fillText(artwork.artwork.title?.slice(0, 24) || "Untitled", 16, 40);

    ctx.fillStyle = "#5A5852";
    ctx.font = "14px Inter, sans-serif";
    ctx.fillText(artwork.artwork.taken_on || "2024 · Memory", 16, 70);

    return new THREE.CanvasTexture(canvas);
  }, [artwork]);

  return (
    <group
      position={artwork.position}
      rotation={artwork.rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(artwork);
      }}
    >
      {/* 1. Black outer frame (25mm) */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[w, h, frameThick]} />
        <meshStandardMaterial color="#0A0A0B" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* 2. White mat (90mm border) */}
      <mesh position={[0, 0, frameThick / 2 + 0.002]}>
        <planeGeometry args={[w - 0.05, h - 0.05]} />
        <meshStandardMaterial color="#F7F5F0" roughness={0.9} />
      </mesh>

      {/* 3. Photo image inside mat */}
      <mesh position={[0, 0, frameThick / 2 + 0.004]}>
        <planeGeometry args={[w - matBorder * 2, h - matBorder * 2]} />
        <meshBasicMaterial map={imageTexture} />
      </mesh>

      {/* 4. Small museum label card next to frame */}
      <mesh position={[w / 2 + 0.22, -h / 2 + 0.1, 0.01]}>
        <planeGeometry args={[0.24, 0.12]} />
        <meshStandardMaterial map={labelTexture} roughness={0.9} />
      </mesh>
    </group>
  );
};
