"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useInventory } from "@/src/modules/ui/inventory/InventoryContext";
import { useRobot } from "@/src/modules/robot/RobotContext";

const COLORS = {
  bg: "rgba(26, 20, 16, 0.92)",
  border: "#8b6914",
  text: "#e8d5b7",
  accent: "#ff6b1a",
  user: "rgba(200, 220, 255, 0.95)",
  exokin: "rgba(255, 230, 200, 0.95)",
};

export function ExokinChat() {
  const { deployedRobots, bondCapsule, pocketA, pocketB, cargoC, cargoD } = useInventory();
  const robot = useRobot();
  const pockets = [pocketA, pocketB, cargoC, cargoD].flat();
  const firstCapsule = pockets.find((item) => item?.type === "capsule" && item?.id);
  const firstDeployed = deployedRobots[0];
  const activeCreatureId = firstDeployed?.creatureId ?? bondCapsule?.id ?? firstCapsule?.id ?? null;

  const [messages, setMessages] = useState<{ id: number | string; speaker: string; content: string; createdAt?: string }[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeCreatureId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/exokin/chat?creatureId=${encodeURIComponent(activeCreatureId)}`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((m: { id: number; speaker: string; content: string; createdAt: string }) => ({
              id: m.id,
              speaker: m.speaker,
              content: m.content,
              createdAt: m.createdAt,
            }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCreatureId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !activeCreatureId) return;
    const response = robot.sendToRobot(text);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, speaker: "user", content: text },
      { id: `e-${Date.now()}`, speaker: "exokin", content: response },
    ]);
    setInput("");

    fetch("/api/exokin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatureId: activeCreatureId, speaker: "user", content: text }),
    }).catch(() => {});
    fetch("/api/exokin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatureId: activeCreatureId, speaker: "exokin", content: response }),
    }).catch(() => {});
  }, [input, activeCreatureId, robot]);

  if (!activeCreatureId) return null;

  return (
    <div
      style={{
        width: "100%",
        flex: 1,
        minHeight: 0,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "6px 6px 0 0",
        background: COLORS.bg,
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        overflow: "hidden",
        zIndex: 25,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "6px 10px",
          fontSize: 11,
          fontWeight: "bold",
          color: COLORS.accent,
          borderBottom: `1px solid ${COLORS.border}`,
          flexShrink: 0,
        }}
      >
        EXOKIN — Private
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
          gap: 6,
        }}
      >
        {messages.length === 0 && (
          <div style={{ fontSize: 11, color: COLORS.text, opacity: 0.6 }}>
            Talk to your EXOKIN. Memory and tone are governed by EARE.
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ fontSize: 12, lineHeight: 1.4 }}>
            <span
              style={{
                color: msg.speaker === "user" ? COLORS.user : COLORS.exokin,
                fontWeight: "bold",
                marginRight: 6,
              }}
            >
              {msg.speaker === "user" ? "You" : "EXOKIN"}:
            </span>
            <span style={{ color: COLORS.text }}>{msg.content}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          padding: 8,
          borderTop: `1px solid ${COLORS.border}`,
          flexShrink: 0,
          display: "flex",
          gap: 6,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Say something..."
          style={{
            flex: 1,
            padding: "8px 10px",
            background: "rgba(10, 8, 6, 0.8)",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 4,
            color: COLORS.text,
            fontSize: 12,
          }}
        />
        <button
          type="button"
          onClick={sendMessage}
          style={{
            padding: "8px 12px",
            background: COLORS.accent,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 4,
            color: "#0a0806",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
