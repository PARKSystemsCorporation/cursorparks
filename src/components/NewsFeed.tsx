"use client";

import type { NewsRow } from "../db/db";

type Props = { news: NewsRow[] };

export function NewsFeed({ news }: Props) {
  return (
    <div className="glass rounded-md p-3 text-xs">
      <div className="mb-2 text-[9px] uppercase tracking-[0.15em] text-white/30">Wire</div>
      <div className="space-y-1.5 overflow-y-auto scrollbar-hidden text-[11px]">
        {news.length === 0 ? (
          <div className="py-2 text-center text-white/25">Waiting for wire...</div>
        ) : (
          news.slice(0, 8).map((n, i) => {
            const bullish = n.sentiment > 0.15;
            const bearish = n.sentiment < -0.15;
            const highImpact = n.impact > 1.5;
            return (
              <div
                key={n.id ?? `news-${n.t}-${i}`}
                className={`rounded border p-2 ${
                  highImpact
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-white/5 bg-white/[0.015]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-white/65">{n.headline}</span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                      bullish
                        ? "bg-neon-green/10 text-neon-green"
                        : bearish
                          ? "bg-neon-red/10 text-neon-red"
                          : "bg-white/5 text-white/30"
                    }`}
                  >
                    {bullish ? "BULL" : bearish ? "BEAR" : "FLAT"}
                  </span>
                </div>
                {highImpact && (
                  <div className="mt-1 text-[9px] font-semibold uppercase text-neon-yellow">
                    High Impact
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
