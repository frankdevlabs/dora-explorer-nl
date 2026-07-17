#!/usr/bin/env node
// One-off migration helper (epic 17): apply a per-step bewijsstukken mapping to
// a playbook step file, preserving formatting (re-serialize indent=2 + collapse
// {docId,detail} objects to one line — proven byte-identical on unchanged data).
// Usage: node apply-bewijs-mapping.mjs <stepFile> <mappingJson>
// mapping = { "<stepId>": [ "free text" | {"docId":"..","detail":".."}, ... ] }
import { readFileSync, writeFileSync } from "node:fs";

const [, , stepFile, mappingFile] = process.argv;
if (!stepFile || !mappingFile) {
  console.error("usage: apply-bewijs-mapping.mjs <stepFile> <mappingJson>");
  process.exit(2);
}

const data = JSON.parse(readFileSync(stepFile, "utf8"));
const mapping = JSON.parse(readFileSync(mappingFile, "utf8"));
const seen = new Set();
let applied = 0;

for (const fase of data.fases) {
  for (const step of fase.stappen) {
    if (!(step.id in mapping)) continue;
    seen.add(step.id);
    step.bewijsstukken = mapping[step.id];
    applied++;
  }
}

const missing = Object.keys(mapping).filter((id) => !seen.has(id));
if (missing.length) {
  console.error(`ERROR: mapping has unknown step ids: ${missing.join(", ")}`);
  process.exit(1);
}

let out = JSON.stringify(data, null, 2);
// Collapse {docId[,detail]} objects onto a single line to match house style.
out = out.replace(/\{\s*"docId":[\s\S]*?\}/g, (m) => {
  const o = JSON.parse(m);
  const keys = Object.keys(o);
  if (!keys.every((k) => k === "docId" || k === "detail")) return m;
  const parts = ["docId", "detail"]
    .filter((k) => k in o)
    .map((k) => `"${k}": ${JSON.stringify(o[k])}`);
  return `{ ${parts.join(", ")} }`;
});
writeFileSync(stepFile, out + "\n");
console.log(`applied ${applied} step mappings to ${stepFile}`);
