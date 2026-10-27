import { activeItems, MIN_INDEXABLE_ITEMS, slug } from '../lib/items';
import { types } from '../lib/schema';
import { getPublishedPosts } from '../lib/blog';
import tags from '../../data/tags.json';
const site = 'https://find.medpally.com';
const latest = (dates: string[]) => dates.length ? dates.sort().at(-1)?.slice(0, 10) : undefined;
const newest = (items: typeof activeItems) => latest(items.map(item => item.updated_at));
export async function GET() {
  const posts = await getPublishedPosts();
  const allLatest = newest(activeItems);
  const pages: { path: string; lastmod?: string }[] = [
    { path: '/', lastmod: allLatest }, { path: '/browse/', lastmod: allLatest }, { path: '/topics/', lastmod: allLatest },
    { path: '/about/' }, { path: '/privacy/' }, { path: '/terms/' },
    { path: '/blog/', lastmod: latest(posts.map(post => post.data.updated.toISOString())) },
    ...tags.flatMap(tag => { const listings = activeItems.filter(item => item.tags.includes(tag)); return listings.length >= MIN_INDEXABLE_ITEMS ? [{ path: `/topics/${slug(tag)}/`, lastmod: newest(listings) }] : []; }),
    ...types.flatMap(type => { const listings = activeItems.filter(item => item.type === type); return listings.length >= MIN_INDEXABLE_ITEMS ? [{ path: `/types/${type}/`, lastmod: newest(listings) }] : []; }),
    ...activeItems.map(item => ({ path: `/item/${item.id}/`, lastmod: item.updated_at.slice(0, 10) })),
    ...posts.map(post => ({ path: `/blog/${encodeURIComponent(post.id)}/`, lastmod: post.data.updated.toISOString().slice(0, 10) }))
  ];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(page => `<url><loc>${site}${page.path}</loc>${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}</url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
