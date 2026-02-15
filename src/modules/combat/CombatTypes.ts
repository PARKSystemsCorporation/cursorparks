import { ThreeEvent } from "@react-three/fiber";

// Advanced Combat Types

export type MoveType = "JAB" | "CROSS" | "HOOK" | "UPPERCUT" | "LOW_KICK" | "HIGH_KICK" | "BLOCK";

export interface MoveStats {
    name: string;
    type: MoveType;
    damageMult: number;     // Multiplier of base Attack
    accuracy: number;       // 0-1 (Hit chance modifier)
    speed: number;          // 0-1 (Faster = harder to dodge, less cooldown)
    critChance: number;     // 0-1 (Flash KO chance)
    staminaCost: number;
    cooldownVal: number;    // Base cooldown in seconds
    description: string;
    unlockCost: number;     // Wins required to unlock
}

export interface RobotSkills {
    unlockedMoves: MoveType[];
    mastery: Record<MoveType, number>; // Level 1-5, improves stats?
    pointsAvailable: number; // Wins converted to points
}

export interface RobotStats {
    hp: number;
    maxHp: number;
    energy: number;
    maxEnergy: number;
    attackPower: number;
    defense: number;
    speed: number;
    level: number;
    wins: number;
}

export type RobotState = "IDLE" | "MOVING" | "APPROACHING" | "ATTACKING" | "BLOCKING" | "HIT" | "KO" | "VICTORY";

export interface CombatEvent {
    type: "ATTACK" | "HIT" | "BLOCK" | "DODGE" | "CRIT" | "KO" | "COMBO";
    sourceId: string;
    targetId: string;
    moveType?: MoveType;
    damage?: number;
    comboCount?: number;
    position?: [number, number, number];
}

export interface RobotFighter {
    id: string;
    name: string;
    stats: RobotStats;
    skills: RobotSkills;
    position: [number, number, number];
    rotation: [number, number, number];
    state: RobotState;
    targetId: string | null;
    lastMove?: MoveType;
}
