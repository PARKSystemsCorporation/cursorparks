/**
 * Gender visual identity. Industrial realism; no pink/blue stereotypes.
 * Female: warm, whites, creams, soft alloys, light reflections.
 * Male: cold, blacks, graphite, dark alloys, matte.
 */

const FEMALE = {
  primary: "#e8e4dc",
  secondary: "#c4b8a8",
  accent: "#a89888",
  metal: "#d8d0c0",
  metalness: 0.35,
  roughness: 0.45,
  emissive: "#2a2824",
  emissiveIntensity: 0.08,
};

const MALE = {
  primary: "#3d3630",
  secondary: "#4a4238",
  accent: "#6b5d4d",
  metal: "#5c5044",
  metalness: 0.6,
  roughness: 0.7,
  emissive: "#1a1612",
  emissiveIntensity: 0.04,
};

function getProfile(gender) {
  return gender === "female" ? { ...FEMALE } : { ...MALE };
}

module.exports = {
  FEMALE,
  MALE,
  getProfile,
};
