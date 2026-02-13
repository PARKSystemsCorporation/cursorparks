"use client";

import React, { useCallback } from "react";
import { useSceneState } from "@/src/modules/world/SceneStateContext";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.95)",
  border: "#8b6914",
  text: "#e8d5b7",
  hover: "#ff6b1a",
};

export function RadialMenu() {
  const { radialMenu, setRadialMenu, setSceneMode, setSelectedVendorId } = useSceneState();

  const close = useCallback(() => setRadialMenu(null), [setRadialMenu]);

  const onTalk = useCallback(() => {
    if (!radialMenu) return;
    setSelectedVendorId(radialMenu.vendorId);
    setSceneMode("talking_vendor");
    setRadialMenu(null);
  }, [radialMenu, setSelectedVendorId, setSceneMode, setRadialMenu]);

  const onTrade = useCallback(() => {
    if (!radialMenu) return;
    setSelectedVendorId(radialMenu.vendorId);
    setSceneMode("trading");
    setRadialMenu(null);
  }, [radialMenu, setSelectedVendorId, setSceneMode, setRadialMenu]);

  if (!radialMenu) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "transparent",
        }}
        onClick={close}
        onContextMenu={(e) => { e.preventDefault(); close(); }}
      />
      <div
        style={{
          position: "fixed",
          left: radialMenu.x,
          top: radialMenu.y,
          transform: "translate(-50%, -50%)",
          zIndex: 101,
          background: COLORS.bg,
          border: `2px solid ${COLORS.border}`,
          borderRadius: 8,
          padding: 8,
          minWidth: 120,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        <button
          type="button"
          onClick={onTalk}
          style={{
            display: "block",
            width: "100%",
            padding: "10px 16px",
            marginBottom: 4,
            background: "transparent",
            border: "none",
            borderRadius: 4,
            color: COLORS.text,
            fontSize: 14,
            cursor: "pointer",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = COLORS.hover;
            e.currentTarget.style.color = "#1a1410";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = COLORS.text;
          }}
        >
          TALK
        </button>
        <button
          type="button"
          onClick={onTrade}
          style={{
            display: "block",
            width: "100%",
            padding: "10px 16px",
            background: "transparent",
            border: "none",
            borderRadius: 4,
            color: COLORS.text,
            fontSize: 14,
            cursor: "pointer",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = COLORS.hover;
            e.currentTarget.style.color = "#1a1410";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = COLORS.text;
          }}
        >
          TRADE
        </button>
      </div>
    </>
  );
}
