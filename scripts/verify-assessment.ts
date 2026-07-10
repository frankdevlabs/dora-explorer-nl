/**
 * Assessment gate (epics 5-6): structural sanity, ref-anchor integrity
 * against the multi-instrument corpus, RoI column-code integrity against the
 * parsed ITS annex I, condition forward-ordering, and behaviour fixtures for
 * both questionnaires. Runs in `npm run verify` before every build.
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeVisibility } from "../src/lib/assessment/engine-core";
import { evaluateEntity } from "../src/lib/assessment/entity-outcome";
import { evaluateSupplier } from "../src/lib/assessment/supplier-outcome";
import type { QCondition, Question, Questionnaire } from "../src/lib/assessment/types";
import type { Annex, Article, ContentNode, Recital } from "../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf-8"));

const entity = load<Questionnaire>("data/questionnaire/entity-v1.json");
const supplier = load<Questionnaire>("data/questionnaire/supplier-v1.json");

/**
 * Retired question ids per questionnaire. Answers persist in users'
 * localStorage keyed by id: a retired id must NEVER be reused with different
 * semantics (it would silently pre-answer the new question with stale data).
 * Append here when removing a question; never shrink this list.
 */
const RETIRED_IDS: Record<string, string[]> = {
  entity: [],
  supplier: [],
};

// ------------------------------------------------- corpus (union, all instruments)

interface CorpusIndex {
  articleAnchors: Map<string, Set<string>>;
  annexRomans: Set<string>;
  recitalNumbers: Set<number>;
}

function collectAnchors(nodes: ContentNode[], into: Set<string>): void {
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

const corpus: Record<string, CorpusIndex> = {
  dora: indexInstrument("dora"),
  its: indexInstrument("its"),
  rts: indexInstrument("rts"),
};

/** Instrument index pages the questionnaire may link to (no fragments). */
const INDEX_PAGES = new Set(["/its", "/rts"]);

function checkRef(owner: string, href: string): void {
  const [pathWithQuery, fragment] = href.split("#");
  const path = pathWithQuery.split("?")[0];
  if (INDEX_PAGES.has(path)) {
    assert.ok(!fragment, `${owner}: geen fragmenten op indexpagina's (${href})`);
    return;
  }
  const m = path.match(/^(?:\/(its|rts))?\/(artikel|overweging|bijlage)\/([a-z0-9]+)$/);
  assert.ok(m, `${owner}: onbekend ref-pad ${href}`);
  const inst = corpus[m![1] ?? "dora"];
  const [, , kind, key] = m!;
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
}

// ------------------------------------------------- ITS column codes (RoI mapping)

const itsAnnexes = load<Annex[]>("data/generated/its/annexes.json");
const columnCodes = new Set<string>();
{
  const walk = (nodes: ContentNode[]) => {
    for (const n of nodes) {
      if (n.type === "table") {
        for (const row of n.rows) {
          // corrigendum markers wrap some codes: "►C1 B_06.01.0050 ◄"
          const m = row[0]?.match(/B_\d{2}\.\d{2}\.\d{4}/);
          if (m) columnCodes.add(m[0]);
        }
      }
      if (n.type === "list") for (const item of n.items) walk(item.content);
    }
  };
  walk(itsAnnexes.find((a) => a.roman === "I")!.content);
}
assert.ok(columnCodes.size > 80, `ITS kolomcodes: verwacht >80, kreeg ${columnCodes.size}`);

// ------------------------------------------------- structural checks

function checkQuestionnaire(name: string, q: Questionnaire): void {
  assert.ok(q.meta.kind === name, `${name}: meta.kind`);
  const qids = new Set<string>();
  const mids = new Set<string>();
  const flagsSetBefore = new Set<string>();

  const conditionDeps = (cond: QCondition): { flags: string[]; answers: string[] } => {
    const flags: string[] = [];
    const answers: string[] = [];
    const walk = (c: QCondition) => {
      if (c.flag) flags.push(c.flag);
      if (c.answer) answers.push(c.answer.q);
      for (const sub of c.all ?? []) walk(sub);
      for (const sub of c.any ?? []) walk(sub);
      if (c.not) walk(c.not);
    };
    walk(cond);
    return { flags, answers };
  };

  const checkCondition = (owner: string, cond: QCondition) => {
    const deps = conditionDeps(cond);
    for (const f of deps.flags) {
      assert.ok(
        flagsSetBefore.has(f),
        `${name} ${owner}: showIf-flag "${f}" wordt pas later (of nooit) gezet — forward-ordering`,
      );
    }
    for (const dep of deps.answers) {
      assert.ok(qids.has(dep), `${name} ${owner}: showIf verwijst naar latere/onbekende vraag ${dep}`);
    }
  };

  for (const m of q.modules) {
    assert.ok(!mids.has(m.id), `${name}: dubbele module-id ${m.id}`);
    mids.add(m.id);
    if (m.showIf) checkCondition(`module ${m.id}`, m.showIf);
    for (const ref of m.refs ?? []) checkRef(`${name} module ${m.id}`, ref.href);

    for (const question of m.questions) {
      assert.ok(!qids.has(question.id), `${name}: dubbele vraag-id ${question.id}`);
      assert.ok(
        !RETIRED_IDS[name].includes(question.id),
        `${name}: vraag-id ${question.id} is retired en mag niet terugkomen`,
      );
      if (question.showIf) checkCondition(`vraag ${question.id}`, question.showIf);
      qids.add(question.id);
      for (const ref of question.refs ?? []) checkRef(`${name} ${question.id}`, ref.href);

      // answer-domain rules
      if (question.obligation) {
        assert.equal(
          question.answerType,
          "janeenvt",
          `${name} ${question.id}: obligation-vragen zijn janeenvt`,
        );
      }
      if (question.answerType === "choice") {
        assert.ok(
          (question.options ?? []).length >= 2,
          `${name} ${question.id}: choice heeft >= 2 opties nodig`,
        );
      }
      const domain =
        question.answerType === "choice"
          ? new Set((question.options ?? []).map((o) => o.value))
          : question.answerType === "janeenvt"
            ? new Set(["ja", "nee", "nvt"])
            : question.answerType === "janee"
              ? new Set(["ja", "nee"])
              : null;
      for (const eff of question.effects ?? []) {
        const whens = Array.isArray(eff.when) ? eff.when : [eff.when];
        if (domain) {
          for (const w of whens) {
            assert.ok(domain.has(w), `${name} ${question.id}: effect-waarde "${w}" buiten domein`);
          }
        }
        flagsSetBefore.add(eff.setFlag);
      }
      // RoI mapping codes must exist in the parsed ITS annex I (full column
      // codes only; bare template refs like "B_02.01" are allowed as hints)
      if (question.roi && /^B_\d{2}\.\d{2}\.\d{4}$/.test(question.roi)) {
        assert.ok(
          columnCodes.has(question.roi),
          `${name} ${question.id}: RoI-kolomcode ${question.roi} niet in ITS bijlage I`,
        );
      }
    }
  }
}

checkQuestionnaire("entity", entity);
checkQuestionnaire("supplier", supplier);

// supplier questionnaire must map the key RoI fields
for (const code of [
  "B_02.01.0010",
  "B_05.01.0010",
  "B_05.01.0050",
  "B_02.02.0060",
  "B_06.01.0050",
  "B_07.01.0050",
]) {
  assert.ok(
    supplier.modules.some((m) => m.questions.some((q) => q.roi === code)),
    `supplier: RoI-kolom ${code} wordt door geen vraag gevuld`,
  );
}

// ------------------------------------------------- fixtures: entity

{
  // VB-E1: micro-onderneming, in scope
  const answers: Record<string, string> = {
    "e1.1": "Stichting Voorbeeldfonds",
    "e2.1": "ja",
    "e2.2": "nee",
    "e3.1": "ja",
    "e3.2": "nee",
  };
  const e = evaluateEntity(entity, answers);
  assert.equal(e.regime, "micro", "VB-E1: regime micro");
  assert.ok(e.inScope, "VB-E1: in scope");
  const ctx = computeVisibility(entity, answers);
  assert.ok(ctx.visibleModules.has("m5"), "VB-E1: volledig kader zichtbaar (micro is geen art 16)");
  assert.ok(!ctx.visibleModules.has("m9"), "VB-E1: vereenvoudigd kader verborgen");
  assert.ok(
    !ctx.visibleQuestions.has("e14.2"),
    "VB-E1: TLPT-verplichting verborgen zonder aanwijzing",
  );
}

{
  // VB-E2: artikel 16-entiteit — vereenvoudigd regime, m5-m8 weg, m9 zichtbaar
  const answers: Record<string, string> = {
    "e2.1": "ja",
    "e2.2": "nee",
    "e3.1": "nee",
    "e3.2": "ja",
  };
  const e = evaluateEntity(entity, answers);
  assert.equal(e.regime, "vereenvoudigd", "VB-E2: regime vereenvoudigd");
  const ctx = computeVisibility(entity, answers);
  for (const hidden of ["m5", "m6", "m7", "m8"]) {
    assert.ok(!ctx.visibleModules.has(hidden), `VB-E2: ${hidden} verborgen onder art 16`);
  }
  assert.ok(ctx.visibleModules.has("m9"), "VB-E2: m9 zichtbaar");
  assert.ok(ctx.visibleModules.has("m16"), "VB-E2: informatieregister blijft gelden");
}

{
  // VB-E3: buiten scope — geen verplichtingen, latere modules verborgen
  const answers: Record<string, string> = { "e2.1": "nee" };
  const e = evaluateEntity(entity, answers);
  assert.equal(e.regime, "buiten-scope", "VB-E3: buiten scope");
  assert.equal(e.obligations.length, 0, "VB-E3: geen verplichtingen");
  const ctx = computeVisibility(entity, answers);
  assert.ok(!ctx.visibleModules.has("m4"), "VB-E3: m4 verborgen");
}

{
  // VB-E4: volledig regime bank met TLPT-aanwijzing en CIF-uitbesteding
  const answers: Record<string, string> = {
    "e2.1": "ja",
    "e2.2": "nee",
    "e3.1": "nee",
    "e3.2": "nee",
    "e14.1": "ja",
    "e15.2": "ja",
    "e16.1": "nee",
  };
  const e = evaluateEntity(entity, answers);
  assert.equal(e.regime, "volledig", "VB-E4: volledig regime");
  const ctx = computeVisibility(entity, answers);
  assert.ok(ctx.visibleQuestions.has("e14.2"), "VB-E4: TLPT-verplichtingen zichtbaar");
  assert.ok(ctx.visibleQuestions.has("e16.3"), "VB-E4: ketenregistratie zichtbaar bij CIF");
  assert.ok(
    e.openActions.some((o) => o.questionId === "e16.1"),
    "VB-E4: ontbrekend register is een open actie",
  );
  assert.ok(
    e.timeline.some((t) => t.date === "2026-03-22"),
    "VB-E4: AFM-deadline in de tijdlijn",
  );
}

// ------------------------------------------------- fixtures: supplier

{
  // VB-A: cloudleverancier die een kritieke functie ondersteunt
  const answers: Record<string, string> = {
    "s1.1": "CTR-2025-001",
    "s1.2": "Amazon Web Services EMEA SARL",
    "s1.5": "S17",
    "s2.1": "ja",
    "s3.1": "nee",
    "s4.2": "ja",
    "s5.1": "ja",
    "s9.1": "ja",
    "s8.4": "nee",
  };
  const e = evaluateSupplier(supplier, answers);
  assert.ok(e.ictDienst && e.cifDienst, "VB-A: ICT-dienst + CIF");
  assert.ok(e.cifExtra.length >= 10, `VB-A: CIF-verplichtingen (kreeg ${e.cifExtra.length})`);
  assert.ok(e.baseline.length >= 10, `VB-A: basisverplichtingen (kreeg ${e.baseline.length})`);
  const ctx = computeVisibility(supplier, answers);
  assert.ok(ctx.visibleModules.has("m8"), "VB-A: m8 (art 30 lid 3) zichtbaar");
  assert.ok(ctx.visibleQuestions.has("s9.2"), "VB-A: RTS-voorwaarden zichtbaar na toestaan onderaanneming");
  assert.ok(
    e.openActions.some((o) => o.questionId === "s8.4"),
    "VB-A: ontbrekende TLPT-medewerking is open actie",
  );
  assert.ok(
    e.timeline.some((t) => t.date === "2025-07-22"),
    "VB-A: RTS-datum in tijdlijn",
  );
}

{
  // VB-B: kantoorsoftware, geen kritieke functie — alleen baseline
  const answers: Record<string, string> = {
    "s2.1": "ja",
    "s4.2": "nee",
    "s5.1": "nee",
  };
  const e = evaluateSupplier(supplier, answers);
  assert.ok(e.ictDienst && !e.cifDienst, "VB-B: ICT-dienst, geen CIF");
  assert.equal(e.cifExtra.length, 0, "VB-B: geen CIF-verplichtingen");
  assert.ok(e.baseline.length >= 10, "VB-B: wel baseline (art 30 lid 2)");
  const ctx = computeVisibility(supplier, answers);
  assert.ok(!ctx.visibleModules.has("m8"), "VB-B: m8 verborgen");
  assert.ok(!ctx.visibleModules.has("m9"), "VB-B: m9 verborgen");
  assert.ok(!ctx.visibleModules.has("m11"), "VB-B: m11 verborgen");
}

{
  // VB-C: geen ICT-dienst — assessment stopt na module 2
  const answers: Record<string, string> = { "s2.1": "nee" };
  const e = evaluateSupplier(supplier, answers);
  assert.ok(!e.ictDienst, "VB-C: geen ICT-dienst");
  assert.equal(e.baseline.length + e.cifExtra.length, 0, "VB-C: geen verplichtingen");
  const ctx = computeVisibility(supplier, answers);
  for (const hidden of ["m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11"]) {
    assert.ok(!ctx.visibleModules.has(hidden), `VB-C: ${hidden} verborgen`);
  }
}

const nEntity = entity.modules.reduce((n, m) => n + m.questions.length, 0);
const nSupplier = supplier.modules.reduce((n, m) => n + m.questions.length, 0);
console.log(
  `verify-assessment: all assertions passed (entity ${entity.modules.length} modules / ${nEntity} vragen; supplier ${supplier.modules.length} modules / ${nSupplier} vragen)`,
);
