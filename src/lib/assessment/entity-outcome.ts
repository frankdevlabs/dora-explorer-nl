import {
  computeVisibility,
  obligationStatuses,
  progress,
  questionById,
  answerLabel,
} from "./engine-core";
import type { EntityEvaluation, EntityRegime, Questionnaire, TimelineEntry } from "./types";

/**
 * Outcome adapter for the entity-level DORA assessment (entity-v1.json).
 * Flag vocabulary (set by question effects):
 *   in_scope, uitgesloten (art 2(3)), micro (micro-onderneming, art 3 punt
 *   60), vereenvoudigd (art 16(1) entity), groep, tlpt_aangewezen,
 *   ctpp_gebruik, cif_uitbesteed.
 */

const REGIME_LABELS: Record<EntityRegime, string> = {
  "buiten-scope": "Buiten het toepassingsgebied van DORA",
  volledig: "Volledig DORA-regime",
  vereenvoudigd: "Vereenvoudigd kader voor ICT-risicobeheer (art. 16)",
  micro: "Micro-onderneming — proportionele toepassing",
};

export function regimeLabel(r: EntityRegime): string {
  return REGIME_LABELS[r];
}

function buildTimeline(flags: Set<string>): TimelineEntry[] {
  const t: TimelineEntry[] = [
    { date: "2025-01-17", label: "DORA (Verordening (EU) 2022/2554): van toepassing." },
    {
      date: "2025-07-22",
      label:
        "Onderaannemings-RTS (Gedelegeerde Verordening (EU) 2025/532): in werking — voorwaarden voor onderaanneming van ICT-diensten die kritieke of belangrijke functies ondersteunen.",
    },
    {
      date: "2025-12-31",
      label:
        "Referentiedatum informatieregister rapportagecyclus 2026 (art. 28, lid 3; ITS 2024/2956).",
    },
    {
      date: "2026-03-22",
      label:
        "Indieningsdeadline informatieregister bij de AFM (2026-cyclus, xBRL-CSV; DNB: 20 maart).",
    },
  ];
  if (flags.has("tlpt_aangewezen")) {
    t.push({
      date: "2025-01-17",
      label:
        "TLPT-cyclus (art. 26): ten minste om de drie jaar dreigingsgestuurde penetratietests; kalender in overleg met de aangewezen autoriteit.",
    });
  }
  return t.sort((a, b) => a.date.localeCompare(b.date));
}

export function evaluateEntity(
  questionnaire: Questionnaire,
  answers: Record<string, string>,
): EntityEvaluation {
  const ctx = computeVisibility(questionnaire, answers);
  const { flags } = ctx;

  const inScope = flags.has("in_scope") && !flags.has("uitgesloten");
  const regime: EntityRegime = !inScope
    ? "buiten-scope"
    : flags.has("micro")
      ? "micro"
      : flags.has("vereenvoudigd")
        ? "vereenvoudigd"
        : "volledig";

  const obligations = inScope ? obligationStatuses(questionnaire, answers, ctx) : [];
  const openActions = obligations.filter((o) => o.status === "actie");
  const { answered, total } = progress(questionnaire, answers, ctx);

  return {
    answered,
    total,
    inScope,
    entityTypeLabel: answerLabel(questionById(questionnaire, "e1.3"), answers["e1.3"]),
    regime,
    regimeLabel: REGIME_LABELS[regime],
    obligations,
    openActions,
    timeline: inScope ? buildTimeline(flags) : [],
    flags,
  };
}
