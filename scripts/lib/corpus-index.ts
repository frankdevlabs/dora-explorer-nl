/**
 * Shared corpus index for verify scripts: per-instrument anchor/annex/recital
 * sets built from data/generated/, plus the ref-href checker used to validate
 * curated deep links (questionnaires, playbooks). Extracted verbatim from
 * verify-assessment.ts (epic 11) — keep assert messages stable.
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INSTRUMENT_IDS, splitRoutePath } from "../../src/lib/instruments";
import type { Annex, Article, ContentNode, Recital } from "../../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const load = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf-8"));

export interface CorpusIndex {
  articleAnchors: Map<string, Set<string>>;
  annexRomans: Set<string>;
  recitalNumbers: Set<number>;
}

export function collectAnchors(nodes: ContentNode[], into: Set<string>): void {
  for (const n of nodes) {
    if (n.type !== "list") continue;
    for (const item of n.items) {
      if (item.anchor) into.add(item.anchor);
      collectAnchors(item.content, into);
    }
  }
}

function indexInstrument(inst: string): CorpusIndex {
  const articles = load<Article[]>(`data/generated/${inst}/articles.json`);
  const annexes = load<Annex[]>(`data/generated/${inst}/annexes.json`);
  const recitals = load<Recital[]>(`data/generated/${inst}/recitals.json`);
  const articleAnchors = new Map<string, Set<string>>();
  for (const a of articles) {
    const anchors = new Set<string>();
    for (const p of a.paragraphs) {
      anchors.add(p.anchor);
      collectAnchors(p.content, anchors);
    }
    articleAnchors.set(String(a.number), anchors);
  }
  return {
    articleAnchors,
    annexRomans: new Set(annexes.map((a) => a.roman.toLowerCase())),
    recitalNumbers: new Set(recitals.map((r) => r.number)),
  };
}

export function buildCorpusIndex(): Record<string, CorpusIndex> {
  return Object.fromEntries(
    INSTRUMENT_IDS.map((id) => [id, indexInstrument(id)]),
  ) as Record<string, CorpusIndex>;
}

export function makeCheckRef(corpus: Record<string, CorpusIndex>) {
  return function checkRef(owner: string, href: string): void {
    const [pathWithQuery, fragment] = href.split("#");
    const path = pathWithQuery.split("?")[0];
    const { instrument, rest } = splitRoutePath(path);
    // satellite index pages the questionnaire may link to (no fragments)
    if (instrument !== "dora" && rest === "/") {
      assert.ok(!fragment, `${owner}: geen fragmenten op indexpagina's (${href})`);
      return;
    }
    const m = rest.match(/^\/(artikel|overweging|bijlage)\/([a-z0-9]+)$/);
    assert.ok(m, `${owner}: onbekend ref-pad ${href}`);
    const inst = corpus[instrument];
    const [, kind, key] = m!;
    if (kind === "artikel") {
      const anchors = inst.articleAnchors.get(key);
      assert.ok(anchors, `${owner}: artikel ${href} bestaat niet`);
      if (fragment) assert.ok(anchors!.has(fragment), `${owner}: anchor ${href}`);
    } else if (kind === "bijlage") {
      assert.ok(inst.annexRomans.has(key), `${owner}: bijlage ${href} bestaat niet`);
      assert.ok(!fragment, `${owner}: geen fragmenten op bijlagen (${href})`);
    } else {
      assert.ok(inst.recitalNumbers.has(Number(key)), `${owner}: overweging ${href} bestaat niet`);
    }
  };
}
