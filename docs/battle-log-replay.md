# Battle-log reconstruction

The replay reconstructs evidence from an import. It is not a complete Pokemon
rules simulator and does not promise that text logs identify every physical copy.

## Pipeline

1. The imported `BattleLog.sourceText` preserves the original text. Older records
   without it still work, with action/detail locations instead of line numbers.
2. `replay-operations.ts` compiles the supported English grammar into operations
   with ordered operands, stable operation ids, raw text, and source locations.
   Unknown sentences and unsupported languages produce diagnostics.
3. The reducer moves actual card objects between tracked zones. Pokemon keep a
   stable entity id, a bottom-to-top evolution stack, attachments, damage, and
   explicitly logged Special Conditions. Evolution and retreat clear conditions.
   Knockouts discard the stack and attachments once; subsequent confirmations
   do not create additional copies. Explicit returns preserve stack identities.
4. `replay-resolution.ts` explores duplicate-copy assignments using deterministic
   depth-first search. Each pass has its own allocator, board, and hand knowledge.
   Later covered attack/ability requirements reject incompatible histories. There
   are no immediate-next-attack or exactly-two-Munkidori tie-breakers.
5. The result contains a representative board, assessments, correlated surviving
   choice vectors, diagnostics, and parser/rule/input fingerprints. Observed hand
   snapshots remain separate from cards inferred retrospectively.

## Certainty and review

The Replay (Beta) viewer labels observed, inferred, ambiguous, and partial
reconstructions. Cards have no uncertainty badges. Action review shows original
source lines and diagnostics. Retrospective hand knowledge is displayed by
default; observed hand snapshots remain available to the engine and tests.

Motion follows the sourced operation order: a played card and any discard costs
travel from hand to discard before a subsequent deck-to-hand search. Hand sizes
and eligible discard previews follow those animation phases without changing the
underlying replay snapshot. Seeking, resizing, and reduced-motion preferences
restore the final snapshot. Playback allows longer sequences to finish before
advancing. Neither side of the board is dimmed.

Separate counter-placement lines do **not** prove distinct physical targets.
Both same-copy and different-copy assignments remain candidates. Corrections to
owner labels apply only through covered effects, such as Adrena-Brain, Phantom
Dive, and a newly benched Risky Ruins target; other ownership is taken literally.

## Rule coverage

`replay-rules.ts` is an offline, versioned registry. It currently covers Basic
Energy, Double Turbo Energy provision, Dragapult's two attacks, Munkidori's
Adrena-Brain requirements and once-per-copy use, Crispin/Rosa attachment sources,
and selected shuffle sources. Callers can supply an extended `ReplayRules`
registry through `buildBattleLogReplay` options.

Unknown Tools, Special Energy, Stadium modifiers, abilities, and attack costs
must not be treated as proof that a history is impossible. They receive rule
coverage diagnostics. Cost checks also remain inconclusive under Pokemon outside
the registry's covered Energy-neutral set, because passive effects may matter.
Logged damage is applied as reported rather than
recomputed from card damage, Weakness, or Special Energy modifiers.

Explicit Special Condition changes and logged checkup damage are supported.
Unlogged checkup timing, automatic effect expiry, ability suppression, all card
effects, and HP-based knockout prediction are not fully simulated. Unsupported
effects remain visible in diagnostics rather than being claimed as reconstructed.

## Bounds and consistency

Defaults are 128 reconstruction passes and 16 surviving histories. Options can
change these within hard caps of 1024 and 64. If pending assignments remain,
`metadata.search.complete` is false and the result carries `search-limit`.
Unexamined alternatives are never reported as uniquely resolved. If no covered
history is compatible, a diagnosed best-effort pass preserves visible log events
with `inconsistent-log`; it is not a validated hypothesis.

Checks detect duplicate visible card ids, invalid counts/damage, unavailable
damage transfers, and covered attack/ability contradictions. Hidden cards and
unknown source locations prevent a universal 60-card conservation assertion.
`returnedToDeck` is a movement ledger, not a known deck order or exact deck size.
Missing sources are diagnosed; a card explicitly observed in the log may be
materialized with an unknown prior location rather than deducted from an
unrelated tracked zone.

Fingerprints use a stable noncryptographic hash. Parser version, rule version,
rule fingerprint, input fingerprint, perspective, and search options should be
included in any persistent cache key. `metadata.reconstructionFingerprint`
combines those inputs and the bounded-search options. Card-image API responses do not determine
replay state.
