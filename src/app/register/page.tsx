import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { RegisterWorkbench } from "@/components/roi/RegisterWorkbench";

export const metadata: Metadata = {
  title: "Informatieregister",
  description:
    "Invulhulp voor het informatieregister van artikel 28, lid 3, DORA (ITS 2024/2956): entiteitsblok, registervelden per contractuele overeenkomst, toeleveringsketen en volledigheidscontrole.",
};

export default function RegisterPage() {
  return (
    <div>
      <Breadcrumbs crumbs={[{ label: "Informatieregister" }]} />
      <h1 className="mb-2 text-2xl font-bold">Informatieregister (art. 28, lid 3)</h1>
      <p className="mb-4 text-sm text-muted">
        Registratie volgens de 15 templates van Uitvoeringsverordening (EU){" "}
        <Link href="/its" className="text-accent hover:underline">
          2024/2956
        </Link>
        . Elke beoordeling uit het{" "}
        <Link href="/assessment/leverancier" className="text-accent hover:underline">
          leveranciersassessment
        </Link>{" "}
        is hier een record; assessmentantwoorden vullen de velden live, handmatige waarden
        overschrijven ze. Rapportagecyclus 2026: referentiedatum 31 december 2025, AFM-indiening
        uiterlijk 22 maart 2026 (xBRL-CSV; DNB 20 maart). Les uit de ESA-dry-run 2024: 86% van de
        datafouten was ontbrekende verplichte informatie — de tellers hieronder tonen precies die
        velden.
      </p>
      <RegisterWorkbench />
    </div>
  );
}
