import type { Metadata } from "next";
import { InstrumentAnnex } from "@/components/pages/InstrumentAnnex";
import { getAnnex, getAnnexOrder } from "@/lib/data";
import { INSTRUMENTS } from "@/lib/instruments";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAnnexOrder("its").map((roman) => ({ nummer: roman }));
}

type Props = { params: Promise<{ nummer: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nummer } = await params;
  const annex = getAnnex(nummer, "its");
  if (!annex) return {};
  return {
    title: `${INSTRUMENTS.its.label} — Bijlage ${annex.roman} — ${annex.title}`,
    description: `Bijlage ${annex.roman} van ${INSTRUMENTS.its.citation}: ${annex.title}`,
  };
}

export default async function Page({ params }: Props) {
  const { nummer } = await params;
  return <InstrumentAnnex instrument="its" nummer={nummer} />;
}
