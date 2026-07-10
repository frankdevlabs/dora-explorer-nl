/**
 * Derive the machine-readable RoI schema from the parsed ITS annexes
 * (epic 7): the 15 template definitions and per-column code / label /
 * datatype / instruction / mandatory-flag from Annex I, the S01-S19 service
 * taxonomy from Annex III, and the closed lists from the B_99.01 matrix.
 *
 * Deterministic derivation from data/generated/its/annexes.json (itself
 * parser output — golden rule 1 applies transitively). The only editorial
 * layer is the OVERLAY below: per-column provenance for the register UI
 * (which supplier-assessment answer feeds it, what stays manual, what the
 * vendor must supply). Output: data/generated/roi-schema.json, gated by
 * scripts/verify-roi.ts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Annex, ContentNode } from "../src/lib/types";
import type { Questionnaire } from "../src/lib/assessment/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf-8"));

const annexes = load<Annex[]>("data/generated/its/annexes.json");
const supplier = load<Questionnaire>("data/questionnaire/supplier-v1.json");

/** Strip corrigendum markers: "►C1 B_06.01.0050 ◄" → "B_06.01.0050". */
const clean = (s: string) => s.replace(/►C\d+|◄/g, "").trim();

interface RoiColumn {
  code: string;
  label: string;
  /** "Soort" from the instruction table: Alfanumeriek, Land, Monetair, … */
  soort: string;
  instruction: string;
  /** Raw "Keuzemogelijkheid voor invullen" cell (Verplicht / Facultatief / conditional). */
  mandatoryRaw: string;
  /** True when unconditionally "Verplicht". */
  mandatory: boolean;
  /**
   * Provenance for the register UI:
   *  assessment:<qid> — filled from a supplier-assessment answer
   *  auto             — derivable for a single-entity register (joins, own LEI)
   *  supplier         — only the vendor/chain knows it (Deel B uitvraag)
   *  manual           — data entry by the entity
   */
  source: string;
  /** Part of the supplier data request (epic 8). */
  askSupplier: boolean;
}

interface RoiTemplate {
  code: string;
  name: string;
  description: string;
  columns: RoiColumn[];
}

// ---------------------------------------------------------------- overlay
// Editorial provenance. Defaults: columns mapped by a supplier question →
// assessment:<qid>; everything else manual, overridden below.

const assessmentByCode = new Map<string, string>();
for (const m of supplier.modules) {
  for (const q of m.questions) {
    if (q.roi && /^B_\d{2}\.\d{2}\.\d{4}$/.test(q.roi)) assessmentByCode.set(q.roi, q.id);
  }
}

/** Columns the vendor/chain must supply (Deel B of the Ohpen-style annex). */
const ASK_SUPPLIER = new Set([
  "B_05.01.0010", // provider LEI/EUID
  "B_05.01.0020", // code type
  "B_05.01.0030",
  "B_05.01.0040",
  "B_05.01.0050", // legal name
  "B_05.01.0060",
  "B_05.01.0070", // person type
  "B_05.01.0080", // HQ country
  "B_05.01.0110", // ultimate parent id
  "B_05.01.0120",
  "B_05.02.0020", // chain: service type
  "B_05.02.0030", // chain: subcontractor id
  "B_05.02.0040",
  "B_05.02.0050", // chain: rank
  "B_05.02.0060", // chain: recipient
  "B_05.02.0070",
  "B_02.02.0130", // country of provision
  "B_02.02.0150", // data at rest location
  "B_02.02.0160", // data processing location
]);

/** Columns derivable without input for a single-entity register. */
const AUTO = new Set([
  "B_01.02.0010", // group list = the entity itself
  "B_02.02.0010", // contract ref (join)
  "B_02.02.0020", // own LEI
  "B_03.01.0010",
  "B_03.01.0020", // signing entity = own entity
  "B_03.01.0030",
  "B_03.02.0010",
  "B_03.02.0020", // signing provider = direct provider
  "B_03.02.0030",
  "B_04.01.0010",
  "B_04.01.0020", // using entity = own entity
  "B_04.01.0030",
  "B_05.02.0010",
  "B_06.01.0010", // function id
  "B_06.01.0040", // own LEI
  "B_07.01.0010",
  "B_07.01.0020",
  "B_07.01.0030",
  "B_07.01.0040",
]);

function sourceFor(code: string): { source: string; askSupplier: boolean } {
  const qid = assessmentByCode.get(code);
  if (qid) return { source: `assessment:${qid}`, askSupplier: ASK_SUPPLIER.has(code) };
  if (AUTO.has(code)) return { source: "auto", askSupplier: false };
  if (ASK_SUPPLIER.has(code)) return { source: "supplier", askSupplier: true };
  return { source: "manual", askSupplier: false };
}

// ---------------------------------------------------------------- annex I

const anx1 = annexes.find((a) => a.roman === "I");
if (!anx1) throw new Error("ITS bijlage I ontbreekt");

const tables: string[][][] = [];
const walkTables = (nodes: ContentNode[]) => {
  for (const n of nodes) {
    if (n.type === "table") tables.push(n.rows);
    if (n.type === "list") for (const item of n.items) walkTables(item.content);
  }
};
walkTables(anx1.content);

// template overview: first table, rows [code, name, description]
const overview = tables.find((t) => t[0]?.[0] === "Code model");
if (!overview) throw new Error("templateoverzicht niet gevonden");
const templates = new Map<string, RoiTemplate>();
for (const row of overview.slice(1)) {
  const code = clean(row[0] ?? "");
  if (!/^B_\d{2}\.\d{2}$/.test(code)) continue;
  templates.set(code, { code, name: clean(row[1] ?? ""), description: clean(row[2] ?? ""), columns: [] });
}

// per-template instruction tables: header starts with "Code kolom" and data
// rows carry full column codes
for (const t of tables) {
  if (clean(t[0]?.[0] ?? "") !== "Code kolom") continue;
  for (const row of t.slice(1)) {
    const m = clean(row[0] ?? "").match(/^B_(\d{2})\.(\d{2})\.\d{4}$/);
    if (!m) continue; // B_99.01 matrix rows land here too — they don't match
    const code = clean(row[0]);
    const tpl = templates.get(code.slice(0, 7));
    if (!tpl) continue;
    const mandatoryRaw = clean(row[4] ?? "");
    tpl.columns.push({
      code,
      label: clean(row[1] ?? ""),
      soort: clean(row[2] ?? ""),
      instruction: clean(row[3] ?? ""),
      mandatoryRaw,
      mandatory: mandatoryRaw === "Verplicht",
      ...sourceFor(code),
    });
  }
}

// ---------------------------------------------------------------- B_99.01 closed lists
// Matrix with ragged rows: a full row (>=4 cells) starts a group
// [R-code, columnCode, columnName, option]; shorter rows append options.

const closedLists: Record<string, string[]> = {};
{
  const matrix = tables.find((t) => (t[0]?.[1] ?? "").startsWith("B_99.01.C"));
  if (!matrix) throw new Error("B_99.01-matrix niet gevonden");
  let current: string | null = null;
  for (const row of matrix) {
    const first = clean(row[0] ?? "");
    if (!first.startsWith("B_99.01.R")) continue;
    if (row.length >= 4 && /^B_\d{2}\.\d{2}\.\d{4}$/.test(clean(row[1] ?? ""))) {
      current = clean(row[1]);
      closedLists[current] = [clean(row[3] ?? "")].filter(Boolean);
    } else if (current) {
      // continuation row: the option text is the second-to-last non-empty cell
      const opts = row.slice(1).map(clean).filter(Boolean);
      if (opts.length > 0) closedLists[current].push(opts[0]);
    }
  }
}

// The B_99.01 matrix still cites the pre-corrigendum numbering for one
// column: B_06.01.0110 ("Impact van stopzetting van de functie") is
// B_06.01.0100 in the corrected instruction table. Remap so every closed
// list resolves to an existing column.
const CLOSED_LIST_REMAP: Record<string, string> = { "B_06.01.0110": "B_06.01.0100" };
const allCodes = new Set([...templates.values()].flatMap((t) => t.columns.map((c) => c.code)));
for (const [from, to] of Object.entries(CLOSED_LIST_REMAP)) {
  if (closedLists[from] && !allCodes.has(from) && allCodes.has(to)) {
    closedLists[to] = closedLists[from];
    delete closedLists[from];
  }
}

// ---------------------------------------------------------------- annex III (S-codes)

const anx3 = annexes.find((a) => a.roman === "III");
const sTable = anx3?.content.find((n) => n.type === "table");
if (!sTable || sTable.type !== "table") throw new Error("S-codetabel niet gevonden");
const sCodes = sTable.rows.slice(1).map((r) => ({
  code: clean(r[0] ?? ""),
  label: clean(r[1] ?? "").replace(/^\d+\.\s*/, ""),
  description: clean(r[2] ?? ""),
}));

// ---------------------------------------------------------------- write

const schema = {
  meta: {
    source: "Uitvoeringsverordening (EU) 2024/2956, geconsolideerd 02024R2956-20241202 (incl. rectificatie 19.9.2025)",
    derived: "scripts/build-roi-schema.ts over data/generated/its/annexes.json",
  },
  templates: [...templates.values()],
  closedLists,
  sCodes,
};

writeFileSync(
  join(root, "data/generated/roi-schema.json"),
  JSON.stringify(schema, null, 1) + "\n",
);

const colCount = [...templates.values()].reduce((n, t) => n + t.columns.length, 0);
console.log(
  `roi-schema: ${templates.size} templates, ${colCount} kolommen, ${Object.keys(closedLists).length} gesloten lijsten, ${sCodes.length} S-codes`,
);
