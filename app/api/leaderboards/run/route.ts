import { NextResponse } from "next/server";
import { getUserFromSession } from "@/src/server/auth";
import { prisma } from "@/src/server/db";
import { getIO } from "@/src/server/socket";
import { computeLevel } from "@/src/server/progression";
import { ensureCurrentSeason } from "@/src/server/season";

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { pnl, riskScore = 0, streak = 0 } = await req.json();
    const pnlNum = Number(pnl || 0);
    const season = await ensureCurrentSeason();
    const stats = await prisma.playerStats.findUnique({ where: { userId: user.id } });
    if (!stats) return NextResponse.json({ error: "Stats missing" }, { status: 400 });
    const totalPnl = stats.totalPnl + pnlNum;
    const { level, xp } = computeLevel(totalPnl);
    const member = await prisma.firmMember.findUnique({ where: { userId: user.id } });

    const [, updatedStats] = await prisma.$transaction([
      prisma.leaderboardRun.create({
        data: { userId: user.id, seasonId: season.id, pnl: pnlNum, riskScore, streak }
      }),
      prisma.playerStats.update({
        where: { userId: user.id },
        data: {
          cashoutBalance: stats.cashoutBalance + pnlNum,
          totalPnl,
          level,
          xp
        }
      }),
      ...(member
        ? [
            prisma.firmLeaderboard.upsert({
              where: { firmId_seasonId: { firmId: member.firmId, seasonId: season.id } },
              create: { firmId: member.firmId, seasonId: season.id, pnl: pnlNum, efficiency: pnlNum, consistency: streak },
              update: {
                pnl: { increment: pnlNum },
                efficiency: { increment: pnlNum * 0.5 },
                consistency: { increment: streak }
              }
            })
          ]
        : [])
    ]);
    const io = getIO();
    if (io) {
      const target = io.to ? io.to(`user:${user.id}`) : io;
      target.emit("player:stats", { userId: user.id, stats: updatedStats });
    }
    return NextResponse.json({ ok: true, level });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
