/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        // Simple 16 column grid
        custom: "1fr auto",
        custom_5: "1fr auto",
        custom_2: "30% 1fr",
        custom_4: "auto 1fr",
        custom_3: "15% 1fr",
      },
      maxWidth: {
        custom: "1204px",
        custom_1: "1204px",
        custom_2: "1304px",
      },
      fontFamily: {
        booking_font: ["Proxima_Regular", "sans-serif"],
        booking_font_bold: ["Proxima_Bold", "sans-serif"],
        booking_font_normal: ["Proxima_SemiBold", "sans-serif"],
        booking_font2: ["playfair", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
