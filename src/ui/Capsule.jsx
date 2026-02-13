"use client";

import React, { useState, useCallback } from "react";

const STYLES = {
  capsule: {
    position: "relative",
    width: "100%",
    padding: "24px 20px",
    border: "2px solid #4a4238",
    background: "rgba(24, 22, 20, 0.95)",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
  },
  capsuleHover: {
    borderColor: "#6b5d4d",
    background: "rgba(32, 28, 24, 0.98)",
    boxShadow: "0 0 0 1px rgba(139, 115, 85, 0.3)",
  },
  capsuleHighlight: {
    borderColor: "#8b7355",
    background: "rgba(36, 32, 28, 0.98)",
    boxShadow: "0 0 0 2px rgba(139, 115, 85, 0.4)",
  },
  title: {
    fontSize: "12px",
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: "#c8b8a8",
    marginBottom: "6px",
  },
  sub: {
    fontSize: "10px",
    letterSpacing: "0.12em",
    color: "#7a6e5e",
  },
};

export default function Capsule({ label, sublabel, type, onDeploy }) {
  const [hover, setHover] = useState(false);
  const [highlight, setHighlight] = useState(false);

  const handleClick = useCallback(() => {
    if (onDeploy) onDeploy(type);
  }, [type, onDeploy]);

  const style = {
    ...STYLES.capsule,
    ...(highlight ? STYLES.capsuleHighlight : hover ? STYLES.capsuleHover : {}),
  };

  return (
    <button
      type="button"
      style={style}
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setHighlight(false);
      }}
      onFocus={() => setHighlight(true)}
      onBlur={() => setHighlight(false)}
    >
      <div style={STYLES.title}>{label}</div>
      {sublabel && <div style={STYLES.sub}>{sublabel}</div>}
    </button>
  );
}
