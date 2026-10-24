import { PNG } from "pngjs";
import { getHeartQrModules } from "./heartQr";
import QRCode from "qrcode";

export interface ShareCardOptions {
  url: string;
  isClassic?: boolean;
  fromName?: string;
  toName?: string;
  caption?: string;
}

// Helper to draw rounded rectangle in pure RGBA buffer
function drawRoundedRect(
  buffer: Uint8ClampedArray | Buffer,
  stride: number,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: [number, number, number, number],
) {
  for (let py = Math.floor(y); py < Math.ceil(y + h); py++) {
    for (let px = Math.floor(x); px < Math.ceil(x + w); px++) {
      let inside = true;
      if (px < x + r && py < y + r) {
        const dx = px - (x + r),
          dy = py - (y + r);
        inside = dx * dx + dy * dy <= r * r;
      } else if (px >= x + w - r && py < y + r) {
        const dx = px - (x + w - r),
          dy = py - (y + r);
        inside = dx * dx + dy * dy <= r * r;
      } else if (px < x + r && py >= y + h - r) {
        const dx = px - (x + r),
          dy = py - (y + h - r);
        inside = dx * dx + dy * dy <= r * r;
      } else if (px >= x + w - r && py >= y + h - r) {
        const dx = px - (x + w - r),
          dy = py - (y + h - r);
        inside = dx * dx + dy * dy <= r * r;
      }

      if (inside) {
        const idx = (py * stride + px) * 4;
        buffer[idx] = color[0];
        buffer[idx + 1] = color[1];
        buffer[idx + 2] = color[2];
        buffer[idx + 3] = color[3];
      }
    }
  }
}

/**
 * Render 1080x1080 Share Card PNG.
 */
export function renderCardPng(options: ShareCardOptions): PNG {
  const size = 1080;
  const png = new PNG({ width: size, height: size });
  const [cr, cg, cb] = [247, 244, 239]; // #F7F4EF (--card)
  const [hr, hg, hb] = [228, 50, 91]; // #E4325B (--heart)

  // 1. Fill card background
  const radius = size * 0.08; // ~86px
  // Clear to transparent first
  png.data.fill(0);
  drawRoundedRect(png.data, size, 0, 0, size, size, radius, [cr, cg, cb, 255]);

  // 2. Render Heart QR or Classic QR inside
  if (options.isClassic) {
    const q = QRCode.create(options.url, { errorCorrectionLevel: "H" });
    const n = q.modules.size;
    const qrSize = size * 0.62;
    const mod = qrSize / n;
    const ox = (size - qrSize) / 2;
    const oy = (size - qrSize) / 2 - 30;

    for (let gy = 0; gy < n; gy++) {
      for (let gx = 0; gx < n; gx++) {
        if (q.modules.get(gx, gy) === 1) {
          const x0 = Math.floor(ox + gx * mod);
          const x1 = Math.ceil(ox + (gx + 1) * mod);
          const y0 = Math.floor(oy + gy * mod);
          const y1 = Math.ceil(oy + (gy + 1) * mod);
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              const idx = (y * size + x) * 4;
              png.data[idx] = hr;
              png.data[idx + 1] = hg;
              png.data[idx + 2] = hb;
              png.data[idx + 3] = 255;
            }
          }
        }
      }
    }
  } else {
    // Heart QR
    const qrSize = size * 0.88;
    const ox = (size - qrSize) / 2;
    const oy = (size - qrSize) / 2 - 36;
    const qrData = getHeartQrModules(options.url, qrSize, {
      ec: "H",
      density: 0.45,
      coreFrac: 0.46,
      fgColor: "#E4325B",
    });

    const halfMod = qrData.mod / 2;
    for (const m of qrData.modules) {
      const x0 = Math.floor(ox + m.mx - halfMod);
      const x1 = Math.ceil(ox + m.mx + halfMod);
      const y0 = Math.floor(oy + m.my - halfMod);
      const y1 = Math.ceil(oy + m.my + halfMod);

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          if (x >= 0 && y >= 0 && x < size && y < size) {
            const idx = (y * size + x) * 4;
            png.data[idx] = hr;
            png.data[idx + 1] = hg;
            png.data[idx + 2] = hb;
            png.data[idx + 3] = 255;
          }
        }
      }
    }
  }

  return png;
}

/**
 * Render 1080x1920 Story PNG.
 */
export function renderStoryPng(options: ShareCardOptions): PNG {
  const width = 1080;
  const height = 1920;
  const png = new PNG({ width, height });

  // 1. Dark navy background #07080F
  for (let i = 0; i < width * height * 4; i += 4) {
    png.data[i] = 7;
    png.data[i + 1] = 8;
    png.data[i + 2] = 15;
    png.data[i + 3] = 255;
  }

  // 2. Warm radial glow in center
  const cx = width / 2;
  const cy = height / 2;
  const maxR = width * 0.6;
  for (let py = Math.floor(cy - maxR); py < Math.ceil(cy + maxR); py++) {
    for (let px = Math.floor(cx - maxR); px < Math.ceil(cx + maxR); px++) {
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist < maxR) {
        const factor = Math.cos((dist / maxR) * (Math.PI / 2));
        const idx = (py * width + px) * 4;
        png.data[idx] = Math.min(
          255,
          png.data[idx] + Math.floor(58 * factor * 0.4),
        );
        png.data[idx + 1] = Math.min(
          255,
          png.data[idx + 1] + Math.floor(51 * factor * 0.4),
        );
        png.data[idx + 2] = Math.min(
          255,
          png.data[idx + 2] + Math.floor(32 * factor * 0.4),
        );
      }
    }
  }

  // 3. Render 860x860 card in the center
  const cardSize = 860;
  const cardOx = (width - cardSize) / 2;
  const cardOy = (height - cardSize) / 2;
  const cardPng = renderCardPng(options);

  // Resize / blit cardPng onto story
  for (let cy_ = 0; cy_ < cardSize; cy_++) {
    for (let cx_ = 0; cx_ < cardSize; cx_++) {
      const srcX = Math.floor((cx_ / cardSize) * 1080);
      const srcY = Math.floor((cy_ / cardSize) * 1080);
      const srcIdx = (srcY * 1080 + srcX) * 4;
      const alpha = cardPng.data[srcIdx + 3] / 255;

      if (alpha > 0) {
        const dstX = cardOx + cx_;
        const dstY = cardOy + cy_;
        const dstIdx = (dstY * width + dstX) * 4;

        png.data[dstIdx] = Math.floor(
          cardPng.data[srcIdx] * alpha + png.data[dstIdx] * (1 - alpha),
        );
        png.data[dstIdx + 1] = Math.floor(
          cardPng.data[srcIdx + 1] * alpha + png.data[dstIdx + 1] * (1 - alpha),
        );
        png.data[dstIdx + 2] = Math.floor(
          cardPng.data[srcIdx + 2] * alpha + png.data[dstIdx + 2] * (1 - alpha),
        );
      }
    }
  }

  return png;
}
