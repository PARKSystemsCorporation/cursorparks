"use client";

import React, { useState, useCallback } from "react";
import Capsule from "./Capsule";

const STYLES = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 97,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.6)",
  },
  panel: {
    maxWidth: 480,
    width: "90%",
    padding: "32px 28px",
    background: "rgba(20, 18, 16, 0.98)",
    border: "1px solid #4a4238",
    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
    fontFamily: "monospace",
  },
  title: {
    fontSize: "10px",
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "#6b5d4d",
    marginBottom: "24px",
    textAlign: "center",
  },
  row: {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  col: {
    flex: "1 1 180px",
    minWidth: 0,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    marginBottom: 20,
    background: "rgba(26, 20, 16, 0.9)",
    border: "1px solid #4a4238",
    borderRadius: 4,
    color: "#e0d4c4",
    fontSize: 16,
    fontFamily: "inherit",
  },
  backBtn: {
    padding: "8px 16px",
    border: "1px solid #4a4238",
    background: "transparent",
    color: "#7a6e5e",
    fontSize: "10px",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    cursor: "pointer",
  },
};

/** Flow: Gender → Role (Warrior/Companion) → Name → Confirm. On confirm, onDeploy({ gender, type, name }) is called. */
export default function BondSelection({ onDeploy, onCancel }) {
  const [gender, setGender] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [name, setName] = useState("");

  const handleGenderPick = useCallback((g) => setGender(g), []);
  const handleTypePick = useCallback((type) => setSelectedType(type), []);

  const handleConfirm = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed || !gender || !selectedType) return;
    onDeploy && onDeploy({ gender, type: selectedType, name: trimmed });
  }, [name, gender, selectedType, onDeploy]);

  const handleBackFromType = useCallback(() => setGender(null), []);
  const handleBackFromName = useCallback(() => setSelectedType(null), []);

  // Step 2: Role (Warrior / Companion)
  if (gender && !selectedType) {
    return (
      <div style={STYLES.overlay}>
        <div style={STYLES.panel}>
          <div style={STYLES.title}>Select role</div>
          <div style={STYLES.row}>
            <div style={STYLES.col}>
              <Capsule
                label="WARRIOR"
                sublabel="Combat frame"
                type="warform"
                onDeploy={handleTypePick}
              />
            </div>
            <div style={STYLES.col}>
              <Capsule
                label="COMPANION"
                sublabel="Support unit"
                type="companion"
                onDeploy={handleTypePick}
              />
            </div>
          </div>
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button type="button" style={STYLES.backBtn} onClick={handleBackFromType}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Name + Confirm
  if (gender && selectedType) {
    return (
      <div style={STYLES.overlay}>
        <div style={STYLES.panel}>
          <div style={STYLES.title}>Name your EXOKIN</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name..."
            maxLength={32}
            autoFocus
            style={STYLES.input}
          />
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              style={{ ...STYLES.backBtn, marginTop: 0 }}
              onClick={handleBackFromName}
            >
              Back
            </button>
            <button
              type="button"
              disabled={!name.trim()}
              style={{
                padding: "10px 20px",
                border: "1px solid #8b6914",
                background: name.trim() ? "rgba(139, 105, 20, 0.4)" : "rgba(40, 36, 32, 0.9)",
                color: "#e0d4c4",
                fontSize: "11px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: name.trim() ? "pointer" : "not-allowed",
              }}
              onClick={handleConfirm}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Gender
  return (
    <div style={STYLES.overlay}>
      <div style={STYLES.panel}>
        <div style={STYLES.title}>Choose gender</div>
        <div style={STYLES.row}>
          <div style={STYLES.col}>
            <Capsule
              label="MALE"
              sublabel="Expression"
              type="male"
              onDeploy={() => handleGenderPick("male")}
            />
          </div>
          <div style={STYLES.col}>
            <Capsule
              label="FEMALE"
              sublabel="Expression"
              type="female"
              onDeploy={() => handleGenderPick("female")}
            />
          </div>
        </div>
        {onCancel && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button type="button" style={STYLES.backBtn} onClick={onCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
