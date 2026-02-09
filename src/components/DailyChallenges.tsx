"use client";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: string;
};

type Props = {
  challenges: Challenge[];
};

export function makeDailyChallenges(tradeCount: number, pnl: number, buyCount: number, sellCount: number): Challenge[] {
  return [
    {
      id: "ch_trades_5",
      title: "Active Participant",
      description: "Execute 5 trades this session",
      target: 5,
      current: Math.min(tradeCount, 5),
      reward: "+50 XP",
    },
    {
      id: "ch_trades_25",
      title: "Floor Trader",
      description: "Execute 25 trades this session",
      target: 25,
      current: Math.min(tradeCount, 25),
      reward: "+200 XP",
    },
    {
      id: "ch_profit_500",
      title: "Green Day",
      description: "Earn $500+ in a single session",
      target: 500,
      current: Math.max(0, Math.min(pnl, 500)),
      reward: "+100 XP",
    },
    {
      id: "ch_profit_5k",
      title: "Big Winner",
      description: "Earn $5,000+ in a single session",
      target: 5000,
      current: Math.max(0, Math.min(pnl, 5000)),
      reward: "+500 XP",
    },
    {
      id: "ch_both_sides",
      title: "Both Sides",
      description: "Execute at least 3 buys and 3 sells",
      target: 6,
      current: Math.min(buyCount, 3) + Math.min(sellCount, 3),
      reward: "+75 XP",
    },
  ];
}

export function DailyChallenges({ challenges }: Props) {
  return (
    <div className="animate-fadeIn space-y-2">
      <div className="text-[9px] uppercase tracking-[0.2em] text-white/30">Daily Challenges</div>
      {challenges.map((ch) => {
        const progress = ch.target > 0 ? Math.min(1, ch.current / ch.target) : 0;
        const completed = progress >= 1;

        return (
          <div
            key={ch.id}
            className={`rounded-lg border p-2.5 transition-all duration-300 ${
              completed
                ? "border-neon-green/20 bg-neon-green/5"
                : "border-white/5 bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-[11px] font-semibold ${completed ? "text-neon-green" : "text-white/70"}`}>
                  {ch.title}
                  {completed && <span className="ml-1.5 text-[8px] text-neon-green">COMPLETE</span>}
                </div>
                <div className="text-[9px] text-white/30">{ch.description}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] text-neon-cyan">{ch.reward}</div>
                <div className="font-mono text-[9px] text-white/20">
                  {ch.current}/{ch.target}
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${completed ? "bg-neon-green/50" : "bg-neon-cyan/30"}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
