/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          accent: '#a39274',
          DEFAULT: '#a39274',
          light: '#b8ab93',
          dark: '#8f8064',
        },
        surface: '#dfd8c8',
        text: {
          primary: '#252523',
          secondary: '#4a4a47',
          muted: '#6b6b68',
        },
        status: {
          registered: '#dfd8c8',
          present: '#dcfce7',
          admitted: '#dcfce7',
          eliminated: '#fee2e2',
          rejected: '#fee2e2',
          waitlist: '#fef9c3',
          pending: '#fef9c3',
          draft: '#f3f4f6',
          active: '#dbeafe',
          locked: '#f3f4f6',
        },
        success: '#16a34a',
        error: '#dc2626',
        warning: '#d97706',
        info: '#2563eb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'card': '0 1px 4px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}