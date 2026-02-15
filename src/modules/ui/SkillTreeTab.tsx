"use client";

import React from "react";
import { MOVE_DATABASE } from "@/src/modules/combat/SkillTreeData";
import { MoveType } from "@/src/modules/combat/CombatTypes";
import { useCombat } from "@/src/modules/combat/CombatContext";

const COLORS = {
    bg: "rgba(26, 20, 16, 0.96)",
    surface: "#2a1f15",
    text: "#e8d5b7",
    accent: "#ff6b1a",
    locked: "#555",
    unlocked: "#00aa00",
    border: "#8b6914",
    button: "#3a2f25"
};

export function SkillTreeTab() {
    const engine = useCombat();
    // We need to access the player's skills. 
    // In a real app, this might be stored in a separate persistent store (e.g. RobotContext/EARE).
    // For now, we read from the engine's fighter instance if it exists, or display global knowledge?
    // The implementation plan says "Wins" are currency. Wins are in EAREState typically.
    // But for this combat slice, we added 'wins' to RobotStats.
    // Let's assume we are viewing the Player's fighter ("A").

    const [fighter, setFighter] = React.useState(engine.getFighter("A"));

    // Poll for updates (Hack until we have better reactive state for stats)
    React.useEffect(() => {
        const id = setInterval(() => {
            setFighter({ ...engine.getFighter("A")! }); // Force update spread
        }, 1000);
        return () => clearInterval(id);
    }, [engine]);

    if (!fighter) return <div style={{ color: COLORS.text, padding: 20 }}>No Fighter Connected</div>;

    const { skills, stats } = fighter;
    const wins = stats.wins;

    const canUnlock = (cost: number) => wins >= cost; // Simple logic: Total wins >= cost? No, wins should be spent?
    // Use 'pointsAvailable' we added to skills.
    const points = skills.pointsAvailable;

    const handleUnlock = (moveType: MoveType) => {
        const move = MOVE_DATABASE[moveType];
        if (skills.unlockedMoves.includes(moveType)) return;

        if (points >= move.unlockCost) {
            // Mutate engine state directly (Proto-code style)
            const f = engine.getFighter("A");
            if (f) {
                f.skills.unlockedMoves.push(moveType);
                f.skills.pointsAvailable -= move.unlockCost;
                setFighter({ ...f });
            }
        }
    };

    return (
        <div style={{ padding: 16, color: COLORS.text, fontSize: 13 }}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: 16, color: COLORS.accent }}>Skill Tree</span>
                <span style={{ fontSize: 12, }}>Available Points: <span style={{ color: "#fff", fontWeight: "bold" }}>{points}</span></span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                {(Object.keys(MOVE_DATABASE) as MoveType[]).map((key) => {
                    const move = MOVE_DATABASE[key];
                    const isUnlocked = skills.unlockedMoves.includes(key);
                    const affordable = points >= move.unlockCost;

                    return (
                        <div key={key} style={{
                            position: "relative",
                            background: COLORS.surface,
                            border: `1px solid ${isUnlocked ? COLORS.unlocked : COLORS.border}`,
                            borderRadius: 6,
                            padding: 10,
                            opacity: isUnlocked ? 1 : 0.8
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontWeight: "bold", color: isUnlocked ? COLORS.unlocked : COLORS.text }}>{move.name}</span>
                                <span style={{ fontSize: 10, opacity: 0.7 }}>{move.type}</span>
                            </div>
                            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 8, height: 28, overflow: "hidden" }}>
                                {move.description}
                            </div>

                            <div style={{ fontSize: 10, marginBottom: 8 }}>
                                <div>DMG: {move.damageMult.toFixed(1)}x</div>
                                <div>CRIT: {(move.critChance * 100).toFixed(0)}%</div>
                                <div>SPD: {(move.speed * 100).toFixed(0)}</div>
                            </div>

                            {isUnlocked ? (
                                <div style={{
                                    textAlign: "center",
                                    background: "rgba(0,100,0,0.3)",
                                    padding: 4,
                                    borderRadius: 4,
                                    fontSize: 11,
                                    color: "#4f4"
                                }}>UNLOCKED</div>
                            ) : (
                                <button
                                    onClick={() => handleUnlock(key)}
                                    disabled={!affordable}
                                    style={{
                                        width: "100%",
                                        padding: "6px",
                                        background: affordable ? COLORS.button : "#222",
                                        border: `1px solid ${affordable ? COLORS.border : "#444"}`,
                                        color: affordable ? COLORS.accent : "#666",
                                        borderRadius: 4,
                                        cursor: affordable ? "pointer" : "not-allowed",
                                        fontSize: 11
                                    }}
                                >
                                    Unlock ({move.unlockCost} Pts)
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
