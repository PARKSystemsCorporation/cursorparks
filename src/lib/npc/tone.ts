/**
 * Tone model: cautious, curious, transactional, familiar, territorial.
 * tone_bias = player_frequency_seen + environment_density + npc_social_pressure.
 */

import type { ToneCategory } from "./types";

export const TONE_CATEGORIES: ToneCategory[] = [
  "cautious",
  "curious",
  "transactional",
  "familiar",
  "territorial",
];

/** Weights for each factor in tone bias (normalized so max sum ~ 1). */
const PLAYER_FREQ_WEIGHT = 0.4;
const ENV_DENSITY_WEIGHT = 0.3;
const SOCIAL_PRESSURE_WEIGHT = 0.3;

/**
 * Compute tone bias from inputs. Returns a 0..1 score per factor and a combined bias.
 * Higher bias = more "engaged" tone (e.g. familiar/territorial); lower = more cautious/transactional.
 */
export function computeToneBias(params: {
  playerFrequencySeen: number; // e.g. count of interactions with this player in session
  environmentDensity: number;  // e.g. online count or nearby entities
  npcSocialPressure: number;  // e.g. how much other NPCs are talking / overlap
}): { bias: number; breakdown: { player: number; env: number; social: number } } {
  const player = Math.min(1, params.playerFrequencySeen / 10) * PLAYER_FREQ_WEIGHT;
  const env = Math.min(1, params.environmentDensity / 20) * ENV_DENSITY_WEIGHT;
  const social = Math.min(1, params.npcSocialPressure) * SOCIAL_PRESSURE_WEIGHT;
  const bias = player + env + social;
  return {
    bias: Math.min(1, bias),
    breakdown: { player, env, social },
  };
}

/**
 * Select tone category from bias and optional personality seed.
 * Low bias -> cautious/transactional; high bias -> familiar/territorial; mid -> curious.
 */
export function selectToneFromBias(
  bias: number
): ToneCategory {
  if (bias < 0.2) return "cautious";
  if (bias < 0.35) return "transactional";
  if (bias < 0.6) return "curious";
  if (bias < 0.85) return "familiar";
  return "territorial";
}

/**
 * Get a short label or phrase modifier for the tone (for response assembly).
 */
export function getToneModifier(tone: ToneCategory): string {
  switch (tone) {
    case "cautious":
      return "carefully";
    case "curious":
      return "wondering";
    case "transactional":
      return "matter-of-fact";
    case "familiar":
      return "easy";
    case "territorial":
      return "firm";
    default:
      return "neutral";
  }
}
