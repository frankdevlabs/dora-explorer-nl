# Epic 0 — Repo bootstrap & port skeleton

**Status**: done (July 2026). Build green on the AI Act placeholder corpus
(113/180/13, 561 refs, ~322 pages); all omnibus/amendment/recital-map layers
removed; identifiers swept to `dora-*`; dev on port 3107.
**Goal**: `~/dora-explorer-nl` builds and serves a working shell: the
ai-act-explorer-nl codebase minus the amendment layer, editorial pages and
recital map, rebranded for DORA (Verordening (EU) 2022/2554), ready for the
multi-instrument corpus (epic 1).

## Design decisions

**Copy, not fork.** Fresh git history; the AI Act repo stays the reference
implementation (`~/ai-act-explorer-nl`, esp. `docs/PORTING.md`).

**Keep the placeholder corpus.** `data/source/aiact_nl*.html`,
`data/generated/*` and the AI Act questionnaire stay in place so
`parse → verify → next build` remains a working gate throughout the port;
epic 1 swaps the corpus, epics 5–8 swap the assessment/register content.
Documented in AGENTS.md "Temporary state".

**Drop the amendment layer wholesale.** DORA has no pending amendment to
track. Removed: `parse-amendments.ts`, `verify-amendments.ts`,
`data/source/amendments/`, `amendments.json`/`amendment-diffs.json`,
`public/amendment-search-docs.json`, `/wijzigingen`, `AmendedArticleView`,
`DiffArticleBody`, `DiffSegments`, `omnibus-pref.ts`, all omnibus badges/
props/types, `flattenWithBreaks`. If the EU later amends DORA, the aiact
amendment layer is the ready-made pattern to re-import.

**Drop the recital-map and AI-Act editorial pages.** `build-recital-map.ts`,
`verify-recital-map.ts`, curated map, `RelatedRecitals`,
`/gpai-praktijkcode`, `/conformiteitsbeoordeling`, `/transparantie-art50`.
The recital-map *mechanism* can return post-launch (epic 9).

**Temporary verify allowance.** The placeholder questionnaire still links to
omnibus-inserted articles (`/artikel/4bis` …); `verify-assessment.ts` accepts
that pattern with a `TODO(epic-5)` marker instead of resurrecting amendment
data.

## Files

Modified (main): `package.json` (name, pruned scripts), `AGENTS.md`,
`README.md`, `src/lib/{data,types,search,flatten,tabs}.ts`,
`src/lib/assessment/{types,engine,store}.ts`, `src/app/{page,layout}.tsx`,
`src/app/{artikel,overweging,bijlage}/[nummer]/page.tsx`,
`src/app/bijlagen/page.tsx`, `src/components/layout/{Header,SidebarToc,
MobileNav}.tsx`, `src/components/assessment/{Wizard,Outcome,shared}.tsx`,
`scripts/{verify-assessment,verify-search,deploy-site.sh}`,
`.claude/skills/verify-app/SKILL.md`, `docs/ARCHITECTURE.md` (banner).
Storage keys/events renamed: `aiact-tabs`→`dora-tabs`,
`aiact-assessments`→`dora-assessments`, `aiact:*`→`dora:*`,
`OPEN_*_EVENT` → `dora:open-*`.

## Verification

`npm run build` green end-to-end; grep sweep for
`2024/1689|02024R1689|aiact|aia.mrfrank.dev` clean outside the placeholder
questionnaire/assessment content, `scripts/parse-aiact.ts` (replaced in
epic 1) and the crossrefs self-form (replaced in epic 2); rendered-page spot
check on `/`, header, sidebar.

## Risks

- Placeholder content shows AI-Act text under DORA branding until epic 1 —
  acceptable: the site is not deployed until epic 4.
- `mcp/` still references the aiact corpus API (`getAmendments` was removed)
  and does not compile — it has its own tsconfig, is not part of
  `npm run build`, and is rewritten in epic 4.
