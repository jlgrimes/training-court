# Deck identification

As an admin, open **Admin → Deck identification**. Choose a card sprite,
optionally a second card sprite, and one or two sprites for the deck label.
The editor reuses the existing sprite dropdowns and saves their names directly.

**Save rule** adds the association, or saves changes to the row selected with
**Edit**. **New rule** clears the selections without writing to the database.
**Delete** removes an admin-added association. The list starts empty; existing
`associatedPokemon` entries remain in code and do not need to be added again.

| Card | Second card | Deck label |
| --- | --- | --- |
| caterpie | | butterfree |
| dreepy | crushing-hammer | dragapult,crushing-hammer |
| dreepy | torchic | dragapult,blaziken |

These rows add to `associatedPokemon` in `archetype.utils.ts`. Direct Pokémon
detection and the original language-specific log-line filters remain in use.
Built-in single-card associations retain their order; admin additions follow
them in saved order. An explicit two-card variant takes precedence when both
cards appear in eligible lines. This does not replace or expand the log parser.

The table contains `id`, `card`, `second_card`, and `archetype`. There are no
per-language rules, alias fields, priorities, or enabled flags. Add, edit, and
delete rules from the editor. Database policies and API checks restrict writes
to the existing admins.

For a fresh database setup, run the full contents of
`supabase/migrations/20261012000000_deck_identification_rules.sql` once in the
Supabase SQL Editor, or apply it through the normal migration process. This is
the only migration needed for this feature. It creates the final table and
permissions directly, with no seeded associations. The earlier conversion and
cleanup migrations have been removed because none of them were applied.
`20261011000000_tournament_preview_summaries.sql` belongs to a separate feature
and is not required for deck associations. No manual inserts or other SQL calls
are needed; manage additional associations in the app after setup.

As a user, import a battle log as usual. The import reads additional associations
and passes them to the original identifier. For example, eligible lines showing
Dreepy and Torchic can suggest `dragapult,blaziken` when that variant is configured.
You can correct the suggested label before saving. An empty table or failed
request falls back to the original built-in behavior. Turn parsing, results,
player ordering, and saved-label handling use the original parser. Existing
saved logs are not rewritten when an admin changes an association.

The admin list loads on opening and refreshes after a save/delete or an explicit
Retry. It does not poll, refresh on focus/reconnect, or retry failed requests
automatically. Previously, SWR's default focus/reconnect revalidation and error
retries could repeatedly call `/api/admin/deck-rules`.

Localized card names resolve automatically through `PokemonStrings` and
`lib/i18n/card-sprite-names.ts`, separately from rule configuration. The mappings
cover common names in the six existing log languages, including Dreepy's
[German](https://www.pokemon.com/de/pokedex/grolldra) and
[French](https://www.pokemon.com/fr/pokedex/fantyrm) names. This is not a complete
translated card catalog; additional names belong in the shared name mappings.

Checks:

```sh
npm test -- --runInBand __tests__/battle-logs/deck-associations.test.ts __tests__/battle-logs/battle-log.utils.test.ts __tests__/battle-logs/AddBattleLogInput.concession.test.tsx __tests__/admin/deck-rules-route.test.ts __tests__/admin/DeckRulesEditor.test.tsx __tests__/admin/DeckRulesEditor.requests.test.tsx
npm run translations:check
```

After migrating a local/test database, verify the policies with
`npm run test:e2e:database -- e2e/database/deck-identification-rules.spec.ts`.
