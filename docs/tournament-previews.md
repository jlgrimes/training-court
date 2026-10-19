Tournament previews use `public.get_tournament_previews_v1` to retrieve bounded
tournament lists with computed match records. Full rounds are loaded by detail
pages only. Both PTCG and Pocket use the same aggregation rules as `getRecordObj`.

Before deploying this client, apply
`supabase/migrations/20261011000000_tournament_preview_summaries.sql` through your
normal database migration process (or the Supabase SQL editor). The function uses
invoker security and scopes all reads to `auth.uid()`; existing RLS still applies.
It adds no stored counters and performs no data backfill.

For large histories, inspect query plans and existing indexes on tournament
`(user, date_from)` and round `(tournament, user)` columns before adding indexes.

Run `npm run test:e2e:database -- --grep "preview summaries"` against a configured
test database after applying the migration. The test creates isolated fixtures,
checks aggregation and edit/delete behavior, and removes its test account.
