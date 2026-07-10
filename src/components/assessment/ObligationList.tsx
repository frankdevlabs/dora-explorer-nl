"use client";

import { AlertCircle, CheckCircle2, CircleDashed, MinusCircle } from "lucide-react";
import type { ObligationStatus, Questionnaire } from "@/lib/assessment/types";
import { RefRow, type Previews } from "./shared";

const STATUS_META = {
  voldaan: { label: "Voldaan", icon: CheckCircle2, cls: "text-green-600 dark:text-green-400" },
  actie: { label: "Actie nodig", icon: AlertCircle, cls: "text-red-600 dark:text-red-400" },
  nvt: { label: "N.v.t.", icon: MinusCircle, cls: "text-muted" },
  open: { label: "Nog niet beantwoord", icon: CircleDashed, cls: "text-muted" },
} as const;

/** Obligation checklist grouped per module; groups with actions auto-open. */
export function ObligationList({
  questionnaire,
  obligations,
  previews,
}: {
  questionnaire: Questionnaire;
  obligations: ObligationStatus[];
  previews: Previews;
}) {
  const byModule = new Map<string, ObligationStatus[]>();
  for (const o of obligations) {
    (byModule.get(o.moduleId) ?? byModule.set(o.moduleId, []).get(o.moduleId)!).push(o);
  }
  return (
    <div className="space-y-2">
      {questionnaire.modules
        .filter((m) => byModule.has(m.id))
        .map((m) => {
          const items = byModule.get(m.id)!;
          const attention = items.some((o) => o.status === "actie" || o.status === "open");
          return (
            <details
              key={m.id}
              open={attention}
              className="rounded-lg border border-line bg-surface"
            >
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                {m.title}{" "}
                <span className="text-xs font-normal text-muted">
                  ({items.filter((o) => o.status === "voldaan").length}/{items.length} voldaan)
                </span>
              </summary>
              <ul className="space-y-2 border-t border-line p-3">
                {items.map((o) => {
                  const meta = STATUS_META[o.status];
                  const Icon = meta.icon;
                  return (
                    <li key={o.questionId} className="flex items-start gap-2 text-sm">
                      <Icon className={`mt-0.5 size-4 shrink-0 ${meta.cls}`} />
                      <span className="min-w-0">
                        <span className="mr-2 font-mono text-xs text-muted">{o.questionId}</span>
                        {o.text}
                        <span className={`ml-2 text-xs ${meta.cls}`}>({meta.label})</span>
                        <RefRow refs={o.refs} previews={previews} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
    </div>
  );
}
