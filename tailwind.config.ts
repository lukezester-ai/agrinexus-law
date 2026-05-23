import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
      },
      colors: {
        agri: {
          /** Canva-like palette (violet/indigo/blue, clean docs vibe) */
          forest: "#4338ca",
          leaf: "#6366f1",
          mint: "#f8f5ff",
          cream: "#f9fbff",
          sand: "#eef2ff",
          sky: "#e0f2fe",
          ink: "#1c1917",
        },
      },
      boxShadow: {
        soft: "0 18px 40px -24px rgba(79, 70, 229, 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
