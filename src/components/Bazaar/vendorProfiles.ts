export type VendorProfile = {
    title: string;
    tagline: string;
    specialties: string[];
    inventoryHighlights: string[];
    cta: string;
    accentColor?: string;
};

export const VENDOR_PROFILES: Record<string, VendorProfile> = {
    broker: {
        title: "THE BROKER",
        tagline: "Autonomous little bots — built, tuned, hustled.",
        specialties: [
            "Custom autonomous agents",
            "Tiny bots for tasks & trades",
            "Repairs & firmware tweaks",
        ],
        inventoryHighlights: [
            "Micro-runners",
            "Scout units",
            "One-off prototypes",
        ],
        cta: "Need a bot? Ask.",
        accentColor: "#3a506b",
    },
    coder: {
        title: "THE CODER",
        tagline: "Free blueprints. Build your own AI agent.",
        specialties: [
            "KIRA — local autonomous coding agent",
            "Full spec, full source, zero cost",
            "Runs on Ollama + SQLite + tkinter",
        ],
        inventoryHighlights: [
            "KIRA_SPEC.txt",
            "49 tests passing",
            "Self-improving AI",
        ],
        cta: "Click to grab the code.",
        accentColor: "#00ff9d",
    },
};
