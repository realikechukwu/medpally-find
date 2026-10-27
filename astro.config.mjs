import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ site: 'https://find.medpally.com', integrations: [sitemap()], fonts: [{ provider: fontProviders.fontsource(), name: 'Inter', cssVariable: '--font-inter', weights: [400, 700], styles: ['normal'], subsets: ['latin'], fallbacks: ['sans-serif'] }], vite: { plugins: [tailwindcss()] } });
