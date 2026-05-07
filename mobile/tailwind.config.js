/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        paper: '#faf7f2',
        'paper-2': '#f3ede2',
        ink: '#1a1814',
        'ink-soft': '#4a4640',
        'ink-faint': '#9a948a',
        'accent-orange': '#e85d3c',
        'accent-blue': '#3a6ea5',
        'accent-yellow': '#f5d547',
        'accent-mint': '#8fbc94',
      },
      fontFamily: {
        caveat: ['Caveat_600SemiBold'],
        kalam: ['Kalam_400Regular'],
        'kalam-bold': ['Kalam_700Bold'],
      },
    },
  },
  plugins: [],
};
