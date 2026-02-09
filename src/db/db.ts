import Dexie, { type Table } from "dexie";

export type Setting = { key: string; value: string };
export type SymbolRow = { id?: number; symbol: string; name: string };
export type BarRow = { id?: number; symbol: string; t: number; o: number; h: number; l: number; c: number };
export type TickRow = { id?: number; symbol: string; t: number; price: number };
export type OrderBookRow = { id?: number; symbol: string; t: number; bids: string; asks: string };
export type TradeRow = { id?: number; symbol: string; t: number; side: string; size: number; price: number };
export type PositionRow = { id?: number; symbol: string; size: number; avgPrice: number };
export type NewsRow = { id?: string; t: number; headline: string; sentiment: number; impact: number };
export type LeaderboardRun = { id?: number; t: number; pnl: number; trades: number };

class MarketDB extends Dexie {
  settings!: Table<Setting>;
  symbols!: Table<SymbolRow>;
  bars!: Table<BarRow>;
  ticks!: Table<TickRow>;
  orderbook!: Table<OrderBookRow>;
  trades!: Table<TradeRow>;
  positions!: Table<PositionRow>;
  news!: Table<NewsRow>;
  leaderboard_runs!: Table<LeaderboardRun>;

  constructor() {
    super("parksim");
    this.version(1).stores({
      settings: "&key",
      symbols: "++id, symbol",
      bars: "++id, symbol, t",
      ticks: "++id, symbol, t",
      orderbook: "++id, symbol, t",
      trades: "++id, symbol, t",
      positions: "++id, symbol",
      news: "++id, t",
      leaderboard_runs: "++id, t"
    });
  }
}

export const db = new MarketDB();
