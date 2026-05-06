/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    'bg-blue-100', 'bg-blue-500', 'text-blue-700', 'stroke-blue-500',
    'bg-red-100', 'bg-red-500', 'text-red-700', 'stroke-red-500',
    'bg-violet-100', 'bg-violet-500', 'text-violet-700', 'stroke-violet-500',
    'bg-purple-100', 'bg-purple-500', 'text-purple-700', 'stroke-purple-500',
    'bg-green-100', 'bg-green-500', 'text-green-700', 'stroke-green-500',
    'bg-amber-100', 'bg-amber-500', 'text-amber-700', 'stroke-amber-500',
    'stroke-yellow-400',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary, #8B5CF6)',
        accent: 'var(--color-accent, #FACC15)',
      },
      fontFamily: {
        sans: ['Nunito', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

