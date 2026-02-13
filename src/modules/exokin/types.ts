/**
 * EXOKIN Autonomous Regulation Engine (EARE) — type definitions.
 * Input layers and state shapes the engine observes and regulates.
 */

/** Physical baseline: body structure, geometry, mass, balance (from identity/buildCreature). */
export interface PhysicalLayer {
  /** e.g. slug_form, dog_frame, crawler_plate */
  bodyStructure?: string;
  /** Relative mass / robustness 0..1 */
  mass?: number;
  /** Limb config / mobility 0..1 */
  limbConfig?: number;
  /** Balance / stability 0..1 */
  balanceMechanics?: number;
}

/** Visual baseline: color spectrum, material, aggression vs warmth. */
export interface VisualLayer {
  /** Warmth of primary color 0 (cold) .. 1 (warm) */
  colorWarmth?: number;
  /** Surface hardness 0 (soft) .. 1 (industrial) */
  surfaceMaterial?: number;
  /** Visual aggression 0 (friendly) .. 1 (aggressive) */
  visualAggression?: number;
}

/** Behavioral signals: combat, chat, roaming, proximity, outcomes. */
export interface BehavioralLayer {
  /** Combat encounters in recent window */
  combatFrequency?: number;
  /** Chat interactions in recent window */
  chatFrequency?: number;
  /** Roaming / independent movement level 0..1 */
  roamingBehavior?: number;
  /** Proximity to owner 0 (far) .. 1 (close) */
  proximityToUser?: number;
  /** Recent wins (running ratio or count) */
  combatWins?: number;
  /** Recent losses */
  combatLosses?: number;
}

/** Synthetic neurochemical axes — real-time levels 0..1. */
export interface NeurochemLayer {
  aggression: number;
  bonding: number;
  alertness: number;
  curiosity: number;
  territoriality: number;
  playDrive: number;
}

/** Emergent role: -1 = companion, +1 = warrior. Not assigned; drifts over time. */
export type RoleDrift = number;

/** Combat effectiveness calibration: multipliers or biases applied to base stats. */
export interface CombatCalibration {
  strikeBias: number;
  blockBias: number;
  dodgeBias: number;
  staminaBias: number;
  tacticsBias: number;
  temperBias: number;
}

/** Context passed to chat AI for tone and response selection. */
export interface EAREChatContext {
  /** Mood-like aggregate for backward compat */
  valence: number;
  arousal: number;
  dominance: number;
  /** Emergent role -1..1 */
  roleDrift: number;
  /** Combat confidence 0..1 */
  combatConfidence: number;
  /** Bonding level 0..1 */
  bondingState: number;
  /** Current neuro snapshot for fine-grained tone */
  neuro: NeurochemLayer;
}

/** Events that drive the feedback economy. */
export type EAREEventType =
  | "combat_win"
  | "combat_loss"
  | "combat_engage"
  | "chat_social"
  | "chat_command"
  | "proximity_high"
  | "proximity_low"
  | "roam"
  | "praise"
  | "insult"
  | "calm"
  | "stress"
  | "play";
