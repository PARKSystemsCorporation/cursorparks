"use client";

import type { OrderBook } from "../engine/types";

type Props = { book: OrderBook };

export function OrderBook({ book }: Props) {
  return (
    <div className="glass flex h-full flex-col rounded-xl p-3 text-xs">
      <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/50">
        <span>Size</span>
        <span>Price</span>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hidden font-mono text-[11px]">
        {book.asks
          .slice()
          .reverse()
          .map((a, idx) => (
            <div key={`ask-${idx}`} className="flex justify-between text-neon-red">
              <span>{a.size}</span>
              <span>{a.price.toFixed(2)}</span>
            </div>
          ))}
        <div className="my-2 text-center text-[10px] text-white/60">
          Spread {book.spread.toFixed(3)}
        </div>
        {book.bids.map((b, idx) => (
          <div key={`bid-${idx}`} className="flex justify-between text-neon-green">
            <span>{b.size}</span>
            <span>{b.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
