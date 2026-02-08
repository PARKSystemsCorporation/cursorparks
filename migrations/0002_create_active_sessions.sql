-- Live presence: tracks who's currently playing
CREATE TABLE IF NOT EXISTS active_sessions (
  id TEXT PRIMARY KEY,
  callsign TEXT NOT NULL,
  region TEXT,
  pnl REAL DEFAULT 0,
  equity REAL DEFAULT 0,
  last_seen INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON active_sessions(last_seen);
