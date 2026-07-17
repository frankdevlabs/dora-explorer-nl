import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PRECISION_SEARCH_OPTIONS, makeSnippet, searchDocs } from "../../src/lib/search-core.js";
import {
  BASE_URL,
  INSTRUMENTS,
  INSTRUMENT_IDS,
  type InstrumentId,
  corpora,
  getAnnex,
  getArticle,
  getRecital,
  index,
  l2Map,
  normalizeArticleInput,
  playbook,
  recitalMap,
} from "./data.js";
import type { DocCategory, PlaybookStep } from "../../src/lib/playbook/types.js";
import { isDocRef } from "../../src/lib/playbook/types.js";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "../../src/lib/playbook/ui.js";
import { renderAnnex, renderArticle, renderText } from "./render.js";

const text = (md: string) => ({ content: [{ type: "text" as const, text: md }] });
const err = (md: string) => ({ content: [{ type: "text" as const, text: md }], isError: true });

/** "dora:28" → deep link + label for MCP output. */
function compositeArticleLink(key: string): string {
  const [inst, num] = key.split(":") as [InstrumentId, string];
  const prefix = INSTRUMENTS[inst].routePrefix;
  const tag = inst === "dora" ? "" : ` (${INSTRUMENTS[inst].label})`;
  return `[artikel ${num}${tag}](${BASE_URL}${prefix}/artikel/${num})`;
}

function compositeRecitalLink(key: string): string {
  const [inst, num] = key.split(":") as [InstrumentId, string];
  const prefix = INSTRUMENTS[inst].routePrefix;
  const tag = inst === "dora" ? "" : ` (${INSTRUMENTS[inst].label})`;
  return `[overweging ${num}${tag}](${BASE_URL}${prefix}/overweging/${num})`;
}

const instrumentList = INSTRUMENT_IDS.map(
  (id) => `"${id}" (${INSTRUMENTS[id].label} ${INSTRUMENTS[id].citation.match(/\d{4}\/\d+/)?.[0]}${id === "dora" ? ", default" : ""})`,
).join(", ");

const instrumentEnum = z
  .enum(INSTRUMENT_IDS as [InstrumentId, ...InstrumentId[]])
  .optional()
  .describe(`Instrument: ${instrumentList}`);

const articleRanges = INSTRUMENT_IDS.map(
  (id) => `${INSTRUMENTS[id].label}: 1-${corpora[id].articles.length}`,
).join("; ");

const recitalRanges = INSTRUMENT_IDS.map(
  (id) => `${INSTRUMENTS[id].label}: 1-${corpora[id].recitals.length}`,
).join("; ");

const annexInstruments = INSTRUMENT_IDS.filter((id) => corpora[id].annexes.length > 0);

export function createServer(): McpServer {
  const server = new McpServer({ name: "dora-explorer-nl", version: "0.1.0" });

  server.registerTool(
    "search_dora",
    {
      title: "Zoek in DORA + uitvoeringshandelingen",
      description:
        "Full-text search in the Dutch text of DORA (Regulation (EU) 2022/2554) and its level-2 " +
        `acts (${INSTRUMENT_IDS.length - 1} RTS/ITS/delegated regulations), plus the editorial ` +
        "compliance-playbook steps. Returns hits with deep links to " +
        BASE_URL +
        ". Query in Dutch works best. Reference queries also work: \"artikel 28 lid 3\", " +
        '"its artikel 2", "its bijlage iii" (instrument ids: ' +
        INSTRUMENT_IDS.join(", ") +
        "). Use type:\"stap\" for playbook steps, type:\"document\" for expected-documentation catalog entries.",
      inputSchema: {
        query: z.string().min(2).describe("Search terms (Dutch)"),
        limit: z.number().int().min(1).max(50).optional().describe("Max results, default 10"),
        type: z
          .enum(["artikel", "overweging", "bijlage", "stap", "document"])
          .optional()
          .describe("Restrict to articles, recitals, annexes, playbook steps or documents"),
        instrument: instrumentEnum,
      },
    },
    async ({ query, limit, type, instrument }) => {
      let hits = searchDocs(index, query, 50, PRECISION_SEARCH_OPTIONS);
      if (type) hits = hits.filter((h) => h.type === type);
      if (instrument) hits = hits.filter((h) => h.instrument === instrument);
      hits = hits.slice(0, limit ?? 10);
      if (!hits.length) return text(`Geen resultaten voor "${query}".`);
      const body = hits
        .map((h) => {
          // short chunks (per-point annex docs, single leden) quoted in full,
          // so agents rarely need a follow-up get_article/get_annex call
          const quoted = h.text.length <= 600 ? h.text : makeSnippet(h.text, h.terms, 200);
          const terms = [...new Set(h.queryTerms)].join(", ");
          // stap docs carry the playbook kind (entiteit|aanbieder) as instrument,
          // not a legal-instrument id, so tag them as a playbook step.
          const tag =
            h.type === "stap"
              ? ` [playbook: ${h.instrument}]`
              : h.type === "document"
                ? ` [document: ${h.ref}]`
                : h.instrument === "dora"
                  ? ""
                  : ` [${INSTRUMENTS[h.instrument as InstrumentId].label}]`;
          return `### ${h.heading}${tag}\n${BASE_URL}${h.url}\n_Gevonden termen: ${terms}_\n> ${quoted.replace(/\n+/g, " ")}`;
        })
        .join("\n\n");
      return text(body);
    },
  );

  server.registerTool(
    "get_article",
    {
      title: "Artikel ophalen",
      description: `Full Dutch text of an article. ${articleRanges}.`,
      inputSchema: {
        number: z.string().describe('Article number, e.g. "28"'),
        instrument: instrumentEnum,
      },
    },
    async ({ number, instrument }) => {
      const inst: InstrumentId = instrument ?? "dora";
      const key = normalizeArticleInput(number);
      const article = /^\d+$/.test(key) ? getArticle(Number(key), inst) : undefined;
      if (!article) {
        const max = corpora[inst].articles.length;
        return err(
          `Artikel "${number}" niet gevonden in ${INSTRUMENTS[inst].citation} (bereik: 1–${max}).`,
        );
      }
      let md = renderArticle(article, inst);
      const related = recitalMap.byArticle[`${inst}:${article.number}`];
      if (related?.length) {
        md += `\n\n**Relevante overwegingen:** ${related.map(compositeRecitalLink).join(" · ")}`;
      }
      if (inst === "dora") {
        const l2 = l2Map.byDora[String(article.number)];
        if (l2?.length) {
          md += `\n\n**Uitvoeringsbepalingen (ITS/RTS):** ${l2
            .map((l) => `[${l.target}](${BASE_URL}${l.href}) — ${l.label}`)
            .join(" · ")}`;
        }
      } else {
        const basis = l2Map.byTarget[`${inst}:${article.number}`];
        if (basis?.length) {
          md += `\n\n**Grondslag in DORA:** ${basis
            .map((b) => `[artikel ${b.dora}${b.lid !== undefined ? `, lid ${b.lid}` : ""}](${BASE_URL}/artikel/${b.dora})`)
            .join(" · ")}`;
        }
      }
      return text(md);
    },
  );

  server.registerTool(
    "get_recital",
    {
      title: "Overweging ophalen",
      description: `Full Dutch text of a recital (overweging). ${recitalRanges}.`,
      inputSchema: {
        number: z.coerce.number().int().min(1).describe("Recital number"),
        instrument: instrumentEnum,
      },
    },
    async ({ number, instrument }) => {
      const inst: InstrumentId = instrument ?? "dora";
      const r = getRecital(number, inst);
      if (!r) {
        const max = corpora[inst].recitals.length;
        return err(
          `Overweging ${number} niet gevonden in ${INSTRUMENTS[inst].citation} (bereik: 1–${max}).`,
        );
      }
      const prefix = INSTRUMENTS[inst].routePrefix;
      const body = r.paragraphs.map((p) => renderText(p.text, p.refs)).join("\n\n");
      const slugs = recitalMap.byRecital[`${inst}:${r.number}`];
      const related = slugs?.length
        ? `\n\n**Relevante artikelen:** ${slugs.map(compositeArticleLink).join(" · ")}`
        : "";
      return text(
        `# Overweging ${r.number}\n\n*${INSTRUMENTS[inst].citation}*\n\n${body}${related}\n\n**Deep link**: ${BASE_URL}${prefix}/overweging/${r.number}`,
      );
    },
  );

  server.registerTool(
    "get_annex",
    {
      title: "Bijlage ophalen",
      description:
        "Full Dutch text of an annex (bijlage) by Roman numeral. Instruments with annexes: " +
        annexInstruments
          .map((id) => `${INSTRUMENTS[id].label} (${corpora[id].annexes.map((x) => x.roman).join(", ")})`)
          .join("; ") +
        '. Default instrument: "its" (RoI-ITS).',
      inputSchema: {
        roman: z.string().describe('Annex Roman numeral, e.g. "III"'),
        instrument: instrumentEnum,
      },
    },
    async ({ roman, instrument }) => {
      const inst: InstrumentId = instrument ?? "its";
      const key = roman.trim().replace(/^bijlage\s*/i, "");
      const a = getAnnex(key, inst);
      if (!a) {
        const known = corpora[inst].annexes.map((x) => x.roman).join(", ") || "geen";
        return err(
          `Bijlage "${roman}" niet gevonden in ${INSTRUMENTS[inst].citation}. Beschikbaar: ${known}.`,
        );
      }
      return text(renderAnnex(a, inst));
    },
  );

  server.registerTool(
    "get_structure",
    {
      title: "Structuur (inhoudsopgave)",
      description:
        `Compact table of contents of all ${INSTRUMENT_IDS.length} instruments (DORA + its ` +
        "level-2 acts): chapters/sections/articles, annexes, recital counts.",
      inputSchema: {},
    },
    async () => {
      const lines: string[] = [];
      for (const id of INSTRUMENT_IDS) {
        const spec = INSTRUMENTS[id];
        const { toc } = corpora[id];
        const prefix = spec.routePrefix;
        lines.push(`# ${spec.citation}`);
        if (toc.chapters.length > 0) {
          for (const ch of toc.chapters) {
            lines.push(`## Hoofdstuk ${ch.roman} — ${ch.title}`);
            for (const a of ch.articles)
              lines.push(`- Artikel ${a.number}: ${a.title} — ${BASE_URL}${prefix}/artikel/${a.number}`);
            for (const s of ch.sections) {
              lines.push(`### Afdeling ${s.roman}${s.title ? ` — ${s.title}` : ""}`);
              for (const a of s.articles)
                lines.push(`- Artikel ${a.number}: ${a.title} — ${BASE_URL}${prefix}/artikel/${a.number}`);
            }
          }
        } else {
          for (const a of corpora[id].articles)
            lines.push(`- Artikel ${a.number}: ${a.title} — ${BASE_URL}${prefix}/artikel/${a.number}`);
        }
        if (toc.annexes.length > 0) {
          lines.push(`## Bijlagen`);
          for (const a of toc.annexes)
            lines.push(
              `- Bijlage ${a.roman}: ${a.title} — ${BASE_URL}${prefix}/bijlage/${a.roman.toLowerCase()}`,
            );
        }
        lines.push(
          `${toc.recitalCount} overwegingen — ${BASE_URL}${prefix ? `${prefix}` : "/overwegingen"}`,
          "",
        );
      }
      return text(lines.join("\n"));
    },
  );

  const renderStep = (s: PlaybookStep, kind: string, faseId: string): string => {
    const lines = [
      `### ${s.titel} (\`${s.id}\`)`,
      `${BASE_URL}/playbook/${kind}/${faseId}#${s.id}`,
      `*${s.doel}*`,
      ...s.acties.map((a) => `- ${a}`),
    ];
    if (s.bewijsstukken?.length) {
      const bew = s.bewijsstukken.map((b) => {
        if (!isDocRef(b)) return b;
        const doc = playbook.byDoc[b.docId]?.doc;
        const naam = doc?.naam ?? b.docId;
        const label = b.detail ? `${naam} — ${b.detail}` : naam;
        return `[${label}](${BASE_URL}/playbook/documenten#${b.docId})`;
      });
      lines.push(`**Bewijsstukken:** ${bew.join(" · ")}`);
    }
    if (s.rollen?.length) lines.push(`**Rollen:** ${s.rollen.join(", ")}`);
    lines.push(
      `**Geldt voor:** ${s.appliesTo.join(", ")} — **Basis:** ${s.refs
        .map((r) => `[${r.label}](${BASE_URL}${r.href})`)
        .join(" · ")}`,
    );
    return lines.join("\n");
  };

  server.registerTool(
    "get_playbook",
    {
      title: "Playbook ophalen",
      description:
        "Practical DORA-compliance playbook steps (Dutch) with legal-basis deep links. " +
        'kind "entiteit" (financial entity) or "aanbieder" (ICT third-party provider incl. CTPP); ' +
        'optional fase id narrows to one phase (entiteit: "f0".."f8", aanbieder: "f1".."f5").',
      inputSchema: {
        kind: z.enum(["entiteit", "aanbieder"]).describe("Which playbook"),
        fase: z.string().optional().describe('Fase id, e.g. "f1"'),
      },
    },
    async ({ kind, fase }) => {
      const pb = kind === "entiteit" ? playbook.entiteit : playbook.aanbieder;
      const fases = fase ? pb.fases.filter((f) => f.id === fase) : pb.fases;
      if (!fases.length) {
        return err(
          `Fase "${fase}" niet gevonden. Beschikbaar: ${pb.fases.map((f) => f.id).join(", ")}.`,
        );
      }
      const body = fases
        .map((f) => {
          const head = `## Fase ${f.nr} — ${f.titel}`;
          const steps = f.stappen.length
            ? f.stappen.map((s) => renderStep(s, kind, f.id)).join("\n\n")
            : "_Stappen voor deze fase worden nog samengesteld._";
          return `${head}\n${steps}`;
        })
        .join("\n\n");
      return text(`# ${pb.meta.title}\n\n${body}\n\n> ${pb.meta.disclaimer}`);
    },
  );

  server.registerTool(
    "get_coverage",
    {
      title: "Dekkingsregister: wat moet ik doen voor dit artikel?",
      description:
        "Reverse lookup from a provision to playbook steps: per lid the disposition " +
        "(stap/definitie/toepassingsgebied/autoriteit/ctpp/slotbepaling/context), the implementing " +
        `steps and editorial notes. Coverage register: ${BASE_URL}/playbook/dekking. ` +
        "Curation in progress: uncovered leden are listed as such.",
      inputSchema: {
        number: z.string().describe('Article number, e.g. "28"'),
        instrument: instrumentEnum,
      },
    },
    async ({ number, instrument }) => {
      const inst: InstrumentId = instrument ?? "dora";
      const key = normalizeArticleInput(number);
      const article = /^\d+$/.test(key) ? getArticle(Number(key), inst) : undefined;
      if (!article) {
        const max = corpora[inst].articles.length;
        return err(
          `Artikel "${number}" niet gevonden in ${INSTRUMENTS[inst].citation} (bereik: 1–${max}).`,
        );
      }
      const block = playbook.coverage.instruments[inst]?.artikelen[String(article.number)] ?? {};
      const prefix = INSTRUMENTS[inst].routePrefix;
      const lines = article.paragraphs.map((p) => {
        const label = p.anchor === "inhoud" ? "artikel (geen leden)" : p.anchor.replace("lid-", "lid ");
        const link = `${BASE_URL}${prefix}/artikel/${article.number}#${p.anchor}`;
        const entry = block[p.anchor];
        if (!entry) return `- **${label}** — nog niet gedekt (curatie loopt) — ${link}`;
        const steps = entry.steps?.length
          ? ` — stappen: ${entry.steps
              .map((s) => {
                const loc = playbook.byStep[s];
                return loc
                  ? `[\`${s}\`](${BASE_URL}/playbook/${loc.playbook}/${loc.faseId}#${s})`
                  : `\`${s}\``;
              })
              .join(", ")}`
          : "";
        const note = entry.note ? ` — ${entry.note}` : "";
        return `- **${label}**: ${entry.disposition}${steps}${note} — ${link}`;
      });
      const total = article.paragraphs.length;
      const covered = article.paragraphs.filter((p) => block[p.anchor]).length;
      const unit = total === 1 && article.paragraphs[0].anchor === "inhoud" ? "artikel" : "leden";
      const summary =
        covered === total
          ? `**Dekking: ${covered}/${total} ${unit} gedekt.**`
          : `**Dekking: ${covered}/${total} ${unit} gedekt — ${total - covered} in curatie.**`;
      return text(
        `# Dekking — artikel ${article.number} ${INSTRUMENTS[inst].citation}\n_${article.title}_\n\n${summary}\n\n${lines.join("\n")}`,
      );
    },
  );

  const categoryEnum = z
    .enum(CATEGORY_ORDER as unknown as [DocCategory, ...DocCategory[]])
    .optional()
    .describe("Restrict to one document category");

  server.registerTool(
    "get_documents",
    {
      title: "Documentenregister: welke documentatie verwacht DORA?",
      description:
        "The expected-documentation catalog: every document, policy, register, plan, procedure, " +
        "report or contract DORA and its level-2 acts expect an organisation to produce. Per " +
        "document the legal basis (deep links) and the playbook steps that produce it. Register: " +
        `${BASE_URL}/playbook/documenten. Curation in progress; optionally filter by category.`,
      inputSchema: {
        category: categoryEnum,
      },
    },
    async ({ category }) => {
      const docs = category
        ? playbook.documenten.filter((d) => d.category === category)
        : playbook.documenten;
      if (!docs.length) {
        return text(
          category
            ? `Geen documenten in categorie "${category}" (curatie loopt).`
            : "De documentcatalogus wordt nog samengesteld.",
        );
      }
      const body = docs
        .map((doc) => {
          const basis = doc.refs
            .map((r) => `[${r.label}](${BASE_URL}${r.href})`)
            .join(" · ");
          const steps = (playbook.byDoc[doc.id]?.steps ?? [])
            .map((s) => {
              const loc = playbook.byStep[s];
              return loc
                ? `[\`${s}\`](${BASE_URL}/playbook/${loc.playbook}/${loc.faseId}#${s})`
                : `\`${s}\``;
            })
            .join(", ");
          const lines = [
            `### ${doc.naam} [${CATEGORY_LABEL[doc.category]}]`,
            `${BASE_URL}/playbook/documenten#${doc.id}`,
            `*${doc.omschrijving}*`,
          ];
          if (doc.cadans || doc.eigenaar) {
            lines.push(
              `**${[doc.cadans, doc.eigenaar].filter(Boolean).join(" · ")}**`,
            );
          }
          lines.push(`**Basis:** ${basis}`);
          if (steps) lines.push(`**Geproduceerd door:** ${steps}`);
          return lines.join("\n");
        })
        .join("\n\n");
      return text(`# Documentenregister\n\n${body}`);
    },
  );

  return server;
}
