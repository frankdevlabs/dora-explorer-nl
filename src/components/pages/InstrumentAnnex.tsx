import { notFound } from "next/navigation";
import { ContentNodes } from "@/components/content/ContentNodes";
import { FootnoteList } from "@/components/content/FootnoteList";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PrevNextNav } from "@/components/layout/PrevNextNav";
import { RegisterTab } from "@/components/layout/RegisterTab";
import { annexPrevNext, getAnnex } from "@/lib/data";
import { INSTRUMENTS, type InstrumentId } from "@/lib/instruments";

/** Annex page body for the satellite instruments (its). */
export function InstrumentAnnex({
  instrument,
  nummer,
}: {
  instrument: InstrumentId;
  nummer: string;
}) {
  const spec = INSTRUMENTS[instrument];
  const annex = getAnnex(nummer, instrument);
  if (!annex) notFound();

  return (
    <article>
      <RegisterTab
        href={`${spec.routePrefix}/bijlage/${nummer}`}
        label={`${spec.label} bijl. ${annex.roman}`}
        title={annex.title}
      />
      <Breadcrumbs
        crumbs={[
          { label: spec.label, href: spec.routePrefix || "/" },
          { label: `Bijlage ${annex.roman}` },
        ]}
      />
      <header className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">
          Bijlage {annex.roman}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-balance">{annex.title}</h1>
        <p className="mt-2 text-sm text-muted">{spec.title}</p>
      </header>
      <ContentNodes nodes={annex.content} />
      <FootnoteList footnotes={annex.footnotes} />
      <PrevNextNav {...annexPrevNext(annex.roman, instrument)} />
    </article>
  );
}
