import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
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

      <ol className="mb-6 space-y-3">
        {pb.fases.map((fase) => (
          <li key={fase.id}>
            <Link
              href={`/playbook/${kind}/${fase.id}`}
              className="group block rounded-lg border border-line p-4 hover:border-accent"
            >
              <p className="font-semibold group-hover:text-accent">
                Fase {fase.nr} — {fase.titel}
              </p>
              {fase.intro && (
                <p className="mt-1 text-sm text-muted">
                  {typeof fase.intro === "string" ? fase.intro : null}
                </p>
              )}
              <p className="mt-2 text-xs text-muted">
                {fase.stappen.length === 1 ? "1 stap" : `${fase.stappen.length} stappen`}
                {" · "}
                {fase.instrumenten.map((i) => INSTRUMENTS[i].label).join(", ")}
              </p>
            </Link>
          </li>
        ))}
      </ol>

      <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-muted">
        {pb.meta.disclaimer}
      </p>
    </div>
  );
}
