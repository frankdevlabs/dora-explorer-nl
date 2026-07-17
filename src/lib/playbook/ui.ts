/**
 * Shared playbook UI tokens (Playbook Redesign, juli 2026). The priority
 * palette translates the design prototype's hardcoded light-mode hex into the
 * app's CSS-variable tokens + Tailwind palette so dark mode keeps working:
 * fundament → accent (blue), kern → teal, verdieping → muted/slate. Reused by
 * PlaybookSteps (grouping, chips, segmented bar), PlaybookProgress and
 * PlaybookIndexCards. Data-side priorities live in src/lib/playbook/types.ts.
 */
import type { DocCategory, Prioriteit } from "./types";

/** Display order of the priority groups (design: fundament → kern → verdieping). */
export const PRIO_ORDER: readonly Prioriteit[] = ["fundament", "kern", "verdieping"];

export interface PrioStyle {
  label: string;
  /** Pill/badge: border + background + text. */
  chip: string;
  /** Small legend/group dot: background. */
  dot: string;
  /** Progress-bar segment: background. */
  bar: string;
  /** Action bullet: text color. */
  bullet: string;
}

export const PRIO: Record<Prioriteit, PrioStyle> = {
  fundament: {
    label: "fundament",
    chip: "border-accent/50 bg-accent/10 text-accent",
    dot: "bg-accent",
    bar: "bg-accent",
    bullet: "text-accent",
  },
  kern: {
    label: "kern",
    chip: "border-teal-600/40 bg-teal-600/10 text-teal-700 dark:text-teal-300",
    dot: "bg-teal-600 dark:bg-teal-400",
    bar: "bg-teal-600 dark:bg-teal-400",
    bullet: "text-teal-600 dark:text-teal-400",
  },
  verdieping: {
    label: "verdieping",
    chip: "border-line bg-surface text-muted",
    dot: "bg-slate-400 dark:bg-slate-500",
    bar: "bg-slate-400 dark:bg-slate-500",
    bullet: "text-muted",
  },
};

/** Defensive fallback for a step without a (recognised) priority. */
export const PRIO_FALLBACK: PrioStyle = {
  label: "overig",
  chip: "border-line bg-surface text-muted",
  dot: "bg-slate-400 dark:bg-slate-500",
  bar: "bg-slate-400 dark:bg-slate-500",
  bullet: "text-muted",
};

export function prioStyle(p: Prioriteit | undefined): PrioStyle {
  return p ? PRIO[p] : PRIO_FALLBACK;
}

// ---------------------------------------------------------------------------
// Document-type catalog (epic 17). Single source of truth for the category
// label + pill styling, shared by the Documentenregister, the step card and
// the search results/palette. Data-side categories live in types.ts.

/** Display order of the document categories (register groups + selector). */
export const CATEGORY_ORDER: readonly DocCategory[] = [
  "beleid",
  "register",
  "plan",
  "procedure",
  "verslag",
  "rapportage",
  "overeenkomst",
  "memo",
];

export const CATEGORY_LABEL: Record<DocCategory, string> = {
  beleid: "Beleid",
  register: "Register",
  plan: "Plan",
  procedure: "Procedure",
  verslag: "Verslag",
  rapportage: "Rapportage",
  overeenkomst: "Overeenkomst",
  memo: "Memo",
};

/** Pill styling (border + background + text) per category. */
export const CATEGORY_STYLE: Record<DocCategory, string> = {
  beleid: "border-accent/50 bg-accent/10 text-accent",
  register: "border-teal-600/40 bg-teal-600/10 text-teal-700 dark:text-teal-300",
  plan: "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  procedure: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  verslag: "border-line bg-surface text-muted",
  rapportage: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  overeenkomst: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  memo: "border-line bg-surface text-muted",
};
