# Contributing to MedPally Find

Thanks for helping. MedPally Find is curated by one person, so contributions come through a few clear routes.

## Suggest a resource

Use the [suggest form](https://find.medpally.com/suggest/). Every suggestion is reviewed before anything is added. If you made the resource yourself, that's fine; say so in the note.

Please don't open a pull request to add or edit listings. Entries in `data/items.json` are written through the curator's review, which checks each resource, writes the summary and links the entry to its GitHub issue.

## Correct or remove a listing

Email [hello@marlosolutions.com](mailto:hello@marlosolutions.com?subject=MedPally%20Find%3A%20listing%20correction) about a broken link, wrong details, or a listing you own.

## Report a bug

[Open a bug report](https://github.com/realikechukwu/medpally-find/issues/new/choose) with the page link, what went wrong, and your device and browser.

## Fix a bug

Pull requests are welcome for fixes: bugs, broken layouts, accessibility problems, performance, and typos in the site's copy. New features, redesigns and changes to listings are out of scope for pull requests. If you think something is missing, open an issue first.

1. Fork the repository and branch from `main`.
2. Set up the site. It needs Node 24 or newer.

   ```bash
   npm ci
   npm run dev        # local dev server
   npm run build      # validate the data and build to dist/, as CI does
   ```

3. Keep each pull request to one fix, and match the style of the code around it.
4. Run `npm run build` before you push. CI runs the same checks on every pull request.
5. In the pull request, describe the problem and how you checked the fix. For visual changes, add screenshots at phone width and in dark mode.

The suggest form's endpoint, `/api/suggest`, is a Cloudflare Worker in `worker/` and doesn't run under `npm run dev`. Most fixes don't need it. If yours does, run `npm run build` and then `npx wrangler dev`. Without secrets in `.dev.vars` the endpoint answers 503, which is expected. If you add a `GITHUB_TOKEN`, also set `GITHUB_REPO` in `.dev.vars` to your own fork so test suggestions don't reach this repository.

## Ground rules

- Never include patient-identifiable information in issues, pull requests, screenshots or test data.
- Report security issues privately to [hello@marlosolutions.com](mailto:hello@marlosolutions.com?subject=MedPally%20Find%3A%20security), not in a public issue.
- Be kind and patient. Reviews may take a few days.

## Licence of contributions

By submitting a pull request, you agree that your contribution is licensed under the same terms as the files it changes: the [MIT Licence](LICENSE) for code, and [CC BY-NC 4.0](LICENSE-CONTENT) for directory content. You must have the right to submit it under those terms.
