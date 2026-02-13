/**
 * Deterministic robot battle resolution. No RNG loot.
 */

export interface RobotStats {
  strike: number;
  block: number;
  dodge: number;
  stamina: number;
  tactics: number;
  temper: number;
  hp: number;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export interface TurnResult {
  attackerId: string;
  defenderId: string;
  hit: boolean;
  blocked: boolean;
  damage: number;
  defenderHp: number;
  attackerStamina: number;
  defenderStamina: number;
  logLine: string;
}

export function resolveTurn(
  attackerId: string,
  defenderId: string,
  attacker: RobotStats,
  defender: RobotStats
): TurnResult {
  const pHit = sigmoid((attacker.strike - defender.dodge) / 18);
  const hit = Math.random() < pHit;
  let damage = 0;
  let blockReduction = 0;

  if (hit) {
    const pBlock = sigmoid((defender.block - attacker.strike) / 22);
    const blocked = Math.random() < pBlock;
    blockReduction = blocked ? 0.5 : 0;
    damage =
      lerp(6, 14, attacker.strike / 100) *
      lerp(0.65, 1, attacker.stamina / 100) *
      (1 - blockReduction);
  }

  const staminaCost = 4;
  const newDefenderHp = Math.max(0, defender.hp - damage);
  const newAttackerStamina = Math.max(0, attacker.stamina - staminaCost);
  const newDefenderStamina = defender.stamina;

  const logLine = hit
    ? damage > 0
      ? `${attackerId} hits ${defenderId} for ${damage.toFixed(1)} damage.`
      : `${attackerId} hit blocked by ${defenderId}.`
    : `${attackerId} missed ${defenderId}.`;

  return {
    attackerId,
    defenderId,
    hit,
    blocked: hit && blockReduction > 0,
    damage,
    defenderHp: newDefenderHp,
    attackerStamina: newAttackerStamina,
    defenderStamina: newDefenderStamina,
    logLine,
  };
}

export function createDefaultRobotStats(overrides?: Partial<RobotStats>): RobotStats {
  return {
    strike: 50,
    block: 40,
    dodge: 45,
    stamina: 100,
    tactics: 50,
    temper: 50,
    hp: 100,
    ...overrides,
  };
}

/** EARE combat calibration: bias multipliers (e.g. 0.8–1.2). Scale base stats for emergent role/neuro state. */
export interface CombatCalibrationBias {
  strikeBias: number;
  blockBias: number;
  dodgeBias: number;
  staminaBias: number;
  tacticsBias: number;
  temperBias: number;
}

function clampStat(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function applyCalibration(
  base: RobotStats,
  cal: CombatCalibrationBias
): RobotStats {
  const s = (v: number, bias: number, lo: number, hi: number) =>
    clampStat(v * (bias ?? 1), lo, hi);
  return {
    strike: s(base.strike, cal.strikeBias, 25, 75),
    block: s(base.block, cal.blockBias, 25, 65),
    dodge: s(base.dodge, cal.dodgeBias, 25, 70),
    stamina: clampStat(base.stamina * (cal.staminaBias ?? 1), 80, 100),
    tactics: s(base.tactics, cal.tacticsBias, 30, 70),
    temper: s(base.temper, cal.temperBias, 30, 70),
    hp: base.hp,
  };
}
