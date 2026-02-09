"use client";

import type { TradeRow } from "../db/db";

type Props = {
  trades: TradeRow[];
  currentPrice: number;
};

export function StreakIndicator({ trades, currentPrice }: Props) {
  if (trades.length < 2) return null;

  // Calculate streak by checking sequential trades
  let streak = 0;
  let streakType: "win" | "loss" | null = null;

  for (let i = 0; i < trades.length - 1; i++) {
    const t = trades[i];
    const refPrice = i === 0 ? currentPrice : trades[i - 1]?.price ?? t.price;
    const diff = t.side === "buy" ? refPrice - t.price : t.price - refPrice;
    const isWin = diff > 0;

    if (i === 0) {
      streakType = isWin ? "win" : "loss";
      streak = 1;
    } else if ((isWin && streakType === "win") || (!isWin && streakType === "loss")) {
      streak++;
    } else {
      break;
    }
  }

  if (streak < 2) return null;

  const isWin = streakType === "win";
  const isFire = streak >= 5;
  const isInsane = streak >= 10;

  return (
    <div
      className={`animate-scaleIn flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[10px] transition-all duration-300 ${
        isWin
          ? "border-neon-green/20 bg-neon-green/5"
          : "border-neon-red/20 bg-neon-red/5"
      } ${isInsane ? "glow-pulse" : ""}`}
    >
      <span className={`text-lg ${isFire ? "animate-pulseScale" : ""}`}>
        {isWin ? (isInsane ? "W" : isFire ? "W" : "W") : "L"}
      </span>
      <div>
        <div className={`font-semibold ${isWin ? "text-neon-green" : "text-neon-red"}`}>
          {streak}x {isWin ? "WIN" : "LOSS"} STREAK
        </div>
        {isFire && (
          <div className="text-[8px] uppercase text-neon-yellow">
            {isInsane ? "UNSTOPPABLE" : "ON FIRE"}
          </div>
        )}
      </div>
    </div>
  );
}
