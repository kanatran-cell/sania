/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6366F1",
        secondary: "#EC4899",
        surface: "#F8FAFC",
        "text-primary": "#0F172A",
        "text-secondary": "#64748B",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        "health-excellent": "#22C55E",
        "health-good": "#84CC16",
        "health-moderate": "#F59E0B",
        "health-poor": "#EF4444",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};
