---
name: add-instrument
description: Add or update a legal instrument (level-2 act, corrigendum/consolidation swap, amendment) in the multi-instrument corpus - source acquisition, registry/parser wiring, the audit-then-pin protocol, editorial layers (l2-map, recital-map seed), golden query, MCP and deploy. Use when a new DORA level-2 act is published, an existing act gets a corrigendum or consolidated version, or DORA itself is amended.
---

# Add or update an instrument

**Expectations in this skill are living.** Counts and file lists change with
every act added. Update them in the same commit as the act; a mismatch
usually means this skill is stale — check `git log` before debugging.

> **Epic-10 state:** 13 instruments (DORA + all 12 published level-2 acts;
> complete — no open DORA level-2 mandates as of July 2026). Pins: 1031
> search docs, 563 refs, l2-map 26 links, 32 golden queries, 532 exported
> pages. Method + numbers: `docs/epics/epic-10-level2-corpus.md`.

One instrument = one pass through this pipeline. Every step ends with the
repo verify-green; commit source + generated + parser together (AGENTS.md
rule 4). If the parser can't handle the act's markup, switch to the
`extend-parser` skill first, then resume here.

## 1. Source acquisition

Decision tree, per act:

1. Fetch the EUR-Lex ALL page:
   `python3 ~/law-tracker/lib/fetch_blocked_doc.py "https://eur-lex.europa.eu/legal-content/NL/ALL/?uri=CELEX:<celex>" <scratch>/all.html`
   and `grep -o '02[0-9]*R[0-9]*-[0-9]*'` for consolidated versions,
   `grep -o 'R([0-9][0-9])'` for corrigenda.
2. **No consolidation** → OJ-only: fetch
   `…/legal-content/NL/TXT/HTML/?uri=CELEX:3YYYYR NNNN` →
   `data/source/<id>_nl_oj.html`, one file for articles+annexes+recitals.
3. **Consolidation exists** → fetch it for articles/annexes
   (`<id>_nl_consolidated.html`, dialect `"consolidated"`) AND the OJ file
   for recitals (consolidated versions omit the preamble).
4. Corrigenda traps (the 2024/1774 case):
   - Corrigenda can be language-specific — check whether the NL text
     actually contains the error before assuming the fix applies.
   - A corrigendum does NOT create a new consolidation date (it corrects
     ab initio): the consolidated CELEX keeps the entry-into-force date.
5. Sanity-check every fetch: a suspiciously small file (~80K for a large
   act) is usually an error page — `grep '<title>'` for
   "does not exist" before parsing.
6. Record the CELEX ids in the README source table.

## 2. Wiring (all mechanical, TS enforces completeness)

- `scripts/parse-corpus.ts` → `SOURCES` entry (dialect per §1).
- `src/lib/instruments.ts` → extend the `InstrumentId` union, add the
  registry row (all six `InstrumentSpec` fields), append to
  `INSTRUMENT_IDS`. Conventions: `id` = short topic id (`tlpt`, not
  `rts-tlpt`); `label` = short UI badge ("TLPT-RTS"); `title` = the full
  NL subject string from the act's EUR-Lex title; `citation` EXACTLY as
  the act is cited in legal text ("Gedelegeerde Verordening (EU)
  2025/1190") — it feeds `CITATION_FORMS`, making the act linkable
  corpus-wide, including from the other satellites; `celex` = the parsed
  source's CELEX (consolidated id where used); `routePrefix` = topic slug
  with `rts-`/`its-` type prefix (plain delegated acts get a bare topic
  slug, cf. `/criticaliteitscriteria`).
- `src/lib/data.ts` → 4 JSON imports + `CORPORA` entry.
- `src/components/pages/InstrumentIndex.tsx` → `BLURB` entry (NL, what the
  act does + DORA basis + audience).
- `src/app/page.tsx` → `TAGLINE` entry + place the id in the right
  `SATELLITE_GROUPS` theme. Routes, sidebar, search qualifier and MCP need
  NO changes — all registry-driven.

## 3. Parse, audit, then pin — never pin what you haven't looked at

1. `npx tsx scripts/parse-corpus.ts` — note the new act's line
   (art/rct/anx/refs/docs).
2. Eyeball `data/generated/<id>/*.json`: article count and titles against
   the OJ text, leden structure, list markers, table shapes.
3. **Ref audit.** Dump every ref with its surrounding text and target:
   - `< ~40 refs`: dump ALL, read each one.
   - larger corpora: group by target root (own /artikel, /artikel (=DORA),
     other satellites) + a seeded random sample of ~15 read in full.
   - Any doubtful ref → back to the source sentence (strip tags with a
     python one-liner) and decide: correct / grammar gap (→ extend-parser)
     / genuinely unlinkable.
   - Expect and verify the good signs: explicit "van Verordening (EU)
     2022/2554" retargets to DORA, bare refs stay internal, ranges link
     endpoints only, cross-satellite citations resolve once registered.
4. Only now pin in `scripts/verify-data.ts`: `EXPECT` (articles, recitals,
   annexes, chapters, FLAT list computed from the JSON), `REF_EXPECT` +
   total, one hand-verified spot phrase, search-doc total. Every pin gets a
   history comment saying what was audited (rule 3). Never loosen an
   assertion to pass.
5. Annex-bearing acts: pin per-annex table row counts and one content probe
   (see the formulieren block in verify-data.ts as the model).

## 4. Editorial layers

- `data/source/l2-map.json`: ≥1 index-level link from the empowering DORA
  article+lid. Verify the grondslag against the act's own preamble
  ("… en met name artikel N, lid M …") — never against a secondary source
  or memory. Re-pin `verify-l2-map.ts` (linkCount + a byDora spot check).
- `data/source/recital-article-map.json`: seed the instrument block with
  `{"articles": [], "reviewed": false}` per recital (verify-recital-map
  demands the exact keyset; an optional `note` string is allowed). Then
  run the `curate-recital-map` skill (drafter → adversarial refuter →
  human review) — after that pass the entries hold drafted articles +
  notes, still `reviewed: false` until the human flips them.

## 5. Finish

1. `scripts/verify-search.ts`: one reference golden query (`"<id> artikel
   N"`) + one domain query landing in the new corpus; topN ids must be
   exact doc ids, not prefixes.
2. `npm run build` green; check the exported pages exist under `out/`.
3. `mcp/ && npm run build`, `systemctl --user restart dora-mcp`, curl
   `/healthz` (allow a few seconds — it loads the search index on boot).
4. Run the `verify-app` skill including the Playwright e2e — and expect it
   to find something real (epic 10: annex footnotes overflowed at 360px).
5. `./scripts/deploy-site.sh`; spot-check the live routes and the l2 panel
   on the empowering DORA article.
6. Update: this skill's banner, `verify-app` expectations, AGENTS.md corpus
   table, README source table. One commit, source+generated together.
