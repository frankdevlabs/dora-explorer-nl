/**
 * Shared playbook UI tokens (Playbook Redesign, juli 2026). The priority
 * palette translates the design prototype's hardcoded light-mode hex into the
 * app's CSS-variable tokens + Tailwind palette so dark mode keeps working:
 * fundament → accent (blue), kern → teal, verdieping → muted/slate. Reused by
 * PlaybookSteps (grouping, chips, segmented bar), PlaybookProgress and
 * PlaybookIndexCards. Data-side priorities live in src/lib/playbook/types.ts.
 */
import type { Prioriteit } from "./types";

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
