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
import { INSTRUMENT_IDS, splitRoutePath } from "../src/lib/instruments";
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
  // pinned 2026-07 (epic 10, sources 32024R1502, 32024R1505, 32025R0420,
  // 32024R1772, 32024R1773, 32025R0301)
  criticaliteit: { articles: 7, recitals: 8, annexes: 0, chapters: 0, flat: [4, 7] },
  vergoedingen: { articles: 7, recitals: 9, annexes: 0, chapters: 0, flat: [6, 7] },
  onderzoeksteams: { articles: 6, recitals: 10, annexes: 0, chapters: 0, flat: [4, 6] },
  classificatie: {
    articles: 13,
    recitals: 18,
    annexes: 0,
    chapters: 0,
    flat: [4, 5, 6, 10, 11, 12, 13],
  },
  contractbeleid: {
    articles: 11,
    recitals: 13,
    annexes: 0,
    chapters: 0,
    flat: [1, 2, 4, 10, 11],
  },
  rapportage: { articles: 7, recitals: 9, annexes: 0, chapters: 0, flat: [1, 2, 3, 4, 6, 7] },
  // pinned 2026-07 (epic 10, source 02024R1774-20240625 = incl. beide
  // rectificaties; chapters=0 by design — the act nests chapters inside
  // titles (tis_II.cpt_I), which the toc model doesn't represent)
  risicobeheer: {
    articles: 42,
    recitals: 30,
    annexes: 0,
    chapters: 0,
    flat: [1, 3, 13, 19, 21, 22, 33, 34, 35, 37, 42],
  },
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

const criticaliteit = load<Article[]>("data/generated/criticaliteit/articles.json");
// art 1(a): the two-step assessment approach over the sub-criteria
spot(
  criticaliteit,
  1,
  "voldoet aan alle “stap 1”-subcriteria van artikel 2, lid 1, artikel 3, lid 1, en artikel 5, lid 1",
  "criticaliteit stappenbenadering",
);

const vergoedingen = load<Article[]>("data/generated/vergoedingen/articles.json");
// art 4: equal split of the fees for the first designation round
spot(
  vergoedingen,
  4,
  "gelijkelijk verdeeld over de aangewezen kritieke derde aanbieders van ICT-diensten",
  "vergoedingen eerste ronde",
);

const onderzoeksteams = load<Article[]>("data/generated/onderzoeksteams/articles.json");
// art 1: JET members work under the lead overseer's coordinator
spot(
  onderzoeksteams,
  1,
  "onder coördinatie van de coördinator van de lead overseer",
  "onderzoeksteams coördinatie",
);

const classificatie = load<Article[]>("data/generated/classificatie/articles.json");
// art 9(1): the clients/counterparties materiality threshold
spot(
  classificatie,
  9,
  "het aantal cliënten dat wordt getroffen, bedraagt meer dan 10 % van alle cliënten",
  "classificatie drempel cliënten",
);

const contractbeleid = load<Article[]>("data/generated/contractbeleid/articles.json");
// art 5: business needs established before contracting
spot(
  contractbeleid,
  5,
  "bedrijfsbehoeften van de financiële entiteit worden vastgesteld voordat een contractuele overeenkomst wordt gesloten",
  "contractbeleid bedrijfsbehoeften",
);

const rapportage = load<Article[]>("data/generated/rapportage/articles.json");
// art 5(1)(a): the 4h/24h initial-notification deadline
spot(
  rapportage,
  5,
  "binnen vier uur na de classificatie van het ICT-gerelateerde incident als ernstig",
  "rapportage 4-uurstermijn",
);

const risicobeheer = load<Article[]>("data/generated/risicobeheer/articles.json");
// art 22(d): the corrected corrigendum reference (was "artikel 15" pre-R(02))
spot(
  risicobeheer,
  22,
  "overeenkomstig artikel 8, lid 2, van Gedelegeerde Verordening (EU) 2024/1772",
  "risicobeheer corrigendum-ref art 22",
);

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

// ------------------------------------------------- cross-references (epic 2)

// pinned 2026-07 after the epic-2 negative sweep (every emitted ref audited
// against its after-context; 0 foreign-qualifier hits; 5 suppressed bare
// refs all inside quoted text of amendment arts 59-63): dora 178, its 26,
// rts 10. Re-pinned epic 9: 178→176 — the refuter pass caught two
// "respectievelijk"-constructions the sweep missed (rct 34 "punt c)
// respectievelijk punt e), van die verordening" = AVG; art 44 "van
// respectievelijk Verordeningen (EU) nr. 1093/2010 …"); grammar now
// consumes/excludes both.
// epic 10: + criticaliteit 36 (audited by hand: DORA-qualified refs — art 2(1),
// 28(3), 31(2)(a-d), 31(5), 46 — all retarget to unprefixed routes; bare refs
// stay internal; "artikelen 2 tot en met 5" links both endpoints)
// epic-10 batch (each audited by hand against the OJ text): vergoedingen 17,
// onderzoeksteams 23 (incl. the comma-chained "artikel 35, lid 6, artikel 37,
// lid 1, … van Verordening (EU) 2022/2554" distribution), classificatie 45,
// contractbeleid 19 (incl. "lid 2, en (3)," parenthesized-lid variant),
// rapportage 22 (incl. cross-satellite links into the classificatie-RTS)
const REF_EXPECT: Record<string, number> = {
  dora: 176,
  its: 26,
  rts: 10,
  criticaliteit: 36,
  vergoedingen: 17,
  onderzoeksteams: 23,
  classificatie: 45,
  contractbeleid: 19,
  rapportage: 22,
  // risicobeheer 92 (random-sample audit of 14 + full target-root summary:
  // 56 → dora, 35 internal, 1 → classificatie art 8(2) = the corrigendum
  // ref; 2 bare "hoofdstukken … van deze titel" refs dropped by design)
  risicobeheer: 92,
};

function collectRefs(inst: string): { href: string; where: string }[] {
  const out: { href: string; where: string }[] = [];
  const articles = load<Article[]>(`data/generated/${inst}/articles.json`);
  const recitals = load<Recital[]>(`data/generated/${inst}/recitals.json`);
  const annexes = load<Annex[]>(`data/generated/${inst}/annexes.json`);
  const walk = (nodes: ContentNode[], where: string) => {
    for (const n of nodes) {
      if (n.type === "text") for (const r of n.refs ?? []) out.push({ href: r.href, where });
      if (n.type === "list") for (const item of n.items) walk(item.content, where);
    }
  };
  for (const a of articles) for (const p of a.paragraphs) walk(p.content, `art ${a.number}`);
  for (const r of recitals)
    for (const p of r.paragraphs)
      for (const s of p.refs ?? []) out.push({ href: s.href, where: `rct ${r.number}` });
  for (const a of annexes) walk(a.content, `anx ${a.roman}`);
  return out;
}

let refTotal = 0;
for (const [inst, expected] of Object.entries(REF_EXPECT)) {
  const refs = collectRefs(inst);
  assert.equal(refs.length, expected, `${inst}: ref count drifted (${refs.length})`);
  refTotal += refs.length;
}
assert.equal(refTotal, 466, "total ref count"); // 212→248→374→466 epic 10 (risicobeheer +92)

// positive spot checks: the cross-instrument resolver (ITS/RTS text linking
// into DORA's unprefixed routes)
const itsRefs = collectRefs("its");
assert.ok(
  itsRefs.some((r) => r.where === "art 3" && r.href === "/artikel/28#lid-3"),
  "its art 3 → dora art 28(3)",
);
const rtsRefs = collectRefs("rts");
assert.ok(
  rtsRefs.some((r) => r.where === "art 4" && r.href === "/artikel/30#lid-3-c"),
  "rts art 4 → dora art 30(3)(c)",
);
assert.ok(
  rtsRefs.some((r) => r.href === "/#hoofdstuk-iv"),
  "rts → dora hoofdstuk IV homepage anchor",
);
// negative: nothing may ever resolve into the sectoral acts DORA art 2/3
// cites (Richtlijn 2013/36/EU, Verordening (EU) 2016/679, ...) — those have
// no routes here, so any such bug surfaces as an unresolvable-target throw
// in the parser; belt-and-braces, assert no ref leaves the registered route
// roots (splitRoutePath maps unknown prefixes to dora, where the local-path
// check below then rejects them)
for (const inst of Object.keys(REF_EXPECT)) {
  for (const r of collectRefs(inst)) {
    const [path, fragment] = r.href.split("#");
    const { rest } = splitRoutePath(path);
    assert.ok(
      /^\/(artikel|overweging|bijlage)\/[a-z0-9]+$/.test(rest) ||
        (rest === "/" && fragment?.startsWith("hoofdstuk-")),
      `${inst} ${r.where}: unexpected href shape ${r.href}`,
    );
  }
}

// ------------------------------------------------- search docs

const docs = load<SearchDoc[]>("data/generated/search-docs.json");
// pinned 2026-07: dora 267 art-lid + 106 rct; its 16 art + 15 rct + 55 annex
// chunks; rts 13 art + 13 rct = 485. Epic 10: 513 (criticaliteit) → 679
// (vergoedingen 27 + onderzoeksteams 30 + classificatie 46 + contractbeleid
// 42 + rapportage 21 docs) → 820 (risicobeheer 141)
assert.equal(docs.length, 820, "search docs: total count");
const ids = new Set(docs.map((d) => d.id));
assert.equal(ids.size, docs.length, "search docs: duplicate ids");
for (const d of docs) {
  assert.ok(
    (INSTRUMENT_IDS as string[]).includes(d.instrument),
    `search doc ${d.id}: instrument`,
  );
  const { instrument } = splitRoutePath(d.url.split("#")[0]);
  assert.equal(instrument, d.instrument, `search doc ${d.id}: url prefix (${d.url})`);
  assert.ok(d.text.trim().length > 0, `search doc ${d.id}: empty text`);
}

console.log("verify-data: all assertions passed");
