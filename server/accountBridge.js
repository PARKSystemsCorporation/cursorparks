"use strict";

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { prisma } = require("../src/server/db.js");

const SESSION_DAYS = 30;
const BAZAAR_PLACEHOLDER_HASH = bcrypt.hashSync("bazaar-linked", 10);

function getSessionSecret() {
  return process.env.SESSION_SECRET || "dev-secret";
}

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token + getSessionSecret())
    .digest("hex");
}

function normalizeHandle(handle) {
  return String(handle || "").trim().toUpperCase();
}

/**
 * Find or create Prisma User for a Bazaar user. Ensures PlayerStats exists.
 * Returns { prismaUser } or throws.
 */
async function findOrCreatePrismaUserForBazaar(bazaarUserId, handle) {
  const username = normalizeHandle(handle);
  if (!username) throw new Error("Invalid handle");

  let user = await prisma.user.findUnique({ where: { bazaarUserId } });
  if (user) {
    await ensurePlayerStats(user.id);
    return user;
  }

  user = await prisma.user.findUnique({ where: { username } });
  if (user) {
    if (user.bazaarUserId != null && user.bazaarUserId !== bazaarUserId) {
      throw new Error("Username collision: another Bazaar account is linked to this Prisma user.");
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { bazaarUserId }
    });
    await ensurePlayerStats(user.id);
    return await prisma.user.findUnique({ where: { id: user.id } });
  }

  user = await prisma.user.create({
    data: {
      username,
      passHash: BAZAAR_PLACEHOLDER_HASH,
      bazaarUserId,
      stats: { create: {} }
    }
  });
  return user;
}

async function ensurePlayerStats(userId) {
  const stats = await prisma.playerStats.findUnique({ where: { userId } });
  if (!stats) {
    await prisma.playerStats.create({ data: { userId } });
  }
}

/**
 * Create a Prisma session for the given user id. Matches auth.ts createSession behavior.
 * Returns { token, expiresAt }.
 */
async function createPrismaSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId, tokenHash, expiresAt }
  });
  return { token, expiresAt };
}

/**
 * Bridge: after Bazaar /enter success, call this to provision Prisma session so Day Trader APIs work.
 * @param {number} bazaarUserId - Bazaar users.id
 * @param {string} handle - Bazaar users.handle
 * @returns {{ token: string, expiresAt: Date }} for setting ps_session cookie
 */
async function createSessionForBazaarUser(bazaarUserId, handle) {
  const user = await findOrCreatePrismaUserForBazaar(bazaarUserId, handle);
  return createPrismaSession(user.id);
}

module.exports = {
  createSessionForBazaarUser,
  getSessionCookieOptions,
  buildSetCookieHeader
};

/**
 * Cookie options for ps_session. Call from Express/Connect res when setting cookie.
 * @param {object} req - Express req (req.get('origin'), req protocol/host if needed)
 * @param {Date} expiresAt
 */
function getSessionCookieOptions(req, expiresAt) {
  const origin = req && req.get ? req.get("origin") : "";
  const requestOrigin = req && req.get ? `${req.protocol || "https"}://${req.get("host") || ""}` : "";
  const crossSite = !!origin && origin !== requestOrigin;
  return {
    httpOnly: true,
    sameSite: crossSite ? "none" : "lax",
    secure: crossSite || process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  };
}

/**
 * Build Set-Cookie header value for ps_session for use with raw Node res.
 * @param {string} token
 * @param {object} options - from getSessionCookieOptions
 * @returns {string}
 */
function buildSetCookieHeader(token, options) {
  const parts = [
    `ps_session=${encodeURIComponent(token)}`,
    "Path=" + (options.path || "/"),
    "HttpOnly",
    "SameSite=" + (options.sameSite || "lax"),
    "Expires=" + (options.expires ? options.expires.toUTCString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString())
  ];
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}
