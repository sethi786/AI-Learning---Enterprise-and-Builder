import { useSyncExternalStore } from "react";
import type { MasteryDomain, RoleId, CompetencyId } from "@/content/types";
import {
  applyEvidence,
  emptyRecord,
  type CompetencyRecord,
  type EvidenceEvent,
  type EvidenceKind,
} from "@/lib/competency";

const KEY = "eaicls:v1:progress";
const SCHEMA_VERSION = 2;

export interface ProgressState {
  schemaVersion: number;
  completedLessons: Record<string, number>; // id -> timestamp
  quizResults: Record<string, { correct: number; total: number; ts: number }>;
  scenarioAttempts: Record<
    string,
    { steps: Record<string, string>; decision?: string; score: number; ts: number }
  >;
  notes: { id: string; title: string; body: string; ts: number }[];
  artifacts: {
    id: string;
    templateId: string;
    name: string;
    values: Record<string, string | string[]>;
    ts: number;
  }[];
  currentRole: RoleId;
  masteryPoints: Record<MasteryDomain, number>;
  lastVisited: string[];
  competencies: Record<CompetencyId, CompetencyRecord>;
  incidentAttempts: Record<string, { score: number; ts: number }>;
  capstoneAttempts: Record<string, { score: number; ts: number; artifactIds: string[] }>;
  diagnosticResult?: { ts: number; byCompetency: Record<CompetencyId, number> };
}

const empty: ProgressState = {
  schemaVersion: SCHEMA_VERSION,
  completedLessons: {},
  quizResults: {},
  scenarioAttempts: {},
  notes: [],
  artifacts: [],
  currentRole: "platform-admin",
  masteryPoints: {
    platform: 0,
    security: 0,
    privacy_legal_risk: 0,
    architecture: 0,
    agent_rag_connector: 0,
    governance_grc: 0,
    ops: 0,
  },
  lastVisited: [],
  competencies: {},
  incidentAttempts: {},
  capstoneAttempts: {},
};

let state: ProgressState = empty;
let hydrated = false;
const listeners = new Set<() => void>();

function migrate(raw: Record<string, unknown>): ProgressState {
  const merged: ProgressState = { ...empty, ...(raw as Partial<ProgressState>) };
  merged.schemaVersion = SCHEMA_VERSION;
  merged.competencies = merged.competencies ?? {};
  merged.incidentAttempts = merged.incidentAttempts ?? {};
  merged.capstoneAttempts = merged.capstoneAttempts ?? {};
  return merged;
}

function load() {
  if (hydrated || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = migrate(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  hydrated = true;
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return empty;
}

export function useProgress() {
  load();
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function update(fn: (s: ProgressState) => ProgressState) {
  load();
  state = fn(state);
  persist();
  emit();
}

function recordEvidenceInto(
  s: ProgressState,
  competencyIds: string[] | undefined,
  kind: EvidenceKind,
  ref?: string,
  score?: number,
): ProgressState {
  if (!competencyIds || !competencyIds.length) return s;
  const ts = Date.now();
  const nextComp: Record<string, CompetencyRecord> = { ...s.competencies };
  const event: EvidenceEvent = { kind, ts, ref, score };
  for (const id of competencyIds) {
    const cur = nextComp[id] ?? emptyRecord();
    nextComp[id] = applyEvidence(cur, event);
  }
  return { ...s, competencies: nextComp };
}

export const progress = {
  completeLesson(id: string, domain?: MasteryDomain, competencyIds?: string[]) {
    update((s) => {
      if (s.completedLessons[id]) return s;
      const mp = { ...s.masteryPoints };
      if (domain) mp[domain] = (mp[domain] ?? 0) + 2;
      let next: ProgressState = {
        ...s,
        completedLessons: { ...s.completedLessons, [id]: Date.now() },
        masteryPoints: mp,
      };
      next = recordEvidenceInto(next, competencyIds, "lesson_opened", id);
      return next;
    });
  },
  recordQuiz(
    id: string,
    correct: number,
    total: number,
    domain?: MasteryDomain,
    competencyIds?: string[],
  ) {
    update((s) => {
      const mp = { ...s.masteryPoints };
      if (domain) mp[domain] = (mp[domain] ?? 0) + correct;
      let next: ProgressState = {
        ...s,
        quizResults: { ...s.quizResults, [id]: { correct, total, ts: Date.now() } },
        masteryPoints: mp,
      };
      const ratio = total > 0 ? correct / total : 0;
      const kind: EvidenceKind = ratio >= 0.6 ? "quiz_passed" : "quiz_failed";
      next = recordEvidenceInto(next, competencyIds, kind, id, ratio);
      return next;
    });
  },
  saveScenario(
    id: string,
    steps: Record<string, string>,
    decision: string | undefined,
    score: number,
    domain?: MasteryDomain,
    competencyIds?: string[],
    outcome?: "ideal" | "partial" | "failed",
  ) {
    update((s) => {
      const mp = { ...s.masteryPoints };
      if (domain) mp[domain] = (mp[domain] ?? 0) + score;
      let next: ProgressState = {
        ...s,
        scenarioAttempts: {
          ...s.scenarioAttempts,
          [id]: { steps, decision, score, ts: Date.now() },
        },
        masteryPoints: mp,
      };
      const kind: EvidenceKind =
        outcome === "ideal" ? "scenario_ideal" : outcome === "failed" ? "scenario_failed" : "scenario_partial";
      next = recordEvidenceInto(next, competencyIds, kind, id);
      return next;
    });
  },
  recordEvidence(competencyIds: string[], kind: EvidenceKind, ref?: string, score?: number) {
    update((s) => recordEvidenceInto(s, competencyIds, kind, ref, score));
  },
  saveDiagnostic(byCompetency: Record<string, number>) {
    update((s) => ({
      ...s,
      diagnosticResult: { ts: Date.now(), byCompetency },
    }));
  },
  addNote(title: string, body: string) {
    update((s) => ({
      ...s,
      notes: [
        { id: crypto.randomUUID(), title, body, ts: Date.now() },
        ...s.notes,
      ],
    }));
  },
  updateNote(id: string, title: string, body: string) {
    update((s) => ({
      ...s,
      notes: s.notes.map((n) => (n.id === id ? { ...n, title, body, ts: Date.now() } : n)),
    }));
  },
  deleteNote(id: string) {
    update((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  },
  saveArtifact(
    templateId: string,
    name: string,
    values: Record<string, string | string[]>,
  ) {
    update((s) => ({
      ...s,
      artifacts: [
        {
          id: crypto.randomUUID(),
          templateId,
          name,
          values,
          ts: Date.now(),
        },
        ...s.artifacts,
      ],
    }));
  },
  deleteArtifact(id: string) {
    update((s) => ({ ...s, artifacts: s.artifacts.filter((a) => a.id !== id) }));
  },
  setCurrentRole(role: RoleId) {
    update((s) => ({ ...s, currentRole: role }));
  },
  touch(path: string) {
    update((s) => ({
      ...s,
      lastVisited: [path, ...s.lastVisited.filter((p) => p !== path)].slice(0, 12),
    }));
  },
  reset() {
    update(() => empty);
  },
  exportJson() {
    return JSON.stringify(state, null, 2);
  },
  exportNotesMarkdown() {
    return state.notes
      .map(
        (n) =>
          `# ${n.title}\n\n_${new Date(n.ts).toLocaleString()}_\n\n${n.body}\n\n---\n`,
      )
      .join("\n");
  },
};

export function domainScore(s: ProgressState, d: MasteryDomain) {
  const pts = s.masteryPoints[d] ?? 0;
  return Math.min(100, Math.round((pts / 40) * 100));
}

export function roleProgress(
  s: ProgressState,
  lessonIds: string[],
  quizIds: string[],
  scenarioIds: string[],
) {
  const total = lessonIds.length + quizIds.length + scenarioIds.length;
  if (total === 0) return 0;
  const done =
    lessonIds.filter((id) => s.completedLessons[id]).length +
    quizIds.filter((id) => s.quizResults[id]).length +
    scenarioIds.filter((id) => s.scenarioAttempts[id]).length;
  return Math.round((done / total) * 100);
}