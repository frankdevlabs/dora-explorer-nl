import Link from "next/link";
import { getToc } from "@/lib/data";
import { INSTRUMENTS, type InstrumentId } from "@/lib/instruments";

/** One-line topic per satellite, shown in the level-2 index on the homepage. */
const TAGLINE: Record<Exclude<InstrumentId, "dora">, string> = {
  risicobeheer:
    "Uitwerking van het ICT-risicobeheerkader en het vereenvoudigde raamwerk (art. 15 en 16, lid 3)",
  classificatie:
    "Classificatie van incidenten en cyberdreigingen, materialiteitsdrempels (art. 18)",
  rapportage: "Inhoud en termijnen van incidentmeldingen: 4u/24u, 72u, één maand (art. 20)",
  formulieren: "Meldformulieren en procedures voor incidenten en dreigingen (art. 20)",
  tlpt: "Dreigingsgestuurde penetratietests: wie moet testen, scope en fasen (art. 26, lid 11)",
  its: "Templates voor het informatieregister en de S01–S19-taxonomie (art. 28, lid 9)",
  contractbeleid:
    "Beleid inzake contractuele overeenkomsten voor KOF-diensten (art. 28, lid 10)",
  rts: "Onderaanneming van ICT-diensten die kritieke functies ondersteunen (art. 30, lid 5)",
  criticaliteit: "Criteria voor de aanwijzing van kritieke derde aanbieders (art. 31, lid 6)",
  oversight: "Uitoefening van de oversightactiviteiten door de lead overseer (art. 41)",
  onderzoeksteams: "Samenstelling van de gezamenlijke onderzoeksteams (art. 41, lid 1, punt c))",
  vergoedingen: "Oversightvergoedingen voor kritieke derde aanbieders (art. 43, lid 2)",
};

const SATELLITE_GROUPS: {
  title: string;
  themes: { name: string; ids: Exclude<InstrumentId, "dora">[] }[];
}[] = [
  {
    title: "Level 2 — voor financiële entiteiten",
    themes: [
      { name: "Risicobeheer", ids: ["risicobeheer"] },
      { name: "Incidenten", ids: ["classificatie", "rapportage", "formulieren"] },
      { name: "Testen", ids: ["tlpt"] },
      { name: "Derde aanbieders", ids: ["its", "contractbeleid", "rts"] },
    ],
  },
  {
    title: "Level 2 — oversight van kritieke derde aanbieders",
    themes: [
      { name: "Oversight", ids: ["criticaliteit", "oversight", "onderzoeksteams", "vergoedingen"] },
    ],
  },
];

export default function Home() {
  const toc = getToc();

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-balance">
          DORA <span className="text-accent">(EU) 2022/2554</span>
        </h1>
        <p className="mt-3 text-muted">
          De volledige Nederlandse tekst van de verordening digitale operationele weerbaarheid
          (Digital Operational Resilience Act): {toc.recitalCount} overwegingen
          {toc.annexes.length > 0 ? ` en ${toc.annexes.length} bijlagen` : ""}. Gebruik de
          inhoudsopgave of zoek met{" "}
          <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 text-xs">Ctrl K</kbd>.
        </p>
      </header>

      <section aria-label="Uitvoeringshandelingen" className="mb-10 space-y-6">
        {SATELLITE_GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="border-b border-line pb-2 text-lg font-semibold">{group.title}</h2>
            <div className="mt-3 space-y-4">
              {group.themes.map((theme) => (
                <div key={theme.name}>
                  {group.themes.length > 1 && (
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {theme.name}
                    </p>
                  )}
                  <ul className="mt-1 space-y-1">
                    {theme.ids.map((id) => {
                      const spec = INSTRUMENTS[id];
                      return (
                        <li key={id}>
                          <Link
                            href={spec.routePrefix}
                            className="group flex flex-col gap-x-3 rounded px-2 py-1 hover:bg-surface sm:flex-row sm:items-baseline"
                          >
                            <span className="w-56 shrink-0 font-medium group-hover:text-accent">
                              {spec.label}{" "}
                              <span className="text-xs font-normal text-muted">
                                ({spec.citation.match(/\d{4}\/\d+/)?.[0]})
                              </span>
                            </span>
                            <span className="text-sm text-muted">{TAGLINE[id]}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <nav aria-label="Volledige inhoudsopgave" className="space-y-8">
        {toc.chapters.map((c) => (
          <section key={c.roman} id={`hoofdstuk-${c.roman.toLowerCase()}`} className="scroll-mt-20">
            <h2 className="border-b border-line pb-2 text-lg font-semibold">
              Hoofdstuk {c.roman} — {c.title}
            </h2>
            <ul className="mt-3 space-y-1">
              {c.articles.map((a) => (
                <li key={a.number}>
                  <Link
                    href={`/artikel/${a.number}`}
                    className="group flex gap-3 rounded px-2 py-1 hover:bg-surface"
                  >
                    <span className="w-16 shrink-0 text-sm text-muted">Art. {a.number}</span>
                    <span className="group-hover:text-accent">{a.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {c.sections.map((s) => (
              <div key={s.roman} className="mt-4">
                <h3 className="text-sm font-medium uppercase tracking-wide text-muted">
                  Afdeling {s.roman}{s.title ? ` — ${s.title}` : ""}
                </h3>
                <ul className="mt-2 space-y-1">
                  {s.articles.map((a) => (
                    <li key={a.number}>
                      <Link
                        href={`/artikel/${a.number}`}
                        className="group flex gap-3 rounded px-2 py-1 hover:bg-surface"
                      >
                        <span className="w-16 shrink-0 text-sm text-muted">Art. {a.number}</span>
                        <span className="group-hover:text-accent">{a.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}

        <section id="overwegingen">
          <h2 className="border-b border-line pb-2 text-lg font-semibold">Overwegingen</h2>
          <p className="mt-3">
            <Link href="/overwegingen" className="text-accent hover:underline">
              Alle {toc.recitalCount} overwegingen bekijken →
            </Link>
          </p>
        </section>

        {toc.annexes.length > 0 && (
          <section id="bijlagen">
            <h2 className="border-b border-line pb-2 text-lg font-semibold">Bijlagen</h2>
            <ul className="mt-3 space-y-1">
              {toc.annexes.map((a) => (
                <li key={a.roman}>
                  <Link
                    href={`/bijlage/${a.roman.toLowerCase()}`}
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
      </nav>

      <footer className="mt-12 border-t border-line pt-4 text-xs text-muted">
        Bron: Nederlandse tekst van Verordening (EU) 2022/2554 (DORA) via EUR-Lex. Geen officiële
        weergave; raadpleeg EUR-Lex voor de authentieke tekst.
      </footer>
    </div>
  );
}
