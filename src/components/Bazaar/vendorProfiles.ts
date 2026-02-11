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
};
