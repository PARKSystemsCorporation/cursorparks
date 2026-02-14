"use client";

import React, { useEffect, useState } from "react";

/** Shared mutable position — written by CameraPosEmitter (3D), read by CoordTracker (HTML). */
export const cameraPos = { x: 0, y: 0, z: 0 };

/** Clean XYZ coordinate tracker — reads from shared cameraPos ref at ~10fps. No events. */
export function CoordTracker() {
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      setCoords({ x: cameraPos.x, y: cameraPos.y, z: cameraPos.z });
    }, 100);
    return () => clearInterval(id);
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
