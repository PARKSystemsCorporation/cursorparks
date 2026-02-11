import type { Bar, MarketTick, NewsItem, OrderBook, VolatilityState } from "./types";

type NewsImpulse = NewsItem & { decayMs: number };

const TICK_MS = 200;
const BAR_MS = 1000;

let price = 100;
let velocity = 0;
let volState: VolatilityState = "mid";
let volUntil = Date.now() + 60_000;
let currentBar: Bar = { t: Date.now(), o: price, h: price, l: price, c: price };
const bars: Bar[] = [];
const newsQueue: NewsImpulse[] = [];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function chooseVolState(): VolatilityState {
  const r = Math.random();
  if (r < 0.2) return "low";
  if (r < 0.75) return "mid";
  return "high";
}

function volMultiplier(state: VolatilityState) {
  if (state === "low") return 0.6;
  if (state === "high") return 1.8;
  return 1.0;
}

function maybeRotateVol(now: number) {
  if (now < volUntil) return;
  volState = chooseVolState();
  const span = volState === "high" ? rand(20_000, 50_000) : rand(45_000, 120_000);
  volUntil = now + span;
}

function maybeGenerateNews(now: number) {
  if (newsQueue.length > 0) return;
  if (Math.random() > 0.035) return;
  const sentiment = rand(-1, 1);
  const impact = rand(0.6, 2.2);
  const headlines = sentiment >= 0
    ? ["Macro bid wave hits futures", "Liquidity loosens after CPI beat", "Risk-on surge from mega caps"]
    : ["Risk-off shock on tape", "Macro dump on rate scare", "Liquidity dries as sell program hits"];
  const headline = headlines[(Math.random() * headlines.length) | 0];
  const item: NewsImpulse = {
    id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
    t: now,
    headline,
    sentiment,
    impact,
    decayMs: rand(20_000, 60_000)
  };
  newsQueue.push(item);
  postMessage({ type: "news", payload: item });
}

function getNewsImpulse(now: number) {
  let total = 0;
  for (let i = newsQueue.length - 1; i >= 0; i--) {
    const n = newsQueue[i];
    const age = now - n.t;
    if (age > n.decayMs) {
      newsQueue.splice(i, 1);
      continue;
    }
    const decay = Math.exp(-age / n.decayMs);
    total += n.sentiment * n.impact * decay;
  }
  return total;
}

function makeOrderBook(mid: number, spread: number, vol: number): OrderBook {
  const bids = [];
  const asks = [];
  const step = 0.15 + vol * 0.12;
  const depthBase = 80 / (vol + 0.4);
  for (let i = 0; i < 10; i++) {
    const offset = spread / 2 + i * step;
    bids.push({ price: mid - offset, size: Math.max(5, Math.round(depthBase + rand(-20, 40))) });
    asks.push({ price: mid + offset, size: Math.max(5, Math.round(depthBase + rand(-20, 40))) });
  }
  return { bids, asks, spread, mid };
}

function updateBars(now: number) {
  if (!currentBar || now - currentBar.t >= BAR_MS) {
    if (currentBar) bars.push(currentBar);
    currentBar = { t: now, o: price, h: price, l: price, c: price };
    postMessage({ type: "bar", payload: currentBar });
  } else {
    currentBar.h = Math.max(currentBar.h, price);
    currentBar.l = Math.min(currentBar.l, price);
    currentBar.c = price;
  }
}

function getOnlineCount(now: number) {
  const base = 900 + Math.sin(now / 120_000) * 120;
  const wallSt = Math.max(200, Math.round(base + rand(-40, 80)));
  const retail = Math.max(30, Math.round(60 + Math.sin(now / 48_000) * 22 + rand(-8, 18)));
  return { wallSt, retail };
}

function tick() {
  const now = Date.now();
  maybeRotateVol(now);
  maybeGenerateNews(now);

  const vol = volMultiplier(volState);
  const liquidity = Math.max(0.4, 1.4 - vol * 0.3 + rand(-0.1, 0.1));
  const spread = 0.08 * (1.1 + vol * 0.6) * (1 / liquidity);
  const newsImpulse = getNewsImpulse(now);
  const drift = rand(-0.04, 0.04) * (0.7 + vol * 0.4);
  const noise = rand(-0.08, 0.08) * vol;

  velocity = velocity * 0.88 + drift + noise + newsImpulse * 0.08;
  price = Math.max(1, price + velocity);

  updateBars(now);
  const orderBook = makeOrderBook(price, spread, vol);

  const tickPayload: MarketTick = {
    t: now,
    price,
    velocity,
    volState,
    spread,
    liquidity,
    orderBook,
    bar: currentBar,
    online: getOnlineCount(now),
    news: newsQueue[0]
  };
  postMessage({ type: "tick", payload: tickPayload });
}

function start() {
  postMessage({ type: "snapshot", payload: { t: Date.now(), price, velocity, volState, spread: 0.1, liquidity: 1, orderBook: makeOrderBook(price, 0.1, 1), bar: currentBar, bars: [], online: getOnlineCount(Date.now()) } });
  setInterval(tick, TICK_MS);
}

// Handle incoming delta updates from server (if using shared worker mode)
self.onmessage = (e) => {
  if (e.data.type === "server_delta") {
    // Merge server state if we were syncing (optional, for now we run local sim)
  }
};

start();
