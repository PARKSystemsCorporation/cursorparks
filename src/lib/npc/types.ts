/**
 * Shared types for the NPC brain system.
 * Memory-first, correlation-driven, no LLM.
 */

export type NpcId = string;

export interface ShortMemoryRow {
  id: number;
  timestamp: number;
  npc_id: string;
  entity_seen: string | null;
  phrase_heard: string | null;
  action_observed: string | null;
  decay_score: number;
}

export interface MidMemoryRow {
  id: number;
  npc_id: string;
  entity: string;
  correlation_weight: number;
  last_seen: number;
  context_tag: string | null;
}

export interface LongMemoryRow {
  id: number;
  npc_id: string;
  concept: string;
  association_network_json: string | null;
  reinforcement_score: number;
}

export interface PerceptionInput {
  npcId: NpcId;
  entitySeen?: string;
  phraseHeard?: string;
  actionObserved?: string;
  timePhase?: number;
  entityDensity?: number;
  sceneId?: string;
  timestamp?: number;
}

export interface EnvironmentContext {
  timePhase: number;
  entityDensity: number;
  sceneId: string;
  recentPlayerActions?: string[];
}

export type ToneCategory = "cautious" | "curious" | "transactional" | "familiar" | "territorial";

export interface CorrelationCluster {
  words: string[];
  score: number;
  source: "short" | "mid" | "long" | "aria";
}

export interface ProtoWord {
  word: string;
  prefix: string | null;
  root: string;
  suffix: string | null;
  semantic_tag: string | null;
  reinforcement_score: number;
}
