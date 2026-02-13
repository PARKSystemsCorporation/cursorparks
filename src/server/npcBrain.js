"use strict";

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const NPC_IDS = ["barker", "broker", "smith", "fixer", "merchant", "coder"];
const SPEAK_CHANCE = 0.2;
const SHORT_MAX_AGE_MS = 120000;
const FALLBACK_PHRASES = [
  "You want the best? I got the best.",
  "Look, here's the deal.",
  "Come back when you're ready.",
  "Time is money.",
  "Everything has a price.",
  "Need a runner? I got runners.",
  "Hardware? I fix it all.",
  "Rare finds. One of a kind.",
  "Open source. No strings.",
];

let npcDb = null;

function getSchemaSql() {
  const schemaPath = path.join(__dirname, "../lib/npc/schema.sql");
  return fs.readFileSync(schemaPath, "utf8");
}

function initNpcBrain(options = {}) {
  if (npcDb) return npcDb;
  const dbPath = path.join(process.cwd(), "npc_brain.db");
  npcDb = new Database(dbPath);
  npcDb.exec(getSchemaSql());
  if (options.clearSession) {
    npcDb.exec("DELETE FROM npc_memory_short");
    npcDb.exec("DELETE FROM npc_memory_mid");
  }
  return npcDb;
}

function getNpcDb() {
  if (!npcDb) initNpcBrain();
  return npcDb;
}

function applyPerception(payload) {
  const db = getNpcDb();
  const now = Date.now();
  const stmt = db.prepare(
    "INSERT INTO npc_memory_short (timestamp, npc_id, entity_seen, phrase_heard, action_observed, decay_score) VALUES (?, ?, ?, ?, ?, 1.0)"
  );
  stmt.run(
    now,
    payload.npcId || "",
    payload.entitySeen || null,
    payload.phraseHeard || null,
    payload.actionObserved || null
  );
}

function decayShort() {
  const db = getNpcDb();
  const cutoff = Date.now() - SHORT_MAX_AGE_MS;
  const r = db.prepare("DELETE FROM npc_memory_short WHERE timestamp < ?").run(cutoff);
  return r.changes;
}

function runMinimalTick(io, onlineCount) {
  const db = getNpcDb();
  NPC_IDS.forEach((npcId) => {
    if (Math.random() > SPEAK_CHANCE) return;
    const text = FALLBACK_PHRASES[Math.floor(Math.random() * FALLBACK_PHRASES.length)];
    io.emit("npc:speak", { npcId, text });
    const now = Date.now();
    db.prepare(
      "INSERT INTO npc_memory_short (timestamp, npc_id, entity_seen, phrase_heard, action_observed, decay_score) VALUES (?, ?, NULL, ?, NULL, 1.0)"
    ).run(now, npcId, text);
  });
  decayShort();
}

function closeNpcBrain() {
  if (npcDb) {
    npcDb.close();
    npcDb = null;
  }
}

module.exports = {
  initNpcBrain,
  getNpcDb,
  applyPerception,
  runMinimalTick,
  decayShort,
  closeNpcBrain,
  NPC_IDS,
};
