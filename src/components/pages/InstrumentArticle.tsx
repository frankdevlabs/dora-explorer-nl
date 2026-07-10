import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/content/ArticleBody";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PrevNextNav } from "@/components/layout/PrevNextNav";
import { RegisterTab } from "@/components/layout/RegisterTab";
import Link from "next/link";
import { RelatedRecitals } from "@/components/content/RelatedRecitals";
import { articlePrevNext, getArticle, getDoraBasis, getRecitalsForArticle } from "@/lib/data";
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
        {getDoraBasis(instrument, article.number).length > 0 && (
          <p className="mt-3 rounded-md border border-line bg-surface px-3 py-2 text-sm text-muted">
            Grondslag in DORA:{" "}
            {getDoraBasis(instrument, article.number).map((b, i) => (
              <span key={b.dora + (b.lid ?? "")}>
                {i > 0 && " · "}
                <Link
                  href={`/artikel/${b.dora}${b.lid !== undefined ? `#lid-${b.lid}` : ""}`}
                  className="text-accent hover:underline"
                >
                  artikel {b.dora}
                  {b.lid !== undefined ? `, lid ${b.lid}` : ""}
                </Link>
              </span>
            ))}
          </p>
        )}
      </header>
      <ArticleBody article={article} />
      <RelatedRecitals recitals={getRecitalsForArticle(article.number, instrument)} />
      <PrevNextNav {...articlePrevNext(nummer, instrument)} />
    </article>
  );
}
