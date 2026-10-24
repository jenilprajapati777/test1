import { z } from "zod";
import { AvatarConfigSchema, DEFAULT_HOST_AVATAR } from "./avatar";

export const ArtworkKindSchema = z.enum(["photo", "video"]);
export type ArtworkKind = z.infer<typeof ArtworkKindSchema>;

export const ArtworkSchema = z.object({
  id: z.string().uuid().optional(),
  museum_id: z.string().uuid().optional(),
  kind: ArtworkKindSchema.default("photo"),
  storage_path: z.string(),
  poster_path: z.string().nullable().optional(),
  title: z.string().max(60).nullable().optional(),
  caption: z.string().max(200).nullable().optional(),
  taken_on: z.string().max(30).nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  sort_order: z.number().int().default(0),
  created_at: z.string().optional(),
  // In-memory or blob URL for preview
  blob_url: z.string().optional(),
});
export type Artwork = z.infer<typeof ArtworkSchema>;

export const MuseumStatusSchema = z.enum(["draft", "published", "archived"]);
export type MuseumStatus = z.infer<typeof MuseumStatusSchema>;

export const MuseumSchema = z.object({
  id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),
  slug: z.string().regex(/^[a-z0-9]{10,16}$/),
  status: MuseumStatusSchema.default("draft"),
  title: z.string().min(1).max(40).default("Our Museum"),
  from_name: z.string().min(1).max(30),
  to_name: z.string().min(1).max(30),
  plaque_eyebrow: z.string().max(40).default("A PERMANENT COLLECTION"),
  plaque_title: z.string().max(60),
  plaque_body: z.string().max(280),
  plaque_signoff: z.string().max(60).default(""),
  host_name: z.string().max(20).default("Host"),
  host_avatar: AvatarConfigSchema.default(DEFAULT_HOST_AVATAR),
  host_lines: z
    .array(z.string())
    .max(6)
    .default([
      "Welcome 🤍 I made this just for you.",
      "Take your time — every frame is a memory.",
      "Come sit with me?",
      "Dance with me?",
    ]),
  theme: z.string().default("winter-gallery"),
  share_preview: z.boolean().default(false),
  expires_at: z.string().nullable().optional(),
  view_count: z.number().int().default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  artworks: z.array(ArtworkSchema).default([]),
});
export type Museum = z.infer<typeof MuseumSchema>;

export const PublicMuseumSchema = MuseumSchema.omit({ owner_id: true });
export type PublicMuseum = z.infer<typeof PublicMuseumSchema>;

export const ReplySchema = z.object({
  id: z.string().uuid().optional(),
  museum_id: z.string().uuid().optional(),
  visitor_name: z.string().min(1).max(20),
  message: z.string().min(1).max(500),
  created_at: z.string().optional(),
});
export type Reply = z.infer<typeof ReplySchema>;

export const ReportSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string(),
  reason: z.string().min(1).max(500),
  created_at: z.string().optional(),
});
export type Report = z.infer<typeof ReportSchema>;
