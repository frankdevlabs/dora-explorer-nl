/**
 * Playbook gate (epic 11): structural sanity of both playbooks, ref-anchor
 * integrity against the corpus, and the coverage matrix that guarantees
 * every artikel/lid/bijlage of all 13 instruments has a disposition.
 *
 * Two regimes, mirroring verify-recital-map:
 * - meta.complete=false (curation in progress): coverage keyset must be a
 *   SUBSET of the corpus; progress is reported per instrument.
 * - meta.complete=true: keyset must equal the corpus EXACTLY (the 100%
 *   assertion) and the pinned counts below apply.
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { INSTRUMENT_IDS } from "../src/lib/instruments";
import type { Annex, Article } from "../src/lib/types";
import type {
  CoverageEntry,
  CoverageFile,
  DocCategory,
  DocumentCatalogFile,
  Disposition,
  Playbook,
  PlaybookRegime,
} from "../src/lib/playbook/types";
import { isDocRef } from "../src/lib/playbook/types";
import { CATEGORY_ORDER } from "../src/lib/playbook/ui";
import { buildCorpusIndex, makeCheckRef } from "./lib/corpus-index";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf-8"));

const entiteit = load<Playbook>("data/playbook/entiteit-v1.json");
const aanbieder = load<Playbook>("data/playbook/aanbieder-v1.json");
const coverage = load<CoverageFile>("data/playbook/coverage-v1.json");
const docCatalog = load<DocumentCatalogFile>("data/playbook/documenten-v1.json");

const corpus = buildCorpusIndex();
const checkRef = makeCheckRef(corpus);

/**
 * Retired step ids per playbook. Step progress persists in users'
 * localStorage keyed by id: a retired id must NEVER be reused with different
 * semantics. Append here when removing a step; never shrink this list.
 */
const RETIRED_STEP_IDS: Record<string, string[]> = {
  entiteit: [],
  aanbieder: [],
};

/**
 * Retired document-catalog ids (epic 17). A document id may appear in step
 * bewijsstukken; a retired id must NEVER be reused with different semantics.
 * Append here when removing a catalog entry; never shrink this list.
 */
const RETIRED_DOC_IDS: string[] = [];

const DISPOSITIONS: Disposition[] = [
  "stap",
  "definitie",
  "toepassingsgebied",
  "autoriteit",
  "ctpp",
  "slotbepaling",
  "context",
];

const REGIMES: Record<string, PlaybookRegime[]> = {
  entiteit: ["volledig", "vereenvoudigd"],
  aanbieder: ["aanbieder", "ctpp"],
};

const ALL_REGIMES = new Set<PlaybookRegime>([...REGIMES.entiteit, ...REGIMES.aanbieder]);

// ------------------------------------------------- document-type catalog (epic 17)

const DOC_CATEGORIES = new Set<DocCategory>(CATEGORY_ORDER);
const validDocIds = new Set<string>();
const seenDocId = new Set<string>();

for (const doc of docCatalog.documenten) {
  const owner = `document ${doc.id}`;
  assert.ok(doc.id.startsWith("doc."), `${owner}: id-prefix moet "doc." zijn`);
  assert.ok(!seenDocId.has(doc.id), `catalogus: dubbele document-id ${doc.id}`);
  assert.ok(!RETIRED_DOC_IDS.includes(doc.id), `${owner}: id is retired en mag niet terugkomen`);
  assert.ok(DOC_CATEGORIES.has(doc.category), `${owner}: onbekende category ${doc.category}`);
  assert.ok(doc.naam.trim().length > 0, `${owner}: naam leeg`);
  assert.ok(doc.omschrijving.trim().length > 0, `${owner}: omschrijving leeg`);
  assert.ok(doc.refs.length >= 1, `${owner}: minstens één ref (wettelijke basis)`);
  for (const ref of doc.refs) checkRef(owner, ref.href);
  for (const r of doc.appliesTo ?? []) {
    assert.ok(ALL_REGIMES.has(r), `${owner}: appliesTo "${r}" buiten domein`);
  }
  seenDocId.add(doc.id);
  validDocIds.add(doc.id);
}

/** doc ids actually cited by a step's bewijsstukken (for the orphan check). */
const citedDocIds = new Set<string>();
/** number of migrated (structured) bewijsstukken across all steps. */
let docRefCount = 0;

// ------------------------------------------------- playbook structural checks

const allStepIds = new Set<string>();

function checkPlaybook(name: string, pb: Playbook): void {
  assert.equal(pb.meta.kind, name, `${name}: meta.kind`);
  const faseIds = new Set<string>();
  const idsSoFar = new Set<string>();
  const idPrefix = name === "entiteit" ? "pe." : "pa.";

  for (const fase of pb.fases) {
    assert.ok(!faseIds.has(fase.id), `${name}: dubbele fase-id ${fase.id}`);
    faseIds.add(fase.id);
    for (const inst of fase.instrumenten) {
      assert.ok(
        (INSTRUMENT_IDS as string[]).includes(inst),
        `${name} ${fase.id}: onbekend instrument ${inst}`,
      );
    }
    for (const step of fase.stappen) {
      assert.ok(step.id.startsWith(idPrefix), `${name} ${step.id}: id-prefix moet ${idPrefix} zijn`);
      assert.ok(!allStepIds.has(step.id), `${name}: dubbele stap-id ${step.id}`);
      assert.ok(
        !RETIRED_STEP_IDS[name].includes(step.id),
        `${name}: stap-id ${step.id} is retired en mag niet terugkomen`,
      );
      assert.ok(step.acties.length >= 1, `${name} ${step.id}: minstens één actie`);
      assert.ok(step.refs.length >= 1, `${name} ${step.id}: minstens één ref (wettelijke basis)`);
      for (const ref of step.refs) checkRef(`${name} ${step.id}`, ref.href);
      for (const b of step.bewijsstukken ?? []) {
        if (!isDocRef(b)) continue;
        assert.ok(
          validDocIds.has(b.docId),
          `${name} ${step.id}: bewijsstuk verwijst naar onbekend document ${b.docId}`,
        );
        citedDocIds.add(b.docId);
        docRefCount++;
      }
      assert.ok(step.appliesTo.length >= 1, `${name} ${step.id}: appliesTo leeg`);
      for (const r of step.appliesTo) {
        assert.ok(
          REGIMES[name].includes(r),
          `${name} ${step.id}: appliesTo "${r}" buiten domein [${REGIMES[name]}]`,
        );
      }
      for (const dep of step.afhankelijkVan ?? []) {
        assert.ok(
          idsSoFar.has(dep),
          `${name} ${step.id}: afhankelijkVan ${dep} komt pas later (of nooit) — forward-ordering`,
        );
      }
      allStepIds.add(step.id);
      idsSoFar.add(step.id);
    }
  }
}

checkPlaybook("entiteit", entiteit);
checkPlaybook("aanbieder", aanbieder);

// ------------------------------------------------- begrippen (dora art. 3)

const dora3 = load<Article[]>("data/generated/dora/articles.json").find((a) => a.number === 3)!;
const puntAnchors = new Set<string>();
for (const p of dora3.paragraphs) {
  for (const node of p.content) {
    if (node.type !== "list") continue;
    for (const item of node.items) if (item.anchor) puntAnchors.add(item.anchor);
  }
}
assert.equal(puntAnchors.size, 65, `dora art. 3: verwacht 65 punt-anchors, kreeg ${puntAnchors.size}`);

const begrippen = entiteit.begrippen ?? [];
const seenBegrip = new Set<string>();
for (const b of begrippen) {
  checkRef(`begrip "${b.term}"`, b.href);
  const frag = b.href.split("#")[1] ?? "";
  assert.ok(
    b.href.startsWith("/artikel/3#") && puntAnchors.has(frag),
    `begrip "${b.term}": href moet naar een punt van artikel 3 DORA wijzen (${b.href})`,
  );
  assert.ok(!seenBegrip.has(frag), `begrip "${b.term}": dubbel anker ${frag}`);
  seenBegrip.add(frag);
}

// ------------------------------------------------- coverage matrix

assert.deepEqual(
  Object.keys(coverage.instruments).sort(),
  [...INSTRUMENT_IDS].sort(),
  "coverage: instrumentenset wijkt af van het corpus",
);

// paragraph-level anchors only (lid-N | inhoud) — the coverage granularity
const paragraphAnchors = new Map<string, Map<string, Set<string>>>();
const annexRomans = new Map<string, Set<string>>();
for (const id of INSTRUMENT_IDS) {
  const arts = load<Article[]>(`data/generated/${id}/articles.json`);
  const perArticle = new Map<string, Set<string>>();
  for (const a of arts) perArticle.set(String(a.number), new Set(a.paragraphs.map((p) => p.anchor)));
  paragraphAnchors.set(id, perArticle);
  const annexes = load<Annex[]>(`data/generated/${id}/annexes.json`);
  annexRomans.set(id, new Set(annexes.map((a) => a.roman.toLowerCase())));
}

let totalEntries = 0;
let totalUniverse = 0;
const citedSteps = new Set<string>();
const histogram: Record<string, number> = {};
const progress: string[] = [];

function checkEntry(owner: string, e: CoverageEntry): void {
  assert.ok(DISPOSITIONS.includes(e.disposition), `${owner}: onbekende dispositie ${e.disposition}`);
  assert.equal(typeof e.reviewed, "boolean", `${owner}: reviewed ontbreekt`);
  if (e.disposition === "stap") {
    assert.ok((e.steps ?? []).length >= 1, `${owner}: dispositie "stap" vereist steps`);
  }
  if (e.disposition === "autoriteit" || e.disposition === "context") {
    assert.ok((e.note ?? "").trim().length > 0, `${owner}: dispositie "${e.disposition}" vereist note`);
  }
  for (const s of e.steps ?? []) {
    assert.ok(allStepIds.has(s), `${owner}: onbekende stap ${s}`);
    citedSteps.add(s);
  }
  histogram[e.disposition] = (histogram[e.disposition] ?? 0) + 1;
  totalEntries++;
}

for (const id of INSTRUMENT_IDS) {
  const block = coverage.instruments[id];
  const perArticle = paragraphAnchors.get(id)!;
  const romans = annexRomans.get(id)!;
  const universe =
    [...perArticle.values()].reduce((n, s) => n + s.size, 0) + romans.size;
  totalUniverse += universe;
  let covered = 0;

  for (const [artNr, byAnchor] of Object.entries(block.artikelen)) {
    const anchors = perArticle.get(artNr);
    assert.ok(anchors, `coverage ${id}: artikel ${artNr} bestaat niet in het corpus`);
    for (const [anchor, entry] of Object.entries(byAnchor)) {
      assert.ok(
        anchors!.has(anchor),
        `coverage ${id} art. ${artNr}: anker ${anchor} bestaat niet (verouderde key na consolidatie?)`,
      );
      checkEntry(`coverage ${id} art. ${artNr} ${anchor}`, entry);
      covered++;
    }
  }
  for (const [roman, entry] of Object.entries(block.bijlagen)) {
    assert.ok(romans.has(roman), `coverage ${id}: bijlage ${roman} bestaat niet`);
    checkEntry(`coverage ${id} bijlage ${roman}`, entry);
    covered++;
  }

  if (coverage.meta.complete) {
    assert.equal(
      covered,
      universe,
      `coverage ${id}: ${covered}/${universe} — complete=true vereist 100%`,
    );
  }
  progress.push(`${id} ${covered}/${universe}`);
}

// inverse: every step must be grounded in the coverage matrix — a step
// without a citing lid is either paraphrasing nothing or orphaned
for (const stepId of allStepIds) {
  assert.ok(
    citedSteps.has(stepId),
    `stap ${stepId} wordt door geen enkele dekkingsentry geciteerd (orphan)`,
  );
}

// ------------------------------------------------- document catalog regime (epic 17)

// Count remaining legacy free-text bewijsstukken (un-migrated deliverables).
let freeTextBewijs = 0;
for (const pb of [entiteit, aanbieder]) {
  for (const fase of pb.fases) {
    for (const step of fase.stappen) {
      for (const b of step.bewijsstukken ?? []) if (!isDocRef(b)) freeTextBewijs++;
    }
  }
}

const unusedDocs = [...validDocIds].filter((id) => !citedDocIds.has(id));

if (docCatalog.meta.complete) {
  // Final mode: every catalog document must be produced by >= 1 step (no
  // orphans) and every deliverable must be migrated to a structured docId.
  assert.equal(unusedDocs.length, 0, `catalogus: ongebruikte documenten: ${unusedDocs.join(", ")}`);
  assert.equal(
    freeTextBewijs,
    0,
    `catalogus: ${freeTextBewijs} bewijsstukken nog niet gemigreerd naar de catalogus`,
  );
  // Pinned in epic 17 (juli 2026) after the full drafter→refute curation of the
  // 339 step deliverables into the document catalog: 167 canonical document
  // types (after 26 dedup merges), 279 structured bewijsstukken (DocRefs) across
  // all 128 steps, zero free-text remaining. Every doc is cited by >= 1 step
  // (orphan check above) and every doc ref anchor resolves (checkRef above).
  const EXPECTED_DOCS = {
    documents: 167,
    docRefs: 279,
  };
  assert.equal(docCatalog.documenten.length, EXPECTED_DOCS.documents, "pin: documents");
  assert.equal(docRefCount, EXPECTED_DOCS.docRefs, "pin: docRefs");
} else {
  console.log(
    `verify-playbook: documentcatalogus in curatie — ${docCatalog.documenten.length} documenten, ${docRefCount} gemigreerde bewijsstukken, ${freeTextBewijs} nog vrije tekst, ${unusedDocs.length} ongebruikt`,
  );
}

// ------------------------------------------------- final-mode pins

if (coverage.meta.complete) {
  // Pinned in epic 15 (juli 2026) after the full audit-then-pin pass: a
  // 13-instrument adversarial verifier re-sweep confirmed every entry against
  // the source text before meta.complete was flipped to true. 654 = 637 leden
  // + 17 bijlagen, the exact corpus universe (also asserted per-instrument via
  // covered===universe above). begrippen = the 65 punt-anchors of DORA art. 3.
  const EXPECTED = {
    coverageEntries: 654,
    begrippen: 65,
  };
  assert.equal(totalEntries, EXPECTED.coverageEntries, "pin: coverage-entries");
  assert.equal(begrippen.length, EXPECTED.begrippen, "pin: begrippen");
}

console.log(
  `verify-playbook: all assertions passed (${allStepIds.size} stappen; dekking ${totalEntries}/${totalUniverse}: ${progress.join(", ")}; disposities ${JSON.stringify(histogram)}; complete=${coverage.meta.complete})`,
);
