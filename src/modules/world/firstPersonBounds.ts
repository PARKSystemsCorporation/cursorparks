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

export function clampPosition(x: number, z: number): { x: number; z: number } {
  return {
    x: Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, x)),
    z: Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, z)),
  };
}
