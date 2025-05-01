/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontSize: {
        base: "1.2rem",
        lg: "1.25rem",
        xl: "1.5rem",
      },
    },
  },
  plugins: [],
};
