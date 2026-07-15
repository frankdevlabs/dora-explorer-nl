"use client";

import { useSyncExternalStore } from "react";
import type { PlaybookProgressState, PlaybookRegime } from "./types";

/**
 * Playbook UX state (epic 16): per-step completion + the reader's chosen
 * regime, in one versioned localStorage blob. Progress is keyed by step id —
 * safe because retired ids are never reused (RETIRED_STEP_IDS in
 * scripts/verify-playbook.ts). Same store pattern as src/lib/roi/store.ts:
 * module singleton + dora:* event + cross-tab storage listener + quota-safe
 * writes, consumed via useSyncExternalStore.
 */

const KEY = "dora-playbook-v1";
const EVENT = "dora:playbook";
const VERSION = 1;

const EMPTY_STATE: PlaybookProgressState = Object.freeze({
  v: VERSION,
  done: Object.freeze({}),
}) as PlaybookProgressState;

const REGIMES: readonly PlaybookRegime[] = ["volledig", "vereenvoudigd", "aanbieder", "ctpp"];

let cachedRaw: string | null = null;
let cachedState: PlaybookProgressState = EMPTY_STATE;

function parse(raw: string | null): PlaybookProgressState {
  if (raw === null) return EMPTY_STATE;
  try {
    const data = JSON.parse(raw) as PlaybookProgressState;
    if (data?.v !== VERSION || !data.done || typeof data.done !== "object") return EMPTY_STATE;
    // keep only numeric timestamps; drop anything malformed
    const done: Record<string, number> = {};
    for (const [id, ts] of Object.entries(data.done)) {
      if (typeof ts === "number" && Number.isFinite(ts)) done[id] = ts;
    }
    const regime = REGIMES.includes(data.regime as PlaybookRegime) ? data.regime : undefined;
    return Object.freeze({ v: VERSION, done: Object.freeze(done), regime }) as PlaybookProgressState;
  } catch {
    return EMPTY_STATE;
  }
}

export function getState(): PlaybookProgressState {
  const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parse(raw);
  }
  return cachedState;
}

function write(next: Partial<PlaybookProgressState>): void {
  const cur = getState();
  const state: PlaybookProgressState = {
    v: VERSION,
    done: next.done ?? cur.done,
    regime: "regime" in next ? next.regime : cur.regime,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded / storage unavailable: data simply doesn't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function toggleStep(id: string): void {
  const done = { ...getState().done };
  if (done[id]) delete done[id];
  else done[id] = Date.now();
  write({ done });
}

export function setRegime(regime: PlaybookRegime | undefined): void {
  write({ regime });
}

/** Clear progress for one playbook (its own step ids). */
export function resetKind(stepIds: string[]): void {
  const ids = new Set(stepIds);
  const done: Record<string, number> = {};
  for (const [id, ts] of Object.entries(getState().done)) {
    if (!ids.has(id)) done[id] = ts;
  }
  write({ done });
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

export function useDone(): Record<string, number> {
  return useSyncExternalStore(subscribe, () => getState().done, () => EMPTY_STATE.done);
}

export function useRegime(): PlaybookRegime | undefined {
  return useSyncExternalStore(subscribe, () => getState().regime, () => undefined);
}

export function useStepDone(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => Boolean(getState().done[id]),
    () => false,
  );
}
