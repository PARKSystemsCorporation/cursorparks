import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          void: "#07070c",
          base: "#0b0b12",
          surface: "rgba(18, 18, 28, 0.7)",
          panel: "rgba(14, 14, 22, 0.85)"
        },
        neon: {
          green: "#00ff9d",
          red: "#ff3355",
          blue: "#5b8def",
          cyan: "#22d3ee",
          yellow: "#ffd600"
        }
      },
      boxShadow: {
        glass: "0 4px 24px rgba(0,0,0,0.4)",
        "glow-green": "0 0 16px rgba(0,255,157,0.25)",
        "glow-red": "0 0 16px rgba(255,51,85,0.25)",
        "glow-cyan": "0 0 16px rgba(34,211,238,0.2)"
      }
    }
  },
  plugins: []
};

export default config;
