---
name: verify-app
description: Verify the app end-to-end on this VPS - build, curl smoke checks, and optional Playwright browser checks (search palette, deep links, mobile nav, dark mode, document tab strip). Use after parser/data/UI changes or before pushing.
---

# Verify the app

**Expectations in this skill are living.** Page counts, parse counts and the
check list change with nearly every epic. Update them in the same commit as
the feature; a mismatch usually means this skill is stale, not that the app
is broken — check `git log` before debugging.

> **Epic-1 state:** the DORA corpus is live (dora 64 art / 106 rct; its 7
> art / 15 rct / 4 anx; rts 7 art / 13 rct; 181 static pages, DORA routes
> only). /its + /rts pages land in epic 3; re-pin the page count then.

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
# TODO(epic-3): /its/bijlage/i → grep B_01.01; /rts/artikel/3 → due diligence
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
await page.keyboard.press("Control+k");
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

// 6. narrow viewport: no horizontal overflow (re-test on ITS annex tables
// after epic 1/3 — wide template tables are the stressor)
await page.setViewportSize({ width: 360, height: 800 });
await page.goto(`${BASE}/artikel/13`);
await page.waitForTimeout(300);
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
if (overflow > 0) throw new Error(`horizontal overflow ${overflow}px @360px`);

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

await browser.close();
if (errors.length) throw new Error("console errors: " + errors.join("; "));
console.log("e2e ok");
```
