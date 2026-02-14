/**
 * Deploy-time shape morpher. Deterministic from creatureId + deployNonce.
 * Generates scale, tilt, and offset params; intensity (subtle/medium/wild) is random per deploy.
 * Not persisted; recomputed each deploy for fresh silhouettes.
 */

const INTENSITY_MODES = ["subtle", "medium", "wild"];
const INTENSITY_RANGES = {
  subtle: { scale: [0.92, 1.08], tilt: 0.06, offset: 0.02 },
  medium: { scale: [0.85, 1.18], tilt: 0.14, offset: 0.05 },
  wild: { scale: [0.75, 1.3], tilt: 0.28, offset: 0.1 },
};

function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function createSeededRng(seed) {
  let s = typeof seed === "string" ? hashString(seed) : (seed >>> 0);
  return function next() {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Generate morph params for this deploy. Seed = creatureId + deployNonce.
 * @param {string} creatureId
 * @param {number} deployNonce
 * @returns {{ intensity: string, head: object, body: object, tail: object }}
 */
function generateMorphParams(creatureId, deployNonce) {
  const seedStr = String(creatureId ?? "") + ":" + String(deployNonce ?? Date.now());
  const rng = createSeededRng(seedStr);

  const intensityIndex = Math.floor(rng() * INTENSITY_MODES.length);
  const intensity = INTENSITY_MODES[intensityIndex];
  const ranges = INTENSITY_RANGES[intensity] || INTENSITY_RANGES.medium;
  const [scaleMin, scaleMax] = Array.isArray(ranges.scale) ? ranges.scale : [ranges.scale, ranges.scale];
  const tiltMax = ranges.tilt;
  const offsetMax = ranges.offset;

  function scale() {
    return lerp(scaleMin, scaleMax, rng());
  }
  function tilt() {
    return (rng() * 2 - 1) * tiltMax;
  }
  function offset() {
    return (rng() * 2 - 1) * offsetMax;
  }

  return {
    intensity,
    head: {
      scaleX: scale(),
      scaleY: scale(),
      scaleZ: scale(),
      tiltX: tilt(),
      tiltZ: tilt(),
      offsetX: offset(),
      offsetZ: offset(),
    },
    body: {
      scaleX: scale(),
      scaleY: scale(),
      scaleZ: scale(),
      tiltX: tilt(),
      tiltZ: tilt(),
      offsetX: offset(),
      offsetZ: offset(),
    },
    tail: {
      scaleX: scale(),
      scaleY: scale(),
      scaleZ: scale(),
      tiltX: tilt(),
      tiltZ: tilt(),
      offsetX: offset(),
      offsetZ: offset(),
    },
  };
}

module.exports = {
  generateMorphParams,
  INTENSITY_MODES,
  INTENSITY_RANGES,
};
