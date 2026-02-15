
import { MoveStats, MoveType } from "./CombatTypes";

export const MOVE_DATABASE: Record<MoveType, MoveStats> = {
    JAB: {
        name: "Jab",
        type: "JAB",
        damageMult: 0.6,
        accuracy: 0.95,
        speed: 0.9,
        critChance: 0.05,
        staminaCost: 5,
        cooldownVal: 0.8,
        description: "Fast, low damage strike. Sets up combos.",
        unlockCost: 0
    },
    CROSS: {
        name: "Cross",
        type: "CROSS",
        damageMult: 1.2,
        accuracy: 0.8,
        speed: 0.7,
        critChance: 0.1,
        staminaCost: 10,
        cooldownVal: 1.5,
        description: "Strong straight punch.",
        unlockCost: 1
    },
    HOOK: {
        name: "Hook",
        type: "HOOK",
        damageMult: 1.5,
        accuracy: 0.7,
        speed: 0.6,
        critChance: 0.2, // Higher knockback/stun chance
        staminaCost: 15,
        cooldownVal: 2.0,
        description: "Wide swing. High damage vs block.",
        unlockCost: 3
    },
    UPPERCUT: {
        name: "Uppercut",
        type: "UPPERCUT",
        damageMult: 2.0,
        accuracy: 0.6,
        speed: 0.5,
        critChance: 0.35, // High KO chance
        staminaCost: 20,
        cooldownVal: 3.0,
        description: "Upward strike. Huge KO potential.",
        unlockCost: 5
    },
    LOW_KICK: {
        name: "Low Kick",
        type: "LOW_KICK",
        damageMult: 0.8,
        accuracy: 0.9,
        speed: 0.8,
        critChance: 0.05,
        staminaCost: 8,
        cooldownVal: 1.2,
        description: "Leg strike. Lowers enemy speed.",
        unlockCost: 1
    },
    HIGH_KICK: {
        name: "High Kick",
        type: "HIGH_KICK",
        damageMult: 2.5,
        accuracy: 0.5,
        speed: 0.4,
        critChance: 0.5, // Flash KO king
        staminaCost: 25,
        cooldownVal: 4.0,
        description: "Risk it all. Instant KO possible.",
        unlockCost: 10
    },
    BLOCK: {
        name: "Block",
        type: "BLOCK",
        damageMult: 0,
        accuracy: 1,
        speed: 1,
        critChance: 0,
        staminaCost: 0,
        cooldownVal: 0,
        description: "Defensive stance.",
        unlockCost: 0
    }
};

export const INITIAL_SKILLS = {
    unlockedMoves: ["JAB", "CROSS", "BLOCK"] as MoveType[],
    mastery: { JAB: 1, CROSS: 1, BLOCK: 1, HOOK: 0, UPPERCUT: 0, LOW_KICK: 0, HIGH_KICK: 0 },
    pointsAvailable: 0
};
