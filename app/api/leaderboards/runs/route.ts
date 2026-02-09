import { NextResponse } from "next/server";
import { getUserFromSession } from "@/src/server/auth";
import { prisma } from "@/src/server/db";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const runs = await prisma.leaderboardRun.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, pnl: true, streak: true, createdAt: true }
    });
    return NextResponse.json({ runs });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
