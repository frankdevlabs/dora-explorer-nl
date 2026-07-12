/**
 * Golden-query regression gate over the search pipeline; runs before every
 * build. Asserts that curated queries rank their intended doc first (or
 * within the top N) per surface preset, that the synonym map obeys its
 * invariants, and that ranking is deterministic. When a corpus or ranking
 * change legitimately shifts an expectation, update the entry consciously —
 * never delete it to pass (same protocol as verify-data.ts pins).
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRECISION_SEARCH_OPTIONS,
  TYPEAHEAD_SEARCH_OPTIONS,
  createSearchIndex,
  makeSnippet,
  normalizeTerm,
  searchDocs,
} from "../src/lib/search-core";
import { SYNONYM_GROUPS } from "../src/lib/search-expansion";
import type { SearchDoc } from "../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = (path: string): SearchDoc[] => JSON.parse(readFileSync(join(root, path), "utf-8"));

// same corpus as the MCP server and the browser build
const docs = load("data/generated/search-docs.json");
const index = createSearchIndex(docs);

// ------------------------------------------------- synonym-map invariants

const seen = new Map<string, number>();
SYNONYM_GROUPS.forEach((group, gi) => {
  for (const term of group) {
    assert.equal(normalizeTerm(term), term, `synonym "${term}" is not a normalizeTerm fixpoint`);
    assert.ok(!/\s/.test(term), `synonym "${term}" must be a single token`);
    assert.ok(!seen.has(term), `synonym "${term}" appears in groups ${seen.get(term)} and ${gi}`);
    seen.set(term, gi);
    assert.ok(
      searchDocs(index, term, 1, PRECISION_SEARCH_OPTIONS).length > 0,
      `synonym "${term}" matches no corpus doc — typo or dead vocabulary`,
    );
  }
});

// ------------------------------------------------- golden queries

interface Golden {
  q: string;
  /** Which preset to search with; default precision (the MCP surface). */
  surface?: "mcp" | "site";
  /** Doc id (or id prefix ending in "-") expected at rank 1. */
  top1?: string;
  /** Doc id expected within the first n results. */
  topN?: { id: string; n: number };
  note?: string;
}

const GOLDEN: Golden[] = [
  // reference fast-path pins the named doc regardless of BM25
  { q: "artikel 28 lid 3", top1: "dora-art-28-lid-3" },
  { q: "artikel 28, lid 3", top1: "dora-art-28-lid-3" },
  { q: "overweging 58", top1: "dora-rct-58" },
  { q: "artikel 5", top1: "dora-art-5-", note: "all leden of art 5 float up; any lid first" },
  // instrument-qualified references pin the satellite acts
  { q: "its artikel 2", top1: "its-art-2-" },
  { q: "rts artikel 3 lid 1", top1: "rts-art-3-lid-1" },
  { q: "its bijlage iii", top1: "its-anx-iii-" },
  // domain queries: statutory provision within the top ranks
  { q: "informatieregister handhaven actualiseren", top1: "dora-art-28-lid-3" },
  { q: "kritieke of belangrijke functie definitie", topN: { id: "dora-art-3-inhoud", n: 3 } },
  { q: "dreigingsgestuurde penetratietests", topN: { id: "dora-art-26-lid-2", n: 3 } },
  { q: "exitstrategie", topN: { id: "dora-art-28-lid-8", n: 5 } },
  { q: "ranking toeleveringsketen", top1: "its-art-2-inhoud" },
  { q: "soort ICT-diensten", topN: { id: "its-anx-iii-1", n: 3 } },
  // typeahead surface: typo tolerance (fuzzy) and mid-word prefix
  { q: "informatieregster", surface: "site", top1: "its-anx-i-", note: "fuzzy match still reaches informatieregister docs" },
  // epic 10: the ten level-2 acts — one reference + one domain query each
  { q: "tlpt artikel 3", top1: "tlpt-art-3-" },
  { q: "classificatie artikel 9", top1: "classificatie-art-9-" },
  { q: "risicobeheer artikel 22", top1: "risicobeheer-art-22-" },
  { q: "formulieren bijlage i", top1: "formulieren-anx-i-" },
  { q: "materialiteitsdrempel cliënten tegenpartijen", topN: { id: "classificatie-art-9-lid-1", n: 3 } },
  { q: "eerste kennisgeving vier uur", topN: { id: "rapportage-art-5-lid-1", n: 3 } },
  { q: "oversightvergoedingen berekening omzet", topN: { id: "vergoedingen-art-2-lid-1", n: 5 } },
  { q: "gezamenlijk onderzoeksteam samenstelling", topN: { id: "onderzoeksteams-art-2-lid-2", n: 5 } },
  { q: "mate van substitueerbaarheid", topN: { id: "criticaliteit-art-5-lid-1", n: 5 } },
  { q: "scoping-document", topN: { id: "tlpt-anx-ii-punt-1", n: 5 } },
  { q: "beleid contractuele overeenkomsten inhoud", topN: { id: "contractbeleid-art-8-lid-3", n: 5 } },
  { q: "aanbevelingen lead overseer beoordeling", topN: { id: "oversight-art-6-lid-1", n: 5 } },
];

for (const g of GOLDEN) {
  const opts = g.surface === "site" ? TYPEAHEAD_SEARCH_OPTIONS : PRECISION_SEARCH_OPTIONS;
  const n = Math.max(10, g.topN?.n ?? 0);
  const ids = searchDocs(index, g.q, n, opts).map((h) => String(h.id));
  const label = `"${g.q}" [${g.surface ?? "mcp"}] → ${ids.slice(0, 5).join(", ")}`;
  if (g.top1) {
    const ok = g.top1.endsWith("-") ? ids[0]?.startsWith(g.top1) : ids[0] === g.top1;
    assert.ok(ok, `${label} — expected ${g.top1} first`);
  }
  if (g.topN) {
    assert.ok(
      ids.slice(0, g.topN.n).includes(g.topN.id),
      `${label} — expected ${g.topN.id} in top ${g.topN.n}`,
    );
  }
  // determinism: identical id sequence on a second run
  const again = searchDocs(index, g.q, n, opts).map((h) => String(h.id));
  assert.deepEqual(again, ids, `"${g.q}" not deterministic`);
}

// ------------------------------------------------- snippet regression

const reg = searchDocs(index, "informatieregister handhaven actualiseren", 1, PRECISION_SEARCH_OPTIONS)[0];
assert.ok(
  makeSnippet(reg.text, reg.terms, 200).includes("informatieregister"),
  "snippet for the register query must show the register region",
);

console.log(`verify-search: ${GOLDEN.length} golden queries + synonym invariants passed`);
