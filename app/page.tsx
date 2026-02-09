"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChartCanvas } from "../src/components/ChartCanvas";
import { OrderBook } from "../src/components/OrderBook";
import { TradePanel } from "../src/components/TradePanel";
import { TradeTape } from "../src/components/TradeTape";
import { NewsFeed } from "../src/components/NewsFeed";
import { AccountPanel } from "../src/components/AccountPanel";
import { getSocket } from "../src/engine/socketClient";
import type { Bar, MarketTick, OrderBook as Book } from "../src/engine/types";
import { db, type TradeRow, type NewsRow, type LeaderboardRun } from "../src/db/db";
import { getRank } from "../src/engine/ranks";

const BASE_START_CASH = 100000;

type AuthUser = { id: string; username: string };
type PlayerStats = { cashoutBalance: number; totalPnl: number; level: number; reputation: number; xp: number };
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
type UserUpgrade = { id: string; upgradeId: string; level: number; upgrade: UpgradeDef };
type FirmMember = { firmId: string; role: string; firm: { name: string } };
type ChatMessage = { id: string; user: string; message: string; t: string };

export default function Home() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [tick, setTick] = useState<MarketTick | null>(null);
  const [position, setPosition] = useState({ size: 0, avgPrice: 0 });
  const [cash, setCash] = useState(BASE_START_CASH);
  const [startCash, setStartCash] = useState(BASE_START_CASH);
  const [qty, setQty] = useState(10);
  const symbol = "PSC";
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRun[]>([]);
  const [mobileTab, setMobileTab] = useState<"trade" | "news">("trade");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [upgradeDefs, setUpgradeDefs] = useState<UpgradeDef[]>([]);
  const [userUpgrades, setUserUpgrades] = useState<UserUpgrade[]>([]);
  const [firmMember, setFirmMember] = useState<FirmMember | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [soloLb, setSoloLb] = useState<{ username: string; pnl: number; riskScore: number; streak: number }[]>([]);
  const [firmLb, setFirmLb] = useState<{ firm: string; pnl: number; efficiency: number; consistency: number }[]>([]);
  const [wsOnline, setWsOnline] = useState<number | null>(null);
  const [totalVisitors, setTotalVisitors] = useState<number | null>(null);
  const [timeframeMs, setTimeframeMs] = useState(1000);
  // Auth form states now live inside AccountPanel
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState<"register" | "login" | null>(null);
  const [firmName, setFirmName] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [firmError, setFirmError] = useState<string | null>(null);
  const [firmBusy, setFirmBusy] = useState(false);
  const [globalTape, setGlobalTape] = useState<TradeRow[]>([]);
  const newsDelayRef = useRef(6000);
  const startCashRef = useRef(BASE_START_CASH);
  const [panelTab, setPanelTab] = useState<"account" | "upgrades" | "firms" | "leaderboards">("account");
  const [leftPanelTab, setLeftPanelTab] = useState<"dom" | "live">("dom");
  const [tradeFlash, setTradeFlash] = useState<"buy" | "sell" | null>(null);
  const [showCashoutConfirm, setShowCashoutConfirm] = useState(false);
  const [ready, setReady] = useState(false);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orderBook: Book = tick?.orderBook || {
    bids: [],
    asks: [],
    spread: 0,
    mid: tick?.price || 0
  };

  const displayBars = useMemo(() => {
    if (!bars.length || timeframeMs <= 1000) return bars;
    const out: Bar[] = [];
    let cur: Bar | null = null;
    let curBucket = 0;
    for (const b of bars) {
      const bucket = Math.floor(b.t / timeframeMs) * timeframeMs;
      if (!cur || bucket !== curBucket) {
        if (cur) out.push(cur);
        curBucket = bucket;
        cur = { t: bucket, o: b.o, h: b.h, l: b.l, c: b.c };
      } else {
        cur.h = Math.max(cur.h, b.h);
        cur.l = Math.min(cur.l, b.l);
        cur.c = b.c;
      }
    }
    if (cur) out.push(cur);
    return out;
  }, [bars, timeframeMs]);

  const levelByKey = useMemo(() => {
    return new Map(userUpgrades.map((u) => [u.upgrade.key, u.level]));
  }, [userUpgrades]);

  const getLevelByKey = (key: string) => levelByKey.get(key) || 0;
  const defByKey = useMemo(() => {
    return new Map(upgradeDefs.map((d) => [d.key, d]));
  }, [upgradeDefs]);
  const hasNews = getLevelByKey("info_news_speed") > 0;

  const currentPrice = tick?.price || 0;
  const equity = cash + position.size * currentPrice;
  const pnl = equity - startCash;
  const unrealizedPnl = position.size !== 0 ? position.size * (currentPrice - position.avgPrice) : 0;
  const bid = orderBook.bids[0]?.price ?? currentPrice - 0.05;
  const ask = orderBook.asks[0]?.price ?? currentPrice + 0.05;
  const rank = getRank(Math.max(0, pnl));

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onTick = async (payload: MarketTick) => {
      setTick(payload);
      setBars(payload.bars || []);
      if (payload.news && hasNews) {
        const n = payload.news;
        setTimeout(async () => {
          setNews((prev) => [{ id: n.id, t: n.t, headline: n.headline, sentiment: n.sentiment, impact: n.impact }, ...prev].slice(0, 20));
          await db.news.add({ t: n.t, headline: n.headline, sentiment: n.sentiment, impact: n.impact });
        }, newsDelayRef.current);
      }
      await db.ticks.add({ symbol, t: payload.t, price: payload.price });
      await db.orderbook.add({
        symbol,
        t: payload.t,
        bids: JSON.stringify(payload.orderBook.bids),
        asks: JSON.stringify(payload.orderBook.asks)
      });
    };
    socket.on("market:tick", onTick);
    socket.on("market:snapshot", onTick);
    socket.on("trade:fill", (data) => {
      const signed = data.side === "buy" ? data.size : -data.size;
      setPosition((prev) => {
        const newSize = prev.size + signed;
        let newAvg = prev.avgPrice;
        if (newSize === 0) {
          newAvg = 0;
        } else if (prev.size === 0 || Math.sign(prev.size) === Math.sign(newSize)) {
          const totalCost = prev.avgPrice * prev.size + data.fill * signed;
          newAvg = totalCost / newSize;
        }
        return { size: newSize, avgPrice: newAvg };
      });
      setCash((c) => c - data.fill * signed);
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
      setTradeFlash(null);
      requestAnimationFrame(() => {
        setTradeFlash(data.side);
        flashTimeout.current = setTimeout(() => setTradeFlash(null), 400);
      });
      const trade: TradeRow = {
        symbol,
        t: Date.now(),
        side: data.side,
        size: data.size,
        price: data.fill
      };
      setTrades((prev) => [trade, ...prev].slice(0, 30));
      db.trades.add(trade);
    });
    socket.on("trade:tape", (data) => {
      const trade: TradeRow = {
        symbol,
        t: data.t || Date.now(),
        side: data.side,
        size: data.size,
        price: data.price
      };
      setGlobalTape((prev) => [trade, ...prev].slice(0, 40));
    });
    socket.on("trade:reject", (data) => {
      if (data?.reason === "size_limit") {
        alert(`Trade rejected: max size ${data.maxSize}`);
      }
    });
    return () => {
      socket.off("market:tick", onTick);
      socket.off("market:snapshot", onTick);
      socket.off("trade:fill");
      socket.off("trade:tape");
      socket.off("trade:reject");
    };
  }, [symbol, hasNews]);

  useEffect(() => {
    db.leaderboard_runs.orderBy("t").reverse().limit(10).toArray().then(setLeaderboard);
  }, []);

  useEffect(() => {
    loadAuth();
    loadLeaderboards();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.on("presence:update", (data) => {
      setWsOnline(data.online || 0);
      if (typeof data.total === "number") setTotalVisitors(data.total);
    });
    socket.on("firm:chat", (payload) => {
      if (!firmMember || payload.firmId !== firmMember.firmId) return;
      setChat((prev) => [
        { id: payload.id, user: payload.user, message: payload.message, t: payload.t },
        ...prev
      ].slice(0, 50));
    });
    return () => {
      socket.off("presence:update");
      socket.off("firm:chat");
    };
  }, [firmMember]);

  useEffect(() => {
    if (!firmMember) return;
    const t = setInterval(() => loadChat(), 5000);
    return () => clearInterval(t);
  }, [firmMember]);

  useEffect(() => {
    const level = getUpgradeLevel("info_news_speed");
    newsDelayRef.current = Math.max(500, Math.round(6000 * Math.pow(0.9, level)));
  }, [userUpgrades]);

  const lotsLevel = getLevelByKey("attr_lots");
  const balanceLevel = getLevelByKey("attr_balance");
  const infoLevel = getLevelByKey("attr_info");
  const riskLevel = getLevelByKey("bot_risk");
  const maxOrderSize = 100 + lotsLevel * 50 + riskLevel * 50;
  const computedStartCash = Math.round(BASE_START_CASH * (1 + balanceLevel * 0.1));

  useEffect(() => {
    setStartCash(computedStartCash);
    if (position.size === 0 && cash === startCashRef.current) {
      setCash(computedStartCash);
    }
    startCashRef.current = computedStartCash;
  }, [computedStartCash, position.size, cash]);

  useEffect(() => {
    if (qty > maxOrderSize) setQty(Math.max(1, Math.floor(maxOrderSize)));
  }, [qty, maxOrderSize]);

  async function fetchJson(url: string, opts?: RequestInit) {
    const res = await fetch(url, {
      credentials: "include",
      ...opts
    });
    if (!res.ok) {
      const text = await res.text();
      let message = text;
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (parsed?.error) message = String(parsed.error);
        } catch {
          // non-JSON error payload
        }
      }
      throw new Error(message || `Request failed (${res.status})`);
    }
    return res.json();
  }

  async function loadAuth() {
    try {
      const data = await fetchJson("/api/auth/me");
      setAuthUser(data.user || null);
      setStats(data.stats || null);
      setUserUpgrades(data.upgrades || []);
      if (data.user) {
        await loadProgression();
        await loadFirm();
      }
    } catch (e) {
      setAuthUser(null);
    }
  }

  async function loadProgression() {
    try {
      const data = await fetchJson("/api/progression/status");
      setStats(data.stats);
      setUpgradeDefs(data.defs || []);
      setUserUpgrades(data.upgrades || []);
    } catch (e) {
      // ignore
    }
  }

  async function loadFirm() {
    try {
      const data = await fetchJson("/api/firms/me");
      setFirmMember(data.member || null);
      if (data.member) await loadChat();
    } catch (e) {
      setFirmMember(null);
    }
  }

  async function loadChat() {
    try {
      const data = await fetchJson("/api/firms/chat");
      setChat(data);
    } catch (e) {
      setChat([]);
    }
  }

  async function loadLeaderboards() {
    try {
      const solo = await fetchJson("/api/leaderboards/solo");
      const firms = await fetchJson("/api/leaderboards/firms");
      setSoloLb(solo || []);
      setFirmLb(firms || []);
    } catch (e) {
      // ignore
    }
  }

  const submitTrade = (side: "buy" | "sell", size: number) => {
    if (!size || !Number.isFinite(size)) return;
    const socket = getSocket();
    socket.emit("trade:submit", { side, size, symbol });
  };

  const handleTrade = (side: "buy" | "sell") => {
    submitTrade(side, qty);
  };

  async function register(username: string, password: string) {
    setAuthError(null);
    const name = username.trim();
    if (name.length < 3 || name.length > 12) {
      setAuthError("Username must be 3-12 chars.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 chars.");
      return;
    }
    try {
      setAuthBusy("register");
      await fetchJson("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, password })
      });
      await loadAuth();
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setAuthBusy(null);
    }
  }

  async function login(username: string, password: string) {
    setAuthError(null);
    if (!username.trim() || !password) {
      setAuthError("Enter username and password.");
      return;
    }
    try {
      setAuthBusy("login");
      await fetchJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });
      await loadAuth();
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setAuthBusy(null);
    }
  }

  async function logout() {
    await fetchJson("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
    setStats(null);
    setUserUpgrades([]);
  }

  async function purchaseUpgrade(key: string) {
    await fetchJson("/api/progression/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key })
    });
    await loadProgression();
  }

  async function createFirm(name: string) {
    setFirmError(null);
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      setFirmError("Firm name must be 3-20 chars.");
      return;
    }
    try {
      setFirmBusy(true);
      await fetchJson("/api/firms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed })
      });
      setFirmName("");
      await loadFirm();
    } catch (e) {
      setFirmError(e instanceof Error ? e.message : "Create firm failed.");
    } finally {
      setFirmBusy(false);
    }
  }

  async function inviteFirm(username: string) {
    return fetchJson("/api/firms/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitedName: username })
    });
  }

  async function joinFirm(token: string) {
    await fetchJson("/api/firms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    await loadFirm();
  }

  async function leaveFirm() {
    await fetchJson("/api/firms/leave", { method: "POST" });
    await loadFirm();
  }

  async function sendChat(message: string) {
    await fetchJson("/api/firms/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    await loadChat();
  }

  function upgradeCost(def: UpgradeDef, level: number) {
    return Math.round(def.baseCost * Math.pow(def.costScale, level));
  }

  function getUpgradeLevel(key: string) {
    return getLevelByKey(key);
  }

  function upgradeLabel(key: string) {
    if (key === "attr_lots") return "LOTS";
    if (key === "attr_balance") return "BALANCE";
    if (key === "attr_info") return "INFO";
    return key;
  }

  function getRequirements(def: UpgradeDef) {
    const reqs: { key: string; level: number }[] = [];
    if (def.requiresKey && def.requiresLevel) {
      reqs.push({ key: def.requiresKey, level: def.requiresLevel });
    }
    if (def.key === "bot_scalper") {
      reqs.push({ key: "attr_info", level: 8 });
    }
    return reqs;
  }

  function canPurchase(def: UpgradeDef, level: number) {
    if (def.maxLevel && level >= def.maxLevel) return false;
    const reqs = getRequirements(def);
    return reqs.every((r) => getLevelByKey(r.key) >= r.level);
  }

  function renderUpgradeCard(def?: UpgradeDef) {
    if (!def) return null;
    const level = getLevelByKey(def.key);
    const cost = upgradeCost(def, level);
    const reqs = getRequirements(def);
    const locked = reqs.some((r) => getLevelByKey(r.key) < r.level);
    const maxed = !!def.maxLevel && level >= def.maxLevel;
    const canBuy = !!authUser && !locked && !maxed;
    return (
      <div key={def.key} className={`rounded-xl border border-white/10 p-3 ${locked ? "bg-white/5" : "bg-white/10"}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/90">{def.title}</div>
            <div className="text-[10px] text-white/40">{def.description}</div>
          </div>
          <div className="text-[10px] text-white/60">
            Lv {level}{def.maxLevel ? `/${def.maxLevel}` : ""}
          </div>
        </div>
        {reqs.length > 0 && (
          <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
            Requires {reqs.map((r) => `${upgradeLabel(r.key)} ${r.level}`).join(" + ")}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-white/70">{maxed ? "MAX" : `$${cost}`}</span>
          <button
            className="rounded-md bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canBuy}
            onClick={() => purchaseUpgrade(def.key)}
          >
            {maxed ? "Maxed" : locked ? "Locked" : "Upgrade"}
          </button>
        </div>
      </div>
    );
  }

  const onCashout = async () => {
    db.leaderboard_runs.add({ t: Date.now(), pnl, trades: trades.length });
    db.leaderboard_runs.orderBy("t").reverse().limit(10).toArray().then(setLeaderboard);
    if (authUser) {
      try {
        await fetchJson("/api/leaderboards/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pnl,
            trades: trades.length,
            riskScore: Math.abs(pnl) / Math.max(1, trades.length),
            streak: trades.length
          })
        });
        loadAuth();
        loadLeaderboards();
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : "Cashout failed.");
      }
    }
    setCash(startCash);
    setPosition({ size: 0, avgPrice: 0 });
    setTrades([]);
    setShowCashoutConfirm(false);
  };

  const online = tick?.online || { wallSt: 0, retail: 0 };
  const retailCount = wsOnline ?? online.retail;
  const sentiment = news[0]?.sentiment ?? 0;
  const showIndicators = getUpgradeLevel("chart_indicators") > 0;
  const showBotAlerts = getUpgradeLevel("bot_alerts") > 0;
  const hasMultiTf = getUpgradeLevel("chart_multi_tf") > 0;
  const botSignal = tick ? (tick.velocity >= 0 ? "BUY BIAS" : "SELL BIAS") : "--";

  const timeframes = hasMultiTf
    ? [
        { label: "Fast", value: 1000 },
        { label: "5s", value: 5000 },
        { label: "10s", value: 10000 }
      ]
    : [{ label: "Fast", value: 1000 }];

  useEffect(() => {
    if (!hasMultiTf && timeframeMs !== 1000) setTimeframeMs(1000);
  }, [hasMultiTf, timeframeMs]);

  const coreKeys = ["attr_lots", "attr_balance", "attr_info"];
  const chartKeys = ["chart_indicators", "chart_drawing", "chart_multi_tf"];
  const botKeys = ["bot_alerts", "bot_risk", "bot_scalper"];
  const intelKeys = ["info_news_speed", "info_sentiment", "info_vol_forecast"];

  const totalVisitorCount = totalVisitors ?? 0;
  const canRug = position.size !== 0;
  const onRug = () => {
    if (!canRug) return;
    const side = position.size > 0 ? "sell" : "buy";
    submitTrade(side, Math.abs(position.size));
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-void">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.5em] text-white/30">Connecting to</div>
          <div className="mt-1 text-xl font-bold tracking-wider text-white">PARKSYSTEMS</div>
          <div className="mx-auto mt-4 h-px w-12 bg-neon-cyan/30 load-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-bg-void px-4 py-3 md:px-6 ${tradeFlash === "buy" ? "animate-flash-green" : tradeFlash === "sell" ? "animate-flash-red" : ""}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.35em] text-white/35">PARKSYSTEMS</span>
              <div className="pulse-dot" />
            </div>
            <div className="text-sm font-bold text-white">World Market Simulator</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded border border-neon-cyan/20 bg-neon-cyan/5 px-2.5 py-1 text-[10px] font-semibold text-neon-cyan">
            LVL {rank.level} &middot; {rank.name}
          </div>
          <div className="glass flex items-center gap-2.5 rounded px-3 py-1.5 font-mono text-[10px]">
            <span className="text-white/30">WS</span>
            <span className="text-neon-cyan">{online.wallSt}</span>
            <span className="text-white/15">|</span>
            <span className="text-white/30">RT</span>
            <span className="text-neon-green">{retailCount}</span>
            <span className="text-white/15">|</span>
            <span className="text-white/30">VISITS</span>
            <span className="text-neon-cyan">{totalVisitorCount}</span>
            {getUpgradeLevel("info_vol_forecast") > 0 && (
              <>
                <span className="text-white/15">|</span>
                <span className="text-white/30">VOL</span>
                <span className={`font-semibold ${tick?.volState === "high" ? "text-neon-red" : tick?.volState === "low" ? "text-neon-blue" : "text-white/60"}`}>
                  {(tick?.volState || "mid").toUpperCase()}
                </span>
              </>
            )}
            {getUpgradeLevel("info_sentiment") > 0 && (
              <>
                <span className="text-white/15">|</span>
                <span className={sentiment >= 0 ? "text-neon-green" : "text-neon-red"}>{sentiment.toFixed(2)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {position.size !== 0 && (
        <div className="animate-fadeIn mb-3 flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-4 py-2 font-mono text-[11px]">
          <div className="flex items-center gap-4">
            <span className="text-white/30">POS</span>
            <span className={position.size > 0 ? "text-neon-green" : "text-neon-red"}>
              {position.size > 0 ? "LONG" : "SHORT"} {Math.abs(position.size)}
            </span>
            <span className="text-white/25">@ {position.avgPrice.toFixed(2)}</span>
          </div>
          <div className={`font-semibold ${unrealizedPnl >= 0 ? "text-neon-green" : "text-neon-red"}`}>
            {unrealizedPnl >= 0 ? "+" : ""}{unrealizedPnl.toFixed(2)} unrealized
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[220px_1fr_300px]">
        <div className="hidden md:block">
          <div className="mb-2 flex items-center gap-1 rounded-md border border-white/5 bg-white/[0.02] p-1 text-[10px] uppercase tracking-[0.15em] text-white/40">
            <button
              className={`rounded px-2.5 py-1 ${leftPanelTab === "dom" ? "bg-white/10 text-white" : "text-white/45"}`}
              onClick={() => setLeftPanelTab("dom")}
            >
              DOM
            </button>
            <button
              className={`rounded px-2.5 py-1 ${leftPanelTab === "live" ? "bg-white/10 text-white" : "text-white/45"}`}
              onClick={() => setLeftPanelTab("live")}
            >
              Live
            </button>
          </div>
          {leftPanelTab === "dom" ? (
            <OrderBook book={orderBook} />
          ) : (
            <TradeTape
              trades={globalTape}
              title="Live Traders"
              emptyLabel="No live trades."
              showCount={false}
              showStats={true}
              statsLabel="Live Metrics"
            />
          )}
        </div>

        <div className="glass flex h-[520px] flex-col rounded-md p-3 md:h-[640px]">
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-white/40">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white/70">{symbol}</span>
              <span className="text-neon-cyan">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded bg-white/5 p-0.5">
                {timeframes.map((opt) => (
                  <button
                    key={opt.value}
                    className={`rounded px-2 py-0.5 text-[10px] ${timeframeMs === opt.value ? "bg-white/10 text-white" : "text-white/35"}`}
                    onClick={() => setTimeframeMs(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <span>SPR {tick?.spread.toFixed(3) || "--"}</span>
          </div>
          <div className="flex-1">
            <ChartCanvas bars={displayBars} price={currentPrice} showSMA={showIndicators} avgPrice={position.size !== 0 ? position.avgPrice : undefined} />
          </div>
        </div>

        <div className="hidden md:flex md:flex-col md:gap-3">
          {showBotAlerts && (
            <div className="glass rounded-xl p-3 text-xs">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">Bot Alert</div>
              <div className="mt-1 text-neon-cyan">{botSignal}</div>
            </div>
          )}
          <TradePanel
            symbol={symbol}
            pnl={pnl}
            cash={cash}
            equity={equity}
            bid={bid}
            ask={ask}
            qty={qty}
            maxQty={maxOrderSize}
            position={position}
            currentPrice={currentPrice}
            rank={rank}
            tradeCount={trades.length}
            onQty={setQty}
            onBuy={() => handleTrade("buy")}
            onSell={() => handleTrade("sell")}
            onCashout={() => setShowCashoutConfirm(true)}
            onRug={onRug}
            canRug={canRug}
          />
          <TradeTape trades={globalTape.length ? globalTape : trades} />
          {hasNews ? (
            <NewsFeed news={news} />
          ) : (
            <div className="glass rounded-md p-3 text-xs text-white/30">
              Unlock INFO Rank 1 to access the macro news feed.
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden">
        <div className="fixed bottom-0 left-0 right-0 z-40 rounded-t-xl border-t border-white/5 bg-bg-panel px-4 py-3 shadow-glass">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/35">Trade Desk</span>
              <span className="rounded border border-neon-cyan/20 bg-neon-cyan/5 px-1.5 py-0.5 text-[9px] font-semibold text-neon-cyan">{rank.name}</span>
            </div>
            <div className="flex gap-1">
              <button
                className={`rounded px-2.5 py-1 text-[10px] font-medium ${mobileTab === "trade" ? "bg-white/10 text-white" : "text-white/35"}`}
                onClick={() => setMobileTab("trade")}
              >
                Trade
              </button>
              <button
                className={`rounded px-2.5 py-1 text-[10px] font-medium ${mobileTab === "news" ? "bg-white/10 text-white" : "text-white/35"}`}
                onClick={() => setMobileTab("news")}
              >
                News
              </button>
            </div>
          </div>
          {mobileTab === "trade" ? (
            <div className="space-y-3">
              {showBotAlerts && (
                <div className="rounded bg-white/5 px-3 py-2 text-xs text-neon-cyan">
                  Bot Alert: {botSignal}
                </div>
              )}
              <TradePanel
                symbol={symbol}
                pnl={pnl}
                cash={cash}
                equity={equity}
                bid={bid}
                ask={ask}
                qty={qty}
                maxQty={maxOrderSize}
                position={position}
                currentPrice={currentPrice}
                rank={rank}
                tradeCount={trades.length}
                onQty={setQty}
                onBuy={() => handleTrade("buy")}
                onSell={() => handleTrade("sell")}
                onCashout={() => setShowCashoutConfirm(true)}
                onRug={onRug}
                canRug={canRug}
              />
              <TradeTape trades={globalTape.length ? globalTape : trades} />
            </div>
          ) : (
            hasNews ? (
              <NewsFeed news={news} />
            ) : (
              <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/50">
                Unlock INFO Rank 1 to access the macro news feed.
              </div>
            )
          )}
        </div>
      </div>

      <div className="mt-6 glass rounded-xl p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {(["account","upgrades","firms","leaderboards"] as const).map((tab) => (
            <button
              key={tab}
              className={`rounded-full px-3 py-1 text-xs ${panelTab === tab ? "bg-neon-cyan text-black" : "bg-white/10 text-white/70"}`}
              onClick={() => setPanelTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {panelTab === "account" && (
          <AccountPanel
            authUser={authUser}
            stats={stats}
            rank={rank}
            pnl={pnl}
            tradeCount={trades.length}
            cash={cash}
            equity={equity}
            startCash={startCash}
            maxOrderSize={maxOrderSize}
            upgradeDefs={upgradeDefs}
            getLevelByKey={getLevelByKey}
            authError={authError}
            authBusy={authBusy}
            onRegister={register}
            onLogin={login}
            onLogout={logout}
            onPurchaseUpgrade={purchaseUpgrade}
          />
        )}

        {panelTab === "upgrades" && (
          <div className="space-y-4 text-xs">
            {!authUser && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/50">
                Login to unlock upgrades and progression.
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              {coreKeys.map((key) => {
                const def = defByKey.get(key);
                if (!def) return null;
                const level = getLevelByKey(key);
                const cost = upgradeCost(def, level);
                const maxed = !!def.maxLevel && level >= def.maxLevel;
                const canBuy = authUser && canPurchase(def, level);
                const nextMax = 100 + (lotsLevel + 1) * 50 + riskLevel * 50;
                const nextCash = Math.round(BASE_START_CASH * (1 + (balanceLevel + 1) * 0.1));
                return (
                  <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                        {key === "attr_lots" ? "LOTS" : key === "attr_balance" ? "BALANCE" : "INFO"}
                      </div>
                      <div className="text-[10px] text-white/40">
                        Lv {level}{def.maxLevel ? `/${def.maxLevel}` : ""}
                      </div>
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {key === "attr_lots" && `Max ${Math.floor(maxOrderSize)}`}
                      {key === "attr_balance" && `$${startCash.toFixed(0)}`}
                      {key === "attr_info" && `Rank ${infoLevel}`}
                    </div>
                    <div className="mt-1 text-[10px] text-white/40">
                      {key === "attr_lots" && `Next: ${Math.floor(nextMax)}`}
                      {key === "attr_balance" && `Next: $${nextCash.toFixed(0)}`}
                      {key === "attr_info" && "Unlocks intel + chart + bots"}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-white/70">{maxed ? "MAX" : `$${cost}`}</span>
                      <button
                        className="rounded-md bg-neon-cyan px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-black disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={!canBuy || maxed}
                        onClick={() => purchaseUpgrade(def.key)}
                      >
                        {maxed ? "Maxed" : "Rank Up"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Indicators + Drawing</div>
                <div className="mt-3 space-y-2">
                  {chartKeys.map((key) => renderUpgradeCard(defByKey.get(key)))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Bots</div>
                <div className="mt-3 space-y-2">
                  {botKeys.map((key) => renderUpgradeCard(defByKey.get(key)))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">Intel Modules</div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {intelKeys.map((key) => renderUpgradeCard(defByKey.get(key)))}
                </div>
              </div>
            </div>
          </div>
        )}

        {panelTab === "firms" && (
          <div className="space-y-2 text-xs">
            {!authUser ? (
              <div className="text-white/40 text-xs">Login to manage firms.</div>
            ) : firmMember ? (
              <div className="space-y-2 text-xs">
                <div>Firm: <span className="text-neon-cyan">{firmMember.firm.name}</span> ({firmMember.role})</div>
                <div className="flex gap-2">
                  <input className="w-full rounded-md bg-white/5 p-2" placeholder="Invite username" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
                  <button className="rounded-md bg-white/10 px-2" onClick={() => inviteFirm(inviteName)}>Invite</button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {chat.map((m) => (
                    <div key={m.id} className="rounded bg-white/5 px-2 py-1">
                      <span className="text-neon-green">{m.user}</span>: {m.message}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="w-full rounded-md bg-white/5 p-2" placeholder="Message" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
                  <button className="rounded-md bg-neon-cyan px-2 text-black" onClick={() => { sendChat(chatMessage); setChatMessage(""); }}>Send</button>
                </div>
                <button className="rounded-md bg-white/10 px-3 py-2" onClick={leaveFirm}>Leave firm</button>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <input className="w-full rounded-md bg-white/5 p-2" placeholder="Firm name" value={firmName} onChange={(e) => setFirmName(e.target.value)} />
                  <button
                    className="rounded-md bg-neon-cyan px-2 text-black disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => createFirm(firmName)}
                    disabled={firmBusy}
                  >
                    {firmBusy ? "Creating..." : "Create"}
                  </button>
                </div>
                {firmError && (
                  <div className="rounded-md bg-neon-red/10 px-2 py-1 text-[10px] text-neon-red">
                    {firmError}
                  </div>
                )}
                <div className="flex gap-2">
                  <input className="w-full rounded-md bg-white/5 p-2" placeholder="Invite token" value={joinToken} onChange={(e) => setJoinToken(e.target.value)} />
                  <button className="rounded-md bg-white/10 px-2" onClick={() => joinFirm(joinToken)}>Join</button>
                </div>
              </div>
            )}
          </div>
        )}

        {panelTab === "leaderboards" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/50">Solo Leaderboard</div>
              <div className="space-y-2 text-xs">
                {soloLb.length === 0 ? (
                  <div className="text-white/40">No entries yet.</div>
                ) : (
                  soloLb.map((row, idx) => (
                    <div key={`${row.username}-${idx}`} className="flex justify-between rounded bg-white/5 px-2 py-1">
                      <span>{row.username}</span>
                      <span className={row.pnl >= 0 ? "text-neon-green" : "text-neon-red"}>
                        {row.pnl >= 0 ? "+" : ""}${row.pnl.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/50">Firm Leaderboard</div>
              <div className="space-y-2 text-xs">
                {firmLb.length === 0 ? (
                  <div className="text-white/40">No entries yet.</div>
                ) : (
                  firmLb.map((row, idx) => (
                    <div key={`${row.firm}-${idx}`} className="flex justify-between rounded bg-white/5 px-2 py-1">
                      <span>{row.firm}</span>
                      <span className={row.pnl >= 0 ? "text-neon-green" : "text-neon-red"}>
                        {row.pnl >= 0 ? "+" : ""}${row.pnl.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showCashoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowCashoutConfirm(false)}>
          <div className="glass mx-4 w-full max-w-xs rounded-md p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/35">End Session</div>
            <div className={`mt-2 font-mono text-3xl font-bold ${pnl >= 0 ? "text-neon-green" : "text-neon-red"}`}>
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-white/30">
              {trades.length} trades &middot; {rank.name}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setShowCashoutConfirm(false)} className="rounded border border-white/10 py-2.5 text-[11px] text-white/50 hover:bg-white/5">
                Keep Trading
              </button>
              <button onClick={onCashout} className="rounded bg-neon-cyan py-2.5 text-[11px] font-semibold text-black hover:bg-neon-cyan/90">
                Cash Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
