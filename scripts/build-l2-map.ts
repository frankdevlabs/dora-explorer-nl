/**
 * Build the DORA↔level-2 map (epic 9) from the curated source
 * data/source/l2-map.json (editorial-metadata carve-out, AGENTS.md rule 2b):
 * which ITS/RTS provisions implement which DORA article. Validates every
 * target against the parsed corpus and emits the forward (DORA article →
 * implementing provisions, with hrefs) and inverse (ITS/RTS article → DORA
 * basis) indexes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INSTRUMENTS, SATELLITE_IDS, type InstrumentId } from "../src/lib/instruments";
import type { Annex, Article, L2MapGenerated, L2MapSource } from "../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf-8"));

const source = load<L2MapSource>("data/source/l2-map.json");

const fail = (msg: string): never => {
  throw new Error(`build-l2-map: ${msg}`);
};

const doraArticles = new Set(
  load<Article[]>("data/generated/dora/articles.json").map((a) => String(a.number)),
);
const l2Articles = new Set<string>();
const l2Annexes = new Set<string>();
for (const inst of SATELLITE_IDS) {
  for (const a of load<Article[]>(`data/generated/${inst}/articles.json`))
    l2Articles.add(`${inst}:${a.number}`);
  for (const a of load<Annex[]>(`data/generated/${inst}/annexes.json`))
    l2Annexes.add(`${inst}:bijlage:${a.roman.toLowerCase()}`);
}

const isSatellite = (id: string): id is InstrumentId =>
  (SATELLITE_IDS as string[]).includes(id);

/** Resolve a target ("<id>" | "<id>:<art>" | "<id>:bijlage:<roman>") to its route. */
function targetHref(target: string): string {
  if (isSatellite(target)) return INSTRUMENTS[target].routePrefix;
  const anx = target.match(/^([a-z]+):bijlage:([a-z]+)$/);
  if (anx && isSatellite(anx[1])) {
    if (!l2Annexes.has(target)) fail(`onbekende bijlage ${target}`);
    return `${INSTRUMENTS[anx[1]].routePrefix}/bijlage/${anx[2]}`;
  }
  const art = target.match(/^([a-z]+):(\d+)$/);
  if (art && isSatellite(art[1])) {
    if (!l2Articles.has(target)) fail(`onbekend artikel ${target}`);
    return `${INSTRUMENTS[art[1]].routePrefix}/artikel/${art[2]}`;
  }
  return fail(`misvormd target ${target}`);
}

const byDora: L2MapGenerated["byDora"] = {};
const byTarget: L2MapGenerated["byTarget"] = {};
const seen = new Set<string>();

for (const link of source.links) {
  if (!doraArticles.has(link.dora)) fail(`onbekend DORA-artikel ${link.dora}`);
  const dupeKey = `${link.dora}|${link.lid ?? ""}|${link.target}`;
  if (seen.has(dupeKey)) fail(`dubbele link ${dupeKey}`);
  seen.add(dupeKey);
  const href = targetHref(link.target);
  (byDora[link.dora] ??= []).push({ target: link.target, lid: link.lid, label: link.label, href });
  // inverse only for concrete article targets (index/annex pages skip)
  if (/^[a-z]+:\d+$/.test(link.target)) {
    (byTarget[link.target] ??= []).push({ dora: link.dora, lid: link.lid, label: link.label });
  }
}
for (const list of Object.values(byTarget)) {
  list.sort((a, b) => Number(a.dora) - Number(b.dora) || (a.lid ?? 0) - (b.lid ?? 0));
}

const generated: L2MapGenerated = {
  meta: { version: source.meta.version, linkCount: source.links.length },
  byDora,
  byTarget,
};

writeFileSync(join(root, "data/generated/l2-map.json"), JSON.stringify(generated, null, 1) + "\n");
console.log(
  `l2-map: ${source.links.length} links, ${Object.keys(byDora).length} DORA-artikelen, ${Object.keys(byTarget).length} L2-artikelen`,
);
