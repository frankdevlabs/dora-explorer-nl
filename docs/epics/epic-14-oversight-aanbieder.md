# Epic 14 — Oversight-cluster + aanbieder-verdieping (status: done, juli 2026)

Doel: de laatste 54 coverage-entries (het oversight-cluster) en de
verdieping van de aanbieder-playbook-kant. Sluit de dekkingsmatrix op
654/654 en vult de tot dusver lege aanbieder-fases f2–f5. Vervolg op
epic 13 (600/654, alleen oversight-cluster op 0); menselijke review +
`complete:true` + pins volgen in epic 15.

## Wat is gebouwd

1. **Dekking 654/654** — het hele universum gedekt. De 54 cluster-entries:
   oversight (GV 2025/295) 16/16, vergoedingen (GV 2024/1505) 18/18,
   onderzoeksteams (GV 2025/420) 20/20. `meta.complete` blijft bewust
   `false` (de 654-pin + flip zijn epic 15, na de human pass).
   Dispositie-histogram na epic 14: stap 403, autoriteit 170, ctpp 37,
   slotbepaling 19, context 12, toepassingsgebied 10, definitie 3.
2. **De aanbieder-playbook is verdiept van 5 naar 20 stappen** (fases
   f1–f5, eigen id-families spiegelend op de entity-kant):
   - f1: pa.sc1 (aanbieder-scopetoets DORA art 2/3, de vier
     aanwijzingsuitsluitingen 31(8), derde-land 31(12)) vóór pa.p1.
   - f2 Contractuele gereedheid: pa.cg1–cg3 (art-30-minimumbepalingen in
     eigen templates, klant-contractbeleid GV 2024/1773 faciliteren,
     exit/transitie).
   - f3 Onderaanneming: pa.oa1–oa3 (spiegel van pe.oa1–oa3 —
     keten-due-diligence, flow-down, wijzigingsmeldingen; GV 2025/532
     aanbiederszijde).
   - f4 Klantverplichtingen: pa.kv1–kv3 (incidentmedewerking 17–19,
     TLPT-deelname 26(3)–(5) + GV 2025/1190, registerdata per
     ITS-taxonomie UV 2024/2956).
   - f5 CTPP-oversightregime: pa.ov1–ov5 naast pa.p5 (governance/
     aanwijzing, informatielevering/formaten/Bijlage I/omzetopgave,
     onderzoeken & inspecties, aanbevelingen & remediëring, vergoedingen).
3. **DORA's ctpp-leden ontsloten**: de 17 ctpp-disposition-leden van
   art 31–44 die voorheen leeg waren of alleen naar pa.p5 verwezen,
   citeren nu de echte f5-steps (pa.ov*). Ride-along steps landen voor
   het eerst ook op definitie-entries (dora art 3, its art 1).
4. **Methode identiek aan epic 12/13**: 6 parallelle drafters (exacte
   anchor-checklist per batch, file-grounded, strict JSON) → 6
   adversariële refuters (stances praktisch/citatie/dispositie/
   DORA-laag-consistentie) → merge-v14 (valideert refs/keys tegen het
   corpus, idempotent per id-familie, borgt note-behoud) → arbitrage →
   zes verify-groene commits (14a pilot f2, 14b f1/f3/f4, 14c
   onderzoeksteams, 14d f5+ctpp-backfill, 14e oversight+vergoedingen, +
   de parser-fix).

## Refuter-oogst (19 disputen + 35 near-misses, alle gearbitreerd)

Representatief: het Bijlage I-model (GV 2025/295 art 5) hoort bij art 35
lid 1 punt d) iv) (stopzetting verdere uitbesteding), niet bij de
beoordeling van geplande uitbesteding; het gezamenlijke onderzoeksteam
*staat de lead overseer bij* — de onderzoeks-/inspectiebevoegdheden liggen
bij LO-functionarissen en gemachtigden (art 38(3)/39(2)), niet bij het
team; de omzetberekening van art 3(1) GV 2024/1505 geldt alleen in
reguliere jaren (art 4 kent afwijkingen voor de eerste CTPP-lijst en het
aanwijzingsjaar, plus een €50k-vloer die strikte evenredigheid breekt);
DORA 26(4) is een optie ("kunnen overeenkomen"), geen imperatief; de
LEI/EUID-identificatieplicht (ITS art 3(5)) geldt alleen voor
rechtspersonen; de kennisgeving aan klanten na aanwijzing staat in art
31(5) tweede alinea, niet lid 13. Onderzoeksteams is zuiver autoriteit
(19× + 1 slotbepaling): geen enkel lid legt een plicht bij de CTPP zelf.

Bron-eigenaardigheden genoteerd (geen corrigendum-actie in deze epic):
GV 2025/295 art 3(1) verwijst naar "Verordening (EU) 2022/2254" (moet 2554
zijn); GV 2025/420 art 5(1) NL bevat de duplicatie "zorgvuldigheid en
zorgvuldigheid" — beide in de basistekst; controleren bij epic 15.

## Parser-fix (uit de refuter-ronde)

De vergoedingsformule van GV 2024/1505 art 3(2) staat in de bron alleen
als afbeelding (`<figure><img data:image/jpg;base64…>` met alt "Formula")
en werd stil weggelaten — de lid-tekst eindigde op "als volgt berekend:".
Nieuwe ContentNode `figure` {src, alt}: de parser geeft de data-URI
ongewijzigd door (transcriberen zou handmatige wetstekst-bewerking zijn,
regel 2), de renderer toont de afbeelding, flatten geeft "" (parity met de
bronextractie), MCP toont een placeholder. Enige figure in het corpus;
regressie-oracle schoon (per-instrument doc/ref-tellingen identiek).

## Openstaand

- Epic 15: menselijke review (alle entries `reviewed:false`), daarna
  `meta.complete:true` + de count-pin (`coverageEntries: 654`) in
  verify-playbook.ts; corrigendum-check op de twee bron-eigenaardigheden.
- Epic 16: UX-verfijning (f3-entity is ~48 steps op één lijst; aanbieder
  f5 nu 6 steps).
