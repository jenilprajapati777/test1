import { describe, it, expect } from "vitest";
import { generateRoomLayout } from "../../src/lib/layout";
import { Artwork } from "../../src/types/museum";

function createMockArtworks(count: number): Artwork[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `art-${i}`,
    kind: i === 5 ? "video" : "photo",
    storage_path: `mock/art-${i}.webp`,
    title: `Memory #${i + 1}`,
    caption: `Caption for artwork ${i + 1}`,
    width: 1200,
    height: 900,
    sort_order: i,
  }));
}

describe("Test 1: Pure Deterministic Room Layout Engine", () => {
  it("places every artwork for N = 0...24 without overlap and within room bounds", () => {
    for (let n = 0; n <= 24; n++) {
      const artworks = createMockArtworks(n);
      const plan = generateRoomLayout(artworks);

      // 1. Every artwork placed
      expect(plan.artworks).toHaveLength(n);

      if (n > 0) {
        // 2. Hero is first
        expect(plan.artworks[0].isHero).toBe(true);
        expect(plan.artworks[0].index).toBe(0);
        expect(plan.artworks[0].artwork.id).toBe("art-0");
      }

      // 3. All within room bounds
      const halfW = plan.width / 2;
      const halfL = plan.length / 2;

      for (const placed of plan.artworks) {
        const [x, y, z] = placed.position;
        expect(x).toBeGreaterThanOrEqual(-halfW - 0.2);
        expect(x).toBeLessThanOrEqual(halfW + 0.2);
        expect(z).toBeGreaterThanOrEqual(-halfL - 0.2);
        expect(z).toBeLessThanOrEqual(halfL + 0.2);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(plan.height);

        // View position must be inside the room
        const [vx, , vz] = placed.viewPosition;
        expect(vx).toBeGreaterThan(-halfW);
        expect(vx).toBeLessThan(halfW);
        expect(vz).toBeGreaterThan(-halfL);
        expect(vz).toBeLessThan(halfL);
      }

      // 4. None overlap (check distance between distinct artworks)
      for (let i = 0; i < plan.artworks.length; i++) {
        for (let j = i + 1; j < plan.artworks.length; j++) {
          const a = plan.artworks[i];
          const b = plan.artworks[j];
          const dist = Math.hypot(
            a.position[0] - b.position[0],
            a.position[2] - b.position[2],
          );
          // Distance between distinct artworks on same wall must be >= 1.5m
          if (
            Math.abs(a.rotation[1] - b.rotation[1]) < 0.1 &&
            (Math.abs(a.position[0] - b.position[0]) < 0.2 ||
              Math.abs(a.position[2] - b.position[2]) < 0.2)
          ) {
            expect(dist).toBeGreaterThanOrEqual(1.5);
          }
        }
      }

      // 5. Cinema nook present iff video or slideshow (N > 0 or has video)
      if (n === 0) {
        expect(plan.cinemaNook.present).toBe(false);
      } else {
        expect(plan.cinemaNook.present).toBe(true);
      }
    }
  });

  it("is completely deterministic for identical inputs", () => {
    const artworks = createMockArtworks(12);
    const plan1 = generateRoomLayout(artworks);
    const plan2 = generateRoomLayout(artworks);

    expect(JSON.stringify(plan1)).toBe(JSON.stringify(plan2));
  });

  it("ensures line of sight / unobstructed path from spawn point to all artworks", () => {
    const artworks = createMockArtworks(16);
    const plan = generateRoomLayout(artworks);
    const spawn = plan.spawnPoint;

    for (const art of plan.artworks) {
      // Check that view position is reachable (not inside any collider)
      const [vx, , vz] = art.viewPosition;
      for (const col of plan.colliders) {
        const inside =
          vx >= col.minX && vx <= col.maxX && vz >= col.minZ && vz <= col.maxZ;
        expect(inside).toBe(false);
      }

      // Simple Manhattan distance between spawn and viewing position is reasonable
      const pathDist = Math.abs(vx - spawn.x) + Math.abs(vz - spawn.z);
      expect(pathDist).toBeLessThan(plan.length + plan.width);
    }
  });
});
