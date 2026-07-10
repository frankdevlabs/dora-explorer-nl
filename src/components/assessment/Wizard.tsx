"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { computeVisibility, progress } from "@/lib/assessment/engine-core";
import type { HelpContent, Module, Question, Questionnaire } from "@/lib/assessment/types";
import { HelpText, Panel, RefRow, type Previews } from "./shared";

export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function AnswerInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  if (question.answerType === "text") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-2 w-full rounded-md border border-line bg-background px-3 py-2 text-sm"
      />
    );
  }
  const options =
    question.answerType === "choice"
      ? (question.options ?? [])
      : question.answerType === "janeenvt"
        ? [
            { value: "ja", label: "Ja" },
            { value: "nee", label: "Nee" },
            { value: "nvt", label: "N.v.t." },
          ]
        : [
            { value: "ja", label: "Ja" },
            { value: "nee", label: "Nee" },
          ];
  return (
    <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={question.id}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? "" : o.value)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              active
                ? "border-accent bg-accent/10 font-medium text-accent"
                : "border-line text-muted hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ModuleStep({
  module,
  answers,
  visibleQuestions,
  onAnswer,
  previews,
}: {
  module: Module;
  answers: Record<string, string>;
  visibleQuestions: Set<string>;
  onAnswer: (questionId: string, value: string) => void;
  previews: Previews;
}) {
  const questions = module.questions.filter((q) => visibleQuestions.has(q.id));
  return (
    <div className="space-y-4">
      {module.intro && (
        <HelpText content={module.intro as HelpContent} className="space-y-1.5 text-sm text-muted" />
      )}
      {module.refs && <RefRow refs={module.refs} previews={previews} />}
      {questions.map((q) => {
        const value = answers[q.id] ?? "";
        return (
          <div key={q.id} className="rounded-lg border border-line bg-surface p-4">
            <p className="text-sm">
              <span className="mr-2 font-mono text-xs text-muted">{q.id}</span>
              {q.text}
            </p>
            {q.help && (
              <HelpText
                content={q.help}
                className="mt-1 space-y-1.5 text-xs leading-relaxed text-muted"
              />
            )}
            <RefRow refs={q.refs} previews={previews} />
            <AnswerInput question={q} value={value} onChange={(v) => onAnswer(q.id, v)} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Generic module-stepper over any questionnaire. Storage-agnostic: the
 * caller supplies answers + onAnswer (entity store or RoI arrangement) and
 * the result-page href.
 */
export function Wizard({
  questionnaire,
  title,
  answers,
  onAnswer,
  resultHref,
  previews,
}: {
  questionnaire: Questionnaire;
  title: string;
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
  resultHref: string;
  previews: Previews;
}) {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const ctx = useMemo(() => computeVisibility(questionnaire, answers), [questionnaire, answers]);
  const { answered, total } = progress(questionnaire, answers, ctx);

  const visibleModules = questionnaire.modules.filter((m) => ctx.visibleModules.has(m.id));
  const moduleDone = (m: Module) =>
    m.questions
      .filter((q) => ctx.visibleQuestions.has(q.id))
      .every((q) => (answers[q.id] ?? "") !== "");
  const active =
    visibleModules.find((m) => m.id === activeModuleId) ??
    visibleModules.find((m) => !moduleDone(m)) ??
    visibleModules[visibleModules.length - 1];
  const activeIdx = visibleModules.findIndex((m) => m.id === active.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-xs text-muted">
            {answered} van {total} vragen beantwoord
          </p>
        </div>
        <Link
          href={resultHref}
          className="flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm text-accent hover:border-accent"
        >
          Naar resultaat <ArrowRight className="size-4" />
        </Link>
      </div>

      <nav className="flex flex-wrap gap-1.5" aria-label="Modules">
        {visibleModules.map((m) => {
          const done = moduleDone(m);
          const current = m.id === active.id;
          const visible = m.questions.filter((q) => ctx.visibleQuestions.has(q.id));
          const answeredCount = visible.filter((q) => (answers[q.id] ?? "") !== "").length;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveModuleId(m.id)}
              title={`${m.title} — ${answeredCount}/${visible.length} beantwoord`}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                current
                  ? "border-accent bg-accent/10 font-medium text-accent"
                  : "border-line text-muted hover:text-foreground"
              }`}
            >
              {done && <CheckCircle2 className="size-3 text-green-600 dark:text-green-400" />}
              {m.nr}
            </button>
          );
        })}
      </nav>

      <Panel title={`Module ${active.nr} — ${active.title}`}>
        <ModuleStep
          module={active}
          answers={answers}
          visibleQuestions={ctx.visibleQuestions}
          onAnswer={onAnswer}
          previews={previews}
        />
      </Panel>

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={activeIdx <= 0}
          onClick={() => setActiveModuleId(visibleModules[activeIdx - 1].id)}
          className="flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted enabled:hover:text-foreground disabled:opacity-40"
        >
          <ArrowLeft className="size-4" /> Vorige
        </button>
        {activeIdx < visibleModules.length - 1 ? (
          <button
            type="button"
            onClick={() => setActiveModuleId(visibleModules[activeIdx + 1].id)}
            className="flex h-9 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white dark:text-background"
          >
            Volgende <ArrowRight className="size-4" />
          </button>
        ) : (
          <Link
            href={resultHref}
            className="flex h-9 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white dark:text-background"
          >
            Afronden — naar resultaat <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
