/**
 * Pre-build completeness assertions over data/generated/ (epic 1 rebuild for
 * the multi-instrument DORA corpus). Counts, structure, FLAT lists and spot
 * phrases were pinned after eyeballing the parsed JSON by hand — see
 * docs/epics/epic-1-corpus.md. Re-pin only after auditing
 * `git diff data/generated/` change by change; leave a history comment.
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Annex, Article, ContentNode, Recital, SearchDoc, Toc } from "../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf-8"));

function flatText(nodes: ContentNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === "list")
        return n.items.map((i) => `${i.marker} ${flatText(i.content)}`).join(" ");
      if (n.type === "table") return n.rows.map((r) => r.join(" ")).join(" ");
      return n.text;
    })
    .join(" ");
}

function articleText(a: Article): string {
  return a.paragraphs.map((p) => flatText(p.content)).join(" ");
}

interface Expect {
  articles: number;
  recitals: number;
  annexes: number;
  chapters: number;
  /** Articles whose body has no numbered leden. */
  flat: number[];
}

// pinned 2026-07 from the initial epic-1 parse (sources: CELEX
// 02022R2554-20221227, 32022R2554, 02024R2956-20241202 incl. corrigendum
// 19.9.2025, 32024R2956, 32025R0532)
const EXPECT: Record<string, Expect> = {
  dora: {
    articles: 64,
    recitals: 106,
    annexes: 0,
    chapters: 9,
    flat: [3, 7, 15, 20, 23, 46, 53, 59, 60, 61, 62, 63, 64],
  },
  its: { articles: 7, recitals: 15, annexes: 4, chapters: 0, flat: [1, 2, 7] },
  rts: { articles: 7, recitals: 13, annexes: 0, chapters: 0, flat: [1, 2, 6, 7] },
};

for (const [inst, exp] of Object.entries(EXPECT)) {
  const articles = load<Article[]>(`data/generated/${inst}/articles.json`);
  const recitals = load<Recital[]>(`data/generated/${inst}/recitals.json`);
  const annexes = load<Annex[]>(`data/generated/${inst}/annexes.json`);
  const toc = load<Toc>(`data/generated/${inst}/toc.json`);

  assert.equal(articles.length, exp.articles, `${inst}: article count`);
  assert.equal(recitals.length, exp.recitals, `${inst}: recital count`);
  assert.equal(annexes.length, exp.annexes, `${inst}: annex count`);
  assert.equal(toc.chapters.length, exp.chapters, `${inst}: chapter count`);
  assert.equal(toc.recitalCount, exp.recitals, `${inst}: toc recitalCount`);

  // contiguous numbering, no gaps or duplicates
  articles.forEach((a, i) => assert.equal(a.number, i + 1, `${inst}: article numbering at ${i}`));
  recitals.forEach((r, i) => assert.equal(r.number, i + 1, `${inst}: recital numbering at ${i}`));

  // every article has a title and a non-trivial body
  for (const a of articles) {
    assert.ok(a.title.length > 2, `${inst} art ${a.number}: title`);
    assert.ok(a.paragraphs.length > 0, `${inst} art ${a.number}: paragraphs`);
    assert.ok(
      articleText(a).trim().length > 40,
      `${inst} art ${a.number}: body suspiciously short`,
    );
    const anchors = a.paragraphs.map((p) => p.anchor);
    assert.equal(new Set(anchors).size, anchors.length, `${inst} art ${a.number}: anchor dupes`);
  }

  // FLAT list: articles without numbered leden (a lost lid marker shows up here)
  const flat = articles
    .filter((a) => a.paragraphs.every((p) => p.number === null))
    .map((a) => a.number);
  assert.deepEqual(flat, exp.flat, `${inst}: FLAT list drifted`);

  // every recital has text
  for (const r of recitals) {
    assert.ok(
      r.paragraphs.length > 0 && r.paragraphs[0].text.length > 20,
      `${inst} rct ${r.number}: empty`,
    );
  }

  // TOC covers every article exactly once (instruments with chapters)
  if (exp.chapters > 0) {
    const inToc = toc.chapters.flatMap((c) => [
      ...c.articles.map((a) => a.number),
      ...c.sections.flatMap((s) => s.articles.map((a) => a.number)),
    ]);
    assert.equal(inToc.length, exp.articles, `${inst}: toc article coverage`);
    assert.equal(new Set(inToc).size, inToc.length, `${inst}: toc article dupes`);
  }
}

// ------------------------------------------------- DORA structure specifics

const dora = load<Article[]>("data/generated/dora/articles.json");
const doraToc = load<Toc>("data/generated/dora/toc.json");

// chapter/section distribution (chapter roman -> direct articles, sections)
const dist = doraToc.chapters.map((c) => [
  c.roman,
  c.articles.length,
  c.sections.map((s) => [s.roman, s.articles.length]),
]);
assert.deepEqual(
  dist,
  [
    ["I", 4, []],
    ["II", 0, [["I", 1], ["II", 11]]],
    ["III", 7, []],
    ["IV", 4, []],
    ["V", 0, [["I", 3], ["II", 14]]],
    ["VI", 1, []],
    ["VII", 11, []],
    ["VIII", 1, []],
    ["IX", 0, [["I", 1], ["II", 6]]],
  ],
  "dora: chapter/section distribution drifted",
);

// ------------------------------------------------- spot phrases
// exact substrings verified by hand against EUR-Lex; these anchor the
// provisions the assessments and RoI tool deep-link to (epics 5-8)

const spot = (arts: Article[], nr: number, phrase: string, label: string) => {
  const a = arts.find((x) => x.number === nr);
  assert.ok(a, `${label}: artikel ${nr} ontbreekt`);
  assert.ok(articleText(a!).includes(phrase), `${label}: frase niet gevonden in artikel ${nr}`);
};

// art 3 punt 22: the CIF definition
spot(
  dora,
  3,
  "een functie waarvan de verstoring wezenlijk afbreuk zou doen aan de financiële prestaties van een financiële entiteit",
  "dora CIF-definitie",
);
// art 28(3): the register of information duty
spot(dora, 28, "informatieregister", "dora informatieregister");
// art 30: contractual provisions
spot(dora, 30, "contractuele overeenkomsten", "dora art 30");
// art 26: TLPT
spot(dora, 26, "dreigingsgestuurde penetratietest", "dora TLPT");

const its = load<Article[]>("data/generated/its/articles.json");
// ITS art 2: rank concept — NL term is "ranking", not "rangorde"
spot(its, 2, "kennen aan iedere derde aanbieder van ICT-diensten een ranking toe", "its ranking");
// ITS art 3(2)(a): direct providers in scope
spot(
  its,
  3,
  "de relevante informatie over alle ICT-diensten van directe derde aanbieders van ICT-diensten",
  "its reikwijdte",
);

const rts = load<Article[]>("data/generated/rts/articles.json");
// RTS art 3(1): due diligence before allowing subcontracting of CIF services
spot(
  rts,
  3,
  "beslist, voordat zij een contractuele regeling met een derde aanbieder van ICT-diensten aangaat",
  "rts due diligence",
);
spot(rts, 1, "risicoprofiel", "rts risicoprofiel");

// ------------------------------------------------- ITS annexes (RoI source)

const itsAnnexes = load<Annex[]>("data/generated/its/annexes.json");
const anx1 = itsAnnexes.find((a) => a.roman === "I")!;
const anx1Tables = anx1.content.filter((n) => n.type === "table");
// pinned 2026-07: 15 top-level tables = 1 template overview + 13
// per-template instruction tables + the B_99.01 closed-list matrix. The
// B_05.01 instruction table is NESTED inside grid-list punt d) of its intro
// (div.centered in the source) — asserted separately below.
assert.equal(anx1Tables.length, 15, "its anx I: top-level table count");
const nestedTables: ContentNode[] = [];
const collectNested = (nodes: ContentNode[]) => {
  for (const n of nodes) {
    if (n.type === "list")
      for (const item of n.items) {
        nestedTables.push(...item.content.filter((c) => c.type === "table"));
        collectNested(item.content);
      }
  }
};
collectNested(anx1.content);
assert.ok(
  nestedTables.some((t) => t.type === "table" && t.rows.some((r) => r[0] === "B_05.01.0010")),
  "its anx I: nested B_05.01 instruction table",
);
const overview = anx1Tables[0];
assert.ok(overview.type === "table", "its anx I: overview table");
const templateCodes = overview.rows.slice(1).map((r) => r[0]);
assert.deepEqual(
  templateCodes,
  [
    "B_01.01", "B_01.02", "B_01.03",
    "B_02.01", "B_02.02", "B_02.03",
    "B_03.01", "B_03.02", "B_03.03",
    "B_04.01",
    "B_05.01", "B_05.02",
    "B_06.01",
    "B_07.01",
    "B_99.01",
  ],
  "its anx I: the 15 RoI template codes",
);
// column-code rows exist for the key supplier templates (epics 6-8 depend on these)
const anx1Text = flatText(anx1.content);
for (const code of ["B_05.01.0010", "B_05.02.0010", "B_02.02.0010", "B_06.01.0010", "B_07.01.0010"]) {
  assert.ok(anx1Text.includes(code), `its anx I: kolomcode ${code} ontbreekt`);
}

// Annex III: the S01-S19 ICT service taxonomy
const anx3 = itsAnnexes.find((a) => a.roman === "III")!;
const anx3Table = anx3.content.find((n) => n.type === "table");
assert.ok(anx3Table && anx3Table.type === "table", "its anx III: taxonomie-tabel");
const sCodes = anx3Table!.rows.slice(1).map((r) => r[0]);
assert.deepEqual(
  sCodes,
  Array.from({ length: 19 }, (_, i) => `S${String(i + 1).padStart(2, "0")}`),
  "its anx III: S01-S19",
);

// ------------------------------------------------- search docs

const docs = load<SearchDoc[]>("data/generated/search-docs.json");
// pinned 2026-07: dora 267 art-lid + 106 rct; its 16 art + 15 rct + 55 annex
// chunks; rts 13 art + 13 rct = 485
assert.equal(docs.length, 485, "search docs: total count");
const ids = new Set(docs.map((d) => d.id));
assert.equal(ids.size, docs.length, "search docs: duplicate ids");
for (const d of docs) {
  assert.ok(["dora", "its", "rts"].includes(d.instrument), `search doc ${d.id}: instrument`);
  const wantPrefix = d.instrument === "dora" ? "/" : `/${d.instrument}/`;
  assert.ok(d.url.startsWith(wantPrefix), `search doc ${d.id}: url prefix (${d.url})`);
  assert.ok(d.text.trim().length > 0, `search doc ${d.id}: empty text`);
}

console.log("verify-data: all assertions passed");
