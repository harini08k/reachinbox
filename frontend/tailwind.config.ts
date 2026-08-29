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
          green: "#4CAF50",
          greenLight: "#E8F5E9",
          greenDark: "#3d8b40",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F5F5F5",
          border: "#E5E7EB",
        },
        text: {
          primary: "#1A1A1A",
          secondary: "#6B7280",
        },
        status: {
          scheduled: "#F59E0B",
          scheduledBg: "#FEF3C7",
          sent: "#6B7280",
          sentBg: "#F3F4F6",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
