import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { EntityOutcome } from "@/components/assessment/EntityAssessment";
import { buildRefPreviews } from "@/components/assessment/ref-previews";
import { getEntityQuestionnaire } from "@/lib/assessment/data";

export const metadata: Metadata = {
  title: "Entiteitsassessment — resultaat",
};

export default function ResultaatPage() {
  const previews = buildRefPreviews(getEntityQuestionnaire());
  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: "Assessment", href: "/assessment" },
          { label: "Entiteit", href: "/assessment/entiteit" },
          { label: "Resultaat" },
        ]}
      />
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted">Laden…</div>}>
        <EntityOutcome previews={previews} />
      </Suspense>
    </div>
  );
}
