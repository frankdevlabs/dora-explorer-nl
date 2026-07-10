import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Informatieregister",
  description:
    "Invulhulp voor het informatieregister van artikel 28, lid 3, DORA (ITS 2024/2956): registratie per contractuele overeenkomst, met CSV-export per template en een leveranciersuitvraag.",
};

export default function RegisterPage() {
  return (
    <div>
      <Breadcrumbs crumbs={[{ label: "Informatieregister" }]} />
      <h1 className="mb-2 text-2xl font-bold">Informatieregister (art. 28, lid 3)</h1>
      <p className="mb-4 text-sm text-muted">
        Financiële entiteiten houden een register van informatie bij over álle contractuele
        overeenkomsten voor ICT-diensten, volgens de 15 templates van Uitvoeringsverordening (EU){" "}
        <Link href="/its" className="text-accent hover:underline">
          2024/2956
        </Link>{" "}
        (B_01.01 t/m B_99.01). De registerwerkbank — recordbeheer per template,
        volledigheidscontrole, CSV-export per template en de leveranciersuitvraag — wordt in de
        volgende fase van dit project opgeleverd.
      </p>
      <p className="mb-6 text-sm text-muted">
        Nu al beschikbaar: het{" "}
        <Link href="/assessment/leverancier" className="text-accent hover:underline">
          leveranciersassessment
        </Link>{" "}
        per contractuele overeenkomst, dat de classificatie (kritieke of belangrijke functie) en
        een deel van de registervelden (B_02, B_05.01, B_06.01, B_07.01) alvast vastlegt.
      </p>
      <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-muted">
        <p>
          Rapportagecyclus 2026: referentiedatum 31 december 2025; indiening bij de AFM uiterlijk
          22 maart 2026 (xBRL-CSV), bij DNB 20 maart 2026. Les uit de ESA-dry-run 2024: 86% van de
          datafouten was ontbrekende verplichte informatie — begin met de LEI's en de verplichte
          sleutelvelden.
        </p>
      </div>
    </div>
  );
}
