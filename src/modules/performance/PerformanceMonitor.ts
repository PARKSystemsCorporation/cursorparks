/**
 * Singleton performance monitor: fps (rolling average), ping, budget scores.
 * Used by ether chat to gate 3D text spawn rate.
 */

const FPS_SAMPLE_SIZE = 60;
const BASELINE_PING = 300;
const FPS_MIN = 30;
const ETHER_CAP_MIN = 6;
const ETHER_CAP_MAX = 24;
const SPAWN_PROB_MIN = 0.08;
const SPAWN_PROB_MAX = 0.35;
const BUDGET_FPS_WEIGHT = 0.55;
const BUDGET_NET_WEIGHT = 0.45;

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export interface PerformanceSnapshot {
  fps: number;
  ping_ms: number;
  netScore: number;
  fpsScore: number;
  budgetScore: number;
  etherCap: number;
  spawnProbability: number;
}

class PerformanceMonitorClass {
  private frameTimes: number[] = [];
  private lastTime = 0;
  private _ping_ms = 0;
  private _activeEtherCount = 0;

  /** Call once per frame (e.g. from useFrame). */
  tick(): void {
    const now = performance.now();
    if (this.lastTime > 0) {
      const dt = (now - this.lastTime) / 1000;
      const fps = dt > 0 ? 1 / dt : 60;
      this.frameTimes.push(fps);
      if (this.frameTimes.length > FPS_SAMPLE_SIZE) this.frameTimes.shift();
    }
    this.lastTime = now;
  }

  /** Set ping from Socket.IO roundtrip (ms). */
  setPing(ms: number): void {
    this._ping_ms = ms;
  }

  /** Current number of active ether text instances (set by EtherText system). */
  setActiveEtherCount(n: number): void {
    this._activeEtherCount = n;
  }

  getActiveEtherCount(): number {
    return this._activeEtherCount;
  }

  /** Median frame time in ms (for before/after optimization comparison). */
  getFrameTimeMs(): number {
    if (this.frameTimes.length === 0) return 1000 / 60;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianFps =
      sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
    return 1000 / medianFps;
  }

  getSnapshot(): PerformanceSnapshot {
    const fps =
      this.frameTimes.length === 0
        ? 60
        : this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const ping_ms = this._ping_ms;

    const netScore = clamp(1 - ping_ms / BASELINE_PING, 0, 1);
    const fpsScore = clamp((fps - FPS_MIN) / FPS_MIN, 0, 1);
    const budgetScore = BUDGET_FPS_WEIGHT * fpsScore + BUDGET_NET_WEIGHT * netScore;
    const etherCap = Math.round(lerp(ETHER_CAP_MIN, ETHER_CAP_MAX, budgetScore));
    const spawnProbability = lerp(SPAWN_PROB_MIN, SPAWN_PROB_MAX, budgetScore);

    return {
      fps,
      ping_ms,
      netScore,
      fpsScore,
      budgetScore,
      etherCap,
      spawnProbability,
    };
  }

  /** Whether we are allowed to spawn one more ether (under cap). */
  canSpawnEther(): boolean {
    const { etherCap } = this.getSnapshot();
    return this._activeEtherCount < etherCap;
  }
}

export const PerformanceMonitor = new PerformanceMonitorClass();
