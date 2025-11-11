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
        // ✅ NataCarePM Design System (Primary Palette)
        'night-black': {
          DEFAULT: '#2f3035',
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#dddde1',
          300: '#cbcbd2',
          700: '#2f3035',
          800: '#25262a',
        },
        'palladium': {
          DEFAULT: '#b1b1b1',
          50: '#f8f8f8',
          100: '#e8e8e8',
          200: '#d8d8d8',
          300: '#c8c8c8',
          400: '#b1b1b1',
        },
        'persimmon': {
          DEFAULT: '#f87941',
          50: '#fef3ed',
          100: '#f87941',
          200: '#f66b28',
          300: '#f45d0f',
        },
        'no-way-rose': {
          DEFAULT: '#f9b095',
          50: '#fef5f2',
          100: '#f9b095',
          200: '#f7a082',
        },
        'violet-essence': {
          DEFAULT: '#e6e4e6',
          50: '#f5f4f5',
          100: '#e6e4e6',
          200: '#d2cfd2',
        },
        'brilliance': {
          DEFAULT: '#fdfcfc',
          50: '#fdfcfc',
          100: '#fbfafa',
          200: '#f8f7f7',
        },
        
        // ✅ Semantic Colors (Design System)
        'success': {
          DEFAULT: '#10b981',
          light: '#34d399',
          bg: 'rgba(16, 185, 129, 0.1)',
        },
        'warning': {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          bg: 'rgba(245, 158, 11, 0.1)',
        },
        'error': {
          DEFAULT: '#ef4444',
          light: '#f87171',
          bg: 'rgba(239, 68, 68, 0.1)',
        },
        'info': {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          bg: 'rgba(59, 130, 246, 0.1)',
        },
        
        // Enterprise Color Palette (Legacy - Keep for compatibility)
        'accent-coral': '#FF6B6B',
        'accent-coral-dark': '#EE5A52',
        'accent-blue': '#4ECDC4',
        'accent-blue-dark': '#45B7AF',
        'accent-emerald': '#95E1D3',
        'alabaster': '#F8F9FA',
        
        // Extended Brand Colors
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        
        // Semantic Colors
        semantic: {
          success: '#10B981',
          successLight: '#D1FAE5',
          warning: '#F59E0B',
          warningLight: '#FEF3C7',
          error: '#EF4444',
          errorLight: '#FEE2E2',
          info: '#3B82F6',
          infoLight: '#DBEAFE',
        },
        
        // Neutral Extended
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      
      // Professional Shadows
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'strong': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      },
      
      // Border Radius
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'input': '8px',
      },
      
      // Animations
      animation: {
        'pulse': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'floating': 'floating 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      
      keyframes: {
        floating: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      // Backdrop Blur
      backdropBlur: {
        'xs': '2px',
        'glass': '10px',
      },
      
      // Glassmorphism utilities
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      },
      
      // Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Z-index
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};