/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Shiprocket purple (logo uses #46237A)
        brand: {
          50:  '#f6f1fb',
          100: '#ede0f7',
          200: '#d9c0ee',
          300: '#bd95df',
          400: '#9b69cd',
          500: '#7c46bd',
          600: '#5e2d9d',
          700: '#46237a', // logo purple
          800: '#3a1d65',
          900: '#2e1850',
        },
        // Shiprocket green accent (logo uses #18F040) — softened slightly
        accent: {
          50:  '#e7feed',
          100: '#c2fbcf',
          200: '#86f49d',
          300: '#48ec6b',
          400: '#18f040', // logo green
          500: '#0fce32',
          600: '#0aa628',
          700: '#0a7e22',
        },
        ink: {
          900: '#1f1530',
          800: '#353535', // logo text colour
          700: '#4b4b58',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(70,35,122,0.06), 0 8px 24px rgba(70,35,122,0.08)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #46237a 0%, #7c46bd 100%)',
        'hero-fade': 'radial-gradient(ellipse at top, #f6f1fb 0%, transparent 60%)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
