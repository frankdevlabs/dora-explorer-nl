import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/content/ArticleBody";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PrevNextNav } from "@/components/layout/PrevNextNav";
import { RegisterTab } from "@/components/layout/RegisterTab";
import { articlePrevNext, getArticle } from "@/lib/data";
import { INSTRUMENTS, type InstrumentId } from "@/lib/instruments";

/** Article page body for the satellite instruments (its/rts — no chapters). */
export function InstrumentArticle({
  instrument,
  nummer,
}: {
  instrument: InstrumentId;
  nummer: string;
}) {
  const spec = INSTRUMENTS[instrument];
  const article = getArticle(Number(nummer), instrument);
  if (!article) notFound();

  return (
    <article>
      <RegisterTab
        href={`${spec.routePrefix}/artikel/${nummer}`}
        label={`${spec.label} art. ${article.number}`}
        title={article.title}
      />
      <Breadcrumbs
        crumbs={[
          { label: spec.label, href: spec.routePrefix || "/" },
          { label: `Artikel ${article.number}` },
        ]}
      />
      <header className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">
          Artikel {article.number}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-balance">{article.title}</h1>
        <p className="mt-2 text-sm text-muted">{spec.title}</p>
      </header>
      <ArticleBody article={article} />
      <PrevNextNav {...articlePrevNext(nummer, instrument)} />
    </article>
  );
}
