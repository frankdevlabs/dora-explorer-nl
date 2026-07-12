import type { Metadata } from "next";
import { InstrumentRecital } from "@/components/pages/InstrumentRecital";
import { getRecitals } from "@/lib/data";
import { INSTRUMENTS, instrumentBySlug, instrumentSlug, SATELLITE_IDS } from "@/lib/instruments";

export const dynamicParams = false;

export function generateStaticParams() {
  return SATELLITE_IDS.flatMap((id) =>
    getRecitals(id).map((r) => ({ instrument: instrumentSlug(id), nummer: String(r.number) })),
  );
}

type Props = { params: Promise<{ instrument: string; nummer: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { instrument, nummer } = await params;
  const id = instrumentBySlug(instrument)!;
  return {
    title: `${INSTRUMENTS[id].label} — Overweging ${nummer}`,
    description: `Overweging ${nummer} van ${INSTRUMENTS[id].citation}`,
  };
}

export default async function Page({ params }: Props) {
  const { instrument, nummer } = await params;
  return <InstrumentRecital instrument={instrumentBySlug(instrument)!} nummer={nummer} />;
}
