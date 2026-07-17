import type { Metadata } from "next";
import Link from "next/link";
import { RefRow } from "@/components/assessment/shared";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { buildDocumentRefPreviews } from "@/components/playbook/ref-previews";
import { getDocIndex, getDocuments, getStepIndex } from "@/lib/playbook/data";
import type { DocCategory } from "@/lib/playbook/types";
import { CATEGORY_LABEL, CATEGORY_ORDER, CATEGORY_STYLE } from "@/lib/playbook/ui";

export const metadata: Metadata = {
  title: "Documentenregister",
  description:
    "Alle documenten, beleidsstukken, registers en plannen die DORA en de level-2-handelingen van een organisatie verwachten — met per document de wettelijke basis en de playbook-stappen die het opleveren.",
};

export default function DocumentenPage() {
  const documenten = getDocuments();
  const byDoc = getDocIndex();
  const stepIndex = getStepIndex();
  const previews = buildDocumentRefPreviews(documenten);

  const stepHref = (stepId: string) => {
    const loc = stepIndex[stepId];
    return loc ? `/playbook/${loc.playbook}/${loc.faseId}#${stepId}` : "/playbook";
  };

  // Group by category, preserving the canonical order; only non-empty groups.
  const groups = CATEGORY_ORDER.map((cat) => ({
    cat,
    docs: documenten.filter((d) => d.category === cat),
  })).filter((g) => g.docs.length > 0);

  const total = documenten.length;

  return (
    <div>
      <Breadcrumbs crumbs={[{ label: "Playbook", href: "/playbook" }, { label: "Documenten" }]} />
      <p className="font-mono text-[11px] tracking-wider text-muted uppercase">Documenten</p>
      <h1 className="mt-1 mb-2 text-2xl font-bold">Documentenregister</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Elk document dat DORA en de level-2-handelingen van een organisatie verwachten — beleid,
        registers, plannen, procedures, verslagen, rapportages en overeenkomsten. Per document staat
        de wettelijke basis en welke playbook-stappen het opleveren, net zoals het{" "}
        <Link href="/playbook/dekking" className="text-accent hover:underline">
          dekkingsregister
        </Link>{" "}
        elke bepaling aan een stap koppelt.
      </p>

      {total === 0 ? (
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-muted">
          De documentcatalogus wordt nog samengesteld.
        </p>
      ) : (
        <>
          {/* Category selector (anchors into the sections below) */}
          <div className="mb-5 flex flex-wrap gap-2">
            {groups.map(({ cat, docs }) => (
              <a
                key={cat}
                href={`#cat-${cat}`}
                className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm text-foreground hover:border-accent"
              >
                <span className="font-medium">{CATEGORY_LABEL[cat]}</span>
                <span className="font-mono text-[11px] text-muted">{docs.length}</span>
              </a>
            ))}
            <span className="flex items-center gap-2 rounded-lg border border-dashed border-line px-3 py-1.5 text-sm text-muted">
              <span className="font-medium">Totaal</span>
              <span className="font-mono text-[11px]">{total}</span>
            </span>
          </div>

          {/* Summary bar: documents per category */}
          <div className="mb-8 rounded-lg border border-line p-4">
            <div className="flex h-2 overflow-hidden rounded-full bg-surface">
              {groups.map(({ cat, docs }) => (
                <div
                  key={cat}
                  className={dotBg(cat)}
                  style={{ width: `${(docs.length / total) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
              {groups.map(({ cat, docs }) => (
                <span key={cat} className="flex items-center gap-1.5">
                  <span className={`size-2 shrink-0 rounded-full ${dotBg(cat)}`} />
                  <span className="font-medium text-foreground">{CATEGORY_LABEL[cat]}</span>
                  <span className="tabular-nums">{docs.length}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-10">
            {groups.map(({ cat, docs }) => (
              <section key={cat} id={`cat-${cat}`} className="scroll-mt-20">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className={`size-2 shrink-0 rounded-full ${dotBg(cat)}`} />
                  <span className="text-xs font-medium tracking-wide text-foreground uppercase">
                    {CATEGORY_LABEL[cat]}
                  </span>
                  <span className="text-xs text-muted tabular-nums">{docs.length}</span>
                  <span className="h-px flex-1 bg-line" />
                </div>

                <ul className="space-y-2.5">
                  {docs.map((doc) => {
                    const steps = byDoc[doc.id]?.steps ?? [];
                    const meta = [doc.cadans, doc.eigenaar].filter(Boolean).join(" · ");
                    return (
                      <li
                        key={doc.id}
                        id={doc.id}
                        className="scroll-mt-20 rounded-lg border border-line p-4"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h2 className="font-semibold">{doc.naam}</h2>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${CATEGORY_STYLE[doc.category]}`}
                          >
                            {CATEGORY_LABEL[doc.category]}
                          </span>
                        </div>
                        {meta && <p className="mt-0.5 text-[11px] text-muted">{meta}</p>}
                        <p className="mt-2 text-sm text-muted">{doc.omschrijving}</p>

                        <div className="mt-3 flex flex-wrap gap-x-10 gap-y-4">
                          <div className="min-w-[180px]">
                            <p className="text-xs font-medium tracking-wide text-muted uppercase">
                              Wettelijke basis
                            </p>
                            <div className="mt-1">
                              <RefRow refs={doc.refs} previews={previews} />
                            </div>
                          </div>
                          {steps.length > 0 && (
                            <div className="min-w-[180px] flex-1">
                              <p className="text-xs font-medium tracking-wide text-muted uppercase">
                                Geproduceerd door
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {steps.map((s) => (
                                  <Link
                                    key={s}
                                    href={stepHref(s)}
                                    className="rounded-md border border-accent/30 bg-accent/5 px-1.5 py-0.5 font-mono text-[11px] text-accent hover:bg-accent/10"
                                  >
                                    {s}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Category dot/bar background, derived from the shared pill style. */
function dotBg(cat: DocCategory): string {
  const map: Record<DocCategory, string> = {
    beleid: "bg-accent",
    register: "bg-teal-600 dark:bg-teal-400",
    plan: "bg-indigo-500",
    procedure: "bg-amber-500",
    verslag: "bg-slate-400 dark:bg-slate-500",
    rapportage: "bg-rose-500",
    overeenkomst: "bg-emerald-500",
    memo: "bg-slate-400 dark:bg-slate-500",
  };
  return map[cat];
}
