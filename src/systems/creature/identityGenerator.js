/**
 * First-deploy-only randomization. Subsequent deploys load from creature_identity.
 * In-memory store; persistence via creature_identity table when API is used.
 */

const anatomyParts = require("./anatomyParts");
const genderProfiles = require("./genderProfiles");

const identityStore = new Map();

function getIdentity(creatureId) {
  return identityStore.get(creatureId) || null;
}

function setIdentity(creatureId, identity) {
  identityStore.set(creatureId, identity);
}

function createSeededRng(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Generate identity for first deploy. role = warrior | companion from type.
 * @param {string} type - "warform" | "companion"
 * @param {number} [seed]
 * @returns {{ gender: string, role: string, head_type: string, body_type: string, tail_type: string, color_profile: object }}
 */
function generateIdentity(type, seed) {
  const effectiveSeed =
    seed !== undefined && Number.isFinite(seed)
      ? Math.floor(seed)
      : Math.floor((Date.now() || 0) * 1000 + Math.random() * 1e9);
  const rng = createSeededRng(effectiveSeed);

  const gender = pickOne(anatomyParts.GENDERS, rng);
  const role = type === "warform" ? "warrior" : "companion";
  const headOptions = anatomyParts.headOptions(gender, role);
  const bodyOptions = anatomyParts.bodyOptions(gender, role);
  const tailOptions = anatomyParts.tailOptions(gender, role);

  const identity = {
    gender,
    role,
    head_type: pickOne(headOptions, rng),
    body_type: pickOne(bodyOptions, rng),
    tail_type: pickOne(tailOptions, rng),
    color_profile: genderProfiles.getProfile(gender),
  };
  return identity;
}

/**
 * Get or create identity for creature. First deploy: generate and store. Else: load.
 */
function getOrCreateIdentity(creatureId, type, seed) {
  let identity = getIdentity(creatureId);
  if (!identity) {
    identity = generateIdentity(type, seed);
    setIdentity(creatureId, identity);
  }
  return identity;
}

module.exports = {
  generateIdentity,
  getIdentity,
  setIdentity,
  getOrCreateIdentity,
  createSeededRng,
};
