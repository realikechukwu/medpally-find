# MedPally Find

A free, curated directory of tools, apps, courses and guidelines for cardiology and cardiac critical care.

**[find.medpally.com](https://find.medpally.com)**

## Suggest a resource

Know something that should be listed? Use the [suggest form](https://find.medpally.com/suggest/). Every suggestion is reviewed before it's added.

To correct or remove a listing, email [hello@marlosolutions.com](mailto:hello@marlosolutions.com?subject=MedPally%20Find%3A%20listing%20correction).

Listings link to third-party resources. They are not clinical advice or endorsements; always check against local guidance.

## Development

The site is built with [Astro](https://astro.build) and deployed on Cloudflare Workers. Listings live in [`data/items.json`](data/items.json), checked against the schema in [`src/lib/schema.ts`](src/lib/schema.ts).

Requires Node 24 or newer.

```bash
npm ci
npm run dev        # local dev server
npm run validate   # check the data against the schema
npm run build      # validate and build to dist/
```

## Licence

Code is released under the [MIT Licence](LICENSE). Linked resources belong to their creators.

## Security

Please report security issues privately to [hello@marlosolutions.com](mailto:hello@marlosolutions.com?subject=MedPally%20Find%3A%20security) rather than opening a public issue.

---

© Marlo Solutions Ltd · [Privacy](https://find.medpally.com/privacy/) · [Terms](https://find.medpally.com/terms/)
