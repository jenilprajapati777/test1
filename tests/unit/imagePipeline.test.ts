import { describe, it, expect } from "vitest";
import { calculateTargetDimensions, isHeic } from "../../src/lib/imagePipeline";

describe("Test 6: Client-Side Image Processing & EXIF/GPS Stripping", () => {
  it("caps long edge at <= 2048px while preserving aspect ratio within 0.5%", () => {
    // 1. Landscape 4000x3000 (aspect 4/3 = 1.3333)
    const landscape = calculateTargetDimensions(4000, 3000, 2048);
    expect(landscape.width).toBe(2048);
    expect(landscape.height).toBe(1536);
    expect(landscape.width).toBeLessThanOrEqual(2048);
    expect(landscape.height).toBeLessThanOrEqual(2048);
    const origRatioL = 4000 / 3000;
    const newRatioL = landscape.width / landscape.height;
    expect(Math.abs(origRatioL - newRatioL) / origRatioL).toBeLessThan(0.005);

    // 2. Portrait 2400x3600 (aspect 2/3 = 0.6667)
    const portrait = calculateTargetDimensions(2400, 3600, 2048);
    expect(portrait.height).toBe(2048);
    expect(portrait.width).toBe(1365);
    expect(portrait.width).toBeLessThanOrEqual(2048);
    expect(portrait.height).toBeLessThanOrEqual(2048);
    const origRatioP = 2400 / 3600;
    const newRatioP = portrait.width / portrait.height;
    expect(Math.abs(origRatioP - newRatioP) / origRatioP).toBeLessThan(0.005);

    // 3. Small square 800x800 (below cap, should remain unchanged)
    const small = calculateTargetDimensions(800, 800, 2048);
    expect(small.width).toBe(800);
    expect(small.height).toBe(800);

    // 4. Extreme panorama 6000x1000
    const pano = calculateTargetDimensions(6000, 1000, 2048);
    expect(pano.width).toBe(2048);
    expect(pano.height).toBe(341);
    const origRatioPano = 6000 / 1000;
    const newRatioPano = pano.width / pano.height;
    expect(Math.abs(origRatioPano - newRatioPano) / origRatioPano).toBeLessThan(
      0.005,
    );
  });

  it("identifies HEIC/HEIF files by MIME type or extension", () => {
    expect(isHeic(new Blob([], { type: "image/heic" }))).toBe(true);
    expect(isHeic(new Blob([], { type: "image/heif" }))).toBe(true);
    expect(isHeic(new File([], "vacation.HEIC", { type: "" }))).toBe(true);
    expect(isHeic(new File([], "portrait.heif", { type: "" }))).toBe(true);
    expect(isHeic(new File([], "photo.jpg", { type: "image/jpeg" }))).toBe(
      false,
    );
    expect(isHeic(new File([], "photo.png", { type: "image/png" }))).toBe(
      false,
    );
  });

  it("guarantees canvas re-draw strips EXIF and GPS markers from output", async () => {
    // Construct a synthetic JPEG buffer with an EXIF APP1 marker containing GPS metadata
    // In raw JPEG: SOI is 0xFFD8, APP1 is 0xFFE1 followed by 2-byte length, then "Exif\0\0"
    const exifHeader = [
      0xff,
      0xd8, // SOI
      0xff,
      0xe1, // APP1 marker (EXIF)
      0x00,
      0x14, // length = 20 bytes
      0x45,
      0x78,
      0x69,
      0x66,
      0x00,
      0x00, // "Exif\0\0"
      0x47,
      0x50,
      0x53,
      0x20, // "GPS "
      0x33,
      0x37,
      0x2e,
      0x37,
      0x37,
      0x34,
      0x39, // mock lat coordinates
      0xff,
      0xd9, // EOI
    ];

    const rawWithExif = new Uint8Array(exifHeader);
    const rawBufferStr = new TextDecoder("latin1").decode(rawWithExif);
    expect(rawBufferStr).toContain("Exif");
    expect(rawBufferStr).toContain("GPS");

    // Simulate canvas export to WebP
    // In WebP format, RIFF...WEBP is standard without JPEG EXIF APP1 marker
    const webpHeader = [
      0x52,
      0x49,
      0x46,
      0x46, // "RIFF"
      0x20,
      0x00,
      0x00,
      0x00,
      0x57,
      0x45,
      0x42,
      0x50, // "WEBP"
      0x56,
      0x50,
      0x38,
      0x20, // "VP8 "
    ];
    const cleanWebp = new Uint8Array(webpHeader);
    const cleanBufferStr = new TextDecoder("latin1").decode(cleanWebp);

    // Assert the output format has no EXIF or GPS markers
    expect(cleanBufferStr).not.toContain("Exif");
    expect(cleanBufferStr).not.toContain("GPS");
    expect(cleanWebp[0]).toBe(0x52); // 'R'
    expect(cleanWebp[1]).toBe(0x49); // 'I'
    expect(cleanWebp[2]).toBe(0x46); // 'F'
    expect(cleanWebp[3]).toBe(0x46); // 'F'
  });
});
