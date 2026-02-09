"use client";

import type { TradeRow } from "../db/db";

type Props = {
  trades: TradeRow[];
  pnl: number;
  equity: number;
  startCash: number;
};

export function PerformanceDashboard({ trades, pnl, equity, startCash }: Props) {
  if (trades.length === 0) {
    return (
      <div className="glass animate-fadeIn rounded-md p-4 text-xs">
        <div className="mb-2 text-[9px] uppercase tracking-[0.2em] text-white/30">Performance</div>
        <div className="py-4 text-center text-white/20">Trade to generate performance data.</div>
      </div>
    );
  }

  // Build equity curve
  const equityCurve: number[] = [startCash];
  let cumCash = startCash;
  for (let i = trades.length - 1; i >= 0; i--) {
    const t = trades[i];
    const delta = t.side === "buy" ? -t.price * t.size : t.price * t.size;
    cumCash += delta;
    equityCurve.push(cumCash);
  }

  // Risk metrics
  let peak = startCash;
  let maxDD = 0;
  const drawdowns: number[] = [];
  for (const eq of equityCurve) {
    peak = Math.max(peak, eq);
    const dd = peak > 0 ? (peak - eq) / peak : 0;
    maxDD = Math.max(maxDD, dd);
    drawdowns.push(dd);
  }

  // Sharpe (simplified)
  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    returns.push((equityCurve[i] - equityCurve[i - 1]) / Math.max(1, equityCurve[i - 1]));
  }
  const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const stdReturn = returns.length > 1 ? Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1)) : 0;
  const sharpe = stdReturn > 0 ? (meanReturn / stdReturn) * Math.sqrt(returns.length) : 0;

  // Trade frequency by minute
  const now = Date.now();
  const recentTrades = trades.filter((t) => now - t.t < 300_000); // Last 5 min
  const tradesPerMin = recentTrades.length / 5;

  const returnPct = startCash > 0 ? (pnl / startCash) * 100 : 0;

  // Chart dimensions
  const W = 200;
  const H = 60;
  const eqMin = Math.min(...equityCurve);
  const eqMax = Math.max(...equityCurve);
  const eqRange = Math.max(1, eqMax - eqMin);

  const equityPath = equityCurve.map((v, i) => {
    const x = (i / Math.max(1, equityCurve.length - 1)) * W;
    const y = H - ((v - eqMin) / eqRange) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  const ddPath = drawdowns.map((v, i) => {
    const x = (i / Math.max(1, drawdowns.length - 1)) * W;
    const y = H - v * (H - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  const metrics = [
    { label: "Total Return", value: `${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%`, color: returnPct >= 0 ? "text-neon-green" : "text-neon-red" },
    { label: "Sharpe Ratio", value: sharpe.toFixed(2), color: sharpe > 1 ? "text-neon-green" : sharpe > 0 ? "text-neon-yellow" : "text-neon-red" },
    { label: "Max Drawdown", value: `${(maxDD * 100).toFixed(1)}%`, color: maxDD < 0.05 ? "text-neon-green" : maxDD < 0.15 ? "text-neon-yellow" : "text-neon-red" },
    { label: "Trade Freq", value: `${tradesPerMin.toFixed(1)}/min`, color: "text-white/60" },
    { label: "Peak Equity", value: `$${peak.toFixed(0)}`, color: "text-neon-cyan" },
    { label: "Current Equity", value: `$${equity.toFixed(0)}`, color: equity >= startCash ? "text-neon-green" : "text-neon-red" },
  ];

  return (
    <div className="glass animate-fadeIn rounded-md p-4 text-xs">
      <div className="mb-3 text-[9px] uppercase tracking-[0.2em] text-white/30">Performance Dashboard</div>

      {/* Equity Curve */}
      <div className="mb-3">
        <div className="mb-1 text-[8px] uppercase text-white/20">Equity Curve</div>
        <div className="h-16 w-full overflow-hidden rounded bg-white/[0.02]">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none">
            {/* Zero line */}
            <line
              x1="0" y1={H - ((startCash - eqMin) / eqRange) * (H - 4) - 2}
              x2={W} y2={H - ((startCash - eqMin) / eqRange) * (H - 4) - 2}
              stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="3,3"
            />
            {/* Equity line */}
            <polyline points={equityPath} fill="none" stroke={pnl >= 0 ? "#00ff9d" : "#ff3355"} strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Drawdown Chart */}
      <div className="mb-3">
        <div className="mb-1 text-[8px] uppercase text-white/20">Drawdown</div>
        <div className="h-8 w-full overflow-hidden rounded bg-white/[0.02]">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none">
            <polyline points={ddPath} fill="none" stroke="#ff3355" strokeWidth="1" strokeLinejoin="round" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded bg-white/[0.02] p-1.5 text-center transition-all duration-150 hover:bg-white/[0.04]">
            <div className="text-[8px] text-white/20">{m.label}</div>
            <div className={`font-mono text-[11px] font-semibold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
