"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useChat } from "@/src/components/Bazaar/ChatContext";
import { useRobot } from "@/src/modules/robot/RobotContext";
import { useSceneState } from "@/src/modules/world/SceneStateContext";

const COLORS = {
  bg: "#2a1f15",
  border: "#8b6914",
  text: "#e8d5b7",
  placeholder: "#6b5a4a",
};

export function ChatInput() {
  const [text, setText] = useState("");
  const [namingTask, setNamingTask] = useState<{ creatureId: string; type: string; gender: "male" | "female" } | null>(null);
  const { sendMessage, sendToBazaar } = useChat();
  const { sendToRobot } = useRobot();
  const { sceneMode, selectedVendorId } = useSceneState();

  useEffect(() => {
    const handler = (
      e: CustomEvent<{ creatureId: string; type: string; gender: "male" | "female" }>
    ) => {
      const d = e.detail;
      if (!d?.creatureId || !d?.type) return;
      const gender = d.gender === "female" ? "female" : "male";
      setNamingTask({ creatureId: d.creatureId, type: d.type, gender });
      setText("");
    };
    window.addEventListener("parks-onboarding-name-request", handler as EventListener);
    return () =>
      window.removeEventListener("parks-onboarding-name-request", handler as EventListener);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed) return;
      if (namingTask) {
        await fetch("/api/exokin/creature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatureId: namingTask.creatureId,
            name: trimmed,
            gender: namingTask.gender,
            type: namingTask.type,
          }),
        }).catch(() => {});
        setText("");
        setNamingTask(null);
        window.dispatchEvent(new CustomEvent("parks-onboarding-name-saved"));
        return;
      }
      if (trimmed.startsWith("/r ")) {
        sendToRobot(trimmed.slice(3));
      } else if (sceneMode === "talking_vendor" && selectedVendorId) {
        sendMessage(trimmed, selectedVendorId);
      } else {
        sendToBazaar(trimmed);
      }
      setText("");
    },
    [text, namingTask, sceneMode, selectedVendorId, sendMessage, sendToBazaar, sendToRobot]
  );

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: "absolute",
        bottom: 100,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(400px, 90vw)",
        pointerEvents: "auto",
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            namingTask
              ? "Name your EXOKIN..."
              : sceneMode === "talking_vendor"
                ? "Message vendor..."
                : "Ether or /r for robot..."
          }
          maxLength={140}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 4,
            color: COLORS.text,
            fontSize: 14,
            outline: "none",
          }}
        />
        {namingTask && (
          <button
            type="submit"
            style={{
              padding: "8px 12px",
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 4,
              color: COLORS.text,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Save
          </button>
        )}
      </div>
    </form>
  );
}
