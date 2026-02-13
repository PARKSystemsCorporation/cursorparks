"use client";

import React, { useCallback, useState } from "react";
import { useSceneState } from "@/src/modules/world/SceneStateContext";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.94)",
  table: "#4a3728",
  border: "#8b6914",
  text: "#e8d5b7",
  accent: "#ff6b1a",
};

export function BarterTable() {
  const { sceneMode, selectedVendorId, setSceneMode, setSelectedVendorId } = useSceneState();
  const [userItems, setUserItems] = useState<string[]>([]);
  const [vendorItems] = useState<string[]>(["Spare parts", "Token pack"]);

  const close = useCallback(() => {
    setSceneMode("idle");
    setSelectedVendorId(null);
    setUserItems([]);
  }, [setSceneMode, setSelectedVendorId]);

  if (sceneMode !== "trading" || !selectedVendorId) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 90,
        }}
        onClick={close}
      />
      <div
        style={{
          position: "fixed",
          inset: "15% 15% 20% 15%",
          background: COLORS.bg,
          border: `2px solid ${COLORS.border}`,
          borderRadius: 12,
          zIndex: 91,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: COLORS.accent, fontWeight: "bold" }}>Barter — {selectedVendorId}</span>
          <button type="button" onClick={close} style={{ background: "transparent", border: "none", color: COLORS.text, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
        <div
          style={{
            flex: 1,
            background: `linear-gradient(180deg, ${COLORS.table} 0%, #3d2a1a 100%)`,
            margin: 16,
            borderRadius: 8,
            padding: 24,
            perspective: "800px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", minHeight: 60 }}>
            {vendorItems.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 14px",
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 4,
                  color: COLORS.text,
                  fontSize: 13,
                  border: "1px solid rgba(139,105,20,0.5)",
                }}
              >
                {item}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px dashed rgba(139,105,20,0.4)", margin: "12px 0", paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: "#8b6914", marginBottom: 8 }}>Your offer</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", minHeight: 44 }}>
              {userItems.length === 0 ? (
                <span style={{ color: "#6b5a4a", fontSize: 12 }}>Drag from pockets or add items</span>
              ) : (
                userItems.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(255,107,26,0.2)",
                      borderRadius: 4,
                      color: COLORS.text,
                      fontSize: 12,
                      border: "1px solid #ff6b1a",
                    }}
                  >
                    {item}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 16px", display: "flex", gap: 12, justifyContent: "flex-end", borderTop: `1px solid ${COLORS.border}` }}>
          <button
            type="button"
            onClick={close}
            style={{
              padding: "8px 16px",
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 4,
              color: COLORS.text,
              cursor: "pointer",
            }}
          >
            Walk away
          </button>
          <button
            type="button"
            style={{
              padding: "8px 16px",
              background: COLORS.accent,
              border: "none",
              borderRadius: 4,
              color: "#1a1410",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Shake hands
          </button>
        </div>
      </div>
    </>
  );
}
