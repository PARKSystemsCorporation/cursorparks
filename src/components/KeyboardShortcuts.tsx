"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  onBuy: () => void;
  onSell: () => void;
  onRug: () => void;
  onQty: (q: number) => void;
  qtyOptions: number[];
  enabled?: boolean;
};

const SHORTCUTS = [
  { key: "B", label: "Buy" },
  { key: "S", label: "Sell" },
  { key: "R", label: "Rug (Flatten)" },
  { key: "1-5", label: "Select Qty" },
  { key: "?", label: "Toggle Help" },
  { key: "Esc", label: "Close Modal" },
];

export function KeyboardShortcuts({ onBuy, onSell, onRug, onQty, qtyOptions, enabled = true }: Props) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      // Don't trigger if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          onBuy();
          break;
        case "s":
          e.preventDefault();
          onSell();
          break;
        case "r":
          e.preventDefault();
          onRug();
          break;
        case "1": case "2": case "3": case "4": case "5": {
          const idx = parseInt(e.key) - 1;
          if (idx >= 0 && idx < qtyOptions.length) {
            e.preventDefault();
            onQty(qtyOptions[idx]);
          }
          break;
        }
        case "?":
        case "/":
          e.preventDefault();
          setShowHelp((p) => !p);
          break;
        case "escape":
          setShowHelp(false);
          break;
      }
    },
    [enabled, onBuy, onSell, onRug, onQty, qtyOptions]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 z-50 hidden rounded-full border border-white/10 bg-bg-panel px-2.5 py-1.5 text-[10px] text-white/30 backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:text-white/50 md:block"
      >
        ? Shortcuts
      </button>
    );
  }

  return (
    <div className="animate-modal-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
      <div className="animate-modal-content glass mx-4 w-full max-w-xs rounded-lg p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Keyboard Shortcuts</span>
          <button onClick={() => setShowHelp(false)} className="text-[10px] text-white/30 hover:text-white/60">ESC</button>
        </div>
        <div className="space-y-1.5">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between rounded bg-white/[0.03] px-3 py-1.5">
              <span className="text-[11px] text-white/50">{s.label}</span>
              <kbd className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-neon-cyan">{s.key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
