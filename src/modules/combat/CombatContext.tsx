"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { CombatEngine } from "./CombatEngine";

const CombatContext = createContext<CombatEngine | null>(null);

export function CombatProvider({ children }: { children: React.ReactNode }) {
    // Singleton engine instance
    const engine = useMemo(() => new CombatEngine(), []);

    // Cleanup callbacks on unmount? Engine is persistent in memory for the session usually.

    return (
        <CombatContext.Provider value={engine}>
            {children}
        </CombatContext.Provider>
    );
}

export function useCombat(): CombatEngine {
    const ctx = useContext(CombatContext);
    if (!ctx) {
        throw new Error("useCombat must be used within a CombatProvider");
    }
    return ctx;
}
