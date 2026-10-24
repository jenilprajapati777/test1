import { describe, it, expect } from "vitest";
import {
  AABB,
  resolveCircleAABB,
  moveWithCollision,
  isIntersecting,
} from "../../src/lib/collision";

describe("Test 10: Circle-vs-AABB Collision & Continuous Sliding Resolution", () => {
  it("correctly pushes circle outside of an AABB with slide-along resolution", () => {
    const box: AABB = { minX: -2, minZ: -2, maxX: 2, maxZ: 2 };
    const radius = 0.3;

    // Moving into the right edge
    const insidePos = { x: 2.1, z: 0 };
    const res = resolveCircleAABB(insidePos, radius, box);
    expect(res.collided).toBe(true);
    expect(res.pos.x).toBeCloseTo(2.3, 3);
    expect(res.pos.z).toBeCloseTo(0, 3);
  });

  it("guarantees no tunnelling at run speed over 10,000 random movement steps", () => {
    const colliders: AABB[] = [
      { minX: -5, minZ: -5, maxX: -3, maxZ: 5, id: "west-wall" },
      { minX: 3, minZ: -5, maxX: 5, maxZ: 5, id: "east-wall" },
      { minX: -1, minZ: -1, maxX: 1, maxZ: 1, id: "feature-wall" },
      { minX: -0.5, minZ: 2, maxX: 0.5, maxZ: 3, id: "pedestal" },
    ];

    const bounds = { minX: -6, minZ: -6, maxX: 6, maxZ: 6 };
    const radius = 0.3;
    const runSpeed = 3.2; // m/s
    const dt = 0.1; // 100ms delta
    const maxStep = runSpeed * dt; // 0.32m per step

    // Start in open space
    let current = { x: 0, z: -3 };

    // PRNG for deterministic test
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let step = 0; step < 10000; step++) {
      const angle = rand() * Math.PI * 2;
      const speed = rand() * maxStep;
      const delta = {
        x: Math.cos(angle) * speed,
        z: Math.sin(angle) * speed,
      };

      current = moveWithCollision(current, delta, radius, colliders, bounds);

      // Verify that after resolution, the avatar circle NEVER intersects any box
      const penetrated = isIntersecting(current, radius, colliders);
      if (penetrated) {
        throw new Error(
          `Tunnelling detected at step ${step}: pos=(${current.x.toFixed(3)}, ${current.z.toFixed(3)})`,
        );
      }
      expect(penetrated).toBe(false);
    }
  });
});
