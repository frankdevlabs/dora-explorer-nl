import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentNodes } from "@/components/content/ContentNodes";
import { FootnoteList } from "@/components/content/FootnoteList";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PrevNextNav } from "@/components/layout/PrevNextNav";
import { RegisterTab } from "@/components/layout/RegisterTab";
import { annexPrevNext, getAnnex, getAnnexOrder } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAnnexOrder().map((roman) => ({ nummer: roman }));
}

type Props = { params: Promise<{ nummer: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nummer } = await params;
  const annex = getAnnex(nummer);
  if (!annex) return {};
  return {
    title: `Bijlage ${annex.roman} — ${annex.title}`,
    description: `Bijlage ${annex.roman}: ${annex.title}`,
  };
}

export default async function BijlagePage({ params }: Props) {
  const { nummer } = await params;
  const annex = getAnnex(nummer);
  if (!annex) notFound();

  return (
    <article>
      <RegisterTab
        href={`/bijlage/${nummer}`}
        label={`Bijl. ${annex.roman}`}
        title={annex.title}
      />
      <Breadcrumbs
        crumbs={[{ label: "Bijlagen", href: "/bijlagen" }, { label: `Bijlage ${annex.roman}` }]}
      />
      <header className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">
          Bijlage {annex.roman}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-balance">{annex.title}</h1>
      </header>
      <ContentNodes nodes={annex.content} />
      <FootnoteList footnotes={annex.footnotes} />
      <PrevNextNav {...annexPrevNext(annex.roman)} />
    </article>
  );
}
