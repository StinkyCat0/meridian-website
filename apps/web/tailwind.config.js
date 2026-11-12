/**
 * Loaded through `@config "../tailwind.config.js"` in src/index.css because
 * Tailwind CSS 4 no longer auto-detects JavaScript config files.
 *
 * The v4 legacy bridge maps these v3 theme keys to CSS variables, so no key
 * needs to move into `@theme`. In particular, `backdropBlur.sm` becomes
 * `--backdrop-blur-sm`, which keeps the existing `backdrop-blur-sm` classes
 * at 4px (v4's default `blur-sm` scale is 8px). The `content` globs are
 * additive to v4's automatic source detection.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ✅ Glassy Chat Theme Colors
      colors: {
        'glass-bg': 'rgba(30, 41, 59, 0.6)',
        'glass-border': 'rgba(148, 163, 184, 0.2)',
        'glass-highlight': 'rgba(59, 130, 246, 0.1)',
        'chat-blue': '#3b82f6',
        'chat-blue-light': '#60a5fa',
        'chat-blue-dark': '#2563eb',
        'chat-bg': 'rgba(15, 23, 42, 0.8)',
        'sidebar-bg': 'rgba(30, 58, 95, 0.7)',
      },
      // ✅ Backdrop Blur Utilities
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
      },
      // ✅ Custom Shadows for Glass Effect
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.15)',
        'chat': '0 4px 24px rgba(59, 130, 246, 0.15)',
      },
      // ✅ Gradient Backgrounds
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
        'chat-gradient': 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e293b 100%)',
      },
      // ✅ Animation Utilities
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
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
      },
    },
  },
  plugins: [],
}
