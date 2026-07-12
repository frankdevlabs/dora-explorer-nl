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
  /** Route prefix: "" for DORA, "/<topic-slug>" for the satellites. */
  routePrefix: string;
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
    routePrefix: "/its-register",
  },
  rts: {
    id: "rts",
    label: "Onderaannemings-RTS",
    title:
      "Gedelegeerde Verordening (EU) 2025/532 tot aanvulling van Verordening (EU) 2022/2554 (onderaanneming van ICT-diensten ter ondersteuning van kritieke of belangrijke functies)",
    citation: "Gedelegeerde Verordening (EU) 2025/532",
    celex: "32025R0532",
    routePrefix: "/rts-onderaanneming",
  },
};

export const INSTRUMENT_IDS: InstrumentId[] = ["dora", "its", "rts"];

/** Satellite instruments (everything except DORA), in registry order. */
export const SATELLITE_IDS: InstrumentId[] = INSTRUMENT_IDS.filter((id) => id !== "dora");

/** Route slug of a satellite instrument (its routePrefix without the slash). */
export function instrumentSlug(id: InstrumentId): string {
  return INSTRUMENTS[id].routePrefix.slice(1);
}

/** Inverse of instrumentSlug; undefined for unknown slugs (incl. DORA's ""). */
export function instrumentBySlug(slug: string): InstrumentId | undefined {
  return SATELLITE_IDS.find((id) => instrumentSlug(id) === slug);
}

/**
 * Resolve a route path (no fragment) to its instrument and the
 * instrument-local remainder ("/artikel/3"; "/" for the index page).
 * Boundary-aware: "/its-register/artikel/2" matches `its`, an unrelated
 * "/its-registratie" would not. Unknown prefixes fall through to DORA,
 * which owns the unprefixed routes.
 */
export function splitRoutePath(path: string): { instrument: InstrumentId; rest: string } {
  for (const id of SATELLITE_IDS) {
    const prefix = INSTRUMENTS[id].routePrefix;
    if (path === prefix || path.startsWith(prefix + "/")) {
      return { instrument: id, rest: path.slice(prefix.length) || "/" };
    }
  }
  return { instrument: "dora", rest: path || "/" };
}
