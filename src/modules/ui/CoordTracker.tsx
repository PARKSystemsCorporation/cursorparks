"use client";

import React, { useEffect, useRef, useState } from "react";

/** Clean XYZ coordinate tracker — reads camera position via custom event from 3D scene. */
export function CoordTracker() {
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });
  const rafRef = useRef<number | null>(null);
  const latest = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const handler = (e: CustomEvent<{ x: number; y: number; z: number }>) => {
      const d = e.detail;
      if (d) {
        latest.current.x = d.x;
        latest.current.y = d.y;
        latest.current.z = d.z;
      }
    };
    window.addEventListener("parks-camera-pos", handler as EventListener);

    // Throttle UI updates to ~10fps
    const tick = () => {
      setCoords({ ...latest.current });
      rafRef.current = window.setTimeout(tick, 100);
    };
    tick();

    return () => {
      window.removeEventListener("parks-camera-pos", handler as EventListener);
      if (rafRef.current !== null) clearTimeout(rafRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 12,
        left: 12,
        fontFamily: "monospace",
        fontSize: 11,
        color: "rgba(232, 213, 183, 0.55)",
        letterSpacing: "0.04em",
        lineHeight: 1.6,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 5,
      }}
    >
      <span style={{ opacity: 0.5 }}>X</span> {coords.x.toFixed(1)}{" "}
      <span style={{ opacity: 0.5 }}>Y</span> {coords.y.toFixed(1)}{" "}
      <span style={{ opacity: 0.5 }}>Z</span> {coords.z.toFixed(1)}
    </div>
  );
}
