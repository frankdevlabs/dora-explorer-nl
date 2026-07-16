"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { RefRow, type Previews } from "@/components/assessment/shared";
import type { PlaybookKind } from "@/lib/playbook/data";
import type { PlaybookRegime, PlaybookStep, Prioriteit } from "@/lib/playbook/types";
import { setRegime, toggleStep, useDone, useRegime } from "@/lib/playbook/store";
import { PRIO, PRIO_FALLBACK, PRIO_ORDER, prioStyle } from "@/lib/playbook/ui";

const REGIME_LABEL: Record<PlaybookRegime, string> = {
  volledig: "volledig regime",
  vereenvoudigd: "vereenvoudigd regime",
  aanbieder: "alle aanbieders",
  ctpp: "CTPP",
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

interface Group {
  key: string;
  style: typeof PRIO_FALLBACK;
  steps: PlaybookStep[];
}

export function PlaybookSteps({ kind, steps, previews, depHrefs }: PlaybookStepsProps) {
  const done = useDone();
  const regime = useRegime();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [allOpen, setAllOpen] = useState(false);

  const kindRegimes = KIND_REGIMES[kind];
  // A regime set on the other playbook doesn't filter this one.
  const active = regime && kindRegimes.includes(regime) ? regime : undefined;

  const visible = active ? steps.filter((s) => s.appliesTo.includes(active)) : steps;
  const total = visible.length;
  const doneCount = visible.reduce((n, s) => n + (done[s.id] ? 1 : 0), 0);
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  // Group the visible steps by priority (design: fundament → kern → verdieping),
  // with a defensive "overig" bucket for any step lacking a known priority.
  const groups: Group[] = [];
  for (const p of PRIO_ORDER) {
    const gs = visible.filter((s) => s.prioriteit === p);
    if (gs.length) groups.push({ key: p, style: PRIO[p], steps: gs });
  }
  const leftover = visible.filter(
    (s) => !s.prioriteit || !PRIO_ORDER.includes(s.prioriteit),
  );
  if (leftover.length) groups.push({ key: "overig", style: PRIO_FALLBACK, steps: leftover });

  const toggleOne = useCallback((id: string) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleAll = useCallback(() => {
    setAllOpen((prevAll) => {
      const next = !prevAll;
      setOpen(next ? Object.fromEntries(visible.map((s) => [s.id, true])) : {});
      return next;
    });
    // visible is derived; toggleAll reads the latest via closure on each click
    // through the button's onClick — recreated per render, so this is fine.
  }, [visible]);

  // Deep links (SearchDocs / Cmd-K / dep anchors) target a step by hash; open
  // and scroll it into view so it doesn't land inside a collapsed card.
  useEffect(() => {
    const openFromHash = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (!id || !steps.some((s) => s.id === id)) return;
      setOpen((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
      // Wait a frame so the expanded content is laid out before scrolling.
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [steps]);

  return (
    <div>
      {/* Regime filter (epic 16, kept) */}
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

      {/* Summary card: progress + segmented bar + legend + expand-all */}
      <div className="mb-6 rounded-lg border border-line p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-muted">
            {active && (
              <>
                {total} van {steps.length} stappen ({REGIME_LABEL[active]})
                {" · "}
              </>
            )}
            <span className="font-medium text-foreground">{doneCount}</span> van {total} voltooid
          </p>
          <span className="text-lg font-semibold text-accent tabular-nums">{pct}%</span>
        </div>

        <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-surface">
          {groups.map((g) => {
            const dc = g.steps.reduce((n, s) => n + (done[s.id] ? 1 : 0), 0);
            const w = total ? (dc / total) * 100 : 0;
            return <div key={g.key} className={g.style.bar} style={{ width: `${w}%` }} />;
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {groups.map((g) => {
              const dc = g.steps.reduce((n, s) => n + (done[s.id] ? 1 : 0), 0);
              return (
                <span key={g.key} className="flex items-center gap-1.5 text-xs text-muted">
                  <span className={`size-2 shrink-0 rounded-full ${g.style.dot}`} />
                  <span className="font-medium text-foreground">{g.style.label}</span>
                  <span className="tabular-nums">
                    {dc}/{g.steps.length}
                  </span>
                </span>
              );
            })}
          </div>
          {total > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:text-foreground"
            >
              {allOpen ? "Alles inklappen" : "Alles uitklappen"}
            </button>
          )}
        </div>
      </div>

      {total === 0 ? (
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-muted">
          Geen stappen voor dit regime in deze fase.
        </p>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => {
            const dc = g.steps.reduce((n, s) => n + (done[s.id] ? 1 : 0), 0);
            return (
              <section key={g.key}>
                <div className="mb-3 flex items-center gap-2.5">
                  <span className={`size-2 shrink-0 rounded-full ${g.style.dot}`} />
                  <span className="text-xs font-medium tracking-wide text-foreground uppercase">
                    {g.style.label}
                  </span>
                  <span className="text-xs text-muted tabular-nums">
                    {dc}/{g.steps.length}
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                <ol className="space-y-2.5">
                  {g.steps.map((step) => (
                    <StepCard
                      key={step.id}
                      step={step}
                      isDone={Boolean(done[step.id])}
                      isOpen={Boolean(open[step.id])}
                      onToggleOpen={() => toggleOne(step.id)}
                      prio={step.prioriteit}
                      previews={previews}
                      depHrefs={depHrefs}
                    />
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface StepCardProps {
  step: PlaybookStep;
  isDone: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  prio: Prioriteit | undefined;
  previews: Previews;
  depHrefs: Record<string, string>;
}

function StepCard({ step, isDone, isOpen, onToggleOpen, prio, previews, depHrefs }: StepCardProps) {
  const style = prioStyle(prio);
  const meta = [
    step.id,
    step.rollen && step.rollen.length > 0 ? step.rollen.join(" · ") : null,
    `${step.refs.length} ${step.refs.length === 1 ? "ref" : "refs"}`,
  ].filter(Boolean);

  return (
    <li
      id={step.id}
      className={`scroll-mt-20 overflow-hidden rounded-lg border ${
        isOpen ? "border-accent/40" : "border-line"
      } ${isDone ? "bg-surface/50" : ""}`}
    >
      <div className="flex items-center gap-3 p-3.5">
        <input
          type="checkbox"
          checked={isDone}
          onChange={() => toggleStep(step.id)}
          className="size-4 shrink-0 accent-accent"
          aria-label={`Markeer "${step.titel}" als voltooid`}
        />
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          className="min-w-0 flex-1 text-left"
        >
          <span className={`font-semibold ${isDone ? "text-muted line-through" : ""}`}>
            {step.titel}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
            {meta.map((m, i) => (
              <span key={i} className={i === 0 ? "text-foreground/70" : ""}>
                {i > 0 && <span className="mr-2 text-muted">·</span>}
                {m}
              </span>
            ))}
          </span>
        </button>
        {prio && (
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${style.chip}`}>
            {style.label}
          </span>
        )}
        <button
          type="button"
          onClick={onToggleOpen}
          aria-label={isOpen ? "Inklappen" : "Uitklappen"}
          className="grid size-7 shrink-0 place-items-center rounded-md border border-line text-muted hover:text-foreground"
        >
          {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-line px-4 pt-3 pb-4 pl-11">
          <p className="text-sm text-muted">{step.doel}</p>

          <p className="mt-4 text-xs font-medium tracking-wide text-muted uppercase">Acties</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {step.acties.map((a, i) => (
              <li key={i} className="flex gap-2.5">
                <span className={`mt-1.5 shrink-0 ${style.bullet}`} aria-hidden>
                  ▪
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-x-10 gap-y-4">
            {step.bewijsstukken && step.bewijsstukken.length > 0 && (
              <div className="min-w-[220px] flex-1">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">
                  Bewijsstukken
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {step.bewijsstukken.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-line" aria-hidden>
                        —
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="min-w-[180px]">
              <p className="text-xs font-medium tracking-wide text-muted uppercase">
                Wettelijke basis
              </p>
              <div className="mt-1">
                <RefRow refs={step.refs} previews={previews} />
              </div>
            </div>
          </div>

          <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
            <span className="font-medium">Geldt voor:</span>{" "}
            {step.appliesTo.map((r) => REGIME_LABEL[r]).join(", ")}
            {step.afhankelijkVan && step.afhankelijkVan.length > 0 && (
              <>
                {" · "}
                <span className="font-medium">Vereist eerst:</span>{" "}
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
        </div>
      )}
    </li>
  );
}
