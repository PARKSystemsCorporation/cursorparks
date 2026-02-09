"use client";

import { useEffect, useRef, useState } from "react";
import type { TradeRow } from "../db/db";

export type SocialEvent = {
  id: string;
  type: "big_trade" | "rank_up" | "achievement" | "cashout" | "streak";
  user: string;
  message: string;
  timestamp: number;
};

type Props = {
  events: SocialEvent[];
  globalTape: TradeRow[];
  currentUser?: string | null;
};

export function generateSocialEvents(
  globalTape: TradeRow[],
  currentUser: string | null
): SocialEvent[] {
  const events: SocialEvent[] = [];
  const names = ["TraderX", "WallSt_Alpha", "ShortyMcShort", "BullRunner", "DipBuyer", "MomoKing"];

  // Generate from recent global tape
  for (const t of globalTape.slice(0, 5)) {
    if (t.size >= 100) {
      const name = names[Math.floor(Math.random() * names.length)];
      events.push({
        id: `social-${t.t}-${Math.random()}`,
        type: "big_trade",
        user: name,
        message: `${t.side === "buy" ? "Bought" : "Sold"} ${t.size} @ $${t.price.toFixed(2)}`,
        timestamp: t.t,
      });
    }
  }

  return events.slice(0, 8);
}

export function SocialFeed({ events, globalTape, currentUser }: Props) {
  const [socialEvents, setSocialEvents] = useState<SocialEvent[]>(events);
  const prevTapeRef = useRef(globalTape);

  useEffect(() => {
    if (globalTape.length > prevTapeRef.current.length) {
      const newEvents = generateSocialEvents(globalTape, currentUser ?? null);
      if (newEvents.length > 0) {
        setSocialEvents((prev) => [...newEvents, ...prev].slice(0, 15));
      }
    }
    prevTapeRef.current = globalTape;
  }, [globalTape, currentUser]);

  const allEvents = [...events, ...socialEvents]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  const typeStyles: Record<string, { icon: string; color: string }> = {
    big_trade: { icon: "$", color: "text-neon-cyan" },
    rank_up: { icon: "^", color: "text-neon-yellow" },
    achievement: { icon: "*", color: "text-neon-green" },
    cashout: { icon: "$", color: "text-neon-green" },
    streak: { icon: "!", color: "text-neon-yellow" },
  };

  return (
    <div className="animate-fadeIn space-y-2">
      <div className="text-[9px] uppercase tracking-[0.2em] text-white/30">Activity Feed</div>
      {allEvents.length === 0 ? (
        <div className="py-3 text-center text-[10px] text-white/20">No activity yet.</div>
      ) : (
        <div className="space-y-1">
          {allEvents.map((ev, i) => {
            const style = typeStyles[ev.type] || typeStyles.big_trade;
            const isNew = i === 0;
            return (
              <div
                key={ev.id}
                className={`flex items-start gap-2 rounded px-2.5 py-1.5 text-[10px] transition-all duration-200 hover:bg-white/[0.03] ${
                  isNew ? "animate-slideInRight bg-white/[0.02]" : ""
                }`}
              >
                <span className={`mt-0.5 shrink-0 ${style.color}`}>{style.icon}</span>
                <div className="min-w-0 flex-1">
                  <span className={`font-semibold ${ev.user === currentUser ? "text-neon-cyan" : "text-white/50"}`}>
                    {ev.user}
                  </span>
                  <span className="ml-1 text-white/30">{ev.message}</span>
                </div>
                <span className="shrink-0 text-[8px] text-white/15">
                  {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
