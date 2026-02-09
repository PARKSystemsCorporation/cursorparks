"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChartCanvas } from "../components/ChartCanvas";
import { OrderBook } from "../components/OrderBook";
import { TradePanel } from "../components/TradePanel";
import { TradeTape } from "../components/TradeTape";
import { NewsFeed } from "../components/NewsFeed";
import { AccountPanel } from "../components/AccountPanel";
import { ToastContainer, useToasts } from "../components/ToastNotificationSystem";
import { TradeStatisticsPanel } from "../components/TradeStatisticsPanel";
import { KeyboardShortcuts } from "../components/KeyboardShortcuts";
import { StreakIndicator } from "../components/StreakIndicator";
import { PriceAlerts, type PriceAlert } from "../components/PriceAlerts";
import { TradeHistoryViewer } from "../components/TradeHistoryViewer";
import { PerformanceDashboard } from "../components/PerformanceDashboard";
import { VolumeProfile } from "../components/VolumeProfile";
import { AchievementTracker, AchievementGallery, type Achievement, type AchievementContext } from "../components/AchievementSystem";
import { DailyChallenges, makeDailyChallenges } from "../components/DailyChallenges";
import { RealTimeLeaderboard } from "../components/RealTimeLeaderboard";
import { SoundToggle, useSoundEffects } from "../components/SoundEffects";
import { MarketDepthViz } from "../components/MarketDepthViz";
import { TutorialOverlay } from "../components/TutorialSystem";
import { SocialFeed, type SocialEvent } from "../components/SocialFeed";
import { AdvancedOrders, type AdvancedOrder } from "../components/AdvancedOrders";
import { TradeReplay } from "../components/TradeReplay";
import { MobileSheet } from "../components/MobileSheet";
import { MobileTabBar } from "../components/MobileTabBar";
import { SystemMetricsPanel, type SystemMetrics } from "../components/SystemMetricsPanel";
import { getSocket } from "../engine/socketClient";
import type { Bar, MarketTick, OrderBook as Book } from "../engine/types";
import { db, type TradeRow, type NewsRow } from "../db/db";
import { getRank } from "../engine/ranks";

const BASE_START_CASH = 100000;
const QTY_OPTIONS = [1, 10, 100, 1000, 10000];

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
type PanelTab = "account" | "upgrades" | "firms" | "leaderboards" | "performance" | "achievements" | "challenges" | "social" | "system";
type MobileTab = "trade" | "dom" | "tape" | "more";
type MobileMoreTab = PanelTab | "news";

const CORE_KEYS = ["attr_lots", "attr_balance", "attr_info"];
const CHART_KEYS = ["chart_indicators", "chart_drawing", "chart_multi_tf"];
const BOT_KEYS = ["bot_alerts", "bot_risk", "bot_scalper"];
const INTEL_KEYS = ["info_news_speed", "info_sentiment", "info_vol_forecast"];
const PANEL_TABS: PanelTab[] = ["account", "upgrades", "firms", "leaderboards", "performance", "achievements", "challenges", "social", "system"];
const MOBILE_TABS = [
  { id: "trade", label: "Trade" },
  { id: "dom", label: "DOM" },
  { id: "tape", label: "Tape" },
  { id: "more", label: "More" }
] as const;
const MOBILE_MORE_TABS = [
  "account",
  "upgrades",
  "firms",
  "leaderboards",
  "performance",
  "achievements",
  "challenges",
  "social",
  "news"
] as const;

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

export default function HomeClient() {
  const [tick, setTick] = useState<MarketTick | null>(null);
  const [position, setPosition] = useState({ size: 0, avgPrice: 0 });
  const [cash, setCash] = useState(BASE_START_CASH);
  const [startCash, setStartCash] = useState(BASE_START_CASH);
  const [qty, setQty] = useState(10);
  const symbol = "PSC";
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [mobileTab, setMobileTab] = useState<MobileTab>("trade");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [statsLastUpdatedAt, setStatsLastUpdatedAt] = useState<number | null>(null);
  const [statsStale, setStatsStale] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
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
  const [panelTab, setPanelTab] = useState<PanelTab>("account");
  const [mobileMoreTab, setMobileMoreTab] = useState<MobileMoreTab>("account");
  const [leftPanelTab, setLeftPanelTab] = useState<"dom" | "live">("dom");
  const [tradeFlash, setTradeFlash] = useState<"buy" | "sell" | null>(null);
  const [showCashoutConfirm, setShowCashoutConfirm] = useState(false);
  const [ready, setReady] = useState(false);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickCounter = useRef(0);
  const progressionRefreshInFlight = useRef(false);
  const statsRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsBackoffMs = useRef(15000);

  // ── New feature state ──
  const { toasts, addToast, dismissToast } = useToasts();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const sounds = useSoundEffects(soundEnabled);
  const { playBuy, playSell, playRankUp, playAchievement, playAlert, playError } = sounds;
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [showTradeHistory, setShowTradeHistory] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [socialEvents] = useState<SocialEvent[]>([]);
  const [advancedOrders, setAdvancedOrders] = useState<AdvancedOrder[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const prevRankRef = useRef(1);
  const [winStreak] = useState(0);
  const [lossStreak] = useState(0);
  const [maxPnl, setMaxPnl] = useState(0);
  const [cashouts, setCashouts] = useState(0);
  const _orderId = useRef(0);

  const orderBook: Book = tick?.orderBook || {
    bids: [],
    asks: [],
    spread: 0,
    mid: tick?.price || 0
  };

  const displayBars = useMemo(() => {
    const rawBars = tick?.bars || [];
    if (!rawBars.length || timeframeMs <= 1000) return rawBars;
    const out: Bar[] = [];
    let cur: Bar | null = null;
    let curBucket = 0;
    for (const b of rawBars) {
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
  }, [tick?.bars, timeframeMs]);

  const levelByKey = useMemo(() => {
    return new Map(userUpgrades.map((u) => [u.upgrade.key, u.level]));
  }, [userUpgrades]);

  const getLevelByKey = useCallback((key: string) => levelByKey.get(key) || 0, [levelByKey]);
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
    const onTick = (payload: MarketTick) => {
      setTick(payload);
      if (payload.news && hasNews) {
        const n = payload.news;
        setTimeout(() => {
          setNews((prev) => [{ id: n.id, t: n.t, headline: n.headline, sentiment: n.sentiment, impact: n.impact }, ...prev].slice(0, 20));
          db.news.add({ t: n.t, headline: n.headline, sentiment: n.sentiment, impact: n.impact });
        }, newsDelayRef.current);
      }
      tickCounter.current += 1;
      if (tickCounter.current % 5 === 0) {
        db.ticks.add({ symbol, t: payload.t, price: payload.price });
        db.orderbook.add({
          symbol,
          t: payload.t,
          bids: JSON.stringify(payload.orderBook.bids),
          asks: JSON.stringify(payload.orderBook.asks)
        });
      }
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
      // Toast + Sound
      addToast("trade", `${data.side.toUpperCase()} FILLED`, `${data.size} @ $${data.fill.toFixed(2)}`, data.side);
      if (data.side === "buy") playBuy(); else playSell();
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
        addToast("error", "TRADE REJECTED", `Max size ${data.maxSize}`);
        playError();
      }
    });
    return () => {
      socket.off("market:tick", onTick);
      socket.off("market:snapshot", onTick);
      socket.off("trade:fill");
      socket.off("trade:tape");
      socket.off("trade:reject");
    };
  }, [symbol, hasNews, addToast, playBuy, playSell, playError]);

  const loadProgression = useCallback(async () => {
    try {
      const data = await fetchJson("/api/progression/status");
      setStats(data.stats);
      setStatsLastUpdatedAt(Date.now());
      setStatsStale(false);
      setUpgradeDefs(data.defs || []);
      setUserUpgrades(data.upgrades || []);
      return true;
    } catch {
      return false;
    }
  }, []);

  const loadChat = useCallback(async () => {
    try {
      const data = await fetchJson("/api/firms/chat");
      setChat(data);
    } catch {
      setChat([]);
    }
  }, []);

  const loadFirm = useCallback(async () => {
    try {
      const data = await fetchJson("/api/firms/me");
      setFirmMember(data.member || null);
      if (data.member) await loadChat();
    } catch {
      setFirmMember(null);
    }
  }, [loadChat]);

  const loadLeaderboards = useCallback(async () => {
    try {
      const [solo, firms] = await Promise.all([
        fetchJson("/api/leaderboards/solo"),
        fetchJson("/api/leaderboards/firms")
      ]);
      setSoloLb(solo || []);
      setFirmLb(firms || []);
    } catch {
      // ignore
    }
  }, []);

  const loadAuth = useCallback(async () => {
    try {
      const data = await fetchJson("/api/auth/me");
      setAuthUser(data.user || null);
      setStats(data.stats || null);
      setStatsLastUpdatedAt(Date.now());
      setStatsStale(false);
      setUserUpgrades(data.upgrades || []);
      if (data.user) {
        await Promise.all([loadProgression(), loadFirm()]);
      }
    } catch {
      setAuthUser(null);
    }
  }, [loadProgression, loadFirm]);

  const refreshProgression = useCallback(async () => {
    if (!authUser || progressionRefreshInFlight.current) return null;
    progressionRefreshInFlight.current = true;
    try {
      return await loadProgression();
    } finally {
      progressionRefreshInFlight.current = false;
    }
  }, [authUser, loadProgression]);

  useEffect(() => {
    loadAuth();
    loadLeaderboards();
  }, [loadAuth, loadLeaderboards]);

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
    const socket = getSocket();
    const onStats = (payload: { userId?: string; stats?: PlayerStats }) => {
      if (!payload?.userId || payload.userId !== authUser?.id) return;
      setStats(payload.stats || null);
      setStatsLastUpdatedAt(Date.now());
      setStatsStale(false);
    };
    const onSystemMetrics = (payload: SystemMetrics) => {
      setSystemMetrics(payload);
    };
    socket.on("player:stats", onStats);
    socket.on("system:metrics", onSystemMetrics);
    return () => {
      socket.off("player:stats", onStats);
      socket.off("system:metrics", onSystemMetrics);
    };
  }, [authUser]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("session:refresh");
  }, [authUser]);

  useEffect(() => {
    if (!firmMember) return;
    const t = setInterval(() => loadChat(), 5000);
    return () => clearInterval(t);
  }, [firmMember, loadChat]);

  useEffect(() => {
    const level = getLevelByKey("info_news_speed");
    newsDelayRef.current = Math.max(500, Math.round(6000 * Math.pow(0.9, level)));
  }, [getLevelByKey]);

  useEffect(() => {
    if (!authUser) {
      setStatsStale(false);
      return;
    }
    const check = () => {
      if (!statsLastUpdatedAt) {
        setStatsStale(true);
        return;
      }
      const ageMs = Date.now() - statsLastUpdatedAt;
      setStatsStale(ageMs > 45000);
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [authUser, statsLastUpdatedAt]);

  const refreshProgression = useCallback(async () => {
    if (!authUser || progressionRefreshInFlight.current) return null;
    progressionRefreshInFlight.current = true;
    try {
      return await loadProgression();
    } finally {
      progressionRefreshInFlight.current = false;
    }
  }, [authUser, loadProgression]);
  useEffect(() => {
    if (!authUser) return;
    const socket = getSocket();
    const schedule = (delay: number) => {
      if (statsRefreshTimer.current) clearTimeout(statsRefreshTimer.current);
      statsRefreshTimer.current = setTimeout(() => runRefresh(), delay);
    };
    const runRefresh = async () => {
      if (document.visibilityState === "hidden") {
        schedule(statsBackoffMs.current);
        return;
      }
      const ok = await refreshProgression();
      let next = statsBackoffMs.current;
      if (ok === false) next = Math.min(120000, statsBackoffMs.current * 2);
      if (ok === true) next = 15000;
      statsBackoffMs.current = next;
      schedule(next);
    };
    const onFocus = () => runRefresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") runRefresh();
    };
    const onConnect = () => runRefresh();
    socket.on("connect", onConnect);
    runRefresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (statsRefreshTimer.current) clearTimeout(statsRefreshTimer.current);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      socket.off("connect", onConnect);
    };
  }, [authUser, refreshProgression]);

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

  const submitTrade = useCallback((side: "buy" | "sell", size: number) => {
    if (!size || !Number.isFinite(size)) return;
    const socket = getSocket();
    socket.emit("trade:submit", { side, size, symbol });
  }, [symbol]);

  const handleTrade = useCallback((side: "buy" | "sell") => {
    submitTrade(side, qty);
  }, [submitTrade, qty]);

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
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Registration failed.");
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
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Login failed.");
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
    } catch (err) {
      setFirmError(err instanceof Error ? err.message : "Create firm failed.");
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
            <div className="text-white">{def.title}</div>
            <div className="text-[10px] text-white/70">{def.description}</div>
          </div>
          <div className="text-[10px] text-white/70">
            Lv {level}{def.maxLevel ? `/${def.maxLevel}` : ""}
          </div>
        </div>
        {reqs.length > 0 && (
          <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/70">
            Requires {reqs.map((r) => `${upgradeLabel(r.key)} ${r.level}`).join(" + ")}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-white/90">{maxed ? "MAX" : `$${cost}`}</span>
          <button
            className="rounded-md bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/90 disabled:cursor-not-allowed disabled:opacity-40"
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
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : "Cashout failed.");
      }
    }
    addToast("info", "SESSION ENDED", `Final PnL: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)} (${trades.length} trades)`);
    setCashouts((c) => c + 1);
    setCash(startCash);
    setPosition({ size: 0, avgPrice: 0 });
    setTrades([]);
    setAdvancedOrders([]);
    setShowCashoutConfirm(false);
  };

  const online = tick?.online || { wallSt: 0, retail: 0 };
  const retailCount = wsOnline ?? online.retail;
  const sentiment = news[0]?.sentiment ?? 0;
  const showIndicators = getLevelByKey("chart_indicators") > 0;
  const showBotAlerts = getLevelByKey("bot_alerts") > 0;
  const hasMultiTf = getLevelByKey("chart_multi_tf") > 0;
  const botSignal = tick ? (tick.velocity >= 0 ? "BUY BIAS" : "SELL BIAS") : "--";

  const timeframes = useMemo(() => hasMultiTf
    ? [
        { label: "Fast", value: 1000 },
        { label: "5s", value: 5000 },
        { label: "10s", value: 10000 }
      ]
    : [{ label: "Fast", value: 1000 }],
  [hasMultiTf]);

  useEffect(() => {
    if (!hasMultiTf && timeframeMs !== 1000) setTimeframeMs(1000);
  }, [hasMultiTf, timeframeMs]);

  const canRug = position.size !== 0;
  const onRug = useCallback(() => {
    if (position.size === 0) return;
    const side = position.size > 0 ? "sell" : "buy";
    submitTrade(side, Math.abs(position.size));
  }, [position.size, submitTrade]);

  // ── Tutorial check (show on first visit) ──
  useEffect(() => {
    try {
      const seen = localStorage.getItem("ps_tutorial_done");
      if (!seen) setShowTutorial(true);
    } catch { /* ignore */ }
  }, []);

  const completeTutorial = useCallback(() => {
    setShowTutorial(false);
    try { localStorage.setItem("ps_tutorial_done", "1"); } catch { /* ignore */ }
  }, []);

  // ── Track max PnL ──
  useEffect(() => {
    if (pnl > maxPnl) setMaxPnl(pnl);
  }, [pnl, maxPnl]);

  // ── Rank-up detection ──
  useEffect(() => {
    if (rank.level > prevRankRef.current) {
      addToast("rankup", "RANK UP!", `You are now ${rank.name}`);
      playRankUp();
    }
    prevRankRef.current = rank.level;
  }, [rank.level, rank.name, addToast, playRankUp]);

  // ── Price alert handlers ──
  const addPriceAlert = useCallback((price: number, direction: "above" | "below") => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setPriceAlerts((prev) => [...prev, { id, price, direction, triggered: false }]);
    addToast("info", "Alert Set", `${direction === "above" ? "Above" : "Below"} $${price.toFixed(2)}`);
  }, [addToast]);

  const removePriceAlert = useCallback((id: string) => {
    setPriceAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const triggerPriceAlert = useCallback((alert: PriceAlert) => {
    setPriceAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, triggered: true } : a));
    addToast("alert", "PRICE ALERT", `Price crossed $${alert.price.toFixed(2)} (${alert.direction})`);
    playAlert();
  }, [addToast, playAlert]);

  // ── Achievement handler ──
  const achievementContext: AchievementContext = useMemo(() => ({
    tradeCount: trades.length,
    pnl,
    winStreak,
    lossStreak,
    maxPnl,
    totalVolume: trades.reduce((s, t) => s + t.size * t.price, 0),
    rank: rank.level,
    cashouts,
  }), [trades, pnl, winStreak, lossStreak, maxPnl, rank.level, cashouts]);

  const onAchievementUnlock = useCallback((ach: Achievement) => {
    setUnlockedAchievements((prev) => new Set([...prev, ach.id]));
    addToast("achievement", "ACHIEVEMENT UNLOCKED", ach.title);
    playAchievement();
  }, [addToast, playAchievement]);

  // ── Advanced order processing ──
  useEffect(() => {
    if (!currentPrice || advancedOrders.length === 0) return;
    setAdvancedOrders((prev) =>
      prev.map((o) => {
        if (o.status !== "pending") return o;
        let shouldFill = false;
        if (o.type === "limit") {
          if (o.side === "buy" && currentPrice <= o.price) shouldFill = true;
          if (o.side === "sell" && currentPrice >= o.price) shouldFill = true;
        } else if (o.type === "stop") {
          if (o.side === "buy" && currentPrice >= o.price) shouldFill = true;
          if (o.side === "sell" && currentPrice <= o.price) shouldFill = true;
        } else if (o.type === "trailing_stop" && o.trailingPct) {
          const trail = o.price * (o.trailingPct / 100);
          if (o.side === "sell" && currentPrice <= o.price - trail) shouldFill = true;
          if (o.side === "buy" && currentPrice >= o.price + trail) shouldFill = true;
        }
        if (shouldFill) {
          submitTrade(o.side, o.size);
          addToast("trade", "ORDER FILLED", `${o.type.toUpperCase()} ${o.side.toUpperCase()} ${o.size} @ $${currentPrice.toFixed(2)}`, o.side);
          return { ...o, status: "filled" as const };
        }
        return o;
      })
    );
  }, [currentPrice, advancedOrders, addToast, submitTrade]);

  const submitAdvancedOrder = useCallback((order: Omit<AdvancedOrder, "id" | "status" | "createdAt">) => {
    const id = `order-${++_orderId.current}-${Date.now()}`;
    setAdvancedOrders((prev) => [...prev, { ...order, id, status: "pending", createdAt: Date.now() }]);
    addToast("info", "ORDER PLACED", `${order.type.toUpperCase()} ${order.side.toUpperCase()} ${order.size} @ $${order.price.toFixed(2)}`);
  }, [addToast]);

  const cancelAdvancedOrder = useCallback((id: string) => {
    setAdvancedOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "cancelled" as const } : o));
  }, []);

  // ── Daily challenges ──
  const { buyCount, sellCount } = useMemo(() => {
    let buys = 0;
    for (const t of trades) {
      if (t.side === "buy") buys += 1;
    }
    return { buyCount: buys, sellCount: trades.length - buys };
  }, [trades]);
  const dailyChallenges = useMemo(
    () => makeDailyChallenges(trades.length, pnl, buyCount, sellCount),
    [trades.length, pnl, buyCount, sellCount]
  );

  const tapeTrades = globalTape.length ? globalTape : trades;
  const tradePanelProps = {
    symbol,
    pnl,
    cash,
    equity,
    bid,
    ask,
    qty,
    maxQty: maxOrderSize,
    position,
    currentPrice,
    rank,
    tradeCount: trades.length,
    onQty: setQty,
    onBuy: () => handleTrade("buy"),
    onSell: () => handleTrade("sell"),
    onCashout: () => setShowCashoutConfirm(true),
    onRug,
    canRug
  };

  const renderPanelContent = (tab: PanelTab) => {
    if (tab === "account") {
      return (
        <AccountPanel
          authUser={authUser}
          stats={stats}
          statsLastUpdatedAt={statsLastUpdatedAt}
          statsStale={statsStale}
          rank={rank}
          pnl={pnl}
          tradeCount={trades.length}
          cash={cash}
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
      );
    }

    if (tab === "upgrades") {
      return (
        <div className="space-y-4 text-xs">
          {!authUser && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
              Login to unlock upgrades and progression.
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-3">
            {CORE_KEYS.map((key) => {
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
                    <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">
                      {key === "attr_lots" ? "LOTS" : key === "attr_balance" ? "BALANCE" : "INFO"}
                    </div>
                    <div className="text-[10px] text-white/70">
                      Lv {level}{def.maxLevel ? `/${def.maxLevel}` : ""}
                    </div>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {key === "attr_lots" && `Max ${Math.floor(maxOrderSize)}`}
                    {key === "attr_balance" && `$${startCash.toFixed(0)}`}
                    {key === "attr_info" && `Rank ${infoLevel}`}
                  </div>
                  <div className="mt-1 text-[10px] text-white/70">
                    {key === "attr_lots" && `Next: ${Math.floor(nextMax)}`}
                    {key === "attr_balance" && `Next: $${nextCash.toFixed(0)}`}
                    {key === "attr_info" && "Unlocks intel + chart + bots"}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-white/90">{maxed ? "MAX" : `$${cost}`}</span>
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
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">Indicators + Drawing</div>
              <div className="mt-3 space-y-2">
                {CHART_KEYS.map((key) => renderUpgradeCard(defByKey.get(key)))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">Bots</div>
              <div className="mt-3 space-y-2">
                {BOT_KEYS.map((key) => renderUpgradeCard(defByKey.get(key)))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">Intel Modules</div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {INTEL_KEYS.map((key) => renderUpgradeCard(defByKey.get(key)))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tab === "firms") {
      return (
        <div className="space-y-2 text-xs">
          {!authUser ? (
            <div className="text-white/70 text-xs">Login to manage firms.</div>
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
      );
    }

    if (tab === "leaderboards") {
      return <RealTimeLeaderboard soloLb={soloLb} firmLb={firmLb} currentUser={authUser?.username} userPnl={pnl} />;
    }

    if (tab === "system") {
      return <SystemMetricsPanel metrics={systemMetrics} />;
    }

    if (tab === "performance") {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <PerformanceDashboard trades={trades} pnl={pnl} equity={equity} startCash={startCash} />
          <VolumeProfile trades={trades} globalTape={globalTape} currentPrice={currentPrice} />
        </div>
      );
    }

    if (tab === "achievements") {
      return <AchievementGallery unlockedIds={unlockedAchievements} />;
    }

    if (tab === "challenges") {
      return <DailyChallenges challenges={dailyChallenges} />;
    }

    return <SocialFeed events={socialEvents} globalTape={globalTape} currentUser={authUser?.username} />;
  };

  const renderMobileMoreContent = (tab: MobileMoreTab) => {
    if (tab === "news") {
      return hasNews ? (
        <NewsFeed news={news} />
      ) : (
        <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/70">
          Unlock INFO Rank 1 to access the macro news feed.
        </div>
      );
    }
    return renderPanelContent(tab);
  };

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-bg-void">
        <div className="animate-fadeIn text-center">
          <div className="text-[10px] uppercase tracking-[0.5em] text-white/70">Connecting to</div>
          <div className="mt-1 text-xl font-bold tracking-wider text-white transition-all duration-300">PARKSYSTEMS</div>
          <div className="mx-auto mt-4 h-px w-12 bg-neon-cyan/30 load-pulse rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] bg-bg-void px-4 py-3 pb-[min(35dvh,320px)] lg:pb-0 md:px-6 ${tradeFlash === "buy" ? "animate-flash-green" : tradeFlash === "sell" ? "animate-flash-red" : ""}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.35em] text-white/70">PARKSYSTEMS</span>
              <div className="pulse-dot" />
            </div>
            <div className="text-sm font-bold text-white">World Market Simulator</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SoundToggle enabled={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />
          <StreakIndicator trades={trades} currentPrice={currentPrice} />
          <div className="rounded border border-neon-cyan/20 bg-neon-cyan/5 px-2.5 py-1 text-[10px] font-semibold text-neon-cyan">
            LVL {rank.level} &middot; {rank.name}
          </div>
          <div className="glass flex items-center gap-2.5 rounded px-3 py-1.5 font-mono text-[10px]">
            <span className="text-white/70">WS</span>
            <span className="text-neon-cyan">{online.wallSt}</span>
            <span className="text-white/40">|</span>
            <span className="text-white/70">RT</span>
            <span className="text-neon-green">{retailCount}</span>
            <span className="text-white/40">|</span>
            <span className="text-white/70">VISITS</span>
            <span className="text-neon-cyan">{totalVisitors ?? 0}</span>
            {getLevelByKey("info_vol_forecast") > 0 && (
              <>
                <span className="text-white/40">|</span>
                <span className="text-white/70">VOL</span>
                <span className={`font-semibold ${tick?.volState === "high" ? "text-neon-red" : tick?.volState === "low" ? "text-neon-blue" : "text-white/80"}`}>
                  {(tick?.volState || "mid").toUpperCase()}
                </span>
              </>
            )}
            {getLevelByKey("info_sentiment") > 0 && (
              <>
                <span className="text-white/40">|</span>
                <span className={sentiment >= 0 ? "text-neon-green" : "text-neon-red"}>{sentiment.toFixed(2)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {position.size !== 0 && (
        <div className="animate-fadeIn mb-3 flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-4 py-2 font-mono text-[11px] transition-all duration-200 hover:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <span className="text-white/70">POS</span>
            <span className={`transition-colors duration-200 ${position.size > 0 ? "text-neon-green" : "text-neon-red"}`}>
              {position.size > 0 ? "LONG" : "SHORT"} {Math.abs(position.size)}
            </span>
            <span className="text-white/70">@ {position.avgPrice.toFixed(2)}</span>
          </div>
          <div className={`font-semibold transition-colors duration-200 ${unrealizedPnl >= 0 ? "text-neon-green" : "text-neon-red"}`}>
            {unrealizedPnl >= 0 ? "+" : ""}{unrealizedPnl.toFixed(2)} unrealized
          </div>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[220px_1fr_300px] xl:grid-cols-[240px_1fr_320px]">
        <div className="hidden lg:block">
            <div className="mb-2 flex items-center gap-1 rounded-md border border-white/5 bg-white/[0.02] p-1 text-[10px] uppercase tracking-[0.15em] text-white/70">
            <button
              className={`rounded px-2.5 py-1 transition-all duration-200 ${
                leftPanelTab === "dom" 
                  ? "bg-white/10 text-white scale-105" 
                  : "text-white/70 hover:text-white/90 hover:bg-white/5"
              }`}
              onClick={() => setLeftPanelTab("dom")}
            >
              DOM
            </button>
            <button
              className={`rounded px-2.5 py-1 transition-all duration-200 ${
                leftPanelTab === "live" 
                  ? "bg-white/10 text-white scale-105" 
                  : "text-white/70 hover:text-white/90 hover:bg-white/5"
              }`}
              onClick={() => setLeftPanelTab("live")}
            >
              Live
            </button>
          </div>
          {leftPanelTab === "dom" ? (
            <>
              <OrderBook book={orderBook} />
              <div className="mt-2">
                <MarketDepthViz book={orderBook} currentPrice={currentPrice} />
              </div>
            </>
          ) : (
            <>
              <TradeTape
                trades={globalTape}
                title="Live Traders"
                emptyLabel="No live trades."
                showCount={false}
                showStats={true}
                statsLabel="Live Metrics"
              />
              <div className="mt-2">
                <VolumeProfile trades={trades} globalTape={globalTape} currentPrice={currentPrice} />
              </div>
            </>
          )}
        </div>

        <div className="glass flex h-[520px] flex-col rounded-md p-3 lg:h-[640px]">
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-white/70">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white/90">{symbol}</span>
              <span className="text-neon-cyan transition-colors duration-200">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded bg-white/5 p-0.5">
                {timeframes.map((opt) => (
                  <button
                    key={opt.value}
                    className={`rounded px-2 py-0.5 text-[10px] transition-all duration-200 ${
                      timeframeMs === opt.value 
                        ? "bg-white/10 text-white scale-105" 
                        : "text-white/70 hover:text-white/90 hover:bg-white/[0.03]"
                    }`}
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

        <div className="hidden lg:flex lg:flex-col lg:gap-3">
          {showBotAlerts && (
            <div className="glass rounded-xl p-3 text-xs transition-all duration-200 hover:bg-white/[0.02]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/70">Bot Alert</div>
              <div className="mt-1 text-neon-cyan transition-colors duration-200">{botSignal}</div>
            </div>
          )}
          <TradePanel {...tradePanelProps} />
          <TradeTape trades={tapeTrades} />
          <TradeStatisticsPanel trades={trades} pnl={pnl} startCash={startCash} />
          <PriceAlerts
            currentPrice={currentPrice}
            alerts={priceAlerts}
            onAdd={addPriceAlert}
            onRemove={removePriceAlert}
            onTrigger={triggerPriceAlert}
          />
          <AdvancedOrders
            orders={advancedOrders.filter((o) => o.status !== "cancelled")}
            currentPrice={currentPrice}
            onSubmit={submitAdvancedOrder}
            onCancel={cancelAdvancedOrder}
            maxQty={maxOrderSize}
          />
          {hasNews ? (
            <NewsFeed news={news} />
          ) : (
            <div className="glass rounded-md p-3 text-xs text-white/70">
              Unlock INFO Rank 1 to access the macro news feed.
            </div>
          )}
        </div>
      </div>

      <MobileSheet>
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/70">Trade Desk</span>
              <span className="rounded border border-neon-cyan/20 bg-neon-cyan/5 px-1.5 py-0.5 text-[9px] font-semibold text-neon-cyan">
                {rank.name}
              </span>
            </div>
            <div className="font-mono text-[10px] text-white/60">
              {symbol} ${currentPrice.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="max-h-[42dvh] space-y-3 overflow-y-auto scrollbar-hidden">
            {mobileTab === "trade" && (
              <>
                {showBotAlerts && (
                  <div className="rounded bg-white/5 px-3 py-2 text-xs text-neon-cyan">
                    Bot Alert: {botSignal}
                  </div>
                )}
                <TradePanel {...tradePanelProps} />
                <PriceAlerts
                  currentPrice={currentPrice}
                  alerts={priceAlerts}
                  onAdd={addPriceAlert}
                  onRemove={removePriceAlert}
                  onTrigger={triggerPriceAlert}
                />
                <AdvancedOrders
                  orders={advancedOrders.filter((o) => o.status !== "cancelled")}
                  currentPrice={currentPrice}
                  onSubmit={submitAdvancedOrder}
                  onCancel={cancelAdvancedOrder}
                  maxQty={maxOrderSize}
                />
              </>
            )}

            {mobileTab === "dom" && (
              <>
                <OrderBook book={orderBook} />
                <div className="mt-2">
                  <MarketDepthViz book={orderBook} currentPrice={currentPrice} />
                </div>
              </>
            )}

            {mobileTab === "tape" && (
              <>
                <TradeTape trades={tapeTrades} />
                <div className="mt-2">
                  <VolumeProfile trades={trades} globalTape={globalTape} currentPrice={currentPrice} />
                </div>
              </>
            )}

            {mobileTab === "more" && (
              <>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
                  {MOBILE_MORE_TABS.map((tab) => {
                    const label = tab === "leaderboards" ? "Leaderboards" : tab.charAt(0).toUpperCase() + tab.slice(1);
                    return (
                      <button
                        key={tab}
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition-all duration-200 ${
                          mobileMoreTab === tab
                            ? "bg-neon-cyan text-black shadow-glow-cyan"
                            : "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white"
                        }`}
                        onClick={() => setMobileMoreTab(tab)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2">
                  {renderMobileMoreContent(mobileMoreTab)}
                </div>
              </>
            )}
          </div>
        </div>
        <MobileTabBar
          tabs={MOBILE_TABS}
          active={mobileTab}
          onChange={(id) => setMobileTab(id as MobileTab)}
        />
      </MobileSheet>

      <div className="mt-6 glass rounded-xl p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {PANEL_TABS.map((tab) => (
            <button
              key={tab}
              className={`rounded-full px-3 py-1 text-xs transition-all duration-200 ${
                panelTab === tab 
                  ? "bg-neon-cyan text-black scale-105 shadow-glow-cyan" 
                  : "bg-white/10 text-white hover:bg-white/15 hover:text-white hover:scale-105"
              }`}
              onClick={() => setPanelTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {renderPanelContent(panelTab)}
      </div>

      {/* ── Utility buttons ── */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <button onClick={() => setShowTradeHistory(true)} className="rounded border border-white/10 px-3 py-1.5 text-[10px] text-white/30 transition-all duration-200 hover:bg-white/5 hover:text-white/50">
          Trade History
        </button>
        <button onClick={() => setShowReplay(true)} className="rounded border border-white/10 px-3 py-1.5 text-[10px] text-white/30 transition-all duration-200 hover:bg-white/5 hover:text-white/50">
          Replay
        </button>
        <button onClick={() => setShowTutorial(true)} className="rounded border border-white/10 px-3 py-1.5 text-[10px] text-white/30 transition-all duration-200 hover:bg-white/5 hover:text-white/50">
          Tutorial
        </button>
      </div>

      {showCashoutConfirm && (
        <div 
          className="animate-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" 
          onClick={() => setShowCashoutConfirm(false)}
        >
          <div 
            className="animate-modal-content glass mx-4 w-full max-w-xs rounded-md p-6 text-center shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">End Session</div>
            <div className={`mt-2 font-mono text-3xl font-bold transition-colors duration-200 ${pnl >= 0 ? "text-neon-green" : "text-neon-red"}`}>
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-white/70">
              {trades.length} trades &middot; {rank.name}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button 
                onClick={() => setShowCashoutConfirm(false)} 
                className="rounded border border-white/10 py-2.5 text-[11px] text-white/80 transition-all duration-200 hover:bg-white/5 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                Keep Trading
              </button>
              <button 
                onClick={onCashout} 
                className="rounded bg-neon-cyan py-2.5 text-[11px] font-semibold text-black transition-all duration-200 hover:bg-neon-cyan/90 hover:shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98]"
              >
                Cash Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Global overlays ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <KeyboardShortcuts
        onBuy={() => handleTrade("buy")}
        onSell={() => handleTrade("sell")}
        onRug={onRug}
        onQty={setQty}
        qtyOptions={QTY_OPTIONS}
      />
      <AchievementTracker
        context={achievementContext}
        unlockedIds={unlockedAchievements}
        onUnlock={onAchievementUnlock}
      />
      {showTradeHistory && (
        <TradeHistoryViewer trades={trades} onClose={() => setShowTradeHistory(false)} />
      )}
      {showReplay && (
        <TradeReplay trades={trades} onClose={() => setShowReplay(false)} />
      )}
      <TutorialOverlay show={showTutorial} onComplete={completeTutorial} onDismiss={() => setShowTutorial(false)} />
    </div>
  );
}
