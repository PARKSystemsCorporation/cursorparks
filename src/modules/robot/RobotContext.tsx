"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { MoodState } from "./neurochemEngine";
import { RobotMemory } from "./memorySystem";
import { RobotChatEngine } from "./robotChatEngine";
import { EAREEngine } from "@/src/modules/exokin";
import type { CombatCalibration } from "@/src/modules/exokin";
import type { EAREChatContext, EAREEventType } from "@/src/modules/exokin";
import type { IdentityLike } from "@/src/modules/exokin";
import { morphologyFromIdentity } from "@/src/modules/exokin";

type RobotContextValue = {
  sendToRobot: (text: string) => string;
  lastResponse: string | null;
  getMood: () => MoodState;
  tick: (dt: number) => void;
  /** EARE: record events (combat_win, combat_loss, chat_social, etc.) to drive self-regulation. */
  recordEvent: (type: EAREEventType, intensity?: number) => void;
  /** EARE: combat stats calibration from emergent role and neuro state. */
  getCombatCalibration: () => CombatCalibration;
  /** EARE: chat context and emotional/neuro stats for UI (panel, chat tone). */
  getChatContext: () => EAREChatContext;
  /** Unified speech: set morphology/color so proto-language reflects body and color (angular/smooth, cold/warm). */
  setSpeechMorphology: (identity: IdentityLike | null) => void;
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

  const getChatContext = useCallback((): EAREChatContext => {
    return eare.getChatContext();
  }, []);

  const setSpeechMorphology = useCallback((identity: IdentityLike | null) => {
    chatEngine.setMorphology(morphologyFromIdentity(identity) ?? undefined);
  }, []);

  const value = useMemo<RobotContextValue>(
    () => ({ sendToRobot, lastResponse, getMood, tick, recordEvent, getCombatCalibration, getChatContext, setSpeechMorphology }),
    [sendToRobot, lastResponse, getMood, tick, recordEvent, getCombatCalibration, getChatContext, setSpeechMorphology]
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
      getChatContext: () => ({
        valence: 0.5,
        arousal: 0.5,
        dominance: 0.5,
        roleDrift: 0,
        combatConfidence: 0.5,
        bondingState: 0.5,
        neuro: {
          aggression: 0.5,
          bonding: 0.5,
          alertness: 0.5,
          curiosity: 0.5,
          territoriality: 0.5,
          playDrive: 0.5,
        },
      }),
      setSpeechMorphology: () => {},
    };
  }
  return ctx;
}
