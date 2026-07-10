import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ArrangementEditor } from "@/components/roi/RegisterWorkbench";

export const metadata: Metadata = {
  title: "Informatieregister — registervelden",
};

export default function OvereenkomstPage() {
  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: "Informatieregister", href: "/register" },
          { label: "Overeenkomst" },
        ]}
      />
      <Suspense fallback={<div className="py-12 text-center text-sm text-muted">Laden…</div>}>
        <ArrangementEditor />
      </Suspense>
    </div>
  );
}
