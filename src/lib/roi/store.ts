"use client";

import { useSyncExternalStore } from "react";
import type { RoiArrangement, RoiState } from "./types";

/**
 * Register-of-Information store (localStorage, versioned). Epic 6 ships the
 * arrangement records (each carrying its supplier-assessment answers); epic
 * 7 extends the same blob with entity/provider/function/chain records.
 */

const KEY = "dora-roi";
const EVENT = "dora:roi";
const VERSION = 1;

const EMPTY: readonly RoiArrangement[] = Object.freeze([]);

let cachedRaw: string | null = null;
let cachedArrangements: readonly RoiArrangement[] = EMPTY;

function parse(raw: string | null): readonly RoiArrangement[] {
  if (raw === null) return EMPTY;
  try {
    const data = JSON.parse(raw) as RoiState;
    if (data?.v !== VERSION || !Array.isArray(data.arrangements)) return EMPTY;
    return Object.freeze(data.arrangements);
  } catch {
    return EMPTY;
  }
}

export function getArrangements(): readonly RoiArrangement[] {
  const raw = localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedArrangements = parse(raw);
  }
  return cachedArrangements;
}

function write(arrangements: readonly RoiArrangement[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, arrangements }));
  } catch {
    // Quota exceeded / storage unavailable: data simply doesn't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `arr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createArrangement(name: string): RoiArrangement {
  const arrangement: RoiArrangement = {
    id: newId(),
    name: name.trim() || "Naamloze overeenkomst",
    answers: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  write([...getArrangements(), arrangement]);
  return arrangement;
}

export function getArrangement(id: string): RoiArrangement | undefined {
  return getArrangements().find((a) => a.id === id);
}

export function setArrangementAnswer(id: string, questionId: string, value: string): void {
  write(
    getArrangements().map((a) =>
      a.id === id
        ? {
            ...a,
            // Provider name (s1.2) doubles as the display name.
            name: questionId === "s1.2" && value.trim() !== "" ? value.trim() : a.name,
            answers: { ...a.answers, [questionId]: value },
            updatedAt: Date.now(),
          }
        : a,
    ),
  );
}

export function deleteArrangement(id: string): void {
  write(getArrangements().filter((a) => a.id !== id));
}

export function exportRoiJson(): string {
  return JSON.stringify({ v: VERSION, arrangements: getArrangements() }, null, 2);
}

export function importRoiJson(json: string): number {
  let incoming: readonly RoiArrangement[];
  try {
    const data = JSON.parse(json) as RoiState;
    if (data?.v !== VERSION || !Array.isArray(data.arrangements)) return -1;
    incoming = data.arrangements.filter(
      (a) =>
        typeof a?.id === "string" && typeof a?.name === "string" && typeof a?.answers === "object",
    );
  } catch {
    return -1;
  }
  const byId = new Map(getArrangements().map((a) => [a.id, a]));
  for (const a of incoming) byId.set(a.id, a);
  write([...byId.values()]);
  return incoming.length;
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
  return useSyncExternalStore(subscribe, getArrangements, () => EMPTY);
}
