/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          950: '#0f172a',
        },
        // Landing page scoped colors (used via CSS variables)
        'landing-bg': 'var(--landing-bg)',
        'landing-fg': 'var(--landing-fg)',
        'landing-primary': 'var(--landing-primary)',
        'landing-secondary': 'var(--landing-secondary)',
        'landing-soft': 'var(--landing-soft)',
        'landing-muted': 'var(--landing-muted)',
        'landing-border': 'var(--landing-border)',
        'landing-success': 'var(--landing-success)',
        'landing-surface': 'var(--landing-surface)',
      },
      fontFamily: {
        landing: ['var(--font-be-vietnam-pro)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'landing-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        'landing-float': 'landing-float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

