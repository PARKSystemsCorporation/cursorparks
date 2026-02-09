import { NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { ensureCurrentSeason } from "@/src/server/season";

export async function GET() {
  try {
    const season = await ensureCurrentSeason();
    const rows = await prisma.leaderboardRun.findMany({
      where: { seasonId: season.id },
      orderBy: [{ pnl: "desc" }],
      take: 50,
      include: { user: true }
    });
    return NextResponse.json(rows.map((r: { user: { username: string }; pnl: number; riskScore: number; streak: number }) => ({
      username: r.user.username,
      pnl: r.pnl,
      riskScore: r.riskScore,
      streak: r.streak
    })));
  } catch (error) {
    console.error("leaderboard solo failed", error);
    return NextResponse.json({ error: "Leaderboard unavailable. Check database setup." }, { status: 500 });
  }
}
