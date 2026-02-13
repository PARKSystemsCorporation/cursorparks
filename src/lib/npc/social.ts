/**
 * Social memory: NPCs read phrases from other NPCs, reuse patterns, mimic tone drift,
 * propagate vocabulary. pattern_reinforcement += social_multiplier for emergent dialect.
 */

import type { NpcDb } from "./brain";
import { getShortForNpc } from "./memory";

const SOCIAL_MULTIPLIER = 1.3;
const PHRASE_OVERLAP_WINDOW = 20; // how many recent short-memory phrases to consider from others

export interface OtherNpcPhrase {
  npcId: string;
  phrase: string;
  timestamp: number;
}

/**
 * Get recent phrases heard from other NPCs (from short memory: phrase_heard per npc_id).
 * Used to compute social overlap and reinforce patterns.
 */
export function getPhrasesFromOtherNpcs(
  database: NpcDb,
  currentNpcId: string,
  limit: number = 50
): OtherNpcPhrase[] {
  const rows = database
    .prepare(
      `SELECT npc_id, phrase_heard as phrase, timestamp FROM npc_memory_short
       WHERE phrase_heard IS NOT NULL AND phrase_heard != '' AND npc_id != ?
       ORDER BY timestamp DESC LIMIT ?`
    )
    .all(currentNpcId, limit) as { npc_id: string; phrase: string; timestamp: number }[];

  return rows.map((r) => ({ npcId: r.npc_id, phrase: r.phrase, timestamp: r.timestamp }));
}

/**
 * Compute social overlap score (0..1): how much the candidate words/phrases appear
 * in what other NPCs have been saying. Higher = more "dialect" alignment.
 */
export function computeSocialOverlap(
  database: NpcDb,
  currentNpcId: string,
  candidateWords: string[]
): number {
  if (candidateWords.length === 0) return 0;
  const others = getPhrasesFromOtherNpcs(database, currentNpcId, PHRASE_OVERLAP_WINDOW);
  if (others.length === 0) return 0;

  const phraseText = others.map((o) => o.phrase).join(" ").toLowerCase();
  let matches = 0;
  for (const w of candidateWords) {
    if (phraseText.includes(w.toLowerCase())) matches++;
  }
  const overlap = matches / candidateWords.length;
  return Math.min(1, overlap * SOCIAL_MULTIPLIER);
}

/**
 * Record that an NPC said a phrase (so other NPCs can see it via short memory).
 * Call this when an NPC produces speech so it gets written to short memory for others to read.
 */
export function recordNpcPhrase(
  database: NpcDb,
  npcId: string,
  phrase: string
): void {
  if (!phrase || phrase.length < 2) return;
  const now = Date.now();
  database
    .prepare(
      `INSERT INTO npc_memory_short (timestamp, npc_id, entity_seen, phrase_heard, action_observed, decay_score)
       VALUES (?, ?, NULL, ?, NULL, 1.0)`
    )
    .run(now, npcId, phrase.slice(0, 200));
}

/**
 * Get phrases that multiple NPCs have used (repeated pattern) for reinforcement.
 * Returns phrases that appear in at least 2 distinct NPCs' short memory.
 */
export function getRepeatedPatterns(database: NpcDb): string[] {
  const rows = database
    .prepare(
      `SELECT phrase_heard as phrase FROM npc_memory_short
       WHERE phrase_heard IS NOT NULL AND phrase_heard != '' AND length(phrase_heard) >= 3
       GROUP BY phrase_heard HAVING COUNT(DISTINCT npc_id) >= 2
       ORDER BY COUNT(*) DESC LIMIT 30`
    )
    .all() as { phrase: string }[];

  return rows.map((r) => r.phrase);
}
