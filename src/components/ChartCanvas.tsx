"use client";

import { useEffect, useRef, useState } from "react";
import type { Bar } from "../engine/types";
import { usePriceDirection } from "../hooks/usePriceDirection";

type Props = {
  bars: Bar[];
  price: number;
  showSMA?: boolean;
  avgPrice?: number;
};

export function ChartCanvas({ bars, price, showSMA, avgPrice }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const prevPriceRef = useRef(price);
  const priceDirection = usePriceDirection(price);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: parent.clientWidth, h: parent.clientHeight });
    });
    ro.observe(parent);
    setSize({ w: parent.clientWidth, h: parent.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // Optimization: Throttled render loop to sync with display refresh
    // and avoid over-rendering on fast sockets

    const render = () => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const { w, h } = size;
      if (!w || !h) return;
      const dpr = window.devicePixelRatio || 1;

      // Check if resize needed
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Draw Background
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, w, h);

      if (!bars.length) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText("Waiting for market...", w / 2, h / 2);
        return;
      }

      const maxBars = 80;
      const slice = bars.slice(-maxBars);
      let min = Infinity, max = -Infinity;
      for (let i = 0; i < slice.length; i++) {
        const b = slice[i];
        if (b.l < min) min = b.l;
        if (b.h > max) max = b.h;
      }
      const range = Math.max(2, max - min);
      const yMin = min - range * 0.1;
      const yMax = max + range * 0.1;

      const pad = { l: 8, r: 44, t: 8, b: 12 };
      const pw = w - pad.l - pad.r;
      const ph = h - pad.t - pad.b;
      const gap = pw / maxBars;
      const bw = Math.max(2, gap * 0.6);

      const toY = (p: number) => pad.t + (1 - (p - yMin) / (yMax - yMin)) * ph;

      // Draw Grid
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (i * 0.25) * ph;
        ctx.moveTo(pad.l, y);
        ctx.lineTo(w - pad.r, y);
      }
      ctx.stroke();

      // Draw Candles & Wicks
      // Optimization: Batch paths
      const upPath = new Path2D();
      const downPath = new Path2D();
      const upFill = new Path2D();
      const downFill = new Path2D();

      slice.forEach((b, i) => {
        const x = pad.l + (maxBars - slice.length + i + 0.5) * gap;
        const up = b.c >= b.o;
        const lineP = up ? upPath : downPath;
        const fillP = up ? upFill : downFill;

        const yH = Math.floor(toY(b.h));
        const yL = Math.floor(toY(b.l));
        const yO = Math.floor(toY(b.o));
        const yC = Math.floor(toY(b.c));

        lineP.moveTo(Math.floor(x) + 0.5, yH);
        lineP.lineTo(Math.floor(x) + 0.5, yL);

        const top = Math.min(yO, yC);
        const bottom = Math.max(yO, yC);
        const height = Math.max(1, bottom - top);
        fillP.rect(Math.floor(x - bw / 2), top, bw, height);
      });

      ctx.strokeStyle = "#00ff9d";
      ctx.fillStyle = "#00ff9d";
      ctx.stroke(upPath);
      ctx.fill(upFill);

      ctx.strokeStyle = "#ff3355";
      ctx.fillStyle = "#ff3355";
      ctx.stroke(downPath);
      ctx.fill(downFill);

      // Draw Avg Price
      if (avgPrice !== undefined && avgPrice > 0) {
        const ay = toY(avgPrice);
        if (ay >= -20 && ay <= h + 20) {
          ctx.strokeStyle = "rgba(91,141,239,0.45)";
          ctx.setLineDash([2, 6]);
          ctx.beginPath();
          ctx.moveTo(pad.l, ay);
          ctx.lineTo(w - pad.r, ay);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#5b8def";
          ctx.font = "bold 9px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.textAlign = "left";
          ctx.fillText(`AVG ${avgPrice.toFixed(2)}`, pad.l + 4, ay - 4);
        }
      }

      // Draw SMA
      if (showSMA) {
        ctx.strokeStyle = "rgba(91,141,239,0.9)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        let first = true;
        const period = 20;
        let smaSum = 0;
        for (let i = 0; i < slice.length; i++) {
          smaSum += slice[i].c;
          if (i >= period) smaSum -= slice[i - period].c;
          if (i < period - 1) continue;
          const sma = smaSum / period;
          const x = pad.l + (maxBars - slice.length + i + 0.5) * gap;
          const y = toY(sma);
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
        if (!first) ctx.stroke();
      }

      // Draw Price Line
      const py = toY(price);
      const priceColor = priceDirection === "up" ? "rgba(0,255,157,0.7)" : priceDirection === "down" ? "rgba(255,51,85,0.7)" : "rgba(34,211,238,0.7)";

      ctx.strokeStyle = priceColor;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.l, py);
      ctx.lineTo(w - pad.r, py);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = priceColor;
      ctx.fillRect(w - pad.r, py - 9, pad.r, 18);
      ctx.fillStyle = "#0a0a12";
      ctx.font = "bold 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`$${price.toFixed(2)}`, w - pad.r / 2, py + 4);

      prevPriceRef.current = price;
    };

    const loop = () => {
      render();
    };
    const rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [bars, price, showSMA, avgPrice, size, priceDirection]);

  return (
    <canvas
      ref={ref}
      className="h-full w-full transition-opacity duration-200"
      style={{
        filter: priceDirection === "up"
          ? "drop-shadow(0 0 2px rgba(0,255,157,0.3))"
          : priceDirection === "down"
            ? "drop-shadow(0 0 2px rgba(255,51,85,0.3))"
            : "none"
      }}
    />
  );
}
