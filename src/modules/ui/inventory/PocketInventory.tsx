"use client";

import React, { useCallback } from "react";
import type { InventoryItem, PocketId } from "./types";
import { POCKET_SLOTS } from "./types";

const COLORS = {
  bg: "#1a1410",
  surface: "#2a1f15",
  text: "#e8d5b7",
  accent: "#ff6b1a",
  leather: "#d4a574",
  border: "#8b6914",
};

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
      <div style={{ fontSize: 10, color: COLORS.leather, marginBottom: 4, textTransform: "uppercase" }}>
        {label}
      </div>
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
              {item ? (
                item.type === "capsule" ? (
                  <span style={{ color: COLORS.accent, fontSize: 18 }}>◆</span>
                ) : item.type === "token" ? (
                  <span style={{ color: COLORS.text, fontSize: 12 }}>{item.amount ?? 0}</span>
                ) : (
                  <span style={{ color: COLORS.leather, fontSize: 12 }}>•</span>
                )
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Quick bar: empty slots only. No EXOKIN icon, no deployment tools. Future reserved. */
function emptySlots(count: number): (InventoryItem | null)[] {
  return Array.from({ length: count }, () => null);
}

export function PocketInventory() {
  const handleThrowCapsule = useCallback((_pocket: PocketId, _slotIndex: number) => {}, []);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 12,
        alignItems: "flex-end",
        pointerEvents: "auto",
        zIndex: 10,
      }}
    >
      <Pocket
        id="pocketA"
        label="Quick"
        slots={POCKET_SLOTS.pocketA}
        items={emptySlots(POCKET_SLOTS.pocketA)}
        onThrowCapsule={handleThrowCapsule}
      />
      <Pocket
        id="pocketB"
        label="Wallet"
        slots={POCKET_SLOTS.pocketB}
        items={emptySlots(POCKET_SLOTS.pocketB)}
        onThrowCapsule={handleThrowCapsule}
      />
      <Pocket
        id="cargoC"
        label="Cargo C"
        slots={POCKET_SLOTS.cargoC}
        items={emptySlots(POCKET_SLOTS.cargoC)}
        onThrowCapsule={handleThrowCapsule}
      />
      <Pocket
        id="cargoD"
        label="Cargo D"
        slots={POCKET_SLOTS.cargoD}
        items={emptySlots(POCKET_SLOTS.cargoD)}
        onThrowCapsule={handleThrowCapsule}
      />
    </div>
  );
}
