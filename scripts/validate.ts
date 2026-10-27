import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { itemSchema, landingSchema, topicSchema, normalizeUrl } from '../src/lib/schema';
import { slug, typeKeys } from '../src/lib/items';
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
try {
  const tags = z.array(z.string().min(1)).parse(read('data/tags.json'));
  if (new Set(tags).size !== tags.length) throw new Error('Duplicate controlled tags');
  if (new Set(tags.map(slug)).size !== tags.length) throw new Error('Topic slugs must be unique');
  const topicContent = z.record(z.string(), topicSchema).parse(read('data/topics.json'));
  const typeContent = z.record(z.string(), landingSchema).parse(read('data/types.json'));
  // A topic without written content falls back to a generic intro, so intake can add tags without editing topics.json.
  for (const key of Object.keys(topicContent)) if (!tags.includes(key)) throw new Error(`Unknown topic content: ${key}`);
  for (const key of typeKeys) if (!(key in typeContent)) throw new Error(`Missing type content: ${key}`);
  for (const key of Object.keys(typeContent)) if (!typeKeys.includes(key)) throw new Error(`Unknown type content: ${key}`);
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
    // Summaries are public copy; intake notes about what couldn't be checked belong in the curator comment.
    if (/could(n't| not) be (read|checked)|not checked|not stated|unreadable|author's post/i.test(item.summary)) throw new Error(`${item.id}: summary contains an intake note`);
  }
  for (let i = 1; i < items.length; i++) if (items[i-1].added_at < items[i].added_at) throw new Error('Items must be sorted newest first');
  console.log(`Validated ${items.length} items and ${tags.length} tags.`);
} catch (error) { console.error(error); process.exitCode = 1; }
