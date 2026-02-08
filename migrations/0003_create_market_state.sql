-- Market state for shared chart persistence
CREATE TABLE IF NOT EXISTS market_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Per-user trading accounts
CREATE TABLE IF NOT EXISTS accounts (
  callsign TEXT PRIMARY KEY,
  cash REAL NOT NULL,
  position INTEGER NOT NULL,
  avg_price REAL NOT NULL,
  trades TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Top 3 single-trade PnL
CREATE TABLE IF NOT EXISTS top_trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  callsign TEXT NOT NULL,
  pnl REAL NOT NULL,
  size INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
