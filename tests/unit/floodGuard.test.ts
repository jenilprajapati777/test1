import { describe, it, expect } from "vitest";
import { FloodGuard } from "../../src/lib/floodGuard";

describe("Test 9: Flood Guard & Payload Sanitization", () => {
  it("drops messages when rate exceeds 30 msg/sec from a single peer", () => {
    const guard = new FloodGuard(30, 1000);
    const peerId = "peer_fast_sender";
    const baseTime = 10000;

    let acceptedCount = 0;
    let droppedCount = 0;

    // Attempt to send 50 messages within the same 1-second window
    for (let i = 0; i < 50; i++) {
      const msg = {
        type: "pos",
        peer_id: peerId,
        ts: baseTime + i * 10,
        payload: { x: i, z: i, rotY: 0 },
      };

      const result = guard.processIncoming(msg, baseTime + i * 10);
      if (result !== null) {
        acceptedCount++;
      } else {
        droppedCount++;
      }
    }

    expect(acceptedCount).toBe(30);
    expect(droppedCount).toBe(20);

    // After 1 second passes after the burst (last message was at baseTime + 490), peer can send messages again
    const laterTime = baseTime + 1600;
    const freshMsg = guard.processIncoming(
      {
        type: "pos",
        peer_id: peerId,
        ts: laterTime,
        payload: { x: 0, z: 0, rotY: 0 },
      },
      laterTime,
    );
    expect(freshMsg).not.toBeNull();
  });

  it("drops malformed JSON and invalid schemas without throwing", () => {
    const guard = new FloodGuard(30, 1000);

    // Malformed JSON strings
    expect(guard.processIncoming("{invalid_json: true")).toBeNull();
    expect(guard.processIncoming("")).toBeNull();
    expect(guard.processIncoming(12345)).toBeNull();
    expect(guard.processIncoming(null)).toBeNull();

    // Invalid schema (missing peer_id, bad type, missing ts)
    expect(
      guard.processIncoming({ type: "unknown_type", peer_id: "p1", ts: 1000 }),
    ).toBeNull();
    expect(guard.processIncoming({ type: "pos", ts: 1000 })).toBeNull();
    expect(
      guard.processIncoming({ type: "pos", peer_id: "", ts: 1000 }),
    ).toBeNull();
    expect(
      guard.processIncoming({ type: "pos", peer_id: "p1", ts: "not-a-number" }),
    ).toBeNull();
  });

  it("truncates chat / speech bubble messages > 120 characters and strips HTML", () => {
    const guard = new FloodGuard(30, 1000);

    const longMessage = "A".repeat(200);
    const incoming = {
      type: "bubble",
      peer_id: "peer_chatty",
      ts: 2000,
      payload: {
        text: `<script>alert('xss')</script>${longMessage}`,
      },
    };

    const processed = guard.processIncoming(incoming, 2000);
    expect(processed).not.toBeNull();
    if (processed) {
      expect(typeof processed.payload.text).toBe("string");
      const text = processed.payload.text as string;
      expect(text.length).toBeLessThanOrEqual(120);
      expect(text).not.toContain("<script>");
      expect(text).not.toContain("</script>");
    }
  });

  it("allows independent message quotas for different peers", () => {
    const guard = new FloodGuard(30, 1000);
    const now = 5000;

    // Peer 1 exhausts quota
    for (let i = 0; i < 30; i++) {
      guard.processIncoming(
        { type: "pos", peer_id: "peer1", ts: now + i },
        now,
      );
    }
    expect(
      guard.processIncoming(
        { type: "pos", peer_id: "peer1", ts: now + 31 },
        now,
      ),
    ).toBeNull();

    // Peer 2 can still send freely
    const peer2Result = guard.processIncoming(
      { type: "pos", peer_id: "peer2", ts: now },
      now,
    );
    expect(peer2Result).not.toBeNull();
  });
});
