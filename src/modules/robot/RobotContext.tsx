"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { MoodState } from "./neurochemEngine";
import { RobotMemory } from "./memorySystem";
import { RobotChatEngine } from "./robotChatEngine";
import { EAREEngine } from "@/src/modules/exokin";
import type { CombatCalibration } from "@/src/modules/exokin";
import type { EAREChatContext, EAREEventType } from "@/src/modules/exokin";
import type { EAREState } from "@/src/modules/exokin";
import type { IdentityLike } from "@/src/modules/exokin";
import { morphologyFromIdentity } from "@/src/modules/exokin";

type RobotContextValue = {
  sendToRobot: (text: string, creatureId?: string) => string;
  lastResponse: string | null;
  getMood: () => MoodState;
  tick: (dt: number) => void;
  /** EARE: record events (combat_win, combat_loss, chat_social, etc.) to drive self-regulation. */
  recordEvent: (type: EAREEventType, intensity?: number) => void;
  /** EARE: combat stats calibration from emergent role and neuro state. */
  getCombatCalibration: () => CombatCalibration;
  /** EARE: chat context and emotional/neuro stats for UI (panel, chat tone). */
  getChatContext: () => EAREChatContext;
  /** EARE: full state for stats UI (lifetime, recent wins/losses, neuro, calibration). */
  getEAREState: () => EAREState;
  /** Unified speech: set morphology/color so proto-language reflects body and color (angular/smooth, cold/warm). */
  setSpeechMorphology: (identity: IdentityLike | null) => void;
};

const RobotContext = createContext<RobotContextValue | null>(null);

const defaultMood: MoodState = { valence: 0.5, arousal: 0.5, dominance: 0.5 };

const EARE_STORAGE_KEY = "parks-eare-state";
const EARE_SAVE_INTERVAL_MS = 5000;

export function RobotProvider({ children }: { children: React.ReactNode }) {
  const eare = useRef(new EAREEngine()).current;
  const memory = useRef(new RobotMemory()).current;
  const chatEngine = useRef(new RobotChatEngine({ eare, memory })).current;
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = typeof localStorage !== "undefined" ? localStorage.getItem(EARE_STORAGE_KEY) : null;
      if (saved) eare.deserialize(saved);
    } catch {
      // ignore
    }
  }, [eare]);

  useEffect(() => {
    const id = setInterval(() => {
      try {
        if (typeof localStorage !== "undefined") localStorage.setItem(EARE_STORAGE_KEY, eare.serialize());
      } catch {
        // ignore
      }
    }, EARE_SAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [eare]);

  const sendToRobot = useCallback((text: string, creatureId?: string): string => {
    const response = chatEngine.respond(text, creatureId);
    setLastResponse(response);
    return response;
  }, [chatEngine]);

  const tick = useCallback((dt: number) => {
    chatEngine.tick(dt);
  }, [chatEngine]);

  const getMood = useCallback((): MoodState => {
    const ctx = eare.getChatContext();
    return { valence: ctx.valence, arousal: ctx.arousal, dominance: ctx.dominance };
  }, [eare]);

  const recordEvent = useCallback((type: EAREEventType, intensity?: number) => {
    eare.recordEvent(type, intensity ?? 1);
  }, [eare]);

  const getCombatCalibration = useCallback((): CombatCalibration => {
    return eare.getCombatCalibration();
  }, [eare]);

  const getChatContext = useCallback((): EAREChatContext => {
    return eare.getChatContext();
  }, [eare]);

  const getEAREState = useCallback((): EAREState => {
    return eare.getState();
  }, [eare]);

  const setSpeechMorphology = useCallback((identity: IdentityLike | null) => {
    chatEngine.setMorphology(morphologyFromIdentity(identity) ?? undefined);
  }, [chatEngine]);

  const value = useMemo<RobotContextValue>(
    () => ({ sendToRobot, lastResponse, getMood, tick, recordEvent, getCombatCalibration, getChatContext, getEAREState, setSpeechMorphology }),
    [sendToRobot, lastResponse, getMood, tick, recordEvent, getCombatCalibration, getChatContext, getEAREState, setSpeechMorphology]
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
      tick: () => { },
      recordEvent: () => { },
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
      getEAREState: () => ({
        neuro: { aggression: 0.5, bonding: 0.5, alertness: 0.5, curiosity: 0.5, territoriality: 0.5, playDrive: 0.5 },
        roleDrift: 0,
        calibration: { strikeBias: 1, blockBias: 1, dodgeBias: 1, staminaBias: 1, tacticsBias: 1, temperBias: 1 },
        lifetime: { combatExposure: 0, socialInteraction: 0, ownerDependency: 0, environmentalStress: 0 },
        recentCombatWins: 0,
        recentCombatLosses: 0,
        recentChatTurns: 0,
        recentProximityTime: 0,
        lastObservedBehavioral: {},
      }),
      setSpeechMorphology: () => { },
    };
  }
  return ctx;
}
