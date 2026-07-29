import { useSyncExternalStore } from "react";

/**
 * Learner preferences.
 *
 * The important one is `level`. The content already carries three depths for
 * every lesson, but all three were expanded at once, so a newcomer met the
 * technical deep dive immediately and an experienced reader scrolled past the
 * plain-English one on every single module. One body of content was serving
 * neither audience.
 *
 * The level does not hide anything — every layer stays one click away. It only
 * decides what is open when the page loads, which is the difference between
 * "this is written for me" and "this is not for me".
 *
 * Kept local rather than in the synced progress store: it is a display
 * preference, and a learner switching devices would rather it default sensibly
 * than wait on a network round trip before the page reads correctly.
 */

export type Level = "new" | "working" | "deep";

export interface Prefs {
  level: Level;
  /** Set once the learner has been through orientation, so we stop nudging. */
  oriented: boolean;
  /**
   * Chosen at orientation; drives the recommended next step. Kept as a plain
   * string union rather than importing Goal from content, so the preference
   * store has no dependency on the content layer.
   */
  goal?: "starting-out" | "evaluating" | "deploying" | "securing" | "governing" | "building";
}

export const DEFAULT_PREFS: Prefs = { level: "working", oriented: false };

export const LEVELS: { id: Level; label: string; blurb: string }[] = [
  {
    id: "new",
    label: "New to this",
    blurb: "Plain English first. Jargon gets defined before it gets used.",
  },
  {
    id: "working",
    label: "I work around it",
    blurb: "Straight to what it means in an organisation, with the detail a click away.",
  },
  {
    id: "deep",
    label: "Technical depth",
    blurb: "Open everything. Assume I know the vocabulary.",
  },
];

const KEY = "eai.prefs.v1";

let cache: Prefs | null = null;
const listeners = new Set<() => void>();

function read(): Prefs {
  if (typeof localStorage === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export const prefs = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getSnapshot(): Prefs {
    if (cache === null) cache = read();
    return cache;
  },
  // Server render has no localStorage. Returning a stable object matters:
  // useSyncExternalStore compares by identity and a fresh object every call
  // would loop.
  getServerSnapshot(): Prefs {
    return DEFAULT_PREFS;
  },
  set(patch: Partial<Prefs>) {
    cache = { ...prefs.getSnapshot(), ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      /* private mode — the session still works, it just will not be remembered */
    }
    for (const l of listeners) l();
  },
};

export function usePrefs(): Prefs {
  return useSyncExternalStore(prefs.subscribe, prefs.getSnapshot, prefs.getServerSnapshot);
}

/** Which lesson layers open by default at this level. */
export function openLayersFor(level: Level): string[] {
  switch (level) {
    case "new":
      return ["simple"];
    case "deep":
      return ["enterprise", "deep", "diagram", "config", "patterns"];
    default:
      return ["simple", "enterprise"];
  }
}
