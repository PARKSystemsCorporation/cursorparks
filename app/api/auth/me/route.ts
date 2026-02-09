import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/src/server/auth";
import { prisma } from "@/src/server/db";
import { ensureUpgradeDefs } from "@/src/server/progression";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("ps_session")?.value;
  const user = await getUserFromSession(token);
  if (!user) return NextResponse.json({ user: null });
  await ensureUpgradeDefs();
  const stats = await prisma.playerStats.findUnique({ where: { userId: user.id } });
  const upgrades = await prisma.userUpgrade.findMany({
    where: { userId: user.id },
    include: { upgrade: true }
  });
  return NextResponse.json({
    user: { id: user.id, username: user.username },
    stats,
    upgrades
  });
}
