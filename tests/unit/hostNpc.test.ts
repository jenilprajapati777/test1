import { describe, it, expect } from "vitest";
import {
  createInitialHostNpcState,
  hostNpcReducer,
} from "../../src/lib/hostNpc";

describe("Test 7: Host NPC State Machine Reducer", () => {
  const hostLines = [
    "Welcome 🤍 I made this just for you.",
    "Our whole winter is on these walls.",
    "Take your time — every frame is a memory.",
    "Come sit with me?",
    "Dance with me?",
  ];

  it("starts in Away status", () => {
    const initial = createInitialHostNpcState(hostLines);
    expect(initial.status).toBe("Away");
    expect(initial.hasRealHost).toBe(false);
  });

  it("transitions Away -> Greeting upon spawn and speaks line 0", () => {
    const initial = createInitialHostNpcState(hostLines);
    const greeting = hostNpcReducer(
      initial,
      { type: "SPAWN_GREETING" },
      hostLines,
    );

    expect(greeting.status).toBe("Greeting");
    expect(greeting.currentSpeech).toBe(hostLines[0]);
  });

  it("transitions Greeting -> Guiding when visitor moves and follows within distance", () => {
    const initial = createInitialHostNpcState(hostLines);
    const greeting = hostNpcReducer(
      initial,
      { type: "SPAWN_GREETING" },
      hostLines,
    );
    const guiding = hostNpcReducer(
      greeting,
      { type: "VISITOR_MOVE", x: 2, z: 4, isMoving: true },
      hostLines,
    );

    expect(guiding.status).toBe("Guiding");
  });

  it("transitions Guiding -> Seated when visitor sits on bench and says bench line", () => {
    let state = createInitialHostNpcState(hostLines);
    state = hostNpcReducer(state, { type: "SPAWN_GREETING" }, hostLines);
    state = hostNpcReducer(
      state,
      { type: "VISITOR_MOVE", x: 0, z: 0, isMoving: true },
      hostLines,
    );

    const seated = hostNpcReducer(
      state,
      { type: "VISITOR_SIT", seatIndex: 0 },
      hostLines,
    );
    expect(seated.status).toBe("Seated");
    expect(seated.currentSpeech).toContain("sit");

    // Stands back up
    const stood = hostNpcReducer(seated, { type: "VISITOR_STAND" }, hostLines);
    expect(stood.status).toBe("Guiding");
  });

  it("transitions to Dancing when visitor dances and mirrors them", () => {
    let state = createInitialHostNpcState(hostLines);
    state = hostNpcReducer(state, { type: "SPAWN_GREETING" }, hostLines);
    state = hostNpcReducer(
      state,
      { type: "VISITOR_MOVE", x: 0, z: 0, isMoving: true },
      hostLines,
    );

    const dancing = hostNpcReducer(state, { type: "VISITOR_DANCE" }, hostLines);
    expect(dancing.status).toBe("Dancing");

    const stopped = hostNpcReducer(
      dancing,
      { type: "VISITOR_STOP_DANCE" },
      hostLines,
    );
    expect(stopped.status).toBe("Guiding");
  });

  it("yields immediately when a real host joins and restores when real host leaves", () => {
    let state = createInitialHostNpcState(hostLines);
    state = hostNpcReducer(state, { type: "SPAWN_GREETING" }, hostLines);

    // Real host joins
    const realHostJoined = hostNpcReducer(
      state,
      { type: "REAL_HOST_JOINED" },
      hostLines,
    );
    expect(realHostJoined.hasRealHost).toBe(true);
    expect(realHostJoined.status).toBe("Inactive");
    expect(realHostJoined.currentSpeech).toBeNull();

    // Subsequent events are ignored while real host is active
    const moveIgnored = hostNpcReducer(
      realHostJoined,
      { type: "VISITOR_MOVE", x: 5, z: 5, isMoving: true },
      hostLines,
    );
    expect(moveIgnored.status).toBe("Inactive");

    // Real host leaves
    const realHostLeft = hostNpcReducer(
      moveIgnored,
      { type: "REAL_HOST_LEFT" },
      hostLines,
    );
    expect(realHostLeft.hasRealHost).toBe(false);
    expect(realHostLeft.status).toBe("Guiding");
  });
});
