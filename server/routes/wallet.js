"use strict";

const { getDb } = require("../db");

function wallet(req, res) {
  const handle = (req.body && req.body.handle) ? String(req.body.handle).trim() : "";
  if (!handle) {
    return res.status(400).json({ error: "handle required" });
  }

  const db = getDb();
  const getUser = db.prepare("SELECT id FROM users WHERE handle = ?");
  const getWallet = db.prepare("SELECT balance FROM wallet WHERE user_id = ?");

  const user = getUser.get(handle);
  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  const row = getWallet.get(user.id);
  res.json({ balance: row ? row.balance : 0 });
}

module.exports = { wallet };
