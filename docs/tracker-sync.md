# PTCGL Tracker sync

Training Court can receive saved Battle Logs from the
[PTCGL Tracker](https://github.com/cdierkens/ptcgl-battle-log-tracker) desktop
app. The tracker already ships the delivery worker; this document covers the
receiving side.

Discussed with `jw-kriewall` in
[#71](https://github.com/jlgrimes/training-court/issues/71#issuecomment-6621465768).
The decisions below are theirs unless marked otherwise.

## Decisions

| Question | Decision |
| --- | --- |
| Where the connect surface lives | Preferences, in the Account tab next to the PTCG Live screen name (it is the prerequisite). Token list, default format, token replacement and revocation live there. Match editing stays in the log overlay. |
| Auth | One write-only token per device (→ credential; see "On the noun"). It permits creating logs only. Editing a log uses the player's normal signed-in session. |
| Rejected deliveries | Reject only when the parser cannot produce a usable match or cannot identify the account's player. Missing sprites, archetypes or decklist are **accepted** and editable afterwards. Rejections return a readable reason. |
| Appearance | Synced logs use the same overlay and editing experience as pasted logs. Provenance is a quiet "Imported from {name}" line, not a badge or a separate list. |
| Deck information | Retain and display the supplied decklist immediately, but do **not** create a deck-library entry. The list can be replaced, edited or removed without touching sprites. Saving it to the library is a later decision. |
| Format | The deck hint's `format` when present, otherwise the credential's default format. Editable in the log overlay. |

**On the noun.** JW's answer says "device", but nothing here detects or tracks a
machine: it is a credential — one token plus the nickname the player gave it —
and revoking it just stops that token. So the model and the API say
*credential*; "device" survives only as a suggested nickname ("Desktop"). The
provenance line reads **"Imported from {name}"** using that nickname, and a
shared log omits it.

## Data model

`tracker_credentials` — one row per issued token, labelled by the player. The
server never learns anything about the machine that holds it.

| Column | Notes |
| --- | --- |
| `id` | uuid, referenced by `logs.source_credential_id` |
| `user_id` | `auth.users.id`, cascade delete |
| `label` | player-supplied nickname, e.g. "Desktop" |
| `default_format` | one of `logFormats` |
| `token_hash` | SHA-256 of the `tct_` token. The plaintext is shown once and never stored |
| `token_hint` | last four characters, for the token list |
| `created_at`, `last_used_at`, `revoked_at` | `last_used_at` is stamped only on an accepted (or duplicate) delivery, so "last sync" never advances for a rejected one. Revoked rows are kept so provenance survives |
| `window_started_at`, `window_count` | fixed-window rate limit, 120 requests/hour |
| cap | ten active rows per player, enforced by a `before insert` trigger so concurrent mints cannot exceed it |

`logs` gains:

| Column | Notes |
| --- | --- |
| `import_hash` | SHA-256 of the normalised log. Unique per user, partial index. Silent de-duplication of tracker retries; pasted logs are not hashed yet, so the same match can still exist twice across the two paths |
| `source_credential_id` | null for pasted logs. Nulled if the credential row is deleted; revoking keeps it |
| `decklist_text` | verbatim PTCGL decklist from the hint, `null` when there is none. `decklist_id` stays `null` until a player saves it to their library |

The migration lives in
[`supabase/migrations/20261109000000_tracker_sync.sql`](../supabase/migrations/20261109000000_tracker_sync.sql).

## API

`POST https://www.trainingcourt.app/api/battle-logs`

```
Authorization: Bearer tct_…
Content-Type: application/json
```

The `www` host matters: the apex 308-redirects and the tracker does not follow
redirects on purpose.

Request:

```json
{
  "schemaVersion": 1,
  "log": "…",
  "playerName": "Ash",
  "savedAt": "2026-10-27T02:47:00.000Z",
  "appVersion": "0.4.1",
  "deck": {
    "decklist": "4 Dreepy TWM 128\n…",
    "format": "TEF-30C",
    "archetype": { "id": "limitless:284/0", "label": "Dragapult ex", "cards": ["dragapult"] },
    "opponentArchetype": null,
    "identity": { "deckId": "…", "listId": "…", "hashVersion": 1 }
  }
}
```

Responses:

| Status | Body | Tracker behaviour |
| --- | --- | --- |
| `201` | `{ "status": "accepted", "id": "…" }` | mark synced |
| `200` | `{ "status": "duplicate" }` | mark synced, no second row |
| `400` | `{ "error": "invalid_request", "message": "…" }` | permanent failure |
| `401` | `{ "error": "invalid_token", "message": "…" }` | pause and ask for a new token |
| `422` | `{ "error": "…", "message": "…" }` | failed, reason shown |
| `429` | `{ "error": "rate_limited", "message": "…" }` | retry later |
| `500` | `{ "error": "server_error" }` | retry later |

422 reasons: `unsupported_language`, `unparseable_log`, `player_not_found`,
`screen_name_missing` (the account has no PTCG Live screen name yet; fixable in
Preferences, unlike the other three).

### Ingest rules

1. The token is looked up by hash. Missing, unknown or revoked → `401`. Rate
   window exceeded → `429`.
2. `log` is normalised: BOM stripped, CRLF → LF, trailing whitespace trimmed.
   The normalised text is what gets stored and re-parsed, because the detail
   page re-parses the stored row.
3. Language detection and parsing run with the account's `live_screen_name`.
   If the parser fails, the player cannot be found in the log, or the winner
   cannot be determined → `422`, log stays local.
4. A missing, empty or malformed `deck` object **never** rejects the delivery.
   It degrades to "no deck attached". A hint without a confirmed format keeps
   its decklist and labels; only the format falls back.
5. `format` = `deck.format` when it is a code this site knows (`logFormats`),
   otherwise the credential's `default_format`. An unknown future code falls
   back rather than becoming a label the edit dialog and stats cannot render.
6. `archetype` / `opp_archetype` = the hint labels when present, otherwise the
   parser's output. Labels are normalised to the site's stored convention
   (lowercase, `-` for spaces, trailing ` ex` dropped) so sprites keep working.
7. `result` and `turn_order` come from `live_screen_name`, never from the
   tracker's optional `playerName`. A log that does not contain the account's
   name is rejected rather than stored with a null result (the list view treats
   null as a win).
8. `created_at` = `savedAt` clamped to now. `decklist_text` = hint decklist, or
   `null` when absent, empty, or larger than 16 KB (real lists are ~2 KB).
9. `import_hash` de-duplicates retries. A duplicate returns `200` and writes
   nothing.
10. A body over 256 KB is rejected permanently (`400`). The cap is checked
    from `Content-Length` before the body is buffered, and again after the
    read for chunked requests.

## Preferences surface

- Empty state: "Sync saved Battle Logs from PTCGL Tracker automatically", a
  download link, and **Create a token**.
- Without a PTCG Live screen name the section explains the prerequisite instead
  of offering a token.
- Creating a token asks for a nickname and default format, then shows the
  destination config once with a copy button, plus a note to turn on
  **Send deck identity** for that destination in the tracker.
- The token list shows nickname, format, created date, last sync, **Replace
  token** and **Revoke**.
- No sync dashboard, per-log history or remote disconnect.

The config is the tracker's existing v1 shape:

```json
{
  "ptcglTrackerDestination": 1,
  "name": "Training Court",
  "url": "https://www.trainingcourt.app/api/battle-logs",
  "auth": { "type": "bearer", "token": "tct_…" }
}
```

## Log overlay

- Synced logs are normal rows, ordered by `created_at` (the match's save time).
- The detail page shows "Imported from {name}" (the token's nickname) for rows
  with a `source_credential_id`.
- The edit dialog gains an optional decklist text field. It is independent of
  the decklist picker and of the archetype, and can be emptied.
- No review queue, no badge, no per-token filter.

## What each part ships

This landed as a stack, so read the scope narrowly:

1. **Ingest** — schema, tokens, `POST /api/battle-logs`. No UI; the columns it
   writes are invisible until part 3.
2. **Preferences** — the connect card, token list, replace, revoke and editing
   a token's default format.
3. **Log overlay** — "Imported from {name}", the decklist tab, and editing the
   attached list.

## Out of scope

OAuth, bulk backfill, remote edit/pause/unlink, locale work, Pocket, automatic
decklist creation, and reconciling the tracker's `identity` hashes with
Training Court deck ids.

## Testing

- Unit tests for envelope validation, deck-hint tolerance, log
  normalisation/hashing, format precedence, archetype label normalisation and
  every rejection path.
- Route test with a mocked credential lookup and parser covering
  `201`/`200`/`401`/`422`/`429`/`500`.
- Credential lifecycle tests with the admin client mocked: validation, cap,
  revoke, list-unavailable, rotate.
- Manual: mint a token on a preview deployment, configure the tracker against
  it, and confirm a duplicate retry produces one row.
