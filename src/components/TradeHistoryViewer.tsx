"use client";

import { useState } from "react";
import type { TradeRow } from "../db/db";

type Props = {
  trades: TradeRow[];
  onClose: () => void;
};

type SortKey = "time" | "size" | "price" | "side";
type SortDir = "asc" | "desc";

export function TradeHistoryViewer({ trades, onClose }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all");

  const filtered = trades.filter((t) => filter === "all" || t.side === filter);

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "time": return (a.t - b.t) * dir;
      case "size": return (a.size - b.size) * dir;
      case "price": return (a.price - b.price) * dir;
      case "side": return a.side.localeCompare(b.side) * dir;
      default: return 0;
    }
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const totalVolume = filtered.reduce((s, t) => s + t.size * t.price, 0);
  const buyVol = filtered.filter((t) => t.side === "buy").reduce((s, t) => s + t.size * t.price, 0);

  return (
    <div className="animate-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-modal-content glass mx-4 w-full max-w-lg rounded-lg p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Trade History</span>
          <button onClick={onClose} className="text-[10px] text-white/30 hover:text-white/60">Close</button>
        </div>

        {/* Filters */}
        <div className="mb-3 flex items-center gap-2">
          {(["all", "buy", "sell"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-2.5 py-1 text-[10px] uppercase transition-all duration-200 ${
                filter === f
                  ? f === "buy" ? "bg-neon-green/15 text-neon-green" : f === "sell" ? "bg-neon-red/15 text-neon-red" : "bg-white/10 text-white"
                  : "text-white/30 hover:text-white/50"
              }`}
            >
              {f} ({f === "all" ? trades.length : trades.filter((t) => t.side === f).length})
            </button>
          ))}
          <div className="ml-auto font-mono text-[9px] text-white/20">
            Vol: ${(totalVolume / 1000).toFixed(1)}K (B:{((buyVol / Math.max(1, totalVolume)) * 100).toFixed(0)}%)
          </div>
        </div>

        {/* Header */}
        <div className="mb-1 grid grid-cols-4 gap-2 px-2 text-[9px] uppercase text-white/25">
          {([["time", "Time"], ["side", "Side"], ["size", "Size"], ["price", "Price"]] as [SortKey, string][]).map(([key, label]) => (
            <button key={key} onClick={() => handleSort(key)} className="text-left hover:text-white/50">
              {label} {sortKey === key ? (sortDir === "asc" ? "^" : "v") : ""}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="max-h-60 space-y-0.5 overflow-y-auto scrollbar-hidden">
          {sorted.length === 0 ? (
            <div className="py-4 text-center text-[10px] text-white/20">No trades.</div>
          ) : (
            sorted.map((t, i) => (
              <div
                key={t.id ?? `th-${i}`}
                className={`grid grid-cols-4 gap-2 rounded px-2 py-1 font-mono text-[10px] transition-all duration-150 hover:bg-white/[0.04] ${
                  t.side === "buy" ? "text-neon-green" : "text-neon-red"
                }`}
              >
                <span className="text-white/40">
                  {new Date(t.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <span className="font-semibold uppercase">{t.side}</span>
                <span>{t.size}</span>
                <span>${t.price.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
