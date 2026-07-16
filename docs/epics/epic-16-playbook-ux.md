# Epic 16 — Playbook UX-verfijning (status: done, juli 2026)

Doel: de nu bevroren playbook-data (epic 15: `meta.complete:true`, 654/654
gereviewd) bruikbaar maken op de lange stap-lijsten. Motivatie: entity-f3
(ICT-risicobeheerkader) telt 48 stappen op één lijst, aanbieder-f5 6 — de
lezer kon niet naar het eigen regime filteren, noch voortgang bijhouden.
Geen data-wijziging: puur een client-UX-laag op de bestaande generated data,
dus `verify-playbook`-pins (`coverageEntries:654`, `begrippen:65`) blijven
ongewijzigd groen. Vervolg op epic 15.

## Scope

Afgesproken deze epic: **regimefilter + voortgangs-checkboxes + nav-links**.
Uitgesteld naar een vervolg-epic: **playbook step search-indexering**
(`type:"stap"` SearchDocs, re-pin `1031→N`).

## Wat is gebouwd

1. **Progress/regime store** (`src/lib/playbook/store.ts`, nieuw). Eén
   versioned localStorage-blob `dora-playbook-v1` met de al bestaande vorm
   `PlaybookProgressState { v:1, done:{stepId→ts}, regime? }`. Zelfde patroon
   als `src/lib/roi/store.ts`: module-singleton + `dora:playbook`-event +
   cross-tab `storage`-listener + quota-veilige writes, geconsumeerd via
   `useSyncExternalStore`. Acties `toggleStep`/`setRegime`/`resetKind`; hooks
   `useDone`/`useRegime`/`useStepDone`. Step-id-keyed is veilig omdat
   `RETIRED_STEP_IDS` (verify-playbook) hergebruik van ids verbiedt.

2. **Fase-stap-eiland** (`src/components/playbook/PlaybookSteps.tsx`, nieuw,
   `"use client"`). De fase-pagina blijft server-component voor de zware
   legal-rendering (`RefRow`/`RefLink` + previews); alleen de stap-`<ol>` is
   naar dit eiland verhuisd — stap-JSX ongewijzigd (regel 2b: nooit de
   rendering van wetstekst aanpassen). Het eiland krijgt geserialiseerde
   props (`steps`, `previews`, `depHrefs`-map) zodat het geen step-index of
   corpus hoeft te bundelen.
   - **Regimefilter**: opt-in. Standaard alle stappen; knoppen per playbook
     (entiteit → volledig/vereenvoudigd, aanbieder → aanbieder/ctpp) + Alles.
     Een gekozen regime verbergt stappen zonder dat regime in `appliesTo`;
     een regime dat bij het andere playbook hoort filtert deze pagina niet.
     Keuze persisteert (globaal in de blob).
   - **Voortgangs-checkboxes**: per stap een checkbox → `toggleStep`; voltooide
     stap krijgt subtiele done-stijl (line-through titel). Samenvatting
     "`n van m stappen (regime X) · k van m voltooid`" telt over de zichtbare
     (gefilterde) stappen.

3. **Kind-index voortgang** (`src/components/playbook/PlaybookProgress.tsx`,
   nieuw). Vervangt de server-`<ol>` fase-lijst op `/playbook/[kind]` door een
   eiland dat per fase `k/n voltooid` en een kind-totaal toont, plus
   "Voortgang wissen" (`resetKind`). Fase-links ongewijzigd.

4. **Nav-links**. `Playbook` toegevoegd aan de tools-nav in
   `Header.tsx` (naast Assessment/Informatieregister). `PrevNextNav`
   (hergebruikt) onderaan elke fase-pagina, linkt aangrenzende fases binnen
   hetzelfde playbook — antwoord op "te lange enkele lijst".

## Verificatie

`npm run build` groen (parse → verify → next build; alle 15 playbook-pagina's
statisch geprerenderd, pins ongewijzigd). `npx tsc --noEmit` schoon. 16
Playwright-checks op :3107: f3 rendert 48 stappen → vereenvoudigd narrow't naar
9 en persisteert over reload (localStorage `regime:"vereenvoudigd"`); 3
checkboxes tellen en persisteren; aanbieder-f5 biedt aanbieder/ctpp (niet de
entity-paar); kind-index toont per-fase counts + reset wist; header-link en
prev/next aanwezig.

## Nagekomen (juli 2026) — playbook step search-indexering

Het uitgestelde item is alsnog gebouwd. `scripts/build-playbook.ts` emitteert nu
één `type:"stap"` SearchDoc per stap (`id:"stap-<stepId>"`, `instrument` = de
playbook-kind, `url:/playbook/<kind>/<faseId>#<stepId>`, `heading`=titel,
`text`=fasetitel + doel + acties), leest de door `parse-corpus.ts` net
geschreven `data/generated/search-docs.json`, appendt en herkopieert naar
`public/`. `SearchDoc.type` (`src/lib/types.ts`) kreeg `| "stap"`; `SearchResults`
en `SearchPalette` kennen het type (label "Stap" / groep "Playbook-stappen",
`ListChecks`-icoon, playbook-badge). Corpus deelt met MCP `search_dora` — stappen
zijn daar ook vindbaar (geen filtering). `verify-data` re-pin **1031→1159**
(+128 stap-docs = 108 entiteit + 20 aanbieder) met carve-out voor de
`/playbook/…`-url; `verify-search` +2 golden queries (pe.rb20, pa.oa2) en één
bestaande pin (`ranking toeleveringsketen`) bewust versoepeld naar `topN` omdat
stap-pe.ir1 nu meerangt. `verify-playbook`-pins (654/654) ongewijzigd.

## Redesign (juli 2026, Claude Design)

Visuele + interactie-vernieuwing van de vier playbook-schermen op de bevroren
data, geïmporteerd uit het Claude Design-project "Playbook design improvement"
(`Playbook Redesign.dc.html`). Prototype hardcodeerde light-mode hex + Geist;
poort vertaalt dat naar de app-tokens (`--accent` etc.) zodat dark mode blijft
werken. Nieuw gedeeld **`src/lib/playbook/ui.ts`** — `PRIO_ORDER` + label/klasse-
map voor het prioriteitspalet (fundament→accent, kern→teal, verdieping→muted/
slate), plus `PRIO_FALLBACK`/`prioStyle()`.

- **Scherm 1 `/playbook`** — nieuw client-eiland `PlaybookIndexCards.tsx`:
  icoon-tegels (FE/3P), instrument-tags, live voortgangsbalk + pct per playbook
  (`useDone`), en de dekkings-kaart. `page.tsx` levert plain props (kind, mono,
  tag, titel, beschrijving, faseCount, stapCount, stepIds + dekking covered/
  universe/complete) en zet eyebrow + h1.
- **Scherm 2 `PlaybookProgress.tsx`** — kop-pct + "x/y voltooid", nummertegels
  (gevuld accent bij 100%), per-fase inline balk, `uitgewerkt`/`referentie`-
  badge (0 stappen = referentie, bv. f1 begrippenkader). Reset-knop behouden.
- **Scherm 3 `PlaybookSteps.tsx`** — regimefilter behouden; nieuw:
  samenvattingskaart (pct + segmentbalk per prioriteitsgroep + legenda +
  alles-uit/inklappen), prioriteitsgroepering (`PRIO_ORDER` + overig-bucket),
  inklapbare stapkaarten (lokale `useState`, default dicht: checkbox + titel +
  meta `id · rollen · N refs` + prioriteitschip + chevron; open toont doel/
  acties/bewijs/`RefRow`/Vereist-eerst). **Hash-open** (`useEffect` +
  `hashchange`): deeplinks/SearchDocs/Cmd-K naar `#<stepId>` klappen de kaart
  open en scrollen — cruciaal nu kaarten default dicht zijn.
- **Scherm 4 dekking** — `dekking/[instrument]/page.tsx` kreeg een instrument-
  pillselector (alle `INSTRUMENT_IDS` als `<Link>`, actieve gemarkeerd,
  covered/universe) + dekkingssamenvatting-balk (stap vs definitie/context vs
  open, server-side getald) + gecardde tabel; **routes behouden** (deeplinks,
  SearchDocs, MCP). `dekking/page.tsx` (index) meegestyled.

UI-only: geen data/parser/generated/store-wijziging; `verify-playbook` 654/654
en alle count-pins ongewijzigd, `npm run build` groen. Gedeployd via
`scripts/deploy-site.sh` naar https://dora.mrfrank.dev.

## Openstaand

- **Menselijke review van de recital-map** (`complete=false`) — 284 entries
  gedraft + adversarieel gereviewd, maar nog `reviewed:false`. (Buiten epic 16;
  epic-9 editorial.)
