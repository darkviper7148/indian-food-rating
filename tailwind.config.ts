import type { Config } from "tailwindcss";

// Design tokens ---------------------------------------------------------
// Base:    "Papad"   #FAF6EE  (warm rice-paper background, not stock cream)
// Ink:     "Masala"  #241E17  (warm near-black, not pure #111)
// Accent:  "Turmeric" #D99A05 (spice-market gold — the one bold accent)
// Support: "Curry"   #2F6B4F (fresh-leaf green for positive/trust cues)
// Grades follow the Nutri-Score standard hue family so the badge stays
// instantly recognizable, tuned slightly warmer to sit inside the palette.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        papad: {
          DEFAULT: "#FAF6EE",
          50: "#FFFDFA",
          100: "#FAF6EE",
          200: "#F2EADA",
          300: "#E6D9BF",
        },
        masala: {
          DEFAULT: "#241E17",
          700: "#3A3126",
          500: "#5C513F",
          300: "#8C8170",
        },
        turmeric: {
          DEFAULT: "#D99A05",
          600: "#B87F03",
          100: "#FBEACB",
        },
        curry: {
          DEFAULT: "#2F6B4F",
          600: "#255840",
          100: "#DCEBE2",
        },
        grade: {
          a: "#268A4E",
          b: "#7FB93E",
          c: "#E8B923",
          d: "#E8792B",
          e: "#D6432F",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        body: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(36, 30, 23, 0.06), 0 8px 24px -12px rgba(36, 30, 23, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
