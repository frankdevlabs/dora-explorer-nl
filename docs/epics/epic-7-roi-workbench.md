# Epic 7 — Register-of-Information werkbank

**Status**: done (July 2026). roi-schema.json: 15 templates / 98 kolommen /
6 gesloten lijsten / 19 S-codes, deterministisch afgeleid; verify-roi green
(schema-pins + validatie- en mapping-fixtures); Playwright-flow (entiteits-
LEI → assessment → record → prefill → override → ketenrij) green.
**Goal**: `/register` als werkbank: entiteitsblok (B_01.01), één record per
contractuele overeenkomst met alle ITS-velden per template,
herkomst-labels, inline validatie, ketenbewerking (B_05.02) en
volledigheidstellers op de verplichte velden.

## Design decisions

**templates.json is afgeleid, niet gecureerd.** De epic-1-vondst (bijlage I
bevat het volledige veldschema) maakte de geplande handcuratie overbodig:
`scripts/build-roi-schema.ts` leest de geparste bijlage-I-tabellen (template-
overzicht, per-template instructietabellen incl. de in punt d) geneste
B_05.01-tabel, de B_99.01-matrix met ragged rows) en bijlage III (S-codes)
en schrijft `data/generated/roi-schema.json`. Corrigendum-markers (►C1◄)
worden gestript; de matrix citeert één pre-corrigendumcode
(B_06.01.0110 → remap naar B_06.01.0100). Enige redactionele laag: de
provenance-overlay in de builder (assessment:<qid> uit de roi-velden van
supplier-v1.json; `auto` voor afleidbare joins; `supplier` voor de
Deel-B-velden; rest `manual`).

**Mapping wordt live opgelost, nooit gekopieerd** (`roi/mapping.ts`):
manual override → assessment-antwoord (choice-waarden → officiële
B_99.01-lijsttekst; S-codes blijven codes) → auto (contractref-joins, eigen
LEI, F-code) → leeg. Overrides staan apart op het record
(`arrangement.manual`) en tonen "wijkt af van assessment".

**Validatie** (`roi/validate.ts`, puur, gedeeld UI/verify): LEI ISO 17442
mod-97-checksum, ISO 3166-1 alpha-2 (incl. EL/UK-conventies), datum,
monetair, gesloten lijsten; verplichte-veld-telling per template — het
volledigheidsdashboard is het hoofdproduct (ESA-dry-run: 86% fouten =
ontbrekende verplichte velden).

**Store**: één `dora-roi`-blob (v1) met entity-blok + arrangements
(answers + manual + chain). Enkelvoudige-entiteit-aanname: groepsmodellen
worden afgeleid of leeg geëxporteerd (gedocumenteerd in de handleiding).

## Files

New: `scripts/{build-roi-schema,verify-roi}.ts`,
`data/generated/roi-schema.json`, `src/lib/roi/{schema,validate,mapping}.ts`,
`src/components/roi/RegisterWorkbench.tsx`,
`src/app/register/overeenkomst/page.tsx`.
Modified: `src/lib/roi/{types,store}.ts` (manual/chain/entity),
`src/app/register/page.tsx`, `package.json` (parse bouwt het schema mee;
verify draait verify-roi), supplier-v1.json m11/s1.4-opties gelijkgetrokken
met de officiële gesloten lijsten (numerieke waarden).

## Verification

verify-roi: pins (15/98/6/19), gesloten lijsten resolven, assessment-bronnen
wijzen terug naar de roi-mapping, LEI/land/lijst-fixtures, mapping-fixtures
(joins, officiële lijsttekst, override wint + gemarkeerd). Playwright-flow
zie boven.

## Risks

- Kolomtelling (98) drift bij een nieuwe ITS-versie — bewust: de pin dwingt
  een diff-audit af.
- Conditionele verplichtvelden ("Verplicht indien …") tellen niet mee in de
  verplichte-veldteller; alleen onvoorwaardelijk verplichte velden.
