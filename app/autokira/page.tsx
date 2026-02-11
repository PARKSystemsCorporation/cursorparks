"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// KIRA API — connects to local KIRA instance via tunnel
// Set this to your cloudflare tunnel URL or ngrok URL
const KIRA_API = process.env.NEXT_PUBLIC_KIRA_API || "http://localhost:7842";
const MODES = ["learning", "writing", "coding", "research", "companion"] as const;
type Mode = (typeof MODES)[number];

interface Message {
  role: "user" | "kira" | "system" | "error";
  text: string;
  time: number;
}

interface LearningEvent {
  type: string;
  domain: string;
  summary: string;
  time: number;
}

export default function AutoKira() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", text: "AutoKira Remote — connecting to KIRA...", time: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("learning");
  const [online, setOnline] = useState(false);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [showEvents, setShowEvents] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Status polling
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${KIRA_API}/api/status`);
        const d = await r.json();
        setOnline(true);
        setMode(d.active_mode || "learning");
        setStats(d.memory || {});
      } catch {
        setOnline(false);
      }
    };
    check();
    const iv = setInterval(check, 5000);
    return () => clearInterval(iv);
  }, []);

  // WebSocket
  useEffect(() => {
    const connect = () => {
      try {
        const wsUrl = KIRA_API.replace("http", "ws") + "/ws";
        const ws = new WebSocket(wsUrl);
        ws.onmessage = (e) => {
          try {
            const d = JSON.parse(e.data);
            if (d.type === "chat_response") {
              setMessages((m) => [
                ...m.filter((msg) => msg.role !== "system" || !msg.text.includes("thinking")),
                { role: "kira", text: d.response, time: Date.now() },
              ]);
              setSending(false);
            } else if (d.type === "event") {
              setEvents((ev) => [d.data, ...ev].slice(0, 50));
            }
          } catch {}
        };
        ws.onclose = () => setTimeout(connect, 3000);
        ws.onerror = () => ws.close();
        wsRef.current = ws;
      } catch {
        setTimeout(connect, 5000);
      }
    };
    connect();
    return () => wsRef.current?.close();
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", text, time: Date.now() },
      { role: "system", text: "KIRA is thinking...", time: Date.now() },
    ]);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "chat", message: text }));
    } else {
      try {
        const r = await fetch(`${KIRA_API}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const d = await r.json();
        setMessages((m) => [
          ...m.filter((msg) => msg.role !== "system" || !msg.text.includes("thinking")),
          { role: "kira", text: d.response || d.error || "No response", time: Date.now() },
        ]);
      } catch {
        setMessages((m) => [
          ...m.filter((msg) => msg.role !== "system"),
          { role: "error", text: "Failed to reach KIRA", time: Date.now() },
        ]);
      }
      setSending(false);
    }
  }, [input, sending]);

  const switchMode = async (m: Mode) => {
    try {
      const r = await fetch(`${KIRA_API}/api/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: m }),
      });
      const d = await r.json();
      if (d.current) {
        setMode(d.current);
        setMessages((msgs) => [
          ...msgs,
          { role: "system", text: `Mode: ${d.current}`, time: Date.now() },
        ]);
      }
    } catch {}
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ ...styles.dot, background: online ? "#4ec9b0" : "#f14c4c" }} />
          <h1 style={styles.title}>
            KIRA <span style={styles.subtitle}>AutoKira</span>
          </h1>
        </div>
        <span style={styles.statusText}>{online ? `${mode} mode` : "Offline"}</span>
      </div>

      {/* Mode bar */}
      <div style={styles.modesBar}>
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              ...styles.modeBtn,
              ...(mode === m ? styles.modeBtnActive : {}),
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={styles.statsBar}>
        <span>
          Knowledge: <strong style={{ color: "#4fc1ff" }}>{stats.knowledge_blocks || 0}</strong>
        </span>
        <span>
          Events: <strong style={{ color: "#4fc1ff" }}>{stats.events || 0}</strong>
        </span>
      </div>

      {/* Chat */}
      <div ref={chatRef} style={styles.chat}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.msg,
              ...(msg.role === "user"
                ? styles.msgUser
                : msg.role === "kira"
                  ? styles.msgKira
                  : msg.role === "error"
                    ? styles.msgError
                    : styles.msgSystem),
            }}
          >
            {(msg.role === "user" || msg.role === "kira") && (
              <div
                style={{
                  ...styles.label,
                  color: msg.role === "kira" ? "#4ec9b0" : "rgba(255,255,255,.7)",
                }}
              >
                {msg.role === "kira" ? "KIRA" : "YOU"}
              </div>
            )}
            <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Message KIRA..."
          rows={1}
          style={styles.textarea}
        />
        <button onClick={send} disabled={sending || !online} style={styles.sendBtn}>
          &#9654;
        </button>
      </div>

      {/* Events toggle */}
      <button onClick={() => setShowEvents(!showEvents)} style={styles.evToggle}>
        &#9889;
      </button>

      {/* Events panel */}
      {showEvents && (
        <div style={styles.evPanel}>
          <div style={styles.evHead}>
            <h3 style={{ fontSize: 13, color: "#4fc1ff" }}>Learning Events</h3>
            <button onClick={() => setShowEvents(false)} style={styles.evClose}>
              &times;
            </button>
          </div>
          <div style={styles.evList}>
            {events.map((ev, i) => (
              <div key={i} style={styles.evItem}>
                <div style={{ color: "#4ec9b0", fontWeight: 600, fontSize: 10, textTransform: "uppercase" as const }}>
                  {ev.type} — {ev.domain}
                </div>
                <div style={{ marginTop: 2 }}>{ev.summary}</div>
                <div style={{ color: "#888", fontSize: 10, marginTop: 2 }}>
                  {new Date(ev.time * 1000).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", height: "100vh", maxWidth: 600, margin: "0 auto", background: "#121212", color: "#ccc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#1a1a1a", borderBottom: "1px solid #333" },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block" },
  title: { fontSize: 16, fontWeight: 600, color: "#4fc1ff", margin: 0 },
  subtitle: { color: "#888", fontWeight: 400, fontSize: 12, marginLeft: 8 },
  statusText: { fontSize: 11, color: "#888" },
  modesBar: { display: "flex", gap: 6, padding: "8px 16px", background: "#1a1a1a", borderBottom: "1px solid #333", overflowX: "auto" as const },
  modeBtn: { padding: "5px 12px", borderRadius: 16, border: "1px solid #333", background: "transparent", color: "#888", fontSize: 11, cursor: "pointer" },
  modeBtnActive: { background: "#007acc", color: "#fff", borderColor: "#007acc" },
  statsBar: { display: "flex", gap: 16, padding: "8px 16px", background: "#121212", borderBottom: "1px solid #333", fontSize: 11, color: "#888" },
  chat: { flex: 1, overflowY: "auto" as const, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 },
  msg: { maxWidth: "88%", padding: "10px 14px", borderRadius: 10, fontSize: 14, lineHeight: 1.5, wordWrap: "break-word" as const },
  msgUser: { alignSelf: "flex-end", background: "#007acc", color: "#fff", borderBottomRightRadius: 4 },
  msgKira: { alignSelf: "flex-start", background: "#222", color: "#ccc", borderBottomLeftRadius: 4 },
  msgSystem: { alignSelf: "center", background: "transparent", color: "#888", fontSize: 12, textAlign: "center" as const, padding: 4 },
  msgError: { alignSelf: "center", background: "rgba(241,76,76,.15)", color: "#f14c4c", fontSize: 12 },
  label: { fontSize: 10, fontWeight: 600, marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  inputArea: { display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 16px", background: "#1a1a1a", borderTop: "1px solid #333" },
  textarea: { flex: 1, background: "#2a2a2a", border: "1px solid #333", borderRadius: 10, color: "#ccc", padding: "10px 14px", fontSize: 14, fontFamily: "inherit", resize: "none" as const, outline: "none", maxHeight: 120, minHeight: 42, lineHeight: 1.4 },
  sendBtn: { width: 42, height: 42, borderRadius: "50%", border: "none", background: "#007acc", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  evToggle: { position: "fixed" as const, bottom: 76, right: 16, width: 36, height: 36, borderRadius: "50%", border: "1px solid #333", background: "#222", color: "#888", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 },
  evPanel: { position: "fixed" as const, bottom: 0, left: 0, right: 0, height: "50%", background: "#1a1a1a", borderTop: "2px solid #007acc", zIndex: 20, display: "flex", flexDirection: "column" },
  evHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #333" },
  evClose: { background: "none", border: "none", color: "#888", fontSize: 18, cursor: "pointer" },
  evList: { flex: 1, overflowY: "auto" as const, padding: "8px 16px" },
  evItem: { padding: "8px 0", borderBottom: "1px solid #333", fontSize: 12 },
};
