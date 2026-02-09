"use client";

import type { TradeRow } from "../db/db";

type Props = {
  trades: TradeRow[];
  globalTape: TradeRow[];
  currentPrice: number;
};

export function VolumeProfile({ trades, globalTape, currentPrice }: Props) {
  const allTrades = [...trades, ...globalTape];
  if (allTrades.length < 2) {
    return (
      <div className="glass animate-fadeIn rounded-md p-3 text-xs">
        <div className="mb-2 text-[9px] uppercase tracking-[0.15em] text-white/30">Volume Profile</div>
        <div className="py-2 text-center text-[10px] text-white/20">Not enough trades.</div>
      </div>
    );
  }

  // Build volume at price buckets
  const prices = allTrades.map((t) => t.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  const bucketSize = Math.max(0.01, range / 15);
  const buckets = new Map<number, { buy: number; sell: number }>();

  for (const t of allTrades) {
    const bucket = Math.floor((t.price - minPrice) / bucketSize) * bucketSize + minPrice;
    const existing = buckets.get(bucket) || { buy: 0, sell: 0 };
    if (t.side === "buy") existing.buy += t.size;
    else existing.sell += t.size;
    buckets.set(bucket, existing);
  }

  const entries = Array.from(buckets.entries())
    .map(([price, vol]) => ({ price, ...vol, total: vol.buy + vol.sell }))
    .sort((a, b) => b.price - a.price);

  const maxVol = Math.max(...entries.map((e) => e.total), 1);

  // Point of control (highest volume level)
  const poc = entries.reduce((a, b) => (a.total > b.total ? a : b), entries[0]);

  return (
    <div className="glass animate-fadeIn rounded-md p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/30">Volume Profile</span>
        <span className="font-mono text-[9px] text-white/15">{allTrades.length} trades</span>
      </div>

      <div className="space-y-px">
        {entries.map((e) => {
          const isPoc = e === poc;
          const isNearPrice = Math.abs(e.price - currentPrice) < bucketSize;
          const buyPct = e.total > 0 ? (e.buy / e.total) * 100 : 50;
          const totalPct = (e.total / maxVol) * 100;

          return (
            <div
              key={e.price}
              className={`relative flex items-center gap-1.5 rounded px-1.5 py-[2px] transition-all duration-200 ${
                isNearPrice ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
              }`}
            >
              {/* Price */}
              <span className={`w-12 shrink-0 text-right font-mono text-[9px] ${
                isNearPrice ? "text-neon-cyan" : isPoc ? "text-neon-yellow" : "text-white/30"
              }`}>
                {e.price.toFixed(2)}
              </span>

              {/* Volume bar */}
              <div className="relative h-3 flex-1 overflow-hidden rounded-sm bg-white/[0.02]">
                <div
                  className="absolute inset-y-0 left-0 rounded-sm bg-neon-green/20 transition-all duration-300"
                  style={{ width: `${(buyPct / 100) * totalPct}%` }}
                />
                <div
                  className="absolute inset-y-0 rounded-sm bg-neon-red/20 transition-all duration-300"
                  style={{ left: `${(buyPct / 100) * totalPct}%`, width: `${((100 - buyPct) / 100) * totalPct}%` }}
                />
                {isPoc && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                    <span className="text-[7px] font-semibold text-neon-yellow">POC</span>
                  </div>
                )}
              </div>

              {/* Volume */}
              <span className="w-8 shrink-0 text-right font-mono text-[8px] text-white/20">{e.total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
