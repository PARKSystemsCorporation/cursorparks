
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
    error: "#b85450",
};

export type FirstBondData = {
    name: string;
    gender: string;
    type: string;
    morphologySeed: string;
    neurochemistryBase: Record<string, number | string>;
};

export default function FirstBondPanel({ onComplete }: { onComplete: (data: FirstBondData) => void }) {
    const [name, setName] = useState("");
    const [gender, setGender] = useState("male");
    const [type, setType] = useState("companion");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInitialize = useCallback(async () => {
        if (!name.trim()) {
            setError("Identity designation required.");
            return;
        }
        setBusy(true);
        setError(null);

        try {
            const res = await fetch("/api/exokin/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), gender, type }),
            });

            if (!res.ok) {
                throw new Error("Initialization failed.");
            }

            const data = await res.json();
            onComplete(data);
        } catch (_) {
            setError("System error. Retry.");
            setBusy(false);
        }
    }, [name, gender, type, onComplete]);

    return (
        <div
            style={{
                position: "fixed",
                top: "50%",
                left: "40px",
                transform: "translateY(-50%)",
                width: "320px",
                padding: "24px",
                background: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "4px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
                zIndex: 200,
                fontFamily: "monospace",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
            }}
        >
            {/* Header */}
            <div>
                <div style={{ fontSize: "10px", color: COLORS.accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>
                    System Initialization
                </div>
                <div style={{ fontSize: "16px", color: COLORS.text, fontWeight: 700, letterSpacing: "0.05em" }}>
                    FIRST BOND
                </div>
            </div>

            {/* Name Input */}
            <div>
                <div style={{ fontSize: "11px", color: COLORS.muted, marginBottom: "8px", textTransform: "uppercase" }}>
                    Designation
                </div>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ENTER VALID IDENTIFIER"
                    maxLength={24}
                    disabled={busy}
                    style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.3)",
                        border: `1px solid ${COLORS.border}`,
                        padding: "10px",
                        color: COLORS.text,
                        fontFamily: "monospace",
                        fontSize: "14px",
                        outline: "none",
                    }}
                />
            </div>

            {/* Gender Selection */}
            <div>
                <div style={{ fontSize: "11px", color: COLORS.muted, marginBottom: "8px", textTransform: "uppercase" }}>
                    Core Personality
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    {["male", "female"].map((g) => (
                        <button
                            key={g}
                            onClick={() => setGender(g)}
                            disabled={busy}
                            style={{
                                flex: 1,
                                padding: "8px",
                                background: gender === g ? COLORS.accentBg : "transparent",
                                border: `1px solid ${gender === g ? COLORS.accent : COLORS.border}`,
                                color: gender === g ? COLORS.text : COLORS.muted,
                                fontSize: "12px",
                                textTransform: "uppercase",
                                cursor: busy ? "not-allowed" : "pointer",
                            }}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {/* Type Selection */}
            <div>
                <div style={{ fontSize: "11px", color: COLORS.muted, marginBottom: "8px", textTransform: "uppercase" }}>
                    Chassis Class
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    {[
                        { id: "companion", label: "Companion" },
                        { id: "warform", label: "Warrior" },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setType(t.id)}
                            disabled={busy}
                            style={{
                                flex: 1,
                                padding: "8px",
                                background: type === t.id ? COLORS.accentBg : "transparent",
                                border: `1px solid ${type === t.id ? COLORS.accent : COLORS.border}`,
                                color: type === t.id ? COLORS.text : COLORS.muted,
                                fontSize: "12px",
                                textTransform: "uppercase",
                                cursor: busy ? "not-allowed" : "pointer",
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{ color: COLORS.error, fontSize: "11px", textAlign: "center" }}>
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleInitialize}
                disabled={busy}
                style={{
                    width: "100%",
                    padding: "12px",
                    background: COLORS.accent,
                    border: "none",
                    color: "#000",
                    fontWeight: 700,
                    fontSize: "12px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.7 : 1,
                }}
            >
                {busy ? "INITIALIZING..." : "INITIALIZE SYSTEM"}
            </button>
        </div>
    );
}
