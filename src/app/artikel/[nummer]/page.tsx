import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/content/ArticleBody";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { PrevNextNav } from "@/components/layout/PrevNextNav";
import { RegisterTab } from "@/components/layout/RegisterTab";
import { articlePrevNext, getArticle, getArticleOrder } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getArticleOrder().map((e) => ({ nummer: e.slug }));
}

type Props = { params: Promise<{ nummer: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nummer } = await params;
  const article = getArticle(Number(nummer));
  if (!article) return {};
  return {
    title: `Artikel ${article.number} — ${article.title}`,
    description: `Artikel ${article.number} van DORA (Verordening (EU) 2022/2554): ${article.title}`,
  };
}

export default async function ArtikelPage({ params }: Props) {
  const { nummer } = await params;
  const article = getArticle(Number(nummer));
  if (!article) notFound();

  const display = `Artikel ${article.number}`;

  const crumbs: Crumb[] = [
    { label: `Hoofdstuk ${article.chapter}`, href: `/#hoofdstuk-${article.chapter.toLowerCase()}` },
  ];
  if (article.section !== null && article.sectionTitle) {
    crumbs.push({ label: `Afdeling ${article.section}` });
  }
  crumbs.push({ label: display });

  return (
    <article>
      <RegisterTab
        href={`/artikel/${nummer}`}
        label={display.replace(/^Artikel/, "Art.")}
        title={article.title}
      />
      <Breadcrumbs crumbs={crumbs} />
      <header className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">{display}</p>
        <h1 className="mt-1 text-2xl font-bold text-balance">{article.title}</h1>
        <p className="mt-2 text-sm text-muted">
          Hoofdstuk {article.chapter} — {article.chapterTitle}
          {article.sectionTitle ? ` · Afdeling ${article.section} — ${article.sectionTitle}` : ""}
        </p>
      </header>
      <ArticleBody article={article} />
      <PrevNextNav {...articlePrevNext(nummer)} />
    </article>
  );
}
