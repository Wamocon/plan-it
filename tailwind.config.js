/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:    '#0f0f11',   // WMC Dunkel (Header, Hintergrund)
          red:     '#ff1a1a',   // WMC Rot (Primärakzent)
          blue:    '#ff1a1a',   // gemappt auf WMC-Rot (CTAs, Fokus)
          green:   '#22aa66',   // WMC Grün (Erfolg, Soll)
          surface: '#16161a',   // WMC Karten-Hintergrund
          orange:  '#E67E22',
        },
      },
    },
  },
  plugins: [],
};
