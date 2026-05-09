/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
        display: ["'Outfit'", "sans-serif"],
      },
      keyframes: {
        softPulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.5" },
          "50%": { transform: "scale(1.4)", opacity: "0" },
        },
      },
      animation: {
        pulseSlow: "softPulse 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
