


export type CreatureIdentity = {
    gender: string;
    role: string;
    head_type: string;
    body_type: string;
    tail_type: string;
    color_profile: {
        primary?: string;
        secondary?: string;
        accent?: string;
        metal?: string;
        metalness?: number;
        roughness?: number;
        emissive?: string;
        emissiveIntensity?: number;
    };
};

const HEAD_TYPES = ["sensor_dome", "narrow_visor", "antenna_cluster"];
const BODY_TYPES = ["slug_form", "dog_frame", "crawler_plate"];
const TAIL_TYPES = ["cable_tail", "blade_tail", "stabilizer_tail"];

const PALETTES = [
    { primary: "#3d3630", secondary: "#4a4238", accent: "#ff6b1a" }, // Default Rusty
    { primary: "#2a2520", secondary: "#3d3630", accent: "#00eaff" }, // Dark Cyber
    { primary: "#8b6914", secondary: "#5c5044", accent: "#d4af37" }, // Gold Accent
    { primary: "#556677", secondary: "#334455", accent: "#aaddff" }, // Cool Blue
    { primary: "#665555", secondary: "#4a3a3a", accent: "#ff4444" }, // Red Warning
];

// Simple seeded RNG
function seededRandom(seed: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0) / 4294967296;
}

export function generateVisualIdentity(morphologySeed: string, type: string, gender: string): CreatureIdentity {
    const rng = (offset: number) => seededRandom(morphologySeed + offset);

    // Deterministic selection based on seed
    const headIndex = Math.floor(rng(1) * HEAD_TYPES.length);
    const bodyIndex = Math.floor(rng(2) * BODY_TYPES.length);
    const tailIndex = Math.floor(rng(3) * TAIL_TYPES.length);
    const paletteIndex = Math.floor(rng(4) * PALETTES.length);

    const palette = PALETTES[paletteIndex];

    // Role-specific overrides or biases could go here
    // e.g., warriors might prefer darker palettes or specific heads

    return {
        gender,
        role: type === "warform" ? "warrior" : "companion",
        head_type: HEAD_TYPES[headIndex],
        body_type: BODY_TYPES[bodyIndex],
        tail_type: TAIL_TYPES[tailIndex],
        color_profile: {
            primary: palette.primary,
            secondary: palette.secondary,
            accent: palette.accent,
            metalness: 0.5 + rng(5) * 0.4,
            roughness: 0.4 + rng(6) * 0.4,
            emissive: palette.accent,
            emissiveIntensity: 0.8,
        }
    };
}
