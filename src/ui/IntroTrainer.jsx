"use client";

import React, { useState, useCallback } from "react";
import BondSelection from "./BondSelection";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import { generateIdentity, setIdentity } from "@/src/systems/creature/identityGenerator";

const LINES = [
  "Bazaar doesn't remember faces.",
  "You'll need a bond.",
];

const STYLES = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 96,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.55)",
  },
  panel: {
    maxWidth: 420,
    padding: "28px 32px",
    background: "rgba(22, 20, 18, 0.97)",
    border: "1px solid #4a4238",
    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
    color: "#d8ccbc",
    fontFamily: "monospace",
  },
  label: {
    fontSize: "10px",
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: "#8b7355",
    marginBottom: "12px",
  },
  line: {
    fontSize: "15px",
    lineHeight: 1.55,
    marginBottom: "16px",
  },
  button: {
    padding: "10px 20px",
    border: "1px solid #5c5044",
    background: "rgba(40, 36, 32, 0.9)",
    color: "#e0d4c4",
    fontSize: "11px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    cursor: "pointer",
    marginTop: "8px",
  },
};

export default function IntroTrainer({ visible, onComplete }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [showBondSelection, setShowBondSelection] = useState(false);

  const { setBondCapsule } = useInventory();

  const advance = useCallback(() => {
    if (lineIndex < LINES.length - 1) {
      setLineIndex((i) => i + 1);
    } else {
      setShowBondSelection(true);
    }
  }, [lineIndex]);

  /** Birth moment: after name confirm we randomize morphology (seed from name+time), persist, add to bond slot. */
  const handleBondComplete = useCallback(
    async ({ gender, type, name: chosenName }) => {
      if (!type || !gender || !chosenName?.trim()) return;
      const creatureId = `exo-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const ts = Date.now();
      const seedStr = `${chosenName.trim()}-${ts}`;
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
            name: chosenName.trim(),
            gender,
            type,
            morphology_seed,
            head_type: identity.head_type,
            body_type: identity.body_type,
            tail_type: identity.tail_type,
            color_profile: identity.color_profile,
          }),
        });
      } catch (_) {}
      setBondCapsule({
        id: creatureId,
        type: "capsule",
        variant: type,
        gender,
      });
      setShowBondSelection(false);
      onComplete && onComplete();
    },
    [setBondCapsule, onComplete]
  );

  if (!visible) return null;

  if (showBondSelection) {
    return (
      <BondSelection
        onDeploy={handleBondComplete}
        onCancel={undefined}
      />
    );
  }

  return (
    <div style={STYLES.overlay}>
      <div style={STYLES.panel}>
        <div style={STYLES.label}>Trainer</div>
        <p style={STYLES.line}>{LINES[lineIndex]}</p>
        <button type="button" style={STYLES.button} onClick={advance}>
          {lineIndex < LINES.length - 1 ? "Next" : "Choose bond"}
        </button>
      </div>
    </div>
  );
}
