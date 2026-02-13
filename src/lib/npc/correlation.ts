/**
 * Correlation engine: score = (freq * count) + (recency * decay_inv) + (context * env_match) + (social * overlap).
 * Returns ranked clusters for response selection (replacing template picking).
 */

import type { NpcDb } from "./brain";
import { getShortForNpc, getMidForNpc, getLongForNpc } from "./memory";
import type { CorrelationCluster } from "./types";
import type { EnvironmentContext } from "./types";

const FREQUENCY_WEIGHT = 0.35;
const RECENCY_WEIGHT = 0.25;
const CONTEXT_WEIGHT = 0.25;
const SOCIAL_WEIGHT = 0.15;

const RECENCY_HALFLIFE_MS = 60_000; // 1 min

function timeDecayInverse(now: number, then: number): number {
  const age = now - then;
  if (age <= 0) return 1;
  return 1 / (1 + age / RECENCY_HALFLIFE_MS);
}

function environmentMatch(contextTag: string | null, env: EnvironmentContext | null): number {
  if (!env || !contextTag) return 0.5;
  const tag = contextTag.toLowerCase();
  if (tag.includes("day") && env.timePhase < 0.5) return 0.9;
  if (tag.includes("night") && env.timePhase >= 0.5) return 0.9;
  if (tag.includes("busy") && env.entityDensity > 5) return 0.9;
  if (tag.includes("quiet") && env.entityDensity <= 2) return 0.9;
  return 0.5;
}

export interface CorrelationInput {
  npcId: string;
  inputWords?: string[];
  environmentContext?: EnvironmentContext | null;
  socialOverlap?: number; // 0..1 from social layer
  now?: number;
}

/**
 * Build correlation clusters from NPC memory (short/mid/long) and score them.
 * Caller can merge with ARIA word associations and then pick highest cluster for response.
 */
export function getCorrelationClusters(
  database: NpcDb,
  input: CorrelationInput
): CorrelationCluster[] {
  const now = input.now ?? Date.now();
  const env = input.environmentContext ?? null;
  const social = input.socialOverlap ?? 0;

  const clusters: CorrelationCluster[] = [];
  const seen = new Set<string>();

  // Short: phrase_heard, entity_seen, action_observed
  const short = getShortForNpc(database, input.npcId, 80);
  for (const row of short) {
    for (const raw of [row.phrase_heard, row.entity_seen, row.action_observed]) {
      if (!raw || raw.length < 2) continue;
      const words = raw.toLowerCase().split(/\s+/).filter((w) => w.length >= 2);
      if (words.length === 0) continue;
      const key = words.join("_");
      if (seen.has(key)) continue;
      seen.add(key);
      const recency = timeDecayInverse(now, row.timestamp);
      const freq = Math.min(1, (row.decay_score ?? 1) * 0.5);
      const ctx = environmentMatch(row.entity_seen ?? null, env);
      const score =
        FREQUENCY_WEIGHT * freq +
        RECENCY_WEIGHT * recency +
        CONTEXT_WEIGHT * ctx +
        SOCIAL_WEIGHT * social;
      clusters.push({ words, score, source: "short" });
    }
  }

  // Mid: entity
  const mid = getMidForNpc(database, input.npcId, 80);
  for (const row of mid) {
    const w = row.entity.toLowerCase().trim();
    if (w.length < 2 || seen.has(w)) continue;
    seen.add(w);
    const recency = timeDecayInverse(now, row.last_seen);
    const freq = row.correlation_weight;
    const ctx = environmentMatch(row.context_tag, env);
    const score =
      FREQUENCY_WEIGHT * freq +
      RECENCY_WEIGHT * recency +
      CONTEXT_WEIGHT * ctx +
      SOCIAL_WEIGHT * social;
    clusters.push({ words: [w], score, source: "mid" });
  }

  // Long: concept
  const long = getLongForNpc(database, input.npcId, 50);
  for (const row of long) {
    const w = row.concept.toLowerCase().trim();
    if (w.length < 2 || seen.has(w)) continue;
    seen.add(w);
    const freq = row.reinforcement_score;
    const score =
      FREQUENCY_WEIGHT * freq +
      RECENCY_WEIGHT * 0.7 + // long memory is stable
      CONTEXT_WEIGHT * 0.5 +
      SOCIAL_WEIGHT * social;
    clusters.push({ words: [w], score, source: "long" });
  }

  clusters.sort((a, b) => b.score - a.score);
  return clusters;
}

/**
 * Merge ARIA-derived words into clusters with a base score (aria source).
 * Used by generator to combine NPC brain + existing ARIA correlations.
 */
export function mergeAriaWordsIntoClusters(
  ariaWords: string[],
  existingClusters: CorrelationCluster[]
): CorrelationCluster[] {
  const seen = new Set(existingClusters.flatMap((c) => c.words));
  const ariaClusters: CorrelationCluster[] = ariaWords
    .filter((w) => w.length >= 2 && !seen.has(w))
    .slice(0, 15)
    .map((word) => {
      seen.add(word);
      return { words: [word], score: 0.4, source: "aria" as const };
    });
  return [...existingClusters, ...ariaClusters].sort((a, b) => b.score - a.score);
}
