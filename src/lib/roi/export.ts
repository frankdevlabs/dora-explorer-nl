/**
 * RoI exports (epic 8), pure and fixture-tested by scripts/verify-roi.ts:
 *
 * 1. One CSV per ITS template. Header row 1 = exact column codes, row 2 =
 *    Dutch labels; one data row per record. Plain CSVs aligned to the EBA
 *    table layout — suitable for repackaging into the AFM xBRL-CSV
 *    submission or the DNB Excel template, but NOT themselves the
 *    submission package.
 *
 * 2. The supplier data request ("leveranciersuitvraag", Deel B of an
 *    Ohpen-style annex): per arrangement all askSupplier columns that are
 *    still empty, as markdown and CSV.
 */
import type { Questionnaire } from "../assessment/types";
import { toCsv } from "../assessment/engine-core";
import { resolveTemplate } from "./mapping";
import type { RoiSchema, RoiTemplate } from "./schema";
import type { RoiArrangement, RoiState } from "./types";

const CHAIN_COLUMNS: Record<string, keyof import("./types").RoiChainRow> = {
  "B_05.02.0020": "serviceType",
  "B_05.02.0030": "providerCode",
  "B_05.02.0040": "codeType",
  "B_05.02.0050": "rank",
  "B_05.02.0060": "recipientCode",
};

function headerRows(template: RoiTemplate): string[][] {
  return [template.columns.map((c) => c.code), template.columns.map((c) => c.label)];
}

/** Rows for one template across the whole register state. */
export function templateRows(
  schema: RoiSchema,
  questionnaire: Questionnaire,
  state: RoiState,
  templateCode: string,
): string[][] {
  const template = schema.templates.find((t) => t.code === templateCode);
  if (!template) return [];
  const rows = headerRows(template);
  const entity = state.entity ?? {};

  if (templateCode === "B_01.01") {
    rows.push(template.columns.map((c) => entity[c.code] ?? ""));
    return rows;
  }
  if (templateCode === "B_01.02") {
    // single-entity register: the group list is the entity itself
    rows.push(
      template.columns.map((c) => {
        if (c.code === "B_01.02.0010") return entity["B_01.01.0010"] ?? "";
        if (c.code === "B_01.02.0020") return entity["B_01.01.0020"] ?? "";
        if (c.code === "B_01.02.0030") return entity["B_01.01.0030"] ?? "";
        return "";
      }),
    );
    return rows;
  }
  if (templateCode === "B_05.02") {
    for (const a of state.arrangements) {
      const contractRef = a.answers["s1.1"] ?? "";
      for (const link of a.chain ?? []) {
        rows.push(
          template.columns.map((c) => {
            if (c.code === "B_05.02.0010") return contractRef;
            const key = CHAIN_COLUMNS[c.code];
            if (key === "codeType") return link.codeType === "euid" ? "EUID" : "LEI";
            return key ? String(link[key] ?? "") : "";
          }),
        );
      }
    }
    return rows;
  }
  if (templateCode === "B_02.03") {
    // intra-group arrangements only
    for (const a of state.arrangements) {
      if (a.answers["s3.1"] !== "ja") continue;
      rows.push(
        template.columns.map((c) =>
          c.code.endsWith("0010") ? (a.answers["s1.1"] ?? "") : "",
        ),
      );
    }
    return rows;
  }
  if (["B_03.03", "B_99.01", "B_01.03"].includes(templateCode)) {
    // group/branch/terminology scenarios: header-only in v1
    return rows;
  }
  for (const a of state.arrangements) {
    const fields = resolveTemplate(schema, questionnaire, a, entity, templateCode);
    rows.push(fields.map((f) => f.value));
  }
  return rows;
}

export function templateCsv(
  schema: RoiSchema,
  questionnaire: Questionnaire,
  state: RoiState,
  templateCode: string,
): string {
  return toCsv(templateRows(schema, questionnaire, state, templateCode));
}

// ---------------------------------------------------------------- supplier data request

export interface SupplierRequestItem {
  code: string;
  label: string;
  instruction: string;
  mandatoryRaw: string;
}

/** Empty askSupplier fields for one arrangement — what to ask the vendor. */
export function supplierRequestItems(
  schema: RoiSchema,
  questionnaire: Questionnaire,
  arrangement: RoiArrangement,
  entity: Record<string, string>,
): SupplierRequestItem[] {
  const out: SupplierRequestItem[] = [];
  for (const template of schema.templates) {
    const fields = resolveTemplate(schema, questionnaire, arrangement, entity, template.code);
    for (const f of fields) {
      if (!f.column.askSupplier || f.value.trim() !== "") continue;
      out.push({
        code: f.column.code,
        label: f.column.label,
        instruction: f.column.instruction,
        mandatoryRaw: f.column.mandatoryRaw,
      });
    }
  }
  // chain rows are always part of the request when the service supports a CIF
  return out;
}

export function supplierRequestMarkdown(
  schema: RoiSchema,
  questionnaire: Questionnaire,
  arrangement: RoiArrangement,
  entity: Record<string, string>,
): string {
  const items = supplierRequestItems(schema, questionnaire, arrangement, entity);
  const provider = arrangement.answers["s1.2"] || arrangement.name;
  const contractRef = arrangement.answers["s1.1"] || "—";
  const cif = arrangement.answers["s5.1"] === "ja";
  const lines = [
    `# Gegevensuitvraag informatieregister DORA — ${provider}`,
    "",
    `Contractreferentie: ${contractRef}`,
    "",
    "In het kader van artikel 28, lid 3, van Verordening (EU) 2022/2554 (DORA) en " +
      "Uitvoeringsverordening (EU) 2024/2956 verzoeken wij u de onderstaande gegevens aan te " +
      "leveren, machineleesbaar en conform de ITS-taxonomie (LEI ISO 17442; EUID alleen voor " +
      "EU-entiteiten; landcodes ISO 3166-1 alpha-2; diensttypen S01–S19 uit bijlage III van de ITS).",
    "",
  ];
  if (cif) {
    lines.push(
      "De dienst ondersteunt een **kritieke of belangrijke functie**: lever daarom ook de " +
        "volledige keten van onderaannemers die de dienst daadwerkelijk ondersteunen " +
        "(model B_05.02): per onderaannemer de LEI/EUID, het diensttype (S-code), de rang " +
        "(direct = 1, dieper > 1) en de afnemer binnen de keten. Wijzigingen in de keten " +
        "vernemen wij vooraf (Gedelegeerde Verordening (EU) 2025/532, art. 5).",
      "",
    );
  }
  lines.push("| Veld (ITS-code) | Omschrijving | Verplicht |", "| --- | --- | --- |");
  for (const item of items) {
    lines.push(`| ${item.code} | ${item.label} | ${item.mandatoryRaw} |`);
  }
  lines.push(
    "",
    "Actualisering: ten minste jaarlijks vóór de referentiedatum (31 december) en tussentijds " +
      "bij elke materiële wijziging (nieuwe onderaannemer, locatiewijziging, wijziging van de " +
      "dienst).",
  );
  return lines.join("\n");
}

export function supplierRequestCsv(
  schema: RoiSchema,
  questionnaire: Questionnaire,
  arrangement: RoiArrangement,
  entity: Record<string, string>,
): string {
  const items = supplierRequestItems(schema, questionnaire, arrangement, entity);
  return toCsv([
    ["ITS-code", "Omschrijving", "Instructie", "Verplicht", "Waarde (in te vullen door aanbieder)"],
    ...items.map((i) => [i.code, i.label, i.instruction, i.mandatoryRaw, ""]),
  ]);
}
