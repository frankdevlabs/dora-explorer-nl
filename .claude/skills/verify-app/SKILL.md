---
name: verify-app
description: Verify the app end-to-end on this VPS - build, curl smoke checks, and optional Playwright browser checks (search palette, deep links, mobile nav, dark mode, document tab strip). Use after parser/data/UI changes or before pushing.
---

# Verify the app

**Expectations in this skill are living.** Page counts, parse counts and the
check list change with nearly every epic. Update them in the same commit as
the feature; a mismatch usually means this skill is stale, not that the app
is broken — check `git log` before debugging.

> **Epic-11 state:** full app, 13 instruments (DORA + 12 level-2 acts;
> **563 exported HTML pages**, +31 playbook). Verify chain: verify-data
> (563 refs, 1031 search docs), verify-assessment (entity 18/57, supplier
> 11/48), verify-playbook (draft mode: dekking 20/654, 5 stappen,
> criticaliteit-pilot compleet), verify-roi (15 templates / 98 kolommen),
> verify-recital-map (359 pairs, two-regime, all drafted, human review
> open), verify-l2-map (26 links), verify-search (32 golden queries).

## 1. Build (includes data verification)

```bash
cd ~/dora-explorer-nl && npm run build
```

Must end green: `parse` logs counts, `verify` prints
`verify-data: all assertions passed`, `verify-assessment: all assertions
passed` and the search line, `next build` exports the static pages.

## 2. Dev server + curl smoke checks

Reuse the existing tmux session if present:

```bash
tmux list-sessions | grep dora-dev \
  || tmux new-session -d -s dora-dev 'cd ~/dora-explorer-nl && npm run dev -- -p 3107'
```

```bash
PORT=3107
curl -s "http://localhost:$PORT/" | grep -c "DORA"                        # >= 1
curl -s "http://localhost:$PORT/artikel/28" | grep -c "informatieregister" # >= 1
curl -s "http://localhost:$PORT/artikel/3"  | grep -c 'id="punt-22"'       # 1 (CIF-definitie)
curl -s "http://localhost:$PORT/artikel/26" | grep -c "penetratietest"     # >= 1
curl -s "http://localhost:$PORT/overweging/106" | grep -c "Overweging 106" # >= 1
curl -s "http://localhost:$PORT/search-docs.json" | head -c 100            # JSON array
curl -s "http://localhost:$PORT/its-register/bijlage/i" | grep -c "B_05.01.0010"    # >= 1 (RoI-kolomcodes)
curl -s "http://localhost:$PORT/its-register/bijlage/iii" | grep -c "S19"           # >= 1 (taxonomie)
curl -s "http://localhost:$PORT/rts-onderaanneming/artikel/3" | grep -c "due diligence" # >= 1
curl -s "http://localhost:$PORT/artikel/28" | grep -c "Uitvoeringsbepalingen" # >= 1 (l2-paneel)
curl -s "http://localhost:$PORT/rts-onderaanneming/artikel/3" | grep -c "Grondslag in DORA" # >= 1
# epic 10: the new level-2 acts
curl -s "http://localhost:$PORT/rts-risicobeheer/artikel/22" | grep -c "2024/1772"  # >= 1 (corrigendum-ref)
curl -s "http://localhost:$PORT/its-incidentrapportage/bijlage/i" | grep -c "Gegevensveld" # >= 1 (meldtemplate)
curl -s "http://localhost:$PORT/rts-tlpt/bijlage/viii" | grep -c "attest"           # >= 1
curl -s "http://localhost:$PORT/artikel/18" | grep -c "Classificatie-RTS"           # >= 1 (l2-paneel)
# epic 11: playbook + dekkingsregister. NB: grep needles must not span JSX
# interpolations — SSG emits "Fase <!-- -->0", so "Fase 0" never matches.
curl -s "http://localhost:$PORT/playbook" | grep -c "Dekkingsregister"              # >= 1
curl -s "http://localhost:$PORT/playbook/aanbieder/f1" | grep -c "stap 1-zelftoets" # >= 1 (pilot-stappen)
curl -s "http://localhost:$PORT/playbook/dekking/criticaliteit" | grep -c "pa.p2"   # >= 1 (steplinks)
curl -s "http://localhost:$PORT/playbook/dekking/dora" | grep -c "nog niet gedekt"  # >= 1 (tot dekking compleet)
```

## 3. Browser checks (Playwright, optional but thorough)

Search is client-only, so curl can't test it. Playwright runs directly on
this VPS via law-tracker's install — no npm install needed:

```bash
cd "$SCRATCH"   # your session scratchpad
ln -sfn ~/law-tracker/lib/node_modules node_modules
```

Write `e2e.mjs` (run with
`LD_LIBRARY_PATH=~/law-tracker/lib/chromium-sys-libs node e2e.mjs`):

```js
import { chromium } from "playwright";
const BASE = "http://localhost:3107";
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

// 1. palette search navigates to a deep link (art 28 = informatieregister)
await page.goto(BASE);
// click the header button rather than Ctrl+K: hydration timing makes the
// keyboard shortcut flaky in dev
await page.getByRole("button", { name: /zoeken/i }).click();
await page.getByPlaceholder(/zoek/i).fill("informatieregister handhaven");
await page.waitForTimeout(600);
await page.keyboard.press("Enter");
await page.waitForURL(/artikel\//);

// 2. deep link target visible (art 28 lid 3: informatieregister)
await page.goto(`${BASE}/artikel/28#lid-3`);
if (!(await page.locator("#lid-3").isVisible())) throw new Error("deep link not visible");

// 3. search page renders highlights
await page.goto(`${BASE}/zoeken?q=risicobeheer`);
await page.waitForSelector("mark");

// 4. mobile drawer
await page.setViewportSize({ width: 390, height: 800 });
await page.goto(BASE + "/artikel/9");
await page.getByRole("button", { name: "Menu openen" }).click();
await page.locator('[role="dialog"]').getByRole("link", { name: /Art\. 10/ }).waitFor();
await page.keyboard.press("Escape");

// 5. dark mode
await page.setViewportSize({ width: 1280, height: 900 });
await page.getByRole("button", { name: /thema/i }).click();
if (!(await page.locator("html.dark").count())) throw new Error("dark mode");

// 6. 360px: no horizontal overflow — ITS annex template tables are the
// stressor (they scroll inside their own overflow-x-auto wrapper)
await page.setViewportSize({ width: 360, height: 800 });
for (const path of ["/artikel/13", "/its-register/bijlage/i", "/its-incidentrapportage/bijlage/ii"]) {
  await page.goto(BASE + path);
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 0) throw new Error(`horizontal overflow ${overflow}px @360px on ${path}`);
}

// 6b. cross-instrument ref: RTS art 4 links into DORA art 30(3)(c)
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${BASE}/rts-onderaanneming/artikel/4`);
const x = page.locator('article a[href="/artikel/30#lid-3-c"]').first();
await x.waitFor();
await x.click();
await page.waitForURL(/\/artikel\/30/);

// 7. tab strip: visiting documents adds tabs; storage key dora-tabs, v1
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${BASE}/artikel/6`);
await page.evaluate(() => localStorage.removeItem("dora-tabs"));
await page.goto(`${BASE}/artikel/6`);
await page.goto(`${BASE}/overweging/14`);
const strip = page.locator('nav[aria-label="Geopende documenten"]');
await strip.locator('a[href="/overweging/14"]').waitFor();
if ((await strip.locator("a").count()) !== 2) throw new Error("expected 2 tabs");
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("dora-tabs")));
if (stored.v !== 1 || stored.tabs.length !== 2) throw new Error("dora-tabs bad shape");

// 8. playbook (epic 11): step anchors, cross-fase afhankelijkVan-links,
// corpus ref deep links, dekkingsregister row counts (criticaliteit 20,
// dora 267) and 360px overflow on /playbook/dekking/dora — see the epic-11
// run's e2e-playbook.mjs for the full block
await page.goto(`${BASE}/playbook/aanbieder/f1`);
if (!(await page.locator("#pa\\.p2").isVisible())) throw new Error("step anchor");
await page.goto(`${BASE}/playbook/dekking/criticaliteit`);
if ((await page.locator("tbody tr").count()) !== 20) throw new Error("dekking rows");

await browser.close();
if (errors.length) throw new Error("console errors: " + errors.join("; "));
console.log("e2e ok");
```
