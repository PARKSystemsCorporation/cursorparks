"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";

const COLORS = {
  bg: "rgba(14, 12, 10, 0.95)",
  border: "#8b6914",
  accent: "#ff6b1a",
  muted: "rgba(232, 213, 183, 0.7)",
};

const BOND_RELEASE_EVENT = "parks-bond-deploy-release";

/** Physical EXOKIN capsule device under the chat. Only drag source for deploy; no quick bar. */
export function ExokinDevice() {
  const { bondCapsule, deployedRobots, dragState, startBondDeploy, setBondDragScreenPos } = useInventory();
  const isDragging = dragState?.fromBond === true;
  const isLinked = Boolean(
    bondCapsule?.id && deployedRobots.some((r) => r.creatureId === bondCapsule.id)
  );
  const pointerPos = useRef({ x: 0, y: 0 });
  const [dragCursor, setDragCursor] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || !bondCapsule) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      startBondDeploy();
      setDragCursor({ x: e.clientX, y: e.clientY });
      pointerPos.current = { x: e.clientX, y: e.clientY };
    },
    [bondCapsule, startBondDeploy]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      pointerPos.current = { x: e.clientX, y: e.clientY };
      setBondDragScreenPos({ clientX: e.clientX, clientY: e.clientY });
      setDragCursor({ x: e.clientX, y: e.clientY });
    };
    const onUp = () => {
      setDragCursor(null);
      setBondDragScreenPos(null);
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
  }, [isDragging, setBondDragScreenPos]);

  if (!bondCapsule) return null;

  const inPocket = true;
  const showWelcomePulse = inPocket && !isDragging && !isLinked;

  const baseShadow = "0 4px 12px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.3)";
  const hoverGlow = hovered ? "0 0 16px rgba(255, 107, 26, 0.5), 0 0 28px rgba(255, 107, 26, 0.2)" : "";

  return (
    <>
      <style>{`
        @keyframes exokin-device-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 4px 12px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.3), 0 0 12px rgba(255, 107, 26, 0.2), 0 0 24px rgba(255, 107, 26, 0.08); }
          50% { opacity: 1; box-shadow: 0 4px 12px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255, 107, 26, 0.35), 0 0 40px rgba(255, 107, 26, 0.12); }
        }
      `}</style>
    <div
      style={{
        width: "100%",
        flexShrink: 0,
        borderRadius: "0 0 6px 6px",
        background: COLORS.bg,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 72,
        boxShadow: showWelcomePulse
          ? undefined
          : hovered
            ? `${baseShadow}, ${hoverGlow}`
            : baseShadow,
        animation: showWelcomePulse ? "exokin-device-pulse 2.5s ease-in-out infinite" : undefined,
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          border: `2px solid ${hovered ? COLORS.accent : COLORS.border}`,
          background: "rgba(12, 10, 8, 0.9)",
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
        {isLinked ? "STATUS: LINKED" : "Drag into world to deploy"}
      </span>
    </div>
    {isDragging && dragCursor && (
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: dragCursor.x,
          top: dragCursor.y,
          transform: "translate(-50%, -50%)",
          width: 48,
          height: 48,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${COLORS.border}`,
          background: "rgba(20, 18, 16, 0.9)",
          borderRadius: 4,
          pointerEvents: "none",
          zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        <span style={{ fontSize: 28, color: COLORS.accent }}>◆</span>
      </div>
    )}
    </>
  );
}

export { BOND_RELEASE_EVENT };
