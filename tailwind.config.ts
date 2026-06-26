import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101216",
        panel: "#f7f4ec",
        ember: "#ef5b2a",
        signal: "#21a179",
        wire: "#2457c5",
        plum: "#6e3cbc",
        "electric-blue": "#00F0FF",
        "cyber-green": "#00FF66",
        "warning-amber": "#FFB800",
        "glass-border": "rgba(255, 255, 255, 0.08)",
        "on-surface": "#E3E8EF",
        "on-surface-variant": "#94A3B8",
      },
      boxShadow: {
        "panel-sm": "0 1px 0 rgba(16, 18, 22, 0.08)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 25s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
