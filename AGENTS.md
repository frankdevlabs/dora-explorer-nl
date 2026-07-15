<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
# DORA Explorer NL — operating manual

Static Next.js explorer for the Dutch text of DORA (Verordening (EU)
2022/2554) plus all twelve published level-2 acts (RTS/ITS/delegated
regulations — see the corpus table below).
No database, no server: `output: 'export'` produces a fully static site.
Search is client-side (MiniSearch over a build-time corpus). Also ships two
DORA assessments (entity-level and per-ICT-arrangement supplier/TPRM) and a
Register-of-Information tool (art. 28, lid 3 DORA).

Ported from `~/ai-act-explorer-nl` (see its `docs/PORTING.md` for the port
method). Plan/status per feature: `docs/epics/`. Repeatable procedures:
`.claude/skills/` (`plan-an-epic` — the working method, `add-instrument`,
`extend-parser`, `curate-recital-map`, `curate-playbook`, `verify-app`).

## Golden rules

1. **Never hand-edit `data/generated/*` or `public/search-docs.json`.** They
   are parser output. Change the parser and run `npm run parse`.
2. **Never edit the legal text itself.** All base-corpus content comes
   deterministically from the EUR-Lex HTML files in `data/source/` — no
   manual or LLM transcription, ever. Wording bugs are parser bugs.
   **Editorial-metadata carve-out (rule 2b):** curated machine-readable
   metadata is clearly not legal text and must never alter the rendering of
   legal text. Four such layers exist: the RoI provenance-overlay in
   `scripts/build-roi-schema.ts`, `data/source/recital-article-map.json`
   (recital↔artikel; procedure: `.claude/skills/curate-recital-map/`),
   `data/source/l2-map.json` (DORA↔ITS/RTS) and `data/playbook/`
   (compliance-playbooks + per-lid dekkingsmatrix, epic 11). Each is gated
   by its own verify script.
3. `npm run build` = `parse → verify → next build`. If a verify script fails,
   fix the parser or curated source (or, after a deliberate source update,
   the assertions) — don't loosen assertions to pass. Re-pin exact counts
   only after auditing `git diff data/generated/` change by change; each pin
   carries a history comment — read it first.
4. Commit `data/source/`, `data/generated/`, and generated `public/*.json`
   together with the parser change that produced them.

## Corpus (multi-instrument)

DORA + all twelve published level-2 acts, one corpus (epics 1 + 10). DORA
owns the unprefixed routes (`/artikel/28`, `/overweging/5`); every satellite
lives under its topic slug (= `routePrefix` in `src/lib/instruments.ts`,
the single source of truth — id, citation, CELEX, route all come from there):

| id | Act | routePrefix |
|---|---|---|
| `dora` | Verordening (EU) 2022/2554 | (unprefixed) |
| `its` | UV (EU) 2024/2956 — RoI-templates | `/its-register` |
| `rts` | GV (EU) 2025/532 — onderaanneming | `/rts-onderaanneming` |
| `risicobeheer` | GV (EU) 2024/1774 — ICT-risicobeheerkader | `/rts-risicobeheer` |
| `classificatie` | GV (EU) 2024/1772 — incidentclassificatie | `/rts-classificatie` |
| `rapportage` | GV (EU) 2025/301 — meldingsinhoud/-termijnen | `/rts-incidentrapportage` |
| `formulieren` | UV (EU) 2025/302 — meldformulieren | `/its-incidentrapportage` |
| `tlpt` | GV (EU) 2025/1190 — TLPT | `/rts-tlpt` |
| `contractbeleid` | GV (EU) 2024/1773 — contractbeleid | `/rts-contractbeleid` |
| `criticaliteit` | GV (EU) 2024/1502 — criticaliteitscriteria | `/criticaliteitscriteria` |
| `vergoedingen` | GV (EU) 2024/1505 — oversightvergoedingen | `/oversightvergoedingen` |
| `oversight` | GV (EU) 2025/295 — oversightuitoefening | `/rts-oversight` |
| `onderzoeksteams` | GV (EU) 2025/420 — gezamenlijke onderzoeksteams | `/rts-onderzoeksteams` |

Satellite pages render through the dynamic `src/app/[instrument]/` segment;
adding an act = registry row + `SOURCES` entry in `scripts/parse-corpus.ts`
+ `data.ts` imports + `InstrumentIndex` blurb + verify pins + l2-map link +
recital-map seed (see `docs/epics/epic-10-level2-corpus.md`). Old `/its` and
`/rts` routes 301 via nginx.

All EUR-Lex sources are WAF-blocked; fetch via
`python3 ~/law-tracker/lib/fetch_blocked_doc.py "<url>" "<out>"`.

## Conventions

- Anchors: `#lid-3`, `#lid-3-a`, `#punt-12`, `#inhoud` — stable deep links,
  used by search results. Don't rename without updating the parser's anchor
  generation and search-doc URLs together.
- All dynamic routes: `generateStaticParams` + `export const dynamicParams =
  false`. Next 16: `params` is a Promise — `await` it.
- RSC boundary: client-component props must be plain serializable data (no
  Set/Map); derive UI state during render, not in effects.
- UI language is Dutch; code, comments, and docs are English.
- localStorage keys/events are `dora-*` / `dora:*`.
- No test framework; verification = the verify scripts + the `verify-app`
  skill.

## Environment (this VPS)

- Dev server in tmux: `tmux new-session -d -s dora-dev 'npm run dev -- -p 3107'`
  (check `tmux list-sessions` first; port **3107** — 3105/3106 belong to the
  AI Act explorer).
- MCP server (epic 4): port **3108**, systemd user unit `dora-mcp`, endpoint
  `https://dora.mrfrank.dev/mcp`.
- No pip; no root. Playwright works via `~/law-tracker/lib`.
- GitHub: `frankdevlabs/dora-explorer-nl`; commit as
  `frankdevlabs <29236012+frankdevlabs@users.noreply.github.com>`.

## State (epics 0-10 done)

Alles uit het initiële plan is gebouwd: corpus, crossrefs, UI, MCP, beide
assessments, de registerwerkbank (`/register`, schema afgeleid via
`scripts/build-roi-schema.ts`), de exports en de editorial maps (epic 9).
Epic 10 (juli 2026) voegde de tien resterende level-2-handelingen toe —
volledig level-2-corpus, geen openstaande mandaten. Site en MCP zijn live
op https://dora.mrfrank.dev. Epic 11 (juli 2026) legde de playbook-spine:
`/playbook` (entiteit + aanbieder) met per-lid dekkingsregister over alle
654 bepalingen (`data/playbook/`, verify-playbook, MCP get_playbook/
get_coverage); pilot criticaliteit 20/20 gedekt. Epic 12 (juli 2026)
dekte DORA volledig: 267/267 leden, 56 entity-stappen (f0/f2–f8), 65
begrippen op /playbook/entiteit/f1. Epic 13 (juli 2026) dekte de acht
entity-relevante level-2-instrumenten met 52 nieuwe stappen in eigen
id-families (pe.rb/rv/ic/im/tl/cb/oa/ir, fases f3–f6) — dekking 600/654.
Epic 14 (juli 2026) sloot de matrix op **654/654**: het oversight-cluster
(oversight 16/16, vergoedingen 18/18, onderzoeksteams 20/20) gedekt en de
aanbieder-playbook verdiept van 5 naar 20 stappen (fases f1–f5:
pa.sc/cg/oa/kv/ov), met de 17 DORA-ctpp-leden nu naar echte f5-steps.
Bijvangst: parser-fix voor figure-afbeeldingen (GV 2024/1505 art 3(2)
formule; nieuwe ContentNode `figure`). Epic 15 (juli 2026) sloot de matrix:
alle 654 dekkingsentries menselijk gereviewd via een 13-instrument
adversariële verifier-sweep (`reviewed:true`), `meta.complete:true`, en de
count-pin `coverageEntries: 654` in verify-playbook (strikte regime nu actief).
Acht laag/midden-disputen: vier toegepast (formulieren GVM→GTM, criticaliteit
art 1(1) +pa.p1, vergoedingen art 4(3) +pa.ov1, dora art 19(2) vrijwillig-note),
vier bewust behouden. Corrigendum-check: geen EUR-Lex-corrigendum op de twee
bron-eigenaardigheden (oversight art 3(1) '2022/2254', onderzoeksteams art 5(1)
'zorgvuldigheid en zorgvuldigheid') — blijven onbewerkte brontekst.
Epic 16 (juli 2026) legde de playbook-UX op de bevroren data: regimefilter
(volledig/vereenvoudigd resp. aanbieder/ctpp, opt-in) + voortgangs-checkboxes
(localStorage `dora-playbook-v1`, step-id-keyed) in twee client-eilanden
(`PlaybookSteps`, `PlaybookProgress`) op een `src/lib/playbook/store.ts`
(roi-store-patroon), plus nav-links (Playbook in de header, PrevNextNav tussen
fases). Geen data-wijziging — verify-playbook-pins ongewijzigd.
Nagekomen (juli 2026): playbook step search-indexering (het uit epic 16
uitgestelde item) — build-playbook emitteert 128 `type:"stap"` SearchDocs
(`stap-<id>`, url `/playbook/<kind>/<fase>#<id>`) in de gedeelde corpus, dus
stappen zijn vindbaar op /zoeken, in de Cmd-K-palette én in MCP `search_dora`;
verify-data re-pin `1031→1159` (+carve-out), verify-search +2 golden queries;
verify-playbook 654/654 ongewijzigd. Openstaand: menselijke review van de
recital-map (complete=false) — alle 284 entries zijn gedraft en adversarieel
gereviewd (drafter→refuter; twee REVIEW:-gemarkeerde disputen wachten op
arbitrage), maar nog `reviewed: false`.
