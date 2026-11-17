import { activeItems, inType, label, pluralLabel, slug, usedTypes } from '../lib/items';
import { getPublishedPosts } from '../lib/blog';
import { starterSets } from '../lib/collections';
import tags from '../../data/tags.json';
import topicsData from '../../data/topics.json';
import typesData from '../../data/types.json';

interface LandingMeta {
  heading: string;
  title: string;
  description: string;
  intro: string;
  faqs: { question: string; answer: string }[];
  reviewed: boolean;
}

const site = 'https://find.medpally.com';
const topics = topicsData as Record<string, LandingMeta>;
const types = typesData as Record<string, LandingMeta>;

const clean = (value: string) => value.replace(/[\r\n]+/g, ' ').replace(/([\[\]\\])/g, '\\$1').trim();

export const GET = async () => {
  const posts = await getPublishedPosts();
  const usedTags = tags.filter(tag => activeItems.some(item => item.tags.includes(tag)));

  const lines: string[] = [
    '# MedPally Find (Full Reference)',
    '',
    `> Expanded single-file reference for MedPally Find (${site}), a free, clinician-curated directory of ${activeItems.length} cardiology and cardiac critical care learning resources.`,
    '',
    'For the concise index, see `/llms.txt`. For structured JSON, see `/items.json`.',
    'Clinical disclaimer: listings link to third-party educational resources and are not clinical advice or endorsements; always verify against local guidance.',
    'Content licence: CC BY-NC 4.0 (credit MedPally Find; contact hello@marlosolutions.com for commercial use).',
    '',
  ];

  if (starterSets.length) {
    lines.push('## Starter Collections', '');
    for (const set of starterSets) {
      lines.push(`### ${set.title}`, '', set.blurb, '');
      set.items.forEach((item, index) => {
        lines.push(`${index + 1}. [${clean(item.title)}](${site}/item/${item.id}/) (${label(item.type)}, ${item.pricing}) — ${item.url}`);
      });
      lines.push('');
    }
  }

  lines.push('## Topics', '');
  for (const tag of usedTags) {
    const meta = topics[tag];
    const count = activeItems.filter(item => item.tags.includes(tag)).length;
    lines.push(`### ${meta?.heading ?? label(tag)} (${count} resources)`, '');
    lines.push(`URL: ${site}/topics/${slug(tag)}/`);
    if (meta?.intro) lines.push('', meta.intro);
    if (meta?.faqs?.length) {
      lines.push('', 'FAQs:');
      for (const faq of meta.faqs) {
        lines.push(`- **${faq.question}** ${faq.answer}`);
      }
    }
    lines.push('');
  }

  lines.push('## Resource Types', '');
  for (const type of usedTypes) {
    const meta = types[type];
    const count = activeItems.filter(item => inType(item, type)).length;
    lines.push(`### ${meta?.heading ?? pluralLabel(type)} (${count} resources)`, '');
    lines.push(`URL: ${site}/types/${type}/`);
    if (meta?.intro) lines.push('', meta.intro);
    if (meta?.faqs?.length) {
      lines.push('', 'FAQs:');
      for (const faq of meta.faqs) {
        lines.push(`- **${faq.question}** ${faq.answer}`);
      }
    }
    lines.push('');
  }

  lines.push('## Resources', '');
  for (const item of activeItems) {
    lines.push(`### ${item.title}`, '');
    lines.push(`- Listing: ${site}/item/${item.id}/`);
    lines.push(`- Direct URL: ${item.url}`);
    if (item.source_url) lines.push(`- Source / Repository: ${item.source_url}`);
    lines.push(`- Summary: ${item.summary}`);
    if (item.note) lines.push(`- Curator note: ${item.note}`);
    lines.push(`- Type: ${item.type}${item.clinician_built ? ' (clinician-built)' : ''}`);
    lines.push(`- Topics: ${item.tags.map(tag => label(tag)).join(', ')}`);
    lines.push(`- Specialty: ${item.specialty.join(', ')}`);
    lines.push(`- Pricing: ${item.pricing}`);
    lines.push(`- Platforms: ${item.platforms.join(', ')}`);
    if (item.maker) lines.push(`- Maker: ${item.maker}${item.maker_url ? ` (${item.maker_url})` : ''}`);
    lines.push(`- Added: ${item.added_at.slice(0, 10)} | Updated: ${item.updated_at.slice(0, 10)}`);
    lines.push('');
  }

  if (posts.length) {
    lines.push('## Guides', '');
    for (const post of posts) {
      lines.push(`### ${post.data.title}`, '');
      lines.push(`URL: ${site}/blog/${encodeURIComponent(post.id)}/`);
      lines.push(`Author: ${post.data.author} | Published: ${post.data.published.toISOString().slice(0, 10)} | Updated: ${post.data.updated.toISOString().slice(0, 10)}`);
      lines.push(`Topics: ${post.data.topics.map(tag => label(tag)).join(', ')}`);
      if (post.body) lines.push('', post.body.trim());
      lines.push('');
    }
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
