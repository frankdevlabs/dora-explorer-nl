/**
 * RoI gate (epics 7-8): pins on the derived schema (roi-schema.json),
 * closed-list/source integrity, mapping fixtures (assessment → template
 * fields, manual override wins) and validation fixtures (LEI checksum, ISO
 * country, closed lists). Runs in `npm run verify` before every build.
 */
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveTemplate, templateCompleteness } from "../src/lib/roi/mapping";
import type { RoiSchema } from "../src/lib/roi/schema";
import type { RoiArrangement } from "../src/lib/roi/types";
import { isValidCountry, isValidLei, validateField } from "../src/lib/roi/validate";
import type { Questionnaire } from "../src/lib/assessment/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf-8"));

const schema = load<RoiSchema>("data/generated/roi-schema.json");
const supplier = load<Questionnaire>("data/questionnaire/supplier-v1.json");

// ------------------------------------------------- schema pins (2026-07)

assert.equal(schema.templates.length, 15, "roi-schema: 15 templates");
const colCount = schema.templates.reduce((n, t) => n + t.columns.length, 0);
// pinned 2026-07 from the corrigendum-consolidated ITS bijlage I
assert.equal(colCount, 98, `roi-schema: kolomtelling drifted (${colCount})`);
assert.equal(schema.sCodes.length, 19, "roi-schema: S01-S19");
assert.deepEqual(
  schema.sCodes.map((s) => s.code),
  Array.from({ length: 19 }, (_, i) => `S${String(i + 1).padStart(2, "0")}`),
  "roi-schema: S-codevolgorde",
);

const allCodes = new Set(schema.templates.flatMap((t) => t.columns.map((c) => c.code)));
for (const key of Object.keys(schema.closedLists)) {
  assert.ok(allCodes.has(key), `roi-schema: gesloten lijst voor onbekende kolom ${key}`);
}
assert.ok(
  Object.keys(schema.closedLists).length >= 6,
  "roi-schema: verwacht >= 6 gesloten lijsten",
);

// every assessment:<qid> source must reference an existing supplier question
// whose roi code points back at the same column
const questions = new Map(
  supplier.modules.flatMap((m) => m.questions.map((q) => [q.id, q] as const)),
);
for (const t of schema.templates) {
  for (const c of t.columns) {
    if (!c.source.startsWith("assessment:")) continue;
    const q = questions.get(c.source.slice(11));
    assert.ok(q, `roi-schema ${c.code}: assessment-bron ${c.source} bestaat niet`);
    assert.equal(q!.roi, c.code, `roi-schema ${c.code}: roi-mapping wijst terug naar ${q!.roi}`);
  }
}

// column codes are unique and well-formed
assert.equal(allCodes.size, colCount, "roi-schema: dubbele kolomcodes");
for (const code of allCodes) {
  assert.ok(/^B_\d{2}\.\d{2}\.\d{4}$/.test(code), `roi-schema: misvormde kolomcode ${code}`);
  assert.ok(!/►|◄/.test(code), `roi-schema: corrigendum-marker niet gestript in ${code}`);
}

// ------------------------------------------------- validation fixtures

assert.ok(isValidLei("5493001KJTIIGC8Y1R12"), "LEI-fixture: geldige LEI keurt goed");
assert.ok(!isValidLei("5493001KJTIIGC8Y1R13"), "LEI-fixture: fout checksumcijfer faalt");
assert.ok(!isValidLei("5493001KJTIIGC8Y1R1"), "LEI-fixture: 19 tekens faalt");
assert.ok(isValidCountry("NL") && isValidCountry("el"), "landcode-fixture");
assert.ok(!isValidCountry("XX"), "landcode-fixture: XX bestaat niet");

const leiColumn = schema.templates
  .find((t) => t.code === "B_05.01")!
  .columns.find((c) => c.code === "B_05.01.0010")!;
assert.ok(
  validateField(leiColumn, "") !== null && validateField(leiColumn, "")!.severity === "ontbreekt",
  "validateField: leeg verplicht veld",
);

const soortColumn = schema.templates
  .find((t) => t.code === "B_02.01")!
  .columns.find((c) => c.code === "B_02.01.0020")!;
assert.equal(
  validateField(soortColumn, "9", schema.closedLists["B_02.01.0020"])?.severity,
  "fout",
  "validateField: waarde buiten gesloten lijst",
);
assert.equal(
  validateField(soortColumn, "2", schema.closedLists["B_02.01.0020"]),
  null,
  "validateField: numerieke lijstwaarde is geldig",
);

// ------------------------------------------------- mapping fixtures

const entityBlock = {
  "B_01.01.0010": "5493001KJTIIGC8Y1R12",
  "B_01.01.0020": "Stichting Voorbeeldfonds",
};

const vbA: RoiArrangement = {
  id: "fixture-a",
  name: "AWS EMEA SARL",
  answers: {
    "s1.1": "CTR-2025-001",
    "s1.2": "Amazon Web Services EMEA SARL",
    "s1.3": "549300OYTC66UVEXP956",
    "s1.4": "1",
    "s1.5": "S17",
    "s2.1": "ja",
    "s4.2": "ja",
    "s5.1": "ja",
    "s11.1": "2",
  },
  manual: { "B_05.01.0080": "LU", "B_05.01.0050": "AWS EMEA SARL (handmatig)" },
  createdAt: 0,
  updatedAt: 0,
};

const b0201 = resolveTemplate(schema, supplier, vbA, entityBlock, "B_02.01");
const byCode = (fields: ReturnType<typeof resolveTemplate>, code: string) =>
  fields.find((f) => f.column.code === code)!;
assert.equal(byCode(b0201, "B_02.01.0010").value, "CTR-2025-001", "mapping: contractref");
assert.equal(
  byCode(b0201, "B_02.01.0020").value,
  "1. Op zichzelf staande overeenkomst",
  "mapping: officiële lijsttekst voor choice-waarde",
);

const b0202 = resolveTemplate(schema, supplier, vbA, entityBlock, "B_02.02");
assert.equal(byCode(b0202, "B_02.02.0010").value, "CTR-2025-001", "mapping: join contractref");
assert.equal(byCode(b0202, "B_02.02.0020").value, entityBlock["B_01.01.0010"], "mapping: eigen LEI");
assert.equal(byCode(b0202, "B_02.02.0060").value, "S17", "mapping: S-code blijft code");

const b0501 = resolveTemplate(schema, supplier, vbA, entityBlock, "B_05.01");
const overridden = byCode(b0501, "B_05.01.0050");
assert.equal(overridden.value, "AWS EMEA SARL (handmatig)", "mapping: manual override wint");
assert.equal(overridden.origin, "manual", "mapping: origin manual");
assert.ok(overridden.overridden, "mapping: afwijking van assessment gemarkeerd");
assert.equal(byCode(b0501, "B_05.01.0080").value, "LU", "mapping: manual zonder assessmentwaarde");

const b0701 = resolveTemplate(schema, supplier, vbA, entityBlock, "B_07.01");
assert.equal(byCode(b0701, "B_07.01.0020").value, vbA.answers["s1.3"], "mapping: provider-id join");
assert.equal(
  byCode(b0701, "B_07.01.0050").value,
  "2. zeer complexe substitueerbaarheid",
  "mapping: substitueerbaarheid officiële tekst",
);

const completeness = templateCompleteness(b0201);
assert.ok(
  completeness.total >= 4 && completeness.filled >= 2,
  `mapping: volledigheidsteller (${completeness.filled}/${completeness.total})`,
);

console.log(
  `verify-roi: all assertions passed (${schema.templates.length} templates, ${colCount} kolommen, ${Object.keys(schema.closedLists).length} gesloten lijsten)`,
);

// ------------------------------------------------- export fixtures (epic 8)

import { supplierRequestItems, supplierRequestMarkdown, templateCsv, templateRows } from "../src/lib/roi/export";
import type { RoiState } from "../src/lib/roi/types";

const state: RoiState = {
  v: 1,
  arrangements: [
    { ...vbA, chain: [
      { id: "c1", serviceType: "S17", providerCode: "549300OYTC66UVEXP956", codeType: "lei", rank: "1", recipientCode: "549300OYTC66UVEXP956" },
      { id: "c2", serviceType: "S07", providerCode: "5493001KJTIIGC8Y1R12", codeType: "lei", rank: "2", recipientCode: "549300OYTC66UVEXP956" },
    ] },
  ],
  entity: entityBlock,
};

const b0201Rows = templateRows(schema, supplier, state, "B_02.01");
assert.equal(b0201Rows.length, 3, "export: header(2) + 1 datarij");
assert.equal(b0201Rows[0][0], "B_02.01.0010", "export: kolomcode-header");
assert.equal(b0201Rows[2][0], "CTR-2025-001", "export: contractref in datarij");

const b0502Rows = templateRows(schema, supplier, state, "B_05.02");
assert.equal(b0502Rows.length, 4, "export: 2 ketenrijen");
assert.deepEqual(
  b0502Rows[3].slice(0, 5),
  ["CTR-2025-001", "S07", "5493001KJTIIGC8Y1R12", "LEI", "2"],
  "export: ketenrij rang 2",
);

const b0101Csv = templateCsv(schema, supplier, state, "B_01.01");
assert.ok(b0101Csv.includes("5493001KJTIIGC8Y1R12"), "export: entiteits-LEI in B_01.01-csv");
assert.ok(b0101Csv.split("\r\n").length === 3, "export: B_01.01 = 2 headers + 1 rij");

const request = supplierRequestItems(schema, supplier, state.arrangements[0], entityBlock);
assert.ok(request.some((i) => i.code === "B_05.01.0110"), "uitvraag: uiteindelijke moeder gevraagd");
assert.ok(!request.some((i) => i.code === "B_05.01.0050"), "uitvraag: gevulde velden niet gevraagd");
const md = supplierRequestMarkdown(schema, supplier, state.arrangements[0], entityBlock);
assert.ok(md.includes("kritieke of belangrijke functie"), "uitvraag: KOF-ketenpassage aanwezig");
assert.ok(md.includes("B_05.01.0110"), "uitvraag: veldtabel aanwezig");

console.log("verify-roi: export fixtures passed");
