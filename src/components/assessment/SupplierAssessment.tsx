"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ClipboardList, Download, Plus, Trash2, Upload } from "lucide-react";
import { getSupplierQuestionnaire } from "@/lib/assessment/data";
import { evaluateSupplier } from "@/lib/assessment/supplier-outcome";
import { questionById } from "@/lib/assessment/engine-core";
import {
  createArrangement,
  deleteArrangement,
  exportRoiJson,
  importRoiJson,
  setArrangementAnswer,
  useArrangements,
} from "@/lib/roi/store";
import { Wizard, useMounted } from "./Wizard";
import { ObligationList } from "./ObligationList";
import { CifBadge, Panel, downloadFile, formatDate, type Previews } from "./shared";

export function SupplierHome() {
  const arrangements = useArrangements();
  const router = useRouter();
  const [name, setName] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const questionnaire = getSupplierQuestionnaire();

  const start = () => {
    const arrangement = createArrangement(name);
    router.push(`/assessment/leverancier/vragenlijst?arr=${arrangement.id}`);
  };

  const onImport = async (file: File) => {
    const n = importRoiJson(await file.text());
    setImportMsg(n < 0 ? "Ongeldig bestand." : `${n} overeenkomst(en) geïmporteerd.`);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Eén beoordeling per <strong>contractuele overeenkomst</strong> met een derde aanbieder van
        ICT-diensten. De antwoorden bepalen of de aanvullende KOF-verplichtingen gelden en voeden
        het informatieregister.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">
            Naam van de aanbieder of de overeenkomst
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && start()}
            placeholder="Bijv. Ohpen Services BV — SaaS-kernsysteem"
            className="w-full rounded-md border border-line bg-background px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={start}
          className="flex h-9 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white dark:text-background"
        >
          <Plus className="size-4" /> Nieuwe beoordeling
        </button>
      </div>

      {arrangements.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">Overeenkomst</th>
                <th className="px-3 py-2 font-medium">Referentie</th>
                <th className="px-3 py-2 font-medium">KOF</th>
                <th className="px-3 py-2 font-medium">Voortgang</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {arrangements.map((a) => {
                const e = evaluateSupplier(questionnaire, a.answers);
                return (
                  <tr key={a.id} className="border-b border-line last:border-b-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/assessment/leverancier/vragenlijst?arr=${a.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted">
                      {a.answers["s1.1"] ?? ""}
                    </td>
                    <td className="px-3 py-2">
                      {!e.ictDienst ? (
                        <span className="text-muted">—</span>
                      ) : e.cifDienst ? (
                        <span className="text-orange-700 dark:text-orange-400">Ja</span>
                      ) : (
                        "Nee"
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {e.answered}/{e.total}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="inline-flex items-center gap-2">
                        <Link
                          href={`/assessment/leverancier/resultaat?arr=${a.id}`}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          <ClipboardList className="size-3.5" /> Resultaat
                        </Link>
                        <button
                          type="button"
                          aria-label={`Verwijder ${a.name}`}
                          onClick={() => {
                            if (window.confirm(`Beoordeling "${a.name}" verwijderen?`))
                              deleteArrangement(a.id);
                          }}
                          className="text-muted hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => downloadFile("dora-roi.json", "application/json", exportRoiJson())}
          className="flex h-8 items-center gap-1.5 rounded-md border border-line px-3 text-muted hover:text-foreground"
        >
          <Download className="size-3.5" /> Back-up (JSON)
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-8 items-center gap-1.5 rounded-md border border-line px-3 text-muted hover:text-foreground"
        >
          <Upload className="size-3.5" /> Importeer back-up
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = "";
          }}
        />
        {importMsg && <span className="text-muted">{importMsg}</span>}
      </div>
    </div>
  );
}

export function SupplierWizard({ previews }: { previews: Previews }) {
  const mounted = useMounted();
  const params = useSearchParams();
  const arrangements = useArrangements();
  const questionnaire = getSupplierQuestionnaire();
  const arrId = params.get("arr") ?? "";
  const arrangement = arrangements.find((a) => a.id === arrId);

  if (!mounted) return <div className="py-12 text-center text-sm text-muted">Laden…</div>;
  if (!arrangement) {
    return (
      <div className="py-12 text-center text-sm text-muted">
        Beoordeling niet gevonden.{" "}
        <Link href="/assessment/leverancier" className="text-accent hover:underline">
          Terug naar het overzicht
        </Link>
        .
      </div>
    );
  }
  return (
    <Wizard
      questionnaire={questionnaire}
      title={arrangement.name}
      answers={arrangement.answers}
      onAnswer={(qid, v) => setArrangementAnswer(arrangement.id, qid, v)}
      resultHref={`/assessment/leverancier/resultaat?arr=${arrangement.id}`}
      previews={previews}
    />
  );
}

export function SupplierOutcome({ previews }: { previews: Previews }) {
  const mounted = useMounted();
  const params = useSearchParams();
  const arrangements = useArrangements();
  const questionnaire = getSupplierQuestionnaire();
  const arrId = params.get("arr") ?? "";
  const arrangement = arrangements.find((a) => a.id === arrId);
  const evaluation = useMemo(
    () => (arrangement ? evaluateSupplier(questionnaire, arrangement.answers) : null),
    [questionnaire, arrangement],
  );

  if (!mounted) return <div className="py-12 text-center text-sm text-muted">Laden…</div>;
  if (!arrangement || !evaluation) {
    return (
      <div className="py-12 text-center text-sm text-muted">
        Beoordeling niet gevonden.{" "}
        <Link href="/assessment/leverancier" className="text-accent hover:underline">
          Terug naar het overzicht
        </Link>
        .
      </div>
    );
  }

  // RoI mapping preview: which template fields this assessment fills
  const roiRows = questionnaire.modules
    .flatMap((m) => m.questions)
    .filter((q) => q.roi && /^B_\d/.test(q.roi))
    .map((q) => ({
      code: q.roi!,
      qid: q.id,
      value: arrangement.answers[q.id] ?? "",
      label: questionById(questionnaire, q.id)?.text ?? "",
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{arrangement.name}</h1>
          <p className="text-xs text-muted">
            {evaluation.answered} van {evaluation.total} vragen beantwoord
            {arrangement.answers["s1.1"] ? ` · ref ${arrangement.answers["s1.1"]}` : ""}
          </p>
        </div>
        <Link
          href={`/assessment/leverancier/vragenlijst?arr=${arrangement.id}`}
          className="flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Terug naar de vragenlijst
        </Link>
      </div>

      {!evaluation.ictDienst ? (
        <Panel>
          <p className="text-sm text-muted">
            Op basis van module 2 is dit géén ICT-dienst in de zin van artikel 3, punt 21, DORA:
            het ICT-derdenrisicokader (register, contracteisen) is niet van toepassing op deze
            overeenkomst.
          </p>
        </Panel>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <CifBadge cif={evaluation.cifDienst} />
            {evaluation.intraGroep && (
              <span className="inline-block rounded-full border border-line bg-surface px-3 py-0.5 text-sm text-muted">
                Intra-groep
              </span>
            )}
          </div>

          {evaluation.openActions.length > 0 && (
            <Panel title={`Openstaande acties (${evaluation.openActions.length})`}>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {evaluation.openActions.map((o) => (
                  <li key={o.questionId}>
                    <span className="mr-1 font-mono text-xs text-muted">{o.questionId}</span>
                    {o.text}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Basisverplichtingen — alle ICT-overeenkomsten (art. 28, lid 4–8; art. 30, lid 2)">
            <ObligationList
              questionnaire={questionnaire}
              obligations={evaluation.baseline}
              previews={previews}
            />
          </Panel>

          {evaluation.cifDienst ? (
            <Panel title="Aanvullende verplichtingen — kritieke of belangrijke functie (art. 30, lid 3; RTS 2025/532; volledige keten in het register)">
              <ObligationList
                questionnaire={questionnaire}
                obligations={evaluation.cifExtra}
                previews={previews}
              />
            </Panel>
          ) : (
            <Panel>
              <p className="text-sm text-muted">
                De dienst ondersteunt geen kritieke of belangrijke functie: de aanvullende
                bepalingen van artikel 30, lid 3, de onderaannemingsvoorwaarden van RTS 2025/532
                en de ketenregistratie (B_05.02) zijn niet verplicht. De overeenkomst blijft wél
                registerplichtig (alle ICT-diensten, art. 28, lid 3) en moet aan artikel 30,
                lid 2, voldoen. Let op het evenredigheidsbeginsel (art. 4): niet over-uitvragen.
              </p>
            </Panel>
          )}

          {roiRows.length > 0 && (
            <Panel title="Informatieregister — velden gevuld door dit assessment">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      <th className="py-1.5 pr-3 font-medium">Kolomcode</th>
                      <th className="py-1.5 pr-3 font-medium">Vraag</th>
                      <th className="py-1.5 font-medium">Waarde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roiRows.map((r) => (
                      <tr key={r.code + r.qid} className="border-b border-line last:border-b-0">
                        <td className="py-1.5 pr-3 font-mono text-xs">{r.code}</td>
                        <td className="max-w-md truncate py-1.5 pr-3 text-xs text-muted" title={r.label}>
                          {r.label}
                        </td>
                        <td className="py-1.5">
                          {r.value || <span className="text-xs text-muted">— nog leeg</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">
                Overige registervelden (kosten, datums, keten) vult u in het{" "}
                <Link href="/register" className="text-accent hover:underline">
                  informatieregister
                </Link>
                .
              </p>
            </Panel>
          )}

          {evaluation.timeline.length > 0 && (
            <Panel title="Toepasselijke data">
              <ul className="space-y-2 text-sm">
                {evaluation.timeline.map((t) => (
                  <li key={`${t.date}-${t.label}`} className="flex gap-3">
                    <span className="w-36 shrink-0 font-mono text-xs text-muted">
                      {formatDate(t.date)}
                    </span>
                    <span className="min-w-0 break-words">{t.label}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
