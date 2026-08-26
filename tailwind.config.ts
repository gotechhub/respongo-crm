import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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

        // ---- Respongo neutral surface palette (prototip v2) ----
        rg: {
          bg: "var(--rg-bg)",
          surface: "var(--rg-surface)",
          "surface-alt": "var(--rg-surface-alt)",
          ink: "var(--rg-ink)",
          "ink-soft": "var(--rg-ink-soft)",
          "ink-faint": "var(--rg-ink-faint)",
          line: "var(--rg-line)",
        },

        // ---- Respongo product brand colors (ürün-bazlı renk kodlama) ----
        golms: {
          DEFAULT: "var(--go-blue)",
          deep: "var(--go-blue-deep)",
          tint: "var(--go-blue-tint)",
        },
        golxp: {
          DEFAULT: "var(--go-purple)",
          tint: "var(--go-purple-tint)",
        },
        gocatalog: {
          DEFAULT: "var(--go-amber)",
          raw: "var(--go-amber-raw)",
          tint: "var(--go-amber-tint)",
        },
        gofactory: {
          DEFAULT: "var(--go-green)",
          raw: "var(--go-green-raw)",
          tint: "var(--go-green-tint)",
        },
        gotools: {
          DEFAULT: "var(--go-pink)",
          raw: "var(--go-pink-raw)",
          tint: "var(--go-pink-tint)",
        },

        // ---- sidebar (always-dark shell, independent of light/dark mode) ----
        sidebar: {
          from: "#10165C",
          via: "var(--go-blue-deep)",
          to: "#050714",
          fg: "#EDEDFB",
          "fg-muted": "#CACDF0",
          "fg-faint": "#8285C4",
          "fg-label": "#6C6FAE",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        rg: "0 2px 10px rgba(18,20,46,.05), 0 1px 2px rgba(18,20,46,.04)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
