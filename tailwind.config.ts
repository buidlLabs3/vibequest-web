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
      },
      boxShadow: {
        "panel-sm": "0 1px 0 rgba(16, 18, 22, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
