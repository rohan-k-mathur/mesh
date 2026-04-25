import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Page titles only (h1, occasional h2). Currently Kolonia Trial.
        display: ["var(--font-display)"],
        // Body — every page of prose, the editor, the article view.
        serif: ["var(--font-serif)"],
        // Labels — nav, metadata strips, buttons, genre chips.
        sans: ["var(--font-sans)"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
