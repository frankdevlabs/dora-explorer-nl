import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  PlaybookIndexCards,
  type DekkingCard,
  type DocumentenCard,
  type IndexCard,
} from "@/components/playbook/PlaybookIndexCards";
import { getCoverage, getDocuments, getPlaybook } from "@/lib/playbook/data";

export const metadata: Metadata = {
  title: "DORA-playbook",
  description:
    "Praktische playbooks om aan DORA te voldoen: concrete stappen met verwijzingen naar elke bepaling van de verordening en alle level-2-handelingen, plus een dekkingsregister dat laat zien dat geen artikel of lid is overgeslagen.",
};

const TAG: Record<IndexCard["key"], string> = {
  entiteit: "Verordening (EU) 2022/2554",
  aanbieder: "Art. 28–44 · incl. CTPP",
};
const MONO: Record<IndexCard["key"], string> = { entiteit: "FE", aanbieder: "3P" };
const TITEL: Record<IndexCard["key"], string> = {
  entiteit: "Financiële entiteit",
  aanbieder: "Derde aanbieder van ICT-diensten",
};
const BESCHRIJVING: Record<IndexCard["key"], string> = {
  entiteit:
    "Van scopebepaling tot oversight-interactie: governance, ICT-risicobeheerkader (volledig én vereenvoudigd regime), incidenten, testen/TLPT, derdenrisico en het informatieregister.",
  aanbieder:
    "Positiebepaling en criticaliteitszelftoets, contractuele gereedheid, onderaanneming, ondersteuning van klantverplichtingen en het CTPP-oversightregime.",
};

export default function PlaybookPage() {
  const entiteit = getPlaybook("entiteit");
  const universe = 654; // 637 leden + 17 bijlagen; asserted by verify-playbook

  const playbooks: IndexCard[] = (["entiteit", "aanbieder"] as const).map((key) => {
    const pb = getPlaybook(key);
    const stepIds = pb.fases.flatMap((f) => f.stappen.map((s) => s.id));
    return {
      key,
      mono: MONO[key],
      tag: TAG[key],
      titel: TITEL[key],
      beschrijving: BESCHRIJVING[key],
      faseCount: pb.fases.length,
      stapCount: stepIds.length,
      stepIds,
    };
  });

  const cov = getCoverage();
  const covered = Object.values(cov.instruments).reduce(
    (n, block) =>
      n +
      Object.values(block.artikelen).reduce((m, byAnchor) => m + Object.keys(byAnchor).length, 0) +
      Object.keys(block.bijlagen).length,
    0,
  );
  const dekking: DekkingCard = { covered, universe, complete: cov.meta.complete };

  // Epic 17: full curation finished — every step deliverable is a catalog doc,
  // meta.complete pinned in verify-playbook.
  const docs = getDocuments();
  const documenten: DocumentenCard = { count: docs.length, complete: true };

  return (
    <div>
      <Breadcrumbs crumbs={[{ label: "Playbook" }]} />
      <p className="font-mono text-[11px] tracking-wider text-muted uppercase">Overzicht</p>
      <h1 className="mt-1 mb-2 text-2xl font-bold">Kies uw route naar DORA-naleving</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Twee playbooks, elk opgebouwd uit gefaseerde stappen met acties, bewijsstukken en directe
        verwijzingen naar de wettelijke basis. Volg de fasen op volgorde of spring naar het
        dekkingsregister voor de status per verplichting.
      </p>

      <PlaybookIndexCards playbooks={playbooks} dekking={dekking} documenten={documenten} />

      <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-muted">
        {entiteit.meta.disclaimer}
      </p>
    </div>
  );
}
