/**
 * First-deploy-only randomization. Subsequent deploys load from creature_identity.
 * In-memory store; persistence via creature_identity table when API is used.
 */

const anatomyParts = require("./anatomyParts");
const genderProfiles = require("./genderProfiles");

const identityStore = new Map();
const RECENT_COMBO_MAX = 8;
const recentCombos = [];

function comboKey(head_type, body_type, tail_type) {
  return `${head_type}:${body_type}:${tail_type}`;
}

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
 * Avoids repeating the same head/body/tail combo within a rolling session window.
 * @param {string} type - "warform" | "companion"
 * @param {number} [seed]
 * @param {{ gender?: string }} [override] - optional gender override (male|female)
 * @returns {{ gender: string, role: string, head_type: string, body_type: string, tail_type: string, color_profile: object }}
 */
function generateIdentity(type, seed, override) {
  const effectiveSeed =
    seed !== undefined && Number.isFinite(seed)
      ? Math.floor(seed)
      : Math.floor((Date.now() || 0) * 1000 + Math.random() * 1e9);
  const rng = createSeededRng(effectiveSeed);

  const gender =
    override && (override.gender === "male" || override.gender === "female")
      ? override.gender
      : pickOne(anatomyParts.GENDERS, rng);
  const role = type === "warform" ? "warrior" : "companion";
  const headOptions = anatomyParts.headOptions(gender, role);
  const bodyOptions = anatomyParts.bodyOptions(gender, role);
  const tailOptions = anatomyParts.tailOptions(gender, role);

  let head_type = pickOne(headOptions, rng);
  let body_type = pickOne(bodyOptions, rng);
  let tail_type = pickOne(tailOptions, rng);
  let key = comboKey(head_type, body_type, tail_type);
  let tries = 0;
  const maxTries = 12;
  while (recentCombos.includes(key) && tries < maxTries) {
    tail_type = pickOne(tailOptions, rng);
    key = comboKey(head_type, body_type, tail_type);
    if (recentCombos.includes(key)) {
      body_type = pickOne(bodyOptions, rng);
      key = comboKey(head_type, body_type, tail_type);
    }
    if (recentCombos.includes(key)) {
      head_type = pickOne(headOptions, rng);
      key = comboKey(head_type, body_type, tail_type);
    }
    tries++;
  }
  if (recentCombos.length >= RECENT_COMBO_MAX) {
    recentCombos.shift();
  }
  recentCombos.push(key);

  const identity = {
    gender,
    role,
    head_type,
    body_type,
    tail_type,
    color_profile: genderProfiles.getProfile(gender),
  };
  return identity;
}

/**
 * Get or create identity for creature. First deploy: generate and store (optionally with gender override). Else: load.
 * @param {object} [opts] - { gender?: string } applied when creating new identity
 */
function getOrCreateIdentity(creatureId, type, seed, opts) {
  let identity = getIdentity(creatureId);
  if (!identity) {
    const override = opts && typeof opts === "object" ? opts : undefined;
    identity = generateIdentity(type, seed, override);
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
