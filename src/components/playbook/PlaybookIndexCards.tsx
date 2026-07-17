"use client";

import Link from "next/link";
import { ChevronRight, FileStack, Table2 } from "lucide-react";
import type { PlaybookKind } from "@/lib/playbook/data";
import { useDone } from "@/lib/playbook/store";

export interface IndexCard {
  key: PlaybookKind;
  mono: string;
  tag: string;
  titel: string;
  beschrijving: string;
  faseCount: number;
  stapCount: number;
  stepIds: string[];
}

export interface DekkingCard {
  covered: number;
  universe: number;
  complete: boolean;
}

export interface DocumentenCard {
  count: number;
  complete: boolean;
}

const TILE: Record<PlaybookKind, string> = {
  entiteit: "bg-accent/10 text-accent",
  aanbieder: "bg-teal-600/10 text-teal-700 dark:text-teal-300",
};

/** Index cards with live per-playbook progress (redesign, Screen 1). */
export function PlaybookIndexCards({
  playbooks,
  dekking,
  documenten,
}: {
  playbooks: IndexCard[];
  dekking: DekkingCard;
  documenten: DocumentenCard;
}) {
  const done = useDone();

  return (
    <>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        {playbooks.map((pb) => {
          const doneCount = pb.stepIds.reduce((n, id) => n + (done[id] ? 1 : 0), 0);
          const pct = pb.stapCount ? Math.round((doneCount / pb.stapCount) * 100) : 0;
          return (
            <Link
              key={pb.key}
              href={`/playbook/${pb.key}`}
              className="group flex flex-col rounded-xl border border-line p-6 hover:border-accent"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-lg font-mono text-sm font-semibold ${TILE[pb.key]}`}
                >
                  {pb.mono}
                </span>
                <span className="font-mono text-[11px] tracking-wide text-muted uppercase">
                  {pb.tag}
                </span>
              </div>
              <p className="mt-4 text-lg font-semibold group-hover:text-accent">{pb.titel}</p>
              <p className="mt-2 flex-1 text-sm text-muted">{pb.beschrijving}</p>
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between font-mono text-[11px] text-muted">
                  <span>
                    {pb.faseCount} fasen · {pb.stapCount} stappen
                  </span>
                  <span className="text-accent tabular-nums">{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/playbook/dekking"
        className="group mb-6 flex items-center gap-5 rounded-xl border border-line p-6 hover:border-accent"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface text-muted">
          <Table2 className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold group-hover:text-accent">Dekkingsregister</p>
          <p className="mt-1 text-sm text-muted">
            Elke bepaling van alle 13 instrumenten afgezet tegen de stappen die haar afdekken —
            zie in één register waar bewijs ontbreekt ({dekking.covered} van {dekking.universe}{" "}
            bepalingen gedekt{dekking.complete ? " en gereviewd" : " — in opbouw"}).
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-accent">
          Openen <ChevronRight className="size-4" />
        </span>
      </Link>

      <Link
        href="/playbook/documenten"
        className="group mb-6 flex items-center gap-5 rounded-xl border border-line p-6 hover:border-accent"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface text-muted">
          <FileStack className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold group-hover:text-accent">Documentenregister</p>
          <p className="mt-1 text-sm text-muted">
            Alle documenten, beleidsstukken, registers en plannen die DORA verwacht — elk met zijn
            wettelijke basis en de stappen die het opleveren
            {documenten.count > 0
              ? ` (${documenten.count} documenten${documenten.complete ? " en gereviewd" : " — in opbouw"}).`
              : " (in opbouw)."}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-accent">
          Openen <ChevronRight className="size-4" />
        </span>
      </Link>
    </>
  );
}
