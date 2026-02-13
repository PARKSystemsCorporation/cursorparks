"use client";

import React, { useRef, useEffect } from "react";
import { useSceneState } from "@/src/modules/world/SceneStateContext";
import { useChat } from "@/src/components/Bazaar/ChatContext";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.92)",
  border: "#8b6914",
  text: "#e8d5b7",
  header: "#ff6b1a",
};

const VENDOR_NAMES: Record<string, string> = {
  barker: "The Barker",
  broker: "The Broker",
};

export function VendorTalkPanel() {
  const { sceneMode, selectedVendorId, setSceneMode, setSelectedVendorId } = useSceneState();
  const { messages } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (sceneMode !== "talking_vendor" || !selectedVendorId) return null;

  const vendorMessages = messages.filter(
    (m) => m.senderType === "user" || (m.senderType === "vendor" && m.sender.toLowerCase() === selectedVendorId)
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        width: 300,
        maxHeight: "50vh",
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        overflow: "hidden",
        pointerEvents: "auto",
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${COLORS.border}` }}>
        <span style={{ color: COLORS.header, fontWeight: "bold", fontSize: 14 }}>
          {VENDOR_NAMES[selectedVendorId] ?? selectedVendorId}
        </span>
        <button
          type="button"
          onClick={() => { setSceneMode("idle"); setSelectedVendorId(null); }}
          style={{
            background: "transparent",
            border: "none",
            color: COLORS.text,
            cursor: "pointer",
            fontSize: 18,
            padding: "0 6px",
          }}
        >
          ×
        </button>
      </div>
      <div ref={scrollRef} style={{ height: 220, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        {vendorMessages.map((m) => (
          <div key={m.id} style={{ fontSize: 12, color: m.senderType === "user" ? "#d4a574" : COLORS.text }}>
            <strong>{m.sender}:</strong> {m.text}
          </div>
        ))}
      </div>
      <p style={{ padding: "6px 12px", fontSize: 11, color: "#6b5a4a" }}>
        Use chat input below to message this vendor.
      </p>
    </div>
  );
}
