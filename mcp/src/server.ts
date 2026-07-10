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
  recitalMap,
} from "./data.js";
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

const instrumentEnum = z
  .enum(["dora", "its", "rts"])
  .optional()
  .describe(
    'Instrument: "dora" (Verordening (EU) 2022/2554, default), "its" (RoI-ITS 2024/2956) or "rts" (onderaannemings-RTS 2025/532)',
  );

export function createServer(): McpServer {
  const server = new McpServer({ name: "dora-explorer-nl", version: "0.1.0" });

  server.registerTool(
    "search_dora",
    {
      title: "Zoek in DORA + ITS + RTS",
      description:
        "Full-text search in the Dutch text of DORA (Regulation (EU) 2022/2554), the Register-of-" +
        "Information ITS (2024/2956, incl. the 2025 corrigendum) and the subcontracting RTS " +
        "(2025/532). Returns hits with deep links to " +
        BASE_URL +
        ". Query in Dutch works best. Reference queries also work: \"artikel 28 lid 3\", " +
        '"its artikel 2", "its bijlage iii".',
      inputSchema: {
        query: z.string().min(2).describe("Search terms (Dutch)"),
        limit: z.number().int().min(1).max(50).optional().describe("Max results, default 10"),
        type: z
          .enum(["artikel", "overweging", "bijlage"])
          .optional()
          .describe("Restrict to articles, recitals or annexes"),
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
          const tag = h.instrument === "dora" ? "" : ` [${INSTRUMENTS[h.instrument as InstrumentId].label}]`;
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
      description:
        "Full Dutch text of an article. DORA: 1-64 (default instrument); RoI-ITS: 1-7; " +
        "onderaannemings-RTS: 1-7.",
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
      description:
        "Full Dutch text of a recital (overweging). DORA: 1-106 (default); RoI-ITS: 1-15; RTS: 1-13.",
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
        'Full Dutch text of an annex (bijlage) of the RoI-ITS (2024/2956) by Roman numeral: "I" ' +
        "(instructies + kolomcodes per template), \"II\" (activiteiten per entiteitstype), \"III\" " +
        '(S01-S19 taxonomie van ICT-diensten), "IV" (waarde totale activa). DORA and the RTS have ' +
        "no annexes.",
      inputSchema: {
        roman: z.string().describe('Annex Roman numeral, e.g. "III"'),
      },
    },
    async ({ roman }) => {
      const key = roman.trim().replace(/^bijlage\s*/i, "");
      const a = getAnnex(key, "its");
      if (!a) {
        const known = corpora.its.annexes.map((x) => x.roman).join(", ");
        return err(`Bijlage "${roman}" niet gevonden. Beschikbaar (RoI-ITS): ${known}.`);
      }
      return text(renderAnnex(a, "its"));
    },
  );

  server.registerTool(
    "get_structure",
    {
      title: "Structuur (inhoudsopgave)",
      description:
        "Compact table of contents of all three instruments: DORA chapters/sections/articles, " +
        "ITS articles + annexes, RTS articles, recital counts.",
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

  return server;
}
