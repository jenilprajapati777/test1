export interface AABB {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
  id?: string;
}

export interface Vec2 {
  x: number;
  z: number;
}

/**
 * Clamps value between min and max.
 */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Resolves circle vs single AABB. If overlapping, pushes circle out along the minimum penetration axis.
 */
export function resolveCircleAABB(
  pos: Vec2,
  radius: number,
  box: AABB,
): { pos: Vec2; collided: boolean } {
  const closestX = clamp(pos.x, box.minX, box.maxX);
  const closestZ = clamp(pos.z, box.minZ, box.maxZ);

  const distX = pos.x - closestX;
  const distZ = pos.z - closestZ;
  const distSq = distX * distX + distZ * distZ;

  if (distSq < radius * radius) {
    const dist = Math.sqrt(distSq);
    if (dist > 1e-6) {
      const overlap = radius - dist;
      return {
        pos: {
          x: pos.x + (distX / dist) * overlap,
          z: pos.z + (distZ / dist) * overlap,
        },
        collided: true,
      };
    } else {
      // Circle center inside box: find closest edge and push out
      const left = Math.abs(pos.x - box.minX);
      const right = Math.abs(box.maxX - pos.x);
      const top = Math.abs(pos.z - box.minZ);
      const bottom = Math.abs(box.maxZ - pos.z);
      const minEdge = Math.min(left, right, top, bottom);

      let outX = pos.x;
      let outZ = pos.z;

      if (minEdge === left) outX = box.minX - radius;
      else if (minEdge === right) outX = box.maxX + radius;
      else if (minEdge === top) outZ = box.minZ - radius;
      else outZ = box.maxZ + radius;

      return {
        pos: { x: outX, z: outZ },
        collided: true,
      };
    }
  }

  return { pos, collided: false };
}

/**
 * Checks if a circle at pos with radius intersects any collider.
 */
export function isIntersecting(
  pos: Vec2,
  radius: number,
  colliders: AABB[],
): boolean {
  for (const box of colliders) {
    const closestX = clamp(pos.x, box.minX, box.maxX);
    const closestZ = clamp(pos.z, box.minZ, box.maxZ);
    const distX = pos.x - closestX;
    const distZ = pos.z - closestZ;
    if (distX * distX + distZ * distZ < (radius - 1e-4) * (radius - 1e-4)) {
      return true;
    }
  }
  return false;
}

/**
 * Move with continuous substep collision resolution to prevent tunnelling at high speeds.
 * Slides along walls by resolving X and Z axes independently.
 */
export function moveWithCollision(
  startPos: Vec2,
  delta: Vec2,
  radius: number,
  colliders: AABB[],
  bounds?: { minX: number; minZ: number; maxX: number; maxZ: number },
): Vec2 {
  const stepDist = Math.hypot(delta.x, delta.z);
  // Max substep is fraction of radius to prevent tunnelling
  const maxSubstep = radius * 0.4;
  const numSteps = Math.max(1, Math.ceil(stepDist / maxSubstep));

  const dx = delta.x / numSteps;
  const dz = delta.z / numSteps;

  let current: Vec2 = { ...startPos };

  for (let s = 0; s < numSteps; s++) {
    // 1. Try moving along X
    let tryX: Vec2 = { x: current.x + dx, z: current.z };
    for (const box of colliders) {
      const res = resolveCircleAABB(tryX, radius, box);
      tryX = res.pos;
    }

    // 2. Try moving along Z
    let tryZ: Vec2 = { x: tryX.x, z: tryX.z + dz };
    for (const box of colliders) {
      const res = resolveCircleAABB(tryZ, radius, box);
      tryZ = res.pos;
    }

    // 3. Final relaxation across all colliders
    for (let iter = 0; iter < 3; iter++) {
      let anyCollided = false;
      for (const box of colliders) {
        const res = resolveCircleAABB(tryZ, radius, box);
        if (res.collided) {
          tryZ = res.pos;
          anyCollided = true;
        }
      }
      if (!anyCollided) break;
    }

    // 4. Enforce room boundaries
    if (bounds) {
      tryZ.x = clamp(tryZ.x, bounds.minX + radius, bounds.maxX - radius);
      tryZ.z = clamp(tryZ.z, bounds.minZ + radius, bounds.maxZ - radius);
    }

    current = tryZ;
  }

  return current;
}
