import type { MasteryDomain } from "@/content/types";

/**
 * Spaced repetition, SM-2 with the sharp edges filed off.
 *
 * The previous flashcards screen was prev/next over a generated list with no
 * memory, which is a slideshow rather than a study tool — you cannot get worse
 * at it and you cannot finish it. This schedules each card independently and
 * persists, so a session has a defined size and repeating it has a point.
 *
 * Deliberately not wired into the Supabase-backed progress store: review state
 * is high-churn (every card, every session) and losing it costs a learner
 * nothing but a few repetitions, so it stays local.
 */

const KEY = "eai.srs.v1";
const DAY = 86_400_000;

export type Grade = "again" | "hard" | "good" | "easy";

export interface CardState {
  /** Ease factor, SM-2's EF. Floor of 1.3 as in the original algorithm. */
  ease: number;
  /** Current interval in days. */
  interval: number;
  /** Consecutive successful reviews; reset to 0 on "again". */
  streak: number;
  /** Epoch ms when this card is next due. */
  due: number;
  reviews: number;
  lapses: number;
}

export type SrsStore = Record<string, CardState>;

export const NEW_CARD: CardState = {
  ease: 2.5,
  interval: 0,
  streak: 0,
  due: 0,
  reviews: 0,
  lapses: 0,
};

function read(): SrsStore {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SrsStore) : {};
  } catch {
    return {};
  }
}

function write(s: SrsStore) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* quota or private mode — reviews are not worth failing a session over */
  }
}

const listeners = new Set<() => void>();
let cache: SrsStore | null = null;

function emit() {
  for (const l of listeners) l();
}

export const srs = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getSnapshot(): SrsStore {
    if (cache === null) cache = read();
    return cache;
  },
  /** Server render has no localStorage; every card is simply new. */
  getServerSnapshot(): SrsStore {
    return EMPTY;
  },
  state(id: string): CardState {
    return srs.getSnapshot()[id] ?? NEW_CARD;
  },
  grade(id: string, grade: Grade, now = Date.now()) {
    const prev = srs.state(id);
    const next = schedule(prev, grade, now);
    cache = { ...srs.getSnapshot(), [id]: next };
    write(cache);
    emit();
    return next;
  },
  reset() {
    cache = {};
    write(cache);
    emit();
  },
};

const EMPTY: SrsStore = {};

/**
 * SM-2 with two changes that matter in practice:
 *  - the first two successful intervals are fixed (1 day, 3 days) rather than
 *    derived, which is what every modern implementation does because the
 *    original formula produces a nonsensical second interval;
 *  - "hard" keeps the card in rotation instead of advancing it, so a card you
 *    are struggling with does not drift out to a week because you got it.
 */
export function schedule(prev: CardState, grade: Grade, now = Date.now()): CardState {
  if (grade === "again") {
    return {
      ease: Math.max(1.3, prev.ease - 0.2),
      interval: 0,
      streak: 0,
      due: now + 10 * 60_000, // back in ten minutes, same session
      reviews: prev.reviews + 1,
      lapses: prev.lapses + 1,
    };
  }

  const easeDelta = grade === "hard" ? -0.15 : grade === "easy" ? 0.15 : 0;
  const ease = Math.max(1.3, Math.min(3.0, prev.ease + easeDelta));
  const streak = prev.streak + 1;

  let interval: number;
  if (grade === "hard") {
    // Hold position: repeat tomorrow at the earliest.
    interval = Math.max(1, Math.round(prev.interval * 1.2));
  } else if (streak === 1) {
    interval = 1;
  } else if (streak === 2) {
    interval = 3;
  } else {
    interval = Math.round(prev.interval * ease);
  }
  if (grade === "easy") interval = Math.round(interval * 1.3);
  interval = Math.max(1, Math.min(interval, 365));

  return {
    ease,
    interval,
    streak,
    due: now + interval * DAY,
    reviews: prev.reviews + 1,
    lapses: prev.lapses,
  };
}

export interface DeckCard {
  id: string;
  front: string;
  back: string;
  /** Shown under the answer — the authored rationale, where one exists. */
  why?: string;
  source: string;
  domain: MasteryDomain;
}

export function isDue(state: CardState, now = Date.now()) {
  return state.due <= now;
}

export function summarise(cards: DeckCard[], store: SrsStore, now = Date.now()) {
  let fresh = 0;
  let due = 0;
  let later = 0;
  for (const c of cards) {
    const s = store[c.id];
    if (!s || s.reviews === 0) fresh++;
    else if (s.due <= now) due++;
    else later++;
  }
  return { fresh, due, later, total: cards.length };
}
