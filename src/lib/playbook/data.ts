import playbookJson from "../../../data/generated/playbook.json";
import type {
  DocIndexEntry,
  DocumentType,
  GeneratedPlaybook,
  Playbook,
  PlaybookStepIndexEntry,
} from "./types";

const gen = playbookJson as unknown as GeneratedPlaybook;

export type PlaybookKind = "entiteit" | "aanbieder";

export const PLAYBOOK_KINDS: PlaybookKind[] = ["entiteit", "aanbieder"];

export function getPlaybook(kind: PlaybookKind): Playbook {
  return kind === "entiteit" ? gen.entiteit : gen.aanbieder;
}

export function getCoverage() {
  return gen.coverage;
}

export function getStepIndex(): Record<string, PlaybookStepIndexEntry> {
  return gen.byStep;
}

export function getDocuments(): DocumentType[] {
  return gen.documenten;
}

export function getDocIndex(): Record<string, DocIndexEntry> {
  return gen.byDoc;
}

export function getPlaybookCounts() {
  return gen.counts;
}
