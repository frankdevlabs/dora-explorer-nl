# Epic 10 — het volledige level-2-corpus (status: done, juli 2026)

Doel: alle twaalf in het PB gepubliceerde DORA level-2-handelingen als
instrumenten in de explorer, onderling en met DORA gekruisverwezen. Per
juli 2026 zijn alle level-2-mandaten van DORA afgeleverd; er staat niets
meer open (gecontroleerd tegen de EC-pagina implementing/delegated acts en
de ESA-trackers, 12-7-2026).

## Wat is gebouwd

1. **Routehernoeming** — `/its` → `/its-register`, `/rts` →
   `/rts-onderaanneming`; generieke prefixen schalen niet naar 12
   satellieten. nginx 301's voor de oude paden. Route-resolutie overal
   registry-gedreven via `splitRoutePath()` in `src/lib/instruments.ts`.
2. **Generalisatie** — de 7 per-instrument routeshells vervangen door één
   dynamisch `src/app/[instrument]/`-segment (`generateStaticParams` uit de
   registry, `dynamicParams=false`); zoek-qualifier, UI-badges, l2-map en
   alle MCP-tooldescripties/-enums afgeleid van `INSTRUMENT_IDS`;
   `get_annex` kreeg een instrument-parameter.
3. **Tien nieuwe instrumenten** (ids): `criticaliteit` (2024/1502),
   `vergoedingen` (2024/1505), `onderzoeksteams` (2025/420),
   `classificatie` (2024/1772), `contractbeleid` (2024/1773), `rapportage`
   (2025/301), `risicobeheer` (2024/1774, geconsolideerd incl. beide
   rectificaties), `oversight` (2025/295), `tlpt` (2025/1190),
   `formulieren` (2025/302). Bronnen en CELEX-ids: README.
4. **OJ-dialect uitgebreid** — bijlageparser (`parseOjAnnexes`: `div#anx_*`,
   `oj-doc-ti`-titels, `oj-ti-grseq`-koppen, `p.oj-note` → footnotes-veld)
   en echte datatabellen (alleen single-row 2-koloms marker-tabellen blijven
   puntlijsten; al het andere wordt een table-node met uitsluitend directe
   rijen — geneste layout-minitabellen tellen als celtekst). Gevalideerd
   tegen `its_nl_oj.html` als fixture: OJ-parse == geconsolideerde parse
   voor alle vier ITS-bijlagen. Herstelde daarbij eerder stilletjes
   gedropte content (criticaliteit-formuletabellen, enumeratie-spans).
5. **Crossref-grammatica** — drie nieuwe constructies uit de nieuwe
   corpora: komma-geketende artikelreeksen distribueren de slotkwalificatie
   ("artikel 35, lid 6, artikel 37, lid 1, … van Verordening (EU)
   2022/2554"), het lid-variant "lid 2, en (3)," en het bereik-variant
   "punten a), b) en met c)". Kale hoofdstuk-refs naar hoofdstukloze
   corpora worden gedropt (2024/1774 nest hoofdstukken in titels; het
   toc-model kan dat niet representeren — corpus bewust plat).
6. **Editorial** — l2-map 15→26 links (≥1 indexlink per handeling vanaf de
   machtigingsbepaling; grondslagen geverifieerd tegen de "en met name"-
   aanhaling in elke preambule); recital-map geseed met lege ongereviewde
   entries per satelliet (review blijft open, `meta.complete=false`).
7. **UI** — homepage: gegroepeerde level-2-index (FE-facing per thema +
   aparte oversightgroep, taglines per handeling); sidebar: inklapbare
   groep "Uitvoeringshandelingen (12)". verify-search 14→26 golden queries.

## Kerncijfers (gepind in de verify-scripts)

| | epic 9 | epic 10 |
|---|---|---|
| instrumenten | 3 | 13 |
| zoekdocs | 485 | 1031 |
| refs | 212 | 563 |
| l2-links | 15 | 26 |
| HTML-pagina's | 235 | 532 |

## Audit-protocol per handeling

fetch → `SOURCES`-entry → generated JSON eyeballen → refs volledig dumpen
(kleine corpora) of target-root-samenvatting + steekproef (grote corpora)
→ pins in verify-data (EXPECT/FLAT/REF_EXPECT/spot-frase) → l2-map-link +
re-pin → `npm run parse && npm run verify` groen → commit bron + generated
+ parser samen.

## Bewuste keuzes / bekende beperkingen

- 2024/1774 en 2025/1190 tonen een platte artikellijst (titel-geneste
  hoofdstukken); acceptabel v1, evt. later titelbesef in het toc-model.
- Assessments en RoI-werkbank zijn ongewijzigd (bewuste scopekeuze):
  nieuwe handelingen renderen/zoeken/linken, maar voeden de vragenlijsten
  niet. Kandidaat-vervolg: rapportagetermijnen (2025/301) en
  TLPT-verplichting (2025/1190) in het entiteitsassessment.
- Recital-map-review voor de satellieten staat open (curate-recital-map
  skill).
