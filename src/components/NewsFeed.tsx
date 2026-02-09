"use client";

import type { NewsRow } from "../db/db";

type Props = { news: NewsRow[] };

export function NewsFeed({ news }: Props) {
  return (
    <div className="glass rounded-xl p-3 text-xs">
      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/50">
        Macro News
      </div>
      <div className="space-y-2 overflow-y-auto scrollbar-hidden text-[11px]">
        {news.length === 0 ? (
          <div className="text-white/40">No news yet.</div>
        ) : (
          news.slice(0, 8).map((n) => (
            <div key={n.id} className="rounded-lg border border-white/5 bg-white/5 p-2">
              <div className="text-white/80">{n.headline}</div>
              <div className="text-[10px] text-white/40">
                Impact {n.impact.toFixed(2)} · Sent {n.sentiment.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
