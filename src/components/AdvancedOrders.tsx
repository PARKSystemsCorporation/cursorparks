"use client";

import { useState } from "react";

export type AdvancedOrder = {
  id: string;
  type: "limit" | "stop" | "trailing_stop";
  side: "buy" | "sell";
  price: number;
  size: number;
  trailingPct?: number;
  status: "pending" | "filled" | "cancelled";
  createdAt: number;
};

type Props = {
  orders: AdvancedOrder[];
  currentPrice: number;
  onSubmit: (order: Omit<AdvancedOrder, "id" | "status" | "createdAt">) => void;
  onCancel: (id: string) => void;
  maxQty: number;
};

export function AdvancedOrders({ orders, currentPrice, onSubmit, onCancel, maxQty }: Props) {
  const [orderType, setOrderType] = useState<"limit" | "stop" | "trailing_stop">("limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("10");
  const [trailingPct, setTrailingPct] = useState("1");

  const handleSubmit = () => {
    const p = parseFloat(price);
    const s = parseInt(size);
    if (!p || !s || !Number.isFinite(p) || !Number.isFinite(s)) return;
    if (s > maxQty) return;

    onSubmit({
      type: orderType,
      side,
      price: p,
      size: s,
      trailingPct: orderType === "trailing_stop" ? parseFloat(trailingPct) : undefined,
    });
    setPrice("");
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const filledOrders = orders.filter((o) => o.status === "filled").slice(0, 5);

  return (
    <div className="glass animate-fadeIn rounded-md p-3 text-xs">
      <div className="mb-2 text-[9px] uppercase tracking-[0.15em] text-white/30">Advanced Orders</div>

      {/* Order type selector */}
      <div className="mb-2 flex gap-1">
        {(["limit", "stop", "trailing_stop"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`rounded px-2 py-1 text-[9px] uppercase transition-all duration-200 ${
              orderType === t ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50"
            }`}
          >
            {t === "trailing_stop" ? "Trail" : t}
          </button>
        ))}
      </div>

      {/* Side */}
      <div className="mb-2 grid grid-cols-2 gap-1">
        <button
          onClick={() => setSide("buy")}
          className={`rounded py-1.5 text-[10px] font-semibold transition-all duration-200 ${
            side === "buy" ? "bg-neon-green/20 text-neon-green" : "bg-white/5 text-white/30"
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`rounded py-1.5 text-[10px] font-semibold transition-all duration-200 ${
            side === "sell" ? "bg-neon-red/20 text-neon-red" : "bg-white/5 text-white/30"
          }`}
        >
          SELL
        </button>
      </div>

      {/* Inputs */}
      <div className="mb-2 grid grid-cols-2 gap-1.5">
        <div>
          <div className="mb-0.5 text-[8px] text-white/20">{orderType === "trailing_stop" ? "Start Price" : "Price"}</div>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={currentPrice.toFixed(2)}
            className="w-full rounded bg-white/5 px-2 py-1.5 font-mono text-[11px] text-white outline-none placeholder:text-white/15 focus:bg-white/[0.07]"
          />
        </div>
        <div>
          <div className="mb-0.5 text-[8px] text-white/20">Size</div>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full rounded bg-white/5 px-2 py-1.5 font-mono text-[11px] text-white outline-none placeholder:text-white/15 focus:bg-white/[0.07]"
          />
        </div>
      </div>

      {orderType === "trailing_stop" && (
        <div className="mb-2">
          <div className="mb-0.5 text-[8px] text-white/20">Trail %</div>
          <input
            type="number"
            step="0.1"
            value={trailingPct}
            onChange={(e) => setTrailingPct(e.target.value)}
            className="w-full rounded bg-white/5 px-2 py-1.5 font-mono text-[11px] text-white outline-none placeholder:text-white/15 focus:bg-white/[0.07]"
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="w-full rounded bg-neon-cyan/10 py-2 text-[10px] font-semibold uppercase text-neon-cyan transition-all duration-200 hover:bg-neon-cyan/20"
      >
        Place {orderType.replace("_", " ")} Order
      </button>

      {/* Pending orders */}
      {pendingOrders.length > 0 && (
        <div className="mt-2 space-y-0.5">
          <div className="text-[8px] uppercase text-white/20">Pending ({pendingOrders.length})</div>
          {pendingOrders.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded bg-white/[0.03] px-2 py-1 transition-all duration-200 hover:bg-white/[0.05]">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-semibold uppercase ${o.side === "buy" ? "text-neon-green" : "text-neon-red"}`}>
                  {o.side}
                </span>
                <span className="font-mono text-[9px] text-white/40">{o.size} @ ${o.price.toFixed(2)}</span>
                <span className="text-[8px] uppercase text-white/20">{o.type}</span>
              </div>
              <button
                onClick={() => onCancel(o.id)}
                className="text-[9px] text-white/20 hover:text-neon-red"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filled */}
      {filledOrders.length > 0 && (
        <div className="mt-1 space-y-0.5">
          <div className="text-[8px] uppercase text-white/15">Recent Fills</div>
          {filledOrders.map((o) => (
            <div key={o.id} className="flex items-center gap-1.5 px-2 py-0.5 text-[9px] text-white/15">
              <span className={o.side === "buy" ? "text-neon-green/50" : "text-neon-red/50"}>
                {o.side.toUpperCase()}
              </span>
              <span>{o.size} @ ${o.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
