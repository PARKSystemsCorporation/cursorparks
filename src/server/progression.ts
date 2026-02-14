import { prisma } from "./db";

export const UPGRADE_DEFS = [
  {
    key: "attr_lots",
    category: "lots",
    title: "LOTS Capacity",
    description: "Increase max order size",
    baseCost: 400,
    costScale: 1.18
  },
  {
    key: "attr_balance",
    category: "balance",
    title: "Starting Balance",
    description: "Increase starting cash per session",
    baseCost: 400,
    costScale: 1.18
  },
  {
    key: "attr_info",
    category: "info",
    title: "INFO Rank",
    description: "Unlock intel modules + faster news",
    baseCost: 600,
    costScale: 1.22,
    maxLevel: 20
  },
  {
    key: "info_news_speed",
    category: "info",
    title: "Macro News Feed",
    description: "Unlock macro news feed + reduce delay",
    baseCost: 500,
    costScale: 1.35,
    maxLevel: 5,
    requiresKey: "attr_info",
    requiresLevel: 1
  },
  {
    key: "info_sentiment",
    category: "info",
    title: "Sentiment Scoring",
    description: "Show macro sentiment",
    baseCost: 1200,
    costScale: 1.4,
    maxLevel: 1,
    requiresKey: "attr_info",
    requiresLevel: 6
  },
  {
    key: "info_vol_forecast",
    category: "info",
    title: "Vol Forecast",
    description: "Volatility warnings",
    baseCost: 2200,
    costScale: 1.45,
    maxLevel: 1,
    requiresKey: "attr_info",
    requiresLevel: 10
  },
  {
    key: "chart_indicators",
    category: "chart",
    title: "Indicators Pack",
    description: "EMA/VWAP/Bollinger/SMA",
    baseCost: 800,
    costScale: 1.35,
    maxLevel: 1,
    requiresKey: "attr_info",
    requiresLevel: 3
  },
  {
    key: "chart_drawing",
    category: "chart",
    title: "Drawing Tools",
    description: "Trendlines + S/R",
    baseCost: 1400,
    costScale: 1.4,
    maxLevel: 1,
    requiresKey: "attr_info",
    requiresLevel: 5
  },
  {
    key: "chart_multi_tf",
    category: "chart",
    title: "Multi-Timeframe",
    description: "Unlock 5s/10s candles",
    baseCost: 2600,
    costScale: 1.45,
    maxLevel: 1,
    requiresKey: "attr_info",
    requiresLevel: 8
  },
  {
    key: "bot_alerts",
    category: "bot",
    title: "Alert Bot",
    description: "Bias alerts + confidence upgrades",
    baseCost: 900,
    costScale: 1.38,
    maxLevel: 3,
    requiresKey: "attr_info",
    requiresLevel: 4
  },
  {
    key: "bot_risk",
    category: "bot",
    title: "Risk Manager",
    description: "Raise size cap + reduce slippage",
    baseCost: 1800,
    costScale: 1.42,
    maxLevel: 5,
    requiresKey: "attr_lots",
    requiresLevel: 4
  },
  {
    key: "bot_scalper",
    category: "bot",
    title: "Scalper Assist",
    description: "Fast scalper hints",
    baseCost: 2800,
    costScale: 1.48,
    maxLevel: 3,
    requiresKey: "attr_lots",
    requiresLevel: 8
  }
];

let _upgradeDefsSeeded = false;

export async function ensureUpgradeDefs() {
  if (_upgradeDefsSeeded) return;
  for (const def of UPGRADE_DEFS) {
    await prisma.upgradeDef.upsert({
      where: { key: def.key },
      update: {
        category: def.category,
        title: def.title,
        description: def.description,
        baseCost: def.baseCost,
        costScale: def.costScale,
        maxLevel: def.maxLevel ?? null,
        requiresKey: def.requiresKey ?? null,
        requiresLevel: def.requiresLevel ?? null
      },
      create: {
        key: def.key,
        category: def.category,
        title: def.title,
        description: def.description,
        baseCost: def.baseCost,
        costScale: def.costScale,
        maxLevel: def.maxLevel ?? null,
        requiresKey: def.requiresKey ?? null,
        requiresLevel: def.requiresLevel ?? null
      }
    });
  }
  _upgradeDefsSeeded = true;
}

export function upgradeCost(base: number, scale: number, level: number) {
  return Math.round(base * Math.pow(scale, level));
}

export function computeLevel(totalPnl: number) {
  const xp = Math.max(0, totalPnl);
  const level = Math.max(1, Math.floor(Math.log10(1 + xp / 1000) * 10) + 1);
  return { level, xp };
}

export async function ensurePlayerStats(userId: string) {
  const existing = await prisma.playerStats.findUnique({ where: { userId } });
  if (!existing) await prisma.playerStats.create({ data: { userId } });
}
