import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getAnnexes, getArticles, getRecitals } from "@/lib/data";
import { INSTRUMENTS, type InstrumentId } from "@/lib/instruments";

const BLURB: Record<InstrumentId, string> = {
  dora: "",
  its:
    "Standaardmodellen voor het informatieregister van artikel 28, lid 3, DORA: " +
    "de 15 templates B_01.01–B_99.01, het gegevensformaat (xBRL-CSV) en de " +
    "taxonomie van ICT-diensten (S01–S19, bijlage III). Rectificatie van " +
    "19 september 2025 verwerkt in de geconsolideerde tekst.",
  rts:
    "Voorwaarden voor onderaanneming van ICT-diensten die kritieke of " +
    "belangrijke functies (of materiële onderdelen daarvan) ondersteunen, ter " +
    "aanvulling van artikel 30, lid 5, DORA. In werking sinds 22 juli 2025; " +
    "het ontwerp-artikel over monitoring van de keten is vóór vaststelling " +
    "geschrapt (ketenmonitoring loopt via artikel 29, lid 2, DORA).",
  criticaliteit:
    "Nadere bepaling van de criteria van artikel 31, lid 2, DORA op grond " +
    "waarvan de ESA's derde aanbieders van ICT-diensten als kritiek aanwijzen " +
    "(oversight): systeemimpact, systeemrelevantie van de afnemers, " +
    "vervangbaarheid en het aantal bediende lidstaten. Relevant voor de " +
    "aanwijzingsexercitie van de ESA's, niet als directe verplichting voor " +
    "financiële entiteiten.",
};

/** Index page for a satellite instrument: blurb + article/annex/recital TOC. */
export function InstrumentIndex({ instrument }: { instrument: InstrumentId }) {
  const spec = INSTRUMENTS[instrument];
  const prefix = spec.routePrefix;
  const articles = getArticles(instrument);
  const annexes = getAnnexes(instrument);
  const recitals = getRecitals(instrument);

  return (
    <div>
      <Breadcrumbs crumbs={[{ label: spec.label }]} />
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-balance">{spec.label}</h1>
        <p className="mt-2 text-sm text-muted">{spec.title}</p>
        <p className="mt-3 text-muted">{BLURB[instrument]}</p>
      </header>

      <nav aria-label={`Inhoudsopgave ${spec.label}`} className="space-y-8">
        <section>
          <h2 className="border-b border-line pb-2 text-lg font-semibold">Artikelen</h2>
          <ul className="mt-3 space-y-1">
            {articles.map((a) => (
              <li key={a.number}>
                <Link
                  href={`${prefix}/artikel/${a.number}`}
                  className="group flex gap-3 rounded px-2 py-1 hover:bg-surface"
                >
                  <span className="w-16 shrink-0 text-sm text-muted">Art. {a.number}</span>
                  <span className="group-hover:text-accent">{a.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {annexes.length > 0 && (
          <section>
            <h2 className="border-b border-line pb-2 text-lg font-semibold">Bijlagen</h2>
            <ul className="mt-3 space-y-1">
              {annexes.map((a) => (
                <li key={a.roman}>
                  <Link
                    href={`${prefix}/bijlage/${a.roman.toLowerCase()}`}
                    className="group flex gap-3 rounded px-2 py-1 hover:bg-surface"
                  >
                    <span className="w-16 shrink-0 text-sm text-muted">Blg. {a.roman}</span>
                    <span className="group-hover:text-accent">{a.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="border-b border-line pb-2 text-lg font-semibold">Overwegingen</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {recitals.map((r) => (
              <li key={r.number}>
                <Link
                  href={`${prefix}/overweging/${r.number}`}
                  className="inline-block rounded-full border border-line px-2.5 py-0.5 text-sm hover:border-accent hover:text-accent"
                >
                  {r.number}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </nav>
    </div>
  );
}
