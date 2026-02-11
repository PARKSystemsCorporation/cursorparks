import React, { useState, useEffect } from "react";
import { useProgress } from "@react-three/drei";

interface LandingPageProps {
    onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
    const { progress } = useProgress();
    const [showEnter, setShowEnter] = useState(false);

    useEffect(() => {
        if (progress === 100) {
            // Small delay to ensure everything is truly ready and to smooth out the UI
            setTimeout(() => setShowEnter(true), 500);
        }
    }, [progress]);

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050510] overflow-hidden">
            {/* Background Ambience - Alleyway feel with gradients/fog */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a12] to-[#1a1a2e] opacity-80" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,157,0.05),transparent_70%)]" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center space-y-8 p-8 max-w-2xl w-full text-center">

                {/* Title / Hero Text */}
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 animate-fadeInDown drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    NEON<span className="text-neon-cyan">CITY</span>
                </h1>

                <p className="text-blue-200/60 text-lg md:text-xl font-light tracking-wide max-w-lg animate-fadeIn">
                    Where the digital and physical realms collide.
                </p>

                {/* Loading / Enter State */}
                <div className="h-24 flex items-center justify-center w-full">
                    {!showEnter ? (
                        <div className="flex flex-col items-center space-y-4 w-full max-w-xs animate-fadeIn">
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-neon-cyan shadow-[0_0_10px_#22d3ee] transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between w-full text-xs font-mono text-neon-cyan/70">
                                <span>SYSTEM_INIT</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={onEnter}
                            className="group relative px-12 py-4 bg-transparent border border-neon-cyan/30 hover:border-neon-cyan text-neon-cyan font-mono text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:bg-neon-cyan/10 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] animate-fadeInUp"
                        >
                            <span className="relative z-10 group-hover:text-white transition-colors">Enter System</span>
                            <div className="absolute inset-0 bg-neon-cyan/0 group-hover:bg-neon-cyan/10 transition-colors duration-300" />
                            {/* Corner Accents */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-cyan opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-cyan opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>
                    )}
                </div>
            </div>

            {/* Footer / Status */}
            <div className="absolute bottom-8 left-8 right-8 flex justify-between text-[10px] font-mono text-white/20 uppercase tracking-widest">
                <div>Conn: Secure</div>
                <div>Ver: 2.0.45</div>
                <div className="hidden md:block">Latency: &lt;1ms</div>
            </div>
        </div>
    );
}
