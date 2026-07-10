import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LinkedText } from "@/components/content/LinkedText";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PrevNextNav } from "@/components/layout/PrevNextNav";
import { RegisterTab } from "@/components/layout/RegisterTab";
import Link from "next/link";
import { getArticlesForRecital, getRecital, getRecitals, recitalPrevNext } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getRecitals().map((r) => ({ nummer: String(r.number) }));
}

type Props = { params: Promise<{ nummer: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nummer } = await params;
  return {
    title: `Overweging ${nummer}`,
    description: `Overweging ${nummer} van DORA (Verordening (EU) 2022/2554)`,
  };
}

export default async function OverwegingPage({ params }: Props) {
  const { nummer } = await params;
  const recital = getRecital(Number(nummer));
  if (!recital) notFound();

  return (
    <article>
      <RegisterTab href={`/overweging/${nummer}`} label={`Ov. ${recital.number}`} />
      <Breadcrumbs
        crumbs={[
          { label: "Overwegingen", href: "/overwegingen" },
          { label: `Overweging ${recital.number}` },
        ]}
      />
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Overweging {recital.number}</h1>
      </header>
      {recital.paragraphs.map((p, i) => (
        <p key={i} className="my-3 leading-relaxed">
          <LinkedText text={p.text} refs={p.refs} />
        </p>
      ))}
      {getArticlesForRecital(recital.number).length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-muted">Relevante artikelen</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {getArticlesForRecital(recital.number).map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  title={a.title}
                  className="inline-block rounded-full border border-line px-2.5 py-0.5 text-sm hover:border-accent"
                >
                  {a.label}
                  {a.instrument !== "dora" && (
                    <span className="ml-1 text-[10px] uppercase text-muted">
                      {a.instrument === "its" ? "RoI-ITS" : "RTS"}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <PrevNextNav {...recitalPrevNext(recital.number)} />
    </article>
  );
}
