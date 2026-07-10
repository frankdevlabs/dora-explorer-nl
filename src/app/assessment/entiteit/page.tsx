import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { EntityHome } from "@/components/assessment/EntityAssessment";

export const metadata: Metadata = {
  title: "Entiteitsassessment",
  description:
    "Bepaal per financiële entiteit het DORA-regime (volledig, vereenvoudigd of micro) en de verplichtingen per pijler.",
};

export default function EntiteitPage() {
  return (
    <div>
      <Breadcrumbs
        crumbs={[{ label: "Assessment", href: "/assessment" }, { label: "Entiteit" }]}
      />
      <h1 className="mb-2 text-2xl font-bold">Entiteitsassessment</h1>
      <p className="mb-6 text-sm text-muted">
        Achttien modules langs de DORA-pijlers: scope, governance, ICT-risicobeheer, incidenten,
        testen, derdenrisico, informatieregister en informatie-uitwisseling.
      </p>
      <EntityHome />
    </div>
  );
}
