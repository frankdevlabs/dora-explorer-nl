import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getAnnexes, getArticles } from "@/lib/data";
import { INSTRUMENT_IDS, INSTRUMENTS, type InstrumentId } from "@/lib/instruments";
import { getCoverage, getStepIndex } from "@/lib/playbook/data";
import type { CoverageEntry, Disposition } from "@/lib/playbook/types";

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
        <td className="px-3 py-1.5">
          <span className="rounded-full border border-dashed border-line px-2 py-0.5 text-[11px] text-muted">
            nog niet gedekt
          </span>
        </td>
        <td className="px-3 py-1.5" />
      </>
    );
  }
  return (
    <>
      <td className="px-3 py-1.5 align-top">
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] ${DISPOSITION_STYLE[entry.disposition]}`}
        >
          {DISPOSITION_LABEL[entry.disposition]}
        </span>
      </td>
      <td className="px-3 py-1.5 align-top text-xs">
        {entry.steps && entry.steps.length > 0 && (
          <span>
            {entry.steps.map((s, i) => (
              <span key={s}>
                {i > 0 && ", "}
                <Link href={stepHref(s)} className="text-accent hover:underline">
                  {s}
                </Link>
              </span>
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
  const coverage = getCoverage().instruments[id];
  const stepIndex = getStepIndex();
  const stepHref = (stepId: string) => {
    const loc = stepIndex[stepId];
    return loc ? `/playbook/${loc.playbook}/${loc.faseId}#${stepId}` : "/playbook";
  };
  const articles = getArticles(id);
  const annexes = getAnnexes(id);

  return (
    <div>
      <Breadcrumbs
        crumbs={[
          { label: "Playbook", href: "/playbook" },
          { label: "Dekking", href: "/playbook/dekking" },
          { label: spec.label },
        ]}
      />
      <h1 className="mb-2 text-2xl font-bold">Dekking — {spec.label}</h1>
      <p className="mb-6 text-sm text-muted">{spec.title}.</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-3 py-2 font-medium">Bepaling</th>
              <th className="px-3 py-2 font-medium">Verantwoording</th>
              <th className="px-3 py-2 font-medium">Stappen / toelichting</th>
            </tr>
          </thead>
          <tbody>
            {articles.flatMap((a) =>
              a.paragraphs.map((p, pi) => (
                <tr key={`${a.number}-${p.anchor}`} className="border-b border-line/50">
                  <td className="px-3 py-1.5 align-top whitespace-nowrap">
                    <Link
                      href={`${spec.routePrefix}/artikel/${a.number}#${p.anchor}`}
                      className="text-accent hover:underline"
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
                <td className="px-3 py-1.5 align-top whitespace-nowrap">
                  <Link
                    href={`${spec.routePrefix}/bijlage/${ax.roman.toLowerCase()}`}
                    className="text-accent hover:underline"
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
