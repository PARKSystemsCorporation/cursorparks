/**
 * Deterministic weighted selection and creature object builder.
 * No naming; identity = composition (frame, limbs, sensors, surface, movement, behavior_flags).
 */

/**
 * Seeded RNG (mulberry32). Same seed => same sequence.
 * @param {number} seed
 * @returns {() => number} next value in [0, 1)
 */
function createSeededRng(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pick one key from a weight table. Deterministic for given rng.
 * @param {Record<string, number>} weightTable - key -> weight (positive numbers)
 * @param {() => number} rng - returns [0, 1)
 * @returns {string} chosen key
 */
function weightedPick(weightTable, rng) {
  const entries = Object.entries(weightTable);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) return entries[0]?.[0] ?? "";
  let u = rng() * total;
  for (const [key, w] of entries) {
    u -= w;
    if (u <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

/**
 * Pick a subset of behavior flags. Deterministic for given rng.
 * @param {string[]} flags
 * @param {() => number} rng
 * @param {number} minCount
 * @param {number} maxCount
 * @returns {string[]}
 */
function pickBehaviorFlags(flags, rng, minCount = 1, maxCount = 3) {
  const count = Math.min(
    maxCount,
    Math.max(minCount, Math.floor(rng() * (maxCount - minCount + 1)) + minCount)
  );
  const shuffled = [...flags].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Build a creature object from weight tables. Deterministic for given seed.
 * @param {object} weights - { FRAME_WEIGHTS, LIMB_WEIGHTS, SENSOR_WEIGHTS, SURFACE_WEIGHTS, MOVEMENT_WEIGHTS, BEHAVIOR_FLAGS }
 * @param {number} [seed] - optional; if omitted, one is derived from Date.now() + Math.random() for one-off spawns
 * @returns {{ frame: string, limbs: string, sensors: string, surface: string, movement: string, behavior_flags: string[] }}
 */
function buildCreature(weights, seed = undefined) {
  const effectiveSeed =
    seed !== undefined && Number.isFinite(seed)
      ? Math.floor(seed)
      : Math.floor((Date.now() || 0) * 1000 + Math.random() * 1e9);
  const rng = createSeededRng(effectiveSeed);

  const frame = weightedPick(weights.FRAME_WEIGHTS, rng);
  const limbs = weightedPick(weights.LIMB_WEIGHTS, rng);
  const sensors = weightedPick(weights.SENSOR_WEIGHTS, rng);
  const surface = weightedPick(weights.SURFACE_WEIGHTS, rng);
  const movement = weightedPick(weights.MOVEMENT_WEIGHTS, rng);
  const behavior_flags = pickBehaviorFlags(
    weights.BEHAVIOR_FLAGS,
    rng,
    1,
    weights.BEHAVIOR_FLAGS.length
  );

  return {
    frame,
    limbs,
    sensors,
    surface,
    movement,
    behavior_flags,
  };
}

module.exports = {
  createSeededRng,
  weightedPick,
  pickBehaviorFlags,
  buildCreature,
};
