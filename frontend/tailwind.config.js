// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        primary: '#00902f',
        secondary: '#62ab44',
        accent: '#98bf11',
        dark: '#111827',
        darker: '#030712',
      },
    },
  },
  plugins: [],
};
