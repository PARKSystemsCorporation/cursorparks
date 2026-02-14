"use client";

import React, { useState, useCallback } from "react";
import BondSelection from "./BondSelection";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import { generateIdentity, setIdentity } from "@/src/systems/creature/identityGenerator";

const LINES = [
  "Bazaar doesn't remember faces.",
  "You'll need a bond.",
];
const ONBOARDING_SPAWN_POS = { x: 1.0, y: 0, z: -10.8 };

/** Minimal intro: trainer text only. No panels, no UI clutter. Click to advance. */
export default function IntroTrainer({ visible, onComplete }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [showBond, setShowBond] = useState(false);
  const { setBondCapsule } = useInventory();

  const advance = useCallback(() => {
    if (lineIndex < LINES.length - 1) {
      setLineIndex((i) => i + 1);
    } else {
      setShowBond(true);
    }
  }, [lineIndex]);

  const handleBondComplete = useCallback(
    async ({ gender, type }) => {
      if (!type || !gender) return;
      if (gender !== "male" && gender !== "female") return;
      const creatureId = `exo-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const seedStr = `${type}-${gender}-${Date.now()}-${Math.random()}`;
      let morphology_seed = 0;
      for (let i = 0; i < seedStr.length; i++) morphology_seed = (morphology_seed << 5) - morphology_seed + seedStr.charCodeAt(i);
      morphology_seed = morphology_seed >>> 0;
      const identity = generateIdentity(type, morphology_seed, { gender });
      setIdentity(creatureId, identity);
      try {
        await fetch("/api/exokin/creature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatureId,
            gender,
            type,
            morphology_seed,
            head_type: identity.head_type,
            body_type: identity.body_type,
            tail_type: identity.tail_type,
            color_profile: identity.color_profile,
          }),
        });
      } catch {}
      setBondCapsule({
        id: creatureId,
        type: "capsule",
        variant: type,
        gender,
      });

      window.dispatchEvent(new CustomEvent("parks-onboarding-focus-start"));
      window.dispatchEvent(
        new CustomEvent("parks-spawn-creature", {
          detail: { type, creatureId, identity, position: ONBOARDING_SPAWN_POS },
        })
      );
      window.dispatchEvent(
        new CustomEvent("parks-onboarding-name-request", {
          detail: { creatureId, type, gender },
        })
      );
      setShowBond(false);
      onComplete && onComplete();
    },
    [setBondCapsule, onComplete]
  );

  if (!visible) return null;

  if (showBond) {
    return (
      <BondSelection
        onDeploy={handleBondComplete}
        onCancel={undefined}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={advance}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 96,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-start",
        padding: "clamp(20px, 5vw, 40px)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "monospace",
      }}
      aria-label="Next"
    >
      <span
        style={{
          fontSize: "clamp(13px, 2.5vw, 16px)",
          lineHeight: 1.5,
          color: "rgba(232, 213, 183, 0.88)",
          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          maxWidth: "min(320px, 85vw)",
        }}
      >
        {LINES[lineIndex]}
      </span>
    </button>
  );
}
