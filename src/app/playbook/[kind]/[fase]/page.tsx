import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { RefLink } from "@/components/content/RefLink";
import { PrevNextNav } from "@/components/layout/PrevNextNav";
import { PlaybookSteps } from "@/components/playbook/PlaybookSteps";
import { buildPlaybookRefPreviews } from "@/components/playbook/ref-previews";
import type { DocLookup } from "@/components/playbook/PlaybookSteps";
import {
  getDocuments,
  getPlaybook,
  getStepIndex,
  PLAYBOOK_KINDS,
  type PlaybookKind,
} from "@/lib/playbook/data";

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
  // Plain, serializable lookup for the client island: docId -> display data +
  // a deep link into the Documentenregister (RSC boundary: no Map).
  const docLookup: DocLookup = {};
  for (const doc of getDocuments()) {
    docLookup[doc.id] = {
      naam: doc.naam,
      category: doc.category,
      omschrijving: doc.omschrijving,
      href: `/playbook/documenten#${doc.id}`,
    };
  }
  // deps may live in another fase: link across pages via the step index.
  // Precompute a plain href map so the client island needs no step index.
  const depHrefs: Record<string, string> = {};
  for (const step of f.stappen) {
    for (const dep of step.afhankelijkVan ?? []) {
      const loc = stepIndex[dep];
      depHrefs[dep] =
        loc && loc.faseId !== f.id ? `/playbook/${kind}/${loc.faseId}#${dep}` : `#${dep}`;
    }
  }

  // Prev/next between fases within this playbook (kind).
  const idx = pb.fases.findIndex((x) => x.id === f.id);
  const prevF = idx > 0 ? pb.fases[idx - 1] : undefined;
  const nextF = idx < pb.fases.length - 1 ? pb.fases[idx + 1] : undefined;

  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: "Playbook", href: "/playbook" },
          { label: KIND_LABEL[kind as PlaybookKind], href: `/playbook/${kind}` },
          { label: `Fase ${f.nr}` },
        ]}
      />
      <div className="mb-6 flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent font-mono text-lg font-medium text-white">
          {String(f.nr).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-wider text-muted uppercase">Fase {f.nr}</p>
          <h1 className="mt-0.5 text-2xl font-bold">{f.titel}</h1>
          {f.intro && typeof f.intro === "string" && (
            <p className="mt-2 max-w-2xl text-sm text-muted">{f.intro}</p>
          )}
        </div>
      </div>

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
            <Link href="/playbook/dekking" className="text-accent hover:underline">
              dekkingsregister
            </Link>{" "}
            voor de onderliggende bepalingen.
          </p>
        )
      ) : (
        <PlaybookSteps
          kind={kind as PlaybookKind}
          steps={f.stappen}
          previews={previews}
          depHrefs={depHrefs}
          docLookup={docLookup}
        />
      )}

      <PrevNextNav
        prev={
          prevF && { href: `/playbook/${kind}/${prevF.id}`, label: `Fase ${prevF.nr}`, title: prevF.titel }
        }
        next={
          nextF && { href: `/playbook/${kind}/${nextF.id}`, label: `Fase ${nextF.nr}`, title: nextF.titel }
        }
      />
    </div>
  );
}
