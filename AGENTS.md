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
method). Plan/status per feature: `docs/epics/`.

## Golden rules

1. **Never hand-edit `data/generated/*` or `public/search-docs.json`.** They
   are parser output. Change the parser and run `npm run parse`.
2. **Never edit the legal text itself.** All base-corpus content comes
   deterministically from the EUR-Lex HTML files in `data/source/` — no
   manual or LLM transcription, ever. Wording bugs are parser bugs.
   **Editorial-metadata carve-out (rule 2b):** curated machine-readable
   metadata is clearly not legal text and must never alter the rendering of
   legal text. Three such layers exist: the RoI provenance-overlay in
   `scripts/build-roi-schema.ts`, `data/source/recital-article-map.json`
   (recital↔artikel; procedure: `.claude/skills/curate-recital-map/`) and
   `data/source/l2-map.json` (DORA↔ITS/RTS). Each is gated by its own
   verify script.
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
op https://dora.mrfrank.dev. Openstaand: menselijke review van de
recital-map (complete=false) — de nieuwe instrumenten zijn geseed met lege,
ongereviewde entries.
