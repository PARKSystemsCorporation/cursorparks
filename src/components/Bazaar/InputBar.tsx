"use client";

import React, { useState } from "react";

interface InputBarProps {
    onShout: (text: string) => void;
}

export default function InputBar({ onShout }: InputBarProps) {
    const [text, setText] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        onShout(text);
        setText("");
    };

    return (
        <form className="bazaar-input-bar" onSubmit={handleSubmit}>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="SHOUT INTO THE VOID..."
                maxLength={140}
                autoFocus
            />
            <button type="submit" aria-label="Send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            </button>
        </form>
    );
}
