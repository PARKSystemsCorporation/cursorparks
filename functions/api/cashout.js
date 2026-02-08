/**
 * POST /api/cashout — Record a cash-out to D1 leaderboard
 * Body: { username: string, pnl: number, region?: string }
 */

const BAD_WORDS = [
  'fuck','shit','bitch','nigger','nigga','faggot','fag',
  'cunt','whore','slut','retard','kike','chink','spic',
  'wetback','tranny'
];

function hasBadWord(s) {
  const low = s.toLowerCase().replace(/[^a-z]/g, '');
  return BAD_WORDS.some(w => low.includes(w));
}

export async function onRequestPost(context) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  try {
    const body = await context.request.json();
    const { username, pnl, region } = body;

    // Validate username
    if (!username || typeof username !== 'string') {
      return new Response(JSON.stringify({ error: 'Username required' }), { status: 400, headers: cors });
    }
    const name = username.trim();
    if (name.length < 1 || name.length > 11) {
      return new Response(JSON.stringify({ error: 'Username must be 1-11 characters' }), { status: 400, headers: cors });
    }
    if (hasBadWord(name)) {
      return new Response(JSON.stringify({ error: 'please use another' }), { status: 400, headers: cors });
    }

    // Validate PnL
    if (typeof pnl !== 'number' || !isFinite(pnl)) {
      return new Response(JSON.stringify({ error: 'Invalid PnL' }), { status: 400, headers: cors });
    }

    // Validate region (optional)
    const rgn = (region && typeof region === 'string') ? region.trim().substring(0, 20) : null;
    if (rgn && hasBadWord(rgn)) {
      return new Response(JSON.stringify({ error: 'please use another region' }), { status: 400, headers: cors });
    }

    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), { status: 503, headers: cors });
    }

    // Insert
    await db
      .prepare('INSERT INTO leaderboard (username, pnl, region) VALUES (?, ?, ?)')
      .bind(name, pnl, rgn)
      .run();

    // Return updated top 50
    const { results } = await db
      .prepare('SELECT username, pnl, region, cashed_out_at FROM leaderboard ORDER BY pnl DESC LIMIT 50')
      .all();

    return new Response(
      JSON.stringify({ success: true, leaderboard: results || [] }),
      { headers: cors }
    );
  } catch (e) {
    console.error('Cashout error:', e);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500, headers: cors }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
