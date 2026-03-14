import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0E1116",
          card: "#161B22",
          accent: "#5B7C99",
          headline: "#F2F4F8",
          muted: "#A1A8B3",
        },
        kpi: {
          green: "#4ADE80",
          blue: "#60A5FA",
          amber: "#FBBF24",
          purple: "#A855F7",
          red: "#F87171",
        },
      },
      fontFamily: {
        montserrat: ["'Montserrat'", "system-ui", "sans-serif"],
        opensans: ["'Open Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
