const { EventEmitter } = require("events");

class MarketEngine extends EventEmitter {
  constructor() {
    super();
    this.price = 100;
    this.velocity = 0;
    this.volState = "mid";
    this.spread = 0.08;
    this.liquidity = 1;
    this.liquidityShock = 0;
    this.tradeTape = [];
    this.bars = [];
    this.curBar = { t: Date.now(), o: this.price, h: this.price, l: this.price, c: this.price };
    this.lastTick = Date.now();
    this.news = null;
    this.online = { wallSt: 900, retail: 0 };
    this._interval = null;
  }

  start() {
    if (this._interval) return;
    this._interval = setInterval(() => {
      try { this.tick(); } catch (e) { console.error("[MarketEngine] tick error:", e); }
    }, 200);
  }

  stop() {
    if (this._interval) { clearInterval(this._interval); this._interval = null; }
  }

  tick() {
    const now = Date.now();
    this.lastTick = now;

    this.spread = 0.08 + Math.abs(this.velocity) * 0.02;
    this.liquidityShock = Math.max(0, this.liquidityShock * 0.92);
    this.liquidity = Math.max(0.25, 1.2 - Math.abs(this.velocity) * 0.2 - this.liquidityShock * 0.3);

    this.velocity = this.velocity * 0.88 + (Math.random() - 0.5) * 0.08;
    this.price = Math.max(1, this.price + this.velocity);

    if (now - this.curBar.t >= 1000) {
      this.bars.push(this.curBar);
      if (this.bars.length > 700) this.bars = this.bars.slice(-600);
      this.curBar = { t: now, o: this.price, h: this.price, l: this.price, c: this.price };
    } else {
      this.curBar.h = Math.max(this.curBar.h, this.price);
      this.curBar.l = Math.min(this.curBar.l, this.price);
      this.curBar.c = this.price;
    }

    this.emit("tick", this.getDelta());
  }

  getSnapshot() {
    return {
      t: Date.now(),
      price: this.price,
      velocity: this.velocity,
      volState: this.volState,
      spread: this.spread,
      liquidity: this.liquidity,
      bar: this.curBar,
      bars: this.bars.slice(-600),
      online: this.online,
      news: this.news
    };
  }

  getDelta() {
    return {
      t: Date.now(),
      price: this.price,
      velocity: this.velocity,
      volState: this.volState,
      spread: this.spread,
      liquidity: this.liquidity,
      bar: this.curBar,
      online: this.online,
      news: this.news
    };
  }

  makeOrderBook() {
    const bids = [];
    const asks = [];
    const step = 0.15 + Math.abs(this.velocity) * 0.1;
    for (let i = 0; i < 10; i++) {
      const offset = this.spread / 2 + i * step;
      const depth = Math.max(8, Math.round((80 + Math.random() * 40) * this.liquidity));
      bids.push({ price: this.price - offset, size: depth });
      asks.push({ price: this.price + offset, size: depth });
    }
    return { bids, asks, spread: this.spread, mid: this.price };
  }

  submitTrade({ side, size, slippageBoost = 1 }) {
    const dir = side === "buy" ? 1 : -1;
    const slippage = Math.max(0.01, (size / 1000) * (1 / Math.max(0.2, this.liquidity)) * 0.6 * slippageBoost);
    const fill = this.price + dir * (this.spread / 2 + slippage);
    this.velocity += dir * Math.min(1.5, size / 1000) * 0.08;
    this.price = Math.max(1, this.price + dir * Math.min(1.8, size / 800) * 0.04);
    this.liquidityShock += Math.min(2, size / 800);
    this.tradeTape.push({ t: Date.now(), side, size, price: fill });
    if (this.tradeTape.length > 50) this.tradeTape = this.tradeTape.slice(-50);
    return { fill, price: this.price, velocity: this.velocity };
  }
}

let engine;

function getEngine() {
  if (!engine) {
    engine = new MarketEngine();
    engine.start();
  }
  return engine;
}

module.exports = { getEngine };
