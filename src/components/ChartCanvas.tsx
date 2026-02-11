"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { Bar } from "../engine/types";
import { usePriceDirection } from "../hooks/usePriceDirection";

type Props = {
  bars: Bar[];
  price: number;
  showSMA?: boolean;
  avgPrice?: number;
};

export const ChartCanvas = memo(function ChartCanvas({ bars, price, showSMA, avgPrice }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const priceDirection = usePriceDirection(price);

  // Refs so the draw loop can read latest data without re-running the effect on every tick
  const dataRef = useRef({ bars, price, showSMA, avgPrice, size, priceDirection });
  dataRef.current = { bars, price, showSMA, avgPrice, size, priceDirection };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    let resizeRafId = 0;
    const ro = new ResizeObserver(() => {
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(() => {
        setSize({ w: parent.clientWidth, h: parent.clientHeight });
        resizeRafId = 0;
      });
    });
    ro.observe(parent);
    setSize({ w: parent.clientWidth, h: parent.clientHeight });
    return () => {
      ro.disconnect();
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
    };
  }, []);

  useEffect(() => {
    let rafId = 0;
    const render = () => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const { bars: barsData, price: priceVal, showSMA: showSMAVal, avgPrice: avgPriceVal, size: sizeData, priceDirection: priceDir } = dataRef.current;
      const { w, h } = sizeData;
      if (!w || !h) return;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, w, h);

      if (!barsData.length) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText("Waiting for market...", w / 2, h / 2);
        rafId = requestAnimationFrame(render);
        return;
      }

      const maxBars = 80;
      const slice = barsData.slice(-maxBars);
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

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (i * 0.25) * ph;
        ctx.moveTo(pad.l, y);
        ctx.lineTo(w - pad.r, y);
      }
      ctx.stroke();

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

      if (avgPriceVal !== undefined && avgPriceVal > 0) {
        const ay = toY(avgPriceVal);
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
          ctx.fillText(`AVG ${avgPriceVal.toFixed(2)}`, pad.l + 4, ay - 4);
        }
      }

      if (showSMAVal) {
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
          if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
        }
        if (!first) ctx.stroke();
      }

      const py = toY(priceVal);
      const priceColor = priceDir === "up" ? "rgba(0,255,157,0.7)" : priceDir === "down" ? "rgba(255,51,85,0.7)" : "rgba(34,211,238,0.7)";
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
      ctx.fillText(`$${priceVal.toFixed(2)}`, w - pad.r / 2, py + 4);

      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

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
});
