export type HostNpcStatus =
  "Away" | "Greeting" | "Guiding" | "Seated" | "Dancing" | "Inactive";

export interface HostNpcState {
  status: HostNpcStatus;
  position: { x: number; y: number; z: number; ry: number };
  currentLineIndex: number;
  currentSpeech: string | null;
  speechExpiresAt: number;
  lastArtworkId: string | null;
  artworkLingerTime: number; // seconds spent near current artwork
  heroIdleTime: number; // seconds spent idle near hero wall
  hasRealHost: boolean;
}

export type HostNpcEvent =
  | { type: "TICK"; delta: number }
  | { type: "SPAWN_GREETING" }
  | { type: "VISITOR_MOVE"; x: number; z: number; isMoving: boolean }
  | { type: "VISITOR_APPROACH_ARTWORK"; artworkId: string; caption?: string }
  | { type: "VISITOR_LEAVE_ARTWORK" }
  | { type: "VISITOR_NEAR_HERO"; delta: number; isVisitorIdle: boolean }
  | { type: "VISITOR_SIT"; seatIndex: number }
  | { type: "VISITOR_STAND" }
  | { type: "VISITOR_DANCE" }
  | { type: "VISITOR_STOP_DANCE" }
  | { type: "REAL_HOST_JOINED" }
  | { type: "REAL_HOST_LEFT" };

export function createInitialHostNpcState(
  _hostLines: string[] = [],
): HostNpcState {
  return {
    status: "Away",
    position: { x: 0, y: 0, z: -2, ry: 0 },
    currentLineIndex: 0,
    currentSpeech: null,
    speechExpiresAt: 0,
    lastArtworkId: null,
    artworkLingerTime: 0,
    heroIdleTime: 0,
    hasRealHost: false,
  };
}

export function hostNpcReducer(
  state: HostNpcState,
  event: HostNpcEvent,
  hostLines: string[] = [],
): HostNpcState {
  const lines =
    hostLines.length > 0 ? hostLines : ["Welcome 🤍 I made this just for you."];

  // 1. If real host joins, NPC yields immediately
  if (event.type === "REAL_HOST_JOINED") {
    return {
      ...state,
      hasRealHost: true,
      status: "Inactive",
      currentSpeech: null,
    };
  }

  if (event.type === "REAL_HOST_LEFT") {
    return {
      ...state,
      hasRealHost: false,
      status: "Guiding",
    };
  }

  if (state.hasRealHost) {
    return { ...state, status: "Inactive" };
  }

  switch (event.type) {
    case "TICK": {
      let speech = state.currentSpeech;
      if (
        state.speechExpiresAt > 0 &&
        performance.now() > state.speechExpiresAt
      ) {
        speech = null;
      }
      return {
        ...state,
        currentSpeech: speech,
      };
    }

    case "SPAWN_GREETING": {
      if (state.status === "Away") {
        return {
          ...state,
          status: "Greeting",
          currentLineIndex: 1 % lines.length,
          currentSpeech: lines[0],
          speechExpiresAt: performance.now() + 5000,
        };
      }
      return state;
    }

    case "VISITOR_MOVE": {
      if (state.status === "Greeting") {
        return {
          ...state,
          status: "Guiding",
        };
      }
      if (state.status === "Guiding") {
        // Follow visitor smoothly at ~2m behind/offset
        const dx = event.x - state.position.x;
        const dz = event.z - state.position.z;
        const dist = Math.hypot(dx, dz);
        let newX = state.position.x;
        let newZ = state.position.z;
        let newRy = state.position.ry;

        if (dist > 2.5) {
          const moveStep = Math.min(dist - 2.0, 0.08);
          newX += (dx / dist) * moveStep;
          newZ += (dz / dist) * moveStep;
          newRy = Math.atan2(dx, dz);
        }

        return {
          ...state,
          position: { ...state.position, x: newX, z: newZ, ry: newRy },
        };
      }
      return state;
    }

    case "VISITOR_APPROACH_ARTWORK": {
      if (state.status === "Guiding") {
        const isSame = state.lastArtworkId === event.artworkId;
        const linger = isSame ? state.artworkLingerTime : 0;
        return {
          ...state,
          lastArtworkId: event.artworkId,
          artworkLingerTime: linger,
        };
      }
      return state;
    }

    case "VISITOR_LEAVE_ARTWORK": {
      return {
        ...state,
        lastArtworkId: null,
        artworkLingerTime: 0,
      };
    }

    case "VISITOR_NEAR_HERO": {
      if (state.status === "Guiding") {
        const nextIdle = event.isVisitorIdle
          ? state.heroIdleTime + event.delta
          : 0;
        let speech = state.currentSpeech;
        let expires = state.speechExpiresAt;

        // If visitor idle near hero > 20s, say "dance with me?"
        if (nextIdle >= 20 && state.heroIdleTime < 20) {
          const danceLine =
            lines.find((l) => l.toLowerCase().includes("dance")) ||
            "Dance with me?";
          speech = danceLine;
          expires = performance.now() + 5000;
        }

        return {
          ...state,
          heroIdleTime: nextIdle,
          currentSpeech: speech,
          speechExpiresAt: expires,
        };
      }
      return state;
    }

    case "VISITOR_SIT": {
      // Host takes the other seat: if visitor takes seat 0, host takes seat 1
      return {
        ...state,
        status: "Seated",
        currentSpeech:
          lines.find((l) => l.toLowerCase().includes("sit")) ||
          "Come sit with me?",
        speechExpiresAt: performance.now() + 5000,
      };
    }

    case "VISITOR_STAND": {
      if (state.status === "Seated") {
        return {
          ...state,
          status: "Guiding",
        };
      }
      return state;
    }

    case "VISITOR_DANCE": {
      return {
        ...state,
        status: "Dancing",
        currentSpeech: "Dance with me!",
        speechExpiresAt: performance.now() + 5000,
      };
    }

    case "VISITOR_STOP_DANCE": {
      if (state.status === "Dancing") {
        return {
          ...state,
          status: "Guiding",
        };
      }
      return state;
    }

    default:
      return state;
  }
}
