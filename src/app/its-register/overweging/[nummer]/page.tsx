import type { Metadata } from "next";
import { InstrumentRecital } from "@/components/pages/InstrumentRecital";
import { getRecitals } from "@/lib/data";
import { INSTRUMENTS } from "@/lib/instruments";

export const dynamicParams = false;

export function generateStaticParams() {
  return getRecitals("its").map((r) => ({ nummer: String(r.number) }));
}

type Props = { params: Promise<{ nummer: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nummer } = await params;
  return {
    title: `${INSTRUMENTS.its.label} — Overweging ${nummer}`,
    description: `Overweging ${nummer} van ${INSTRUMENTS.its.citation}`,
  };
}

export default async function Page({ params }: Props) {
  const { nummer } = await params;
  return <InstrumentRecital instrument="its" nummer={nummer} />;
}
