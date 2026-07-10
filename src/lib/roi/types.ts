/**
 * Register of Information — relational data model (epics 6-8). The store is
 * the single source of truth; a supplier assessment does not own its data
 * but attaches to an arrangement record via `answers`.
 *
 * Relational keys: the contract reference number (answer s1.1) links all
 * template rows of one arrangement; the provider id (s1.3) identifies the
 * direct provider; chain rows (B_05.02) carry rank + subcontractor ids.
 */

/** One B_05.02 row: a link in the ICT supply chain of this arrangement. */
export interface RoiChainRow {
  id: string;
  /** S01-S19 service type of the (sub)contracted service. */
  serviceType: string;
  /** LEI/EUID of the provider at this rank. */
  providerCode: string;
  /** "lei" | "euid" (B_05.02.0040 code type). */
  codeType: string;
  /** Rank: 1 = direct provider, >1 = subcontractor (ITS art. 2). */
  rank: string;
  /** LEI/EUID of the recipient of this subcontractor's service (rank 1: the provider itself). */
  recipientCode: string;
}

export interface RoiArrangement {
  id: string;
  /** Display name for lists (falls back to answer s1.2 — provider name). */
  name: string;
  /** Supplier-assessment answers (question ids s1.1…), the RoI field source. */
  answers: Record<string, string>;
  /** Manual field overrides keyed by ITS column code; win over answers. */
  manual?: Record<string, string>;
  /** ICT supply chain rows (B_05.02). */
  chain?: RoiChainRow[];
  createdAt: number;
  updatedAt: number;
}

export interface RoiState {
  v: 1;
  arrangements: RoiArrangement[];
  /** Entity block (B_01.01 fields, keyed by column code). */
  entity?: Record<string, string>;
}
