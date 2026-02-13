/**
 * Environment perception adapter: time-of-day, entity density, player actions,
 * structural changes. Used as weighted input into correlation scoring.
 */

import type { EnvironmentContext } from "./types";

/**
 * Build environment context from server-side or client-provided data.
 * timePhase: 0..1 (e.g. from MarketAtmosphere phase).
 * entityDensity: e.g. online count or nearby entity count.
 */
export function buildEnvironmentContext(params: {
  timePhase?: number;
  entityDensity?: number;
  sceneId?: string;
  recentPlayerActions?: string[];
}): EnvironmentContext {
  return {
    timePhase: params.timePhase ?? 0.5,
    entityDensity: params.entityDensity ?? 0,
    sceneId: params.sceneId ?? "bazaar",
    recentPlayerActions: params.recentPlayerActions ?? [],
  };
}

/**
 * Map time phase (0..1) to a context tag for memory/storage.
 */
export function timePhaseToContextTag(phase: number): string {
  if (phase < 0.25) return "morning";
  if (phase < 0.5) return "day";
  if (phase < 0.75) return "twilight";
  return "night";
}

/**
 * Map entity density to a context tag.
 */
export function densityToContextTag(density: number): string {
  if (density <= 1) return "quiet";
  if (density <= 5) return "moderate";
  return "busy";
}
