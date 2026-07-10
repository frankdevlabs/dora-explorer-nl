/**
 * Instrument registry — the single source of truth for the three legal acts
 * in the corpus. Used by the parser, data accessors, crossrefs, UI and MCP.
 * Route scheme: DORA (the main act) owns the unprefixed routes; the
 * satellite acts are prefixed with their instrument id.
 */
export type InstrumentId = "dora" | "its" | "rts";

export interface InstrumentSpec {
  id: InstrumentId;
  /** Short UI label. */
  label: string;
  /** Full Dutch citation title. */
  title: string;
  /** Official citation form as it appears in legal text. */
  citation: string;
  /** CELEX id of the parsed source (consolidated where available). */
  celex: string;
  /** Route prefix: "" for DORA, "/its" | "/rts" for the satellites. */
  routePrefix: "" | "/its" | "/rts";
}

export const INSTRUMENTS: Record<InstrumentId, InstrumentSpec> = {
  dora: {
    id: "dora",
    label: "DORA",
    title:
      "Verordening (EU) 2022/2554 betreffende digitale operationele weerbaarheid voor de financiële sector",
    citation: "Verordening (EU) 2022/2554",
    celex: "02022R2554-20221227",
    routePrefix: "",
  },
  its: {
    id: "its",
    label: "RoI-ITS",
    title:
      "Uitvoeringsverordening (EU) 2024/2956 tot vaststelling van technische uitvoeringsnormen (informatieregister)",
    citation: "Uitvoeringsverordening (EU) 2024/2956",
    celex: "02024R2956-20241202",
    routePrefix: "/its",
  },
  rts: {
    id: "rts",
    label: "Onderaannemings-RTS",
    title:
      "Gedelegeerde Verordening (EU) 2025/532 tot aanvulling van Verordening (EU) 2022/2554 (onderaanneming van ICT-diensten ter ondersteuning van kritieke of belangrijke functies)",
    citation: "Gedelegeerde Verordening (EU) 2025/532",
    celex: "32025R0532",
    routePrefix: "/rts",
  },
};

export const INSTRUMENT_IDS: InstrumentId[] = ["dora", "its", "rts"];
