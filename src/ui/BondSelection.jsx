"use client";

import React, { useState, useCallback } from "react";

const COLORS = {
  bg: "rgba(14, 12, 10, 0.96)",
  border: "rgba(139, 105, 20, 0.5)",
  borderActive: "rgba(255, 107, 26, 0.6)",
  text: "#e8d5b7",
  muted: "rgba(232, 213, 183, 0.6)",
  accent: "#ff6b1a",
  accentBg: "rgba(255, 107, 26, 0.12)",
  cardBg: "rgba(20, 18, 16, 0.92)",
};

/** Panel card covering ~66% of the screen: gender + EXOKIN type selection. */
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
        inset: 0,
        zIndex: 97,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.4)",
      }}
    >
      <div
        style={{
          width: "min(66vw, 520px)",
          minHeight: "min(66vh, 420px)",
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255, 107, 26, 0.06)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px 16px",
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: COLORS.muted,
              marginBottom: 6,
            }}
          >
            First Bond
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.text,
              fontFamily: "monospace",
            }}
          >
            Create your EXOKIN
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Gender */}
          <div>
            <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>
              Gender
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {["male", "female"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: gender === g ? COLORS.accentBg : COLORS.cardBg,
                    border: `1px solid ${gender === g ? COLORS.borderActive : COLORS.border}`,
                    borderRadius: 4,
                    color: gender === g ? COLORS.text : COLORS.muted,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "monospace",
                    textTransform: "capitalize",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>
              Type
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { id: "companion", label: "Companion", sub: "Support unit" },
                { id: "warform", label: "Warrior", sub: "Combat frame" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  style={{
                    flex: 1,
                    padding: "14px 16px",
                    background: selectedType === t.id ? COLORS.accentBg : COLORS.cardBg,
                    border: `1px solid ${selectedType === t.id ? COLORS.borderActive : COLORS.border}`,
                    borderRadius: 4,
                    color: selectedType === t.id ? COLORS.text : COLORS.muted,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "monospace",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <div>{t.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2, opacity: 0.7 }}>{t.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px 20px", borderTop: `1px solid ${COLORS.border}` }}>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: COLORS.accent,
              border: "none",
              borderRadius: 4,
              color: "#0a0806",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
            }}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
