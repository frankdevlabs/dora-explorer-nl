/**
 * Register of Information — relational data model (epics 6-8). The store is
 * the single source of truth; a supplier assessment does not own its data
 * but attaches to an arrangement record via `answers`.
 *
 * Relational keys: `contractRef` (arrangement, user-assigned, unique),
 * `providerCode` (LEI/EUID), `functionId`. Records for the other ITS
 * templates (entity block, group entities, chain links, service-function
 * links, service assessments) are added in epic 7; the state shape is
 * versioned from day one so migrations stay possible.
 */

export interface RoiArrangement {
  id: string;
  /** Display name for lists (falls back to answer s1.2 — provider name). */
  name: string;
  /** Supplier-assessment answers (question ids s1.1…), the RoI field source. */
  answers: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface RoiState {
  v: 1;
  arrangements: RoiArrangement[];
}
