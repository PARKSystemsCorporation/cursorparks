"use client";

import { memo, useEffect, useMemo, useRef } from "react";
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

export const TradeTape = memo(function TradeTape({
  trades,
  title = "Tape",
  emptyLabel = "No fills.",
  maxRows = 12,
  showCount = true,
  showStats = false,
  statsLabel = "Stats"
}: Props) {
  const { totalTrades, totalVolume, buyVolume, sellVolume, buyCount, sellCount, vwap, lastPrice, lastSize, lastSide } = useMemo(() => {
    const totalTrades = trades.length;
    const totalVolume = trades.reduce((sum, t) => sum + t.size, 0);
    const buyVolume = trades.reduce((sum, t) => sum + (t.side === "buy" ? t.size : 0), 0);
    const sellVolume = totalVolume - buyVolume;
    const buyCount = trades.reduce((sum, t) => sum + (t.side === "buy" ? 1 : 0), 0);
    const sellCount = totalTrades - buyCount;
    const vwap = totalVolume > 0
      ? trades.reduce((sum, t) => sum + t.price * t.size, 0) / totalVolume
      : 0;
    return {
      totalTrades, totalVolume, buyVolume, sellVolume, buyCount, sellCount, vwap,
      lastPrice: trades[0]?.price ?? 0,
      lastSize: trades[0]?.size ?? 0,
      lastSide: (trades[0]?.side ?? null) as string | null,
    };
  }, [trades]);
  const prevTradesRef = useRef(trades);

  useEffect(() => {
    prevTradesRef.current = trades;
  }, [trades]);

  const isNewTrade = trades.length > 0 && (
    prevTradesRef.current.length === 0 || 
    trades[0]?.id !== prevTradesRef.current[0]?.id
  );

  return (
    <div className="glass rounded-md p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/70">{title}</span>
        {showCount && trades.length > 0 && (
          <span className="font-mono text-[9px] text-white/70 transition-all duration-200">{trades.length} fills</span>
        )}
      </div>
      {showStats && trades.length > 0 && (
        <div className="mb-2 rounded border border-white/5 bg-white/[0.02] px-2 py-1 font-mono text-[10px] text-white/80 transition-all duration-200">
          <div className="mb-1 text-[9px] uppercase tracking-[0.15em] text-white/70">{statsLabel}</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="transition-colors duration-200">Last: <span className={lastSide === "buy" ? "text-neon-green" : "text-neon-red"}>{lastSide ? lastSide.toUpperCase() : "--"}</span> {lastSize}</span>
            <span>@ ${lastPrice.toFixed(2)}</span>
            <span>VWAP: ${vwap.toFixed(2)}</span>
            <span>Vol: {totalVolume}</span>
            <span>B/S: <span className="text-neon-green">{buyVolume}</span>/<span className="text-neon-red">{sellVolume}</span></span>
            <span>Count: <span className="text-neon-green">{buyCount}</span>/<span className="text-neon-red">{sellCount}</span></span>
          </div>
        </div>
      )}
      <div className="space-y-0.5 overflow-y-auto scrollbar-hidden font-mono text-[11px]">
        {trades.length === 0 ? (
          <div className="py-2 text-center text-white/70">{emptyLabel}</div>
        ) : (
          trades.slice(0, maxRows).map((t, i) => {
            const isNew = i === 0 && isNewTrade;
            return (
              <div
                key={t.id ?? `trade-${i}`}
                className={`flex items-center justify-between rounded px-1.5 py-[3px] transition-all duration-200 ${
                  t.side === "buy" ? "text-neon-green" : "text-neon-red"
                } ${isNew ? "animate-slideInRight bg-white/[0.05] shadow-lg" : "hover:bg-white/[0.02]"}`}
              >
                <span className="font-semibold">
                  {t.side.toUpperCase()} {t.size}
                </span>
                <span className="text-[10px] text-white/70">
                  {new Date(t.t).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  })}
                </span>
                <span className="font-semibold">${t.price.toFixed(2)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
