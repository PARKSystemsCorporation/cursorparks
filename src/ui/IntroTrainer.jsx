"use client";

import React, { useState, useCallback } from "react";
import BondSelection from "./BondSelection";

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

  const advance = useCallback(() => {
    if (lineIndex < LINES.length - 1) {
      setLineIndex((i) => i + 1);
    } else {
      setShowBondSelection(true);
    }
  }, [lineIndex]);

  const handleBondComplete = useCallback(() => {
    setShowBondSelection(false);
    onComplete && onComplete();
  }, [onComplete]);

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
