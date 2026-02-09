"use client";

import { useEffect, useRef, useState } from "react";
import type { Bar } from "../engine/types";

type Props = {
  bars: Bar[];
  price: number;
  showSMA?: boolean;
};

export function ChartCanvas({ bars, price, showSMA }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

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
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = size.w;
    const h = size.h;
    if (!w || !h) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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

    if (showSMA) {
      ctx.strokeStyle = "rgba(91,141,239,0.9)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let first = true;
      const period = 20;
      for (let i = 0; i < slice.length; i++) {
        if (i < period - 1) continue;
        let sum = 0;
        for (let j = 0; j < period; j++) sum += slice[i - j].c;
        const sma = sum / period;
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
  }, [bars, price, showSMA, size]);

  return <canvas ref={ref} className="h-full w-full" />;
}
