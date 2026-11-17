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
const flat = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();
const latestDate = (dates: string[]) => (dates.length ? [...dates].sort().at(-1)?.slice(0, 10) : undefined);

export const GET = async () => {
  const posts = await getPublishedPosts();
  const usedTags = tags.filter(tag => activeItems.some(item => item.tags.includes(tag)));
  const lastUpdated = latestDate([
    ...activeItems.map(item => item.updated_at),
    ...posts.map(post => post.data.updated.toISOString()),
  ]);

  const topicLines = usedTags.map(tag => {
    const count = activeItems.filter(item => item.tags.includes(tag)).length;
    const desc = topics[tag]?.description ?? `Curated cardiology and cardiac critical care resources for ${label(tag)}.`;
    return `- [${clean(label(tag))}](${site}/topics/${slug(tag)}/) (${count} ${count === 1 ? 'resource' : 'resources'}): ${flat(desc)}`;
  });

  const typeLines = usedTypes.map(type => {
    const count = activeItems.filter(item => inType(item, type)).length;
    const desc = types[type]?.description ?? `${pluralLabel(type)} for cardiology and cardiac critical care.`;
    return `- [${clean(pluralLabel(type))}](${site}/types/${type}/) (${count} ${count === 1 ? 'resource' : 'resources'}): ${flat(desc)}`;
  });

  const starterLines = starterSets.map(set => {
    const links = set.items.map(item => `[${clean(item.short_title ?? item.title)}](${site}/item/${item.id}/)`).join(' -> ');
    return `- **${flat(set.title)}**: ${flat(set.blurb)} Path: ${links}`;
  });

  const postLines = posts.map(post => {
    const published = post.data.published.toISOString().slice(0, 10);
    const postTopics = post.data.topics.map(tag => label(tag)).join(', ');
    return `- [${clean(post.data.title)}](${site}/blog/${encodeURIComponent(post.id)}/): ${flat(post.data.description)} (published: ${published}; topics: ${postTopics})`;
  });

  const itemLines = activeItems.map(item => {
    const meta = [
      `type: ${item.type}`,
      `pricing: ${item.pricing}`,
      item.platforms.length ? `platforms: ${item.platforms.join(', ')}` : null,
      `topics: ${item.tags.map(tag => label(tag)).join(', ')}`,
      item.clinician_built ? 'clinician-built: yes' : null,
      item.maker ? `maker: ${flat(item.maker)}` : null,
      `url: ${item.url}`,
    ].filter(Boolean).join(' | ');
    return `- [${clean(item.title)}](${site}/item/${item.id}/): ${clean(item.summary)} | ${meta}`;
  });

  const lines = [
    '# MedPally Find',
    '',
    `> MedPally Find is a free, clinician-curated directory of ${activeItems.length} cardiology and cardiac critical care learning resources (tools, simulators, apps, calculators, courses, guidelines, videos, podcasts, and references), curated by Ike, a cardiology specialty registrar in England.`,
    '',
    `Last updated: ${lastUpdated ?? 'unknown'}. Published by Marlo Solutions Ltd.`,
    'Audience: doctors, nurses, cardiac physiologists, medical students, and allied health professionals in cardiology and cardiac critical care.',
    'Clinical disclaimer: listings link to third-party educational resources and are not clinical advice or endorsements; always verify against local guidance (e.g. NICE, ESC, BSE, ASE).',
    'Content licence: directory data and blog guides are CC BY-NC 4.0 (credit MedPally Find; contact hello@marlosolutions.com for commercial use). Source code is MIT.',
    '',
    'For programmatic filtering (by `type`, `tags`, `specialty`, `pricing`, `platforms`, `clinician_built`, `maker`, `url`), fetch `/items.json` instead of scraping HTML. For human-facing filtered views, link to `/browse/?q=<query>&type=<type>&tag=<tag>`.',
    '',
    '## Machine-Readable Data',
    `- [Full Resource Catalog (JSON)](${site}/items.json): Structured JSON array of all ${activeItems.length} active resources (id, title, url, source_url, summary, type, tags, specialty, maker, maker_url, clinician_built, pricing, platforms, note, added_at, updated_at).`,
    `- [Search Index (JSON)](${site}/search-index.json): Pre-built MiniSearch index over title, tags, summary, maker, and clinician-built status.`,
    `- [Expanded LLM Context](${site}/llms-full.txt): Single-file full-text reference including topic introductions, FAQs, complete item notes, and full blog guides.`,
    `- [Blog RSS Feed](${site}/blog/rss.xml): RSS 2.0 feed of published cardiology learning guides.`,
    `- [XML Sitemap](${site}/sitemap.xml): Canonical indexable URLs and last-modified dates.`,
    '',
    '## Core Pages',
    `- [Home](${site}/): Directory overview, topic tiles, recently added resources, and starter collections.`,
    `- [Browse & Search](${site}/browse/): Interactive search and filter UI (supports \`?q=\`, \`?type=\`, and \`?tag=\` query parameters).`,
    `- [Topics Index](${site}/topics/): Overview of all cardiology and cardiac critical care topics.`,
    `- [Blog](${site}/blog/): Practical learning guides written by a cardiology registrar.`,
    `- [About](${site}/about/): Curation criteria, editorial process, independence statement, and contact details.`,
    `- [Suggest a Resource](${site}/suggest/): Public submission form for suggesting new cardiology resources.`,
    '',
    ...(starterLines.length ? ['## Starter Collections', ...starterLines, ''] : []),
    '## Topics',
    ...topicLines,
    '',
    '## Resource Types',
    ...typeLines,
    '',
    ...(postLines.length ? ['## Guides', ...postLines, ''] : []),
    '## Resources',
    ...itemLines,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
