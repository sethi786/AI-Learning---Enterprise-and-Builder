import type { CompetencyStatus } from "@/content/types";

export type EvidenceKind =
  | "lesson_opened"
  | "quiz_passed"
  | "quiz_failed"
  | "lab_completed"
  | "scenario_ideal"
  | "scenario_partial"
  | "scenario_failed"
  | "capstone_touch";

export interface EvidenceEvent {
  kind: EvidenceKind;
  ts: number;
  ref?: string; // lesson/quiz/scenario id
  score?: number; // 0..1
}

export interface CompetencyRecord {
  status: CompetencyStatus;
  evidence: EvidenceEvent[];
  lastPracticedTs?: number;
  confidence?: 1 | 2 | 3 | 4 | 5;
  demonstrations: number; // count of distinct scenarios/labs demonstrating this
  demonstrationRefs: string[];
}

export const emptyRecord = (): CompetencyRecord => ({
  status: "not_introduced",
  evidence: [],
  demonstrations: 0,
  demonstrationRefs: [],
});

const RANK: Record<CompetencyStatus, number> = {
  not_introduced: 0,
  introduced: 1,
  practiced: 2,
  demonstrated: 3,
  mastered: 4,
  needs_reinforcement: 2, // between practiced and demonstrated for display
};

export function rankOf(s: CompetencyStatus): number {
  return RANK[s];
}

/**
 * Pure reducer: apply an evidence event to a competency record.
 * Rules:
 *  - lesson_opened -> at least introduced
 *  - quiz_passed (>=60%) or lab_completed -> at least practiced
 *  - scenario_ideal -> demonstrated; 2 distinct demonstrations -> mastered
 *  - scenario_failed or quiz_failed after mastered -> needs_reinforcement
 *  - never regress by an "opened" event
 */
export function applyEvidence(record: CompetencyRecord, event: EvidenceEvent): CompetencyRecord {
  const r: CompetencyRecord = {
    ...record,
    evidence: [...record.evidence.slice(-19), event],
    demonstrationRefs: [...record.demonstrationRefs],
  };
  const bumpIfLower = (target: CompetencyStatus) => {
    if (RANK[r.status] < RANK[target]) r.status = target;
  };

  switch (event.kind) {
    case "lesson_opened":
      bumpIfLower("introduced");
      break;
    case "quiz_passed":
      bumpIfLower("practiced");
      r.lastPracticedTs = event.ts;
      break;
    case "lab_completed":
      bumpIfLower("practiced");
      r.lastPracticedTs = event.ts;
      break;
    case "scenario_ideal":
      r.lastPracticedTs = event.ts;
      if (event.ref && !r.demonstrationRefs.includes(event.ref)) {
        r.demonstrationRefs.push(event.ref);
        r.demonstrations += 1;
      }
      if (r.demonstrations >= 2) r.status = "mastered";
      else bumpIfLower("demonstrated");
      break;
    case "scenario_partial":
      bumpIfLower("practiced");
      r.lastPracticedTs = event.ts;
      break;
    case "scenario_failed":
    case "quiz_failed":
      r.lastPracticedTs = event.ts;
      if (r.status === "mastered" || r.status === "demonstrated") {
        r.status = "needs_reinforcement";
      }
      break;
    case "capstone_touch":
      r.lastPracticedTs = event.ts;
      if (r.status === "demonstrated") r.status = "mastered";
      break;
  }
  return r;
}

/** After 30d of no practice, a mastered competency degrades to needs_reinforcement. */
export function decayIfStale(
  record: CompetencyRecord,
  now: number,
  staleMs = 30 * 24 * 60 * 60 * 1000,
): CompetencyRecord {
  if (record.status !== "mastered") return record;
  if (!record.lastPracticedTs) return record;
  if (now - record.lastPracticedTs < staleMs) return record;
  return { ...record, status: "needs_reinforcement" };
}

export const STATUS_LABEL: Record<CompetencyStatus, string> = {
  not_introduced: "Not introduced",
  introduced: "Introduced",
  practiced: "Practiced",
  demonstrated: "Demonstrated",
  mastered: "Mastered",
  needs_reinforcement: "Needs reinforcement",
};

export const STATUS_COLOR: Record<CompetencyStatus, string> = {
  not_introduced: "bg-muted text-muted-foreground border-border",
  introduced: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  practiced: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  demonstrated: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  mastered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  needs_reinforcement: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
};
