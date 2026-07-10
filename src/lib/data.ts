import doraArticlesJson from "../../data/generated/dora/articles.json";
import doraRecitalsJson from "../../data/generated/dora/recitals.json";
import doraAnnexesJson from "../../data/generated/dora/annexes.json";
import doraTocJson from "../../data/generated/dora/toc.json";
import itsArticlesJson from "../../data/generated/its/articles.json";
import itsRecitalsJson from "../../data/generated/its/recitals.json";
import itsAnnexesJson from "../../data/generated/its/annexes.json";
import itsTocJson from "../../data/generated/its/toc.json";
import rtsArticlesJson from "../../data/generated/rts/articles.json";
import rtsRecitalsJson from "../../data/generated/rts/recitals.json";
import rtsAnnexesJson from "../../data/generated/rts/annexes.json";
import rtsTocJson from "../../data/generated/rts/toc.json";
import { INSTRUMENTS, type InstrumentId } from "./instruments";
import type { Annex, Article, Recital, Toc } from "./types";
import { flattenNodes } from "./flatten";

interface Corpus {
  articles: Article[];
  recitals: Recital[];
  annexes: Annex[];
  toc: Toc;
}

const CORPORA: Record<InstrumentId, Corpus> = {
  dora: {
    articles: doraArticlesJson as Article[],
    recitals: doraRecitalsJson as Recital[],
    annexes: doraAnnexesJson as Annex[],
    toc: doraTocJson as Toc,
  },
  its: {
    articles: itsArticlesJson as Article[],
    recitals: itsRecitalsJson as Recital[],
    annexes: itsAnnexesJson as Annex[],
    toc: itsTocJson as Toc,
  },
  rts: {
    articles: rtsArticlesJson as Article[],
    recitals: rtsRecitalsJson as Recital[],
    annexes: rtsAnnexesJson as Annex[],
    toc: rtsTocJson as Toc,
  },
};

export function getToc(instrument: InstrumentId = "dora"): Toc {
  return CORPORA[instrument].toc;
}

export function getArticles(instrument: InstrumentId = "dora"): Article[] {
  return CORPORA[instrument].articles;
}

export function getArticle(nummer: number, instrument: InstrumentId = "dora"): Article | undefined {
  return CORPORA[instrument].articles.find((a) => a.number === nummer);
}

export function getRecitals(instrument: InstrumentId = "dora"): Recital[] {
  return CORPORA[instrument].recitals;
}

export function getRecital(nummer: number, instrument: InstrumentId = "dora"): Recital | undefined {
  return CORPORA[instrument].recitals.find((r) => r.number === nummer);
}

export function getAnnexes(instrument: InstrumentId = "dora"): Annex[] {
  return CORPORA[instrument].annexes;
}

export function getAnnex(roman: string, instrument: InstrumentId = "dora"): Annex | undefined {
  return CORPORA[instrument].annexes.find(
    (a) => a.roman.toLowerCase() === roman.toLowerCase(),
  );
}

/** All article slugs of an instrument in document order. */
function buildArticleOrder(instrument: InstrumentId) {
  return CORPORA[instrument].articles.map((a) => ({
    slug: String(a.number),
    label: `Artikel ${a.number}`,
    title: a.title,
  }));
}

const articleOrders: Record<InstrumentId, { slug: string; label: string; title: string }[]> = {
  dora: buildArticleOrder("dora"),
  its: buildArticleOrder("its"),
  rts: buildArticleOrder("rts"),
};

export function getArticleOrder(instrument: InstrumentId = "dora") {
  return articleOrders[instrument];
}

export function getAnnexOrder(instrument: InstrumentId = "dora"): string[] {
  return CORPORA[instrument].annexes.map((a) => a.roman.toLowerCase());
}

export function clip(text: string, max = 200): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 120))}…`;
}

export interface RefPreview {
  title: string;
  snippet: string;
}

/**
 * Build-time hover preview for an internal cross-reference href. Instrument
 * is inferred from the route prefix (/its/..., /rts/..., unprefixed = dora).
 */
export function getPreview(href: string): RefPreview | undefined {
  let [page, fragment] = href.split("#");
  let instrument: InstrumentId = "dora";
  const prefixed = page.match(/^\/(its|rts)(\/.*|$)/);
  if (prefixed) {
    instrument = prefixed[1] as InstrumentId;
    page = prefixed[2] || "/";
  }
  const label = INSTRUMENTS[instrument].label;
  const tag = instrument === "dora" ? "" : ` (${label})`;

  if (page === "/" && fragment?.startsWith("hoofdstuk-")) {
    const roman = fragment.slice("hoofdstuk-".length);
    const ch = CORPORA[instrument].toc.chapters.find((c) => c.roman.toLowerCase() === roman);
    if (!ch) return undefined;
    const nums = [...ch.articles, ...ch.sections.flatMap((s) => s.articles)].map((a) => a.number);
    return {
      title: `Hoofdstuk ${ch.roman} — ${ch.title}${tag}`,
      snippet:
        nums.length > 1
          ? `Artikelen ${Math.min(...nums)} tot en met ${Math.max(...nums)}`
          : nums.length === 1
            ? `Artikel ${nums[0]}`
            : "",
    };
  }
  const art = page.match(/^\/artikel\/(\d+)$/);
  if (art) {
    const a = getArticle(Number(art[1]), instrument);
    if (!a) return undefined;
    // deep links preview the targeted lid rather than the article opening
    const para = fragment
      ? a.paragraphs.find((p) => p.anchor === fragment || fragment.startsWith(`${p.anchor}-`))
      : undefined;
    const lid = para?.number != null ? `, lid ${para.number}` : "";
    return {
      title: `Artikel ${a.number}${lid} — ${a.title}${tag}`,
      snippet: clip(flattenNodes((para ?? a.paragraphs[0]).content)),
    };
  }
  const anx = page.match(/^\/bijlage\/([a-z]+)$/);
  if (anx) {
    const a = getAnnex(anx[1], instrument);
    if (!a) return undefined;
    return {
      title: `Bijlage ${a.roman} — ${a.title}${tag}`,
      snippet: clip(flattenNodes(a.content)),
    };
  }
  const rct = page.match(/^\/overweging\/(\d+)$/);
  if (rct) {
    const r = getRecital(Number(rct[1]), instrument);
    if (!r) return undefined;
    return { title: `Overweging ${r.number}${tag}`, snippet: clip(r.paragraphs[0]?.text ?? "") };
  }
  return undefined;
}

export interface PrevNextLink {
  href: string;
  label: string;
  title?: string;
}

export function articlePrevNext(
  nummer: number | string,
  instrument: InstrumentId = "dora",
): { prev?: PrevNextLink; next?: PrevNextLink } {
  const order = articleOrders[instrument];
  const prefix = INSTRUMENTS[instrument].routePrefix;
  const idx = order.findIndex((e) => e.slug === String(nummer));
  const link = (e?: { slug: string; label: string; title: string }): PrevNextLink | undefined =>
    e && { href: `${prefix}/artikel/${e.slug}`, label: e.label, title: e.title };
  return {
    prev: link(idx > 0 ? order[idx - 1] : undefined),
    next: link(idx >= 0 ? order[idx + 1] : undefined),
  };
}

export function recitalPrevNext(
  nummer: number,
  instrument: InstrumentId = "dora",
): { prev?: PrevNextLink; next?: PrevNextLink } {
  const prefix = INSTRUMENTS[instrument].routePrefix;
  const link = (r?: Recital): PrevNextLink | undefined =>
    r && { href: `${prefix}/overweging/${r.number}`, label: `Overweging ${r.number}` };
  return {
    prev: link(getRecital(nummer - 1, instrument)),
    next: link(getRecital(nummer + 1, instrument)),
  };
}

export function annexPrevNext(
  roman: string,
  instrument: InstrumentId = "dora",
): { prev?: PrevNextLink; next?: PrevNextLink } {
  const order = getAnnexOrder(instrument);
  const prefix = INSTRUMENTS[instrument].routePrefix;
  const idx = order.indexOf(roman.toLowerCase());
  const link = (r?: string): PrevNextLink | undefined => {
    const a = r ? getAnnex(r, instrument) : undefined;
    return (
      a && {
        href: `${prefix}/bijlage/${a.roman.toLowerCase()}`,
        label: `Bijlage ${a.roman}`,
        title: a.title,
      }
    );
  };
  return {
    prev: link(idx > 0 ? order[idx - 1] : undefined),
    next: link(idx >= 0 ? order[idx + 1] : undefined),
  };
}
