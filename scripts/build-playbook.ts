/**
 * Builds data/generated/playbook.json from the curated playbook layer in
 * data/playbook/ (rule 2b editorial metadata, epic 11): merges both
 * playbooks + the coverage matrix and derives the reverse indexes consumed
 * by the UI and the MCP server. Never hand-edit the output.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  CoverageFile,
  GeneratedPlaybook,
  Playbook,
  PlaybookStepIndexEntry,
} from "../src/lib/playbook/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf-8"));

const entiteit = load<Playbook>("data/playbook/entiteit-v1.json");
const aanbieder = load<Playbook>("data/playbook/aanbieder-v1.json");
const coverage = load<CoverageFile>("data/playbook/coverage-v1.json");

const byStep: Record<string, PlaybookStepIndexEntry> = {};
for (const pb of [entiteit, aanbieder]) {
  for (const fase of pb.fases) {
    for (const step of fase.stappen) {
      byStep[step.id] = { step, playbook: pb.meta.kind, faseId: fase.id, faseTitel: fase.titel };
    }
  }
}

const dispositions: Record<string, number> = {};
let coverageEntries = 0;
for (const inst of Object.values(coverage.instruments)) {
  const entries = [
    ...Object.values(inst.artikelen).flatMap((byAnchor) => Object.values(byAnchor)),
    ...Object.values(inst.bijlagen),
  ];
  for (const e of entries) {
    coverageEntries++;
    dispositions[e.disposition] = (dispositions[e.disposition] ?? 0) + 1;
  }
}

const out: GeneratedPlaybook = {
  entiteit,
  aanbieder,
  coverage,
  byStep,
  counts: {
    steps: {
      entiteit: entiteit.fases.reduce((n, f) => n + f.stappen.length, 0),
      aanbieder: aanbieder.fases.reduce((n, f) => n + f.stappen.length, 0),
    },
    coverageEntries,
    dispositions,
  },
};

mkdirSync(join(root, "data/generated"), { recursive: true });
writeFileSync(join(root, "data/generated/playbook.json"), JSON.stringify(out, null, 1) + "\n");
console.log(
  `build-playbook: ${out.counts.steps.entiteit} entiteit- + ${out.counts.steps.aanbieder} aanbieder-stappen, ${coverageEntries} dekkingsentries`,
);
