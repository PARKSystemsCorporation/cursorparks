"use client";

import type { TradeRow } from "../db/db";

type Props = { trades: TradeRow[] };

export function TradeTape({ trades }: Props) {
  return (
    <div className="glass rounded-xl p-3 text-xs">
      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/50">
        Tape
      </div>
      <div className="space-y-1 overflow-y-auto scrollbar-hidden font-mono text-[11px]">
        {trades.length === 0 ? (
          <div className="text-white/40">No trades yet.</div>
        ) : (
          trades.slice(0, 12).map((t) => (
            <div
              key={t.id}
              className={`flex justify-between ${t.side === "buy" ? "text-neon-green" : "text-neon-red"}`}
            >
              <span>{t.side.toUpperCase()} {t.size}</span>
              <span>{t.price.toFixed(2)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
