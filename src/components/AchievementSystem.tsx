"use client";

import { useEffect, useRef } from "react";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (ctx: AchievementContext) => boolean;
};

export type AchievementContext = {
  tradeCount: number;
  pnl: number;
  winStreak: number;
  lossStreak: number;
  maxPnl: number;
  totalVolume: number;
  rank: number;
  cashouts: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_trade", title: "First Blood", description: "Execute your first trade", icon: "T", condition: (c) => c.tradeCount >= 1 },
  { id: "ten_trades", title: "Getting Started", description: "Execute 10 trades", icon: "X", condition: (c) => c.tradeCount >= 10 },
  { id: "fifty_trades", title: "Active Trader", description: "Execute 50 trades", icon: "L", condition: (c) => c.tradeCount >= 50 },
  { id: "hundred_trades", title: "Centurion", description: "Execute 100 trades", icon: "C", condition: (c) => c.tradeCount >= 100 },
  { id: "first_profit", title: "In The Green", description: "Make your first profit", icon: "$", condition: (c) => c.pnl > 0 },
  { id: "1k_profit", title: "Grand Slam", description: "Earn $1,000 in a session", icon: "K", condition: (c) => c.pnl >= 1000 },
  { id: "10k_profit", title: "Big Fish", description: "Earn $10,000 in a session", icon: "M", condition: (c) => c.pnl >= 10000 },
  { id: "100k_profit", title: "Whale", description: "Earn $100,000 in a session", icon: "W", condition: (c) => c.pnl >= 100000 },
  { id: "streak_3", title: "Hot Streak", description: "Win 3 trades in a row", icon: "3", condition: (c) => c.winStreak >= 3 },
  { id: "streak_5", title: "On Fire", description: "Win 5 trades in a row", icon: "5", condition: (c) => c.winStreak >= 5 },
  { id: "streak_10", title: "Unstoppable", description: "Win 10 trades in a row", icon: "!", condition: (c) => c.winStreak >= 10 },
  { id: "rank_2", title: "Promoted", description: "Reach Analyst rank", icon: "A", condition: (c) => c.rank >= 2 },
  { id: "rank_4", title: "Corner Office", description: "Reach VP rank", icon: "V", condition: (c) => c.rank >= 4 },
  { id: "rank_6", title: "Top Floor", description: "Reach Managing Director", icon: "D", condition: (c) => c.rank >= 6 },
  { id: "rank_8", title: "Legendary", description: "Reach Legend rank", icon: "L", condition: (c) => c.rank >= 8 },
  { id: "volume_100k", title: "Market Mover", description: "Trade $100K in volume", icon: "V", condition: (c) => c.totalVolume >= 100000 },
];

type Props = {
  context: AchievementContext;
  unlockedIds: Set<string>;
  onUnlock: (achievement: Achievement) => void;
};

export function AchievementTracker({ context, unlockedIds, onUnlock }: Props) {
  const prevUnlockedRef = useRef(unlockedIds);

  useEffect(() => {
    for (const ach of ACHIEVEMENTS) {
      if (!unlockedIds.has(ach.id) && ach.condition(context)) {
        onUnlock(ach);
      }
    }
    prevUnlockedRef.current = unlockedIds;
  }, [context, unlockedIds, onUnlock]);

  return null; // Invisible tracker
}

type GalleryProps = {
  unlockedIds: Set<string>;
};

export function AchievementGallery({ unlockedIds }: GalleryProps) {
  const unlocked = ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id));
  const locked = ACHIEVEMENTS.filter((a) => !unlockedIds.has(a.id));

  return (
    <div className="animate-fadeIn space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.2em] text-white/30">Achievements</span>
        <span className="font-mono text-[9px] text-white/20">{unlocked.length}/{ACHIEVEMENTS.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="progress-bar-animate h-full rounded-full bg-neon-cyan/40 transition-all duration-500"
          style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }}
        />
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
          {unlocked.map((a) => (
            <div key={a.id} className="rounded-lg border border-neon-cyan/15 bg-neon-cyan/5 p-2 transition-all duration-200 hover:bg-neon-cyan/10">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-neon-cyan">{a.icon}</span>
                <div>
                  <div className="text-[10px] font-semibold text-neon-cyan">{a.title}</div>
                  <div className="text-[8px] text-white/30">{a.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
          {locked.map((a) => (
            <div key={a.id} className="rounded border border-white/5 bg-white/[0.02] p-2 opacity-40">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-white/15">?</span>
                <div>
                  <div className="text-[10px] text-white/20">{a.title}</div>
                  <div className="text-[8px] text-white/10">{a.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
