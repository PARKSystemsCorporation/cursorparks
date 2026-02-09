"use client";

import type { TradeRow } from "../db/db";

type Props = { trades: TradeRow[] };

export function TradeTape({ trades }: Props) {
  return (
    <div className="glass rounded-md p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/30">Tape</span>
        {trades.length > 0 && (
          <span className="font-mono text-[9px] text-white/20">{trades.length} fills</span>
        )}
      </div>
      <div className="space-y-0.5 overflow-y-auto scrollbar-hidden font-mono text-[11px]">
        {trades.length === 0 ? (
          <div className="py-2 text-center text-white/25">No fills.</div>
        ) : (
          trades.slice(0, 12).map((t, i) => (
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
