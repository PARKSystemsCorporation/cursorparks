"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

type TrainerStep = 0 | 1 | 2; // 0 = not triggered, 1 = dialogue, 2 = gave capsule

type TrainerContextValue = {
  step: TrainerStep;
  triggerApproach: () => void;
  completeAndGiveCapsule: () => void;
};

const TrainerContext = createContext<TrainerContextValue | null>(null);

export function TrainerProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<TrainerStep>(0);

  const triggerApproach = useCallback(() => {
    setStep((s) => (s === 0 ? 1 : s));
  }, []);

  const completeAndGiveCapsule = useCallback(() => {
    setStep(2);
  }, []);

  return (
    <TrainerContext.Provider value={{ step, triggerApproach, completeAndGiveCapsule }}>
      {children}
    </TrainerContext.Provider>
  );
}

export function useTrainer(): TrainerContextValue {
  const ctx = useContext(TrainerContext);
  if (!ctx) {
    return {
      step: 0,
      triggerApproach: () => {},
      completeAndGiveCapsule: () => {},
    };
  }
  return ctx;
}
