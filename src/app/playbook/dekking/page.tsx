import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getAnnexes, getArticles } from "@/lib/data";
import { INSTRUMENT_IDS, INSTRUMENTS } from "@/lib/instruments";
import { getCoverage } from "@/lib/playbook/data";

export const metadata: Metadata = {
  title: "Dekkingsregister",
  description:
    "Verantwoording per artikel, lid en bijlage van DORA en alle level-2-handelingen: welke playbook-stap, definitie of autoriteitsbepaling elke bepaling dekt.",
};

export default function DekkingIndexPage() {
  const coverage = getCoverage();
  const rows = INSTRUMENT_IDS.map((id) => {
    const universe =
      getArticles(id).reduce((n, a) => n + a.paragraphs.length, 0) + getAnnexes(id).length;
    const block = coverage.instruments[id];
    const covered =
      Object.values(block.artikelen).reduce((n, byAnchor) => n + Object.keys(byAnchor).length, 0) +
      Object.keys(block.bijlagen).length;
    return { id, universe, covered };
  });
  return (
    <div>
      <Breadcrumbs crumbs={[{ label: "Playbook", href: "/playbook" }, { label: "Dekking" }]} />
      <h1 className="mb-2 text-2xl font-bold">Dekkingsregister</h1>
      <p className="mb-6 text-sm text-muted">
        Elke bepaling van het corpus krijgt hier een verantwoording: gedekt door een of meer
        playbook-stappen, of gemarkeerd als definitie, toepassingsgebied, autoriteitsbepaling of
        slotbepaling. Zo is controleerbaar dat geen artikel of lid is overgeslagen.
      </p>
      <ul className="space-y-2">
        {rows.map(({ id, universe, covered }) => (
          <li key={id}>
            <Link
              href={`/playbook/dekking/${id}`}
              className="group flex items-baseline justify-between gap-3 rounded-lg border border-line px-4 py-3 hover:border-accent"
            >
              <span>
                <span className="font-medium group-hover:text-accent">
                  {INSTRUMENTS[id].label}
                </span>{" "}
                <span className="text-sm text-muted">{INSTRUMENTS[id].citation}</span>
              </span>
              <span
                className={`shrink-0 text-sm ${covered === universe ? "text-green-700 dark:text-green-400" : "text-muted"}`}
              >
                {covered}/{universe}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
