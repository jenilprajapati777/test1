import { Museum, PublicMuseum, Reply, Report } from "../types/museum";
import {
  AuthUser,
  DataClient,
  PeerChat,
  PeerEmote,
  PeerPosition,
  PeerPresence,
  PeerSit,
  RealtimeChannel,
  RealtimeChannelHandler,
} from "../types/client";
import { DEFAULT_HOST_AVATAR } from "../types/avatar";

const DEMO_OWNER_ID = "00000000-0000-0000-0000-000000000001";

// In-memory / localStorage storage
const STORAGE_KEY_MUSEUMS = "museum_demo_museums";
const STORAGE_KEY_REPLIES = "museum_demo_replies";
const STORAGE_KEY_REPORTS = "museum_demo_reports";

function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export function createDemoMuseum(): Museum {
  const now = new Date().toISOString();
  return {
    id: "10000000-0000-0000-0000-000000000001",
    owner_id: DEMO_OWNER_ID,
    slug: "demo",
    status: "published",
    title: "Our Museum",
    from_name: "Ethan",
    to_name: "Maya",
    plaque_eyebrow: "A PERMANENT COLLECTION",
    plaque_title: "For Maya",
    plaque_body:
      "Our whole winter, hung on the walls, just for you. Every smile, every quiet evening, every adventure we shared.",
    plaque_signoff: "Love, Ethan",
    host_name: "Ethan",
    host_avatar: DEFAULT_HOST_AVATAR,
    host_lines: [
      "Welcome Maya 🤍 I made this just for you.",
      "Our whole winter is on these walls.",
      "Take your time — every frame is a memory.",
      "Come sit with me by the screen?",
      "Dance with me?",
    ],
    theme: "winter-gallery",
    share_preview: false,
    view_count: 42,
    created_at: now,
    updated_at: now,
    artworks: [
      {
        id: "20000000-0000-0000-0000-000000000001",
        museum_id: "10000000-0000-0000-0000-000000000001",
        kind: "photo",
        storage_path: "demo/hero-portrait.webp",
        title: "The First Snow",
        caption: "Central Park blanketed in quiet white, December 2024.",
        taken_on: "Dec 14, 2024",
        width: 1400,
        height: 1900,
        sort_order: 0,
      },
      {
        id: "20000000-0000-0000-0000-000000000002",
        museum_id: "10000000-0000-0000-0000-000000000001",
        kind: "photo",
        storage_path: "demo/warm-cafe.webp",
        title: "Warm Cinnamon",
        caption: "Hiding from the rain in that small corner bakery on 4th.",
        taken_on: "Jan 03, 2025",
        width: 1200,
        height: 1200,
        sort_order: 1,
      },
      {
        id: "20000000-0000-0000-0000-000000000003",
        museum_id: "10000000-0000-0000-0000-000000000001",
        kind: "photo",
        storage_path: "demo/under-the-stars.webp",
        title: "Under the Stars",
        caption: "Late night drive to the ridge to watch the meteor shower.",
        taken_on: "Jan 19, 2025",
        width: 1600,
        height: 1000,
        sort_order: 2,
      },
      {
        id: "20000000-0000-0000-0000-000000000004",
        museum_id: "10000000-0000-0000-0000-000000000001",
        kind: "photo",
        storage_path: "demo/golden-hour.webp",
        title: "Golden Hour Laughs",
        caption: "You could not stop laughing at the seagulls.",
        taken_on: "Feb 02, 2025",
        width: 1200,
        height: 1400,
        sort_order: 3,
      },
      {
        id: "20000000-0000-0000-0000-000000000005",
        museum_id: "10000000-0000-0000-0000-000000000001",
        kind: "photo",
        storage_path: "demo/museum-date.webp",
        title: "Museum Afternoon",
        caption: "Whispering in the modern wing until they asked us to leave.",
        taken_on: "Feb 14, 2025",
        width: 1500,
        height: 1100,
        sort_order: 4,
      },
      {
        id: "20000000-0000-0000-0000-000000000006",
        museum_id: "10000000-0000-0000-0000-000000000001",
        kind: "photo",
        storage_path: "demo/cinema-nook.webp",
        title: "Our Favorite Song",
        caption: "Dancing in the kitchen at 2 AM with cold pizza.",
        taken_on: "Feb 28, 2025",
        width: 1200,
        height: 1200,
        sort_order: 5,
      },
    ],
  };
}

export class DemoClient implements DataClient {
  private museums: Map<string, Museum> = new Map();
  private replies: Reply[] = [];
  private reports: Report[] = [];
  private currentUser: AuthUser | null = {
    id: DEMO_OWNER_ID,
    email: "creator@demo.local",
  };
  private authSubscribers: Set<(user: AuthUser | null) => void> = new Set();
  private replyRateLimit: Map<string, number[]> = new Map(); // slug -> timestamps

  constructor() {
    this.init();
  }

  private init() {
    // Load stored or seed with default demo museum
    const stored = loadStored<Museum[]>(STORAGE_KEY_MUSEUMS, []);
    const demo = createDemoMuseum();
    this.museums.set("demo", demo);

    for (const m of stored) {
      this.museums.set(m.slug, m);
      if (m.id) this.museums.set(m.id, m);
    }

    this.replies = loadStored<Reply[]>(STORAGE_KEY_REPLIES, [
      {
        id: "30000000-0000-0000-0000-000000000001",
        museum_id: demo.id,
        visitor_name: "Maya",
        message:
          "Ethan this is the most romantic thing anyone has ever made for me 🥺❤️ I love you so much!",
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);

    this.reports = loadStored<Report[]>(STORAGE_KEY_REPORTS, []);
  }

  private persist() {
    const list = Array.from(new Set(this.museums.values()));
    saveStored(STORAGE_KEY_MUSEUMS, list);
    saveStored(STORAGE_KEY_REPLIES, this.replies);
    saveStored(STORAGE_KEY_REPORTS, this.reports);
  }

  async getMuseum(slug: string): Promise<PublicMuseum | null> {
    const museum = this.museums.get(slug);
    if (!museum) return null;

    // Check expiration or status
    if (museum.status !== "published") return null;
    if (
      museum.expires_at &&
      new Date(museum.expires_at).getTime() < Date.now()
    ) {
      return null;
    }

    // Return public copy (without owner_id)
    const { owner_id: _, ...publicMuseum } = museum;
    return JSON.parse(JSON.stringify(publicMuseum));
  }

  async trackVisit(slug: string): Promise<void> {
    const museum = this.museums.get(slug);
    if (museum) {
      museum.view_count = (museum.view_count || 0) + 1;
      this.persist();
    }
  }

  async postReply(
    slug: string,
    name: string,
    message: string,
  ): Promise<{ success: boolean; error?: string }> {
    const museum = this.museums.get(slug);
    if (!museum || museum.status !== "published") {
      return { success: false, error: "Museum not found or closed." };
    }

    // Rate limit: <= 3/min/museum
    const now = Date.now();
    const history = this.replyRateLimit.get(slug) || [];
    const recent = history.filter((t) => now - t < 60000);
    if (recent.length >= 3) {
      return {
        success: false,
        error: "Please wait a moment before sending another message.",
      };
    }
    recent.push(now);
    this.replyRateLimit.set(slug, recent);

    const reply: Reply = {
      id: crypto.randomUUID(),
      museum_id: museum.id,
      visitor_name: name.slice(0, 20),
      message: message.slice(0, 500),
      created_at: new Date().toISOString(),
    };

    this.replies.push(reply);
    this.persist();
    return { success: true };
  }

  async postReport(
    slug: string,
    reason: string,
  ): Promise<{ success: boolean; error?: string }> {
    const report: Report = {
      id: crypto.randomUUID(),
      slug: slug.slice(0, 100),
      reason: reason.slice(0, 500),
      created_at: new Date().toISOString(),
    };
    this.reports.push(report);
    this.persist();
    return { success: true };
  }

  async listMyMuseums(): Promise<Museum[]> {
    return Array.from(new Set(this.museums.values())).filter(
      (m) => m.owner_id === this.currentUser?.id,
    );
  }

  async createMuseum(data: Partial<Museum>): Promise<Museum> {
    const id = data.id || crypto.randomUUID();
    const slug = data.slug || Math.random().toString(36).slice(2, 12);
    const now = new Date().toISOString();

    const museum: Museum = {
      id,
      owner_id: this.currentUser?.id || DEMO_OWNER_ID,
      slug,
      status: data.status || "draft",
      title: data.title || "Our Museum",
      from_name: data.from_name || "Ethan",
      to_name: data.to_name || "Maya",
      plaque_eyebrow: data.plaque_eyebrow || "A PERMANENT COLLECTION",
      plaque_title: data.plaque_title || `For ${data.to_name || "You"}`,
      plaque_body:
        data.plaque_body || "Our memories, hung on the walls just for you.",
      plaque_signoff: data.plaque_signoff || `Love, ${data.from_name || "Me"}`,
      host_name: data.host_name || data.from_name || "Host",
      host_avatar: data.host_avatar || DEFAULT_HOST_AVATAR,
      host_lines: data.host_lines || [
        "Welcome 🤍 I made this just for you.",
        "Take your time — every frame is a memory.",
        "Come sit with me?",
        "Dance with me?",
      ],
      theme: data.theme || "winter-gallery",
      share_preview: data.share_preview || false,
      view_count: 0,
      created_at: now,
      updated_at: now,
      artworks: data.artworks || [],
    };

    this.museums.set(slug, museum);
    this.museums.set(id, museum);
    this.persist();
    return museum;
  }

  async updateMuseum(id: string, data: Partial<Museum>): Promise<Museum> {
    const existing = this.museums.get(id);
    if (!existing) throw new Error("Museum not found");

    const updated: Museum = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };

    this.museums.set(updated.slug, updated);
    this.museums.set(id, updated);
    this.persist();
    return updated;
  }

  async setStatus(
    id: string,
    status: "draft" | "published" | "archived",
  ): Promise<void> {
    await this.updateMuseum(id, { status });
  }

  async deleteMuseum(id: string): Promise<void> {
    const museum = this.museums.get(id);
    if (museum) {
      this.museums.delete(museum.slug);
      this.museums.delete(id);
      this.replies = this.replies.filter((r) => r.museum_id !== id);
      this.persist();
    }
  }

  async getReplies(museumId: string): Promise<Reply[]> {
    return this.replies.filter((r) => r.museum_id === museumId);
  }

  async uploadArtwork(
    museumId: string,
    file: Blob,
    filename: string,
    onProgress?: (pct: number) => void,
  ): Promise<{ storage_path: string; url: string }> {
    onProgress?.(30);
    const ext = filename.split(".").pop() || "webp";
    const storage_path = `${museumId}/${crypto.randomUUID()}.${ext}`;
    onProgress?.(70);
    const url = URL.createObjectURL(file);
    onProgress?.(100);
    return { storage_path, url };
  }

  async deleteArtwork(museumId: string, storagePath: string): Promise<void> {
    const museum = this.museums.get(museumId);
    if (museum) {
      museum.artworks = museum.artworks.filter(
        (a) => a.storage_path !== storagePath,
      );
      this.persist();
    }
  }

  async signInWithEmail(
    email: string,
  ): Promise<{ success: boolean; error?: string }> {
    this.currentUser = {
      id: DEMO_OWNER_ID,
      email: email.trim(),
    };
    for (const sub of this.authSubscribers) sub(this.currentUser);
    return { success: true };
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    for (const sub of this.authSubscribers) sub(null);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  onAuthChange(callback: (user: AuthUser | null) => void): () => void {
    this.authSubscribers.add(callback);
    callback(this.currentUser);
    return () => this.authSubscribers.delete(callback);
  }

  openChannel(
    slug: string,
    presence: Omit<PeerPresence, "joinedAt">,
    handlers: RealtimeChannelHandler,
  ): RealtimeChannel {
    const channelName = `museum:${slug}`;
    const bc = new BroadcastChannel(channelName);
    const myPresence: PeerPresence = {
      ...presence,
      joinedAt: Date.now(),
    };

    const peers = new Map<string, PeerPresence>();
    peers.set(myPresence.id, myPresence);

    // Broadcast presence ping
    const pingPresence = () => {
      bc.postMessage({ type: "presence", payload: myPresence });
    };

    const presenceInterval = setInterval(pingPresence, 3000);
    pingPresence();

    bc.onmessage = (ev) => {
      const data = ev.data;
      if (!data || typeof data !== "object") return;

      switch (data.type) {
        case "presence": {
          const peer = data.payload as PeerPresence;
          if (peer.id && peer.id !== myPresence.id) {
            const isNew = !peers.has(peer.id);
            peers.set(peer.id, peer);
            if (isNew) {
              // Greet back so they know about us immediately
              pingPresence();
            }
            handlers.onPresenceUpdate(Array.from(peers.values()));
          }
          break;
        }
        case "presence_leave": {
          const peerId = data.payload?.id;
          if (peerId && peers.has(peerId)) {
            peers.delete(peerId);
            handlers.onPresenceUpdate(Array.from(peers.values()));
          }
          break;
        }
        case "position": {
          const pos = data.payload as PeerPosition;
          if (pos.id && pos.id !== myPresence.id) {
            handlers.onPosition(pos);
          }
          break;
        }
        case "chat": {
          const chat = data.payload as PeerChat;
          handlers.onChat(chat);
          break;
        }
        case "emote": {
          const emote = data.payload as PeerEmote;
          handlers.onEmote(emote);
          break;
        }
        case "sit": {
          const sit = data.payload as PeerSit;
          handlers.onSit(sit);
          break;
        }
      }
    };

    return {
      sendPosition: (pos) => {
        bc.postMessage({
          type: "position",
          payload: { ...pos, id: myPresence.id, t: Date.now() },
        });
      },
      sendChat: (message) => {
        const chat: PeerChat = {
          id: myPresence.id,
          name: myPresence.name,
          message: message.slice(0, 120),
          t: Date.now(),
        };
        // Also fire locally
        handlers.onChat(chat);
        bc.postMessage({ type: "chat", payload: chat });
      },
      sendEmote: (emote) => {
        const payload: PeerEmote = {
          id: myPresence.id,
          emote,
          t: Date.now(),
        };
        handlers.onEmote(payload);
        bc.postMessage({ type: "emote", payload });
      },
      sendSit: (seatIndex) => {
        const payload: PeerSit = {
          id: myPresence.id,
          seatIndex,
          t: Date.now(),
        };
        handlers.onSit(payload);
        bc.postMessage({ type: "sit", payload });
      },
      close: () => {
        clearInterval(presenceInterval);
        bc.postMessage({
          type: "presence_leave",
          payload: { id: myPresence.id },
        });
        bc.close();
      },
    };
  }
}

export const demoClient = new DemoClient();
