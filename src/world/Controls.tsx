import { useEffect, useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { moveWithCollision } from "../lib/collision";
import { PlacedArtwork, RoomPlan } from "../lib/layout";

export interface InteractionTarget {
  type: "plaque" | "artwork" | "bench" | "screen";
  id: string;
  name: string;
  position: [number, number, number];
  artwork?: PlacedArtwork;
  seatIndex?: number;
}

interface ControlsProps {
  plan: RoomPlan;
  avatarPos: { x: number; y: number; z: number; ry: number };
  onMove: (pos: {
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
  onOrbitChange: (yaw: number, pitch: number, zoom: number) => void;
  isLocked?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  plan,
  avatarPos,
  onMove,
  onNearTargetChange,
  onTriggerInteract,
  onEmote,
  onOrbitChange,
  isLocked = false,
}) => {
  const keys = useRef<Record<string, boolean>>({});
  const isDragging = useRef(false);
  const lastMouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const orbitYaw = useRef(0);
  const orbitPitch = useRef(0.1);
  const zoomDist = useRef(3.2);
  const clickTarget = useRef<{ x: number; z: number } | null>(null);

  const [nearestTarget, setNearestTarget] = useState<InteractionTarget | null>(
    null,
  );

  // Compute interactable targets
  const targets = useRef<InteractionTarget[]>([]);
  useEffect(() => {
    const list: InteractionTarget[] = [];
    // Plaque on pedestal
    list.push({
      type: "plaque",
      id: "plaque-pedestal",
      name: "Dedication Plaque",
      position: plan.pedestal.plaquePosition,
    });
    // Each artwork
    for (const a of plan.artworks) {
      list.push({
        type: "artwork",
        id: a.artwork.id || `art-${a.index}`,
        name: a.artwork.title || `Memory #${a.index + 1}`,
        position: a.position,
        artwork: a,
      });
    }
    // Bench seats
    if (plan.cinemaNook.present) {
      list.push({
        type: "bench",
        id: "bench-seat-0",
        name: "Sit on Bench (Left)",
        position: [
          plan.cinemaNook.seats[0].x,
          0.35,
          plan.cinemaNook.seats[0].z,
        ],
        seatIndex: 0,
      });
      list.push({
        type: "bench",
        id: "bench-seat-1",
        name: "Sit on Bench (Right)",
        position: [
          plan.cinemaNook.seats[1].x,
          0.35,
          plan.cinemaNook.seats[1].z,
        ],
        seatIndex: 1,
      });
    }
    targets.current = list;
  }, [plan]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))
        return;
      keys.current[e.key.toLowerCase()] = true;
      if (e.key === "Shift") keys.current["shift"] = true;

      // Key 1-4 Emotes
      if (e.key === "1") onEmote("wave");
      if (e.key === "2") onEmote("dance");
      if (e.key === "3") onEmote("clap");
      if (e.key === "4") onEmote("heart");

      // Key E Interact
      if (e.key.toLowerCase() === "e" && nearestTarget && !isLocked) {
        onTriggerInteract(nearestTarget);
      }

      // Any movement key cancels click-to-walk
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(e.key.toLowerCase())
      ) {
        clickTarget.current = null;
      }
    },
    [nearestTarget, isLocked, onEmote, onTriggerInteract],
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keys.current[e.key.toLowerCase()] = false;
    if (e.key === "Shift") keys.current["shift"] = false;
  }, []);

  // Pointer drag for orbit and zoom
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      // Right click or left click drag on empty space
      if (e.button === 0 || e.button === 2) {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      orbitYaw.current += dx * 0.005;
      orbitPitch.current += dy * 0.005;
      onOrbitChange(orbitYaw.current, orbitPitch.current, zoomDist.current);
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      zoomDist.current = Math.max(
        2.0,
        Math.min(5.0, zoomDist.current + e.deltaY * 0.002),
      );
      onOrbitChange(orbitYaw.current, orbitPitch.current, zoomDist.current);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("wheel", onWheel);
    };
  }, [handleKeyDown, handleKeyUp, onOrbitChange]);

  // Frame update: movement calculation and interaction distance checking
  useFrame((_, delta) => {
    if (isLocked) return;

    let inputX = 0;
    let inputZ = 0;
    const isRunning = Boolean(keys.current["shift"]);
    const speed = isRunning ? 3.2 : 1.6;

    if (keys.current["w"] || keys.current["arrowup"]) inputZ += 1;
    if (keys.current["s"] || keys.current["arrowdown"]) inputZ -= 1;
    if (keys.current["a"] || keys.current["arrowleft"]) inputX -= 1;
    if (keys.current["d"] || keys.current["arrowright"]) inputX += 1;

    let moveDelta = { x: 0, z: 0 };
    let isMoving = false;
    let targetYaw = avatarPos.ry;

    if (inputX !== 0 || inputZ !== 0) {
      // Move relative to camera yaw
      const len = Math.hypot(inputX, inputZ);
      const normX = inputX / len;
      const normZ = inputZ / len;

      const camYaw = avatarPos.ry + orbitYaw.current;
      const forwardX = Math.sin(camYaw);
      const forwardZ = Math.cos(camYaw);
      const rightX = Math.cos(camYaw);
      const rightZ = -Math.sin(camYaw);

      const worldDirX = rightX * normX + forwardX * normZ;
      const worldDirZ = rightZ * normX + forwardZ * normZ;

      moveDelta = {
        x: worldDirX * speed * delta,
        z: worldDirZ * speed * delta,
      };

      targetYaw = Math.atan2(worldDirX, worldDirZ);
      isMoving = true;
    } else if (clickTarget.current) {
      // Click-to-walk navigation
      const dx = clickTarget.current.x - avatarPos.x;
      const dz = clickTarget.current.z - avatarPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.1) {
        const step = Math.min(dist, speed * delta);
        moveDelta = {
          x: (dx / dist) * step,
          z: (dz / dist) * step,
        };
        targetYaw = Math.atan2(dx, dz);
        isMoving = true;
      } else {
        clickTarget.current = null;
      }
    }

    if (isMoving) {
      const radius = 0.3; // Avatar collider radius
      const bounds = {
        minX: -plan.width / 2,
        minZ: -plan.length / 2,
        maxX: plan.width / 2,
        maxZ: plan.length / 2,
      };

      const resolved = moveWithCollision(
        { x: avatarPos.x, z: avatarPos.z },
        moveDelta,
        radius,
        plan.colliders,
        bounds,
      );

      onMove({
        x: resolved.x,
        y: 0,
        z: resolved.z,
        ry: targetYaw,
        isMoving: true,
        isRunning,
      });
    } else {
      onMove({
        ...avatarPos,
        isMoving: false,
        isRunning: false,
      });
    }

    // 2. Check nearest interaction target (radius <= 2.2m)
    let closest: InteractionTarget | null = null;
    let minDist = 2.2;

    for (const t of targets.current) {
      const d = Math.hypot(
        t.position[0] - avatarPos.x,
        t.position[2] - avatarPos.z,
      );
      if (d < minDist) {
        minDist = d;
        closest = t;
      }
    }

    if (closest?.id !== nearestTarget?.id) {
      setNearestTarget(closest);
      onNearTargetChange(closest);
    }
  });

  return null;
};
