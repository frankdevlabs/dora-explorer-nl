"use client";

import type { ReactNode } from "react";
import { RefLink } from "@/components/content/RefLink";
import type { RefPreview } from "@/lib/data";
import type { EntityRegime, HelpContent, QRef } from "@/lib/assessment/types";

export type Previews = Record<string, RefPreview>;

const MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

export function formatDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export function RefRow({ refs, previews }: { refs?: QRef[]; previews: Previews }) {
  if (!refs || refs.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-muted">
      {refs.map((ref, i) => (
        <span key={ref.href}>
          {i > 0 && " · "}
          <RefLink
            href={ref.href}
            title={previews[ref.href]?.title}
            snippet={previews[ref.href]?.snippet}
          >
            {ref.label}
          </RefLink>
        </span>
      ))}
    </p>
  );
}

/** Editorial help/intro: a plain string or a sequence of paragraphs and bullet lists. */
export function HelpText({ content, className }: { content: HelpContent; className: string }) {
  const blocks = typeof content === "string" ? [content] : content;
  return (
    <div className={className}>
      {blocks.map((b, i) =>
        typeof b === "string" ? (
          <p key={i}>{b}</p>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.bullets.map((li, j) => (
              <li key={j}>{li}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

const REGIME_STYLE: Record<EntityRegime, string> = {
  "buiten-scope": "border-line bg-surface text-muted",
  volledig: "border-accent/50 bg-accent/10 text-accent",
  vereenvoudigd: "border-green-600/50 bg-green-600/10 text-green-700 dark:text-green-400",
  micro: "border-green-600/50 bg-green-600/10 text-green-700 dark:text-green-400",
};

export function RegimeBadge({ regime, label }: { regime: EntityRegime; label: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-3 py-0.5 text-sm font-medium ${REGIME_STYLE[regime]}`}
    >
      {label}
    </span>
  );
}

export function CifBadge({ cif }: { cif: boolean }) {
  return (
    <span
      className={`inline-block rounded-full border px-3 py-0.5 text-sm font-medium ${
        cif
          ? "border-orange-600/50 bg-orange-600/10 text-orange-700 dark:text-orange-400"
          : "border-green-600/50 bg-green-600/10 text-green-700 dark:text-green-400"
      }`}
    >
      {cif
        ? "Ondersteunt een kritieke of belangrijke functie"
        : "Geen kritieke of belangrijke functie"}
    </span>
  );
}

export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      {title && <h2 className="mb-3 text-sm font-semibold tracking-tight">{title}</h2>}
      {children}
    </section>
  );
}

export function downloadFile(name: string, mime: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  // revoke async: a synchronous revoke can abort the pending blob download
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
