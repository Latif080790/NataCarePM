/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    'bg-gray-50',
    'bg-gray-100',
    'bg-gray-900',
    'text-gray-600',
    'text-gray-700',
    'text-gray-900',
    'border-gray-200',
    'border-gray-300',
    'bg-blue-600',
    'bg-blue-50',
    'text-blue-600',
    'text-blue-700',
    'border-blue-200',
  ],
  theme: {
    extend: {
      colors: {
        // Enterprise Color Palette
        'accent-coral': '#FF6B6B',
        'accent-coral-dark': '#EE5A52',
        'accent-blue': '#4ECDC4',
        'accent-blue-dark': '#45B7AF',
        'accent-emerald': '#95E1D3',
        'alabaster': '#F8F9FA',
      },
      animation: {
        'pulse': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'floating': 'floating 3s ease-in-out infinite',
      },
      keyframes: {
        floating: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};