/**
 * GET /api/state — Shared chart, price, order book (D1-persisted)
 * Query: ?callsign=X to include account
 */

const STARTING_BALANCE = 10_000_000;
const BAR_MS = 3000;
const MAX_BARS = 90;
const SPREAD = 0.50;
const OB_LEVELS = 10;

function getOrderBook(price) {
  const asks = [], bids = [];
  for (let i = 0; i < OB_LEVELS; i++) {
    asks.push({ size: Math.max(5, 20 + ((i * 7 + 13) % 80)), price: price + SPREAD + i * 0.5 });
    bids.push({ size: Math.max(5, 20 + ((i * 11 + 17) % 80)), price: price - SPREAD - i * 0.5 });
  }
  return { asks, bids };
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
  return { liveVisitors, liveRequests, globalVelocity, globalPrice, bars, curBar, lastUpdated: now };
}

function getInitialState() {
  const now = Date.now();
  return {
    liveVisitors: 142,
    liveRequests: 3420,
    globalVelocity: 0,
    globalPrice: 142,
    bars: [],
    curBar: { o: 142, h: 142, l: 142, c: 142, t: now },
    lastUpdated: now
  };
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestGet(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }
  const { env } = context;
  const url = new URL(context.request.url);
  const callsign = (url.searchParams.get('callsign') || '').trim().substring(0, 11);

  try {
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), { status: 503, headers: cors });
    }

    const now = Date.now();
    let state;

    try {
      const row = await db.prepare('SELECT value, updated_at FROM market_state WHERE key = ?').bind('current').first();
      if (row) {
        state = JSON.parse(row.value);
      } else {
        state = getInitialState();
      }
    } catch (e) {
      state = getInitialState();
    }

    const ticks = Math.max(0, Math.floor((now - state.lastUpdated) / 1000));
    if (ticks > 0) {
      state = advanceMarket(state, ticks);
    }

    const payload = {
      price: state.globalPrice,
      velocity: state.globalVelocity,
      visitors: state.liveVisitors,
      requests: state.liveRequests,
      deficit: 11041059958 - Math.floor(now / 1000) * 10,
      bars: state.bars,
      curBar: state.curBar,
      orderBook: getOrderBook(state.globalPrice),
      topTrades: []
    };

    if (ticks > 0) {
      await db.prepare(
        'INSERT INTO market_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
      ).bind('current', JSON.stringify(state), state.lastUpdated).run();
    }

    const topRows = await db.prepare('SELECT callsign, pnl, size FROM top_trades ORDER BY pnl DESC LIMIT 3').all();
    payload.topTrades = (topRows.results || []).map(r => ({ callsign: r.callsign, pnl: r.pnl, size: r.size }));

    if (callsign) {
      const acc = await db.prepare('SELECT cash, position, avg_price, trades FROM accounts WHERE callsign = ?').bind(callsign).first();
      if (acc) {
        payload.account = {
          cash: acc.cash,
          position: acc.position,
          avgPrice: acc.avg_price,
          trades: JSON.parse(acc.trades || '[]'),
          equity: acc.cash + acc.position * state.globalPrice
        };
      } else {
        payload.account = {
          cash: STARTING_BALANCE,
          position: 0,
          avgPrice: 0,
          trades: [],
          equity: STARTING_BALANCE
        };
      }
    }

    return new Response(JSON.stringify(payload), { headers: cors });
  } catch (e) {
    console.error('State error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: cors });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: cors });
}
