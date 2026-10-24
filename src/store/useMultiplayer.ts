import { create } from "zustand";
import { AvatarConfig, DEFAULT_VISITOR_AVATAR } from "../types/avatar";
import {
  PeerPresence,
  PeerPosition,
  PeerChat,
  PeerEmote,
  PeerSit,
  RealtimeChannel,
} from "../types/client";
import { InterpolationBuffer } from "../lib/interpolation";
import { FloodGuard } from "../lib/floodGuard";
import { getClient } from "../client";

export interface RemotePeer {
  id: string;
  name: string;
  role: "visitor" | "host";
  avatar: AvatarConfig;
  position: { x: number; z: number; ry: number };
  animState: string;
  activeEmote?: string;
  bubbleText?: string;
  bubbleExpiresAt?: number;
  buffer: InterpolationBuffer;
}

interface MultiplayerState {
  peerId: string;
  peers: Record<string, RemotePeer>;
  hasLiveHost: boolean;
  isConnected: boolean;
  connect: (
    slug: string,
    myName: string,
    myConfig: AvatarConfig,
    isHost: boolean,
  ) => () => void;
  broadcastPosition: (x: number, z: number, ry: number, anim: string) => void;
  broadcastBubble: (text: string) => void;
  broadcastEmote: (emote: "wave" | "dance" | "clap" | "heart") => void;
  broadcastSit: (seatIndex: number) => void;
}

const floodGuard = new FloodGuard(30, 1000);

export const useMultiplayerStore = create<MultiplayerState>((set, get) => {
  const localPeerId = "peer_" + Math.random().toString(36).slice(2, 10);
  let activeChannel: RealtimeChannel | null = null;

  return {
    peerId: localPeerId,
    peers: {},
    hasLiveHost: false,
    isConnected: false,

    connect: (
      slug: string,
      myName: string,
      myConfig: AvatarConfig,
      isHost: boolean,
    ) => {
      const client = getClient();
      const myPresence: Omit<PeerPresence, "joinedAt"> = {
        id: localPeerId,
        name: myName,
        role: isHost ? "host" : "visitor",
        avatar: myConfig,
      };

      const channel = client.openChannel(slug, myPresence, {
        onPresenceUpdate: (presentPeers: PeerPresence[]) => {
          const { peers } = get();
          const nextPeers: Record<string, RemotePeer> = {};

          for (const p of presentPeers) {
            if (p.id === localPeerId) continue;
            const existing = peers[p.id];
            nextPeers[p.id] = existing ?? {
              id: p.id,
              name: p.name,
              role: p.role,
              avatar: p.avatar || DEFAULT_VISITOR_AVATAR,
              position: { x: 0, z: 0, ry: 0 },
              animState: "idle",
              buffer: new InterpolationBuffer(100),
            };
            if (existing) {
              nextPeers[p.id].name = p.name;
              nextPeers[p.id].role = p.role;
              if (p.avatar) nextPeers[p.id].avatar = p.avatar;
            }
          }

          const hasHost = Object.values(nextPeers).some(
            (p) => p.role === "host",
          );
          set({ peers: nextPeers, hasLiveHost: hasHost });
        },

        onPosition: (pos: PeerPosition) => {
          if (pos.id === localPeerId) return;
          if (!floodGuard.checkRateLimit(pos.id, Date.now())) return;

          const { peers } = get();
          let peer = peers[pos.id];
          if (!peer) {
            peer = {
              id: pos.id,
              name: "Guest",
              role: "visitor",
              avatar: DEFAULT_VISITOR_AVATAR,
              position: { x: pos.x, z: pos.z, ry: pos.ry },
              animState: pos.anim || "idle",
              buffer: new InterpolationBuffer(100),
            };
          }

          peer.buffer.addPacket({
            ts: pos.t,
            x: pos.x,
            z: pos.z,
            rotY: pos.ry,
          });
          peer.animState = pos.anim || "idle";
          set({ peers: { ...peers, [pos.id]: peer } });
        },

        onChat: (chat: PeerChat) => {
          if (chat.id === localPeerId) return;
          const { peers } = get();
          const peer = peers[chat.id];
          if (peer) {
            peer.bubbleText = chat.message.slice(0, 120);
            peer.bubbleExpiresAt = Date.now() + 5000;
            set({ peers: { ...peers, [chat.id]: { ...peer } } });
          }
        },

        onEmote: (emote: PeerEmote) => {
          if (emote.id === localPeerId) return;
          const { peers } = get();
          const peer = peers[emote.id];
          if (peer) {
            peer.activeEmote = emote.emote;
            peer.animState = emote.emote === "heart" ? "wave" : emote.emote;
            set({ peers: { ...peers, [emote.id]: { ...peer } } });
          }
        },

        onSit: (sit: PeerSit) => {
          if (sit.id === localPeerId) return;
          const { peers } = get();
          const peer = peers[sit.id];
          if (peer) {
            peer.animState = "sit";
            set({ peers: { ...peers, [sit.id]: { ...peer } } });
          }
        },
      });

      activeChannel = channel;
      set({ isConnected: true });

      return () => {
        if (activeChannel) {
          activeChannel.close();
          activeChannel = null;
        }
        set({ peers: {}, hasLiveHost: false, isConnected: false });
      };
    },

    broadcastPosition: (x: number, z: number, ry: number, anim: string) => {
      if (activeChannel) {
        activeChannel.sendPosition({ x, z, ry, anim });
      }
    },

    broadcastBubble: (text: string) => {
      if (activeChannel) {
        activeChannel.sendChat(text);
      }
    },

    broadcastEmote: (emote: "wave" | "dance" | "clap" | "heart") => {
      if (activeChannel) {
        activeChannel.sendEmote(emote);
      }
    },

    broadcastSit: (seatIndex: number) => {
      if (activeChannel) {
        activeChannel.sendSit(seatIndex);
      }
    },
  };
});
