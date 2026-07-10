"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { getSupplierQuestionnaire } from "@/lib/assessment/data";
import { useMounted } from "@/components/assessment/Wizard";
import { Panel, downloadFile } from "@/components/assessment/shared";
import {
  supplierRequestCsv,
  supplierRequestItems,
  supplierRequestMarkdown,
  templateCsv,
} from "@/lib/roi/export";
import { resolveTemplate, templateCompleteness, type ResolvedField } from "@/lib/roi/mapping";
import { ARRANGEMENT_TEMPLATES, ENTITY_TEMPLATE, getRoiSchema, getTemplate } from "@/lib/roi/schema";
import {
  addChainRow,
  deleteChainRow,
  setEntityField,
  setManualField,
  updateChainRow,
  useRoiState,
} from "@/lib/roi/store";
import { isValidLei, validateField } from "@/lib/roi/validate";
import type { RoiArrangement } from "@/lib/roi/types";

const ORIGIN_LABEL = {
  manual: "handmatig",
  assessment: "uit assessment",
  auto: "afgeleid",
  leeg: "leeg",
} as const;

function OriginTag({ field }: { field: ResolvedField }) {
  const cls =
    field.origin === "assessment"
      ? "border-accent/40 text-accent"
      : field.origin === "auto"
        ? "border-green-600/40 text-green-700 dark:text-green-400"
        : field.origin === "manual"
          ? "border-orange-600/40 text-orange-700 dark:text-orange-400"
          : "border-line text-muted";
  return (
    <span className={`rounded border px-1 py-0.5 text-[10px] uppercase tracking-wide ${cls}`}>
      {ORIGIN_LABEL[field.origin]}
      {field.overridden ? " — wijkt af van assessment" : ""}
    </span>
  );
}

/** Entity block (B_01.01) editor. */
function EntityBlock() {
  const schema = getRoiSchema();
  const state = useRoiState();
  const template = getTemplate(ENTITY_TEMPLATE)!;
  const entity = state.entity ?? {};
  return (
    <Panel title={`${template.code} — ${template.name}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {template.columns.map((c) => {
          const value = entity[c.code] ?? "";
          const issue = validateField(c, value, schema.closedLists[c.code]);
          return (
            <label key={c.code} className="block">
              <span className="mb-1 block text-xs text-muted">
                <span className="font-mono">{c.code}</span> · {c.label}
                {c.mandatory && <span className="text-red-600"> *</span>}
              </span>
              <input
                type="text"
                value={value}
                onChange={(e) => setEntityField(c.code, e.target.value)}
                className="w-full rounded-md border border-line bg-background px-2 py-1.5 text-sm"
              />
              {issue && value !== "" && (
                <span className="mt-0.5 block text-xs text-red-600">{issue.message}</span>
              )}
              {c.code === "B_01.01.0010" && value !== "" && isValidLei(value) && (
                <span className="mt-0.5 block text-xs text-green-700 dark:text-green-400">
                  LEI-checksum geldig.
                </span>
              )}
            </label>
          );
        })}
      </div>
    </Panel>
  );
}

/** Per-arrangement completeness across the v1 templates. */
function arrangementGaps(
  arrangement: RoiArrangement,
  entity: Record<string, string>,
): { filled: number; total: number } {
  const schema = getRoiSchema();
  const questionnaire = getSupplierQuestionnaire();
  let filled = 0;
  let total = 0;
  for (const tpl of ARRANGEMENT_TEMPLATES) {
    const fields = resolveTemplate(schema, questionnaire, arrangement, entity, tpl);
    const c = templateCompleteness(fields);
    filled += c.filled;
    total += c.total;
  }
  return { filled, total };
}

function ExportPanel() {
  const schema = getRoiSchema();
  const questionnaire = getSupplierQuestionnaire();
  const state = useRoiState();
  const dl = (code: string) =>
    downloadFile(`${code}.csv`, "text/csv", templateCsv(schema, questionnaire, state, code));
  return (
    <Panel title="Export — CSV per template (kolomcodes conform ITS)">
      <p className="mb-3 text-xs text-muted">
        Eén CSV per registermodel, kolomkoppen = exacte ITS-kolomcodes. Deze bestanden voeden de
        xBRL-CSV-indiening (AFM) of het DNB-Excel-template, maar zijn niet zelf het
        indieningspakket. Zie de{" "}
        <Link href="/register/handleiding" className="text-accent hover:underline">
          handleiding
        </Link>
        .
      </p>
      <div className="flex flex-wrap gap-1.5">
        {schema.templates.map((t) => (
          <button
            key={t.code}
            type="button"
            onClick={() => dl(t.code)}
            title={t.name}
            className="flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs text-muted hover:text-foreground"
          >
            <Download className="size-3" /> {t.code}
          </button>
        ))}
        <button
          type="button"
          onClick={() => schema.templates.forEach((t) => dl(t.code))}
          className="flex h-8 items-center gap-1.5 rounded-md border border-accent px-2.5 text-xs font-medium text-accent"
        >
          <Download className="size-3" /> Alle templates
        </button>
      </div>
    </Panel>
  );
}

export function RegisterWorkbench() {
  const mounted = useMounted();
  const state = useRoiState();
  if (!mounted) return <div className="py-12 text-center text-sm text-muted">Laden…</div>;
  const entity = state.entity ?? {};

  return (
    <div className="space-y-6">
      <EntityBlock />

      <Panel title="Contractuele overeenkomsten">
        {state.arrangements.length === 0 ? (
          <p className="text-sm text-muted">
            Nog geen overeenkomsten. Start met het{" "}
            <Link href="/assessment/leverancier" className="text-accent hover:underline">
              leveranciersassessment
            </Link>{" "}
            — elke beoordeling wordt hier een registerrecord.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-2 py-2 font-medium">Overeenkomst</th>
                  <th className="px-2 py-2 font-medium">Referentie</th>
                  <th className="px-2 py-2 font-medium">Verplichte velden</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {state.arrangements.map((a) => {
                  const gaps = arrangementGaps(a, entity);
                  const complete = gaps.filled === gaps.total;
                  return (
                    <tr key={a.id} className="border-b border-line last:border-b-0">
                      <td className="px-2 py-2 font-medium">{a.name}</td>
                      <td className="px-2 py-2 font-mono text-xs text-muted">
                        {a.answers["s1.1"] ?? ""}
                      </td>
                      <td className="px-2 py-2">
                        <span className={complete ? "text-green-700 dark:text-green-400" : ""}>
                          {gaps.filled}/{gaps.total}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className="inline-flex items-center gap-3">
                          <Link
                            href={`/register/overeenkomst?arr=${a.id}`}
                            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                          >
                            <Pencil className="size-3.5" /> Registervelden
                          </Link>
                          <SupplierRequestButtons arrangement={a} entity={entity} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <ExportPanel />
    </div>
  );
}

/** Download buttons for the vendor data request (Deel B) of one arrangement. */
function SupplierRequestButtons({
  arrangement,
  entity,
}: {
  arrangement: RoiArrangement;
  entity: Record<string, string>;
}) {
  const schema = getRoiSchema();
  const questionnaire = getSupplierQuestionnaire();
  const open = supplierRequestItems(schema, questionnaire, arrangement, entity).length;
  const slug = (arrangement.answers["s1.1"] || arrangement.id).replace(/[^\w-]+/g, "_");
  return (
    <button
      type="button"
      title={`Uitvraag naar de aanbieder: ${open} openstaande velden (markdown + CSV)`}
      onClick={() => {
        downloadFile(
          `uitvraag-${slug}.md`,
          "text/markdown",
          supplierRequestMarkdown(schema, questionnaire, arrangement, entity),
        );
        downloadFile(
          `uitvraag-${slug}.csv`,
          "text/csv",
          supplierRequestCsv(schema, questionnaire, arrangement, entity),
        );
      }}
      className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
    >
      <FileText className="size-3.5" /> Uitvraag ({open})
    </button>
  );
}

/** One template section in the record editor. */
function TemplateSection({
  arrangement,
  templateCode,
  entity,
}: {
  arrangement: RoiArrangement;
  templateCode: string;
  entity: Record<string, string>;
}) {
  const schema = getRoiSchema();
  const questionnaire = getSupplierQuestionnaire();
  const template = getTemplate(templateCode)!;
  const fields = resolveTemplate(schema, questionnaire, arrangement, entity, templateCode);
  const completeness = templateCompleteness(fields);

  return (
    <Panel
      title={`${template.code} — ${template.name} (${completeness.filled}/${completeness.total} verplicht gevuld)`}
    >
      <div className="space-y-3">
        {fields.map((f) => {
          const issue = validateField(f.column, f.value, schema.closedLists[f.column.code]);
          return (
            <div key={f.column.code} className="rounded-md border border-line p-2.5">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-mono">{f.column.code}</span>
                <span>{f.column.label}</span>
                {f.column.mandatory && <span className="text-red-600">*</span>}
                <OriginTag field={f} />
              </div>
              <input
                type="text"
                value={arrangement.manual?.[f.column.code] ?? ""}
                placeholder={
                  f.origin === "leeg" ? "" : f.value ? `${f.value}` : ""
                }
                onChange={(e) => setManualField(arrangement.id, f.column.code, e.target.value)}
                className="w-full rounded-md border border-line bg-background px-2 py-1.5 text-sm placeholder:text-foreground/70"
                title={f.column.instruction}
              />
              {issue && (
                <p
                  className={`mt-1 text-xs ${
                    issue.severity === "fout" ? "text-red-600" : "text-orange-600"
                  }`}
                >
                  {issue.message}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/** B_05.02 chain editor: one row per (sub)contractor in the supply chain. */
function ChainEditor({ arrangement }: { arrangement: RoiArrangement }) {
  const rows = arrangement.chain ?? [];
  return (
    <Panel title="B_05.02 — Toeleveringsketen (ranking per ITS art. 2)">
      <p className="mb-3 text-xs text-muted">
        Rang 1 = de directe aanbieder; rang &gt; 1 alleen voor onderaannemers die de kritieke of
        belangrijke dienst daadwerkelijk ondersteunen (ITS art. 3, lid 2). Ontvanger = wie de
        dienst van deze partij afneemt (bij rang 1: de identificatiecode van de aanbieder zelf).
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-2 py-1.5 font-medium">Rang</th>
              <th className="px-2 py-1.5 font-medium">S-code</th>
              <th className="px-2 py-1.5 font-medium">LEI/EUID aanbieder</th>
              <th className="px-2 py-1.5 font-medium">Soort code</th>
              <th className="px-2 py-1.5 font-medium">LEI/EUID ontvanger</th>
              <th className="px-2 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-b-0 align-top">
                <td className="px-2 py-1.5">
                  <input
                    value={r.rank}
                    onChange={(e) => updateChainRow(arrangement.id, r.id, { rank: e.target.value })}
                    className="w-14 rounded-md border border-line bg-background px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={r.serviceType}
                    placeholder="S17"
                    onChange={(e) =>
                      updateChainRow(arrangement.id, r.id, { serviceType: e.target.value })
                    }
                    className="w-20 rounded-md border border-line bg-background px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={r.providerCode}
                    onChange={(e) =>
                      updateChainRow(arrangement.id, r.id, { providerCode: e.target.value })
                    }
                    className={`w-56 rounded-md border bg-background px-2 py-1 font-mono text-xs ${
                      r.providerCode && r.codeType === "lei" && !isValidLei(r.providerCode)
                        ? "border-red-600/60"
                        : "border-line"
                    }`}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    value={r.codeType}
                    onChange={(e) =>
                      updateChainRow(arrangement.id, r.id, { codeType: e.target.value })
                    }
                    className="rounded-md border border-line bg-background px-2 py-1 text-sm"
                  >
                    <option value="lei">LEI</option>
                    <option value="euid">EUID</option>
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    value={r.recipientCode}
                    onChange={(e) =>
                      updateChainRow(arrangement.id, r.id, { recipientCode: e.target.value })
                    }
                    className="w-56 rounded-md border border-line bg-background px-2 py-1 font-mono text-xs"
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    type="button"
                    aria-label="Verwijder ketenrij"
                    onClick={() => deleteChainRow(arrangement.id, r.id)}
                    className="text-muted hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => addChainRow(arrangement.id)}
        className="mt-3 flex h-8 items-center gap-1.5 rounded-md border border-line px-3 text-xs text-muted hover:text-foreground"
      >
        <Plus className="size-3.5" /> Ketenrij toevoegen
      </button>
    </Panel>
  );
}

export function ArrangementEditor() {
  const mounted = useMounted();
  const params = useSearchParams();
  const state = useRoiState();
  const arrId = params.get("arr") ?? "";
  const arrangement = state.arrangements.find((a) => a.id === arrId);
  const entity = useMemo(() => state.entity ?? {}, [state.entity]);

  if (!mounted) return <div className="py-12 text-center text-sm text-muted">Laden…</div>;
  if (!arrangement) {
    return (
      <div className="py-12 text-center text-sm text-muted">
        Overeenkomst niet gevonden.{" "}
        <Link href="/register" className="text-accent hover:underline">
          Terug naar het register
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{arrangement.name}</h1>
          <p className="text-xs text-muted">
            Registervelden per ITS-template · assessmentwaarden komen live mee; typ om te
            overschrijven (leegmaken herstelt de assessmentwaarde).
          </p>
        </div>
        <span className="flex items-center gap-2">
          <Link
            href={`/assessment/leverancier/vragenlijst?arr=${arrangement.id}`}
            className="flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted hover:text-foreground"
          >
            Assessment
          </Link>
          <Link
            href="/register"
            className="flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Register
          </Link>
        </span>
      </div>

      {ARRANGEMENT_TEMPLATES.filter((t) => t !== "B_05.02").map((t) => (
        <TemplateSection
          key={t}
          arrangement={arrangement}
          templateCode={t}
          entity={entity}
        />
      ))}
      <ChainEditor arrangement={arrangement} />
    </div>
  );
}
