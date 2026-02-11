"use client";

import { useEffect, useRef, useState } from "react";

export default function MarketSoundscape() {
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const [muted, setMuted] = useState(true);

    useEffect(() => {
        if (muted) return;

        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = ctx;

        const gain = ctx.createGain();
        gain.gain.value = 0.04;
        gain.connect(ctx.destination);
        gainRef.current = gain;

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 110;
        osc.connect(gain);
        osc.start();
        oscillatorRef.current = osc;

        return () => {
            osc.stop();
            ctx.close();
        };
    }, [muted]);

    return (
        <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            style={{
                position: "absolute",
                bottom: 60,
                right: 20,
                zIndex: 100,
                padding: "4px 10px",
                fontSize: 11,
                opacity: 0.6,
                background: "#222",
                color: "#aaa",
                border: "1px solid #444",
                borderRadius: 4,
                cursor: "pointer",
            }}
            title="Toggle ambient sound"
        >
            {muted ? "🔇 Sound Off" : "🔊 Sound On"}
        </button>
    );
}
