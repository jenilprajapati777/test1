import React from "react";

interface BenchMeshProps {
  position: [number, number, number];
  onSit?: (seatIndex: number) => void;
}

export const BenchMesh: React.FC<BenchMeshProps> = ({ position, onSit }) => {
  return (
    <group position={position}>
      {/* Bench wooden seat plank */}
      <mesh
        position={[0, 0.22, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          // Pick left or right seat depending on click x
          const isLeft = e.point.x < position[0];
          onSit?.(isLeft ? 0 : 1);
        }}
      >
        <boxGeometry args={[1.8, 0.08, 0.6]} />
        <meshStandardMaterial color="#8A6A4A" roughness={0.6} />
      </mesh>

      {/* Bench legs (light stone/plinth #CBBFA6) */}
      <mesh position={[-0.7, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.2, 0.5]} />
        <meshStandardMaterial color="#CBBFA6" roughness={0.7} />
      </mesh>
      <mesh position={[0.7, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.2, 0.5]} />
        <meshStandardMaterial color="#CBBFA6" roughness={0.7} />
      </mesh>
    </group>
  );
};
