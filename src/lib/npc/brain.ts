/**
 * NPC Brain — SQLite setup and connection for npc_brain.db.
 * Used by API routes and (via server adapter) by server.js cognitive loop.
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export type NpcDb = InstanceType<typeof Database>;
let db: NpcDb | null = null;

const DB_NAME = "npc_brain.db";

function getSchemaSql(): string {
  const schemaPath = path.join(__dirname, "schema.sql");
  return fs.readFileSync(schemaPath, "utf8");
}

/**
 * Run full schema (idempotent). Call once on first getDb() or from server init.
 */
export function runSchema(database: NpcDb): void {
  database.exec(getSchemaSql());
}

/**
 * Clear short and mid memory (session reset). Long memory and proto_vocabulary persist.
 */
export function clearSessionMemory(database: NpcDb): void {
  database.exec("DELETE FROM npc_memory_short");
  database.exec("DELETE FROM npc_memory_mid");
}

/**
 * Get the singleton NPC brain DB. Creates and initializes if needed.
 * Uses process.cwd() so it works from Next.js API routes and from server.js.
 */
export function getNpcBrainDb(dbPath?: string): NpcDb {
  if (db) return db;
  const targetPath = dbPath ?? path.join(process.cwd(), DB_NAME);
  const database = new Database(targetPath);
  runSchema(database);
  db = database;
  return db;
}

/**
 * Close the DB (e.g. on shutdown). After this, getNpcBrainDb() will create a new connection.
 */
export function closeNpcBrainDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * For server.js: init DB and optionally clear session memory (short + mid).
 * Returns the db instance so server can pass it to the cognitive loop.
 */
export function initNpcBrain(options?: { clearSession?: boolean; dbPath?: string }): NpcDb {
  const database = getNpcBrainDb(options?.dbPath);
  if (options?.clearSession) {
    clearSessionMemory(database);
  }
  return database;
}
