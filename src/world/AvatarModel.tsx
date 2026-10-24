import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AvatarConfig, AvatarAnimState, SKIN_TONES } from '../types/avatar';
import { getToonGradientMap } from './materials';

interface AvatarModelProps {
  config: AvatarConfig;
  animState: AvatarAnimState;
  position?: [number, number, number];
  rotation?: [number, number, number];
  isMirroredDance?: boolean;
}

export const AvatarModel: React.FC<AvatarModelProps> = ({
  config,
  animState,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isMirroredDance = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const hipsRef = useRef<THREE.Group>(null);
  const spineRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftShinRef = useRef<THREE.Group>(null);
  const rightShinRef = useRef<THREE.Group>(null);

  // Gradient map for toon shading
  const gradientMap = useMemo(() => getToonGradientMap(), []);

  // Resolve skin color
  const skinColor = useMemo(() => {
    if (config.skin === 'original') return '#FCD8C5';
    const match = SKIN_TONES.find((s) => s.value === config.skin);
    return match ? match.color : config.skin || '#FCD8C5';
  }, [config.skin]);

  // Animation cross-fade weights
  const currentWeights = useRef<Record<string, number>>({
    idle: 1,
    walk: 0,
    run: 0,
    sit: 0,
    wave: 0,
    clap: 0,
    dance: 0,
    'look-at-art': 0,
  });

  useFrame((_, delta) => {
    const weights = currentWeights.current;
    const fadeSpeed = Math.min(1.0, delta / 0.15); // 150ms cross-fade

    for (const key of Object.keys(weights)) {
      const target = key === animState ? 1.0 : 0.0;
      weights[key] = THREE.MathUtils.lerp(weights[key], target, fadeSpeed);
    }

    const time = performance.now() * 0.001;

    // Reset procedural bones
    if (!hipsRef.current || !spineRef.current || !headRef.current) return;

    let hipY = 0.9;
    let hipRotX = 0;
    let spineRotX = 0;
    let spineRotY = 0;
    let headRotX = 0;
    let headRotY = 0;
    let lArmRotX = 0;
    let lArmRotZ = 0.1;
    let rArmRotX = 0;
    let rArmRotZ = -0.1;
    let lForearmRotX = 0;
    let rForearmRotX = 0;
    let lLegRotX = 0;
    let rLegRotX = 0;
    let lShinRotX = 0;
    let rShinRotX = 0;

    // 1. Idle animation
    if (weights.idle > 0.001) {
      const w = weights.idle;
      const breath = Math.sin(time * 2.0);
      hipY += breath * 0.015 * w;
      spineRotX += breath * 0.02 * w;
      headRotX += Math.sin(time * 1.5) * 0.03 * w;
      lArmRotZ += (0.15 + breath * 0.02) * w;
      rArmRotZ += (-0.15 - breath * 0.02) * w;
    }

    // 2. Walk animation (~1.8 Hz)
    if (weights.walk > 0.001) {
      const w = weights.walk;
      const phase = time * 7.5;
      const stride = Math.sin(phase) * 0.55 * w;
      const bob = Math.abs(Math.sin(phase * 2)) * 0.04 * w;

      hipY -= bob;
      lLegRotX += stride;
      rLegRotX -= stride;
      lShinRotX += Math.max(0, -stride * 0.8);
      rShinRotX += Math.max(0, stride * 0.8);

      // Counter arm swing
      rArmRotX += stride * 0.7;
      lArmRotX -= stride * 0.7;
    }

    // 3. Run animation (~2.8 Hz)
    if (weights.run > 0.001) {
      const w = weights.run;
      const phase = time * 12.0;
      const stride = Math.sin(phase) * 0.85 * w;
      const bob = Math.abs(Math.sin(phase * 2)) * 0.08 * w;

      hipY -= bob;
      spineRotX += 0.15 * w; // Lean forward
      lLegRotX += stride;
      rLegRotX -= stride;
      lShinRotX += Math.max(0, -stride * 1.2);
      rShinRotX += Math.max(0, stride * 1.2);

      rArmRotX += stride * 1.1;
      lArmRotX -= stride * 1.1;
      rForearmRotX -= 0.6 * w;
      lForearmRotX -= 0.6 * w;
    }

    // 4. Sit animation
    if (weights.sit > 0.001) {
      const w = weights.sit;
      hipY = THREE.MathUtils.lerp(hipY, 0.45, w);
      hipRotX = THREE.MathUtils.lerp(hipRotX, 0, w);
      lLegRotX = THREE.MathUtils.lerp(lLegRotX, -Math.PI / 2, w);
      rLegRotX = THREE.MathUtils.lerp(rLegRotX, -Math.PI / 2, w);
      lShinRotX = THREE.MathUtils.lerp(lShinRotX, Math.PI / 2, w);
      rShinRotX = THREE.MathUtils.lerp(rShinRotX, Math.PI / 2, w);
      lArmRotX = THREE.MathUtils.lerp(lArmRotX, -0.4, w);
      rArmRotX = THREE.MathUtils.lerp(rArmRotX, -0.4, w);
      lForearmRotX = THREE.MathUtils.lerp(lForearmRotX, -0.5, w);
      rForearmRotX = THREE.MathUtils.lerp(rForearmRotX, -0.5, w);
    }

    // 5. Wave animation
    if (weights.wave > 0.001) {
      const w = weights.wave;
      const wavePhase = Math.sin(time * 8.0);
      rArmRotX = THREE.MathUtils.lerp(rArmRotX, -Math.PI * 0.85, w);
      rArmRotZ = THREE.MathUtils.lerp(rArmRotZ, -0.4 + wavePhase * 0.35, w);
      rForearmRotX = THREE.MathUtils.lerp(rForearmRotX, -0.4, w);
    }

    // 6. Clap animation
    if (weights.clap > 0.001) {
      const w = weights.clap;
      const clapPhase = Math.abs(Math.sin(time * 9.0));
      lArmRotX = THREE.MathUtils.lerp(lArmRotX, -Math.PI * 0.5, w);
      rArmRotX = THREE.MathUtils.lerp(rArmRotX, -Math.PI * 0.5, w);
      lArmRotZ = THREE.MathUtils.lerp(lArmRotZ, 0.45 - clapPhase * 0.3, w);
      rArmRotZ = THREE.MathUtils.lerp(rArmRotZ, -0.45 + clapPhase * 0.3, w);
    }

    // 7. Dance animation (A or Mirrored B)
    if (weights.dance > 0.001) {
      const w = weights.dance;
      const danceDir = isMirroredDance ? -1 : 1;
      const dancePhase = time * 5.0;
      const sway = Math.sin(dancePhase) * 0.25 * danceDir;
      const step = Math.sin(dancePhase * 0.5) * 0.2 * danceDir;

      spineRotY += sway * 0.6 * w;
      spineRotX += Math.abs(sway) * 0.1 * w;
      lLegRotX += step * w;
      rLegRotX -= step * w;

      lArmRotX = THREE.MathUtils.lerp(lArmRotX, -Math.PI * 0.6 + sway * 0.4, w);
      rArmRotX = THREE.MathUtils.lerp(rArmRotX, -Math.PI * 0.6 - sway * 0.4, w);
      lArmRotZ = THREE.MathUtils.lerp(lArmRotZ, 0.6 + sway * 0.3, w);
      rArmRotZ = THREE.MathUtils.lerp(rArmRotZ, -0.6 + sway * 0.3, w);
    }

    // 8. Look at art
    if (weights['look-at-art'] > 0.001) {
      const w = weights['look-at-art'];
      headRotX = THREE.MathUtils.lerp(headRotX, -0.35, w); // look up
      rArmRotX = THREE.MathUtils.lerp(rArmRotX, -Math.PI * 0.4, w);
      rForearmRotX = THREE.MathUtils.lerp(rForearmRotX, -1.2, w); // hand to chin
    }

    // Apply rotations
    hipsRef.current.position.y = hipY;
    hipsRef.current.rotation.x = hipRotX;
    spineRef.current.rotation.x = spineRotX;
    spineRef.current.rotation.y = spineRotY;
    headRef.current.rotation.x = headRotX;
    headRef.current.rotation.y = headRotY;

    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = lArmRotX;
      leftArmRef.current.rotation.z = lArmRotZ;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = rArmRotX;
      rightArmRef.current.rotation.z = rArmRotZ;
    }
    if (leftForearmRef.current) leftForearmRef.current.rotation.x = lForearmRotX;
    if (rightForearmRef.current) rightForearmRef.current.rotation.x = rForearmRotX;

    if (leftLegRef.current) leftLegRef.current.rotation.x = lLegRotX;
    if (rightLegRef.current) rightLegRef.current.rotation.x = rLegRotX;
    if (leftShinRef.current) leftShinRef.current.rotation.x = lShinRotX;
    if (rightShinRef.current) rightShinRef.current.rotation.x = rShinRotX;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Blob shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.32, 16]} />
        <meshBasicMaterial color="#000000" opacity={0.3} transparent />
      </mesh>

      {/* Root Hips */}
      <group ref={hipsRef} position={[0, 0.9, 0]}>
        {/* Pelvis / Bottom */}
        <mesh castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshToonMaterial
            color={config.bottomColor}
            gradientMap={gradientMap}
          />
        </mesh>

        {/* Belt extra */}
        {config.extras.includes('belt') && (
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.185, 0.185, 0.04, 16]} />
            <meshStandardMaterial color="#3D2B1F" roughness={0.4} />
          </mesh>
        )}

        {/* Spine / Torso */}
        <group ref={spineRef} position={[0, 0.12, 0]}>
          {/* Upper Body (Top Clothing) */}
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.14, 0.32, 16]} />
            <meshToonMaterial
              color={config.topColor}
              gradientMap={gradientMap}
            />
          </mesh>

          {/* Vest overlay if top is vest-shirt */}
          {config.top === 'vest-shirt' && (
            <mesh position={[0, 0.16, 0]}>
              <cylinderGeometry args={[0.168, 0.148, 0.28, 16]} />
              <meshToonMaterial color="#111215" gradientMap={gradientMap} />
            </mesh>
          )}

          {/* Neck & Head Group */}
          <group ref={headRef} position={[0, 0.36, 0]}>
            {/* Neck */}
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.06, 0.07, 0.08, 12]} />
              <meshToonMaterial color={skinColor} gradientMap={gradientMap} />
            </mesh>

            {/* Head (Anime proportions, radius 0.16) */}
            <mesh position={[0, 0.18, 0]} castShadow>
              <sphereGeometry args={[0.16, 20, 20]} />
              <meshToonMaterial color={skinColor} gradientMap={gradientMap} />
            </mesh>

            {/* Stylised Anime Eyes */}
            <mesh position={[-0.055, 0.18, 0.145]}>
              <capsuleGeometry args={[0.02, 0.03, 4, 8]} />
              <meshBasicMaterial color="#1A1816" />
            </mesh>
            <mesh position={[0.055, 0.18, 0.145]}>
              <capsuleGeometry args={[0.02, 0.03, 4, 8]} />
              <meshBasicMaterial color="#1A1816" />
            </mesh>

            {/* Blush accents */}
            <mesh position={[-0.08, 0.14, 0.135]}>
              <circleGeometry args={[0.022, 8]} />
              <meshBasicMaterial color="#FF9EAA" opacity={0.6} transparent />
            </mesh>
            <mesh position={[0.08, 0.14, 0.135]}>
              <circleGeometry args={[0.022, 8]} />
              <meshBasicMaterial color="#FF9EAA" opacity={0.6} transparent />
            </mesh>

            {/* Hair Styles */}
            {config.hairStyle !== 'none' && (
              <group position={[0, 0.18, 0]}>
                {/* Hair Cap */}
                <mesh position={[0, 0.04, -0.02]} castShadow>
                  <sphereGeometry args={[0.175, 16, 16]} />
                  <meshToonMaterial
                    color={config.hairColor}
                    gradientMap={gradientMap}
                  />
                </mesh>

                {/* Long Hair Flow */}
                {config.hairStyle === 'long' && (
                  <mesh position={[0, -0.22, -0.1]} castShadow>
                    <boxGeometry args={[0.26, 0.44, 0.1]} />
                    <meshToonMaterial
                      color={config.hairColor}
                      gradientMap={gradientMap}
                    />
                  </mesh>
                )}

                {/* Curly Volume */}
                {config.hairStyle === 'curly' && (
                  <group position={[0, 0.06, 0]}>
                    <mesh position={[-0.1, 0.05, 0]}>
                      <sphereGeometry args={[0.08, 8, 8]} />
                      <meshToonMaterial
                        color={config.hairColor}
                        gradientMap={gradientMap}
                      />
                    </mesh>
                    <mesh position={[0.1, 0.05, 0]}>
                      <sphereGeometry args={[0.08, 8, 8]} />
                      <meshToonMaterial
                        color={config.hairColor}
                        gradientMap={gradientMap}
                      />
                    </mesh>
                    <mesh position={[0, 0.08, -0.06]}>
                      <sphereGeometry args={[0.09, 8, 8]} />
                      <meshToonMaterial
                        color={config.hairColor}
                        gradientMap={gradientMap}
                      />
                    </mesh>
                  </group>
                )}

                {/* Ponytail */}
                {config.hairStyle === 'ponytail' && (
                  <mesh position={[0, 0.1, -0.22]} rotation={[0.4, 0, 0]}>
                    <cylinderGeometry args={[0.04, 0.08, 0.35, 12]} />
                    <meshToonMaterial
                      color={config.hairColor}
                      gradientMap={gradientMap}
                    />
                  </mesh>
                )}

                {/* Top Bun */}
                {config.hairStyle === 'bun' && (
                  <mesh position={[0, 0.22, -0.04]}>
                    <sphereGeometry args={[0.08, 12, 12]} />
                    <meshToonMaterial
                      color={config.hairColor}
                      gradientMap={gradientMap}
                    />
                  </mesh>
                )}
              </group>
            )}

            {/* Extras: Glasses */}
            {config.extras.includes('glasses') && (
              <group position={[0, 0.18, 0.155]}>
                <mesh position={[-0.055, 0, 0]}>
                  <torusGeometry args={[0.03, 0.005, 8, 16]} />
                  <meshStandardMaterial color="#C8B98A" metalness={0.8} />
                </mesh>
                <mesh position={[0.055, 0, 0]}>
                  <torusGeometry args={[0.03, 0.005, 8, 16]} />
                  <meshStandardMaterial color="#C8B98A" metalness={0.8} />
                </mesh>
                {/* Bridge */}
                <mesh position={[0, 0.01, 0]}>
                  <boxGeometry args={[0.04, 0.005, 0.005]} />
                  <meshStandardMaterial color="#C8B98A" metalness={0.8} />
                </mesh>
              </group>
            )}
          </group>

          {/* Left Arm */}
          <group ref={leftArmRef} position={[-0.2, 0.26, 0]}>
            <mesh position={[0, -0.12, 0]} castShadow>
              <capsuleGeometry args={[0.045, 0.18, 4, 8]} />
              <meshToonMaterial
                color={config.topColor}
                gradientMap={gradientMap}
              />
            </mesh>
            <group ref={leftForearmRef} position={[0, -0.24, 0]}>
              <mesh position={[0, -0.1, 0]}>
                <capsuleGeometry args={[0.04, 0.16, 4, 8]} />
                <meshToonMaterial color={skinColor} gradientMap={gradientMap} />
              </mesh>
            </group>
          </group>

          {/* Right Arm */}
          <group ref={rightArmRef} position={[0.2, 0.26, 0]}>
            <mesh position={[0, -0.12, 0]} castShadow>
              <capsuleGeometry args={[0.045, 0.18, 4, 8]} />
              <meshToonMaterial
                color={config.topColor}
                gradientMap={gradientMap}
              />
            </mesh>
            <group ref={rightForearmRef} position={[0, -0.24, 0]}>
              <mesh position={[0, -0.1, 0]}>
                <capsuleGeometry args={[0.04, 0.16, 4, 8]} />
                <meshToonMaterial color={skinColor} gradientMap={gradientMap} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.1, -0.05, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
            <meshToonMaterial
              color={config.bottomColor}
              gradientMap={gradientMap}
            />
          </mesh>
          <group ref={leftShinRef} position={[0, -0.35, 0]}>
            <mesh position={[0, -0.18, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.3, 4, 8]} />
              <meshToonMaterial
                color={config.bottomColor}
                gradientMap={gradientMap}
              />
            </mesh>
            {/* Left Shoe */}
            <mesh position={[0, -0.36, 0.04]}>
              <boxGeometry args={[0.09, 0.08, 0.18]} />
              <meshToonMaterial
                color={config.shoesColor}
                gradientMap={gradientMap}
              />
            </mesh>
          </group>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.1, -0.05, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
            <meshToonMaterial
              color={config.bottomColor}
              gradientMap={gradientMap}
            />
          </mesh>
          <group ref={rightShinRef} position={[0, -0.35, 0]}>
            <mesh position={[0, -0.18, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.3, 4, 8]} />
              <meshToonMaterial
                color={config.bottomColor}
                gradientMap={gradientMap}
              />
            </mesh>
            {/* Right Shoe */}
            <mesh position={[0, -0.36, 0.04]}>
              <boxGeometry args={[0.09, 0.08, 0.18]} />
              <meshToonMaterial
                color={config.shoesColor}
                gradientMap={gradientMap}
              />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
