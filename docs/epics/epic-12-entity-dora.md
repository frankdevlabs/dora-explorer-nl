# Epic 12 — Entity content I: DORA (status: done, juli 2026)

Doel: het DORA-deel van de playbook-inhoud — alle 267 leden van de
verordening zelf gedekt in de coverage-matrix, de entity-stappen voor
fases f0/f2–f8, en de 65 begrippen van artikel 3. Vervolg op epic 11
(spine + criticaliteit-pilot); level-2-inhoud volgt in epic 13.

## Wat is gebouwd

1. **Dekking dora 267/267** (totaal 287/654). Dispositie-histogram:
   stap 127, autoriteit 118, ctpp 17, context 9, slotbepaling 8,
   toepassingsgebied 7, definitie 1. Mandaat-leden consequent
   `autoriteit` met rijdende implementatiestappen (art 15, 16 lid 3,
   18 lid 3–4, 20) — kalibratielijn gedocumenteerd voor epic 13/14.
2. **56 entity-stappen**: f0 pe.s1–s2 (scope/evenredigheid), f2
   pe.g1–g3 (governance), f3 pe.r1–r22 (risicobeheerkader; art
   16-stappen appliesTo `vereenvoudigd`, rest `volledig`), f4 pe.i1–i8
   (incidenten incl. exacte 4u/24u/72u/1-maand-meldklok uit GV
   2025/301), f5 pe.t1–t7 (testen/TLPT), f6 pe.d1–d9 (TPRM), f7
   pe.u1–u2 (informatie-uitwisseling), f8 pe.o1–o3 (oversight:
   entiteitsplichten 31 lid 12, 42 lid 3, opschortingsgereedheid).
3. **65 begrippen** met praktische toelichtingen, gerenderd op
   /playbook/entiteit/f1 met hover-previews naar /artikel/3#punt-N.
4. Methode: 8 parallelle drafters (per hoofdstuk, elk met exacte
   anchor-checklist) → 8 adversariële refuters (praktisch/citatie/
   dispositie) → centrale merge (scratchpad-mergescript valideert
   checklists en id-prefixes) → arbitrage tegen de brontekst.

## Refuter-oogst (4 disputen + 33 near-misses, alle toegepast)

Representatief: art 11 lid 1 is een EN-constructie (specifiek beleid
én integrerend onderdeel), niet of/of; art 8 lid 2 GV 2024/1772 kent
een derde cumulatieve voorwaarde voor terugkerende incidenten; de 24u
van art 5 GV 2025/301 is een meldklok, geen classificatiedeadline
(lid 2 regulariseert latere classificatie); art 3 punt 64 opent met
"geen kleine onderneming zijnde"; het NIS2-substitutie-effect loopt
via art 4 NIS2, niet rechtstreeks via art 1 lid 2; begrip punt-13
citeerde lid 4 waar lid 2 hoort.

## Incident

Een sessielimiet (rate limit) doodde 4 agents halverwege; 3 hadden hun
outputbestand al geschreven, 1 refuter is via SendMessage hervat met
behoud van context, 1 refuter opnieuw gestart. Bestandsgebaseerde
overdracht (scratchpad-JSON per batch) maakte dit verliesvrij.

## Openstaand

- Epic 13: level-2-instrumenten (risicobeheer 111 leden het grootst).
- Epic 14: aanbieder/CTPP-verdieping (dora ctpp-leden verwijzen nu
  alleen naar pa.p5; aanbieder-scope-stap voor art 2 ontbreekt bewust).
- Epic 15: pins + `complete:true`; epic 16: search/checkboxes/filter.
