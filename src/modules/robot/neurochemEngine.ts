/**
 * Neurochem + mood model for robot companion.
 * Event-driven updates and decay toward baseline.
 */

const BASELINE = 0.5;
const DECAY_RATE = 0.02;

export type NeurochemState = {
  dopamine: number;
  serotonin: number;
  cortisol: number;
  oxytocin: number;
  noradrenaline: number;
  /** Trained by insult/failure */
  dominance: number;
};

export type MoodState = {
  valence: number;
  arousal: number;
  dominance: number;
};

export type EventType = "praise" | "insult" | "calm";

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

export class NeurochemEngine {
  private state: NeurochemState = {
    dopamine: BASELINE,
    serotonin: BASELINE,
    cortisol: BASELINE,
    oxytocin: BASELINE,
    noradrenaline: BASELINE,
    dominance: BASELINE,
  };

  applyEvent(type: EventType, intensity: number = 1): void {
    const i = clamp(intensity, 0, 1);
    switch (type) {
      case "praise":
        this.state.dopamine = clamp(this.state.dopamine + 0.08 * i, 0, 1);
        this.state.serotonin = clamp(this.state.serotonin + 0.04 * i, 0, 1);
        this.state.cortisol = clamp(this.state.cortisol - 0.05 * i, 0, 1);
        this.state.oxytocin = clamp(this.state.oxytocin + 0.06 * i, 0, 1);
        break;
      case "insult":
        this.state.cortisol = clamp(this.state.cortisol + 0.09 * i, 0, 1);
        this.state.serotonin = clamp(this.state.serotonin - 0.05 * i, 0, 1);
        this.state.dominance = clamp(this.state.dominance + 0.03 * i, 0, 1);
        break;
      case "calm":
        this.state.serotonin = clamp(this.state.serotonin + 0.03 * i, 0, 1);
        this.state.noradrenaline = clamp(this.state.noradrenaline - 0.03 * i, 0, 1);
        break;
    }
  }

  tick(dt: number): void {
    const decay = 1 - Math.exp(-DECAY_RATE * dt * 60);
    this.state.dopamine += (BASELINE - this.state.dopamine) * decay;
    this.state.serotonin += (BASELINE - this.state.serotonin) * decay;
    this.state.cortisol += (BASELINE - this.state.cortisol) * decay;
    this.state.oxytocin += (BASELINE - this.state.oxytocin) * decay;
    this.state.noradrenaline += (BASELINE - this.state.noradrenaline) * decay;
    this.state.dominance += (BASELINE - this.state.dominance) * decay;
  }

  getMood(): MoodState {
    const s = this.state;
    const valence = clamp(s.serotonin + s.dopamine - s.cortisol, 0, 1);
    const arousal = clamp(s.noradrenaline + s.cortisol, 0, 1);
    const dominance = clamp(s.dopamine - s.oxytocin + (s.dominance - BASELINE), 0, 1);
    return { valence, arousal, dominance };
  }

  getState(): NeurochemState {
    return { ...this.state };
  }

  serialize(): string {
    return JSON.stringify(this.state);
  }

  deserialize(json: string): void {
    try {
      const parsed = JSON.parse(json) as NeurochemState;
      this.state = { ...parsed };
    } catch {
      // ignore
    }
  }
}
