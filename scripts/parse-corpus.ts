/**
 * Multi-instrument parser -> structured JSON in data/generated/<instrument>/.
 *
 * Three instruments, two EUR-Lex HTML dialects (epic 1):
 *
 * 1. Consolidated dialect (dora + its articles/annexes/TOC):
 *    div.eli-subdivision#art_N > p.title-article-norm + .eli-title
 *    > p.stitle-article-norm; leden as div.norm > span.no-parag ("1.") +
 *    div.norm.inline-element; points as div.grid-container.grid-list
 *    (.grid-list-column-1 = marker, .grid-list-column-2 = content, nesting
 *    recursively); chapters div#cpt_III (+ #cpt_III.sct_I — roman section
 *    ids, unlike the AI Act's numeric ones) with p.title-division-1/2;
 *    annexes div#anx_III with p.title-annex-1/2 and p.title-gr-seq-*
 *    sub-headings; data tables table.borderOj (ITS annexes); footnotes
 *    p.footnote at document end, referenced via <a href="#E0001" id="src.E0001">.
 *
 * 2. New-OJ dialect (all recitals; rts articles — no consolidated version
 *    exists for the RTS): recitals div.eli-subdivision#rct_N with a 2-col
 *    table ("(N)" | text); articles div.eli-subdivision#art_N with
 *    p.oj-ti-art + .eli-title > p.oj-sti-art; leden as div#NNN.MMM whose
 *    first p.oj-normal starts with "N. "; point lists as borderless 2-col
 *    tables (marker | content).
 *
 * Cross-references are annotated in epic 2; this parser emits none yet.
 */
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INSTRUMENTS, splitRoutePath, type InstrumentId } from "../src/lib/instruments";
import { findRefs, type RefContext } from "../src/lib/crossrefs";
import { assignItemAnchors, flattenNodes, markerToSlug } from "../src/lib/flatten";
import type {
  Annex,
  Article,
  ArticleParagraph,
  ContentNode,
  Footnote,
  ListItem,
  Recital,
  RefSpan,
  SearchDoc,
  Toc,
  TocChapter,
} from "../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

interface SourceConfig {
  id: InstrumentId;
  /** Articles/annexes/TOC source + dialect. */
  articles: { file: string; dialect: "consolidated" | "oj" };
  /** Recitals always come from the (new-format) OJ publication. */
  recitals: { file: string };
}

const SOURCES: SourceConfig[] = [
  {
    id: "dora",
    articles: { file: "data/source/dora_nl_consolidated.html", dialect: "consolidated" },
    recitals: { file: "data/source/dora_nl_oj.html" },
  },
  {
    id: "its",
    articles: { file: "data/source/its_nl_consolidated.html", dialect: "consolidated" },
    recitals: { file: "data/source/its_nl_oj.html" },
  },
  {
    id: "rts",
    articles: { file: "data/source/rts_nl_oj.html", dialect: "oj" },
    recitals: { file: "data/source/rts_nl_oj.html" },
  },
  {
    id: "criticaliteit",
    articles: { file: "data/source/criticaliteit_nl_oj.html", dialect: "oj" },
    recitals: { file: "data/source/criticaliteit_nl_oj.html" },
  },
  {
    id: "vergoedingen",
    articles: { file: "data/source/vergoedingen_nl_oj.html", dialect: "oj" },
    recitals: { file: "data/source/vergoedingen_nl_oj.html" },
  },
  {
    id: "onderzoeksteams",
    articles: { file: "data/source/onderzoeksteams_nl_oj.html", dialect: "oj" },
    recitals: { file: "data/source/onderzoeksteams_nl_oj.html" },
  },
  {
    id: "classificatie",
    articles: { file: "data/source/classificatie_nl_oj.html", dialect: "oj" },
    recitals: { file: "data/source/classificatie_nl_oj.html" },
  },
  {
    id: "contractbeleid",
    articles: { file: "data/source/contractbeleid_nl_oj.html", dialect: "oj" },
    recitals: { file: "data/source/contractbeleid_nl_oj.html" },
  },
  {
    id: "rapportage",
    articles: { file: "data/source/rapportage_nl_oj.html", dialect: "oj" },
    recitals: { file: "data/source/rapportage_nl_oj.html" },
  },
  {
    // consolidated (02024R1774-20240625) incorporates the two corrigenda,
    // incl. the art 22(d) fix ("artikel 15" → "artikel 8, lid 2" van GV
    // 2024/1772); recitals from the OJ publication as usual
    id: "risicobeheer",
    articles: { file: "data/source/risicobeheer_nl_consolidated.html", dialect: "consolidated" },
    recitals: { file: "data/source/risicobeheer_nl_oj.html" },
  },
];

const ROMAN_VALUES: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
function romanToInt(roman: string): number {
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const v = ROMAN_VALUES[roman[i]];
    const next = ROMAN_VALUES[roman[i + 1]] ?? 0;
    total += v < next ? -v : v;
  }
  return total;
}

function cleanText(raw: string): string {
  return raw
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .replace(/\(\s+(\*?\d+)\s+\)/g, "($1)") // superscript footnote refs: "( 1 )" -> "(1)"
    .trim();
}

const isTag = (n: unknown): n is Element =>
  typeof n === "object" && n !== null && "tagName" in n && (n as Element).type === "tag";

const isText = (n: unknown): n is { type: "text"; data: string } =>
  typeof n === "object" && n !== null && (n as { type?: string }).type === "text";

// =================================================================
// Consolidated dialect
// =================================================================

const SKIP_P_CLASSES = [
  "footnote",
  "arrow",
  "title-article-norm",
  "title-annex-1",
  "title-annex-2",
  "title-division-1",
  "title-division-2",
];

interface ConsolidatedCtx {
  $: CheerioAPI;
  footnoteTextById: Map<string, string>;
}

/**
 * Convert a container's child nodes into ContentNodes. Handles direct text
 * nodes (div.norm.inline-element often holds bare text), merges consecutive
 * grid-list point blocks into one list node, and turns data tables
 * (table.borderOj, ITS annexes) into table nodes.
 */
function parseBlocks(ctx: ConsolidatedCtx, container: Element, skipLidMarker = false): ContentNode[] {
  return parseNodes(ctx, container.children, skipLidMarker);
}

function parseNodes(ctx: ConsolidatedCtx, children: AnyNode[], skipLidMarker = false): ContentNode[] {
  const { $ } = ctx;
  const nodes: ContentNode[] = [];
  let textBuf = "";
  const flushText = () => {
    const text = cleanText(textBuf);
    textBuf = "";
    if (text) nodes.push({ type: "text", text });
  };

  let lidMarkerSkipped = false;
  for (const child of children) {
    if (isText(child)) {
      textBuf += child.data;
      continue;
    }
    if (!isTag(child)) continue;
    const $child = $(child);
    const cls = $child.attr("class") ?? "";

    if (child.tagName === "span" && cls.includes("no-parag")) {
      // the lid marker handled by the caller is dropped; any other no-parag
      // span stays in the text
      if (skipLidMarker && !lidMarkerSkipped) {
        lidMarkerSkipped = true;
      } else {
        textBuf += $child.text();
      }
      continue;
    }
    if (child.tagName === "a" || child.tagName === "span" || child.tagName === "em") {
      textBuf += $child.text();
      continue;
    }
    flushText();

    if (child.tagName === "p") {
      if (SKIP_P_CLASSES.some((c) => cls.includes(c))) continue;
      if (cls.includes("title-gr-seq")) {
        const text = cleanText($child.text());
        if (text) nodes.push({ type: "heading", text });
        continue;
      }
      const text = cleanText($child.text());
      if (text) nodes.push({ type: "text", text });
    } else if (child.tagName === "table") {
      const rows = parseDataTable($, child);
      if (rows.length > 0) nodes.push({ type: "table", rows });
    } else if (child.tagName === "div") {
      if (cls.includes("eli-title")) continue;
      if (cls.includes("grid-container")) {
        const item = parseGridItem(ctx, child);
        const last = nodes[nodes.length - 1];
        if (last?.type === "list") last.items.push(item);
        else nodes.push({ type: "list", items: [item] });
      } else {
        nodes.push(...parseBlocks(ctx, child));
      }
    }
  }
  flushText();
  return nodes;
}

/** One div.grid-container.grid-list = one list item (marker column + content column). */
function parseGridItem(ctx: ConsolidatedCtx, grid: Element): ListItem {
  const { $ } = ctx;
  const $grid = $(grid);
  const marker = cleanText($grid.children(".grid-list-column-1").first().text());
  const contentCell = $grid.children(".grid-list-column-2").first().get(0);
  return { marker, content: contentCell ? parseBlocks(ctx, contentCell) : [] };
}

/** A data table (ITS annexes: table.borderOj) -> rows of cell text. */
function parseDataTable($: CheerioAPI, table: Element): string[][] {
  const rows: string[][] = [];
  $(table)
    .find("tr")
    .each((_, tr) => {
      const cells = $(tr)
        .children("td, th")
        .toArray()
        .map((td) => cleanText($(td).text()));
      if (cells.some((c) => c !== "")) rows.push(cells);
    });
  return rows;
}

/** All p.footnote elements sit at document end; key them by their E-number. */
function collectFootnotes($: CheerioAPI): Map<string, string> {
  const out = new Map<string, string>();
  $("p.footnote").each((_, p) => {
    const $p = $(p);
    const id = $p.find("a[id]").first().attr("id") ?? "";
    const clone = $p.clone();
    clone.find("a").remove();
    out.set(id, cleanText(clone.text()).replace(/^\(\s*\)\s*/, ""));
  });
  return out;
}

/**
 * Footnotes referenced from within `container` via <a id="src.E...."> markers;
 * the label is the visible superscript ("1", "*4"), matching the body text.
 */
function referencedFootnotes(ctx: ConsolidatedCtx, container: Element): Footnote[] {
  const { $, footnoteTextById } = ctx;
  const out: Footnote[] = [];
  $(container)
    .find('a[id^="src."]')
    .each((_, a) => {
      const target = ($(a).attr("href") ?? "").replace(/^#/, "");
      const text = footnoteTextById.get(target);
      const marker = cleanText($(a).text());
      if (text !== undefined && !out.some((f) => f.id === target)) {
        out.push({ id: target, label: `(${marker})`, text });
      }
    });
  return out;
}

interface ChapterInfo {
  roman: string;
  title: string;
  sections: { roman: string; title: string; el: Element }[];
  el: Element;
}

function parseConsolidated(file: string): {
  articles: Article[];
  annexes: Annex[];
  chapters: ChapterInfo[];
  footnoteCount: number;
} {
  const $ = cheerio.load(readFileSync(join(root, file), "utf-8"));
  const ctx: ConsolidatedCtx = { $, footnoteTextById: collectFootnotes($) };

  const chapters: ChapterInfo[] = [];
  $("div[id]").each((_, el) => {
    const id = $(el).attr("id")!;
    if (!/^cpt_[IVXLC]+$/.test(id)) return;
    const roman = id.slice(4);
    const title = cleanText($(el).find("p.title-division-2").first().text());
    const sections: ChapterInfo["sections"] = [];
    $(el)
      .find("div[id]")
      .each((_, s) => {
        // section ids are roman here (cpt_II.sct_I), numeric in some other acts
        const m = $(s)
          .attr("id")!
          .match(/^cpt_[IVXLC]+\.sct_([IVXLC]+|\d+)$/);
        if (!m) return;
        sections.push({
          roman: m[1],
          title: cleanText($(s).find("p.title-division-2").first().text()),
          el: s,
        });
      });
    chapters.push({ roman, title, sections, el });
  });

  const articles: Article[] = [];
  $("div.eli-subdivision[id]").each((_, el) => {
    const id = $(el).attr("id")!;
    const m = id.match(/^art_(\d+)$/);
    if (!m) return;
    const number = Number(m[1]);
    const title = cleanText(
      $(el).children(".eli-title").find(".stitle-article-norm").first().text(),
    );

    const chapter = chapters.find((c) => $.contains(c.el, el));
    if (chapters.length > 0 && !chapter) throw new Error(`Article ${number}: no containing chapter`);
    const section = chapter?.sections.find((s) => $.contains(s.el, el)) ?? null;

    // Walk direct children in document order. A div.norm with an unquoted "N."
    // no-parag marker starts a new lid; everything else — continuation alineas
    // are SIBLINGS of the lid div in this dialect — is appended to the current
    // lid.
    const entries: { lid: number | null; content: ContentNode[] }[] = [];
    let buffer: AnyNode[] = [];
    const flushBuffer = () => {
      if (buffer.length === 0) return;
      const nodes = parseNodes(ctx, buffer);
      buffer = [];
      if (nodes.length === 0) return;
      if (entries.length === 0) entries.push({ lid: null, content: [] });
      entries[entries.length - 1].content.push(...nodes);
    };
    for (const child of el.children) {
      if (isTag(child)) {
        const $child = $(child);
        const cls = $child.attr("class") ?? "";
        if (child.tagName === "p" && cls.includes("title-article-norm")) continue;
        if (child.tagName === "div" && cls.includes("eli-title")) continue;
        const marker = cleanText($child.children("span.no-parag").first().text());
        if (child.tagName === "div" && cls.includes("norm") && /^\d+\.$/.test(marker)) {
          flushBuffer();
          entries.push({ lid: Number(marker.slice(0, -1)), content: parseBlocks(ctx, child, true) });
          continue;
        }
      }
      buffer.push(child);
    }
    flushBuffer();

    articles.push({
      number,
      title,
      chapter: chapter?.roman ?? "",
      chapterTitle: chapter?.title ?? "",
      section: section?.roman ?? null,
      sectionTitle: section?.title || null, // DORA afdelingen carry no subtitle
      paragraphs: toParagraphs(entries),
      footnotes: referencedFootnotes(ctx, el),
    });
  });
  articles.sort((a, b) => a.number - b.number);

  const annexes: Annex[] = [];
  $("div[id]").each((_, el) => {
    const m = $(el).attr("id")!.match(/^anx_([IVXLC]+)$/);
    if (!m) return;
    const roman = m[1];
    const title = cleanText($(el).find("p.title-annex-2").first().text()) || `Bijlage ${roman}`;
    const content = parseBlocks(ctx, el);
    assignItemAnchors(content, "");
    annexes.push({
      roman,
      ordinal: romanToInt(roman),
      title,
      content,
      footnotes: referencedFootnotes(ctx, el),
    });
  });
  annexes.sort((a, b) => a.ordinal - b.ordinal);

  return { articles, annexes, chapters, footnoteCount: ctx.footnoteTextById.size };
}

/** Shared lid-entry -> anchored paragraph conversion. */
function toParagraphs(entries: { lid: number | null; content: ContentNode[] }[]): ArticleParagraph[] {
  const paragraphs: ArticleParagraph[] = [];
  for (const e of entries) {
    const base =
      e.lid !== null
        ? `lid-${e.lid}`
        : entries.length === 1
          ? "inhoud"
          : `alinea-${paragraphs.length + 1}`;
    let anchor = base;
    for (let n = 2; paragraphs.some((p) => p.anchor === anchor); n++) {
      anchor = `${base}-bis${n > 2 ? `-${n}` : ""}`;
    }
    assignItemAnchors(e.content, e.lid !== null ? anchor : "");
    paragraphs.push({ number: e.lid, anchor, content: e.content });
  }
  return paragraphs;
}

// =================================================================
// New-OJ dialect (recitals for all instruments; articles for the RTS)
// =================================================================

function parseOjRecitals(file: string): Recital[] {
  const $oj = cheerio.load(readFileSync(join(root, file), "utf-8"));
  const recitals: Recital[] = [];
  $oj("div.eli-subdivision[id]").each((_, el) => {
    const m = $oj(el).attr("id")!.match(/^rct_(\d+)$/);
    if (!m) return;
    const cells = $oj(el).find("tr").first().children("td");
    const paragraphs = cells
      .last()
      .children("p")
      .toArray()
      .map((p) => cleanText($oj(p).text()))
      .filter(Boolean)
      .map((text) => ({ text }));
    recitals.push({ number: Number(m[1]), paragraphs });
  });
  recitals.sort((a, b) => a.number - b.number);
  return recitals;
}

/**
 * New-OJ block parser: p.oj-normal prose, borderless 2-col tables as point
 * lists (narrow marker column | content column), consecutive point tables
 * merged into one list node.
 */
function parseOjBlocks($: CheerioAPI, container: Element): ContentNode[] {
  return parseOjNodes($, container.children);
}

function parseOjNodes($: CheerioAPI, children: AnyNode[]): ContentNode[] {
  const nodes: ContentNode[] = [];
  for (const child of children) {
    if (!isTag(child)) continue;
    const $child = $(child);
    const cls = $child.attr("class") ?? "";
    if (child.tagName === "p") {
      if (cls.includes("oj-ti-art") || cls.includes("oj-sti-art")) continue;
      const text = cleanText($child.text());
      if (text) nodes.push({ type: "text", text });
    } else if (child.tagName === "table") {
      const item = parseOjPointTable($, child);
      if (item) {
        const last = nodes[nodes.length - 1];
        if (last?.type === "list") last.items.push(item);
        else nodes.push({ type: "list", items: [item] });
      }
    } else if (child.tagName === "div") {
      if (cls.includes("eli-title")) continue;
      nodes.push(...parseOjBlocks($, child));
    }
  }
  return nodes;
}

/** One borderless 2-col OJ table = one point-list item. */
function parseOjPointTable($: CheerioAPI, table: Element): ListItem | null {
  const tds = $(table).find("tr").first().children("td");
  if (tds.length !== 2) return null;
  const marker = cleanText(tds.first().text());
  const contentCell = tds.last().get(0);
  return contentCell ? { marker, content: parseOjBlocks($, contentCell) } : null;
}

function parseOjArticles(file: string): Article[] {
  const $ = cheerio.load(readFileSync(join(root, file), "utf-8"));
  const articles: Article[] = [];
  $("div.eli-subdivision[id]").each((_, el) => {
    const m = $(el).attr("id")!.match(/^art_(\d+)$/);
    if (!m) return;
    const number = Number(m[1]);
    const title = cleanText($(el).children(".eli-title").find(".oj-sti-art").first().text());

    // Leden live in div wrappers whose id looks like "003.001"; the lid
    // number is the leading "N. " of the first paragraph. Articles without
    // numbered leden have bare p.oj-normal children.
    const entries: { lid: number | null; content: ContentNode[] }[] = [];
    for (const child of el.children) {
      if (!isTag(child)) continue;
      const $child = $(child);
      const cls = $child.attr("class") ?? "";
      if (child.tagName === "p" && cls.includes("oj-ti-art")) continue;
      if (child.tagName === "div" && cls.includes("eli-title")) continue;

      if (child.tagName === "div" && /^\d{3}\.\d{3}$/.test($child.attr("id") ?? "")) {
        const content = parseOjBlocks($, child);
        let lid: number | null = null;
        const first = content[0];
        if (first?.type === "text") {
          const lm = first.text.match(/^(\d+)\.\s+/);
          if (lm) {
            lid = Number(lm[1]);
            first.text = first.text.slice(lm[0].length);
          }
        }
        entries.push({ lid, content });
        continue;
      }
      // bare prose / point tables directly under the article: continuation
      // of the current lid, or an unnumbered body
      const parsed = parseOjNodes($, [child]);
      if (parsed.length === 0) continue;
      if (entries.length > 0) {
        entries[entries.length - 1].content.push(...parsed);
      } else {
        entries.push({ lid: null, content: parsed });
      }
    }

    articles.push({
      number,
      title,
      chapter: "",
      chapterTitle: "",
      section: null,
      sectionTitle: null,
      paragraphs: toParagraphs(entries),
      footnotes: [],
    });
  });
  articles.sort((a, b) => a.number - b.number);
  return articles;
}

// =================================================================
// Phase A: parse every instrument
// =================================================================

interface ParsedInstrument {
  articles: Article[];
  annexes: Annex[];
  chapters: ChapterInfo[];
  recitals: Recital[];
  footnoteCount: number;
}

const parsedById = new Map<InstrumentId, ParsedInstrument>();
for (const src of SOURCES) {
  let articles: Article[];
  let annexes: Annex[] = [];
  let chapters: ChapterInfo[] = [];
  let footnoteCount = 0;
  if (src.articles.dialect === "consolidated") {
    const parsed = parseConsolidated(src.articles.file);
    articles = parsed.articles;
    annexes = parsed.annexes;
    chapters = parsed.chapters;
    footnoteCount = parsed.footnoteCount;
  } else {
    articles = parseOjArticles(src.articles.file);
  }
  const recitals = parseOjRecitals(src.recitals.file);
  parsedById.set(src.id, { articles, annexes, chapters, recitals, footnoteCount });
}

// =================================================================
// Phase B: internal cross-references (epic 2)
//
// Post-pass over the full multi-instrument corpus: detect "artikel 6,
// lid 2"-style references in every text node and attach char-offset
// RefSpans. Every candidate href is validated against the just-built union
// corpus: an unresolvable page target is a grammar bug (throw); a fragment
// whose anchor does not exist — or is not unique — on the target page is
// stripped, leaving the page link.
// =================================================================

/** Anchor ids that occur exactly once on a page (duplicates are unreliable jump targets). */
function uniqueAnchors(ids: string[]): Set<string> {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return new Set([...counts].filter(([, n]) => n === 1).map(([id]) => id));
}

function collectItemAnchors(nodes: ContentNode[], into: string[]): void {
  for (const n of nodes) {
    if (n.type !== "list") continue;
    for (const item of n.items) {
      if (item.anchor) into.push(item.anchor);
      collectItemAnchors(item.content, into);
    }
  }
}

interface ResolvedCorpus {
  articleAnchors: Map<string, Set<string>>;
  annexAnchors: Map<string, Set<string>>;
  chapterRomans: Set<string>;
  recitalNumbers: Set<string>;
}

const resolvers = new Map<InstrumentId, ResolvedCorpus>();
for (const [id, parsed] of parsedById) {
  const articleAnchors = new Map<string, Set<string>>();
  for (const a of parsed.articles) {
    const ids: string[] = [];
    for (const p of a.paragraphs) {
      ids.push(p.anchor);
      collectItemAnchors(p.content, ids);
    }
    articleAnchors.set(String(a.number), uniqueAnchors(ids));
  }
  const annexAnchors = new Map<string, Set<string>>();
  for (const a of parsed.annexes) {
    const ids: string[] = [];
    collectItemAnchors(a.content, ids);
    annexAnchors.set(a.roman.toLowerCase(), uniqueAnchors(ids));
  }
  resolvers.set(id, {
    articleAnchors,
    annexAnchors,
    chapterRomans: new Set(parsed.chapters.map((c) => c.roman.toLowerCase())),
    recitalNumbers: new Set(parsed.recitals.map((r) => String(r.number))),
  });
}

let refCount = 0;
const refCountByInstrument = new Map<InstrumentId, number>();

/** Split an href into its target instrument and instrument-local path. */
function splitHref(href: string): { instrument: InstrumentId; page: string; fragment?: string } {
  const [full, fragment] = href.split("#");
  const { instrument, rest } = splitRoutePath(full);
  return { instrument, page: rest, fragment };
}

/**
 * Validate a candidate href; returns it with the fragment stripped if
 * unanchorable, or null when the ref must be dropped entirely.
 */
function resolveRefHref(href: string, where: string): string | null {
  const { instrument, page, fragment } = splitHref(href);
  const corpus = resolvers.get(instrument)!;
  if (page === "/") {
    // index-page chapter anchor: /#hoofdstuk-iii
    const roman = fragment?.replace(/^hoofdstuk-/, "") ?? "";
    // chapterless corpus (e.g. 2024/1774, whose title-scoped chapters the
    // toc model can't represent): a bare chapter ref has no page to land
    // on — drop it. Instruments WITH chapters still throw on a bad roman.
    if (corpus.chapterRomans.size === 0) return null;
    if (!corpus.chapterRomans.has(roman))
      throw new Error(`${where}: unresolvable chapter ref ${href}`);
    return href;
  }
  let anchors: Set<string> | undefined;
  const art = page.match(/^\/artikel\/(\d+)$/);
  const anx = page.match(/^\/bijlage\/([a-z]+)$/);
  const rct = page.match(/^\/overweging\/(\d+)$/);
  if (art) anchors = corpus.articleAnchors.get(art[1]);
  else if (anx) anchors = corpus.annexAnchors.get(anx[1]);
  else if (!rct || !corpus.recitalNumbers.has(rct[1])) {
    throw new Error(`${where}: unresolvable cross-reference target ${href}`);
  }
  if ((art || anx) && !anchors)
    throw new Error(`${where}: unresolvable cross-reference target ${href}`);
  if (!fragment) return href;
  const pagePart = href.split("#")[0];
  return anchors?.has(fragment) ? href : pagePart;
}

function annotateNodes(nodes: ContentNode[], ctx: RefContext, selfHref: string, where: string): void {
  for (const n of nodes) {
    if (n.type === "text") {
      const refs = findRefs(n.text, ctx)
        .map((r) => ({ ...r, href: resolveRefHref(r.href, where) }))
        // fragment stripping can reduce a deep link to a plain self-page
        // link; null = dropped (chapter ref into a chapterless corpus)
        .filter((r): r is RefSpan => r.href !== null && r.href !== selfHref);
      if (refs.length > 0) {
        n.refs = refs;
        refCount += refs.length;
        refCountByInstrument.set(
          ctx.instrument,
          (refCountByInstrument.get(ctx.instrument) ?? 0) + refs.length,
        );
      }
    } else if (n.type === "list") {
      for (const item of n.items) annotateNodes(item.content, ctx, selfHref, where);
    }
  }
}

for (const [id, parsed] of parsedById) {
  const prefix = INSTRUMENTS[id].routePrefix;
  for (const a of parsed.articles) {
    const ctx: RefContext = {
      instrument: id,
      selfType: "artikel",
      selfRef: String(a.number),
      // dora arts 59-63 amend other acts and quote their text; only explicit
      // self-forms may link there
      linkBareRefs: !(id === "dora" && a.number >= 59 && a.number <= 63),
    };
    for (const p of a.paragraphs) {
      annotateNodes(p.content, ctx, `${prefix}/artikel/${a.number}`, `${id} artikel ${a.number}`);
    }
  }
  for (const r of parsed.recitals) {
    const ctx: RefContext = { instrument: id, selfType: "overweging", selfRef: String(r.number) };
    for (const p of r.paragraphs) {
      const refs = findRefs(p.text, ctx)
        .map((s) => ({ ...s, href: resolveRefHref(s.href, `${id} overweging ${r.number}`) }))
        .filter((s): s is RefSpan => s.href !== null && s.href !== `${prefix}/overweging/${r.number}`);
      if (refs.length > 0) {
        p.refs = refs;
        refCount += refs.length;
        refCountByInstrument.set(id, (refCountByInstrument.get(id) ?? 0) + refs.length);
      }
    }
  }
  for (const a of parsed.annexes) {
    const ctx: RefContext = { instrument: id, selfType: "bijlage", selfRef: a.roman };
    annotateNodes(a.content, ctx, `${prefix}/bijlage/${a.roman.toLowerCase()}`, `${id} bijlage ${a.roman}`);
  }
}

// =================================================================
// Phase C: toc, search docs, write
// =================================================================

const summary: string[] = [];
const allSearchDocs: SearchDoc[] = [];

for (const src of SOURCES) {
  const spec = INSTRUMENTS[src.id];
  const prefix = spec.routePrefix;
  const { articles, annexes, chapters, recitals, footnoteCount } = parsedById.get(src.id)!;

  const toc: Toc = {
    chapters: chapters.map((c): TocChapter => {
      const inChapter = articles.filter((a) => a.chapter === c.roman);
      return {
        roman: c.roman,
        title: c.title,
        sections: c.sections.map((s) => ({
          roman: s.roman,
          title: s.title,
          articles: inChapter
            .filter((a) => a.section === s.roman)
            .map((a) => ({ number: a.number, title: a.title })),
        })),
        articles: inChapter
          .filter((a) => a.section === null)
          .map((a) => ({ number: a.number, title: a.title })),
      };
    }),
    annexes: annexes.map((a) => ({ roman: a.roman, title: a.title })),
    recitalCount: recitals.length,
  };

  // ---- search docs
  const searchDocs: SearchDoc[] = [];
  for (const a of articles) {
    for (const p of a.paragraphs) {
      const lid = p.number !== null ? `, lid ${p.number}` : "";
      searchDocs.push({
        id: `${src.id}-art-${a.number}-${p.anchor}`,
        type: "artikel",
        instrument: src.id,
        ref: String(a.number),
        heading: `Artikel ${a.number} — ${a.title}${lid}`,
        url: `${prefix}/artikel/${a.number}#${p.anchor}`,
        text: flattenNodes(p.content),
      });
    }
  }
  for (const r of recitals) {
    searchDocs.push({
      id: `${src.id}-rct-${r.number}`,
      type: "overweging",
      instrument: src.id,
      ref: String(r.number),
      heading: `Overweging ${r.number}`,
      url: `${prefix}/overweging/${r.number}`,
      text: r.paragraphs.map((p) => p.text).join(" "),
    });
  }
  for (const a of annexes) {
    // chunk per top-level list item / heading group / table, so rare terms
    // don't drown in annex-wide text and snippets land in the right region
    const roman = a.roman.toLowerCase();
    const anchorCounts = new Map<string, number>();
    for (const node of a.content) {
      if (node.type !== "list") continue;
      for (const item of node.items) {
        if (item.anchor) anchorCounts.set(item.anchor, (anchorCounts.get(item.anchor) ?? 0) + 1);
      }
    }
    let seq = 0;
    let heading = "";
    let buf: string[] = [];
    const usedIds = new Set<string>();
    const push = (suffix: string, anchor: string | null, text: string) => {
      if (!text.trim()) return;
      seq += 1;
      let id = anchor ? `${src.id}-anx-${roman}-${anchor}` : `${src.id}-anx-${roman}-${seq}`;
      if (usedIds.has(id)) id = `${src.id}-anx-${roman}-${seq}`;
      usedIds.add(id);
      const fragment = anchor && anchorCounts.get(anchor) === 1 ? `#${anchor}` : "";
      searchDocs.push({
        id,
        type: "bijlage",
        instrument: src.id,
        ref: roman,
        heading: `Bijlage ${a.roman} — ${a.title}${heading ? ` (${heading})` : ""}${suffix}`,
        url: `${prefix}/bijlage/${roman}${fragment}`,
        text,
      });
    };
    const flush = () => {
      if (buf.length === 0) return;
      push("", null, buf.join(" "));
      buf = [];
    };
    for (const node of a.content) {
      if (node.type === "heading") {
        flush();
        heading = node.text;
      } else if (node.type === "list") {
        flush();
        for (const item of node.items) {
          const label = markerToSlug(item.marker);
          push(
            label ? `, punt ${label}` : "",
            item.anchor ?? null,
            `${item.marker} ${flattenNodes(item.content)}`.trim(),
          );
        }
      } else if (node.type === "table") {
        flush();
        push(" (tabel)", null, node.rows.map((r) => r.join(" ")).join(" "));
      } else {
        buf.push(flattenNodes([node]));
      }
    }
    flush();
  }
  allSearchDocs.push(...searchDocs);

  // ---- write
  const outDir = join(root, "data/generated", src.id);
  mkdirSync(outDir, { recursive: true });
  const write = (name: string, data: unknown) =>
    writeFileSync(join(outDir, name), JSON.stringify(data, null, 1) + "\n");
  write("toc.json", toc);
  write("articles.json", articles);
  write("recitals.json", recitals);
  write("annexes.json", annexes);

  summary.push(
    `${src.id}: ${articles.length} art, ${recitals.length} rct, ${annexes.length} anx, ` +
      `${chapters.length} cpt, ${footnoteCount} fn, ${searchDocs.length} docs, ` +
      `${refCountByInstrument.get(src.id) ?? 0} refs`,
  );
}

writeFileSync(
  join(root, "data/generated/search-docs.json"),
  JSON.stringify(allSearchDocs, null, 1) + "\n",
);
copyFileSync(join(root, "data/generated/search-docs.json"), join(root, "public/search-docs.json"));

console.log(`parsed — ${summary.join(" | ")} | ${allSearchDocs.length} search docs, ${refCount} refs total`);
