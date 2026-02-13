"use client";

import React from "react";
import { useTrainer } from "./TrainerContext";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.95)",
  border: "#8b6914",
  text: "#e8d5b7",
  accent: "#ff6b1a",
};

const trainingCapsule = { id: "cap-training-1", type: "capsule" as const, variant: "training" } as const;

export function TrainerOverlay() {
  const { step, completeAndGiveCapsule } = useTrainer();
  const { addItem } = useInventory();

  if (step !== 1) return null;

  const handleReceive = () => {
    addItem("pocketA", trainingCapsule);
    completeAndGiveCapsule();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          maxWidth: 400,
          padding: 24,
          background: COLORS.bg,
          border: `2px solid ${COLORS.border}`,
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ color: COLORS.accent, fontWeight: "bold", marginBottom: 12 }}>Trainer</div>
        <p style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
          Welcome to the bazaar. You&apos;re going to need a runner. Here&apos;s a training bot — throw the capsule on the ground to deploy. It&apos;ll follow you and you can talk to it.
        </p>
        <button
          type="button"
          onClick={handleReceive}
          style={{
            padding: "10px 20px",
            background: COLORS.accent,
            border: "none",
            borderRadius: 6,
            color: "#1a1410",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Take capsule
        </button>
      </div>
    </div>
  );
}
