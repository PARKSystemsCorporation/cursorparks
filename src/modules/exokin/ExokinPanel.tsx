"use client";

import React, { useEffect, useState } from "react";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import { useRobot } from "@/src/modules/robot/RobotContext";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.92)",
  border: "#8b6914",
  text: "#e8d5b7",
  accent: "#ff6b1a",
  muted: "rgba(232, 213, 183, 0.7)",
};

const PANEL_SIZE = 140;

function useCreatureName(creatureId: string | null) {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    if (!creatureId) {
      setName(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/exokin/creature?id=${encodeURIComponent(creatureId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.name) setName(data.name);
        else if (!cancelled) setName(null);
      })
      .catch(() => {
        if (!cancelled) setName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [creatureId]);
  return name;
}

export function ExokinPanel() {
  const { deployedRobots, bondCapsule, pocketA, pocketB, cargoC, cargoD } = useInventory();
  const robot = useRobot();
  const pockets = [pocketA, pocketB, cargoC, cargoD].flat();
  const firstCapsule = pockets.find((item) => item?.type === "capsule" && item?.id);
  const firstDeployed = deployedRobots[0];
  const activeCreatureId = firstDeployed?.creatureId ?? bondCapsule?.id ?? firstCapsule?.id ?? null;
  const inPocket = activeCreatureId && !deployedRobots.some((r) => r.creatureId === activeCreatureId);
  const name = useCreatureName(activeCreatureId);
  const chatContext = robot.getChatContext();

  if (!activeCreatureId) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 100,
        right: 16,
        width: PANEL_SIZE,
        minHeight: PANEL_SIZE,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        background: COLORS.bg,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        overflow: "hidden",
        zIndex: 25,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          padding: "8px 10px",
          borderBottom: `1px solid ${COLORS.border}`,
          fontSize: 10,
          fontWeight: 700,
          color: COLORS.accent,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {name || "EXOKIN"}
      </div>
      {!inPocket && (
        <div style={{ padding: "4px 10px", fontSize: 9, color: COLORS.muted, textTransform: "uppercase" }}>
          IN WORLD / ACTIVE
        </div>
      )}
      <div style={{ padding: 10 }}>
        {inPocket ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 80,
            }}
          >
            <span style={{ fontSize: 36, color: COLORS.accent }}>◆</span>
            <span style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>In pocket</span>
          </div>
        ) : (
          <div style={{ fontSize: 10, color: COLORS.text, lineHeight: 1.5 }}>
            <div style={{ marginBottom: 4, color: COLORS.muted }}>Emotional</div>
            <div>Aggr {Math.round(chatContext.neuro.aggression * 100)}%</div>
            <div>Bond {Math.round(chatContext.neuro.bonding * 100)}%</div>
            <div>Alert {Math.round(chatContext.neuro.alertness * 100)}%</div>
            <div>Curious {Math.round(chatContext.neuro.curiosity * 100)}%</div>
            <div>Play {Math.round(chatContext.neuro.playDrive * 100)}%</div>
            <div style={{ marginTop: 4, color: COLORS.muted }}>
              Role {chatContext.roleDrift < -0.3 ? "Companion" : chatContext.roleDrift > 0.3 ? "Warrior" : "—"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
