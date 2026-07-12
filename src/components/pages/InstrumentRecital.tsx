import { notFound } from "next/navigation";
import { LinkedText } from "@/components/content/LinkedText";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PrevNextNav } from "@/components/layout/PrevNextNav";
import { RegisterTab } from "@/components/layout/RegisterTab";
import Link from "next/link";
import { getArticlesForRecital, getRecital, recitalPrevNext } from "@/lib/data";
import { INSTRUMENTS, type InstrumentId } from "@/lib/instruments";

/** Recital page body for the satellite instruments (its/rts). */
export function InstrumentRecital({
  instrument,
  nummer,
}: {
  instrument: InstrumentId;
  nummer: string;
}) {
  const spec = INSTRUMENTS[instrument];
  const recital = getRecital(Number(nummer), instrument);
  if (!recital) notFound();

  return (
    <article>
      <RegisterTab
        href={`${spec.routePrefix}/overweging/${nummer}`}
        label={`${spec.label} ov. ${recital.number}`}
      />
      <Breadcrumbs
        crumbs={[
          { label: spec.label, href: spec.routePrefix || "/" },
          { label: `Overweging ${recital.number}` },
        ]}
      />
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Overweging {recital.number}</h1>
        <p className="mt-2 text-sm text-muted">{spec.title}</p>
      </header>
      {recital.paragraphs.map((p, i) => (
        <p key={i} className="my-3 leading-relaxed">
          <LinkedText text={p.text} refs={p.refs} />
        </p>
      ))}
      {getArticlesForRecital(recital.number, instrument).length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-muted">Relevante artikelen</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {getArticlesForRecital(recital.number, instrument).map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  title={a.title}
                  className="inline-block rounded-full border border-line px-2.5 py-0.5 text-sm hover:border-accent"
                >
                  {a.label}
                  {a.instrument !== instrument && (
                    <span className="ml-1 text-[10px] uppercase text-muted">
                      {INSTRUMENTS[a.instrument].label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <PrevNextNav {...recitalPrevNext(recital.number, instrument)} />
    </article>
  );
}
