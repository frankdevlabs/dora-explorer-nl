"use client";

import { RefRow, type Previews } from "@/components/assessment/shared";
import type { PlaybookKind } from "@/lib/playbook/data";
import type { PlaybookRegime, PlaybookStep, Prioriteit } from "@/lib/playbook/types";
import { setRegime, toggleStep, useDone, useRegime } from "@/lib/playbook/store";

const REGIME_LABEL: Record<PlaybookRegime, string> = {
  volledig: "volledig regime",
  vereenvoudigd: "vereenvoudigd regime",
  aanbieder: "alle aanbieders",
  ctpp: "CTPP",
};

const PRIORITEIT_STYLE: Record<Prioriteit, string> = {
  fundament: "border-accent/50 bg-accent/10 text-accent",
  kern: "border-line bg-surface",
  verdieping: "border-line bg-surface text-muted",
};

/** Which regimes the filter offers, per playbook. */
const KIND_REGIMES: Record<PlaybookKind, PlaybookRegime[]> = {
  entiteit: ["volledig", "vereenvoudigd"],
  aanbieder: ["aanbieder", "ctpp"],
};

interface PlaybookStepsProps {
  kind: PlaybookKind;
  steps: PlaybookStep[];
  previews: Previews;
  /** step id -> href for its afhankelijkVan deps (may point to another fase). */
  depHrefs: Record<string, string>;
}

export function PlaybookSteps({ kind, steps, previews, depHrefs }: PlaybookStepsProps) {
  const done = useDone();
  const regime = useRegime();
  const kindRegimes = KIND_REGIMES[kind];
  // A regime set on the other playbook doesn't filter this one.
  const active = regime && kindRegimes.includes(regime) ? regime : undefined;

  const visible = active ? steps.filter((s) => s.appliesTo.includes(active)) : steps;
  const doneCount = visible.reduce((n, s) => n + (done[s.id] ? 1 : 0), 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Regime:</span>
        <button
          type="button"
          onClick={() => setRegime(undefined)}
          aria-pressed={!active}
          className={`rounded-full border px-2.5 py-0.5 text-xs ${
            !active ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-foreground"
          }`}
        >
          Alles
        </button>
        {kindRegimes.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegime(r)}
            aria-pressed={active === r}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              active === r
                ? "border-accent bg-accent/10 text-accent"
                : "border-line text-muted hover:text-foreground"
            }`}
          >
            {REGIME_LABEL[r]}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted">
        {active ? (
          <>
            {visible.length} van {steps.length} stappen ({REGIME_LABEL[active]})
            {" · "}
          </>
        ) : null}
        <span className="font-medium text-foreground">{doneCount}</span> van {visible.length} voltooid
      </p>

      {visible.length === 0 ? (
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-muted">
          Geen stappen voor dit regime in deze fase.
        </p>
      ) : (
        <ol className="space-y-4">
          {visible.map((step) => {
            const isDone = Boolean(done[step.id]);
            return (
              <li
                key={step.id}
                id={step.id}
                className={`scroll-mt-20 rounded-lg border p-4 ${
                  isDone ? "border-line bg-surface/50" : "border-line"
                }`}
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <label className="flex items-baseline gap-2">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleStep(step.id)}
                      className="mt-0.5 size-4 shrink-0 accent-accent"
                      aria-label={`Markeer "${step.titel}" als voltooid`}
                    />
                    <h2 className={`font-semibold ${isDone ? "text-muted line-through" : ""}`}>
                      {step.titel}
                    </h2>
                  </label>
                  {step.prioriteit && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${PRIORITEIT_STYLE[step.prioriteit]}`}
                    >
                      {step.prioriteit}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{step.doel}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {step.acties.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
                {step.bewijsstukken && step.bewijsstukken.length > 0 && (
                  <p className="mt-3 text-xs text-muted">
                    <span className="font-medium">Bewijsstukken:</span>{" "}
                    {step.bewijsstukken.join(" · ")}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted">
                  {step.rollen && step.rollen.length > 0 && (
                    <>
                      <span className="font-medium">Rollen:</span> {step.rollen.join(", ")}
                      {" · "}
                    </>
                  )}
                  <span className="font-medium">Geldt voor:</span>{" "}
                  {step.appliesTo.map((r) => REGIME_LABEL[r]).join(", ")}
                  {step.afhankelijkVan && step.afhankelijkVan.length > 0 && (
                    <>
                      {" · "}
                      <span className="font-medium">Na:</span>{" "}
                      {step.afhankelijkVan.map((dep, i) => (
                        <span key={dep}>
                          {i > 0 && ", "}
                          <a href={depHrefs[dep] ?? `#${dep}`} className="text-accent hover:underline">
                            {dep}
                          </a>
                        </span>
                      ))}
                    </>
                  )}
                </p>
                <RefRow refs={step.refs} previews={previews} />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
