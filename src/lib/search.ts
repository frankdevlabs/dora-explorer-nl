import type MiniSearch from "minisearch";
import type { SearchDoc } from "./types";
import { createSearchIndex } from "./search-core";

export type { SearchDoc };
export type { SearchHit } from "./search-core";
export { searchDocs, makeSnippet } from "./search-core";

let indexPromise: Promise<MiniSearch<SearchDoc>> | null = null;

async function buildIndex(): Promise<MiniSearch<SearchDoc>> {
  const res = await fetch("/search-docs.json");
  if (!res.ok) throw new Error(`search-docs.json: HTTP ${res.status}`);
  const docs: SearchDoc[] = await res.json();
  return createSearchIndex(docs);
}

/** Lazily built singleton; first call fetches the corpus and indexes it. */
export function getSearchIndex(): Promise<MiniSearch<SearchDoc>> {
  indexPromise ??= buildIndex().catch((e) => {
    indexPromise = null;
    throw e;
  });
  return indexPromise;
}
