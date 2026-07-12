import type { Metadata } from "next";
import { InstrumentAnnex } from "@/components/pages/InstrumentAnnex";
import { getAnnex, getAnnexOrder } from "@/lib/data";
import { INSTRUMENTS, instrumentBySlug, instrumentSlug, SATELLITE_IDS } from "@/lib/instruments";

export const dynamicParams = false;

export function generateStaticParams() {
  return SATELLITE_IDS.flatMap((id) =>
    getAnnexOrder(id).map((roman) => ({ instrument: instrumentSlug(id), nummer: roman })),
  );
}

type Props = { params: Promise<{ instrument: string; nummer: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { instrument, nummer } = await params;
  const id = instrumentBySlug(instrument)!;
  const annex = getAnnex(nummer, id);
  if (!annex) return {};
  return {
    title: `${INSTRUMENTS[id].label} — Bijlage ${annex.roman} — ${annex.title}`,
    description: `Bijlage ${annex.roman} van ${INSTRUMENTS[id].citation}: ${annex.title}`,
  };
}

export default async function Page({ params }: Props) {
  const { instrument, nummer } = await params;
  return <InstrumentAnnex instrument={instrumentBySlug(instrument)!} nummer={nummer} />;
}
