/** @type {import('tailwindcss').Config} */

// Constants to avoid duplication
const FOREGROUND_COLOR = "hsl(var(--foreground))";
const PRIMARY_COLOR = "hsl(var(--primary))";
const MUTED_FOREGROUND_COLOR = "hsl(var(--muted-foreground))";
const BORDER_COLOR = "hsl(var(--border))";
const BACKGROUND_SECONDARY_COLOR = "hsl(var(--background-secondary))";

module.exports = {
  darkMode: ["class"],
  // Ensure our utilities win against third-party CSS without overusing !important everywhere
  important: "html",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    // Future packages (anti-drift for monorepo growth)
    "../../packages/*/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Prevent purge from dropping dynamic semantic/status classes
  safelist: [
    // text/bg/border/ring for semantic colors
    {
      pattern:
        /^(text|bg|border|ring)-(primary|secondary|muted|accent|success|warning|info)(?:-(50|100|200|300|400|500|600|700|800|900))?$/,
    },
    // status pills / states
    {
      pattern:
        /^(text|bg|border|ring)-(pending|processing|completed|cancelled)$/,
    },
    // foreground/background/card/popover variants often toggled via CMS/config
    {
      pattern:
        /^(text|bg|border|ring)-(foreground|background|card|popover)(?:-foreground)?$/,
    },
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Make typography plugin inherit our tokens (so prose matches app theme)
      typography: (_theme) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": FOREGROUND_COLOR,
            "--tw-prose-headings": FOREGROUND_COLOR,
            "--tw-prose-links": PRIMARY_COLOR,
            "--tw-prose-bold": FOREGROUND_COLOR,
            "--tw-prose-counters": MUTED_FOREGROUND_COLOR,
            "--tw-prose-bullets": MUTED_FOREGROUND_COLOR,
            "--tw-prose-hr": BORDER_COLOR,
            "--tw-prose-quotes": FOREGROUND_COLOR,
            "--tw-prose-quote-borders": BORDER_COLOR,
            "--tw-prose-captions": MUTED_FOREGROUND_COLOR,
            "--tw-prose-code": FOREGROUND_COLOR,
            "--tw-prose-pre-code": FOREGROUND_COLOR,
            "--tw-prose-pre-bg": BACKGROUND_SECONDARY_COLOR,
            "--tw-prose-th-borders": BORDER_COLOR,
            "--tw-prose-td-borders": BORDER_COLOR,
            color: FOREGROUND_COLOR,
            a: { color: PRIMARY_COLOR },
            h1: { color: FOREGROUND_COLOR },
            h2: { color: FOREGROUND_COLOR },
            h3: { color: FOREGROUND_COLOR },
            code: { color: FOREGROUND_COLOR },
          },
        },
        invert: {
          css: {
            "--tw-prose-body": FOREGROUND_COLOR,
            "--tw-prose-headings": FOREGROUND_COLOR,
            "--tw-prose-links": PRIMARY_COLOR,
            "--tw-prose-bold": FOREGROUND_COLOR,
            "--tw-prose-counters": MUTED_FOREGROUND_COLOR,
            "--tw-prose-bullets": MUTED_FOREGROUND_COLOR,
            "--tw-prose-hr": BORDER_COLOR,
            "--tw-prose-quotes": FOREGROUND_COLOR,
            "--tw-prose-quote-borders": BORDER_COLOR,
            "--tw-prose-captions": MUTED_FOREGROUND_COLOR,
            "--tw-prose-code": FOREGROUND_COLOR,
            "--tw-prose-pre-code": FOREGROUND_COLOR,
            "--tw-prose-pre-bg": BACKGROUND_SECONDARY_COLOR,
            "--tw-prose-th-borders": BORDER_COLOR,
            "--tw-prose-td-borders": BORDER_COLOR,
          },
        },
      }),
      colors: {
        // Dark-first color palette
        background: {
          DEFAULT: "hsl(var(--background))",
          secondary: "hsl(var(--background-secondary))",
          tertiary: "hsl(var(--background-tertiary))",
        },
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
          secondary: "hsl(var(--foreground-secondary))",
          tertiary: "hsl(var(--foreground-tertiary))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(var(--primary-50))",
          100: "hsl(var(--primary-100))",
          200: "hsl(var(--primary-200))",
          300: "hsl(var(--primary-300))",
          400: "hsl(var(--primary-400))",
          500: "hsl(var(--primary-500))",
          600: "hsl(var(--primary-600))",
          700: "hsl(var(--primary-700))",
          800: "hsl(var(--primary-800))",
          900: "hsl(var(--primary-900))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // ERP-specific colors
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        // Status colors
        pending: "hsl(var(--pending))",
        processing: "hsl(var(--processing))",
        completed: "hsl(var(--completed))",
        cancelled: "hsl(var(--cancelled))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Consolas", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-slow": "pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      screens: {
        xs: "475px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};
