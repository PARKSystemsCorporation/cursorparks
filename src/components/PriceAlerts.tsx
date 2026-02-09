"use client";

import { useEffect, useRef, useState } from "react";

export type PriceAlert = {
  id: string;
  price: number;
  direction: "above" | "below";
  triggered: boolean;
};

type Props = {
  currentPrice: number;
  alerts: PriceAlert[];
  onAdd: (price: number, direction: "above" | "below") => void;
  onRemove: (id: string) => void;
  onTrigger: (alert: PriceAlert) => void;
};

export function PriceAlerts({ currentPrice, alerts, onAdd, onRemove, onTrigger }: Props) {
  const [inputPrice, setInputPrice] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const prevPriceRef = useRef(currentPrice);

  // Check alerts on price change
  useEffect(() => {
    for (const alert of alerts) {
      if (alert.triggered) continue;
      if (alert.direction === "above" && currentPrice >= alert.price && prevPriceRef.current < alert.price) {
        onTrigger(alert);
      } else if (alert.direction === "below" && currentPrice <= alert.price && prevPriceRef.current > alert.price) {
        onTrigger(alert);
      }
    }
    prevPriceRef.current = currentPrice;
  }, [currentPrice, alerts, onTrigger]);

  const handleAdd = () => {
    const price = parseFloat(inputPrice);
    if (!price || !Number.isFinite(price)) return;
    onAdd(price, direction);
    setInputPrice("");
  };

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  return (
    <div className="glass animate-fadeIn rounded-md p-3 text-xs">
      <div className="mb-2 text-[9px] uppercase tracking-[0.15em] text-white/30">Price Alerts</div>

      {/* Add alert */}
      <div className="mb-2 flex gap-1.5">
        <input
          type="number"
          step="0.01"
          value={inputPrice}
          onChange={(e) => setInputPrice(e.target.value)}
          placeholder={currentPrice.toFixed(2)}
          className="w-full rounded bg-white/5 px-2 py-1.5 font-mono text-[11px] text-white outline-none placeholder:text-white/15 focus:bg-white/[0.07]"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={() => setDirection(direction === "above" ? "below" : "above")}
          className={`shrink-0 rounded px-2 py-1 text-[9px] font-semibold uppercase ${
            direction === "above"
              ? "bg-neon-green/10 text-neon-green"
              : "bg-neon-red/10 text-neon-red"
          }`}
        >
          {direction === "above" ? "Above" : "Below"}
        </button>
        <button
          onClick={handleAdd}
          className="shrink-0 rounded bg-neon-cyan/10 px-2.5 py-1 text-[10px] font-semibold text-neon-cyan transition-all duration-200 hover:bg-neon-cyan/20"
        >
          +
        </button>
      </div>

      {/* Active alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-1">
          {activeAlerts.map((a) => {
            const dist = ((a.price - currentPrice) / currentPrice) * 100;
            return (
              <div
                key={a.id}
                className="flex items-center justify-between rounded bg-white/[0.03] px-2 py-1 transition-all duration-200 hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${a.direction === "above" ? "bg-neon-green" : "bg-neon-red"}`} />
                  <span className="font-mono text-[10px] text-white/70">${a.price.toFixed(2)}</span>
                  <span className="text-[9px] text-white/25">{dist >= 0 ? "+" : ""}{dist.toFixed(2)}%</span>
                </div>
                <button
                  onClick={() => onRemove(a.id)}
                  className="text-[9px] text-white/20 hover:text-neon-red"
                >
                  X
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Triggered */}
      {triggeredAlerts.length > 0 && (
        <div className="mt-2 space-y-0.5">
          <div className="text-[8px] uppercase text-white/15">Triggered</div>
          {triggeredAlerts.slice(0, 3).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded px-2 py-0.5 text-[9px] text-white/20 line-through">
              <span>${a.price.toFixed(2)}</span>
              <button onClick={() => onRemove(a.id)} className="text-white/10 hover:text-white/30">X</button>
            </div>
          ))}
        </div>
      )}

      {alerts.length === 0 && (
        <div className="py-2 text-center text-[10px] text-white/20">No alerts set.</div>
      )}
    </div>
  );
}
