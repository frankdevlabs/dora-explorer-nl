# Epic 1 — Sources & multi-instrument parser

**Status**: done (July 2026). Pinned: dora 64 art / 106 rct / 0 anx / 9 cpt /
14 fn; its 7 art / 15 rct / 4 anx; rts 7 art / 13 rct; 485 search docs;
0 cross-references (epic 2). Build exports 181 pages (DORA-only routes;
/its + /rts land in epic 3).
**Goal**: the three-instrument corpus (DORA + RoI-ITS + onderaannemings-RTS)
parsed deterministically from EUR-Lex HTML into
`data/generated/{dora,its,rts}/`, verified, and rendering on the existing
DORA routes.

## Source survey (step 0, decides the dialect plan)

| Instrument | Articles/annexes | Recitals | Dialect |
|---|---|---|---|
| dora | CELEX `02022R2554-20221227` (consolidated; the only consolidated version) | `32022R2554` (OJ) | consolidated + new-OJ |
| its | `02024R2956-20241202` (consolidated; header confirms the 19-9-2025 corrigendum is incorporated: "Gerectificeerd bij … PB L 90725, 19.9.2025") | `32024R2956` (OJ) | consolidated + new-OJ |
| rts | `32025R0532` (OJ only; no consolidated exists — the act is unamended) | same file | new-OJ |

Survey findings that changed the plan:
- **No old-OJ dialect needed.** The Dec-2022 DORA OJ already uses the new
  OJ format with `rct_N` ids — the feared old-format recital extractor
  (PORTING layer 1 risk) was unnecessary.
- **RTS final numbering is arts 1–7** (ids `art_1..art_7`, recitals 1–13,
  renumbered after the draft-art-5 deletion). Art 3 = due diligence, art 4 =
  conditions, art 5 = material changes, art 6 = termination. Questionnaire
  refs (epic 6) must use these numbers.
- **ITS annex I contains the full field-level RoI schema**: 1 overview table
  (all 15 template codes B_01.01–B_99.01), per-template instruction tables
  with column code / name / datatype / instruction / mandatory-flag, and the
  B_99.01 closed-list matrix (allowed values per column). Epic 7's
  `templates.json` can be machine-derived from the parsed annex with a thin
  curated overlay — far less hand-curation than planned.
- The **B_05.01 instruction table is nested** inside grid-list punt d) of
  its intro (`div.centered`), not a top-level annex child; verify asserts it
  separately.
- DORA **afdelingen have roman ids** (`cpt_II.sct_I`, unlike the AI Act's
  numeric `sct_1`) and **no section subtitles** → `Article.section` /
  `TocSection.roman` became strings; UI drops the em-dash when the title is
  empty.
- NL terminology: ITS art 2 says "**ranking**", not "rangorde".

## Design decisions

**Config-driven parser** (`scripts/parse-corpus.ts`): a `SOURCES` table maps
each instrument to its files + dialect; two dialect walkers (consolidated:
ported from parse-aiact.ts with table support added; new-OJ: recitals +
article walker for lid divs `#NNN.MMM` with borderless 2-col point tables).
Data tables (`table.borderOj`) become `{type:"table", rows}` ContentNodes —
the base type had table support but the AI Act parser never emitted it.

**Per-instrument output + merged search docs.** `SearchDoc` gained an
`instrument` field; ids are prefixed (`dora-art-28-lid-3`), urls carry the
route prefix. `parseReferenceQuery` accepts an optional instrument qualifier
("its artikel 2"); unqualified references pin DORA.

**No cross-references yet.** The parser emits zero refs; epic 2 rewrites the
grammar (self-forms per instrument + cross-instrument resolver) and adds the
annotation post-pass back.

**Search vocabulary swapped** (`search-expansion.ts` + golden queries in
`verify-search.ts`): DORA statutory vocabulary (informatieregister,
uitbesteding/onderaanneming, TLPT/penetratietests, ranking/toeleveringsketen,
…), 14 golden queries pinned from observed rankings.

## Files

New: `scripts/parse-corpus.ts`, `src/lib/instruments.ts`,
`docs/epics/epic-1-corpus.md`, `data/source/{dora,its,rts}_nl_*.html`,
`data/generated/{dora,its,rts}/*.json`.
Removed: `scripts/parse-aiact.ts`, `data/source/aiact_nl*.html`, old flat
`data/generated/*.json`, `/bijlage` + `/bijlagen` routes (DORA has no
annexes; ITS annexes render under `/its/bijlage/*` from epic 3).
Modified: `src/lib/{types,data,search-core,search-expansion}.ts`,
`scripts/{verify-data,verify-search}.ts`, section rendering in
`src/app/page.tsx`, `src/app/artikel/[nummer]/page.tsx`, `SidebarToc.tsx`.

## Verification

`npm run build` green: parse counts above, `verify-data` (counts, contiguous
numbering, FLAT lists per instrument, chapter/section distribution, spot
phrases anchoring art 3(22)/28(3)/30/26 + ITS ranking/scope + RTS due
diligence, the 15 template codes, S01–S19 taxonomy, search-doc pins),
`verify-search` (14 golden queries + synonym invariants). Curl smoke checks
on /artikel/28 (informatieregister), /artikel/3 (`#punt-22`), /artikel/26
(TLPT), /overweging/106.

## Risks / follow-ups

- ITS/RTS search hits navigate to `/its/...`, `/rts/...` which 404 until
  epic 3 (dev-only; the site is not deployed before epic 4).
- The placeholder questionnaire's refs point at AI-Act targets; hover
  previews silently resolve against the DORA corpus or drop. Replaced in
  epics 5–8.
- The B_99.01 closed-list matrix has ragged rows (merged cells in the
  source); epic 7 must parse it defensively when deriving closed lists.
