export type VolatilityState = "low" | "mid" | "high";

export type OrderBookLevel = {
  price: number;
  size: number;
};

export type OrderBook = {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  mid: number;
};

export type Bar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
};

export type NewsItem = {
  id: string;
  t: number;
  headline: string;
  sentiment: number;
  impact: number;
};

export type MarketTick = {
  t: number;
  price: number;
  velocity: number;
  volState: VolatilityState;
  spread: number;
  liquidity: number;
  orderBook: OrderBook;
  bar: Bar;
  bars?: Bar[];
  online: { wallSt: number; retail: number };
  news?: NewsItem;
};

export type WorkerMessage =
  | { type: "tick"; payload: MarketTick }
  | { type: "bar"; payload: Bar }
  | { type: "news"; payload: NewsItem }
  | { type: "snapshot"; payload: MarketTick };
