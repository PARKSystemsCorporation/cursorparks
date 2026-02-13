"use client";

import React, { useState, useCallback } from "react";

const COLORS = {
  bg: "rgba(10, 8, 6, 0.96)",
  border: "#8b6914",
  text: "#e8d5b7",
  accent: "#ff6b1a",
  inputBg: "rgba(26, 20, 16, 0.9)",
};

type ExokinNamingScreenProps = {
  type: string;
  creatureId: string;
  position: { x: number; y: number; z: number } | null;
  /** Pre-selected from bond selection (MALE / FEMALE step). */
  initialGender?: "male" | "female" | null;
  onSubmit: (data: { name: string; gender: "male" | "female" }) => void;
};

export function ExokinNamingScreen({ type, creatureId, position, initialGender, onSubmit }: ExokinNamingScreenProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">(initialGender === "female" ? "female" : "male");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) return;
      setSubmitting(true);
      onSubmit({ name: trimmed, gender });
    },
    [name, gender, onSubmit]
  );

  const displayType = type === "warform" ? "Warform" : "Companion";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at center, rgba(26, 22, 16, 0.97) 0%, rgba(10, 8, 6, 0.99) 100%)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          border: `2px solid ${COLORS.border}`,
          borderRadius: 12,
          background: COLORS.bg,
          boxShadow: `0 0 40px rgba(139, 105, 20, 0.2), inset 0 1px 0 rgba(255,255,255,0.04)`,
          overflow: "hidden",
        }}
      >
        {/* Up-close creature preview */}
        <div
          style={{
            padding: "32px 24px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "linear-gradient(180deg, rgba(139, 105, 20, 0.08) 0%, transparent 60%)",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: `3px solid ${COLORS.border}`,
              background: `linear-gradient(145deg, rgba(40, 32, 24, 0.9), rgba(20, 16, 12, 0.95))`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            <span style={{ fontSize: 56, color: COLORS.accent, filter: "drop-shadow(0 0 8px rgba(255,107,26,0.4))" }}>
              ◆
            </span>
          </div>
          <p style={{ marginTop: 16, marginBottom: 0, fontSize: 12, color: COLORS.text, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.15em" }}>
            New {displayType}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 700, color: COLORS.text, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Name your EXOKIN
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name..."
            maxLength={32}
            autoFocus
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              marginBottom: 20,
              background: COLORS.inputBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              color: COLORS.text,
              fontSize: 16,
              fontFamily: "inherit",
            }}
          />

          <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 700, color: COLORS.text, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Gender
          </label>
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            {(["male", "female"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  background: gender === g ? "rgba(139, 105, 20, 0.35)" : COLORS.inputBg,
                  border: `1px solid ${gender === g ? COLORS.accent : COLORS.border}`,
                  borderRadius: 6,
                  color: COLORS.text,
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  cursor: "pointer",
                }}
              >
                {g}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!name.trim() || submitting}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: name.trim() && !submitting ? COLORS.accent : "rgba(255,107,26,0.3)",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              color: name.trim() && !submitting ? "#0a0806" : COLORS.text,
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: name.trim() && !submitting ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
