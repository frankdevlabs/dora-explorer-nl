import { computeVisibility, obligationStatuses, progress } from "./engine-core";
import type { Questionnaire, SupplierEvaluation, TimelineEntry } from "./types";

/**
 * Outcome adapter for the supplier/TPRM assessment (supplier-v1.json).
 * Flag vocabulary (set by question effects):
 *   ict_dienst (art 3 punt 21 gate), intra_groep, kof_functie (the supported
 *   function is critical/important), cif_dienst (the service supports a CIF
 *   — the master switch), subcontracting_toegestaan.
 *
 * Obligations split: modules m8 (art 30(3)), m9 (RTS 2025/532) and the
 * CIF-gated questions elsewhere are the "CIF extra" set; everything else is
 * baseline (all ICT arrangements, art 28(4)-(8) + art 30(2)).
 */

/** Modules whose obligations only exist for CIF-supporting services. */
const CIF_MODULES = new Set(["m8", "m9", "m11"]);
/** CIF-gated questions living in otherwise-baseline modules. */
const CIF_QUESTIONS = new Set(["s5.2", "s6.3", "s6.4", "s10.2"]);

function buildTimeline(flags: Set<string>): TimelineEntry[] {
  const t: TimelineEntry[] = [
    { date: "2025-01-17", label: "DORA van toepassing — contractuele minimumbepalingen (art. 30, lid 2) gelden voor alle ICT-contracten." },
  ];
  if (flags.has("cif_dienst")) {
    t.push(
      {
        date: "2025-07-22",
        label:
          "Onderaannemings-RTS in werking: voorwaarden voor het toestaan van onderaanneming van deze dienst (RTS art. 3–6).",
      },
      {
        date: "2025-12-31",
        label:
          "Referentiedatum informatieregister: deze overeenkomst, de aanbieder én de daadwerkelijk ondersteunende onderaannemers (B_05.02) moeten geregistreerd zijn.",
      },
      {
        date: "2026-03-22",
        label: "AFM-indiening informatieregister 2026-cyclus (xBRL-CSV; DNB: 20 maart).",
      },
    );
  }
  return t.sort((a, b) => a.date.localeCompare(b.date));
}

export function evaluateSupplier(
  questionnaire: Questionnaire,
  answers: Record<string, string>,
): SupplierEvaluation {
  const ctx = computeVisibility(questionnaire, answers);
  const { flags } = ctx;

  const ictDienst = flags.has("ict_dienst");
  const cifDienst = flags.has("cif_dienst");

  const all = ictDienst ? obligationStatuses(questionnaire, answers, ctx) : [];
  const cifExtra = all.filter(
    (o) => CIF_MODULES.has(o.moduleId) || CIF_QUESTIONS.has(o.questionId),
  );
  const baseline = all.filter(
    (o) => !CIF_MODULES.has(o.moduleId) && !CIF_QUESTIONS.has(o.questionId),
  );
  const openActions = all.filter((o) => o.status === "actie");
  const { answered, total } = progress(questionnaire, answers, ctx);

  return {
    answered,
    total,
    ictDienst,
    cifDienst,
    intraGroep: flags.has("intra_groep"),
    baseline,
    cifExtra,
    openActions,
    timeline: ictDienst ? buildTimeline(flags) : [],
    flags,
  };
}
