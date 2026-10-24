import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface CameraTarget {
  mode: "follow" | "viewing" | "bench";
  targetPos: [number, number, number];
  lookAtPos: [number, number, number];
  fov?: number;
}

interface CameraControllerProps {
  avatarPos: { x: number; y: number; z: number; ry: number };
  viewTarget: CameraTarget | null;
  orbitYaw: number;
  orbitPitch: number;
  zoomDist: number;
  reducedMotion?: boolean;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  avatarPos,
  viewTarget,
  orbitYaw,
  orbitPitch,
  zoomDist,
  reducedMotion = false,
}) => {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());

  // Initialize camera positions
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 55;
      camera.updateProjectionMatrix();
    }
    currentPos.current.set(
      avatarPos.x,
      avatarPos.y + 1.9,
      avatarPos.z - zoomDist,
    );
    currentLookAt.current.set(avatarPos.x, avatarPos.y + 1.4, avatarPos.z);
    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  }, [camera, avatarPos.x, avatarPos.y, avatarPos.z, zoomDist]);

  useFrame((_, delta) => {
    const pCamera = camera as THREE.PerspectiveCamera;
    const lerpSpeed = reducedMotion ? 1.0 : Math.min(1.0, delta * 6.0);

    if (viewTarget && viewTarget.mode === "viewing") {
      // 1. Viewing mode fly-in
      const [tx, ty, tz] = viewTarget.targetPos;
      const [lx, ly, lz] = viewTarget.lookAtPos;

      currentPos.current.lerp(new THREE.Vector3(tx, ty, tz), lerpSpeed);
      currentLookAt.current.lerp(new THREE.Vector3(lx, ly, lz), lerpSpeed);

      const targetFov = viewTarget.fov || 38;
      pCamera.fov = THREE.MathUtils.lerp(pCamera.fov, targetFov, lerpSpeed);
      pCamera.updateProjectionMatrix();
    } else if (viewTarget && viewTarget.mode === "bench") {
      // 2. Bench view (behind seated couple looking at cinema screen)
      const [tx, ty, tz] = viewTarget.targetPos;
      const [lx, ly, lz] = viewTarget.lookAtPos;

      currentPos.current.lerp(new THREE.Vector3(tx, ty, tz), lerpSpeed);
      currentLookAt.current.lerp(new THREE.Vector3(lx, ly, lz), lerpSpeed);

      pCamera.fov = THREE.MathUtils.lerp(pCamera.fov, 50, lerpSpeed);
      pCamera.updateProjectionMatrix();
    } else {
      // 3. Third-person follow camera
      // Avatar center & yaw
      const yaw = avatarPos.ry + orbitYaw;
      const pitch = THREE.MathUtils.clamp(
        orbitPitch,
        -10 * (Math.PI / 180),
        35 * (Math.PI / 180),
      );
      const dist = THREE.MathUtils.clamp(zoomDist, 2.0, 5.0);

      // Spherical offset behind avatar
      const heightOffset = 1.9 + Math.sin(pitch) * 0.8;
      const horizontalDist = dist * Math.cos(pitch);

      const desiredX = avatarPos.x - Math.sin(yaw) * horizontalDist;
      const desiredY = avatarPos.y + heightOffset;
      const desiredZ = avatarPos.z - Math.cos(yaw) * horizontalDist;

      // Look at upper torso/head
      const targetLookAt = new THREE.Vector3(
        avatarPos.x,
        avatarPos.y + 1.4,
        avatarPos.z,
      );

      currentPos.current.lerp(
        new THREE.Vector3(desiredX, desiredY, desiredZ),
        lerpSpeed,
      );
      currentLookAt.current.lerp(targetLookAt, lerpSpeed);

      pCamera.fov = THREE.MathUtils.lerp(pCamera.fov, 55, lerpSpeed);
      pCamera.updateProjectionMatrix();
    }

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
