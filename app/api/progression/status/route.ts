import { NextResponse } from "next/server";
import { getUserFromSession } from "@/src/server/auth";
import { prisma } from "@/src/server/db";
import { ensureUpgradeDefs } from "@/src/server/progression";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await ensureUpgradeDefs();
    const stats = await prisma.playerStats.findUnique({ where: { userId: user.id } });
    const upgrades = await prisma.userUpgrade.findMany({
      where: { userId: user.id },
      include: { upgrade: true }
    });
    const defs = await prisma.upgradeDef.findMany();
    return NextResponse.json({ stats, upgrades, defs });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
