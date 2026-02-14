/**
 * Creature spawn pipeline. Implements triggerCreatureSpawn(type).
 * First deploy: generate identity and store. Subsequent: load identity. Spawn using identity.
 */

const warformWeights = require("./warformWeights");
const companionWeights = require("./companionWeights");
const { buildCreature } = require("./buildCreature");
const { getOrCreateIdentity, setIdentity } = require("./identityGenerator");
const { dispatchSpawnAfterDeploy } = require("./deployWallet");
const { generateMorphParams } = require("./morphParams");

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
 * Renderer hook. Set by intro/system; called with creature object (may include identity).
 */
let renderCreature = null;

function setRenderCreature(fn) {
  renderCreature = typeof fn === "function" ? fn : null;
}

/**
 * Trigger creature spawn. If creatureId provided: use identity from options (e.g. from SQLite), or get/generate from store.
 * Dispatches parks-spawn-creature with { type, identity, position, creatureId } for deploy flow.
 * @param {string} type - "warform" | "companion"
 * @param {object} [options] - { creatureId, position: { x, y, z }, identity, seed, identityOverride: { gender } }
 * @returns {object} creature object with identity
 */
function triggerCreatureSpawn(type, options) {
  const opts = options && typeof options === "object" ? options : {};
  const creatureId = opts.creatureId;
  const position = opts.position;
  const seed = opts.seed;
  const identityOverride = opts.identityOverride;
  const identityFromApi = opts.identity;

  if (creatureId && type) {
    const identity = identityFromApi && typeof identityFromApi === "object" && identityFromApi.role
      ? identityFromApi
      : getOrCreateIdentity(creatureId, type, seed, identityOverride);
    if (identityFromApi && identityFromApi === identity) {
      setIdentity(creatureId, identity);
    }
    const deployNonce = typeof performance !== "undefined" ? performance.now() : Date.now();
    const morphParams = generateMorphParams(creatureId, deployNonce);
    const identityWithMorph = { ...identity, morphParams };
    const creature = { type, identity: identityWithMorph, creatureId };
    if (renderCreature) renderCreature(creature);
    if (position && typeof window !== "undefined" && window.dispatchEvent) {
      dispatchSpawnAfterDeploy({ type, identity: identityWithMorph, position, creatureId });
    }
    return creature;
  }

  const weights = getWeightsForType(type);
  const creature = buildCreature(weights, seed);
  if (renderCreature) renderCreature(creature);
  return creature;
}

module.exports = {
  triggerCreatureSpawn,
  setRenderCreature,
  getWeightsForType,
  TYPES,
};
