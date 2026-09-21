import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        hero: '0 25px 60px -10px rgba(0,0,0,0.35)',
        soft: '0 2px 10px -2px rgba(0,0,0,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
