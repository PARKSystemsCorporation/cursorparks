"use client";

import React, { useState, useCallback } from "react";

const textStyle = {
  fontFamily: "monospace",
  fontSize: "clamp(12px, 2.2vw, 14px)",
  color: "rgba(232, 213, 183, 0.9)",
};
const inputStyle = {
  width: "min(200px, 60vw)",
  padding: "8px 12px",
  marginTop: 6,
  background: "rgba(20, 18, 16, 0.85)",
  border: "1px solid rgba(139, 105, 20, 0.5)",
  borderRadius: 2,
  color: "#e0d4c4",
  fontSize: 14,
  fontFamily: "monospace",
  outline: "none",
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

/** Minimal bond: one line, name input, type/gender choices, confirm. No floating cards or panels. */
export default function BondSelection({ onDeploy, onCancel }) {
  const [gender, setGender] = useState("male");
  const [selectedType, setSelectedType] = useState("companion");
  const [name, setName] = useState("");

  const handleConfirm = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onDeploy && onDeploy({ gender, type: selectedType, name: trimmed });
  }, [name, gender, selectedType, onDeploy]);

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
      <span style={textStyle}>Name your EXOKIN</span>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
        placeholder=""
        maxLength={32}
        autoFocus
        style={inputStyle}
      />
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
        disabled={!name.trim()}
        onClick={handleConfirm}
        style={{
          ...choice(name.trim()),
          marginTop: 10,
          opacity: name.trim() ? 1 : 0.5,
        }}
      >
        Confirm
      </button>
    </div>
  );
}
