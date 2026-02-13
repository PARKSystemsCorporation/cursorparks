"use strict";

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "data", "bazaar.db");
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let db = null;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

function initSchema() {
  const schema = require("./schema");
  schema.createTables(getDb());
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, initSchema, close };
