import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PlaybookProgress, type FaseSummary } from "@/components/playbook/PlaybookProgress";
import { INSTRUMENTS } from "@/lib/instruments";
import { getPlaybook, PLAYBOOK_KINDS, type PlaybookKind } from "@/lib/playbook/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return PLAYBOOK_KINDS.map((kind) => ({ kind }));
}

const KIND_LABEL: Record<PlaybookKind, string> = {
  entiteit: "Financiële entiteit",
  aanbieder: "Derde aanbieder",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kind: string }>;
}): Promise<Metadata> {
  const { kind } = await params;
  const pb = getPlaybook(kind as PlaybookKind);
  return { title: pb.meta.title };
}

export default async function PlaybookKindPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;
  if (!PLAYBOOK_KINDS.includes(kind as PlaybookKind)) notFound();
  const pb = getPlaybook(kind as PlaybookKind);
  const fases: FaseSummary[] = pb.fases.map((fase) => ({
    id: fase.id,
    nr: fase.nr,
    titel: fase.titel,
    intro: typeof fase.intro === "string" ? fase.intro : undefined,
    instrumenten: fase.instrumenten.map((i) => INSTRUMENTS[i].label).join(", "),
    stepIds: fase.stappen.map((s) => s.id),
  }));
  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: "Playbook", href: "/playbook" },
          { label: KIND_LABEL[kind as PlaybookKind] },
        ]}
      />
      <h1 className="mb-2 text-2xl font-bold">{pb.meta.title}</h1>
      <p className="mb-6 text-sm text-muted">Basis: {pb.meta.basis}.</p>

      <PlaybookProgress kind={kind as PlaybookKind} fases={fases} />

      <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-muted">
        {pb.meta.disclaimer}
      </p>
    </div>
  );
}
