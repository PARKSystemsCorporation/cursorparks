// ──────────────────────────────────────────────────────────
// PARKSWEB.NEW — Server
// ──────────────────────────────────────────────────────────
const express  = require('express');
const path     = require('path');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

// ── No-cache for every request — fresh content on each visit
const noCache = (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
};
app.use(noCache);

app.use(express.static(__dirname));

// ── Healthcheck for Railway ───────────────────────────────
app.get('/version', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ── GLOBAL MARKET STATE (shared chart, all sessions) ───────
const STARTING_BALANCE = 10_000_000;
const BAR_MS = 3000;
const MAX_BARS = 90;
const SPREAD = 0.50;

let liveVisitors = 142;
let liveRequests = 3420;
let globalVelocity = 0;
let globalPrice = 142;
const bars = [];
let curBar = { o: globalPrice, h: globalPrice, l: globalPrice, c: globalPrice, t: Date.now() };

// Per-user accounts
const users = new Map();

// Top 3 best single-trade PnL (tracked when closing)
const topTrades = [];

function addToTopTrades(callsign, pnl, size) {
  if (pnl <= 0) return;
  topTrades.push({ callsign, pnl, size, t: Date.now() });
  topTrades.sort((a, b) => b.pnl - a.pnl);
  while (topTrades.length > 3) topTrades.pop();
}

function getUser(callsign) {
  if (!callsign) return null;
  let u = users.get(callsign);
  if (!u) {
    u = { cash: STARTING_BALANCE, position: 0, avgPrice: 0, trades: [] };
    users.set(callsign, u);
  }
  return u;
}

function marketTick() {
  liveVisitors = Math.max(10, liveVisitors + (Math.random() - 0.5) * 3);
  liveRequests = Math.max(100, liveRequests + Math.floor((Math.random() - 0.5) * 40));
  const delta = (Math.random() - 0.48) * 0.15;
  globalVelocity = globalVelocity * 0.95 + delta * 0.05;
  globalPrice = Math.max(1, liveVisitors + globalVelocity * 10);

  const now = Date.now();
  if (!curBar || now - curBar.t >= BAR_MS) {
    if (curBar) { bars.push(curBar); if (bars.length > MAX_BARS) bars.shift(); }
    curBar = { o: globalPrice, h: globalPrice, l: globalPrice, c: globalPrice, t: now };
  } else {
    if (globalPrice > curBar.h) curBar.h = globalPrice;
    if (globalPrice < curBar.l) curBar.l = globalPrice;
    curBar.c = globalPrice;
  }
}
setInterval(marketTick, 1000);

// Order book (jitter for display)
const OB_LEVELS = 10;
const obAsks = Array.from({ length: OB_LEVELS }, () => 20 + Math.floor(Math.random() * 180));
const obBids = Array.from({ length: OB_LEVELS }, () => 20 + Math.floor(Math.random() * 180));

function getOrderBook(price) {
  const spread = SPREAD;
  return {
    asks: obAsks.map((s, i) => ({ size: Math.max(5, s + ((Math.random() - 0.5) * 12) | 0), price: price + spread + i * 0.5 })),
    bids: obBids.map((s, i) => ({ size: Math.max(5, s + ((Math.random() - 0.5) * 12) | 0), price: price - spread - i * 0.5 }))
  };
}

// ── Leaderboard DB ─────────────────────────────────────────
const db = new Database(path.join(__dirname, 'leaderboard.db'));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  pnl REAL NOT NULL,
  region TEXT,
  cashed_out_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
// Migration: add region column if upgrading from older schema
try { db.exec('ALTER TABLE leaderboard ADD COLUMN region TEXT'); } catch(e) { /* already exists */ }

// ── Profanity filter ───────────────────────────────────────
const BAD_WORDS = [
  'fuck','shit','bitch','nigger','nigga','faggot','fag',
  'cunt','whore','slut','retard','kike','chink','spic',
  'wetback','tranny'
];
function hasBadWord(s) {
  const low = s.toLowerCase().replace(/[^a-z]/g, '');
  return BAD_WORDS.some(w => low.includes(w));
}

// ── GET /api/leaderboard — top 50 by P&L ──────────────────
app.get('/api/leaderboard', (_req, res) => {
  res.json(
    db.prepare(
      'SELECT username, pnl, region, cashed_out_at FROM leaderboard ORDER BY pnl DESC LIMIT 50'
    ).all()
  );
});

// ── POST /api/cashout ──────────────────────────────────────
app.post('/api/cashout', (req, res) => {
  const { username, pnl, region } = req.body;

  if (!username || typeof username !== 'string')
    return res.status(400).json({ error: 'Username required' });

  const name = username.trim();
  if (name.length < 1 || name.length > 11)
    return res.status(400).json({ error: 'Username must be 1-11 characters' });
  if (hasBadWord(name))
    return res.status(400).json({ error: 'please use another' });
  if (typeof pnl !== 'number' || !isFinite(pnl))
    return res.status(400).json({ error: 'Invalid PnL' });

  const rgn = (region && typeof region === 'string') ? region.trim().substring(0, 20) : null;
  if (rgn && hasBadWord(rgn))
    return res.status(400).json({ error: 'please use another region' });

  db.prepare('INSERT INTO leaderboard (username, pnl, region) VALUES (?, ?, ?)')
    .run(name, pnl, rgn);

  const board = db.prepare(
    'SELECT username, pnl, region, cashed_out_at FROM leaderboard ORDER BY pnl DESC LIMIT 50'
  ).all();

  res.json({ success: true, leaderboard: board });
});

// ── GET /api/state — shared chart + price + order book ────
app.get('/api/state', (req, res) => {
  const callsign = (req.query.callsign || '').trim().substring(0, 11);
  const payload = {
    price: globalPrice,
    velocity: globalVelocity,
    visitors: liveVisitors,
    requests: liveRequests,
    deficit: 11041059958 - Math.floor(Date.now() / 1000) * 10,
    bars: bars.slice(),
    curBar: curBar ? { ...curBar } : null,
    orderBook: getOrderBook(globalPrice),
    topTrades: topTrades.slice()
  };
  if (callsign) {
    const u = getUser(callsign);
    payload.account = {
      cash: u.cash,
      position: u.position,
      avgPrice: u.avgPrice,
      trades: u.trades.slice(0, 10),
      equity: u.cash + u.position * globalPrice
    };
  }
  res.json(payload);
});

// ── POST /api/trade — execute trade (server-side) ──────────
app.post('/api/trade', (req, res) => {
  const { callsign, side, size } = req.body;
  if (!callsign || typeof callsign !== 'string' || !['buy','sell'].includes(side) || !Number.isInteger(size) || size < 1)
    return res.status(400).json({ error: 'Invalid trade' });
  const name = callsign.trim().substring(0, 11);
  if (!name) return res.status(400).json({ error: 'Callsign required' });
  if (hasBadWord(name)) return res.status(400).json({ error: 'please use another' });

  const u = getUser(name);
  const price = side === 'buy' ? globalPrice + SPREAD : globalPrice - SPREAD;
  if (side === 'buy' && price * size > u.cash)
    return res.status(400).json({ error: 'Insufficient cash' });

  u.cash += side === 'buy' ? -price * size : price * size;
  u.trades.unshift({ side, price, size, time: Date.now() });
  if (u.trades.length > 50) u.trades.pop();

  if (side === 'buy') {
    if (u.position >= 0) {
      const tc = u.avgPrice * u.position + price * size;
      u.position += size;
      u.avgPrice = u.position > 0 ? tc / u.position : price;
    } else {
      const closeSize = Math.min(size, -u.position);
      const pnl = (price - u.avgPrice) * closeSize;
      if (closeSize > 0) addToTopTrades(name, pnl, closeSize);
      u.position += size;
      if (u.position === 0) u.avgPrice = 0;
      else if (u.position > 0) u.avgPrice = price;
    }
    globalVelocity += 0.02 * Math.min(size / 10, 5);
  } else {
    if (u.position <= 0) {
      const tc = u.avgPrice * Math.abs(u.position) + price * size;
      u.position -= size;
      u.avgPrice = u.position !== 0 ? tc / Math.abs(u.position) : price;
    } else {
      const closeSize = Math.min(size, u.position);
      const pnl = (u.avgPrice - price) * closeSize;
      if (closeSize > 0) addToTopTrades(name, pnl, closeSize);
      u.position -= size;
      if (u.position === 0) u.avgPrice = 0;
      else if (u.position < 0) u.avgPrice = price;
    }
    globalVelocity -= 0.02 * Math.min(size / 10, 5);
  }

  const equity = u.cash + u.position * globalPrice;
  res.json({
    cash: u.cash,
    position: u.position,
    avgPrice: u.avgPrice,
    trades: u.trades.slice(0, 10),
    equity,
    pnl: equity - STARTING_BALANCE,
    topTrades: topTrades.slice()
  });
});

// ── POST /api/rug — liquidate all positions ───────────────
app.post('/api/rug', (req, res) => {
  const { callsign } = req.body;
  if (!callsign || typeof callsign !== 'string')
    return res.status(400).json({ error: 'Callsign required' });
  const name = callsign.trim().substring(0, 11);
  if (!name) return res.status(400).json({ error: 'Callsign required' });

  const u = getUser(name);
  if (u.position > 0) {
    u.cash += globalPrice * u.position;
  } else if (u.position < 0) {
    u.cash -= globalPrice * Math.abs(u.position);
  }
  u.position = 0;
  u.avgPrice = 0;

  const equity = u.cash;
  res.json({
    cash: u.cash,
    position: 0,
    avgPrice: 0,
    trades: u.trades.slice(0, 10),
    equity,
    pnl: equity - STARTING_BALANCE,
    liquidated: true,
    topTrades: topTrades.slice()
  });
});

// ── GET /api/account — get or create account ───────────────
app.get('/api/account', (req, res) => {
  const callsign = (req.query.callsign || '').trim().substring(0, 11);
  if (!callsign) return res.json({ cash: STARTING_BALANCE, position: 0, avgPrice: 0, trades: [] });
  const u = getUser(callsign);
  const equity = u.cash + u.position * globalPrice;
  res.json({
    cash: u.cash,
    position: u.position,
    avgPrice: u.avgPrice,
    trades: u.trades.slice(0, 10),
    equity,
    pnl: equity - STARTING_BALANCE
  });
});

// ── Presence (in-memory for local dev) ─────────────────────
const presence = new Map();
const STALE_MS = 20_000;
app.post('/api/presence', (req, res) => {
  try {
    const { id, callsign, region, pnl, equity } = req.body;
    if (!id || !callsign) return res.status(400).json({ error: 'Missing id/callsign' });
    const key = id;
    presence.set(key, { callsign: callsign.substring(0, 11), region: region || null, pnl: pnl || 0, equity: equity || 0, lastSeen: Date.now() });
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: 'server error' }); }
});
app.get('/api/presence', (_req, res) => {
  const cutoff = Date.now() - STALE_MS;
  for (const [k, v] of presence.entries()) { if (v.lastSeen < cutoff) presence.delete(k); }
  const list = Array.from(presence.values()).sort((a, b) => b.pnl - a.pnl);
  res.json(list);
});

// ── GET /api/analytics ──────────────────────────────────────
// In production (Cloudflare Pages), functions/api/analytics.js handles this
// route automatically with real Cloudflare zone data.
// Locally, we serve mock data so the frontend always has something.
app.get('/api/analytics', (_req, res) => {
  const now = new Date();
  const history = [];
  for (let i = 47; i >= 0; i--) {
    const ts   = new Date(now.getTime() - i * 30 * 60_000);
    const h    = ts.getHours();
    const base = 80 + Math.sin((h - 6) * Math.PI / 12) * 60;
    const v    = Math.max(20, Math.floor(base + (Math.random() - 0.5) * 40));
    const r    = Math.floor(v * (20 + Math.random() * 15));
    history.push({ t: ts.toISOString(), v, r, visits: Math.floor(v * 1.2) });
  }
  const last = history.at(-1);
  res.json({
    mock: true,
    current: {
      timestamp: now.toISOString(),
      visitors: last.v,
      requests: last.r,
      visits: last.visits,
      cachePercent: 5,
      bytesServed: 5e6
    },
    history,
    baseline: { avgVisitors: 100, avgRequests: 2500 }
  });
});

// ── GET /version — deploy fingerprint for monitoring (no cache)
const DEPLOY_ID = process.env.RAILWAY_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || 
  (process.env.SOURCE_VERSION || process.env.RENDER_GIT_COMMIT_SHA || 'local');
const DEPLOY_TIME = process.env.RAILWAY_DEPLOYMENT_CREATED_AT || 
  new Date().toISOString().slice(0, 19) + 'Z';
app.get('/version', (_req, res) => {
  res.set('Cache-Control', 'no-store, no-cache');
  res.json({
    ok: true,
    deploy: DEPLOY_ID,
    time: DEPLOY_TIME,
    env: process.env.NODE_ENV || 'development'
  });
});

// ── Launch ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PARKSWEB Terminal live -> http://localhost:${PORT}`);
  console.log(`Deploy ID: ${DEPLOY_ID}`);
});
