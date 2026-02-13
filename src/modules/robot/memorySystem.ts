/**
 * Robot memory: STM (last 30 turns), WM (8 pinned), LTM (key-value with strength).
 * No retraining; deterministic retrieval.
 */

const STM_SIZE = 30;
const WM_SIZE = 8;
const LTM_TOP_K = 3;
const STRENGTH_DECAY_PER_MIN = 0.01;
const STRENGTH_REFERENCE_BOOST = 0.2;
const PROMOTE_THRESHOLD = 3;

export interface STMTurn {
  role: "user" | "robot";
  text: string;
  timestamp: number;
}

export interface WMFact {
  key: string;
  value: string;
}

export interface LTMEntry {
  value: string;
  strength: number;
  lastAccessed: number;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function overlapScore(queryTokens: string[], key: string): number {
  const keyTokens = new Set(tokenize(key));
  let score = 0;
  for (const t of queryTokens) {
    if (keyTokens.has(t)) score += 1;
  }
  return queryTokens.length > 0 ? score / queryTokens.length : 0;
}

export class RobotMemory {
  private stm: STMTurn[] = [];
  private wm: WMFact[] = [];
  private ltm = new Map<string, LTMEntry>();
  private lastDecayTime = Date.now();

  pushSTM(role: "user" | "robot", text: string): void {
    this.stm.push({ role, text, timestamp: Date.now() });
    if (this.stm.length > STM_SIZE) this.stm.shift();
  }

  getSTM(lastN: number = 5): STMTurn[] {
    return this.stm.slice(-lastN);
  }

  pinWM(key: string, value: string): void {
    const existing = this.wm.findIndex((f) => f.key === key);
    if (existing >= 0) this.wm.splice(existing, 1);
    this.wm.unshift({ key, value });
    if (this.wm.length > WM_SIZE) this.wm.pop();
  }

  getWM(): WMFact[] {
    return [...this.wm];
  }

  writeLTM(key: string, value: string, repeated: boolean = false): void {
    this.decayLTM();
    const entry = this.ltm.get(key);
    if (entry) {
      entry.strength = Math.min(1, entry.strength + (repeated ? 1 : 0.5));
      entry.lastAccessed = Date.now();
    } else {
      this.ltm.set(key, { value, strength: 0.5, lastAccessed: Date.now() });
    }
  }

  referenceLTM(key: string): void {
    this.decayLTM();
    const entry = this.ltm.get(key);
    if (entry) {
      entry.strength = Math.min(1, entry.strength + STRENGTH_REFERENCE_BOOST);
      entry.lastAccessed = Date.now();
    }
  }

  private decayLTM(): void {
    const now = Date.now();
    const elapsedMin = (now - this.lastDecayTime) / 60000;
    this.lastDecayTime = now;
    for (const [, entry] of this.ltm) {
      entry.strength = Math.max(0, entry.strength - STRENGTH_DECAY_PER_MIN * elapsedMin);
    }
    for (const [k, entry] of this.ltm) {
      if (entry.strength <= 0) this.ltm.delete(k);
    }
  }

  retrieveLTM(query: string, topK: number = LTM_TOP_K): { key: string; value: string; strength: number }[] {
    this.decayLTM();
    const tokens = tokenize(query);
    const scored = Array.from(this.ltm.entries())
      .map(([key, entry]) => ({ key, ...entry, score: overlapScore(tokens, key) * (0.5 + 0.5 * entry.strength) }))
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(({ key, value, strength }) => ({ key, value, strength }));
  }

  /** Promote repeated STM topics to LTM (e.g. fact mentioned 3+ times). */
  promoteFromSTM(): void {
    const counts = new Map<string, number>();
    for (const turn of this.stm) {
      for (const word of tokenize(turn.text)) {
        counts.set(word, (counts.get(word) ?? 0) + 1);
      }
    }
    for (const [word, count] of counts) {
      if (count >= PROMOTE_THRESHOLD && word.length > 2) {
        this.writeLTM(word, word, true);
      }
    }
  }
}
