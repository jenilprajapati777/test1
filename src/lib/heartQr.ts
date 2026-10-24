import QRCode from "qrcode";
import { PNG } from "pngjs";

export interface HeartQrOptions {
  ec?: "L" | "M" | "Q" | "H";
  margin?: number;
  density?: number;
  coreFrac?: number;
  fgColor?: string; // Hex, default #E4325B
  bgColor?: string; // Hex, default #F7F4EF
}

export interface QrModule {
  gx: number;
  gy: number;
  mx: number;
  my: number;
  isFinder: boolean;
  inCore: boolean;
}

export interface HeartQrData {
  url: string;
  size: number;
  n: number;
  mod: number;
  modules: QrModule[];
}

function parseHexColor(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export function rng(seed: string): () => number {
  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

export function inHeart(x: number, y: number): boolean {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

export function isFinderPattern(gx: number, gy: number, n: number): boolean {
  // Top-left finder: [0..6, 0..6]
  if (gx >= 0 && gx <= 6 && gy >= 0 && gy <= 6) return true;
  // Top-right finder: [n-7..n-1, 0..6]
  if (gx >= n - 7 && gx < n && gy >= 0 && gy <= 6) return true;
  // Bottom-left finder: [0..6, n-7..n-1]
  if (gx >= 0 && gx <= 6 && gy >= n - 7 && gy < n) return true;
  return false;
}

export function getHeartQrModules(
  url: string,
  size: number,
  opts: HeartQrOptions = {},
): HeartQrData {
  const { ec = "H", margin = 2, density = 0.45, coreFrac = 0.48 } = opts;
  const q = QRCode.create(url, { errorCorrectionLevel: ec });
  const n = q.modules.size;

  // Heart bounding box in heart coordinates: x[-1.15, 1.15], y[-1.2, 1.3] (y up)
  const hx0 = -1.15,
    hx1 = 1.15,
    hy0 = -1.2,
    hy1 = 1.3;
  const W = hx1 - hx0,
    H = hy1 - hy0;
  const px = (size * 0.72) / W; // px per heart unit (heart ~72% width)
  const heartW = W * px,
    heartH = H * px;
  const ox = (size - heartW) / 2,
    oy = (size - heartH) / 2;
  const coreW = heartW * coreFrac;
  const mod = coreW / n;
  const cx = size / 2,
    cy = oy + heartH * 0.4;
  const x0 = cx - coreW / 2,
    y0 = cy - coreW / 2;

  const r = rng(url);
  const gx0 = Math.floor((ox - x0) / mod) - 1,
    gx1 = Math.ceil((ox + heartW - x0) / mod) + 1;
  const gy0 = Math.floor((oy - y0) / mod) - 1,
    gy1 = Math.ceil((oy + heartH - y0) / mod) + 1;

  const modules: QrModule[] = [];

  for (let gy = gy0; gy <= gy1; gy++) {
    for (let gx = gx0; gx <= gx1; gx++) {
      const mx = x0 + gx * mod + mod / 2,
        my = y0 + gy * mod + mod / 2;
      const hxu = (mx - ox) / px + hx0,
        hyu = hy1 - (my - oy) / px;
      if (!inHeart(hxu, hyu)) continue;

      const inCore = gx >= 0 && gy >= 0 && gx < n && gy < n;
      const inMargin =
        gx >= -margin && gy >= -margin && gx < n + margin && gy < n + margin;

      let dark = false;
      if (inCore) {
        dark = q.modules.get(gx, gy) === 1;
      } else if (inMargin) {
        dark = false;
      } else {
        dark = r() < density;
      }

      if (dark) {
        modules.push({
          gx,
          gy,
          mx,
          my,
          inCore,
          isFinder: inCore && isFinderPattern(gx, gy, n),
        });
      }
    }
  }

  return { url, size, n, mod, modules };
}

export function renderHeartQrPng(
  url: string,
  size: number,
  opts: HeartQrOptions = {},
): PNG {
  const { fgColor = "#E4325B", bgColor = "#F7F4EF" } = opts;
  const [fr, fg, fb] = parseHexColor(fgColor);
  const [br, bg, bb] = parseHexColor(bgColor);

  const data = getHeartQrModules(url, size, opts);
  const png = new PNG({ width: size, height: size });

  // Fill background
  for (let i = 0; i < size * size * 4; i += 4) {
    png.data[i] = br;
    png.data[i + 1] = bg;
    png.data[i + 2] = bb;
    png.data[i + 3] = 255;
  }

  const setPixel = (x: number, y: number, r: number, g: number, b: number) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const idx = (y * size + x) * 4;
    png.data[idx] = r;
    png.data[idx + 1] = g;
    png.data[idx + 2] = b;
    png.data[idx + 3] = 255;
  };

  const halfMod = data.mod / 2;
  for (const m of data.modules) {
    const xStart = Math.floor(m.mx - halfMod);
    const xEnd = Math.ceil(m.mx + halfMod);
    const yStart = Math.floor(m.my - halfMod);
    const yEnd = Math.ceil(m.my + halfMod);

    for (let y = yStart; y < yEnd; y++) {
      for (let x = xStart; x < xEnd; x++) {
        setPixel(x, y, fr, fg, fb);
      }
    }
  }

  return png;
}

export function renderHeartQrSvg(
  url: string,
  size: number,
  opts: HeartQrOptions = {},
): string {
  const { fgColor = "#E4325B", bgColor = "#F7F4EF" } = opts;
  const data = getHeartQrModules(url, size, opts);
  const halfMod = data.mod / 2;

  const rects = data.modules
    .map(
      (m) =>
        `<rect x="${(m.mx - halfMod).toFixed(2)}" y="${(m.my - halfMod).toFixed(2)}" width="${data.mod.toFixed(2)}" height="${data.mod.toFixed(2)}" rx="${(data.mod * 0.15).toFixed(2)}" fill="${fgColor}" />`,
    )
    .join("\n    ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${bgColor}" rx="${(size * 0.08).toFixed(1)}" />
  <g id="heart-qr-modules">
    ${rects}
  </g>
</svg>`;
}

export function renderClassicQrPng(
  url: string,
  size: number,
  opts: HeartQrOptions = {},
): PNG {
  const { fgColor = "#000000", bgColor = "#FFFFFF", ec = "H" } = opts;
  const [fr, fg, fb] = parseHexColor(fgColor);
  const [br, bg, bb] = parseHexColor(bgColor);

  const q = QRCode.create(url, { errorCorrectionLevel: ec });
  const n = q.modules.size;
  const margin = 4;
  const total = n + margin * 2;
  const mod = size / total;

  const png = new PNG({ width: size, height: size });
  for (let i = 0; i < size * size * 4; i += 4) {
    png.data[i] = br;
    png.data[i + 1] = bg;
    png.data[i + 2] = bb;
    png.data[i + 3] = 255;
  }

  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      if (q.modules.get(gx, gy) === 1) {
        const xStart = Math.floor((gx + margin) * mod);
        const xEnd = Math.ceil((gx + margin + 1) * mod);
        const yStart = Math.floor((gy + margin) * mod);
        const yEnd = Math.ceil((gy + margin + 1) * mod);

        for (let y = yStart; y < yEnd; y++) {
          for (let x = xStart; x < xEnd; x++) {
            if (x >= 0 && y >= 0 && x < size && y < size) {
              const idx = (y * size + x) * 4;
              png.data[idx] = fr;
              png.data[idx + 1] = fg;
              png.data[idx + 2] = fb;
              png.data[idx + 3] = 255;
            }
          }
        }
      }
    }
  }

  return png;
}

export function renderClassicQrSvg(
  url: string,
  size: number,
  opts: HeartQrOptions = {},
): string {
  const { fgColor = "#000000", bgColor = "#FFFFFF", ec = "H" } = opts;
  const q = QRCode.create(url, { errorCorrectionLevel: ec });
  const n = q.modules.size;
  const margin = 4;
  const total = n + margin * 2;
  const mod = size / total;

  const rects: string[] = [];
  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      if (q.modules.get(gx, gy) === 1) {
        rects.push(
          `<rect x="${((gx + margin) * mod).toFixed(2)}" y="${((gy + margin) * mod).toFixed(2)}" width="${mod.toFixed(2)}" height="${mod.toFixed(2)}" fill="${fgColor}" />`,
        );
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${bgColor}" />
  <g id="classic-qr-modules">
    ${rects.join("\n    ")}
  </g>
</svg>`;
}
