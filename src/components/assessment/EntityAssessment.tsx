"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ClipboardList, Download, Plus, Trash2, Upload } from "lucide-react";
import { getEntityQuestionnaire } from "@/lib/assessment/data";
import { evaluateEntity } from "@/lib/assessment/entity-outcome";
import {
  createEntity,
  deleteEntity,
  exportStateJson,
  importStateJson,
  setEntityAnswer,
  useEntityAssessments,
} from "@/lib/assessment/store";
import { Wizard, useMounted } from "./Wizard";
import { ObligationList } from "./ObligationList";
import { Panel, RegimeBadge, downloadFile, formatDate, type Previews } from "./shared";

export function EntityHome() {
  const entities = useEntityAssessments();
  const router = useRouter();
  const [name, setName] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const questionnaire = getEntityQuestionnaire();

  const start = () => {
    const entity = createEntity(name);
    router.push(`/assessment/entiteit/vragenlijst?ent=${entity.id}`);
  };

  const onImport = async (file: File) => {
    const n = importStateJson(await file.text());
    setImportMsg(n < 0 ? "Ongeldig bestand." : `${n} beoordeling(en) geïmporteerd.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">
            Naam van de financiële entiteit
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && start()}
            placeholder="Bijv. Stichting Voorbeeldfonds"
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

      {entities.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">Entiteit</th>
                <th className="px-3 py-2 font-medium">Regime</th>
                <th className="px-3 py-2 font-medium">Voortgang</th>
                <th className="px-3 py-2 font-medium">Laatst gewijzigd</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {entities.map((s) => {
                const e = evaluateEntity(questionnaire, s.answers);
                return (
                  <tr key={s.id} className="border-b border-line last:border-b-0">
                    <td className="px-3 py-2">
                      <Link
                        href={`/assessment/entiteit/vragenlijst?ent=${s.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{e.regimeLabel}</td>
                    <td className="px-3 py-2 text-muted">
                      {e.answered}/{e.total}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {new Date(s.updatedAt).toLocaleDateString("nl-NL")}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="inline-flex items-center gap-2">
                        <Link
                          href={`/assessment/entiteit/resultaat?ent=${s.id}`}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          <ClipboardList className="size-3.5" /> Resultaat
                        </Link>
                        <button
                          type="button"
                          aria-label={`Verwijder ${s.name}`}
                          onClick={() => {
                            if (window.confirm(`Beoordeling "${s.name}" verwijderen?`))
                              deleteEntity(s.id);
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
          onClick={() =>
            downloadFile("dora-entiteitsassessments.json", "application/json", exportStateJson())
          }
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

export function EntityWizard({ previews }: { previews: Previews }) {
  const mounted = useMounted();
  const params = useSearchParams();
  const entities = useEntityAssessments();
  const questionnaire = getEntityQuestionnaire();
  const entId = params.get("ent") ?? "";
  const entity = entities.find((s) => s.id === entId);

  if (!mounted) return <div className="py-12 text-center text-sm text-muted">Laden…</div>;
  if (!entity) {
    return (
      <div className="py-12 text-center text-sm text-muted">
        Beoordeling niet gevonden.{" "}
        <Link href="/assessment/entiteit" className="text-accent hover:underline">
          Terug naar het overzicht
        </Link>
        .
      </div>
    );
  }
  return (
    <Wizard
      questionnaire={questionnaire}
      title={entity.name}
      answers={entity.answers}
      onAnswer={(qid, v) => setEntityAnswer(entity.id, qid, v)}
      resultHref={`/assessment/entiteit/resultaat?ent=${entity.id}`}
      previews={previews}
    />
  );
}

export function EntityOutcome({ previews }: { previews: Previews }) {
  const mounted = useMounted();
  const params = useSearchParams();
  const entities = useEntityAssessments();
  const questionnaire = getEntityQuestionnaire();
  const entId = params.get("ent") ?? "";
  const entity = entities.find((s) => s.id === entId);
  const evaluation = useMemo(
    () => (entity ? evaluateEntity(questionnaire, entity.answers) : null),
    [questionnaire, entity],
  );

  if (!mounted) return <div className="py-12 text-center text-sm text-muted">Laden…</div>;
  if (!entity || !evaluation) {
    return (
      <div className="py-12 text-center text-sm text-muted">
        Beoordeling niet gevonden.{" "}
        <Link href="/assessment/entiteit" className="text-accent hover:underline">
          Terug naar het overzicht
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{entity.name}</h1>
          <p className="text-xs text-muted">
            {evaluation.answered} van {evaluation.total} vragen beantwoord
            {evaluation.entityTypeLabel ? ` · ${evaluation.entityTypeLabel}` : ""}
          </p>
        </div>
        <Link
          href={`/assessment/entiteit/vragenlijst?ent=${entity.id}`}
          className="flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Terug naar de vragenlijst
        </Link>
      </div>

      <RegimeBadge regime={evaluation.regime} label={evaluation.regimeLabel} />

      {!evaluation.inScope ? (
        <Panel>
          <p className="text-sm text-muted">
            Op basis van de antwoorden valt de entiteit buiten het toepassingsgebied van DORA
            (artikel 2). Controleer de scope-vragen in module 2; bij twijfel over de precieze
            categorie is formele toetsing aan artikel 2, lid 1, aangewezen.
          </p>
        </Panel>
      ) : (
        <>
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

          <Panel title="Verplichtingen-checklist">
            <ObligationList
              questionnaire={questionnaire}
              obligations={evaluation.obligations}
              previews={previews}
            />
          </Panel>

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

          <p className="text-xs text-muted">
            Handhaving: overtreding van artikel 28 (ICT-derdenrisicobeheer, inclusief het
            informatieregister) valt in Nederland in boetecategorie 3 (basisbedrag € 2 mln).
            Gebruik het{" "}
            <Link href="/assessment/leverancier" className="text-accent hover:underline">
              leveranciersassessment
            </Link>{" "}
            per ICT-overeenkomst en het{" "}
            <Link href="/register" className="text-accent hover:underline">
              informatieregister
            </Link>{" "}
            voor de registratie.
          </p>
        </>
      )}
    </div>
  );
}
