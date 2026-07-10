# Epic 5 — Entity-level DORA assessment

**Status**: done (July 2026). entity-v1.json: 18 modules / 57 vragen;
fixtures VB-E1…E4 green; Playwright flow (aanmaken → scope → micro →
resultaat) green. Built together with epic 6 (shared engine split, wizard,
verify).
**Goal**: `/assessment/entiteit` — welk DORA-regime geldt voor de financiële
entiteit en welke verplichtingen per pijler, met checklist en tijdlijn.

## Design decisions

**Engine split (D4).** `engine-core.ts` holds the questionnaire-agnostic
forward pass (computeVisibility with a deriveFlags hook, evalCondition,
obligationStatuses, progress, export helpers); `entity-outcome.ts` and
`supplier-outcome.ts` interpret flags into outcomes. The AI-Act `engine.ts`
(risk ladder, ANNEX3_LABELS, escape logic, register row) was deleted with
its questionnaire.

**Question ids are prefixed per questionnaire** (`e1.1`, `s1.1`) so entity
and supplier answers can never collide in storage or fixtures. RETIRED_IDS
discipline restarts per questionnaire (empty lists, never shrink).

**Outcome = regime + pillars, no risk class.** `buiten-scope | volledig |
vereenvoudigd (art 16) | micro`. Scope gate: `in_scope` (art 2(1) categorie)
minus `uitgesloten` (art 2(3)); art 16-entiteiten krijgen m9 in plaats van
m5–m8; TLPT-verplichtingen alleen na `tlpt_aangewezen` (art 26(8)-aanwijzing);
ketenregistratie (e16.3) en exit-eisen alleen bij `cif_uitbesteed`.

**Module map** (alle refs deep-linken het corpus): m1 identificatie
(B_01.01-seed) · m2 scope art 2 · m3 proportionaliteit art 4 + regime art 16
· m4 governance art 5 · m5 kader art 6 · m6 identificatie/bescherming art
7–9 · m7 detectie/respons/herstel art 10–12 · m8 leren/communicatie art
13–14 · m9 vereenvoudigd art 16 · m10 incidentproces art 17 · m11
classificatie art 18 · m12 melding art 19–23 · m13 testen art 24–25 · m14
TLPT art 26–27 · m15 TPRM-strategie art 28(1)-(2)+29 · m16 register art
28(3)+ITS · m17 contract/exit art 28(4)-(8)+30 · m18 oversight/CTPP art
31+45. Timeline: 17-1-2025 (DORA), 22-7-2025 (RTS), 31-12-2025 (referentie),
22-3-2026 (AFM, xBRL-CSV; DNB 20-3); boete-categorie-3-noot bij het
resultaat. Start lean (57 vragen) — verdieping per module is het
gesanctioneerde pad (het AI-Act-project groeide 18→25 modules na launch).

**Store**: `dora-entity-assessments` (v1), aiact-patroon
(useSyncExternalStore + events, JSON-export/-import merge-by-id); naam volgt
antwoord e1.1.

## Files

New: `src/lib/assessment/{engine-core,entity-outcome}.ts`,
`data/questionnaire/entity-v1.json`,
`src/components/assessment/{EntityAssessment,ObligationList}.tsx`,
`src/app/assessment/entiteit/{page,vragenlijst/page,resultaat/page}.tsx`.
Rewritten: `src/lib/assessment/{types,store,data}.ts`,
`src/components/assessment/{Wizard,shared}.tsx` (generic, storage-agnostisch),
`src/app/assessment/page.tsx` (hub met twee kaarten),
`scripts/verify-assessment.ts`.
Deleted: `engine.ts`, `assessment-v1.json`, `AssessmentHome/Outcome/
RegisterClient`, oude assessment-routes.

## Verification

`verify-assessment`: ref-anchors tegen het multi-instrumentcorpus (incl.
/its- en /rts-refs), forward-ordering van flags, answer-domeinregels,
fixtures VB-E1 (micro), VB-E2 (art 16: m5–m8 weg, m9 aan, register blijft),
VB-E3 (buiten scope: geen verplichtingen), VB-E4 (volledig + TLPT + CIF:
open actie e16.1, AFM-datum in tijdlijn). Playwright-flow zie boven.

## Risks

- Editorial paraphrase quality — mitigated by deep links + disclaimer (aiact
  pattern); depth grows iteratively.
- Art 16-lijst en art 2(3)-uitsluitingen zijn samengevat in help-teksten;
  bij twijfel stuurt de tekst naar de bepaling zelf.
