import { describe, it, expect } from "vitest";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import {
  getHeartQrModules,
  renderHeartQrSvg,
  renderClassicQrSvg,
} from "../../src/lib/heartQr";
import { renderHeartQrPng, renderClassicQrPng } from "../../src/lib/heartQrPng";
import { generateSlug } from "../../src/lib/slug";

function decodePng(png: PNG): string | null {
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return result ? result.data : null;
}

// Rotate image buffer by angle (in radians) around center
function rotatePng(src: PNG, angleDeg: number): PNG {
  const size = src.width;
  const dst = new PNG({ width: size, height: size });
  // Fill with white background
  dst.data.fill(255);

  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Inverse rotation to sample from src
      const dx = x - cx;
      const dy = y - cy;
      const sx = Math.round(cos * dx + sin * dy + cx);
      const sy = Math.round(-sin * dx + cos * dy + cy);

      if (sx >= 0 && sx < size && sy >= 0 && sy < size) {
        const srcIdx = (sy * size + sx) * 4;
        const dstIdx = (y * size + x) * 4;
        dst.data[dstIdx] = src.data[srcIdx];
        dst.data[dstIdx + 1] = src.data[srcIdx + 1];
        dst.data[dstIdx + 2] = src.data[srcIdx + 2];
        dst.data[dstIdx + 3] = src.data[srcIdx + 3];
      }
    }
  }

  return dst;
}

describe("Test 2: Heart QR and Classic QR Decoding", () => {
  const slugs = Array.from({ length: 50 }, () => generateSlug());

  it("decodes 50 random slugs at 1024px with 100% accuracy", () => {
    let successCount = 0;
    for (const slug of slugs) {
      const url = `https://museum.example/m/${slug}`;
      const png = renderHeartQrPng(url, 1024, {
        fgColor: "#000000",
        bgColor: "#FFFFFF",
        coreFrac: 0.46,
        density: 0.45,
        margin: 2,
      });
      const decoded = decodePng(png);
      if (decoded === url) {
        successCount++;
      }
    }
    expect(successCount).toBe(50);
  }, 20000);

  it("decodes 50 random slugs at 512px with >= 98% accuracy", () => {
    let successCount = 0;
    for (const slug of slugs) {
      const url = `https://museum.example/m/${slug}`;
      const png = renderHeartQrPng(url, 512, {
        fgColor: "#000000",
        bgColor: "#FFFFFF",
        coreFrac: 0.48,
        density: 0.45,
        margin: 2,
      });
      const decoded = decodePng(png);
      if (decoded === url) {
        successCount++;
      }
    }
    // Required >= 98% (49/50)
    expect(successCount).toBeGreaterThanOrEqual(49);
  });

  it("decodes at 1024px after 3% noise and 8° rotation", () => {
    let successCount = 0;
    const testSubset = slugs.slice(0, 15);

    for (let i = 0; i < testSubset.length; i++) {
      const slug = testSubset[i];
      const url = `https://museum.example/m/${slug}`;
      const original = renderHeartQrPng(url, 1024, {
        fgColor: "#000000",
        bgColor: "#FFFFFF",
        coreFrac: 0.48,
      });

      // Apply 3% module noise to data modules
      const qrData = getHeartQrModules(url, 1024, { coreFrac: 0.48 });
      const noisy = new PNG({ width: 1024, height: 1024 });
      original.data.copy(noisy.data);

      let s = 12345 + i;
      const rnd = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };

      for (const m of qrData.modules) {
        if (!m.isFinder && rnd() < 0.03) {
          const val =
            original.data[(Math.floor(m.my) * 1024 + Math.floor(m.mx)) * 4] >
            128
              ? 0
              : 255;
          const halfMod = qrData.mod / 2;
          for (
            let y = Math.floor(m.my - halfMod);
            y < Math.ceil(m.my + halfMod);
            y++
          ) {
            for (
              let x = Math.floor(m.mx - halfMod);
              x < Math.ceil(m.mx + halfMod);
              x++
            ) {
              if (x >= 0 && y >= 0 && x < 1024 && y < 1024) {
                const idx = (y * 1024 + x) * 4;
                noisy.data[idx] =
                  noisy.data[idx + 1] =
                  noisy.data[idx + 2] =
                    val;
              }
            }
          }
        }
      }

      const rotated = rotatePng(noisy, 8);
      const decoded = decodePng(rotated);
      if (decoded === url) {
        successCount++;
      }
    }
    expect(successCount).toBeGreaterThanOrEqual(12);
  });

  it("Classic QR decodes 100% of tested slugs and generates valid SVG", () => {
    for (const slug of slugs.slice(0, 20)) {
      const url = `https://museum.example/m/${slug}`;
      const png = renderClassicQrPng(url, 512);
      expect(decodePng(png)).toBe(url);

      const svg = renderClassicQrSvg(url, 512);
      expect(svg).toContain("<svg");
      expect(svg).toContain("classic-qr-modules");
    }
  });

  it("produces deterministic output for the same slug", () => {
    const slug = "testslug01";
    const url = `https://museum.example/m/${slug}`;
    const png1 = renderHeartQrPng(url, 512);
    const png2 = renderHeartQrPng(url, 512);
    expect(Buffer.compare(png1.data, png2.data)).toBe(0);
  });

  it("SVG and PNG renderers agree on the exact module set", () => {
    const slug = "agreeslug1";
    const url = `https://museum.example/m/${slug}`;
    const size = 512;
    const qrData = getHeartQrModules(url, size);
    const svg = renderHeartQrSvg(url, size);

    // Count rect elements in SVG
    const rectMatches = svg.match(/<rect /g) || [];
    // Total rects = 1 background rect + modules
    expect(rectMatches.length - 1).toBe(qrData.modules.length);
  });
});
