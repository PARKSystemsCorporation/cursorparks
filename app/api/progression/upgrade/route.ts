import { NextResponse } from "next/server";
import { getUserFromSession } from "@/src/server/auth";
import { prisma } from "@/src/server/db";
import { ensureUpgradeDefs, upgradeCost } from "@/src/server/progression";

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: "Missing upgrade key" }, { status: 400 });
    await ensureUpgradeDefs();
    const def = await prisma.upgradeDef.findUnique({ where: { key } });
    if (!def) return NextResponse.json({ error: "Upgrade not found" }, { status: 404 });
    const stats = await prisma.playerStats.findUnique({ where: { userId: user.id } });
    if (!stats) return NextResponse.json({ error: "Stats missing" }, { status: 400 });
    const ownedUpgrades = await prisma.userUpgrade.findMany({
      where: { userId: user.id },
      include: { upgrade: true }
    });
    type OwnedUpgrade = { upgrade: { key: string }; level: number };
    const levelByKey = new Map<string, number>((ownedUpgrades as OwnedUpgrade[]).map((u) => [u.upgrade.key, u.level]));
    const getLevel = (upgradeKey: string): number => levelByKey.get(upgradeKey) || 0;
    const existing = await prisma.userUpgrade.findUnique({
      where: { userId_upgradeId: { userId: user.id, upgradeId: def.id } }
    });
    const level = existing?.level || 0;
    if (def.maxLevel && level >= def.maxLevel) {
      return NextResponse.json({ error: "Max level reached" }, { status: 400 });
    }
    if (def.requiresKey && def.requiresLevel) {
      if (getLevel(def.requiresKey) < def.requiresLevel) {
        return NextResponse.json({
          error: "Requires higher rank",
          requiresKey: def.requiresKey,
          requiresLevel: def.requiresLevel
        }, { status: 400 });
      }
    }
    if (def.key === "bot_scalper" && getLevel("attr_info") < 8) {
      return NextResponse.json({
        error: "Requires higher rank",
        requiresKey: "attr_info",
        requiresLevel: 8
      }, { status: 400 });
    }
    const cost = upgradeCost(def.baseCost, def.costScale, level);
    if (stats.cashoutBalance < cost) {
      return NextResponse.json({ error: "Insufficient balance", cost }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.playerStats.update({
        where: { userId: user.id },
        data: { cashoutBalance: stats.cashoutBalance - cost }
      }),
      existing
        ? prisma.userUpgrade.update({
            where: { id: existing.id },
            data: { level: existing.level + 1 }
          })
        : prisma.userUpgrade.create({
            data: { userId: user.id, upgradeId: def.id, level: 1 }
          })
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
