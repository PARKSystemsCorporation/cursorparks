"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { MoodState } from "./neurochemEngine";
import { RobotMemory } from "./memorySystem";
import { RobotChatEngine } from "./robotChatEngine";
import { EAREEngine } from "@/src/modules/exokin";
import type { CombatCalibration } from "@/src/modules/exokin";
import type { EAREEventType } from "@/src/modules/exokin";

type RobotContextValue = {
  sendToRobot: (text: string) => string;
  lastResponse: string | null;
  getMood: () => MoodState;
  tick: (dt: number) => void;
  /** EARE: record events (combat_win, combat_loss, chat_social, etc.) to drive self-regulation. */
  recordEvent: (type: EAREEventType, intensity?: number) => void;
  /** EARE: combat stats calibration from emergent role and neuro state. */
  getCombatCalibration: () => CombatCalibration;
};

const RobotContext = createContext<RobotContextValue | null>(null);

const defaultMood: MoodState = { valence: 0.5, arousal: 0.5, dominance: 0.5 };

export function RobotProvider({ children }: { children: React.ReactNode }) {
  const eare = useRef(new EAREEngine()).current;
  const memory = useRef(new RobotMemory()).current;
  const chatEngine = useRef(new RobotChatEngine({ eare, memory })).current;
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  const sendToRobot = useCallback((text: string): string => {
    const response = chatEngine.respond(text);
    setLastResponse(response);
    return response;
  }, []);

  const tick = useCallback((dt: number) => {
    chatEngine.tick(dt);
  }, []);

  const getMood = useCallback((): MoodState => {
    const ctx = eare.getChatContext();
    return { valence: ctx.valence, arousal: ctx.arousal, dominance: ctx.dominance };
  }, []);

  const recordEvent = useCallback((type: EAREEventType, intensity?: number) => {
    eare.recordEvent(type, intensity ?? 1);
  }, []);

  const getCombatCalibration = useCallback((): CombatCalibration => {
    return eare.getCombatCalibration();
  }, []);

  const value = useMemo<RobotContextValue>(
    () => ({ sendToRobot, lastResponse, getMood, tick, recordEvent, getCombatCalibration }),
    [sendToRobot, lastResponse, getMood, tick, recordEvent, getCombatCalibration]
  );

  return <RobotContext.Provider value={value}>{children}</RobotContext.Provider>;
}

export function useRobot(): RobotContextValue {
  const ctx = useContext(RobotContext);
  if (!ctx) {
    return {
      sendToRobot: () => "I'm not connected.",
      lastResponse: null,
      getMood: () => defaultMood,
      tick: () => {},
      recordEvent: () => {},
      getCombatCalibration: () => ({
        strikeBias: 1,
        blockBias: 1,
        dodgeBias: 1,
        staminaBias: 1,
        tacticsBias: 1,
        temperBias: 1,
      }),
    };
  }
  return ctx;
}
