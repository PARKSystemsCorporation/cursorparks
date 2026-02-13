"use client";

import React, { useState, useCallback, useEffect } from "react";

export function triggerCreatureSpawn(type) {
  if (!type) return;
  const e = new CustomEvent("parks-spawn-creature", { detail: { type } });
  window.dispatchEvent(e);
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
  const event = new CustomEvent("parks-deploy-capsule", { detail: { type } });
  window.dispatchEvent(event);
}

export function DeploySequenceUI() {
  const [active, setActive] = useState(null);
  const [type, setType] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const t = e.detail && e.detail.type;
      if (t) {
        setType(t);
        setActive(true);
      }
    };
    window.addEventListener("parks-deploy-capsule", handler);
    return () => window.removeEventListener("parks-deploy-capsule", handler);
  }, []);

  const finish = useCallback(() => {
    if (type) triggerCreatureSpawn(type);
    setActive(false);
    setType(null);
    deployInProgress = false;
  }, [type]);

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
