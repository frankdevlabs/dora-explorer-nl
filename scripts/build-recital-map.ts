/**
 * Build the recital↔article map (epic 9) from the curated source
 * data/source/recital-article-map.json (editorial-metadata carve-out,
 * AGENTS.md rule 2b — interpretive, never alters legal text).
 *
 * Multi-instrument: source entries live in per-instrument blocks; article
 * values are "28" (own instrument) or "dora:28"/"its:2"/"rts:3" (explicit).
 * The generated map normalises everything to composite "inst:number" keys
 * and adds the inverse index. Structural validation throws here; the deeper
 * gate is scripts/verify-recital-map.ts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INSTRUMENT_IDS, type InstrumentId } from "../src/lib/instruments";
import type { Article, Recital, RecitalMapGenerated, RecitalMapSource } from "../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf-8"));

const source = load<RecitalMapSource>("data/source/recital-article-map.json");

const fail = (msg: string): never => {
  throw new Error(`build-recital-map: ${msg}`);
};

// valid article keys per instrument + document order (dora → its → rts)
const validArticles = new Set<string>();
const articleOrder: string[] = [];
for (const inst of INSTRUMENT_IDS) {
  for (const a of load<Article[]>(`data/generated/${inst}/articles.json`)) {
    const key = `${inst}:${a.number}`;
    validArticles.add(key);
    articleOrder.push(key);
  }
}
const orderIndex = new Map(articleOrder.map((k, i) => [k, i]));

/** Normalise a source value ("28" or "dora:28") to a composite key. */
function normalise(inst: InstrumentId, value: string): string {
  return value.includes(":") ? value : `${inst}:${value}`;
}

const byRecital: Record<string, string[]> = {};
const byArticle: Record<string, string[]> = {};
let pairCount = 0;
let reviewedCount = 0;
let recitalTotal = 0;

for (const inst of INSTRUMENT_IDS) {
  const recitals = load<Recital[]>(`data/generated/${inst}/recitals.json`);
  const expected = recitals.map((r) => String(r.number));
  const block = source[inst];
  if (!block) fail(`instrumentblok "${inst}" ontbreekt`);
  const keys = Object.keys(block).sort((a, b) => Number(a) - Number(b));
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    fail(`${inst}: keyset wijkt af van het corpus (${keys.length} vs ${expected.length})`);
  }
  recitalTotal += expected.length;

  for (const [num, entry] of Object.entries(block)) {
    if (typeof entry.reviewed !== "boolean") fail(`${inst} recital ${num}: reviewed niet boolean`);
    if (entry.reviewed) reviewedCount += 1;
    const seen = new Set<string>();
    const normalised: string[] = [];
    for (const value of entry.articles) {
      const key = normalise(inst, value);
      if (!validArticles.has(key)) fail(`${inst} recital ${num}: onbekend artikel ${value}`);
      if (seen.has(key)) fail(`${inst} recital ${num}: dubbel artikel ${value}`);
      seen.add(key);
      normalised.push(key);
    }
    if (normalised.length === 0) continue;
    normalised.sort((a, b) => orderIndex.get(a)! - orderIndex.get(b)!);
    const recitalKey = `${inst}:${num}`;
    byRecital[recitalKey] = normalised;
    for (const key of normalised) {
      (byArticle[key] ??= []).push(recitalKey);
      pairCount += 1;
    }
  }
}

// inverse lists in document order: own-instrument recitals first is implied
// by INSTRUMENT_IDS iteration; within an instrument sort numerically
const recitalOrderIndex = new Map<string, number>();
{
  let i = 0;
  for (const inst of INSTRUMENT_IDS) {
    for (const r of load<Recital[]>(`data/generated/${inst}/recitals.json`)) {
      recitalOrderIndex.set(`${inst}:${r.number}`, i++);
    }
  }
}
for (const list of Object.values(byArticle)) {
  list.sort((a, b) => recitalOrderIndex.get(a)! - recitalOrderIndex.get(b)!);
}

const generated: RecitalMapGenerated = {
  meta: {
    version: source.meta.version,
    complete: source.meta.complete,
    reviewedCount,
    pairCount,
  },
  byRecital,
  byArticle,
};

writeFileSync(
  join(root, "data/generated/recital-map.json"),
  JSON.stringify(generated, null, 1) + "\n",
);

console.log(
  `recital-map: ${pairCount} pairs over ${Object.keys(byRecital).length} recitals / ` +
    `${Object.keys(byArticle).length} articles (reviewed ${reviewedCount}/${recitalTotal}, complete=${source.meta.complete})`,
);
