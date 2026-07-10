import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Informatieregister — handleiding",
  description:
    "Rapportagecyclus, formaten (xBRL-CSV/DNB-Excel) en datakwaliteitslessen voor het DORA-informatieregister.",
};

export default function HandleidingPage() {
  return (
    <div>
      <Breadcrumbs
        crumbs={[{ label: "Informatieregister", href: "/register" }, { label: "Handleiding" }]}
      />
      <h1 className="mb-4 text-2xl font-bold">Handleiding informatieregister</h1>

      <div className="space-y-4 text-sm leading-relaxed">
        <section>
          <h2 className="mb-1 font-semibold">Grondslag en cyclus</h2>
          <p className="text-muted">
            Het register berust op{" "}
            <Link href="/artikel/28#lid-3" className="text-accent hover:underline">
              artikel 28, lid 3, DORA
            </Link>{" "}
            en de modellen van{" "}
            <Link href="/its" className="text-accent hover:underline">
              Uitvoeringsverordening (EU) 2024/2956
            </Link>{" "}
            (rectificatie 19 september 2025 verwerkt). Cyclus 2026: referentiedatum 31 december
            2025; indiening bij de AFM uiterlijk 22 maart 2026, bij DNB 20 maart 2026. De data
            voeden de CTPP-aanwijzing (art. 31; eerste 19 aanwijzingen op 18 november 2025).
            Overtreding van artikel 28 valt in boetecategorie 3 (basisbedrag € 2 mln, maximum
            € 4 mln) — het register is een hoofdnorm.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Formaten</h2>
          <p className="text-muted">
            De AFM verlangt sinds de 2026-cyclus indiening in <strong>xBRL-CSV</strong> conform de
            EBA-taxonomie; DNB accepteert een gestandaardiseerd Excel-template (framework 4.0) en
            converteert zelf. De CSV-exports van deze werkbank volgen de ITS-kolomcodes en
            -taxonomie (S01–S19, ISO 3166-1 alpha-2, ISO 4217, LEI/EUID) zodat ze direct in het
            indieningspakket of het DNB-template passen — ze zijn <em>niet</em> zelf het
            xBRL-CSV-pakket (geen report.json/metadata).
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Datakwaliteit — lessen uit de ESA-dry-run (2024)</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>
              Slechts 6,5% van de 947 registers doorstond alle 116 controles; <strong>86% van de
              fouten was ontbrekende verplichte informatie</strong>. De volledigheidstellers in de
              werkbank tonen precies die velden.
            </li>
            <li>
              Registers zonder geldige LEI's worden geweigerd: verifieer elke LEI in GLEIF (de
              werkbank controleert de ISO 17442-checksum) en let op de juiste contractentiteit —
              een EU-SARL is niet de Amerikaanse moeder.
            </li>
            <li>
              Gebruik codes, geen vrije tekst (S-codes, landcodes, gesloten lijsten) en registreer
              één record per contractuele overeenkomst — niet aggregeren per leverancier.
            </li>
            <li>
              Onderaannemers alleen voor zover zij kritieke of belangrijke diensten{" "}
              <em>daadwerkelijk ondersteunen</em> (
              <Link href="/its/artikel/3#lid-2" className="text-accent hover:underline">
                ITS art. 3, lid 2
              </Link>
              ), met ranking per{" "}
              <Link href="/its/artikel/2" className="text-accent hover:underline">
                ITS art. 2
              </Link>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Leveranciersuitvraag (Deel B)</h2>
          <p className="text-muted">
            De uitvraag-export per overeenkomst bevat de velden die alleen de aanbieder of de keten
            kent (B_05.01-identificatie incl. uiteindelijke moeder, B_05.02-keten, locatievelden
            B_02.02) met de ITS-referenties, klaar om contractueel uit te vragen: machineleesbaar,
            jaarlijks vóór de referentiedatum plus event-driven bij materiële wijzigingen, met
            doorwerking naar onderaannemers (
            <Link href="/rts/artikel/4" className="text-accent hover:underline">
              RTS art. 4
            </Link>
            ).
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold">Beperkingen van deze werkbank (v1)</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>
              Eén entiteit per register: de groepsmodellen (B_01.02/B_01.03/B_02.03/B_03.03) worden
              afgeleid of alleen als lege template geëxporteerd; groepsstructuren vult u in de CSV
              aan.
            </li>
            <li>Geen xBRL-CSV-pakketgeneratie; geen automatische GLEIF-verificatie.</li>
            <li>Alle gegevens blijven lokaal in de browser — maak back-ups (JSON-export).</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
