import * as THREE from "three";

// Cache generated procedural textures to avoid redundant memory allocations
const textureCache = new Map<string, THREE.Texture>();

/**
 * Procedural fine micro-pattern floor texture.
 */
export function getFloorTexture(): THREE.Texture {
  if (textureCache.has("floor")) return textureCache.get("floor")!;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Base near-white
  ctx.fillStyle = "#F1EFEA";
  ctx.fillRect(0, 0, size, size);

  // Subtle terrazzo-like fine micro speckles
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const speckle = (Math.random() - 0.5) * 14;
    data[i] = Math.min(255, Math.max(0, data[i] + speckle));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + speckle));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + speckle));
  }
  ctx.putImageData(imgData, 0, 0);

  // Faint subtle 2m grid lines
  ctx.strokeStyle = "rgba(0,0,0,0.025)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 12);
  textureCache.set("floor", texture);
  return texture;
}

/**
 * Procedural ceiling tile-grid texture (matte black with thin grid).
 */
export function getCeilingTexture(): THREE.Texture {
  if (textureCache.has("ceiling")) return textureCache.get("ceiling")!;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0A0A0B";
  ctx.fillRect(0, 0, size, size);

  // Thin tile grid
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 26);
  textureCache.set("ceiling", texture);
  return texture;
}

/**
 * Procedural limestone block texture with noise for the facade.
 */
export function getLimestoneTexture(): THREE.Texture {
  if (textureCache.has("limestone")) return textureCache.get("limestone")!;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#DCD6C8";
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Ashlar block mortar lines
  ctx.strokeStyle = "rgba(100,90,75,0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size / 2);
  ctx.strokeRect(size / 2, size / 2, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  textureCache.set("limestone", texture);
  return texture;
}

/**
 * Additive radial spotlight hot-spot texture.
 */
export function getSpotlightHotspotTexture(): THREE.Texture {
  if (textureCache.has("spotlight")) return textureCache.get("spotlight")!;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const radGrad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  radGrad.addColorStop(0, "rgba(255, 248, 220, 0.45)");
  radGrad.addColorStop(0.4, "rgba(255, 240, 200, 0.22)");
  radGrad.addColorStop(1, "rgba(255, 240, 200, 0)");

  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set("spotlight", texture);
  return texture;
}

/**
 * 3-step toon shading ramp texture.
 */
export function getToonGradientMap(): THREE.Texture {
  if (textureCache.has("toon")) return textureCache.get("toon")!;
  const colors = new Uint8Array([70, 160, 255]);
  const texture = new THREE.DataTexture(colors, 3, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  textureCache.set("toon", texture);
  return texture;
}
