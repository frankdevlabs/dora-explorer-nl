import type { ObligationStatus, QCondition, Question, Questionnaire } from "./types";

/**
 * Questionnaire-agnostic engine core: the forward visibility/flag pass and
 * the obligation-status projection. No UI or storage coupling; exercised
 * directly by scripts/verify-assessment.ts. Outcome interpretation lives in
 * the per-questionnaire adapters (entity-outcome.ts, supplier-outcome.ts),
 * which may pass a deriveFlags hook for flags computed between questions.
 *
 * Flag derivation is a single forward pass over modules in document order:
 * conditions may only reference flags set by *earlier* questions (the verify
 * script asserts this). Effects of questions that are currently hidden are
 * ignored, so stale answers from abandoned branches cannot leak into the
 * outcome.
 */

export interface VisibilityContext {
  flags: Set<string>;
  visibleModules: Set<string>;
  visibleQuestions: Set<string>;
}

export type DeriveFlags = (flags: Set<string>) => void;

export function evalCondition(
  cond: QCondition,
  flags: Set<string>,
  answers: Record<string, string>,
): boolean {
  if (cond.all) return cond.all.every((c) => evalCondition(c, flags, answers));
  if (cond.any) return cond.any.some((c) => evalCondition(c, flags, answers));
  if (cond.not) return !evalCondition(cond.not, flags, answers);
  if (cond.flag) return flags.has(cond.flag);
  if (cond.answer) {
    const v = answers[cond.answer.q];
    const want = cond.answer.is;
    return Array.isArray(want) ? want.includes(v) : v === want;
  }
  return true;
}

/** Forward pass: flags + visibility for every module/question. */
export function computeVisibility(
  questionnaire: Questionnaire,
  answers: Record<string, string>,
  deriveFlags: DeriveFlags = () => {},
): VisibilityContext {
  const flags = new Set<string>();
  const visibleModules = new Set<string>();
  const visibleQuestions = new Set<string>();
  for (const mod of questionnaire.modules) {
    deriveFlags(flags);
    const moduleVisible = !mod.showIf || evalCondition(mod.showIf, flags, answers);
    if (moduleVisible) visibleModules.add(mod.id);
    for (const q of mod.questions) {
      deriveFlags(flags);
      const visible = moduleVisible && (!q.showIf || evalCondition(q.showIf, flags, answers));
      if (!visible) continue;
      visibleQuestions.add(q.id);
      const answer = answers[q.id];
      if (answer === undefined || answer === "") continue;
      for (const effect of q.effects ?? []) {
        const match = Array.isArray(effect.when)
          ? effect.when.includes(answer)
          : effect.when === answer;
        if (match) flags.add(effect.setFlag);
      }
    }
  }
  deriveFlags(flags);
  return { flags, visibleModules, visibleQuestions };
}

export function answerLabel(q: Question | undefined, value: string | undefined): string {
  if (!q || value === undefined || value === "") return "";
  if (q.answerType === "choice") {
    return q.options?.find((o) => o.value === value)?.label ?? value;
  }
  if (value === "ja") return "Ja";
  if (value === "nee") return "Nee";
  if (value === "nvt") return "N.v.t.";
  return value;
}

export function questionById(questionnaire: Questionnaire, id: string): Question | undefined {
  for (const m of questionnaire.modules) {
    const q = m.questions.find((x) => x.id === id);
    if (q) return q;
  }
  return undefined;
}

export function obligationStatuses(
  questionnaire: Questionnaire,
  answers: Record<string, string>,
  ctx: VisibilityContext,
): ObligationStatus[] {
  const out: ObligationStatus[] = [];
  for (const mod of questionnaire.modules) {
    for (const q of mod.questions) {
      if (!q.obligation || !ctx.visibleQuestions.has(q.id)) continue;
      const v = answers[q.id];
      const status: ObligationStatus["status"] =
        v === "ja" ? "voldaan" : v === "nee" ? "actie" : v === "nvt" ? "nvt" : "open";
      out.push({ questionId: q.id, moduleId: mod.id, text: q.text, status, refs: q.refs });
    }
  }
  return out;
}

/** Progress: answered / total over currently visible questions. */
export function progress(
  questionnaire: Questionnaire,
  answers: Record<string, string>,
  ctx: VisibilityContext,
): { answered: number; total: number } {
  const total = questionnaire.modules
    .flatMap((m) => m.questions)
    .filter((q) => ctx.visibleQuestions.has(q.id)).length;
  const answered = Object.entries(answers).filter(
    ([id, v]) => v !== "" && ctx.visibleQuestions.has(id),
  ).length;
  return { answered, total };
}

// ---------------------------------------------------------------------------
// Export helpers (pure; used by UI and verify script)

export function sanitizeCell(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").trim();
}

export function toTsv(rows: string[][]): string {
  return rows.map((r) => r.join("\t")).join("\n");
}

export function toCsv(rows: string[][]): string {
  const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
}
