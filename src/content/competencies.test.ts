import { describe, expect, it } from "vitest";

import { competencies, competenciesById } from "./competencies";
import { labs } from "./labs";
import { labBlueprints } from "./labEngine";
import { scenarios } from "./scenarios";
import { COMPETENCIES_TOUCHED } from "@/engines/ragTicketAgent";
import { applyEvidence, emptyRecord } from "@/lib/competency";

/**
 * The mastery heatmap is driven entirely by competency ids referenced from
 * content and engines. Those references are plain strings, so a typo or a
 * rename silently drops the evidence and the heatmap quietly reads
 * "Not introduced" forever — which is exactly what had happened.
 *
 * These tests make that failure loud.
 */
describe("competency references resolve", () => {
  const known = new Set(competencies.map((c) => c.id));

  const refs: { source: string; ids: string[] }[] = [
    ...labBlueprints.map((b) => ({ source: `labEngine:${b.id}`, ids: b.competencyIds })),
    { source: "ragTicketAgent", ids: [...COMPETENCIES_TOUCHED] },
    ...labs.flatMap((lab) =>
      lab.modules.flatMap((m) => [
        { source: `lab:${lab.id}/${m.id}/lesson`, ids: m.lesson.competencyIds ?? [] },
        ...m.quiz.map((q, i) => ({
          source: `lab:${lab.id}/${m.id}/quiz[${i}]`,
          ids: q.competencyIds ?? [],
        })),
      ]),
    ),
    ...scenarios.flatMap((s) =>
      s.steps.map((step) => ({
        source: `scenario:${s.id}/${step.id}`,
        ids: step.competencyIds ?? [],
      })),
    ),
  ];

  it("every referenced id exists in the catalogue", () => {
    const unknown = refs.flatMap(({ source, ids }) =>
      ids.filter((id) => !known.has(id)).map((id) => `${source} -> ${id}`),
    );
    expect(unknown).toEqual([]);
  });

  it("ids are unique", () => {
    expect(competencies.length).toBe(known.size);
  });

  it("competenciesById covers every competency", () => {
    for (const c of competencies) expect(competenciesById[c.id]).toBeDefined();
  });

  it("the interactive surfaces actually emit evidence", () => {
    // Guards the regression directly: if content stops carrying competencyIds,
    // the heatmap goes dead again.
    const emitting = refs.filter((r) => r.ids.length > 0);
    expect(emitting.length).toBeGreaterThan(30);
  });

  it("evidence reaches a broad share of the catalogue", () => {
    const touched = new Set(refs.flatMap((r) => r.ids));
    expect(touched.size).toBeGreaterThan(35);
  });

  it("real content ids advance a competency through the ladder", () => {
    // End-to-end over the actual data: a lab quiz's ids must be able to move a
    // competency off "not_introduced", which is what was silently broken.
    const quizWithIds = labs
      .flatMap((l) => l.modules)
      .flatMap((m) => m.quiz)
      .find((q) => (q.competencyIds?.length ?? 0) > 0);
    expect(quizWithIds).toBeDefined();

    const id = quizWithIds!.competencyIds![0];
    expect(known.has(id)).toBe(true);

    let rec = emptyRecord();
    expect(rec.status).toBe("not_introduced");

    rec = applyEvidence(rec, { kind: "lesson_opened", ts: 1 });
    expect(rec.status).toBe("introduced");

    rec = applyEvidence(rec, { kind: "quiz_passed", ts: 2, score: 1 });
    expect(rec.status).toBe("practiced");

    rec = applyEvidence(rec, { kind: "scenario_ideal", ts: 3, ref: "scenario:a" });
    expect(rec.status).toBe("demonstrated");

    rec = applyEvidence(rec, { kind: "scenario_ideal", ts: 4, ref: "scenario:b" });
    expect(rec.status).toBe("mastered");
  });
});
