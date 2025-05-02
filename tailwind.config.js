import twAnimate from "tw-animate-css";
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["Playfair Display", "serif"],
        heebo: ["Heebo", "sans-serif"],
      },
    },
  },
  plugins: [twAnimate],
};
