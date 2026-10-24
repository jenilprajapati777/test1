import { describe, it, expect } from "vitest";
import { InterpolationBuffer, lerpAngle } from "../../src/lib/interpolation";

describe("Test 8: Interpolation Buffer", () => {
  it("smooths 100ms packet jitter and produces continuous movement", () => {
    const buffer = new InterpolationBuffer(100);

    // Feed packets spaced by ~66ms (15 Hz) with +/- 20ms jitter
    // Walking forward at 2.0 m/s along Z axis
    const startTime = 1000;
    for (let i = 0; i <= 20; i++) {
      const idealT = startTime + i * 66;
      const jitter = Math.sin(i) * 20;
      const packetTs = idealT + jitter;
      const z = (packetTs - startTime) * 0.002; // 2 m/s

      buffer.addPacket({
        ts: packetTs,
        x: 0,
        z,
        rotY: 0,
      });
    }

    // Sample across a 1-second continuous timeline in 16ms (60 FPS) steps
    let prevSample: { x: number; z: number; rotY: number } | null = null;
    let maxDeltaZ = 0;

    for (
      let sampleTime = startTime + 150;
      sampleTime <= startTime + 1100;
      sampleTime += 16
    ) {
      const sample = buffer.sample(sampleTime);
      expect(sample).not.toBeNull();

      if (prevSample && sample) {
        const deltaZ = Math.abs(sample.z - prevSample.z);
        if (deltaZ > maxDeltaZ) maxDeltaZ = deltaZ;
        // At 3.2 m/s maximum sprint speed, in 16ms max distance is 3.2 * 0.016 = 0.0512 m.
        // Teleport threshold is 0.5m. It should be well below 0.5m.
        expect(deltaZ).toBeLessThan(0.5);
      }
      prevSample = sample;
    }

    expect(maxDeltaZ).toBeGreaterThan(0);
    expect(maxDeltaZ).toBeLessThan(0.1);
  });

  it("discards out-of-order packets (t <= lastPacketTs)", () => {
    const buffer = new InterpolationBuffer(100);

    const p1 = buffer.addPacket({ ts: 1000, x: 0, z: 1, rotY: 0 });
    expect(p1).toBe(true);

    const p2 = buffer.addPacket({ ts: 1066, x: 0, z: 2, rotY: 0 });
    expect(p2).toBe(true);

    // Out-of-order packet (timestamp 1040 is earlier than 1066)
    const pOut = buffer.addPacket({ ts: 1040, x: 0, z: 1.5, rotY: 0 });
    expect(pOut).toBe(false);

    // Duplicate timestamp packet
    const pDup = buffer.addPacket({ ts: 1066, x: 0, z: 2, rotY: 0 });
    expect(pDup).toBe(false);

    // In-order packet succeeds
    const p3 = buffer.addPacket({ ts: 1133, x: 0, z: 3, rotY: 0 });
    expect(p3).toBe(true);
  });

  it("clamps interpolated output to room bounds", () => {
    const bounds = { minX: -5, maxX: 5, minZ: -10, maxZ: 10 };
    const buffer = new InterpolationBuffer(100, bounds);

    // Feed packets that stray outside bounds
    buffer.addPacket({ ts: 1000, x: 4, z: 8, rotY: 0 });
    buffer.addPacket({ ts: 1100, x: 8, z: 15, rotY: 0 }); // Beyond bounds

    const sample = buffer.sample(1150);
    expect(sample).not.toBeNull();
    if (sample) {
      expect(sample.x).toBeLessThanOrEqual(bounds.maxX);
      expect(sample.x).toBeGreaterThanOrEqual(bounds.minX);
      expect(sample.z).toBeLessThanOrEqual(bounds.maxZ);
      expect(sample.z).toBeGreaterThanOrEqual(bounds.minZ);
    }
  });

  it("smoothly interpolates angles across the -PI / +PI boundary", () => {
    // Rotating from 3.10 rad to -3.10 rad (shortest path is ~0.16 rad across +/- PI)
    const angle = lerpAngle(3.1, -3.1, 0.5);
    // Midpoint across the boundary is either PI or -PI
    expect(Math.abs(Math.abs(angle) - Math.PI)).toBeLessThan(0.1);
  });
});
