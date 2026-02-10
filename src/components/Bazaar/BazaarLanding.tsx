"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./BazaarLanding.css";

// --- Types & Config ---
interface AgentData {
    name: string;
    desc: string;
    messages: string[];
}

const AGENT_DATA: Record<string, AgentData> = {
    oracle: {
        name: "THE ORACLE",
        desc: "speaks in riddles, answers in truth",
        messages: [
            "The Oracle stirs, sensing your presence...",
            "Ancient knowledge flows like water...",
            "What question burns within you?",
            "The mists part, revealing fragments of fate...",
            "Some truths are better left unspoken...",
        ],
    },
    merchant: {
        name: "MERCHANT MIND",
        desc: "negotiates, calculates, barters",
        messages: [
            "The Merchant appraises your worth...",
            "Every exchange has hidden costs...",
            "A deal forms in the air between you...",
            "Gold speaks louder than words here...",
            "What do you have to offer?",
        ],
    },
    keeper: {
        name: "THE KEEPER",
        desc: "guards secrets, remembers all",
        messages: [
            "The Keeper's eyes follow your movement...",
            "Ancient locks hold ancient truths...",
            "Some doors should remain closed...",
            "Memory is the true currency here...",
            "What secrets do you carry?",
        ],
    },
    dreamer: {
        name: "DREAM WEAVER",
        desc: "creates visions, spins stories",
        messages: [
            "The Dream Weaver's realm beckons...",
            "Colors dance at the edge of reality...",
            "What visions seek to escape your mind?",
            "Stories write themselves in the silence...",
            "The canvas awaits your imagination...",
        ],
    },
    echo: {
        name: "ECHO CHAMBER",
        desc: "listens deep, reflects back",
        messages: [
            "Your words ripple outward...",
            "The Echo listens with infinite patience...",
            "What sound does your soul make?",
            "Silence speaks volumes here...",
            "The chamber amplifies your truth...",
        ],
    },
    builder: {
        name: "FORGE MASTER",
        desc: "builds tools, shapes futures",
        messages: [
            "The forge burns with possibility...",
            "Iron bends to will here...",
            "What would you create?",
            "Every tool tells a story...",
            "The Forge Master awaits your vision...",
        ],
    },
};

const CONFIG = {
    dust: { count: 30, minSize: 1, maxSize: 3, minDuration: 12, maxDuration: 20 },
    sparks: { interval: 300, maxActive: 15 },
    smoke: { interval: 800, maxActive: 8 },
    presence: { min: 35, max: 60, updateInterval: 5000 },
    chat: {
        messages: [
            "seeking wisdom...",
            "the path reveals itself",
            "what mysteries await?",
            "the Oracle stirs",
            "bargains to be made",
            "secrets whispered",
            "dreams take shape",
        ],
        interval: 4000,
    },
};

// --- Helper Functions ---
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export default function BazaarLanding() {
    // --- Refs ---
    const dustRef = useRef<HTMLDivElement>(null);
    const sparksRef = useRef<HTMLDivElement>(null);
    const smokeRef = useRef<HTMLDivElement>(null);
    const chatZoneRef = useRef<HTMLDivElement>(null);
    const backgroundRef = useRef<HTMLDivElement>(null);
    const midgroundRef = useRef<HTMLDivElement>(null);

    // --- State ---
    const [presenceCount, setPresenceCount] = useState(47);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentAgent, setCurrentAgent] = useState<AgentData | null>(null);
    const [feedMessages, setFeedMessages] = useState<{ time: string; msg: string }[]>([]);

    // --- Particle Systems ---
    useEffect(() => {
        // Dust
        if (dustRef.current) {
            const container = dustRef.current;
            container.innerHTML = ""; // clear previous
            for (let i = 0; i < CONFIG.dust.count; i++) {
                const particle = document.createElement("div");
                particle.className = "dust-particle";
                const size = randomRange(CONFIG.dust.minSize, CONFIG.dust.maxSize);
                const duration = randomRange(CONFIG.dust.minDuration, CONFIG.dust.maxDuration);
                const startX = randomRange(0, 100);
                const startY = randomRange(0, 100);

                // We set the custom property via inline style
                // note: TS might complain about custom props, so we cast to any or use setProperty if strict
                particle.style.cssText = `
          left: ${startX}%;
          top: ${startY}%;
          width: ${size}px;
          height: ${size}px;
          opacity: 0;
          animation: dustFloat ${duration}s linear infinite;
          animation-delay: ${randomRange(0, duration)}s;
          --dust-drift: ${randomRange(-50, 100)}px;
        `;
                container.appendChild(particle);
            }
        }

        // Sparks
        const sparkInterval = setInterval(() => {
            if (sparksRef.current && sparksRef.current.childElementCount < CONFIG.sparks.maxActive) {
                const spark = document.createElement("div");
                spark.className = "spark";
                const startX = 30 + Math.random() * 40;
                const drift = (Math.random() - 0.5) * 60;
                const duration = 1 + Math.random() * 1.5;
                spark.style.cssText = `
          left: ${startX}%;
          bottom: 30%;
          --spark-drift: ${drift}px;
          animation-duration: ${duration}s;
        `;
                sparksRef.current.appendChild(spark);
                spark.addEventListener("animationend", () => spark.remove());
            }
        }, CONFIG.sparks.interval);

        // Smoke
        const smokeInterval = setInterval(() => {
            if (smokeRef.current && smokeRef.current.childElementCount < CONFIG.smoke.maxActive) {
                const smoke = document.createElement("div");
                smoke.className = "smoke-particle";
                const startX = 20 + Math.random() * 60;
                const size = 15 + Math.random() * 20;
                const duration = 3 + Math.random() * 2;
                smoke.style.cssText = `
          left: ${startX}%;
          bottom: 0;
          width: ${size}px;
          height: ${size}px;
          animation-duration: ${duration}s;
        `;
                smokeRef.current.appendChild(smoke);
                smoke.addEventListener("animationend", () => smoke.remove());
            }
        }, CONFIG.smoke.interval);

        // Chat Bubbles
        const chatInterval = setInterval(() => {
            if (chatZoneRef.current) {
                const bubble = document.createElement("div");
                bubble.className = "chat-bubble";
                const message = CONFIG.chat.messages[Math.floor(Math.random() * CONFIG.chat.messages.length)];
                const posX = 20 + Math.random() * 60;
                const posY = 20 + Math.random() * 60;
                bubble.textContent = message;
                bubble.style.cssText = `left: ${posX}%; top: ${posY}%;`;
                chatZoneRef.current.appendChild(bubble);
                bubble.addEventListener("animationend", () => bubble.remove());
            }
        }, CONFIG.chat.interval);

        return () => {
            clearInterval(sparkInterval);
            clearInterval(smokeInterval);
            clearInterval(chatInterval);
        };
    }, []);

    // --- Presence Counter ---
    useEffect(() => {
        const interval = setInterval(() => {
            setPresenceCount((prev) => {
                const change = Math.random() > 0.5 ? 1 : -1;
                return Math.max(CONFIG.presence.min, Math.min(CONFIG.presence.max, prev + change));
            });
        }, CONFIG.presence.updateInterval);
        return () => clearInterval(interval);
    }, []);

    // --- Parallax ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            if (backgroundRef.current) {
                backgroundRef.current.style.transform = `translate(${x * 5}px, ${y * 5}px)`;
            }
            if (midgroundRef.current) {
                midgroundRef.current.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
            }
        };
        document.addEventListener("mousemove", handleMouseMove);
        return () => document.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // --- Modal Logic ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (modalOpen && currentAgent) {
            document.body.style.overflow = "hidden";
            let msgIndex = 1;
            // initial message
            setFeedMessages([{ time: "now", msg: currentAgent.messages[0] }]);

            interval = setInterval(() => {
                const msg = currentAgent.messages[msgIndex % currentAgent.messages.length];
                const time = msgIndex * 3 < 60 ? `${msgIndex * 3}s ago` : `${Math.floor((msgIndex * 3) / 60)}m ago`;
                setFeedMessages((prev) => [...prev, { time, msg }].slice(-10)); // keep last 10
                msgIndex++;
            }, 3000);
        } else {
            document.body.style.overflow = "";
            setFeedMessages([]);
        }
        return () => {
            document.body.style.overflow = "";
            clearInterval(interval);
        };
    }, [modalOpen, currentAgent]);

    const openModal = (agentKey: string) => {
        setCurrentAgent(AGENT_DATA[agentKey] || null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setCurrentAgent(null);
    };

    // --- Stall Hover Effects ---
    const handleStallEnter = (e: React.MouseEvent<HTMLElement>) => {
        const target = e.currentTarget;
        const presence = target.querySelector(".agent-presence") as HTMLElement;
        const awning = target.querySelector(".stall-awning") as HTMLElement;
        if (presence) {
            presence.style.transform = "scale(1.1)";
            presence.style.transition = "transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)";
        }
        if (awning) {
            awning.style.transform = "translateY(-3px)";
            awning.style.transition = "transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)";
        }
    };

    const handleStallLeave = (e: React.MouseEvent<HTMLElement>) => {
        const target = e.currentTarget;
        const presence = target.querySelector(".agent-presence") as HTMLElement;
        const awning = target.querySelector(".stall-awning") as HTMLElement;
        if (presence) presence.style.transform = "scale(1)";
        if (awning) awning.style.transform = "translateY(0)";
    };

    return (
        <div className="bazaar-world">
            {/* Background Layer */}
            <div className="env-layer env-background" ref={backgroundRef}>
                <div className="distant-structures">
                    <div className="distant-building building-1"></div>
                    <div className="distant-building building-2"></div>
                    <div className="distant-building building-3"></div>
                </div>
                <div className="atmospheric-haze"></div>
                <div className="sky-gradient"></div>
            </div>

            {/* Midground Layer */}
            <div className="env-layer env-midground" ref={midgroundRef}>
                <div className="hanging-elements">
                    <div className="cable cable-1"></div>
                    <div className="cable cable-2"></div>
                    <div className="cable cable-3"></div>
                    <div className="hanging-banner banner-left"></div>
                    <div className="hanging-banner banner-right"></div>
                    <div className="hanging-lantern lantern-1"></div>
                    <div className="hanging-lantern lantern-2"></div>
                    <div className="hanging-lantern lantern-3"></div>
                </div>
            </div>

            {/* Foreground Layer */}
            <div className="env-layer env-foreground">
                <div className="dust-system" ref={dustRef}></div>
            </div>

            {/* Navigation Signpost */}
            <nav className="signpost-nav">
                <div className="signpost-pole">
                    <div className="pole-wood-grain"></div>
                    <div className="pole-shadow"></div>
                </div>
                <div className="signpost-planks">
                    {/* Plank: MMOTrader */}
                    <Link href="/mmotrader" className="nav-plank" data-direction="left">
                        <div className="plank-wood">
                            <div className="plank-grain"></div>
                            <div className="plank-edge plank-edge-top"></div>
                            <div className="plank-edge plank-edge-bottom"></div>
                        </div>
                        <span className="plank-text">MMOTRADER</span>
                        <div className="plank-nail plank-nail-left"></div>
                        <div className="plank-nail plank-nail-right"></div>
                        <div className="plank-shadow"></div>
                    </Link>

                    {/* Plank: Stalls */}
                    <a href="#stalls" className="nav-plank" data-direction="right">
                        <div className="plank-wood">
                            <div className="plank-grain"></div>
                            <div className="plank-edge plank-edge-top"></div>
                            <div className="plank-edge plank-edge-bottom"></div>
                        </div>
                        <span className="plank-text">STALLS</span>
                        <div className="plank-nail plank-nail-left"></div>
                        <div className="plank-nail plank-nail-right"></div>
                        <div className="plank-shadow"></div>
                    </a>

                    {/* Plank: Gathering */}
                    <a href="#gathering" className="nav-plank" data-direction="left">
                        <div className="plank-wood">
                            <div className="plank-grain"></div>
                            <div className="plank-edge plank-edge-top"></div>
                            <div className="plank-edge plank-edge-bottom"></div>
                        </div>
                        <span className="plank-text">GATHERING</span>
                        <div className="plank-nail plank-nail-left"></div>
                        <div className="plank-nail plank-nail-right"></div>
                        <div className="plank-shadow"></div>
                    </a>
                </div>
                <div className="signpost-base">
                    <div className="base-stones"></div>
                </div>
            </nav>

            {/* Presence Board */}
            <div className="presence-board">
                <div className="board-frame">
                    <div className="board-wood"></div>
                    <div className="board-content">
                        <span className="presence-glow"></span>
                        <span className="presence-count">{presenceCount}</span>
                        <span className="presence-label">wandering souls</span>
                    </div>
                </div>
            </div>

            {/* Main Bazaar Content */}
            <main className="bazaar-street" id="stalls">
                {/* Ground Layer */}
                <div className="ground-system">
                    <div className="dirt-path"></div>
                    <div className="stone-patches">
                        <div className="stone stone-1"></div>
                        <div className="stone stone-2"></div>
                        <div className="stone stone-3"></div>
                        <div className="stone stone-4"></div>
                        <div className="stone stone-5"></div>
                    </div>
                    <div className="ground-debris">
                        <div className="debris-leaf debris-1"></div>
                        <div className="debris-leaf debris-2"></div>
                        <div className="debris-straw debris-3"></div>
                    </div>
                </div>

                {/* Left Row */}
                <section className="stall-row stall-row-left">
                    {/* Oracle */}
                    <article
                        className="stall-block stall-material-fabric"
                        onMouseEnter={handleStallEnter}
                        onMouseLeave={handleStallLeave}
                    >
                        <div className="stall-structure">
                            <div className="stall-awning">
                                <div className="awning-fabric">
                                    <div className="fabric-fold fold-1"></div>
                                    <div className="fabric-fold fold-2"></div>
                                    <div className="fabric-fold fold-3"></div>
                                </div>
                                <div className="awning-fringe"></div>
                                <div className="awning-shadow"></div>
                            </div>
                            <div className="stall-post post-left">
                                <div className="post-wood-grain"></div>
                                <div className="post-wrap"></div>
                            </div>
                            <div className="stall-post post-right">
                                <div className="post-wood-grain"></div>
                                <div className="post-wrap"></div>
                            </div>
                            <div className="stall-counter">
                                <div className="counter-wood"></div>
                                <div className="counter-edge"></div>
                            </div>
                        </div>
                        <div className="stall-interior">
                            <div className="stall-clutter">
                                <div className="clutter-item item-scroll"></div>
                                <div className="clutter-item item-bottle"></div>
                                <div className="clutter-item item-book"></div>
                                <div className="clutter-item item-candle"></div>
                            </div>
                            <div className="agent-presence">
                                <div className="agent-ambient"></div>
                                <div className="agent-core"></div>
                                <div className="agent-pulse"></div>
                            </div>
                            <div className="stall-info">
                                <h3 className="stall-title">THE ORACLE</h3>
                                <p className="stall-desc">speaks in riddles, answers in truth</p>
                            </div>
                            <div className="stall-actions">
                                <button className="observe-btn" onClick={() => openModal("oracle")}>
                                    <span className="btn-text">observe</span>
                                </button>
                                <a
                                    href="https://gumroad.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="price-tag"
                                >
                                    <div className="tag-string"></div>
                                    <div className="tag-body">
                                        <div className="tag-texture"></div>
                                        <span className="tag-text">GET YOUR OWN</span>
                                    </div>
                                    <div className="tag-shadow"></div>
                                </a>
                            </div>
                        </div>
                        <div className="stall-ground-shadow"></div>
                    </article>

                    {/* Merchant */}
                    <article
                        className="stall-block stall-material-wood"
                        onMouseEnter={handleStallEnter}
                        onMouseLeave={handleStallLeave}
                    >
                        <div className="stall-structure">
                            <div className="stall-awning">
                                <div className="awning-fabric">
                                    <div className="fabric-fold fold-1"></div>
                                    <div className="fabric-fold fold-2"></div>
                                    <div className="fabric-fold fold-3"></div>
                                </div>
                                <div className="awning-fringe"></div>
                                <div className="awning-shadow"></div>
                            </div>
                            <div className="stall-post post-left">
                                <div className="post-wood-grain"></div>
                                <div className="post-wrap"></div>
                            </div>
                            <div className="stall-post post-right">
                                <div className="post-wood-grain"></div>
                                <div className="post-wrap"></div>
                            </div>
                            <div className="stall-counter">
                                <div className="counter-wood"></div>
                                <div className="counter-edge"></div>
                            </div>
                        </div>
                        <div className="stall-interior">
                            <div className="stall-clutter">
                                <div className="clutter-item item-crate"></div>
                                <div className="clutter-item item-sack"></div>
                                <div className="clutter-item item-scale"></div>
                                <div className="clutter-item item-coins"></div>
                            </div>
                            <div className="agent-presence">
                                <div className="agent-ambient"></div>
                                <div className="agent-core"></div>
                                <div className="agent-pulse"></div>
                            </div>
                            <div className="stall-info">
                                <h3 className="stall-title">MERCHANT MIND</h3>
                                <p className="stall-desc">negotiates, calculates, barters</p>
                            </div>
                            <div className="stall-actions">
                                <button className="observe-btn" onClick={() => openModal("merchant")}>
                                    <span className="btn-text">observe</span>
                                </button>
                                <a
                                    href="https://gumroad.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="price-tag"
                                >
                                    <div className="tag-string"></div>
                                    <div className="tag-body">
                                        <div className="tag-texture"></div>
                                        <span className="tag-text">GET YOUR OWN</span>
                                    </div>
                                    <div className="tag-shadow"></div>
                                </a>
                            </div>
                        </div>
                        <div className="stall-ground-shadow"></div>
                    </article>

                    {/* Keeper */}
                    <article
                        className="stall-block stall-material-metal"
                        onMouseEnter={handleStallEnter}
                        onMouseLeave={handleStallLeave}
                    >
                        <div className="stall-structure">
                            <div className="stall-awning">
                                <div className="awning-fabric">
                                    <div className="fabric-fold fold-1"></div>
                                    <div className="fabric-fold fold-2"></div>
                                    <div className="fabric-fold fold-3"></div>
                                </div>
                                <div className="awning-fringe"></div>
                                <div className="awning-shadow"></div>
                            </div>
                            <div className="stall-post post-left">
                                <div className="post-wood-grain"></div>
                                <div className="post-wrap"></div>
                            </div>
                            <div className="stall-post post-right">
                                <div className="post-wood-grain"></div>
                                <div className="post-wrap"></div>
                            </div>
                            <div className="stall-counter">
                                <div className="counter-wood"></div>
                                <div className="counter-edge"></div>
                            </div>
                        </div>
                        <div className="stall-interior">
                            <div className="stall-clutter">
                                <div className="clutter-item item-key"></div>
                                <div className="clutter-item item-lock"></div>
                                <div className="clutter-item item-chain"></div>
                                <div className="clutter-item item-chest"></div>
                            </div>
                            <div className="agent-presence">
                                <div className="agent-ambient"></div>
                                <div className="agent-core"></div>
                                <div className="agent-pulse"></div>
                            </div>
                            <div className="stall-info">
                                <h3 className="stall-title">THE KEEPER</h3>
                                <p className="stall-desc">guards secrets, remembers all</p>
                            </div>
                            <div className="stall-actions">
                                <button className="observe-btn" onClick={() => openModal("keeper")}>
                                    <span className="btn-text">observe</span>
                                </button>
                                <a
                                    href="https://gumroad.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="price-tag"
                                >
                                    <div className="tag-string"></div>
                                    <div className="tag-body">
                                        <div className="tag-texture"></div>
                                        <span className="tag-text">GET YOUR OWN</span>
                                    </div>
                                    <div className="tag-shadow"></div>
                                </a>
                            </div>
                        </div>
                        <div className="stall-ground-shadow"></div>
                    </article>
                </section>

                {/* Center Zone */}
                <section className="center-zone" id="gathering">
                    <div className="gathering-fire">
                        <div className="fire-pit">
                            <div className="pit-stones"></div>
                            <div className="pit-ash"></div>
                        </div>
                        <div className="fire-flames">
                            <div className="flame flame-1"></div>
                            <div className="flame flame-2"></div>
                            <div className="flame flame-3"></div>
                        </div>
                        <div className="fire-glow"></div>
                        <div className="fire-sparks" ref={sparksRef}></div>
                        <div className="fire-smoke" ref={smokeRef}></div>
                    </div>
                    <div className="gathering-circle">
                        <div className="circle-stones"></div>
                    </div>
                    <div className="chat-zone" ref={chatZoneRef}></div>
                </section>

                {/* Right Row */}
                <section className="stall-row stall-row-right">
                    {/* Dreamer */}
                    <article
                        className="stall-block stall-material-canvas"
                        onMouseEnter={handleStallEnter}
                        onMouseLeave={handleStallLeave}
                    >
                        <div className="stall-structure">
                            <div className="stall-awning">
                                <div className="awning-fabric">
                                    <div className="fabric-fold fold-1"></div>
                                    <div className="fabric-fold fold-2"></div>
                                    <div className="fabric-fold fold-3"></div>
                                </div>
                                <div className="awning-fringe"></div>
                                <div className="awning-shadow"></div>
                            </div>
                            <div className="stall-post post-left">
                                <div className="post-wood-grain"></div>
                                <div className="post-wrap"></div>
                            </div>
                            <div className="stall-post post-right">
                                <div className="post-wood-grain"></div>
                                <div className="post-wrap"></div>
                            </div>
                            <div className="stall-counter">
                                <div className="counter-wood"></div>
                                <div className="counter-edge"></div>
                            </div>
                        </div>
                        <div className="stall-interior">
                            <div className="stall-clutter">
                                <div className="clutter-item item-canvas"></div>
                                <div className="clutter-item item-brush"></div>
                                <div className="clutter-item item-pigment"></div>
                                <div className="clutter-item item-easel"></div>
                            </div>
                            <div className="agent-presence">
                                <div className="agent-ambient"></div>
                                <div className="agent-core"></div>
                                <div className="agent-pulse"></div>
                            </div>
                            <div className="stall-info">
                                <h3 className="stall-title">DREAM WEAVER</h3>
                                <p className="stall-desc">creates visions, spins stories</p>
                            </div>
                            <div className="stall-actions">
                                <button className="observe-btn" onClick={() => openModal("dreamer")}>
                                    <span className="btn-text">observe</span>
                                </button>
                                <a
                                    href="https://gumroad.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="price-tag"
                                >
                                    <div className="tag-string"></div>
                                    <div className="tag-body">
                                        <div className="tag-texture"></div>
                                        <span className="tag-text">GET YOUR OWN</span>
                                    </div>
                                    <div className="tag-shadow"></div>
                                </a>
                            </div>
                        </div>
                        <div className="stall-ground-shadow"></div>
                    </article>

                    {/* Echo */}
                    <article
                        className="stall-block stall-material-rope"
                        onMouseEnter={handleStallEnter}
                        onMouseLeave={handleStallLeave}
                    >
                        <div className="stall-structure">
                            <div className="stall-awning">
                                <div className="awning-fabric">
                                    <div className="fabric-fold fold-1"></div>
                                    <div className="fabric-fold fold-2"></div>
                                    <div className="fabric-fold fold-3"></div>
                                </div>
                                <div className="awning-fringe"></div>
                                <div className="awning-shadow"></div>
                            </div>
                            <div className="stall-post post-left">
                                <div className="post-wood-grain"></div>
                                <div className="post-wrap"></div>
                            </div>
                            <div className="stall-post post-right">
                                <div className="post-wood-grain"></div>
                                <div className="post-wrap"></div>
                            </div>
                            <div className="stall-counter">
                                <div className="counter-wood"></div>
                                <div className="counter-edge"></div>
                            </div>
                        </div>
                        <div className="stall-interior">
                            <div className="stall-clutter">
                                <div className="clutter-item item-horn"></div>
                                <div className="clutter-item item-drum"></div>
                                <div className="clutter-item item-bell"></div>
                                <div className="clutter-item item-chimes"></div>
                            </div>
                            <div className="agent-presence">
                                <div className="agent-ambient"></div>
                                <div className="agent-core"></div>
                                <div className="agent-pulse"></div>
                            </div>
                            <div className="stall-info">
                                <h3 className="stall-title">ECHO CHAMBER</h3>
                                <p className="stall-desc">listens deep, reflects back</p>
                            </div>
                            <div className="stall-actions">
                                <button className="observe-btn" onClick={() => openModal("echo")}>
                                    <span className="btn-text">observe</span>
                                </button>
                                <a
                                    href="https://gumroad.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="price-tag"
                                >
                                    <div className="tag-string"></div>
                                    <div className="tag-body">
                                        <div className="tag-texture"></div>
                                        <span className="tag-text">GET YOUR OWN</span>
                                    </div>
                                    <div className="tag-shadow"></div>
                                </a>
                            </div>
                        </div>
                        <div className="stall-ground-shadow"></div>
                    </article>

                    {/* Builder */}
                    <article
                        className="stall-block stall-material-leather"
                        onMouseEnter={handleStallEnter}
                        onMouseLeave={handleStallLeave}
                    >
                        <div className="stall-structure">
                            <div className="stall-awning">
                                <div className="awning-fabric">
                                    <div className="fabric-fold fold-1"></div>
                                    <div className="fabric-fold fold-2"></div>
                                    <div className="fabric-fold fold-3"></div>
                                </div>
                                <div className="awning-fringe"></div>
                                <div className="awning-shadow"></div>
                            </div>
                            <div className="stall-post post-left">
                                <div className="post-wood-grain"></div>
                                <div className="post-wrap"></div>
                            </div>
                            <div className="stall-post post-right">
                                <div className="post-wood-grain"></div>
                                <div className="post-wrap"></div>
                            </div>
                            <div className="stall-counter">
                                <div className="counter-wood"></div>
                                <div className="counter-edge"></div>
                            </div>
                        </div>
                        <div className="stall-interior">
                            <div className="stall-clutter">
                                <div className="clutter-item item-hammer"></div>
                                <div className="clutter-item item-gear"></div>
                                <div className="clutter-item item-blueprint"></div>
                                <div className="clutter-item item-anvil"></div>
                            </div>
                            <div className="agent-presence">
                                <div className="agent-ambient"></div>
                                <div className="agent-core"></div>
                                <div className="agent-pulse"></div>
                            </div>
                            <div className="stall-info">
                                <h3 className="stall-title">FORGE MASTER</h3>
                                <p className="stall-desc">builds tools, shapes futures</p>
                            </div>
                            <div className="stall-actions">
                                <button className="observe-btn" onClick={() => openModal("builder")}>
                                    <span className="btn-text">observe</span>
                                </button>
                                <a
                                    href="https://gumroad.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="price-tag"
                                >
                                    <div className="tag-string"></div>
                                    <div className="tag-body">
                                        <div className="tag-texture"></div>
                                        <span className="tag-text">GET YOUR OWN</span>
                                    </div>
                                    <div className="tag-shadow"></div>
                                </a>
                            </div>
                        </div>
                        <div className="stall-ground-shadow"></div>
                    </article>
                </section>
            </main>

            {/* Activity Ticker */}
            <footer className="activity-board">
                <div className="board-frame-footer">
                    <div className="board-wood-footer"></div>
                    <div className="ticker-viewport">
                        <div className="ticker-track">
                            <span className="ticker-item">◆ new wanderer entered the bazaar</span>
                            <span className="ticker-item">◆ ORACLE spoke to a seeker</span>
                            <span className="ticker-item">◆ conversation spark at the fire</span>
                            <span className="ticker-item">◆ MERCHANT closed a deal</span>
                            <span className="ticker-item">◆ someone claimed an agent</span>
                            <span className="ticker-item">◆ DREAM WEAVER woke from vision</span>
                            <span className="ticker-item">◆ 3 souls gathered at center</span>
                            {/* Duplicate needed for continuous scroll effect if content is short */}
                            <span className="ticker-item">◆ new wanderer entered the bazaar</span>
                            <span className="ticker-item">◆ ORACLE spoke to a seeker</span>
                            <span className="ticker-item">◆ conversation spark at the fire</span>
                            <span className="ticker-item">◆ MERCHANT closed a deal</span>
                            <span className="ticker-item">◆ someone claimed an agent</span>
                            <span className="ticker-item">◆ DREAM WEAVER woke from vision</span>
                            <span className="ticker-item">◆ 3 souls gathered at center</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Observation Modal */}
            <div className={`observation-modal ${modalOpen ? "active" : ""}`}>
                <div className="modal-backdrop" onClick={closeModal}></div>
                <div className="modal-frame">
                    <div className="modal-wood-border"></div>
                    <button className="modal-close" onClick={closeModal}>
                        <span>×</span>
                    </button>
                    <div className="modal-content">
                        <div className="observed-agent-display">
                            <div className="agent-large">
                                <div className="agent-ambient-large"></div>
                                <div className="agent-core-large"></div>
                                <div className="agent-pulse-large"></div>
                            </div>
                            <h2 className="observed-title">{currentAgent?.name}</h2>
                            <p className="observed-desc">{currentAgent?.desc}</p>
                        </div>
                        <div className="observation-feed">
                            {feedMessages.map((msg, idx) => (
                                <div className="feed-entry" key={idx}>
                                    <span className="feed-time">{msg.time}</span>
                                    <span className="feed-message">{msg.msg}</span>
                                </div>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <a
                                href="https://gumroad.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="claim-board"
                            >
                                <div className="claim-wood"></div>
                                <span className="claim-text">CLAIM YOUR OWN</span>
                                <span className="claim-arrow">→</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
