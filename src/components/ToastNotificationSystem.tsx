"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastType = "trade" | "rankup" | "achievement" | "error" | "info" | "alert" | "challenge";

export type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  side?: "buy" | "sell";
  timestamp: number;
};

type Props = {
  toasts: Toast[];
  onDismiss: (id: string) => void;
};

const TOAST_DURATION = 3500;
const TOAST_EXIT_DURATION = 300;

const ICONS: Record<ToastType, string> = {
  trade: "",
  rankup: "",
  achievement: "",
  error: "",
  info: "",
  alert: "",
  challenge: "",
};

const COLORS: Record<ToastType, { border: string; bg: string; accent: string }> = {
  trade: { border: "border-neon-cyan/20", bg: "bg-neon-cyan/5", accent: "text-neon-cyan" },
  rankup: { border: "border-neon-yellow/30", bg: "bg-neon-yellow/5", accent: "text-neon-yellow" },
  achievement: { border: "border-neon-green/20", bg: "bg-neon-green/5", accent: "text-neon-green" },
  error: { border: "border-neon-red/20", bg: "bg-neon-red/5", accent: "text-neon-red" },
  info: { border: "border-white/10", bg: "bg-white/5", accent: "text-white/60" },
  alert: { border: "border-neon-yellow/20", bg: "bg-neon-yellow/5", accent: "text-neon-yellow" },
  challenge: { border: "border-neon-cyan/20", bg: "bg-neon-cyan/5", accent: "text-neon-cyan" },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), TOAST_EXIT_DURATION);
    }, TOAST_DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, onDismiss]);

  const c = COLORS[toast.type];
  const buyColor = toast.side === "buy" ? "text-neon-green" : toast.side === "sell" ? "text-neon-red" : c.accent;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border ${c.border} ${c.bg} px-3.5 py-2.5 shadow-lg backdrop-blur-md transition-all duration-300 ${
        exiting ? "translate-x-[120%] opacity-0" : "animate-slideInRight"
      }`}
    >
      <span className={`mt-0.5 text-sm ${c.accent}`}>{ICONS[toast.type]}</span>
      <div className="min-w-0 flex-1">
        <div className={`text-[10px] font-semibold uppercase tracking-wider ${buyColor}`}>
          {toast.title}
        </div>
        <div className="mt-0.5 text-[11px] text-white/60">{toast.message}</div>
      </div>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), TOAST_EXIT_DURATION); }}
        className="mt-0.5 text-[10px] text-white/20 hover:text-white/50"
      >
        X
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: Props) {
  return (
    <div className="pointer-events-none fixed left-4 top-4 z-[100] hidden w-72 flex-col gap-2 sm:flex">
      {toasts.slice(0, 5).map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

let _toastId = 0;
export function createToast(type: ToastType, title: string, message: string, side?: "buy" | "sell"): Toast {
  return { id: `toast-${++_toastId}-${Date.now()}`, type, title, message, side, timestamp: Date.now() };
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message: string, side?: "buy" | "sell") => {
    const t = createToast(type, title, message, side);
    setToasts((prev) => [t, ...prev].slice(0, 8));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
