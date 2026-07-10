---
name: curate-recital-map
description: Curate/review the recital-artikel-map (data/source/recital-article-map.json) for dora/its/rts recitals - drafting entries, adversarial review, human review (flipping reviewed:true), and finishing (meta.complete + pins). Use when reviewing drafted entries, correcting mappings, or finishing the map.
---

# Curate the recital↔article map

Editorial-metadata layer (AGENTS.md rule 2b): interpretive, hand/LLM-curated,
explicitly NOT legal text; it only feeds the "Relevante overwegingen"/
"Relevante artikelen" panels and MCP output.

Scope: three instrument blocks in `data/source/recital-article-map.json` —
`dora` (keys "1".."106"), `its` ("1".."15"), `rts` ("1".."13"). Never add or
remove keys. Entry: `{ articles, reviewed, note }`.

- `articles`: strings. `"28"` = own instrument's article; `"dora:28"` /
  `"its:2"` / `"rts:3"` = explicit instrument (cross-instrument is normal in
  its/rts blocks, rare in dora). Annexes are not mappable — map to the
  article that governs the annex.
- `[] + reviewed: true` = reviewed, none relevant; `reviewed: false` =
  drafted, awaiting human review. `note` = short Dutch aid (verplicht bij
  lege articles). Notes prefixed `REVIEW:` mark refuter doubts.

## Status (epic 9, juli 2026)

All 134 recitals are **drafted** (parallel drafters) and **adversarially
reviewed** (independent refuter agents, zero disagreements; one crossref
parser bug found and fixed — rct 34's "respectievelijk"-construction). All
entries still `reviewed: false`; `meta.complete: false`. The remaining work
is HUMAN review.

## Human review procedure (batch ~20)

1. Pick a contiguous range with `reviewed: false`.
2. Read the recital texts from `data/generated/<inst>/recitals.json` (never
   from memory) next to the drafted articles+note.
3. Norm: precision over recall; 1–4 articles typical; purely contextual
   recitals stay `[]`.
4. Edit `articles` where needed, drop the `REVIEW:` prefix after resolving,
   flip `reviewed: true`.
5. `npm run parse && npx tsx scripts/verify-recital-map.ts` — commit source +
   generated together (`curate recital map: dora 21-40 reviewed`).

## Finishing (all 134 reviewed)

1. Set `meta.complete: true` in the source.
2. Pin `EXPECTED` in `scripts/verify-recital-map.ts`: exact `pairCount` plus
   2–3 hand-checked `spot` mappings (composite keys, e.g. `"rts:2"`).
3. `npx tsx scripts/verify-recital-map.ts` must pass in the strict regime.
