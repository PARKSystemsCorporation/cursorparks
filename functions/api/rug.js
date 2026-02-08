/**
 * POST /api/rug — Liquidate all positions (D1-persisted)
 * Body: { callsign }
 */

const BAD_WORDS = ['fuck','shit','bitch','nigger','nigga','faggot','fag','cunt','whore','slut','retard','kike','chink','spic','wetback','tranny'];
const STARTING_BALANCE = 10_000_000;
const BAR_MS = 3000;
const MAX_BARS = 90;

function hasBadWord(s) {
  const low = s.toLowerCase().replace(/[^a-z]/g, '');
  return BAD_WORDS.some(w => low.includes(w));
}

function advanceMarket(state, ticks) {
  let { liveVisitors, liveRequests, globalVelocity, globalPrice, bars, curBar, lastUpdated } = state;
  let now = lastUpdated;
  for (let t = 0; t < ticks; t++) {
    now += 1000;
    const s = Math.sin((now / 1000) * 0.1) * 2;
    const c = Math.cos((now / 1000) * 0.13) * 0.02;
    liveVisitors = Math.max(10, liveVisitors + s);
    liveRequests = Math.max(100, liveRequests + Math.floor(s * 15));
    globalVelocity = globalVelocity * 0.95 + c * 0.05;
    globalPrice = Math.max(1, liveVisitors + globalVelocity * 10);
    if (!curBar || now - curBar.t >= BAR_MS) {
      if (curBar) { bars.push(curBar); if (bars.length > MAX_BARS) bars.shift(); }
      curBar = { o: globalPrice, h: globalPrice, l: globalPrice, c: globalPrice, t: now };
    } else {
      if (globalPrice > curBar.h) curBar.h = globalPrice;
      if (globalPrice < curBar.l) curBar.l = globalPrice;
      curBar.c = globalPrice;
    }
  }
  return { ...state, liveVisitors, liveRequests, globalVelocity, globalPrice, bars, curBar, lastUpdated: now };
}

function getInitialState() {
  const now = Date.now();
  return { liveVisitors: 142, liveRequests: 3420, globalVelocity: 0, globalPrice: 142, bars: [], curBar: { o: 142, h: 142, l: 142, c: 142, t: now }, lastUpdated: now };
}

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };

export async function onRequestPost(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }
  const { env } = context;
  try {
    const { callsign } = await context.request.json();
    if (!callsign || typeof callsign !== 'string')
      return new Response(JSON.stringify({ error: 'Callsign required' }), { status: 400, headers: cors });
    const name = callsign.trim().substring(0, 11);
    if (!name) return new Response(JSON.stringify({ error: 'Callsign required' }), { status: 400, headers: cors });
    if (hasBadWord(name)) return new Response(JSON.stringify({ error: 'please use another' }), { status: 400, headers: cors });

    const db = env.DB;
    if (!db) return new Response(JSON.stringify({ error: 'Database not available' }), { status: 503, headers: cors });

    const now = Date.now();
    let state;
    try {
      const row = await db.prepare('SELECT value FROM market_state WHERE key = ?').bind('current').first();
      state = row ? JSON.parse(row.value) : getInitialState();
    } catch (e) { state = getInitialState(); }

    const ticks = Math.max(0, Math.floor((now - state.lastUpdated) / 1000));
    state = advanceMarket(state, ticks);

    let acc = await db.prepare('SELECT cash, position, avg_price, trades FROM accounts WHERE callsign = ?').bind(name).first();
    if (!acc) {
      return new Response(JSON.stringify({
        cash: STARTING_BALANCE, position: 0, avgPrice: 0, trades: [], equity: STARTING_BALANCE,
        pnl: 0, liquidated: true, topTrades: []
      }), { headers: cors });
    }

    let cash = acc.cash;
    if (acc.position > 0) cash += state.globalPrice * acc.position;
    else if (acc.position < 0) cash -= state.globalPrice * Math.abs(acc.position);

    await db.prepare('INSERT INTO market_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
      .bind('current', JSON.stringify(state), now).run();
    await db.prepare('UPDATE accounts SET cash = ?, position = ?, avg_price = ?, trades = ?, updated_at = ? WHERE callsign = ?')
      .bind(cash, 0, 0, acc.trades, now, name).run();

    const topRows = await db.prepare('SELECT callsign, pnl, size FROM top_trades ORDER BY pnl DESC LIMIT 3').all();
    return new Response(JSON.stringify({
      cash, position: 0, avgPrice: 0, trades: JSON.parse(acc.trades || '[]').slice(0, 10),
      equity: cash, pnl: cash - STARTING_BALANCE, liquidated: true,
      topTrades: (topRows.results || []).map(r => ({ callsign: r.callsign, pnl: r.pnl, size: r.size }))
    }), { headers: cors });
  } catch (e) {
    console.error('Rug error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: cors });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}
