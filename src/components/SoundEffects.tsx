"use client";

import { useCallback, useRef } from "react";

type Props = {
  enabled: boolean;
  onToggle: () => void;
  volume?: number;
};

// Generate sounds using Web Audio API (no external files needed)
function createAudioCtx(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

export function useSoundEffects(enabled: boolean, volume: number = 0.3) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = createAudioCtx();
    return ctxRef.current;
  }, []);

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = "sine") => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }, [enabled, volume, getCtx]);

  const playBuy = useCallback(() => {
    playTone(880, 0.1, "sine");
    setTimeout(() => playTone(1100, 0.08, "sine"), 60);
  }, [playTone]);

  const playSell = useCallback(() => {
    playTone(660, 0.1, "sine");
    setTimeout(() => playTone(440, 0.08, "sine"), 60);
  }, [playTone]);

  const playRankUp = useCallback(() => {
    playTone(523, 0.15, "sine");
    setTimeout(() => playTone(659, 0.15, "sine"), 120);
    setTimeout(() => playTone(784, 0.15, "sine"), 240);
    setTimeout(() => playTone(1047, 0.25, "sine"), 360);
  }, [playTone]);

  const playAchievement = useCallback(() => {
    playTone(784, 0.1, "triangle");
    setTimeout(() => playTone(988, 0.12, "triangle"), 100);
    setTimeout(() => playTone(1175, 0.15, "triangle"), 200);
  }, [playTone]);

  const playAlert = useCallback(() => {
    playTone(1000, 0.08, "square");
    setTimeout(() => playTone(1000, 0.08, "square"), 150);
  }, [playTone]);

  const playError = useCallback(() => {
    playTone(200, 0.15, "sawtooth");
  }, [playTone]);

  return { playBuy, playSell, playRankUp, playAchievement, playAlert, playError };
}

export function SoundToggle({ enabled, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`rounded-full border px-2.5 py-1 text-[10px] transition-all duration-200 ${
        enabled
          ? "border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan"
          : "border-white/10 text-white/25 hover:text-white/40"
      }`}
      title={enabled ? "Mute sounds" : "Enable sounds"}
    >
      {enabled ? "SFX ON" : "SFX OFF"}
    </button>
  );
}
