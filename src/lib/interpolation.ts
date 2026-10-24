/**
 * Interpolation buffer for smoothing networked avatar movement packets.
 * - Buffers packets with a configured target delay (default 100ms)
 * - Drops out-of-order packets (t <= lastPacketTs)
 * - Smoothly interpolates position (linear/Hermite) and yaw (shortest angular path)
 * - Clamps interpolated position to room bounds
 */

export interface PositionPacket {
  ts: number;
  x: number;
  z: number;
  rotY: number;
}

export interface RoomBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Shortest angular distance lerp between two radians
 */
export function lerpAngle(a: number, b: number, t: number): number {
  let diff = (b - a) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return a + diff * t;
}

export class InterpolationBuffer {
  private packets: PositionPacket[] = [];
  private lastPacketTs = -Infinity;
  private readonly bufferDelayMs: number;
  private readonly bounds?: RoomBounds;

  constructor(bufferDelayMs = 100, bounds?: RoomBounds) {
    this.bufferDelayMs = bufferDelayMs;
    this.bounds = bounds;
  }

  /**
   * Pushes a new position packet.
   * Returns true if accepted, false if dropped (e.g. out of order).
   */
  public addPacket(packet: PositionPacket): boolean {
    if (packet.ts <= this.lastPacketTs) {
      // Out-of-order or duplicate timestamp -> drop
      return false;
    }

    this.lastPacketTs = packet.ts;
    this.packets.push(packet);

    // Keep buffer bounded (retain at most 50 recent packets)
    if (this.packets.length > 50) {
      this.packets.shift();
    }

    return true;
  }

  /**
   * Samples the interpolated state at current playback time.
   * Playback time is typically `currentTime - bufferDelayMs`.
   */
  public sample(
    currentTime: number,
  ): { x: number; z: number; rotY: number } | null {
    if (this.packets.length === 0) return null;

    const renderTime = currentTime - this.bufferDelayMs;

    // Remove old packets that are older than renderTime, keeping at least 2 for interpolation
    while (this.packets.length > 2 && this.packets[1].ts <= renderTime) {
      this.packets.shift();
    }

    let result: { x: number; z: number; rotY: number };

    // If renderTime is before the earliest packet, clamp to earliest packet
    if (renderTime <= this.packets[0].ts) {
      result = {
        x: this.packets[0].x,
        z: this.packets[0].z,
        rotY: this.packets[0].rotY,
      };
    }
    // If renderTime is after the latest packet, extrapolate/hold latest packet
    else if (renderTime >= this.packets[this.packets.length - 1].ts) {
      const latest = this.packets[this.packets.length - 1];
      result = {
        x: latest.x,
        z: latest.z,
        rotY: latest.rotY,
      };
    }
    // Interpolate between the two bounding packets
    else {
      let p0 = this.packets[0];
      let p1 = this.packets[1];

      for (let i = 0; i < this.packets.length - 1; i++) {
        if (
          this.packets[i].ts <= renderTime &&
          this.packets[i + 1].ts >= renderTime
        ) {
          p0 = this.packets[i];
          p1 = this.packets[i + 1];
          break;
        }
      }

      const duration = p1.ts - p0.ts;
      const t =
        duration > 0
          ? Math.max(0, Math.min(1, (renderTime - p0.ts) / duration))
          : 0;

      result = {
        x: p0.x + (p1.x - p0.x) * t,
        z: p0.z + (p1.z - p0.z) * t,
        rotY: lerpAngle(p0.rotY, p1.rotY, t),
      };
    }

    // Clamp to room bounds if specified
    if (this.bounds) {
      result.x = Math.max(
        this.bounds.minX,
        Math.min(this.bounds.maxX, result.x),
      );
      result.z = Math.max(
        this.bounds.minZ,
        Math.min(this.bounds.maxZ, result.z),
      );
    }

    return result;
  }

  public clear(): void {
    this.packets = [];
    this.lastPacketTs = -Infinity;
  }

  public get packetCount(): number {
    return this.packets.length;
  }
}
