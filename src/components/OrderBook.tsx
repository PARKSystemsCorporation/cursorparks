"use client";

import { useEffect, useRef } from "react";
import type { OrderBook } from "../engine/types";

type Props = { book: OrderBook };

export function OrderBook({ book }: Props) {
  let maxSize = 1;
  for (const b of book.bids) if (b.size > maxSize) maxSize = b.size;
  for (const a of book.asks) if (a.size > maxSize) maxSize = a.size;
  const prevBookRef = useRef(book);

  useEffect(() => {
    prevBookRef.current = book;
  }, [book]);

  return (
    <div className="glass flex h-full flex-col rounded-md p-3 text-xs">
      <div className="mb-2 flex justify-between text-[9px] uppercase tracking-[0.15em] text-white/70">
        <span>Size</span>
        <span>Price</span>
      </div>
      <div className="flex-1 space-y-px overflow-y-auto scrollbar-hidden font-mono text-[11px]">
        {book.asks
          .slice()
          .reverse()
          .map((a, idx) => (
            <div 
              key={`ask-${idx}`} 
              className="relative flex justify-between px-1.5 py-[3px] text-neon-red transition-colors duration-150 hover:bg-white/[0.02]"
            >
              <div
                className="depth-bar-animate right-0 bg-neon-red/20"
                style={{ width: `${(a.size / maxSize) * 100}%` }}
              />
              <span className="relative z-10 transition-all duration-150">{a.size}</span>
              <span className="relative z-10 transition-all duration-150">{a.price.toFixed(2)}</span>
            </div>
          ))}
        <div className="my-1.5 border-y border-white/5 py-1.5 text-center text-[10px]">
          <span className="text-white/70">SPREAD</span>{" "}
          <span className="font-semibold text-white/90 transition-colors duration-200">{book.spread.toFixed(3)}</span>
        </div>
        {book.bids.map((b, idx) => (
          <div 
            key={`bid-${idx}`} 
            className="relative flex justify-between px-1.5 py-[3px] text-neon-green transition-colors duration-150 hover:bg-white/[0.02]"
          >
            <div
              className="depth-bar-animate left-0 bg-neon-green/20"
              style={{ width: `${(b.size / maxSize) * 100}%` }}
            />
            <span className="relative z-10 transition-all duration-150">{b.size}</span>
            <span className="relative z-10 transition-all duration-150">{b.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
