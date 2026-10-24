export interface PlaceholderArtOptions {
  width?: number;
  height?: number;
  numeral?: string;
  subtitle?: string;
  palette?: [string, string]; // start and end gradient hex
}

const PALETTES: [string, string][] = [
  ["#1B2238", "#07080F"], // Deep nocturnal blue
  ["#3A3320", "#0E0E10"], // Warm golden dusk
  ["#4A2E35", "#0B0D1F"], // Muted rose
  ["#223835", "#07080F"], // Sage forest
  ["#362B48", "#0B0D1F"], // Twilight violet
  ["#483C28", "#0B0D1F"], // Rich amber
];

export function renderPlaceholderArt(
  canvas: HTMLCanvasElement,
  options: PlaceholderArtOptions = {},
): void {
  const width = options.width || 800;
  const height = options.height || 1000;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const palette =
    options.palette || PALETTES[Math.floor(Math.random() * PALETTES.length)];
  const numeral = options.numeral || "I";
  const subtitle = options.subtitle || "Your photo here";

  // 1. Background gradient
  const grad = ctx.createLinearGradient(0, 0, width * 0.8, height);
  grad.addColorStop(0, palette[0]);
  grad.addColorStop(1, palette[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle procedural grain overlay
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Delicate inner frame border
  ctx.strokeStyle = "rgba(200, 185, 138, 0.25)"; // gold hairline
  ctx.lineWidth = Math.max(1, Math.floor(width * 0.005));
  const pad = width * 0.06;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

  // 4. Roman Numeral in center
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#C8B98A"; // gold
  ctx.font = `italic ${Math.floor(height * 0.22)}px "Instrument Serif", Georgia, serif`;
  ctx.fillText(numeral, width / 2, height / 2 - height * 0.04);

  // 5. Subtitle label
  ctx.fillStyle = "#F3EAD3"; // cream
  ctx.font = `300 ${Math.floor(height * 0.035)}px Inter, sans-serif`;
  ctx.letterSpacing = "0.15em";
  ctx.fillText(subtitle.toUpperCase(), width / 2, height / 2 + height * 0.16);

  // 6. Delicate lower caption
  ctx.fillStyle = "rgba(185, 176, 154, 0.6)"; // cream-dim
  ctx.font = `italic ${Math.floor(height * 0.024)}px "Instrument Serif", serif`;
  ctx.fillText(
    "Museum of Us · Permanent Collection",
    width / 2,
    height - pad * 1.5,
  );
}

export function generatePlaceholderArtBlob(
  options: PlaceholderArtOptions = {},
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      // In non-browser / node test environment, return a dummy blob
      resolve(new Blob(["placeholder"], { type: "image/webp" }));
      return;
    }
    const canvas = document.createElement("canvas");
    renderPlaceholderArt(canvas, options);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate placeholder blob"));
      },
      "image/webp",
      0.85,
    );
  });
}

export function generatePlaceholderArtDataUrl(
  options: PlaceholderArtOptions = {},
): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  renderPlaceholderArt(canvas, options);
  return canvas.toDataURL("image/webp", 0.85);
}
