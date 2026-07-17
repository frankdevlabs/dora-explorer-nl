import type { InstrumentId } from "./instruments";

/**
 * Internal cross-reference: text.slice(start, end) reads as a reference to
 * another part of the regulation ("artikel 6, lid 2"), href is the internal
 * route it resolves to. Offsets index into the owning node's `text`.
 */
export interface RefSpan {
  start: number;
  end: number;
  href: string;
}

export type ContentNode =
  | { type: "text"; text: string; refs?: RefSpan[] }
  | { type: "heading"; text: string }
  | { type: "list"; items: ListItem[] }
  | { type: "table"; rows: string[][] }
  /** Image embedded in the legal text (e.g. the fee formula in GV 2024/1505,
   *  art. 3, lid 2 — published only as a picture). `src` is the data: URI
   *  from the source HTML, passed through untranscribed. */
  | { type: "figure"; src: string; alt: string };

export interface ListItem {
  marker: string;
  content: ContentNode[];
  anchor?: string;
}

export interface Footnote {
  id: string;
  label: string;
  text: string;
}

export interface ArticleParagraph {
  /** Lid number; null for articles whose body has no numbered paragraphs */
  number: number | null;
  anchor: string;
  content: ContentNode[];
}

export interface Article {
  number: number;
  title: string;
  chapter: string;
  chapterTitle: string;
  /** Section (afdeling) roman numeral as displayed ("I", "II"); null when
   *  the article sits directly under its chapter. */
  section: string | null;
  sectionTitle: string | null;
  paragraphs: ArticleParagraph[];
  footnotes: Footnote[];
}

export interface RecitalParagraph {
  text: string;
  refs?: RefSpan[];
}

export interface Recital {
  number: number;
  paragraphs: RecitalParagraph[];
}

export interface Annex {
  roman: string;
  ordinal: number;
  title: string;
  content: ContentNode[];
  footnotes: Footnote[];
}

export interface TocEntry {
  number: number;
  title: string;
}

export interface TocSection {
  /** Roman numeral as displayed ("I", "II"). */
  roman: string;
  title: string;
  articles: TocEntry[];
}

export interface TocChapter {
  roman: string;
  title: string;
  sections: TocSection[];
  articles: TocEntry[];
}

export interface Toc {
  chapters: TocChapter[];
  annexes: { roman: string; title: string }[];
  recitalCount: number;
}

export interface SearchDoc {
  id: string;
  type: "artikel" | "overweging" | "bijlage" | "stap" | "document";
  /** Legal instrument (dora | its | rts | …), the playbook kind
   * (entiteit | aanbieder) for type "stap", or the sentinel "documenten"
   * for type "document". */
  instrument: string;
  ref: string;
  heading: string;
  url: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Recital↔article map (curated editorial layer, epic 9). Multi-instrument:
// per-instrument entry blocks; article values are "28" (own instrument) or
// "dora:28"/"its:2"/"rts:3" (explicit). Generated form uses composite
// "inst:number" keys throughout.

export interface RecitalMapEntry {
  /** Article refs the recital motivates. Empty + reviewed = "none relevant". */
  articles: string[];
  /** False while drafted by the curation skill, true after human review. */
  reviewed: boolean;
  /** Dutch editorial aid; not rendered in v1. */
  note?: string;
}

export type RecitalMapSource = {
  meta: {
    version: number;
    /** False while curation is in progress; verify-recital-map skips
     *  exact-count assertions until flipped. */
    complete: boolean;
  };
} & {
  /** Per instrument, keyed "1".."N" — every recital present, reviewed or not. */
  [inst in InstrumentId]: Record<string, RecitalMapEntry>;
};

export interface RecitalMapGenerated {
  meta: { version: number; complete: boolean; reviewedCount: number; pairCount: number };
  /** "inst:recital" → article keys ("inst:number") in document order. */
  byRecital: Record<string, string[]>;
  /** "inst:article" → recital keys ("inst:number") in document order (inverse). */
  byArticle: Record<string, string[]>;
}

// ---------------------------------------------------------------------------
// DORA↔level-2 map (curated editorial layer, epic 9): which ITS/RTS
// provisions implement which DORA article.

export interface L2Link {
  /** DORA article number ("28"). */
  dora: string;
  /** Optional lid the empowerment/duty sits in (display only). */
  lid?: number;
  /** "its:3" | "rts:4" (article), "its:bijlage:iii", or bare "its"/"rts" (index page). */
  target: string;
  /** Short Dutch description of what the target regulates. */
  label: string;
}

export interface L2MapSource {
  meta: { version: number };
  links: L2Link[];
}

export interface L2MapGenerated {
  meta: { version: number; linkCount: number };
  /** DORA article number → links (source order). */
  byDora: Record<string, { target: string; lid?: number; label: string; href: string }[]>;
  /** "its:3"-style article key → DORA basis articles (unique, ascending). */
  byTarget: Record<string, { dora: string; lid?: number; label: string }[]>;
}
