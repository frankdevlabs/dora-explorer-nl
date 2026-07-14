# Epic 13 — Entity content II: level-2 (status: done, juli 2026)

Doel: de acht entity-relevante level-2-instrumenten in de playbook-laag —
313 coverage-entries (297 leden + 16 bijlagen) en de bijbehorende stappen,
geweven in de bestaande fases f3–f6. Vervolg op epic 12 (DORA 267/267);
het oversight-cluster (oversight/vergoedingen/onderzoeksteams, 54 entries)
volgt in epic 14.

## Wat is gebouwd

1. **Dekking 600/654**: risicobeheer 111/111 (f3), classificatie 28/28 +
   rapportage 12/12 + formulieren 23/23 (f4), tlpt 77/77 (f5),
   contractbeleid 29/29 + onderaanneming 13/13 + its-register 20/20 (f6).
2. **52 nieuwe entity-stappen** in eigen id-families per instrument:
   pe.rb1–rb31 (volledig kader, appliesTo `volledig`), pe.rv1–rv7
   (vereenvoudigd kader, appliesTo `vereenvoudigd`; rv7 = evaluatie-
   verslag art 41 uit de refuter-ronde), pe.ic1–ic2, pe.im1–im4,
   pe.tl1–tl8, pe.cb1–cb6, pe.oa1–oa3, pe.ir1–ir3. Ride-along eerst:
   veel leden citeren bestaande steps (pe.i3/i4, pe.d2–d9, pe.t4–t7,
   pa.p4) in plaats van nieuwe steps te munten.
3. **10 bestaande steps aangescherpt** uit de refuter-ronde (verdiende
   ride-alongs): pe.r3/r11/r13 (evaluatieverslag elektronisch
   doorzoekbaar, art-24-beleidsinhoud, testinput + meldplicht art 25
   lid 5), pe.i1/i2 (contactenlijst, bewijsbewaring art 22), pe.i3
   (derden-tak significantietoets art 10), pe.i6/i7 (bijlage III/IV +
   volledigheidscheck; art-6-timing uitbestede rapportage), pe.d4
   (anker art 5 lid 2), pe.d7 (exitplan per overeenkomst + timing).
4. Methode identiek aan epic 12: 9 parallelle drafters (exacte
   anchor-checklist per batch) → 9 adversariële refuters (stances
   praktisch/citatie/dispositie/DORA-laag-consistentie) → merge-script
   v13 (valideert anchors tegen het corpus, idempotent per id-familie)
   → arbitrage → drie verify-groene commits (13a/13b/13c).

## Refuter-oogst (19 disputen + 41 near-misses, alle gearbitreerd)

Representatief: art 24 lid 2 GV 2024/1774 eist een secundaire
verwerkingslocatie *identiek aan* de primaire (CTP's); 'materiële
onderdelen daarvan' hoort bij de functies, niet bij de ICT-dienst
(GV 2025/532); de tienwekenklok van art 12 GV 2025/1190 loopt vanaf de
*actieve red-teamtestfase*; de meldmodel-velden heten 1.1 'Soort
indiening' en 2.10 'Andere nuttige informatie' (art 5 UV 2025/302
gebruikt andere aanduidingen — eigenaardigheid van de basistekst, EN
identiek); art 9 lid 3 GV 2024/1773 verwijst fout naar 'artikel 6'
(verwijzingsfout in beide taalversies); GVM-term is 'belangrijke'
(niet 'significante') kredietinstellingen. Twee vermeende
NL-drukfouten door refuters ontkracht tegen de EN-tekst: beide
eigenaardigheden zitten in de basistekst zelf, geen corrigendum-
kandidaten.

## Openstaand

- Epic 14: oversight-cluster (54 entries) + aanbieder-playbook-verdieping
  (o.a. aanbiederszijde GV 2025/532, spiegel pa-steps).
- Epic 15: menselijke review (alle entries `reviewed: false`).
- Epic 16: UX-verfijning (f3 is nu ~45 steps op één lijst).
