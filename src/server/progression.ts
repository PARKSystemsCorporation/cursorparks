import { prisma } from "./db";

export const UPGRADE_DEFS = [
  { key: "info_news_speed", category: "info", title: "Faster News", description: "Reduce news delay", baseCost: 500, costScale: 1.35 },
  { key: "info_sentiment", category: "info", title: "Sentiment Scoring", description: "Show macro sentiment", baseCost: 1200, costScale: 1.4 },
  { key: "info_vol_forecast", category: "info", title: "Vol Forecast", description: "Volatility warnings", baseCost: 2200, costScale: 1.45 },
  { key: "chart_indicators", category: "chart", title: "Indicators Pack", description: "Unlock EMA/VWAP/RSI/MACD", baseCost: 800, costScale: 1.35 },
  { key: "chart_drawing", category: "chart", title: "Drawing Tools", description: "Trendlines and S/R", baseCost: 1400, costScale: 1.4 },
  { key: "chart_multi_tf", category: "chart", title: "Multi-Timeframe", description: "Multiple timeframes", baseCost: 2600, costScale: 1.45 },
  { key: "bot_alerts", category: "bot", title: "Alert Bot", description: "Signal alerts", baseCost: 900, costScale: 1.38 },
  { key: "bot_risk", category: "bot", title: "Risk Manager", description: "Auto risk rules", baseCost: 1800, costScale: 1.42 },
  { key: "bot_scalper", category: "bot", title: "Scalper Assistant", description: "Fast scalper mode", baseCost: 2800, costScale: 1.48 }
];

export async function ensureUpgradeDefs() {
  const count = await prisma.upgradeDef.count();
  if (count > 0) return;
  await prisma.upgradeDef.createMany({ data: UPGRADE_DEFS });
}

export function upgradeCost(base: number, scale: number, level: number) {
  return Math.round(base * Math.pow(scale, level));
}

export function computeLevel(totalPnl: number) {
  const xp = Math.max(0, totalPnl);
  const level = Math.max(1, Math.floor(Math.log10(1 + xp / 1000) * 10) + 1);
  return { level, xp };
}
