import { getDayNightStrength } from "@/src/modules/world/SunMoonCycle";

/**
 * Runtime emissive scale 0–1 from day/night cycle. Strongest at midnight (peak night), weakest at noon.
 */
export function getEmissiveScale(): number {
  const { nightStrength } = getDayNightStrength();
  return nightStrength;
}

/**
 * Runtime practical light intensity 0–1. Same as emissive: full at night, off at noon.
 */
export function getPracticalLightIntensity(): number {
  const { nightStrength } = getDayNightStrength();
  return nightStrength;
}
