"use strict";

const { getDb } = require("../db");

const stmtGetUser = (db) => db.prepare("SELECT id, handle, created_at, last_seen FROM users WHERE handle = ?");
const stmtInsertUser = (db) => db.prepare("INSERT INTO users (handle) VALUES (?)");
const stmtInsertWallet = (db) => db.prepare("INSERT INTO wallet (user_id, balance) VALUES (?, 0)");
const stmtUpdateLastSeen = (db) => db.prepare("UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?");
const stmtGetWallet = (db) => db.prepare("SELECT balance FROM wallet WHERE user_id = ?");
const stmtGetBots = (db) => db.prepare("SELECT id, user_id, bot_type, xp, stats_json FROM bots WHERE user_id = ?");
const stmtGetInventory = (db) => db.prepare("SELECT id, user_id, item_type, item_id, state_json FROM inventory WHERE user_id = ?");
const stmtGetWorldState = (db) => db.prepare("SELECT position_json, flags_json, last_save FROM world_state WHERE user_id = ?");

function createStarterBots(db, userId) {
  const insert = db.prepare("INSERT INTO bots (user_id, bot_type, xp, stats_json) VALUES (?, ?, 0, ?)");
  insert.run(userId, "conversationalist", JSON.stringify({ strike: 25, block: 20, dodge: 55, stamina: 70, tactics: 80, temper: 30 }));
  insert.run(userId, "warrior", JSON.stringify({ strike: 70, block: 55, dodge: 35, stamina: 60, tactics: 40, temper: 65 }));
}

function createStarterInventory(db, userId) {
  const insert = db.prepare("INSERT INTO inventory (user_id, item_type, item_id, state_json) VALUES (?, ?, ?, ?)");
  insert.run(userId, "forge_cube", "starter_conversationalist", JSON.stringify({ variant: "conversationalist" }));
  insert.run(userId, "forge_cube", "starter_warrior", JSON.stringify({ variant: "warrior" }));
}

function enter(req, res) {
  const handle = (req.body && req.body.handle) ? String(req.body.handle).trim() : "";
  if (!handle) {
    return res.status(400).json({ error: "handle required" });
  }

  const db = getDb();
  const getUser = stmtGetUser(db);
  const insertUser = stmtInsertUser(db);
  const insertWallet = stmtInsertWallet(db);
  const updateLastSeen = stmtUpdateLastSeen(db);
  const getWallet = stmtGetWallet(db);
  const getBots = stmtGetBots(db);
  const getInventory = stmtGetInventory(db);
  const getWorldState = stmtGetWorldState(db);

  let user = getUser.get(handle);
  if (!user) {
    try {
      const run = insertUser.run(handle);
      const id = run.lastInsertRowid;
      insertWallet.run(id);
      createStarterBots(db, id);
      createStarterInventory(db, id);
      user = getUser.get(handle);
    } catch (e) {
      if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
        user = getUser.get(handle);
      } else {
        console.error("[enter] create user error", e);
        return res.status(500).json({ error: "failed to create user" });
      }
    }
  } else {
    updateLastSeen.run(user.id);
    user = getUser.get(handle);
  }

  const wallet = getWallet.get(user.id);
  const bots = getBots.all(user.id);
  const inventory = getInventory.all(user.id);
  const worldRow = getWorldState.get(user.id);

  const world_state = worldRow
    ? { position_json: worldRow.position_json, flags_json: worldRow.flags_json, last_save: worldRow.last_save }
    : null;

  const payload = {
    user: { id: user.id, handle: user.handle, created_at: user.created_at, last_seen: user.last_seen },
    wallet: { balance: wallet ? wallet.balance : 0 },
    bots: bots.map((b) => ({ id: b.id, user_id: b.user_id, bot_type: b.bot_type, xp: b.xp, stats_json: b.stats_json })),
    inventory: inventory.map((i) => ({ id: i.id, user_id: i.user_id, item_type: i.item_type, item_id: i.item_id, state_json: i.state_json })),
    world_state,
  };

  res.json(payload);
}

module.exports = { enter };
