import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        agri: {
          forest: "#0b5c47",
          leaf: "#148060",
          mint: "#e8f5ef",
          cream: "#fffbf5",
          sand: "#f3eee6",
          sky: "#e6f1fb",
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
