/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg0: 'var(--bg-0)',
        bg1: 'var(--bg-1)',
        glow: 'var(--glow)',
        cream: 'var(--cream)',
        'cream-dim': 'var(--cream-dim)',
        gold: 'var(--gold)',
        sage: 'var(--sage)',
        ink: 'var(--ink)',
        wall: 'var(--wall)',
        floor: 'var(--floor)',
        ceiling: 'var(--ceiling)',
        'feature-wall': 'var(--feature-wall)',
        wood: 'var(--wood)',
        bench: 'var(--bench)',
        heart: 'var(--heart)',
        card: 'var(--card)',
        bubble: 'var(--bubble)',
        'bubble-ink': 'var(--bubble-ink)',
        presence: 'var(--presence)',
        tag: 'var(--tag)',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: 'var(--r-pill)',
        card: 'var(--r-card)',
        panel: 'var(--r-panel)',
      },
      transitionTimingFunction: {
        museum: 'var(--ease)',
      },
    },
  },
  plugins: [],
};
