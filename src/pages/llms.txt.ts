import { activeItems, label, slug, usedTypes } from '../lib/items';
import tags from '../../data/tags.json';
export const GET = () => {
  const site = 'https://find.medpally.com';
  const clean = (value: string) => value.replace(/[\r\n]+/g, ' ').replace(/([\[\]\\])/g, '\\$1');
  const usedTags = tags.filter(tag => activeItems.some(item => item.tags.includes(tag)));
  const lines = ['# MedPally Find', '', '> MedPally Find is a free, clinician-curated directory of cardiology and cardiac critical care tools, apps, courses and guidelines.', '', `- [About](${site}/about/)`, `- [Topics](${site}/topics/)`, `- [Blog](${site}/blog/)`, '', '## Topics', ...usedTags.map(tag => `- [${clean(label(tag))}](${site}/topics/${slug(tag)}/)`), '', '## Resource types', ...usedTypes.map(type => `- [${clean(label(type))}](${site}/types/${type}/)`), '', '## Resources', ...activeItems.map(item => `- [${clean(item.title)}](${site}/item/${item.id}/): ${clean(item.summary)}`), ''];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
