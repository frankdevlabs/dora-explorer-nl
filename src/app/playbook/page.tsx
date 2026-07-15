import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getCoverage, getPlaybook, getPlaybookCounts } from "@/lib/playbook/data";

export const metadata: Metadata = {
  title: "DORA-playbook",
  description:
    "Praktische playbooks om aan DORA te voldoen: concrete stappen met verwijzingen naar elke bepaling van de verordening en alle level-2-handelingen, plus een dekkingsregister dat laat zien dat geen artikel of lid is overgeslagen.",
};

export default function PlaybookPage() {
  const entiteit = getPlaybook("entiteit");
  const counts = getPlaybookCounts();
  const complete = getCoverage().meta.complete;
  const universe = 654; // 637 leden + 17 bijlagen; asserted by verify-playbook
  return (
    <div>
      <Breadcrumbs crumbs={[{ label: "Playbook" }]} />
      <h1 className="mb-2 text-2xl font-bold">DORA-playbook</h1>
      <p className="mb-6 text-sm text-muted">
        Praktische stappen om aan DORA en alle level-2-handelingen te voldoen, met per stap de
        wettelijke basis. Het dekkingsregister verantwoordt elke bepaling van het corpus:
        actie, definitie, autoriteitsbepaling of slotbepaling.
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/playbook/entiteit"
          className="group rounded-lg border border-line p-4 hover:border-accent"
        >
          <p className="font-semibold group-hover:text-accent">Financiële entiteit</p>
          <p className="mt-1 text-sm text-muted">
            Van scopebepaling tot oversight-interactie: governance, ICT-risicobeheerkader
            (volledig én vereenvoudigd regime), incidenten, testen/TLPT, derdenrisico en het
            informatieregister. {counts.steps.entiteit} stappen.
          </p>
        </Link>
        <Link
          href="/playbook/aanbieder"
          className="group rounded-lg border border-line p-4 hover:border-accent"
        >
          <p className="font-semibold group-hover:text-accent">Derde aanbieder van ICT-diensten</p>
          <p className="mt-1 text-sm text-muted">
            Positiebepaling en criticaliteitszelftoets, contractuele gereedheid, onderaanneming,
            ondersteuning van klantverplichtingen en het CTPP-oversightregime.{" "}
            {counts.steps.aanbieder} stappen.
          </p>
        </Link>
      </div>

      <Link
        href="/playbook/dekking"
        className="group mb-6 block rounded-lg border border-line p-4 hover:border-accent"
      >
        <p className="font-semibold group-hover:text-accent">Dekkingsregister</p>
        <p className="mt-1 text-sm text-muted">
          Verantwoording per artikel en lid van alle 13 instrumenten ({counts.coverageEntries} van{" "}
          {universe} bepalingen gedekt{complete ? " en gereviewd" : " — in opbouw"}).
        </p>
      </Link>

      <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-muted">
        {entiteit.meta.disclaimer}
      </p>
    </div>
  );
}
