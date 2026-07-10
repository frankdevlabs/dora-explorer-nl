# Epic 8 — RoI-exports + leveranciersuitvraag

**Status**: done (July 2026). Export-fixtures in verify-roi green;
Playwright bevestigt een echte CSV-download met ITS-kolomcodes en datarij.
**Goal**: (a) één CSV per ITS-template met exacte kolomcodes, klaar voor het
xBRL-CSV-pakket (AFM) of het DNB-Excel-template; (b) de leveranciersuitvraag
("Deel B") per overeenkomst: de nog lege velden die alleen de aanbieder of
de keten kent, als markdown + CSV.

## Design decisions

**Pure exportmodule** (`src/lib/roi/export.ts`), fixtures in verify-roi:
- `templateRows/templateCsv`: header rij 1 = kolomcodes, rij 2 = NL-labels;
  per template de juiste bron (B_01.01 = entiteitsblok; B_01.02 afgeleid
  eigen-entiteitsrij; B_02.03 alleen intra-groep; B_05.02 = ketenrijen met
  contractref-join en LEI/EUID-soortcode; B_03.03/B_99.01/B_01.03
  header-only in v1; overige templates via `resolveTemplate` per
  arrangement). Individuele downloads + "Alle templates"-knop
  (dependency-vrij, geen zip).
- `supplierRequest{Items,Markdown,Csv}`: per overeenkomst alle
  `askSupplier`-kolommen die nog leeg zijn, met ITS-referenties en
  verplicht-status; de markdown bevat de juridische aanhef (art. 28, lid 3;
  ITS-taxonomie-eisen), de KOF-ketenpassage (B_05.02 + RTS art. 5
  wijzigingsmelding) en de actualiseringsafspraak (jaarlijks + event-driven)
  — de contractuele uitvraag uit het Ohpen-onderzoek, gegenereerd.

**Expliciete caveat** op de exportpaneel en in `/register/handleiding`: de
CSV's voeden de indiening maar zijn niet zelf het xBRL-CSV-pakket
(geen report.json/metadata) — pakketgeneratie is een expliciete stretch
goal.

## Files

New: `src/lib/roi/export.ts`, `src/app/register/handleiding/page.tsx`.
Modified: `src/components/roi/RegisterWorkbench.tsx` (ExportPanel +
uitvraagknoppen per record), `scripts/verify-roi.ts` (exportfixtures:
headerrijen, ketenrij rang 2, entiteits-CSV, uitvraag vraagt B_05.01.0110
maar niet gevulde velden, KOF-passage aanwezig).

## Verification

verify-roi exportfixtures + Playwright download-check (CSV begint met
`B_02.01.0010`, bevat de contractref-datarij; 15 exportknoppen).

## Risks / follow-ups

- xBRL-CSV-pakket en GLEIF-verificatie: bewust buiten v1.
- Groepsscenario's: B_01.02/B_01.03/B_02.03/B_03.03 vergen handwerk in de
  CSV; gedocumenteerd in de handleiding.
