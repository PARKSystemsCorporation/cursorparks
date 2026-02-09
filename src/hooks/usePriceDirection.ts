"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hook to detect price direction changes for animation triggers
 */
export function usePriceDirection(price: number): "up" | "down" | "same" {
  const [direction, setDirection] = useState<"up" | "down" | "same">("same");
  const prevPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevPriceRef.current === null) {
      prevPriceRef.current = price;
      return;
    }

    if (price > prevPriceRef.current) {
      setDirection("up");
    } else if (price < prevPriceRef.current) {
      setDirection("down");
    } else {
      setDirection("same");
    }

    prevPriceRef.current = price;
  }, [price]);

  return direction;
}
