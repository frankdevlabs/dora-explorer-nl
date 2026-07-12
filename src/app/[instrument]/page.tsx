import type { Metadata } from "next";
import { InstrumentIndex } from "@/components/pages/InstrumentIndex";
import { INSTRUMENTS, instrumentBySlug, instrumentSlug, SATELLITE_IDS } from "@/lib/instruments";

export const dynamicParams = false;

export function generateStaticParams() {
  return SATELLITE_IDS.map((id) => ({ instrument: instrumentSlug(id) }));
}

type Props = { params: Promise<{ instrument: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { instrument } = await params;
  const spec = INSTRUMENTS[instrumentBySlug(instrument)!];
  return {
    title: `${spec.label} — ${spec.citation}`,
    description: spec.title,
  };
}

export default async function Page({ params }: Props) {
  const { instrument } = await params;
  return <InstrumentIndex instrument={instrumentBySlug(instrument)!} />;
}
