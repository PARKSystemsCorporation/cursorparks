"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { getSocket } from "../../engine/socketClient";

// --- Types ---
export type ChatMessageType = "user" | "vendor" | "other";

export interface ChatMessage {
    id: string;
    sender: string;
    senderType: ChatMessageType;
    text: string;
    color: string; // for display in overlay
    timestamp: number;
}

const VENDOR_COLORS: Record<string, string> = {
    barker: "#ffaa00",
    broker: "#5ba8d4",
    smith: "#338855",
    fixer: "#6644aa",
    merchant: "#ff8800",
    coder: "#00ff9d",
};

interface ChatContextValue {
    messages: ChatMessage[];
    sendMessage: (text: string, targetVendorId?: string | null) => void;
    /** Send to global bazaar (ether); emits bazaar:shout and adds user message */
    sendToBazaar: (text: string, position?: { x: number; y: number; z: number }) => void;
    latestUserMessage: ChatMessage | null;
    latestVendorMessage: ChatMessage | null;
    /** For passing to chat API (environment context). */
    environmentContext: { timePhase: number; entityDensity: number; sceneId: string };
}

const ChatCtx = createContext<ChatContextValue>({
    messages: [],
    sendMessage: () => { },
    sendToBazaar: () => { },
    latestUserMessage: null,
    latestVendorMessage: null,
    environmentContext: { timePhase: 0.5, entityDensity: 0, sceneId: "bazaar" },
});

export function useChat() {
    return useContext(ChatCtx);
}

// --- Provider ---
export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [latestUserMessage, setLatestUserMessage] = useState<ChatMessage | null>(null);
    const [latestVendorMessage, setLatestVendorMessage] = useState<ChatMessage | null>(null);
    const [entityDensity, setEntityDensity] = useState(0);
    const idCounter = useRef(0);
    const envRef = useRef({ timePhase: 0.5, entityDensity: 0, sceneId: "bazaar" as string });
    envRef.current = { timePhase: 0.5, entityDensity, sceneId: "bazaar" };

    useEffect(() => {
        const socket = getSocket();
        const onPresence = (data: { online?: number }) => {
            if (typeof data?.online === "number") setEntityDensity(data.online);
        };
        socket.on("presence:update", onPresence);
        return () => {
            socket.off("presence:update", onPresence);
        };
    }, []);

    useEffect(() => {
        const socket = getSocket();
        const onNpcSpeak = (data: { npcId?: string; text?: string }) => {
            if (!data?.npcId || !data?.text) return;
            const vendorMsg: ChatMessage = {
                id: `chat-${++idCounter.current}`,
                sender: data.npcId.toUpperCase(),
                senderType: "vendor",
                text: data.text,
                color: VENDOR_COLORS[data.npcId] ?? "#ffaa00",
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, vendorMsg].slice(-50));
            setLatestVendorMessage(vendorMsg);
        };
        socket.on("npc:speak", onNpcSpeak);
        return () => {
            socket.off("npc:speak", onNpcSpeak);
        };
    }, []);

    useEffect(() => {
        const socket = getSocket();
        const onBazaarInit = (data: { messages?: Array<{ id?: number; content?: string; x?: number; y?: number; z?: number; timestamp?: number }> }) => {
            const raw = data?.messages;
            if (!Array.isArray(raw) || raw.length === 0) return;
            const hydrated: ChatMessage[] = raw.map((row) => ({
                id: `bazaar-${row.id ?? ++idCounter.current}`,
                sender: "Bazaar",
                senderType: "other" as const,
                text: row.content ?? "",
                color: "#e8d5b7",
                timestamp: row.timestamp ?? 0,
            })).filter((m) => m.text);
            setMessages((prev) => {
                const byId = new Map(prev.map((m) => [m.id, m]));
                hydrated.forEach((m) => byId.set(m.id, m));
                return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-50);
            });
        };
        socket.on("bazaar:init", onBazaarInit);
        return () => {
            socket.off("bazaar:init", onBazaarInit);
        };
    }, []);

    useEffect(() => {
        const socket = getSocket();
        const onBazaarShout = (data: { id?: number; content?: string; x?: number; y?: number; z?: number; timestamp?: number }) => {
            if (!data?.content) return;
            const msg: ChatMessage = {
                id: `bazaar-${data.id ?? ++idCounter.current}`,
                sender: "Bazaar",
                senderType: "other",
                text: data.content,
                color: "#e8d5b7",
                timestamp: data.timestamp ?? Date.now(),
            };
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg].slice(-50);
            });
        };
        socket.on("bazaar:shout", onBazaarShout);
        return () => {
            socket.off("bazaar:shout", onBazaarShout);
        };
    }, []);

    const environmentContext = envRef.current;

    const sendMessage = useCallback(
        (text: string, targetVendorId?: string | null) => {
            if (!text.trim()) return;

            const userMsg: ChatMessage = {
                id: `chat-${++idCounter.current}`,
                sender: "You",
                senderType: "user",
                text: text.trim(),
                color: "#00ff9d",
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, userMsg].slice(-50));
            setLatestUserMessage(userMsg);

            const activeVendors = targetVendorId
                ? [{ id: targetVendorId, color: VENDOR_COLORS[targetVendorId] ?? "#ffaa00" }]
                : [
                    { id: "barker", color: "#ffaa00" },
                    { id: "broker", color: "#5ba8d4" },
                ];

            const env = envRef.current;
            activeVendors.forEach((vendor, index) => {
                setTimeout(() => {
                    fetch("/api/aria/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            message: text,
                            vendorId: vendor.id,
                            timePhase: env.timePhase,
                            entityDensity: env.entityDensity,
                            sceneId: env.sceneId,
                        }),
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            if (data.response && data.response !== "...") {
                                const vendorMsg: ChatMessage = {
                                    id: `chat-${++idCounter.current}`,
                                    sender: vendor.id.toUpperCase(),
                                    senderType: "vendor",
                                    text: data.response,
                                    color: vendor.color,
                                    timestamp: Date.now(),
                                };
                                setMessages((prev) => [...prev, vendorMsg].slice(-50));
                                setLatestVendorMessage(vendorMsg);
                            }
                        })
                        .catch((err) => console.error(`Chat ARIA error (${vendor.id}):`, err));
                }, index * 800);
            });
        },
        []
    );

    const sendToBazaar = useCallback((text: string, position?: { x: number; y: number; z: number }) => {
        if (!text.trim()) return;
        const userMsg: ChatMessage = {
            id: `chat-${++idCounter.current}`,
            sender: "You",
            senderType: "user",
            text: text.trim(),
            color: "#ff6b1a",
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg].slice(-50));
        setLatestUserMessage(userMsg);
        const socket = getSocket();
        const pos = position ?? { x: 0, y: 1, z: -5 };
        socket.emit("bazaar:shout", { content: text.trim().slice(0, 140), x: pos.x, y: pos.y, z: pos.z });
    }, []);

    return (
        <ChatCtx.Provider value={{ messages, sendMessage, sendToBazaar, latestUserMessage, latestVendorMessage, environmentContext }}>
            {children}
        </ChatCtx.Provider>
    );
}
