/**
 * Creature spawn pipeline. Implements triggerCreatureSpawn(type).
 * Plugs into existing intro/renderer hooks; does not modify UI or intro.
 */

const warformWeights = require("./warformWeights");
const companionWeights = require("./companionWeights");
const { buildCreature } = require("./buildCreature");

const TYPES = {
  warform: "warform",
  companion: "companion",
};

/**
 * Resolve type to weight module. Defaults to companion for unknown.
 * @param {string} type - "warform" | "companion"
 * @returns {object} weight tables
 */
function getWeightsForType(type) {
  const normalized = String(type).toLowerCase();
  if (normalized === TYPES.warform) {
    return {
      FRAME_WEIGHTS: warformWeights.FRAME_WEIGHTS,
      LIMB_WEIGHTS: warformWeights.LIMB_WEIGHTS,
      SENSOR_WEIGHTS: warformWeights.SENSOR_WEIGHTS,
      SURFACE_WEIGHTS: warformWeights.SURFACE_WEIGHTS,
      MOVEMENT_WEIGHTS: warformWeights.MOVEMENT_WEIGHTS,
      BEHAVIOR_FLAGS: warformWeights.BEHAVIOR_FLAGS,
    };
  }
  return {
    FRAME_WEIGHTS: companionWeights.FRAME_WEIGHTS,
    LIMB_WEIGHTS: companionWeights.LIMB_WEIGHTS,
    SENSOR_WEIGHTS: companionWeights.SENSOR_WEIGHTS,
    SURFACE_WEIGHTS: companionWeights.SURFACE_WEIGHTS,
    MOVEMENT_WEIGHTS: companionWeights.MOVEMENT_WEIGHTS,
    BEHAVIOR_FLAGS: companionWeights.BEHAVIOR_FLAGS,
  };
}

/**
 * Renderer hook. Set by intro/system; called with creature object.
 * @type {(creature: { frame: string, limbs: string, sensors: string, surface: string, movement: string, behavior_flags: string[] }) => void}
 */
let renderCreature = null;

/**
 * Register the renderer hook. Call from intro/system.
 * @param {(creature: object) => void} fn
 */
function setRenderCreature(fn) {
  renderCreature = typeof fn === "function" ? fn : null;
}

/**
 * Trigger a creature spawn. Determines warform vs companion, generates weighted parts, builds creature, passes to renderer.
 * @param {string} type - "warform" | "companion"
 * @param {number} [seed] - optional; for deterministic spawns
 * @returns {{ frame: string, limbs: string, sensors: string, surface: string, movement: string, behavior_flags: string[] }} creature object (also passed to renderCreature if hook set)
 */
function triggerCreatureSpawn(type, seed) {
  const weights = getWeightsForType(type);
  const creature = buildCreature(weights, seed);

  if (renderCreature) {
    renderCreature(creature);
  }

  return creature;
}

module.exports = {
  triggerCreatureSpawn,
  setRenderCreature,
  getWeightsForType,
  TYPES,
};
