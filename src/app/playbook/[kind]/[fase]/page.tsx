import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { RefLink } from "@/components/content/RefLink";
import { RefRow } from "@/components/assessment/shared";
import { buildPlaybookRefPreviews } from "@/components/playbook/ref-previews";
import { getPlaybook, getStepIndex, PLAYBOOK_KINDS, type PlaybookKind } from "@/lib/playbook/data";
import type { PlaybookRegime, Prioriteit } from "@/lib/playbook/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return PLAYBOOK_KINDS.flatMap((kind) =>
    getPlaybook(kind).fases.map((fase) => ({ kind, fase: fase.id })),
  );
}

const KIND_LABEL: Record<PlaybookKind, string> = {
  entiteit: "Financiële entiteit",
  aanbieder: "Derde aanbieder",
};

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string; fase: string }>;
}): Promise<Metadata> {
  const { kind, fase } = await params;
  const f = getPlaybook(kind as PlaybookKind).fases.find((x) => x.id === fase);
  return { title: f ? `Fase ${f.nr} — ${f.titel}` : "Playbook" };
}

export default async function PlaybookFasePage({
  params,
}: {
  params: Promise<{ kind: string; fase: string }>;
}) {
  const { kind, fase } = await params;
  if (!PLAYBOOK_KINDS.includes(kind as PlaybookKind)) notFound();
  const pb = getPlaybook(kind as PlaybookKind);
  const f = pb.fases.find((x) => x.id === fase);
  if (!f) notFound();
  const previews = buildPlaybookRefPreviews(pb);
  const stepIndex = getStepIndex();
  // deps may live in another fase: link across pages via the step index
  const depHref = (dep: string) => {
    const loc = stepIndex[dep];
    return loc && loc.faseId !== f.id ? `/playbook/${kind}/${loc.faseId}#${dep}` : `#${dep}`;
  };

  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: "Playbook", href: "/playbook" },
          { label: KIND_LABEL[kind as PlaybookKind], href: `/playbook/${kind}` },
          { label: `Fase ${f.nr}` },
        ]}
      />
      <h1 className="mb-2 text-2xl font-bold">
        Fase {f.nr} — {f.titel}
      </h1>
      {f.intro && typeof f.intro === "string" && (
        <p className="mb-6 text-sm text-muted">{f.intro}</p>
      )}

      {f.id === "f1" && (pb.begrippen?.length ?? 0) > 0 && (
        <dl className="mb-6 space-y-2">
          {pb.begrippen!.map((b) => (
            <div key={b.href} className="rounded-lg border border-line px-4 py-2.5">
              <dt className="text-sm font-medium">
                <RefLink href={b.href} title={previews[b.href]?.title} snippet={previews[b.href]?.snippet}>
                  {b.term}
                </RefLink>
              </dt>
              {b.toelichting && <dd className="mt-0.5 text-xs text-muted">{b.toelichting}</dd>}
            </div>
          ))}
        </dl>
      )}

      {f.stappen.length === 0 ? (
        f.id === "f1" && (pb.begrippen?.length ?? 0) > 0 ? null : (
          <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-muted">
            De stappen voor deze fase worden nog samengesteld. Raadpleeg intussen het{" "}
            <a href="/playbook/dekking" className="text-accent hover:underline">
              dekkingsregister
            </a>{" "}
            voor de onderliggende bepalingen.
          </p>
        )
      ) : (
        <ol className="space-y-4">
          {f.stappen.map((step) => (
            <li
              key={step.id}
              id={step.id}
              className="scroll-mt-20 rounded-lg border border-line p-4"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="font-semibold">{step.titel}</h2>
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
                        <a href={depHref(dep)} className="text-accent hover:underline">
                          {dep}
                        </a>
                      </span>
                    ))}
                  </>
                )}
              </p>
              <RefRow refs={step.refs} previews={previews} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
