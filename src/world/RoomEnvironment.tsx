import React, { useMemo } from "react";
import * as THREE from "three";
import { RoomPlan } from "../lib/layout";
import {
  getCeilingTexture,
  getFloorTexture,
  getSpotlightHotspotTexture,
} from "./materials";

interface RoomEnvironmentProps {
  plan: RoomPlan;
}

export const RoomEnvironment: React.FC<RoomEnvironmentProps> = ({ plan }) => {
  const { width, length, height, featureWalls, pedestal } = plan;
  const halfW = width / 2;
  const halfL = length / 2;

  const floorTexture = useMemo(() => getFloorTexture(), []);
  const ceilingTexture = useMemo(() => getCeilingTexture(), []);
  const hotspotTexture = useMemo(() => getSpotlightHotspotTexture(), []);

  // Compute track light fixture positions along ceiling
  const trackLights = useMemo(() => {
    const list: [number, number, number][] = [];
    const spacing = 2.4;
    const startZ = -halfL + 3;
    const endZ = halfL - 3;
    for (let z = startZ; z <= endZ; z += spacing) {
      list.push([-halfW + 2, height - 0.1, z]);
      list.push([halfW - 2, height - 0.1, z]);
      list.push([0, height - 0.1, z]);
    }
    return list;
  }, [halfW, halfL, height]);

  return (
    <group>
      {/* 1. Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.4}
          metalness={0.05}
          color="#F1EFEA"
        />
      </mesh>

      {/* 2. Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial
          map={ceilingTexture}
          roughness={0.9}
          color="#0A0A0B"
        />
      </mesh>

      {/* 3. Perimeter Walls (Warm White #EDEBE6) */}
      {/* South Wall (Entrance with opening) */}
      <mesh position={[-halfW / 2 - 0.6, height / 2, -halfL]} receiveShadow>
        <boxGeometry args={[halfW - 1.2, height, 0.2]} />
        <meshStandardMaterial color="#EDEBE6" roughness={0.8} />
      </mesh>
      <mesh position={[halfW / 2 + 0.6, height / 2, -halfL]} receiveShadow>
        <boxGeometry args={[halfW - 1.2, height, 0.2]} />
        <meshStandardMaterial color="#EDEBE6" roughness={0.8} />
      </mesh>
      <mesh position={[0, height - 0.5, -halfL]} receiveShadow>
        <boxGeometry args={[2.4, 1.0, 0.2]} />
        <meshStandardMaterial color="#EDEBE6" roughness={0.8} />
      </mesh>

      {/* Double wooden entrance doors (with brass ring pulls) */}
      <group position={[0, 1.5, -halfL + 0.05]}>
        {/* Left door */}
        <mesh position={[-0.55, 0, 0]}>
          <boxGeometry args={[1.05, 3.0, 0.08]} />
          <meshStandardMaterial color="#8A6A4A" roughness={0.6} />
        </mesh>
        {/* Right door */}
        <mesh position={[0.55, 0, 0]}>
          <boxGeometry args={[1.05, 3.0, 0.08]} />
          <meshStandardMaterial color="#8A6A4A" roughness={0.6} />
        </mesh>
        {/* Ring pulls */}
        <mesh position={[-0.15, 0, 0.05]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.06, 0.015, 12, 24]} />
          <meshStandardMaterial
            color="#C8B98A"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0.15, 0, 0.05]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.06, 0.015, 12, 24]} />
          <meshStandardMaterial
            color="#C8B98A"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* North Wall */}
      <mesh position={[0, height / 2, halfL]} receiveShadow>
        <boxGeometry args={[width, height, 0.2]} />
        <meshStandardMaterial color="#EDEBE6" roughness={0.8} />
      </mesh>

      {/* West Wall */}
      <mesh
        position={[-halfW, height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[length, height, 0.2]} />
        <meshStandardMaterial color="#EDEBE6" roughness={0.8} />
      </mesh>

      {/* East Wall */}
      <mesh
        position={[halfW, height / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[length, height, 0.2]} />
        <meshStandardMaterial color="#EDEBE6" roughness={0.8} />
      </mesh>

      {/* Baseboard shadow line */}
      <mesh position={[0, 0.06, -halfL + 0.02]}>
        <boxGeometry args={[width, 0.12, 0.02]} />
        <meshStandardMaterial color="#0E0E10" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.06, halfL - 0.02]}>
        <boxGeometry args={[width, 0.12, 0.02]} />
        <meshStandardMaterial color="#0E0E10" roughness={0.9} />
      </mesh>

      {/* 4. Ceiling Track Lights */}
      {trackLights.map((pos, idx) => (
        <group key={idx} position={pos}>
          {/* Track fixture body */}
          <mesh>
            <cylinderGeometry args={[0.04, 0.06, 0.12, 12]} />
            <meshStandardMaterial
              color="#1E2026"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          {/* Tiny glowing bulb */}
          <mesh position={[0, -0.06, 0]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="#FFF5D6" />
          </mesh>
        </group>
      ))}

      {/* 5. Feature Walls */}
      {featureWalls.map((fw) => (
        <group key={fw.id} position={fw.position} rotation={fw.rotation}>
          {/* Low white plinth (0.35m height) */}
          <mesh position={[0, -fw.size[1] / 2 + 0.175, 0]} receiveShadow>
            <boxGeometry args={[fw.size[0] + 0.4, 0.35, fw.size[2] + 0.4]} />
            <meshStandardMaterial color="#F7F4EF" roughness={0.5} />
          </mesh>

          {/* Freestanding black wall (matte black #0B0B0D) */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={fw.size} />
            <meshStandardMaterial
              color="#0B0B0D"
              roughness={0.85}
              metalness={0.1}
            />
          </mesh>

          {/* Additive spotlight hot-spot decal on the front face */}
          {fw.hasHotspot && (
            <mesh
              position={[0, 0, -fw.size[2] / 2 - 0.01]}
              rotation={[0, Math.PI, 0]}
            >
              <planeGeometry args={[3.2, 3.2]} />
              <meshBasicMaterial
                map={hotspotTexture}
                transparent
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          )}

          {/* One real SpotLight pointed directly at the hero wall */}
          {fw.hasRealSpotlight && (
            <spotLight
              position={[0, 4.5, -2.5]}
              target-position={[0, 1.8, -fw.size[2] / 2]}
              intensity={2.8}
              distance={8}
              angle={0.55}
              penumbra={0.7}
              color="#FFF0D4"
              castShadow
            />
          )}
        </group>
      ))}

      {/* 6. Pedestal with Tilted Plaque */}
      <group position={pedestal.position}>
        {/* White pedestal cube (1x1x0.9m) */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={pedestal.size} />
          <meshStandardMaterial
            color="#EDEBE6"
            roughness={0.4}
            metalness={0.05}
          />
        </mesh>

        {/* Tilted plaque on top of pedestal */}
        <group
          position={[0, pedestal.size[1] / 2 + 0.02, 0]}
          rotation={pedestal.plaqueRotation}
        >
          {/* Black plaque slab */}
          <mesh castShadow>
            <boxGeometry args={[0.56, 0.02, 0.42]} />
            <meshStandardMaterial
              color="#0B0D1F"
              roughness={0.3}
              metalness={0.6}
            />
          </mesh>
          {/* Gold plaque border frame */}
          <mesh position={[0, 0.012, 0]}>
            <boxGeometry args={[0.54, 0.002, 0.4]} />
            <meshStandardMaterial
              color="#C8B98A"
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
};
