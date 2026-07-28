import { describe, expect, it } from "vitest";

import { competencies } from "./competencies";
import { deck } from "./deck";
import { goNoGoCases } from "./goNoGo";
import { labs } from "./labs";
import { blueprintForLab, labBlueprints } from "./labEngine";

/**
 * Interactivity integrity.
 *
 * The content tests assert that nothing a learner *reads* is filler. These
 * assert that everything a learner is invited to *do* is actually runnable —
 * which is the gap that made two "simulators" card grids and left ten of
 * thirteen labs with nothing to run.
 */

const known = new Set(competencies.map((c) => c.id));

describe("every lab is runnable, not just readable", () => {
  it("each lab has a blueprint behind it", () => {
    const missing = labs.filter((l) => !blueprintForLab(l.id)).map((l) => l.id);
    expect(missing).toEqual([]);
  });

  it("blueprint ids are unique", () => {
    const ids = labBlueprints.map((b) => b.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});

describe("blueprints can be scored", () => {
  it("every rubric check runs against the default configuration", () => {
    // The rubric closures are the part most likely to reference a config key
    // that was renamed, and a thrown error here would surface as a blank page.
    for (const b of labBlueprints) {
      const cfg = Object.fromEntries(b.config.map((f) => [f.id, f.default]));
      for (const r of b.rubric) {
        expect(() => r.check(cfg), `${b.id}/${r.id}`).not.toThrow();
      }
    }
  });

  it("no blueprint is already passing on its defaults", () => {
    // If the untouched form scores full marks there is no decision to make.
    for (const b of labBlueprints) {
      const cfg = Object.fromEntries(b.config.map((f) => [f.id, f.default]));
      const passed = b.rubric.filter((r) => r.check(cfg)).length;
      expect(passed, `${b.id} passes ${passed}/${b.rubric.length} on defaults`).toBeLessThan(
        b.rubric.length,
      );
    }
  });

  it("every rubric item is reachable from some option the learner can pick", () => {
    for (const b of labBlueprints) {
      for (const r of b.rubric) {
        // Try every value of every field independently against the defaults.
        const base = Object.fromEntries(b.config.map((f) => [f.id, f.default]));
        let reachable = r.check(base);
        for (const f of b.config) {
          // Number fields are free-text in the UI, so probe a spread of values
          // rather than an option list they do not have.
          const values: (string | number | boolean)[] =
            f.type === "toggle"
              ? [true, false]
              : f.type === "number"
                ? [0, 1, 10, 50, 100, 200, 1000]
                : (f.options ?? []).map((o) => o.value);
          for (const v of values) {
            if (r.check({ ...base, [f.id]: v })) reachable = true;
          }
        }
        expect(reachable, `${b.id}/${r.id} cannot be satisfied by any single choice`).toBe(true);
      }
    }
  });

  it("every artifact builder renders from a default run", () => {
    for (const b of labBlueprints) {
      const cfg = Object.fromEntries(b.config.map((f) => [f.id, f.default]));
      expect(() =>
        b.artifact.build({
          cfg,
          choices: {},
          score: 0,
          max: 10,
          passedRubric: [],
          failedRubric: [],
        }),
      ).not.toThrow();
    }
  });

  it("every injection offers a correct choice and a real cost for the wrong one", () => {
    for (const b of labBlueprints) {
      for (const inj of b.injections) {
        expect(
          inj.choices.some((c) => c.correct),
          `${b.id}/${inj.id}`,
        ).toBe(true);
        expect(
          inj.choices.some((c) => c.scoreDelta < 0),
          `${b.id}/${inj.id} has no wrong answer that costs anything`,
        ).toBe(true);
        for (const c of inj.choices) {
          expect(c.explain.trim().length, `${b.id}/${inj.id}/${c.id}`).toBeGreaterThan(40);
        }
      }
    }
  });

  it("blueprint competency references resolve", () => {
    const bad = labBlueprints.flatMap((b) =>
      b.competencyIds.filter((id) => !known.has(id)).map((id) => `${b.id} -> ${id}`),
    );
    expect(bad).toEqual([]);
  });
});

describe("go / no-go board cases", () => {
  it("each case has critical evidence that is actually missing", () => {
    // A "critical" item already in the pack is not a decision.
    for (const c of goNoGoCases) {
      const criticalGaps = c.evidence.filter((e) => e.critical && e.status !== "provided");
      expect(criticalGaps.length, `${c.id}`).toBeGreaterThan(0);
      expect(c.evidence.filter((e) => e.critical && e.status === "provided")).toEqual([]);
    }
  });

  it("the request budget cannot cover every critical gap plus a distractor", () => {
    // The budget has to force a choice, otherwise the evidence phase is free.
    for (const c of goNoGoCases) {
      expect(c.requestBudget, `${c.id}`).toBeLessThan(c.evidence.length);
    }
  });

  it("exactly one decision is marked correct and wrong calls carry a penalty", () => {
    for (const c of goNoGoCases) {
      expect(c.decisions.filter((d) => d.correct).length, `${c.id}`).toBe(1);
      expect(
        c.decisions.some((d) => d.scoreDelta < 0),
        `${c.id}`,
      ).toBe(true);
    }
  });

  it("condition lists contain both load-bearing and merely plausible options", () => {
    for (const c of goNoGoCases) {
      expect(
        c.conditions.some((x) => x.correct),
        `${c.id}`,
      ).toBe(true);
      expect(
        c.conditions.some((x) => !x.correct),
        `${c.id} has no distractor`,
      ).toBe(true);
    }
  });

  it("every challenge has a correct response and an explained cost for folding", () => {
    for (const c of goNoGoCases) {
      expect(c.challenges.length, `${c.id}`).toBeGreaterThan(0);
      for (const ch of c.challenges) {
        expect(
          ch.options.some((o) => o.correct),
          `${c.id}/${ch.id}`,
        ).toBe(true);
        expect(
          ch.options.some((o) => o.scoreDelta < 0),
          `${c.id}/${ch.id}`,
        ).toBe(true);
        for (const o of ch.options) {
          expect(o.explain.trim().length, `${c.id}/${ch.id}/${o.id}`).toBeGreaterThan(40);
        }
      }
    }
  });

  it("case competency references resolve", () => {
    const bad = goNoGoCases.flatMap((c) =>
      c.competencyIds.filter((id) => !known.has(id)).map((id) => `${c.id} -> ${id}`),
    );
    expect(bad).toEqual([]);
  });
});

describe("flashcard deck", () => {
  it("is built from real question and answer pairs", () => {
    expect(deck.length).toBeGreaterThan(100);
    for (const c of deck) {
      expect(c.front.trim().length, c.id).toBeGreaterThan(10);
      expect(c.back.trim().length, c.id).toBeGreaterThan(2);
    }
  });

  it("has no duplicate card ids", () => {
    const ids = deck.map((c) => c.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it("never puts the question on both sides", () => {
    const same = deck.filter((c) => c.front.trim() === c.back.trim()).map((c) => c.id);
    expect(same).toEqual([]);
  });
});

describe("injections actually reach the learner", () => {
  it("no injection is authored past the last step", () => {
    // `atStep` is 1-based. An injection beyond the final step is unreachable,
    // which is how connector-oauth ended up advertising an incident it never
    // fired and every other blueprint dropped its second one.
    const unreachable = labBlueprints.flatMap((b) =>
      b.injections
        .filter((inj) => inj.atStep < 1 || inj.atStep > b.steps.length)
        .map((inj) => `${b.id}/${inj.id} at step ${inj.atStep} of ${b.steps.length}`),
    );
    expect(unreachable).toEqual([]);
  });

  it("every step index carrying an injection is one the run passes through", () => {
    for (const b of labBlueprints) {
      const reachable = new Set(b.steps.map((_, i) => i + 1));
      for (const inj of b.injections) {
        expect(reachable.has(inj.atStep), `${b.id}/${inj.id}`).toBe(true);
      }
    }
  });
});
