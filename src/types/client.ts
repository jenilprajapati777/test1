import { Artwork, Museum, PublicMuseum, Reply } from './museum';
import { AvatarConfig } from './avatar';

export interface PeerPresence {
  id: string; // unique per-tab UUID
  name: string;
  role: 'visitor' | 'host';
  avatar: AvatarConfig;
  joinedAt: number;
}

export interface PeerPosition {
  id: string;
  x: number;
  z: number;
  ry: number;
  anim: string;
  t: number;
}

export interface PeerChat {
  id: string;
  name: string;
  message: string;
  t: number;
}

export interface PeerEmote {
  id: string;
  emote: 'wave' | 'dance' | 'clap' | 'heart';
  t: number;
}

export interface PeerSit {
  id: string;
  seatIndex: number; // 0 or 1
  t: number;
}

export interface RealtimeChannelHandler {
  onPresenceUpdate: (peers: PeerPresence[]) => void;
  onPosition: (pos: PeerPosition) => void;
  onChat: (chat: PeerChat) => void;
  onEmote: (emote: PeerEmote) => void;
  onSit: (sit: PeerSit) => void;
}

export interface RealtimeChannel {
  sendPosition: (pos: Omit<PeerPosition, 'id' | 't'>) => void;
  sendChat: (message: string) => void;
  sendEmote: (emote: 'wave' | 'dance' | 'clap' | 'heart') => void;
  sendSit: (seatIndex: number) => void;
  close: () => void;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface DataClient {
  // Public RPCs
  getMuseum(slug: string): Promise<PublicMuseum | null>;
  trackVisit(slug: string): Promise<void>;
  postReply(slug: string, name: string, message: string): Promise<{ success: boolean; error?: string }>;
  postReport(slug: string, reason: string): Promise<{ success: boolean; error?: string }>;

  // Creator / Dashboard operations
  listMyMuseums(): Promise<Museum[]>;
  createMuseum(data: Partial<Museum>): Promise<Museum>;
  updateMuseum(id: string, data: Partial<Museum>): Promise<Museum>;
  setStatus(id: string, status: 'draft' | 'published' | 'archived'): Promise<void>;
  deleteMuseum(id: string): Promise<void>;
  getReplies(museumId: string): Promise<Reply[]>;

  // Artwork Storage
  uploadArtwork(
    museumId: string,
    file: Blob,
    filename: string,
    onProgress?: (pct: number) => void
  ): Promise<{ storage_path: string; url: string }>;
  deleteArtwork(museumId: string, storagePath: string): Promise<void>;

  // Auth
  signInWithEmail(email: string): Promise<{ success: boolean; error?: string }>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  onAuthChange(callback: (user: AuthUser | null) => void): () => void;

  // Realtime
  openChannel(
    slug: string,
    presence: Omit<PeerPresence, 'joinedAt'>,
    handlers: RealtimeChannelHandler
  ): RealtimeChannel;
}
