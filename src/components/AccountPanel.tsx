"use client";

import { useState } from "react";
import { RANKS, type RankInfo } from "../engine/ranks";

type UpgradeDef = {
  id: string;
  key: string;
  category: string;
  title: string;
  description: string;
  baseCost: number;
  costScale: number;
  maxLevel?: number | null;
  requiresKey?: string | null;
  requiresLevel?: number | null;
};

type Props = {
  authUser: { id: string; username: string } | null;
  stats: {
    cashoutBalance: number;
    totalPnl: number;
    level: number;
    reputation: number;
    xp: number;
  } | null;
  rank: RankInfo;
  pnl: number;
  tradeCount: number;
  cash: number;
  equity: number;
  startCash: number;
  maxOrderSize: number;
  upgradeDefs: UpgradeDef[];
  getLevelByKey: (key: string) => number;
  authError: string | null;
  authBusy: "register" | "login" | null;
  onRegister: (user: string, pass: string) => void;
  onLogin: (user: string, pass: string) => void;
  onLogout: () => void;
  onPurchaseUpgrade: (key: string) => void;
};

/* ── Hidden rank perks — revealed only when achieved ── */
const RANK_PERKS = [
  "Entry clearance. Welcome to the floor.",
  "Research desk access. Information is power.",
  "Proprietary strategies unlocked.",
  "Executive floor. Priority order fills.",
  "Board clearance. Dark pool access.",
  "Global desk command. Cross-market reach.",
  "Founding partner. Shape the market.",
  "Transcended. You are the market.",
];

/* ── Skill tree branches ── */
const BRANCHES = [
  {
    id: "core",
    name: "CORE",
    color: "cyan" as const,
    desc: "Fundamental capacity",
    keys: ["attr_lots", "attr_balance", "attr_info"],
  },
  {
    id: "chart",
    name: "CHART",
    color: "blue" as const,
    desc: "Technical analysis",
    keys: ["chart_indicators", "chart_drawing", "chart_multi_tf"],
  },
  {
    id: "bots",
    name: "BOTS",
    color: "green" as const,
    desc: "Automated systems",
    keys: ["bot_alerts", "bot_risk", "bot_scalper"],
  },
  {
    id: "intel",
    name: "INTEL",
    color: "red" as const,
    desc: "Information edge",
    keys: ["info_news_speed", "info_sentiment", "info_vol_forecast"],
  },
];

const COLOR_MAP = {
  cyan: {
    border: "border-neon-cyan/20",
    bg: "bg-neon-cyan/5",
    text: "text-neon-cyan",
    dot: "bg-neon-cyan",
  },
  blue: {
    border: "border-neon-blue/20",
    bg: "bg-neon-blue/5",
    text: "text-neon-blue",
    dot: "bg-neon-blue",
  },
  green: {
    border: "border-neon-green/20",
    bg: "bg-neon-green/5",
    text: "text-neon-green",
    dot: "bg-neon-green",
  },
  red: {
    border: "border-neon-red/20",
    bg: "bg-neon-red/5",
    text: "text-neon-red",
    dot: "bg-neon-red",
  },
};

export function AccountPanel({
  authUser,
  stats,
  rank,
  pnl,
  tradeCount,
  cash,
  equity,
  startCash,
  maxOrderSize,
  upgradeDefs,
  getLevelByKey,
  authError,
  authBusy,
  onRegister,
  onLogin,
  onLogout,
  onPurchaseUpgrade,
}: Props) {
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const defsMap = new Map(upgradeDefs.map((d) => [d.key, d]));

  function cost(def: UpgradeDef, level: number) {
    return Math.round(def.baseCost * Math.pow(def.costScale, level));
  }

  function meetsPrereqs(def: UpgradeDef): boolean {
    if (def.requiresKey && def.requiresLevel) {
      if (getLevelByKey(def.requiresKey) < def.requiresLevel) return false;
    }
    if (def.key === "bot_scalper" && getLevelByKey("attr_info") < 8) return false;
    return true;
  }

  function nodeState(key: string): "locked" | "available" | "owned" | "maxed" {
    const lvl = getLevelByKey(key);
    const def = defsMap.get(key);
    if (!def) return "locked";
    if (def.maxLevel && lvl >= def.maxLevel) return "maxed";
    if (lvl > 0) return "owned";
    return meetsPrereqs(def) ? "available" : "locked";
  }

  /* ── Not logged in — auth screen ── */
  if (!authUser) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-[0.4em] text-white/20">
            Access Terminal
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-white">PARKSYSTEMS</div>
          <div className="mt-1.5 text-[10px] text-white/25">
            Create an account to unlock the skill tree, upgrades, firms, and leaderboards.
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border border-white/5 bg-white/[0.02] p-3">
            <div className="text-[9px] uppercase tracking-[0.15em] text-white/25">
              New Trader
            </div>
            <input
              className="mt-2 w-full rounded bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/15 focus:bg-white/[0.07]"
              placeholder="Username"
              value={regUser}
              onChange={(e) => setRegUser(e.target.value)}
            />
            <input
              className="mt-1.5 w-full rounded bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/15 focus:bg-white/[0.07]"
              type="password"
              placeholder="Password"
              value={regPass}
              onChange={(e) => setRegPass(e.target.value)}
            />
            <button
              className="mt-2.5 w-full rounded bg-neon-cyan py-2 text-[11px] font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => onRegister(regUser, regPass)}
              disabled={authBusy === "register"}
            >
              {authBusy === "register" ? "Creating..." : "Register"}
            </button>
          </div>
          <div className="rounded border border-white/5 bg-white/[0.02] p-3">
            <div className="text-[9px] uppercase tracking-[0.15em] text-white/25">
              Returning Trader
            </div>
            <input
              className="mt-2 w-full rounded bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/15 focus:bg-white/[0.07]"
              placeholder="Username"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
            />
            <input
              className="mt-1.5 w-full rounded bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/15 focus:bg-white/[0.07]"
              type="password"
              placeholder="Password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
            />
            <button
              className="mt-2.5 w-full rounded bg-white/10 py-2 text-[11px] font-medium text-white/60 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => onLogin(loginUser, loginPass)}
              disabled={authBusy === "login"}
            >
              {authBusy === "login" ? "Authenticating..." : "Login"}
            </button>
          </div>
        </div>
        {authError && (
          <div className="rounded bg-neon-red/10 px-3 py-2 text-[11px] text-neon-red">
            {authError}
          </div>
        )}
      </div>
    );
  }

  /* ── Logged in — full RPG view ── */
  const serverLevel = stats?.level ?? 1;
  const totalPnl = stats?.totalPnl ?? 0;
  const cashoutBal = stats?.cashoutBalance ?? 0;
  const reputation = stats?.reputation ?? 0;
  const xp = stats?.xp ?? 0;
  const baseMin = rank.min === -Infinity ? 0 : rank.min;
  const progressToNext =
    rank.nextMin !== null
      ? Math.min(1, Math.max(0, (Math.max(0, pnl) - baseMin) / (rank.nextMin - baseMin)))
      : 1;

  return (
    <div className="space-y-5">
      {/* ── Player Card ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-white">
              {authUser.username}
            </span>
            <span className="rounded border border-neon-cyan/20 bg-neon-cyan/5 px-2 py-0.5 text-[9px] font-semibold text-neon-cyan">
              LVL {rank.level} &middot; {rank.name}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 font-mono text-[10px]">
            <span>
              <span className="text-white/20">LVL </span>
              <span className="text-white/50">{serverLevel}</span>
            </span>
            <span>
              <span className="text-white/20">REP </span>
              <span className="text-white/50">{reputation}</span>
            </span>
            <span>
              <span className="text-white/20">XP </span>
              <span className="text-white/50">{xp}</span>
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 font-mono text-[10px]">
            <span>
              <span className="text-white/20">BALANCE </span>
              <span className="text-neon-green">${cashoutBal.toFixed(2)}</span>
            </span>
            <span>
              <span className="text-white/20">ALL-TIME </span>
              <span className={totalPnl >= 0 ? "text-neon-green" : "text-neon-red"}>
                {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
              </span>
            </span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="rounded border border-white/10 px-2.5 py-1 text-[10px] text-white/25 hover:text-white/40"
        >
          Logout
        </button>
      </div>

      {/* ── Session Stats ── */}
      <div>
        <div className="mb-1.5 text-[9px] uppercase tracking-[0.2em] text-white/20">
          Current Session
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            {
              label: "PnL",
              value: `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)}`,
              c: pnl >= 0 ? "text-neon-green" : "text-neon-red",
            },
            { label: "Trades", value: `${tradeCount}`, c: "text-white/60" },
            { label: "Cash", value: `$${cash.toFixed(0)}`, c: "text-white/60" },
            { label: "Max Lot", value: `${Math.floor(maxOrderSize)}`, c: "text-white/60" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded border border-white/5 bg-white/[0.02] p-2 text-center"
            >
              <div className="text-[8px] uppercase text-white/15">{s.label}</div>
              <div className={`font-mono text-[12px] font-semibold ${s.c}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rank Progression ── */}
      <div>
        <div className="mb-1.5 text-[9px] uppercase tracking-[0.2em] text-white/20">
          Rank Progression
        </div>
        <div className="space-y-0.5">
          {RANKS.map((r, i) => {
            const achieved = rank.level > i + 1;
            const current = rank.level === i + 1;
            const locked = rank.level < i + 1;
            const perkRevealed = achieved || current;
            const minLabel = r.min === -Infinity ? "$0" : `$${r.min.toLocaleString()}`;

            return (
              <div
                key={r.name}
                className={`flex items-center gap-3 rounded px-3 py-1.5 ${
                  current
                    ? "border border-neon-cyan/15 bg-neon-cyan/[0.04]"
                    : "bg-transparent"
                }`}
              >
                {/* Node marker */}
                <span
                  className={`w-3 text-center font-mono text-[10px] ${
                    current
                      ? "text-neon-cyan"
                      : achieved
                        ? "text-neon-green/60"
                        : "text-white/10"
                  }`}
                >
                  {achieved ? "■" : current ? "◆" : "○"}
                </span>
                {/* Rank name */}
                <span
                  className={`w-14 text-[10px] font-mono ${
                    current
                      ? "font-semibold text-neon-cyan"
                      : achieved
                        ? "text-white/40"
                        : "text-white/15"
                  }`}
                >
                  {r.name.length > 8 ? r.name.slice(0, 8) + "." : r.name}
                </span>
                {/* Requirement */}
                <span className="w-10 font-mono text-[9px] text-white/12">
                  {minLabel}
                </span>
                {/* Perk or mystery */}
                <span
                  className={`flex-1 text-[9px] ${
                    current
                      ? "text-neon-cyan/50"
                      : achieved
                        ? "text-white/20"
                        : "text-white/8"
                  }`}
                >
                  {perkRevealed ? RANK_PERKS[i] : locked ? "??? Unlock to reveal" : "???"}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress to next */}
        {rank.nextMin !== null && (
          <div className="mt-2 px-3">
            <div className="flex items-center justify-between font-mono text-[9px]">
              <span className="text-white/15">{rank.name}</span>
              <span className="text-white/15">
                ${rank.nextMin.toLocaleString()} to next
              </span>
            </div>
            <div className="mt-0.5 h-px w-full bg-white/10">
              <div
                className="h-full bg-neon-cyan/30 transition-all duration-500"
                style={{ width: `${progressToNext * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Skill Tree ── */}
      {upgradeDefs.length > 0 && (
        <div>
          <div className="mb-1.5 text-[9px] uppercase tracking-[0.2em] text-white/20">
            Skill Tree
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {BRANCHES.map((branch) => {
              const c = COLOR_MAP[branch.color];
              return (
                <div
                  key={branch.id}
                  className="rounded border border-white/5 bg-white/[0.015] p-3"
                >
                  {/* Branch header */}
                  <div className="mb-2 flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${c.text}`}
                    >
                      {branch.name}
                    </span>
                    <span className="text-[9px] text-white/12">{branch.desc}</span>
                  </div>
                  {/* Nodes */}
                  <div className="space-y-0">
                    {branch.keys.map((key, ni) => {
                      const state = nodeState(key);
                      const def = defsMap.get(key);
                      const lvl = getLevelByKey(key);
                      const upgCost = def ? cost(def, lvl) : 0;
                      const isLocked = state === "locked";
                      const isAvailable = state === "available";
                      const isOwned = state === "owned";
                      const isMaxed = state === "maxed";

                      return (
                        <div key={key}>
                          {/* Connector line */}
                          {ni > 0 && (
                            <div
                              className={`ml-[11px] h-2.5 border-l ${
                                isLocked ? "border-white/5" : "border-white/10"
                              }`}
                            />
                          )}
                          <div
                            className={`rounded px-2.5 py-2 ${
                              isMaxed
                                ? `${c.border} ${c.bg}`
                                : isOwned
                                  ? "border border-white/10 bg-white/[0.025]"
                                  : isAvailable
                                    ? "border border-dashed border-white/15 bg-white/[0.02]"
                                    : "border border-white/[0.04] bg-white/[0.008]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {/* Node dot */}
                                <span
                                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                                    isMaxed
                                      ? c.dot
                                      : isOwned
                                        ? "bg-white/30"
                                        : isAvailable
                                          ? "bg-white/15"
                                          : "bg-white/5"
                                  }`}
                                />
                                {/* Name — always visible (Elder Scrolls style) */}
                                <span
                                  className={`text-[10px] ${
                                    isMaxed
                                      ? `font-semibold ${c.text}`
                                      : isOwned
                                        ? "text-white/60"
                                        : isAvailable
                                          ? "text-white/40"
                                          : "text-white/15"
                                  }`}
                                >
                                  {def?.title ?? key}
                                </span>
                                {isMaxed && (
                                  <span className="text-[8px] font-semibold uppercase text-neon-yellow">
                                    Mastered
                                  </span>
                                )}
                              </div>
                              {/* Level */}
                              {!isLocked && (
                                <span className="font-mono text-[9px] text-white/15">
                                  {lvl}
                                  {def?.maxLevel ? `/${def.maxLevel}` : ""}
                                </span>
                              )}
                            </div>
                            {/* Description or mystery */}
                            <div className="mt-0.5 text-[9px]">
                              {isOwned || isMaxed ? (
                                <span className="text-white/20">
                                  {def?.description ?? ""}
                                </span>
                              ) : isAvailable ? (
                                <span className="text-white/15">
                                  {def?.description ?? "Ready to unlock"}
                                </span>
                              ) : (
                                <span className="text-white/8">
                                  {def?.requiresKey
                                    ? "Requires further advancement"
                                    : "??? Locked"}
                                </span>
                              )}
                            </div>
                            {/* Purchase button */}
                            {!isMaxed && (isOwned || isAvailable) && (
                              <button
                                className={`mt-1.5 rounded px-2 py-1 text-[9px] font-semibold ${
                                  isAvailable
                                    ? `${c.bg} ${c.text} border ${c.border} hover:bg-white/[0.06]`
                                    : "border border-white/5 bg-white/[0.03] text-white/30 hover:bg-white/[0.05]"
                                }`}
                                onClick={() => onPurchaseUpgrade(key)}
                              >
                                ${upgCost} &middot;{" "}
                                {isAvailable ? "Unlock" : `Rank ${lvl + 1}`}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {authError && (
        <div className="rounded bg-neon-red/10 px-3 py-2 text-[11px] text-neon-red">
          {authError}
        </div>
      )}
    </div>
  );
}
