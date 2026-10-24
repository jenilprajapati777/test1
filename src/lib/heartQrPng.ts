import QRCode from "qrcode";
import { PNG } from "pngjs";
import {
  HeartQrOptions,
  getHeartQrModules,
  parseHexColor,
} from "./heartQr";

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
