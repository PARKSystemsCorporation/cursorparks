"use client";

type SoloEntry = { username: string; pnl: number; riskScore: number; streak: number };
type FirmEntry = { firm: string; pnl: number; efficiency: number; consistency: number };

type Props = {
  soloLb: SoloEntry[];
  firmLb: FirmEntry[];
  currentUser?: string | null;
  userPnl?: number;
};

export function RealTimeLeaderboard({ soloLb, firmLb, currentUser, userPnl = 0 }: Props) {
  // Find user position
  const userIdx = soloLb.findIndex((r) => r.username === currentUser);
  const userRank = userIdx >= 0 ? userIdx + 1 : null;

  return (
    <div className="animate-fadeIn space-y-4">
      {/* User position banner */}
      {currentUser && (
        <div className="flex items-center justify-between rounded-lg border border-neon-cyan/15 bg-neon-cyan/5 p-3">
          <div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-white/30">Your Rank</div>
            <div className="mt-0.5 font-mono text-lg font-bold text-neon-cyan">
              {userRank ? `#${userRank}` : "Unranked"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-white/30">Session PnL</div>
            <div className={`font-mono text-sm font-semibold ${userPnl >= 0 ? "text-neon-green" : "text-neon-red"}`}>
              {userPnl >= 0 ? "+" : ""}${userPnl.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Solo Leaderboard */}
      <div>
        <div className="mb-2 text-[9px] uppercase tracking-[0.2em] text-white/30">Top Traders</div>
        <div className="space-y-1">
          {soloLb.length === 0 ? (
            <div className="py-3 text-center text-[10px] text-white/20">No entries yet.</div>
          ) : (
            soloLb.slice(0, 10).map((row, idx) => {
              const isUser = row.username === currentUser;
              const medal = idx === 0 ? "1st" : idx === 1 ? "2nd" : idx === 2 ? "3rd" : `${idx + 1}`;
              return (
                <div
                  key={`${row.username}-${idx}`}
                  className={`flex items-center gap-2 rounded px-2.5 py-1.5 font-mono text-[11px] transition-all duration-200 ${
                    isUser
                      ? "border border-neon-cyan/15 bg-neon-cyan/5"
                      : idx < 3
                        ? "bg-white/[0.03] hover:bg-white/[0.06]"
                        : "hover:bg-white/[0.03]"
                  }`}
                >
                  <span className={`w-6 text-center text-[10px] font-semibold ${
                    idx === 0 ? "text-neon-yellow" : idx === 1 ? "text-white/50" : idx === 2 ? "text-neon-yellow/50" : "text-white/20"
                  }`}>
                    {medal}
                  </span>
                  <span className={`flex-1 ${isUser ? "font-semibold text-neon-cyan" : "text-white/60"}`}>
                    {row.username}
                  </span>
                  <span className={row.pnl >= 0 ? "text-neon-green" : "text-neon-red"}>
                    {row.pnl >= 0 ? "+" : ""}${row.pnl.toFixed(0)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Firm Leaderboard */}
      <div>
        <div className="mb-2 text-[9px] uppercase tracking-[0.2em] text-white/30">Top Firms</div>
        <div className="space-y-1">
          {firmLb.length === 0 ? (
            <div className="py-3 text-center text-[10px] text-white/20">No firms yet.</div>
          ) : (
            firmLb.slice(0, 5).map((row, idx) => (
              <div
                key={`${row.firm}-${idx}`}
                className="flex items-center gap-2 rounded px-2.5 py-1.5 font-mono text-[11px] transition-all duration-200 hover:bg-white/[0.03]"
              >
                <span className={`w-6 text-center text-[10px] font-semibold ${
                  idx === 0 ? "text-neon-yellow" : "text-white/20"
                }`}>
                  {idx + 1}
                </span>
                <span className="flex-1 text-white/60">{row.firm}</span>
                <span className={row.pnl >= 0 ? "text-neon-green" : "text-neon-red"}>
                  {row.pnl >= 0 ? "+" : ""}${row.pnl.toFixed(0)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
