"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChartCanvas } from "../src/components/ChartCanvas";
import { OrderBook } from "../src/components/OrderBook";
import { TradePanel } from "../src/components/TradePanel";
import { TradeTape } from "../src/components/TradeTape";
import { NewsFeed } from "../src/components/NewsFeed";
import { getSocket } from "../src/engine/socketClient";
import type { Bar, MarketTick, OrderBook as Book } from "../src/engine/types";
import { db, type TradeRow, type NewsRow, type LeaderboardRun } from "../src/db/db";

const START_CASH = 100000;

type AuthUser = { id: string; username: string };
type PlayerStats = { cashoutBalance: number; totalPnl: number; level: number; reputation: number; xp: number };
type UpgradeDef = { id: string; key: string; category: string; title: string; description: string; baseCost: number; costScale: number };
type UserUpgrade = { id: string; upgradeId: string; level: number; upgrade: UpgradeDef };
type FirmMember = { firmId: string; role: string; firm: { name: string } };
type ChatMessage = { id: string; user: string; message: string; t: string };

export default function Home() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [tick, setTick] = useState<MarketTick | null>(null);
  const [position, setPosition] = useState({ size: 0, avgPrice: 0 });
  const [cash, setCash] = useState(START_CASH);
  const [qty, setQty] = useState(10);
  const [symbol, setSymbol] = useState("PSC");
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
  const [timeframeMs, setTimeframeMs] = useState(1000);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState<"register" | "login" | null>(null);
  const [firmName, setFirmName] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [globalTape, setGlobalTape] = useState<TradeRow[]>([]);
  const newsDelayRef = useRef(6000);
  const [panelTab, setPanelTab] = useState<"account" | "upgrades" | "firms" | "leaderboards">("account");

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

  const equity = cash + position.size * (tick?.price || 0);
  const pnl = equity - START_CASH;
  const bid = orderBook.bids[0]?.price || (tick?.price || 0) - 0.05;
  const ask = orderBook.asks[0]?.price || (tick?.price || 0) + 0.05;

  useEffect(() => {
    const socket = getSocket();
    const onTick = async (payload: MarketTick) => {
      setTick(payload);
      setBars(payload.bars || []);
      if (payload.news) {
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
      const newSize = position.size + signed;
      let newAvg = position.avgPrice;
      if (newSize === 0) {
        newAvg = 0;
      } else if (position.size === 0 || Math.sign(position.size) === Math.sign(newSize)) {
        const totalCost = position.avgPrice * position.size + data.fill * signed;
        newAvg = totalCost / newSize;
      }
      setPosition({ size: newSize, avgPrice: newAvg });
      setCash((c) => c - data.fill * signed);
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
  }, [symbol]);

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
    newsDelayRef.current = Math.max(0, 6000 - level * 1000);
  }, [userUpgrades]);

  async function fetchJson(url: string, opts?: RequestInit) {
    const res = await fetch(url, {
      credentials: "include",
      ...opts
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed (${res.status})`);
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
      setRegPass("");
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
      setLoginPass("");
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
    await fetchJson("/api/firms/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    await loadFirm();
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
    const def = upgradeDefs.find((d) => d.key === key);
    if (!def) return 0;
    const owned = userUpgrades.find((u) => u.upgradeId === def.id);
    return owned?.level || 0;
  }

  const onCashout = () => {
    db.leaderboard_runs.add({ t: Date.now(), pnl, trades: trades.length });
    db.leaderboard_runs.orderBy("t").reverse().limit(10).toArray().then(setLeaderboard);
    if (authUser) {
      fetch("/api/leaderboards/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pnl, trades: trades.length, riskScore: Math.abs(pnl) / Math.max(1, trades.length), streak: trades.length })
      })
        .then(() => {
          loadAuth();
          loadLeaderboards();
        })
        .catch(() => {});
    }
    setCash(START_CASH);
    setPosition({ size: 0, avgPrice: 0 });
    setTrades([]);
  };

  const online = tick?.online || { wallSt: 0, retail: 0 };
  const retailCount = wsOnline ?? online.retail;
  const sentiment = news[0]?.sentiment ?? 0;
  const showIndicators = getUpgradeLevel("chart_indicators") > 0;
  const showBotAlerts = getUpgradeLevel("bot_alerts") > 0;
  const botSignal = tick ? (tick.velocity >= 0 ? "BUY BIAS" : "SELL BIAS") : "--";

  const symbols = useMemo(() => ["PSC"], []);
  const canRug = position.size !== 0;
  const onRug = () => {
    if (!canRug) return;
    const side = position.size > 0 ? "sell" : "buy";
    submitTrade(side, Math.abs(position.size));
  };

  return (
    <div className="min-h-screen bg-bg-void px-4 py-4 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-white/50">GARI.MMO</div>
          <div className="text-lg font-bold text-white">World Market Simulator</div>
        </div>
        <div className="glass flex items-center gap-4 rounded-full px-4 py-2 text-xs">
          <div>WallSt: <span className="text-neon-cyan">{online.wallSt}</span></div>
          <div>Retail: <span className="text-neon-green">{retailCount}</span></div>
          {getUpgradeLevel("info_vol_forecast") > 0 && (
            <div>Vol: <span className="text-white/80">{tick?.volState || "mid"}</span></div>
          )}
          {getUpgradeLevel("info_sentiment") > 0 && (
            <div>Sent: <span className={sentiment >= 0 ? "text-neon-green" : "text-neon-red"}>{sentiment.toFixed(2)}</span></div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr_300px]">
        <div className="hidden md:block">
          <OrderBook book={orderBook} />
        </div>

        <div className="glass flex h-[520px] flex-col rounded-xl p-3 md:h-[640px]">
          <div className="mb-2 flex items-center justify-between text-xs text-white/60">
            <span>{symbol} · ${tick?.price.toFixed(2) || "--"}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">Candle View</span>
              <div className="flex rounded-full bg-white/5 p-1">
                {[
                  { label: "Fast", value: 1000 },
                  { label: "5s", value: 5000 },
                  { label: "10s", value: 10000 }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className={`rounded-full px-2 py-1 text-[10px] ${timeframeMs === opt.value ? "bg-neon-cyan text-black" : "text-white/60"}`}
                    onClick={() => setTimeframeMs(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <span>Spread {tick?.spread.toFixed(3) || "--"}</span>
          </div>
          <div className="flex-1">
            <ChartCanvas bars={displayBars} price={tick?.price || 0} showSMA={showIndicators} />
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
            symbols={symbols}
            pnl={pnl}
            cash={cash}
            equity={equity}
            bid={bid}
            ask={ask}
            qty={qty}
            onQty={setQty}
            onBuy={() => handleTrade("buy")}
            onSell={() => handleTrade("sell")}
            onCashout={onCashout}
            onRug={onRug}
            canRug={canRug}
            onSymbol={setSymbol}
          />
          <TradeTape trades={globalTape.length ? globalTape : trades} />
          <NewsFeed news={news} />
        </div>
      </div>

      <div className="md:hidden">
        <div className="fixed bottom-0 left-0 right-0 z-40 rounded-t-2xl bg-bg-panel px-4 py-3 shadow-glass">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">Trade Desk</div>
            <div className="flex gap-2">
              <button
                className={`rounded-full px-3 py-1 text-xs ${mobileTab === "trade" ? "bg-neon-cyan text-black" : "bg-white/10 text-white/70"}`}
                onClick={() => setMobileTab("trade")}
              >
                Trade
              </button>
              <button
                className={`rounded-full px-3 py-1 text-xs ${mobileTab === "news" ? "bg-neon-cyan text-black" : "bg-white/10 text-white/70"}`}
                onClick={() => setMobileTab("news")}
              >
                News
              </button>
            </div>
          </div>
          {mobileTab === "trade" ? (
            <div className="space-y-3">
              {showBotAlerts && (
                <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-neon-cyan">
                  Bot Alert: {botSignal}
                </div>
              )}
              <TradePanel
                symbol={symbol}
                symbols={symbols}
                pnl={pnl}
                cash={cash}
                equity={equity}
                bid={bid}
                ask={ask}
                qty={qty}
                onQty={setQty}
                onBuy={() => handleTrade("buy")}
                onSell={() => handleTrade("sell")}
                onCashout={onCashout}
                onRug={onRug}
                canRug={canRug}
                onSymbol={setSymbol}
              />
              <TradeTape trades={globalTape.length ? globalTape : trades} />
            </div>
          ) : (
            <NewsFeed news={news} />
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
          <div className="space-y-2 text-xs">
            {authUser ? (
              <div className="space-y-2 text-xs">
                <div className="text-white/80">Signed in as <span className="text-neon-cyan">{authUser.username}</span></div>
                <div>Level: <span className="text-neon-green">{stats?.level ?? 1}</span></div>
                <div>Cashout Balance: <span className="text-white/80">${stats?.cashoutBalance?.toFixed(2) ?? "0.00"}</span></div>
                <button className="rounded-md bg-white/10 px-3 py-2 text-xs" onClick={logout}>Logout</button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-[10px] text-white/50">Register</div>
                  <input className="mt-1 w-full rounded-md bg-white/5 p-2" placeholder="Username" value={regUser} onChange={(e) => setRegUser(e.target.value)} />
                  <input className="mt-1 w-full rounded-md bg-white/5 p-2" type="password" placeholder="Password" value={regPass} onChange={(e) => setRegPass(e.target.value)} />
                  <button
                    className="mt-2 w-full rounded-md bg-neon-cyan px-3 py-2 text-black disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => register(regUser, regPass)}
                    disabled={authBusy === "register"}
                  >
                    {authBusy === "register" ? "Registering..." : "Register"}
                  </button>
                </div>
                <div>
                  <div className="text-[10px] text-white/50">Login</div>
                  <input className="mt-1 w-full rounded-md bg-white/5 p-2" placeholder="Username" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} />
                  <input className="mt-1 w-full rounded-md bg-white/5 p-2" type="password" placeholder="Password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
                  <button
                    className="mt-2 w-full rounded-md bg-white/20 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => login(loginUser, loginPass)}
                    disabled={authBusy === "login"}
                  >
                    {authBusy === "login" ? "Logging in..." : "Login"}
                  </button>
                </div>
                {authError && (
                  <div className="md:col-span-2 rounded-md bg-neon-red/10 px-3 py-2 text-xs text-neon-red">
                    {authError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {panelTab === "upgrades" && (
          <div className="space-y-2 text-xs">
            {authUser ? (
              <div className="grid gap-2 md:grid-cols-2">
                {upgradeDefs.map((def) => {
                  const owned = userUpgrades.find((u) => u.upgradeId === def.id);
                  const level = owned?.level || 0;
                  const cost = upgradeCost(def, level);
                  return (
                    <div key={def.id} className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white/80">{def.title}</div>
                          <div className="text-[10px] text-white/40">{def.category}</div>
                        </div>
                        <div className="text-[10px] text-white/60">Lv {level}</div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-white/60">${cost}</span>
                        <button className="rounded-md bg-white/10 px-2 py-1" onClick={() => purchaseUpgrade(def.key)}>Upgrade</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-white/40 text-xs">Login to unlock upgrades.</div>
            )}
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
                  <button className="rounded-md bg-neon-cyan px-2 text-black" onClick={() => createFirm(firmName)}>Create</button>
                </div>
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
    </div>
  );
}
