"use client";

import type { RankInfo } from "../engine/ranks";

type Props = {
  symbol: string;
  symbols: string[];
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
  onSymbol: (s: string) => void;
};

const qtyOptions = [1, 10, 100, 1000, 10000];

export function TradePanel({
  symbol,
  symbols,
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
  canRug,
  onSymbol
}: Props) {
  const unrealizedPnl =
    position.size !== 0 ? position.size * (currentPrice - position.avgPrice) : 0;
  const baseMin = rank.min === -Infinity ? 0 : rank.min;
  const progressToNext =
    rank.nextMin !== null
      ? Math.min(1, Math.max(0, (pnl - baseMin) / (rank.nextMin - baseMin)))
      : 1;

  return (
    <div className="glass flex flex-col gap-2.5 rounded-md p-3">
      {/* ── PnL + Rank ── */}
      <div className="text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.15em] text-white/30">Session</span>
          <span className="rounded border border-neon-cyan/20 bg-neon-cyan/5 px-1.5 py-0.5 text-[9px] font-semibold text-neon-cyan">
            {rank.name}
          </span>
        </div>
        <div
          className={`font-mono text-2xl font-bold ${pnl >= 0 ? "text-neon-green" : "text-neon-red"}`}
        >
          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
        </div>
        {rank.nextMin !== null && (
          <div className="mx-auto mt-1.5 w-full">
            <div className="h-px w-full bg-white/10">
              <div
                className="h-full bg-neon-cyan/30 transition-all duration-300"
                style={{ width: `${progressToNext * 100}%` }}
              />
            </div>
            <div className="mt-0.5 text-[9px] text-white/20">
              ${rank.nextMin.toLocaleString()} to next rank
            </div>
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded border border-white/5 bg-white/[0.02] p-1.5">
          <div className="text-[9px] text-white/30">Cash</div>
          <div className="font-mono text-[12px] font-semibold">${cash.toFixed(0)}</div>
        </div>
        <div className="rounded border border-white/5 bg-white/[0.02] p-1.5">
          <div className="text-[9px] text-white/30">Equity</div>
          <div className="font-mono text-[12px] font-semibold">${equity.toFixed(0)}</div>
        </div>
        <div className="rounded border border-white/5 bg-white/[0.02] p-1.5">
          <div className="text-[9px] text-white/30">Trades</div>
          <div className="font-mono text-[12px] font-semibold">{tradeCount}</div>
        </div>
      </div>

      {/* ── Open Position ── */}
      {position.size !== 0 && (
        <div className="animate-fadeIn rounded border border-white/5 bg-white/[0.02] p-2 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className={position.size > 0 ? "text-neon-green" : "text-neon-red"}>
              {position.size > 0 ? "LONG" : "SHORT"} {Math.abs(position.size)}
            </span>
            <span
              className={`font-semibold ${unrealizedPnl >= 0 ? "text-neon-green" : "text-neon-red"}`}
            >
              {unrealizedPnl >= 0 ? "+" : ""}
              {unrealizedPnl.toFixed(2)}
            </span>
          </div>
          <div className="mt-0.5 text-[9px] text-white/20">
            avg {position.avgPrice.toFixed(2)} &rarr; {currentPrice.toFixed(2)}
          </div>
        </div>
      )}

      {/* ── Ticker ── */}
      <div className="rounded border border-white/5 bg-white/[0.02] p-2">
        <div className="text-[9px] uppercase tracking-[0.15em] text-white/30">Ticker</div>
        <select
          className="mt-0.5 w-full bg-transparent font-mono text-sm text-white outline-none"
          value={symbol}
          onChange={(e) => onSymbol(e.target.value)}
        >
          {symbols.map((s) => (
            <option key={s} value={s} className="bg-bg-base">
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* ── Qty ── */}
      <div className="grid grid-cols-5 gap-1">
        {qtyOptions.map((q) => (
          <button
            key={q}
            onClick={() => onQty(q)}
            disabled={q > maxQty}
            className={`rounded py-1.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-30 ${
              qty === q
                ? "bg-white/15 text-white"
                : "bg-white/[0.03] text-white/35 hover:bg-white/[0.06] hover:text-white/50"
            }`}
          >
            {q >= 1000 ? `${q / 1000}K` : q}
          </button>
        ))}
      </div>
      <div className="text-center text-[9px] text-white/20">
        Max {Math.max(10, Math.floor(maxQty))}
      </div>

      {/* ── Buy / Sell ── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBuy}
          className="rounded bg-neon-green py-2.5 text-sm font-bold text-black hover:shadow-glow-green"
        >
          BUY {ask.toFixed(2)}
        </button>
        <button
          onClick={onSell}
          className="rounded bg-neon-red py-2.5 text-sm font-bold text-black hover:shadow-glow-red"
        >
          SELL {bid.toFixed(2)}
        </button>
      </div>

      {/* ── RUG + Cash Out ── */}
      <button
        onClick={onRug}
        disabled={!canRug}
        className="rounded border border-neon-red/20 bg-neon-red/5 py-1.5 text-[10px] uppercase tracking-[0.15em] text-neon-red hover:bg-neon-red/10 disabled:cursor-not-allowed disabled:opacity-30"
      >
        RUG (Flatten)
      </button>
      <button
        onClick={onCashout}
        className="rounded border border-white/10 py-2 text-[10px] uppercase tracking-[0.15em] text-white/40 hover:border-white/20 hover:text-white/60"
      >
        Cash Out &middot; End Session
      </button>
    </div>
  );
}
