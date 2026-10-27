import { z } from 'zod';

export const types = ['tool','calculator','app','clinician-built','course','video','podcast','guideline','paper','thread','website','dataset'] as const;
const webUrl = z.string().url().refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'Must be an HTTP(S) URL');
const timestamp = z.string().datetime({ offset: false });
export const itemSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: z.string().min(1), url: webUrl,
  source_url: webUrl.nullable(), summary: z.string().min(1).max(200), type: z.enum(types),
  tags: z.array(z.string()).min(1), specialty: z.array(z.string().min(1)).min(1), maker: z.string().min(1).nullable(),
  maker_url: webUrl.nullable(), pricing: z.enum(['free','freemium','paid','unknown']),
  platforms: z.array(z.enum(['web','ios','android','desktop','pdf'])), image: webUrl.nullable(), note: z.string().nullable(),
  status: z.enum(['active','hidden','broken']), added_at: timestamp, updated_at: timestamp,
  issue: z.number().int().nonnegative(), owner_contact: z.null()
}).strict();
export type Item = z.infer<typeof itemSchema>;
const faqSchema = z.object({ question: z.string().min(1), answer: z.string().min(1) }).strict();
export const landingSchema = z.object({
  heading: z.string().min(1), title: z.string().min(1).max(60), description: z.string().min(1).max(155),
  intro: z.string().min(1), faqs: z.array(faqSchema).min(2).max(3), reviewed: z.boolean()
}).strict();
export const topicSchema = landingSchema.extend({ intro: z.string().refine(value => {
  const count = value.trim().split(/\s+/).length;
  return count >= 80 && count <= 150;
}, 'Topic introduction must contain 80–150 words') });
export { normalizeUrl } from './url';
