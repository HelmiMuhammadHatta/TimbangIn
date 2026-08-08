/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'steel': {
          900: '#1C2128',  // Charcoal Steel - background utama dark mode
          800: '#2D3339',  // Panel Graphite - card/section background
          100: '#EDEEF0',  // Steel White - teks di atas dark background
        },
        'safety-amber': '#F2A900',   // Aksen utama, warning/perlu perhatian
        'signal-green': '#3DDC84',   // Status stable/ready/matched
        'alert-red': '#E5484D',      // Error/cancel/unmatch
      },
      fontFamily: {
        'display': ['"IBM Plex Sans"', 'sans-serif'],
        'body': ['"Inter"', 'sans-serif'],
        'mono': ['"IBM Plex Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
