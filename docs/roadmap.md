# Future directions

- **Favourites:** done in the browser (`localStorage`, key `mpf:saved`). When accounts arrive, merge those IDs into the account's saved items on first sign-in.
- **Maker claims:** keep `owner_contact` null in public data; introduce a claim issue template and a private contact store before accepting personal information. Curator verification can connect a maker to an existing ID.
- **Public suggestions:** done. `/suggest/` opens a `suggestion` issue; the owner adding `intake` approves it. Untrusted issues never trigger publishing on their own.
- **More specialties:** keep specialty as an array and add specialty filters and dedicated pages when the collection warrants them.
- **D1:** retain item IDs and schema while moving records and relationships to D1. The static JSON export can remain an integration interface; search can continue to use a generated index until scale demands a different approach.
