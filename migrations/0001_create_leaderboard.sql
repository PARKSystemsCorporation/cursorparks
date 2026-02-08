-- Leaderboard table for PARKSYSTEMS trading terminal
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  pnl REAL NOT NULL,
  region TEXT,
  cashed_out_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_pnl ON leaderboard(pnl DESC);
