/**
 * L2-map gate (epic 9): pins + integrity for the curated DORA↔ITS/RTS map.
 * The map is small and hand-curated in one pass, so this runs in the strict
 * regime from day one (exact link count + spot checks).
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { splitRoutePath } from "../src/lib/instruments";
import type { L2MapGenerated, L2MapSource } from "../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf-8"));

const source = load<L2MapSource>("data/source/l2-map.json");
const generated = load<L2MapGenerated>("data/generated/l2-map.json");

// pinned 2026-07 (initial curation); 15→16→21 epic 10 (index links for
// criticaliteit, vergoedingen, onderzoeksteams, classificatie,
// contractbeleid, rapportage)
assert.equal(source.links.length, 21, "l2-map: linkCount drifted");
assert.equal(generated.meta.linkCount, source.links.length, "l2-map: meta.linkCount");

// every source link appears in byDora with a resolvable-looking href
for (const link of source.links) {
  const hit = (generated.byDora[link.dora] ?? []).find(
    (l) => l.target === link.target && l.label === link.label,
  );
  assert.ok(hit, `l2-map: link ${link.dora} → ${link.target} ontbreekt in byDora`);
  const { instrument, rest } = splitRoutePath(hit!.href);
  assert.ok(
    instrument !== "dora" && /^(\/|\/artikel\/\d+|\/bijlage\/[a-z]+)$/.test(rest),
    `l2-map: onverwachte href ${hit!.href}`,
  );
}

// inverse covers exactly the concrete article targets
const wantTargets = new Set(
  source.links.map((l) => l.target).filter((t) => /^[a-z]+:\d+$/.test(t)),
);
assert.deepEqual(new Set(Object.keys(generated.byTarget)), wantTargets, "l2-map: byTarget-keyset");
for (const [target, list] of Object.entries(generated.byTarget)) {
  for (const basis of list) {
    assert.ok(
      source.links.some((l) => l.target === target && l.dora === basis.dora),
      `l2-map: inverse ${target} → dora ${basis.dora} zonder bronlink`,
    );
  }
}

// spot checks: the two empowerments this corpus exists for
assert.ok(
  (generated.byDora["28"] ?? []).some((l) => l.target === "its"),
  "l2-map: art 28 → RoI-ITS indexlink",
);
assert.ok(
  (generated.byDora["30"] ?? []).some((l) => l.target === "rts"),
  "l2-map: art 30 → RTS indexlink",
);
assert.deepEqual(
  generated.byTarget["rts:3"]?.map((b) => b.dora),
  ["29"],
  "l2-map: rts art 3 grondslag",
);
assert.ok(
  (generated.byDora["31"] ?? []).some((l) => l.target === "criticaliteit"),
  "l2-map: art 31 → criticaliteitscriteria indexlink",
);
for (const [dora, target] of [
  ["43", "vergoedingen"],
  ["41", "onderzoeksteams"],
  ["18", "classificatie"],
  ["28", "contractbeleid"],
  ["20", "rapportage"],
] as const) {
  assert.ok(
    (generated.byDora[dora] ?? []).some((l) => l.target === target),
    `l2-map: art ${dora} → ${target} indexlink`,
  );
}

console.log(`verify-l2-map: all assertions passed (${source.links.length} links)`);
