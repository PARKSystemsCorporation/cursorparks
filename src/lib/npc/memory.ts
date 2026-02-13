/**
 * Per-NPC short/mid/long memory CRUD and decay mechanics.
 * All tables live in npc_brain.db (better-sqlite3).
 */

import type { NpcDb } from "./brain";
import type { ShortMemoryRow, MidMemoryRow, LongMemoryRow } from "./types";

const SHORT_DECAY_RATE = 0.15;
const SHORT_MAX_AGE_MS = 120_000; // 2 min
const MID_DECAY_RATE = 0.05;
const MID_MAX_AGE_MS = 600_000; // 10 min

// --- Short memory ---

export function insertShort(
  database: NpcDb,
  npcId: string,
  payload: { entitySeen?: string; phraseHeard?: string; actionObserved?: string }
): void {
  const now = Date.now();
  const stmt = database.prepare(
    `INSERT INTO npc_memory_short (timestamp, npc_id, entity_seen, phrase_heard, action_observed, decay_score)
     VALUES (?, ?, ?, ?, ?, 1.0)`
  );
  stmt.run(
    now,
    npcId,
    payload.entitySeen ?? null,
    payload.phraseHeard ?? null,
    payload.actionObserved ?? null
  );
}

export function getShortForNpc(
  database: NpcDb,
  npcId: string,
  limit: number = 50
): ShortMemoryRow[] {
  const stmt = database.prepare(
    `SELECT id, timestamp, npc_id, entity_seen, phrase_heard, action_observed, decay_score
     FROM npc_memory_short WHERE npc_id = ? ORDER BY timestamp DESC LIMIT ?`
  );
  return stmt.all(npcId, limit) as ShortMemoryRow[];
}

/** Apply time-based decay to short memory and delete expired rows. */
export function decayShort(database: NpcDb, now: number = Date.now()): number {
  const cutoff = now - SHORT_MAX_AGE_MS;
  const del = database.prepare("DELETE FROM npc_memory_short WHERE timestamp < ?");
  const r = del.run(cutoff);
  return r.changes;
}

// --- Mid memory ---

export function upsertMid(
  database: NpcDb,
  npcId: string,
  entity: string,
  contextTag: string | null,
  weightDelta: number = 0.1
): void {
  const now = Date.now();
  const existing = database
    .prepare(
      "SELECT id, correlation_weight FROM npc_memory_mid WHERE npc_id = ? AND entity = ?"
    )
    .get(npcId, entity) as { id: number; correlation_weight: number } | undefined;

  if (existing) {
    const newWeight = Math.min(1, existing.correlation_weight + weightDelta);
    database
      .prepare(
        "UPDATE npc_memory_mid SET correlation_weight = ?, last_seen = ?, context_tag = ? WHERE id = ?"
      )
      .run(newWeight, now, contextTag, existing.id);
  } else {
    database
      .prepare(
        `INSERT INTO npc_memory_mid (npc_id, entity, correlation_weight, last_seen, context_tag)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(npcId, entity, Math.min(1, weightDelta), now, contextTag);
  }
}

export function getMidForNpc(
  database: NpcDb,
  npcId: string,
  limit: number = 100
): MidMemoryRow[] {
  const stmt = database.prepare(
    `SELECT id, npc_id, entity, correlation_weight, last_seen, context_tag
     FROM npc_memory_mid WHERE npc_id = ? ORDER BY correlation_weight DESC, last_seen DESC LIMIT ?`
  );
  return stmt.all(npcId, limit) as MidMemoryRow[];
}

/** Decay mid memory by age and reduce weight; delete if weight too low. */
export function decayMid(database: NpcDb, now: number = Date.now()): number {
  const rows = database
    .prepare(
      "SELECT id, last_seen, correlation_weight FROM npc_memory_mid"
    )
    .all() as { id: number; last_seen: number; correlation_weight: number }[];
  let deleted = 0;
  const updateStmt = database.prepare(
    "UPDATE npc_memory_mid SET correlation_weight = ? WHERE id = ?"
  );
  const deleteStmt = database.prepare("DELETE FROM npc_memory_mid WHERE id = ?");
  const ageMs = now - MID_MAX_AGE_MS;
  for (const row of rows) {
    if (row.last_seen < ageMs) {
      const newWeight = row.correlation_weight * (1 - MID_DECAY_RATE);
      if (newWeight < 0.05) {
        deleteStmt.run(row.id);
        deleted++;
      } else {
        updateStmt.run(newWeight, row.id);
      }
    }
  }
  return deleted;
}

// --- Long memory (persists across session reset) ---

export function getLongForNpc(
  database: NpcDb,
  npcId: string,
  limit: number = 50
): LongMemoryRow[] {
  const stmt = database.prepare(
    `SELECT id, npc_id, concept, association_network_json, reinforcement_score
     FROM npc_memory_long WHERE npc_id = ? ORDER BY reinforcement_score DESC LIMIT ?`
  );
  return stmt.all(npcId, limit) as LongMemoryRow[];
}

export function reinforceLong(
  database: NpcDb,
  npcId: string,
  concept: string,
  associationJson: string | null,
  delta: number = 0.1
): void {
  const existing = database
    .prepare("SELECT id, reinforcement_score FROM npc_memory_long WHERE npc_id = ? AND concept = ?")
    .get(npcId, concept) as { id: number; reinforcement_score: number } | undefined;

  if (existing) {
    database
      .prepare(
        "UPDATE npc_memory_long SET reinforcement_score = min(1.0, reinforcement_score + ?), association_network_json = ? WHERE id = ?"
      )
      .run(Math.min(1, existing.reinforcement_score + delta), associationJson, existing.id);
  } else {
    database
      .prepare(
        `INSERT INTO npc_memory_long (npc_id, concept, association_network_json, reinforcement_score)
         VALUES (?, ?, ?, ?)`
      )
      .run(npcId, concept, associationJson, Math.min(1, delta));
  }
}
