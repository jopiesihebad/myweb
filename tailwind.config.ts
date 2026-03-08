import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#04070f',
        bg2:     '#070c18',
        panel:   '#0a1020',
        panel2:  '#0e1628',
        border:  '#162035',
        border2: '#1e2e4a',
        cyan:    '#00c3ff',
        cyan2:   '#00e5ff',
        lime:    '#39ff14',
        gold:    '#ffd700',
        red:     '#ff0062',
        orange:  '#ff8c00',
        purple:  '#bd93f9',
        magenta: '#ff44cc',
        white:   '#eef4fc',
        gray:    '#5a7090',
        gray2:   '#2a3d58',
        teal:    '#00b4d8',
      },
      fontFamily: {
        mono:  ['"JetBrains Mono"', 'monospace'],
        syne:  ['Syne', 'sans-serif'],
        space: ['"Space Mono"', 'monospace'],
      },
      animation: {
        orbFloat:    'orbFloat 12s ease-in-out infinite',
        blink:       'blink 1.1s infinite',
        cursorBlink: 'cursorBlink 1s infinite',
        tickScroll:  'tickScroll 35s linear infinite',
        fadeUp:      'fadeUp 0.7s forwards',
        newSig:      'newSig 0.5s ease-out',
      },
      keyframes: {
        orbFloat: {
          '0%,100%': { transform: 'translate(0,0)' },
          '50%':     { transform: 'translate(20px,-30px)' },
        },
        blink: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0' },
        },
        cursorBlink: {
          '0%,49%':  { opacity: '1' },
          '50%,100%':{ opacity: '0' },
        },
        tickScroll: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        newSig: {
          from: { background: 'rgba(0,195,255,0.12)', transform: 'translateX(-4px)' },
          to:   { background: 'transparent', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
