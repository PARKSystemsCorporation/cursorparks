"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useInventory } from "./inventory/InventoryContext";
import { useRobot } from "@/src/modules/robot/RobotContext";
import type { InventoryItem, PocketId } from "./inventory/types";
import { POCKET_SLOTS } from "./inventory/types";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.96)",
  surface: "#2a1f15",
  text: "#e8d5b7",
  accent: "#ff6b1a",
  leather: "#d4a574",
  border: "#8b6914",
};

type MenuTab = "backpack" | "stats";

function Pocket({
  id,
  label,
  slots,
  items,
  onThrowCapsule,
}: {
  id: PocketId;
  label: string;
  slots: number;
  items: (InventoryItem | null)[];
  onThrowCapsule: (pocket: PocketId, slotIndex: number) => void;
}) {
  const isWallet = id === "pocketB";
  const isCargo = id === "cargoC" || id === "cargoD";
  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${COLORS.surface} 0%, ${COLORS.bg} 100%)`,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 4,
        padding: "6px 10px",
        minWidth: isCargo ? 72 : 56,
        minHeight: isWallet ? 44 : 52,
        boxShadow: "inset 0 1px 0 rgba(212,165,116,0.15), 0 2px 4px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ fontSize: 10, color: COLORS.leather, marginBottom: 4, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {Array.from({ length: slots }).map((_, i) => {
          const item = items[i] ?? null;
          const isCapsule = item?.type === "capsule";
          return (
            <div
              key={i}
              style={{
                width: isWallet ? "100%" : 36,
                height: isWallet ? 28 : 36,
                background: item ? COLORS.surface : "rgba(0,0,0,0.2)",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isCapsule ? "grab" : "default",
                userSelect: "none",
              }}
              onMouseDown={(e) => {
                if (e.button !== 0 || !isCapsule) return;
                onThrowCapsule(id, i);
              }}
            >
              {item
                ? item.type === "capsule"
                  ? <span style={{ color: COLORS.accent, fontSize: 18 }}>◆</span>
                  : item.type === "token"
                    ? <span style={{ color: COLORS.text, fontSize: 12 }}>{item.amount ?? 0}</span>
                    : <span style={{ color: COLORS.leather, fontSize: 12 }}>•</span>
                : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BackpackTab() {
  const { pocketA, pocketB, cargoC, cargoD, startCapsuleThrow } = useInventory();
  const handleThrow = useCallback((pocket: PocketId, slotIndex: number) => {
    startCapsuleThrow(pocket, slotIndex);
  }, [startCapsuleThrow]);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: 12 }}>
      <Pocket id="pocketA" label="Quick" slots={POCKET_SLOTS.pocketA} items={pocketA} onThrowCapsule={handleThrow} />
      <Pocket id="pocketB" label="Wallet" slots={POCKET_SLOTS.pocketB} items={pocketB} onThrowCapsule={handleThrow} />
      <Pocket id="cargoC" label="Cargo C" slots={POCKET_SLOTS.cargoC} items={cargoC} onThrowCapsule={handleThrow} />
      <Pocket id="cargoD" label="Cargo D" slots={POCKET_SLOTS.cargoD} items={cargoD} onThrowCapsule={handleThrow} />
    </div>
  );
}

function levelFromWins(wins: number, losses: number): number {
  const total = wins + losses;
  return 1 + Math.floor(total / 5);
}

function ExokinStatsTab() {
  const { getEAREState, getChatContext, getCombatCalibration } = useRobot();
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const state = getEAREState();
  const ctx = getChatContext();
  const cal = getCombatCalibration();
  const level = levelFromWins(state.recentCombatWins, state.recentCombatLosses);
  const totalFights = state.recentCombatWins + state.recentCombatLosses;
  return (
    <div style={{ padding: 16, fontSize: 13, color: COLORS.text }}>
      <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ color: COLORS.accent, fontWeight: "bold", marginBottom: 4 }}>Level {level}</div>
        <div style={{ fontSize: 11, color: COLORS.leather }}>
          Fights: {state.recentCombatWins}W / {state.recentCombatLosses}L
          {totalFights > 0 && ` · Win rate ${((100 * state.recentCombatWins) / totalFights).toFixed(0)}%`}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: COLORS.leather, textTransform: "uppercase", marginBottom: 6 }}>Combat calibration</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11 }}>
          <span>Strike</span><span>{(cal.strikeBias * 100).toFixed(0)}%</span>
          <span>Block</span><span>{(cal.blockBias * 100).toFixed(0)}%</span>
          <span>Dodge</span><span>{(cal.dodgeBias * 100).toFixed(0)}%</span>
          <span>Stamina</span><span>{(cal.staminaBias * 100).toFixed(0)}%</span>
          <span>Tactics</span><span>{(cal.tacticsBias * 100).toFixed(0)}%</span>
          <span>Temper</span><span>{(cal.temperBias * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: COLORS.leather, textTransform: "uppercase", marginBottom: 6 }}>Mood / neuro</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11 }}>
          <span>Combat confidence</span><span>{(ctx.combatConfidence * 100).toFixed(0)}%</span>
          <span>Bonding</span><span>{(ctx.bondingState * 100).toFixed(0)}%</span>
          <span>Role drift</span><span>{(ctx.roleDrift * 100).toFixed(0)}%</span>
          <span>Aggression</span><span>{(ctx.neuro.aggression * 100).toFixed(0)}%</span>
          <span>Alertness</span><span>{(ctx.neuro.alertness * 100).toFixed(0)}%</span>
          <span>Curiosity</span><span>{(ctx.neuro.curiosity * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div style={{ fontSize: 10, color: COLORS.leather }}>
        Lifetime exposure: combat {(state.lifetime.combatExposure * 100).toFixed(0)}% · social {(state.lifetime.socialInteraction * 100).toFixed(0)}%
      </div>
    </div>
  );
}

export function BackpackMenu() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<MenuTab>("backpack");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setTab("backpack");
        } else {
          setTab((t) => (t === "backpack" ? "stats" : "backpack"));
        }
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        pointerEvents: "auto",
      }}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div
        style={{
          width: "min(420px, 92vw)",
          maxHeight: "85vh",
          background: COLORS.bg,
          border: `2px solid ${COLORS.border}`,
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={{
                padding: "6px 12px",
                background: tab === "backpack" ? COLORS.accent : "transparent",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 4,
                color: tab === "backpack" ? "#1a1410" : COLORS.text,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: tab === "backpack" ? "bold" : "normal",
              }}
              onClick={() => setTab("backpack")}
            >
              Backpack
            </button>
            <button
              type="button"
              style={{
                padding: "6px 12px",
                background: tab === "stats" ? COLORS.accent : "transparent",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 4,
                color: tab === "stats" ? "#1a1410" : COLORS.text,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: tab === "stats" ? "bold" : "normal",
              }}
              onClick={() => setTab("stats")}
            >
              Exokin Stats
            </button>
          </div>
          <button
            type="button"
            style={{
              padding: "4px 10px",
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 4,
              color: COLORS.text,
              cursor: "pointer",
              fontSize: 11,
            }}
            onClick={() => setOpen(false)}
          >
            Close (Esc)
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {tab === "backpack" && <BackpackTab />}
          {tab === "stats" && <ExokinStatsTab />}
        </div>
      </div>
    </div>
  );
}
