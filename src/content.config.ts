import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import tags from '../data/tags.json';
import rawItems from '../data/items.json';

const itemIds = new Set(rawItems.map(item => item.id));
const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(155),
    author: z.string().min(1),
    published: z.coerce.date(),
    updated: z.coerce.date(),
    topics: z.array(z.string().refine(tag => tags.includes(tag), 'Unknown topic')).min(1),
    items: z.array(z.string().refine(id => itemIds.has(id), 'Unknown item')).min(1),
    draft: z.boolean()
  }).refine(post => post.updated >= post.published, { message: 'Updated date must not precede published date', path: ['updated'] })
});
export const collections = { blog };
