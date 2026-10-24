/**
 * Flood guard & schema validation for multiplayer network messages.
 * - Rate limits messages per peer (drops if > 30 msgs in 1000ms window)
 * - Validates schema (type, peer_id, ts, payload)
 * - Sanitizes and truncates chat/bubble messages to <= 120 characters
 */

import { z } from "zod";
import { sanitizeText } from "./sanitize";

export const NetworkMessageSchema = z.object({
  type: z.enum(["presence", "pos", "bubble", "emote", "sit", "leave"]),
  peer_id: z.string().min(1).max(64),
  ts: z.number(),
  payload: z.record(z.unknown()).default({}),
});

export type NetworkMessage = z.infer<typeof NetworkMessageSchema>;

export class FloodGuard {
  private peerTimestamps = new Map<string, number[]>();
  private readonly maxMsgsPerSec: number;
  private readonly windowMs: number;

  constructor(maxMsgsPerSec = 30, windowMs = 1000) {
    this.maxMsgsPerSec = maxMsgsPerSec;
    this.windowMs = windowMs;
  }

  /**
   * Checks if peer has exceeded message rate limit.
   * Returns true if allowed, false if rate limited (dropped).
   */
  public checkRateLimit(peerId: string, now = Date.now()): boolean {
    let timestamps = this.peerTimestamps.get(peerId);
    if (!timestamps) {
      timestamps = [];
      this.peerTimestamps.set(peerId, timestamps);
    }

    // Prune timestamps older than windowMs
    const cutoff = now - this.windowMs;
    const filtered = timestamps.filter((t) => t > cutoff);
    filtered.push(now);
    this.peerTimestamps.set(peerId, filtered);

    return filtered.length <= this.maxMsgsPerSec;
  }

  /**
   * Parses, validates, rate-limits, and sanitizes incoming message.
   * Returns sanitized NetworkMessage or null if invalid / rate-limited.
   */
  public processIncoming(
    raw: unknown,
    now = Date.now(),
  ): NetworkMessage | null {
    let data: unknown = raw;

    // If string, attempt JSON parse
    if (typeof raw === "string") {
      try {
        data = JSON.parse(raw);
      } catch {
        return null;
      }
    }

    // Schema validation
    const parsed = NetworkMessageSchema.safeParse(data);
    if (!parsed.success) {
      return null;
    }

    const msg = parsed.data;

    // Rate limit check per peer
    if (!this.checkRateLimit(msg.peer_id, now)) {
      return null;
    }

    // Sanitize bubble text if present
    if (
      msg.type === "bubble" ||
      (msg.payload && typeof msg.payload.text === "string")
    ) {
      const originalText = String(msg.payload.text ?? "");
      // Truncate to max 120 characters
      const sanitized = sanitizeText(originalText, 120);
      msg.payload = {
        ...msg.payload,
        text: sanitized,
      };
    }

    return msg;
  }

  /**
   * Resets rate limit tracker for a peer (e.g. on leave)
   */
  public clearPeer(peerId: string): void {
    this.peerTimestamps.delete(peerId);
  }

  public clearAll(): void {
    this.peerTimestamps.clear();
  }
}
