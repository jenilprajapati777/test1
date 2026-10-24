import { z } from "zod";

export const HairStyleSchema = z.enum([
  "long",
  "bob",
  "ponytail",
  "bun",
  "short",
  "curly",
  "wavy",
  "buzz",
  "none",
]);
export type HairStyle = z.infer<typeof HairStyleSchema>;

export const TopStyleSchema = z.enum([
  "tee",
  "sweater",
  "vest-shirt",
  "turtleneck",
  "hoodie",
  "blouse",
]);
export type TopStyle = z.infer<typeof TopStyleSchema>;

export const BottomStyleSchema = z.enum([
  "trousers",
  "jeans",
  "skirt",
  "shorts",
]);
export type BottomStyle = z.infer<typeof BottomStyleSchema>;

export const ShoesStyleSchema = z.enum(["boots", "sneakers", "loafers"]);
export type ShoesStyle = z.infer<typeof ShoesStyleSchema>;

export const ExtraItemSchema = z.enum([
  "glasses",
  "beanie",
  "earrings",
  "scarf",
  "belt",
]);
export type ExtraItem = z.infer<typeof ExtraItemSchema>;

export const PresetSchema = z.enum(["a", "b", "c"]);
export type Preset = z.infer<typeof PresetSchema>;

export const AvatarConfigSchema = z.object({
  preset: PresetSchema.default("a"),
  skin: z.string().default("original"),
  hairStyle: HairStyleSchema.default("long"),
  hairColor: z.string().default("#3D2B1F"),
  top: TopStyleSchema.default("sweater"),
  topColor: z.string().default("#2B2D33"),
  bottom: BottomStyleSchema.default("trousers"),
  bottomColor: z.string().default("#F3EAD3"),
  shoes: ShoesStyleSchema.default("boots"),
  shoesColor: z.string().default("#3D2B1F"),
  extras: z.array(ExtraItemSchema).max(5).default(["belt"]),
});

export type AvatarConfig = z.infer<typeof AvatarConfigSchema>;

export const DEFAULT_VISITOR_AVATAR: AvatarConfig = {
  preset: "a",
  skin: "original",
  hairStyle: "long",
  hairColor: "#3A261A",
  top: "sweater",
  topColor: "#2B2D33",
  bottom: "trousers",
  bottomColor: "#EDEBE6",
  shoes: "boots",
  shoesColor: "#3A261A",
  extras: ["belt"],
};

export const DEFAULT_HOST_AVATAR: AvatarConfig = {
  preset: "b",
  skin: "original",
  hairStyle: "curly",
  hairColor: "#4A3525",
  top: "vest-shirt",
  topColor: "#1F2026",
  bottom: "trousers",
  bottomColor: "#1A2238",
  shoes: "loafers",
  shoesColor: "#5C3E26",
  extras: [],
};

export const SKIN_TONES = [
  { name: "Original", value: "original", color: "#FCD8C5" },
  { name: "Fair", value: "#FFDFD3", color: "#FFDFD3" },
  { name: "Peach", value: "#FCD8C5", color: "#FCD8C5" },
  { name: "Warm Beige", value: "#F3C5A5", color: "#F3C5A5" },
  { name: "Almond", value: "#E8B288", color: "#E8B288" },
  { name: "Sienna", value: "#BA7A50", color: "#BA7A50" },
  { name: "Bronze", value: "#8C532E", color: "#8C532E" },
  { name: "Espresso", value: "#4A2A18", color: "#4A2A18" },
] as const;

export type AvatarAnimState =
  "idle" | "walk" | "run" | "sit" | "wave" | "clap" | "dance" | "look-at-art";

export interface AvatarSource {
  id: string;
  type: "procedural" | "glb";
  url?: string;
}

export function validateAvatarConfig(input: unknown): AvatarConfig {
  const result = AvatarConfigSchema.safeParse(input);
  if (result.success) {
    return result.data;
  }
  return DEFAULT_VISITOR_AVATAR;
}
