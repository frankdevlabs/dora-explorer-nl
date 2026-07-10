import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SearchResults } from "@/components/search/SearchResults";

export const metadata: Metadata = {
  title: "Zoeken",
  description: "Zoek in de volledige Nederlandse tekst van DORA (Verordening (EU) 2022/2554)",
};

export default function ZoekenPage() {
  return (
    <div>
      <Breadcrumbs crumbs={[{ label: "Zoeken" }]} />
      <h1 className="mb-6 text-2xl font-bold">Zoeken</h1>
      <Suspense>
        <SearchResults />
      </Suspense>
    </div>
  );
}
