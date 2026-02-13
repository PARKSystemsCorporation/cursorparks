"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSceneState } from "@/src/modules/world/SceneStateContext";
import { useRobot } from "@/src/modules/robot/RobotContext";
import {
  resolveTurn,
  createDefaultRobotStats,
  applyCalibration,
  type RobotStats,
  type TurnResult,
} from "./combatResolver";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.92)",
  border: "#8b6914",
  text: "#e8d5b7",
  accent: "#ff6b1a",
};

export function ArenaUI() {
  const { sceneMode, setSceneMode } = useSceneState();
  const { getCombatCalibration, recordEvent } = useRobot();
  const [robotA, setRobotA] = useState<RobotStats | null>(null);
  const [robotB, setRobotB] = useState<RobotStats>(() => createDefaultRobotStats({ block: 48 }));
  const [log, setLog] = useState<string[]>([]);
  const [attacker, setAttacker] = useState<"A" | "B">("A");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const arenaInitRef = useRef(false);

  useEffect(() => {
    if (sceneMode !== "in_arena") {
      arenaInitRef.current = false;
      return;
    }
    if (!arenaInitRef.current) {
      arenaInitRef.current = true;
      const cal = getCombatCalibration();
      setRobotA(applyCalibration(createDefaultRobotStats({ strike: 55 }), cal));
      setRobotB(createDefaultRobotStats({ block: 48 }));
      setLog([]);
      setAttacker("A");
      recordEvent("combat_engage", 0.5);
    }
  }, [sceneMode, getCombatCalibration, recordEvent]);

  const doTurn = useCallback(() => {
    if (robotA == null || robotA.hp <= 0 || robotB.hp <= 0) return;
    const result: TurnResult =
      attacker === "A"
        ? resolveTurn("Robot A", "Robot B", robotA, robotB)
        : resolveTurn("Robot B", "Robot A", robotB, robotA);
    setLog((prev) => [...prev.slice(-19), result.logLine]);
    if (result.defenderHp <= 0) {
      if (result.defenderId === "Robot B") recordEvent("combat_win", 1);
      else recordEvent("combat_loss", 1);
    }
    if (attacker === "A") {
      setRobotA((prev) => (prev ? { ...prev, stamina: result.attackerStamina } : prev));
      setRobotB((prev) => ({ ...prev, hp: result.defenderHp }));
    } else {
      setRobotB((prev) => ({ ...prev, stamina: result.attackerStamina }));
      setRobotA((prev) => (prev ? { ...prev, hp: result.defenderHp } : prev));
    }
    setAttacker((prev) => (prev === "A" ? "B" : "A"));
  }, [attacker, robotA, robotB, recordEvent]);

  useEffect(() => {
    if (sceneMode !== "in_arena") return;
    tickRef.current = setInterval(doTurn, 1200);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [sceneMode, doTurn]);

  if (sceneMode !== "in_arena") return null;
  if (robotA == null) return null;

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
        <span style={{ color: COLORS.accent, fontWeight: "bold" }}>ARENA</span>
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
          <div style={{ fontSize: 11, color: "#8b6914", marginBottom: 4 }}>Robot A</div>
          <div style={{ height: 8, background: "#1a1410", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(robotA.hp / 100) * 100}%`, background: "#c0392b", transition: "width 0.2s" }} />
          </div>
          <div style={{ fontSize: 10, color: COLORS.text, marginTop: 2 }}>HP {robotA.hp.toFixed(0)}</div>
          <div style={{ height: 4, background: "#1a1410", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
            <div style={{ height: "100%", width: `${robotA.stamina}%`, background: "#ff6b1a", transition: "width 0.2s" }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#8b6914", marginBottom: 4 }}>Robot B</div>
          <div style={{ height: 8, background: "#1a1410", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(robotB.hp / 100) * 100}%`, background: "#c0392b", transition: "width 0.2s" }} />
          </div>
          <div style={{ fontSize: 10, color: COLORS.text, marginTop: 2 }}>HP {robotB.hp.toFixed(0)}</div>
          <div style={{ height: 4, background: "#1a1410", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
            <div style={{ height: "100%", width: `${robotB.stamina}%`, background: "#ff6b1a", transition: "width 0.2s" }} />
          </div>
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
