# Epic 6 — Supplier/TPRM assessment (per ICT-overeenkomst)

**Status**: done (July 2026). supplier-v1.json: 11 modules / 48 vragen;
fixtures VB-A/B/C green; Playwright flow (aanmaken → ICT-gate → CIF →
art 30(3)-module → resultaat met RoI-preview) green.
**Goal**: `/assessment/leverancier` — per contractuele overeenkomst bepalen
of de dienst een kritieke of belangrijke functie ondersteunt en welke
verplichtingen gelden: basisset (alle ICT-contracten) vs KOF-extra's; de
antwoorden voeden het informatieregister.

## Design decisions

**De RoI-store bezit de data (D5).** Een leveranciersassessment staat niet
op zichzelf: het is de `answers`-record van een arrangement in
`src/lib/roi/store.ts` (localStorage `dora-roi`, v1). Epic 7 breidt dezelfde
blob uit met entity/provider/function/chain-records; de arrangement-records
en hun antwoorden blijven staan.

**RoI-mapping via `roi` op de vraag.** Vragen die een registerveld vullen
dragen de exacte ITS-kolomcode (`"roi": "B_05.01.0010"`); verify valideert
elke code tegen de geparste bijlage I (corrigendum-markers ►C1◄ gestript) en
eist dat de sleutelkolommen (B_02.01.0010, B_05.01.0010/0050, B_02.02.0060,
B_06.01.0050, B_07.01.0050) gemapt zijn. Het resultaatscherm toont welke
velden gevuld zijn ("RoI-preview"); volledige recordbewerking komt in epic 7.

**Obligation split.** `supplier-outcome.ts` deelt zichtbare obligations in:
CIF-extra = modules m8 (art 30(3)), m9 (RTS 2025/532), m11 (B_07.01) plus de
CIF-gated vragen s5.2/s6.3/s6.4/s10.2; al het overige is baseline (art
28(4)–(8) + art 30(2)). Master switch: `cif_dienst` (s5.1); gate:
`ict_dienst` (s2.1, art 3 punt 21) — "nee" verbergt m3–m11 en het resultaat
meldt dat het kader niet van toepassing is.

**Module map**: m1 identificatie overeenkomst+aanbieder (contractref,
LEI-hulp met AWS-EMEA-vs-Inc-waarschuwing uit de Ohpen-casus, S01–S19-keuze,
locatievelden gesplitst opslag/verwerking) · m2 ICT-dienstgate · m3
intra-groep · m4 functieclassificatie art 3(22) (B_06.01) · m5 KOF-switch +
art 28(3) 3e-alineameldplicht · m6 precontractueel art 28(4)-(5) + art 29 ·
m7 art 30(2) punt-voor-punt (a–i) · m8 art 30(3) punt-voor-punt (a–f) · m9
onderaanneming (RTS art 3/4/5/6 — definitieve nummering na schrapping
ontwerp-art-5; ketenregistratie met ranking, ITS art 2/3) · m10 beëindiging
art 28(7) + exit art 28(8) · m11 dienstbeoordeling B_07.01 (substitueer-
baarheid, herintegratie, impact, alternatieven).

## Files

New: `data/questionnaire/supplier-v1.json`,
`src/lib/assessment/supplier-outcome.ts`, `src/lib/roi/{types,store}.ts`,
`src/components/assessment/SupplierAssessment.tsx`,
`src/app/assessment/leverancier/{page,vragenlijst/page,resultaat/page}.tsx`.
Modified: `/register` is een stub die naar het leveranciersassessment en de
epic-7-werkbank verwijst; `scripts/verify-assessment.ts` dekt beide
vragenlijsten.

## Verification

Fixtures: VB-A (cloud + CIF + onderaanneming toegestaan: ≥10 baseline én
≥10 CIF-verplichtingen, RTS-vragen zichtbaar, open actie s8.4, RTS-datum in
tijdlijn), VB-B (geen KOF: m8/m9/m11 verborgen, alleen baseline), VB-C (geen
ICT-dienst: alles na m2 verborgen, nul verplichtingen). RoI-kolomcodes
gevalideerd tegen de geparste ITS-bijlage I. Playwright-flow zie boven.

## Risks

- De B_99.01-gesloten lijsten (toegestane waarden per kolom) zijn nog niet
  afgedwongen op de choice-opties; epic 7 leidt ze af uit de geparste matrix
  en verifieert de optiewaarden.
- Ketenleden (B_05.02-rijen) worden nog niet als records vastgelegd —
  epic 7 (chain editor).
