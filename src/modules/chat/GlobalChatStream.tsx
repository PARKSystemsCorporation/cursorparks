"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { useChat } from "@/src/components/Bazaar/ChatContext";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.85)",
  text: "#e8d5b7",
  header: "#ff6b1a",
};

/** Items bar sits at bottom 24px and is ~76px tall; ether panel ends just above it. */
const BOTTOM_OFFSET = 100;

export function GlobalChatStream() {
  const { messages } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ether = everyone in the game only. No barker/vendor stock phrases (no spam).
  const etherMessages = useMemo(
    () =>
      messages
        .filter((msg) => msg.senderType === "user" || msg.senderType === "other")
        .slice(-40),
    [messages]
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [etherMessages]);

  if (etherMessages.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        bottom: BOTTOM_OFFSET,
        width: 320,
        background: COLORS.bg,
        border: "1px solid #8b6914",
        borderRadius: 6,
        overflow: "hidden",
        pointerEvents: "auto",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "6px 10px", fontSize: 11, fontWeight: "bold", color: COLORS.header, borderBottom: "1px solid #8b6914", flexShrink: 0 }}>
        ETHER
      </div>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {etherMessages.map((msg) => (
          <div key={msg.id} style={{ fontSize: 12, lineHeight: 1.35 }}>
            <span style={{ color: msg.color, fontWeight: "bold", marginRight: 6 }}>{msg.sender}:</span>
            <span style={{ color: COLORS.text }}>{msg.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
