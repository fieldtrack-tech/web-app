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
        // ── Semantic design tokens (all via HSL CSS variables) ───────────
        // Supports opacity modifier: bg-primary/10, text-error/80, etc.
        background: "hsl(var(--background) / <alpha-value>)",
        surface: {
          DEFAULT:   "hsl(var(--surface) / <alpha-value>)",
          dim:       "hsl(var(--surface-dim) / <alpha-value>)",
          bright:    "hsl(var(--surface-bright) / <alpha-value>)",
          tint:      "hsl(var(--surface-tint) / <alpha-value>)",
          variant:   "hsl(var(--surface-variant) / <alpha-value>)",
          container: {
            lowest:  "hsl(var(--surface-container-lowest) / <alpha-value>)",
            low:     "hsl(var(--surface-container-low) / <alpha-value>)",
            DEFAULT: "hsl(var(--surface-container) / <alpha-value>)",
            high:    "hsl(var(--surface-container-high) / <alpha-value>)",
            highest: "hsl(var(--surface-container-highest) / <alpha-value>)",
          },
        },
        primary: {
          DEFAULT:   "hsl(var(--primary) / <alpha-value>)",
          container: "hsl(var(--primary-container) / <alpha-value>)",
          fixed:     "hsl(var(--primary) / <alpha-value>)",
          "fixed-dim": "hsl(var(--primary) / <alpha-value>)",
        },
        "on-primary": {
          DEFAULT:   "hsl(var(--on-primary) / <alpha-value>)",
          container: "hsl(var(--on-primary-container) / <alpha-value>)",
        },
        secondary: {
          DEFAULT:   "hsl(var(--secondary) / <alpha-value>)",
          container: "hsl(var(--secondary-container) / <alpha-value>)",
          fixed:     "hsl(var(--secondary) / <alpha-value>)",
          "fixed-dim": "hsl(var(--secondary) / <alpha-value>)",
        },
        "on-secondary": {
          DEFAULT:   "hsl(var(--on-secondary) / <alpha-value>)",
          container: "hsl(var(--on-secondary-container) / <alpha-value>)",
        },
        tertiary: {
          DEFAULT:   "hsl(var(--tertiary) / <alpha-value>)",
          container: "hsl(var(--tertiary-container) / <alpha-value>)",
          fixed:     "hsl(var(--tertiary) / <alpha-value>)",
          "fixed-dim": "hsl(var(--tertiary) / <alpha-value>)",
        },
        "on-tertiary": {
          DEFAULT:   "hsl(var(--on-tertiary) / <alpha-value>)",
          container: "hsl(var(--on-tertiary-container) / <alpha-value>)",
        },
        error: {
          DEFAULT:   "hsl(var(--error) / <alpha-value>)",
          container: "hsl(var(--error-container) / <alpha-value>)",
        },
        "on-error": {
          DEFAULT:   "hsl(var(--on-error) / <alpha-value>)",
          container: "hsl(var(--on-error-container) / <alpha-value>)",
        },
        "on-background":  "hsl(var(--on-background) / <alpha-value>)",
        "on-surface": {
          DEFAULT: "hsl(var(--on-surface) / <alpha-value>)",
          variant: "hsl(var(--on-surface-variant) / <alpha-value>)",
        },
        outline: {
          DEFAULT: "hsl(var(--outline) / <alpha-value>)",
          variant: "hsl(var(--outline-variant) / <alpha-value>)",
        },
        "success-green": "hsl(var(--success-green) / <alpha-value>)",
        "inverse-surface": "hsl(var(--on-surface) / <alpha-value>)",
        "inverse-on-surface": "hsl(var(--surface-container) / <alpha-value>)",
        "inverse-primary": "hsl(var(--primary) / <alpha-value>)",
        // ── Accent palette ───────────────────────────────────────────────
        accent: {
          purple: "hsl(var(--accent-purple) / <alpha-value>)",
          cyan:   "hsl(var(--accent-cyan) / <alpha-value>)",
          pink:   "hsl(var(--accent-pink) / <alpha-value>)",
          yellow: "hsl(var(--accent-yellow) / <alpha-value>)",
          lime:   "hsl(var(--accent-lime) / <alpha-value>)",
        },
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)",
        "cta-gradient": "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent-purple)) 55%, hsl(var(--primary)) 100%)",
        "surface-gradient": "linear-gradient(180deg, hsl(var(--surface-container)) 0%, hsl(var(--background)) 100%)",
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "28px",
        full: "9999px",
      },
      boxShadow: {
        ambient: "0 18px 40px hsl(var(--background) / 0.6)",
        glow: "0 0 0 2px hsl(var(--primary) / 0.32)",
        "glow-sm": "0 0 0 1px hsl(var(--primary) / 0.24)",
        card: "0 1px 3px hsl(var(--background) / 0.4), 0 4px 12px hsl(var(--background) / 0.15)",
        "card-hover": "0 2px 8px hsl(var(--background) / 0.5), 0 8px 24px hsl(var(--background) / 0.22)",
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
