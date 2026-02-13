"use strict";

const { getDb } = require("../db");

function redeem(req, res) {
  const handle = (req.body && req.body.handle) ? String(req.body.handle).trim() : "";
  const code = (req.body && req.body.code) ? String(req.body.code).trim() : "";
  if (!handle || !code) {
    return res.status(400).json({ error: "handle and code required" });
  }

  const db = getDb();
  const getUser = db.prepare("SELECT id FROM users WHERE handle = ?");
  const getCode = db.prepare("SELECT code, currency_value, used FROM codes WHERE code = ?");
  const updateWallet = db.prepare("UPDATE wallet SET balance = balance + ? WHERE user_id = ?");
  const markCodeUsed = db.prepare("UPDATE codes SET used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE code = ?");
  const insertTransaction = db.prepare("INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, 'redeem')");

  const user = getUser.get(handle);
  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  const codeRow = getCode.get(code);
  if (!codeRow) {
    return res.status(400).json({ error: "invalid code" });
  }
  if (codeRow.used) {
    return res.status(400).json({ error: "code already used" });
  }

  const amount = codeRow.currency_value;
  if (amount <= 0) {
    return res.status(400).json({ error: "invalid code value" });
  }

  try {
    const trans = db.transaction(() => {
      updateWallet.run(amount, user.id);
      markCodeUsed.run(user.id, code);
      insertTransaction.run(user.id, amount);
      const getBalance = db.prepare("SELECT balance FROM wallet WHERE user_id = ?");
      return getBalance.get(user.id).balance;
    });
    const newBalance = trans();
    res.json({ new_balance });
  } catch (e) {
    console.error("[redeem] error", e);
    res.status(500).json({ error: "redeem failed" });
  }
}

module.exports = { redeem };
