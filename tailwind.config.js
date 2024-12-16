/** @type {import('tailwindcss').Config} */
module.exports = {
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
        100: "#f4f4f5",
        200: "#e8e8ea",
        300: "#dcdce0",
        400: "#d4d4d8",
        500: "#a1a1aa",
      },
      accent: {
        400: "#fb7185",
        500: "#f3506c",
      },
    },
    extend: {},
  },
  plugins: [],
};
