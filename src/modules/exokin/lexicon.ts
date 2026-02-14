/**
 * EXOKIN LEXICON
 * Static dictionary mapping atomic meanings to proto-sounds.
 */

export type RootType = "action" | "object" | "abstract" | "state";
export type ToneType = "neutral" | "aggressive" | "calm" | "curious" | "warning" | "urgent";

export interface ProtoRoot {
    text: string;
    bias: "fluid" | "harsh" | "neutral";
}

/** 
 * Roots map English semantic concepts to Exokin roots. 
 * 'fluid' = bonding/calm, 'harsh' = danger/tech, 'neutral' = general
 */
export const EXOKIN_ROOTS: Record<string, ProtoRoot[]> = {
    // MOVEMENT / ACTION
    movement: [
        { text: "flo", bias: "fluid" },
        { text: "run", bias: "neutral" },
        { text: "volt", bias: "harsh" },
    ],
    follow: [
        { text: "vel", bias: "fluid" },
        { text: "kore", bias: "harsh" }, // tactical follow
        { text: "path", bias: "neutral" },
    ],
    assist: [
        { text: "syn", bias: "fluid" },
        { text: "link", bias: "neutral" },
        { text: "vex", bias: "harsh" }, // aggressive assistance / intervention
    ],
    protect: [
        { text: "shel", bias: "fluid" },
        { text: "gard", bias: "neutral" },
        { text: "krax", bias: "harsh" },
    ],

    // SENSORY / COGNITION
    observe: [
        { text: "vis", bias: "fluid" }, // seeing
        { text: "scan", bias: "neutral" },
        { text: "takt", bias: "harsh" }, // detailed tactical scan
    ],
    danger: [
        { text: "nox", bias: "harsh" },
        { text: "trem", bias: "fluid" }, // shaking/fear
        { text: "warn", bias: "neutral" },
    ],
    curious: [
        { text: "quer", bias: "fluid" }, // soft query
        { text: "prob", bias: "neutral" },
        { text: "zill", bias: "harsh" }, // piercing probe
    ],

    // SOCIAL / STATE
    bond: [
        { text: "lum", bias: "fluid" }, // light
        { text: "nex", bias: "harsh" }, // bond/imprison/lock
        { text: "tie", bias: "neutral" },
    ],
    idle: [ // idle/waiting/standing
        { text: "staz", bias: "neutral" },
        { text: "calm", bias: "fluid" },
        { text: "wait", bias: "harsh" },
    ],
    self: [
        { text: "ego", bias: "neutral" },
        { text: "sol", bias: "fluid" }, // soul/sun
        { text: "unit", bias: "harsh" },
    ],
    other: [
        { text: "al", bias: "fluid" },
        { text: "ext", bias: "neutral" },
        { text: "xen", bias: "harsh" },
    ]
};

export const TONE_SUFFIXES: Record<ToneType, string[]> = {
    neutral: ["ive", "ant", "ent"],
    aggressive: ["ex", "ax", "ox"], // Sharp sounds
    calm: ["une", "ine", "oom"],    // Soft, humming sounds
    curious: ["el", "il", "or?"],
    warning: ["or", "uz", "at"],    // Low buzzes
    urgent: ["ia", "ak", "et"],     // Quick clips
};

export const NUANCE_PREFIXES = {
    active: "neo",      // new/starting
    reactive: "re",     // responding
    internal: "in",     // self-state
    external: "ex",     // world-state
    social: "syn",      // together
    mechanical: "mech", // machine/rigid
} as const;
