import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getEntityQuestionnaire } from "@/lib/assessment/data";

export const metadata: Metadata = {
  title: "DORA-assessment",
  description:
    "Twee zelfbeoordelingen onder DORA (Verordening (EU) 2022/2554): het regime en de verplichtingen van de financiële entiteit, en per ICT-overeenkomst of de dienst een kritieke of belangrijke functie ondersteunt. Alle gegevens blijven lokaal in de browser.",
};

export default function AssessmentPage() {
  const q = getEntityQuestionnaire();
  return (
    <div>
      <Breadcrumbs crumbs={[{ label: "Assessment" }]} />
      <h1 className="mb-2 text-2xl font-bold">DORA-assessment</h1>
      <p className="mb-6 text-sm text-muted">
        Twee vragenlijsten die samen het ICT-derdenrisicokader afdekken. Alle antwoorden blijven
        lokaal in de browser (localStorage); niets wordt verstuurd.
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/assessment/entiteit"
          className="group rounded-lg border border-line p-4 hover:border-accent"
        >
          <p className="font-semibold group-hover:text-accent">Entiteit</p>
          <p className="mt-1 text-sm text-muted">
            Voor de financiële entiteit als geheel: toepassingsgebied (art. 2), proportionaliteit
            en regime (art. 4/16), ICT-risicobeheer, incidenten, testen/TLPT, derdenrisico en het
            informatieregister — met een verplichtingen-checklist per pijler.
          </p>
        </Link>
        <Link
          href="/assessment/leverancier"
          className="group rounded-lg border border-line p-4 hover:border-accent"
        >
          <p className="font-semibold group-hover:text-accent">Leverancier / overeenkomst</p>
          <p className="mt-1 text-sm text-muted">
            Per ICT-contractuele overeenkomst: is het een ICT-dienst, ondersteunt die een kritieke
            of belangrijke functie (art. 3, punt 22), en welke verplichtingen gelden dan —
            basisset (art. 30, lid 2) of aanvullend (art. 30, lid 3 + RTS 2025/532). Voedt het
            informatieregister.
          </p>
        </Link>
      </div>

      <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-muted">
        {q.meta.disclaimer}
      </p>
    </div>
  );
}
