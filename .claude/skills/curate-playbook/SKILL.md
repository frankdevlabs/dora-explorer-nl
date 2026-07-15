---
name: curate-playbook
description: Curate/review the compliance-playbook coverage matrix (data/playbook/coverage-v1.json) and the two step files (entiteit-v1.json, aanbieder-v1.json) for DORA + the twelve level-2 acts - drafting/adjusting entries, adversarial review, human review (flipping reviewed:true), and finishing (meta.complete + pins). Use when reviewing drafted entries, correcting a disposition/note/step, adding coverage after a corpus change, or re-finishing the matrix.
---

# Curate the playbook coverage matrix

Editorial-metadata layer (AGENTS.md rule 2b): interpretive, hand/LLM-curated,
explicitly NOT legal text. It feeds `/playbook`, the per-instrument
`/playbook/dekking/<inst>` matrix, and MCP `get_coverage`/`get_playbook`.
It must never alter the rendering of legal text.

Scope: `data/playbook/coverage-v1.json` — one `CoverageEntry` per
paragraph-level anchor (`lid-N` | `inhoud`) and per annex (roman) of all 13
instruments; plus the step files `data/playbook/{entiteit,aanbieder}-v1.json`.
The keyset is fixed by the corpus: **never add or remove coverage keys by
hand** — the anchor universe comes from `data/generated/<inst>/{articles,
annexes}.json`. Keys change only when the corpus/parser changes (then the
keyset shifts automatically and verify tells you what to fill).

## The entry contract (enforced by `scripts/verify-playbook.ts` `checkEntry`)

`CoverageEntry = { disposition, steps?, note?, reviewed }`.

Disposition (exactly one) — classify by WHO the lid binds / what it is:
- `stap` — concrete obligation the financial entity operationalizes →
  **requires `steps[]`** (pe.* / pa.* ids that exist in a step file).
- `autoriteit` — addresses/empowers a competent authority / ESA / lead
  overseer / Commission → **requires `note`** (why it still matters to read).
- `ctpp` — binds a critical ICT third-party provider / the oversight regime
  (may also carry aanbieder steps, e.g. pa.ov*/pa.p5).
- `definitie` — a definitions article.
- `toepassingsgebied` — subject-matter / scope / addressees.
- `slotbepaling` — transitional / final / entry-into-force.
- `context` — non-actionable context → **requires `note`**.

Global invariants verify also enforces: every cited step must exist and every
step must be cited by ≥1 entry (no orphans); step ids obey the `pe.`/`aa.`→
`pa.` prefix and forward-ordering; retired ids in `RETIRED_STEP_IDS` never
return (localStorage progress is keyed by step id).

## Human/adversarial review procedure (batch ~20, by instrument)

1. Pick an instrument (or article range for dora); read its slice of
   `coverage-v1.json` next to the source text from
   `data/generated/<inst>/{articles,annexes}.json` — **never from memory**.
2. For each entry check: (a) disposition correct for the lid's actual text —
   who is bound, is there a real duty; (b) `note` accurate/supported by THIS
   lid and present where required; (c) `steps[]` grounded — each step's
   `refs`/`titel` (see the step files, or build a compact catalog) plausibly
   covers this lid.
3. Norm: precision over invention. A dispute is signal — verify it against the
   source, arbitrate, apply the better-grounded fix. Do not reclassify a lid
   just to fragment a coherent step group. Adding/removing a step touches a
   step file (respect `RETIRED_STEP_IDS`, forward-ordering, the orphan rule).
4. Flip `reviewed: true` for the reviewed entries. Bulk-flip preserving JSON
   formatting with a literal replace (`"reviewed": false` → `"reviewed": true`),
   not a JSON re-serialize (which reflows the whole file).
5. `npm run parse && npx tsx scripts/verify-playbook.ts` (lax/subset regime
   while `complete:false`) — commit source + generated `playbook.json`
   together (`playbook review: <inst> reviewed`).

Scale tip (epic 15 method): one file-grounded verifier agent per instrument
in parallel, each returning a strict-JSON dispute list; arbitrate centrally,
apply, then bulk-flip. dora (267) splits into ~3 article-range agents.

## Finishing (all entries reviewed)

1. Set `meta.complete: true` in `coverage-v1.json`.
2. This flips `verify-playbook.ts` to the **strict regime**: keyset ==
   corpus exactly (`covered === universe` per instrument) + the pinned
   `EXPECTED`. Audit before pinning; each pin carries a history comment.
   Current pins: `coverageEntries: 654` (637 leden + 17 bijlagen),
   `begrippen: 65` (DORA art. 3 punt-anchors).
3. `npm run build` must pass in the strict regime. Commit source + generated
   + verify together.

Two-regime verify keyed on `meta.complete` — same pattern as
`verify-recital-map` (`curate-recital-map` skill). Status: finished in epic 15
(juli 2026); a corpus change that shifts the keyset drops it back to the
subset regime until re-reviewed and re-pinned.
