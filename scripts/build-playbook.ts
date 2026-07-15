/**
 * Builds data/generated/playbook.json from the curated playbook layer in
 * data/playbook/ (rule 2b editorial metadata, epic 11): merges both
 * playbooks + the coverage matrix and derives the reverse indexes consumed
 * by the UI and the MCP server. Never hand-edit the output.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  CoverageFile,
  GeneratedPlaybook,
  Playbook,
  PlaybookStepIndexEntry,
} from "../src/lib/playbook/types";
import type { SearchDoc } from "../src/lib/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = <T>(rel: string): T => JSON.parse(readFileSync(join(root, rel), "utf-8"));

const entiteit = load<Playbook>("data/playbook/entiteit-v1.json");
const aanbieder = load<Playbook>("data/playbook/aanbieder-v1.json");
const coverage = load<CoverageFile>("data/playbook/coverage-v1.json");

const byStep: Record<string, PlaybookStepIndexEntry> = {};
// Epic 16 remainder: index every step as a `type:"stap"` SearchDoc so playbook
// steps are reachable from /zoeken, the Cmd-K palette and MCP search_dora.
const stapDocs: SearchDoc[] = [];
for (const pb of [entiteit, aanbieder]) {
  for (const fase of pb.fases) {
    for (const step of fase.stappen) {
      byStep[step.id] = { step, playbook: pb.meta.kind, faseId: fase.id, faseTitel: fase.titel };
      stapDocs.push({
        id: `stap-${step.id}`,
        type: "stap",
        instrument: pb.meta.kind,
        ref: `Fase ${fase.nr} — ${fase.titel}`,
        heading: step.titel,
        url: `/playbook/${pb.meta.kind}/${fase.id}#${step.id}`,
        text: `${fase.titel}. ${step.doel} ${step.acties.join(" ")}`,
      });
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

// Append the stap-docs to the corpus parse-corpus.ts already wrote (this script
// runs last in `npm run parse`), then re-copy to public/ like parse-corpus does.
const corpusPath = join(root, "data/generated/search-docs.json");
const docs = JSON.parse(readFileSync(corpusPath, "utf-8")) as SearchDoc[];
docs.push(...stapDocs);
writeFileSync(corpusPath, JSON.stringify(docs, null, 1) + "\n");
copyFileSync(corpusPath, join(root, "public/search-docs.json"));

console.log(
  `build-playbook: ${out.counts.steps.entiteit} entiteit- + ${out.counts.steps.aanbieder} aanbieder-stappen, ${coverageEntries} dekkingsentries, ${stapDocs.length} stap-docs`,
);
