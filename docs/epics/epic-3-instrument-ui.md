# Epic 3 — Instrument-aware explorer UI

**Status**: done (July 2026). 227 exported HTML pages; Playwright e2e green
(palette → /artikel/28, deep-link highlight, mobile drawer, dark mode,
360px overflow incl. ITS annex tables, cross-instrument link click,
tab strip with mixed-instrument tabs).
**Goal**: the full explorer renders all three instruments — `/its/*` and
`/rts/*` routes, instrument index pages, homepage cards, sidebar links,
instrument badges on search hits.

## Design decisions

**Thin route wrappers around shared satellite views.** DORA keeps its own
page files (chapter breadcrumbs, homepage TOC); ITS/RTS share
`src/components/pages/Instrument{Article,Recital,Annex,Index}.tsx`
parameterized by `InstrumentId` — no chapter machinery, breadcrumb roots at
the instrument index. `generateStaticParams`/`generateMetadata` live in the
route files (`src/app/{its,rts}/…/[nummer]/page.tsx`).

**Instrument index pages** (`/its`, `/rts`): citation title + editorial
blurb (ITS: templates + corrigendum note; RTS: in force 22-7-2025 +
ex-art-5 note), article/annex lists, recital pill grid.

**Homepage**: two instrument cards between the intro and the DORA TOC.
**Sidebar**: RoI-ITS + Onderaannemings-RTS links in the tools block.
**Search**: `instrument` added to MiniSearch storeFields; non-dora hits get
a "RoI-ITS"/"RTS" badge in both the palette and /zoeken.

**Tables** were already rendered by `ContentNodes` inside an
`overflow-x-auto` wrapper — the 360px Playwright check now covers
`/its/bijlage/i` and `/its/bijlage/iii` explicitly.

## Files

New: `src/components/pages/Instrument{Article,Recital,Annex,Index}.tsx`,
`src/app/its/{page,artikel/[nummer]/page,overweging/[nummer]/page,bijlage/[nummer]/page}.tsx`,
`src/app/rts/{page,artikel/[nummer]/page,overweging/[nummer]/page}.tsx`.
Modified: `src/app/page.tsx` (cards), `SidebarToc.tsx`,
`src/lib/search-core.ts` (instrument in storeFields/SearchHit),
`SearchResults.tsx`, `SearchPalette.tsx` (badges + DORA hint text),
`.claude/skills/verify-app/SKILL.md` (227-page pin, ITS checks).

## Verification

Build 227 pages; curl checks per verify-app; Playwright e2e listed above
(the palette is opened via the header button — Ctrl+K is hydration-flaky in
dev).

## Risks

- ITS annex I is one long page (15+ tables); per-template anchors/splitting
  deferred until the RoI tool (epic 7) shows what deep links it needs.
