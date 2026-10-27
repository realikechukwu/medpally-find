import { activeItems } from '../lib/items';
export const GET = () => {
  const pages = ['https://find.medpally.com/', ...activeItems.map(item => `https://find.medpally.com/item/${item.id}/`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
