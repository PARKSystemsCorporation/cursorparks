"use client";

import type { OrderBook } from "../engine/types";

type Props = {
  book: OrderBook;
  currentPrice: number;
};

export function MarketDepthViz({ book, currentPrice }: Props) {
  // Build cumulative depth
  let cumBid = 0;
  const bidDepth = book.bids.map((b) => {
    cumBid += b.size;
    return { price: b.price, size: b.size, cumulative: cumBid };
  });

  let cumAsk = 0;
  const askDepth = book.asks.map((a) => {
    cumAsk += a.size;
    return { price: a.price, size: a.size, cumulative: cumAsk };
  });

  const maxCum = Math.max(cumBid, cumAsk, 1);
  const maxSize = Math.max(...book.bids.map((b) => b.size), ...book.asks.map((a) => a.size), 1);

  // Heatmap intensity
  const sizeToHeat = (size: number) => {
    const pct = size / maxSize;
    if (pct > 0.7) return "high";
    if (pct > 0.3) return "mid";
    return "low";
  };

  const heatColors = {
    high: { bid: "bg-neon-green/30", ask: "bg-neon-red/30" },
    mid: { bid: "bg-neon-green/15", ask: "bg-neon-red/15" },
    low: { bid: "bg-neon-green/5", ask: "bg-neon-red/5" },
  };

  return (
    <div className="glass animate-fadeIn rounded-md p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.15em] text-white/30">Market Depth</span>
        <span className="font-mono text-[9px] text-white/15">
          B:{cumBid} / A:{cumAsk}
        </span>
      </div>

      {/* Depth chart visualization */}
      <div className="mb-2 flex h-20 items-end gap-[1px] overflow-hidden rounded bg-white/[0.02]">
        {/* Bids (left side, reversed) */}
        <div className="flex h-full flex-1 items-end justify-end gap-[1px]">
          {bidDepth.slice().reverse().map((b, i) => (
            <div
              key={`bd-${i}`}
              className="flex-1 rounded-t-sm bg-neon-green/20 transition-all duration-200"
              style={{ height: `${(b.cumulative / maxCum) * 100}%` }}
              title={`$${b.price.toFixed(2)}: ${b.cumulative} cumulative`}
            />
          ))}
        </div>
        {/* Center line */}
        <div className="w-[2px] bg-neon-cyan/30" />
        {/* Asks (right side) */}
        <div className="flex h-full flex-1 items-end gap-[1px]">
          {askDepth.map((a, i) => (
            <div
              key={`ad-${i}`}
              className="flex-1 rounded-t-sm bg-neon-red/20 transition-all duration-200"
              style={{ height: `${(a.cumulative / maxCum) * 100}%` }}
              title={`$${a.price.toFixed(2)}: ${a.cumulative} cumulative`}
            />
          ))}
        </div>
      </div>

      {/* Heatmap DOM */}
      <div className="space-y-px font-mono text-[10px]">
        {askDepth.slice().reverse().slice(0, 5).map((a, i) => {
          const heat = sizeToHeat(a.size);
          return (
            <div key={`ah-${i}`} className={`flex items-center justify-between rounded px-1.5 py-[2px] ${heatColors[heat].ask} transition-all duration-200`}>
              <span className="text-white/20">{a.cumulative}</span>
              <span className="text-neon-red">{a.size}</span>
              <span className="text-neon-red">{a.price.toFixed(2)}</span>
            </div>
          );
        })}
        <div className="flex items-center justify-center rounded bg-neon-cyan/10 py-1 text-[9px] text-neon-cyan">
          ${currentPrice.toFixed(2)} SPREAD {book.spread.toFixed(3)}
        </div>
        {bidDepth.slice(0, 5).map((b, i) => {
          const heat = sizeToHeat(b.size);
          return (
            <div key={`bh-${i}`} className={`flex items-center justify-between rounded px-1.5 py-[2px] ${heatColors[heat].bid} transition-all duration-200`}>
              <span className="text-neon-green">{b.price.toFixed(2)}</span>
              <span className="text-neon-green">{b.size}</span>
              <span className="text-white/20">{b.cumulative}</span>
            </div>
          );
        })}
      </div>
      
      {/* Imbalance indicator */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[8px] uppercase text-white/20">Imbalance</span>
        <div className="flex-1 overflow-hidden rounded-full bg-white/5 h-1.5">
          <div
            className="h-full rounded-full bg-neon-green/40 transition-all duration-300"
            style={{ width: `${(cumBid / Math.max(1, cumBid + cumAsk)) * 100}%` }}
          />
        </div>
        <span className="font-mono text-[8px] text-white/20">
          {cumBid > cumAsk ? "BID" : "ASK"}
        </span>
      </div>
    </div>
  );
}
