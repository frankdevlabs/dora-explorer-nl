import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Annex, Article, Recital, SearchDoc, Toc } from "../../src/lib/types.js";
import { INSTRUMENTS, INSTRUMENT_IDS, type InstrumentId } from "../../src/lib/instruments.js";
import { createSearchIndex } from "../../src/lib/search-core.js";

// Compiled file lives at mcp/dist/mcp/src/data.js → repo root is 4 levels up.
const REPO_ROOT = resolve(__dirname, "../../../..");
const DATA_DIR = process.env.DORA_DATA_DIR ?? join(REPO_ROOT, "data/generated");

export const BASE_URL = (process.env.BASE_URL ?? "https://dora.mrfrank.dev").replace(/\/$/, "");

function load<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export interface Corpus {
  articles: Article[];
  recitals: Recital[];
  annexes: Annex[];
  toc: Toc;
}

export const corpora: Record<InstrumentId, Corpus> = Object.fromEntries(
  INSTRUMENT_IDS.map((id) => [
    id,
    {
      articles: load<Article[]>(join(DATA_DIR, id, "articles.json")),
      recitals: load<Recital[]>(join(DATA_DIR, id, "recitals.json")),
      annexes: load<Annex[]>(join(DATA_DIR, id, "annexes.json")),
      toc: load<Toc>(join(DATA_DIR, id, "toc.json")),
    },
  ]),
) as Record<InstrumentId, Corpus>;

export const index = createSearchIndex(load<SearchDoc[]>(join(DATA_DIR, "search-docs.json")));

export { INSTRUMENTS, INSTRUMENT_IDS, type InstrumentId };

export function getArticle(nummer: number, instrument: InstrumentId): Article | undefined {
  return corpora[instrument].articles.find((a) => a.number === nummer);
}

export function getRecital(nummer: number, instrument: InstrumentId): Recital | undefined {
  return corpora[instrument].recitals.find((r) => r.number === nummer);
}

export function getAnnex(roman: string, instrument: InstrumentId): Annex | undefined {
  return corpora[instrument].annexes.find(
    (a) => a.roman.toLowerCase() === roman.toLowerCase(),
  );
}

/** "Artikel 6" / " 6 " → "6". */
export function normalizeArticleInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^artikel\s*/, "")
    .replace(/[\s\-–]+/g, "");
}
