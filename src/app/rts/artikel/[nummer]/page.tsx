import type { Metadata } from "next";
import { InstrumentArticle } from "@/components/pages/InstrumentArticle";
import { getArticle, getArticleOrder } from "@/lib/data";
import { INSTRUMENTS } from "@/lib/instruments";

export const dynamicParams = false;

export function generateStaticParams() {
  return getArticleOrder("rts").map((e) => ({ nummer: e.slug }));
}

type Props = { params: Promise<{ nummer: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nummer } = await params;
  const article = getArticle(Number(nummer), "rts");
  if (!article) return {};
  return {
    title: `${INSTRUMENTS.rts.label} — Artikel ${article.number} — ${article.title}`,
    description: `Artikel ${article.number} van ${INSTRUMENTS.rts.citation}: ${article.title}`,
  };
}

export default async function Page({ params }: Props) {
  const { nummer } = await params;
  return <InstrumentArticle instrument="rts" nummer={nummer} />;
}
