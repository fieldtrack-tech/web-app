import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import animatePlugin from "tailwindcss-animate";

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
        sans: ["var(--font-public-sans)", ...fontFamily.sans],
        lexend: ["var(--font-lexend)", ...fontFamily.sans],
        manrope: ["var(--font-lexend)", ...fontFamily.sans], // legacy alias → Lexend
      },
      colors: {
        // Stitch design tokens
        background:       "#080a18",
        surface: {
          DEFAULT:         "#101329",
          dim:             "#080a18",
          bright:          "#1b1f3f",
          tint:            "#5250fd",
          variant:         "#1f2344",
          container: {
            lowest:        "#080a18",
            low:           "#101329",
            DEFAULT:       "#171a33",
            high:          "#1f2344",
            highest:       "#2a2f59",
          },
        },
        primary: {
          DEFAULT:         "#5250fd",
          container:       "#6e6fbf",
          fixed:           "#6f6cff",
          "fixed-dim":     "#5250fd",
        },
        "on-primary": {
          DEFAULT:         "#f6f7ff",
          container:       "#ffffff",
          fixed:           "#f4f4ff",
          "fixed-variant": "#d8d7ff",
        },
        secondary: {
          DEFAULT:         "#6e6fbf",
          container:       "#5f60a8",
          fixed:           "#8081d2",
          "fixed-dim":     "#6e6fbf",
        },
        "on-secondary": {
          DEFAULT:         "#f2f2ff",
          container:       "#ffffff",
        },
        tertiary: {
          DEFAULT:         "#a02c00",
          container:       "#c13f0d",
          fixed:           "#d65a2b",
          "fixed-dim":     "#a02c00",
        },
        "on-tertiary": {
          DEFAULT:         "#ffe8df",
          container:       "#fff5f1",
        },
        error: {
          DEFAULT:         "#ff8f87",
          container:       "#6a1513",
        },
        "on-error": {
          DEFAULT:         "#2a0504",
          container:       "#ffe5e2",
        },
        "on-background":  "#f3f4ff",
        "on-surface": {
          DEFAULT:         "#f3f4ff",
          variant:         "#b3b4c8",
        },
        outline: {
          DEFAULT:         "#777682",
          variant:         "#3e3f4d",
        },
        "success-green": "#6ed5a4",
        "inverse-surface": "#f3f4ff",
        "inverse-on-surface": "#171a33",
        "inverse-primary": "#5250fd",
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(135deg, #5250fd 0%, #6e6fbf 100%)",
        "cta-gradient": "linear-gradient(135deg, #5250fd 0%, #6e6fbf 55%, #5250fd 100%)",
        "surface-gradient": "linear-gradient(180deg, #171a33 0%, #080a18 100%)",
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "28px",
        full: "9999px",
      },
      boxShadow: {
        ambient: "0 18px 40px rgba(8, 10, 24, 0.55)",
        glow: "0 0 0 2px rgba(82, 80, 253, 0.32)",
        "glow-sm": "0 0 0 1px rgba(82, 80, 253, 0.24)",
      },
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.4" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "pulse-slow": "pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [animatePlugin],
};

export default config;
