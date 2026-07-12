---
name: extend-parser
description: Safely extend scripts/parse-corpus.ts or the crossref grammar (src/lib/crossrefs.ts) - diagnose resolver throws from the source sentence, validate new dialect handling against a dual-dialect oracle fixture, guard against silent data loss and vacuous comparisons. Use when the parser throws "unresolvable cross-reference/chapter ref", when a new act's markup has unhandled constructs (annexes, data tables, enumerations), or when adding a citation form.
---

# Extend the parser or crossref grammar

The corpus is legal text: a parser bug is a wording bug (AGENTS.md rule 2).
Two invariants make extension safe — **the resolver throws instead of
guessing**, and **the existing pins are your regression oracle**.

Division of labor: reference **grammar** (what counts as a citation, how
qualifiers distribute) lives in `src/lib/crossrefs.ts`; **dialect/markup
parsing** (`parseDataTable`, `parseOjPointTable`, `parseOjAnnexes`) and
href **validation** (`resolveRefHref`, the throws) live in
`scripts/parse-corpus.ts`.

## 1. A resolver throw is a feature — read the source sentence first

`parse-corpus.ts` throws `unresolvable cross-reference target` when a ref
resolves to something that doesn't exist. Do NOT weaken the throw. Instead:

```bash
python3 -c "
import re, html
s = open('data/source/<file>.html').read()
t = html.unescape(re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',s)))
for m in re.finditer(r'<the failing phrase>', t):
    print('...' + t[max(0,m.start()-160):m.end()+160] + '...')
"
```

Then classify:
- **New grammar construct** → extend `src/lib/crossrefs.ts` minimally.
  Real constructs found in the 2024-25 acts (all now handled — models for
  the next one): comma-chained series whose closing qualifier distributes
  ("artikel 35, lid 6, artikel 37, lid 1, … en artikel 39, lid 6, van
  Verordening (EU) 2022/2554"), parenthesized follow-up lid ("artikel 30,
  lid 2, en (3), van …"), range variant "punten a), b) en met c)".
- **Genuinely unlinkable** → drop or exclude explicitly, with a comment
  (model: bare "hoofdstukken … van deze titel" into a chapterless corpus
  is dropped in `resolveRefHref`, because 2024/1774 nests chapters in
  titles which the toc model can't represent).
- **Parser bug** → fix the parser, never the assertion.

## 2. Existing pins are the regression oracle

Before and after ANY grammar/parser change, run the full parse and compare
the per-instrument summary line. Corpora your change shouldn't touch must
stay **identical** (same art/rct/anx/ref/doc counts). Any drift: audit it
in `git diff data/generated/` change by change; either it's an intended
improvement (document it in the re-pin history comment) or a regression.
Legitimate cross-drift exists: registering a new citation form makes
previously-excluded citations linkable in OTHER corpora (epic 10:
onderzoeksteams 23→24 refs when 2025/295 joined the registry).

## 3. Oracle fixture for new dialect handling

The repo has one document in BOTH EUR-Lex dialects:
`data/source/its_nl_oj.html` and `its_nl_consolidated.html`. Any new
OJ-dialect capability (annexes, tables) can be validated against the
consolidated parser as ground truth:

1. Swap the ITS `SOURCES` entry to the OJ file **with sed, both ways** —
   never revert with git (see traps).
2. Parse; **confirm the parse actually succeeded and the output file
   changed** before copying it aside.
3. Swap back, parse again, deep-compare the two annexes.json.
4. Compare **full structures** — node types in order, table dimensions AND
   cell text, heading/text sequences. Count-equality is not enough: epic 10
   had equal table counts while nested layout mini-tables inflated row
   counts 2x (fix: `parseDataTable` takes direct `tbody > tr` children
   only; nested-table text belongs to the containing cell).
5. Divergence is not automatically failure — judge it (the OJ parser puts
   annex footnotes in the `footnotes` field where consolidated had them as
   a trailing table row; the new behavior was better and was kept,
   documented in the commit).

## 4. Silent data loss checks

The old OJ dialect dropped every `<table>` that wasn't a 2-column point
row — silently. Rules since epic 10:

- Any element the parser deliberately skips must be an explicit,
  commented branch — never a silent fall-through.
- Cross-check element counts in the source against emitted nodes:
  `grep -oc 'class="oj-table"' data/source/<file>.html` vs table/list
  nodes in the generated JSON (minus nested layout tables).
- When a discriminating heuristic decides between shapes (point row vs
  data table), make the "reject" outcome produce the OTHER shape, not
  nothing (`parseOjPointTable` returns null → data-table branch).

## 5. Traps (each one happened)

1. **Never `git checkout --` a file carrying uncommitted work** during A/B
   oracle runs — it reverts your parser changes along with the swap. Swap
   configs with targeted sed, forward and back. (Cost one full redo in
   epic 10.)
2. **Vacuous oracle pass**: if the A-side parse crashes, the output file
   still holds the previous run's data and you end up comparing X with X —
   a perfect, meaningless match. Always check the parse's own success
   output (the `parsed — …` summary line) before trusting a comparison.
3. **tsx does not typecheck** — `npx tsx scripts/…` runs happily with type
   errors that `next build` later rejects. After touching script/lib types,
   run `npm run build` (or at least the typecheck) before calling it done.
4. `const` regexes declared after their first-use function are fine at
   runtime (module init order) but keep new grammar constants next to the
   existing ones (top of crossrefs.ts) for findability.

## 6. Finish

Re-pin consciously (`REF_EXPECT`, totals, search-doc counts) with a history
comment stating what changed and why; run the full `npm run verify`; commit
parser + source + generated together.
