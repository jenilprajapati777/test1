import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useMultiplayerStore, RemotePeer } from "../store/useMultiplayer";
import { AvatarModel } from "./AvatarModel";
import { AvatarAnimState } from "../types/avatar";

interface SinglePeerAvatarProps {
  peer: RemotePeer;
}

const SinglePeerAvatar: React.FC<SinglePeerAvatarProps> = ({ peer }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const sample = peer.buffer.sample(Date.now());
    if (sample) {
      groupRef.current.position.x = sample.x;
      groupRef.current.position.z = sample.z;
      groupRef.current.rotation.y = sample.rotY;
    }
  });

  const showBubble = Boolean(
    peer.bubbleText && (peer.bubbleExpiresAt ?? 0) > Date.now(),
  );

  return (
    <group ref={groupRef} position={[peer.position.x, 0, peer.position.z]}>
      <AvatarModel
        config={peer.avatar}
        animState={(peer.animState as AvatarAnimState) || "idle"}
      />

      {/* Floating Nametag & Speech Bubble above head */}
      <Html
        position={[0, 2.1, 0]}
        center
        distanceFactor={10}
        zIndexRange={[100, 0]}
      >
        <div className="flex flex-col items-center pointer-events-none select-none">
          {showBubble && (
            <div className="mb-2 bg-white text-ink font-sans text-xs font-medium px-3 py-1.5 rounded-2xl shadow-lg border border-black/10 max-w-[180px] text-center animate-fade-in relative">
              {peer.bubbleText}
              <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-black/10 rotate-45" />
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tag/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-sans shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-presence animate-pulse" />
            <span className="font-medium tracking-wide">{peer.name}</span>
            {peer.role === "host" && (
              <span className="text-[9px] uppercase tracking-wider bg-gold/20 text-gold px-1 rounded font-semibold">
                Host
              </span>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
};

export const PeerAvatars: React.FC = () => {
  const peers = useMultiplayerStore((state) => state.peers);
  const peerList = Object.values(peers);

  return (
    <group name="peer-avatars">
      {peerList.map((peer) => (
        <SinglePeerAvatar key={peer.id} peer={peer} />
      ))}
    </group>
  );
};
