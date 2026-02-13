"use strict";

const { getDb } = require("../db");

function autosave(req, res) {
  const { handle, world_state, bots, inventory } = req.body || {};
  if (!handle || typeof handle !== "string") {
    return res.status(400).json({ error: "handle required" });
  }

  const db = getDb();
  const getUser = db.prepare("SELECT id FROM users WHERE handle = ?");
  const user = getUser.get(handle.trim());
  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  const userId = user.id;

  try {
    if (world_state != null) {
      const upsertWorld = db.prepare(`
        INSERT INTO world_state (user_id, position_json, flags_json, last_save)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          position_json = excluded.position_json,
          flags_json = excluded.flags_json,
          last_save = CURRENT_TIMESTAMP
      `);
      const pos = world_state.position_json != null ? JSON.stringify(world_state.position_json) : null;
      const flags = world_state.flags_json != null ? JSON.stringify(world_state.flags_json) : null;
      upsertWorld.run(userId, pos, flags);
    }

    if (Array.isArray(bots)) {
      const delBots = db.prepare("DELETE FROM bots WHERE user_id = ?");
      const insBot = db.prepare("INSERT INTO bots (user_id, bot_type, xp, stats_json) VALUES (?, ?, ?, ?)");
      delBots.run(userId);
      for (const b of bots) {
        const stats = b.stats_json != null ? (typeof b.stats_json === "string" ? b.stats_json : JSON.stringify(b.stats_json)) : null;
        insBot.run(userId, b.bot_type || "unknown", b.xp ?? 0, stats);
      }
    }

    if (Array.isArray(inventory)) {
      const delInv = db.prepare("DELETE FROM inventory WHERE user_id = ?");
      const insInv = db.prepare("INSERT INTO inventory (user_id, item_type, item_id, state_json) VALUES (?, ?, ?, ?)");
      delInv.run(userId);
      for (const i of inventory) {
        const state = i.state_json != null ? (typeof i.state_json === "string" ? i.state_json : JSON.stringify(i.state_json)) : null;
        insInv.run(userId, i.item_type || "item", i.item_id || "", state);
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("[autosave] error", e);
    res.status(500).json({ error: "autosave failed" });
  }
}

module.exports = { autosave };
