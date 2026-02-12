"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

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

interface ChatContextValue {
    messages: ChatMessage[];
    sendMessage: (text: string, targetVendorId?: string | null) => void;
    latestUserMessage: ChatMessage | null;
    latestVendorMessage: ChatMessage | null;
}

const ChatCtx = createContext<ChatContextValue>({
    messages: [],
    sendMessage: () => { },
    latestUserMessage: null,
    latestVendorMessage: null,
});

export function useChat() {
    return useContext(ChatCtx);
}

// --- Provider ---
export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [latestUserMessage, setLatestUserMessage] = useState<ChatMessage | null>(null);
    const [latestVendorMessage, setLatestVendorMessage] = useState<ChatMessage | null>(null);
    const idCounter = useRef(0);

    const sendMessage = useCallback(
        (text: string, targetVendorId?: string | null) => {
            if (!text.trim()) return;

            // User message
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

            // Call ARIA API for vendor response
            const vendorId = targetVendorId || "barker"; // default vendor
            fetch("/api/aria/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, vendorId }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.response && data.response !== "...") {
                        const vendorMsg: ChatMessage = {
                            id: `chat-${++idCounter.current}`,
                            sender: vendorId.toUpperCase(),
                            senderType: "vendor",
                            text: data.response,
                            color: "#ffaa00",
                            timestamp: Date.now(),
                        };
                        setMessages((prev) => [...prev, vendorMsg].slice(-50));
                        setLatestVendorMessage(vendorMsg);
                    }
                })
                .catch((err) => console.error("Chat ARIA error:", err));
        },
        []
    );

    return (
        <ChatCtx.Provider value={{ messages, sendMessage, latestUserMessage, latestVendorMessage }}>
            {children}
        </ChatCtx.Provider>
    );
}
