"use client";

import React, { useState, useCallback, useEffect } from "react";
import { triggerCreatureSpawn as triggerSpawnWithIdentity } from "@/src/systems/creature/generator";
import { ExokinNamingScreen } from "@/src/ui/ExokinNamingScreen";

export function triggerCreatureSpawn(type) {
  if (!type) return;
  window.dispatchEvent(new CustomEvent("parks-spawn-creature", { detail: { type } }));
}

let deployInProgress = false;

export function deployCapsule(type) {
  if (deployInProgress) return;
  deployInProgress = true;
  window.dispatchEvent(new CustomEvent("parks-deploy-capsule", { detail: { type } }));
}

/** Coordinates deploy flow: listens for parks-deploy-wallet-card, shows naming only if creature has no name, then triggers spawn. No floating visuals. */
export function DeploySequenceUI() {
  const [payload, setPayload] = useState({ type: null, position: null, creatureId: null, gender: null });
  const [phase, setPhase] = useState("idle"); // "idle" | "naming" | "spawning"

  useEffect(() => {
    const onCapsule = (e) => {
      const t = e.detail?.type;
      if (t) {
        setPayload({ type: t, position: null, creatureId: null, gender: null });
        setPhase("spawning");
      }
    };
    const onWallet = async (e) => {
      const d = e.detail;
      if (!d?.type) return;
      const creatureId = d.creatureId ?? null;
      const position = d.position ?? null;
      const gender = d.gender === "male" || d.gender === "female" ? d.gender : null;
      setPayload({ type: d.type, position, creatureId, gender });

      if (creatureId && position) {
        try {
          const res = await fetch(`/api/exokin/creature?id=${encodeURIComponent(creatureId)}`);
          const data = res.ok ? await res.json() : null;
          const needsNaming = !data || !data.name;
          if (needsNaming) {
            setPhase("naming");
            return;
          }
        } catch (_) {}
      }
      setPhase("spawning");
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
    setPayload({ type: null, position: null, creatureId: null, gender: null });
    setPhase("idle");
    deployInProgress = false;
  }, [payload.type, payload.creatureId, payload.position]);

  useEffect(() => {
    if (phase !== "spawning" || !payload.type) return;
    finish();
  }, [phase, payload.type, finish]);

  const handleNamingSubmit = useCallback(
    async (data) => {
      const { name, gender } = data;
      if (!payload.creatureId || !payload.type) return;
      try {
        await fetch("/api/exokin/creature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatureId: payload.creatureId,
            name,
            gender,
            type: payload.type,
          }),
        });
        triggerSpawnWithIdentity(payload.type, {
          creatureId: payload.creatureId,
          position: payload.position,
          identityOverride: { gender },
        });
      } finally {
        setPayload({ type: null, position: null, creatureId: null, gender: null });
        setPhase("idle");
        deployInProgress = false;
      }
    },
    [payload.creatureId, payload.type, payload.position]
  );

  if (phase === "naming" && payload.creatureId && payload.type) {
    return (
      <ExokinNamingScreen
        type={payload.type}
        creatureId={payload.creatureId}
        position={payload.position}
        initialGender={payload.gender}
        onSubmit={handleNamingSubmit}
      />
    );
  }

  return null;
}
