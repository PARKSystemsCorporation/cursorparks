"use client";

import { useEffect, useState } from "react";

// Shared Animation Loop Manager
// Reduces overhead of multiple requestAnimationFrames running simultaneously
const listeners = new Set<(t: number) => void>();
let rafId: number | null = null;

function masterLoop(time: number) {
  if (listeners.size === 0) {
    rafId = null;
    return;
  }
  listeners.forEach(cb => cb(time));
  rafId = requestAnimationFrame(masterLoop);
}

function register(cb: (t: number) => void) {
  listeners.add(cb);
  if (rafId === null) {
    rafId = requestAnimationFrame(masterLoop);
  }
}

function unregister(cb: (t: number) => void) {
  listeners.delete(cb);
}

/**
 * Hook for smooth number animations
 * Uses a shared rAF loop for performance
 */
export function useAnimatedNumber(
  value: number,
  duration: number = 300,
  decimals: number = 2
): { displayValue: string; isAnimating: boolean } {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // If already at target, do nothing
    // We use a small epsilon for float comparison equivalence
    if (Math.abs(displayValue - value) < 0.0001) {
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    let startTime: number | null = null;
    const startVal = displayValue;
    const endVal = value;

    const onFrame = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;

      setDisplayValue(current);

      if (progress >= 1) {
        setIsAnimating(false);
        unregister(onFrame);
        setDisplayValue(endVal); // Ensure exact final value
      }
    };

    register(onFrame);
    return () => unregister(onFrame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]); // dependency on displayValue removed to prevent infinite loop re-subscriptions

  const formatted = decimals === 0
    ? displayValue.toFixed(0)
    : displayValue.toFixed(decimals);

  return { displayValue: formatted, isAnimating };
}
