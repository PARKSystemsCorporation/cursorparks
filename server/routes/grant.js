"use strict";

const { getDb } = require("../db");

const ADMIN_SECRET = process.env.ADMIN_SECRET || "change-me-in-production";

function grant(req, res) {
  const secret = req.headers["x-admin-secret"] || (req.body && req.body.admin_secret);
  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: "forbidden" });
  }

  const handle = (req.body && req.body.handle) ? String(req.body.handle).trim() : "";
  const amount = req.body && req.body.amount != null ? parseInt(req.body.amount, 10) : NaN;
  if (!handle || !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: "handle and positive amount required" });
  }

  const db = getDb();
  const getUser = db.prepare("SELECT id FROM users WHERE handle = ?");
  const user = getUser.get(handle);
  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  const updateWallet = db.prepare("UPDATE wallet SET balance = balance + ? WHERE user_id = ?");
  const insertTransaction = db.prepare("INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, 'grant')");
  const getBalance = db.prepare("SELECT balance FROM wallet WHERE user_id = ?");

  try {
    updateWallet.run(amount, user.id);
    insertTransaction.run(user.id, amount);
    const row = getBalance.get(user.id);
    res.json({ new_balance: row.balance });
  } catch (e) {
    console.error("[grant] error", e);
    res.status(500).json({ error: "grant failed" });
  }
}

module.exports = { grant };
