// ──────────────────────────────────────────────────────────
// PARKSWEB.NEW — Server
// ──────────────────────────────────────────────────────────
const express  = require('express');
const path     = require('path');
const crypto   = require('crypto');
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
const VISITOR_WINDOW_MS = 30_000;
const REQUEST_WINDOW_MS = 30_000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const INACTIVITY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE = 'ps_session';
const MARKET_MAKER = {
  targetPrice: 100,
  visitorWeight: 0.1,
  reversion: 0.08,
  noise: 0.2,
  clampLow: 90,
  clampHigh: 110
};

let liveVisitors = 0;
let liveRequests = 0;
let globalVelocity = 0;
let globalPrice = 142;
let mmFair = 100;
let mmBias = 0;
let lastTickAt = Date.now();
const bars = [];
let curBar = { o: globalPrice, h: globalPrice, l: globalPrice, c: globalPrice, t: Date.now() };

const visitorLastSeen = new Map();
const requestTimes = [];

app.use((req, _res, next) => {
  const now = Date.now();
  liveRequests++;
  requestTimes.push(now);

  const xfwd = req.headers['x-forwarded-for'];
  const ip = Array.isArray(xfwd) ? xfwd[0] : (xfwd || req.socket.remoteAddress || '');
  const cleanIp = String(ip).split(',')[0].trim();
  if (cleanIp) visitorLastSeen.set(cleanIp, now);

  next();
});

// Per-user accounts
const users = new Map();

// Top 3 best single-trade PnL (tracked when closing)
const topTrades = [];

// AI traders (same rules as users)
const BOT_NAMES = ['AXEL','JUNO','MARA','KITE'];
const botHighs = new Map(BOT_NAMES.map(n => [n, 0]));
const botPlaces = new Map(BOT_NAMES.map(n => [n, 1 + Math.floor(Math.random() * 50)]));
let botFeed = [];

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

function marketStep(now) {
  const cutoff = now - VISITOR_WINDOW_MS;
  for (const [ip, ts] of visitorLastSeen.entries()) {
    if (ts < cutoff) visitorLastSeen.delete(ip);
  }
  liveVisitors = Math.max(1, visitorLastSeen.size);

  const reqCutoff = now - REQUEST_WINDOW_MS;
  while (requestTimes.length && requestTimes[0] < reqCutoff) requestTimes.shift();
  liveRequests = Math.max(1, Math.round(requestTimes.length * (60_000 / REQUEST_WINDOW_MS)));

  mmFair = MARKET_MAKER.targetPrice + (liveVisitors - MARKET_MAKER.targetPrice) * MARKET_MAKER.visitorWeight;
  mmBias = mmFair - globalPrice;
  const noise = (Math.random() - 0.5) * MARKET_MAKER.noise;
  globalVelocity = globalVelocity * 0.92 + mmBias * MARKET_MAKER.reversion + noise;
  globalPrice = Math.max(1, globalPrice + globalVelocity);
  if (globalPrice > MARKET_MAKER.clampHigh) {
    globalVelocity -= (globalPrice - MARKET_MAKER.clampHigh) * 0.12;
    globalPrice = MARKET_MAKER.clampHigh + (globalPrice - MARKET_MAKER.clampHigh) * 0.2;
  } else if (globalPrice < MARKET_MAKER.clampLow) {
    globalVelocity += (MARKET_MAKER.clampLow - globalPrice) * 0.12;
    globalPrice = MARKET_MAKER.clampLow - (MARKET_MAKER.clampLow - globalPrice) * 0.2;
  }

  if (!curBar || now - curBar.t >= BAR_MS) {
    if (curBar) { bars.push(curBar); if (bars.length > MAX_BARS) bars.shift(); }
    curBar = { o: globalPrice, h: globalPrice, l: globalPrice, c: globalPrice, t: now };
  } else {
    if (globalPrice > curBar.h) curBar.h = globalPrice;
    if (globalPrice < curBar.l) curBar.l = globalPrice;
    curBar.c = globalPrice;
  }
}

function advanceMarket(now) {
  const deltaMs = now - lastTickAt;
  const steps = Math.min(3600, Math.max(1, Math.floor(deltaMs / 1000)));
  for (let i = 0; i < steps; i++) {
    const t = lastTickAt + (i + 1) * 1000;
    marketStep(t);
    botTick();
  }
  lastTickAt = lastTickAt + steps * 1000;
}
setInterval(() => advanceMarket(Date.now()), 1000);

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

// ── Accounts + sessions ────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
)`);
db.exec(`CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
)`);
db.exec('CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id)');
db.exec('CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at)');

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

function recordCashout(name, pnl, region) {
  const rgn = (region && typeof region === 'string') ? region.trim().substring(0, 20) : null;
  if (rgn && hasBadWord(rgn)) return false;
  db.prepare('INSERT INTO leaderboard (username, pnl, region) VALUES (?, ?, ?)')
    .run(name, pnl, rgn);
  return true;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return header.split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=');
    if (!k) return acc;
    acc[k] = decodeURIComponent(v.join('='));
    return acc;
  }, {});
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function setSessionCookie(req, res, token) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
}

function createSession(req, res, userId) {
  const token = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  const exp = now + SESSION_TTL_MS;
  db.prepare('INSERT INTO sessions (user_id, token, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(userId, token, now, exp);
  setSessionCookie(req, res, token);
}

function getSessionUser(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const now = Date.now();
  const row = db.prepare(
    'SELECT users.id, users.username, users.last_seen, sessions.expires_at FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ?'
  ).get(token);
  if (!row) return null;
  if (row.expires_at < now) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return row;
}

function cleanupSessionsAndUsers() {
  const now = Date.now();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
  db.prepare('DELETE FROM sessions WHERE user_id NOT IN (SELECT id FROM users)').run();
  db.prepare('DELETE FROM users WHERE last_seen < ?').run(now - INACTIVITY_TTL_MS);
}
setInterval(cleanupSessionsAndUsers, 6 * 60 * 60 * 1000);

// ── GET /api/leaderboard — top 50 by P&L ──────────────────
app.get('/api/leaderboard', (_req, res) => {
  res.json(
    db.prepare(
      'SELECT username, pnl, region, cashed_out_at FROM leaderboard ORDER BY pnl DESC LIMIT 50'
    ).all()
  );
});

// ── Accounts ───────────────────────────────────────────────
app.get('/api/me', (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.json({ user: null });
  db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(Date.now(), user.id);
  res.json({ user: { username: user.username } });
});

app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || typeof username !== 'string') return res.status(400).json({ error: 'Username required' });
  if (!password || typeof password !== 'string') return res.status(400).json({ error: 'Password required' });
  const name = username.trim().substring(0, 11);
  if (name.length < 1) return res.status(400).json({ error: 'Username required' });
  if (hasBadWord(name)) return res.status(400).json({ error: 'please use another' });
  if (password.length < 6) return res.status(400).json({ error: 'Password too short' });

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  const now = Date.now();
  try {
    const info = db.prepare('INSERT INTO users (username, pass_hash, pass_salt, created_at, last_seen) VALUES (?, ?, ?, ?, ?)')
      .run(name, hash, salt, now, now);
    createSession(req, res, info.lastInsertRowid);
    res.json({ user: { username: name } });
  } catch (e) {
    res.status(400).json({ error: 'Username unavailable' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || typeof username !== 'string') return res.status(400).json({ error: 'Username required' });
  if (!password || typeof password !== 'string') return res.status(400).json({ error: 'Password required' });
  const name = username.trim().substring(0, 11);
  const row = db.prepare('SELECT id, pass_hash, pass_salt FROM users WHERE username = ?').get(name);
  if (!row) return res.status(400).json({ error: 'Invalid credentials' });
  const hash = hashPassword(password, row.pass_salt);
  const ok = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(row.pass_hash, 'hex'));
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(Date.now(), row.id);
  createSession(req, res, row.id);
  res.json({ user: { username: name } });
});

app.post('/api/logout', (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.post('/api/reset', (req, res) => {
  const { username, password, newPassword } = req.body || {};
  if (!username || typeof username !== 'string') return res.status(400).json({ error: 'Username required' });
  if (!password || typeof password !== 'string') return res.status(400).json({ error: 'Password required' });
  if (!newPassword || typeof newPassword !== 'string') return res.status(400).json({ error: 'New password required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password too short' });

  const name = username.trim().substring(0, 11);
  const row = db.prepare('SELECT id, pass_hash, pass_salt FROM users WHERE username = ?').get(name);
  if (!row) return res.status(400).json({ error: 'Invalid credentials' });
  const hash = hashPassword(password, row.pass_salt);
  const ok = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(row.pass_hash, 'hex'));
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);
  db.prepare('UPDATE users SET pass_hash = ?, pass_salt = ?, last_seen = ? WHERE id = ?')
    .run(newHash, newSalt, Date.now(), row.id);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(row.id);
  createSession(req, res, row.id);
  res.json({ user: { username: name } });
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

  recordCashout(name, pnl, rgn);

  const board = db.prepare(
    'SELECT username, pnl, region, cashed_out_at FROM leaderboard ORDER BY pnl DESC LIMIT 50'
  ).all();

  res.json({ success: true, leaderboard: board });
});

// ── GET /api/state — shared chart + price + order book ────
app.get('/api/state', (req, res) => {
  advanceMarket(Date.now());
  const callsign = (req.query.callsign || '').trim().substring(0, 11);
  const botSnapshot = BOT_NAMES.map((name) => {
    const u = getUser(name);
    const equity = u.cash + u.position * globalPrice;
    return {
      name,
      pnl: equity - STARTING_BALANCE,
      place: botPlaces.get(name) || 1
    };
  });
  const payload = {
    price: globalPrice,
    velocity: globalVelocity,
    visitors: liveVisitors,
    requests: liveRequests,
    deficit: 11041059958 - Math.floor(Date.now() / 1000) * 10,
    bars: bars.slice(),
    curBar: curBar ? { ...curBar } : null,
    orderBook: getOrderBook(globalPrice),
    topTrades: topTrades.slice(),
    bots: botSnapshot,
    botFeed: botFeed.slice(),
    mm: {
      target: MARKET_MAKER.targetPrice,
      fair: mmFair,
      bias: mmBias
    }
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

function executeTrade(callsign, side, size) {
  advanceMarket(Date.now());
  if (!callsign || typeof callsign !== 'string' || !['buy','sell'].includes(side) || !Number.isInteger(size) || size < 1)
    return { error: 'Invalid trade' };
  const name = callsign.trim().substring(0, 11);
  if (!name) return { error: 'Callsign required' };
  if (hasBadWord(name)) return { error: 'please use another' };

  const u = getUser(name);
  const price = side === 'buy' ? globalPrice + SPREAD : globalPrice - SPREAD;
  if (side === 'buy' && price * size > u.cash)
    return { error: 'Insufficient cash' };

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
  return {
    cash: u.cash,
    position: u.position,
    avgPrice: u.avgPrice,
    trades: u.trades.slice(0, 10),
    equity,
    pnl: equity - STARTING_BALANCE
  };
}

// ── POST /api/trade — execute trade (server-side) ──────────
app.post('/api/trade', (req, res) => {
  const { callsign, side, size } = req.body;
  const trade = executeTrade(callsign, side, size);
  if (trade.error) return res.status(400).json({ error: trade.error });
  res.json({ ...trade, topTrades: topTrades.slice() });
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
  advanceMarket(Date.now());
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

function pushBotFeed(entry) {
  botFeed.unshift(entry);
  if (botFeed.length > 5) botFeed = botFeed.slice(0, 5);
}

function maybeBotCashout(name, pnl) {
  const prevHigh = botHighs.get(name) || 0;
  if (pnl <= prevHigh) return;
  if (Math.random() > 0.3) return;
  botHighs.set(name, pnl);
  const place = 1 + Math.floor(Math.random() * 50);
  botPlaces.set(name, place);
  recordCashout(name, pnl, null);
  const u = getUser(name);
  u.cash = STARTING_BALANCE;
  u.position = 0;
  u.avgPrice = 0;
  u.trades = [];
  pushBotFeed({ trader: name, side: 'cash', label: 'CASHOUT #' + place });
}

function botTick() {
  if (Math.random() > 0.45) return;
  const name = BOT_NAMES[(Math.random() * BOT_NAMES.length) | 0];
  const bias = MARKET_MAKER.targetPrice - globalPrice;
  const side = bias > 0.6 ? 'buy' : (bias < -0.6 ? 'sell' : (Math.random() > 0.5 ? 'buy' : 'sell'));
  const size = Math.random() > 0.7 ? 10 : (Math.random() > 0.45 ? 5 : 1);
  const res = executeTrade(name, side, size);
  if (!res.error) {
    pushBotFeed({ trader: name, side, qty: size });
    maybeBotCashout(name, res.pnl);
  }
}
setInterval(botTick, 1200);

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
