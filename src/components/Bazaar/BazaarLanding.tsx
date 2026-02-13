"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Gold landing: THE PUBLIC BAZAAR. Start here.
 * Loading bar then ENTER MARKET → Market.
 */
export default function BazaarLanding() {
  const [showEnter, setShowEnter] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2200;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p >= 100) {
        setShowEnter(true);
        return;
      }
      requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0905] overflow-hidden text-[#e0dac5] font-mono">
      {/* Background - dusty, hot */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a120b] via-[#0f0a05] to-[#050302] opacity-100" />
      {/* Heat haze overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opactiy='0.5'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Warm vignetting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,100,0,0.05),transparent_80%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center space-y-10 p-8 max-w-4xl w-full text-center border-y border-[#c25e00]/20 py-20 bg-black/20 backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <h1 className="text-5xl md:text-8xl font-black tracking-widest text-[#ffaa00] uppercase drop-shadow-[0_2px_10px_rgba(255,100,0,0.3)] animate-fadeInDown border-b-4 border-[#c25e00] pb-2 mb-2">
            THE PUBLIC BAZAAR
          </h1>
          <div className="w-full flex justify-between text-[#c25e00] text-xs md:text-sm tracking-[0.5em] uppercase font-bold opacity-80">
            <span>Unregulated Sector</span>
            <span>Open Market</span>
          </div>
        </div>

        <p className="text-[#d4b483]/70 text-lg md:text-xl font-light tracking-wide max-w-lg animate-fadeIn italic">
          &quot;If you can interpret the signal, you can find the goods.&quot;
        </p>

        <div className="h-32 flex items-center justify-center w-full">
          {!showEnter ? (
            <div className="flex flex-col items-center space-y-4 w-full max-w-sm animate-fadeIn">
              <div className="w-full h-2 bg-[#2a1d15] border border-[#5c4033] p-[2px]">
                <div
                  className="h-full bg-[#ffaa00] shadow-[0_0_15px_#ffaa00] transition-all duration-300 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between w-full text-xs font-mono text-[#c25e00]">
                <span>ESTABLISHING_LINK...</span>
                <span>{Math.max(Math.round(progress), 0)}%</span>
              </div>
            </div>
          ) : (
            <Link
              href="/mmotrader"
              className="group relative px-16 py-6 bg-[#1a120b] border-2 border-[#c25e00] text-[#ffaa00] font-black text-lg tracking-[0.2em] uppercase transition-all duration-300 hover:bg-[#c25e00] hover:text-[#0d0905] hover:shadow-[0_0_40px_rgba(194,94,0,0.4)] animate-fadeInUp active:scale-95 inline-block no-underline"
            >
              <span className="relative z-10">ENTER MARKET</span>
              <div className="absolute top-[-2px] left-[-2px] w-4 h-4 border-t-4 border-l-4 border-[#ffaa00]" />
              <div className="absolute bottom-[-2px] right-[-2px] w-4 h-4 border-b-4 border-r-4 border-[#ffaa00]" />
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 w-full flex justify-center">
        <div className="flex space-x-8 text-[10px] font-mono text-[#5c4033] uppercase tracking-widest border-t border-[#5c4033]/30 pt-2 px-10">
          <div>Loc: Undisclosed</div>
          <div>Est. 2026</div>
          <div className="hidden md:block">No Refunds // No Questions</div>
        </div>
      </div>
    </div>
  );
}
