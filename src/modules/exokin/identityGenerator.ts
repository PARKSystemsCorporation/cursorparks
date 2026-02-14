import { generateIdentity } from "@/src/systems/creature/identityGenerator";

export type CreatureIdentity = {
  gender: string;
  role: string;
  head_type: string;
  body_type: string;
  tail_type: string;
  color_profile: {
    primary?: string;
    secondary?: string;
    accent?: string;
    metal?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
  };
};

function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0);
}

/**
 * Unified visual identity generator.
 * Delegates to the canonical creature identity generator so all onboarding/spawn
 * paths use the same morphology and color profile logic.
 */
export function generateVisualIdentity(morphologySeed: string, type: string, gender: string): CreatureIdentity {
  const numericSeed = hashSeed(String(morphologySeed ?? ""));
  return generateIdentity(type, numericSeed, { gender }) as CreatureIdentity;
}
