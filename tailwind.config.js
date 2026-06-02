/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          deep: "#051007", // Deep Forest Green/Black background
          panel: "#0d1d12", // Lighter forest green panel
        },
        green: {
          electric: "#00FF87",
        },
        cyan: {
          blue: "#60EFFF",
        },
        orange: {
          DEFAULT: "#FF6B2C",
        },
        white: {
          soft: "#F5F3FF",
        },
        gray: {
          muted: "#8888aa",
        }
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
        heading: ["var(--font-rajdhani)", "sans-serif"],
      },
      animation: {
        'pulse-glow': 'pulseGlow 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 107, 44, 0.3)', borderColor: 'rgba(255, 107, 44, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 107, 44, 0.8)', borderColor: 'rgba(255, 107, 44, 1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0.5' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
