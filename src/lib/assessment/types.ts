/**
 * DORA assessments (epics 5-6) — data model for the two curated
 * questionnaires in data/questionnaire/: entity-v1.json (whole financial
 * entity) and supplier-v1.json (one ICT contractual arrangement). The
 * questionnaires are editorial content: they paraphrase obligations and
 * deep-link into the legal corpus, but never replace it. Verified by
 * scripts/verify-assessment.ts (ref integrity + routing sanity + fixtures).
 */

/** Deep link into the corpus, e.g. { label: "Art. 28, lid 3", href: "/artikel/28#lid-3" }. */
export interface QRef {
  label: string;
  href: string;
}

/** One help block: a paragraph or a bullet list. */
export type HelpBlock = string | { bullets: string[] };
/** Editorial guidance: a plain paragraph or a sequence of paragraphs/lists. */
export type HelpContent = string | HelpBlock[];

/**
 * Visibility/derivation condition. `flag` tests a derived flag (set by
 * QEffect or by the outcome adapter); `answer` tests a raw answer value.
 */
export interface QCondition {
  all?: QCondition[];
  any?: QCondition[];
  not?: QCondition;
  flag?: string;
  answer?: { q: string; is: string | string[] };
}

/** Answer-triggered flag assignment: when the answer is (one of) `when`, set `setFlag`. */
export interface QEffect {
  when: string | string[];
  setFlag: string;
}

export type AnswerType = "janee" | "janeenvt" | "choice" | "text";

export interface Question {
  /**
   * Stable id, prefixed per questionnaire ("e1.1" entity, "s1.1" supplier).
   * Ids of stored answers persist in users' localStorage: never reuse a
   * retired id with different semantics (see RETIRED_IDS in the verify
   * script).
   */
  id: string;
  text: string;
  /** Editorial guidance shown under the question. */
  help?: HelpContent;
  refs?: QRef[];
  answerType: AnswerType;
  options?: { value: string; label: string }[];
  effects?: QEffect[];
  showIf?: QCondition;
  /** Compliance-checklist question: "nee" becomes an open action. */
  obligation?: boolean;
  /**
   * RoI mapping key (supplier questionnaire): the ITS template column this
   * answer feeds, e.g. "B_02.01.0020". Consumed by src/lib/roi/mapping.ts.
   */
  roi?: string;
}

export interface Module {
  /** Stable id ("m1".."m18"); nr is the display number. */
  id: string;
  nr: number;
  title: string;
  intro?: HelpContent;
  refs?: QRef[];
  showIf?: QCondition;
  questions: Question[];
}

export interface Questionnaire {
  meta: {
    version: number;
    /** "entity" | "supplier" — which outcome adapter interprets it. */
    kind: string;
    title: string;
    updated: string;
    basis: string;
    disclaimer: string;
  };
  modules: Module[];
}

// ---------------------------------------------------------------------------
// Engine output (shared shapes; adapters add their own outcome types)

export interface ObligationStatus {
  questionId: string;
  moduleId: string;
  text: string;
  status: "voldaan" | "actie" | "nvt" | "open";
  refs?: QRef[];
}

export interface TimelineEntry {
  date: string; // ISO
  label: string;
}

/** Entity assessment: which DORA regime applies. */
export type EntityRegime = "buiten-scope" | "volledig" | "vereenvoudigd" | "micro";

export interface EntityEvaluation {
  answered: number;
  total: number;
  inScope: boolean;
  entityTypeLabel: string;
  regime: EntityRegime;
  regimeLabel: string;
  /** Obligations grouped per visible module, in questionnaire order. */
  obligations: ObligationStatus[];
  openActions: ObligationStatus[];
  timeline: TimelineEntry[];
  flags: Set<string>;
}

/** Supplier assessment: obligations split baseline vs CIF (epic 6). */
export interface SupplierEvaluation {
  answered: number;
  total: number;
  /** The arrangement concerns an ICT service (art. 3, punt 21). */
  ictDienst: boolean;
  /** The service supports a critical or important function (art. 3, punt 22). */
  cifDienst: boolean;
  intraGroep: boolean;
  /** Baseline obligations (all ICT arrangements). */
  baseline: ObligationStatus[];
  /** Additional obligations for CIF-supporting services. */
  cifExtra: ObligationStatus[];
  openActions: ObligationStatus[];
  timeline: TimelineEntry[];
  flags: Set<string>;
}

// ---------------------------------------------------------------------------
// Stored state (localStorage) — entity assessments; supplier answers live on
// the arrangement records in the RoI store (epic 7)

export interface StoredEntity {
  id: string;
  /** Display name; falls back to answer e1.1. */
  name: string;
  answers: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface EntityAssessmentState {
  v: 1;
  entities: StoredEntity[];
}
