"use client";

import { useEffect, useRef } from "react";
import type { RankInfo } from "../engine/ranks";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber";

type Props = {
  symbol: string;
  symbols?: string[];
  onSymbol?: (symbol: string) => void;
  pnl: number;
  cash: number;
  equity: number;
  bid: number;
  ask: number;
  qty: number;
  maxQty: number;
  position: { size: number; avgPrice: number };
  currentPrice: number;
  rank: RankInfo;
  tradeCount: number;
  onQty: (q: number) => void;
  onBuy: () => void;
  onSell: () => void;
  onCashout: () => void;
  onRug: () => void;
  canRug: boolean;
};

const qtyOptions = [1, 10, 100, 1000, 10000];

export function TradePanel({
  symbol,
  pnl,
  cash,
  equity,
  bid,
  ask,
  qty,
  maxQty,
  position,
  currentPrice,
  rank,
  tradeCount,
  onQty,
  onBuy,
  onSell,
  onCashout,
  onRug,
  canRug
}: Props) {
  const unrealizedPnl =
    position.size !== 0 ? position.size * (currentPrice - position.avgPrice) : 0;
  const baseMin = rank.min === -Infinity ? 0 : rank.min;
  const progressToNext =
    rank.nextMin !== null
      ? Math.min(1, Math.max(0, (pnl - baseMin) / (rank.nextMin - baseMin)))
      : 1;

  // Animated numbers
  const animatedPnl = useAnimatedNumber(pnl, 400, 2);
  const animatedCash = useAnimatedNumber(cash, 300, 0);
  const animatedEquity = useAnimatedNumber(equity, 300, 0);
  const animatedUnrealizedPnl = useAnimatedNumber(unrealizedPnl, 300, 2);
  const animatedCurrentPrice = useAnimatedNumber(currentPrice, 200, 2);
  const animatedBid = useAnimatedNumber(bid, 200, 2);
  const animatedAsk = useAnimatedNumber(ask, 200, 2);

  // Track PnL direction for animation
  const prevPnlRef = useRef(pnl);
  const pnlDirectionRef = useRef<"up" | "down" | null>(null);
  
  useEffect(() => {
    if (pnl > prevPnlRef.current) {
      pnlDirectionRef.current = "up";
    } else if (pnl < prevPnlRef.current) {
      pnlDirectionRef.current = "down";
    }
    prevPnlRef.current = pnl;
  }, [pnl]);

  return (
    <div className="glass flex flex-col gap-2.5 rounded-md p-3">
      {/* ── PnL + Rank ── */}
      <div className="text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.15em] text-white/70">Session</span>
          <span className="rounded border border-neon-cyan/20 bg-neon-cyan/5 px-1.5 py-0.5 text-[9px] font-semibold text-neon-cyan">
            {rank.name}
          </span>
        </div>
        <div
          className={`number-animate font-mono text-2xl font-bold transition-colors duration-200 ${
            pnl >= 0 ? "text-neon-green" : "text-neon-red"
          } ${animatedPnl.isAnimating ? "updating" : ""}`}
        >
          {pnl >= 0 ? "+" : ""}${animatedPnl.displayValue}
        </div>
        {rank.nextMin !== null && (
          <div className="mx-auto mt-1.5 w-full">
            <div className="h-px w-full bg-white/10 overflow-hidden rounded-full">
              <div
                className="progress-bar-animate h-full bg-neon-cyan/30 transition-all duration-500 ease-out"
                style={{ width: `${progressToNext * 100}%` }}
              />
            </div>
            <div className="mt-0.5 text-[9px] text-white/70">
              ${rank.nextMin.toLocaleString()} to next rank
            </div>
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded border border-white/5 bg-white/[0.02] p-1.5 transition-all duration-200 hover:bg-white/[0.03]">
          <div className="text-[9px] text-white/70">Cash</div>
          <div className={`number-animate font-mono text-[12px] font-semibold transition-colors duration-200 ${
            animatedCash.isAnimating ? "updating" : ""
          }`}>
            ${animatedCash.displayValue}
          </div>
        </div>
        <div className="rounded border border-white/5 bg-white/[0.02] p-1.5 transition-all duration-200 hover:bg-white/[0.03]">
          <div className="text-[9px] text-white/70">Equity</div>
          <div className={`number-animate font-mono text-[12px] font-semibold transition-colors duration-200 ${
            animatedEquity.isAnimating ? "updating" : ""
          }`}>
            ${animatedEquity.displayValue}
          </div>
        </div>
        <div className="rounded border border-white/5 bg-white/[0.02] p-1.5 transition-all duration-200 hover:bg-white/[0.03]">
          <div className="text-[9px] text-white/70">Trades</div>
          <div className="font-mono text-[12px] font-semibold">{tradeCount}</div>
        </div>
      </div>

      {/* ── Open Position ── */}
      {position.size !== 0 && (
        <div className="animate-fadeIn rounded border border-white/5 bg-white/[0.02] p-2 font-mono text-[11px] transition-all duration-200 hover:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <span className={`transition-colors duration-200 ${position.size > 0 ? "text-neon-green" : "text-neon-red"}`}>
              {position.size > 0 ? "LONG" : "SHORT"} {Math.abs(position.size)}
            </span>
            <span
              className={`number-animate font-semibold transition-colors duration-200 ${
                unrealizedPnl >= 0 ? "text-neon-green" : "text-neon-red"
              } ${animatedUnrealizedPnl.isAnimating ? "updating" : ""}`}
            >
              {unrealizedPnl >= 0 ? "+" : ""}
              {animatedUnrealizedPnl.displayValue}
            </span>
          </div>
          <div className="mt-0.5 text-[9px] text-white/70">
            avg {position.avgPrice.toFixed(2)} &rarr; <span className="number-animate">{animatedCurrentPrice.displayValue}</span>
          </div>
        </div>
      )}

      {/* ── Ticker ── */}
      <div className="rounded border border-white/5 bg-white/[0.02] p-2">
        <div className="text-[9px] uppercase tracking-[0.15em] text-white/70">Ticker</div>
        <div className="mt-1 flex items-center justify-between gap-2 rounded bg-white/5 px-2 py-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
              {symbol}
            </span>
            <span className="text-[11px] text-white/90">PARKSystems Corporation</span>
          </div>
          <span className={`number-animate font-mono text-[11px] text-neon-cyan transition-colors duration-200 ${
            animatedCurrentPrice.isAnimating ? "updating" : ""
          }`}>
            ${animatedCurrentPrice.displayValue}
          </span>
        </div>
      </div>

      {/* ── Qty ── */}
      <div className="grid grid-cols-5 gap-1">
        {qtyOptions.map((q) => (
          <button
            key={q}
            onClick={() => onQty(q)}
            disabled={q > maxQty}
            className={`rounded py-1.5 text-[11px] font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-30 ${
              qty === q
                ? "bg-white/15 text-white scale-105 shadow-lg"
                : "bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white/90 hover:scale-105 active:scale-95"
            }`}
          >
            {q >= 1000 ? `${q / 1000}K` : q}
          </button>
        ))}
      </div>
      <div className="text-center text-[9px] text-white/70">
        Max {Math.max(10, Math.floor(maxQty))}
      </div>

      {/* ── Buy / Sell ── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBuy}
          className="group relative overflow-hidden rounded bg-neon-green py-2.5 text-sm font-bold text-black transition-all duration-200 hover:shadow-glow-green hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="relative z-10">BUY </span>
          <span className={`number-animate relative z-10 transition-colors duration-200 ${
            animatedAsk.isAnimating ? "updating" : ""
          }`}>
            {animatedAsk.displayValue}
          </span>
          <span className="absolute inset-0 bg-white/0 transition-all duration-200 group-hover:bg-white/10" />
        </button>
        <button
          onClick={onSell}
          className="group relative overflow-hidden rounded bg-neon-red py-2.5 text-sm font-bold text-black transition-all duration-200 hover:shadow-glow-red hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="relative z-10">SELL </span>
          <span className={`number-animate relative z-10 transition-colors duration-200 ${
            animatedBid.isAnimating ? "updating" : ""
          }`}>
            {animatedBid.displayValue}
          </span>
          <span className="absolute inset-0 bg-white/0 transition-all duration-200 group-hover:bg-white/10" />
        </button>
      </div>

      {/* ── RUG + Cash Out ── */}
      <button
        onClick={onRug}
        disabled={!canRug}
        className="rounded border border-neon-red/20 bg-neon-red/5 py-1.5 text-[10px] uppercase tracking-[0.15em] text-neon-red transition-all duration-200 hover:bg-neon-red/10 hover:border-neon-red/30 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
      >
        RUG (Flatten)
      </button>
      <button
        onClick={onCashout}
        className="rounded border border-white/10 py-2 text-[10px] uppercase tracking-[0.15em] text-white/70 transition-all duration-200 hover:border-white/20 hover:text-white hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98]"
      >
        Cash Out &middot; End Session
      </button>
    </div>
  );
}
