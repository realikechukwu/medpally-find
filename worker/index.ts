// Serves the static site and handles /api/* (see run_worker_first in wrangler.jsonc).
// POST /api/suggest turns a public suggestion into a GitHub issue labelled `suggestion`.
// It never publishes anything: the curator approves by adding the `intake` label.
import { normalizeUrl } from '../src/lib/url';

interface Fetcher { fetch(input: Request | string, init?: RequestInit): Promise<Response> }
interface RateLimit { limit(options: { key: string }): Promise<{ success: boolean }> }
interface Env {
 ASSETS: Fetcher;
 SUGGEST_LIMIT: RateLimit;
 GITHUB_REPO: string;
 GITHUB_TOKEN?: string;
 TURNSTILE_SECRET_KEY?: string;
}
interface ListedItem { id: string; title: string; url: string; source_url: string | null }

const MAX_BODY = 16_000, MAX_URL = 2000, MAX_NOTE = 1000;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
 new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
const fail = (message: string, status: number) => json({ ok: false, message }, status);

export default {
 async fetch(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname === '/api/suggest') {
   if (request.method !== 'POST') return json({ ok: false, message: 'Use POST.' }, 405, { Allow: 'POST' });
   return suggest(request, env);
  }
  if (pathname.startsWith('/api/')) return fail('Not found.', 404);
  return env.ASSETS.fetch(request);
 },
};

async function suggest(request: Request, env: Env): Promise<Response> {
 if (!env.GITHUB_TOKEN || !env.TURNSTILE_SECRET_KEY) return fail("Suggestions aren't available right now. Please email hello@marlosolutions.com instead.", 503);
 if (request.headers.get('Origin') !== new URL(request.url).origin) return fail('Please use the form on find.medpally.com.', 403);
 if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY) return fail('That suggestion is too long.', 413);

 const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
 if (!(await env.SUGGEST_LIMIT.limit({ key: ip })).success) return fail('Too many suggestions at once. Please wait a minute and try again.', 429);

 let form: FormData;
 try { form = await request.formData(); } catch { return fail('Could not read the form. Please try again.', 400); }
 const field = (name: string) => { const value = form.get(name); return typeof value === 'string' ? value.trim() : ''; };

 // Bots fill the hidden field; tell them it worked and do nothing.
 if (field('website')) return json({ ok: true, message: 'Thanks, we have it.' }, 201);

 const link = parseLink(field('url'));
 if (!link) return fail('Enter a full link, starting with https://', 400);
 const note = field('note');
 if (note.length > MAX_NOTE) return fail(`Keep the note under ${MAX_NOTE} characters.`, 400);

 if (!(await verifyTurnstile(field('cf-turnstile-response'), ip, env.TURNSTILE_SECRET_KEY))) return fail('Please complete the check above the button and try again.', 400);

 const listed = await findListed(request, env, link);
 if (listed) return json({ ok: true, message: "It's already in the directory:", item: { href: `/item/${listed.id}/`, title: listed.title } });

 const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'medpally-find-suggest', 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: `suggestion: ${truncate(link.href.replace(/^https?:\/\//, ''), 90)}`, body: issueBody(link.href, note), labels: ['suggestion'] }),
 });
 if (!response.ok) {
  console.error('GitHub issue creation failed', response.status, await response.text().catch(() => ''));
  return fail("Couldn't send your suggestion. Please try again later.", 502);
 }
 return json({ ok: true, message: "Thanks, we have it. We'll take a look before it's added." }, 201);
}

function parseLink(value: string): URL | null {
 if (!value || value.length > MAX_URL) return null;
 try {
  const url = new URL(value);
  return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.') && !url.username && !url.password ? url : null;
 } catch { return null; }
}

async function verifyTurnstile(token: string, ip: string, secret: string): Promise<boolean> {
 if (!token) return false;
 const body = new FormData();
 body.append('secret', secret); body.append('response', token); body.append('remoteip', ip);
 try {
  const result = await (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })).json() as { success?: boolean };
  return result.success === true;
 } catch { return false; }
}

async function findListed(request: Request, env: Env, link: URL): Promise<ListedItem | null> {
 try {
  const response = await env.ASSETS.fetch(new Request(new URL('/items.json', request.url)));
  if (!response.ok) return null;
  const wanted = normalizeUrl(link.href);
  return (await response.json() as ListedItem[]).find(item => [item.url, item.source_url].some(url => url && normalizeUrl(url) === wanted)) ?? null;
 } catch { return null; }
}

// The URL comes first so the intake prompt reads it as the resource. The note sits in a code fence so
// public text can't @mention people, render links or images, or pass itself off as curator instructions.
function issueBody(url: string, note: string): string {
 const fence = '`'.repeat(Math.max(3, ...[...note.matchAll(/`+/g)].map(match => match[0].length + 1)));
 return [
  url,
  '',
  note ? `Public suggestion note (unverified, not a curator note):\n\n${fence}text\n${note}\n${fence}` : 'No note from the suggester.',
  '',
  '---',
  'Sent from find.medpally.com/suggest. Add the `intake` label to approve it for curation, or close the issue to decline.',
 ].join('\n');
}

const truncate = (value: string, length: number) => value.length > length ? `${value.slice(0, length - 1)}…` : value;
