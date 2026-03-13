import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1F4E79', light: '#2E75B6', muted: '#D6E4F0' },
      }
    }
  },
  plugins: []
}
export default config
