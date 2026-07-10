import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SupplierHome } from "@/components/assessment/SupplierAssessment";

export const metadata: Metadata = {
  title: "Leveranciersassessment",
  description:
    "Beoordeel per ICT-contractuele overeenkomst of de dienst een kritieke of belangrijke functie ondersteunt en welke DORA-verplichtingen gelden (art. 28-30; RTS 2025/532).",
};

export default function LeverancierPage() {
  return (
    <div>
      <Breadcrumbs
        crumbs={[{ label: "Assessment", href: "/assessment" }, { label: "Leverancier" }]}
      />
      <h1 className="mb-2 text-2xl font-bold">Leveranciersassessment</h1>
      <SupplierHome />
    </div>
  );
}
