import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ===== Paleta corporativa Lomhifar =====
        // Magenta/fucsia del logo
        brand: {
          50:  '#fdf2f9',
          100: '#fce7f4',
          200: '#fbcfe9',
          300: '#f8a8d4',
          400: '#f273b8',
          500: '#e8459a',
          600: '#d12686',  // tono medio del logo
          700: '#b51e74',
          800: '#921a5e',  // tono profundo del logo
          900: '#771a4f',
          950: '#480a2c',
        },
        // Negro elegante (texto principal)
        ink: {
          50:  '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9de',
          300: '#b7b7c0',
          400: '#8e8e9a',
          500: '#6b6b78',
          600: '#54545f',
          700: '#43434c',
          800: '#2d2d35',
          900: '#1a1a20',
          950: '#0d0d11',
        },
        // Plata (acero de la placa de la pulsera)
        steel: {
          50:  '#fafafa',
          100: '#f0f0f1',
          200: '#dfdfe2',
          300: '#c2c2c7',
          400: '#9f9fa6',
          500: '#7e7e87',
          600: '#65656e',
          700: '#52525a',
          800: '#42424a',
          900: '#36363c',
        },
        accent: {
          DEFAULT: '#d12686',
          hover:   '#b51e74',
        },
        danger: '#b91c1c',
        warning: '#b45309',
        success: '#15803d',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        engrave: ['var(--font-engrave)', 'Arial Narrow', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(13, 13, 17, 0.04), 0 6px 18px rgba(13, 13, 17, 0.06)',
        soft: '0 12px 40px rgba(13, 13, 17, 0.10)',
        glow: '0 0 0 6px rgba(209, 38, 134, 0.10)',
        // Sombra de la placa metálica
        plate: 'inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.4)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #921a5e 0%, #d12686 100%)',
        'ink-gradient': 'linear-gradient(160deg, #1a1a20 0%, #2d2d35 100%)',
        'steel-plate': 'linear-gradient(180deg, #f4f4f6 0%, #d9d9de 50%, #b7b7c0 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
