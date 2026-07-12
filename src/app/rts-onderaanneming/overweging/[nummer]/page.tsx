import type { Metadata } from "next";
import { InstrumentRecital } from "@/components/pages/InstrumentRecital";
import { getRecitals } from "@/lib/data";
import { INSTRUMENTS } from "@/lib/instruments";

export const dynamicParams = false;

export function generateStaticParams() {
  return getRecitals("rts").map((r) => ({ nummer: String(r.number) }));
}

type Props = { params: Promise<{ nummer: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nummer } = await params;
  return {
    title: `${INSTRUMENTS.rts.label} — Overweging ${nummer}`,
    description: `Overweging ${nummer} van ${INSTRUMENTS.rts.citation}`,
  };
}

export default async function Page({ params }: Props) {
  const { nummer } = await params;
  return <InstrumentRecital instrument="rts" nummer={nummer} />;
}
