import entityJson from "../../../data/questionnaire/entity-v1.json";
import supplierJson from "../../../data/questionnaire/supplier-v1.json";
import type { Questionnaire } from "./types";

const entity = entityJson as unknown as Questionnaire;
const supplier = supplierJson as unknown as Questionnaire;

export function getEntityQuestionnaire(): Questionnaire {
  return entity;
}

export function getSupplierQuestionnaire(): Questionnaire {
  return supplier;
}
