"use client";

import type { TradeRow } from "../db/db";

type Props = {
  trades: TradeRow[];
  title?: string;
  emptyLabel?: string;
  maxRows?: number;
  showCount?: boolean;
  showStats?: boolean;
  statsLabel?: string;
};

export function TradeTape({
  trades,
  title = "Tape",
  emptyLabel = "No fills.",
  maxRows = 12,
  showCount = true,
  showStats = false,
  statsLabel = "Stats"
}: Props) {
  const totalTrades = trades.length;
  const totalVolume = trades.reduce((sum, t) => sum + t.size, 0);
  const buyVolume = trades.reduce((sum, t) => sum + (t.side === "buy" ? t.size : 0), 0);
  const sellVolume = totalVolume - buyVolume;
  const buyCount = trades.reduce((sum, t) => sum + (t.side === "buy" ? 1 : 0), 0);
  const sellCount = totalTrades - buyCount;
  const vwap = totalVolume > 0
    ? trades.reduce((sum, t) => sum + t.price * t.size, 0) / totalVolume
    : 0;
  const lastPrice = trades[0]?.price ?? 0;
  const lastSize = trades[0]?.size ?? 0;
  const lastSide = trades[0]?.side ?? null;

  return (
    <div className="glass rounded-md p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/30">{title}</span>
        {showCount && trades.length > 0 && (
          <span className="font-mono text-[9px] text-white/20">{trades.length} fills</span>
        )}
      </div>
      {showStats && trades.length > 0 && (
        <div className="mb-2 rounded border border-white/5 bg-white/[0.02] px-2 py-1 font-mono text-[10px] text-white/45">
          <div className="mb-1 text-[9px] uppercase tracking-[0.15em] text-white/25">{statsLabel}</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span>Last: {lastSide ? lastSide.toUpperCase() : "--"} {lastSize}</span>
            <span>@ ${lastPrice.toFixed(2)}</span>
            <span>VWAP: ${vwap.toFixed(2)}</span>
            <span>Vol: {totalVolume}</span>
            <span>B/S: {buyVolume}/{sellVolume}</span>
            <span>Count: {buyCount}/{sellCount}</span>
          </div>
        </div>
      )}
      <div className="space-y-0.5 overflow-y-auto scrollbar-hidden font-mono text-[11px]">
        {trades.length === 0 ? (
          <div className="py-2 text-center text-white/25">{emptyLabel}</div>
        ) : (
          trades.slice(0, maxRows).map((t, i) => (
            <div
              key={t.id ?? `trade-${i}`}
              className={`flex items-center justify-between rounded px-1.5 py-[3px] ${
                t.side === "buy" ? "text-neon-green" : "text-neon-red"
              } ${i === 0 ? "animate-slideIn bg-white/[0.03]" : ""}`}
            >
              <span>
                {t.side.toUpperCase()} {t.size}
              </span>
              <span className="text-[10px] text-white/20">
                {new Date(t.t).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit"
                })}
              </span>
              <span>${t.price.toFixed(2)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
