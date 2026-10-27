import { getPublishedPosts } from '../../lib/blog';
const escapeXml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
export async function GET() {
  const posts = await getPublishedPosts();
  const site = 'https://find.medpally.com';
  const items = posts.map(post => `<item><title>${escapeXml(post.data.title)}</title><link>${site}/blog/${encodeURIComponent(post.id)}/</link><guid>${site}/blog/${encodeURIComponent(post.id)}/</guid><description>${escapeXml(post.data.description)}</description><pubDate>${post.data.published.toUTCString()}</pubDate></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>MedPally Find articles</title><link>${site}/blog/</link><description>Guides to resources for cardiology and cardiac critical care.</description>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
