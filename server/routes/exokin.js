"use strict";

const { getDb } = require("../db");

function getCreature(db, creatureId) {
  const row = db.prepare(
    "SELECT creature_id, name, gender, role, head_type, body_type, tail_type, color_profile_json, eare_state_json, morphology_seed, created_at FROM creature_identity WHERE creature_id = ?"
  ).get(creatureId);
  return row ? {
    creatureId: row.creature_id,
    name: row.name || null,
    gender: row.gender,
    role: row.role,
    head_type: row.head_type,
    body_type: row.body_type,
    tail_type: row.tail_type,
    color_profile: row.color_profile_json ? JSON.parse(row.color_profile_json) : null,
    eare_state_json: row.eare_state_json || null,
    morphology_seed: row.morphology_seed != null ? row.morphology_seed : null,
    created_at: row.created_at,
  } : null;
}

function upsertCreature(db, data) {
  const { creatureId, name, gender, role, head_type, body_type, tail_type, color_profile_json, eare_state_json, morphology_seed } = data;
  db.prepare(`
    INSERT INTO creature_identity (creature_id, name, gender, role, head_type, body_type, tail_type, color_profile_json, eare_state_json, morphology_seed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(creature_id) DO UPDATE SET
      name = COALESCE(excluded.name, name),
      gender = excluded.gender,
      role = excluded.role,
      head_type = excluded.head_type,
      body_type = excluded.body_type,
      tail_type = excluded.tail_type,
      color_profile_json = COALESCE(excluded.color_profile_json, color_profile_json),
      eare_state_json = COALESCE(excluded.eare_state_json, eare_state_json),
      morphology_seed = COALESCE(excluded.morphology_seed, morphology_seed)
  `).run(
    creatureId,
    name || null,
    gender || "male",
    role || "companion",
    head_type || "sensor_dome",
    body_type || "slug_form",
    tail_type || "cable_tail",
    color_profile_json || null,
    eare_state_json || null,
    morphology_seed != null ? morphology_seed : null
  );
}

function getMessages(db, creatureId, limit = 100) {
  const rows = db.prepare(
    "SELECT id, creature_id, speaker, content, created_at FROM exokin_messages WHERE creature_id = ? ORDER BY created_at ASC LIMIT ?"
  ).all(creatureId, limit);
  return rows.map((r) => ({
    id: r.id,
    creatureId: r.creature_id,
    speaker: r.speaker,
    content: r.content,
    createdAt: r.created_at,
  }));
}

function addMessage(db, creatureId, speaker, content) {
  const run = db.prepare(
    "INSERT INTO exokin_messages (creature_id, speaker, content) VALUES (?, ?, ?)"
  ).run(creatureId, speaker, content);
  return run.lastInsertRowid;
}

function handleGetCreature(req, res, creatureId) {
  if (!creatureId) {
    res.status(400).json({ error: "creatureId required" });
    return;
  }
  try {
    const db = getDb();
    const creature = getCreature(db, creatureId);
    if (!creature) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.status(200).json(creature);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function handlePostCreature(req, res, body) {
  const creatureId = body && body.creatureId ? String(body.creatureId).trim() : null;
  const name = body && body.name != null ? String(body.name).trim() : null;
  const gender = body && body.gender ? String(body.gender).toLowerCase() : "male";
  const type = body && body.type ? String(body.type).toLowerCase() : "companion";
  if (!creatureId) {
    res.status(400).json({ error: "creatureId required" });
    return;
  }
  if (gender !== "male" && gender !== "female") {
    res.status(400).json({ error: "gender must be male or female" });
    return;
  }
  const role = type === "warform" ? "warrior" : "companion";
  const head_type = body.head_type || "sensor_dome";
  const body_type = body.body_type || "slug_form";
  const tail_type = body.tail_type || "cable_tail";
  const color_profile_json = body.color_profile ? JSON.stringify(body.color_profile) : null;
  const morphology_seed = body.morphology_seed != null ? (typeof body.morphology_seed === "number" ? body.morphology_seed : parseInt(body.morphology_seed, 10)) : null;
  const eare_state_json = body.eare_state_json != null ? (typeof body.eare_state_json === "string" ? body.eare_state_json : JSON.stringify(body.eare_state_json)) : null;
  try {
    const db = getDb();
    upsertCreature(db, {
      creatureId,
      name: name || null,
      gender,
      role,
      head_type,
      body_type,
      tail_type,
      color_profile_json,
      eare_state_json: eare_state_json || null,
      morphology_seed: Number.isFinite(morphology_seed) ? morphology_seed : null,
    });
    res.status(200).json({ ok: true, creatureId, name, gender });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function handleGetChat(req, res, creatureId) {
  if (!creatureId) {
    res.status(400).json({ error: "creatureId required" });
    return;
  }
  try {
    const db = getDb();
    const messages = getMessages(db, creatureId);
    res.status(200).json({ messages });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function handlePostChat(req, res, body) {
  const creatureId = body && body.creatureId ? String(body.creatureId).trim() : null;
  const speaker = body && body.speaker ? String(body.speaker).toLowerCase() : null;
  const content = body && body.content != null ? String(body.content) : null;
  if (!creatureId || !speaker || content === null) {
    res.status(400).json({ error: "creatureId, speaker, and content required" });
    return;
  }
  if (speaker !== "user" && speaker !== "exokin") {
    res.status(400).json({ error: "speaker must be user or exokin" });
    return;
  }
  try {
    const db = getDb();
    const id = addMessage(db, creatureId, speaker, content);
    res.status(200).json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  handleGetCreature,
  handlePostCreature,
  handleGetChat,
  handlePostChat,
  getCreature,
  getMessages,
};
