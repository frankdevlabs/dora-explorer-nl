import type { Metadata } from "next";
import { InstrumentIndex } from "@/components/pages/InstrumentIndex";
import { INSTRUMENTS } from "@/lib/instruments";

export const metadata: Metadata = {
  title: "RoI-ITS — Uitvoeringsverordening (EU) 2024/2956",
  description: INSTRUMENTS.its.title,
};

export default function ItsIndexPage() {
  return <InstrumentIndex instrument="its" />;
}
