import { NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { ensureCurrentSeason } from "@/src/server/season";

export async function GET() {
  const season = await ensureCurrentSeason();
  const rows = await prisma.firmLeaderboard.findMany({
    where: { seasonId: season.id },
    orderBy: [{ pnl: "desc" }],
    take: 50,
    include: { firm: true }
  });
  return NextResponse.json(rows.map((r: any) => ({
    firm: r.firm.name,
    pnl: r.pnl,
    efficiency: r.efficiency,
    consistency: r.consistency
  })));
}
