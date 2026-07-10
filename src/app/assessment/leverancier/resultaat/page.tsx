import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SupplierOutcome } from "@/components/assessment/SupplierAssessment";
import { buildRefPreviews } from "@/components/assessment/ref-previews";
import { getSupplierQuestionnaire } from "@/lib/assessment/data";

export const metadata: Metadata = {
  title: "Leveranciersassessment — resultaat",
};

export default function ResultaatPage() {
  const previews = buildRefPreviews(getSupplierQuestionnaire());
  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: "Assessment", href: "/assessment" },
          { label: "Leverancier", href: "/assessment/leverancier" },
          { label: "Resultaat" },
        ]}
      />
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted">Laden…</div>}>
        <SupplierOutcome previews={previews} />
      </Suspense>
    </div>
  );
}
