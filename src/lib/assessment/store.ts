"use client";

import { useSyncExternalStore } from "react";
import type { EntityAssessmentState, StoredEntity } from "./types";

/**
 * Persistent entity-assessment store: every assessed financial entity lives
 * as one entry in a single versioned localStorage blob. Nothing ever leaves
 * the browser. Reactivity pattern identical to tabs.ts: custom event for
 * same-tab updates, native "storage" event for cross-tab.
 *
 * Supplier assessments do NOT live here: their answers belong to the
 * arrangement records in the RoI store (src/lib/roi/store.ts).
 */

const KEY = "dora-entity-assessments";
const EVENT = "dora:entity-assessments";
const VERSION = 1;

const EMPTY: readonly StoredEntity[] = Object.freeze([]);

let cachedRaw: string | null = null;
let cachedEntities: readonly StoredEntity[] = EMPTY;

function parse(raw: string | null): readonly StoredEntity[] {
  if (raw === null) return EMPTY;
  try {
    const data = JSON.parse(raw) as EntityAssessmentState;
    if (data?.v !== VERSION || !Array.isArray(data.entities)) return EMPTY;
    return Object.freeze(data.entities);
  } catch {
    return EMPTY;
  }
}

export function getSnapshot(): readonly StoredEntity[] {
  const raw = localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedEntities = parse(raw);
  }
  return cachedEntities;
}

function write(entities: readonly StoredEntity[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, entities }));
  } catch {
    // Quota exceeded / storage unavailable: assessment simply doesn't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEntity(name: string): StoredEntity {
  const entity: StoredEntity = {
    id: newId("ent"),
    name: name.trim() || "Naamloze entiteit",
    answers: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  write([...getSnapshot(), entity]);
  return entity;
}

export function getEntity(id: string): StoredEntity | undefined {
  return getSnapshot().find((s) => s.id === id);
}

export function setEntityAnswer(id: string, questionId: string, value: string): void {
  write(
    getSnapshot().map((s) =>
      s.id === id
        ? {
            ...s,
            // Answer e1.1 doubles as the display name so the list stays in sync.
            name: questionId === "e1.1" && value.trim() !== "" ? value.trim() : s.name,
            answers: { ...s.answers, [questionId]: value },
            updatedAt: Date.now(),
          }
        : s,
    ),
  );
}

export function deleteEntity(id: string): void {
  write(getSnapshot().filter((s) => s.id !== id));
}

export function exportStateJson(): string {
  return JSON.stringify({ v: VERSION, entities: getSnapshot() }, null, 2);
}

/**
 * Import a previously exported JSON dump. Merges by id (imported entries win);
 * returns the number of entities imported, or -1 when the payload is invalid.
 */
export function importStateJson(json: string): number {
  let incoming: readonly StoredEntity[];
  try {
    const data = JSON.parse(json) as EntityAssessmentState;
    if (data?.v !== VERSION || !Array.isArray(data.entities)) return -1;
    incoming = data.entities.filter(
      (s) =>
        typeof s?.id === "string" && typeof s?.name === "string" && typeof s?.answers === "object",
    );
  } catch {
    return -1;
  }
  const byId = new Map(getSnapshot().map((s) => [s.id, s]));
  for (const s of incoming) byId.set(s.id, s);
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

export function useEntityAssessments(): readonly StoredEntity[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
