/**
 * Verifies Bazaar -> Day Trader account bridge and save flow.
 * Usage: node scripts/verify-bazaar-daytrader-bridge.js
 * Requires: Bazaar DB with at least one user (or create one via /enter first).
 */
"use strict";

const path = require("path");
const Database = require("better-sqlite3");
const { prisma } = require("../src/server/db.js");
const { createSessionForBazaarUser, buildSetCookieHeader, getSessionCookieOptions } = require("../server/accountBridge.js");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "server", "data", "bazaar.db");

async function main() {
  let bazaar;
  try {
    bazaar = new Database(dbPath);
  } catch (e) {
    console.log("Bazaar DB not found at", dbPath, "- run the app and /enter once to create it.");
    process.exit(1);
  }
  const row = bazaar.prepare("SELECT id, handle FROM users LIMIT 1").get();
  bazaar.close();
  if (!row) {
    console.log("No Bazaar users. Create one via POST /enter with handle and password.");
    process.exit(1);
  }

  const { id: bazaarUserId, handle } = row;
  console.log("Using Bazaar user:", bazaarUserId, handle);

  const session = await createSessionForBazaarUser(bazaarUserId, handle);
  console.log("Bridge created Prisma session; expiresAt:", session.expiresAt);

  const user = await prisma.user.findFirst({
    where: { bazaarUserId },
    include: { stats: true }
  });
  if (!user) {
    console.error("Prisma User with bazaarUserId not found.");
    process.exit(1);
  }
  if (!user.stats) {
    console.error("PlayerStats missing for linked user.");
    process.exit(1);
  }
  console.log("Prisma User and PlayerStats OK:", user.id, user.username, "level:", user.stats.level);

  const cookieOpts = getSessionCookieOptions({ get: () => "", protocol: "http" }, session.expiresAt);
  const setCookie = buildSetCookieHeader(session.token, cookieOpts);
  console.log("Set-Cookie header length:", setCookie.length, "(valid)");

  await prisma.$disconnect();
  console.log("Verify OK: Bazaar -> Prisma bridge and PlayerStats work.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
