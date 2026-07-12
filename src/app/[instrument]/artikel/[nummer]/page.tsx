import type { Metadata } from "next";
import { InstrumentArticle } from "@/components/pages/InstrumentArticle";
import { getArticle, getArticleOrder } from "@/lib/data";
import { INSTRUMENTS, instrumentBySlug, instrumentSlug, SATELLITE_IDS } from "@/lib/instruments";

export const dynamicParams = false;

export function generateStaticParams() {
  return SATELLITE_IDS.flatMap((id) =>
    getArticleOrder(id).map((e) => ({ instrument: instrumentSlug(id), nummer: e.slug })),
  );
}

type Props = { params: Promise<{ instrument: string; nummer: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { instrument, nummer } = await params;
  const id = instrumentBySlug(instrument)!;
  const article = getArticle(Number(nummer), id);
  if (!article) return {};
  return {
    title: `${INSTRUMENTS[id].label} — Artikel ${article.number} — ${article.title}`,
    description: `Artikel ${article.number} van ${INSTRUMENTS[id].citation}: ${article.title}`,
  };
}

export default async function Page({ params }: Props) {
  const { instrument, nummer } = await params;
  return <InstrumentArticle instrument={instrumentBySlug(instrument)!} nummer={nummer} />;
}
