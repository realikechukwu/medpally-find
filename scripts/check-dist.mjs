import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const errors = [];
const titles = new Map();
const descriptions = new Map();
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))).flat();
}
const files = await walk(root);
const htmlFiles = files.filter(file => file.endsWith('.html'));
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
const exists = async file => { try { return (await stat(file)).isFile(); } catch { return false; } };
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const relative = path.relative(root, file);
  const titleMatches = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/gi)];
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => match[0]).filter(tag => attr(tag, 'name')?.toLowerCase() === 'description');
  if (titleMatches.length !== 1 || !titleMatches[0]?.[1].trim()) errors.push(`${relative}: expected one nonempty title`);
  if (metas.length !== 1 || !attr(metas[0], 'content')?.trim()) errors.push(`${relative}: expected one nonempty description`);
  for (const [value, seen, kind] of [[titleMatches[0]?.[1], titles, 'title'], [metas[0] && attr(metas[0], 'content'), descriptions, 'description']]) {
    if (!value) continue;
    const key = decode(value).trim();
    if (seen.has(key)) errors.push(`${relative}: duplicate ${kind} also used by ${seen.get(key)}`); else seen.set(key, relative);
  }
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { errors.push(`${relative}: invalid JSON-LD: ${error.message}`); }
  }
  for (const match of html.matchAll(/\bhref\s*=\s*["']([^"']*)["']/gi)) {
    const href = decode(match[1]);
    if (!href || href.startsWith('#') || /^(?:mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    let url;
    try { url = new URL(href, `https://find.medpally.com/${relative === 'index.html' ? '' : relative}`); } catch { errors.push(`${relative}: invalid href ${href}`); continue; }
    if (url.origin !== 'https://find.medpally.com') continue;
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { errors.push(`${relative}: invalid href ${href}`); continue; }
    const candidate = path.resolve(root, `.${pathname}`);
    if (!candidate.startsWith(root + path.sep) && candidate !== root) { errors.push(`${relative}: href escapes dist: ${href}`); continue; }
    if (!await exists(candidate) && !await exists(path.join(candidate, 'index.html'))) errors.push(`${relative}: missing internal href ${href}`);
  }
}
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const url = new URL(match[1]);
  const candidate = path.join(root, decodeURIComponent(url.pathname), 'index.html');
  if (!await exists(candidate)) { errors.push(`sitemap: missing ${url.pathname}`); continue; }
  const html = await readFile(candidate, 'utf8');
  if (/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) errors.push(`sitemap: noindex page ${url.pathname}`);
  if (['/saved/', '/suggest/', '/badge/'].includes(url.pathname)) errors.push(`sitemap: excluded page ${url.pathname}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; } else console.log(`Checked ${htmlFiles.length} HTML pages: internal links, unique metadata, JSON-LD and sitemap passed.`);
