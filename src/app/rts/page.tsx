import type { Metadata } from "next";
import { InstrumentIndex } from "@/components/pages/InstrumentIndex";
import { INSTRUMENTS } from "@/lib/instruments";

export const metadata: Metadata = {
  title: "Onderaannemings-RTS — Gedelegeerde Verordening (EU) 2025/532",
  description: INSTRUMENTS.rts.title,
};

export default function RtsIndexPage() {
  return <InstrumentIndex instrument="rts" />;
}
