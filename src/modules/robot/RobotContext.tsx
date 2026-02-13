"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { MoodState } from "./neurochemEngine";
import { NeurochemEngine } from "./neurochemEngine";
import { RobotMemory } from "./memorySystem";
import { RobotChatEngine } from "./robotChatEngine";

type RobotContextValue = {
  sendToRobot: (text: string) => string;
  lastResponse: string | null;
  getMood: () => MoodState;
  tick: (dt: number) => void;
};

const RobotContext = createContext<RobotContextValue | null>(null);

export function RobotProvider({ children }: { children: React.ReactNode }) {
  const neurochem = useRef(new NeurochemEngine()).current;
  const memory = useRef(new RobotMemory()).current;
  const chatEngine = useRef(new RobotChatEngine({ neurochem, memory })).current;
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  const sendToRobot = useCallback((text: string): string => {
    const response = chatEngine.respond(text);
    setLastResponse(response);
    return response;
  }, []);

  const tick = useCallback((dt: number) => {
    chatEngine.tick(dt);
  }, []);

  const getMood = useCallback(() => neurochem.getMood(), []);

  const value = useMemo<RobotContextValue>(
    () => ({ sendToRobot, lastResponse, getMood, tick }),
    [sendToRobot, lastResponse, getMood, tick]
  );

  return <RobotContext.Provider value={value}>{children}</RobotContext.Provider>;
}

export function useRobot(): RobotContextValue {
  const ctx = useContext(RobotContext);
  if (!ctx) {
    return {
      sendToRobot: () => "I'm not connected.",
      lastResponse: null,
      getMood: () => ({ valence: 0.5, arousal: 0.5, dominance: 0.5 }),
      tick: () => {},
    };
  }
  return ctx;
}
