# Epic 9 — Editorial maps: recital↔artikel + DORA↔ITS/RTS

**Status**: done (July 2026). recital-map: 172 pairs over 108 van de 134
recitals / 61 artikelen, alle entries gedraft door 7 parallelle drafters en
adversarieel gereviewd door 4 onafhankelijke refuters (nul disagreements);
`reviewed: false` / `meta.complete: false` — menselijke review loopt via de
`curate-recital-map`-skill, daarna EXPECTED pinnen. l2-map: 15 links (art
28→ITS, art 29/30→RTS) in strict regime gepind. Bonus: de refuter-pass ving
een echte crossref-parserbug (zie hieronder) → ref-pins 214→212.
**Goal**: de twee gecureerde lagen uit het plan — welke overwegingen elk
artikel motiveren (alle drie instrumenten, cross-instrument toegestaan) en
welke ITS/RTS-bepalingen elk DORA-artikel uitvoeren — met panelen op de
artikel- en overwegingspagina's en MCP-verrijking.

## Design decisions

**Multi-instrument source met composite keys.** Nieuw t.o.v. het
aiact-mechanisme: `recital-article-map.json` heeft per-instrument blokken
(dora 1–106, its 1–15, rts 1–13; keys pre-created, nooit muteren);
artikelwaarden zijn `"28"` (eigen instrument) of `"dora:28"` (expliciet).
Het gegenereerde bestand gebruikt overal `inst:nummer`-keys; byRecital in
documentvolgorde (dora→its→rts), byArticle idem. Geen omnibus/SUFFIX_RANK
(geen amendment-laag).

**Two-regime verify** (`verify-recital-map.ts`): structureel altijd
(keysets exact tegen het corpus, refs resolven, generated == onafhankelijke
herafleiding, inverse-consistentie); bij `meta.complete: true` verplicht
gepinde `EXPECTED { pairCount, spot }` + reviewedCount == 134.

**l2-map strict vanaf dag één** (`verify-l2-map.ts`): klein handgecureerd
bestand (15 links), dus meteen exacte pins + spot-checks (art 28→its-index,
art 30→rts-index, rts:3-grondslag = art 29). Targets: `its:N`/`rts:N`
(artikel), `its:bijlage:iii`, of kaal `its`/`rts` (indexpagina); build
valideert tegen het corpus en bouwt voor- én inverse index.

**UI**: `RelatedRecitals` (Radix Collapsible, default dicht, instrument-
badge bij cross-instrument) + `L2Panel` op DORA-artikelpagina's;
"Grondslag in DORA"-blok onder de header van ITS/RTS-artikelpagina's;
"Relevante artikelen"-chips op alle overwegingspagina's. MCP: get_article
en get_recital appen den relevante overwegingen/artikelen + uitvoerings-
bepalingen/grondslag met deep links.

**Curatie (drafter/refuter-patroon).** 7 drafters (batches: dora ×5, its,
rts; recitaltekst uit recitals.json, toc-ankers, strikte JSON-out) →
centrale merge → 4 refuters (andere agents, stance refute, alleen
disagreements): nul inhoudelijke disagreements; alle 134 entries gedraft
met NL-notes. its/rts-blokken bevatten verwachte cross-instrument-mappings
(bv. rts:2 → dora:28; its:9 → dora:31).

**Parserbug gevonden door de refuter-pass** (het PORTING-layer-7-neveneffect
"editorial curation doubles as parser QA", tweede keer raak): rct 34 had
een geannoteerde ref naar `/artikel/6` waar "artikel 6, lid 1, punt c)
respectievelijk punt e), van die verordening" de AVG bedoelt — de grammatica
kende "respectievelijk" niet, dus de exclusion-lookahead zag de kwalificatie
nooit; idem art 44 ("van respectievelijk Verordeningen (EU) nr. 1093/2010").
Fix in `crossrefs.ts`: eatSubRefs consumeert "respectievelijk punt X)" en
OTHER_INSTRUMENT staat "van respectievelijk …" toe. Re-pin dora 178→176
(totaal 212) met history-comment in verify-data.ts.

## Files

New: `data/source/{recital-article-map,l2-map}.json`,
`scripts/{build-recital-map,verify-recital-map,build-l2-map,verify-l2-map}.ts`,
`data/generated/{recital-map,l2-map}.json`,
`src/components/content/RelatedRecitals.tsx` (incl. L2Panel),
`.claude/skills/curate-recital-map/SKILL.md`.
Modified: `src/lib/types.ts` (map-types), `src/lib/data.ts` (accessors
getRecitalsForArticle/getArticlesForRecital/getL2ForArticle/getDoraBasis),
artikel-/overwegingspagina's (dora + Instrument*), `mcp/src/{data,server}.ts`,
`src/lib/crossrefs.ts` (respectievelijk-fix), `scripts/verify-data.ts`
(re-pin), `package.json` (parse/verify-chains).

## Verification

verify-recital-map + verify-l2-map in de verify-chain; volledige build
groen; steekproeven: rts:2 → dora:28 aanwezig, its:9 → dora:31; Playwright:
paneel op /artikel/28 opent en linkt naar een overweging, /rts/artikel/3
toont grondslagblok, overwegingspagina toont chips met cross-badge; MCP
get_article 28 bevat "Relevante overwegingen" + "Uitvoeringsbepalingen".

## Risks / follow-ups

- Mappings zijn gedraft+gerefuteerd maar nog niet menselijk gereviewd; de
  skill beschrijft de reviewbatches en het finishing-protocol (complete +
  pins). Tot die tijd blijft het structurele regime van kracht.
- REVIEW:-note op dora rct 34 is na de parserfix opgelost — bij de
  menselijke review de note opschonen.
