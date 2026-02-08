/**
 * GET /api/leaderboard — Top 50 P&L entries from D1
 */
export async function onRequest(context) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify([]), { headers: cors });
    }

    const { results } = await db
      .prepare('SELECT username, pnl, region, cashed_out_at FROM leaderboard ORDER BY pnl DESC LIMIT 50')
      .all();

    return new Response(JSON.stringify(results || []), { headers: cors });
  } catch (e) {
    console.error('Leaderboard GET error:', e);
    return new Response(JSON.stringify([]), { status: 500, headers: cors });
  }
}
