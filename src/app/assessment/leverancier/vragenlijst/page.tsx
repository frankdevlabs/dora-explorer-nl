import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SupplierWizard } from "@/components/assessment/SupplierAssessment";
import { buildRefPreviews } from "@/components/assessment/ref-previews";
import { getSupplierQuestionnaire } from "@/lib/assessment/data";

export const metadata: Metadata = {
  title: "Leveranciersassessment — vragenlijst",
};

export default function VragenlijstPage() {
  const previews = buildRefPreviews(getSupplierQuestionnaire());
  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: "Assessment", href: "/assessment" },
          { label: "Leverancier", href: "/assessment/leverancier" },
          { label: "Vragenlijst" },
        ]}
      />
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted">Laden…</div>}>
        <SupplierWizard previews={previews} />
      </Suspense>
    </div>
  );
}
