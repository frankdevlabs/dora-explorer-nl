import { notFound } from "next/navigation";
import { LinkedText } from "@/components/content/LinkedText";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PrevNextNav } from "@/components/layout/PrevNextNav";
import { RegisterTab } from "@/components/layout/RegisterTab";
import { getRecital, recitalPrevNext } from "@/lib/data";
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
      <PrevNextNav {...recitalPrevNext(recital.number, instrument)} />
    </article>
  );
}
