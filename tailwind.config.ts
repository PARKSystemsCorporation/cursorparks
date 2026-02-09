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
          cyan: "#22d3ee"
        }
      },
      boxShadow: {
        glass: "0 10px 30px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: []
};

export default config;
