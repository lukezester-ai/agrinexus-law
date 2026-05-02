import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        agri: {
          /** Основен акцент — синхрон с UI (#0d9488 teal-600) */
          forest: "#0f766e",
          leaf: "#14b8a6",
          mint: "#ecfdf8",
          cream: "#f8fafc",
          sand: "#eef2f7",
          sky: "#e0f2fe",
          ink: "#1c1917",
        },
      },
      boxShadow: {
        soft: "0 18px 40px -24px rgba(11, 92, 71, 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
