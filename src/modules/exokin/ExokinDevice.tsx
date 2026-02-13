"use client";

import React, { useCallback, useRef, useEffect } from "react";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.92)",
  border: "#8b6914",
  accent: "#ff6b1a",
  muted: "rgba(232, 213, 183, 0.7)",
};

const BOND_RELEASE_EVENT = "parks-bond-deploy-release";

/** Physical EXOKIN capsule device under the chat. Only drag source for deploy; no quick bar. */
export function ExokinDevice() {
  const { bondCapsule, dragState, startBondDeploy, cancelDrag } = useInventory();
  const isDragging = dragState?.fromBond === true;
  const pointerPos = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || !bondCapsule) return;
      e.preventDefault();
      startBondDeploy();
    },
    [bondCapsule, startBondDeploy]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      pointerPos.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => {
      window.dispatchEvent(
        new CustomEvent(BOND_RELEASE_EVENT, {
          detail: { clientX: pointerPos.current.x, clientY: pointerPos.current.y },
        })
      );
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [isDragging]);

  if (!bondCapsule) return null;

  const inPocket = true;
  const showWelcomePulse = inPocket && !isDragging;

  return (
    <>
      <style>{`
        @keyframes exokin-device-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    <div
      style={{
        width: 300,
        flexShrink: 0,
        border: `1px solid ${COLORS.border}`,
        borderTop: "none",
        borderRadius: "0 0 6px 6px",
        background: COLORS.bg,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 72,
        outline: showWelcomePulse ? `2px solid ${COLORS.accent}` : undefined,
        outlineOffset: 2,
        animation: showWelcomePulse ? "exokin-device-pulse 2s ease-in-out infinite" : undefined,
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onPointerDown={onPointerDown}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          border: `2px solid ${COLORS.border}`,
          background: "rgba(20, 18, 16, 0.8)",
          borderRadius: 4,
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            startBondDeploy();
          }
        }}
      >
        <span style={{ fontSize: 28, color: COLORS.accent }}>◆</span>
      </div>
      <span style={{ fontSize: 10, color: COLORS.muted, marginTop: 6 }}>
        Drag into world to deploy
      </span>
    </div>
    </>
  );
}

export { BOND_RELEASE_EVENT };
