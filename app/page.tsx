"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartCanvas } from "../src/components/ChartCanvas";
import { OrderBook } from "../src/components/OrderBook";
import { TradePanel } from "../src/components/TradePanel";
import { TradeTape } from "../src/components/TradeTape";
import { NewsFeed } from "../src/components/NewsFeed";
import { createMarketWorker } from "../src/engine/workerClient";
import type { Bar, MarketTick, OrderBook as Book, NewsItem } from "../src/engine/types";
import { calcFillPrice } from "../src/engine/execution";
import { db, type TradeRow, type NewsRow, type LeaderboardRun } from "../src/db/db";

const START_CASH = 100000;

export default function Home() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [tick, setTick] = useState<MarketTick | null>(null);
  const [position, setPosition] = useState({ size: 0, avgPrice: 0 });
  const [cash, setCash] = useState(START_CASH);
  const [qty, setQty] = useState(10);
  const [symbol, setSymbol] = useState("NQ");
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRun[]>([]);
  const [mobileTab, setMobileTab] = useState<"trade" | "news">("trade");

  const orderBook: Book = tick?.orderBook || {
    bids: [],
    asks: [],
    spread: 0,
    mid: tick?.price || 0
  };

  const equity = cash + position.size * (tick?.price || 0);
  const pnl = equity - START_CASH;
  const bid = orderBook.bids[0]?.price || (tick?.price || 0) - 0.05;
  const ask = orderBook.asks[0]?.price || (tick?.price || 0) + 0.05;

  useEffect(() => {
    const worker = createMarketWorker();
    const off = worker.onMessage(async (msg) => {
      if (msg.type === "tick") {
        setTick(msg.payload);
        setBars((prev) => {
          const next = [...prev, msg.payload.bar].slice(-120);
          return next;
        });
        if (msg.payload.news) {
          const n = msg.payload.news;
          setNews((prev) => [{ id: n.id, t: n.t, headline: n.headline, sentiment: n.sentiment, impact: n.impact }, ...prev].slice(0, 20));
          await db.news.add({ t: n.t, headline: n.headline, sentiment: n.sentiment, impact: n.impact });
        }
        await db.ticks.add({ symbol, t: msg.payload.t, price: msg.payload.price });
        await db.orderbook.add({
          symbol,
          t: msg.payload.t,
          bids: JSON.stringify(msg.payload.orderBook.bids),
          asks: JSON.stringify(msg.payload.orderBook.asks)
        });
      }
      if (msg.type === "bar") {
        await db.bars.add({
          symbol,
          t: msg.payload.t,
          o: msg.payload.o,
          h: msg.payload.h,
          l: msg.payload.l,
          c: msg.payload.c
        });
      }
      if (msg.type === "news") {
        const n = msg.payload;
        setNews((prev) => [{ id: n.id, t: n.t, headline: n.headline, sentiment: n.sentiment, impact: n.impact }, ...prev].slice(0, 20));
        await db.news.add({ t: n.t, headline: n.headline, sentiment: n.sentiment, impact: n.impact });
      }
    });
    return () => {
      off();
      worker.terminate();
    };
  }, [symbol]);

  useEffect(() => {
    db.leaderboard_runs.orderBy("t").reverse().limit(10).toArray().then(setLeaderboard);
  }, []);

  const handleTrade = (side: "buy" | "sell") => {
    if (!tick) return;
    const fill = calcFillPrice({
      mid: tick.price,
      spread: tick.spread,
      size: qty,
      liquidity: tick.liquidity,
      volatility: tick.volState === "high" ? 1.8 : tick.volState === "low" ? 0.6 : 1,
      side
    });
    const signed = side === "buy" ? qty : -qty;
    const newSize = position.size + signed;
    let newAvg = position.avgPrice;
    if (newSize === 0) {
      newAvg = 0;
    } else if (position.size === 0 || Math.sign(position.size) === Math.sign(newSize)) {
      const totalCost = position.avgPrice * position.size + fill * signed;
      newAvg = totalCost / newSize;
    }
    setPosition({ size: newSize, avgPrice: newAvg });
    setCash((c) => c - fill * signed);
    const trade: TradeRow = {
      symbol,
      t: Date.now(),
      side,
      size: qty,
      price: fill
    };
    setTrades((prev) => [trade, ...prev].slice(0, 30));
    db.trades.add(trade);
  };

  const onCashout = () => {
    db.leaderboard_runs.add({ t: Date.now(), pnl, trades: trades.length });
    db.leaderboard_runs.orderBy("t").reverse().limit(10).toArray().then(setLeaderboard);
    setCash(START_CASH);
    setPosition({ size: 0, avgPrice: 0 });
    setTrades([]);
  };

  const online = tick?.online || { wallSt: 0, retail: 0 };

  const symbols = useMemo(() => ["NQ", "ES", "RTY"], []);

  return (
    <div className="min-h-screen bg-bg-void px-4 py-4 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-white/50">PARKSYSTEMS</div>
          <div className="text-lg font-bold text-white">World Market Simulator</div>
        </div>
        <div className="glass flex items-center gap-4 rounded-full px-4 py-2 text-xs">
          <div>WallSt: <span className="text-neon-cyan">{online.wallSt}</span></div>
          <div>Retail: <span className="text-neon-green">{online.retail}</span></div>
          <div>Vol: <span className="text-white/80">{tick?.volState || "mid"}</span></div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr_300px]">
        <div className="hidden md:block">
          <OrderBook book={orderBook} />
        </div>

        <div className="glass flex h-[520px] flex-col rounded-xl p-3 md:h-[640px]">
          <div className="mb-2 flex items-center justify-between text-xs text-white/60">
            <span>{symbol} · ${tick?.price.toFixed(2) || "--"}</span>
            <span>Spread {tick?.spread.toFixed(3) || "--"}</span>
          </div>
          <div className="flex-1">
            <ChartCanvas bars={bars} price={tick?.price || 0} />
          </div>
        </div>

        <div className="hidden md:flex md:flex-col md:gap-3">
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
            onSymbol={setSymbol}
          />
          <TradeTape trades={trades} />
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
                onSymbol={setSymbol}
              />
              <TradeTape trades={trades} />
            </div>
          ) : (
            <NewsFeed news={news} />
          )}
        </div>
      </div>

      <div id="leaderboard" className="mt-6 glass rounded-xl p-4">
        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/50">
          Local Leaderboard
        </div>
        <div className="grid gap-2 text-xs">
          {leaderboard.length === 0 ? (
            <div className="text-white/40">No runs yet.</div>
          ) : (
            leaderboard.map((run) => (
              <div key={run.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span>{new Date(run.t).toLocaleTimeString()}</span>
                <span className={run.pnl >= 0 ? "text-neon-green" : "text-neon-red"}>
                  {run.pnl >= 0 ? "+" : ""}${run.pnl.toFixed(2)}
                </span>
                <span className="text-white/50">{run.trades} trades</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
