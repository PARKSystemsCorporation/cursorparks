"use client";

type Props = {
  symbol: string;
  symbols: string[];
  pnl: number;
  cash: number;
  equity: number;
  bid: number;
  ask: number;
  qty: number;
  onQty: (q: number) => void;
  onBuy: () => void;
  onSell: () => void;
  onCashout: () => void;
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
  onQty,
  onBuy,
  onSell,
  onCashout,
  onSymbol
}: Props) {
  return (
    <div className="glass flex h-full flex-col gap-3 rounded-xl p-4">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
          Session PnL
        </div>
        <div className={`text-3xl font-bold ${pnl >= 0 ? "text-neon-green" : "text-neon-red"}`}>
          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <div className="text-[10px] text-white/50">Cash</div>
          <div className="text-sm font-semibold">${cash.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <div className="text-[10px] text-white/50">Equity</div>
          <div className="text-sm font-semibold">${equity.toFixed(2)}</div>
        </div>
      </div>
      <button
        onClick={onCashout}
        className="rounded-lg bg-white/10 py-2 text-xs uppercase tracking-[0.2em] text-white/80 hover:bg-white/20"
      >
        Cash Out
      </button>
      <div className="rounded-lg border border-white/10 bg-white/5 p-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">Ticker</div>
        <select
          className="mt-1 w-full rounded-md bg-transparent text-sm outline-none"
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
      <div className="grid grid-cols-5 gap-2">
        {qtyOptions.map((q) => (
          <button
            key={q}
            onClick={() => onQty(q)}
            className={`rounded-md py-2 text-xs font-semibold ${
              qty === q ? "bg-neon-cyan text-black" : "bg-white/10 text-white/70"
            }`}
          >
            {q >= 1000 ? `${q / 1000}K` : q}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBuy}
          className="rounded-lg bg-neon-green py-3 text-sm font-bold text-black"
        >
          BUY {ask.toFixed(2)}
        </button>
        <button
          onClick={onSell}
          className="rounded-lg bg-neon-red py-3 text-sm font-bold text-black"
        >
          SELL {bid.toFixed(2)}
        </button>
      </div>
      <a href="#leaderboard" className="text-center text-[11px] text-white/60 hover:text-white">
        View leaderboard
      </a>
    </div>
  );
}
