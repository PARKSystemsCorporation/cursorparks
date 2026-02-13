"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type CameraOverrideValue = {
  active: boolean;
  setActive: (v: boolean) => void;
};

const CameraOverrideContext = createContext<CameraOverrideValue | null>(null);

export function CameraOverrideProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const value: CameraOverrideValue = { active, setActive: useCallback((v: boolean) => setActive(v), []) };
  return (
    <CameraOverrideContext.Provider value={value}>
      {children}
    </CameraOverrideContext.Provider>
  );
}

export function useCameraOverride(): CameraOverrideValue {
  const ctx = useContext(CameraOverrideContext);
  return ctx ?? { active: false, setActive: () => {} };
}
