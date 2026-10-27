# MedPally Find

A static, curated cardiology and cardiac critical care resource directory. Items live in `data/items.json`; `data/tags.json` is the controlled vocabulary. There is no login, database, or server-side application.

```text
iPhone share sheet → Shortcut → GitHub issue (intake)
  → owner-only GitHub Action → Claude reads and edits JSON
  → validate → commit to main → Cloudflare Workers build → find.medpally.com
Owner comment on original issue → same workflow → update existing item
```

## Local development

Use Node 24 or newer. Run `npm ci`, `npm run dev`, `npm run validate`, and `npm run build`. `npm run preview` serves the build. `npm run benchmark` generates 2,000 in-memory synthetic items and measures search without modifying the collection. The public active-only feed is `/items.json`; the prebuilt MiniSearch index is `/search-index.json`.

## GitHub intake setup

1. Create a GitHub repository with `main` as its default branch, push these files, and create the `intake` label. Install the [Claude GitHub app](https://github.com/apps/claude) on the repository.
2. Add **either** the repository Actions secret `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` (Claude OAuth). The workflow supports both input names; configure only one. Enable Actions and allow the workflow token to write repository contents and issues. Branch protection must allow the action to push to `main`, or the run will report the failure and leave the issue open.
3. Follow [the iPhone Shortcut instructions](docs/shortcut.md). Its separate fine-grained PAT needs Issues read/write for this repository only. The Shortcut's token is not an Actions secret.
4. The workflow only accepts events from the repository owner. Comment on the original issue to edit its item, even after it has closed. Hidden and broken items remain in the source but are excluded from the site and public feed. A duplicate merged from a new issue remains associated with its original issue.

The Claude prompt is in `.github/intake-prompt.md`. The workflow validates before committing and only comments success after a successful push. GitHub concurrency allows one running and one pending run per group; an additional queued event can replace an older pending event, so check Actions and retrigger any displaced intake.

## Cloudflare Workers

The Wrangler config serves `dist` as static assets; it does not apply a route. In Cloudflare, connect the GitHub repository to Workers Builds, select `main`, set the build command to `npm run build`, and set the deploy command to `npx wrangler deploy`. Set a supported Node version (24+) in the build environment. After the initial setup, add `find.medpally.com` as a custom domain in the Worker's **Settings → Domains & Routes**; the domain must be in a zone on your Cloudflare account. This project does not deploy itself or create secrets.

## Adding a specialty

Add the specialty string to relevant items' `specialty` arrays. The schema already accepts multiple specialties. When the collection is large enough, add a specialty filter and pages using that field; existing item IDs, links, and JSON consumers remain stable. See [the roadmap](docs/roadmap.md).
