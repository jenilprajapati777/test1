import { Artwork } from "../types/museum";
import { AABB, Vec2 } from "./collision";

export interface PlacedArtwork {
  artwork: Artwork;
  index: number;
  isHero: boolean;
  position: [number, number, number]; // [x, y, z] center of artwork
  rotation: [number, number, number]; // Euler angles [rx, ry, rz]
  size: [number, number]; // [width, height] in meters
  viewPosition: [number, number, number]; // Where avatar stands to view
  viewCameraPosition: [number, number, number]; // Where camera dollys in viewing mode
}

export interface FeatureWall {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number, number]; // [w, h, d]
  hasHotspot: boolean;
  hasRealSpotlight: boolean;
}

export interface Pedestal {
  position: [number, number, number];
  size: [number, number, number]; // 1x1x0.9m
  plaquePosition: [number, number, number];
  plaqueRotation: [number, number, number]; // tilted ~20 deg
  viewPosition: [number, number, number];
}

export interface CinemaNook {
  present: boolean;
  screenPosition: [number, number, number];
  screenSize: [number, number]; // 3.2 x 1.8m
  benchPosition: [number, number, number];
  seats: [Vec2, Vec2]; // seat 0 (left) and seat 1 (right)
  viewCameraPosition: [number, number, number];
}

export interface RoomPlan {
  width: number;
  length: number;
  height: number;
  spawnPoint: { x: number; y: number; z: number; ry: number };
  colliders: AABB[];
  featureWalls: FeatureWall[];
  pedestal: Pedestal;
  cinemaNook: CinemaNook;
  artworks: PlacedArtwork[];
}

/**
 * Pure deterministic layout generator.
 * (artworks[]) -> RoomPlan
 */
export function generateRoomLayout(artworks: Artwork[]): RoomPlan {
  const N = artworks.length;

  // Determine room dimensions based on artwork count
  let width = 16;
  let length = 26;
  if (N === 0) {
    width = 12;
    length = 16;
  } else if (N <= 3) {
    width = 12;
    length = 18;
  } else if (N <= 8) {
    width = 14;
    length = 22;
  }

  const height = 5.0; // 5m ceiling
  const halfW = width / 2;
  const halfL = length / 2;

  // Spawn near the entrance door (south wall)
  const spawnPoint = {
    x: 0,
    y: 0,
    z: -halfL + 2.5,
    ry: 0, // facing north into the gallery
  };

  const colliders: AABB[] = [];

  // 1. Perimeter Wall Colliders
  const wallThick = 0.5;
  // South wall (entrance) with door opening
  colliders.push({
    minX: -halfW,
    minZ: -halfL - wallThick,
    maxX: -1.2,
    maxZ: -halfL,
    id: "wall-south-left",
  });
  colliders.push({
    minX: 1.2,
    minZ: -halfL - wallThick,
    maxX: halfW,
    maxZ: -halfL,
    id: "wall-south-right",
  });
  // North wall
  colliders.push({
    minX: -halfW,
    minZ: halfL,
    maxX: halfW,
    maxZ: halfL + wallThick,
    id: "wall-north",
  });
  // West wall
  colliders.push({
    minX: -halfW - wallThick,
    minZ: -halfL,
    maxX: -halfW,
    maxZ: halfL,
    id: "wall-west",
  });
  // East wall
  colliders.push({
    minX: halfW,
    minZ: -halfL,
    maxX: halfW + wallThick,
    maxZ: halfL,
    id: "wall-east",
  });

  // 2. Hero Wall (freestanding black feature wall on low white plinth)
  const heroWallPos: [number, number, number] = [0, 2.1, -halfL + 7.5];
  const heroWallSize: [number, number, number] = [6.0, 4.2, 0.4];
  const featureWalls: FeatureWall[] = [
    {
      id: "hero-wall",
      position: heroWallPos,
      rotation: [0, 0, 0],
      size: heroWallSize,
      hasHotspot: true,
      hasRealSpotlight: true,
    },
  ];

  // Plinth collider for hero wall
  colliders.push({
    minX: heroWallPos[0] - heroWallSize[0] / 2 - 0.2,
    minZ: heroWallPos[2] - heroWallSize[2] / 2 - 0.2,
    maxX: heroWallPos[0] + heroWallSize[0] / 2 + 0.2,
    maxZ: heroWallPos[2] + heroWallSize[2] / 2 + 0.2,
    id: "hero-wall-plinth",
  });

  // 3. Pedestal in front of hero wall
  const pedestalPos: [number, number, number] = [0, 0.45, heroWallPos[2] - 2.5];
  const pedestalSize: [number, number, number] = [1.0, 0.9, 1.0];
  colliders.push({
    minX: pedestalPos[0] - pedestalSize[0] / 2,
    minZ: pedestalPos[2] - pedestalSize[2] / 2,
    maxX: pedestalPos[0] + pedestalSize[0] / 2,
    maxZ: pedestalPos[2] + pedestalSize[2] / 2,
    id: "pedestal",
  });

  const pedestal: Pedestal = {
    position: pedestalPos,
    size: pedestalSize,
    plaquePosition: [pedestalPos[0], pedestalPos[1] + 0.46, pedestalPos[2]],
    plaqueRotation: [-20 * (Math.PI / 180), 0, 0], // tilted ~20 deg facing south
    viewPosition: [pedestalPos[0], 0, pedestalPos[2] - 1.3],
  };

  // Second feature wall if N > 8
  if (N > 8) {
    const secondWallPos: [number, number, number] = [0, 2.1, 4.0];
    const secondWallSize: [number, number, number] = [5.5, 4.2, 0.4];
    featureWalls.push({
      id: "second-wall",
      position: secondWallPos,
      rotation: [0, 0, 0],
      size: secondWallSize,
      hasHotspot: true,
      hasRealSpotlight: false,
    });
    colliders.push({
      minX: secondWallPos[0] - secondWallSize[0] / 2 - 0.2,
      minZ: secondWallPos[2] - secondWallSize[2] / 2 - 0.2,
      maxX: secondWallPos[0] + secondWallSize[0] / 2 + 0.2,
      maxZ: secondWallPos[2] + secondWallSize[2] / 2 + 0.2,
      id: "second-wall-plinth",
    });
  }

  // 4. Cinema Nook
  const hasCinema = N > 0 || artworks.some((a) => a.kind === "video");
  const screenPos: [number, number, number] = [0, 2.2, halfL - 1.5];
  const benchZ = screenPos[2] - 3.5;
  const benchPos: [number, number, number] = [0, 0.35, benchZ];

  if (hasCinema) {
    // Bench collider
    colliders.push({
      minX: benchPos[0] - 1.0,
      minZ: benchPos[2] - 0.4,
      maxX: benchPos[0] + 1.0,
      maxZ: benchPos[2] + 0.4,
      id: "bench",
    });
  }

  const cinemaNook: CinemaNook = {
    present: hasCinema,
    screenPosition: screenPos,
    screenSize: [3.2, 1.8],
    benchPosition: benchPos,
    seats: [
      { x: benchPos[0] - 0.45, z: benchPos[2] }, // Seat 0 (visitor)
      { x: benchPos[0] + 0.45, z: benchPos[2] }, // Seat 1 (host)
    ],
    viewCameraPosition: [0, 1.7, benchZ - 2.8],
  };

  // 5. Place Artworks
  const placedArtworks: PlacedArtwork[] = [];

  if (N > 0) {
    // Artwork 0: HERO Artwork on Hero Wall (south-facing side)
    const heroArt = artworks[0];
    const heroSize: [number, number] = [1.4, 1.9];
    const heroPos: [number, number, number] = [
      heroWallPos[0],
      1.75, // Center at eye level
      heroWallPos[2] - heroWallSize[2] / 2 - 0.05,
    ];

    placedArtworks.push({
      artwork: heroArt,
      index: 0,
      isHero: true,
      position: heroPos,
      rotation: [0, 0, 0], // Facing south towards entrance
      size: heroSize,
      viewPosition: [heroPos[0], 0, heroPos[2] - 2.8],
      viewCameraPosition: [heroPos[0], 1.75, heroPos[2] - 1.3],
    });

    // Artworks 1..N-1: Place along perimeter and partition walls at >= 2.4m spacing
    const wallSlots: Array<{
      pos: [number, number, number];
      rot: [number, number, number];
      viewPos: [number, number, number];
      viewCamPos: [number, number, number];
    }> = [];

    // West Wall slots (facing east)
    const spacing = 2.4;
    const sideStartZ = -halfL + 3.0;
    const sideEndZ = halfL - 3.0;
    for (let z = sideStartZ; z <= sideEndZ; z += spacing) {
      wallSlots.push({
        pos: [-halfW + 0.05, 1.6, z],
        rot: [0, Math.PI / 2, 0],
        viewPos: [-halfW + 1.8, 0, z],
        viewCamPos: [-halfW + 1.3, 1.6, z],
      });
    }

    // East Wall slots (facing west)
    for (let z = sideStartZ; z <= sideEndZ; z += spacing) {
      wallSlots.push({
        pos: [halfW - 0.05, 1.6, z],
        rot: [0, -Math.PI / 2, 0],
        viewPos: [halfW - 1.8, 0, z],
        viewCamPos: [halfW - 1.3, 1.6, z],
      });
    }

    // North Wall slots (facing south, flanking cinema screen)
    for (const x of [-5.2, -3.0, 3.0, 5.2]) {
      if (Math.abs(x) < halfW - 1.0) {
        wallSlots.push({
          pos: [x, 1.6, halfL - 0.05],
          rot: [0, Math.PI, 0],
          viewPos: [x, 0, halfL - 1.8],
          viewCamPos: [x, 1.6, halfL - 1.3],
        });
      }
    }

    // South Wall slots (facing north, flanking entrance door)
    for (const x of [-5.2, -3.0, 3.0, 5.2]) {
      if (Math.abs(x) < halfW - 1.0) {
        wallSlots.push({
          pos: [x, 1.6, -halfL + 0.05],
          rot: [0, 0, 0],
          viewPos: [x, 0, -halfL + 1.8],
          viewCamPos: [x, 1.6, -halfL + 1.3],
        });
      }
    }

    // Back side of Hero Wall (facing north)
    wallSlots.push({
      pos: [-1.4, 1.6, heroWallPos[2] + heroWallSize[2] / 2 + 0.05],
      rot: [0, Math.PI, 0],
      viewPos: [-1.4, 0, heroWallPos[2] + 2.0],
      viewCamPos: [-1.4, 1.6, heroWallPos[2] + 1.4],
    });
    wallSlots.push({
      pos: [1.4, 1.6, heroWallPos[2] + heroWallSize[2] / 2 + 0.05],
      rot: [0, Math.PI, 0],
      viewPos: [1.4, 0, heroWallPos[2] + 2.0],
      viewCamPos: [1.4, 1.6, heroWallPos[2] + 1.4],
    });

    // Second feature wall slots if present
    if (featureWalls.length > 1) {
      const fw2 = featureWalls[1];
      // Front of second wall
      wallSlots.push({
        pos: [-1.4, 1.6, fw2.position[2] - fw2.size[2] / 2 - 0.05],
        rot: [0, 0, 0],
        viewPos: [-1.4, 0, fw2.position[2] - 2.0],
        viewCamPos: [-1.4, 1.6, fw2.position[2] - 1.4],
      });
      wallSlots.push({
        pos: [1.4, 1.6, fw2.position[2] - fw2.size[2] / 2 - 0.05],
        rot: [0, 0, 0],
        viewPos: [1.4, 0, fw2.position[2] - 2.0],
        viewCamPos: [1.4, 1.6, fw2.position[2] - 1.4],
      });
      // Back of second wall
      wallSlots.push({
        pos: [-1.4, 1.6, fw2.position[2] + fw2.size[2] / 2 + 0.05],
        rot: [0, Math.PI, 0],
        viewPos: [-1.4, 0, fw2.position[2] + 2.0],
        viewCamPos: [-1.4, 1.6, fw2.position[2] + 1.4],
      });
      wallSlots.push({
        pos: [1.4, 1.6, fw2.position[2] + fw2.size[2] / 2 + 0.05],
        rot: [0, Math.PI, 0],
        viewPos: [1.4, 0, fw2.position[2] + 2.0],
        viewCamPos: [1.4, 1.6, fw2.position[2] + 1.4],
      });
    }

    // Place remaining artworks in distinct slots
    for (let i = 1; i < N; i++) {
      const slot = wallSlots[i - 1];
      const art = artworks[i];
      const aspect = art.width && art.height ? art.width / art.height : 1.0;
      const artHeight = 1.2;
      const artWidth = Math.max(0.8, Math.min(1.8, artHeight * aspect));

      placedArtworks.push({
        artwork: art,
        index: i,
        isHero: false,
        position: slot.pos,
        rotation: slot.rot,
        size: [artWidth, artHeight],
        viewPosition: slot.viewPos,
        viewCameraPosition: slot.viewCamPos,
      });
    }
  }

  return {
    width,
    length,
    height,
    spawnPoint,
    colliders,
    featureWalls,
    pedestal,
    cinemaNook,
    artworks: placedArtworks,
  };
}
