import { NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { ensureCurrentSeason } from "@/src/server/season";

export async function GET() {
  try {
    const season = await ensureCurrentSeason();
    const rows = await prisma.firmLeaderboard.findMany({
      where: { seasonId: season.id },
      orderBy: [{ pnl: "desc" }],
      take: 50,
      include: { firm: true }
    });
    return NextResponse.json(rows.map((r: { firm: { name: string }; pnl: number; efficiency: number; consistency: number }) => ({
      firm: r.firm.name,
      pnl: r.pnl,
      efficiency: r.efficiency,
      consistency: r.consistency
    })));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
