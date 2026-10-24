import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getLimestoneTexture } from './materials';

interface FacadeSceneProps {
  doorOpenProgress: number; // 0.0 to 1.0 (doors swing open)
}

export const FacadeScene: React.FC<FacadeSceneProps> = ({ doorOpenProgress }) => {
  const limestoneTexture = useMemo(() => getLimestoneTexture(), []);

  // Compute door swing angle: 0 to -85 deg (-1.48 rad)
  const leftDoorAngle = doorOpenProgress * (-85 * (Math.PI / 180));
  const rightDoorAngle = doorOpenProgress * (85 * (Math.PI / 180));

  return (
    <group>
      {/* 1. Glossy ground floor in front of museum facade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 2]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial
          color="#D8D2C5"
          roughness={0.2}
          metalness={0.15}
        />
      </mesh>

      {/* 2. 3 Stone Steps leading up to door */}
      <mesh position={[0, 0.08, 0.6]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.16, 0.8]} />
        <meshStandardMaterial color="#DDD7CC" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.24, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.16, 0.8]} />
        <meshStandardMaterial color="#D7D1C6" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.4, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.16, 0.8]} />
        <meshStandardMaterial color="#D2CCC1" roughness={0.7} />
      </mesh>

      {/* 3. Neoclassical Wall Facade (Limestone blocks) */}
      {/* Left wing */}
      <mesh position={[-3.0, 2.8, -0.6]} receiveShadow>
        <boxGeometry args={[3.6, 5.6, 0.6]} />
        <meshStandardMaterial map={limestoneTexture} roughness={0.8} />
      </mesh>
      {/* Right wing */}
      <mesh position={[3.0, 2.8, -0.6]} receiveShadow>
        <boxGeometry args={[3.6, 5.6, 0.6]} />
        <meshStandardMaterial map={limestoneTexture} roughness={0.8} />
      </mesh>
      {/* Header above door */}
      <mesh position={[0, 4.6, -0.6]} receiveShadow>
        <boxGeometry args={[2.4, 2.0, 0.6]} />
        <meshStandardMaterial map={limestoneTexture} roughness={0.8} />
      </mesh>

      {/* 4. Neoclassical Pilasters / Columns flanking door */}
      <mesh position={[-1.35, 2.3, -0.2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.22, 4.6, 16]} />
        <meshStandardMaterial color="#E6E0D4" roughness={0.6} />
      </mesh>
      <mesh position={[1.35, 2.3, -0.2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.22, 4.6, 16]} />
        <meshStandardMaterial color="#E6E0D4" roughness={0.6} />
      </mesh>

      {/* 5. Entablature with sign "Our Museum" */}
      <mesh position={[0, 4.8, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.6, 0.4]} />
        <meshStandardMaterial color="#EDE7DB" roughness={0.5} />
      </mesh>

      {/* 6. Tall Double Wooden Doors with Ring Pulls */}
      {/* Door Frame */}
      <mesh position={[0, 2.1, -0.6]}>
        <boxGeometry args={[2.0, 3.4, 0.1]} />
        <meshStandardMaterial color="#1E1612" roughness={0.9} />
      </mesh>

      {/* Left Door with Hinge Pivot at x = -0.9 */}
      <group position={[-0.9, 2.1, -0.55]} rotation={[0, leftDoorAngle, 0]}>
        <mesh position={[0.45, 0, 0]} castShadow>
          <boxGeometry args={[0.9, 3.2, 0.08]} />
          <meshStandardMaterial color="#6B4E31" roughness={0.6} />
        </mesh>
        {/* Brass Ring Pull */}
        <mesh position={[0.78, 0, 0.05]}>
          <torusGeometry args={[0.06, 0.015, 12, 24]} />
          <meshStandardMaterial color="#C8B98A" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Right Door with Hinge Pivot at x = 0.9 */}
      <group position={[0.9, 2.1, -0.55]} rotation={[0, rightDoorAngle, 0]}>
        <mesh position={[-0.45, 0, 0]} castShadow>
          <boxGeometry args={[0.9, 3.2, 0.08]} />
          <meshStandardMaterial color="#6B4E31" roughness={0.6} />
        </mesh>
        {/* Brass Ring Pull */}
        <mesh position={[-0.78, 0, 0.05]}>
          <torusGeometry args={[0.06, 0.015, 12, 24]} />
          <meshStandardMaterial color="#C8B98A" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};
