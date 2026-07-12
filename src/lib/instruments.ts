/**
 * Instrument registry — the single source of truth for the three legal acts
 * in the corpus. Used by the parser, data accessors, crossrefs, UI and MCP.
 * Route scheme: DORA (the main act) owns the unprefixed routes; the
 * satellite acts are prefixed with their instrument id.
 */
export type InstrumentId =
  | "dora"
  | "its"
  | "rts"
  | "criticaliteit"
  | "vergoedingen"
  | "onderzoeksteams"
  | "classificatie"
  | "contractbeleid"
  | "rapportage"
  | "risicobeheer"
  | "oversight"
  | "tlpt"
  | "formulieren";

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
  criticaliteit: {
    id: "criticaliteit",
    label: "Criticaliteitscriteria",
    title:
      "Gedelegeerde Verordening (EU) 2024/1502 tot aanvulling van Verordening (EU) 2022/2554 door nadere bepaling van de criteria om derde aanbieders van ICT-diensten als kritiek voor financiële entiteiten aan te wijzen",
    citation: "Gedelegeerde Verordening (EU) 2024/1502",
    celex: "32024R1502",
    routePrefix: "/criticaliteitscriteria",
  },
  vergoedingen: {
    id: "vergoedingen",
    label: "Oversightvergoedingen",
    title:
      "Gedelegeerde Verordening (EU) 2024/1505 tot aanvulling van Verordening (EU) 2022/2554 door de vaststelling van het bedrag van de door de lead overseer aan kritieke derde aanbieders van ICT-diensten aan te rekenen oversightvergoedingen en de wijze waarop die vergoedingen moeten worden betaald",
    citation: "Gedelegeerde Verordening (EU) 2024/1505",
    celex: "32024R1505",
    routePrefix: "/oversightvergoedingen",
  },
  onderzoeksteams: {
    id: "onderzoeksteams",
    label: "Onderzoeksteams-RTS",
    title:
      "Gedelegeerde Verordening (EU) 2025/420 tot aanvulling van Verordening (EU) 2022/2554 met technische reguleringsnormen tot nadere bepaling van de criteria voor het bepalen van de samenstelling van het gezamenlijke onderzoeksteam",
    citation: "Gedelegeerde Verordening (EU) 2025/420",
    celex: "32025R0420",
    routePrefix: "/rts-onderzoeksteams",
  },
  classificatie: {
    id: "classificatie",
    label: "Classificatie-RTS",
    title:
      "Gedelegeerde Verordening (EU) 2024/1772 tot aanvulling van Verordening (EU) 2022/2554 met technische reguleringsnormen tot nadere bepaling van de criteria voor de classificatie van ICT-gerelateerde incidenten en cyberdreigingen, tot vaststelling van materialiteitsdrempels en tot bepaling van de nadere informatie van verslagen over ernstige incidenten",
    citation: "Gedelegeerde Verordening (EU) 2024/1772",
    celex: "32024R1772",
    routePrefix: "/rts-classificatie",
  },
  contractbeleid: {
    id: "contractbeleid",
    label: "Beleids-RTS",
    title:
      "Gedelegeerde Verordening (EU) 2024/1773 tot aanvulling van Verordening (EU) 2022/2554 betreffende technische reguleringsnormen tot bepaling van de gedetailleerde inhoud van het beleid met betrekking tot de contractuele overeenkomsten inzake het gebruik van door derde aanbieders verleende ICT-diensten die kritieke of belangrijke functies ondersteunen",
    citation: "Gedelegeerde Verordening (EU) 2024/1773",
    celex: "32024R1773",
    routePrefix: "/rts-contractbeleid",
  },
  rapportage: {
    id: "rapportage",
    label: "Rapportage-RTS",
    title:
      "Gedelegeerde Verordening (EU) 2025/301 tot aanvulling van Verordening (EU) 2022/2554 met technische reguleringsnormen voor de inhoud en termijnen van de eerste kennisgeving van en het tussentijdse en het eindverslag over ernstige ICT-gerelateerde incidenten en voor de inhoud van de vrijwillige kennisgeving van significante cyberdreigingen",
    citation: "Gedelegeerde Verordening (EU) 2025/301",
    celex: "32025R0301",
    routePrefix: "/rts-incidentrapportage",
  },
  risicobeheer: {
    id: "risicobeheer",
    label: "Risicobeheer-RTS",
    title:
      "Gedelegeerde Verordening (EU) 2024/1774 tot aanvulling van Verordening (EU) 2022/2554 met technische reguleringsnormen tot vaststelling van tools, methoden, processen en beleidslijnen voor ICT-risicobeheersing en het vereenvoudigde raamwerk voor ICT-risicobeheersing",
    citation: "Gedelegeerde Verordening (EU) 2024/1774",
    celex: "02024R1774-20240625",
    routePrefix: "/rts-risicobeheer",
  },
  oversight: {
    id: "oversight",
    label: "Oversight-RTS",
    title:
      "Gedelegeerde Verordening (EU) 2025/295 tot aanvulling van Verordening (EU) 2022/2554 met betrekking tot technische reguleringsnormen voor de harmonisatie van de voorwaarden voor de uitoefening van de oversightactiviteiten",
    citation: "Gedelegeerde Verordening (EU) 2025/295",
    celex: "32025R0295",
    routePrefix: "/rts-oversight",
  },
  tlpt: {
    id: "tlpt",
    label: "TLPT-RTS",
    title:
      "Gedelegeerde Verordening (EU) 2025/1190 tot aanvulling van Verordening (EU) 2022/2554 met technische reguleringsnormen tot nadere bepaling van de criteria voor het identificeren van financiële entiteiten die threat-led penetratietests moeten uitvoeren, de vereisten en normen inzake het inzetten van interne testers en de vereisten met betrekking tot de scope, testmethodologie en -aanpak voor elke fase van de tests",
    citation: "Gedelegeerde Verordening (EU) 2025/1190",
    celex: "32025R1190",
    routePrefix: "/rts-tlpt",
  },
  formulieren: {
    id: "formulieren",
    label: "Rapportage-ITS",
    title:
      "Uitvoeringsverordening (EU) 2025/302 tot vaststelling van technische uitvoeringsnormen voor de toepassing van Verordening (EU) 2022/2554 met betrekking tot de door financiële entiteiten te gebruiken standaardformulieren en modellen en te volgen procedures voor de rapportage van een ernstig ICT-gerelateerd incident en voor de kennisgeving van een significante cyberdreiging",
    citation: "Uitvoeringsverordening (EU) 2025/302",
    celex: "32025R0302",
    routePrefix: "/its-incidentrapportage",
  },
};

export const INSTRUMENT_IDS: InstrumentId[] = [
  "dora",
  "its",
  "rts",
  "criticaliteit",
  "vergoedingen",
  "onderzoeksteams",
  "classificatie",
  "contractbeleid",
  "rapportage",
  "risicobeheer",
  "oversight",
  "tlpt",
  "formulieren",
];

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
