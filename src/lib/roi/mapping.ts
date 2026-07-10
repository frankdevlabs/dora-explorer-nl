/**
 * Field resolution for the register workbench: for every template column,
 * where does the value come from? Re-run on render, never copied — the
 * supplier assessment stays the source for its fields; manual overrides are
 * stored separately and win (marked "wijkt af van assessment" in the UI).
 *
 * Resolution order per column:
 *   1. manual override on the arrangement (arrangement.manual[code])
 *   2. supplier-assessment answer (schema source "assessment:<qid>")
 *   3. auto-derivable value (single-entity register: joins, own LEI)
 *   4. empty
 */
import type { Questionnaire } from "../assessment/types";
import { questionById, answerLabel } from "../assessment/engine-core";
import type { RoiColumn, RoiSchema } from "./schema";
import type { RoiArrangement } from "./types";

export interface ResolvedField {
  column: RoiColumn;
  value: string;
  /** Where the value came from (manual wins over assessment). */
  origin: "manual" | "assessment" | "auto" | "leeg";
  /** True when a manual override hides a differing assessment answer. */
  overridden: boolean;
}

/** Official closed-list text for a numeric choice value ("2" → "2. …"). */
function officialListValue(schema: RoiSchema, code: string, value: string): string {
  const list = schema.closedLists[code];
  if (!list) return value;
  const hit = list.find((o) => o.startsWith(`${value}.`));
  return hit ?? value;
}

function assessmentValue(
  schema: RoiSchema,
  questionnaire: Questionnaire,
  arrangement: RoiArrangement,
  column: RoiColumn,
): string {
  const qid = column.source.startsWith("assessment:") ? column.source.slice(11) : null;
  if (!qid) return "";
  const raw = arrangement.answers[qid] ?? "";
  if (raw === "") return "";
  const q = questionById(questionnaire, qid);
  if (q?.answerType === "choice") {
    // closed-list columns get the official list text; S-codes stay codes
    if (/^S\d{2}$/.test(raw)) return raw;
    if (schema.closedLists[column.code]) return officialListValue(schema, column.code, raw);
    return answerLabel(q, raw);
  }
  if (q?.answerType === "janee" || q?.answerType === "janeenvt") return answerLabel(q, raw);
  return raw;
}

function autoValue(arrangement: RoiArrangement, entity: Record<string, string>, code: string): string {
  const contractRef = arrangement.answers["s1.1"] ?? "";
  const ownLei = entity["B_01.01.0010"] ?? "";
  const ownName = entity["B_01.01.0020"] ?? "";
  const providerId = arrangement.answers["s1.3"] ?? "";
  const serviceType = arrangement.answers["s1.5"] ?? "";
  switch (code) {
    case "B_02.02.0010":
    case "B_05.02.0010":
    case "B_07.01.0010":
      return contractRef;
    case "B_02.02.0020":
    case "B_03.01.0020":
    case "B_04.01.0020":
    case "B_06.01.0040":
      return ownLei;
    case "B_03.01.0010":
    case "B_04.01.0010":
      return contractRef;
    case "B_03.01.0030":
    case "B_04.01.0030":
      return ownName;
    case "B_03.02.0010":
      return contractRef;
    case "B_03.02.0020":
    case "B_07.01.0020":
      return providerId;
    case "B_07.01.0040":
      return serviceType;
    case "B_06.01.0010":
      return contractRef ? `F-${contractRef}` : "";
    default:
      return "";
  }
}

/** Resolve every column of a template for one arrangement. */
export function resolveTemplate(
  schema: RoiSchema,
  questionnaire: Questionnaire,
  arrangement: RoiArrangement,
  entity: Record<string, string>,
  templateCode: string,
): ResolvedField[] {
  const template = schema.templates.find((t) => t.code === templateCode);
  if (!template) return [];
  return template.columns.map((column) => {
    const manual = arrangement.manual?.[column.code] ?? "";
    const fromAssessment = assessmentValue(schema, questionnaire, arrangement, column);
    if (manual !== "") {
      return {
        column,
        value: manual,
        origin: "manual" as const,
        overridden: fromAssessment !== "" && fromAssessment !== manual,
      };
    }
    if (fromAssessment !== "") {
      return { column, value: fromAssessment, origin: "assessment" as const, overridden: false };
    }
    const auto = autoValue(arrangement, entity, column.code);
    if (auto !== "") return { column, value: auto, origin: "auto" as const, overridden: false };
    return { column, value: "", origin: "leeg" as const, overridden: false };
  });
}

/** Mandatory-completeness per template: [filled, totalMandatory]. */
export function templateCompleteness(fields: ResolvedField[]): { filled: number; total: number } {
  const mandatory = fields.filter((f) => f.column.mandatory);
  return {
    filled: mandatory.filter((f) => f.value.trim() !== "").length,
    total: mandatory.length,
  };
}
