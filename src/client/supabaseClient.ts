import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Museum, PublicMuseum, Reply } from "../types/museum";
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
import { APP_CONFIG } from "../lib/config";

export class SupabaseDataClient implements DataClient {
  private supabase: SupabaseClient | null = null;

  constructor() {
    if (APP_CONFIG.supabaseUrl && APP_CONFIG.supabaseAnonKey) {
      this.supabase = createClient(
        APP_CONFIG.supabaseUrl,
        APP_CONFIG.supabaseAnonKey,
      );
    }
  }

  private requireClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error("Supabase is not configured. Running in Demo Mode.");
    }
    return this.supabase;
  }

  async getMuseum(slug: string): Promise<PublicMuseum | null> {
    const client = this.requireClient();
    const { data, error } = await client.rpc("get_museum", { p_slug: slug });
    if (error || !data) return null;
    return data as PublicMuseum;
  }

  async trackVisit(slug: string): Promise<void> {
    const client = this.requireClient();
    await client.rpc("track_visit", { p_slug: slug });
  }

  async postReply(
    slug: string,
    name: string,
    message: string,
  ): Promise<{ success: boolean; error?: string }> {
    const client = this.requireClient();
    const { error } = await client.rpc("post_reply", {
      p_slug: slug,
      p_name: name.slice(0, 20),
      p_message: message.slice(0, 500),
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async postReport(
    slug: string,
    reason: string,
  ): Promise<{ success: boolean; error?: string }> {
    const client = this.requireClient();
    const { error } = await client.rpc("post_report", {
      p_slug: slug,
      p_reason: reason.slice(0, 500),
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async listMyMuseums(): Promise<Museum[]> {
    const client = this.requireClient();
    const { data: user } = await client.auth.getUser();
    if (!user?.user) return [];

    const { data, error } = await client
      .from("museums")
      .select("*, artworks(*)")
      .eq("owner_id", user.user.id)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Museum[];
  }

  async createMuseum(data: Partial<Museum>): Promise<Museum> {
    const client = this.requireClient();
    const { data: user } = await client.auth.getUser();
    if (!user?.user) throw new Error("Not authenticated");

    const toInsert = {
      ...data,
      owner_id: user.user.id,
      artworks: undefined,
    };
    delete (toInsert as Record<string, unknown>).artworks;

    const { data: inserted, error } = await client
      .from("museums")
      .insert(toInsert)
      .select()
      .single();

    if (error || !inserted)
      throw new Error(error?.message || "Failed to create museum");
    return inserted as Museum;
  }

  async updateMuseum(id: string, data: Partial<Museum>): Promise<Museum> {
    const client = this.requireClient();
    const toUpdate = { ...data };
    delete (toUpdate as Record<string, unknown>).artworks;

    const { data: updated, error } = await client
      .from("museums")
      .update(toUpdate)
      .eq("id", id)
      .select()
      .single();

    if (error || !updated)
      throw new Error(error?.message || "Failed to update museum");
    return updated as Museum;
  }

  async setStatus(
    id: string,
    status: "draft" | "published" | "archived",
  ): Promise<void> {
    await this.updateMuseum(id, { status });
  }

  async deleteMuseum(id: string): Promise<void> {
    const client = this.requireClient();
    const { error } = await client.from("museums").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async getReplies(museumId: string): Promise<Reply[]> {
    const client = this.requireClient();
    const { data, error } = await client
      .from("replies")
      .select("*")
      .eq("museum_id", museumId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Reply[];
  }

  async uploadArtwork(
    museumId: string,
    file: Blob,
    filename: string,
    onProgress?: (pct: number) => void,
  ): Promise<{ storage_path: string; url: string }> {
    const client = this.requireClient();
    onProgress?.(20);
    const ext = filename.split(".").pop() || "webp";
    const objectPath = `${museumId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await client.storage
      .from("artworks")
      .upload(objectPath, file, {
        contentType: file.type || "image/webp",
        upsert: true,
      });

    if (error) throw new Error(error.message);
    onProgress?.(80);

    const { data } = client.storage.from("artworks").getPublicUrl(objectPath);
    onProgress?.(100);
    return { storage_path: objectPath, url: data.publicUrl };
  }

  async deleteArtwork(_museumId: string, storagePath: string): Promise<void> {
    const client = this.requireClient();
    await client.storage.from("artworks").remove([storagePath]);
    await client.from("artworks").delete().eq("storage_path", storagePath);
  }

  async signInWithEmail(
    email: string,
  ): Promise<{ success: boolean; error?: string }> {
    const client = this.requireClient();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/dashboard" },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  async signOut(): Promise<void> {
    const client = this.requireClient();
    await client.auth.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.supabase) return null;
    const { data } = await this.supabase.auth.getUser();
    if (!data.user) return null;
    return { id: data.user.id, email: data.user.email || "" };
  }

  onAuthChange(callback: (user: AuthUser | null) => void): () => void {
    if (!this.supabase) {
      callback(null);
      return () => {};
    }
    const { data } = this.supabase.auth.onAuthStateChange((_, session) => {
      callback(
        session?.user
          ? { id: session.user.id, email: session.user.email || "" }
          : null,
      );
    });
    return () => data.subscription.unsubscribe();
  }

  openChannel(
    slug: string,
    presence: Omit<PeerPresence, "joinedAt">,
    handlers: RealtimeChannelHandler,
  ): RealtimeChannel {
    const client = this.requireClient();
    const channelName = `museum:${slug}`;
    const myPresence: PeerPresence = { ...presence, joinedAt: Date.now() };

    const channel = client.channel(channelName, {
      config: { presence: { key: myPresence.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const peerList: PeerPresence[] = [];
        for (const key of Object.keys(state)) {
          const pres = (state[key] as unknown[])[0] as PeerPresence;
          if (pres) peerList.push(pres);
        }
        handlers.onPresenceUpdate(peerList);
      })
      .on("broadcast", { event: "pos" }, ({ payload }) => {
        handlers.onPosition(payload as PeerPosition);
      })
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        handlers.onChat(payload as PeerChat);
      })
      .on("broadcast", { event: "emote" }, ({ payload }) => {
        handlers.onEmote(payload as PeerEmote);
      })
      .on("broadcast", { event: "sit" }, ({ payload }) => {
        handlers.onSit(payload as PeerSit);
      });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track(myPresence);
      }
    });

    return {
      sendPosition: (pos) => {
        channel.send({
          type: "broadcast",
          event: "pos",
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
        handlers.onChat(chat);
        channel.send({ type: "broadcast", event: "chat", payload: chat });
      },
      sendEmote: (emote) => {
        const payload: PeerEmote = { id: myPresence.id, emote, t: Date.now() };
        handlers.onEmote(payload);
        channel.send({ type: "broadcast", event: "emote", payload });
      },
      sendSit: (seatIndex) => {
        const payload: PeerSit = {
          id: myPresence.id,
          seatIndex,
          t: Date.now(),
        };
        handlers.onSit(payload);
        channel.send({ type: "broadcast", event: "sit", payload });
      },
      close: () => {
        channel.unsubscribe();
      },
    };
  }
}
