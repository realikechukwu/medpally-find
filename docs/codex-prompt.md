# Build: find.medpally.com — a curated cardiology / cardio-ITU resource directory

## What this is
A public, no-login directory of tools, calculators, clinician-built apps and educational resources for cardiology and cardiac intensive care (ITU/ICU). One curator (me) adds items by sharing links from an iPhone. An AI agent (Claude, running in GitHub Actions) reads each link, extracts structured info, and writes it to a JSON file in this repo. The site is static, rebuilt on every commit, and deployed to Cloudflare at `find.medpally.com`.

Keep it lean. No database, no auth, no backend beyond static hosting. But structure the code so favourites, maker-claimed listings, public submissions and other specialties can be added later without a rewrite.

## Architecture
```
iPhone Share Sheet → iOS Shortcut → GitHub API: create issue (label: intake)
  → GitHub Action → Claude (anthropics/claude-code-action) reads link, edits data/items.json,
    validates, commits to main, comments on issue, closes it
  → Cloudflare (Workers static assets, Git-connected) rebuilds → find.medpally.com
Edits: I comment on the item's original issue ("change type to course", "hide, link dead")
  → same Action → Claude updates the item.
```

## Stack
- **Astro** (static output) + **TypeScript** + **Tailwind CSS**
- **MiniSearch** for instant client-side search (fuzzy, prefix, field boosting: title > tags > summary > maker)
- Deploy target: **Cloudflare Workers with static assets** (`wrangler.jsonc`, `assets.directory = ./dist`). Do NOT deploy and do NOT create secrets. Just make it deploy-ready.
- **Zod** schema for items, used both at build time and in a `npm run validate` script

## Data: `data/items.json`
A JSON array, sorted newest first. Single source of truth. Schema (`src/lib/schema.ts`):

| field | type | notes |
|---|---|---|
| `id` | string | URL-safe slug from title, unique, **never changes once created** |
| `title` | string | |
| `url` | string (url) | the actual tool/resource, not the tweet |
| `source_url` | string (url) \| null | where I found it (tweet, post) |
| `summary` | string | one or two plain sentences, ≤ 200 chars, clinically useful, no hype |
| `type` | enum | `tool`, `calculator`, `app`, `clinician-built`, `course`, `video`, `podcast`, `guideline`, `paper`, `thread`, `website`, `dataset` |
| `tags` | string[] | from a controlled vocabulary in `data/tags.json` (e.g. echo, ecg, heart-failure, ep, interventional, imaging, haemodynamics, mcs, cardiac-surgery, pharmacology, acs, valve, congenital, pulmonary-hypertension, critical-care, ultrasound/pocus, ai). Agent may add new tags to `tags.json` when truly needed |
| `specialty` | string[] | default `["cardiology"]`; `"critical-care"` too where relevant |
| `maker` | string \| null | person/org who built it |
| `maker_url` | string \| null | e.g. their X/site |
| `pricing` | enum | `free`, `freemium`, `paid`, `unknown` |
| `platforms` | string[] | `web`, `ios`, `android`, `desktop`, `pdf` |
| `image` | string (url) \| null | og:image if available |
| `note` | string \| null | my personal note from the share |
| `status` | enum | `active`, `hidden`, `broken`. Never hard-delete; hidden items are excluded from the site |
| `added_at` | ISO 8601 UTC | set once |
| `updated_at` | ISO 8601 UTC | bump on every edit |
| `issue` | number | the GitHub issue that created it |
| `owner_contact` | null | reserved for future maker claims |

Seed with ~8 real, well-known, verifiable resources (e.g. MDCalc, ESC Pocket Guidelines app, LITFL ECG Library, ECG Weekly, 123sonography/POCUS resource, ASE guidelines page, etc.). Use only URLs you are confident are real. Set `issue: 0` for seeds.

## Site (Apple meets Airbnb)
Design brief: calm, confident, lots of whitespace, beautiful typography, soft depth. Think Apple's restraint plus Airbnb's search-first browsing.

- **Font**: system stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, …`). Tight, large headings; comfortable body sizes.
- **Colour**: near-white background, near-black text, one accent (a refined cardiac red/coral, used sparingly). Full **dark mode** via `prefers-color-scheme`.
- **Header**: small wordmark "MedPally **Find**", and nothing else noisy.
- **Hero search**: big pill-shaped search bar centred under the header, soft shadow, Airbnb-style. Focuses on `/` key. Results filter instantly as you type; query synced to URL (`?q=`), so searches are shareable.
- **Category bar**: horizontally scrollable row of type filters with simple line icons (Airbnb category-bar style), active state underlined. Below it, tag chips (multi-select). All filters synced to URL params.
- **"New this week"**: a horizontal strip of the latest items when no search/filter is active.
- **Cards grid**: responsive (1 col phone → 4 col wide). Each card: image (og:image, or a tasteful generated fallback tile using favicon + soft gradient seeded by id), title, one-line summary, type pill, 2–3 tags, relative "added" date. Rounded 16–20px corners, subtle hover lift. The whole card links to `/item/[id]`; a secondary icon opens the tool directly.
- **Item page `/item/[id]`**: big title, summary, primary "Open" button, metadata (type, tags, maker, pricing, platforms, added/updated dates), my note if present, source link. Proper OG/Twitter meta so shared links preview nicely.
- **Empty state**: friendly, with a "clear filters" action.
- **Footer**: one quiet line, plus "Last updated" (from newest `updated_at`) and item count.
- Mobile-first. Must feel native on iPhone Safari: safe-area insets, no horizontal scroll, 44px tap targets, smooth momentum scrolling on the category bar.
- Accessible: semantic HTML, focus rings, labels, contrast AA.
- Fast: no client framework; a tiny vanilla TS island for search/filter. Ship the search index as a static JSON built at build time.
- Generate `sitemap.xml`, `robots.txt`, a favicon, and `/items.json` (public, active items only) for future integrations.

## Intake automation
### `.github/workflows/intake.yml`
- Triggers: `issues: [opened, labeled]` when label `intake` is present; `issue_comment: [created]` on issues with label `intake`.
- **Security**: only run if the actor is the repo owner (`github.actor == github.repository_owner`). Ignore everyone else.
- `concurrency: { group: intake, cancel-in-progress: false }` so commits never conflict.
- Uses `anthropics/claude-code-action@v1` with secret `ANTHROPIC_API_KEY` (or `CLAUDE_CODE_OAUTH_TOKEN`; support either, document both). Allow tools: file read/edit, `WebFetch`, `Bash(npm run validate)`, `Bash(git *)`, `gh issue comment/close`.
- Prompt loaded from `.github/intake-prompt.md` (so I can tune it without touching YAML).
- After Claude runs: `npm ci && npm run validate`; if valid, commit as "intake: <title> (#<issue>)" and push to `main`; else comment the validation error on the issue and leave it open.

### `.github/intake-prompt.md` (write this carefully; it's the brain)
Instruct Claude to:
1. Read the issue body (URL + optional note) or, for comments, the requested edit. Find the existing item by `issue` number for edits.
2. **Tweets/X links**: fetch via `https://api.fxtwitter.com/<user>/status/<id>` (JSON) to get text, author and expanded links. Then follow the link to the actual resource it's about. If the tweet itself is the resource (a thread/tip), type = `thread`.
3. Fetch the resource page; extract title, description, og:image, maker, pricing, platforms. Write the summary itself, in plain clinician-friendly English.
4. **Dedupe**: normalise URLs (strip tracking params, trailing slashes, `www`). If it already exists, merge in new info + note, bump `updated_at`, and say so in the comment. No duplicate.
5. Only cardiology / cardiac critical care relevant? If clearly off-topic, comment asking me to confirm and don't add.
6. Never invent facts. Unknown → `null`/`unknown`. If a page can't be read, add what's known and say so in the comment.
7. Edits from comments: apply exactly what's asked; "hide"/"remove" → `status: hidden`; never change `id` or `added_at`.
8. Run `npm run validate`. Then comment a short confirmation with the item's future URL (`https://find.medpally.com/item/<id>`) and the key fields, and close the issue (keep it open if something needs my input).

## iOS Shortcut
Can't be generated as a file, so write `docs/shortcut.md` with exact step-by-step build instructions for a Shortcut named **"Add to MedPally Find"**:
- Accepts URLs + text from Share Sheet (handle cases where X shares text containing a URL: extract the first URL).
- "Ask for Input" (optional note; allow empty).
- "Get Contents of URL": `POST https://api.github.com/repos/<OWNER>/<REPO>/issues`, headers `Authorization: Bearer <fine-grained PAT, Issues: read/write on this repo only>`, `Accept: application/vnd.github+json`; JSON body `{ "title": "intake: <url>", "body": "<url>\n\nnote: <note>", "labels": ["intake"] }`.
- Show a notification "Sent to MedPally Find ✓".
Also document a Mac/desktop fallback: a bookmarklet that opens a prefilled new-issue page.

## Repo deliverables
- Astro site as above, `data/items.json`, `data/tags.json`, `src/lib/schema.ts`
- `scripts/validate.ts` (schema, unique ids, unique normalised urls, tags exist in tags.json, ISO dates, `updated_at >= added_at`)
- `.github/workflows/intake.yml`, `.github/intake-prompt.md`, `.github/workflows/ci.yml` (validate + build on PRs/pushes)
- An issue template for manual intake from the GitHub app
- `wrangler.jsonc` configured for Workers static assets, name `medpally-find`, custom domain route `find.medpally.com` documented (not applied)
- `README.md`: architecture diagram (text), how to run locally, the secrets needed (`ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN`; PAT for the Shortcut), how to connect Cloudflare Git builds, how to add a specialty later
- `docs/roadmap.md`: brief notes on how favourites (localStorage → accounts), maker claims/contact (`owner_contact`, claim issue template), public suggestions (label `suggestion` needing my approval) and a move to Cloudflare D1 would slot in

## Acceptance checks
- `npm run dev`, `npm run build`, `npm run validate` all pass with no warnings.
- Lighthouse on the home page: ≥ 95 performance/accessibility/best-practices/SEO on mobile.
- Search returns results in < 50 ms with 2,000 items (add a script to generate dummy data to test, not committed to items.json).
- Looks excellent at 390px wide (iPhone) and 1440px, light and dark.
- Don't add anything not described here. Simple, clean code over cleverness.
