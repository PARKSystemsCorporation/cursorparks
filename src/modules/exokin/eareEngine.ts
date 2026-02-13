/**
 * EXOKIN Autonomous Regulation Engine (EARE).
 * Self-regulating, autonomous system layer: observe → evaluate → adjust → stabilize.
 * Role emerges; neurochemistry is a feedback economy; no manual stat tuning.
 */

import type {
  PhysicalLayer,
  VisualLayer,
  BehavioralLayer,
  NeurochemLayer,
  CombatCalibration,
  EAREChatContext,
  EAREEventType,
} from "./types";

const CLAMP = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const BASELINE = 0.5;
const NEURO_DECAY_RATE = 0.015;
const ROLE_DRIFT_RATE = 0.008;
const CALIBRATION_DRIFT_RATE = 0.012;

/** Default neuro state — all at baseline. */
function defaultNeuro(): NeurochemLayer {
  return {
    aggression: BASELINE,
    bonding: BASELINE,
    alertness: BASELINE,
    curiosity: BASELINE,
    territoriality: BASELINE,
    playDrive: BASELINE,
  };
}

/** Default combat calibration — neutral multipliers. */
function defaultCalibration(): CombatCalibration {
  return {
    strikeBias: 1,
    blockBias: 1,
    dodgeBias: 1,
    staminaBias: 1,
    tacticsBias: 1,
    temperBias: 1,
  };
}

/** Lifetime / long-term evolution metrics. */
export interface LifetimeMetrics {
  combatExposure: number;
  socialInteraction: number;
  ownerDependency: number;
  environmentalStress: number;
}

export interface EAREState {
  neuro: NeurochemLayer;
  roleDrift: number;
  calibration: CombatCalibration;
  lifetime: LifetimeMetrics;
  /** Rolling windows for behavioral observation */
  recentCombatWins: number;
  recentCombatLosses: number;
  recentChatTurns: number;
  recentProximityTime: number;
  lastObservedBehavioral: BehavioralLayer;
}

export interface EAREOptions {
  /** Physical/visual baselines (from identity); can be set once or updated. */
  physicalBaseline?: PhysicalLayer;
  visualBaseline?: VisualLayer;
}

export class EAREEngine {
  private neuro: NeurochemLayer = defaultNeuro();
  private roleDrift: number = 0;
  private calibration: CombatCalibration = defaultCalibration();
  private lifetime: LifetimeMetrics = {
    combatExposure: 0,
    socialInteraction: 0,
    ownerDependency: 0,
    environmentalStress: 0,
  };
  private recentCombatWins = 0;
  private recentCombatLosses = 0;
  private recentChatTurns = 0;
  private recentProximityTime = 0;
  private readonly windowDecay = 0.992;
  private lastBehavioral: BehavioralLayer = {};
  private physicalBaseline: PhysicalLayer = {};
  private visualBaseline: VisualLayer = {};

  constructor(opts: EAREOptions = {}) {
    if (opts.physicalBaseline) this.physicalBaseline = { ...opts.physicalBaseline };
    if (opts.visualBaseline) this.visualBaseline = { ...opts.visualBaseline };
  }

  /** Set baselines (e.g. when identity is loaded). Color/morphology are baselines only. */
  setBaselines(physical?: PhysicalLayer, visual?: VisualLayer): void {
    if (physical) this.physicalBaseline = { ...physical };
    if (visual) this.visualBaseline = { ...visual };
  }

  /** Record an event — drives stimulus → response → chemical shift → behavior. */
  recordEvent(type: EAREEventType, intensity: number = 1): void {
    const i = CLAMP(intensity, 0, 1);
    switch (type) {
      case "combat_win":
        this.recentCombatWins += 1;
        this.lifetime.combatExposure += 0.1;
        this.neuro.aggression = CLAMP(this.neuro.aggression + 0.06 * i, 0, 1);
        this.neuro.territoriality = CLAMP(this.neuro.territoriality + 0.04 * i, 0, 1);
        this.neuro.bonding = CLAMP(this.neuro.bonding - 0.02 * i, 0, 1);
        break;
      case "combat_loss":
        this.recentCombatLosses += 1;
        this.lifetime.combatExposure += 0.1;
        this.neuro.aggression = CLAMP(this.neuro.aggression - 0.08 * i, 0, 1);
        this.neuro.alertness = CLAMP(this.neuro.alertness + 0.05 * i, 0, 1);
        this.neuro.bonding = CLAMP(this.neuro.bonding + 0.06 * i, 0, 1);
        this.neuro.curiosity = CLAMP(this.neuro.curiosity + 0.03 * i, 0, 1);
        break;
      case "combat_engage":
        this.lifetime.combatExposure += 0.05;
        this.neuro.aggression = CLAMP(this.neuro.aggression + 0.04 * i, 0, 1);
        this.neuro.alertness = CLAMP(this.neuro.alertness + 0.06 * i, 0, 1);
        break;
      case "chat_social":
        this.recentChatTurns += 1;
        this.lifetime.socialInteraction += 0.1;
        this.neuro.bonding = CLAMP(this.neuro.bonding + 0.05 * i, 0, 1);
        this.neuro.playDrive = CLAMP(this.neuro.playDrive + 0.02 * i, 0, 1);
        break;
      case "chat_command":
        this.recentChatTurns += 1;
        this.neuro.alertness = CLAMP(this.neuro.alertness + 0.03 * i, 0, 1);
        break;
      case "proximity_high":
        this.recentProximityTime += 0.1;
        this.lifetime.ownerDependency = CLAMP(this.lifetime.ownerDependency + 0.02 * i, 0, 1);
        this.neuro.bonding = CLAMP(this.neuro.bonding + 0.02 * i, 0, 1);
        break;
      case "proximity_low":
        this.neuro.territoriality = CLAMP(this.neuro.territoriality + 0.02 * i, 0, 1);
        this.neuro.curiosity = CLAMP(this.neuro.curiosity + 0.03 * i, 0, 1);
        break;
      case "roam":
        this.neuro.curiosity = CLAMP(this.neuro.curiosity + 0.03 * i, 0, 1);
        this.neuro.territoriality = CLAMP(this.neuro.territoriality - 0.02 * i, 0, 1);
        break;
      case "praise":
        this.neuro.bonding = CLAMP(this.neuro.bonding + 0.08 * i, 0, 1);
        this.neuro.playDrive = CLAMP(this.neuro.playDrive + 0.04 * i, 0, 1);
        break;
      case "insult":
        this.neuro.aggression = CLAMP(this.neuro.aggression + 0.04 * i, 0, 1);
        this.neuro.bonding = CLAMP(this.neuro.bonding - 0.06 * i, 0, 1);
        this.lifetime.environmentalStress = CLAMP(this.lifetime.environmentalStress + 0.05 * i, 0, 1);
        break;
      case "calm":
        this.neuro.aggression = CLAMP(this.neuro.aggression - 0.04 * i, 0, 1);
        this.neuro.alertness = CLAMP(this.neuro.alertness - 0.02 * i, 0, 1);
        break;
      case "stress":
        this.lifetime.environmentalStress = CLAMP(this.lifetime.environmentalStress + 0.03 * i, 0, 1);
        this.neuro.alertness = CLAMP(this.neuro.alertness + 0.05 * i, 0, 1);
        break;
      case "play":
        this.neuro.playDrive = CLAMP(this.neuro.playDrive + 0.06 * i, 0, 1);
        this.neuro.bonding = CLAMP(this.neuro.bonding + 0.03 * i, 0, 1);
        break;
    }
  }

  /** Observe: update last behavioral snapshot from current state. */
  private observe(): void {
    const totalCombat = this.recentCombatWins + this.recentCombatLosses || 1;
    this.lastBehavioral = {
      combatFrequency: CLAMP(totalCombat * 0.2, 0, 1),
      chatFrequency: CLAMP(this.recentChatTurns * 0.05, 0, 1),
      combatWins: this.recentCombatWins,
      combatLosses: this.recentCombatLosses,
      proximityToUser: CLAMP(this.recentProximityTime * 0.1, 0, 1),
    };
  }

  /** Evaluate: detect imbalances (e.g. high aggression + many losses → need caution). */
  private evaluate(): {
    reduceAggression?: boolean;
    increaseCaution?: boolean;
    driftCompanion?: boolean;
    driftWarrior?: boolean;
    addFatigue?: boolean;
    addStimulation?: boolean;
    addUnpredictability?: boolean;
    addIndependence?: boolean;
  } {
    const out: ReturnType<EAREEngine["evaluate"]> = {};
    const n = this.neuro;
    const wins = this.recentCombatWins;
    const losses = this.recentCombatLosses;
    const totalCombat = wins + losses || 1;
    const winRate = wins / totalCombat;
    const socialHeavy = this.recentChatTurns > 5 && totalCombat < 2;
    const combatHeavy = totalCombat > 3 && this.recentChatTurns < 2;

    if (losses > wins && n.aggression > 0.55) {
      out.reduceAggression = true;
      out.increaseCaution = true;
    }
    if (socialHeavy && this.roleDrift > -0.7) out.driftCompanion = true;
    if (combatHeavy && winRate > 0.5 && this.roleDrift < 0.7) out.driftWarrior = true;
    if (n.aggression > 0.75) out.addFatigue = true;
    if (n.aggression < 0.25 && n.playDrive < 0.3) out.addStimulation = true;
    if (n.territoriality > 0.7 && n.aggression > 0.6) out.addUnpredictability = true;
    if (n.bonding > 0.75 && this.recentProximityTime > 2) out.addIndependence = true;

    return out;
  }

  /** Adjust: shift neuro, role drift, and combat calibration from evaluation. */
  private adjust(ev: ReturnType<EAREEngine["evaluate"]>): void {
    if (ev.reduceAggression) {
      this.neuro.aggression = CLAMP(this.neuro.aggression - 0.02, 0, 1);
      this.neuro.alertness = CLAMP(this.neuro.alertness + 0.015, 0, 1);
    }
    if (ev.increaseCaution) {
      this.calibration.strikeBias = CLAMP(this.calibration.strikeBias - 0.02, 0.6, 1.4);
      this.calibration.dodgeBias = CLAMP(this.calibration.dodgeBias + 0.02, 0.6, 1.4);
    }
    if (ev.driftCompanion) this.roleDrift = CLAMP(this.roleDrift - ROLE_DRIFT_RATE, -1, 1);
    if (ev.driftWarrior) this.roleDrift = CLAMP(this.roleDrift + ROLE_DRIFT_RATE, -1, 1);
    if (ev.addFatigue) {
      this.neuro.alertness = CLAMP(this.neuro.alertness - 0.02, 0, 1);
      this.neuro.aggression = CLAMP(this.neuro.aggression - 0.015, 0, 1);
    }
    if (ev.addStimulation) {
      this.neuro.curiosity = CLAMP(this.neuro.curiosity + 0.02, 0, 1);
      this.neuro.playDrive = CLAMP(this.neuro.playDrive + 0.02, 0, 1);
    }
    if (ev.addUnpredictability) {
      this.neuro.territoriality = CLAMP(this.neuro.territoriality - 0.015, 0, 1);
    }
    if (ev.addIndependence) {
      this.neuro.bonding = CLAMP(this.neuro.bonding - 0.01, 0, 1);
      this.neuro.curiosity = CLAMP(this.neuro.curiosity + 0.015, 0, 1);
    }
  }

  /** Stabilize: pull calibration and role toward sustainable ranges; decay rolling windows. */
  private stabilize(): void {
    this.roleDrift += (0 - this.roleDrift) * 0.002;
    this.calibration.strikeBias += (1 - this.calibration.strikeBias) * 0.01;
    this.calibration.blockBias += (1 - this.calibration.blockBias) * 0.01;
    this.calibration.dodgeBias += (1 - this.calibration.dodgeBias) * 0.01;
    this.calibration.staminaBias += (1 - this.calibration.staminaBias) * 0.01;
    this.calibration.tacticsBias += (1 - this.calibration.tacticsBias) * 0.01;
    this.calibration.temperBias += (1 - this.calibration.temperBias) * 0.01;
    this.recentCombatWins *= this.windowDecay;
    this.recentCombatLosses *= this.windowDecay;
    this.recentChatTurns *= this.windowDecay;
    this.recentProximityTime *= this.windowDecay;
  }

  /** Decay neuro toward baseline; then run observe → evaluate → adjust → stabilize. */
  tick(dt: number): void {
    const decay = 1 - Math.exp(-NEURO_DECAY_RATE * dt * 60);
    this.neuro.aggression += (BASELINE - this.neuro.aggression) * decay;
    this.neuro.bonding += (BASELINE - this.neuro.bonding) * decay;
    this.neuro.alertness += (BASELINE - this.neuro.alertness) * decay;
    this.neuro.curiosity += (BASELINE - this.neuro.curiosity) * decay;
    this.neuro.territoriality += (BASELINE - this.neuro.territoriality) * decay;
    this.neuro.playDrive += (BASELINE - this.neuro.playDrive) * decay;

    this.observe();
    const ev = this.evaluate();
    this.adjust(ev);
    this.stabilize();
  }

  /** Chat AI reads this: neuro levels, role drift, combat confidence, bonding. */
  getChatContext(): EAREChatContext {
    const n = this.neuro;
    const totalCombat = this.recentCombatWins + this.recentCombatLosses || 1;
    const winRate = totalCombat > 0 ? this.recentCombatWins / totalCombat : 0.5;
    const combatConfidence = CLAMP(
      winRate * 0.7 + n.aggression * 0.2 + (1 - n.bonding) * 0.1,
      0,
      1
    );
    const valence = CLAMP(n.bonding + n.playDrive - n.aggression * 0.5, 0, 1);
    const arousal = CLAMP(n.alertness + n.aggression * 0.5, 0, 1);
    const dominance = CLAMP(n.territoriality + n.aggression - n.bonding * 0.5, 0, 1);
    return {
      valence,
      arousal,
      dominance,
      roleDrift: this.roleDrift,
      combatConfidence,
      bondingState: n.bonding,
      neuro: { ...this.neuro },
    };
  }

  /** Combat resolver uses these to scale base stats. */
  getCombatCalibration(): CombatCalibration {
    const r = this.roleDrift;
    const n = this.neuro;
    const base = { ...this.calibration };
    base.strikeBias *= 0.85 + 0.15 * (r * 0.5 + 0.5) + 0.1 * n.aggression;
    base.blockBias *= 0.9 + 0.1 * (1 - r * 0.3) + 0.05 * n.alertness;
    base.dodgeBias *= 0.9 + 0.1 * n.alertness + 0.05 * (1 - n.territoriality);
    base.tacticsBias *= 0.9 + 0.1 * n.curiosity;
    base.temperBias *= 0.9 + 0.1 * n.aggression;
    return base;
  }

  getState(): EAREState {
    return {
      neuro: { ...this.neuro },
      roleDrift: this.roleDrift,
      calibration: { ...this.calibration },
      lifetime: { ...this.lifetime },
      recentCombatWins: this.recentCombatWins,
      recentCombatLosses: this.recentCombatLosses,
      recentChatTurns: this.recentChatTurns,
      recentProximityTime: this.recentProximityTime,
      lastObservedBehavioral: { ...this.lastBehavioral },
    };
  }

  serialize(): string {
    return JSON.stringify({
      neuro: this.neuro,
      roleDrift: this.roleDrift,
      calibration: this.calibration,
      lifetime: this.lifetime,
    });
  }

  deserialize(json: string): void {
    try {
      const o = JSON.parse(json) as {
        neuro?: NeurochemLayer;
        roleDrift?: number;
        calibration?: CombatCalibration;
        lifetime?: LifetimeMetrics;
      };
      if (o.neuro) this.neuro = { ...defaultNeuro(), ...o.neuro };
      if (typeof o.roleDrift === "number") this.roleDrift = CLAMP(o.roleDrift, -1, 1);
      if (o.calibration) this.calibration = { ...defaultCalibration(), ...o.calibration };
      if (o.lifetime) this.lifetime = { ...this.lifetime, ...o.lifetime };
    } catch {
      // ignore
    }
  }
}
