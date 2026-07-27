import type { ProgressState } from "./progress";
import { rankOf } from "./competency";

/**
 * Merge two progress snapshots without losing work.
 *
 * A learner can practise anonymously on a laptop, sign in on a phone, and
 * expect both to survive. Neither side is authoritative, so this takes the
 * better of the two per field rather than picking a winner:
 *
 *  - completions: union, keeping the earlier timestamp
 *  - quiz results: the higher score wins
 *  - mastery points: the higher total
 *  - competencies: the higher rung of the ladder, evidence concatenated
 *
 * Merging is deliberately monotonic — nothing here can move a learner
 * backwards, which makes repeated merges safe.
 */
export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const earlier = (x?: number, y?: number) => Math.min(x ?? Infinity, y ?? Infinity);

  const completedLessons: ProgressState["completedLessons"] = { ...a.completedLessons };
  for (const [id, ts] of Object.entries(b.completedLessons)) {
    completedLessons[id] = completedLessons[id] ? earlier(completedLessons[id], ts) : ts;
  }

  const quizResults: ProgressState["quizResults"] = { ...a.quizResults };
  for (const [id, r] of Object.entries(b.quizResults)) {
    const cur = quizResults[id];
    if (!cur) {
      quizResults[id] = r;
      continue;
    }
    const ratio = (x: { correct: number; total: number }) => (x.total ? x.correct / x.total : 0);
    quizResults[id] = ratio(r) > ratio(cur) ? r : cur;
  }

  const scenarioAttempts: ProgressState["scenarioAttempts"] = { ...a.scenarioAttempts };
  for (const [id, r] of Object.entries(b.scenarioAttempts)) {
    const cur = scenarioAttempts[id];
    scenarioAttempts[id] = !cur || (r?.score ?? 0) > (cur?.score ?? 0) ? r : cur;
  }

  const masteryPoints = { ...a.masteryPoints };
  for (const [d, pts] of Object.entries(b.masteryPoints)) {
    const key = d as keyof typeof masteryPoints;
    masteryPoints[key] = Math.max(masteryPoints[key] ?? 0, pts ?? 0);
  }

  const competencies: ProgressState["competencies"] = { ...a.competencies };
  for (const [id, rec] of Object.entries(b.competencies)) {
    const cur = competencies[id];
    if (!cur) {
      competencies[id] = rec;
      continue;
    }
    const refs = Array.from(new Set([...cur.demonstrationRefs, ...rec.demonstrationRefs]));
    competencies[id] = {
      ...(rankOf(rec.status) > rankOf(cur.status) ? rec : cur),
      demonstrationRefs: refs,
      demonstrations: refs.length,
      lastPracticedTs: Math.max(cur.lastPracticedTs ?? 0, rec.lastPracticedTs ?? 0) || undefined,
      // Keep the tail; the store caps evidence at 20 elsewhere.
      evidence: [...cur.evidence, ...rec.evidence].slice(-20),
    };
  }

  // Notes and artifacts are arrays of {id, ..., ts}. Union by id, keeping the
  // more recently edited copy, newest first.
  const byId = <T extends { id: string; ts: number }>(xs: T[], ys: T[]): T[] => {
    const m = new Map<string, T>();
    for (const item of [...xs, ...ys]) {
      const cur = m.get(item.id);
      if (!cur || item.ts > cur.ts) m.set(item.id, item);
    }
    return [...m.values()].sort((p, q) => q.ts - p.ts);
  };

  return {
    ...a,
    completedLessons,
    quizResults,
    scenarioAttempts,
    masteryPoints,
    competencies,
    notes: byId(a.notes, b.notes),
    artifacts: byId(a.artifacts, b.artifacts),
    // Most recent trail first, de-duplicated, same cap the store uses.
    lastVisited: Array.from(new Set([...a.lastVisited, ...b.lastVisited])).slice(0, 12),
    currentRole: a.currentRole ?? b.currentRole,
  };
}
