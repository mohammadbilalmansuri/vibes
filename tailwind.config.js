/** @type {import('tailwindcss').Config} */
export default {
  content: ["./dist/**/*.{html,js}"],
  darkMode: "class",
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#ffffff",
      balck: "#000000",
      primary: {
        600: "#46484e",
        700: "#383b43",
        800: "#2d3138",
        900: "#23262d",
        950: "#1c2027",
      },
      secondary: {
        50: "#fafafa",
        100: "#f4f4f5",
        200: "#e8e8ea",
        300: "#dcdce0",
        400: "#d4d4d8",
        500: "#a1a1aa",
      },
      accent: "#f3506c",
    },
    screens: {
      xs: "480px",
      sm: "680px",
      md: "880px",
      lg: "1080px",
      xl: "1280px",
      "2xl": "1480px",
      "3xl": "1680px",
    },
    extend: {},
  },
  plugins: [],
};
