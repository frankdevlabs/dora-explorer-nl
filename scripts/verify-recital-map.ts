/**
 * Recital-map gate (epic 9): two-regime verify keyed on source
 * meta.complete. Structural checks always run (keysets, ref resolution,
 * generated == independent re-derivation, inverse consistency); once
 * curation is complete, EXPECTED must be pinned and every recital
 * human-reviewed. Same pattern as verify-roi/verify-amendments.
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INSTRUMENT_IDS } from "../src/lib/instruments";
import type { Article, Recital, RecitalMapGenerated, RecitalMapSource } from "../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf-8"));

const source = load<RecitalMapSource>("data/source/recital-article-map.json");
const generated = load<RecitalMapGenerated>("data/generated/recital-map.json");

/**
 * Pin these before flipping meta.complete to true: the exact pair count and
 * 2-3 hand-checked byRecital spot mappings (composite keys).
 */
const EXPECTED: { pairCount: number | null; spot: Record<string, string[]> | null } = {
  pairCount: null,
  spot: null,
};

// ------------------------------------------------- structural (always)

const validArticles = new Set<string>();
for (const inst of INSTRUMENT_IDS) {
  for (const a of load<Article[]>(`data/generated/${inst}/articles.json`)) {
    validArticles.add(`${inst}:${a.number}`);
  }
}

const wantByRecital = new Map<string, Set<string>>();
const wantByArticle = new Map<string, Set<string>>();
let wantPairs = 0;
let wantReviewed = 0;
let recitalTotal = 0;

for (const inst of INSTRUMENT_IDS) {
  const recitals = load<Recital[]>(`data/generated/${inst}/recitals.json`);
  recitalTotal += recitals.length;
  const expectedKeys = recitals.map((r) => String(r.number));
  const keys = Object.keys(source[inst]).sort((a, b) => Number(a) - Number(b));
  assert.deepEqual(keys, expectedKeys, `${inst}: keyset moet exact de overwegingen 1-${recitals.length} zijn`);

  for (const [num, entry] of Object.entries(source[inst])) {
    assert.equal(typeof entry.reviewed, "boolean", `${inst} ${num}: reviewed boolean`);
    if (entry.reviewed) wantReviewed += 1;
    const seen = new Set<string>();
    for (const value of entry.articles) {
      const key = value.includes(":") ? value : `${inst}:${value}`;
      assert.ok(validArticles.has(key), `${inst} recital ${num}: onbekend artikel ${value}`);
      assert.ok(!seen.has(key), `${inst} recital ${num}: dubbel artikel ${value}`);
      seen.add(key);
      const recitalKey = `${inst}:${num}`;
      (wantByRecital.get(recitalKey) ?? wantByRecital.set(recitalKey, new Set()).get(recitalKey)!).add(key);
      (wantByArticle.get(key) ?? wantByArticle.set(key, new Set()).get(key)!).add(recitalKey);
      wantPairs += 1;
    }
  }
}

// generated == independent re-derivation (as sets; order is build's concern)
assert.equal(Object.keys(generated.byRecital).length, wantByRecital.size, "byRecital: aantal entries");
for (const [k, want] of wantByRecital) {
  assert.deepEqual(new Set(generated.byRecital[k] ?? []), want, `byRecital[${k}]`);
}
assert.equal(Object.keys(generated.byArticle).length, wantByArticle.size, "byArticle: aantal entries");
for (const [k, want] of wantByArticle) {
  assert.deepEqual(new Set(generated.byArticle[k] ?? []), want, `byArticle[${k}]`);
}
assert.equal(generated.meta.pairCount, wantPairs, "meta.pairCount");
assert.equal(generated.meta.reviewedCount, wantReviewed, "meta.reviewedCount");
assert.equal(generated.meta.complete, source.meta.complete, "meta.complete spiegelt de bron");

// inverse consistency of the generated file itself; no empty entries
for (const [k, list] of Object.entries(generated.byRecital)) {
  assert.ok(list.length > 0, `byRecital[${k}] leeg — had weggelaten moeten zijn`);
  for (const a of list) assert.ok(generated.byArticle[a]?.includes(k), `inverse: ${k} → ${a}`);
}
for (const [a, list] of Object.entries(generated.byArticle)) {
  assert.ok(list.length > 0, `byArticle[${a}] leeg`);
  for (const k of list) assert.ok(generated.byRecital[k]?.includes(a), `inverse: ${a} → ${k}`);
}

// ------------------------------------------------- strict (complete only)

if (source.meta.complete) {
  assert.ok(
    EXPECTED.pairCount !== null && EXPECTED.spot !== null,
    "meta.complete=true vereist gepinde EXPECTED-waarden in dit script",
  );
  assert.equal(wantReviewed, recitalTotal, `alle ${recitalTotal} overwegingen moeten reviewed zijn`);
  assert.equal(wantPairs, EXPECTED.pairCount, "pairCount drifted");
  for (const [k, want] of Object.entries(EXPECTED.spot!)) {
    assert.deepEqual(generated.byRecital[k], want, `spot-check ${k}`);
  }
}

console.log(
  `verify-recital-map: all assertions passed (${wantPairs} pairs, reviewed ${wantReviewed}/${recitalTotal}, complete=${source.meta.complete})`,
);
