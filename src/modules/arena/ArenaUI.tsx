"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSceneState } from "@/src/modules/world/SceneStateContext";
import { useRobot } from "@/src/modules/robot/RobotContext";
import { useCombat } from "@/src/modules/combat/CombatContext";
import { CombatEvent } from "@/src/modules/combat/CombatTypes";
import { MOVE_DATABASE } from "@/src/modules/combat/SkillTreeData";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.92)",
  border: "#8b6914",
  text: "#e8d5b7",
  accent: "#ff6b1a",
};

export function ArenaUI() {
  const { sceneMode, setSceneMode } = useSceneState();
  const { recordEvent } = useRobot();
  const engine = useCombat();

  const [hpA, setHpA] = useState(100);
  const [maxHpA, setMaxHpA] = useState(100);
  const [hpB, setHpB] = useState(100);
  const [maxHpB, setMaxHpB] = useState(100);

  const [log, setLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (sceneMode !== "in_arena") return;

    // Init state from engine
    const fA = engine.getFighter("A");
    const fB = engine.getFighter("B");
    if (fA) { setHpA(fA.stats.hp); setMaxHpA(fA.stats.maxHp); }
    if (fB) { setHpB(fB.stats.hp); setMaxHpB(fB.stats.maxHp); }
    setWinner(null);
    setLog([]);

    // Subscribe to events
    const unsub = engine.subscribe((e: CombatEvent) => {
      const source = engine.getFighter(e.sourceId)?.name || e.sourceId;
      const target = engine.getFighter(e.targetId)?.name || e.targetId;

      if (e.type === "HIT" || e.type === "CRIT") {
        const isCrit = e.type === "CRIT";
        const moveName = e.moveType ? MOVE_DATABASE[e.moveType].name : "Attack";

        let msg = `${source} used ${moveName} on ${target} for ${e.damage?.toFixed(0)}`;
        if (isCrit) msg += " (CRITICAL!)";
        if (e.comboCount && e.comboCount > 1) msg += ` [${e.comboCount}x COMBO]`;

        setLog(prev => [...prev.slice(-19), msg]);

        // Flash effect for Crit
        if (isCrit) {
          const flash = document.createElement("div");
          flash.style.position = "fixed";
          flash.style.inset = "0";
          flash.style.background = "white";
          flash.style.opacity = "0.3";
          flash.style.pointerEvents = "none";
          flash.style.zIndex = "999";
          document.body.appendChild(flash);
          setTimeout(() => flash.remove(), 100);
        }
      } else if (e.type === "DODGE") {
        setLog(prev => [...prev.slice(-19), `${target} dodged ${source}`]);
      } else if (e.type === "KO") {
        setLog(prev => [...prev.slice(-19), `${target} was KO'd!`]);
        const winId = e.targetId === "A" ? "B" : "A";
        setWinner(winId);
        if (winId === "A") recordEvent("combat_win", 1);
        else recordEvent("combat_loss", 1);
      }

      // Update HPs
      const currentFA = engine.getFighter("A");
      const currentFB = engine.getFighter("B");
      if (currentFA) setHpA(currentFA.stats.hp);
      if (currentFB) setHpB(currentFB.stats.hp);
    });

    return unsub;
  }, [sceneMode, engine, recordEvent]);

  if (sceneMode !== "in_arena") return null;

  const leave = () => setSceneMode("idle");

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(480px, 96vw)",
        background: COLORS.bg,
        border: `2px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 16,
        zIndex: 20,
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: COLORS.accent, fontWeight: "bold" }}>ARENA {winner ? `- WINNER: ${winner === "A" ? "UNIT-ALPHA" : "UNIT-OMEGA"}` : ""}</span>
        <button
          type="button"
          onClick={leave}
          style={{
            padding: "6px 12px",
            background: "transparent",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 4,
            color: COLORS.text,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Leave
        </button>
      </div>
      <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#8b6914", marginBottom: 4 }}>Unit-Alpha</div>
          <div style={{ height: 8, background: "#1a1410", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(hpA / maxHpA) * 100}%`, background: "#00ffff", transition: "width 0.2s" }} />
          </div>
          <div style={{ fontSize: 10, color: COLORS.text, marginTop: 2 }}>HP {hpA.toFixed(0)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#8b6914", marginBottom: 4 }}>Unit-Omega</div>
          <div style={{ height: 8, background: "#1a1410", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(hpB / maxHpB) * 100}%`, background: "#ff0044", transition: "width 0.2s" }} />
          </div>
          <div style={{ fontSize: 10, color: COLORS.text, marginTop: 2 }}>HP {hpB.toFixed(0)}</div>
        </div>
      </div>
      <div style={{ maxHeight: 120, overflowY: "auto", fontSize: 11, color: COLORS.text, fontFamily: "monospace" }}>
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
