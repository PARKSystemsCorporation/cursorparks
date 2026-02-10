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
            <button type="submit">SHOUT</button>
        </form>
    );
}
