"use client";

import React, { useState, useEffect } from "react";
import { usePerformance } from "@/src/modules/performance";
import { useRobot } from "@/src/modules/robot/RobotContext";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.9)",
  border: "#8b6914",
  text: "#e8d5b7",
};

export function DebugOverlay() {
  const [open, setOpen] = useState(false);
  const { snapshot, activeEtherCount } = usePerformance();
  const { getMood } = useRobot();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  const mood = getMood();

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        padding: "10px 14px",
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 6,
        fontFamily: "monospace",
        fontSize: 11,
        color: COLORS.text,
        zIndex: 100,
        lineHeight: 1.5,
      }}
    >
      <div style={{ marginBottom: 6, color: "#ff6b1a" }}>DEBUG</div>
      <div>fps {snapshot.fps.toFixed(1)}</div>
      <div>ping {snapshot.ping_ms} ms</div>
      <div>budgetScore {snapshot.budgetScore.toFixed(2)}</div>
      <div>etherCap {snapshot.etherCap}</div>
      <div>activeEther {activeEtherCount}</div>
      <div style={{ marginTop: 8, borderTop: `1px solid ${COLORS.border}`, paddingTop: 6 }}>
        <div>mood V {mood.valence.toFixed(2)} A {mood.arousal.toFixed(2)} D {mood.dominance.toFixed(2)}</div>
      </div>
    </div>
  );
}
