"use client";

import { useEffect, useRef } from "react";
import type { Bar } from "../engine/types";

type Props = {
  bars: Bar[];
  price: number;
};

export function ChartCanvas({ bars, price }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, w, h);

    if (!bars.length) return;

    const maxBars = 80;
    const slice = bars.slice(-maxBars);
    const min = Math.min(...slice.map((b) => b.l));
    const max = Math.max(...slice.map((b) => b.h));
    const range = Math.max(2, max - min);
    const yMin = min - range * 0.1;
    const yMax = max + range * 0.1;

    const pad = { l: 8, r: 44, t: 8, b: 12 };
    const pw = w - pad.l - pad.r;
    const ph = h - pad.t - pad.b;
    const gap = pw / maxBars;
    const bw = Math.max(2, gap * 0.6);

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i * 0.25) * ph;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
    }

    const toY = (p: number) => pad.t + (1 - (p - yMin) / (yMax - yMin)) * ph;
    slice.forEach((b, i) => {
      const x = pad.l + (maxBars - slice.length + i + 0.5) * gap;
      const up = b.c >= b.o;
      ctx.strokeStyle = up ? "#00ff9d" : "#ff3355";
      ctx.fillStyle = up ? "#00ff9d" : "#ff3355";
      ctx.beginPath();
      ctx.moveTo(x, toY(b.h));
      ctx.lineTo(x, toY(b.l));
      ctx.stroke();
      const top = Math.min(toY(b.o), toY(b.c));
      const bottom = Math.max(toY(b.o), toY(b.c));
      ctx.fillRect(x - bw / 2, top, bw, Math.max(1, bottom - top));
    });

    const py = toY(price);
    ctx.strokeStyle = "rgba(34,211,238,0.7)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.l, py);
    ctx.lineTo(w - pad.r, py);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(w - pad.r, py - 9, pad.r, 18);
    ctx.fillStyle = "#0a0a12";
    ctx.font = "bold 10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`$${price.toFixed(2)}`, w - pad.r / 2, py + 4);
  }, [bars, price]);

  return <canvas ref={ref} className="h-full w-full" />;
}
