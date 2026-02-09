"use client";

import { memo, useEffect, useRef } from "react";
import type { NewsRow } from "../db/db";

type Props = { news: NewsRow[] };

export const NewsFeed = memo(function NewsFeed({ news }: Props) {
  const prevNewsRef = useRef(news);

  useEffect(() => {
    prevNewsRef.current = news;
  }, [news]);

  const isNewNews = news.length > 0 && (
    prevNewsRef.current.length === 0 || 
    news[0]?.id !== prevNewsRef.current[0]?.id
  );

  return (
    <div className="glass rounded-md p-3 text-xs">
      <div className="mb-2 text-[9px] uppercase tracking-[0.15em] text-white/70">Wire</div>
      <div className="space-y-1.5 overflow-y-auto scrollbar-hidden text-[11px]">
        {news.length === 0 ? (
          <div className="py-2 text-center text-white/70">Waiting for wire...</div>
        ) : (
          news.slice(0, 8).map((n, i) => {
            const bullish = n.sentiment > 0.15;
            const bearish = n.sentiment < -0.15;
            const highImpact = n.impact > 1.5;
            const isNew = i === 0 && isNewNews;
            return (
              <div
                key={n.id ?? `news-${n.t}-${i}`}
                className={`rounded border p-2 transition-all duration-300 hover:bg-white/[0.04] ${
                  highImpact
                    ? `border-white/10 bg-white/[0.03] ${isNew ? "animate-news-slide" : ""}`
                    : "border-white/5 bg-white/[0.015]"
                } ${isNew && !highImpact ? "animate-news-slide" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-white transition-colors duration-200">{n.headline}</span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase transition-all duration-200 ${
                      bullish
                        ? "bg-neon-green/10 text-neon-green"
                        : bearish
                          ? "bg-neon-red/10 text-neon-red"
                          : "bg-white/10 text-white/70"
                    } ${isNew ? "animate-scaleIn" : ""}`}
                  >
                    {bullish ? "BULL" : bearish ? "BEAR" : "FLAT"}
                  </span>
                </div>
                {highImpact && (
                  <div className={`mt-1 text-[9px] font-semibold uppercase text-neon-yellow transition-all duration-200 ${
                    isNew ? "animate-pulseScale" : ""
                  }`}>
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
});
