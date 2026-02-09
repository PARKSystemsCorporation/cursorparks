"use client";

import type { TradeRow } from "../db/db";

type Props = {
  trades: TradeRow[];
  pnl: number;
  equity: number;
  startCash: number;
};

export function TradeStatisticsPanel({ trades, pnl, equity, startCash }: Props) {
  if (trades.length === 0) {
    return (
      <div className="glass animate-fadeIn rounded-md p-3 text-xs">
        <div className="mb-2 text-[9px] uppercase tracking-[0.15em] text-white/30">Session Analytics</div>
        <div className="py-3 text-center text-white/20">Place your first trade to see stats.</div>
      </div>
    );
  }

  // Compute stats from trades
  const wins: number[] = [];
  const losses: number[] = [];
  let peak = startCash;
  let maxDrawdown = 0;
  let runningPnl = 0;

  for (let i = trades.length - 1; i >= 0; i--) {
    const t = trades[i];
    const cost = t.side === "buy" ? -t.price * t.size : t.price * t.size;
    runningPnl += cost;
    const eq = startCash + runningPnl;
    peak = Math.max(peak, eq);
    const dd = peak > 0 ? (peak - eq) / peak : 0;
    maxDrawdown = Math.max(maxDrawdown, dd);
  }

  // Build realized PnL per trade pair (simplified)
  let cumPnl = 0;
  const tradePnls: number[] = [];
  for (let i = 0; i < trades.length; i++) {
    const t = trades[i];
    const delta = t.side === "buy" ? -t.price * t.size : t.price * t.size;
    const prevCum = cumPnl;
    cumPnl += delta;
    const diff = cumPnl - prevCum;
    tradePnls.push(diff);
    if (diff > 0) wins.push(diff);
    else if (diff < 0) losses.push(diff);
  }

  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
  const bestTrade = tradePnls.length > 0 ? Math.max(...tradePnls) : 0;
  const worstTrade = tradePnls.length > 0 ? Math.min(...tradePnls) : 0;
  const buyCount = trades.filter((t) => t.side === "buy").length;
  const sellCount = totalTrades - buyCount;
  const totalVolume = trades.reduce((s, t) => s + t.size * t.price, 0);
  const returnPct = startCash > 0 ? (pnl / startCash) * 100 : 0;

  const stats = [
    { label: "Win Rate", value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? "text-neon-green" : "text-neon-red" },
    { label: "Profit Factor", value: profitFactor === Infinity ? "INF" : profitFactor.toFixed(2), color: profitFactor >= 1 ? "text-neon-green" : "text-neon-red" },
    { label: "Avg Win", value: `$${avgWin.toFixed(0)}`, color: "text-neon-green" },
    { label: "Avg Loss", value: `-$${avgLoss.toFixed(0)}`, color: "text-neon-red" },
    { label: "Best Trade", value: `$${bestTrade.toFixed(0)}`, color: "text-neon-green" },
    { label: "Worst Trade", value: `$${worstTrade.toFixed(0)}`, color: "text-neon-red" },
    { label: "Max Drawdown", value: `${(maxDrawdown * 100).toFixed(1)}%`, color: maxDrawdown > 0.05 ? "text-neon-red" : "text-white/60" },
    { label: "Return", value: `${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%`, color: returnPct >= 0 ? "text-neon-green" : "text-neon-red" },
    { label: "Buy / Sell", value: `${buyCount} / ${sellCount}`, color: "text-white/60" },
    { label: "Volume", value: `$${(totalVolume / 1000).toFixed(1)}K`, color: "text-neon-cyan" },
  ];

  // Mini PnL sparkline
  const sparkData: number[] = [];
  let cum = 0;
  for (let i = tradePnls.length - 1; i >= 0; i--) {
    cum += tradePnls[i];
    sparkData.push(cum);
  }
  const sparkMin = Math.min(0, ...sparkData);
  const sparkMax = Math.max(0, ...sparkData);
  const sparkRange = Math.max(1, sparkMax - sparkMin);

  return (
    <div className="glass animate-fadeIn rounded-md p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/30">Session Analytics</span>
        <span className="font-mono text-[9px] text-white/20">{totalTrades} trades</span>
      </div>

      {/* Sparkline */}
      {sparkData.length > 1 && (
        <div className="mb-2 h-8 w-full overflow-hidden rounded bg-white/[0.02]">
          <svg viewBox={`0 0 ${sparkData.length} 32`} className="h-full w-full" preserveAspectRatio="none">
            <polyline
              points={sparkData.map((v, i) => `${i},${32 - ((v - sparkMin) / sparkRange) * 30 - 1}`).join(" ")}
              fill="none"
              stroke={pnl >= 0 ? "#00ff9d" : "#ff3355"}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <line x1="0" y1={32 - ((0 - sparkMin) / sparkRange) * 30 - 1} x2={sparkData.length} y2={32 - ((0 - sparkMin) / sparkRange) * 30 - 1} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2,2" />
          </svg>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between rounded bg-white/[0.02] px-2 py-1 transition-all duration-150 hover:bg-white/[0.04]">
            <span className="text-[9px] text-white/30">{s.label}</span>
            <span className={`font-mono text-[10px] font-semibold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
