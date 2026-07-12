/**
 * DORA-compliance playbooks (epic 11) — data model for the curated playbook
 * layer in data/playbook/: entiteit-v1.json (financial entity, full +
 * simplified regime via appliesTo overlay), aanbieder-v1.json (ICT
 * third-party provider incl. CTPP track) and coverage-v1.json (the per-lid
 * coverage matrix guaranteeing every article/lid/annex of all 13 instruments
 * has a disposition). Editorial content (rule 2b): practical steps that
 * deep-link into the legal corpus but never replace it. Verified by
 * scripts/verify-playbook.ts.
 */
import type { InstrumentId } from "../instruments";
import type { HelpContent, QRef } from "../assessment/types";

export type { QRef, HelpContent };

/** Which audience/regime a step applies to. */
export type PlaybookRegime = "volledig" | "vereenvoudigd" | "aanbieder" | "ctpp";

export type Prioriteit = "fundament" | "kern" | "verdieping";

export interface PlaybookStep {
  /**
   * Stable id, prefixed per playbook ("pe.g1" entiteit, "pa.c1" aanbieder).
   * Step progress persists in users' localStorage keyed by id: never reuse a
   * retired id (see RETIRED_STEP_IDS in the verify script).
   */
  id: string;
  titel: string;
  /** Intended outcome in one sentence. */
  doel: string;
  /** Concrete practical actions (Dutch, imperative) — no legal paraphrase. */
  acties: string[];
  /** Deliverables/evidence an auditor would ask for. */
  bewijsstukken?: string[];
  /** Responsible roles, e.g. "bestuur", "CISO", "risk", "inkoop", "juridisch". */
  rollen?: string[];
  /** Deep links into the corpus; every step cites its legal basis (>= 1). */
  refs: QRef[];
  appliesTo: PlaybookRegime[];
  prioriteit?: Prioriteit;
  /** Ids of steps that should be completed first (forward-ordered). */
  afhankelijkVan?: string[];
}

export interface PlaybookFase {
  /** Stable id ("f0".."f8"); nr is the display number. */
  id: string;
  nr: number;
  titel: string;
  intro?: HelpContent;
  /** Which instruments feed this phase (UI badges). */
  instrumenten: InstrumentId[];
  stappen: PlaybookStep[];
}

/** Glossary entry: one defined term with its corpus anchor. */
export interface Begrip {
  term: string;
  /** e.g. "/artikel/3#punt-21" */
  href: string;
  toelichting?: string;
}

export interface Playbook {
  meta: {
    version: number;
    /** "entiteit" | "aanbieder" — which audience. */
    kind: string;
    title: string;
    updated: string;
    basis: string;
    disclaimer: string;
  };
  /** Entity playbook only: all art. 3 DORA defined terms. */
  begrippen?: Begrip[];
  fases: PlaybookFase[];
}

// ---------------------------------------------------------------------------
// Coverage matrix (data/playbook/coverage-v1.json)

/**
 * Disposition of one lid/annex:
 * - "stap": maps to >= 1 playbook step (steps required)
 * - "definitie": defined terms / definitions article
 * - "toepassingsgebied": subject matter & scope
 * - "autoriteit": addressed to authorities/ESAs/Commission (note required:
 *   why it is still relevant for the reader)
 * - "ctpp": CTPP-oversight provision (may also carry steps)
 * - "slotbepaling": transitional/final/entry-into-force
 * - "context": other non-actionable context (note required)
 */
export type Disposition =
  | "stap"
  | "definitie"
  | "toepassingsgebied"
  | "autoriteit"
  | "ctpp"
  | "slotbepaling"
  | "context";

export interface CoverageEntry {
  disposition: Disposition;
  /** Step ids (either playbook) implementing this lid. Required for "stap". */
  steps?: string[];
  /** Editorial note; required for "autoriteit" and "context". */
  note?: string;
  /** Flipped to true only by the human review pass. */
  reviewed: boolean;
}

export interface InstrumentCoverage {
  /** artikelnummer -> anchor ("lid-N" | "inhoud") -> entry */
  artikelen: Record<string, Record<string, CoverageEntry>>;
  /** annex roman (lowercase) -> entry */
  bijlagen: Record<string, CoverageEntry>;
}

export interface CoverageFile {
  meta: {
    version: number;
    /** false while curation is in progress; true flips verify to final mode. */
    complete: boolean;
  };
  instruments: Record<string, InstrumentCoverage>;
}

// ---------------------------------------------------------------------------
// Generated output (data/generated/playbook.json, built by
// scripts/build-playbook.ts) — merged playbooks + reverse indexes

export interface PlaybookStepIndexEntry {
  step: PlaybookStep;
  playbook: string; // meta.kind
  faseId: string;
  faseTitel: string;
}

export interface CoverageIndexEntry {
  instrument: string;
  artikel?: string;
  anchor?: string;
  bijlage?: string;
  entry: CoverageEntry;
}

export interface GeneratedPlaybook {
  entiteit: Playbook;
  aanbieder: Playbook;
  coverage: CoverageFile;
  /** step id -> location (for /playbook/dekking step links and MCP). */
  byStep: Record<string, PlaybookStepIndexEntry>;
  counts: {
    steps: Record<string, number>;
    coverageEntries: number;
    dispositions: Record<string, number>;
  };
}

// ---------------------------------------------------------------------------
// Stored state (localStorage key "dora-playbook-v1")

export interface PlaybookProgressState {
  v: 1;
  /** step id -> completed timestamp (ms). */
  done: Record<string, number>;
  regime?: PlaybookRegime;
}
