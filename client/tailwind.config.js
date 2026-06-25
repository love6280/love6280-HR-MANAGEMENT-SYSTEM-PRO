/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          start: "#0a0a1a",
          end: "#0d1117"
        },
        accent: {
          primary: "#4f9eff",
          secondary: "#8b5cf6"
        },
        state: {
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#f43f5e"
        },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
          muted: "#475569"
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        glow: "0 0 20px rgba(79, 158, 255, 0.4)",
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.4)",
      },
      backdropBlur: {
        glass: "20px"
      }
    },
  },
  plugins: [],
}
