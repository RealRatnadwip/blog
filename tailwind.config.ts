import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        panel: "var(--panel)",
        border: "var(--border)",
        text: "var(--text)",
        muted: "var(--muted)",
        accent: "#14a0ff",
        accentSoft: "#1e94ff",
      },
      boxShadow: {
        glow: "0 20px 80px rgba(20, 160, 255, 0.18)",
      },
      backgroundImage: {
        "terminal-grid": "radial-gradient(circle at top left, rgba(20, 160, 255, 0.08), transparent 20%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.04), transparent 15%)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
