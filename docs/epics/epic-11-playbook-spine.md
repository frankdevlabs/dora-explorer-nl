# Epic 11 — playbook-spine + criticaliteit-pilot (status: done, juli 2026)

Doel: het fundament voor de DORA-compliance-playbooks — praktische stappen
met wettelijke basis voor twee doelgroepen (financiële entiteit; derde
aanbieder incl. CTPP), plus een per-lid dekkingsregister dat mechanisch
garandeert dat geen artikel/lid/bijlage van de 13 instrumenten wordt
overgeslagen (universum: 654 = 637 leden + 17 bijlagen). Eén pilot
(criticaliteit, GV 2024/1502) end-to-end door de hele pijplijn. Plan:
epics 11–16; content-epics 12–14, pinning 15, polish/search 16.

## Wat is gebouwd

1. **Corpus-index-extractie** (behavior-neutraal, eigen commit) —
   `CorpusIndex`/`collectAnchors`/`checkRef` uit `verify-assessment.ts`
   naar `scripts/lib/corpus-index.ts`; assert-messages ongewijzigd.
2. **Editorial layer #4 (rule 2b)** — `data/playbook/`:
   `entiteit-v1.json` (9 fases f0–f8), `aanbieder-v1.json` (5 fases),
   `coverage-v1.json` (per instrument `artikelen[nr][anchor]` +
   `bijlagen[roman]`; disposities: stap/definitie/toepassingsgebied/
   autoriteit/ctpp/slotbepaling/context; steps[] mag op elke dispositie
   meerijden; `reviewed:false` tot de menselijke pass). Types:
   `src/lib/playbook/types.ts`. Vereenvoudigd regime = overlay via
   `appliesTo`, geen apart playbook.
3. **Build + verify** — `scripts/build-playbook.ts` →
   `data/generated/playbook.json` (merge + `byStep`-index + counts);
   `scripts/verify-playbook.ts` (two-regime zoals recital-map): draft mode
   = keyset ⊆ corpus, ref-integriteit via gedeelde corpus-index,
   dispositie-regels, orphan-step-inverse-check, begrippen ⊆ de 65
   punt-anchors van DORA art. 3, voortgangsrapport; final mode
   (`meta.complete:true`, epic 15) = keyset == corpus exact + pins.
4. **Pilot: criticaliteit 20/20** — drafter liep alle leden af; refuter
   (stances: praktisch/citatie/dispositie) vond 7 échte disputen, alle
   tegen de brontekst geverifieerd en toegepast — o.a. EN-logica art. 2
   lid 4 ('elk aandeel' ≥10%) vs OF-logica art. 5 lid 4, de criterium
   c)-afwijking in art. 1 lid 1, art. 6 stap→autoriteit, en de
   zes-weken/30-dagen-termijn van DORA art. 31 lid 5. 5 aanbieder-stappen
   (pa.p1–p4 in f1, pa.p5 in f5).
5. **UI (minimaal)** — `/playbook`, `/playbook/[kind]`,
   `/playbook/[kind]/[fase]` (stap-anchors `#pa.p2`, cross-fase
   `afhankelijkVan`-links via step-index, hover-previews via
   `buildPlaybookRefPreviews`), `/playbook/dekking[/instrument]`
   (per-lid tabel met dispositie-badge, steplinks, corpuslink en
   'nog niet gedekt'). 31 nieuwe pagina's (563 totaal).
6. **MCP** — `get_playbook(kind, fase?)` en `get_coverage(number,
   instrument?)` (reverse lookup "wat moet ik doen voor dit artikel").

## Lessen

- **JSX-interpolatie breekt grep-smokechecks**: SSG emit `Fase <!-- -->0`,
  dus curl-needles mogen geen interpolatiegrens overspannen (skill
  bijgewerkt).
- De refuter-vangst bevestigt het drafter→refuter-patroon ook voor
  playbook-content: alle 7 disputen waren echte fouten van het type dat
  een compliance-lezer zou misleiden (drempellogica, termijnen).
- Dispositie-semantiek gekalibreerd op de pilot: criteria waar een
  aanbieder zichzelf reëel aan kan toetsen zijn "stap", zuivere
  ESA-procedure/databepalingen zijn "autoriteit" met note + eventueel
  meerijdende steps.

## Openstaand (volgende epics)

- Epic 12: DORA-dekking (267 leden) + entity-stappen f0/f2–f8 + 65
  begrippen. Epic 13: overige level-2. Epic 14: aanbieder/CTPP-verdieping.
  Epic 15: refuter-sweep, `complete:true`, pins, curate-playbook-skill.
  Epic 16: regimefilter, voortgangs-checkboxes (localStorage
  `dora-playbook-v1`), search-indexering (re-pin 1031→N), nav-links.
