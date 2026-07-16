"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PlaybookKind } from "@/lib/playbook/data";
import { resetKind, useDone } from "@/lib/playbook/store";

export interface FaseSummary {
  id: string;
  nr: number;
  titel: string;
  intro?: string;
  instrumenten: string;
  stepIds: string[];
}

interface PlaybookProgressProps {
  kind: PlaybookKind;
  fases: FaseSummary[];
}

/** Fase list for a playbook, overlaying per-fase completion (epic 16 + redesign). */
export function PlaybookProgress({ kind, fases }: PlaybookProgressProps) {
  const done = useDone();
  const allIds = fases.flatMap((f) => f.stepIds);
  const total = allIds.length;
  const doneTotal = allIds.reduce((n, id) => n + (done[id] ? 1 : 0), 0);
  const totalPct = total ? Math.round((doneTotal / total) * 100) : 0;

  return (
    <div className="mb-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        {total > 0 && (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-accent tabular-nums">{totalPct}%</span>
            <span className="text-sm text-muted">
              {doneTotal} / {total} stappen voltooid
            </span>
          </div>
        )}
        {doneTotal > 0 && (
          <button
            type="button"
            onClick={() => resetKind(allIds)}
            className="rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:text-foreground"
          >
            Voortgang wissen
          </button>
        )}
      </div>

      <ol className="space-y-3">
        {fases.map((fase) => {
          const count = fase.stepIds.length;
          const faseDone = fase.stepIds.reduce((n, id) => n + (done[id] ? 1 : 0), 0);
          const pct = count ? Math.round((faseDone / count) * 100) : 0;
          const complete = count > 0 && faseDone === count;
          const isRef = count === 0;
          return (
            <li key={fase.id}>
              <Link
                href={`/playbook/${kind}/${fase.id}`}
                className={`group flex items-center gap-4 rounded-lg border border-line p-4 hover:border-accent ${
                  isRef ? "opacity-70" : ""
                }`}
              >
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-lg font-mono text-base font-medium ${
                    complete ? "bg-accent text-white" : "bg-accent/10 text-accent"
                  }`}
                >
                  {String(fase.nr).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold group-hover:text-accent">
                      Fase {fase.nr} — {fase.titel}
                    </p>
                    {isRef ? (
                      <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] text-muted">
                        referentie
                      </span>
                    ) : (
                      <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                        uitgewerkt
                      </span>
                    )}
                  </div>
                  {fase.intro && <p className="mt-1 text-sm text-muted">{fase.intro}</p>}
                  <p className="mt-1 text-xs text-muted">{fase.instrumenten}</p>
                </div>

                {count > 0 && (
                  <div className="hidden w-36 shrink-0 sm:block">
                    <div className="mb-1.5 flex justify-between text-[11px] text-muted tabular-nums">
                      <span>
                        {faseDone}/{count}
                      </span>
                      <span className={complete ? "text-accent" : ""}>{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                <ChevronRight className="size-4 shrink-0 text-muted" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
