"use client";

import React, { useEffect, useRef } from "react";
import { useChat } from "./ChatContext";

/** Twitch/YouTube-style streamer chat overlay — bottom right, transparent. */
export default function StreamerChatOverlay() {
    const { messages } = useChat();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to newest message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (messages.length === 0) return null;

    return (
        <div className="streamer-chat-overlay">
            <div className="streamer-chat-header">LIVE CHAT</div>
            <div className="streamer-chat-messages" ref={scrollRef}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`streamer-chat-message streamer-chat-message-${msg.senderType}`}
                    >
                        <span
                            className="streamer-chat-sender"
                            style={{ color: msg.color }}
                        >
                            {msg.sender}
                        </span>
                        <span className="streamer-chat-text">{msg.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
