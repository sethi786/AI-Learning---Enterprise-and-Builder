import { describe, expect, it } from "vitest";

import { mergeProgress } from "./progressMerge";
import type { ProgressState } from "./progress";

const base = (over: Partial<ProgressState> = {}): ProgressState =>
  ({
    schemaVersion: 2,
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
    ...over,
  }) as ProgressState;

describe("mergeProgress", () => {
  it("keeps work from both sides", () => {
    const local = base({ completedLessons: { "rag:rag-basics": 100 } });
    const remote = base({ completedLessons: { "agent:kill-switch": 200 } });
    const m = mergeProgress(local, remote);
    expect(Object.keys(m.completedLessons).sort()).toEqual(["agent:kill-switch", "rag:rag-basics"]);
  });

  it("keeps the earliest completion timestamp", () => {
    const m = mergeProgress(
      base({ completedLessons: { x: 500 } }),
      base({ completedLessons: { x: 100 } }),
    );
    expect(m.completedLessons.x).toBe(100);
  });

  it("keeps the better quiz score", () => {
    const local = base({ quizResults: { q: { correct: 1, total: 4, ts: 1 } } });
    const remote = base({ quizResults: { q: { correct: 3, total: 4, ts: 2 } } });
    expect(mergeProgress(local, remote).quizResults.q.correct).toBe(3);
    // and is order-independent
    expect(mergeProgress(remote, local).quizResults.q.correct).toBe(3);
  });

  it("takes the higher mastery points per domain", () => {
    const local = base({ masteryPoints: { ...base().masteryPoints, security: 10 } });
    const remote = base({ masteryPoints: { ...base().masteryPoints, security: 4, platform: 7 } });
    const m = mergeProgress(local, remote);
    expect(m.masteryPoints.security).toBe(10);
    expect(m.masteryPoints.platform).toBe(7);
  });

  it("promotes a competency to the higher rung and unions demonstrations", () => {
    const rec = (status: string, refs: string[]) => ({
      status,
      demonstrations: refs.length,
      demonstrationRefs: refs,
      evidence: [],
      lastPracticedTs: 1,
    });
    const local = base({ competencies: { "arch.rag": rec("practiced", ["s1"]) } as never });
    const remote = base({ competencies: { "arch.rag": rec("demonstrated", ["s2"]) } as never });
    const m = mergeProgress(local, remote);
    expect(m.competencies["arch.rag"].status).toBe("demonstrated");
    expect(m.competencies["arch.rag"].demonstrationRefs.sort()).toEqual(["s1", "s2"]);
  });

  it("never moves a learner backwards", () => {
    const rec = {
      status: "mastered",
      demonstrations: 2,
      demonstrationRefs: ["a", "b"],
      evidence: [],
      lastPracticedTs: 5,
    };
    const ahead = base({ competencies: { c: rec } as never });
    const behind = base();
    expect(mergeProgress(ahead, behind).competencies.c.status).toBe("mastered");
    expect(mergeProgress(behind, ahead).competencies.c.status).toBe("mastered");
  });

  it("dedupes notes by id, keeping the newer edit", () => {
    const local = base({ notes: [{ id: "n1", title: "old", body: "a", ts: 1 }] });
    const remote = base({ notes: [{ id: "n1", title: "new", body: "b", ts: 9 }] });
    const m = mergeProgress(local, remote);
    expect(m.notes).toHaveLength(1);
    expect(m.notes[0].title).toBe("new");
  });

  it("is idempotent", () => {
    const local = base({
      completedLessons: { a: 1 },
      quizResults: { q: { correct: 2, total: 3, ts: 4 } },
    });
    const once = mergeProgress(local, base());
    expect(mergeProgress(once, once)).toEqual(once);
  });
});
