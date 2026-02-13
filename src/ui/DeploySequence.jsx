"use client";

import React, { useState, useCallback, useEffect } from "react";
import { triggerCreatureSpawn as triggerSpawnWithIdentity } from "@/src/systems/creature/generator";

export function triggerCreatureSpawn(type) {
  if (!type) return;
  window.dispatchEvent(new CustomEvent("parks-spawn-creature", { detail: { type } }));
}

const STYLES = {
  anchor: {
    position: "fixed",
    left: "50%",
    bottom: "28%",
    transform: "translateX(-50%)",
    width: 80,
    height: 80,
    pointerEvents: "none",
    zIndex: 90,
  },
  groundDistortion: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: 120,
    height: 40,
    borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(139, 115, 85, 0.25) 0%, transparent 70%)",
    opacity: 0.8,
  },
  assembly: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: 60,
    height: 60,
    border: "2px solid rgba(139, 115, 85, 0.5)",
    background: "rgba(20, 18, 16, 0.3)",
  },
};

let deployInProgress = false;

export function deployCapsule(type) {
  if (deployInProgress) return;
  deployInProgress = true;
  window.dispatchEvent(new CustomEvent("parks-deploy-capsule", { detail: { type } }));
}

export function DeploySequenceUI() {
  const [active, setActive] = useState(false);
  const [payload, setPayload] = useState({ type: null, position: null, creatureId: null });

  useEffect(() => {
    const onCapsule = (e) => {
      const t = e.detail?.type;
      if (t) {
        setPayload({ type: t, position: null, creatureId: null });
        setActive(true);
      }
    };
    const onWallet = (e) => {
      const d = e.detail;
      if (d?.type) {
        setPayload({ type: d.type, position: d.position ?? null, creatureId: d.creatureId ?? null });
        setActive(true);
      }
    };
    window.addEventListener("parks-deploy-capsule", onCapsule);
    window.addEventListener("parks-deploy-wallet-card", onWallet);
    return () => {
      window.removeEventListener("parks-deploy-capsule", onCapsule);
      window.removeEventListener("parks-deploy-wallet-card", onWallet);
    };
  }, []);

  const finish = useCallback(() => {
    if (payload.type) {
      if (payload.creatureId && payload.position) {
        triggerSpawnWithIdentity(payload.type, { creatureId: payload.creatureId, position: payload.position });
      } else {
        triggerCreatureSpawn(payload.type);
      }
    }
    setActive(false);
    setPayload({ type: null, position: null, creatureId: null });
    deployInProgress = false;
  }, [payload.type, payload.creatureId, payload.position]);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(finish, 1800);
    return () => clearTimeout(t);
  }, [active, finish]);

  if (!active) return null;

  return (
    <div style={STYLES.anchor} aria-hidden>
      <div style={STYLES.groundDistortion} />
      <div style={STYLES.assembly} />
    </div>
  );
}
