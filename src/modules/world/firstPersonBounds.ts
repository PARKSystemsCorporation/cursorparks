/**
 * Alley bounds for first-person collision (matches AlleyGeometry).
 * ALLEY_WIDTH = 4, ALLEY_LENGTH = 30, ground center at z = -15.
 */
export const ALLEY_WIDTH = 4;
export const ALLEY_LENGTH = 30;
export const WALL_MARGIN = 0.2;

export const BOUNDS = {
  minX: -ALLEY_WIDTH / 2 + WALL_MARGIN,
  maxX: ALLEY_WIDTH / 2 - WALL_MARGIN,
  minZ: -ALLEY_LENGTH + WALL_MARGIN, // world z: 0 to -30, center -15
  maxZ: -WALL_MARGIN,
};

export const EYE_HEIGHT = 1.65;

type Region = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

const WALK_REGIONS: Region[] = [
  // Main alley (existing play area)
  BOUNDS,
  // Stadium hallway branch running toward world -X around the left wall opening at z=-7
  { minX: -17.2, maxX: -1.75, minZ: -8.6, maxZ: -5.4 },
  // Stair landing and transition pad before the coliseum floor
  { minX: -21.2, maxX: -15.6, minZ: -9.6, maxZ: -4.4 },
  // Desert jail coliseum + nearby runout
  { minX: -42, maxX: -15.2, minZ: -22, maxZ: 8 },
];

function clampToRegion(x: number, z: number, region: Region): { x: number; z: number } {
  return {
    x: Math.max(region.minX, Math.min(region.maxX, x)),
    z: Math.max(region.minZ, Math.min(region.maxZ, z)),
  };
}

export function clampPosition(x: number, z: number): { x: number; z: number } {
  let best = clampToRegion(x, z, WALK_REGIONS[0]);
  let bestDistSq = Number.POSITIVE_INFINITY;

  for (const region of WALK_REGIONS) {
    const candidate = clampToRegion(x, z, region);
    const dx = x - candidate.x;
    const dz = z - candidate.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < bestDistSq) {
      best = candidate;
      bestDistSq = distSq;
      if (distSq === 0) break;
    }
  }

  return best;
}
