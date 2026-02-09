import { NextResponse } from "next/server";
import { getUserFromSession } from "@/src/server/auth";
import { prisma } from "@/src/server/db";
import { ensureUpgradeDefs } from "@/src/server/progression";

export async function GET() {
  const user = await getUserFromSession();
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
