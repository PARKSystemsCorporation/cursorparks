"use client";

import type { OrderBook } from "../engine/types";

type Props = { book: OrderBook };

export function OrderBook({ book }: Props) {
  const maxSize = Math.max(...book.bids.map((b) => b.size), ...book.asks.map((a) => a.size), 1);

  return (
    <div className="glass flex h-full flex-col rounded-md p-3 text-xs">
      <div className="mb-2 flex justify-between text-[9px] uppercase tracking-[0.15em] text-white/30">
        <span>Size</span>
        <span>Price</span>
      </div>
      <div className="flex-1 space-y-px overflow-y-auto scrollbar-hidden font-mono text-[11px]">
        {book.asks
          .slice()
          .reverse()
          .map((a, idx) => (
            <div key={`ask-${idx}`} className="relative flex justify-between px-1.5 py-[3px] text-neon-red">
              <div
                className="depth-bar right-0 bg-neon-red"
                style={{ width: `${(a.size / maxSize) * 100}%` }}
              />
              <span className="relative">{a.size}</span>
              <span className="relative">{a.price.toFixed(2)}</span>
            </div>
          ))}
        <div className="my-1.5 border-y border-white/5 py-1.5 text-center text-[10px]">
          <span className="text-white/25">SPREAD</span>{" "}
          <span className="font-semibold text-white/50">{book.spread.toFixed(3)}</span>
        </div>
        {book.bids.map((b, idx) => (
          <div key={`bid-${idx}`} className="relative flex justify-between px-1.5 py-[3px] text-neon-green">
            <div
              className="depth-bar left-0 bg-neon-green"
              style={{ width: `${(b.size / maxSize) * 100}%` }}
            />
            <span className="relative">{b.size}</span>
            <span className="relative">{b.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
