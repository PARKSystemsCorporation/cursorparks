"use client";

import { useEffect, useRef, useState } from "react";
import type { TradeRow } from "../db/db";

type Props = {
  trades: TradeRow[];
  onClose: () => void;
};

export function TradeReplay({ trades, onClose }: Props) {
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sortedTrades = [...trades].sort((a, b) => a.t - b.t);
  const currentTrades = sortedTrades.slice(0, currentIdx + 1);
  const currentTrade = sortedTrades[currentIdx];

  // Running PnL
  let cumPnl = 0;
  const pnlCurve: number[] = [];
  for (const t of currentTrades) {
    const delta = t.side === "buy" ? -t.price * t.size : t.price * t.size;
    cumPnl += delta;
    pnlCurve.push(cumPnl);
  }

  useEffect(() => {
    if (playing && currentIdx < sortedTrades.length - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIdx((prev) => {
          if (prev >= sortedTrades.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, currentIdx, sortedTrades.length]);

  const progress = sortedTrades.length > 0 ? ((currentIdx + 1) / sortedTrades.length) * 100 : 0;

  // Mini chart
  const pnlMin = Math.min(0, ...pnlCurve);
  const pnlMax = Math.max(0, ...pnlCurve);
  const pnlRange = Math.max(1, pnlMax - pnlMin);

  return (
    <div className="animate-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-modal-content glass mx-4 w-full max-w-md rounded-lg p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Trade Replay</span>
          <button onClick={onClose} className="text-[10px] text-white/30 hover:text-white/60">Close</button>
        </div>

        {sortedTrades.length === 0 ? (
          <div className="py-6 text-center text-[11px] text-white/20">No trades to replay.</div>
        ) : (
          <>
            {/* PnL curve */}
            <div className="mb-3 h-16 w-full overflow-hidden rounded bg-white/[0.02]">
              {pnlCurve.length > 1 && (
                <svg viewBox={`0 0 ${pnlCurve.length} 64`} className="h-full w-full" preserveAspectRatio="none">
                  <line x1="0" y1={64 - ((0 - pnlMin) / pnlRange) * 60 - 2} x2={pnlCurve.length} y2={64 - ((0 - pnlMin) / pnlRange) * 60 - 2} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  <polyline
                    points={pnlCurve.map((v, i) => `${i},${64 - ((v - pnlMin) / pnlRange) * 60 - 2}`).join(" ")}
                    fill="none"
                    stroke={cumPnl >= 0 ? "#00ff9d" : "#ff3355"}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            {/* Current trade */}
            {currentTrade && (
              <div className={`mb-3 flex items-center justify-between rounded border p-2.5 font-mono text-[11px] ${
                currentTrade.side === "buy" ? "border-neon-green/20 bg-neon-green/5 text-neon-green" : "border-neon-red/20 bg-neon-red/5 text-neon-red"
              }`}>
                <span className="font-semibold uppercase">{currentTrade.side} {currentTrade.size}</span>
                <span>${currentTrade.price.toFixed(2)}</span>
                <span className="text-[9px] text-white/30">
                  {new Date(currentTrade.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            )}

            {/* Running stats */}
            <div className="mb-3 grid grid-cols-3 gap-1.5">
              <div className="rounded bg-white/[0.02] p-1.5 text-center">
                <div className="text-[8px] text-white/20">Trade</div>
                <div className="font-mono text-[11px] text-white/60">{currentIdx + 1}/{sortedTrades.length}</div>
              </div>
              <div className="rounded bg-white/[0.02] p-1.5 text-center">
                <div className="text-[8px] text-white/20">PnL</div>
                <div className={`font-mono text-[11px] font-semibold ${cumPnl >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                  {cumPnl >= 0 ? "+" : ""}${cumPnl.toFixed(0)}
                </div>
              </div>
              <div className="rounded bg-white/[0.02] p-1.5 text-center">
                <div className="text-[8px] text-white/20">Speed</div>
                <div className="font-mono text-[11px] text-white/60">{speed}x</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-neon-cyan/40 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setCurrentIdx(0)}
                className="rounded border border-white/10 px-2 py-1.5 text-[10px] text-white/40 hover:bg-white/5"
              >
                Reset
              </button>
              <button
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                className="rounded border border-white/10 px-2 py-1.5 text-[10px] text-white/40 hover:bg-white/5"
              >
                Prev
              </button>
              <button
                onClick={() => setPlaying(!playing)}
                className="rounded bg-neon-cyan px-4 py-1.5 text-[10px] font-semibold text-black transition-all duration-200 hover:bg-neon-cyan/90"
              >
                {playing ? "Pause" : "Play"}
              </button>
              <button
                onClick={() => setCurrentIdx(Math.min(sortedTrades.length - 1, currentIdx + 1))}
                className="rounded border border-white/10 px-2 py-1.5 text-[10px] text-white/40 hover:bg-white/5"
              >
                Next
              </button>
              <button
                onClick={() => setSpeed(speed >= 4 ? 1 : speed * 2)}
                className="rounded border border-white/10 px-2 py-1.5 text-[10px] text-white/40 hover:bg-white/5"
              >
                {speed}x
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
