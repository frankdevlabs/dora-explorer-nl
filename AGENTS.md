<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
# DORA Explorer NL — operating manual

Static Next.js explorer for the Dutch text of DORA (Verordening (EU)
2022/2554) plus its Register-of-Information ITS (Uitvoeringsverordening (EU)
2024/2956) and subcontracting RTS (Gedelegeerde Verordening (EU) 2025/532).
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

Three instruments, one corpus (epic 1):

| id | Instrument | Routes |
|---|---|---|
| `dora` | Verordening (EU) 2022/2554 | `/artikel/28`, `/overweging/5` (unprefixed) |
| `its` | Uitvoeringsverordening (EU) 2024/2956 (RoI-ITS) | `/its-register/artikel/2`, `/its-register/bijlage/i` |
| `rts` | Gedelegeerde Verordening (EU) 2025/532 (onderaanneming) | `/rts-onderaanneming/artikel/3` |

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

## State (epics 0-8 done)

Alles uit het initiële plan is gebouwd: corpus, crossrefs, UI, MCP, beide
assessments, de registerwerkbank (`/register`, schema afgeleid via
`scripts/build-roi-schema.ts`) en de exports. Site en MCP zijn live
op https://dora.mrfrank.dev. Openstaand: alleen de optionele epic 9
(recital-map, DORA↔ITS/RTS-panelen).
