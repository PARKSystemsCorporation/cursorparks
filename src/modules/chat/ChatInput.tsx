"use client";

import React, { useState, useCallback } from "react";
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
  const { sendMessage, sendToBazaar } = useChat();
  const { sendToRobot } = useRobot();
  const { sceneMode, selectedVendorId } = useSceneState();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed) return;
      if (trimmed.startsWith("/r ")) {
        sendToRobot(trimmed.slice(3));
      } else if (sceneMode === "talking_vendor" && selectedVendorId) {
        sendMessage(trimmed, selectedVendorId);
      } else {
        sendToBazaar(trimmed);
      }
      setText("");
    },
    [text, sceneMode, selectedVendorId, sendMessage, sendToBazaar, sendToRobot]
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
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={sceneMode === "talking_vendor" ? "Message vendor..." : "Ether or /r for robot..."}
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
    </form>
  );
}
