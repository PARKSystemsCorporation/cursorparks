-- NPC Brain DB: session short/mid memory, persistent long memory, proto-language
-- Run on init; session reset clears short + mid only.

CREATE TABLE IF NOT EXISTS npc_memory_short (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  npc_id TEXT NOT NULL,
  entity_seen TEXT,
  phrase_heard TEXT,
  action_observed TEXT,
  decay_score REAL NOT NULL DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS npc_memory_mid (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  npc_id TEXT NOT NULL,
  entity TEXT NOT NULL,
  correlation_weight REAL NOT NULL DEFAULT 0.5,
  last_seen INTEGER NOT NULL,
  context_tag TEXT
);

CREATE TABLE IF NOT EXISTS npc_memory_long (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  npc_id TEXT NOT NULL,
  concept TEXT NOT NULL,
  association_network_json TEXT,
  reinforcement_score REAL NOT NULL DEFAULT 0.5
);

CREATE TABLE IF NOT EXISTS root_words (
  root_id INTEGER PRIMARY KEY AUTOINCREMENT,
  phonetic_seed TEXT NOT NULL,
  semantic_vector_tag TEXT,
  usage_frequency INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS prefixes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prefix TEXT NOT NULL,
  functional_tag TEXT
);

CREATE TABLE IF NOT EXISTS suffixes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  suffix TEXT NOT NULL,
  functional_tag TEXT
);

CREATE TABLE IF NOT EXISTS proto_vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  prefix TEXT,
  root TEXT NOT NULL,
  suffix TEXT,
  semantic_tag TEXT,
  reinforcement_score REAL NOT NULL DEFAULT 0.5,
  first_created INTEGER NOT NULL,
  last_used INTEGER NOT NULL,
  created_by_npc TEXT
);

CREATE INDEX IF NOT EXISTS idx_short_npc ON npc_memory_short(npc_id);
CREATE INDEX IF NOT EXISTS idx_short_ts ON npc_memory_short(timestamp);
CREATE INDEX IF NOT EXISTS idx_mid_npc ON npc_memory_mid(npc_id);
CREATE INDEX IF NOT EXISTS idx_mid_entity ON npc_memory_mid(entity);
CREATE INDEX IF NOT EXISTS idx_long_npc ON npc_memory_long(npc_id);
CREATE INDEX IF NOT EXISTS idx_proto_word ON proto_vocabulary(word);
CREATE INDEX IF NOT EXISTS idx_proto_npc ON proto_vocabulary(created_by_npc);
