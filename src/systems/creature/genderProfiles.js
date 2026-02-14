/**
 * Gender visual identity. Industrial realism; no pink/blue stereotypes.
 * Female: warm, whites, creams, soft alloys, light reflections.
 * Male: cold graphite alloys with readable midtones.
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
  primary: "#5a5147",
  secondary: "#6a5f54",
  accent: "#877a6a",
  metal: "#74685b",
  metalness: 0.55,
  roughness: 0.58,
  emissive: "#2a241f",
  emissiveIntensity: 0.06,
};

function getProfile(gender) {
  return gender === "female" ? { ...FEMALE } : { ...MALE };
}

module.exports = {
  FEMALE,
  MALE,
  getProfile,
};
