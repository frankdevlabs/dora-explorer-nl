"use client";

import { useSyncExternalStore } from "react";
import type { RoiArrangement, RoiChainRow, RoiState } from "./types";

/**
 * Register-of-Information store (localStorage, versioned). One blob holds
 * the entity block (B_01.01), the arrangement records (each carrying its
 * supplier-assessment answers, manual field overrides and chain rows) —
 * the relational source of truth for the register workbench and exports.
 */

const KEY = "dora-roi";
const EVENT = "dora:roi";
const VERSION = 1;

const EMPTY_STATE: RoiState = Object.freeze({ v: 1, arrangements: [], entity: {} }) as RoiState;

let cachedRaw: string | null = null;
let cachedState: RoiState = EMPTY_STATE;

function parse(raw: string | null): RoiState {
  if (raw === null) return EMPTY_STATE;
  try {
    const data = JSON.parse(raw) as RoiState;
    if (data?.v !== VERSION || !Array.isArray(data.arrangements)) return EMPTY_STATE;
    return Object.freeze({
      v: VERSION,
      arrangements: data.arrangements,
      entity: data.entity && typeof data.entity === "object" ? data.entity : {},
    }) as RoiState;
  } catch {
    return EMPTY_STATE;
  }
}

export function getState(): RoiState {
  const raw = localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parse(raw);
  }
  return cachedState;
}

export function getArrangements(): readonly RoiArrangement[] {
  return getState().arrangements;
}

function write(next: Partial<RoiState>): void {
  const cur = getState();
  const state: RoiState = {
    v: VERSION,
    arrangements: next.arrangements ?? cur.arrangements,
    entity: next.entity ?? cur.entity,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded / storage unavailable: data simply doesn't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function newId(prefix = "arr"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createArrangement(name: string): RoiArrangement {
  const arrangement: RoiArrangement = {
    id: newId(),
    name: name.trim() || "Naamloze overeenkomst",
    answers: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  write({ arrangements: [...getArrangements(), arrangement] });
  return arrangement;
}

export function getArrangement(id: string): RoiArrangement | undefined {
  return getArrangements().find((a) => a.id === id);
}

function updateArrangement(id: string, patch: (a: RoiArrangement) => RoiArrangement): void {
  write({
    arrangements: getArrangements().map((a) =>
      a.id === id ? { ...patch(a), updatedAt: Date.now() } : a,
    ),
  });
}

export function setArrangementAnswer(id: string, questionId: string, value: string): void {
  updateArrangement(id, (a) => ({
    ...a,
    // Provider name (s1.2) doubles as the display name.
    name: questionId === "s1.2" && value.trim() !== "" ? value.trim() : a.name,
    answers: { ...a.answers, [questionId]: value },
  }));
}

/** Manual override for an ITS column; empty string clears the override. */
export function setManualField(id: string, columnCode: string, value: string): void {
  updateArrangement(id, (a) => {
    const manual = { ...(a.manual ?? {}) };
    if (value.trim() === "") delete manual[columnCode];
    else manual[columnCode] = value;
    return { ...a, manual };
  });
}

export function addChainRow(id: string): void {
  const row: RoiChainRow = {
    id: newId("chain"),
    serviceType: "",
    providerCode: "",
    codeType: "lei",
    rank: "",
    recipientCode: "",
  };
  updateArrangement(id, (a) => ({ ...a, chain: [...(a.chain ?? []), row] }));
}

export function updateChainRow(id: string, rowId: string, patch: Partial<RoiChainRow>): void {
  updateArrangement(id, (a) => ({
    ...a,
    chain: (a.chain ?? []).map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
  }));
}

export function deleteChainRow(id: string, rowId: string): void {
  updateArrangement(id, (a) => ({
    ...a,
    chain: (a.chain ?? []).filter((r) => r.id !== rowId),
  }));
}

export function deleteArrangement(id: string): void {
  write({ arrangements: getArrangements().filter((a) => a.id !== id) });
}

export function setEntityField(columnCode: string, value: string): void {
  const entity = { ...(getState().entity ?? {}) };
  if (value.trim() === "") delete entity[columnCode];
  else entity[columnCode] = value;
  write({ entity });
}

export function exportRoiJson(): string {
  return JSON.stringify(getState(), null, 2);
}

export function importRoiJson(json: string): number {
  let incoming: RoiState;
  try {
    incoming = JSON.parse(json) as RoiState;
    if (incoming?.v !== VERSION || !Array.isArray(incoming.arrangements)) return -1;
  } catch {
    return -1;
  }
  const valid = incoming.arrangements.filter(
    (a) =>
      typeof a?.id === "string" && typeof a?.name === "string" && typeof a?.answers === "object",
  );
  const byId = new Map(getArrangements().map((a) => [a.id, a]));
  for (const a of valid) byId.set(a.id, a);
  write({
    arrangements: [...byId.values()],
    entity: { ...(getState().entity ?? {}), ...(incoming.entity ?? {}) },
  });
  return valid.length;
}

export function subscribe(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useArrangements(): readonly RoiArrangement[] {
  return useSyncExternalStore(subscribe, () => getState().arrangements, () => EMPTY_STATE.arrangements);
}

export function useRoiState(): RoiState {
  return useSyncExternalStore(subscribe, getState, () => EMPTY_STATE);
}
