"use strict";

function addPasswordColumnIfMissing(db) {
  try {
    const info = db.prepare("PRAGMA table_info(users)").all();
    const hasPassword = info.some((c) => c.name === "password_hash");
    if (!hasPassword) {
      db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
    }
  } catch (_) {}
}

function createTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      handle TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wallet (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      balance INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bot_type TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      stats_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      state_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS world_state (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      position_json TEXT,
      flags_json TEXT,
      last_save DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS codes (
      code TEXT PRIMARY KEY,
      currency_value INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      used_by INTEGER REFERENCES users(id),
      used_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_bots_user ON bots(user_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
  `);
  addPasswordColumnIfMissing(db);
}

module.exports = { createTables, addPasswordColumnIfMissing };
