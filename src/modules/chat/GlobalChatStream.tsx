"use client";

import React, { useEffect, useRef } from "react";
import { useChat } from "@/src/components/Bazaar/ChatContext";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.85)",
  text: "#e8d5b7",
  header: "#ff6b1a",
};

export function GlobalChatStream() {
  const { messages } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: 320,
        maxHeight: "40vh",
        background: COLORS.bg,
        border: "1px solid #8b6914",
        borderRadius: 6,
        overflow: "hidden",
        pointerEvents: "auto",
        zIndex: 10,
      }}
    >
      <div style={{ padding: "6px 10px", fontSize: 11, fontWeight: "bold", color: COLORS.header, borderBottom: "1px solid #8b6914" }}>
        ETHER
      </div>
      <div
        ref={scrollRef}
        style={{
          height: 280,
          overflowY: "auto",
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {messages.map((msg) => (
          <div key={msg.id} style={{ fontSize: 12, lineHeight: 1.35 }}>
            <span style={{ color: msg.color, fontWeight: "bold", marginRight: 6 }}>{msg.sender}:</span>
            <span style={{ color: COLORS.text }}>{msg.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
