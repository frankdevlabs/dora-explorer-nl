import schemaJson from "../../../data/generated/roi-schema.json";

/**
 * Typed access to the derived RoI schema (data/generated/roi-schema.json,
 * built by scripts/build-roi-schema.ts from the parsed ITS annexes).
 */

export interface RoiColumn {
  code: string;
  label: string;
  soort: string;
  instruction: string;
  mandatoryRaw: string;
  mandatory: boolean;
  /** assessment:<qid> | auto | supplier | manual */
  source: string;
  askSupplier: boolean;
}

export interface RoiTemplate {
  code: string;
  name: string;
  description: string;
  columns: RoiColumn[];
}

export interface RoiSchema {
  meta: { source: string; derived: string };
  templates: RoiTemplate[];
  closedLists: Record<string, string[]>;
  sCodes: { code: string; label: string; description: string }[];
}

const schema = schemaJson as unknown as RoiSchema;

export function getRoiSchema(): RoiSchema {
  return schema;
}

export function getTemplate(code: string): RoiTemplate | undefined {
  return schema.templates.find((t) => t.code === code);
}

/** Templates the register workbench edits per arrangement (v1 scope). */
export const ARRANGEMENT_TEMPLATES = ["B_02.01", "B_02.02", "B_05.01", "B_05.02", "B_06.01", "B_07.01"];

/** The entity block template (one record per register). */
export const ENTITY_TEMPLATE = "B_01.01";
