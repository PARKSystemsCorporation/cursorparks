"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { ModularCreature } from "@/src/modules/ui/inventory/CreatureMeshes";
import type { CreatureIdentity } from "@/src/modules/ui/inventory/CreatureMeshes";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false }
);

type Identity = {
  gender: string;
  role: string;
  head_type: string;
  body_type: string;
  tail_type: string;
  color_profile?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
  };
};

type RevealPayload = {
  id: string;
  creatureId: string;
  variant: string;
  identity?: Identity | null;
};

const COLORS = {
  bg: "rgba(10, 8, 6, 0.97)",
  border: "#8b6914",
  text: "#e8d5b7",
  accent: "#ff6b1a",
};

function shortId(creatureId: string): string {
  const parts = creatureId.split("-");
  return parts.length > 1 ? parts[parts.length - 1] : creatureId.slice(0, 8);
}

export function ExokinRevealOverlay() {
  const [payload, setPayload] = useState<RevealPayload | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: CustomEvent<RevealPayload>) => {
      setPayload(e.detail);
      setName(null);
      setLoadedIdentity(null);
    };
    window.addEventListener("exokin-deployed", handler as EventListener);
    return () => window.removeEventListener("exokin-deployed", handler as EventListener);
  }, []);

  const [loadedIdentity, setLoadedIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    if (!payload?.creatureId) return;
    let cancelled = false;
    fetch(`/api/exokin/creature?id=${encodeURIComponent(payload.creatureId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.name) setName(data.name);
        if (data && !payload.identity && data.head_type) {
          setLoadedIdentity({
            gender: data.gender,
            role: data.role,
            head_type: data.head_type,
            body_type: data.body_type,
            tail_type: data.tail_type,
            color_profile: data.color_profile ?? undefined,
          });
        } else {
          setLoadedIdentity(null);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadedIdentity(null);
      });
    return () => {
      cancelled = true;
      setLoadedIdentity(null);
    };
  }, [payload?.creatureId, payload?.identity]);

  const dismiss = useCallback(() => {
    setPayload(null);
    setName(null);
    setLoadedIdentity(null);
  }, []);

  if (!payload) return null;

  const identity = payload.identity ?? loadedIdentity;
  const primary = (identity?.color_profile?.primary as string) ?? "#3d3630";
  const secondary = (identity?.color_profile?.secondary as string) ?? "#4a4238";
  const displayName = name ?? `EXOKIN-${shortId(payload.creatureId)}`;
  const genderLabel = identity?.gender ? (identity.gender === "female" ? "Female" : "Male") : "—";

  const hasFullIdentity =
    identity &&
    identity.head_type &&
    identity.body_type &&
    identity.tail_type &&
    identity.color_profile;
  const creatureIdentity: CreatureIdentity | null = hasFullIdentity
    ? {
        gender: identity.gender,
        role: identity.role ?? (payload.variant === "warform" ? "warrior" : "companion"),
        head_type: identity.head_type,
        body_type: identity.body_type,
        tail_type: identity.tail_type,
        color_profile: identity.color_profile as CreatureIdentity["color_profile"],
      }
    : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at center, rgba(26, 22, 16, 0.95) 0%, rgba(10, 8, 6, 0.98) 100%)",
        padding: 24,
      }}
      onClick={dismiss}
      onKeyDown={(e) => e.key === "Escape" && dismiss()}
      role="dialog"
      aria-modal="true"
      aria-label="EXOKIN deployed"
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          border: `2px solid ${COLORS.border}`,
          borderRadius: 16,
          background: COLORS.bg,
          boxShadow: `0 0 60px rgba(139, 105, 20, 0.25), 0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`,
          overflow: "visible",
          transform: "scale(1.02)",
          transition: "transform 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pop-out creature: actual EXOKIN 3D or fallback circle */}
        <div
          style={{
            position: "relative",
            marginTop: -40,
            marginBottom: 8,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: 200,
          }}
        >
          {creatureIdentity ? (
            <div style={{ width: 200, height: 200, background: `linear-gradient(145deg, ${primary} 0%, ${secondary} 40%, ${primary} 100%)`, borderRadius: "50%", border: `4px solid ${COLORS.border}`, overflow: "hidden", boxShadow: `inset 0 2px 20px rgba(0,0,0,0.3), 0 0 40px rgba(139, 105, 20, 0.2)` }}>
              <Canvas
                camera={{ position: [0, 0.25, 0.75], fov: 42 }}
                gl={{ antialias: true, alpha: true }}
                style={{ width: "100%", height: "100%" }}
              >
                <ambientLight intensity={0.95} />
                <directionalLight position={[1.5, 1.5, 1.5]} intensity={1.1} />
                <group scale={[2.2, 2.2, 2.2]} position={[0, -0.05, 0]}>
                  <ModularCreature identity={creatureIdentity} />
                </group>
              </Canvas>
            </div>
          ) : (
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: `linear-gradient(145deg, ${primary} 0%, ${secondary} 50%, ${primary} 100%)`,
                border: `4px solid ${COLORS.border}`,
                boxShadow: `inset 0 2px 20px rgba(0,0,0,0.3), 0 0 40px rgba(139, 105, 20, 0.2), 0 12px 32px rgba(0,0,0,0.4)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 72,
                  color: identity?.color_profile?.accent ?? COLORS.accent,
                  filter: "drop-shadow(0 0 12px rgba(255,107,26,0.5))",
                }}
              >
                ◆
              </span>
            </div>
          )}
        </div>

        {/* Name — prominent like Porygon */}
        <h2
          style={{
            margin: 0,
            padding: "0 24px 8px",
            fontSize: "clamp(1.5rem, 5vw, 2rem)",
            fontWeight: 800,
            color: COLORS.text,
            textAlign: "center",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {displayName}
        </h2>

        {/* Gender — for color gauge */}
        <p
          style={{
            margin: 0,
            padding: "0 24px 16px",
            fontSize: 12,
            color: COLORS.text,
            opacity: 0.85,
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        >
          {genderLabel} · Color profile applied
        </p>

        <div
          style={{
            padding: "16px 24px 24px",
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <button
            type="button"
            onClick={dismiss}
            style={{
              width: "100%",
              padding: "12px 20px",
              background: COLORS.accent,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              color: "#0a0806",
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
