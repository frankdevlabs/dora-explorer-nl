# Epic 15 — Playbook-review + lock-in (status: done, juli 2026)

Doel: de dekkingsmatrix afsluiten. Alle 654 dekkingsentries (epics 11–14
gedraft + adversarieel gerefuteerd, maar `reviewed:false`) menselijk
reviewen, `meta.complete` naar `true`, de count-pin zetten, en de twee
bron-eigenaardigheden uit epic 14 corrigendum-checken. Vervolg op epic 14
(654/654 dekking, lax regime); voorwaarde voor epic 16 (UX op bevroren data).

## Wat is gebouwd

1. **Alle 654 entries `reviewed:true`** via een volledige adversariële
   re-sweep. Methode: 13 parallelle file-grounded verifiers (één per
   instrument; dora in drie artikelbereiken 1–15/16–33/34–64), elk toetst
   dispositie/note/steps van elke entry aan de brontekst
   (`data/generated/<inst>/{articles,annexes}.json`) + een compacte
   step-catalogus, en levert een strict-JSON disputenlijst. Centrale
   arbitrage tegen de bron, daarna bulk-flip. Dekking blijft 654/654;
   dispositie-histogram ongewijzigd (stap 403, autoriteit 170, ctpp 37,
   slotbepaling 19, context 12, toepassingsgebied 10, definitie 3).

2. **`meta.complete: true` + count-pin.** `verify-playbook.ts` draait nu in
   het strikte regime: keyset == corpus exact (`covered===universe` per
   instrument) + `EXPECTED.coverageEntries: 654` (637 leden + 17 bijlagen),
   `begrippen: 65`. `npm run build` groen.

## Refuter-oogst (8 disputen, alle laag/midden-vertrouwen, gearbitreerd)

Vier toegepast (goed gegrond, laag risico):
- **formulieren art 7 lid-2** (note): "GVM-kaderverordening" → "GTM-
  kaderverordening" — Verordening (EU) nr. 468/2014 (ECB) is de GTM-
  kaderverordening (Gemeenschappelijk Toezichtsmechanisme); "GVM" bestaat niet.
- **criticaliteit art 1 lid-1** (steps): `pa.p1` toegevoegd. Het
  overzichtsartikel noemt de stap-1-subcriteria maar miste de stap-1-step
  (pa.p1, refs criticaliteit art 2#lid-1); art 2 lid-1 zelf citeert pa.p1 wel.
- **vergoedingen art 4 lid-3** (steps): `pa.ov1` toegevoegd. pa.ov1 lijst
  `/oversightvergoedingen/artikel/4#lid-3` expliciet in zijn refs — de
  step→lid-link bestond, de lid→step-link ontbrak (eenzijdig register).
- **dora art 19 lid-2** (note): note toegevoegd die het vrijwillige karakter
  markeert ("kunnen ... op vrijwillige basis melden"), zodat de stap niet als
  imperatief leest (conventie-consistent met art 45).

Vier gewogen en bewust behouden:
- **tlpt art 14 lid-1** en **15 lid-4** — proces-/gelijkstellingslid dat door
  pe.t7 resp. pe.tl8 wordt geoperationaliseerd; reclassificeren zou een
  coherente step-groep fragmenteren. `stap` blijft.
- **dora art 1 lid-1** — onderwerpbepaling; `toepassingsgebied` (pijlers als
  leeswijzer) verdedigbaar naast de consistentie-suggestie `context`.
- **risicobeheer art 1 inhoud** — pe.r20 is `volledig`-only terwijl de
  evenredigheid ook titel III raakt; een aparte vereenvoudigd-step toevoegen
  valt buiten de review-scope (nieuwe step) en de note dekt titel III al.

De hoog-risico zones (autoriteit-vs-ctpp in het oversight-cluster en
DORA art 31–44, de dwangsom-cluster art 35(6)–(11), onderzoeksteams als
zuiver autoriteit) hielden allemaal stand — geen dispositie-verwarring.

## Corrigendum-check (de twee bron-eigenaardigheden uit epic 14)

Geen officieel corrigendum op EUR-Lex voor beide handelingen (records
CELEX 32025R0295 en 32025R0420 opgehaald via de blocked-doc fetcher; geen
"corrigendum"/"rectificatie"/`R(0x)`-relaties). Beide blijven dus
onbewerkte brontekst (regel 2 — nooit wetstekst met de hand aanpassen):
- **oversight (GV 2025/295) art 3(1)**: verwijst naar "Verordening (EU)
  2022/2254" (moet 2554 zijn).
- **onderzoeksteams (GV 2025/420) art 5(1)**: "zorgvuldigheid en
  zorgvuldigheid"-duplicatie.

## Bijvangst

- Nieuwe skill `.claude/skills/curate-playbook/` — review-batch + finishing
  (complete + pins), spiegelt `curate-recital-map`.

## Openstaand

- Epic 16: UX-verfijning op de nu bevroren data — regimefilter
  (volledig/vereenvoudigd/aanbieder/ctpp) + voortgangs-checkboxes
  (localStorage, step-id-keyed; daarom bestaat `RETIRED_STEP_IDS`).
  f3-entity is ~48 steps op één lijst; aanbieder f5 nu 6 steps.
