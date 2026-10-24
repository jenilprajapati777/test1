/**
 * Browser-native Share Card canvas renderer.
 * Operates purely in the browser using HTML5 Canvas 2D API (no Node.js/pngjs dependencies).
 */

export interface BrowserShareCardOptions {
  title: string;
  fromName: string;
  toName: string;
  qrSvg: string;
  isStory?: boolean;
}

export async function generateShareCardBlob(
  options: BrowserShareCardOptions
): Promise<Blob> {
  const isStory = Boolean(options.isStory);
  const width = 1080;
  const height = isStory ? 1920 : 1080;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  if (isStory) {
    // 1. Dark nocturnal background
    ctx.fillStyle = '#07080F';
    ctx.fillRect(0, 0, width, height);

    // Warm radial glow in center
    const glow = ctx.createRadialGradient(
      width / 2,
      height / 2,
      50,
      width / 2,
      height / 2,
      width * 0.7
    );
    glow.addColorStop(0, 'rgba(58, 51, 32, 0.45)');
    glow.addColorStop(1, 'rgba(7, 8, 15, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Draw 860x860 card in center
    const cardSize = 860;
    const cardX = (width - cardSize) / 2;
    const cardY = (height - cardSize) / 2;

    drawCardRect(ctx, cardX, cardY, cardSize, cardSize, 64);
    await drawCardContent(ctx, cardX, cardY, cardSize, cardSize, options);
  } else {
    // Square 1080x1080 card
    drawCardRect(ctx, 40, 40, 1000, 1000, 72);
    await drawCardContent(ctx, 40, 40, 1000, 1000, options);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate PNG blob from canvas'));
    }, 'image/png');
  });
}

function drawCardRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.save();
  ctx.fillStyle = '#F7F4EF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 12;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

async function drawCardContent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  options: BrowserShareCardOptions
) {
  ctx.save();
  ctx.textAlign = 'center';

  // 1. Eyebrow
  ctx.fillStyle = 'rgba(14, 14, 16, 0.6)';
  ctx.font = '600 20px "Inter", sans-serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('A PERMANENT EXHIBITION', x + w / 2, y + 90);

  // 2. Title
  ctx.fillStyle = '#0E0E10';
  ctx.font = '600 48px "Instrument Serif", Georgia, serif';
  ctx.fillText(options.title || 'Our Museum', x + w / 2, y + 155);

  // 3. QR Image
  if (options.qrSvg) {
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(options.qrSvg);
    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = svgUrl;
    });

    const qrSize = Math.floor(w * 0.58);
    const qrX = x + (w - qrSize) / 2;
    const qrY = y + 200;
    ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
  }

  // 4. Pointing Hand & "Scan this"
  ctx.fillStyle = '#E4325B';
  ctx.font = '600 28px "Inter", sans-serif';
  ctx.fillText('☝ Scan this', x + w / 2, y + h - 110);

  // 5. Dedication
  ctx.fillStyle = 'rgba(14, 14, 16, 0.7)';
  ctx.font = 'italic 26px "Instrument Serif", Georgia, serif';
  ctx.fillText(
    `From ${options.fromName || 'Ethan'} │ To ${options.toName || 'Maya'}`,
    x + w / 2,
    y + h - 60
  );

  ctx.restore();
}
