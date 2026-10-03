import type { Config } from "tailwindcss";

/**
 * Digitechzo brand tokens (taken from the logo)
 *  - brand: the logo's green (#5cb528 at 500)
 *  - ink:   the logo's black, used for dark accents
 *  - slate: re-tuned to slightly green-tinted charcoal neutrals so
 *           every existing slate-* class follows the brand automatically
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          50: "#f2faea",
          100: "#e2f3d0",
          200: "#c7e6a6",
          300: "#a3d672",
          400: "#7cc545",
          500: "#5cb528",
          600: "#3a8618",
          700: "#2e6c14",
          800: "#26561a",
          900: "#1f4518",
          950: "#0f2409",
        },
        ink: {
          50: "#f5f5f4",
          100: "#e8e8e6",
          200: "#d2d2cf",
          300: "#a9a9a4",
          400: "#7e7e79",
          500: "#3a3a38",
          600: "#262625",
          700: "#1c1c1b",
          800: "#141413",
          900: "#0d0d0c",
        },
        slate: {
          50: "#f6f8f4",
          100: "#eef1ea",
          200: "#dfe4d8",
          300: "#c3c9ba",
          400: "#838a78",
          500: "#60675a",
          600: "#4a5045",
          700: "#363b32",
          800: "#22251f",
          900: "#151713",
          950: "#0a0b09",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#f2faea",
          100: "#e2f3d0",
          500: "#5cb528",
          600: "#3a8618",
          700: "#2e6c14",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        sm: "0 1px 2px rgb(21 23 19 / 0.05), 0 2px 10px -4px rgb(21 23 19 / 0.08)",
        xs: "0 1px 2px 0 rgb(21 23 19 / 0.05)",
        card: "0 1px 2px rgb(21 23 19 / 0.04), 0 4px 16px -6px rgb(21 23 19 / 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
