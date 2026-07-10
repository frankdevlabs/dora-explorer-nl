/**
 * Curated query-expansion groups (statutory vocabulary only). Terms in one
 * group are treated as interchangeable at query time: a query term pulls in
 * its group members as extra OR-terms, and a document matching any member
 * counts as covering the original term (see searchDocs coverage re-rank).
 *
 * Invariants, enforced by scripts/verify-search.ts:
 *  - every term is its own normalizeTerm fixpoint (lowercase, no diacritics,
 *    no stopwords, >= 2 chars);
 *  - no term appears in two groups;
 *  - every term matches at least one corpus doc under precision options.
 * Single tokens only — multi-word entries would be re-tokenized by MiniSearch.
 */
export const SYNONYM_GROUPS: string[][] = [
  ["informatieregister", "register"],
  ["uitbesteding", "uitbesteden", "onderaannemer", "onderaannemers", "onderaanneming"],
  ["incident", "incidenten"],
  ["cyberdreiging", "cyberdreigingen", "dreiging", "dreigingen"],
  ["penetratietests", "penetratietest", "tlpt"],
  ["weerbaarheid", "veerkracht"],
  ["exitstrategie", "exitstrategieen", "exit"],
  ["kritieke", "kritiek", "belangrijke"],
  ["toeleveringsketen", "keten", "ranking"],
  ["melding", "meldingen", "rapportage"],
];

/** term → the other members of its group. */
export const SYNONYMS: Map<string, string[]> = new Map(
  SYNONYM_GROUPS.flatMap((group) =>
    group.map((term) => [term, group.filter((t) => t !== term)] as const),
  ),
);
