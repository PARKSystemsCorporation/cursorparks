/**
 * One-time backfill: link existing Bazaar users to Prisma User by normalized handle.
 * Run after adding bazaarUserId to Prisma schema: node scripts/backfill-bazaar-prisma-link.js
 * - Finds Prisma User by username === normalized Bazaar handle; sets bazaarUserId when unique.
 * - Logs collisions (multiple Bazaar handles normalizing to same username) for manual resolution.
 */
"use strict";

const path = require("path");
const Database = require("better-sqlite3");
const { prisma } = require("../src/server/db.js");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "server", "data", "bazaar.db");

function normalizeHandle(handle) {
  return String(handle || "").trim().toUpperCase();
}

async function main() {
  const bazaar = new Database(dbPath);
  const rows = bazaar.prepare("SELECT id, handle FROM users").all();
  bazaar.close();

  const byNormalized = new Map();
  for (const r of rows) {
    const n = normalizeHandle(r.handle);
    if (!byNormalized.has(n)) byNormalized.set(n, []);
    byNormalized.get(n).push({ bazaarId: r.id, handle: r.handle });
  }

  let linked = 0;
  let skipped = 0;
  const collisions = [];

  for (const [normalized, bazaarUsers] of byNormalized) {
    if (bazaarUsers.length > 1) {
      collisions.push({ normalized, bazaarUsers });
      skipped += bazaarUsers.length;
      continue;
    }
    const { bazaarId, handle } = bazaarUsers[0];
    const user = await prisma.user.findUnique({ where: { username: normalized } });
    if (!user) continue;
    if (user.bazaarUserId != null) {
      skipped += 1;
      continue;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { bazaarUserId: bazaarId }
    });
    linked += 1;
    console.log(`Linked Prisma user ${user.id} (${normalized}) <-> Bazaar id ${bazaarId} (${handle})`);
  }

  console.log(`Done. Linked: ${linked}, skipped: ${skipped}`);
  if (collisions.length) {
    console.log("Collisions (manual resolution needed):");
    console.log(JSON.stringify(collisions, null, 2));
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
