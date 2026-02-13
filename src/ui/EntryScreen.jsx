"use client";

import React, { useState, useCallback } from "react";
import {
  createGuestSessionId,
  isFirstTimeUser,
  enterWithHandle,
} from "@/src/state/introFlow";

const STYLES = {
  screen: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #0a0806 0%, #141210 50%, #0d0b09 100%)",
    color: "#c8b8a8",
    fontFamily: "monospace",
  },
  title: {
    fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
    fontWeight: 700,
    letterSpacing: "0.35em",
    textTransform: "uppercase",
    color: "#e8dcc8",
    marginBottom: "3rem",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    width: "100%",
    maxWidth: 280,
  },
  button: {
    padding: "14px 24px",
    border: "2px solid #5c5044",
    background: "rgba(28, 24, 20, 0.9)",
    color: "#e0d4c4",
    fontSize: "11px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s, color 0.2s",
  },
  buttonHover: {
    borderColor: "#8b7355",
    background: "rgba(44, 38, 32, 0.95)",
    color: "#f0e6d8",
  },
  input: {
    width: "100%",
    maxWidth: 280,
    padding: "12px 16px",
    marginBottom: "1rem",
    border: "2px solid #5c5044",
    background: "rgba(20, 18, 16, 0.95)",
    color: "#e0d4c4",
    fontSize: "14px",
    fontFamily: "monospace",
    outline: "none",
  },
  error: {
    marginTop: "0.75rem",
    fontSize: "11px",
    color: "#b85450",
    maxWidth: 280,
    textAlign: "center",
  },
};

export default function EntryScreen({ onEnter, onFirstTimeIntro }) {
  const [mode, setMode] = useState(null);
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showForgotHelp, setShowForgotHelp] = useState(false);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      const trimmed = handle.trim();
      if (!trimmed) {
        setError("Handle required.");
        return;
      }
      if (!password) {
        setError("Password required.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (mode === "create" && password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setBusy(true);
      try {
        await enterWithHandle(trimmed, password);
        const firstTime = isFirstTimeUser();
        onEnter({ type: "handle", handle: trimmed });
        if (firstTime && onFirstTimeIntro) onFirstTimeIntro();
      } catch (err) {
        setError(err.message || "Enter failed.");
      } finally {
        setBusy(false);
      }
    },
    [handle, password, confirmPassword, mode, onEnter, onFirstTimeIntro]
  );

  const handleGuest = useCallback(() => {
    createGuestSessionId();
    const firstTime = isFirstTimeUser();
    onEnter({ type: "guest" });
    if (firstTime && onFirstTimeIntro) onFirstTimeIntro();
  }, [onEnter, onFirstTimeIntro]);

  if (mode === "signin" || mode === "create") {
    return (
      <div style={STYLES.screen}>
        <div style={STYLES.title}>PARKS BAZAAR</div>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <input
            type="text"
            placeholder="Handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            style={STYLES.input}
            autoFocus
            disabled={busy}
            maxLength={64}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={STYLES.input}
            disabled={busy}
            minLength={6}
            autoComplete={mode === "create" ? "new-password" : "current-password"}
          />
          {mode === "create" && (
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={STYLES.input}
              disabled={busy}
              minLength={6}
              autoComplete="new-password"
            />
          )}
          {error && <div style={STYLES.error}>{error}</div>}
          <div style={{ ...STYLES.buttonGroup, marginTop: "0.5rem" }}>
            <button
              type="submit"
              style={STYLES.button}
              disabled={busy}
              onMouseEnter={(e) => Object.assign(e.target.style, STYLES.buttonHover)}
              onMouseLeave={(e) => {
                e.target.style.borderColor = STYLES.button.border;
                e.target.style.background = STYLES.button.background;
                e.target.style.color = STYLES.button.color;
              }}
            >
              {busy ? "..." : mode === "create" ? "Create & Enter" : "Sign In"}
            </button>
            <button
              type="button"
              style={STYLES.button}
              onClick={() => {
                setMode(null);
                setHandle("");
                setPassword("");
                setConfirmPassword("");
                setError(null);
                setShowForgotHelp(false);
              }}
              onMouseEnter={(e) => Object.assign(e.target.style, STYLES.buttonHover)}
              onMouseLeave={(e) => {
                e.target.style.borderColor = STYLES.button.border;
                e.target.style.background = STYLES.button.background;
                e.target.style.color = STYLES.button.color;
              }}
            >
              Back
            </button>
          </div>
          <button
            type="button"
            style={{ ...STYLES.button, background: "transparent", border: "none", fontSize: "10px", marginTop: "0.5rem" }}
            onClick={() => setShowForgotHelp(!showForgotHelp)}
          >
            Forgot password?
          </button>
          {showForgotHelp && (
            <div style={{ ...STYLES.error, color: "#8b7355", marginTop: "0.25rem", fontSize: "10px" }}>
              Contact support to reset your password.
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div style={STYLES.screen}>
      <div style={STYLES.title}>PARKS BAZAAR</div>
      <div style={STYLES.buttonGroup}>
        <button
          style={STYLES.button}
          onClick={() => setMode("signin")}
          onMouseEnter={(e) => Object.assign(e.target.style, STYLES.buttonHover)}
          onMouseLeave={(e) => {
            e.target.style.borderColor = STYLES.button.border;
            e.target.style.background = STYLES.button.background;
            e.target.style.color = STYLES.button.color;
          }}
        >
          Sign In
        </button>
        <button
          style={STYLES.button}
          onClick={() => setMode("create")}
          onMouseEnter={(e) => Object.assign(e.target.style, STYLES.buttonHover)}
          onMouseLeave={(e) => {
            e.target.style.borderColor = STYLES.button.border;
            e.target.style.background = STYLES.button.background;
            e.target.style.color = STYLES.button.color;
          }}
        >
          Create Handle
        </button>
        <button
          style={STYLES.button}
          onClick={handleGuest}
          onMouseEnter={(e) => Object.assign(e.target.style, STYLES.buttonHover)}
          onMouseLeave={(e) => {
            e.target.style.borderColor = STYLES.button.border;
            e.target.style.background = STYLES.button.background;
            e.target.style.color = STYLES.button.color;
          }}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
