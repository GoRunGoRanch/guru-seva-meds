import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAF9F6",
        surface: "#FFFFFF",
        ink: "#1A1A1A",
        muted: "#6B7280",
        line: "#E5E7EB",
        saffron: "#F59E0B",
        ok: "#15803D",
        okBg: "#DCFCE7",
        warn: "#B91C1C",
        warnBg: "#FEE2E2",
        wait: "#9CA3AF",
        waitBg: "#F3F4F6",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontSize: {
        base: ["1.0625rem", { lineHeight: "1.6" }],
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" },
      boxShadow: { soft: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)" },
    },
  },
  plugins: [],
};
export default config;
