import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { itemSchema, normalizeUrl } from '../src/lib/schema';
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
try {
  const tags = z.array(z.string().min(1)).parse(read('data/tags.json'));
  if (new Set(tags).size !== tags.length) throw new Error('Duplicate controlled tags');
  const items = z.array(itemSchema).parse(read('data/items.json'));
  const ids = new Set<string>(), urls = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`Duplicate id: ${item.id}`);
    ids.add(item.id);
    const url = normalizeUrl(item.url);
    if (urls.has(url)) throw new Error(`Duplicate URL: ${url}`);
    urls.add(url);
    for (const tag of item.tags) if (!tags.includes(tag)) throw new Error(`${item.id}: unknown tag ${tag}`);
    if (new Date(item.updated_at) < new Date(item.added_at)) throw new Error(`${item.id}: updated_at precedes added_at`);
  }
  for (let i = 1; i < items.length; i++) if (items[i-1].added_at < items[i].added_at) throw new Error('Items must be sorted newest first');
  console.log(`Validated ${items.length} items and ${tags.length} tags.`);
} catch (error) { console.error(error); process.exitCode = 1; }
