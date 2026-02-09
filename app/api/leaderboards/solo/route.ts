import { NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { ensureCurrentSeason } from "@/src/server/season";

export async function GET() {
  const season = await ensureCurrentSeason();
  const rows = await prisma.leaderboardRun.findMany({
    where: { seasonId: season.id },
    orderBy: [{ pnl: "desc" }],
    take: 50,
    include: { user: true }
  });
  return NextResponse.json(rows.map((r) => ({
    username: r.user.username,
    pnl: r.pnl,
    riskScore: r.riskScore,
    streak: r.streak
  })));
}
