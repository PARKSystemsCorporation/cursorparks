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

export type InitialBondData = {
    type: string;
    gender: string;
    morphologySeed: string;
};

export type FirstBondData = InitialBondData & {
    name: string;
};

export default function NamingPanel({
    initialData,
    onComplete,
}: {
    initialData: InitialBondData;
    onComplete: (data: FirstBondData) => void;
}) {
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!name.trim()) {
            setError("Identity designation required.");
            return;
        }
        setBusy(true);
        setError(null);

        try {
            const payload = {
                name: name.trim(),
                type: initialData.type,
                gender: initialData.gender,
                morphologySeed: initialData.morphologySeed,
            };

            const res = await fetch("/api/exokin/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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
    }, [name, initialData, onComplete]);

    return (
        <div
            style={{
                position: "fixed",
                top: "60%",
                left: "50%",
                transform: "translate(-50%, -50%)",
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
                <div
                    style={{
                        fontSize: "10px",
                        color: COLORS.accent,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                    }}
                >
                    System Linked
                </div>
                <div
                    style={{
                        fontSize: "16px",
                        color: COLORS.text,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                    }}
                >
                    CONFIRM DESIGNATION
                </div>
            </div>

            {/* Name Input */}
            <div>
                <div
                    style={{
                        fontSize: "11px",
                        color: COLORS.muted,
                        marginBottom: "8px",
                        textTransform: "uppercase",
                    }}
                >
                    Enter Name
                </div>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="EXOKIN ID"
                    maxLength={24}
                    disabled={busy}
                    autoFocus
                    style={{
                        width: "100%",
                        background: "rgba(0,0,0,0.3)",
                        border: `1px solid ${COLORS.border}`,
                        padding: "10px",
                        color: COLORS.text,
                        fontFamily: "monospace",
                        fontSize: "14px",
                        outline: "none",
                        textAlign: "center",
                        letterSpacing: "0.1em",
                    }}
                />
            </div>

            {/* Error Message */}
            {error && (
                <div style={{ color: COLORS.error, fontSize: "11px", textAlign: "center" }}>{error}</div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
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
                    marginTop: "10px",
                }}
            >
                {busy ? "LINKING..." : "ESTABLISH BOND"}
            </button>
        </div>
    );
}
