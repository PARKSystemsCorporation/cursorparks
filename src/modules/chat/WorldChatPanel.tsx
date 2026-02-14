"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { useChat } from "@/src/components/Bazaar/ChatContext";

const BOTTOM_OFFSET = 100;

/** Right-side WORLD CHAT: NPC chatter, ambient comms, bazaar messages, system events. Thinner than EXOKIN chat, semi-transparent, scroll feed only. */
export function WorldChatPanel() {
  const { messages } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  const worldMessages = useMemo(
    () =>
      messages
        .filter((msg) => msg.senderType === "user" || msg.senderType === "other")
        .slice(-40),
    [messages]
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [worldMessages]);

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        bottom: BOTTOM_OFFSET,
        width: 220,
        background: "rgba(20, 18, 16, 0.72)",
        border: "1px solid rgba(139, 105, 20, 0.5)",
        borderRadius: 6,
        overflow: "hidden",
        pointerEvents: "auto",
        zIndex: 25,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "6px 10px",
          fontSize: 10,
          fontWeight: "bold",
          color: "rgba(255, 107, 26, 0.9)",
          borderBottom: "1px solid rgba(139, 105, 20, 0.4)",
          flexShrink: 0,
          letterSpacing: "0.12em",
        }}
      >
        WORLD CHAT
      </div>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: 6,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {worldMessages.length === 0 ? (
          <span style={{ fontSize: 11, color: "rgba(232, 213, 183, 0.5)" }}>—</span>
        ) : (
          worldMessages.map((msg) => (
            <div key={msg.id} style={{ fontSize: 11, lineHeight: 1.35 }}>
              <span style={{ color: msg.color ?? "rgba(232,213,183,0.9)", fontWeight: "bold", marginRight: 4 }}>
                {msg.sender}:
              </span>
              <span style={{ color: "rgba(232, 213, 183, 0.85)" }}>{msg.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
