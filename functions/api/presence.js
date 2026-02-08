/**
 * /api/presence
 * POST — heartbeat: register/update a player session
 * GET  — list all active players (seen in last 20 seconds)
 */

const STALE_MS = 20_000; // 20 seconds = offline

export async function onRequestPost(context) {
  const cors = h();
  try {
    const { id, callsign, region, pnl, equity } = await context.request.json();
    if (!id || !callsign) return j({ error: 'Missing id/callsign' }, 400, cors);
    const db = context.env.DB;
    if (!db) return j({ ok: true }, 200, cors);
    await db.prepare(
      `INSERT INTO active_sessions (id, callsign, region, pnl, equity, last_seen)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         callsign=excluded.callsign,
         region=excluded.region,
         pnl=excluded.pnl,
         equity=excluded.equity,
         last_seen=excluded.last_seen`
    ).bind(id, callsign.substring(0, 11), region || null, pnl || 0, equity || 0, Date.now()).run();
    return j({ ok: true }, 200, cors);
  } catch (e) {
    console.error('Presence POST:', e);
    return j({ error: 'server error' }, 500, cors);
  }
}

export async function onRequestGet(context) {
  const cors = h();
  try {
    const db = context.env.DB;
    if (!db) return j([], 200, cors);
    const cutoff = Date.now() - STALE_MS;
    // Clean stale sessions
    await db.prepare('DELETE FROM active_sessions WHERE last_seen < ?').bind(cutoff).run();
    // Return active sorted by PnL desc
    const { results } = await db.prepare(
      'SELECT callsign, region, pnl, equity FROM active_sessions WHERE last_seen >= ? ORDER BY pnl DESC LIMIT 50'
    ).bind(cutoff).all();
    return j(results || [], 200, cors);
  } catch (e) {
    console.error('Presence GET:', e);
    return j([], 500, cors);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: h() });
}

function h() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}
function j(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}
