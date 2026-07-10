# Epic 2 — Cross-reference grammar, multi-instrument

**Status**: done (July 2026). Pinned: dora 178, its 26, rts 10 = 214 refs.
Negative sweep over all 214 emitted refs: 0 foreign-qualifier hits; inverse
sweep over ~95 unannotated reference-looking phrases: all are citations into
other acts (Richtlijn 2013/36/EU, Verordening (EU) 2016/679, VWEU, "die
verordening", …) or quoted text inside amendment arts 59–63.
**Goal**: references annotated across all three instruments, including
cross-instrument links (ITS/RTS text → DORA's unprefixed routes), validated
against the union corpus.

## Design decisions

**Target-instrument resolution instead of a boolean allow/deny.**
`RefContext` gained `instrument`; `allowedHere()` became `resolveTarget()`
returning `InstrumentId | null`. Resolution order matters: (1) generic
self-forms (`deze/onderhavige (uitvoerings|gedelegeerde )?verordening`) →
own instrument; (2) the three registered citation forms (built from
`instruments.ts` at module load: `Verordening (EU) 2022/2554`,
`Uitvoeringsverordening (EU) 2024/2956`, `Gedelegeerde Verordening (EU)
2025/532`) → that instrument — checked **before** (3) the generic
other-instrument exclusion, which would otherwise swallow them; (4)
VWEU/VEU and other instruments → null; (5) conjunction lookahead (the
distribution trap, ported unchanged); (6) bare → own instrument when
`linkBareRefs`.

**Hrefs carry the target's route prefix** (`/artikel/28#lid-3` from RTS
text; `/its/bijlage/i` inside ITS). Self-link dropping and the hoofdstuk
index anchor are prefix-aware. "van die verordening" (anaphoric back-ref,
usually DORA) stays excluded — resolving anaphora is not worth false links.

**Amendment articles: dora 59–63** (wijzigingen van Verordeningen (EG)
1060/2009, (EU) 648/2012, 909/2014, 600/2014, 2016/1011) quote text of
other acts → `linkBareRefs: false`, the aiact 102–110 pattern. Found by the
first annotation run throwing on `/bijlage/i#punt-4` (DORA has no annexes —
the quoted text referenced Reg 1060/2009's annex).

**Validation post-pass** rebuilt in `parse-corpus.ts` phase B: parse all
instruments first, build per-instrument anchor/chapter/recital resolvers,
then annotate — ITS/RTS refs validate against the DORA corpus. Unresolvable
page target = throw; missing/non-unique fragment = stripped to page link.

**Latin article suffixes dropped** (`bis/ter/quater`) — those were
omnibus-inserted AI Act articles; DORA/ITS/RTS have none.

## Files

Modified: `src/lib/crossrefs.ts` (rewrite), `scripts/parse-corpus.ts`
(phase A/B/C split + annotation + per-instrument ref counts),
`scripts/verify-data.ts` (ref pins, cross-instrument positive spot checks,
href-shape belt-and-braces).

## Verification

`verify-data`: per-instrument ref counts (178/26/10), positive checks
(its art 3 → `/artikel/28#lid-3`, rts art 4 → `/artikel/30#lid-3-c`, rts →
`/#hoofdstuk-iv`), href-shape assertion over every ref. Sweeps documented
above ran as one-off audit scripts before pinning. Rendered check: art 16
links naar art 5–14 reeks, art 28 → art 30.

## Risks

- Other RTS/ITS under DORA (e.g. incident-classification RTS 2024/1772) are
  cited with the same nouns; only the three registered citation forms
  resolve, the rest hit the generic exclusion — confirmed by the sweep.
- If a future consolidated DORA lands, re-run the sweep; pins will drift
  (that is the design).
