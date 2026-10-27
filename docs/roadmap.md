# Future directions

- **Favourites:** store item IDs in localStorage first; stable IDs can later map to an authenticated account's saved items.
- **Maker claims:** keep `owner_contact` null in public data; introduce a claim issue template and a private contact store before accepting personal information. Curator verification can connect a maker to an existing ID.
- **Public suggestions:** accept a `suggestion` issue label separately from `intake`. Require curator approval before an owner-triggered intake; never let an untrusted issue trigger automated publishing.
- **More specialties:** keep specialty as an array and add specialty filters and dedicated pages when the collection warrants them.
- **D1:** retain item IDs and schema while moving records and relationships to D1. The static JSON export can remain an integration interface; search can continue to use a generated index until scale demands a different approach.
