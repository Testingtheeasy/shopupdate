/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14231D",        // deep green-black, primary text
        paper: "#F7F5EF",      // warm off-white background
        open: "#1F9D55",       // status green
        openBg: "#E7F6EC",
        closed: "#C4433A",     // status red (brick, not stop-sign)
        closedBg: "#FBEAE8",
        unverified: "#9A9488", // warm grey for unverified pins
        unverifiedBg: "#EFEBE3",
        accent: "#2C6E63",     // deep teal, signature color
        accentDark: "#1D4B43",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
}
