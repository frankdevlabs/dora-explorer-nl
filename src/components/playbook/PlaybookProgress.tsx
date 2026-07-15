"use client";

import Link from "next/link";
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

/** Fase list for a playbook, overlaying per-fase completion counts (epic 16). */
export function PlaybookProgress({ kind, fases }: PlaybookProgressProps) {
  const done = useDone();
  const allIds = fases.flatMap((f) => f.stepIds);
  const total = allIds.length;
  const doneTotal = allIds.reduce((n, id) => n + (done[id] ? 1 : 0), 0);

  return (
    <div className="mb-6">
      {total > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted">
            <span className="font-medium text-foreground">{doneTotal}</span> van {total} stappen voltooid
          </span>
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
      )}

      <ol className="space-y-3">
        {fases.map((fase) => {
          const faseDone = fase.stepIds.reduce((n, id) => n + (done[id] ? 1 : 0), 0);
          const count = fase.stepIds.length;
          return (
            <li key={fase.id}>
              <Link
                href={`/playbook/${kind}/${fase.id}`}
                className="group block rounded-lg border border-line p-4 hover:border-accent"
              >
                <p className="font-semibold group-hover:text-accent">
                  Fase {fase.nr} — {fase.titel}
                </p>
                {fase.intro && <p className="mt-1 text-sm text-muted">{fase.intro}</p>}
                <p className="mt-2 text-xs text-muted">
                  {count === 1 ? "1 stap" : `${count} stappen`}
                  {count > 0 && (
                    <>
                      {" · "}
                      <span className={faseDone === count ? "text-accent" : ""}>
                        {faseDone}/{count} voltooid
                      </span>
                    </>
                  )}
                  {" · "}
                  {fase.instrumenten}
                </p>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
