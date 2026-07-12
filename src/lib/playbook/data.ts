import playbookJson from "../../../data/generated/playbook.json";
import type { GeneratedPlaybook, Playbook, PlaybookStepIndexEntry } from "./types";

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

export function getPlaybookCounts() {
  return gen.counts;
}
