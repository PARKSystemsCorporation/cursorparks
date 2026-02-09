"use client";

import { useState } from "react";

type TutorialStep = {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector hint
};

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to ParkSystems",
    content: "This is a real-time market simulator. Trade, compete, and climb the ranks. Let's get started.",
  },
  {
    id: "chart",
    title: "The Chart",
    content: "Watch the candlestick chart for price movements. Green candles = price going up. Red = down. The cyan line shows the current price.",
  },
  {
    id: "trading",
    title: "Placing Trades",
    content: "Select your quantity, then hit BUY to go long or SELL to go short. Use keyboard shortcuts: B to buy, S to sell, 1-5 for quantity.",
  },
  {
    id: "pnl",
    title: "Profit & Loss",
    content: "Your session PnL updates in real-time. Green = profit, red = loss. Watch the equity curve in Analytics to track performance.",
  },
  {
    id: "orderbook",
    title: "Order Book (DOM)",
    content: "The depth of market shows pending orders. Green bars = buy pressure. Red = sell pressure. Look for large orders as support/resistance.",
  },
  {
    id: "position",
    title: "Managing Positions",
    content: "When you have an open position, you'll see unrealized PnL. Use RUG to flatten instantly, or trade in the opposite direction.",
  },
  {
    id: "upgrades",
    title: "Upgrades & Progression",
    content: "Create an account to unlock the skill tree. Upgrade LOTS for bigger positions, BALANCE for more starting cash, and INFO for market intel.",
  },
  {
    id: "alerts",
    title: "Price Alerts",
    content: "Set alerts to get notified when price crosses key levels. Great for planning entries and exits.",
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    content: "Press ? anytime to see all keyboard shortcuts. B=Buy, S=Sell, R=Rug, 1-5=Quantity. Speed is everything.",
  },
  {
    id: "cashout",
    title: "Cashing Out",
    content: "When you're ready to lock in profits, hit Cash Out. Your PnL gets recorded on the leaderboard. Good luck, trader!",
  },
];

type Props = {
  show: boolean;
  onComplete: () => void;
  onDismiss: () => void;
};

export function TutorialOverlay({ show, onComplete, onDismiss }: Props) {
  const [step, setStep] = useState(0);

  if (!show) return null;

  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const progress = ((step + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <div className="animate-modal-backdrop fixed inset-0 z-[95] flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center" onClick={onDismiss}>
      <div className="animate-modal-content glass mx-4 mb-4 w-full max-w-sm rounded-lg p-5 md:mb-0" onClick={(e) => e.stopPropagation()}>
        {/* Progress */}
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-neon-cyan/40 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mb-1 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-[0.2em] text-neon-cyan">{current.title}</span>
          <span className="text-[9px] text-white/20">{step + 1}/{TUTORIAL_STEPS.length}</span>
        </div>

        <p className="mb-4 text-[12px] leading-relaxed text-white/60">{current.content}</p>

        <div className="flex items-center justify-between">
          <button
            onClick={onDismiss}
            className="text-[10px] text-white/25 hover:text-white/50"
          >
            Skip Tutorial
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded border border-white/10 px-3 py-1.5 text-[10px] text-white/50 hover:bg-white/5"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) onComplete();
                else setStep(step + 1);
              }}
              className="rounded bg-neon-cyan px-4 py-1.5 text-[10px] font-semibold text-black transition-all duration-200 hover:bg-neon-cyan/90"
            >
              {isLast ? "Start Trading" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
