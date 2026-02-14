"use client";

import React, { useState, useCallback } from "react";

const textStyle = {
  fontFamily: "monospace",
  fontSize: "clamp(12px, 2.2vw, 14px)",
  color: "rgba(232, 213, 183, 0.9)",
};
const choiceRow = {
  display: "flex",
  gap: 10,
  marginTop: 8,
};
const choice = (active) => ({
  padding: "4px 10px",
  border: "1px solid " + (active ? "rgba(255, 107, 26, 0.6)" : "rgba(139, 105, 20, 0.4)"),
  background: active ? "rgba(255, 107, 26, 0.15)" : "transparent",
  color: active ? "#e8d5b7" : "rgba(232, 213, 183, 0.7)",
  fontSize: 11,
  fontFamily: "monospace",
  letterSpacing: "0.08em",
  cursor: "pointer",
});

/** First popup: gender + EXOKIN type only. Randomizer/spawn starts on confirm. */
export default function BondSelection({ onDeploy, onCancel }) {
  const [gender, setGender] = useState("male");
  const [selectedType, setSelectedType] = useState("companion");

  const handleConfirm = useCallback(() => {
    onDeploy && onDeploy({ gender, type: selectedType });
  }, [gender, selectedType, onDeploy]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "clamp(24px, 6vw, 48px)",
        left: "clamp(24px, 6vw, 48px)",
        zIndex: 97,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <span style={textStyle}>Select gender + EXOKIN type</span>
      <div style={choiceRow}>
        {["male", "female"].map((g) => (
          <button
            key={g}
            type="button"
            style={choice(gender === g)}
            onClick={() => setGender(g)}
          >
            {g === "male" ? "Male" : "Female"}
          </button>
        ))}
      </div>
      <div style={choiceRow}>
        {["companion", "warform"].map((t) => (
          <button
            key={t}
            type="button"
            style={choice(selectedType === t)}
            onClick={() => setSelectedType(t)}
          >
            {t === "companion" ? "Companion" : "Warrior"}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleConfirm}
        style={{
          ...choice(true),
          marginTop: 10,
        }}
      >
        Start
      </button>
    </div>
  );
}
