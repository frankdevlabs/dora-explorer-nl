"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { RelatedRecital } from "@/lib/data";
import { INSTRUMENTS, type InstrumentId } from "@/lib/instruments";

function InstrumentTag({ instrument }: { instrument: string }) {
  if (instrument === "dora") return null;
  return (
    <span className="ml-1.5 rounded border border-line px-1 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-muted">
      {INSTRUMENTS[instrument as InstrumentId]?.label ?? instrument}
    </span>
  );
}

/** Collapsible panel with the recitals mapped to the current article
 *  (curated editorial layer; default collapsed). */
export function RelatedRecitals({ recitals }: { recitals: RelatedRecital[] }) {
  const [open, setOpen] = useState(false);
  if (recitals.length === 0) return null;
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="mt-8">
      <Collapsible.Trigger className="flex w-full items-center justify-between gap-2 rounded-md border border-line px-3 py-2 text-left text-sm font-medium hover:bg-surface">
        <span>
          Relevante overwegingen <span className="font-normal text-muted">({recitals.length})</span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Collapsible.Trigger>
      <Collapsible.Content>
        <ul className="mt-2 space-y-2 rounded-md border border-line p-3">
          {recitals.map((r) => (
            <li key={`${r.instrument}-${r.number}`} className="text-sm">
              <Link href={r.href} className="font-medium text-accent hover:underline">
                Overweging {r.number}
              </Link>
              <InstrumentTag instrument={r.instrument} />{" "}
              <span className="text-muted">{r.snippet}</span>
            </li>
          ))}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export interface L2PanelLink {
  target: string;
  lid?: number;
  label: string;
  href: string;
}

/** Collapsible panel: ITS/RTS provisions implementing this DORA article. */
export function L2Panel({ links }: { links: L2PanelLink[] }) {
  const [open, setOpen] = useState(false);
  if (links.length === 0) return null;
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="mt-4">
      <Collapsible.Trigger className="flex w-full items-center justify-between gap-2 rounded-md border border-line px-3 py-2 text-left text-sm font-medium hover:bg-surface">
        <span>
          Uitvoeringsbepalingen (ITS/RTS){" "}
          <span className="font-normal text-muted">({links.length})</span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Collapsible.Trigger>
      <Collapsible.Content>
        <ul className="mt-2 space-y-2 rounded-md border border-line p-3">
          {links.map((l) => {
            // target forms: "<id>" | "<id>:<artikel>" | "<id>:bijlage:<roman>"
            const [id, ...parts] = l.target.split(":");
            const inst = INSTRUMENTS[id as InstrumentId]?.label ?? id;
            const name =
              parts[0] === "bijlage"
                ? `${inst} bijlage ${parts[1].toUpperCase()}`
                : parts[0]
                  ? `${inst} art. ${parts[0]}`
                  : inst;
            return (
              <li key={l.target + (l.lid ?? "")} className="text-sm">
                <Link href={l.href} className="font-medium text-accent hover:underline">
                  {name}
                </Link>
                {l.lid !== undefined && (
                  <span className="ml-1.5 text-xs text-muted">(grondslag lid {l.lid})</span>
                )}{" "}
                <span className="text-muted">{l.label}</span>
              </li>
            );
          })}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
