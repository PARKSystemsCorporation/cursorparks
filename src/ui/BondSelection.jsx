"use client";

import React, { useCallback } from "react";
import Capsule from "./Capsule";
import { deployCapsule } from "./DeploySequence";

const STYLES = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 97,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.6)",
  },
  panel: {
    maxWidth: 480,
    width: "90%",
    padding: "32px 28px",
    background: "rgba(20, 18, 16, 0.98)",
    border: "1px solid #4a4238",
    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
    fontFamily: "monospace",
  },
  title: {
    fontSize: "10px",
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "#6b5d4d",
    marginBottom: "24px",
    textAlign: "center",
  },
  row: {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  col: {
    flex: "1 1 180px",
    minWidth: 0,
  },
};

export default function BondSelection({ onDeploy, onCancel }) {
  const handleDeploy = useCallback(
    (type) => {
      deployCapsule(type);
      onDeploy && onDeploy(type);
    },
    [onDeploy]
  );

  return (
    <div style={STYLES.overlay}>
      <div style={STYLES.panel}>
        <div style={STYLES.title}>Select bond</div>
        <div style={STYLES.row}>
          <div style={STYLES.col}>
            <Capsule
              label="WARFORM"
              sublabel="Combat frame"
              type="warform"
              onDeploy={handleDeploy}
            />
          </div>
          <div style={STYLES.col}>
            <Capsule
              label="COMPANION"
              sublabel="Support unit"
              type="companion"
              onDeploy={handleDeploy}
            />
          </div>
        </div>
        {onCancel && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: "8px 16px",
                border: "1px solid #4a4238",
                background: "transparent",
                color: "#7a6e5e",
                fontSize: "10px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
