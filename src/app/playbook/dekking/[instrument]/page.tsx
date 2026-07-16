import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getAnnexes, getArticles } from "@/lib/data";
import { INSTRUMENT_IDS, INSTRUMENTS, type InstrumentId } from "@/lib/instruments";
import { getCoverage, getStepIndex } from "@/lib/playbook/data";
import type { CoverageEntry, Disposition, InstrumentCoverage } from "@/lib/playbook/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return INSTRUMENT_IDS.map((instrument) => ({ instrument }));
}

const DISPOSITION_LABEL: Record<Disposition, string> = {
  stap: "stap",
  definitie: "definitie",
  toepassingsgebied: "toepassingsgebied",
  autoriteit: "autoriteit",
  ctpp: "CTPP",
  slotbepaling: "slotbepaling",
  context: "context",
};

const DISPOSITION_STYLE: Record<Disposition, string> = {
  stap: "border-accent/50 bg-accent/10 text-accent",
  definitie: "border-line bg-surface",
  toepassingsgebied: "border-line bg-surface",
  autoriteit: "border-line bg-surface text-muted",
  ctpp: "border-line bg-surface",
  slotbepaling: "border-line bg-surface text-muted",
  context: "border-line bg-surface text-muted",
};

function anchorLabel(anchor: string): string {
  if (anchor === "inhoud") return "—";
  return anchor.replace("lid-", "lid ");
}

/** Universe (leden + bijlagen) and covered/stap/context tallies for an instrument. */
function tally(id: InstrumentId, block: InstrumentCoverage | undefined) {
  const universe =
    getArticles(id).reduce((n, a) => n + a.paragraphs.length, 0) + getAnnexes(id).length;
  let covered = 0;
  let stap = 0;
  if (block) {
    const entries: CoverageEntry[] = [
      ...Object.values(block.artikelen).flatMap((byAnchor) => Object.values(byAnchor)),
      ...Object.values(block.bijlagen),
    ];
    covered = entries.length;
    stap = entries.filter((e) => e.disposition === "stap").length;
  }
  return { universe, covered, stap, context: covered - stap, open: universe - covered };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ instrument: string }>;
}): Promise<Metadata> {
  const { instrument } = await params;
  return { title: `Dekking — ${INSTRUMENTS[instrument as InstrumentId]?.label ?? instrument}` };
}

function EntryCells({
  entry,
  stepHref,
}: {
  entry: CoverageEntry | undefined;
  stepHref: (id: string) => string;
}) {
  if (!entry) {
    return (
      <>
        <td className="px-4 py-2.5">
          <span className="rounded-full border border-dashed border-line px-2 py-0.5 text-[11px] text-muted">
            nog niet gedekt
          </span>
        </td>
        <td className="px-4 py-2.5" />
      </>
    );
  }
  return (
    <>
      <td className="px-4 py-2.5 align-top">
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap ${DISPOSITION_STYLE[entry.disposition]}`}
        >
          {DISPOSITION_LABEL[entry.disposition]}
        </span>
      </td>
      <td className="px-4 py-2.5 align-top text-xs">
        {entry.steps && entry.steps.length > 0 && (
          <span className="flex flex-wrap gap-1.5">
            {entry.steps.map((s) => (
              <Link
                key={s}
                href={stepHref(s)}
                className="rounded-md border border-accent/30 bg-accent/5 px-1.5 py-0.5 font-mono text-[11px] text-accent hover:bg-accent/10"
              >
                {s}
              </Link>
            ))}
          </span>
        )}
        {entry.note && <p className="mt-0.5 text-muted">{entry.note}</p>}
      </td>
    </>
  );
}

export default async function DekkingInstrumentPage({
  params,
}: {
  params: Promise<{ instrument: string }>;
}) {
  const { instrument } = await params;
  if (!INSTRUMENT_IDS.includes(instrument as InstrumentId)) notFound();
  const id = instrument as InstrumentId;
  const spec = INSTRUMENTS[id];
  const allCoverage = getCoverage().instruments;
  const coverage = allCoverage[id];
  const stepIndex = getStepIndex();
  const stepHref = (stepId: string) => {
    const loc = stepIndex[stepId];
    return loc ? `/playbook/${loc.playbook}/${loc.faseId}#${stepId}` : "/playbook";
  };
  const articles = getArticles(id);
  const annexes = getAnnexes(id);
  const t = tally(id, coverage);

  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: "Playbook", href: "/playbook" },
          { label: "Dekking", href: "/playbook/dekking" },
          { label: spec.label },
        ]}
      />
      <h1 className="mb-2 text-2xl font-bold">Dekkingsregister</h1>
      <p className="mb-5 max-w-2xl text-sm text-muted">
        Elke bepaling van het corpus krijgt een verantwoording: gedekt door een of meer
        playbook-stappen, of gemarkeerd als definitie, toepassingsgebied, autoriteitsbepaling of
        slotbepaling. Zo is controleerbaar dat geen artikel of lid is overgeslagen.
      </p>

      {/* Instrument selector */}
      <div className="mb-5 flex flex-wrap gap-2">
        {INSTRUMENT_IDS.map((iid) => {
          const it = tally(iid, allCoverage[iid]);
          const selected = iid === id;
          const full = it.covered === it.universe;
          return (
            <Link
              key={iid}
              href={`/playbook/dekking/${iid}`}
              aria-current={selected ? "page" : undefined}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                selected
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-foreground hover:border-accent"
              }`}
            >
              <span className="font-medium">{INSTRUMENTS[iid].label}</span>
              <span
                className={`font-mono text-[11px] ${full ? "text-green-700 dark:text-green-400" : "text-muted"}`}
              >
                {it.covered}/{it.universe}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Coverage summary */}
      <div className="mb-5 flex flex-wrap items-center gap-6 rounded-lg border border-line p-4">
        <div>
          <p className="font-semibold">{spec.label}</p>
          <p className="mt-0.5 text-xs text-muted">
            {t.covered} van {t.universe} bepalingen verantwoord
          </p>
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="flex h-2 overflow-hidden rounded-full bg-surface">
            <div className="bg-accent" style={{ width: `${(t.stap / t.universe) * 100}%` }} />
            <div
              className="bg-slate-400 dark:bg-slate-500"
              style={{ width: `${(t.context / t.universe) * 100}%` }}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-accent" />
              {t.stap} door stappen
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-slate-400 dark:bg-slate-500" />
              {t.context} definitie / context
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full border border-dashed border-line" />
              {t.open} nog niet gedekt
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] tracking-wide text-muted uppercase">
              <th className="px-4 py-3 font-medium">Bepaling</th>
              <th className="px-4 py-3 font-medium">Verantwoording</th>
              <th className="px-4 py-3 font-medium">Stappen / toelichting</th>
            </tr>
          </thead>
          <tbody>
            {articles.flatMap((a) =>
              a.paragraphs.map((p, pi) => (
                <tr key={`${a.number}-${p.anchor}`} className="border-b border-line/50">
                  <td className="px-4 py-2.5 align-top whitespace-nowrap">
                    <Link
                      href={`${spec.routePrefix}/artikel/${a.number}#${p.anchor}`}
                      className="font-mono text-accent hover:underline"
                    >
                      art. {a.number}
                      {p.anchor !== "inhoud" && `, ${anchorLabel(p.anchor)}`}
                    </Link>
                    {pi === 0 && (
                      <span className="ml-2 hidden text-xs text-muted lg:inline">{a.title}</span>
                    )}
                  </td>
                  <EntryCells entry={coverage.artikelen[a.number]?.[p.anchor]} stepHref={stepHref} />
                </tr>
              )),
            )}
            {annexes.map((ax) => (
              <tr key={`bijlage-${ax.roman}`} className="border-b border-line/50">
                <td className="px-4 py-2.5 align-top whitespace-nowrap">
                  <Link
                    href={`${spec.routePrefix}/bijlage/${ax.roman.toLowerCase()}`}
                    className="font-mono text-accent hover:underline"
                  >
                    bijlage {ax.roman}
                  </Link>
                </td>
                <EntryCells entry={coverage.bijlagen[ax.roman.toLowerCase()]} stepHref={stepHref} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
